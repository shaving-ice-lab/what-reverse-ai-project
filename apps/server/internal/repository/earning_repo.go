package repository

import (
	"context"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// EarningRepository 收入仓储接口
type EarningRepository interface {
	// 收入记录
	Create(ctx context.Context, earning *entity.Earning) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.Earning, error)
	List(ctx context.Context, params EarningListParams) ([]entity.Earning, int64, error)
	Update(ctx context.Context, earning *entity.Earning) error
	UpdateStatus(ctx context.Context, id uuid.UUID, status entity.EarningStatus) error

	// 统计
	GetStats(ctx context.Context, userID uuid.UUID, startDate, endDate time.Time) (*entity.EarningStats, error)
	GetByType(ctx context.Context, userID uuid.UUID, startDate, endDate time.Time) ([]entity.EarningsByType, error)
	GetMonthly(ctx context.Context, userID uuid.UUID, months int) ([]entity.MonthlyEarning, error)
	GetTopAgents(ctx context.Context, userID uuid.UUID, limit int) ([]entity.AgentEarning, error)

	// 结算
	GetPendingForSettlement(ctx context.Context) ([]entity.Earning, error)
	BatchUpdateSettlement(ctx context.Context, ids []uuid.UUID, settlementID uuid.UUID) error
}

// EarningListParams 收入列表参数
type EarningListParams struct {
	UserID    *uuid.UUID
	AgentID   *uuid.UUID
	Type      string
	Status    string
	StartDate *time.Time
	EndDate   *time.Time
	Page      int
	PageSize  int
}

type earningRepository struct {
	db *gorm.DB
}

// NewEarningRepository 创建收入仓储实例
func NewEarningRepository(db *gorm.DB) EarningRepository {
	return &earningRepository{db: db}
}

func (r *earningRepository) Create(ctx context.Context, earning *entity.Earning) error {
	return r.db.WithContext(ctx).Create(earning).Error
}

func (r *earningRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.Earning, error) {
	var earning entity.Earning
	if err := r.db.WithContext(ctx).
		Preload("User").
		Preload("Agent").
		Preload("Buyer").
		First(&earning, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &earning, nil
}

func (r *earningRepository) List(ctx context.Context, params EarningListParams) ([]entity.Earning, int64, error) {
	var earnings []entity.Earning
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.Earning{})

	// 用户过滤
	if params.UserID != nil {
		query = query.Where("user_id = ?", params.UserID)
	}

	// Agent 过滤
	if params.AgentID != nil {
		query = query.Where("agent_id = ?", params.AgentID)
	}

	// 类型过滤
	if params.Type != "" {
		query = query.Where("earning_type = ?", params.Type)
	}

	// 状态过滤
	if params.Status != "" {
		query = query.Where("status = ?", params.Status)
	}

	// 日期范围
	if params.StartDate != nil {
		query = query.Where("created_at >= ?", params.StartDate)
	}
	if params.EndDate != nil {
		query = query.Where("created_at <= ?", params.EndDate)
	}

	// 统计总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 排序和分页
	query = query.Order("created_at DESC")
	if params.Page > 0 && params.PageSize > 0 {
		offset := (params.Page - 1) * params.PageSize
		query = query.Offset(offset).Limit(params.PageSize)
	}

	// 预加载
	query = query.Preload("Agent").Preload("Buyer")

	if err := query.Find(&earnings).Error; err != nil {
		return nil, 0, err
	}

	return earnings, total, nil
}

func (r *earningRepository) Update(ctx context.Context, earning *entity.Earning) error {
	return r.db.WithContext(ctx).Save(earning).Error
}

func (r *earningRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status entity.EarningStatus) error {
	return r.db.WithContext(ctx).Model(&entity.Earning{}).
		Where("id = ?", id).
		Update("status", status).Error
}

func (r *earningRepository) GetStats(ctx context.Context, userID uuid.UUID, startDate, endDate time.Time) (*entity.EarningStats, error) {
	var stats entity.EarningStats
	err := r.db.WithContext(ctx).Model(&entity.Earning{}).
		Select(`
			COUNT(*) as total_earnings,
			COALESCE(SUM(gross_amount), 0) as total_gross,
			COALESCE(SUM(net_amount), 0) as total_net,
			COALESCE(SUM(platform_fee), 0) as total_platform_fee,
			COALESCE(AVG(commission_rate), 0) as avg_commission_rate
		`).
		Where("user_id = ?", userID).
		Where("status IN ?", []string{"confirmed", "settled"}).
		Where("created_at BETWEEN ? AND ?", startDate, endDate).
		Scan(&stats).Error

	return &stats, err
}

func (r *earningRepository) GetByType(ctx context.Context, userID uuid.UUID, startDate, endDate time.Time) ([]entity.EarningsByType, error) {
	var result []entity.EarningsByType
	err := r.db.WithContext(ctx).Model(&entity.Earning{}).
		Select("earning_type as type, COUNT(*) as count, COALESCE(SUM(net_amount), 0) as amount").
		Where("user_id = ?", userID).
		Where("status IN ?", []string{"confirmed", "settled"}).
		Where("created_at BETWEEN ? AND ?", startDate, endDate).
		Group("earning_type").
		Scan(&result).Error

	return result, err
}

func (r *earningRepository) GetMonthly(ctx context.Context, userID uuid.UUID, months int) ([]entity.MonthlyEarning, error) {
	var result []entity.MonthlyEarning
	startDate := time.Now().AddDate(0, -months, 0)

	err := r.db.WithContext(ctx).Model(&entity.Earning{}).
		Select(`
			TO_CHAR(created_at, 'YYYY-MM') as month,
			COALESCE(SUM(gross_amount), 0) as gross,
			COALESCE(SUM(net_amount), 0) as net,
			COUNT(*) as count
		`).
		Where("user_id = ?", userID).
		Where("status IN ?", []string{"confirmed", "settled"}).
		Where("created_at >= ?", startDate).
		Group("TO_CHAR(created_at, 'YYYY-MM')").
		Order("month ASC").
		Scan(&result).Error

	return result, err
}

func (r *earningRepository) GetTopAgents(ctx context.Context, userID uuid.UUID, limit int) ([]entity.AgentEarning, error) {
	var result []entity.AgentEarning
	err := r.db.WithContext(ctx).Model(&entity.Earning{}).
		Select(`
			agent_id,
			a.name as agent_name,
			COUNT(*) as count,
			COALESCE(SUM(e.net_amount), 0) as amount
		`).
		Table("what_reverse_earnings e").
		Joins("LEFT JOIN what_reverse_agents a ON e.agent_id = a.id").
		Where("e.user_id = ?", userID).
		Where("e.agent_id IS NOT NULL").
		Where("e.status IN ?", []string{"confirmed", "settled"}).
		Group("e.agent_id, a.name").
		Order("amount DESC").
		Limit(limit).
		Scan(&result).Error

	return result, err
}

func (r *earningRepository) GetPendingForSettlement(ctx context.Context) ([]entity.Earning, error) {
	var earnings []entity.Earning
	err := r.db.WithContext(ctx).
		Where("status = ?", "confirmed").
		Where("settlement_id IS NULL").
		Find(&earnings).Error
	return earnings, err
}

func (r *earningRepository) BatchUpdateSettlement(ctx context.Context, ids []uuid.UUID, settlementID uuid.UUID) error {
	now := time.Now()
	return r.db.WithContext(ctx).Model(&entity.Earning{}).
		Where("id IN ?", ids).
		Updates(map[string]interface{}{
			"settlement_id": settlementID,
			"status":        "settled",
			"settled_at":    now,
		}).Error
}
