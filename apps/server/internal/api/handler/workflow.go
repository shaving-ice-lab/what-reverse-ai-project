package handler

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/agentflow/server/internal/api/middleware"
	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/repository"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type WorkflowHandler struct {
	workflowService  service.WorkflowService
	executionService service.ExecutionService
	auditLogService  service.AuditLogService
	workspaceService service.WorkspaceService
}

func NewWorkflowHandler(workflowService service.WorkflowService, executionService service.ExecutionService, auditLogService service.AuditLogService, workspaceService service.WorkspaceService) *WorkflowHandler {
	return &WorkflowHandler{
		workflowService:  workflowService,
		executionService: executionService,
		auditLogService:  auditLogService,
		workspaceService: workspaceService,
	}
}

type CreateWorkflowRequest struct {
	Name        string                 `json:"name" validate:"required,max=200"`
	Description *string                `json:"description"`
	Definition  map[string]interface{} `json:"definition"`
	Variables   map[string]interface{} `json:"variables"`
}

type UpdateWorkflowRequest struct {
	Name          *string                `json:"name"`
	Description   *string                `json:"description"`
	Definition    map[string]interface{} `json:"definition"`
	Variables     map[string]interface{} `json:"variables"`
	TriggerType   *string                `json:"trigger_type"`
	TriggerConfig map[string]interface{} `json:"trigger_config"`
	Status        *string                `json:"status"`
}

type ExecuteRequest struct {
	Inputs      map[string]interface{} `json:"inputs"`
	TriggerType string                 `json:"trigger_type"`
}

type BatchDeleteRequest struct {
	IDs []string `json:"ids" validate:"required,min=1,max=100"`
}

type BatchArchiveWorkflowRequest struct {
	IDs []string `json:"ids" validate:"required,min=1,max=100"`
}

type BatchExportRequest struct {
	IDs []string `json:"ids" validate:"required,min=1,max=100"`
}

type ImportWorkflowRequest struct {
	Workflow WorkflowImportData `json:"workflow" validate:"required"`
	FolderID *string            `json:"folder_id"`
}

type WorkflowImportData struct {
	Name          string                 `json:"name"`
	Description   *string                `json:"description"`
	Icon          string                 `json:"icon"`
	Definition    map[string]interface{} `json:"definition"`
	Variables     map[string]interface{} `json:"variables"`
	TriggerType   string                 `json:"trigger_type"`
	TriggerConfig map[string]interface{} `json:"trigger_config"`
}

// List 获取工作流列表
func (h *WorkflowHandler) List(c echo.Context) error {
	userID := middleware.GetUserID(c)
	id, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	page, _ := strconv.Atoi(c.QueryParam("page"))
	pageSize, _ := strconv.Atoi(c.QueryParam("page_size"))
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}

	params := repository.ListParams{
		Page:     page,
		PageSize: pageSize,
		Search:   c.QueryParam("search"),
		Status:   c.QueryParam("status"),
		Sort:     c.QueryParam("sort"),
		Order:    c.QueryParam("order"),
	}

	workflows, total, err := h.workflowService.List(c.Request().Context(), id, params)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取列表失败")
	}

	return successResponseWithMeta(c, workflows, map[string]interface{}{
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// Create 创建工作流
func (h *WorkflowHandler) Create(c echo.Context) error {
	userID := middleware.GetUserID(c)
	id, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var req CreateWorkflowRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	workflow, err := h.workflowService.Create(c.Request().Context(), id, service.CreateWorkflowRequest{
		Name:        req.Name,
		Description: req.Description,
		Definition:  entity.JSON(req.Definition),
		Variables:   entity.JSON(req.Variables),
	})
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "CREATE_FAILED", "创建失败")
	}

	return successResponse(c, workflow)
}

// Get 获取工作流详情
func (h *WorkflowHandler) Get(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作流 ID 无效")
	}

	workflow, err := h.workflowService.GetByID(c.Request().Context(), id)
	if err != nil {
		return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作流不存在")
	}

	return successResponse(c, workflow)
}

