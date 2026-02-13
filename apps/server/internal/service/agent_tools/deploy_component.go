package agent_tools

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
	"github.com/reverseai/server/internal/service"
)

type DeployComponentTool struct {
	workspaceService service.WorkspaceService
}

func NewDeployComponentTool(workspaceService service.WorkspaceService) *DeployComponentTool {
	return &DeployComponentTool{workspaceService: workspaceService}
}

func (t *DeployComponentTool) Name() string { return "deploy_component" }

func (t *DeployComponentTool) Description() string {
	return `Deploy frontend component code (JavaScript) to a workspace. The code runs inside an iframe sandbox and has access to ROOT (the root DOM element) and DATA (data from api_source). Example:
// Simple counter component
ROOT.innerHTML = '<div id="app"><h2>Counter</h2><button id="btn">Count: 0</button></div>';
var count = 0;
document.getElementById('btn').onclick = function() {
  count++;
  document.getElementById('btn').textContent = 'Count: ' + count;
};

// Using DATA from api_source
var items = DATA.items || [];
ROOT.innerHTML = '<ul>' + items.map(function(i) { return '<li>' + i.name + '</li>'; }).join('') + '</ul>';`
}

func (t *DeployComponentTool) Parameters() json.RawMessage {
	return json.RawMessage(`{
		"type": "object",
		"properties": {
			"workspace_id": {"type": "string", "description": "Workspace ID"},
			"user_id": {"type": "string", "description": "User ID (owner)"},
			"code": {"type": "string", "description": "JavaScript code for the frontend component. Has access to ROOT (DOM element) and DATA (object from api_source)."}
		},
		"required": ["workspace_id", "user_id", "code"]
	}`)
}

func (t *DeployComponentTool) RequiresConfirmation() bool { return false }

type deployComponentParams struct {
	WorkspaceID string `json:"workspace_id"`
	UserID      string `json:"user_id"`
	Code        string `json:"code"`
}

func (t *DeployComponentTool) Execute(ctx context.Context, params json.RawMessage) (*service.AgentToolResult, error) {
	var p deployComponentParams
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
	if p.Code == "" {
		return &service.AgentToolResult{Success: false, Error: "code cannot be empty"}, nil
	}

	version, err := t.workspaceService.UpdateComponentCode(ctx, wsID, userID, p.Code)
	if err != nil {
		return &service.AgentToolResult{Success: false, Error: "failed to save component code: " + err.Error()}, nil
	}

	return &service.AgentToolResult{
		Success: true,
		Output:  fmt.Sprintf("Component code deployed successfully to version %s.", version.Version),
		Data: map[string]interface{}{
			"version_id": version.ID.String(),
			"version":    version.Version,
		},
	}, nil
}
