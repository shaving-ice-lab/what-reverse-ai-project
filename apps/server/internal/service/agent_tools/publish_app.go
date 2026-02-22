package agent_tools

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"

	"github.com/reverseai/server/internal/service"
)

type PublishAppTool struct {
	workspaceService service.WorkspaceService
}

func NewPublishAppTool(workspaceService service.WorkspaceService) *PublishAppTool {
	return &PublishAppTool{workspaceService: workspaceService}
}

func (t *PublishAppTool) Name() string { return "publish_app" }

func (t *PublishAppTool) Description() string {
	return "Publish the workspace app to make it publicly accessible. This sets the app status to published and generates a public access URL."
}

func (t *PublishAppTool) Parameters() json.RawMessage {
	return json.RawMessage(`{
		"type": "object",
		"properties": {
			"workspace_id": {"type": "string", "description": "Workspace ID of the app to publish"},
			"user_id": {"type": "string", "description": "User ID of the owner"}
		},
		"required": ["workspace_id", "user_id"]
	}`)
}

func (t *PublishAppTool) RequiresConfirmation() bool { return false }

type publishAppParams struct {
	WorkspaceID string `json:"workspace_id"`
	UserID      string `json:"user_id"`
}

func (t *PublishAppTool) Execute(ctx context.Context, params json.RawMessage) (*service.AgentToolResult, error) {
	var p publishAppParams
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

	ws, err := t.workspaceService.Publish(ctx, wsID, userID)
	if err != nil {
		return &service.AgentToolResult{
			Success: false,
			Error:   fmt.Sprintf("failed to publish app: %v", err),
		}, nil
	}

	return &service.AgentToolResult{
		Success: true,
		Output:  fmt.Sprintf("App %q published successfully. Slug: %s", ws.Name, ws.Slug),
	}, nil
}
