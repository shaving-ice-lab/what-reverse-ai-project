package service

import (
	"context"
	"errors"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
)

var (
	ErrConversationNotFound     = errors.New("conversation not found")
	ErrConversationUnauthorized = errors.New("unauthorized to access this conversation")
	ErrMessageNotFound          = errors.New("message not found")
)

// ConversationService 对话服务接口
type ConversationService interface {
	// 对话 CRUD
	Create(ctx context.Context, userID uuid.UUID, req CreateConversationRequest) (*entity.Conversation, error)
	GetByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*entity.Conversation, error)
	GetWithMessages(ctx context.Context, id uuid.UUID, userID uuid.UUID, messageLimit int) (*entity.Conversation, error)
	List(ctx context.Context, userID uuid.UUID, req ListConversationsRequest) (*ConversationListResponse, error)
	Update(ctx context.Context, id uuid.UUID, userID uuid.UUID, req UpdateConversationRequest) (*entity.Conversation, error)
	Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error
	Duplicate(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*entity.Conversation, error)

	// 状态操作
	SetStarred(ctx context.Context, id uuid.UUID, userID uuid.UUID, starred bool) error
	SetPinned(ctx context.Context, id uuid.UUID, userID uuid.UUID, pinned bool) error
	SetArchived(ctx context.Context, id uuid.UUID, userID uuid.UUID, archived bool) error

	// 批量操作
	BatchSetStarred(ctx context.Context, userID uuid.UUID, ids []uuid.UUID, starred bool) (int, error)
	BatchSetArchived(ctx context.Context, userID uuid.UUID, ids []uuid.UUID, archived bool) (int, error)
	BatchDelete(ctx context.Context, userID uuid.UUID, ids []uuid.UUID) (int, error)
	BatchMove(ctx context.Context, userID uuid.UUID, ids []uuid.UUID, folderID *uuid.UUID) (int, error)

	// 消息操作
	AddMessage(ctx context.Context, conversationID uuid.UUID, userID uuid.UUID, req AddMessageRequest) (*entity.Message, error)
	ListMessages(ctx context.Context, conversationID uuid.UUID, userID uuid.UUID, req ListMessagesRequest) (*MessageListResponse, error)
	UpdateMessage(ctx context.Context, messageID uuid.UUID, conversationID uuid.UUID, userID uuid.UUID, req UpdateMessageRequest) (*entity.Message, error)
	UpdateMessageFeedback(ctx context.Context, messageID uuid.UUID, conversationID uuid.UUID, userID uuid.UUID, req UpdateMessageFeedbackRequest) (*entity.Message, error)
	DeleteMessage(ctx context.Context, messageID uuid.UUID, conversationID uuid.UUID, userID uuid.UUID) error

	// 标签操作
	SetTags(ctx context.Context, id uuid.UUID, userID uuid.UUID, tags []string) error

	// 统计
	GetStatistics(ctx context.Context, userID uuid.UUID) (*ConversationStatistics, error)
}

// ConversationStatistics 对话统计
type ConversationStatistics struct {
	TotalConversations             int64                   `json:"total_conversations"`
	TotalMessages                  int64                   `json:"total_messages"`
	TotalTokenUsage                int64                   `json:"total_token_usage"`
	StarredConversations           int64                   `json:"starred_conversations"`
	ArchivedConversations          int64                   `json:"archived_conversations"`
	AverageMessagesPerConversation float64                 `json:"average_messages_per_conversation"`
	ModelUsage                     map[string]int64        `json:"model_usage"`
	DailyStats                     []ConversationDailyStat `json:"daily_stats"`
}

// ConversationDailyStat 对话每日统计
type ConversationDailyStat struct {
	Date          string `json:"date"`
	Conversations int64  `json:"conversations"`
	Messages      int64  `json:"messages"`
}

// CreateConversationRequest 创建对话请求
type CreateConversationRequest struct {
	Title        string     `json:"title" validate:"required,max=500"`
	Model        string     `json:"model"`
	SystemPrompt *string    `json:"system_prompt"`
	FolderID     *uuid.UUID `json:"folder_id"`
	Tags         []string   `json:"tags"`
	// AI 参数
	Temperature      *float64 `json:"temperature"`
	MaxTokens        *int     `json:"max_tokens"`
	TopP             *float64 `json:"top_p"`
	TopK             *int     `json:"top_k"`
	FrequencyPenalty *float64 `json:"frequency_penalty"`
	PresencePenalty  *float64 `json:"presence_penalty"`
}

