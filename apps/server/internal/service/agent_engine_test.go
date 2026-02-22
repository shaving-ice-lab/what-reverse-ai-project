package service

import (
	"context"
	"encoding/json"
	"strings"
	"testing"
)

// ── Mock Tool for testing ──

type mockTool struct {
	name        string
	description string
	params      json.RawMessage
	confirm     bool
}

func (m *mockTool) Name() string                { return m.name }
func (m *mockTool) Description() string         { return m.description }
func (m *mockTool) Parameters() json.RawMessage { return m.params }
func (m *mockTool) RequiresConfirmation() bool  { return m.confirm }
func (m *mockTool) Execute(ctx context.Context, params json.RawMessage) (*AgentToolResult, error) {
	return &AgentToolResult{Success: true, Output: "ok"}, nil
}

func newMockTool(name string) *mockTool {
	return &mockTool{
		name:        name,
		description: "Mock " + name,
		params:      json.RawMessage(`{"type":"object","properties":{}}`),
	}
}

// ── Phase-Aware Tool Filtering ──

func TestBuildToolDefinitions_PlanningPhase_FiltersTools(t *testing.T) {
	registry := NewAgentToolRegistry()
	// Register a mix of planning-allowed and disallowed tools
	registry.MustRegister(newMockTool("get_workspace_info"))
	registry.MustRegister(newMockTool("get_ui_schema"))
	registry.MustRegister(newMockTool("create_plan"))
	registry.MustRegister(newMockTool("query_data"))
	registry.MustRegister(newMockTool("create_table"))       // should be filtered
	registry.MustRegister(newMockTool("generate_ui_schema")) // should be filtered
	registry.MustRegister(newMockTool("deploy_component"))   // should be filtered

	engine := &agentEngine{
		registry: registry,
		config:   DefaultAgentEngineConfig(),
		sessions: NewAgentSessionManager(),
	}

	// Planning phase session
	session := &AgentSession{Phase: SessionPhasePlanning}

	defs := engine.buildToolDefinitionsForPersona(nil, session)

	// Should only have the 4 planning tools
	if len(defs) != 4 {
		names := make([]string, 0)
		for _, d := range defs {
			fn := d["function"].(map[string]interface{})
			names = append(names, fn["name"].(string))
		}
		t.Fatalf("planning phase: got %d tools %v, want 4 (get_workspace_info, get_ui_schema, create_plan, query_data)", len(defs), names)
	}

	// Verify allowed tool names
	allowed := map[string]bool{
		"get_workspace_info": true,
		"get_ui_schema":      true,
		"create_plan":        true,
		"query_data":         true,
	}
	for _, d := range defs {
		fn := d["function"].(map[string]interface{})
		name := fn["name"].(string)
		if !allowed[name] {
			t.Fatalf("planning phase: tool %q should not be available", name)
		}
	}
}

func TestBuildToolDefinitions_ExecutingPhase_AllTools(t *testing.T) {
	registry := NewAgentToolRegistry()
	registry.MustRegister(newMockTool("get_workspace_info"))
	registry.MustRegister(newMockTool("create_plan"))
	registry.MustRegister(newMockTool("create_table"))
	registry.MustRegister(newMockTool("generate_ui_schema"))

	engine := &agentEngine{
		registry: registry,
		config:   DefaultAgentEngineConfig(),
		sessions: NewAgentSessionManager(),
	}

	// Executing phase — no tool restriction
	session := &AgentSession{Phase: SessionPhaseExecuting}
	defs := engine.buildToolDefinitionsForPersona(nil, session)

	if len(defs) != 4 {
		t.Fatalf("executing phase: got %d tools, want 4 (all tools)", len(defs))
	}
}

