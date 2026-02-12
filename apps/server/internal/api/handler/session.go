package handler

import (
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/reverseai/server/internal/api/middleware"
	"github.com/reverseai/server/internal/service"
)

type SessionHandler struct {
	sessionService service.SessionService
}

func NewSessionHandler(sessionService service.SessionService) *SessionHandler {
	return &SessionHandler{sessionService: sessionService}
}

// ListDevices 获取登录设备列表
// @Summary 获取用户登录设备列表
// @Tags Device
// @Security BearerAuth
// @Success 200 {array} entity.LoginDevice
// @Router /api/v1/users/me/devices [get]
func (h *SessionHandler) ListDevices(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	// 从 Authorization header 获取当前 token
	token := ""
	auth := c.Request().Header.Get("Authorization")
	if strings.HasPrefix(auth, "Bearer ") {
		token = strings.TrimPrefix(auth, "Bearer ")
	}

	devices, err := h.sessionService.GetDevices(c.Request().Context(), uid, token)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取设备列表失败")
	}

	return successResponse(c, devices)
}

// LogoutDevice 登出指定设备
// @Summary 登出指定设备
// @Tags Device
// @Security BearerAuth
// @Param id path string true "设备/会话 ID"
// @Success 200 {object} SuccessResponse
// @Router /api/v1/users/me/devices/{id} [delete]
func (h *SessionHandler) LogoutDevice(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	sessionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "设备 ID 无效")
	}

	if err := h.sessionService.LogoutDevice(c.Request().Context(), uid, sessionID); err != nil {
		switch err {
		case service.ErrSessionNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "设备不存在")
		case service.ErrUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限操作")
		default:
			return errorResponse(c, http.StatusInternalServerError, "LOGOUT_FAILED", "登出失败")
		}
	}

	return successResponse(c, map[string]string{"message": "已成功登出该设备"})
}

// LogoutOtherDevices 登出所有其他设备
// @Summary 登出所有其他设备
// @Tags Device
// @Security BearerAuth
// @Success 200 {object} SuccessResponse
// @Router /api/v1/users/me/devices/others [delete]
func (h *SessionHandler) LogoutOtherDevices(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	// 从 Authorization header 获取当前 token
	token := ""
	auth := c.Request().Header.Get("Authorization")
	if strings.HasPrefix(auth, "Bearer ") {
		token = strings.TrimPrefix(auth, "Bearer ")
	}

	if err := h.sessionService.LogoutOtherDevices(c.Request().Context(), uid, token); err != nil {
		return errorResponse(c, http.StatusInternalServerError, "LOGOUT_FAILED", "登出失败")
	}

	return successResponse(c, map[string]string{"message": "已成功登出所有其他设备"})
}
