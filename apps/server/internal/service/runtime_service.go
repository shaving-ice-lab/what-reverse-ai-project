package service

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"net"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/reverseai/server/internal/domain/entity"
	"github.com/reverseai/server/internal/repository"
	"gorm.io/gorm"
)

// RuntimeService Workspace Runtime 服务接口
// 现在 Workspace 就是 App，直接基于 Workspace 提供 Runtime 功能
type RuntimeService interface {
	GetEntry(ctx context.Context, workspaceSlug string, userID *uuid.UUID) (*RuntimeEntry, error)
	GetSchema(ctx context.Context, workspaceSlug string, userID *uuid.UUID) (*RuntimeSchema, error)
	GetEntryByDomain(ctx context.Context, domain string, userID *uuid.UUID) (*RuntimeEntry, error)
	GetSchemaByDomain(ctx context.Context, domain string, userID *uuid.UUID) (*RuntimeSchema, error)
	TrackAnonymousAccess(ctx context.Context, entry *RuntimeEntry, meta RuntimeAccessMeta) (*RuntimeAccessResult, error)
	RecordRuntimeEvent(ctx context.Context, entry *RuntimeEntry, session *entity.WorkspaceSession, eventType string, payload entity.JSON) error
}

// RuntimeEntry Runtime 入口信息
// Workspace 现在包含了所有 App 和 AccessPolicy 的字段
type RuntimeEntry struct {
	Workspace *entity.Workspace `json:"workspace"`
}

// RuntimeSchema Runtime Schema 输出
type RuntimeSchema struct {
	RuntimeEntry
	Version *entity.WorkspaceVersion `json:"version"`
}

// RuntimeAccessMeta Runtime 访问元信息
type RuntimeAccessMeta struct {
	SessionID       *uuid.UUID
	IP              string
	UserAgent       string
	EventType       string
	Path            string
	CaptchaProvided bool
	SkipSession     bool
}

// RuntimeAccessDecision Runtime 风控决策
type RuntimeAccessDecision struct {
	RequireCaptcha bool     `json:"require_captcha"`
	RiskSignals    []string `json:"risk_signals,omitempty"`
}

// RuntimeAccessResult Runtime 访问结果
type RuntimeAccessResult struct {
	Session  *entity.WorkspaceSession `json:"session"`
	Decision RuntimeAccessDecision    `json:"decision"`
}

type runtimeService struct {
	workspaceRepo       repository.WorkspaceRepository
	slugAliasRepo       repository.WorkspaceSlugAliasRepository
	workspaceMemberRepo repository.WorkspaceMemberRepository
	eventRecorder       EventRecorderService
	pii                 *piiSanitizer
	cache               *runtimeCache
	cacheGroup          *cacheGroup
}

// NewRuntimeService 创建 Runtime 服务实例
func NewRuntimeService(
	workspaceRepo repository.WorkspaceRepository,
	slugAliasRepo repository.WorkspaceSlugAliasRepository,
	workspaceMemberRepo repository.WorkspaceMemberRepository,
	eventRecorder EventRecorderService,
	piiEnabled bool,
	cacheSettings RuntimeCacheSettings,
) RuntimeService {
	runtimeCache := newRuntimeCache(cacheSettings)
	var cacheGroup *cacheGroup
	if runtimeCache != nil {
		cacheGroup = newCacheGroup()
	}
	return &runtimeService{
		workspaceRepo:       workspaceRepo,
		slugAliasRepo:       slugAliasRepo,
		workspaceMemberRepo: workspaceMemberRepo,
		eventRecorder:       eventRecorder,
		pii:                 newPIISanitizer(piiEnabled),
		cache:               runtimeCache,
		cacheGroup:          cacheGroup,
	}
}

func (s *runtimeService) GetEntry(ctx context.Context, workspaceSlug string, userID *uuid.UUID) (*RuntimeEntry, error) {
	normalizedWorkspace := strings.TrimSpace(workspaceSlug)
	if normalizedWorkspace == "" {
		return nil, ErrRuntimeInvalidSlug
	}

	workspace, err := s.getWorkspaceBySlug(ctx, normalizedWorkspace)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrRuntimeWorkspaceNotFound
		}
		return nil, err
	}

	if !isRuntimeAccessibleWorkspaceStatus(workspace.AppStatus) {
		return nil, ErrRuntimeNotPublished
	}

	if err := s.authorizeAccess(ctx, workspace, userID); err != nil {
		return nil, err
	}

	return &RuntimeEntry{
		Workspace: workspace,
	}, nil
}

