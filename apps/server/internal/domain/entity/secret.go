package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Secret 机密凭证实体
type Secret struct {
	ID             uuid.UUID  `gorm:"type:char(36);primaryKey" json:"id"`
	OwnerType      string     `gorm:"size:20;not null;index" json:"owner_type"`
	OwnerID        uuid.UUID  `gorm:"type:char(36);not null;index" json:"owner_id"`
	SecretType     string     `gorm:"size:50;not null;index" json:"secret_type"`
	Name           string     `gorm:"size:100;not null" json:"name"`
	Description    *string    `gorm:"type:text" json:"description,omitempty"`
	ValueEncrypted string     `gorm:"type:text;not null" json:"-"`
	ValuePreview   *string    `gorm:"size:20" json:"value_preview,omitempty"`
	Status         string     `gorm:"size:20;default:'active';index" json:"status"`
	ExpiresAt      *time.Time `json:"expires_at,omitempty"`
	LastUsedAt     *time.Time `json:"last_used_at,omitempty"`
	LastRotatedAt  *time.Time `json:"last_rotated_at,omitempty"`
	RevokedAt      *time.Time `json:"revoked_at,omitempty"`
	RevokedBy      *uuid.UUID `gorm:"type:char(36)" json:"revoked_by,omitempty"`
	RevokedReason  *string    `gorm:"size:255" json:"revoked_reason,omitempty"`
	Metadata       JSON       `gorm:"type:json" json:"metadata,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// TableName 表名
func (Secret) TableName() string {
	return "what_reverse_secrets"
}

// BeforeCreate 创建前钩子
func (s *Secret) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}
