package executor

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"regexp"
	"sort"
	"strings"
)

// DB node types
const (
	NodeTypeDBSelect  NodeType = "db_select"
	NodeTypeDBInsert  NodeType = "db_insert"
	NodeTypeDBUpdate  NodeType = "db_update"
	NodeTypeDBDelete  NodeType = "db_delete"
	NodeTypeDBMigrate NodeType = "db_migrate"
)

type DatabaseExecutor struct {
	nodeType         NodeType
	defaultOperation string
	dbProvider       DBProvider
	dbAuthorizer     DBAuthorizer
}

func NewDatabaseExecutor(nodeType NodeType, defaultOperation string, dbProvider DBProvider, dbAuthorizer DBAuthorizer) *DatabaseExecutor {
	return &DatabaseExecutor{
		nodeType:         nodeType,
		defaultOperation: defaultOperation,
		dbProvider:       dbProvider,
		dbAuthorizer:     dbAuthorizer,
	}
}

func (e *DatabaseExecutor) GetType() NodeType {
	return e.nodeType
}

func (e *DatabaseExecutor) recordDBWriteAudit(ctx context.Context, execCtx *ExecutionContext, node *NodeDefinition, targetType string, metadata map[string]interface{}) {
	if execCtx == nil {
		return
	}
	if metadata == nil {
		metadata = map[string]interface{}{}
	}
	if node != nil {
		if node.ID != "" && metadata["node_id"] == nil {
			metadata["node_id"] = node.ID
		}
		if node.Type != "" && metadata["node_type"] == nil {
			metadata["node_type"] = string(node.Type)
		}
	}
	if execCtx.TriggerType != "" && metadata["trigger_type"] == nil {
		metadata["trigger_type"] = execCtx.TriggerType
	}
	for key, value := range execCtx.TriggerData {
		if metadata[key] == nil {
			metadata[key] = value
		}
	}
	if strings.TrimSpace(targetType) == "" {
		targetType = "db_table"
	}
	execCtx.RecordAudit(ctx, AuditEvent{
		Action:     "data_written",
		TargetType: targetType,
		Metadata:   metadata,
	})
}

