package vmruntime

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"strings"
	"time"
)

// ListTables returns all user tables in the workspace's SQLite database.
func (s *VMStore) ListTables(ctx context.Context, workspaceID string) ([]VMTableInfo, error) {
	db, err := s.GetDB(workspaceID)
	if err != nil {
		return nil, err
	}

	// Collect table names first, then close the rows iterator before issuing
	// secondary queries. This avoids deadlock with MaxOpenConns(1).
	rows, err := db.QueryContext(ctx,
		`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`)
	if err != nil {
		return nil, fmt.Errorf("vmstore: list tables: %w", err)
	}

	var names []string
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			rows.Close()
			return nil, fmt.Errorf("vmstore: scan table name: %w", err)
		}
		names = append(names, name)
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		return nil, fmt.Errorf("vmstore: rows iteration: %w", err)
	}
	rows.Close()

	var tables []VMTableInfo
	for _, name := range names {
		var rowCount int64
		if err := db.QueryRowContext(ctx,
			fmt.Sprintf("SELECT COUNT(*) FROM %q", name)).Scan(&rowCount); err != nil {
			rowCount = 0
		}

		var colCount int
		colRows, err := db.QueryContext(ctx, fmt.Sprintf("PRAGMA table_info(%q)", name))
		if err == nil {
			for colRows.Next() {
				colCount++
			}
			colRows.Close()
		}

		tables = append(tables, VMTableInfo{
			Name:        name,
			RowCount:    rowCount,
			ColumnCount: colCount,
		})
	}
	return tables, nil
}

// GetTableSchema returns the full schema for a table.
func (s *VMStore) GetTableSchema(ctx context.Context, workspaceID, tableName string) (*VMTableSchema, error) {
	db, err := s.GetDB(workspaceID)
	if err != nil {
		return nil, err
	}

	schema := &VMTableSchema{Name: tableName}

	// Columns via PRAGMA table_info
	// Close each rows iterator before the next query to avoid deadlock with MaxOpenConns(1).
	colRows, err := db.QueryContext(ctx, fmt.Sprintf("PRAGMA table_info(%q)", tableName))
	if err != nil {
		return nil, fmt.Errorf("vmstore: table_info: %w", err)
	}
	ordinal := 0
	for colRows.Next() {
		var cid int
		var name, colType string
		var notNull, pk int
		var dfltValue *string
		if err := colRows.Scan(&cid, &name, &colType, &notNull, &dfltValue, &pk); err != nil {
			colRows.Close()
			return nil, fmt.Errorf("vmstore: scan column: %w", err)
		}
		ordinal++
		extra := ""
		if pk > 0 && strings.EqualFold(colType, "INTEGER") {
			extra = "auto_increment"
		}
		col := VMColumnInfo{
			Name:            name,
			Type:            colType,
			Nullable:        notNull == 0,
			DefaultValue:    dfltValue,
			IsPrimaryKey:    pk > 0,
			OrdinalPosition: ordinal,
			Extra:           extra,
		}
		schema.Columns = append(schema.Columns, col)
		if pk > 0 {
			schema.PrimaryKey = append(schema.PrimaryKey, name)
		}
	}
	if err := colRows.Err(); err != nil {
		colRows.Close()
		return nil, fmt.Errorf("vmstore: column rows: %w", err)
	}
	colRows.Close()

	// Foreign keys via PRAGMA foreign_key_list
	fkRows, err := db.QueryContext(ctx, fmt.Sprintf("PRAGMA foreign_key_list(%q)", tableName))
	if err == nil {
		for fkRows.Next() {
			var id, seq int
			var refTable, from, to, onUpdate, onDelete, match string
			if err := fkRows.Scan(&id, &seq, &refTable, &from, &to, &onUpdate, &onDelete, &match); err != nil {
				continue
			}
			schema.ForeignKeys = append(schema.ForeignKeys, VMForeignKey{
				Name:            fmt.Sprintf("fk_%s_%s_%d", tableName, from, id),
				From:            from,
				ReferencedTable: refTable,
				ReferencedCol:   to,
				OnUpdate:        onUpdate,
				OnDelete:        onDelete,
			})
		}
		fkRows.Close()
	}

	// Indexes via PRAGMA index_list — collect first, then query index_info separately.
	type idxEntry struct {
		Name   string
		Unique bool
		Origin string
	}
	var idxEntries []idxEntry
	idxRows, err := db.QueryContext(ctx, fmt.Sprintf("PRAGMA index_list(%q)", tableName))
	if err == nil {
		for idxRows.Next() {
			var seq int
			var idxName, origin string
			var unique, partial int
			if err := idxRows.Scan(&seq, &idxName, &unique, &origin, &partial); err != nil {
				continue
			}
			idxEntries = append(idxEntries, idxEntry{Name: idxName, Unique: unique == 1, Origin: origin})
		}
		idxRows.Close()
	}

	// Build a set of unique single-column index names for marking IsUnique on columns
	uniqueColSet := make(map[string]bool)

	for _, entry := range idxEntries {
		idxType := "BTREE"
		if entry.Origin == "pk" {
			idxType = "PRIMARY"
		}
		idx := VMIndex{
			Name:      entry.Name,
			IsUnique:  entry.Unique,
			IsPrimary: entry.Origin == "pk",
			Type:      idxType,
		}
		infoRows, err := db.QueryContext(ctx, fmt.Sprintf("PRAGMA index_info(%q)", entry.Name))
		if err == nil {
			for infoRows.Next() {
				var seqno, cid int
				var colName string
				if err := infoRows.Scan(&seqno, &cid, &colName); err != nil {
					continue
				}
				idx.Columns = append(idx.Columns, colName)
			}
			infoRows.Close()
		}
		schema.Indexes = append(schema.Indexes, idx)
		// Track unique single-column indexes
		if entry.Unique && len(idx.Columns) == 1 {
			uniqueColSet[idx.Columns[0]] = true
		}
	}

	// Mark IsUnique on columns that have a unique single-column index
	for i := range schema.Columns {
		if uniqueColSet[schema.Columns[i].Name] {
			schema.Columns[i].IsUnique = true
		}
	}

	// DDL from sqlite_master
	var ddl sql.NullString
	if err := db.QueryRowContext(ctx,
		"SELECT sql FROM sqlite_master WHERE type='table' AND name=?", tableName).Scan(&ddl); err == nil && ddl.Valid {
		schema.DDL = ddl.String
	}

	return schema, nil
}

