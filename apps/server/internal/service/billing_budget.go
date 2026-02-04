package service

import (
	"context"
	"sort"
	"strings"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
)

const workspaceBudgetSettingsKey = "billing_budget"

var defaultBudgetThresholds = []float64{0.5, 0.8, 1.0}

// BudgetSettings 预算设置
type BudgetSettings struct {
	MonthlyBudget     float64   `json:"monthly_budget"`
	Currency          string    `json:"currency"`
	Thresholds        []float64 `json:"thresholds"`
	SpendLimit        float64   `json:"spend_limit"`
	SpendLimitEnabled bool      `json:"spend_limit_enabled"`
}

// BudgetSettingsUpdate 预算设置更新
type BudgetSettingsUpdate struct {
	MonthlyBudget     *float64  `json:"monthly_budget,omitempty"`
	Currency          *string   `json:"currency,omitempty"`
	Thresholds        []float64 `json:"thresholds,omitempty"`
	SpendLimit        *float64  `json:"spend_limit,omitempty"`
	SpendLimitEnabled *bool     `json:"spend_limit_enabled,omitempty"`
}

// BudgetAlert 预算提醒
type BudgetAlert struct {
	Threshold     float64 `json:"threshold"`
	Budget        float64 `json:"budget"`
	TriggerAmount float64 `json:"trigger_amount"`
	CurrentCost   float64 `json:"current_cost"`
	Currency      string  `json:"currency"`
}

// BudgetStatus 预算状态
type BudgetStatus struct {
	TotalCost        float64       `json:"total_cost"`
	Currency         string        `json:"currency"`
	MonthlyBudget    float64       `json:"monthly_budget"`
	Thresholds       []float64     `json:"thresholds"`
	Alerts           []BudgetAlert `json:"alerts,omitempty"`
	Exceeded         bool          `json:"exceeded"`
	SpendCapEnabled  bool          `json:"spend_cap_enabled"`
	SpendCap         float64       `json:"spend_cap"`
	SpendCapExceeded bool          `json:"spend_cap_exceeded"`
}

func (s *billingService) GetBudgetSettings(ctx context.Context, ownerID, workspaceID uuid.UUID) (*BudgetSettings, error) {
	workspace, err := s.authorizeBillingManage(ctx, workspaceID, ownerID)
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
	settings := getBudgetSettings(workspace.Settings, costCurrency(plan))
	return &settings, nil
}

func (s *billingService) UpdateBudgetSettings(ctx context.Context, ownerID, workspaceID uuid.UUID, req BudgetSettingsUpdate) (*BudgetSettings, error) {
	workspace, err := s.authorizeBillingManage(ctx, workspaceID, ownerID)
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
	current := getBudgetSettings(workspace.Settings, costCurrency(plan))
	updated := mergeBudgetSettings(current, req, costCurrency(plan))
	if err := validateBudgetSettings(updated); err != nil {
		return nil, err
	}
	workspace.Settings = applyBudgetSettings(workspace.Settings, updated)
	if err := s.workspaceRepo.Update(ctx, workspace); err != nil {
		return nil, err
	}
	return &updated, nil
}

func (s *billingService) evaluateBudget(ctx context.Context, workspace *entity.Workspace, plan *entity.BillingPlan, periodStart, periodEnd time.Time, deltaCost float64) (*BudgetStatus, error) {
	if workspace == nil {
		return nil, nil
	}
	budget := getBudgetSettings(workspace.Settings, costCurrency(plan))
	if !hasBudgetConfig(budget) {
		return nil, nil
	}
	currentTotal, err := s.usageRepo.SumCostByWorkspace(ctx, workspace.ID, periodStart, periodEnd)
	if err != nil {
		return nil, err
	}
	totalCost := roundCurrency(currentTotal + deltaCost)
	alerts := buildBudgetAlerts(budget, currentTotal, totalCost)
	exceeded := budget.MonthlyBudget > 0 && totalCost >= budget.MonthlyBudget
	spendCapExceeded := budget.SpendLimitEnabled && budget.SpendLimit > 0 && totalCost > budget.SpendLimit

	return &BudgetStatus{
		TotalCost:        totalCost,
		Currency:         budget.Currency,
		MonthlyBudget:    budget.MonthlyBudget,
		Thresholds:       budget.Thresholds,
		Alerts:           alerts,
		Exceeded:         exceeded,
		SpendCapEnabled:  budget.SpendLimitEnabled,
		SpendCap:         budget.SpendLimit,
		SpendCapExceeded: spendCapExceeded,
	}, nil
}

func (s *billingService) authorizeBillingView(ctx context.Context, workspaceID, userID uuid.UUID) (*entity.Workspace, error) {
	access, err := s.workspaceSvc.GetWorkspaceAccess(ctx, workspaceID, userID)
	if err != nil {
		return nil, err
	}
	if !hasAnyPermission(access.Permissions, PermissionBillingManage, PermissionAppViewMetrics, PermissionLogsView) {
		return nil, ErrWorkspaceUnauthorized
	}
	return access.Workspace, nil
}

func (s *billingService) authorizeBillingManage(ctx context.Context, workspaceID, userID uuid.UUID) (*entity.Workspace, error) {
	access, err := s.workspaceSvc.GetWorkspaceAccess(ctx, workspaceID, userID)
	if err != nil {
		return nil, err
	}
	if !hasPermission(access.Permissions, PermissionBillingManage) {
		return nil, ErrWorkspaceUnauthorized
	}
	return access.Workspace, nil
}

