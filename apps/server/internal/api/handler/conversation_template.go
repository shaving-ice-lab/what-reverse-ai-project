package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/api/middleware"
	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// ConversationTemplateHandler 对话模板处理器
type ConversationTemplateHandler struct {
	templateService service.ConversationTemplateService
}

// NewConversationTemplateHandler 创建对话模板处理器
func NewConversationTemplateHandler(templateService service.ConversationTemplateService) *ConversationTemplateHandler {
	return &ConversationTemplateHandler{
		templateService: templateService,
	}
}

// CreateTemplateRequest 创建模板请求
type CreateTemplateAPIRequest struct {
	Name             string                          `json:"name" validate:"required"`
	Description      string                          `json:"description"`
	Icon             string                          `json:"icon"`
	Model            string                          `json:"model"`
	SystemPrompt     *string                         `json:"system_prompt"`
	Temperature      *float64                        `json:"temperature"`
	MaxTokens        *int                            `json:"max_tokens"`
	TopP             *float64                        `json:"top_p"`
	TopK             *int                            `json:"top_k"`
	FrequencyPenalty *float64                        `json:"frequency_penalty"`
	PresencePenalty  *float64                        `json:"presence_penalty"`
	InitialMessages  []entity.TemplateInitialMessage `json:"initial_messages"`
	Tags             []string                        `json:"tags"`
	IsPublic         bool                            `json:"is_public"`
}

// List 获取模板列表
// GET /api/v1/conversation-templates
func (h *ConversationTemplateHandler) List(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var req service.ListTemplatesRequest
	if err := c.Bind(&req); err != nil {
		req = service.ListTemplatesRequest{}
	}

	// 默认包含公开和系统模板
	req.IncludePublic = true
	req.IncludeSystem = true

	result, err := h.templateService.List(c.Request().Context(), uid, req)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取模板列表失败")
	}

	return successResponse(c, result)
}

// Get 获取模板详情
// GET /api/v1/conversation-templates/:id
func (h *ConversationTemplateHandler) Get(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	templateID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "模板 ID 无效")
	}

	template, err := h.templateService.GetByID(c.Request().Context(), templateID, uid)
	if err != nil {
		switch err {
		case service.ErrConvTemplateNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "模板不存在")
		case service.ErrConvTemplateUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此模板")
		default:
			return errorResponse(c, http.StatusInternalServerError, "GET_FAILED", "获取模板失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"template": template,
	})
}

// Create 创建模板
// POST /api/v1/conversation-templates
func (h *ConversationTemplateHandler) Create(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var req CreateTemplateAPIRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	if req.Name == "" {
		return errorResponse(c, http.StatusBadRequest, "NAME_REQUIRED", "模板名称不能为空")
	}

	template, err := h.templateService.Create(c.Request().Context(), uid, service.CreateConvTemplateRequest{
		Name:             req.Name,
		Description:      req.Description,
		Icon:             req.Icon,
		Model:            req.Model,
		SystemPrompt:     req.SystemPrompt,
		Temperature:      req.Temperature,
		MaxTokens:        req.MaxTokens,
		TopP:             req.TopP,
		TopK:             req.TopK,
		FrequencyPenalty: req.FrequencyPenalty,
		PresencePenalty:  req.PresencePenalty,
		InitialMessages:  req.InitialMessages,
		Tags:             req.Tags,
		IsPublic:         req.IsPublic,
	})
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "CREATE_FAILED", "创建模板失败")
	}

	return successResponse(c, map[string]interface{}{
		"success":  true,
		"template": template,
	})
}

// Update 更新模板
// PUT /api/v1/conversation-templates/:id
func (h *ConversationTemplateHandler) Update(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	templateID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "模板 ID 无效")
	}

	var req service.UpdateConvTemplateRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	template, err := h.templateService.Update(c.Request().Context(), templateID, uid, req)
	if err != nil {
		switch err {
		case service.ErrConvTemplateNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "模板不存在")
		case service.ErrConvTemplateUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限编辑此模板")
		default:
			return errorResponse(c, http.StatusInternalServerError, "UPDATE_FAILED", "更新模板失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"success":  true,
		"template": template,
	})
}

// Delete 删除模板
// DELETE /api/v1/conversation-templates/:id
func (h *ConversationTemplateHandler) Delete(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	templateID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "模板 ID 无效")
	}

	if err := h.templateService.Delete(c.Request().Context(), templateID, uid); err != nil {
		switch err {
		case service.ErrConvTemplateNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "模板不存在")
		case service.ErrConvTemplateUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限删除此模板")
		default:
			return errorResponse(c, http.StatusInternalServerError, "DELETE_FAILED", "删除模板失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"success": true,
		"message": "模板删除成功",
	})
}

// Use 使用模板
// POST /api/v1/conversation-templates/:id/use
func (h *ConversationTemplateHandler) Use(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	templateID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "模板 ID 无效")
	}

	template, err := h.templateService.UseTemplate(c.Request().Context(), templateID, uid)
	if err != nil {
		switch err {
		case service.ErrConvTemplateNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "模板不存在")
		case service.ErrConvTemplateUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限使用此模板")
		default:
			return errorResponse(c, http.StatusInternalServerError, "USE_FAILED", "使用模板失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"success":  true,
		"template": template,
	})
}
