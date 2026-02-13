package vmruntime

import (
	"testing"

	_ "modernc.org/sqlite"
)

// toSliceOfMaps converts goja-exported body to []map[string]interface{}.
// goja may return []map[string]interface{} or []interface{} depending on the Go source.
func toSliceOfMaps(t *testing.T, body interface{}) []map[string]interface{} {
	t.Helper()
	switch v := body.(type) {
	case []map[string]interface{}:
		return v
	case []interface{}:
		out := make([]map[string]interface{}, len(v))
		for i, item := range v {
			m, ok := item.(map[string]interface{})
			if !ok {
				t.Fatalf("row[%d] type = %T, want map[string]interface{}", i, item)
			}
			out[i] = m
		}
		return out
	default:
		t.Fatalf("body type = %T, want slice of maps", body)
		return nil
	}
}

// toInt64 converts a numeric value to int64 (goja may export int64 or float64).
func toInt64(v interface{}) int64 {
	switch n := v.(type) {
	case int64:
		return n
	case float64:
		return int64(n)
	case int:
		return int64(n)
	default:
		return 0
	}
}

// setupDBWithTable creates an in-memory SQLite DB with a "tasks" table seeded with data.
func setupDBWithTable(t *testing.T) *WorkspaceVM {
	t.Helper()
	db := newTestDB(t)

	// Create table and seed data directly
	db.Exec(`CREATE TABLE tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0)`)
	db.Exec(`INSERT INTO tasks (title, done) VALUES ('Buy milk', 0)`)
	db.Exec(`INSERT INTO tasks (title, done) VALUES ('Walk dog', 1)`)
	db.Exec(`INSERT INTO tasks (title, done) VALUES ('Read book', 0)`)

	code := `
		exports.routes = {
			"GET /tasks": function(ctx) {
				var rows = db.query("SELECT * FROM tasks ORDER BY id");
				return rows;
			},
			"GET /tasks/done": function(ctx) {
				var rows = db.query("SELECT * FROM tasks WHERE done = ?", [1]);
				return rows;
			},
			"GET /tasks/first": function(ctx) {
				var row = db.queryOne("SELECT * FROM tasks ORDER BY id LIMIT 1");
				return row;
			},
			"GET /tasks/none": function(ctx) {
				var row = db.queryOne("SELECT * FROM tasks WHERE id = -1");
				return row;
			},
			"POST /tasks": function(ctx) {
				var result = db.insert("tasks", { title: ctx.body.title, done: 0 });
				return result;
			},
			"PUT /tasks": function(ctx) {
				var result = db.update("tasks", { done: 1 }, { id: ctx.body.id });
				return result;
			},
			"DELETE /tasks": function(ctx) {
				var result = db.delete("tasks", { id: ctx.body.id });
				return result;
			},
			"POST /tasks/execute": function(ctx) {
				var result = db.execute("UPDATE tasks SET done = 1 WHERE done = 0");
				return result;
			}
		};
	`

	vm, err := NewWorkspaceVM("ws-db-test", code, db)
	if err != nil {
		t.Fatalf("NewWorkspaceVM failed: %v", err)
	}
	return vm
}

// ── db.query ─────────────────────────────────────────────────────────

func TestDBAPI_Query_All(t *testing.T) {
	vm := setupDBWithTable(t)

	resp, err := vm.Handle(VMRequest{Method: "GET", Path: "/tasks"})
	if err != nil {
		t.Fatalf("Handle failed: %v", err)
	}

	rows := toSliceOfMaps(t, resp.Body)
	if len(rows) != 3 {
		t.Fatalf("rows = %d, want 3", len(rows))
	}

	if rows[0]["title"] != "Buy milk" {
		t.Fatalf("first title = %v, want 'Buy milk'", rows[0]["title"])
	}
}

func TestDBAPI_Query_WithParams(t *testing.T) {
	vm := setupDBWithTable(t)

	resp, _ := vm.Handle(VMRequest{Method: "GET", Path: "/tasks/done"})
	rows := toSliceOfMaps(t, resp.Body)
	if len(rows) != 1 {
		t.Fatalf("done rows = %d, want 1", len(rows))
	}
	if rows[0]["title"] != "Walk dog" {
		t.Fatalf("done task = %v, want 'Walk dog'", rows[0]["title"])
	}
}

// ── db.queryOne ──────────────────────────────────────────────────────

func TestDBAPI_QueryOne(t *testing.T) {
	vm := setupDBWithTable(t)

	resp, _ := vm.Handle(VMRequest{Method: "GET", Path: "/tasks/first"})
	row, ok := resp.Body.(map[string]interface{})
	if !ok {
		t.Fatalf("body type = %T, want map", resp.Body)
	}
	if row["title"] != "Buy milk" {
		t.Fatalf("first = %v, want 'Buy milk'", row["title"])
	}
}

