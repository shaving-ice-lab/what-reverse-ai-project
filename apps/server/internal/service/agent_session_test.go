package service

import (
	"testing"
)

// ── Phase Management ──

func TestNewSession_DefaultsToPlanning(t *testing.T) {
	mgr := NewAgentSessionManager()
	s := mgr.GetOrCreate("s1", "ws1", "u1", "p1")

	if s.GetPhase() != SessionPhasePlanning {
		t.Fatalf("new session phase = %q, want %q", s.GetPhase(), SessionPhasePlanning)
	}
}

func TestSetPhase_TransitionsCorrectly(t *testing.T) {
	s := &AgentSession{Phase: SessionPhasePlanning}

	s.SetPhase(SessionPhaseConfirmed)
	if s.GetPhase() != SessionPhaseConfirmed {
		t.Fatalf("phase = %q, want %q", s.GetPhase(), SessionPhaseConfirmed)
	}

	s.SetPhase(SessionPhaseExecuting)
	if s.GetPhase() != SessionPhaseExecuting {
		t.Fatalf("phase = %q, want %q", s.GetPhase(), SessionPhaseExecuting)
	}

	s.SetPhase(SessionPhaseCompleted)
	if s.GetPhase() != SessionPhaseCompleted {
		t.Fatalf("phase = %q, want %q", s.GetPhase(), SessionPhaseCompleted)
	}
}

// ── Plan CRUD ──

func TestSetPlan_AndGetPlan_ReturnsCopy(t *testing.T) {
	s := &AgentSession{}
	plan := &AgentPlan{
		Title:  "Test Plan",
		Status: "draft",
		Steps: []AgentPlanStep{
			{ID: "s1", Description: "step 1", Status: "pending"},
		},
		Groups: []PlanGroup{
			{ID: "g1", Label: "Group 1"},
		},
	}
	s.SetPlan(plan)

	got := s.GetPlan()
	if got == nil {
		t.Fatal("GetPlan returned nil")
	}
	if got.Title != "Test Plan" {
		t.Fatalf("title = %q, want %q", got.Title, "Test Plan")
	}

	// Verify it's a copy — mutating returned plan should not affect session
	got.Steps[0].Status = "completed"
	original := s.GetPlan()
	if original.Steps[0].Status != "pending" {
		t.Fatal("GetPlan did not return a copy — mutation leaked to session")
	}
}

func TestGetPlan_NilWhenNoPlan(t *testing.T) {
	s := &AgentSession{}
	if s.GetPlan() != nil {
		t.Fatal("GetPlan should return nil when no plan set")
	}
}

// ── ConfirmPlan ──

func TestConfirmPlan_DraftToConfirmed(t *testing.T) {
	s := &AgentSession{
		Phase: SessionPhasePlanning,
		Plan: &AgentPlan{
			Title:  "My Plan",
			Status: "draft",
			Steps:  []AgentPlanStep{{ID: "s1", Status: "pending"}},
		},
	}

	ok := s.ConfirmPlan()
	if !ok {
		t.Fatal("ConfirmPlan returned false for draft plan")
	}
	if s.Plan.Status != "confirmed" {
		t.Fatalf("plan status = %q, want %q", s.Plan.Status, "confirmed")
	}
	if s.GetPhase() != SessionPhaseConfirmed {
		t.Fatalf("phase = %q, want %q", s.GetPhase(), SessionPhaseConfirmed)
	}
}

func TestConfirmPlan_FailsWhenNoPlan(t *testing.T) {
	s := &AgentSession{Phase: SessionPhasePlanning}
	if s.ConfirmPlan() {
		t.Fatal("ConfirmPlan should return false when no plan exists")
	}
}

func TestConfirmPlan_FailsWhenAlreadyConfirmed(t *testing.T) {
	s := &AgentSession{
		Phase: SessionPhaseConfirmed,
		Plan: &AgentPlan{
			Status: "confirmed",
			Steps:  []AgentPlanStep{{ID: "s1", Status: "pending"}},
		},
	}
	if s.ConfirmPlan() {
		t.Fatal("ConfirmPlan should return false when plan is already confirmed")
	}
}

