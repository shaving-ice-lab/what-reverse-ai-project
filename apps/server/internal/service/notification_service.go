package service

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/reverseai/server/internal/domain/entity"
	"github.com/reverseai/server/internal/repository"
)

var (
	ErrNotificationNotFound     = errors.New("notification not found")
	ErrNotificationAccessDenied = errors.New("access denied to this notification")
)

// NotificationService 通知服务接口
type NotificationService interface {
	// 发送通知
	Send(ctx context.Context, req *SendNotificationRequest) (*entity.Notification, error)

	// 获取通知
	GetByID(ctx context.Context, userID, notificationID uuid.UUID) (*NotificationDetail, error)
	// 获取通知列表
	List(ctx context.Context, userID uuid.UUID, req *ListNotificationRequest) (*NotificationListResponse, error)

	// 标记已读
	MarkAsRead(ctx context.Context, userID, notificationID uuid.UUID) error
	// 全部标记已读
	MarkAllAsRead(ctx context.Context, userID uuid.UUID, notificationType *string) error
	// 批量标记已读
	MarkMultipleAsRead(ctx context.Context, userID uuid.UUID, ids []uuid.UUID) error

	// 删除通知
	Delete(ctx context.Context, userID, notificationID uuid.UUID) error
	// 清空通知
	ClearAll(ctx context.Context, userID uuid.UUID, notificationType *string) error

	// 获取未读数
	GetUnreadCount(ctx context.Context, userID uuid.UUID) (int64, error)
	// 获取分类未读数
	GetUnreadCountByType(ctx context.Context, userID uuid.UUID) (*UnreadCountByType, error)
}

// SendNotificationRequest 发送通知请求
type SendNotificationRequest struct {
	UserID     uuid.UUID
	Type       string
	Title      string
	Content    *string
	ActorID    *uuid.UUID
	TargetType *string
	TargetID   *uuid.UUID
	Metadata   map[string]interface{}
}

// ListNotificationRequest 通知列表请求
type ListNotificationRequest struct {
	Type     *string
	IsRead   *bool
	Page     int
	PageSize int
}

// NotificationDetail 通知详情
type NotificationDetail struct {
	ID         uuid.UUID              `json:"id"`
	Type       string                 `json:"type"`
	Title      string                 `json:"title"`
	Content    *string                `json:"content,omitempty"`
	Actor      *NotificationUser      `json:"actor,omitempty"`
	TargetType *string                `json:"target_type,omitempty"`
	TargetID   *uuid.UUID             `json:"target_id,omitempty"`
	Metadata   map[string]interface{} `json:"metadata,omitempty"`
	IsRead     bool                   `json:"is_read"`
	ReadAt     *string                `json:"read_at,omitempty"`
	CreatedAt  string                 `json:"created_at"`
}

// NotificationUser 通知关联用户
type NotificationUser struct {
	ID          uuid.UUID `json:"id"`
	Username    string    `json:"username"`
	DisplayName *string   `json:"display_name,omitempty"`
	AvatarURL   *string   `json:"avatar_url,omitempty"`
}

// NotificationListResponse 通知列表响应
type NotificationListResponse struct {
	Items      []NotificationDetail `json:"items"`
	Total      int64                `json:"total"`
	Page       int                  `json:"page"`
	PageSize   int                  `json:"page_size"`
	TotalPages int                  `json:"total_pages"`
}

// UnreadCountByType 分类未读数
type UnreadCountByType struct {
	Total  int64            `json:"total"`
	ByType map[string]int64 `json:"by_type"`
}

type notificationService struct {
	notificationRepo repository.NotificationRepository
	userRepo         repository.UserRepository
}

// NewNotificationService 创建通知服务实例
func NewNotificationService(
	notificationRepo repository.NotificationRepository,
	userRepo repository.UserRepository,
) NotificationService {
	return &notificationService{
		notificationRepo: notificationRepo,
		userRepo:         userRepo,
	}
}

func (s *notificationService) Send(ctx context.Context, req *SendNotificationRequest) (*entity.Notification, error) {
	notification := &entity.Notification{
		UserID:     req.UserID,
		Type:       req.Type,
		Title:      req.Title,
		Content:    req.Content,
		ActorID:    req.ActorID,
		TargetType: req.TargetType,
		TargetID:   req.TargetID,
		Metadata:   entity.JSON(req.Metadata),
	}

	if err := s.notificationRepo.Create(ctx, notification); err != nil {
		return nil, err
	}

	return notification, nil
}

