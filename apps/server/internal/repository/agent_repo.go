package repository

import (
	"context"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AgentRepository Agent 仓储接口
type AgentRepository interface {
	Create(ctx context.Context, agent *entity.Agent) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.Agent, error)
	GetBySlug(ctx context.Context, slug string) (*entity.Agent, error)
	List(ctx context.Context, params AgentListParams) ([]entity.Agent, int64, error)
	Featured(ctx context.Context, limit int) ([]entity.Agent, error)
	Trending(ctx context.Context, params TrendingParams) ([]entity.Agent, error)
	ListByTags(ctx context.Context, tags []string, page, pageSize int) ([]entity.Agent, int64, error)
	Update(ctx context.Context, agent *entity.Agent) error
	Delete(ctx context.Context, id uuid.UUID) error
	IncrementUseCount(ctx context.Context, id uuid.UUID) error
	IncrementStarCount(ctx context.Context, id uuid.UUID) error
	DecrementStarCount(ctx context.Context, id uuid.UUID) error
}

// AgentListParams Agent 列表参数
type AgentListParams struct {
	Category    string
	Search      string
	Sort        string
	PricingType string
	MinRating   float64
	Tags        []string // 标签筛选
	Page        int
	PageSize    int
}

// TrendingParams 热门排行参数
type TrendingParams struct {
	Period   string // day, week, month, all
	Category string
	Limit    int
}

type agentRepository struct {
	db *gorm.DB
}

// NewAgentRepository 创建 Agent 仓储实例
func NewAgentRepository(db *gorm.DB) AgentRepository {
	return &agentRepository{db: db}
}

func (r *agentRepository) Create(ctx context.Context, agent *entity.Agent) error {
	return r.db.WithContext(ctx).Create(agent).Error
}

func (r *agentRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.Agent, error) {
	var agent entity.Agent
	if err := r.db.WithContext(ctx).Preload("User").Preload("Workflow").First(&agent, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &agent, nil
}

func (r *agentRepository) GetBySlug(ctx context.Context, slug string) (*entity.Agent, error) {
	var agent entity.Agent
	if err := r.db.WithContext(ctx).Preload("User").Preload("Workflow").First(&agent, "slug = ? AND status = ?", slug, "published").Error; err != nil {
		return nil, err
	}
	return &agent, nil
}

func (r *agentRepository) List(ctx context.Context, params AgentListParams) ([]entity.Agent, int64, error) {
	var agents []entity.Agent
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.Agent{}).Where("status = ?", "published")

	// 分类过滤
	if params.Category != "" {
		query = query.Where("category = ?", params.Category)
	}

	// 搜索
	if params.Search != "" {
		query = query.Where("name ILIKE ? OR description ILIKE ?", "%"+params.Search+"%", "%"+params.Search+"%")
	}

	// 定价类型
	if params.PricingType != "" {
		query = query.Where("pricing_type = ?", params.PricingType)
	}

	// 最低评分
	if params.MinRating > 0 {
		query = query.Where("avg_rating >= ?", params.MinRating)
	}

	// 统计总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 排序
	switch params.Sort {
	case "newest":
		query = query.Order("published_at desc")
	case "rating":
		query = query.Order("avg_rating desc")
	case "price_asc":
		query = query.Order("price asc NULLS FIRST")
	case "price_desc":
		query = query.Order("price desc NULLS LAST")
	default: // popular
		query = query.Order("use_count desc")
	}

	// 分页
	if params.Page > 0 && params.PageSize > 0 {
		offset := (params.Page - 1) * params.PageSize
		query = query.Offset(offset).Limit(params.PageSize)
	}

	// 预加载作者信息
	query = query.Preload("User")

	if err := query.Find(&agents).Error; err != nil {
		return nil, 0, err
	}

	return agents, total, nil
}

func (r *agentRepository) Featured(ctx context.Context, limit int) ([]entity.Agent, error) {
	var agents []entity.Agent
	if err := r.db.WithContext(ctx).
		Preload("User").
		Where("status = ?", "published").
		Order("star_count desc, use_count desc").
		Limit(limit).
		Find(&agents).Error; err != nil {
		return nil, err
	}
	return agents, nil
}

