package repository

import (
	"context"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// CustomNodeListParams 自定义节点列表参数
type CustomNodeListParams struct {
	Category    string
	Status      string
	PricingType string
	Search      string
	AuthorID    *uuid.UUID
	Featured    *bool
	Page        int
	PageSize    int
	Sort        string // popular, newest, rating, downloads
}

// CustomNodeRepository 自定义节点仓储接口
type CustomNodeRepository interface {
	// 节点 CRUD
	Create(ctx context.Context, node *entity.CustomNode) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.CustomNode, error)
	GetBySlug(ctx context.Context, slug string) (*entity.CustomNode, error)
	List(ctx context.Context, params CustomNodeListParams) ([]entity.CustomNode, int64, error)
	GetFeatured(ctx context.Context, limit int) ([]entity.CustomNode, error)
	Update(ctx context.Context, node *entity.CustomNode) error
	Delete(ctx context.Context, id uuid.UUID) error

	// 版本管理
	CreateVersion(ctx context.Context, version *entity.CustomNodeVersion) error
	GetVersionByID(ctx context.Context, id uuid.UUID) (*entity.CustomNodeVersion, error)
	GetLatestVersion(ctx context.Context, nodeID uuid.UUID) (*entity.CustomNodeVersion, error)
	ListVersions(ctx context.Context, nodeID uuid.UUID) ([]entity.CustomNodeVersion, error)
	SetLatestVersion(ctx context.Context, nodeID uuid.UUID, versionID uuid.UUID) error

	// 安装管理
	Install(ctx context.Context, install *entity.CustomNodeInstall) error
	Uninstall(ctx context.Context, nodeID, userID uuid.UUID) error
	GetInstall(ctx context.Context, nodeID, userID uuid.UUID) (*entity.CustomNodeInstall, error)
	ListUserInstalls(ctx context.Context, userID uuid.UUID) ([]entity.CustomNodeInstall, error)
	UpdateInstall(ctx context.Context, install *entity.CustomNodeInstall) error
	IsInstalled(ctx context.Context, nodeID, userID uuid.UUID) (bool, error)

	// 收藏管理
	Star(ctx context.Context, nodeID, userID uuid.UUID) error
	Unstar(ctx context.Context, nodeID, userID uuid.UUID) error
	IsStarred(ctx context.Context, nodeID, userID uuid.UUID) (bool, error)
	ListUserStars(ctx context.Context, userID uuid.UUID) ([]entity.CustomNode, error)

	// 评价管理
	CreateReview(ctx context.Context, review *entity.CustomNodeReview) error
	GetReview(ctx context.Context, nodeID, userID uuid.UUID) (*entity.CustomNodeReview, error)
	ListReviews(ctx context.Context, nodeID uuid.UUID, page, pageSize int) ([]entity.CustomNodeReview, int64, error)
	UpdateReview(ctx context.Context, review *entity.CustomNodeReview) error
	DeleteReview(ctx context.Context, id uuid.UUID) error

	// 下载记录
	RecordDownload(ctx context.Context, download *entity.CustomNodeDownload) error

	// 统计
	CountByCategory(ctx context.Context) (map[string]int, error)
	CountByAuthor(ctx context.Context, authorID uuid.UUID) (int64, error)
}

type customNodeRepository struct {
	db *gorm.DB
}

// NewCustomNodeRepository 创建自定义节点仓储实例
func NewCustomNodeRepository(db *gorm.DB) CustomNodeRepository {
	return &customNodeRepository{db: db}
}

// ========== 节点 CRUD ==========

func (r *customNodeRepository) Create(ctx context.Context, node *entity.CustomNode) error {
	return r.db.WithContext(ctx).Create(node).Error
}

