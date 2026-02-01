package handler

import (
	"net/http"
	"strconv"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/repository"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// CreativeTemplateHandler AI 创意助手模板处理器
type CreativeTemplateHandler struct {
	templateService service.CreativeTemplateService
}

// NewCreativeTemplateHandler 创建创意模板处理器
func NewCreativeTemplateHandler(templateService service.CreativeTemplateService) *CreativeTemplateHandler {
	return &CreativeTemplateHandler{templateService: templateService}
}

// ================== 请求/响应结构 ==================

// CreativeTemplateListResponse 模板列表响应项
type CreativeTemplateListResponse struct {
	ID            uuid.UUID                        `json:"id"`
	Name          string                           `json:"name"`
	Slug          string                           `json:"slug"`
	Description   string                           `json:"description"`
	Icon          string                           `json:"icon"`
	Category      entity.CreativeTemplateCategory  `json:"category"`
	Tags          entity.StringArray               `json:"tags"`
	UsageCount    int                              `json:"usage_count"`
	Rating        float32                          `json:"rating"`
	ReviewCount   int                              `json:"review_count"`
	EstimatedTime int                              `json:"estimated_time"`
	IsOfficial    bool                             `json:"is_official"`
	IsFeatured    bool                             `json:"is_featured"`
	CreatorName   *string                          `json:"creator_name,omitempty"`
	CreatedAt     string                           `json:"created_at"`
}

// CreativeTemplateDetailResponse 模板详情响应
type CreativeTemplateDetailResponse struct {
	ID             uuid.UUID                       `json:"id"`
	Name           string                          `json:"name"`
	Slug           string                          `json:"slug"`
	Description    string                          `json:"description"`
	Icon           string                          `json:"icon"`
	Category       entity.CreativeTemplateCategory `json:"category"`
	Tags           entity.StringArray              `json:"tags"`
	InputsRequired entity.JSON                     `json:"inputs_required"`
	InputsOptional entity.JSON                     `json:"inputs_optional"`
	OutputSections entity.JSON                     `json:"output_sections"`
	UsageCount     int                             `json:"usage_count"`
	Rating         float32                         `json:"rating"`
	ReviewCount    int                             `json:"review_count"`
	EstimatedTime  int                             `json:"estimated_time"`
	IsOfficial     bool                            `json:"is_official"`
	IsFeatured     bool                            `json:"is_featured"`
	CreatorID      *uuid.UUID                      `json:"creator_id,omitempty"`
	CreatorName    *string                         `json:"creator_name,omitempty"`
	Version        int                             `json:"version"`
	CreatedAt      string                          `json:"created_at"`
	UpdatedAt      string                          `json:"updated_at"`
}

// ================== API 端点 ==================

// List 获取创意模板列表
// GET /api/v1/creative/templates
// @Summary 获取创意模板列表
// @Description 获取 AI 创意助手的模板列表，支持分类、搜索、分页等筛选条件
// @Tags Creative Templates
// @Produce json
// @Param category query string false "分类筛选 (business/content/product/marketing)"
// @Param search query string false "搜索关键词"
// @Param featured query bool false "是否精选"
// @Param official query bool false "是否官方"
// @Param page query int false "页码" default(1)
// @Param page_size query int false "每页数量" default(20)
// @Param sort query string false "排序方式 (popular/newest/rating/name)" default(newest)
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/creative/templates [get]
func (h *CreativeTemplateHandler) List(c echo.Context) error {
	// 解析分页参数
	page, _ := strconv.Atoi(c.QueryParam("page"))
	pageSize, _ := strconv.Atoi(c.QueryParam("page_size"))
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	if pageSize > 100 {
		pageSize = 100
	}

	// 解析布尔参数
	var featured *bool
	if featuredStr := c.QueryParam("featured"); featuredStr != "" {
		f := featuredStr == "true"
		featured = &f
	}

	var official *bool
	if officialStr := c.QueryParam("official"); officialStr != "" {
		o := officialStr == "true"
		official = &o
	}

	// 构建查询参数
	params := repository.CreativeTemplateListParams{
		Category: c.QueryParam("category"),
		Search:   c.QueryParam("search"),
		Featured: featured,
		Official: official,
		Page:     page,
		PageSize: pageSize,
		Sort:     c.QueryParam("sort"),
	}

	// 处理标签参数
	if tags := c.QueryParams()["tags"]; len(tags) > 0 {
		params.Tags = tags
	}

	// 调用服务层
	templates, total, err := h.templateService.List(c.Request().Context(), params)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取模板列表失败")
	}

	// 转换为响应格式
	items := make([]CreativeTemplateListResponse, len(templates))
	for i, t := range templates {
		items[i] = CreativeTemplateListResponse{
			ID:            t.ID,
			Name:          t.Name,
			Slug:          t.Slug,
			Description:   t.Description,
			Icon:          t.Icon,
			Category:      t.Category,
			Tags:          t.Tags,
			UsageCount:    t.UsageCount,
			Rating:        t.Rating,
			ReviewCount:   t.ReviewCount,
			EstimatedTime: t.EstimatedTime,
			IsOfficial:    t.IsOfficial,
			IsFeatured:    t.IsFeatured,
			CreatorName:   t.CreatorName,
			CreatedAt:     t.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		}
	}

	return successResponseWithMeta(c, map[string]interface{}{
		"templates": items,
	}, map[string]interface{}{
		"total":      total,
		"page":       page,
		"page_size":  pageSize,
		"total_pages": (total + int64(pageSize) - 1) / int64(pageSize),
	})
}

