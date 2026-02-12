package agent_tools

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/reverseai/server/internal/service"
)

type DeleteDataTool struct {
	dbQueryService service.WorkspaceDBQueryService
}

func NewDeleteDataTool(dbQueryService service.WorkspaceDBQueryService) *DeleteDataTool {
	return &DeleteDataTool{dbQueryService: dbQueryService}
}

func (t *DeleteDataTool) Name() string { return "delete_data" }

func (t *DeleteDataTool) Description() string {
	return "Delete one or more rows from a database table by their primary key IDs."
}

func (t *DeleteDataTool) Parameters() json.RawMessage {
	return json.RawMessage(`{
		"type": "object",
		"properties": {
			"workspace_id": {"type": "string", "description": "Workspace ID"},
			"table_name": {"type": "string", "description": "Target table name"},
			"ids": {
				"type": "array",
				"description": "Array of primary key values to delete",
				"items": {}
			}
		},
		"required": ["workspace_id", "table_name", "ids"]
	}`)
}

func (t *DeleteDataTool) RequiresConfirmation() bool { return true }

type deleteDataParams struct {
	WorkspaceID string        `json:"workspace_id"`
	TableName   string        `json:"table_name"`
	IDs         []interface{} `json:"ids"`
}

func (t *DeleteDataTool) Execute(ctx context.Context, params json.RawMessage) (*service.AgentToolResult, error) {
	var p deleteDataParams
	if err := json.Unmarshal(params, &p); err != nil {
		return &service.AgentToolResult{Success: false, Error: "invalid parameters: " + err.Error()}, nil
	}

	if len(p.IDs) == 0 {
		return &service.AgentToolResult{Success: false, Error: "no IDs provided"}, nil
	}

	result, err := t.dbQueryService.DeleteRows(ctx, p.WorkspaceID, p.TableName, p.IDs)
	if err != nil {
		return &service.AgentToolResult{
			Success: false,
			Error:   fmt.Sprintf("failed to delete rows from %q: %v", p.TableName, err),
		}, nil
	}

	return &service.AgentToolResult{
		Success: true,
		Output:  fmt.Sprintf("Successfully deleted %d row(s) from table %q.", result.AffectedRows, p.TableName),
	}, nil
}
