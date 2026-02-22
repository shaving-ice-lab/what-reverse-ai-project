package agent_tools

import (
	"context"
	"encoding/json"
	"strings"
	"testing"

	"github.com/reverseai/server/internal/service"
)

// ── Helper ──

func setupSessionWithContext(sessionID string) (*service.AgentSessionManager, context.Context) {
	mgr := service.NewAgentSessionManager()
	mgr.GetOrCreate(sessionID, "ws1", "u1", "p1")
	ctx := service.WithSessionContext(context.Background(), &service.SessionContext{SessionID: sessionID})
	return mgr, ctx
}

// ════════════════════════════════════════════════════════════════════
// create_plan tests
// ════════════════════════════════════════════════════════════════════

func TestCreatePlanTool_Metadata(t *testing.T) {
	tool := NewCreatePlanTool(nil)
	if tool.Name() != "create_plan" {
		t.Fatalf("Name = %q, want create_plan", tool.Name())
	}
	if tool.Description() == "" {
		t.Fatal("Description should not be empty")
	}
	if tool.RequiresConfirmation() {
		t.Fatal("RequiresConfirmation should be false")
	}
	var schema map[string]interface{}
	if err := json.Unmarshal(tool.Parameters(), &schema); err != nil {
		t.Fatalf("Parameters is not valid JSON: %v", err)
	}
}

func TestCreatePlan_BasicSuccess(t *testing.T) {
	mgr, ctx := setupSessionWithContext("s1")
	tool := NewCreatePlanTool(mgr)

	params := json.RawMessage(`{
		"title": "Build Employee App",
		"summary": "Employee management with CRUD",
		"steps": [
			{"id": "step_1", "description": "Create employees table", "tool": "create_table"},
			{"id": "step_2", "description": "Generate UI", "tool": "generate_ui_schema"}
		]
	}`)

	result, err := tool.Execute(ctx, params)
	if err != nil {
		t.Fatalf("Execute error: %v", err)
	}
	if !result.Success {
		t.Fatalf("Execute failed: %s", result.Error)
	}

	// Verify plan stored in session
	session, _ := mgr.Get("s1")
	plan := session.GetPlan()
	if plan == nil {
		t.Fatal("plan not stored in session")
	}
	if plan.Title != "Build Employee App" {
		t.Fatalf("plan title = %q", plan.Title)
	}
	if plan.Status != "draft" {
		t.Fatalf("plan status = %q, want draft", plan.Status)
	}
	if plan.Summary != "Employee management with CRUD" {
		t.Fatalf("plan summary = %q", plan.Summary)
	}
	if len(plan.Steps) != 2 {
		t.Fatalf("plan steps = %d, want 2", len(plan.Steps))
	}
	for _, s := range plan.Steps {
		if s.Status != "pending" {
			t.Fatalf("step %s status = %q, want pending", s.ID, s.Status)
		}
	}

	// Verify result Data
	data, ok := result.Data.(map[string]interface{})
	if !ok {
		t.Fatal("result.Data is not a map")
	}
	if data["type"] != "plan" {
		t.Fatalf("data type = %q, want plan", data["type"])
	}
	if data["status"] != "draft" {
		t.Fatalf("data status = %q, want draft", data["status"])
	}
}

func TestCreatePlan_WithGroups(t *testing.T) {
	mgr, ctx := setupSessionWithContext("s1")
	tool := NewCreatePlanTool(mgr)

	params := json.RawMessage(`{
		"title": "Full App",
		"groups": [
			{"id": "data_layer", "label": "Data Layer", "icon": "📦"},
			{"id": "ui_layer", "label": "UI Layer", "icon": "🎨"}
		],
		"steps": [
			{"id": "s1", "description": "Create tables", "tool": "create_table", "group_id": "data_layer"},
			{"id": "s2", "description": "Seed data", "tool": "insert_data", "group_id": "data_layer"},
			{"id": "s3", "description": "Build pages", "tool": "generate_ui_schema", "group_id": "ui_layer"}
		]
	}`)

	result, err := tool.Execute(ctx, params)
	if err != nil {
		t.Fatalf("Execute error: %v", err)
	}
	if !result.Success {
		t.Fatalf("Execute failed: %s", result.Error)
	}

	session, _ := mgr.Get("s1")
	plan := session.GetPlan()
	if len(plan.Groups) != 2 {
		t.Fatalf("plan groups = %d, want 2", len(plan.Groups))
	}
	if plan.Groups[0].Icon != "📦" {
		t.Fatalf("group icon = %q", plan.Groups[0].Icon)
	}

	// Verify all steps have correct group_id
	for _, s := range plan.Steps {
		if s.GroupID == "" {
			t.Fatalf("step %s has empty group_id", s.ID)
		}
	}
}

