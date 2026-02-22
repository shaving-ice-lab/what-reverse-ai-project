package agent_tools

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/reverseai/server/internal/service"
	"github.com/reverseai/server/internal/vmruntime"
)

type CreateTableTool struct {
	vmStore *vmruntime.VMStore
}

func NewCreateTableTool(vmStore *vmruntime.VMStore) *CreateTableTool {
	return &CreateTableTool{vmStore: vmStore}
}

func (t *CreateTableTool) Name() string { return "create_table" }

func (t *CreateTableTool) Description() string {
	return "Create a new database table in the workspace SQLite database. Specify the table name, columns with types, and primary key."
}

func (t *CreateTableTool) Parameters() json.RawMessage {
	return json.RawMessage(`{
		"type": "object",
		"properties": {
			"workspace_id": {"type": "string", "description": "Workspace ID"},
			"name": {"type": "string", "description": "Table name"},
			"columns": {
				"type": "array",
				"items": {
					"type": "object",
					"properties": {
						"name": {"type": "string"},
						"type": {"type": "string", "description": "Column type, e.g. TEXT, INTEGER, REAL, BLOB"},
						"nullable": {"type": "boolean", "default": true},
						"default_value": {"type": "string"},
						"unique": {"type": "boolean", "default": false}
					},
					"required": ["name", "type"]
				}
			},
			"primary_key": {"type": "array", "items": {"type": "string"}, "description": "Primary key column names"}
		},
		"required": ["workspace_id", "name", "columns"]
	}`)
}

func (t *CreateTableTool) RequiresConfirmation() bool { return false }

type createTableParams struct {
	WorkspaceID string                        `json:"workspace_id"`
	UserID      string                        `json:"user_id"`
	Name        string                        `json:"name"`
	Columns     []vmruntime.VMCreateColumnDef `json:"columns"`
	PrimaryKey  []string                      `json:"primary_key"`
}

func (t *CreateTableTool) Execute(ctx context.Context, params json.RawMessage) (*service.AgentToolResult, error) {
	var p createTableParams
	if err := json.Unmarshal(params, &p); err != nil {
		return &service.AgentToolResult{Success: false, Error: "invalid parameters: " + err.Error()}, nil
	}

	req := vmruntime.VMCreateTableRequest{
		Name:       p.Name,
		Columns:    p.Columns,
		PrimaryKey: p.PrimaryKey,
	}

	if err := t.vmStore.CreateTable(ctx, p.WorkspaceID, req); err != nil {
		return &service.AgentToolResult{
			Success: false,
			Error:   fmt.Sprintf("failed to create table %q: %v", p.Name, err),
		}, nil
	}

	return &service.AgentToolResult{
		Success: true,
		Output:  fmt.Sprintf("Successfully created table %q with %d columns.", p.Name, len(p.Columns)),
	}, nil
}
