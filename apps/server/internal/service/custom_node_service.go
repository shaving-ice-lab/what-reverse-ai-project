package service

import (
	"context"
	"errors"
	"regexp"
	"strings"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
)

var (
	ErrCustomNodeNotFound   = errors.New("custom node not found")
	ErrCustomNodeSlugExists = errors.New("custom node slug already exists")
	ErrAlreadyInstalled     = errors.New("node already installed")
	ErrNotInstalled         = errors.New("node not installed")
	ErrAlreadyStarred       = errors.New("already starred")
	ErrNotStarred           = errors.New("not starred")
	ErrCannotReviewOwnNode  = errors.New("cannot review your own node")
	ErrNodeNotPublished     = errors.New("node is not published")
	// Note: ErrVersionNotFound, ErrAlreadyReviewed, ErrInvalidRating, ErrUnauthorized
	// are already defined in other service files
)

// CustomNodeService 自定义节点服务接口
type CustomNodeService interface {
	// 节点管理
	Create(ctx context.Context, authorID uuid.UUID, req CreateCustomNodeRequest) (*entity.CustomNode, error)
	GetByID(ctx context.Context, id uuid.UUID) (*entity.CustomNode, error)
	GetBySlug(ctx context.Context, slug string) (*entity.CustomNode, error)
	List(ctx context.Context, params repository.CustomNodeListParams) ([]entity.CustomNode, int64, error)
	GetFeatured(ctx context.Context, limit int) ([]entity.CustomNode, error)
	GetCategories(ctx context.Context) ([]CategoryInfo, error)
	Update(ctx context.Context, id uuid.UUID, authorID uuid.UUID, req UpdateCustomNodeRequest) (*entity.CustomNode, error)
	Delete(ctx context.Context, id uuid.UUID, authorID uuid.UUID) error
	Submit(ctx context.Context, id uuid.UUID, authorID uuid.UUID) (*entity.CustomNode, error)

	// 版本管理
	CreateVersion(ctx context.Context, nodeID uuid.UUID, authorID uuid.UUID, req CreateVersionRequest) (*entity.CustomNodeVersion, error)
	GetVersion(ctx context.Context, versionID uuid.UUID) (*entity.CustomNodeVersion, error)
	ListVersions(ctx context.Context, nodeID uuid.UUID) ([]entity.CustomNodeVersion, error)
	PublishVersion(ctx context.Context, nodeID uuid.UUID, versionID uuid.UUID, authorID uuid.UUID) (*entity.CustomNodeVersion, error)

	// 安装管理
	Install(ctx context.Context, nodeID uuid.UUID, userID uuid.UUID, versionID *uuid.UUID) (*entity.CustomNodeInstall, error)
	Uninstall(ctx context.Context, nodeID uuid.UUID, userID uuid.UUID) error
	GetInstall(ctx context.Context, nodeID uuid.UUID, userID uuid.UUID) (*entity.CustomNodeInstall, error)
	ListUserInstalls(ctx context.Context, userID uuid.UUID) ([]entity.CustomNodeInstall, error)
	UpdateInstall(ctx context.Context, nodeID uuid.UUID, userID uuid.UUID, versionID uuid.UUID) (*entity.CustomNodeInstall, error)

	// 收藏管理
	Star(ctx context.Context, nodeID uuid.UUID, userID uuid.UUID) error
	Unstar(ctx context.Context, nodeID uuid.UUID, userID uuid.UUID) error
	IsStarred(ctx context.Context, nodeID uuid.UUID, userID uuid.UUID) (bool, error)
	ListUserStars(ctx context.Context, userID uuid.UUID) ([]entity.CustomNode, error)

	// 评价管理
	CreateReview(ctx context.Context, nodeID uuid.UUID, userID uuid.UUID, req CreateNodeReviewRequest) (*entity.CustomNodeReview, error)
	ListReviews(ctx context.Context, nodeID uuid.UUID, page, pageSize int) ([]entity.CustomNodeReview, int64, error)
	ReplyToReview(ctx context.Context, reviewID uuid.UUID, authorID uuid.UUID, reply string) (*entity.CustomNodeReview, error)

	// 下载
	Download(ctx context.Context, nodeID uuid.UUID, versionID *uuid.UUID, userID *uuid.UUID, ipAddress, userAgent string) (*entity.CustomNodeVersion, error)

	// 审核（管理员）
	Approve(ctx context.Context, nodeID uuid.UUID, reviewerUserID uuid.UUID) (*entity.CustomNode, error)
	Reject(ctx context.Context, nodeID uuid.UUID, reviewerUserID uuid.UUID, reason string) (*entity.CustomNode, error)

	// 获取审核队列
	GetReviewQueue(ctx context.Context, nodeID uuid.UUID) (*entity.ReviewQueue, error)
	GetReviewHistory(ctx context.Context, nodeID uuid.UUID) ([]entity.ReviewRecord, error)
}

