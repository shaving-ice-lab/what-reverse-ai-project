package handler

import (
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/agentflow/server/internal/api/middleware"
	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// AdminHandler 管理后台处理器
type AdminHandler struct {
	adminService                       service.AdminService
	announcementService                service.AnnouncementService
	supportTicketService               service.SupportTicketService
	supportSettingsService             service.SupportSettingsService
	supportTicketCommentService        service.SupportTicketCommentService
	supportRoutingService              service.SupportRoutingService
	supportNotificationTemplateService service.SupportNotificationTemplateService
}

// NewAdminHandler 创建管理后台处理器
func NewAdminHandler(
	adminService service.AdminService,
	announcementService service.AnnouncementService,
	supportTicketService service.SupportTicketService,
	supportSettingsService service.SupportSettingsService,
	supportTicketCommentService service.SupportTicketCommentService,
	supportRoutingService service.SupportRoutingService,
	supportNotificationTemplateService service.SupportNotificationTemplateService,
) *AdminHandler {
	return &AdminHandler{
		adminService:                       adminService,
		announcementService:                announcementService,
		supportTicketService:               supportTicketService,
		supportSettingsService:             supportSettingsService,
		supportTicketCommentService:        supportTicketCommentService,
		supportRoutingService:              supportRoutingService,
		supportNotificationTemplateService: supportNotificationTemplateService,
	}
}

type updateStatusRequest struct {
	Status string `json:"status"`
	Reason string `json:"reason"`
}

type updateRoleRequest struct {
	Role string `json:"role"`
}

type updateAdminRoleRequest struct {
	AdminRole string `json:"admin_role"`
	Reason    string `json:"reason"`
}

type adminForceLogoutRequest struct {
	Reason string `json:"reason"`
}

type adminResetPasswordRequest struct {
	Notify *bool  `json:"notify"`
	Reason string `json:"reason"`
}

type adminRiskFlagRequest struct {
	RiskFlag string `json:"risk_flag"`
	Reason   string `json:"reason"`
}

type adminBatchStatusRequest struct {
	UserIDs []string `json:"user_ids"`
	Status  string   `json:"status"`
	Reason  string   `json:"reason"`
}

type adminBatchRoleRequest struct {
	UserIDs []string `json:"user_ids"`
	Role    string   `json:"role"`
}

type updateSupportTicketStatusRequest struct {
	Status string `json:"status"`
	Note   string `json:"note"`
}

type supportChannelRequest struct {
	Key          string         `json:"key"`
	Name         string         `json:"name"`
	Description  *string        `json:"description"`
	Contact      *string        `json:"contact"`
	SLAOverrides map[string]int `json:"sla_overrides"`
	Enabled      *bool          `json:"enabled"`
	SortOrder    *int           `json:"sort_order"`
}

type supportAssignmentRuleRequest struct {
	Name          string `json:"name"`
	Priority      string `json:"priority"`
	Category      string `json:"category"`
	Channel       string `json:"channel"`
	Keyword       string `json:"keyword"`
	AssigneeType  string `json:"assignee_type"`
	AssigneeValue string `json:"assignee_value"`
	Enabled       *bool  `json:"enabled"`
	SortOrder     *int   `json:"sort_order"`
}

type supportTicketCommentRequest struct {
	Body       string `json:"body"`
	IsInternal *bool  `json:"is_internal"`
	AuthorName string `json:"author_name"`
}

type supportTeamRequest struct {
	Name        string  `json:"name"`
	Description *string `json:"description"`
	Enabled     *bool   `json:"enabled"`
}

type supportQueueRequest struct {
	Name        string  `json:"name"`
	Description *string `json:"description"`
	Enabled     *bool   `json:"enabled"`
}

type supportMemberRequest struct {
	UserID    string  `json:"user_id"`
	Role      *string `json:"role"`
	SortOrder *int    `json:"sort_order"`
}

type notificationTemplateRequest struct {
	Title   string `json:"title"`
	Content string `json:"content"`
}

type supportNotificationTemplateGroupRequest struct {
	TicketCreated notificationTemplateRequest `json:"ticket_created"`
	StatusUpdated notificationTemplateRequest `json:"status_updated"`
	CommentAdded  notificationTemplateRequest `json:"comment_added"`
}

type supportNotificationTemplateRequest struct {
	DefaultChannel string                                                        `json:"default_channel"`
	DefaultLocale  string                                                        `json:"default_locale"`
	Channels       map[string]map[string]supportNotificationTemplateGroupRequest `json:"channels"`
}

type adminAnnouncementCreateRequest struct {
	Title       string  `json:"title"`
	Description string  `json:"description"`
	Type        string  `json:"type"`
	Priority    *int    `json:"priority"`
	IsActive    *bool   `json:"is_active"`
	StartsAt    *string `json:"starts_at"`
	EndsAt      *string `json:"ends_at"`
}

type adminAnnouncementUpdateRequest struct {
	Title       *string `json:"title"`
	Description *string `json:"description"`
	Type        *string `json:"type"`
	Priority    *int    `json:"priority"`
	IsActive    *bool   `json:"is_active"`
	StartsAt    *string `json:"starts_at"`
	EndsAt      *string `json:"ends_at"`
}

type adminUserResponse struct {
	*entity.User
	RiskFlag string `json:"risk_flag,omitempty"`
}

// GetCapabilities 获取管理员能力清单
func (h *AdminHandler) GetCapabilities(c echo.Context) error {
	user := middleware.GetAuthUser(c)
	return successResponse(c, map[string]interface{}{
		"capabilities": h.adminService.CapabilitiesForUser(user),
	})
}

// ListUsers 查询用户列表
func (h *AdminHandler) ListUsers(c echo.Context) error {
	if err := requireAdminCapability(c, h.adminService, "users.read"); err != nil {
		return err
	}
	page, _ := strconv.Atoi(c.QueryParam("page"))
	pageSize, _ := strconv.Atoi(c.QueryParam("page_size"))
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}

	users, total, err := h.adminService.ListUsers(c.Request().Context(), service.AdminUserListParams{
		Search:   c.QueryParam("search"),
		Status:   c.QueryParam("status"),
		Role:     c.QueryParam("role"),
		Page:     page,
		PageSize: pageSize,
	})
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "ADMIN_LIST_USERS_FAILED", "获取用户列表失败")
	}

	return successResponse(c, map[string]interface{}{
		"items":     users,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// GetUser 获取用户详情
func (h *AdminHandler) GetUser(c echo.Context) error {
	if err := requireAdminCapability(c, h.adminService, "users.read"); err != nil {
		return err
	}
	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	user, err := h.adminService.GetUser(c.Request().Context(), userID)
	if err != nil {
		switch err {
		case service.ErrAdminUserNotFound:
			return errorResponse(c, http.StatusNotFound, "USER_NOT_FOUND", "用户不存在")
		default:
			return errorResponse(c, http.StatusInternalServerError, "GET_FAILED", "获取用户详情失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"user": buildAdminUserResponse(user),
	})
}

// UpdateUserStatus 更新用户状态
func (h *AdminHandler) UpdateUserStatus(c echo.Context) error {
	if err := requireAdminCapability(c, h.adminService, "users.write"); err != nil {
		return err
	}
	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}
	adminID, err := parseAdminID(c)
	if err != nil {
		return err
	}

	var req updateStatusRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	user, err := h.adminService.UpdateUserStatus(c.Request().Context(), adminID, userID, service.AdminStatusUpdateInput{
		Status: req.Status,
		Reason: req.Reason,
	})
	if err != nil {
		switch err {
		case service.ErrAdminUserNotFound:
			return errorResponse(c, http.StatusNotFound, "USER_NOT_FOUND", "用户不存在")
		case service.ErrAdminInvalidStatus:
			return errorResponse(c, http.StatusBadRequest, "INVALID_STATUS", "用户状态非法")
		default:
			return errorResponse(c, http.StatusInternalServerError, "UPDATE_FAILED", "更新用户状态失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"user": buildAdminUserResponse(user),
	})
}

// UpdateUserRole 更新用户角色
func (h *AdminHandler) UpdateUserRole(c echo.Context) error {
	if err := requireAdminCapability(c, h.adminService, "users.write"); err != nil {
		return err
	}
	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}
	adminID, err := parseAdminID(c)
	if err != nil {
		return err
	}

	var req updateRoleRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	user, err := h.adminService.UpdateUserRole(c.Request().Context(), adminID, userID, req.Role)
	if err != nil {
		switch err {
		case service.ErrAdminUserNotFound:
			return errorResponse(c, http.StatusNotFound, "USER_NOT_FOUND", "用户不存在")
		case service.ErrAdminInvalidRole:
			return errorResponse(c, http.StatusBadRequest, "INVALID_ROLE", "用户角色非法")
		default:
			return errorResponse(c, http.StatusInternalServerError, "UPDATE_FAILED", "更新用户角色失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"user": buildAdminUserResponse(user),
	})
}

// UpdateUserAdminRole 更新管理员角色
func (h *AdminHandler) UpdateUserAdminRole(c echo.Context) error {
	if err := requireAdminCapability(c, h.adminService, "permissions.write"); err != nil {
		return err
	}
	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}
	adminID, err := parseAdminID(c)
	if err != nil {
		return err
	}

	var req updateAdminRoleRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	user, err := h.adminService.UpdateUserAdminRole(c.Request().Context(), adminID, userID, service.AdminAdminRoleUpdateInput{
		Role:   req.AdminRole,
		Reason: req.Reason,
	})
	if err != nil {
		switch err {
		case service.ErrAdminUserNotFound:
			return errorResponse(c, http.StatusNotFound, "USER_NOT_FOUND", "用户不存在")
		case service.ErrAdminInvalidAdminRole:
			return errorResponse(c, http.StatusBadRequest, "INVALID_ADMIN_ROLE", "管理员角色非法")
		default:
			return errorResponse(c, http.StatusInternalServerError, "UPDATE_FAILED", "更新管理员角色失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"user": buildAdminUserResponse(user),
	})
}

// ListWorkspaces 查询 Workspace 列表
func (h *AdminHandler) ListWorkspaces(c echo.Context) error {
	if err := requireAdminCapability(c, h.adminService, "workspaces.read"); err != nil {
		return err
	}
	page, _ := strconv.Atoi(c.QueryParam("page"))
	pageSize, _ := strconv.Atoi(c.QueryParam("page_size"))
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}

	var ownerID *uuid.UUID
	if ownerParam := strings.TrimSpace(c.QueryParam("owner_id")); ownerParam != "" {
		parsed, err := uuid.Parse(ownerParam)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_OWNER_ID", "Owner ID 无效")
		}
		ownerID = &parsed
	}

	includeDeleted := strings.TrimSpace(c.QueryParam("include_deleted")) == "true"

	workspaces, total, err := h.adminService.ListWorkspaces(c.Request().Context(), service.AdminWorkspaceListParams{
		Search:         c.QueryParam("search"),
		Status:         c.QueryParam("status"),
		OwnerID:        ownerID,
		IncludeDeleted: includeDeleted,
		Page:           page,
		PageSize:       pageSize,
	})
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "ADMIN_LIST_WORKSPACES_FAILED", "获取 Workspace 列表失败")
	}

	return successResponse(c, map[string]interface{}{
		"items":     workspaces,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// GetWorkspace 获取 Workspace 详情
func (h *AdminHandler) GetWorkspace(c echo.Context) error {
	if err := requireAdminCapability(c, h.adminService, "workspaces.read"); err != nil {
		return err
	}
	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "Workspace ID 无效")
	}

	includeDeleted := strings.TrimSpace(c.QueryParam("include_deleted")) == "true"
	detail, err := h.adminService.GetWorkspaceDetail(c.Request().Context(), workspaceID, includeDeleted)
	if err != nil {
		switch err {
		case service.ErrAdminWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "WORKSPACE_NOT_FOUND", "Workspace 不存在")
		default:
			return errorResponse(c, http.StatusInternalServerError, "GET_FAILED", "获取 Workspace 详情失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"workspace":     detail.Workspace,
		"members":       detail.Members,
		"members_total": len(detail.Members),
	})
}

