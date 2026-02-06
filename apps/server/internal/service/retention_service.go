package service

import (
	"context"
	"os"
	"time"

	"github.com/agentflow/server/internal/config"
	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/pkg/logger"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
)

const (
	defaultRetentionInterval = 24 * time.Hour
	defaultRetentionTimeout  = 10 * time.Minute
)

// RetentionReport 数据保留清理报告
type RetentionReport struct {
	ExecutionLogCutoff            *time.Time `json:"execution_log_cutoff,omitempty"`
	AuditLogCutoff                *time.Time `json:"audit_log_cutoff,omitempty"`
	AnonymousSessionCutoff        *time.Time `json:"anonymous_session_cutoff,omitempty"`
	WorkspaceColdStorageCutoff    *time.Time `json:"workspace_cold_storage_cutoff,omitempty"`
	WorkspacePurgeCutoff          *time.Time `json:"workspace_purge_cutoff,omitempty"`
	RuntimeEventsDeleted          int64      `json:"runtime_events_deleted"`
	NodeLogsDeleted               int64      `json:"node_logs_deleted"`
	AuditLogsDeleted              int64      `json:"audit_logs_deleted"`
	AnonymousSessionsDeleted      int64      `json:"anonymous_sessions_deleted"`
	WorkspacesMovedToCold         int64      `json:"workspaces_moved_to_cold"`
	WorkspacesPurged              int64      `json:"workspaces_purged"`
	ExecutionLogArchivesScheduled int64      `json:"execution_log_archives_scheduled"`
	AuditLogArchivesScheduled     int64      `json:"audit_log_archives_scheduled"`
	LogArchivesExpiredDeleted     int64      `json:"log_archives_expired_deleted"`
}

// RetentionService 数据保留清理服务
type RetentionService interface {
	Run(ctx context.Context)
	RunOnce(ctx context.Context) (*RetentionReport, error)
}

type retentionService struct {
	cfg                   config.RetentionConfig
	archiveCfg            config.ArchiveConfig
	runtimeEventRepo      repository.RuntimeEventRepository
	executionRepo         repository.ExecutionRepository
	workspaceRepo         repository.WorkspaceRepository
	exportRepo            repository.WorkspaceExportRepository
	auditLogRepo          repository.AuditLogRepository
	auditLogRetentionDays int
	log                   logger.Logger
	cleanupTimeout        time.Duration
}

// NewRetentionService 创建数据保留服务
func NewRetentionService(
	cfg config.RetentionConfig,
	archiveCfg config.ArchiveConfig,
	runtimeEventRepo repository.RuntimeEventRepository,
	executionRepo repository.ExecutionRepository,
	workspaceRepo repository.WorkspaceRepository,
	exportRepo repository.WorkspaceExportRepository,
	auditLogRepo repository.AuditLogRepository,
	auditLogRetentionDays int,
	log logger.Logger,
) RetentionService {
	timeout := defaultRetentionTimeout
	if cfg.CleanupInterval > 0 && cfg.CleanupInterval < timeout {
		timeout = cfg.CleanupInterval
	}
	return &retentionService{
		cfg:                   cfg,
		archiveCfg:            archiveCfg,
		runtimeEventRepo:      runtimeEventRepo,
		executionRepo:         executionRepo,
		workspaceRepo:         workspaceRepo,
		exportRepo:            exportRepo,
		auditLogRepo:          auditLogRepo,
		auditLogRetentionDays: auditLogRetentionDays,
		log:                   log,
		cleanupTimeout:        timeout,
	}
}

// Run 启动定期清理任务
func (s *retentionService) Run(ctx context.Context) {
	if !s.cfg.Enabled {
		s.log.Info("Retention cleanup disabled")
		return
	}
	interval := s.cfg.CleanupInterval
	if interval <= 0 {
		interval = defaultRetentionInterval
	}

	if _, err := s.RunOnce(ctx); err != nil {
		s.log.Warn("Initial retention cleanup failed", "error", err)
	}

	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if _, err := s.RunOnce(ctx); err != nil {
				s.log.Warn("Retention cleanup failed", "error", err)
			}
		}
	}
}

