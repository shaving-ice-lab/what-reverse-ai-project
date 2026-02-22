package handler

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/reverseai/server/internal/domain/entity"
	"github.com/reverseai/server/internal/service"
	"github.com/reverseai/server/internal/vmruntime"
)

// ── Mocks ────────────────────────────────────────────────────────────

// stubRuntimeService mocks RuntimeService; only GetEntry is implemented.
type stubRuntimeService struct {
	service.RuntimeService
	workspaces map[string]*entity.Workspace // slug → workspace
}

func (s *stubRuntimeService) GetEntry(_ context.Context, slug string, _ *uuid.UUID) (*service.RuntimeEntry, error) {
	ws, ok := s.workspaces[slug]
	if !ok {
		return nil, fmt.Errorf("not found")
	}
	return &service.RuntimeEntry{Workspace: ws}, nil
}

// stubCodeLoader is a configurable VMCodeLoader for tests.
type stubCodeLoader struct {
	codes map[string]string // workspaceID → JS code
}

func (l *stubCodeLoader) GetLogicCode(_ context.Context, workspaceID string) (string, string, error) {
	code, ok := l.codes[workspaceID]
	if !ok || code == "" {
		return "", "", nil
	}
	h := sha256.Sum256([]byte(code))
	return code, fmt.Sprintf("%x", h[:]), nil
}

// integrationEnv bundles all components needed for integration tests.
type integrationEnv struct {
	echo        *echo.Echo
	vmHandler   *RuntimeVMHandler
	dataHandler *RuntimeDataHandler
	store       *vmruntime.VMStore
	pool        *vmruntime.VMPool
	loader      *stubCodeLoader
	runtimeSvc  *stubRuntimeService
	wsID        string
	slug        string
}

func newIntegrationEnv(t *testing.T) *integrationEnv {
	t.Helper()

	wsID := uuid.New()
	slug := "test-app"

	ws := &entity.Workspace{
		ID:        wsID,
		Slug:      slug,
		AppStatus: "published",
	}

	runtimeSvc := &stubRuntimeService{
		workspaces: map[string]*entity.Workspace{slug: ws},
	}

	dir := t.TempDir()
	store := vmruntime.NewVMStore(dir)
	t.Cleanup(func() { store.Close() })

	loader := &stubCodeLoader{codes: make(map[string]string)}
	pool := vmruntime.NewVMPool(store, loader, 10)
	t.Cleanup(func() { pool.Close() })

	vmHandler := NewRuntimeVMHandler(runtimeSvc, pool, nil)
	dataHandler := NewRuntimeDataHandler(runtimeSvc, store)

	e := echo.New()

	return &integrationEnv{
		echo:        e,
		vmHandler:   vmHandler,
		dataHandler: dataHandler,
		store:       store,
		pool:        pool,
		loader:      loader,
		runtimeSvc:  runtimeSvc,
		wsID:        wsID.String(),
		slug:        slug,
	}
}

// doVMRequest sends a request to the VM handler and returns the recorder.
func (env *integrationEnv) doVMRequest(method, apiPath string, body interface{}) *httptest.ResponseRecorder {
	var bodyReader *bytes.Reader
	if body != nil {
		b, _ := json.Marshal(body)
		bodyReader = bytes.NewReader(b)
	} else {
		bodyReader = bytes.NewReader(nil)
	}

	url := "/runtime/" + env.slug + "/api" + apiPath
	req := httptest.NewRequest(method, url, bodyReader)
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	c := env.echo.NewContext(req, rec)
	c.SetParamNames("workspaceSlug", "*")
	c.SetParamValues(env.slug, apiPath)

	env.vmHandler.HandleAPI(c)
	return rec
}

// doDataRequest sends a request to the RuntimeDataHandler and returns the recorder.
func (env *integrationEnv) doDataQueryRequest(table string, queryParams map[string]string) *httptest.ResponseRecorder {
	url := "/runtime/" + env.slug + "/data/" + table
	if len(queryParams) > 0 {
		parts := make([]string, 0, len(queryParams))
		for k, v := range queryParams {
			parts = append(parts, k+"="+v)
		}
		url += "?" + strings.Join(parts, "&")
	}
	req := httptest.NewRequest(http.MethodGet, url, nil)
	rec := httptest.NewRecorder()
	c := env.echo.NewContext(req, rec)
	c.SetParamNames("workspaceSlug", "table")
	c.SetParamValues(env.slug, table)
	env.dataHandler.QueryRows(c)
	return rec
}

