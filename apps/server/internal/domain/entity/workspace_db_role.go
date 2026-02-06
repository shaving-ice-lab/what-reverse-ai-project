package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// WorkspaceDBRole 工作空间数据库角色
type WorkspaceDBRole struct {
	ID            uuid.UUID  `gorm:"type:char(36);primaryKey" json:"id"`
	WorkspaceID   uuid.UUID  `gorm:"type:char(36);not null;index;uniqueIndex:uniq_workspace_role_status" json:"workspace_id"`
	RoleType      string     `gorm:"size:20;not null;index;uniqueIndex:uniq_workspace_role_status" json:"role_type"`
	DBUser        string     `gorm:"column:db_user;size:100;not null" json:"db_user"`
	SecretRef     *string    `gorm:"column:secret_ref;size:200" json:"-"`
	Status        string     `gorm:"size:20;default:'active';index;uniqueIndex:uniq_workspace_role_status" json:"status"`
	ExpiresAt     *time.Time `json:"expires_at,omitempty"`
	LastUsedAt    *time.Time `json:"last_used_at,omitempty"`
	LastRotatedAt *time.Time `json:"last_rotated_at,omitempty"`
	RevokedAt     *time.Time `json:"revoked_at,omitempty"`
	RevokedBy     *uuid.UUID `gorm:"type:char(36)" json:"revoked_by,omitempty"`
	RevokedReason *string    `gorm:"size:255" json:"revoked_reason,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`

	Workspace *Workspace `gorm:"foreignKey:WorkspaceID" json:"workspace,omitempty"`
}

// TableName 表名
func (WorkspaceDBRole) TableName() string {
	return "what_reverse_workspace_db_roles"
}

// BeforeCreate 创建前钩子
func (r *WorkspaceDBRole) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}
