package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AppSlugAlias App slug 别名
type AppSlugAlias struct {
	ID          uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	AppID       uuid.UUID `gorm:"type:char(36);not null;index" json:"app_id"`
	WorkspaceID uuid.UUID `gorm:"type:char(36);not null;index" json:"workspace_id"`
	Slug        string    `gorm:"size:100;not null" json:"slug"`
	CreatedAt   time.Time `json:"created_at"`

	App       *App       `gorm:"foreignKey:AppID" json:"app,omitempty"`
	Workspace *Workspace `gorm:"foreignKey:WorkspaceID" json:"workspace,omitempty"`
}

// TableName 表名
func (AppSlugAlias) TableName() string {
	return "what_reverse_app_slug_aliases"
}

// BeforeCreate 创建前钩子
func (alias *AppSlugAlias) BeforeCreate(tx *gorm.DB) error {
	if alias.ID == uuid.Nil {
		alias.ID = uuid.New()
	}
	return nil
}
