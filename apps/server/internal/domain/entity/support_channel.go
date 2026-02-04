package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SupportChannel 支持渠道配置
type SupportChannel struct {
	ID          uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	Key         string    `gorm:"size:50;uniqueIndex" json:"key"`
	Name        string    `gorm:"size:120;not null" json:"name"`
	Description *string   `gorm:"type:text" json:"description,omitempty"`
	Contact     *string   `gorm:"size:255" json:"contact,omitempty"`
	SLAOverrides JSON      `gorm:"column:sla_overrides_json;type:json" json:"sla_overrides,omitempty"`
	Enabled     bool      `gorm:"default:true" json:"enabled"`
	SortOrder   int       `gorm:"default:0" json:"sort_order"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// TableName 表名
func (SupportChannel) TableName() string {
	return "what_reverse_support_channels"
}

// BeforeCreate 创建前钩子
func (c *SupportChannel) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}
