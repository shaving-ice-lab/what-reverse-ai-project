package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/reverseai/server/internal/domain/entity"
	"gorm.io/gorm"
)

// WorkspaceDBSchemaMigrationRepository 工作空间 DB Schema 迁移仓储接口
type WorkspaceDBSchemaMigrationRepository interface {
	Create(ctx context.Context, migration *entity.WorkspaceDBSchemaMigration) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.WorkspaceDBSchemaMigration, error)
	GetActiveByWorkspace(ctx context.Context, workspaceID uuid.UUID, statuses []entity.WorkspaceDBSchemaMigrationStatus) (*entity.WorkspaceDBSchemaMigration, error)
	ListByWorkspace(ctx context.Context, workspaceID uuid.UUID) ([]entity.WorkspaceDBSchemaMigration, error)
	Update(ctx context.Context, migration *entity.WorkspaceDBSchemaMigration) error
	Delete(ctx context.Context, id uuid.UUID) error
}

type workspaceDBSchemaMigrationRepository struct {
	db *gorm.DB
}

// NewWorkspaceDBSchemaMigrationRepository 创建工作空间 DB Schema 迁移仓储实例
func NewWorkspaceDBSchemaMigrationRepository(db *gorm.DB) WorkspaceDBSchemaMigrationRepository {
	return &workspaceDBSchemaMigrationRepository{db: db}
}

func (r *workspaceDBSchemaMigrationRepository) Create(ctx context.Context, migration *entity.WorkspaceDBSchemaMigration) error {
	return r.db.WithContext(ctx).Create(migration).Error
}

func (r *workspaceDBSchemaMigrationRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.WorkspaceDBSchemaMigration, error) {
	var migration entity.WorkspaceDBSchemaMigration
	if err := r.db.WithContext(ctx).
		Preload("Submitter").
		Preload("Approver").
		Preload("ReviewQueue").
		First(&migration, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &migration, nil
}

func (r *workspaceDBSchemaMigrationRepository) GetActiveByWorkspace(ctx context.Context, workspaceID uuid.UUID, statuses []entity.WorkspaceDBSchemaMigrationStatus) (*entity.WorkspaceDBSchemaMigration, error) {
	var migration entity.WorkspaceDBSchemaMigration
	if err := r.db.WithContext(ctx).
		Where("workspace_id = ? AND status IN ?", workspaceID, statuses).
		Order("created_at DESC").
		First(&migration).Error; err != nil {
		return nil, err
	}
	return &migration, nil
}

func (r *workspaceDBSchemaMigrationRepository) ListByWorkspace(ctx context.Context, workspaceID uuid.UUID) ([]entity.WorkspaceDBSchemaMigration, error) {
	var migrations []entity.WorkspaceDBSchemaMigration
	if err := r.db.WithContext(ctx).
		Where("workspace_id = ?", workspaceID).
		Order("created_at DESC").
		Find(&migrations).Error; err != nil {
		return nil, err
	}
	return migrations, nil
}

func (r *workspaceDBSchemaMigrationRepository) Update(ctx context.Context, migration *entity.WorkspaceDBSchemaMigration) error {
	return r.db.WithContext(ctx).Save(migration).Error
}

func (r *workspaceDBSchemaMigrationRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&entity.WorkspaceDBSchemaMigration{}, "id = ?", id).Error
}
