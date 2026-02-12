package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/reverseai/server/internal/domain/entity"
	"gorm.io/gorm"
)

// StorageObjectRepository 文件存储仓储接口
type StorageObjectRepository interface {
	Create(ctx context.Context, obj *entity.StorageObject) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.StorageObject, error)
	ListByWorkspace(ctx context.Context, workspaceID uuid.UUID, prefix string, page, pageSize int) ([]entity.StorageObject, int64, error)
	Delete(ctx context.Context, id uuid.UUID) error
}

type storageObjectRepository struct {
	db *gorm.DB
}

func NewStorageObjectRepository(db *gorm.DB) StorageObjectRepository {
	return &storageObjectRepository{db: db}
}

func (r *storageObjectRepository) Create(ctx context.Context, obj *entity.StorageObject) error {
	return r.db.WithContext(ctx).Create(obj).Error
}

func (r *storageObjectRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.StorageObject, error) {
	var obj entity.StorageObject
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&obj).Error; err != nil {
		return nil, err
	}
	return &obj, nil
}

func (r *storageObjectRepository) ListByWorkspace(ctx context.Context, workspaceID uuid.UUID, prefix string, page, pageSize int) ([]entity.StorageObject, int64, error) {
	var objects []entity.StorageObject
	var total int64

	q := r.db.WithContext(ctx).Where("workspace_id = ?", workspaceID)
	if prefix != "" {
		q = q.Where("prefix = ?", prefix)
	}

	if err := q.Model(&entity.StorageObject{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := 0
	if page > 1 {
		offset = (page - 1) * pageSize
	}

	if err := q.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&objects).Error; err != nil {
		return nil, 0, err
	}

	return objects, total, nil
}

func (r *storageObjectRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&entity.StorageObject{}, "id = ?", id).Error
}
