package handler

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/agentflow/server/internal/api/middleware"
	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type WebhookHandler struct {
	webhookService service.WebhookService
}

func NewWebhookHandler(webhookService service.WebhookService) *WebhookHandler {
	return &WebhookHandler{webhookService: webhookService}
}

type WebhookResponse struct {
	ID              uuid.UUID `json:"id"`
	Name            string    `json:"name"`
	URL             string    `json:"url"`
	Events          []string  `json:"events"`
	SigningEnabled  bool      `json:"signing_enabled"`
	SecretPreview   *string   `json:"secret_preview"`
	IsActive        bool      `json:"is_active"`
	LastTriggeredAt *string   `json:"last_triggered_at,omitempty"`
	CreatedAt       string    `json:"created_at"`
	UpdatedAt       string    `json:"updated_at"`
}

type WebhookDeliveryResponse struct {
	ID             uuid.UUID                    `json:"id"`
	EndpointID     uuid.UUID                    `json:"endpoint_id"`
	EventType      string                       `json:"event_type"`
	Status         entity.WebhookDeliveryStatus `json:"status"`
	AttemptCount   int                          `json:"attempt_count"`
	MaxAttempts    int                          `json:"max_attempts"`
	LastAttemptAt  *string                      `json:"last_attempt_at,omitempty"`
	NextRetryAt    *string                      `json:"next_retry_at,omitempty"`
	LastStatusCode *int                         `json:"last_status_code,omitempty"`
	LastError      *string                      `json:"last_error,omitempty"`
	ResponseBody   *string                      `json:"response_body,omitempty"`
	CreatedAt      string                       `json:"created_at"`
	UpdatedAt      string                       `json:"updated_at"`
}

func toWebhookResponse(endpoint entity.WebhookEndpoint) WebhookResponse {
	resp := WebhookResponse{
		ID:             endpoint.ID,
		Name:           endpoint.Name,
		URL:            endpoint.URL,
		Events:         []string(endpoint.Events),
		SigningEnabled: endpoint.SigningEnabled,
		SecretPreview:  endpoint.SecretPreview,
		IsActive:       endpoint.IsActive,
		CreatedAt:      endpoint.CreatedAt.Format(timeLayout),
		UpdatedAt:      endpoint.UpdatedAt.Format(timeLayout),
	}
	if endpoint.LastTriggeredAt != nil {
		ts := endpoint.LastTriggeredAt.Format(timeLayout)
		resp.LastTriggeredAt = &ts
	}
	return resp
}

func toWebhookDeliveryResponse(delivery entity.WebhookDelivery) WebhookDeliveryResponse {
	resp := WebhookDeliveryResponse{
		ID:             delivery.ID,
		EndpointID:     delivery.EndpointID,
		EventType:      delivery.EventType,
		Status:         delivery.Status,
		AttemptCount:   delivery.AttemptCount,
		MaxAttempts:    delivery.MaxAttempts,
		LastStatusCode: delivery.LastStatusCode,
		LastError:      delivery.LastError,
		ResponseBody:   delivery.ResponseBody,
		CreatedAt:      delivery.CreatedAt.Format(timeLayout),
		UpdatedAt:      delivery.UpdatedAt.Format(timeLayout),
	}
	if delivery.LastAttemptAt != nil {
		ts := delivery.LastAttemptAt.Format(timeLayout)
		resp.LastAttemptAt = &ts
	}
	if delivery.NextRetryAt != nil {
		ts := delivery.NextRetryAt.Format(timeLayout)
		resp.NextRetryAt = &ts
	}
	return resp
}

type CreateWebhookRequest struct {
	Name           string   `json:"name"`
	URL            string   `json:"url"`
	Events         []string `json:"events"`
	Secret         *string  `json:"secret"`
	SigningEnabled *bool    `json:"signing_enabled"`
	IsActive       *bool    `json:"is_active"`
}

type UpdateWebhookRequest struct {
	Name           *string  `json:"name"`
	URL            *string  `json:"url"`
	Events         []string `json:"events"`
	SigningEnabled *bool    `json:"signing_enabled"`
	IsActive       *bool    `json:"is_active"`
}

type TestWebhookRequest struct {
	EventType string                 `json:"event_type"`
	Payload   map[string]interface{} `json:"payload"`
}

