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
	CertificateActionIssue = "issue"
	CertificateActionRenew = "renew"
)

// CertificateIssueRequest 证书签发请求
type CertificateIssueRequest struct {
	Action        string                 `json:"action"`
	Domain        string                 `json:"domain"`
	AppID         string                 `json:"app_id"`
	AppSlug       string                 `json:"app_slug"`
	WorkspaceID   string                 `json:"workspace_id"`
	WorkspaceSlug string                 `json:"workspace_slug,omitempty"`
	Verification  DomainVerificationInfo `json:"verification"`
	RequestedAt   time.Time              `json:"requested_at"`
}

// CertificateIssueResult 证书签发结果
type CertificateIssueResult struct {
	IssuedAt  *time.Time `json:"issued_at,omitempty"`
	ExpiresAt *time.Time `json:"expires_at,omitempty"`
	Provider  string     `json:"provider,omitempty"`
	Message   string     `json:"message,omitempty"`
}

// CertificateIssuerExecutor 证书签发执行器
type CertificateIssuerExecutor interface {
	Issue(ctx context.Context, req CertificateIssueRequest) (*CertificateIssueResult, error)
}

type noopCertificateIssuerExecutor struct{}

func (noopCertificateIssuerExecutor) Issue(ctx context.Context, req CertificateIssueRequest) (*CertificateIssueResult, error) {
	return &CertificateIssueResult{Provider: "noop"}, nil
}

type webhookCertificateIssuerExecutor struct {
	webhookURL string
	token      string
	httpClient *http.Client
	log        logger.Logger
}

// NewCertificateIssuerExecutor 创建证书签发执行器
func NewCertificateIssuerExecutor(cfg *config.CertificateIssuerConfig, log logger.Logger) CertificateIssuerExecutor {
	if cfg == nil {
		return noopCertificateIssuerExecutor{}
	}
	provider := strings.ToLower(strings.TrimSpace(cfg.Provider))
	if provider == "" {
		return noopCertificateIssuerExecutor{}
	}
	switch provider {
	case "webhook":
		webhookURL := strings.TrimSpace(cfg.WebhookURL)
		if webhookURL == "" {
			return noopCertificateIssuerExecutor{}
		}
		timeout := time.Duration(cfg.TimeoutSeconds) * time.Second
		if timeout <= 0 {
			timeout = 5 * time.Second
		}
		return &webhookCertificateIssuerExecutor{
			webhookURL: webhookURL,
			token:      strings.TrimSpace(cfg.WebhookToken),
			httpClient: &http.Client{Timeout: timeout},
			log:        log,
		}
	default:
		return noopCertificateIssuerExecutor{}
	}
}

type certificateIssueResponse struct {
	IssuedAt  string `json:"issued_at"`
	ExpiresAt string `json:"expires_at"`
	Provider  string `json:"provider"`
	Message   string `json:"message"`
}

func (e *webhookCertificateIssuerExecutor) Issue(ctx context.Context, req CertificateIssueRequest) (*CertificateIssueResult, error) {
	if strings.TrimSpace(e.webhookURL) == "" {
		return &CertificateIssueResult{Provider: "webhook"}, nil
	}

	payload, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}

	request, err := http.NewRequestWithContext(ctx, http.MethodPost, e.webhookURL, bytes.NewBuffer(payload))
	if err != nil {
		return nil, err
	}
	request.Header.Set("Content-Type", "application/json")
	if e.token != "" {
		request.Header.Set("Authorization", "Bearer "+e.token)
	}

	resp, err := e.httpClient.Do(request)
	if err != nil {
		if e.log != nil {
			e.log.Warn("Certificate issuer webhook request failed", "error", err)
		}
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 2048))
		message := strings.TrimSpace(string(body))
		if message == "" {
			message = "issuer returned non-2xx status"
		}
		if e.log != nil {
			e.log.Warn("Certificate issuer webhook rejected",
				"status", resp.StatusCode,
				"response", message,
			)
		}
		return nil, fmt.Errorf("certificate issuer webhook failed: status %d", resp.StatusCode)
	}

	result := &CertificateIssueResult{Provider: "webhook"}
	body, err := io.ReadAll(io.LimitReader(resp.Body, 4096))
	if err != nil || len(body) == 0 {
		return result, nil
	}

	var payloadResp certificateIssueResponse
	if err := json.Unmarshal(body, &payloadResp); err != nil {
		return result, nil
	}
	if payloadResp.Provider != "" {
		result.Provider = payloadResp.Provider
	}
	if payloadResp.Message != "" {
		result.Message = payloadResp.Message
	}
	if issuedAt := parseCertificateTime(payloadResp.IssuedAt); issuedAt != nil {
		result.IssuedAt = issuedAt
	}
	if expiresAt := parseCertificateTime(payloadResp.ExpiresAt); expiresAt != nil {
		result.ExpiresAt = expiresAt
	}

	return result, nil
}

func parseCertificateTime(value string) *time.Time {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return nil
	}
	parsed, err := time.Parse(time.RFC3339, trimmed)
	if err != nil {
		return nil
	}
	return &parsed
}
