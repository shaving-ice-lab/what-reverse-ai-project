package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AgentSession Agent 对话会话实体
type AgentSession struct {
	ID            uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	WorkspaceID   uuid.UUID `gorm:"type:char(36);not null;index:idx_agent_sessions_workspace" json:"workspace_id"`
	UserID        uuid.UUID `gorm:"type:char(36);not null;index:idx_agent_sessions_user" json:"user_id"`
	Status        string    `gorm:"size:20;not null;default:'running';index:idx_agent_sessions_status" json:"status"`
	Messages      JSON      `gorm:"column:messages;type:json" json:"messages"`
	ToolCalls     JSON      `gorm:"column:tool_calls;type:json" json:"tool_calls"`
	PendingAction JSON      `gorm:"column:pending_action;type:json" json:"pending_action"`
	Plan          JSON      `gorm:"column:plan;type:json" json:"plan"`
	Meta          JSON      `gorm:"column:meta;type:json" json:"meta"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

func (AgentSession) TableName() string {
	return "what_reverse_agent_sessions"
}

func (s *AgentSession) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}
