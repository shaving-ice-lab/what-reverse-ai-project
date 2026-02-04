package service

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/pkg/crypto"
	"github.com/agentflow/server/internal/pkg/logger"
	webhookpkg "github.com/agentflow/server/internal/pkg/webhook"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
)

var (
	ErrWebhookNotFound               = errors.New("webhook not found")
	ErrInvalidWebhook                = errors.New("invalid webhook")
	ErrInvalidWebhookURL             = errors.New("invalid webhook url")
	ErrInvalidWebhookEvent           = errors.New("invalid webhook event")
	ErrWebhookDeliveryFailed         = errors.New("webhook delivery failed")
	ErrWebhookDeliveryNotFound       = errors.New("webhook delivery not found")
	ErrWebhookDeliveryNotRetryable   = errors.New("webhook delivery not retryable")
	ErrWebhookDeliveryPayloadMissing = errors.New("webhook delivery payload missing")
)

const (
	defaultWebhookMaxAttempts = 3
)

// WebhookService Webhook 服务接口
type WebhookService interface {
	List(ctx context.Context, userID uuid.UUID) ([]entity.WebhookEndpoint, error)
	Create(ctx context.Context, userID uuid.UUID, req CreateWebhookRequest) (*entity.WebhookEndpoint, *string, error)
	Update(ctx context.Context, userID, id uuid.UUID, req UpdateWebhookRequest) (*entity.WebhookEndpoint, error)
	Delete(ctx context.Context, userID, id uuid.UUID) error
	RotateSecret(ctx context.Context, userID, id uuid.UUID) (*entity.WebhookEndpoint, string, error)
	TestDelivery(ctx context.Context, userID, id uuid.UUID, req TestWebhookRequest) (*WebhookDeliveryResult, error)
	ListDeliveries(ctx context.Context, userID, endpointID uuid.UUID, req *ListWebhookDeliveriesRequest) (*WebhookDeliveryListResponse, error)
	RetryDelivery(ctx context.Context, userID, endpointID, deliveryID uuid.UUID) (*WebhookDeliveryResult, error)
	ListEventCatalog() []WebhookEventGroup
	ListIntegrationCatalog() []IntegrationCatalogItem
	DispatchRuntimeEvent(ctx context.Context, event *entity.RuntimeEvent)
}

// CreateWebhookRequest 创建 Webhook 请求
type CreateWebhookRequest struct {
	Name           string   `json:"name"`
	URL            string   `json:"url"`
	Events         []string `json:"events"`
	Secret         *string  `json:"secret"`
	SigningEnabled *bool    `json:"signing_enabled"`
	IsActive       *bool    `json:"is_active"`
}

// UpdateWebhookRequest 更新 Webhook 请求
type UpdateWebhookRequest struct {
	Name           *string  `json:"name"`
	URL            *string  `json:"url"`
	Events         []string `json:"events"`
	SigningEnabled *bool    `json:"signing_enabled"`
	IsActive       *bool    `json:"is_active"`
}

// TestWebhookRequest 测试 Webhook 请求
type TestWebhookRequest struct {
	EventType string                 `json:"event_type"`
	Payload   map[string]interface{} `json:"payload"`
}

// ListWebhookDeliveriesRequest Webhook 投递列表请求
type ListWebhookDeliveriesRequest struct {
	Status   *entity.WebhookDeliveryStatus
	Page     int
	PageSize int
}

// WebhookDeliveryListResponse Webhook 投递列表响应
type WebhookDeliveryListResponse struct {
	Items      []entity.WebhookDelivery `json:"items"`
	Total      int64                    `json:"total"`
	Page       int                      `json:"page"`
	PageSize   int                      `json:"page_size"`
	TotalPages int                      `json:"total_pages"`
}

// WebhookDeliveryResult 投递结果
type WebhookDeliveryResult struct {
	DeliveryID   string `json:"delivery_id"`
	EventType    string `json:"event_type"`
	Status       string `json:"status"`
	Attempt      int    `json:"attempt"`
	StatusCode   int    `json:"status_code"`
	DurationMs   int64  `json:"duration_ms"`
	ResponseBody string `json:"response_body,omitempty"`
}