// RunOnce 执行一次清理
func (s *retentionService) RunOnce(ctx context.Context) (*RetentionReport, error) {
	report := &RetentionReport{}
	if !s.cfg.Enabled {
		return report, nil
	}

	now := time.Now()
	var firstErr error

	if s.cfg.ExecutionLogRetentionDays > 0 {
		cutoff := now.AddDate(0, 0, -s.cfg.ExecutionLogRetentionDays)
		report.ExecutionLogCutoff = &cutoff

		if s.runtimeEventRepo != nil {
			deleted, err := s.deleteRuntimeEvents(ctx, cutoff)
			if err != nil && firstErr == nil {
				firstErr = err
			}
			report.RuntimeEventsDeleted = deleted
		}
		if s.executionRepo != nil && !s.archiveCfg.LogArchiveEnabled {
			deleted, err := s.deleteNodeLogs(ctx, cutoff)
			if err != nil && firstErr == nil {
				firstErr = err
			}
			report.NodeLogsDeleted = deleted
		}
	}

	if s.auditLogRetentionDays > 0 && s.auditLogRepo != nil {
		cutoff := now.AddDate(0, 0, -s.auditLogRetentionDays)
		report.AuditLogCutoff = &cutoff

		if !s.archiveCfg.LogArchiveEnabled {
			deleted, err := s.deleteAuditLogs(ctx, cutoff)
			if err != nil && firstErr == nil {
				firstErr = err
			}
			report.AuditLogsDeleted = deleted
		}
	}

	if s.cfg.AnonymousSessionRetentionDays > 0 {
		cutoff := now.AddDate(0, 0, -s.cfg.AnonymousSessionRetentionDays)
		report.AnonymousSessionCutoff = &cutoff

		if s.workspaceRepo != nil {
			deleted, err := s.deleteAnonymousSessions(ctx, cutoff)
			if err != nil && firstErr == nil {
				firstErr = err
			}
			report.AnonymousSessionsDeleted = deleted
		}
	}

	if s.cfg.WorkspaceDeletionGraceDays > 0 && s.workspaceRepo != nil {
		coldCutoff := now.AddDate(0, 0, -s.cfg.WorkspaceDeletionGraceDays)
		report.WorkspaceColdStorageCutoff = &coldCutoff
		moved, err := s.moveWorkspacesToColdStorage(ctx, coldCutoff)
		if err != nil && firstErr == nil {
			firstErr = err
		}
		report.WorkspacesMovedToCold = moved
	}

	if s.cfg.WorkspaceDeletionGraceDays > 0 && s.cfg.WorkspaceColdStorageDays > 0 && s.workspaceRepo != nil {
		purgeCutoff := now.AddDate(0, 0, -(s.cfg.WorkspaceDeletionGraceDays + s.cfg.WorkspaceColdStorageDays))
		report.WorkspacePurgeCutoff = &purgeCutoff
		purged, err := s.purgeColdWorkspaces(ctx, purgeCutoff)
		if err != nil && firstErr == nil {
			firstErr = err
		}
		report.WorkspacesPurged = purged
	}

	if s.archiveCfg.LogArchiveEnabled {
		executionScheduled, auditScheduled, cleanupDeleted, err := s.scheduleLogArchives(ctx, now)
		if err != nil && firstErr == nil {
			firstErr = err
		}
		report.ExecutionLogArchivesScheduled = executionScheduled
		report.AuditLogArchivesScheduled = auditScheduled
		report.LogArchivesExpiredDeleted = cleanupDeleted
	}

	if report.RuntimeEventsDeleted > 0 || report.NodeLogsDeleted > 0 || report.AuditLogsDeleted > 0 || report.AnonymousSessionsDeleted > 0 || report.WorkspacesMovedToCold > 0 || report.WorkspacesPurged > 0 || report.ExecutionLogArchivesScheduled > 0 || report.AuditLogArchivesScheduled > 0 || report.LogArchivesExpiredDeleted > 0 {
		s.log.Info("Retention cleanup completed",
			"runtime_events_deleted", report.RuntimeEventsDeleted,
			"node_logs_deleted", report.NodeLogsDeleted,
			"audit_logs_deleted", report.AuditLogsDeleted,
			"anonymous_sessions_deleted", report.AnonymousSessionsDeleted,
			"workspaces_moved_to_cold", report.WorkspacesMovedToCold,
			"workspaces_purged", report.WorkspacesPurged,
			"execution_log_archives_scheduled", report.ExecutionLogArchivesScheduled,
			"audit_log_archives_scheduled", report.AuditLogArchivesScheduled,
			"log_archives_expired_deleted", report.LogArchivesExpiredDeleted,
		)
	}

	return report, firstErr
}

