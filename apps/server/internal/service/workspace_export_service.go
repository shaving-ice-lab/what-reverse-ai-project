package service

import (
	"archive/zip"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/agentflow/server/internal/config"
	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/pkg/logger"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
)

const (
	defaultExportWorkerInterval = 30 * time.Second
	defaultMaxJobsPerTick       = 3
)

// WorkspaceExportDownload 导出下载信息
type WorkspaceExportDownload struct {
	FilePath string
	FileName string
}

// WorkspaceExportService 导出任务服务接口
type WorkspaceExportService interface {
	RequestExport(ctx context.Context, workspaceID, userID uuid.UUID) (*entity.WorkspaceExportJob, error)
	GetJob(ctx context.Context, workspaceID, jobID, userID uuid.UUID) (*entity.WorkspaceExportJob, error)
	Download(ctx context.Context, workspaceID, jobID, userID uuid.UUID) (*WorkspaceExportDownload, error)
	RunWorker(ctx context.Context)
}

type workspaceExportService struct {
	repo             repository.WorkspaceExportRepository
	workspaceRepo    repository.WorkspaceRepository
	memberRepo       repository.WorkspaceMemberRepository
	appRepo          repository.AppRepository
	workflowRepo     repository.WorkflowRepository
	executionRepo    repository.ExecutionRepository
	auditLogRepo     repository.AuditLogRepository
	workspaceService WorkspaceService
	cfg              config.ArchiveConfig
	log              logger.Logger
}

// NewWorkspaceExportService 创建导出任务服务
func NewWorkspaceExportService(
	repo repository.WorkspaceExportRepository,
	workspaceRepo repository.WorkspaceRepository,
	memberRepo repository.WorkspaceMemberRepository,
	appRepo repository.AppRepository,
	workflowRepo repository.WorkflowRepository,
	executionRepo repository.ExecutionRepository,
	auditLogRepo repository.AuditLogRepository,
	workspaceService WorkspaceService,
	cfg config.ArchiveConfig,
	log logger.Logger,
) WorkspaceExportService {
	return &workspaceExportService{
		repo:             repo,
		workspaceRepo:    workspaceRepo,
		memberRepo:       memberRepo,
		appRepo:          appRepo,
		workflowRepo:     workflowRepo,
		executionRepo:    executionRepo,
		auditLogRepo:     auditLogRepo,
		workspaceService: workspaceService,
		cfg:              cfg,
		log:              log,
	}
}

func (s *workspaceExportService) RequestExport(ctx context.Context, workspaceID, userID uuid.UUID) (*entity.WorkspaceExportJob, error) {
	if !s.cfg.Enabled {
		return nil, ErrWorkspaceExportDisabled
	}
	if s.workspaceService == nil {
		return nil, ErrWorkspaceExportUnavailable
	}
	access, err := s.workspaceService.GetWorkspaceAccess(ctx, workspaceID, userID)
	if err != nil {
		return nil, err
	}
	if !access.IsOwner && !hasPermission(access.Permissions, PermissionWorkspaceAdmin) {
		return nil, ErrWorkspaceUnauthorized
	}

	var expiresAt *time.Time
	if s.cfg.ExportRetentionDays > 0 {
		t := time.Now().AddDate(0, 0, s.cfg.ExportRetentionDays)
		expiresAt = &t
	}

	job := &entity.WorkspaceExportJob{
		WorkspaceID: workspaceID,
		RequestedBy: &userID,
		ExportType:  entity.WorkspaceExportTypeUserExport,
		Status:      entity.WorkspaceExportStatusPending,
		ExpiresAt:   expiresAt,
	}
	if err := s.repo.Create(ctx, job); err != nil {
		return nil, err
	}

	return job, nil
}

func (s *workspaceExportService) GetJob(ctx context.Context, workspaceID, jobID, userID uuid.UUID) (*entity.WorkspaceExportJob, error) {
	if s.workspaceService == nil {
		return nil, ErrWorkspaceExportUnavailable
	}
	access, err := s.workspaceService.GetWorkspaceAccess(ctx, workspaceID, userID)
	if err != nil {
		return nil, err
	}
	if !access.IsOwner && !hasPermission(access.Permissions, PermissionWorkspaceAdmin) {
		return nil, ErrWorkspaceUnauthorized
	}

	job, err := s.repo.GetByIDAndWorkspace(ctx, jobID, workspaceID)
	if err != nil {
		return nil, err
	}
	if job == nil {
		return nil, ErrWorkspaceExportNotFound
	}
	return job, nil
}

