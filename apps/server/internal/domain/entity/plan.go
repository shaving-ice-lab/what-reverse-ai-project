package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// PlanModule 规划模块
type PlanModule struct {
	ID          uuid.UUID      `gorm:"type:char(36);primaryKey" json:"id"`
	WorkspaceID uuid.UUID      `gorm:"type:char(36);not null;index" json:"workspace_id"`
	Key         string         `gorm:"size:50;index" json:"key"`
	Name        string         `gorm:"size:120;not null" json:"name"`
	Description *string        `gorm:"type:text" json:"description,omitempty"`
	Version     string         `gorm:"size:20;default:'v1'" json:"version"`
	Status      string         `gorm:"size:20;default:'active'" json:"status"`
	SortOrder   int            `gorm:"default:0" json:"sort_order"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	Tasks []PlanTask `gorm:"foreignKey:ModuleID" json:"tasks,omitempty"`
}

// TableName 表名
func (PlanModule) TableName() string {
	return "what_reverse_plan_modules"
}

// BeforeCreate 创建前钩子
func (m *PlanModule) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	if m.Version == "" {
		m.Version = "v1"
	}
	if m.Status == "" {
		m.Status = "active"
	}
	return nil
}

// PlanTask 规划任务
type PlanTask struct {
	ID           uuid.UUID      `gorm:"type:char(36);primaryKey" json:"id"`
	ModuleID     uuid.UUID      `gorm:"type:char(36);not null;index" json:"module_id"`
	Code         string         `gorm:"size:80;index" json:"code"`
	Title        string         `gorm:"size:200;not null" json:"title"`
	Phase        string         `gorm:"size:40" json:"phase"`
	Owner        string         `gorm:"size:50" json:"owner"`
	Deliverable  string         `gorm:"type:text" json:"deliverable,omitempty"`
	Acceptance   string         `gorm:"type:text" json:"acceptance,omitempty"`
	EstimateDays int            `gorm:"default:0" json:"estimate_days"`
	Status       string         `gorm:"size:20;default:'todo'" json:"status"`
	Dependencies StringArray    `gorm:"type:json;column:dependencies_json" json:"dependencies,omitempty"`
	Sequence     int            `gorm:"default:0" json:"sequence"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

// TableName 表名
func (PlanTask) TableName() string {
	return "what_reverse_plan_tasks"
}

// BeforeCreate 创建前钩子
func (t *PlanTask) BeforeCreate(tx *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	if t.Status == "" {
		t.Status = "todo"
	}
	return nil
}

// PlanVersion 规划版本快照
type PlanVersion struct {
	ID          uuid.UUID      `gorm:"type:char(36);primaryKey" json:"id"`
	WorkspaceID uuid.UUID      `gorm:"type:char(36);not null;index" json:"workspace_id"`
	Label       *string        `gorm:"size:100" json:"label,omitempty"`
	Note        *string        `gorm:"type:text" json:"note,omitempty"`
	Snapshot    JSON           `gorm:"type:json;column:snapshot_json" json:"snapshot"`
	CreatedBy   *uuid.UUID     `gorm:"type:char(36)" json:"created_by,omitempty"`
	CreatedAt   time.Time      `json:"created_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

// TableName 表名
func (PlanVersion) TableName() string {
	return "what_reverse_plan_versions"
}

// BeforeCreate 创建前钩子
func (v *PlanVersion) BeforeCreate(tx *gorm.DB) error {
	if v.ID == uuid.Nil {
		v.ID = uuid.New()
	}
	return nil
}