// Update 更新工作流
func (h *WorkflowHandler) Update(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作流 ID 无效")
	}

	var req UpdateWorkflowRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	var definition *entity.JSON
	if req.Definition != nil {
		def := entity.JSON(req.Definition)
		definition = &def
	}

	var variables *entity.JSON
	if req.Variables != nil {
		vars := entity.JSON(req.Variables)
		variables = &vars
	}

	var triggerConfig *entity.JSON
	if req.TriggerConfig != nil {
		cfg := entity.JSON(req.TriggerConfig)
		triggerConfig = &cfg
	}

	workflow, err := h.workflowService.Update(c.Request().Context(), id, uid, service.UpdateWorkflowRequest{
		Name:          req.Name,
		Description:   req.Description,
		Definition:    definition,
		Variables:     variables,
		TriggerType:   req.TriggerType,
		TriggerConfig: triggerConfig,
		Status:        req.Status,
	})
	if err != nil {
		switch err {
		case service.ErrExecutionOverloaded:
			return errorResponse(c, http.StatusServiceUnavailable, "OVERLOADED", "系统繁忙，请稍后重试")
		case service.ErrWorkflowNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作流不存在")
		case service.ErrUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限修改")
		default:
			return errorResponse(c, http.StatusInternalServerError, "UPDATE_FAILED", "更新失败")
		}
	}

	return successResponse(c, workflow)
}

// Delete 删除工作流
func (h *WorkflowHandler) Delete(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作流 ID 无效")
	}

	if err := h.workflowService.Delete(c.Request().Context(), id, uid); err != nil {
		switch err {
		case service.ErrWorkflowNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作流不存在")
		case service.ErrUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限删除")
		default:
			return errorResponse(c, http.StatusInternalServerError, "DELETE_FAILED", "删除失败")
		}
	}

	return successResponse(c, map[string]string{"message": "删除成功"})
}

// Execute 执行工作流
func (h *WorkflowHandler) Execute(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workflowID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作流 ID 无效")
	}

	var req ExecuteRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	// 设置默认触发类型
	triggerType := req.TriggerType
	if triggerType == "" {
		triggerType = "manual"
	}

	// 转换输入为 entity.JSON
	inputs := entity.JSON(req.Inputs)

	execution, err := h.executionService.Execute(c.Request().Context(), workflowID, uid, inputs, triggerType, nil)
	if err != nil {
		switch err {
		case service.ErrWorkflowNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作流不存在")
		case service.ErrUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限执行此工作流")
		default:
			return errorResponse(c, http.StatusInternalServerError, "EXECUTE_FAILED", "执行失败: "+err.Error())
		}
	}

	return successResponse(c, map[string]interface{}{
		"execution_id": execution.ID,
		"status":       execution.Status,
		"workflow_id":  execution.WorkflowID,
		"started_at":   execution.StartedAt,
		"message":      "工作流已开始执行",
	})
}

// Duplicate 复制工作流
func (h *WorkflowHandler) Duplicate(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作流 ID 无效")
	}

	workflow, err := h.workflowService.Duplicate(c.Request().Context(), id, uid)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "DUPLICATE_FAILED", "复制失败")
	}

	return successResponse(c, workflow)
}

// BatchDelete 批量删除工作流
func (h *WorkflowHandler) BatchDelete(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var req BatchDeleteRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	if len(req.IDs) == 0 {
		return errorResponse(c, http.StatusBadRequest, "IDS_REQUIRED", "请选择要删除的工作流")
	}

	// 转换 ID
	ids := make([]uuid.UUID, len(req.IDs))
	for i, idStr := range req.IDs {
		parsed, err := uuid.Parse(idStr)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作流 ID 无效: "+idStr)
		}
		ids[i] = parsed
	}

	count, err := h.workflowService.BatchDelete(c.Request().Context(), ids, uid)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "BATCH_DELETE_FAILED", "批量删除失败")
	}

	return successResponse(c, map[string]interface{}{
		"success": true,
		"deleted": count,
		"message": "成功删除工作流",
	})
}

// BatchArchive 批量归档工作流
func (h *WorkflowHandler) BatchArchive(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var req BatchArchiveWorkflowRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	if len(req.IDs) == 0 {
		return errorResponse(c, http.StatusBadRequest, "IDS_REQUIRED", "请选择要归档的工作流")
	}

	// 转换 ID
	ids := make([]uuid.UUID, len(req.IDs))
	for i, idStr := range req.IDs {
		parsed, err := uuid.Parse(idStr)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作流 ID 无效: "+idStr)
		}
		ids[i] = parsed
	}

	count, err := h.workflowService.BatchArchive(c.Request().Context(), ids, uid)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "BATCH_ARCHIVE_FAILED", "批量归档失败")
	}

	return successResponse(c, map[string]interface{}{
		"success":  true,
		"archived": count,
		"message":  "成功归档工作流",
	})
}

