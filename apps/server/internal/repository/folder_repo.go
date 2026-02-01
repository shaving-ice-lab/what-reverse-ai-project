package repository

import (
	"context"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// FolderRepository 文件夹仓储接口
type FolderRepository interface {
	Create(ctx context.Context, folder *entity.Folder) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.Folder, error)
	List(ctx context.Context, userID uuid.UUID) ([]entity.Folder, error)
	ListWithCount(ctx context.Context, userID uuid.UUID) ([]entity.Folder, error)
	Update(ctx context.Context, folder *entity.Folder) error
	Delete(ctx context.Context, id uuid.UUID) error
	GetByUserAndParent(ctx context.Context, userID uuid.UUID, parentID *uuid.UUID) ([]entity.Folder, error)
	UpdateSortOrder(ctx context.Context, id uuid.UUID, sortOrder int) error
	CountWorkflowsInFolder(ctx context.Context, folderID uuid.UUID) (int64, error)
}

type folderRepository struct {
	db *gorm.DB
}

// NewFolderRepository 创建文件夹仓储实例
func NewFolderRepository(db *gorm.DB) FolderRepository {
	return &folderRepository{db: db}
}

func (r *folderRepository) Create(ctx context.Context, folder *entity.Folder) error {
	return r.db.WithContext(ctx).Create(folder).Error
}

func (r *folderRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.Folder, error) {
	var folder entity.Folder
	if err := r.db.WithContext(ctx).First(&folder, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &folder, nil
}

func (r *folderRepository) List(ctx context.Context, userID uuid.UUID) ([]entity.Folder, error) {
	var folders []entity.Folder
	if err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("sort_order ASC, created_at ASC").
		Find(&folders).Error; err != nil {
		return nil, err
	}
	return folders, nil
}

func (r *folderRepository) ListWithCount(ctx context.Context, userID uuid.UUID) ([]entity.Folder, error) {
	var folders []entity.Folder

	// 获取文件夹列表
	if err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("sort_order ASC, created_at ASC").
		Find(&folders).Error; err != nil {
		return nil, err
	}

	// 获取每个文件夹的工作流数量
	for i := range folders {
		var count int64
		r.db.WithContext(ctx).Model(&entity.Workflow{}).
			Where("folder_id = ?", folders[i].ID).
			Count(&count)
		folders[i].WorkflowCount = int(count)
	}

	return folders, nil
}

func (r *folderRepository) Update(ctx context.Context, folder *entity.Folder) error {
	return r.db.WithContext(ctx).Save(folder).Error
}

func (r *folderRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&entity.Folder{}, "id = ?", id).Error
}

func (r *folderRepository) GetByUserAndParent(ctx context.Context, userID uuid.UUID, parentID *uuid.UUID) ([]entity.Folder, error) {
	var folders []entity.Folder
	query := r.db.WithContext(ctx).Where("user_id = ?", userID)

	if parentID == nil {
		query = query.Where("parent_id IS NULL")
	} else {
		query = query.Where("parent_id = ?", parentID)
	}

	if err := query.Order("sort_order ASC, created_at ASC").Find(&folders).Error; err != nil {
		return nil, err
	}
	return folders, nil
}

func (r *folderRepository) UpdateSortOrder(ctx context.Context, id uuid.UUID, sortOrder int) error {
	return r.db.WithContext(ctx).Model(&entity.Folder{}).
		Where("id = ?", id).
		Update("sort_order", sortOrder).Error
}

func (r *folderRepository) CountWorkflowsInFolder(ctx context.Context, folderID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&entity.Workflow{}).
		Where("folder_id = ?", folderID).
		Count(&count).Error
	return count, err
}
