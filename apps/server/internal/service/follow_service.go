package service

import (
	"context"
	"errors"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
)

var (
	ErrAlreadyFollowing = errors.New("already following this user")
	ErrNotFollowing     = errors.New("not following this user")
	ErrCannotFollowSelf = errors.New("cannot follow yourself")
)

// FollowService 关注服务接口
type FollowService interface {
	// 关注操作
	Follow(ctx context.Context, followerID, followingID uuid.UUID) error
	Unfollow(ctx context.Context, followerID, followingID uuid.UUID) error
	IsFollowing(ctx context.Context, followerID, followingID uuid.UUID) (bool, error)

	// 列表查询
	GetFollowers(ctx context.Context, userID uuid.UUID, page, pageSize int) (*FollowListResponse, error)
	GetFollowing(ctx context.Context, userID uuid.UUID, page, pageSize int) (*FollowListResponse, error)
	GetMutualFollowers(ctx context.Context, userID uuid.UUID, page, pageSize int) (*FollowListResponse, error)

	// 用户关注状态
	GetFollowStats(ctx context.Context, userID uuid.UUID) (*FollowStats, error)

	// 批量查询关注状态
	GetFollowingStatus(ctx context.Context, followerID uuid.UUID, userIDs []uuid.UUID) (map[uuid.UUID]bool, error)

	// 关注动态
	GetFollowingActivity(ctx context.Context, userID uuid.UUID, page, pageSize int) (*ActivityListResponse, error)
}

// FollowListResponse 关注列表响应
type FollowListResponse struct {
	Items      []FollowUserInfo `json:"items"`
	Total      int64            `json:"total"`
	Page       int              `json:"page"`
	PageSize   int              `json:"page_size"`
	TotalPages int              `json:"total_pages"`
}

// FollowUserInfo 关注用户信息
type FollowUserInfo struct {
	ID             uuid.UUID `json:"id"`
	Username       string    `json:"username"`
	DisplayName    *string   `json:"display_name"`
	AvatarURL      *string   `json:"avatar_url"`
	Bio            *string   `json:"bio"`
	FollowerCount  int       `json:"follower_count"`
	FollowingCount int       `json:"following_count"`
	IsFollowing    bool      `json:"is_following"`
	IsFollowedBy   bool      `json:"is_followed_by"`
	FollowedAt     string    `json:"followed_at"`
}

// FollowStats 关注统计
type FollowStats struct {
	FollowerCount  int64 `json:"follower_count"`
	FollowingCount int64 `json:"following_count"`
}

// ActivityListResponse 动态列表响应
type ActivityListResponse struct {
	Items      []ActivityItem `json:"items"`
	Total      int64          `json:"total"`
	Page       int            `json:"page"`
	PageSize   int            `json:"page_size"`
	TotalPages int            `json:"total_pages"`
}

// ActivityItem 动态项
type ActivityItem struct {
	ID         uuid.UUID      `json:"id"`
	Action     string         `json:"action"` // 'workflow_created', 'agent_published', 'document_created'
	User       FollowUserInfo `json:"user"`
	EntityType *string        `json:"entity_type,omitempty"`
	EntityID   *uuid.UUID     `json:"entity_id,omitempty"`
	CreatedAt  string         `json:"created_at"`
}

type followService struct {
	followRepo       repository.FollowRepository
	userRepo         repository.UserRepository
	activityRepo     repository.ActivityRepository
	notificationRepo repository.NotificationRepository
}

// NewFollowService 创建关注服务实例
func NewFollowService(
	followRepo repository.FollowRepository,
	userRepo repository.UserRepository,
	activityRepo repository.ActivityRepository,
) FollowService {
	return &followService{
		followRepo:   followRepo,
		userRepo:     userRepo,
		activityRepo: activityRepo,
	}
}

// NewFollowServiceWithNotification 创建带通知的关注服务实例
func NewFollowServiceWithNotification(
	followRepo repository.FollowRepository,
	userRepo repository.UserRepository,
	activityRepo repository.ActivityRepository,
	notificationRepo repository.NotificationRepository,
) FollowService {
	return &followService{
		followRepo:       followRepo,
		userRepo:         userRepo,
		activityRepo:     activityRepo,
		notificationRepo: notificationRepo,
	}
}

