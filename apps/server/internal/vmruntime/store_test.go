package vmruntime

import (
	"context"
	"os"
	"path/filepath"
	"testing"
)

// newTestStore creates a VMStore backed by a temp directory, returning the store and a cleanup func.
func newTestStore(t *testing.T) (*VMStore, func()) {
	t.Helper()
	dir := t.TempDir()
	store := NewVMStore(dir)
	return store, func() { store.Close() }
}

// ── VMStore basic lifecycle ──────────────────────────────────────────

func TestVMStore_GetDB_CreatesFile(t *testing.T) {
	store, cleanup := newTestStore(t)
	defer cleanup()

	wsID := "test-workspace-001"
	db, err := store.GetDB(wsID)
	if err != nil {
		t.Fatalf("GetDB failed: %v", err)
	}
	if db == nil {
		t.Fatal("GetDB returned nil")
	}

	// File should exist
	if !store.Exists(wsID) {
		t.Fatal("Exists() returned false after GetDB")
	}

	// DBPath should point to a real file
	path := store.DBPath(wsID)
	if _, err := os.Stat(path); os.IsNotExist(err) {
		t.Fatalf("DB file does not exist at %s", path)
	}
}

func TestVMStore_GetDB_ReturnsSameConnection(t *testing.T) {
	store, cleanup := newTestStore(t)
	defer cleanup()

	wsID := "test-workspace-002"
	db1, _ := store.GetDB(wsID)
	db2, _ := store.GetDB(wsID)
	if db1 != db2 {
		t.Fatal("GetDB returned different connections for same workspace")
	}
}

func TestVMStore_CloseDB(t *testing.T) {
	store, cleanup := newTestStore(t)
	defer cleanup()

	wsID := "test-workspace-003"
	store.GetDB(wsID)

	if err := store.CloseDB(wsID); err != nil {
		t.Fatalf("CloseDB failed: %v", err)
	}

	// Should be able to get a new connection after close
	db, err := store.GetDB(wsID)
	if err != nil {
		t.Fatalf("GetDB after CloseDB failed: %v", err)
	}
	if db == nil {
		t.Fatal("GetDB after CloseDB returned nil")
	}
}

func TestVMStore_Delete(t *testing.T) {
	store, cleanup := newTestStore(t)
	defer cleanup()

	wsID := "test-workspace-004"
	store.GetDB(wsID)

	if err := store.Delete(wsID); err != nil {
		t.Fatalf("Delete failed: %v", err)
	}
	if store.Exists(wsID) {
		t.Fatal("Exists() returned true after Delete")
	}
}

func TestVMStore_DBPath(t *testing.T) {
	dir := t.TempDir()
	store := NewVMStore(dir)
	defer store.Close()

	path := store.DBPath("abc-123")
	expected := filepath.Join(dir, "abc-123.db")
	if path != expected {
		t.Fatalf("DBPath = %q, want %q", path, expected)
	}
}

// ── CreateTable + ListTables ─────────────────────────────────────────

func TestVMStore_CreateTable_And_ListTables(t *testing.T) {
	store, cleanup := newTestStore(t)
	defer cleanup()
	ctx := context.Background()
	wsID := "test-ws-tables"

	err := store.CreateTable(ctx, wsID, VMCreateTableRequest{
		Name: "users",
		Columns: []VMCreateColumnDef{
			{Name: "id", Type: "INTEGER", Nullable: false},
			{Name: "name", Type: "TEXT", Nullable: false},
			{Name: "email", Type: "TEXT", Nullable: true, Unique: true},
		},
		PrimaryKey: []string{"id"},
	})
	if err != nil {
		t.Fatalf("CreateTable failed: %v", err)
	}

	tables, err := store.ListTables(ctx, wsID)
	if err != nil {
		t.Fatalf("ListTables failed: %v", err)
	}
	if len(tables) != 1 {
		t.Fatalf("expected 1 table, got %d", len(tables))
	}
	if tables[0].Name != "users" {
		t.Fatalf("table name = %q, want %q", tables[0].Name, "users")
	}
	if tables[0].ColumnCount != 3 {
		t.Fatalf("column count = %d, want 3", tables[0].ColumnCount)
	}
}

