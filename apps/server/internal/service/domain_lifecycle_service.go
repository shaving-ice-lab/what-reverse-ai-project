package service

import (
	"context"
	"errors"
	"fmt"
	"net"
	"net/url"
	"strings"
	"time"

	"github.com/agentflow/server/internal/config"
	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/pkg/logger"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
)

const (
	defaultDomainLifecycleInterval   = 6 * time.Hour
	defaultDomainExpiryWarningDays   = 30
	defaultSSLExpiryWarningDays      = 14
	defaultSSLAutoRenewDays          = 7
	defaultDomainLifecycleBatchLimit = 200

	sslIssueRetryBase = 10 * time.Minute
	sslIssueRetryMax  = 24 * time.Hour
)

// DomainLifecycleReport 域名生命周期巡检报告
type DomainLifecycleReport struct {
	DomainExpiryNotified int `json:"domain_expiry_notified"`
	SSLExpiryNotified    int `json:"ssl_expiry_notified"`
	SSLExpired           int `json:"ssl_expired"`
	SSLAutoRenewed       int `json:"ssl_auto_renewed"`
	SSLAutoRenewFailed   int `json:"ssl_auto_renew_failed"`
}

// DomainLifecycleService 域名生命周期服务
type DomainLifecycleService interface {
	Run(ctx context.Context)
	RunOnce(ctx context.Context) (*DomainLifecycleReport, error)
}

type domainLifecycleService struct {
	cfg                 config.DomainLifecycleConfig
	workspaceRepo       repository.WorkspaceRepository
	notificationService NotificationService
	workspaceDomainSvc  WorkspaceDomainService
	eventRecorder       EventRecorderService
	log                 logger.Logger
	baseURL             string
	txtPrefix           string
}

// NewDomainLifecycleService 创建域名生命周期服务
func NewDomainLifecycleService(
	cfg config.DomainLifecycleConfig,
	workspaceRepo repository.WorkspaceRepository,
	notificationService NotificationService,
	workspaceDomainSvc WorkspaceDomainService,
	eventRecorder EventRecorderService,
	log logger.Logger,
	baseURL string,
) DomainLifecycleService {
	return &domainLifecycleService{
		cfg:                 cfg,
		workspaceRepo:       workspaceRepo,
		notificationService: notificationService,
		workspaceDomainSvc:  workspaceDomainSvc,
		eventRecorder:       eventRecorder,
		log:                 log,
		baseURL:             baseURL,
		txtPrefix:           defaultTxtPrefix,
	}
}

func (s *domainLifecycleService) Run(ctx context.Context) {
	if !s.cfg.Enabled {
		if s.log != nil {
			s.log.Info("Domain lifecycle disabled")
		}
		return
	}
	interval := s.resolveInterval()
	if _, err := s.RunOnce(ctx); err != nil && s.log != nil {
		s.log.Warn("Domain lifecycle initial run failed", "error", err)
	}

	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if _, err := s.RunOnce(ctx); err != nil && s.log != nil {
				s.log.Warn("Domain lifecycle run failed", "error", err)
			}
		}
	}
}

func (s *domainLifecycleService) RunOnce(ctx context.Context) (*DomainLifecycleReport, error) {
	report := &DomainLifecycleReport{}
	if !s.cfg.Enabled {
		return report, nil
	}

	now := time.Now()
	var firstErr error

	domainNotified, err := s.handleDomainExpiryReminders(ctx, now)
	report.DomainExpiryNotified = domainNotified
	if err != nil && firstErr == nil {
		firstErr = err
	}

	sslNotified, err := s.handleSSLExpiryReminders(ctx, now)
	report.SSLExpiryNotified = sslNotified
	if err != nil && firstErr == nil {
		firstErr = err
	}

	sslExpired, err := s.handleSSLExpired(ctx, now)
	report.SSLExpired = sslExpired
	if err != nil && firstErr == nil {
		firstErr = err
	}

	renewed, failed, err := s.handleSSLAutoRenew(ctx, now)
	report.SSLAutoRenewed = renewed
	report.SSLAutoRenewFailed = failed
	if err != nil && firstErr == nil {
		firstErr = err
	}

	return report, firstErr
}

func (s *domainLifecycleService) handleDomainExpiryReminders(ctx context.Context, now time.Time) (int, error) {
	if s.workspaceRepo == nil || s.notificationService == nil {
		return 0, nil
	}
	warnBefore := now.AddDate(0, 0, s.resolveDomainExpiryWarningDays())
	domains, err := s.workspaceRepo.ListExpiryReminders(ctx, warnBefore, s.resolveBatchLimit())
	if err != nil {
		return 0, err
	}

	notified := 0
	for i := range domains {
		domain := domains[i]
		if domain.Status == DomainStatusBlocked {
			continue
		}
		if domain.DomainExpiresAt == nil {
			continue
		}
		workspace, err := s.workspaceRepo.GetByID(ctx, domain.WorkspaceID)
		if err != nil || workspace == nil {
			continue
		}

		title, content := buildDomainExpiryMessage(domain.Domain, *domain.DomainExpiresAt, now)
		if err := s.notificationService.SendSystemNotification(ctx, workspace.OwnerUserID, title, content); err != nil {
			if s.log != nil {
				s.log.Warn("Domain expiry notification failed", "domain", domain.Domain, "error", err)
			}
			continue
		}

		domain.DomainExpiryNotifiedAt = &now
		if err := s.workspaceRepo.UpdateDomain(ctx, &domain); err != nil && s.log != nil {
			s.log.Warn("Domain expiry notify update failed", "domain", domain.Domain, "error", err)
		}
		notified++
	}

	return notified, nil
}

