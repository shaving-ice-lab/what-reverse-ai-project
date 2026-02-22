package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/reverseai/server/internal/domain/entity"
	"gorm.io/gorm"
)

// WorkspaceRepository 工作空间仓储接口
type WorkspaceRepository interface {
	// 基础 CRUD
	Create(ctx context.Context, workspace *entity.Workspace) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.Workspace, error)
	GetByIDUnscoped(ctx context.Context, id uuid.UUID) (*entity.Workspace, error)
	GetByIDWithVersion(ctx context.Context, id uuid.UUID) (*entity.Workspace, error)
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

	// 公开列表（Marketplace）
	ListPublic(ctx context.Context, page, pageSize int) ([]entity.Workspace, int64, error)

	// 版本管理
	CreateVersion(ctx context.Context, version *entity.WorkspaceVersion) error
	UpdateVersion(ctx context.Context, version *entity.WorkspaceVersion) error
	GetVersionByID(ctx context.Context, id uuid.UUID) (*entity.WorkspaceVersion, error)
	GetVersionByWorkspaceAndVersion(ctx context.Context, workspaceID uuid.UUID, version string) (*entity.WorkspaceVersion, error)
	ListVersions(ctx context.Context, workspaceID uuid.UUID, params WorkspaceVersionListParams) ([]entity.WorkspaceVersion, int64, error)

	// 域名查询
	GetDomainByDomain(ctx context.Context, domain string) (*entity.WorkspaceDomain, error)

	// 会话管理
	CreateSession(ctx context.Context, session *entity.WorkspaceSession) error
	GetSessionByID(ctx context.Context, id uuid.UUID) (*entity.WorkspaceSession, error)
	UpdateSession(ctx context.Context, session *entity.WorkspaceSession) error
	DeleteAnonymousSessionsBefore(ctx context.Context, cutoff time.Time) (int64, error)

	// 事件管理
	CreateEvent(ctx context.Context, event *entity.WorkspaceEvent) error

	// 评分管理
	ListRatings(ctx context.Context, workspaceID uuid.UUID, params RatingListParams) ([]entity.WorkspaceRating, int64, error)
}

// WorkspaceListParams Workspace 列表参数（管理员）
type WorkspaceListParams struct {
	Search         string
	Status         string
	AppStatus      string
	OwnerID        *uuid.UUID
	IncludeDeleted bool
	Sort           string
	Order          string
	Page           int
	PageSize       int
}

// WorkspaceVersionListParams Workspace 版本列表参数
type WorkspaceVersionListParams struct {
	Page     int
	PageSize int
}

// RatingListParams 评分列表参数
type RatingListParams struct {
	MinRating int
	Page      int
	PageSize  int
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
		Joins("LEFT JOIN what_reverse_workspace_members ON what_reverse_workspace_members.workspace_id = what_reverse_workspaces.id AND what_reverse_workspace_members.user_id = ? AND what_reverse_workspace_members.status = 'active'", userID).
		Where("what_reverse_workspaces.deleted_at IS NULL").
		Where(
			"what_reverse_workspaces.owner_user_id = ? OR what_reverse_workspace_members.user_id = ? OR (what_reverse_workspaces.app_status = 'published' AND what_reverse_workspaces.access_mode IN ('public_anonymous','public_auth'))",
			userID, userID,
		).
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

func (r *workspaceRepository) GetByIDWithVersion(ctx context.Context, id uuid.UUID) (*entity.Workspace, error) {
	var workspace entity.Workspace
	if err := r.db.WithContext(ctx).
		Preload("CurrentVersion").
		First(&workspace, "id = ?", id).Error; err != nil {
		return nil, err
	}
	// Fallback: if GORM Preload didn't resolve the relationship, load manually
	if workspace.CurrentVersion == nil && workspace.CurrentVersionID != nil {
		var version entity.WorkspaceVersion
		if err := r.db.WithContext(ctx).
			First(&version, "id = ?", *workspace.CurrentVersionID).Error; err == nil {
			workspace.CurrentVersion = &version
		}
	}
	return &workspace, nil
}

// ==================== 公开列表（Marketplace）====================

func (r *workspaceRepository) ListPublic(ctx context.Context, page, pageSize int) ([]entity.Workspace, int64, error) {
	var workspaces []entity.Workspace
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.Workspace{}).
		Where("app_status = ? AND access_mode != ?", "published", "private").
		Where("deleted_at IS NULL")

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	if err := query.Order("published_at DESC").Offset(offset).Limit(pageSize).Find(&workspaces).Error; err != nil {
		return nil, 0, err
	}
	return workspaces, total, nil
}

