package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/reverseai/server/internal/domain/entity"
	"gorm.io/gorm"
)

// RLSPolicyRepository RLS 策略仓储接口
type RLSPolicyRepository interface {
	Create(ctx context.Context, policy *entity.RLSPolicy) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.RLSPolicy, error)
	ListByWorkspace(ctx context.Context, workspaceID uuid.UUID) ([]entity.RLSPolicy, error)
	ListByTable(ctx context.Context, workspaceID uuid.UUID, tableName string) ([]entity.RLSPolicy, error)
	Update(ctx context.Context, policy *entity.RLSPolicy) error
	Delete(ctx context.Context, id uuid.UUID) error
}

type rlsPolicyRepository struct {
	db *gorm.DB
}

func NewRLSPolicyRepository(db *gorm.DB) RLSPolicyRepository {
	return &rlsPolicyRepository{db: db}
}

func (r *rlsPolicyRepository) Create(ctx context.Context, policy *entity.RLSPolicy) error {
	return r.db.WithContext(ctx).Create(policy).Error
}

func (r *rlsPolicyRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.RLSPolicy, error) {
	var policy entity.RLSPolicy
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&policy).Error; err != nil {
		return nil, err
	}
	return &policy, nil
}

func (r *rlsPolicyRepository) ListByWorkspace(ctx context.Context, workspaceID uuid.UUID) ([]entity.RLSPolicy, error) {
	var policies []entity.RLSPolicy
	if err := r.db.WithContext(ctx).Where("workspace_id = ?", workspaceID).Order("table_name ASC, created_at ASC").Find(&policies).Error; err != nil {
		return nil, err
	}
	return policies, nil
}

func (r *rlsPolicyRepository) ListByTable(ctx context.Context, workspaceID uuid.UUID, tableName string) ([]entity.RLSPolicy, error) {
	var policies []entity.RLSPolicy
	if err := r.db.WithContext(ctx).Where("workspace_id = ? AND table_name = ? AND enabled = ?", workspaceID, tableName, true).Find(&policies).Error; err != nil {
		return nil, err
	}
	return policies, nil
}

func (r *rlsPolicyRepository) Update(ctx context.Context, policy *entity.RLSPolicy) error {
	return r.db.WithContext(ctx).Save(policy).Error
}

func (r *rlsPolicyRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&entity.RLSPolicy{}, "id = ?", id).Error
}
