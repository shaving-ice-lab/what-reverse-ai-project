package database

import (
	"fmt"

	"gorm.io/gorm"
)

/**
 * 数据库迁移和索引管理
 *
 * 索引设计原则:
 * 1. 为常用查询字段添加索引
 * 2. 为外键字段添加索引
 * 3. 为排序字段添加索引
 * 4. 使用复合索引优化多条件查询
 */

// IndexDefinition 索引定义
type IndexDefinition struct {
	Table   string
	Name    string
	Columns []string
	Unique  bool
}

// GetRequiredIndexes 获取所需的索引定义
func GetRequiredIndexes() []IndexDefinition {
	return []IndexDefinition{
		// ===== 用户表索引 =====
		{
			Table:   "what_users",
			Name:    "idx_users_email",
			Columns: []string{"email"},
			Unique:  true,
		},
		{
			Table:   "what_users",
			Name:    "idx_users_username",
			Columns: []string{"username"},
			Unique:  true,
		},
		{
			Table:   "what_users",
			Name:    "idx_users_created_at",
			Columns: []string{"created_at"},
			Unique:  false,
		},
		{
			Table:   "what_users",
			Name:    "idx_users_status",
			Columns: []string{"status"},
			Unique:  false,
		},

		// ===== 工作流表索引 =====
		{
			Table:   "what_workflows",
			Name:    "idx_workflows_user_id",
			Columns: []string{"user_id"},
			Unique:  false,
		},
		{
			Table:   "what_workflows",
			Name:    "idx_workflows_created_at",
			Columns: []string{"created_at"},
			Unique:  false,
		},
		{
			Table:   "what_workflows",
			Name:    "idx_workflows_updated_at",
			Columns: []string{"updated_at"},
			Unique:  false,
		},
		{
			Table:   "what_workflows",
			Name:    "idx_workflows_status",
			Columns: []string{"status"},
			Unique:  false,
		},
		{
			Table:   "what_workflows",
			Name:    "idx_workflows_user_status",
			Columns: []string{"user_id", "status"},
			Unique:  false,
		},
		{
			Table:   "what_workflows",
			Name:    "idx_workflows_user_created",
			Columns: []string{"user_id", "created_at"},
			Unique:  false,
		},

		// ===== 执行记录表索引 =====
		{
			Table:   "what_executions",
			Name:    "idx_executions_workflow_id",
			Columns: []string{"workflow_id"},
			Unique:  false,
		},
		{
			Table:   "what_executions",
			Name:    "idx_executions_user_id",
			Columns: []string{"user_id"},
			Unique:  false,
		},
		{
			Table:   "what_executions",
			Name:    "idx_executions_status",
			Columns: []string{"status"},
			Unique:  false,
		},
		{
			Table:   "what_executions",
			Name:    "idx_executions_started_at",
			Columns: []string{"started_at"},
			Unique:  false,
		},
		{
			Table:   "what_executions",
			Name:    "idx_executions_workflow_status",
			Columns: []string{"workflow_id", "status"},
			Unique:  false,
		},
		{
			Table:   "what_executions",
			Name:    "idx_executions_user_started",
			Columns: []string{"user_id", "started_at"},
			Unique:  false,
		},

		// ===== API 密钥表索引 =====
		{
			Table:   "what_api_keys",
			Name:    "idx_api_keys_user_id",
			Columns: []string{"user_id"},
			Unique:  false,
		},
		{
			Table:   "what_api_keys",
			Name:    "idx_api_keys_provider",
			Columns: []string{"provider"},
			Unique:  false,
		},
		{
			Table:   "what_api_keys",
			Name:    "idx_api_keys_user_provider",
			Columns: []string{"user_id", "provider"},
			Unique:  false,
		},

		// ===== Agent 表索引 =====
		{
			Table:   "what_agents",
			Name:    "idx_agents_user_id",
			Columns: []string{"user_id"},
			Unique:  false,
		},
		{
			Table:   "what_agents",
			Name:    "idx_agents_category",
			Columns: []string{"category"},
			Unique:  false,
		},
		{
			Table:   "what_agents",
			Name:    "idx_agents_is_public",
			Columns: []string{"is_public"},
			Unique:  false,
		},
		{
			Table:   "what_agents",
			Name:    "idx_agents_created_at",
			Columns: []string{"created_at"},
			Unique:  false,
		},
		{
			Table:   "what_agents",
			Name:    "idx_agents_public_category",
			Columns: []string{"is_public", "category"},
			Unique:  false,
		},

		// ===== 执行日志表索引 (如果存在) =====
		{
			Table:   "what_execution_logs",
			Name:    "idx_execution_logs_execution_id",
			Columns: []string{"execution_id"},
			Unique:  false,
		},
		{
			Table:   "what_execution_logs",
			Name:    "idx_execution_logs_node_id",
			Columns: []string{"node_id"},
			Unique:  false,
		},
		{
			Table:   "what_execution_logs",
			Name:    "idx_execution_logs_timestamp",
			Columns: []string{"timestamp"},
			Unique:  false,
		},
	}
}

// CreateIndex 创建单个索引
func CreateIndex(db *gorm.DB, idx IndexDefinition) error {
	// 构建列列表
	columns := ""
	for i, col := range idx.Columns {
		if i > 0 {
			columns += ", "
		}
		columns += col
	}

	// 构建 SQL
	uniqueStr := ""
	if idx.Unique {
		uniqueStr = "UNIQUE "
	}

	sql := fmt.Sprintf(
		"CREATE %sINDEX IF NOT EXISTS %s ON %s (%s)",
		uniqueStr, idx.Name, idx.Table, columns,
	)

	return db.Exec(sql).Error
}

