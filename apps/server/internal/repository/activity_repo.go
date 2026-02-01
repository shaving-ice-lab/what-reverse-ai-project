package repository

import (
	"context"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ActivityRepository 活动日志仓储接口
type ActivityRepository interface {
	Create(ctx context.Context, activity *entity.UserActivity) error
	List(ctx context.Context, params ActivityListParams) ([]entity.UserActivity, int64, error)
	GetByID(ctx context.Context, id uuid.UUID) (*entity.UserActivity, error)
	GetByUserIDs(ctx context.Context, userIDs []uuid.UUID, page, pageSize int) ([]entity.UserActivity, int64, error)
}

// ActivityListParams 活动列表查询参数
type ActivityListParams struct {
	UserID   uuid.UUID
	Action   string
	Page     int
	PageSize int
}

type activityRepository struct {
	db *gorm.DB
}

// NewActivityRepository 创建活动日志仓储实例
func NewActivityRepository(db *gorm.DB) ActivityRepository {
	return &activityRepository{db: db}
}

func (r *activityRepository) Create(ctx context.Context, activity *entity.UserActivity) error {
	if activity.ID == uuid.Nil {
		activity.ID = uuid.New()
	}
	activity.CreatedAt = time.Now()
	return r.db.WithContext(ctx).Create(activity).Error
}

func (r *activityRepository) List(ctx context.Context, params ActivityListParams) ([]entity.UserActivity, int64, error) {
	var activities []entity.UserActivity
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.UserActivity{})

	if params.UserID != uuid.Nil {
		query = query.Where("user_id = ?", params.UserID)
	}

	if params.Action != "" {
		query = query.Where("action = ?", params.Action)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if params.Page <= 0 {
		params.Page = 1
	}
	if params.PageSize <= 0 {
		params.PageSize = 20
	}

	offset := (params.Page - 1) * params.PageSize
	if err := query.Order("created_at DESC").
		Offset(offset).
		Limit(params.PageSize).
		Find(&activities).Error; err != nil {
		return nil, 0, err
	}

	return activities, total, nil
}

func (r *activityRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.UserActivity, error) {
	var activity entity.UserActivity
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&activity).Error; err != nil {
		return nil, err
	}
	return &activity, nil
}

func (r *activityRepository) GetByUserIDs(ctx context.Context, userIDs []uuid.UUID, page, pageSize int) ([]entity.UserActivity, int64, error) {
	var activities []entity.UserActivity
	var total int64

	if len(userIDs) == 0 {
		return activities, 0, nil
	}

	query := r.db.WithContext(ctx).Model(&entity.UserActivity{}).Where("user_id IN ?", userIDs)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}

	offset := (page - 1) * pageSize
	if err := query.Order("created_at DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&activities).Error; err != nil {
		return nil, 0, err
	}

	return activities, total, nil
}
