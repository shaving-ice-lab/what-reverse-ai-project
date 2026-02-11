package service

// peripheral_stubs.go
// 此文件保留被移除的周边模块的接口定义和类型，以确保核心服务编译通过。
// 这些模块（计费、域名、导出等）的实现已移除，后续需要时再重新开发。

import (
	"context"
	"errors"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
)

// ==================== Billing Stubs ====================

// BillingService 计费与配额服务接口（已冻结，后续再接入）
type BillingService interface {
	ListDimensions(ctx context.Context) []BillingDimension
	ListPlans(ctx context.Context) ([]entity.BillingPlan, error)
	GetWorkspaceQuota(ctx context.Context, ownerID, workspaceID uuid.UUID) (*entity.WorkspaceQuota, *entity.BillingPlan, error)
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
	Quota      *entity.WorkspaceQuota `json:"quota"`
	Plan       *entity.BillingPlan    `json:"plan"`
	Allowed    bool                   `json:"allowed"`
	Exceeded   []string               `json:"exceeded"`
	CostAmount float64                `json:"cost_amount"`
	Currency   string                 `json:"currency"`
	Budget     *BudgetStatus          `json:"budget,omitempty"`
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

// ==================== Domain Stubs ====================

// WorkspaceDomainService 工作空间域名服务（已冻结，后续再接入）
type WorkspaceDomainService interface {
	VerifyDomainByID(ctx context.Context, userID, domainID uuid.UUID) (*WorkspaceDomainVerifyResult, error)
	RenewCertificate(ctx context.Context, ownerID, workspaceID, domainID uuid.UUID) (*entity.WorkspaceDomain, error)
}

// WorkspaceDomainVerifyResult 域名验证结果
type WorkspaceDomainVerifyResult struct {
	Domain       *entity.WorkspaceDomain `json:"domain"`
	Verification *DomainVerificationInfo `json:"verification,omitempty"`
	Verified     bool                    `json:"verified"`
}

// DomainVerificationInfo 域名验证信息
type DomainVerificationInfo struct {
	TxtName     string `json:"txt_name"`
	TxtValue    string `json:"txt_value"`
	CnameTarget string `json:"cname_target"`
}

// DomainVerifyError 域名验证错误（支持重试）
type DomainVerifyError struct {
	NextRetryAt *time.Time
	Cause       error
}

func (e *DomainVerifyError) Error() string {
	if e == nil {
		return ""
	}
	if e.Cause != nil {
		return e.Cause.Error()
	}
	return "domain verify failed"
}

func (e *DomainVerifyError) Unwrap() error {
	if e == nil {
		return nil
	}
	return e.Cause
}

// ==================== Export Stubs ====================

// WorkspaceExportService 导出任务服务接口（已冻结，后续再接入）
type WorkspaceExportService interface {
	RequestExport(ctx context.Context, workspaceID, userID uuid.UUID) (*entity.WorkspaceExportJob, error)
	GetJob(ctx context.Context, workspaceID, jobID, userID uuid.UUID) (*entity.WorkspaceExportJob, error)
	Download(ctx context.Context, workspaceID, jobID, userID uuid.UUID) (*WorkspaceExportDownload, error)
	RunWorker(ctx context.Context)
}

// WorkspaceExportDownload 导出下载信息
type WorkspaceExportDownload struct {
	FilePath string
	FileName string
}

var (
	ErrWorkspaceExportDisabled           = errors.New("workspace export disabled")
	ErrWorkspaceExportNotFound           = errors.New("workspace export not found")
	ErrWorkspaceExportNotReady           = errors.New("workspace export not ready")
	ErrWorkspaceExportExpired            = errors.New("workspace export expired")
	ErrWorkspaceDomainNotFound           = errors.New("workspace domain not found")
	ErrWorkspaceDomainInvalid            = errors.New("workspace domain invalid")
	ErrWorkspaceDomainVerificationFailed = errors.New("workspace domain verification failed")
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
	ErrSlugExists      = errors.New("slug already exists")
	ErrInvalidRating   = errors.New("invalid rating")
	ErrAlreadyReviewed = errors.New("already reviewed")
)

// ==================== Utility Stubs ====================

func startOfDay(t time.Time) time.Time {
	return time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, t.Location())
}

// ==================== Metrics Stubs ====================

// MetricsService 指标服务接口（已冻结）
type MetricsService interface{}

// ModelUsageService 模型用量服务接口（已冻结）
type ModelUsageService interface{}
