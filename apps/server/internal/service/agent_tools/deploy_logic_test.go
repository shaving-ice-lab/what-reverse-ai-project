package agent_tools

import (
	"context"
	"encoding/json"
	"fmt"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/reverseai/server/internal/domain/entity"
	"github.com/reverseai/server/internal/service"
	"github.com/reverseai/server/internal/vmruntime"
)

// ── Mock WorkspaceService ────────────────────────────────────────────

// mockWorkspaceService implements service.WorkspaceService with only
// UpdateLogicCode actually wired; all other methods panic if called.
type mockWorkspaceService struct {
	service.WorkspaceService // embed to satisfy interface; unused methods will panic
	updateLogicCodeFn        func(ctx context.Context, id uuid.UUID, ownerID uuid.UUID, code string) (*entity.WorkspaceVersion, error)
}

func (m *mockWorkspaceService) UpdateLogicCode(ctx context.Context, id uuid.UUID, ownerID uuid.UUID, code string) (*entity.WorkspaceVersion, error) {
	if m.updateLogicCodeFn != nil {
		return m.updateLogicCodeFn(ctx, id, ownerID, code)
	}
	return nil, fmt.Errorf("UpdateLogicCode not implemented in mock")
}

// ── Tests ────────────────────────────────────────────────────────────

