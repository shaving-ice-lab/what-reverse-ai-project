package agent_tools

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/reverseai/server/internal/service"
)

type CreatePersonaTool struct {
	personaRegistry *service.PersonaRegistry
}

func NewCreatePersonaTool(personaRegistry *service.PersonaRegistry) *CreatePersonaTool {
	return &CreatePersonaTool{personaRegistry: personaRegistry}
}

func (t *CreatePersonaTool) Name() string { return "create_persona" }

func (t *CreatePersonaTool) Description() string {
	return `Create a custom AI Staff persona that users can chat with. The persona will have a specific role, allowed data operations, system prompt defining its behavior, and quick suggestions for users. Use this when a user asks to create an AI assistant/staff/agent with specific capabilities.`
}

func (t *CreatePersonaTool) Parameters() json.RawMessage {
	return json.RawMessage(`{
		"type": "object",
		"properties": {
			"workspace_id": {"type": "string", "description": "Workspace ID"},
			"user_id": {"type": "string", "description": "User ID"},
			"name": {"type": "string", "description": "Display name for the AI staff, e.g. 'Customer Support Agent', 'Inventory Manager'"},
			"description": {"type": "string", "description": "Brief description of what this AI staff does (shown in the selector UI)"},
			"role_prompt": {"type": "string", "description": "Detailed system prompt defining the staff's behavior, personality, domain knowledge, and rules. Be specific about what it should and should not do."},
			"allowed_actions": {
				"type": "array",
				"items": {"type": "string", "enum": ["query", "insert", "update", "delete"]},
				"description": "Which data operations this staff can perform. 'query' = read data, 'insert' = add records, 'update' = modify records, 'delete' = remove records"
			},
			"icon": {"type": "string", "description": "Icon name: UserCog, Headphones, ShieldCheck, ClipboardList, PackageSearch, Heart, Stethoscope, GraduationCap, Megaphone, Wrench", "default": "UserCog"},
			"color": {"type": "string", "description": "Theme color: green, blue, amber, violet, red", "default": "green"},
			"suggestions": {
				"type": "array",
				"items": {
					"type": "object",
					"properties": {
						"label": {"type": "string", "description": "Short button label with emoji, e.g. '📞 Handle Inquiry'"},
						"prompt": {"type": "string", "description": "The full prompt that gets sent when the user clicks this suggestion"}
					},
					"required": ["label", "prompt"]
				},
				"description": "3-4 quick suggestion buttons shown when starting a chat with this staff"
			}
		},
		"required": ["name", "description", "role_prompt", "allowed_actions"]
	}`)
}

func (t *CreatePersonaTool) RequiresConfirmation() bool { return false }

type createPersonaParams struct {
	WorkspaceID    string                      `json:"workspace_id"`
	UserID         string                      `json:"user_id"`
	Name           string                      `json:"name"`
	Description    string                      `json:"description"`
	RolePrompt     string                      `json:"role_prompt"`
	AllowedActions []string                    `json:"allowed_actions"`
	Icon           string                      `json:"icon"`
	Color          string                      `json:"color"`
	Suggestions    []service.PersonaSuggestion `json:"suggestions"`
}

// mapActionsToTools converts user-friendly action names to actual tool names
func mapActionsToTools(actions []string) []string {
	toolMap := map[string]string{
		"query":  "query_data",
		"insert": "insert_data",
		"update": "update_data",
		"delete": "delete_data",
	}
	tools := []string{"get_workspace_info"} // always include
	seen := map[string]bool{"get_workspace_info": true}
	for _, action := range actions {
		if toolName, ok := toolMap[strings.ToLower(strings.TrimSpace(action))]; ok {
			if !seen[toolName] {
				tools = append(tools, toolName)
				seen[toolName] = true
			}
		}
	}
	return tools
}