// Get 获取创意模板详情
// GET /api/v1/creative/templates/:id
// @Summary 获取创意模板详情
// @Description 通过 ID 或 Slug 获取创意模板的完整详情
// @Tags Creative Templates
// @Produce json
// @Param id path string true "模板 ID 或 Slug"
// @Success 200 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /api/v1/creative/templates/{id} [get]
func (h *CreativeTemplateHandler) Get(c echo.Context) error {
	idOrSlug := c.Param("id")

	var template *entity.CreativeTemplate
	var err error

	// 尝试解析为 UUID
	if id, parseErr := uuid.Parse(idOrSlug); parseErr == nil {
		template, err = h.templateService.GetByID(c.Request().Context(), id)
	} else {
		// 作为 slug 查询
		template, err = h.templateService.GetBySlug(c.Request().Context(), idOrSlug)
	}

	if err != nil {
		if err == service.ErrCreativeTemplateNotFound {
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "模板不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "GET_FAILED", "获取模板详情失败")
	}

	// 增加使用次数 (可选：记录浏览)
	// _ = h.templateService.IncrementUsage(c.Request().Context(), template.ID)

	// 转换为响应格式
	response := CreativeTemplateDetailResponse{
		ID:             template.ID,
		Name:           template.Name,
		Slug:           template.Slug,
		Description:    template.Description,
		Icon:           template.Icon,
		Category:       template.Category,
		Tags:           template.Tags,
		InputsRequired: template.InputsRequired,
		InputsOptional: template.InputsOptional,
		OutputSections: template.OutputSections,
		UsageCount:     template.UsageCount,
		Rating:         template.Rating,
		ReviewCount:    template.ReviewCount,
		EstimatedTime:  template.EstimatedTime,
		IsOfficial:     template.IsOfficial,
		IsFeatured:     template.IsFeatured,
		CreatorID:      template.CreatorID,
		CreatorName:    template.CreatorName,
		Version:        template.Version,
		CreatedAt:      template.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:      template.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}

	return successResponse(c, map[string]interface{}{
		"template": response,
	})
}

// GetExample 获取模板示例
// GET /api/v1/creative/templates/:id/example
// @Summary 获取模板示例
// @Description 获取创意模板的示例输入输出，用于展示模板的实际效果
// @Tags Creative Templates
// @Produce json
// @Param id path string true "模板 ID 或 Slug"
// @Success 200 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /api/v1/creative/templates/{id}/example [get]
func (h *CreativeTemplateHandler) GetExample(c echo.Context) error {
	idOrSlug := c.Param("id")

	var templateID uuid.UUID

	// 尝试解析为 UUID
	if id, parseErr := uuid.Parse(idOrSlug); parseErr == nil {
		templateID = id
	} else {
		// 作为 slug 查询，先获取模板以获取 ID
		template, err := h.templateService.GetBySlug(c.Request().Context(), idOrSlug)
		if err != nil {
			if err == service.ErrCreativeTemplateNotFound {
				return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "模板不存在")
			}
			return errorResponse(c, http.StatusInternalServerError, "GET_FAILED", "获取模板失败")
		}
		templateID = template.ID
	}

	// 获取示例
	example, err := h.templateService.GetExample(c.Request().Context(), templateID)
	if err != nil {
		if err == service.ErrCreativeTemplateNotFound {
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "模板不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "GET_EXAMPLE_FAILED", "获取示例失败")
	}

	// 如果没有示例，返回空对象
	if example == nil || (example.Input == nil && example.Output == "") {
		return successResponse(c, map[string]interface{}{
			"example": nil,
			"message": "该模板暂无示例",
		})
	}

	return successResponse(c, map[string]interface{}{
		"example": map[string]interface{}{
			"input":       example.Input,
			"output":      example.Output,
			"title":       example.Title,
			"description": example.Description,
		},
	})
}

// Featured 获取精选模板
// GET /api/v1/creative/templates/featured
// @Summary 获取精选创意模板
// @Description 获取 AI 创意助手的精选推荐模板列表
// @Tags Creative Templates
// @Produce json
// @Param limit query int false "返回数量" default(10)
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/creative/templates/featured [get]
func (h *CreativeTemplateHandler) Featured(c echo.Context) error {
	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	if limit <= 0 {
		limit = 10
	}
	if limit > 50 {
		limit = 50
	}

	templates, err := h.templateService.GetFeatured(c.Request().Context(), limit)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "GET_FEATURED_FAILED", "获取精选模板失败")
	}

	// 转换为响应格式
	items := make([]CreativeTemplateListResponse, len(templates))
	for i, t := range templates {
		items[i] = CreativeTemplateListResponse{
			ID:            t.ID,
			Name:          t.Name,
			Slug:          t.Slug,
			Description:   t.Description,
			Icon:          t.Icon,
			Category:      t.Category,
			Tags:          t.Tags,
			UsageCount:    t.UsageCount,
			Rating:        t.Rating,
			ReviewCount:   t.ReviewCount,
			EstimatedTime: t.EstimatedTime,
			IsOfficial:    t.IsOfficial,
			IsFeatured:    t.IsFeatured,
			CreatorName:   t.CreatorName,
			CreatedAt:     t.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		}
	}

	return successResponse(c, map[string]interface{}{
		"templates": items,
	})
}

// Categories 获取模板分类列表
// GET /api/v1/creative/templates/categories
// @Summary 获取创意模板分类
// @Description 获取 AI 创意助手的模板分类列表，包含各分类的模板数量
// @Tags Creative Templates
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/creative/templates/categories [get]
func (h *CreativeTemplateHandler) Categories(c echo.Context) error {
	categories, err := h.templateService.GetCategories(c.Request().Context())
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "GET_CATEGORIES_FAILED", "获取分类列表失败")
	}

	return successResponse(c, map[string]interface{}{
		"categories": categories,
	})
}
