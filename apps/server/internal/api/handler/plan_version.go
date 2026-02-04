package handler

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/agentflow/server/internal/api/middleware"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// PlanVersionHandler 规划版本处理器
type PlanVersionHandler struct {
	planVersionService service.PlanVersionService
}

// NewPlanVersionHandler 创建规划版本处理器
func NewPlanVersionHandler(planVersionService service.PlanVersionService) *PlanVersionHandler {
	return &PlanVersionHandler{
		planVersionService: planVersionService,
	}
}

type createPlanVersionPayload struct {
	WorkspaceID string  `json:"workspace_id"`
	Label       *string `json:"label"`
	Note        *string `json:"note"`
}

type planVersionSummary struct {
	ID          string  `json:"id"`
	WorkspaceID string  `json:"workspace_id"`
	Label       *string `json:"label,omitempty"`
	Note        *string `json:"note,omitempty"`
	CreatedBy   *string `json:"created_by,omitempty"`
	CreatedAt   string  `json:"created_at"`
}

type planRestoreResult struct {
	Modules int `json:"modules"`
	Tasks   int `json:"tasks"`
}

// ListVersions 获取规划版本列表
func (h *PlanVersionHandler) ListVersions(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID := strings.TrimSpace(c.QueryParam("workspace_id"))
	if workspaceID == "" {
		return errorResponse(c, http.StatusBadRequest, "WORKSPACE_ID_REQUIRED", "工作空间 ID 不能为空")
	}
	wsID, err := uuid.Parse(workspaceID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_WORKSPACE_ID", "工作空间 ID 无效")
	}

	limit := 0
	if raw := strings.TrimSpace(c.QueryParam("limit")); raw != "" {
		parsed, err := strconv.Atoi(raw)
		if err != nil || parsed < 0 {
			return errorResponse(c, http.StatusBadRequest, "INVALID_LIMIT", "limit 参数无效")
		}
		limit = parsed
	}

	versions, err := h.planVersionService.ListVersions(c.Request().Context(), uid, wsID, limit)
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问规划版本")
		default:
			return errorResponse(c, http.StatusInternalServerError, "PLAN_VERSION_LIST_FAILED", "获取规划版本失败")
		}
	}

	summaries := make([]planVersionSummary, 0, len(versions))
	for _, version := range versions {
		var createdBy *string
		if version.CreatedBy != nil {
			value := version.CreatedBy.String()
			createdBy = &value
		}
		summaries = append(summaries, planVersionSummary{
			ID:          version.ID.String(),
			WorkspaceID: version.WorkspaceID.String(),
			Label:       version.Label,
			Note:        version.Note,
			CreatedBy:   createdBy,
			CreatedAt:   version.CreatedAt.Format(time.RFC3339),
		})
	}

	return successResponse(c, map[string]interface{}{
		"versions": summaries,
		"total":    len(summaries),
	})
}

// CreateVersion 创建规划版本快照
func (h *PlanVersionHandler) CreateVersion(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var req createPlanVersionPayload
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}
	if strings.TrimSpace(req.WorkspaceID) == "" {
		return errorResponse(c, http.StatusBadRequest, "WORKSPACE_ID_REQUIRED", "工作空间 ID 不能为空")
	}
	wsID, err := uuid.Parse(req.WorkspaceID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_WORKSPACE_ID", "工作空间 ID 无效")
	}

	version, err := h.planVersionService.CreateVersion(c.Request().Context(), uid, wsID, service.CreatePlanVersionRequest{
		Label: req.Label,
		Note:  req.Note,
	})
	if err != nil {
		switch err {
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限创建规划版本")
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		default:
			return errorResponse(c, http.StatusInternalServerError, "PLAN_VERSION_CREATE_FAILED", "创建规划版本失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"version": version,
	})
}

// GetVersion 获取规划版本详情
func (h *PlanVersionHandler) GetVersion(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	versionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_VERSION_ID", "版本 ID 无效")
	}

	version, err := h.planVersionService.GetVersion(c.Request().Context(), uid, versionID)
	if err != nil {
		switch err {
		case service.ErrPlanVersionNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "规划版本不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限查看规划版本")
		default:
			return errorResponse(c, http.StatusInternalServerError, "PLAN_VERSION_GET_FAILED", "获取规划版本失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"version": version,
	})
}

// RestoreVersion 恢复/回滚规划版本
func (h *PlanVersionHandler) RestoreVersion(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	versionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_VERSION_ID", "版本 ID 无效")
	}

	result, err := h.planVersionService.RestoreVersion(c.Request().Context(), uid, versionID)
	if err != nil {
		switch err {
		case service.ErrPlanVersionNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "规划版本不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限恢复规划版本")
		default:
			return errorResponse(c, http.StatusInternalServerError, "PLAN_VERSION_RESTORE_FAILED", "恢复规划版本失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"restored": planRestoreResult{
			Modules: result.Modules,
			Tasks:   result.Tasks,
		},
	})
}