const timeLayout = "2006-01-02T15:04:05Z"

func parseWebhookDeliveryStatus(value string) (*entity.WebhookDeliveryStatus, error) {
	trimmed := strings.ToLower(strings.TrimSpace(value))
	if trimmed == "" {
		return nil, nil
	}
	switch trimmed {
	case "pending":
		status := entity.WebhookDeliveryPending
		return &status, nil
	case "retrying":
		status := entity.WebhookDeliveryRetrying
		return &status, nil
	case "success":
		status := entity.WebhookDeliverySuccess
		return &status, nil
	case "failed":
		status := entity.WebhookDeliveryFailed
		return &status, nil
	default:
		return nil, errors.New("invalid status")
	}
}

// ListEvents 获取可订阅事件清单
func (h *WebhookHandler) ListEvents(c echo.Context) error {
	events := h.webhookService.ListEventCatalog()
	return successResponse(c, events)
}

// ListIntegrations 获取常见集成清单
func (h *WebhookHandler) ListIntegrations(c echo.Context) error {
	integrations := h.webhookService.ListIntegrationCatalog()
	return successResponse(c, integrations)
}

// List 获取 Webhook 列表
func (h *WebhookHandler) List(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	endpoints, err := h.webhookService.List(c.Request().Context(), uid)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取 Webhook 列表失败")
	}

	resp := make([]WebhookResponse, len(endpoints))
	for i, endpoint := range endpoints {
		resp[i] = toWebhookResponse(endpoint)
	}

	return successResponse(c, resp)
}

// Create 创建 Webhook
func (h *WebhookHandler) Create(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var req CreateWebhookRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	endpoint, secret, err := h.webhookService.Create(c.Request().Context(), uid, service.CreateWebhookRequest{
		Name:           req.Name,
		URL:            req.URL,
		Events:         req.Events,
		Secret:         req.Secret,
		SigningEnabled: req.SigningEnabled,
		IsActive:       req.IsActive,
	})
	if err != nil {
		switch err {
		case service.ErrInvalidWebhook, service.ErrInvalidWebhookURL, service.ErrInvalidWebhookEvent:
			return errorResponse(c, http.StatusBadRequest, "INVALID_WEBHOOK", "Webhook 配置无效")
		default:
			return errorResponse(c, http.StatusInternalServerError, "CREATE_FAILED", "创建 Webhook 失败")
		}
	}

	response := map[string]interface{}{
		"webhook": toWebhookResponse(*endpoint),
	}
	if secret != nil {
		response["secret"] = *secret
	}

	return successResponse(c, response)
}

// Update 更新 Webhook
func (h *WebhookHandler) Update(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	endpointID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "Webhook ID 无效")
	}

	var req UpdateWebhookRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	endpoint, err := h.webhookService.Update(c.Request().Context(), uid, endpointID, service.UpdateWebhookRequest{
		Name:           req.Name,
		URL:            req.URL,
		Events:         req.Events,
		SigningEnabled: req.SigningEnabled,
		IsActive:       req.IsActive,
	})
	if err != nil {
		switch err {
		case service.ErrWebhookNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "Webhook 不存在")
		case service.ErrUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限操作")
		case service.ErrInvalidWebhook, service.ErrInvalidWebhookURL, service.ErrInvalidWebhookEvent:
			return errorResponse(c, http.StatusBadRequest, "INVALID_WEBHOOK", "Webhook 配置无效")
		default:
			return errorResponse(c, http.StatusInternalServerError, "UPDATE_FAILED", "更新 Webhook 失败")
		}
	}

	return successResponse(c, toWebhookResponse(*endpoint))
}

// Delete 删除 Webhook
func (h *WebhookHandler) Delete(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	endpointID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "Webhook ID 无效")
	}

	if err := h.webhookService.Delete(c.Request().Context(), uid, endpointID); err != nil {
		switch err {
		case service.ErrWebhookNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "Webhook 不存在")
		case service.ErrUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限操作")
		default:
			return errorResponse(c, http.StatusInternalServerError, "DELETE_FAILED", "删除 Webhook 失败")
		}
	}

	return successResponse(c, map[string]string{"message": "Webhook 已删除"})
}

