package service

import (
	"context"
	"errors"
	"regexp"
	"strings"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
)

var (
	ErrTemplateNotFound = errors.New("template not found")
	// ErrSlugExists is already defined in agent_service.go
)

// TemplateService 模板服务接口
type TemplateService interface {
	// 公开接口
	List(ctx context.Context, params repository.TemplateListParams) ([]entity.Template, int64, error)
	GetFeatured(ctx context.Context, limit int) ([]entity.Template, error)
	GetByID(ctx context.Context, id uuid.UUID) (*entity.Template, error)
	GetBySlug(ctx context.Context, slug string) (*entity.Template, error)
	GetCategories(ctx context.Context) ([]entity.TemplateCategory, error)
	UseTemplate(ctx context.Context, templateID uuid.UUID, userID uuid.UUID, req UseTemplateRequest) (*entity.Workflow, error)
	IncrementViewCount(ctx context.Context, id uuid.UUID) error

	// 管理接口
	Create(ctx context.Context, req CreateTemplateRequest) (*entity.Template, error)
	Update(ctx context.Context, id uuid.UUID, req UpdateTemplateRequest) (*entity.Template, error)
	Delete(ctx context.Context, id uuid.UUID) error
	SetFeatured(ctx context.Context, id uuid.UUID, featured bool) error
}

// UseTemplateRequest 使用模板请求
type UseTemplateRequest struct {
	Name     *string    `json:"name"`
	FolderID *uuid.UUID `json:"folder_id"`
}

// CreateTemplateRequest 创建模板请求
type CreateTemplateRequest struct {
	Name            string            `json:"name" validate:"required,max=200"`
	Slug            string            `json:"slug" validate:"required,max=100"`
	Description     string            `json:"description"`
	LongDescription string            `json:"long_description"`
	Category        string            `json:"category" validate:"required"`
	Tags            []string          `json:"tags"`
	Icon            string            `json:"icon"`
	CoverImage      *string           `json:"cover_image"`
	Definition      entity.JSON       `json:"definition" validate:"required"`
	Variables       entity.JSON       `json:"variables"`
	InputSchema     entity.JSON       `json:"input_schema"`
	Difficulty      string            `json:"difficulty"`
	EstimatedTime   int               `json:"estimated_time"`
	IsFeatured      bool              `json:"is_featured"`
	IsOfficial      bool              `json:"is_official"`
	AuthorID        *uuid.UUID        `json:"author_id"`
}

// UpdateTemplateRequest 更新模板请求
type UpdateTemplateRequest struct {
	Name            *string           `json:"name"`
	Description     *string           `json:"description"`
	LongDescription *string           `json:"long_description"`
	Category        *string           `json:"category"`
	Tags            []string          `json:"tags"`
	Icon            *string           `json:"icon"`
	CoverImage      *string           `json:"cover_image"`
	Definition      *entity.JSON      `json:"definition"`
	Variables       *entity.JSON      `json:"variables"`
	InputSchema     *entity.JSON      `json:"input_schema"`
	Difficulty      *string           `json:"difficulty"`
	EstimatedTime   *int              `json:"estimated_time"`
	IsFeatured      *bool             `json:"is_featured"`
	IsOfficial      *bool             `json:"is_official"`
	IsPublished     *bool             `json:"is_published"`
}

type templateService struct {
	templateRepo repository.TemplateRepository
	workflowRepo repository.WorkflowRepository
}

// NewTemplateService 创建模板服务实例
func NewTemplateService(templateRepo repository.TemplateRepository, workflowRepo repository.WorkflowRepository) TemplateService {
	return &templateService{
		templateRepo: templateRepo,
		workflowRepo: workflowRepo,
	}
}

func (s *templateService) List(ctx context.Context, params repository.TemplateListParams) ([]entity.Template, int64, error) {
	return s.templateRepo.List(ctx, params)
}

func (s *templateService) GetFeatured(ctx context.Context, limit int) ([]entity.Template, error) {
	if limit <= 0 {
		limit = 8
	}
	return s.templateRepo.GetFeatured(ctx, limit)
}

func (s *templateService) GetByID(ctx context.Context, id uuid.UUID) (*entity.Template, error) {
	template, err := s.templateRepo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrTemplateNotFound
	}
	return template, nil
}

func (s *templateService) GetBySlug(ctx context.Context, slug string) (*entity.Template, error) {
	template, err := s.templateRepo.GetBySlug(ctx, slug)
	if err != nil {
		return nil, ErrTemplateNotFound
	}
	return template, nil
}

func (s *templateService) GetCategories(ctx context.Context) ([]entity.TemplateCategory, error) {
	// 获取每个分类的数量
	counts, err := s.templateRepo.CountByCategory(ctx)
	if err != nil {
		counts = make(map[string]int)
	}

	categories := entity.GetTemplateCategories()
	for i := range categories {
		if count, ok := counts[categories[i].ID]; ok {
			categories[i].Count = count
		}
	}

	return categories, nil
}

