package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AppUser 应用运行时用户（应用自身的用户，区别于平台用户 User）
type AppUser struct {
	ID           uuid.UUID  `gorm:"type:char(36);primaryKey" json:"id"`
	WorkspaceID  uuid.UUID  `gorm:"type:char(36);not null;uniqueIndex:uniq_app_user_email" json:"workspace_id"`
	Email        string     `gorm:"size:255;not null;uniqueIndex:uniq_app_user_email" json:"email"`
	PasswordHash string     `gorm:"size:255;not null" json:"-"`
	DisplayName  *string    `gorm:"size:100" json:"display_name"`
	Role         string     `gorm:"size:20;not null;default:'user'" json:"role"`
	Status       string     `gorm:"size:20;not null;default:'active'" json:"status"`
	LastLoginAt  *time.Time `json:"last_login_at"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`

	Workspace *Workspace `gorm:"foreignKey:WorkspaceID" json:"workspace,omitempty"`
}

func (AppUser) TableName() string {
	return "what_reverse_app_users"
}

func (u *AppUser) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}
