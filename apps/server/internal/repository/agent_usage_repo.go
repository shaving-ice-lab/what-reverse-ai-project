package repository

import (
	"context"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AgentUsageRepository Agent 使用记录仓储接口
type AgentUsageRepository interface {
	Create(ctx context.Context, usage *entity.AgentUsage) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.AgentUsage, error)
	ListByAgent(ctx context.Context, agentID uuid.UUID, page, pageSize int) ([]entity.AgentUsage, int64, error)
	ListByUser(ctx context.Context, userID uuid.UUID, page, pageSize int) ([]entity.AgentUsage, int64, error)
	GetStats(ctx context.Context, agentID uuid.UUID, startDate, endDate time.Time) (*AgentUsageStats, error)
	GetDailyStats(ctx context.Context, agentID uuid.UUID, startDate, endDate time.Time) ([]entity.AgentUsageStat, error)
	UpdateCompletion(ctx context.Context, id uuid.UUID, durationMs int, outputTokens int, status string, errorMsg *string) error
}

// AgentUsageStats 使用统计汇总
type AgentUsageStats struct {
	TotalUses      int64   `json:"total_uses"`
	UniqueUsers    int64   `json:"unique_users"`
	TotalDuration  int64   `json:"total_duration"`
	AvgDuration    int64   `json:"avg_duration"`
	TotalTokens    int64   `json:"total_tokens"`
	CompletedCount int64   `json:"completed_count"`
	FailedCount    int64   `json:"failed_count"`
	SuccessRate    float64 `json:"success_rate"`
	TotalRevenue   float64 `json:"total_revenue"`
}

type agentUsageRepository struct {
	db *gorm.DB
}

// NewAgentUsageRepository 创建 Agent 使用记录仓储实例
func NewAgentUsageRepository(db *gorm.DB) AgentUsageRepository {
	return &agentUsageRepository{db: db}
}

func (r *agentUsageRepository) Create(ctx context.Context, usage *entity.AgentUsage) error {
	return r.db.WithContext(ctx).Create(usage).Error
}

func (r *agentUsageRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.AgentUsage, error) {
	var usage entity.AgentUsage
	if err := r.db.WithContext(ctx).First(&usage, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &usage, nil
}

func (r *agentUsageRepository) ListByAgent(ctx context.Context, agentID uuid.UUID, page, pageSize int) ([]entity.AgentUsage, int64, error) {
	var usages []entity.AgentUsage
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.AgentUsage{}).Where("agent_id = ?", agentID)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if page > 0 && pageSize > 0 {
		offset := (page - 1) * pageSize
		query = query.Offset(offset).Limit(pageSize)
	}

	if err := query.Order("created_at desc").Find(&usages).Error; err != nil {
		return nil, 0, err
	}

	return usages, total, nil
}

func (r *agentUsageRepository) ListByUser(ctx context.Context, userID uuid.UUID, page, pageSize int) ([]entity.AgentUsage, int64, error) {
	var usages []entity.AgentUsage
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.AgentUsage{}).Where("user_id = ?", userID)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if page > 0 && pageSize > 0 {
		offset := (page - 1) * pageSize
		query = query.Offset(offset).Limit(pageSize)
	}

	if err := query.Order("created_at desc").Preload("Agent").Find(&usages).Error; err != nil {
		return nil, 0, err
	}

	return usages, total, nil
}

func (r *agentUsageRepository) GetStats(ctx context.Context, agentID uuid.UUID, startDate, endDate time.Time) (*AgentUsageStats, error) {
	var stats AgentUsageStats

	query := r.db.WithContext(ctx).Model(&entity.AgentUsage{}).Where("agent_id = ?", agentID)

	if !startDate.IsZero() {
		query = query.Where("created_at >= ?", startDate)
	}
	if !endDate.IsZero() {
		query = query.Where("created_at <= ?", endDate)
	}

	// 总使用次数
	if err := query.Count(&stats.TotalUses).Error; err != nil {
		return nil, err
	}

	// 独立用户数
	if err := query.Distinct("user_id").Count(&stats.UniqueUsers).Error; err != nil {
		return nil, err
	}

	// 聚合统计
	var result struct {
		TotalDuration  int64
		AvgDuration    int64
		TotalTokens    int64
		CompletedCount int64
		FailedCount    int64
		TotalRevenue   float64
	}

	if err := r.db.WithContext(ctx).Model(&entity.AgentUsage{}).
		Select(`
			COALESCE(SUM(duration_ms), 0) as total_duration,
			COALESCE(AVG(duration_ms), 0) as avg_duration,
			COALESCE(SUM(total_tokens), 0) as total_tokens,
			COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
			COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
			COALESCE(SUM(CASE WHEN is_paid = true THEN amount ELSE 0 END), 0) as total_revenue
		`).
		Where("agent_id = ?", agentID).
		Where("created_at >= ? AND created_at <= ?", startDate, endDate).
		Scan(&result).Error; err != nil {
		return nil, err
	}

	stats.TotalDuration = result.TotalDuration
	stats.AvgDuration = result.AvgDuration
	stats.TotalTokens = result.TotalTokens
	stats.CompletedCount = result.CompletedCount
	stats.FailedCount = result.FailedCount
	stats.TotalRevenue = result.TotalRevenue

	if stats.TotalUses > 0 {
		stats.SuccessRate = float64(stats.CompletedCount) / float64(stats.TotalUses) * 100
	}

	return &stats, nil
}

func (r *agentUsageRepository) GetDailyStats(ctx context.Context, agentID uuid.UUID, startDate, endDate time.Time) ([]entity.AgentUsageStat, error) {
	var stats []entity.AgentUsageStat

	if err := r.db.WithContext(ctx).
		Where("agent_id = ? AND stat_date >= ? AND stat_date <= ?", agentID, startDate, endDate).
		Order("stat_date asc").
		Find(&stats).Error; err != nil {
		return nil, err
	}

	return stats, nil
}

func (r *agentUsageRepository) UpdateCompletion(ctx context.Context, id uuid.UUID, durationMs int, outputTokens int, status string, errorMsg *string) error {
	now := time.Now()
	updates := map[string]interface{}{
		"duration_ms":   durationMs,
		"output_tokens": outputTokens,
		"total_tokens":  gorm.Expr("input_tokens + ?", outputTokens),
		"status":        status,
		"completed_at":  now,
	}

	if errorMsg != nil {
		updates["error_message"] = *errorMsg
	}

	return r.db.WithContext(ctx).Model(&entity.AgentUsage{}).
		Where("id = ?", id).
		Updates(updates).Error
}
