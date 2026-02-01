package handler

import (
	"net/http"
	"strconv"

	"github.com/agentflow/server/internal/api/middleware"
	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/repository"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// CustomNodeHandler 自定义节点处理器
type CustomNodeHandler struct {
	nodeService service.CustomNodeService
}

// NewCustomNodeHandler 创建自定义节点处理器
func NewCustomNodeHandler(nodeService service.CustomNodeService) *CustomNodeHandler {
	return &CustomNodeHandler{nodeService: nodeService}
}

// ========== 请求/响应结构 ==========

type CreateCustomNodeRequest struct {
	Name             string   `json:"name" validate:"required,max=100"`
	Slug             string   `json:"slug"`
	DisplayName      string   `json:"display_name" validate:"required,max=200"`
	Description      string   `json:"description" validate:"required"`
	LongDescription  *string  `json:"long_description"`
	Icon             string   `json:"icon"`
	IconURL          *string  `json:"icon_url"`
	Category         string   `json:"category" validate:"required"`
	Tags             []string `json:"tags"`
	PricingType      string   `json:"pricing_type"`
	Price            float64  `json:"price"`
	RepositoryURL    *string  `json:"repository_url"`
	HomepageURL      *string  `json:"homepage_url"`
	DocumentationURL *string  `json:"documentation_url"`
}

type UpdateCustomNodeRequest struct {
	DisplayName      *string  `json:"display_name"`
	Description      *string  `json:"description"`
	LongDescription  *string  `json:"long_description"`
	Icon             *string  `json:"icon"`
	IconURL          *string  `json:"icon_url"`
	CoverImage       *string  `json:"cover_image"`
	Screenshots      []string `json:"screenshots"`
	DemoVideo        *string  `json:"demo_video"`
	Category         *string  `json:"category"`
	Tags             []string `json:"tags"`
	PricingType      *string  `json:"pricing_type"`
	Price            *float64 `json:"price"`
	RepositoryURL    *string  `json:"repository_url"`
	HomepageURL      *string  `json:"homepage_url"`
	DocumentationURL *string  `json:"documentation_url"`
}

type CreateVersionRequest struct {
	Version          string                 `json:"version" validate:"required"`
	Changelog        *string                `json:"changelog"`
	PackageURL       string                 `json:"package_url" validate:"required"`
	PackageSize      int64                  `json:"package_size"`
	PackageHash      *string                `json:"package_hash"`
	Definition       map[string]interface{} `json:"definition" validate:"required"`
	InputsSchema     map[string]interface{} `json:"inputs_schema" validate:"required"`
	OutputsSchema    map[string]interface{} `json:"outputs_schema" validate:"required"`
	Dependencies     map[string]interface{} `json:"dependencies"`
	PeerDependencies map[string]interface{} `json:"peer_dependencies"`
	MinSDKVersion    string                 `json:"min_sdk_version"`
	IsPrerelease     bool                   `json:"is_prerelease"`
}

type InstallNodeRequest struct {
	VersionID string `json:"version_id"`
}

type CreateNodeReviewRequest struct {
	Rating  int     `json:"rating" validate:"required,min=1,max=5"`
	Title   *string `json:"title"`
	Content *string `json:"content"`
}

// ========== 节点列表和详情 ==========

// List 获取节点列表
func (h *CustomNodeHandler) List(c echo.Context) error {
	page, _ := strconv.Atoi(c.QueryParam("page"))
	pageSize, _ := strconv.Atoi(c.QueryParam("page_size"))
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}

	var featured *bool
	if featuredStr := c.QueryParam("featured"); featuredStr != "" {
		f := featuredStr == "true"
		featured = &f
	}

	params := repository.CustomNodeListParams{
		Category:    c.QueryParam("category"),
		Status:      c.QueryParam("status"),
		PricingType: c.QueryParam("pricing_type"),
		Search:      c.QueryParam("search"),
		Featured:    featured,
		Page:        page,
		PageSize:    pageSize,
		Sort:        c.QueryParam("sort"),
	}

	// 如果指定了 author_id，可以查看自己的所有节点
	if authorIDStr := c.QueryParam("author_id"); authorIDStr != "" {
		authorID, err := uuid.Parse(authorIDStr)
		if err == nil {
			params.AuthorID = &authorID
		}
	}

	nodes, total, err := h.nodeService.List(c.Request().Context(), params)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取节点列表失败")
	}

	return successResponseWithMeta(c, map[string]interface{}{
		"nodes": nodes,
	}, map[string]interface{}{
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// Featured 获取精选节点
func (h *CustomNodeHandler) Featured(c echo.Context) error {
	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	if limit <= 0 {
		limit = 8
	}

	nodes, err := h.nodeService.GetFeatured(c.Request().Context(), limit)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "GET_FEATURED_FAILED", "获取精选节点失败")
	}

	return successResponse(c, map[string]interface{}{
		"nodes": nodes,
	})
}

