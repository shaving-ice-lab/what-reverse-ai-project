package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/api/middleware"
	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type UserHandler struct {
	userService   service.UserService
	apiKeyService service.APIKeyService
}

func NewUserHandler(userService service.UserService, apiKeyService service.APIKeyService) *UserHandler {
	return &UserHandler{
		userService:   userService,
		apiKeyService: apiKeyService,
	}
}

type UpdateUserRequest struct {
	DisplayName *string                `json:"display_name"`
	Bio         *string                `json:"bio"`
	AvatarURL   *string                `json:"avatar_url"`
	Settings    map[string]interface{} `json:"settings"`
}

type ChangePasswordRequest struct {
	OldPassword string `json:"old_password" validate:"required"`
	NewPassword string `json:"new_password" validate:"required,min=8"`
}

// GetMe 获取当前用户
func (h *UserHandler) GetMe(c echo.Context) error {
	userID := middleware.GetUserID(c)
	id, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	user, err := h.userService.GetByID(c.Request().Context(), id)
	if err != nil {
		return errorResponse(c, http.StatusNotFound, "USER_NOT_FOUND", "用户不存在")
	}

	return successResponse(c, user)
}

// UpdateMe 更新当前用户
func (h *UserHandler) UpdateMe(c echo.Context) error {
	userID := middleware.GetUserID(c)
	id, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var req UpdateUserRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	user, err := h.userService.Update(c.Request().Context(), id, service.UpdateUserRequest{
		DisplayName: req.DisplayName,
		Bio:         req.Bio,
		AvatarURL:   req.AvatarURL,
	})
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "UPDATE_FAILED", "更新失败")
	}

	return successResponse(c, user)
}

// ChangePassword 修改密码
func (h *UserHandler) ChangePassword(c echo.Context) error {
	userID := middleware.GetUserID(c)
	id, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var req ChangePasswordRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	if err := h.userService.ChangePassword(c.Request().Context(), id, req.OldPassword, req.NewPassword); err != nil {
		if err == service.ErrInvalidCredentials {
			return errorResponse(c, http.StatusBadRequest, "INVALID_PASSWORD", "原密码错误")
		}
		return errorResponse(c, http.StatusInternalServerError, "CHANGE_FAILED", "修改失败")
	}

	return successResponse(c, map[string]string{"message": "密码修改成功"})
}

// CreateAPIKeyRequest 创建 API 密钥请求
type CreateAPIKeyRequest struct {
	Provider string   `json:"provider" validate:"required"`
	Name     string   `json:"name" validate:"required"`
	Key      string   `json:"key" validate:"required"`
	Scopes   []string `json:"scopes"`
}

// RotateAPIKeyRequest 轮换 API 密钥请求
type RotateAPIKeyRequest struct {
	Name   *string  `json:"name"`
	Key    string   `json:"key" validate:"required"`
	Scopes []string `json:"scopes"`
}

// RevokeAPIKeyRequest 吊销 API 密钥请求
type RevokeAPIKeyRequest struct {
	Reason string `json:"reason"`
}

// TestAPIKeyRequest 测试 API 密钥请求
type TestAPIKeyRequest struct {
	Provider string `json:"provider" validate:"required"`
	Key      string `json:"key" validate:"required"`
}

// APIKeyResponse API 密钥响应
type APIKeyResponse struct {
	ID            uuid.UUID `json:"id"`
	Provider      string    `json:"provider"`
	Name          string    `json:"name"`
	KeyPreview    *string   `json:"key_preview"`
	Scopes        []string  `json:"scopes"`
	IsActive      bool      `json:"is_active"`
	LastUsedAt    *string   `json:"last_used_at"`
	LastRotatedAt *string   `json:"last_rotated_at"`
	RevokedAt     *string   `json:"revoked_at"`
	RevokedReason *string   `json:"revoked_reason"`
	CreatedAt     string    `json:"created_at"`
}

