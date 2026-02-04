package service

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"net"
	"net/url"
	"regexp"
	"strings"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

const (
	DomainStatusPending   = "pending"
	DomainStatusVerifying = "verifying"
	DomainStatusVerified  = "verified"
	DomainStatusFailed    = "failed"
	DomainStatusActive    = "active"
	DomainStatusBlocked   = "blocked"

	SSLStatusPending = "pending"
	SSLStatusIssuing = "issuing"
	SSLStatusIssued  = "issued"
	SSLStatusFailed  = "failed"
	SSLStatusExpired = "expired"
)

const (
	defaultCertDuration = 90 * 24 * time.Hour
	defaultRenewWindow  = 30 * 24 * time.Hour
	defaultTxtPrefix    = "_agentflow"
)

const (
	domainVerifyMaxAttempts = 3
	domainVerifyRetryBase   = 5 * time.Minute
	domainVerifyRetryMax    = 24 * time.Hour
	defaultSupportPath      = "/support"
)

const (
	sslIssueMaxAttempts = 3
	sslIssueRetryBase   = 10 * time.Minute
	sslIssueRetryMax    = 24 * time.Hour
)

// AppDomainService App 域名服务接口
type AppDomainService interface {
	ListByApp(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID) ([]entity.AppDomain, error)
	Create(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, req CreateAppDomainRequest) (*AppDomainCreateResult, error)
	Verify(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, domainID uuid.UUID) (*AppDomainVerifyResult, error)
	VerifyByID(ctx context.Context, ownerID uuid.UUID, domainID uuid.UUID) (*AppDomainVerifyResult, error)
	IssueCertificate(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, domainID uuid.UUID) (*entity.AppDomain, error)
	RenewCertificate(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, domainID uuid.UUID) (*entity.AppDomain, error)
	Activate(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, domainID uuid.UUID) (*entity.AppDomain, error)
	Rollback(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, domainID uuid.UUID) (*entity.AppDomain, error)
	UpdateExpiry(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, domainID uuid.UUID, expiresAt *time.Time) (*entity.AppDomain, error)
	Block(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, domainID uuid.UUID, reason string) (*entity.AppDomain, error)
	Unblock(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, domainID uuid.UUID) (*entity.AppDomain, error)
	Delete(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, domainID uuid.UUID) error
}

// CreateAppDomainRequest 创建 App 域名请求
type CreateAppDomainRequest struct {
	Domain string
}

// DomainVerificationInfo 域名验证信息
type DomainVerificationInfo struct {
	TXTName  string `json:"txt_name"`
	TXTValue string `json:"txt_value"`
	CNAME    string `json:"cname_target"`
}

// AppDomainCreateResult 创建域名结果
type AppDomainCreateResult struct {
	Domain       *entity.AppDomain      `json:"domain"`
	Verification DomainVerificationInfo `json:"verification"`
}

// AppDomainVerifyResult 验证域名结果
type AppDomainVerifyResult struct {
	Domain       *entity.AppDomain      `json:"domain"`
	Verified     bool                   `json:"verified"`
	Method       string                 `json:"method"`
	Verification DomainVerificationInfo `json:"verification"`
}

// DomainVerifyError 域名验证错误（带重试信息）
type DomainVerifyError struct {
	Err          error
	Domain       *entity.AppDomain
	NextRetryAt  *time.Time
	SupportURL   *string
	Verification DomainVerificationInfo
}

func (e *DomainVerifyError) Error() string {
	if e.Err != nil {
		return e.Err.Error()
	}
	return "domain verify failed"
}

func (e *DomainVerifyError) Unwrap() error {
	return e.Err
}

// SSLIssueError 证书签发错误（带重试信息）
type SSLIssueError struct {
	Err         error
	Domain      *entity.AppDomain
	NextRetryAt *time.Time
	SupportURL  *string
}

func (e *SSLIssueError) Error() string {
	if e.Err != nil {
		return e.Err.Error()
	}
	return "ssl issue failed"
}

