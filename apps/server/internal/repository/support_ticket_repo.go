package repository

import (
	"context"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SupportTicketRepository 客户支持工单仓储接口
type SupportTicketRepository interface {
	Create(ctx context.Context, ticket *entity.SupportTicket) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.SupportTicket, error)
	List(ctx context.Context, params SupportTicketListParams) ([]entity.SupportTicket, int64, error)
	Update(ctx context.Context, ticket *entity.SupportTicket) error
}

type supportTicketRepository struct {
	db *gorm.DB
}

// SupportTicketListParams 工单列表查询参数
type SupportTicketListParams struct {
	Status      string
	Priority    string
	Category    string
	Search      string
	WorkspaceID *uuid.UUID
	Page        int
	PageSize    int
}

// NewSupportTicketRepository 创建客户支持工单仓储实例
func NewSupportTicketRepository(db *gorm.DB) SupportTicketRepository {
	return &supportTicketRepository{db: db}
}

func (r *supportTicketRepository) Create(ctx context.Context, ticket *entity.SupportTicket) error {
	if ticket.ID == uuid.Nil {
		ticket.ID = uuid.New()
	}
	if ticket.CreatedAt.IsZero() {
		ticket.CreatedAt = time.Now()
	}
	if ticket.UpdatedAt.IsZero() {
		ticket.UpdatedAt = ticket.CreatedAt
	}
	return r.db.WithContext(ctx).Create(ticket).Error
}

func (r *supportTicketRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.SupportTicket, error) {
	var ticket entity.SupportTicket
	if err := r.db.WithContext(ctx).First(&ticket, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &ticket, nil
}

func (r *supportTicketRepository) List(ctx context.Context, params SupportTicketListParams) ([]entity.SupportTicket, int64, error) {
	var tickets []entity.SupportTicket
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.SupportTicket{})

	if params.Status != "" {
		query = query.Where("status = ?", params.Status)
	}
	if params.Priority != "" {
		query = query.Where("priority = ?", params.Priority)
	}
	if params.Category != "" {
		query = query.Where("category = ?", params.Category)
	}
	if params.WorkspaceID != nil && *params.WorkspaceID != uuid.Nil {
		query = query.Where("workspace_id = ?", *params.WorkspaceID)
	}
	if params.Search != "" {
		like := "%" + params.Search + "%"
		query = query.Where(
			"reference LIKE ? OR subject LIKE ? OR requester_email LIKE ?",
			like,
			like,
			like,
		)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	page := params.Page
	pageSize := params.PageSize
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	if err := query.Order("created_at DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&tickets).Error; err != nil {
		return nil, 0, err
	}

	return tickets, total, nil
}

func (r *supportTicketRepository) Update(ctx context.Context, ticket *entity.SupportTicket) error {
	if ticket == nil {
		return nil
	}
	return r.db.WithContext(ctx).Save(ticket).Error
}
