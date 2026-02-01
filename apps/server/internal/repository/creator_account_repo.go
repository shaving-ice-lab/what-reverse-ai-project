package repository

import (
	"context"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// CreatorAccountRepository 创作者账户仓储接口
type CreatorAccountRepository interface {
	Create(ctx context.Context, account *entity.CreatorAccount) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.CreatorAccount, error)
	GetByUserID(ctx context.Context, userID uuid.UUID) (*entity.CreatorAccount, error)
	Update(ctx context.Context, account *entity.CreatorAccount) error
	GetOrCreate(ctx context.Context, userID uuid.UUID) (*entity.CreatorAccount, error)

	// 余额操作
	AddPendingBalance(ctx context.Context, userID uuid.UUID, amount float64) error
	ConfirmBalance(ctx context.Context, userID uuid.UUID, amount float64) error
	DeductBalance(ctx context.Context, userID uuid.UUID, amount float64) error
	AddMonthlyRevenue(ctx context.Context, userID uuid.UUID, amount float64) error
	ResetMonthlyRevenue(ctx context.Context) error

	// 统计
	IncrementCount(ctx context.Context, userID uuid.UUID, earningType entity.EarningType) error
}

type creatorAccountRepository struct {
	db *gorm.DB
}

// NewCreatorAccountRepository 创建创作者账户仓储实例
func NewCreatorAccountRepository(db *gorm.DB) CreatorAccountRepository {
	return &creatorAccountRepository{db: db}
}

func (r *creatorAccountRepository) Create(ctx context.Context, account *entity.CreatorAccount) error {
	return r.db.WithContext(ctx).Create(account).Error
}

func (r *creatorAccountRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.CreatorAccount, error) {
	var account entity.CreatorAccount
	if err := r.db.WithContext(ctx).
		Preload("User").
		Preload("CurrentTier").
		First(&account, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &account, nil
}

func (r *creatorAccountRepository) GetByUserID(ctx context.Context, userID uuid.UUID) (*entity.CreatorAccount, error) {
	var account entity.CreatorAccount
	if err := r.db.WithContext(ctx).
		Preload("User").
		Preload("CurrentTier").
		First(&account, "user_id = ?", userID).Error; err != nil {
		return nil, err
	}
	return &account, nil
}

func (r *creatorAccountRepository) Update(ctx context.Context, account *entity.CreatorAccount) error {
	return r.db.WithContext(ctx).Save(account).Error
}

func (r *creatorAccountRepository) GetOrCreate(ctx context.Context, userID uuid.UUID) (*entity.CreatorAccount, error) {
	var account entity.CreatorAccount
	err := r.db.WithContext(ctx).
		Preload("CurrentTier").
		FirstOrCreate(&account, entity.CreatorAccount{UserID: userID}).Error
	return &account, err
}

func (r *creatorAccountRepository) AddPendingBalance(ctx context.Context, userID uuid.UUID, amount float64) error {
	return r.db.WithContext(ctx).Model(&entity.CreatorAccount{}).
		Where("user_id = ?", userID).
		UpdateColumn("pending_balance", gorm.Expr("pending_balance + ?", amount)).Error
}

func (r *creatorAccountRepository) ConfirmBalance(ctx context.Context, userID uuid.UUID, amount float64) error {
	return r.db.WithContext(ctx).Model(&entity.CreatorAccount{}).
		Where("user_id = ?", userID).
		Updates(map[string]interface{}{
			"pending_balance": gorm.Expr("pending_balance - ?", amount),
			"balance":         gorm.Expr("balance + ?", amount),
			"total_earned":    gorm.Expr("total_earned + ?", amount),
		}).Error
}

func (r *creatorAccountRepository) DeductBalance(ctx context.Context, userID uuid.UUID, amount float64) error {
	return r.db.WithContext(ctx).Model(&entity.CreatorAccount{}).
		Where("user_id = ?", userID).
		Where("balance >= ?", amount).
		Updates(map[string]interface{}{
			"balance":         gorm.Expr("balance - ?", amount),
			"total_withdrawn": gorm.Expr("total_withdrawn + ?", amount),
		}).Error
}

func (r *creatorAccountRepository) AddMonthlyRevenue(ctx context.Context, userID uuid.UUID, amount float64) error {
	return r.db.WithContext(ctx).Model(&entity.CreatorAccount{}).
		Where("user_id = ?", userID).
		UpdateColumn("monthly_revenue", gorm.Expr("monthly_revenue + ?", amount)).Error
}

func (r *creatorAccountRepository) ResetMonthlyRevenue(ctx context.Context) error {
	return r.db.WithContext(ctx).Model(&entity.CreatorAccount{}).
		Where("monthly_reset_at < ?", time.Now().AddDate(0, 0, -time.Now().Day()+1)).
		Updates(map[string]interface{}{
			"monthly_revenue":  0,
			"monthly_reset_at": time.Now(),
		}).Error
}

func (r *creatorAccountRepository) IncrementCount(ctx context.Context, userID uuid.UUID, earningType entity.EarningType) error {
	var column string
	switch earningType {
	case entity.EarningTypeSale:
		column = "sale_count"
	case entity.EarningTypeSubscription:
		column = "subscription_count"
	case entity.EarningTypeTip:
		column = "tip_count"
	case entity.EarningTypeReferral:
		column = "referral_count"
	default:
		return nil
	}

	return r.db.WithContext(ctx).Model(&entity.CreatorAccount{}).
		Where("user_id = ?", userID).
		UpdateColumn(column, gorm.Expr(column+" + 1")).Error
}
