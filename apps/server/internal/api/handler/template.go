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

type TemplateHandler struct {
	templateService service.TemplateService
}

func NewTemplateHandler(templateService service.TemplateService) *TemplateHandler {
	return &TemplateHandler{templateService: templateService}
}

type UseTemplateRequest struct {
	Name     *string `json:"name"`
	FolderID *string `json:"folder_id"`
}

type CreateTemplateRequest struct {
	Name            string                 `json:"name" validate:"required,max=200"`
	Slug            string                 `json:"slug"`
	Description     string                 `json:"description"`
	LongDescription string                 `json:"long_description"`
	Category        string                 `json:"category" validate:"required"`
	Tags            []string               `json:"tags"`
	Icon            string                 `json:"icon"`
	CoverImage      *string                `json:"cover_image"`
	Definition      map[string]interface{} `json:"definition" validate:"required"`
	Variables       map[string]interface{} `json:"variables"`
	InputSchema     map[string]interface{} `json:"input_schema"`
	Difficulty      string                 `json:"difficulty"`
	EstimatedTime   int                    `json:"estimated_time"`
	IsFeatured      bool                   `json:"is_featured"`
	IsOfficial      bool                   `json:"is_official"`
}

type UpdateTemplateRequest struct {
	Name            *string                `json:"name"`
	Description     *string                `json:"description"`
	LongDescription *string                `json:"long_description"`
	Category        *string                `json:"category"`
	Tags            []string               `json:"tags"`
	Icon            *string                `json:"icon"`
	CoverImage      *string                `json:"cover_image"`
	Definition      map[string]interface{} `json:"definition"`
	Variables       map[string]interface{} `json:"variables"`
	InputSchema     map[string]interface{} `json:"input_schema"`
	Difficulty      *string                `json:"difficulty"`
	EstimatedTime   *int                   `json:"estimated_time"`
	IsFeatured      *bool                  `json:"is_featured"`
	IsOfficial      *bool                  `json:"is_official"`
	IsPublished     *bool                  `json:"is_published"`
}

// List 获取模板列表
func (h *TemplateHandler) List(c echo.Context) error {
	page, _ := strconv.Atoi(c.QueryParam("page"))
	pageSize, _ := strconv.Atoi(c.QueryParam("page_size"))
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}

	// 处理 featured 参数
	var featured *bool
	if featuredStr := c.QueryParam("featured"); featuredStr != "" {
		f := featuredStr == "true"
		featured = &f
	}

	// 处理 official 参数
	var official *bool
	if officialStr := c.QueryParam("official"); officialStr != "" {
		o := officialStr == "true"
		official = &o
	}

	params := repository.TemplateListParams{
		Category:   c.QueryParam("category"),
		Search:     c.QueryParam("search"),
		Difficulty: c.QueryParam("difficulty"),
		Featured:   featured,
		Official:   official,
		Page:       page,
		PageSize:   pageSize,
		Sort:       c.QueryParam("sort"),
	}

	templates, total, err := h.templateService.List(c.Request().Context(), params)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取模板列表失败")
	}

	return successResponseWithMeta(c, map[string]interface{}{
		"templates": templates,
	}, map[string]interface{}{
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// Featured 获取精选模板
func (h *TemplateHandler) Featured(c echo.Context) error {
	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	if limit <= 0 {
		limit = 8
	}

	templates, err := h.templateService.GetFeatured(c.Request().Context(), limit)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "GET_FEATURED_FAILED", "获取精选模板失败")
	}

	return successResponse(c, map[string]interface{}{
		"templates": templates,
	})
}

// Categories 获取模板分类
func (h *TemplateHandler) Categories(c echo.Context) error {
	categories, err := h.templateService.GetCategories(c.Request().Context())
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "GET_CATEGORIES_FAILED", "获取分类失败")
	}

	return successResponse(c, map[string]interface{}{
		"categories": categories,
	})
}

// Get 获取模板详情
func (h *TemplateHandler) Get(c echo.Context) error {
	idOrSlug := c.Param("id")

	var template *entity.Template
	var err error

	// 尝试解析为 UUID
	if id, parseErr := uuid.Parse(idOrSlug); parseErr == nil {
		template, err = h.templateService.GetByID(c.Request().Context(), id)
	} else {
		// 作为 slug 查询
		template, err = h.templateService.GetBySlug(c.Request().Context(), idOrSlug)
	}

	if err != nil {
		return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "模板不存在")
	}

	// 增加浏览次数
	_ = h.templateService.IncrementViewCount(c.Request().Context(), template.ID)

	return successResponse(c, map[string]interface{}{
		"template": template,
	})
}

