package agent_tools

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
	"github.com/reverseai/server/internal/service"
	"github.com/reverseai/server/internal/vmruntime"
)

type DeployLogicTool struct {
	workspaceService service.WorkspaceService
	vmPool           *vmruntime.VMPool
}

func NewDeployLogicTool(
	workspaceService service.WorkspaceService,
	vmPool *vmruntime.VMPool,
) *DeployLogicTool {
	return &DeployLogicTool{
		workspaceService: workspaceService,
		vmPool:           vmPool,
	}
}

func (t *DeployLogicTool) Name() string { return "deploy_logic" }

func (t *DeployLogicTool) Description() string {
	return `Deploy JavaScript business logic code to the workspace's VM runtime. The code defines API routes that handle HTTP requests. The code has access to a 'db' object for SQLite operations and a 'console' object for logging. Routes are defined via exports.routes = { "METHOD /path": function(ctx) { ... } }. Example:
exports.routes = {
  "GET /tasks": function(ctx) {
    return db.query("SELECT * FROM tasks");
  },
  "POST /tasks": function(ctx) {
    db.insert("tasks", ctx.body);
    return { status: 201, body: { message: "created" } };
  },
  "GET /tasks/:id": function(ctx) {
    return db.queryOne("SELECT * FROM tasks WHERE id = ?", [ctx.params.id]);
  }
};
Available db methods: db.query(sql, params?), db.queryOne(sql, params?), db.insert(table, data), db.update(table, data, where), db.delete(table, where), db.execute(sql, params?).`
}

func (t *DeployLogicTool) Parameters() json.RawMessage {
	return json.RawMessage(`{
		"type": "object",
		"properties": {
			"workspace_id": {"type": "string", "description": "Workspace ID"},
			"user_id": {"type": "string", "description": "User ID (owner)"},
			"code": {"type": "string", "description": "JavaScript code to deploy. Must define exports.routes with route handlers."}
		},
		"required": ["workspace_id", "user_id", "code"]
	}`)
}

func (t *DeployLogicTool) RequiresConfirmation() bool { return false }

type deployLogicParams struct {
	WorkspaceID string `json:"workspace_id"`
	UserID      string `json:"user_id"`
	Code        string `json:"code"`
}

func (t *DeployLogicTool) Execute(ctx context.Context, params json.RawMessage) (*service.AgentToolResult, error) {
	var p deployLogicParams
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

	version, err := t.workspaceService.UpdateLogicCode(ctx, wsID, userID, p.Code)
	if err != nil {
		return &service.AgentToolResult{Success: false, Error: "failed to save logic code: " + err.Error()}, nil
	}

	t.vmPool.Invalidate(p.WorkspaceID)

	return &service.AgentToolResult{
		Success: true,
		Output:  fmt.Sprintf("Logic code deployed successfully to version %s. VM cache invalidated.", version.Version),
		Data: map[string]interface{}{
			"version_id": version.ID.String(),
			"version":    version.Version,
		},
	}, nil
}
