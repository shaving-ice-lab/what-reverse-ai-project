package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// WorkspaceExportJobStatus 导出任务状态
type WorkspaceExportJobStatus string

const (
	WorkspaceExportStatusPending    WorkspaceExportJobStatus = "pending"
	WorkspaceExportStatusProcessing WorkspaceExportJobStatus = "processing"
	WorkspaceExportStatusCompleted  WorkspaceExportJobStatus = "completed"
	WorkspaceExportStatusFailed     WorkspaceExportJobStatus = "failed"
)

// WorkspaceExportJobType 导出任务类型
type WorkspaceExportJobType string

const (
	WorkspaceExportTypeUserExport          WorkspaceExportJobType = "user_export"
	WorkspaceExportTypeColdStorage         WorkspaceExportJobType = "cold_storage"
	WorkspaceExportTypeExecutionLogArchive WorkspaceExportJobType = "execution_log_archive"
	WorkspaceExportTypeAuditLogArchive     WorkspaceExportJobType = "audit_log_archive"
)

// WorkspaceExportJob 工作空间导出任务
type WorkspaceExportJob struct {
	ID          uuid.UUID                `gorm:"type:char(36);primaryKey" json:"id"`
	WorkspaceID uuid.UUID                `gorm:"type:char(36);not null;index" json:"workspace_id"`
	RequestedBy *uuid.UUID               `gorm:"type:char(36);index" json:"requested_by,omitempty"`
	ExportType  WorkspaceExportJobType   `gorm:"size:30;not null;index" json:"export_type"`
	Status      WorkspaceExportJobStatus `gorm:"size:20;default:'pending';index" json:"status"`

	FileName     *string `gorm:"size:255" json:"file_name,omitempty"`
	FilePath     *string `gorm:"size:512" json:"file_path,omitempty"`
	FileSize     *int64  `gorm:"type:bigint" json:"file_size,omitempty"`
	Checksum     *string `gorm:"size:128" json:"checksum,omitempty"`
	ErrorMessage *string `gorm:"type:text" json:"error_message,omitempty"`

	StartedAt         *time.Time `json:"started_at,omitempty"`
	CompletedAt       *time.Time `json:"completed_at,omitempty"`
	ExpiresAt         *time.Time `json:"expires_at,omitempty"`
	ArchiveRangeStart *time.Time `json:"archive_range_start,omitempty"`
	ArchiveRangeEnd   *time.Time `json:"archive_range_end,omitempty"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`

	Workspace *Workspace `gorm:"foreignKey:WorkspaceID" json:"workspace,omitempty"`
	Requester *User      `gorm:"foreignKey:RequestedBy" json:"requester,omitempty"`
}

// TableName 表名
func (WorkspaceExportJob) TableName() string {
	return "what_reverse_workspace_export_jobs"
}

// BeforeCreate 创建前钩子
func (j *WorkspaceExportJob) BeforeCreate(tx *gorm.DB) error {
	if j.ID == uuid.Nil {
		j.ID = uuid.New()
	}
	return nil
}
