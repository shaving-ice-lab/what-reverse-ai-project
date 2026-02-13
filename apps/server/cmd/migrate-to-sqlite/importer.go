package main

import (
	"context"
	"database/sql"
	"fmt"
	"path/filepath"
	"strings"

	_ "modernc.org/sqlite"
)

const batchSize = 500

// migrateWorkspace performs the full migration for a single workspace:
// 1. Export tables from source MySQL
// 2. Convert DDL to SQLite
// 3. Create SQLite file + tables
// 4. Import data in batches
// 5. Validate row counts
func migrateWorkspace(ctx context.Context, rec WorkspaceDatabaseRecord, srcDSN string, baseDir string) (*MigrationResult, error) {
	// 1. Export from MySQL
	tables, err := exportTables(ctx, srcDSN)
	if err != nil {
		return nil, fmt.Errorf("export: %w", err)
	}

	if len(tables) == 0 {
		return &MigrationResult{TableCount: 0, TotalRows: 0}, nil
	}

	// 2. Open/create SQLite file
	sqlitePath := filepath.Join(baseDir, rec.WorkspaceID+".db")
	dstDSN := fmt.Sprintf("file:%s?_journal_mode=WAL&_busy_timeout=5000&_foreign_keys=on", sqlitePath)
	dstDB, err := sql.Open("sqlite", dstDSN)
	if err != nil {
		return nil, fmt.Errorf("open sqlite: %w", err)
	}
	defer dstDB.Close()

	dstDB.SetMaxOpenConns(1)
	dstDB.SetMaxIdleConns(1)

	// Configure pragmas
	for _, pragma := range []string{
		"PRAGMA journal_mode = WAL",
		"PRAGMA busy_timeout = 5000",
		"PRAGMA foreign_keys = ON",
		"PRAGMA synchronous = NORMAL",
		"PRAGMA cache_size = -2000",
	} {
		if _, err := dstDB.ExecContext(ctx, pragma); err != nil {
			return nil, fmt.Errorf("pragma %q: %w", pragma, err)
		}
	}

	var totalRows int64

	for _, table := range tables {
		// 3. Convert DDL and create table
		sqliteDDL := convertDDL(table.MySQLDDL)
		if _, err := dstDB.ExecContext(ctx, sqliteDDL); err != nil {
			return nil, fmt.Errorf("create table %s: %w\nDDL: %s", table.Name, err, sqliteDDL)
		}

		// Create indexes
		indexes := extractIndexes(table.Name, table.MySQLDDL)
		for _, idx := range indexes {
			if _, err := dstDB.ExecContext(ctx, idx); err != nil {
				fmt.Printf("      ⚠️  Index warning for %s: %v\n", table.Name, err)
			}
		}

		// 4. Import data in batches
		if len(table.Rows) > 0 {
			imported, err := importTableData(ctx, dstDB, table.Name, table.Columns, table.Rows)
			if err != nil {
				return nil, fmt.Errorf("import data %s: %w", table.Name, err)
			}
			totalRows += imported
		}

		// 5. Validate
		if err := validateTableRowCount(ctx, dstDB, table.Name, table.RowCount); err != nil {
			return nil, fmt.Errorf("validate %s: %w", table.Name, err)
		}
	}

	return &MigrationResult{
		TableCount: len(tables),
		TotalRows:  totalRows,
	}, nil
}

// importTableData inserts rows into the SQLite table in batches using transactions
func importTableData(ctx context.Context, db *sql.DB, tableName string, columns []string, rows [][]interface{}) (int64, error) {
	if len(rows) == 0 {
		return 0, nil
	}

	placeholders := "(" + strings.Repeat("?,", len(columns)-1) + "?)"
	colList := strings.Join(columns, ", ")
	var total int64

	for i := 0; i < len(rows); i += batchSize {
		end := i + batchSize
		if end > len(rows) {
			end = len(rows)
		}
		batch := rows[i:end]

		tx, err := db.BeginTx(ctx, nil)
		if err != nil {
			return total, fmt.Errorf("begin tx at batch %d: %w", i/batchSize, err)
		}

		insertSQL := fmt.Sprintf("INSERT INTO %s (%s) VALUES %s",
			tableName, colList, placeholders)

		stmt, err := tx.PrepareContext(ctx, insertSQL)
		if err != nil {
			tx.Rollback()
			return total, fmt.Errorf("prepare insert: %w", err)
		}

		for _, row := range batch {
			if _, err := stmt.ExecContext(ctx, row...); err != nil {
				stmt.Close()
				tx.Rollback()
				return total, fmt.Errorf("insert row: %w", err)
			}
			total++
		}

		stmt.Close()
		if err := tx.Commit(); err != nil {
			return total, fmt.Errorf("commit batch %d: %w", i/batchSize, err)
		}
	}

	return total, nil
}
