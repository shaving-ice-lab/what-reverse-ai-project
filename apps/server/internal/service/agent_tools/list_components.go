package agent_tools

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/reverseai/server/internal/service"
)

type ListComponentsTool struct {
	workspaceService service.WorkspaceService
}

func NewListComponentsTool(workspaceService service.WorkspaceService) *ListComponentsTool {
	return &ListComponentsTool{workspaceService: workspaceService}
}

func (t *ListComponentsTool) Name() string { return "list_components" }

func (t *ListComponentsTool) Description() string {
	return "List all deployed custom components in the workspace. Returns component IDs, names, and creation dates. Use this before deploying a new component to check for existing ones and avoid duplicates."
}

func (t *ListComponentsTool) Parameters() json.RawMessage {
	return json.RawMessage(`{
		"type": "object",
		"properties": {
			"workspace_id": {"type": "string", "description": "Workspace ID"},
			"user_id": {"type": "string", "description": "User ID (owner)"}
		},
		"required": ["workspace_id", "user_id"]
	}`)
}

func (t *ListComponentsTool) RequiresConfirmation() bool { return false }

type listComponentsParams struct {
	WorkspaceID string `json:"workspace_id"`
	UserID      string `json:"user_id"`
}

func (t *ListComponentsTool) Execute(ctx context.Context, params json.RawMessage) (*service.AgentToolResult, error) {
	var p listComponentsParams
	if err := json.Unmarshal(params, &p); err != nil {
		return &service.AgentToolResult{Success: false, Error: "invalid parameters: " + err.Error()}, nil
	}

	wsID, err := uuid.Parse(p.WorkspaceID)
	if err != nil {
		return &service.AgentToolResult{Success: false, Error: "invalid workspace_id"}, nil
	}
	userID, err := uuid.Parse(p.UserID)
	if err != nil {
		return &service.AgentToolResult{Success: false, Error: "invalid user_id"}, nil
	}

	components, err := t.workspaceService.ListComponents(ctx, wsID, userID)
	if err != nil {
		return &service.AgentToolResult{Success: false, Error: "failed to list components: " + err.Error()}, nil
	}

	if len(components) == 0 {
		return &service.AgentToolResult{
			Success: true,
			Output:  "No custom components deployed yet.",
			Data:    map[string]interface{}{"count": 0, "components": map[string]interface{}{}},
		}, nil
	}

	var lines []string
	lines = append(lines, fmt.Sprintf("Found %d component(s):", len(components)))
	for id, entry := range components {
		lines = append(lines, fmt.Sprintf("  - %s: %s (created: %s)", id, entry.Name, entry.CreatedAt))
	}

	// Build summary data (without code to keep output small)
	summaries := make(map[string]interface{}, len(components))
	for id, entry := range components {
		summaries[id] = map[string]interface{}{
			"name":       entry.Name,
			"created_at": entry.CreatedAt,
		}
	}

	return &service.AgentToolResult{
		Success: true,
		Output:  strings.Join(lines, "\n"),
		Data:    map[string]interface{}{"count": len(components), "components": summaries},
	}, nil
}
