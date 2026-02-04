package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// WebhookEndpoint Webhook 订阅端点
type WebhookEndpoint struct {
	ID          uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	WorkspaceID uuid.UUID `gorm:"type:char(36);not null;index" json:"workspace_id"`

	Name            string      `gorm:"size:120;not null" json:"name"`
	URL             string      `gorm:"type:text;not null" json:"url"`
	Events          StringArray `gorm:"type:json" json:"events"`
	SigningEnabled  bool        `gorm:"default:true" json:"signing_enabled"`
	SecretEncrypted string      `gorm:"type:text" json:"-"`
	SecretPreview   *string     `gorm:"size:20" json:"secret_preview,omitempty"`

	IsActive        bool       `gorm:"default:true" json:"is_active"`
	LastTriggeredAt *time.Time `json:"last_triggered_at,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// TableName 表名
func (WebhookEndpoint) TableName() string {
	return "what_reverse_webhook_endpoints"
}

// BeforeCreate 创建前钩子
func (w *WebhookEndpoint) BeforeCreate(tx *gorm.DB) error {
	if w.ID == uuid.Nil {
		w.ID = uuid.New()
	}
	return nil
}