func (s *runtimeService) getWorkspaceBySlug(ctx context.Context, slug string) (*entity.Workspace, error) {
	normalized := strings.TrimSpace(slug)
	if normalized == "" {
		return nil, gorm.ErrRecordNotFound
	}
	if s.cache != nil {
		if cached, ok := s.cache.workspaceBySlug.Get(normalized); ok && cached != nil {
			return cached, nil
		}
		if cacheMissHit(s.cache.workspaceBySlugMiss, normalized) {
			return nil, gorm.ErrRecordNotFound
		}
	}
	loader := func() (*entity.Workspace, error) {
		workspace, err := s.workspaceRepo.GetBySlug(ctx, normalized)
		if err == nil {
			s.cacheWorkspace(workspace, normalized)
			return workspace, nil
		}
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, err
		}
		if s.slugAliasRepo == nil {
			if s.cache != nil {
				cacheMissSet(s.cache.workspaceBySlugMiss, normalized)
			}
			return nil, err
		}
		alias, aliasErr := s.slugAliasRepo.GetBySlug(ctx, normalized)
		if aliasErr != nil {
			if errors.Is(aliasErr, gorm.ErrRecordNotFound) {
				if s.cache != nil {
					cacheMissSet(s.cache.workspaceBySlugMiss, normalized)
				}
				return nil, err
			}
			return nil, aliasErr
		}
		workspace, aliasErr = s.getWorkspaceByID(ctx, alias.WorkspaceID)
		if aliasErr != nil {
			return nil, aliasErr
		}
		s.cacheWorkspace(workspace, normalized)
		return workspace, nil
	}
	if s.cacheGroup != nil {
		value, err := s.cacheGroup.Do("workspace_slug:"+normalized, func() (interface{}, error) {
			return loader()
		})
		if err != nil {
			return nil, err
		}
		workspace, ok := value.(*entity.Workspace)
		if !ok || workspace == nil {
			return nil, gorm.ErrRecordNotFound
		}
		return workspace, nil
	}
	return loader()
}

func (s *runtimeService) getWorkspaceByID(ctx context.Context, workspaceID uuid.UUID) (*entity.Workspace, error) {
	cacheKey := workspaceID.String()
	if s.cache != nil {
		if cached, ok := s.cache.workspaceByID.Get(cacheKey); ok && cached != nil {
			return cached, nil
		}
		if cacheMissHit(s.cache.workspaceByIDMiss, cacheKey) {
			return nil, gorm.ErrRecordNotFound
		}
	}
	loader := func() (*entity.Workspace, error) {
		workspace, err := s.workspaceRepo.GetByID(ctx, workspaceID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) && s.cache != nil {
				cacheMissSet(s.cache.workspaceByIDMiss, cacheKey)
			}
			return nil, err
		}
		s.cacheWorkspace(workspace, strings.TrimSpace(workspace.Slug))
		return workspace, nil
	}
	if s.cacheGroup != nil {
		value, err := s.cacheGroup.Do("workspace_id:"+cacheKey, func() (interface{}, error) {
			return loader()
		})
		if err != nil {
			return nil, err
		}
		workspace, ok := value.(*entity.Workspace)
		if !ok || workspace == nil {
			return nil, gorm.ErrRecordNotFound
		}
		return workspace, nil
	}
	return loader()
}

func (s *runtimeService) getWorkspaceVersionByID(ctx context.Context, versionID uuid.UUID) (*entity.WorkspaceVersion, error) {
	cacheKey := versionID.String()
	if s.cache != nil {
		if cached, ok := s.cache.versionByID.Get(cacheKey); ok && cached != nil {
			return cloneWorkspaceVersion(cached), nil
		}
		if cacheMissHit(s.cache.versionByIDMiss, cacheKey) {
			return nil, gorm.ErrRecordNotFound
		}
	}
	loader := func() (*entity.WorkspaceVersion, error) {
		version, err := s.workspaceRepo.GetVersionByID(ctx, versionID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) && s.cache != nil {
				cacheMissSet(s.cache.versionByIDMiss, cacheKey)
			}
			return nil, err
		}
		if s.cache != nil {
			s.cache.versionByID.Set(cacheKey, version)
		}
		if s.cache != nil {
			cacheMissClear(s.cache.versionByIDMiss, cacheKey)
		}
		return cloneWorkspaceVersion(version), nil
	}
	if s.cacheGroup != nil {
		value, err := s.cacheGroup.Do("version:"+cacheKey, func() (interface{}, error) {
			return loader()
		})
		if err != nil {
			return nil, err
		}
		version, ok := value.(*entity.WorkspaceVersion)
		if !ok || version == nil {
			return nil, gorm.ErrRecordNotFound
		}
		return cloneWorkspaceVersion(version), nil
	}
	return loader()
}

func (s *runtimeService) getDomainByHost(ctx context.Context, domain string) (*entity.WorkspaceDomain, error) {
	normalized := strings.TrimSpace(domain)
	if normalized == "" {
		return nil, gorm.ErrRecordNotFound
	}
	// 直接从 workspace repo 获取域名
	record, err := s.workspaceRepo.GetDomainByDomain(ctx, normalized)
	if err != nil {
		return nil, err
	}
	return record, nil
}

func (s *runtimeService) cacheWorkspace(workspace *entity.Workspace, slugs ...string) {
	if s.cache == nil || workspace == nil {
		return
	}
	workspaceID := workspace.ID.String()
	s.cache.workspaceByID.Set(workspaceID, workspace)
	cacheMissClear(s.cache.workspaceByIDMiss, workspaceID)
	for _, slug := range slugs {
		trimmed := strings.TrimSpace(slug)
		if trimmed == "" {
			continue
		}
		s.cache.workspaceBySlug.Set(trimmed, workspace)
		cacheMissClear(s.cache.workspaceBySlugMiss, trimmed)
	}
	if workspaceSlug := strings.TrimSpace(workspace.Slug); workspaceSlug != "" {
		s.cache.workspaceBySlug.Set(workspaceSlug, workspace)
		cacheMissClear(s.cache.workspaceBySlugMiss, workspaceSlug)
	}
}

func cloneWorkspaceVersion(version *entity.WorkspaceVersion) *entity.WorkspaceVersion {
	if version == nil {
		return nil
	}
	cloned := *version
	return &cloned
}