func (s *workspaceExportService) Download(ctx context.Context, workspaceID, jobID, userID uuid.UUID) (*WorkspaceExportDownload, error) {
	job, err := s.GetJob(ctx, workspaceID, jobID, userID)
	if err != nil {
		return nil, err
	}
	if job.Status != entity.WorkspaceExportStatusCompleted {
		return nil, ErrWorkspaceExportNotReady
	}
	if job.ExpiresAt != nil && time.Now().After(*job.ExpiresAt) {
		return nil, ErrWorkspaceExportExpired
	}
	if job.FilePath == nil || strings.TrimSpace(*job.FilePath) == "" {
		return nil, ErrWorkspaceExportUnavailable
	}
	if _, err := os.Stat(*job.FilePath); err != nil {
		return nil, ErrWorkspaceExportUnavailable
	}
	fileName := "workspace-export.zip"
	if job.FileName != nil && strings.TrimSpace(*job.FileName) != "" {
		fileName = *job.FileName
	}
	return &WorkspaceExportDownload{
		FilePath: *job.FilePath,
		FileName: fileName,
	}, nil
}

func (s *workspaceExportService) RunWorker(ctx context.Context) {
	if !s.cfg.Enabled {
		s.log.Info("Workspace export worker disabled")
		return
	}
	interval := s.cfg.WorkerInterval
	if interval <= 0 {
		interval = defaultExportWorkerInterval
	}

	if err := s.ensureBasePath(); err != nil {
		s.log.Warn("Workspace export base path error", "error", err)
	}

	if err := s.processPendingJobs(ctx); err != nil {
		s.log.Warn("Workspace export initial processing failed", "error", err)
	}

	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if err := s.processPendingJobs(ctx); err != nil {
				s.log.Warn("Workspace export processing failed", "error", err)
			}
		}
	}
}

func (s *workspaceExportService) processPendingJobs(ctx context.Context) error {
	limit := s.cfg.MaxJobsPerTick
	if limit <= 0 {
		limit = defaultMaxJobsPerTick
	}
	jobs, err := s.repo.ListPending(ctx, limit)
	if err != nil {
		return err
	}
	for _, job := range jobs {
		if err := s.handleJob(ctx, &job); err != nil {
			s.log.Warn("Workspace export job failed", "job_id", job.ID, "error", err)
		}
	}
	return nil
}

func (s *workspaceExportService) handleJob(ctx context.Context, job *entity.WorkspaceExportJob) error {
	if job == nil {
		return nil
	}
	if err := s.repo.SetProcessing(ctx, job.ID); err != nil {
		return err
	}

	var (
		filePath string
		fileName string
		fileSize int64
		checksum string
		err      error
	)
	switch job.ExportType {
	case entity.WorkspaceExportTypeUserExport, entity.WorkspaceExportTypeColdStorage:
		var exportData *WorkspaceDataExport
		if job.RequestedBy != nil && s.workspaceService != nil {
			exportData, err = s.workspaceService.ExportData(ctx, job.WorkspaceID, *job.RequestedBy)
		} else {
			exportData, err = s.buildExportDataSystem(ctx, job.WorkspaceID)
		}
		if err != nil {
			_ = s.repo.SetFailed(ctx, job.ID, err.Error())
			return err
		}
		filePath, fileName, fileSize, checksum, err = s.writeExportPackage(exportData, job.ID, job.ExportType)
	case entity.WorkspaceExportTypeExecutionLogArchive, entity.WorkspaceExportTypeAuditLogArchive:
		filePath, fileName, fileSize, checksum, err = s.writeLogArchivePackage(ctx, job)
	default:
		err = errors.New("unsupported export type")
	}
	if err != nil {
		_ = s.repo.SetFailed(ctx, job.ID, err.Error())
		return err
	}

	if err := s.repo.SetCompleted(ctx, job.ID, fileName, filePath, fileSize, checksum, job.ExpiresAt); err != nil {
		return err
	}
	if job.ExportType == entity.WorkspaceExportTypeExecutionLogArchive || job.ExportType == entity.WorkspaceExportTypeAuditLogArchive {
		if cleanupErr := s.cleanupArchivedLogs(ctx, job); cleanupErr != nil {
			s.log.Warn("Log archive cleanup failed", "job_id", job.ID, "error", cleanupErr)
		}
	}
	return nil
}

