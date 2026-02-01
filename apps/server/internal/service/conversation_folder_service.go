package service

import (
	"context"
	"errors"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
)

var (
	ErrConversationFolderNotFound     = errors.New("conversation folder not found")
	ErrConversationFolderUnauthorized = errors.New("unauthorized to access this conversation folder")
)

// ConversationFolderService 对话文件夹服务接口
type ConversationFolderService interface {
	Create(ctx context.Context, userID uuid.UUID, req CreateConversationFolderRequest) (*entity.ConversationFolder, error)
	GetByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*entity.ConversationFolder, error)
	List(ctx context.Context, userID uuid.UUID) ([]ConversationFolderResponse, error)
	Update(ctx context.Context, id uuid.UUID, userID uuid.UUID, req UpdateConversationFolderRequest) (*entity.ConversationFolder, error)
	Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error
}

// CreateConversationFolderRequest 创建对话文件夹请求
type CreateConversationFolderRequest struct {
	Name     string     `json:"name" validate:"required,max=100"`
	Icon     string     `json:"icon"`
	Color    string     `json:"color"`
	ParentID *uuid.UUID `json:"parent_id"`
}

// UpdateConversationFolderRequest 更新对话文件夹请求
type UpdateConversationFolderRequest struct {
	Name      *string `json:"name"`
	Icon      *string `json:"icon"`
	Color     *string `json:"color"`
	SortOrder *int    `json:"sort_order"`
}

// ConversationFolderResponse 对话文件夹响应
type ConversationFolderResponse struct {
	ID                uuid.UUID  `json:"id"`
	Name              string     `json:"name"`
	Icon              string     `json:"icon"`
	Color             string     `json:"color"`
	ParentID          *uuid.UUID `json:"parent_id"`
	SortOrder         int        `json:"sort_order"`
	ConversationCount int        `json:"conversation_count"`
	CreatedAt         string     `json:"created_at"`
	UpdatedAt         string     `json:"updated_at"`
}

type conversationFolderService struct {
	folderRepo       repository.ConversationFolderRepository
	conversationRepo repository.ConversationRepository
}

// NewConversationFolderService 创建对话文件夹服务实例
func NewConversationFolderService(
	folderRepo repository.ConversationFolderRepository,
	conversationRepo repository.ConversationRepository,
) ConversationFolderService {
	return &conversationFolderService{
		folderRepo:       folderRepo,
		conversationRepo: conversationRepo,
	}
}

func (s *conversationFolderService) Create(ctx context.Context, userID uuid.UUID, req CreateConversationFolderRequest) (*entity.ConversationFolder, error) {
	folder := &entity.ConversationFolder{
		UserID:   userID,
		Name:     req.Name,
		Icon:     req.Icon,
		Color:    req.Color,
		ParentID: req.ParentID,
	}

	// 设置默认值
	if folder.Icon == "" {
		folder.Icon = "📁"
	}
	if folder.Color == "" {
		folder.Color = "#3ECF8E"
	}

	// 如果有父文件夹，验证父文件夹属于同一用户
	if req.ParentID != nil {
		parent, err := s.folderRepo.GetByID(ctx, *req.ParentID)
		if err != nil {
			return nil, ErrConversationFolderNotFound
		}
		if parent.UserID != userID {
			return nil, ErrConversationFolderUnauthorized
		}
	}

	if err := s.folderRepo.Create(ctx, folder); err != nil {
		return nil, err
	}

	return folder, nil
}

func (s *conversationFolderService) GetByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*entity.ConversationFolder, error) {
	folder, err := s.folderRepo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrConversationFolderNotFound
	}

	if folder.UserID != userID {
		return nil, ErrConversationFolderUnauthorized
	}

	// 获取对话数量
	count, err := s.conversationRepo.CountByFolder(ctx, id)
	if err == nil {
		folder.ConversationCount = int(count)
	}

	return folder, nil
}

func (s *conversationFolderService) List(ctx context.Context, userID uuid.UUID) ([]ConversationFolderResponse, error) {
	folders, err := s.folderRepo.ListWithCount(ctx, userID)
	if err != nil {
		return nil, err
	}

	responses := make([]ConversationFolderResponse, len(folders))
	for i, folder := range folders {
		responses[i] = ConversationFolderResponse{
			ID:                folder.ID,
			Name:              folder.Name,
			Icon:              folder.Icon,
			Color:             folder.Color,
			ParentID:          folder.ParentID,
			SortOrder:         folder.SortOrder,
			ConversationCount: folder.ConversationCount,
			CreatedAt:         folder.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			UpdatedAt:         folder.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		}
	}

	return responses, nil
}

func (s *conversationFolderService) Update(ctx context.Context, id uuid.UUID, userID uuid.UUID, req UpdateConversationFolderRequest) (*entity.ConversationFolder, error) {
	folder, err := s.folderRepo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrConversationFolderNotFound
	}

	if folder.UserID != userID {
		return nil, ErrConversationFolderUnauthorized
	}

	// 更新字段
	if req.Name != nil {
		folder.Name = *req.Name
	}
	if req.Icon != nil {
		folder.Icon = *req.Icon
	}
	if req.Color != nil {
		folder.Color = *req.Color
	}
	if req.SortOrder != nil {
		folder.SortOrder = *req.SortOrder
	}

	if err := s.folderRepo.Update(ctx, folder); err != nil {
		return nil, err
	}

	return folder, nil
}

func (s *conversationFolderService) Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	folder, err := s.folderRepo.GetByID(ctx, id)
	if err != nil {
		return ErrConversationFolderNotFound
	}

	if folder.UserID != userID {
		return ErrConversationFolderUnauthorized
	}

	return s.folderRepo.Delete(ctx, id)
}