func (s *runtimeService) GetSchema(ctx context.Context, workspaceSlug string, userID *uuid.UUID) (*RuntimeSchema, error) {
	entry, err := s.GetEntry(ctx, workspaceSlug, userID)
	if err != nil {
		return nil, err
	}

	if entry.Workspace.CurrentVersionID == nil {
		return nil, ErrRuntimeVersionRequired
	}

	version, err := s.getWorkspaceVersionByID(ctx, *entry.Workspace.CurrentVersionID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrRuntimeVersionNotFound
		}
		return nil, err
	}
	if version.WorkspaceID != entry.Workspace.ID {
		return nil, ErrRuntimeVersionNotFound
	}

	return &RuntimeSchema{
		RuntimeEntry: *entry,
		Version:      version,
	}, nil
}

func (s *runtimeService) GetEntryByDomain(ctx context.Context, domain string, userID *uuid.UUID) (*RuntimeEntry, error) {
	normalizedDomain := normalizeRuntimeDomain(domain)
	if normalizedDomain == "" {
		return nil, ErrRuntimeInvalidDomain
	}

	domainRecord, err := s.getDomainByHost(ctx, normalizedDomain)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrRuntimeDomainNotFound
		}
		return nil, err
	}
	if strings.ToLower(strings.TrimSpace(domainRecord.Status)) == "blocked" {
		return nil, ErrRuntimeDomainBlocked
	}
	if strings.ToLower(strings.TrimSpace(domainRecord.Status)) != "active" {
		return nil, ErrRuntimeDomainNotActive
	}

	workspace, err := s.getWorkspaceByID(ctx, domainRecord.WorkspaceID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrRuntimeWorkspaceNotFound
		}
		return nil, err
	}
	if !isRuntimeAccessibleWorkspaceStatus(workspace.AppStatus) {
		return nil, ErrRuntimeNotPublished
	}

	if err := s.authorizeAccess(ctx, workspace, userID); err != nil {
		return nil, err
	}

	return &RuntimeEntry{
		Workspace: workspace,
	}, nil
}

func (s *runtimeService) GetSchemaByDomain(ctx context.Context, domain string, userID *uuid.UUID) (*RuntimeSchema, error) {
	entry, err := s.GetEntryByDomain(ctx, domain, userID)
	if err != nil {
		return nil, err
	}

	if entry.Workspace.CurrentVersionID == nil {
		return nil, ErrRuntimeVersionRequired
	}

	version, err := s.getWorkspaceVersionByID(ctx, *entry.Workspace.CurrentVersionID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrRuntimeVersionNotFound
		}
		return nil, err
	}
	if version.WorkspaceID != entry.Workspace.ID {
		return nil, ErrRuntimeVersionNotFound
	}

	return &RuntimeSchema{
		RuntimeEntry: *entry,
		Version:      version,
	}, nil
}

func (s *runtimeService) TrackAnonymousAccess(ctx context.Context, entry *RuntimeEntry, meta RuntimeAccessMeta) (*RuntimeAccessResult, error) {
	if entry == nil || entry.Workspace == nil {
		return nil, ErrRuntimeWorkspaceNotFound
	}

	if strings.ToLower(strings.TrimSpace(entry.Workspace.AccessMode)) != "public_anonymous" {
		return &RuntimeAccessResult{}, nil
	}

	now := time.Now()
	ipHash := hashValue(meta.IP)
	userAgentHash := hashValue(meta.UserAgent)

	skipSession := meta.SkipSession && meta.SessionID == nil
	var session *entity.WorkspaceSession
	if !skipSession {
		if meta.SessionID != nil {
			existing, err := s.workspaceRepo.GetSessionByID(ctx, *meta.SessionID)
			if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, err
			}
			if err == nil && existing.WorkspaceID == entry.Workspace.ID {
				if existing.BlockedAt != nil {
					return nil, ErrRuntimeSessionBlocked
				}
			}
		}
		var err error
		session, err = s.ensureAnonymousSession(ctx, entry, meta, ipHash, userAgentHash)
		if err != nil {
			return nil, err
		}
	}

	eventType := strings.TrimSpace(meta.EventType)
	if eventType == "" {
		eventType = RuntimeEventEntry
	}

	config := resolveRateLimitConfigFromWorkspace(entry.Workspace)
	decision := RuntimeAccessDecision{
		RequireCaptcha: entry.Workspace.RequireCaptcha,
	}

	if isListed(meta.IP, ipHash, config.blacklist) {
		if session != nil && session.BlockedAt == nil {
			blockedAt := now
			session.BlockedAt = &blockedAt
			session.BlockedReason = stringPtrOrNil("blacklist")
			_ = s.workspaceRepo.UpdateSession(ctx, session)
		}
		if err := s.recordRuntimeEvent(ctx, entry.Workspace.ID, session, RuntimeEventAccessBlocked, buildRiskPayload(meta, ipHash, userAgentHash, []string{"blacklist"}, entity.JSON{
			"reason": "blacklist",
		})); err != nil {
			return nil, err
		}
		return nil, ErrRuntimeIPBlocked
	}

	graylisted := isListed(meta.IP, ipHash, config.graylist)
	if graylisted {
		decision.RiskSignals = append(decision.RiskSignals, "graylist")
	}

	perIP := config.perIP
	perSession := config.perSession
	perWorkspace := config.perWorkspace
	if graylisted {
		perIP = applyGrayPolicy(perIP, config.grayPolicy)
		perSession = applyGrayPolicy(perSession, config.grayPolicy)
		perWorkspace = applyGrayPolicy(perWorkspace, config.grayPolicy)
		if config.grayPolicy.requireCaptcha {
			decision.RequireCaptcha = true
		}
	}

	if err := s.enforceRateLimit(ctx, entry, session, ipHash, perIP, perSession, perWorkspace, now); err != nil {
		return nil, err
	}

	riskSignals, err := s.detectAnomalies(ctx, entry, session, ipHash, config, now)
	if err != nil {
		return nil, err
	}
	if len(riskSignals) > 0 {
		decision.RiskSignals = append(decision.RiskSignals, riskSignals...)
		decision.RequireCaptcha = true
		if err := s.recordRuntimeEvent(ctx, entry.Workspace.ID, session, RuntimeEventRiskDetected, buildRiskPayload(meta, ipHash, userAgentHash, riskSignals, entity.JSON{
			"reason": "anomaly",
		})); err != nil {
			return nil, err
		}
		if shouldLoadShed(eventType, riskSignals) {
			if err := s.recordRuntimeEvent(ctx, entry.Workspace.ID, session, RuntimeEventLoadShed, buildRiskPayload(meta, ipHash, userAgentHash, riskSignals, entity.JSON{
				"reason": "load_shed",
			})); err != nil {
				return nil, err
			}
			return nil, ErrRuntimeOverloaded
		}
	}

	if decision.RequireCaptcha && !meta.CaptchaProvided {
		if err := s.recordRuntimeEvent(ctx, entry.Workspace.ID, session, RuntimeEventCaptchaRequired, buildRiskPayload(meta, ipHash, userAgentHash, decision.RiskSignals, entity.JSON{
			"reason": "captcha_required",
		})); err != nil {
			return nil, err
		}
	}

	payload := entity.JSON{}
	if meta.Path != "" {
		payload["path"] = meta.Path
	}
	if ipHash != "" {
		payload["ip_hash"] = ipHash
	}
	if userAgentHash != "" {
		payload["user_agent_hash"] = userAgentHash
	}
	if meta.CaptchaProvided {
		payload["captcha_provided"] = true
	}
	if len(decision.RiskSignals) > 0 {
		payload["risk_signals"] = decision.RiskSignals
	}
	if err := s.recordRuntimeEvent(ctx, entry.Workspace.ID, session, eventType, payload); err != nil {
		return nil, err
	}

	s.recordWorkspaceAccessed(ctx, entry, session, meta, ipHash, userAgentHash)
	return &RuntimeAccessResult{Session: session, Decision: decision}, nil
}

