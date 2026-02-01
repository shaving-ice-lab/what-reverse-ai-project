package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// UserFollow 用户关注关系实体
type UserFollow struct {
	ID          uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	FollowerID  uuid.UUID `gorm:"type:char(36);not null;index" json:"follower_id"`
	FollowingID uuid.UUID `gorm:"type:char(36);not null;index" json:"following_id"`
	CreatedAt   time.Time `json:"created_at"`

	// 关联
	Follower  *User `gorm:"foreignKey:FollowerID" json:"follower,omitempty"`
	Following *User `gorm:"foreignKey:FollowingID" json:"following,omitempty"`
}

// TableName 表名
func (UserFollow) TableName() string {
	return "what_reverse_user_follows"
}

// BeforeCreate 创建前钩子
func (f *UserFollow) BeforeCreate(tx *gorm.DB) error {
	if f.ID == uuid.Nil {
		f.ID = uuid.New()
	}
	return nil
}