// WebhookEventDefinition Webhook 事件定义
type WebhookEventDefinition struct {
	Type        string `json:"type"`
	Description string `json:"description"`
}

// WebhookEventGroup Webhook 事件分组
type WebhookEventGroup struct {
	Category string                   `json:"category"`
	Events   []WebhookEventDefinition `json:"events"`
}

// IntegrationCatalogItem 常见集成清单项
type IntegrationCatalogItem struct {
	ID                string   `json:"id"`
	Name              string   `json:"name"`
	Category          string   `json:"category"`
	ProviderType      string   `json:"provider_type"`
	Description       string   `json:"description"`
	DocsURL           string   `json:"docs_url"`
	RecommendedEvents []string `json:"recommended_events"`
}

type webhookService struct {
	repo             repository.WebhookEndpointRepository
	deliveryRepo     repository.WebhookDeliveryRepository
	workspaceService WorkspaceService
	encryptor        *crypto.Encryptor
	httpClient       *http.Client
	log              logger.Logger
}

// NewWebhookService 创建 Webhook 服务
func NewWebhookService(repo repository.WebhookEndpointRepository, deliveryRepo repository.WebhookDeliveryRepository, workspaceService WorkspaceService, encryptionKey string, log logger.Logger) (WebhookService, error) {
	encryptor, err := crypto.NewEncryptor(encryptionKey)
	if err != nil {
		return nil, err
	}

	return &webhookService{
		repo:             repo,
		deliveryRepo:     deliveryRepo,
		workspaceService: workspaceService,
		encryptor:        encryptor,
		httpClient:       &http.Client{Timeout: 12 * time.Second},
		log:              log,
	}, nil
}

func (s *webhookService) List(ctx context.Context, userID uuid.UUID) ([]entity.WebhookEndpoint, error) {
	workspace, err := s.workspaceService.EnsureDefaultWorkspaceByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	return s.repo.ListByWorkspace(ctx, workspace.ID)
}

func (s *webhookService) Create(ctx context.Context, userID uuid.UUID, req CreateWebhookRequest) (*entity.WebhookEndpoint, *string, error) {
	workspace, err := s.workspaceService.EnsureDefaultWorkspaceByUserID(ctx, userID)
	if err != nil {
		return nil, nil, err
	}

	name := strings.TrimSpace(req.Name)
	if name == "" {
		return nil, nil, ErrInvalidWebhook
	}

	normalizedURL, err := validateWebhookURL(req.URL)
	if err != nil {
		return nil, nil, err
	}

	events, err := normalizeWebhookEvents(req.Events)
	if err != nil {
		return nil, nil, err
	}

	signingEnabled := true
	if req.SigningEnabled != nil {
		signingEnabled = *req.SigningEnabled
	}

	var secret string
	if signingEnabled {
		if req.Secret != nil && strings.TrimSpace(*req.Secret) != "" {
			secret = strings.TrimSpace(*req.Secret)
		} else {
			secret = generateWebhookSecret()
		}
	}

	encryptedSecret := ""
	var secretPreview *string
	if signingEnabled && secret != "" {
		encryptedSecret, err = s.encryptor.Encrypt(secret)
		if err != nil {
			return nil, nil, err
		}
		preview := crypto.GetKeyPreview(secret)
		secretPreview = &preview
	}

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	endpoint := &entity.WebhookEndpoint{
		WorkspaceID:     workspace.ID,
		Name:            name,
		URL:             normalizedURL,
		Events:          events,
		SigningEnabled:  signingEnabled,
		SecretEncrypted: encryptedSecret,
		SecretPreview:   secretPreview,
		IsActive:        isActive,
	}

	if err := s.repo.Create(ctx, endpoint); err != nil {
		return nil, nil, err
	}

	if signingEnabled {
		return endpoint, &secret, nil
	}

	return endpoint, nil, nil
}

