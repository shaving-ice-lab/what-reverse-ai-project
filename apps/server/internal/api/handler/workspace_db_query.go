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

// WorkspaceDBQueryHandler 工作空间数据库查询处理器
type WorkspaceDBQueryHandler struct {
	queryService    service.WorkspaceDBQueryService
	dbRuntime       service.WorkspaceDBRuntime
	auditLogService service.AuditLogService
}

// NewWorkspaceDBQueryHandler 创建工作空间数据库查询处理器
func NewWorkspaceDBQueryHandler(
	queryService service.WorkspaceDBQueryService,
	dbRuntime service.WorkspaceDBRuntime,
	auditLogService service.AuditLogService,
) *WorkspaceDBQueryHandler {
	return &WorkspaceDBQueryHandler{
		queryService:    queryService,
		dbRuntime:       dbRuntime,
		auditLogService: auditLogService,
	}
}

func (h *WorkspaceDBQueryHandler) ensureAccess(c echo.Context) (string, string, error) {
	userID := middleware.GetUserID(c)
	if _, err := uuid.Parse(userID); err != nil {
		return "", "", errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}
	workspaceID := c.Param("id")
	if _, err := uuid.Parse(workspaceID); err != nil {
		return "", "", errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}
	if err := h.dbRuntime.EnsureAccess(c.Request().Context(), workspaceID, userID); err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return "", "", errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return "", "", errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此工作空间数据库")
		default:
			return "", "", errorResponse(c, http.StatusInternalServerError, "ACCESS_CHECK_FAILED", "权限校验失败")
		}
	}
	return workspaceID, userID, nil
}

// ListTables 获取表列表
func (h *WorkspaceDBQueryHandler) ListTables(c echo.Context) error {
	workspaceID, _, err := h.ensureAccess(c)
	if err != nil {
		return nil
	}

	tables, err := h.queryService.ListTables(c.Request().Context(), workspaceID)
	if err != nil {
		return handleDBQueryError(c, err)
	}

	return successResponse(c, map[string]interface{}{
		"tables": tables,
	})
}

// GetTableSchema 获取表结构
func (h *WorkspaceDBQueryHandler) GetTableSchema(c echo.Context) error {
	workspaceID, _, err := h.ensureAccess(c)
	if err != nil {
		return nil
	}

	tableName := c.Param("table")
	if strings.TrimSpace(tableName) == "" {
		return errorResponse(c, http.StatusBadRequest, "INVALID_TABLE", "表名不能为空")
	}

	schema, err := h.queryService.GetTableSchema(c.Request().Context(), workspaceID, tableName)
	if err != nil {
		return handleDBQueryError(c, err)
	}

	return successResponse(c, map[string]interface{}{
		"schema": schema,
	})
}

// CreateTableRequest 创建表请求体
type CreateTableRequestBody struct {
	Name       string                `json:"name"`
	Columns    []CreateColumnDefBody `json:"columns"`
	PrimaryKey []string              `json:"primary_key"`
	Indexes    []CreateIndexDefBody  `json:"indexes"`
}

// CreateColumnDefBody 列定义请求体
type CreateColumnDefBody struct {
	Name         string  `json:"name"`
	Type         string  `json:"type"`
	Nullable     bool    `json:"nullable"`
	DefaultValue *string `json:"default_value"`
	Unique       bool    `json:"unique"`
	Comment      string  `json:"comment,omitempty"`
}

// CreateIndexDefBody 索引定义请求体
type CreateIndexDefBody struct {
	Name    string   `json:"name"`
	Columns []string `json:"columns"`
	Unique  bool     `json:"unique"`
}

// CreateTable 创建表
func (h *WorkspaceDBQueryHandler) CreateTable(c echo.Context) error {
	workspaceID, userID, err := h.ensureAccess(c)
	if err != nil {
		return nil
	}

	var req CreateTableRequestBody
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}
	if strings.TrimSpace(req.Name) == "" || len(req.Columns) == 0 {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "表名和列定义不能为空")
	}

	columns := make([]service.CreateColumnDef, len(req.Columns))
	for i, col := range req.Columns {
		columns[i] = service.CreateColumnDef{
			Name:         col.Name,
			Type:         col.Type,
			Nullable:     col.Nullable,
			DefaultValue: col.DefaultValue,
			Unique:       col.Unique,
			Comment:      col.Comment,
		}
	}
	indexes := make([]service.CreateIndexDef, len(req.Indexes))
	for i, idx := range req.Indexes {
		indexes[i] = service.CreateIndexDef{
			Name:    idx.Name,
			Columns: idx.Columns,
			Unique:  idx.Unique,
		}
	}

	if err := h.queryService.CreateTable(c.Request().Context(), workspaceID, service.CreateTableRequest{
		Name:       req.Name,
		Columns:    columns,
		PrimaryKey: req.PrimaryKey,
		Indexes:    indexes,
	}); err != nil {
		return handleDBQueryError(c, err)
	}

	h.recordAudit(c, workspaceID, userID, "workspace.db.table.create", "database_table", nil, entity.JSON{
		"table_name": req.Name,
	})

	return successResponse(c, map[string]interface{}{
		"message": "表创建成功",
		"table":   req.Name,
	})
}