func (e *SSLIssueError) Unwrap() error {
	return e.Err
}

type appDomainService struct {
	appRepo           repository.AppRepository
	domainRepo        repository.AppDomainRepository
	eventRecorder     EventRecorderService
	baseURL           string
	baseHosts         map[string]struct{}
	txtPrefix         string
	routingExecutor   DomainRoutingExecutor
	certificateIssuer CertificateIssuerExecutor
}

// NewAppDomainService 创建 App 域名服务实例
func NewAppDomainService(
	appRepo repository.AppRepository,
	domainRepo repository.AppDomainRepository,
	eventRecorder EventRecorderService,
	baseURL string,
	regionBaseURLs map[string]string,
	routingExecutor DomainRoutingExecutor,
	certificateIssuer CertificateIssuerExecutor,
) AppDomainService {
	if routingExecutor == nil {
		routingExecutor = noopDomainRoutingExecutor{}
	}
	if certificateIssuer == nil {
		certificateIssuer = noopCertificateIssuerExecutor{}
	}
	return &appDomainService{
		appRepo:           appRepo,
		domainRepo:        domainRepo,
		eventRecorder:     eventRecorder,
		baseURL:           baseURL,
		baseHosts:         buildReservedDomainHosts(baseURL, regionBaseURLs),
		txtPrefix:         defaultTxtPrefix,
		routingExecutor:   routingExecutor,
		certificateIssuer: certificateIssuer,
	}
}

func (s *appDomainService) ListByApp(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID) ([]entity.AppDomain, error) {
	if err := s.ensureAppOwner(ctx, ownerID, appID); err != nil {
		return nil, err
	}
	return s.domainRepo.ListByAppID(ctx, appID)
}

func (s *appDomainService) Create(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, req CreateAppDomainRequest) (*AppDomainCreateResult, error) {
	if err := s.ensureAppOwner(ctx, ownerID, appID); err != nil {
		return nil, err
	}

	normalized, err := normalizeDomain(req.Domain)
	if err != nil {
		return nil, ErrAppDomainInvalid
	}
	if s.isReservedDomain(normalized) {
		return nil, ErrAppDomainReserved
	}

	if existing, err := s.domainRepo.GetByDomain(ctx, normalized); err == nil && existing != nil {
		return nil, ErrAppDomainExists
	} else if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	token, err := generateVerificationToken()
	if err != nil {
		return nil, err
	}

	domain := &entity.AppDomain{
		AppID:             appID,
		Domain:            normalized,
		Status:            DomainStatusPending,
		VerificationToken: &token,
		SSLStatus:         SSLStatusPending,
	}

	if err := s.domainRepo.Create(ctx, domain); err != nil {
		return nil, err
	}

	return &AppDomainCreateResult{
		Domain:       domain,
		Verification: s.buildVerificationInfo(normalized, token),
	}, nil
}

func (s *appDomainService) Verify(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, domainID uuid.UUID) (*AppDomainVerifyResult, error) {
	domain, err := s.getDomainForApp(ctx, ownerID, appID, domainID)
	if err != nil {
		return nil, err
	}
	if domain.Status == DomainStatusBlocked {
		return nil, ErrAppDomainBlocked
	}

	verification := s.buildVerificationInfo(domain.Domain, safeToken(domain.VerificationToken))

	if domain.Status == DomainStatusVerified || domain.Status == DomainStatusActive {
		return &AppDomainVerifyResult{
			Domain:       domain,
			Verified:     true,
			Method:       "cached",
			Verification: verification,
		}, nil
	}

	now := time.Now()
	if domain.NextRetryAt != nil && now.Before(*domain.NextRetryAt) {
		return nil, &DomainVerifyError{
			Err:          ErrAppDomainRetryLater,
			Domain:       domain,
			NextRetryAt:  domain.NextRetryAt,
			SupportURL:   domain.SupportURL,
			Verification: verification,
		}
	}

	if domain.VerificationToken == nil || strings.TrimSpace(*domain.VerificationToken) == "" {
		return nil, ErrAppDomainInvalidToken
	}

	domain.Status = DomainStatusVerifying
	if err := s.domainRepo.Update(ctx, domain); err != nil {
		return nil, err
	}

	startedAt := time.Now()
	method, verifyErr := s.verifyDomainDNS(domain.Domain, *domain.VerificationToken)
	if verifyErr != nil {
		return nil, s.markVerificationFailed(ctx, domain, verification, verifyErr, startedAt)
	}

	domain.Status = DomainStatusVerified
	domain.VerifiedAt = &now
	domain.VerificationAttempts = 0
	domain.LastVerificationError = nil
	domain.NextRetryAt = nil
	domain.SupportURL = nil
	if err := s.domainRepo.Update(ctx, domain); err != nil {
		return nil, err
	}

	return &AppDomainVerifyResult{
		Domain:       domain,
		Verified:     true,
		Method:       method,
		Verification: verification,
	}, nil
}

