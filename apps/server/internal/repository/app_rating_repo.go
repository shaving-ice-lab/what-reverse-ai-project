package repository

import (
	"context"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AppRatingListParams 应用评分列表参数
type AppRatingListParams struct {
	Page     int
	PageSize int
	Sort     string // recent, highest, lowest
}

// AppRatingStats 应用评分统计
type AppRatingStats struct {
	AvgRating float64
	Count     int64
}

// AppRatingRepository 应用评分仓储接口
type AppRatingRepository interface {
	Create(ctx context.Context, rating *entity.AppRating) error
	Update(ctx context.Context, rating *entity.AppRating) error
	GetByAppAndUser(ctx context.Context, appID, userID uuid.UUID) (*entity.AppRating, error)
	ListByApp(ctx context.Context, appID uuid.UUID, params AppRatingListParams) ([]entity.AppRating, int64, error)
	GetStatsByAppID(ctx context.Context, appID uuid.UUID) (AppRatingStats, error)
	GetStatsByAppIDs(ctx context.Context, appIDs []uuid.UUID) (map[uuid.UUID]AppRatingStats, error)
}

type appRatingRepository struct {
	db *gorm.DB
}

// NewAppRatingRepository 创建应用评分仓储实例
func NewAppRatingRepository(db *gorm.DB) AppRatingRepository {
	return &appRatingRepository{db: db}
}

func (r *appRatingRepository) Create(ctx context.Context, rating *entity.AppRating) error {
	return r.db.WithContext(ctx).Create(rating).Error
}

func (r *appRatingRepository) Update(ctx context.Context, rating *entity.AppRating) error {
	return r.db.WithContext(ctx).Save(rating).Error
}

func (r *appRatingRepository) GetByAppAndUser(ctx context.Context, appID, userID uuid.UUID) (*entity.AppRating, error) {
	var rating entity.AppRating
	if err := r.db.WithContext(ctx).
		Where("app_id = ? AND user_id = ?", appID, userID).
		First(&rating).Error; err != nil {
		return nil, err
	}
	return &rating, nil
}

func (r *appRatingRepository) ListByApp(ctx context.Context, appID uuid.UUID, params AppRatingListParams) ([]entity.AppRating, int64, error) {
	var ratings []entity.AppRating
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.AppRating{}).Where("app_id = ?", appID)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	switch params.Sort {
	case "highest":
		query = query.Order("rating DESC")
	case "lowest":
		query = query.Order("rating ASC")
	default:
		query = query.Order("created_at DESC")
	}

	if params.Page > 0 && params.PageSize > 0 {
		offset := (params.Page - 1) * params.PageSize
		query = query.Offset(offset).Limit(params.PageSize)
	}

	if err := query.Preload("User").Find(&ratings).Error; err != nil {
		return nil, 0, err
	}

	return ratings, total, nil
}

func (r *appRatingRepository) GetStatsByAppID(ctx context.Context, appID uuid.UUID) (AppRatingStats, error) {
	var result struct {
		AvgRating float64 `gorm:"column:avg_rating"`
		Count     int64   `gorm:"column:count"`
	}

	err := r.db.WithContext(ctx).
		Model(&entity.AppRating{}).
		Select("COALESCE(AVG(rating), 0) as avg_rating, COUNT(*) as count").
		Where("app_id = ?", appID).
		Scan(&result).Error

	return AppRatingStats{AvgRating: result.AvgRating, Count: result.Count}, err
}

func (r *appRatingRepository) GetStatsByAppIDs(ctx context.Context, appIDs []uuid.UUID) (map[uuid.UUID]AppRatingStats, error) {
	stats := make(map[uuid.UUID]AppRatingStats)
	if len(appIDs) == 0 {
		return stats, nil
	}

	var results []struct {
		AppID     uuid.UUID `gorm:"column:app_id"`
		AvgRating float64   `gorm:"column:avg_rating"`
		Count     int64     `gorm:"column:count"`
	}

	if err := r.db.WithContext(ctx).
		Model(&entity.AppRating{}).
		Select("app_id, COALESCE(AVG(rating), 0) as avg_rating, COUNT(*) as count").
		Where("app_id IN ?", appIDs).
		Group("app_id").
		Scan(&results).Error; err != nil {
		return nil, err
	}

	for _, row := range results {
		stats[row.AppID] = AppRatingStats{AvgRating: row.AvgRating, Count: row.Count}
	}
	return stats, nil
}
