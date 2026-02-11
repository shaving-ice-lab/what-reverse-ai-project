package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"
)

// AgentEventType Agent 事件类型
type AgentEventType string

const (
	AgentEventThought              AgentEventType = "thought"
	AgentEventToolCall             AgentEventType = "tool_call"
	AgentEventToolResult           AgentEventType = "tool_result"
	AgentEventConfirmationRequired AgentEventType = "confirmation_required"
	AgentEventMessage              AgentEventType = "message"
	AgentEventDone                 AgentEventType = "done"
	AgentEventError                AgentEventType = "error"
)

// AffectedResource 标识 Agent 操作影响的资源类型
type AffectedResource string

const (
	AffectedResourceWorkflow AffectedResource = "workflow"
	AffectedResourceDatabase AffectedResource = "database"
	AffectedResourceUISchema AffectedResource = "ui_schema"
)

// AgentEvent Agent 流式事件
type AgentEvent struct {
	Type             AgentEventType   `json:"type"`
	Step             int              `json:"step,omitempty"`
	Content          string           `json:"content,omitempty"`
	ToolName         string           `json:"tool_name,omitempty"`
	ToolArgs         json.RawMessage  `json:"tool_args,omitempty"`
	ToolResult       *AgentToolResult `json:"tool_result,omitempty"`
	ActionID         string           `json:"action_id,omitempty"`
	Error            string           `json:"error,omitempty"`
	SessionID        string           `json:"session_id,omitempty"`
	AffectedResource AffectedResource `json:"affected_resource,omitempty"`
}

// AgentEngineConfig Agent 引擎配置
type AgentEngineConfig struct {
	MaxSteps    int           `json:"max_steps"`
	StepTimeout time.Duration `json:"step_timeout"`
}

// DefaultAgentEngineConfig 默认配置
func DefaultAgentEngineConfig() AgentEngineConfig {
	return AgentEngineConfig{
		MaxSteps:    20,
		StepTimeout: 60 * time.Second,
	}
}

// AgentEngine Agent 推理引擎接口
type AgentEngine interface {
	// Run 执行 Agent 推理循环，返回事件流
	Run(ctx context.Context, workspaceID, userID, message, sessionID string) <-chan AgentEvent
	// Confirm 用户确认待确认操作
	Confirm(ctx context.Context, sessionID, actionID string, approved bool) error
	// Cancel 取消当前运行
	Cancel(ctx context.Context, sessionID string) error
}

// agentEngine ReAct 推理引擎实现
type agentEngine struct {
	registry      *AgentToolRegistry
	config        AgentEngineConfig
	sessions      *AgentSessionManager
	skillPrompt   string
	skillRegistry *SkillRegistry
}

// NewAgentEngine 创建 Agent 引擎
func NewAgentEngine(registry *AgentToolRegistry, sessions *AgentSessionManager, config AgentEngineConfig) AgentEngine {
	return &agentEngine{
		registry: registry,
		config:   config,
		sessions: sessions,
	}
}

// NewAgentEngineWithSkills 创建 Agent 引擎（含 Skills system prompt 附加内容）
func NewAgentEngineWithSkills(registry *AgentToolRegistry, sessions *AgentSessionManager, config AgentEngineConfig, skillPrompt string, skillRegistries ...*SkillRegistry) AgentEngine {
	e := &agentEngine{
		registry:    registry,
		config:      config,
		sessions:    sessions,
		skillPrompt: skillPrompt,
	}
	if len(skillRegistries) > 0 {
		e.skillRegistry = skillRegistries[0]
	}
	return e
}

// getSkillPrompt 动态构建 Skill system prompt（优先从 Registry 获取最新状态）
func (e *agentEngine) getSkillPrompt() string {
	if e.skillRegistry != nil {
		return e.skillRegistry.BuildSystemPrompt()
	}
	return e.skillPrompt
}

func (e *agentEngine) Run(ctx context.Context, workspaceID, userID, message, sessionID string) <-chan AgentEvent {
	events := make(chan AgentEvent, 32)

	go func() {
		defer close(events)

		// Get or create session
		session := e.sessions.GetOrCreate(sessionID, workspaceID, userID)
		session.Status = AgentSessionRunning
		e.sessions.Persist(sessionID)

		// Add user message
		session.AddMessage(AgentMessageEntry{
			Role:      "user",
			Content:   message,
			Timestamp: time.Now(),
		})

		// Build conversation context for LLM
		toolDefs := e.registry.ListAll()
		_ = toolDefs // Will be used when real LLM integration is added

		// ReAct Loop
		for step := 1; step <= e.config.MaxSteps; step++ {
			select {
			case <-ctx.Done():
				events <- AgentEvent{Type: AgentEventError, Error: "cancelled", SessionID: sessionID}
				session.Status = AgentSessionFailed
				return
			default:
			}

			stepCtx, cancel := context.WithTimeout(ctx, e.config.StepTimeout)

			// Step 1: Think — send context to LLM, get thought + action or final_answer
			// Currently using a simplified demo implementation
			// In production, this calls the LLM with tool definitions and conversation history
			thought, action := e.think(stepCtx, session, message, step)
			cancel()

			// Emit thought
			events <- AgentEvent{
				Type:      AgentEventThought,
				Step:      step,
				Content:   thought,
				SessionID: sessionID,
			}

			// Store tool_call metadata for proper multi-turn function calling
			assistantMeta := map[string]interface{}{"step": step, "type": "thought"}
			if action != nil {
				toolCallID := fmt.Sprintf("call_%s_%d", sessionID, step)
				assistantMeta["tool_call_id"] = toolCallID
				assistantMeta["tool_call_name"] = action.ToolName
				assistantMeta["tool_call_args"] = string(action.ToolArgs)
			}
			session.AddMessage(AgentMessageEntry{
				Role:      "assistant",
				Content:   thought,
				Timestamp: time.Now(),
				Metadata:  assistantMeta,
			})
			e.sessions.Persist(sessionID)

			// Check if this is a final answer (no tool call)
			if action == nil {
				// Final answer — the thought IS the response
				events <- AgentEvent{
					Type:      AgentEventMessage,
					Content:   thought,
					SessionID: sessionID,
				}
				events <- AgentEvent{
					Type:      AgentEventDone,
					SessionID: sessionID,
				}
				session.Status = AgentSessionCompleted
				e.sessions.Persist(sessionID)
				return
			}

			// Step 2: Act — execute tool
			toolName := action.ToolName
			toolArgs := action.ToolArgs

			// Emit tool_call event
			events <- AgentEvent{
				Type:      AgentEventToolCall,
				Step:      step,
				ToolName:  toolName,
				ToolArgs:  toolArgs,
				SessionID: sessionID,
			}

			// Check if tool requires confirmation
			tool, exists := e.registry.Get(toolName)
			if !exists {
				errMsg := fmt.Sprintf("Unknown tool: %s", toolName)
				events <- AgentEvent{
					Type:       AgentEventToolResult,
					Step:       step,
					ToolName:   toolName,
					ToolResult: &AgentToolResult{Success: false, Error: errMsg},
					SessionID:  sessionID,
				}
				session.AddMessage(AgentMessageEntry{
					Role:      "tool",
					Content:   errMsg,
					Timestamp: time.Now(),
					Metadata:  map[string]interface{}{"tool": toolName, "error": true},
				})
				continue
			}

			if tool.RequiresConfirmation() {
				actionID := fmt.Sprintf("action_%s_%d", sessionID, step)
				session.SetPendingAction(&PendingAction{
					ActionID: actionID,
					ToolName: toolName,
					ToolArgs: toolArgs,
					Step:     step,
				})
				session.Status = AgentSessionPaused
				e.sessions.Persist(sessionID)

				events <- AgentEvent{
					Type:      AgentEventConfirmationRequired,
					Step:      step,
					ToolName:  toolName,
					ToolArgs:  toolArgs,
					ActionID:  actionID,
					Content:   fmt.Sprintf("The agent wants to execute %q. Please approve or reject.", toolName),
					SessionID: sessionID,
				}
				// Pause — wait for user confirmation via Confirm()
				return
			}

			// Execute tool
			execCtx, execCancel := context.WithTimeout(ctx, e.config.StepTimeout)
			result, err := e.registry.Execute(execCtx, toolName, toolArgs)
			execCancel()

			if err != nil {
				result = &AgentToolResult{Success: false, Error: err.Error()}
			}

			// Emit tool result with affected resource
			events <- AgentEvent{
				Type:             AgentEventToolResult,
				Step:             step,
				ToolName:         toolName,
				ToolResult:       result,
				SessionID:        sessionID,
				AffectedResource: resolveAffectedResource(toolName),
			}

			// Add observation to session
			observation := result.Output
			if !result.Success {
				observation = "Error: " + result.Error
			}
			toolCallID := fmt.Sprintf("call_%s_%d", sessionID, step)
			session.AddMessage(AgentMessageEntry{
				Role:      "tool",
				Content:   observation,
				Timestamp: time.Now(),
				Metadata: map[string]interface{}{
					"tool":         toolName,
					"success":      result.Success,
					"step":         step,
					"tool_call_id": toolCallID,
				},
			})

			// Record tool call
			session.AddToolCall(AgentToolCallRecord{
				Step:      step,
				ToolName:  toolName,
				Args:      toolArgs,
				Result:    result,
				Timestamp: time.Now(),
			})
			e.sessions.Persist(sessionID)
		}

		// Max steps reached
		events <- AgentEvent{
			Type:      AgentEventError,
			Error:     fmt.Sprintf("Agent reached maximum steps (%d) without completing", e.config.MaxSteps),
			SessionID: sessionID,
		}
		session.Status = AgentSessionFailed
		e.sessions.Persist(sessionID)
	}()

	return events
}

