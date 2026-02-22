package agent_tools

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/reverseai/server/internal/service"
)

// TaskTool spawns a sub-agent session with restricted tools (mirrors OpenCode's task.ts).
// The parent agent delegates specific work to specialized sub-agents.
type TaskTool struct {
	engine          service.AgentEngine
	sessions        *service.AgentSessionManager
	personaRegistry *service.PersonaRegistry
}

func NewTaskTool(engine service.AgentEngine, sessions *service.AgentSessionManager, personaRegistry *service.PersonaRegistry) *TaskTool {
	return &TaskTool{engine: engine, sessions: sessions, personaRegistry: personaRegistry}
}

func (t *TaskTool) Name() string { return "task" }

func (t *TaskTool) Description() string {
	return `Launch a specialized sub-agent to handle a specific task autonomously. Use this for complex multi-domain work where different expertise is needed.

Available sub-agent types:
- data_modeler: Database schema design, table creation, seed data (tools: create_table, alter_table, insert_data, query_data, get_workspace_info)
- ui_designer: UI schema generation, page layout, component design (tools: get_ui_schema, generate_ui_schema, modify_ui_schema, get_block_spec, deploy_component)
- logic_developer: Backend API routes, business logic (tools: deploy_logic, get_logic, query_data, get_workspace_info)

When to use:
- Building a full app → delegate data modeling first, then UI design, then logic
- Complex schema changes → delegate to data_modeler
- Page redesign → delegate to ui_designer

Each delegation prompt MUST include: TASK (what to do), EXPECTED OUTCOME (deliverables), CONTEXT (workspace state, existing tables/pages).
The sub-agent will return a summary of completed work.`
}

func (t *TaskTool) Parameters() json.RawMessage {
	return json.RawMessage(`{
		"type": "object",
		"properties": {
			"description": {"type": "string", "description": "Short 3-5 word summary of the task"},
			"prompt": {"type": "string", "description": "Detailed task description with TASK, EXPECTED OUTCOME, and CONTEXT sections"},
			"subagent_type": {"type": "string", "enum": ["data_modeler", "ui_designer", "logic_developer"], "description": "Type of specialized sub-agent to use"}
		},
		"required": ["description", "prompt", "subagent_type"]
	}`)
}

func (t *TaskTool) RequiresConfirmation() bool { return false }

type taskParams struct {
	Description  string `json:"description"`
	Prompt       string `json:"prompt"`
	SubagentType string `json:"subagent_type"`
}

// subAgentPersonas maps sub-agent types to their system prompts and tool filters
var subAgentPersonas = map[string]struct {
	SystemPrompt string
	ToolFilter   []string
}{
	"data_modeler": {
		SystemPrompt: `You are a **Data Modeling** specialist sub-agent. Your job is to design and create database tables based on the task description.

Rules:
1. Create tables in dependency order (parent tables first)
2. Use appropriate column types (TEXT, INTEGER, REAL, BLOB for SQLite)
3. Always include id, created_at columns
4. Insert meaningful sample data after creating tables
5. Verify your work by calling get_workspace_info after changes
6. Report what you created in your final answer`,
		ToolFilter: []string{"create_table", "alter_table", "delete_table", "insert_data", "query_data", "get_workspace_info"},
	},
	"ui_designer": {
		SystemPrompt: `You are a **UI Design** specialist sub-agent. Your job is to generate or modify UI schemas for application pages.

Rules:
1. Always call get_ui_schema first to understand current state
2. Use get_block_spec to look up block configurations before generating
3. Follow AppSchema v2.0 format strictly
4. Ensure all data_source.table references point to existing tables
5. Create intuitive navigation with proper icons
6. Report what pages/blocks you created in your final answer`,
		ToolFilter: []string{"get_ui_schema", "generate_ui_schema", "modify_ui_schema", "get_block_spec", "deploy_component", "get_workspace_info"},
	},
	"logic_developer": {
		SystemPrompt: `You are a **Business Logic** specialist sub-agent. Your job is to develop backend API routes and business logic.

Rules:
1. Query existing tables to understand the data model before writing logic
2. Use db.query, db.queryOne, db.insert, db.update, db.delete in route handlers
3. Follow RESTful conventions (GET for reads, POST for creates, PUT for updates, DELETE for deletes)
4. Include error handling in all routes
5. Report what API routes you created in your final answer`,
		ToolFilter: []string{"deploy_logic", "get_logic", "query_data", "get_workspace_info"},
	},
}