func (s *runtimeService) authorizeAccess(ctx context.Context, workspace *entity.Workspace, userID *uuid.UUID) error {
	if err := s.authorizeAccessMode(workspace, userID); err != nil {
		return err
	}
	return s.authorizeClassification(ctx, workspace, userID)
}

func (s *runtimeService) authorizeAccessMode(workspace *entity.Workspace, userID *uuid.UUID) error {
	mode := strings.ToLower(strings.TrimSpace(workspace.AccessMode))
	switch mode {
	case "public_anonymous":
		return nil
	case "public_auth":
		if userID == nil {
			return ErrRuntimeAuthRequired
		}
		return nil
	case "private":
		if userID == nil {
			return ErrRuntimeAuthRequired
		}
		if workspace.OwnerUserID != uuid.Nil && *userID != workspace.OwnerUserID {
			return ErrRuntimeAccessDenied
		}
		return nil
	default:
		return ErrRuntimeAccessDenied
	}
}

func (s *runtimeService) authorizeClassification(ctx context.Context, workspace *entity.Workspace, userID *uuid.UUID) error {
	requirement := resolveDataClassificationRequirement(workspace.DataClassification)
	if !requirement.requireAuth && !requirement.requireMember && !requirement.requireOwner {
		return nil
	}

	if requirement.requireAuth && userID == nil {
		return ErrRuntimeAuthRequired
	}

	if requirement.requireOwner {
		if userID == nil || workspace.OwnerUserID == uuid.Nil || *userID != workspace.OwnerUserID {
			return ErrRuntimeAccessDenied
		}
		return nil
	}

	if userID == nil {
		return ErrRuntimeAuthRequired
	}
	if workspace.OwnerUserID != uuid.Nil && *userID == workspace.OwnerUserID {
		return nil
	}

	member, err := s.workspaceMemberRepo.GetByWorkspaceAndUser(ctx, workspace.ID, *userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrRuntimeAccessDenied
		}
		return err
	}
	if requirement.requireAdmin {
		if member.Role == nil || !hasPermission(member.Role.Permissions, PermissionWorkspaceAdmin) {
			return ErrRuntimeAccessDenied
		}
	}

	return nil
}

func (s *runtimeService) ensureAnonymousSession(ctx context.Context, entry *RuntimeEntry, meta RuntimeAccessMeta, ipHash, userAgentHash string) (*entity.WorkspaceSession, error) {
	var session *entity.WorkspaceSession

	if meta.SessionID != nil {
		existing, err := s.workspaceRepo.GetSessionByID(ctx, *meta.SessionID)
		if err == nil && existing.WorkspaceID == entry.Workspace.ID {
			session = existing
		} else if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, err
		}
	}

	if session == nil {
		expiredAt := time.Now().Add(defaultAnonymousSessionTTL)
		session = &entity.WorkspaceSession{
			WorkspaceID:   entry.Workspace.ID,
			SessionType:   "anon",
			UserID:        nil,
			IPHash:        stringPtrOrNil(ipHash),
			UserAgentHash: stringPtrOrNil(userAgentHash),
			ExpiredAt:     &expiredAt,
		}
		if err := s.workspaceRepo.CreateSession(ctx, session); err != nil {
			return nil, err
		}
	} else {
		expiredAt := time.Now().Add(defaultAnonymousSessionTTL)
		session.ExpiredAt = &expiredAt
		if err := s.workspaceRepo.UpdateSession(ctx, session); err != nil {
			return nil, err
		}
	}

	return session, nil
}