// UpdateWorkspaceStatus 更新 Workspace 状态
func (h *AdminHandler) UpdateWorkspaceStatus(c echo.Context) error {
	if err := requireAdminCapability(c, h.adminService, "workspaces.write"); err != nil {
		return err
	}
	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "Workspace ID 无效")
	}
	adminID, err := parseAdminID(c)
	if err != nil {
		return err
	}

	var req updateStatusRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	workspace, err := h.adminService.UpdateWorkspaceStatus(c.Request().Context(), adminID, workspaceID, service.AdminStatusUpdateInput{
		Status: req.Status,
		Reason: req.Reason,
	})
	if err != nil {
		switch err {
		case service.ErrAdminWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "WORKSPACE_NOT_FOUND", "Workspace 不存在")
		case service.ErrAdminInvalidStatus:
			return errorResponse(c, http.StatusBadRequest, "INVALID_STATUS", "Workspace 状态非法")
		default:
			return errorResponse(c, http.StatusInternalServerError, "UPDATE_FAILED", "更新 Workspace 状态失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"workspace": workspace,
	})
}

// UpdateWorkspacePublishStatus 更新 Workspace 发布状态
func (h *AdminHandler) UpdateWorkspacePublishStatus(c echo.Context) error {
	if err := requireAdminCapability(c, h.adminService, "workspaces.write"); err != nil {
		return err
	}
	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "Workspace ID 无效")
	}
	adminID, err := parseAdminID(c)
	if err != nil {
		return err
	}

	var req updateStatusRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	workspace, err := h.adminService.UpdateWorkspacePublishStatus(c.Request().Context(), adminID, workspaceID, service.AdminStatusUpdateInput{
		Status: req.Status,
		Reason: req.Reason,
	})
	if err != nil {
		switch err {
		case service.ErrAdminWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "WORKSPACE_NOT_FOUND", "Workspace 不存在")
		case service.ErrAdminInvalidStatus:
			return errorResponse(c, http.StatusBadRequest, "INVALID_STATUS", "Workspace 发布状态非法")
		default:
			return errorResponse(c, http.StatusInternalServerError, "UPDATE_FAILED", "更新 Workspace 发布状态失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"workspace": workspace,
	})
}

