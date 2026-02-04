package repository

import (
	"context"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// WorkspaceSlugAliasRepository 工作空间 slug 别名仓储接口
type WorkspaceSlugAliasRepository interface {
	Create(ctx context.Context, alias *entity.WorkspaceSlugAlias) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.WorkspaceSlugAlias, error)
	GetBySlug(ctx context.Context, slug string) (*entity.WorkspaceSlugAlias, error)
}

type workspaceSlugAliasRepository struct {
	db *gorm.DB
}

// NewWorkspaceSlugAliasRepository 创建工作空间 slug 别名仓储实例
func NewWorkspaceSlugAliasRepository(db *gorm.DB) WorkspaceSlugAliasRepository {
	return &workspaceSlugAliasRepository{db: db}
}

func (r *workspaceSlugAliasRepository) Create(ctx context.Context, alias *entity.WorkspaceSlugAlias) error {
	return r.db.WithContext(ctx).Create(alias).Error
}

func (r *workspaceSlugAliasRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.WorkspaceSlugAlias, error) {
	var alias entity.WorkspaceSlugAlias
	if err := r.db.WithContext(ctx).First(&alias, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &alias, nil
}

func (r *workspaceSlugAliasRepository) GetBySlug(ctx context.Context, slug string) (*entity.WorkspaceSlugAlias, error) {
	var alias entity.WorkspaceSlugAlias
	if err := r.db.WithContext(ctx).First(&alias, "slug = ?", slug).Error; err != nil {
		return nil, err
	}
	return &alias, nil
}
