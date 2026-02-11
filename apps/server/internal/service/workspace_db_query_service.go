package service

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"
)

// SQL 安全沙箱常量
const (
	queryTimeoutSeconds = 30
	queryMaxRows        = 1000
	queryHistoryMax     = 100
)

// 禁止执行的 SQL 关键字
var forbiddenSQLKeywords = []string{
	"DROP DATABASE",
	"DROP SCHEMA",
	"GRANT ",
	"REVOKE ",
	"CREATE USER",
	"ALTER USER",
	"DROP USER",
	"FLUSH PRIVILEGES",
}

var (
	ErrWorkspaceDBQueryForbidden = errors.New("workspace db query contains forbidden statement")
	ErrWorkspaceDBQueryTimeout   = errors.New("workspace db query timeout")
	ErrWorkspaceDBTableNotFound  = errors.New("workspace db table not found")
	ErrWorkspaceDBTableExists    = errors.New("workspace db table already exists")
	ErrWorkspaceDBInvalidInput   = errors.New("workspace db invalid input")
)

// DatabaseTable 表信息
type DatabaseTable struct {
	Name        string `json:"name"`
	RowCountEst int64  `json:"row_count_est"`
	DataSize    int64  `json:"data_size"`
	ColumnCount int    `json:"column_count"`
	UpdateTime  string `json:"update_time,omitempty"`
}

// TableColumn 列定义
type TableColumn struct {
	Name         string  `json:"name"`
	Type         string  `json:"type"`
	Nullable     bool    `json:"nullable"`
	DefaultValue *string `json:"default_value"`
	IsPrimaryKey bool    `json:"is_primary_key"`
	IsUnique     bool    `json:"is_unique"`
	Extra        string  `json:"extra,omitempty"`
	Comment      string  `json:"comment,omitempty"`
	OrdinalPos   int     `json:"ordinal_position"`
}

// TableIndex 索引信息
type TableIndex struct {
	Name      string   `json:"name"`
	Columns   []string `json:"columns"`
	IsUnique  bool     `json:"is_unique"`
	IsPrimary bool     `json:"is_primary"`
	Type      string   `json:"type"`
}

// ForeignKey 外键信息
type ForeignKey struct {
	Name             string `json:"name"`
	Column           string `json:"column"`
	ReferencedTable  string `json:"referenced_table"`
	ReferencedColumn string `json:"referenced_column"`
	OnUpdate         string `json:"on_update"`
	OnDelete         string `json:"on_delete"`
}

// TableSchema 表结构详情
type TableSchema struct {
	Name        string        `json:"name"`
	Columns     []TableColumn `json:"columns"`
	Indexes     []TableIndex  `json:"indexes"`
	ForeignKeys []ForeignKey  `json:"foreign_keys"`
	PrimaryKey  []string      `json:"primary_key"`
	DDL         string        `json:"ddl"`
}

// CreateTableRequest 创建表请求
type CreateTableRequest struct {
	Name       string            `json:"name"`
	Columns    []CreateColumnDef `json:"columns"`
	PrimaryKey []string          `json:"primary_key"`
	Indexes    []CreateIndexDef  `json:"indexes"`
}

// CreateColumnDef 创建列定义
type CreateColumnDef struct {
	Name         string  `json:"name"`
	Type         string  `json:"type"`
	Nullable     bool    `json:"nullable"`
	DefaultValue *string `json:"default_value"`
	Unique       bool    `json:"unique"`
	Comment      string  `json:"comment,omitempty"`
}

// CreateIndexDef 创建索引定义
type CreateIndexDef struct {
	Name    string   `json:"name"`
	Columns []string `json:"columns"`
	Unique  bool     `json:"unique"`
}

// AlterTableRequest 修改表请求
type AlterTableRequest struct {
	AddColumns   []CreateColumnDef `json:"add_columns,omitempty"`
	AlterColumns []AlterColumnDef  `json:"alter_columns,omitempty"`
	DropColumns  []string          `json:"drop_columns,omitempty"`
	Rename       string            `json:"rename,omitempty"`
}

// AlterColumnDef 修改列定义
type AlterColumnDef struct {
	Name         string  `json:"name"`
	NewName      string  `json:"new_name,omitempty"`
	Type         string  `json:"type,omitempty"`
	Nullable     *bool   `json:"nullable,omitempty"`
	DefaultValue *string `json:"default_value,omitempty"`
	Comment      string  `json:"comment,omitempty"`
}

// QueryRowsParams 查询行参数
type QueryRowsParams struct {
	Page             int           `json:"page"`
	PageSize         int           `json:"page_size"`
	OrderBy          string        `json:"order_by"`
	OrderDir         string        `json:"order_dir"`
	Filters          []QueryFilter `json:"filters"`
	FilterCombinator string        `json:"filter_combinator"`
}

// QueryFilter 查询过滤条件
type QueryFilter struct {
	Column   string `json:"column"`
	Operator string `json:"operator"`
	Value    string `json:"value"`
}

