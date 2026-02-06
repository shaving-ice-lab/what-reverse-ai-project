package service

import (
	"context"
	"errors"
	"fmt"
	"net"
	"net/url"
	"strings"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// WorkspaceDomainVerifyResult 域名验证结果
type WorkspaceDomainVerifyResult struct {
	Domain       *entity.WorkspaceDomain `json:"domain"`
	Verification *DomainVerificationInfo `json:"verification,omitempty"`
	Verified     bool                    `json:"verified"`
}

// WorkspaceDomainService 工作空间域名服务
type WorkspaceDomainService interface {
	VerifyDomainByID(ctx context.Context, userID, domainID uuid.UUID) (*WorkspaceDomainVerifyResult, error)
	RenewCertificate(ctx context.Context, ownerID, workspaceID, domainID uuid.UUID) (*entity.WorkspaceDomain, error)
}

type workspaceDomainService struct {
	workspaceRepo     repository.WorkspaceRepository
	eventRecorder     EventRecorderService
	baseURL           string
	regionBaseURLs    map[string]string
	routingExecutor   DomainRoutingExecutor
	certificateIssuer CertificateIssuerExecutor
	txtPrefix         string
}

// NewWorkspaceDomainService 创建工作空间域名服务
func NewWorkspaceDomainService(
	workspaceRepo repository.WorkspaceRepository,
	eventRecorder EventRecorderService,
	baseURL string,
	regionBaseURLs map[string]string,
	routingExecutor DomainRoutingExecutor,
	certificateIssuer CertificateIssuerExecutor,
) WorkspaceDomainService {
	return &workspaceDomainService{
		workspaceRepo:     workspaceRepo,
		eventRecorder:     eventRecorder,
		baseURL:           baseURL,
		regionBaseURLs:    regionBaseURLs,
		routingExecutor:   routingExecutor,
		certificateIssuer: certificateIssuer,
		txtPrefix:         defaultTxtPrefix,
	}
}

func (s *workspaceDomainService) VerifyDomainByID(ctx context.Context, userID, domainID uuid.UUID) (*WorkspaceDomainVerifyResult, error) {
	if s.workspaceRepo == nil {
		return nil, errors.New("workspace repository unavailable")
	}
	domain, err := s.workspaceRepo.GetDomainByID(ctx, domainID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrWorkspaceDomainNotFound
		}
		return nil, err
	}
	workspace, err := s.workspaceRepo.GetByID(ctx, domain.WorkspaceID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrWorkspaceNotFound
		}
		return nil, err
	}
	if workspace.OwnerUserID != userID {
		return nil, ErrWorkspaceUnauthorized
	}

	if s.eventRecorder != nil {
		_ = s.eventRecorder.RecordDomainEvent(ctx, entity.EventDomainVerifyStarted, domain.WorkspaceID, domain.Domain, 0, nil)
	}

	verification := s.buildVerificationInfo(domain)
	if err := s.verifyDomainDNS(domain, verification); err != nil {
		_ = s.markVerificationFailed(ctx, domain, err)
		if s.eventRecorder != nil {
			_ = s.eventRecorder.RecordDomainEvent(ctx, entity.EventDomainVerifyFailed, domain.WorkspaceID, domain.Domain, 0, err)
		}
		return &WorkspaceDomainVerifyResult{Domain: domain, Verification: &verification, Verified: false}, &DomainVerifyError{
			NextRetryAt: domain.NextRetryAt,
			Cause:       err,
		}
	}

	now := time.Now()
	domain.VerifiedAt = &now
	if domain.Status != DomainStatusActive {
		domain.Status = DomainStatusVerified
	}
	domain.LastVerificationError = nil
	domain.VerificationAttempts = 0
	domain.NextRetryAt = nil
	if err := s.workspaceRepo.UpdateDomain(ctx, domain); err != nil {
		return nil, err
	}

	if s.eventRecorder != nil {
		_ = s.eventRecorder.RecordDomainEvent(ctx, entity.EventDomainVerified, domain.WorkspaceID, domain.Domain, 0, nil)
	}

	return &WorkspaceDomainVerifyResult{Domain: domain, Verification: &verification, Verified: true}, nil
}