// toAPIKeyResponse 转换为响应格式
func toAPIKeyResponse(apiKey entity.APIKey) APIKeyResponse {
	resp := APIKeyResponse{
		ID:         apiKey.ID,
		Provider:   apiKey.Provider,
		Name:       apiKey.Name,
		KeyPreview: apiKey.KeyPreview,
		Scopes:     []string(apiKey.Scopes),
		IsActive:   apiKey.IsActive,
		CreatedAt:  apiKey.CreatedAt.Format("2006-01-02T15:04:05Z"),
	}
	if apiKey.LastUsedAt != nil {
		lastUsed := apiKey.LastUsedAt.Format("2006-01-02T15:04:05Z")
		resp.LastUsedAt = &lastUsed
	}
	if apiKey.LastRotatedAt != nil {
		lastRotated := apiKey.LastRotatedAt.Format("2006-01-02T15:04:05Z")
		resp.LastRotatedAt = &lastRotated
	}
	if apiKey.RevokedAt != nil {
		revokedAt := apiKey.RevokedAt.Format("2006-01-02T15:04:05Z")
		resp.RevokedAt = &revokedAt
	}
	if apiKey.RevokedReason != nil {
		resp.RevokedReason = apiKey.RevokedReason
	}
	return resp
}

// ListAPIKeys 获取 API 密钥列表
func (h *UserHandler) ListAPIKeys(c echo.Context) error {
	userID := middleware.GetUserID(c)
	id, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	apiKeys, err := h.apiKeyService.List(c.Request().Context(), id)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取密钥列表失败")
	}

	// 转换为响应格式
	response := make([]APIKeyResponse, len(apiKeys))
	for i, key := range apiKeys {
		response[i] = toAPIKeyResponse(key)
	}

	return successResponse(c, response)
}

// CreateAPIKey 创建 API 密钥
func (h *UserHandler) CreateAPIKey(c echo.Context) error {
	userID := middleware.GetUserID(c)
	id, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var req CreateAPIKeyRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	// 验证提供商
	if !entity.IsValidProvider(req.Provider) {
		return errorResponse(c, http.StatusBadRequest, "INVALID_PROVIDER", "不支持的提供商")
	}

	apiKey, err := h.apiKeyService.Create(c.Request().Context(), id, service.CreateAPIKeyRequest{
		Provider: req.Provider,
		Name:     req.Name,
		Key:      req.Key,
		Scopes:   req.Scopes,
	})
	if err != nil {
		if err == service.ErrInvalidAPIKey {
			return errorResponse(c, http.StatusBadRequest, "INVALID_KEY", "密钥格式无效")
		}
		return errorResponse(c, http.StatusInternalServerError, "CREATE_FAILED", "创建密钥失败")
	}

	return successResponse(c, toAPIKeyResponse(*apiKey))
}

// RotateAPIKey 轮换 API 密钥
func (h *UserHandler) RotateAPIKey(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	keyID := c.Param("id")
	kid, err := uuid.Parse(keyID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_KEY_ID", "密钥 ID 无效")
	}

	var req RotateAPIKeyRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	apiKey, err := h.apiKeyService.Rotate(c.Request().Context(), uid, kid, service.RotateAPIKeyRequest{
		Name:   req.Name,
		Key:    req.Key,
		Scopes: req.Scopes,
	})
	if err != nil {
		if err == service.ErrAPIKeyNotFound {
			return errorResponse(c, http.StatusNotFound, "KEY_NOT_FOUND", "密钥不存在")
		}
		if err == service.ErrInvalidAPIKey {
			return errorResponse(c, http.StatusBadRequest, "INVALID_KEY", "密钥格式无效")
		}
		if err == service.ErrUnauthorized {
			return errorResponse(c, http.StatusForbidden, "UNAUTHORIZED", "无权轮换此密钥")
		}
		return errorResponse(c, http.StatusInternalServerError, "ROTATE_FAILED", "轮换密钥失败")
	}

	return successResponse(c, toAPIKeyResponse(*apiKey))
}

