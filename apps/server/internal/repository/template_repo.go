package repository

import (
	"context"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// TemplateListParams 模板列表参数
type TemplateListParams struct {
	Category   string
	Search     string
	Tags       []string
	Difficulty string
	Featured   *bool
	Official   *bool
	Page       int
	PageSize   int
	Sort       string // popular, newest, name
}

// TemplateRepository 模板仓储接口
type TemplateRepository interface {
	Create(ctx context.Context, template *entity.Template) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.Template, error)
	GetBySlug(ctx context.Context, slug string) (*entity.Template, error)
	List(ctx context.Context, params TemplateListParams) ([]entity.Template, int64, error)
	GetFeatured(ctx context.Context, limit int) ([]entity.Template, error)
	Update(ctx context.Context, template *entity.Template) error
	Delete(ctx context.Context, id uuid.UUID) error
	IncrementUseCount(ctx context.Context, id uuid.UUID) error
	IncrementViewCount(ctx context.Context, id uuid.UUID) error
	CountByCategory(ctx context.Context) (map[string]int, error)
}

type templateRepository struct {
	db *gorm.DB
}

// NewTemplateRepository 创建模板仓储实例
func NewTemplateRepository(db *gorm.DB) TemplateRepository {
	return &templateRepository{db: db}
}

func (r *templateRepository) Create(ctx context.Context, template *entity.Template) error {
	return r.db.WithContext(ctx).Create(template).Error
}

func (r *templateRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.Template, error) {
	var template entity.Template
	if err := r.db.WithContext(ctx).
		Preload("Author").
		First(&template, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &template, nil
}

func (r *templateRepository) GetBySlug(ctx context.Context, slug string) (*entity.Template, error) {
	var template entity.Template
	if err := r.db.WithContext(ctx).
		Preload("Author").
		First(&template, "slug = ? AND is_published = ?", slug, true).Error; err != nil {
		return nil, err
	}
	return &template, nil
}

func (r *templateRepository) List(ctx context.Context, params TemplateListParams) ([]entity.Template, int64, error) {
	var templates []entity.Template
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.Template{}).Where("is_published = ?", true)

	// 分类过滤
	if params.Category != "" {
		query = query.Where("category = ?", params.Category)
	}

	// 搜索
	if params.Search != "" {
		searchPattern := "%" + params.Search + "%"
		query = query.Where("name LIKE ? OR description LIKE ?", searchPattern, searchPattern)
	}

	// 难度过滤
	if params.Difficulty != "" {
		query = query.Where("difficulty = ?", params.Difficulty)
	}

	// 精选过滤
	if params.Featured != nil {
		query = query.Where("is_featured = ?", *params.Featured)
	}

	// 官方过滤
	if params.Official != nil {
		query = query.Where("is_official = ?", *params.Official)
	}

	// 统计总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 排序
	switch params.Sort {
	case "popular":
		query = query.Order("use_count DESC")
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

	// 预加载作者信息
	if err := query.Preload("Author").Find(&templates).Error; err != nil {
		return nil, 0, err
	}

	return templates, total, nil
}

func (r *templateRepository) GetFeatured(ctx context.Context, limit int) ([]entity.Template, error) {
	var templates []entity.Template
	if err := r.db.WithContext(ctx).
		Where("is_featured = ? AND is_published = ?", true, true).
		Order("use_count DESC").
		Limit(limit).
		Preload("Author").
		Find(&templates).Error; err != nil {
		return nil, err
	}
	return templates, nil
}

func (r *templateRepository) Update(ctx context.Context, template *entity.Template) error {
	return r.db.WithContext(ctx).Save(template).Error
}

func (r *templateRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&entity.Template{}, "id = ?", id).Error
}

func (r *templateRepository) IncrementUseCount(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Model(&entity.Template{}).
		Where("id = ?", id).
		UpdateColumn("use_count", gorm.Expr("use_count + 1")).Error
}

func (r *templateRepository) IncrementViewCount(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Model(&entity.Template{}).
		Where("id = ?", id).
		UpdateColumn("view_count", gorm.Expr("view_count + 1")).Error
}

func (r *templateRepository) CountByCategory(ctx context.Context) (map[string]int, error) {
	type CategoryCount struct {
		Category string
		Count    int
	}

	var results []CategoryCount
	if err := r.db.WithContext(ctx).
		Model(&entity.Template{}).
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
