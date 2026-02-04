package repository

import (
	"context"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SupportTicketCommentRepository 工单评论仓储接口
type SupportTicketCommentRepository interface {
	ListByTicket(ctx context.Context, ticketID uuid.UUID) ([]entity.SupportTicketComment, error)
	Create(ctx context.Context, comment *entity.SupportTicketComment) error
}

type supportTicketCommentRepository struct {
	db *gorm.DB
}

// NewSupportTicketCommentRepository 创建工单评论仓储实例
func NewSupportTicketCommentRepository(db *gorm.DB) SupportTicketCommentRepository {
	return &supportTicketCommentRepository{db: db}
}

func (r *supportTicketCommentRepository) ListByTicket(ctx context.Context, ticketID uuid.UUID) ([]entity.SupportTicketComment, error) {
	var comments []entity.SupportTicketComment
	if err := r.db.WithContext(ctx).
		Where("ticket_id = ?", ticketID).
		Order("created_at ASC").
		Find(&comments).Error; err != nil {
		return nil, err
	}
	return comments, nil
}

func (r *supportTicketCommentRepository) Create(ctx context.Context, comment *entity.SupportTicketComment) error {
	return r.db.WithContext(ctx).Create(comment).Error
}
