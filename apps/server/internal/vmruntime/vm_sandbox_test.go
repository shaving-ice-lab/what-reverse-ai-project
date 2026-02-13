package vmruntime

import (
	"strings"
	"testing"

	_ "modernc.org/sqlite"
)

// ── Dangerous APIs are disabled ──────────────────────────────────────

func TestSandbox_RequireDisabled(t *testing.T) {
	db := newTestDB(t)
	code := `
		exports.routes = {
			"GET /test": function(ctx) {
				var val = (typeof require);
				return { type: val };
			}
		};
	`
	vm, err := NewWorkspaceVM("ws-sandbox-1", code, db)
	if err != nil {
		t.Fatalf("NewWorkspaceVM failed: %v", err)
	}

	resp, _ := vm.Handle(VMRequest{Method: "GET", Path: "/test"})
	body := resp.Body.(map[string]interface{})
	if body["type"] != "undefined" {
		t.Fatalf("require type = %v, want 'undefined'", body["type"])
	}
}

func TestSandbox_ProcessDisabled(t *testing.T) {
	db := newTestDB(t)
	code := `
		exports.routes = {
			"GET /test": function(ctx) {
				return { type: (typeof process) };
			}
		};
	`
	vm, _ := NewWorkspaceVM("ws-sandbox-2", code, db)
	resp, _ := vm.Handle(VMRequest{Method: "GET", Path: "/test"})
	body := resp.Body.(map[string]interface{})
	if body["type"] != "undefined" {
		t.Fatalf("process type = %v, want 'undefined'", body["type"])
	}
}

func TestSandbox_EvalDisabled(t *testing.T) {
	db := newTestDB(t)
	code := `
		exports.routes = {
			"GET /test": function(ctx) {
				return { type: (typeof eval) };
			}
		};
	`
	vm, _ := NewWorkspaceVM("ws-sandbox-3", code, db)
	resp, _ := vm.Handle(VMRequest{Method: "GET", Path: "/test"})
	body := resp.Body.(map[string]interface{})
	if body["type"] != "undefined" {
		t.Fatalf("eval type = %v, want 'undefined'", body["type"])
	}
}

func TestSandbox_FunctionConstructorDisabled(t *testing.T) {
	db := newTestDB(t)
	code := `
		exports.routes = {
			"GET /test": function(ctx) {
				return { type: (typeof Function) };
			}
		};
	`
	vm, _ := NewWorkspaceVM("ws-sandbox-4", code, db)
	resp, _ := vm.Handle(VMRequest{Method: "GET", Path: "/test"})
	body := resp.Body.(map[string]interface{})
	if body["type"] != "undefined" {
		t.Fatalf("Function type = %v, want 'undefined'", body["type"])
	}
}

// ── Code size limit ──────────────────────────────────────────────────

func TestSandbox_CodeSizeLimit(t *testing.T) {
	db := newTestDB(t)
	// Create code larger than VMMaxCodeSize (1MB)
	bigCode := strings.Repeat("x", VMMaxCodeSize+1)
	_, err := NewWorkspaceVM("ws-sandbox-big", bigCode, db)
	if err == nil {
		t.Fatal("expected error for oversized code")
	}
	if !strings.Contains(err.Error(), "code size") {
		t.Fatalf("error = %v, want 'code size' mention", err)
	}
}

// ── Timeout: code loading ────────────────────────────────────────────

func TestSandbox_LoadTimeout(t *testing.T) {
	db := newTestDB(t)
	// Infinite loop during load
	code := `while(true) {}`
	_, err := NewWorkspaceVM("ws-sandbox-timeout", code, db)
	if err == nil {
		t.Fatal("expected error for infinite loop during load")
	}
	if !strings.Contains(err.Error(), "timeout") && !strings.Contains(err.Error(), "interrupt") {
		t.Fatalf("error = %v, want timeout/interrupt mention", err)
	}
}

func TestSandbox_ExecTimeout(t *testing.T) {
	db := newTestDB(t)
	code := `
		exports.routes = {
			"GET /loop": function(ctx) {
				while(true) {}
				return {};
			}
		};
	`
	vm, err := NewWorkspaceVM("ws-sandbox-exec-timeout", code, db)
	if err != nil {
		t.Fatalf("NewWorkspaceVM failed: %v", err)
	}

	_, err = vm.Handle(VMRequest{Method: "GET", Path: "/loop"})
	if err == nil {
		t.Fatal("expected error for infinite loop in handler")
	}
	if !strings.Contains(err.Error(), "timeout") && !strings.Contains(err.Error(), "interrupt") {
		t.Fatalf("error = %v, want timeout/interrupt mention", err)
	}
}

// ── Console API exists ───────────────────────────────────────────────

func TestSandbox_ConsoleExists(t *testing.T) {
	db := newTestDB(t)
	code := `
		exports.routes = {
			"GET /test": function(ctx) {
				console.log("hello");
				console.warn("warn");
				console.error("error");
				console.info("info");
				return { ok: true };
			}
		};
	`
	vm, _ := NewWorkspaceVM("ws-sandbox-console", code, db)
	resp, err := vm.Handle(VMRequest{Method: "GET", Path: "/test"})
	if err != nil {
		t.Fatalf("Handle failed: %v", err)
	}
	body := resp.Body.(map[string]interface{})
	if body["ok"] != true {
		t.Fatalf("ok = %v, want true", body["ok"])
	}
}

// ── db API exists in sandbox ─────────────────────────────────────────

func TestSandbox_DBAPIExists(t *testing.T) {
	db := newTestDB(t)
	code := `
		exports.routes = {
			"GET /test": function(ctx) {
				return {
					hasQuery:    typeof db.query === 'function',
					hasQueryOne: typeof db.queryOne === 'function',
					hasInsert:   typeof db.insert === 'function',
					hasUpdate:   typeof db.update === 'function',
					hasDelete:   typeof db.delete === 'function',
					hasExecute:  typeof db.execute === 'function'
				};
			}
		};
	`
	vm, _ := NewWorkspaceVM("ws-sandbox-dbapi", code, db)
	resp, _ := vm.Handle(VMRequest{Method: "GET", Path: "/test"})
	body := resp.Body.(map[string]interface{})

	for _, key := range []string{"hasQuery", "hasQueryOne", "hasInsert", "hasUpdate", "hasDelete", "hasExecute"} {
		if body[key] != true {
			t.Fatalf("%s = %v, want true", key, body[key])
		}
	}
}
