package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SupportQueueMember 支持队列成员
type SupportQueueMember struct {
	ID        uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	QueueID   uuid.UUID `gorm:"type:char(36);index" json:"queue_id"`
	UserID    uuid.UUID `gorm:"type:char(36);index" json:"user_id"`
	SortOrder int       `gorm:"default:0" json:"sort_order"`
	CreatedAt time.Time `json:"created_at"`
}

// TableName 表名
func (SupportQueueMember) TableName() string {
	return "what_reverse_support_queue_members"
}

// BeforeCreate 创建前钩子
func (m *SupportQueueMember) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}
