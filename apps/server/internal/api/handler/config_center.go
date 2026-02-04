package handler

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/agentflow/server/internal/api/middleware"
	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// ConfigCenterHandler 配置中心处理器
type ConfigCenterHandler struct {
	configService service.ConfigCenterService
}

// NewConfigCenterHandler 创建配置中心处理器
func NewConfigCenterHandler(configService service.ConfigCenterService) *ConfigCenterHandler {
	return &ConfigCenterHandler{configService: configService}
}

// UpsertConfigItemRequest 配置写入请求
type UpsertConfigItemRequest struct {
	ScopeType   string  `json:"scope_type"`
	ScopeID     *string `json:"scope_id"`
	Key         string  `json:"key" validate:"required"`
	Value       string  `json:"value"`
	ValueType   string  `json:"value_type"`
	IsSecret    bool    `json:"is_secret"`
	Description *string `json:"description"`
}

// ConfigItemResponse 配置响应
type ConfigItemResponse struct {
	ID           uuid.UUID  `json:"id"`
	ScopeType    string     `json:"scope_type"`
	ScopeID      *uuid.UUID `json:"scope_id,omitempty"`
	Key          string     `json:"key"`
	Value        *string    `json:"value,omitempty"`
	ValueMasked  *string    `json:"value_masked,omitempty"`
	ValuePreview *string    `json:"value_preview,omitempty"`
	ValueType    string     `json:"value_type"`
	IsSecret     bool       `json:"is_secret"`
	IsActive     bool       `json:"is_active"`
	Description  *string    `json:"description,omitempty"`
	UpdatedBy    *uuid.UUID `json:"updated_by,omitempty"`
	CreatedAt    string     `json:"created_at"`
	UpdatedAt    string     `json:"updated_at"`
}

// ListConfigItems 获取配置列表
// @Summary 获取配置列表
// @Tags Config
// @Produce json
// @Param scope_type query string false "scope type: user/workspace"
// @Param scope_id query string false "scope id"
// @Param key query string false "config key"
// @Param include_inactive query bool false "include inactive"
// @Param include_secret query bool false "include secret values"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/config/items [get]
func (h *ConfigCenterHandler) ListConfigItems(c echo.Context) error {
	userID := middleware.GetUserID(c)
	actorID, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	scopeType := c.QueryParam("scope_type")
	scopeIDParam := c.QueryParam("scope_id")
	var scopeID *uuid.UUID
	if scopeIDParam != "" {
		parsed, err := uuid.Parse(scopeIDParam)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_SCOPE_ID", "Scope ID 无效")
		}
		scopeID = &parsed
	}
	key := c.QueryParam("key")
	includeInactive, _ := strconv.ParseBool(c.QueryParam("include_inactive"))
	includeSecret, _ := strconv.ParseBool(c.QueryParam("include_secret"))

	var keyPtr *string
	if key != "" {
		keyPtr = &key
	}

	items, err := h.configService.List(c.Request().Context(), actorID, service.ConfigItemFilter{
		ScopeType:       scopeType,
		ScopeID:         scopeID,
		ConfigKey:       keyPtr,
		IncludeInactive: includeInactive,
	})
	if err != nil {
		switch err {
		case service.ErrUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权访问该配置")
		case service.ErrInvalidConfigScope:
			return errorResponse(c, http.StatusBadRequest, "INVALID_SCOPE", "配置作用域无效")
		default:
			return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取配置列表失败")
		}
	}

	resp := make([]ConfigItemResponse, 0, len(items))
	for i := range items {
		item := items[i]
		resp = append(resp, h.toConfigItemResponse(&item, includeSecret))
	}
	return successResponse(c, resp)
}

