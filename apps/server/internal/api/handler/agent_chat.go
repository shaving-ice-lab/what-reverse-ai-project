package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/reverseai/server/internal/api/middleware"
	"github.com/reverseai/server/internal/service"
)

// AgentChatHandler AI Agent 对话处理器
type AgentChatHandler struct {
	engine           service.AgentEngine
	sessions         *service.AgentSessionManager
	skillRegistry    *service.SkillRegistry
	personaRegistry  *service.PersonaRegistry
	workspaceService service.WorkspaceService
}

// NewAgentChatHandler 创建 Agent 对话处理器
func NewAgentChatHandler(engine service.AgentEngine, sessions *service.AgentSessionManager, workspaceService service.WorkspaceService, personaRegistry *service.PersonaRegistry, skillRegistry ...*service.SkillRegistry) *AgentChatHandler {
	h := &AgentChatHandler{
		engine:           engine,
		sessions:         sessions,
		workspaceService: workspaceService,
		personaRegistry:  personaRegistry,
	}
	if len(skillRegistry) > 0 {
		h.skillRegistry = skillRegistry[0]
	}
	return h
}

// Chat SSE 流式对话
func (h *AgentChatHandler) Chat(c echo.Context) error {
	workspaceID := c.Param("id")
	userID := middleware.GetUserID(c)

	var req struct {
		Message   string `json:"message"`
		SessionID string `json:"session_id"`
		PersonaID string `json:"persona_id"`
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

	// Load workspace-level LLM config (default endpoint) and attach to context
	if h.workspaceService != nil {
		wsID, _ := uuid.Parse(workspaceID)
		uID, _ := uuid.Parse(userID)
		if ws, err := h.workspaceService.GetByID(ctx, wsID, uID); err == nil && ws != nil && ws.Settings != nil {
			if ep := getDefaultLLMEndpoint(ws.Settings); ep != nil {
				apiKey, _ := ep["api_key"].(string)
				if apiKey != "" {
					baseURL, _ := ep["base_url"].(string)
					model, _ := ep["model"].(string)
					provider, _ := ep["provider"].(string)
					ctx = service.WithLLMConfig(ctx, &service.LLMConfig{
						Provider: provider,
						APIKey:   apiKey,
						BaseURL:  baseURL,
						Model:    model,
					})
				}
			}
		}
	}

	events := h.engine.Run(ctx, workspaceID, userID, req.Message, req.SessionID, req.PersonaID)

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
		title := ""
		for _, msg := range s.Messages {
			if msg.Role == "user" && msg.Content != "" {
				title = msg.Content
				if len(title) > 60 {
					title = title[:60] + "..."
				}
				break
			}
		}
		result = append(result, map[string]interface{}{
			"id":            s.ID,
			"workspace_id":  s.WorkspaceID,
			"user_id":       s.UserID,
			"persona_id":    s.PersonaID,
			"status":        s.Status,
			"message_count": len(s.Messages),
			"title":         title,
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

// ListSkills 列出已注册的 AI Skills
func (h *AgentChatHandler) ListSkills(c echo.Context) error {
	if h.skillRegistry == nil {
		return successResponse(c, []interface{}{})
	}
	return successResponse(c, h.skillRegistry.ListAll())
}

// ToggleSkill 切换 Skill 启用/禁用状态
func (h *AgentChatHandler) ToggleSkill(c echo.Context) error {
	skillID := c.Param("skillId")
	if skillID == "" {
		return errorResponse(c, http.StatusBadRequest, "MISSING_SKILL_ID", "Skill ID is required")
	}
	if h.skillRegistry == nil {
		return errorResponse(c, http.StatusNotFound, "NO_REGISTRY", "Skill registry not available")
	}

	var req struct {
		Enabled bool `json:"enabled"`
	}
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body")
	}

	if err := h.skillRegistry.SetEnabled(skillID, req.Enabled); err != nil {
		return errorResponse(c, http.StatusNotFound, "SKILL_NOT_FOUND", err.Error())
	}

	return successResponse(c, map[string]interface{}{
		"id":      skillID,
		"enabled": req.Enabled,
	})
}

// CreateSkill 创建自定义 Skill
func (h *AgentChatHandler) CreateSkill(c echo.Context) error {
	if h.skillRegistry == nil {
		return errorResponse(c, http.StatusNotFound, "NO_REGISTRY", "Skill registry not available")
	}

	var req struct {
		ID           string `json:"id"`
		Name         string `json:"name"`
		Description  string `json:"description"`
		Category     string `json:"category"`
		Icon         string `json:"icon"`
		SystemPrompt string `json:"system_prompt"`
	}
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body")
	}
	if req.Name == "" {
		return errorResponse(c, http.StatusBadRequest, "MISSING_NAME", "Skill name is required")
	}
	if req.SystemPrompt == "" {
		return errorResponse(c, http.StatusBadRequest, "MISSING_PROMPT", "System prompt is required")
	}

	// Generate ID if not provided
	skillID := req.ID
	if skillID == "" {
		skillID = "custom_" + uuid.New().String()[:8]
	}

	if err := h.skillRegistry.RegisterCustom(skillID, req.Name, req.Description, req.Category, req.Icon, req.SystemPrompt); err != nil {
		return errorResponse(c, http.StatusConflict, "SKILL_EXISTS", err.Error())
	}

	skill, _ := h.skillRegistry.Get(skillID)
	if skill == nil {
		return errorResponse(c, http.StatusInternalServerError, "CREATE_FAILED", "Failed to create skill")
	}

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"code":    "OK",
		"message": "Skill created",
		"data":    skill.ToMeta(),
	})
}

