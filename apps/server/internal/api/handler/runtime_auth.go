package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// RuntimeAuthHandler 应用运行时认证 Handler
type RuntimeAuthHandler struct {
	authService service.RuntimeAuthService
}

func NewRuntimeAuthHandler(authService service.RuntimeAuthService) *RuntimeAuthHandler {
	return &RuntimeAuthHandler{authService: authService}
}

type registerRequest struct {
	Email       string `json:"email" validate:"required,email"`
	Password    string `json:"password" validate:"required,min=6"`
	DisplayName string `json:"display_name"`
}

// Register 应用用户注册
func (h *RuntimeAuthHandler) Register(c echo.Context) error {
	workspaceID, err := uuid.Parse(c.Param("workspaceSlug"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid workspace id"})
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
	workspaceID, err := uuid.Parse(c.Param("workspaceSlug"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid workspace id"})
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

// ListUsers 列出应用用户（需要 workspace owner 权限）
func (h *RuntimeAuthHandler) ListUsers(c echo.Context) error {
	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid workspace id"})
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

// BlockUser 封禁应用用户
func (h *RuntimeAuthHandler) BlockUser(c echo.Context) error {
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
