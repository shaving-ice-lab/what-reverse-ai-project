package repository

import (
	"context"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// WorkflowRepository 工作流仓储接口
type WorkflowRepository interface {
	Create(ctx context.Context, workflow *entity.Workflow) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.Workflow, error)
	GetByIDs(ctx context.Context, ids []uuid.UUID) ([]entity.Workflow, error)
	List(ctx context.Context, userID uuid.UUID, params ListParams) ([]entity.Workflow, int64, error)
	Update(ctx context.Context, workflow *entity.Workflow) error
	Delete(ctx context.Context, id uuid.UUID) error
	DeleteByIDs(ctx context.Context, ids []uuid.UUID, userID uuid.UUID) (int64, error)
	BatchUpdateStatus(ctx context.Context, ids []uuid.UUID, userID uuid.UUID, status string) (int64, error)
	IncrementRunCount(ctx context.Context, id uuid.UUID) error
}

// ListParams 列表查询参数
type ListParams struct {
	Page     int
	PageSize int
	Search   string
	Status   string
	Sort     string
	Order    string
}

type workflowRepository struct {
	db *gorm.DB
}

// NewWorkflowRepository 创建工作流仓储实例
func NewWorkflowRepository(db *gorm.DB) WorkflowRepository {
	return &workflowRepository{db: db}
}

func (r *workflowRepository) Create(ctx context.Context, workflow *entity.Workflow) error {
	return r.db.WithContext(ctx).Create(workflow).Error
}

func (r *workflowRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.Workflow, error) {
	var workflow entity.Workflow
	if err := r.db.WithContext(ctx).First(&workflow, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &workflow, nil
}

func (r *workflowRepository) List(ctx context.Context, userID uuid.UUID, params ListParams) ([]entity.Workflow, int64, error) {
	var workflows []entity.Workflow
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.Workflow{}).Where("user_id = ?", userID)

	// 搜索
	if params.Search != "" {
		query = query.Where("name ILIKE ? OR description ILIKE ?", "%"+params.Search+"%", "%"+params.Search+"%")
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
	sort := "updated_at"
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

	if err := query.Find(&workflows).Error; err != nil {
		return nil, 0, err
	}

	return workflows, total, nil
}

func (r *workflowRepository) Update(ctx context.Context, workflow *entity.Workflow) error {
	return r.db.WithContext(ctx).Save(workflow).Error
}

func (r *workflowRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&entity.Workflow{}, "id = ?", id).Error
}

func (r *workflowRepository) IncrementRunCount(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Model(&entity.Workflow{}).
		Where("id = ?", id).
		UpdateColumn("run_count", gorm.Expr("run_count + 1")).Error
}

func (r *workflowRepository) GetByIDs(ctx context.Context, ids []uuid.UUID) ([]entity.Workflow, error) {
	var workflows []entity.Workflow
	if err := r.db.WithContext(ctx).Where("id IN ?", ids).Find(&workflows).Error; err != nil {
		return nil, err
	}
	return workflows, nil
}

func (r *workflowRepository) DeleteByIDs(ctx context.Context, ids []uuid.UUID, userID uuid.UUID) (int64, error) {
	result := r.db.WithContext(ctx).
		Where("id IN ? AND user_id = ?", ids, userID).
		Delete(&entity.Workflow{})
	return result.RowsAffected, result.Error
}

func (r *workflowRepository) BatchUpdateStatus(ctx context.Context, ids []uuid.UUID, userID uuid.UUID, status string) (int64, error) {
	result := r.db.WithContext(ctx).Model(&entity.Workflow{}).
		Where("id IN ? AND user_id = ?", ids, userID).
		Update("status", status)
	return result.RowsAffected, result.Error
}