// ListAnnouncements 管理员公告列表
func (h *AdminHandler) ListAnnouncements(c echo.Context) error {
	if err := requireAdminCapability(c, h.adminService, "announcements.read"); err != nil {
		return err
	}
	page, _ := strconv.Atoi(c.QueryParam("page"))
	pageSize, _ := strconv.Atoi(c.QueryParam("page_size"))
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}

	includeInactive := strings.TrimSpace(c.QueryParam("include_inactive")) == "true"
	var isActive *bool
	if raw := strings.TrimSpace(c.QueryParam("is_active")); raw != "" {
		parsed, err := strconv.ParseBool(raw)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_ACTIVE", "is_active 参数无效")
		}
		isActive = &parsed
	}
	announcements, total, err := h.announcementService.ListAllWithStats(c.Request().Context(), service.AnnouncementAdminListParams{
		Type:            strings.TrimSpace(c.QueryParam("type")),
		IncludeInactive: includeInactive,
		IsActive:        isActive,
		Page:            page,
		PageSize:        pageSize,
	})
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "ANNOUNCEMENT_LIST_FAILED", "获取公告列表失败")
	}

	return successResponse(c, map[string]interface{}{
		"items":     announcements,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// CreateAnnouncement 创建公告（管理员）
func (h *AdminHandler) CreateAnnouncement(c echo.Context) error {
	if err := requireAdminCapability(c, h.adminService, "announcements.write"); err != nil {
		return err
	}
	var req adminAnnouncementCreateRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	title := strings.TrimSpace(req.Title)
	if title == "" {
		return errorResponse(c, http.StatusBadRequest, "TITLE_REQUIRED", "标题不能为空")
	}
	description := strings.TrimSpace(req.Description)
	if description == "" {
		return errorResponse(c, http.StatusBadRequest, "DESCRIPTION_REQUIRED", "公告内容不能为空")
	}
	announcementType := strings.ToLower(strings.TrimSpace(req.Type))
	if !isValidAnnouncementType(announcementType) {
		return errorResponse(c, http.StatusBadRequest, "INVALID_TYPE", "公告类型无效")
	}

	priority := 0
	if req.Priority != nil {
		priority = *req.Priority
	}
	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	startsAt := time.Now()
	if req.StartsAt != nil {
		raw := strings.TrimSpace(*req.StartsAt)
		if raw != "" {
			parsed, err := parseAnnouncementTime(raw)
			if err != nil {
				return errorResponse(c, http.StatusBadRequest, "INVALID_STARTS_AT", "开始时间格式无效")
			}
			startsAt = parsed
		}
	}

	var endsAt *time.Time
	if req.EndsAt != nil {
		raw := strings.TrimSpace(*req.EndsAt)
		if raw != "" {
			parsed, err := parseAnnouncementTime(raw)
			if err != nil {
				return errorResponse(c, http.StatusBadRequest, "INVALID_ENDS_AT", "结束时间格式无效")
			}
			endsAt = &parsed
		}
	}

	announcement := &entity.Announcement{
		Title:       title,
		Description: description,
		Type:        announcementType,
		Priority:    priority,
		IsActive:    isActive,
		StartsAt:    startsAt,
		EndsAt:      endsAt,
	}

	if err := h.announcementService.Create(c.Request().Context(), announcement); err != nil {
		return errorResponse(c, http.StatusInternalServerError, "ANNOUNCEMENT_CREATE_FAILED", "创建公告失败")
	}

	return successResponse(c, map[string]interface{}{
		"announcement": announcement,
	})
}

// UpdateAnnouncement 更新公告（发布/下线）
func (h *AdminHandler) UpdateAnnouncement(c echo.Context) error {
	if err := requireAdminCapability(c, h.adminService, "announcements.write"); err != nil {
		return err
	}
	announcementID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "公告 ID 无效")
	}

	var req adminAnnouncementUpdateRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	announcement, err := h.announcementService.Get(c.Request().Context(), announcementID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errorResponse(c, http.StatusNotFound, "ANNOUNCEMENT_NOT_FOUND", "公告不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "ANNOUNCEMENT_GET_FAILED", "获取公告失败")
	}

	if req.Title != nil {
		value := strings.TrimSpace(*req.Title)
		if value == "" {
			return errorResponse(c, http.StatusBadRequest, "TITLE_REQUIRED", "标题不能为空")
		}
		announcement.Title = value
	}
	if req.Description != nil {
		value := strings.TrimSpace(*req.Description)
		if value == "" {
			return errorResponse(c, http.StatusBadRequest, "DESCRIPTION_REQUIRED", "公告内容不能为空")
		}
		announcement.Description = value
	}
	if req.Type != nil {
		value := strings.ToLower(strings.TrimSpace(*req.Type))
		if !isValidAnnouncementType(value) {
			return errorResponse(c, http.StatusBadRequest, "INVALID_TYPE", "公告类型无效")
		}
		announcement.Type = value
	}
	if req.Priority != nil {
		announcement.Priority = *req.Priority
	}
	if req.IsActive != nil {
		announcement.IsActive = *req.IsActive
	}
	if req.StartsAt != nil {
		value := strings.TrimSpace(*req.StartsAt)
		if value == "" {
			announcement.StartsAt = time.Time{}
		} else {
			parsed, err := parseAnnouncementTime(value)
			if err != nil {
				return errorResponse(c, http.StatusBadRequest, "INVALID_STARTS_AT", "开始时间格式无效")
			}
			announcement.StartsAt = parsed
		}
	}
	if req.EndsAt != nil {
		value := strings.TrimSpace(*req.EndsAt)
		if value == "" {
			announcement.EndsAt = nil
		} else {
			parsed, err := parseAnnouncementTime(value)
			if err != nil {
				return errorResponse(c, http.StatusBadRequest, "INVALID_ENDS_AT", "结束时间格式无效")
			}
			announcement.EndsAt = &parsed
		}
	}

	if err := h.announcementService.Update(c.Request().Context(), announcement); err != nil {
		return errorResponse(c, http.StatusInternalServerError, "ANNOUNCEMENT_UPDATE_FAILED", "更新公告失败")
	}

	return successResponse(c, map[string]interface{}{
		"announcement": announcement,
	})
}

// ListSupportTickets 查询支持工单列表
func (h *AdminHandler) ListSupportTickets(c echo.Context) error {
	if err := requireAdminCapability(c, h.adminService, "support.read"); err != nil {
		return err
	}
	page, _ := strconv.Atoi(c.QueryParam("page"))
	pageSize, _ := strconv.Atoi(c.QueryParam("page_size"))
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}

	var workspaceID *uuid.UUID
	if workspaceParam := strings.TrimSpace(c.QueryParam("workspace_id")); workspaceParam != "" {
		parsed, err := uuid.Parse(workspaceParam)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_WORKSPACE_ID", "Workspace ID 无效")
		}
		workspaceID = &parsed
	}

	tickets, total, err := h.supportTicketService.ListTickets(c.Request().Context(), service.SupportTicketListParams{
		Status:      c.QueryParam("status"),
		Priority:    c.QueryParam("priority"),
		Category:    c.QueryParam("category"),
		Search:      c.QueryParam("search"),
		WorkspaceID: workspaceID,
		Page:        page,
		PageSize:    pageSize,
	})
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "SUPPORT_TICKET_LIST_FAILED", "获取工单列表失败")
	}

	return successResponse(c, map[string]interface{}{
		"items":     tickets,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// GetSupportTicket 获取工单详情
func (h *AdminHandler) GetSupportTicket(c echo.Context) error {
	if err := requireAdminCapability(c, h.adminService, "support.read"); err != nil {
		return err
	}
	ticketID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "SUPPORT_TICKET_INVALID_ID", "工单 ID 无效")
	}

	ticket, err := h.supportTicketService.GetTicket(c.Request().Context(), ticketID)
	if err != nil {
		switch err {
		case service.ErrSupportTicketNotFound:
			return errorResponse(c, http.StatusNotFound, "SUPPORT_TICKET_NOT_FOUND", "工单不存在")
		default:
			return errorResponse(c, http.StatusInternalServerError, "SUPPORT_TICKET_GET_FAILED", "获取工单失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"ticket": ticket,
	})
}

// UpdateSupportTicketStatus 更新工单状态
func (h *AdminHandler) UpdateSupportTicketStatus(c echo.Context) error {
	if err := requireAdminCapability(c, h.adminService, "support.write"); err != nil {
		return err
	}
	ticketID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "SUPPORT_TICKET_INVALID_ID", "工单 ID 无效")
	}
	adminID, err := parseAdminID(c)
	if err != nil {
		return err
	}

	var req updateSupportTicketStatusRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	ticket, err := h.supportTicketService.UpdateStatus(c.Request().Context(), ticketID, service.SupportTicketStatusUpdateInput{
		Status:      req.Status,
		Note:        req.Note,
		ActorUserID: &adminID,
	})
	if err != nil {
		switch err {
		case service.ErrSupportTicketNotFound:
			return errorResponse(c, http.StatusNotFound, "SUPPORT_TICKET_NOT_FOUND", "工单不存在")
		case service.ErrSupportTicketInvalidStatus:
			return errorResponse(c, http.StatusBadRequest, "SUPPORT_TICKET_INVALID_STATUS", "工单状态非法")
		default:
			return errorResponse(c, http.StatusInternalServerError, "SUPPORT_TICKET_UPDATE_FAILED", "更新工单状态失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"ticket": ticket,
	})
}