func (s *retentionService) deleteRuntimeEvents(ctx context.Context, cutoff time.Time) (int64, error) {
	ctx, cancel := s.withTimeout(ctx)
	defer cancel()
	return s.runtimeEventRepo.DeleteOlderThan(ctx, cutoff)
}

func (s *retentionService) deleteNodeLogs(ctx context.Context, cutoff time.Time) (int64, error) {
	ctx, cancel := s.withTimeout(ctx)
	defer cancel()
	return s.executionRepo.DeleteNodeLogsOlderThan(ctx, cutoff)
}

func (s *retentionService) deleteAuditLogs(ctx context.Context, cutoff time.Time) (int64, error) {
	ctx, cancel := s.withTimeout(ctx)
	defer cancel()
	return s.auditLogRepo.DeleteOlderThan(ctx, cutoff)
}

func (s *retentionService) deleteAnonymousSessions(ctx context.Context, cutoff time.Time) (int64, error) {
	ctx, cancel := s.withTimeout(ctx)
	defer cancel()
	return s.workspaceRepo.DeleteAnonymousSessionsBefore(ctx, cutoff)
}

func (s *retentionService) moveWorkspacesToColdStorage(ctx context.Context, cutoff time.Time) (int64, error) {
	ctx, cancel := s.withTimeout(ctx)
	defer cancel()

	workspaces, err := s.workspaceRepo.ListSoftDeletedBefore(ctx, cutoff)
	if err != nil {
		return 0, err
	}
	var moved int64
	for _, workspace := range workspaces {
		if err := s.workspaceRepo.UpdateStatusUnscoped(ctx, workspace.ID, "cold_storage"); err != nil {
			return moved, err
		}
		_ = s.ensureColdStorageArchive(ctx, workspace)
		moved++
	}
	return moved, nil
}

func (s *retentionService) purgeColdWorkspaces(ctx context.Context, cutoff time.Time) (int64, error) {
	ctx, cancel := s.withTimeout(ctx)
	defer cancel()

	workspaces, err := s.workspaceRepo.ListColdStorageBefore(ctx, cutoff)
	if err != nil {
		return 0, err
	}
	var purged int64
	for _, workspace := range workspaces {
		_ = s.cleanupColdStorageArchive(ctx, workspace)
		if err := s.workspaceRepo.Purge(ctx, workspace.ID); err != nil {
			return purged, err
		}
		purged++
	}
	return purged, nil
}

func (s *retentionService) ensureColdStorageArchive(ctx context.Context, workspace entity.Workspace) error {
	if s.exportRepo == nil {
		return nil
	}
	latest, err := s.exportRepo.GetLatestByWorkspaceAndType(ctx, workspace.ID, entity.WorkspaceExportTypeColdStorage)
	if err != nil {
		return err
	}
	if latest != nil {
		switch latest.Status {
		case entity.WorkspaceExportStatusPending, entity.WorkspaceExportStatusProcessing, entity.WorkspaceExportStatusCompleted:
			return nil
		}
	}

	var expiresAt *time.Time
	if workspace.DeletedAt.Valid {
		expires := workspace.DeletedAt.Time.AddDate(0, 0, s.cfg.WorkspaceDeletionGraceDays+s.cfg.WorkspaceColdStorageDays)
		expiresAt = &expires
	}

	job := &entity.WorkspaceExportJob{
		WorkspaceID: workspace.ID,
		ExportType:  entity.WorkspaceExportTypeColdStorage,
		Status:      entity.WorkspaceExportStatusPending,
		ExpiresAt:   expiresAt,
	}
	return s.exportRepo.Create(ctx, job)
}

