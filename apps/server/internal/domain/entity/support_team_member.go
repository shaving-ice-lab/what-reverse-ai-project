package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SupportTeamMember 支持团队成员
type SupportTeamMember struct {
	ID        uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	TeamID    uuid.UUID `gorm:"type:char(36);index" json:"team_id"`
	UserID    uuid.UUID `gorm:"type:char(36);index" json:"user_id"`
	Role      *string   `gorm:"size:50" json:"role,omitempty"`
	SortOrder int       `gorm:"default:0" json:"sort_order"`
	CreatedAt time.Time `json:"created_at"`
}

// TableName 表名
func (SupportTeamMember) TableName() string {
	return "what_reverse_support_team_members"
}

// BeforeCreate 创建前钩子
func (m *SupportTeamMember) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}
