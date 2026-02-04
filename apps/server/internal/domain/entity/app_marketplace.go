package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AppRating 应用评分实体
type AppRating struct {
	ID     uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	AppID  uuid.UUID `gorm:"type:char(36);not null;index;uniqueIndex:uniq_app_rating" json:"app_id"`
	UserID uuid.UUID `gorm:"type:char(36);not null;index;uniqueIndex:uniq_app_rating" json:"user_id"`

	Rating  int     `gorm:"not null" json:"rating"`
	Comment *string `gorm:"type:text" json:"comment"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	User *User `gorm:"foreignKey:UserID" json:"user,omitempty"`
	App  *App  `gorm:"foreignKey:AppID" json:"app,omitempty"`
}

// TableName 表名
func (AppRating) TableName() string {
	return "what_reverse_app_ratings"
}

// BeforeCreate 创建前钩子
func (r *AppRating) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}