func TestBuildToolDefinitions_NilSession_AllTools(t *testing.T) {
	registry := NewAgentToolRegistry()
	registry.MustRegister(newMockTool("get_workspace_info"))
	registry.MustRegister(newMockTool("create_table"))

	engine := &agentEngine{
		registry: registry,
		config:   DefaultAgentEngineConfig(),
		sessions: NewAgentSessionManager(),
	}

	// nil session = no phase restriction (backward compat)
	defs := engine.buildToolDefinitionsForPersona(nil, nil)
	if len(defs) != 2 {
		t.Fatalf("nil session: got %d tools, want 2", len(defs))
	}
}

func TestBuildToolDefinitions_EmptyPhase_AllTools(t *testing.T) {
	registry := NewAgentToolRegistry()
	registry.MustRegister(newMockTool("get_workspace_info"))
	registry.MustRegister(newMockTool("create_table"))

	engine := &agentEngine{
		registry: registry,
		config:   DefaultAgentEngineConfig(),
		sessions: NewAgentSessionManager(),
	}

	// Empty phase (old sessions loaded from persistence) = no restriction
	session := &AgentSession{Phase: ""}
	defs := engine.buildToolDefinitionsForPersona(nil, session)
	if len(defs) != 2 {
		t.Fatalf("empty phase: got %d tools, want 2 (backward compat)", len(defs))
	}
}

func TestBuildToolDefinitions_PersonaFilter_CombinedWithPhase(t *testing.T) {
	registry := NewAgentToolRegistry()
	registry.MustRegister(newMockTool("get_workspace_info"))
	registry.MustRegister(newMockTool("create_plan"))
	registry.MustRegister(newMockTool("query_data"))
	registry.MustRegister(newMockTool("create_table"))

	engine := &agentEngine{
		registry: registry,
		config:   DefaultAgentEngineConfig(),
		sessions: NewAgentSessionManager(),
	}

	// Persona only allows get_workspace_info and create_plan
	persona := &Persona{
		ID:         "test",
		Name:       "Test Persona",
		ToolFilter: []string{"get_workspace_info", "create_plan"},
	}

	// Planning phase + persona filter = intersection
	session := &AgentSession{Phase: SessionPhasePlanning}
	defs := engine.buildToolDefinitionsForPersona(persona, session)

	// Both get_workspace_info and create_plan are in planning phase AND persona filter
	if len(defs) != 2 {
		names := make([]string, 0)
		for _, d := range defs {
			fn := d["function"].(map[string]interface{})
			names = append(names, fn["name"].(string))
		}
		t.Fatalf("persona+phase filter: got %d tools %v, want 2", len(defs), names)
	}
}

// ── Phase Transition in Run() ──

func TestPhaseTransition_ConfirmedToExecuting(t *testing.T) {
	sessions := NewAgentSessionManager()
	session := sessions.GetOrCreate("s1", "ws1", "u1", "")

	// Set up confirmed plan
	session.SetPlan(&AgentPlan{
		Title:  "Test",
		Status: "confirmed",
		Steps:  []AgentPlanStep{{ID: "s1", Status: "pending"}},
	})
	session.SetPhase(SessionPhaseConfirmed)

	// Simulate what Run() does at the beginning
	if session.GetPhase() == SessionPhaseConfirmed {
		session.SetPhase(SessionPhaseExecuting)
		if plan := session.GetPlan(); plan != nil {
			plan.Status = "in_progress"
			session.SetPlan(plan)
		}
	}

	if session.GetPhase() != SessionPhaseExecuting {
		t.Fatalf("phase = %q, want executing", session.GetPhase())
	}
	plan := session.GetPlan()
	if plan.Status != "in_progress" {
		t.Fatalf("plan status = %q, want in_progress", plan.Status)
	}
}

// ── Prompt Phase-Awareness ──