func (e *agentEngine) Confirm(ctx context.Context, sessionID, actionID string, approved bool) error {
	session, ok := e.sessions.Get(sessionID)
	if !ok {
		return fmt.Errorf("session not found: %s", sessionID)
	}

	pending := session.GetPendingAction()
	if pending == nil || pending.ActionID != actionID {
		return fmt.Errorf("no pending action with ID %s", actionID)
	}

	session.ClearPendingAction()

	if !approved {
		session.AddMessage(AgentMessageEntry{
			Role:      "system",
			Content:   fmt.Sprintf("User rejected the %q operation.", pending.ToolName),
			Timestamp: time.Now(),
		})
		session.Status = AgentSessionCompleted
		e.sessions.Persist(sessionID)
		return nil
	}

	// Execute the confirmed tool
	result, err := e.registry.Execute(ctx, pending.ToolName, pending.ToolArgs)
	if err != nil {
		result = &AgentToolResult{Success: false, Error: err.Error()}
	}

	observation := result.Output
	if !result.Success {
		observation = "Error: " + result.Error
	}

	session.AddMessage(AgentMessageEntry{
		Role:      "tool",
		Content:   observation,
		Timestamp: time.Now(),
		Metadata: map[string]interface{}{
			"tool":      pending.ToolName,
			"success":   result.Success,
			"confirmed": true,
		},
	})

	session.AddToolCall(AgentToolCallRecord{
		Step:      pending.Step,
		ToolName:  pending.ToolName,
		Args:      pending.ToolArgs,
		Result:    result,
		Timestamp: time.Now(),
	})

	session.Status = AgentSessionCompleted
	e.sessions.Persist(sessionID)
	return nil
}

func (e *agentEngine) Cancel(ctx context.Context, sessionID string) error {
	session, ok := e.sessions.Get(sessionID)
	if !ok {
		return fmt.Errorf("session not found: %s", sessionID)
	}
	session.Status = AgentSessionFailed
	session.ClearPendingAction()
	e.sessions.Persist(sessionID)
	return nil
}

// resolveAffectedResource maps tool names to the resource type they affect
func resolveAffectedResource(toolName string) AffectedResource {
	switch toolName {
	case "create_table", "alter_table", "insert_data", "query_data":
		return AffectedResourceDatabase
	case "create_workflow", "modify_workflow", "suggest_workflow":
		return AffectedResourceWorkflow
	case "generate_ui_schema", "modify_ui_schema":
		return AffectedResourceUISchema
	default:
		return ""
	}
}

// ---- LLM Reasoning ----

type toolAction struct {
	ToolName string
	ToolArgs json.RawMessage
}

// think calls the LLM with conversation history + tool definitions (OpenAI function calling)
// Returns thought string and optional tool action. If action is nil, the thought is the final answer.
func (e *agentEngine) think(ctx context.Context, session *AgentSession, originalMessage string, step int) (string, *toolAction) {
	// Build tool definitions for function calling
	toolDefs := e.buildToolDefinitions()

	// Build conversation messages
	llmMessages := e.buildLLMMessages(session, originalMessage, step)

	// Call LLM
	thought, action, err := e.callLLM(ctx, llmMessages, toolDefs)
	if err != nil {
		return fmt.Sprintf("I encountered an error while reasoning: %v. Let me try a simpler approach.", err), nil
	}

	return thought, action
}

// buildToolDefinitions converts registered tools to OpenAI function calling format
func (e *agentEngine) buildToolDefinitions() []map[string]interface{} {
	tools := e.registry.ListAll()
	defs := make([]map[string]interface{}, 0, len(tools))
	for _, t := range tools {
		def := map[string]interface{}{
			"type": "function",
			"function": map[string]interface{}{
				"name":        t.Name,
				"description": t.Description,
				"parameters":  json.RawMessage(t.Parameters),
			},
		}
		defs = append(defs, def)
	}
	return defs
}

