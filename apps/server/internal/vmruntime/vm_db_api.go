package vmruntime

import (
	"database/sql"
	"fmt"
	"sort"
	"strings"

	"github.com/dop251/goja"
)

// injectDBAPI injects the `db` global object into the goja VM runtime.
func injectDBAPI(vm *goja.Runtime, db *sql.DB) {
	dbObj := vm.NewObject()
	dbObj.Set("query", func(call goja.FunctionCall) goja.Value {
		return dbQuery(vm, db, call)
	})
	dbObj.Set("queryOne", func(call goja.FunctionCall) goja.Value {
		return dbQueryOne(vm, db, call)
	})
	dbObj.Set("insert", func(call goja.FunctionCall) goja.Value {
		return dbInsert(vm, db, call)
	})
	dbObj.Set("update", func(call goja.FunctionCall) goja.Value {
		return dbUpdate(vm, db, call)
	})
	dbObj.Set("delete", func(call goja.FunctionCall) goja.Value {
		return dbDelete(vm, db, call)
	})
	dbObj.Set("execute", func(call goja.FunctionCall) goja.Value {
		return dbExecute(vm, db, call)
	})
	vm.Set("db", dbObj)
}

// dbQuery implements db.query(sql, params?) — returns array of row objects.
func dbQuery(vm *goja.Runtime, db *sql.DB, call goja.FunctionCall) goja.Value {
	sqlStr, params, err := extractSQLAndParams(vm, call)
	if err != nil {
		panic(vm.NewGoError(err))
	}

	rows, err := scanRows(db, sqlStr, params...)
	if err != nil {
		panic(vm.NewGoError(fmt.Errorf("db.query: %w", err)))
	}
	return vm.ToValue(rows)
}

// dbQueryOne implements db.queryOne(sql, params?) — returns single row object or null.
func dbQueryOne(vm *goja.Runtime, db *sql.DB, call goja.FunctionCall) goja.Value {
	sqlStr, params, err := extractSQLAndParams(vm, call)
	if err != nil {
		panic(vm.NewGoError(err))
	}

	rows, err := scanRows(db, sqlStr, params...)
	if err != nil {
		panic(vm.NewGoError(fmt.Errorf("db.queryOne: %w", err)))
	}
	if len(rows) == 0 {
		return goja.Null()
	}
	return vm.ToValue(rows[0])
}

// dbInsert implements db.insert(table, data) — returns { lastInsertId, affectedRows }.
func dbInsert(vm *goja.Runtime, db *sql.DB, call goja.FunctionCall) goja.Value {
	if len(call.Arguments) < 2 {
		panic(vm.NewGoError(fmt.Errorf("db.insert requires (table, data)")))
	}
	table := call.Arguments[0].String()
	data := exportObject(vm, call.Arguments[1])
	if len(data) == 0 {
		panic(vm.NewGoError(fmt.Errorf("db.insert: data must be a non-empty object")))
	}

	columns, placeholders, values := buildInsertParts(data)
	query := fmt.Sprintf("INSERT INTO %q (%s) VALUES (%s)", table, columns, placeholders)

	result, err := db.Exec(query, values...)
	if err != nil {
		panic(vm.NewGoError(fmt.Errorf("db.insert: %w", err)))
	}
	lastID, _ := result.LastInsertId()
	affected, _ := result.RowsAffected()
	return vm.ToValue(map[string]interface{}{
		"lastInsertId": lastID,
		"affectedRows": affected,
	})
}

// dbUpdate implements db.update(table, data, where) — returns { affectedRows }.
func dbUpdate(vm *goja.Runtime, db *sql.DB, call goja.FunctionCall) goja.Value {
	if len(call.Arguments) < 3 {
		panic(vm.NewGoError(fmt.Errorf("db.update requires (table, data, where)")))
	}
	table := call.Arguments[0].String()
	data := exportObject(vm, call.Arguments[1])
	where := exportObject(vm, call.Arguments[2])
	if len(data) == 0 {
		panic(vm.NewGoError(fmt.Errorf("db.update: data must be a non-empty object")))
	}
	if len(where) == 0 {
		panic(vm.NewGoError(fmt.Errorf("db.update: where must be a non-empty object")))
	}

	setClause, setArgs := buildSetClause(data)
	whereClause, whereArgs := buildWhereFromMap(where)
	args := append(setArgs, whereArgs...)

	query := fmt.Sprintf("UPDATE %q SET %s WHERE %s", table, setClause, whereClause)
	result, err := db.Exec(query, args...)
	if err != nil {
		panic(vm.NewGoError(fmt.Errorf("db.update: %w", err)))
	}
	affected, _ := result.RowsAffected()
	return vm.ToValue(map[string]interface{}{
		"affectedRows": affected,
	})
}

