package repository

import (
	"context"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// TagRepository 标签仓储接口
type TagRepository interface {
	Create(ctx context.Context, tag *entity.Tag) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.Tag, error)
	GetByName(ctx context.Context, userID uuid.UUID, name string) (*entity.Tag, error)
	Update(ctx context.Context, tag *entity.Tag) error
	Delete(ctx context.Context, id uuid.UUID) error
	ListByUser(ctx context.Context, userID uuid.UUID) ([]entity.TagWithCount, error)
	AddToWorkflow(ctx context.Context, workflowID, tagID uuid.UUID) error
	RemoveFromWorkflow(ctx context.Context, workflowID, tagID uuid.UUID) error
	GetWorkflowTags(ctx context.Context, workflowID uuid.UUID) ([]entity.Tag, error)
}

type tagRepository struct {
	db *gorm.DB
}

// NewTagRepository 创建标签仓储实例
func NewTagRepository(db *gorm.DB) TagRepository {
	return &tagRepository{db: db}
}

func (r *tagRepository) Create(ctx context.Context, tag *entity.Tag) error {
	if tag.ID == uuid.Nil {
		tag.ID = uuid.New()
	}
	tag.CreatedAt = time.Now()
	return r.db.WithContext(ctx).Create(tag).Error
}

func (r *tagRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.Tag, error) {
	var tag entity.Tag
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&tag).Error; err != nil {
		return nil, err
	}
	return &tag, nil
}

func (r *tagRepository) GetByName(ctx context.Context, userID uuid.UUID, name string) (*entity.Tag, error) {
	var tag entity.Tag
	if err := r.db.WithContext(ctx).
		Where("user_id = ? AND name = ?", userID, name).
		First(&tag).Error; err != nil {
		return nil, err
	}
	return &tag, nil
}

func (r *tagRepository) Update(ctx context.Context, tag *entity.Tag) error {
	return r.db.WithContext(ctx).Save(tag).Error
}

func (r *tagRepository) Delete(ctx context.Context, id uuid.UUID) error {
	// 先删除关联
	if err := r.db.WithContext(ctx).
		Where("tag_id = ?", id).
		Delete(&entity.WorkflowTag{}).Error; err != nil {
		return err
	}
	// 再删除标签
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&entity.Tag{}).Error
}

func (r *tagRepository) ListByUser(ctx context.Context, userID uuid.UUID) ([]entity.TagWithCount, error) {
	var tags []entity.Tag
	if err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("name ASC").
		Find(&tags).Error; err != nil {
		return nil, err
	}

	// 获取每个标签的使用数量
	result := make([]entity.TagWithCount, len(tags))
	for i, tag := range tags {
		var count int64
		r.db.WithContext(ctx).
			Model(&entity.WorkflowTag{}).
			Where("tag_id = ?", tag.ID).
			Count(&count)
		result[i] = entity.TagWithCount{
			Tag:   tag,
			Count: count,
		}
	}

	return result, nil
}

func (r *tagRepository) AddToWorkflow(ctx context.Context, workflowID, tagID uuid.UUID) error {
	wt := &entity.WorkflowTag{
		ID:         uuid.New(),
		WorkflowID: workflowID,
		TagID:      tagID,
		CreatedAt:  time.Now(),
	}
	return r.db.WithContext(ctx).
		Where("workflow_id = ? AND tag_id = ?", workflowID, tagID).
		FirstOrCreate(wt).Error
}

func (r *tagRepository) RemoveFromWorkflow(ctx context.Context, workflowID, tagID uuid.UUID) error {
	return r.db.WithContext(ctx).
		Where("workflow_id = ? AND tag_id = ?", workflowID, tagID).
		Delete(&entity.WorkflowTag{}).Error
}

func (r *tagRepository) GetWorkflowTags(ctx context.Context, workflowID uuid.UUID) ([]entity.Tag, error) {
	var tags []entity.Tag
	if err := r.db.WithContext(ctx).
		Joins("JOIN what_reverse_workflow_tags wt ON wt.tag_id = what_reverse_tags.id").
		Where("wt.workflow_id = ?", workflowID).
		Find(&tags).Error; err != nil {
		return nil, err
	}
	return tags, nil
}
