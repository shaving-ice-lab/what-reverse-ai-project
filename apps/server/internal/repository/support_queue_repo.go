package repository

import (
	"context"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SupportQueueRepository 支持队列仓储接口
type SupportQueueRepository interface {
	List(ctx context.Context, includeDisabled bool) ([]entity.SupportQueue, error)
	Create(ctx context.Context, queue *entity.SupportQueue) error
	Update(ctx context.Context, queue *entity.SupportQueue) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.SupportQueue, error)
}

type supportQueueRepository struct {
	db *gorm.DB
}

// NewSupportQueueRepository 创建支持队列仓储实例
func NewSupportQueueRepository(db *gorm.DB) SupportQueueRepository {
	return &supportQueueRepository{db: db}
}

func (r *supportQueueRepository) List(ctx context.Context, includeDisabled bool) ([]entity.SupportQueue, error) {
	var queues []entity.SupportQueue
	query := r.db.WithContext(ctx).Model(&entity.SupportQueue{})
	if !includeDisabled {
		query = query.Where("enabled = ?", true)
	}
	if err := query.Order("created_at DESC").Find(&queues).Error; err != nil {
		return nil, err
	}
	return queues, nil
}

func (r *supportQueueRepository) Create(ctx context.Context, queue *entity.SupportQueue) error {
	return r.db.WithContext(ctx).Create(queue).Error
}

func (r *supportQueueRepository) Update(ctx context.Context, queue *entity.SupportQueue) error {
	return r.db.WithContext(ctx).Save(queue).Error
}

func (r *supportQueueRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.SupportQueue, error) {
	var queue entity.SupportQueue
	if err := r.db.WithContext(ctx).First(&queue, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &queue, nil
}
