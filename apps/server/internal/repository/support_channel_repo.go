package repository

import (
	"context"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SupportChannelRepository 支持渠道仓储接口
type SupportChannelRepository interface {
	List(ctx context.Context, includeDisabled bool) ([]entity.SupportChannel, error)
	Create(ctx context.Context, channel *entity.SupportChannel) error
	Update(ctx context.Context, channel *entity.SupportChannel) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.SupportChannel, error)
	GetByKey(ctx context.Context, key string) (*entity.SupportChannel, error)
}

type supportChannelRepository struct {
	db *gorm.DB
}

// NewSupportChannelRepository 创建支持渠道仓储实例
func NewSupportChannelRepository(db *gorm.DB) SupportChannelRepository {
	return &supportChannelRepository{db: db}
}

func (r *supportChannelRepository) List(ctx context.Context, includeDisabled bool) ([]entity.SupportChannel, error) {
	var channels []entity.SupportChannel
	query := r.db.WithContext(ctx).Model(&entity.SupportChannel{})
	if !includeDisabled {
		query = query.Where("enabled = ?", true)
	}
	if err := query.Order("sort_order ASC, created_at DESC").Find(&channels).Error; err != nil {
		return nil, err
	}
	return channels, nil
}

func (r *supportChannelRepository) Create(ctx context.Context, channel *entity.SupportChannel) error {
	return r.db.WithContext(ctx).Create(channel).Error
}

func (r *supportChannelRepository) Update(ctx context.Context, channel *entity.SupportChannel) error {
	return r.db.WithContext(ctx).Save(channel).Error
}

func (r *supportChannelRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.SupportChannel, error) {
	var channel entity.SupportChannel
	if err := r.db.WithContext(ctx).First(&channel, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &channel, nil
}

func (r *supportChannelRepository) GetByKey(ctx context.Context, key string) (*entity.SupportChannel, error) {
	var channel entity.SupportChannel
	if err := r.db.WithContext(ctx).First(&channel, "key = ?", key).Error; err != nil {
		return nil, err
	}
	return &channel, nil
}
