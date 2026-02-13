package vmruntime

import (
	"database/sql"
	"sort"
	"testing"

	_ "modernc.org/sqlite"
)

// newTestDB creates an in-memory SQLite database for testing.
func newTestDB(t *testing.T) *sql.DB {
	t.Helper()
	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatalf("open memory db: %v", err)
	}
	t.Cleanup(func() { db.Close() })
	return db
}

// ── NewWorkspaceVM basic ─────────────────────────────────────────────

func TestNewWorkspaceVM_SimpleRoutes(t *testing.T) {
	db := newTestDB(t)
	code := `
		exports.routes = {
			"GET /hello": function(ctx) {
				return { message: "world" };
			},
			"POST /echo": function(ctx) {
				return { body: ctx.body };
			}
		};
	`

	vm, err := NewWorkspaceVM("ws-test-1", code, db)
	if err != nil {
		t.Fatalf("NewWorkspaceVM failed: %v", err)
	}

	routes := vm.Routes()
	sort.Strings(routes)
	if len(routes) != 2 {
		t.Fatalf("routes count = %d, want 2", len(routes))
	}
	if routes[0] != "GET /hello" || routes[1] != "POST /echo" {
		t.Fatalf("routes = %v, want [GET /hello, POST /echo]", routes)
	}
}

func TestNewWorkspaceVM_EmptyExports(t *testing.T) {
	db := newTestDB(t)
	code := `exports.routes = {};`

	vm, err := NewWorkspaceVM("ws-test-2", code, db)
	if err != nil {
		t.Fatalf("NewWorkspaceVM failed: %v", err)
	}
	if len(vm.Routes()) != 0 {
		t.Fatalf("expected 0 routes, got %d", len(vm.Routes()))
	}
}

func TestNewWorkspaceVM_NoExportsRoutes(t *testing.T) {
	db := newTestDB(t)
	code := `var x = 42;`

	vm, err := NewWorkspaceVM("ws-test-3", code, db)
	if err != nil {
		t.Fatalf("NewWorkspaceVM failed: %v", err)
	}
	if len(vm.Routes()) != 0 {
		t.Fatalf("expected 0 routes, got %d", len(vm.Routes()))
	}
}

func TestNewWorkspaceVM_SyntaxError(t *testing.T) {
	db := newTestDB(t)
	code := `function( { broken syntax`

	_, err := NewWorkspaceVM("ws-test-4", code, db)
	if err == nil {
		t.Fatal("expected error for syntax error code")
	}
}

func TestNewWorkspaceVM_CodeHash(t *testing.T) {
	db := newTestDB(t)
	code := `exports.routes = {};`

	vm, _ := NewWorkspaceVM("ws-test-5", code, db)
	hash := vm.CodeHash()
	if hash == "" {
		t.Fatal("CodeHash should not be empty")
	}
	if len(hash) != 64 { // SHA-256 hex
		t.Fatalf("CodeHash length = %d, want 64", len(hash))
	}

	// Same code → same hash
	vm2, _ := NewWorkspaceVM("ws-test-5b", code, db)
	if vm2.CodeHash() != hash {
		t.Fatal("same code should produce same hash")
	}

	// Different code → different hash
	vm3, _ := NewWorkspaceVM("ws-test-5c", `exports.routes = { "GET /x": function() { return 1; } };`, db)
	if vm3.CodeHash() == hash {
		t.Fatal("different code should produce different hash")
	}
}

// ── Handle requests ──────────────────────────────────────────────────

func TestWorkspaceVM_Handle_SimpleGet(t *testing.T) {
	db := newTestDB(t)
	code := `
		exports.routes = {
			"GET /ping": function(ctx) {
				return { status: 200, body: { pong: true } };
			}
		};
	`
	vm, _ := NewWorkspaceVM("ws-handle-1", code, db)

	resp, err := vm.Handle(VMRequest{
		Method: "GET",
		Path:   "/ping",
	})
	if err != nil {
		t.Fatalf("Handle failed: %v", err)
	}
	if resp.Status != 200 {
		t.Fatalf("status = %d, want 200", resp.Status)
	}
	body, ok := resp.Body.(map[string]interface{})
	if !ok {
		t.Fatalf("body type = %T, want map", resp.Body)
	}
	if body["pong"] != true {
		t.Fatalf("pong = %v, want true", body["pong"])
	}
}

func TestWorkspaceVM_Handle_404(t *testing.T) {
	db := newTestDB(t)
	code := `exports.routes = { "GET /exists": function() { return {}; } };`
	vm, _ := NewWorkspaceVM("ws-handle-2", code, db)

	resp, err := vm.Handle(VMRequest{Method: "GET", Path: "/nonexistent"})
	if err != nil {
		t.Fatalf("Handle failed: %v", err)
	}
	if resp.Status != 404 {
		t.Fatalf("status = %d, want 404", resp.Status)
	}
}