func getBudgetSettings(settings entity.JSON, defaultCurrency string) BudgetSettings {
	result := BudgetSettings{
		MonthlyBudget:     0,
		Currency:          defaultCurrency,
		Thresholds:        append([]float64{}, defaultBudgetThresholds...),
		SpendLimit:        0,
		SpendLimitEnabled: false,
	}
	if settings == nil {
		return result
	}
	raw, ok := settings[workspaceBudgetSettingsKey]
	if !ok || raw == nil {
		return result
	}
	data, ok := raw.(map[string]interface{})
	if !ok {
		if casted, ok := raw.(entity.JSON); ok {
			data = casted
		}
	}
	if data == nil {
		return result
	}
	if value, ok := toFloat(data["monthly_budget"]); ok {
		result.MonthlyBudget = value
	}
	if value, ok := data["currency"].(string); ok && strings.TrimSpace(value) != "" {
		result.Currency = strings.TrimSpace(value)
	}
	if thresholds, ok := parseThresholds(data["thresholds"]); ok {
		result.Thresholds = sanitizeThresholds(thresholds)
	}
	if value, ok := toFloat(data["spend_limit"]); ok {
		result.SpendLimit = value
	}
	if value, ok := toBool(data["spend_limit_enabled"]); ok {
		result.SpendLimitEnabled = value
	}
	return normalizeBudgetSettings(result, defaultCurrency)
}

func mergeBudgetSettings(current BudgetSettings, update BudgetSettingsUpdate, defaultCurrency string) BudgetSettings {
	if update.MonthlyBudget != nil {
		current.MonthlyBudget = *update.MonthlyBudget
	}
	if update.Currency != nil {
		current.Currency = strings.TrimSpace(*update.Currency)
	}
	if update.Thresholds != nil {
		current.Thresholds = sanitizeThresholds(update.Thresholds)
	}
	if update.SpendLimit != nil {
		current.SpendLimit = *update.SpendLimit
	}
	if update.SpendLimitEnabled != nil {
		current.SpendLimitEnabled = *update.SpendLimitEnabled
	}
	return normalizeBudgetSettings(current, defaultCurrency)
}

func normalizeBudgetSettings(settings BudgetSettings, defaultCurrency string) BudgetSettings {
	if strings.TrimSpace(settings.Currency) == "" {
		settings.Currency = defaultCurrency
	}
	if settings.Thresholds == nil {
		settings.Thresholds = append([]float64{}, defaultBudgetThresholds...)
	}
	if settings.SpendLimit <= 0 {
		settings.SpendLimitEnabled = false
	}
	return settings
}

func validateBudgetSettings(settings BudgetSettings) error {
	if settings.MonthlyBudget < 0 || settings.SpendLimit < 0 {
		return ErrBillingBudgetInvalid
	}
	if settings.SpendLimitEnabled && settings.SpendLimit <= 0 {
		return ErrBillingBudgetInvalid
	}
	if strings.TrimSpace(settings.Currency) == "" && (settings.MonthlyBudget > 0 || settings.SpendLimitEnabled) {
		return ErrBillingBudgetInvalid
	}
	for _, threshold := range settings.Thresholds {
		if threshold <= 0 || threshold > 1 {
			return ErrBillingBudgetInvalid
		}
	}
	return nil
}

func applyBudgetSettings(settings entity.JSON, budget BudgetSettings) entity.JSON {
	if settings == nil {
		settings = entity.JSON{}
	}
	settings[workspaceBudgetSettingsKey] = entity.JSON{
		"monthly_budget":      budget.MonthlyBudget,
		"currency":            budget.Currency,
		"thresholds":          budget.Thresholds,
		"spend_limit":         budget.SpendLimit,
		"spend_limit_enabled": budget.SpendLimitEnabled,
	}
	return settings
}

func parseThresholds(raw interface{}) ([]float64, bool) {
	if raw == nil {
		return nil, false
	}
	switch value := raw.(type) {
	case []float64:
		return value, true
	case []interface{}:
		thresholds := make([]float64, 0, len(value))
		for _, item := range value {
			if parsed, ok := toFloat(item); ok {
				thresholds = append(thresholds, parsed)
			}
		}
		return thresholds, true
	}
	return nil, false
}

func sanitizeThresholds(thresholds []float64) []float64 {
	cleaned := make([]float64, 0, len(thresholds))
	for _, threshold := range thresholds {
		if threshold <= 0 || threshold > 1 {
			continue
		}
		cleaned = append(cleaned, threshold)
	}
	sort.Float64s(cleaned)
	result := make([]float64, 0, len(cleaned))
	for _, value := range cleaned {
		if len(result) == 0 || result[len(result)-1] != value {
			result = append(result, value)
		}
	}
	return result
}

func buildBudgetAlerts(settings BudgetSettings, currentTotal, totalCost float64) []BudgetAlert {
	if settings.MonthlyBudget <= 0 || len(settings.Thresholds) == 0 {
		return nil
	}
	alerts := make([]BudgetAlert, 0)
	for _, threshold := range settings.Thresholds {
		trigger := settings.MonthlyBudget * threshold
		if currentTotal < trigger && totalCost >= trigger {
			alerts = append(alerts, BudgetAlert{
				Threshold:     threshold,
				Budget:        settings.MonthlyBudget,
				TriggerAmount: roundCurrency(trigger),
				CurrentCost:   totalCost,
				Currency:      settings.Currency,
			})
		}
	}
	return alerts
}

func hasBudgetConfig(settings BudgetSettings) bool {
	return settings.MonthlyBudget > 0 || (settings.SpendLimitEnabled && settings.SpendLimit > 0)
}
