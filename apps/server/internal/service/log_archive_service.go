package service

import (
	"archive/zip"
	"bufio"
	"context"
	"encoding/json"
	"errors"
	"io"
	"os"
	"sort"
	"strings"
	"time"

	"github.com/agentflow/server/internal/config"
	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
)

var (
	ErrLogArchiveDisabled       = errors.New("log archive disabled")
	ErrLogArchiveNotFound       = errors.New("log archive not found")
	ErrLogArchiveNotReady       = errors.New("log archive not ready")
	ErrLogArchiveExpired        = errors.New("log archive expired")
	ErrLogArchiveInvalidRange   = errors.New("log archive range invalid")
	ErrLogArchiveUnsupported    = errors.New("log archive type unsupported")
	ErrLogArchiveDatasetInvalid = errors.New("log archive dataset invalid")
)

type LogArchiveService interface {
	RequestArchive(ctx context.Context, workspaceID, userID uuid.UUID, req LogArchiveRequest) (*entity.WorkspaceExportJob, error)
	ListArchives(ctx context.Context, workspaceID, userID uuid.UUID, params LogArchiveListParams) ([]entity.WorkspaceExportJob, error)
	GetArchive(ctx context.Context, workspaceID, archiveID, userID uuid.UUID) (*entity.WorkspaceExportJob, error)
	Download(ctx context.Context, workspaceID, archiveID, userID uuid.UUID) (*WorkspaceExportDownload, error)
	Replay(ctx context.Context, workspaceID, archiveID, userID uuid.UUID, params LogArchiveReplayParams) (*LogArchiveReplayResult, error)
	DeleteArchive(ctx context.Context, workspaceID, archiveID, userID uuid.UUID) error
}

type logArchiveService struct {
	repo             repository.WorkspaceExportRepository
	workspaceService WorkspaceService
	cfg              config.ArchiveConfig
}

type LogArchiveRequest struct {
	ArchiveType string     `json:"archive_type"`
	RangeStart  *time.Time `json:"range_start,omitempty"`
	RangeEnd    *time.Time `json:"range_end,omitempty"`
}

type LogArchiveListParams struct {
	ArchiveType string
}

type LogArchiveReplayParams struct {
	Dataset     string
	From        *time.Time
	To          *time.Time
	Limit       int
	Offset      int
	ExecutionID *uuid.UUID
	Action      string
	ActorUserID *uuid.UUID
	TargetType  string
	TargetID    *uuid.UUID
	WorkflowID  *uuid.UUID
	UserID      *uuid.UUID
	NodeID      string
	NodeType    string
	Status      string
}

type LogArchiveReplayResult struct {
	Records    []map[string]interface{} `json:"records"`
	NextOffset *int                     `json:"next_offset,omitempty"`
}

func NewLogArchiveService(repo repository.WorkspaceExportRepository, workspaceService WorkspaceService, cfg config.ArchiveConfig) LogArchiveService {
	return &logArchiveService{
		repo:             repo,
		workspaceService: workspaceService,
		cfg:              cfg,
	}
}

func (s *logArchiveService) RequestArchive(ctx context.Context, workspaceID, userID uuid.UUID, req LogArchiveRequest) (*entity.WorkspaceExportJob, error) {
	if !s.cfg.LogArchiveEnabled {
		return nil, ErrLogArchiveDisabled
	}
	if s.repo == nil || s.workspaceService == nil {
		return nil, ErrWorkspaceExportUnavailable
	}
	if err := s.requireWorkspaceAdmin(ctx, workspaceID, userID); err != nil {
		return nil, err
	}
	archiveType, err := parseLogArchiveType(req.ArchiveType)
	if err != nil {
		return nil, err
	}
	rangeStart, rangeEnd, err := s.resolveArchiveRange(req.RangeStart, req.RangeEnd)
	if err != nil {
		return nil, err
	}
	exists, err := s.repo.ExistsByWorkspaceTypeAndRange(ctx, workspaceID, archiveType, rangeStart, rangeEnd)
	if err != nil {
		return nil, err
	}
	if exists {
		jobs, err := s.repo.ListByWorkspaceAndType(ctx, workspaceID, archiveType)
		if err != nil {
			return nil, err
		}
		for _, job := range jobs {
			if job.ArchiveRangeStart == nil || job.ArchiveRangeEnd == nil {
				continue
			}
			if job.ArchiveRangeStart.Equal(rangeStart) && job.ArchiveRangeEnd.Equal(rangeEnd) {
				return &job, nil
			}
		}
	}

	var expiresAt *time.Time
	if s.cfg.LogArchiveRetentionDays > 0 {
		t := time.Now().AddDate(0, 0, s.cfg.LogArchiveRetentionDays)
		expiresAt = &t
	}
	job := &entity.WorkspaceExportJob{
		WorkspaceID:       workspaceID,
		RequestedBy:       &userID,
		ExportType:        archiveType,
		Status:            entity.WorkspaceExportStatusPending,
		ExpiresAt:         expiresAt,
		ArchiveRangeStart: &rangeStart,
		ArchiveRangeEnd:   &rangeEnd,
	}
	if err := s.repo.Create(ctx, job); err != nil {
		return nil, err
	}
	return job, nil
}

