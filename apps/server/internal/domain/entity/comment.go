package entity

// comment.go — Minimal stub for Comment type used by notification service.
// Full comment/community domain has been removed; only types referenced by core services remain.

import (
	"time"

	"github.com/google/uuid"
)

// Comment 评论（最小占位类型）
type Comment struct {
	ID         uuid.UUID  `gorm:"type:char(36);primaryKey" json:"id"`
	UserID     uuid.UUID  `gorm:"type:char(36);not null;index" json:"user_id"`
	TargetType string     `gorm:"type:varchar(50);not null" json:"target_type"`
	TargetID   uuid.UUID  `gorm:"type:char(36);not null;index" json:"target_id"`
	Content    string     `gorm:"type:text;not null" json:"content"`
	ParentID   *uuid.UUID `gorm:"type:char(36);index" json:"parent_id,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
}

// CommentLike 评论点赞（最小占位类型）
type CommentLike struct {
	ID        uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	CommentID uuid.UUID `gorm:"type:char(36);not null;index" json:"comment_id"`
	UserID    uuid.UUID `gorm:"type:char(36);not null;index" json:"user_id"`
	CreatedAt time.Time `json:"created_at"`
}
