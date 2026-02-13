package agent_tools

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/reverseai/server/internal/service"
	"github.com/reverseai/server/internal/vmruntime"
)

type UpdateDataTool struct {
	vmStore *vmruntime.VMStore
}

func NewUpdateDataTool(vmStore *vmruntime.VMStore) *UpdateDataTool {
	return &UpdateDataTool{vmStore: vmStore}
}

func (t *UpdateDataTool) Name() string { return "update_data" }

func (t *UpdateDataTool) Description() string {
	return "Update an existing row in a database table. The data map must include the primary key column(s) to identify the row, along with the columns to update."
}

func (t *UpdateDataTool) Parameters() json.RawMessage {
	return json.RawMessage(`{
		"type": "object",
		"properties": {
			"workspace_id": {"type": "string", "description": "Workspace ID"},
			"table_name": {"type": "string", "description": "Target table name"},
			"data": {
				"type": "object",
				"description": "Object with primary key column(s) and columns to update. PK columns are used for the WHERE clause, remaining columns are SET values.",
				"additionalProperties": true
			}
		},
		"required": ["workspace_id", "table_name", "data"]
	}`)
}

func (t *UpdateDataTool) RequiresConfirmation() bool { return false }

type updateDataParams struct {
	WorkspaceID string                 `json:"workspace_id"`
	TableName   string                 `json:"table_name"`
	Data        map[string]interface{} `json:"data"`
}

func (t *UpdateDataTool) Execute(ctx context.Context, params json.RawMessage) (*service.AgentToolResult, error) {
	var p updateDataParams
	if err := json.Unmarshal(params, &p); err != nil {
		return &service.AgentToolResult{Success: false, Error: "invalid parameters: " + err.Error()}, nil
	}

	if len(p.Data) == 0 {
		return &service.AgentToolResult{Success: false, Error: "data must not be empty"}, nil
	}

	// Split data into set values and where clause (id is the PK)
	where := map[string]interface{}{}
	setData := map[string]interface{}{}
	for k, v := range p.Data {
		if k == "id" {
			where[k] = v
		} else {
			setData[k] = v
		}
	}
	if len(where) == 0 {
		return &service.AgentToolResult{Success: false, Error: "data must include 'id' for WHERE clause"}, nil
	}
	result, err := t.vmStore.UpdateRow(ctx, p.WorkspaceID, p.TableName, setData, where)
	if err != nil {
		return &service.AgentToolResult{
			Success: false,
			Error:   fmt.Sprintf("failed to update row in %q: %v", p.TableName, err),
		}, nil
	}

	return &service.AgentToolResult{
		Success: true,
		Output:  fmt.Sprintf("Successfully updated %d row(s) in table %q.", result.AffectedRows, p.TableName),
	}, nil
}