// ── GetTableSchema ───────────────────────────────────────────────────

func TestVMStore_GetTableSchema(t *testing.T) {
	store, cleanup := newTestStore(t)
	defer cleanup()
	ctx := context.Background()
	wsID := "test-ws-schema"

	defVal := "'unknown'"
	store.CreateTable(ctx, wsID, VMCreateTableRequest{
		Name: "products",
		Columns: []VMCreateColumnDef{
			{Name: "id", Type: "INTEGER", Nullable: false},
			{Name: "name", Type: "TEXT", Nullable: false},
			{Name: "price", Type: "REAL", Nullable: true},
			{Name: "category", Type: "TEXT", Nullable: false, DefaultValue: &defVal},
		},
		PrimaryKey: []string{"id"},
		Indexes: []VMCreateIndexDef{
			{Name: "idx_products_category", Columns: []string{"category"}, Unique: false},
		},
	})

	schema, err := store.GetTableSchema(ctx, wsID, "products")
	if err != nil {
		t.Fatalf("GetTableSchema failed: %v", err)
	}
	if schema.Name != "products" {
		t.Fatalf("schema name = %q, want %q", schema.Name, "products")
	}
	if len(schema.Columns) != 4 {
		t.Fatalf("expected 4 columns, got %d", len(schema.Columns))
	}
	if len(schema.PrimaryKey) != 1 || schema.PrimaryKey[0] != "id" {
		t.Fatalf("primary key = %v, want [id]", schema.PrimaryKey)
	}
	if len(schema.Indexes) == 0 {
		t.Fatal("expected at least 1 index")
	}
	if schema.DDL == "" {
		t.Fatal("DDL should not be empty")
	}
}

// ── InsertRow / QueryRows / UpdateRow / DeleteRows ───────────────────

func TestVMStore_CRUD_Operations(t *testing.T) {
	store, cleanup := newTestStore(t)
	defer cleanup()
	ctx := context.Background()
	wsID := "test-ws-crud"

	// Create table
	store.CreateTable(ctx, wsID, VMCreateTableRequest{
		Name: "tasks",
		Columns: []VMCreateColumnDef{
			{Name: "id", Type: "INTEGER", Nullable: false},
			{Name: "title", Type: "TEXT", Nullable: false},
			{Name: "done", Type: "INTEGER", Nullable: false},
		},
		PrimaryKey: []string{"id"},
	})

	// Insert
	res, err := store.InsertRow(ctx, wsID, "tasks", map[string]interface{}{
		"title": "Buy milk",
		"done":  0,
	})
	if err != nil {
		t.Fatalf("InsertRow failed: %v", err)
	}
	if res.AffectedRows != 1 {
		t.Fatalf("InsertRow affected = %d, want 1", res.AffectedRows)
	}
	if res.LastInsertID <= 0 {
		t.Fatalf("InsertRow lastID = %d, want > 0", res.LastInsertID)
	}

	// Insert another
	store.InsertRow(ctx, wsID, "tasks", map[string]interface{}{
		"title": "Walk dog",
		"done":  1,
	})

	// Query all
	qr, err := store.QueryRows(ctx, wsID, "tasks", VMQueryParams{Page: 1, PageSize: 10})
	if err != nil {
		t.Fatalf("QueryRows failed: %v", err)
	}
	if qr.TotalCount != 2 {
		t.Fatalf("QueryRows total = %d, want 2", qr.TotalCount)
	}
	if len(qr.Rows) != 2 {
		t.Fatalf("QueryRows rows = %d, want 2", len(qr.Rows))
	}

	// Query with filter
	qr2, err := store.QueryRows(ctx, wsID, "tasks", VMQueryParams{
		Page:     1,
		PageSize: 10,
		Filters:  []VMQueryFilter{{Column: "done", Operator: "=", Value: "1"}},
	})
	if err != nil {
		t.Fatalf("QueryRows with filter failed: %v", err)
	}
	if qr2.TotalCount != 1 {
		t.Fatalf("filtered total = %d, want 1", qr2.TotalCount)
	}

	// Update
	upd, err := store.UpdateRow(ctx, wsID, "tasks",
		map[string]interface{}{"done": 1},
		map[string]interface{}{"id": res.LastInsertID},
	)
	if err != nil {
		t.Fatalf("UpdateRow failed: %v", err)
	}
	if upd.AffectedRows != 1 {
		t.Fatalf("UpdateRow affected = %d, want 1", upd.AffectedRows)
	}

	// Delete
	del, err := store.DeleteRows(ctx, wsID, "tasks", []interface{}{res.LastInsertID})
	if err != nil {
		t.Fatalf("DeleteRows failed: %v", err)
	}
	if del.AffectedRows != 1 {
		t.Fatalf("DeleteRows affected = %d, want 1", del.AffectedRows)
	}

	// Verify remaining
	qr3, _ := store.QueryRows(ctx, wsID, "tasks", VMQueryParams{Page: 1, PageSize: 10})
	if qr3.TotalCount != 1 {
		t.Fatalf("after delete total = %d, want 1", qr3.TotalCount)
	}
}

