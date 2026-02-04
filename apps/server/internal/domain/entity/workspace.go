package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Workspace 工作空间实体
type Workspace struct {
	ID              uuid.UUID      `gorm:"type:char(36);primaryKey" json:"id"`
	OwnerUserID     uuid.UUID      `gorm:"type:char(36);not null;index" json:"owner_user_id"`
	Name            string         `gorm:"size:100;not null" json:"name"`
	Slug            string         `gorm:"size:100;not null;uniqueIndex" json:"slug"`
	Icon            string         `gorm:"size:50;default:'🏢'" json:"icon"`
	Status          string         `gorm:"size:20;default:'active';index" json:"status"`
	StatusReason    *string        `gorm:"size:255" json:"status_reason,omitempty"`
	StatusUpdatedAt *time.Time     `json:"status_updated_at,omitempty"`
	Plan            string         `gorm:"size:20;default:'free'" json:"plan"`
	Region          *string        `gorm:"size:50" json:"region"`
	DefaultAppID    *uuid.UUID     `gorm:"type:char(36)" json:"default_app_id"`
	Settings        JSON           `gorm:"column:settings_json;type:json" json:"settings"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`

	Owner *User `gorm:"foreignKey:OwnerUserID" json:"owner,omitempty"`
}

// TableName 表名
func (Workspace) TableName() string {
	return "what_reverse_workspaces"
}

// BeforeCreate 创建前钩子
func (w *Workspace) BeforeCreate(tx *gorm.DB) error {
	if w.ID == uuid.Nil {
		w.ID = uuid.New()
	}
	if w.Icon == "" {
		w.Icon = "🏢"
	}
	return nil
}

// WorkspaceRole 工作空间角色
type WorkspaceRole struct {
	ID          uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	WorkspaceID uuid.UUID `gorm:"type:char(36);not null;index" json:"workspace_id"`
	Name        string    `gorm:"size:50;not null" json:"name"`
	Permissions JSON      `gorm:"column:permissions_json;type:json" json:"permissions"`
	IsSystem    bool      `gorm:"default:false" json:"is_system"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	Workspace *Workspace `gorm:"foreignKey:WorkspaceID" json:"workspace,omitempty"`
}

// TableName 表名
func (WorkspaceRole) TableName() string {
	return "what_reverse_workspace_roles"
}

// BeforeCreate 创建前钩子
func (r *WorkspaceRole) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}

// WorkspaceMember 工作空间成员
type WorkspaceMember struct {
	ID          uuid.UUID  `gorm:"type:char(36);primaryKey" json:"id"`
	WorkspaceID uuid.UUID  `gorm:"type:char(36);not null;index" json:"workspace_id"`
	UserID      uuid.UUID  `gorm:"type:char(36);not null;index" json:"user_id"`
	RoleID      *uuid.UUID `gorm:"type:char(36);index" json:"role_id"`
	Status      string     `gorm:"size:20;default:'active'" json:"status"`
	InvitedBy   *uuid.UUID `gorm:"type:char(36)" json:"invited_by"`
	JoinedAt    *time.Time `json:"joined_at"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`

	Workspace *Workspace     `gorm:"foreignKey:WorkspaceID" json:"workspace,omitempty"`
	User      *User          `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Role      *WorkspaceRole `gorm:"foreignKey:RoleID" json:"role,omitempty"`
}

// TableName 表名
func (WorkspaceMember) TableName() string {
	return "what_reverse_workspace_members"
}

// BeforeCreate 创建前钩子
func (m *WorkspaceMember) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}
