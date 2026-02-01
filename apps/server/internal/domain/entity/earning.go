package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// =====================
// 常量定义
// =====================

// EarningType 收入类型
type EarningType string

const (
	EarningTypeSale         EarningType = "sale"         // 销售收入
	EarningTypeSubscription EarningType = "subscription" // 订阅收入
	EarningTypeTip          EarningType = "tip"          // 打赏收入
	EarningTypeReferral     EarningType = "referral"     // 推荐奖励
)

// EarningStatus 收入状态
type EarningStatus string

const (
	EarningStatusPending   EarningStatus = "pending"   // 待确认
	EarningStatusConfirmed EarningStatus = "confirmed" // 已确认
	EarningStatusSettled   EarningStatus = "settled"   // 已结算
	EarningStatusRefunded  EarningStatus = "refunded"  // 已退款
	EarningStatusCancelled EarningStatus = "cancelled" // 已取消
)

// WithdrawalStatus 提现状态
type WithdrawalStatus string

const (
	WithdrawalStatusPending    WithdrawalStatus = "pending"    // 待处理
	WithdrawalStatusProcessing WithdrawalStatus = "processing" // 处理中
	WithdrawalStatusCompleted  WithdrawalStatus = "completed"  // 已完成
	WithdrawalStatusRejected   WithdrawalStatus = "rejected"   // 已拒绝
	WithdrawalStatusFailed     WithdrawalStatus = "failed"     // 失败
)

// PaymentMethod 支付方式
type PaymentMethod string

const (
	PaymentMethodAlipay PaymentMethod = "alipay" // 支付宝
	PaymentMethodWechat PaymentMethod = "wechat" // 微信支付
	PaymentMethodBank   PaymentMethod = "bank"   // 银行卡
)

// =====================
// 分成规则实体
// =====================

// CommissionTier 分成阶梯规则
type CommissionTier struct {
	ID             uuid.UUID    `gorm:"type:char(36);primaryKey" json:"id"`
	TierName       string       `gorm:"size:50;not null" json:"tier_name"`
	MinRevenue     float64      `gorm:"type:decimal(12,2);not null;default:0" json:"min_revenue"`
	MaxRevenue     *float64     `gorm:"type:decimal(12,2)" json:"max_revenue"`
	CommissionRate float64      `gorm:"type:decimal(5,4);not null" json:"commission_rate"` // 0.0000-1.0000
	EarningType    *EarningType `gorm:"size:20" json:"earning_type"`
	Description    *string      `gorm:"type:text" json:"description"`
	IsActive       bool         `gorm:"default:true" json:"is_active"`
	Priority       int          `gorm:"default:0" json:"priority"`
	CreatedAt      time.Time    `json:"created_at"`
	UpdatedAt      time.Time    `json:"updated_at"`
}

// TableName 表名
func (CommissionTier) TableName() string {
	return "what_reverse_commission_tiers"
}

// BeforeCreate 创建前钩子
func (c *CommissionTier) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

// =====================
// 收入实体
// =====================

// Earning 收入记录
type Earning struct {
	ID             uuid.UUID      `gorm:"type:char(36);primaryKey" json:"id"`
	UserID         uuid.UUID      `gorm:"type:char(36);not null;index" json:"user_id"`
	AgentID        *uuid.UUID     `gorm:"type:char(36);index" json:"agent_id"`
	BuyerID        *uuid.UUID     `gorm:"type:char(36);index" json:"buyer_id"`

	// 收入类型和金额
	EarningType    EarningType    `gorm:"size:20;not null;index" json:"earning_type"`
	GrossAmount    float64        `gorm:"type:decimal(12,2);not null" json:"gross_amount"`
	PlatformFee    float64        `gorm:"type:decimal(12,2);not null" json:"platform_fee"`
	NetAmount      float64        `gorm:"type:decimal(12,2);not null" json:"net_amount"`
	CommissionRate float64        `gorm:"type:decimal(5,4);not null" json:"commission_rate"`
	Currency       string         `gorm:"size:10;default:'CNY'" json:"currency"`

	// 状态
	Status         EarningStatus  `gorm:"size:20;default:'pending';index" json:"status"`

	// 关联订单
	OrderID        *string        `gorm:"size:100;index" json:"order_id"`
	TransactionID  *string        `gorm:"size:100" json:"transaction_id"`

	// 详情
	Description    *string        `gorm:"type:text" json:"description"`
	Metadata       JSON           `gorm:"type:json" json:"metadata"`

	// 推荐奖励
	ReferrerID     *uuid.UUID     `gorm:"type:char(36)" json:"referrer_id"`
	ReferralBonus  *float64       `gorm:"type:decimal(12,2)" json:"referral_bonus"`

	// 结算
	SettlementID   *uuid.UUID     `gorm:"type:char(36);index" json:"settlement_id"`
	SettledAt      *time.Time     `json:"settled_at"`

	// 退款
	RefundReason   *string        `gorm:"type:text" json:"refund_reason"`
	RefundedAt     *time.Time     `json:"refunded_at"`

	// 时间戳
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`

	// 关联
	User           *User          `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Agent          *Agent         `gorm:"foreignKey:AgentID" json:"agent,omitempty"`
	Buyer          *User          `gorm:"foreignKey:BuyerID" json:"buyer,omitempty"`
	Referrer       *User          `gorm:"foreignKey:ReferrerID" json:"referrer,omitempty"`
}

