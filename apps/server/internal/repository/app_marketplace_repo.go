package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// MarketplaceListParams 应用市场列表参数
type MarketplaceListParams struct {
	Search   string
	Pricing  string
	Sort     string // popular, rating, newest
	Page     int
	PageSize int
}

// MarketplaceAppRow 应用市场查询结果
type MarketplaceAppRow struct {
	ID            uuid.UUID  `gorm:"column:id"`
	WorkspaceID   uuid.UUID  `gorm:"column:workspace_id"`
	OwnerUserID   uuid.UUID  `gorm:"column:owner_user_id"`
	Name          string     `gorm:"column:name"`
	Slug          string     `gorm:"column:slug"`
	Icon          string     `gorm:"column:icon"`
	Description   *string    `gorm:"column:description"`
	Status        string     `gorm:"column:status"`
	PricingType   string     `gorm:"column:pricing_type"`
	Price         *float64   `gorm:"column:price"`
	PublishedAt   *time.Time `gorm:"column:published_at"`
	CreatedAt     time.Time  `gorm:"column:created_at"`
	UpdatedAt     time.Time  `gorm:"column:updated_at"`
	AccessMode    string     `gorm:"column:access_mode"`
	WorkspaceName string     `gorm:"column:workspace_name"`
	WorkspaceSlug string     `gorm:"column:workspace_slug"`
	WorkspaceIcon *string    `gorm:"column:workspace_icon"`
	RatingAvg     float64    `gorm:"column:rating_avg"`
	RatingCount   int64      `gorm:"column:rating_count"`
}

// AppMarketplaceRepository 应用市场仓储接口
type AppMarketplaceRepository interface {
	ListPublished(ctx context.Context, params MarketplaceListParams) ([]MarketplaceAppRow, int64, error)
	GetPublishedByID(ctx context.Context, appID uuid.UUID) (*MarketplaceAppRow, error)
}

type appMarketplaceRepository struct {
	db *gorm.DB
}

// NewAppMarketplaceRepository 创建应用市场仓储实例
func NewAppMarketplaceRepository(db *gorm.DB) AppMarketplaceRepository {
	return &appMarketplaceRepository{db: db}
}

func (r *appMarketplaceRepository) baseQuery(ctx context.Context) *gorm.DB {
	publicModes := []string{"public_auth", "public_anonymous"}
	ratingStats := r.db.WithContext(ctx).
		Table("what_reverse_app_ratings").
		Select("app_id, COALESCE(AVG(rating), 0) as rating_avg, COUNT(*) as rating_count").
		Group("app_id")
	return r.db.WithContext(ctx).
		Table("what_reverse_apps AS apps").
		Joins("JOIN what_reverse_app_access_policies policies ON policies.app_id = apps.id").
		Joins("LEFT JOIN what_reverse_workspaces workspaces ON workspaces.id = apps.workspace_id").
		Joins("LEFT JOIN (?) stats ON stats.app_id = apps.id", ratingStats).
		Where("apps.status = ?", "published").
		Where("policies.access_mode IN ?", publicModes)
}

func (r *appMarketplaceRepository) ListPublished(ctx context.Context, params MarketplaceListParams) ([]MarketplaceAppRow, int64, error) {
	var rows []MarketplaceAppRow
	var total int64

	countQuery := r.db.WithContext(ctx).
		Table("what_reverse_apps AS apps").
		Joins("JOIN what_reverse_app_access_policies policies ON policies.app_id = apps.id").
		Where("apps.status = ?", "published").
		Where("policies.access_mode IN ?", []string{"public_auth", "public_anonymous"})

	if params.Search != "" {
		countQuery = countQuery.Where("apps.name ILIKE ? OR apps.description ILIKE ?", "%"+params.Search+"%", "%"+params.Search+"%")
	}
	if params.Pricing == "free" {
		countQuery = countQuery.Where("apps.pricing_type = ?", "free")
	}
	if params.Pricing == "paid" {
		countQuery = countQuery.Where("apps.pricing_type <> ?", "free")
	}

	if err := countQuery.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	query := r.baseQuery(ctx).
		Select(`
			apps.id, apps.workspace_id, apps.owner_user_id, apps.name, apps.slug, apps.icon, apps.description,
			apps.status, apps.pricing_type, apps.price, apps.published_at, apps.created_at, apps.updated_at,
			policies.access_mode,
			workspaces.name as workspace_name, workspaces.slug as workspace_slug, workspaces.icon as workspace_icon,
			COALESCE(stats.rating_avg, 0) as rating_avg,
			COALESCE(stats.rating_count, 0) as rating_count
		`)

	if params.Search != "" {
		query = query.Where("apps.name ILIKE ? OR apps.description ILIKE ?", "%"+params.Search+"%", "%"+params.Search+"%")
	}
	if params.Pricing == "free" {
		query = query.Where("apps.pricing_type = ?", "free")
	}
	if params.Pricing == "paid" {
		query = query.Where("apps.pricing_type <> ?", "free")
	}

	switch params.Sort {
	case "rating":
		query = query.Order("rating_avg DESC").Order("rating_count DESC")
	case "newest":
		query = query.Order("apps.published_at DESC")
	default:
		query = query.Order("rating_count DESC").Order("apps.published_at DESC")
	}

	if params.Page > 0 && params.PageSize > 0 {
		offset := (params.Page - 1) * params.PageSize
		query = query.Offset(offset).Limit(params.PageSize)
	}

	if err := query.Scan(&rows).Error; err != nil {
		return nil, 0, err
	}

	return rows, total, nil
}

func (r *appMarketplaceRepository) GetPublishedByID(ctx context.Context, appID uuid.UUID) (*MarketplaceAppRow, error) {
	var row MarketplaceAppRow
	query := r.baseQuery(ctx).
		Select(`
			apps.id, apps.workspace_id, apps.owner_user_id, apps.name, apps.slug, apps.icon, apps.description,
			apps.status, apps.pricing_type, apps.price, apps.published_at, apps.created_at, apps.updated_at,
			policies.access_mode,
			workspaces.name as workspace_name, workspaces.slug as workspace_slug, workspaces.icon as workspace_icon,
			COALESCE(stats.rating_avg, 0) as rating_avg,
			COALESCE(stats.rating_count, 0) as rating_count
		`).
		Where("apps.id = ?", appID)

	if err := query.Scan(&row).Error; err != nil {
		return nil, err
	}
	if row.ID == uuid.Nil {
		return nil, gorm.ErrRecordNotFound
	}
	return &row, nil
}