// CategoryInfo 分类信息
type CategoryInfo struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
	Count       int    `json:"count"`
}

// CreateCustomNodeRequest 创建自定义节点请求
type CreateCustomNodeRequest struct {
	Name             string                       `json:"name" validate:"required,max=100"`
	Slug             string                       `json:"slug"`
	DisplayName      string                       `json:"display_name" validate:"required,max=200"`
	Description      string                       `json:"description" validate:"required"`
	LongDescription  *string                      `json:"long_description"`
	Icon             string                       `json:"icon"`
	IconURL          *string                      `json:"icon_url"`
	Category         entity.CustomNodeCategory    `json:"category" validate:"required"`
	Tags             []string                     `json:"tags"`
	PricingType      entity.CustomNodePricingType `json:"pricing_type"`
	Price            float64                      `json:"price"`
	RepositoryURL    *string                      `json:"repository_url"`
	HomepageURL      *string                      `json:"homepage_url"`
	DocumentationURL *string                      `json:"documentation_url"`
}

// UpdateCustomNodeRequest 更新自定义节点请求
type UpdateCustomNodeRequest struct {
	DisplayName      *string                       `json:"display_name"`
	Description      *string                       `json:"description"`
	LongDescription  *string                       `json:"long_description"`
	Icon             *string                       `json:"icon"`
	IconURL          *string                       `json:"icon_url"`
	CoverImage       *string                       `json:"cover_image"`
	Screenshots      []string                      `json:"screenshots"`
	DemoVideo        *string                       `json:"demo_video"`
	Category         *entity.CustomNodeCategory    `json:"category"`
	Tags             []string                      `json:"tags"`
	PricingType      *entity.CustomNodePricingType `json:"pricing_type"`
	Price            *float64                      `json:"price"`
	RepositoryURL    *string                       `json:"repository_url"`
	HomepageURL      *string                       `json:"homepage_url"`
	DocumentationURL *string                       `json:"documentation_url"`
}

// CreateVersionRequest 创建版本请求
type CreateVersionRequest struct {
	Version          string      `json:"version" validate:"required"`
	Changelog        *string     `json:"changelog"`
	PackageURL       string      `json:"package_url" validate:"required"`
	PackageSize      int64       `json:"package_size"`
	PackageHash      *string     `json:"package_hash"`
	Definition       entity.JSON `json:"definition" validate:"required"`
	InputsSchema     entity.JSON `json:"inputs_schema" validate:"required"`
	OutputsSchema    entity.JSON `json:"outputs_schema" validate:"required"`
	Dependencies     entity.JSON `json:"dependencies"`
	PeerDependencies entity.JSON `json:"peer_dependencies"`
	MinSDKVersion    string      `json:"min_sdk_version"`
	IsPrerelease     bool        `json:"is_prerelease"`
}