// DropIndex 删除索引
func DropIndex(db *gorm.DB, idx IndexDefinition) error {
	sql := fmt.Sprintf("DROP INDEX IF EXISTS %s", idx.Name)
	return db.Exec(sql).Error
}

// CreateAllIndexes 创建所有索引
func CreateAllIndexes(db *gorm.DB) error {
	indexes := GetRequiredIndexes()

	for _, idx := range indexes {
		if err := CreateIndex(db, idx); err != nil {
			// 记录错误但继续执行（某些索引可能已存在或表不存在）
			fmt.Printf("Warning: Failed to create index %s: %v\n", idx.Name, err)
		}
	}

	return nil
}

// DropAllIndexes 删除所有索引
func DropAllIndexes(db *gorm.DB) error {
	indexes := GetRequiredIndexes()

	for _, idx := range indexes {
		if err := DropIndex(db, idx); err != nil {
			fmt.Printf("Warning: Failed to drop index %s: %v\n", idx.Name, err)
		}
	}

	return nil
}

// CheckIndexExists 检查索引是否存在
func CheckIndexExists(db *gorm.DB, indexName string) (bool, error) {
	var count int64
	err := db.Raw(`
		SELECT COUNT(*) 
		FROM pg_indexes 
		WHERE indexname = ?
	`, indexName).Scan(&count).Error

	return count > 0, err
}

// GetMissingIndexes 获取缺失的索引
func GetMissingIndexes(db *gorm.DB) ([]IndexDefinition, error) {
	var missing []IndexDefinition
	indexes := GetRequiredIndexes()

	for _, idx := range indexes {
		exists, err := CheckIndexExists(db, idx.Name)
		if err != nil {
			// 跳过检查失败的索引
			continue
		}
		if !exists {
			missing = append(missing, idx)
		}
	}

	return missing, nil
}

// AnalyzeTable 分析表以更新统计信息
func AnalyzeTable(db *gorm.DB, tableName string) error {
	return db.Exec(fmt.Sprintf("ANALYZE %s", tableName)).Error
}

// AnalyzeAllTables 分析所有相关表
func AnalyzeAllTables(db *gorm.DB) error {
	tables := []string{
		"what_users",
		"what_workflows",
		"what_executions",
		"what_api_keys",
		"what_agents",
	}

	for _, table := range tables {
		if err := AnalyzeTable(db, table); err != nil {
			fmt.Printf("Warning: Failed to analyze table %s: %v\n", table, err)
		}
	}

	return nil
}

// VacuumTable 清理表（PostgreSQL）
func VacuumTable(db *gorm.DB, tableName string) error {
	return db.Exec(fmt.Sprintf("VACUUM ANALYZE %s", tableName)).Error
}

// GetTableStats 获取表统计信息
func GetTableStats(db *gorm.DB, tableName string) (*TableStats, error) {
	var stats TableStats

	err := db.Raw(`
		SELECT 
			reltuples::bigint as estimated_rows,
			pg_total_relation_size(oid) as total_size,
			pg_table_size(oid) as table_size,
			pg_indexes_size(oid) as indexes_size
		FROM pg_class
		WHERE relname = ?
	`, tableName).Scan(&stats).Error

	if err != nil {
		return nil, err
	}

	stats.TableName = tableName
	return &stats, nil
}

// TableStats 表统计信息
type TableStats struct {
	TableName     string `json:"tableName"`
	EstimatedRows int64  `json:"estimatedRows"`
	TotalSize     int64  `json:"totalSize"`
	TableSize     int64  `json:"tableSize"`
	IndexesSize   int64  `json:"indexesSize"`
}

// FormatSize 格式化大小
func FormatSize(bytes int64) string {
	const (
		KB = 1024
		MB = KB * 1024
		GB = MB * 1024
	)

	switch {
	case bytes >= GB:
		return fmt.Sprintf("%.2f GB", float64(bytes)/GB)
	case bytes >= MB:
		return fmt.Sprintf("%.2f MB", float64(bytes)/MB)
	case bytes >= KB:
		return fmt.Sprintf("%.2f KB", float64(bytes)/KB)
	default:
		return fmt.Sprintf("%d B", bytes)
	}
}

// GetIndexStats 获取索引统计
func GetIndexStats(db *gorm.DB, tableName string) ([]IndexStats, error) {
	var stats []IndexStats

	err := db.Raw(`
		SELECT 
			indexrelname as index_name,
			idx_scan as scans,
			idx_tup_read as tuples_read,
			idx_tup_fetch as tuples_fetched,
			pg_relation_size(indexrelid) as size
		FROM pg_stat_user_indexes
		WHERE relname = ?
		ORDER BY idx_scan DESC
	`, tableName).Scan(&stats).Error

	return stats, err
}

// IndexStats 索引统计
type IndexStats struct {
	IndexName     string `json:"indexName"`
	Scans         int64  `json:"scans"`
	TuplesRead    int64  `json:"tuplesRead"`
	TuplesFetched int64  `json:"tuplesFetched"`
	Size          int64  `json:"size"`
}

// FindUnusedIndexes 查找未使用的索引
func FindUnusedIndexes(db *gorm.DB) ([]string, error) {
	var unused []string

	err := db.Raw(`
		SELECT indexrelname 
		FROM pg_stat_user_indexes
		WHERE idx_scan = 0
		AND indexrelname NOT LIKE '%_pkey'
	`).Scan(&unused).Error

	return unused, err
}
