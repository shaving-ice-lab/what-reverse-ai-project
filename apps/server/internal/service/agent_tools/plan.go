package agent_tools

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/reverseai/server/internal/service"
)

// ---- create_plan ----

type CreatePlanTool struct {
	sessions *service.AgentSessionManager
}

func NewCreatePlanTool(sessions *service.AgentSessionManager) *CreatePlanTool {
	return &CreatePlanTool{sessions: sessions}
}

func (t *CreatePlanTool) Name() string { return "create_plan" }

func (t *CreatePlanTool) Description() string {
	return `Create a structured development plan as a TodoList. The plan is presented to the user for confirmation before any execution begins.

Rules:
- Create plan AFTER gathering enough requirements through conversation
- Group steps by phase: data_layer (database), ui_layer (UI/pages), logic_layer (business logic), verification
- Each step should be atomic and trackable
- Include a summary of gathered requirements
- The plan status starts as "draft" — the user must confirm it before execution begins
- For simple requests (1-3 steps), you may skip groups`
}

func (t *CreatePlanTool) Parameters() json.RawMessage {
	return json.RawMessage(`{
		"type": "object",
		"properties": {
			"title": {"type": "string", "description": "Plan title (e.g., 'Build Task Management App')"},
			"summary": {"type": "string", "description": "Brief summary of gathered requirements from the planning conversation"},
			"groups": {
				"type": "array",
				"description": "Step groups/phases (e.g., data_layer, ui_layer, verification)",
				"items": {
					"type": "object",
					"properties": {
						"id": {"type": "string", "description": "Group ID (e.g., 'data_layer')"},
						"label": {"type": "string", "description": "Display label (e.g., 'Data Layer')"},
						"icon": {"type": "string", "description": "Emoji icon for display (e.g., '📦', '🎨', '✔️')"}
					},
					"required": ["id", "label"]
				}
			},
			"steps": {
				"type": "array",
				"description": "Ordered list of execution steps",
				"items": {
					"type": "object",
					"properties": {
						"id": {"type": "string", "description": "Unique step ID (e.g., 'step_1')"},
						"description": {"type": "string", "description": "What this step does"},
						"tool": {"type": "string", "description": "Which tool will be used (e.g., 'create_table', 'generate_ui_schema')"},
						"group_id": {"type": "string", "description": "Which group this step belongs to (must match a group id)"}
					},
					"required": ["id", "description"]
				}
			}
		},
		"required": ["title", "steps"]
	}`)
}

func (t *CreatePlanTool) RequiresConfirmation() bool { return false }

type createPlanParams struct {
	Title   string `json:"title"`
	Summary string `json:"summary,omitempty"`
	Groups  []struct {
		ID    string `json:"id"`
		Label string `json:"label"`
		Icon  string `json:"icon,omitempty"`
	} `json:"groups,omitempty"`
	Steps []struct {
		ID          string `json:"id"`
		Description string `json:"description"`
		Tool        string `json:"tool,omitempty"`
		GroupID     string `json:"group_id,omitempty"`
	} `json:"steps"`
}

func (t *CreatePlanTool) Execute(ctx context.Context, params json.RawMessage) (*service.AgentToolResult, error) {
	var p createPlanParams
	if err := json.Unmarshal(params, &p); err != nil {
		return &service.AgentToolResult{Success: false, Error: "invalid parameters: " + err.Error()}, nil
	}

	if p.Title == "" {
		return &service.AgentToolResult{Success: false, Error: "title is required"}, nil
	}
	if len(p.Steps) == 0 {
		return &service.AgentToolResult{Success: false, Error: "at least one step is required"}, nil
	}

	// Build plan groups and index for validation
	planGroups := make([]service.PlanGroup, len(p.Groups))
	groupIDs := make(map[string]bool, len(p.Groups))
	for i, g := range p.Groups {
		planGroups[i] = service.PlanGroup{
			ID:    g.ID,
			Label: g.Label,
			Icon:  g.Icon,
		}
		groupIDs[g.ID] = true
	}

	// Build plan steps — validate group_id references
	planSteps := make([]service.AgentPlanStep, len(p.Steps))
	for i, s := range p.Steps {
		id := s.ID
		if id == "" {
			id = fmt.Sprintf("step_%d", i+1)
		}
		gid := s.GroupID
		if gid != "" && !groupIDs[gid] {
			// Invalid group_id reference — clear it to avoid rendering issues
			gid = ""
		}
		planSteps[i] = service.AgentPlanStep{
			ID:          id,
			Description: s.Description,
			Tool:        s.Tool,
			Status:      "pending",
			GroupID:     gid,
		}
	}

	plan := &service.AgentPlan{
		Title:   p.Title,
		Status:  "draft",
		Summary: p.Summary,
		Groups:  planGroups,
		Steps:   planSteps,
	}

	// Store plan in session via SessionContext
	if sc := service.GetSessionContext(ctx); sc != nil {
		if session, ok := t.sessions.Get(sc.SessionID); ok {
			session.SetPlan(plan)
		}
	}

	// Build display
	var lines []string
	lines = append(lines, fmt.Sprintf("Plan: **%s** (%d steps)", p.Title, len(planSteps)))
	if p.Summary != "" {
		lines = append(lines, fmt.Sprintf("Requirements: %s", p.Summary))
	}
	// Group display
	if len(planGroups) > 0 {
		for _, g := range planGroups {
			icon := g.Icon
			if icon == "" {
				icon = "•"
			}
			lines = append(lines, fmt.Sprintf("\n%s %s", icon, g.Label))
			for _, s := range planSteps {
				if s.GroupID == g.ID {
					toolInfo := ""
					if s.Tool != "" {
						toolInfo = fmt.Sprintf(" → %s", s.Tool)
					}
					lines = append(lines, fmt.Sprintf("  ⏳ %s: %s%s", s.ID, s.Description, toolInfo))
				}
			}
		}
		// Ungrouped steps
		for _, s := range planSteps {
			if s.GroupID == "" {
				toolInfo := ""
				if s.Tool != "" {
					toolInfo = fmt.Sprintf(" → %s", s.Tool)
				}
				lines = append(lines, fmt.Sprintf("  ⏳ %s: %s%s", s.ID, s.Description, toolInfo))
			}
		}
	} else {
		for _, s := range planSteps {
			toolInfo := ""
			if s.Tool != "" {
				toolInfo = fmt.Sprintf(" → %s", s.Tool)
			}
			lines = append(lines, fmt.Sprintf("  ⏳ %s: %s%s", s.ID, s.Description, toolInfo))
		}
	}
	lines = append(lines, "\nStatus: draft — awaiting your confirmation to begin execution.")

	return &service.AgentToolResult{
		Success: true,
		Output:  strings.Join(lines, "\n"),
		Data: map[string]interface{}{
			"type":    "plan",
			"status":  "draft",
			"title":   p.Title,
			"summary": p.Summary,
			"groups":  planGroups,
			"steps":   planSteps,
		},
	}, nil
}