// CreateNodeReviewRequest 创建节点评价请求
type CreateNodeReviewRequest struct {
	Rating  int     `json:"rating" validate:"required,min=1,max=5"`
	Title   *string `json:"title"`
	Content *string `json:"content"`
}

type customNodeService struct {
	nodeRepo        repository.CustomNodeRepository
	reviewQueueRepo repository.ReviewQueueRepository
}

// NewCustomNodeService 创建自定义节点服务实例
func NewCustomNodeService(nodeRepo repository.CustomNodeRepository, reviewQueueRepo repository.ReviewQueueRepository) CustomNodeService {
	return &customNodeService{
		nodeRepo:        nodeRepo,
		reviewQueueRepo: reviewQueueRepo,
	}
}

// ========== 节点管理 ==========

func (s *customNodeService) Create(ctx context.Context, authorID uuid.UUID, req CreateCustomNodeRequest) (*entity.CustomNode, error) {
	// 生成 slug
	slug := req.Slug
	if slug == "" {
		slug = s.generateSlug(req.Name)
	}

	// 检查 slug 是否已存在
	existing, _ := s.nodeRepo.GetBySlug(ctx, slug)
	if existing != nil {
		return nil, ErrCustomNodeSlugExists
	}

	node := &entity.CustomNode{
		AuthorID:         authorID,
		Name:             req.Name,
		Slug:             slug,
		DisplayName:      req.DisplayName,
		Description:      req.Description,
		LongDescription:  req.LongDescription,
		Icon:             req.Icon,
		IconURL:          req.IconURL,
		Category:         req.Category,
		Tags:             req.Tags,
		PricingType:      req.PricingType,
		Price:            req.Price,
		RepositoryURL:    req.RepositoryURL,
		HomepageURL:      req.HomepageURL,
		DocumentationURL: req.DocumentationURL,
		Status:           entity.CustomNodeStatusDraft,
		Currency:         "CNY",
	}

	if node.Icon == "" {
		node.Icon = "puzzle"
	}
	if node.PricingType == "" {
		node.PricingType = entity.CustomNodePricingFree
	}

	if err := s.nodeRepo.Create(ctx, node); err != nil {
		return nil, err
	}

	return node, nil
}

func (s *customNodeService) GetByID(ctx context.Context, id uuid.UUID) (*entity.CustomNode, error) {
	node, err := s.nodeRepo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrCustomNodeNotFound
	}
	return node, nil
}

func (s *customNodeService) GetBySlug(ctx context.Context, slug string) (*entity.CustomNode, error) {
	node, err := s.nodeRepo.GetBySlug(ctx, slug)
	if err != nil {
		return nil, ErrCustomNodeNotFound
	}
	return node, nil
}

func (s *customNodeService) List(ctx context.Context, params repository.CustomNodeListParams) ([]entity.CustomNode, int64, error) {
	return s.nodeRepo.List(ctx, params)
}

func (s *customNodeService) GetFeatured(ctx context.Context, limit int) ([]entity.CustomNode, error) {
	if limit <= 0 {
		limit = 8
	}
	return s.nodeRepo.GetFeatured(ctx, limit)
}

func (s *customNodeService) GetCategories(ctx context.Context) ([]CategoryInfo, error) {
	counts, err := s.nodeRepo.CountByCategory(ctx)
	if err != nil {
		counts = make(map[string]int)
	}

	categories := entity.GetCustomNodeCategories()
	result := make([]CategoryInfo, len(categories))

	for i, cat := range categories {
		result[i] = CategoryInfo{
			ID:          cat.ID,
			Name:        cat.Name,
			Description: cat.Description,
			Icon:        cat.Icon,
			Count:       counts[cat.ID],
		}
	}

	return result, nil
}