func (s *logArchiveService) ListArchives(ctx context.Context, workspaceID, userID uuid.UUID, params LogArchiveListParams) ([]entity.WorkspaceExportJob, error) {
	if s.repo == nil || s.workspaceService == nil {
		return nil, ErrWorkspaceExportUnavailable
	}
	if err := s.requireWorkspaceAdmin(ctx, workspaceID, userID); err != nil {
		return nil, err
	}
	if params.ArchiveType != "" {
		archiveType, err := parseLogArchiveType(params.ArchiveType)
		if err != nil {
			return nil, err
		}
		return s.repo.ListByWorkspaceAndType(ctx, workspaceID, archiveType)
	}
	executionJobs, err := s.repo.ListByWorkspaceAndType(ctx, workspaceID, entity.WorkspaceExportTypeExecutionLogArchive)
	if err != nil {
		return nil, err
	}
	auditJobs, err := s.repo.ListByWorkspaceAndType(ctx, workspaceID, entity.WorkspaceExportTypeAuditLogArchive)
	if err != nil {
		return nil, err
	}
	jobs := append(executionJobs, auditJobs...)
	sort.Slice(jobs, func(i, j int) bool {
		return jobs[i].CreatedAt.After(jobs[j].CreatedAt)
	})
	return jobs, nil
}

func (s *logArchiveService) GetArchive(ctx context.Context, workspaceID, archiveID, userID uuid.UUID) (*entity.WorkspaceExportJob, error) {
	if s.repo == nil || s.workspaceService == nil {
		return nil, ErrWorkspaceExportUnavailable
	}
	if err := s.requireWorkspaceAdmin(ctx, workspaceID, userID); err != nil {
		return nil, err
	}
	job, err := s.repo.GetByIDAndWorkspace(ctx, archiveID, workspaceID)
	if err != nil {
		return nil, err
	}
	if job == nil || !isLogArchiveType(job.ExportType) {
		return nil, ErrLogArchiveNotFound
	}
	return job, nil
}

func (s *logArchiveService) Download(ctx context.Context, workspaceID, archiveID, userID uuid.UUID) (*WorkspaceExportDownload, error) {
	job, err := s.GetArchive(ctx, workspaceID, archiveID, userID)
	if err != nil {
		return nil, err
	}
	if job.Status != entity.WorkspaceExportStatusCompleted {
		return nil, ErrLogArchiveNotReady
	}
	if job.ExpiresAt != nil && time.Now().After(*job.ExpiresAt) {
		return nil, ErrLogArchiveExpired
	}
	if job.FilePath == nil || strings.TrimSpace(*job.FilePath) == "" {
		return nil, ErrWorkspaceExportUnavailable
	}
	if _, err := os.Stat(*job.FilePath); err != nil {
		return nil, ErrWorkspaceExportUnavailable
	}
	fileName := "log-archive.zip"
	if job.FileName != nil && strings.TrimSpace(*job.FileName) != "" {
		fileName = *job.FileName
	}
	return &WorkspaceExportDownload{
		FilePath: *job.FilePath,
		FileName: fileName,
	}, nil
}