// buildLLMMessages constructs the prompt messages for the LLM.
// Returns []map[string]interface{} to support OpenAI function calling format
// (assistant messages with tool_calls, tool result messages with tool_call_id).
func (e *agentEngine) buildLLMMessages(session *AgentSession, originalMessage string, step int) []map[string]interface{} {
	msgs := []map[string]interface{}{
		{
			"role": "system",
			"content": `You are an AI Agent that helps users build complete web applications inside a Workspace.
You have access to tools for creating database tables, generating UI schemas, creating workflows, and more.

IMPORTANT RULES:
1. Think step by step. First gather workspace info, then plan your actions.
2. Create database tables BEFORE generating UI schemas that reference them.
3. Insert sample/seed data after creating tables when appropriate.
4. Always use the workspace_id and user_id from context when calling tools.
5. When you have completed all necessary actions, provide a clear summary as your final answer.
6. If you need to create multiple related tables, create them in dependency order (parent tables first).
7. When generating UI schemas, you MUST use the AppSchema v2.0 format described below.

You MUST respond with either:
- A tool call (function_call) to perform an action
- A plain text message as your final answer when all work is done

========== AppSchema v2.0 Format Specification ==========

When calling generate_ui_schema, the ui_schema object MUST follow this exact structure:

{
  "app_schema_version": "2.0.0",
  "app_name": "<Application Name>",
  "default_page": "<id of the default page>",
  "navigation": {
    "type": "sidebar",
    "items": [
      { "page_id": "<page_id>", "label": "<display label>", "icon": "<icon_name>" }
    ]
  },
  "pages": [
    {
      "id": "<unique_page_id>",
      "title": "<Page Title>",
      "route": "/<route_path>",
      "icon": "<icon_name>",
      "blocks": [ <block objects> ]
    }
  ]
}

Available icon names: LayoutDashboard, FileText, Users, ShoppingCart, Truck, BarChart3, Home, Mail, Calendar, Settings, Globe, Package, DollarSign, Activity, Clock, Star, Heart, Database, Zap, CheckCircle, AlertTriangle, MapPin, Phone, Building, Briefcase, Tag, BookOpen, Clipboard, PieChart, ListOrdered, MessageSquare

---------- Block Types ----------

Each block has: id, type, label (optional), config, data_source (optional), grid (optional: {col_span, row_span}).

1. stats_card — Display a single metric value
   config: { "value_key": "<column>", "label": "<title>", "format": "number|currency|percent", "color": "default|green|red|blue|amber", "icon": "<icon>" }
   data_source: { "table": "<table_name>", "aggregation": [{"function": "count|sum|avg", "column": "<col>", "alias": "<value_key>"}] }

2. data_table — Interactive data table with CRUD
   config: { "table_name": "<table>", "columns": [{"key":"<col>","label":"<header>","type":"text|number|date|boolean|badge","sortable":true}], "actions": ["create","edit","delete","view"], "filters_enabled": true, "search_enabled": true, "search_key": "<col_to_search>", "pagination": true, "page_size": 20 }
   data_source: { "table": "<table_name>", "order_by": [{"column":"<col>","direction":"DESC"}] }

3. form — Data entry form (inserts into a table or triggers a workflow)
   config: { "title": "<form heading>", "description": "<helper text>", "fields": [{"name":"<col>","label":"<label>","type":"text|number|email|textarea|select|date|checkbox","required":true,"placeholder":"...","options":[{"label":"..","value":".."}]}], "submit_label": "Submit", "table_name": "<table>", "mode": "create" }

4. chart — Data visualization
   config: { "chart_type": "bar|line|pie|area", "x_key": "<col>", "y_key": "<col>", "title": "<chart title>", "color": "#hex" }
   data_source: { "table": "<table_name>", "columns": ["<x_col>","<y_col>"], "order_by": [{"column":"<col>","direction":"ASC"}], "limit": 30 }

5. detail_view — Display a single record's fields
   config: { "fields": [{"key":"<col>","label":"<label>","type":"text|number|date|boolean"}], "table_name": "<table>", "record_id_key": "id" }

6. markdown — Static content
   config: { "content": "# Title\nMarkdown text here..." }

7. image — Display an image
   config: { "src": "<url>", "alt": "<description>", "width": "100%", "height": "auto", "object_fit": "cover|contain|fill|none", "caption": "<text>", "link": "<url>" }

8. hero — Hero/banner section with title and call-to-action
   config: { "title": "<headline>", "subtitle": "<overline>", "description": "<body text>", "align": "left|center|right", "size": "sm|md|lg", "background_color": "#hex", "text_color": "#hex", "actions": [{"label": "<text>", "href": "<url>", "variant": "primary|secondary"}] }

9. tabs_container — Tabbed container holding nested blocks
   config: { "tabs": [{"id": "<tab_id>", "label": "<Tab Label>", "blocks": [<block objects>]}], "default_tab": "<tab_id>" }

10. list — Card list from database table
    config: { "table_name": "<table>", "title_key": "<col>", "subtitle_key": "<col>", "description_key": "<col>", "image_key": "<col>", "badge_key": "<col>", "layout": "list|grid", "columns": 2, "clickable": true, "empty_message": "No items" }
    data_source: { "table": "<table_name>", "order_by": [{"column":"<col>","direction":"DESC"}], "limit": 50 }

11. divider — Visual separator
    config: { "label": "<optional text>", "style": "solid|dashed|dotted", "spacing": "sm|md|lg" }

---------- DataSource Format ----------
{
  "table": "<table_name>",
  "columns": ["col1", "col2"],
  "where": "status = 'active'",
  "order_by": [{"column": "created_at", "direction": "DESC"}],
  "limit": 100,
  "aggregation": [{"function": "count", "column": "*", "alias": "total"}]
}

---------- Example: Fleet Management System ----------
Step 1: Create tables — vehicles(id,plate_number,model,status,mileage,last_maintenance), drivers(id,name,license_no,phone,status), trips(id,vehicle_id,driver_id,origin,destination,start_time,end_time,distance,status)
Step 2: Insert sample data
Step 3: Generate UI Schema with pages:
  - Dashboard page: stats_cards (total vehicles, active drivers, trips today) + chart (trips per day)
  - Vehicles page: data_table with all vehicle columns + form to add vehicle
  - Drivers page: data_table with driver columns + form to add driver
  - Trips page: data_table with trip columns + form to create trip

========== End of AppSchema v2.0 Specification ==========

Current workspace_id: ` + session.WorkspaceID + `
Current user_id: ` + session.UserID + e.getSkillPrompt(),
		},
	}

	// Add conversation history with proper OpenAI function calling format
	history := session.GetMessages()
	for _, m := range history {
		switch m.Role {
		case "user":
			msgs = append(msgs, map[string]interface{}{
				"role":    "user",
				"content": m.Content,
			})
		case "assistant":
			msg := map[string]interface{}{
				"role":    "assistant",
				"content": m.Content,
			}
			// If this assistant message triggered a tool call, include tool_calls array
			if m.Metadata != nil {
				if tcID, ok := m.Metadata["tool_call_id"].(string); ok {
					tcName, _ := m.Metadata["tool_call_name"].(string)
					tcArgs, _ := m.Metadata["tool_call_args"].(string)
					msg["tool_calls"] = []map[string]interface{}{
						{
							"id":   tcID,
							"type": "function",
							"function": map[string]interface{}{
								"name":      tcName,
								"arguments": tcArgs,
							},
						},
					}
				}
			}
			msgs = append(msgs, msg)
		case "tool":
			// Tool result message with tool_call_id for proper function calling context
			msg := map[string]interface{}{
				"role":    "tool",
				"content": m.Content,
			}
			if m.Metadata != nil {
				if tcID, ok := m.Metadata["tool_call_id"].(string); ok {
					msg["tool_call_id"] = tcID
				}
			}
			msgs = append(msgs, msg)
		case "system":
			msgs = append(msgs, map[string]interface{}{
				"role":    "system",
				"content": m.Content,
			})
		}
	}

	return msgs
}

// llmProvider determines which LLM backend to use
type llmProvider string

