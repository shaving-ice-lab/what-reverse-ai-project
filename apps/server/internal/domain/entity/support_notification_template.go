package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SupportNotificationTemplate 支持通知模板配置
type SupportNotificationTemplate struct {
	ID         uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	Key        string    `gorm:"size:50;uniqueIndex" json:"key"`
	Template   JSON      `gorm:"column:template_json;type:json" json:"template"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// TableName 表名
func (SupportNotificationTemplate) TableName() string {
	return "what_reverse_support_notification_templates"
}

// BeforeCreate 创建前钩子
func (t *SupportNotificationTemplate) BeforeCreate(tx *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	return nil
}
