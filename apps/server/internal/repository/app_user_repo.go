package repository

import (
	"context"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AppUserRepository 应用用户仓储接口
type AppUserRepository interface {
	Create(ctx context.Context, user *entity.AppUser) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.AppUser, error)
	GetByEmail(ctx context.Context, workspaceID uuid.UUID, email string) (*entity.AppUser, error)
	Update(ctx context.Context, user *entity.AppUser) error
	Delete(ctx context.Context, id uuid.UUID) error
	ListByWorkspace(ctx context.Context, workspaceID uuid.UUID, page, pageSize int) ([]entity.AppUser, int64, error)
}

type appUserRepository struct {
	db *gorm.DB
}

func NewAppUserRepository(db *gorm.DB) AppUserRepository {
	return &appUserRepository{db: db}
}

func (r *appUserRepository) Create(ctx context.Context, user *entity.AppUser) error {
	return r.db.WithContext(ctx).Create(user).Error
}

func (r *appUserRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.AppUser, error) {
	var user entity.AppUser
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *appUserRepository) GetByEmail(ctx context.Context, workspaceID uuid.UUID, email string) (*entity.AppUser, error) {
	var user entity.AppUser
	if err := r.db.WithContext(ctx).Where("workspace_id = ? AND email = ?", workspaceID, email).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *appUserRepository) Update(ctx context.Context, user *entity.AppUser) error {
	return r.db.WithContext(ctx).Save(user).Error
}

func (r *appUserRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&entity.AppUser{}).Error
}

func (r *appUserRepository) ListByWorkspace(ctx context.Context, workspaceID uuid.UUID, page, pageSize int) ([]entity.AppUser, int64, error) {
	var users []entity.AppUser
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.AppUser{}).Where("workspace_id = ?", workspaceID)
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	if err := query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&users).Error; err != nil {
		return nil, 0, err
	}
	return users, total, nil
}
