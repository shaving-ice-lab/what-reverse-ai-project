package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"sync"
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
	AffectedResourceDatabase AffectedResource = "database"
	AffectedResourceUISchema AffectedResource = "ui_schema"
	AffectedResourcePersona  AffectedResource = "persona"
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
	// LLM config from config.yaml (ai section) — overridden by workspace-level settings or env vars
	LLMAPIKey  string `json:"llm_api_key"`
	LLMBaseURL string `json:"llm_base_url"`
	LLMModel   string `json:"llm_model"`
}

// DefaultAgentEngineConfig 默认配置
func DefaultAgentEngineConfig() AgentEngineConfig {
	return AgentEngineConfig{
		MaxSteps:    75,
		StepTimeout: 60 * time.Second,
	}
}

// AgentEngine Agent 推理引擎接口
type AgentEngine interface {
	// Run 执行 Agent 推理循环，返回事件流
	Run(ctx context.Context, workspaceID, userID, message, sessionID, personaID string) <-chan AgentEvent
	// Confirm 用户确认待确认操作
	Confirm(ctx context.Context, sessionID, actionID string, approved bool) error
	// Cancel 取消当前运行
	Cancel(ctx context.Context, sessionID string) error
}

// agentEngine ReAct 推理引擎实现
type agentEngine struct {
	registry        *AgentToolRegistry
	config          AgentEngineConfig
	sessions        *AgentSessionManager
	skillPrompt     string
	skillRegistry   *SkillRegistry
	personaRegistry *PersonaRegistry
}