func (s *customNodeService) Update(ctx context.Context, id uuid.UUID, authorID uuid.UUID, req UpdateCustomNodeRequest) (*entity.CustomNode, error) {
	node, err := s.nodeRepo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrCustomNodeNotFound
	}

	// 验证权限
	if node.AuthorID != authorID {
		return nil, ErrUnauthorized
	}

	// 更新字段
	if req.DisplayName != nil {
		node.DisplayName = *req.DisplayName
	}
	if req.Description != nil {
		node.Description = *req.Description
	}
	if req.LongDescription != nil {
		node.LongDescription = req.LongDescription
	}
	if req.Icon != nil {
		node.Icon = *req.Icon
	}
	if req.IconURL != nil {
		node.IconURL = req.IconURL
	}
	if req.CoverImage != nil {
		node.CoverImage = req.CoverImage
	}
	if req.Screenshots != nil {
		node.Screenshots = req.Screenshots
	}
	if req.DemoVideo != nil {
		node.DemoVideo = req.DemoVideo
	}
	if req.Category != nil {
		node.Category = *req.Category
	}
	if req.Tags != nil {
		node.Tags = req.Tags
	}
	if req.PricingType != nil {
		node.PricingType = *req.PricingType
	}
	if req.Price != nil {
		node.Price = *req.Price
	}
	if req.RepositoryURL != nil {
		node.RepositoryURL = req.RepositoryURL
	}
	if req.HomepageURL != nil {
		node.HomepageURL = req.HomepageURL
	}
	if req.DocumentationURL != nil {
		node.DocumentationURL = req.DocumentationURL
	}

	if err := s.nodeRepo.Update(ctx, node); err != nil {
		return nil, err
	}

	return node, nil
}

func (s *customNodeService) Delete(ctx context.Context, id uuid.UUID, authorID uuid.UUID) error {
	node, err := s.nodeRepo.GetByID(ctx, id)
	if err != nil {
		return ErrCustomNodeNotFound
	}

	if node.AuthorID != authorID {
		return ErrUnauthorized
	}

	return s.nodeRepo.Delete(ctx, id)
}

func (s *customNodeService) Submit(ctx context.Context, id uuid.UUID, authorID uuid.UUID) (*entity.CustomNode, error) {
	node, err := s.nodeRepo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrCustomNodeNotFound
	}

	if node.AuthorID != authorID {
		return nil, ErrUnauthorized
	}

	// 检查是否有版本
	if node.LatestVersionID == nil {
		return nil, errors.New("at least one version is required before submitting")
	}

	// 检查是否已有待审核的队列
	existingQueue, _ := s.reviewQueueRepo.GetByItemID(ctx, entity.ReviewItemTypeCustomNode, id)
	if existingQueue != nil && (existingQueue.Status == entity.ReviewStatusPending || existingQueue.Status == entity.ReviewStatusInReview) {
		return nil, errors.New("node is already pending review")
	}

	// 获取最新版本作为快照
	latestVersion, err := s.nodeRepo.GetVersionByID(ctx, *node.LatestVersionID)
	if err != nil {
		return nil, errors.New("failed to get latest version")
	}

	// 创建快照数据
	snapshot := map[string]interface{}{
		"node":    node,
		"version": latestVersion,
	}
	snapshotData := entity.JSON(snapshot)

	// 创建审核队列
	reviewQueue := &entity.ReviewQueue{
		ItemType:    entity.ReviewItemTypeCustomNode,
		ItemID:      id,
		SubmitterID: authorID,
		Status:      entity.ReviewStatusPending,
		Priority:    entity.ReviewPriorityNormal,
		Title:       node.DisplayName,
		Description: &node.Description,
		Snapshot:    snapshotData,
	}

	if err := s.reviewQueueRepo.Create(ctx, reviewQueue); err != nil {
		return nil, errors.New("failed to create review queue")
	}

	// 更新节点状态
	node.Status = entity.CustomNodeStatusPending
	if err := s.nodeRepo.Update(ctx, node); err != nil {
		return nil, err
	}

	return node, nil
}

// ========== 版本管理 ==========

