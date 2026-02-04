package repository

import (
	"context"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SupportQueueMemberRepository 支持队列成员仓储接口
type SupportQueueMemberRepository interface {
	ListByQueue(ctx context.Context, queueID uuid.UUID) ([]entity.SupportQueueMember, error)
	Create(ctx context.Context, member *entity.SupportQueueMember) error
	Delete(ctx context.Context, queueID, userID uuid.UUID) error
}

type supportQueueMemberRepository struct {
	db *gorm.DB
}

// NewSupportQueueMemberRepository 创建支持队列成员仓储实例
func NewSupportQueueMemberRepository(db *gorm.DB) SupportQueueMemberRepository {
	return &supportQueueMemberRepository{db: db}
}

func (r *supportQueueMemberRepository) ListByQueue(ctx context.Context, queueID uuid.UUID) ([]entity.SupportQueueMember, error) {
	var members []entity.SupportQueueMember
	if err := r.db.WithContext(ctx).
		Where("queue_id = ?", queueID).
		Order("sort_order ASC, created_at ASC").
		Find(&members).Error; err != nil {
		return nil, err
	}
	return members, nil
}

func (r *supportQueueMemberRepository) Create(ctx context.Context, member *entity.SupportQueueMember) error {
	return r.db.WithContext(ctx).Create(member).Error
}

func (r *supportQueueMemberRepository) Delete(ctx context.Context, queueID, userID uuid.UUID) error {
	return r.db.WithContext(ctx).
		Where("queue_id = ? AND user_id = ?", queueID, userID).
		Delete(&entity.SupportQueueMember{}).Error
}
