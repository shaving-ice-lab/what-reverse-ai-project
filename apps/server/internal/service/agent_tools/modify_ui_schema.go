package agent_tools

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"

	"github.com/reverseai/server/internal/service"
)

type ModifyUISchemaTool struct {
	workspaceService service.WorkspaceService
}

func NewModifyUISchemaTool(workspaceService service.WorkspaceService) *ModifyUISchemaTool {
	return &ModifyUISchemaTool{workspaceService: workspaceService}
}

func (t *ModifyUISchemaTool) Name() string { return "modify_ui_schema" }

func (t *ModifyUISchemaTool) Description() string {
	return "Incrementally modify the existing UI Schema. Supports adding new pages, updating existing pages, removing pages, and changing app-level settings (app_name, navigation). Use this instead of generate_ui_schema when you only need to change part of the UI."
}

func (t *ModifyUISchemaTool) Parameters() json.RawMessage {
	return json.RawMessage(`{
		"type": "object",
		"properties": {
			"workspace_id": {"type": "string", "description": "Workspace ID"},
			"user_id": {"type": "string", "description": "User ID of the owner"},
			"operations": {
				"type": "array",
				"description": "List of modification operations to apply in order",
				"items": {
					"type": "object",
					"properties": {
						"op": {
							"type": "string",
							"enum": ["add_page", "update_page", "remove_page", "set_app_name", "set_navigation", "update_block"],
							"description": "Operation type"
						},
						"page_id": {"type": "string", "description": "Target page ID (for update_page, remove_page, update_block)"},
						"page": {
							"type": "object",
							"description": "Full page object (for add_page or update_page)",
							"properties": {
								"id": {"type": "string"},
								"title": {"type": "string"},
								"icon": {"type": "string"},
								"route": {"type": "string"},
								"blocks": {"type": "array", "items": {"type": "object"}}
							}
						},
						"block_index": {"type": "integer", "description": "Block index within the page (for update_block)"},
						"block": {"type": "object", "description": "Block object to set (for update_block)"},
						"value": {"description": "Value for set_app_name (string) or set_navigation (object)"}
					},
					"required": ["op"]
				}
			}
		},
		"required": ["workspace_id", "user_id", "operations"]
	}`)
}

func (t *ModifyUISchemaTool) RequiresConfirmation() bool { return false }

type modifyUISchemaParams struct {
	WorkspaceID string                   `json:"workspace_id"`
	UserID      string                   `json:"user_id"`
	Operations  []map[string]interface{} `json:"operations"`
}

