package repository

import (
	"context"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// WorkspaceRepository 工作空间仓储接口
type WorkspaceRepository interface {
	Create(ctx context.Context, workspace *entity.Workspace) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.Workspace, error)
	GetByIDUnscoped(ctx context.Context, id uuid.UUID) (*entity.Workspace, error)
	GetByOwnerID(ctx context.Context, ownerID uuid.UUID) (*entity.Workspace, error)
	ListByOwnerID(ctx context.Context, ownerID uuid.UUID) ([]entity.Workspace, error)
	ListByUserID(ctx context.Context, userID uuid.UUID) ([]entity.Workspace, error)
	ListAll(ctx context.Context, params WorkspaceListParams) ([]entity.Workspace, int64, error)
	GetBySlug(ctx context.Context, slug string) (*entity.Workspace, error)
	ExistsBySlug(ctx context.Context, slug string) (bool, error)
	Update(ctx context.Context, workspace *entity.Workspace) error
	Delete(ctx context.Context, id uuid.UUID) error
	Restore(ctx context.Context, id uuid.UUID) error
	UpdateStatusUnscoped(ctx context.Context, id uuid.UUID, status string) error
	ListSoftDeletedBefore(ctx context.Context, before time.Time) ([]entity.Workspace, error)
	ListColdStorageBefore(ctx context.Context, before time.Time) ([]entity.Workspace, error)
	Purge(ctx context.Context, id uuid.UUID) error
}

// WorkspaceListParams Workspace 列表参数（管理员）
type WorkspaceListParams struct {
	Search         string
	Status         string
	OwnerID        *uuid.UUID
	IncludeDeleted bool
	Page           int
	PageSize       int
}

type workspaceRepository struct {
	db *gorm.DB
}

// NewWorkspaceRepository 创建工作空间仓储实例
func NewWorkspaceRepository(db *gorm.DB) WorkspaceRepository {
	return &workspaceRepository{db: db}
}

func (r *workspaceRepository) Create(ctx context.Context, workspace *entity.Workspace) error {
	return r.db.WithContext(ctx).Create(workspace).Error
}

func (r *workspaceRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.Workspace, error) {
	var workspace entity.Workspace
	if err := r.db.WithContext(ctx).First(&workspace, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &workspace, nil
}

func (r *workspaceRepository) GetByIDUnscoped(ctx context.Context, id uuid.UUID) (*entity.Workspace, error) {
	var workspace entity.Workspace
	if err := r.db.WithContext(ctx).Unscoped().First(&workspace, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &workspace, nil
}

func (r *workspaceRepository) GetByOwnerID(ctx context.Context, ownerID uuid.UUID) (*entity.Workspace, error) {
	var workspace entity.Workspace
	if err := r.db.WithContext(ctx).
		Where("owner_user_id = ?", ownerID).
		Order("created_at ASC").
		First(&workspace).Error; err != nil {
		return nil, err
	}
	return &workspace, nil
}

func (r *workspaceRepository) ListByOwnerID(ctx context.Context, ownerID uuid.UUID) ([]entity.Workspace, error) {
	var workspaces []entity.Workspace
	if err := r.db.WithContext(ctx).
		Where("owner_user_id = ?", ownerID).
		Order("created_at ASC").
		Find(&workspaces).Error; err != nil {
		return nil, err
	}
	return workspaces, nil
}

func (r *workspaceRepository) ListByUserID(ctx context.Context, userID uuid.UUID) ([]entity.Workspace, error) {
	var workspaces []entity.Workspace
	if err := r.db.WithContext(ctx).
		Table("what_reverse_workspaces").
		Joins("LEFT JOIN what_reverse_workspace_members ON what_reverse_workspace_members.workspace_id = what_reverse_workspaces.id AND what_reverse_workspace_members.user_id = ?", userID).
		Where("what_reverse_workspaces.deleted_at IS NULL").
		Where("what_reverse_workspaces.owner_user_id = ? OR what_reverse_workspace_members.user_id = ?", userID, userID).
		Group("what_reverse_workspaces.id").
		Order("what_reverse_workspaces.created_at ASC").
		Find(&workspaces).Error; err != nil {
		return nil, err
	}
	return workspaces, nil
}

func (r *workspaceRepository) ListAll(ctx context.Context, params WorkspaceListParams) ([]entity.Workspace, int64, error) {
	var workspaces []entity.Workspace
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.Workspace{}).Preload("Owner")
	if params.IncludeDeleted {
		query = query.Unscoped()
	}
	if params.Search != "" {
		like := "%" + params.Search + "%"
		query = query.Where("name LIKE ? OR slug LIKE ?", like, like)
	}
	if params.Status != "" {
		query = query.Where("status = ?", params.Status)
	}
	if params.OwnerID != nil {
		query = query.Where("owner_user_id = ?", *params.OwnerID)
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
	if err := query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&workspaces).Error; err != nil {
		return nil, 0, err
	}
	return workspaces, total, nil
}

func (r *workspaceRepository) GetBySlug(ctx context.Context, slug string) (*entity.Workspace, error) {
	var workspace entity.Workspace
	if err := r.db.WithContext(ctx).First(&workspace, "slug = ?", slug).Error; err != nil {
		return nil, err
	}
	return &workspace, nil
}

func (r *workspaceRepository) ExistsBySlug(ctx context.Context, slug string) (bool, error) {
	var count int64
	if err := r.db.WithContext(ctx).
		Model(&entity.Workspace{}).
		Where("slug = ?", slug).
		Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *workspaceRepository) Update(ctx context.Context, workspace *entity.Workspace) error {
	return r.db.WithContext(ctx).Save(workspace).Error
}

func (r *workspaceRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&entity.Workspace{}, "id = ?", id).Error
}

func (r *workspaceRepository) Restore(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Unscoped().
		Model(&entity.Workspace{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"deleted_at": nil,
			"status":     "active",
		}).Error
}

func (r *workspaceRepository) UpdateStatusUnscoped(ctx context.Context, id uuid.UUID, status string) error {
	return r.db.WithContext(ctx).Unscoped().
		Model(&entity.Workspace{}).
		Where("id = ?", id).
		Update("status", status).Error
}

func (r *workspaceRepository) ListSoftDeletedBefore(ctx context.Context, before time.Time) ([]entity.Workspace, error) {
	var workspaces []entity.Workspace
	err := r.db.WithContext(ctx).Unscoped().
		Where("deleted_at IS NOT NULL AND deleted_at <= ? AND status != ?", before, "cold_storage").
		Find(&workspaces).Error
	return workspaces, err
}

func (r *workspaceRepository) ListColdStorageBefore(ctx context.Context, before time.Time) ([]entity.Workspace, error) {
	var workspaces []entity.Workspace
	err := r.db.WithContext(ctx).Unscoped().
		Where("deleted_at IS NOT NULL AND deleted_at <= ? AND status = ?", before, "cold_storage").
		Find(&workspaces).Error
	return workspaces, err
}

func (r *workspaceRepository) Purge(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Unscoped().Delete(&entity.Workspace{}, "id = ?", id).Error
}