// RevokeAPIKey 吊销 API 密钥
func (h *UserHandler) RevokeAPIKey(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	keyID := c.Param("id")
	kid, err := uuid.Parse(keyID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_KEY_ID", "密钥 ID 无效")
	}

	var req RevokeAPIKeyRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	apiKey, err := h.apiKeyService.Revoke(c.Request().Context(), uid, kid, req.Reason)
	if err != nil {
		if err == service.ErrAPIKeyNotFound {
			return errorResponse(c, http.StatusNotFound, "KEY_NOT_FOUND", "密钥不存在")
		}
		if err == service.ErrUnauthorized {
			return errorResponse(c, http.StatusForbidden, "UNAUTHORIZED", "无权吊销此密钥")
		}
		return errorResponse(c, http.StatusInternalServerError, "REVOKE_FAILED", "吊销密钥失败")
	}

	return successResponse(c, toAPIKeyResponse(*apiKey))
}

// DeleteAPIKey 删除 API 密钥
func (h *UserHandler) DeleteAPIKey(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	keyID := c.Param("id")
	kid, err := uuid.Parse(keyID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_KEY_ID", "密钥 ID 无效")
	}

	if err := h.apiKeyService.Delete(c.Request().Context(), kid, uid); err != nil {
		if err == service.ErrAPIKeyNotFound {
			return errorResponse(c, http.StatusNotFound, "KEY_NOT_FOUND", "密钥不存在")
		}
		if err == service.ErrUnauthorized {
			return errorResponse(c, http.StatusForbidden, "UNAUTHORIZED", "无权删除此密钥")
		}
		return errorResponse(c, http.StatusInternalServerError, "DELETE_FAILED", "删除密钥失败")
	}

	return successResponse(c, map[string]string{"message": "密钥已删除"})
}

// TestSavedAPIKey 测试已保存的 API 密钥（服务端解密后校验）
func (h *UserHandler) TestSavedAPIKey(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	keyID := c.Param("id")
	kid, err := uuid.Parse(keyID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_KEY_ID", "密钥 ID 无效")
	}

	keys, err := h.apiKeyService.List(c.Request().Context(), uid)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取密钥列表失败")
	}

	var provider string
	found := false
	for _, key := range keys {
		if key.ID == kid {
			provider = key.Provider
			found = true
			break
		}
	}
	if !found {
		return errorResponse(c, http.StatusNotFound, "KEY_NOT_FOUND", "密钥不存在")
	}

	decrypted, err := h.apiKeyService.GetDecrypted(c.Request().Context(), uid, provider)
	if err != nil {
		if err == service.ErrAPIKeyNotFound {
			return errorResponse(c, http.StatusNotFound, "KEY_NOT_FOUND", "密钥不存在")
		}
		if err == service.ErrUnauthorized {
			return errorResponse(c, http.StatusForbidden, "UNAUTHORIZED", "无权测试此密钥")
		}
		return errorResponse(c, http.StatusInternalServerError, "DECRYPT_FAILED", "读取密钥失败")
	}

	valid, err := h.apiKeyService.TestKey(c.Request().Context(), provider, decrypted)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "TEST_FAILED", "测试密钥失败")
	}

	return successResponse(c, map[string]interface{}{
		"valid":    valid,
		"provider": provider,
		"message":  map[bool]string{true: "密钥格式有效", false: "密钥格式无效"}[valid],
	})
}

// TestAPIKey 测试 API 密钥
func (h *UserHandler) TestAPIKey(c echo.Context) error {
	var req TestAPIKeyRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	// 验证提供商
	if !entity.IsValidProvider(req.Provider) {
		return errorResponse(c, http.StatusBadRequest, "INVALID_PROVIDER", "不支持的提供商")
	}

	valid, err := h.apiKeyService.TestKey(c.Request().Context(), req.Provider, req.Key)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "TEST_FAILED", "测试密钥失败")
	}

	return successResponse(c, map[string]interface{}{
		"valid":    valid,
		"provider": req.Provider,
		"message":  map[bool]string{true: "密钥格式有效", false: "密钥格式无效"}[valid],
	})
}
