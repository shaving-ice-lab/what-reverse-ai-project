package main

import (
	"context"
	"database/sql"
	"fmt"

	_ "github.com/go-sql-driver/mysql"
)

// ExportedTable holds a MySQL table's DDL and row data
type ExportedTable struct {
	Name     string
	MySQLDDL string
	Columns  []string
	Rows     [][]interface{}
	RowCount int64
}

// exportTables connects to the source MySQL workspace database and exports all tables
func exportTables(ctx context.Context, srcDSN string) ([]ExportedTable, error) {
	srcDB, err := sql.Open("mysql", srcDSN)
	if err != nil {
		return nil, fmt.Errorf("open source mysql: %w", err)
	}
	defer srcDB.Close()

	if err := srcDB.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("ping source mysql: %w", err)
	}

	tableNames, err := listMySQLTables(ctx, srcDB)
	if err != nil {
		return nil, fmt.Errorf("list tables: %w", err)
	}

	var tables []ExportedTable
	for _, name := range tableNames {
		t, err := exportTable(ctx, srcDB, name)
		if err != nil {
			return nil, fmt.Errorf("export table %s: %w", name, err)
		}
		tables = append(tables, *t)
	}

	return tables, nil
}

// listMySQLTables returns all user table names in the connected database
func listMySQLTables(ctx context.Context, db *sql.DB) ([]string, error) {
	rows, err := db.QueryContext(ctx, "SHOW TABLES")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var names []string
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			return nil, err
		}
		names = append(names, name)
	}
	return names, rows.Err()
}

// exportTable exports a single table's DDL and all row data
func exportTable(ctx context.Context, db *sql.DB, tableName string) (*ExportedTable, error) {
	// Get CREATE TABLE DDL
	var tblName, ddl string
	if err := db.QueryRowContext(ctx, "SHOW CREATE TABLE `"+tableName+"`").Scan(&tblName, &ddl); err != nil {
		return nil, fmt.Errorf("show create table: %w", err)
	}

	// Get column names
	colRows, err := db.QueryContext(ctx, "SELECT * FROM `"+tableName+"` LIMIT 0")
	if err != nil {
		return nil, fmt.Errorf("get columns: %w", err)
	}
	columns, err := colRows.Columns()
	colRows.Close()
	if err != nil {
		return nil, fmt.Errorf("read columns: %w", err)
	}

	// Export all rows
	rows, err := db.QueryContext(ctx, "SELECT * FROM `"+tableName+"`")
	if err != nil {
		return nil, fmt.Errorf("select all: %w", err)
	}
	defer rows.Close()

	var allRows [][]interface{}
	colCount := len(columns)

	for rows.Next() {
		values := make([]interface{}, colCount)
		scanDest := make([]interface{}, colCount)
		for i := range values {
			scanDest[i] = &values[i]
		}
		if err := rows.Scan(scanDest...); err != nil {
			return nil, fmt.Errorf("scan row: %w", err)
		}

		// Convert []byte to string for text columns
		row := make([]interface{}, colCount)
		for i, v := range values {
			if b, ok := v.([]byte); ok {
				row[i] = string(b)
			} else {
				row[i] = v
			}
		}
		allRows = append(allRows, row)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate rows: %w", err)
	}

	return &ExportedTable{
		Name:     tableName,
		MySQLDDL: ddl,
		Columns:  columns,
		Rows:     allRows,
		RowCount: int64(len(allRows)),
	}, nil
}
