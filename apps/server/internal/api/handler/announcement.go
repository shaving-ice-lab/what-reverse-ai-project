package handler

import (
	"net/http"
	"strconv"

	"github.com/agentflow/server/internal/api/middleware"
	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type AnnouncementHandler struct {
	announcementService service.AnnouncementService
}

func NewAnnouncementHandler(announcementService service.AnnouncementService) *AnnouncementHandler {
	return &AnnouncementHandler{announcementService: announcementService}
}

// List 获取公告列表
// @Summary 获取公告列表
// @Tags Announcement
// @Param type query string false "公告类型"
// @Param page query int false "页码"
// @Param page_size query int false "每页数量"
// @Success 200 {array} service.AnnouncementResponse
// @Router /api/v1/announcements [get]
func (h *AnnouncementHandler) List(c echo.Context) error {
	// 尝试获取用户 ID（可选，用于已读状态）
	var userID *uuid.UUID
	if uid := middleware.GetUserID(c); uid != "" {
		if parsed, err := uuid.Parse(uid); err == nil {
			userID = &parsed
		}
	}

	page := 1
	if p := c.QueryParam("page"); p != "" {
		if parsed, err := strconv.Atoi(p); err == nil && parsed > 0 {
			page = parsed
		}
	}

	pageSize := 20
	if ps := c.QueryParam("page_size"); ps != "" {
		if parsed, err := strconv.Atoi(ps); err == nil && parsed > 0 && parsed <= 100 {
			pageSize = parsed
		}
	}

	announcements, total, err := h.announcementService.List(c.Request().Context(), service.AnnouncementListParams{
		Type:     c.QueryParam("type"),
		UserID:   userID,
		Page:     page,
		PageSize: pageSize,
	})
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取公告列表失败")
	}

	return successResponseWithMeta(c, announcements, map[string]interface{}{
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// Create 创建公告
// @Summary 创建公告（管理员）
// @Tags Announcement
// @Security BearerAuth
// @Param body body CreateAnnouncementRequest true "公告信息"
// @Success 200 {object} entity.Announcement
// @Router /api/v1/announcements [post]
func (h *AnnouncementHandler) Create(c echo.Context) error {
	var req CreateAnnouncementRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	announcement := &entity.Announcement{
		Title:       req.Title,
		Description: req.Description,
		Type:        req.Type,
		Priority:    req.Priority,
		IsActive:    true,
	}

	if err := h.announcementService.Create(c.Request().Context(), announcement); err != nil {
		return errorResponse(c, http.StatusInternalServerError, "CREATE_FAILED", "创建公告失败")
	}

	return successResponse(c, announcement)
}

// MarkAsRead 标记公告为已读
// @Summary 标记公告为已读
// @Tags Announcement
// @Security BearerAuth
// @Param id path string true "公告 ID"
// @Success 200 {object} SuccessResponse
// @Router /api/v1/announcements/{id}/read [post]
func (h *AnnouncementHandler) MarkAsRead(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	announcementID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "公告 ID 无效")
	}

	if err := h.announcementService.MarkAsRead(c.Request().Context(), announcementID, uid); err != nil {
		return errorResponse(c, http.StatusInternalServerError, "MARK_FAILED", "标记已读失败")
	}

	return successResponse(c, map[string]string{"message": "已标记为已读"})
}

// CreateAnnouncementRequest 创建公告请求
type CreateAnnouncementRequest struct {
	Title       string `json:"title" validate:"required"`
	Description string `json:"description" validate:"required"`
	Type        string `json:"type" validate:"required,oneof=feature improvement notice warning"`
	Priority    int    `json:"priority"`
}
