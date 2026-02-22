package handler

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/reverseai/server/internal/api/middleware"
	"github.com/reverseai/server/internal/domain/entity"
	"github.com/reverseai/server/internal/service"
	"github.com/reverseai/server/internal/vmruntime"
)

// VMDatabaseHandler 工作空间数据库处理器（SQLite via VMStore）
type VMDatabaseHandler struct {
	vmStore          *vmruntime.VMStore
	auditLogService  service.AuditLogService
	workspaceService service.WorkspaceService
}

// NewVMDatabaseHandler 创建 VMDatabaseHandler
func NewVMDatabaseHandler(
	vmStore *vmruntime.VMStore,
	auditLogService service.AuditLogService,
	workspaceService service.WorkspaceService,
) *VMDatabaseHandler {
	return &VMDatabaseHandler{
		vmStore:          vmStore,
		auditLogService:  auditLogService,
		workspaceService: workspaceService,
	}
}

func (h *VMDatabaseHandler) ensureAccess(c echo.Context, writeRequired bool) (string, string, error) {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return "", "", errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}
	workspaceID := c.Param("id")
	wsID, err := uuid.Parse(workspaceID)
	if err != nil {
		return "", "", errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}
	if h.workspaceService != nil {
		access, accessErr := h.workspaceService.GetWorkspaceAccess(c.Request().Context(), wsID, uid)
		if accessErr != nil {
			_ = errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此工作空间")
			return "", "", accessErr
		}
		// 访客（非成员、非 owner）只有只读权限，不允许执行写操作
		if writeRequired && !access.IsOwner && access.Role == nil {
			_ = errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无写入权限，仅 workspace 成员可执行此操作")
			return "", "", fmt.Errorf("write_forbidden")
		}
	}
	return workspaceID, userID, nil
}

// ListTables 获取表列表
func (h *VMDatabaseHandler) ListTables(c echo.Context) error {
	workspaceID, _, err := h.ensureAccess(c, false)
	if err != nil {
		return nil
	}

	tables, err := h.vmStore.ListTables(c.Request().Context(), workspaceID)
	if err != nil {
		return handleDBQueryError(c, err)
	}
	return successResponse(c, map[string]interface{}{
		"tables":  tables,
		"vm_mode": true,
	})
}

// GetTableSchema 获取表结构
func (h *VMDatabaseHandler) GetTableSchema(c echo.Context) error {
	workspaceID, _, err := h.ensureAccess(c, false)
	if err != nil {
		return nil
	}

	tableName := c.Param("table")
	if strings.TrimSpace(tableName) == "" {
		return errorResponse(c, http.StatusBadRequest, "INVALID_TABLE", "表名不能为空")
	}

	schema, err := h.vmStore.GetTableSchema(c.Request().Context(), workspaceID, tableName)
	if err != nil {
		return handleDBQueryError(c, err)
	}
	return successResponse(c, map[string]interface{}{
		"schema":  schema,
		"vm_mode": true,
	})
}

// CreateTableRequestBody 创建表请求体
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
}

// CreateIndexDefBody 索引定义请求体
type CreateIndexDefBody struct {
	Name    string   `json:"name"`
	Columns []string `json:"columns"`
	Unique  bool     `json:"unique"`
}