func (s *retentionService) cleanupColdStorageArchive(ctx context.Context, workspace entity.Workspace) error {
	if s.exportRepo == nil {
		return nil
	}
	jobs, err := s.exportRepo.ListByWorkspaceAndType(ctx, workspace.ID, entity.WorkspaceExportTypeColdStorage)
	if err != nil {
		return err
	}
	for _, job := range jobs {
		if job.FilePath != nil && *job.FilePath != "" {
			_ = os.Remove(*job.FilePath)
		}
	}
	_, err = s.exportRepo.DeleteByWorkspaceAndType(ctx, workspace.ID, entity.WorkspaceExportTypeColdStorage)
	return err
}

func (s *retentionService) withTimeout(ctx context.Context) (context.Context, context.CancelFunc) {
	if ctx == nil {
		ctx = context.Background()
	}
	timeout := s.cleanupTimeout
	if timeout <= 0 {
		timeout = defaultRetentionTimeout
	}
	return context.WithTimeout(ctx, timeout)
}

func (s *retentionService) scheduleLogArchives(ctx context.Context, now time.Time) (int64, int64, int64, error) {
	if s.exportRepo == nil {
		return 0, 0, 0, nil
	}
	var firstErr error
	var executionScheduled int64
	var auditScheduled int64

	if s.cfg.ExecutionLogRetentionDays > 0 && s.executionRepo != nil {
		cutoff := now.AddDate(0, 0, -s.cfg.ExecutionLogRetentionDays)
		scheduled, err := s.scheduleLogArchiveForExecutions(ctx, cutoff, now)
		if err != nil && firstErr == nil {
			firstErr = err
		}
		executionScheduled = scheduled
	}
	if s.auditLogRetentionDays > 0 && s.auditLogRepo != nil {
		cutoff := now.AddDate(0, 0, -s.auditLogRetentionDays)
		scheduled, err := s.scheduleLogArchiveForAudits(ctx, cutoff, now)
		if err != nil && firstErr == nil {
			firstErr = err
		}
		auditScheduled = scheduled
	}
	cleanupDeleted, err := s.cleanupExpiredLogArchives(ctx)
	if err != nil && firstErr == nil {
		firstErr = err
	}
	return executionScheduled, auditScheduled, cleanupDeleted, firstErr
}

func (s *retentionService) scheduleLogArchiveForExecutions(ctx context.Context, cutoff time.Time, now time.Time) (int64, error) {
	workspaceIDs, err := s.executionRepo.ListWorkspaceIDsWithNodeLogsBefore(ctx, cutoff, 200)
	if err != nil {
		return 0, err
	}
	var scheduled int64
	for _, workspaceID := range workspaceIDs {
		created, err := s.ensureLogArchiveJob(ctx, workspaceID, entity.WorkspaceExportTypeExecutionLogArchive, cutoff, now, s.earliestExecutionLogTime)
		if err != nil {
			return scheduled, err
		}
		if created {
			scheduled++
		}
	}
	return scheduled, nil
}

func (s *retentionService) scheduleLogArchiveForAudits(ctx context.Context, cutoff time.Time, now time.Time) (int64, error) {
	workspaceIDs, err := s.auditLogRepo.ListWorkspaceIDsWithAuditLogsBefore(ctx, cutoff, 200)
	if err != nil {
		return 0, err
	}
	var scheduled int64
	for _, workspaceID := range workspaceIDs {
		created, err := s.ensureLogArchiveJob(ctx, workspaceID, entity.WorkspaceExportTypeAuditLogArchive, cutoff, now, s.earliestAuditLogTime)
		if err != nil {
			return scheduled, err
		}
		if created {
			scheduled++
		}
	}
	return scheduled, nil
}

