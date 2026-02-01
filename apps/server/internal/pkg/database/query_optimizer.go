package database

import (
	"context"
	"fmt"
	"sync"
	"time"

	"gorm.io/gorm"
)

/**
 * 数据库查询优化工具
 *
 * 功能:
 * 1. 查询结果缓存
 * 2. 批量查询优化
 * 3. 预加载优化
 * 4. 查询性能监控
 */

// ===== 查询缓存 =====

// QueryCache 查询缓存
type QueryCache struct {
	data     map[string]*cacheEntry
	mu       sync.RWMutex
	maxSize  int
	ttl      time.Duration
	cleanupInterval time.Duration
}

type cacheEntry struct {
	value     interface{}
	expiresAt time.Time
	hits      int64
}

// NewQueryCache 创建查询缓存
func NewQueryCache(maxSize int, ttl time.Duration) *QueryCache {
	cache := &QueryCache{
		data:            make(map[string]*cacheEntry),
		maxSize:         maxSize,
		ttl:             ttl,
		cleanupInterval: ttl / 2,
	}

	// 启动清理 goroutine
	go cache.cleanup()

	return cache
}

// Get 获取缓存
func (c *QueryCache) Get(key string) (interface{}, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	entry, ok := c.data[key]
	if !ok {
		return nil, false
	}

	if time.Now().After(entry.expiresAt) {
		return nil, false
	}

	entry.hits++
	return entry.value, true
}

// Set 设置缓存
func (c *QueryCache) Set(key string, value interface{}) {
	c.mu.Lock()
	defer c.mu.Unlock()

	// 检查是否需要驱逐
	if len(c.data) >= c.maxSize {
		c.evict()
	}

	c.data[key] = &cacheEntry{
		value:     value,
		expiresAt: time.Now().Add(c.ttl),
		hits:      0,
	}
}

// SetWithTTL 设置带自定义 TTL 的缓存
func (c *QueryCache) SetWithTTL(key string, value interface{}, ttl time.Duration) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if len(c.data) >= c.maxSize {
		c.evict()
	}

	c.data[key] = &cacheEntry{
		value:     value,
		expiresAt: time.Now().Add(ttl),
		hits:      0,
	}
}

// Delete 删除缓存
func (c *QueryCache) Delete(key string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	delete(c.data, key)
}

// Clear 清空缓存
func (c *QueryCache) Clear() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.data = make(map[string]*cacheEntry)
}

// InvalidatePrefix 删除指定前缀的缓存
func (c *QueryCache) InvalidatePrefix(prefix string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	for key := range c.data {
		if len(key) >= len(prefix) && key[:len(prefix)] == prefix {
			delete(c.data, key)
		}
	}
}

// evict 驱逐最少使用的条目
func (c *QueryCache) evict() {
	// 找到命中次数最少的条目
	var minKey string
	var minHits int64 = -1

	for key, entry := range c.data {
		if minHits == -1 || entry.hits < minHits {
			minKey = key
			minHits = entry.hits
		}
	}

	if minKey != "" {
		delete(c.data, minKey)
	}
}