func (s *followService) Follow(ctx context.Context, followerID, followingID uuid.UUID) error {
	// 检查用户是否存在
	_, err := s.userRepo.GetByID(ctx, followingID)
	if err != nil {
		return ErrUserNotFound
	}

	err = s.followRepo.Follow(ctx, followerID, followingID)
	if err != nil {
		if errors.Is(err, repository.ErrAlreadyFollowing) {
			return ErrAlreadyFollowing
		}
		if errors.Is(err, repository.ErrCannotFollowSelf) {
			return ErrCannotFollowSelf
		}
		return err
	}

	// 发送关注通知（异步，不阻塞主流程）
	if s.notificationRepo != nil {
		go s.sendFollowNotification(ctx, followerID, followingID)
	}

	return nil
}

// sendFollowNotification 发送关注通知
func (s *followService) sendFollowNotification(ctx context.Context, followerID, followingID uuid.UUID) {
	follower, err := s.userRepo.GetByID(ctx, followerID)
	if err != nil {
		return
	}

	displayName := follower.Username
	if follower.DisplayName != nil {
		displayName = *follower.DisplayName
	}

	notification := &entity.Notification{
		UserID:  followingID,
		Type:    string(entity.NotificationTypeFollow),
		Title:   displayName + " 关注了你",
		ActorID: &followerID,
	}

	_ = s.notificationRepo.Create(ctx, notification)
}

func (s *followService) Unfollow(ctx context.Context, followerID, followingID uuid.UUID) error {
	err := s.followRepo.Unfollow(ctx, followerID, followingID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFollowing) {
			return ErrNotFollowing
		}
		return err
	}
	return nil
}

func (s *followService) IsFollowing(ctx context.Context, followerID, followingID uuid.UUID) (bool, error) {
	return s.followRepo.IsFollowing(ctx, followerID, followingID)
}

func (s *followService) GetFollowers(ctx context.Context, userID uuid.UUID, page, pageSize int) (*FollowListResponse, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	follows, total, err := s.followRepo.GetFollowers(ctx, userID, page, pageSize)
	if err != nil {
		return nil, err
	}

	// 获取当前用户对这些粉丝的关注状态
	followerIDs := make([]uuid.UUID, len(follows))
	for i, f := range follows {
		followerIDs[i] = f.FollowerID
	}
	followingStatus, _ := s.followRepo.GetFollowingStatus(ctx, userID, followerIDs)

	items := make([]FollowUserInfo, len(follows))
	for i, f := range follows {
		user := f.Follower
		if user == nil {
			continue
		}
		items[i] = FollowUserInfo{
			ID:             user.ID,
			Username:       user.Username,
			DisplayName:    user.DisplayName,
			AvatarURL:      user.AvatarURL,
			Bio:            user.Bio,
			FollowerCount:  user.FollowerCount,
			FollowingCount: user.FollowingCount,
			IsFollowing:    followingStatus[user.ID],
			IsFollowedBy:   true,
			FollowedAt:     f.CreatedAt.Format("2006-01-02T15:04:05Z"),
		}
	}

	totalPages := int(total) / pageSize
	if int(total)%pageSize > 0 {
		totalPages++
	}

	return &FollowListResponse{
		Items:      items,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}, nil
}

func (s *followService) GetFollowing(ctx context.Context, userID uuid.UUID, page, pageSize int) (*FollowListResponse, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	follows, total, err := s.followRepo.GetFollowing(ctx, userID, page, pageSize)
	if err != nil {
		return nil, err
	}

	// 获取这些用户对当前用户的关注状态（是否互关）
	followingIDs := make([]uuid.UUID, len(follows))
	for i, f := range follows {
		followingIDs[i] = f.FollowingID
	}

	// 检查哪些用户也关注了当前用户
	followedByStatus := make(map[uuid.UUID]bool)
	for _, fid := range followingIDs {
		isFollowedBy, _ := s.followRepo.IsFollowing(ctx, fid, userID)
		followedByStatus[fid] = isFollowedBy
	}

	items := make([]FollowUserInfo, len(follows))
	for i, f := range follows {
		user := f.Following
		if user == nil {
			continue
		}
		items[i] = FollowUserInfo{
			ID:             user.ID,
			Username:       user.Username,
			DisplayName:    user.DisplayName,
			AvatarURL:      user.AvatarURL,
			Bio:            user.Bio,
			FollowerCount:  user.FollowerCount,
			FollowingCount: user.FollowingCount,
			IsFollowing:    true,
			IsFollowedBy:   followedByStatus[user.ID],
			FollowedAt:     f.CreatedAt.Format("2006-01-02T15:04:05Z"),
		}
	}

	totalPages := int(total) / pageSize
	if int(total)%pageSize > 0 {
		totalPages++
	}

	return &FollowListResponse{
		Items:      items,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}, nil
}