func (s *customNodeService) CreateVersion(ctx context.Context, nodeID uuid.UUID, authorID uuid.UUID, req CreateVersionRequest) (*entity.CustomNodeVersion, error) {
	node, err := s.nodeRepo.GetByID(ctx, nodeID)
	if err != nil {
		return nil, ErrCustomNodeNotFound
	}

	if node.AuthorID != authorID {
		return nil, ErrUnauthorized
	}

	// 解析版本号计算 version_code
	versionCode := s.parseVersionCode(req.Version)

	version := &entity.CustomNodeVersion{
		NodeID:           nodeID,
		Version:          req.Version,
		VersionCode:      versionCode,
		Changelog:        req.Changelog,
		PackageURL:       req.PackageURL,
		PackageSize:      req.PackageSize,
		PackageHash:      req.PackageHash,
		Definition:       req.Definition,
		InputsSchema:     req.InputsSchema,
		OutputsSchema:    req.OutputsSchema,
		Dependencies:     req.Dependencies,
		PeerDependencies: req.PeerDependencies,
		MinSDKVersion:    req.MinSDKVersion,
		IsPrerelease:     req.IsPrerelease,
	}

	if version.MinSDKVersion == "" {
		version.MinSDKVersion = "0.1.0"
	}

	if err := s.nodeRepo.CreateVersion(ctx, version); err != nil {
		return nil, err
	}

	// 如果是第一个版本或非预发布版本，设置为最新
	if node.LatestVersionID == nil || !req.IsPrerelease {
		if err := s.nodeRepo.SetLatestVersion(ctx, nodeID, version.ID); err != nil {
			return nil, err
		}
	}

	return version, nil
}

func (s *customNodeService) GetVersion(ctx context.Context, versionID uuid.UUID) (*entity.CustomNodeVersion, error) {
	version, err := s.nodeRepo.GetVersionByID(ctx, versionID)
	if err != nil {
		return nil, ErrVersionNotFound
	}
	return version, nil
}

func (s *customNodeService) ListVersions(ctx context.Context, nodeID uuid.UUID) ([]entity.CustomNodeVersion, error) {
	return s.nodeRepo.ListVersions(ctx, nodeID)
}

func (s *customNodeService) PublishVersion(ctx context.Context, nodeID uuid.UUID, versionID uuid.UUID, authorID uuid.UUID) (*entity.CustomNodeVersion, error) {
	node, err := s.nodeRepo.GetByID(ctx, nodeID)
	if err != nil {
		return nil, ErrCustomNodeNotFound
	}

	if node.AuthorID != authorID {
		return nil, ErrUnauthorized
	}

	version, err := s.nodeRepo.GetVersionByID(ctx, versionID)
	if err != nil {
		return nil, ErrVersionNotFound
	}

	now := time.Now()
	version.PublishedAt = &now

	if err := s.nodeRepo.SetLatestVersion(ctx, nodeID, versionID); err != nil {
		return nil, err
	}

	return version, nil
}

// ========== 安装管理 ==========

func (s *customNodeService) Install(ctx context.Context, nodeID uuid.UUID, userID uuid.UUID, versionID *uuid.UUID) (*entity.CustomNodeInstall, error) {
	node, err := s.nodeRepo.GetByID(ctx, nodeID)
	if err != nil {
		return nil, ErrCustomNodeNotFound
	}

	if node.Status != entity.CustomNodeStatusPublished {
		return nil, ErrNodeNotPublished
	}

	// 检查是否已安装
	installed, _ := s.nodeRepo.IsInstalled(ctx, nodeID, userID)
	if installed {
		return nil, ErrAlreadyInstalled
	}

	// 获取版本信息
	var version *entity.CustomNodeVersion
	if versionID != nil {
		version, err = s.nodeRepo.GetVersionByID(ctx, *versionID)
	} else {
		version, err = s.nodeRepo.GetLatestVersion(ctx, nodeID)
	}
	if err != nil {
		return nil, ErrVersionNotFound
	}

	install := &entity.CustomNodeInstall{
		NodeID:           nodeID,
		VersionID:        version.ID,
		UserID:           userID,
		InstalledVersion: version.Version,
		IsActive:         true,
	}

	if err := s.nodeRepo.Install(ctx, install); err != nil {
		return nil, err
	}

	return install, nil
}