// QueryResult SQL 查询结果
type QueryResult struct {
	Columns      []string                 `json:"columns"`
	Rows         []map[string]interface{} `json:"rows"`
	AffectedRows int64                    `json:"affected_rows"`
	DurationMs   int64                    `json:"duration_ms"`
	TotalCount   int64                    `json:"total_count,omitempty"`
}

// QueryHistoryItem 查询历史条目
type QueryHistoryItem struct {
	SQL        string `json:"sql"`
	DurationMs int64  `json:"duration_ms"`
	Status     string `json:"status"`
	CreatedAt  string `json:"created_at"`
	Error      string `json:"error,omitempty"`
}

// DatabaseStats 数据库统计
type DatabaseStats struct {
	TableCount      int   `json:"table_count"`
	TotalRows       int64 `json:"total_rows"`
	TotalSizeBytes  int64 `json:"total_size_bytes"`
	ConnectionCount int   `json:"connection_count"`
}

// SchemaGraphData 表关系图数据
type SchemaGraphData struct {
	Nodes []SchemaGraphNode `json:"nodes"`
	Edges []SchemaGraphEdge `json:"edges"`
}

// SchemaGraphNode 图节点（表）
type SchemaGraphNode struct {
	ID      string        `json:"id"`
	Name    string        `json:"name"`
	Columns []TableColumn `json:"columns"`
}

// SchemaGraphEdge 图边（外键）
type SchemaGraphEdge struct {
	ID             string `json:"id"`
	Source         string `json:"source"`
	Target         string `json:"target"`
	SourceColumn   string `json:"source_column"`
	TargetColumn   string `json:"target_column"`
	ConstraintName string `json:"constraint_name"`
}

// WorkspaceDBQueryService 工作空间数据库查询服务接口
type WorkspaceDBQueryService interface {
	ListTables(ctx context.Context, workspaceID string) ([]DatabaseTable, error)
	GetTableSchema(ctx context.Context, workspaceID, tableName string) (*TableSchema, error)
	CreateTable(ctx context.Context, workspaceID string, req CreateTableRequest) error
	AlterTable(ctx context.Context, workspaceID, tableName string, req AlterTableRequest) error
	DropTable(ctx context.Context, workspaceID, tableName string) error
	QueryRows(ctx context.Context, workspaceID, tableName string, params QueryRowsParams) (*QueryResult, error)
	InsertRow(ctx context.Context, workspaceID, tableName string, data map[string]interface{}) (*QueryResult, error)
	UpdateRow(ctx context.Context, workspaceID, tableName string, data map[string]interface{}) (*QueryResult, error)
	DeleteRows(ctx context.Context, workspaceID, tableName string, ids []interface{}) (*QueryResult, error)
	ExecuteSQL(ctx context.Context, workspaceID, sqlStr string, params []interface{}) (*QueryResult, error)
	GetQueryHistory(ctx context.Context, workspaceID string) ([]QueryHistoryItem, error)
	GetDatabaseStats(ctx context.Context, workspaceID string) (*DatabaseStats, error)
	GetSchemaGraph(ctx context.Context, workspaceID string) (*SchemaGraphData, error)
}

type workspaceDBQueryService struct {
	dbRuntime    WorkspaceDBRuntime
	queryHistory map[string][]QueryHistoryItem
}

// NewWorkspaceDBQueryService 创建工作空间数据库查询服务
func NewWorkspaceDBQueryService(dbRuntime WorkspaceDBRuntime) WorkspaceDBQueryService {
	return &workspaceDBQueryService{
		dbRuntime:    dbRuntime,
		queryHistory: make(map[string][]QueryHistoryItem),
	}
}

func (s *workspaceDBQueryService) getConn(ctx context.Context, workspaceID string) (*sql.DB, error) {
	return s.dbRuntime.GetConnection(ctx, workspaceID)
}

