package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SupportQueue 支持队列
type SupportQueue struct {
	ID          uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	Name        string    `gorm:"size:120;not null" json:"name"`
	Description *string   `gorm:"type:text" json:"description,omitempty"`
	Enabled     bool      `gorm:"default:true" json:"enabled"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// TableName 表名
func (SupportQueue) TableName() string {
	return "what_reverse_support_queues"
}

// BeforeCreate 创建前钩子
func (q *SupportQueue) BeforeCreate(tx *gorm.DB) error {
	if q.ID == uuid.Nil {
		q.ID = uuid.New()
	}
	return nil
}