func TestCreatePlan_InvalidGroupIDCleared(t *testing.T) {
	mgr, ctx := setupSessionWithContext("s1")
	tool := NewCreatePlanTool(mgr)

	params := json.RawMessage(`{
		"title": "Test",
		"groups": [{"id": "g1", "label": "Group 1"}],
		"steps": [
			{"id": "s1", "description": "step with valid group", "group_id": "g1"},
			{"id": "s2", "description": "step with invalid group", "group_id": "nonexistent"}
		]
	}`)

	result, err := tool.Execute(ctx, params)
	if err != nil {
		t.Fatalf("Execute error: %v", err)
	}
	if !result.Success {
		t.Fatalf("Execute failed: %s", result.Error)
	}

	session, _ := mgr.Get("s1")
	plan := session.GetPlan()

	if plan.Steps[0].GroupID != "g1" {
		t.Fatalf("step s1 group_id = %q, want g1", plan.Steps[0].GroupID)
	}
	if plan.Steps[1].GroupID != "" {
		t.Fatalf("step s2 group_id = %q, want empty (invalid ref should be cleared)", plan.Steps[1].GroupID)
	}
}

func TestCreatePlan_AutoGenerateStepID(t *testing.T) {
	mgr, ctx := setupSessionWithContext("s1")
	tool := NewCreatePlanTool(mgr)

	params := json.RawMessage(`{
		"title": "Test",
		"steps": [
			{"id": "", "description": "first step"},
			{"description": "second step"}
		]
	}`)

	result, err := tool.Execute(ctx, params)
	if err != nil {
		t.Fatalf("Execute error: %v", err)
	}
	if !result.Success {
		t.Fatalf("Execute failed: %s", result.Error)
	}

	session, _ := mgr.Get("s1")
	plan := session.GetPlan()
	if plan.Steps[0].ID != "step_1" {
		t.Fatalf("auto-generated ID = %q, want step_1", plan.Steps[0].ID)
	}
	if plan.Steps[1].ID != "step_2" {
		t.Fatalf("auto-generated ID = %q, want step_2", plan.Steps[1].ID)
	}
}

func TestCreatePlan_EmptyTitle_Fails(t *testing.T) {
	tool := NewCreatePlanTool(nil)
	params := json.RawMessage(`{"title": "", "steps": [{"id": "s1", "description": "x"}]}`)

	result, err := tool.Execute(context.Background(), params)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.Success {
		t.Fatal("should fail with empty title")
	}
	if !strings.Contains(result.Error, "title") {
		t.Fatalf("error = %q, should mention title", result.Error)
	}
}

func TestCreatePlan_NoSteps_Fails(t *testing.T) {
	tool := NewCreatePlanTool(nil)
	params := json.RawMessage(`{"title": "Test", "steps": []}`)

	result, err := tool.Execute(context.Background(), params)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.Success {
		t.Fatal("should fail with no steps")
	}
}

func TestCreatePlan_InvalidJSON_Fails(t *testing.T) {
	tool := NewCreatePlanTool(nil)
	result, err := tool.Execute(context.Background(), json.RawMessage(`{invalid`))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.Success {
		t.Fatal("should fail with invalid JSON")
	}
}

func TestCreatePlan_NoSessionContext_StillSucceeds(t *testing.T) {
	mgr := service.NewAgentSessionManager()
	tool := NewCreatePlanTool(mgr)
	params := json.RawMessage(`{"title": "Test", "steps": [{"id": "s1", "description": "x"}]}`)

	// No SessionContext — plan won't be stored but shouldn't error
	result, err := tool.Execute(context.Background(), params)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !result.Success {
		t.Fatalf("should succeed even without session context: %s", result.Error)
	}
}

