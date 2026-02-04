package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SupportAssignmentRule 支持工单自动分派规则
type SupportAssignmentRule struct {
	ID            uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	Name          string    `gorm:"size:120;not null" json:"name"`
	Priority      string    `gorm:"size:30;index" json:"priority"`
	Category      string    `gorm:"size:50;index" json:"category"`
	Channel       string    `gorm:"size:40;index" json:"channel"`
	Keyword       string    `gorm:"size:120" json:"keyword"`
	AssigneeType  string    `gorm:"size:30" json:"assignee_type"`
	AssigneeValue string    `gorm:"size:120" json:"assignee_value"`
	Enabled       bool      `gorm:"default:true" json:"enabled"`
	SortOrder     int       `gorm:"default:0" json:"sort_order"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// TableName 表名
func (SupportAssignmentRule) TableName() string {
	return "what_reverse_support_assignment_rules"
}

// BeforeCreate 创建前钩子
func (r *SupportAssignmentRule) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}