func (s *retentionService) ensureLogArchiveJob(ctx context.Context, workspaceID uuid.UUID, exportType entity.WorkspaceExportJobType, cutoff time.Time, now time.Time, earliestFn func(context.Context, uuid.UUID) (*time.Time, error)) (bool, error) {
	if s.exportRepo == nil {
		return false, nil
	}
	active, err := s.exportRepo.HasActiveByWorkspaceAndType(ctx, workspaceID, exportType)
	if err != nil {
		return false, err
	}
	if active {
		return false, nil
	}
	archiveEnd := startOfDay(cutoff)
	delay := s.archiveCfg.LogArchiveDelayDays
	if delay > 0 {
		archiveEnd = startOfDay(cutoff.AddDate(0, 0, -delay))
	}
	if archiveEnd.IsZero() {
		return false, nil
	}
	var rangeStart time.Time
	latest, err := s.exportRepo.GetLatestCompletedByWorkspaceAndType(ctx, workspaceID, exportType)
	if err != nil {
		return false, err
	}
	if latest != nil && latest.ArchiveRangeEnd != nil {
		rangeStart = startOfDay(*latest.ArchiveRangeEnd)
	} else {
		earliest, err := earliestFn(ctx, workspaceID)
		if err != nil {
			return false, err
		}
		if earliest == nil {
			return false, nil
		}
		rangeStart = startOfDay(*earliest)
	}
	if !archiveEnd.After(rangeStart) {
		return false, nil
	}
	batchDays := s.archiveCfg.LogArchiveBatchDays
	if batchDays <= 0 {
		batchDays = 1
	}
	rangeEnd := rangeStart.AddDate(0, 0, batchDays)
	if rangeEnd.After(archiveEnd) {
		rangeEnd = archiveEnd
	}
	exists, err := s.exportRepo.ExistsByWorkspaceTypeAndRange(ctx, workspaceID, exportType, rangeStart, rangeEnd)
	if err != nil {
		return false, err
	}
	if exists {
		return false, nil
	}
	var expiresAt *time.Time
	if s.archiveCfg.LogArchiveRetentionDays > 0 {
		t := now.AddDate(0, 0, s.archiveCfg.LogArchiveRetentionDays)
		expiresAt = &t
	}
	job := &entity.WorkspaceExportJob{
		WorkspaceID:       workspaceID,
		ExportType:        exportType,
		Status:            entity.WorkspaceExportStatusPending,
		ExpiresAt:         expiresAt,
		ArchiveRangeStart: &rangeStart,
		ArchiveRangeEnd:   &rangeEnd,
	}
	if err := s.exportRepo.Create(ctx, job); err != nil {
		return false, err
	}
	return true, nil
}

func (s *retentionService) earliestExecutionLogTime(ctx context.Context, workspaceID uuid.UUID) (*time.Time, error) {
	if s.executionRepo == nil {
		return nil, nil
	}
	earliestNode, err := s.executionRepo.GetEarliestNodeLogCreatedAtByWorkspace(ctx, workspaceID)
	if err != nil {
		return nil, err
	}
	earliestExecution, err := s.executionRepo.GetEarliestExecutionCreatedAtByWorkspace(ctx, workspaceID)
	if err != nil {
		return nil, err
	}
	if earliestNode == nil {
		return earliestExecution, nil
	}
	if earliestExecution == nil {
		return earliestNode, nil
	}
	if earliestExecution.Before(*earliestNode) {
		return earliestExecution, nil
	}
	return earliestNode, nil
}

func (s *retentionService) earliestAuditLogTime(ctx context.Context, workspaceID uuid.UUID) (*time.Time, error) {
	if s.auditLogRepo == nil {
		return nil, nil
	}
	return s.auditLogRepo.GetEarliestAuditLogCreatedAtByWorkspace(ctx, workspaceID)
}

func (s *retentionService) cleanupExpiredLogArchives(ctx context.Context) (int64, error) {
	if s.exportRepo == nil {
		return 0, nil
	}
	totalDeleted := int64(0)
	types := []entity.WorkspaceExportJobType{
		entity.WorkspaceExportTypeExecutionLogArchive,
		entity.WorkspaceExportTypeAuditLogArchive,
	}
	for _, exportType := range types {
		jobs, err := s.exportRepo.ListExpiredByType(ctx, exportType, 200)
		if err != nil {
			return totalDeleted, err
		}
		for _, job := range jobs {
			if job.FilePath != nil && *job.FilePath != "" {
				_ = os.Remove(*job.FilePath)
			}
			if err := s.exportRepo.DeleteByID(ctx, job.ID); err != nil {
				return totalDeleted, err
			}
			totalDeleted++
		}
	}
	return totalDeleted, nil
}
