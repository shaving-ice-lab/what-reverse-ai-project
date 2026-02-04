package repository

import (
	"context"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// IdempotencyKeyRepository 幂等键仓储接口
type IdempotencyKeyRepository interface {
	GetByKey(ctx context.Context, ownerID uuid.UUID, action, key string) (*entity.IdempotencyKey, error)
	Create(ctx context.Context, record *entity.IdempotencyKey) error
	Update(ctx context.Context, record *entity.IdempotencyKey) error
}

type idempotencyKeyRepository struct {
	db *gorm.DB
}

// NewIdempotencyKeyRepository 创建幂等键仓储实例
func NewIdempotencyKeyRepository(db *gorm.DB) IdempotencyKeyRepository {
	return &idempotencyKeyRepository{db: db}
}

func (r *idempotencyKeyRepository) GetByKey(ctx context.Context, ownerID uuid.UUID, action, key string) (*entity.IdempotencyKey, error) {
	var record entity.IdempotencyKey
	if err := r.db.WithContext(ctx).
		Where("owner_user_id = ? AND action = ? AND idempotency_key = ?", ownerID, action, key).
		First(&record).Error; err != nil {
		return nil, err
	}
	return &record, nil
}

func (r *idempotencyKeyRepository) Create(ctx context.Context, record *entity.IdempotencyKey) error {
	return r.db.WithContext(ctx).Create(record).Error
}

func (r *idempotencyKeyRepository) Update(ctx context.Context, record *entity.IdempotencyKey) error {
	return r.db.WithContext(ctx).Save(record).Error
}