// ════════════════════════════════════════════════════════════════════
// update_plan tests
// ════════════════════════════════════════════════════════════════════

func TestUpdatePlanTool_Metadata(t *testing.T) {
	tool := NewUpdatePlanTool(nil)
	if tool.Name() != "update_plan" {
		t.Fatalf("Name = %q, want update_plan", tool.Name())
	}
}

func TestUpdatePlan_MarkInProgress(t *testing.T) {
	mgr, ctx := setupSessionWithContext("s1")
	session, _ := mgr.Get("s1")
	session.SetPlan(&service.AgentPlan{
		Title:  "Test Plan",
		Status: "in_progress",
		Steps: []service.AgentPlanStep{
			{ID: "s1", Description: "step 1", Status: "pending"},
			{ID: "s2", Description: "step 2", Status: "pending"},
		},
	})

	tool := NewUpdatePlanTool(mgr)
	params := json.RawMessage(`{"step_id": "s1", "status": "in_progress"}`)

	result, err := tool.Execute(ctx, params)
	if err != nil {
		t.Fatalf("Execute error: %v", err)
	}
	if !result.Success {
		t.Fatalf("Execute failed: %s", result.Error)
	}

	plan := session.GetPlan()
	if plan.Steps[0].Status != "in_progress" {
		t.Fatalf("step status = %q, want in_progress", plan.Steps[0].Status)
	}
	// Plan should still be in_progress (not all steps done)
	if plan.Status != "in_progress" {
		t.Fatalf("plan status = %q, want in_progress", plan.Status)
	}
}

func TestUpdatePlan_MarkCompleted(t *testing.T) {
	mgr, ctx := setupSessionWithContext("s1")
	session, _ := mgr.Get("s1")
	session.SetPlan(&service.AgentPlan{
		Title:  "Test Plan",
		Status: "in_progress",
		Steps: []service.AgentPlanStep{
			{ID: "s1", Description: "step 1", Status: "pending"},
		},
	})

	tool := NewUpdatePlanTool(mgr)
	params := json.RawMessage(`{"step_id": "s1", "status": "completed"}`)

	result, err := tool.Execute(ctx, params)
	if err != nil {
		t.Fatalf("Execute error: %v", err)
	}
	if !result.Success {
		t.Fatalf("Execute failed: %s", result.Error)
	}

	// Plan should auto-complete because all steps are done
	plan := session.GetPlan()
	if plan.Status != "completed" {
		t.Fatalf("plan status = %q, want completed (auto-complete)", plan.Status)
	}
	if session.GetPhase() != service.SessionPhaseCompleted {
		t.Fatalf("session phase = %q, want completed", session.GetPhase())
	}
}

func TestUpdatePlan_AutoComplete_MixedCompletedAndFailed(t *testing.T) {
	mgr, ctx := setupSessionWithContext("s1")
	session, _ := mgr.Get("s1")
	session.SetPlan(&service.AgentPlan{
		Title:  "Test Plan",
		Status: "in_progress",
		Steps: []service.AgentPlanStep{
			{ID: "s1", Description: "step 1", Status: "completed"},
			{ID: "s2", Description: "step 2", Status: "pending"},
		},
	})

	tool := NewUpdatePlanTool(mgr)
	// Mark s2 as failed — all steps done (completed + failed)
	params := json.RawMessage(`{"step_id": "s2", "status": "failed", "note": "some error"}`)

	result, err := tool.Execute(ctx, params)
	if err != nil {
		t.Fatalf("Execute error: %v", err)
	}
	if !result.Success {
		t.Fatalf("Execute failed: %s", result.Error)
	}

	plan := session.GetPlan()
	if plan.Status != "completed" {
		t.Fatalf("plan status = %q, want completed (all steps done: completed+failed)", plan.Status)
	}
}