func (s *runtimeService) RecordRuntimeEvent(ctx context.Context, entry *RuntimeEntry, session *entity.WorkspaceSession, eventType string, payload entity.JSON) error {
	if entry == nil || entry.Workspace == nil {
		return nil
	}
	return s.recordRuntimeEvent(ctx, entry.Workspace.ID, session, eventType, payload)
}

func (s *runtimeService) recordRuntimeEvent(ctx context.Context, workspaceID uuid.UUID, session *entity.WorkspaceSession, eventType string, payload entity.JSON) error {
	if session == nil {
		return nil
	}
	normalized := strings.TrimSpace(eventType)
	if normalized == "" {
		return nil
	}
	payloadForLog := payload
	if s.pii != nil {
		payloadForLog = s.pii.sanitizeJSON(payload)
	}
	return s.workspaceRepo.CreateEvent(ctx, &entity.WorkspaceEvent{
		WorkspaceID: workspaceID,
		SessionID:   session.ID,
		EventType:   normalized,
		Payload:     payloadForLog,
	})
}

func (s *runtimeService) recordWorkspaceAccessed(ctx context.Context, entry *RuntimeEntry, session *entity.WorkspaceSession, meta RuntimeAccessMeta, ipHash, userAgentHash string) {
	if s.eventRecorder == nil || entry == nil || entry.Workspace == nil {
		return
	}
	eventType := resolveWorkspaceAccessEventType(meta.EventType)
	metadata := entity.JSON{}
	if strings.TrimSpace(entry.Workspace.AccessMode) != "" {
		metadata["access_mode"] = entry.Workspace.AccessMode
	}
	if meta.EventType != "" {
		metadata["event_type"] = meta.EventType
	}
	if meta.Path != "" {
		metadata["path"] = meta.Path
	}
	if ipHash != "" {
		metadata["ip_hash"] = ipHash
	}
	if userAgentHash != "" {
		metadata["user_agent_hash"] = userAgentHash
	}
	if meta.CaptchaProvided {
		metadata["captcha_provided"] = true
	}
	var sessionID *uuid.UUID
	if session != nil {
		sessionID = &session.ID
		if session.SessionType != "" {
			metadata["session_type"] = session.SessionType
		}
	}
	_ = s.eventRecorder.RecordWorkspaceEvent(ctx, eventType, entry.Workspace.ID, sessionID, "workspace accessed", metadata)
}

type rateLimitRule struct {
	maxRequests int
	window      time.Duration
}

const rateLimitAlgorithmFixedWindow = "fixed_window"

func (r rateLimitRule) enabled() bool {
	return r.maxRequests > 0 && r.window > 0
}

type graylistPolicy struct {
	maxRequests    int
	window         time.Duration
	requireCaptcha bool
}

type failureRateRule struct {
	threshold   float64
	minRequests int
	window      time.Duration
}

type spikeRule struct {
	ratio       float64
	minPrevious int
	window      time.Duration
}

type runtimeAnomalyConfig struct {
	highFreq    rateLimitRule
	failureRate failureRateRule
	spike       spikeRule
}

type runtimeRateLimitConfig struct {
	algorithm    string
	perIP        rateLimitRule
	perSession   rateLimitRule
	perWorkspace rateLimitRule
	blacklist    []string
	graylist     []string
	grayPolicy   graylistPolicy
	anomaly      runtimeAnomalyConfig
}

