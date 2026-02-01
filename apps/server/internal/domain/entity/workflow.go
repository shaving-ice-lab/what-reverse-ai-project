package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Workflow 工作流实体
type Workflow struct {
	ID            uuid.UUID      `gorm:"type:char(36);primaryKey" json:"id"`
	UserID        uuid.UUID      `gorm:"type:char(36);not null;index" json:"user_id"`

	// 基础信息
	Name          string         `gorm:"size:200;not null" json:"name"`
	Description   *string        `gorm:"type:text" json:"description"`
	Icon          string         `gorm:"size:50;default:'📋'" json:"icon"`

	// 工作流定义 (JSON)
	Definition    JSON           `gorm:"type:json;not null" json:"definition"`
	Variables     JSON           `gorm:"type:json" json:"variables"`

	// 状态
	Status        string         `gorm:"size:20;default:'draft'" json:"status"`
	IsPublic      bool           `gorm:"default:false" json:"is_public"`

	// 执行配置
	TriggerType   string         `gorm:"size:50;default:'manual'" json:"trigger_type"`
	TriggerConfig JSON           `gorm:"type:json" json:"trigger_config"`

	// 统计
	RunCount      int            `gorm:"default:0" json:"run_count"`
	StarCount     int            `gorm:"default:0" json:"star_count"`
	ForkCount     int            `gorm:"default:0" json:"fork_count"`

	// 版本
	Version       int            `gorm:"default:1" json:"version"`

	// 时间戳
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	PublishedAt   *time.Time     `json:"published_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`

	// 文件夹
	FolderID      *uuid.UUID     `gorm:"type:char(36)" json:"folder_id"`

	// 关联
	User          *User          `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// TableName 表名
func (Workflow) TableName() string {
	return "what_reverse_workflows"
}

// BeforeCreate 创建前钩子
func (w *Workflow) BeforeCreate(tx *gorm.DB) error {
	if w.ID == uuid.Nil {
		w.ID = uuid.New()
	}
	return nil
}
