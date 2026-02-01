package service

import (
	"context"
	"errors"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
)

// TagService 标签服务接口
type TagService interface {
	// Create 创建标签
	Create(ctx context.Context, userID uuid.UUID, name, color string) (*entity.Tag, error)
	// Get 获取标签
	Get(ctx context.Context, id uuid.UUID) (*entity.Tag, error)
	// Update 更新标签
	Update(ctx context.Context, userID, tagID uuid.UUID, name, color string) (*entity.Tag, error)
	// Delete 删除标签
	Delete(ctx context.Context, userID, tagID uuid.UUID) error
	// List 获取用户标签列表
	List(ctx context.Context, userID uuid.UUID) ([]entity.TagWithCount, error)
	// AddToWorkflow 添加标签到工作流
	AddToWorkflow(ctx context.Context, userID, workflowID, tagID uuid.UUID) error
	// RemoveFromWorkflow 从工作流移除标签
	RemoveFromWorkflow(ctx context.Context, userID, workflowID, tagID uuid.UUID) error
	// GetWorkflowTags 获取工作流标签
	GetWorkflowTags(ctx context.Context, workflowID uuid.UUID) ([]entity.Tag, error)
}

type tagService struct {
	tagRepo      repository.TagRepository
	workflowRepo repository.WorkflowRepository
}

// NewTagService 创建标签服务实例
func NewTagService(tagRepo repository.TagRepository, workflowRepo repository.WorkflowRepository) TagService {
	return &tagService{
		tagRepo:      tagRepo,
		workflowRepo: workflowRepo,
	}
}

func (s *tagService) Create(ctx context.Context, userID uuid.UUID, name, color string) (*entity.Tag, error) {
	// 检查是否已存在同名标签
	existing, err := s.tagRepo.GetByName(ctx, userID, name)
	if err == nil && existing != nil {
		return nil, ErrTagAlreadyExists
	}

	tag := &entity.Tag{
		UserID: userID,
		Name:   name,
		Color:  color,
	}

	if tag.Color == "" {
		tag.Color = "#3ECF8E"
	}

	if err := s.tagRepo.Create(ctx, tag); err != nil {
		return nil, err
	}

	return tag, nil
}

func (s *tagService) Get(ctx context.Context, id uuid.UUID) (*entity.Tag, error) {
	return s.tagRepo.GetByID(ctx, id)
}

func (s *tagService) Update(ctx context.Context, userID, tagID uuid.UUID, name, color string) (*entity.Tag, error) {
	tag, err := s.tagRepo.GetByID(ctx, tagID)
	if err != nil {
		return nil, ErrTagNotFound
	}

	// 检查权限
	if tag.UserID != userID {
		return nil, ErrUnauthorized
	}

	// 检查新名称是否与其他标签冲突
	if name != tag.Name {
		existing, err := s.tagRepo.GetByName(ctx, userID, name)
		if err == nil && existing != nil && existing.ID != tagID {
			return nil, ErrTagAlreadyExists
		}
	}

	tag.Name = name
	if color != "" {
		tag.Color = color
	}

	if err := s.tagRepo.Update(ctx, tag); err != nil {
		return nil, err
	}

	return tag, nil
}

func (s *tagService) Delete(ctx context.Context, userID, tagID uuid.UUID) error {
	tag, err := s.tagRepo.GetByID(ctx, tagID)
	if err != nil {
		return ErrTagNotFound
	}

	// 检查权限
	if tag.UserID != userID {
		return ErrUnauthorized
	}

	return s.tagRepo.Delete(ctx, tagID)
}

func (s *tagService) List(ctx context.Context, userID uuid.UUID) ([]entity.TagWithCount, error) {
	return s.tagRepo.ListByUser(ctx, userID)
}

func (s *tagService) AddToWorkflow(ctx context.Context, userID, workflowID, tagID uuid.UUID) error {
	// 验证工作流属于用户
	workflow, err := s.workflowRepo.GetByID(ctx, workflowID)
	if err != nil {
		return ErrWorkflowNotFound
	}
	if workflow.UserID != userID {
		return ErrUnauthorized
	}

	// 验证标签属于用户
	tag, err := s.tagRepo.GetByID(ctx, tagID)
	if err != nil {
		return ErrTagNotFound
	}
	if tag.UserID != userID {
		return ErrUnauthorized
	}

	return s.tagRepo.AddToWorkflow(ctx, workflowID, tagID)
}

func (s *tagService) RemoveFromWorkflow(ctx context.Context, userID, workflowID, tagID uuid.UUID) error {
	// 验证工作流属于用户
	workflow, err := s.workflowRepo.GetByID(ctx, workflowID)
	if err != nil {
		return ErrWorkflowNotFound
	}
	if workflow.UserID != userID {
		return ErrUnauthorized
	}

	return s.tagRepo.RemoveFromWorkflow(ctx, workflowID, tagID)
}

func (s *tagService) GetWorkflowTags(ctx context.Context, workflowID uuid.UUID) ([]entity.Tag, error) {
	return s.tagRepo.GetWorkflowTags(ctx, workflowID)
}

// 错误定义
var (
	ErrTagAlreadyExists = errors.New("tag already exists")
	ErrTagNotFound      = errors.New("tag not found")
)
