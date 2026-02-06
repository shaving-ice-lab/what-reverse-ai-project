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
	"gorm.io/gorm"
)

// SupportSLAResponseTarget 支持 SLA 响应目标
type SupportSLAResponseTarget struct {
	Priority             string   `json:"priority"`
	FirstResponseMinutes int      `json:"first_response_minutes"`
	FirstResponseTarget  string   `json:"first_response_target"`
	UpdateCadence        string   `json:"update_cadence"`
	UpdateCadenceMinutes int      `json:"update_cadence_minutes"`
	ResolutionTarget     string   `json:"resolution_target"`
	ResolutionMinutes    int      `json:"resolution_minutes"`
	AppliesTo            []string `json:"applies_to"`
}

// SupportSLA 支持 SLA 定义
type SupportSLA struct {
	Key     string                     `json:"key"`
	Title   string                     `json:"title"`
	Targets []SupportSLAResponseTarget `json:"targets"`
	Notes   []string                   `json:"notes,omitempty"`
}

// CreateSupportTicketInput 创建工单入参
type CreateSupportTicketInput struct {
	WorkspaceID     *uuid.UUID
	RequesterUserID *uuid.UUID
	RequesterName   string
	RequesterEmail  string
	Subject         string
	Description     string
	Category        string
	Priority        string
	Channel         string
	Metadata        map[string]interface{}
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

// SupportTicketStatusUpdateInput 工单状态更新入参
type SupportTicketStatusUpdateInput struct {
	Status      string
	Note        string
	ActorUserID *uuid.UUID
}

// SupportTicketService 客户支持工单服务接口
type SupportTicketService interface {
	CreateTicket(ctx context.Context, input CreateSupportTicketInput) (*entity.SupportTicket, *SupportSLA, error)
	GetTicket(ctx context.Context, id uuid.UUID) (*entity.SupportTicket, error)
	GetSLA(ctx context.Context) (*SupportSLA, error)
	ListTickets(ctx context.Context, params SupportTicketListParams) ([]entity.SupportTicket, int64, error)
	UpdateStatus(ctx context.Context, id uuid.UUID, input SupportTicketStatusUpdateInput) (*entity.SupportTicket, error)
}

type supportTicketService struct {
	repo                repository.SupportTicketRepository
	ruleRepo            repository.SupportAssignmentRuleRepository
	channelRepo         repository.SupportChannelRepository
	routingService      SupportRoutingService
	notificationService NotificationService
	templateService     SupportNotificationTemplateService
	sla                 SupportSLA
	now                 func() time.Time
}

// ErrSupportTicketInvalid 工单参数错误
var ErrSupportTicketInvalid = errors.New("support ticket invalid")

// ErrSupportTicketNotFound 工单不存在
var ErrSupportTicketNotFound = errors.New("support ticket not found")

// ErrSupportTicketInvalidStatus 工单状态非法
var ErrSupportTicketInvalidStatus = errors.New("support ticket status invalid")

// ErrSupportSLANotFound SLA 配置不存在
var ErrSupportSLANotFound = errors.New("support sla not found")

// NewSupportTicketService 创建客户支持工单服务
func NewSupportTicketService(
	repo repository.SupportTicketRepository,
	ruleRepo repository.SupportAssignmentRuleRepository,
	channelRepo repository.SupportChannelRepository,
	routingService SupportRoutingService,
	notificationService NotificationService,
	templateService SupportNotificationTemplateService,
) SupportTicketService {
	return &supportTicketService{
		repo:                repo,
		ruleRepo:            ruleRepo,
		channelRepo:         channelRepo,
		routingService:      routingService,
		notificationService: notificationService,
		templateService:     templateService,
		sla:                 defaultSupportSLA(),
		now:                 time.Now,
	}
}

func (s *supportTicketService) CreateTicket(ctx context.Context, input CreateSupportTicketInput) (*entity.SupportTicket, *SupportSLA, error) {
	if s == nil || s.repo == nil {
		return nil, nil, ErrSupportTicketInvalid
	}

	requesterEmail := strings.ToLower(strings.TrimSpace(input.RequesterEmail))
	subject := strings.TrimSpace(input.Subject)
	description := strings.TrimSpace(input.Description)
	if requesterEmail == "" || !strings.Contains(requesterEmail, "@") || subject == "" || description == "" {
		return nil, nil, ErrSupportTicketInvalid
	}

	priority := normalizeSupportValue(input.Priority, supportPriorityOptions, "normal")
	category := normalizeSupportValue(input.Category, supportCategoryOptions, "general")
	channel := normalizeSupportValue(input.Channel, supportChannelOptions, "web")
	now := s.now()

	ticketID := uuid.New()
	ticket := &entity.SupportTicket{
		ID:              ticketID,
		Reference:       generateSupportTicketReference(now, ticketID),
		WorkspaceID:     input.WorkspaceID,
		RequesterUserID: input.RequesterUserID,
		RequesterName:   strings.TrimSpace(input.RequesterName),
		RequesterEmail:  requesterEmail,
		Subject:         subject,
		Description:     description,
		Category:        category,
		Priority:        priority,
		Status:          "open",
		Channel:         channel,
		Metadata:        input.Metadata,
		CreatedAt:       now,
		UpdatedAt:       now,
	}

	appendSupportStatusHistory(ticket, "", ticket.Status, "工单创建", input.RequesterUserID, now)
	s.applyAutoAssignment(ctx, ticket)

	slaCopy := s.resolveChannelSLA(ctx, channel, priority)
	if responseMinutes := responseMinutesForPriority(priority, slaCopy.Targets); responseMinutes > 0 {
		dueAt := now.Add(time.Duration(responseMinutes) * time.Minute)
		ticket.SLAResponseDueAt = &dueAt
		if ticket.Metadata == nil {
			ticket.Metadata = entity.JSON{}
		}
		ticket.Metadata["sla_response_minutes"] = responseMinutes
	}
	if updateMinutes := updateCadenceMinutesForPriority(priority, slaCopy.Targets); updateMinutes > 0 {
		dueAt := now.Add(time.Duration(updateMinutes) * time.Minute)
		ticket.SLAUpdateDueAt = &dueAt
		if ticket.Metadata == nil {
			ticket.Metadata = entity.JSON{}
		}
		ticket.Metadata["sla_update_minutes"] = updateMinutes
	}
	if resolutionMinutes := resolutionMinutesForPriority(priority, slaCopy.Targets); resolutionMinutes > 0 {
		dueAt := now.Add(time.Duration(resolutionMinutes) * time.Minute)
		ticket.SLAResolveDueAt = &dueAt
		if ticket.Metadata == nil {
			ticket.Metadata = entity.JSON{}
		}
		ticket.Metadata["sla_resolution_minutes"] = resolutionMinutes
	}

	if err := s.repo.Create(ctx, ticket); err != nil {
		return nil, nil, err
	}

	s.notifyTicketCreated(ctx, ticket)

	return ticket, &slaCopy, nil
}

func (s *supportTicketService) GetTicket(ctx context.Context, id uuid.UUID) (*entity.SupportTicket, error) {
	if s == nil || s.repo == nil {
		return nil, ErrSupportTicketNotFound
	}
	ticket, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrSupportTicketNotFound
		}
		return nil, err
	}
	return ticket, nil
}

