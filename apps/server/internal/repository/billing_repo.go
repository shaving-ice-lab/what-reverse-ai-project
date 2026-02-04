package repository

import (
	"context"
	"errors"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// BillingPlanRepository 计费套餐仓储接口
type BillingPlanRepository interface {
	ListActive(ctx context.Context) ([]entity.BillingPlan, error)
	GetByCode(ctx context.Context, code string) (*entity.BillingPlan, error)
	GetByID(ctx context.Context, id uuid.UUID) (*entity.BillingPlan, error)
	Create(ctx context.Context, plan *entity.BillingPlan) error
	Update(ctx context.Context, plan *entity.BillingPlan) error
}

type billingPlanRepository struct {
	db *gorm.DB
}

// NewBillingPlanRepository 创建计费套餐仓储实例
func NewBillingPlanRepository(db *gorm.DB) BillingPlanRepository {
	return &billingPlanRepository{db: db}
}

func (r *billingPlanRepository) ListActive(ctx context.Context) ([]entity.BillingPlan, error) {
	var plans []entity.BillingPlan
	if err := r.db.WithContext(ctx).
		Where("status = ?", "active").
		Order("created_at asc").
		Find(&plans).Error; err != nil {
		return nil, err
	}
	return plans, nil
}

func (r *billingPlanRepository) GetByCode(ctx context.Context, code string) (*entity.BillingPlan, error) {
	var plan entity.BillingPlan
	if err := r.db.WithContext(ctx).
		First(&plan, "code = ?", code).Error; err != nil {
		return nil, err
	}
	return &plan, nil
}

func (r *billingPlanRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.BillingPlan, error) {
	var plan entity.BillingPlan
	if err := r.db.WithContext(ctx).
		First(&plan, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &plan, nil
}

func (r *billingPlanRepository) Create(ctx context.Context, plan *entity.BillingPlan) error {
	return r.db.WithContext(ctx).Create(plan).Error
}

func (r *billingPlanRepository) Update(ctx context.Context, plan *entity.BillingPlan) error {
	return r.db.WithContext(ctx).Save(plan).Error
}

// WorkspaceQuotaRepository Workspace 配额仓储接口
type WorkspaceQuotaRepository interface {
	GetActiveByWorkspace(ctx context.Context, workspaceID uuid.UUID, now time.Time) (*entity.WorkspaceQuota, error)
	GetByID(ctx context.Context, id uuid.UUID) (*entity.WorkspaceQuota, error)
	ListByWorkspace(ctx context.Context, workspaceID uuid.UUID, limit int) ([]entity.WorkspaceQuota, error)
	Create(ctx context.Context, quota *entity.WorkspaceQuota) error
	Update(ctx context.Context, quota *entity.WorkspaceQuota) error
}

type workspaceQuotaRepository struct {
	db *gorm.DB
}

// NewWorkspaceQuotaRepository 创建 Workspace 配额仓储实例
func NewWorkspaceQuotaRepository(db *gorm.DB) WorkspaceQuotaRepository {
	return &workspaceQuotaRepository{db: db}
}

func (r *workspaceQuotaRepository) GetActiveByWorkspace(ctx context.Context, workspaceID uuid.UUID, now time.Time) (*entity.WorkspaceQuota, error) {
	var quota entity.WorkspaceQuota
	if err := r.db.WithContext(ctx).
		Where("workspace_id = ? AND period_start <= ? AND period_end > ?", workspaceID, now, now).
		Order("period_start desc").
		First(&quota).Error; err != nil {
		return nil, err
	}
	return &quota, nil
}

func (r *workspaceQuotaRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.WorkspaceQuota, error) {
	var quota entity.WorkspaceQuota
	if err := r.db.WithContext(ctx).
		First(&quota, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &quota, nil
}

func (r *workspaceQuotaRepository) ListByWorkspace(ctx context.Context, workspaceID uuid.UUID, limit int) ([]entity.WorkspaceQuota, error) {
	var quotas []entity.WorkspaceQuota
	query := r.db.WithContext(ctx).
		Where("workspace_id = ?", workspaceID).
		Order("period_start desc")
	if limit > 0 {
		query = query.Limit(limit)
	}
	if err := query.Find(&quotas).Error; err != nil {
		return nil, err
	}
	return quotas, nil
}

func (r *workspaceQuotaRepository) Create(ctx context.Context, quota *entity.WorkspaceQuota) error {
	return r.db.WithContext(ctx).Create(quota).Error
}

func (r *workspaceQuotaRepository) Update(ctx context.Context, quota *entity.WorkspaceQuota) error {
	return r.db.WithContext(ctx).Save(quota).Error
}

// BillingUsageEventRepository 用量事件仓储接口
type BillingUsageEventRepository interface {
	Create(ctx context.Context, event *entity.BillingUsageEvent) error
	ListByWorkspace(ctx context.Context, workspaceID uuid.UUID, periodStart, periodEnd time.Time, limit int) ([]entity.BillingUsageEvent, error)
	SumCostByWorkspace(ctx context.Context, workspaceID uuid.UUID, periodStart, periodEnd time.Time) (float64, error)
}

type billingUsageEventRepository struct {
	db *gorm.DB
}

// NewBillingUsageEventRepository 创建用量事件仓储实例
func NewBillingUsageEventRepository(db *gorm.DB) BillingUsageEventRepository {
	return &billingUsageEventRepository{db: db}
}

func (r *billingUsageEventRepository) Create(ctx context.Context, event *entity.BillingUsageEvent) error {
	return r.db.WithContext(ctx).Create(event).Error
}

func (r *billingUsageEventRepository) ListByWorkspace(ctx context.Context, workspaceID uuid.UUID, periodStart, periodEnd time.Time, limit int) ([]entity.BillingUsageEvent, error) {
	var events []entity.BillingUsageEvent
	query := r.db.WithContext(ctx).
		Where("workspace_id = ? AND recorded_at >= ? AND recorded_at < ?", workspaceID, periodStart, periodEnd).
		Order("recorded_at desc")
	if limit > 0 {
		query = query.Limit(limit)
	}
	if err := query.Find(&events).Error; err != nil {
		return nil, err
	}
	return events, nil
}

func (r *billingUsageEventRepository) SumCostByWorkspace(ctx context.Context, workspaceID uuid.UUID, periodStart, periodEnd time.Time) (float64, error) {
	var total float64
	if err := r.db.WithContext(ctx).
		Model(&entity.BillingUsageEvent{}).
		Select("COALESCE(SUM(cost_amount), 0)").
		Where("workspace_id = ? AND recorded_at >= ? AND recorded_at < ?", workspaceID, periodStart, periodEnd).
		Scan(&total).Error; err != nil {
		return 0, err
	}
	return total, nil
}

// AppUsageStatRepository App 用量统计仓储接口
type AppUsageStatRepository interface {
	GetByWorkspaceAndPeriod(ctx context.Context, workspaceID uuid.UUID, periodStart, periodEnd time.Time) ([]entity.AppUsageStat, error)
	GetByWorkspaceAppPeriod(ctx context.Context, workspaceID, appID uuid.UUID, periodStart, periodEnd time.Time) (*entity.AppUsageStat, error)
	Create(ctx context.Context, stat *entity.AppUsageStat) error
	Update(ctx context.Context, stat *entity.AppUsageStat) error
}

type appUsageStatRepository struct {
	db *gorm.DB
}

// NewAppUsageStatRepository 创建 App 用量统计仓储实例
func NewAppUsageStatRepository(db *gorm.DB) AppUsageStatRepository {
	return &appUsageStatRepository{db: db}
}

func (r *appUsageStatRepository) GetByWorkspaceAndPeriod(ctx context.Context, workspaceID uuid.UUID, periodStart, periodEnd time.Time) ([]entity.AppUsageStat, error) {
	var stats []entity.AppUsageStat
	if err := r.db.WithContext(ctx).
		Preload("App").
		Where("workspace_id = ? AND period_start = ? AND period_end = ?", workspaceID, periodStart, periodEnd).
		Order("cost_amount desc").
		Find(&stats).Error; err != nil {
		return nil, err
	}
	return stats, nil
}

func (r *appUsageStatRepository) GetByWorkspaceAppPeriod(ctx context.Context, workspaceID, appID uuid.UUID, periodStart, periodEnd time.Time) (*entity.AppUsageStat, error) {
	var stat entity.AppUsageStat
	if err := r.db.WithContext(ctx).
		Where("workspace_id = ? AND app_id = ? AND period_start = ? AND period_end = ?", workspaceID, appID, periodStart, periodEnd).
		First(&stat).Error; err != nil {
		return nil, err
	}
	return &stat, nil
}

func (r *appUsageStatRepository) Create(ctx context.Context, stat *entity.AppUsageStat) error {
	return r.db.WithContext(ctx).Create(stat).Error
}

func (r *appUsageStatRepository) Update(ctx context.Context, stat *entity.AppUsageStat) error {
	return r.db.WithContext(ctx).Save(stat).Error
}

// BillingInvoicePaymentRepository 账单支付状态仓储接口
type BillingInvoicePaymentRepository interface {
	GetByInvoiceID(ctx context.Context, invoiceID uuid.UUID) (*entity.BillingInvoicePayment, error)
	Create(ctx context.Context, payment *entity.BillingInvoicePayment) error
	Update(ctx context.Context, payment *entity.BillingInvoicePayment) error
}

type billingInvoicePaymentRepository struct {
	db *gorm.DB
}

// NewBillingInvoicePaymentRepository 创建账单支付状态仓储实例
func NewBillingInvoicePaymentRepository(db *gorm.DB) BillingInvoicePaymentRepository {
	return &billingInvoicePaymentRepository{db: db}
}

func (r *billingInvoicePaymentRepository) GetByInvoiceID(ctx context.Context, invoiceID uuid.UUID) (*entity.BillingInvoicePayment, error) {
	var payment entity.BillingInvoicePayment
	if err := r.db.WithContext(ctx).
		First(&payment, "invoice_id = ?", invoiceID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &payment, nil
}

func (r *billingInvoicePaymentRepository) Create(ctx context.Context, payment *entity.BillingInvoicePayment) error {
	return r.db.WithContext(ctx).Create(payment).Error
}

func (r *billingInvoicePaymentRepository) Update(ctx context.Context, payment *entity.BillingInvoicePayment) error {
	return r.db.WithContext(ctx).Save(payment).Error
}