func (s *customNodeService) Uninstall(ctx context.Context, nodeID uuid.UUID, userID uuid.UUID) error {
	installed, _ := s.nodeRepo.IsInstalled(ctx, nodeID, userID)
	if !installed {
		return ErrNotInstalled
	}

	return s.nodeRepo.Uninstall(ctx, nodeID, userID)
}

func (s *customNodeService) GetInstall(ctx context.Context, nodeID uuid.UUID, userID uuid.UUID) (*entity.CustomNodeInstall, error) {
	return s.nodeRepo.GetInstall(ctx, nodeID, userID)
}

func (s *customNodeService) ListUserInstalls(ctx context.Context, userID uuid.UUID) ([]entity.CustomNodeInstall, error) {
	return s.nodeRepo.ListUserInstalls(ctx, userID)
}

func (s *customNodeService) UpdateInstall(ctx context.Context, nodeID uuid.UUID, userID uuid.UUID, versionID uuid.UUID) (*entity.CustomNodeInstall, error) {
	install, err := s.nodeRepo.GetInstall(ctx, nodeID, userID)
	if err != nil {
		return nil, ErrNotInstalled
	}

	version, err := s.nodeRepo.GetVersionByID(ctx, versionID)
	if err != nil {
		return nil, ErrVersionNotFound
	}

	install.VersionID = versionID
	install.InstalledVersion = version.Version

	if err := s.nodeRepo.UpdateInstall(ctx, install); err != nil {
		return nil, err
	}

	return install, nil
}

// ========== 收藏管理 ==========

func (s *customNodeService) Star(ctx context.Context, nodeID uuid.UUID, userID uuid.UUID) error {
	_, err := s.nodeRepo.GetByID(ctx, nodeID)
	if err != nil {
		return ErrCustomNodeNotFound
	}

	starred, _ := s.nodeRepo.IsStarred(ctx, nodeID, userID)
	if starred {
		return ErrAlreadyStarred
	}

	return s.nodeRepo.Star(ctx, nodeID, userID)
}

func (s *customNodeService) Unstar(ctx context.Context, nodeID uuid.UUID, userID uuid.UUID) error {
	starred, _ := s.nodeRepo.IsStarred(ctx, nodeID, userID)
	if !starred {
		return ErrNotStarred
	}

	return s.nodeRepo.Unstar(ctx, nodeID, userID)
}

func (s *customNodeService) IsStarred(ctx context.Context, nodeID uuid.UUID, userID uuid.UUID) (bool, error) {
	return s.nodeRepo.IsStarred(ctx, nodeID, userID)
}

func (s *customNodeService) ListUserStars(ctx context.Context, userID uuid.UUID) ([]entity.CustomNode, error) {
	return s.nodeRepo.ListUserStars(ctx, userID)
}

// ========== 评价管理 ==========

func (s *customNodeService) CreateReview(ctx context.Context, nodeID uuid.UUID, userID uuid.UUID, req CreateNodeReviewRequest) (*entity.CustomNodeReview, error) {
	node, err := s.nodeRepo.GetByID(ctx, nodeID)
	if err != nil {
		return nil, ErrCustomNodeNotFound
	}

	// 不能评价自己的节点
	if node.AuthorID == userID {
		return nil, ErrCannotReviewOwnNode
	}

	// 验证评分
	if req.Rating < 1 || req.Rating > 5 {
		return nil, ErrInvalidRating
	}

	// 检查是否已评价
	existing, _ := s.nodeRepo.GetReview(ctx, nodeID, userID)
	if existing != nil {
		return nil, ErrAlreadyReviewed
	}

	// 获取用户安装的版本
	install, _ := s.nodeRepo.GetInstall(ctx, nodeID, userID)
	var reviewedVersion *string
	if install != nil {
		reviewedVersion = &install.InstalledVersion
	}

	review := &entity.CustomNodeReview{
		NodeID:          nodeID,
		UserID:          userID,
		Rating:          req.Rating,
		Title:           req.Title,
		Content:         req.Content,
		ReviewedVersion: reviewedVersion,
	}

	if err := s.nodeRepo.CreateReview(ctx, review); err != nil {
		return nil, err
	}

	return review, nil
}

