package service

import (
	"errors"
	"time"
)

const (
	defaultTxtPrefix = "_agentflow"

	DomainStatusPending   = "pending"
	DomainStatusVerifying = "verifying"
	DomainStatusVerified  = "verified"
	DomainStatusActive    = "active"
	DomainStatusFailed    = "failed"
	DomainStatusBlocked   = "blocked"

	SSLStatusPending = "pending"
	SSLStatusIssuing = "issuing"
	SSLStatusIssued  = "issued"
	SSLStatusFailed  = "failed"
	SSLStatusExpired = "expired"
)

var (
	ErrWorkspaceDomainInvalid            = errors.New("workspace domain invalid")
	ErrWorkspaceDomainVerificationFailed = errors.New("workspace domain verification failed")
	ErrWorkspaceDomainSSLNotDue          = errors.New("workspace domain ssl not due")
	ErrWorkspaceDomainSSLRetryLater      = errors.New("workspace domain ssl retry later")
)

// DomainVerifyError 域名验证错误（支持重试）
type DomainVerifyError struct {
	NextRetryAt *time.Time
	Cause       error
}

func (e *DomainVerifyError) Error() string {
	if e == nil {
		return ""
	}
	if e.Cause != nil {
		return e.Cause.Error()
	}
	return "domain verify failed"
}

func (e *DomainVerifyError) Unwrap() error {
	if e == nil {
		return nil
	}
	return e.Cause
}

// DomainVerificationInfo 域名验证信息
type DomainVerificationInfo struct {
	TxtName     string `json:"txt_name"`
	TxtValue    string `json:"txt_value"`
	CnameTarget string `json:"cname_target"`
}