// Export 导出单个工作流
func (h *WorkflowHandler) Export(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作流 ID 无效")
	}

	exportData, err := h.workflowService.Export(c.Request().Context(), id, uid)
	if err != nil {
		switch err {
		case service.ErrWorkflowNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作流不存在")
		case service.ErrUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限导出")
		default:
			return errorResponse(c, http.StatusInternalServerError, "EXPORT_FAILED", "导出失败")
		}
	}

	return successResponse(c, exportData)
}

// BatchExport 批量导出工作流
func (h *WorkflowHandler) BatchExport(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var req BatchExportRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	if len(req.IDs) == 0 {
		return errorResponse(c, http.StatusBadRequest, "IDS_REQUIRED", "请选择要导出的工作流")
	}

	// 转换 ID
	ids := make([]uuid.UUID, len(req.IDs))
	for i, idStr := range req.IDs {
		parsed, err := uuid.Parse(idStr)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作流 ID 无效: "+idStr)
		}
		ids[i] = parsed
	}

	exports, err := h.workflowService.BatchExport(c.Request().Context(), ids, uid)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "BATCH_EXPORT_FAILED", "批量导出失败")
	}

	return successResponse(c, map[string]interface{}{
		"workflows": exports,
		"count":     len(exports),
	})
}

// Import 导入工作流
func (h *WorkflowHandler) Import(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var req ImportWorkflowRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	if err := validateJSONSchemaPayload(req, workflowImportSchema); err != nil {
		h.recordImportFailure(c, uid, req, err)
		return errorResponse(c, http.StatusBadRequest, "IMPORT_SCHEMA_INVALID", "导入数据格式不符合要求")
	}

	// 解析文件夹ID
	var folderID *uuid.UUID
	if req.FolderID != nil && *req.FolderID != "" {
		parsed, err := uuid.Parse(*req.FolderID)
		if err != nil {
			h.recordImportFailure(c, uid, req, err)
			return errorResponse(c, http.StatusBadRequest, "INVALID_FOLDER_ID", "文件夹 ID 无效")
		}
		folderID = &parsed
	}

	importData := &service.WorkflowImport{
		Workflow: service.WorkflowData{
			Name:          req.Workflow.Name,
			Description:   req.Workflow.Description,
			Icon:          req.Workflow.Icon,
			Definition:    entity.JSON(req.Workflow.Definition),
			Variables:     entity.JSON(req.Workflow.Variables),
			TriggerType:   req.Workflow.TriggerType,
			TriggerConfig: entity.JSON(req.Workflow.TriggerConfig),
		},
		FolderID: folderID,
	}

	workflow, err := h.workflowService.Import(c.Request().Context(), uid, importData)
	if err != nil {
		h.recordImportFailure(c, uid, req, err)
		return errorResponse(c, http.StatusInternalServerError, "IMPORT_FAILED", "导入失败")
	}

	metadata := entity.JSON{
		"workflow_id":   workflow.ID.String(),
		"workflow_name": workflow.Name,
	}
	if workflow.FolderID != nil {
		metadata["folder_id"] = workflow.FolderID.String()
	}
	h.recordAudit(c, workflow.WorkspaceID, uid, "workflow.import", "workflow", &workflow.ID, metadata)

	return successResponse(c, map[string]interface{}{
		"workflow": workflow,
		"message":  "工作流导入成功",
	})
}

func (h *WorkflowHandler) recordAudit(ctx echo.Context, workspaceID uuid.UUID, actorID uuid.UUID, action string, targetType string, targetID *uuid.UUID, metadata entity.JSON) {
	if h.auditLogService == nil {
		return
	}
	_, _ = h.auditLogService.Record(ctx.Request().Context(), service.AuditLogRecordRequest{
		WorkspaceID: workspaceID,
		ActorUserID: &actorID,
		Action:      action,
		TargetType:  targetType,
		TargetID:    targetID,
		Metadata:    metadata,
	})
}

func (h *WorkflowHandler) recordImportFailure(ctx echo.Context, actorID uuid.UUID, req ImportWorkflowRequest, err error) {
	if h.auditLogService == nil || h.workspaceService == nil {
		return
	}
	workspace, werr := h.workspaceService.EnsureDefaultWorkspaceByUserID(ctx.Request().Context(), actorID)
	if werr != nil {
		return
	}
	metadata := entity.JSON{
		"status": "failed",
		"error":  err.Error(),
	}
	if req.Workflow.Name != "" {
		metadata["workflow_name"] = req.Workflow.Name
	}
	if req.FolderID != nil && strings.TrimSpace(*req.FolderID) != "" {
		metadata["folder_id"] = strings.TrimSpace(*req.FolderID)
	}
	h.recordAudit(ctx, workspace.ID, actorID, "workflow.import", "workflow", nil, metadata)
}
