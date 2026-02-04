package service

import (
	"context"
	"time"

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
	// ListAll 获取公告列表（管理员）
	ListAll(ctx context.Context, params AnnouncementAdminListParams) ([]entity.Announcement, int64, error)
	// ListAllWithStats 获取公告列表（管理员，含阅读统计）
	ListAllWithStats(ctx context.Context, params AnnouncementAdminListParams) ([]AdminAnnouncement, int64, error)
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

// AnnouncementAdminListParams 公告列表参数（管理员）
type AnnouncementAdminListParams struct {
	Type            string
	IncludeInactive bool
	IsActive        *bool
	Page            int
	PageSize        int
}

// AdminAnnouncement 管理端公告响应
type AdminAnnouncement struct {
	ID          string     `json:"id"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Type        string     `json:"type"`
	Priority    int        `json:"priority"`
	IsActive    bool       `json:"is_active"`
	StartsAt    time.Time  `json:"starts_at"`
	EndsAt      *time.Time `json:"ends_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	ReadCount   int64      `json:"read_count"`
	TotalUsers  int64      `json:"total_users"`
	ReadRate    float64    `json:"read_rate"`
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
	userRepo         repository.UserRepository
}

// NewAnnouncementService 创建公告服务实例
func NewAnnouncementService(announcementRepo repository.AnnouncementRepository, userRepo repository.UserRepository) AnnouncementService {
	return &announcementService{
		announcementRepo: announcementRepo,
		userRepo:         userRepo,
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

func (s *announcementService) ListAll(ctx context.Context, params AnnouncementAdminListParams) ([]entity.Announcement, int64, error) {
	return s.announcementRepo.ListAll(ctx, repository.AnnouncementAdminListParams{
		Type:            params.Type,
		IncludeInactive: params.IncludeInactive,
		IsActive:        params.IsActive,
		Page:            params.Page,
		PageSize:        params.PageSize,
	})
}

func (s *announcementService) ListAllWithStats(ctx context.Context, params AnnouncementAdminListParams) ([]AdminAnnouncement, int64, error) {
	announcements, total, err := s.ListAll(ctx, params)
	if err != nil {
		return nil, 0, err
	}

	totalUsers, err := s.userRepo.Count(ctx)
	if err != nil {
		return nil, 0, err
	}

	ids := make([]uuid.UUID, 0, len(announcements))
	for _, announcement := range announcements {
		ids = append(ids, announcement.ID)
	}

	readCounts, err := s.announcementRepo.GetReadCounts(ctx, ids)
	if err != nil {
		return nil, 0, err
	}

	results := make([]AdminAnnouncement, len(announcements))
	for i, announcement := range announcements {
		readCount := readCounts[announcement.ID]
		readRate := 0.0
		if totalUsers > 0 {
			readRate = float64(readCount) / float64(totalUsers) * 100
		}
		results[i] = AdminAnnouncement{
			ID:          announcement.ID.String(),
			Title:       announcement.Title,
			Description: announcement.Description,
			Type:        announcement.Type,
			Priority:    announcement.Priority,
			IsActive:    announcement.IsActive,
			StartsAt:    announcement.StartsAt,
			EndsAt:      announcement.EndsAt,
			CreatedAt:   announcement.CreatedAt,
			UpdatedAt:   announcement.UpdatedAt,
			ReadCount:   readCount,
			TotalUsers:  totalUsers,
			ReadRate:    readRate,
		}
	}

	return results, total, nil
}

func (s *announcementService) MarkAsRead(ctx context.Context, announcementID, userID uuid.UUID) error {
	return s.announcementRepo.MarkAsRead(ctx, announcementID, userID)
}
