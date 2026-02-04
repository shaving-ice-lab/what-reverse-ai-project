package handler

import (
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/agentflow/server/internal/api/middleware"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// SupportTicketHandler 客户支持工单处理器
type SupportTicketHandler struct {
	supportTicketService service.SupportTicketService
	supportSettingsService service.SupportSettingsService
	captchaVerifier      service.CaptchaVerifier
	rateLimiter          *supportTicketRateLimiter
}

// NewSupportTicketHandler 创建客户支持工单处理器
func NewSupportTicketHandler(
	supportTicketService service.SupportTicketService,
	supportSettingsService service.SupportSettingsService,
	captchaVerifier service.CaptchaVerifier,
) *SupportTicketHandler {
	return &SupportTicketHandler{
		supportTicketService:  supportTicketService,
		supportSettingsService: supportSettingsService,
		captchaVerifier:       captchaVerifier,
		rateLimiter:           newSupportTicketRateLimiter(5, 10*time.Minute),
	}
}

type createSupportTicketRequest struct {
	WorkspaceID    string                 `json:"workspace_id"`
	AppID          string                 `json:"app_id"`
	RequesterName  string                 `json:"requester_name"`
	RequesterEmail string                 `json:"requester_email"`
	Subject        string                 `json:"subject"`
	Description    string                 `json:"description"`
	Category       string                 `json:"category"`
	Priority       string                 `json:"priority"`
	Channel        string                 `json:"channel"`
	Metadata       map[string]interface{} `json:"metadata"`
	CaptchaToken   string                 `json:"captcha_token"`
}

// CreateTicket 创建支持工单
func (h *SupportTicketHandler) CreateTicket(c echo.Context) error {
	var req createSupportTicketRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "SUPPORT_TICKET_INVALID", "请求参数错误")
	}

	captchaToken := h.getCaptchaToken(c, req.CaptchaToken)
	if h.rateLimiter != nil {
		key := h.rateLimiter.Key(c)
		if !h.rateLimiter.Allow(key) {
			if strings.TrimSpace(captchaToken) == "" {
				return errorResponseWithDetails(
					c,
					http.StatusTooManyRequests,
					"SUPPORT_TICKET_RATE_LIMITED",
					"请求过于频繁，请完成验证码后重试",
					map[string]interface{}{
						"captcha_required": true,
					},
				)
			}
			if err := h.verifyCaptcha(c, captchaToken); err != nil {
				return h.handleCaptchaError(c, err)
			}
			h.rateLimiter.Record(key)
		}
	}

	input := service.CreateSupportTicketInput{
		RequesterName:  req.RequesterName,
		RequesterEmail: req.RequesterEmail,
		Subject:        req.Subject,
		Description:    req.Description,
		Category:       req.Category,
		Priority:       req.Priority,
		Channel:        req.Channel,
		Metadata:       req.Metadata,
	}

	if req.WorkspaceID != "" {
		workspaceID, err := uuid.Parse(req.WorkspaceID)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "SUPPORT_TICKET_INVALID_WORKSPACE", "workspace_id 格式错误")
		}
		input.WorkspaceID = &workspaceID
	}
	if req.AppID != "" {
		appID, err := uuid.Parse(req.AppID)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "SUPPORT_TICKET_INVALID_APP", "app_id 格式错误")
		}
		input.AppID = &appID
	}
	if uid := middleware.GetUserID(c); uid != "" {
		if userID, err := uuid.Parse(uid); err == nil {
			input.RequesterUserID = &userID
		}
	}

	ticket, sla, err := h.supportTicketService.CreateTicket(c.Request().Context(), input)
	if err != nil {
		if err == service.ErrSupportTicketInvalid {
			return errorResponse(c, http.StatusBadRequest, "SUPPORT_TICKET_INVALID", "工单信息不完整或格式错误")
		}
		return errorResponse(c, http.StatusInternalServerError, "SUPPORT_TICKET_CREATE_FAILED", "创建工单失败")
	}

	return successResponse(c, map[string]interface{}{
		"ticket": ticket,
		"sla":    sla,
	})
}

