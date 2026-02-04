package entity

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// User 用户实体
type User struct {
	ID          uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	Email       string    `gorm:"uniqueIndex;not null;size:255" json:"email"`
	Username    string    `gorm:"uniqueIndex;not null;size:50" json:"username"`
	DisplayName *string   `gorm:"size:100" json:"display_name"`
	AvatarURL   *string   `gorm:"size:500" json:"avatar_url"`
	Bio         *string   `gorm:"type:text" json:"bio"`

	// 认证相关
	PasswordHash  string `gorm:"size:255" json:"-"`
	EmailVerified bool   `gorm:"default:false" json:"email_verified"`

	// OAuth 关联
	GithubID *string `gorm:"size:50" json:"-"`
	GoogleID *string `gorm:"size:50" json:"-"`

	// 配置
	Settings JSON `gorm:"type:json" json:"settings"`

	// 角色与状态
	Role            string     `gorm:"size:20;default:'user';index" json:"role"`
	Status          string     `gorm:"size:20;default:'active';index" json:"status"`
	StatusReason    *string    `gorm:"size:255" json:"status_reason,omitempty"`
	StatusUpdatedAt *time.Time `json:"status_updated_at,omitempty"`

	// 统计
	WorkflowCount  int `gorm:"default:0" json:"workflow_count"`
	AgentCount     int `gorm:"default:0" json:"agent_count"`
	FollowerCount  int `gorm:"default:0" json:"follower_count"`
	FollowingCount int `gorm:"default:0" json:"following_count"`

	// 订阅
	Plan          string     `gorm:"size:20;default:'free'" json:"plan"`
	PlanExpiresAt *time.Time `json:"plan_expires_at"`

	// 时间戳
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	LastLoginAt *time.Time     `json:"last_login_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

// TableName 表名
func (User) TableName() string {
	return "what_reverse_users"
}

// BeforeCreate 创建前钩子
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

// JSON 类型 - 用于 MySQL JSON 字段
type JSON map[string]interface{}

// Value 实现 driver.Valuer 接口
func (j JSON) Value() (driver.Value, error) {
	if j == nil {
		return nil, nil
	}
	return json.Marshal(j)
}

// Scan 实现 sql.Scanner 接口
func (j *JSON) Scan(value interface{}) error {
	if value == nil {
		*j = nil
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(bytes, j)
}

// StringArray 字符串数组类型 - 用于 MySQL JSON 字段存储字符串数组
type StringArray []string

// Value 实现 driver.Valuer 接口
func (a StringArray) Value() (driver.Value, error) {
	if a == nil {
		return "[]", nil
	}
	return json.Marshal(a)
}

// Scan 实现 sql.Scanner 接口
func (a *StringArray) Scan(value interface{}) error {
	if value == nil {
		*a = nil
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(bytes, a)
}
