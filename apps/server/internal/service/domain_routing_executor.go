package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/agentflow/server/internal/config"
	"github.com/agentflow/server/internal/pkg/logger"
)

const (
	DomainRoutingActionActivate = "activate"
	DomainRoutingActionRollback = "rollback"
)

// DomainRoutingRequest 网关切流请求
type DomainRoutingRequest struct {
	Action         string    `json:"action"`
	Domain         string    `json:"domain"`
	PreviousDomain string    `json:"previous_domain,omitempty"`
	AppID          string    `json:"app_id"`
	AppSlug        string    `json:"app_slug"`
	WorkspaceID    string    `json:"workspace_id"`
	WorkspaceSlug  string    `json:"workspace_slug"`
	TargetBaseURL  string    `json:"target_base_url"`
	TargetHost     string    `json:"target_host"`
	RequestedAt    time.Time `json:"requested_at"`
}

// DomainRoutingExecutor 域名路由切流执行器
type DomainRoutingExecutor interface {
	Execute(ctx context.Context, req DomainRoutingRequest) error
}

type noopDomainRoutingExecutor struct{}

func (noopDomainRoutingExecutor) Execute(ctx context.Context, req DomainRoutingRequest) error {
	return nil
}

type webhookDomainRoutingExecutor struct {
	webhookURL string
	token      string
	httpClient *http.Client
	log        logger.Logger
}

// NewDomainRoutingExecutor 创建域名路由切流执行器
func NewDomainRoutingExecutor(cfg *config.DomainRoutingConfig, log logger.Logger) DomainRoutingExecutor {
	if cfg == nil {
		return noopDomainRoutingExecutor{}
	}
	provider := strings.ToLower(strings.TrimSpace(cfg.Provider))
	if provider == "" {
		return noopDomainRoutingExecutor{}
	}
	switch provider {
	case "webhook":
		webhookURL := strings.TrimSpace(cfg.WebhookURL)
		if webhookURL == "" {
			return noopDomainRoutingExecutor{}
		}
		timeout := time.Duration(cfg.TimeoutSeconds) * time.Second
		if timeout <= 0 {
			timeout = 3 * time.Second
		}
		return &webhookDomainRoutingExecutor{
			webhookURL: webhookURL,
			token:      strings.TrimSpace(cfg.WebhookToken),
			httpClient: &http.Client{Timeout: timeout},
			log:        log,
		}
	default:
		return noopDomainRoutingExecutor{}
	}
}

func (e *webhookDomainRoutingExecutor) Execute(ctx context.Context, req DomainRoutingRequest) error {
	if strings.TrimSpace(e.webhookURL) == "" {
		return nil
	}

	payload, err := json.Marshal(req)
	if err != nil {
		return err
	}

	request, err := http.NewRequestWithContext(ctx, http.MethodPost, e.webhookURL, bytes.NewBuffer(payload))
	if err != nil {
		return err
	}
	request.Header.Set("Content-Type", "application/json")
	if e.token != "" {
		request.Header.Set("Authorization", "Bearer "+e.token)
	}

	resp, err := e.httpClient.Do(request)
	if err != nil {
		if e.log != nil {
			e.log.Warn("Domain routing webhook request failed", "error", err)
		}
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 2048))
		message := strings.TrimSpace(string(body))
		if message == "" {
			message = "gateway returned non-2xx status"
		}
		if e.log != nil {
			e.log.Warn("Domain routing webhook rejected",
				"status", resp.StatusCode,
				"response", message,
			)
		}
		return fmt.Errorf("domain routing webhook failed: status %d", resp.StatusCode)
	}

	return nil
}