func (e *DatabaseExecutor) Execute(ctx context.Context, node *NodeDefinition, inputs map[string]interface{}, execCtx *ExecutionContext) (*NodeResult, error) {
	operation := strings.ToLower(getString(node.Config, "operation"))
	if operation == "" {
		operation = e.defaultOperation
	}
	if operation == "" {
		return nil, errors.New("db operation is required")
	}

	if e.dbProvider == nil {
		return nil, errors.New("workspace database provider not configured")
	}
	if execCtx.WorkspaceID == "" {
		return nil, errors.New("workspace_id missing in execution context")
	}
	if e.dbAuthorizer != nil && strings.TrimSpace(execCtx.UserID) != "" {
		if err := e.dbAuthorizer.EnsureAccess(ctx, execCtx.WorkspaceID, execCtx.UserID); err != nil {
			return nil, err
		}
	}

	db, err := e.dbProvider.GetConnection(ctx, execCtx.WorkspaceID)
	if err != nil {
		return nil, err
	}

	switch operation {
	case "select":
		table := strings.TrimSpace(getString(node.Config, "table"))
		where := strings.TrimSpace(getString(node.Config, "where"))
		limit := getInt(node.Config, "limit", 0)
		query, args, err := buildSelectSQL(node.Config, inputs, execCtx)
		if err != nil {
			return nil, err
		}
		rows, err := db.QueryContext(ctx, query, args...)
		if err != nil {
			return nil, err
		}
		defer rows.Close()

		resultRows, columns, err := scanRows(rows)
		if err != nil {
			return nil, err
		}
		count := len(resultRows)
		var first interface{}
		if count > 0 {
			first = resultRows[0]
		}
		outputs := map[string]interface{}{
			"rows":    resultRows,
			"count":   count,
			"first":   first,
			"output":  resultRows,
			"result":  resultRows,
			"columns": columns,
			"table":   table,
			"where":   where,
			"limit":   limit,
		}
		return &NodeResult{
			NodeID:  node.ID,
			Status:  NodeStatusCompleted,
			Outputs: outputs,
		}, nil
	case "insert":
		table := strings.TrimSpace(getString(node.Config, "table"))
		query, args, err := buildInsertSQL(node.Config, inputs, execCtx)
		if err != nil {
			return nil, err
		}
		result, err := db.ExecContext(ctx, query, args...)
		if err != nil {
			return nil, err
		}
		rowsAffected, _ := result.RowsAffected()
		insertedID, _ := result.LastInsertId()
		auditMetadata := map[string]interface{}{
			"operation":     "insert",
			"table":         table,
			"rows_affected": rowsAffected,
		}
		if insertedID > 0 {
			auditMetadata["inserted_id"] = insertedID
		}
		e.recordDBWriteAudit(ctx, execCtx, node, "db_table", auditMetadata)
		outputs := map[string]interface{}{
			"insertedId":   insertedID,
			"rowsAffected": rowsAffected,
			"output":       map[string]interface{}{"insertedId": insertedID, "rowsAffected": rowsAffected},
			"result":       map[string]interface{}{"insertedId": insertedID, "rowsAffected": rowsAffected},
			"table":        table,
		}
		return &NodeResult{
			NodeID:  node.ID,
			Status:  NodeStatusCompleted,
			Outputs: outputs,
		}, nil
	case "update":
		table := strings.TrimSpace(getString(node.Config, "table"))
		where := strings.TrimSpace(getString(node.Config, "where"))
		query, args, err := buildUpdateSQL(node.Config, inputs, execCtx)
		if err != nil {
			return nil, err
		}
		result, err := db.ExecContext(ctx, query, args...)
		if err != nil {
			return nil, err
		}
		rowsAffected, _ := result.RowsAffected()
		e.recordDBWriteAudit(ctx, execCtx, node, "db_table", map[string]interface{}{
			"operation":     "update",
			"table":         table,
			"rows_affected": rowsAffected,
		})
		outputs := map[string]interface{}{
			"rowsAffected": rowsAffected,
			"output":       rowsAffected,
			"result":       rowsAffected,
			"table":        table,
			"where":        where,
		}
		return &NodeResult{
			NodeID:  node.ID,
			Status:  NodeStatusCompleted,
			Outputs: outputs,
		}, nil
	case "delete":
		table := strings.TrimSpace(getString(node.Config, "table"))
		where := strings.TrimSpace(getString(node.Config, "where"))
		query, args, err := buildDeleteSQL(node.Config, inputs, execCtx)
		if err != nil {
			return nil, err
		}
		result, err := db.ExecContext(ctx, query, args...)
		if err != nil {
			return nil, err
		}
		rowsAffected, _ := result.RowsAffected()
		e.recordDBWriteAudit(ctx, execCtx, node, "db_table", map[string]interface{}{
			"operation":     "delete",
			"table":         table,
			"rows_affected": rowsAffected,
		})
		outputs := map[string]interface{}{
			"rowsAffected": rowsAffected,
			"output":       rowsAffected,
			"result":       rowsAffected,
			"table":        table,
			"where":        where,
		}
		return &NodeResult{
			NodeID:  node.ID,
			Status:  NodeStatusCompleted,
			Outputs: outputs,
		}, nil
	case "migrate":
		query := strings.TrimSpace(getString(node.Config, "sql"))
		if query == "" {
			if sqlInput, ok := inputs["sql"].(string); ok {
				query = strings.TrimSpace(sqlInput)
			}
		}
		if query == "" {
			return nil, errors.New("migration sql is required")
		}
		query = interpolateVariables(query, inputs, execCtx)
		if _, err := db.ExecContext(ctx, query); err != nil {
			return nil, err
		}
		e.recordDBWriteAudit(ctx, execCtx, node, "db_migration", map[string]interface{}{
			"operation":     "migrate",
			"statement_len": len(query),
		})
		outputs := map[string]interface{}{
			"applied":      true,
			"appliedCount": 1,
			"output":       true,
			"result":       1,
		}
		return &NodeResult{
			NodeID:  node.ID,
			Status:  NodeStatusCompleted,
			Outputs: outputs,
		}, nil
	default:
		return nil, fmt.Errorf("unknown db operation: %s", operation)
	}
}