func (env *integrationEnv) doDataInsertRequest(table string, data map[string]interface{}) *httptest.ResponseRecorder {
	body, _ := json.Marshal(map[string]interface{}{"data": data})
	req := httptest.NewRequest(http.MethodPost, "/runtime/"+env.slug+"/data/"+table, bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	c := env.echo.NewContext(req, rec)
	c.SetParamNames("workspaceSlug", "table")
	c.SetParamValues(env.slug, table)
	env.dataHandler.InsertRow(c)
	return rec
}

// parseJSON parses a response body into a map.
func parseJSON(t *testing.T, rec *httptest.ResponseRecorder) map[string]interface{} {
	t.Helper()
	var m map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &m); err != nil {
		t.Fatalf("parse response JSON: %v\nBody: %s", err, rec.Body.String())
	}
	return m
}

// ── Integration Test 1: Deploy → Create Table → Write Routes → API Access ──

func TestIntegration_DeployAndAccessVMAPI(t *testing.T) {
	env := newIntegrationEnv(t)
	ctx := context.Background()

	// Step 1: Create a table in the workspace's SQLite DB
	err := env.store.CreateTable(ctx, env.wsID, vmruntime.VMCreateTableRequest{
		Name: "tasks",
		Columns: []vmruntime.VMCreateColumnDef{
			{Name: "id", Type: "INTEGER", Nullable: false},
			{Name: "title", Type: "TEXT", Nullable: false},
			{Name: "done", Type: "INTEGER", Nullable: false},
		},
		PrimaryKey: []string{"id"},
	})
	if err != nil {
		t.Fatalf("CreateTable failed: %v", err)
	}

	// Step 2: Seed some data
	env.store.InsertRow(ctx, env.wsID, "tasks", map[string]interface{}{"title": "Buy milk", "done": 0})
	env.store.InsertRow(ctx, env.wsID, "tasks", map[string]interface{}{"title": "Walk dog", "done": 1})

	// Step 3: Deploy JS code that defines API routes
	code := `
		exports.routes = {
			"GET /tasks": function(ctx) {
				return db.query("SELECT * FROM tasks ORDER BY id");
			},
			"POST /tasks": function(ctx) {
				var result = db.insert("tasks", { title: ctx.body.title, done: 0 });
				return { status: 201, body: result };
			},
			"GET /tasks/:id": function(ctx) {
				return db.queryOne("SELECT * FROM tasks WHERE id = ?", [ctx.params.id]);
			},
			"PUT /tasks/:id": function(ctx) {
				var result = db.update("tasks", { done: ctx.body.done }, { id: ctx.params.id });
				return result;
			},
			"DELETE /tasks/:id": function(ctx) {
				var result = db.delete("tasks", { id: ctx.params.id });
				return result;
			}
		};
	`
	env.loader.codes[env.wsID] = code

	// Step 4: GET /tasks — should return all tasks
	rec := env.doVMRequest("GET", "/tasks", nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("GET /tasks status = %d, want 200\nBody: %s", rec.Code, rec.Body.String())
	}
	var tasks []map[string]interface{}
	json.Unmarshal(rec.Body.Bytes(), &tasks)
	if len(tasks) != 2 {
		t.Fatalf("GET /tasks returned %d tasks, want 2", len(tasks))
	}

	// Step 5: POST /tasks — create a new task
	rec = env.doVMRequest("POST", "/tasks", map[string]interface{}{"title": "Read book"})
	if rec.Code != http.StatusCreated {
		t.Fatalf("POST /tasks status = %d, want 201\nBody: %s", rec.Code, rec.Body.String())
	}

	// Step 6: GET /tasks/:id — get single task
	rec = env.doVMRequest("GET", "/tasks/1", nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("GET /tasks/1 status = %d, want 200", rec.Code)
	}
	var task map[string]interface{}
	json.Unmarshal(rec.Body.Bytes(), &task)
	if task["title"] != "Buy milk" {
		t.Fatalf("task title = %v, want 'Buy milk'", task["title"])
	}

	// Step 7: PUT /tasks/:id — update task
	rec = env.doVMRequest("PUT", "/tasks/1", map[string]interface{}{"done": 1})
	if rec.Code != http.StatusOK {
		t.Fatalf("PUT /tasks/1 status = %d, want 200", rec.Code)
	}

	// Step 8: DELETE /tasks/:id — delete task
	rec = env.doVMRequest("DELETE", "/tasks/1", map[string]interface{}{})
	if rec.Code != http.StatusOK {
		t.Fatalf("DELETE /tasks/1 status = %d, want 200", rec.Code)
	}

	// Verify: GET /tasks should now return 2 tasks (original 2 - 1 deleted + 1 inserted)
	rec = env.doVMRequest("GET", "/tasks", nil)
	json.Unmarshal(rec.Body.Bytes(), &tasks)
	if len(tasks) != 2 {
		t.Fatalf("after CRUD: %d tasks, want 2", len(tasks))
	}
}