// ListSupportChannels 查询支持渠道
func (h *AdminHandler) ListSupportChannels(c echo.Context) error {
	if err := requireAdminCapability(c, h.adminService, "support.manage"); err != nil {
		return err
	}
	includeDisabled := strings.TrimSpace(c.QueryParam("include_disabled")) == "true"
	channels, err := h.supportSettingsService.ListChannels(c.Request().Context(), includeDisabled)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "SUPPORT_CHANNEL_LIST_FAILED", "获取支持渠道失败")
	}
	return successResponse(c, map[string]interface{}{
		"channels": channels,
	})
}

// CreateSupportChannel 创建支持渠道
func (h *AdminHandler) CreateSupportChannel(c echo.Context) error {
	if err := requireAdminCapability(c, h.adminService, "support.manage"); err != nil {
		return err
	}
	var req supportChannelRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "SUPPORT_CHANNEL_INVALID", "请求参数无效")
	}
	channel, err := h.supportSettingsService.CreateChannel(c.Request().Context(), service.SupportChannelInput{
		Key:          req.Key,
		Name:         req.Name,
		Description:  req.Description,
		Contact:      req.Contact,
		SLAOverrides: req.SLAOverrides,
		Enabled:      req.Enabled,
		SortOrder:    req.SortOrder,
	})
	if err != nil {
		if err == service.ErrSupportSettingsInvalid {
			return errorResponse(c, http.StatusBadRequest, "SUPPORT_CHANNEL_INVALID", "支持渠道配置不合法")
		}
		return errorResponse(c, http.StatusInternalServerError, "SUPPORT_CHANNEL_CREATE_FAILED", "创建支持渠道失败")
	}
	return successResponse(c, map[string]interface{}{
		"channel": channel,
	})
}

