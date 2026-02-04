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

// SupportChannelInput 支持渠道输入
type SupportChannelInput struct {
	Key         string
	Name        string
	Description *string
	Contact     *string
	SLAOverrides map[string]int
	Enabled     *bool
	SortOrder   *int
}

// SupportAssignmentRuleInput 分派规则输入
type SupportAssignmentRuleInput struct {
	Name          string
	Priority      string
	Category      string
	Channel       string
	Keyword       string
	AssigneeType  string
	AssigneeValue string
	Enabled       *bool
	SortOrder     *int
}

// SupportSettingsService 支持渠道与分派规则服务
type SupportSettingsService interface {
	ListChannels(ctx context.Context, includeDisabled bool) ([]entity.SupportChannel, error)
	CreateChannel(ctx context.Context, input SupportChannelInput) (*entity.SupportChannel, error)
	UpdateChannel(ctx context.Context, id uuid.UUID, input SupportChannelInput) (*entity.SupportChannel, error)
	ListRules(ctx context.Context, includeDisabled bool) ([]entity.SupportAssignmentRule, error)
	CreateRule(ctx context.Context, input SupportAssignmentRuleInput) (*entity.SupportAssignmentRule, error)
	UpdateRule(ctx context.Context, id uuid.UUID, input SupportAssignmentRuleInput) (*entity.SupportAssignmentRule, error)
}

type supportSettingsService struct {
	channelRepo repository.SupportChannelRepository
	ruleRepo    repository.SupportAssignmentRuleRepository
}

// ErrSupportChannelNotFound 支持渠道不存在
var ErrSupportChannelNotFound = errors.New("support channel not found")

// ErrSupportAssignmentRuleNotFound 分派规则不存在
var ErrSupportAssignmentRuleNotFound = errors.New("support assignment rule not found")

// ErrSupportSettingsInvalid 配置参数不合法
var ErrSupportSettingsInvalid = errors.New("support settings invalid")

// NewSupportSettingsService 创建支持渠道与分派规则服务
func NewSupportSettingsService(
	channelRepo repository.SupportChannelRepository,
	ruleRepo repository.SupportAssignmentRuleRepository,
) SupportSettingsService {
	return &supportSettingsService{
		channelRepo: channelRepo,
		ruleRepo:    ruleRepo,
	}
}

func (s *supportSettingsService) ListChannels(ctx context.Context, includeDisabled bool) ([]entity.SupportChannel, error) {
	if s == nil || s.channelRepo == nil {
		return []entity.SupportChannel{}, nil
	}
	return s.channelRepo.List(ctx, includeDisabled)
}

func (s *supportSettingsService) CreateChannel(ctx context.Context, input SupportChannelInput) (*entity.SupportChannel, error) {
	if s == nil || s.channelRepo == nil {
		return nil, ErrSupportSettingsInvalid
	}
	key := strings.ToLower(strings.TrimSpace(input.Key))
	name := strings.TrimSpace(input.Name)
	if key == "" || name == "" {
		return nil, ErrSupportSettingsInvalid
	}
	channel := &entity.SupportChannel{
		Key:         key,
		Name:        name,
		Description: normalizeOptionalText(input.Description),
		Contact:     normalizeOptionalText(input.Contact),
		SLAOverrides: normalizeSLAOverrides(input.SLAOverrides),
		Enabled:     normalizeOptionalBool(input.Enabled, true),
		SortOrder:   normalizeOptionalInt(input.SortOrder, 0),
	}
	if err := s.channelRepo.Create(ctx, channel); err != nil {
		return nil, err
	}
	return channel, nil
}

func (s *supportSettingsService) UpdateChannel(ctx context.Context, id uuid.UUID, input SupportChannelInput) (*entity.SupportChannel, error) {
	if s == nil || s.channelRepo == nil {
		return nil, ErrSupportSettingsInvalid
	}
	channel, err := s.channelRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrSupportChannelNotFound
		}
		return nil, err
	}
	if strings.TrimSpace(input.Key) != "" {
		channel.Key = strings.ToLower(strings.TrimSpace(input.Key))
	}
	if strings.TrimSpace(input.Name) != "" {
		channel.Name = strings.TrimSpace(input.Name)
	}
	if input.Description != nil {
		channel.Description = normalizeOptionalText(input.Description)
	}
	if input.Contact != nil {
		channel.Contact = normalizeOptionalText(input.Contact)
	}
	if input.SLAOverrides != nil {
		channel.SLAOverrides = normalizeSLAOverrides(input.SLAOverrides)
	}
	if input.Enabled != nil {
		channel.Enabled = *input.Enabled
	}
	if input.SortOrder != nil {
		channel.SortOrder = *input.SortOrder
	}
	if err := s.channelRepo.Update(ctx, channel); err != nil {
		return nil, err
	}
	return channel, nil
}

