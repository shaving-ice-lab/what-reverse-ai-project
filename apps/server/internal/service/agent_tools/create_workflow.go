package agent_tools

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
)

type CreateWorkflowTool struct {
	workflowService service.WorkflowService
}

func NewCreateWorkflowTool(workflowService service.WorkflowService) *CreateWorkflowTool {
	return &CreateWorkflowTool{workflowService: workflowService}
}

func (t *CreateWorkflowTool) Name() string { return "create_workflow" }

func (t *CreateWorkflowTool) Description() string {
	return "Create a new workflow in the workspace. Provide name, description, and the workflow definition JSON (nodes and edges)."
}

func (t *CreateWorkflowTool) Parameters() json.RawMessage {
	return json.RawMessage(`{
		"type": "object",
		"properties": {
			"user_id": {"type": "string", "description": "User ID (UUID)"},
			"name": {"type": "string", "description": "Workflow name"},
			"description": {"type": "string", "description": "Workflow description"},
			"definition": {"type": "object", "description": "Workflow definition containing nodes and edges"}
		},
		"required": ["user_id", "name", "definition"]
	}`)
}

func (t *CreateWorkflowTool) RequiresConfirmation() bool { return true }

type createWorkflowParams struct {
	UserID      string                 `json:"user_id"`
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	Definition  map[string]interface{} `json:"definition"`
}

func (t *CreateWorkflowTool) Execute(ctx context.Context, params json.RawMessage) (*service.AgentToolResult, error) {
	var p createWorkflowParams
	if err := json.Unmarshal(params, &p); err != nil {
		return &service.AgentToolResult{Success: false, Error: "invalid parameters: " + err.Error()}, nil
	}

	userID, err := uuid.Parse(p.UserID)
	if err != nil {
		return &service.AgentToolResult{Success: false, Error: "invalid user_id: " + err.Error()}, nil
	}

	desc := p.Description
	req := service.CreateWorkflowRequest{
		Name:        p.Name,
		Description: &desc,
		Definition:  p.Definition,
	}

	workflow, err := t.workflowService.Create(ctx, userID, req)
	if err != nil {
		return &service.AgentToolResult{
			Success: false,
			Error:   fmt.Sprintf("failed to create workflow: %v", err),
		}, nil
	}

	return &service.AgentToolResult{
		Success: true,
		Output:  fmt.Sprintf("Successfully created workflow %q (ID: %s).", p.Name, workflow.ID.String()),
		Data: map[string]interface{}{
			"workflow_id": workflow.ID.String(),
			"name":        workflow.Name,
		},
	}, nil
}
