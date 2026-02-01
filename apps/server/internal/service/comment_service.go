package service

import (
	"context"
	"errors"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
)

var (
	ErrCommentNotFound     = errors.New("comment not found")
	ErrCommentUnauthorized = errors.New("unauthorized to modify this comment")
	ErrInvalidTargetType   = errors.New("invalid target type")
	ErrCommentTooLong      = errors.New("comment content too long")
	ErrEmptyComment        = errors.New("comment content cannot be empty")
	ErrCannotReplyToReply  = errors.New("cannot reply to a reply")
	ErrAlreadyLiked        = errors.New("already liked this comment")
	ErrNotLiked            = errors.New("not liked this comment")
)

// CommentService 评论服务接口
type CommentService interface {
	// 评论 CRUD
	Create(ctx context.Context, req CreateCommentRequest) (*CommentResponse, error)
	GetByID(ctx context.Context, id uuid.UUID, currentUserID *uuid.UUID) (*CommentResponse, error)
	Update(ctx context.Context, id uuid.UUID, userID uuid.UUID, content string) (*CommentResponse, error)
	Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error

	// 列表查询
	ListByTarget(ctx context.Context, targetType string, targetID uuid.UUID, page, pageSize int, currentUserID *uuid.UUID) (*CommentListResponse, error)
	ListReplies(ctx context.Context, parentID uuid.UUID, page, pageSize int, currentUserID *uuid.UUID) (*CommentListResponse, error)
	ListByUser(ctx context.Context, userID uuid.UUID, page, pageSize int) (*CommentListResponse, error)

	// 点赞
	Like(ctx context.Context, userID, commentID uuid.UUID) error
	Unlike(ctx context.Context, userID, commentID uuid.UUID) error

	// 管理操作
	Pin(ctx context.Context, id uuid.UUID, userID uuid.UUID) error
	Unpin(ctx context.Context, id uuid.UUID, userID uuid.UUID) error
	Hide(ctx context.Context, id uuid.UUID, userID uuid.UUID) error
	Unhide(ctx context.Context, id uuid.UUID, userID uuid.UUID) error
}

// CreateCommentRequest 创建评论请求
type CreateCommentRequest struct {
	UserID        uuid.UUID
	TargetType    string
	TargetID      uuid.UUID
	ParentID      *uuid.UUID
	ReplyToUserID *uuid.UUID
	Content       string
}

// CommentResponse 评论响应
type CommentResponse struct {
	ID          uuid.UUID         `json:"id"`
	User        CommentUserInfo   `json:"user"`
	TargetType  string            `json:"target_type"`
	TargetID    uuid.UUID         `json:"target_id"`
	ParentID    *uuid.UUID        `json:"parent_id,omitempty"`
	ReplyToUser *CommentUserInfo  `json:"reply_to_user,omitempty"`
	Content     string            `json:"content"`
	LikeCount   int               `json:"like_count"`
	ReplyCount  int               `json:"reply_count"`
	IsPinned    bool              `json:"is_pinned"`
	IsLiked     bool              `json:"is_liked"`
	IsOwner     bool              `json:"is_owner"`
	CreatedAt   string            `json:"created_at"`
	UpdatedAt   string            `json:"updated_at"`
	Replies     []CommentResponse `json:"replies,omitempty"`
}

// CommentUserInfo 评论用户信息
type CommentUserInfo struct {
	ID          uuid.UUID `json:"id"`
	Username    string    `json:"username"`
	DisplayName *string   `json:"display_name"`
	AvatarURL   *string   `json:"avatar_url"`
}

// CommentListResponse 评论列表响应
type CommentListResponse struct {
	Items      []CommentResponse `json:"items"`
	Total      int64             `json:"total"`
	Page       int               `json:"page"`
	PageSize   int               `json:"page_size"`
	TotalPages int               `json:"total_pages"`
}