func (s *supportTicketService) GetSLA(ctx context.Context) (*SupportSLA, error) {
	if s == nil || s.sla.Key == "" {
		return nil, ErrSupportSLANotFound
	}
	slaCopy := s.sla
	return &slaCopy, nil
}

func (s *supportTicketService) ListTickets(ctx context.Context, params SupportTicketListParams) ([]entity.SupportTicket, int64, error) {
	if s == nil || s.repo == nil {
		return nil, 0, ErrSupportTicketNotFound
	}
	status := normalizeSupportStatus(params.Status)
	priority := normalizeSupportValue(params.Priority, supportPriorityOptions, "")
	category := normalizeSupportValue(params.Category, supportCategoryOptions, "")
	search := strings.TrimSpace(params.Search)

	repoParams := repository.SupportTicketListParams{
		Status:      status,
		Priority:    priority,
		Category:    category,
		Search:      search,
		WorkspaceID: params.WorkspaceID,
		Page:        params.Page,
		PageSize:    params.PageSize,
	}
	return s.repo.List(ctx, repoParams)
}

func (s *supportTicketService) UpdateStatus(ctx context.Context, id uuid.UUID, input SupportTicketStatusUpdateInput) (*entity.SupportTicket, error) {
	if s == nil || s.repo == nil {
		return nil, ErrSupportTicketNotFound
	}
	nextStatus := normalizeSupportStatus(input.Status)
	if nextStatus == "" {
		return nil, ErrSupportTicketInvalidStatus
	}
	ticket, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrSupportTicketNotFound
		}
		return nil, err
	}

	currentStatus := normalizeSupportStatus(ticket.Status)
	if !isValidSupportStatusTransition(currentStatus, nextStatus) {
		return nil, ErrSupportTicketInvalidStatus
	}

	now := s.now()
	note := strings.TrimSpace(input.Note)
	if note != "" {
		ticket.StatusNote = &note
	} else {
		ticket.StatusNote = nil
	}
	ticket.Status = nextStatus
	ticket.UpdatedAt = now
	appendSupportStatusHistory(ticket, currentStatus, nextStatus, note, input.ActorUserID, now)

	if err := s.repo.Update(ctx, ticket); err != nil {
		return nil, err
	}
	s.notifyTicketStatusUpdate(ctx, ticket, input.ActorUserID)
	return ticket, nil
}

