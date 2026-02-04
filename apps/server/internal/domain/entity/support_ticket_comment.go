package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SupportTicketComment 工单评论
type SupportTicketComment struct {
	ID           uuid.UUID  `gorm:"type:char(36);primaryKey" json:"id"`
	TicketID     uuid.UUID  `gorm:"type:char(36);index" json:"ticket_id"`
	AuthorUserID *uuid.UUID `gorm:"type:char(36);index" json:"author_user_id,omitempty"`
	AuthorName   *string    `gorm:"size:120" json:"author_name,omitempty"`
	Body         string     `gorm:"type:text;not null" json:"body"`
	IsInternal   bool       `gorm:"default:true" json:"is_internal"`
	CreatedAt    time.Time  `json:"created_at"`
}

// TableName 表名
func (SupportTicketComment) TableName() string {
	return "what_reverse_support_ticket_comments"
}

// BeforeCreate 创建前钩子
func (c *SupportTicketComment) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}