const (
	llmProviderOpenAI    llmProvider = "openai"
	llmProviderHeuristic llmProvider = "heuristic"
)

// detectLLMProvider determines the LLM provider based on environment configuration
func detectLLMProvider() (llmProvider, string, string) {
	if key := getLLMAPIKey(); key != "" {
		return llmProviderOpenAI, key, getLLMModel()
	}
	return llmProviderHeuristic, "", ""
}

// callLLM sends the request to the configured LLM provider and parses the response.
// Supports: OpenAI-compatible API, heuristic fallback.
func (e *agentEngine) callLLM(ctx context.Context, messages []map[string]interface{}, tools []map[string]interface{}) (string, *toolAction, error) {
	provider, endpoint, model := detectLLMProvider()

	switch provider {
	case llmProviderOpenAI:
		return e.callOpenAI(ctx, messages, tools, endpoint, model)
	default:
		return e.thinkHeuristic(messages, tools)
	}
}

// llmChatResponse is the shared response structure for OpenAI-compatible APIs
type llmChatResponse struct {
	Choices []struct {
		Message struct {
			Content   string `json:"content"`
			ToolCalls []struct {
				Function struct {
					Name      string `json:"name"`
					Arguments string `json:"arguments"`
				} `json:"function"`
			} `json:"tool_calls"`
		} `json:"message"`
		FinishReason string `json:"finish_reason"`
	} `json:"choices"`
	// Ollama uses a top-level "message" instead of "choices"
	Message *struct {
		Content   string `json:"content"`
		ToolCalls []struct {
			Function struct {
				Name      string          `json:"name"`
				Arguments json.RawMessage `json:"arguments"`
			} `json:"function"`
		} `json:"tool_calls"`
	} `json:"message,omitempty"`
	Error struct {
		Message string `json:"message"`
	} `json:"error"`
}

// parseLLMResponse extracts thought and tool action from a unified response
func parseLLMResponse(result *llmChatResponse) (string, *toolAction, error) {
	if result.Error.Message != "" {
		return "", nil, fmt.Errorf("LLM API error: %s", result.Error.Message)
	}

	// Handle OpenAI-style response (choices[])
	if len(result.Choices) > 0 {
		choice := result.Choices[0]
		if len(choice.Message.ToolCalls) > 0 {
			tc := choice.Message.ToolCalls[0]
			thought := choice.Message.Content
			if thought == "" {
				thought = fmt.Sprintf("I'll call the %s tool to proceed.", tc.Function.Name)
			}
			return thought, &toolAction{
				ToolName: tc.Function.Name,
				ToolArgs: json.RawMessage(tc.Function.Arguments),
			}, nil
		}
		return choice.Message.Content, nil, nil
	}

	// Handle Ollama-style response (top-level "message")
	if result.Message != nil {
		if len(result.Message.ToolCalls) > 0 {
			tc := result.Message.ToolCalls[0]
			thought := result.Message.Content
			if thought == "" {
				thought = fmt.Sprintf("I'll call the %s tool to proceed.", tc.Function.Name)
			}
			// Ollama returns arguments as JSON object, not string
			argsBytes := tc.Function.Arguments
			return thought, &toolAction{
				ToolName: tc.Function.Name,
				ToolArgs: argsBytes,
			}, nil
		}
		return result.Message.Content, nil, nil
	}

	return "", nil, fmt.Errorf("no response from LLM")
}

// callOpenAI sends the request to an OpenAI-compatible API.
// Supports custom base URL via OPENAI_BASE_URL env var.
func (e *agentEngine) callOpenAI(ctx context.Context, messages []map[string]interface{}, tools []map[string]interface{}, apiKey, model string) (string, *toolAction, error) {
	reqBody := map[string]interface{}{
		"model":       model,
		"messages":    messages,
		"temperature": 0.2,
		"max_tokens":  4096,
	}
	if len(tools) > 0 {
		reqBody["tools"] = tools
		reqBody["tool_choice"] = "auto"
	}

	bodyBytes, _ := json.Marshal(reqBody)

	baseURL := getLLMBaseURL()
	endpointURL := strings.TrimRight(baseURL, "/") + "/chat/completions"

	req, err := http.NewRequestWithContext(ctx, "POST", endpointURL, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return "", nil, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{Timeout: 120 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", nil, fmt.Errorf("LLM request failed (endpoint: %s): %w", endpointURL, err)
	}
	defer resp.Body.Close()

	var result llmChatResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", nil, fmt.Errorf("failed to decode LLM response: %w", err)
	}

	return parseLLMResponse(&result)
}

// GetAgentLLMStatus returns the current LLM provider and model for status reporting
func GetAgentLLMStatus() (string, string) {
	provider, _, model := detectLLMProvider()
	switch provider {
	case llmProviderOpenAI:
		return "openai", model
	default:
		return "heuristic", "keyword-based"
	}
}