type commentService struct {
	commentRepo      repository.CommentRepository
	userRepo         repository.UserRepository
	notificationRepo repository.NotificationRepository
}

// NewCommentService 创建评论服务实例
func NewCommentService(
	commentRepo repository.CommentRepository,
	userRepo repository.UserRepository,
) CommentService {
	return &commentService{
		commentRepo: commentRepo,
		userRepo:    userRepo,
	}
}

// NewCommentServiceWithNotification 创建带通知的评论服务实例
func NewCommentServiceWithNotification(
	commentRepo repository.CommentRepository,
	userRepo repository.UserRepository,
	notificationRepo repository.NotificationRepository,
) CommentService {
	return &commentService{
		commentRepo:      commentRepo,
		userRepo:         userRepo,
		notificationRepo: notificationRepo,
	}
}

func (s *commentService) Create(ctx context.Context, req CreateCommentRequest) (*CommentResponse, error) {
	// 验证评论内容
	if len(req.Content) == 0 {
		return nil, ErrEmptyComment
	}
	if len(req.Content) > 2000 {
		return nil, ErrCommentTooLong
	}

	// 验证目标类型
	if !entity.IsValidCommentTargetType(req.TargetType) {
		return nil, ErrInvalidTargetType
	}

	// 如果是回复，检查父评论
	if req.ParentID != nil {
		parent, err := s.commentRepo.GetByID(ctx, *req.ParentID)
		if err != nil {
			return nil, ErrCommentNotFound
		}
		// 不允许回复回复（只允许二级嵌套）
		if parent.ParentID != nil {
			return nil, ErrCannotReplyToReply
		}
	}

	comment := &entity.Comment{
		UserID:        req.UserID,
		TargetType:    req.TargetType,
		TargetID:      req.TargetID,
		ParentID:      req.ParentID,
		ReplyToUserID: req.ReplyToUserID,
		Content:       req.Content,
	}

	if err := s.commentRepo.Create(ctx, comment); err != nil {
		return nil, err
	}

	// 如果是回复，增加父评论的回复数，并发送回复通知
	if req.ParentID != nil {
		_ = s.commentRepo.IncrementReplyCount(ctx, *req.ParentID)
		
		// 发送回复通知
		if s.notificationRepo != nil && req.ReplyToUserID != nil {
			go s.sendReplyNotification(ctx, req.UserID, *req.ReplyToUserID, comment.ID, req.Content)
		}
	}

	// 获取完整的评论信息
	return s.GetByID(ctx, comment.ID, &req.UserID)
}

// sendReplyNotification 发送回复通知
func (s *commentService) sendReplyNotification(ctx context.Context, replierID, targetUserID, commentID uuid.UUID, content string) {
	// 不给自己发通知
	if replierID == targetUserID {
		return
	}

	replier, err := s.userRepo.GetByID(ctx, replierID)
	if err != nil {
		return
	}

	displayName := replier.Username
	if replier.DisplayName != nil {
		displayName = *replier.DisplayName
	}

	preview := content
	if len(preview) > 50 {
		preview = preview[:50] + "..."
	}

	targetType := "comment"
	notification := &entity.Notification{
		UserID:     targetUserID,
		Type:       string(entity.NotificationTypeReply),
		Title:      displayName + " 回复了你的评论",
		Content:    &preview,
		ActorID:    &replierID,
		TargetType: &targetType,
		TargetID:   &commentID,
	}

	_ = s.notificationRepo.Create(ctx, notification)

	// 结束异步通知发送
}

func (s *commentService) GetByID(ctx context.Context, id uuid.UUID, currentUserID *uuid.UUID) (*CommentResponse, error) {
	comment, err := s.commentRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrCommentNotFound) {
			return nil, ErrCommentNotFound
		}
		return nil, err
	}

	// 检查是否点赞
	isLiked := false
	if currentUserID != nil {
		isLiked, _ = s.commentRepo.IsLiked(ctx, *currentUserID, id)
	}

	return s.toCommentResponse(comment, isLiked, currentUserID), nil
}

