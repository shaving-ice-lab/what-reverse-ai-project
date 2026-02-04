package repository

import (
	"context"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AppVersionRepository App 版本仓储接口
type AppVersionRepository interface {
	Create(ctx context.Context, version *entity.AppVersion) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.AppVersion, error)
	CountByApp(ctx context.Context, appID uuid.UUID) (int64, error)
	Update(ctx context.Context, version *entity.AppVersion) error
	ListByAppID(ctx context.Context, appID uuid.UUID, params AppVersionListParams) ([]entity.AppVersion, int64, error)
}

// AppVersionListParams App 版本列表参数
type AppVersionListParams struct {
	Page     int
	PageSize int
}

type appVersionRepository struct {
	db *gorm.DB
}

// NewAppVersionRepository 创建 App 版本仓储实例
func NewAppVersionRepository(db *gorm.DB) AppVersionRepository {
	return &appVersionRepository{db: db}
}

func (r *appVersionRepository) Create(ctx context.Context, version *entity.AppVersion) error {
	return r.db.WithContext(ctx).Create(version).Error
}

func (r *appVersionRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.AppVersion, error) {
	var version entity.AppVersion
	if err := r.db.WithContext(ctx).First(&version, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &version, nil
}

func (r *appVersionRepository) CountByApp(ctx context.Context, appID uuid.UUID) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).
		Model(&entity.AppVersion{}).
		Where("app_id = ?", appID).
		Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (r *appVersionRepository) Update(ctx context.Context, version *entity.AppVersion) error {
	return r.db.WithContext(ctx).Save(version).Error
}

func (r *appVersionRepository) ListByAppID(ctx context.Context, appID uuid.UUID, params AppVersionListParams) ([]entity.AppVersion, int64, error) {
	query := r.db.WithContext(ctx).Model(&entity.AppVersion{}).Where("app_id = ?", appID)

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	page := params.Page
	if page < 1 {
		page = 1
	}
	pageSize := params.PageSize
	if pageSize < 1 {
		pageSize = 20
	}
	if pageSize > 100 {
		pageSize = 100
	}
	offset := (page - 1) * pageSize

	var versions []entity.AppVersion
	if err := query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&versions).Error; err != nil {
		return nil, 0, err
	}

	return versions, total, nil
}