// thinkHeuristic provides multi-step intent-based tool execution when no LLM API key is configured.
// It parses user intent from keywords and executes a planned sequence of operations,
// enabling the core demo scenario (e.g., "build a fleet management system") without an external LLM.
func (e *agentEngine) thinkHeuristic(messages []map[string]interface{}, tools []map[string]interface{}) (string, *toolAction, error) {
	if len(messages) == 0 {
		return "I need more information to help you.", nil, nil
	}

	// Find the latest user message and count completed tool calls
	userMsg := ""
	completedTools := []string{}
	for i := len(messages) - 1; i >= 0; i-- {
		if msgStr(messages[i], "role") == "user" && userMsg == "" {
			userMsg = msgStr(messages[i], "content")
		}
	}
	for _, m := range messages {
		if msgStr(m, "role") == "assistant" {
			content := msgStr(m, "content")
			for _, marker := range []string{"get_workspace_info", "create_table", "insert_data", "generate_ui_schema", "create_workflow"} {
				if strings.Contains(content, marker) {
					completedTools = append(completedTools, marker)
				}
			}
		}
	}

	wsID := getFieldFromMessages(messages, "workspace_id")
	userID := getFieldFromMessages(messages, "user_id")
	msgLower := strings.ToLower(userMsg)

	// Determine the execution plan based on completed steps
	stepsDone := len(completedTools)

	// Step 0: Always gather workspace info first
	if stepsDone == 0 {
		argsJSON, _ := json.Marshal(map[string]interface{}{
			"workspace_id":      wsID,
			"user_id":           userID,
			"include_tables":    true,
			"include_workflows": true,
			"include_stats":     false,
		})
		return "Let me check your workspace's current state first.",
			&toolAction{ToolName: "get_workspace_info", ToolArgs: argsJSON}, nil
	}

	// Detect intent from keywords to determine table schemas
	tables := e.detectTablesFromIntent(msgLower)

	// If no tables detected, provide guidance
	if len(tables) == 0 {
		return fmt.Sprintf("I understand you want to build something related to: %q. "+
			"I can help you create database tables, generate UI, and build workflows. "+
			"Try describing your app more specifically, e.g., 'I want a fleet management system with vehicles, drivers, and trips'. "+
			"For full AI-powered generation, configure OPENAI_API_KEY or OLLAMA_HOST.", userMsg), nil, nil
	}

	// Step 1..N: Create tables one by one
	if stepsDone <= len(tables) {
		tableIdx := stepsDone - 1
		if tableIdx < len(tables) {
			table := tables[tableIdx]
			argsJSON, _ := json.Marshal(map[string]interface{}{
				"workspace_id": wsID,
				"user_id":      userID,
				"name":         table.Name,
				"columns":      table.Columns,
			})
			return fmt.Sprintf("Creating table %q with %d columns...", table.Name, len(table.Columns)),
				&toolAction{ToolName: "create_table", ToolArgs: argsJSON}, nil
		}
	}

	// Step N+1: Insert sample data for the first table
	sampleStep := len(tables) + 1
	if stepsDone == sampleStep {
		if len(tables) > 0 {
			sampleRows := e.generateSampleRows(tables[0])
			argsJSON, _ := json.Marshal(map[string]interface{}{
				"workspace_id": wsID,
				"user_id":      userID,
				"table":        tables[0].Name,
				"rows":         sampleRows,
			})
			return fmt.Sprintf("Inserting sample data into %q...", tables[0].Name),
				&toolAction{ToolName: "insert_data", ToolArgs: argsJSON}, nil
		}
	}

	// Step N+2: Generate UI Schema
	uiStep := len(tables) + 2
	if stepsDone == uiStep {
		pages := e.generateUIPages(tables, msgLower)
		appName := e.extractAppName(msgLower)
		// Build navigation items from pages
		navItems := make([]map[string]interface{}, 0, len(pages))
		defaultPage := ""
		for _, p := range pages {
			pid, _ := p["id"].(string)
			title, _ := p["title"].(string)
			icon, _ := p["icon"].(string)
			if defaultPage == "" {
				defaultPage = pid
			}
			navItems = append(navItems, map[string]interface{}{
				"page_id": pid,
				"label":   title,
				"icon":    icon,
			})
		}
		uiSchema := map[string]interface{}{
			"app_schema_version": "2.0.0",
			"app_name":           appName,
			"default_page":       defaultPage,
			"navigation": map[string]interface{}{
				"type":  "sidebar",
				"items": navItems,
			},
			"pages": pages,
		}
		argsJSON, _ := json.Marshal(map[string]interface{}{
			"workspace_id": wsID,
			"user_id":      userID,
			"ui_schema":    uiSchema,
		})
		return "Generating UI pages for your application...",
			&toolAction{ToolName: "generate_ui_schema", ToolArgs: argsJSON}, nil
	}

	// Step N+3: Create a basic CRUD workflow
	wfStep := len(tables) + 3
	if stepsDone == wfStep {
		wfDef := e.generateBasicWorkflow(tables, msgLower)
		argsJSON, _ := json.Marshal(map[string]interface{}{
			"workspace_id": wsID,
			"user_id":      userID,
			"name":         e.extractAppName(msgLower) + " Workflow",
			"description":  "Auto-generated workflow for " + e.extractAppName(msgLower),
			"definition":   wfDef,
		})
		return "Creating workflow for your application...",
			&toolAction{ToolName: "create_workflow", ToolArgs: argsJSON}, nil
	}

	// Final answer
	tableNames := make([]string, len(tables))
	for i, t := range tables {
		tableNames[i] = t.Name
	}
	return fmt.Sprintf("Your application has been created! Here's what was built:\n"+
		"- **%d database tables**: %s\n"+
		"- **Sample data** inserted into %q\n"+
		"- **UI pages** generated with dashboard and data management views\n"+
		"- **Workflow** created for business logic\n\n"+
		"You can view the results in the **Preview** tab, manage data in the **Database** tab, "+
		"and edit workflows in the **Agent Flow** tab.",
		len(tables), strings.Join(tableNames, ", "), tables[0].Name), nil, nil
}

// heuristicTable represents a table schema for heuristic generation
type heuristicTable struct {
	Name    string                   `json:"name"`
	Columns []map[string]interface{} `json:"columns"`
}