var identifierPattern = regexp.MustCompile(`^[a-zA-Z_][a-zA-Z0-9_]*$`)

func quoteIdentifier(name string) (string, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return "", errors.New("identifier is required")
	}
	parts := strings.Split(name, ".")
	quoted := make([]string, 0, len(parts))
	for _, part := range parts {
		if !identifierPattern.MatchString(part) {
			return "", fmt.Errorf("invalid identifier: %s", name)
		}
		quoted = append(quoted, fmt.Sprintf("`%s`", part))
	}
	return strings.Join(quoted, "."), nil
}

func buildSelectSQL(config map[string]interface{}, inputs map[string]interface{}, execCtx *ExecutionContext) (string, []interface{}, error) {
	sqlText := strings.TrimSpace(getString(config, "sql"))
	if sqlText != "" {
		return interpolateVariables(sqlText, inputs, execCtx), nil, nil
	}

	table := getString(config, "table")
	quotedTable, err := quoteIdentifier(table)
	if err != nil {
		return "", nil, err
	}

	where := strings.TrimSpace(getString(config, "where"))
	if where != "" {
		where = interpolateVariables(where, inputs, execCtx)
	}

	query := fmt.Sprintf("SELECT * FROM %s", quotedTable)
	if where != "" {
		query += " WHERE " + where
	}

	limit := getInt(config, "limit", 0)
	if limit > 0 {
		query += fmt.Sprintf(" LIMIT %d", limit)
	}

	return query, nil, nil
}

func buildInsertSQL(config map[string]interface{}, inputs map[string]interface{}, execCtx *ExecutionContext) (string, []interface{}, error) {
	sqlText := strings.TrimSpace(getString(config, "sql"))
	if sqlText != "" {
		return interpolateVariables(sqlText, inputs, execCtx), nil, nil
	}

	table := getString(config, "table")
	quotedTable, err := quoteIdentifier(table)
	if err != nil {
		return "", nil, err
	}

	valuesRaw := firstNonNil(config["values"], inputs["values"], inputs["input"])
	values, err := resolveValues(valuesRaw, inputs, execCtx)
	if err != nil {
		return "", nil, err
	}
	if len(values) == 0 {
		return "", nil, errors.New("insert values are required")
	}

	columns := make([]string, 0, len(values))
	for key := range values {
		columns = append(columns, key)
	}
	sort.Strings(columns)

	placeholders := make([]string, 0, len(columns))
	args := make([]interface{}, 0, len(columns))
	quotedColumns := make([]string, 0, len(columns))
	for _, col := range columns {
		quotedCol, err := quoteIdentifier(col)
		if err != nil {
			return "", nil, err
		}
		quotedColumns = append(quotedColumns, quotedCol)
		placeholders = append(placeholders, "?")
		args = append(args, values[col])
	}

	query := fmt.Sprintf("INSERT INTO %s (%s) VALUES (%s)", quotedTable, strings.Join(quotedColumns, ", "), strings.Join(placeholders, ", "))
	return query, args, nil
}

