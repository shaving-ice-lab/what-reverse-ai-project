package migration

import (
	"context"

	"gorm.io/gorm"
)

// WorkspaceBackfillResult 回填结果
type WorkspaceBackfillResult struct {
	CreatedWorkspaces  int64 `json:"created_workspaces"`
	UpdatedWorkflows   int64 `json:"updated_workflows"`
	UpdatedExecutions  int64 `json:"updated_executions"`
	UpdatedAPIKeys     int64 `json:"updated_api_keys"`
	UpdatedApps        int64 `json:"updated_apps"`
	UpdatedAppSessions int64 `json:"updated_app_sessions"`
}

// WorkspaceConsistencyReport 一致性校验结果
type WorkspaceConsistencyReport struct {
	UsersMissingWorkspace       int64 `json:"users_missing_workspace"`
	WorkflowsMissingWorkspace   int64 `json:"workflows_missing_workspace"`
	ExecutionsMissingWorkspace  int64 `json:"executions_missing_workspace"`
	APIKeysMissingWorkspace     int64 `json:"api_keys_missing_workspace"`
	AppsMissingWorkspace        int64 `json:"apps_missing_workspace"`
	AppSessionsMissingWorkspace int64 `json:"app_sessions_missing_workspace"`
}

// RunWorkspaceBackfill 回填默认 workspace 与 workspace_id
func RunWorkspaceBackfill(ctx context.Context, db *gorm.DB) (*WorkspaceBackfillResult, error) {
	result := &WorkspaceBackfillResult{}
	err := db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		createdWorkspaces, err := execRows(tx, insertDefaultWorkspaceSQL)
		if err != nil {
			return err
		}
		result.CreatedWorkspaces = createdWorkspaces

		updatedWorkflows, err := execRows(tx, backfillWorkflowWorkspaceSQL)
		if err != nil {
			return err
		}
		result.UpdatedWorkflows = updatedWorkflows

		updatedExecutions, err := execRows(tx, backfillExecutionWorkspaceSQL)
		if err != nil {
			return err
		}
		result.UpdatedExecutions = updatedExecutions

		updatedAPIKeys, err := execRows(tx, backfillAPIKeyWorkspaceSQL)
		if err != nil {
			return err
		}
		result.UpdatedAPIKeys = updatedAPIKeys

		updatedApps, err := execRows(tx, backfillAppWorkspaceSQL)
		if err != nil {
			return err
		}
		result.UpdatedApps = updatedApps

		updatedSessions, err := execRows(tx, backfillAppSessionWorkspaceSQL)
		if err != nil {
			return err
		}
		result.UpdatedAppSessions = updatedSessions

		return nil
	})
	if err != nil {
		return nil, err
	}
	return result, nil
}

// CheckWorkspaceConsistency 校验 workspace 绑定一致性
func CheckWorkspaceConsistency(ctx context.Context, db *gorm.DB) (*WorkspaceConsistencyReport, error) {
	report := &WorkspaceConsistencyReport{}
	var err error

	report.UsersMissingWorkspace, err = queryCount(ctx, db, missingWorkspaceByUserSQL)
	if err != nil {
		return nil, err
	}
	report.WorkflowsMissingWorkspace, err = queryCount(ctx, db, missingWorkspaceByWorkflowSQL)
	if err != nil {
		return nil, err
	}
	report.ExecutionsMissingWorkspace, err = queryCount(ctx, db, missingWorkspaceByExecutionSQL)
	if err != nil {
		return nil, err
	}
	report.APIKeysMissingWorkspace, err = queryCount(ctx, db, missingWorkspaceByAPIKeySQL)
	if err != nil {
		return nil, err
	}
	report.AppsMissingWorkspace, err = queryCount(ctx, db, missingWorkspaceByAppSQL)
	if err != nil {
		return nil, err
	}
	report.AppSessionsMissingWorkspace, err = queryCount(ctx, db, missingWorkspaceBySessionSQL)
	if err != nil {
		return nil, err
	}

	return report, nil
}

func execRows(db *gorm.DB, sql string) (int64, error) {
	result := db.Exec(sql)
	if result.Error != nil {
		return 0, result.Error
	}
	return result.RowsAffected, nil
}