// ── Integration Test 2: Deploy → Dashboard Database View ─────────────

func TestIntegration_DashboardDatabaseView(t *testing.T) {
	env := newIntegrationEnv(t)
	ctx := context.Background()

	// Create table and insert data
	env.store.CreateTable(ctx, env.wsID, vmruntime.VMCreateTableRequest{
		Name: "products",
		Columns: []vmruntime.VMCreateColumnDef{
			{Name: "id", Type: "INTEGER", Nullable: false},
			{Name: "name", Type: "TEXT", Nullable: false},
			{Name: "price", Type: "REAL", Nullable: false},
		},
		PrimaryKey: []string{"id"},
	})
	env.store.InsertRow(ctx, env.wsID, "products", map[string]interface{}{"name": "Apple", "price": 1.5})
	env.store.InsertRow(ctx, env.wsID, "products", map[string]interface{}{"name": "Banana", "price": 0.75})
	env.store.InsertRow(ctx, env.wsID, "products", map[string]interface{}{"name": "Cherry", "price": 3.0})

	// Query via RuntimeDataHandler (simulates dashboard database view)
	rec := env.doDataQueryRequest("products", map[string]string{"page": "1", "page_size": "10"})
	if rec.Code != http.StatusOK {
		t.Fatalf("QueryRows status = %d, want 200\nBody: %s", rec.Code, rec.Body.String())
	}

	resp := parseJSON(t, rec)
	data := resp["data"].(map[string]interface{})
	total := data["total"].(float64)
	if total != 3 {
		t.Fatalf("total = %v, want 3", total)
	}
	rows := data["rows"].([]interface{})
	if len(rows) != 3 {
		t.Fatalf("rows = %d, want 3", len(rows))
	}

	// Insert via RuntimeDataHandler
	rec = env.doDataInsertRequest("products", map[string]interface{}{"name": "Date", "price": 5.0})
	if rec.Code != http.StatusOK {
		t.Fatalf("InsertRow status = %d, want 200\nBody: %s", rec.Code, rec.Body.String())
	}

	// Verify: total should now be 4
	rec = env.doDataQueryRequest("products", map[string]string{"page": "1", "page_size": "10"})
	resp = parseJSON(t, rec)
	data = resp["data"].(map[string]interface{})
	if data["total"].(float64) != 4 {
		t.Fatalf("after insert: total = %v, want 4", data["total"])
	}
}

// ── Integration Test 3: Code Update → Old VM Invalidated → New Code ──

func TestIntegration_CodeUpdateInvalidatesVM(t *testing.T) {
	env := newIntegrationEnv(t)

	// Deploy v1 code
	codeV1 := `exports.routes = { "GET /version": function() { return { version: 1 }; } };`
	env.loader.codes[env.wsID] = codeV1

	rec := env.doVMRequest("GET", "/version", nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("v1 status = %d, want 200", rec.Code)
	}
	v1Resp := parseJSON(t, rec)
	if v1Resp["version"].(float64) != 1 {
		t.Fatalf("v1 version = %v, want 1", v1Resp["version"])
	}

	// Deploy v2 code (update loader + invalidate pool)
	codeV2 := `exports.routes = { "GET /version": function() { return { version: 2 }; } };`
	env.loader.codes[env.wsID] = codeV2
	env.pool.Invalidate(env.wsID)

	rec = env.doVMRequest("GET", "/version", nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("v2 status = %d, want 200", rec.Code)
	}
	v2Resp := parseJSON(t, rec)
	if v2Resp["version"].(float64) != 2 {
		t.Fatalf("v2 version = %v, want 2", v2Resp["version"])
	}

	// Deploy v3 — also add a new route
	codeV3 := `exports.routes = {
		"GET /version": function() { return { version: 3 }; },
		"GET /new-endpoint": function() { return { added: true }; }
	};`
	env.loader.codes[env.wsID] = codeV3
	env.pool.Invalidate(env.wsID)

	rec = env.doVMRequest("GET", "/version", nil)
	v3Resp := parseJSON(t, rec)
	if v3Resp["version"].(float64) != 3 {
		t.Fatalf("v3 version = %v, want 3", v3Resp["version"])
	}

	rec = env.doVMRequest("GET", "/new-endpoint", nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("new-endpoint status = %d, want 200", rec.Code)
	}
	newResp := parseJSON(t, rec)
	if newResp["added"] != true {
		t.Fatalf("new-endpoint added = %v, want true", newResp["added"])
	}
}

// ── Integration Test 4: JS Syntax Error → Friendly Error ─────────────

