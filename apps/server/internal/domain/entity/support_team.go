package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SupportTeam 支持团队
type SupportTeam struct {
	ID          uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	Name        string    `gorm:"size:120;not null" json:"name"`
	Description *string   `gorm:"type:text" json:"description,omitempty"`
	Enabled     bool      `gorm:"default:true" json:"enabled"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// TableName 表名
func (SupportTeam) TableName() string {
	return "what_reverse_support_teams"
}

// BeforeCreate 创建前钩子
func (t *SupportTeam) BeforeCreate(tx *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	return nil
}
