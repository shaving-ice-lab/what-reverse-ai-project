package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/agentflow/server/internal/api/middleware"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// AgentChatHandler AI Agent 对话处理器
type AgentChatHandler struct {
	engine   service.AgentEngine
	sessions *service.AgentSessionManager
}

// NewAgentChatHandler 创建 Agent 对话处理器
func NewAgentChatHandler(engine service.AgentEngine, sessions *service.AgentSessionManager) *AgentChatHandler {
	return &AgentChatHandler{
		engine:   engine,
		sessions: sessions,
	}
}

// Chat SSE 流式对话
func (h *AgentChatHandler) Chat(c echo.Context) error {
	workspaceID := c.Param("id")
	userID := middleware.GetUserID(c)

	var req struct {
		Message   string `json:"message"`
		SessionID string `json:"session_id"`
	}
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request")
	}

	if req.Message == "" {
		return errorResponse(c, http.StatusBadRequest, "EMPTY_MESSAGE", "Message cannot be empty")
	}

	// Generate session ID if not provided
	if req.SessionID == "" {
		req.SessionID = uuid.New().String()
	}

	// Set SSE headers
	c.Response().Header().Set("Content-Type", "text/event-stream")
	c.Response().Header().Set("Cache-Control", "no-cache")
	c.Response().Header().Set("Connection", "keep-alive")
	c.Response().Header().Set("X-Accel-Buffering", "no")
	c.Response().WriteHeader(http.StatusOK)

	flusher, ok := c.Response().Writer.(http.Flusher)
	if !ok {
		return errorResponse(c, http.StatusInternalServerError, "SSE_NOT_SUPPORTED", "Server does not support SSE")
	}

	ctx, cancel := context.WithCancel(c.Request().Context())
	defer cancel()

	events := h.engine.Run(ctx, workspaceID, userID, req.Message, req.SessionID)

	for event := range events {
		data, err := json.Marshal(event)
		if err != nil {
			continue
		}

		_, writeErr := fmt.Fprintf(c.Response().Writer, "event: %s\ndata: %s\n\n", event.Type, string(data))
		if writeErr != nil {
			return nil
		}
		flusher.Flush()

		// Stop after done or error
		if event.Type == service.AgentEventDone || event.Type == service.AgentEventError {
			break
		}
	}

	return nil
}

// Confirm 用户确认待确认操作
func (h *AgentChatHandler) Confirm(c echo.Context) error {
	var req struct {
		SessionID string `json:"session_id"`
		ActionID  string `json:"action_id"`
		Approved  bool   `json:"approved"`
	}
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request")
	}

	if req.SessionID == "" || req.ActionID == "" {
		return errorResponse(c, http.StatusBadRequest, "MISSING_PARAMS", "session_id and action_id required")
	}

	if err := h.engine.Confirm(c.Request().Context(), req.SessionID, req.ActionID, req.Approved); err != nil {
		return errorResponse(c, http.StatusBadRequest, "CONFIRM_FAILED", err.Error())
	}

	return successResponse(c, map[string]interface{}{
		"message":    "Action processed",
		"session_id": req.SessionID,
		"action_id":  req.ActionID,
		"approved":   req.Approved,
	})
}

// Cancel 取消当前运行
func (h *AgentChatHandler) Cancel(c echo.Context) error {
	var req struct {
		SessionID string `json:"session_id"`
	}
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request")
	}

	if req.SessionID == "" {
		return errorResponse(c, http.StatusBadRequest, "MISSING_SESSION_ID", "session_id required")
	}

	if err := h.engine.Cancel(c.Request().Context(), req.SessionID); err != nil {
		return errorResponse(c, http.StatusBadRequest, "CANCEL_FAILED", err.Error())
	}

	return successResponse(c, map[string]string{"message": "Session cancelled"})
}

// Status 返回 Agent 引擎状态（LLM 提供商、活跃会话数等）
func (h *AgentChatHandler) Status(c echo.Context) error {
	provider, model := service.GetAgentLLMStatus()

	return successResponse(c, map[string]interface{}{
		"provider":        provider,
		"model":           model,
		"active_sessions": h.sessions.Count(),
	})
}

// ListSessions 列出会话
func (h *AgentChatHandler) ListSessions(c echo.Context) error {
	workspaceID := c.Param("id")

	sessions := h.sessions.List(workspaceID)
	result := make([]map[string]interface{}, 0, len(sessions))
	for _, s := range sessions {
		result = append(result, map[string]interface{}{
			"id":            s.ID,
			"workspace_id":  s.WorkspaceID,
			"user_id":       s.UserID,
			"status":        s.Status,
			"message_count": len(s.Messages),
			"created_at":    s.CreatedAt,
			"updated_at":    s.UpdatedAt,
		})
	}

	return successResponse(c, result)
}

// GetSession 获取会话详情
func (h *AgentChatHandler) GetSession(c echo.Context) error {
	sessionID := c.Param("sessionId")

	session, ok := h.sessions.Get(sessionID)
	if !ok {
		return errorResponse(c, http.StatusNotFound, "SESSION_NOT_FOUND", "Session not found")
	}

	return successResponse(c, session)
}

// DeleteSession 删除会话
func (h *AgentChatHandler) DeleteSession(c echo.Context) error {
	sessionID := c.Param("sessionId")

	if !h.sessions.Delete(sessionID) {
		return errorResponse(c, http.StatusNotFound, "SESSION_NOT_FOUND", "Session not found")
	}

	return successResponse(c, map[string]string{"message": "Session deleted"})
}