func TestBuildWebCreatorPrompt_PlanningPhase(t *testing.T) {
	session := &AgentSession{
		WorkspaceID: "ws1",
		UserID:      "u1",
		Phase:       SessionPhasePlanning,
	}

	tools := []PromptToolEntry{
		{Name: "get_workspace_info", Description: "Get workspace info", Cost: "FREE"},
		{Name: "create_plan", Description: "Create plan", Cost: "FREE"},
	}

	prompt := BuildWebCreatorPrompt(tools, session)

	// Planning phase should include planning guide
	if !strings.Contains(prompt, "Planning Conversation Phase") {
		t.Fatal("planning phase prompt should contain 'Planning Conversation Phase'")
	}
	// Should NOT include execution guide
	if strings.Contains(prompt, "Phased Execution (MANDATORY") {
		t.Fatal("planning phase prompt should NOT contain full execution guide")
	}
	// Should NOT include hard rules (those are for execution)
	if strings.Contains(prompt, "Hard Rules") {
		t.Fatal("planning phase prompt should NOT contain Hard Rules")
	}
}

func TestBuildWebCreatorPrompt_ConfirmedPhase(t *testing.T) {
	session := &AgentSession{
		WorkspaceID: "ws1",
		UserID:      "u1",
		Phase:       SessionPhaseConfirmed,
	}

	tools := []PromptToolEntry{
		{Name: "create_table", Description: "Create table", Cost: "CHEAP"},
	}

	prompt := BuildWebCreatorPrompt(tools, session)

	// Confirmed phase should include plan confirmed guide
	if !strings.Contains(prompt, "Plan Confirmed") {
		t.Fatal("confirmed phase prompt should contain 'Plan Confirmed'")
	}
	// Should also include execution guide
	if !strings.Contains(prompt, "Phased Execution") {
		t.Fatal("confirmed phase prompt should contain execution guide")
	}
}

func TestBuildWebCreatorPrompt_ExecutingPhase(t *testing.T) {
	session := &AgentSession{
		WorkspaceID: "ws1",
		UserID:      "u1",
		Phase:       SessionPhaseExecuting,
	}

	tools := []PromptToolEntry{
		{Name: "create_table", Description: "Create table", Cost: "CHEAP"},
	}

	prompt := BuildWebCreatorPrompt(tools, session)

	// Executing phase should include execution guide
	if !strings.Contains(prompt, "Phased Execution") {
		t.Fatal("executing phase prompt should contain execution guide")
	}
	// Should NOT include planning guide
	if strings.Contains(prompt, "Planning Conversation Phase") {
		t.Fatal("executing phase prompt should NOT contain planning guide")
	}
	// Should NOT include plan confirmed guide
	if strings.Contains(prompt, "Plan Confirmed — Begin Execution") {
		t.Fatal("executing phase prompt should NOT contain plan confirmed guide")
	}
}

func TestBuildWebCreatorPrompt_NilSession_DefaultsToPlanning(t *testing.T) {
	tools := []PromptToolEntry{
		{Name: "get_workspace_info", Description: "Get info", Cost: "FREE"},
	}

	prompt := BuildWebCreatorPrompt(tools, nil)

	// nil session should default to planning phase
	if !strings.Contains(prompt, "Planning Conversation Phase") {
		t.Fatal("nil session should default to planning phase prompt")
	}
}

func TestBuildWebCreatorPrompt_EmptyPhase_FallsToDefault(t *testing.T) {
	session := &AgentSession{
		WorkspaceID: "ws1",
		UserID:      "u1",
		Phase:       "", // old session with no phase
	}

	tools := []PromptToolEntry{
		{Name: "create_table", Description: "Create table", Cost: "CHEAP"},
	}

	prompt := BuildWebCreatorPrompt(tools, session)

	// Empty phase falls into default case (executing)
	if !strings.Contains(prompt, "Phased Execution") {
		t.Fatal("empty phase should fall into default (executing) with full execution guide")
	}
}

