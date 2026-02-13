package vmruntime

import (
	"context"
	"crypto/sha256"
	"fmt"
	"testing"
)

// mockCodeLoader is a test VMCodeLoader that returns configurable code per workspace.
type mockCodeLoader struct {
	codes map[string]string // workspaceID → JS code
}

func (m *mockCodeLoader) GetLogicCode(_ context.Context, workspaceID string) (string, string, error) {
	code, ok := m.codes[workspaceID]
	if !ok || code == "" {
		return "", "", nil
	}
	h := sha256.Sum256([]byte(code))
	return code, fmt.Sprintf("%x", h[:]), nil
}

func newTestPool(t *testing.T, maxVMs int, codes map[string]string) (*VMPool, *mockCodeLoader) {
	t.Helper()
	dir := t.TempDir()
	store := NewVMStore(dir)
	t.Cleanup(func() { store.Close() })
	loader := &mockCodeLoader{codes: codes}
	pool := NewVMPool(store, loader, maxVMs)
	t.Cleanup(func() { pool.Close() })
	return pool, loader
}

// ── Cache hit ────────────────────────────────────────────────────────

func TestVMPool_CacheHit(t *testing.T) {
	pool, _ := newTestPool(t, 10, map[string]string{
		"ws-1": `exports.routes = { "GET /ping": function() { return { ok: true }; } };`,
	})
	ctx := context.Background()

	vm1, err := pool.GetOrCreate(ctx, "ws-1")
	if err != nil {
		t.Fatalf("first GetOrCreate failed: %v", err)
	}

	vm2, err := pool.GetOrCreate(ctx, "ws-1")
	if err != nil {
		t.Fatalf("second GetOrCreate failed: %v", err)
	}

	// Should return the same VM instance (cache hit)
	if vm1 != vm2 {
		t.Fatal("expected same VM instance on cache hit")
	}
}

// ── Code update triggers rebuild ─────────────────────────────────────

func TestVMPool_CodeUpdateRebuildsVM(t *testing.T) {
	codes := map[string]string{
		"ws-2": `exports.routes = { "GET /v1": function() { return { version: 1 }; } };`,
	}
	pool, loader := newTestPool(t, 10, codes)
	ctx := context.Background()

	vm1, _ := pool.GetOrCreate(ctx, "ws-2")
	hash1 := vm1.CodeHash()

	// Update the code
	loader.codes["ws-2"] = `exports.routes = { "GET /v2": function() { return { version: 2 }; } };`

	vm2, err := pool.GetOrCreate(ctx, "ws-2")
	if err != nil {
		t.Fatalf("GetOrCreate after update failed: %v", err)
	}

	if vm2.CodeHash() == hash1 {
		t.Fatal("expected different hash after code update")
	}
	if vm1 == vm2 {
		t.Fatal("expected new VM instance after code update")
	}

	// New VM should have the new route
	routes := vm2.Routes()
	found := false
	for _, r := range routes {
		if r == "GET /v2" {
			found = true
		}
	}
	if !found {
		t.Fatalf("new VM routes = %v, expected 'GET /v2'", routes)
	}
}

// ── No code deployed ─────────────────────────────────────────────────

func TestVMPool_NoCodeDeployed(t *testing.T) {
	pool, _ := newTestPool(t, 10, map[string]string{})
	ctx := context.Background()

	_, err := pool.GetOrCreate(ctx, "ws-empty")
	if err == nil {
		t.Fatal("expected error when no code is deployed")
	}
}

// ── Invalidate ───────────────────────────────────────────────────────

func TestVMPool_Invalidate(t *testing.T) {
	pool, _ := newTestPool(t, 10, map[string]string{
		"ws-3": `exports.routes = { "GET /x": function() { return 1; } };`,
	})
	ctx := context.Background()

	vm1, _ := pool.GetOrCreate(ctx, "ws-3")
	pool.Invalidate("ws-3")

	vm2, _ := pool.GetOrCreate(ctx, "ws-3")

	// After invalidation, should be a new VM even with same code
	if vm1 == vm2 {
		t.Fatal("expected new VM instance after Invalidate")
	}
	// But same hash since code didn't change
	if vm1.CodeHash() != vm2.CodeHash() {
		t.Fatal("expected same hash since code is unchanged")
	}
}

// ── LRU eviction ─────────────────────────────────────────────────────

func TestVMPool_LRUEviction(t *testing.T) {
	codes := map[string]string{}
	for i := 0; i < 5; i++ {
		wsID := fmt.Sprintf("ws-lru-%d", i)
		codes[wsID] = fmt.Sprintf(`exports.routes = { "GET /id": function() { return { id: %d }; } };`, i)
	}

	pool, _ := newTestPool(t, 3, codes) // max 3 VMs
	ctx := context.Background()

	// Load 3 VMs (filling the pool)
	pool.GetOrCreate(ctx, "ws-lru-0")
	pool.GetOrCreate(ctx, "ws-lru-1")
	pool.GetOrCreate(ctx, "ws-lru-2")

	// Access ws-lru-0 again to make it most recently used
	pool.GetOrCreate(ctx, "ws-lru-0")

	// Load a 4th VM — should evict the LRU (ws-lru-1)
	pool.GetOrCreate(ctx, "ws-lru-3")

	// Pool should have 3 VMs
	pool.mu.RLock()
	count := len(pool.vms)
	_, hasWs0 := pool.vms["ws-lru-0"]
	_, hasWs1 := pool.vms["ws-lru-1"]
	_, hasWs3 := pool.vms["ws-lru-3"]
	pool.mu.RUnlock()

	if count != 3 {
		t.Fatalf("pool size = %d, want 3", count)
	}
	if !hasWs0 {
		t.Fatal("ws-lru-0 should still be in pool (recently accessed)")
	}
	if hasWs1 {
		t.Fatal("ws-lru-1 should have been evicted (LRU)")
	}
	if !hasWs3 {
		t.Fatal("ws-lru-3 should be in pool (just added)")
	}
}

// ── Close clears all ─────────────────────────────────────────────────

func TestVMPool_Close(t *testing.T) {
	pool, _ := newTestPool(t, 10, map[string]string{
		"ws-close": `exports.routes = {};`,
	})
	ctx := context.Background()

	pool.GetOrCreate(ctx, "ws-close")
	pool.Close()

	pool.mu.RLock()
	count := len(pool.vms)
	pool.mu.RUnlock()

	if count != 0 {
		t.Fatalf("after Close: pool size = %d, want 0", count)
	}
}

// ── Default maxVMs ───────────────────────────────────────────────────

func TestVMPool_DefaultMaxVMs(t *testing.T) {
	dir := t.TempDir()
	store := NewVMStore(dir)
	defer store.Close()

	pool := NewVMPool(store, &mockCodeLoader{}, 0) // 0 → default 100
	if pool.maxVMs != 100 {
		t.Fatalf("default maxVMs = %d, want 100", pool.maxVMs)
	}

	pool2 := NewVMPool(store, &mockCodeLoader{}, -5) // negative → default 100
	if pool2.maxVMs != 100 {
		t.Fatalf("negative maxVMs = %d, want 100", pool2.maxVMs)
	}
}