// Use 使用模板创建工作流
func (h *TemplateHandler) Use(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	templateID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "模板 ID 无效")
	}

	var req UseTemplateRequest
	if err := c.Bind(&req); err != nil {
		// 允许没有请求体
		req = UseTemplateRequest{}
	}

	// 解析文件夹ID
	var folderID *uuid.UUID
	if req.FolderID != nil && *req.FolderID != "" {
		parsed, err := uuid.Parse(*req.FolderID)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_FOLDER_ID", "文件夹 ID 无效")
		}
		folderID = &parsed
	}

	workflow, err := h.templateService.UseTemplate(c.Request().Context(), templateID, uid, service.UseTemplateRequest{
		Name:     req.Name,
		FolderID: folderID,
	})
	if err != nil {
		switch err {
		case service.ErrTemplateNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "模板不存在")
		default:
			return errorResponse(c, http.StatusInternalServerError, "USE_FAILED", "使用模板失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"workflow": workflow,
		"message":  "工作流创建成功",
	})
}

// Create 创建模板（管理员）
func (h *TemplateHandler) Create(c echo.Context) error {
	var req CreateTemplateRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	if req.Name == "" {
		return errorResponse(c, http.StatusBadRequest, "NAME_REQUIRED", "模板名称不能为空")
	}
	if req.Category == "" {
		return errorResponse(c, http.StatusBadRequest, "CATEGORY_REQUIRED", "模板分类不能为空")
	}
	if req.Definition == nil {
		return errorResponse(c, http.StatusBadRequest, "DEFINITION_REQUIRED", "模板定义不能为空")
	}

	template, err := h.templateService.Create(c.Request().Context(), service.CreateTemplateRequest{
		Name:            req.Name,
		Slug:            req.Slug,
		Description:     req.Description,
		LongDescription: req.LongDescription,
		Category:        req.Category,
		Tags:            req.Tags,
		Icon:            req.Icon,
		CoverImage:      req.CoverImage,
		Definition:      entity.JSON(req.Definition),
		Variables:       entity.JSON(req.Variables),
		InputSchema:     entity.JSON(req.InputSchema),
		Difficulty:      req.Difficulty,
		EstimatedTime:   req.EstimatedTime,
		IsFeatured:      req.IsFeatured,
		IsOfficial:      req.IsOfficial,
	})
	if err != nil {
		switch err {
		case service.ErrSlugExists:
			return errorResponse(c, http.StatusConflict, "SLUG_EXISTS", "模板标识已存在")
		default:
			return errorResponse(c, http.StatusInternalServerError, "CREATE_FAILED", "创建模板失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"template": template,
		"message":  "模板创建成功",
	})
}

// Update 更新模板（管理员）
func (h *TemplateHandler) Update(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "模板 ID 无效")
	}

	var req UpdateTemplateRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	// 转换 Definition
	var definition *entity.JSON
	if req.Definition != nil {
		def := entity.JSON(req.Definition)
		definition = &def
	}

	var variables *entity.JSON
	if req.Variables != nil {
		vars := entity.JSON(req.Variables)
		variables = &vars
	}

	var inputSchema *entity.JSON
	if req.InputSchema != nil {
		schema := entity.JSON(req.InputSchema)
		inputSchema = &schema
	}

	template, err := h.templateService.Update(c.Request().Context(), id, service.UpdateTemplateRequest{
		Name:            req.Name,
		Description:     req.Description,
		LongDescription: req.LongDescription,
		Category:        req.Category,
		Tags:            req.Tags,
		Icon:            req.Icon,
		CoverImage:      req.CoverImage,
		Definition:      definition,
		Variables:       variables,
		InputSchema:     inputSchema,
		Difficulty:      req.Difficulty,
		EstimatedTime:   req.EstimatedTime,
		IsFeatured:      req.IsFeatured,
		IsOfficial:      req.IsOfficial,
		IsPublished:     req.IsPublished,
	})
	if err != nil {
		switch err {
		case service.ErrTemplateNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "模板不存在")
		default:
			return errorResponse(c, http.StatusInternalServerError, "UPDATE_FAILED", "更新模板失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"template": template,
		"message":  "模板更新成功",
	})
}

// Delete 删除模板（管理员）
func (h *TemplateHandler) Delete(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "模板 ID 无效")
	}

	if err := h.templateService.Delete(c.Request().Context(), id); err != nil {
		switch err {
		case service.ErrTemplateNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "模板不存在")
		default:
			return errorResponse(c, http.StatusInternalServerError, "DELETE_FAILED", "删除模板失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"success": true,
		"message": "模板删除成功",
	})
}
