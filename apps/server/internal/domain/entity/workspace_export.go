package entity

// workspace_export.go — Minimal stubs for export types used by retention service.
// Full export domain has been removed; only types referenced by core services remain.

import (
	"time"

	"github.com/google/uuid"
)

// WorkspaceExportJobType 导出任务类型
type WorkspaceExportJobType string

const (
	WorkspaceExportTypeColdStorage         WorkspaceExportJobType = "cold_storage"
	WorkspaceExportTypeExecutionLogArchive WorkspaceExportJobType = "execution_log_archive"
	WorkspaceExportTypeAuditLogArchive     WorkspaceExportJobType = "audit_log_archive"
)

// WorkspaceExportStatus 导出任务状态
type WorkspaceExportStatus string

const (
	WorkspaceExportStatusPending    WorkspaceExportStatus = "pending"
	WorkspaceExportStatusProcessing WorkspaceExportStatus = "processing"
	WorkspaceExportStatusCompleted  WorkspaceExportStatus = "completed"
	WorkspaceExportStatusFailed     WorkspaceExportStatus = "failed"
)

// WorkspaceExportJob 导出任务
type WorkspaceExportJob struct {
	ID                uuid.UUID              `gorm:"type:char(36);primaryKey" json:"id"`
	WorkspaceID       uuid.UUID              `gorm:"type:char(36);not null;index" json:"workspace_id"`
	ExportType        WorkspaceExportJobType `gorm:"type:varchar(50);not null;index" json:"export_type"`
	Status            WorkspaceExportStatus  `gorm:"type:varchar(20);not null;default:pending" json:"status"`
	FilePath          *string                `gorm:"type:varchar(500)" json:"file_path,omitempty"`
	FileName          *string                `gorm:"type:varchar(200)" json:"file_name,omitempty"`
	FileSize          *int64                 `gorm:"default:0" json:"file_size,omitempty"`
	ErrorMessage      *string                `gorm:"type:text" json:"error_message,omitempty"`
	StartedAt         *time.Time             `json:"started_at,omitempty"`
	CompletedAt       *time.Time             `json:"completed_at,omitempty"`
	ExpiresAt         *time.Time             `json:"expires_at,omitempty"`
	ArchiveRangeStart *time.Time             `json:"archive_range_start,omitempty"`
	ArchiveRangeEnd   *time.Time             `json:"archive_range_end,omitempty"`
	CreatedAt         time.Time              `json:"created_at"`
	UpdatedAt         time.Time              `json:"updated_at"`
}