// UpsertConfigItem 创建或更新配置
// @Summary 创建或更新配置
// @Tags Config
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/config/items [post]
func (h *ConfigCenterHandler) UpsertConfigItem(c echo.Context) error {
	userID := middleware.GetUserID(c)
	actorID, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var req UpsertConfigItemRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	var scopeID *uuid.UUID
	if req.ScopeID != nil && *req.ScopeID != "" {
		parsed, err := uuid.Parse(*req.ScopeID)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_SCOPE_ID", "Scope ID 无效")
		}
		scopeID = &parsed
	}

	item, err := h.configService.Upsert(c.Request().Context(), actorID, service.UpsertConfigItemRequest{
		ScopeType:   req.ScopeType,
		ScopeID:     scopeID,
		Key:         req.Key,
		Value:       req.Value,
		ValueType:   req.ValueType,
		IsSecret:    req.IsSecret,
		Description: req.Description,
	})
	if err != nil {
		switch err {
		case service.ErrInvalidConfigItem:
			return errorResponse(c, http.StatusBadRequest, "INVALID_CONFIG", "配置参数无效")
		case service.ErrInvalidConfigScope:
			return errorResponse(c, http.StatusBadRequest, "INVALID_SCOPE", "配置作用域无效")
		case service.ErrUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权写入配置")
		default:
			return errorResponse(c, http.StatusInternalServerError, "UPSERT_FAILED", "写入配置失败")
		}
	}

	return successResponse(c, h.toConfigItemResponse(item, false))
}

// GetConfigItem 获取配置详情
// @Summary 获取配置详情
// @Tags Config
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/config/items/{id} [get]
func (h *ConfigCenterHandler) GetConfigItem(c echo.Context) error {
	userID := middleware.GetUserID(c)
	actorID, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}
	itemID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_CONFIG_ID", "配置 ID 无效")
	}
	includeSecret, _ := strconv.ParseBool(c.QueryParam("include_secret"))

	item, err := h.configService.Get(c.Request().Context(), actorID, itemID)
	if err != nil {
		if err == service.ErrConfigItemNotFound {
			return errorResponse(c, http.StatusNotFound, "CONFIG_NOT_FOUND", "配置不存在")
		}
		if err == service.ErrUnauthorized {
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权访问该配置")
		}
		return errorResponse(c, http.StatusInternalServerError, "GET_FAILED", "获取配置失败")
	}

	return successResponse(c, h.toConfigItemResponse(item, includeSecret))
}

// DisableConfigItem 禁用配置
// @Summary 禁用配置
// @Tags Config
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/config/items/{id} [delete]
func (h *ConfigCenterHandler) DisableConfigItem(c echo.Context) error {
	userID := middleware.GetUserID(c)
	actorID, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}
	itemID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_CONFIG_ID", "配置 ID 无效")
	}

	item, err := h.configService.Disable(c.Request().Context(), actorID, itemID)
	if err != nil {
		if err == service.ErrConfigItemNotFound {
			return errorResponse(c, http.StatusNotFound, "CONFIG_NOT_FOUND", "配置不存在")
		}
		if err == service.ErrUnauthorized {
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权禁用配置")
		}
		return errorResponse(c, http.StatusInternalServerError, "DISABLE_FAILED", "禁用配置失败")
	}

	return successResponse(c, h.toConfigItemResponse(item, false))
}

func (h *ConfigCenterHandler) toConfigItemResponse(item *entity.ConfigItem, includeSecret bool) ConfigItemResponse {
	resp := ConfigItemResponse{
		ID:           item.ID,
		ScopeType:    item.ScopeType,
		ScopeID:      item.ScopeID,
		Key:          item.ConfigKey,
		ValueType:    item.ValueType,
		IsSecret:     item.IsSecret,
		IsActive:     item.IsActive,
		Description:  item.Description,
		UpdatedBy:    item.UpdatedBy,
		CreatedAt:    item.CreatedAt.Format(time.RFC3339),
		UpdatedAt:    item.UpdatedAt.Format(time.RFC3339),
		ValuePreview: item.ValuePreview,
	}

	shouldMask := item.IsSecret || isSensitiveConfigKey(item.ConfigKey)
	if shouldMask {
		if includeSecret {
			if value, err := h.configService.DecryptValue(item); err == nil {
				resp.Value = &value
			}
		} else {
			masked := "***"
			if item.ValuePreview != nil {
				masked = *item.ValuePreview
			}
			resp.ValueMasked = &masked
		}
		return resp
	}

	if value, err := h.configService.DecryptValue(item); err == nil {
		resp.Value = &value
	}
	return resp
}

func isSensitiveConfigKey(key string) bool {
	normalized := strings.ToLower(strings.TrimSpace(key))
	if normalized == "" {
		return false
	}
	sensitiveKeywords := []string{
		"secret",
		"token",
		"password",
		"apikey",
		"api_key",
		"access_key",
		"private_key",
	}
	for _, keyword := range sensitiveKeywords {
		if strings.Contains(normalized, keyword) {
			return true
		}
	}
	return false
}