// RotateSecret 轮换 Webhook 签名密钥
func (h *WebhookHandler) RotateSecret(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	endpointID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "Webhook ID 无效")
	}

	endpoint, secret, err := h.webhookService.RotateSecret(c.Request().Context(), uid, endpointID)
	if err != nil {
		switch err {
		case service.ErrWebhookNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "Webhook 不存在")
		case service.ErrUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限操作")
		default:
			return errorResponse(c, http.StatusInternalServerError, "ROTATE_FAILED", "轮换密钥失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"webhook": toWebhookResponse(*endpoint),
		"secret":  secret,
	})
}

// Test 测试 Webhook 投递
func (h *WebhookHandler) Test(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	endpointID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "Webhook ID 无效")
	}

	var req TestWebhookRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	result, err := h.webhookService.TestDelivery(c.Request().Context(), uid, endpointID, service.TestWebhookRequest{
		EventType: req.EventType,
		Payload:   req.Payload,
	})
	if err != nil {
		switch err {
		case service.ErrWebhookNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "Webhook 不存在")
		case service.ErrUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限操作")
		case service.ErrInvalidWebhookEvent:
			return errorResponse(c, http.StatusBadRequest, "INVALID_EVENT", "事件类型无效")
		case service.ErrWebhookDeliveryFailed:
			return errorResponseWithDetails(c, http.StatusBadGateway, "DELIVERY_FAILED", "Webhook 投递失败", result)
		default:
			return errorResponse(c, http.StatusInternalServerError, "DELIVERY_FAILED", "Webhook 投递失败")
		}
	}

	return successResponse(c, result)
}

// ListDeliveries 获取 Webhook 投递记录
func (h *WebhookHandler) ListDeliveries(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	endpointID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "Webhook ID 无效")
	}

	status, err := parseWebhookDeliveryStatus(c.QueryParam("status"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_STATUS", "状态筛选无效")
	}

	page := 1
	if value := c.QueryParam("page"); value != "" {
		if parsed, err := strconv.Atoi(value); err == nil && parsed > 0 {
			page = parsed
		}
	}
	pageSize := 20
	if value := c.QueryParam("page_size"); value != "" {
		if parsed, err := strconv.Atoi(value); err == nil && parsed > 0 && parsed <= 100 {
			pageSize = parsed
		}
	}

	result, err := h.webhookService.ListDeliveries(c.Request().Context(), uid, endpointID, &service.ListWebhookDeliveriesRequest{
		Status:   status,
		Page:     page,
		PageSize: pageSize,
	})
	if err != nil {
		switch err {
		case service.ErrWebhookNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "Webhook 不存在")
		case service.ErrUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限操作")
		default:
			return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取投递记录失败")
		}
	}

	resp := make([]WebhookDeliveryResponse, len(result.Items))
	for i, delivery := range result.Items {
		resp[i] = toWebhookDeliveryResponse(delivery)
	}

	return successResponseWithMeta(c, resp, map[string]interface{}{
		"total":       result.Total,
		"page":        result.Page,
		"page_size":   result.PageSize,
		"total_pages": result.TotalPages,
	})
}

// RetryDelivery 重新投递 Webhook
func (h *WebhookHandler) RetryDelivery(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	endpointID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "Webhook ID 无效")
	}
	deliveryID, err := uuid.Parse(c.Param("deliveryId"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_DELIVERY_ID", "投递记录 ID 无效")
	}

	result, err := h.webhookService.RetryDelivery(c.Request().Context(), uid, endpointID, deliveryID)
	if err != nil {
		switch err {
		case service.ErrWebhookNotFound, service.ErrWebhookDeliveryNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "投递记录不存在")
		case service.ErrUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限操作")
		case service.ErrWebhookDeliveryNotRetryable:
			return errorResponse(c, http.StatusConflict, "NOT_RETRYABLE", "投递记录不可重试")
		case service.ErrInvalidWebhookEvent, service.ErrWebhookDeliveryPayloadMissing:
			return errorResponse(c, http.StatusBadRequest, "INVALID_DELIVERY", "投递记录无效")
		case service.ErrWebhookDeliveryFailed:
			return errorResponseWithDetails(c, http.StatusBadGateway, "DELIVERY_FAILED", "Webhook 投递失败", result)
		default:
			return errorResponse(c, http.StatusInternalServerError, "RETRY_FAILED", "Webhook 重试失败")
		}
	}

	return successResponse(c, result)
}
