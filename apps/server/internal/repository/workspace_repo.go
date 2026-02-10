package repository

import (
	"context"
	"strings"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
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
	GetVersionByID(ctx context.Context, id uuid.UUID) (*entity.WorkspaceVersion, error)
	GetVersionByWorkspaceAndVersion(ctx context.Context, workspaceID uuid.UUID, version string) (*entity.WorkspaceVersion, error)
	ListVersions(ctx context.Context, workspaceID uuid.UUID, params WorkspaceVersionListParams) ([]entity.WorkspaceVersion, int64, error)

	// 域名管理
	CreateDomain(ctx context.Context, domain *entity.WorkspaceDomain) error
	GetDomainByID(ctx context.Context, id uuid.UUID) (*entity.WorkspaceDomain, error)
	GetDomainByDomain(ctx context.Context, domain string) (*entity.WorkspaceDomain, error)
	ListDomains(ctx context.Context, workspaceID uuid.UUID) ([]entity.WorkspaceDomain, error)
	UpdateDomain(ctx context.Context, domain *entity.WorkspaceDomain) error
	DeleteDomain(ctx context.Context, id uuid.UUID) error
	ListExpiryReminders(ctx context.Context, warnBefore time.Time, limit int) ([]entity.WorkspaceDomain, error)
	ListSSLExpiryReminders(ctx context.Context, warnBefore time.Time, limit int) ([]entity.WorkspaceDomain, error)
	ListSSLExpired(ctx context.Context, now time.Time, limit int) ([]entity.WorkspaceDomain, error)
	ListSSLAutoRenewCandidates(ctx context.Context, now, renewBefore time.Time, limit int) ([]entity.WorkspaceDomain, error)

	// 会话管理
	CreateSession(ctx context.Context, session *entity.WorkspaceSession) error
	GetSessionByID(ctx context.Context, id uuid.UUID) (*entity.WorkspaceSession, error)
	ListSessions(ctx context.Context, workspaceID uuid.UUID, params SessionListParams) ([]entity.WorkspaceSession, int64, error)
	UpdateSession(ctx context.Context, session *entity.WorkspaceSession) error
	DeleteAnonymousSessionsBefore(ctx context.Context, cutoff time.Time) (int64, error)

	// 事件管理
	CreateEvent(ctx context.Context, event *entity.WorkspaceEvent) error
	ListEvents(ctx context.Context, workspaceID uuid.UUID, params EventListParams) ([]entity.WorkspaceEvent, int64, error)

	// 评分管理
	CreateOrUpdateRating(ctx context.Context, rating *entity.WorkspaceRating) error
	GetRatingByUserAndWorkspace(ctx context.Context, userID, workspaceID uuid.UUID) (*entity.WorkspaceRating, error)
	ListRatings(ctx context.Context, workspaceID uuid.UUID, params RatingListParams) ([]entity.WorkspaceRating, int64, error)
	GetAverageRating(ctx context.Context, workspaceID uuid.UUID) (float64, int64, error)

	// 使用统计
	UpsertUsageStats(ctx context.Context, stats *entity.WorkspaceUsageStats) error
	GetUsageStats(ctx context.Context, workspaceID uuid.UUID, startDate, endDate time.Time) ([]entity.WorkspaceUsageStats, error)
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

// SessionListParams 会话列表参数
type SessionListParams struct {
	SessionType string
	Page        int
	PageSize    int
}

// EventListParams 事件列表参数
type EventListParams struct {
	EventType string
	SessionID *uuid.UUID
	Page      int
	PageSize  int
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

func (r *workspaceRepository) GetByIDWithVersion(ctx context.Context, id uuid.UUID) (*entity.Workspace, error) {
	var workspace entity.Workspace
	if err := r.db.WithContext(ctx).
		Preload("CurrentVersion").
		First(&workspace, "id = ?", id).Error; err != nil {
		return nil, err
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

func (r *workspaceRepository) GetVersionByID(ctx context.Context, id uuid.UUID) (*entity.WorkspaceVersion, error) {
	var version entity.WorkspaceVersion
	if err := r.db.WithContext(ctx).
		Preload("Workflow").
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

// ==================== 域名管理 ====================

func (r *workspaceRepository) CreateDomain(ctx context.Context, domain *entity.WorkspaceDomain) error {
	return r.db.WithContext(ctx).Create(domain).Error
}

func (r *workspaceRepository) GetDomainByID(ctx context.Context, id uuid.UUID) (*entity.WorkspaceDomain, error) {
	var domain entity.WorkspaceDomain
	if err := r.db.WithContext(ctx).First(&domain, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &domain, nil
}

func (r *workspaceRepository) GetDomainByDomain(ctx context.Context, domainStr string) (*entity.WorkspaceDomain, error) {
	var domain entity.WorkspaceDomain
	if err := r.db.WithContext(ctx).
		Preload("Workspace").
		First(&domain, "domain = ?", domainStr).Error; err != nil {
		return nil, err
	}
	return &domain, nil
}

func (r *workspaceRepository) ListDomains(ctx context.Context, workspaceID uuid.UUID) ([]entity.WorkspaceDomain, error) {
	var domains []entity.WorkspaceDomain
	if err := r.db.WithContext(ctx).
		Where("workspace_id = ?", workspaceID).
		Order("created_at DESC").
		Find(&domains).Error; err != nil {
		return nil, err
	}
	return domains, nil
}

func (r *workspaceRepository) UpdateDomain(ctx context.Context, domain *entity.WorkspaceDomain) error {
	return r.db.WithContext(ctx).Save(domain).Error
}

func (r *workspaceRepository) DeleteDomain(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&entity.WorkspaceDomain{}, "id = ?", id).Error
}

func (r *workspaceRepository) ListExpiryReminders(ctx context.Context, warnBefore time.Time, limit int) ([]entity.WorkspaceDomain, error) {
	var domains []entity.WorkspaceDomain
	query := r.db.WithContext(ctx).Model(&entity.WorkspaceDomain{}).
		Where("domain_expires_at IS NOT NULL").
		Where("domain_expires_at <= ?", warnBefore).
		Where("domain_expiry_notified_at IS NULL")
	if limit > 0 {
		query = query.Limit(limit)
	}
	if err := query.Order("domain_expires_at ASC").Find(&domains).Error; err != nil {
		return nil, err
	}
	return domains, nil
}

func (r *workspaceRepository) ListSSLExpiryReminders(ctx context.Context, warnBefore time.Time, limit int) ([]entity.WorkspaceDomain, error) {
	var domains []entity.WorkspaceDomain
	query := r.db.WithContext(ctx).Model(&entity.WorkspaceDomain{}).
		Where("ssl_expires_at IS NOT NULL").
		Where("ssl_expires_at <= ?", warnBefore).
		Where("ssl_expiry_notified_at IS NULL")
	if limit > 0 {
		query = query.Limit(limit)
	}
	if err := query.Order("ssl_expires_at ASC").Find(&domains).Error; err != nil {
		return nil, err
	}
	return domains, nil
}

func (r *workspaceRepository) ListSSLExpired(ctx context.Context, now time.Time, limit int) ([]entity.WorkspaceDomain, error) {
	var domains []entity.WorkspaceDomain
	query := r.db.WithContext(ctx).Model(&entity.WorkspaceDomain{}).
		Where("ssl_expires_at IS NOT NULL").
		Where("ssl_expires_at <= ?", now).
		Where("ssl_status <> ?", "expired")
	if limit > 0 {
		query = query.Limit(limit)
	}
	if err := query.Order("ssl_expires_at ASC").Find(&domains).Error; err != nil {
		return nil, err
	}
	return domains, nil
}

func (r *workspaceRepository) ListSSLAutoRenewCandidates(ctx context.Context, now, renewBefore time.Time, limit int) ([]entity.WorkspaceDomain, error) {
	var domains []entity.WorkspaceDomain
	query := r.db.WithContext(ctx).Model(&entity.WorkspaceDomain{}).
		Where("ssl_expires_at IS NOT NULL").
		Where("ssl_expires_at > ?", now).
		Where("ssl_expires_at <= ?", renewBefore).
		Where("ssl_status = ?", "issued").
		Where("(ssl_next_retry_at IS NULL OR ssl_next_retry_at <= ?)", now)
	if limit > 0 {
		query = query.Limit(limit)
	}
	if err := query.Order("ssl_expires_at ASC").Find(&domains).Error; err != nil {
		return nil, err
	}
	return domains, nil
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

func (r *workspaceRepository) ListSessions(ctx context.Context, workspaceID uuid.UUID, params SessionListParams) ([]entity.WorkspaceSession, int64, error) {
	var sessions []entity.WorkspaceSession
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.WorkspaceSession{}).
		Where("workspace_id = ?", workspaceID)

	if params.SessionType != "" {
		query = query.Where("session_type = ?", params.SessionType)
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

	if err := query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&sessions).Error; err != nil {
		return nil, 0, err
	}

	return sessions, total, nil
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

func (r *workspaceRepository) ListEvents(ctx context.Context, workspaceID uuid.UUID, params EventListParams) ([]entity.WorkspaceEvent, int64, error) {
	var events []entity.WorkspaceEvent
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.WorkspaceEvent{}).
		Where("workspace_id = ?", workspaceID)

	if params.EventType != "" {
		query = query.Where("event_type = ?", params.EventType)
	}
	if params.SessionID != nil {
		query = query.Where("session_id = ?", *params.SessionID)
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

	if err := query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&events).Error; err != nil {
		return nil, 0, err
	}

	return events, total, nil
}

// ==================== 评分管理 ====================

func (r *workspaceRepository) CreateOrUpdateRating(ctx context.Context, rating *entity.WorkspaceRating) error {
	return r.db.WithContext(ctx).Save(rating).Error
}

func (r *workspaceRepository) GetRatingByUserAndWorkspace(ctx context.Context, userID, workspaceID uuid.UUID) (*entity.WorkspaceRating, error) {
	var rating entity.WorkspaceRating
	if err := r.db.WithContext(ctx).
		First(&rating, "user_id = ? AND workspace_id = ?", userID, workspaceID).Error; err != nil {
		return nil, err
	}
	return &rating, nil
}

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

func (r *workspaceRepository) GetAverageRating(ctx context.Context, workspaceID uuid.UUID) (float64, int64, error) {
	var result struct {
		Avg   float64
		Count int64
	}
	if err := r.db.WithContext(ctx).
		Model(&entity.WorkspaceRating{}).
		Select("AVG(rating) as avg, COUNT(*) as count").
		Where("workspace_id = ?", workspaceID).
		Scan(&result).Error; err != nil {
		return 0, 0, err
	}
	return result.Avg, result.Count, nil
}

// ==================== 使用统计 ====================

func (r *workspaceRepository) UpsertUsageStats(ctx context.Context, stats *entity.WorkspaceUsageStats) error {
	return r.db.WithContext(ctx).Save(stats).Error
}

func (r *workspaceRepository) GetUsageStats(ctx context.Context, workspaceID uuid.UUID, startDate, endDate time.Time) ([]entity.WorkspaceUsageStats, error) {
	var stats []entity.WorkspaceUsageStats
	if err := r.db.WithContext(ctx).
		Where("workspace_id = ? AND date >= ? AND date <= ?", workspaceID, startDate, endDate).
		Order("date ASC").
		Find(&stats).Error; err != nil {
		return nil, err
	}
	return stats, nil
}

// 更新 ListAll 以支持排序和应用状态过滤
func (r *workspaceRepository) listAllWithSort(ctx context.Context, params WorkspaceListParams) ([]entity.Workspace, int64, error) {
	var workspaces []entity.Workspace
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.Workspace{}).Preload("Owner")
	if params.IncludeDeleted {
		query = query.Unscoped()
	}
	if params.Search != "" {
		like := "%" + params.Search + "%"
		query = query.Where("name LIKE ? OR slug LIKE ? OR description LIKE ?", like, like, like)
	}
	if params.Status != "" {
		query = query.Where("status = ?", params.Status)
	}
	if params.AppStatus != "" {
		query = query.Where("app_status = ?", params.AppStatus)
	}
	if params.OwnerID != nil {
		query = query.Where("owner_user_id = ?", *params.OwnerID)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 排序
	sort := "updated_at"
	if params.Sort != "" {
		sort = params.Sort
	}
	if !strings.Contains(sort, ".") {
		sort = "what_reverse_workspaces." + sort
	}
	order := "desc"
	if params.Order != "" {
		order = params.Order
	}
	query = query.Order(sort + " " + order)

	page := params.Page
	if page <= 0 {
		page = 1
	}
	pageSize := params.PageSize
	if pageSize <= 0 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize
	if err := query.Offset(offset).Limit(pageSize).Find(&workspaces).Error; err != nil {
		return nil, 0, err
	}
	return workspaces, total, nil
}