func (s *commentService) Update(ctx context.Context, id uuid.UUID, userID uuid.UUID, content string) (*CommentResponse, error) {
	comment, err := s.commentRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrCommentNotFound) {
			return nil, ErrCommentNotFound
		}
		return nil, err
	}

	// 检查权限
	if comment.UserID != userID {
		return nil, ErrCommentUnauthorized
	}

	// 验证内容
	if len(content) == 0 {
		return nil, ErrEmptyComment
	}
	if len(content) > 2000 {
		return nil, ErrCommentTooLong
	}

	comment.Content = content
	if err := s.commentRepo.Update(ctx, comment); err != nil {
		return nil, err
	}

	return s.GetByID(ctx, id, &userID)
}

func (s *commentService) Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	comment, err := s.commentRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrCommentNotFound) {
			return ErrCommentNotFound
		}
		return err
	}

	// 检查权限
	if comment.UserID != userID {
		return ErrCommentUnauthorized
	}

	// 如果是回复，减少父评论的回复数
	if comment.ParentID != nil {
		_ = s.commentRepo.DecrementReplyCount(ctx, *comment.ParentID)
	}

	return s.commentRepo.Delete(ctx, id)
}

func (s *commentService) ListByTarget(ctx context.Context, targetType string, targetID uuid.UUID, page, pageSize int, currentUserID *uuid.UUID) (*CommentListResponse, error) {
	if !entity.IsValidCommentTargetType(targetType) {
		return nil, ErrInvalidTargetType
	}

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	comments, total, err := s.commentRepo.ListByTarget(ctx, targetType, targetID, page, pageSize)
	if err != nil {
		return nil, err
	}

	// 获取点赞状态
	commentIDs := make([]uuid.UUID, len(comments))
	for i, c := range comments {
		commentIDs[i] = c.ID
	}

	likedStatus := make(map[uuid.UUID]bool)
	if currentUserID != nil && len(commentIDs) > 0 {
		likedStatus, _ = s.commentRepo.GetLikedStatus(ctx, *currentUserID, commentIDs)
	}

	items := make([]CommentResponse, len(comments))
	for i, c := range comments {
		items[i] = *s.toCommentResponse(&c, likedStatus[c.ID], currentUserID)
	}

	totalPages := int(total) / pageSize
	if int(total)%pageSize > 0 {
		totalPages++
	}

	return &CommentListResponse{
		Items:      items,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}, nil
}

func (s *commentService) ListReplies(ctx context.Context, parentID uuid.UUID, page, pageSize int, currentUserID *uuid.UUID) (*CommentListResponse, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	comments, total, err := s.commentRepo.ListReplies(ctx, parentID, page, pageSize)
	if err != nil {
		return nil, err
	}

	// 获取点赞状态
	commentIDs := make([]uuid.UUID, len(comments))
	for i, c := range comments {
		commentIDs[i] = c.ID
	}

	likedStatus := make(map[uuid.UUID]bool)
	if currentUserID != nil && len(commentIDs) > 0 {
		likedStatus, _ = s.commentRepo.GetLikedStatus(ctx, *currentUserID, commentIDs)
	}

	items := make([]CommentResponse, len(comments))
	for i, c := range comments {
		items[i] = *s.toCommentResponse(&c, likedStatus[c.ID], currentUserID)
	}

	totalPages := int(total) / pageSize
	if int(total)%pageSize > 0 {
		totalPages++
	}

	return &CommentListResponse{
		Items:      items,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}, nil
}

func (s *commentService) ListByUser(ctx context.Context, userID uuid.UUID, page, pageSize int) (*CommentListResponse, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	comments, total, err := s.commentRepo.ListByUser(ctx, userID, page, pageSize)
	if err != nil {
		return nil, err
	}

	items := make([]CommentResponse, len(comments))
	for i, c := range comments {
		items[i] = *s.toCommentResponse(&c, false, &userID)
	}

	totalPages := int(total) / pageSize
	if int(total)%pageSize > 0 {
		totalPages++
	}

	return &CommentListResponse{
		Items:      items,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}, nil
}