func TestDeployLogicTool_Metadata(t *testing.T) {
	tool := NewDeployLogicTool(nil, nil)

	if tool.Name() != "deploy_logic" {
		t.Fatalf("Name = %q, want deploy_logic", tool.Name())
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
	props := schema["properties"].(map[string]interface{})
	for _, key := range []string{"workspace_id", "user_id", "code"} {
		if _, ok := props[key]; !ok {
			t.Fatalf("Parameters missing required property %q", key)
		}
	}
}

func TestDeployLogicTool_Success(t *testing.T) {
	wsID := uuid.New()
	userID := uuid.New()
	versionID := uuid.New()

	var capturedCode string
	var capturedWsID, capturedUserID uuid.UUID

	mockWS := &mockWorkspaceService{
		updateLogicCodeFn: func(ctx context.Context, id uuid.UUID, ownerID uuid.UUID, code string) (*entity.WorkspaceVersion, error) {
			capturedWsID = id
			capturedUserID = ownerID
			capturedCode = code
			return &entity.WorkspaceVersion{
				ID:          versionID,
				WorkspaceID: id,
				Version:     "v3",
				CreatedAt:   time.Now(),
			}, nil
		},
	}

	dir := t.TempDir()
	store := vmruntime.NewVMStore(dir)
	defer store.Close()
	pool := vmruntime.NewVMPool(store, nil, 10)
	defer pool.Close()

	tool := NewDeployLogicTool(mockWS, pool)

	params, _ := json.Marshal(map[string]string{
		"workspace_id": wsID.String(),
		"user_id":      userID.String(),
		"code":         `exports.routes = { "GET /ping": function() { return { ok: true }; } };`,
	})

	result, err := tool.Execute(context.Background(), params)
	if err != nil {
		t.Fatalf("Execute returned error: %v", err)
	}
	if !result.Success {
		t.Fatalf("Execute failed: %s", result.Error)
	}
	if capturedWsID != wsID {
		t.Fatalf("workspace_id = %s, want %s", capturedWsID, wsID)
	}
	if capturedUserID != userID {
		t.Fatalf("user_id = %s, want %s", capturedUserID, userID)
	}
	if capturedCode == "" {
		t.Fatal("code should not be empty")
	}
	if result.Data == nil {
		t.Fatal("result.Data should not be nil")
	}
	data, ok := result.Data.(map[string]interface{})
	if !ok {
		t.Fatalf("result.Data type = %T, want map[string]interface{}", result.Data)
	}
	if data["version_id"] != versionID.String() {
		t.Fatalf("version_id = %v, want %s", data["version_id"], versionID)
	}
	if data["version"] != "v3" {
		t.Fatalf("version = %v, want v3", data["version"])
	}
}

func TestDeployLogicTool_InvalidParams(t *testing.T) {
	tool := NewDeployLogicTool(nil, nil)

	result, err := tool.Execute(context.Background(), json.RawMessage(`{invalid`))
	if err != nil {
		t.Fatalf("Execute should not return Go error: %v", err)
	}
	if result.Success {
		t.Fatal("should fail with invalid JSON")
	}
}

func TestDeployLogicTool_InvalidWorkspaceID(t *testing.T) {
	tool := NewDeployLogicTool(nil, nil)

	params, _ := json.Marshal(map[string]string{
		"workspace_id": "not-a-uuid",
		"user_id":      uuid.New().String(),
		"code":         "some code",
	})

	result, _ := tool.Execute(context.Background(), params)
	if result.Success {
		t.Fatal("should fail with invalid workspace_id")
	}
	if result.Error != "invalid workspace_id" {
		t.Fatalf("error = %q, want 'invalid workspace_id'", result.Error)
	}
}

func TestDeployLogicTool_InvalidUserID(t *testing.T) {
	tool := NewDeployLogicTool(nil, nil)

	params, _ := json.Marshal(map[string]string{
		"workspace_id": uuid.New().String(),
		"user_id":      "not-a-uuid",
		"code":         "some code",
	})

	result, _ := tool.Execute(context.Background(), params)
	if result.Success {
		t.Fatal("should fail with invalid user_id")
	}
	if result.Error != "invalid user_id" {
		t.Fatalf("error = %q, want 'invalid user_id'", result.Error)
	}
}

func TestDeployLogicTool_EmptyCode(t *testing.T) {
	tool := NewDeployLogicTool(nil, nil)

	params, _ := json.Marshal(map[string]string{
		"workspace_id": uuid.New().String(),
		"user_id":      uuid.New().String(),
		"code":         "",
	})

	result, _ := tool.Execute(context.Background(), params)
	if result.Success {
		t.Fatal("should fail with empty code")
	}
	if result.Error != "code cannot be empty" {
		t.Fatalf("error = %q, want 'code cannot be empty'", result.Error)
	}
}

func TestDeployLogicTool_UpdateLogicCodeError(t *testing.T) {
	mockWS := &mockWorkspaceService{
		updateLogicCodeFn: func(ctx context.Context, id uuid.UUID, ownerID uuid.UUID, code string) (*entity.WorkspaceVersion, error) {
			return nil, fmt.Errorf("db connection refused")
		},
	}

	dir := t.TempDir()
	store := vmruntime.NewVMStore(dir)
	defer store.Close()
	pool := vmruntime.NewVMPool(store, nil, 10)
	defer pool.Close()

	tool := NewDeployLogicTool(mockWS, pool)

	params, _ := json.Marshal(map[string]string{
		"workspace_id": uuid.New().String(),
		"user_id":      uuid.New().String(),
		"code":         "exports.routes = {};",
	})

	result, _ := tool.Execute(context.Background(), params)
	if result.Success {
		t.Fatal("should fail when UpdateLogicCode errors")
	}
	if result.Error == "" {
		t.Fatal("error should not be empty")
	}
}

func TestDeployLogicTool_VMPoolInvalidation(t *testing.T) {
	wsID := uuid.New()
	userID := uuid.New()

	mockWS := &mockWorkspaceService{
		updateLogicCodeFn: func(ctx context.Context, id uuid.UUID, ownerID uuid.UUID, code string) (*entity.WorkspaceVersion, error) {
			return &entity.WorkspaceVersion{
				ID:          uuid.New(),
				WorkspaceID: id,
				Version:     "v1",
				CreatedAt:   time.Now(),
			}, nil
		},
	}

	dir := t.TempDir()
	store := vmruntime.NewVMStore(dir)
	defer store.Close()

	// Use a mock code loader that returns code for our workspace
	loader := &testCodeLoader{codes: map[string]string{
		wsID.String(): `exports.routes = { "GET /old": function() { return 1; } };`,
	}}
	pool := vmruntime.NewVMPool(store, loader, 10)
	defer pool.Close()

	// Pre-populate the VM cache
	vm1, err := pool.GetOrCreate(context.Background(), wsID.String())
	if err != nil {
		t.Fatalf("pre-populate failed: %v", err)
	}

	tool := NewDeployLogicTool(mockWS, pool)

	params, _ := json.Marshal(map[string]string{
		"workspace_id": wsID.String(),
		"user_id":      userID.String(),
		"code":         `exports.routes = { "GET /new": function() { return 2; } };`,
	})

	result, _ := tool.Execute(context.Background(), params)
	if !result.Success {
		t.Fatalf("Execute failed: %s", result.Error)
	}

	// After deploy, the old VM should be invalidated.
	// Getting a new VM should create a fresh one (different pointer).
	vm2, err := pool.GetOrCreate(context.Background(), wsID.String())
	if err != nil {
		t.Fatalf("GetOrCreate after deploy failed: %v", err)
	}
	if vm1 == vm2 {
		t.Fatal("VM should have been invalidated and rebuilt after deploy")
	}
}

// testCodeLoader is a simple VMCodeLoader for testing.
type testCodeLoader struct {
	codes map[string]string
}

func (l *testCodeLoader) GetLogicCode(_ context.Context, workspaceID string) (string, string, error) {
	code, ok := l.codes[workspaceID]
	if !ok || code == "" {
		return "", "", nil
	}
	return code, fmt.Sprintf("hash-%s", workspaceID[:8]), nil
}
