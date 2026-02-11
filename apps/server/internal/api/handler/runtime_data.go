package handler

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// RuntimeDataHandler 公开访问的 Runtime 数据处理器
// 用于已发布的 Workspace App 通过 slug 访问数据库数据
type RuntimeDataHandler struct {
	runtimeService   service.RuntimeService
	queryService     service.WorkspaceDBQueryService
	executionService service.ExecutionService
}

// NewRuntimeDataHandler 创建 Runtime 数据处理器
func NewRuntimeDataHandler(
	runtimeService service.RuntimeService,
	queryService service.WorkspaceDBQueryService,
	executionService service.ExecutionService,
) *RuntimeDataHandler {
	return &RuntimeDataHandler{
		runtimeService:   runtimeService,
		queryService:     queryService,
		executionService: executionService,
	}
}

// resolveWorkspaceID 通过 slug 解析已发布的 workspace ID
func (h *RuntimeDataHandler) resolveWorkspaceID(c echo.Context) (string, error) {
	slug := c.Param("workspaceSlug")
	if strings.TrimSpace(slug) == "" {
		return "", errorResponse(c, http.StatusBadRequest, "INVALID_SLUG", "Workspace slug is required")
	}

	entry, err := h.runtimeService.GetEntry(c.Request().Context(), slug, nil)
	if err != nil {
		return "", runtimeErrorResponse(c, err, "RUNTIME_FAILED", "Workspace not found or not published")
	}
	if entry == nil || entry.Workspace == nil {
		return "", errorResponse(c, http.StatusNotFound, "NOT_FOUND", "Workspace not found")
	}

	return entry.Workspace.ID.String(), nil
}

// resolveWorkspace 通过 slug 解析已发布的 workspace 实体
func (h *RuntimeDataHandler) resolveWorkspace(c echo.Context) (*entity.Workspace, error) {
	slug := c.Param("workspaceSlug")
	if strings.TrimSpace(slug) == "" {
		return nil, errorResponse(c, http.StatusBadRequest, "INVALID_SLUG", "Workspace slug is required")
	}

	entry, err := h.runtimeService.GetEntry(c.Request().Context(), slug, nil)
	if err != nil {
		return nil, runtimeErrorResponse(c, err, "RUNTIME_FAILED", "Workspace not found or not published")
	}
	if entry == nil || entry.Workspace == nil {
		return nil, errorResponse(c, http.StatusNotFound, "NOT_FOUND", "Workspace not found")
	}

	return entry.Workspace, nil
}

// QueryRows 查询表数据（公开访问）
func (h *RuntimeDataHandler) QueryRows(c echo.Context) error {
	workspaceID, err := h.resolveWorkspaceID(c)
	if err != nil {
		return nil
	}

	tableName := c.Param("table")
	if strings.TrimSpace(tableName) == "" {
		return errorResponse(c, http.StatusBadRequest, "INVALID_TABLE", "Table name is required")
	}

	page, _ := strconv.Atoi(c.QueryParam("page"))
	pageSize, _ := strconv.Atoi(c.QueryParam("page_size"))
	if pageSize <= 0 {
		pageSize = 50
	}
	if pageSize > 500 {
		pageSize = 500
	}
	orderBy := c.QueryParam("order_by")
	orderDir := c.QueryParam("order_dir")

	var filters []service.QueryFilter
	for i := 0; i < 20; i++ {
		col := c.QueryParam("filters[" + strconv.Itoa(i) + "][column]")
		op := c.QueryParam("filters[" + strconv.Itoa(i) + "][operator]")
		val := c.QueryParam("filters[" + strconv.Itoa(i) + "][value]")
		if col == "" {
			break
		}
		filters = append(filters, service.QueryFilter{
			Column:   col,
			Operator: op,
			Value:    val,
		})
	}

	result, err := h.queryService.QueryRows(c.Request().Context(), workspaceID, tableName, service.QueryRowsParams{
		Page:     page,
		PageSize: pageSize,
		OrderBy:  orderBy,
		OrderDir: orderDir,
		Filters:  filters,
	})
	if err != nil {
		return handleDBQueryError(c, err)
	}

	return successResponse(c, map[string]interface{}{
		"columns": result.Columns,
		"rows":    result.Rows,
		"total":   result.TotalCount,
	})
}