func TestBuildContextSection_IncludesPlanProgress(t *testing.T) {
	session := &AgentSession{
		WorkspaceID: "ws1",
		UserID:      "u1",
		Phase:       SessionPhaseExecuting,
		Plan: &AgentPlan{
			Title:   "Test Plan",
			Status:  "in_progress",
			Summary: "Build stuff",
			Steps: []AgentPlanStep{
				{ID: "s1", Status: "completed"},
				{ID: "s2", Status: "in_progress"},
				{ID: "s3", Status: "pending"},
			},
		},
	}

	ctx := buildContextSection(session)

	if !strings.Contains(ctx, "Plan: Test Plan") {
		t.Fatal("context should include plan title")
	}
	if !strings.Contains(ctx, "in_progress") {
		t.Fatal("context should include plan status")
	}
	if !strings.Contains(ctx, "Requirements summary: Build stuff") {
		t.Fatal("context should include summary")
	}
	if !strings.Contains(ctx, "1/3 completed") {
		t.Fatal("context should include progress count")
	}
	if !strings.Contains(ctx, "1 in progress") {
		t.Fatal("context should include in_progress count")
	}
	if !strings.Contains(ctx, "Session phase: executing") {
		t.Fatal("context should include session phase")
	}
}

func TestBuildContextSection_NilSession(t *testing.T) {
	ctx := buildContextSection(nil)
	if ctx != "" {
		t.Fatalf("nil session should produce empty context, got %q", ctx)
	}
}

func TestBuildContextSection_NoPlan(t *testing.T) {
	session := &AgentSession{
		WorkspaceID: "ws1",
		UserID:      "u1",
		Phase:       SessionPhasePlanning,
	}
	ctx := buildContextSection(session)

	if strings.Contains(ctx, "Plan:") {
		t.Fatal("context without plan should not mention Plan:")
	}
	if !strings.Contains(ctx, "planning") {
		t.Fatal("context should include session phase")
	}
}

// ── LLM Config Context ──

func TestWithLLMConfig_RoundTrip(t *testing.T) {
	ctx := context.Background()
	cfg := &LLMConfig{
		Provider: "openai",
		APIKey:   "sk-test",
		BaseURL:  "https://api.openai.com/v1",
		Model:    "gpt-4o",
	}
	ctx = WithLLMConfig(ctx, cfg)
	got := getLLMConfigFromContext(ctx)
	if got == nil {
		t.Fatal("getLLMConfigFromContext: expected non-nil, got nil")
	}
	if got.APIKey != "sk-test" {
		t.Fatalf("APIKey: got %q, want sk-test", got.APIKey)
	}
	if got.BaseURL != "https://api.openai.com/v1" {
		t.Fatalf("BaseURL: got %q, want https://api.openai.com/v1", got.BaseURL)
	}
	if got.Model != "gpt-4o" {
		t.Fatalf("Model: got %q, want gpt-4o", got.Model)
	}
}

func TestGetLLMConfigFromContext_NoConfig_ReturnsNil(t *testing.T) {
	ctx := context.Background()
	if got := getLLMConfigFromContext(ctx); got != nil {
		t.Fatalf("expected nil LLM config from empty context, got %+v", got)
	}
}

func TestWithLLMConfig_PreservedAcrossChildContexts(t *testing.T) {
	ctx := context.Background()
	cfg := &LLMConfig{APIKey: "sk-abc", Model: "gpt-4o"}
	ctx = WithLLMConfig(ctx, cfg)

	// Simulate WithTaskContext wrapping (context.WithValue)
	ctx = WithTaskContext(ctx, &TaskContext{WorkspaceID: "ws1", UserID: "u1"})
	// Simulate WithTimeout
	ctx2, cancel := context.WithTimeout(ctx, 30*1000*1000*1000) // 30s
	defer cancel()

	got := getLLMConfigFromContext(ctx2)
	if got == nil {
		t.Fatal("LLM config should survive child context wrapping")
	}
	if got.APIKey != "sk-abc" {
		t.Fatalf("APIKey: got %q, want sk-abc", got.APIKey)
	}
}

// ── AgentEngineConfig LLM fields ──

func TestDefaultAgentEngineConfig_LLMFieldsEmpty(t *testing.T) {
	cfg := DefaultAgentEngineConfig()
	if cfg.LLMAPIKey != "" {
		t.Fatalf("default LLMAPIKey should be empty, got %q", cfg.LLMAPIKey)
	}
	if cfg.LLMBaseURL != "" {
		t.Fatalf("default LLMBaseURL should be empty, got %q", cfg.LLMBaseURL)
	}
	if cfg.LLMModel != "" {
		t.Fatalf("default LLMModel should be empty, got %q", cfg.LLMModel)
	}
}

