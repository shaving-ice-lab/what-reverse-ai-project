package handler

import (
	"net/http"
	"time"

	"github.com/agentflow/server/internal/api/middleware"
	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// SecretHandler 机密管理处理器
type SecretHandler struct {
	secretService service.SecretService
}

// NewSecretHandler 创建机密管理处理器
func NewSecretHandler(secretService service.SecretService) *SecretHandler {
	return &SecretHandler{secretService: secretService}
}

// CreateSecretRequest 创建机密请求
type CreateSecretRequest struct {
	OwnerType   string            `json:"owner_type"`
	OwnerID     *string           `json:"owner_id"`
	SecretType  string            `json:"secret_type" validate:"required"`
	Name        string            `json:"name" validate:"required"`
	Description *string           `json:"description"`
	Value       string            `json:"value" validate:"required"`
	ExpiresAt   *string           `json:"expires_at"`
	Metadata    map[string]string `json:"metadata"`
}

// RotateSecretRequest 轮换机密请求
type RotateSecretRequest struct {
	Value string `json:"value" validate:"required"`
}

// RevokeSecretRequest 吊销机密请求
type RevokeSecretRequest struct {
	Reason string `json:"reason"`
}

// SecretResponse 机密响应
type SecretResponse struct {
	ID            uuid.UUID              `json:"id"`
	OwnerType     string                 `json:"owner_type"`
	OwnerID       uuid.UUID              `json:"owner_id"`
	SecretType    string                 `json:"secret_type"`
	Name          string                 `json:"name"`
	Description   *string                `json:"description,omitempty"`
	Status        string                 `json:"status"`
	ValuePreview  *string                `json:"value_preview,omitempty"`
	ExpiresAt     *string                `json:"expires_at,omitempty"`
	LastUsedAt    *string                `json:"last_used_at,omitempty"`
	LastRotatedAt *string                `json:"last_rotated_at,omitempty"`
	RevokedAt     *string                `json:"revoked_at,omitempty"`
	RevokedReason *string                `json:"revoked_reason,omitempty"`
	Metadata      map[string]interface{} `json:"metadata,omitempty"`
	CreatedAt     string                 `json:"created_at"`
	UpdatedAt     string                 `json:"updated_at"`
}

// ListSecrets 获取机密列表
// @Summary 获取机密列表
// @Tags Secrets
// @Produce json
// @Param owner_type query string false "owner type: user/workspace"
// @Param owner_id query string false "owner id"
// @Param secret_type query string false "secret type"
// @Param status query string false "status"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/secrets [get]
func (h *SecretHandler) ListSecrets(c echo.Context) error {
	userID := middleware.GetUserID(c)
	actorID, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	ownerType := c.QueryParam("owner_type")
	ownerIDParam := c.QueryParam("owner_id")
	var ownerID *uuid.UUID
	if ownerIDParam != "" {
		parsed, err := uuid.Parse(ownerIDParam)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_OWNER_ID", "Owner ID 无效")
		}
		ownerID = &parsed
	}
	secretType := c.QueryParam("secret_type")
	status := c.QueryParam("status")

	var secretTypePtr *string
	if secretType != "" {
		secretTypePtr = &secretType
	}
	var statusPtr *string
	if status != "" {
		statusPtr = &status
	}

	secrets, err := h.secretService.List(c.Request().Context(), actorID, service.SecretFilter{
		OwnerType:  ownerType,
		OwnerID:    ownerID,
		SecretType: secretTypePtr,
		Status:     statusPtr,
	})
	if err != nil {
		switch err {
		case service.ErrInvalidOwnerType, service.ErrInvalidScope:
			return errorResponse(c, http.StatusBadRequest, "INVALID_OWNER", "Owner 类型无效")
		case service.ErrUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权访问该机密")
		default:
			return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取机密列表失败")
		}
	}

	resp := make([]SecretResponse, 0, len(secrets))
	for _, secret := range secrets {
		resp = append(resp, toSecretResponse(secret))
	}
	return successResponse(c, resp)
}

// CreateSecret 创建机密
// @Summary 创建机密
// @Tags Secrets
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/secrets [post]
func (h *SecretHandler) CreateSecret(c echo.Context) error {
	userID := middleware.GetUserID(c)
	actorID, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var req CreateSecretRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	var ownerID *uuid.UUID
	if req.OwnerID != nil && *req.OwnerID != "" {
		parsed, err := uuid.Parse(*req.OwnerID)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_OWNER_ID", "Owner ID 无效")
		}
		ownerID = &parsed
	}

	var expiresAt *time.Time
	if req.ExpiresAt != nil && *req.ExpiresAt != "" {
		t, err := time.Parse(time.RFC3339, *req.ExpiresAt)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_EXPIRES_AT", "过期时间格式无效")
		}
		expiresAt = &t
	}

	secret, err := h.secretService.Create(c.Request().Context(), actorID, service.CreateSecretRequest{
		OwnerType:   req.OwnerType,
		OwnerID:     ownerID,
		SecretType:  req.SecretType,
		Name:        req.Name,
		Description: req.Description,
		Value:       req.Value,
		ExpiresAt:   expiresAt,
		Metadata:    req.Metadata,
	})
	if err != nil {
		if err == service.ErrInvalidSecret || err == service.ErrInvalidOwnerType || err == service.ErrInvalidScope {
			return errorResponse(c, http.StatusBadRequest, "INVALID_SECRET", "机密参数无效")
		}
		if err == service.ErrUnauthorized {
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权创建机密")
		}
		return errorResponse(c, http.StatusInternalServerError, "CREATE_FAILED", "创建机密失败")
	}

	return successResponse(c, toSecretResponse(*secret))
}

