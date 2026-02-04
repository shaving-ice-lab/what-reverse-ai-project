package repository

import (
	"context"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// WebhookEndpointRepository Webhook 端点仓储接口
type WebhookEndpointRepository interface {
	Create(ctx context.Context, endpoint *entity.WebhookEndpoint) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.WebhookEndpoint, error)
	ListByWorkspace(ctx context.Context, workspaceID uuid.UUID) ([]entity.WebhookEndpoint, error)
	Update(ctx context.Context, endpoint *entity.WebhookEndpoint) error
	Delete(ctx context.Context, id uuid.UUID) error
	UpdateLastTriggered(ctx context.Context, id uuid.UUID, triggeredAt time.Time) error
}

type webhookEndpointRepository struct {
	db *gorm.DB
}

// NewWebhookEndpointRepository 创建 Webhook 端点仓储实例
func NewWebhookEndpointRepository(db *gorm.DB) WebhookEndpointRepository {
	return &webhookEndpointRepository{db: db}
}

func (r *webhookEndpointRepository) Create(ctx context.Context, endpoint *entity.WebhookEndpoint) error {
	return r.db.WithContext(ctx).Create(endpoint).Error
}

func (r *webhookEndpointRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.WebhookEndpoint, error) {
	var endpoint entity.WebhookEndpoint
	if err := r.db.WithContext(ctx).First(&endpoint, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &endpoint, nil
}

func (r *webhookEndpointRepository) ListByWorkspace(ctx context.Context, workspaceID uuid.UUID) ([]entity.WebhookEndpoint, error) {
	var endpoints []entity.WebhookEndpoint
	if err := r.db.WithContext(ctx).
		Where("workspace_id = ?", workspaceID).
		Order("created_at desc").
		Find(&endpoints).Error; err != nil {
		return nil, err
	}
	return endpoints, nil
}

func (r *webhookEndpointRepository) Update(ctx context.Context, endpoint *entity.WebhookEndpoint) error {
	return r.db.WithContext(ctx).Save(endpoint).Error
}

func (r *webhookEndpointRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&entity.WebhookEndpoint{}, "id = ?", id).Error
}

func (r *webhookEndpointRepository) UpdateLastTriggered(ctx context.Context, id uuid.UUID, triggeredAt time.Time) error {
	return r.db.WithContext(ctx).
		Model(&entity.WebhookEndpoint{}).
		Where("id = ?", id).
		Update("last_triggered_at", triggeredAt).Error
}
