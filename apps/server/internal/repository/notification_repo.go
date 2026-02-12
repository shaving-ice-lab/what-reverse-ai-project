package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/reverseai/server/internal/domain/entity"
	"gorm.io/gorm"
)

// NotificationRepository 通知仓储接口
type NotificationRepository interface {
	// 创建通知
	Create(ctx context.Context, notification *entity.Notification) error
	// 批量创建通知
	BatchCreate(ctx context.Context, notifications []*entity.Notification) error

	// 获取通知
	GetByID(ctx context.Context, id uuid.UUID) (*entity.Notification, error)
	// 获取用户通知列表
	GetByUserID(ctx context.Context, userID uuid.UUID, notificationType *string, isRead *bool, page, pageSize int) ([]entity.Notification, int64, error)

	// 标记已读
	MarkAsRead(ctx context.Context, id uuid.UUID) error
	// 批量标记已读
	MarkAllAsRead(ctx context.Context, userID uuid.UUID, notificationType *string) error
	// 标记多个为已读
	MarkMultipleAsRead(ctx context.Context, userID uuid.UUID, ids []uuid.UUID) error

	// 删除通知
	Delete(ctx context.Context, id uuid.UUID) error
	// 批量删除通知
	DeleteByUserID(ctx context.Context, userID uuid.UUID, notificationType *string) error
	// 删除旧通知（超过指定天数）
	DeleteOld(ctx context.Context, days int) error

	// 统计
	GetUnreadCount(ctx context.Context, userID uuid.UUID) (int64, error)
	GetUnreadCountByType(ctx context.Context, userID uuid.UUID) (map[string]int64, error)
}

type notificationRepository struct {
	db *gorm.DB
}

// NewNotificationRepository 创建通知仓储实例
func NewNotificationRepository(db *gorm.DB) NotificationRepository {
	return &notificationRepository{db: db}
}

func (r *notificationRepository) Create(ctx context.Context, notification *entity.Notification) error {
	return r.db.WithContext(ctx).Create(notification).Error
}

func (r *notificationRepository) BatchCreate(ctx context.Context, notifications []*entity.Notification) error {
	if len(notifications) == 0 {
		return nil
	}
	return r.db.WithContext(ctx).Create(notifications).Error
}

func (r *notificationRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.Notification, error) {
	var notification entity.Notification
	err := r.db.WithContext(ctx).
		Preload("Actor").
		First(&notification, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &notification, nil
}

func (r *notificationRepository) GetByUserID(ctx context.Context, userID uuid.UUID, notificationType *string, isRead *bool, page, pageSize int) ([]entity.Notification, int64, error) {
	var notifications []entity.Notification
	var total int64

	query := r.db.WithContext(ctx).
		Model(&entity.Notification{}).
		Where("user_id = ?", userID)

	// 按类型筛选
	if notificationType != nil && *notificationType != "" {
		query = query.Where("type = ?", *notificationType)
	}

	// 按已读状态筛选
	if isRead != nil {
		query = query.Where("is_read = ?", *isRead)
	}

	// 计算总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 分页查询
	offset := (page - 1) * pageSize
	if err := r.db.WithContext(ctx).
		Preload("Actor").
		Where("user_id = ?", userID).
		Scopes(func(db *gorm.DB) *gorm.DB {
			if notificationType != nil && *notificationType != "" {
				db = db.Where("type = ?", *notificationType)
			}
			if isRead != nil {
				db = db.Where("is_read = ?", *isRead)
			}
			return db
		}).
		Order("created_at DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&notifications).Error; err != nil {
		return nil, 0, err
	}

	return notifications, total, nil
}

func (r *notificationRepository) MarkAsRead(ctx context.Context, id uuid.UUID) error {
	now := time.Now()
	return r.db.WithContext(ctx).
		Model(&entity.Notification{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"is_read": true,
			"read_at": now,
		}).Error
}

func (r *notificationRepository) MarkAllAsRead(ctx context.Context, userID uuid.UUID, notificationType *string) error {
	now := time.Now()
	query := r.db.WithContext(ctx).
		Model(&entity.Notification{}).
		Where("user_id = ? AND is_read = ?", userID, false)

	if notificationType != nil && *notificationType != "" {
		query = query.Where("type = ?", *notificationType)
	}

	return query.Updates(map[string]interface{}{
		"is_read": true,
		"read_at": now,
	}).Error
}

func (r *notificationRepository) MarkMultipleAsRead(ctx context.Context, userID uuid.UUID, ids []uuid.UUID) error {
	if len(ids) == 0 {
		return nil
	}
	now := time.Now()
	return r.db.WithContext(ctx).
		Model(&entity.Notification{}).
		Where("user_id = ? AND id IN ?", userID, ids).
		Updates(map[string]interface{}{
			"is_read": true,
			"read_at": now,
		}).Error
}

func (r *notificationRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).
		Delete(&entity.Notification{}, "id = ?", id).Error
}

func (r *notificationRepository) DeleteByUserID(ctx context.Context, userID uuid.UUID, notificationType *string) error {
	query := r.db.WithContext(ctx).
		Where("user_id = ?", userID)

	if notificationType != nil && *notificationType != "" {
		query = query.Where("type = ?", *notificationType)
	}

	return query.Delete(&entity.Notification{}).Error
}

func (r *notificationRepository) DeleteOld(ctx context.Context, days int) error {
	cutoff := time.Now().AddDate(0, 0, -days)
	return r.db.WithContext(ctx).
		Where("created_at < ? AND is_read = ?", cutoff, true).
		Delete(&entity.Notification{}).Error
}

func (r *notificationRepository) GetUnreadCount(ctx context.Context, userID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&entity.Notification{}).
		Where("user_id = ? AND is_read = ?", userID, false).
		Count(&count).Error
	return count, err
}

func (r *notificationRepository) GetUnreadCountByType(ctx context.Context, userID uuid.UUID) (map[string]int64, error) {
	type Result struct {
		Type  string
		Count int64
	}
	var results []Result

	err := r.db.WithContext(ctx).
		Model(&entity.Notification{}).
		Select("type, COUNT(*) as count").
		Where("user_id = ? AND is_read = ?", userID, false).
		Group("type").
		Find(&results).Error

	if err != nil {
		return nil, err
	}

	counts := make(map[string]int64)
	for _, r := range results {
		counts[r.Type] = r.Count
	}

	return counts, nil
}
