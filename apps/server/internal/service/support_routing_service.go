package service

import (
	"context"
	"errors"
	"strings"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SupportTeamInput 支持团队输入
type SupportTeamInput struct {
	Name        string
	Description *string
	Enabled     *bool
}

// SupportQueueInput 支持队列输入
type SupportQueueInput struct {
	Name        string
	Description *string
	Enabled     *bool
}

// SupportMemberInput 成员输入
type SupportMemberInput struct {
	UserID    uuid.UUID
	Role      *string
	SortOrder *int
}

// SupportRoutingService 支持分派对象服务
type SupportRoutingService interface {
	ResolveAssigneeUsers(ctx context.Context, assigneeType, assigneeValue string) ([]uuid.UUID, error)
	ListTeams(ctx context.Context, includeDisabled bool) ([]entity.SupportTeam, error)
	CreateTeam(ctx context.Context, input SupportTeamInput) (*entity.SupportTeam, error)
	UpdateTeam(ctx context.Context, id uuid.UUID, input SupportTeamInput) (*entity.SupportTeam, error)
	ListTeamMembers(ctx context.Context, teamID uuid.UUID) ([]entity.SupportTeamMember, error)
	AddTeamMember(ctx context.Context, teamID uuid.UUID, input SupportMemberInput) (*entity.SupportTeamMember, error)
	RemoveTeamMember(ctx context.Context, teamID, userID uuid.UUID) error
	ListQueues(ctx context.Context, includeDisabled bool) ([]entity.SupportQueue, error)
	CreateQueue(ctx context.Context, input SupportQueueInput) (*entity.SupportQueue, error)
	UpdateQueue(ctx context.Context, id uuid.UUID, input SupportQueueInput) (*entity.SupportQueue, error)
	ListQueueMembers(ctx context.Context, queueID uuid.UUID) ([]entity.SupportQueueMember, error)
	AddQueueMember(ctx context.Context, queueID uuid.UUID, input SupportMemberInput) (*entity.SupportQueueMember, error)
	RemoveQueueMember(ctx context.Context, queueID, userID uuid.UUID) error
}

type supportRoutingService struct {
	teamRepo       repository.SupportTeamRepository
	teamMemberRepo repository.SupportTeamMemberRepository
	queueRepo      repository.SupportQueueRepository
	queueMemberRepo repository.SupportQueueMemberRepository
}

// ErrSupportRoutingInvalid 参数不合法
var ErrSupportRoutingInvalid = errors.New("support routing invalid")

// ErrSupportTeamNotFound 团队不存在
var ErrSupportTeamNotFound = errors.New("support team not found")

// ErrSupportQueueNotFound 队列不存在
var ErrSupportQueueNotFound = errors.New("support queue not found")

// NewSupportRoutingService 创建支持分派对象服务
func NewSupportRoutingService(
	teamRepo repository.SupportTeamRepository,
	teamMemberRepo repository.SupportTeamMemberRepository,
	queueRepo repository.SupportQueueRepository,
	queueMemberRepo repository.SupportQueueMemberRepository,
) SupportRoutingService {
	return &supportRoutingService{
		teamRepo:       teamRepo,
		teamMemberRepo: teamMemberRepo,
		queueRepo:      queueRepo,
		queueMemberRepo: queueMemberRepo,
	}
}

func (s *supportRoutingService) ResolveAssigneeUsers(ctx context.Context, assigneeType, assigneeValue string) ([]uuid.UUID, error) {
	normalizedType := strings.ToLower(strings.TrimSpace(assigneeType))
	value := strings.TrimSpace(assigneeValue)
	if normalizedType == "" || value == "" {
		return []uuid.UUID{}, nil
	}
	switch normalizedType {
	case "user":
		userID, err := uuid.Parse(value)
		if err != nil {
			return []uuid.UUID{}, nil
		}
		return []uuid.UUID{userID}, nil
	case "team":
		teamID, err := uuid.Parse(value)
		if err != nil {
			return []uuid.UUID{}, nil
		}
		members, err := s.teamMemberRepo.ListByTeam(ctx, teamID)
		if err != nil {
			return []uuid.UUID{}, err
		}
		return extractMemberUserIDs(members), nil
	case "queue":
		queueID, err := uuid.Parse(value)
		if err != nil {
			return []uuid.UUID{}, nil
		}
		members, err := s.queueMemberRepo.ListByQueue(ctx, queueID)
		if err != nil {
			return []uuid.UUID{}, err
		}
		return extractQueueMemberUserIDs(members), nil
	default:
		return []uuid.UUID{}, nil
	}
}

func (s *supportRoutingService) ListTeams(ctx context.Context, includeDisabled bool) ([]entity.SupportTeam, error) {
	return s.teamRepo.List(ctx, includeDisabled)
}

func (s *supportRoutingService) CreateTeam(ctx context.Context, input SupportTeamInput) (*entity.SupportTeam, error) {
	name := strings.TrimSpace(input.Name)
	if name == "" {
		return nil, ErrSupportRoutingInvalid
	}
	team := &entity.SupportTeam{
		Name:        name,
		Description: normalizeOptionalText(input.Description),
		Enabled:     normalizeOptionalBool(input.Enabled, true),
	}
	if err := s.teamRepo.Create(ctx, team); err != nil {
		return nil, err
	}
	return team, nil
}

func (s *supportRoutingService) UpdateTeam(ctx context.Context, id uuid.UUID, input SupportTeamInput) (*entity.SupportTeam, error) {
	team, err := s.teamRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrSupportTeamNotFound
		}
		return nil, err
	}
	if strings.TrimSpace(input.Name) != "" {
		team.Name = strings.TrimSpace(input.Name)
	}
	if input.Description != nil {
		team.Description = normalizeOptionalText(input.Description)
	}
	if input.Enabled != nil {
		team.Enabled = *input.Enabled
	}
	if err := s.teamRepo.Update(ctx, team); err != nil {
		return nil, err
	}
	return team, nil
}