var supportPriorityOptions = map[string]struct{}{
	"critical": {},
	"high":     {},
	"normal":   {},
	"low":      {},
}

var supportCategoryOptions = map[string]struct{}{
	"general":   {},
	"technical": {},
	"billing":   {},
	"account":   {},
	"security":  {},
	"bug":       {},
	"feature":   {},
}

var supportStatusOptions = map[string]struct{}{
	"open":                {},
	"in_progress":         {},
	"waiting_on_customer": {},
	"resolved":            {},
	"closed":              {},
}

var supportChannelOptions = map[string]struct{}{
	"web":   {},
	"email": {},
	"chat":  {},
	"phone": {},
}

func normalizeSupportValue(value string, allowed map[string]struct{}, fallback string) string {
	normalized := strings.ToLower(strings.TrimSpace(value))
	if normalized == "" {
		return fallback
	}
	if _, ok := allowed[normalized]; ok {
		return normalized
	}
	return fallback
}

func normalizeSupportStatus(value string) string {
	return normalizeSupportValue(value, supportStatusOptions, "")
}

func responseMinutesForPriority(priority string, targets []SupportSLAResponseTarget) int {
	for _, target := range targets {
		if target.Priority == priority {
			return target.FirstResponseMinutes
		}
	}
	return 0
}

func updateCadenceMinutesForPriority(priority string, targets []SupportSLAResponseTarget) int {
	for _, target := range targets {
		if target.Priority == priority {
			return target.UpdateCadenceMinutes
		}
	}
	return 0
}

func resolutionMinutesForPriority(priority string, targets []SupportSLAResponseTarget) int {
	for _, target := range targets {
		if target.Priority == priority {
			return target.ResolutionMinutes
		}
	}
	return 0
}

func generateSupportTicketReference(now time.Time, id uuid.UUID) string {
	compact := strings.ReplaceAll(id.String(), "-", "")
	if len(compact) > 6 {
		compact = compact[:6]
	}
	return fmt.Sprintf("SUP-%s-%s", now.Format("20060102"), strings.ToUpper(compact))
}