func (s *customNodeService) ListReviews(ctx context.Context, nodeID uuid.UUID, page, pageSize int) ([]entity.CustomNodeReview, int64, error) {
	return s.nodeRepo.ListReviews(ctx, nodeID, page, pageSize)
}

func (s *customNodeService) ReplyToReview(ctx context.Context, reviewID uuid.UUID, authorID uuid.UUID, reply string) (*entity.CustomNodeReview, error) {
	// 这里简化处理，实际需要验证 authorID 是节点作者
	// TODO: 获取 review 并验证权限

	return nil, errors.New("not implemented")
}

// ========== 下载 ==========

func (s *customNodeService) Download(ctx context.Context, nodeID uuid.UUID, versionID *uuid.UUID, userID *uuid.UUID, ipAddress, userAgent string) (*entity.CustomNodeVersion, error) {
	node, err := s.nodeRepo.GetByID(ctx, nodeID)
	if err != nil {
		return nil, ErrCustomNodeNotFound
	}

	if node.Status != entity.CustomNodeStatusPublished {
		return nil, ErrNodeNotPublished
	}

	// 获取版本
	var version *entity.CustomNodeVersion
	if versionID != nil {
		version, err = s.nodeRepo.GetVersionByID(ctx, *versionID)
	} else {
		version, err = s.nodeRepo.GetLatestVersion(ctx, nodeID)
	}
	if err != nil {
		return nil, ErrVersionNotFound
	}

	// 记录下载
	download := &entity.CustomNodeDownload{
		NodeID:    nodeID,
		VersionID: version.ID,
		UserID:    userID,
		IPAddress: &ipAddress,
		UserAgent: &userAgent,
	}
	_ = s.nodeRepo.RecordDownload(ctx, download)

	return version, nil
}

// ========== 审核 ==========

func (s *customNodeService) Approve(ctx context.Context, nodeID uuid.UUID, reviewerUserID uuid.UUID) (*entity.CustomNode, error) {
	node, err := s.nodeRepo.GetByID(ctx, nodeID)
	if err != nil {
		return nil, ErrCustomNodeNotFound
	}

	// 获取审核队列记录
	queue, err := s.reviewQueueRepo.GetByItemID(ctx, entity.ReviewItemTypeCustomNode, nodeID)
	if err != nil {
		return nil, errors.New("review queue not found")
	}

	// 获取审核员
	reviewer, err := s.reviewQueueRepo.GetReviewer(ctx, reviewerUserID)
	if err != nil {
		return nil, errors.New("reviewer not found")
	}

	// 更新审核队列状态
	if err := s.reviewQueueRepo.Approve(ctx, queue.ID, reviewer.ID, "审核通过"); err != nil {
		return nil, err
	}

	// 创建审核记录
	record := &entity.ReviewRecord{
		QueueID:    queue.ID,
		ReviewerID: reviewer.ID,
		Action:     "approve",
		FromStatus: &queue.Status,
		ToStatus:   entity.ReviewStatusApproved,
		Comment:    stringPtr("审核通过"),
	}
	_ = s.reviewQueueRepo.CreateRecord(ctx, record)

	// 更新审核员统计
	reviewer.TotalReviews++
	reviewer.ApprovedCount++
	_ = s.reviewQueueRepo.UpdateReviewer(ctx, reviewer)

	// 更新节点状态
	now := time.Now()
	node.Status = entity.CustomNodeStatusPublished
	node.PublishedAt = &now

	if err := s.nodeRepo.Update(ctx, node); err != nil {
		return nil, err
	}

	return node, nil
}

