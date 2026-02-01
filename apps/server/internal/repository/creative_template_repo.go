package repository

import (
	"context"
	"errors"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// CreativeTemplateListParams 创意模板列表查询参数
type CreativeTemplateListParams struct {
	Category   string   // 分类筛选
	Search     string   // 搜索关键词
	Tags       []string // 标签筛选
	Featured   *bool    // 是否精选
	Official   *bool    // 是否官方
	CreatorID  *string  // 创建者ID
	Page       int      // 页码
	PageSize   int      // 每页数量
	Sort       string   // 排序方式: popular, newest, rating, name
}

// CreativeTemplateRepository 创意模板仓储接口
type CreativeTemplateRepository interface {
	// 基础 CRUD
	Create(ctx context.Context, template *entity.CreativeTemplate) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.CreativeTemplate, error)
	GetBySlug(ctx context.Context, slug string) (*entity.CreativeTemplate, error)
	List(ctx context.Context, params CreativeTemplateListParams) ([]entity.CreativeTemplate, int64, error)
	Update(ctx context.Context, template *entity.CreativeTemplate) error
	Delete(ctx context.Context, id uuid.UUID) error

	// 查询方法
	GetFeatured(ctx context.Context, limit int) ([]entity.CreativeTemplate, error)
	GetByCategory(ctx context.Context, category string, limit int) ([]entity.CreativeTemplate, error)
	CountByCategory(ctx context.Context) (map[string]int, error)

	// 统计更新
	IncrementUsageCount(ctx context.Context, id uuid.UUID) error
	UpdateRating(ctx context.Context, id uuid.UUID, rating float32, reviewCount int) error

	// 版本管理
	CreateVersion(ctx context.Context, version *entity.CreativeTemplateVersion) error
	GetVersions(ctx context.Context, templateID uuid.UUID) ([]entity.CreativeTemplateVersion, error)
	GetVersion(ctx context.Context, templateID uuid.UUID, versionNum int) (*entity.CreativeTemplateVersion, error)
	GetLatestVersion(ctx context.Context, templateID uuid.UUID) (*entity.CreativeTemplateVersion, error)
}

type creativeTemplateRepository struct {
	db *gorm.DB
}

// NewCreativeTemplateRepository 创建创意模板仓储实例
func NewCreativeTemplateRepository(db *gorm.DB) CreativeTemplateRepository {
	return &creativeTemplateRepository{db: db}
}

// Create 创建模板
func (r *creativeTemplateRepository) Create(ctx context.Context, template *entity.CreativeTemplate) error {
	return r.db.WithContext(ctx).Create(template).Error
}

// GetByID 通过 ID 获取模板
func (r *creativeTemplateRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.CreativeTemplate, error) {
	var template entity.CreativeTemplate
	if err := r.db.WithContext(ctx).
		Preload("Creator").
		First(&template, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &template, nil
}

// GetBySlug 通过 Slug 获取模板
func (r *creativeTemplateRepository) GetBySlug(ctx context.Context, slug string) (*entity.CreativeTemplate, error) {
	var template entity.CreativeTemplate
	if err := r.db.WithContext(ctx).
		Preload("Creator").
		Where("slug = ? AND is_published = ?", slug, true).
		First(&template).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &template, nil
}

// List 获取模板列表
func (r *creativeTemplateRepository) List(ctx context.Context, params CreativeTemplateListParams) ([]entity.CreativeTemplate, int64, error) {
	var templates []entity.CreativeTemplate
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.CreativeTemplate{}).Where("is_published = ?", true)

	// 分类筛选
	if params.Category != "" {
		query = query.Where("category = ?", params.Category)
	}

	// 搜索
	if params.Search != "" {
		searchPattern := "%" + params.Search + "%"
		query = query.Where("name LIKE ? OR description LIKE ?", searchPattern, searchPattern)
	}

	// 标签筛选
	if len(params.Tags) > 0 {
		for _, tag := range params.Tags {
			query = query.Where("JSON_CONTAINS(tags, ?)", `"`+tag+`"`)
		}
	}

	// 精选筛选
	if params.Featured != nil {
		query = query.Where("is_featured = ?", *params.Featured)
	}

	// 官方筛选
	if params.Official != nil {
		query = query.Where("is_official = ?", *params.Official)
	}

	// 创建者筛选
	if params.CreatorID != nil {
		query = query.Where("creator_id = ?", *params.CreatorID)
	}

	// 统计总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 排序
	switch params.Sort {
	case "popular":
		query = query.Order("usage_count DESC")
	case "rating":
		query = query.Order("rating DESC, review_count DESC")
	case "name":
		query = query.Order("name ASC")
	case "newest":
		fallthrough
	default:
		query = query.Order("created_at DESC")
	}

	// 分页
	if params.Page > 0 && params.PageSize > 0 {
		offset := (params.Page - 1) * params.PageSize
		query = query.Offset(offset).Limit(params.PageSize)
	}

	// 查询
	if err := query.Preload("Creator").Find(&templates).Error; err != nil {
		return nil, 0, err
	}

	return templates, total, nil
}