func isValidSupportStatusTransition(current, next string) bool {
	if current == "" {
		return true
	}
	if current == next {
		return true
	}
	switch current {
	case "open":
		return next == "in_progress" || next == "waiting_on_customer" || next == "resolved" || next == "closed"
	case "in_progress":
		return next == "waiting_on_customer" || next == "resolved" || next == "closed"
	case "waiting_on_customer":
		return next == "in_progress" || next == "resolved" || next == "closed"
	case "resolved":
		return next == "closed" || next == "in_progress"
	case "closed":
		return next == "in_progress"
	default:
		return true
	}
}

func appendSupportStatusHistory(ticket *entity.SupportTicket, from, to, note string, actor *uuid.UUID, at time.Time) {
	if ticket == nil {
		return
	}
	if ticket.Metadata == nil {
		ticket.Metadata = entity.JSON{}
	}
	history := []interface{}{}
	if raw, ok := ticket.Metadata["status_history"].([]interface{}); ok {
		history = raw
	}
	entry := map[string]interface{}{
		"from": from,
		"to":   to,
		"note": note,
		"at":   at.Format(time.RFC3339),
	}
	if actor != nil {
		entry["actor_user_id"] = actor.String()
	}
	history = append(history, entry)
	ticket.Metadata["status_history"] = history
}

func (s *supportTicketService) resolveChannelSLA(ctx context.Context, channelKey, priority string) SupportSLA {
	slaCopy := s.sla
	overrideMinutes := s.channelSLAMinutes(ctx, channelKey, priority)
	if overrideMinutes <= 0 {
		return slaCopy
	}
	for i := range slaCopy.Targets {
		if slaCopy.Targets[i].Priority == priority {
			slaCopy.Targets[i].FirstResponseMinutes = overrideMinutes
			slaCopy.Targets[i].FirstResponseTarget = formatResponseTarget(overrideMinutes)
		}
	}
	return slaCopy
}

func (s *supportTicketService) channelSLAMinutes(ctx context.Context, channelKey, priority string) int {
	if s == nil || s.channelRepo == nil {
		return 0
	}
	trimmed := strings.TrimSpace(channelKey)
	if trimmed == "" {
		return 0
	}
	channel, err := s.channelRepo.GetByKey(ctx, trimmed)
	if err != nil || channel == nil {
		return 0
	}
	return extractSLAMinutes(channel.SLAOverrides, priority)
}

func extractSLAMinutes(overrides entity.JSON, priority string) int {
	if overrides == nil {
		return 0
	}
	raw, ok := overrides[strings.ToLower(strings.TrimSpace(priority))]
	if !ok || raw == nil {
		return 0
	}
	switch value := raw.(type) {
	case float64:
		return int(value)
	case int:
		return value
	case int64:
		return int(value)
	case map[string]interface{}:
		if v, ok := value["first_response_minutes"]; ok {
			switch number := v.(type) {
			case float64:
				return int(number)
			case int:
				return number
			case int64:
				return int(number)
			}
		}
	}
	return 0
}

func formatResponseTarget(minutes int) string {
	if minutes <= 0 {
		return ""
	}
	if minutes < 60 {
		return fmt.Sprintf("%d 分钟内响应", minutes)
	}
	hours := minutes / 60
	if minutes%60 == 0 {
		return fmt.Sprintf("%d 小时内响应", hours)
	}
	return fmt.Sprintf("%d 小时内响应", hours)
}

func (s *supportTicketService) notifyTicketCreated(ctx context.Context, ticket *entity.SupportTicket) {
	if s == nil || s.notificationService == nil || ticket == nil {
		return
	}
	recipients := s.resolveAssigneeUsers(ctx, ticket)
	if len(recipients) == 0 {
		return
	}
	title := "新工单已分派"
	content := fmt.Sprintf("工单 %s 已创建并分派：%s", ticket.Reference, ticket.Subject)
	if s.templateService != nil {
		rendered := s.templateService.RenderFor(
			ctx,
			"system",
			extractNotificationLocale(ticket),
			NotificationTemplateTicketCreated,
			map[string]string{
				"reference": ticket.Reference,
				"subject":   ticket.Subject,
				"status":    supportStatusLabel(ticket.Status),
				"assignee":  formatAssignee(ticket),
			},
		)
		if strings.TrimSpace(rendered.Title) != "" {
			title = rendered.Title
		}
		if strings.TrimSpace(rendered.Content) != "" {
			content = rendered.Content
		}
	}
	for _, userID := range recipients {
		_ = s.notificationService.SendSystemNotification(ctx, userID, title, content)
	}
}

