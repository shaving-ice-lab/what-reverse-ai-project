package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/api/middleware"
	"github.com/agentflow/server/internal/service"
	"github.com/labstack/echo/v4"
)

type AuthHandler struct {
	authService service.AuthService
}

func NewAuthHandler(authService service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

type RegisterRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Username string `json:"username" validate:"required,min=3,max=50"`
	Password string `json:"password" validate:"required,min=8"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

type ForgotPasswordRequest struct {
	Email string `json:"email" validate:"required,email"`
}

type ResetPasswordRequest struct {
	Token       string `json:"token" validate:"required"`
	NewPassword string `json:"new_password" validate:"required,min=8"`
}

type VerifyEmailRequest struct {
	Token string `json:"token" validate:"required"`
}

// Register 用户注册
// @Summary 用户注册
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body RegisterRequest true "注册信息"
// @Success 200 {object} map[string]interface{}
// @Router /auth/register [post]
func (h *AuthHandler) Register(c echo.Context) error {
	var req RegisterRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	user, tokenPair, err := h.authService.Register(c.Request().Context(), req.Email, req.Username, req.Password)
	if err != nil {
		switch err {
		case service.ErrEmailExists:
			return errorResponse(c, http.StatusConflict, "EMAIL_EXISTS", "邮箱已存在")
		case service.ErrUsernameExists:
			return errorResponse(c, http.StatusConflict, "USERNAME_EXISTS", "用户名已存在")
		default:
			return errorResponse(c, http.StatusInternalServerError, "INTERNAL_ERROR", "注册失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"user":          user,
		"access_token":  tokenPair.AccessToken,
		"refresh_token": tokenPair.RefreshToken,
	})
}

// Login 用户登录
// @Summary 用户登录
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body LoginRequest true "登录信息"
// @Success 200 {object} map[string]interface{}
// @Router /auth/login [post]
func (h *AuthHandler) Login(c echo.Context) error {
	var req LoginRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	user, tokenPair, err := h.authService.Login(c.Request().Context(), req.Email, req.Password)
	if err != nil {
		return errorResponse(c, http.StatusUnauthorized, "INVALID_CREDENTIALS", "邮箱或密码错误")
	}

	return successResponse(c, map[string]interface{}{
		"user":          user,
		"access_token":  tokenPair.AccessToken,
		"refresh_token": tokenPair.RefreshToken,
	})
}

// Refresh 刷新 Token
// @Summary 刷新 Token
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body RefreshRequest true "刷新 Token"
// @Success 200 {object} map[string]interface{}
// @Router /auth/refresh [post]
func (h *AuthHandler) Refresh(c echo.Context) error {
	var req RefreshRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	tokenPair, err := h.authService.Refresh(c.Request().Context(), req.RefreshToken)
	if err != nil {
		return errorResponse(c, http.StatusUnauthorized, "INVALID_TOKEN", "Token 无效或已过期")
	}

	return successResponse(c, map[string]interface{}{
		"access_token":  tokenPair.AccessToken,
		"refresh_token": tokenPair.RefreshToken,
	})
}

// Logout 用户登出
// @Summary 用户登出
// @Tags Auth
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Router /auth/logout [post]
func (h *AuthHandler) Logout(c echo.Context) error {
	userID := middleware.GetUserID(c)
	
	if err := h.authService.Logout(c.Request().Context(), userID); err != nil {
		return errorResponse(c, http.StatusInternalServerError, "INTERNAL_ERROR", "登出失败")
	}

	return successResponse(c, map[string]interface{}{
		"message": "登出成功",
	})
}

// ForgotPassword 忘记密码
// @Summary 发送密码重置邮件
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body ForgotPasswordRequest true "邮箱地址"
// @Success 200 {object} map[string]interface{}
// @Router /auth/forgot-password [post]
func (h *AuthHandler) ForgotPassword(c echo.Context) error {
	var req ForgotPasswordRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	// 调用服务层发送重置邮件
	if err := h.authService.ForgotPassword(c.Request().Context(), req.Email); err != nil {
		// 为了安全，即使用户不存在也返回成功
		// 避免泄露用户是否存在的信息
		if err != service.ErrUserNotFound {
			return errorResponse(c, http.StatusInternalServerError, "INTERNAL_ERROR", "发送邮件失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"message": "如果该邮箱已注册，您将收到密码重置邮件",
	})
}

// ResetPassword 重置密码
// @Summary 使用重置令牌重置密码
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body ResetPasswordRequest true "重置信息"
// @Success 200 {object} map[string]interface{}
// @Router /auth/reset-password [post]
func (h *AuthHandler) ResetPassword(c echo.Context) error {
	var req ResetPasswordRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	if err := h.authService.ResetPassword(c.Request().Context(), req.Token, req.NewPassword); err != nil {
		switch err {
		case service.ErrInvalidToken:
			return errorResponse(c, http.StatusBadRequest, "INVALID_TOKEN", "重置链接无效或已过期")
		case service.ErrTokenExpired:
			return errorResponse(c, http.StatusBadRequest, "TOKEN_EXPIRED", "重置链接已过期，请重新申请")
		default:
			return errorResponse(c, http.StatusInternalServerError, "INTERNAL_ERROR", "重置密码失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"message": "密码重置成功，请使用新密码登录",
	})
}

// VerifyEmail 验证邮箱
// @Summary 验证用户邮箱
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body VerifyEmailRequest true "验证令牌"
// @Success 200 {object} map[string]interface{}
// @Router /auth/verify-email [post]
func (h *AuthHandler) VerifyEmail(c echo.Context) error {
	var req VerifyEmailRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	if err := h.authService.VerifyEmail(c.Request().Context(), req.Token); err != nil {
		switch err {
		case service.ErrInvalidToken:
			return errorResponse(c, http.StatusBadRequest, "INVALID_TOKEN", "验证链接无效")
		case service.ErrTokenExpired:
			return errorResponse(c, http.StatusBadRequest, "TOKEN_EXPIRED", "验证链接已过期")
		default:
			return errorResponse(c, http.StatusInternalServerError, "INTERNAL_ERROR", "验证邮箱失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"message": "邮箱验证成功",
	})
}

// ResendVerification 重新发送验证邮件
// @Summary 重新发送验证邮件
// @Tags Auth
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Router /auth/resend-verification [post]
func (h *AuthHandler) ResendVerification(c echo.Context) error {
	userID := middleware.GetUserID(c)

	if err := h.authService.ResendVerification(c.Request().Context(), userID); err != nil {
		if err == service.ErrAlreadyVerified {
			return errorResponse(c, http.StatusBadRequest, "ALREADY_VERIFIED", "邮箱已经验证过了")
		}
		return errorResponse(c, http.StatusInternalServerError, "INTERNAL_ERROR", "发送验证邮件失败")
	}

	return successResponse(c, map[string]interface{}{
		"message": "验证邮件已发送，请查收",
	})
}
