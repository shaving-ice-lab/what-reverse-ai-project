package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
)

// CreateSupportTicketCommentInput 创建工单评论入参
type CreateSupportTicketCommentInput struct {
	TicketID    uuid.UUID
	AuthorUserID *uuid.UUID
	AuthorName  string
	Body        string
	IsInternal  bool
}

// SupportTicketCommentService 工单评论服务接口
type SupportTicketCommentService interface {
	ListByTicket(ctx context.Context, ticketID uuid.UUID) ([]entity.SupportTicketComment, error)
	Create(ctx context.Context, input CreateSupportTicketCommentInput) (*entity.SupportTicketComment, error)
}

type supportTicketCommentService struct {
	repo repository.SupportTicketCommentRepository
	ticketRepo repository.SupportTicketRepository
	notificationService NotificationService
	routingService SupportRoutingService
	templateService SupportNotificationTemplateService
}

// ErrSupportTicketCommentInvalid 评论参数不合法
var ErrSupportTicketCommentInvalid = errors.New("support ticket comment invalid")

// NewSupportTicketCommentService 创建工单评论服务
func NewSupportTicketCommentService(
	repo repository.SupportTicketCommentRepository,
	ticketRepo repository.SupportTicketRepository,
	notificationService NotificationService,
	routingService SupportRoutingService,
	templateService SupportNotificationTemplateService,
) SupportTicketCommentService {
	return &supportTicketCommentService{
		repo:                repo,
		ticketRepo:          ticketRepo,
		notificationService: notificationService,
		routingService:      routingService,
		templateService:     templateService,
	}
}

func (s *supportTicketCommentService) ListByTicket(ctx context.Context, ticketID uuid.UUID) ([]entity.SupportTicketComment, error) {
	if s == nil || s.repo == nil {
		return []entity.SupportTicketComment{}, nil
	}
	if ticketID == uuid.Nil {
		return []entity.SupportTicketComment{}, nil
	}
	return s.repo.ListByTicket(ctx, ticketID)
}

func (s *supportTicketCommentService) Create(ctx context.Context, input CreateSupportTicketCommentInput) (*entity.SupportTicketComment, error) {
	if s == nil || s.repo == nil {
		return nil, ErrSupportTicketCommentInvalid
	}
	if input.TicketID == uuid.Nil {
		return nil, ErrSupportTicketCommentInvalid
	}
	body := strings.TrimSpace(input.Body)
	if body == "" {
		return nil, ErrSupportTicketCommentInvalid
	}
	var authorName *string
	if strings.TrimSpace(input.AuthorName) != "" {
		name := strings.TrimSpace(input.AuthorName)
		authorName = &name
	}
	comment := &entity.SupportTicketComment{
		TicketID:     input.TicketID,
		AuthorUserID: input.AuthorUserID,
		AuthorName:   authorName,
		Body:         body,
		IsInternal:   input.IsInternal,
		CreatedAt:    time.Now(),
	}
	if err := s.repo.Create(ctx, comment); err != nil {
		return nil, err
	}
	if s.ticketRepo != nil {
		if ticket, err := s.ticketRepo.GetByID(ctx, input.TicketID); err == nil {
			s.notifyComment(ctx, ticket, comment)
		}
	}
	return comment, nil
}

func (s *supportTicketCommentService) notifyComment(ctx context.Context, ticket *entity.SupportTicket, comment *entity.SupportTicketComment) {
	if s == nil || s.notificationService == nil || ticket == nil || comment == nil {
		return
	}
	recipients := map[uuid.UUID]struct{}{}
	if ticket.RequesterUserID != nil && !comment.IsInternal {
		recipients[*ticket.RequesterUserID] = struct{}{}
	}
	for _, userID := range s.resolveAssigneeUsers(ctx, ticket) {
		recipients[userID] = struct{}{}
	}
	if comment.AuthorUserID != nil {
		delete(recipients, *comment.AuthorUserID)
	}
	if len(recipients) == 0 {
		return
	}
	title := "工单新增评论"
	content := fmt.Sprintf("工单 %s 有新评论：%s", ticket.Reference, summarizeComment(comment.Body, 80))
	if s.templateService != nil {
		rendered := s.templateService.RenderFor(
			ctx,
			"system",
			extractNotificationLocale(ticket),
			NotificationTemplateCommentAdded,
			map[string]string{
				"reference": ticket.Reference,
				"subject":   ticket.Subject,
				"comment":   summarizeComment(comment.Body, 120),
			},
		)
		if strings.TrimSpace(rendered.Title) != "" {
			title = rendered.Title
		}
		if strings.TrimSpace(rendered.Content) != "" {
			content = rendered.Content
		}
	}
	for userID := range recipients {
		_ = s.notificationService.SendSystemNotification(ctx, userID, title, content)
	}
}

func (s *supportTicketCommentService) resolveAssigneeUsers(ctx context.Context, ticket *entity.SupportTicket) []uuid.UUID {
	if ticket == nil || ticket.AssigneeType == nil || ticket.AssigneeValue == nil {
		return []uuid.UUID{}
	}
	if s.routingService == nil {
		return []uuid.UUID{}
	}
	users, err := s.routingService.ResolveAssigneeUsers(ctx, *ticket.AssigneeType, *ticket.AssigneeValue)
	if err != nil {
		return []uuid.UUID{}
	}
	return users
}

func summarizeComment(value string, maxLen int) string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return "（无内容）"
	}
	if maxLen <= 0 || len([]rune(trimmed)) <= maxLen {
		return trimmed
	}
	runes := []rune(trimmed)
	return string(runes[:maxLen]) + "..."
}
