package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// WebhookDeliveryStatus Webhook 投递状态
type WebhookDeliveryStatus string

const (
	WebhookDeliveryPending  WebhookDeliveryStatus = "pending"
	WebhookDeliveryRetrying WebhookDeliveryStatus = "retrying"
	WebhookDeliverySuccess  WebhookDeliveryStatus = "success"
	WebhookDeliveryFailed   WebhookDeliveryStatus = "failed"
)

// WebhookDelivery Webhook 投递记录
type WebhookDelivery struct {
	ID          uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	EndpointID  uuid.UUID `gorm:"type:char(36);not null;index" json:"endpoint_id"`
	WorkspaceID uuid.UUID `gorm:"type:char(36);not null;index" json:"workspace_id"`

	EventType string                `gorm:"size:100;not null;index" json:"event_type"`
	Status    WebhookDeliveryStatus `gorm:"size:20;not null;default:'pending'" json:"status"`

	AttemptCount int `gorm:"not null;default:0" json:"attempt_count"`
	MaxAttempts  int `gorm:"not null;default:3" json:"max_attempts"`

	LastAttemptAt  *time.Time `json:"last_attempt_at,omitempty"`
	NextRetryAt    *time.Time `json:"next_retry_at,omitempty"`
	LastStatusCode *int       `gorm:"type:int" json:"last_status_code,omitempty"`
	LastError      *string    `gorm:"type:text" json:"last_error,omitempty"`
	ResponseBody   *string    `gorm:"type:text" json:"response_body,omitempty"`

	Payload JSON `gorm:"type:json" json:"payload"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// TableName 表名
func (WebhookDelivery) TableName() string {
	return "what_reverse_webhook_deliveries"
}

// BeforeCreate 创建前钩子
func (w *WebhookDelivery) BeforeCreate(tx *gorm.DB) error {
	if w.ID == uuid.Nil {
		w.ID = uuid.New()
	}
	return nil
}
