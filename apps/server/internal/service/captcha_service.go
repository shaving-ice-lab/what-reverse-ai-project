package service

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/reverseai/server/internal/config"
)

var (
	ErrCaptchaRequired    = errors.New("captcha required")
	ErrCaptchaInvalid     = errors.New("captcha invalid")
	ErrCaptchaUnavailable = errors.New("captcha unavailable")
)

// CaptchaVerifier 验证码校验器
type CaptchaVerifier interface {
	Verify(ctx context.Context, token string, remoteIP string) error
}

type noopCaptchaVerifier struct{}

func (noopCaptchaVerifier) Verify(ctx context.Context, token string, remoteIP string) error {
	return ErrCaptchaUnavailable
}

type turnstileCaptchaVerifier struct {
	secret     string
	verifyURL  string
	httpClient *http.Client
}

type turnstileResponse struct {
	Success    bool     `json:"success"`
	ErrorCodes []string `json:"error-codes"`
}

const defaultTurnstileVerifyURL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

// NewCaptchaVerifier 创建验证码校验器
func NewCaptchaVerifier(cfg *config.CaptchaConfig) CaptchaVerifier {
	if cfg == nil {
		return noopCaptchaVerifier{}
	}

	provider := strings.ToLower(strings.TrimSpace(cfg.Provider))
	secret := strings.TrimSpace(cfg.Secret)
	if provider == "" || secret == "" {
		return noopCaptchaVerifier{}
	}

	verifyURL := strings.TrimSpace(cfg.VerifyURL)
	if verifyURL == "" {
		verifyURL = defaultTurnstileVerifyURL
	}
	timeout := time.Duration(cfg.TimeoutSeconds) * time.Second
	if timeout <= 0 {
		timeout = 3 * time.Second
	}

	switch provider {
	case "turnstile":
		return &turnstileCaptchaVerifier{
			secret:    secret,
			verifyURL: verifyURL,
			httpClient: &http.Client{
				Timeout: timeout,
			},
		}
	default:
		return noopCaptchaVerifier{}
	}
}

func (v *turnstileCaptchaVerifier) Verify(ctx context.Context, token string, remoteIP string) error {
	trimmedToken := strings.TrimSpace(token)
	if trimmedToken == "" {
		return ErrCaptchaRequired
	}

	form := url.Values{}
	form.Set("secret", v.secret)
	form.Set("response", trimmedToken)
	if strings.TrimSpace(remoteIP) != "" {
		form.Set("remoteip", strings.TrimSpace(remoteIP))
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, v.verifyURL, strings.NewReader(form.Encode()))
	if err != nil {
		return ErrCaptchaUnavailable
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := v.httpClient.Do(req)
	if err != nil {
		return ErrCaptchaUnavailable
	}
	defer resp.Body.Close()

	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return ErrCaptchaUnavailable
	}

	var payload turnstileResponse
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return ErrCaptchaUnavailable
	}
	if !payload.Success {
		return ErrCaptchaInvalid
	}

	return nil
}
