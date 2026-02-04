package repository

import (
	"context"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AppAccessPolicyRepository App 访问策略仓储接口
type AppAccessPolicyRepository interface {
	Create(ctx context.Context, policy *entity.AppAccessPolicy) error
	GetByAppID(ctx context.Context, appID uuid.UUID) (*entity.AppAccessPolicy, error)
	Update(ctx context.Context, policy *entity.AppAccessPolicy) error
}

type appAccessPolicyRepository struct {
	db *gorm.DB
}

// NewAppAccessPolicyRepository 创建 App 访问策略仓储实例
func NewAppAccessPolicyRepository(db *gorm.DB) AppAccessPolicyRepository {
	return &appAccessPolicyRepository{db: db}
}

func (r *appAccessPolicyRepository) Create(ctx context.Context, policy *entity.AppAccessPolicy) error {
	return r.db.WithContext(ctx).Create(policy).Error
}

func (r *appAccessPolicyRepository) GetByAppID(ctx context.Context, appID uuid.UUID) (*entity.AppAccessPolicy, error) {
	var policy entity.AppAccessPolicy
	if err := r.db.WithContext(ctx).First(&policy, "app_id = ?", appID).Error; err != nil {
		return nil, err
	}
	return &policy, nil
}

func (r *appAccessPolicyRepository) Update(ctx context.Context, policy *entity.AppAccessPolicy) error {
	return r.db.WithContext(ctx).Save(policy).Error
}
