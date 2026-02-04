package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ConfigItem 配置中心条目
type ConfigItem struct {
	ID             uuid.UUID  `gorm:"type:char(36);primaryKey" json:"id"`
	ScopeType      string     `gorm:"size:20;not null;index" json:"scope_type"`
	ScopeID        *uuid.UUID `gorm:"type:char(36);index" json:"scope_id,omitempty"`
	ConfigKey      string     `gorm:"column:config_key;size:200;not null;index" json:"key"`
	ValueEncrypted string     `gorm:"type:text;not null" json:"-"`
	ValuePreview   *string    `gorm:"size:20" json:"value_preview,omitempty"`
	ValueType      string     `gorm:"size:30;default:'string'" json:"value_type"`
	IsSecret       bool       `gorm:"default:false" json:"is_secret"`
	IsActive       bool       `gorm:"default:true;index" json:"is_active"`
	Description    *string    `gorm:"type:text" json:"description,omitempty"`
	UpdatedBy      *uuid.UUID `gorm:"type:char(36)" json:"updated_by,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// TableName 表名
func (ConfigItem) TableName() string {
	return "what_reverse_config_items"
}

// BeforeCreate 创建前钩子
func (c *ConfigItem) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}