// GetSchemaGraph returns the full schema graph including all tables and their relationships.
func (s *VMStore) GetSchemaGraph(ctx context.Context, workspaceID string) (*VMSchemaGraph, error) {
	tables, err := s.ListTables(ctx, workspaceID)
	if err != nil {
		return nil, err
	}

	graph := &VMSchemaGraph{}
	for _, t := range tables {
		schema, err := s.GetTableSchema(ctx, workspaceID, t.Name)
		if err != nil {
			continue
		}
		graph.Nodes = append(graph.Nodes, VMSchemaGraphNode{
			ID:      t.Name,
			Name:    t.Name,
			Columns: schema.Columns,
		})
		for _, fk := range schema.ForeignKeys {
			graph.Edges = append(graph.Edges, VMSchemaGraphEdge{
				ID:             fmt.Sprintf("%s.%s->%s.%s", t.Name, fk.From, fk.ReferencedTable, fk.ReferencedCol),
				Source:         t.Name,
				Target:         fk.ReferencedTable,
				SourceColumn:   fk.From,
				TargetColumn:   fk.ReferencedCol,
				ConstraintName: fk.Name,
			})
		}
	}
	return graph, nil
}

// GetStats returns aggregate statistics for the workspace database.
func (s *VMStore) GetStats(ctx context.Context, workspaceID string) (*VMDatabaseStats, error) {
	db, err := s.GetDB(workspaceID)
	if err != nil {
		return nil, err
	}

	stats := &VMDatabaseStats{}

	tables, err := s.ListTables(ctx, workspaceID)
	if err != nil {
		return nil, err
	}
	stats.TableCount = len(tables)
	for _, t := range tables {
		stats.TotalRows += t.RowCount
	}

	// File size
	if fi, err := os.Stat(s.DBPath(workspaceID)); err == nil {
		stats.FileSizeKB = fi.Size() / 1024
	}

	// Index count
	var indexCount int
	if err := db.QueryRowContext(ctx,
		"SELECT COUNT(*) FROM sqlite_master WHERE type='index'").Scan(&indexCount); err == nil {
		stats.IndexCount = indexCount
	}

	// Journal mode
	var journalMode string
	if err := db.QueryRowContext(ctx, "PRAGMA journal_mode").Scan(&journalMode); err == nil {
		stats.JournalMode = journalMode
	}

	return stats, nil
}

