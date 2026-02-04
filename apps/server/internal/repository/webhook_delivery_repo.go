package repository

import (
	"context"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// WebhookDeliveryRepository Webhook 投递记录仓储接口
type WebhookDeliveryRepository interface {
	Create(ctx context.Context, delivery *entity.WebhookDelivery) error
	Update(ctx context.Context, delivery *entity.WebhookDelivery) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.WebhookDelivery, error)
	ListByEndpoint(ctx context.Context, endpointID uuid.UUID, status *entity.WebhookDeliveryStatus, page, pageSize int) ([]entity.WebhookDelivery, int64, error)
}

type webhookDeliveryRepository struct {
	db *gorm.DB
}

// NewWebhookDeliveryRepository 创建 Webhook 投递记录仓储实例
func NewWebhookDeliveryRepository(db *gorm.DB) WebhookDeliveryRepository {
	return &webhookDeliveryRepository{db: db}
}

func (r *webhookDeliveryRepository) Create(ctx context.Context, delivery *entity.WebhookDelivery) error {
	return r.db.WithContext(ctx).Create(delivery).Error
}

func (r *webhookDeliveryRepository) Update(ctx context.Context, delivery *entity.WebhookDelivery) error {
	return r.db.WithContext(ctx).Save(delivery).Error
}

func (r *webhookDeliveryRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.WebhookDelivery, error) {
	var delivery entity.WebhookDelivery
	if err := r.db.WithContext(ctx).First(&delivery, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &delivery, nil
}

func (r *webhookDeliveryRepository) ListByEndpoint(ctx context.Context, endpointID uuid.UUID, status *entity.WebhookDeliveryStatus, page, pageSize int) ([]entity.WebhookDelivery, int64, error) {
	var deliveries []entity.WebhookDelivery
	var total int64

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	query := r.db.WithContext(ctx).
		Model(&entity.WebhookDelivery{}).
		Where("endpoint_id = ?", endpointID)

	if status != nil && *status != "" {
		query = query.Where("status = ?", *status)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	if err := query.
		Order("created_at desc").
		Offset(offset).
		Limit(pageSize).
		Find(&deliveries).Error; err != nil {
		return nil, 0, err
	}

	return deliveries, total, nil
}
