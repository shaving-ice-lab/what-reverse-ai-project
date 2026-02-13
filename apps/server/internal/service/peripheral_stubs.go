package service

// peripheral_stubs.go
// 此文件保留被移除的周边模块的接口定义和类型，以确保核心服务编译通过。
// 实体已清理，这里使用内联占位类型。

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/reverseai/server/internal/domain/entity"
)

// ==================== Billing Stubs ====================

// BillingPlanStub 计费计划占位类型
type BillingPlanStub struct {
	ID     uuid.UUID              `json:"id"`
	Name   string                 `json:"name"`
	Policy map[string]interface{} `json:"policy"`
}

// WorkspaceQuotaStub 配额占位类型
type WorkspaceQuotaStub struct {
	WorkspaceID uuid.UUID              `json:"workspace_id"`
	Limits      map[string]interface{} `json:"limits"`
	Usage       map[string]interface{} `json:"usage"`
	PeriodEnd   time.Time              `json:"period_end"`
}

// BillingService 计费与配额服务接口（已冻结，后续再接入）
type BillingService interface {
	ListDimensions(ctx context.Context) []BillingDimension
	ListPlans(ctx context.Context) ([]BillingPlanStub, error)
	GetWorkspaceQuota(ctx context.Context, ownerID, workspaceID uuid.UUID) (*WorkspaceQuotaStub, *BillingPlanStub, error)
	ConsumeUsage(ctx context.Context, ownerID, workspaceID uuid.UUID, req ConsumeUsageRequest) (*ConsumeUsageResult, error)
	GetWorkspaceUsageStats(ctx context.Context, ownerID, workspaceID uuid.UUID, periodStart, periodEnd time.Time) (*entity.WorkspaceUsageStats, error)
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
	Quota      *WorkspaceQuotaStub `json:"quota"`
	Plan       *BillingPlanStub    `json:"plan"`
	Allowed    bool                `json:"allowed"`
	Exceeded   []string            `json:"exceeded"`
	CostAmount float64             `json:"cost_amount"`
	Currency   string              `json:"currency"`
	Budget     *BudgetStatus       `json:"budget,omitempty"`
}

// BudgetStatus 预算状态
type BudgetStatus struct {
	TotalCost     float64 `json:"total_cost"`
	Currency      string  `json:"currency"`
	MonthlyBudget float64 `json:"monthly_budget"`
}

var (
	ErrBillingInvalidUsage     = errors.New("billing usage is invalid")
	ErrBillingInvalidDimension = errors.New("billing dimension is invalid")
)

// ==================== Data Classification Stubs ====================

const DataClassificationPublic = "public"

type dataClassificationRequirement struct {
	requireAuth   bool
	requireMember bool
	requireOwner  bool
	requireAdmin  bool
}

func resolveDataClassificationRequirement(classification string) dataClassificationRequirement {
	switch classification {
	case "confidential":
		return dataClassificationRequirement{requireAuth: true, requireMember: true}
	case "internal":
		return dataClassificationRequirement{requireAuth: true}
	case "restricted":
		return dataClassificationRequirement{requireAuth: true, requireOwner: true}
	default:
		return dataClassificationRequirement{}
	}
}

// ==================== Misc Error Stubs ====================

var (
	ErrUnauthorized = errors.New("unauthorized")
	ErrSlugExists   = errors.New("slug already exists")
)
