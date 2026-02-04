package handler

import (
	"net/http"
	"strings"

	"github.com/agentflow/server/internal/api/middleware"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// PlanModuleHandler 规划模块处理器
type PlanModuleHandler struct {
	planModuleService service.PlanModuleService
}

// NewPlanModuleHandler 创建规划模块处理器
func NewPlanModuleHandler(planModuleService service.PlanModuleService) *PlanModuleHandler {
	return &PlanModuleHandler{
		planModuleService: planModuleService,
	}
}

type createPlanModulePayload struct {
	WorkspaceID string  `json:"workspace_id"`
	Key         *string `json:"key"`
	Name        string  `json:"name"`
	Description *string `json:"description"`
	Version     *string `json:"version"`
	Status      *string `json:"status"`
	SortOrder   *int    `json:"sort_order"`
}

type updatePlanModulePayload struct {
	Key         *string `json:"key"`
	Name        *string `json:"name"`
	Description *string `json:"description"`
	Version     *string `json:"version"`
	Status      *string `json:"status"`
	SortOrder   *int    `json:"sort_order"`
}

type createPlanTaskPayload struct {
	Code         *string  `json:"code"`
	Title        string   `json:"title"`
	Phase        *string  `json:"phase"`
	Owner        *string  `json:"owner"`
	Deliverable  *string  `json:"deliverable"`
	Acceptance   *string  `json:"acceptance"`
	EstimateDays *int     `json:"estimate_days"`
	Status       *string  `json:"status"`
	Dependencies []string `json:"dependencies"`
	Sequence     *int     `json:"sequence"`
}

type updatePlanTaskPayload struct {
	Code         *string   `json:"code"`
	Title        *string   `json:"title"`
	Phase        *string   `json:"phase"`
	Owner        *string   `json:"owner"`
	Deliverable  *string   `json:"deliverable"`
	Acceptance   *string   `json:"acceptance"`
	EstimateDays *int      `json:"estimate_days"`
	Status       *string   `json:"status"`
	Dependencies *[]string `json:"dependencies"`
	Sequence     *int      `json:"sequence"`
}

type reorderPlanTasksPayload struct {
	TaskIDs []string `json:"task_ids"`
}

type seedPlanModulesPayload struct {
	WorkspaceID string `json:"workspace_id"`
}

// ListModules 获取规划模块列表（含任务）
func (h *PlanModuleHandler) ListModules(c echo.Context) error {
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

	modules, err := h.planModuleService.ListModules(c.Request().Context(), uid, wsID)
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此工作空间")
		default:
			return errorResponse(c, http.StatusInternalServerError, "PLAN_LIST_FAILED", "获取规划模块失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"modules": modules,
		"total":   len(modules),
	})
}

// CreateModule 创建规划模块
func (h *PlanModuleHandler) CreateModule(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var req createPlanModulePayload
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

	module, err := h.planModuleService.CreateModule(c.Request().Context(), uid, service.CreatePlanModuleRequest{
		WorkspaceID: wsID,
		Key:         req.Key,
		Name:        req.Name,
		Description: req.Description,
		Version:     req.Version,
		Status:      req.Status,
		SortOrder:   req.SortOrder,
	})
	if err != nil {
		switch err {
		case service.ErrPlanInvalidInput:
			return errorResponse(c, http.StatusBadRequest, "INVALID_INPUT", "模块信息无效")
		case service.ErrPlanModuleKeyExists:
			return errorResponse(c, http.StatusConflict, "KEY_EXISTS", "模块 Key 已存在")
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限编辑规划模块")
		default:
			return errorResponse(c, http.StatusInternalServerError, "PLAN_CREATE_FAILED", "创建规划模块失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"module": module,
	})
}

// UpdateModule 更新规划模块
func (h *PlanModuleHandler) UpdateModule(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	moduleID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_MODULE_ID", "模块 ID 无效")
	}

	var req updatePlanModulePayload
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	module, err := h.planModuleService.UpdateModule(c.Request().Context(), uid, moduleID, service.UpdatePlanModuleRequest{
		Key:         req.Key,
		Name:        req.Name,
		Description: req.Description,
		Version:     req.Version,
		Status:      req.Status,
		SortOrder:   req.SortOrder,
	})
	if err != nil {
		switch err {
		case service.ErrPlanModuleNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "规划模块不存在")
		case service.ErrPlanInvalidInput:
			return errorResponse(c, http.StatusBadRequest, "INVALID_INPUT", "模块信息无效")
		case service.ErrPlanModuleKeyExists:
			return errorResponse(c, http.StatusConflict, "KEY_EXISTS", "模块 Key 已存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限编辑规划模块")
		default:
			return errorResponse(c, http.StatusInternalServerError, "PLAN_UPDATE_FAILED", "更新规划模块失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"module": module,
	})
}