// QueryRows queries rows from a table with pagination, sorting, and filtering.
func (s *VMStore) QueryRows(ctx context.Context, workspaceID, tableName string, params VMQueryParams) (*VMQueryResult, error) {
	db, err := s.GetDB(workspaceID)
	if err != nil {
		return nil, err
	}

	start := time.Now()

	if params.Page <= 0 {
		params.Page = 1
	}
	if params.PageSize <= 0 {
		params.PageSize = 50
	}
	if params.PageSize > 1000 {
		params.PageSize = 1000
	}

	whereClause, whereArgs := buildWhereClause(params.Filters, params.FilterCombinator)

	// Count total
	countSQL := fmt.Sprintf("SELECT COUNT(*) FROM %q", tableName)
	if whereClause != "" {
		countSQL += " WHERE " + whereClause
	}
	var totalCount int64
	if err := db.QueryRowContext(ctx, countSQL, whereArgs...).Scan(&totalCount); err != nil {
		return nil, fmt.Errorf("vmstore: count rows: %w", err)
	}

	// Query rows
	querySQL := fmt.Sprintf("SELECT * FROM %q", tableName)
	if whereClause != "" {
		querySQL += " WHERE " + whereClause
	}

	if params.OrderBy != "" {
		dir := "ASC"
		if strings.EqualFold(params.OrderDir, "desc") {
			dir = "DESC"
		}
		querySQL += fmt.Sprintf(" ORDER BY %q %s", params.OrderBy, dir)
	}

	offset := (params.Page - 1) * params.PageSize
	querySQL += fmt.Sprintf(" LIMIT %d OFFSET %d", params.PageSize, offset)

	rows, columns, err := scanQueryRows(ctx, db, querySQL, whereArgs...)
	if err != nil {
		return nil, fmt.Errorf("vmstore: query rows: %w", err)
	}

	return &VMQueryResult{
		Columns:    columns,
		Rows:       rows,
		TotalCount: totalCount,
		DurationMs: time.Since(start).Milliseconds(),
	}, nil
}

// InsertRow inserts a row into the specified table.
func (s *VMStore) InsertRow(ctx context.Context, workspaceID, tableName string, data map[string]interface{}) (*VMExecResult, error) {
	db, err := s.GetDB(workspaceID)
	if err != nil {
		return nil, err
	}

	if len(data) == 0 {
		return nil, fmt.Errorf("vmstore: insert requires at least one column")
	}

	columns := make([]string, 0, len(data))
	placeholders := make([]string, 0, len(data))
	values := make([]interface{}, 0, len(data))
	for col, val := range data {
		columns = append(columns, fmt.Sprintf("%q", col))
		placeholders = append(placeholders, "?")
		values = append(values, val)
	}

	query := fmt.Sprintf("INSERT INTO %q (%s) VALUES (%s)",
		tableName, strings.Join(columns, ", "), strings.Join(placeholders, ", "))

	result, err := db.ExecContext(ctx, query, values...)
	if err != nil {
		return nil, fmt.Errorf("vmstore: insert row: %w", err)
	}

	lastID, _ := result.LastInsertId()
	affected, _ := result.RowsAffected()
	return &VMExecResult{LastInsertID: lastID, AffectedRows: affected}, nil
}