func TestDBAPI_QueryOne_NoResult(t *testing.T) {
	vm := setupDBWithTable(t)

	resp, _ := vm.Handle(VMRequest{Method: "GET", Path: "/tasks/none"})
	// null return → status 200, body nil
	if resp.Status != 200 {
		t.Fatalf("status = %d, want 200", resp.Status)
	}
	if resp.Body != nil {
		t.Fatalf("body = %v, want nil", resp.Body)
	}
}

// ── db.insert ────────────────────────────────────────────────────────

func TestDBAPI_Insert(t *testing.T) {
	vm := setupDBWithTable(t)

	resp, err := vm.Handle(VMRequest{
		Method: "POST",
		Path:   "/tasks",
		Body:   map[string]interface{}{"title": "New task"},
	})
	if err != nil {
		t.Fatalf("Handle failed: %v", err)
	}

	result := resp.Body.(map[string]interface{})
	affected := toInt64(result["affectedRows"])
	if affected != 1 {
		t.Fatalf("affectedRows = %v, want 1", affected)
	}
	if result["lastInsertId"] == nil {
		t.Fatal("lastInsertId should not be nil")
	}

	// Verify the row was inserted
	verifyResp, _ := vm.Handle(VMRequest{Method: "GET", Path: "/tasks"})
	rows := toSliceOfMaps(t, verifyResp.Body)
	if len(rows) != 4 {
		t.Fatalf("after insert: rows = %d, want 4", len(rows))
	}
}

// ── db.update ────────────────────────────────────────────────────────

func TestDBAPI_Update(t *testing.T) {
	vm := setupDBWithTable(t)

	resp, err := vm.Handle(VMRequest{
		Method: "PUT",
		Path:   "/tasks",
		Body:   map[string]interface{}{"id": int64(1)},
	})
	if err != nil {
		t.Fatalf("Handle failed: %v", err)
	}

	result := resp.Body.(map[string]interface{})
	if toInt64(result["affectedRows"]) != 1 {
		t.Fatalf("affectedRows = %v, want 1", result["affectedRows"])
	}

	// Verify update
	verifyResp, _ := vm.Handle(VMRequest{Method: "GET", Path: "/tasks/done"})
	rows := toSliceOfMaps(t, verifyResp.Body)
	if len(rows) != 2 {
		t.Fatalf("after update: done rows = %d, want 2", len(rows))
	}
}

// ── db.delete ────────────────────────────────────────────────────────

func TestDBAPI_Delete(t *testing.T) {
	vm := setupDBWithTable(t)

	resp, err := vm.Handle(VMRequest{
		Method: "DELETE",
		Path:   "/tasks",
		Body:   map[string]interface{}{"id": int64(1)},
	})
	if err != nil {
		t.Fatalf("Handle failed: %v", err)
	}

	result := resp.Body.(map[string]interface{})
	if toInt64(result["affectedRows"]) != 1 {
		t.Fatalf("affectedRows = %v, want 1", result["affectedRows"])
	}

	// Verify
	verifyResp, _ := vm.Handle(VMRequest{Method: "GET", Path: "/tasks"})
	rows := toSliceOfMaps(t, verifyResp.Body)
	if len(rows) != 2 {
		t.Fatalf("after delete: rows = %d, want 2", len(rows))
	}
}

// ── db.execute ───────────────────────────────────────────────────────

func TestDBAPI_Execute(t *testing.T) {
	vm := setupDBWithTable(t)

	resp, err := vm.Handle(VMRequest{
		Method: "POST",
		Path:   "/tasks/execute",
	})
	if err != nil {
		t.Fatalf("Handle failed: %v", err)
	}

	result := resp.Body.(map[string]interface{})
	// 2 tasks had done=0 (Buy milk, Read book)
	if toInt64(result["affectedRows"]) != 2 {
		t.Fatalf("affectedRows = %v, want 2", result["affectedRows"])
	}
}

// ── Error cases ──────────────────────────────────────────────────────

func TestDBAPI_Query_InvalidSQL(t *testing.T) {
	db := newTestDB(t)
	code := `
		exports.routes = {
			"GET /bad": function(ctx) {
				return db.query("SELECT * FROM nonexistent_table");
			}
		};
	`
	vm, _ := NewWorkspaceVM("ws-db-err", code, db)

	_, err := vm.Handle(VMRequest{Method: "GET", Path: "/bad"})
	if err == nil {
		t.Fatal("expected error for query on nonexistent table")
	}
}

func TestDBAPI_Insert_EmptyData(t *testing.T) {
	db := newTestDB(t)
	db.Exec(`CREATE TABLE t (id INTEGER PRIMARY KEY, name TEXT)`)
	code := `
		exports.routes = {
			"POST /bad": function(ctx) {
				return db.insert("t", {});
			}
		};
	`
	vm, _ := NewWorkspaceVM("ws-db-err2", code, db)

	_, err := vm.Handle(VMRequest{Method: "POST", Path: "/bad"})
	if err == nil {
		t.Fatal("expected error for insert with empty data")
	}
}
