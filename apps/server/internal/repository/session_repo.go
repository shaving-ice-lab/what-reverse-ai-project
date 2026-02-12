package repository

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"time"

	"github.com/google/uuid"
	"github.com/reverseai/server/internal/domain/entity"
	"gorm.io/gorm"
)

// SessionRepository 会话仓储接口
type SessionRepository interface {
	Create(ctx context.Context, session *entity.UserSession) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.UserSession, error)
	GetByToken(ctx context.Context, tokenHash string) (*entity.UserSession, error)
	ListByUser(ctx context.Context, userID uuid.UUID) ([]entity.UserSession, error)
	UpdateLastActive(ctx context.Context, id uuid.UUID) error
	Deactivate(ctx context.Context, id uuid.UUID) error
	DeactivateAllExcept(ctx context.Context, userID uuid.UUID, exceptID uuid.UUID) error
	DeactivateAll(ctx context.Context, userID uuid.UUID) error
	DeleteExpired(ctx context.Context) error
	HashToken(token string) string
}

type sessionRepository struct {
	db *gorm.DB
}

// NewSessionRepository 创建会话仓储实例
func NewSessionRepository(db *gorm.DB) SessionRepository {
	return &sessionRepository{db: db}
}

func (r *sessionRepository) Create(ctx context.Context, session *entity.UserSession) error {
	if session.ID == uuid.Nil {
		session.ID = uuid.New()
	}
	session.CreatedAt = time.Now()
	session.LastActiveAt = time.Now()
	session.IsActive = true
	return r.db.WithContext(ctx).Create(session).Error
}

func (r *sessionRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.UserSession, error) {
	var session entity.UserSession
	if err := r.db.WithContext(ctx).
		Where("id = ? AND is_active = ?", id, true).
		First(&session).Error; err != nil {
		return nil, err
	}
	return &session, nil
}

func (r *sessionRepository) GetByToken(ctx context.Context, tokenHash string) (*entity.UserSession, error) {
	var session entity.UserSession
	if err := r.db.WithContext(ctx).
		Where("token_hash = ? AND is_active = ? AND expires_at > ?", tokenHash, true, time.Now()).
		First(&session).Error; err != nil {
		return nil, err
	}
	return &session, nil
}

func (r *sessionRepository) ListByUser(ctx context.Context, userID uuid.UUID) ([]entity.UserSession, error) {
	var sessions []entity.UserSession
	if err := r.db.WithContext(ctx).
		Where("user_id = ? AND is_active = ? AND expires_at > ?", userID, true, time.Now()).
		Order("last_active_at DESC").
		Find(&sessions).Error; err != nil {
		return nil, err
	}
	return sessions, nil
}

func (r *sessionRepository) UpdateLastActive(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).
		Model(&entity.UserSession{}).
		Where("id = ?", id).
		Update("last_active_at", time.Now()).Error
}

func (r *sessionRepository) Deactivate(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).
		Model(&entity.UserSession{}).
		Where("id = ?", id).
		Update("is_active", false).Error
}

func (r *sessionRepository) DeactivateAllExcept(ctx context.Context, userID uuid.UUID, exceptID uuid.UUID) error {
	return r.db.WithContext(ctx).
		Model(&entity.UserSession{}).
		Where("user_id = ? AND id != ?", userID, exceptID).
		Update("is_active", false).Error
}

func (r *sessionRepository) DeactivateAll(ctx context.Context, userID uuid.UUID) error {
	return r.db.WithContext(ctx).
		Model(&entity.UserSession{}).
		Where("user_id = ?", userID).
		Update("is_active", false).Error
}

func (r *sessionRepository) DeleteExpired(ctx context.Context) error {
	return r.db.WithContext(ctx).
		Where("expires_at < ?", time.Now()).
		Delete(&entity.UserSession{}).Error
}

func (r *sessionRepository) HashToken(token string) string {
	hash := sha256.Sum256([]byte(token))
	return hex.EncodeToString(hash[:])
}
