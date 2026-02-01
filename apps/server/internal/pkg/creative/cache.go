package creative

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"
)

// ========================
// 内存缓存
// ========================

// MemoryCache 内存缓存实现
type MemoryCache struct {
	data   map[string]*cacheEntry
	mu     sync.RWMutex
	maxAge time.Duration
}

type cacheEntry struct {
	value     interface{}
	expiresAt time.Time
}

// NewMemoryCache 创建内存缓存
func NewMemoryCache(maxAge time.Duration) *MemoryCache {
	cache := &MemoryCache{
		data:   make(map[string]*cacheEntry),
		maxAge: maxAge,
	}

	// 启动清理协程
	go cache.cleanup()

	return cache
}

// Set 设置缓存
func (c *MemoryCache) Set(key string, value interface{}) {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.data[key] = &cacheEntry{
		value:     value,
		expiresAt: time.Now().Add(c.maxAge),
	}
}

// Get 获取缓存
func (c *MemoryCache) Get(key string) (interface{}, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	entry, ok := c.data[key]
	if !ok {
		return nil, false
	}

	if time.Now().After(entry.expiresAt) {
		return nil, false
	}

	return entry.value, true
}

// Delete 删除缓存
func (c *MemoryCache) Delete(key string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	delete(c.data, key)
}

// cleanup 定期清理过期缓存
func (c *MemoryCache) cleanup() {
	ticker := time.NewTicker(time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		c.mu.Lock()
		now := time.Now()
		for key, entry := range c.data {
			if now.After(entry.expiresAt) {
				delete(c.data, key)
			}
		}
		c.mu.Unlock()
	}
}

// ========================
// 任务缓存管理器
// ========================

// TaskCacheManager 任务缓存管理器
type TaskCacheManager struct {
	// 任务缓存 (taskID -> GenerationTask)
	tasks *MemoryCache

	// 上下文缓存 (taskID -> GenerationContext)
	contexts *MemoryCache

	// 章节结果缓存 (taskID:sectionID -> content)
	sectionResults *MemoryCache

	// 搜索结果缓存 (hash -> results)
	searchResults *MemoryCache
}

// NewTaskCacheManager 创建任务缓存管理器
func NewTaskCacheManager() *TaskCacheManager {
	return &TaskCacheManager{
		tasks:          NewMemoryCache(time.Hour * 2),       // 任务缓存2小时
		contexts:       NewMemoryCache(time.Hour * 2),       // 上下文缓存2小时
		sectionResults: NewMemoryCache(time.Hour * 24),      // 章节结果缓存24小时
		searchResults:  NewMemoryCache(time.Hour * 1),       // 搜索结果缓存1小时
	}
}

// ========================
// 任务缓存
// ========================

// SetTask 缓存任务
func (m *TaskCacheManager) SetTask(task *GenerationTask) {
	m.tasks.Set(task.ID, task)
}

// GetTask 获取任务
func (m *TaskCacheManager) GetTask(taskID string) (*GenerationTask, bool) {
	value, ok := m.tasks.Get(taskID)
	if !ok {
		return nil, false
	}
	task, ok := value.(*GenerationTask)
	return task, ok
}

// DeleteTask 删除任务缓存
func (m *TaskCacheManager) DeleteTask(taskID string) {
	m.tasks.Delete(taskID)
	m.contexts.Delete(taskID)
}

// ========================
// 上下文缓存
// ========================

// SetContext 缓存上下文
func (m *TaskCacheManager) SetContext(taskID string, ctx *GenerationContext) {
	m.contexts.Set(taskID, ctx)
}

// GetContext 获取上下文
func (m *TaskCacheManager) GetContext(taskID string) (*GenerationContext, bool) {
	value, ok := m.contexts.Get(taskID)
	if !ok {
		return nil, false
	}
	ctx, ok := value.(*GenerationContext)
	return ctx, ok
}

// ========================
// 章节结果缓存
// ========================

func sectionCacheKey(taskID, sectionID string) string {
	return fmt.Sprintf("%s:%s", taskID, sectionID)
}

// SetSectionResult 缓存章节结果
func (m *TaskCacheManager) SetSectionResult(taskID, sectionID, content string) {
	m.sectionResults.Set(sectionCacheKey(taskID, sectionID), content)
}

// GetSectionResult 获取章节结果
func (m *TaskCacheManager) GetSectionResult(taskID, sectionID string) (string, bool) {
	value, ok := m.sectionResults.Get(sectionCacheKey(taskID, sectionID))
	if !ok {
		return "", false
	}
	content, ok := value.(string)
	return content, ok
}

// ========================
// 搜索结果缓存
// ========================

// SearchCacheKey 生成搜索缓存键
func SearchCacheKey(query string, options map[string]interface{}) string {
	data, _ := json.Marshal(map[string]interface{}{
		"query":   query,
		"options": options,
	})
	return string(data)
}

// SetSearchResult 缓存搜索结果
func (m *TaskCacheManager) SetSearchResult(key string, results interface{}) {
	m.searchResults.Set(key, results)
}

// GetSearchResult 获取搜索结果
func (m *TaskCacheManager) GetSearchResult(key string) (interface{}, bool) {
	return m.searchResults.Get(key)
}

// ========================
// 可选的 Redis 缓存接口
// ========================

// CacheStore 缓存存储接口
type CacheStore interface {
	Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error
	Get(ctx context.Context, key string) (interface{}, error)
	Delete(ctx context.Context, key string) error
}

// RedisCacheStore Redis 缓存存储
type RedisCacheStore struct {
	// 可以在这里注入 Redis 客户端
	// client *redis.Client
}

// 实现 CacheStore 接口的方法...
// 这里预留 Redis 缓存的实现，可以在需要时完成

// ========================
// 分布式任务锁
// ========================

// TaskLock 任务锁
type TaskLock struct {
	locks map[string]*sync.Mutex
	mu    sync.Mutex
}

// NewTaskLock 创建任务锁
func NewTaskLock() *TaskLock {
	return &TaskLock{
		locks: make(map[string]*sync.Mutex),
	}
}

// Lock 获取任务锁
func (l *TaskLock) Lock(taskID string) {
	l.mu.Lock()
	if _, ok := l.locks[taskID]; !ok {
		l.locks[taskID] = &sync.Mutex{}
	}
	lock := l.locks[taskID]
	l.mu.Unlock()

	lock.Lock()
}

// Unlock 释放任务锁
func (l *TaskLock) Unlock(taskID string) {
	l.mu.Lock()
	if lock, ok := l.locks[taskID]; ok {
		lock.Unlock()
	}
	l.mu.Unlock()
}

// TryLock 尝试获取任务锁
func (l *TaskLock) TryLock(taskID string) bool {
	l.mu.Lock()
	if _, ok := l.locks[taskID]; !ok {
		l.locks[taskID] = &sync.Mutex{}
	}
	lock := l.locks[taskID]
	l.mu.Unlock()

	return lock.TryLock()
}

// CleanupLock 清理任务锁
func (l *TaskLock) CleanupLock(taskID string) {
	l.mu.Lock()
	defer l.mu.Unlock()
	delete(l.locks, taskID)
}
