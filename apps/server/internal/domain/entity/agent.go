package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Agent Agent 实体
type Agent struct {
	ID         uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	UserID     uuid.UUID `gorm:"type:char(36);not null;index" json:"user_id"`
	WorkflowID uuid.UUID `gorm:"type:char(36);not null" json:"workflow_id"`

	// 基础信息
	Name            string  `gorm:"size:200;not null" json:"name"`
	Slug            string  `gorm:"uniqueIndex;size:100;not null" json:"slug"`
	Description     *string `gorm:"type:text" json:"description"`
	LongDescription *string `gorm:"type:text" json:"long_description"`
	Icon            string  `gorm:"size:50;default:'🤖'" json:"icon"`
	CoverImage      *string `gorm:"size:500" json:"cover_image"`

	// 分类
	Category string      `gorm:"size:50;index" json:"category"`
	Tags     StringArray `gorm:"type:json" json:"tags"`

	// 状态
	Status string `gorm:"size:20;default:'draft';index" json:"status"`

	// 定价
	PricingType string   `gorm:"size:20;default:'free'" json:"pricing_type"`
	Price       *float64 `gorm:"type:decimal(10,2)" json:"price"`
	Currency    string   `gorm:"size:10;default:'CNY'" json:"currency"`

	// 统计
	UseCount    int     `gorm:"default:0" json:"use_count"`
	StarCount   int     `gorm:"default:0" json:"star_count"`
	ReviewCount int     `gorm:"default:0" json:"review_count"`
	AvgRating   float64 `gorm:"type:decimal(3,2);default:0" json:"avg_rating"`
	Revenue     float64 `gorm:"type:decimal(12,2);default:0" json:"revenue"`

	// 媒体
	Screenshots StringArray `gorm:"type:json" json:"screenshots"`
	DemoVideo   *string     `gorm:"size:500" json:"demo_video"`

	// 时间戳
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	PublishedAt *time.Time     `json:"published_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	// 关联
	User     *User     `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Workflow *Workflow `gorm:"foreignKey:WorkflowID" json:"workflow,omitempty"`
}

// TableName 表名
func (Agent) TableName() string {
	return "what_reverse_agents"
}

// BeforeCreate 创建前钩子
func (a *Agent) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}

