package agent_tools

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/reverseai/server/internal/service"
	"github.com/reverseai/server/internal/vmruntime"
)

type AlterTableTool struct {
	vmStore *vmruntime.VMStore
}

func NewAlterTableTool(vmStore *vmruntime.VMStore) *AlterTableTool {
	return &AlterTableTool{vmStore: vmStore}
}

func (t *AlterTableTool) Name() string { return "alter_table" }

func (t *AlterTableTool) Description() string {
	return "Alter an existing database table: add/rename/drop columns."
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
						"default_value": {"type": "string"}
					},
					"required": ["name", "type"]
				}
			},
			"alter_columns": {
				"type": "array",
				"items": {
					"type": "object",
					"properties": {
						"name": {"type": "string"},
						"new_name": {"type": "string"}
					},
					"required": ["name"]
				}
			},
			"drop_columns": {"type": "array", "items": {"type": "string"}}
		},
		"required": ["workspace_id", "table_name"]
	}`)
}

func (t *AlterTableTool) RequiresConfirmation() bool { return true }

type alterTableParams struct {
	WorkspaceID  string                        `json:"workspace_id"`
	TableName    string                        `json:"table_name"`
	AddColumns   []vmruntime.VMCreateColumnDef `json:"add_columns"`
	AlterColumns []vmruntime.VMAlterColumnDef  `json:"alter_columns"`
	DropColumns  []string                      `json:"drop_columns"`
}

func (t *AlterTableTool) Execute(ctx context.Context, params json.RawMessage) (*service.AgentToolResult, error) {
	var p alterTableParams
	if err := json.Unmarshal(params, &p); err != nil {
		return &service.AgentToolResult{Success: false, Error: "invalid parameters: " + err.Error()}, nil
	}

	req := vmruntime.VMAlterTableRequest{
		AddColumns:   p.AddColumns,
		AlterColumns: p.AlterColumns,
		DropColumns:  p.DropColumns,
	}

	if err := t.vmStore.AlterTable(ctx, p.WorkspaceID, p.TableName, req); err != nil {
		return &service.AgentToolResult{
			Success: false,
			Error:   fmt.Sprintf("failed to alter table %q: %v", p.TableName, err),
		}, nil
	}

	changes := len(p.AddColumns) + len(p.AlterColumns) + len(p.DropColumns)
	return &service.AgentToolResult{
		Success: true,
		Output:  fmt.Sprintf("Successfully altered table %q with %d changes.", p.TableName, changes),
	}, nil
}
