package skills

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/reverseai/server/internal/service"
)

// NewUIGenerationSkill 创建 UI Generation Skill
// 注意：generate_ui_schema 和 modify_ui_schema 工具在 server.go 中独立注册（因为它们需要 WorkspaceService 依赖来持久化）
// 此 Skill 仅提供 system prompt 指导和元信息
func NewUIGenerationSkill() *service.Skill {
	return &service.Skill{
		ID:          "builtin_ui_generation",
		Name:        "UI Generation",
		Description: "Generate and modify UI Schema for application pages. Create data tables, forms, charts, stats cards, and detail views based on your data model.",
		Category:    service.SkillCategoryUIGeneration,
		Icon:        "Layout",
		Builtin:     true,
		Enabled:     true,
		Tools: []service.AgentTool{
			&ModifyUISchemaTool{},
		},
		SystemPromptAddition: `You are an expert UI/UX designer. When generating UI schemas:
- Use appropriate component types: data_table for list views, form for input, stats_card for KPIs, chart for visualizations
- Follow a consistent layout: dashboard pages use stats cards at top + charts/tables below
- Forms should have clear labels, appropriate input types, and validation rules
- Tables should show the most important columns first, with actions (edit/delete) on the right
- Use chart types appropriately: bar for comparison, line for trends, pie for proportions
- Keep the UI clean and focused — avoid information overload`,
	}
}

// GenerateUISchemaTool 生成 UI Schema
type GenerateUISchemaTool struct{}

func (t *GenerateUISchemaTool) Name() string { return "generate_ui_schema" }
func (t *GenerateUISchemaTool) Description() string {
	return "Generate a UI Schema JSON for a page based on the data model and requirements. The schema defines the layout, components, and data bindings."
}
func (t *GenerateUISchemaTool) Parameters() json.RawMessage {
	return json.RawMessage(`{
		"type": "object",
		"properties": {
			"page_id": {"type": "string", "description": "Page identifier"},
			"title": {"type": "string", "description": "Page title"},
			"layout": {"type": "string", "enum": ["dashboard", "table", "form", "detail", "custom"], "description": "Page layout type"},
			"components": {
				"type": "array",
				"items": {
					"type": "object",
					"properties": {
						"type": {"type": "string", "enum": ["data_table", "form", "stats_card", "chart", "detail_view", "markdown"]},
						"label": {"type": "string"},
						"config": {"type": "object"}
					},
					"required": ["type"]
				}
			},
			"table_name": {"type": "string", "description": "Primary table for data binding"}
		},
		"required": ["page_id", "title", "layout", "components"]
	}`)
}
func (t *GenerateUISchemaTool) RequiresConfirmation() bool { return false }
func (t *GenerateUISchemaTool) Execute(ctx context.Context, params json.RawMessage) (*service.AgentToolResult, error) {
	var p struct {
		PageID     string                   `json:"page_id"`
		Title      string                   `json:"title"`
		Layout     string                   `json:"layout"`
		Components []map[string]interface{} `json:"components"`
		TableName  string                   `json:"table_name"`
	}
	if err := json.Unmarshal(params, &p); err != nil {
		return &service.AgentToolResult{Success: false, Error: "invalid parameters: " + err.Error()}, nil
	}

	schema := map[string]interface{}{
		"app_schema_version": "2.0.0",
		"page_id":            p.PageID,
		"title":              p.Title,
		"layout":             p.Layout,
		"components":         p.Components,
	}
	if p.TableName != "" {
		schema["data_source"] = map[string]interface{}{"table": p.TableName}
	}

	return &service.AgentToolResult{
		Success: true,
		Output:  fmt.Sprintf("Generated UI Schema for page %q with %d components.", p.Title, len(p.Components)),
		Data:    schema,
	}, nil
}

// ModifyUISchemaTool 修改 UI Schema
type ModifyUISchemaTool struct{}

func (t *ModifyUISchemaTool) Name() string { return "modify_ui_schema" }
func (t *ModifyUISchemaTool) Description() string {
	return "Modify an existing UI Schema. Add, remove, or update components, change layout, or update data bindings."
}
func (t *ModifyUISchemaTool) Parameters() json.RawMessage {
	return json.RawMessage(`{
		"type": "object",
		"properties": {
			"page_id": {"type": "string", "description": "Page identifier to modify"},
			"changes": {
				"type": "object",
				"properties": {
					"title": {"type": "string"},
					"layout": {"type": "string"},
					"add_components": {"type": "array", "items": {"type": "object"}},
					"remove_component_indexes": {"type": "array", "items": {"type": "integer"}},
					"update_component": {"type": "object", "properties": {"index": {"type": "integer"}, "updates": {"type": "object"}}}
				}
			}
		},
		"required": ["page_id", "changes"]
	}`)
}
func (t *ModifyUISchemaTool) RequiresConfirmation() bool { return false }
func (t *ModifyUISchemaTool) Execute(ctx context.Context, params json.RawMessage) (*service.AgentToolResult, error) {
	var p struct {
		PageID  string                 `json:"page_id"`
		Changes map[string]interface{} `json:"changes"`
	}
	if err := json.Unmarshal(params, &p); err != nil {
		return &service.AgentToolResult{Success: false, Error: "invalid parameters: " + err.Error()}, nil
	}

	changeCount := len(p.Changes)
	return &service.AgentToolResult{
		Success: true,
		Output:  fmt.Sprintf("Applied %d changes to UI Schema for page %q.", changeCount, p.PageID),
		Data:    p.Changes,
	}, nil
}
