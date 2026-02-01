package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// APIKey API 密钥实体
type APIKey struct {
	ID     uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	UserID uuid.UUID `gorm:"type:char(36);not null;index" json:"user_id"`

	Provider     string  `gorm:"size:50;not null" json:"provider"`
	Name         string  `gorm:"size:100;not null" json:"name"`
	KeyEncrypted string  `gorm:"type:text;not null" json:"-"`
	KeyPreview   *string `gorm:"size:20" json:"key_preview"`

	IsActive   bool       `gorm:"default:true" json:"is_active"`
	LastUsedAt *time.Time `json:"last_used_at"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// TableName 表名
func (APIKey) TableName() string {
	return "what_reverse_api_keys"
}

// BeforeCreate 创建前钩子
func (a *APIKey) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}

// Providers API 提供商列表
var Providers = []string{
	"openai",
	"anthropic",
	"google",
	"azure",
	"deepseek",
	"moonshot",
	"zhipu",
	"baichuan",
	"ollama",
}

// IsValidProvider 检查是否是有效的提供商
func IsValidProvider(provider string) bool {
	for _, p := range Providers {
		if p == provider {
			return true
		}
	}
	return false
}
