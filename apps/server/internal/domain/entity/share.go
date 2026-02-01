package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Share 分享记录实体
type Share struct {
	ID           uuid.UUID      `gorm:"type:char(36);primaryKey" json:"id"`
	UserID       uuid.UUID      `gorm:"type:char(36);not null;index" json:"user_id"`
	TargetType   string         `gorm:"size:50;not null;index:idx_target" json:"target_type"` // 'agent', 'workflow', 'document'
	TargetID     uuid.UUID      `gorm:"type:char(36);not null;index:idx_target" json:"target_id"`
	ShareCode    string         `gorm:"size:20;uniqueIndex;not null" json:"share_code"`
	IsPublic     bool           `gorm:"default:true" json:"is_public"`
	Password     *string        `gorm:"size:100" json:"-"` // 不返回给前端
	ExpiresAt    *time.Time     `json:"expires_at,omitempty"`
	AllowCopy    bool           `gorm:"default:false" json:"allow_copy"`
	AllowComment bool           `gorm:"default:true" json:"allow_comment"`
	ViewCount    int            `gorm:"default:0" json:"view_count"`
	UniqueViews  int            `gorm:"default:0" json:"unique_views"`
	Metadata     JSON           `gorm:"type:json" json:"metadata,omitempty"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`

	// 关联
	User *User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// TableName 表名
func (Share) TableName() string {
	return "what_reverse_shares"
}

// BeforeCreate 创建前钩子
func (s *Share) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}

// IsExpired 检查分享是否过期
func (s *Share) IsExpired() bool {
	if s.ExpiresAt == nil {
		return false
	}
	return time.Now().After(*s.ExpiresAt)
}

// HasPassword 检查是否设置了密码
func (s *Share) HasPassword() bool {
	return s.Password != nil && *s.Password != ""
}

// ShareView 分享访问记录实体
type ShareView struct {
	ID        uuid.UUID  `gorm:"type:char(36);primaryKey" json:"id"`
	ShareID   uuid.UUID  `gorm:"type:char(36);not null;index" json:"share_id"`
	ViewerID  *uuid.UUID `gorm:"type:char(36);index" json:"viewer_id,omitempty"`
	IPAddress *string    `gorm:"size:45" json:"ip_address,omitempty"`
	UserAgent *string    `gorm:"type:text" json:"user_agent,omitempty"`
	Referer   *string    `gorm:"size:500" json:"referer,omitempty"`
	CreatedAt time.Time  `json:"created_at"`

	// 关联
	Share  *Share `gorm:"foreignKey:ShareID" json:"share,omitempty"`
	Viewer *User  `gorm:"foreignKey:ViewerID" json:"viewer,omitempty"`
}

// TableName 表名
func (ShareView) TableName() string {
	return "what_reverse_share_views"
}

// BeforeCreate 创建前钩子
func (v *ShareView) BeforeCreate(tx *gorm.DB) error {
	if v.ID == uuid.Nil {
		v.ID = uuid.New()
	}
	return nil
}

// ShareTargetType 分享目标类型
type ShareTargetType string

const (
	ShareTargetAgent    ShareTargetType = "agent"
	ShareTargetWorkflow ShareTargetType = "workflow"
	ShareTargetDocument ShareTargetType = "document"
)

// IsValidShareTargetType 验证分享目标类型
func IsValidShareTargetType(t string) bool {
	switch ShareTargetType(t) {
	case ShareTargetAgent, ShareTargetWorkflow, ShareTargetDocument:
		return true
	}
	return false
}

// SocialPlatform 社交平台类型
type SocialPlatform string

const (
	PlatformWeChat   SocialPlatform = "wechat"
	PlatformWeibo    SocialPlatform = "weibo"
	PlatformQQ       SocialPlatform = "qq"
	PlatformTwitter  SocialPlatform = "twitter"
	PlatformFacebook SocialPlatform = "facebook"
	PlatformLinkedIn SocialPlatform = "linkedin"
)

// IsValidSocialPlatform 验证社交平台类型
func IsValidSocialPlatform(p string) bool {
	switch SocialPlatform(p) {
	case PlatformWeChat, PlatformWeibo, PlatformQQ, PlatformTwitter, PlatformFacebook, PlatformLinkedIn:
		return true
	}
	return false
}