func (s *workspaceDBQueryService) ListTables(ctx context.Context, workspaceID string) ([]DatabaseTable, error) {
	db, err := s.getConn(ctx, workspaceID)
	if err != nil {
		return nil, err
	}

	rows, err := db.QueryContext(ctx, `
		SELECT 
			TABLE_NAME,
			IFNULL(TABLE_ROWS, 0),
			IFNULL(DATA_LENGTH + INDEX_LENGTH, 0),
			(SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS c WHERE c.TABLE_SCHEMA = t.TABLE_SCHEMA AND c.TABLE_NAME = t.TABLE_NAME),
			IFNULL(UPDATE_TIME, CREATE_TIME)
		FROM INFORMATION_SCHEMA.TABLES t
		WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'
		ORDER BY TABLE_NAME
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	tables := []DatabaseTable{}
	for rows.Next() {
		var t DatabaseTable
		var updateTime sql.NullString
		if err := rows.Scan(&t.Name, &t.RowCountEst, &t.DataSize, &t.ColumnCount, &updateTime); err != nil {
			return nil, err
		}
		if updateTime.Valid {
			t.UpdateTime = updateTime.String
		}
		tables = append(tables, t)
	}
	return tables, rows.Err()
}

func (s *workspaceDBQueryService) GetTableSchema(ctx context.Context, workspaceID, tableName string) (*TableSchema, error) {
	if !isSafeIdentifier(tableName) {
		return nil, ErrWorkspaceDBInvalidInput
	}

	db, err := s.getConn(ctx, workspaceID)
	if err != nil {
		return nil, err
	}

	schema := &TableSchema{Name: tableName}

	// Columns
	colRows, err := db.QueryContext(ctx, `
		SELECT 
			COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT,
			COLUMN_KEY, EXTRA, COLUMN_COMMENT, ORDINAL_POSITION
		FROM INFORMATION_SCHEMA.COLUMNS
		WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
		ORDER BY ORDINAL_POSITION
	`, tableName)
	if err != nil {
		return nil, err
	}
	defer colRows.Close()

	for colRows.Next() {
		var col TableColumn
		var nullable, columnKey string
		var defaultVal sql.NullString
		if err := colRows.Scan(&col.Name, &col.Type, &nullable, &defaultVal, &columnKey, &col.Extra, &col.Comment, &col.OrdinalPos); err != nil {
			return nil, err
		}
		col.Nullable = strings.ToUpper(nullable) == "YES"
		if defaultVal.Valid {
			col.DefaultValue = &defaultVal.String
		}
		col.IsPrimaryKey = columnKey == "PRI"
		col.IsUnique = columnKey == "UNI" || columnKey == "PRI"
		if col.IsPrimaryKey {
			schema.PrimaryKey = append(schema.PrimaryKey, col.Name)
		}
		schema.Columns = append(schema.Columns, col)
	}
	if err := colRows.Err(); err != nil {
		return nil, err
	}

	if len(schema.Columns) == 0 {
		return nil, ErrWorkspaceDBTableNotFound
	}

	// Indexes
	idxRows, err := db.QueryContext(ctx, `
		SELECT 
			INDEX_NAME, COLUMN_NAME, NON_UNIQUE, INDEX_TYPE
		FROM INFORMATION_SCHEMA.STATISTICS
		WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
		ORDER BY INDEX_NAME, SEQ_IN_INDEX
	`, tableName)
	if err != nil {
		return nil, err
	}
	defer idxRows.Close()

	idxMap := make(map[string]*TableIndex)
	idxOrder := []string{}
	for idxRows.Next() {
		var idxName, colName, idxType string
		var nonUnique int
		if err := idxRows.Scan(&idxName, &colName, &nonUnique, &idxType); err != nil {
			return nil, err
		}
		if _, ok := idxMap[idxName]; !ok {
			idxMap[idxName] = &TableIndex{
				Name:      idxName,
				Columns:   []string{},
				IsUnique:  nonUnique == 0,
				IsPrimary: idxName == "PRIMARY",
				Type:      idxType,
			}
			idxOrder = append(idxOrder, idxName)
		}
		idxMap[idxName].Columns = append(idxMap[idxName].Columns, colName)
	}
	if err := idxRows.Err(); err != nil {
		return nil, err
	}
	for _, name := range idxOrder {
		schema.Indexes = append(schema.Indexes, *idxMap[name])
	}

	// Foreign Keys
	fkRows, err := db.QueryContext(ctx, `
		SELECT 
			kcu.CONSTRAINT_NAME, kcu.COLUMN_NAME,
			kcu.REFERENCED_TABLE_NAME, kcu.REFERENCED_COLUMN_NAME,
			rc.UPDATE_RULE, rc.DELETE_RULE
		FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
		JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
			ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
			AND kcu.CONSTRAINT_SCHEMA = rc.CONSTRAINT_SCHEMA
		WHERE kcu.TABLE_SCHEMA = DATABASE() AND kcu.TABLE_NAME = ?
			AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
		ORDER BY kcu.CONSTRAINT_NAME, kcu.ORDINAL_POSITION
	`, tableName)
	if err != nil {
		return nil, err
	}
	defer fkRows.Close()

	for fkRows.Next() {
		var fk ForeignKey
		if err := fkRows.Scan(&fk.Name, &fk.Column, &fk.ReferencedTable, &fk.ReferencedColumn, &fk.OnUpdate, &fk.OnDelete); err != nil {
			return nil, err
		}
		schema.ForeignKeys = append(schema.ForeignKeys, fk)
	}
	if err := fkRows.Err(); err != nil {
		return nil, err
	}

	// DDL
	var tblName, ddl string
	if err := db.QueryRowContext(ctx, fmt.Sprintf("SHOW CREATE TABLE %s", quoteIdentifier(tableName))).Scan(&tblName, &ddl); err != nil {
		schema.DDL = ""
	} else {
		schema.DDL = ddl
	}

	return schema, nil
}

func (s *workspaceDBQueryService) CreateTable(ctx context.Context, workspaceID string, req CreateTableRequest) error {
	if req.Name == "" || !isSafeIdentifier(req.Name) {
		return ErrWorkspaceDBInvalidInput
	}
	if len(req.Columns) == 0 {
		return ErrWorkspaceDBInvalidInput
	}

	db, err := s.getConn(ctx, workspaceID)
	if err != nil {
		return err
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("CREATE TABLE %s (\n", quoteIdentifier(req.Name)))

	for i, col := range req.Columns {
		if !isSafeIdentifier(col.Name) {
			return ErrWorkspaceDBInvalidInput
		}
		sb.WriteString(fmt.Sprintf("  %s %s", quoteIdentifier(col.Name), col.Type))
		if !col.Nullable {
			sb.WriteString(" NOT NULL")
		}
		if col.DefaultValue != nil {
			sb.WriteString(fmt.Sprintf(" DEFAULT %s", *col.DefaultValue))
		}
		if col.Unique {
			sb.WriteString(" UNIQUE")
		}
		if col.Comment != "" {
			sb.WriteString(fmt.Sprintf(" COMMENT '%s'", escapeMySQLString(col.Comment)))
		}
		if i < len(req.Columns)-1 || len(req.PrimaryKey) > 0 || len(req.Indexes) > 0 {
			sb.WriteString(",")
		}
		sb.WriteString("\n")
	}

	if len(req.PrimaryKey) > 0 {
		quoted := make([]string, len(req.PrimaryKey))
		for i, pk := range req.PrimaryKey {
			quoted[i] = quoteIdentifier(pk)
		}
		sb.WriteString(fmt.Sprintf("  PRIMARY KEY (%s)", strings.Join(quoted, ", ")))
		if len(req.Indexes) > 0 {
			sb.WriteString(",")
		}
		sb.WriteString("\n")
	}

	for i, idx := range req.Indexes {
		if idx.Name == "" || !isSafeIdentifier(idx.Name) {
			return ErrWorkspaceDBInvalidInput
		}
		cols := make([]string, len(idx.Columns))
		for j, c := range idx.Columns {
			cols[j] = quoteIdentifier(c)
		}
		if idx.Unique {
			sb.WriteString(fmt.Sprintf("  UNIQUE KEY %s (%s)", quoteIdentifier(idx.Name), strings.Join(cols, ", ")))
		} else {
			sb.WriteString(fmt.Sprintf("  KEY %s (%s)", quoteIdentifier(idx.Name), strings.Join(cols, ", ")))
		}
		if i < len(req.Indexes)-1 {
			sb.WriteString(",")
		}
		sb.WriteString("\n")
	}

	sb.WriteString(") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci")

	_, err = db.ExecContext(ctx, sb.String())
	return err
}

func (s *workspaceDBQueryService) AlterTable(ctx context.Context, workspaceID, tableName string, req AlterTableRequest) error {
	if !isSafeIdentifier(tableName) {
		return ErrWorkspaceDBInvalidInput
	}

	db, err := s.getConn(ctx, workspaceID)
	if err != nil {
		return err
	}

	var stmts []string

	// Rename
	if req.Rename != "" {
		if !isSafeIdentifier(req.Rename) {
			return ErrWorkspaceDBInvalidInput
		}
		stmts = append(stmts, fmt.Sprintf("ALTER TABLE %s RENAME TO %s", quoteIdentifier(tableName), quoteIdentifier(req.Rename)))
		tableName = req.Rename
	}

	// Add columns
	for _, col := range req.AddColumns {
		if !isSafeIdentifier(col.Name) {
			return ErrWorkspaceDBInvalidInput
		}
		clause := fmt.Sprintf("ALTER TABLE %s ADD COLUMN %s %s", quoteIdentifier(tableName), quoteIdentifier(col.Name), col.Type)
		if !col.Nullable {
			clause += " NOT NULL"
		}
		if col.DefaultValue != nil {
			clause += fmt.Sprintf(" DEFAULT %s", *col.DefaultValue)
		}
		if col.Unique {
			clause += " UNIQUE"
		}
		if col.Comment != "" {
			clause += fmt.Sprintf(" COMMENT '%s'", escapeMySQLString(col.Comment))
		}
		stmts = append(stmts, clause)
	}

	// Alter columns
	for _, col := range req.AlterColumns {
		if !isSafeIdentifier(col.Name) {
			return ErrWorkspaceDBInvalidInput
		}
		if col.Type == "" {
			continue
		}
		if col.NewName != "" && !isSafeIdentifier(col.NewName) {
			return ErrWorkspaceDBInvalidInput
		}
		targetName := col.Name
		if col.NewName != "" {
			targetName = col.NewName
		}
		clause := fmt.Sprintf("ALTER TABLE %s CHANGE COLUMN %s %s %s",
			quoteIdentifier(tableName), quoteIdentifier(col.Name), quoteIdentifier(targetName), col.Type)
		if col.Nullable != nil && !*col.Nullable {
			clause += " NOT NULL"
		}
		if col.DefaultValue != nil {
			clause += fmt.Sprintf(" DEFAULT %s", *col.DefaultValue)
		}
		if col.Comment != "" {
			clause += fmt.Sprintf(" COMMENT '%s'", escapeMySQLString(col.Comment))
		}
		stmts = append(stmts, clause)
	}

	// Drop columns
	for _, colName := range req.DropColumns {
		if !isSafeIdentifier(colName) {
			return ErrWorkspaceDBInvalidInput
		}
		stmts = append(stmts, fmt.Sprintf("ALTER TABLE %s DROP COLUMN %s", quoteIdentifier(tableName), quoteIdentifier(colName)))
	}

	for _, stmt := range stmts {
		if _, err := db.ExecContext(ctx, stmt); err != nil {
			return err
		}
	}

	return nil
}

func (s *workspaceDBQueryService) DropTable(ctx context.Context, workspaceID, tableName string) error {
	if !isSafeIdentifier(tableName) {
		return ErrWorkspaceDBInvalidInput
	}

	db, err := s.getConn(ctx, workspaceID)
	if err != nil {
		return err
	}

	_, err = db.ExecContext(ctx, fmt.Sprintf("DROP TABLE IF EXISTS %s", quoteIdentifier(tableName)))
	return err
}

func (s *workspaceDBQueryService) QueryRows(ctx context.Context, workspaceID, tableName string, params QueryRowsParams) (*QueryResult, error) {
	if !isSafeIdentifier(tableName) {
		return nil, ErrWorkspaceDBInvalidInput
	}

	db, err := s.getConn(ctx, workspaceID)
	if err != nil {
		return nil, err
	}

	if params.Page <= 0 {
		params.Page = 1
	}
	if params.PageSize <= 0 {
		params.PageSize = 50
	}
	if params.PageSize > queryMaxRows {
		params.PageSize = queryMaxRows
	}

	queryCtx, cancel := context.WithTimeout(ctx, queryTimeoutSeconds*time.Second)
	defer cancel()

	// Build WHERE clause
	whereClause, whereArgs := buildWhereClause(params.Filters, params.FilterCombinator)

	// Count total
	countSQL := fmt.Sprintf("SELECT COUNT(*) FROM %s%s", quoteIdentifier(tableName), whereClause)
	var totalCount int64
	if err := db.QueryRowContext(queryCtx, countSQL, whereArgs...).Scan(&totalCount); err != nil {
		return nil, err
	}

	// Build ORDER BY
	orderClause := ""
	if params.OrderBy != "" && isSafeIdentifier(params.OrderBy) {
		dir := "ASC"
		if strings.ToUpper(params.OrderDir) == "DESC" {
			dir = "DESC"
		}
		orderClause = fmt.Sprintf(" ORDER BY %s %s", quoteIdentifier(params.OrderBy), dir)
	}

	offset := (params.Page - 1) * params.PageSize
	dataSQL := fmt.Sprintf("SELECT * FROM %s%s%s LIMIT %d OFFSET %d",
		quoteIdentifier(tableName), whereClause, orderClause, params.PageSize, offset)

	start := time.Now()
	rows, err := db.QueryContext(queryCtx, dataSQL, whereArgs...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result, err := scanRows(rows)
	if err != nil {
		return nil, err
	}
	result.DurationMs = time.Since(start).Milliseconds()
	result.TotalCount = totalCount

	return result, nil
}

func (s *workspaceDBQueryService) InsertRow(ctx context.Context, workspaceID, tableName string, data map[string]interface{}) (*QueryResult, error) {
	if !isSafeIdentifier(tableName) {
		return nil, ErrWorkspaceDBInvalidInput
	}
	if len(data) == 0 {
		return nil, ErrWorkspaceDBInvalidInput
	}

	db, err := s.getConn(ctx, workspaceID)
	if err != nil {
		return nil, err
	}

	columns := make([]string, 0, len(data))
	placeholders := make([]string, 0, len(data))
	values := make([]interface{}, 0, len(data))
	for col, val := range data {
		if !isSafeIdentifier(col) {
			return nil, ErrWorkspaceDBInvalidInput
		}
		columns = append(columns, quoteIdentifier(col))
		placeholders = append(placeholders, "?")
		values = append(values, val)
	}

	sqlStr := fmt.Sprintf("INSERT INTO %s (%s) VALUES (%s)",
		quoteIdentifier(tableName),
		strings.Join(columns, ", "),
		strings.Join(placeholders, ", "))

	start := time.Now()
	res, err := db.ExecContext(ctx, sqlStr, values...)
	if err != nil {
		return nil, err
	}

	affected, _ := res.RowsAffected()
	return &QueryResult{
		AffectedRows: affected,
		DurationMs:   time.Since(start).Milliseconds(),
	}, nil
}

func (s *workspaceDBQueryService) UpdateRow(ctx context.Context, workspaceID, tableName string, data map[string]interface{}) (*QueryResult, error) {
	if !isSafeIdentifier(tableName) {
		return nil, ErrWorkspaceDBInvalidInput
	}

	db, err := s.getConn(ctx, workspaceID)
	if err != nil {
		return nil, err
	}

	// Get primary key columns
	pkCols, err := s.getPrimaryKeyColumns(ctx, db, tableName)
	if err != nil {
		return nil, err
	}
	if len(pkCols) == 0 {
		return nil, fmt.Errorf("table %s has no primary key", tableName)
	}

	setClauses := make([]string, 0)
	setValues := make([]interface{}, 0)
	whereClauses := make([]string, 0)
	whereValues := make([]interface{}, 0)

	for col, val := range data {
		if !isSafeIdentifier(col) {
			return nil, ErrWorkspaceDBInvalidInput
		}
		isPK := false
		for _, pk := range pkCols {
			if pk == col {
				isPK = true
				break
			}
		}
		if isPK {
			whereClauses = append(whereClauses, fmt.Sprintf("%s = ?", quoteIdentifier(col)))
			whereValues = append(whereValues, val)
		} else {
			setClauses = append(setClauses, fmt.Sprintf("%s = ?", quoteIdentifier(col)))
			setValues = append(setValues, val)
		}
	}

	if len(setClauses) == 0 || len(whereClauses) == 0 {
		return nil, ErrWorkspaceDBInvalidInput
	}

	sqlStr := fmt.Sprintf("UPDATE %s SET %s WHERE %s",
		quoteIdentifier(tableName),
		strings.Join(setClauses, ", "),
		strings.Join(whereClauses, " AND "))

	allValues := append(setValues, whereValues...)
	start := time.Now()
	res, err := db.ExecContext(ctx, sqlStr, allValues...)
	if err != nil {
		return nil, err
	}

	affected, _ := res.RowsAffected()
	return &QueryResult{
		AffectedRows: affected,
		DurationMs:   time.Since(start).Milliseconds(),
	}, nil
}

func (s *workspaceDBQueryService) DeleteRows(ctx context.Context, workspaceID, tableName string, ids []interface{}) (*QueryResult, error) {
	if !isSafeIdentifier(tableName) {
		return nil, ErrWorkspaceDBInvalidInput
	}
	if len(ids) == 0 {
		return nil, ErrWorkspaceDBInvalidInput
	}

	db, err := s.getConn(ctx, workspaceID)
	if err != nil {
		return nil, err
	}

	// Get primary key (assume single PK for simplicity)
	pkCols, err := s.getPrimaryKeyColumns(ctx, db, tableName)
	if err != nil {
		return nil, err
	}
	if len(pkCols) == 0 {
		return nil, fmt.Errorf("table %s has no primary key", tableName)
	}

	placeholders := make([]string, len(ids))
	for i := range ids {
		placeholders[i] = "?"
	}

	sqlStr := fmt.Sprintf("DELETE FROM %s WHERE %s IN (%s)",
		quoteIdentifier(tableName),
		quoteIdentifier(pkCols[0]),
		strings.Join(placeholders, ", "))

	start := time.Now()
	res, err := db.ExecContext(ctx, sqlStr, ids...)
	if err != nil {
		return nil, err
	}

	affected, _ := res.RowsAffected()
	return &QueryResult{
		AffectedRows: affected,
		DurationMs:   time.Since(start).Milliseconds(),
	}, nil
}

func (s *workspaceDBQueryService) ExecuteSQL(ctx context.Context, workspaceID, sqlStr string, params []interface{}) (*QueryResult, error) {
	sqlStr = strings.TrimSpace(sqlStr)
	if sqlStr == "" {
		return nil, ErrWorkspaceDBInvalidInput
	}

	// SQL safety check
	if err := validateSQL(sqlStr); err != nil {
		return nil, err
	}

	db, err := s.getConn(ctx, workspaceID)
	if err != nil {
		return nil, err
	}

	queryCtx, cancel := context.WithTimeout(ctx, queryTimeoutSeconds*time.Second)
	defer cancel()

	start := time.Now()
	upperSQL := strings.ToUpper(strings.TrimSpace(sqlStr))

	historyItem := QueryHistoryItem{
		SQL:       sqlStr,
		Status:    "success",
		CreatedAt: time.Now().UTC().Format(time.RFC3339),
	}

	if strings.HasPrefix(upperSQL, "SELECT") || strings.HasPrefix(upperSQL, "SHOW") || strings.HasPrefix(upperSQL, "DESCRIBE") || strings.HasPrefix(upperSQL, "EXPLAIN") {
		rows, err := db.QueryContext(queryCtx, sqlStr, params...)
		if err != nil {
			historyItem.Status = "error"
			historyItem.Error = err.Error()
			historyItem.DurationMs = time.Since(start).Milliseconds()
			s.addQueryHistory(workspaceID, historyItem)
			return nil, err
		}
		defer rows.Close()

		result, err := scanRowsLimited(rows, queryMaxRows)
		if err != nil {
			historyItem.Status = "error"
			historyItem.Error = err.Error()
			historyItem.DurationMs = time.Since(start).Milliseconds()
			s.addQueryHistory(workspaceID, historyItem)
			return nil, err
		}
		result.DurationMs = time.Since(start).Milliseconds()
		historyItem.DurationMs = result.DurationMs
		s.addQueryHistory(workspaceID, historyItem)
		return result, nil
	}

	// Non-SELECT
	res, err := db.ExecContext(queryCtx, sqlStr, params...)
	if err != nil {
		historyItem.Status = "error"
		historyItem.Error = err.Error()
		historyItem.DurationMs = time.Since(start).Milliseconds()
		s.addQueryHistory(workspaceID, historyItem)
		return nil, err
	}

	affected, _ := res.RowsAffected()
	durationMs := time.Since(start).Milliseconds()
	historyItem.DurationMs = durationMs
	s.addQueryHistory(workspaceID, historyItem)

	return &QueryResult{
		AffectedRows: affected,
		DurationMs:   durationMs,
	}, nil
}

func (s *workspaceDBQueryService) GetQueryHistory(ctx context.Context, workspaceID string) ([]QueryHistoryItem, error) {
	history, ok := s.queryHistory[workspaceID]
	if !ok {
		return []QueryHistoryItem{}, nil
	}
	return history, nil
}

func (s *workspaceDBQueryService) GetDatabaseStats(ctx context.Context, workspaceID string) (*DatabaseStats, error) {
	db, err := s.getConn(ctx, workspaceID)
	if err != nil {
		return nil, err
	}

	stats := &DatabaseStats{}

	// Table count and total size
	err = db.QueryRowContext(ctx, `
		SELECT 
			COUNT(*),
			IFNULL(SUM(TABLE_ROWS), 0),
			IFNULL(SUM(DATA_LENGTH + INDEX_LENGTH), 0)
		FROM INFORMATION_SCHEMA.TABLES
		WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'
	`).Scan(&stats.TableCount, &stats.TotalRows, &stats.TotalSizeBytes)
	if err != nil {
		return nil, err
	}

	// Connection count
	var connCount int
	err = db.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM INFORMATION_SCHEMA.PROCESSLIST WHERE DB = DATABASE()
	`).Scan(&connCount)
	if err != nil {
		connCount = 0
	}
	stats.ConnectionCount = connCount

	return stats, nil
}