func resolveRateLimitConfigFromWorkspace(workspace *entity.Workspace) runtimeRateLimitConfig {
	config := runtimeRateLimitConfig{
		algorithm: rateLimitAlgorithmFixedWindow,
		perIP: rateLimitRule{
			maxRequests: defaultAnonymousMaxRequests,
			window:      defaultAnonymousWindow,
		},
		perSession:   rateLimitRule{},
		perWorkspace: rateLimitRule{},
		grayPolicy: graylistPolicy{
			requireCaptcha: true,
		},
		anomaly: runtimeAnomalyConfig{
			failureRate: failureRateRule{
				threshold:   defaultAnomalyFailureRateThreshold,
				minRequests: defaultAnomalyFailureMinRequests,
				window:      defaultAnomalyFailureRateWindow,
			},
			spike: spikeRule{
				ratio:       defaultAnomalySpikeRatio,
				minPrevious: defaultAnomalySpikeMinPrevious,
				window:      defaultAnomalySpikeWindow,
			},
		},
	}

	if workspace == nil || workspace.RateLimitJSON == nil {
		config.anomaly.highFreq = defaultHighFreqRule(config.perIP)
		return config
	}

	raw := workspace.RateLimitJSON
	if rawAlgorithm, ok := raw["algorithm"]; ok {
		if value, ok := rawAlgorithm.(string); ok {
			normalized := strings.ToLower(strings.TrimSpace(value))
			if normalized != "" {
				config.algorithm = normalized
			}
		}
	}
	if rawAlgorithm, ok := raw["rate_limit_algorithm"]; ok {
		if value, ok := rawAlgorithm.(string); ok {
			normalized := strings.ToLower(strings.TrimSpace(value))
			if normalized != "" {
				config.algorithm = normalized
			}
		}
	}
	if config.algorithm == "" || config.algorithm != rateLimitAlgorithmFixedWindow {
		config.algorithm = rateLimitAlgorithmFixedWindow
	}
	if rawMax, ok := raw["max_requests"]; ok {
		if value, ok := toInt(rawMax); ok {
			config.perIP.maxRequests = value
		}
	}
	if rawWindow, ok := raw["window_seconds"]; ok {
		if value, ok := toInt(rawWindow); ok && value > 0 {
			config.perIP.window = time.Duration(value) * time.Second
		}
	}

	if perIPRaw, ok := raw["per_ip"]; ok {
		config.perIP = parseRateLimitRule(perIPRaw, config.perIP)
	}
	if perSessionRaw, ok := raw["per_session"]; ok {
		config.perSession = parseRateLimitRule(perSessionRaw, config.perSession)
	}
	if perWorkspaceRaw, ok := raw["per_workspace"]; ok {
		config.perWorkspace = parseRateLimitRule(perWorkspaceRaw, config.perWorkspace)
	}

	config.blacklist = mergeStringSlices(
		coerceStringSlice(raw["blacklist"]),
		coerceStringSlice(raw["denylist"]),
		coerceStringSlice(raw["blocklist"]),
		coerceStringSlice(raw["blocked_ips"]),
		coerceStringSlice(raw["blocked_ip_hashes"]),
	)
	config.graylist = mergeStringSlices(
		coerceStringSlice(raw["graylist"]),
		coerceStringSlice(raw["greylist"]),
	)

	if grayPolicyRaw, ok := raw["gray_policy"]; ok {
		config.grayPolicy = parseGrayPolicy(grayPolicyRaw, config.grayPolicy)
	}
	if grayPolicyRaw, ok := raw["graylist_policy"]; ok {
		config.grayPolicy = parseGrayPolicy(grayPolicyRaw, config.grayPolicy)
	}

	if anomalyRaw, ok := raw["anomaly"]; ok {
		config.anomaly = parseAnomalyConfig(anomalyRaw, config.anomaly, config.perIP)
	}
	if !config.anomaly.highFreq.enabled() {
		config.anomaly.highFreq = defaultHighFreqRule(config.perIP)
	}

	return config
}

func parseRateLimitRule(raw interface{}, fallback rateLimitRule) rateLimitRule {
	rule := fallback
	switch value := raw.(type) {
	case map[string]interface{}:
		if rawMax, ok := value["max_requests"]; ok {
			if parsed, ok := toInt(rawMax); ok {
				rule.maxRequests = parsed
			}
		}
		if rawWindow, ok := value["window_seconds"]; ok {
			if parsed, ok := toInt(rawWindow); ok && parsed > 0 {
				rule.window = time.Duration(parsed) * time.Second
			}
		}
	case map[string]int:
		if rawMax, ok := value["max_requests"]; ok {
			rule.maxRequests = rawMax
		}
		if rawWindow, ok := value["window_seconds"]; ok && rawWindow > 0 {
			rule.window = time.Duration(rawWindow) * time.Second
		}
	}
	return rule
}

func parseGrayPolicy(raw interface{}, fallback graylistPolicy) graylistPolicy {
	policy := fallback
	if value, ok := raw.(map[string]interface{}); ok {
		if rawMax, ok := value["max_requests"]; ok {
			if parsed, ok := toInt(rawMax); ok {
				policy.maxRequests = parsed
			}
		}
		if rawWindow, ok := value["window_seconds"]; ok {
			if parsed, ok := toInt(rawWindow); ok && parsed > 0 {
				policy.window = time.Duration(parsed) * time.Second
			}
		}
		if rawRequire, ok := value["require_captcha"]; ok {
			if parsed, ok := toBool(rawRequire); ok {
				policy.requireCaptcha = parsed
			}
		}
	}
	return policy
}

func parseAnomalyConfig(raw interface{}, fallback runtimeAnomalyConfig, perIP rateLimitRule) runtimeAnomalyConfig {
	config := fallback
	if value, ok := raw.(map[string]interface{}); ok {
		if highFreqRaw, ok := value["high_freq"]; ok {
			config.highFreq = parseRateLimitRule(highFreqRaw, config.highFreq)
		}
		if failureRaw, ok := value["failure_rate"]; ok {
			if rule, ok := failureRaw.(map[string]interface{}); ok {
				if thresholdRaw, ok := rule["threshold"]; ok {
					if parsed, ok := toFloat(thresholdRaw); ok {
						config.failureRate.threshold = parsed
					}
				}
				if minRaw, ok := rule["min_requests"]; ok {
					if parsed, ok := toInt(minRaw); ok {
						config.failureRate.minRequests = parsed
					}
				}
				if windowRaw, ok := rule["window_seconds"]; ok {
					if parsed, ok := toInt(windowRaw); ok && parsed > 0 {
						config.failureRate.window = time.Duration(parsed) * time.Second
					}
				}
			}
		}
		if spikeRaw, ok := value["spike"]; ok {
			if rule, ok := spikeRaw.(map[string]interface{}); ok {
				if ratioRaw, ok := rule["ratio"]; ok {
					if parsed, ok := toFloat(ratioRaw); ok {
						config.spike.ratio = parsed
					}
				}
				if minRaw, ok := rule["min_previous"]; ok {
					if parsed, ok := toInt(minRaw); ok {
						config.spike.minPrevious = parsed
					}
				}
				if windowRaw, ok := rule["window_seconds"]; ok {
					if parsed, ok := toInt(windowRaw); ok && parsed > 0 {
						config.spike.window = time.Duration(parsed) * time.Second
					}
				}
			}
		}
	}
	if !config.highFreq.enabled() {
		config.highFreq = defaultHighFreqRule(perIP)
	}
	return config
}