func (s *appDomainService) VerifyByID(ctx context.Context, ownerID uuid.UUID, domainID uuid.UUID) (*AppDomainVerifyResult, error) {
	domain, err := s.domainRepo.GetByID(ctx, domainID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAppDomainNotFound
		}
		return nil, err
	}
	return s.Verify(ctx, ownerID, domain.AppID, domainID)
}

func (s *appDomainService) IssueCertificate(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, domainID uuid.UUID) (*entity.AppDomain, error) {
	domain, err := s.getDomainForApp(ctx, ownerID, appID, domainID)
	if err != nil {
		return nil, err
	}
	if domain.Status == DomainStatusBlocked {
		return nil, ErrAppDomainBlocked
	}
	if domain.Status != DomainStatusVerified && domain.Status != DomainStatusActive {
		return nil, ErrAppDomainNotVerified
	}

	now := time.Now()
	if domain.SSLStatus == SSLStatusIssued && domain.SSLExpiresAt != nil && domain.SSLExpiresAt.After(now.Add(defaultRenewWindow)) {
		return domain, nil
	}

	if domain.SSLNextRetryAt != nil && now.Before(*domain.SSLNextRetryAt) {
		return nil, &SSLIssueError{
			Err:         ErrAppDomainSSLRetryLater,
			Domain:      domain,
			NextRetryAt: domain.SSLNextRetryAt,
			SupportURL:  domain.SupportURL,
		}
	}

	if domain.SSLStatus == SSLStatusFailed && domain.SSLIssueAttempts >= sslIssueMaxAttempts {
		return nil, &SSLIssueError{
			Err:         ErrAppDomainSSLSupportRequired,
			Domain:      domain,
			NextRetryAt: domain.SSLNextRetryAt,
			SupportURL:  domain.SupportURL,
		}
	}

	domain.SSLStatus = SSLStatusIssuing
	domain.LastSSLError = nil
	if err := s.domainRepo.Update(ctx, domain); err != nil {
		return nil, err
	}

	app, err := s.getAppForOwner(ctx, ownerID, appID)
	if err != nil {
		return nil, err
	}

	result, err := s.certificateIssuer.Issue(ctx, s.buildCertificateRequest(app, domain, CertificateActionIssue))
	if err != nil {
		return nil, s.markSSLIssueFailed(ctx, domain, err)
	}

	issuedAt := now
	if result != nil && result.IssuedAt != nil {
		issuedAt = *result.IssuedAt
	}
	expiresAt := issuedAt.Add(defaultCertDuration)
	if result != nil && result.ExpiresAt != nil {
		expiresAt = *result.ExpiresAt
	}

	domain.SSLStatus = SSLStatusIssued
	domain.SSLIssuedAt = &issuedAt
	domain.SSLExpiresAt = &expiresAt
	domain.SSLExpiryNotifiedAt = nil
	domain.SSLIssueAttempts = 0
	domain.SSLNextRetryAt = nil
	domain.LastSSLError = nil
	domain.SupportURL = nil
	if err := s.domainRepo.Update(ctx, domain); err != nil {
		return nil, err
	}

	return domain, nil
}

