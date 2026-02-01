package repository

import (
	"context"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// APIKeyRepository API 密钥仓储接口
type APIKeyRepository interface {
	Create(ctx context.Context, apiKey *entity.APIKey) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.APIKey, error)
	GetByProvider(ctx context.Context, userID uuid.UUID, provider string) (*entity.APIKey, error)
	List(ctx context.Context, userID uuid.UUID) ([]entity.APIKey, error)
	Update(ctx context.Context, apiKey *entity.APIKey) error
	Delete(ctx context.Context, id uuid.UUID) error
	UpdateLastUsed(ctx context.Context, id uuid.UUID) error
}

type apiKeyRepository struct {
	db *gorm.DB
}

// NewAPIKeyRepository 创建 API 密钥仓储实例
func NewAPIKeyRepository(db *gorm.DB) APIKeyRepository {
	return &apiKeyRepository{db: db}
}

func (r *apiKeyRepository) Create(ctx context.Context, apiKey *entity.APIKey) error {
	return r.db.WithContext(ctx).Create(apiKey).Error
}

func (r *apiKeyRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.APIKey, error) {
	var apiKey entity.APIKey
	if err := r.db.WithContext(ctx).First(&apiKey, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &apiKey, nil
}

func (r *apiKeyRepository) GetByProvider(ctx context.Context, userID uuid.UUID, provider string) (*entity.APIKey, error) {
	var apiKey entity.APIKey
	if err := r.db.WithContext(ctx).
		Where("user_id = ? AND provider = ? AND is_active = ?", userID, provider, true).
		First(&apiKey).Error; err != nil {
		return nil, err
	}
	return &apiKey, nil
}

func (r *apiKeyRepository) List(ctx context.Context, userID uuid.UUID) ([]entity.APIKey, error) {
	var apiKeys []entity.APIKey
	if err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("created_at desc").
		Find(&apiKeys).Error; err != nil {
		return nil, err
	}
	return apiKeys, nil
}

func (r *apiKeyRepository) Update(ctx context.Context, apiKey *entity.APIKey) error {
	return r.db.WithContext(ctx).Save(apiKey).Error
}

func (r *apiKeyRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&entity.APIKey{}, "id = ?", id).Error
}

func (r *apiKeyRepository) UpdateLastUsed(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).
		Model(&entity.APIKey{}).
		Where("id = ?", id).
		Update("last_used_at", gorm.Expr("NOW()")).Error
}
