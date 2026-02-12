package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/reverseai/server/internal/domain/entity"
	"gorm.io/gorm"
)

// WorkspaceMemberRepository 工作空间成员仓储接口
type WorkspaceMemberRepository interface {
	Create(ctx context.Context, member *entity.WorkspaceMember) error
	Update(ctx context.Context, member *entity.WorkspaceMember) error
	Delete(ctx context.Context, id uuid.UUID) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.WorkspaceMember, error)
	GetByWorkspaceAndUser(ctx context.Context, workspaceID, userID uuid.UUID) (*entity.WorkspaceMember, error)
	ListByWorkspaceID(ctx context.Context, workspaceID uuid.UUID) ([]entity.WorkspaceMember, error)
	ListByUserID(ctx context.Context, userID uuid.UUID) ([]entity.WorkspaceMember, error)
}

type workspaceMemberRepository struct {
	db *gorm.DB
}

// NewWorkspaceMemberRepository 创建工作空间成员仓储实例
func NewWorkspaceMemberRepository(db *gorm.DB) WorkspaceMemberRepository {
	return &workspaceMemberRepository{db: db}
}

func (r *workspaceMemberRepository) Create(ctx context.Context, member *entity.WorkspaceMember) error {
	return r.db.WithContext(ctx).Create(member).Error
}

func (r *workspaceMemberRepository) Update(ctx context.Context, member *entity.WorkspaceMember) error {
	return r.db.WithContext(ctx).Save(member).Error
}

func (r *workspaceMemberRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&entity.WorkspaceMember{}, "id = ?", id).Error
}

func (r *workspaceMemberRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.WorkspaceMember, error) {
	var member entity.WorkspaceMember
	if err := r.db.WithContext(ctx).
		Preload("User").
		Preload("Role").
		First(&member, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &member, nil
}

func (r *workspaceMemberRepository) GetByWorkspaceAndUser(ctx context.Context, workspaceID, userID uuid.UUID) (*entity.WorkspaceMember, error) {
	var member entity.WorkspaceMember
	if err := r.db.WithContext(ctx).
		Preload("Role").
		First(&member, "workspace_id = ? AND user_id = ?", workspaceID, userID).Error; err != nil {
		return nil, err
	}
	return &member, nil
}

func (r *workspaceMemberRepository) ListByWorkspaceID(ctx context.Context, workspaceID uuid.UUID) ([]entity.WorkspaceMember, error) {
	var members []entity.WorkspaceMember
	if err := r.db.WithContext(ctx).
		Preload("User").
		Preload("Role").
		Where("workspace_id = ?", workspaceID).
		Order("created_at ASC").
		Find(&members).Error; err != nil {
		return nil, err
	}
	return members, nil
}

func (r *workspaceMemberRepository) ListByUserID(ctx context.Context, userID uuid.UUID) ([]entity.WorkspaceMember, error) {
	var members []entity.WorkspaceMember
	if err := r.db.WithContext(ctx).
		Preload("Workspace").
		Preload("Role").
		Where("user_id = ?", userID).
		Order("created_at ASC").
		Find(&members).Error; err != nil {
		return nil, err
	}
	return members, nil
}