func queryCount(ctx context.Context, db *gorm.DB, sql string) (int64, error) {
	var count int64
	if err := db.WithContext(ctx).Raw(sql).Scan(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

const insertDefaultWorkspaceSQL = `
INSERT INTO what_reverse_workspaces (
	id, owner_user_id, name, slug, status, plan, settings_json, created_at, updated_at
)
SELECT
	UUID(), u.id, 'Default Workspace', LOWER(u.username), 'active', COALESCE(u.plan, 'free'), JSON_OBJECT(), NOW(), NOW()
FROM what_reverse_users u
LEFT JOIN what_reverse_workspaces w ON w.owner_user_id = u.id
WHERE w.id IS NULL;
`

const backfillWorkflowWorkspaceSQL = `
UPDATE what_reverse_workflows wf
JOIN what_reverse_workspaces ws ON ws.owner_user_id = wf.user_id
SET wf.workspace_id = ws.id
WHERE wf.workspace_id IS NULL OR wf.workspace_id = '';
`

const backfillExecutionWorkspaceSQL = `
UPDATE what_reverse_executions ex
JOIN what_reverse_workflows wf ON wf.id = ex.workflow_id
SET ex.workspace_id = wf.workspace_id
WHERE ex.workspace_id IS NULL OR ex.workspace_id = '';
`

const backfillAPIKeyWorkspaceSQL = `
UPDATE what_reverse_api_keys ak
JOIN what_reverse_workspaces ws ON ws.owner_user_id = ak.user_id
SET ak.workspace_id = ws.id
WHERE ak.workspace_id IS NULL OR ak.workspace_id = '';
`

const backfillAppWorkspaceSQL = `
UPDATE what_reverse_apps app
JOIN what_reverse_workspaces ws ON ws.owner_user_id = app.owner_user_id
SET app.workspace_id = ws.id
WHERE app.workspace_id IS NULL OR app.workspace_id = '';
`

const backfillAppSessionWorkspaceSQL = `
UPDATE what_reverse_app_sessions s
JOIN what_reverse_apps a ON a.id = s.app_id
SET s.workspace_id = a.workspace_id
WHERE s.workspace_id IS NULL OR s.workspace_id = '';
`

const missingWorkspaceByUserSQL = `
SELECT COUNT(*)
FROM what_reverse_users u
LEFT JOIN what_reverse_workspaces w ON w.owner_user_id = u.id
WHERE w.id IS NULL;
`

const missingWorkspaceByWorkflowSQL = `
SELECT COUNT(*)
FROM what_reverse_workflows wf
LEFT JOIN what_reverse_workspaces ws ON ws.id = wf.workspace_id
WHERE wf.workspace_id IS NULL OR wf.workspace_id = '' OR ws.id IS NULL;
`

const missingWorkspaceByExecutionSQL = `
SELECT COUNT(*)
FROM what_reverse_executions ex
LEFT JOIN what_reverse_workspaces ws ON ws.id = ex.workspace_id
WHERE ex.workspace_id IS NULL OR ex.workspace_id = '' OR ws.id IS NULL;
`

const missingWorkspaceByAPIKeySQL = `
SELECT COUNT(*)
FROM what_reverse_api_keys ak
LEFT JOIN what_reverse_workspaces ws ON ws.id = ak.workspace_id
WHERE ak.workspace_id IS NULL OR ak.workspace_id = '' OR ws.id IS NULL;
`

const missingWorkspaceByAppSQL = `
SELECT COUNT(*)
FROM what_reverse_apps app
LEFT JOIN what_reverse_workspaces ws ON ws.id = app.workspace_id
WHERE app.workspace_id IS NULL OR app.workspace_id = '' OR ws.id IS NULL;
`

const missingWorkspaceBySessionSQL = `
SELECT COUNT(*)
FROM what_reverse_app_sessions s
LEFT JOIN what_reverse_workspaces ws ON ws.id = s.workspace_id
WHERE s.workspace_id IS NULL OR s.workspace_id = '' OR ws.id IS NULL;
`