// GetTicket 获取工单详情
func (h *SupportTicketHandler) GetTicket(c echo.Context) error {
	ticketID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "SUPPORT_TICKET_INVALID_ID", "工单 ID 格式错误")
	}
	ticket, err := h.supportTicketService.GetTicket(c.Request().Context(), ticketID)
	if err != nil {
		if err == service.ErrSupportTicketNotFound {
			return errorResponse(c, http.StatusNotFound, "SUPPORT_TICKET_NOT_FOUND", "工单不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "SUPPORT_TICKET_GET_FAILED", "获取工单失败")
	}
	return successResponse(c, map[string]interface{}{
		"ticket": ticket,
	})
}

// GetSLA 获取支持 SLA
func (h *SupportTicketHandler) GetSLA(c echo.Context) error {
	sla, err := h.supportTicketService.GetSLA(c.Request().Context())
	if err != nil {
		if err == service.ErrSupportSLANotFound {
			return errorResponse(c, http.StatusNotFound, "SUPPORT_SLA_NOT_FOUND", "支持 SLA 未配置")
		}
		return errorResponse(c, http.StatusInternalServerError, "SUPPORT_SLA_GET_FAILED", "获取支持 SLA 失败")
	}
	return successResponse(c, map[string]interface{}{
		"sla": sla,
	})
}

// ListChannels 获取支持渠道（公开）
func (h *SupportTicketHandler) ListChannels(c echo.Context) error {
	if h.supportSettingsService == nil {
		return successResponse(c, map[string]interface{}{
			"channels": []interface{}{},
		})
	}
	channels, err := h.supportSettingsService.ListChannels(c.Request().Context(), false)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "SUPPORT_CHANNEL_LIST_FAILED", "获取支持渠道失败")
	}
	return successResponse(c, map[string]interface{}{
		"channels": channels,
	})
}

// ListTickets 获取工单列表（管理员）
func (h *SupportTicketHandler) ListTickets(c echo.Context) error {
	page := parsePositiveInt(c.QueryParam("page"), 1)
	pageSize := parsePositiveInt(c.QueryParam("page_size"), 20)
	status := strings.TrimSpace(c.QueryParam("status"))
	priority := strings.TrimSpace(c.QueryParam("priority"))
	category := strings.TrimSpace(c.QueryParam("category"))
	search := strings.TrimSpace(c.QueryParam("search"))

	var workspaceID *uuid.UUID
	if raw := strings.TrimSpace(c.QueryParam("workspace_id")); raw != "" {
		id, err := uuid.Parse(raw)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "SUPPORT_TICKET_INVALID_WORKSPACE", "workspace_id 格式错误")
		}
		workspaceID = &id
	}
	var appID *uuid.UUID
	if raw := strings.TrimSpace(c.QueryParam("app_id")); raw != "" {
		id, err := uuid.Parse(raw)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "SUPPORT_TICKET_INVALID_APP", "app_id 格式错误")
		}
		appID = &id
	}

	tickets, total, err := h.supportTicketService.ListTickets(c.Request().Context(), service.SupportTicketListParams{
		Status:      status,
		Priority:    priority,
		Category:    category,
		Search:      search,
		WorkspaceID: workspaceID,
		AppID:       appID,
		Page:        page,
		PageSize:    pageSize,
	})
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "SUPPORT_TICKET_LIST_FAILED", "获取工单列表失败")
	}

	return successResponse(c, map[string]interface{}{
		"tickets":   tickets,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

type supportTicketStatusUpdateRequest struct {
	Status string `json:"status"`
	Note   string `json:"note"`
}

// UpdateStatus 更新工单状态（管理员）
func (h *SupportTicketHandler) UpdateStatus(c echo.Context) error {
	ticketID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "SUPPORT_TICKET_INVALID_ID", "工单 ID 格式错误")
	}

	var req supportTicketStatusUpdateRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "SUPPORT_TICKET_INVALID", "请求参数错误")
	}

	var actorUserID *uuid.UUID
	if uid := middleware.GetUserID(c); uid != "" {
		if parsed, err := uuid.Parse(uid); err == nil {
			actorUserID = &parsed
		}
	}

	ticket, err := h.supportTicketService.UpdateStatus(c.Request().Context(), ticketID, service.SupportTicketStatusUpdateInput{
		Status:      req.Status,
		Note:        req.Note,
		ActorUserID: actorUserID,
	})
	if err != nil {
		switch err {
		case service.ErrSupportTicketNotFound:
			return errorResponse(c, http.StatusNotFound, "SUPPORT_TICKET_NOT_FOUND", "工单不存在")
		case service.ErrSupportTicketInvalidStatus:
			return errorResponse(c, http.StatusBadRequest, "SUPPORT_TICKET_INVALID_STATUS", "工单状态不合法")
		default:
			return errorResponse(c, http.StatusInternalServerError, "SUPPORT_TICKET_UPDATE_FAILED", "更新工单失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"ticket": ticket,
	})
}