// InsertRow 插入行（公开访问 — 表单提交）
func (h *RuntimeDataHandler) InsertRow(c echo.Context) error {
	workspaceID, err := h.resolveWorkspaceID(c)
	if err != nil {
		return nil
	}

	tableName := c.Param("table")
	if strings.TrimSpace(tableName) == "" {
		return errorResponse(c, http.StatusBadRequest, "INVALID_TABLE", "Table name is required")
	}

	var req struct {
		Data map[string]interface{} `json:"data"`
	}
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body")
	}
	if len(req.Data) == 0 {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "Data cannot be empty")
	}

	result, err := h.queryService.InsertRow(c.Request().Context(), workspaceID, tableName, req.Data)
	if err != nil {
		return handleDBQueryError(c, err)
	}

	return successResponse(c, map[string]interface{}{
		"affected_rows": result.AffectedRows,
	})
}

// UpdateRow 更新行（公开访问）
func (h *RuntimeDataHandler) UpdateRow(c echo.Context) error {
	workspaceID, err := h.resolveWorkspaceID(c)
	if err != nil {
		return nil
	}

	tableName := c.Param("table")
	if strings.TrimSpace(tableName) == "" {
		return errorResponse(c, http.StatusBadRequest, "INVALID_TABLE", "Table name is required")
	}

	var req struct {
		Data map[string]interface{} `json:"data"`
	}
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body")
	}
	if len(req.Data) == 0 {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "Data cannot be empty")
	}

	result, err := h.queryService.UpdateRow(c.Request().Context(), workspaceID, tableName, req.Data)
	if err != nil {
		return handleDBQueryError(c, err)
	}

	return successResponse(c, map[string]interface{}{
		"affected_rows": result.AffectedRows,
	})
}

// ExecuteWorkflow 执行指定 workflow（公开访问 — 表单触发）
func (h *RuntimeDataHandler) ExecuteWorkflow(c echo.Context) error {
	workspace, err := h.resolveWorkspace(c)
	if err != nil {
		return nil
	}

	workflowIDStr := c.Param("workflowId")
	workflowID, err := uuid.Parse(workflowIDStr)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_WORKFLOW_ID", "Invalid workflow ID")
	}

	var req struct {
		Inputs      map[string]interface{} `json:"inputs"`
		TriggerType string                 `json:"trigger_type"`
	}
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body")
	}

	triggerType := strings.TrimSpace(req.TriggerType)
	if triggerType == "" {
		triggerType = "form_submit"
	}

	inputs := entity.JSON(req.Inputs)
	triggerData := entity.JSON{
		"source":       "runtime_app",
		"workspace_id": workspace.ID.String(),
	}

	execution, err := h.executionService.Execute(
		c.Request().Context(),
		workflowID,
		workspace.OwnerUserID,
		inputs,
		triggerType,
		triggerData,
	)
	if err != nil {
		switch err {
		case service.ErrWorkflowNotFound:
			return errorResponse(c, http.StatusNotFound, "WORKFLOW_NOT_FOUND", "Workflow not found")
		case service.ErrUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "No permission to execute workflow")
		default:
			return errorResponse(c, http.StatusInternalServerError, "EXECUTE_FAILED", "Workflow execution failed")
		}
	}

	return successResponse(c, map[string]interface{}{
		"execution_id": execution.ID,
		"status":       execution.Status,
	})
}

// DeleteRows 删除行（公开访问）
func (h *RuntimeDataHandler) DeleteRows(c echo.Context) error {
	workspaceID, err := h.resolveWorkspaceID(c)
	if err != nil {
		return nil
	}

	tableName := c.Param("table")
	if strings.TrimSpace(tableName) == "" {
		return errorResponse(c, http.StatusBadRequest, "INVALID_TABLE", "Table name is required")
	}

	var req struct {
		IDs []interface{} `json:"ids"`
	}
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body")
	}
	if len(req.IDs) == 0 {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "IDs cannot be empty")
	}

	result, err := h.queryService.DeleteRows(c.Request().Context(), workspaceID, tableName, req.IDs)
	if err != nil {
		return handleDBQueryError(c, err)
	}

	return successResponse(c, map[string]interface{}{
		"affected_rows": result.AffectedRows,
	})
}
