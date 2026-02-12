package handler

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/reverseai/server/internal/domain/entity"
	"github.com/reverseai/server/internal/service"
)

// RuntimeDataHandler 公开访问的 Runtime 数据处理器
// 用于已发布的 Workspace App 通过 slug 访问数据库数据
type RuntimeDataHandler struct {
	runtimeService     service.RuntimeService
	queryService       service.WorkspaceDBQueryService
	rlsService         service.WorkspaceRLSService
	runtimeAuthService service.RuntimeAuthService
}

// NewRuntimeDataHandler 创建 Runtime 数据处理器
func NewRuntimeDataHandler(
	runtimeService service.RuntimeService,
	queryService service.WorkspaceDBQueryService,
	rlsService ...service.WorkspaceRLSService,
) *RuntimeDataHandler {
	h := &RuntimeDataHandler{
		runtimeService: runtimeService,
		queryService:   queryService,
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

// getRLSFilters resolves RLS filters for the given table based on X-App-Token
func (h *RuntimeDataHandler) getRLSFilters(c echo.Context, workspaceID uuid.UUID, tableName string) ([]service.QueryFilter, error) {
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
		return []service.QueryFilter{{Column: "1", Operator: "=", Value: "0"}}, nil
	}

	if h.runtimeAuthService == nil {
		return nil, nil
	}

	user, err := h.runtimeAuthService.ValidateSession(c.Request().Context(), token)
	if err != nil {
		// Invalid token with RLS — deny
		return []service.QueryFilter{{Column: "1", Operator: "=", Value: "0"}}, nil
	}

	var rlsFilters []service.QueryFilter
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
		rlsFilters = append(rlsFilters, service.QueryFilter{
			Column:   policy.Column,
			Operator: "=",
			Value:    matchValue,
		})
	}
	return rlsFilters, nil
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

	// Inject RLS filters
	wsUUID, _ := uuid.Parse(workspaceID)
	rlsFilters, _ := h.getRLSFilters(c, wsUUID, tableName)
	filters = append(filters, rlsFilters...)

	filterCombinator := c.QueryParam("filter_combinator")

	result, err := h.queryService.QueryRows(c.Request().Context(), workspaceID, tableName, service.QueryRowsParams{
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
