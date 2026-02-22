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
	return `Deploy a custom frontend JavaScript component to the workspace. The code runs inside a secure iframe sandbox with these APIs:

WHEN TO USE (vs built-in blocks):
- Interactive widgets: drag-and-drop, rich editors, toggles with animations
- Custom visualizations: maps, timelines, Gantt charts, org charts, kanban boards
- Complex conditional rendering: multi-step wizards, dynamic forms
- Any UI that the 11 built-in block types (stats_card, data_table, form, chart, etc.) cannot express

SANDBOX API:
- ROOT: The root DOM element. Set ROOT.innerHTML or append children.
- DATA: Object containing data fetched from api_source (configured in the custom_code block).
- window.parent.postMessage({__sandbox:true, type:'ACTION_REQUEST', action:'navigate', payload:{page:'details'}}, '*') — communicate with parent app.
- ROOT.addEventListener('sandbox-data-update', function(e) { /* e.detail = new data */ }) — react to data updates.

EXAMPLE — Data-driven dashboard card:
ROOT.innerHTML = '<div style="padding:16px;font-family:system-ui">' +
  '<h3>Custom Metrics</h3>' +
  '<div id="metrics"></div>' +
'</div>';
var rows = DATA.rows || [];
var el = document.getElementById('metrics');
el.innerHTML = rows.map(function(r) {
  return '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee">' +
    '<span>' + r.name + '</span>' +
    '<strong style="color:' + (r.value > 100 ? '#22c55e' : '#ef4444') + '">' + r.value + '</strong>' +
  '</div>';
}).join('');

After deploying, reference in UI schema as a custom_code block with the code field or component_id.`
}

func (t *DeployComponentTool) Parameters() json.RawMessage {
	return json.RawMessage(`{
		"type": "object",
		"properties": {
			"workspace_id": {"type": "string", "description": "Workspace ID"},
			"user_id": {"type": "string", "description": "User ID (owner)"},
			"code": {"type": "string", "description": "JavaScript code for the frontend component. Has access to ROOT (DOM element) and DATA (object from api_source)."},
			"component_id": {"type": "string", "description": "Optional unique ID for this component (e.g., 'kanban_board'). Auto-generated if not provided. Use to update an existing component."},
			"name": {"type": "string", "description": "Optional human-readable name for the component (e.g., 'Kanban Board'). Defaults to component_id."}
		},
		"required": ["workspace_id", "user_id", "code"]
	}`)
}

func (t *DeployComponentTool) RequiresConfirmation() bool { return false }

type deployComponentParams struct {
	WorkspaceID string `json:"workspace_id"`
	UserID      string `json:"user_id"`
	Code        string `json:"code"`
	ComponentID string `json:"component_id"`
	Name        string `json:"name"`
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

	version, componentID, err := t.workspaceService.DeployComponent(ctx, wsID, userID, p.ComponentID, p.Name, p.Code)
	if err != nil {
		return &service.AgentToolResult{Success: false, Error: "failed to save component code: " + err.Error()}, nil
	}

	return &service.AgentToolResult{
		Success: true,
		Output:  fmt.Sprintf("Component %q deployed successfully to version %s. Reference it in custom_code blocks using component_id: %q.", componentID, version.Version, componentID),
		Data: map[string]interface{}{
			"version_id":   version.ID.String(),
			"version":      version.Version,
			"component_id": componentID,
		},
	}, nil
}