func (t *ModifyUISchemaTool) Execute(ctx context.Context, params json.RawMessage) (*service.AgentToolResult, error) {
	var p modifyUISchemaParams
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

	if len(p.Operations) == 0 {
		return &service.AgentToolResult{Success: false, Error: "no operations provided"}, nil
	}

	// Get current UI schema
	versions, _, err := t.workspaceService.ListVersions(ctx, wsID, userID, 1, 1)
	if err != nil {
		return &service.AgentToolResult{
			Success: false,
			Error:   fmt.Sprintf("failed to get current schema: %v", err),
		}, nil
	}

	var schema map[string]interface{}
	if len(versions) > 0 && versions[0].UISchema != nil {
		schema = map[string]interface{}(versions[0].UISchema)
	}
	if schema == nil {
		schema = map[string]interface{}{
			"app_schema_version": "2.0.0",
			"pages":              []interface{}{},
		}
	}

	// Apply operations
	appliedOps := 0
	var opSummaries []string

	for _, op := range p.Operations {
		opType, _ := op["op"].(string)
		switch opType {
		case "add_page":
			page, ok := op["page"].(map[string]interface{})
			if !ok {
				continue
			}
			pages := getPages(schema)
			pages = append(pages, page)
			schema["pages"] = pages
			title, _ := page["title"].(string)
			opSummaries = append(opSummaries, fmt.Sprintf("added page %q", title))
			appliedOps++

		case "update_page":
			pageID, _ := op["page_id"].(string)
			page, ok := op["page"].(map[string]interface{})
			if !ok || pageID == "" {
				continue
			}
			pages := getPages(schema)
			for i, existing := range pages {
				existingMap, ok := existing.(map[string]interface{})
				if !ok {
					continue
				}
				if existingMap["id"] == pageID {
					// Merge: new page fields override existing
					for k, v := range page {
						existingMap[k] = v
					}
					pages[i] = existingMap
					title, _ := existingMap["title"].(string)
					opSummaries = append(opSummaries, fmt.Sprintf("updated page %q", title))
					appliedOps++
					break
				}
			}
			schema["pages"] = pages

		case "remove_page":
			pageID, _ := op["page_id"].(string)
			if pageID == "" {
				continue
			}
			pages := getPages(schema)
			newPages := make([]interface{}, 0, len(pages))
			for _, existing := range pages {
				existingMap, ok := existing.(map[string]interface{})
				if !ok {
					newPages = append(newPages, existing)
					continue
				}
				if existingMap["id"] != pageID {
					newPages = append(newPages, existing)
				}
			}
			schema["pages"] = newPages
			// Also remove from navigation items if present
			removeNavItem(schema, pageID)
			opSummaries = append(opSummaries, fmt.Sprintf("removed page %q", pageID))
			appliedOps++

		case "set_app_name":
			value, _ := op["value"].(string)
			if value != "" {
				schema["app_name"] = value
				opSummaries = append(opSummaries, fmt.Sprintf("set app_name to %q", value))
				appliedOps++
			}

		case "set_navigation":
			value, ok := op["value"].(map[string]interface{})
			if ok {
				schema["navigation"] = value
				opSummaries = append(opSummaries, "updated navigation")
				appliedOps++
			}

		case "update_block":
			pageID, _ := op["page_id"].(string)
			blockIdxFloat, hasIdx := op["block_index"].(float64)
			block, ok := op["block"].(map[string]interface{})
			if !ok || pageID == "" || !hasIdx {
				continue
			}
			blockIdx := int(blockIdxFloat)
			pages := getPages(schema)
			for i, existing := range pages {
				existingMap, ok := existing.(map[string]interface{})
				if !ok || existingMap["id"] != pageID {
					continue
				}
				blocks, ok := existingMap["blocks"].([]interface{})
				if !ok || blockIdx < 0 || blockIdx >= len(blocks) {
					continue
				}
				blocks[blockIdx] = block
				existingMap["blocks"] = blocks
				pages[i] = existingMap
				opSummaries = append(opSummaries, fmt.Sprintf("updated block %d in page %q", blockIdx, pageID))
				appliedOps++
				break
			}
			schema["pages"] = pages
		}
	}

	if appliedOps == 0 {
		return &service.AgentToolResult{
			Success: false,
			Error:   "no valid operations were applied",
		}, nil
	}

	// Save updated schema
	_, err = t.workspaceService.UpdateUISchema(ctx, wsID, userID, schema)
	if err != nil {
		return &service.AgentToolResult{
			Success: false,
			Error:   fmt.Sprintf("failed to save updated schema: %v", err),
		}, nil
	}

	pageCount := len(getPages(schema))
	summary := fmt.Sprintf("Applied %d operations (%d pages total): ", appliedOps, pageCount)
	for i, s := range opSummaries {
		if i > 0 {
			summary += "; "
		}
		summary += s
	}

	return &service.AgentToolResult{
		Success: true,
		Output:  summary,
	}, nil
}

// getPages extracts the pages slice from a schema map
func getPages(schema map[string]interface{}) []interface{} {
	pages, ok := schema["pages"].([]interface{})
	if !ok {
		return []interface{}{}
	}
	return pages
}

// removeNavItem removes a navigation item with matching page_id
func removeNavItem(schema map[string]interface{}, pageID string) {
	nav, ok := schema["navigation"].(map[string]interface{})
	if !ok {
		return
	}
	items, ok := nav["items"].([]interface{})
	if !ok {
		return
	}
	newItems := make([]interface{}, 0, len(items))
	for _, item := range items {
		itemMap, ok := item.(map[string]interface{})
		if !ok {
			newItems = append(newItems, item)
			continue
		}
		if itemMap["page_id"] != pageID && itemMap["id"] != pageID {
			newItems = append(newItems, item)
		}
	}
	nav["items"] = newItems
	schema["navigation"] = nav
}
