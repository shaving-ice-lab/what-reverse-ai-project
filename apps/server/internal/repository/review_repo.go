package repository

import (
	"context"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ReviewRepository 评价仓储接口
type ReviewRepository interface {
	Create(ctx context.Context, review *entity.Review) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.Review, error)
	GetByAgentAndUser(ctx context.Context, agentID, userID uuid.UUID) (*entity.Review, error)
	List(ctx context.Context, agentID uuid.UUID, params ReviewListParams) ([]entity.Review, int64, error)
	Update(ctx context.Context, review *entity.Review) error
	Delete(ctx context.Context, id uuid.UUID) error
	IncrementHelpful(ctx context.Context, id uuid.UUID) error
	GetAverageRating(ctx context.Context, agentID uuid.UUID) (float64, int64, error)
}

// ReviewListParams 评价列表查询参数
type ReviewListParams struct {
	Page     int
	PageSize int
	Sort     string // "recent", "helpful", "highest", "lowest"
	Rating   *int   // 筛选特定评分
}

type reviewRepository struct {
	db *gorm.DB
}

// NewReviewRepository 创建评价仓储实例
func NewReviewRepository(db *gorm.DB) ReviewRepository {
	return &reviewRepository{db: db}
}

func (r *reviewRepository) Create(ctx context.Context, review *entity.Review) error {
	return r.db.WithContext(ctx).Create(review).Error
}

func (r *reviewRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.Review, error) {
	var review entity.Review
	if err := r.db.WithContext(ctx).
		Preload("User").
		First(&review, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &review, nil
}

func (r *reviewRepository) GetByAgentAndUser(ctx context.Context, agentID, userID uuid.UUID) (*entity.Review, error) {
	var review entity.Review
	if err := r.db.WithContext(ctx).
		Where("agent_id = ? AND user_id = ?", agentID, userID).
		First(&review).Error; err != nil {
		return nil, err
	}
	return &review, nil
}

func (r *reviewRepository) List(ctx context.Context, agentID uuid.UUID, params ReviewListParams) ([]entity.Review, int64, error) {
	var reviews []entity.Review
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.Review{}).Where("agent_id = ?", agentID)

	// 筛选特定评分
	if params.Rating != nil {
		query = query.Where("rating = ?", *params.Rating)
	}

	// 计算总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 排序
	switch params.Sort {
	case "helpful":
		query = query.Order("helpful_count DESC")
	case "highest":
		query = query.Order("rating DESC")
	case "lowest":
		query = query.Order("rating ASC")
	default: // "recent"
		query = query.Order("created_at DESC")
	}

	// 分页
	if params.Page > 0 && params.PageSize > 0 {
		offset := (params.Page - 1) * params.PageSize
		query = query.Offset(offset).Limit(params.PageSize)
	}

	if err := query.Preload("User").Find(&reviews).Error; err != nil {
		return nil, 0, err
	}

	return reviews, total, nil
}

func (r *reviewRepository) Update(ctx context.Context, review *entity.Review) error {
	return r.db.WithContext(ctx).Save(review).Error
}

func (r *reviewRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&entity.Review{}, "id = ?", id).Error
}

func (r *reviewRepository) IncrementHelpful(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).
		Model(&entity.Review{}).
		Where("id = ?", id).
		Update("helpful_count", gorm.Expr("helpful_count + 1")).Error
}

func (r *reviewRepository) GetAverageRating(ctx context.Context, agentID uuid.UUID) (float64, int64, error) {
	var result struct {
		AvgRating float64
		Count     int64
	}

	err := r.db.WithContext(ctx).
		Model(&entity.Review{}).
		Select("COALESCE(AVG(rating), 0) as avg_rating, COUNT(*) as count").
		Where("agent_id = ?", agentID).
		Scan(&result).Error

	return result.AvgRating, result.Count, err
}
