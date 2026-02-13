package vmruntime

import (
	"context"
	"database/sql"
	"fmt"
	"runtime"
	"testing"

	_ "modernc.org/sqlite"
)

// ── Benchmark 1: VM Creation Speed (target < 50ms) ──────────────────

func BenchmarkNewWorkspaceVM(b *testing.B) {
	db := benchDB(b)
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
				return db.update("tasks", { done: ctx.body.done }, { id: ctx.params.id });
			},
			"DELETE /tasks/:id": function(ctx) {
				return db.delete("tasks", { id: ctx.params.id });
			}
		};
	`

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := NewWorkspaceVM(fmt.Sprintf("ws-bench-%d", i), code, db)
		if err != nil {
			b.Fatalf("NewWorkspaceVM failed: %v", err)
		}
	}
}

// ── Benchmark 2: Request Handling Latency (target < 10ms) ────────────

func BenchmarkVMHandle_SimpleReturn(b *testing.B) {
	db := benchDB(b)
	code := `
		exports.routes = {
			"GET /ping": function(ctx) {
				return { status: 200, body: { pong: true, ts: Date.now() } };
			}
		};
	`
	vm, err := NewWorkspaceVM("ws-bench-handle", code, db)
	if err != nil {
		b.Fatalf("NewWorkspaceVM failed: %v", err)
	}

	req := VMRequest{Method: "GET", Path: "/ping"}
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := vm.Handle(req)
		if err != nil {
			b.Fatalf("Handle failed: %v", err)
		}
	}
}

func BenchmarkVMHandle_WithQueryParams(b *testing.B) {
	db := benchDB(b)
	code := `
		exports.routes = {
			"GET /search": function(ctx) {
				return { q: ctx.query.q, page: ctx.query.page };
			}
		};
	`
	vm, _ := NewWorkspaceVM("ws-bench-query", code, db)

	req := VMRequest{
		Method: "GET",
		Path:   "/search",
		Query:  map[string]string{"q": "hello", "page": "1"},
	}
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		vm.Handle(req)
	}
}

func BenchmarkVMHandle_PathParams(b *testing.B) {
	db := benchDB(b)
	code := `
		exports.routes = {
			"GET /users/:id": function(ctx) {
				return { userId: ctx.params.id };
			}
		};
	`
	vm, _ := NewWorkspaceVM("ws-bench-params", code, db)

	req := VMRequest{Method: "GET", Path: "/users/42"}
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		vm.Handle(req)
	}
}

func BenchmarkVMHandle_DBQuery(b *testing.B) {
	db := benchDB(b)
	db.Exec(`CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT)`)
	for i := 0; i < 10; i++ {
		db.Exec(`INSERT INTO items (name) VALUES (?)`, fmt.Sprintf("item-%d", i))
	}

	code := `
		exports.routes = {
			"GET /items": function(ctx) {
				return db.query("SELECT * FROM items");
			}
		};
	`
	vm, _ := NewWorkspaceVM("ws-bench-dbquery", code, db)

	req := VMRequest{Method: "GET", Path: "/items"}
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		vm.Handle(req)
	}
}

func BenchmarkVMHandle_DBInsert(b *testing.B) {
	db := benchDB(b)
	db.Exec(`CREATE TABLE logs (id INTEGER PRIMARY KEY, msg TEXT)`)

	code := `
		exports.routes = {
			"POST /logs": function(ctx) {
				return db.insert("logs", { msg: ctx.body.msg });
			}
		};
	`
	vm, _ := NewWorkspaceVM("ws-bench-dbinsert", code, db)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		vm.Handle(VMRequest{
			Method: "POST",
			Path:   "/logs",
			Body:   map[string]interface{}{"msg": fmt.Sprintf("log-%d", i)},
		})
	}
}

// ── Benchmark 3: SQLite Query Latency (target < 5ms, 1000-row table) ─

func BenchmarkSQLiteQuery_1000Rows(b *testing.B) {
	store, cleanup := benchStore(b)
	defer cleanup()
	ctx := context.Background()
	wsID := "ws-bench-sqlite-1k"

	store.CreateTable(ctx, wsID, VMCreateTableRequest{
		Name: "records",
		Columns: []VMCreateColumnDef{
			{Name: "id", Type: "INTEGER", Nullable: false},
			{Name: "name", Type: "TEXT", Nullable: false},
			{Name: "value", Type: "REAL", Nullable: false},
			{Name: "active", Type: "INTEGER", Nullable: false},
		},
		PrimaryKey: []string{"id"},
	})

	// Seed 1000 rows
	db, _ := store.GetDB(wsID)
	tx, _ := db.Begin()
	stmt, _ := tx.Prepare(`INSERT INTO records (name, value, active) VALUES (?, ?, ?)`)
	for i := 0; i < 1000; i++ {
		stmt.Exec(fmt.Sprintf("record-%d", i), float64(i)*1.5, i%2)
	}
	stmt.Close()
	tx.Commit()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := store.QueryRows(ctx, wsID, "records", VMQueryParams{
			Page: 1, PageSize: 50,
		})
		if err != nil {
			b.Fatalf("QueryRows failed: %v", err)
		}
	}
}

func BenchmarkSQLiteQuery_1000Rows_WithFilter(b *testing.B) {
	store, cleanup := benchStore(b)
	defer cleanup()
	ctx := context.Background()
	wsID := "ws-bench-sqlite-filter"

	store.CreateTable(ctx, wsID, VMCreateTableRequest{
		Name: "records",
		Columns: []VMCreateColumnDef{
			{Name: "id", Type: "INTEGER", Nullable: false},
			{Name: "name", Type: "TEXT", Nullable: false},
			{Name: "value", Type: "REAL", Nullable: false},
			{Name: "active", Type: "INTEGER", Nullable: false},
		},
		PrimaryKey: []string{"id"},
		Indexes:    []VMCreateIndexDef{{Name: "idx_active", Columns: []string{"active"}}},
	})

	db, _ := store.GetDB(wsID)
	tx, _ := db.Begin()
	stmt, _ := tx.Prepare(`INSERT INTO records (name, value, active) VALUES (?, ?, ?)`)
	for i := 0; i < 1000; i++ {
		stmt.Exec(fmt.Sprintf("record-%d", i), float64(i)*1.5, i%2)
	}
	stmt.Close()
	tx.Commit()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := store.QueryRows(ctx, wsID, "records", VMQueryParams{
			Page: 1, PageSize: 50,
			Filters: []VMQueryFilter{{Column: "active", Operator: "=", Value: "1"}},
			OrderBy: "value", OrderDir: "desc",
		})
		if err != nil {
			b.Fatalf("QueryRows with filter failed: %v", err)
		}
	}
}

func BenchmarkSQLiteInsert(b *testing.B) {
	store, cleanup := benchStore(b)
	defer cleanup()
	ctx := context.Background()
	wsID := "ws-bench-sqlite-insert"

	store.CreateTable(ctx, wsID, VMCreateTableRequest{
		Name: "events",
		Columns: []VMCreateColumnDef{
			{Name: "id", Type: "INTEGER", Nullable: false},
			{Name: "type", Type: "TEXT", Nullable: false},
			{Name: "data", Type: "TEXT", Nullable: true},
		},
		PrimaryKey: []string{"id"},
	})

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		store.InsertRow(ctx, wsID, "events", map[string]interface{}{
			"type": "click",
			"data": fmt.Sprintf(`{"x":%d,"y":%d}`, i, i*2),
		})
	}
}

// ── Benchmark 4: Memory Usage (target < 10MB/VM) ─────────────────────

func TestVMMemoryUsage(t *testing.T) {
	db := newTestDB(t)

	// Force GC before measuring
	runtime.GC()
	var before runtime.MemStats
	runtime.ReadMemStats(&before)

	const numVMs = 10
	vms := make([]*WorkspaceVM, numVMs)
	for i := 0; i < numVMs; i++ {
		code := fmt.Sprintf(`
			exports.routes = {
				"GET /tasks": function(ctx) { return db.query("SELECT 1"); },
				"POST /tasks": function(ctx) { return db.insert("t", ctx.body); },
				"GET /tasks/:id": function(ctx) { return db.queryOne("SELECT 1 WHERE 1=?", [ctx.params.id]); },
				"PUT /tasks/:id": function(ctx) { return db.update("t", ctx.body, {id: ctx.params.id}); },
				"DELETE /tasks/:id": function(ctx) { return db.delete("t", {id: ctx.params.id}); },
				"GET /health": function(ctx) { return { ok: true, vm: %d }; }
			};
		`, i)
		vm, err := NewWorkspaceVM(fmt.Sprintf("ws-mem-%d", i), code, db)
		if err != nil {
			t.Fatalf("NewWorkspaceVM failed: %v", err)
		}
		vms[i] = vm
	}

	runtime.GC()
	var after runtime.MemStats
	runtime.ReadMemStats(&after)

	totalAlloc := after.TotalAlloc - before.TotalAlloc
	perVM := totalAlloc / numVMs
	perVMMB := float64(perVM) / (1024 * 1024)

	t.Logf("Memory usage for %d VMs:", numVMs)
	t.Logf("  Total allocated: %.2f MB", float64(totalAlloc)/(1024*1024))
	t.Logf("  Per VM: %.2f MB", perVMMB)
	t.Logf("  Heap in-use: %.2f MB", float64(after.HeapInuse)/(1024*1024))

	if perVMMB > 10.0 {
		t.Errorf("Per-VM memory %.2f MB exceeds 10MB target", perVMMB)
	}

	// Keep vms referenced to prevent GC
	_ = vms
}

// ── Benchmark: VMPool GetOrCreate (cache hit vs miss) ────────────────

func BenchmarkVMPool_CacheHit(b *testing.B) {
	dir := b.TempDir()
	store := NewVMStore(dir)
	defer store.Close()

	loader := &benchCodeLoader{code: `exports.routes = { "GET /x": function() { return 1; } };`}
	pool := NewVMPool(store, loader, 100)
	defer pool.Close()

	ctx := context.Background()
	// Warm up
	pool.GetOrCreate(ctx, "ws-bench-pool")

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		pool.GetOrCreate(ctx, "ws-bench-pool")
	}
}

func BenchmarkVMPool_CacheMiss(b *testing.B) {
	dir := b.TempDir()
	store := NewVMStore(dir)
	defer store.Close()

	loader := &benchCodeLoader{code: `exports.routes = { "GET /x": function() { return 1; } };`}
	pool := NewVMPool(store, loader, 1000)
	defer pool.Close()

	ctx := context.Background()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		pool.GetOrCreate(ctx, fmt.Sprintf("ws-bench-miss-%d", i))
	}
}

// ── helpers ──────────────────────────────────────────────────────────

func benchDB(b *testing.B) *sql.DB {
	b.Helper()
	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		b.Fatalf("open memory db: %v", err)
	}
	b.Cleanup(func() { db.Close() })
	return db
}

func benchStore(b *testing.B) (*VMStore, func()) {
	b.Helper()
	dir := b.TempDir()
	store := NewVMStore(dir)
	return store, func() { store.Close() }
}

type benchCodeLoader struct {
	code string
}

func (l *benchCodeLoader) GetLogicCode(_ context.Context, workspaceID string) (string, string, error) {
	if l.code == "" {
		return "", "", nil
	}
	return l.code, fmt.Sprintf("hash-%s", workspaceID), nil
}