func TestUpdatePlan_NoAutoComplete_WhenStillPending(t *testing.T) {
	mgr, ctx := setupSessionWithContext("s1")
	session, _ := mgr.Get("s1")
	session.SetPlan(&service.AgentPlan{
		Title:  "Test Plan",
		Status: "in_progress",
		Steps: []service.AgentPlanStep{
			{ID: "s1", Description: "step 1", Status: "pending"},
			{ID: "s2", Description: "step 2", Status: "pending"},
			{ID: "s3", Description: "step 3", Status: "pending"},
		},
	})

	tool := NewUpdatePlanTool(mgr)
	params := json.RawMessage(`{"step_id": "s1", "status": "completed"}`)

	result, _ := tool.Execute(ctx, params)
	if !result.Success {
		t.Fatalf("Execute failed: %s", result.Error)
	}

	plan := session.GetPlan()
	if plan.Status != "in_progress" {
		t.Fatalf("plan status = %q, want in_progress (2 steps still pending)", plan.Status)
	}
}

func TestUpdatePlan_NoAutoComplete_WhenDraft(t *testing.T) {
	mgr, ctx := setupSessionWithContext("s1")
	session, _ := mgr.Get("s1")
	session.SetPlan(&service.AgentPlan{
		Title:  "Test Plan",
		Status: "draft",
		Steps: []service.AgentPlanStep{
			{ID: "s1", Description: "step 1", Status: "pending"},
		},
	})

	tool := NewUpdatePlanTool(mgr)
	params := json.RawMessage(`{"step_id": "s1", "status": "completed"}`)

	result, _ := tool.Execute(ctx, params)
	if !result.Success {
		t.Fatalf("Execute failed: %s", result.Error)
	}

	// Should NOT auto-complete because plan is "draft", not "in_progress"
	plan := session.GetPlan()
	if plan.Status != "draft" {
		t.Fatalf("plan status = %q, want draft (auto-complete only triggers on in_progress)", plan.Status)
	}
}

func TestUpdatePlan_StepNotFound(t *testing.T) {
	mgr, ctx := setupSessionWithContext("s1")
	session, _ := mgr.Get("s1")
	session.SetPlan(&service.AgentPlan{
		Title:  "Test",
		Status: "in_progress",
		Steps:  []service.AgentPlanStep{{ID: "s1", Status: "pending"}},
	})

	tool := NewUpdatePlanTool(mgr)
	params := json.RawMessage(`{"step_id": "nonexistent", "status": "completed"}`)

	result, _ := tool.Execute(ctx, params)
	if result.Success {
		t.Fatal("should fail for nonexistent step_id")
	}
	if !strings.Contains(result.Error, "not found") {
		t.Fatalf("error = %q, should mention not found", result.Error)
	}
}

func TestUpdatePlan_InvalidStatus(t *testing.T) {
	tool := NewUpdatePlanTool(nil)
	params := json.RawMessage(`{"step_id": "s1", "status": "invalid_status"}`)

	result, _ := tool.Execute(context.Background(), params)
	if result.Success {
		t.Fatal("should fail for invalid status")
	}
}

func TestUpdatePlan_EmptyStepID(t *testing.T) {
	tool := NewUpdatePlanTool(nil)
	params := json.RawMessage(`{"step_id": "", "status": "completed"}`)

	result, _ := tool.Execute(context.Background(), params)
	if result.Success {
		t.Fatal("should fail for empty step_id")
	}
}

func TestUpdatePlan_ResultContainsFullPlan(t *testing.T) {
	mgr, ctx := setupSessionWithContext("s1")
	session, _ := mgr.Get("s1")
	session.SetPlan(&service.AgentPlan{
		Title:  "Test",
		Status: "in_progress",
		Steps: []service.AgentPlanStep{
			{ID: "s1", Status: "pending"},
			{ID: "s2", Status: "pending"},
		},
	})

	tool := NewUpdatePlanTool(mgr)
	params := json.RawMessage(`{"step_id": "s1", "status": "completed"}`)
	result, _ := tool.Execute(ctx, params)

	data, ok := result.Data.(map[string]interface{})
	if !ok {
		t.Fatal("result.Data is not a map")
	}
	if data["type"] != "plan_update" {
		t.Fatalf("data type = %q, want plan_update", data["type"])
	}
	if data["plan"] == nil {
		t.Fatal("result should include full updated plan for frontend re-render")
	}
}

