package handler

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/agentflow/server/internal/api/middleware"
	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

const (
	connectorAuthOAuth = "oauth"
	connectorAuthToken = "token"

	secretTypeOAuthToken = "oauth_token"
	secretTypeAPIToken   = "api_token"
)

// ConnectorHandler 连接器相关接口
type ConnectorHandler struct {
	connectorService service.ConnectorService
	secretService    service.SecretService
}

// NewConnectorHandler 创建连接器处理器
func NewConnectorHandler(connectorService service.ConnectorService, secretService service.SecretService) *ConnectorHandler {
	return &ConnectorHandler{
		connectorService: connectorService,
		secretService:    secretService,
	}
}

// CreateConnectorCredentialRequest 创建连接器凭证请求
type CreateConnectorCredentialRequest struct {
	WorkspaceID  string            `json:"workspace_id"`
	ConnectorID  string            `json:"connector_id"`
	Name         string            `json:"name"`
	Description  *string           `json:"description"`
	AuthType     string            `json:"auth_type"`
	AccessToken  string            `json:"access_token"`
	RefreshToken *string           `json:"refresh_token"`
	TokenType    *string           `json:"token_type"`
	ExpiresAt    *string           `json:"expires_at"`
	Scopes       []string          `json:"scopes"`
	Metadata     map[string]string `json:"metadata"`
}

// RotateConnectorCredentialRequest 轮换连接器凭证请求
type RotateConnectorCredentialRequest struct {
	Value        string   `json:"value"`
	AccessToken  string   `json:"access_token"`
	RefreshToken *string  `json:"refresh_token"`
	TokenType    *string  `json:"token_type"`
	ExpiresAt    *string  `json:"expires_at"`
	Scopes       []string `json:"scopes"`
}

// RevokeConnectorCredentialRequest 吊销连接器凭证请求
type RevokeConnectorCredentialRequest struct {
	Reason string `json:"reason"`
}

// ConnectorCredentialResponse 连接器凭证响应
type ConnectorCredentialResponse struct {
	ID            uuid.UUID              `json:"id"`
	WorkspaceID   uuid.UUID              `json:"workspace_id"`
	ConnectorID   string                 `json:"connector_id"`
	AuthType      string                 `json:"auth_type"`
	Name          string                 `json:"name"`
	Description   *string                `json:"description,omitempty"`
	Status        string                 `json:"status"`
	ValuePreview  *string                `json:"value_preview,omitempty"`
	ExpiresAt     *string                `json:"expires_at,omitempty"`
	LastUsedAt    *string                `json:"last_used_at,omitempty"`
	LastRotatedAt *string                `json:"last_rotated_at,omitempty"`
	RevokedAt     *string                `json:"revoked_at,omitempty"`
	RevokedReason *string                `json:"revoked_reason,omitempty"`
	Scopes        []string               `json:"scopes,omitempty"`
	Metadata      map[string]interface{} `json:"metadata,omitempty"`
	CreatedAt     string                 `json:"created_at"`
	UpdatedAt     string                 `json:"updated_at"`
}

// ListDataSourceCatalog 获取数据源连接器清单
func (h *ConnectorHandler) ListDataSourceCatalog(c echo.Context) error {
	items := h.connectorService.ListDataSourceCatalog()
	return successResponse(c, items)
}

