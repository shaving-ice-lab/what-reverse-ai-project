package service

import (
	"context"
	"errors"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
)

var (
	ErrConvTemplateNotFound     = errors.New("conversation template not found")
	ErrConvTemplateUnauthorized = errors.New("unauthorized to access this conversation template")
)

// ConversationTemplateService 对话模板服务接口
type ConversationTemplateService interface {
	Create(ctx context.Context, userID uuid.UUID, req CreateConvTemplateRequest) (*entity.ConversationTemplate, error)
	GetByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*entity.ConversationTemplate, error)
	Update(ctx context.Context, id uuid.UUID, userID uuid.UUID, req UpdateConvTemplateRequest) (*entity.ConversationTemplate, error)
	Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error
	List(ctx context.Context, userID uuid.UUID, req ListTemplatesRequest) (*TemplateListResponse, error)
	UseTemplate(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*entity.ConversationTemplate, error)
}

// CreateConvTemplateRequest 创建对话模板请求
type CreateConvTemplateRequest struct {
	Name             string                          `json:"name" validate:"required,max=200"`
	Description      string                          `json:"description" validate:"max=500"`
	Icon             string                          `json:"icon"`
	Model            string                          `json:"model"`
	SystemPrompt     *string                         `json:"system_prompt"`
	Temperature      *float64                        `json:"temperature"`
	MaxTokens        *int                            `json:"max_tokens"`
	TopP             *float64                        `json:"top_p"`
	TopK             *int                            `json:"top_k"`
	FrequencyPenalty *float64                        `json:"frequency_penalty"`
	PresencePenalty  *float64                        `json:"presence_penalty"`
	InitialMessages  []entity.TemplateInitialMessage `json:"initial_messages"`
	Tags             []string                        `json:"tags"`
	IsPublic         bool                            `json:"is_public"`
}

// UpdateConvTemplateRequest 更新对话模板请求
type UpdateConvTemplateRequest struct {
	Name             *string                         `json:"name" validate:"omitempty,max=200"`
	Description      *string                         `json:"description" validate:"omitempty,max:500"`
	Icon             *string                         `json:"icon"`
	Model            *string                         `json:"model"`
	SystemPrompt     *string                         `json:"system_prompt"`
	Temperature      *float64                        `json:"temperature"`
	MaxTokens        *int                            `json:"max_tokens"`
	TopP             *float64                        `json:"top_p"`
	TopK             *int                            `json:"top_k"`
	FrequencyPenalty *float64                        `json:"frequency_penalty"`
	PresencePenalty  *float64                        `json:"presence_penalty"`
	InitialMessages  []entity.TemplateInitialMessage `json:"initial_messages"`
	Tags             []string                        `json:"tags"`
	IsPublic         *bool                           `json:"is_public"`
}

// ListTemplatesRequest 模板列表请求
type ListTemplatesRequest struct {
	Page          int    `json:"page" query:"page"`
	PageSize      int    `json:"page_size" query:"page_size"`
	IncludePublic bool   `json:"include_public" query:"include_public"`
	IncludeSystem bool   `json:"include_system" query:"include_system"`
	Search        string `json:"search" query:"search"`
}

// TemplateListResponse 模板列表响应
type TemplateListResponse struct {
	Templates []entity.ConversationTemplate `json:"templates"`
	Total     int64                         `json:"total"`
	Page      int                           `json:"page"`
	PageSize  int                           `json:"page_size"`
}

type conversationTemplateService struct {
	templateRepo repository.ConversationTemplateRepository
}

// NewConversationTemplateService 创建对话模板服务
func NewConversationTemplateService(templateRepo repository.ConversationTemplateRepository) ConversationTemplateService {
	return &conversationTemplateService{
		templateRepo: templateRepo,
	}
}

func (s *conversationTemplateService) Create(ctx context.Context, userID uuid.UUID, req CreateConvTemplateRequest) (*entity.ConversationTemplate, error) {
	template := &entity.ConversationTemplate{
		UserID:           userID,
		Name:             req.Name,
		Description:      req.Description,
		Icon:             req.Icon,
		Model:            req.Model,
		SystemPrompt:     req.SystemPrompt,
		Temperature:      req.Temperature,
		MaxTokens:        req.MaxTokens,
		TopP:             req.TopP,
		TopK:             req.TopK,
		FrequencyPenalty: req.FrequencyPenalty,
		PresencePenalty:  req.PresencePenalty,
		IsPublic:         req.IsPublic,
	}

	if template.Model == "" {
		template.Model = "gpt-4"
	}
	if template.Icon == "" {
		template.Icon = "📝"
	}

	// 设置初始消息（转换为 JSON）
	if len(req.InitialMessages) > 0 {
		template.InitialMessages = initialMessagesToJSON(req.InitialMessages)
	}

	// 设置标签（转换为 JSON）
	if len(req.Tags) > 0 {
		template.Tags = tagsToJSON(req.Tags)
	}

	if err := s.templateRepo.Create(ctx, template); err != nil {
		return nil, err
	}

	return template, nil
}