func (s *supportSettingsService) ListRules(ctx context.Context, includeDisabled bool) ([]entity.SupportAssignmentRule, error) {
	if s == nil || s.ruleRepo == nil {
		return []entity.SupportAssignmentRule{}, nil
	}
	return s.ruleRepo.List(ctx, includeDisabled)
}

func (s *supportSettingsService) CreateRule(ctx context.Context, input SupportAssignmentRuleInput) (*entity.SupportAssignmentRule, error) {
	if s == nil || s.ruleRepo == nil {
		return nil, ErrSupportSettingsInvalid
	}
	name := strings.TrimSpace(input.Name)
	assigneeValue := strings.TrimSpace(input.AssigneeValue)
	if name == "" || assigneeValue == "" {
		return nil, ErrSupportSettingsInvalid
	}
	rule := &entity.SupportAssignmentRule{
		Name:          name,
		Priority:      strings.ToLower(strings.TrimSpace(input.Priority)),
		Category:      strings.ToLower(strings.TrimSpace(input.Category)),
		Channel:       strings.ToLower(strings.TrimSpace(input.Channel)),
		Keyword:       strings.TrimSpace(input.Keyword),
		AssigneeType:  normalizeAssigneeType(input.AssigneeType),
		AssigneeValue: assigneeValue,
		Enabled:       normalizeOptionalBool(input.Enabled, true),
		SortOrder:     normalizeOptionalInt(input.SortOrder, 0),
	}
	if err := s.ruleRepo.Create(ctx, rule); err != nil {
		return nil, err
	}
	return rule, nil
}

func (s *supportSettingsService) UpdateRule(ctx context.Context, id uuid.UUID, input SupportAssignmentRuleInput) (*entity.SupportAssignmentRule, error) {
	if s == nil || s.ruleRepo == nil {
		return nil, ErrSupportSettingsInvalid
	}
	rule, err := s.ruleRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrSupportAssignmentRuleNotFound
		}
		return nil, err
	}
	if strings.TrimSpace(input.Name) != "" {
		rule.Name = strings.TrimSpace(input.Name)
	}
	if input.Priority != "" {
		rule.Priority = strings.ToLower(strings.TrimSpace(input.Priority))
	}
	if input.Category != "" {
		rule.Category = strings.ToLower(strings.TrimSpace(input.Category))
	}
	if input.Channel != "" {
		rule.Channel = strings.ToLower(strings.TrimSpace(input.Channel))
	}
	if input.Keyword != "" {
		rule.Keyword = strings.TrimSpace(input.Keyword)
	}
	if input.AssigneeType != "" {
		rule.AssigneeType = normalizeAssigneeType(input.AssigneeType)
	}
	if input.AssigneeValue != "" {
		rule.AssigneeValue = strings.TrimSpace(input.AssigneeValue)
	}
	if input.Enabled != nil {
		rule.Enabled = *input.Enabled
	}
	if input.SortOrder != nil {
		rule.SortOrder = *input.SortOrder
	}
	if err := s.ruleRepo.Update(ctx, rule); err != nil {
		return nil, err
	}
	return rule, nil
}

func normalizeOptionalText(value *string) *string {
	if value == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}

func normalizeOptionalBool(value *bool, fallback bool) bool {
	if value == nil {
		return fallback
	}
	return *value
}

func normalizeOptionalInt(value *int, fallback int) int {
	if value == nil {
		return fallback
	}
	return *value
}

func normalizeAssigneeType(value string) string {
	normalized := strings.ToLower(strings.TrimSpace(value))
	switch normalized {
	case "team", "user", "queue":
		return normalized
	default:
		return "team"
	}
}

func normalizeSLAOverrides(overrides map[string]int) entity.JSON {
	if overrides == nil {
		return nil
	}
	output := entity.JSON{}
	for key, value := range overrides {
		normalized := strings.ToLower(strings.TrimSpace(key))
		if normalized == "" || value <= 0 {
			continue
		}
		output[normalized] = value
	}
	if len(output) == 0 {
		return nil
	}
	return output
}