// ListConnectorCredentials 获取连接器凭证列表
func (h *ConnectorHandler) ListConnectorCredentials(c echo.Context) error {
	userID := middleware.GetUserID(c)
	actorID, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID := strings.TrimSpace(c.QueryParam("workspace_id"))
	if workspaceID == "" {
		return errorResponse(c, http.StatusBadRequest, "INVALID_WORKSPACE_ID", "Workspace ID 不能为空")
	}
	workspaceUUID, err := uuid.Parse(workspaceID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_WORKSPACE_ID", "Workspace ID 无效")
	}

	connectorIDFilter := strings.TrimSpace(c.QueryParam("connector_id"))
	status := strings.TrimSpace(c.QueryParam("status"))
	authType := strings.ToLower(strings.TrimSpace(c.QueryParam("auth_type")))

	var statusPtr *string
	if status != "" {
		statusPtr = &status
	}

	secretTypes := []string{secretTypeOAuthToken, secretTypeAPIToken}
	if authType != "" {
		mapped, err := resolveSecretType(authType)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_AUTH_TYPE", "auth_type 无效")
		}
		secretTypes = []string{mapped}
	}

	secrets := make([]entity.Secret, 0)
	for _, secretType := range secretTypes {
		secretTypeCopy := secretType
		items, err := h.secretService.List(c.Request().Context(), actorID, service.SecretFilter{
			OwnerType:  service.SecretOwnerWorkspace,
			OwnerID:    &workspaceUUID,
			SecretType: &secretTypeCopy,
			Status:     statusPtr,
		})
		if err != nil {
			switch err {
			case service.ErrInvalidOwnerType, service.ErrInvalidScope:
				return errorResponse(c, http.StatusBadRequest, "INVALID_OWNER", "Owner 类型无效")
			case service.ErrUnauthorized:
				return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权访问该 workspace 的凭证")
			default:
				return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取连接器凭证失败")
			}
		}
		secrets = append(secrets, items...)
	}

	resp := make([]ConnectorCredentialResponse, 0, len(secrets))
	for _, secret := range secrets {
		metaConnectorID := getMetadataString(secret.Metadata, "connector_id")
		if connectorIDFilter != "" && metaConnectorID != connectorIDFilter {
			continue
		}
		resp = append(resp, toConnectorCredentialResponse(secret))
	}

	return successResponse(c, resp)
}

// CreateConnectorCredential 创建连接器凭证
func (h *ConnectorHandler) CreateConnectorCredential(c echo.Context) error {
	userID := middleware.GetUserID(c)
	actorID, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var req CreateConnectorCredentialRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	workspaceID := strings.TrimSpace(req.WorkspaceID)
	if workspaceID == "" {
		return errorResponse(c, http.StatusBadRequest, "INVALID_WORKSPACE_ID", "Workspace ID 不能为空")
	}
	workspaceUUID, err := uuid.Parse(workspaceID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_WORKSPACE_ID", "Workspace ID 无效")
	}

	connectorID := strings.TrimSpace(req.ConnectorID)
	if connectorID == "" {
		return errorResponse(c, http.StatusBadRequest, "INVALID_CONNECTOR_ID", "Connector ID 不能为空")
	}

	authType := strings.ToLower(strings.TrimSpace(req.AuthType))
	secretType, err := resolveSecretType(authType)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_AUTH_TYPE", "auth_type 无效")
	}

	accessToken := strings.TrimSpace(req.AccessToken)
	if accessToken == "" {
		return errorResponse(c, http.StatusBadRequest, "INVALID_TOKEN", "access_token 不能为空")
	}

	var expiresAt *time.Time
	if req.ExpiresAt != nil && strings.TrimSpace(*req.ExpiresAt) != "" {
		parsed, err := time.Parse(time.RFC3339, strings.TrimSpace(*req.ExpiresAt))
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_EXPIRES_AT", "过期时间格式无效")
		}
		expiresAt = &parsed
	}

	value, err := buildCredentialValue(secretType, accessToken, req.RefreshToken, req.TokenType, req.Scopes, expiresAt)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_TOKEN", "凭证格式无效")
	}

	metadata := map[string]string{}
	for k, v := range req.Metadata {
		metadata[k] = v
	}
	metadata["connector_id"] = connectorID
	metadata["auth_type"] = authType
	if len(req.Scopes) > 0 {
		metadata["scopes"] = strings.Join(req.Scopes, " ")
	}
	if req.TokenType != nil && strings.TrimSpace(*req.TokenType) != "" {
		metadata["token_type"] = strings.TrimSpace(*req.TokenType)
	}
	if secretType == secretTypeOAuthToken {
		metadata["token_format"] = "json"
	} else {
		metadata["token_format"] = "raw"
	}

	name := strings.TrimSpace(req.Name)
	if name == "" {
		name = connectorID + "-" + authType
	}

	secret, err := h.secretService.Create(c.Request().Context(), actorID, service.CreateSecretRequest{
		OwnerType:   service.SecretOwnerWorkspace,
		OwnerID:     &workspaceUUID,
		SecretType:  secretType,
		Name:        name,
		Description: req.Description,
		Value:       value,
		ExpiresAt:   expiresAt,
		Metadata:    metadata,
	})
	if err != nil {
		switch err {
		case service.ErrInvalidSecret, service.ErrInvalidOwnerType, service.ErrInvalidScope:
			return errorResponse(c, http.StatusBadRequest, "INVALID_SECRET", "凭证参数无效")
		case service.ErrUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权创建凭证")
		default:
			return errorResponse(c, http.StatusInternalServerError, "CREATE_FAILED", "创建连接器凭证失败")
		}
	}

	return successResponse(c, toConnectorCredentialResponse(*secret))
}

