package agent_tools

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/reverseai/server/internal/service"
	"github.com/reverseai/server/internal/vmruntime"
)

type DeleteTableTool struct {
	vmStore *vmruntime.VMStore
}

func NewDeleteTableTool(vmStore *vmruntime.VMStore) *DeleteTableTool {
	return &DeleteTableTool{vmStore: vmStore}
}

func (t *DeleteTableTool) Name() string { return "delete_table" }

func (t *DeleteTableTool) Description() string {
	return "Drop (delete) an existing database table from the workspace. This action is irreversible."
}

func (t *DeleteTableTool) Parameters() json.RawMessage {
	return json.RawMessage(`{
		"type": "object",
		"properties": {
			"workspace_id": {"type": "string", "description": "Workspace ID"},
			"table_name": {"type": "string", "description": "Name of the table to drop"}
		},
		"required": ["workspace_id", "table_name"]
	}`)
}

func (t *DeleteTableTool) RequiresConfirmation() bool { return true }

type deleteTableParams struct {
	WorkspaceID string `json:"workspace_id"`
	TableName   string `json:"table_name"`
}

func (t *DeleteTableTool) Execute(ctx context.Context, params json.RawMessage) (*service.AgentToolResult, error) {
	var p deleteTableParams
	if err := json.Unmarshal(params, &p); err != nil {
		return &service.AgentToolResult{Success: false, Error: "invalid parameters: " + err.Error()}, nil
	}

	if p.TableName == "" {
		return &service.AgentToolResult{Success: false, Error: "table_name is required"}, nil
	}

	if err := t.vmStore.DropTable(ctx, p.WorkspaceID, p.TableName); err != nil {
		return &service.AgentToolResult{
			Success: false,
			Error:   fmt.Sprintf("failed to drop table %q: %v", p.TableName, err),
		}, nil
	}

	return &service.AgentToolResult{
		Success: true,
		Output:  fmt.Sprintf("Successfully dropped table %q.", p.TableName),
	}, nil
}
