package repository

import (
	"context"
	"strings"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AppRepository App 仓储接口
type AppRepository interface {
	Create(ctx context.Context, app *entity.App) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.App, error)
	GetByWorkspaceAndSlug(ctx context.Context, workspaceID uuid.UUID, slug string) (*entity.App, error)
	ExistsByWorkspaceSlug(ctx context.Context, workspaceID uuid.UUID, slug string) (bool, error)
	List(ctx context.Context, ownerID uuid.UUID, params AppListParams) ([]entity.App, int64, error)
	ListAll(ctx context.Context, params AdminAppListParams) ([]entity.App, int64, error)
	ListByWorkspaceID(ctx context.Context, workspaceID uuid.UUID) ([]entity.App, error)
	ListByOwnerID(ctx context.Context, ownerID uuid.UUID) ([]entity.App, error)
	CountByWorkspace(ctx context.Context, workspaceID uuid.UUID) (int64, error)
	Update(ctx context.Context, app *entity.App) error
}

// AppListParams App 列表参数
type AppListParams struct {
	WorkspaceID *uuid.UUID
	Search      string
	Status      string
	Sort        string
	Order       string
	Page        int
	PageSize    int
}

// AdminAppListParams 管理员 App 列表参数
type AdminAppListParams struct {
	WorkspaceID *uuid.UUID
	OwnerID     *uuid.UUID
	Search      string
	Status      string
	Page        int
	PageSize    int
}

type appRepository struct {
	db *gorm.DB
}

// NewAppRepository 创建 App 仓储实例
func NewAppRepository(db *gorm.DB) AppRepository {
	return &appRepository{db: db}
}

func (r *appRepository) Create(ctx context.Context, app *entity.App) error {
	return r.db.WithContext(ctx).Create(app).Error
}

func (r *appRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.App, error) {
	var app entity.App
	if err := r.db.WithContext(ctx).
		Preload("Workspace").
		Preload("Version").
		First(&app, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &app, nil
}

func (r *appRepository) GetByWorkspaceAndSlug(ctx context.Context, workspaceID uuid.UUID, slug string) (*entity.App, error) {
	var app entity.App
	if err := r.db.WithContext(ctx).
		First(&app, "workspace_id = ? AND slug = ?", workspaceID, slug).Error; err != nil {
		return nil, err
	}
	return &app, nil
}

func (r *appRepository) ExistsByWorkspaceSlug(ctx context.Context, workspaceID uuid.UUID, slug string) (bool, error) {
	var count int64
	if err := r.db.WithContext(ctx).
		Model(&entity.App{}).
		Where("workspace_id = ? AND slug = ?", workspaceID, slug).
		Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *appRepository) List(ctx context.Context, ownerID uuid.UUID, params AppListParams) ([]entity.App, int64, error) {
	var apps []entity.App
	var total int64

	query := r.db.WithContext(ctx).
		Model(&entity.App{}).
		Joins("LEFT JOIN what_reverse_workspace_members wm ON wm.workspace_id = what_reverse_apps.workspace_id AND wm.user_id = ?", ownerID).
		Where("what_reverse_apps.owner_user_id = ? OR wm.user_id = ?", ownerID, ownerID)
	if params.WorkspaceID != nil {
		query = query.Where("what_reverse_apps.workspace_id = ?", *params.WorkspaceID)
	}
	if params.Search != "" {
		query = query.Where("what_reverse_apps.name ILIKE ? OR what_reverse_apps.description ILIKE ?", "%"+params.Search+"%", "%"+params.Search+"%")
	}
	if params.Status != "" {
		query = query.Where("what_reverse_apps.status = ?", params.Status)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	sort := "updated_at"
	if params.Sort != "" {
		sort = params.Sort
	}
	if !strings.Contains(sort, ".") {
		sort = "what_reverse_apps." + sort
	}
	order := "desc"
	if params.Order != "" {
		order = params.Order
	}
	query = query.Order(sort + " " + order)

	if params.Page > 0 && params.PageSize > 0 {
		offset := (params.Page - 1) * params.PageSize
		query = query.Offset(offset).Limit(params.PageSize)
	}

	if err := query.Preload("Workspace").Find(&apps).Error; err != nil {
		return nil, 0, err
	}

	return apps, total, nil
}

func (r *appRepository) ListAll(ctx context.Context, params AdminAppListParams) ([]entity.App, int64, error) {
	var apps []entity.App
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.App{}).
		Preload("Workspace").
		Preload("Owner")
	if params.WorkspaceID != nil {
		query = query.Where("workspace_id = ?", *params.WorkspaceID)
	}
	if params.OwnerID != nil {
		query = query.Where("owner_user_id = ?", *params.OwnerID)
	}
	if params.Search != "" {
		like := "%" + params.Search + "%"
		query = query.Where("name LIKE ? OR slug LIKE ?", like, like)
	}
	if params.Status != "" {
		query = query.Where("status = ?", params.Status)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	page := params.Page
	if page <= 0 {
		page = 1
	}
	pageSize := params.PageSize
	if pageSize <= 0 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize
	if err := query.Order("updated_at DESC").Offset(offset).Limit(pageSize).Find(&apps).Error; err != nil {
		return nil, 0, err
	}

	return apps, total, nil
}

func (r *appRepository) ListByWorkspaceID(ctx context.Context, workspaceID uuid.UUID) ([]entity.App, error) {
	var apps []entity.App
	if err := r.db.WithContext(ctx).
		Where("workspace_id = ?", workspaceID).
		Order("created_at ASC").
		Find(&apps).Error; err != nil {
		return nil, err
	}
	return apps, nil
}

func (r *appRepository) ListByOwnerID(ctx context.Context, ownerID uuid.UUID) ([]entity.App, error) {
	var apps []entity.App
	if err := r.db.WithContext(ctx).
		Preload("Workspace").
		Where("owner_user_id = ?", ownerID).
		Order("created_at ASC").
		Find(&apps).Error; err != nil {
		return nil, err
	}
	return apps, nil
}

func (r *appRepository) CountByWorkspace(ctx context.Context, workspaceID uuid.UUID) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).
		Model(&entity.App{}).
		Where("workspace_id = ?", workspaceID).
		Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (r *appRepository) Update(ctx context.Context, app *entity.App) error {
	return r.db.WithContext(ctx).Save(app).Error
}