// Update 更新模板
func (r *creativeTemplateRepository) Update(ctx context.Context, template *entity.CreativeTemplate) error {
	return r.db.WithContext(ctx).Save(template).Error
}

// Delete 删除模板(软删除)
func (r *creativeTemplateRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&entity.CreativeTemplate{}, "id = ?", id).Error
}

// GetFeatured 获取精选模板
func (r *creativeTemplateRepository) GetFeatured(ctx context.Context, limit int) ([]entity.CreativeTemplate, error) {
	var templates []entity.CreativeTemplate
	if err := r.db.WithContext(ctx).
		Where("is_featured = ? AND is_published = ?", true, true).
		Order("usage_count DESC").
		Limit(limit).
		Preload("Creator").
		Find(&templates).Error; err != nil {
		return nil, err
	}
	return templates, nil
}

// GetByCategory 获取指定分类的模板
func (r *creativeTemplateRepository) GetByCategory(ctx context.Context, category string, limit int) ([]entity.CreativeTemplate, error) {
	var templates []entity.CreativeTemplate
	query := r.db.WithContext(ctx).
		Where("category = ? AND is_published = ?", category, true).
		Order("usage_count DESC").
		Preload("Creator")

	if limit > 0 {
		query = query.Limit(limit)
	}

	if err := query.Find(&templates).Error; err != nil {
		return nil, err
	}
	return templates, nil
}

// CountByCategory 按分类统计模板数量
func (r *creativeTemplateRepository) CountByCategory(ctx context.Context) (map[string]int, error) {
	type CategoryCount struct {
		Category string
		Count    int
	}

	var results []CategoryCount
	if err := r.db.WithContext(ctx).
		Model(&entity.CreativeTemplate{}).
		Where("is_published = ?", true).
		Select("category, COUNT(*) as count").
		Group("category").
		Scan(&results).Error; err != nil {
		return nil, err
	}

	counts := make(map[string]int)
	for _, r := range results {
		counts[r.Category] = r.Count
	}
	return counts, nil
}

// IncrementUsageCount 增加使用次数
func (r *creativeTemplateRepository) IncrementUsageCount(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).
		Model(&entity.CreativeTemplate{}).
		Where("id = ?", id).
		UpdateColumn("usage_count", gorm.Expr("usage_count + 1")).Error
}

// UpdateRating 更新评分
func (r *creativeTemplateRepository) UpdateRating(ctx context.Context, id uuid.UUID, rating float32, reviewCount int) error {
	return r.db.WithContext(ctx).
		Model(&entity.CreativeTemplate{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"rating":       rating,
			"review_count": reviewCount,
		}).Error
}

// ================== 版本管理 ==================

// CreateVersion 创建版本快照
func (r *creativeTemplateRepository) CreateVersion(ctx context.Context, version *entity.CreativeTemplateVersion) error {
	return r.db.WithContext(ctx).Create(version).Error
}

// GetVersions 获取模板的所有版本
func (r *creativeTemplateRepository) GetVersions(ctx context.Context, templateID uuid.UUID) ([]entity.CreativeTemplateVersion, error) {
	var versions []entity.CreativeTemplateVersion
	if err := r.db.WithContext(ctx).
		Where("template_id = ?", templateID).
		Order("version DESC").
		Preload("ChangedByUser").
		Find(&versions).Error; err != nil {
		return nil, err
	}
	return versions, nil
}

// GetVersion 获取指定版本
func (r *creativeTemplateRepository) GetVersion(ctx context.Context, templateID uuid.UUID, versionNum int) (*entity.CreativeTemplateVersion, error) {
	var version entity.CreativeTemplateVersion
	if err := r.db.WithContext(ctx).
		Where("template_id = ? AND version = ?", templateID, versionNum).
		First(&version).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &version, nil
}

// GetLatestVersion 获取最新版本
func (r *creativeTemplateRepository) GetLatestVersion(ctx context.Context, templateID uuid.UUID) (*entity.CreativeTemplateVersion, error) {
	var version entity.CreativeTemplateVersion
	if err := r.db.WithContext(ctx).
		Where("template_id = ?", templateID).
		Order("version DESC").
		First(&version).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &version, nil
}
