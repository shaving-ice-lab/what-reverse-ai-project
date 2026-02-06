package repository

import (
	"context"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AnalyticsMetricFilter 指标查询过滤器
type AnalyticsMetricFilter struct {
	WorkspaceID uuid.UUID
	Names       []string
	StartTime   *time.Time
	EndTime     *time.Time
	Page        int
	PageSize    int
	OrderDesc   bool
}

// AnalyticsMetricRepository 指标仓储接口
type AnalyticsMetricRepository interface {
	CreateBatch(ctx context.Context, metrics []*entity.AnalyticsMetric) error
	List(ctx context.Context, filter AnalyticsMetricFilter) ([]entity.AnalyticsMetric, int64, error)
}

type analyticsMetricRepository struct {
	db *gorm.DB
}

// NewAnalyticsMetricRepository 创建指标仓储实例
func NewAnalyticsMetricRepository(db *gorm.DB) AnalyticsMetricRepository {
	return &analyticsMetricRepository{db: db}
}

func (r *analyticsMetricRepository) CreateBatch(ctx context.Context, metrics []*entity.AnalyticsMetric) error {
	if len(metrics) == 0 {
		return nil
	}
	return r.db.WithContext(ctx).CreateInBatches(metrics, 200).Error
}

func (r *analyticsMetricRepository) List(ctx context.Context, filter AnalyticsMetricFilter) ([]entity.AnalyticsMetric, int64, error) {
	query := r.db.WithContext(ctx).Model(&entity.AnalyticsMetric{})
	query = applyMetricFilter(query, filter)

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	page := filter.Page
	if page < 1 {
		page = 1
	}
	pageSize := filter.PageSize
	if pageSize < 1 {
		pageSize = 50
	}
	if pageSize > 1000 {
		pageSize = 1000
	}

	order := "recorded_at ASC"
	if filter.OrderDesc {
		order = "recorded_at DESC"
	}

	var metrics []entity.AnalyticsMetric
	if err := query.Order(order).
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Find(&metrics).Error; err != nil {
		return nil, 0, err
	}
	return metrics, total, nil
}

func applyMetricFilter(query *gorm.DB, filter AnalyticsMetricFilter) *gorm.DB {
	if filter.WorkspaceID != uuid.Nil {
		query = query.Where("workspace_id = ?", filter.WorkspaceID)
	}
	if len(filter.Names) > 0 {
		query = query.Where("name IN ?", filter.Names)
	}
	if filter.StartTime != nil {
		query = query.Where("recorded_at >= ?", filter.StartTime)
	}
	if filter.EndTime != nil {
		query = query.Where("recorded_at <= ?", filter.EndTime)
	}
	return query
}