// cleanup 定期清理过期条目
func (c *QueryCache) cleanup() {
	ticker := time.NewTicker(c.cleanupInterval)
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

// Stats 获取缓存统计
func (c *QueryCache) Stats() CacheStats {
	c.mu.RLock()
	defer c.mu.RUnlock()

	var totalHits int64
	for _, entry := range c.data {
		totalHits += entry.hits
	}

	return CacheStats{
		Size:      len(c.data),
		MaxSize:   c.maxSize,
		TotalHits: totalHits,
	}
}

// CacheStats 缓存统计
type CacheStats struct {
	Size      int   `json:"size"`
	MaxSize   int   `json:"maxSize"`
	TotalHits int64 `json:"totalHits"`
}

// ===== 批量查询工具 =====

// BatchQuery 批量查询配置
type BatchQuery struct {
	db        *gorm.DB
	batchSize int
}

// NewBatchQuery 创建批量查询
func NewBatchQuery(db *gorm.DB, batchSize int) *BatchQuery {
	if batchSize <= 0 {
		batchSize = 100
	}
	return &BatchQuery{
		db:        db,
		batchSize: batchSize,
	}
}

// FindInBatches 分批查询
func (b *BatchQuery) FindInBatches(dest interface{}, batchFn func(batch interface{}, batchNum int) error) error {
	return b.db.FindInBatches(dest, b.batchSize, func(tx *gorm.DB, batch int) error {
		return batchFn(dest, batch)
	}).Error
}

// BatchInsert 批量插入
func (b *BatchQuery) BatchInsert(records interface{}) error {
	return b.db.CreateInBatches(records, b.batchSize).Error
}

// BatchUpdate 批量更新
func (b *BatchQuery) BatchUpdate(model interface{}, ids []string, updates map[string]interface{}) error {
	return b.db.Model(model).Where("id IN ?", ids).Updates(updates).Error
}

// BatchDelete 批量删除
func (b *BatchQuery) BatchDelete(model interface{}, ids []string) error {
	return b.db.Where("id IN ?", ids).Delete(model).Error
}

// ===== 预加载优化 =====

// PreloadConfig 预加载配置
type PreloadConfig struct {
	Associations []string
	Conditions   map[string]interface{}
}

// OptimizedPreload 优化的预加载查询
func OptimizedPreload(db *gorm.DB, config PreloadConfig) *gorm.DB {
	query := db

	for _, assoc := range config.Associations {
		if cond, ok := config.Conditions[assoc]; ok {
			query = query.Preload(assoc, cond)
		} else {
			query = query.Preload(assoc)
		}
	}

	return query
}

// ===== 查询性能监控 =====

// QueryMetrics 查询指标
type QueryMetrics struct {
	QueryCount    int64         `json:"queryCount"`
	TotalDuration time.Duration `json:"totalDuration"`
	SlowQueries   int64         `json:"slowQueries"`
	mu            sync.Mutex
}

// GlobalQueryMetrics 全局查询指标
var GlobalQueryMetrics = &QueryMetrics{}

// RecordQuery 记录查询
func (m *QueryMetrics) RecordQuery(duration time.Duration, slowThreshold time.Duration) {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.QueryCount++
	m.TotalDuration += duration
	if duration > slowThreshold {
		m.SlowQueries++
	}
}

// AverageQueryTime 平均查询时间
func (m *QueryMetrics) AverageQueryTime() time.Duration {
	m.mu.Lock()
	defer m.mu.Unlock()

	if m.QueryCount == 0 {
		return 0
	}
	return time.Duration(int64(m.TotalDuration) / m.QueryCount)
}

// Reset 重置指标
func (m *QueryMetrics) Reset() {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.QueryCount = 0
	m.TotalDuration = 0
	m.SlowQueries = 0
}

// ===== 查询构建器 =====

// QueryBuilder 查询构建器
type QueryBuilder struct {
	db *gorm.DB
}

// NewQueryBuilder 创建查询构建器
func NewQueryBuilder(db *gorm.DB) *QueryBuilder {
	return &QueryBuilder{db: db}
}

// WhereIf 条件为真时添加 Where
func (b *QueryBuilder) WhereIf(condition bool, query interface{}, args ...interface{}) *QueryBuilder {
	if condition {
		b.db = b.db.Where(query, args...)
	}
	return b
}

// OrderByIf 条件为真时添加 Order
func (b *QueryBuilder) OrderByIf(condition bool, order string) *QueryBuilder {
	if condition {
		b.db = b.db.Order(order)
	}
	return b
}

// PageIf 条件为真时添加分页
func (b *QueryBuilder) PageIf(condition bool, page, pageSize int) *QueryBuilder {
	if condition && page > 0 && pageSize > 0 {
		offset := (page - 1) * pageSize
		b.db = b.db.Offset(offset).Limit(pageSize)
	}
	return b
}

// SelectIf 条件为真时添加 Select
func (b *QueryBuilder) SelectIf(condition bool, columns ...string) *QueryBuilder {
	if condition && len(columns) > 0 {
		b.db = b.db.Select(columns)
	}
	return b
}

// Build 返回构建的查询
func (b *QueryBuilder) Build() *gorm.DB {
	return b.db
}

// ===== 数据库优化 Scope =====

// WithQueryTimeout 查询超时 Scope
func WithQueryTimeout(timeout time.Duration) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		ctx, cancel := context.WithTimeout(context.Background(), timeout)
		_ = cancel // 需要在外部管理取消
		return db.WithContext(ctx)
	}
}

// WithReadOnly 只读查询 Scope (PostgreSQL)
func WithReadOnly() func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Exec("SET TRANSACTION READ ONLY")
	}
}

// WithNoLog 禁用日志 Scope
func WithNoLog() func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Session(&gorm.Session{Logger: nil})
	}
}

// ===== 分页辅助 =====

// Pagination 分页信息
type Pagination struct {
	Page      int   `json:"page"`
	PageSize  int   `json:"pageSize"`
	Total     int64 `json:"total"`
	TotalPage int   `json:"totalPage"`
}

// NewPagination 创建分页
func NewPagination(page, pageSize int, total int64) *Pagination {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	if pageSize > 100 {
		pageSize = 100
	}

	totalPage := int(total) / pageSize
	if int(total)%pageSize > 0 {
		totalPage++
	}

	return &Pagination{
		Page:      page,
		PageSize:  pageSize,
		Total:     total,
		TotalPage: totalPage,
	}
}

// Offset 计算偏移量
func (p *Pagination) Offset() int {
	return (p.Page - 1) * p.PageSize
}

// HasNext 是否有下一页
func (p *Pagination) HasNext() bool {
	return p.Page < p.TotalPage
}

// HasPrev 是否有上一页
func (p *Pagination) HasPrev() bool {
	return p.Page > 1
}

// Paginate 分页 Scope
func Paginate(page, pageSize int) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if page <= 0 {
			page = 1
		}
		if pageSize <= 0 {
			pageSize = 20
		}
		if pageSize > 100 {
			pageSize = 100
		}

		offset := (page - 1) * pageSize
		return db.Offset(offset).Limit(pageSize)
	}
}

// ===== 键生成 =====

// CacheKey 生成缓存键
func CacheKey(model string, id string) string {
	return fmt.Sprintf("%s:%s", model, id)
}

// CacheKeyList 生成列表缓存键
func CacheKeyList(model string, params map[string]interface{}) string {
	key := model + ":list"
	for k, v := range params {
		key += fmt.Sprintf(":%s=%v", k, v)
	}
	return key
}
