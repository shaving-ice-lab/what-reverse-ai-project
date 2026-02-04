package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// WorkspaceDatabase 工作空间数据库连接信息
type WorkspaceDatabase struct {
	ID          uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	WorkspaceID uuid.UUID `gorm:"type:char(36);not null;uniqueIndex" json:"workspace_id"`
	DBName      string    `gorm:"column:db_name;size:100;not null" json:"db_name"`
	DBUser      string    `gorm:"column:db_user;size:100;not null" json:"db_user"`
	DBHost      *string   `gorm:"column:db_host;size:255" json:"db_host"`
	DBPort      *int      `gorm:"column:db_port" json:"db_port"`
	SecretRef   *string   `gorm:"column:secret_ref;size:200" json:"-"`
	Status      string    `gorm:"size:20;default:'pending';index" json:"status"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	Workspace *Workspace `gorm:"foreignKey:WorkspaceID" json:"workspace,omitempty"`
}

// TableName 表名
func (WorkspaceDatabase) TableName() string {
	return "what_reverse_workspace_databases"
}

// BeforeCreate 创建前钩子
func (d *WorkspaceDatabase) BeforeCreate(tx *gorm.DB) error {
	if d.ID == uuid.Nil {
		d.ID = uuid.New()
	}
	return nil
}