// TableName 表名
func (Earning) TableName() string {
	return "what_reverse_earnings"
}

// BeforeCreate 创建前钩子
func (e *Earning) BeforeCreate(tx *gorm.DB) error {
	if e.ID == uuid.Nil {
		e.ID = uuid.New()
	}
	return nil
}

// =====================
// 创作者账户实体
// =====================

// CreatorAccount 创作者账户
type CreatorAccount struct {
	ID                uuid.UUID   `gorm:"type:char(36);primaryKey" json:"id"`
	UserID            uuid.UUID   `gorm:"type:char(36);not null;uniqueIndex" json:"user_id"`

	// 余额
	Balance           float64     `gorm:"type:decimal(12,2);default:0" json:"balance"`
	PendingBalance    float64     `gorm:"type:decimal(12,2);default:0" json:"pending_balance"`
	TotalEarned       float64     `gorm:"type:decimal(12,2);default:0" json:"total_earned"`
	TotalWithdrawn    float64     `gorm:"type:decimal(12,2);default:0" json:"total_withdrawn"`

	// 月度收入
	MonthlyRevenue    float64     `gorm:"type:decimal(12,2);default:0" json:"monthly_revenue"`
	MonthlyResetAt    time.Time   `gorm:"type:date" json:"monthly_reset_at"`

	// 分成等级
	CurrentTierID     *uuid.UUID  `gorm:"type:char(36)" json:"current_tier_id"`

	// 统计
	SaleCount         int         `gorm:"default:0" json:"sale_count"`
	SubscriptionCount int         `gorm:"default:0" json:"subscription_count"`
	TipCount          int         `gorm:"default:0" json:"tip_count"`
	ReferralCount     int         `gorm:"default:0" json:"referral_count"`

	// 收款信息
	PaymentMethod     *string     `gorm:"size:50" json:"payment_method"`
	PaymentAccount    *string     `gorm:"type:text" json:"payment_account"` // 加密存储
	PaymentName       *string     `gorm:"size:100" json:"payment_name"`
	IsVerified        bool        `gorm:"default:false" json:"is_verified"`

	// 状态
	Status            string      `gorm:"size:20;default:'active';index" json:"status"`

	// 时间戳
	CreatedAt         time.Time   `json:"created_at"`
	UpdatedAt         time.Time   `json:"updated_at"`

	// 关联
	User              *User            `gorm:"foreignKey:UserID" json:"user,omitempty"`
	CurrentTier       *CommissionTier  `gorm:"foreignKey:CurrentTierID" json:"current_tier,omitempty"`
}

// TableName 表名
func (CreatorAccount) TableName() string {
	return "what_reverse_creator_accounts"
}

// BeforeCreate 创建前钩子
func (c *CreatorAccount) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

// TotalCount 总收入笔数
func (c *CreatorAccount) TotalCount() int {
	return c.SaleCount + c.SubscriptionCount + c.TipCount + c.ReferralCount
}

// =====================
// 提现申请实体
// =====================

