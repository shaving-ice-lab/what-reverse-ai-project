package agent_tools

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"sync"

	"github.com/reverseai/server/internal/service"
)

// BatchTool executes multiple tool calls in parallel (mirrors OpenCode's batch.ts).
// LLM sends a single batch tool call containing multiple sub-tool calls.
// This works universally regardless of whether the LLM provider supports native parallel tool calls.
type BatchTool struct {
	registry *service.AgentToolRegistry
}

func NewBatchTool(registry *service.AgentToolRegistry) *BatchTool {
	return &BatchTool{registry: registry}
}

func (t *BatchTool) Name() string { return "batch" }

func (t *BatchTool) Description() string {
	return `Execute multiple tool calls in parallel for optimal performance. Use this when you need to perform several independent operations simultaneously (e.g., creating 3 unrelated tables, inserting data into multiple tables, querying multiple tables at once).

Rules:
- Maximum 25 tool calls per batch
- NEVER batch operations that depend on each other's results (e.g., don't batch create_table + insert_data for the same table)
- The batch tool itself cannot be called recursively (no batch inside batch)
- Each sub-tool call is executed concurrently and results are collected

Keep using the batch tool for optimal performance whenever you have 2+ independent operations!`
}

func (t *BatchTool) Parameters() json.RawMessage {
	return json.RawMessage(`{
		"type": "object",
		"properties": {
			"tool_calls": {
				"type": "array",
				"description": "Array of tool calls to execute in parallel",
				"items": {
					"type": "object",
					"properties": {
						"tool": {"type": "string", "description": "Name of the tool to execute"},
						"parameters": {"type": "object", "description": "Parameters for the tool"}
					},
					"required": ["tool", "parameters"]
				},
				"minItems": 1,
				"maxItems": 25
			}
		},
		"required": ["tool_calls"]
	}`)
}

func (t *BatchTool) RequiresConfirmation() bool { return false }

type batchParams struct {
	ToolCalls []struct {
		Tool       string          `json:"tool"`
		Parameters json.RawMessage `json:"parameters"`
	} `json:"tool_calls"`
}

type batchCallResult struct {
	Index   int    `json:"index"`
	Tool    string `json:"tool"`
	Success bool   `json:"success"`
	Output  string `json:"output,omitempty"`
	Error   string `json:"error,omitempty"`
}

// disallowedInBatch prevents recursive or dangerous batch calls
var disallowedInBatch = map[string]bool{
	"batch": true,
	"task":  true, // sub-agent delegation is long-running, not suitable for batch
}

func (t *BatchTool) Execute(ctx context.Context, params json.RawMessage) (*service.AgentToolResult, error) {
	var p batchParams
	if err := json.Unmarshal(params, &p); err != nil {
		return &service.AgentToolResult{Success: false, Error: "invalid parameters: " + err.Error()}, nil
	}

	if len(p.ToolCalls) == 0 {
		return &service.AgentToolResult{Success: false, Error: "tool_calls array is empty"}, nil
	}

	// Cap at 25
	calls := p.ToolCalls
	var discarded int
	if len(calls) > 25 {
		discarded = len(calls) - 25
		calls = calls[:25]
	}

	// Execute all calls concurrently
	results := make([]batchCallResult, len(calls))
	var wg sync.WaitGroup

	for i, call := range calls {
		wg.Add(1)
		go func(idx int, toolName string, toolParams json.RawMessage) {
			defer wg.Done()

			// Check disallowed
			if disallowedInBatch[toolName] {
				results[idx] = batchCallResult{
					Index:   idx,
					Tool:    toolName,
					Success: false,
					Error:   fmt.Sprintf("tool %q cannot be used inside batch", toolName),
				}
				return
			}

			// Enforce persona ToolFilter (passed via context from engine)
			if pc := service.GetPersonaContext(ctx); pc != nil && len(pc.ToolFilter) > 0 {
				allowed := false
				for _, allowedTool := range pc.ToolFilter {
					if allowedTool == toolName {
						allowed = true
						break
					}
				}
				if !allowed {
					results[idx] = batchCallResult{
						Index:   idx,
						Tool:    toolName,
						Success: false,
						Error:   fmt.Sprintf("tool %q is not allowed by the current persona", toolName),
					}
					return
				}
			}

			// Check tool exists
			_, exists := t.registry.Get(toolName)
			if !exists {
				results[idx] = batchCallResult{
					Index:   idx,
					Tool:    toolName,
					Success: false,
					Error:   fmt.Sprintf("unknown tool %q", toolName),
				}
				return
			}

			// Execute
			result, err := t.registry.Execute(ctx, toolName, toolParams)
			if err != nil {
				results[idx] = batchCallResult{
					Index:   idx,
					Tool:    toolName,
					Success: false,
					Error:   err.Error(),
				}
				return
			}

			results[idx] = batchCallResult{
				Index:   idx,
				Tool:    toolName,
				Success: result.Success,
				Output:  result.Output,
				Error:   result.Error,
			}
		}(i, call.Tool, call.Parameters)
	}

	wg.Wait()

	// Build summary
	successful := 0
	failed := 0
	var details []string
	for _, r := range results {
		if r.Success {
			successful++
			details = append(details, fmt.Sprintf("[%d] %s: OK — %s", r.Index, r.Tool, truncateOutput(r.Output, 200)))
		} else {
			failed++
			errMsg := r.Error
			if errMsg == "" {
				errMsg = "unknown error"
			}
			details = append(details, fmt.Sprintf("[%d] %s: FAILED — %s", r.Index, r.Tool, errMsg))
		}
	}

	// Add discarded calls
	if discarded > 0 {
		failed += discarded
		details = append(details, fmt.Sprintf("[discarded] %d calls exceeded maximum of 25", discarded))
	}

	total := successful + failed
	var outputMsg string
	if failed > 0 {
		outputMsg = fmt.Sprintf("Executed %d/%d tools successfully. %d failed.\n\n%s", successful, total, failed, strings.Join(details, "\n"))
	} else {
		outputMsg = fmt.Sprintf("All %d tools executed successfully.\n\n%s\n\nKeep using the batch tool for optimal performance!", successful, strings.Join(details, "\n"))
	}

	return &service.AgentToolResult{
		Success: failed == 0,
		Output:  outputMsg,
		Data: map[string]interface{}{
			"total":      total,
			"successful": successful,
			"failed":     failed,
			"results":    results,
		},
	}, nil
}

func truncateOutput(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen-3] + "..."
}
