package repository

import (
	"context"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AgentSessionRepository Agent 会话仓储接口
type AgentSessionRepository interface {
	Create(ctx context.Context, session *entity.AgentSession) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.AgentSession, error)
	Update(ctx context.Context, session *entity.AgentSession) error
	Delete(ctx context.Context, id uuid.UUID) error
	ListByWorkspace(ctx context.Context, workspaceID uuid.UUID, page, pageSize int) ([]entity.AgentSession, int64, error)
	ListByUser(ctx context.Context, userID uuid.UUID, page, pageSize int) ([]entity.AgentSession, int64, error)
}

// agentSessionRepository 实现
type agentSessionRepository struct {
	db *gorm.DB
}

func NewAgentSessionRepository(db *gorm.DB) AgentSessionRepository {
	return &agentSessionRepository{db: db}
}

func (r *agentSessionRepository) Create(ctx context.Context, session *entity.AgentSession) error {
	return r.db.WithContext(ctx).Create(session).Error
}

func (r *agentSessionRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.AgentSession, error) {
	var session entity.AgentSession
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&session).Error; err != nil {
		return nil, err
	}
	return &session, nil
}

func (r *agentSessionRepository) Update(ctx context.Context, session *entity.AgentSession) error {
	return r.db.WithContext(ctx).Save(session).Error
}

func (r *agentSessionRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&entity.AgentSession{}).Error
}

func (r *agentSessionRepository) ListByWorkspace(ctx context.Context, workspaceID uuid.UUID, page, pageSize int) ([]entity.AgentSession, int64, error) {
	var sessions []entity.AgentSession
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.AgentSession{}).Where("workspace_id = ?", workspaceID)
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	if err := query.Order("updated_at DESC").Offset(offset).Limit(pageSize).Find(&sessions).Error; err != nil {
		return nil, 0, err
	}
	return sessions, total, nil
}

func (r *agentSessionRepository) ListByUser(ctx context.Context, userID uuid.UUID, page, pageSize int) ([]entity.AgentSession, int64, error) {
	var sessions []entity.AgentSession
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.AgentSession{}).Where("user_id = ?", userID)
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	if err := query.Order("updated_at DESC").Offset(offset).Limit(pageSize).Find(&sessions).Error; err != nil {
		return nil, 0, err
	}
	return sessions, total, nil
}
