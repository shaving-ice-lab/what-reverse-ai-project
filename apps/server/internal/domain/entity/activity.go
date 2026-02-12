package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// UserActivity 用户活动日志
type UserActivity struct {
	ID         uuid.UUID  `json:"id" gorm:"type:char(36);primaryKey"`
	UserID     uuid.UUID  `json:"user_id" gorm:"type:char(36);not null;index"`
	Action     string     `json:"action" gorm:"size:100;not null;index"`
	EntityType *string    `json:"entity_type,omitempty" gorm:"size:50"`
	EntityID   *uuid.UUID `json:"entity_id,omitempty" gorm:"type:char(36)"`
	Device     *string    `json:"device,omitempty" gorm:"size:200"`
	IP         *string    `json:"ip,omitempty" gorm:"size:45"`
	Location   *string    `json:"location,omitempty" gorm:"size:200"`
	UserAgent  *string    `json:"user_agent,omitempty" gorm:"type:text"`
	Metadata   JSON       `json:"metadata,omitempty" gorm:"type:json"`
	CreatedAt  time.Time  `json:"created_at"`
}

// TableName 设置表名
func (UserActivity) TableName() string {
	return "what_reverse_user_activities"
}

// BeforeCreate 创建前钩子
func (a *UserActivity) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}

// UserSession 用户会话（登录设备）
type UserSession struct {
	ID           uuid.UUID `json:"id" gorm:"type:char(36);primaryKey"`
	UserID       uuid.UUID `json:"user_id" gorm:"type:char(36);not null;index"`
	TokenHash    string    `json:"-" gorm:"size:64;not null;index"`
	DeviceType   string    `json:"device_type" gorm:"size:20;not null;default:'desktop'"`
	DeviceName   *string   `json:"device_name,omitempty" gorm:"size:100"`
	Browser      *string   `json:"browser,omitempty" gorm:"size:100"`
	OS           *string   `json:"os,omitempty" gorm:"size:100"`
	IP           *string   `json:"ip,omitempty" gorm:"size:45"`
	Location     *string   `json:"location,omitempty" gorm:"size:200"`
	UserAgent    *string   `json:"user_agent,omitempty" gorm:"type:text"`
	IsActive     bool      `json:"is_active" gorm:"default:true;index"`
	LastActiveAt time.Time `json:"last_active_at"`
	ExpiresAt    time.Time `json:"expires_at" gorm:"not null;index"`
	CreatedAt    time.Time `json:"created_at"`
}

// TableName 设置表名
func (UserSession) TableName() string {
	return "what_reverse_user_sessions"
}

// BeforeCreate 创建前钩子
func (s *UserSession) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}

// LoginDevice 登录设备响应结构
type LoginDevice struct {
	ID           string    `json:"id"`
	DeviceType   string    `json:"type"`
	DeviceName   string    `json:"name"`
	Browser      string    `json:"browser"`
	Location     string    `json:"location"`
	IP           string    `json:"ip"`
	IsCurrent    bool      `json:"is_current"`
	LastActiveAt time.Time `json:"last_active"`
}