// UpdateSkill 更新自定义 Skill
func (h *AgentChatHandler) UpdateSkill(c echo.Context) error {
	skillID := c.Param("skillId")
	if skillID == "" {
		return errorResponse(c, http.StatusBadRequest, "MISSING_SKILL_ID", "Skill ID is required")
	}
	if h.skillRegistry == nil {
		return errorResponse(c, http.StatusNotFound, "NO_REGISTRY", "Skill registry not available")
	}

	var req struct {
		Name         string `json:"name"`
		Description  string `json:"description"`
		Category     string `json:"category"`
		Icon         string `json:"icon"`
		SystemPrompt string `json:"system_prompt"`
	}
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body")
	}

	if err := h.skillRegistry.UpdateCustom(skillID, req.Name, req.Description, req.Category, req.Icon, req.SystemPrompt); err != nil {
		return errorResponse(c, http.StatusBadRequest, "UPDATE_FAILED", err.Error())
	}

	skill, _ := h.skillRegistry.Get(skillID)
	if skill == nil {
		return errorResponse(c, http.StatusNotFound, "SKILL_NOT_FOUND", "Skill not found")
	}

	return successResponse(c, skill.ToMeta())
}

// DeleteSkill 删除自定义 Skill
func (h *AgentChatHandler) DeleteSkill(c echo.Context) error {
	skillID := c.Param("skillId")
	if skillID == "" {
		return errorResponse(c, http.StatusBadRequest, "MISSING_SKILL_ID", "Skill ID is required")
	}
	if h.skillRegistry == nil {
		return errorResponse(c, http.StatusNotFound, "NO_REGISTRY", "Skill registry not available")
	}

	if err := h.skillRegistry.Delete(skillID); err != nil {
		return errorResponse(c, http.StatusBadRequest, "DELETE_FAILED", err.Error())
	}

	return successResponse(c, map[string]string{"message": "Skill deleted"})
}

// ========== Persona Endpoints ==========

// ListPersonas 列出可用的 AI Personas
func (h *AgentChatHandler) ListPersonas(c echo.Context) error {
	if h.personaRegistry == nil {
		return successResponse(c, []interface{}{})
	}
	return successResponse(c, h.personaRegistry.ListAll())
}