func (s *notificationService) GetByID(ctx context.Context, userID, notificationID uuid.UUID) (*NotificationDetail, error) {
	notification, err := s.notificationRepo.GetByID(ctx, notificationID)
	if err != nil {
		return nil, ErrNotificationNotFound
	}

	// 检查权限
	if notification.UserID != userID {
		return nil, ErrNotificationAccessDenied
	}

	return s.toNotificationDetail(notification), nil
}

func (s *notificationService) List(ctx context.Context, userID uuid.UUID, req *ListNotificationRequest) (*NotificationListResponse, error) {
	if req.Page < 1 {
		req.Page = 1
	}
	if req.PageSize < 1 || req.PageSize > 100 {
		req.PageSize = 20
	}

	notifications, total, err := s.notificationRepo.GetByUserID(ctx, userID, req.Type, req.IsRead, req.Page, req.PageSize)
	if err != nil {
		return nil, err
	}

	items := make([]NotificationDetail, len(notifications))
	for i, n := range notifications {
		items[i] = *s.toNotificationDetail(&n)
	}

	totalPages := int(total) / req.PageSize
	if int(total)%req.PageSize > 0 {
		totalPages++
	}

	return &NotificationListResponse{
		Items:      items,
		Total:      total,
		Page:       req.Page,
		PageSize:   req.PageSize,
		TotalPages: totalPages,
	}, nil
}

func (s *notificationService) MarkAsRead(ctx context.Context, userID, notificationID uuid.UUID) error {
	// 先检查通知是否属于该用户
	notification, err := s.notificationRepo.GetByID(ctx, notificationID)
	if err != nil {
		return ErrNotificationNotFound
	}
	if notification.UserID != userID {
		return ErrNotificationAccessDenied
	}

	return s.notificationRepo.MarkAsRead(ctx, notificationID)
}

func (s *notificationService) MarkAllAsRead(ctx context.Context, userID uuid.UUID, notificationType *string) error {
	return s.notificationRepo.MarkAllAsRead(ctx, userID, notificationType)
}

func (s *notificationService) MarkMultipleAsRead(ctx context.Context, userID uuid.UUID, ids []uuid.UUID) error {
	return s.notificationRepo.MarkMultipleAsRead(ctx, userID, ids)
}

func (s *notificationService) Delete(ctx context.Context, userID, notificationID uuid.UUID) error {
	// 先检查通知是否属于该用户
	notification, err := s.notificationRepo.GetByID(ctx, notificationID)
	if err != nil {
		return ErrNotificationNotFound
	}
	if notification.UserID != userID {
		return ErrNotificationAccessDenied
	}

	return s.notificationRepo.Delete(ctx, notificationID)
}

func (s *notificationService) ClearAll(ctx context.Context, userID uuid.UUID, notificationType *string) error {
	return s.notificationRepo.DeleteByUserID(ctx, userID, notificationType)
}

func (s *notificationService) GetUnreadCount(ctx context.Context, userID uuid.UUID) (int64, error) {
	return s.notificationRepo.GetUnreadCount(ctx, userID)
}

func (s *notificationService) GetUnreadCountByType(ctx context.Context, userID uuid.UUID) (*UnreadCountByType, error) {
	byType, err := s.notificationRepo.GetUnreadCountByType(ctx, userID)
	if err != nil {
		return nil, err
	}

	var total int64
	for _, count := range byType {
		total += count
	}

	return &UnreadCountByType{
		Total:  total,
		ByType: byType,
	}, nil
}

// =====================
// 辅助方法
// =====================

func (s *notificationService) toNotificationDetail(n *entity.Notification) *NotificationDetail {
	detail := &NotificationDetail{
		ID:         n.ID,
		Type:       n.Type,
		Title:      n.Title,
		Content:    n.Content,
		TargetType: n.TargetType,
		TargetID:   n.TargetID,
		IsRead:     n.IsRead,
		CreatedAt:  n.CreatedAt.Format("2006-01-02T15:04:05Z"),
	}

	if n.ReadAt != nil {
		readAt := n.ReadAt.Format("2006-01-02T15:04:05Z")
		detail.ReadAt = &readAt
	}

	if n.Actor != nil {
		detail.Actor = &NotificationUser{
			ID:          n.Actor.ID,
			Username:    n.Actor.Username,
			DisplayName: n.Actor.DisplayName,
			AvatarURL:   n.Actor.AvatarURL,
		}
	}

	if n.Metadata != nil {
		detail.Metadata = map[string]interface{}(n.Metadata)
	}

	return detail
}