func (s *workspaceDomainService) RenewCertificate(ctx context.Context, ownerID, workspaceID, domainID uuid.UUID) (*entity.WorkspaceDomain, error) {
	if s.workspaceRepo == nil {
		return nil, errors.New("workspace repository unavailable")
	}
	domain, err := s.workspaceRepo.GetDomainByID(ctx, domainID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrWorkspaceDomainNotFound
		}
		return nil, err
	}
	if domain.WorkspaceID != workspaceID {
		return nil, ErrWorkspaceUnauthorized
	}

	now := time.Now()
	if domain.SSLExpiresAt != nil && domain.SSLExpiresAt.After(now.AddDate(0, 0, 10)) {
		return nil, ErrWorkspaceDomainSSLNotDue
	}

	workspace, err := s.workspaceRepo.GetByID(ctx, workspaceID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrWorkspaceNotFound
		}
		return nil, err
	}
	if workspace.OwnerUserID != ownerID {
		return nil, ErrWorkspaceUnauthorized
	}

	if s.eventRecorder != nil {
		_ = s.eventRecorder.RecordDomainEvent(ctx, entity.EventCertIssueStarted, domain.WorkspaceID, domain.Domain, 0, nil)
	}

	if s.certificateIssuer == nil {
		return nil, errors.New("certificate issuer unavailable")
	}

	verification := s.buildVerificationInfo(domain)
	result, err := s.certificateIssuer.Issue(ctx, CertificateIssueRequest{
		Action:        CertificateActionRenew,
		Domain:        domain.Domain,
		WorkspaceID:   domain.WorkspaceID.String(),
		WorkspaceSlug: workspace.Slug,
		Verification:  verification,
		RequestedAt:   now,
	})
	if err != nil {
		errMessage := strings.TrimSpace(err.Error())
		if errMessage != "" {
			domain.LastSSLError = &errMessage
		}
		domain.SSLStatus = SSLStatusFailed
		_ = s.workspaceRepo.UpdateDomain(ctx, domain)
		if s.eventRecorder != nil {
			_ = s.eventRecorder.RecordDomainEvent(ctx, entity.EventCertIssueFailed, domain.WorkspaceID, domain.Domain, 0, err)
		}
		return nil, err
	}

	domain.SSLStatus = SSLStatusIssued
	domain.LastSSLError = nil
	domain.SSLIssueAttempts = 0
	domain.SSLNextRetryAt = nil
	domain.SSLIssuedAt = result.IssuedAt
	domain.SSLExpiresAt = result.ExpiresAt
	domain.SSLExpiryNotifiedAt = nil
	if err := s.workspaceRepo.UpdateDomain(ctx, domain); err != nil {
		return nil, err
	}

	if s.eventRecorder != nil {
		_ = s.eventRecorder.RecordDomainEvent(ctx, entity.EventCertRenewed, domain.WorkspaceID, domain.Domain, 0, nil)
	}

	return domain, nil
}

func (s *workspaceDomainService) verifyDomainDNS(domain *entity.WorkspaceDomain, verification DomainVerificationInfo) error {
	if domain == nil || strings.TrimSpace(domain.Domain) == "" {
		return ErrWorkspaceDomainInvalid
	}
	if verification.TxtName != "" && verification.TxtValue != "" {
		if records, err := net.LookupTXT(verification.TxtName); err == nil {
			for _, record := range records {
				if strings.Contains(record, verification.TxtValue) {
					return nil
				}
			}
		}
	}
	if verification.CnameTarget != "" {
		if cname, err := net.LookupCNAME(domain.Domain); err == nil {
			if normalizeHost(cname) == normalizeHost(verification.CnameTarget) {
				return nil
			}
		}
	}
	return ErrWorkspaceDomainVerificationFailed
}

func (s *workspaceDomainService) markVerificationFailed(ctx context.Context, domain *entity.WorkspaceDomain, err error) error {
	if domain == nil || s.workspaceRepo == nil {
		return nil
	}
	errMessage := strings.TrimSpace(err.Error())
	if errMessage != "" {
		domain.LastVerificationError = &errMessage
	} else {
		domain.LastVerificationError = nil
	}
	domain.VerificationAttempts++
	nextRetry := s.nextVerificationRetryAt(domain.VerificationAttempts, time.Now())
	domain.NextRetryAt = &nextRetry
	if domain.Status != DomainStatusBlocked {
		domain.Status = DomainStatusFailed
	}
	return s.workspaceRepo.UpdateDomain(ctx, domain)
}

func (s *workspaceDomainService) nextVerificationRetryAt(attempts int, now time.Time) time.Time {
	if attempts <= 0 {
		return now.Add(2 * time.Minute)
	}
	backoff := time.Duration(attempts*attempts) * time.Minute
	if backoff > 12*time.Hour {
		backoff = 12 * time.Hour
	}
	return now.Add(backoff)
}

func (s *workspaceDomainService) buildVerificationInfo(domain *entity.WorkspaceDomain) DomainVerificationInfo {
	txtValue := safeToken(domain.VerificationToken)
	txtName := ""
	if domain != nil && strings.TrimSpace(domain.Domain) != "" {
		txtName = fmt.Sprintf("%s.%s", s.txtPrefix, domain.Domain)
	}
	return DomainVerificationInfo{
		TxtName:     txtName,
		TxtValue:    txtValue,
		CnameTarget: s.cnameTarget(),
	}
}

func (s *workspaceDomainService) cnameTarget() string {
	if len(s.regionBaseURLs) > 0 {
		for _, baseURL := range s.regionBaseURLs {
			if target := normalizeHost(baseURL); target != "" {
				return target
			}
		}
	}
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

var (
	ErrWorkspaceDomainNotFound = errors.New("workspace domain not found")
)