// UpdateSupportChannel 更新支持渠道
func (h *AdminHandler) UpdateSupportChannel(c echo.Context) error {
	if err := requireAdminCapability(c, h.adminService, "support.manage"); err != nil {
		return err
	}
	channelID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "SUPPORT_CHANNEL_INVALID_ID", "支持渠道 ID 无效")
	}
	var req supportChannelRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "SUPPORT_CHANNEL_INVALID", "请求参数无效")
	}
	channel, err := h.supportSettingsService.UpdateChannel(c.Request().Context(), channelID, service.SupportChannelInput{
		Key:          req.Key,
		Name:         req.Name,
		Description:  req.Description,
		Contact:      req.Contact,
		SLAOverrides: req.SLAOverrides,
		Enabled:      req.Enabled,
		SortOrder:    req.SortOrder,
	})
	if err != nil {
		switch err {
		case service.ErrSupportChannelNotFound:
			return errorResponse(c, http.StatusNotFound, "SUPPORT_CHANNEL_NOT_FOUND", "支持渠道不存在")
		case service.ErrSupportSettingsInvalid:
			return errorResponse(c, http.StatusBadRequest, "SUPPORT_CHANNEL_INVALID", "支持渠道配置不合法")
		default:
			return errorResponse(c, http.StatusInternalServerError, "SUPPORT_CHANNEL_UPDATE_FAILED", "更新支持渠道失败")
		}
	}
	return successResponse(c, map[string]interface{}{
		"channel": channel,
	})
}

// ListSupportAssignmentRules 查询自动分派规则
func (h *AdminHandler) ListSupportAssignmentRules(c echo.Context) error {
	if err := requireAdminCapability(c, h.adminService, "support.manage"); err != nil {
		return err
	}
	includeDisabled := strings.TrimSpace(c.QueryParam("include_disabled")) == "true"
	rules, err := h.supportSettingsService.ListRules(c.Request().Context(), includeDisabled)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "SUPPORT_RULE_LIST_FAILED", "获取分派规则失败")
	}
	return successResponse(c, map[string]interface{}{
		"rules": rules,
	})
}

// CreateSupportAssignmentRule 创建自动分派规则
func (h *AdminHandler) CreateSupportAssignmentRule(c echo.Context) error {
	if err := requireAdminCapability(c, h.adminService, "support.manage"); err != nil {
		return err
	}
	var req supportAssignmentRuleRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "SUPPORT_RULE_INVALID", "请求参数无效")
	}
	rule, err := h.supportSettingsService.CreateRule(c.Request().Context(), service.SupportAssignmentRuleInput{
		Name:          req.Name,
		Priority:      req.Priority,
		Category:      req.Category,
		Channel:       req.Channel,
		Keyword:       req.Keyword,
		AssigneeType:  req.AssigneeType,
		AssigneeValue: req.AssigneeValue,
		Enabled:       req.Enabled,
		SortOrder:     req.SortOrder,
	})
	if err != nil {
		if err == service.ErrSupportSettingsInvalid {
			return errorResponse(c, http.StatusBadRequest, "SUPPORT_RULE_INVALID", "分派规则配置不合法")
		}
		return errorResponse(c, http.StatusInternalServerError, "SUPPORT_RULE_CREATE_FAILED", "创建分派规则失败")
	}
	return successResponse(c, map[string]interface{}{
		"rule": rule,
	})
}