// GetPersona 获取单个 Persona 详情
func (h *AgentChatHandler) GetPersona(c echo.Context) error {
	personaID := c.Param("personaId")
	if personaID == "" {
		return errorResponse(c, http.StatusBadRequest, "MISSING_PERSONA_ID", "Persona ID is required")
	}
	if h.personaRegistry == nil {
		return errorResponse(c, http.StatusNotFound, "NO_REGISTRY", "Persona registry not available")
	}
	p, ok := h.personaRegistry.Get(personaID)
	if !ok {
		return errorResponse(c, http.StatusNotFound, "PERSONA_NOT_FOUND", "Persona not found")
	}
	return successResponse(c, p.ToMeta())
}

// CreatePersona 创建自定义 Persona
func (h *AgentChatHandler) CreatePersona(c echo.Context) error {
	if h.personaRegistry == nil {
		return errorResponse(c, http.StatusNotFound, "NO_REGISTRY", "Persona registry not available")
	}

	var req struct {
		ID           string                      `json:"id"`
		Name         string                      `json:"name"`
		Description  string                      `json:"description"`
		Icon         string                      `json:"icon"`
		Color        string                      `json:"color"`
		SystemPrompt string                      `json:"system_prompt"`
		Suggestions  []service.PersonaSuggestion `json:"suggestions"`
	}
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body")
	}
	if req.Name == "" {
		return errorResponse(c, http.StatusBadRequest, "MISSING_NAME", "Persona name is required")
	}
	if req.SystemPrompt == "" {
		return errorResponse(c, http.StatusBadRequest, "MISSING_PROMPT", "System prompt is required")
	}

	personaID := req.ID
	if personaID == "" {
		personaID = "custom_" + uuid.New().String()[:8]
	}

	if err := h.personaRegistry.RegisterCustom(personaID, req.Name, req.Description, req.Icon, req.Color, req.SystemPrompt, req.Suggestions); err != nil {
		return errorResponse(c, http.StatusConflict, "PERSONA_EXISTS", err.Error())
	}

	p, _ := h.personaRegistry.Get(personaID)
	if p == nil {
		return errorResponse(c, http.StatusInternalServerError, "CREATE_FAILED", "Failed to create persona")
	}

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"code":    "OK",
		"message": "Persona created",
		"data":    p.ToMeta(),
	})
}

// UpdatePersona 更新自定义 Persona
func (h *AgentChatHandler) UpdatePersona(c echo.Context) error {
	personaID := c.Param("personaId")
	if personaID == "" {
		return errorResponse(c, http.StatusBadRequest, "MISSING_PERSONA_ID", "Persona ID is required")
	}
	if h.personaRegistry == nil {
		return errorResponse(c, http.StatusNotFound, "NO_REGISTRY", "Persona registry not available")
	}

	var req struct {
		Name         string                      `json:"name"`
		Description  string                      `json:"description"`
		Icon         string                      `json:"icon"`
		Color        string                      `json:"color"`
		SystemPrompt string                      `json:"system_prompt"`
		Suggestions  []service.PersonaSuggestion `json:"suggestions"`
	}
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body")
	}

	if err := h.personaRegistry.UpdateCustom(personaID, req.Name, req.Description, req.Icon, req.Color, req.SystemPrompt, req.Suggestions); err != nil {
		return errorResponse(c, http.StatusBadRequest, "UPDATE_FAILED", err.Error())
	}

	p, _ := h.personaRegistry.Get(personaID)
	if p == nil {
		return errorResponse(c, http.StatusNotFound, "PERSONA_NOT_FOUND", "Persona not found")
	}

	return successResponse(c, p.ToMeta())
}

// DeletePersona 删除自定义 Persona
func (h *AgentChatHandler) DeletePersona(c echo.Context) error {
	personaID := c.Param("personaId")
	if personaID == "" {
		return errorResponse(c, http.StatusBadRequest, "MISSING_PERSONA_ID", "Persona ID is required")
	}
	if h.personaRegistry == nil {
		return errorResponse(c, http.StatusNotFound, "NO_REGISTRY", "Persona registry not available")
	}

	if err := h.personaRegistry.Delete(personaID); err != nil {
		return errorResponse(c, http.StatusBadRequest, "DELETE_FAILED", err.Error())
	}

	return successResponse(c, map[string]string{"message": "Persona deleted"})
}
