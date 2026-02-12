package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// RLSPolicy 行级安全策略
// 定义某张表的某个列必须匹配当前登录用户的某个属性
type RLSPolicy struct {
	ID          uuid.UUID      `gorm:"type:char(36);primaryKey" json:"id"`
	WorkspaceID uuid.UUID      `gorm:"type:char(36);not null;index" json:"workspace_id"`
	TblName     string         `gorm:"column:table_name;size:200;not null;index" json:"table_name"`
	Column      string         `gorm:"size:200;not null" json:"column"`
	MatchField  string         `gorm:"size:100;not null;default:'app_user_id'" json:"match_field"`
	Operation   string         `gorm:"size:50;not null;default:'all'" json:"operation"`
	Enabled     bool           `gorm:"default:true" json:"enabled"`
	Description string         `gorm:"size:500" json:"description"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

func (RLSPolicy) TableName() string {
	return "rls_policies"
}