func (s *supportTicketService) notifyTicketStatusUpdate(ctx context.Context, ticket *entity.SupportTicket, actor *uuid.UUID) {
	if s == nil || s.notificationService == nil || ticket == nil {
		return
	}
	recipients := map[uuid.UUID]struct{}{}
	if ticket.RequesterUserID != nil {
		recipients[*ticket.RequesterUserID] = struct{}{}
	}
	for _, userID := range s.resolveAssigneeUsers(ctx, ticket) {
		recipients[userID] = struct{}{}
	}
	if actor != nil {
		delete(recipients, *actor)
	}
	if len(recipients) == 0 {
		return
	}
	title := "工单状态更新"
	content := fmt.Sprintf("工单 %s 状态更新为 %s", ticket.Reference, supportStatusLabel(ticket.Status))
	note := ""
	if ticket.StatusNote != nil {
		note = strings.TrimSpace(*ticket.StatusNote)
	}
	if s.templateService != nil {
		rendered := s.templateService.RenderFor(
			ctx,
			"system",
			extractNotificationLocale(ticket),
			NotificationTemplateStatusUpdated,
			map[string]string{
				"reference": ticket.Reference,
				"subject":   ticket.Subject,
				"status":    supportStatusLabel(ticket.Status),
				"note":      note,
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

func (s *supportTicketService) applyAutoAssignment(ctx context.Context, ticket *entity.SupportTicket) {
	if s == nil || s.ruleRepo == nil || ticket == nil {
		return
	}
	rules, err := s.ruleRepo.List(ctx, false)
	if err != nil || len(rules) == 0 {
		return
	}
	match := matchSupportAssignmentRule(ticket, rules)
	if match == nil {
		return
	}
	assigneeType := strings.TrimSpace(match.AssigneeType)
	assigneeValue := strings.TrimSpace(match.AssigneeValue)
	if assigneeType == "" || assigneeValue == "" {
		return
	}
	now := s.now()
	ticket.AssigneeType = &assigneeType
	ticket.AssigneeValue = &assigneeValue
	ticket.AssignedAt = &now
	if ticket.Metadata == nil {
		ticket.Metadata = entity.JSON{}
	}
	ticket.Metadata["assignment_rule_id"] = match.ID.String()
}

func matchSupportAssignmentRule(ticket *entity.SupportTicket, rules []entity.SupportAssignmentRule) *entity.SupportAssignmentRule {
	if ticket == nil {
		return nil
	}
	subject := strings.ToLower(strings.TrimSpace(ticket.Subject))
	description := strings.ToLower(strings.TrimSpace(ticket.Description))
	for _, rule := range rules {
		if !rule.Enabled {
			continue
		}
		if strings.TrimSpace(rule.Priority) != "" && rule.Priority != ticket.Priority {
			continue
		}
		if strings.TrimSpace(rule.Category) != "" && rule.Category != ticket.Category {
			continue
		}
		if strings.TrimSpace(rule.Channel) != "" && rule.Channel != ticket.Channel {
			continue
		}
		keyword := strings.ToLower(strings.TrimSpace(rule.Keyword))
		if keyword != "" && !strings.Contains(subject, keyword) && !strings.Contains(description, keyword) {
			continue
		}
		match := rule
		return &match
	}
	return nil
}

func parseAssigneeUserID(ticket *entity.SupportTicket) *uuid.UUID {
	if ticket == nil || ticket.AssigneeType == nil || ticket.AssigneeValue == nil {
		return nil
	}
	if strings.ToLower(strings.TrimSpace(*ticket.AssigneeType)) != "user" {
		return nil
	}
	parsed, err := uuid.Parse(strings.TrimSpace(*ticket.AssigneeValue))
	if err != nil {
		return nil
	}
	return &parsed
}

func (s *supportTicketService) resolveAssigneeUsers(ctx context.Context, ticket *entity.SupportTicket) []uuid.UUID {
	if ticket == nil || ticket.AssigneeType == nil || ticket.AssigneeValue == nil {
		return []uuid.UUID{}
	}
	if s.routingService == nil {
		if assigneeID := parseAssigneeUserID(ticket); assigneeID != nil {
			return []uuid.UUID{*assigneeID}
		}
		return []uuid.UUID{}
	}
	users, err := s.routingService.ResolveAssigneeUsers(ctx, *ticket.AssigneeType, *ticket.AssigneeValue)
	if err != nil {
		return []uuid.UUID{}
	}
	return users
}

func formatAssignee(ticket *entity.SupportTicket) string {
	if ticket == nil || ticket.AssigneeType == nil || ticket.AssigneeValue == nil {
		return ""
	}
	return strings.TrimSpace(*ticket.AssigneeType) + ":" + strings.TrimSpace(*ticket.AssigneeValue)
}

func extractNotificationLocale(ticket *entity.SupportTicket) string {
	if ticket == nil || ticket.Metadata == nil {
		return ""
	}
	raw, ok := ticket.Metadata["locale"]
	if !ok || raw == nil {
		return ""
	}
	if locale, ok := raw.(string); ok {
		return strings.TrimSpace(locale)
	}
	return ""
}

func supportStatusLabel(status string) string {
	switch strings.ToLower(strings.TrimSpace(status)) {
	case "open":
		return "待处理"
	case "in_progress":
		return "处理中"
	case "waiting_on_customer":
		return "等待用户"
	case "resolved":
		return "已解决"
	case "closed":
		return "已关闭"
	default:
		return status
	}
}

func defaultSupportSLA() SupportSLA {
	return SupportSLA{
		Key:   "customer_support_sla",
		Title: "客户支持响应 SLA",
		Targets: []SupportSLAResponseTarget{
			{
				Priority:             "critical",
				FirstResponseMinutes: 60,
				FirstResponseTarget:  "1 小时内响应",
				UpdateCadence:        "每 4 小时更新",
				UpdateCadenceMinutes: 240,
				ResolutionTarget:     "24 小时内提供缓解方案",
				ResolutionMinutes:    1440,
				AppliesTo:            []string{"生产阻塞", "安全事件", "大规模不可用"},
			},
			{
				Priority:             "high",
				FirstResponseMinutes: 240,
				FirstResponseTarget:  "4 小时内响应",
				UpdateCadence:        "每日更新",
				UpdateCadenceMinutes: 1440,
				ResolutionTarget:     "3 个工作日内给出处理计划",
				ResolutionMinutes:    4320,
				AppliesTo:            []string{"关键功能异常", "支付/配额问题"},
			},
			{
				Priority:             "normal",
				FirstResponseMinutes: 1440,
				FirstResponseTarget:  "1 个工作日内响应",
				UpdateCadence:        "每 3 个工作日更新",
				UpdateCadenceMinutes: 4320,
				ResolutionTarget:     "7 个工作日内闭环或给出替代方案",
				ResolutionMinutes:    10080,
				AppliesTo:            []string{"功能使用问题", "集成咨询"},
			},
			{
				Priority:             "low",
				FirstResponseMinutes: 4320,
				FirstResponseTarget:  "3 个工作日内响应",
				UpdateCadence:        "按需更新",
				UpdateCadenceMinutes: 0,
				ResolutionTarget:     "进入产品迭代排期",
				ResolutionMinutes:    0,
				AppliesTo:            []string{"建议反馈", "体验优化"},
			},
		},
		Notes: []string{
			"响应 SLA 以首次响应为准，处理进度将按优先级更新。",
			"若提供 workspace 信息与日志截图，可显著缩短排查时间。",
		},
	}
}