func (s *logArchiveService) Replay(ctx context.Context, workspaceID, archiveID, userID uuid.UUID, params LogArchiveReplayParams) (*LogArchiveReplayResult, error) {
	job, err := s.GetArchive(ctx, workspaceID, archiveID, userID)
	if err != nil {
		return nil, err
	}
	if job.Status != entity.WorkspaceExportStatusCompleted {
		return nil, ErrLogArchiveNotReady
	}
	if job.ExpiresAt != nil && time.Now().After(*job.ExpiresAt) {
		return nil, ErrLogArchiveExpired
	}
	if job.FilePath == nil || strings.TrimSpace(*job.FilePath) == "" {
		return nil, ErrWorkspaceExportUnavailable
	}
	if _, err := os.Stat(*job.FilePath); err != nil {
		return nil, ErrWorkspaceExportUnavailable
	}

	dataset, err := resolveArchiveDataset(job.ExportType, params.Dataset)
	if err != nil {
		return nil, err
	}
	records, nextOffset, err := readArchiveDataset(*job.FilePath, dataset, params)
	if err != nil {
		return nil, err
	}
	return &LogArchiveReplayResult{
		Records:    records,
		NextOffset: nextOffset,
	}, nil
}

func (s *logArchiveService) DeleteArchive(ctx context.Context, workspaceID, archiveID, userID uuid.UUID) error {
	job, err := s.GetArchive(ctx, workspaceID, archiveID, userID)
	if err != nil {
		return err
	}
	if job.FilePath != nil && strings.TrimSpace(*job.FilePath) != "" {
		_ = os.Remove(*job.FilePath)
	}
	return s.repo.DeleteByID(ctx, job.ID)
}

func (s *logArchiveService) requireWorkspaceAdmin(ctx context.Context, workspaceID, userID uuid.UUID) error {
	access, err := s.workspaceService.GetWorkspaceAccess(ctx, workspaceID, userID)
	if err != nil {
		return err
	}
	if !access.IsOwner && !hasPermission(access.Permissions, PermissionWorkspaceAdmin) {
		return ErrWorkspaceUnauthorized
	}
	return nil
}

func (s *logArchiveService) resolveArchiveRange(start, end *time.Time) (time.Time, time.Time, error) {
	if start != nil && end != nil {
		if !end.After(*start) {
			return time.Time{}, time.Time{}, ErrLogArchiveInvalidRange
		}
		return start.UTC(), end.UTC(), nil
	}
	delayDays := s.cfg.LogArchiveDelayDays
	if delayDays <= 0 {
		delayDays = 1
	}
	batchDays := s.cfg.LogArchiveBatchDays
	if batchDays <= 0 {
		batchDays = 1
	}
	endTime := startOfDay(time.Now().AddDate(0, 0, -delayDays))
	startTime := endTime.AddDate(0, 0, -batchDays)
	if !endTime.After(startTime) {
		return time.Time{}, time.Time{}, ErrLogArchiveInvalidRange
	}
	return startTime, endTime, nil
}

func parseLogArchiveType(value string) (entity.WorkspaceExportJobType, error) {
	switch strings.TrimSpace(strings.ToLower(value)) {
	case "execution_logs", "execution", "execution_log_archive":
		return entity.WorkspaceExportTypeExecutionLogArchive, nil
	case "audit_logs", "audit", "audit_log_archive":
		return entity.WorkspaceExportTypeAuditLogArchive, nil
	default:
		return "", ErrLogArchiveUnsupported
	}
}

func isLogArchiveType(value entity.WorkspaceExportJobType) bool {
	return value == entity.WorkspaceExportTypeExecutionLogArchive || value == entity.WorkspaceExportTypeAuditLogArchive
}

func resolveArchiveDataset(archiveType entity.WorkspaceExportJobType, dataset string) (string, error) {
	switch archiveType {
	case entity.WorkspaceExportTypeExecutionLogArchive:
		if dataset == "" || dataset == "node_logs" {
			return "node_logs.jsonl", nil
		}
		if dataset == "executions" {
			return "executions.jsonl", nil
		}
	case entity.WorkspaceExportTypeAuditLogArchive:
		if dataset == "" || dataset == "audit_logs" {
			return "audit_logs.jsonl", nil
		}
	}
	return "", ErrLogArchiveDatasetInvalid
}