func (s *webhookService) Update(ctx context.Context, userID, id uuid.UUID, req UpdateWebhookRequest) (*entity.WebhookEndpoint, error) {
	workspace, err := s.workspaceService.EnsureDefaultWorkspaceByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	endpoint, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrWebhookNotFound
	}
	if endpoint.WorkspaceID != workspace.ID {
		return nil, ErrUnauthorized
	}

	if req.Name != nil {
		name := strings.TrimSpace(*req.Name)
		if name == "" {
			return nil, ErrInvalidWebhook
		}
		endpoint.Name = name
	}

	if req.URL != nil {
		normalizedURL, err := validateWebhookURL(*req.URL)
		if err != nil {
			return nil, err
		}
		endpoint.URL = normalizedURL
	}

	if req.Events != nil {
		events, err := normalizeWebhookEvents(req.Events)
		if err != nil {
			return nil, err
		}
		endpoint.Events = events
	}

	if req.SigningEnabled != nil {
		endpoint.SigningEnabled = *req.SigningEnabled
		if !endpoint.SigningEnabled {
			endpoint.SecretEncrypted = ""
			endpoint.SecretPreview = nil
		} else if endpoint.SecretEncrypted == "" {
			return nil, ErrInvalidWebhook
		}
	}

	if req.IsActive != nil {
		endpoint.IsActive = *req.IsActive
	}

	if err := s.repo.Update(ctx, endpoint); err != nil {
		return nil, err
	}

	return endpoint, nil
}

func (s *webhookService) Delete(ctx context.Context, userID, id uuid.UUID) error {
	workspace, err := s.workspaceService.EnsureDefaultWorkspaceByUserID(ctx, userID)
	if err != nil {
		return err
	}

	endpoint, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return ErrWebhookNotFound
	}
	if endpoint.WorkspaceID != workspace.ID {
		return ErrUnauthorized
	}

	return s.repo.Delete(ctx, id)
}

func (s *webhookService) RotateSecret(ctx context.Context, userID, id uuid.UUID) (*entity.WebhookEndpoint, string, error) {
	workspace, err := s.workspaceService.EnsureDefaultWorkspaceByUserID(ctx, userID)
	if err != nil {
		return nil, "", err
	}

	endpoint, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, "", ErrWebhookNotFound
	}
	if endpoint.WorkspaceID != workspace.ID {
		return nil, "", ErrUnauthorized
	}

	secret := generateWebhookSecret()
	encrypted, err := s.encryptor.Encrypt(secret)
	if err != nil {
		return nil, "", err
	}
	preview := crypto.GetKeyPreview(secret)

	endpoint.SigningEnabled = true
	endpoint.SecretEncrypted = encrypted
	endpoint.SecretPreview = &preview

	if err := s.repo.Update(ctx, endpoint); err != nil {
		return nil, "", err
	}

	return endpoint, secret, nil
}

func (s *webhookService) TestDelivery(ctx context.Context, userID, id uuid.UUID, req TestWebhookRequest) (*WebhookDeliveryResult, error) {
	workspace, err := s.workspaceService.EnsureDefaultWorkspaceByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	endpoint, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrWebhookNotFound
	}
	if endpoint.WorkspaceID != workspace.ID {
		return nil, ErrUnauthorized
	}

	eventType := normalizeEventType(req.EventType)
	if eventType == "" {
		return nil, ErrInvalidWebhookEvent
	}
	if !isAllowedWebhookEvent(eventType) {
		return nil, ErrInvalidWebhookEvent
	}

	payload := req.Payload
	if payload == nil {
		payload = buildSamplePayload(eventType, workspace.ID, userID)
	}

	result, err := s.deliverWebhook(ctx, endpoint, eventType, payload, nil)
	if err != nil {
		return result, err
	}

	return result, nil
}