func (s *appDomainService) RenewCertificate(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, domainID uuid.UUID) (*entity.AppDomain, error) {
	domain, err := s.getDomainForApp(ctx, ownerID, appID, domainID)
	if err != nil {
		return nil, err
	}
	if domain.Status == DomainStatusBlocked {
		return nil, ErrAppDomainBlocked
	}
	if (domain.SSLStatus != SSLStatusIssued && domain.SSLStatus != SSLStatusFailed) || domain.SSLExpiresAt == nil {
		return nil, ErrAppDomainSSLNotIssued
	}

	now := time.Now()
	if domain.SSLExpiresAt.After(now.Add(defaultRenewWindow)) {
		return nil, ErrAppDomainSSLNotDue
	}

	if domain.SSLNextRetryAt != nil && now.Before(*domain.SSLNextRetryAt) {
		return nil, &SSLIssueError{
			Err:         ErrAppDomainSSLRetryLater,
			Domain:      domain,
			NextRetryAt: domain.SSLNextRetryAt,
			SupportURL:  domain.SupportURL,
		}
	}

	if domain.SSLStatus == SSLStatusFailed && domain.SSLIssueAttempts >= sslIssueMaxAttempts {
		return nil, &SSLIssueError{
			Err:         ErrAppDomainSSLSupportRequired,
			Domain:      domain,
			NextRetryAt: domain.SSLNextRetryAt,
			SupportURL:  domain.SupportURL,
		}
	}

	domain.SSLStatus = SSLStatusIssuing
	domain.LastSSLError = nil
	if err := s.domainRepo.Update(ctx, domain); err != nil {
		return nil, err
	}

	app, err := s.getAppForOwner(ctx, ownerID, appID)
	if err != nil {
		return nil, err
	}

	result, err := s.certificateIssuer.Issue(ctx, s.buildCertificateRequest(app, domain, CertificateActionRenew))
	if err != nil {
		return nil, s.markSSLIssueFailed(ctx, domain, err)
	}

	issuedAt := now
	if result != nil && result.IssuedAt != nil {
		issuedAt = *result.IssuedAt
	}
	expiresAt := issuedAt.Add(defaultCertDuration)
	if result != nil && result.ExpiresAt != nil {
		expiresAt = *result.ExpiresAt
	}

	domain.SSLIssuedAt = &issuedAt
	domain.SSLExpiresAt = &expiresAt
	domain.SSLStatus = SSLStatusIssued
	domain.SSLExpiryNotifiedAt = nil
	domain.SSLIssueAttempts = 0
	domain.SSLNextRetryAt = nil
	domain.LastSSLError = nil
	domain.SupportURL = nil
	if err := s.domainRepo.Update(ctx, domain); err != nil {
		return nil, err
	}

	return domain, nil
}

func (s *appDomainService) Activate(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, domainID uuid.UUID) (*entity.AppDomain, error) {
	domain, err := s.getDomainForApp(ctx, ownerID, appID, domainID)
	if err != nil {
		return nil, err
	}
	if domain.Status == DomainStatusBlocked {
		return nil, ErrAppDomainBlocked
	}
	if domain.Status != DomainStatusVerified && domain.Status != DomainStatusActive {
		return nil, ErrAppDomainNotVerified
	}
	if domain.SSLStatus != SSLStatusIssued {
		return nil, ErrAppDomainSSLNotIssued
	}
	if domain.Status == DomainStatusActive {
		return domain, nil
	}

	app, err := s.getAppForOwner(ctx, ownerID, appID)
	if err != nil {
		return nil, err
	}

	previousDomain := s.findActiveDomain(ctx, appID, domainID)
	payload := s.buildRoutingRequest(app, domain, DomainRoutingActionActivate, previousDomain)
	if err := s.routingExecutor.Execute(ctx, payload); err != nil {
		return nil, ErrAppDomainRoutingFailed
	}

	if err := s.domainRepo.UpdateStatusByApp(ctx, appID, DomainStatusActive, DomainStatusVerified, &domainID); err != nil {
		return nil, err
	}

	domain.Status = DomainStatusActive
	if err := s.domainRepo.Update(ctx, domain); err != nil {
		return nil, err
	}

	return domain, nil
}