// detectTablesFromIntent parses user message to determine what tables to create
func (e *agentEngine) detectTablesFromIntent(msg string) []heuristicTable {
	// Fleet/vehicle management
	if containsAnyKeyword(msg, []string{"fleet", "vehicle", "车队", "车辆", "fleet management", "车队管理"}) {
		return []heuristicTable{
			{Name: "vehicles", Columns: []map[string]interface{}{
				{"name": "id", "type": "BIGINT", "primary_key": true, "auto_increment": true},
				{"name": "plate_number", "type": "VARCHAR(20)", "not_null": true, "unique": true},
				{"name": "brand", "type": "VARCHAR(50)"},
				{"name": "model", "type": "VARCHAR(50)"},
				{"name": "year", "type": "INT"},
				{"name": "status", "type": "VARCHAR(20)", "default": "'active'"},
				{"name": "mileage", "type": "DECIMAL(10,2)", "default": "0"},
				{"name": "created_at", "type": "TIMESTAMP", "default": "CURRENT_TIMESTAMP"},
			}},
			{Name: "drivers", Columns: []map[string]interface{}{
				{"name": "id", "type": "BIGINT", "primary_key": true, "auto_increment": true},
				{"name": "name", "type": "VARCHAR(100)", "not_null": true},
				{"name": "phone", "type": "VARCHAR(20)"},
				{"name": "license_number", "type": "VARCHAR(50)", "unique": true},
				{"name": "status", "type": "VARCHAR(20)", "default": "'available'"},
				{"name": "created_at", "type": "TIMESTAMP", "default": "CURRENT_TIMESTAMP"},
			}},
			{Name: "trips", Columns: []map[string]interface{}{
				{"name": "id", "type": "BIGINT", "primary_key": true, "auto_increment": true},
				{"name": "vehicle_id", "type": "BIGINT", "not_null": true},
				{"name": "driver_id", "type": "BIGINT", "not_null": true},
				{"name": "origin", "type": "VARCHAR(200)"},
				{"name": "destination", "type": "VARCHAR(200)"},
				{"name": "distance_km", "type": "DECIMAL(10,2)"},
				{"name": "status", "type": "VARCHAR(20)", "default": "'planned'"},
				{"name": "started_at", "type": "TIMESTAMP"},
				{"name": "completed_at", "type": "TIMESTAMP"},
				{"name": "created_at", "type": "TIMESTAMP", "default": "CURRENT_TIMESTAMP"},
			}},
		}
	}

	// Customer/feedback management
	if containsAnyKeyword(msg, []string{"feedback", "customer", "反馈", "客户", "survey", "调查"}) {
		return []heuristicTable{
			{Name: "customers", Columns: []map[string]interface{}{
				{"name": "id", "type": "BIGINT", "primary_key": true, "auto_increment": true},
				{"name": "name", "type": "VARCHAR(100)", "not_null": true},
				{"name": "email", "type": "VARCHAR(100)", "unique": true},
				{"name": "phone", "type": "VARCHAR(20)"},
				{"name": "created_at", "type": "TIMESTAMP", "default": "CURRENT_TIMESTAMP"},
			}},
			{Name: "feedbacks", Columns: []map[string]interface{}{
				{"name": "id", "type": "BIGINT", "primary_key": true, "auto_increment": true},
				{"name": "customer_id", "type": "BIGINT"},
				{"name": "category", "type": "VARCHAR(50)"},
				{"name": "title", "type": "VARCHAR(200)", "not_null": true},
				{"name": "content", "type": "TEXT"},
				{"name": "rating", "type": "INT"},
				{"name": "status", "type": "VARCHAR(20)", "default": "'pending'"},
				{"name": "created_at", "type": "TIMESTAMP", "default": "CURRENT_TIMESTAMP"},
			}},
			{Name: "responses", Columns: []map[string]interface{}{
				{"name": "id", "type": "BIGINT", "primary_key": true, "auto_increment": true},
				{"name": "feedback_id", "type": "BIGINT", "not_null": true},
				{"name": "responder_name", "type": "VARCHAR(100)"},
				{"name": "content", "type": "TEXT"},
				{"name": "created_at", "type": "TIMESTAMP", "default": "CURRENT_TIMESTAMP"},
			}},
		}
	}

	// Order/inventory/product management
	if containsAnyKeyword(msg, []string{"order", "inventory", "product", "订单", "库存", "商品", "ecommerce", "电商", "shop", "商店"}) {
		return []heuristicTable{
			{Name: "products", Columns: []map[string]interface{}{
				{"name": "id", "type": "BIGINT", "primary_key": true, "auto_increment": true},
				{"name": "name", "type": "VARCHAR(200)", "not_null": true},
				{"name": "sku", "type": "VARCHAR(50)", "unique": true},
				{"name": "price", "type": "DECIMAL(10,2)", "not_null": true},
				{"name": "stock", "type": "INT", "default": "0"},
				{"name": "category", "type": "VARCHAR(50)"},
				{"name": "status", "type": "VARCHAR(20)", "default": "'active'"},
				{"name": "created_at", "type": "TIMESTAMP", "default": "CURRENT_TIMESTAMP"},
			}},
			{Name: "orders", Columns: []map[string]interface{}{
				{"name": "id", "type": "BIGINT", "primary_key": true, "auto_increment": true},
				{"name": "customer_name", "type": "VARCHAR(100)", "not_null": true},
				{"name": "customer_email", "type": "VARCHAR(100)"},
				{"name": "total_amount", "type": "DECIMAL(10,2)"},
				{"name": "status", "type": "VARCHAR(20)", "default": "'pending'"},
				{"name": "created_at", "type": "TIMESTAMP", "default": "CURRENT_TIMESTAMP"},
			}},
			{Name: "order_items", Columns: []map[string]interface{}{
				{"name": "id", "type": "BIGINT", "primary_key": true, "auto_increment": true},
				{"name": "order_id", "type": "BIGINT", "not_null": true},
				{"name": "product_id", "type": "BIGINT", "not_null": true},
				{"name": "quantity", "type": "INT", "not_null": true},
				{"name": "unit_price", "type": "DECIMAL(10,2)", "not_null": true},
			}},
		}
	}

	// Task/project management
	if containsAnyKeyword(msg, []string{"task", "project", "todo", "任务", "项目", "待办"}) {
		return []heuristicTable{
			{Name: "projects", Columns: []map[string]interface{}{
				{"name": "id", "type": "BIGINT", "primary_key": true, "auto_increment": true},
				{"name": "name", "type": "VARCHAR(200)", "not_null": true},
				{"name": "description", "type": "TEXT"},
				{"name": "status", "type": "VARCHAR(20)", "default": "'active'"},
				{"name": "start_date", "type": "DATE"},
				{"name": "end_date", "type": "DATE"},
				{"name": "created_at", "type": "TIMESTAMP", "default": "CURRENT_TIMESTAMP"},
			}},
			{Name: "tasks", Columns: []map[string]interface{}{
				{"name": "id", "type": "BIGINT", "primary_key": true, "auto_increment": true},
				{"name": "project_id", "type": "BIGINT", "not_null": true},
				{"name": "title", "type": "VARCHAR(200)", "not_null": true},
				{"name": "description", "type": "TEXT"},
				{"name": "assignee", "type": "VARCHAR(100)"},
				{"name": "priority", "type": "VARCHAR(20)", "default": "'medium'"},
				{"name": "status", "type": "VARCHAR(20)", "default": "'todo'"},
				{"name": "due_date", "type": "DATE"},
				{"name": "created_at", "type": "TIMESTAMP", "default": "CURRENT_TIMESTAMP"},
			}},
		}
	}

	// Generic CRUD — try to extract entity name from the message
	if containsAnyKeyword(msg, []string{"manage", "管理", "system", "系统", "app", "应用", "build", "create", "做", "建"}) {
		entityName := extractEntityName(msg)
		if entityName != "" {
			return []heuristicTable{
				{Name: entityName + "s", Columns: []map[string]interface{}{
					{"name": "id", "type": "BIGINT", "primary_key": true, "auto_increment": true},
					{"name": "name", "type": "VARCHAR(200)", "not_null": true},
					{"name": "description", "type": "TEXT"},
					{"name": "status", "type": "VARCHAR(20)", "default": "'active'"},
					{"name": "created_at", "type": "TIMESTAMP", "default": "CURRENT_TIMESTAMP"},
					{"name": "updated_at", "type": "TIMESTAMP", "default": "CURRENT_TIMESTAMP"},
				}},
			}
		}
	}

	return nil
}

// generateSampleRows creates sample data for a table
func (e *agentEngine) generateSampleRows(table heuristicTable) []map[string]interface{} {
	switch table.Name {
	case "vehicles":
		return []map[string]interface{}{
			{"plate_number": "京A12345", "brand": "Toyota", "model": "Camry", "year": 2023, "status": "active", "mileage": 15000},
			{"plate_number": "京B67890", "brand": "Honda", "model": "Civic", "year": 2022, "status": "active", "mileage": 28000},
			{"plate_number": "京C11111", "brand": "Ford", "model": "Transit", "year": 2024, "status": "maintenance", "mileage": 5000},
			{"plate_number": "沪A22222", "brand": "BYD", "model": "Tang", "year": 2024, "status": "active", "mileage": 3200},
			{"plate_number": "粤B33333", "brand": "Tesla", "model": "Model 3", "year": 2023, "status": "active", "mileage": 12000},
		}
	case "customers":
		return []map[string]interface{}{
			{"name": "Alice Wang", "email": "alice@example.com", "phone": "13800001111"},
			{"name": "Bob Li", "email": "bob@example.com", "phone": "13800002222"},
			{"name": "Carol Zhang", "email": "carol@example.com", "phone": "13800003333"},
		}
	case "products":
		return []map[string]interface{}{
			{"name": "Wireless Mouse", "sku": "WM-001", "price": 29.99, "stock": 150, "category": "Electronics"},
			{"name": "USB-C Cable", "sku": "UC-002", "price": 9.99, "stock": 500, "category": "Accessories"},
			{"name": "Mechanical Keyboard", "sku": "MK-003", "price": 89.99, "stock": 75, "category": "Electronics"},
		}
	case "projects":
		return []map[string]interface{}{
			{"name": "Website Redesign", "description": "Redesign the company website", "status": "active", "start_date": "2026-01-01", "end_date": "2026-03-31"},
			{"name": "Mobile App MVP", "description": "Build the first version of mobile app", "status": "active", "start_date": "2026-02-01", "end_date": "2026-06-30"},
		}
	default:
		return []map[string]interface{}{
			{"name": "Sample Item 1", "description": "First sample record", "status": "active"},
			{"name": "Sample Item 2", "description": "Second sample record", "status": "active"},
			{"name": "Sample Item 3", "description": "Third sample record", "status": "draft"},
		}
	}
}