// ── ExecuteSQL ───────────────────────────────────────────────────────

func TestVMStore_ExecuteSQL(t *testing.T) {
	store, cleanup := newTestStore(t)
	defer cleanup()
	ctx := context.Background()
	wsID := "test-ws-sql"

	// DDL
	_, err := store.ExecuteSQL(ctx, wsID, "CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT)")
	if err != nil {
		t.Fatalf("ExecuteSQL CREATE TABLE failed: %v", err)
	}

	// DML
	result, err := store.ExecuteSQL(ctx, wsID, "INSERT INTO items (name) VALUES (?)", "apple")
	if err != nil {
		t.Fatalf("ExecuteSQL INSERT failed: %v", err)
	}
	if result.AffectedRows != 1 {
		t.Fatalf("INSERT affected = %d, want 1", result.AffectedRows)
	}

	// SELECT
	qr, err := store.ExecuteSQL(ctx, wsID, "SELECT * FROM items")
	if err != nil {
		t.Fatalf("ExecuteSQL SELECT failed: %v", err)
	}
	if len(qr.Rows) != 1 {
		t.Fatalf("SELECT rows = %d, want 1", len(qr.Rows))
	}
	if qr.Columns[0] != "id" || qr.Columns[1] != "name" {
		t.Fatalf("columns = %v, want [id, name]", qr.Columns)
	}
}

// ── AlterTable / DropTable ───────────────────────────────────────────

func TestVMStore_AlterTable(t *testing.T) {
	store, cleanup := newTestStore(t)
	defer cleanup()
	ctx := context.Background()
	wsID := "test-ws-alter"

	store.CreateTable(ctx, wsID, VMCreateTableRequest{
		Name: "orders",
		Columns: []VMCreateColumnDef{
			{Name: "id", Type: "INTEGER", Nullable: false},
			{Name: "total", Type: "REAL", Nullable: false},
		},
		PrimaryKey: []string{"id"},
	})

	// Add column
	err := store.AlterTable(ctx, wsID, "orders", VMAlterTableRequest{
		AddColumns: []VMCreateColumnDef{
			{Name: "status", Type: "TEXT", Nullable: true},
		},
	})
	if err != nil {
		t.Fatalf("AlterTable add column failed: %v", err)
	}

	schema, _ := store.GetTableSchema(ctx, wsID, "orders")
	if len(schema.Columns) != 3 {
		t.Fatalf("after add column: %d columns, want 3", len(schema.Columns))
	}

	// Rename table
	err = store.AlterTable(ctx, wsID, "orders", VMAlterTableRequest{
		Rename: "purchases",
	})
	if err != nil {
		t.Fatalf("AlterTable rename failed: %v", err)
	}

	tables, _ := store.ListTables(ctx, wsID)
	found := false
	for _, tbl := range tables {
		if tbl.Name == "purchases" {
			found = true
		}
	}
	if !found {
		t.Fatal("renamed table 'purchases' not found")
	}
}