func (s *appDomainService) Rollback(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, domainID uuid.UUID) (*entity.AppDomain, error) {
	domain, err := s.getDomainForApp(ctx, ownerID, appID, domainID)
	if err != nil {
		return nil, err
	}
	if domain.Status == DomainStatusBlocked {
		return nil, ErrAppDomainBlocked
	}
	if domain.Status != DomainStatusActive {
		return nil, ErrAppDomainNotActive
	}

	app, err := s.getAppForOwner(ctx, ownerID, appID)
	if err != nil {
		return nil, err
	}

	payload := s.buildRoutingRequest(app, domain, DomainRoutingActionRollback, "")
	if err := s.routingExecutor.Execute(ctx, payload); err != nil {
		return nil, ErrAppDomainRoutingFailed
	}

	domain.Status = DomainStatusVerified
	if err := s.domainRepo.Update(ctx, domain); err != nil {
		return nil, err
	}

	return domain, nil
}

func (s *appDomainService) UpdateExpiry(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, domainID uuid.UUID, expiresAt *time.Time) (*entity.AppDomain, error) {
	domain, err := s.getDomainForApp(ctx, ownerID, appID, domainID)
	if err != nil {
		return nil, err
	}
	if domain.Status == DomainStatusBlocked {
		return nil, ErrAppDomainBlocked
	}
	domain.DomainExpiresAt = expiresAt
	domain.DomainExpiryNotifiedAt = nil
	if err := s.domainRepo.Update(ctx, domain); err != nil {
		return nil, err
	}
	return domain, nil
}

func (s *appDomainService) Block(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, domainID uuid.UUID, reason string) (*entity.AppDomain, error) {
	domain, err := s.getDomainForApp(ctx, ownerID, appID, domainID)
	if err != nil {
		return nil, err
	}
	if domain.Status == DomainStatusBlocked {
		return nil, ErrAppDomainAlreadyBlocked
	}
	now := time.Now()
	trimmedReason := strings.TrimSpace(reason)
	domain.Status = DomainStatusBlocked
	domain.BlockedAt = &now
	if trimmedReason != "" {
		domain.BlockedReason = &trimmedReason
	} else {
		domain.BlockedReason = nil
	}
	if err := s.domainRepo.Update(ctx, domain); err != nil {
		return nil, err
	}
	return domain, nil
}

func (s *appDomainService) Unblock(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, domainID uuid.UUID) (*entity.AppDomain, error) {
	domain, err := s.getDomainForApp(ctx, ownerID, appID, domainID)
	if err != nil {
		return nil, err
	}
	if domain.Status != DomainStatusBlocked {
		return nil, ErrAppDomainNotBlocked
	}
	domain.BlockedAt = nil
	domain.BlockedReason = nil
	if domain.VerifiedAt != nil {
		domain.Status = DomainStatusVerified
	} else {
		domain.Status = DomainStatusPending
	}
	if err := s.domainRepo.Update(ctx, domain); err != nil {
		return nil, err
	}
	return domain, nil
}

func (s *appDomainService) Delete(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, domainID uuid.UUID) error {
	domain, err := s.getDomainForApp(ctx, ownerID, appID, domainID)
	if err != nil {
		return err
	}
	if domain.Status == DomainStatusActive {
		return ErrAppDomainActive
	}
	return s.domainRepo.Delete(ctx, domain.ID)
}

func (s *appDomainService) getAppForOwner(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID) (*entity.App, error) {
	app, err := s.appRepo.GetByID(ctx, appID)
	if err != nil {
		return nil, ErrAppNotFound
	}
	if app.OwnerUserID != ownerID {
		return nil, ErrAppUnauthorized
	}
	return app, nil
}

