package repository

import (
	"context"
	"errors"
	"strings"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AnalyticsMetricDefinitionRepository 指标定义仓储接口
type AnalyticsMetricDefinitionRepository interface {
	Create(ctx context.Context, definition *entity.AnalyticsMetricDefinition) error
	Update(ctx context.Context, definition *entity.AnalyticsMetricDefinition) error
	GetByName(ctx context.Context, workspaceID uuid.UUID, name string) (*entity.AnalyticsMetricDefinition, error)
	ListByWorkspace(ctx context.Context, workspaceID uuid.UUID, includeInactive bool) ([]entity.AnalyticsMetricDefinition, error)
}

type analyticsMetricDefinitionRepository struct {
	db *gorm.DB
}

// NewAnalyticsMetricDefinitionRepository 创建指标定义仓储实例
func NewAnalyticsMetricDefinitionRepository(db *gorm.DB) AnalyticsMetricDefinitionRepository {
	return &analyticsMetricDefinitionRepository{db: db}
}

func (r *analyticsMetricDefinitionRepository) Create(ctx context.Context, definition *entity.AnalyticsMetricDefinition) error {
	return r.db.WithContext(ctx).Create(definition).Error
}

func (r *analyticsMetricDefinitionRepository) Update(ctx context.Context, definition *entity.AnalyticsMetricDefinition) error {
	return r.db.WithContext(ctx).Save(definition).Error
}

func (r *analyticsMetricDefinitionRepository) GetByName(ctx context.Context, workspaceID uuid.UUID, name string) (*entity.AnalyticsMetricDefinition, error) {
	trimmed := strings.TrimSpace(name)
	if trimmed == "" {
		return nil, nil
	}
	var definition entity.AnalyticsMetricDefinition
	err := r.db.WithContext(ctx).
		Where("workspace_id = ? AND name = ?", workspaceID, trimmed).
		First(&definition).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &definition, nil
}

func (r *analyticsMetricDefinitionRepository) ListByWorkspace(ctx context.Context, workspaceID uuid.UUID, includeInactive bool) ([]entity.AnalyticsMetricDefinition, error) {
	query := r.db.WithContext(ctx).
		Where("workspace_id = ?", workspaceID).
		Order("name ASC")
	if !includeInactive {
		query = query.Where("is_active = ?", true)
	}
	var items []entity.AnalyticsMetricDefinition
	if err := query.Find(&items).Error; err != nil {
		return nil, err
	}
	return items, nil
}
