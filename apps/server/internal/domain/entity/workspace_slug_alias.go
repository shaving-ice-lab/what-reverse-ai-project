package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// WorkspaceSlugAlias 工作空间 slug 别名
type WorkspaceSlugAlias struct {
	ID          uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	WorkspaceID uuid.UUID `gorm:"type:char(36);not null;index" json:"workspace_id"`
	Slug        string    `gorm:"size:100;not null;uniqueIndex" json:"slug"`
	CreatedAt   time.Time `json:"created_at"`

	Workspace *Workspace `gorm:"foreignKey:WorkspaceID" json:"workspace,omitempty"`
}

// TableName 表名
func (WorkspaceSlugAlias) TableName() string {
	return "what_reverse_workspace_slug_aliases"
}

// BeforeCreate 创建前钩子
func (alias *WorkspaceSlugAlias) BeforeCreate(tx *gorm.DB) error {
	if alias.ID == uuid.Nil {
		alias.ID = uuid.New()
	}
	return nil
}
