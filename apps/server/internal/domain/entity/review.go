package entity

import (
	"database/sql/driver"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ReviewStatus 审核状态
type ReviewStatus string

const (
	ReviewStatusPending   ReviewStatus = "pending"   // 待审核
	ReviewStatusInReview  ReviewStatus = "in_review" // 审核中
	ReviewStatusApproved  ReviewStatus = "approved"  // 已通过
	ReviewStatusRejected  ReviewStatus = "rejected"  // 已拒绝
	ReviewStatusRevision  ReviewStatus = "revision"  // 需修改
	ReviewStatusCancelled ReviewStatus = "cancelled" // 已取消
)

// ReviewItemType 审核项目类型
type ReviewItemType string

const (
	ReviewItemTypeAgent       ReviewItemType = "agent"
	ReviewItemTypeWorkflow    ReviewItemType = "workflow"
	ReviewItemTypeTemplate    ReviewItemType = "template"
	ReviewItemTypeUser        ReviewItemType = "user"
	ReviewItemTypeContent     ReviewItemType = "content"
	ReviewItemTypeCustomNode  ReviewItemType = "custom_node"  // 自定义节点
	ReviewItemTypeDBSchema    ReviewItemType = "db_schema"    // DB Schema 变更
	ReviewItemTypeMajorChange ReviewItemType = "major_change" // 重大变更审批
)

// ReviewPriority 审核优先级
type ReviewPriority string

const (
	ReviewPriorityLow    ReviewPriority = "low"
	ReviewPriorityNormal ReviewPriority = "normal"
	ReviewPriorityHigh   ReviewPriority = "high"
	ReviewPriorityUrgent ReviewPriority = "urgent"
)

// ReviewItemTypeArray 审核类型数组 (用于GORM)
type ReviewItemTypeArray []ReviewItemType

// Value 实现 driver.Valuer 接口
func (a ReviewItemTypeArray) Value() (driver.Value, error) {
	if a == nil {
		return "[]", nil
	}
	return json.Marshal(a)
}

// Scan 实现 sql.Scanner 接口
func (a *ReviewItemTypeArray) Scan(value interface{}) error {
	if value == nil {
		*a = nil
		return nil
	}
	var data []byte
	switch v := value.(type) {
	case []byte:
		data = v
	case string:
		data = []byte(v)
	default:
		return nil
	}
	return json.Unmarshal(data, a)
}

// =====================
// Reviewer 审核员实体
// =====================

// Reviewer 审核员
type Reviewer struct {
	ID     uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	UserID uuid.UUID `gorm:"type:char(36);not null;uniqueIndex" json:"user_id"`

	// 审核员信息
	Role        string  `gorm:"size:50;not null;default:'reviewer'" json:"role"`
	DisplayName *string `gorm:"size:100" json:"display_name"`

	// 权限范围
	AllowedTypes ReviewItemTypeArray `gorm:"type:json" json:"allowed_types"`

	// 工作量设置
	MaxDailyReviews int `gorm:"default:50" json:"max_daily_reviews"`
	CurrentWorkload int `gorm:"default:0" json:"current_workload"`

	// 状态
	IsActive bool `gorm:"default:true" json:"is_active"`

	// 统计
	TotalReviews  int `gorm:"default:0" json:"total_reviews"`
	ApprovedCount int `gorm:"default:0" json:"approved_count"`
	RejectedCount int `gorm:"default:0" json:"rejected_count"`
	AvgReviewTime int `gorm:"default:0" json:"avg_review_time"` // 平均审核时间(秒)

	// 时间戳
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// 关联
	User *User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// TableName 表名
func (Reviewer) TableName() string {
	return "what_reverse_reviewers"
}

// BeforeCreate 创建前钩子
func (r *Reviewer) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	if r.AllowedTypes == nil {
		r.AllowedTypes = ReviewItemTypeArray{ReviewItemTypeAgent, ReviewItemTypeWorkflow, ReviewItemTypeTemplate}
	}
	return nil
}

// =====================
// ReviewQueue 审核队列实体
// =====================

// ReviewQueue 审核队列
type ReviewQueue struct {
	ID uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`

	// 审核项目信息
	ItemType ReviewItemType `gorm:"size:50;not null;index" json:"item_type"`
	ItemID   uuid.UUID      `gorm:"type:char(36);not null" json:"item_id"`

	// 提交者信息
	SubmitterID uuid.UUID `gorm:"type:char(36);not null;index" json:"submitter_id"`

	// 审核员分配
	ReviewerID *uuid.UUID `gorm:"type:char(36);index" json:"reviewer_id"`
	AssignedAt *time.Time `json:"assigned_at"`

	// 状态与优先级
	Status   ReviewStatus   `gorm:"size:20;default:'pending';index" json:"status"`
	Priority ReviewPriority `gorm:"size:20;default:'normal';index" json:"priority"`

	// 审核信息
	Title       string  `gorm:"size:200;not null" json:"title"`
	Description *string `gorm:"type:text" json:"description"`

	// 快照数据
	Snapshot JSON `gorm:"type:json;not null" json:"snapshot"`

	// 提交说明
	SubmissionNote *string `gorm:"type:text" json:"submission_note"`

	// 审核结果
	ResultNote *string `gorm:"type:text" json:"result_note"`
	ResultData JSON    `gorm:"type:json" json:"result_data"`

	// 修改请求
	RevisionCount int     `gorm:"default:0" json:"revision_count"`
	RevisionNote  *string `gorm:"type:text" json:"revision_note"`

	// 版本信息
	Version int `gorm:"default:1" json:"version"`

	// 时间戳
	SubmittedAt time.Time  `json:"submitted_at"`
	ReviewedAt  *time.Time `json:"reviewed_at"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`

	// 关联
	Submitter *User     `gorm:"foreignKey:SubmitterID" json:"submitter,omitempty"`
	Reviewer  *Reviewer `gorm:"foreignKey:ReviewerID" json:"reviewer,omitempty"`
}

// TableName 表名
func (ReviewQueue) TableName() string {
	return "what_reverse_review_queue"
}

// BeforeCreate 创建前钩子
func (rq *ReviewQueue) BeforeCreate(tx *gorm.DB) error {
	if rq.ID == uuid.Nil {
		rq.ID = uuid.New()
	}
	return nil
}

// =====================
// ReviewRecord 审核记录实体
// =====================

// ReviewRecord 审核记录
type ReviewRecord struct {
	ID         uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	QueueID    uuid.UUID `gorm:"type:char(36);not null;index" json:"queue_id"`
	ReviewerID uuid.UUID `gorm:"type:char(36);not null;index" json:"reviewer_id"`

	// 审核操作
	Action string `gorm:"size:50;not null;index" json:"action"` // assign, review, approve, reject, request_revision

	// 状态变更
	FromStatus *ReviewStatus `gorm:"size:20" json:"from_status"`
	ToStatus   ReviewStatus  `gorm:"size:20;not null" json:"to_status"`

	// 审核意见
	Comment *string `gorm:"type:text" json:"comment"`

	// 详细审核结果
	Details JSON `gorm:"type:json" json:"details"`

	// 耗时
	DurationMs *int `json:"duration_ms"`

	// 时间戳
	CreatedAt time.Time `json:"created_at"`

	// 关联
	Queue    *ReviewQueue `gorm:"foreignKey:QueueID" json:"queue,omitempty"`
	Reviewer *Reviewer    `gorm:"foreignKey:ReviewerID" json:"reviewer,omitempty"`
}

// TableName 表名
func (ReviewRecord) TableName() string {
	return "what_reverse_review_records"
}

// BeforeCreate 创建前钩子
func (rr *ReviewRecord) BeforeCreate(tx *gorm.DB) error {
	if rr.ID == uuid.Nil {
		rr.ID = uuid.New()
	}
	return nil
}

// =====================
// ReviewComment 审核评论实体
// =====================

// ReviewComment 审核评论
type ReviewComment struct {
	ID      uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	QueueID uuid.UUID `gorm:"type:char(36);not null;index" json:"queue_id"`
	UserID  uuid.UUID `gorm:"type:char(36);not null;index" json:"user_id"`

	// 评论内容
	Content string `gorm:"type:text;not null" json:"content"`

	// 评论类型
	CommentType string `gorm:"size:50;default:'comment'" json:"comment_type"` // comment, question, suggestion, issue

	// 关联位置
	TargetPath *string `gorm:"size:500" json:"target_path"`

	// 父评论
	ParentID *uuid.UUID `gorm:"type:char(36);index" json:"parent_id"`

	// 状态
	IsResolved bool       `gorm:"default:false" json:"is_resolved"`
	ResolvedAt *time.Time `json:"resolved_at"`
	ResolvedBy *uuid.UUID `gorm:"type:char(36)" json:"resolved_by"`

	// 时间戳
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// 关联
	Queue        *ReviewQueue     `gorm:"foreignKey:QueueID" json:"queue,omitempty"`
	User         *User            `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Parent       *ReviewComment   `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
	Replies      []*ReviewComment `gorm:"foreignKey:ParentID" json:"replies,omitempty"`
	ResolvedUser *User            `gorm:"foreignKey:ResolvedBy" json:"resolved_user,omitempty"`
}

// TableName 表名
func (ReviewComment) TableName() string {
	return "what_reverse_review_comments"
}

// BeforeCreate 创建前钩子
func (rc *ReviewComment) BeforeCreate(tx *gorm.DB) error {
	if rc.ID == uuid.Nil {
		rc.ID = uuid.New()
	}
	return nil
}

// =====================
// ReviewChecklist 审核检查项模板实体
// =====================

// ChecklistItem 检查项
type ChecklistItem struct {
	ID       string `json:"id"`
	Label    string `json:"label"`
	Required bool   `json:"required"`
	Category string `json:"category"`
}

// ChecklistItems 检查项列表
type ChecklistItems []ChecklistItem

// Value 实现 driver.Valuer 接口
func (c ChecklistItems) Value() (driver.Value, error) {
	if c == nil {
		return "[]", nil
	}
	return json.Marshal(c)
}

// Scan 实现 sql.Scanner 接口
func (c *ChecklistItems) Scan(value interface{}) error {
	if value == nil {
		*c = nil
		return nil
	}
	var data []byte
	switch v := value.(type) {
	case []byte:
		data = v
	case string:
		data = []byte(v)
	default:
		return nil
	}
	return json.Unmarshal(data, c)
}

// ReviewChecklist 审核检查项模板
type ReviewChecklist struct {
	ID uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`

	// 模板信息
	Name        string         `gorm:"size:100;not null" json:"name"`
	Description *string        `gorm:"type:text" json:"description"`
	ItemType    ReviewItemType `gorm:"size:50;not null;index" json:"item_type"`

	// 检查项配置
	Items ChecklistItems `gorm:"type:json;not null" json:"items"`

	// 状态
	IsActive  bool `gorm:"default:true" json:"is_active"`
	IsDefault bool `gorm:"default:false" json:"is_default"`

	// 时间戳
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// TableName 表名
func (ReviewChecklist) TableName() string {
	return "what_reverse_review_checklists"
}

// BeforeCreate 创建前钩子
func (rc *ReviewChecklist) BeforeCreate(tx *gorm.DB) error {
	if rc.ID == uuid.Nil {
		rc.ID = uuid.New()
	}
	return nil
}

// =====================
// 常用查询条件
// =====================

// ReviewQueueFilter 审核队列过滤条件
type ReviewQueueFilter struct {
	ItemType    *ReviewItemType
	Status      *ReviewStatus
	Priority    *ReviewPriority
	SubmitterID *uuid.UUID
	ReviewerID  *uuid.UUID
	StartDate   *time.Time
	EndDate     *time.Time
}

// ReviewStats 审核统计
type ReviewStats struct {
	ItemType             ReviewItemType `json:"item_type"`
	Status               ReviewStatus   `json:"status"`
	Count                int64          `json:"count"`
	AvgReviewTimeSeconds int            `json:"avg_review_time_seconds"`
}
