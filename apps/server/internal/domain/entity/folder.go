package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Folder 文件夹实体
type Folder struct {
	ID            uuid.UUID      `gorm:"type:char(36);primaryKey" json:"id"`
	UserID        uuid.UUID      `gorm:"type:char(36);not null;index" json:"user_id"`
	Name          string         `gorm:"size:100;not null" json:"name"`
	Icon          string         `gorm:"size:50;default:'📁'" json:"icon"`
	Color         string         `gorm:"size:20;default:'#3ECF8E'" json:"color"`
	ParentID      *uuid.UUID     `gorm:"type:char(36);index" json:"parent_id"`
	SortOrder     int            `gorm:"default:0" json:"sort_order"`
	WorkflowCount int            `gorm:"-" json:"workflow_count"` // 计算字段，不存储
	IsSystem      bool           `gorm:"default:false" json:"is_system"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`

	// 关联
	User     *User     `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Parent   *Folder   `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
	Children []Folder  `gorm:"foreignKey:ParentID" json:"children,omitempty"`
}

// TableName 表名
func (Folder) TableName() string {
	return "what_reverse_folders"
}

// BeforeCreate 创建前钩子
func (f *Folder) BeforeCreate(tx *gorm.DB) error {
	if f.ID == uuid.Nil {
		f.ID = uuid.New()
	}
	if f.Icon == "" {
		f.Icon = "📁"
	}
	if f.Color == "" {
		f.Color = "#3ECF8E"
	}
	return nil
}
