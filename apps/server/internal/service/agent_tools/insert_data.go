package agent_tools

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/reverseai/server/internal/service"
	"github.com/reverseai/server/internal/vmruntime"
)

type InsertDataTool struct {
	vmStore *vmruntime.VMStore
}

func NewInsertDataTool(vmStore *vmruntime.VMStore) *InsertDataTool {
	return &InsertDataTool{vmStore: vmStore}
}

func (t *InsertDataTool) Name() string { return "insert_data" }

func (t *InsertDataTool) Description() string {
	return "Insert one or more rows into a database table. Supports batch inserting seed data."
}

func (t *InsertDataTool) Parameters() json.RawMessage {
	return json.RawMessage(`{
		"type": "object",
		"properties": {
			"workspace_id": {"type": "string", "description": "Workspace ID"},
			"table_name": {"type": "string", "description": "Target table name"},
			"rows": {
				"type": "array",
				"description": "Array of row objects to insert",
				"items": {
					"type": "object",
					"additionalProperties": true
				}
			}
		},
		"required": ["workspace_id", "table_name", "rows"]
	}`)
}

func (t *InsertDataTool) RequiresConfirmation() bool { return false }

type insertDataParams struct {
	WorkspaceID string                   `json:"workspace_id"`
	TableName   string                   `json:"table_name"`
	Rows        []map[string]interface{} `json:"rows"`
}

func (t *InsertDataTool) Execute(ctx context.Context, params json.RawMessage) (*service.AgentToolResult, error) {
	var p insertDataParams
	if err := json.Unmarshal(params, &p); err != nil {
		return &service.AgentToolResult{Success: false, Error: "invalid parameters: " + err.Error()}, nil
	}

	if len(p.Rows) == 0 {
		return &service.AgentToolResult{Success: false, Error: "no rows provided"}, nil
	}

	successCount := 0
	var lastErr error
	for _, row := range p.Rows {
		if _, err := t.vmStore.InsertRow(ctx, p.WorkspaceID, p.TableName, row); err != nil {
			lastErr = err
		} else {
			successCount++
		}
	}

	if successCount == 0 && lastErr != nil {
		return &service.AgentToolResult{
			Success: false,
			Error:   fmt.Sprintf("failed to insert rows: %v", lastErr),
		}, nil
	}

	output := fmt.Sprintf("Successfully inserted %d/%d rows into table %q.", successCount, len(p.Rows), p.TableName)
	if lastErr != nil {
		output += fmt.Sprintf(" Some rows failed: %v", lastErr)
	}

	return &service.AgentToolResult{
		Success: true,
		Output:  output,
	}, nil
}
