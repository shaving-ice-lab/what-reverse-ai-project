package agent_tools

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/agentflow/server/internal/repository"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
)

type GetWorkspaceInfoTool struct {
	dbQueryService  service.WorkspaceDBQueryService
	workflowService service.WorkflowService
}

func NewGetWorkspaceInfoTool(
	dbQueryService service.WorkspaceDBQueryService,
	workflowService service.WorkflowService,
) *GetWorkspaceInfoTool {
	return &GetWorkspaceInfoTool{
		dbQueryService:  dbQueryService,
		workflowService: workflowService,
	}
}

func (t *GetWorkspaceInfoTool) Name() string { return "get_workspace_info" }

func (t *GetWorkspaceInfoTool) Description() string {
	return "Get information about the current workspace: database tables (with columns), workflows, and database stats. Use this to understand the current state before making changes."
}

func (t *GetWorkspaceInfoTool) Parameters() json.RawMessage {
	return json.RawMessage(`{
		"type": "object",
		"properties": {
			"workspace_id": {"type": "string", "description": "Workspace ID"},
			"user_id": {"type": "string", "description": "User ID (UUID) for listing workflows"},
			"include_tables": {"type": "boolean", "default": true, "description": "Include database table info"},
			"include_workflows": {"type": "boolean", "default": true, "description": "Include workflow list"},
			"include_stats": {"type": "boolean", "default": false, "description": "Include database stats"}
		},
		"required": ["workspace_id", "user_id"]
	}`)
}

func (t *GetWorkspaceInfoTool) RequiresConfirmation() bool { return false }

type getWorkspaceInfoParams struct {
	WorkspaceID      string `json:"workspace_id"`
	UserID           string `json:"user_id"`
	IncludeTables    *bool  `json:"include_tables"`
	IncludeWorkflows *bool  `json:"include_workflows"`
	IncludeStats     *bool  `json:"include_stats"`
}

func boolDefault(b *bool, def bool) bool {
	if b == nil {
		return def
	}
	return *b
}

func (t *GetWorkspaceInfoTool) Execute(ctx context.Context, params json.RawMessage) (*service.AgentToolResult, error) {
	var p getWorkspaceInfoParams
	if err := json.Unmarshal(params, &p); err != nil {
		return &service.AgentToolResult{Success: false, Error: "invalid parameters: " + err.Error()}, nil
	}

	result := map[string]interface{}{}
	var summaryParts []string

	// Tables
	if boolDefault(p.IncludeTables, true) {
		tables, err := t.dbQueryService.ListTables(ctx, p.WorkspaceID)
		if err != nil {
			result["tables_error"] = err.Error()
		} else {
			tableInfos := make([]map[string]interface{}, 0, len(tables))
			for _, tbl := range tables {
				info := map[string]interface{}{
					"name":          tbl.Name,
					"row_count_est": tbl.RowCountEst,
					"column_count":  tbl.ColumnCount,
				}
				// Get schema for each table
				schema, err := t.dbQueryService.GetTableSchema(ctx, p.WorkspaceID, tbl.Name)
				if err == nil {
					cols := make([]map[string]interface{}, 0, len(schema.Columns))
					for _, col := range schema.Columns {
						cols = append(cols, map[string]interface{}{
							"name":           col.Name,
							"type":           col.Type,
							"nullable":       col.Nullable,
							"is_primary_key": col.IsPrimaryKey,
						})
					}
					info["columns"] = cols
				}
				tableInfos = append(tableInfos, info)
			}
			result["tables"] = tableInfos
			summaryParts = append(summaryParts, fmt.Sprintf("%d tables", len(tables)))
		}
	}

	// Workflows
	if boolDefault(p.IncludeWorkflows, true) {
		userID, err := uuid.Parse(p.UserID)
		if err == nil {
			workflows, _, err := t.workflowService.List(ctx, userID, repository.ListParams{
				Page:     1,
				PageSize: 50,
			})
			if err != nil {
				result["workflows_error"] = err.Error()
			} else {
				wfInfos := make([]map[string]interface{}, 0, len(workflows))
				for _, wf := range workflows {
					wfInfos = append(wfInfos, map[string]interface{}{
						"id":          wf.ID.String(),
						"name":        wf.Name,
						"description": wf.Description,
						"status":      wf.Status,
						"updated_at":  wf.UpdatedAt,
					})
				}
				result["workflows"] = wfInfos
				summaryParts = append(summaryParts, fmt.Sprintf("%d workflows", len(workflows)))
			}
		}
	}

	// Stats
	if boolDefault(p.IncludeStats, false) {
		stats, err := t.dbQueryService.GetDatabaseStats(ctx, p.WorkspaceID)
		if err != nil {
			result["stats_error"] = err.Error()
		} else {
			result["stats"] = stats
		}
	}

	summary := "Workspace info: "
	if len(summaryParts) > 0 {
		for i, part := range summaryParts {
			if i > 0 {
				summary += ", "
			}
			summary += part
		}
	} else {
		summary += "retrieved successfully"
	}

	return &service.AgentToolResult{
		Success: true,
		Output:  summary,
		Data:    result,
	}, nil
}
