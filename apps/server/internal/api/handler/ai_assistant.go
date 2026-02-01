package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/api/middleware"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// AIAssistantHandler AI 助手处理器
type AIAssistantHandler struct {
	aiService service.AIAssistantService
}

// NewAIAssistantHandler 创建 AI 助手处理器
func NewAIAssistantHandler(aiService service.AIAssistantService) *AIAssistantHandler {
	return &AIAssistantHandler{aiService: aiService}
}

// ========== 请求/响应结构 ==========

// GenerateWorkflowRequest 生成工作流请求
type GenerateWorkflowAPIRequest struct {
	Description         string                        `json:"description" validate:"required"`
	ConversationHistory []service.ChatMessage         `json:"conversation_history,omitempty"`
	Preferences         *service.GenerationPreferences `json:"preferences,omitempty"`
}

// ChatRequest 聊天请求
type ChatAPIRequest struct {
	SessionID string `json:"session_id"`
	Message   string `json:"message" validate:"required"`
}

// SuggestNextNodeRequest 建议下一个节点请求
type SuggestNextNodeRequest struct {
	WorkflowJSON  string `json:"workflow_json" validate:"required"`
	CurrentNodeID string `json:"current_node_id" validate:"required"`
}

// SuggestConfigRequest 建议配置请求
type SuggestConfigRequest struct {
	NodeType string `json:"node_type" validate:"required"`
	Context  string `json:"context,omitempty"`
}

// SuggestFixRequest 建议修复请求
type SuggestFixRequest struct {
	ErrorMessage string `json:"error_message" validate:"required"`
	NodeJSON     string `json:"node_json"`
}

// ParseIntentRequest 解析意图请求
type ParseIntentRequest struct {
	Message string `json:"message" validate:"required"`
}

// ========== API 处理函数 ==========

// GenerateWorkflow 生成工作流
// POST /api/v1/ai/generate-workflow
func (h *AIAssistantHandler) GenerateWorkflow(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var req GenerateWorkflowAPIRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	if req.Description == "" {
		return errorResponse(c, http.StatusBadRequest, "REQUIRED_FIELDS", "描述不能为空")
	}

	result, err := h.aiService.GenerateWorkflow(c.Request().Context(), uid, service.GenerateWorkflowRequest{
		Description:         req.Description,
		ConversationHistory: req.ConversationHistory,
		Preferences:         req.Preferences,
	})
	if err != nil {
		switch err {
		case service.ErrInvalidIntent:
			return errorResponse(c, http.StatusBadRequest, "INVALID_INTENT", "无法理解用户意图")
		case service.ErrGenerationFailed:
			return errorResponse(c, http.StatusInternalServerError, "GENERATION_FAILED", "工作流生成失败")
		case service.ErrLLMUnavailable:
			return errorResponse(c, http.StatusServiceUnavailable, "LLM_UNAVAILABLE", "LLM 服务不可用")
		default:
			return errorResponse(c, http.StatusInternalServerError, "INTERNAL_ERROR", "内部错误")
		}
	}

	return successResponse(c, result)
}

// Chat AI 对话
// POST /api/v1/ai/chat
func (h *AIAssistantHandler) Chat(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var req ChatAPIRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	if req.Message == "" {
		return errorResponse(c, http.StatusBadRequest, "REQUIRED_FIELDS", "消息不能为空")
	}

	// 如果没有提供 session_id，生成一个新的
	if req.SessionID == "" {
		req.SessionID = uuid.New().String()
	}

	result, err := h.aiService.Chat(c.Request().Context(), uid, req.SessionID, req.Message)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "CHAT_FAILED", "对话处理失败")
	}

	return successResponse(c, map[string]interface{}{
		"session_id": req.SessionID,
		"response":   result,
	})
}

// ParseIntent 解析意图
// POST /api/v1/ai/parse-intent
func (h *AIAssistantHandler) ParseIntent(c echo.Context) error {
	var req ParseIntentRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	if req.Message == "" {
		return errorResponse(c, http.StatusBadRequest, "REQUIRED_FIELDS", "消息不能为空")
	}

	result, err := h.aiService.ParseIntent(c.Request().Context(), req.Message)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "PARSE_FAILED", "意图解析失败")
	}

	return successResponse(c, result)
}

// SuggestNextNode 建议下一个节点
// POST /api/v1/ai/suggest-next-node
func (h *AIAssistantHandler) SuggestNextNode(c echo.Context) error {
	var req SuggestNextNodeRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	if req.WorkflowJSON == "" || req.CurrentNodeID == "" {
		return errorResponse(c, http.StatusBadRequest, "REQUIRED_FIELDS", "工作流 JSON 和当前节点 ID 不能为空")
	}

	suggestions, err := h.aiService.SuggestNextNode(c.Request().Context(), req.WorkflowJSON, req.CurrentNodeID)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "SUGGEST_FAILED", "节点建议失败")
	}

	return successResponse(c, map[string]interface{}{
		"suggestions": suggestions,
	})
}

// SuggestConfig 建议节点配置
// POST /api/v1/ai/suggest-config
func (h *AIAssistantHandler) SuggestConfig(c echo.Context) error {
	var req SuggestConfigRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	if req.NodeType == "" {
		return errorResponse(c, http.StatusBadRequest, "REQUIRED_FIELDS", "节点类型不能为空")
	}

	config, err := h.aiService.SuggestConfig(c.Request().Context(), req.NodeType, req.Context)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "SUGGEST_FAILED", "配置建议失败")
	}

	return successResponse(c, map[string]interface{}{
		"config": config,
	})
}

// SuggestFix 建议修复方案
// POST /api/v1/ai/suggest-fix
func (h *AIAssistantHandler) SuggestFix(c echo.Context) error {
	var req SuggestFixRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	if req.ErrorMessage == "" {
		return errorResponse(c, http.StatusBadRequest, "REQUIRED_FIELDS", "错误信息不能为空")
	}

	suggestion, err := h.aiService.SuggestFix(c.Request().Context(), req.ErrorMessage, req.NodeJSON)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "SUGGEST_FAILED", "修复建议失败")
	}

	return successResponse(c, suggestion)
}