// UpdateRow updates rows in the specified table.
func (s *VMStore) UpdateRow(ctx context.Context, workspaceID, tableName string, data map[string]interface{}, where map[string]interface{}) (*VMExecResult, error) {
	db, err := s.GetDB(workspaceID)
	if err != nil {
		return nil, err
	}

	if len(data) == 0 {
		return nil, fmt.Errorf("vmstore: update requires at least one column")
	}
	if len(where) == 0 {
		return nil, fmt.Errorf("vmstore: update requires a WHERE clause")
	}

	setClauses := make([]string, 0, len(data))
	args := make([]interface{}, 0, len(data)+len(where))
	for col, val := range data {
		setClauses = append(setClauses, fmt.Sprintf("%q = ?", col))
		args = append(args, val)
	}

	whereClauses := make([]string, 0, len(where))
	for col, val := range where {
		whereClauses = append(whereClauses, fmt.Sprintf("%q = ?", col))
		args = append(args, val)
	}

	query := fmt.Sprintf("UPDATE %q SET %s WHERE %s",
		tableName, strings.Join(setClauses, ", "), strings.Join(whereClauses, " AND "))

	result, err := db.ExecContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("vmstore: update row: %w", err)
	}

	affected, _ := result.RowsAffected()
	return &VMExecResult{AffectedRows: affected}, nil
}

// DeleteRows deletes rows from the specified table by IDs.
func (s *VMStore) DeleteRows(ctx context.Context, workspaceID, tableName string, ids []interface{}) (*VMExecResult, error) {
	db, err := s.GetDB(workspaceID)
	if err != nil {
		return nil, err
	}

	if len(ids) == 0 {
		return nil, fmt.Errorf("vmstore: delete requires at least one ID")
	}

	placeholders := make([]string, len(ids))
	for i := range ids {
		placeholders[i] = "?"
	}

	query := fmt.Sprintf("DELETE FROM %q WHERE id IN (%s)",
		tableName, strings.Join(placeholders, ", "))

	result, err := db.ExecContext(ctx, query, ids...)
	if err != nil {
		return nil, fmt.Errorf("vmstore: delete rows: %w", err)
	}

	affected, _ := result.RowsAffected()
	return &VMExecResult{AffectedRows: affected}, nil
}

// ExecuteSQL executes an arbitrary SQL statement against the workspace database.
func (s *VMStore) ExecuteSQL(ctx context.Context, workspaceID, sqlStr string, params ...interface{}) (*VMQueryResult, error) {
	db, err := s.GetDB(workspaceID)
	if err != nil {
		return nil, err
	}

	start := time.Now()
	trimmed := strings.TrimSpace(strings.ToUpper(sqlStr))

	if strings.HasPrefix(trimmed, "SELECT") || strings.HasPrefix(trimmed, "PRAGMA") || strings.HasPrefix(trimmed, "EXPLAIN") {
		rows, columns, err := scanQueryRows(ctx, db, sqlStr, params...)
		if err != nil {
			return nil, fmt.Errorf("vmstore: execute sql: %w", err)
		}
		return &VMQueryResult{
			Columns:    columns,
			Rows:       rows,
			TotalCount: int64(len(rows)),
			DurationMs: time.Since(start).Milliseconds(),
		}, nil
	}

	result, err := db.ExecContext(ctx, sqlStr, params...)
	if err != nil {
		return nil, fmt.Errorf("vmstore: execute sql: %w", err)
	}
	affected, _ := result.RowsAffected()
	return &VMQueryResult{
		AffectedRows: affected,
		DurationMs:   time.Since(start).Milliseconds(),
	}, nil
}

