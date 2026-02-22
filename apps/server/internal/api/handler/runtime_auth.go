package handler

import (
	"fmt"
	"net/http"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/reverseai/server/internal/api/middleware"
	"github.com/reverseai/server/internal/service"
)

// RuntimeAuthHandler 应用运行时认证 Handler
type RuntimeAuthHandler struct {
	authService      service.RuntimeAuthService
	runtimeService   service.RuntimeService
	workspaceService service.WorkspaceService
}

func NewRuntimeAuthHandler(authService service.RuntimeAuthService, runtimeService ...service.RuntimeService) *RuntimeAuthHandler {
	h := &RuntimeAuthHandler{authService: authService}
	if len(runtimeService) > 0 {
		h.runtimeService = runtimeService[0]
	}
	return h
}

func (h *RuntimeAuthHandler) SetWorkspaceService(ws service.WorkspaceService) {
	h.workspaceService = ws
}

// requireMemberAccess 验证用户是 workspace 成员或 owner
func (h *RuntimeAuthHandler) requireMemberAccess(c echo.Context, workspaceID uuid.UUID) error {
	if h.workspaceService == nil {
		return nil
	}
	uid, err := uuid.Parse(middleware.GetUserID(c))
	if err != nil {
		_ = c.JSON(http.StatusForbidden, map[string]string{"error": "用户 ID 无效"})
		return fmt.Errorf("invalid_user")
	}
	access, err := h.workspaceService.GetWorkspaceAccess(c.Request().Context(), workspaceID, uid)
	if err != nil {
		_ = c.JSON(http.StatusForbidden, map[string]string{"error": "无权限访问此工作空间"})
		return err
	}
	if !access.IsOwner && access.Role == nil {
		_ = c.JSON(http.StatusForbidden, map[string]string{"error": "无权限，仅 workspace 成员可执行此操作"})
		return fmt.Errorf("write_forbidden")
	}
	return nil
}

// resolveWorkspaceID resolves workspace ID from slug param (or UUID directly)
func (h *RuntimeAuthHandler) resolveWorkspaceID(c echo.Context) (uuid.UUID, error) {
	slug := c.Param("workspaceSlug")
	// Try direct UUID parse first
	if id, err := uuid.Parse(slug); err == nil {
		return id, nil
	}
	// Resolve via runtime service (slug → workspace)
	if h.runtimeService != nil {
		entry, err := h.runtimeService.GetEntry(c.Request().Context(), slug, nil)
		if err == nil && entry != nil && entry.Workspace != nil {
			return entry.Workspace.ID, nil
		}
	}
	return uuid.Nil, echo.NewHTTPError(http.StatusBadRequest, "invalid workspace identifier")
}

type registerRequest struct {
	Email       string `json:"email" validate:"required,email"`
	Password    string `json:"password" validate:"required,min=6"`
	DisplayName string `json:"display_name"`
}

// Register 应用用户注册
func (h *RuntimeAuthHandler) Register(c echo.Context) error {
	workspaceID, err := h.resolveWorkspaceID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid workspace identifier"})
	}

	var req registerRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
	}
	if req.Email == "" || req.Password == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "email and password are required"})
	}
	if len(req.Password) < 6 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "password must be at least 6 characters"})
	}

	user, err := h.authService.Register(c.Request().Context(), workspaceID, req.Email, req.Password, req.DisplayName)
	if err != nil {
		return c.JSON(http.StatusConflict, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"code":    "success",
		"message": "registered successfully",
		"data":    user,
	})
}

type loginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

// Login 应用用户登录
func (h *RuntimeAuthHandler) Login(c echo.Context) error {
	workspaceID, err := h.resolveWorkspaceID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid workspace identifier"})
	}

	var req loginRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
	}
	if req.Email == "" || req.Password == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "email and password are required"})
	}

	result, err := h.authService.Login(c.Request().Context(), workspaceID, req.Email, req.Password)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"code":    "success",
		"message": "login successful",
		"data":    result,
	})
}

// Logout 应用用户登出
func (h *RuntimeAuthHandler) Logout(c echo.Context) error {
	token := c.Request().Header.Get("X-App-Token")
	if token == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "token is required"})
	}

	if err := h.authService.Logout(c.Request().Context(), token); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"code":    "success",
		"message": "logged out",
	})
}

// ListUsers 列出应用用户（需要 workspace 成员权限）
func (h *RuntimeAuthHandler) ListUsers(c echo.Context) error {
	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid workspace id"})
	}
	if err := h.requireMemberAccess(c, workspaceID); err != nil {
		return nil
	}

	page := 1
	pageSize := 20

	users, total, err := h.authService.ListUsers(c.Request().Context(), workspaceID, page, pageSize)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"code":    "success",
		"message": "ok",
		"data": map[string]interface{}{
			"items": users,
			"total": total,
			"page":  page,
		},
	})
}

// Me 验证 token 并返回当前应用用户信息
func (h *RuntimeAuthHandler) Me(c echo.Context) error {
	token := c.Request().Header.Get("X-App-Token")
	if token == "" {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "token is required"})
	}

	user, err := h.authService.ValidateSession(c.Request().Context(), token)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"code":    "success",
		"message": "ok",
		"data":    user,
	})
}

// BlockUser 封禁应用用户
func (h *RuntimeAuthHandler) BlockUser(c echo.Context) error {
	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid workspace id"})
	}
	if err := h.requireMemberAccess(c, workspaceID); err != nil {
		return nil
	}

	userID, err := uuid.Parse(c.Param("userId"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid user id"})
	}

	if err := h.authService.BlockUser(c.Request().Context(), userID); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"code":    "success",
		"message": "user blocked",
	})
}