// Review 评价实体
type Review struct {
	ID      uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	AgentID uuid.UUID `gorm:"type:char(36);not null;index" json:"agent_id"`
	UserID  uuid.UUID `gorm:"type:char(36);not null;index" json:"user_id"`

	Rating  int    `gorm:"not null" json:"rating"`
	Title   string `gorm:"size:200" json:"title"`
	Content string `gorm:"type:text" json:"content"`

	HelpfulCount int `gorm:"default:0" json:"helpful_count"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	User *User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// TableName 表名
func (Review) TableName() string {
	return "what_reverse_reviews"
}

// BeforeCreate 创建前钩子
func (r *Review) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}

// AgentUsage 使用记录实体
type AgentUsage struct {
	ID      uuid.UUID  `gorm:"type:char(36);primaryKey" json:"id"`
	AgentID uuid.UUID  `gorm:"type:char(36);not null;index" json:"agent_id"`
	UserID  *uuid.UUID `gorm:"type:char(36);index" json:"user_id"`

	// 会话信息
	SessionID *string `gorm:"size:100" json:"session_id"`

	// 使用详情
	DurationMs   *int `json:"duration_ms"`
	InputTokens  int  `gorm:"default:0" json:"input_tokens"`
	OutputTokens int  `gorm:"default:0" json:"output_tokens"`
	TotalTokens  int  `gorm:"default:0" json:"total_tokens"`

	// 执行状态
	Status       string  `gorm:"size:20;default:'completed';index" json:"status"`
	ErrorMessage *string `gorm:"type:text" json:"error_message"`

	// 来源信息
	Source   string  `gorm:"size:50;default:'web';index" json:"source"`
	Referrer *string `gorm:"size:500" json:"referrer"`

	// 设备信息
	UserAgent *string `gorm:"size:500" json:"user_agent"`
	IPAddress *string `gorm:"size:50" json:"ip_address"`
	Country   *string `gorm:"size:50" json:"country"`
	City      *string `gorm:"size:100" json:"city"`

	// 付费信息
	IsPaid   bool     `gorm:"default:false" json:"is_paid"`
	Amount   *float64 `gorm:"type:decimal(10,2)" json:"amount"`
	Currency string   `gorm:"size:10;default:'CNY'" json:"currency"`

	// 时间戳
	StartedAt   time.Time  `json:"started_at"`
	CompletedAt *time.Time `json:"completed_at"`
	CreatedAt   time.Time  `json:"created_at"`

	// 关联
	Agent *Agent `gorm:"foreignKey:AgentID" json:"agent,omitempty"`
	User  *User  `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// TableName 表名
func (AgentUsage) TableName() string {
	return "what_reverse_agent_usages"
}

// BeforeCreate 创建前钩子
func (u *AgentUsage) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

// AgentUsageStat 每日使用统计实体
type AgentUsageStat struct {
	ID       uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	AgentID  uuid.UUID `gorm:"type:char(36);not null;index;uniqueIndex:uk_agent_stat_date" json:"agent_id"`
	StatDate time.Time `gorm:"type:date;not null;uniqueIndex:uk_agent_stat_date" json:"stat_date"`

	// 使用统计
	UseCount      int   `gorm:"default:0" json:"use_count"`
	UniqueUsers   int   `gorm:"default:0" json:"unique_users"`
	TotalDuration int64 `gorm:"default:0" json:"total_duration"`
	AvgDuration   int   `gorm:"default:0" json:"avg_duration"`

	// Token 统计
	TotalInputTokens  int `gorm:"default:0" json:"total_input_tokens"`
	TotalOutputTokens int `gorm:"default:0" json:"total_output_tokens"`
	TotalTokens       int `gorm:"default:0" json:"total_tokens"`

	// 状态统计
	CompletedCount int `gorm:"default:0" json:"completed_count"`
	FailedCount    int `gorm:"default:0" json:"failed_count"`
	CancelledCount int `gorm:"default:0" json:"cancelled_count"`

	// 来源统计
	SourceBreakdown JSONMap `gorm:"type:json" json:"source_breakdown"`

	// 收入统计
	TotalRevenue float64 `gorm:"type:decimal(12,2);default:0" json:"total_revenue"`
	PaidUseCount int     `gorm:"default:0" json:"paid_use_count"`

	// 时间戳
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// 关联
	Agent *Agent `gorm:"foreignKey:AgentID" json:"agent,omitempty"`
}

// TableName 表名
func (AgentUsageStat) TableName() string {
	return "what_reverse_agent_usage_stats"
}

// BeforeCreate 创建前钩子
func (s *AgentUsageStat) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}

// JSONMap 用于存储 JSON 对象
type JSONMap map[string]interface{}

// AgentReport 举报记录实体
type AgentReport struct {
	ID      uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	AgentID uuid.UUID `gorm:"type:char(36);not null;index" json:"agent_id"`
	UserID  uuid.UUID `gorm:"type:char(36);not null;index" json:"user_id"`

	// 举报信息
	Reason      string      `gorm:"size:50;not null" json:"reason"` // spam, inappropriate, copyright, misleading, other
	Description string      `gorm:"type:text" json:"description"`   // 详细描述
	Evidence    StringArray `gorm:"type:json" json:"evidence"`      // 截图等证据 URL

	// 处理状态
	Status     string     `gorm:"size:20;default:'pending';index" json:"status"` // pending, reviewing, resolved, rejected
	Resolution *string    `gorm:"type:text" json:"resolution"`                   // 处理结果说明
	ReviewedBy *uuid.UUID `gorm:"type:char(36)" json:"reviewed_by"`              // 审核人
	ReviewedAt *time.Time `json:"reviewed_at"`

	// 时间戳
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// 关联
	Agent *Agent `gorm:"foreignKey:AgentID" json:"agent,omitempty"`
	User  *User  `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// TableName 表名
func (AgentReport) TableName() string {
	return "what_reverse_agent_reports"
}

// BeforeCreate 创建前钩子
func (r *AgentReport) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}

// ReportReason 举报原因常量
const (
	ReportReasonSpam          = "spam"          // 垃圾信息
	ReportReasonInappropriate = "inappropriate" // 不当内容
	ReportReasonCopyright     = "copyright"     // 侵权
	ReportReasonMisleading    = "misleading"    // 误导性描述
	ReportReasonOther         = "other"         // 其他
)