func (s *webhookService) ListDeliveries(ctx context.Context, userID, endpointID uuid.UUID, req *ListWebhookDeliveriesRequest) (*WebhookDeliveryListResponse, error) {
	if req == nil {
		req = &ListWebhookDeliveriesRequest{}
	}
	if req.Page < 1 {
		req.Page = 1
	}
	if req.PageSize < 1 || req.PageSize > 100 {
		req.PageSize = 20
	}

	workspace, err := s.workspaceService.EnsureDefaultWorkspaceByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	endpoint, err := s.repo.GetByID(ctx, endpointID)
	if err != nil {
		return nil, ErrWebhookNotFound
	}
	if endpoint.WorkspaceID != workspace.ID {
		return nil, ErrUnauthorized
	}

	deliveries, total, err := s.deliveryRepo.ListByEndpoint(ctx, endpointID, req.Status, req.Page, req.PageSize)
	if err != nil {
		return nil, err
	}

	totalPages := int(total) / req.PageSize
	if int(total)%req.PageSize > 0 {
		totalPages++
	}

	return &WebhookDeliveryListResponse{
		Items:      deliveries,
		Total:      total,
		Page:       req.Page,
		PageSize:   req.PageSize,
		TotalPages: totalPages,
	}, nil
}

func (s *webhookService) RetryDelivery(ctx context.Context, userID, endpointID, deliveryID uuid.UUID) (*WebhookDeliveryResult, error) {
	workspace, err := s.workspaceService.EnsureDefaultWorkspaceByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	endpoint, err := s.repo.GetByID(ctx, endpointID)
	if err != nil {
		return nil, ErrWebhookNotFound
	}
	if endpoint.WorkspaceID != workspace.ID {
		return nil, ErrUnauthorized
	}

	delivery, err := s.deliveryRepo.GetByID(ctx, deliveryID)
	if err != nil {
		return nil, ErrWebhookDeliveryNotFound
	}
	if delivery.EndpointID != endpoint.ID {
		return nil, ErrWebhookDeliveryNotRetryable
	}
	if delivery.Status == entity.WebhookDeliverySuccess {
		return nil, ErrWebhookDeliveryNotRetryable
	}
	if delivery.EventType == "" {
		return nil, ErrInvalidWebhookEvent
	}
	if delivery.Payload == nil {
		return nil, ErrWebhookDeliveryPayloadMissing
	}

	payload := map[string]interface{}(delivery.Payload)
	if delivery.MaxAttempts < delivery.AttemptCount+1 {
		delivery.MaxAttempts = delivery.AttemptCount + 1
	}
	if err := s.deliveryRepo.Update(ctx, delivery); err != nil {
		return nil, err
	}

	return s.deliverWebhook(ctx, endpoint, delivery.EventType, payload, delivery)
}

func (s *webhookService) DispatchRuntimeEvent(ctx context.Context, event *entity.RuntimeEvent) {
	if event == nil || event.WorkspaceID == nil {
		return
	}
	eventType := string(event.Type)
	if !isAllowedWebhookEvent(eventType) {
		return
	}

	endpoints, err := s.repo.ListByWorkspace(ctx, *event.WorkspaceID)
	if err != nil {
		s.log.Warn("Failed to list webhook endpoints for event dispatch", "error", err)
		return
	}
	payload := buildRuntimeEventPayload(event)
	for i := range endpoints {
		endpoint := endpoints[i]
		if !endpoint.IsActive {
			continue
		}
		if !isWebhookEventSubscribed(endpoint.Events, eventType) {
			continue
		}
		if ctx.Err() != nil {
			return
		}
		if _, err := s.deliverWebhook(ctx, &endpoint, eventType, payload, nil); err != nil {
			s.log.Warn("Webhook event delivery failed", "endpoint_id", endpoint.ID, "event_type", eventType, "error", err)
		}
	}
}

func (s *webhookService) ListEventCatalog() []WebhookEventGroup {
	metadata := entity.GetEventTypeMetadata()
	groups := make(map[string][]WebhookEventDefinition)
	order := make([]string, 0, 8)
	seen := make(map[string]struct{})

	for _, meta := range metadata {
		category := meta.Category
		if _, ok := seen[category]; !ok {
			seen[category] = struct{}{}
			order = append(order, category)
		}
		groups[category] = append(groups[category], WebhookEventDefinition{
			Type:        string(meta.Type),
			Description: meta.Description,
		})
	}

	result := make([]WebhookEventGroup, 0, len(order))
	for _, category := range order {
		result = append(result, WebhookEventGroup{
			Category: category,
			Events:   groups[category],
		})
	}
	return result
}

