package handler

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/agentflow/server/internal/api/middleware"
	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// AuditLogHandler 审计日志处理器
type AuditLogHandler struct {
	auditLogService  service.AuditLogService
	workspaceService service.WorkspaceService
}

// NewAuditLogHandler 创建审计日志处理器
func NewAuditLogHandler(auditLogService service.AuditLogService, workspaceService service.WorkspaceService) *AuditLogHandler {
	return &AuditLogHandler{
		auditLogService:  auditLogService,
		workspaceService: workspaceService,
	}
}

// ClientAuditLogRequest 客户端审计记录请求
type ClientAuditLogRequest struct {
	Action     string                 `json:"action"`
	TargetType string                 `json:"target_type"`
	TargetID   *string                `json:"target_id"`
	Metadata   map[string]interface{} `json:"metadata"`
}

var allowedClientAuditActions = map[string]string{
	"workflow.import":         "workflow",
	"app.schema.import":       "workspace_version",
	"workspace.schema.import": "workspace_version",
}

// List 获取工作空间审计日志
func (h *AuditLogHandler) List(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	page, _ := strconv.Atoi(c.QueryParam("page"))
	pageSize, _ := strconv.Atoi(c.QueryParam("page_size"))

	var actorID *uuid.UUID
	if actorParam := c.QueryParam("actor_user_id"); actorParam != "" {
		parsed, err := uuid.Parse(actorParam)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_ACTOR_ID", "操作人 ID 无效")
		}
		actorID = &parsed
	}

	var actions []string
	if actionsParam := strings.TrimSpace(c.QueryParam("actions")); actionsParam != "" {
		for _, value := range strings.Split(actionsParam, ",") {
			if trimmed := strings.TrimSpace(value); trimmed != "" {
				actions = append(actions, trimmed)
			}
		}
	}

	logs, total, err := h.auditLogService.ListByWorkspace(c.Request().Context(), uid, workspaceID, service.AuditLogListParams{
		ActorUserID: actorID,
		Action:      c.QueryParam("action"),
		Actions:     actions,
		TargetType:  c.QueryParam("target_type"),
		Page:        page,
		PageSize:    pageSize,
	})
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限查看审计日志")
		default:
			return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取审计日志失败")
		}
	}

	return successResponseWithMeta(c, logs, map[string]interface{}{
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// RecordClient 记录客户端校验失败审计日志
func (h *AuditLogHandler) RecordClient(c echo.Context) error {
	if h.auditLogService == nil {
		return errorResponse(c, http.StatusServiceUnavailable, "AUDIT_UNAVAILABLE", "审计服务不可用")
	}
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}
	if h.workspaceService == nil {
		return errorResponse(c, http.StatusServiceUnavailable, "WORKSPACE_UNAVAILABLE", "工作空间服务不可用")
	}
	if _, err := h.workspaceService.GetWorkspaceAccess(c.Request().Context(), workspaceID, uid); err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此工作空间")
		default:
			return errorResponse(c, http.StatusInternalServerError, "ACCESS_FAILED", "无法验证工作空间权限")
		}
	}

	var req ClientAuditLogRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	action := strings.TrimSpace(req.Action)
	expectedTargetType, allowed := allowedClientAuditActions[action]
	if !allowed {
		return errorResponse(c, http.StatusBadRequest, "ACTION_NOT_ALLOWED", "不允许的审计操作")
	}

	targetType := strings.TrimSpace(req.TargetType)
	if targetType == "" {
		targetType = expectedTargetType
	}
	if targetType != expectedTargetType {
		return errorResponse(c, http.StatusBadRequest, "TARGET_TYPE_INVALID", "目标类型无效")
	}

	var targetID *uuid.UUID
	if req.TargetID != nil && strings.TrimSpace(*req.TargetID) != "" {
		parsed, err := uuid.Parse(strings.TrimSpace(*req.TargetID))
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_TARGET_ID", "目标 ID 无效")
		}
		targetID = &parsed
	}

	metadata := sanitizeClientAuditMetadata(req.Metadata)
	metadata["status"] = "failed"
	if _, ok := metadata["source"]; !ok {
		metadata["source"] = "client_validation"
	}

	_, err = h.auditLogService.Record(c.Request().Context(), service.AuditLogRecordRequest{
		WorkspaceID: workspaceID,
		ActorUserID: &uid,
		Action:      action,
		TargetType:  targetType,
		TargetID:    targetID,
		Metadata:    metadata,
	})
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "AUDIT_RECORD_FAILED", "记录审计日志失败")
	}

	return successResponse(c, map[string]interface{}{
		"recorded": true,
	})
}

func sanitizeClientAuditMetadata(metadata map[string]interface{}) entity.JSON {
	if metadata == nil {
		return entity.JSON{}
	}
	allowedKeys := map[string]int{
		"error":            500,
		"file_name":        200,
		"workflow_name":    200,
		"workflow_id":      36,
		"workspace_id":     36,
		"source":           50,
		"validation_stage": 50,
	}
	result := entity.JSON{}
	for key, maxLen := range allowedKeys {
		value, ok := metadata[key]
		if !ok {
			continue
		}
		if str, ok := value.(string); ok {
			trimmed := strings.TrimSpace(str)
			if trimmed == "" {
				continue
			}
			if len(trimmed) > maxLen {
				trimmed = trimmed[:maxLen]
			}
			result[key] = trimmed
		}
	}
	return result
}
