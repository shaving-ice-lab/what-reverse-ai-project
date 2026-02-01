package repository

import (
	"context"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// WithdrawalRepository 提现仓储接口
type WithdrawalRepository interface {
	Create(ctx context.Context, withdrawal *entity.Withdrawal) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.Withdrawal, error)
	List(ctx context.Context, params WithdrawalListParams) ([]entity.Withdrawal, int64, error)
	Update(ctx context.Context, withdrawal *entity.Withdrawal) error
	UpdateStatus(ctx context.Context, id uuid.UUID, status entity.WithdrawalStatus, processedBy *uuid.UUID) error
}

// WithdrawalListParams 提现列表参数
type WithdrawalListParams struct {
	UserID   *uuid.UUID
	Status   string
	Page     int
	PageSize int
}

type withdrawalRepository struct {
	db *gorm.DB
}

// NewWithdrawalRepository 创建提现仓储实例
func NewWithdrawalRepository(db *gorm.DB) WithdrawalRepository {
	return &withdrawalRepository{db: db}
}

func (r *withdrawalRepository) Create(ctx context.Context, withdrawal *entity.Withdrawal) error {
	return r.db.WithContext(ctx).Create(withdrawal).Error
}

func (r *withdrawalRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.Withdrawal, error) {
	var withdrawal entity.Withdrawal
	if err := r.db.WithContext(ctx).
		Preload("User").
		Preload("Account").
		First(&withdrawal, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &withdrawal, nil
}

func (r *withdrawalRepository) List(ctx context.Context, params WithdrawalListParams) ([]entity.Withdrawal, int64, error) {
	var withdrawals []entity.Withdrawal
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.Withdrawal{})

	if params.UserID != nil {
		query = query.Where("user_id = ?", params.UserID)
	}

	if params.Status != "" {
		query = query.Where("status = ?", params.Status)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	query = query.Order("created_at DESC")
	if params.Page > 0 && params.PageSize > 0 {
		offset := (params.Page - 1) * params.PageSize
		query = query.Offset(offset).Limit(params.PageSize)
	}

	query = query.Preload("User")

	if err := query.Find(&withdrawals).Error; err != nil {
		return nil, 0, err
	}

	return withdrawals, total, nil
}

func (r *withdrawalRepository) Update(ctx context.Context, withdrawal *entity.Withdrawal) error {
	return r.db.WithContext(ctx).Save(withdrawal).Error
}

func (r *withdrawalRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status entity.WithdrawalStatus, processedBy *uuid.UUID) error {
	now := time.Now()
	updates := map[string]interface{}{
		"status":       status,
		"processed_at": now,
	}
	if processedBy != nil {
		updates["processed_by"] = processedBy
	}
	if status == entity.WithdrawalStatusCompleted {
		updates["completed_at"] = now
	}
	return r.db.WithContext(ctx).Model(&entity.Withdrawal{}).
		Where("id = ?", id).
		Updates(updates).Error
}
