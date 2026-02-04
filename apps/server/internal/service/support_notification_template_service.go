package service

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

const supportNotificationTemplateKey = "default"
const defaultNotificationChannel = "system"
const defaultNotificationLocale = "zh-CN"

// NotificationTemplateKey 模板类型
type NotificationTemplateKey string

const (
	NotificationTemplateTicketCreated NotificationTemplateKey = "ticket_created"
	NotificationTemplateStatusUpdated NotificationTemplateKey = "status_updated"
	NotificationTemplateCommentAdded  NotificationTemplateKey = "comment_added"
)

// NotificationTemplate 通知模板
type NotificationTemplate struct {
	Title   string `json:"title"`
	Content string `json:"content"`
}

// SupportNotificationTemplates 支持通知模板集合
type SupportNotificationTemplates struct {
	TicketCreated NotificationTemplate `json:"ticket_created"`
	StatusUpdated NotificationTemplate `json:"status_updated"`
	CommentAdded  NotificationTemplate `json:"comment_added"`
}

// SupportNotificationTemplateConfig 支持通知模板配置（多渠道/多语言）
type SupportNotificationTemplateConfig struct {
	DefaultChannel string                                                            `json:"default_channel"`
	DefaultLocale  string                                                            `json:"default_locale"`
	Channels       map[string]map[string]SupportNotificationTemplates `json:"channels"`
}

// SupportNotificationTemplateService 支持通知模板服务
type SupportNotificationTemplateService interface {
	GetConfig(ctx context.Context) (*SupportNotificationTemplateConfig, error)
	UpsertConfig(ctx context.Context, config SupportNotificationTemplateConfig) (*SupportNotificationTemplateConfig, error)
	Render(template NotificationTemplate, values map[string]string) NotificationTemplate
	RenderFor(ctx context.Context, channel, locale string, key NotificationTemplateKey, values map[string]string) NotificationTemplate
}

type supportNotificationTemplateService struct {
	repo repository.SupportNotificationTemplateRepository
}

// ErrSupportNotificationTemplateInvalid 通知模板非法
var ErrSupportNotificationTemplateInvalid = errors.New("support notification template invalid")

// NewSupportNotificationTemplateService 创建通知模板服务
func NewSupportNotificationTemplateService(repo repository.SupportNotificationTemplateRepository) SupportNotificationTemplateService {
	return &supportNotificationTemplateService{repo: repo}
}

func (s *supportNotificationTemplateService) GetConfig(ctx context.Context) (*SupportNotificationTemplateConfig, error) {
	if s == nil || s.repo == nil {
		defaults := defaultSupportNotificationTemplateConfig()
		return &defaults, nil
	}
	template, err := s.repo.GetByKey(ctx, supportNotificationTemplateKey)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			defaults := defaultSupportNotificationTemplateConfig()
			return &defaults, nil
		}
		return nil, err
	}
	decoded := defaultSupportNotificationTemplateConfig()
	if template != nil && template.Template != nil {
		if err := decodeSupportTemplateConfig(template.Template, &decoded); err != nil {
			return &decoded, nil
		}
	}
	return &decoded, nil
}

func (s *supportNotificationTemplateService) UpsertConfig(ctx context.Context, config SupportNotificationTemplateConfig) (*SupportNotificationTemplateConfig, error) {
	if s == nil || s.repo == nil {
		return nil, ErrSupportNotificationTemplateInvalid
	}
	normalized := normalizeTemplateConfig(config)
	raw, err := encodeSupportTemplateConfig(normalized)
	if err != nil {
		return nil, ErrSupportNotificationTemplateInvalid
	}
	item := &entity.SupportNotificationTemplate{
		ID:       uuid.New(),
		Key:      supportNotificationTemplateKey,
		Template: raw,
		UpdatedAt: time.Now(),
	}
	if err := s.repo.Upsert(ctx, item); err != nil {
		return nil, err
	}
	return &normalized, nil
}

func (s *supportNotificationTemplateService) Render(template NotificationTemplate, values map[string]string) NotificationTemplate {
	return NotificationTemplate{
		Title:   replaceTemplateTokens(template.Title, values),
		Content: replaceTemplateTokens(template.Content, values),
	}
}

func (s *supportNotificationTemplateService) RenderFor(
	ctx context.Context,
	channel string,
	locale string,
	key NotificationTemplateKey,
	values map[string]string,
) NotificationTemplate {
	config, err := s.GetConfig(ctx)
	if err != nil {
		defaults := defaultSupportNotificationTemplateConfig()
		config = &defaults
	}
	template := resolveTemplateFromConfig(config, channel, locale, key)
	return s.Render(template, values)
}

func encodeSupportTemplateConfig(config SupportNotificationTemplateConfig) (entity.JSON, error) {
	bytes, err := json.Marshal(config)
	if err != nil {
		return nil, err
	}
	var payload map[string]interface{}
	if err := json.Unmarshal(bytes, &payload); err != nil {
		return nil, err
	}
	return entity.JSON(payload), nil
}

func decodeSupportTemplateConfig(raw entity.JSON, out *SupportNotificationTemplateConfig) error {
	if out == nil {
		return ErrSupportNotificationTemplateInvalid
	}
	bytes, err := json.Marshal(raw)
	if err != nil {
		return err
	}
	var decoded SupportNotificationTemplateConfig
	if err := json.Unmarshal(bytes, &decoded); err == nil && decoded.Channels != nil {
		*out = normalizeTemplateConfig(decoded)
		return nil
	}
	var legacy SupportNotificationTemplates
	if err := json.Unmarshal(bytes, &legacy); err != nil {
		return err
	}
	config := defaultSupportNotificationTemplateConfig()
	if config.Channels == nil {
		config.Channels = map[string]map[string]SupportNotificationTemplates{}
	}
	if _, ok := config.Channels[config.DefaultChannel]; !ok {
		config.Channels[config.DefaultChannel] = map[string]SupportNotificationTemplates{}
	}
	config.Channels[config.DefaultChannel][config.DefaultLocale] = legacy
	*out = normalizeTemplateConfig(config)
	return nil
}