func (h *SupportTicketHandler) verifyCaptcha(c echo.Context, token string) error {
	if h.captchaVerifier == nil {
		return service.ErrCaptchaUnavailable
	}
	return h.captchaVerifier.Verify(c.Request().Context(), token, c.RealIP())
}

func (h *SupportTicketHandler) getCaptchaToken(c echo.Context, fallback string) string {
	token := strings.TrimSpace(c.Request().Header.Get("X-Support-Captcha-Token"))
	if token == "" {
		token = strings.TrimSpace(c.QueryParam("captcha_token"))
	}
	if token == "" {
		token = strings.TrimSpace(fallback)
	}
	return token
}

func (h *SupportTicketHandler) handleCaptchaError(c echo.Context, err error) error {
	switch err {
	case service.ErrCaptchaRequired:
		return errorResponse(c, http.StatusBadRequest, "CAPTCHA_REQUIRED", "需要验证码")
	case service.ErrCaptchaInvalid:
		return errorResponse(c, http.StatusBadRequest, "CAPTCHA_INVALID", "验证码无效")
	case service.ErrCaptchaUnavailable:
		return errorResponse(c, http.StatusServiceUnavailable, "CAPTCHA_UNAVAILABLE", "验证码服务不可用")
	default:
		return errorResponse(c, http.StatusInternalServerError, "SUPPORT_TICKET_FAILED", "验证码校验失败")
	}
}

type supportTicketRateLimiter struct {
	maxRequests int
	window      time.Duration
	mu          sync.Mutex
	entries     map[string][]time.Time
}

func newSupportTicketRateLimiter(maxRequests int, window time.Duration) *supportTicketRateLimiter {
	return &supportTicketRateLimiter{
		maxRequests: maxRequests,
		window:      window,
		entries:     make(map[string][]time.Time),
	}
}

func (l *supportTicketRateLimiter) Allow(key string) bool {
	if l == nil || key == "" {
		return true
	}
	now := time.Now()
	cutoff := now.Add(-l.window)

	l.mu.Lock()
	defer l.mu.Unlock()

	history := l.filter(key, cutoff)
	if len(history) >= l.maxRequests {
		return false
	}
	history = append(history, now)
	l.entries[key] = history
	return true
}

func (l *supportTicketRateLimiter) Record(key string) {
	if l == nil || key == "" {
		return
	}
	now := time.Now()
	cutoff := now.Add(-l.window)

	l.mu.Lock()
	defer l.mu.Unlock()

	history := l.filter(key, cutoff)
	history = append(history, now)
	l.entries[key] = history
}

func (l *supportTicketRateLimiter) Key(c echo.Context) string {
	if c == nil {
		return ""
	}
	ip := strings.TrimSpace(c.RealIP())
	if ip != "" {
		return ip
	}
	return strings.TrimSpace(c.Request().RemoteAddr)
}

func (l *supportTicketRateLimiter) filter(key string, cutoff time.Time) []time.Time {
	history := l.entries[key]
	if len(history) == 0 {
		return history
	}
	kept := history[:0]
	for _, t := range history {
		if t.After(cutoff) {
			kept = append(kept, t)
		}
	}
	if len(kept) == 0 {
		delete(l.entries, key)
		return nil
	}
	return kept
}

func parsePositiveInt(raw string, fallback int) int {
	if raw == "" {
		return fallback
	}
	value, err := strconv.Atoi(raw)
	if err != nil || value <= 0 {
		return fallback
	}
	return value
}