// generateUIPages creates UI page definitions based on detected tables
func (e *agentEngine) generateUIPages(tables []heuristicTable, msg string) []map[string]interface{} {
	statsColors := []string{"blue", "green", "amber", "red"}
	statsIcons := []string{"Database", "Users", "Package", "Activity"}

	// Dashboard page with stats cards for each table
	statsBlocks := make([]map[string]interface{}, 0, len(tables))
	for i, t := range tables {
		statsBlocks = append(statsBlocks, map[string]interface{}{
			"id":   fmt.Sprintf("stat_%s", t.Name),
			"type": "stats_card",
			"config": map[string]interface{}{
				"label":     "Total " + toTitleCase(strings.ReplaceAll(t.Name, "_", " ")),
				"value_key": "count",
				"format":    "number",
				"color":     statsColors[i%len(statsColors)],
				"icon":      statsIcons[i%len(statsIcons)],
			},
			"data_source": map[string]interface{}{
				"table":       t.Name,
				"aggregation": []map[string]interface{}{{"function": "count", "column": "*", "alias": "count"}},
			},
		})
	}

	dashBlocks := make([]map[string]interface{}, 0, len(statsBlocks)+2)
	dashBlocks = append(dashBlocks, statsBlocks...)

	// Add a chart block for the first table with a numeric column
	for _, t := range tables {
		var nameCol, numCol string
		for _, col := range t.Columns {
			cn, _ := col["name"].(string)
			if cn == "" || cn == "id" {
				continue
			}
			colType := inferColumnDisplayType(cn, col)
			if nameCol == "" && (cn == "name" || cn == "title" || cn == "label" || cn == "category") {
				nameCol = cn
			}
			if numCol == "" && colType == "number" {
				numCol = cn
			}
		}
		if nameCol != "" && numCol != "" {
			dashBlocks = append(dashBlocks, map[string]interface{}{
				"id":   fmt.Sprintf("chart_%s", t.Name),
				"type": "chart",
				"config": map[string]interface{}{
					"title":      toTitleCase(strings.ReplaceAll(t.Name, "_", " ")) + " Overview",
					"chart_type": "bar",
					"x_key":      nameCol,
					"y_key":      numCol,
					"height":     200,
					"color":      "#6366f1",
				},
				"data_source": map[string]interface{}{
					"table": t.Name,
					"limit": 10,
				},
				"grid": map[string]interface{}{"col_span": 2},
			})
			break
		}
	}

	// Add a recent items list for the first table
	if len(tables) > 0 {
		t := tables[0]
		var titleKey string
		for _, col := range t.Columns {
			cn, _ := col["name"].(string)
			if cn == "name" || cn == "title" {
				titleKey = cn
				break
			}
		}
		if titleKey == "" && len(t.Columns) > 1 {
			cn, _ := t.Columns[1]["name"].(string)
			titleKey = cn
		}
		if titleKey != "" {
			dashBlocks = append(dashBlocks, map[string]interface{}{
				"id":    "recent_items",
				"type":  "list",
				"label": "Recent " + toTitleCase(strings.ReplaceAll(t.Name, "_", " ")),
				"config": map[string]interface{}{
					"table_name": t.Name,
					"title_key":  titleKey,
					"clickable":  true,
					"layout":     "list",
				},
				"data_source": map[string]interface{}{
					"table": t.Name,
					"limit": 5,
				},
				"grid": map[string]interface{}{"col_span": 2},
			})
		}
	}

	pages := []map[string]interface{}{
		{
			"id":     "dashboard",
			"title":  "Dashboard",
			"route":  "/dashboard",
			"icon":   "LayoutDashboard",
			"blocks": dashBlocks,
		},
	}

	// CRUD pages for each table
	tableIcons := []string{"FileText", "Users", "Package", "Truck", "ShoppingCart", "Star"}
	for i, t := range tables {
		// Build column configs from table columns with auto-inferred types
		columns := make([]map[string]interface{}, 0, len(t.Columns))
		for _, col := range t.Columns {
			colName, _ := col["name"].(string)
			if colName == "" {
				continue
			}
			colType := inferColumnDisplayType(colName, col)
			entry := map[string]interface{}{
				"key":   colName,
				"label": toTitleCase(strings.ReplaceAll(colName, "_", " ")),
			}
			if colType != "" {
				entry["type"] = colType
			}
			columns = append(columns, entry)
		}

		// Build form fields from non-auto columns
		formFields := make([]map[string]interface{}, 0)
		for _, col := range t.Columns {
			colName, _ := col["name"].(string)
			if colName == "" || colName == "id" || colName == "created_at" || colName == "updated_at" || colName == "deleted_at" {
				continue
			}
			colType := inferColumnDisplayType(colName, col)
			fieldType := "text"
			switch colType {
			case "number":
				fieldType = "number"
			case "boolean":
				fieldType = "checkbox"
			case "date":
				fieldType = "date"
			}
			formFields = append(formFields, map[string]interface{}{
				"name":     colName,
				"label":    toTitleCase(strings.ReplaceAll(colName, "_", " ")),
				"type":     fieldType,
				"required": colName == "name" || colName == "title" || colName == "email",
			})
		}

		// Determine search key
		searchKey := ""
		for _, col := range t.Columns {
			cn, _ := col["name"].(string)
			if cn == "name" || cn == "title" || cn == "email" || cn == "label" || cn == "username" {
				searchKey = cn
				break
			}
		}

		tableConfig := map[string]interface{}{
			"table_name":      t.Name,
			"columns":         columns,
			"actions":         []string{"create", "edit", "delete", "view"},
			"search_enabled":  true,
			"pagination":      true,
			"filters_enabled": true,
			"page_size":       20,
		}
		if searchKey != "" {
			tableConfig["search_key"] = searchKey
		}

		blocks := []map[string]interface{}{
			{
				"id":     fmt.Sprintf("table_%s", t.Name),
				"type":   "data_table",
				"config": tableConfig,
			},
		}

		// Add a form block if there are editable fields
		if len(formFields) > 0 {
			blocks = append(blocks, map[string]interface{}{
				"id":    fmt.Sprintf("form_%s", t.Name),
				"type":  "form",
				"label": "Add " + toTitleCase(strings.ReplaceAll(t.Name, "_", " ")),
				"config": map[string]interface{}{
					"title":        "New " + toTitleCase(strings.ReplaceAll(t.Name, "_", " ")),
					"table_name":   t.Name,
					"fields":       formFields,
					"submit_label": "Create",
				},
			})
		}

		pages = append(pages, map[string]interface{}{
			"id":     t.Name,
			"title":  toTitleCase(strings.ReplaceAll(t.Name, "_", " ")),
			"route":  "/" + t.Name,
			"icon":   tableIcons[i%len(tableIcons)],
			"blocks": blocks,
		})
	}

	return pages
}

