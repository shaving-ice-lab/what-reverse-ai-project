package repository

import (
	"context"
	"errors"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var (
	ErrAlreadyFollowing = errors.New("already following this user")
	ErrNotFollowing     = errors.New("not following this user")
	ErrCannotFollowSelf = errors.New("cannot follow yourself")
)

// FollowRepository 关注仓储接口
type FollowRepository interface {
	// 关注操作
	Follow(ctx context.Context, followerID, followingID uuid.UUID) error
	Unfollow(ctx context.Context, followerID, followingID uuid.UUID) error
	IsFollowing(ctx context.Context, followerID, followingID uuid.UUID) (bool, error)

	// 列表查询
	GetFollowers(ctx context.Context, userID uuid.UUID, page, pageSize int) ([]entity.UserFollow, int64, error)
	GetFollowing(ctx context.Context, userID uuid.UUID, page, pageSize int) ([]entity.UserFollow, int64, error)

	// 统计
	GetFollowerCount(ctx context.Context, userID uuid.UUID) (int64, error)
	GetFollowingCount(ctx context.Context, userID uuid.UUID) (int64, error)

	// 批量查询关注状态
	GetFollowingStatus(ctx context.Context, followerID uuid.UUID, userIDs []uuid.UUID) (map[uuid.UUID]bool, error)

	// 互相关注
	GetMutualFollowers(ctx context.Context, userID uuid.UUID, page, pageSize int) ([]entity.UserFollow, int64, error)
}

type followRepository struct {
	db *gorm.DB
}

// NewFollowRepository 创建关注仓储实例
func NewFollowRepository(db *gorm.DB) FollowRepository {
	return &followRepository{db: db}
}

func (r *followRepository) Follow(ctx context.Context, followerID, followingID uuid.UUID) error {
	// 检查是否关注自己
	if followerID == followingID {
		return ErrCannotFollowSelf
	}

	// 检查是否已关注
	exists, err := r.IsFollowing(ctx, followerID, followingID)
	if err != nil {
		return err
	}
	if exists {
		return ErrAlreadyFollowing
	}

	follow := &entity.UserFollow{
		FollowerID:  followerID,
		FollowingID: followingID,
	}

	return r.db.WithContext(ctx).Create(follow).Error
}

func (r *followRepository) Unfollow(ctx context.Context, followerID, followingID uuid.UUID) error {
	result := r.db.WithContext(ctx).
		Where("follower_id = ? AND following_id = ?", followerID, followingID).
		Delete(&entity.UserFollow{})

	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrNotFollowing
	}
	return nil
}

func (r *followRepository) IsFollowing(ctx context.Context, followerID, followingID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&entity.UserFollow{}).
		Where("follower_id = ? AND following_id = ?", followerID, followingID).
		Count(&count).Error
	return count > 0, err
}

func (r *followRepository) GetFollowers(ctx context.Context, userID uuid.UUID, page, pageSize int) ([]entity.UserFollow, int64, error) {
	var follows []entity.UserFollow
	var total int64

	// 计算总数
	if err := r.db.WithContext(ctx).
		Model(&entity.UserFollow{}).
		Where("following_id = ?", userID).
		Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 分页查询
	offset := (page - 1) * pageSize
	if err := r.db.WithContext(ctx).
		Preload("Follower").
		Where("following_id = ?", userID).
		Order("created_at DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&follows).Error; err != nil {
		return nil, 0, err
	}

	return follows, total, nil
}

func (r *followRepository) GetFollowing(ctx context.Context, userID uuid.UUID, page, pageSize int) ([]entity.UserFollow, int64, error) {
	var follows []entity.UserFollow
	var total int64

	// 计算总数
	if err := r.db.WithContext(ctx).
		Model(&entity.UserFollow{}).
		Where("follower_id = ?", userID).
		Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 分页查询
	offset := (page - 1) * pageSize
	if err := r.db.WithContext(ctx).
		Preload("Following").
		Where("follower_id = ?", userID).
		Order("created_at DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&follows).Error; err != nil {
		return nil, 0, err
	}

	return follows, total, nil
}

func (r *followRepository) GetFollowerCount(ctx context.Context, userID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&entity.UserFollow{}).
		Where("following_id = ?", userID).
		Count(&count).Error
	return count, err
}

func (r *followRepository) GetFollowingCount(ctx context.Context, userID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&entity.UserFollow{}).
		Where("follower_id = ?", userID).
		Count(&count).Error
	return count, err
}

func (r *followRepository) GetFollowingStatus(ctx context.Context, followerID uuid.UUID, userIDs []uuid.UUID) (map[uuid.UUID]bool, error) {
	result := make(map[uuid.UUID]bool)
	for _, id := range userIDs {
		result[id] = false
	}

	if len(userIDs) == 0 {
		return result, nil
	}

	var follows []entity.UserFollow
	if err := r.db.WithContext(ctx).
		Where("follower_id = ? AND following_id IN ?", followerID, userIDs).
		Find(&follows).Error; err != nil {
		return nil, err
	}

	for _, f := range follows {
		result[f.FollowingID] = true
	}

	return result, nil
}

func (r *followRepository) GetMutualFollowers(ctx context.Context, userID uuid.UUID, page, pageSize int) ([]entity.UserFollow, int64, error) {
	var follows []entity.UserFollow
	var total int64

	// 子查询：找出互相关注的用户
	subQuery := r.db.
		Table("what_reverse_user_follows AS f1").
		Select("f1.follower_id").
		Joins("INNER JOIN what_reverse_user_follows AS f2 ON f1.follower_id = f2.following_id AND f1.following_id = f2.follower_id").
		Where("f1.following_id = ?", userID)

	// 计算总数
	if err := r.db.WithContext(ctx).
		Model(&entity.UserFollow{}).
		Where("following_id = ? AND follower_id IN (?)", userID, subQuery).
		Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 分页查询
	offset := (page - 1) * pageSize
	if err := r.db.WithContext(ctx).
		Preload("Follower").
		Where("following_id = ? AND follower_id IN (?)", userID, subQuery).
		Order("created_at DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&follows).Error; err != nil {
		return nil, 0, err
	}

	return follows, total, nil
}
