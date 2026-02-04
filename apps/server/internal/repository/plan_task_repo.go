package repository

import (
	"context"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// PlanTaskRepository 规划任务仓储接口
type PlanTaskRepository interface {
	Create(ctx context.Context, task *entity.PlanTask) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.PlanTask, error)
	ListByModule(ctx context.Context, moduleID uuid.UUID) ([]entity.PlanTask, error)
	GetMaxSequence(ctx context.Context, moduleID uuid.UUID) (int, error)
	Update(ctx context.Context, task *entity.PlanTask) error
	Delete(ctx context.Context, id uuid.UUID) error
	UpdateSequences(ctx context.Context, moduleID uuid.UUID, taskIDs []uuid.UUID) error
}

type planTaskRepository struct {
	db *gorm.DB
}

// NewPlanTaskRepository 创建规划任务仓储实例
func NewPlanTaskRepository(db *gorm.DB) PlanTaskRepository {
	return &planTaskRepository{db: db}
}

func (r *planTaskRepository) Create(ctx context.Context, task *entity.PlanTask) error {
	return r.db.WithContext(ctx).Create(task).Error
}

func (r *planTaskRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.PlanTask, error) {
	var task entity.PlanTask
	if err := r.db.WithContext(ctx).First(&task, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &task, nil
}

func (r *planTaskRepository) ListByModule(ctx context.Context, moduleID uuid.UUID) ([]entity.PlanTask, error) {
	var tasks []entity.PlanTask
	if err := r.db.WithContext(ctx).
		Where("module_id = ?", moduleID).
		Order("sequence ASC, created_at ASC").
		Find(&tasks).Error; err != nil {
		return nil, err
	}
	return tasks, nil
}

func (r *planTaskRepository) GetMaxSequence(ctx context.Context, moduleID uuid.UUID) (int, error) {
	var maxSequence int
	err := r.db.WithContext(ctx).Model(&entity.PlanTask{}).
		Where("module_id = ?", moduleID).
		Select("COALESCE(MAX(sequence), 0)").
		Scan(&maxSequence).Error
	return maxSequence, err
}

func (r *planTaskRepository) Update(ctx context.Context, task *entity.PlanTask) error {
	return r.db.WithContext(ctx).Save(task).Error
}

func (r *planTaskRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&entity.PlanTask{}, "id = ?", id).Error
}

func (r *planTaskRepository) UpdateSequences(ctx context.Context, moduleID uuid.UUID, taskIDs []uuid.UUID) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for idx, taskID := range taskIDs {
			if err := tx.Model(&entity.PlanTask{}).
				Where("id = ? AND module_id = ?", taskID, moduleID).
				Update("sequence", idx+1).Error; err != nil {
				return err
			}
		}
		return nil
	})
}
