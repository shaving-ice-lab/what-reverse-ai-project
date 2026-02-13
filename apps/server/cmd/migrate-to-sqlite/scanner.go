package main

import (
	"fmt"

	"gorm.io/gorm"
)

// WorkspaceDatabaseRecord represents a row from what_reverse_workspace_databases
type WorkspaceDatabaseRecord struct {
	ID          string `gorm:"column:id"`
	WorkspaceID string `gorm:"column:workspace_id"`
	DBName      string `gorm:"column:db_name"`
	DBUser      string `gorm:"column:db_user"`
	SecretRef   string `gorm:"column:secret_ref"`
	Status      string `gorm:"column:status"`
}

// MigrationResult holds the result of migrating a single workspace
type MigrationResult struct {
	TableCount int
	TotalRows  int64
}

// scanWorkspaceDatabases queries the main MySQL database for workspace_databases
// records with status='ready'. If workspaceID is non-empty, only that workspace is returned.
func scanWorkspaceDatabases(db *gorm.DB, workspaceID string) ([]WorkspaceDatabaseRecord, error) {
	var records []WorkspaceDatabaseRecord

	query := db.Table("what_reverse_workspace_databases").Where("status = ?", "ready")
	if workspaceID != "" {
		query = query.Where("workspace_id = ?", workspaceID)
	}

	if err := query.Find(&records).Error; err != nil {
		return nil, fmt.Errorf("scan workspace_databases: %w", err)
	}

	return records, nil
}
