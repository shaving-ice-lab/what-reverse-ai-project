package service

import (
	"context"
	"errors"
)

// MarketplaceBillingPlan Marketplace 计费与分成方案
type MarketplaceBillingPlan struct {
	Key          string                      `json:"key"`
	Title        string                      `json:"title"`
	Summary      string                      `json:"summary"`
	PricingModel MarketplacePricingModelPlan `json:"pricing_model"`
	RevenueShare MarketplaceRevenueSharePlan `json:"revenue_share"`
	RefundPolicy MarketplaceRefundPolicyPlan `json:"refund_policy"`
	Notes        []string                    `json:"notes,omitempty"`
}

// MarketplacePricingModelPlan 应用/Agent 定价模型
type MarketplacePricingModelPlan struct {
	Key              string                     `json:"key"`
	Title            string                     `json:"title"`
	SupportedModels  []MarketplacePricingOption `json:"supported_models"`
	PricingRules     []string                   `json:"pricing_rules"`
	PublishChecklist []string                   `json:"publish_checklist"`
	ReferenceAPIs    []string                   `json:"reference_apis"`
	Notes            []string                   `json:"notes,omitempty"`
}

// MarketplacePricingOption 定价模型选项
type MarketplacePricingOption struct {
	Key         string   `json:"key"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Unit        string   `json:"unit"`
	PriceFields []string `json:"price_fields"`
	UseCases    []string `json:"use_cases,omitempty"`
}

// MarketplaceRevenueSharePlan 分成与结算规则
type MarketplaceRevenueSharePlan struct {
	Key                 string                    `json:"key"`
	Title               string                    `json:"title"`
	DefaultCreatorRate  float64                   `json:"default_creator_rate"`
	DefaultPlatformRate float64                   `json:"default_platform_rate"`
	TierSource          string                    `json:"tier_source"`
	Settlement          MarketplaceSettlementRule `json:"settlement"`
	Payout              MarketplacePayoutRule     `json:"payout"`
	Metrics             []string                  `json:"metrics"`
	ReferenceAPIs       []string                  `json:"reference_apis"`
	Notes               []string                  `json:"notes,omitempty"`
}

// MarketplaceSettlementRule 结算规则
type MarketplaceSettlementRule struct {
	Period           string   `json:"period"`
	Cutoff           string   `json:"cutoff"`
	EligibleStatuses []string `json:"eligible_statuses"`
	Steps            []string `json:"steps"`
}

// MarketplacePayoutRule 提现规则
type MarketplacePayoutRule struct {
	MinWithdrawalAmount float64  `json:"min_withdrawal_amount"`
	FeeRate             float64  `json:"fee_rate"`
	MinFee              float64  `json:"min_fee"`
	ProcessingFlow      []string `json:"processing_flow"`
}

// MarketplaceRefundPolicyPlan 退款与争议处理流程
type MarketplaceRefundPolicyPlan struct {
	Key           string   `json:"key"`
	Title         string   `json:"title"`
	Eligibility   []string `json:"eligibility"`
	DisputeFlow   []string `json:"dispute_flow"`
	Actions       []string `json:"actions"`
	ReferenceAPIs []string `json:"reference_apis"`
	Notes         []string `json:"notes,omitempty"`
}

// PlanMarketplaceBillingService Marketplace 计费与分成规划服务接口
type PlanMarketplaceBillingService interface {
	GetPlan(ctx context.Context) (*MarketplaceBillingPlan, error)
}

type planMarketplaceBillingService struct {
	plan MarketplaceBillingPlan
}

// ErrMarketplaceBillingPlanNotFound Marketplace 计费与分成规划不存在
var ErrMarketplaceBillingPlanNotFound = errors.New("marketplace billing plan not found")

// NewPlanMarketplaceBillingService 创建 Marketplace 计费与分成规划服务
func NewPlanMarketplaceBillingService() PlanMarketplaceBillingService {
	return &planMarketplaceBillingService{
		plan: defaultMarketplaceBillingPlan(),
	}
}

func (s *planMarketplaceBillingService) GetPlan(ctx context.Context) (*MarketplaceBillingPlan, error) {
	if s == nil || s.plan.Key == "" {
		return nil, ErrMarketplaceBillingPlanNotFound
	}
	output := s.plan
	return &output, nil
}

func defaultMarketplaceBillingPlan() MarketplaceBillingPlan {
	creatorRate := DefaultCommissionRate
	platformRate := 1 - creatorRate

	return MarketplaceBillingPlan{
		Key:     "marketplace_billing",
		Title:   "Marketplace 计费与分成",
		Summary: "定义 Marketplace 的定价模型、分成与结算规则，以及退款与争议处理流程，确保可运营与可结算。",
		PricingModel: MarketplacePricingModelPlan{
			Key:   "pricing_model",
			Title: "应用/Agent 定价模型",
			SupportedModels: []MarketplacePricingOption{
				{
					Key:         "free",
					Title:       "免费",
					Description: "用于引流或基础功能开放，无直接收费。",
					Unit:        "N/A",
					PriceFields: []string{"pricing_type=free"},
					UseCases:    []string{"工具类免费入口", "开源模板"},
				},
				{
					Key:         "paid",
					Title:       "一次性付费",
					Description: "用户一次性购买后获得使用权。",
					Unit:        "per_purchase",
					PriceFields: []string{"pricing_type=paid", "price"},
					UseCases:    []string{"一次性模板", "高级 Agent"},
				},
				{
					Key:         "subscription",
					Title:       "订阅付费",
					Description: "按月或周期订阅，适合持续价值交付。",
					Unit:        "per_month",
					PriceFields: []string{"pricing_type=subscription", "price"},
					UseCases:    []string{"持续更新内容", "数据订阅型 Agent"},
				},
				{
					Key:         "usage",
					Title:       "按量计费",
					Description: "按调用次数或用量收费，适合弹性需求。",
					Unit:        "per_execution",
					PriceFields: []string{"pricing_type=usage", "price"},
					UseCases:    []string{"高成本推理", "API 调用型 Agent"},
				},
				{
					Key:         "freemium",
					Title:       "免费 + 付费升级",
					Description: "基础免费，高级功能付费。",
					Unit:        "per_upgrade",
					PriceFields: []string{"pricing_type=freemium", "price"},
					UseCases:    []string{"功能分层", "高级模板解锁"},
				},
			},
			PricingRules: []string{
				"定价需明确展示单价、计费单位与退款范围。",
				"price 保留两位小数并使用统一币种（默认 CNY）。",
				"发布前校验 pricing_type 与 price 组合合法。",
			},
			PublishChecklist: []string{
				"补充定价说明与使用范围",
				"确认退款条款与争议渠道",
				"校验 Marketplace 展示价与结算价一致",
			},
			ReferenceAPIs: []string{
				"POST /api/v1/agents (pricing_type/price)",
				"PUT /api/v1/agents/:id (pricing_type/price)",
				"GET /api/v1/marketplace/apps",
			},
			Notes: []string{
				"pricing_type/price 字段用于 Marketplace 展示与结算口径。",
			},
		},
		RevenueShare: MarketplaceRevenueSharePlan{
			Key:                 "revenue_share",
			Title:               "平台分成与结算规则",
			DefaultCreatorRate:  creatorRate,
			DefaultPlatformRate: platformRate,
			TierSource:          "what_reverse_commission_tiers 表 + /api/v1/earnings/commission-tiers",
			Settlement: MarketplaceSettlementRule{
				Period:           "上月 1 日 - 上月最后一天",
				Cutoff:           "仅结算 status=confirmed 且 settlement_id 为空的收入",
				EligibleStatuses: []string{"pending", "confirmed", "settled", "refunded", "cancelled"},
				Steps: []string{
					"管理员触发结算批次（生成 settlement）",
					"批量更新收入状态为 settled 并写入 settled_at",
					"生成结算统计（总额、平台费、创作者份额）",
				},
			},
			Payout: MarketplacePayoutRule{
				MinWithdrawalAmount: MinWithdrawalAmount,
				FeeRate:             WithdrawalFeeRate,
				MinFee:              MinWithdrawalFee,
				ProcessingFlow: []string{
					"创作者提交提现申请（status=pending）",
					"管理员审核并处理（processing/completed/rejected）",
					"完成后写入外部交易信息与完成时间",
				},
			},
			Metrics: []string{
				"收入流水（gross/net/platform_fee）",
				"分成等级与月度收入",
				"结算批次统计",
			},
			ReferenceAPIs: []string{
				"GET /api/v1/earnings/commission-tiers",
				"POST /api/v1/earnings/calculate-commission",
				"GET /api/v1/earnings",
				"POST /api/v1/admin/earnings/settlements/run",
				"GET /api/v1/earnings/withdrawals",
				"POST /api/v1/earnings/withdrawals",
				"POST /api/v1/admin/earnings/withdrawals/:id/process",
			},
			Notes: []string{
				"默认分成比例来源于配置常量，可由分成阶梯覆盖。",
				"结算周期默认按自然月统计。",
			},
		},
		RefundPolicy: MarketplaceRefundPolicyPlan{
			Key:   "refund_policy",
			Title: "退款与争议处理流程",
			Eligibility: []string{
				"发生误扣或重复扣费",
				"服务未交付或严重不符合描述",
				"存在违规内容或侵权风险",
			},
			DisputeFlow: []string{
				"用户提交支持工单并提供订单信息",
				"运营核实订单/执行记录与交付状态",
				"必要时冻结相关结算或提现",
				"确认退款后更新收入状态并通知双方",
			},
			Actions: []string{
				"管理员执行退款并记录退款原因",
				"更新收入状态为 refunded",
				"同步扣减创作者余额",
			},
			ReferenceAPIs: []string{
				"POST /api/v1/support/tickets",
				"GET /api/v1/earnings/:id",
				"POST /api/v1/admin/earnings/:id/refund",
			},
			Notes: []string{
				"争议处理需保留沟通记录与证据。",
			},
		},
		Notes: []string{
			"Marketplace 计费与分成规则需与前端展示一致，避免价差争议。",
		},
	}
}
