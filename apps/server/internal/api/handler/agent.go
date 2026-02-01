package handler

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/agentflow/server/internal/api/middleware"
	"github.com/agentflow/server/internal/repository"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type AgentHandler struct {
	agentService service.AgentService
}

func NewAgentHandler(agentService service.AgentService) *AgentHandler {
	return &AgentHandler{agentService: agentService}
}

// List 获取 Agent 列表
func (h *AgentHandler) List(c echo.Context) error {
	page, _ := strconv.Atoi(c.QueryParam("page"))
	pageSize, _ := strconv.Atoi(c.QueryParam("page_size"))
	minRating, _ := strconv.ParseFloat(c.QueryParam("min_rating"), 64)

	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}

	params := repository.AgentListParams{
		Category:    c.QueryParam("category"),
		Search:      c.QueryParam("search"),
		Sort:        c.QueryParam("sort"),
		PricingType: c.QueryParam("pricing_type"),
		MinRating:   minRating,
		Page:        page,
		PageSize:    pageSize,
	}

	agents, total, err := h.agentService.List(c.Request().Context(), params)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取列表失败")
	}

	return successResponseWithMeta(c, agents, map[string]interface{}{
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// Featured 获取精选 Agent
func (h *AgentHandler) Featured(c echo.Context) error {
	agents, err := h.agentService.Featured(c.Request().Context(), 8)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取精选列表失败")
	}

	return successResponse(c, agents)
}

// Categories 获取分类列表
func (h *AgentHandler) Categories(c echo.Context) error {
	categories := h.agentService.Categories(c.Request().Context())
	return successResponse(c, categories)
}

// Trending 获取热门排行
func (h *AgentHandler) Trending(c echo.Context) error {
	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	if limit <= 0 {
		limit = 20
	}

	params := repository.TrendingParams{
		Period:   c.QueryParam("period"), // day, week, month, all
		Category: c.QueryParam("category"),
		Limit:    limit,
	}

	agents, err := h.agentService.Trending(c.Request().Context(), params)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取热门排行失败")
	}

	return successResponse(c, agents)
}

// ListByTags 根据标签筛选 Agent
func (h *AgentHandler) ListByTags(c echo.Context) error {
	tagsParam := c.QueryParam("tags")
	if tagsParam == "" {
		return errorResponse(c, http.StatusBadRequest, "MISSING_TAGS", "请提供标签参数")
	}

	tags := strings.Split(tagsParam, ",")
	for i, tag := range tags {
		tags[i] = strings.TrimSpace(tag)
	}

	page, _ := strconv.Atoi(c.QueryParam("page"))
	pageSize, _ := strconv.Atoi(c.QueryParam("page_size"))

	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}

	agents, total, err := h.agentService.ListByTags(c.Request().Context(), tags, page, pageSize)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取列表失败")
	}

	return successResponseWithMeta(c, agents, map[string]interface{}{
		"total":     total,
		"page":      page,
		"page_size": pageSize,
		"tags":      tags,
	})
}

// Get 获取 Agent 详情
func (h *AgentHandler) Get(c echo.Context) error {
	slug := c.Param("slug")

	agent, err := h.agentService.GetBySlug(c.Request().Context(), slug)
	if err != nil {
		return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "Agent 不存在")
	}

	return successResponse(c, agent)
}

// Publish 发布 Agent
func (h *AgentHandler) Publish(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var req struct {
		WorkflowID      string   `json:"workflow_id"`
		Name            string   `json:"name"`
		Description     string   `json:"description"`
		LongDescription *string  `json:"long_description"`
		Icon            string   `json:"icon"`
		CoverImage      *string  `json:"cover_image"`
		Category        string   `json:"category"`
		Tags            []string `json:"tags"`
		PricingType     string   `json:"pricing_type"`
		Price           *float64 `json:"price"`
		Screenshots     []string `json:"screenshots"`
		DemoVideo       *string  `json:"demo_video"`
	}

	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	workflowID, err := uuid.Parse(req.WorkflowID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_WORKFLOW_ID", "工作流 ID 无效")
	}

	agent, err := h.agentService.Publish(c.Request().Context(), uid, service.PublishAgentRequest{
		WorkflowID:      workflowID,
		Name:            req.Name,
		Description:     req.Description,
		LongDescription: req.LongDescription,
		Icon:            req.Icon,
		CoverImage:      req.CoverImage,
		Category:        req.Category,
		Tags:            req.Tags,
		PricingType:     req.PricingType,
		Price:           req.Price,
		Screenshots:     req.Screenshots,
		DemoVideo:       req.DemoVideo,
	})
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "PUBLISH_FAILED", "发布失败")
	}

	return successResponse(c, agent)
}

// UpdateAgentRequest 更新 Agent 请求
type UpdateAgentRequest struct {
	Name            *string  `json:"name"`
	Description     *string  `json:"description"`
	LongDescription *string  `json:"long_description"`
	Icon            *string  `json:"icon"`
	CoverImage      *string  `json:"cover_image"`
	Category        *string  `json:"category"`
	Tags            []string `json:"tags"`
	PricingType     *string  `json:"pricing_type"`
	Price           *float64 `json:"price"`
	Screenshots     []string `json:"screenshots"`
	DemoVideo       *string  `json:"demo_video"`
}

// UseAgentRequest 使用 Agent 请求
type UseAgentRequest struct {
	Inputs map[string]interface{} `json:"inputs"`
}