func (s *webhookService) ListIntegrationCatalog() []IntegrationCatalogItem {
	recommended := []string{
		string(entity.EventAppPublished),
		string(entity.EventExecutionCompleted),
		string(entity.EventDomainVerified),
	}

	return []IntegrationCatalogItem{
		{
			ID:                "slack",
			Name:              "Slack",
			Category:          "messaging",
			ProviderType:      "webhook",
			Description:       "向 Slack 频道推送发布、执行与域名事件通知。",
			DocsURL:           "https://api.slack.com/messaging/webhooks",
			RecommendedEvents: recommended,
		},
		{
			ID:                "notion",
			Name:              "Notion",
			Category:          "productivity",
			ProviderType:      "webhook",
			Description:       "将应用发布与执行结果同步到 Notion 数据库。",
			DocsURL:           "https://developers.notion.com/",
			RecommendedEvents: recommended,
		},
		{
			ID:                "zapier",
			Name:              "Zapier",
			Category:          "automation",
			ProviderType:      "webhook",
			Description:       "通过 Zapier 将事件连接到数千个 SaaS 应用。",
			DocsURL:           "https://platform.zapier.com/docs/triggers",
			RecommendedEvents: recommended,
		},
	}
}

func (s *webhookService) deliverWebhook(ctx context.Context, endpoint *entity.WebhookEndpoint, eventType string, payload map[string]interface{}, delivery *entity.WebhookDelivery) (*WebhookDeliveryResult, error) {
	if endpoint == nil || !endpoint.IsActive {
		return nil, ErrInvalidWebhook
	}
	if eventType == "" {
		return nil, ErrInvalidWebhookEvent
	}
	if payload == nil {
		payload = map[string]interface{}{}
	}

	if delivery == nil && s.deliveryRepo != nil {
		delivery = &entity.WebhookDelivery{
			EndpointID:  endpoint.ID,
			WorkspaceID: endpoint.WorkspaceID,
			EventType:   eventType,
			Status:      entity.WebhookDeliveryPending,
			MaxAttempts: defaultWebhookMaxAttempts,
			Payload:     payload,
		}
		if err := s.deliveryRepo.Create(ctx, delivery); err != nil {
			return nil, err
		}
	} else if delivery != nil {
		if delivery.MaxAttempts <= 0 {
			delivery.MaxAttempts = defaultWebhookMaxAttempts
		}
		if delivery.Payload == nil {
			delivery.Payload = payload
		}
		if delivery.EventType == "" {
			delivery.EventType = eventType
		}
		if s.deliveryRepo != nil {
			_ = s.deliveryRepo.Update(ctx, delivery)
		}
	}

	deliveryID := uuid.New().String()
	if delivery != nil && delivery.ID != uuid.Nil {
		deliveryID = delivery.ID.String()
	}

	maxAttempts := defaultWebhookMaxAttempts
	startAttempt := 0
	if delivery != nil {
		if delivery.MaxAttempts > 0 {
			maxAttempts = delivery.MaxAttempts
		}
		if delivery.AttemptCount > 0 {
			startAttempt = delivery.AttemptCount
		}
	}

	var lastResult *WebhookDeliveryResult
	for attempt := startAttempt + 1; attempt <= maxAttempts; attempt++ {
		attemptAt := time.Now()
		result, err := s.sendWebhookRequest(ctx, endpoint, eventType, payload, deliveryID)
		if result == nil {
			result = &WebhookDeliveryResult{DeliveryID: deliveryID, EventType: eventType}
		}
		result.Attempt = attempt

		success := err == nil && result.StatusCode >= 200 && result.StatusCode < 300
		status := entity.WebhookDeliveryFailed
		var lastError *string
		if success {
			status = entity.WebhookDeliverySuccess
		} else if err != nil {
			msg := err.Error()
			lastError = &msg
			if attempt < maxAttempts {
				status = entity.WebhookDeliveryRetrying
			}
		} else if result.StatusCode > 0 {
			msg := fmt.Sprintf("http status %d", result.StatusCode)
			lastError = &msg
			if attempt < maxAttempts {
				status = entity.WebhookDeliveryRetrying
			}
		}
		result.Status = string(status)
		lastResult = result

		if s.deliveryRepo != nil && delivery != nil {
			delivery.AttemptCount = attempt
			delivery.LastAttemptAt = &attemptAt
			if result.StatusCode > 0 {
				code := result.StatusCode
				delivery.LastStatusCode = &code
			} else {
				delivery.LastStatusCode = nil
			}
			if result.ResponseBody != "" {
				body := result.ResponseBody
				delivery.ResponseBody = &body
			} else {
				delivery.ResponseBody = nil
			}
			delivery.LastError = lastError
			delivery.Status = status
			if !success && attempt < maxAttempts {
				nextRetry := attemptAt.Add(resolveWebhookRetryDelay(attempt))
				delivery.NextRetryAt = &nextRetry
			} else {
				delivery.NextRetryAt = nil
			}
			_ = s.deliveryRepo.Update(ctx, delivery)
		}

		_ = s.repo.UpdateLastTriggered(ctx, endpoint.ID, time.Now())

		if success {
			return result, nil
		}
		if attempt < maxAttempts {
			if !sleepWithContext(ctx, resolveWebhookRetryDelay(attempt)) {
				break
			}
		}
	}

	if lastResult == nil {
		lastResult = &WebhookDeliveryResult{
			DeliveryID: deliveryID,
			EventType:  eventType,
			Status:     string(entity.WebhookDeliveryFailed),
		}
	}
	return lastResult, ErrWebhookDeliveryFailed
}

