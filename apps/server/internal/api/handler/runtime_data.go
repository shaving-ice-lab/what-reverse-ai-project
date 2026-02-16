package handler

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/reverseai/server/internal/domain/entity"
	"github.com/reverseai/server/internal/service"
	"github.com/reverseai/server/internal/vmruntime"
)

// RuntimeDataHandler 公开访问的 Runtime 数据处理器
// 用于已发布的 Workspace App 通过 slug 访问数据库数据
type RuntimeDataHandler struct {
	runtimeService     service.RuntimeService
	vmStore            *vmruntime.VMStore
	vmPool             *vmruntime.VMPool
	rlsService         service.WorkspaceRLSService
	runtimeAuthService service.RuntimeAuthService
}

// NewRuntimeDataHandler 创建 Runtime 数据处理器
func NewRuntimeDataHandler(
	runtimeService service.RuntimeService,
	vmStore *vmruntime.VMStore,
	rlsService ...service.WorkspaceRLSService,
) *RuntimeDataHandler {
	h := &RuntimeDataHandler{
		runtimeService: runtimeService,
		vmStore:        vmStore,
	}
	if len(rlsService) > 0 {
		h.rlsService = rlsService[0]
	}
	return h
}

// SetRuntimeAuthService sets the runtime auth service for RLS user resolution
func (h *RuntimeDataHandler) SetRuntimeAuthService(authService service.RuntimeAuthService) {
	h.runtimeAuthService = authService
}

// SetVMPool sets the VM pool for data hook execution
func (h *RuntimeDataHandler) SetVMPool(pool *vmruntime.VMPool) {
	h.vmPool = pool
}

// rlsFilter is a local filter struct used by RLS resolution
type rlsFilter struct {
	Column   string
	Operator string
	Value    string
}

