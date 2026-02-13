package main

import (
	"context"
	"database/sql"
	"fmt"
)

// validateTableRowCount compares the expected row count (from MySQL export) with the
// actual row count in the SQLite destination table.
func validateTableRowCount(ctx context.Context, db *sql.DB, tableName string, expectedCount int64) error {
	var actualCount int64
	if err := db.QueryRowContext(ctx, "SELECT COUNT(*) FROM "+tableName).Scan(&actualCount); err != nil {
		return fmt.Errorf("count rows in %s: %w", tableName, err)
	}

	if actualCount != expectedCount {
		return fmt.Errorf("row count mismatch for %s: expected %d, got %d", tableName, expectedCount, actualCount)
	}

	return nil
}