// Categories 获取节点分类
func (h *CustomNodeHandler) Categories(c echo.Context) error {
	categories, err := h.nodeService.GetCategories(c.Request().Context())
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "GET_CATEGORIES_FAILED", "获取分类失败")
	}

	return successResponse(c, map[string]interface{}{
		"categories": categories,
	})
}

// Get 获取节点详情
func (h *CustomNodeHandler) Get(c echo.Context) error {
	idOrSlug := c.Param("id")

	var node *entity.CustomNode
	var err error

	if id, parseErr := uuid.Parse(idOrSlug); parseErr == nil {
		node, err = h.nodeService.GetByID(c.Request().Context(), id)
	} else {
		node, err = h.nodeService.GetBySlug(c.Request().Context(), idOrSlug)
	}

	if err != nil {
		return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "节点不存在")
	}

	// 检查用户是否已安装/收藏
	var isInstalled, isStarred bool
	userID := middleware.GetUserID(c)
	if userID != "" {
		uid, _ := uuid.Parse(userID)
		isInstalled, _ = h.nodeService.IsStarred(c.Request().Context(), node.ID, uid)
		isStarred, _ = h.nodeService.IsStarred(c.Request().Context(), node.ID, uid)
	}

	return successResponse(c, map[string]interface{}{
		"node":         node,
		"is_installed": isInstalled,
		"is_starred":   isStarred,
	})
}

// ========== 节点 CRUD ==========

// Create 创建节点
func (h *CustomNodeHandler) Create(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var req CreateCustomNodeRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	if req.Name == "" || req.DisplayName == "" || req.Description == "" {
		return errorResponse(c, http.StatusBadRequest, "REQUIRED_FIELDS", "缺少必填字段")
	}

	node, err := h.nodeService.Create(c.Request().Context(), uid, service.CreateCustomNodeRequest{
		Name:             req.Name,
		Slug:             req.Slug,
		DisplayName:      req.DisplayName,
		Description:      req.Description,
		LongDescription:  req.LongDescription,
		Icon:             req.Icon,
		IconURL:          req.IconURL,
		Category:         entity.CustomNodeCategory(req.Category),
		Tags:             req.Tags,
		PricingType:      entity.CustomNodePricingType(req.PricingType),
		Price:            req.Price,
		RepositoryURL:    req.RepositoryURL,
		HomepageURL:      req.HomepageURL,
		DocumentationURL: req.DocumentationURL,
	})
	if err != nil {
		switch err {
		case service.ErrCustomNodeSlugExists:
			return errorResponse(c, http.StatusConflict, "SLUG_EXISTS", "节点标识已存在")
		default:
			return errorResponse(c, http.StatusInternalServerError, "CREATE_FAILED", "创建节点失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"node":    node,
		"message": "节点创建成功",
	})
}

// Update 更新节点
func (h *CustomNodeHandler) Update(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	nodeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "节点 ID 无效")
	}

	var req UpdateCustomNodeRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	var category *entity.CustomNodeCategory
	if req.Category != nil {
		cat := entity.CustomNodeCategory(*req.Category)
		category = &cat
	}

	var pricingType *entity.CustomNodePricingType
	if req.PricingType != nil {
		pt := entity.CustomNodePricingType(*req.PricingType)
		pricingType = &pt
	}

	node, err := h.nodeService.Update(c.Request().Context(), nodeID, uid, service.UpdateCustomNodeRequest{
		DisplayName:      req.DisplayName,
		Description:      req.Description,
		LongDescription:  req.LongDescription,
		Icon:             req.Icon,
		IconURL:          req.IconURL,
		CoverImage:       req.CoverImage,
		Screenshots:      req.Screenshots,
		DemoVideo:        req.DemoVideo,
		Category:         category,
		Tags:             req.Tags,
		PricingType:      pricingType,
		Price:            req.Price,
		RepositoryURL:    req.RepositoryURL,
		HomepageURL:      req.HomepageURL,
		DocumentationURL: req.DocumentationURL,
	})
	if err != nil {
		switch err {
		case service.ErrCustomNodeNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "节点不存在")
		case service.ErrUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权操作")
		default:
			return errorResponse(c, http.StatusInternalServerError, "UPDATE_FAILED", "更新节点失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"node":    node,
		"message": "节点更新成功",
	})
}

