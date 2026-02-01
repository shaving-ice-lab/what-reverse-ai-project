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

// Announcement 系统公告
type Announcement struct {
	ID          uuid.UUID  `json:"id" gorm:"type:char(36);primaryKey"`
	Title       string     `json:"title" gorm:"size:200;not null"`
	Description string     `json:"description" gorm:"type:text;not null"`
	Type        string     `json:"type" gorm:"size:50;not null;default:'notice';index"`
	Priority    int        `json:"priority" gorm:"default:0;index"`
	IsActive    bool       `json:"is_active" gorm:"default:true;index"`
	StartsAt    time.Time  `json:"starts_at"`
	EndsAt      *time.Time `json:"ends_at,omitempty"`
	TargetUsers JSON       `json:"target_users,omitempty" gorm:"type:json"`
	Metadata    JSON       `json:"metadata,omitempty" gorm:"type:json"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// TableName 设置表名
func (Announcement) TableName() string {
	return "what_reverse_announcements"
}

// BeforeCreate 创建前钩子
func (a *Announcement) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}

// AnnouncementRead 公告已读记录
type AnnouncementRead struct {
	ID             uuid.UUID `json:"id" gorm:"type:char(36);primaryKey"`
	AnnouncementID uuid.UUID `json:"announcement_id" gorm:"type:char(36);not null;index"`
	UserID         uuid.UUID `json:"user_id" gorm:"type:char(36);not null;index"`
	ReadAt         time.Time `json:"read_at"`
}

// TableName 设置表名
func (AnnouncementRead) TableName() string {
	return "what_reverse_announcement_reads"
}

// BeforeCreate 创建前钩子
func (ar *AnnouncementRead) BeforeCreate(tx *gorm.DB) error {
	if ar.ID == uuid.Nil {
		ar.ID = uuid.New()
	}
	return nil
}

// SystemHealth 系统健康状态
type SystemHealth struct {
	Name      string `json:"name"`
	Status    string `json:"status"`
	LatencyMs int64  `json:"latency_ms"`
	Icon      string `json:"icon,omitempty"`
}
