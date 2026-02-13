package agent_tools

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/reverseai/server/internal/service"
	"github.com/reverseai/server/internal/vmruntime"
)

type QueryVMDataTool struct {
	vmStore *vmruntime.VMStore
}

func NewQueryVMDataTool(vmStore *vmruntime.VMStore) *QueryVMDataTool {
	return &QueryVMDataTool{vmStore: vmStore}
}

func (t *QueryVMDataTool) Name() string { return "query_vm_data" }

func (t *QueryVMDataTool) Description() string {
	return "Execute a SQL query against a workspace's SQLite database (VM runtime data store). Use this to inspect data, run SELECT queries, or execute DDL/DML statements on the workspace's isolated SQLite database."
}

func (t *QueryVMDataTool) Parameters() json.RawMessage {
	return json.RawMessage(`{
		"type": "object",
		"properties": {
			"workspace_id": {"type": "string", "description": "Workspace ID"},
			"sql": {"type": "string", "description": "SQL statement to execute"},
			"params": {"type": "array", "items": {}, "description": "Optional query parameters for parameterized queries"}
		},
		"required": ["workspace_id", "sql"]
	}`)
}

func (t *QueryVMDataTool) RequiresConfirmation() bool { return false }

type queryVMDataParams struct {
	WorkspaceID string        `json:"workspace_id"`
	SQL         string        `json:"sql"`
	Params      []interface{} `json:"params"`
}

func (t *QueryVMDataTool) Execute(ctx context.Context, params json.RawMessage) (*service.AgentToolResult, error) {
	var p queryVMDataParams
	if err := json.Unmarshal(params, &p); err != nil {
		return &service.AgentToolResult{Success: false, Error: "invalid parameters: " + err.Error()}, nil
	}

	if p.WorkspaceID == "" {
		return &service.AgentToolResult{Success: false, Error: "workspace_id is required"}, nil
	}
	if p.SQL == "" {
		return &service.AgentToolResult{Success: false, Error: "sql is required"}, nil
	}

	result, err := t.vmStore.ExecuteSQL(ctx, p.WorkspaceID, p.SQL, p.Params...)
	if err != nil {
		return &service.AgentToolResult{Success: false, Error: "SQL execution failed: " + err.Error()}, nil
	}

	output := fmt.Sprintf("Query executed in %dms.", result.DurationMs)
	if result.AffectedRows > 0 {
		output += fmt.Sprintf(" %d rows affected.", result.AffectedRows)
	}
	if len(result.Rows) > 0 {
		output += fmt.Sprintf(" Returned %d rows.", len(result.Rows))
	}

	return &service.AgentToolResult{
		Success: true,
		Output:  output,
		Data: map[string]interface{}{
			"columns":       result.Columns,
			"rows":          result.Rows,
			"total_count":   result.TotalCount,
			"affected_rows": result.AffectedRows,
			"duration_ms":   result.DurationMs,
		},
	}, nil
}
