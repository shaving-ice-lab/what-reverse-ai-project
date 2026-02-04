package repository

import (
	"context"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ModelUsageAggregate 模型用量聚合
type ModelUsageAggregate struct {
	Provider         string  `json:"provider"`
	Model            string  `json:"model"`
	Requests         int64   `json:"requests"`
	PromptTokens     int64   `json:"prompt_tokens"`
	CompletionTokens int64   `json:"completion_tokens"`
	TotalTokens      int64   `json:"total_tokens"`
	TotalCost        float64 `json:"total_cost"`
	Currency         string  `json:"currency"`
}

// ModelUsageRepository 模型用量仓储接口
type ModelUsageRepository interface {
	Create(ctx context.Context, event *entity.ModelUsageEvent) error
	GetWorkspaceStats(ctx context.Context, workspaceID uuid.UUID, start, end time.Time) ([]ModelUsageAggregate, error)
}

type modelUsageRepository struct {
	db *gorm.DB
}

// NewModelUsageRepository 创建模型用量仓储实例
func NewModelUsageRepository(db *gorm.DB) ModelUsageRepository {
	return &modelUsageRepository{db: db}
}

func (r *modelUsageRepository) Create(ctx context.Context, event *entity.ModelUsageEvent) error {
	return r.db.WithContext(ctx).Create(event).Error
}

func (r *modelUsageRepository) GetWorkspaceStats(ctx context.Context, workspaceID uuid.UUID, start, end time.Time) ([]ModelUsageAggregate, error) {
	var results []ModelUsageAggregate
	query := r.db.WithContext(ctx).
		Model(&entity.ModelUsageEvent{}).
		Select(`
			provider,
			model,
			COUNT(*) as requests,
			COALESCE(SUM(prompt_tokens), 0) as prompt_tokens,
			COALESCE(SUM(completion_tokens), 0) as completion_tokens,
			COALESCE(SUM(total_tokens), 0) as total_tokens,
			COALESCE(SUM(cost_amount), 0) as total_cost,
			MAX(currency) as currency
		`).
		Where("workspace_id = ?", workspaceID).
		Group("provider, model").
		Order("total_tokens DESC")

	if !start.IsZero() {
		query = query.Where("created_at >= ?", start)
	}
	if !end.IsZero() {
		query = query.Where("created_at <= ?", end)
	}

	if err := query.Scan(&results).Error; err != nil {
		return nil, err
	}
	return results, nil
}