func buildUpdateSQL(config map[string]interface{}, inputs map[string]interface{}, execCtx *ExecutionContext) (string, []interface{}, error) {
	sqlText := strings.TrimSpace(getString(config, "sql"))
	if sqlText != "" {
		return interpolateVariables(sqlText, inputs, execCtx), nil, nil
	}

	table := getString(config, "table")
	quotedTable, err := quoteIdentifier(table)
	if err != nil {
		return "", nil, err
	}

	valuesRaw := firstNonNil(config["values"], inputs["values"], inputs["input"])
	values, err := resolveValues(valuesRaw, inputs, execCtx)
	if err != nil {
		return "", nil, err
	}
	if len(values) == 0 {
		return "", nil, errors.New("update values are required")
	}

	where := strings.TrimSpace(getString(config, "where"))
	if where == "" {
		return "", nil, errors.New("update where clause is required")
	}
	where = interpolateVariables(where, inputs, execCtx)

	columns := make([]string, 0, len(values))
	for key := range values {
		columns = append(columns, key)
	}
	sort.Strings(columns)

	setClauses := make([]string, 0, len(columns))
	args := make([]interface{}, 0, len(columns))
	for _, col := range columns {
		quotedCol, err := quoteIdentifier(col)
		if err != nil {
			return "", nil, err
		}
		setClauses = append(setClauses, fmt.Sprintf("%s = ?", quotedCol))
		args = append(args, values[col])
	}

	query := fmt.Sprintf("UPDATE %s SET %s WHERE %s", quotedTable, strings.Join(setClauses, ", "), where)
	return query, args, nil
}

func buildDeleteSQL(config map[string]interface{}, inputs map[string]interface{}, execCtx *ExecutionContext) (string, []interface{}, error) {
	sqlText := strings.TrimSpace(getString(config, "sql"))
	if sqlText != "" {
		return interpolateVariables(sqlText, inputs, execCtx), nil, nil
	}

	table := getString(config, "table")
	quotedTable, err := quoteIdentifier(table)
	if err != nil {
		return "", nil, err
	}

	where := strings.TrimSpace(getString(config, "where"))
	if where == "" {
		return "", nil, errors.New("delete where clause is required")
	}
	where = interpolateVariables(where, inputs, execCtx)

	query := fmt.Sprintf("DELETE FROM %s WHERE %s", quotedTable, where)
	return query, nil, nil
}

func resolveValues(value interface{}, inputs map[string]interface{}, execCtx *ExecutionContext) (map[string]interface{}, error) {
	if value == nil {
		return nil, nil
	}
	switch v := value.(type) {
	case string:
		rendered := interpolateVariables(v, inputs, execCtx)
		parsed, err := parseJSONMap(rendered)
		if err != nil {
			return nil, err
		}
		return parsed, nil
	case map[string]interface{}:
		resolved := make(map[string]interface{}, len(v))
		for key, rawVal := range v {
			resolved[key] = resolveValue(rawVal, inputs, execCtx)
		}
		return resolved, nil
	default:
		return nil, errors.New("values must be JSON object or string")
	}
}

func parseJSONMap(value string) (map[string]interface{}, error) {
	if strings.TrimSpace(value) == "" {
		return map[string]interface{}{}, nil
	}
	var parsed interface{}
	if err := json.Unmarshal([]byte(value), &parsed); err != nil {
		return nil, fmt.Errorf("invalid values json: %w", err)
	}
	obj, ok := parsed.(map[string]interface{})
	if !ok {
		return nil, errors.New("values json must be an object")
	}
	return obj, nil
}

func scanRows(rows *sql.Rows) ([]map[string]interface{}, []string, error) {
	columns, err := rows.Columns()
	if err != nil {
		return nil, nil, err
	}
	results := make([]map[string]interface{}, 0)

	for rows.Next() {
		values := make([]interface{}, len(columns))
		dest := make([]interface{}, len(columns))
		for i := range values {
			dest[i] = &values[i]
		}
		if err := rows.Scan(dest...); err != nil {
			return nil, nil, err
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
		results = append(results, row)
	}

	if err := rows.Err(); err != nil {
		return nil, nil, err
	}

	return results, columns, nil
}

func firstNonNil(values ...interface{}) interface{} {
	for _, v := range values {
		if v != nil {
			return v
		}
	}
	return nil
}