// ==================== 版本管理 ====================

func (r *workspaceRepository) CreateVersion(ctx context.Context, version *entity.WorkspaceVersion) error {
	return r.db.WithContext(ctx).Create(version).Error
}

func (r *workspaceRepository) UpdateVersion(ctx context.Context, version *entity.WorkspaceVersion) error {
	return r.db.WithContext(ctx).Save(version).Error
}

func (r *workspaceRepository) GetVersionByID(ctx context.Context, id uuid.UUID) (*entity.WorkspaceVersion, error) {
	var version entity.WorkspaceVersion
	if err := r.db.WithContext(ctx).
		First(&version, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &version, nil
}

func (r *workspaceRepository) GetVersionByWorkspaceAndVersion(ctx context.Context, workspaceID uuid.UUID, versionStr string) (*entity.WorkspaceVersion, error) {
	var version entity.WorkspaceVersion
	if err := r.db.WithContext(ctx).
		First(&version, "workspace_id = ? AND version = ?", workspaceID, versionStr).Error; err != nil {
		return nil, err
	}
	return &version, nil
}

func (r *workspaceRepository) ListVersions(ctx context.Context, workspaceID uuid.UUID, params WorkspaceVersionListParams) ([]entity.WorkspaceVersion, int64, error) {
	var versions []entity.WorkspaceVersion
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.WorkspaceVersion{}).
		Where("workspace_id = ?", workspaceID)

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

	if err := query.Order("created_at DESC").Offset(offset).Limit(pageSize).
		Preload("Creator").Find(&versions).Error; err != nil {
		return nil, 0, err
	}

	return versions, total, nil
}

// ==================== 域名查询 ====================

func (r *workspaceRepository) GetDomainByDomain(ctx context.Context, domainStr string) (*entity.WorkspaceDomain, error) {
	var domain entity.WorkspaceDomain
	if err := r.db.WithContext(ctx).
		Preload("Workspace").
		First(&domain, "domain = ?", domainStr).Error; err != nil {
		return nil, err
	}
	return &domain, nil
}

// ==================== 会话管理 ====================

func (r *workspaceRepository) CreateSession(ctx context.Context, session *entity.WorkspaceSession) error {
	return r.db.WithContext(ctx).Create(session).Error
}

func (r *workspaceRepository) GetSessionByID(ctx context.Context, id uuid.UUID) (*entity.WorkspaceSession, error) {
	var session entity.WorkspaceSession
	if err := r.db.WithContext(ctx).First(&session, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &session, nil
}

func (r *workspaceRepository) UpdateSession(ctx context.Context, session *entity.WorkspaceSession) error {
	return r.db.WithContext(ctx).Save(session).Error
}

func (r *workspaceRepository) DeleteAnonymousSessionsBefore(ctx context.Context, cutoff time.Time) (int64, error) {
	result := r.db.WithContext(ctx).
		Where("session_type = ?", "anon").
		Where("created_at < ?", cutoff).
		Delete(&entity.WorkspaceSession{})
	return result.RowsAffected, result.Error
}

// ==================== 事件管理 ====================

func (r *workspaceRepository) CreateEvent(ctx context.Context, event *entity.WorkspaceEvent) error {
	return r.db.WithContext(ctx).Create(event).Error
}

// ==================== 评分管理 ====================

func (r *workspaceRepository) ListRatings(ctx context.Context, workspaceID uuid.UUID, params RatingListParams) ([]entity.WorkspaceRating, int64, error) {
	var ratings []entity.WorkspaceRating
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.WorkspaceRating{}).
		Where("workspace_id = ?", workspaceID)

	if params.MinRating > 0 {
		query = query.Where("rating >= ?", params.MinRating)
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

	if err := query.Order("created_at DESC").Offset(offset).Limit(pageSize).
		Preload("User").Find(&ratings).Error; err != nil {
		return nil, 0, err
	}

	return ratings, total, nil
}
