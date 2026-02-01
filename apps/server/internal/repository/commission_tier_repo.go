package repository

import (
	"context"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// CommissionTierRepository 分成规则仓储接口
type CommissionTierRepository interface {
	GetAll(ctx context.Context) ([]entity.CommissionTier, error)
	GetActive(ctx context.Context) ([]entity.CommissionTier, error)
	GetByID(ctx context.Context, id uuid.UUID) (*entity.CommissionTier, error)
	GetByRevenue(ctx context.Context, revenue float64, earningType *entity.EarningType) (*entity.CommissionTier, error)
	Create(ctx context.Context, tier *entity.CommissionTier) error
	Update(ctx context.Context, tier *entity.CommissionTier) error
	Delete(ctx context.Context, id uuid.UUID) error
}

type commissionTierRepository struct {
	db *gorm.DB
}

// NewCommissionTierRepository 创建分成规则仓储实例
func NewCommissionTierRepository(db *gorm.DB) CommissionTierRepository {
	return &commissionTierRepository{db: db}
}

func (r *commissionTierRepository) GetAll(ctx context.Context) ([]entity.CommissionTier, error) {
	var tiers []entity.CommissionTier
	err := r.db.WithContext(ctx).Order("priority ASC").Find(&tiers).Error
	return tiers, err
}

func (r *commissionTierRepository) GetActive(ctx context.Context) ([]entity.CommissionTier, error) {
	var tiers []entity.CommissionTier
	err := r.db.WithContext(ctx).
		Where("is_active = ?", true).
		Order("priority ASC").
		Find(&tiers).Error
	return tiers, err
}

func (r *commissionTierRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.CommissionTier, error) {
	var tier entity.CommissionTier
	if err := r.db.WithContext(ctx).First(&tier, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &tier, nil
}

func (r *commissionTierRepository) GetByRevenue(ctx context.Context, revenue float64, earningType *entity.EarningType) (*entity.CommissionTier, error) {
	var tier entity.CommissionTier
	query := r.db.WithContext(ctx).
		Where("is_active = ?", true).
		Where("min_revenue <= ?", revenue).
		Where("(max_revenue IS NULL OR max_revenue > ?)", revenue)

	if earningType != nil {
		query = query.Where("(earning_type IS NULL OR earning_type = ?)", *earningType)
	} else {
		query = query.Where("earning_type IS NULL")
	}

	if err := query.Order("priority ASC").First(&tier).Error; err != nil {
		return nil, err
	}
	return &tier, nil
}

func (r *commissionTierRepository) Create(ctx context.Context, tier *entity.CommissionTier) error {
	return r.db.WithContext(ctx).Create(tier).Error
}

func (r *commissionTierRepository) Update(ctx context.Context, tier *entity.CommissionTier) error {
	return r.db.WithContext(ctx).Save(tier).Error
}

func (r *commissionTierRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&entity.CommissionTier{}, "id = ?", id).Error
}
