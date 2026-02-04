package service

import (
	"context"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
)

// CostModelDimension 成本模型维度
type CostModelDimension struct {
	Key      string  `json:"key"`
	Name     string  `json:"name"`
	Unit     string  `json:"unit"`
	Category string  `json:"category"`
	Rate     float64 `json:"rate"`
}

// CostModel 成本模型
type CostModel struct {
	Currency   string               `json:"currency"`
	Dimensions []CostModelDimension `json:"dimensions"`
}

// DimensionCost 维度成本
type DimensionCost struct {
	Key      string  `json:"key"`
	Name     string  `json:"name"`
	Unit     string  `json:"unit"`
	Category string  `json:"category"`
	Usage    float64 `json:"usage"`
	Rate     float64 `json:"rate"`
	Cost     float64 `json:"cost"`
}

// CategoryCost 资源类别成本
type CategoryCost struct {
	Category string  `json:"category"`
	Cost     float64 `json:"cost"`
}

// CostSummary 成本汇总
type CostSummary struct {
	PeriodStart    time.Time          `json:"period_start"`
	PeriodEnd      time.Time          `json:"period_end"`
	Currency       string             `json:"currency"`
	TotalCost      float64            `json:"total_cost"`
	DimensionCosts []DimensionCost    `json:"dimension_costs"`
	CategoryCosts  []CategoryCost     `json:"category_costs"`
	UsageTotals    map[string]float64 `json:"usage_totals"`
}

// CostEstimate 成本估算
type CostEstimate struct {
	Currency       string             `json:"currency"`
	TotalCost      float64            `json:"total_cost"`
	DimensionCosts []DimensionCost    `json:"dimension_costs"`
	CategoryCosts  []CategoryCost     `json:"category_costs"`
	UsageTotals    map[string]float64 `json:"usage_totals"`
}

func (s *billingService) GetCostModel(ctx context.Context, ownerID, workspaceID uuid.UUID) (*CostModel, error) {
	workspace, err := s.authorizeBillingView(ctx, workspaceID, ownerID)
	if err != nil {
		return nil, err
	}
	if err := s.ensureDefaultPlans(ctx); err != nil {
		return nil, err
	}
	plan, err := s.getPlanByCode(ctx, workspace.Plan)
	if err != nil {
		return nil, err
	}
	return buildCostModel(plan), nil
}

func (s *billingService) GetCostSummary(ctx context.Context, ownerID, workspaceID uuid.UUID, periodStart, periodEnd time.Time) (*CostSummary, error) {
	workspace, err := s.authorizeBillingView(ctx, workspaceID, ownerID)
	if err != nil {
		return nil, err
	}
	if err := s.ensureDefaultPlans(ctx); err != nil {
		return nil, err
	}
	plan, err := s.getPlanByCode(ctx, workspace.Plan)
	if err != nil {
		return nil, err
	}
	if periodStart.IsZero() || periodEnd.IsZero() {
		periodStart, periodEnd = billingPeriod(time.Now())
	}
	events, err := s.usageRepo.ListByWorkspace(ctx, workspace.ID, periodStart, periodEnd, 0)
	if err != nil {
		return nil, err
	}
	usageTotals := aggregateUsageTotals(events)
	dimensionCosts, categoryCosts, totalCost := buildCostBreakdown(usageTotals, plan)
	return &CostSummary{
		PeriodStart:    periodStart,
		PeriodEnd:      periodEnd,
		Currency:       costCurrency(plan),
		TotalCost:      totalCost,
		DimensionCosts: dimensionCosts,
		CategoryCosts:  categoryCosts,
		UsageTotals:    usageTotals,
	}, nil
}

func (s *billingService) EstimateCost(ctx context.Context, ownerID, workspaceID uuid.UUID, usage map[string]float64) (*CostEstimate, error) {
	if err := s.validateUsage(usage); err != nil {
		return nil, err
	}
	workspace, err := s.authorizeBillingView(ctx, workspaceID, ownerID)
	if err != nil {
		return nil, err
	}
	if err := s.ensureDefaultPlans(ctx); err != nil {
		return nil, err
	}
	plan, err := s.getPlanByCode(ctx, workspace.Plan)
	if err != nil {
		return nil, err
	}
	usageTotals := normalizeUsage(usage)
	dimensionCosts, categoryCosts, totalCost := buildCostBreakdown(usageTotals, plan)
	return &CostEstimate{
		Currency:       costCurrency(plan),
		TotalCost:      totalCost,
		DimensionCosts: dimensionCosts,
		CategoryCosts:  categoryCosts,
		UsageTotals:    usageTotals,
	}, nil
}

func buildCostModel(plan *entity.BillingPlan) *CostModel {
	rates := jsonToFloatMap(plan.RateRules)
	dimensions := make([]CostModelDimension, 0, len(billingDimensions))
	for _, dim := range billingDimensions {
		category := billingDimensionCategory(dim.Key)
		dimensions = append(dimensions, CostModelDimension{
			Key:      dim.Key,
			Name:     dim.Name,
			Unit:     dim.Unit,
			Category: category,
			Rate:     rates[dim.Key],
		})
	}
	return &CostModel{
		Currency:   costCurrency(plan),
		Dimensions: dimensions,
	}
}

func aggregateUsageTotals(events []entity.BillingUsageEvent) map[string]float64 {
	totals := map[string]float64{}
	for _, event := range events {
		usage := jsonToFloatMap(event.Usage)
		for key, value := range usage {
			totals[key] = totals[key] + value
		}
	}
	return totals
}

func buildCostBreakdown(usageTotals map[string]float64, plan *entity.BillingPlan) ([]DimensionCost, []CategoryCost, float64) {
	if usageTotals == nil {
		usageTotals = map[string]float64{}
	}
	rates := jsonToFloatMap(plan.RateRules)
	dimensionCosts := make([]DimensionCost, 0, len(billingDimensions))
	categoryTotals := map[string]float64{}
	totalRaw := 0.0

	for _, dim := range billingDimensions {
		usage := usageTotals[dim.Key]
		rate := rates[dim.Key]
		rawCost := usage * rate
		category := billingDimensionCategory(dim.Key)
		if category == "" {
			category = "other"
		}
		categoryTotals[category] = categoryTotals[category] + rawCost
		totalRaw += rawCost

		dimensionCosts = append(dimensionCosts, DimensionCost{
			Key:      dim.Key,
			Name:     dim.Name,
			Unit:     dim.Unit,
			Category: category,
			Usage:    usage,
			Rate:     rate,
			Cost:     roundCurrency(rawCost),
		})
	}

	categoryCosts := make([]CategoryCost, 0, len(billingCostCategories))
	for _, category := range billingCostCategories {
		categoryCosts = append(categoryCosts, CategoryCost{
			Category: category,
			Cost:     roundCurrency(categoryTotals[category]),
		})
	}

	return dimensionCosts, categoryCosts, roundCurrency(totalRaw)
}

func billingDimensionCategory(key string) string {
	if category, ok := billingDimensionCategories[key]; ok {
		return category
	}
	return ""
}

func costCurrency(plan *entity.BillingPlan) string {
	if plan == nil || plan.Currency == "" {
		return "CNY"
	}
	return plan.Currency
}