// AlterTableRequestBody 修改表请求体
type AlterTableRequestBody struct {
	AddColumns   []CreateColumnDefBody `json:"add_columns,omitempty"`
	AlterColumns []AlterColumnDefBody  `json:"alter_columns,omitempty"`
	DropColumns  []string              `json:"drop_columns,omitempty"`
	Rename       string                `json:"rename,omitempty"`
}

// AlterColumnDefBody 修改列定义请求体
type AlterColumnDefBody struct {
	Name         string  `json:"name"`
	NewName      string  `json:"new_name,omitempty"`
	Type         string  `json:"type,omitempty"`
	Nullable     *bool   `json:"nullable,omitempty"`
	DefaultValue *string `json:"default_value,omitempty"`
	Comment      string  `json:"comment,omitempty"`
}

// AlterTable 修改表结构
func (h *WorkspaceDBQueryHandler) AlterTable(c echo.Context) error {
	workspaceID, userID, err := h.ensureAccess(c)
	if err != nil {
		return nil
	}

	tableName := c.Param("table")
	if strings.TrimSpace(tableName) == "" {
		return errorResponse(c, http.StatusBadRequest, "INVALID_TABLE", "表名不能为空")
	}

	var req AlterTableRequestBody
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	addCols := make([]service.CreateColumnDef, len(req.AddColumns))
	for i, col := range req.AddColumns {
		addCols[i] = service.CreateColumnDef{
			Name:         col.Name,
			Type:         col.Type,
			Nullable:     col.Nullable,
			DefaultValue: col.DefaultValue,
			Unique:       col.Unique,
			Comment:      col.Comment,
		}
	}
	alterCols := make([]service.AlterColumnDef, len(req.AlterColumns))
	for i, col := range req.AlterColumns {
		alterCols[i] = service.AlterColumnDef{
			Name:         col.Name,
			NewName:      col.NewName,
			Type:         col.Type,
			Nullable:     col.Nullable,
			DefaultValue: col.DefaultValue,
			Comment:      col.Comment,
		}
	}

	if err := h.queryService.AlterTable(c.Request().Context(), workspaceID, tableName, service.AlterTableRequest{
		AddColumns:   addCols,
		AlterColumns: alterCols,
		DropColumns:  req.DropColumns,
		Rename:       req.Rename,
	}); err != nil {
		return handleDBQueryError(c, err)
	}

	h.recordAudit(c, workspaceID, userID, "workspace.db.table.alter", "database_table", nil, entity.JSON{
		"table_name": tableName,
	})

	return successResponse(c, map[string]interface{}{
		"message": "表结构修改成功",
	})
}

// DropTableRequestBody 删除表请求体
type DropTableRequestBody struct {
	Confirm bool `json:"confirm"`
}

// DropTable 删除表
func (h *WorkspaceDBQueryHandler) DropTable(c echo.Context) error {
	workspaceID, userID, err := h.ensureAccess(c)
	if err != nil {
		return nil
	}

	tableName := c.Param("table")
	if strings.TrimSpace(tableName) == "" {
		return errorResponse(c, http.StatusBadRequest, "INVALID_TABLE", "表名不能为空")
	}

	var req DropTableRequestBody
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}
	if !req.Confirm {
		return errorResponse(c, http.StatusBadRequest, "CONFIRM_REQUIRED", "需要确认删除操作（confirm: true）")
	}

	if err := h.queryService.DropTable(c.Request().Context(), workspaceID, tableName); err != nil {
		return handleDBQueryError(c, err)
	}

	h.recordAudit(c, workspaceID, userID, "workspace.db.table.drop", "database_table", nil, entity.JSON{
		"table_name": tableName,
	})

	return successResponse(c, map[string]interface{}{
		"message": "表已删除",
	})
}

