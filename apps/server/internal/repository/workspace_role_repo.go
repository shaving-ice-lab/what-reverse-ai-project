package repository

import (
	"context"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// WorkspaceRoleRepository 工作空间角色仓储接口
type WorkspaceRoleRepository interface {
	Create(ctx context.Context, role *entity.WorkspaceRole) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.WorkspaceRole, error)
	GetByWorkspaceAndName(ctx context.Context, workspaceID uuid.UUID, name string) (*entity.WorkspaceRole, error)
	ListByWorkspaceID(ctx context.Context, workspaceID uuid.UUID) ([]entity.WorkspaceRole, error)
	Update(ctx context.Context, role *entity.WorkspaceRole) error
}

type workspaceRoleRepository struct {
	db *gorm.DB
}

// NewWorkspaceRoleRepository 创建工作空间角色仓储实例
func NewWorkspaceRoleRepository(db *gorm.DB) WorkspaceRoleRepository {
	return &workspaceRoleRepository{db: db}
}

func (r *workspaceRoleRepository) Create(ctx context.Context, role *entity.WorkspaceRole) error {
	return r.db.WithContext(ctx).Create(role).Error
}

func (r *workspaceRoleRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.WorkspaceRole, error) {
	var role entity.WorkspaceRole
	if err := r.db.WithContext(ctx).First(&role, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &role, nil
}

func (r *workspaceRoleRepository) GetByWorkspaceAndName(ctx context.Context, workspaceID uuid.UUID, name string) (*entity.WorkspaceRole, error) {
	var role entity.WorkspaceRole
	if err := r.db.WithContext(ctx).
		First(&role, "workspace_id = ? AND name = ?", workspaceID, name).Error; err != nil {
		return nil, err
	}
	return &role, nil
}

func (r *workspaceRoleRepository) ListByWorkspaceID(ctx context.Context, workspaceID uuid.UUID) ([]entity.WorkspaceRole, error) {
	var roles []entity.WorkspaceRole
	if err := r.db.WithContext(ctx).
		Where("workspace_id = ?", workspaceID).
		Order("created_at ASC").
		Find(&roles).Error; err != nil {
		return nil, err
	}
	return roles, nil
}

func (r *workspaceRoleRepository) Update(ctx context.Context, role *entity.WorkspaceRole) error {
	return r.db.WithContext(ctx).Save(role).Error
}