// UpdateSupportAssignmentRule 更新自动分派规则
func (h *AdminHandler) UpdateSupportAssignmentRule(c echo.Context) error {
	if err := requireAdminCapability(c, h.adminService, "support.manage"); err != nil {
		return err
	}
	ruleID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "SUPPORT_RULE_INVALID_ID", "分派规则 ID 无效")
	}
	var req supportAssignmentRuleRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "SUPPORT_RULE_INVALID", "请求参数无效")
	}
	rule, err := h.supportSettingsService.UpdateRule(c.Request().Context(), ruleID, service.SupportAssignmentRuleInput{
		Name:          req.Name,
		Priority:      req.Priority,
		Category:      req.Category,
		Channel:       req.Channel,
		Keyword:       req.Keyword,
		AssigneeType:  req.AssigneeType,
		AssigneeValue: req.AssigneeValue,
		Enabled:       req.Enabled,
		SortOrder:     req.SortOrder,
	})
	if err != nil {
		switch err {
		case service.ErrSupportAssignmentRuleNotFound:
			return errorResponse(c, http.StatusNotFound, "SUPPORT_RULE_NOT_FOUND", "分派规则不存在")
		case service.ErrSupportSettingsInvalid:
			return errorResponse(c, http.StatusBadRequest, "SUPPORT_RULE_INVALID", "分派规则配置不合法")
		default:
			return errorResponse(c, http.StatusInternalServerError, "SUPPORT_RULE_UPDATE_FAILED", "更新分派规则失败")
		}
	}
	return successResponse(c, map[string]interface{}{
		"rule": rule,
	})
}

// ListSupportTicketComments 查询工单评论
func (h *AdminHandler) ListSupportTicketComments(c echo.Context) error {
	if err := requireAdminCapability(c, h.adminService, "support.read"); err != nil {
		return err
	}
	ticketID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "SUPPORT_TICKET_INVALID_ID", "工单 ID 无效")
	}
	comments, err := h.supportTicketCommentService.ListByTicket(c.Request().Context(), ticketID)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "SUPPORT_COMMENT_LIST_FAILED", "获取评论失败")
	}
	return successResponse(c, map[string]interface{}{
		"comments": comments,
	})
}

// CreateSupportTicketComment 创建工单评论
func (h *AdminHandler) CreateSupportTicketComment(c echo.Context) error {
	if err := requireAdminCapability(c, h.adminService, "support.write"); err != nil {
		return err
	}
	ticketID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "SUPPORT_TICKET_INVALID_ID", "工单 ID 无效")
	}
	adminID, err := parseAdminID(c)
	if err != nil {
		return err
	}
	var req supportTicketCommentRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "SUPPORT_COMMENT_INVALID", "请求参数无效")
	}
	isInternal := true
	if req.IsInternal != nil {
		isInternal = *req.IsInternal
	}
	comment, err := h.supportTicketCommentService.Create(c.Request().Context(), service.CreateSupportTicketCommentInput{
		TicketID:     ticketID,
		AuthorUserID: &adminID,
		AuthorName:   req.AuthorName,
		Body:         req.Body,
		IsInternal:   isInternal,
	})
	if err != nil {
		if err == service.ErrSupportTicketCommentInvalid {
			return errorResponse(c, http.StatusBadRequest, "SUPPORT_COMMENT_INVALID", "评论内容无效")
		}
		return errorResponse(c, http.StatusInternalServerError, "SUPPORT_COMMENT_CREATE_FAILED", "创建评论失败")
	}
	return successResponse(c, map[string]interface{}{
		"comment": comment,
	})
}

// ListSupportTeams 查询支持团队
func (h *AdminHandler) ListSupportTeams(c echo.Context) error {
	if err := requireAdminCapability(c, h.adminService, "support.manage"); err != nil {
		return err
	}
	includeDisabled := strings.TrimSpace(c.QueryParam("include_disabled")) == "true"
	teams, err := h.supportRoutingService.ListTeams(c.Request().Context(), includeDisabled)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "SUPPORT_TEAM_LIST_FAILED", "获取团队失败")
	}
	return successResponse(c, map[string]interface{}{
		"teams": teams,
	})
}

// CreateSupportTeam 创建支持团队
func (h *AdminHandler) CreateSupportTeam(c echo.Context) error {
	if err := requireAdminCapability(c, h.adminService, "support.manage"); err != nil {
		return err
	}
	var req supportTeamRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "SUPPORT_TEAM_INVALID", "请求参数无效")
	}
	team, err := h.supportRoutingService.CreateTeam(c.Request().Context(), service.SupportTeamInput{
		Name:        req.Name,
		Description: req.Description,
		Enabled:     req.Enabled,
	})
	if err != nil {
		if err == service.ErrSupportRoutingInvalid {
			return errorResponse(c, http.StatusBadRequest, "SUPPORT_TEAM_INVALID", "团队配置不合法")
		}
		return errorResponse(c, http.StatusInternalServerError, "SUPPORT_TEAM_CREATE_FAILED", "创建团队失败")
	}
	return successResponse(c, map[string]interface{}{
		"team": team,
	})
}

// UpdateSupportTeam 更新支持团队
func (h *AdminHandler) UpdateSupportTeam(c echo.Context) error {
	if err := requireAdminCapability(c, h.adminService, "support.manage"); err != nil {
		return err
	}
	teamID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "SUPPORT_TEAM_INVALID_ID", "团队 ID 无效")
	}
	var req supportTeamRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "SUPPORT_TEAM_INVALID", "请求参数无效")
	}
	team, err := h.supportRoutingService.UpdateTeam(c.Request().Context(), teamID, service.SupportTeamInput{
		Name:        req.Name,
		Description: req.Description,
		Enabled:     req.Enabled,
	})
	if err != nil {
		switch err {
		case service.ErrSupportTeamNotFound:
			return errorResponse(c, http.StatusNotFound, "SUPPORT_TEAM_NOT_FOUND", "团队不存在")
		case service.ErrSupportRoutingInvalid:
			return errorResponse(c, http.StatusBadRequest, "SUPPORT_TEAM_INVALID", "团队配置不合法")
		default:
			return errorResponse(c, http.StatusInternalServerError, "SUPPORT_TEAM_UPDATE_FAILED", "更新团队失败")
		}
	}
	return successResponse(c, map[string]interface{}{
		"team": team,
	})
}