// ---- update_plan ----

type UpdatePlanTool struct {
	sessions *service.AgentSessionManager
}

func NewUpdatePlanTool(sessions *service.AgentSessionManager) *UpdatePlanTool {
	return &UpdatePlanTool{sessions: sessions}
}

func (t *UpdatePlanTool) Name() string { return "update_plan" }

func (t *UpdatePlanTool) Description() string {
	return `Update the status of a plan step. Mark steps as in_progress before starting work, and completed immediately after finishing. Never batch multiple status updates — mark each step individually as you complete it.`
}

func (t *UpdatePlanTool) Parameters() json.RawMessage {
	return json.RawMessage(`{
		"type": "object",
		"properties": {
			"step_id": {"type": "string", "description": "ID of the step to update"},
			"status": {"type": "string", "enum": ["in_progress", "completed", "failed"], "description": "New status"},
			"note": {"type": "string", "description": "Optional note about the step (e.g., error message for failed steps)"}
		},
		"required": ["step_id", "status"]
	}`)
}

func (t *UpdatePlanTool) RequiresConfirmation() bool { return false }

type updatePlanParams struct {
	StepID string `json:"step_id"`
	Status string `json:"status"`
	Note   string `json:"note,omitempty"`
}

func (t *UpdatePlanTool) Execute(ctx context.Context, params json.RawMessage) (*service.AgentToolResult, error) {
	var p updatePlanParams
	if err := json.Unmarshal(params, &p); err != nil {
		return &service.AgentToolResult{Success: false, Error: "invalid parameters: " + err.Error()}, nil
	}

	if p.StepID == "" {
		return &service.AgentToolResult{Success: false, Error: "step_id is required"}, nil
	}

	validStatuses := map[string]bool{"in_progress": true, "completed": true, "failed": true}
	if !validStatuses[p.Status] {
		return &service.AgentToolResult{Success: false, Error: "status must be one of: in_progress, completed, failed"}, nil
	}

	// Update plan step in session
	var updatedPlan *service.AgentPlan
	if sc := service.GetSessionContext(ctx); sc != nil {
		if session, ok := t.sessions.Get(sc.SessionID); ok {
			if !session.UpdatePlanStep(p.StepID, p.Status, p.Note) {
				return &service.AgentToolResult{
					Success: false,
					Error:   fmt.Sprintf("step_id %q not found in current plan. Create a plan first with create_plan.", p.StepID),
				}, nil
			}
			updatedPlan = session.GetPlan()

			// Auto-complete plan when all steps are done (completed or failed)
			if updatedPlan != nil {
				allDone := true
				for _, s := range updatedPlan.Steps {
					if s.Status != "completed" && s.Status != "failed" {
						allDone = false
						break
					}
				}
				if allDone && updatedPlan.Status == "in_progress" {
					updatedPlan.Status = "completed"
					session.SetPlan(updatedPlan)
					session.SetPhase(service.SessionPhaseCompleted)
				}
			}
		}
	}

	icon := map[string]string{
		"in_progress": "->",
		"completed":   "[x]",
		"failed":      "[!]",
	}[p.Status]

	output := fmt.Sprintf("%s Step %s: %s", icon, p.StepID, p.Status)
	if p.Note != "" {
		output += fmt.Sprintf(" (%s)", p.Note)
	}

	data := map[string]interface{}{
		"type":    "plan_update",
		"step_id": p.StepID,
		"status":  p.Status,
		"note":    p.Note,
	}
	// Include full updated plan so frontend can re-render in-place
	if updatedPlan != nil {
		data["plan"] = updatedPlan
	}

	return &service.AgentToolResult{
		Success: true,
		Output:  output,
		Data:    data,
	}, nil
}