func (s *workspaceDBQueryService) GetSchemaGraph(ctx context.Context, workspaceID string) (*SchemaGraphData, error) {
	db, err := s.getConn(ctx, workspaceID)
	if err != nil {
		return nil, err
	}

	graph := &SchemaGraphData{
		Nodes: []SchemaGraphNode{},
		Edges: []SchemaGraphEdge{},
	}

	// Get all tables with columns
	tableRows, err := db.QueryContext(ctx, `
		SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
		WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'
		ORDER BY TABLE_NAME
	`)
	if err != nil {
		return nil, err
	}
	defer tableRows.Close()

	tableNames := []string{}
	for tableRows.Next() {
		var name string
		if err := tableRows.Scan(&name); err != nil {
			return nil, err
		}
		tableNames = append(tableNames, name)
	}
	if err := tableRows.Err(); err != nil {
		return nil, err
	}

	for _, tbl := range tableNames {
		colRows, err := db.QueryContext(ctx, `
			SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY, EXTRA, COLUMN_COMMENT, ORDINAL_POSITION
			FROM INFORMATION_SCHEMA.COLUMNS
			WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
			ORDER BY ORDINAL_POSITION
		`, tbl)
		if err != nil {
			return nil, err
		}

		var columns []TableColumn
		for colRows.Next() {
			var col TableColumn
			var nullable, columnKey string
			var defaultVal sql.NullString
			if err := colRows.Scan(&col.Name, &col.Type, &nullable, &defaultVal, &columnKey, &col.Extra, &col.Comment, &col.OrdinalPos); err != nil {
				colRows.Close()
				return nil, err
			}
			col.Nullable = strings.ToUpper(nullable) == "YES"
			if defaultVal.Valid {
				col.DefaultValue = &defaultVal.String
			}
			col.IsPrimaryKey = columnKey == "PRI"
			col.IsUnique = columnKey == "UNI" || columnKey == "PRI"
			columns = append(columns, col)
		}
		colRows.Close()

		graph.Nodes = append(graph.Nodes, SchemaGraphNode{
			ID:      tbl,
			Name:    tbl,
			Columns: columns,
		})
	}

	// Get all foreign keys
	fkRows, err := db.QueryContext(ctx, `
		SELECT 
			kcu.CONSTRAINT_NAME, kcu.TABLE_NAME, kcu.COLUMN_NAME,
			kcu.REFERENCED_TABLE_NAME, kcu.REFERENCED_COLUMN_NAME
		FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
		WHERE kcu.TABLE_SCHEMA = DATABASE()
			AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
		ORDER BY kcu.CONSTRAINT_NAME, kcu.ORDINAL_POSITION
	`)
	if err != nil {
		return nil, err
	}
	defer fkRows.Close()

	for fkRows.Next() {
		var constraintName, srcTable, srcCol, tgtTable, tgtCol string
		if err := fkRows.Scan(&constraintName, &srcTable, &srcCol, &tgtTable, &tgtCol); err != nil {
			return nil, err
		}
		graph.Edges = append(graph.Edges, SchemaGraphEdge{
			ID:             fmt.Sprintf("%s_%s_%s", srcTable, srcCol, tgtTable),
			Source:         srcTable,
			Target:         tgtTable,
			SourceColumn:   srcCol,
			TargetColumn:   tgtCol,
			ConstraintName: constraintName,
		})
	}

	return graph, fkRows.Err()
}