// NewAgentEngineWithSkills 创建 Agent 引擎（含 Skills system prompt 附加内容）
func NewAgentEngineWithSkills(registry *AgentToolRegistry, sessions *AgentSessionManager, config AgentEngineConfig, skillPrompt string, personaRegistry *PersonaRegistry, skillRegistries ...*SkillRegistry) AgentEngine {
	e := &agentEngine{
		registry:        registry,
		config:          config,
		sessions:        sessions,
		skillPrompt:     skillPrompt,
		personaRegistry: personaRegistry,
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

// resolvePersona 解析 Persona，返回 nil 表示使用默认（Web Creator）
func (e *agentEngine) resolvePersona(personaID string) *Persona {
	if personaID == "" || e.personaRegistry == nil {
		return nil
	}
	p, ok := e.personaRegistry.Get(personaID)
	if !ok || !p.Enabled {
		return nil
	}
	return p
}

// planningPhaseTools defines the only tools available during the planning phase
var planningPhaseTools = map[string]bool{
	"get_workspace_info": true,
	"get_ui_schema":      true,
	"create_plan":        true,
	"query_data":         true,
}

// thinkWithPersona calls the LLM with persona-specific system prompt and tool filter.
// Returns thought text and zero or more tool actions (parallel tool calls).
func (e *agentEngine) thinkWithPersona(ctx context.Context, session *AgentSession, originalMessage string, step int, persona *Persona) (string, []toolAction) {
	toolDefs := e.buildToolDefinitionsForPersona(persona, session)
	llmMessages := e.buildLLMMessagesForPersona(session, originalMessage, step, persona)

	thought, actions, err := e.callLLM(ctx, llmMessages, toolDefs)
	if err != nil {
		return fmt.Sprintf("I encountered an error while reasoning: %v. Let me try a simpler approach.", err), nil
	}

	return thought, actions
}

// buildToolDefinitionsForPersona converts registered tools to OpenAI function calling format,
// filtered by persona AND session phase.
func (e *agentEngine) buildToolDefinitionsForPersona(persona *Persona, session *AgentSession) []map[string]interface{} {
	tools := e.registry.ListAll()
	defs := make([]map[string]interface{}, 0, len(tools))

	// Build allowed tools set from persona
	var personaAllowed map[string]bool
	if persona != nil && len(persona.ToolFilter) > 0 {
		personaAllowed = make(map[string]bool, len(persona.ToolFilter))
		for _, name := range persona.ToolFilter {
			personaAllowed[name] = true
		}
	}

	// Phase-based tool restriction
	var phaseAllowed map[string]bool
	if session != nil && session.GetPhase() == SessionPhasePlanning {
		phaseAllowed = planningPhaseTools
	}

	for _, t := range tools {
		if personaAllowed != nil && !personaAllowed[t.Name] {
			continue
		}
		if phaseAllowed != nil && !phaseAllowed[t.Name] {
			continue
		}
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

func (e *agentEngine) Run(ctx context.Context, workspaceID, userID, message, sessionID, personaID string) <-chan AgentEvent {
	events := make(chan AgentEvent, 32)

	go func() {
		defer close(events)

		// Get or create session
		session := e.sessions.GetOrCreate(sessionID, workspaceID, userID, personaID)
		session.Status = AgentSessionRunning
		e.sessions.Persist(sessionID)

		// Resolve persona for this session
		persona := e.resolvePersona(session.PersonaID)

		// Classify first message complexity in planning phase (runs only once per session)
		if session.GetPhase() == SessionPhasePlanning && session.GetComplexityHint() == "" {
			hint := ClassifyRequestComplexity(message)
			session.SetComplexityHint(hint)
			e.sessions.Persist(sessionID)
		}

		// Handle phase transitions:
		// If phase is "confirmed" (user just approved the plan), transition to "executing"
		if session.GetPhase() == SessionPhaseConfirmed {
			session.SetPhase(SessionPhaseExecuting)
			if plan := session.GetPlan(); plan != nil {
				plan.Status = "in_progress"
				session.SetPlan(plan)
			}
			e.sessions.Persist(sessionID)
		}

		// Add user message
		session.AddMessage(AgentMessageEntry{
			Role:      "user",
			Content:   message,
			Timestamp: time.Now(),
		})

		// Attach TaskContext so tools (e.g. task) can access workspace/user identity
		ctx = WithTaskContext(ctx, &TaskContext{WorkspaceID: workspaceID, UserID: userID})
		// Attach SessionContext so tools (e.g. plan) can access current session
		ctx = WithSessionContext(ctx, &SessionContext{SessionID: sessionID})
		// Attach PersonaContext so tools (e.g. batch) can enforce ToolFilter
		if persona != nil && len(persona.ToolFilter) > 0 {
			ctx = WithPersonaContext(ctx, &PersonaContext{ToolFilter: persona.ToolFilter})
		}

		// ReAct Loop — supports parallel tool calls
		for step := 1; step <= e.config.MaxSteps; step++ {
			select {
			case <-ctx.Done():
				events <- AgentEvent{Type: AgentEventError, Error: "cancelled", SessionID: sessionID}
				session.Status = AgentSessionFailed
				return
			default:
			}

			// Compact messages if threshold exceeded (Phase 4.1)
			e.compactSessionMessages(ctx, session, sessionID)

			stepCtx, cancel := context.WithTimeout(ctx, e.config.StepTimeout)

			// Step 1: Think — send context to LLM, get thought + actions (may be parallel)
			thought, actions := e.thinkWithPersona(stepCtx, session, message, step, persona)
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
			if len(actions) > 0 {
				// Resolve tool call IDs: use real IDs from LLM, or fabricate
				for i := range actions {
					if actions[i].ToolCallID == "" {
						sid := sessionID
						if len(sid) > 8 {
							sid = sid[:8]
						}
						actions[i].ToolCallID = fmt.Sprintf("call_%s_%d_%d", sid, step, i)
					}
				}
				// Store all tool calls in metadata for OpenAI multi-turn format
				tcMetas := make([]map[string]interface{}, 0, len(actions))
				for _, a := range actions {
					tcMetas = append(tcMetas, map[string]interface{}{
						"tool_call_id":   a.ToolCallID,
						"tool_call_name": a.ToolName,
						"tool_call_args": string(a.ToolArgs),
					})
				}
				assistantMeta["tool_calls"] = tcMetas
				// Keep first tool_call_id for backward compatibility
				assistantMeta["tool_call_id"] = tcMetas[0]["tool_call_id"]
				assistantMeta["tool_call_name"] = tcMetas[0]["tool_call_name"]
				assistantMeta["tool_call_args"] = tcMetas[0]["tool_call_args"]
			}
			session.AddMessage(AgentMessageEntry{
				Role:      "assistant",
				Content:   thought,
				Timestamp: time.Now(),
				Metadata:  assistantMeta,
			})
			e.sessions.Persist(sessionID)

			// Check if this is a final answer (no tool calls)
			if len(actions) == 0 {
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

			// Step 2: Act — execute tool(s)
			// Pre-validate all actions and emit tool_call events
			type validatedAction struct {
				action     toolAction
				tool       AgentTool
				skipReason string // non-empty = skip execution
			}
			validated := make([]validatedAction, len(actions))
			hasConfirmation := false

			for i, action := range actions {
				toolName := action.ToolName
				toolCallID := action.ToolCallID

				// Emit tool_call event for every action
				events <- AgentEvent{
					Type:      AgentEventToolCall,
					Step:      step,
					ToolName:  toolName,
					ToolArgs:  action.ToolArgs,
					SessionID: sessionID,
				}

				// Check persona tool filter
				if persona != nil && len(persona.ToolFilter) > 0 {
					allowed := false
					for _, t := range persona.ToolFilter {
						if t == toolName {
							allowed = true
							break
						}
					}
					if !allowed {
						errMsg := fmt.Sprintf("Tool %q is not available for the %s persona", toolName, persona.Name)
						validated[i] = validatedAction{action: action, skipReason: errMsg}
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
							Metadata:  map[string]interface{}{"tool": toolName, "error": true, "reason": "persona_filter", "tool_call_id": toolCallID},
						})
						continue
					}
				}

				// Check if tool exists
				tool, exists := e.registry.Get(toolName)
				if !exists {
					errMsg := fmt.Sprintf("Unknown tool: %s", toolName)
					validated[i] = validatedAction{action: action, skipReason: errMsg}
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
						Metadata:  map[string]interface{}{"tool": toolName, "error": true, "tool_call_id": toolCallID},
					})
					continue
				}

				// Check if tool requires confirmation — pause entire step
				if tool.RequiresConfirmation() && !hasConfirmation {
					hasConfirmation = true
					actionID := fmt.Sprintf("action_%s_%d", sessionID, step)
					session.SetPendingAction(&PendingAction{
						ActionID: actionID,
						ToolName: toolName,
						ToolArgs: action.ToolArgs,
						Step:     step,
					})
					session.Status = AgentSessionPaused
					e.sessions.Persist(sessionID)
					events <- AgentEvent{
						Type:      AgentEventConfirmationRequired,
						Step:      step,
						ToolName:  toolName,
						ToolArgs:  action.ToolArgs,
						ActionID:  actionID,
						Content:   fmt.Sprintf("The agent wants to execute %q. Please approve or reject.", toolName),
						SessionID: sessionID,
					}
					return
				}

				validated[i] = validatedAction{action: action, tool: tool}
			}

			// Execute validated actions — concurrent when multiple, sequential when single
			type toolExecResult struct {
				index  int
				result *AgentToolResult
			}

			if len(validated) == 1 || !e.canRunConcurrently(validated) {
				// Sequential execution (single action or has dependencies)
				for _, va := range validated {
					if va.skipReason != "" {
						continue
					}
					execCtx, execCancel := context.WithTimeout(ctx, e.config.StepTimeout)
					result, err := e.registry.Execute(execCtx, va.action.ToolName, va.action.ToolArgs)
					execCancel()
					if err != nil {
						result = &AgentToolResult{Success: false, Error: err.Error()}
					}
					e.emitToolResult(events, session, sessionID, step, va.action, result)
				}
			} else {
				// Concurrent execution with sync.WaitGroup (plan requirement 2.1)
				results := make([]toolExecResult, len(validated))
				var wg sync.WaitGroup
				for i, va := range validated {
					if va.skipReason != "" {
						continue
					}
					wg.Add(1)
					go func(idx int, a toolAction) {
						defer wg.Done()
						execCtx, execCancel := context.WithTimeout(ctx, e.config.StepTimeout)
						result, err := e.registry.Execute(execCtx, a.ToolName, a.ToolArgs)
						execCancel()
						if err != nil {
							result = &AgentToolResult{Success: false, Error: err.Error()}
						}
						results[idx] = toolExecResult{index: idx, result: result}
					}(i, va.action)
				}
				wg.Wait()

				// Emit results in order (preserves deterministic event stream)
				for i, va := range validated {
					if va.skipReason != "" || results[i].result == nil {
						continue
					}
					e.emitToolResult(events, session, sessionID, step, va.action, results[i].result)
				}
			}
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

// emitToolResult sends tool result event, adds observation to session, and records the tool call
func (e *agentEngine) emitToolResult(events chan<- AgentEvent, session *AgentSession, sessionID string, step int, action toolAction, result *AgentToolResult) {
	events <- AgentEvent{
		Type:             AgentEventToolResult,
		Step:             step,
		ToolName:         action.ToolName,
		ToolResult:       result,
		SessionID:        sessionID,
		AffectedResource: resolveAffectedResource(action.ToolName),
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
			"tool":         action.ToolName,
			"success":      result.Success,
			"step":         step,
			"tool_call_id": action.ToolCallID,
		},
	})
	session.AddToolCall(AgentToolCallRecord{
		Step:      step,
		ToolName:  action.ToolName,
		Args:      action.ToolArgs,
		Result:    result,
		Timestamp: time.Now(),
	})
}

// canRunConcurrently returns true when multiple validated actions can safely run in parallel.
// Currently always true because the caller already filters single-action and confirmation cases.
// Future: add dependency analysis (e.g., same table name in create_table + insert_data).
func (e *agentEngine) canRunConcurrently(_ interface{}) bool {
	return true
}

// resolveAffectedResource maps tool names to the resource type they affect
func resolveAffectedResource(toolName string) AffectedResource {
	switch toolName {
	case "create_table", "alter_table", "delete_table", "insert_data", "update_data", "delete_data":
		return AffectedResourceDatabase
	case "generate_ui_schema", "modify_ui_schema", "attempt_completion":
		return AffectedResourceUISchema
	case "create_persona":
		return AffectedResourcePersona
	default:
		return ""
	}
}

// ---- LLM Reasoning ----

type toolAction struct {
	ToolCallID string // ID from LLM response (e.g. "call_abc123"), or fabricated
	ToolName   string
	ToolArgs   json.RawMessage
}

// getPersonaSystemPrompt builds the full system prompt for a persona.
// - Web Creator → uses modular BuildWebCreatorPrompt (dynamic prompt builder)
// - Other personas with a non-empty SystemPrompt → uses their own prompt
// - Fallback for unknown/empty → generic assistant prompt (never leaks Web Creator capabilities)
func (e *agentEngine) getPersonaSystemPrompt(persona *Persona, session *AgentSession) string {
	var basePrompt string
	switch {
	case persona != nil && persona.SystemPrompt != "":
		basePrompt = persona.SystemPrompt
	case persona != nil && persona.ID == "web_creator":
		// Dynamic modular prompt built from sections (mirrors Kilocode/Oh-My-OpenCode pattern)
		toolMetas := BuildToolMetaFromRegistry(e.registry)
		return BuildWebCreatorPrompt(toolMetas, session) + e.getSkillPrompt()
	case persona == nil:
		// No persona selected at all → default to Web Creator for backward compatibility
		toolMetas := BuildToolMetaFromRegistry(e.registry)
		return BuildWebCreatorPrompt(toolMetas, session) + e.getSkillPrompt()
	default:
		// Custom persona with empty SystemPrompt — use a safe generic prompt
		basePrompt = "You are an AI assistant named \"" + persona.Name + "\". " + persona.Description + "\nUse the available tools to help the user. Always be helpful and concise."
	}
	// Append workspace context and skill prompt
	return basePrompt + "\n\nCurrent workspace_id: " + session.WorkspaceID + "\nCurrent user_id: " + session.UserID + e.getSkillPrompt()
}

// buildLLMMessagesForPersona constructs the prompt messages for the LLM with persona-specific system prompt.
func (e *agentEngine) buildLLMMessagesForPersona(session *AgentSession, originalMessage string, step int, persona *Persona) []map[string]interface{} {
	systemPrompt := e.getPersonaSystemPrompt(persona, session)

	msgs := []map[string]interface{}{
		{
			"role":    "system",
			"content": systemPrompt,
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
			if m.Metadata != nil {
				// Reconstruct ALL tool calls for proper OpenAI multi-turn format.
				// Must handle both in-memory ([]map[string]interface{}) and
				// JSON-deserialized ([]interface{}) types — they differ after DB round-trip.
				var toolCalls []map[string]interface{}
				switch v := m.Metadata["tool_calls"].(type) {
				case []map[string]interface{}:
					for _, tc := range v {
						tcID, _ := tc["tool_call_id"].(string)
						tcName, _ := tc["tool_call_name"].(string)
						tcArgs, _ := tc["tool_call_args"].(string)
						toolCalls = append(toolCalls, map[string]interface{}{
							"id": tcID, "type": "function",
							"function": map[string]interface{}{"name": tcName, "arguments": tcArgs},
						})
					}
				case []interface{}:
					for _, item := range v {
						if tc, ok := item.(map[string]interface{}); ok {
							tcID, _ := tc["tool_call_id"].(string)
							tcName, _ := tc["tool_call_name"].(string)
							tcArgs, _ := tc["tool_call_args"].(string)
							toolCalls = append(toolCalls, map[string]interface{}{
								"id": tcID, "type": "function",
								"function": map[string]interface{}{"name": tcName, "arguments": tcArgs},
							})
						}
					}
				}
				if len(toolCalls) > 0 {
					msg["tool_calls"] = toolCalls
				} else if tcID, ok := m.Metadata["tool_call_id"].(string); ok {
					// Backward compatibility: single tool call stored as flat fields
					tcName, _ := m.Metadata["tool_call_name"].(string)
					tcArgs, _ := m.Metadata["tool_call_args"].(string)
					msg["tool_calls"] = []map[string]interface{}{
						{
							"id": tcID, "type": "function",
							"function": map[string]interface{}{"name": tcName, "arguments": tcArgs},
						},
					}
				}
			}
			msgs = append(msgs, msg)
		case "tool":
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

// ---- Task Context (for sub-agent delegation) ----

// TaskContext carries workspace/user identity through the tool execution context
type TaskContext struct {
	WorkspaceID string
	UserID      string
}

type taskCtxKey struct{}

// WithTaskContext attaches workspace/user identity to a context for tools that need it
func WithTaskContext(ctx context.Context, tc *TaskContext) context.Context {
	return context.WithValue(ctx, taskCtxKey{}, tc)
}

// GetTaskContext retrieves the TaskContext from a context
func GetTaskContext(ctx context.Context) *TaskContext {
	if v, ok := ctx.Value(taskCtxKey{}).(*TaskContext); ok {
		return v
	}
	return nil
}

// ---- Session Context (for plan tools to access current session) ----

// SessionContext carries the current session ID through tool execution context
type SessionContext struct {
	SessionID string
}

type sessionCtxKey struct{}

// WithSessionContext attaches session ID to a context
func WithSessionContext(ctx context.Context, sc *SessionContext) context.Context {
	return context.WithValue(ctx, sessionCtxKey{}, sc)
}

// GetSessionContext retrieves the SessionContext from a context
func GetSessionContext(ctx context.Context) *SessionContext {
	if v, ok := ctx.Value(sessionCtxKey{}).(*SessionContext); ok {
		return v
	}
	return nil
}

// ---- Persona Context (for batch tool to enforce ToolFilter) ----

// PersonaContext carries the current persona's ToolFilter through tool execution context
type PersonaContext struct {
	ToolFilter []string // nil or empty = all tools allowed
}

type personaCtxKey struct{}

// WithPersonaContext attaches persona ToolFilter to a context
func WithPersonaContext(ctx context.Context, pc *PersonaContext) context.Context {
	return context.WithValue(ctx, personaCtxKey{}, pc)
}

// GetPersonaContext retrieves the PersonaContext from a context
func GetPersonaContext(ctx context.Context) *PersonaContext {
	if v, ok := ctx.Value(personaCtxKey{}).(*PersonaContext); ok {
		return v
	}
	return nil
}

// LLMConfig holds per-workspace LLM configuration
type LLMConfig struct {
	Provider string `json:"provider"` // "openai" or empty
	APIKey   string `json:"api_key"`
	BaseURL  string `json:"base_url"`
	Model    string `json:"model"`
}

// llmConfigCtxKey is the context key for workspace-level LLM config
type llmConfigCtxKey struct{}

// WithLLMConfig attaches workspace LLM config to a context
func WithLLMConfig(ctx context.Context, cfg *LLMConfig) context.Context {
	return context.WithValue(ctx, llmConfigCtxKey{}, cfg)
}

func getLLMConfigFromContext(ctx context.Context) *LLMConfig {
	if v, ok := ctx.Value(llmConfigCtxKey{}).(*LLMConfig); ok {
		return v
	}
	return nil
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
// Priority: workspace context config > engine config (config.yaml) > env vars > heuristic.
func (e *agentEngine) callLLM(ctx context.Context, messages []map[string]interface{}, tools []map[string]interface{}) (string, []toolAction, error) {
	// Check workspace-level LLM config from context
	if cfg := getLLMConfigFromContext(ctx); cfg != nil && (cfg.BaseURL != "" || cfg.APIKey != "") {
		model := cfg.Model
		if model == "" {
			model = "gpt-4o"
		}
		return e.callOpenAI(ctx, messages, tools, cfg.APIKey, model, cfg.BaseURL)
	}

	// Check engine-level config (from config.yaml ai section)
	if e.config.LLMAPIKey != "" {
		model := e.config.LLMModel
		if model == "" {
			model = getLLMModel()
		}
		baseURL := e.config.LLMBaseURL
		return e.callOpenAI(ctx, messages, tools, e.config.LLMAPIKey, model, baseURL)
	}

	provider, apiKey, model := detectLLMProvider()

	switch provider {
	case llmProviderOpenAI:
		return e.callOpenAI(ctx, messages, tools, apiKey, model, "")
	default:
		// Heuristic returns single action; wrap for compatibility
		thought, singleAction, err := e.thinkHeuristic(messages, tools)
		if singleAction != nil {
			return thought, []toolAction{*singleAction}, err
		}
		return thought, nil, err
	}
}

// llmChatResponse is the shared response structure for OpenAI-compatible APIs
type llmChatResponse struct {
	Choices []struct {
		Message struct {
			Content   string `json:"content"`
			ToolCalls []struct {
				ID       string `json:"id"`
				Type     string `json:"type"`
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
			ID       string `json:"id"`
			Type     string `json:"type"`
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

// parseLLMResponse extracts thought and tool actions (supports parallel tool calls) from a unified response
func parseLLMResponse(result *llmChatResponse) (string, []toolAction, error) {
	if result.Error.Message != "" {
		return "", nil, fmt.Errorf("LLM API error: %s", result.Error.Message)
	}

	// Handle OpenAI-style response (choices[])
	if len(result.Choices) > 0 {
		choice := result.Choices[0]
		if len(choice.Message.ToolCalls) > 0 {
			thought := choice.Message.Content
			actions := make([]toolAction, 0, len(choice.Message.ToolCalls))
			for _, tc := range choice.Message.ToolCalls {
				tcID := tc.ID
				if len(tcID) > 40 {
					tcID = tcID[:40]
				}
				actions = append(actions, toolAction{
					ToolCallID: tcID,
					ToolName:   tc.Function.Name,
					ToolArgs:   json.RawMessage(tc.Function.Arguments),
				})
			}
			if thought == "" {
				if len(actions) == 1 {
					thought = fmt.Sprintf("I'll call the %s tool to proceed.", actions[0].ToolName)
				} else {
					names := make([]string, len(actions))
					for i, a := range actions {
						names[i] = a.ToolName
					}
					thought = fmt.Sprintf("I'll call %d tools in parallel: %s", len(actions), strings.Join(names, ", "))
				}
			}
			return thought, actions, nil
		}
		return choice.Message.Content, nil, nil
	}

	// Handle Ollama-style response (top-level "message")
	if result.Message != nil {
		if len(result.Message.ToolCalls) > 0 {
			thought := result.Message.Content
			actions := make([]toolAction, 0, len(result.Message.ToolCalls))
			for _, tc := range result.Message.ToolCalls {
				tcID := tc.ID
				if len(tcID) > 40 {
					tcID = tcID[:40]
				}
				actions = append(actions, toolAction{
					ToolCallID: tcID,
					ToolName:   tc.Function.Name,
					ToolArgs:   tc.Function.Arguments,
				})
			}
			if thought == "" {
				if len(actions) == 1 {
					thought = fmt.Sprintf("I'll call the %s tool to proceed.", actions[0].ToolName)
				} else {
					thought = fmt.Sprintf("I'll call %d tools in parallel.", len(actions))
				}
			}
			return thought, actions, nil
		}
		return result.Message.Content, nil, nil
	}

	return "", nil, fmt.Errorf("no response from LLM")
}

// callOpenAI sends the request to an OpenAI-compatible API.
// Supports custom base URL via OPENAI_BASE_URL env var.
func (e *agentEngine) callOpenAI(ctx context.Context, messages []map[string]interface{}, tools []map[string]interface{}, apiKey, model, baseURLOverride string) (string, []toolAction, error) {
	reqBody := map[string]interface{}{
		"model":       model,
		"messages":    messages,
		"temperature": 0.2,
		"max_tokens":  8192,
	}
	if len(tools) > 0 {
		reqBody["tools"] = tools
		reqBody["tool_choice"] = "auto"
	}

	bodyBytes, _ := json.Marshal(reqBody)

	baseURL := baseURLOverride
	if baseURL == "" {
		baseURL = getLLMBaseURL()
	}
	endpointURL := strings.TrimRight(baseURL, "/") + "/chat/completions"

	req, err := http.NewRequestWithContext(ctx, "POST", endpointURL, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return "", nil, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	if apiKey != "" {
		req.Header.Set("Authorization", "Bearer "+apiKey)
	}

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

	if result.Error.Message != "" {
		return "", nil, fmt.Errorf("LLM API error: %s", result.Error.Message)
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