func replaceTemplateTokens(input string, values map[string]string) string {
	if strings.TrimSpace(input) == "" {
		return input
	}
	if len(values) == 0 {
		return input
	}
	replacerArgs := make([]string, 0, len(values)*2)
	for key, value := range values {
		replacerArgs = append(replacerArgs, "{{"+key+"}}", value)
	}
	replacer := strings.NewReplacer(replacerArgs...)
	return replacer.Replace(input)
}

func resolveTemplateFromConfig(
	config *SupportNotificationTemplateConfig,
	channel string,
	locale string,
	key NotificationTemplateKey,
) NotificationTemplate {
	templates := resolveTemplates(config, channel, locale)
	switch key {
	case NotificationTemplateTicketCreated:
		return templates.TicketCreated
	case NotificationTemplateStatusUpdated:
		return templates.StatusUpdated
	case NotificationTemplateCommentAdded:
		return templates.CommentAdded
	default:
		return NotificationTemplate{}
	}
}

func resolveTemplates(config *SupportNotificationTemplateConfig, channel, locale string) SupportNotificationTemplates {
	defaults := defaultSupportNotificationTemplateConfig()
	if config == nil {
		return defaults.Channels[defaults.DefaultChannel][defaults.DefaultLocale]
	}
	normalized := normalizeTemplateConfig(*config)
	targetChannel := strings.TrimSpace(channel)
	if targetChannel == "" {
		targetChannel = normalized.DefaultChannel
	}
	targetLocale := strings.TrimSpace(locale)
	if targetLocale == "" {
		targetLocale = normalized.DefaultLocale
	}
	if locales, ok := normalized.Channels[targetChannel]; ok {
		if templates, ok := locales[targetLocale]; ok {
			return templates
		}
		if templates, ok := locales[normalized.DefaultLocale]; ok {
			return templates
		}
	}
	if locales, ok := normalized.Channels[normalized.DefaultChannel]; ok {
		if templates, ok := locales[targetLocale]; ok {
			return templates
		}
		if templates, ok := locales[normalized.DefaultLocale]; ok {
			return templates
		}
	}
	return defaultSupportNotificationTemplateConfig().Channels[defaultNotificationChannel][defaultNotificationLocale]
}

func normalizeTemplateConfig(config SupportNotificationTemplateConfig) SupportNotificationTemplateConfig {
	normalized := config
	if strings.TrimSpace(normalized.DefaultChannel) == "" {
		normalized.DefaultChannel = defaultNotificationChannel
	}
	if strings.TrimSpace(normalized.DefaultLocale) == "" {
		normalized.DefaultLocale = defaultNotificationLocale
	}
	if normalized.Channels == nil {
		normalized.Channels = map[string]map[string]SupportNotificationTemplates{}
	}
	defaults := defaultSupportNotificationTemplateConfig()
	for channel, locales := range defaults.Channels {
		if _, ok := normalized.Channels[channel]; !ok {
			normalized.Channels[channel] = map[string]SupportNotificationTemplates{}
		}
		for localeKey, templates := range locales {
			if _, ok := normalized.Channels[channel][localeKey]; !ok {
				normalized.Channels[channel][localeKey] = templates
			}
		}
	}
	return normalized
}

func defaultSupportNotificationTemplateConfig() SupportNotificationTemplateConfig {
	zhTemplates := SupportNotificationTemplates{
		TicketCreated: NotificationTemplate{
			Title:   "新工单已分派",
			Content: "工单 {{reference}} 已创建并分派给你：{{subject}}",
		},
		StatusUpdated: NotificationTemplate{
			Title:   "工单状态更新",
			Content: "工单 {{reference}} 状态更新为 {{status}}。{{note}}",
		},
		CommentAdded: NotificationTemplate{
			Title:   "工单新增评论",
			Content: "工单 {{reference}} 有新评论：{{comment}}",
		},
	}
	enTemplates := SupportNotificationTemplates{
		TicketCreated: NotificationTemplate{
			Title:   "New ticket assigned",
			Content: "Ticket {{reference}} assigned to you: {{subject}}",
		},
		StatusUpdated: NotificationTemplate{
			Title:   "Ticket status updated",
			Content: "Ticket {{reference}} status updated to {{status}}. {{note}}",
		},
		CommentAdded: NotificationTemplate{
			Title:   "New ticket comment",
			Content: "Ticket {{reference}} has a new comment: {{comment}}",
		},
	}
	channels := map[string]map[string]SupportNotificationTemplates{
		defaultNotificationChannel: {
			defaultNotificationLocale: zhTemplates,
			"en-US":                   enTemplates,
		},
		"email": {
			defaultNotificationLocale: zhTemplates,
			"en-US":                   enTemplates,
		},
		"sms": {
			defaultNotificationLocale: zhTemplates,
			"en-US":                   enTemplates,
		},
	}
	return SupportNotificationTemplateConfig{
		DefaultChannel: defaultNotificationChannel,
		DefaultLocale:  defaultNotificationLocale,
		Channels:       channels,
	}
}