func (r *agentRepository) Update(ctx context.Context, agent *entity.Agent) error {
	return r.db.WithContext(ctx).Save(agent).Error
}

func (r *agentRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&entity.Agent{}, "id = ?", id).Error
}

func (r *agentRepository) IncrementUseCount(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Model(&entity.Agent{}).
		Where("id = ?", id).
		UpdateColumn("use_count", gorm.Expr("use_count + 1")).Error
}

func (r *agentRepository) IncrementStarCount(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Model(&entity.Agent{}).
		Where("id = ?", id).
		UpdateColumn("star_count", gorm.Expr("star_count + 1")).Error
}

func (r *agentRepository) DecrementStarCount(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Model(&entity.Agent{}).
		Where("id = ?", id).
		UpdateColumn("star_count", gorm.Expr("star_count - 1")).Error
}

// Trending 获取热门 Agent（基于使用趋势）
func (r *agentRepository) Trending(ctx context.Context, params TrendingParams) ([]entity.Agent, error) {
	var agents []entity.Agent

	// 计算时间范围
	var startTime time.Time
	now := time.Now()
	switch params.Period {
	case "day":
		startTime = now.AddDate(0, 0, -1)
	case "week":
		startTime = now.AddDate(0, 0, -7)
	case "month":
		startTime = now.AddDate(0, -1, 0)
	default: // all
		startTime = time.Time{} // 不限时间
	}

	limit := params.Limit
	if limit <= 0 {
		limit = 20
	}

	// 使用子查询计算时间段内的使用量
	subQuery := r.db.WithContext(ctx).
		Model(&entity.AgentUsage{}).
		Select("agent_id, COUNT(*) as recent_uses").
		Group("agent_id")

	if !startTime.IsZero() {
		subQuery = subQuery.Where("created_at >= ?", startTime)
	}

	// 主查询
	query := r.db.WithContext(ctx).
		Model(&entity.Agent{}).
		Preload("User").
		Where("status = ?", "published")

	if params.Category != "" {
		query = query.Where("category = ?", params.Category)
	}

	// 使用热度评分算法: recent_uses * 2 + star_count + use_count * 0.5
	query = query.
		Joins("LEFT JOIN (?) as usage_stats ON what_reverse_agents.id = usage_stats.agent_id", subQuery).
		Select("what_reverse_agents.*, COALESCE(usage_stats.recent_uses, 0) * 2 + what_reverse_agents.star_count + what_reverse_agents.use_count * 0.5 as trending_score").
		Order("trending_score DESC, what_reverse_agents.created_at DESC").
		Limit(limit)

	if err := query.Find(&agents).Error; err != nil {
		return nil, err
	}

	return agents, nil
}

// ListByTags 根据标签筛选 Agent
func (r *agentRepository) ListByTags(ctx context.Context, tags []string, page, pageSize int) ([]entity.Agent, int64, error) {
	var agents []entity.Agent
	var total int64

	if len(tags) == 0 {
		return agents, 0, nil
	}

	query := r.db.WithContext(ctx).Model(&entity.Agent{}).Where("status = ?", "published")

	// JSON 标签匹配 - 使用 JSONB 包含操作符
	// PostgreSQL: tags @> '["tag1"]' OR tags @> '["tag2"]'
	// MySQL: JSON_CONTAINS(tags, '"tag1"') OR JSON_CONTAINS(tags, '"tag2"')
	for i, tag := range tags {
		if i == 0 {
			query = query.Where("JSON_CONTAINS(tags, ?)", `"`+tag+`"`)
		} else {
			query = query.Or("JSON_CONTAINS(tags, ?)", `"`+tag+`"`)
		}
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if page > 0 && pageSize > 0 {
		offset := (page - 1) * pageSize
		query = query.Offset(offset).Limit(pageSize)
	}

	query = query.Preload("User").Order("use_count desc")

	if err := query.Find(&agents).Error; err != nil {
		return nil, 0, err
	}

	return agents, total, nil
}
