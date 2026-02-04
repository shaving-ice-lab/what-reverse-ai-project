package repository

import (
	"context"
	"database/sql"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ExecutionRepository 执行记录仓储接口
type ExecutionRepository interface {
	Create(ctx context.Context, execution *entity.Execution) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.Execution, error)
	List(ctx context.Context, params ExecutionListParams) ([]entity.Execution, int64, error)
	Update(ctx context.Context, execution *entity.Execution) error
	CreateNodeLog(ctx context.Context, log *entity.NodeLog) error
	GetNodeLogs(ctx context.Context, executionID uuid.UUID) ([]entity.NodeLog, error)
	UpdateNodeLog(ctx context.Context, log *entity.NodeLog) error
	DeleteNodeLogsOlderThan(ctx context.Context, before time.Time) (int64, error)
	ListExecutionsByWorkspaceAndCreatedBetween(ctx context.Context, workspaceID uuid.UUID, start, end time.Time, offset, limit int) ([]entity.Execution, error)
	ListNodeLogsByWorkspaceAndCreatedBetween(ctx context.Context, workspaceID uuid.UUID, start, end time.Time, offset, limit int) ([]entity.NodeLog, error)
	GetEarliestExecutionCreatedAtByWorkspace(ctx context.Context, workspaceID uuid.UUID) (*time.Time, error)
	GetEarliestNodeLogCreatedAtByWorkspace(ctx context.Context, workspaceID uuid.UUID) (*time.Time, error)
	ListWorkspaceIDsWithNodeLogsBefore(ctx context.Context, before time.Time, limit int) ([]uuid.UUID, error)
	DeleteNodeLogsByWorkspaceAndCreatedBetween(ctx context.Context, workspaceID uuid.UUID, start, end time.Time) (int64, error)
	GetUsageByUser(ctx context.Context, userID uuid.UUID, since time.Time) (ExecutionUsageStats, error)
}

type ExecutionUsageStats struct {
	TotalExecutions      int64
	TotalTokens          int64
	Last30DaysExecutions int64
}

// ExecutionListParams 执行记录列表参数
type ExecutionListParams struct {
	UserID      *uuid.UUID
	WorkflowID  *uuid.UUID
	WorkspaceID *uuid.UUID
	Status      string
	Page        int
	PageSize    int
	Sort        string
	Order       string
}

type executionRepository struct {
	db *gorm.DB
}

// NewExecutionRepository 创建执行记录仓储实例
func NewExecutionRepository(db *gorm.DB) ExecutionRepository {
	return &executionRepository{db: db}
}

func (r *executionRepository) Create(ctx context.Context, execution *entity.Execution) error {
	return r.db.WithContext(ctx).Create(execution).Error
}

func (r *executionRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.Execution, error) {
	var execution entity.Execution
	if err := r.db.WithContext(ctx).Preload("NodeLogs").First(&execution, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &execution, nil
}

func (r *executionRepository) List(ctx context.Context, params ExecutionListParams) ([]entity.Execution, int64, error) {
	var executions []entity.Execution
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.Execution{})

	// 用户过滤
	if params.UserID != nil {
		query = query.Where("user_id = ?", *params.UserID)
	}

	// 工作流过滤
	if params.WorkflowID != nil {
		query = query.Where("workflow_id = ?", *params.WorkflowID)
	}

	// 工作空间过滤
	if params.WorkspaceID != nil {
		query = query.Where("workspace_id = ?", *params.WorkspaceID)
	}

	// 状态过滤
	if params.Status != "" {
		query = query.Where("status = ?", params.Status)
	}

	// 统计总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 排序
	sort := "created_at"
	if params.Sort != "" {
		sort = params.Sort
	}
	order := "desc"
	if params.Order != "" {
		order = params.Order
	}
	query = query.Order(sort + " " + order)

	// 分页
	if params.Page > 0 && params.PageSize > 0 {
		offset := (params.Page - 1) * params.PageSize
		query = query.Offset(offset).Limit(params.PageSize)
	}

	if err := query.Find(&executions).Error; err != nil {
		return nil, 0, err
	}

	return executions, total, nil
}

func (r *executionRepository) Update(ctx context.Context, execution *entity.Execution) error {
	return r.db.WithContext(ctx).Save(execution).Error
}

func (r *executionRepository) CreateNodeLog(ctx context.Context, log *entity.NodeLog) error {
	return r.db.WithContext(ctx).Create(log).Error
}

func (r *executionRepository) GetNodeLogs(ctx context.Context, executionID uuid.UUID) ([]entity.NodeLog, error) {
	var logs []entity.NodeLog
	if err := r.db.WithContext(ctx).Where("execution_id = ?", executionID).Order("created_at asc").Find(&logs).Error; err != nil {
		return nil, err
	}
	return logs, nil
}

func (r *executionRepository) UpdateNodeLog(ctx context.Context, log *entity.NodeLog) error {
	return r.db.WithContext(ctx).Save(log).Error
}

func (r *executionRepository) DeleteNodeLogsOlderThan(ctx context.Context, before time.Time) (int64, error) {
	result := r.db.WithContext(ctx).
		Where("created_at < ?", before).
		Delete(&entity.NodeLog{})
	return result.RowsAffected, result.Error
}