// UpdateConversationRequest 更新对话请求
type UpdateConversationRequest struct {
	Title        *string    `json:"title" validate:"omitempty,max=500"`
	Model        *string    `json:"model"`
	SystemPrompt *string    `json:"system_prompt"`
	FolderID     *uuid.UUID `json:"folder_id"`
	// AI 参数
	Temperature      *float64 `json:"temperature"`
	MaxTokens        *int     `json:"max_tokens"`
	TopP             *float64 `json:"top_p"`
	TopK             *int     `json:"top_k"`
	FrequencyPenalty *float64 `json:"frequency_penalty"`
	PresencePenalty  *float64 `json:"presence_penalty"`
}

// ListConversationsRequest 列表查询请求
type ListConversationsRequest struct {
	FolderID *uuid.UUID `json:"folder_id" query:"folder_id"`
	Starred  *bool      `json:"starred" query:"starred"`
	Pinned   *bool      `json:"pinned" query:"pinned"`
	Archived *bool      `json:"archived" query:"archived"`
	Search   string     `json:"search" query:"search"`
	Page     int        `json:"page" query:"page"`
	PageSize int        `json:"page_size" query:"page_size"`
	OrderBy  string     `json:"order_by" query:"order_by"`
}

// ConversationListResponse 对话列表响应
type ConversationListResponse struct {
	Conversations []ConversationResponse `json:"conversations"`
	Total         int64                  `json:"total"`
	Page          int                    `json:"page"`
	PageSize      int                    `json:"page_size"`
}

// ConversationResponse 对话响应
type ConversationResponse struct {
	ID           uuid.UUID  `json:"id"`
	Title        string     `json:"title"`
	Preview      string     `json:"preview"`
	Model        string     `json:"model"`
	Starred      bool       `json:"starred"`
	Pinned       bool       `json:"pinned"`
	Archived     bool       `json:"archived"`
	MessageCount int        `json:"message_count"`
	TokenUsage   int        `json:"token_usage"`
	FolderID     *uuid.UUID `json:"folder_id"`
	Tags         []string   `json:"tags"`
	CreatedAt    string     `json:"created_at"`
	UpdatedAt    string     `json:"updated_at"`
}

// AddMessageRequest 添加消息请求
type AddMessageRequest struct {
	Role             entity.MessageRole `json:"role" validate:"required"`
	Content          string             `json:"content" validate:"required"`
	Model            string             `json:"model"`
	TokenUsage       int                `json:"token_usage"`
	PromptTokens     int                `json:"prompt_tokens"`
	CompletionTokens int                `json:"completion_tokens"`
	ParentID         *uuid.UUID         `json:"parent_id"` // 回复/引用的消息 ID
}

// UpdateMessageRequest 更新消息请求
type UpdateMessageRequest struct {
	Content string `json:"content" validate:"required"`
}

// UpdateMessageFeedbackRequest 更新消息反馈请求
type UpdateMessageFeedbackRequest struct {
	Liked      *bool `json:"liked"`
	Disliked   *bool `json:"disliked"`
	Bookmarked *bool `json:"bookmarked"`
}

// ListMessagesRequest 消息列表请求
type ListMessagesRequest struct {
	Page     int        `json:"page" query:"page"`
	PageSize int        `json:"page_size" query:"page_size"`
	BeforeID *uuid.UUID `json:"before_id" query:"before_id"`
	AfterID  *uuid.UUID `json:"after_id" query:"after_id"`
}

// MessageListResponse 消息列表响应
type MessageListResponse struct {
	Messages []entity.Message `json:"messages"`
	Total    int64            `json:"total"`
	Page     int              `json:"page"`
	PageSize int              `json:"page_size"`
}

type conversationService struct {
	conversationRepo       repository.ConversationRepository
	conversationFolderRepo repository.ConversationFolderRepository
	conversationTagRepo    repository.ConversationTagRepository
	messageRepo            repository.MessageRepository
}

