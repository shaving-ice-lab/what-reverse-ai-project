package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Tag 工作流标签
type Tag struct {
	ID        uuid.UUID `json:"id" gorm:"type:char(36);primaryKey"`
	UserID    uuid.UUID `json:"user_id" gorm:"type:char(36);not null;index"`
	Name      string    `json:"name" gorm:"size:50;not null"`
	Color     string    `json:"color" gorm:"size:20;default:'#3ECF8E'"`
	CreatedAt time.Time `json:"created_at"`
}

// TableName 设置表名
func (Tag) TableName() string {
	return "what_reverse_tags"
}

// BeforeCreate 创建前钩子
func (t *Tag) BeforeCreate(tx *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	return nil
}

// WorkflowTag 工作流标签关联
type WorkflowTag struct {
	ID         uuid.UUID `json:"id" gorm:"type:char(36);primaryKey"`
	WorkflowID uuid.UUID `json:"workflow_id" gorm:"type:char(36);not null;index"`
	TagID      uuid.UUID `json:"tag_id" gorm:"type:char(36);not null;index"`
	CreatedAt  time.Time `json:"created_at"`
}

// TableName 设置表名
func (WorkflowTag) TableName() string {
	return "what_reverse_workflow_tags"
}

// BeforeCreate 创建前钩子
func (wt *WorkflowTag) BeforeCreate(tx *gorm.DB) error {
	if wt.ID == uuid.Nil {
		wt.ID = uuid.New()
	}
	return nil
}

// TagWithCount 带使用数量的标签
type TagWithCount struct {
	Tag
	Count int64 `json:"count"`
}
