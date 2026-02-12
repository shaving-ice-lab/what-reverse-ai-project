package agent_tools

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"

	"github.com/reverseai/server/internal/service"
)

type GetUISchemaTool struct {
	workspaceService service.WorkspaceService
}

func NewGetUISchemaTool(workspaceService service.WorkspaceService) *GetUISchemaTool {
	return &GetUISchemaTool{workspaceService: workspaceService}
}

func (t *GetUISchemaTool) Name() string { return "get_ui_schema" }

func (t *GetUISchemaTool) Description() string {
	return "Get the current UI Schema of the workspace app. Returns the full schema including pages, navigation, and component definitions. Use this before modifying the UI to understand the current state."
}

func (t *GetUISchemaTool) Parameters() json.RawMessage {
	return json.RawMessage(`{
		"type": "object",
		"properties": {
			"workspace_id": {"type": "string", "description": "Workspace ID"},
			"user_id": {"type": "string", "description": "User ID of the owner"}
		},
		"required": ["workspace_id", "user_id"]
	}`)
}

func (t *GetUISchemaTool) RequiresConfirmation() bool { return false }

type getUISchemaParams struct {
	WorkspaceID string `json:"workspace_id"`
	UserID      string `json:"user_id"`
}

func (t *GetUISchemaTool) Execute(ctx context.Context, params json.RawMessage) (*service.AgentToolResult, error) {
	var p getUISchemaParams
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

	// Get the latest version which contains the UI schema
	versions, _, err := t.workspaceService.ListVersions(ctx, wsID, userID, 1, 1)
	if err != nil {
		return &service.AgentToolResult{
			Success: false,
			Error:   fmt.Sprintf("failed to get versions: %v", err),
		}, nil
	}

	if len(versions) == 0 {
		return &service.AgentToolResult{
			Success: true,
			Output:  "No UI Schema configured yet. The workspace has no versions.",
			Data:    map[string]interface{}{"ui_schema": nil},
		}, nil
	}

	latestVersion := versions[0]
	uiSchema := latestVersion.UISchema

	pageCount := 0
	if uiSchema != nil {
		if pages, ok := uiSchema["pages"].([]interface{}); ok {
			pageCount = len(pages)
		}
	}

	summary := "No UI Schema configured."
	if len(uiSchema) > 0 {
		summary = fmt.Sprintf("Current UI Schema has %d pages (version %s).", pageCount, latestVersion.Version)
	}

	return &service.AgentToolResult{
		Success: true,
		Output:  summary,
		Data: map[string]interface{}{
			"ui_schema":  uiSchema,
			"version":    latestVersion.Version,
			"version_id": latestVersion.ID.String(),
			"created_at": latestVersion.CreatedAt,
		},
	}, nil
}