// NewConversationService 创建对话服务实例
func NewConversationService(
	conversationRepo repository.ConversationRepository,
	conversationFolderRepo repository.ConversationFolderRepository,
	conversationTagRepo repository.ConversationTagRepository,
	messageRepo repository.MessageRepository,
) ConversationService {
	return &conversationService{
		conversationRepo:       conversationRepo,
		conversationFolderRepo: conversationFolderRepo,
		conversationTagRepo:    conversationTagRepo,
		messageRepo:            messageRepo,
	}
}

func (s *conversationService) Create(ctx context.Context, userID uuid.UUID, req CreateConversationRequest) (*entity.Conversation, error) {
	// 如果指定了文件夹，验证文件夹存在且属于当前用户
	if req.FolderID != nil {
		folder, err := s.conversationFolderRepo.GetByID(ctx, *req.FolderID)
		if err != nil {
			return nil, ErrFolderNotFound
		}
		if folder.UserID != userID {
			return nil, ErrFolderUnauthorized
		}
	}

	conversation := &entity.Conversation{
		UserID:           userID,
		Title:            req.Title,
		Model:            req.Model,
		SystemPrompt:     req.SystemPrompt,
		FolderID:         req.FolderID,
		Temperature:      req.Temperature,
		MaxTokens:        req.MaxTokens,
		TopP:             req.TopP,
		TopK:             req.TopK,
		FrequencyPenalty: req.FrequencyPenalty,
		PresencePenalty:  req.PresencePenalty,
	}

	if conversation.Model == "" {
		conversation.Model = "gpt-4"
	}

	if err := s.conversationRepo.Create(ctx, conversation); err != nil {
		return nil, err
	}

	// 设置标签
	if len(req.Tags) > 0 {
		if err := s.conversationTagRepo.SetTags(ctx, conversation.ID, req.Tags); err != nil {
			// 标签设置失败不影响对话创建
		}
	}

	return s.GetByID(ctx, conversation.ID, userID)
}

func (s *conversationService) GetByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*entity.Conversation, error) {
	conversation, err := s.conversationRepo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrConversationNotFound
	}

	if conversation.UserID != userID {
		return nil, ErrConversationUnauthorized
	}

	return conversation, nil
}

func (s *conversationService) GetWithMessages(ctx context.Context, id uuid.UUID, userID uuid.UUID, messageLimit int) (*entity.Conversation, error) {
	conversation, err := s.conversationRepo.GetByIDWithMessages(ctx, id, messageLimit)
	if err != nil {
		return nil, ErrConversationNotFound
	}

	if conversation.UserID != userID {
		return nil, ErrConversationUnauthorized
	}

	return conversation, nil
}

func (s *conversationService) List(ctx context.Context, userID uuid.UUID, req ListConversationsRequest) (*ConversationListResponse, error) {
	// 默认分页
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.PageSize <= 0 {
		req.PageSize = 20
	}
	if req.PageSize > 100 {
		req.PageSize = 100
	}

	// 默认不显示已归档
	if req.Archived == nil {
		archived := false
		req.Archived = &archived
	}

	opts := repository.ConversationListOptions{
		UserID:   userID,
		FolderID: req.FolderID,
		Starred:  req.Starred,
		Pinned:   req.Pinned,
		Archived: req.Archived,
		Search:   req.Search,
		Page:     req.Page,
		PageSize: req.PageSize,
		OrderBy:  req.OrderBy,
	}

	conversations, total, err := s.conversationRepo.List(ctx, opts)
	if err != nil {
		return nil, err
	}

	// 转换为响应格式
	responses := make([]ConversationResponse, len(conversations))
	for i, conv := range conversations {
		tags := make([]string, len(conv.Tags))
		for j, tag := range conv.Tags {
			tags[j] = tag.TagName
		}

		responses[i] = ConversationResponse{
			ID:           conv.ID,
			Title:        conv.Title,
			Preview:      conv.Preview,
			Model:        conv.Model,
			Starred:      conv.Starred,
			Pinned:       conv.Pinned,
			Archived:     conv.Archived,
			MessageCount: conv.MessageCount,
			TokenUsage:   conv.TokenUsage,
			FolderID:     conv.FolderID,
			Tags:         tags,
			CreatedAt:    conv.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			UpdatedAt:    conv.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		}
	}

	return &ConversationListResponse{
		Conversations: responses,
		Total:         total,
		Page:          req.Page,
		PageSize:      req.PageSize,
	}, nil
}

