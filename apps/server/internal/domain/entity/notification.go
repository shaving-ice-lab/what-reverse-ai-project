package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Notification 通知实体
type Notification struct {
	ID         uuid.UUID  `gorm:"type:char(36);primaryKey" json:"id"`
	UserID     uuid.UUID  `gorm:"type:char(36);not null;index" json:"user_id"`
	Type       string     `gorm:"size:50;not null;index" json:"type"` // 'follow', 'comment', 'reply', 'like', 'mention', 'system', 'income'
	Title      string     `gorm:"size:200;not null" json:"title"`
	Content    *string    `gorm:"type:text" json:"content,omitempty"`
	ActorID    *uuid.UUID `gorm:"type:char(36);index" json:"actor_id,omitempty"`
	TargetType *string    `gorm:"size:50" json:"target_type,omitempty"`
	TargetID   *uuid.UUID `gorm:"type:char(36)" json:"target_id,omitempty"`
	Metadata   JSON       `gorm:"type:json" json:"metadata,omitempty"`
	IsRead     bool       `gorm:"default:false" json:"is_read"`
	ReadAt     *time.Time `json:"read_at,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`

	// 关联
	User  *User `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Actor *User `gorm:"foreignKey:ActorID" json:"actor,omitempty"`
}

// TableName 表名
func (Notification) TableName() string {
	return "what_reverse_notifications"
}

// BeforeCreate 创建前钩子
func (n *Notification) BeforeCreate(tx *gorm.DB) error {
	if n.ID == uuid.Nil {
		n.ID = uuid.New()
	}
	return nil
}

// NotificationType 通知类型
type NotificationType string

const (
	NotificationTypeFollow  NotificationType = "follow"
	NotificationTypeComment NotificationType = "comment"
	NotificationTypeReply   NotificationType = "reply"
	NotificationTypeLike    NotificationType = "like"
	NotificationTypeMention NotificationType = "mention"
	NotificationTypeSystem  NotificationType = "system"
	NotificationTypeIncome  NotificationType = "income"
)
