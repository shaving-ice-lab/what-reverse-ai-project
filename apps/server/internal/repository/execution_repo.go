package repository

import (
	"context"

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
}

// ExecutionListParams 执行记录列表参数
type ExecutionListParams struct {
	UserID     *uuid.UUID
	WorkflowID *uuid.UUID
	Status     string
	Page       int
	PageSize   int
	Sort       string
	Order      string
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