func (s *appDomainService) ensureAppOwner(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID) error {
	_, err := s.getAppForOwner(ctx, ownerID, appID)
	return err
}

func (s *appDomainService) getDomainForApp(ctx context.Context, ownerID uuid.UUID, appID uuid.UUID, domainID uuid.UUID) (*entity.AppDomain, error) {
	if err := s.ensureAppOwner(ctx, ownerID, appID); err != nil {
		return nil, err
	}
	domain, err := s.domainRepo.GetByID(ctx, domainID)
	if err != nil {
		return nil, ErrAppDomainNotFound
	}
	if domain.AppID != appID {
		return nil, ErrAppDomainNotFound
	}
	return domain, nil
}

func (s *appDomainService) buildVerificationInfo(domain string, token string) DomainVerificationInfo {
	return DomainVerificationInfo{
		TXTName:  fmt.Sprintf("%s.%s", s.txtPrefix, domain),
		TXTValue: token,
		CNAME:    s.cnameTarget(),
	}
}

func (s *appDomainService) buildRoutingRequest(app *entity.App, domain *entity.AppDomain, action string, previousDomain string) DomainRoutingRequest {
	workspaceSlug := ""
	if app.Workspace != nil {
		workspaceSlug = app.Workspace.Slug
	}
	return DomainRoutingRequest{
		Action:         action,
		Domain:         domain.Domain,
		PreviousDomain: previousDomain,
		AppID:          app.ID.String(),
		AppSlug:        app.Slug,
		WorkspaceID:    app.WorkspaceID.String(),
		WorkspaceSlug:  workspaceSlug,
		TargetBaseURL:  s.baseURL,
		TargetHost:     s.cnameTarget(),
		RequestedAt:    time.Now().UTC(),
	}
}

func (s *appDomainService) buildCertificateRequest(app *entity.App, domain *entity.AppDomain, action string) CertificateIssueRequest {
	workspaceSlug := ""
	if app.Workspace != nil {
		workspaceSlug = app.Workspace.Slug
	}
	return CertificateIssueRequest{
		Action:        action,
		Domain:        domain.Domain,
		AppID:         app.ID.String(),
		AppSlug:       app.Slug,
		WorkspaceID:   app.WorkspaceID.String(),
		WorkspaceSlug: workspaceSlug,
		Verification:  s.buildVerificationInfo(domain.Domain, safeToken(domain.VerificationToken)),
		RequestedAt:   time.Now().UTC(),
	}
}

func (s *appDomainService) findActiveDomain(ctx context.Context, appID uuid.UUID, excludeID uuid.UUID) string {
	domains, err := s.domainRepo.ListByAppID(ctx, appID)
	if err != nil {
		return ""
	}
	for _, item := range domains {
		if item.ID == excludeID {
			continue
		}
		if strings.EqualFold(item.Status, DomainStatusActive) {
			return item.Domain
		}
	}
	return ""
}

func (s *appDomainService) cnameTarget() string {
	parsed, err := url.Parse(s.baseURL)
	if err != nil {
		return normalizeHost(s.baseURL)
	}
	host := parsed.Hostname()
	if host == "" {
		return normalizeHost(s.baseURL)
	}
	return normalizeHost(host)
}

func (s *appDomainService) verifyDomainDNS(domain, token string) (string, error) {
	txtName := fmt.Sprintf("%s.%s", s.txtPrefix, domain)
	txtRecords, txtErr := net.LookupTXT(txtName)
	if txtErr == nil {
		for _, record := range txtRecords {
			if strings.Contains(record, token) {
				return "txt", nil
			}
		}
	}

	cnameTarget := s.cnameTarget()
	if cnameTarget != "" {
		cname, cnameErr := net.LookupCNAME(domain)
		if cnameErr == nil {
			if normalizeHost(cname) == normalizeHost(cnameTarget) {
				return "cname", nil
			}
		}
	}

	return "", ErrAppDomainVerificationFailed
}