func (r *customNodeRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.CustomNode, error) {
	var node entity.CustomNode
	if err := r.db.WithContext(ctx).
		Preload("Author").
		First(&node, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &node, nil
}

func (r *customNodeRepository) GetBySlug(ctx context.Context, slug string) (*entity.CustomNode, error) {
	var node entity.CustomNode
	if err := r.db.WithContext(ctx).
		Preload("Author").
		First(&node, "slug = ?", slug).Error; err != nil {
		return nil, err
	}
	return &node, nil
}

func (r *customNodeRepository) List(ctx context.Context, params CustomNodeListParams) ([]entity.CustomNode, int64, error) {
	var nodes []entity.CustomNode
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.CustomNode{})

	// 默认只查询已发布的节点（除非指定了状态或作者）
	if params.Status != "" {
		query = query.Where("status = ?", params.Status)
	} else if params.AuthorID == nil {
		query = query.Where("status = ?", entity.CustomNodeStatusPublished)
	}

	// 分类过滤
	if params.Category != "" {
		query = query.Where("category = ?", params.Category)
	}

	// 定价类型过滤
	if params.PricingType != "" {
		query = query.Where("pricing_type = ?", params.PricingType)
	}

	// 作者过滤
	if params.AuthorID != nil {
		query = query.Where("author_id = ?", *params.AuthorID)
	}

	// 精选过滤
	if params.Featured != nil {
		query = query.Where("featured = ?", *params.Featured)
	}

	// 搜索
	if params.Search != "" {
		searchPattern := "%" + params.Search + "%"
		query = query.Where("name LIKE ? OR display_name LIKE ? OR description LIKE ?",
			searchPattern, searchPattern, searchPattern)
	}

	// 统计总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 排序
	switch params.Sort {
	case "popular":
		query = query.Order("download_count DESC, star_count DESC")
	case "rating":
		query = query.Order("avg_rating DESC, review_count DESC")
	case "downloads":
		query = query.Order("download_count DESC")
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
	if err := query.Preload("Author").Find(&nodes).Error; err != nil {
		return nil, 0, err
	}

	return nodes, total, nil
}

func (r *customNodeRepository) GetFeatured(ctx context.Context, limit int) ([]entity.CustomNode, error) {
	var nodes []entity.CustomNode
	if err := r.db.WithContext(ctx).
		Where("featured = ? AND status = ?", true, entity.CustomNodeStatusPublished).
		Order("sort_order ASC, download_count DESC").
		Limit(limit).
		Preload("Author").
		Find(&nodes).Error; err != nil {
		return nil, err
	}
	return nodes, nil
}

func (r *customNodeRepository) Update(ctx context.Context, node *entity.CustomNode) error {
	return r.db.WithContext(ctx).Save(node).Error
}

func (r *customNodeRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&entity.CustomNode{}, "id = ?", id).Error
}

// ========== 版本管理 ==========

func (r *customNodeRepository) CreateVersion(ctx context.Context, version *entity.CustomNodeVersion) error {
	return r.db.WithContext(ctx).Create(version).Error
}

func (r *customNodeRepository) GetVersionByID(ctx context.Context, id uuid.UUID) (*entity.CustomNodeVersion, error) {
	var version entity.CustomNodeVersion
	if err := r.db.WithContext(ctx).First(&version, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &version, nil
}

func (r *customNodeRepository) GetLatestVersion(ctx context.Context, nodeID uuid.UUID) (*entity.CustomNodeVersion, error) {
	var version entity.CustomNodeVersion
	if err := r.db.WithContext(ctx).
		Where("node_id = ? AND is_latest = ?", nodeID, true).
		First(&version).Error; err != nil {
		return nil, err
	}
	return &version, nil
}

func (r *customNodeRepository) ListVersions(ctx context.Context, nodeID uuid.UUID) ([]entity.CustomNodeVersion, error) {
	var versions []entity.CustomNodeVersion
	if err := r.db.WithContext(ctx).
		Where("node_id = ?", nodeID).
		Order("version_code DESC").
		Find(&versions).Error; err != nil {
		return nil, err
	}
	return versions, nil
}

func (r *customNodeRepository) SetLatestVersion(ctx context.Context, nodeID uuid.UUID, versionID uuid.UUID) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 先将所有版本设置为非最新
		if err := tx.Model(&entity.CustomNodeVersion{}).
			Where("node_id = ?", nodeID).
			Update("is_latest", false).Error; err != nil {
			return err
		}

		// 设置指定版本为最新
		if err := tx.Model(&entity.CustomNodeVersion{}).
			Where("id = ?", versionID).
			Update("is_latest", true).Error; err != nil {
			return err
		}

		// 获取版本信息并更新节点
		var version entity.CustomNodeVersion
		if err := tx.First(&version, "id = ?", versionID).Error; err != nil {
			return err
		}

		return tx.Model(&entity.CustomNode{}).
			Where("id = ?", nodeID).
			Updates(map[string]interface{}{
				"latest_version":    version.Version,
				"latest_version_id": version.ID,
			}).Error
	})
}

// ========== 安装管理 ==========

func (r *customNodeRepository) Install(ctx context.Context, install *entity.CustomNodeInstall) error {
	return r.db.WithContext(ctx).Create(install).Error
}

func (r *customNodeRepository) Uninstall(ctx context.Context, nodeID, userID uuid.UUID) error {
	return r.db.WithContext(ctx).Model(&entity.CustomNodeInstall{}).
		Where("node_id = ? AND user_id = ?", nodeID, userID).
		Updates(map[string]interface{}{
			"is_active":      false,
			"uninstalled_at": gorm.Expr("NOW()"),
		}).Error
}