func TestWorkspaceVM_Handle_PostWithBody(t *testing.T) {
	db := newTestDB(t)
	code := `
		exports.routes = {
			"POST /items": function(ctx) {
				return { received: ctx.body.name };
			}
		};
	`
	vm, _ := NewWorkspaceVM("ws-handle-3", code, db)

	resp, err := vm.Handle(VMRequest{
		Method: "POST",
		Path:   "/items",
		Body:   map[string]interface{}{"name": "test-item"},
	})
	if err != nil {
		t.Fatalf("Handle failed: %v", err)
	}
	if resp.Status != 200 {
		t.Fatalf("status = %d, want 200", resp.Status)
	}
	body := resp.Body.(map[string]interface{})
	if body["received"] != "test-item" {
		t.Fatalf("received = %v, want test-item", body["received"])
	}
}

func TestWorkspaceVM_Handle_QueryParams(t *testing.T) {
	db := newTestDB(t)
	code := `
		exports.routes = {
			"GET /search": function(ctx) {
				return { q: ctx.query.q };
			}
		};
	`
	vm, _ := NewWorkspaceVM("ws-handle-4", code, db)

	resp, _ := vm.Handle(VMRequest{
		Method: "GET",
		Path:   "/search",
		Query:  map[string]string{"q": "hello"},
	})
	body := resp.Body.(map[string]interface{})
	if body["q"] != "hello" {
		t.Fatalf("q = %v, want hello", body["q"])
	}
}

func TestWorkspaceVM_Handle_PathParams(t *testing.T) {
	db := newTestDB(t)
	code := `
		exports.routes = {
			"GET /users/:id": function(ctx) {
				return { userId: ctx.params.id };
			}
		};
	`
	vm, _ := NewWorkspaceVM("ws-handle-5", code, db)

	resp, _ := vm.Handle(VMRequest{
		Method: "GET",
		Path:   "/users/42",
	})
	body := resp.Body.(map[string]interface{})
	if body["userId"] != "42" {
		t.Fatalf("userId = %v, want 42", body["userId"])
	}
}

func TestWorkspaceVM_Handle_CustomStatus(t *testing.T) {
	db := newTestDB(t)
	code := `
		exports.routes = {
			"POST /create": function(ctx) {
				return { status: 201, body: { created: true } };
			}
		};
	`
	vm, _ := NewWorkspaceVM("ws-handle-6", code, db)

	resp, _ := vm.Handle(VMRequest{Method: "POST", Path: "/create"})
	if resp.Status != 201 {
		t.Fatalf("status = %d, want 201", resp.Status)
	}
}

func TestWorkspaceVM_Handle_NullReturn(t *testing.T) {
	db := newTestDB(t)
	code := `
		exports.routes = {
			"DELETE /noop": function(ctx) {
				return null;
			}
		};
	`
	vm, _ := NewWorkspaceVM("ws-handle-7", code, db)

	resp, err := vm.Handle(VMRequest{Method: "DELETE", Path: "/noop"})
	if err != nil {
		t.Fatalf("Handle failed: %v", err)
	}
	if resp.Status != 200 {
		t.Fatalf("status = %d, want 200", resp.Status)
	}
}

// ── Route matching ───────────────────────────────────────────────────

func TestMatchPath(t *testing.T) {
	tests := []struct {
		pattern string
		path    string
		match   bool
		params  map[string]string
	}{
		{"/users", "/users", true, map[string]string{}},
		{"/users/:id", "/users/42", true, map[string]string{"id": "42"}},
		{"/a/:x/b/:y", "/a/1/b/2", true, map[string]string{"x": "1", "y": "2"}},
		{"/users/:id", "/users", false, nil},
		{"/users", "/users/42", false, nil},
		{"/x", "/y", false, nil},
	}

	for _, tc := range tests {
		params, matched := matchPath(tc.pattern, tc.path)
		if matched != tc.match {
			t.Errorf("matchPath(%q, %q) matched = %v, want %v", tc.pattern, tc.path, matched, tc.match)
		}
		if matched && tc.params != nil {
			for k, v := range tc.params {
				if params[k] != v {
					t.Errorf("matchPath(%q, %q) param[%s] = %q, want %q", tc.pattern, tc.path, k, params[k], v)
				}
			}
		}
	}
}

func TestNormalizePath(t *testing.T) {
	tests := []struct {
		input string
		want  string
	}{
		{"/foo", "/foo"},
		{"foo", "/foo"},
		{"/foo/", "/foo"},
		{"/", "/"},
		{"", "/"},
	}
	for _, tc := range tests {
		got := normalizePath(tc.input)
		if got != tc.want {
			t.Errorf("normalizePath(%q) = %q, want %q", tc.input, got, tc.want)
		}
	}
}

func TestToInt(t *testing.T) {
	if v, ok := toInt(42); !ok || v != 42 {
		t.Errorf("toInt(42) = %d, %v", v, ok)
	}
	if v, ok := toInt(int64(100)); !ok || v != 100 {
		t.Errorf("toInt(int64(100)) = %d, %v", v, ok)
	}
	if v, ok := toInt(3.14); !ok || v != 3 {
		t.Errorf("toInt(3.14) = %d, %v", v, ok)
	}
	if _, ok := toInt("not a number"); ok {
		t.Error("toInt(string) should return false")
	}
}
