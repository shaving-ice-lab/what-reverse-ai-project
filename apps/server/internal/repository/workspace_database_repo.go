package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/reverseai/server/internal/domain/entity"
	"gorm.io/gorm"
)

// WorkspaceDatabaseRepository 工作空间数据库仓储接口
type WorkspaceDatabaseRepository interface {
	Create(ctx context.Context, database *entity.WorkspaceDatabase) error
	GetByWorkspaceID(ctx context.Context, workspaceID uuid.UUID) (*entity.WorkspaceDatabase, error)
	Update(ctx context.Context, database *entity.WorkspaceDatabase) error
}

type workspaceDatabaseRepository struct {
	db *gorm.DB
}

// NewWorkspaceDatabaseRepository 创建工作空间数据库仓储实例
func NewWorkspaceDatabaseRepository(db *gorm.DB) WorkspaceDatabaseRepository {
	return &workspaceDatabaseRepository{db: db}
}

func (r *workspaceDatabaseRepository) Create(ctx context.Context, database *entity.WorkspaceDatabase) error {
	return r.db.WithContext(ctx).Create(database).Error
}

func (r *workspaceDatabaseRepository) GetByWorkspaceID(ctx context.Context, workspaceID uuid.UUID) (*entity.WorkspaceDatabase, error) {
	var database entity.WorkspaceDatabase
	if err := r.db.WithContext(ctx).First(&database, "workspace_id = ?", workspaceID).Error; err != nil {
		return nil, err
	}
	return &database, nil
}

func (r *workspaceDatabaseRepository) Update(ctx context.Context, database *entity.WorkspaceDatabase) error {
	return r.db.WithContext(ctx).Save(database).Error
}