func (s *customNodeService) Reject(ctx context.Context, nodeID uuid.UUID, reviewerUserID uuid.UUID, reason string) (*entity.CustomNode, error) {
	node, err := s.nodeRepo.GetByID(ctx, nodeID)
	if err != nil {
		return nil, ErrCustomNodeNotFound
	}

	// 获取审核队列记录
	queue, err := s.reviewQueueRepo.GetByItemID(ctx, entity.ReviewItemTypeCustomNode, nodeID)
	if err != nil {
		return nil, errors.New("review queue not found")
	}

	// 获取审核员
	reviewer, err := s.reviewQueueRepo.GetReviewer(ctx, reviewerUserID)
	if err != nil {
		return nil, errors.New("reviewer not found")
	}

	// 更新审核队列状态
	if err := s.reviewQueueRepo.Reject(ctx, queue.ID, reviewer.ID, reason); err != nil {
		return nil, err
	}

	// 创建审核记录
	record := &entity.ReviewRecord{
		QueueID:    queue.ID,
		ReviewerID: reviewer.ID,
		Action:     "reject",
		FromStatus: &queue.Status,
		ToStatus:   entity.ReviewStatusRejected,
		Comment:    &reason,
	}
	_ = s.reviewQueueRepo.CreateRecord(ctx, record)

	// 更新审核员统计
	reviewer.TotalReviews++
	reviewer.RejectedCount++
	_ = s.reviewQueueRepo.UpdateReviewer(ctx, reviewer)

	// 更新节点状态
	node.Status = entity.CustomNodeStatusRejected

	if err := s.nodeRepo.Update(ctx, node); err != nil {
		return nil, err
	}

	return node, nil
}

// stringPtr 返回字符串指针
func stringPtr(s string) *string {
	return &s
}

// GetReviewQueue 获取审核队列
func (s *customNodeService) GetReviewQueue(ctx context.Context, nodeID uuid.UUID) (*entity.ReviewQueue, error) {
	return s.reviewQueueRepo.GetByItemID(ctx, entity.ReviewItemTypeCustomNode, nodeID)
}

// GetReviewHistory 获取审核历史
func (s *customNodeService) GetReviewHistory(ctx context.Context, nodeID uuid.UUID) ([]entity.ReviewRecord, error) {
	queue, err := s.reviewQueueRepo.GetByItemID(ctx, entity.ReviewItemTypeCustomNode, nodeID)
	if err != nil {
		return nil, err
	}
	return s.reviewQueueRepo.ListRecords(ctx, queue.ID)
}

// ========== 辅助方法 ==========

// generateSlug 生成 URL 友好的 slug
func (s *customNodeService) generateSlug(name string) string {
	slug := strings.ToLower(name)
	slug = strings.ReplaceAll(slug, " ", "-")
	reg := regexp.MustCompile("[^a-z0-9-]")
	slug = reg.ReplaceAllString(slug, "")
	reg = regexp.MustCompile("-+")
	slug = reg.ReplaceAllString(slug, "-")
	slug = strings.Trim(slug, "-")
	return slug
}

// parseVersionCode 解析版本号为整数
func (s *customNodeService) parseVersionCode(version string) int {
	// 简单实现: 1.2.3 -> 10203
	parts := strings.Split(version, ".")
	code := 0
	multiplier := 10000

	for _, part := range parts {
		num := 0
		for _, c := range part {
			if c >= '0' && c <= '9' {
				num = num*10 + int(c-'0')
			} else {
				break
			}
		}
		code += num * multiplier
		multiplier /= 100
	}

	return code
}
