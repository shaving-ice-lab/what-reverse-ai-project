package agent_tools

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/reverseai/server/internal/service"
	"github.com/reverseai/server/internal/vmruntime"
)

type QueryDataTool struct {
	vmStore *vmruntime.VMStore
}

func NewQueryDataTool(vmStore *vmruntime.VMStore) *QueryDataTool {
	return &QueryDataTool{vmStore: vmStore}
}

func (t *QueryDataTool) Name() string { return "query_data" }

func (t *QueryDataTool) Description() string {
	return "Execute a read-only SQL query (SELECT) against the workspace database. Returns columns and rows."
}

func (t *QueryDataTool) Parameters() json.RawMessage {
	return json.RawMessage(`{
		"type": "object",
		"properties": {
			"workspace_id": {"type": "string", "description": "Workspace ID"},
			"sql": {"type": "string", "description": "SELECT SQL query to execute"},
			"params": {"type": "array", "items": {}, "description": "Query parameters for prepared statements"}
		},
		"required": ["workspace_id", "sql"]
	}`)
}

func (t *QueryDataTool) RequiresConfirmation() bool { return false }

type queryDataParams struct {
	WorkspaceID string        `json:"workspace_id"`
	SQL         string        `json:"sql"`
	Params      []interface{} `json:"params"`
}

func (t *QueryDataTool) Execute(ctx context.Context, params json.RawMessage) (*service.AgentToolResult, error) {
	var p queryDataParams
	if err := json.Unmarshal(params, &p); err != nil {
		return &service.AgentToolResult{Success: false, Error: "invalid parameters: " + err.Error()}, nil
	}

	result, err := t.vmStore.ExecuteSQL(ctx, p.WorkspaceID, p.SQL, p.Params...)
	if err != nil {
		return &service.AgentToolResult{
			Success: false,
			Error:   fmt.Sprintf("query failed: %v", err),
		}, nil
	}

	rowCount := 0
	if result.Rows != nil {
		rowCount = len(result.Rows)
	}

	// Truncate large result sets for LLM context
	maxRows := 20
	truncatedRows := result.Rows
	truncated := false
	if rowCount > maxRows {
		truncatedRows = result.Rows[:maxRows]
		truncated = true
	}

	summary := fmt.Sprintf("Query returned %d rows (%d columns), took %dms.", rowCount, len(result.Columns), result.DurationMs)
	if truncated {
		summary += fmt.Sprintf(" Showing first %d rows.", maxRows)
	}

	return &service.AgentToolResult{
		Success: true,
		Output:  summary,
		Data: map[string]interface{}{
			"columns":       result.Columns,
			"rows":          truncatedRows,
			"total_rows":    rowCount,
			"affected_rows": result.AffectedRows,
			"duration_ms":   result.DurationMs,
			"truncated":     truncated,
		},
	}, nil
}