// buildStaffSystemPrompt wraps the user's role prompt with standard staff framing
func buildStaffSystemPrompt(name, rolePrompt string, actions []string) string {
	canModify := false
	for _, a := range actions {
		if a == "insert" || a == "update" || a == "delete" {
			canModify = true
			break
		}
	}

	var rules string
	if canModify {
		actionsDesc := strings.Join(actions, ", ")
		rules = "\nIMPORTANT RULES:\n" +
			"1. You can manage DATA (" + actionsDesc + " records) but NEVER modify the database STRUCTURE (no create/alter/drop tables, no UI changes).\n" +
			"2. Always confirm what the user wants before making changes.\n" +
			"3. Before updating or deleting, query the current data first to verify the target records.\n" +
			"4. After making changes, query the data again to confirm the operation was successful.\n" +
			"5. For bulk operations, summarize what will be changed before proceeding.\n" +
			"6. Keep a clear log of all changes made in your responses.\n" +
			"7. Be careful with delete operations — confirm with the user before deleting."
	} else {
		rules = "\nIMPORTANT RULES:\n" +
			"1. You are READ-ONLY: you can query and analyze data but NEVER create, modify, or delete any records.\n" +
			"2. Present data clearly with appropriate formatting.\n" +
			"3. Provide actionable insights based on the data you find."
	}

	return fmt.Sprintf("You are **%s**, a specialized AI staff assistant.\n\n%s\n%s\n\n"+
		"You MUST respond with either:\n"+
		"- A tool call (function_call) to perform a data operation\n"+
		"- A plain text message with your response or asking for clarification", name, rolePrompt, rules)
}

// validActions is the set of recognized action names
var validActions = map[string]bool{"query": true, "insert": true, "update": true, "delete": true}

func (t *CreatePersonaTool) Execute(ctx context.Context, params json.RawMessage) (*service.AgentToolResult, error) {
	var p createPersonaParams
	if err := json.Unmarshal(params, &p); err != nil {
		return &service.AgentToolResult{Success: false, Error: "invalid parameters: " + err.Error()}, nil
	}

	if p.Name == "" {
		return &service.AgentToolResult{Success: false, Error: "name is required"}, nil
	}
	if p.RolePrompt == "" {
		return &service.AgentToolResult{Success: false, Error: "role_prompt is required"}, nil
	}
	if len(p.AllowedActions) == 0 {
		return &service.AgentToolResult{Success: false, Error: "at least one allowed_action is required"}, nil
	}

	// Validate all actions are recognized
	for _, a := range p.AllowedActions {
		if !validActions[strings.ToLower(strings.TrimSpace(a))] {
			return &service.AgentToolResult{
				Success: false,
				Error:   fmt.Sprintf("invalid allowed_action %q — must be one of: query, insert, update, delete", a),
			}, nil
		}
	}

	// Check for duplicate name
	for _, existing := range t.personaRegistry.ListAll() {
		if strings.EqualFold(existing.Name, p.Name) {
			return &service.AgentToolResult{
				Success: false,
				Error:   fmt.Sprintf("a persona named %q already exists (id: %s)", existing.Name, existing.ID),
			}, nil
		}
	}

	// Generate persona ID
	personaID := "staff_" + uuid.New().String()[:8]

	// Map actions to tools
	toolFilter := mapActionsToTools(p.AllowedActions)

	// Build system prompt
	systemPrompt := buildStaffSystemPrompt(p.Name, p.RolePrompt, p.AllowedActions)

	// Defaults
	icon := p.Icon
	if icon == "" {
		icon = "UserCog"
	}
	color := p.Color
	if color == "" {
		color = "green"
	}

	// Register
	if err := t.personaRegistry.RegisterCustom(
		personaID, p.Name, p.Description, icon, color, systemPrompt, p.Suggestions,
	); err != nil {
		return &service.AgentToolResult{
			Success: false,
			Error:   fmt.Sprintf("failed to create persona: %v", err),
		}, nil
	}

	// Build response
	actionsStr := strings.Join(p.AllowedActions, ", ")
	toolsStr := strings.Join(toolFilter, ", ")
	sugCount := len(p.Suggestions)

	return &service.AgentToolResult{
		Success: true,
		Output: fmt.Sprintf(
			"AI Staff '%s' created successfully!\n"+
				"- ID: %s\n"+
				"- Allowed actions: %s\n"+
				"- Tools: %s\n"+
				"- Suggestions: %d configured\n"+
				"- Icon: %s, Color: %s\n\n"+
				"Users can now select '%s' from the AI Assistant selector to start chatting.",
			p.Name, personaID, actionsStr, toolsStr, sugCount, icon, color, p.Name,
		),
		Data: map[string]interface{}{
			"persona_id":      personaID,
			"name":            p.Name,
			"allowed_actions": p.AllowedActions,
			"tool_filter":     toolFilter,
		},
	}, nil
}