func (s *appDomainService) markVerificationFailed(ctx context.Context, domain *entity.AppDomain, verification DomainVerificationInfo, verifyErr error, startedAt time.Time) error {
	attempts := domain.VerificationAttempts + 1
	domain.VerificationAttempts = attempts
	domain.Status = DomainStatusFailed

	errMessage := strings.TrimSpace(verifyErr.Error())
	if errMessage != "" {
		domain.LastVerificationError = &errMessage
	} else {
		domain.LastVerificationError = nil
	}

	nextRetry := s.nextRetryAt(attempts, time.Now())
	domain.NextRetryAt = &nextRetry

	if attempts >= domainVerifyMaxAttempts {
		supportURL := s.supportURL()
		if supportURL != "" {
			domain.SupportURL = &supportURL
		}
	} else {
		domain.SupportURL = nil
	}

	_ = s.domainRepo.Update(ctx, domain)
	if s.eventRecorder != nil && domain != nil {
		durationMs := time.Since(startedAt).Milliseconds()
		if durationMs < 0 {
			durationMs = 0
		}
		_ = s.eventRecorder.RecordDomainEvent(ctx, entity.EventDomainVerifyFailed, domain.AppID, domain.Domain, durationMs, verifyErr)
	}

	reason := ErrAppDomainVerificationFailed
	if attempts >= domainVerifyMaxAttempts {
		reason = ErrAppDomainSupportRequired
	}

	return &DomainVerifyError{
		Err:          reason,
		Domain:       domain,
		NextRetryAt:  domain.NextRetryAt,
		SupportURL:   domain.SupportURL,
		Verification: verification,
	}
}

func (s *appDomainService) markSSLIssueFailed(ctx context.Context, domain *entity.AppDomain, issueErr error) error {
	attempts := domain.SSLIssueAttempts + 1
	domain.SSLIssueAttempts = attempts
	domain.SSLStatus = SSLStatusFailed

	errMessage := strings.TrimSpace(issueErr.Error())
	if errMessage != "" {
		domain.LastSSLError = &errMessage
	} else {
		domain.LastSSLError = nil
	}

	nextRetry := s.nextSSLRetryAt(attempts, time.Now())
	domain.SSLNextRetryAt = &nextRetry

	reason := ErrAppDomainSSLRetryLater
	if attempts >= sslIssueMaxAttempts {
		reason = ErrAppDomainSSLSupportRequired
		supportURL := s.supportURL()
		if supportURL != "" {
			domain.SupportURL = &supportURL
		}
	} else {
		domain.SupportURL = nil
	}

	_ = s.domainRepo.Update(ctx, domain)

	return &SSLIssueError{
		Err:         reason,
		Domain:      domain,
		NextRetryAt: domain.SSLNextRetryAt,
		SupportURL:  domain.SupportURL,
	}
}

func (s *appDomainService) nextRetryAt(attempts int, now time.Time) time.Time {
	if attempts <= 0 {
		return now.Add(domainVerifyRetryBase)
	}
	backoff := domainVerifyRetryBase * time.Duration(1<<uint(attempts-1))
	if backoff > domainVerifyRetryMax {
		backoff = domainVerifyRetryMax
	}
	return now.Add(backoff)
}

func (s *appDomainService) nextSSLRetryAt(attempts int, now time.Time) time.Time {
	if attempts <= 0 {
		return now.Add(sslIssueRetryBase)
	}
	backoff := sslIssueRetryBase * time.Duration(1<<uint(attempts-1))
	if backoff > sslIssueRetryMax {
		backoff = sslIssueRetryMax
	}
	return now.Add(backoff)
}

func (s *appDomainService) supportURL() string {
	if strings.TrimSpace(s.baseURL) == "" {
		return ""
	}
	base := strings.TrimRight(s.baseURL, "/")
	return base + defaultSupportPath
}

func (s *appDomainService) isReservedDomain(domain string) bool {
	if domain == "" || len(s.baseHosts) == 0 {
		return false
	}
	for host := range s.baseHosts {
		if host == "" {
			continue
		}
		if domain == host || strings.HasSuffix(domain, "."+host) {
			return true
		}
	}
	return false
}