func (s *supportRoutingService) ListTeamMembers(ctx context.Context, teamID uuid.UUID) ([]entity.SupportTeamMember, error) {
	return s.teamMemberRepo.ListByTeam(ctx, teamID)
}

func (s *supportRoutingService) AddTeamMember(ctx context.Context, teamID uuid.UUID, input SupportMemberInput) (*entity.SupportTeamMember, error) {
	if teamID == uuid.Nil || input.UserID == uuid.Nil {
		return nil, ErrSupportRoutingInvalid
	}
	member := &entity.SupportTeamMember{
		TeamID:    teamID,
		UserID:    input.UserID,
		Role:      normalizeOptionalText(input.Role),
		SortOrder: normalizeOptionalInt(input.SortOrder, 0),
	}
	if err := s.teamMemberRepo.Create(ctx, member); err != nil {
		return nil, err
	}
	return member, nil
}

func (s *supportRoutingService) RemoveTeamMember(ctx context.Context, teamID, userID uuid.UUID) error {
	return s.teamMemberRepo.Delete(ctx, teamID, userID)
}

func (s *supportRoutingService) ListQueues(ctx context.Context, includeDisabled bool) ([]entity.SupportQueue, error) {
	return s.queueRepo.List(ctx, includeDisabled)
}

func (s *supportRoutingService) CreateQueue(ctx context.Context, input SupportQueueInput) (*entity.SupportQueue, error) {
	name := strings.TrimSpace(input.Name)
	if name == "" {
		return nil, ErrSupportRoutingInvalid
	}
	queue := &entity.SupportQueue{
		Name:        name,
		Description: normalizeOptionalText(input.Description),
		Enabled:     normalizeOptionalBool(input.Enabled, true),
	}
	if err := s.queueRepo.Create(ctx, queue); err != nil {
		return nil, err
	}
	return queue, nil
}

func (s *supportRoutingService) UpdateQueue(ctx context.Context, id uuid.UUID, input SupportQueueInput) (*entity.SupportQueue, error) {
	queue, err := s.queueRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrSupportQueueNotFound
		}
		return nil, err
	}
	if strings.TrimSpace(input.Name) != "" {
		queue.Name = strings.TrimSpace(input.Name)
	}
	if input.Description != nil {
		queue.Description = normalizeOptionalText(input.Description)
	}
	if input.Enabled != nil {
		queue.Enabled = *input.Enabled
	}
	if err := s.queueRepo.Update(ctx, queue); err != nil {
		return nil, err
	}
	return queue, nil
}

func (s *supportRoutingService) ListQueueMembers(ctx context.Context, queueID uuid.UUID) ([]entity.SupportQueueMember, error) {
	return s.queueMemberRepo.ListByQueue(ctx, queueID)
}

func (s *supportRoutingService) AddQueueMember(ctx context.Context, queueID uuid.UUID, input SupportMemberInput) (*entity.SupportQueueMember, error) {
	if queueID == uuid.Nil || input.UserID == uuid.Nil {
		return nil, ErrSupportRoutingInvalid
	}
	member := &entity.SupportQueueMember{
		QueueID:   queueID,
		UserID:    input.UserID,
		SortOrder: normalizeOptionalInt(input.SortOrder, 0),
	}
	if err := s.queueMemberRepo.Create(ctx, member); err != nil {
		return nil, err
	}
	return member, nil
}

func (s *supportRoutingService) RemoveQueueMember(ctx context.Context, queueID, userID uuid.UUID) error {
	return s.queueMemberRepo.Delete(ctx, queueID, userID)
}

func extractMemberUserIDs(members []entity.SupportTeamMember) []uuid.UUID {
	result := make([]uuid.UUID, 0, len(members))
	for _, member := range members {
		if member.UserID == uuid.Nil {
			continue
		}
		result = append(result, member.UserID)
	}
	return result
}

func extractQueueMemberUserIDs(members []entity.SupportQueueMember) []uuid.UUID {
	result := make([]uuid.UUID, 0, len(members))
	for _, member := range members {
		if member.UserID == uuid.Nil {
			continue
		}
		result = append(result, member.UserID)
	}
	return result
}
