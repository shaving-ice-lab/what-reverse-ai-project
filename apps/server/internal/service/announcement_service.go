package service

import (
	"context"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
)

// AnnouncementService 公告服务接口
type AnnouncementService interface {
	// Create 创建公告
	Create(ctx context.Context, announcement *entity.Announcement) error
	// Get 获取公告
	Get(ctx context.Context, id uuid.UUID) (*entity.Announcement, error)
	// Update 更新公告
	Update(ctx context.Context, announcement *entity.Announcement) error
	// Delete 删除公告
	Delete(ctx context.Context, id uuid.UUID) error
	// List 获取公告列表
	List(ctx context.Context, params AnnouncementListParams) ([]AnnouncementResponse, int64, error)
	// MarkAsRead 标记公告为已读
	MarkAsRead(ctx context.Context, announcementID, userID uuid.UUID) error
}

// AnnouncementListParams 公告列表参数
type AnnouncementListParams struct {
	Type     string
	UserID   *uuid.UUID // 用于获取已读状态
	Page     int
	PageSize int
}

// AnnouncementResponse 公告响应
type AnnouncementResponse struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Type        string `json:"type"`
	IsRead      bool   `json:"is_read"`
	CreatedAt   string `json:"created_at"`
}

type announcementService struct {
	announcementRepo repository.AnnouncementRepository
}

// NewAnnouncementService 创建公告服务实例
func NewAnnouncementService(announcementRepo repository.AnnouncementRepository) AnnouncementService {
	return &announcementService{
		announcementRepo: announcementRepo,
	}
}

func (s *announcementService) Create(ctx context.Context, announcement *entity.Announcement) error {
	return s.announcementRepo.Create(ctx, announcement)
}

func (s *announcementService) Get(ctx context.Context, id uuid.UUID) (*entity.Announcement, error) {
	return s.announcementRepo.GetByID(ctx, id)
}

func (s *announcementService) Update(ctx context.Context, announcement *entity.Announcement) error {
	return s.announcementRepo.Update(ctx, announcement)
}

func (s *announcementService) Delete(ctx context.Context, id uuid.UUID) error {
	return s.announcementRepo.Delete(ctx, id)
}

func (s *announcementService) List(ctx context.Context, params AnnouncementListParams) ([]AnnouncementResponse, int64, error) {
	announcements, total, err := s.announcementRepo.ListActive(ctx, repository.AnnouncementListParams{
		Type:     params.Type,
		Page:     params.Page,
		PageSize: params.PageSize,
	})
	if err != nil {
		return nil, 0, err
	}

	// 获取已读状态
	var readIDs []uuid.UUID
	if params.UserID != nil {
		readIDs, _ = s.announcementRepo.GetReadStatus(ctx, *params.UserID)
	}
	readMap := make(map[uuid.UUID]bool)
	for _, id := range readIDs {
		readMap[id] = true
	}

	// 转换为响应
	responses := make([]AnnouncementResponse, len(announcements))
	for i, a := range announcements {
		responses[i] = AnnouncementResponse{
			ID:          a.ID.String(),
			Title:       a.Title,
			Description: a.Description,
			Type:        a.Type,
			IsRead:      readMap[a.ID],
			CreatedAt:   a.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		}
	}

	return responses, total, nil
}

func (s *announcementService) MarkAsRead(ctx context.Context, announcementID, userID uuid.UUID) error {
	return s.announcementRepo.MarkAsRead(ctx, announcementID, userID)
}