// --- Helper functions ---

func (s *workspaceDBQueryService) getPrimaryKeyColumns(ctx context.Context, db *sql.DB, tableName string) ([]string, error) {
	rows, err := db.QueryContext(ctx, `
		SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
		WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_KEY = 'PRI'
		ORDER BY ORDINAL_POSITION
	`, tableName)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var cols []string
	for rows.Next() {
		var col string
		if err := rows.Scan(&col); err != nil {
			return nil, err
		}
		cols = append(cols, col)
	}
	return cols, rows.Err()
}

func (s *workspaceDBQueryService) addQueryHistory(workspaceID string, item QueryHistoryItem) {
	history := s.queryHistory[workspaceID]
	history = append([]QueryHistoryItem{item}, history...)
	if len(history) > queryHistoryMax {
		history = history[:queryHistoryMax]
	}
	s.queryHistory[workspaceID] = history
}

func validateSQL(sqlStr string) error {
	upper := strings.ToUpper(sqlStr)
	for _, kw := range forbiddenSQLKeywords {
		if strings.Contains(upper, kw) {
			return ErrWorkspaceDBQueryForbidden
		}
	}
	return nil
}

func buildWhereClause(filters []QueryFilter, combinator ...string) (string, []interface{}) {
	if len(filters) == 0 {
		return "", nil
	}

	validOperators := map[string]string{
		"=":           "=",
		"!=":          "!=",
		">":           ">",
		"<":           "<",
		">=":          ">=",
		"<=":          "<=",
		"LIKE":        "LIKE",
		"like":        "LIKE",
		"IS NULL":     "IS NULL",
		"is null":     "IS NULL",
		"IS NOT NULL": "IS NOT NULL",
		"is not null": "IS NOT NULL",
	}

	var clauses []string
	var args []interface{}

	for _, f := range filters {
		if !isSafeIdentifier(f.Column) {
			continue
		}
		op, ok := validOperators[f.Operator]
		if !ok {
			continue
		}
		if op == "IS NULL" || op == "IS NOT NULL" {
			clauses = append(clauses, fmt.Sprintf("%s %s", quoteIdentifier(f.Column), op))
		} else {
			clauses = append(clauses, fmt.Sprintf("%s %s ?", quoteIdentifier(f.Column), op))
			args = append(args, f.Value)
		}
	}

	if len(clauses) == 0 {
		return "", nil
	}

	join := " AND "
	if len(combinator) > 0 && strings.ToUpper(combinator[0]) == "OR" {
		join = " OR "
	}
	return " WHERE " + strings.Join(clauses, join), args
}

func scanRows(rows *sql.Rows) (*QueryResult, error) {
	return scanRowsLimited(rows, queryMaxRows)
}

func scanRowsLimited(rows *sql.Rows, maxRows int) (*QueryResult, error) {
	columns, err := rows.Columns()
	if err != nil {
		return nil, err
	}

	result := &QueryResult{
		Columns: columns,
		Rows:    []map[string]interface{}{},
	}

	count := 0
	for rows.Next() {
		if count >= maxRows {
			break
		}
		values := make([]interface{}, len(columns))
		valuePtrs := make([]interface{}, len(columns))
		for i := range values {
			valuePtrs[i] = &values[i]
		}
		if err := rows.Scan(valuePtrs...); err != nil {
			return nil, err
		}

		row := make(map[string]interface{})
		for i, col := range columns {
			val := values[i]
			if b, ok := val.([]byte); ok {
				row[col] = string(b)
			} else {
				row[col] = val
			}
		}
		result.Rows = append(result.Rows, row)
		count++
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	result.AffectedRows = int64(len(result.Rows))
	return result, nil
}