func (s *conversationService) Update(ctx context.Context, id uuid.UUID, userID uuid.UUID, req UpdateConversationRequest) (*entity.Conversation, error) {
	conversation, err := s.conversationRepo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrConversationNotFound
	}

	if conversation.UserID != userID {
		return nil, ErrConversationUnauthorized
	}

	// 更新字段
	if req.Title != nil {
		conversation.Title = *req.Title
	}
	if req.Model != nil {
		conversation.Model = *req.Model
	}
	if req.SystemPrompt != nil {
		conversation.SystemPrompt = req.SystemPrompt
	}
	if req.FolderID != nil {
		// 验证文件夹
		folder, err := s.conversationFolderRepo.GetByID(ctx, *req.FolderID)
		if err != nil {
			return nil, ErrFolderNotFound
		}
		if folder.UserID != userID {
			return nil, ErrFolderUnauthorized
		}
		conversation.FolderID = req.FolderID
	}

	// 更新 AI 参数
	if req.Temperature != nil {
		conversation.Temperature = req.Temperature
	}
	if req.MaxTokens != nil {
		conversation.MaxTokens = req.MaxTokens
	}
	if req.TopP != nil {
		conversation.TopP = req.TopP
	}
	if req.TopK != nil {
		conversation.TopK = req.TopK
	}
	if req.FrequencyPenalty != nil {
		conversation.FrequencyPenalty = req.FrequencyPenalty
	}
	if req.PresencePenalty != nil {
		conversation.PresencePenalty = req.PresencePenalty
	}

	if err := s.conversationRepo.Update(ctx, conversation); err != nil {
		return nil, err
	}

	return conversation, nil
}

func (s *conversationService) Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	conversation, err := s.conversationRepo.GetByID(ctx, id)
	if err != nil {
		return ErrConversationNotFound
	}

	if conversation.UserID != userID {
		return ErrConversationUnauthorized
	}

	// 删除关联的消息
	if err := s.messageRepo.DeleteByConversation(ctx, id); err != nil {
		return err
	}

	// 删除标签
	if err := s.conversationTagRepo.DeleteByConversation(ctx, id); err != nil {
		return err
	}

	return s.conversationRepo.Delete(ctx, id)
}

func (s *conversationService) Duplicate(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*entity.Conversation, error) {
	original, err := s.conversationRepo.GetByIDWithMessages(ctx, id, 0)
	if err != nil {
		return nil, ErrConversationNotFound
	}

	if original.UserID != userID {
		return nil, ErrConversationUnauthorized
	}

	// 创建副本
	duplicate := &entity.Conversation{
		UserID:       userID,
		Title:        original.Title + " (副本)",
		Model:        original.Model,
		SystemPrompt: original.SystemPrompt,
		FolderID:     original.FolderID,
	}

	if err := s.conversationRepo.Create(ctx, duplicate); err != nil {
		return nil, err
	}

	// 复制标签
	tags, _ := s.conversationTagRepo.ListByConversation(ctx, id)
	tagNames := make([]string, len(tags))
	for i, tag := range tags {
		tagNames[i] = tag.TagName
	}
	if len(tagNames) > 0 {
		s.conversationTagRepo.SetTags(ctx, duplicate.ID, tagNames)
	}

	// 复制消息
	if len(original.Messages) > 0 {
		newMessages := make([]entity.Message, len(original.Messages))
		for i, msg := range original.Messages {
			newMessages[i] = entity.Message{
				ConversationID:   duplicate.ID,
				Role:             msg.Role,
				Content:          msg.Content,
				Model:            msg.Model,
				TokenUsage:       msg.TokenUsage,
				PromptTokens:     msg.PromptTokens,
				CompletionTokens: msg.CompletionTokens,
				Attachments:      msg.Attachments,
				Metadata:         msg.Metadata,
			}
		}
		s.messageRepo.BatchCreate(ctx, newMessages)
	}

	return s.GetByID(ctx, duplicate.ID, userID)
}

func (s *conversationService) SetStarred(ctx context.Context, id uuid.UUID, userID uuid.UUID, starred bool) error {
	conversation, err := s.conversationRepo.GetByID(ctx, id)
	if err != nil {
		return ErrConversationNotFound
	}

	if conversation.UserID != userID {
		return ErrConversationUnauthorized
	}

	return s.conversationRepo.SetStarred(ctx, id, starred)
}

