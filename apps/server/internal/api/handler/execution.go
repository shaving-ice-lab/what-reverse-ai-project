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

type ExecutionHandler struct {
	executionService service.ExecutionService
}

func NewExecutionHandler(executionService service.ExecutionService) *ExecutionHandler {
	return &ExecutionHandler{executionService: executionService}
}

// ListRequest 执行记录列表请求
type ListExecutionsRequest struct {
	WorkflowID string `query:"workflow_id"`
	Status     string `query:"status"`
	Page       int    `query:"page"`
	PageSize   int    `query:"page_size"`
	Sort       string `query:"sort"`
	Order      string `query:"order"`
}

// List 获取执行记录列表
// @Summary 获取执行记录列表
// @Tags Executions
// @Security BearerAuth
// @Param workflow_id query string false "工作流ID"
// @Param status query string false "状态筛选"
// @Param page query int false "页码" default(1)
// @Param page_size query int false "每页数量" default(20)
// @Success 200 {object} map[string]interface{}
// @Router /executions [get]
func (h *ExecutionHandler) List(c echo.Context) error {
	userID := middleware.GetUserID(c)
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusUnauthorized, "INVALID_USER", "无效的用户ID")
	}

	// 解析查询参数
	page, _ := strconv.Atoi(c.QueryParam("page"))
	if page <= 0 {
		page = 1
	}
	pageSize, _ := strconv.Atoi(c.QueryParam("page_size"))
	if pageSize <= 0 {
		pageSize = 20
	}

	params := repository.ExecutionListParams{
		Status:   c.QueryParam("status"),
		Page:     page,
		PageSize: pageSize,
		Sort:     c.QueryParam("sort"),
		Order:    c.QueryParam("order"),
	}

	// 如果指定了工作流ID
	if workflowIDStr := c.QueryParam("workflow_id"); workflowIDStr != "" {
		workflowID, err := uuid.Parse(workflowIDStr)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_WORKFLOW_ID", "无效的工作流ID")
		}
		params.WorkflowID = &workflowID
	}

	executions, total, err := h.executionService.List(c.Request().Context(), userUUID, params)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取执行记录失败")
	}

	return successResponseWithMeta(c, executions, map[string]interface{}{
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// Get 获取执行详情
// @Summary 获取执行详情
// @Tags Executions
// @Security BearerAuth
// @Param id path string true "执行ID"
// @Success 200 {object} map[string]interface{}
// @Router /executions/{id} [get]
func (h *ExecutionHandler) Get(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "无效的执行ID")
	}

	execution, nodeLogs, err := h.executionService.GetByID(c.Request().Context(), id)
	if err != nil {
		return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "执行记录不存在")
	}

	return successResponse(c, map[string]interface{}{
		"execution": execution,
		"nodeLogs":  nodeLogs,
	})
}

// Cancel 取消执行
// @Summary 取消执行
// @Tags Executions
// @Security BearerAuth
// @Param id path string true "执行ID"
// @Success 200 {object} map[string]interface{}
// @Router /executions/{id}/cancel [post]
func (h *ExecutionHandler) Cancel(c echo.Context) error {
	userID := middleware.GetUserID(c)
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusUnauthorized, "INVALID_USER", "无效的用户ID")
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "无效的执行ID")
	}

	if err := h.executionService.Cancel(c.Request().Context(), id, userUUID); err != nil {
		switch err {
		case service.ErrExecutionNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "执行记录不存在")
		case service.ErrUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限取消此执行")
		case service.ErrCannotCancel:
			return errorResponse(c, http.StatusBadRequest, "CANNOT_CANCEL", "当前状态无法取消")
		default:
			return errorResponse(c, http.StatusInternalServerError, "CANCEL_FAILED", "取消执行失败")
		}
	}

	return successResponse(c, map[string]string{
		"message": "执行已取消",
	})
}

// Retry 重试执行
// @Summary 重试执行
// @Tags Executions
// @Security BearerAuth
// @Param id path string true "执行ID"
// @Success 200 {object} map[string]interface{}
// @Router /executions/{id}/retry [post]
func (h *ExecutionHandler) Retry(c echo.Context) error {
	userID := middleware.GetUserID(c)
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusUnauthorized, "INVALID_USER", "无效的用户ID")
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "无效的执行ID")
	}

	execution, err := h.executionService.Retry(c.Request().Context(), id, userUUID)
	if err != nil {
		switch err {
		case service.ErrExecutionNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "执行记录不存在")
		case service.ErrUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限重试此执行")
		case service.ErrCannotRetry:
			return errorResponse(c, http.StatusBadRequest, "CANNOT_RETRY", "当前状态无法重试")
		default:
			return errorResponse(c, http.StatusInternalServerError, "RETRY_FAILED", "重试执行失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"message":   "重试已开始",
		"execution": execution,
	})
}