// ════════════════════════════════════════════════════════════════════
// Full lifecycle: create → confirm → execute → auto-complete
// ════════════════════════════════════════════════════════════════════

func TestFullPlanLifecycle(t *testing.T) {
	mgr, ctx := setupSessionWithContext("lifecycle")
	session, _ := mgr.Get("lifecycle")

	// Phase 1: Planning — create a plan
	if session.GetPhase() != service.SessionPhasePlanning {
		t.Fatalf("initial phase = %q, want planning", session.GetPhase())
	}

	createTool := NewCreatePlanTool(mgr)
	createParams := json.RawMessage(`{
		"title": "Employee App",
		"summary": "Basic employee management",
		"groups": [
			{"id": "data", "label": "Data Layer"},
			{"id": "ui", "label": "UI Layer"}
		],
		"steps": [
			{"id": "s1", "description": "Create employees table", "tool": "create_table", "group_id": "data"},
			{"id": "s2", "description": "Insert seed data", "tool": "insert_data", "group_id": "data"},
			{"id": "s3", "description": "Generate UI", "tool": "generate_ui_schema", "group_id": "ui"}
		]
	}`)
	result, _ := createTool.Execute(ctx, createParams)
	if !result.Success {
		t.Fatalf("create_plan failed: %s", result.Error)
	}

	plan := session.GetPlan()
	if plan.Status != "draft" {
		t.Fatalf("plan status after create = %q, want draft", plan.Status)
	}

	// Phase 2: Confirm
	ok := session.ConfirmPlan()
	if !ok {
		t.Fatal("ConfirmPlan failed")
	}
	if session.GetPhase() != service.SessionPhaseConfirmed {
		t.Fatalf("phase after confirm = %q, want confirmed", session.GetPhase())
	}
	plan = session.GetPlan()
	if plan.Status != "confirmed" {
		t.Fatalf("plan status after confirm = %q, want confirmed", plan.Status)
	}

	// Simulate engine transitioning to executing
	session.SetPhase(service.SessionPhaseExecuting)
	plan = session.GetPlan()
	plan.Status = "in_progress"
	session.SetPlan(plan)

	// Phase 3: Execute — update steps one by one
	updateTool := NewUpdatePlanTool(mgr)

	// Step 1: in_progress → completed
	r, _ := updateTool.Execute(ctx, json.RawMessage(`{"step_id": "s1", "status": "in_progress"}`))
	if !r.Success {
		t.Fatalf("update s1 to in_progress failed: %s", r.Error)
	}
	r, _ = updateTool.Execute(ctx, json.RawMessage(`{"step_id": "s1", "status": "completed"}`))
	if !r.Success {
		t.Fatalf("update s1 to completed failed: %s", r.Error)
	}

	// Verify plan still in_progress (2 steps left)
	plan = session.GetPlan()
	if plan.Status != "in_progress" {
		t.Fatalf("plan status after s1 = %q, want in_progress", plan.Status)
	}

	// Step 2: completed
	updateTool.Execute(ctx, json.RawMessage(`{"step_id": "s2", "status": "completed"}`))

	// Step 3: completed — this should trigger auto-complete
	r, _ = updateTool.Execute(ctx, json.RawMessage(`{"step_id": "s3", "status": "completed"}`))
	if !r.Success {
		t.Fatalf("update s3 to completed failed: %s", r.Error)
	}

	// Phase 4: Auto-completed
	plan = session.GetPlan()
	if plan.Status != "completed" {
		t.Fatalf("plan status after all steps = %q, want completed", plan.Status)
	}
	if session.GetPhase() != service.SessionPhaseCompleted {
		t.Fatalf("session phase after all steps = %q, want completed", session.GetPhase())
	}

	// Verify all steps are completed
	for _, s := range plan.Steps {
		if s.Status != "completed" {
			t.Fatalf("step %s status = %q, want completed", s.ID, s.Status)
		}
	}
}