// Delete 删除节点
func (h *CustomNodeHandler) Delete(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	nodeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "节点 ID 无效")
	}

	if err := h.nodeService.Delete(c.Request().Context(), nodeID, uid); err != nil {
		switch err {
		case service.ErrCustomNodeNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "节点不存在")
		case service.ErrUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权操作")
		default:
			return errorResponse(c, http.StatusInternalServerError, "DELETE_FAILED", "删除节点失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"success": true,
		"message": "节点删除成功",
	})
}

// Submit 提交审核
func (h *CustomNodeHandler) Submit(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	nodeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "节点 ID 无效")
	}

	node, err := h.nodeService.Submit(c.Request().Context(), nodeID, uid)
	if err != nil {
		switch err {
		case service.ErrCustomNodeNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "节点不存在")
		case service.ErrUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权操作")
		default:
			return errorResponse(c, http.StatusInternalServerError, "SUBMIT_FAILED", err.Error())
		}
	}

	return successResponse(c, map[string]interface{}{
		"node":    node,
		"message": "已提交审核",
	})
}

// ========== 版本管理 ==========

// CreateVersion 创建版本
func (h *CustomNodeHandler) CreateVersion(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	nodeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "节点 ID 无效")
	}

	var req CreateVersionRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	version, err := h.nodeService.CreateVersion(c.Request().Context(), nodeID, uid, service.CreateVersionRequest{
		Version:          req.Version,
		Changelog:        req.Changelog,
		PackageURL:       req.PackageURL,
		PackageSize:      req.PackageSize,
		PackageHash:      req.PackageHash,
		Definition:       entity.JSON(req.Definition),
		InputsSchema:     entity.JSON(req.InputsSchema),
		OutputsSchema:    entity.JSON(req.OutputsSchema),
		Dependencies:     entity.JSON(req.Dependencies),
		PeerDependencies: entity.JSON(req.PeerDependencies),
		MinSDKVersion:    req.MinSDKVersion,
		IsPrerelease:     req.IsPrerelease,
	})
	if err != nil {
		switch err {
		case service.ErrCustomNodeNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "节点不存在")
		case service.ErrUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权操作")
		default:
			return errorResponse(c, http.StatusInternalServerError, "CREATE_VERSION_FAILED", "创建版本失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"version": version,
		"message": "版本创建成功",
	})
}

// ListVersions 获取版本列表
func (h *CustomNodeHandler) ListVersions(c echo.Context) error {
	nodeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "节点 ID 无效")
	}

	versions, err := h.nodeService.ListVersions(c.Request().Context(), nodeID)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "LIST_VERSIONS_FAILED", "获取版本列表失败")
	}

	return successResponse(c, map[string]interface{}{
		"versions": versions,
	})
}

// ========== 安装管理 ==========

