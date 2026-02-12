package entity

// review.go — Minimal stubs for review types used by DB schema migration approval.
// Full review domain has been removed; only types referenced by core services remain.

import (
	"time"

	"github.com/google/uuid"
)

// ReviewItemType 审核项类型
type ReviewItemType string

const (
	ReviewItemTypeDBSchema ReviewItemType = "db_schema"
)

// ReviewStatus 审核状态
type ReviewStatus string

const (
	ReviewStatusPending  ReviewStatus = "pending"
	ReviewStatusInReview ReviewStatus = "in_review"
	ReviewStatusApproved ReviewStatus = "approved"
	ReviewStatusRejected ReviewStatus = "rejected"
	ReviewStatusRevision ReviewStatus = "revision"
)

// ReviewPriority 审核优先级
type ReviewPriority string

const (
	ReviewPriorityNormal ReviewPriority = "normal"
)

// ReviewQueue 审核队列
type ReviewQueue struct {
	ID             uuid.UUID      `gorm:"type:char(36);primaryKey" json:"id"`
	ItemType       ReviewItemType `gorm:"type:varchar(50);not null;index" json:"item_type"`
	ItemID         uuid.UUID      `gorm:"type:char(36);not null;index" json:"item_id"`
	SubmitterID    uuid.UUID      `gorm:"type:char(36);not null;index" json:"submitter_id"`
	ReviewerID     *uuid.UUID     `gorm:"type:char(36);index" json:"reviewer_id,omitempty"`
	Status         ReviewStatus   `gorm:"type:varchar(20);not null;default:pending;index" json:"status"`
	Priority       ReviewPriority `gorm:"type:varchar(20);not null;default:normal" json:"priority"`
	Title          string         `gorm:"type:varchar(200)" json:"title"`
	Description    *string        `gorm:"type:text" json:"description,omitempty"`
	SubmissionNote *string        `gorm:"type:text" json:"submission_note,omitempty"`
	Snapshot       JSON           `gorm:"type:json" json:"snapshot,omitempty"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
}

// ReviewRecord 审核记录
type ReviewRecord struct {
	ID         uuid.UUID     `gorm:"type:char(36);primaryKey" json:"id"`
	QueueID    uuid.UUID     `gorm:"type:char(36);not null;index" json:"queue_id"`
	ReviewerID uuid.UUID     `gorm:"type:char(36);not null" json:"reviewer_id"`
	Action     string        `gorm:"type:varchar(50);not null" json:"action"`
	FromStatus *ReviewStatus `gorm:"type:varchar(20)" json:"from_status,omitempty"`
	ToStatus   ReviewStatus  `gorm:"type:varchar(20);not null" json:"to_status"`
	Comment    *string       `gorm:"type:text" json:"comment,omitempty"`
	CreatedAt  time.Time     `json:"created_at"`
}

// ReviewComment 审核评论
type ReviewComment struct {
	ID         uuid.UUID  `gorm:"type:char(36);primaryKey" json:"id"`
	QueueID    uuid.UUID  `gorm:"type:char(36);not null;index" json:"queue_id"`
	UserID     uuid.UUID  `gorm:"type:char(36);not null" json:"user_id"`
	Content    string     `gorm:"type:text;not null" json:"content"`
	ResolvedAt *time.Time `json:"resolved_at,omitempty"`
	ResolvedBy *uuid.UUID `gorm:"type:char(36)" json:"resolved_by,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
}

// Reviewer 审核员
type Reviewer struct {
	ID            uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	UserID        uuid.UUID `gorm:"type:char(36);not null;uniqueIndex" json:"user_id"`
	Active        bool      `gorm:"default:true" json:"active"`
	TotalReviews  int       `gorm:"default:0" json:"total_reviews"`
	ApprovedCount int       `gorm:"default:0" json:"approved_count"`
	RejectedCount int       `gorm:"default:0" json:"rejected_count"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// ReviewStats 审核统计
type ReviewStats struct {
	ItemType ReviewItemType `json:"item_type"`
	Status   ReviewStatus   `json:"status"`
	Count    int64          `json:"count"`
}

// ReviewChecklist 审核检查项模板
type ReviewChecklist struct {
	ID        uuid.UUID      `gorm:"type:char(36);primaryKey" json:"id"`
	ItemType  ReviewItemType `gorm:"type:varchar(50);not null;uniqueIndex" json:"item_type"`
	Items     JSON           `gorm:"type:json" json:"items"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
}
