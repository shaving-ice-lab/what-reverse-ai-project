package repository

import (
	"context"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// PlanModuleRepository 规划模块仓储接口
type PlanModuleRepository interface {
	Create(ctx context.Context, module *entity.PlanModule) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.PlanModule, error)
	GetByWorkspaceAndKey(ctx context.Context, workspaceID uuid.UUID, key string) (*entity.PlanModule, error)
	ListByWorkspaceWithTasks(ctx context.Context, workspaceID uuid.UUID) ([]entity.PlanModule, error)
	Update(ctx context.Context, module *entity.PlanModule) error
	Delete(ctx context.Context, id uuid.UUID) error
	ReplaceWorkspaceModules(ctx context.Context, workspaceID uuid.UUID, modules []entity.PlanModule) error
}

type planModuleRepository struct {
	db *gorm.DB
}

// NewPlanModuleRepository 创建规划模块仓储实例
func NewPlanModuleRepository(db *gorm.DB) PlanModuleRepository {
	return &planModuleRepository{db: db}
}

func (r *planModuleRepository) Create(ctx context.Context, module *entity.PlanModule) error {
	return r.db.WithContext(ctx).Create(module).Error
}

func (r *planModuleRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.PlanModule, error) {
	var module entity.PlanModule
	if err := r.db.WithContext(ctx).First(&module, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &module, nil
}

func (r *planModuleRepository) GetByWorkspaceAndKey(ctx context.Context, workspaceID uuid.UUID, key string) (*entity.PlanModule, error) {
	var module entity.PlanModule
	if err := r.db.WithContext(ctx).
		Where("workspace_id = ? AND `key` = ?", workspaceID, key).
		First(&module).Error; err != nil {
		return nil, err
	}
	return &module, nil
}

func (r *planModuleRepository) ListByWorkspaceWithTasks(ctx context.Context, workspaceID uuid.UUID) ([]entity.PlanModule, error) {
	var modules []entity.PlanModule
	if err := r.db.WithContext(ctx).
		Preload("Tasks", func(db *gorm.DB) *gorm.DB {
			return db.Order("sequence ASC, created_at ASC")
		}).
		Where("workspace_id = ?", workspaceID).
		Order("sort_order ASC, created_at ASC").
		Find(&modules).Error; err != nil {
		return nil, err
	}
	return modules, nil
}

func (r *planModuleRepository) Update(ctx context.Context, module *entity.PlanModule) error {
	return r.db.WithContext(ctx).Save(module).Error
}

func (r *planModuleRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&entity.PlanModule{}, "id = ?", id).Error
}

func (r *planModuleRepository) ReplaceWorkspaceModules(ctx context.Context, workspaceID uuid.UUID, modules []entity.PlanModule) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Unscoped().Where("workspace_id = ?", workspaceID).Delete(&entity.PlanModule{}).Error; err != nil {
			return err
		}
		for _, module := range modules {
			tasks := module.Tasks
			module.Tasks = nil
			if err := tx.Create(&module).Error; err != nil {
				return err
			}
			for _, task := range tasks {
				task.ModuleID = module.ID
				if err := tx.Create(&task).Error; err != nil {
					return err
				}
			}
		}
		return nil
	})
}
