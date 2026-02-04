package repository

import (
	"context"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// WorkspaceDBRoleListParams 角色列表筛选参数
type WorkspaceDBRoleListParams struct {
	WorkspaceID uuid.UUID
	AppID       *uuid.UUID
	Status      *string
	RoleType    *string
}

// WorkspaceDBRoleRepository 工作空间数据库角色仓储接口
type WorkspaceDBRoleRepository interface {
	Create(ctx context.Context, role *entity.WorkspaceDBRole) error
	Update(ctx context.Context, role *entity.WorkspaceDBRole) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.WorkspaceDBRole, error)
	GetActiveByWorkspaceAppRole(ctx context.Context, workspaceID uuid.UUID, appID *uuid.UUID, roleType string) (*entity.WorkspaceDBRole, error)
	ListByWorkspace(ctx context.Context, params WorkspaceDBRoleListParams) ([]entity.WorkspaceDBRole, error)
}

type workspaceDBRoleRepository struct {
	db *gorm.DB
}

// NewWorkspaceDBRoleRepository 创建工作空间数据库角色仓储实例
func NewWorkspaceDBRoleRepository(db *gorm.DB) WorkspaceDBRoleRepository {
	return &workspaceDBRoleRepository{db: db}
}

func (r *workspaceDBRoleRepository) Create(ctx context.Context, role *entity.WorkspaceDBRole) error {
	return r.db.WithContext(ctx).Create(role).Error
}

func (r *workspaceDBRoleRepository) Update(ctx context.Context, role *entity.WorkspaceDBRole) error {
	return r.db.WithContext(ctx).Save(role).Error
}

func (r *workspaceDBRoleRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.WorkspaceDBRole, error) {
	var role entity.WorkspaceDBRole
	if err := r.db.WithContext(ctx).First(&role, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &role, nil
}

func (r *workspaceDBRoleRepository) GetActiveByWorkspaceAppRole(ctx context.Context, workspaceID uuid.UUID, appID *uuid.UUID, roleType string) (*entity.WorkspaceDBRole, error) {
	query := r.db.WithContext(ctx).Model(&entity.WorkspaceDBRole{}).
		Where("workspace_id = ? AND role_type = ? AND status = ?", workspaceID, roleType, "active")
	if appID == nil || *appID == uuid.Nil {
		query = query.Where("app_id IS NULL")
	} else {
		query = query.Where("app_id = ?", *appID)
	}
	var role entity.WorkspaceDBRole
	if err := query.First(&role).Error; err != nil {
		return nil, err
	}
	return &role, nil
}

func (r *workspaceDBRoleRepository) ListByWorkspace(ctx context.Context, params WorkspaceDBRoleListParams) ([]entity.WorkspaceDBRole, error) {
	query := r.db.WithContext(ctx).Model(&entity.WorkspaceDBRole{})
	if params.WorkspaceID != uuid.Nil {
		query = query.Where("workspace_id = ?", params.WorkspaceID)
	}
	if params.AppID != nil {
		query = query.Where("app_id = ?", *params.AppID)
	}
	if params.Status != nil && *params.Status != "" {
		query = query.Where("status = ?", *params.Status)
	}
	if params.RoleType != nil && *params.RoleType != "" {
		query = query.Where("role_type = ?", *params.RoleType)
	}
	var roles []entity.WorkspaceDBRole
	if err := query.Order("created_at desc").Find(&roles).Error; err != nil {
		return nil, err
	}
	return roles, nil
}