func defaultHighFreqRule(perIP rateLimitRule) rateLimitRule {
	if !perIP.enabled() {
		return rateLimitRule{}
	}
	maxRequests := int(float64(perIP.maxRequests) * defaultAnomalyHighFreqRatio)
	if maxRequests <= 0 {
		maxRequests = perIP.maxRequests
	}
	if maxRequests > perIP.maxRequests {
		maxRequests = perIP.maxRequests
	}
	return rateLimitRule{
		maxRequests: maxRequests,
		window:      perIP.window,
	}
}

func mergeStringSlices(slices ...[]string) []string {
	if len(slices) == 0 {
		return nil
	}
	seen := make(map[string]struct{})
	result := make([]string, 0)
	for _, slice := range slices {
		for _, item := range slice {
			trimmed := strings.TrimSpace(item)
			if trimmed == "" {
				continue
			}
			if _, exists := seen[trimmed]; exists {
				continue
			}
			seen[trimmed] = struct{}{}
			result = append(result, trimmed)
		}
	}
	return result
}

func isListed(rawIP, ipHash string, list []string) bool {
	trimmedIP := strings.TrimSpace(rawIP)
	for _, entry := range list {
		trimmed := strings.TrimSpace(entry)
		if trimmed == "" {
			continue
		}
		if trimmedIP != "" && strings.EqualFold(trimmedIP, trimmed) {
			return true
		}
		normalized := strings.TrimPrefix(trimmed, "sha256:")
		normalized = strings.TrimPrefix(normalized, "hash:")
		if ipHash != "" && strings.EqualFold(ipHash, normalized) {
			return true
		}
	}
	return false
}

func applyGrayPolicy(rule rateLimitRule, policy graylistPolicy) rateLimitRule {
	adjusted := rule
	if policy.maxRequests > 0 {
		if adjusted.maxRequests == 0 || policy.maxRequests < adjusted.maxRequests {
			adjusted.maxRequests = policy.maxRequests
		}
	} else if adjusted.maxRequests > 1 {
		adjusted.maxRequests = maxInt(1, adjusted.maxRequests/2)
	}
	if policy.window > 0 {
		adjusted.window = policy.window
	}
	return adjusted
}

func (s *runtimeService) enforceRateLimit(
	ctx context.Context,
	entry *RuntimeEntry,
	session *entity.WorkspaceSession,
	ipHash string,
	perIP rateLimitRule,
	perSession rateLimitRule,
	perWorkspace rateLimitRule,
	now time.Time,
) error {
	if entry == nil || entry.Workspace == nil {
		return nil
	}
	// 简化版：暂时跳过详细的速率限制检查
	// 完整实现需要在 workspace_repo 中添加事件计数方法
	_ = perIP
	_ = perSession
	_ = perWorkspace
	_ = ipHash
	_ = session
	_ = now
	return nil
}

func (s *runtimeService) detectAnomalies(
	ctx context.Context,
	entry *RuntimeEntry,
	session *entity.WorkspaceSession,
	ipHash string,
	config runtimeRateLimitConfig,
	now time.Time,
) ([]string, error) {
	if entry == nil || entry.Workspace == nil {
		return nil, nil
	}
	// 简化版：暂时跳过异常检测
	// 完整实现需要在 workspace_repo 中添加事件计数方法
	_ = session
	_ = ipHash
	_ = config
	_ = now
	return nil, nil
}

func shouldLoadShed(eventType string, signals []string) bool {
	if strings.TrimSpace(eventType) != RuntimeEventExecute {
		return false
	}
	for _, signal := range signals {
		if isLoadShedSignal(signal) {
			return true
		}
	}
	return false
}

func isLoadShedSignal(signal string) bool {
	switch strings.ToLower(strings.TrimSpace(signal)) {
	case "high_frequency", "rate_spike", "failure_rate":
		return true
	default:
		return false
	}
}

func buildRiskPayload(meta RuntimeAccessMeta, ipHash, userAgentHash string, signals []string, extra entity.JSON) entity.JSON {
	payload := entity.JSON{}
	if meta.Path != "" {
		payload["path"] = meta.Path
	}
	if ipHash != "" {
		payload["ip_hash"] = ipHash
	}
	if userAgentHash != "" {
		payload["user_agent_hash"] = userAgentHash
	}
	if meta.CaptchaProvided {
		payload["captcha_provided"] = true
	}
	if len(signals) > 0 {
		payload["risk_signals"] = signals
	}
	for key, value := range extra {
		payload[key] = value
	}
	return payload
}

func coerceStringSlice(value interface{}) []string {
	switch v := value.(type) {
	case []string:
		return v
	case []interface{}:
		items := make([]string, 0, len(v))
		for _, item := range v {
			if s, ok := item.(string); ok {
				trimmed := strings.TrimSpace(s)
				if trimmed != "" {
					items = append(items, trimmed)
				}
			}
		}
		return items
	case string:
		trimmed := strings.TrimSpace(v)
		if trimmed == "" {
			return nil
		}
		return []string{trimmed}
	default:
		return nil
	}
}

