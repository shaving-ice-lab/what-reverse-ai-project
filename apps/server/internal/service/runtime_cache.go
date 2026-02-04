package service

import (
	"sync"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
)

type RuntimeCacheSettings struct {
	EntryTTL    time.Duration
	NegativeTTL time.Duration
}

type runtimeCache struct {
	workspaceBySlug        *ttlCache[*entity.Workspace]
	workspaceByID          *ttlCache[*entity.Workspace]
	appByWorkspaceSlug     *ttlCache[*entity.App]
	appByID                *ttlCache[*entity.App]
	policyByAppID          *ttlCache[*entity.AppAccessPolicy]
	versionByID            *ttlCache[*entity.AppVersion]
	domainByHost           *ttlCache[*entity.AppDomain]
	workspaceBySlugMiss    *ttlCache[bool]
	workspaceByIDMiss      *ttlCache[bool]
	appByWorkspaceSlugMiss *ttlCache[bool]
	appByIDMiss            *ttlCache[bool]
	policyByAppIDMiss      *ttlCache[bool]
	versionByIDMiss        *ttlCache[bool]
	domainByHostMiss       *ttlCache[bool]
}

func newRuntimeCache(settings RuntimeCacheSettings) *runtimeCache {
	if settings.EntryTTL <= 0 && settings.NegativeTTL <= 0 {
		return nil
	}
	cache := &runtimeCache{}
	if settings.EntryTTL > 0 {
		cache.workspaceBySlug = newTTLCache[*entity.Workspace](settings.EntryTTL)
		cache.workspaceByID = newTTLCache[*entity.Workspace](settings.EntryTTL)
		cache.appByWorkspaceSlug = newTTLCache[*entity.App](settings.EntryTTL)
		cache.appByID = newTTLCache[*entity.App](settings.EntryTTL)
		cache.policyByAppID = newTTLCache[*entity.AppAccessPolicy](settings.EntryTTL)
		cache.versionByID = newTTLCache[*entity.AppVersion](settings.EntryTTL)
		cache.domainByHost = newTTLCache[*entity.AppDomain](settings.EntryTTL)
	}
	if settings.NegativeTTL > 0 {
		cache.workspaceBySlugMiss = newTTLCache[bool](settings.NegativeTTL)
		cache.workspaceByIDMiss = newTTLCache[bool](settings.NegativeTTL)
		cache.appByWorkspaceSlugMiss = newTTLCache[bool](settings.NegativeTTL)
		cache.appByIDMiss = newTTLCache[bool](settings.NegativeTTL)
		cache.policyByAppIDMiss = newTTLCache[bool](settings.NegativeTTL)
		cache.versionByIDMiss = newTTLCache[bool](settings.NegativeTTL)
		cache.domainByHostMiss = newTTLCache[bool](settings.NegativeTTL)
	}
	return cache
}

type ttlCache[T any] struct {
	ttl   time.Duration
	mu    sync.RWMutex
	items map[string]ttlCacheEntry[T]
}

type ttlCacheEntry[T any] struct {
	value     T
	expiresAt time.Time
}

func newTTLCache[T any](ttl time.Duration) *ttlCache[T] {
	return &ttlCache[T]{
		ttl:   ttl,
		items: make(map[string]ttlCacheEntry[T]),
	}
}

func (c *ttlCache[T]) Get(key string) (T, bool) {
	var zero T
	if c == nil || key == "" {
		return zero, false
	}
	c.mu.RLock()
	entry, ok := c.items[key]
	if !ok {
		c.mu.RUnlock()
		return zero, false
	}
	if time.Now().After(entry.expiresAt) {
		c.mu.RUnlock()
		c.mu.Lock()
		if entry, ok = c.items[key]; ok && time.Now().After(entry.expiresAt) {
			delete(c.items, key)
		}
		c.mu.Unlock()
		return zero, false
	}
	value := entry.value
	c.mu.RUnlock()
	return value, true
}

func (c *ttlCache[T]) Set(key string, value T) {
	if c == nil || key == "" {
		return
	}
	c.mu.Lock()
	c.items[key] = ttlCacheEntry[T]{
		value:     value,
		expiresAt: time.Now().Add(c.ttl),
	}
	c.mu.Unlock()
}

func (c *ttlCache[T]) Delete(key string) {
	if c == nil || key == "" {
		return
	}
	c.mu.Lock()
	delete(c.items, key)
	c.mu.Unlock()
}

func cacheMissHit(cache *ttlCache[bool], key string) bool {
	if cache == nil || key == "" {
		return false
	}
	if value, ok := cache.Get(key); ok && value {
		return true
	}
	return false
}

func cacheMissSet(cache *ttlCache[bool], key string) {
	if cache == nil || key == "" {
		return
	}
	cache.Set(key, true)
}

func cacheMissClear(cache *ttlCache[bool], key string) {
	if cache == nil || key == "" {
		return
	}
	cache.Delete(key)
}

type cacheGroup struct {
	mu    sync.Mutex
	calls map[string]*cacheCall
}

type cacheCall struct {
	wg    sync.WaitGroup
	value interface{}
	err   error
}

func newCacheGroup() *cacheGroup {
	return &cacheGroup{
		calls: make(map[string]*cacheCall),
	}
}

func (g *cacheGroup) Do(key string, fn func() (interface{}, error)) (interface{}, error) {
	if fn == nil {
		return nil, nil
	}
	if g == nil || key == "" {
		return fn()
	}
	g.mu.Lock()
	if existing, ok := g.calls[key]; ok {
		g.mu.Unlock()
		existing.wg.Wait()
		return existing.value, existing.err
	}
	call := &cacheCall{}
	call.wg.Add(1)
	g.calls[key] = call
	g.mu.Unlock()

	call.value, call.err = fn()
	call.wg.Done()

	g.mu.Lock()
	delete(g.calls, key)
	g.mu.Unlock()
	return call.value, call.err
}