func TestVMStore_DropTable(t *testing.T) {
	store, cleanup := newTestStore(t)
	defer cleanup()
	ctx := context.Background()
	wsID := "test-ws-drop"

	store.CreateTable(ctx, wsID, VMCreateTableRequest{
		Name: "temp",
		Columns: []VMCreateColumnDef{
			{Name: "id", Type: "INTEGER", Nullable: false},
		},
		PrimaryKey: []string{"id"},
	})

	err := store.DropTable(ctx, wsID, "temp")
	if err != nil {
		t.Fatalf("DropTable failed: %v", err)
	}

	tables, _ := store.ListTables(ctx, wsID)
	if len(tables) != 0 {
		t.Fatalf("after drop: %d tables, want 0", len(tables))
	}
}

// ── GetStats ─────────────────────────────────────────────────────────

func TestVMStore_GetStats(t *testing.T) {
	store, cleanup := newTestStore(t)
	defer cleanup()
	ctx := context.Background()
	wsID := "test-ws-stats"

	store.CreateTable(ctx, wsID, VMCreateTableRequest{
		Name: "metrics",
		Columns: []VMCreateColumnDef{
			{Name: "id", Type: "INTEGER", Nullable: false},
			{Name: "value", Type: "REAL", Nullable: false},
		},
		PrimaryKey: []string{"id"},
	})
	store.InsertRow(ctx, wsID, "metrics", map[string]interface{}{"value": 42.0})
	store.InsertRow(ctx, wsID, "metrics", map[string]interface{}{"value": 99.0})

	stats, err := store.GetStats(ctx, wsID)
	if err != nil {
		t.Fatalf("GetStats failed: %v", err)
	}
	if stats.TableCount != 1 {
		t.Fatalf("table count = %d, want 1", stats.TableCount)
	}
	if stats.TotalRows != 2 {
		t.Fatalf("total rows = %d, want 2", stats.TotalRows)
	}
	if stats.JournalMode == "" {
		t.Fatal("journal mode should not be empty")
	}
}

// ── GetSchemaGraph ───────────────────────────────────────────────────

func TestVMStore_GetSchemaGraph(t *testing.T) {
	store, cleanup := newTestStore(t)
	defer cleanup()
	ctx := context.Background()
	wsID := "test-ws-graph"

	store.CreateTable(ctx, wsID, VMCreateTableRequest{
		Name: "authors",
		Columns: []VMCreateColumnDef{
			{Name: "id", Type: "INTEGER", Nullable: false},
			{Name: "name", Type: "TEXT", Nullable: false},
		},
		PrimaryKey: []string{"id"},
	})
	store.CreateTable(ctx, wsID, VMCreateTableRequest{
		Name: "books",
		Columns: []VMCreateColumnDef{
			{Name: "id", Type: "INTEGER", Nullable: false},
			{Name: "title", Type: "TEXT", Nullable: false},
			{Name: "author_id", Type: "INTEGER", Nullable: false},
		},
		PrimaryKey: []string{"id"},
	})

	graph, err := store.GetSchemaGraph(ctx, wsID)
	if err != nil {
		t.Fatalf("GetSchemaGraph failed: %v", err)
	}
	if len(graph.Nodes) != 2 {
		t.Fatalf("graph nodes = %d, want 2", len(graph.Nodes))
	}
}

// ── QueryRows pagination & sorting ───────────────────────────────────