// CreateTable creates a new table in the workspace's SQLite database.
func (s *VMStore) CreateTable(ctx context.Context, workspaceID string, req VMCreateTableRequest) error {
	db, err := s.GetDB(workspaceID)
	if err != nil {
		return err
	}

	var colDefs []string
	for _, col := range req.Columns {
		def := fmt.Sprintf("%q %s", col.Name, mapColumnType(col.Type))
		if !col.Nullable {
			def += " NOT NULL"
		}
		if col.DefaultValue != nil {
			def += " DEFAULT " + *col.DefaultValue
		}
		if col.Unique {
			def += " UNIQUE"
		}
		colDefs = append(colDefs, def)
	}

	// Primary key
	if len(req.PrimaryKey) > 0 {
		if len(req.PrimaryKey) == 1 {
			// For single-column integer PK, use AUTOINCREMENT
			for i, col := range req.Columns {
				if col.Name == req.PrimaryKey[0] {
					upperType := strings.ToUpper(mapColumnType(col.Type))
					if upperType == "INTEGER" || upperType == "INT" || upperType == "BIGINT" {
						colDefs[i] = fmt.Sprintf("%q INTEGER PRIMARY KEY AUTOINCREMENT", col.Name)
						if !col.Nullable {
							// already implied by PRIMARY KEY
						}
					} else {
						colDefs = append(colDefs, fmt.Sprintf("PRIMARY KEY (%s)", quoteColumns(req.PrimaryKey)))
					}
					break
				}
			}
		} else {
			colDefs = append(colDefs, fmt.Sprintf("PRIMARY KEY (%s)", quoteColumns(req.PrimaryKey)))
		}
	}

	ddl := fmt.Sprintf("CREATE TABLE IF NOT EXISTS %q (\n  %s\n)", req.Name, strings.Join(colDefs, ",\n  "))
	if _, err := db.ExecContext(ctx, ddl); err != nil {
		return fmt.Errorf("vmstore: create table: %w", err)
	}

	// Create indexes
	for _, idx := range req.Indexes {
		unique := ""
		if idx.Unique {
			unique = "UNIQUE "
		}
		idxSQL := fmt.Sprintf("CREATE %sINDEX IF NOT EXISTS %q ON %q (%s)",
			unique, idx.Name, req.Name, quoteColumns(idx.Columns))
		if _, err := db.ExecContext(ctx, idxSQL); err != nil {
			return fmt.Errorf("vmstore: create index %q: %w", idx.Name, err)
		}
	}

	return nil
}

// AlterTable alters an existing table in the workspace's SQLite database.
func (s *VMStore) AlterTable(ctx context.Context, workspaceID, tableName string, req VMAlterTableRequest) error {
	db, err := s.GetDB(workspaceID)
	if err != nil {
		return err
	}

	// Rename table
	if req.Rename != "" {
		if _, err := db.ExecContext(ctx, fmt.Sprintf("ALTER TABLE %q RENAME TO %q", tableName, req.Rename)); err != nil {
			return fmt.Errorf("vmstore: rename table: %w", err)
		}
		tableName = req.Rename
	}

	// Add columns
	for _, col := range req.AddColumns {
		def := fmt.Sprintf("ALTER TABLE %q ADD COLUMN %q %s", tableName, col.Name, mapColumnType(col.Type))
		if !col.Nullable {
			def += " NOT NULL"
		}
		if col.DefaultValue != nil {
			def += " DEFAULT " + *col.DefaultValue
		}
		if _, err := db.ExecContext(ctx, def); err != nil {
			return fmt.Errorf("vmstore: add column %q: %w", col.Name, err)
		}
	}

	// Rename columns (SQLite 3.25+)
	for _, col := range req.AlterColumns {
		if col.NewName != "" && col.NewName != col.Name {
			sql := fmt.Sprintf("ALTER TABLE %q RENAME COLUMN %q TO %q", tableName, col.Name, col.NewName)
			if _, err := db.ExecContext(ctx, sql); err != nil {
				return fmt.Errorf("vmstore: rename column %q: %w", col.Name, err)
			}
		}
	}

	// Drop columns (SQLite 3.35+)
	for _, colName := range req.DropColumns {
		sql := fmt.Sprintf("ALTER TABLE %q DROP COLUMN %q", tableName, colName)
		if _, err := db.ExecContext(ctx, sql); err != nil {
			return fmt.Errorf("vmstore: drop column %q: %w", colName, err)
		}
	}

	return nil
}

// DropTable drops a table from the workspace's SQLite database.
func (s *VMStore) DropTable(ctx context.Context, workspaceID, tableName string) error {
	db, err := s.GetDB(workspaceID)
	if err != nil {
		return err
	}
	if _, err := db.ExecContext(ctx, fmt.Sprintf("DROP TABLE IF EXISTS %q", tableName)); err != nil {
		return fmt.Errorf("vmstore: drop table: %w", err)
	}
	return nil
}

// GetQueryHistory returns an empty history (SQLite has no built-in query log).
func (s *VMStore) GetQueryHistory(_ context.Context, _ string) []VMQueryHistoryItem {
	return []VMQueryHistoryItem{}
}

