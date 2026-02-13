package vmruntime

import (
	"context"
	"crypto/sha256"
	"fmt"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// GORMCodeLoader implements VMCodeLoader by reading WorkspaceVersion.LogicCode from the database.
type GORMCodeLoader struct {
	db *gorm.DB
}

// NewGORMCodeLoader creates a VMCodeLoader backed by GORM.
func NewGORMCodeLoader(db *gorm.DB) *GORMCodeLoader {
	return &GORMCodeLoader{db: db}
}

// GetLogicCode returns the logic code and its hash for the workspace's current version.
func (l *GORMCodeLoader) GetLogicCode(ctx context.Context, workspaceID string) (string, string, error) {
	wsID, err := uuid.Parse(workspaceID)
	if err != nil {
		return "", "", fmt.Errorf("invalid workspace ID: %w", err)
	}

	var result struct {
		LogicCode *string
	}

	err = l.db.WithContext(ctx).
		Table("what_reverse_workspace_versions").
		Select("logic_code").
		Where("id = (SELECT current_version_id FROM what_reverse_workspaces WHERE id = ? AND current_version_id IS NOT NULL)", wsID).
		Scan(&result).Error
	if err != nil {
		return "", "", fmt.Errorf("query logic code: %w", err)
	}

	if result.LogicCode == nil || *result.LogicCode == "" {
		return "", "", nil
	}

	code := *result.LogicCode
	h := sha256.Sum256([]byte(code))
	return code, fmt.Sprintf("%x", h[:]), nil
}
