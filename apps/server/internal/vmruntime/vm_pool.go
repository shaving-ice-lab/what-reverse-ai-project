package vmruntime

import (
	"context"
	"fmt"
	"sync"
	"time"
)

// VMCodeLoader loads the JS logic code for a workspace.
type VMCodeLoader interface {
	GetLogicCode(ctx context.Context, workspaceID string) (code string, hash string, err error)
}

// VMPool manages cached WorkspaceVM instances with LRU eviction.
type VMPool struct {
	mu         sync.RWMutex
	vms        map[string]*WorkspaceVM
	vmStore    *VMStore
	codeLoader VMCodeLoader
	maxVMs     int
	accessLog  map[string]time.Time
}

// NewVMPool creates a new VMPool.
func NewVMPool(vmStore *VMStore, codeLoader VMCodeLoader, maxVMs int) *VMPool {
	if maxVMs <= 0 {
		maxVMs = 100
	}
	return &VMPool{
		vms:        make(map[string]*WorkspaceVM),
		vmStore:    vmStore,
		codeLoader: codeLoader,
		maxVMs:     maxVMs,
		accessLog:  make(map[string]time.Time),
	}
}

// GetOrCreate returns a cached VM or creates a new one. If the code has been
// updated (hash mismatch), the VM is rebuilt automatically.
func (p *VMPool) GetOrCreate(ctx context.Context, workspaceID string) (*WorkspaceVM, error) {
	code, hash, err := p.codeLoader.GetLogicCode(ctx, workspaceID)
	if err != nil {
		return nil, fmt.Errorf("vmpool: load code: %w", err)
	}
	if code == "" {
		return nil, fmt.Errorf("vmpool: no logic code deployed for workspace %s", workspaceID)
	}

	p.mu.RLock()
	if vm, ok := p.vms[workspaceID]; ok && vm.codeHash == hash {
		p.mu.RUnlock()
		p.touchAccess(workspaceID)
		return vm, nil
	}
	p.mu.RUnlock()

	// Need to create or recreate
	p.mu.Lock()
	defer p.mu.Unlock()

	// Double-check after acquiring write lock
	if vm, ok := p.vms[workspaceID]; ok && vm.codeHash == hash {
		p.accessLog[workspaceID] = time.Now()
		return vm, nil
	}

	// Get SQLite DB for this workspace
	db, err := p.vmStore.GetDB(workspaceID)
	if err != nil {
		return nil, fmt.Errorf("vmpool: get db: %w", err)
	}

	vm, err := NewWorkspaceVM(workspaceID, code, db)
	if err != nil {
		return nil, fmt.Errorf("vmpool: create vm: %w", err)
	}

	// Evict if at capacity
	if len(p.vms) >= p.maxVMs {
		p.evictLRU()
	}

	p.vms[workspaceID] = vm
	p.accessLog[workspaceID] = time.Now()
	return vm, nil
}

// Invalidate removes a workspace's VM from the cache, forcing a rebuild on next access.
func (p *VMPool) Invalidate(workspaceID string) {
	p.mu.Lock()
	defer p.mu.Unlock()
	delete(p.vms, workspaceID)
	delete(p.accessLog, workspaceID)
}

// Close removes all VMs from the pool.
func (p *VMPool) Close() {
	p.mu.Lock()
	defer p.mu.Unlock()
	for id := range p.vms {
		delete(p.vms, id)
		delete(p.accessLog, id)
	}
}

// touchAccess updates the last access time for a workspace (for LRU tracking).
func (p *VMPool) touchAccess(workspaceID string) {
	p.mu.Lock()
	p.accessLog[workspaceID] = time.Now()
	p.mu.Unlock()
}

// evictLRU removes the least recently used VM from the pool.
// Must be called with p.mu held.
func (p *VMPool) evictLRU() {
	var oldestID string
	var oldestTime time.Time

	for id, t := range p.accessLog {
		if oldestID == "" || t.Before(oldestTime) {
			oldestID = id
			oldestTime = t
		}
	}

	if oldestID != "" {
		delete(p.vms, oldestID)
		delete(p.accessLog, oldestID)
	}
}