func (s *webhookService) sendWebhookRequest(ctx context.Context, endpoint *entity.WebhookEndpoint, eventType string, payload map[string]interface{}, deliveryID string) (*WebhookDeliveryResult, error) {
	serialized, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	timestamp := fmt.Sprintf("%d", time.Now().Unix())
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint.URL, bytes.NewBuffer(serialized))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set(webhookpkg.EventHeader, eventType)
	req.Header.Set(webhookpkg.DeliveryHeader, deliveryID)
	req.Header.Set(webhookpkg.TimestampHeader, timestamp)

	if endpoint.SigningEnabled {
		secret, err := s.decryptSecret(endpoint)
		if err != nil {
			return nil, err
		}
		signature := webhookpkg.BuildSignature(secret, timestamp, serialized)
		req.Header.Set(webhookpkg.SignatureHeader, signature)
	}

	started := time.Now()
	resp, err := s.httpClient.Do(req)
	duration := time.Since(started).Milliseconds()
	if err != nil {
		return &WebhookDeliveryResult{
			DeliveryID: deliveryID,
			EventType:  eventType,
			DurationMs: duration,
		}, err
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
	body := strings.TrimSpace(string(bodyBytes))

	return &WebhookDeliveryResult{
		DeliveryID:   deliveryID,
		EventType:    eventType,
		StatusCode:   resp.StatusCode,
		DurationMs:   duration,
		ResponseBody: body,
	}, nil
}

func resolveWebhookRetryDelay(attempt int) time.Duration {
	switch attempt {
	case 1:
		return 500 * time.Millisecond
	case 2:
		return 2 * time.Second
	case 3:
		return 5 * time.Second
	default:
		return 8 * time.Second
	}
}

func sleepWithContext(ctx context.Context, delay time.Duration) bool {
	timer := time.NewTimer(delay)
	defer timer.Stop()
	select {
	case <-ctx.Done():
		return false
	case <-timer.C:
		return true
	}
}

func isWebhookEventSubscribed(events entity.StringArray, eventType string) bool {
	if len(events) == 0 {
		return false
	}
	normalized := normalizeEventType(eventType)
	for _, ev := range events {
		if normalizeEventType(ev) == normalized {
			return true
		}
	}
	return false
}

