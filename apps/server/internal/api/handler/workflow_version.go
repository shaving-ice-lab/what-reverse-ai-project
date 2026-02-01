package handler

import (
	"net/http"
	"strconv"

	"github.com/agentflow/server/internal/api/middleware"
	"github.com/agentflow/server/internal/repository"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type WorkflowVersionHandler struct {
	versionService service.WorkflowVersionService
}

func NewWorkflowVersionHandler(versionService service.WorkflowVersionService) *WorkflowVersionHandler {
	return &WorkflowVersionHandler{versionService: versionService}
}

type RestoreVersionRequest struct {
	ChangeLog string `json:"change_log"`
}

type CreateSnapshotRequest struct {
	ChangeLog string `json:"change_log" validate:"required"`
}

// List 获取版本历史列表
func (h *WorkflowVersionHandler) List(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workflowID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作流 ID 无效")
	}

	page, _ := strconv.Atoi(c.QueryParam("page"))
	pageSize, _ := strconv.Atoi(c.QueryParam("page_size"))
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}

	params := repository.VersionListParams{
		Page:     page,
		PageSize: pageSize,
	}

	versions, total, err := h.versionService.List(c.Request().Context(), workflowID, uid, params)
	if err != nil {
		switch err {
		case service.ErrWorkflowNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作流不存在")
		case service.ErrUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此工作流")
		default:
			return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取版本历史失败")
		}
	}

	return successResponseWithMeta(c, map[string]interface{}{
		"versions": versions,
	}, map[string]interface{}{
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// Get 获取指定版本详情
func (h *WorkflowVersionHandler) Get(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workflowID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作流 ID 无效")
	}

	version, err := strconv.Atoi(c.Param("version"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_VERSION", "版本号无效")
	}

	v, err := h.versionService.GetVersion(c.Request().Context(), workflowID, version, uid)
	if err != nil {
		switch err {
		case service.ErrWorkflowNotFound:
			return errorResponse(c, http.StatusNotFound, "WORKFLOW_NOT_FOUND", "工作流不存在")
		case service.ErrVersionNotFound:
			return errorResponse(c, http.StatusNotFound, "VERSION_NOT_FOUND", "版本不存在")
		case service.ErrUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此工作流")
		default:
			return errorResponse(c, http.StatusInternalServerError, "GET_FAILED", "获取版本详情失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"version": v,
	})
}

// Restore 恢复到指定版本
func (h *WorkflowVersionHandler) Restore(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workflowID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作流 ID 无效")
	}

	version, err := strconv.Atoi(c.Param("version"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_VERSION", "版本号无效")
	}

	var req RestoreVersionRequest
	if err := c.Bind(&req); err != nil {
		// 允许没有请求体
		req = RestoreVersionRequest{}
	}

	workflow, err := h.versionService.RestoreVersion(c.Request().Context(), workflowID, version, uid, req.ChangeLog)
	if err != nil {
		switch err {
		case service.ErrWorkflowNotFound:
			return errorResponse(c, http.StatusNotFound, "WORKFLOW_NOT_FOUND", "工作流不存在")
		case service.ErrVersionNotFound:
			return errorResponse(c, http.StatusNotFound, "VERSION_NOT_FOUND", "版本不存在")
		case service.ErrUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限修改此工作流")
		default:
			return errorResponse(c, http.StatusInternalServerError, "RESTORE_FAILED", "恢复版本失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"workflow": workflow,
		"message":  "版本恢复成功",
	})
}

// Compare 对比两个版本
func (h *WorkflowVersionHandler) Compare(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workflowID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作流 ID 无效")
	}

	v1, err := strconv.Atoi(c.QueryParam("v1"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_V1", "版本1无效")
	}

	v2, err := strconv.Atoi(c.QueryParam("v2"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_V2", "版本2无效")
	}

	diff, err := h.versionService.CompareVersions(c.Request().Context(), workflowID, v1, v2, uid)
	if err != nil {
		switch err {
		case service.ErrWorkflowNotFound:
			return errorResponse(c, http.StatusNotFound, "WORKFLOW_NOT_FOUND", "工作流不存在")
		case service.ErrVersionNotFound:
			return errorResponse(c, http.StatusNotFound, "VERSION_NOT_FOUND", "版本不存在")
		case service.ErrUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此工作流")
		default:
			return errorResponse(c, http.StatusInternalServerError, "COMPARE_FAILED", "版本对比失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"diff": diff,
	})
}

// CreateSnapshot 手动创建版本快照
func (h *WorkflowVersionHandler) CreateSnapshot(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workflowID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作流 ID 无效")
	}

	var req CreateSnapshotRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	version, err := h.versionService.CreateSnapshot(c.Request().Context(), workflowID, uid, req.ChangeLog)
	if err != nil {
		switch err {
		case service.ErrWorkflowNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作流不存在")
		case service.ErrUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限修改此工作流")
		default:
			return errorResponse(c, http.StatusInternalServerError, "CREATE_FAILED", "创建快照失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"version": version,
		"message": "快照创建成功",
	})
}
