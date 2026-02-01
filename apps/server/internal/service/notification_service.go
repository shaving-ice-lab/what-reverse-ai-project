package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
)

var (
	ErrNotificationNotFound    = errors.New("notification not found")
	ErrNotificationAccessDenied = errors.New("access denied to this notification")
)

// NotificationService 通知服务接口
type NotificationService interface {
	// 发送通知
	Send(ctx context.Context, req *SendNotificationRequest) (*entity.Notification, error)
	// 批量发送通知
	SendBatch(ctx context.Context, reqs []*SendNotificationRequest) error

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

	// =====================
	// 业务通知方法
	// =====================

	// 发送关注通知
	SendFollowNotification(ctx context.Context, followerID, followingID uuid.UUID) error
	// 发送评论通知
	SendCommentNotification(ctx context.Context, comment *entity.Comment, targetOwnerID uuid.UUID, targetTitle string) error
	// 发送回复通知
	SendReplyNotification(ctx context.Context, comment *entity.Comment, parentComment *entity.Comment) error
	// 发送点赞通知
	SendLikeNotification(ctx context.Context, likerID uuid.UUID, comment *entity.Comment) error
	// 发送收入通知
	SendIncomeNotification(ctx context.Context, userID uuid.UUID, amount float64, source string, sourceID uuid.UUID) error
	// 发送系统通知
	SendSystemNotification(ctx context.Context, userID uuid.UUID, title, content string) error
	// 发送批量系统通知（给所有用户或指定用户）
	SendBroadcastNotification(ctx context.Context, title, content string, userIDs []uuid.UUID) error
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
	Total   int64            `json:"total"`
	ByType  map[string]int64 `json:"by_type"`
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

func (s *notificationService) SendBatch(ctx context.Context, reqs []*SendNotificationRequest) error {
	notifications := make([]*entity.Notification, len(reqs))
	for i, req := range reqs {
		notifications[i] = &entity.Notification{
			UserID:     req.UserID,
			Type:       req.Type,
			Title:      req.Title,
			Content:    req.Content,
			ActorID:    req.ActorID,
			TargetType: req.TargetType,
			TargetID:   req.TargetID,
			Metadata:   entity.JSON(req.Metadata),
		}
	}
	return s.notificationRepo.BatchCreate(ctx, notifications)
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
// 业务通知方法实现
// =====================

func (s *notificationService) SendFollowNotification(ctx context.Context, followerID, followingID uuid.UUID) error {
	// 获取关注者信息
	follower, err := s.userRepo.GetByID(ctx, followerID)
	if err != nil {
		return err
	}

	displayName := follower.Username
	if follower.DisplayName != nil {
		displayName = *follower.DisplayName
	}

	title := displayName + " 关注了你"
	targetType := "user"

	_, err = s.Send(ctx, &SendNotificationRequest{
		UserID:     followingID,
		Type:       string(entity.NotificationTypeFollow),
		Title:      title,
		ActorID:    &followerID,
		TargetType: &targetType,
		TargetID:   &followerID,
	})

	return err
}

func (s *notificationService) SendCommentNotification(ctx context.Context, comment *entity.Comment, targetOwnerID uuid.UUID, targetTitle string) error {
	// 不给自己发通知
	if comment.UserID == targetOwnerID {
		return nil
	}

	// 获取评论者信息
	commenter, err := s.userRepo.GetByID(ctx, comment.UserID)
	if err != nil {
		return err
	}

	displayName := commenter.Username
	if commenter.DisplayName != nil {
		displayName = *commenter.DisplayName
	}

	title := displayName + " 评论了「" + targetTitle + "」"
	content := comment.Content
	if len(content) > 100 {
		content = content[:100] + "..."
	}

	_, err = s.Send(ctx, &SendNotificationRequest{
		UserID:     targetOwnerID,
		Type:       string(entity.NotificationTypeComment),
		Title:      title,
		Content:    &content,
		ActorID:    &comment.UserID,
		TargetType: &comment.TargetType,
		TargetID:   &comment.TargetID,
		Metadata: map[string]interface{}{
			"comment_id": comment.ID.String(),
		},
	})

	return err
}

func (s *notificationService) SendReplyNotification(ctx context.Context, comment *entity.Comment, parentComment *entity.Comment) error {
	// 不给自己发通知
	if comment.UserID == parentComment.UserID {
		return nil
	}

	// 获取回复者信息
	replier, err := s.userRepo.GetByID(ctx, comment.UserID)
	if err != nil {
		return err
	}

	displayName := replier.Username
	if replier.DisplayName != nil {
		displayName = *replier.DisplayName
	}

	title := displayName + " 回复了你的评论"
	content := comment.Content
	if len(content) > 100 {
		content = content[:100] + "..."
	}
	targetType := "comment"

	_, err = s.Send(ctx, &SendNotificationRequest{
		UserID:     parentComment.UserID,
		Type:       string(entity.NotificationTypeReply),
		Title:      title,
		Content:    &content,
		ActorID:    &comment.UserID,
		TargetType: &targetType,
		TargetID:   &parentComment.ID,
		Metadata: map[string]interface{}{
			"comment_id":        comment.ID.String(),
			"parent_comment_id": parentComment.ID.String(),
		},
	})

	return err
}

func (s *notificationService) SendLikeNotification(ctx context.Context, likerID uuid.UUID, comment *entity.Comment) error {
	// 不给自己发通知
	if likerID == comment.UserID {
		return nil
	}

	// 获取点赞者信息
	liker, err := s.userRepo.GetByID(ctx, likerID)
	if err != nil {
		return err
	}

	displayName := liker.Username
	if liker.DisplayName != nil {
		displayName = *liker.DisplayName
	}

	title := displayName + " 赞了你的评论"
	content := comment.Content
	if len(content) > 50 {
		content = content[:50] + "..."
	}
	targetType := "comment"

	_, err = s.Send(ctx, &SendNotificationRequest{
		UserID:     comment.UserID,
		Type:       string(entity.NotificationTypeLike),
		Title:      title,
		Content:    &content,
		ActorID:    &likerID,
		TargetType: &targetType,
		TargetID:   &comment.ID,
	})

	return err
}

func (s *notificationService) SendIncomeNotification(ctx context.Context, userID uuid.UUID, amount float64, source string, sourceID uuid.UUID) error {
	title := "收到一笔新收入"
	content := "来自 " + source + " 的收入 ¥" + formatAmount(amount)

	_, err := s.Send(ctx, &SendNotificationRequest{
		UserID:     userID,
		Type:       string(entity.NotificationTypeIncome),
		Title:      title,
		Content:    &content,
		TargetType: &source,
		TargetID:   &sourceID,
		Metadata: map[string]interface{}{
			"amount":    amount,
			"source":    source,
			"source_id": sourceID.String(),
		},
	})

	return err
}

func (s *notificationService) SendSystemNotification(ctx context.Context, userID uuid.UUID, title, content string) error {
	_, err := s.Send(ctx, &SendNotificationRequest{
		UserID:  userID,
		Type:    string(entity.NotificationTypeSystem),
		Title:   title,
		Content: &content,
	})
	return err
}

func (s *notificationService) SendBroadcastNotification(ctx context.Context, title, content string, userIDs []uuid.UUID) error {
	if len(userIDs) == 0 {
		return nil
	}

	reqs := make([]*SendNotificationRequest, len(userIDs))
	for i, userID := range userIDs {
		reqs[i] = &SendNotificationRequest{
			UserID:  userID,
			Type:    string(entity.NotificationTypeSystem),
			Title:   title,
			Content: &content,
		}
	}

	return s.SendBatch(ctx, reqs)
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

// formatAmount 格式化金额
func formatAmount(amount float64) string {
	return fmt.Sprintf("%.2f", amount)
}
