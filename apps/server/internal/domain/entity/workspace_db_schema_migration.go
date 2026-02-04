package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// WorkspaceDBSchemaMigrationStatus 迁移审批状态
type WorkspaceDBSchemaMigrationStatus string

const (
	WorkspaceDBSchemaMigrationStatusPendingReview WorkspaceDBSchemaMigrationStatus = "pending_review"
	WorkspaceDBSchemaMigrationStatusApproved      WorkspaceDBSchemaMigrationStatus = "approved"
	WorkspaceDBSchemaMigrationStatusRejected      WorkspaceDBSchemaMigrationStatus = "rejected"
	WorkspaceDBSchemaMigrationStatusRunning       WorkspaceDBSchemaMigrationStatus = "running"
	WorkspaceDBSchemaMigrationStatusCompleted     WorkspaceDBSchemaMigrationStatus = "completed"
	WorkspaceDBSchemaMigrationStatusFailed        WorkspaceDBSchemaMigrationStatus = "failed"
	WorkspaceDBSchemaMigrationStatusRolledBack    WorkspaceDBSchemaMigrationStatus = "rolled_back"
)

// WorkspaceDBSchemaMigration 工作空间数据库 Schema 迁移审批与流水线记录
type WorkspaceDBSchemaMigration struct {
	ID            uuid.UUID                        `gorm:"type:char(36);primaryKey" json:"id"`
	WorkspaceID   uuid.UUID                        `gorm:"type:char(36);not null;index" json:"workspace_id"`
	SubmitterID   uuid.UUID                        `gorm:"type:char(36);not null;index" json:"submitter_id"`
	ReviewQueueID *uuid.UUID                       `gorm:"type:char(36);index" json:"review_queue_id,omitempty"`
	Status        WorkspaceDBSchemaMigrationStatus `gorm:"size:30;default:'pending_review';index" json:"status"`

	FromVersion     *string     `gorm:"size:100" json:"from_version,omitempty"`
	TargetVersion   *string     `gorm:"size:100" json:"target_version,omitempty"`
	PendingVersions StringArray `gorm:"type:json" json:"pending_versions"`
	Plan            JSON        `gorm:"type:json" json:"plan"`
	Precheck        JSON        `gorm:"type:json" json:"precheck"`
	Result          JSON        `gorm:"type:json" json:"result"`

	VerifySQL    *string `gorm:"type:text" json:"verify_sql,omitempty"`
	BackupID     *string `gorm:"size:255" json:"backup_id,omitempty"`
	ReviewNote   *string `gorm:"type:text" json:"review_note,omitempty"`
	ErrorMessage *string `gorm:"type:text" json:"error_message,omitempty"`

	ApprovedBy  *uuid.UUID `gorm:"type:char(36);index" json:"approved_by,omitempty"`
	ApprovedAt  *time.Time `json:"approved_at,omitempty"`
	StartedAt   *time.Time `json:"started_at,omitempty"`
	CompletedAt *time.Time `json:"completed_at,omitempty"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	Workspace   *Workspace   `gorm:"foreignKey:WorkspaceID" json:"workspace,omitempty"`
	Submitter   *User        `gorm:"foreignKey:SubmitterID" json:"submitter,omitempty"`
	Approver    *User        `gorm:"foreignKey:ApprovedBy" json:"approver,omitempty"`
	ReviewQueue *ReviewQueue `gorm:"foreignKey:ReviewQueueID" json:"review,omitempty"`
}

// TableName 表名
func (WorkspaceDBSchemaMigration) TableName() string {
	return "what_reverse_workspace_db_schema_migrations"
}

// BeforeCreate 创建前钩子
func (m *WorkspaceDBSchemaMigration) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	if m.PendingVersions == nil {
		m.PendingVersions = StringArray{}
	}
	if m.Plan == nil {
		m.Plan = JSON{}
	}
	if m.Precheck == nil {
		m.Precheck = JSON{}
	}
	if m.Result == nil {
		m.Result = JSON{}
	}
	return nil
}