func TestConfirmPlan_FailsWhenInProgress(t *testing.T) {
	s := &AgentSession{
		Phase: SessionPhaseExecuting,
		Plan: &AgentPlan{
			Status: "in_progress",
			Steps:  []AgentPlanStep{{ID: "s1", Status: "in_progress"}},
		},
	}
	if s.ConfirmPlan() {
		t.Fatal("ConfirmPlan should return false when plan is in_progress")
	}
}

// ── UpdatePlanStep ──

func TestUpdatePlanStep_Success(t *testing.T) {
	s := &AgentSession{
		Plan: &AgentPlan{
			Status: "in_progress",
			Steps: []AgentPlanStep{
				{ID: "s1", Description: "step 1", Status: "pending"},
				{ID: "s2", Description: "step 2", Status: "pending"},
			},
		},
	}

	ok := s.UpdatePlanStep("s1", "in_progress", "")
	if !ok {
		t.Fatal("UpdatePlanStep returned false for existing step")
	}
	if s.Plan.Steps[0].Status != "in_progress" {
		t.Fatalf("step status = %q, want %q", s.Plan.Steps[0].Status, "in_progress")
	}

	ok = s.UpdatePlanStep("s1", "completed", "done!")
	if !ok {
		t.Fatal("UpdatePlanStep returned false")
	}
	if s.Plan.Steps[0].Status != "completed" {
		t.Fatalf("step status = %q, want %q", s.Plan.Steps[0].Status, "completed")
	}
	if s.Plan.Steps[0].Note != "done!" {
		t.Fatalf("step note = %q, want %q", s.Plan.Steps[0].Note, "done!")
	}
}

func TestUpdatePlanStep_NotFound(t *testing.T) {
	s := &AgentSession{
		Plan: &AgentPlan{
			Steps: []AgentPlanStep{{ID: "s1", Status: "pending"}},
		},
	}
	if s.UpdatePlanStep("nonexistent", "completed", "") {
		t.Fatal("UpdatePlanStep should return false for nonexistent step")
	}
}

func TestUpdatePlanStep_NoPlan(t *testing.T) {
	s := &AgentSession{}
	if s.UpdatePlanStep("s1", "completed", "") {
		t.Fatal("UpdatePlanStep should return false when no plan exists")
	}
}

func TestUpdatePlanStep_EmptyNoteDoesNotOverwrite(t *testing.T) {
	s := &AgentSession{
		Plan: &AgentPlan{
			Steps: []AgentPlanStep{{ID: "s1", Status: "pending", Note: "original note"}},
		},
	}
	s.UpdatePlanStep("s1", "completed", "")
	if s.Plan.Steps[0].Note != "original note" {
		t.Fatalf("empty note should not overwrite existing note, got %q", s.Plan.Steps[0].Note)
	}
}

// ── Session Manager ──

func TestSessionManager_GetOrCreate_Idempotent(t *testing.T) {
	mgr := NewAgentSessionManager()

	s1 := mgr.GetOrCreate("s1", "ws1", "u1", "p1")
	s2 := mgr.GetOrCreate("s1", "ws1", "u1", "p1")

	if s1 != s2 {
		t.Fatal("GetOrCreate should return the same session for the same ID")
	}
	if mgr.Count() != 1 {
		t.Fatalf("Count = %d, want 1", mgr.Count())
	}
}

func TestSessionManager_Delete(t *testing.T) {
	mgr := NewAgentSessionManager()
	mgr.GetOrCreate("s1", "ws1", "u1", "p1")

	if !mgr.Delete("s1") {
		t.Fatal("Delete should return true for existing session")
	}
	if _, ok := mgr.Get("s1"); ok {
		t.Fatal("session should be gone after Delete")
	}
}

func TestSessionManager_List(t *testing.T) {
	mgr := NewAgentSessionManager()
	mgr.GetOrCreate("s1", "ws1", "u1", "p1")
	mgr.GetOrCreate("s2", "ws1", "u1", "p1")
	mgr.GetOrCreate("s3", "ws2", "u1", "p1")

	ws1Sessions := mgr.List("ws1")
	if len(ws1Sessions) != 2 {
		t.Fatalf("List(ws1) = %d sessions, want 2", len(ws1Sessions))
	}
}
