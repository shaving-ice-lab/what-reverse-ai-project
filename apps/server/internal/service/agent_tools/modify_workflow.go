package agent_tools

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
)

type ModifyWorkflowTool struct {
	workflowService service.WorkflowService
}

func NewModifyWorkflowTool(workflowService service.WorkflowService) *ModifyWorkflowTool {
	return &ModifyWorkflowTool{workflowService: workflowService}
}

func (t *ModifyWorkflowTool) Name() string { return "modify_workflow" }

func (t *ModifyWorkflowTool) Description() string {
	return "Modify an existing workflow. Can update name, description, or the workflow definition (nodes and edges)."
}

func (t *ModifyWorkflowTool) Parameters() json.RawMessage {
	return json.RawMessage(`{
		"type": "object",
		"properties": {
			"workflow_id": {"type": "string", "description": "Workflow ID (UUID)"},
			"user_id": {"type": "string", "description": "User ID (UUID)"},
			"name": {"type": "string", "description": "New workflow name (optional)"},
			"description": {"type": "string", "description": "New description (optional)"},
			"definition": {"type": "object", "description": "New workflow definition (optional)"}
		},
		"required": ["workflow_id", "user_id"]
	}`)
}

func (t *ModifyWorkflowTool) RequiresConfirmation() bool { return true }

type modifyWorkflowParams struct {
	WorkflowID  string                 `json:"workflow_id"`
	UserID      string                 `json:"user_id"`
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	Definition  map[string]interface{} `json:"definition"`
}

func (t *ModifyWorkflowTool) Execute(ctx context.Context, params json.RawMessage) (*service.AgentToolResult, error) {
	var p modifyWorkflowParams
	if err := json.Unmarshal(params, &p); err != nil {
		return &service.AgentToolResult{Success: false, Error: "invalid parameters: " + err.Error()}, nil
	}

	workflowID, err := uuid.Parse(p.WorkflowID)
	if err != nil {
		return &service.AgentToolResult{Success: false, Error: "invalid workflow_id: " + err.Error()}, nil
	}

	userID, err := uuid.Parse(p.UserID)
	if err != nil {
		return &service.AgentToolResult{Success: false, Error: "invalid user_id: " + err.Error()}, nil
	}

	req := service.UpdateWorkflowRequest{}
	if p.Name != "" {
		req.Name = &p.Name
	}
	if p.Description != "" {
		req.Description = &p.Description
	}
	if p.Definition != nil {
		def := entity.JSON(p.Definition)
		req.Definition = &def
	}

	workflow, err := t.workflowService.Update(ctx, workflowID, userID, req)
	if err != nil {
		return &service.AgentToolResult{
			Success: false,
			Error:   fmt.Sprintf("failed to modify workflow: %v", err),
		}, nil
	}

	return &service.AgentToolResult{
		Success: true,
		Output:  fmt.Sprintf("Successfully modified workflow %q (ID: %s).", workflow.Name, workflow.ID.String()),
	}, nil
}
