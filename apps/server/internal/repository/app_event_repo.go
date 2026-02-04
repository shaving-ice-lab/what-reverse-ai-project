package repository

import (
	"context"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AppEventRepository App 事件仓储接口
type AppEventRepository interface {
	Create(ctx context.Context, event *entity.AppEvent) error
	CountRecentByAppAndIPHash(ctx context.Context, appID uuid.UUID, ipHash string, since time.Time, eventTypes []string) (int64, error)
	CountRecentByAppAndSessionID(ctx context.Context, appID uuid.UUID, sessionID uuid.UUID, since time.Time, eventTypes []string) (int64, error)
	CountRecentByApp(ctx context.Context, appID uuid.UUID, since time.Time, eventTypes []string) (int64, error)
}

type appEventRepository struct {
	db *gorm.DB
}

// NewAppEventRepository 创建 App 事件仓储实例
func NewAppEventRepository(db *gorm.DB) AppEventRepository {
	return &appEventRepository{db: db}
}

func (r *appEventRepository) Create(ctx context.Context, event *entity.AppEvent) error {
	if event.ID == uuid.Nil {
		event.ID = uuid.New()
	}
	if event.CreatedAt.IsZero() {
		event.CreatedAt = time.Now()
	}
	return r.db.WithContext(ctx).Create(event).Error
}

func (r *appEventRepository) CountRecentByAppAndIPHash(ctx context.Context, appID uuid.UUID, ipHash string, since time.Time, eventTypes []string) (int64, error) {
	var count int64

	query := r.db.WithContext(ctx).
		Table(entity.AppEvent{}.TableName()).
		Joins("JOIN "+entity.AppSession{}.TableName()+" ON "+entity.AppSession{}.TableName()+".id = "+entity.AppEvent{}.TableName()+".session_id").
		Where(entity.AppEvent{}.TableName()+".app_id = ?", appID).
		Where(entity.AppSession{}.TableName()+".ip_hash = ?", ipHash).
		Where(entity.AppEvent{}.TableName()+".created_at >= ?", since)

	if len(eventTypes) > 0 {
		query = query.Where(entity.AppEvent{}.TableName()+".event_type IN ?", eventTypes)
	}

	if err := query.Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (r *appEventRepository) CountRecentByAppAndSessionID(ctx context.Context, appID uuid.UUID, sessionID uuid.UUID, since time.Time, eventTypes []string) (int64, error) {
	var count int64

	query := r.db.WithContext(ctx).
		Table(entity.AppEvent{}.TableName()).
		Where(entity.AppEvent{}.TableName()+".app_id = ?", appID).
		Where(entity.AppEvent{}.TableName()+".session_id = ?", sessionID).
		Where(entity.AppEvent{}.TableName()+".created_at >= ?", since)

	if len(eventTypes) > 0 {
		query = query.Where(entity.AppEvent{}.TableName()+".event_type IN ?", eventTypes)
	}

	if err := query.Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (r *appEventRepository) CountRecentByApp(ctx context.Context, appID uuid.UUID, since time.Time, eventTypes []string) (int64, error) {
	var count int64

	query := r.db.WithContext(ctx).
		Table(entity.AppEvent{}.TableName()).
		Where(entity.AppEvent{}.TableName()+".app_id = ?", appID).
		Where(entity.AppEvent{}.TableName()+".created_at >= ?", since)

	if len(eventTypes) > 0 {
		query = query.Where(entity.AppEvent{}.TableName()+".event_type IN ?", eventTypes)
	}

	if err := query.Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}
