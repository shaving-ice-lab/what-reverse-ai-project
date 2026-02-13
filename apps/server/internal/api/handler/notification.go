package handler

import (
	"net/http"
	"strconv"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/reverseai/server/internal/api/middleware"
	"github.com/reverseai/server/internal/service"
)

type NotificationHandler struct {
	notificationService service.NotificationService
}

func NewNotificationHandler(notificationService service.NotificationService) *NotificationHandler {
	return &NotificationHandler{notificationService: notificationService}
}

// List 获取通知列表
// @Summary 获取用户通知列表
// @Tags Notification
// @Security BearerAuth
// @Param type query string false "通知类型 (follow/comment/reply/like/mention/system/income)"
// @Param is_read query bool false "是否已读"
// @Param page query int false "页码"
// @Param page_size query int false "每页数量"
// @Success 200 {object} SuccessResponse
// @Router /api/v1/notifications [get]
func (h *NotificationHandler) List(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	// 解析查询参数
	var notificationType *string
	if t := c.QueryParam("type"); t != "" {
		notificationType = &t
	}

	var isRead *bool
	if r := c.QueryParam("is_read"); r != "" {
		b := r == "true"
		isRead = &b
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

	result, err := h.notificationService.List(c.Request().Context(), uid, &service.ListNotificationRequest{
		Type:     notificationType,
		IsRead:   isRead,
		Page:     page,
		PageSize: pageSize,
	})
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取通知列表失败")
	}

	return successResponseWithMeta(c, result.Items, map[string]interface{}{
		"total":       result.Total,
		"page":        result.Page,
		"page_size":   result.PageSize,
		"total_pages": result.TotalPages,
	})
}

// GetByID 获取通知详情
// @Summary 获取通知详情
// @Tags Notification
// @Security BearerAuth
// @Param id path string true "通知 ID"
// @Success 200 {object} SuccessResponse
// @Router /api/v1/notifications/{id} [get]
func (h *NotificationHandler) GetByID(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	notificationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_NOTIFICATION_ID", "通知 ID 无效")
	}

	notification, err := h.notificationService.GetByID(c.Request().Context(), uid, notificationID)
	if err != nil {
		if err == service.ErrNotificationNotFound {
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "通知不存在")
		}
		if err == service.ErrNotificationAccessDenied {
			return errorResponse(c, http.StatusForbidden, "ACCESS_DENIED", "无权访问此通知")
		}
		return errorResponse(c, http.StatusInternalServerError, "GET_FAILED", "获取通知详情失败")
	}

	return successResponse(c, notification)
}

// MarkAsRead 标记通知为已读
// @Summary 标记通知为已读
// @Tags Notification
// @Security BearerAuth
// @Param id path string true "通知 ID"
// @Success 200 {object} SuccessResponse
// @Router /api/v1/notifications/{id}/read [post]
func (h *NotificationHandler) MarkAsRead(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	notificationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_NOTIFICATION_ID", "通知 ID 无效")
	}

	err = h.notificationService.MarkAsRead(c.Request().Context(), uid, notificationID)
	if err != nil {
		if err == service.ErrNotificationNotFound {
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "通知不存在")
		}
		if err == service.ErrNotificationAccessDenied {
			return errorResponse(c, http.StatusForbidden, "ACCESS_DENIED", "无权访问此通知")
		}
		return errorResponse(c, http.StatusInternalServerError, "UPDATE_FAILED", "标记已读失败")
	}

	return successResponse(c, map[string]string{"message": "已标记为已读"})
}

// MarkAllAsRead 标记所有通知为已读
// @Summary 标记所有通知为已读
// @Tags Notification
// @Security BearerAuth
// @Param type query string false "通知类型（可选，不传则标记全部）"
// @Success 200 {object} SuccessResponse
// @Router /api/v1/notifications/read-all [post]
func (h *NotificationHandler) MarkAllAsRead(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var notificationType *string
	if t := c.QueryParam("type"); t != "" {
		notificationType = &t
	}

	err = h.notificationService.MarkAllAsRead(c.Request().Context(), uid, notificationType)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "UPDATE_FAILED", "标记全部已读失败")
	}

	return successResponse(c, map[string]string{"message": "已全部标记为已读"})
}

// MarkMultipleAsReadRequest 批量标记已读请求
type MarkMultipleAsReadRequest struct {
	IDs []string `json:"ids" validate:"required,min=1"`
}

// MarkMultipleAsRead 批量标记通知为已读
// @Summary 批量标记通知为已读
// @Tags Notification
// @Security BearerAuth
// @Param body body MarkMultipleAsReadRequest true "通知 ID 列表"
// @Success 200 {object} SuccessResponse
// @Router /api/v1/notifications/read-multiple [post]
func (h *NotificationHandler) MarkMultipleAsRead(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var req MarkMultipleAsReadRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求格式无效")
	}

	if len(req.IDs) == 0 {
		return errorResponse(c, http.StatusBadRequest, "EMPTY_IDS", "通知 ID 列表不能为空")
	}

	ids := make([]uuid.UUID, 0, len(req.IDs))
	for _, idStr := range req.IDs {
		id, err := uuid.Parse(idStr)
		if err != nil {
			continue
		}
		ids = append(ids, id)
	}

	err = h.notificationService.MarkMultipleAsRead(c.Request().Context(), uid, ids)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "UPDATE_FAILED", "批量标记已读失败")
	}

	return successResponse(c, map[string]string{"message": "已批量标记为已读"})
}

// Delete 删除通知
// @Summary 删除通知
// @Tags Notification
// @Security BearerAuth
// @Param id path string true "通知 ID"
// @Success 200 {object} SuccessResponse
// @Router /api/v1/notifications/{id} [delete]
func (h *NotificationHandler) Delete(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	notificationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_NOTIFICATION_ID", "通知 ID 无效")
	}

	err = h.notificationService.Delete(c.Request().Context(), uid, notificationID)
	if err != nil {
		if err == service.ErrNotificationNotFound {
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "通知不存在")
		}
		if err == service.ErrNotificationAccessDenied {
			return errorResponse(c, http.StatusForbidden, "ACCESS_DENIED", "无权删除此通知")
		}
		return errorResponse(c, http.StatusInternalServerError, "DELETE_FAILED", "删除通知失败")
	}

	return successResponse(c, map[string]string{"message": "通知已删除"})
}

// ClearAll 清空通知
// @Summary 清空所有通知
// @Tags Notification
// @Security BearerAuth
// @Param type query string false "通知类型（可选，不传则清空全部）"
// @Success 200 {object} SuccessResponse
// @Router /api/v1/notifications/clear [delete]
func (h *NotificationHandler) ClearAll(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var notificationType *string
	if t := c.QueryParam("type"); t != "" {
		notificationType = &t
	}

	err = h.notificationService.ClearAll(c.Request().Context(), uid, notificationType)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "CLEAR_FAILED", "清空通知失败")
	}

	return successResponse(c, map[string]string{"message": "通知已清空"})
}

// GetUnreadCount 获取未读数
// @Summary 获取未读通知数量
// @Tags Notification
// @Security BearerAuth
// @Success 200 {object} SuccessResponse
// @Router /api/v1/notifications/unread-count [get]
func (h *NotificationHandler) GetUnreadCount(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	result, err := h.notificationService.GetUnreadCountByType(c.Request().Context(), uid)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "GET_FAILED", "获取未读数失败")
	}

	return successResponse(c, result)
}
