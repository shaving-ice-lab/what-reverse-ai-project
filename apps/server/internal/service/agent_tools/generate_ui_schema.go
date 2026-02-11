package agent_tools

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"

	"github.com/agentflow/server/internal/service"
)

type GenerateUISchemaTool struct {
	workspaceService service.WorkspaceService
}

func NewGenerateUISchemaTool(workspaceService service.WorkspaceService) *GenerateUISchemaTool {
	return &GenerateUISchemaTool{workspaceService: workspaceService}
}

func (t *GenerateUISchemaTool) Name() string { return "generate_ui_schema" }

func (t *GenerateUISchemaTool) Description() string {
	return "Generate or update the UI Schema for the workspace app. The UI Schema defines the app's pages, navigation, and form/table/chart components that users interact with."
}

func (t *GenerateUISchemaTool) Parameters() json.RawMessage {
	return json.RawMessage(`{
		"type": "object",
		"properties": {
			"workspace_id": {"type": "string", "description": "Workspace ID"},
			"user_id": {"type": "string", "description": "User ID of the owner"},
			"ui_schema": {
				"type": "object",
				"description": "The UI Schema object containing pages, navigation, and component definitions",
				"properties": {
					"app_schema_version": {"type": "string", "description": "Schema version, e.g. 2.0.0"},
					"pages": {
						"type": "array",
						"items": {
							"type": "object",
							"properties": {
								"id": {"type": "string"},
								"title": {"type": "string"},
								"icon": {"type": "string"},
								"blocks": {"type": "array", "items": {"type": "object"}}
							}
						}
					},
					"navigation": {
						"type": "object",
						"properties": {
							"type": {"type": "string", "enum": ["sidebar", "topbar", "tabs"]},
							"items": {"type": "array", "items": {"type": "object"}}
						}
					}
				}
			}
		},
		"required": ["workspace_id", "user_id", "ui_schema"]
	}`)
}

func (t *GenerateUISchemaTool) RequiresConfirmation() bool { return false }

type generateUISchemaParams struct {
	WorkspaceID string                 `json:"workspace_id"`
	UserID      string                 `json:"user_id"`
	UISchema    map[string]interface{} `json:"ui_schema"`
}

func (t *GenerateUISchemaTool) Execute(ctx context.Context, params json.RawMessage) (*service.AgentToolResult, error) {
	var p generateUISchemaParams
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

	version, err := t.workspaceService.UpdateUISchema(ctx, wsID, userID, p.UISchema)
	if err != nil {
		return &service.AgentToolResult{
			Success: false,
			Error:   fmt.Sprintf("failed to update UI schema: %v", err),
		}, nil
	}

	pageCount := 0
	if pages, ok := p.UISchema["pages"].([]interface{}); ok {
		pageCount = len(pages)
	}

	return &service.AgentToolResult{
		Success: true,
		Output:  fmt.Sprintf("UI Schema updated successfully (version %s, %d pages).", version.ID.String(), pageCount),
	}, nil
}