// QueryRows 查询行
func (h *WorkspaceDBQueryHandler) QueryRows(c echo.Context) error {
	workspaceID, _, err := h.ensureAccess(c)
	if err != nil {
		return nil
	}

	tableName := c.Param("table")
	if strings.TrimSpace(tableName) == "" {
		return errorResponse(c, http.StatusBadRequest, "INVALID_TABLE", "表名不能为空")
	}

	page, _ := strconv.Atoi(c.QueryParam("page"))
	pageSize, _ := strconv.Atoi(c.QueryParam("page_size"))
	orderBy := c.QueryParam("order_by")
	orderDir := c.QueryParam("order_dir")

	// Parse filters from query params: filters[0][column]=name&filters[0][operator]==&filters[0][value]=test
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

	return successResponseWithMeta(c, map[string]interface{}{
		"columns": result.Columns,
		"rows":    result.Rows,
	}, map[string]interface{}{
		"total":     result.TotalCount,
		"page":      page,
		"page_size": pageSize,
	})
}

// InsertRowRequestBody 插入行请求体
type InsertRowRequestBody struct {
	Data map[string]interface{} `json:"data"`
}

// InsertRow 插入行
func (h *WorkspaceDBQueryHandler) InsertRow(c echo.Context) error {
	workspaceID, _, err := h.ensureAccess(c)
	if err != nil {
		return nil
	}

	tableName := c.Param("table")
	if strings.TrimSpace(tableName) == "" {
		return errorResponse(c, http.StatusBadRequest, "INVALID_TABLE", "表名不能为空")
	}

	var req InsertRowRequestBody
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}
	if len(req.Data) == 0 {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "数据不能为空")
	}

	result, err := h.queryService.InsertRow(c.Request().Context(), workspaceID, tableName, req.Data)
	if err != nil {
		return handleDBQueryError(c, err)
	}

	return successResponse(c, map[string]interface{}{
		"affected_rows": result.AffectedRows,
		"duration_ms":   result.DurationMs,
	})
}

// UpdateRowRequestBody 更新行请求体
type UpdateRowRequestBody struct {
	Data map[string]interface{} `json:"data"`
}

// UpdateRow 更新行
func (h *WorkspaceDBQueryHandler) UpdateRow(c echo.Context) error {
	workspaceID, _, err := h.ensureAccess(c)
	if err != nil {
		return nil
	}

	tableName := c.Param("table")
	if strings.TrimSpace(tableName) == "" {
		return errorResponse(c, http.StatusBadRequest, "INVALID_TABLE", "表名不能为空")
	}

	var req UpdateRowRequestBody
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}
	if len(req.Data) == 0 {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "数据不能为空")
	}

	result, err := h.queryService.UpdateRow(c.Request().Context(), workspaceID, tableName, req.Data)
	if err != nil {
		return handleDBQueryError(c, err)
	}

	return successResponse(c, map[string]interface{}{
		"affected_rows": result.AffectedRows,
		"duration_ms":   result.DurationMs,
	})
}

// DeleteRowsRequestBody 删除行请求体
type DeleteRowsRequestBody struct {
	IDs []interface{} `json:"ids"`
}

// DeleteRows 删除行
func (h *WorkspaceDBQueryHandler) DeleteRows(c echo.Context) error {
	workspaceID, _, err := h.ensureAccess(c)
	if err != nil {
		return nil
	}

	tableName := c.Param("table")
	if strings.TrimSpace(tableName) == "" {
		return errorResponse(c, http.StatusBadRequest, "INVALID_TABLE", "表名不能为空")
	}

	var req DeleteRowsRequestBody
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}
	if len(req.IDs) == 0 {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "删除 ID 列表不能为空")
	}

	result, err := h.queryService.DeleteRows(c.Request().Context(), workspaceID, tableName, req.IDs)
	if err != nil {
		return handleDBQueryError(c, err)
	}

	return successResponse(c, map[string]interface{}{
		"affected_rows": result.AffectedRows,
		"duration_ms":   result.DurationMs,
	})
}

// ExecuteSQLRequestBody 执行 SQL 请求体
type ExecuteSQLRequestBody struct {
	SQL    string        `json:"sql"`
	Params []interface{} `json:"params"`
}

