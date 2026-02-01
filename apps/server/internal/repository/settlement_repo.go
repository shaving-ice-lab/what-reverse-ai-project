package repository

import (
	"context"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SettlementRepository 结算仓储接口
type SettlementRepository interface {
	Create(ctx context.Context, settlement *entity.Settlement) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.Settlement, error)
	List(ctx context.Context, page, pageSize int) ([]entity.Settlement, int64, error)
	Update(ctx context.Context, settlement *entity.Settlement) error
}

type settlementRepository struct {
	db *gorm.DB
}

// NewSettlementRepository 创建结算仓储实例
func NewSettlementRepository(db *gorm.DB) SettlementRepository {
	return &settlementRepository{db: db}
}

func (r *settlementRepository) Create(ctx context.Context, settlement *entity.Settlement) error {
	return r.db.WithContext(ctx).Create(settlement).Error
}

func (r *settlementRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.Settlement, error) {
	var settlement entity.Settlement
	if err := r.db.WithContext(ctx).
		Preload("Processor").
		First(&settlement, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &settlement, nil
}

func (r *settlementRepository) List(ctx context.Context, page, pageSize int) ([]entity.Settlement, int64, error) {
	var settlements []entity.Settlement
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.Settlement{})

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	query = query.Order("created_at DESC")
	if page > 0 && pageSize > 0 {
		offset := (page - 1) * pageSize
		query = query.Offset(offset).Limit(pageSize)
	}

	if err := query.Find(&settlements).Error; err != nil {
		return nil, 0, err
	}

	return settlements, total, nil
}

func (r *settlementRepository) Update(ctx context.Context, settlement *entity.Settlement) error {
	return r.db.WithContext(ctx).Save(settlement).Error
}