// ListSupportTeamMembers 查询团队成员
func (h *AdminHandler) ListSupportTeamMembers(c echo.Context) error {
	if err := requireAdminCapability(c, h.adminService, "support.manage"); err != nil {
		return err
	}
	teamID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "SUPPORT_TEAM_INVALID_ID", "团队 ID 无效")
	}
	members, err := h.supportRoutingService.ListTeamMembers(c.Request().Context(), teamID)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "SUPPORT_TEAM_MEMBER_LIST_FAILED", "获取成员失败")
	}
	return successResponse(c, map[string]interface{}{
		"members": members,
	})
}

// AddSupportTeamMember 添加团队成员
func (h *AdminHandler) AddSupportTeamMember(c echo.Context) error {
	if err := requireAdminCapability(c, h.adminService, "support.manage"); err != nil {
		return err
	}
	teamID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "SUPPORT_TEAM_INVALID_ID", "团队 ID 无效")
	}
	var req supportMemberRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "SUPPORT_TEAM_MEMBER_INVALID", "请求参数无效")
	}
	userID, err := uuid.Parse(strings.TrimSpace(req.UserID))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "SUPPORT_TEAM_MEMBER_INVALID", "用户 ID 无效")
	}
	member, err := h.supportRoutingService.AddTeamMember(c.Request().Context(), teamID, service.SupportMemberInput{
		UserID:    userID,
		Role:      req.Role,
		SortOrder: req.SortOrder,
	})
	if err != nil {
		if err == service.ErrSupportRoutingInvalid {
			return errorResponse(c, http.StatusBadRequest, "SUPPORT_TEAM_MEMBER_INVALID", "成员配置不合法")
		}
		return errorResponse(c, http.StatusInternalServerError, "SUPPORT_TEAM_MEMBER_CREATE_FAILED", "添加成员失败")
	}
	return successResponse(c, map[string]interface{}{
		"member": member,
	})
}

// RemoveSupportTeamMember 移除团队成员
func (h *AdminHandler) RemoveSupportTeamMember(c echo.Context) error {
	if err := requireAdminCapability(c, h.adminService, "support.manage"); err != nil {
		return err
	}
	teamID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "SUPPORT_TEAM_INVALID_ID", "团队 ID 无效")
	}
	userID, err := uuid.Parse(c.Param("userId"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "SUPPORT_TEAM_MEMBER_INVALID", "用户 ID 无效")
	}
	if err := h.supportRoutingService.RemoveTeamMember(c.Request().Context(), teamID, userID); err != nil {
		return errorResponse(c, http.StatusInternalServerError, "SUPPORT_TEAM_MEMBER_REMOVE_FAILED", "移除成员失败")
	}
	return successResponse(c, map[string]interface{}{})
}

// ListSupportQueues 查询支持队列
func (h *AdminHandler) ListSupportQueues(c echo.Context) error {
	if err := requireAdminCapability(c, h.adminService, "support.manage"); err != nil {
		return err
	}
	includeDisabled := strings.TrimSpace(c.QueryParam("include_disabled")) == "true"
	queues, err := h.supportRoutingService.ListQueues(c.Request().Context(), includeDisabled)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "SUPPORT_QUEUE_LIST_FAILED", "获取队列失败")
	}
	return successResponse(c, map[string]interface{}{
		"queues": queues,
	})
}

// CreateSupportQueue 创建支持队列
func (h *AdminHandler) CreateSupportQueue(c echo.Context) error {
	if err := requireAdminCapability(c, h.adminService, "support.manage"); err != nil {
		return err
	}
	var req supportQueueRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "SUPPORT_QUEUE_INVALID", "请求参数无效")
	}
	queue, err := h.supportRoutingService.CreateQueue(c.Request().Context(), service.SupportQueueInput{
		Name:        req.Name,
		Description: req.Description,
		Enabled:     req.Enabled,
	})
	if err != nil {
		if err == service.ErrSupportRoutingInvalid {
			return errorResponse(c, http.StatusBadRequest, "SUPPORT_QUEUE_INVALID", "队列配置不合法")
		}
		return errorResponse(c, http.StatusInternalServerError, "SUPPORT_QUEUE_CREATE_FAILED", "创建队列失败")
	}
	return successResponse(c, map[string]interface{}{
		"queue": queue,
	})
}

// UpdateSupportQueue 更新支持队列
func (h *AdminHandler) UpdateSupportQueue(c echo.Context) error {
	if err := requireAdminCapability(c, h.adminService, "support.manage"); err != nil {
		return err
	}
	queueID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "SUPPORT_QUEUE_INVALID_ID", "队列 ID 无效")
	}
	var req supportQueueRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "SUPPORT_QUEUE_INVALID", "请求参数无效")
	}
	queue, err := h.supportRoutingService.UpdateQueue(c.Request().Context(), queueID, service.SupportQueueInput{
		Name:        req.Name,
		Description: req.Description,
		Enabled:     req.Enabled,
	})
	if err != nil {
		switch err {
		case service.ErrSupportQueueNotFound:
			return errorResponse(c, http.StatusNotFound, "SUPPORT_QUEUE_NOT_FOUND", "队列不存在")
		case service.ErrSupportRoutingInvalid:
			return errorResponse(c, http.StatusBadRequest, "SUPPORT_QUEUE_INVALID", "队列配置不合法")
		default:
			return errorResponse(c, http.StatusInternalServerError, "SUPPORT_QUEUE_UPDATE_FAILED", "更新队列失败")
		}
	}
	return successResponse(c, map[string]interface{}{
		"queue": queue,
	})
}

// ListSupportQueueMembers 查询队列成员
func (h *AdminHandler) ListSupportQueueMembers(c echo.Context) error {
	if err := requireAdminCapability(c, h.adminService, "support.manage"); err != nil {
		return err
	}
	queueID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "SUPPORT_QUEUE_INVALID_ID", "队列 ID 无效")
	}
	members, err := h.supportRoutingService.ListQueueMembers(c.Request().Context(), queueID)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "SUPPORT_QUEUE_MEMBER_LIST_FAILED", "获取成员失败")
	}
	return successResponse(c, map[string]interface{}{
		"members": members,
	})
}