// Update 更新 Agent
func (h *AgentHandler) Update(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	agentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "Agent ID 无效")
	}

	var req UpdateAgentRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	agent, err := h.agentService.Update(c.Request().Context(), agentID, uid, service.UpdateAgentRequest{
		Name:            req.Name,
		Description:     req.Description,
		LongDescription: req.LongDescription,
		Icon:            req.Icon,
		CoverImage:      req.CoverImage,
		Category:        req.Category,
		Tags:            req.Tags,
		PricingType:     req.PricingType,
		Price:           req.Price,
		Screenshots:     req.Screenshots,
		DemoVideo:       req.DemoVideo,
	})
	if err != nil {
		switch err {
		case service.ErrAgentNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "Agent 不存在")
		case service.ErrUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限修改此 Agent")
		default:
			return errorResponse(c, http.StatusInternalServerError, "UPDATE_FAILED", "更新失败")
		}
	}

	return successResponse(c, agent)
}

// Use 使用 Agent
func (h *AgentHandler) Use(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	agentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "Agent ID 无效")
	}

	var req UseAgentRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	// 转换 inputs
	var inputs map[string]interface{}
	if req.Inputs != nil {
		inputs = req.Inputs
	}

	if err := h.agentService.Use(c.Request().Context(), agentID, uid, inputs); err != nil {
		return errorResponse(c, http.StatusInternalServerError, "USE_FAILED", "使用 Agent 失败")
	}

	return successResponse(c, map[string]interface{}{
		"message":  "Agent 使用成功",
		"agent_id": agentID,
	})
}

// Fork Fork Agent
func (h *AgentHandler) Fork(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	agentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "Agent ID 无效")
	}

	workflow, err := h.agentService.Fork(c.Request().Context(), agentID, uid)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "FORK_FAILED", "Fork 失败")
	}

	return successResponse(c, workflow)
}

// Star 收藏 Agent
func (h *AgentHandler) Star(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	agentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "Agent ID 无效")
	}

	if err := h.agentService.Star(c.Request().Context(), agentID, uid); err != nil {
		return errorResponse(c, http.StatusInternalServerError, "STAR_FAILED", "收藏失败")
	}

	return successResponse(c, map[string]string{"message": "收藏成功"})
}

// Unstar 取消收藏
func (h *AgentHandler) Unstar(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	agentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "Agent ID 无效")
	}

	if err := h.agentService.Unstar(c.Request().Context(), agentID, uid); err != nil {
		return errorResponse(c, http.StatusInternalServerError, "UNSTAR_FAILED", "取消收藏失败")
	}

	return successResponse(c, map[string]string{"message": "取消收藏成功"})
}

// ReportRequest 举报请求
type ReportRequest struct {
	Reason      string   `json:"reason"`      // spam, inappropriate, copyright, misleading, other
	Description string   `json:"description"` // 详细描述
	Evidence    []string `json:"evidence"`    // 截图等证据 URL
}

// Report 举报 Agent
func (h *AgentHandler) Report(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	agentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "Agent ID 无效")
	}

	var req ReportRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	// 验证举报原因
	if req.Reason == "" {
		return errorResponse(c, http.StatusBadRequest, "MISSING_REASON", "请选择举报原因")
	}

	report, err := h.agentService.Report(c.Request().Context(), agentID, uid, service.ReportAgentRequest{
		Reason:      req.Reason,
		Description: req.Description,
		Evidence:    req.Evidence,
	})
	if err != nil {
		switch err {
		case service.ErrAgentNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "Agent 不存在")
		case service.ErrAlreadyReported:
			return errorResponse(c, http.StatusConflict, "ALREADY_REPORTED", "您已举报过此 Agent")
		case service.ErrInvalidReportReason:
			return errorResponse(c, http.StatusBadRequest, "INVALID_REASON", "无效的举报原因")
		default:
			return errorResponse(c, http.StatusInternalServerError, "REPORT_FAILED", "举报失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"message":   "举报已提交，我们会尽快处理",
		"report_id": report.ID,
	})
}

// Analytics 获取 Agent 分析数据
func (h *AgentHandler) Analytics(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	agentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "Agent ID 无效")
	}

	// 时间范围: 7d, 30d, 90d, 1y
	period := c.QueryParam("period")
	if period == "" {
		period = "30d"
	}

	analytics, err := h.agentService.Analytics(c.Request().Context(), agentID, uid, period)
	if err != nil {
		switch err {
		case service.ErrAgentNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "Agent 不存在")
		case service.ErrNotAgentOwner:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "您不是此 Agent 的所有者")
		default:
			return errorResponse(c, http.StatusInternalServerError, "ANALYTICS_FAILED", "获取分析数据失败")
		}
	}

	return successResponse(c, analytics)
}

// SubmitForReview 提交 Agent 审核
func (h *AgentHandler) SubmitForReview(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	agentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "Agent ID 无效")
	}

	if err := h.agentService.SubmitForReview(c.Request().Context(), agentID, uid); err != nil {
		switch err {
		case service.ErrAgentNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "Agent 不存在")
		case service.ErrNotAgentOwner:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "您不是此 Agent 的所有者")
		case service.ErrAgentAlreadyPending:
			return errorResponse(c, http.StatusConflict, "ALREADY_PENDING", "Agent 已在审核中")
		default:
			return errorResponse(c, http.StatusInternalServerError, "SUBMIT_FAILED", "提交审核失败")
		}
	}

	return successResponse(c, map[string]string{
		"message": "已提交审核，预计 1-3 个工作日内完成",
	})
}
