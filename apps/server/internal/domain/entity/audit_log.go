package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AuditLog 审计日志
type AuditLog struct {
	ID          uuid.UUID  `gorm:"type:char(36);primaryKey" json:"id"`
	WorkspaceID uuid.UUID  `gorm:"type:char(36);not null;index" json:"workspace_id"`
	ActorUserID *uuid.UUID `gorm:"type:char(36);index" json:"actor_user_id"`
	Action      string     `gorm:"size:100;not null;index" json:"action"`
	TargetType  string     `gorm:"size:50;not null;index" json:"target_type"`
	TargetID    *uuid.UUID `gorm:"type:char(36);index" json:"target_id"`
	Metadata    JSON       `gorm:"column:metadata_json;type:json" json:"metadata"`
	CreatedAt   time.Time  `json:"created_at"`

	Workspace *Workspace `gorm:"foreignKey:WorkspaceID" json:"workspace,omitempty"`
	Actor     *User      `gorm:"foreignKey:ActorUserID" json:"actor,omitempty"`
}

// TableName 表名
func (AuditLog) TableName() string {
	return "what_reverse_audit_logs"
}

// BeforeCreate 创建前钩子
func (l *AuditLog) BeforeCreate(tx *gorm.DB) error {
	if l.ID == uuid.Nil {
		l.ID = uuid.New()
	}
	return nil
}