func toInt(value interface{}) (int, bool) {
	switch v := value.(type) {
	case int:
		return v, true
	case int64:
		return int(v), true
	case float64:
		return int(v), true
	case float32:
		return int(v), true
	case string:
		parsed, err := strconv.Atoi(strings.TrimSpace(v))
		if err != nil {
			return 0, false
		}
		return parsed, true
	default:
		return 0, false
	}
}

func toFloat(value interface{}) (float64, bool) {
	switch v := value.(type) {
	case float64:
		return v, true
	case float32:
		return float64(v), true
	case int:
		return float64(v), true
	case int64:
		return float64(v), true
	case string:
		parsed, err := strconv.ParseFloat(strings.TrimSpace(v), 64)
		if err != nil {
			return 0, false
		}
		return parsed, true
	default:
		return 0, false
	}
}

func toBool(value interface{}) (bool, bool) {
	switch v := value.(type) {
	case bool:
		return v, true
	case string:
		trimmed := strings.TrimSpace(v)
		if trimmed == "" {
			return false, false
		}
		normalized := strings.ToLower(trimmed)
		if normalized == "true" || normalized == "1" || normalized == "yes" {
			return true, true
		}
		if normalized == "false" || normalized == "0" || normalized == "no" {
			return false, true
		}
		return false, false
	default:
		return false, false
	}
}

func maxInt(a, b int) int {
	if a > b {
		return a
	}
	return b
}

func hashValue(value string) string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return ""
	}
	sum := sha256.Sum256([]byte(trimmed))
	return hex.EncodeToString(sum[:])
}

func stringPtrOrNil(value string) *string {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	copied := value
	return &copied
}

func normalizeRuntimeDomain(value string) string {
	trimmed := strings.TrimSpace(strings.ToLower(value))
	if trimmed == "" {
		return ""
	}
	if strings.Contains(trimmed, ",") {
		trimmed = strings.TrimSpace(strings.Split(trimmed, ",")[0])
	}
	if host, _, err := net.SplitHostPort(trimmed); err == nil {
		trimmed = host
	}
	return strings.TrimSuffix(trimmed, ".")
}

func runtimeRequestEventTypes() []string {
	return []string{RuntimeEventEntry, RuntimeEventSchema, RuntimeEventExecute}
}

func resolveWorkspaceAccessEventType(eventType string) entity.RuntimeEventType {
	switch strings.TrimSpace(eventType) {
	case RuntimeEventExecute:
		return entity.EventWorkspaceExecuted
	default:
		return entity.EventWorkspaceAccessed
	}
}

// isRuntimeAccessibleWorkspaceStatus 检查 Workspace 的 AppStatus 是否允许 Runtime 访问
func isRuntimeAccessibleWorkspaceStatus(status string) bool {
	normalized := strings.ToLower(strings.TrimSpace(status))
	switch normalized {
	case "published", "active":
		return true
	default:
		return false
	}
}

var (
	ErrRuntimeWorkspaceNotFound = errors.New("runtime workspace not found")
	ErrRuntimeInvalidSlug       = errors.New("runtime slug is invalid")
	ErrRuntimeInvalidDomain     = errors.New("runtime domain is invalid")
	ErrRuntimeNotPublished      = errors.New("runtime workspace not published")
	ErrRuntimeAuthRequired      = errors.New("runtime auth required")
	ErrRuntimeAccessDenied      = errors.New("runtime access denied")
	ErrRuntimeVersionRequired   = errors.New("runtime version required")
	ErrRuntimeVersionNotFound   = errors.New("runtime version not found")
	ErrRuntimeRateLimited       = errors.New("runtime rate limited")
	ErrRuntimeOverloaded        = errors.New("runtime overloaded")
	ErrRuntimeIPBlocked         = errors.New("runtime ip blocked")
	ErrRuntimeSessionBlocked    = errors.New("runtime session blocked")
	ErrRuntimeDomainNotFound    = errors.New("runtime domain not found")
	ErrRuntimeDomainNotActive   = errors.New("runtime domain not active")
	ErrRuntimeDomainBlocked     = errors.New("runtime domain blocked")
)

const (
	defaultAnonymousSessionTTL  = 24 * time.Hour
	defaultAnonymousMaxRequests = 120
	defaultAnonymousWindow      = 60 * time.Second

	defaultAnomalyHighFreqRatio        = 0.8
	defaultAnomalyFailureRateThreshold = 0.5
	defaultAnomalyFailureRateWindow    = 5 * time.Minute
	defaultAnomalyFailureMinRequests   = 5
	defaultAnomalySpikeRatio           = 3
	defaultAnomalySpikeWindow          = 60 * time.Second
	defaultAnomalySpikeMinPrevious     = 5

	RuntimeEventEntry           = "runtime_entry"
	RuntimeEventSchema          = "runtime_schema"
	RuntimeEventExecute         = "runtime_execute"
	RuntimeEventExecuteSuccess  = "runtime_execute_success"
	RuntimeEventExecuteFailed   = "runtime_execute_failed"
	RuntimeEventAccessBlocked   = "runtime_access_blocked"
	RuntimeEventRateLimited     = "runtime_rate_limited"
	RuntimeEventRiskDetected    = "runtime_risk_detected"
	RuntimeEventCaptchaRequired = "runtime_captcha_required"
	RuntimeEventLoadShed        = "runtime_load_shed"
)
