package repository

// peripheral_stubs.go
// 此文件保留被移除的周边模块的仓储接口定义，确保依赖它们的核心服务编译通过。
// 后续重新开发这些模块时，替换为完整实现。

import (
	"context"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
)

// WorkspaceExportRepository 导出任务仓储接口（已冻结）
type WorkspaceExportRepository interface {
	Create(ctx context.Context, job *entity.WorkspaceExportJob) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.WorkspaceExportJob, error)
	DeleteByID(ctx context.Context, id uuid.UUID) error
	GetLatestByWorkspaceAndType(ctx context.Context, workspaceID uuid.UUID, jobType entity.WorkspaceExportJobType) (*entity.WorkspaceExportJob, error)
	GetLatestCompletedByWorkspaceAndType(ctx context.Context, workspaceID uuid.UUID, jobType entity.WorkspaceExportJobType) (*entity.WorkspaceExportJob, error)
	HasActiveByWorkspaceAndType(ctx context.Context, workspaceID uuid.UUID, jobType entity.WorkspaceExportJobType) (bool, error)
	ListByWorkspaceAndType(ctx context.Context, workspaceID uuid.UUID, jobType entity.WorkspaceExportJobType) ([]entity.WorkspaceExportJob, error)
	ListExpiredByType(ctx context.Context, jobType entity.WorkspaceExportJobType, limit int) ([]entity.WorkspaceExportJob, error)
	ExistsByWorkspaceTypeAndRange(ctx context.Context, workspaceID uuid.UUID, jobType entity.WorkspaceExportJobType, rangeStart, rangeEnd time.Time) (bool, error)
	DeleteByWorkspaceAndType(ctx context.Context, workspaceID uuid.UUID, jobType entity.WorkspaceExportJobType) (int64, error)
}

// WorkspaceQuotaRepository 配额仓储接口（已冻结）
type WorkspaceQuotaRepository interface {
	GetActiveByWorkspace(ctx context.Context, workspaceID uuid.UUID, now time.Time) (*entity.WorkspaceQuota, error)
}

// BillingPlanRepository 计费计划仓储接口（已冻结）
type BillingPlanRepository interface{}

// BillingUsageEventRepository 计费用量仓储接口（已冻结）
type BillingUsageEventRepository interface{}

// BillingInvoicePaymentRepository 发票支付仓储接口（已冻结）
type BillingInvoicePaymentRepository interface{}

// ModelUsageRepository 模型用量仓储接口（已冻结）
type ModelUsageRepository interface{}