// Install 安装节点
func (h *CustomNodeHandler) Install(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	nodeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "节点 ID 无效")
	}

	var req InstallNodeRequest
	c.Bind(&req) // 可选参数

	var versionID *uuid.UUID
	if req.VersionID != "" {
		vid, err := uuid.Parse(req.VersionID)
		if err == nil {
			versionID = &vid
		}
	}

	install, err := h.nodeService.Install(c.Request().Context(), nodeID, uid, versionID)
	if err != nil {
		switch err {
		case service.ErrCustomNodeNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "节点不存在")
		case service.ErrNodeNotPublished:
			return errorResponse(c, http.StatusBadRequest, "NOT_PUBLISHED", "节点未发布")
		case service.ErrAlreadyInstalled:
			return errorResponse(c, http.StatusConflict, "ALREADY_INSTALLED", "已安装")
		case service.ErrVersionNotFound:
			return errorResponse(c, http.StatusNotFound, "VERSION_NOT_FOUND", "版本不存在")
		default:
			return errorResponse(c, http.StatusInternalServerError, "INSTALL_FAILED", "安装失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"install": install,
		"message": "安装成功",
	})
}

// Uninstall 卸载节点
func (h *CustomNodeHandler) Uninstall(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	nodeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "节点 ID 无效")
	}

	if err := h.nodeService.Uninstall(c.Request().Context(), nodeID, uid); err != nil {
		switch err {
		case service.ErrNotInstalled:
			return errorResponse(c, http.StatusBadRequest, "NOT_INSTALLED", "未安装")
		default:
			return errorResponse(c, http.StatusInternalServerError, "UNINSTALL_FAILED", "卸载失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"success": true,
		"message": "卸载成功",
	})
}

// ListMyInstalls 获取我安装的节点
func (h *CustomNodeHandler) ListMyInstalls(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	installs, err := h.nodeService.ListUserInstalls(c.Request().Context(), uid)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取列表失败")
	}

	return successResponse(c, map[string]interface{}{
		"installs": installs,
	})
}

// ========== 收藏管理 ==========

// Star 收藏节点
func (h *CustomNodeHandler) Star(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	nodeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "节点 ID 无效")
	}

	if err := h.nodeService.Star(c.Request().Context(), nodeID, uid); err != nil {
		switch err {
		case service.ErrCustomNodeNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "节点不存在")
		case service.ErrAlreadyStarred:
			return errorResponse(c, http.StatusConflict, "ALREADY_STARRED", "已收藏")
		default:
			return errorResponse(c, http.StatusInternalServerError, "STAR_FAILED", "收藏失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"success": true,
		"message": "收藏成功",
	})
}

// Unstar 取消收藏
func (h *CustomNodeHandler) Unstar(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	nodeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "节点 ID 无效")
	}

	if err := h.nodeService.Unstar(c.Request().Context(), nodeID, uid); err != nil {
		switch err {
		case service.ErrNotStarred:
			return errorResponse(c, http.StatusBadRequest, "NOT_STARRED", "未收藏")
		default:
			return errorResponse(c, http.StatusInternalServerError, "UNSTAR_FAILED", "取消收藏失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"success": true,
		"message": "已取消收藏",
	})
}

// ListMyStars 获取我收藏的节点
func (h *CustomNodeHandler) ListMyStars(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	nodes, err := h.nodeService.ListUserStars(c.Request().Context(), uid)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取列表失败")
	}

	return successResponse(c, map[string]interface{}{
		"nodes": nodes,
	})
}

// ========== 评价管理 ==========

// CreateReview 创建评价
func (h *CustomNodeHandler) CreateReview(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	nodeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "节点 ID 无效")
	}

	var req CreateNodeReviewRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	review, err := h.nodeService.CreateReview(c.Request().Context(), nodeID, uid, service.CreateNodeReviewRequest{
		Rating:  req.Rating,
		Title:   req.Title,
		Content: req.Content,
	})
	if err != nil {
		switch err {
		case service.ErrCustomNodeNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "节点不存在")
		case service.ErrCannotReviewOwnNode:
			return errorResponse(c, http.StatusBadRequest, "CANNOT_REVIEW_OWN", "不能评价自己的节点")
		case service.ErrAlreadyReviewed:
			return errorResponse(c, http.StatusConflict, "ALREADY_REVIEWED", "已评价")
		case service.ErrInvalidRating:
			return errorResponse(c, http.StatusBadRequest, "INVALID_RATING", "评分必须在 1-5 之间")
		default:
			return errorResponse(c, http.StatusInternalServerError, "CREATE_REVIEW_FAILED", "创建评价失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"review":  review,
		"message": "评价成功",
	})
}

