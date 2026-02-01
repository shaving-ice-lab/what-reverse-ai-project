package repository

import (
	"context"
	"errors"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var (
	ErrCommentNotFound    = errors.New("comment not found")
	ErrAlreadyLiked       = errors.New("already liked this comment")
	ErrNotLiked           = errors.New("not liked this comment")
	ErrCannotReplyToReply = errors.New("cannot reply to a reply")
)

// CommentRepository 评论仓储接口
type CommentRepository interface {
	// 评论 CRUD
	Create(ctx context.Context, comment *entity.Comment) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.Comment, error)
	Update(ctx context.Context, comment *entity.Comment) error
	Delete(ctx context.Context, id uuid.UUID) error

	// 列表查询
	ListByTarget(ctx context.Context, targetType string, targetID uuid.UUID, page, pageSize int) ([]entity.Comment, int64, error)
	ListReplies(ctx context.Context, parentID uuid.UUID, page, pageSize int) ([]entity.Comment, int64, error)
	ListByUser(ctx context.Context, userID uuid.UUID, page, pageSize int) ([]entity.Comment, int64, error)

	// 点赞操作
	Like(ctx context.Context, userID, commentID uuid.UUID) error
	Unlike(ctx context.Context, userID, commentID uuid.UUID) error
	IsLiked(ctx context.Context, userID, commentID uuid.UUID) (bool, error)
	GetLikedStatus(ctx context.Context, userID uuid.UUID, commentIDs []uuid.UUID) (map[uuid.UUID]bool, error)

	// 统计
	GetCommentCount(ctx context.Context, targetType string, targetID uuid.UUID) (int64, error)
	IncrementReplyCount(ctx context.Context, commentID uuid.UUID) error
	DecrementReplyCount(ctx context.Context, commentID uuid.UUID) error

	// 置顶/隐藏
	Pin(ctx context.Context, id uuid.UUID) error
	Unpin(ctx context.Context, id uuid.UUID) error
	Hide(ctx context.Context, id uuid.UUID) error
	Unhide(ctx context.Context, id uuid.UUID) error
}

type commentRepository struct {
	db *gorm.DB
}

// NewCommentRepository 创建评论仓储实例
func NewCommentRepository(db *gorm.DB) CommentRepository {
	return &commentRepository{db: db}
}

func (r *commentRepository) Create(ctx context.Context, comment *entity.Comment) error {
	return r.db.WithContext(ctx).Create(comment).Error
}

func (r *commentRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.Comment, error) {
	var comment entity.Comment
	if err := r.db.WithContext(ctx).
		Preload("User").
		Preload("ReplyToUser").
		First(&comment, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCommentNotFound
		}
		return nil, err
	}
	return &comment, nil
}

func (r *commentRepository) Update(ctx context.Context, comment *entity.Comment) error {
	return r.db.WithContext(ctx).Save(comment).Error
}

func (r *commentRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&entity.Comment{}, "id = ?", id).Error
}

func (r *commentRepository) ListByTarget(ctx context.Context, targetType string, targetID uuid.UUID, page, pageSize int) ([]entity.Comment, int64, error) {
	var comments []entity.Comment
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.Comment{}).
		Where("target_type = ? AND target_id = ? AND parent_id IS NULL AND deleted_at IS NULL", targetType, targetID)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	offset := (page - 1) * pageSize
	if err := r.db.WithContext(ctx).
		Preload("User").
		Preload("ReplyToUser").
		Where("target_type = ? AND target_id = ? AND parent_id IS NULL AND deleted_at IS NULL", targetType, targetID).
		Order("is_pinned DESC, created_at DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&comments).Error; err != nil {
		return nil, 0, err
	}

	return comments, total, nil
}

func (r *commentRepository) ListReplies(ctx context.Context, parentID uuid.UUID, page, pageSize int) ([]entity.Comment, int64, error) {
	var comments []entity.Comment
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.Comment{}).
		Where("parent_id = ? AND deleted_at IS NULL", parentID)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	offset := (page - 1) * pageSize
	if err := r.db.WithContext(ctx).
		Preload("User").
		Preload("ReplyToUser").
		Where("parent_id = ? AND deleted_at IS NULL", parentID).
		Order("created_at ASC").
		Offset(offset).
		Limit(pageSize).
		Find(&comments).Error; err != nil {
		return nil, 0, err
	}

	return comments, total, nil
}