func (s *conversationService) SetPinned(ctx context.Context, id uuid.UUID, userID uuid.UUID, pinned bool) error {
	conversation, err := s.conversationRepo.GetByID(ctx, id)
	if err != nil {
		return ErrConversationNotFound
	}

	if conversation.UserID != userID {
		return ErrConversationUnauthorized
	}

	return s.conversationRepo.SetPinned(ctx, id, pinned)
}

func (s *conversationService) SetArchived(ctx context.Context, id uuid.UUID, userID uuid.UUID, archived bool) error {
	conversation, err := s.conversationRepo.GetByID(ctx, id)
	if err != nil {
		return ErrConversationNotFound
	}

	if conversation.UserID != userID {
		return ErrConversationUnauthorized
	}

	return s.conversationRepo.SetArchived(ctx, id, archived)
}

func (s *conversationService) BatchSetStarred(ctx context.Context, userID uuid.UUID, ids []uuid.UUID, starred bool) (int, error) {
	// 验证所有对话属于当前用户
	validIDs := make([]uuid.UUID, 0, len(ids))
	for _, id := range ids {
		conv, err := s.conversationRepo.GetByID(ctx, id)
		if err == nil && conv.UserID == userID {
			validIDs = append(validIDs, id)
		}
	}

	if len(validIDs) == 0 {
		return 0, nil
	}

	if err := s.conversationRepo.BatchSetStarred(ctx, validIDs, starred); err != nil {
		return 0, err
	}

	return len(validIDs), nil
}

func (s *conversationService) BatchSetArchived(ctx context.Context, userID uuid.UUID, ids []uuid.UUID, archived bool) (int, error) {
	validIDs := make([]uuid.UUID, 0, len(ids))
	for _, id := range ids {
		conv, err := s.conversationRepo.GetByID(ctx, id)
		if err == nil && conv.UserID == userID {
			validIDs = append(validIDs, id)
		}
	}

	if len(validIDs) == 0 {
		return 0, nil
	}

	if err := s.conversationRepo.BatchSetArchived(ctx, validIDs, archived); err != nil {
		return 0, err
	}

	return len(validIDs), nil
}

func (s *conversationService) BatchDelete(ctx context.Context, userID uuid.UUID, ids []uuid.UUID) (int, error) {
	validIDs := make([]uuid.UUID, 0, len(ids))
	for _, id := range ids {
		conv, err := s.conversationRepo.GetByID(ctx, id)
		if err == nil && conv.UserID == userID {
			validIDs = append(validIDs, id)
		}
	}

	if len(validIDs) == 0 {
		return 0, nil
	}

	// 删除关联的消息和标签
	for _, id := range validIDs {
		s.messageRepo.DeleteByConversation(ctx, id)
		s.conversationTagRepo.DeleteByConversation(ctx, id)
	}

	if err := s.conversationRepo.BatchDelete(ctx, validIDs); err != nil {
		return 0, err
	}

	return len(validIDs), nil
}

func (s *conversationService) BatchMove(ctx context.Context, userID uuid.UUID, ids []uuid.UUID, folderID *uuid.UUID) (int, error) {
	// 验证文件夹
	if folderID != nil {
		folder, err := s.conversationFolderRepo.GetByID(ctx, *folderID)
		if err != nil {
			return 0, ErrFolderNotFound
		}
		if folder.UserID != userID {
			return 0, ErrFolderUnauthorized
		}
	}

	validIDs := make([]uuid.UUID, 0, len(ids))
	for _, id := range ids {
		conv, err := s.conversationRepo.GetByID(ctx, id)
		if err == nil && conv.UserID == userID {
			validIDs = append(validIDs, id)
		}
	}

	if len(validIDs) == 0 {
		return 0, nil
	}

	if err := s.conversationRepo.BatchMove(ctx, validIDs, folderID); err != nil {
		return 0, err
	}

	return len(validIDs), nil
}

