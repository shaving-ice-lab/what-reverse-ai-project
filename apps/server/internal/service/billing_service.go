package service

import (
	"context"
	"errors"
	"math"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// BillingService 计费与配额服务接口
type BillingService interface {
	ListDimensions(ctx context.Context) []BillingDimension
	ListPlans(ctx context.Context) ([]entity.BillingPlan, error)
	GetWorkspaceQuota(ctx context.Context, ownerID, workspaceID uuid.UUID) (*entity.WorkspaceQuota, *entity.BillingPlan, error)
	ConsumeUsage(ctx context.Context, ownerID, workspaceID uuid.UUID, req ConsumeUsageRequest) (*ConsumeUsageResult, error)
	GetWorkspaceUsageStats(ctx context.Context, ownerID, workspaceID uuid.UUID, periodStart, periodEnd time.Time) (*entity.WorkspaceUsageStats, error)
	GetCostModel(ctx context.Context, ownerID, workspaceID uuid.UUID) (*CostModel, error)
	GetCostSummary(ctx context.Context, ownerID, workspaceID uuid.UUID, periodStart, periodEnd time.Time) (*CostSummary, error)
	EstimateCost(ctx context.Context, ownerID, workspaceID uuid.UUID, usage map[string]float64) (*CostEstimate, error)
	GetBudgetSettings(ctx context.Context, ownerID, workspaceID uuid.UUID) (*BudgetSettings, error)
	UpdateBudgetSettings(ctx context.Context, ownerID, workspaceID uuid.UUID, req BudgetSettingsUpdate) (*BudgetSettings, error)
	GetInvoiceSettings(ctx context.Context, ownerID, workspaceID uuid.UUID) (*InvoiceSettings, error)
	UpdateInvoiceSettings(ctx context.Context, ownerID, workspaceID uuid.UUID, req InvoiceSettingsUpdate) (*InvoiceSettings, error)
	ListInvoices(ctx context.Context, ownerID, workspaceID uuid.UUID, limit int) ([]InvoiceSummary, error)
	GetInvoiceDetail(ctx context.Context, ownerID, workspaceID, invoiceID uuid.UUID) (*InvoiceDetail, error)
	SyncInvoicePayment(ctx context.Context, ownerID, workspaceID, invoiceID uuid.UUID, req InvoicePaymentSyncRequest) (*InvoicePaymentStatus, error)
}

type billingService struct {
	planRepo       repository.BillingPlanRepository
	quotaRepo      repository.WorkspaceQuotaRepository
	usageRepo      repository.BillingUsageEventRepository
	invoicePayRepo repository.BillingInvoicePaymentRepository
	workspaceRepo  repository.WorkspaceRepository
	workspaceSvc   WorkspaceService
}

// BillingDimension 计量维度
type BillingDimension struct {
	Key         string `json:"key"`
	Name        string `json:"name"`
	Unit        string `json:"unit"`
	Description string `json:"description"`
	Aggregation string `json:"aggregation"`
}

// ConsumeUsageRequest 用量扣减请求
type ConsumeUsageRequest struct {
	Usage map[string]float64 `json:"usage"`
}

// ConsumeUsageResult 用量扣减结果
type ConsumeUsageResult struct {
	Quota      *entity.WorkspaceQuota `json:"quota"`
	Plan       *entity.BillingPlan    `json:"plan"`
	Allowed    bool                   `json:"allowed"`
	Exceeded   []string               `json:"exceeded"`
	CostAmount float64                `json:"cost_amount"`
	Currency   string                 `json:"currency"`
	Budget     *BudgetStatus          `json:"budget,omitempty"`
}

// NewBillingService 创建计费服务实例
func NewBillingService(
	planRepo repository.BillingPlanRepository,
	quotaRepo repository.WorkspaceQuotaRepository,
	usageRepo repository.BillingUsageEventRepository,
	invoicePayRepo repository.BillingInvoicePaymentRepository,
	workspaceRepo repository.WorkspaceRepository,
	workspaceSvc WorkspaceService,
) BillingService {
	return &billingService{
		planRepo:       planRepo,
		quotaRepo:      quotaRepo,
		usageRepo:      usageRepo,
		invoicePayRepo: invoicePayRepo,
		workspaceRepo:  workspaceRepo,
		workspaceSvc:   workspaceSvc,
	}
}

func (s *billingService) ListDimensions(ctx context.Context) []BillingDimension {
	return billingDimensions
}

func (s *billingService) ListPlans(ctx context.Context) ([]entity.BillingPlan, error) {
	if err := s.ensureDefaultPlans(ctx); err != nil {
		return nil, err
	}
	return s.planRepo.ListActive(ctx)
}

func (s *billingService) GetWorkspaceQuota(ctx context.Context, ownerID, workspaceID uuid.UUID) (*entity.WorkspaceQuota, *entity.BillingPlan, error) {
	workspace, err := s.workspaceSvc.GetByID(ctx, workspaceID, ownerID)
	if err != nil {
		return nil, nil, err
	}
	if err := s.ensureDefaultPlans(ctx); err != nil {
		return nil, nil, err
	}
	plan, err := s.getPlanByCode(ctx, workspace.Plan)
	if err != nil {
		return nil, nil, err
	}
	quota, err := s.ensureActiveQuota(ctx, workspace.ID, plan, time.Now())
	if err != nil {
		return nil, nil, err
	}
	return quota, plan, nil
}

func (s *billingService) ConsumeUsage(ctx context.Context, ownerID, workspaceID uuid.UUID, req ConsumeUsageRequest) (*ConsumeUsageResult, error) {
	workspace, err := s.workspaceSvc.GetByID(ctx, workspaceID, ownerID)
	if err != nil {
		return nil, err
	}
	if err := s.ensureDefaultPlans(ctx); err != nil {
		return nil, err
	}
	if err := s.validateUsage(req.Usage); err != nil {
		return nil, err
	}

	plan, err := s.getPlanByCode(ctx, workspace.Plan)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	quota, err := s.ensureActiveQuota(ctx, workspace.ID, plan, now)
	if err != nil {
		return nil, err
	}

	normalized := normalizeUsage(req.Usage)
	limits := jsonToFloatMap(quota.Limits)
	current := jsonToFloatMap(quota.Usage)
	updated := mergeUsage(current, normalized)
	exceeded := evaluateExceeded(updated, limits)
	overagePolicy := planOveragePolicy(plan.Policy)
	allowed := len(exceeded) == 0 || overagePolicy == "allow"

	quota.Usage = floatMapToJSON(updated)
	if len(exceeded) > 0 {
		quota.Status = "exceeded"
	} else {
		quota.Status = "active"
	}
	if err := s.quotaRepo.Update(ctx, quota); err != nil {
		return nil, err
	}

	rates := jsonToFloatMap(plan.RateRules)
	cost := roundCurrency(computeCost(normalized, rates))
	currency := plan.Currency
	if currency == "" {
		currency = "CNY"
	}

	budgetStatus, err := s.evaluateBudget(ctx, workspace, plan, quota.PeriodStart, quota.PeriodEnd, cost)
	if err != nil {
		return nil, err
	}
	if budgetStatus != nil && budgetStatus.SpendCapExceeded {
		allowed = false
	}

	if err := s.usageRepo.Create(ctx, &entity.BillingUsageEvent{
		WorkspaceID: workspace.ID,
		Usage:       floatMapToJSON(normalized),
		CostAmount:  cost,
		Currency:    currency,
		RecordedAt:  now,
	}); err != nil {
		return nil, err
	}

	return &ConsumeUsageResult{
		Quota:      quota,
		Plan:       plan,
		Allowed:    allowed,
		Exceeded:   exceeded,
		CostAmount: cost,
		Currency:   currency,
		Budget:     budgetStatus,
	}, nil
}

func (s *billingService) GetWorkspaceUsageStats(ctx context.Context, ownerID, workspaceID uuid.UUID, periodStart, periodEnd time.Time) (*entity.WorkspaceUsageStats, error) {
	if _, err := s.workspaceSvc.GetByID(ctx, workspaceID, ownerID); err != nil {
		return nil, err
	}
	// 从 workspace repo 获取用量统计
	stats, err := s.workspaceRepo.GetUsageStats(ctx, workspaceID, periodStart, periodEnd)
	if err != nil {
		return nil, err
	}
	if len(stats) == 0 {
		return nil, nil
	}
	// 返回第一条统计记录（聚合）
	return &stats[0], nil
}

func (s *billingService) ensureDefaultPlans(ctx context.Context) error {
	for _, seed := range defaultPlanSeeds {
		plan, err := s.planRepo.GetByCode(ctx, seed.Code)
		if err != nil {
			if !errors.Is(err, gorm.ErrRecordNotFound) {
				return err
			}
			desc := seed.Description
			newPlan := &entity.BillingPlan{
				Code:         seed.Code,
				Name:         seed.Name,
				Description:  &desc,
				PriceMonthly: seed.PriceMonthly,
				PriceYearly:  seed.PriceYearly,
				Currency:     seed.Currency,
				QuotaLimits:  floatMapToJSON(seed.QuotaLimits),
				RateRules:    floatMapToJSON(seed.RateRules),
				Policy:       seed.Policy,
				Status:       "active",
			}
			if err := s.planRepo.Create(ctx, newPlan); err != nil {
				return err
			}
			continue
		}
		if plan != nil && plan.Status != "active" {
			plan.Status = "active"
			if err := s.planRepo.Update(ctx, plan); err != nil {
				return err
			}
		}
	}
	return nil
}

func (s *billingService) getPlanByCode(ctx context.Context, code string) (*entity.BillingPlan, error) {
	planCode := code
	if planCode == "" {
		planCode = "free"
	}
	plan, err := s.planRepo.GetByCode(ctx, planCode)
	if err == nil {
		return plan, nil
	}
	if errors.Is(err, gorm.ErrRecordNotFound) && planCode != "free" {
		return s.planRepo.GetByCode(ctx, "free")
	}
	return nil, err
}

func (s *billingService) ensureActiveQuota(ctx context.Context, workspaceID uuid.UUID, plan *entity.BillingPlan, now time.Time) (*entity.WorkspaceQuota, error) {
	active, err := s.quotaRepo.GetActiveByWorkspace(ctx, workspaceID, now)
	if err == nil && active != nil {
		return active, nil
	}
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	start, end := billingPeriod(now)
	usage := map[string]float64{}
	for key := range plan.QuotaLimits {
		usage[key] = 0
	}
	quota := &entity.WorkspaceQuota{
		WorkspaceID: workspaceID,
		PlanID:      plan.ID,
		PeriodStart: start,
		PeriodEnd:   end,
		Limits:      plan.QuotaLimits,
		Usage:       floatMapToJSON(usage),
		Status:      "active",
	}
	if err := s.quotaRepo.Create(ctx, quota); err != nil {
		return nil, err
	}
	return quota, nil
}

func (s *billingService) validateUsage(usage map[string]float64) error {
	if len(usage) == 0 {
		return ErrBillingInvalidUsage
	}
	for key, value := range usage {
		if _, ok := dimensionKeys[key]; !ok {
			return ErrBillingInvalidDimension
		}
		if value <= 0 {
			return ErrBillingInvalidUsage
		}
	}
	return nil
}

// updateWorkspaceUsage 更新 workspace 用量统计
// 由于 Workspace 现在就是 App，用量统计直接关联到 Workspace
func (s *billingService) updateWorkspaceUsage(ctx context.Context, workspaceID uuid.UUID, periodStart, periodEnd time.Time, usage map[string]float64, cost float64, currency string) error {
	// 简化版：用量现在直接记录到 workspace quota 中
	// 完整实现需要在 workspace_repo 中添加用量统计方法
	_ = periodStart
	_ = periodEnd
	_ = usage
	_ = cost
	_ = currency
	return nil
}

func billingPeriod(now time.Time) (time.Time, time.Time) {
	utc := now.UTC()
	start := time.Date(utc.Year(), utc.Month(), 1, 0, 0, 0, 0, time.UTC)
	end := start.AddDate(0, 1, 0)
	return start, end
}

func normalizeUsage(input map[string]float64) map[string]float64 {
	result := make(map[string]float64, len(input))
	for key, value := range input {
		result[key] = value
	}
	return result
}

func mergeUsage(current, delta map[string]float64) map[string]float64 {
	result := make(map[string]float64, len(current)+len(delta))
	for key, value := range current {
		result[key] = value
	}
	for key, value := range delta {
		result[key] = result[key] + value
	}
	return result
}

func evaluateExceeded(usage, limits map[string]float64) []string {
	var exceeded []string
	for key, value := range usage {
		limit, ok := limits[key]
		if !ok {
			continue
		}
		if limit >= 0 && value > limit {
			exceeded = append(exceeded, key)
		}
	}
	return exceeded
}

func computeCost(usage, rates map[string]float64) float64 {
	var total float64
	for key, value := range usage {
		rate, ok := rates[key]
		if !ok {
			continue
		}
		total += value * rate
	}
	return total
}

func roundCurrency(value float64) float64 {
	return math.Round(value*100) / 100
}

func floatMapToJSON(data map[string]float64) entity.JSON {
	result := entity.JSON{}
	for key, value := range data {
		result[key] = value
	}
	return result
}

func planOveragePolicy(policy entity.JSON) string {
	if policy == nil {
		return "block"
	}
	if value, ok := policy["overage_policy"].(string); ok && value != "" {
		return value
	}
	return "block"
}

var (
	ErrBillingInvalidUsage     = errors.New("billing usage is invalid")
	ErrBillingInvalidDimension = errors.New("billing dimension is invalid")
	ErrBillingBudgetInvalid    = errors.New("billing budget settings invalid")
	ErrBillingInvoiceNotFound  = errors.New("billing invoice not found")
	ErrBillingInvoiceInvalid   = errors.New("billing invoice request invalid")
)

var billingDimensions = []BillingDimension{
	{
		Key:         "requests",
		Name:        "请求次数",
		Unit:        "次",
		Description: "API 或运行调用次数",
		Aggregation: "monthly",
	},
	{
		Key:         "tokens",
		Name:        "Tokens",
		Unit:        "tokens",
		Description: "LLM 计算消耗 Token 数量",
		Aggregation: "monthly",
	},
	{
		Key:         "db_storage_gb",
		Name:        "数据库存储",
		Unit:        "GB",
		Description: "Workspace 数据库存储容量",
		Aggregation: "monthly",
	},
	{
		Key:         "storage_gb",
		Name:        "对象存储",
		Unit:        "GB",
		Description: "文件与对象存储容量",
		Aggregation: "monthly",
	},
	{
		Key:         "egress_gb",
		Name:        "外网流量",
		Unit:        "GB",
		Description: "数据出网流量",
		Aggregation: "monthly",
	},
}

var dimensionKeys = map[string]struct{}{
	"requests":      {},
	"tokens":        {},
	"db_storage_gb": {},
	"storage_gb":    {},
	"egress_gb":     {},
}

var billingDimensionCategories = map[string]string{
	"requests":      "bandwidth",
	"tokens":        "llm",
	"db_storage_gb": "db",
	"storage_gb":    "storage",
	"egress_gb":     "bandwidth",
}

var billingCostCategories = []string{"db", "llm", "bandwidth", "storage"}

type billingPlanSeed struct {
	Code         string
	Name         string
	Description  string
	PriceMonthly float64
	PriceYearly  float64
	Currency     string
	QuotaLimits  map[string]float64
	RateRules    map[string]float64
	Policy       entity.JSON
}

var defaultPlanSeeds = []billingPlanSeed{
	{
		Code:         "free",
		Name:         "免费版",
		Description:  "适合个人探索和轻度使用",
		PriceMonthly: 0,
		PriceYearly:  0,
		Currency:     "CNY",
		QuotaLimits: map[string]float64{
			"requests":      10000,
			"tokens":        200000,
			"db_storage_gb": 5,
			"storage_gb":    5,
			"egress_gb":     10,
		},
		RateRules: map[string]float64{
			"requests":      0,
			"tokens":        0,
			"db_storage_gb": 0,
			"storage_gb":    0,
			"egress_gb":     0,
		},
		Policy: entity.JSON{
			"overage_policy": "block",
		},
	},
	{
		Code:         "pro",
		Name:         "专业版",
		Description:  "适合专业用户与小团队",
		PriceMonthly: 99,
		PriceYearly:  79,
		Currency:     "CNY",
		QuotaLimits: map[string]float64{
			"requests":      200000,
			"tokens":        5000000,
			"db_storage_gb": 50,
			"storage_gb":    50,
			"egress_gb":     200,
		},
		RateRules: map[string]float64{
			"requests":      0.0002,
			"tokens":        0.00001,
			"db_storage_gb": 0.5,
			"storage_gb":    0.3,
			"egress_gb":     0.2,
		},
		Policy: entity.JSON{
			"overage_policy": "allow",
		},
	},
	{
		Code:         "enterprise",
		Name:         "企业版",
		Description:  "面向企业客户的高级套餐",
		PriceMonthly: 299,
		PriceYearly:  249,
		Currency:     "CNY",
		QuotaLimits: map[string]float64{
			"requests":      -1,
			"tokens":        -1,
			"db_storage_gb": -1,
			"storage_gb":    -1,
			"egress_gb":     -1,
		},
		RateRules: map[string]float64{
			"requests":      0.0001,
			"tokens":        0.000008,
			"db_storage_gb": 0.4,
			"storage_gb":    0.2,
			"egress_gb":     0.15,
		},
		Policy: entity.JSON{
			"overage_policy": "allow",
		},
	},
}