func (s *followService) GetMutualFollowers(ctx context.Context, userID uuid.UUID, page, pageSize int) (*FollowListResponse, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	follows, total, err := s.followRepo.GetMutualFollowers(ctx, userID, page, pageSize)
	if err != nil {
		return nil, err
	}

	items := make([]FollowUserInfo, len(follows))
	for i, f := range follows {
		user := f.Follower
		if user == nil {
			continue
		}
		items[i] = FollowUserInfo{
			ID:             user.ID,
			Username:       user.Username,
			DisplayName:    user.DisplayName,
			AvatarURL:      user.AvatarURL,
			Bio:            user.Bio,
			FollowerCount:  user.FollowerCount,
			FollowingCount: user.FollowingCount,
			IsFollowing:    true,
			IsFollowedBy:   true,
			FollowedAt:     f.CreatedAt.Format("2006-01-02T15:04:05Z"),
		}
	}

	totalPages := int(total) / pageSize
	if int(total)%pageSize > 0 {
		totalPages++
	}

	return &FollowListResponse{
		Items:      items,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}, nil
}

func (s *followService) GetFollowStats(ctx context.Context, userID uuid.UUID) (*FollowStats, error) {
	followerCount, err := s.followRepo.GetFollowerCount(ctx, userID)
	if err != nil {
		return nil, err
	}

	followingCount, err := s.followRepo.GetFollowingCount(ctx, userID)
	if err != nil {
		return nil, err
	}

	return &FollowStats{
		FollowerCount:  followerCount,
		FollowingCount: followingCount,
	}, nil
}

func (s *followService) GetFollowingStatus(ctx context.Context, followerID uuid.UUID, userIDs []uuid.UUID) (map[uuid.UUID]bool, error) {
	return s.followRepo.GetFollowingStatus(ctx, followerID, userIDs)
}

func (s *followService) GetFollowingActivity(ctx context.Context, userID uuid.UUID, page, pageSize int) (*ActivityListResponse, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 50 {
		pageSize = 20
	}

	// 获取关注列表
	following, _, err := s.followRepo.GetFollowing(ctx, userID, 1, 1000) // 获取所有关注的用户
	if err != nil {
		return nil, err
	}

	if len(following) == 0 {
		return &ActivityListResponse{
			Items:      []ActivityItem{},
			Total:      0,
			Page:       page,
			PageSize:   pageSize,
			TotalPages: 0,
		}, nil
	}

	// 获取关注用户的 ID 列表
	followingIDs := make([]uuid.UUID, len(following))
	for i, f := range following {
		followingIDs[i] = f.FollowingID
	}

	// 获取这些用户的活动
	activities, total, err := s.activityRepo.GetByUserIDs(ctx, followingIDs, page, pageSize)
	if err != nil {
		return nil, err
	}

	// 构建用户信息映射
	userMap := make(map[uuid.UUID]*entity.User)
	for _, f := range following {
		if f.Following != nil {
			userMap[f.FollowingID] = f.Following
		}
	}

	items := make([]ActivityItem, len(activities))
	for i, a := range activities {
		user := userMap[a.UserID]
		userInfo := FollowUserInfo{}
		if user != nil {
			userInfo = FollowUserInfo{
				ID:          user.ID,
				Username:    user.Username,
				DisplayName: user.DisplayName,
				AvatarURL:   user.AvatarURL,
			}
		}

		items[i] = ActivityItem{
			ID:         a.ID,
			Action:     a.Action,
			User:       userInfo,
			EntityType: a.EntityType,
			EntityID:   a.EntityID,
			CreatedAt:  a.CreatedAt.Format("2006-01-02T15:04:05Z"),
		}
	}

	totalPages := int(total) / pageSize
	if int(total)%pageSize > 0 {
		totalPages++
	}

	return &ActivityListResponse{
		Items:      items,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}, nil
}