func (s *templateService) UseTemplate(ctx context.Context, templateID uuid.UUID, userID uuid.UUID, req UseTemplateRequest) (*entity.Workflow, error) {
	// 获取模板
	template, err := s.templateRepo.GetByID(ctx, templateID)
	if err != nil {
		return nil, ErrTemplateNotFound
	}

	// 创建工作流名称
	name := template.Name
	if req.Name != nil && *req.Name != "" {
		name = *req.Name
	}

	// 创建工作流
	workflow := &entity.Workflow{
		UserID:      userID,
		Name:        name,
		Description: &template.Description,
		Icon:        template.Icon,
		Definition:  template.Definition,
		Variables:   template.Variables,
		FolderID:    req.FolderID,
	}

	if err := s.workflowRepo.Create(ctx, workflow); err != nil {
		return nil, err
	}

	// 增加使用次数
	_ = s.templateRepo.IncrementUseCount(ctx, templateID)

	return workflow, nil
}

func (s *templateService) IncrementViewCount(ctx context.Context, id uuid.UUID) error {
	return s.templateRepo.IncrementViewCount(ctx, id)
}

func (s *templateService) Create(ctx context.Context, req CreateTemplateRequest) (*entity.Template, error) {
	// 生成 slug
	slug := req.Slug
	if slug == "" {
		slug = s.generateSlug(req.Name)
	}

	// 检查 slug 是否已存在
	existing, _ := s.templateRepo.GetBySlug(ctx, slug)
	if existing != nil {
		return nil, ErrSlugExists
	}

	now := time.Now()
	template := &entity.Template{
		Name:            req.Name,
		Slug:            slug,
		Description:     req.Description,
		LongDescription: req.LongDescription,
		Category:        req.Category,
		Tags:            req.Tags,
		Icon:            req.Icon,
		CoverImage:      req.CoverImage,
		Definition:      req.Definition,
		Variables:       req.Variables,
		InputSchema:     req.InputSchema,
		Difficulty:      req.Difficulty,
		EstimatedTime:   req.EstimatedTime,
		IsFeatured:      req.IsFeatured,
		IsOfficial:      req.IsOfficial,
		IsPublished:     true,
		PublishedAt:     &now,
		AuthorID:        req.AuthorID,
	}

	if template.Icon == "" {
		template.Icon = "📋"
	}
	if template.Difficulty == "" {
		template.Difficulty = "beginner"
	}
	if template.EstimatedTime == 0 {
		template.EstimatedTime = 5
	}

	if err := s.templateRepo.Create(ctx, template); err != nil {
		return nil, err
	}

	return template, nil
}

func (s *templateService) Update(ctx context.Context, id uuid.UUID, req UpdateTemplateRequest) (*entity.Template, error) {
	template, err := s.templateRepo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrTemplateNotFound
	}

	// 更新字段
	if req.Name != nil {
		template.Name = *req.Name
	}
	if req.Description != nil {
		template.Description = *req.Description
	}
	if req.LongDescription != nil {
		template.LongDescription = *req.LongDescription
	}
	if req.Category != nil {
		template.Category = *req.Category
	}
	if req.Tags != nil {
		template.Tags = req.Tags
	}
	if req.Icon != nil {
		template.Icon = *req.Icon
	}
	if req.CoverImage != nil {
		template.CoverImage = req.CoverImage
	}
	if req.Definition != nil {
		template.Definition = *req.Definition
		// 重新计算节点数量
		if nodes, ok := template.Definition["nodes"].([]interface{}); ok {
			template.NodeCount = len(nodes)
		}
	}
	if req.Variables != nil {
		template.Variables = *req.Variables
	}
	if req.InputSchema != nil {
		template.InputSchema = *req.InputSchema
	}
	if req.Difficulty != nil {
		template.Difficulty = *req.Difficulty
	}
	if req.EstimatedTime != nil {
		template.EstimatedTime = *req.EstimatedTime
	}
	if req.IsFeatured != nil {
		template.IsFeatured = *req.IsFeatured
	}
	if req.IsOfficial != nil {
		template.IsOfficial = *req.IsOfficial
	}
	if req.IsPublished != nil {
		template.IsPublished = *req.IsPublished
		if *req.IsPublished && template.PublishedAt == nil {
			now := time.Now()
			template.PublishedAt = &now
		}
	}

	if err := s.templateRepo.Update(ctx, template); err != nil {
		return nil, err
	}

	return template, nil
}

func (s *templateService) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := s.templateRepo.GetByID(ctx, id)
	if err != nil {
		return ErrTemplateNotFound
	}
	return s.templateRepo.Delete(ctx, id)
}

func (s *templateService) SetFeatured(ctx context.Context, id uuid.UUID, featured bool) error {
	template, err := s.templateRepo.GetByID(ctx, id)
	if err != nil {
		return ErrTemplateNotFound
	}

	template.IsFeatured = featured
	return s.templateRepo.Update(ctx, template)
}

// generateSlug 生成 URL 友好的 slug
func (s *templateService) generateSlug(name string) string {
	// 转小写
	slug := strings.ToLower(name)
	// 替换空格为连字符
	slug = strings.ReplaceAll(slug, " ", "-")
	// 只保留字母数字和连字符
	reg := regexp.MustCompile("[^a-z0-9-]")
	slug = reg.ReplaceAllString(slug, "")
	// 去除多余连字符
	reg = regexp.MustCompile("-+")
	slug = reg.ReplaceAllString(slug, "-")
	// 去除首尾连字符
	slug = strings.Trim(slug, "-")
	return slug
}