// AddSupportQueueMember 添加队列成员
func (h *AdminHandler) AddSupportQueueMember(c echo.Context) error {
	if err := requireAdminCapability(c, h.adminService, "support.manage"); err != nil {
		return err
	}
	queueID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "SUPPORT_QUEUE_INVALID_ID", "队列 ID 无效")
	}
	var req supportMemberRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "SUPPORT_QUEUE_MEMBER_INVALID", "请求参数无效")
	}
	userID, err := uuid.Parse(strings.TrimSpace(req.UserID))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "SUPPORT_QUEUE_MEMBER_INVALID", "用户 ID 无效")
	}
	member, err := h.supportRoutingService.AddQueueMember(c.Request().Context(), queueID, service.SupportMemberInput{
		UserID:    userID,
		SortOrder: req.SortOrder,
	})
	if err != nil {
		if err == service.ErrSupportRoutingInvalid {
			return errorResponse(c, http.StatusBadRequest, "SUPPORT_QUEUE_MEMBER_INVALID", "成员配置不合法")
		}
		return errorResponse(c, http.StatusInternalServerError, "SUPPORT_QUEUE_MEMBER_CREATE_FAILED", "添加成员失败")
	}
	return successResponse(c, map[string]interface{}{
		"member": member,
	})
}

// RemoveSupportQueueMember 移除队列成员
func (h *AdminHandler) RemoveSupportQueueMember(c echo.Context) error {
	if err := requireAdminCapability(c, h.adminService, "support.manage"); err != nil {
		return err
	}
	queueID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "SUPPORT_QUEUE_INVALID_ID", "队列 ID 无效")
	}
	userID, err := uuid.Parse(c.Param("userId"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "SUPPORT_QUEUE_MEMBER_INVALID", "用户 ID 无效")
	}
	if err := h.supportRoutingService.RemoveQueueMember(c.Request().Context(), queueID, userID); err != nil {
		return errorResponse(c, http.StatusInternalServerError, "SUPPORT_QUEUE_MEMBER_REMOVE_FAILED", "移除成员失败")
	}
	return successResponse(c, map[string]interface{}{})
}

// GetSupportNotificationTemplates 获取通知模板配置
func (h *AdminHandler) GetSupportNotificationTemplates(c echo.Context) error {
	if err := requireAdminCapability(c, h.adminService, "support.manage"); err != nil {
		return err
	}
	templates, err := h.supportNotificationTemplateService.GetConfig(c.Request().Context())
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "SUPPORT_TEMPLATE_GET_FAILED", "获取通知模板失败")
	}
	return successResponse(c, map[string]interface{}{
		"templates": templates,
	})
}

// UpdateSupportNotificationTemplates 更新通知模板配置
func (h *AdminHandler) UpdateSupportNotificationTemplates(c echo.Context) error {
	if err := requireAdminCapability(c, h.adminService, "support.manage"); err != nil {
		return err
	}
	var req supportNotificationTemplateRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "SUPPORT_TEMPLATE_INVALID", "请求参数无效")
	}
	templates := map[string]map[string]service.SupportNotificationTemplates{}
	for channel, locales := range req.Channels {
		if locales == nil {
			continue
		}
		templates[channel] = map[string]service.SupportNotificationTemplates{}
		for locale, group := range locales {
			templates[channel][locale] = service.SupportNotificationTemplates{
				TicketCreated: service.NotificationTemplate{
					Title:   group.TicketCreated.Title,
					Content: group.TicketCreated.Content,
				},
				StatusUpdated: service.NotificationTemplate{
					Title:   group.StatusUpdated.Title,
					Content: group.StatusUpdated.Content,
				},
				CommentAdded: service.NotificationTemplate{
					Title:   group.CommentAdded.Title,
					Content: group.CommentAdded.Content,
				},
			}
		}
	}
	config, err := h.supportNotificationTemplateService.UpsertConfig(c.Request().Context(), service.SupportNotificationTemplateConfig{
		DefaultChannel: req.DefaultChannel,
		DefaultLocale:  req.DefaultLocale,
		Channels:       templates,
	})
	if err != nil {
		if err == service.ErrSupportNotificationTemplateInvalid {
			return errorResponse(c, http.StatusBadRequest, "SUPPORT_TEMPLATE_INVALID", "通知模板不合法")
		}
		return errorResponse(c, http.StatusInternalServerError, "SUPPORT_TEMPLATE_UPDATE_FAILED", "更新通知模板失败")
	}
	return successResponse(c, map[string]interface{}{
		"templates": config,
	})
}

func parseAdminID(c echo.Context) (uuid.UUID, error) {
	adminID := middleware.GetUserID(c)
	uid, err := uuid.Parse(adminID)
	if err != nil {
		return uuid.Nil, errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}
	return uid, nil
}

func isValidAnnouncementType(value string) bool {
	switch value {
	case "feature", "improvement", "notice", "warning":
		return true
	default:
		return false
	}
}

func parseAnnouncementTime(value string) (time.Time, error) {
	parsed, err := time.Parse(time.RFC3339, value)
	if err != nil {
		return time.Time{}, err
	}
	return parsed, nil
}

func buildAdminUserResponse(user *entity.User) *adminUserResponse {
	if user == nil {
		return nil
	}
	return &adminUserResponse{
		User:     user,
		RiskFlag: extractRiskFlag(user.Settings),
	}
}

func extractRiskFlag(settings entity.JSON) string {
	if settings == nil {
		return ""
	}
	if raw, ok := settings["risk_flag"]; ok {
		if value, ok := raw.(string); ok {
			return strings.TrimSpace(value)
		}
	}
	if raw, ok := settings["riskFlag"]; ok {
		if value, ok := raw.(string); ok {
			return strings.TrimSpace(value)
		}
	}
	return ""
}
