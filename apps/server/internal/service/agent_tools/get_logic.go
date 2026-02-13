package agent_tools

import (
	"context"
	"encoding/json"

	"github.com/google/uuid"
	"github.com/reverseai/server/internal/service"
)

type GetLogicTool struct {
	workspaceService service.WorkspaceService
}

func NewGetLogicTool(workspaceService service.WorkspaceService) *GetLogicTool {
	return &GetLogicTool{workspaceService: workspaceService}
}

func (t *GetLogicTool) Name() string { return "get_logic" }

func (t *GetLogicTool) Description() string {
	return "Get the currently deployed JavaScript logic code for a workspace's VM runtime. Returns the full source code if deployed, or empty string if no code is deployed yet."
}

func (t *GetLogicTool) Parameters() json.RawMessage {
	return json.RawMessage(`{
		"type": "object",
		"properties": {
			"workspace_id": {"type": "string", "description": "Workspace ID"},
			"user_id": {"type": "string", "description": "User ID (owner)"}
		},
		"required": ["workspace_id", "user_id"]
	}`)
}

func (t *GetLogicTool) RequiresConfirmation() bool { return false }

type getLogicParams struct {
	WorkspaceID string `json:"workspace_id"`
	UserID      string `json:"user_id"`
}

func (t *GetLogicTool) Execute(ctx context.Context, params json.RawMessage) (*service.AgentToolResult, error) {
	var p getLogicParams
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

	code, err := t.workspaceService.GetLogicCode(ctx, wsID, userID)
	if err != nil {
		return &service.AgentToolResult{Success: false, Error: "failed to get logic code: " + err.Error()}, nil
	}

	if code == "" {
		return &service.AgentToolResult{
			Success: true,
			Output:  "No logic code deployed yet for this workspace.",
			Data:    map[string]interface{}{"code": "", "deployed": false},
		}, nil
	}

	return &service.AgentToolResult{
		Success: true,
		Output:  "Logic code retrieved successfully.",
		Data:    map[string]interface{}{"code": code, "deployed": true},
	}, nil
}