func (r *executionRepository) ListExecutionsByWorkspaceAndCreatedBetween(ctx context.Context, workspaceID uuid.UUID, start, end time.Time, offset, limit int) ([]entity.Execution, error) {
	if limit <= 0 {
		limit = 200
	}
	var executions []entity.Execution
	err := r.db.WithContext(ctx).
		Where("workspace_id = ? AND created_at >= ? AND created_at < ?", workspaceID, start, end).
		Order("created_at ASC").
		Offset(offset).
		Limit(limit).
		Find(&executions).Error
	return executions, err
}

func (r *executionRepository) ListNodeLogsByWorkspaceAndCreatedBetween(ctx context.Context, workspaceID uuid.UUID, start, end time.Time, offset, limit int) ([]entity.NodeLog, error) {
	if limit <= 0 {
		limit = 200
	}
	var logs []entity.NodeLog
	err := r.db.WithContext(ctx).
		Table("what_reverse_node_logs").
		Joins("JOIN what_reverse_executions ON what_reverse_executions.id = what_reverse_node_logs.execution_id").
		Where("what_reverse_executions.workspace_id = ?", workspaceID).
		Where("what_reverse_node_logs.created_at >= ? AND what_reverse_node_logs.created_at < ?", start, end).
		Order("what_reverse_node_logs.created_at ASC").
		Offset(offset).
		Limit(limit).
		Find(&logs).Error
	return logs, err
}

func (r *executionRepository) GetEarliestExecutionCreatedAtByWorkspace(ctx context.Context, workspaceID uuid.UUID) (*time.Time, error) {
	var result struct {
		CreatedAt *time.Time `gorm:"column:created_at"`
	}
	err := r.db.WithContext(ctx).
		Model(&entity.Execution{}).
		Select("MIN(created_at) AS created_at").
		Where("workspace_id = ?", workspaceID).
		Scan(&result).Error
	if err != nil {
		return nil, err
	}
	return result.CreatedAt, nil
}

func (r *executionRepository) GetEarliestNodeLogCreatedAtByWorkspace(ctx context.Context, workspaceID uuid.UUID) (*time.Time, error) {
	var result struct {
		CreatedAt *time.Time `gorm:"column:created_at"`
	}
	err := r.db.WithContext(ctx).
		Table("what_reverse_node_logs").
		Select("MIN(what_reverse_node_logs.created_at) AS created_at").
		Joins("JOIN what_reverse_executions ON what_reverse_executions.id = what_reverse_node_logs.execution_id").
		Where("what_reverse_executions.workspace_id = ?", workspaceID).
		Scan(&result).Error
	if err != nil {
		return nil, err
	}
	return result.CreatedAt, nil
}

func (r *executionRepository) ListWorkspaceIDsWithNodeLogsBefore(ctx context.Context, before time.Time, limit int) ([]uuid.UUID, error) {
	if limit <= 0 {
		limit = 200
	}
	var ids []uuid.UUID
	err := r.db.WithContext(ctx).
		Table("what_reverse_executions").
		Select("DISTINCT what_reverse_executions.workspace_id").
		Joins("JOIN what_reverse_node_logs ON what_reverse_node_logs.execution_id = what_reverse_executions.id").
		Where("what_reverse_node_logs.created_at < ?", before).
		Limit(limit).
		Scan(&ids).Error
	return ids, err
}

func (r *executionRepository) DeleteNodeLogsByWorkspaceAndCreatedBetween(ctx context.Context, workspaceID uuid.UUID, start, end time.Time) (int64, error) {
	subQuery := r.db.WithContext(ctx).
		Model(&entity.Execution{}).
		Select("id").
		Where("workspace_id = ?", workspaceID)
	result := r.db.WithContext(ctx).
		Where("execution_id IN (?)", subQuery).
		Where("created_at >= ? AND created_at < ?", start, end).
		Delete(&entity.NodeLog{})
	return result.RowsAffected, result.Error
}

func (r *executionRepository) GetUsageByUser(ctx context.Context, userID uuid.UUID, since time.Time) (ExecutionUsageStats, error) {
	stats := ExecutionUsageStats{}

	if err := r.db.WithContext(ctx).
		Model(&entity.Execution{}).
		Where("user_id = ?", userID).
		Count(&stats.TotalExecutions).Error; err != nil {
		return stats, err
	}

	if !since.IsZero() {
		if err := r.db.WithContext(ctx).
			Model(&entity.Execution{}).
			Where("user_id = ? AND created_at >= ?", userID, since).
			Count(&stats.Last30DaysExecutions).Error; err != nil {
			return stats, err
		}
	} else {
		stats.Last30DaysExecutions = stats.TotalExecutions
	}

	type tokenAgg struct {
		TotalTokens sql.NullFloat64 `gorm:"column:total_tokens"`
	}
	var tokenResult tokenAgg
	if err := r.db.WithContext(ctx).
		Model(&entity.Execution{}).
		Select("COALESCE(SUM(CAST(JSON_UNQUOTE(JSON_EXTRACT(token_usage, '$.total_tokens')) AS UNSIGNED)), 0) AS total_tokens").
		Where("user_id = ?", userID).
		Scan(&tokenResult).Error; err != nil {
		return stats, err
	}
	if tokenResult.TotalTokens.Valid {
		stats.TotalTokens = int64(tokenResult.TotalTokens.Float64)
	}

	return stats, nil
}