func (r *customNodeRepository) GetInstall(ctx context.Context, nodeID, userID uuid.UUID) (*entity.CustomNodeInstall, error) {
	var install entity.CustomNodeInstall
	if err := r.db.WithContext(ctx).
		Where("node_id = ? AND user_id = ?", nodeID, userID).
		Preload("Node").
		Preload("Version").
		First(&install).Error; err != nil {
		return nil, err
	}
	return &install, nil
}

func (r *customNodeRepository) ListUserInstalls(ctx context.Context, userID uuid.UUID) ([]entity.CustomNodeInstall, error) {
	var installs []entity.CustomNodeInstall
	if err := r.db.WithContext(ctx).
		Where("user_id = ? AND is_active = ?", userID, true).
		Preload("Node").
		Preload("Node.Author").
		Preload("Version").
		Find(&installs).Error; err != nil {
		return nil, err
	}
	return installs, nil
}

func (r *customNodeRepository) UpdateInstall(ctx context.Context, install *entity.CustomNodeInstall) error {
	return r.db.WithContext(ctx).Save(install).Error
}

func (r *customNodeRepository) IsInstalled(ctx context.Context, nodeID, userID uuid.UUID) (bool, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&entity.CustomNodeInstall{}).
		Where("node_id = ? AND user_id = ? AND is_active = ?", nodeID, userID, true).
		Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

// ========== 收藏管理 ==========

func (r *customNodeRepository) Star(ctx context.Context, nodeID, userID uuid.UUID) error {
	star := &entity.CustomNodeStar{
		NodeID: nodeID,
		UserID: userID,
	}
	return r.db.WithContext(ctx).Create(star).Error
}

func (r *customNodeRepository) Unstar(ctx context.Context, nodeID, userID uuid.UUID) error {
	return r.db.WithContext(ctx).
		Where("node_id = ? AND user_id = ?", nodeID, userID).
		Delete(&entity.CustomNodeStar{}).Error
}

func (r *customNodeRepository) IsStarred(ctx context.Context, nodeID, userID uuid.UUID) (bool, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&entity.CustomNodeStar{}).
		Where("node_id = ? AND user_id = ?", nodeID, userID).
		Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *customNodeRepository) ListUserStars(ctx context.Context, userID uuid.UUID) ([]entity.CustomNode, error) {
	var nodes []entity.CustomNode
	if err := r.db.WithContext(ctx).
		Joins("JOIN what_reverse_custom_node_stars ON what_reverse_custom_node_stars.node_id = what_reverse_custom_nodes.id").
		Where("what_reverse_custom_node_stars.user_id = ?", userID).
		Preload("Author").
		Find(&nodes).Error; err != nil {
		return nil, err
	}
	return nodes, nil
}

// ========== 评价管理 ==========

func (r *customNodeRepository) CreateReview(ctx context.Context, review *entity.CustomNodeReview) error {
	return r.db.WithContext(ctx).Create(review).Error
}

func (r *customNodeRepository) GetReview(ctx context.Context, nodeID, userID uuid.UUID) (*entity.CustomNodeReview, error) {
	var review entity.CustomNodeReview
	if err := r.db.WithContext(ctx).
		Where("node_id = ? AND user_id = ?", nodeID, userID).
		Preload("User").
		First(&review).Error; err != nil {
		return nil, err
	}
	return &review, nil
}

func (r *customNodeRepository) ListReviews(ctx context.Context, nodeID uuid.UUID, page, pageSize int) ([]entity.CustomNodeReview, int64, error) {
	var reviews []entity.CustomNodeReview
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.CustomNodeReview{}).Where("node_id = ?", nodeID)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if page > 0 && pageSize > 0 {
		offset := (page - 1) * pageSize
		query = query.Offset(offset).Limit(pageSize)
	}

	if err := query.Order("created_at DESC").Preload("User").Find(&reviews).Error; err != nil {
		return nil, 0, err
	}

	return reviews, total, nil
}

func (r *customNodeRepository) UpdateReview(ctx context.Context, review *entity.CustomNodeReview) error {
	return r.db.WithContext(ctx).Save(review).Error
}

func (r *customNodeRepository) DeleteReview(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&entity.CustomNodeReview{}, "id = ?", id).Error
}

// ========== 下载记录 ==========

func (r *customNodeRepository) RecordDownload(ctx context.Context, download *entity.CustomNodeDownload) error {
	return r.db.WithContext(ctx).Create(download).Error
}

// ========== 统计 ==========

func (r *customNodeRepository) CountByCategory(ctx context.Context) (map[string]int, error) {
	type CategoryCount struct {
		Category string
		Count    int
	}

	var results []CategoryCount
	if err := r.db.WithContext(ctx).
		Model(&entity.CustomNode{}).
		Where("status = ?", entity.CustomNodeStatusPublished).
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

func (r *customNodeRepository) CountByAuthor(ctx context.Context, authorID uuid.UUID) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&entity.CustomNode{}).
		Where("author_id = ?", authorID).
		Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}