// ListReviews 获取评价列表
func (h *CustomNodeHandler) ListReviews(c echo.Context) error {
	nodeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "节点 ID 无效")
	}

	page, _ := strconv.Atoi(c.QueryParam("page"))
	pageSize, _ := strconv.Atoi(c.QueryParam("page_size"))
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}

	reviews, total, err := h.nodeService.ListReviews(c.Request().Context(), nodeID, page, pageSize)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "LIST_REVIEWS_FAILED", "获取评价列表失败")
	}

	return successResponseWithMeta(c, map[string]interface{}{
		"reviews": reviews,
	}, map[string]interface{}{
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// ========== 下载 ==========

// Download 下载节点
func (h *CustomNodeHandler) Download(c echo.Context) error {
	nodeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "节点 ID 无效")
	}

	var versionID *uuid.UUID
	if versionIDStr := c.QueryParam("version_id"); versionIDStr != "" {
		vid, err := uuid.Parse(versionIDStr)
		if err == nil {
			versionID = &vid
		}
	}

	var userID *uuid.UUID
	if uidStr := middleware.GetUserID(c); uidStr != "" {
		uid, err := uuid.Parse(uidStr)
		if err == nil {
			userID = &uid
		}
	}

	ipAddress := c.RealIP()
	userAgent := c.Request().UserAgent()

	version, err := h.nodeService.Download(c.Request().Context(), nodeID, versionID, userID, ipAddress, userAgent)
	if err != nil {
		switch err {
		case service.ErrCustomNodeNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "节点不存在")
		case service.ErrNodeNotPublished:
			return errorResponse(c, http.StatusBadRequest, "NOT_PUBLISHED", "节点未发布")
		case service.ErrVersionNotFound:
			return errorResponse(c, http.StatusNotFound, "VERSION_NOT_FOUND", "版本不存在")
		default:
			return errorResponse(c, http.StatusInternalServerError, "DOWNLOAD_FAILED", "下载失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"version":     version,
		"package_url": version.PackageURL,
	})
}

// ========== 审核（管理员） ==========

// Approve 审核通过
func (h *CustomNodeHandler) Approve(c echo.Context) error {
	nodeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "节点 ID 无效")
	}

	reviewerIDStr := middleware.GetUserID(c)
	reviewerID, err := uuid.Parse(reviewerIDStr)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "审核人 ID 无效")
	}

	node, err := h.nodeService.Approve(c.Request().Context(), nodeID, reviewerID)
	if err != nil {
		switch err {
		case service.ErrCustomNodeNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "节点不存在")
		default:
			return errorResponse(c, http.StatusInternalServerError, "APPROVE_FAILED", "审核失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"node":    node,
		"message": "审核通过",
	})
}

// Reject 审核拒绝
func (h *CustomNodeHandler) Reject(c echo.Context) error {
	nodeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "节点 ID 无效")
	}

	type RejectRequest struct {
		Reason string `json:"reason"`
	}
	var req RejectRequest
	c.Bind(&req)

	reviewerIDStr := middleware.GetUserID(c)
	reviewerID, err := uuid.Parse(reviewerIDStr)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "审核人 ID 无效")
	}

	node, err := h.nodeService.Reject(c.Request().Context(), nodeID, reviewerID, req.Reason)
	if err != nil {
		switch err {
		case service.ErrCustomNodeNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "节点不存在")
		default:
			return errorResponse(c, http.StatusInternalServerError, "REJECT_FAILED", "审核失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"node":    node,
		"message": "审核已拒绝",
	})
}