func TestAgentEngineConfig_LLMFieldsInjectable(t *testing.T) {
	cfg := DefaultAgentEngineConfig()
	cfg.LLMAPIKey = "sk-from-yaml"
	cfg.LLMBaseURL = "http://127.0.0.1:8045/v1"
	cfg.LLMModel = "gemini-flash"

	if cfg.LLMAPIKey != "sk-from-yaml" {
		t.Fatalf("LLMAPIKey: got %q, want sk-from-yaml", cfg.LLMAPIKey)
	}
	if cfg.LLMBaseURL != "http://127.0.0.1:8045/v1" {
		t.Fatalf("LLMBaseURL: got %q", cfg.LLMBaseURL)
	}
	if cfg.LLMModel != "gemini-flash" {
		t.Fatalf("LLMModel: got %q", cfg.LLMModel)
	}
}

// callLLM_falls_to_heuristic when context has no usable config (no apiKey, no baseURL)
// even if model is set — this verifies the fixed condition
func TestCallLLM_ContextWithModelOnly_FallsToHeuristic(t *testing.T) {
	registry := NewAgentToolRegistry()
	engine := &agentEngine{
		registry: registry,
		config:   DefaultAgentEngineConfig(), // no LLMAPIKey
		sessions: NewAgentSessionManager(),
	}

	// Set context with model only (no apiKey, no baseURL) — should NOT bypass heuristic
	ctx := context.Background()
	ctx = WithLLMConfig(ctx, &LLMConfig{Model: "gpt-4o"}) // apiKey="" baseURL=""

	// cfg is non-nil but both apiKey and baseURL are empty → callLLM should fall to heuristic
	cfg := getLLMConfigFromContext(ctx)
	if cfg == nil {
		t.Fatal("LLMConfig should be set in context")
	}
	// Verify the callLLM condition: apiKey=="" && baseURL=="" → heuristic
	if cfg.APIKey != "" || cfg.BaseURL != "" {
		t.Fatalf("expected empty APIKey and BaseURL, got apiKey=%q baseURL=%q", cfg.APIKey, cfg.BaseURL)
	}
	// Engine config also empty
	if engine.config.LLMAPIKey != "" {
		t.Fatal("engine LLMAPIKey should be empty")
	}
	// Result: callLLM would fall to detectLLMProvider() → heuristic (no env var)
	// This is the correct behavior — model alone is not enough

	msgs := []map[string]interface{}{
		{"role": "user", "content": "hello"},
	}
	thought, _, _ := engine.callLLM(ctx, msgs, nil)
	// Should use heuristic (can't verify "I understand..." exactly since step depends on tool history)
	// But should NOT panic and should return a non-empty thought
	if strings.TrimSpace(thought) == "" {
		t.Fatal("callLLM with no LLM config should return a heuristic thought")
	}
	_ = thought
}

func TestCallLLM_EngineConfigKey_SkipsHeuristic(t *testing.T) {
	// This test verifies engine config with an invalid key returns an LLM error, not heuristic
	registry := NewAgentToolRegistry()
	cfg := DefaultAgentEngineConfig()
	cfg.LLMAPIKey = "sk-invalid"
	cfg.LLMModel = "gpt-4o"
	cfg.LLMBaseURL = "http://127.0.0.1:19999" // non-existent port → network error

	engine := &agentEngine{
		registry: registry,
		config:   cfg,
		sessions: NewAgentSessionManager(),
	}

	ctx := context.Background()
	msgs := []map[string]interface{}{
		{"role": "user", "content": "test"},
	}
	_, _, err := engine.callLLM(ctx, msgs, nil)
	// Should return a network/LLM error, NOT heuristic (which returns nil error)
	if err == nil {
		t.Fatal("callLLM with invalid endpoint should return error, not heuristic fallback")
	}
}
