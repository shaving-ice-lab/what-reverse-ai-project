package repository

import (
	"context"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SecretFilter 机密列表筛选条件
type SecretFilter struct {
	OwnerType  string
	OwnerID    *uuid.UUID
	SecretType *string
	Status     *string
}

// SecretRepository 机密仓储接口
type SecretRepository interface {
	Create(ctx context.Context, secret *entity.Secret) error
	Update(ctx context.Context, secret *entity.Secret) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.Secret, error)
	List(ctx context.Context, filter SecretFilter) ([]entity.Secret, error)
}

type secretRepository struct {
	db *gorm.DB
}

// NewSecretRepository 创建机密仓储实例
func NewSecretRepository(db *gorm.DB) SecretRepository {
	return &secretRepository{db: db}
}

func (r *secretRepository) Create(ctx context.Context, secret *entity.Secret) error {
	return r.db.WithContext(ctx).Create(secret).Error
}

func (r *secretRepository) Update(ctx context.Context, secret *entity.Secret) error {
	return r.db.WithContext(ctx).Save(secret).Error
}

func (r *secretRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.Secret, error) {
	var secret entity.Secret
	if err := r.db.WithContext(ctx).First(&secret, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &secret, nil
}

func (r *secretRepository) List(ctx context.Context, filter SecretFilter) ([]entity.Secret, error) {
	query := r.db.WithContext(ctx).Model(&entity.Secret{})

	if filter.OwnerType != "" {
		query = query.Where("owner_type = ?", filter.OwnerType)
	}
	if filter.OwnerID != nil {
		query = query.Where("owner_id = ?", *filter.OwnerID)
	}
	if filter.SecretType != nil && *filter.SecretType != "" {
		query = query.Where("secret_type = ?", *filter.SecretType)
	}
	if filter.Status != nil && *filter.Status != "" {
		query = query.Where("status = ?", *filter.Status)
	}

	var secrets []entity.Secret
	if err := query.Order("created_at desc").Find(&secrets).Error; err != nil {
		return nil, err
	}
	return secrets, nil
}