// Withdrawal 提现申请
type Withdrawal struct {
	ID              uuid.UUID        `gorm:"type:char(36);primaryKey" json:"id"`
	UserID          uuid.UUID        `gorm:"type:char(36);not null;index" json:"user_id"`
	AccountID       uuid.UUID        `gorm:"type:char(36);not null" json:"account_id"`

	// 金额
	Amount          float64          `gorm:"type:decimal(12,2);not null" json:"amount"`
	Fee             float64          `gorm:"type:decimal(12,2);default:0" json:"fee"`
	ActualAmount    float64          `gorm:"type:decimal(12,2);not null" json:"actual_amount"`
	Currency        string           `gorm:"size:10;default:'CNY'" json:"currency"`

	// 收款信息快照
	PaymentMethod   string           `gorm:"size:50;not null" json:"payment_method"`
	PaymentAccount  string           `gorm:"type:text;not null" json:"payment_account"`
	PaymentName     string           `gorm:"size:100;not null" json:"payment_name"`

	// 状态
	Status          WithdrawalStatus `gorm:"size:20;default:'pending';index" json:"status"`

	// 处理信息
	ProcessedBy     *uuid.UUID       `gorm:"type:char(36)" json:"processed_by"`
	ProcessedAt     *time.Time       `json:"processed_at"`
	RejectionReason *string          `gorm:"type:text" json:"rejection_reason"`

	// 第三方交易
	ExternalOrderID *string          `gorm:"size:100" json:"external_order_id"`
	ExternalStatus  *string          `gorm:"size:50" json:"external_status"`

	// 备注
	Note            *string          `gorm:"type:text" json:"note"`
	AdminNote       *string          `gorm:"type:text" json:"admin_note"`

	// 时间戳
	CreatedAt       time.Time        `json:"created_at"`
	UpdatedAt       time.Time        `json:"updated_at"`
	CompletedAt     *time.Time       `json:"completed_at"`

	// 关联
	User            *User            `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Account         *CreatorAccount  `gorm:"foreignKey:AccountID" json:"account,omitempty"`
	Processor       *User            `gorm:"foreignKey:ProcessedBy" json:"processor,omitempty"`
}

// TableName 表名
func (Withdrawal) TableName() string {
	return "what_reverse_withdrawals"
}

// BeforeCreate 创建前钩子
func (w *Withdrawal) BeforeCreate(tx *gorm.DB) error {
	if w.ID == uuid.Nil {
		w.ID = uuid.New()
	}
	return nil
}

// =====================
// 结算批次实体
// =====================

// Settlement 结算批次
type Settlement struct {
	ID               uuid.UUID  `gorm:"type:char(36);primaryKey" json:"id"`
	PeriodStart      time.Time  `gorm:"type:date;not null" json:"period_start"`
	PeriodEnd        time.Time  `gorm:"type:date;not null" json:"period_end"`

	// 统计
	TotalEarnings    int        `gorm:"default:0" json:"total_earnings"`
	TotalAmount      float64    `gorm:"type:decimal(12,2);default:0" json:"total_amount"`
	TotalPlatformFee float64    `gorm:"type:decimal(12,2);default:0" json:"total_platform_fee"`
	TotalCreatorShare float64   `gorm:"type:decimal(12,2);default:0" json:"total_creator_share"`

	// 状态
	Status           string     `gorm:"size:20;default:'pending';index" json:"status"`

	// 处理信息
	ProcessedBy      *uuid.UUID `gorm:"type:char(36)" json:"processed_by"`
	ProcessedAt      *time.Time `json:"processed_at"`
	Note             *string    `gorm:"type:text" json:"note"`

	// 时间戳
	CreatedAt        time.Time  `json:"created_at"`

	// 关联
	Processor        *User      `gorm:"foreignKey:ProcessedBy" json:"processor,omitempty"`
}

// TableName 表名
func (Settlement) TableName() string {
	return "what_reverse_settlements"
}

// BeforeCreate 创建前钩子
func (s *Settlement) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}

// =====================
// DTO 定义
// =====================

// EarningStats 收入统计
type EarningStats struct {
	TotalEarnings     int     `json:"total_earnings"`
	TotalGross        float64 `json:"total_gross"`
	TotalNet          float64 `json:"total_net"`
	TotalPlatformFee  float64 `json:"total_platform_fee"`
	AvgCommissionRate float64 `json:"avg_commission_rate"`
}

// EarningsByType 按类型统计收入
type EarningsByType struct {
	Type   EarningType `json:"type"`
	Count  int         `json:"count"`
	Amount float64     `json:"amount"`
}

// MonthlyEarning 月度收入统计
type MonthlyEarning struct {
	Month  string  `json:"month"`
	Gross  float64 `json:"gross"`
	Net    float64 `json:"net"`
	Count  int     `json:"count"`
}

// CreatorDashboard 创作者仪表盘数据
type CreatorDashboard struct {
	Account       *CreatorAccount   `json:"account"`
	CurrentTier   *CommissionTier   `json:"current_tier"`
	TodayEarnings float64           `json:"today_earnings"`
	WeekEarnings  float64           `json:"week_earnings"`
	MonthEarnings float64           `json:"month_earnings"`
	ByType        []EarningsByType  `json:"by_type"`
	Monthly       []MonthlyEarning  `json:"monthly"`
	RecentEarnings []Earning        `json:"recent_earnings"`
	TopAgents     []AgentEarning    `json:"top_agents"`
}

// AgentEarning Agent 收入统计
type AgentEarning struct {
	AgentID   uuid.UUID `json:"agent_id"`
	AgentName string    `json:"agent_name"`
	Count     int       `json:"count"`
	Amount    float64   `json:"amount"`
}
