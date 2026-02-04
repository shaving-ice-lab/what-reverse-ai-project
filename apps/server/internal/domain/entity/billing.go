package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// BillingPlan 计费套餐模板
type BillingPlan struct {
	ID          uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	Code        string    `gorm:"size:30;uniqueIndex" json:"code"`
	Name        string    `gorm:"size:100;not null" json:"name"`
	Description *string   `gorm:"type:text" json:"description,omitempty"`

	PriceMonthly float64 `gorm:"type:decimal(10,2);default:0" json:"price_monthly"`
	PriceYearly  float64 `gorm:"type:decimal(10,2);default:0" json:"price_yearly"`
	Currency     string  `gorm:"size:10;default:'CNY'" json:"currency"`

	QuotaLimits JSON `gorm:"type:json" json:"quota_limits"`
	RateRules   JSON `gorm:"type:json" json:"rate_rules"`
	Policy      JSON `gorm:"type:json" json:"policy"`

	Status    string    `gorm:"size:20;default:'active'" json:"status"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// TableName 表名
func (BillingPlan) TableName() string {
	return "what_reverse_billing_plans"
}

// BeforeCreate 创建前钩子
func (p *BillingPlan) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}

// WorkspaceQuota Workspace 级配额
type WorkspaceQuota struct {
	ID          uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	WorkspaceID uuid.UUID `gorm:"type:char(36);not null;index" json:"workspace_id"`
	PlanID      uuid.UUID `gorm:"type:char(36);not null;index" json:"plan_id"`

	PeriodStart time.Time `gorm:"type:date;not null" json:"period_start"`
	PeriodEnd   time.Time `gorm:"type:date;not null" json:"period_end"`

	Limits JSON `gorm:"type:json" json:"limits"`
	Usage  JSON `gorm:"type:json" json:"usage"`

	Status    string    `gorm:"size:20;default:'active'" json:"status"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	Plan      *BillingPlan `gorm:"foreignKey:PlanID" json:"plan,omitempty"`
	Workspace *Workspace   `gorm:"foreignKey:WorkspaceID" json:"workspace,omitempty"`
}

// TableName 表名
func (WorkspaceQuota) TableName() string {
	return "what_reverse_workspace_quotas"
}

// BeforeCreate 创建前钩子
func (q *WorkspaceQuota) BeforeCreate(tx *gorm.DB) error {
	if q.ID == uuid.Nil {
		q.ID = uuid.New()
	}
	return nil
}

// BillingUsageEvent 用量事件
type BillingUsageEvent struct {
	ID          uuid.UUID  `gorm:"type:char(36);primaryKey" json:"id"`
	WorkspaceID uuid.UUID  `gorm:"type:char(36);not null;index" json:"workspace_id"`
	AppID       *uuid.UUID `gorm:"type:char(36);index" json:"app_id"`
	Usage       JSON       `gorm:"type:json" json:"usage"`
	CostAmount  float64    `gorm:"type:decimal(12,2);default:0" json:"cost_amount"`
	Currency    string     `gorm:"size:10;default:'CNY'" json:"currency"`
	RecordedAt  time.Time  `json:"recorded_at"`
	CreatedAt   time.Time  `json:"created_at"`

	Workspace *Workspace `gorm:"foreignKey:WorkspaceID" json:"workspace,omitempty"`
	App       *App       `gorm:"foreignKey:AppID" json:"app,omitempty"`
}

// TableName 表名
func (BillingUsageEvent) TableName() string {
	return "what_reverse_billing_usage_events"
}

// BeforeCreate 创建前钩子
func (e *BillingUsageEvent) BeforeCreate(tx *gorm.DB) error {
	if e.ID == uuid.Nil {
		e.ID = uuid.New()
	}
	if e.RecordedAt.IsZero() {
		e.RecordedAt = time.Now()
	}
	return nil
}

// AppUsageStat App 级用量统计
type AppUsageStat struct {
	ID          uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	WorkspaceID uuid.UUID `gorm:"type:char(36);not null;index" json:"workspace_id"`
	AppID       uuid.UUID `gorm:"type:char(36);not null;index" json:"app_id"`

	PeriodStart time.Time `gorm:"type:date;not null" json:"period_start"`
	PeriodEnd   time.Time `gorm:"type:date;not null" json:"period_end"`

	Usage      JSON    `gorm:"type:json" json:"usage"`
	CostAmount float64 `gorm:"type:decimal(12,2);default:0" json:"cost_amount"`
	Currency   string  `gorm:"size:10;default:'CNY'" json:"currency"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	App       *App       `gorm:"foreignKey:AppID" json:"app,omitempty"`
	Workspace *Workspace `gorm:"foreignKey:WorkspaceID" json:"workspace,omitempty"`
}

// TableName 表名
func (AppUsageStat) TableName() string {
	return "what_reverse_app_usage_stats"
}

// BeforeCreate 创建前钩子
func (s *AppUsageStat) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}

// BillingInvoicePayment 账单支付状态
type BillingInvoicePayment struct {
	ID             uuid.UUID  `gorm:"type:char(36);primaryKey" json:"id"`
	WorkspaceID    uuid.UUID  `gorm:"type:char(36);not null;index" json:"workspace_id"`
	InvoiceID      uuid.UUID  `gorm:"type:char(36);not null;uniqueIndex" json:"invoice_id"`
	Status         string     `gorm:"size:20;not null" json:"status"`
	PaymentChannel *string    `gorm:"size:50" json:"payment_channel,omitempty"`
	TransactionID  *string    `gorm:"size:100" json:"transaction_id,omitempty"`
	PaidAt         *time.Time `json:"paid_at,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`

	Workspace *Workspace      `gorm:"foreignKey:WorkspaceID" json:"workspace,omitempty"`
	Invoice   *WorkspaceQuota `gorm:"foreignKey:InvoiceID" json:"invoice,omitempty"`
}

// TableName 表名
func (BillingInvoicePayment) TableName() string {
	return "what_reverse_billing_invoice_payments"
}

// BeforeCreate 创建前钩子
func (p *BillingInvoicePayment) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}