func (s *conversationService) AddMessage(ctx context.Context, conversationID uuid.UUID, userID uuid.UUID, req AddMessageRequest) (*entity.Message, error) {
	conversation, err := s.conversationRepo.GetByID(ctx, conversationID)
	if err != nil {
		return nil, ErrConversationNotFound
	}

	if conversation.UserID != userID {
		return nil, ErrConversationUnauthorized
	}

	message := &entity.Message{
		ConversationID:   conversationID,
		Role:             req.Role,
		Content:          req.Content,
		Model:            req.Model,
		TokenUsage:       req.TokenUsage,
		PromptTokens:     req.PromptTokens,
		CompletionTokens: req.CompletionTokens,
		ParentID:         req.ParentID,
	}

	if err := s.messageRepo.Create(ctx, message); err != nil {
		return nil, err
	}

	// 更新对话统计
	messageCount, _ := s.messageRepo.CountByConversation(ctx, conversationID)
	preview := req.Content
	if len(preview) > 200 {
		preview = preview[:200] + "..."
	}
	s.conversationRepo.UpdateMessageStats(ctx, conversationID, int(messageCount), preview)

	// 更新token使用量
	if req.TokenUsage > 0 {
		s.conversationRepo.IncrementTokenUsage(ctx, conversationID, req.TokenUsage)
	}

	return message, nil
}

func (s *conversationService) ListMessages(ctx context.Context, conversationID uuid.UUID, userID uuid.UUID, req ListMessagesRequest) (*MessageListResponse, error) {
	conversation, err := s.conversationRepo.GetByID(ctx, conversationID)
	if err != nil {
		return nil, ErrConversationNotFound
	}

	if conversation.UserID != userID {
		return nil, ErrConversationUnauthorized
	}

	if req.Page <= 0 {
		req.Page = 1
	}
	if req.PageSize <= 0 {
		req.PageSize = 50
	}
	if req.PageSize > 100 {
		req.PageSize = 100
	}

	opts := repository.MessageListOptions{
		ConversationID: conversationID,
		Page:           req.Page,
		PageSize:       req.PageSize,
		BeforeID:       req.BeforeID,
		AfterID:        req.AfterID,
	}

	messages, total, err := s.messageRepo.List(ctx, opts)
	if err != nil {
		return nil, err
	}

	return &MessageListResponse{
		Messages: messages,
		Total:    total,
		Page:     req.Page,
		PageSize: req.PageSize,
	}, nil
}

func (s *conversationService) UpdateMessage(ctx context.Context, messageID uuid.UUID, conversationID uuid.UUID, userID uuid.UUID, req UpdateMessageRequest) (*entity.Message, error) {
	// 验证对话存在且属于当前用户
	conversation, err := s.conversationRepo.GetByID(ctx, conversationID)
	if err != nil {
		return nil, ErrConversationNotFound
	}

	if conversation.UserID != userID {
		return nil, ErrConversationUnauthorized
	}

	// 获取消息
	message, err := s.messageRepo.GetByID(ctx, messageID)
	if err != nil {
		return nil, ErrMessageNotFound
	}

	if message.ConversationID != conversationID {
		return nil, ErrMessageNotFound
	}

	// 更新消息内容
	message.Content = req.Content

	if err := s.messageRepo.Update(ctx, message); err != nil {
		return nil, err
	}

	// 如果是最新消息，更新对话预览
	latestMsg, _ := s.messageRepo.GetLatest(ctx, conversationID)
	if latestMsg != nil && latestMsg.ID == messageID {
		preview := req.Content
		if len(preview) > 200 {
			preview = preview[:200] + "..."
		}
		s.conversationRepo.UpdateMessageStats(ctx, conversationID, int(conversation.MessageCount), preview)
	}

	return message, nil
}

func (s *conversationService) UpdateMessageFeedback(ctx context.Context, messageID uuid.UUID, conversationID uuid.UUID, userID uuid.UUID, req UpdateMessageFeedbackRequest) (*entity.Message, error) {
	// 验证对话存在且属于当前用户
	conversation, err := s.conversationRepo.GetByID(ctx, conversationID)
	if err != nil {
		return nil, ErrConversationNotFound
	}

	if conversation.UserID != userID {
		return nil, ErrConversationUnauthorized
	}

	// 获取消息
	message, err := s.messageRepo.GetByID(ctx, messageID)
	if err != nil {
		return nil, ErrMessageNotFound
	}

	if message.ConversationID != conversationID {
		return nil, ErrMessageNotFound
	}

	// 更新反馈字段
	if req.Liked != nil {
		message.Liked = *req.Liked
		// 如果点赞，取消点踩
		if *req.Liked {
			message.Disliked = false
		}
	}
	if req.Disliked != nil {
		message.Disliked = *req.Disliked
		// 如果点踩，取消点赞
		if *req.Disliked {
			message.Liked = false
		}
	}
	if req.Bookmarked != nil {
		message.Bookmarked = *req.Bookmarked
	}

	if err := s.messageRepo.Update(ctx, message); err != nil {
		return nil, err
	}

	return message, nil
}

