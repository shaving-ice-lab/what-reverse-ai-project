package agent_tools

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/agentflow/server/internal/service"
)

type AlterTableTool struct {
	dbQueryService service.WorkspaceDBQueryService
}

func NewAlterTableTool(dbQueryService service.WorkspaceDBQueryService) *AlterTableTool {
	return &AlterTableTool{dbQueryService: dbQueryService}
}

func (t *AlterTableTool) Name() string { return "alter_table" }

func (t *AlterTableTool) Description() string {
	return "Alter an existing database table: add/modify/drop columns, add/drop indexes."
}

func (t *AlterTableTool) Parameters() json.RawMessage {
	return json.RawMessage(`{
		"type": "object",
		"properties": {
			"workspace_id": {"type": "string", "description": "Workspace ID"},
			"table_name": {"type": "string", "description": "Table to alter"},
			"add_columns": {
				"type": "array",
				"items": {
					"type": "object",
					"properties": {
						"name": {"type": "string"},
						"type": {"type": "string"},
						"nullable": {"type": "boolean", "default": true},
						"default_value": {"type": "string"},
						"after": {"type": "string", "description": "Place after this column"}
					},
					"required": ["name", "type"]
				}
			},
			"modify_columns": {
				"type": "array",
				"items": {
					"type": "object",
					"properties": {
						"name": {"type": "string"},
						"new_name": {"type": "string"},
						"type": {"type": "string"},
						"nullable": {"type": "boolean"}
					},
					"required": ["name"]
				}
			},
			"drop_columns": {"type": "array", "items": {"type": "string"}},
			"add_indexes": {
				"type": "array",
				"items": {
					"type": "object",
					"properties": {
						"name": {"type": "string"},
						"columns": {"type": "array", "items": {"type": "string"}},
						"unique": {"type": "boolean", "default": false}
					},
					"required": ["name", "columns"]
				}
			},
			"drop_indexes": {"type": "array", "items": {"type": "string"}}
		},
		"required": ["workspace_id", "table_name"]
	}`)
}

func (t *AlterTableTool) RequiresConfirmation() bool { return true }

type alterTableParams struct {
	WorkspaceID  string                    `json:"workspace_id"`
	TableName    string                    `json:"table_name"`
	AddColumns   []service.CreateColumnDef `json:"add_columns"`
	AlterColumns []service.AlterColumnDef  `json:"alter_columns"`
	DropColumns  []string                  `json:"drop_columns"`
}

func (t *AlterTableTool) Execute(ctx context.Context, params json.RawMessage) (*service.AgentToolResult, error) {
	var p alterTableParams
	if err := json.Unmarshal(params, &p); err != nil {
		return &service.AgentToolResult{Success: false, Error: "invalid parameters: " + err.Error()}, nil
	}

	req := service.AlterTableRequest{
		AddColumns:   p.AddColumns,
		AlterColumns: p.AlterColumns,
		DropColumns:  p.DropColumns,
	}

	if err := t.dbQueryService.AlterTable(ctx, p.WorkspaceID, p.TableName, req); err != nil {
		return &service.AgentToolResult{
			Success: false,
			Error:   fmt.Sprintf("failed to alter table %q: %v", p.TableName, err),
		}, nil
	}

	changes := 0
	changes += len(p.AddColumns) + len(p.AlterColumns) + len(p.DropColumns)
	return &service.AgentToolResult{
		Success: true,
		Output:  fmt.Sprintf("Successfully altered table %q with %d changes.", p.TableName, changes),
	}, nil
}
