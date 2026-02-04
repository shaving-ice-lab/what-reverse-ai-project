package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AppSession 应用会话（匿名/实名）
type AppSession struct {
	ID            uuid.UUID  `gorm:"type:char(36);primaryKey" json:"id"`
	AppID         uuid.UUID  `gorm:"type:char(36);not null;index" json:"app_id"`
	WorkspaceID   uuid.UUID  `gorm:"type:char(36);not null;index" json:"workspace_id"`
	SessionType   string     `gorm:"size:20;default:'anon';index" json:"session_type"`
	UserID        *uuid.UUID `gorm:"type:char(36);index" json:"user_id"`
	IPHash        *string    `gorm:"size:100" json:"ip_hash"`
	UserAgentHash *string    `gorm:"size:200" json:"user_agent_hash"`
	CreatedAt     time.Time  `json:"created_at"`
	ExpiredAt     *time.Time `json:"expired_at"`
	BlockedAt     *time.Time `json:"blocked_at"`
	BlockedReason *string    `gorm:"size:255" json:"blocked_reason"`

	App       *App       `gorm:"foreignKey:AppID" json:"app,omitempty"`
	Workspace *Workspace `gorm:"foreignKey:WorkspaceID" json:"workspace,omitempty"`
	User      *User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// TableName 表名
func (AppSession) TableName() string {
	return "what_reverse_app_sessions"
}

// BeforeCreate 创建前钩子
func (s *AppSession) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}

// AppEvent 应用事件记录
type AppEvent struct {
	ID        uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	AppID     uuid.UUID `gorm:"type:char(36);not null;index" json:"app_id"`
	SessionID uuid.UUID `gorm:"type:char(36);not null;index" json:"session_id"`
	EventType string    `gorm:"size:50;not null;index" json:"event_type"`
	Payload   JSON      `gorm:"column:payload_json;type:json" json:"payload"`
	CreatedAt time.Time `json:"created_at"`

	App     *App        `gorm:"foreignKey:AppID" json:"app,omitempty"`
	Session *AppSession `gorm:"foreignKey:SessionID" json:"session,omitempty"`
}

// TableName 表名
func (AppEvent) TableName() string {
	return "what_reverse_app_events"
}

// BeforeCreate 创建前钩子
func (e *AppEvent) BeforeCreate(tx *gorm.DB) error {
	if e.ID == uuid.Nil {
		e.ID = uuid.New()
	}
	return nil
}