// RotateConnectorCredential 轮换连接器凭证
func (h *ConnectorHandler) RotateConnectorCredential(c echo.Context) error {
	userID := middleware.GetUserID(c)
	actorID, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}
	secretID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_SECRET_ID", "凭证 ID 无效")
	}

	var req RotateConnectorCredentialRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	secret, err := h.secretService.Get(c.Request().Context(), actorID, secretID)
	if err != nil {
		switch err {
		case service.ErrSecretNotFound:
			return errorResponse(c, http.StatusNotFound, "SECRET_NOT_FOUND", "凭证不存在")
		case service.ErrUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权访问该凭证")
		default:
			return errorResponse(c, http.StatusInternalServerError, "GET_FAILED", "获取凭证失败")
		}
	}

	value := strings.TrimSpace(req.Value)
	if value == "" {
		accessToken := strings.TrimSpace(req.AccessToken)
		if accessToken == "" {
			return errorResponse(c, http.StatusBadRequest, "INVALID_TOKEN", "value 或 access_token 至少填写一个")
		}

		var expiresAt *time.Time
		if req.ExpiresAt != nil && strings.TrimSpace(*req.ExpiresAt) != "" {
			parsed, err := time.Parse(time.RFC3339, strings.TrimSpace(*req.ExpiresAt))
			if err != nil {
				return errorResponse(c, http.StatusBadRequest, "INVALID_EXPIRES_AT", "过期时间格式无效")
			}
			expiresAt = &parsed
		}

		if secret.SecretType == secretTypeOAuthToken {
			value, err = buildCredentialValue(secret.SecretType, accessToken, req.RefreshToken, req.TokenType, req.Scopes, expiresAt)
			if err != nil {
				return errorResponse(c, http.StatusBadRequest, "INVALID_TOKEN", "凭证格式无效")
			}
		} else {
			value = accessToken
		}
	}

	rotated, err := h.secretService.Rotate(c.Request().Context(), actorID, secretID, value)
	if err != nil {
		switch err {
		case service.ErrSecretNotFound:
			return errorResponse(c, http.StatusNotFound, "SECRET_NOT_FOUND", "凭证不存在")
		case service.ErrSecretRevoked:
			return errorResponse(c, http.StatusBadRequest, "SECRET_REVOKED", "凭证已吊销")
		case service.ErrUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权轮换凭证")
		case service.ErrInvalidSecret:
			return errorResponse(c, http.StatusBadRequest, "INVALID_SECRET", "凭证参数无效")
		default:
			return errorResponse(c, http.StatusInternalServerError, "ROTATE_FAILED", "轮换凭证失败")
		}
	}

	return successResponse(c, toConnectorCredentialResponse(*rotated))
}