// DeleteModule 删除规划模块
func (h *PlanModuleHandler) DeleteModule(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	moduleID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_MODULE_ID", "模块 ID 无效")
	}

	if err := h.planModuleService.DeleteModule(c.Request().Context(), uid, moduleID); err != nil {
		switch err {
		case service.ErrPlanModuleNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "规划模块不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限删除规划模块")
		default:
			return errorResponse(c, http.StatusInternalServerError, "PLAN_DELETE_FAILED", "删除规划模块失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"deleted": true,
	})
}

// CreateTask 创建规划任务
func (h *PlanModuleHandler) CreateTask(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	moduleID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_MODULE_ID", "模块 ID 无效")
	}

	var req createPlanTaskPayload
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	task, err := h.planModuleService.CreateTask(c.Request().Context(), uid, moduleID, service.CreatePlanTaskRequest{
		Code:         req.Code,
		Title:        req.Title,
		Phase:        req.Phase,
		Owner:        req.Owner,
		Deliverable:  req.Deliverable,
		Acceptance:   req.Acceptance,
		EstimateDays: req.EstimateDays,
		Status:       req.Status,
		Dependencies: req.Dependencies,
		Sequence:     req.Sequence,
	})
	if err != nil {
		switch err {
		case service.ErrPlanModuleNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "规划模块不存在")
		case service.ErrPlanInvalidInput:
			return errorResponse(c, http.StatusBadRequest, "INVALID_INPUT", "任务信息无效")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限编辑规划任务")
		default:
			return errorResponse(c, http.StatusInternalServerError, "TASK_CREATE_FAILED", "创建规划任务失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"task": task,
	})
}

// UpdateTask 更新规划任务
func (h *PlanModuleHandler) UpdateTask(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	taskID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_TASK_ID", "任务 ID 无效")
	}

	var req updatePlanTaskPayload
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	task, err := h.planModuleService.UpdateTask(c.Request().Context(), uid, taskID, service.UpdatePlanTaskRequest{
		Code:         req.Code,
		Title:        req.Title,
		Phase:        req.Phase,
		Owner:        req.Owner,
		Deliverable:  req.Deliverable,
		Acceptance:   req.Acceptance,
		EstimateDays: req.EstimateDays,
		Status:       req.Status,
		Dependencies: req.Dependencies,
		Sequence:     req.Sequence,
	})
	if err != nil {
		switch err {
		case service.ErrPlanTaskNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "规划任务不存在")
		case service.ErrPlanInvalidInput:
			return errorResponse(c, http.StatusBadRequest, "INVALID_INPUT", "任务信息无效")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限编辑规划任务")
		default:
			return errorResponse(c, http.StatusInternalServerError, "TASK_UPDATE_FAILED", "更新规划任务失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"task": task,
	})
}

// DeleteTask 删除规划任务
func (h *PlanModuleHandler) DeleteTask(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	taskID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_TASK_ID", "任务 ID 无效")
	}

	if err := h.planModuleService.DeleteTask(c.Request().Context(), uid, taskID); err != nil {
		switch err {
		case service.ErrPlanTaskNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "规划任务不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限删除规划任务")
		default:
			return errorResponse(c, http.StatusInternalServerError, "TASK_DELETE_FAILED", "删除规划任务失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"deleted": true,
	})
}

// ReorderTasks 任务排序
func (h *PlanModuleHandler) ReorderTasks(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	moduleID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_MODULE_ID", "模块 ID 无效")
	}

	var req reorderPlanTasksPayload
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}
	if len(req.TaskIDs) == 0 {
		return errorResponse(c, http.StatusBadRequest, "TASK_IDS_REQUIRED", "任务 ID 列表不能为空")
	}

	taskIDs := make([]uuid.UUID, 0, len(req.TaskIDs))
	for _, raw := range req.TaskIDs {
		parsed, err := uuid.Parse(raw)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_TASK_ID", "任务 ID 无效")
		}
		taskIDs = append(taskIDs, parsed)
	}

	if err := h.planModuleService.ReorderTasks(c.Request().Context(), uid, moduleID, taskIDs); err != nil {
		switch err {
		case service.ErrPlanModuleNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "规划模块不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限调整任务顺序")
		default:
			return errorResponse(c, http.StatusInternalServerError, "TASK_REORDER_FAILED", "调整任务顺序失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"reordered": true,
	})
}

// SeedModules 导入默认规划模块
func (h *PlanModuleHandler) SeedModules(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var req seedPlanModulesPayload
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

	modules, err := h.planModuleService.SeedModules(c.Request().Context(), uid, wsID)
	if err != nil {
		switch err {
		case service.ErrPlanAlreadySeeded:
			return errorResponse(c, http.StatusConflict, "ALREADY_SEEDED", "规划模块已初始化")
		case service.ErrPlanSeedUnavailable:
			return errorResponse(c, http.StatusServiceUnavailable, "SEED_UNAVAILABLE", "默认模板不可用")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限初始化规划模块")
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		default:
			return errorResponse(c, http.StatusInternalServerError, "PLAN_SEED_FAILED", "初始化规划模块失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"modules": modules,
		"total":   len(modules),
	})
}