func TestVMStore_QueryRows_PaginationAndSorting(t *testing.T) {
	store, cleanup := newTestStore(t)
	defer cleanup()
	ctx := context.Background()
	wsID := "test-ws-page"

	store.CreateTable(ctx, wsID, VMCreateTableRequest{
		Name: "nums",
		Columns: []VMCreateColumnDef{
			{Name: "id", Type: "INTEGER", Nullable: false},
			{Name: "val", Type: "INTEGER", Nullable: false},
		},
		PrimaryKey: []string{"id"},
	})

	for i := 1; i <= 15; i++ {
		store.InsertRow(ctx, wsID, "nums", map[string]interface{}{"val": i})
	}

	// Page 1, size 5
	qr, _ := store.QueryRows(ctx, wsID, "nums", VMQueryParams{Page: 1, PageSize: 5})
	if len(qr.Rows) != 5 {
		t.Fatalf("page 1 rows = %d, want 5", len(qr.Rows))
	}
	if qr.TotalCount != 15 {
		t.Fatalf("total = %d, want 15", qr.TotalCount)
	}

	// Page 3, size 5 → only 5 rows
	qr2, _ := store.QueryRows(ctx, wsID, "nums", VMQueryParams{Page: 3, PageSize: 5})
	if len(qr2.Rows) != 5 {
		t.Fatalf("page 3 rows = %d, want 5", len(qr2.Rows))
	}

	// Page 4, size 5 → 0 rows
	qr3, _ := store.QueryRows(ctx, wsID, "nums", VMQueryParams{Page: 4, PageSize: 5})
	if len(qr3.Rows) != 0 {
		t.Fatalf("page 4 rows = %d, want 0", len(qr3.Rows))
	}

	// Sorting DESC
	qr4, _ := store.QueryRows(ctx, wsID, "nums", VMQueryParams{
		Page: 1, PageSize: 3, OrderBy: "val", OrderDir: "desc",
	})
	if len(qr4.Rows) != 3 {
		t.Fatalf("sorted rows = %d, want 3", len(qr4.Rows))
	}
	// First row should have val=15
	firstVal, ok := qr4.Rows[0]["val"].(int64)
	if !ok {
		t.Fatalf("val type = %T, want int64", qr4.Rows[0]["val"])
	}
	if firstVal != 15 {
		t.Fatalf("first sorted val = %d, want 15", firstVal)
	}
}

// ── Edge cases ───────────────────────────────────────────────────────

func TestVMStore_InsertRow_EmptyData(t *testing.T) {
	store, cleanup := newTestStore(t)
	defer cleanup()
	ctx := context.Background()
	wsID := "test-ws-edge"

	store.CreateTable(ctx, wsID, VMCreateTableRequest{
		Name: "empty_test",
		Columns: []VMCreateColumnDef{
			{Name: "id", Type: "INTEGER", Nullable: false},
		},
		PrimaryKey: []string{"id"},
	})

	_, err := store.InsertRow(ctx, wsID, "empty_test", map[string]interface{}{})
	if err == nil {
		t.Fatal("InsertRow with empty data should fail")
	}
}

func TestVMStore_UpdateRow_NoWhere(t *testing.T) {
	store, cleanup := newTestStore(t)
	defer cleanup()
	ctx := context.Background()
	wsID := "test-ws-edge2"

	store.CreateTable(ctx, wsID, VMCreateTableRequest{
		Name: "update_test",
		Columns: []VMCreateColumnDef{
			{Name: "id", Type: "INTEGER", Nullable: false},
			{Name: "name", Type: "TEXT", Nullable: true},
		},
		PrimaryKey: []string{"id"},
	})

	_, err := store.UpdateRow(ctx, wsID, "update_test",
		map[string]interface{}{"name": "x"},
		map[string]interface{}{},
	)
	if err == nil {
		t.Fatal("UpdateRow with empty WHERE should fail")
	}
}

func TestVMStore_DeleteRows_NoIDs(t *testing.T) {
	store, cleanup := newTestStore(t)
	defer cleanup()
	ctx := context.Background()
	wsID := "test-ws-edge3"

	_, err := store.DeleteRows(ctx, wsID, "whatever", []interface{}{})
	if err == nil {
		t.Fatal("DeleteRows with empty IDs should fail")
	}
}

// ── mapColumnType ────────────────────────────────────────────────────

func TestMapColumnType(t *testing.T) {
	cases := []struct {
		input string
		want  string
	}{
		{"VARCHAR(255)", "TEXT"},
		{"TEXT", "TEXT"},
		{"ENUM('a','b')", "TEXT"},
		{"INT", "INTEGER"},
		{"BIGINT", "INTEGER"},
		{"BOOLEAN", "INTEGER"},
		{"TINYINT(1)", "INTEGER"},
		{"DECIMAL(10,2)", "REAL"},
		{"FLOAT", "REAL"},
		{"DOUBLE", "REAL"},
		{"BLOB", "BLOB"},
		{"DATETIME", "TEXT"},
		{"TIMESTAMP", "TEXT"},
		{"DATE", "TEXT"},
		{"something_custom", "something_custom"},
	}
	for _, tc := range cases {
		got := mapColumnType(tc.input)
		if got != tc.want {
			t.Errorf("mapColumnType(%q) = %q, want %q", tc.input, got, tc.want)
		}
	}
}