func readArchiveDataset(path, dataset string, params LogArchiveReplayParams) ([]map[string]interface{}, *int, error) {
	reader, err := zip.OpenReader(path)
	if err != nil {
		return nil, nil, err
	}
	defer reader.Close()

	var target *zip.File
	for _, file := range reader.File {
		if file.Name == dataset {
			target = file
			break
		}
	}
	if target == nil {
		return nil, nil, ErrLogArchiveDatasetInvalid
	}
	rc, err := target.Open()
	if err != nil {
		return nil, nil, err
	}
	defer rc.Close()

	limit := params.Limit
	if limit <= 0 {
		limit = 50
	}
	offset := params.Offset
	if offset < 0 {
		offset = 0
	}

	results := make([]map[string]interface{}, 0, limit)
	datasetKey := strings.TrimSuffix(dataset, ".jsonl")
	scanner := bufio.NewScanner(rc)
	scanner.Buffer(make([]byte, 0, 64*1024), 5*1024*1024)

	matched := 0
	for scanner.Scan() {
		line := scanner.Bytes()
		var record map[string]interface{}
		if err := json.Unmarshal(line, &record); err != nil {
			return results, nil, err
		}
		if !matchArchiveRecord(record, datasetKey, params) {
			continue
		}
		if matched < offset {
			matched++
			continue
		}
		results = append(results, record)
		matched++
		if len(results) >= limit {
			break
		}
	}
	if err := scanner.Err(); err != nil && !errors.Is(err, io.EOF) {
		return results, nil, err
	}
	if len(results) == limit {
		next := offset + len(results)
		return results, &next, nil
	}
	return results, nil, nil
}

func matchArchiveRecord(record map[string]interface{}, datasetKey string, params LogArchiveReplayParams) bool {
	switch datasetKey {
	case "audit_logs":
		if params.Action != "" {
			if !matchStringField(record, "action", params.Action) {
				return false
			}
		}
		if params.ActorUserID != nil {
			if !matchStringField(record, "actor_user_id", params.ActorUserID.String()) {
				return false
			}
		}
		if params.TargetType != "" {
			if !matchStringField(record, "target_type", params.TargetType) {
				return false
			}
		}
		if params.TargetID != nil {
			if !matchStringField(record, "target_id", params.TargetID.String()) {
				return false
			}
		}
	case "executions":
		if params.ExecutionID != nil {
			if id := extractStringField(record, "id"); id != "" {
				if id != params.ExecutionID.String() {
					return false
				}
			} else if id := extractStringField(record, "execution_id"); id != "" {
				if id != params.ExecutionID.String() {
					return false
				}
			}
		}
		if params.WorkflowID != nil {
			if !matchStringField(record, "workflow_id", params.WorkflowID.String()) {
				return false
			}
		}
		if params.UserID != nil {
			if !matchStringField(record, "user_id", params.UserID.String()) {
				return false
			}
		}
		if params.Status != "" {
			if !matchStringField(record, "status", params.Status) {
				return false
			}
		}
	case "node_logs":
		if params.ExecutionID != nil {
			if id := extractStringField(record, "execution_id"); id != "" {
				if id != params.ExecutionID.String() {
					return false
				}
			} else if id := extractStringField(record, "id"); id != "" {
				if id != params.ExecutionID.String() {
					return false
				}
			}
		}
		if params.NodeID != "" {
			if !matchStringField(record, "node_id", params.NodeID) {
				return false
			}
		}
		if params.NodeType != "" {
			if !matchStringField(record, "node_type", params.NodeType) {
				return false
			}
		}
		if params.Status != "" {
			if !matchStringField(record, "status", params.Status) {
				return false
			}
		}
	default:
		if params.ExecutionID != nil {
			if id := extractStringField(record, "execution_id"); id != "" {
				if id != params.ExecutionID.String() {
					return false
				}
			} else if id := extractStringField(record, "id"); id != "" {
				if id != params.ExecutionID.String() {
					return false
				}
			}
		}
	}

	if params.From != nil || params.To != nil {
		createdAt := extractStringField(record, "created_at")
		if createdAt == "" {
			return false
		}
		parsed, err := time.Parse(time.RFC3339, createdAt)
		if err != nil {
			return false
		}
		if params.From != nil && parsed.Before(*params.From) {
			return false
		}
		if params.To != nil && !parsed.Before(*params.To) {
			return false
		}
	}
	return true
}

func extractStringField(record map[string]interface{}, key string) string {
	raw, ok := record[key]
	if !ok || raw == nil {
		return ""
	}
	switch value := raw.(type) {
	case string:
		return value
	default:
		return ""
	}
}

func matchStringField(record map[string]interface{}, key, expected string) bool {
	if strings.TrimSpace(expected) == "" {
		return true
	}
	value := strings.TrimSpace(extractStringField(record, key))
	if value == "" {
		return false
	}
	return strings.EqualFold(value, strings.TrimSpace(expected))
}

func startOfDay(t time.Time) time.Time {
	utc := t.UTC()
	return time.Date(utc.Year(), utc.Month(), utc.Day(), 0, 0, 0, 0, time.UTC)
}
