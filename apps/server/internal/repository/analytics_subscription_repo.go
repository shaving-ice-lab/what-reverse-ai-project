package repository

import (
	"context"
	"errors"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AnalyticsSubscriptionRepository 数据订阅仓储接口
type AnalyticsSubscriptionRepository interface {
	Create(ctx context.Context, subscription *entity.AnalyticsSubscription) error
	GetByIDAndWorkspace(ctx context.Context, id, workspaceID uuid.UUID) (*entity.AnalyticsSubscription, error)
	ListByWorkspace(ctx context.Context, workspaceID uuid.UUID) ([]entity.AnalyticsSubscription, error)
	Update(ctx context.Context, subscription *entity.AnalyticsSubscription) error
	Delete(ctx context.Context, id, workspaceID uuid.UUID) error
}

type analyticsSubscriptionRepository struct {
	db *gorm.DB
}

// NewAnalyticsSubscriptionRepository 创建订阅仓储实例
func NewAnalyticsSubscriptionRepository(db *gorm.DB) AnalyticsSubscriptionRepository {
	return &analyticsSubscriptionRepository{db: db}
}

func (r *analyticsSubscriptionRepository) Create(ctx context.Context, subscription *entity.AnalyticsSubscription) error {
	return r.db.WithContext(ctx).Create(subscription).Error
}

func (r *analyticsSubscriptionRepository) GetByIDAndWorkspace(ctx context.Context, id, workspaceID uuid.UUID) (*entity.AnalyticsSubscription, error) {
	var subscription entity.AnalyticsSubscription
	if err := r.db.WithContext(ctx).
		Where("id = ? AND workspace_id = ?", id, workspaceID).
		First(&subscription).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &subscription, nil
}

func (r *analyticsSubscriptionRepository) ListByWorkspace(ctx context.Context, workspaceID uuid.UUID) ([]entity.AnalyticsSubscription, error) {
	var items []entity.AnalyticsSubscription
	err := r.db.WithContext(ctx).
		Where("workspace_id = ?", workspaceID).
		Order("created_at DESC").
		Find(&items).Error
	return items, err
}

func (r *analyticsSubscriptionRepository) Update(ctx context.Context, subscription *entity.AnalyticsSubscription) error {
	return r.db.WithContext(ctx).Save(subscription).Error
}

func (r *analyticsSubscriptionRepository) Delete(ctx context.Context, id, workspaceID uuid.UUID) error {
	return r.db.WithContext(ctx).
		Where("id = ? AND workspace_id = ?", id, workspaceID).
		Delete(&entity.AnalyticsSubscription{}).Error
}