func buildReservedDomainHosts(baseURL string, regionBaseURLs map[string]string) map[string]struct{} {
	hosts := make(map[string]struct{})
	addHost := func(value string) {
		if host := normalizeBaseHost(value); host != "" {
			hosts[host] = struct{}{}
		}
	}
	addHost(baseURL)
	for _, value := range regionBaseURLs {
		addHost(value)
	}
	return hosts
}

func normalizeBaseHost(value string) string {
	trimmed := strings.TrimSpace(strings.ToLower(value))
	if trimmed == "" {
		return ""
	}
	if !strings.Contains(trimmed, "://") {
		trimmed = "http://" + trimmed
	}
	parsed, err := url.Parse(trimmed)
	if err != nil {
		return ""
	}
	host := strings.TrimSpace(parsed.Hostname())
	if host == "" {
		host = strings.TrimSpace(parsed.Host)
	}
	if host == "" {
		return ""
	}
	return normalizeHost(host)
}

func normalizeDomain(raw string) (string, error) {
	domain := strings.TrimSpace(strings.ToLower(raw))
	if domain == "" {
		return "", ErrAppDomainInvalid
	}
	if strings.Contains(domain, "://") {
		return "", ErrAppDomainInvalid
	}
	domain = strings.TrimSuffix(domain, ".")
	if strings.Contains(domain, "/") || strings.Contains(domain, " ") || strings.HasPrefix(domain, "*.") {
		return "", ErrAppDomainInvalid
	}
	if !domainRegexp.MatchString(domain) {
		return "", ErrAppDomainInvalid
	}
	return domain, nil
}

func normalizeHost(host string) string {
	host = strings.TrimSpace(strings.ToLower(host))
	host = strings.TrimSuffix(host, ".")
	if strings.Contains(host, ":") {
		parsed, err := url.Parse("http://" + host)
		if err == nil && parsed.Hostname() != "" {
			return strings.ToLower(parsed.Hostname())
		}
	}
	return host
}

func generateVerificationToken() (string, error) {
	b := make([]byte, 18)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

func safeToken(token *string) string {
	if token == nil {
		return ""
	}
	return *token
}

var domainRegexp = regexp.MustCompile(`^(?i)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$`)

var (
	ErrAppDomainInvalid                = errors.New("app domain is invalid")
	ErrAppDomainReserved               = errors.New("app domain is reserved")
	ErrAppDomainExists                 = errors.New("app domain already exists")
	ErrAppDomainNotFound               = errors.New("app domain not found")
	ErrAppDomainVerificationFailed     = errors.New("app domain verification failed")
	ErrAppDomainRetryLater             = errors.New("app domain retry later")
	ErrAppDomainSupportRequired        = errors.New("app domain support required")
	ErrAppDomainInvalidToken           = errors.New("app domain verification token invalid")
	ErrAppDomainNotVerified            = errors.New("app domain not verified")
	ErrAppDomainSSLNotIssued           = errors.New("app domain ssl not issued")
	ErrAppDomainSSLNotDue              = errors.New("app domain ssl renewal not due yet")
	ErrAppDomainSSLRetryLater          = errors.New("app domain ssl retry later")
	ErrAppDomainSSLSupportRequired     = errors.New("app domain ssl support required")
	ErrAppDomainCertificateIssueFailed = errors.New("app domain certificate issue failed")
	ErrAppDomainCertificateRenewFailed = errors.New("app domain certificate renew failed")
	ErrAppDomainNotActive              = errors.New("app domain not active")
	ErrAppDomainActive                 = errors.New("app domain is active")
	ErrAppDomainRoutingFailed          = errors.New("app domain routing failed")
	ErrAppDomainBlocked                = errors.New("app domain is blocked")
	ErrAppDomainAlreadyBlocked         = errors.New("app domain already blocked")
	ErrAppDomainNotBlocked             = errors.New("app domain not blocked")
)