func (s *domainLifecycleService) handleSSLExpiryReminders(ctx context.Context, now time.Time) (int, error) {
	if s.workspaceRepo == nil || s.notificationService == nil {
		return 0, nil
	}
	warnBefore := now.AddDate(0, 0, s.resolveSSLExpiryWarningDays())
	domains, err := s.workspaceRepo.ListSSLExpiryReminders(ctx, warnBefore, s.resolveBatchLimit())
	if err != nil {
		return 0, err
	}

	notified := 0
	for i := range domains {
		domain := domains[i]
		if domain.Status == DomainStatusBlocked {
			continue
		}
		if domain.SSLExpiresAt == nil || domain.SSLExpiresAt.Before(now) {
			continue
		}
		workspace, err := s.workspaceRepo.GetByID(ctx, domain.WorkspaceID)
		if err != nil || workspace == nil {
			continue
		}

		title := fmt.Sprintf("证书即将到期：%s", domain.Domain)
		content := fmt.Sprintf("SSL 证书将于 %s 到期，请及时续期以保持访问。", domain.SSLExpiresAt.Format("2006-01-02"))
		if err := s.notificationService.SendSystemNotification(ctx, workspace.OwnerUserID, title, content); err != nil {
			if s.log != nil {
				s.log.Warn("SSL expiry notification failed", "domain", domain.Domain, "error", err)
			}
			continue
		}

		if s.eventRecorder != nil {
			_ = s.eventRecorder.RecordDomainEvent(ctx, entity.EventCertExpiringSoon, domain.WorkspaceID, domain.Domain, 0, nil)
		}

		domain.SSLExpiryNotifiedAt = &now
		if err := s.workspaceRepo.UpdateDomain(ctx, &domain); err != nil && s.log != nil {
			s.log.Warn("SSL expiry notify update failed", "domain", domain.Domain, "error", err)
		}
		notified++
	}

	return notified, nil
}

func (s *domainLifecycleService) handleSSLExpired(ctx context.Context, now time.Time) (int, error) {
	if s.workspaceRepo == nil {
		return 0, nil
	}
	domains, err := s.workspaceRepo.ListSSLExpired(ctx, now, s.resolveBatchLimit())
	if err != nil {
		return 0, err
	}

	updated := 0
	for i := range domains {
		domain := domains[i]
		if domain.Status == DomainStatusBlocked {
			continue
		}
		if domain.SSLExpiresAt == nil {
			continue
		}
		workspace, err := s.workspaceRepo.GetByID(ctx, domain.WorkspaceID)
		if err != nil || workspace == nil {
			continue
		}

		domain.SSLStatus = SSLStatusExpired
		domain.SSLExpiryNotifiedAt = &now
		if err := s.workspaceRepo.UpdateDomain(ctx, &domain); err != nil {
			if s.log != nil {
				s.log.Warn("SSL expired update failed", "domain", domain.Domain, "error", err)
			}
			continue
		}

		if s.notificationService != nil {
			title := fmt.Sprintf("证书已过期：%s", domain.Domain)
			content := fmt.Sprintf("SSL 证书已于 %s 过期，请尽快续期恢复访问。", domain.SSLExpiresAt.Format("2006-01-02"))
			if err := s.notificationService.SendSystemNotification(ctx, workspace.OwnerUserID, title, content); err != nil && s.log != nil {
				s.log.Warn("SSL expired notification failed", "domain", domain.Domain, "error", err)
			}
		}
		updated++
	}

	return updated, nil
}

func (s *domainLifecycleService) handleSSLAutoRenew(ctx context.Context, now time.Time) (int, int, error) {
	if s.workspaceRepo == nil || s.workspaceDomainSvc == nil {
		return 0, 0, nil
	}
	renewBefore := now.AddDate(0, 0, s.resolveSSLAutoRenewDays())
	domains, err := s.workspaceRepo.ListSSLAutoRenewCandidates(ctx, now, renewBefore, s.resolveBatchLimit())
	if err != nil {
		return 0, 0, err
	}

	renewed := 0
	failed := 0
	for i := range domains {
		domain := domains[i]
		if domain.Status == DomainStatusBlocked {
			continue
		}
		if err := s.validateDomainDNS(domain); err != nil {
			_ = s.markSSLValidationFailed(ctx, &domain, err)
			failed++
			continue
		}

		workspace, err := s.workspaceRepo.GetByID(ctx, domain.WorkspaceID)
		if err != nil || workspace == nil {
			continue
		}

		if _, err := s.workspaceDomainSvc.RenewCertificate(ctx, workspace.OwnerUserID, domain.WorkspaceID, domain.ID); err != nil {
			if errors.Is(err, ErrWorkspaceDomainSSLNotDue) || errors.Is(err, ErrWorkspaceDomainSSLRetryLater) {
				continue
			}
			failed++
			s.notifyAutoRenewFailed(ctx, workspace.OwnerUserID, domain.Domain, err)
			continue
		}
		renewed++
	}

	return renewed, failed, nil
}