func (s *workspaceExportService) buildExportDataSystem(ctx context.Context, workspaceID uuid.UUID) (*WorkspaceDataExport, error) {
	workspace, err := s.workspaceRepo.GetByIDUnscoped(ctx, workspaceID)
	if err != nil || workspace == nil {
		return nil, ErrWorkspaceNotFound
	}
	members, err := s.memberRepo.ListByWorkspaceID(ctx, workspaceID)
	if err != nil {
		return nil, err
	}
	apps, err := s.appRepo.ListByWorkspaceID(ctx, workspaceID)
	if err != nil {
		return nil, err
	}
	workflows, err := s.workflowRepo.ListByWorkspaceID(ctx, workspaceID)
	if err != nil {
		return nil, err
	}

	return &WorkspaceDataExport{
		Version:    "1.0.0",
		ExportedAt: time.Now().Format(time.RFC3339),
		Workspace:  workspace,
		Members:    members,
		Apps:       apps,
		Workflows:  workflows,
	}, nil
}

func (s *workspaceExportService) writeExportPackage(exportData *WorkspaceDataExport, jobID uuid.UUID, exportType entity.WorkspaceExportJobType) (string, string, int64, string, error) {
	if exportData == nil || exportData.Workspace == nil {
		return "", "", 0, "", errors.New("export data is empty")
	}
	if err := s.ensureBasePath(); err != nil {
		return "", "", 0, "", err
	}

	basePath := strings.TrimSpace(s.cfg.BasePath)
	if basePath == "" {
		basePath = "./data/exports"
	}
	workspaceName := exportData.Workspace.Slug
	if workspaceName == "" {
		workspaceName = exportData.Workspace.Name
	}
	safeName := sanitizeFilename(workspaceName)
	if safeName == "" {
		safeName = "workspace"
	}
	fileName := fmt.Sprintf("%s-%s.zip", safeName, jobID.String())
	finalPath := filepath.Join(basePath, fileName)

	tmpFile, err := os.CreateTemp(basePath, "workspace-export-*.zip")
	if err != nil {
		return "", "", 0, "", err
	}
	defer func() {
		_ = tmpFile.Close()
	}()

	zipWriter := zip.NewWriter(tmpFile)
	if err := writeZipJSON(zipWriter, "workspace.json", exportData); err != nil {
		_ = zipWriter.Close()
		return "", "", 0, "", err
	}

	manifest := map[string]interface{}{
		"export_id":    jobID.String(),
		"workspace_id": exportData.Workspace.ID.String(),
		"export_type":  string(exportType),
		"exported_at":  exportData.ExportedAt,
		"version":      exportData.Version,
	}
	if err := writeZipJSON(zipWriter, "manifest.json", manifest); err != nil {
		_ = zipWriter.Close()
		return "", "", 0, "", err
	}

	if err := zipWriter.Close(); err != nil {
		return "", "", 0, "", err
	}
	if err := tmpFile.Close(); err != nil {
		return "", "", 0, "", err
	}

	if err := os.Rename(tmpFile.Name(), finalPath); err != nil {
		return "", "", 0, "", err
	}

	stat, err := os.Stat(finalPath)
	if err != nil {
		return "", "", 0, "", err
	}
	checksum, err := sha256File(finalPath)
	if err != nil {
		return "", "", 0, "", err
	}

	return finalPath, fileName, stat.Size(), checksum, nil
}

func (s *workspaceExportService) ensureBasePath() error {
	basePath := strings.TrimSpace(s.cfg.BasePath)
	if basePath == "" {
		basePath = "./data/exports"
	}
	return os.MkdirAll(basePath, 0o755)
}

func writeZipJSON(writer *zip.Writer, name string, payload interface{}) error {
	data, err := json.MarshalIndent(payload, "", "  ")
	if err != nil {
		return err
	}
	file, err := writer.Create(name)
	if err != nil {
		return err
	}
	_, err = file.Write(data)
	return err
}

func sha256File(path string) (string, error) {
	file, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer file.Close()

	hash := sha256.New()
	if _, err := io.Copy(hash, file); err != nil {
		return "", err
	}
	return hex.EncodeToString(hash.Sum(nil)), nil
}

func sanitizeFilename(value string) string {
	trimmed := strings.TrimSpace(strings.ToLower(value))
	if trimmed == "" {
		return ""
	}
	var builder strings.Builder
	for _, r := range trimmed {
		switch {
		case r >= 'a' && r <= 'z':
			builder.WriteRune(r)
		case r >= '0' && r <= '9':
			builder.WriteRune(r)
		case r == '-' || r == '_':
			builder.WriteRune(r)
		case r == ' ':
			builder.WriteRune('-')
		}
	}
	result := strings.Trim(builder.String(), "-_")
	return result
}

var (
	ErrWorkspaceExportNotFound = errors.New("workspace export not found")
	ErrWorkspaceExportNotReady = errors.New("workspace export not ready")
	ErrWorkspaceExportExpired  = errors.New("workspace export expired")
	ErrWorkspaceExportDisabled = errors.New("workspace export disabled")
)