func (s *conversationTemplateService) GetByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*entity.ConversationTemplate, error) {
	template, err := s.templateRepo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrConvTemplateNotFound
	}

	// 检查权限：自己的模板、公开模板或系统模板
	if template.UserID != userID && !template.IsPublic && !template.IsSystem {
		return nil, ErrConvTemplateUnauthorized
	}

	return template, nil
}

func (s *conversationTemplateService) Update(ctx context.Context, id uuid.UUID, userID uuid.UUID, req UpdateConvTemplateRequest) (*entity.ConversationTemplate, error) {
	template, err := s.templateRepo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrConvTemplateNotFound
	}

	// 只能编辑自己的模板
	if template.UserID != userID {
		return nil, ErrConvTemplateUnauthorized
	}

	// 不能编辑系统模板
	if template.IsSystem {
		return nil, ErrConvTemplateUnauthorized
	}

	// 更新字段
	if req.Name != nil {
		template.Name = *req.Name
	}
	if req.Description != nil {
		template.Description = *req.Description
	}
	if req.Icon != nil {
		template.Icon = *req.Icon
	}
	if req.Model != nil {
		template.Model = *req.Model
	}
	if req.SystemPrompt != nil {
		template.SystemPrompt = req.SystemPrompt
	}
	if req.Temperature != nil {
		template.Temperature = req.Temperature
	}
	if req.MaxTokens != nil {
		template.MaxTokens = req.MaxTokens
	}
	if req.TopP != nil {
		template.TopP = req.TopP
	}
	if req.TopK != nil {
		template.TopK = req.TopK
	}
	if req.FrequencyPenalty != nil {
		template.FrequencyPenalty = req.FrequencyPenalty
	}
	if req.PresencePenalty != nil {
		template.PresencePenalty = req.PresencePenalty
	}
	if req.IsPublic != nil {
		template.IsPublic = *req.IsPublic
	}

	// 更新初始消息
	if req.InitialMessages != nil {
		template.InitialMessages = initialMessagesToJSON(req.InitialMessages)
	}

	// 更新标签
	if req.Tags != nil {
		template.Tags = tagsToJSON(req.Tags)
	}

	if err := s.templateRepo.Update(ctx, template); err != nil {
		return nil, err
	}

	return template, nil
}

func (s *conversationTemplateService) Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	template, err := s.templateRepo.GetByID(ctx, id)
	if err != nil {
		return ErrConvTemplateNotFound
	}

	// 只能删除自己的模板
	if template.UserID != userID {
		return ErrConvTemplateUnauthorized
	}

	// 不能删除系统模板
	if template.IsSystem {
		return ErrConvTemplateUnauthorized
	}

	return s.templateRepo.Delete(ctx, id)
}

func (s *conversationTemplateService) List(ctx context.Context, userID uuid.UUID, req ListTemplatesRequest) (*TemplateListResponse, error) {
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.PageSize <= 0 {
		req.PageSize = 20
	}

	templates, total, err := s.templateRepo.List(ctx, userID, repository.TemplateListOptions{
		Page:          req.Page,
		PageSize:      req.PageSize,
		IncludePublic: req.IncludePublic,
		IncludeSystem: req.IncludeSystem,
		Search:        req.Search,
	})
	if err != nil {
		return nil, err
	}

	return &TemplateListResponse{
		Templates: templates,
		Total:     total,
		Page:      req.Page,
		PageSize:  req.PageSize,
	}, nil
}

func (s *conversationTemplateService) UseTemplate(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*entity.ConversationTemplate, error) {
	template, err := s.GetByID(ctx, id, userID)
	if err != nil {
		return nil, err
	}

	// 增加使用计数
	s.templateRepo.IncrementUsage(ctx, id)

	return template, nil
}

// 辅助函数
func initialMessagesToJSON(messages []entity.TemplateInitialMessage) entity.JSON {
	result := make(entity.JSON)
	result["messages"] = messages
	return result
}

func tagsToJSON(tags []string) entity.JSON {
	result := make(entity.JSON)
	result["tags"] = tags
	return result
}