func buildRuntimeEventPayload(event *entity.RuntimeEvent) map[string]interface{} {
	createdAt := event.CreatedAt
	if createdAt.IsZero() {
		createdAt = time.Now().UTC()
	}
	payloadID := event.ID.String()
	if event.ID == uuid.Nil {
		payloadID = uuid.New().String()
	}

	data := map[string]interface{}{}
	if event.WorkspaceID != nil {
		data["workspace_id"] = event.WorkspaceID.String()
	}
	if event.AppID != nil {
		data["app_id"] = event.AppID.String()
	}
	if event.ExecutionID != nil {
		data["execution_id"] = event.ExecutionID.String()
	}
	if event.UserID != nil {
		data["user_id"] = event.UserID.String()
	}
	if event.SessionID != nil {
		data["session_id"] = event.SessionID.String()
	}
	if event.NodeID != "" {
		data["node_id"] = event.NodeID
	}
	if event.NodeType != "" {
		data["node_type"] = event.NodeType
	}
	if event.TraceID != "" {
		data["trace_id"] = event.TraceID
	}
	if event.SpanID != "" {
		data["span_id"] = event.SpanID
	}
	if event.RequestID != "" {
		data["request_id"] = event.RequestID
	}
	if event.HTTPMethod != "" {
		data["http_method"] = event.HTTPMethod
	}
	if event.HTTPPath != "" {
		data["http_path"] = event.HTTPPath
	}
	if event.HTTPStatus != nil {
		data["http_status"] = *event.HTTPStatus
	}
	if event.DurationMs != nil {
		data["duration_ms"] = *event.DurationMs
	}
	if event.ErrorCode != "" {
		data["error_code"] = event.ErrorCode
	}
	if event.ErrorMessage != "" {
		data["error_message"] = event.ErrorMessage
	}
	if event.Metadata != nil {
		data["metadata"] = event.Metadata
	}

	payload := map[string]interface{}{
		"id":         payloadID,
		"type":       string(event.Type),
		"created_at": createdAt.UTC().Format(time.RFC3339),
		"severity":   event.Severity,
		"data":       data,
	}
	if event.Message != "" {
		payload["message"] = event.Message
	}
	return payload
}

func (s *webhookService) decryptSecret(endpoint *entity.WebhookEndpoint) (string, error) {
	if endpoint == nil || endpoint.SecretEncrypted == "" {
		return "", ErrInvalidWebhook
	}
	secret, err := s.encryptor.Decrypt(endpoint.SecretEncrypted)
	if err != nil {
		return "", err
	}
	return secret, nil
}

func validateWebhookURL(raw string) (string, error) {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return "", ErrInvalidWebhookURL
	}
	parsed, err := url.Parse(trimmed)
	if err != nil || parsed.Host == "" {
		return "", ErrInvalidWebhookURL
	}
	if parsed.Scheme != "http" && parsed.Scheme != "https" {
		return "", ErrInvalidWebhookURL
	}
	return parsed.String(), nil
}

func normalizeWebhookEvents(events []string) (entity.StringArray, error) {
	if len(events) == 0 {
		return nil, ErrInvalidWebhookEvent
	}
	seen := make(map[string]struct{})
	normalized := make(entity.StringArray, 0, len(events))
	for _, event := range events {
		ev := normalizeEventType(event)
		if ev == "" {
			continue
		}
		if !isAllowedWebhookEvent(ev) {
			return nil, ErrInvalidWebhookEvent
		}
		if _, ok := seen[ev]; ok {
			continue
		}
		seen[ev] = struct{}{}
		normalized = append(normalized, ev)
	}
	if len(normalized) == 0 {
		return nil, ErrInvalidWebhookEvent
	}
	return normalized, nil
}

func normalizeEventType(event string) string {
	return strings.ToLower(strings.TrimSpace(event))
}

func isAllowedWebhookEvent(event string) bool {
	for _, meta := range entity.GetEventTypeMetadata() {
		if string(meta.Type) == event {
			return true
		}
	}
	return false
}

func generateWebhookSecret() string {
	buf := make([]byte, 24)
	if _, err := rand.Read(buf); err != nil {
		return uuid.New().String()
	}
	return hex.EncodeToString(buf)
}

func buildSamplePayload(eventType string, workspaceID, userID uuid.UUID) map[string]interface{} {
	return map[string]interface{}{
		"id":         uuid.New().String(),
		"type":       eventType,
		"created_at": time.Now().UTC().Format(time.RFC3339),
		"data": map[string]interface{}{
			"workspace_id": workspaceID.String(),
			"user_id":      userID.String(),
			"sample":       true,
		},
	}
}
