package skills

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/agentflow/server/internal/service"
	"github.com/agentflow/server/internal/service/agent_tools"
)

// NewBusinessLogicSkill 创建 Business Logic Skill
func NewBusinessLogicSkill(
	workflowService service.WorkflowService,
	dbQueryService service.WorkspaceDBQueryService,
) *service.Skill {
	return &service.Skill{
		ID:          "builtin_business_logic",
		Name:        "Business Logic",
		Description: "Design and manage business workflows. Create workflows, modify flow logic, and get suggestions for business process automation.",
		Category:    service.SkillCategoryBusinessLogic,
		Icon:        "GitBranch",
		Builtin:     true,
		Enabled:     true,
		Tools: []service.AgentTool{
			agent_tools.NewCreateWorkflowTool(workflowService),
			agent_tools.NewModifyWorkflowTool(workflowService),
			agent_tools.NewGetWorkspaceInfoTool(dbQueryService, workflowService),
			&SuggestWorkflowTool{},
		},
		SystemPromptAddition: `You are an expert in business process design. When creating workflows:
- Start with a clear trigger (start node, form_submit, or schedule_trigger)
- Always end with an end node
- Use condition nodes for branching logic (e.g., approval thresholds, status checks)
- Use aggregate nodes before page_render for dashboard views
- Add notification nodes for important state changes
- Keep workflows focused on a single business process
- Available node types: start, end, db_select, db_insert, db_update, db_delete, form_submit, page_render, condition, loop, aggregate, notification, schedule_trigger, http, llm, code, template, variable
- Use meaningful node IDs and labels`,
	}
}

// SuggestWorkflowTool 建议工作流结构
type SuggestWorkflowTool struct{}

func (t *SuggestWorkflowTool) Name() string { return "suggest_workflow" }
func (t *SuggestWorkflowTool) Description() string {
	return "Analyze a business requirement and suggest a workflow structure with appropriate node types and connections."
}
func (t *SuggestWorkflowTool) Parameters() json.RawMessage {
	return json.RawMessage(`{
		"type": "object",
		"properties": {
			"requirement": {"type": "string", "description": "Business requirement description"},
			"tables": {"type": "array", "items": {"type": "string"}, "description": "Available database tables"},
			"workflow_type": {"type": "string", "enum": ["crud", "dashboard", "approval", "automation", "integration", "custom"], "description": "Type of workflow to suggest"}
		},
		"required": ["requirement"]
	}`)
}
func (t *SuggestWorkflowTool) RequiresConfirmation() bool { return false }
func (t *SuggestWorkflowTool) Execute(ctx context.Context, params json.RawMessage) (*service.AgentToolResult, error) {
	var p struct {
		Requirement  string   `json:"requirement"`
		Tables       []string `json:"tables"`
		WorkflowType string   `json:"workflow_type"`
	}
	if err := json.Unmarshal(params, &p); err != nil {
		return &service.AgentToolResult{Success: false, Error: "invalid parameters: " + err.Error()}, nil
	}

	// Build suggestion based on workflow type
	suggestion := buildWorkflowSuggestion(p.WorkflowType, p.Tables)

	return &service.AgentToolResult{
		Success: true,
		Output:  fmt.Sprintf("Generated workflow suggestion for: %q (type: %s)", p.Requirement, p.WorkflowType),
		Data:    suggestion,
	}, nil
}

func buildWorkflowSuggestion(wfType string, tables []string) map[string]interface{} {
	tableName := "my_table"
	if len(tables) > 0 {
		tableName = tables[0]
	}

	switch wfType {
	case "crud":
		return map[string]interface{}{
			"type":        "crud",
			"description": "Standard CRUD workflow for " + tableName,
			"nodes": []map[string]interface{}{
				{"type": "start", "label": "Start"},
				{"type": "db_select", "label": "Query " + tableName, "config": map[string]interface{}{"table": tableName}},
				{"type": "page_render", "label": "Display Table"},
				{"type": "form_submit", "label": "Handle Form"},
				{"type": "db_insert", "label": "Insert Record", "config": map[string]interface{}{"table": tableName}},
				{"type": "end", "label": "End"},
			},
			"flow": "start → db_select → page_render + form_submit → db_insert → end",
		}
	case "dashboard":
		return map[string]interface{}{
			"type":        "dashboard",
			"description": "Analytics dashboard for " + tableName,
			"nodes": []map[string]interface{}{
				{"type": "start", "label": "Start"},
				{"type": "db_select", "label": "Query Data"},
				{"type": "aggregate", "label": "Compute Stats"},
				{"type": "page_render", "label": "Render Dashboard"},
				{"type": "end", "label": "End"},
			},
			"flow": "start → db_select → aggregate → page_render → end",
		}
	case "approval":
		return map[string]interface{}{
			"type":        "approval",
			"description": "Approval workflow",
			"nodes": []map[string]interface{}{
				{"type": "start", "label": "Start"},
				{"type": "form_submit", "label": "Submit Request"},
				{"type": "condition", "label": "Check Criteria"},
				{"type": "notification", "label": "Notify Approver"},
				{"type": "db_update", "label": "Update Status"},
				{"type": "end", "label": "End"},
			},
			"flow": "start → form_submit → condition → notification / db_update → end",
		}
	default:
		return map[string]interface{}{
			"type":        "custom",
			"description": "Custom workflow",
			"nodes": []map[string]interface{}{
				{"type": "start", "label": "Start"},
				{"type": "end", "label": "End"},
			},
			"flow": "start → (add nodes) → end",
		}
	}
}
