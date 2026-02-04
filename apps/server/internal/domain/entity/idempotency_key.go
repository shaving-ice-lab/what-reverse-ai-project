package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// IdempotencyKey 幂等键记录
type IdempotencyKey struct {
	ID             uuid.UUID  `gorm:"type:char(36);primaryKey" json:"id"`
	OwnerUserID    uuid.UUID  `gorm:"type:char(36);not null;uniqueIndex:uniq_idempotency_key" json:"owner_user_id"`
	IdempotencyKey string     `gorm:"column:idempotency_key;size:100;not null;uniqueIndex:uniq_idempotency_key" json:"idempotency_key"`
	Action         string     `gorm:"size:50;not null;uniqueIndex:uniq_idempotency_key" json:"action"`
	WorkspaceID    *uuid.UUID `gorm:"type:char(36);index" json:"workspace_id,omitempty"`
	AppID          *uuid.UUID `gorm:"type:char(36);index" json:"app_id,omitempty"`
	ResourceID     *uuid.UUID `gorm:"type:char(36);index" json:"resource_id,omitempty"`
	ResourceType   string     `gorm:"size:50" json:"resource_type,omitempty"`
	RequestHash    string     `gorm:"size:64" json:"request_hash,omitempty"`
	Status         string     `gorm:"size:20;default:'processing'" json:"status"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

// TableName 表名
func (IdempotencyKey) TableName() string {
	return "what_reverse_idempotency_keys"
}

// BeforeCreate 创建前钩子
func (k *IdempotencyKey) BeforeCreate(tx *gorm.DB) error {
	if k.ID == uuid.Nil {
		k.ID = uuid.New()
	}
	return nil
}
