package repository

import (
	"context"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AppSessionRepository App 会话仓储接口
type AppSessionRepository interface {
	Create(ctx context.Context, session *entity.AppSession) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.AppSession, error)
	GetValidByID(ctx context.Context, id uuid.UUID) (*entity.AppSession, error)
	UpdateExpiry(ctx context.Context, id uuid.UUID, expiredAt time.Time) error
	Block(ctx context.Context, id uuid.UUID, reason string, blockedAt time.Time) error
	DeleteAnonymousBefore(ctx context.Context, before time.Time) (int64, error)
}

type appSessionRepository struct {
	db *gorm.DB
}

// NewAppSessionRepository 创建 App 会话仓储实例
func NewAppSessionRepository(db *gorm.DB) AppSessionRepository {
	return &appSessionRepository{db: db}
}

func (r *appSessionRepository) Create(ctx context.Context, session *entity.AppSession) error {
	if session.ID == uuid.Nil {
		session.ID = uuid.New()
	}
	if session.CreatedAt.IsZero() {
		session.CreatedAt = time.Now()
	}
	return r.db.WithContext(ctx).Create(session).Error
}

func (r *appSessionRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.AppSession, error) {
	var session entity.AppSession
	if err := r.db.WithContext(ctx).
		Where("id = ?", id).
		First(&session).Error; err != nil {
		return nil, err
	}
	return &session, nil
}

func (r *appSessionRepository) GetValidByID(ctx context.Context, id uuid.UUID) (*entity.AppSession, error) {
	var session entity.AppSession
	if err := r.db.WithContext(ctx).
		Where("id = ? AND blocked_at IS NULL AND (expired_at IS NULL OR expired_at > ?)", id, time.Now()).
		First(&session).Error; err != nil {
		return nil, err
	}
	return &session, nil
}

func (r *appSessionRepository) UpdateExpiry(ctx context.Context, id uuid.UUID, expiredAt time.Time) error {
	return r.db.WithContext(ctx).
		Model(&entity.AppSession{}).
		Where("id = ?", id).
		Update("expired_at", expiredAt).Error
}

func (r *appSessionRepository) Block(ctx context.Context, id uuid.UUID, reason string, blockedAt time.Time) error {
	return r.db.WithContext(ctx).
		Model(&entity.AppSession{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"blocked_at":     blockedAt,
			"blocked_reason": reason,
		}).Error
}

func (r *appSessionRepository) DeleteAnonymousBefore(ctx context.Context, before time.Time) (int64, error) {
	result := r.db.WithContext(ctx).
		Where("session_type = ? AND COALESCE(expired_at, created_at) < ?", "anon", before).
		Delete(&entity.AppSession{})
	return result.RowsAffected, result.Error
}
