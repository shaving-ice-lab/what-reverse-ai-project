package repository

import (
	"context"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AppSlugAliasRepository App slug 别名仓储接口
type AppSlugAliasRepository interface {
	Create(ctx context.Context, alias *entity.AppSlugAlias) error
	GetByWorkspaceAndSlug(ctx context.Context, workspaceID uuid.UUID, slug string) (*entity.AppSlugAlias, error)
}

type appSlugAliasRepository struct {
	db *gorm.DB
}

// NewAppSlugAliasRepository 创建 App slug 别名仓储实例
func NewAppSlugAliasRepository(db *gorm.DB) AppSlugAliasRepository {
	return &appSlugAliasRepository{db: db}
}

func (r *appSlugAliasRepository) Create(ctx context.Context, alias *entity.AppSlugAlias) error {
	return r.db.WithContext(ctx).Create(alias).Error
}

func (r *appSlugAliasRepository) GetByWorkspaceAndSlug(ctx context.Context, workspaceID uuid.UUID, slug string) (*entity.AppSlugAlias, error) {
	var alias entity.AppSlugAlias
	if err := r.db.WithContext(ctx).
		First(&alias, "workspace_id = ? AND slug = ?", workspaceID, slug).Error; err != nil {
		return nil, err
	}
	return &alias, nil
}