// CreateTable 创建表
func (h *VMDatabaseHandler) CreateTable(c echo.Context) error {
	workspaceID, userID, err := h.ensureAccess(c, true)
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

	columns := make([]vmruntime.VMCreateColumnDef, len(req.Columns))
	for i, col := range req.Columns {
		columns[i] = vmruntime.VMCreateColumnDef{
			Name:         col.Name,
			Type:         col.Type,
			Nullable:     col.Nullable,
			DefaultValue: col.DefaultValue,
			Unique:       col.Unique,
		}
	}
	indexes := make([]vmruntime.VMCreateIndexDef, len(req.Indexes))
	for i, idx := range req.Indexes {
		indexes[i] = vmruntime.VMCreateIndexDef{
			Name:    idx.Name,
			Columns: idx.Columns,
			Unique:  idx.Unique,
		}
	}

	if err := h.vmStore.CreateTable(c.Request().Context(), workspaceID, vmruntime.VMCreateTableRequest{
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
}

// AlterTable 修改表结构
func (h *VMDatabaseHandler) AlterTable(c echo.Context) error {
	workspaceID, userID, err := h.ensureAccess(c, true)
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

	addCols := make([]vmruntime.VMCreateColumnDef, len(req.AddColumns))
	for i, col := range req.AddColumns {
		addCols[i] = vmruntime.VMCreateColumnDef{
			Name:         col.Name,
			Type:         col.Type,
			Nullable:     col.Nullable,
			DefaultValue: col.DefaultValue,
			Unique:       col.Unique,
		}
	}
	alterCols := make([]vmruntime.VMAlterColumnDef, len(req.AlterColumns))
	for i, col := range req.AlterColumns {
		alterCols[i] = vmruntime.VMAlterColumnDef{
			Name:         col.Name,
			NewName:      col.NewName,
			Type:         col.Type,
			Nullable:     col.Nullable,
			DefaultValue: col.DefaultValue,
		}
	}

	if err := h.vmStore.AlterTable(c.Request().Context(), workspaceID, tableName, vmruntime.VMAlterTableRequest{
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
func (h *VMDatabaseHandler) DropTable(c echo.Context) error {
	workspaceID, userID, err := h.ensureAccess(c, true)
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

	if err := h.vmStore.DropTable(c.Request().Context(), workspaceID, tableName); err != nil {
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
func (h *VMDatabaseHandler) QueryRows(c echo.Context) error {
	workspaceID, _, err := h.ensureAccess(c, false)
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

// InsertRowRequestBody 插入行请求体
type InsertRowRequestBody struct {
	Data map[string]interface{} `json:"data"`
}

// InsertRow 插入行
func (h *VMDatabaseHandler) InsertRow(c echo.Context) error {
	workspaceID, _, err := h.ensureAccess(c, true)
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

	result, err := h.vmStore.InsertRow(c.Request().Context(), workspaceID, tableName, req.Data)
	if err != nil {
		return handleDBQueryError(c, err)
	}
	return successResponse(c, map[string]interface{}{
		"affected_rows": result.AffectedRows,
	})
}

// UpdateRowRequestBody 更新行请求体
type UpdateRowRequestBody struct {
	Data map[string]interface{} `json:"data"`
}

// UpdateRow 更新行
func (h *VMDatabaseHandler) UpdateRow(c echo.Context) error {
	workspaceID, _, err := h.ensureAccess(c, true)
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

	pkCols := make(map[string]interface{})
	dataCols := make(map[string]interface{})
	for k, v := range req.Data {
		if k == "id" {
			pkCols[k] = v
		} else {
			dataCols[k] = v
		}
	}
	if len(pkCols) == 0 {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "数据必须包含 'id' 字段")
	}
	result, err := h.vmStore.UpdateRow(c.Request().Context(), workspaceID, tableName, dataCols, pkCols)
	if err != nil {
		return handleDBQueryError(c, err)
	}
	return successResponse(c, map[string]interface{}{
		"affected_rows": result.AffectedRows,
	})
}

// DeleteRowsRequestBody 删除行请求体
type DeleteRowsRequestBody struct {
	IDs []interface{} `json:"ids"`
}

// DeleteRows 删除行
func (h *VMDatabaseHandler) DeleteRows(c echo.Context) error {
	workspaceID, _, err := h.ensureAccess(c, true)
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

	result, err := h.vmStore.DeleteRows(c.Request().Context(), workspaceID, tableName, req.IDs)
	if err != nil {
		return handleDBQueryError(c, err)
	}
	return successResponse(c, map[string]interface{}{
		"affected_rows": result.AffectedRows,
	})
}

// ExecuteSQLRequestBody 执行 SQL 请求体
type ExecuteSQLRequestBody struct {
	SQL    string        `json:"sql"`
	Params []interface{} `json:"params"`
}

// ExecuteSQL 执行 SQL
func (h *VMDatabaseHandler) ExecuteSQL(c echo.Context) error {
	workspaceID, userID, err := h.ensureAccess(c, true)
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

	result, err := h.vmStore.ExecuteSQL(c.Request().Context(), workspaceID, req.SQL, req.Params...)
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
func (h *VMDatabaseHandler) GetQueryHistory(c echo.Context) error {
	workspaceID, _, err := h.ensureAccess(c, false)
	if err != nil {
		return nil
	}

	history := h.vmStore.GetQueryHistory(c.Request().Context(), workspaceID)
	return successResponse(c, map[string]interface{}{
		"history": history,
	})
}

// GetStats 数据库统计
func (h *VMDatabaseHandler) GetStats(c echo.Context) error {
	workspaceID, _, err := h.ensureAccess(c, false)
	if err != nil {
		return nil
	}

	vmStats, err := h.vmStore.GetStats(c.Request().Context(), workspaceID)
	if err != nil {
		return handleDBQueryError(c, err)
	}
	return successResponse(c, map[string]interface{}{
		"stats": map[string]interface{}{
			"table_count":  vmStats.TableCount,
			"total_rows":   vmStats.TotalRows,
			"file_size_kb": vmStats.FileSizeKB,
			"index_count":  vmStats.IndexCount,
			"journal_mode": vmStats.JournalMode,
			"vm_mode":      true,
		},
	})
}

// GetSchemaGraph 表关系图
func (h *VMDatabaseHandler) GetSchemaGraph(c echo.Context) error {
	workspaceID, _, err := h.ensureAccess(c, false)
	if err != nil {
		return nil
	}

	graph, err := h.vmStore.GetSchemaGraph(c.Request().Context(), workspaceID)
	if err != nil {
		return handleDBQueryError(c, err)
	}
	return successResponse(c, map[string]interface{}{
		"graph":   graph,
		"vm_mode": true,
	})
}

func (h *VMDatabaseHandler) recordAudit(ctx echo.Context, workspaceID, userID string, action string, targetType string, targetID *uuid.UUID, metadata entity.JSON) {
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
	errMsg := "数据库查询失败"
	if err != nil {
		errMsg = err.Error()
	}
	if strings.Contains(errMsg, "no such table") {
		return errorResponse(c, http.StatusNotFound, "TABLE_NOT_FOUND", "表不存在")
	}
	return errorResponse(c, http.StatusInternalServerError, "QUERY_FAILED", errMsg)
}