func (t *TaskTool) Execute(ctx context.Context, params json.RawMessage) (*service.AgentToolResult, error) {
	var p taskParams
	if err := json.Unmarshal(params, &p); err != nil {
		return &service.AgentToolResult{Success: false, Error: "invalid parameters: " + err.Error()}, nil
	}

	if p.Description == "" || p.Prompt == "" {
		return &service.AgentToolResult{Success: false, Error: "description and prompt are required"}, nil
	}

	subPersonaDef, ok := subAgentPersonas[p.SubagentType]
	if !ok {
		return &service.AgentToolResult{
			Success: false,
			Error:   fmt.Sprintf("unknown subagent_type %q. Available: data_modeler, ui_designer, logic_developer", p.SubagentType),
		}, nil
	}

	// Extract workspace_id and user_id from the TaskContext set by the engine
	tc := service.GetTaskContext(ctx)
	if tc == nil {
		return &service.AgentToolResult{
			Success: false,
			Error:   "workspace_id and user_id not available in context. Task tool requires parent agent context.",
		}, nil
	}

	// Register a temporary persona with the sub-agent's ToolFilter so tools are restricted
	subPersonaID := fmt.Sprintf("_subagent_%s_%d", p.SubagentType, time.Now().UnixMilli())
	if t.personaRegistry != nil {
		t.personaRegistry.Register(&service.Persona{
			ID:           subPersonaID,
			Name:         p.SubagentType + " sub-agent",
			Description:  p.Description,
			SystemPrompt: subPersonaDef.SystemPrompt,
			ToolFilter:   subPersonaDef.ToolFilter,
			Enabled:      true,
		})
		// Cleanup after execution
		defer t.personaRegistry.Unregister(subPersonaID)
	}

	// Create a sub-agent session
	subSessionID := fmt.Sprintf("sub_%s_%d", p.SubagentType, time.Now().UnixMilli())

	// Build the sub-agent prompt with context
	fullPrompt := fmt.Sprintf("--- TASK ---\n%s\n\nCONTEXT: workspace_id=%s, user_id=%s",
		p.Prompt, tc.WorkspaceID, tc.UserID)

	// Run the sub-agent synchronously with a timeout
	subCtx, cancel := context.WithTimeout(ctx, 5*time.Minute)
	defer cancel()

	personaIDToUse := subPersonaID
	if t.personaRegistry == nil {
		personaIDToUse = ""
	}
	eventsCh := t.engine.Run(subCtx, tc.WorkspaceID, tc.UserID, fullPrompt, subSessionID, personaIDToUse)

	// Collect events until done
	var lastMessage string
	var toolCallCount int
	for event := range eventsCh {
		switch event.Type {
		case service.AgentEventMessage:
			lastMessage = event.Content
		case service.AgentEventToolCall:
			toolCallCount++
		case service.AgentEventError:
			if lastMessage == "" {
				lastMessage = "Sub-agent encountered an error: " + event.Error
			}
		}
	}

	if lastMessage == "" {
		lastMessage = "Sub-agent completed without producing a final message."
	}

	return &service.AgentToolResult{
		Success: true,
		Output:  fmt.Sprintf("[%s sub-agent] %s\n\n(Executed %d tool calls)", p.SubagentType, lastMessage, toolCallCount),
		Data: map[string]interface{}{
			"subagent_type":  p.SubagentType,
			"description":    p.Description,
			"tool_calls":     toolCallCount,
			"sub_session_id": subSessionID,
		},
	}, nil
}