// getRLSFilters resolves RLS filters for the given table based on X-App-Token
func (h *RuntimeDataHandler) getRLSFilters(c echo.Context, workspaceID uuid.UUID, tableName string) ([]rlsFilter, error) {
	if h.rlsService == nil {
		return nil, nil
	}

	policies, err := h.rlsService.GetActivePoliciesForTable(c.Request().Context(), workspaceID, tableName)
	if err != nil || len(policies) == 0 {
		return nil, nil
	}

	// Resolve current app user from X-App-Token
	token := c.Request().Header.Get("X-App-Token")
	if token == "" {
		// No token but RLS policies exist — deny access by adding impossible filter
		return []rlsFilter{{Column: "1", Operator: "=", Value: "0"}}, nil
	}

	if h.runtimeAuthService == nil {
		return nil, nil
	}

	user, err := h.runtimeAuthService.ValidateSession(c.Request().Context(), token)
	if err != nil {
		// Invalid token with RLS — deny
		return []rlsFilter{{Column: "1", Operator: "=", Value: "0"}}, nil
	}

	var filters []rlsFilter
	for _, policy := range policies {
		var matchValue string
		switch policy.MatchField {
		case "app_user_id":
			matchValue = user.ID.String()
		case "email":
			matchValue = user.Email
		default:
			matchValue = user.ID.String()
		}
		filters = append(filters, rlsFilter{
			Column:   policy.Column,
			Operator: "=",
			Value:    matchValue,
		})
	}
	return filters, nil
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

	var filters []vmruntime.VMQueryFilter
	for i := 0; i < 20; i++ {
		col := c.QueryParam("filters[" + strconv.Itoa(i) + "][column]")
		op := c.QueryParam("filters[" + strconv.Itoa(i) + "][operator]")
		val := c.QueryParam("filters[" + strconv.Itoa(i) + "][value]")
		if col == "" {
			break
		}
		filters = append(filters, vmruntime.VMQueryFilter{Column: col, Operator: op, Value: val})
	}

	// Inject RLS filters
	wsUUID, _ := uuid.Parse(workspaceID)
	rlsFilters, _ := h.getRLSFilters(c, wsUUID, tableName)
	for _, f := range rlsFilters {
		filters = append(filters, vmruntime.VMQueryFilter{Column: f.Column, Operator: f.Operator, Value: f.Value})
	}

	filterCombinator := c.QueryParam("filter_combinator")

	result, err := h.vmStore.QueryRows(c.Request().Context(), workspaceID, tableName, vmruntime.VMQueryParams{
		Page:             page,
		PageSize:         pageSize,
		OrderBy:          orderBy,
		OrderDir:         orderDir,
		Filters:          filters,
		FilterCombinator: filterCombinator,
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

// ========== VM Data Hook System ==========

// hookResult represents the response from a VM data hook.
type hookResult struct {
	Allow   bool                   `json:"allow"`
	Data    map[string]interface{} `json:"data"`
	Error   string                 `json:"error"`
	Handled bool                   // true if a hook was found and executed
}

// callVMHook invokes a VM route like "POST /hooks/before-insert/:table" and returns the result.
// If no VM is loaded or the hook route doesn't exist, it returns a passthrough result (allow=true).
func (h *RuntimeDataHandler) callVMHook(ctx context.Context, workspaceID, hookType, tableName string, data map[string]interface{}) hookResult {
	if h.vmPool == nil {
		return hookResult{Allow: true}
	}

	vm, err := h.vmPool.GetOrCreate(ctx, workspaceID)
	if err != nil {
		// No VM deployed — passthrough
		return hookResult{Allow: true}
	}

	req := vmruntime.VMRequest{
		Method: "POST",
		Path:   "/hooks/" + hookType + "/" + tableName,
		Body: map[string]interface{}{
			"table": tableName,
			"data":  data,
		},
	}

	resp, err := vm.Handle(req)
	if err != nil {
		log.Printf("[DataHook] VM hook %s/%s error: %v", hookType, tableName, err)
		return hookResult{Allow: true}
	}

	// 404 means no hook registered — passthrough
	if resp.Status == 404 {
		return hookResult{Allow: true}
	}

	// Parse hook response
	bodyBytes, err := json.Marshal(resp.Body)
	if err != nil {
		return hookResult{Allow: true}
	}

	var hr hookResult
	if err := json.Unmarshal(bodyBytes, &hr); err != nil {
		// If the hook returned a non-standard response, treat as passthrough
		return hookResult{Allow: true}
	}
	hr.Handled = true

	// Default to allow if not explicitly set
	if !hr.Handled {
		hr.Allow = true
	}

	return hr
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

	// Before-insert hook
	hookRes := h.callVMHook(c.Request().Context(), workspaceID, "before-insert", tableName, req.Data)
	if hookRes.Handled && !hookRes.Allow {
		errMsg := hookRes.Error
		if errMsg == "" {
			errMsg = "Operation rejected by business rule"
		}
		return errorResponse(c, http.StatusBadRequest, "HOOK_REJECTED", errMsg)
	}
	// Hook can mutate data (e.g., auto-generate fields)
	if hookRes.Handled && hookRes.Data != nil {
		for k, v := range hookRes.Data {
			req.Data[k] = v
		}
	}

	result, err := h.vmStore.InsertRow(c.Request().Context(), workspaceID, tableName, req.Data)
	if err != nil {
		return handleDBQueryError(c, err)
	}

	// After-insert hook (fire-and-forget)
	go h.callVMHook(context.Background(), workspaceID, "after-insert", tableName, req.Data)

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

	// Before-update hook
	hookRes := h.callVMHook(c.Request().Context(), workspaceID, "before-update", tableName, req.Data)
	if hookRes.Handled && !hookRes.Allow {
		errMsg := hookRes.Error
		if errMsg == "" {
			errMsg = "Operation rejected by business rule"
		}
		return errorResponse(c, http.StatusBadRequest, "HOOK_REJECTED", errMsg)
	}
	if hookRes.Handled && hookRes.Data != nil {
		for k, v := range hookRes.Data {
			req.Data[k] = v
		}
	}

	pkCols := map[string]interface{}{}
	dataCols := map[string]interface{}{}
	for k, v := range req.Data {
		if k == "id" {
			pkCols[k] = v
		} else {
			dataCols[k] = v
		}
	}
	if len(pkCols) == 0 {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "Data must include 'id' field")
	}
	result, err := h.vmStore.UpdateRow(c.Request().Context(), workspaceID, tableName, dataCols, pkCols)
	if err != nil {
		return handleDBQueryError(c, err)
	}

	// After-update hook (fire-and-forget)
	go h.callVMHook(context.Background(), workspaceID, "after-update", tableName, req.Data)

	return successResponse(c, map[string]interface{}{
		"affected_rows": result.AffectedRows,
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

	result, err := h.vmStore.DeleteRows(c.Request().Context(), workspaceID, tableName, req.IDs)
	if err != nil {
		return handleDBQueryError(c, err)
	}

	return successResponse(c, map[string]interface{}{
		"affected_rows": result.AffectedRows,
	})
}