func (r *commentRepository) ListByUser(ctx context.Context, userID uuid.UUID, page, pageSize int) ([]entity.Comment, int64, error) {
	var comments []entity.Comment
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.Comment{}).
		Where("user_id = ? AND deleted_at IS NULL", userID)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	offset := (page - 1) * pageSize
	if err := r.db.WithContext(ctx).
		Preload("User").
		Where("user_id = ? AND deleted_at IS NULL", userID).
		Order("created_at DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&comments).Error; err != nil {
		return nil, 0, err
	}

	return comments, total, nil
}

func (r *commentRepository) Like(ctx context.Context, userID, commentID uuid.UUID) error {
	// 检查是否已点赞
	exists, err := r.IsLiked(ctx, userID, commentID)
	if err != nil {
		return err
	}
	if exists {
		return ErrAlreadyLiked
	}

	like := &entity.CommentLike{
		UserID:    userID,
		CommentID: commentID,
	}
	return r.db.WithContext(ctx).Create(like).Error
}

func (r *commentRepository) Unlike(ctx context.Context, userID, commentID uuid.UUID) error {
	result := r.db.WithContext(ctx).
		Where("user_id = ? AND comment_id = ?", userID, commentID).
		Delete(&entity.CommentLike{})

	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrNotLiked
	}
	return nil
}

func (r *commentRepository) IsLiked(ctx context.Context, userID, commentID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&entity.CommentLike{}).
		Where("user_id = ? AND comment_id = ?", userID, commentID).
		Count(&count).Error
	return count > 0, err
}

func (r *commentRepository) GetLikedStatus(ctx context.Context, userID uuid.UUID, commentIDs []uuid.UUID) (map[uuid.UUID]bool, error) {
	result := make(map[uuid.UUID]bool)
	for _, id := range commentIDs {
		result[id] = false
	}

	if len(commentIDs) == 0 {
		return result, nil
	}

	var likes []entity.CommentLike
	if err := r.db.WithContext(ctx).
		Where("user_id = ? AND comment_id IN ?", userID, commentIDs).
		Find(&likes).Error; err != nil {
		return nil, err
	}

	for _, l := range likes {
		result[l.CommentID] = true
	}

	return result, nil
}

func (r *commentRepository) GetCommentCount(ctx context.Context, targetType string, targetID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&entity.Comment{}).
		Where("target_type = ? AND target_id = ? AND deleted_at IS NULL", targetType, targetID).
		Count(&count).Error
	return count, err
}

func (r *commentRepository) IncrementReplyCount(ctx context.Context, commentID uuid.UUID) error {
	return r.db.WithContext(ctx).
		Model(&entity.Comment{}).
		Where("id = ?", commentID).
		UpdateColumn("reply_count", gorm.Expr("reply_count + 1")).Error
}

func (r *commentRepository) DecrementReplyCount(ctx context.Context, commentID uuid.UUID) error {
	return r.db.WithContext(ctx).
		Model(&entity.Comment{}).
		Where("id = ?", commentID).
		UpdateColumn("reply_count", gorm.Expr("GREATEST(reply_count - 1, 0)")).Error
}

func (r *commentRepository) Pin(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).
		Model(&entity.Comment{}).
		Where("id = ?", id).
		Update("is_pinned", true).Error
}

func (r *commentRepository) Unpin(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).
		Model(&entity.Comment{}).
		Where("id = ?", id).
		Update("is_pinned", false).Error
}

func (r *commentRepository) Hide(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).
		Model(&entity.Comment{}).
		Where("id = ?", id).
		Update("is_hidden", true).Error
}

func (r *commentRepository) Unhide(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).
		Model(&entity.Comment{}).
		Where("id = ?", id).
		Update("is_hidden", false).Error
}