// dbDelete implements db.delete(table, where) — returns { affectedRows }.
func dbDelete(vm *goja.Runtime, db *sql.DB, call goja.FunctionCall) goja.Value {
	if len(call.Arguments) < 2 {
		panic(vm.NewGoError(fmt.Errorf("db.delete requires (table, where)")))
	}
	table := call.Arguments[0].String()
	where := exportObject(vm, call.Arguments[1])
	if len(where) == 0 {
		panic(vm.NewGoError(fmt.Errorf("db.delete: where must be a non-empty object")))
	}

	whereClause, whereArgs := buildWhereFromMap(where)
	query := fmt.Sprintf("DELETE FROM %q WHERE %s", table, whereClause)
	result, err := db.Exec(query, args(whereArgs)...)
	if err != nil {
		panic(vm.NewGoError(fmt.Errorf("db.delete: %w", err)))
	}
	affected, _ := result.RowsAffected()
	return vm.ToValue(map[string]interface{}{
		"affectedRows": affected,
	})
}

// dbExecute implements db.execute(sql, params?) — returns { affectedRows }.
func dbExecute(vm *goja.Runtime, db *sql.DB, call goja.FunctionCall) goja.Value {
	sqlStr, params, err := extractSQLAndParams(vm, call)
	if err != nil {
		panic(vm.NewGoError(err))
	}

	result, err := db.Exec(sqlStr, params...)
	if err != nil {
		panic(vm.NewGoError(fmt.Errorf("db.execute: %w", err)))
	}
	affected, _ := result.RowsAffected()
	return vm.ToValue(map[string]interface{}{
		"affectedRows": affected,
	})
}

// === Helper functions ===

// extractSQLAndParams extracts the SQL string and optional params array from a goja function call.
func extractSQLAndParams(vm *goja.Runtime, call goja.FunctionCall) (string, []interface{}, error) {
	if len(call.Arguments) < 1 {
		return "", nil, fmt.Errorf("SQL string is required")
	}
	sqlStr := call.Arguments[0].String()

	var params []interface{}
	if len(call.Arguments) >= 2 && !goja.IsUndefined(call.Arguments[1]) && !goja.IsNull(call.Arguments[1]) {
		exported := call.Arguments[1].Export()
		if arr, ok := exported.([]interface{}); ok {
			params = arr
		}
	}
	return sqlStr, params, nil
}

// exportObject exports a goja value to a Go map[string]interface{}.
func exportObject(vm *goja.Runtime, val goja.Value) map[string]interface{} {
	if goja.IsUndefined(val) || goja.IsNull(val) {
		return nil
	}
	exported := val.Export()
	if m, ok := exported.(map[string]interface{}); ok {
		return m
	}
	return nil
}

// scanRows executes a SELECT query and returns rows as []map[string]interface{}.
func scanRows(db *sql.DB, query string, args ...interface{}) ([]map[string]interface{}, error) {
	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	columns, err := rows.Columns()
	if err != nil {
		return nil, err
	}

	var result []map[string]interface{}
	for rows.Next() {
		values := make([]interface{}, len(columns))
		valuePtrs := make([]interface{}, len(columns))
		for i := range values {
			valuePtrs[i] = &values[i]
		}
		if err := rows.Scan(valuePtrs...); err != nil {
			return nil, fmt.Errorf("scan: %w", err)
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
		return nil, err
	}
	if result == nil {
		result = []map[string]interface{}{}
	}
	return result, nil
}

// buildInsertParts builds columns, placeholders, and values for an INSERT statement.
func buildInsertParts(data map[string]interface{}) (string, string, []interface{}) {
	keys := sortedKeys(data)
	columns := make([]string, len(keys))
	placeholders := make([]string, len(keys))
	values := make([]interface{}, len(keys))
	for i, k := range keys {
		columns[i] = fmt.Sprintf("%q", k)
		placeholders[i] = "?"
		values[i] = data[k]
	}
	return strings.Join(columns, ", "), strings.Join(placeholders, ", "), values
}

// buildSetClause builds a SET clause for UPDATE.
func buildSetClause(data map[string]interface{}) (string, []interface{}) {
	keys := sortedKeys(data)
	parts := make([]string, len(keys))
	values := make([]interface{}, len(keys))
	for i, k := range keys {
		parts[i] = fmt.Sprintf("%q = ?", k)
		values[i] = data[k]
	}
	return strings.Join(parts, ", "), values
}

// buildWhereFromMap builds a WHERE clause from a map (all conditions ANDed).
func buildWhereFromMap(where map[string]interface{}) (string, []interface{}) {
	keys := sortedKeys(where)
	parts := make([]string, len(keys))
	values := make([]interface{}, len(keys))
	for i, k := range keys {
		parts[i] = fmt.Sprintf("%q = ?", k)
		values[i] = where[k]
	}
	return strings.Join(parts, " AND "), values
}

// sortedKeys returns the keys of a map sorted alphabetically for deterministic output.
func sortedKeys(m map[string]interface{}) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	return keys
}

// args is a helper to convert []interface{} to ...interface{} (identity, for readability).
func args(a []interface{}) []interface{} {
	return a
}