func (s *conversationService) DeleteMessage(ctx context.Context, messageID uuid.UUID, conversationID uuid.UUID, userID uuid.UUID) error {
	conversation, err := s.conversationRepo.GetByID(ctx, conversationID)
	if err != nil {
		return ErrConversationNotFound
	}

	if conversation.UserID != userID {
		return ErrConversationUnauthorized
	}

	message, err := s.messageRepo.GetByID(ctx, messageID)
	if err != nil {
		return ErrMessageNotFound
	}

	if message.ConversationID != conversationID {
		return ErrMessageNotFound
	}

	if err := s.messageRepo.Delete(ctx, messageID); err != nil {
		return err
	}

	// 更新对话消息计数
	messageCount, _ := s.messageRepo.CountByConversation(ctx, conversationID)
	latestMsg, _ := s.messageRepo.GetLatest(ctx, conversationID)
	preview := ""
	if latestMsg != nil {
		preview = latestMsg.Content
		if len(preview) > 200 {
			preview = preview[:200] + "..."
		}
	}
	s.conversationRepo.UpdateMessageStats(ctx, conversationID, int(messageCount), preview)

	return nil
}

func (s *conversationService) SetTags(ctx context.Context, id uuid.UUID, userID uuid.UUID, tags []string) error {
	conversation, err := s.conversationRepo.GetByID(ctx, id)
	if err != nil {
		return ErrConversationNotFound
	}

	if conversation.UserID != userID {
		return ErrConversationUnauthorized
	}

	return s.conversationTagRepo.SetTags(ctx, id, tags)
}

func (s *conversationService) GetStatistics(ctx context.Context, userID uuid.UUID) (*ConversationStatistics, error) {
	stats := &ConversationStatistics{
		ModelUsage: make(map[string]int64),
		DailyStats: make([]ConversationDailyStat, 0),
	}

	// 获取总对话数
	totalCount, err := s.conversationRepo.CountByUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	stats.TotalConversations = totalCount

	// 获取收藏对话数
	starredConvs, starredTotal, _ := s.conversationRepo.List(ctx, repository.ConversationListOptions{
		UserID:   userID,
		Starred:  func() *bool { b := true; return &b }(),
		Page:     1,
		PageSize: 1,
	})
	_ = starredConvs
	stats.StarredConversations = starredTotal

	// 获取归档对话数
	archivedConvs, archivedTotal, _ := s.conversationRepo.List(ctx, repository.ConversationListOptions{
		UserID:   userID,
		Archived: func() *bool { b := true; return &b }(),
		Page:     1,
		PageSize: 1,
	})
	_ = archivedConvs
	stats.ArchivedConversations = archivedTotal

	// 获取总消息数和 token 使用量
	conversations, _, _ := s.conversationRepo.List(ctx, repository.ConversationListOptions{
		UserID:   userID,
		Page:     1,
		PageSize: 10000, // 获取所有对话
	})

	var totalMessages int64
	var totalTokens int64
	for _, conv := range conversations {
		totalMessages += int64(conv.MessageCount)
		totalTokens += int64(conv.TokenUsage)

		// 统计模型使用
		if conv.Model != "" {
			stats.ModelUsage[conv.Model]++
		}
	}

	stats.TotalMessages = totalMessages
	stats.TotalTokenUsage = totalTokens

	// 计算平均消息数
	if totalCount > 0 {
		stats.AverageMessagesPerConversation = float64(totalMessages) / float64(totalCount)
	}

	// 获取近 7 天的统计（简化实现）
	// 实际生产环境应该使用数据库聚合查询
	// 这里暂时返回空数组

	return stats, nil
}