// generateBasicWorkflow creates a basic CRUD workflow definition
func (e *agentEngine) generateBasicWorkflow(tables []heuristicTable, msg string) map[string]interface{} {
	nodes := []map[string]interface{}{
		{"id": "start", "type": "start", "position": map[string]int{"x": 250, "y": 0}, "data": map[string]interface{}{"label": "Start"}},
	}
	edges := []map[string]interface{}{}

	prevNodeID := "start"
	y := 100
	for i, t := range tables {
		nodeID := fmt.Sprintf("db_query_%d", i)
		nodes = append(nodes, map[string]interface{}{
			"id":       nodeID,
			"type":     "db_query",
			"position": map[string]int{"x": 250, "y": y},
			"data": map[string]interface{}{
				"label":     "Query " + t.Name,
				"operation": "select",
				"table":     t.Name,
			},
		})
		edges = append(edges, map[string]interface{}{
			"id": fmt.Sprintf("e_%s_%s", prevNodeID, nodeID), "source": prevNodeID, "target": nodeID,
		})
		prevNodeID = nodeID
		y += 100
	}

	endNodeID := "end"
	nodes = append(nodes, map[string]interface{}{
		"id": endNodeID, "type": "end", "position": map[string]int{"x": 250, "y": y},
		"data": map[string]interface{}{"label": "End"},
	})
	edges = append(edges, map[string]interface{}{
		"id": fmt.Sprintf("e_%s_%s", prevNodeID, endNodeID), "source": prevNodeID, "target": endNodeID,
	})

	return map[string]interface{}{
		"nodes": nodes,
		"edges": edges,
	}
}

// extractAppName tries to extract an application name from the user message
func (e *agentEngine) extractAppName(msg string) string {
	patterns := map[string]string{
		"fleet":     "Fleet Management",
		"车队":        "Fleet Management",
		"vehicle":   "Vehicle Management",
		"feedback":  "Feedback System",
		"反馈":        "Feedback System",
		"order":     "Order Management",
		"订单":        "Order Management",
		"product":   "Product Management",
		"商品":        "Product Management",
		"inventory": "Inventory System",
		"库存":        "Inventory System",
		"task":      "Task Management",
		"任务":        "Task Management",
		"project":   "Project Management",
		"项目":        "Project Management",
		"customer":  "Customer Management",
		"客户":        "Customer Management",
	}
	for keyword, name := range patterns {
		if strings.Contains(msg, keyword) {
			return name
		}
	}
	return "My Application"
}

// containsAnyKeyword checks if s contains any of the keywords
func containsAnyKeyword(s string, keywords []string) bool {
	for _, k := range keywords {
		if strings.Contains(s, k) {
			return true
		}
	}
	return false
}

// inferColumnDisplayType infers the frontend display type for a data_table column
func inferColumnDisplayType(colName string, col map[string]interface{}) string {
	nameLower := strings.ToLower(colName)
	sqlType := strings.ToUpper(fmt.Sprintf("%v", col["type"]))

	// Date columns
	if strings.HasSuffix(nameLower, "_at") || strings.HasSuffix(nameLower, "_date") ||
		nameLower == "created" || nameLower == "updated" || nameLower == "date" ||
		strings.Contains(sqlType, "TIMESTAMP") || strings.Contains(sqlType, "DATE") {
		return "date"
	}

	// Boolean columns
	if strings.HasPrefix(nameLower, "is_") || strings.HasPrefix(nameLower, "has_") ||
		nameLower == "active" || nameLower == "enabled" || nameLower == "verified" ||
		strings.Contains(sqlType, "BOOL") {
		return "boolean"
	}

	// Badge/status columns
	if nameLower == "status" || nameLower == "state" || nameLower == "role" ||
		nameLower == "priority" || nameLower == "type" || nameLower == "category" {
		return "badge"
	}

	// Number columns
	if strings.Contains(sqlType, "INT") || strings.Contains(sqlType, "DECIMAL") ||
		strings.Contains(sqlType, "FLOAT") || strings.Contains(sqlType, "DOUBLE") ||
		strings.Contains(sqlType, "NUMERIC") ||
		nameLower == "price" || nameLower == "amount" || nameLower == "quantity" ||
		nameLower == "count" || nameLower == "total" || nameLower == "mileage" ||
		nameLower == "distance" || nameLower == "weight" || nameLower == "age" ||
		nameLower == "score" || nameLower == "rating" || nameLower == "cost" ||
		strings.HasSuffix(nameLower, "_count") || strings.HasSuffix(nameLower, "_total") ||
		strings.HasSuffix(nameLower, "_amount") || strings.HasSuffix(nameLower, "_price") ||
		strings.HasSuffix(nameLower, "_qty") || strings.HasSuffix(nameLower, "_size") ||
		strings.HasSuffix(nameLower, "_score") || strings.HasSuffix(nameLower, "_rate") {
		return "number"
	}

	return ""
}

// toTitleCase capitalizes the first letter of each word (replacement for deprecated strings.Title)
func toTitleCase(s string) string {
	words := strings.Fields(s)
	for i, w := range words {
		if len(w) > 0 {
			words[i] = strings.ToUpper(w[:1]) + w[1:]
		}
	}
	return strings.Join(words, " ")
}

// extractEntityName tries to extract a noun/entity name for generic CRUD
func extractEntityName(msg string) string {
	// Remove common verbs and noise words
	noise := []string{"i want", "i need", "please", "help me", "build", "create", "make",
		"a", "an", "the", "to", "for", "with", "management", "system", "app",
		"我想", "我要", "帮我", "做一个", "建一个", "管理", "系统", "应用"}
	result := msg
	for _, n := range noise {
		result = strings.ReplaceAll(result, n, " ")
	}
	result = strings.TrimSpace(result)
	words := strings.Fields(result)
	if len(words) > 0 {
		// Take the first meaningful word
		w := strings.ToLower(words[0])
		if len(w) > 2 {
			return w
		}
	}
	return ""
}

// msgStr safely extracts a string value from a map[string]interface{}
func msgStr(m map[string]interface{}, key string) string {
	if v, ok := m[key]; ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return ""
}

// getFieldFromMessages extracts workspace_id or user_id from the system message
func getFieldFromMessages(messages []map[string]interface{}, field string) string {
	for _, m := range messages {
		if msgStr(m, "role") == "system" {
			content := msgStr(m, "content")
			prefix := field + ": "
			idx := strings.Index(content, prefix)
			if idx >= 0 {
				val := content[idx+len(prefix):]
				end := strings.IndexAny(val, "\n ")
				if end < 0 {
					return val
				}
				return val[:end]
			}
		}
	}
	return ""
}

// getLLMBaseURL returns the base URL for OpenAI-compatible API
func getLLMBaseURL() string {
	if url := os.Getenv("OPENAI_BASE_URL"); url != "" {
		return url
	}
	if url := os.Getenv("LLM_BASE_URL"); url != "" {
		return url
	}
	return "https://api.openai.com/v1"
}

// getLLMAPIKey returns the OpenAI API key from environment or config
func getLLMAPIKey() string {
	if key := os.Getenv("OPENAI_API_KEY"); key != "" {
		return key
	}
	if key := os.Getenv("AI_OPENAI_API_KEY"); key != "" {
		return key
	}
	return ""
}

// getLLMModel returns the model to use for Agent reasoning
func getLLMModel() string {
	if model := os.Getenv("AGENT_LLM_MODEL"); model != "" {
		return model
	}
	if model := os.Getenv("OPENAI_MODEL"); model != "" {
		return model
	}
	return "gpt-4o"
}