func TestIntegration_SyntaxError_FriendlyMessage(t *testing.T) {
	env := newIntegrationEnv(t)

	// Deploy broken JS code
	env.loader.codes[env.wsID] = `function( { broken syntax`

	rec := env.doVMRequest("GET", "/anything", nil)
	// Should return 503 (VM not available)
	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("syntax error status = %d, want 503\nBody: %s", rec.Code, rec.Body.String())
	}

	resp := parseJSON(t, rec)
	errMsg, _ := resp["error"].(string)
	if errMsg == "" {
		t.Fatal("error message should not be empty")
	}
	// Should mention VM creation issue, not expose raw panic
	if !strings.Contains(errMsg, "VM not available") {
		t.Fatalf("error = %q, should contain 'VM not available'", errMsg)
	}
}

// ── Integration Test 5: JS Infinite Loop → Timeout ───────────────────

func TestIntegration_InfiniteLoop_Timeout(t *testing.T) {
	env := newIntegrationEnv(t)

	// Deploy code with infinite loop in handler
	env.loader.codes[env.wsID] = `
		exports.routes = {
			"GET /loop": function(ctx) {
				while(true) {}
				return {};
			},
			"GET /ok": function(ctx) {
				return { ok: true };
			}
		};
	`

	// The /ok route should work fine
	rec := env.doVMRequest("GET", "/ok", nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("/ok status = %d, want 200", rec.Code)
	}

	// The /loop route should timeout and return 500
	rec = env.doVMRequest("GET", "/loop", nil)
	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("/loop status = %d, want 500\nBody: %s", rec.Code, rec.Body.String())
	}

	resp := parseJSON(t, rec)
	errMsg, _ := resp["error"].(string)
	if !strings.Contains(errMsg, "timeout") && !strings.Contains(errMsg, "interrupt") {
		t.Fatalf("error = %q, should mention timeout/interrupt", errMsg)
	}
}

// ── Integration Test: 404 for unknown workspace slug ─────────────────

func TestIntegration_UnknownSlug_404(t *testing.T) {
	env := newIntegrationEnv(t)
	env.loader.codes[env.wsID] = `exports.routes = {};`

	// Use a non-existent slug
	url := "/runtime/nonexistent/api/anything"
	req := httptest.NewRequest("GET", url, nil)
	rec := httptest.NewRecorder()
	c := env.echo.NewContext(req, rec)
	c.SetParamNames("workspaceSlug", "*")
	c.SetParamValues("nonexistent", "/anything")

	env.vmHandler.HandleAPI(c)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("unknown slug status = %d, want 404\nBody: %s", rec.Code, rec.Body.String())
	}
}

// ── Integration Test: No code deployed → 503 ────────────────────────

func TestIntegration_NoCodeDeployed_503(t *testing.T) {
	env := newIntegrationEnv(t)
	// Don't set any code in loader

	rec := env.doVMRequest("GET", "/anything", nil)
	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("no code status = %d, want 503\nBody: %s", rec.Code, rec.Body.String())
	}

	resp := parseJSON(t, rec)
	errMsg, _ := resp["error"].(string)
	if !strings.Contains(errMsg, "no logic code") {
		t.Fatalf("error = %q, should mention 'no logic code'", errMsg)
	}
}

// ── Integration Test: VM route 404 ──────────────────────────────────

func TestIntegration_VMRoute404(t *testing.T) {
	env := newIntegrationEnv(t)
	env.loader.codes[env.wsID] = `exports.routes = { "GET /exists": function() { return { ok: true }; } };`

	// Access existing route
	rec := env.doVMRequest("GET", "/exists", nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("/exists status = %d, want 200", rec.Code)
	}

	// Access non-existing route
	rec = env.doVMRequest("GET", "/not-here", nil)
	if rec.Code != http.StatusNotFound {
		t.Fatalf("/not-here status = %d, want 404", rec.Code)
	}
}

// ── Integration Test: Query params and headers passed to VM ─────────

func TestIntegration_QueryParamsAndHeaders(t *testing.T) {
	env := newIntegrationEnv(t)
	env.loader.codes[env.wsID] = `
		exports.routes = {
			"GET /echo": function(ctx) {
				return {
					q: ctx.query.search,
					contentType: ctx.headers["content-type"]
				};
			}
		};
	`

	url := "/runtime/" + env.slug + "/api/echo?search=hello"
	req := httptest.NewRequest("GET", url, nil)
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	c := env.echo.NewContext(req, rec)
	c.SetParamNames("workspaceSlug", "*")
	c.SetParamValues(env.slug, "/echo")

	env.vmHandler.HandleAPI(c)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200\nBody: %s", rec.Code, rec.Body.String())
	}
	resp := parseJSON(t, rec)
	if resp["q"] != "hello" {
		t.Fatalf("q = %v, want hello", resp["q"])
	}
	if resp["contentType"] != "application/json" {
		t.Fatalf("contentType = %v, want application/json", resp["contentType"])
	}
}