// ExecuteSQL 执行 SQL
func (h *WorkspaceDBQueryHandler) ExecuteSQL(c echo.Context) error {
	workspaceID, userID, err := h.ensureAccess(c)
	if err != nil {
		return nil
	}

	var req ExecuteSQLRequestBody
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}
	if strings.TrimSpace(req.SQL) == "" {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "SQL 不能为空")
	}

	result, err := h.queryService.ExecuteSQL(c.Request().Context(), workspaceID, req.SQL, req.Params)
	if err != nil {
		return handleDBQueryError(c, err)
	}

	h.recordAudit(c, workspaceID, userID, "workspace.db.query.execute", "database_query", nil, entity.JSON{
		"sql":           req.SQL,
		"affected_rows": result.AffectedRows,
		"duration_ms":   result.DurationMs,
	})

	return successResponse(c, map[string]interface{}{
		"columns":       result.Columns,
		"rows":          result.Rows,
		"affected_rows": result.AffectedRows,
		"duration_ms":   result.DurationMs,
	})
}

// GetQueryHistory 查询历史
func (h *WorkspaceDBQueryHandler) GetQueryHistory(c echo.Context) error {
	workspaceID, _, err := h.ensureAccess(c)
	if err != nil {
		return nil
	}

	history, err := h.queryService.GetQueryHistory(c.Request().Context(), workspaceID)
	if err != nil {
		return handleDBQueryError(c, err)
	}

	return successResponse(c, map[string]interface{}{
		"history": history,
	})
}

// GetStats 数据库统计
func (h *WorkspaceDBQueryHandler) GetStats(c echo.Context) error {
	workspaceID, _, err := h.ensureAccess(c)
	if err != nil {
		return nil
	}

	stats, err := h.queryService.GetDatabaseStats(c.Request().Context(), workspaceID)
	if err != nil {
		return handleDBQueryError(c, err)
	}

	return successResponse(c, map[string]interface{}{
		"stats": stats,
	})
}

// GetSchemaGraph 表关系图
func (h *WorkspaceDBQueryHandler) GetSchemaGraph(c echo.Context) error {
	workspaceID, _, err := h.ensureAccess(c)
	if err != nil {
		return nil
	}

	graph, err := h.queryService.GetSchemaGraph(c.Request().Context(), workspaceID)
	if err != nil {
		return handleDBQueryError(c, err)
	}

	return successResponse(c, map[string]interface{}{
		"graph": graph,
	})
}

func (h *WorkspaceDBQueryHandler) recordAudit(ctx echo.Context, workspaceID, userID string, action string, targetType string, targetID *uuid.UUID, metadata entity.JSON) {
	if h.auditLogService == nil {
		return
	}
	wsID, err := uuid.Parse(workspaceID)
	if err != nil {
		return
	}
	uid, err := uuid.Parse(userID)
	if err != nil {
		return
	}
	metadata = buildAuditMetadata(ctx, metadata)
	_, _ = h.auditLogService.Record(ctx.Request().Context(), service.AuditLogRecordRequest{
		WorkspaceID: wsID,
		ActorUserID: &uid,
		Action:      action,
		TargetType:  targetType,
		TargetID:    targetID,
		Metadata:    metadata,
	})
}

func handleDBQueryError(c echo.Context, err error) error {
	switch err {
	case service.ErrWorkspaceDBNotReady:
		return errorResponse(c, http.StatusConflict, "DB_NOT_READY", "工作空间数据库尚未就绪")
	case service.ErrWorkspaceDatabaseNotFound:
		return errorResponse(c, http.StatusNotFound, "DB_NOT_FOUND", "工作空间数据库不存在")
	case service.ErrWorkspaceDBQueryForbidden:
		return errorResponse(c, http.StatusForbidden, "SQL_FORBIDDEN", "SQL 包含禁止的操作")
	case service.ErrWorkspaceDBTableNotFound:
		return errorResponse(c, http.StatusNotFound, "TABLE_NOT_FOUND", "表不存在")
	case service.ErrWorkspaceDBTableExists:
		return errorResponse(c, http.StatusConflict, "TABLE_EXISTS", "表已存在")
	case service.ErrWorkspaceDBInvalidInput:
		return errorResponse(c, http.StatusBadRequest, "INVALID_INPUT", "输入参数无效")
	case service.ErrWorkspaceDBQueryTimeout:
		return errorResponse(c, http.StatusRequestTimeout, "QUERY_TIMEOUT", "查询超时")
	default:
		errMsg := "数据库查询失败"
		if err != nil {
			errMsg = err.Error()
		}
		return errorResponse(c, http.StatusInternalServerError, "QUERY_FAILED", errMsg)
	}
}