// RevokeConnectorCredential 吊销连接器凭证
func (h *ConnectorHandler) RevokeConnectorCredential(c echo.Context) error {
	userID := middleware.GetUserID(c)
	actorID, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}
	secretID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_SECRET_ID", "凭证 ID 无效")
	}

	var req RevokeConnectorCredentialRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	secret, err := h.secretService.Revoke(c.Request().Context(), actorID, secretID, req.Reason)
	if err != nil {
		switch err {
		case service.ErrSecretNotFound:
			return errorResponse(c, http.StatusNotFound, "SECRET_NOT_FOUND", "凭证不存在")
		case service.ErrUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权吊销凭证")
		default:
			return errorResponse(c, http.StatusInternalServerError, "REVOKE_FAILED", "吊销凭证失败")
		}
	}

	return successResponse(c, toConnectorCredentialResponse(*secret))
}

func resolveSecretType(authType string) (string, error) {
	switch authType {
	case connectorAuthOAuth:
		return secretTypeOAuthToken, nil
	case connectorAuthToken:
		return secretTypeAPIToken, nil
	default:
		return "", service.ErrInvalidSecret
	}
}

func buildCredentialValue(secretType string, accessToken string, refreshToken *string, tokenType *string, scopes []string, expiresAt *time.Time) (string, error) {
	if secretType != secretTypeOAuthToken {
		return accessToken, nil
	}

	payload := map[string]interface{}{
		"access_token": accessToken,
	}
	if refreshToken != nil && strings.TrimSpace(*refreshToken) != "" {
		payload["refresh_token"] = strings.TrimSpace(*refreshToken)
	}
	if tokenType != nil && strings.TrimSpace(*tokenType) != "" {
		payload["token_type"] = strings.TrimSpace(*tokenType)
	}
	if len(scopes) > 0 {
		payload["scopes"] = scopes
	}
	if expiresAt != nil {
		payload["expires_at"] = expiresAt.UTC().Format(time.RFC3339)
	}

	raw, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}
	return string(raw), nil
}

func toConnectorCredentialResponse(secret entity.Secret) ConnectorCredentialResponse {
	authType := getMetadataString(secret.Metadata, "auth_type")
	if authType == "" {
		authType = authTypeFromSecret(secret.SecretType)
	}
	return ConnectorCredentialResponse{
		ID:            secret.ID,
		WorkspaceID:   secret.OwnerID,
		ConnectorID:   getMetadataString(secret.Metadata, "connector_id"),
		AuthType:      authType,
		Name:          secret.Name,
		Description:   secret.Description,
		Status:        secret.Status,
		ValuePreview:  secret.ValuePreview,
		ExpiresAt:     formatTimePtr(secret.ExpiresAt),
		LastUsedAt:    formatTimePtr(secret.LastUsedAt),
		LastRotatedAt: formatTimePtr(secret.LastRotatedAt),
		RevokedAt:     formatTimePtr(secret.RevokedAt),
		RevokedReason: secret.RevokedReason,
		Scopes:        parseScopes(getMetadataString(secret.Metadata, "scopes")),
		Metadata:      secret.Metadata,
		CreatedAt:     secret.CreatedAt.Format(time.RFC3339),
		UpdatedAt:     secret.UpdatedAt.Format(time.RFC3339),
	}
}

func authTypeFromSecret(secretType string) string {
	switch secretType {
	case secretTypeOAuthToken:
		return connectorAuthOAuth
	case secretTypeAPIToken:
		return connectorAuthToken
	default:
		return ""
	}
}

func parseScopes(value string) []string {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	parts := strings.FieldsFunc(value, func(r rune) bool {
		return r == ',' || r == ' '
	})
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		if trimmed := strings.TrimSpace(part); trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}

func getMetadataString(metadata entity.JSON, key string) string {
	if metadata == nil {
		return ""
	}
	if value, ok := metadata[key]; ok {
		if str, ok := value.(string); ok {
			return str
		}
	}
	return ""
}