// GetSecret 获取机密
// @Summary 获取机密
// @Tags Secrets
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/secrets/{id} [get]
func (h *SecretHandler) GetSecret(c echo.Context) error {
	userID := middleware.GetUserID(c)
	actorID, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}
	secretID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_SECRET_ID", "机密 ID 无效")
	}

	secret, err := h.secretService.Get(c.Request().Context(), actorID, secretID)
	if err != nil {
		if err == service.ErrSecretNotFound {
			return errorResponse(c, http.StatusNotFound, "SECRET_NOT_FOUND", "机密不存在")
		}
		if err == service.ErrUnauthorized {
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权访问该机密")
		}
		return errorResponse(c, http.StatusInternalServerError, "GET_FAILED", "获取机密失败")
	}

	return successResponse(c, toSecretResponse(*secret))
}

// RotateSecret 轮换机密
// @Summary 轮换机密
// @Tags Secrets
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/secrets/{id}/rotate [post]
func (h *SecretHandler) RotateSecret(c echo.Context) error {
	userID := middleware.GetUserID(c)
	actorID, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}
	secretID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_SECRET_ID", "机密 ID 无效")
	}

	var req RotateSecretRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	secret, err := h.secretService.Rotate(c.Request().Context(), actorID, secretID, req.Value)
	if err != nil {
		switch err {
		case service.ErrSecretNotFound:
			return errorResponse(c, http.StatusNotFound, "SECRET_NOT_FOUND", "机密不存在")
		case service.ErrSecretRevoked:
			return errorResponse(c, http.StatusBadRequest, "SECRET_REVOKED", "机密已吊销")
		case service.ErrUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权轮换机密")
		case service.ErrInvalidSecret:
			return errorResponse(c, http.StatusBadRequest, "INVALID_SECRET", "机密参数无效")
		default:
			return errorResponse(c, http.StatusInternalServerError, "ROTATE_FAILED", "轮换机密失败")
		}
	}

	return successResponse(c, toSecretResponse(*secret))
}

// RevokeSecret 吊销机密
// @Summary 吊销机密
// @Tags Secrets
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/secrets/{id}/revoke [post]
func (h *SecretHandler) RevokeSecret(c echo.Context) error {
	userID := middleware.GetUserID(c)
	actorID, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}
	secretID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_SECRET_ID", "机密 ID 无效")
	}

	var req RevokeSecretRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	secret, err := h.secretService.Revoke(c.Request().Context(), actorID, secretID, req.Reason)
	if err != nil {
		switch err {
		case service.ErrSecretNotFound:
			return errorResponse(c, http.StatusNotFound, "SECRET_NOT_FOUND", "机密不存在")
		case service.ErrUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权吊销机密")
		default:
			return errorResponse(c, http.StatusInternalServerError, "REVOKE_FAILED", "吊销机密失败")
		}
	}

	return successResponse(c, toSecretResponse(*secret))
}

func toSecretResponse(secret entity.Secret) SecretResponse {
	resp := SecretResponse{
		ID:           secret.ID,
		OwnerType:    secret.OwnerType,
		OwnerID:      secret.OwnerID,
		SecretType:   secret.SecretType,
		Name:         secret.Name,
		Description:  secret.Description,
		Status:       secret.Status,
		ValuePreview: secret.ValuePreview,
		CreatedAt:    secret.CreatedAt.Format(time.RFC3339),
		UpdatedAt:    secret.UpdatedAt.Format(time.RFC3339),
	}
	resp.ExpiresAt = formatTimePtr(secret.ExpiresAt)
	resp.LastUsedAt = formatTimePtr(secret.LastUsedAt)
	resp.LastRotatedAt = formatTimePtr(secret.LastRotatedAt)
	resp.RevokedAt = formatTimePtr(secret.RevokedAt)
	if secret.RevokedReason != nil {
		resp.RevokedReason = secret.RevokedReason
	}
	if secret.Metadata != nil {
		resp.Metadata = secret.Metadata
	}
	return resp
}

func formatTimePtr(t *time.Time) *string {
	if t == nil {
		return nil
	}
	formatted := t.UTC().Format(time.RFC3339)
	return &formatted
}