// mapColumnType maps common SQL types to SQLite-compatible types.
func mapColumnType(t string) string {
	upper := strings.ToUpper(strings.TrimSpace(t))
	switch {
	case strings.HasPrefix(upper, "VARCHAR"), strings.HasPrefix(upper, "CHAR"),
		upper == "TEXT", upper == "LONGTEXT", upper == "MEDIUMTEXT", upper == "TINYTEXT",
		strings.HasPrefix(upper, "ENUM"):
		return "TEXT"
	case upper == "INT" || upper == "BIGINT" || upper == "SMALLINT" || upper == "TINYINT" ||
		upper == "MEDIUMINT" || upper == "INTEGER" || upper == "BOOLEAN" ||
		strings.HasPrefix(upper, "TINYINT"):
		return "INTEGER"
	case upper == "FLOAT" || upper == "DOUBLE" || upper == "REAL" ||
		strings.HasPrefix(upper, "DECIMAL"), strings.HasPrefix(upper, "NUMERIC"):
		return "REAL"
	case upper == "BLOB", upper == "LONGBLOB", upper == "MEDIUMBLOB":
		return "BLOB"
	case upper == "DATETIME" || upper == "TIMESTAMP" || upper == "DATE" || upper == "TIME":
		return "TEXT"
	default:
		return t
	}
}

// quoteColumns quotes and joins column names.
func quoteColumns(cols []string) string {
	quoted := make([]string, len(cols))
	for i, c := range cols {
		quoted[i] = fmt.Sprintf("%q", c)
	}
	return strings.Join(quoted, ", ")
}

// scanQueryRows executes a SELECT query and returns the rows as maps.
func scanQueryRows(ctx context.Context, db *sql.DB, query string, args ...interface{}) ([]map[string]interface{}, []string, error) {
	rows, err := db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, nil, err
	}
	defer rows.Close()

	columns, err := rows.Columns()
	if err != nil {
		return nil, nil, err
	}

	var result []map[string]interface{}
	for rows.Next() {
		values := make([]interface{}, len(columns))
		valuePtrs := make([]interface{}, len(columns))
		for i := range values {
			valuePtrs[i] = &values[i]
		}
		if err := rows.Scan(valuePtrs...); err != nil {
			return nil, nil, fmt.Errorf("scan row: %w", err)
		}
		row := make(map[string]interface{}, len(columns))
		for i, col := range columns {
			val := values[i]
			if b, ok := val.([]byte); ok {
				row[col] = string(b)
			} else {
				row[col] = val
			}
		}
		result = append(result, row)
	}
	if err := rows.Err(); err != nil {
		return nil, nil, err
	}
	return result, columns, nil
}

// buildWhereClause builds a SQL WHERE clause from filters.
func buildWhereClause(filters []VMQueryFilter, combinator string) (string, []interface{}) {
	if len(filters) == 0 {
		return "", nil
	}

	joiner := "AND"
	if strings.EqualFold(combinator, "or") {
		joiner = "OR"
	}

	clauses := make([]string, 0, len(filters))
	args := make([]interface{}, 0, len(filters))

	for _, f := range filters {
		op := strings.ToUpper(f.Operator)
		switch op {
		case "=", "!=", ">", ">=", "<", "<=":
			clauses = append(clauses, fmt.Sprintf("%q %s ?", f.Column, op))
			args = append(args, f.Value)
		case "LIKE", "NOT LIKE":
			clauses = append(clauses, fmt.Sprintf("%q %s ?", f.Column, op))
			args = append(args, f.Value)
		case "IS NULL":
			clauses = append(clauses, fmt.Sprintf("%q IS NULL", f.Column))
		case "IS NOT NULL":
			clauses = append(clauses, fmt.Sprintf("%q IS NOT NULL", f.Column))
		case "IN":
			parts := strings.Split(f.Value, ",")
			placeholders := make([]string, len(parts))
			for i, p := range parts {
				placeholders[i] = "?"
				args = append(args, strings.TrimSpace(p))
			}
			clauses = append(clauses, fmt.Sprintf("%q IN (%s)", f.Column, strings.Join(placeholders, ",")))
		default:
			clauses = append(clauses, fmt.Sprintf("%q = ?", f.Column))
			args = append(args, f.Value)
		}
	}

	return strings.Join(clauses, " "+joiner+" "), args
}
