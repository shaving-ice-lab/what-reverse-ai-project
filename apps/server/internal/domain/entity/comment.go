package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Comment 评论实体
type Comment struct {
	ID            uuid.UUID      `gorm:"type:char(36);primaryKey" json:"id"`
	UserID        uuid.UUID      `gorm:"type:char(36);not null;index" json:"user_id"`
	TargetType    string         `gorm:"size:50;not null;index:idx_target" json:"target_type"` // 'agent', 'workflow', 'document'
	TargetID      uuid.UUID      `gorm:"type:char(36);not null;index:idx_target" json:"target_id"`
	ParentID      *uuid.UUID     `gorm:"type:char(36);index" json:"parent_id,omitempty"`
	ReplyToUserID *uuid.UUID     `gorm:"type:char(36)" json:"reply_to_user_id,omitempty"`
	Content       string         `gorm:"type:text;not null" json:"content"`
	LikeCount     int            `gorm:"default:0" json:"like_count"`
	ReplyCount    int            `gorm:"default:0" json:"reply_count"`
	IsPinned      bool           `gorm:"default:false" json:"is_pinned"`
	IsHidden      bool           `gorm:"default:false" json:"is_hidden"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`

	// 关联
	User        *User     `gorm:"foreignKey:UserID" json:"user,omitempty"`
	ReplyToUser *User     `gorm:"foreignKey:ReplyToUserID" json:"reply_to_user,omitempty"`
	Replies     []Comment `gorm:"foreignKey:ParentID" json:"replies,omitempty"`
	Parent      *Comment  `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
}

// TableName 表名
func (Comment) TableName() string {
	return "what_reverse_comments"
}

// BeforeCreate 创建前钩子
func (c *Comment) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

// CommentTargetType 评论目标类型
type CommentTargetType string

const (
	CommentTargetAgent    CommentTargetType = "agent"
	CommentTargetWorkflow CommentTargetType = "workflow"
	CommentTargetDocument CommentTargetType = "document"
)

// IsValidCommentTargetType 验证评论目标类型
func IsValidCommentTargetType(t string) bool {
	switch CommentTargetType(t) {
	case CommentTargetAgent, CommentTargetWorkflow, CommentTargetDocument:
		return true
	}
	return false
}

// CommentLike 评论点赞实体
type CommentLike struct {
	ID        uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	UserID    uuid.UUID `gorm:"type:char(36);not null;index;uniqueIndex:idx_user_comment" json:"user_id"`
	CommentID uuid.UUID `gorm:"type:char(36);not null;index;uniqueIndex:idx_user_comment" json:"comment_id"`
	CreatedAt time.Time `json:"created_at"`

	// 关联
	User    *User    `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Comment *Comment `gorm:"foreignKey:CommentID" json:"comment,omitempty"`
}

// TableName 表名
func (CommentLike) TableName() string {
	return "what_reverse_comment_likes"
}

// BeforeCreate 创建前钩子
func (l *CommentLike) BeforeCreate(tx *gorm.DB) error {
	if l.ID == uuid.Nil {
		l.ID = uuid.New()
	}
	return nil
}