func (s *domainLifecycleService) markSSLValidationFailed(ctx context.Context, domain *entity.WorkspaceDomain, err error) error {
	if domain == nil || s.workspaceRepo == nil {
		return nil
	}
	errMessage := strings.TrimSpace(err.Error())
	if errMessage != "" {
		domain.LastSSLError = &errMessage
	} else {
		domain.LastSSLError = nil
	}
	attempts := domain.SSLIssueAttempts + 1
	domain.SSLIssueAttempts = attempts
	nextRetry := s.nextSSLRetryAt(attempts, time.Now())
	domain.SSLNextRetryAt = &nextRetry
	return s.workspaceRepo.UpdateDomain(ctx, domain)
}

func (s *domainLifecycleService) notifyAutoRenewFailed(ctx context.Context, userID uuid.UUID, domain string, err error) {
	if s.notificationService == nil {
		return
	}
	title := fmt.Sprintf("证书自动续期失败：%s", domain)
	message := fmt.Sprintf("自动续期验证失败，请检查域名解析后重试。错误：%s", strings.TrimSpace(err.Error()))
	_ = s.notificationService.SendSystemNotification(ctx, userID, title, message)
}

func (s *domainLifecycleService) validateDomainDNS(domain entity.WorkspaceDomain) error {
	if strings.TrimSpace(domain.Domain) == "" {
		return ErrWorkspaceDomainInvalid
	}
	token := safeToken(domain.VerificationToken)
	txtName := fmt.Sprintf("%s.%s", s.txtPrefix, domain.Domain)
	if token != "" {
		if records, err := net.LookupTXT(txtName); err == nil {
			for _, record := range records {
				if strings.Contains(record, token) {
					return nil
				}
			}
		}
	}

	cnameTarget := s.cnameTarget()
	if cnameTarget != "" {
		if cname, err := net.LookupCNAME(domain.Domain); err == nil {
			if normalizeHost(cname) == normalizeHost(cnameTarget) {
				return nil
			}
		}
	}

	return ErrWorkspaceDomainVerificationFailed
}

func (s *domainLifecycleService) cnameTarget() string {
	trimmed := strings.TrimSpace(s.baseURL)
	if trimmed == "" {
		return ""
	}
	if !strings.Contains(trimmed, "://") {
		trimmed = "http://" + trimmed
	}
	parsed, err := url.Parse(trimmed)
	if err != nil {
		return normalizeHost(s.baseURL)
	}
	host := parsed.Hostname()
	if host == "" {
		return normalizeHost(s.baseURL)
	}
	return normalizeHost(host)
}

func (s *domainLifecycleService) resolveInterval() time.Duration {
	if s.cfg.Interval > 0 {
		return s.cfg.Interval
	}
	return defaultDomainLifecycleInterval
}

func (s *domainLifecycleService) resolveDomainExpiryWarningDays() int {
	if s.cfg.DomainExpiryWarningDays > 0 {
		return s.cfg.DomainExpiryWarningDays
	}
	return defaultDomainExpiryWarningDays
}

func (s *domainLifecycleService) resolveSSLExpiryWarningDays() int {
	if s.cfg.SSLExpiryWarningDays > 0 {
		return s.cfg.SSLExpiryWarningDays
	}
	return defaultSSLExpiryWarningDays
}

func (s *domainLifecycleService) resolveSSLAutoRenewDays() int {
	if s.cfg.SSLAutoRenewDays > 0 {
		return s.cfg.SSLAutoRenewDays
	}
	return defaultSSLAutoRenewDays
}

func (s *domainLifecycleService) resolveBatchLimit() int {
	if s.cfg.MaxDomainsPerTick > 0 {
		return s.cfg.MaxDomainsPerTick
	}
	return defaultDomainLifecycleBatchLimit
}

func (s *domainLifecycleService) nextSSLRetryAt(attempts int, now time.Time) time.Time {
	if attempts <= 0 {
		return now.Add(sslIssueRetryBase)
	}
	backoff := sslIssueRetryBase * time.Duration(1<<uint(attempts-1))
	if backoff > sslIssueRetryMax {
		backoff = sslIssueRetryMax
	}
	return now.Add(backoff)
}

func buildDomainExpiryMessage(domain string, expiresAt time.Time, now time.Time) (string, string) {
	if expiresAt.Before(now) {
		title := fmt.Sprintf("域名已到期：%s", domain)
		content := fmt.Sprintf("域名已于 %s 到期，请尽快续费恢复访问。", expiresAt.Format("2006-01-02"))
		return title, content
	}
	title := fmt.Sprintf("域名即将到期：%s", domain)
	content := fmt.Sprintf("域名将于 %s 到期，请及时续费以保持访问。", expiresAt.Format("2006-01-02"))
	return title, content
}
