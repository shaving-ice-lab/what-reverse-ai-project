package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SupportTicket 客户支持工单
type SupportTicket struct {
	ID               uuid.UUID  `gorm:"type:char(36);primaryKey" json:"id"`
	Reference        string     `gorm:"size:40;uniqueIndex" json:"reference"`
	WorkspaceID      *uuid.UUID `gorm:"type:char(36);index" json:"workspace_id,omitempty"`
	AppID            *uuid.UUID `gorm:"type:char(36);index" json:"app_id,omitempty"`
	RequesterUserID  *uuid.UUID `gorm:"type:char(36);index" json:"requester_user_id,omitempty"`
	RequesterName    string     `gorm:"size:120" json:"requester_name,omitempty"`
	RequesterEmail   string     `gorm:"size:255;not null;index" json:"requester_email"`
	Subject          string     `gorm:"size:255;not null" json:"subject"`
	Description      string     `gorm:"type:text;not null" json:"description"`
	Category         string     `gorm:"size:50;index" json:"category"`
	Priority         string     `gorm:"size:30;index" json:"priority"`
	Status           string     `gorm:"size:30;index" json:"status"`
	StatusNote       *string    `gorm:"type:text" json:"status_note,omitempty"`
	Channel          string     `gorm:"size:40;index" json:"channel"`
	AssigneeType     *string    `gorm:"size:30" json:"assignee_type,omitempty"`
	AssigneeValue    *string    `gorm:"size:120" json:"assignee_value,omitempty"`
	AssignedAt       *time.Time `json:"assigned_at,omitempty"`
	SLAResponseDueAt *time.Time `json:"sla_response_due_at,omitempty"`
	SLAUpdateDueAt   *time.Time `json:"sla_update_due_at,omitempty"`
	SLAResolveDueAt  *time.Time `json:"sla_resolve_due_at,omitempty"`
	Metadata         JSON       `gorm:"column:metadata_json;type:json" json:"metadata,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

// TableName 表名
func (SupportTicket) TableName() string {
	return "what_reverse_support_tickets"
}

// BeforeCreate 创建前钩子
func (t *SupportTicket) BeforeCreate(tx *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	return nil
}