func (s *commentService) Like(ctx context.Context, userID, commentID uuid.UUID) error {
	// 检查评论是否存在
	comment, err := s.commentRepo.GetByID(ctx, commentID)
	if err != nil {
		if errors.Is(err, repository.ErrCommentNotFound) {
			return ErrCommentNotFound
		}
		return err
	}

	err = s.commentRepo.Like(ctx, userID, commentID)
	if errors.Is(err, repository.ErrAlreadyLiked) {
		return ErrAlreadyLiked
	}
	if err != nil {
		return err
	}

	// 发送点赞通知
	if s.notificationRepo != nil && comment.UserID != userID {
		go s.sendLikeNotification(ctx, userID, comment.UserID, commentID)
	}

	return nil
}

// sendLikeNotification 发送点赞通知
func (s *commentService) sendLikeNotification(ctx context.Context, likerID, targetUserID, commentID uuid.UUID) {
	liker, err := s.userRepo.GetByID(ctx, likerID)
	if err != nil {
		return
	}

	displayName := liker.Username
	if liker.DisplayName != nil {
		displayName = *liker.DisplayName
	}

	targetType := "comment"
	notification := &entity.Notification{
		UserID:     targetUserID,
		Type:       string(entity.NotificationTypeLike),
		Title:      displayName + " 赞了你的评论",
		ActorID:    &likerID,
		TargetType: &targetType,
		TargetID:   &commentID,
	}

	_ = s.notificationRepo.Create(ctx, notification)
}

func (s *commentService) Unlike(ctx context.Context, userID, commentID uuid.UUID) error {
	err := s.commentRepo.Unlike(ctx, userID, commentID)
	if errors.Is(err, repository.ErrNotLiked) {
		return ErrNotLiked
	}
	return err
}

func (s *commentService) Pin(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	// TODO: 添加权限检查（只有目标内容的作者可以置顶评论）
	return s.commentRepo.Pin(ctx, id)
}

func (s *commentService) Unpin(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	return s.commentRepo.Unpin(ctx, id)
}

func (s *commentService) Hide(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	// TODO: 添加权限检查
	return s.commentRepo.Hide(ctx, id)
}

func (s *commentService) Unhide(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	return s.commentRepo.Unhide(ctx, id)
}

// toCommentResponse 转换为响应格式
func (s *commentService) toCommentResponse(comment *entity.Comment, isLiked bool, currentUserID *uuid.UUID) *CommentResponse {
	resp := &CommentResponse{
		ID:         comment.ID,
		TargetType: comment.TargetType,
		TargetID:   comment.TargetID,
		ParentID:   comment.ParentID,
		Content:    comment.Content,
		LikeCount:  comment.LikeCount,
		ReplyCount: comment.ReplyCount,
		IsPinned:   comment.IsPinned,
		IsLiked:    isLiked,
		CreatedAt:  comment.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt:  comment.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}

	// 用户信息
	if comment.User != nil {
		resp.User = CommentUserInfo{
			ID:          comment.User.ID,
			Username:    comment.User.Username,
			DisplayName: comment.User.DisplayName,
			AvatarURL:   comment.User.AvatarURL,
		}
	}

	// 回复目标用户
	if comment.ReplyToUser != nil {
		resp.ReplyToUser = &CommentUserInfo{
			ID:          comment.ReplyToUser.ID,
			Username:    comment.ReplyToUser.Username,
			DisplayName: comment.ReplyToUser.DisplayName,
			AvatarURL:   comment.ReplyToUser.AvatarURL,
		}
	}

	// 是否是作者
	if currentUserID != nil {
		resp.IsOwner = comment.UserID == *currentUserID
	}

	return resp
}
