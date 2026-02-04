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

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// RuntimeService App Runtime 服务接口
type RuntimeService interface {
	GetEntry(ctx context.Context, workspaceSlug, appSlug string, userID *uuid.UUID) (*RuntimeEntry, error)
	GetSchema(ctx context.Context, workspaceSlug, appSlug string, userID *uuid.UUID) (*RuntimeSchema, error)
	GetEntryByDomain(ctx context.Context, domain string, userID *uuid.UUID) (*RuntimeEntry, error)
	GetSchemaByDomain(ctx context.Context, domain string, userID *uuid.UUID) (*RuntimeSchema, error)
	TrackAnonymousAccess(ctx context.Context, entry *RuntimeEntry, meta RuntimeAccessMeta) (*RuntimeAccessResult, error)
	RecordRuntimeEvent(ctx context.Context, entry *RuntimeEntry, session *entity.AppSession, eventType string, payload entity.JSON) error
}

// RuntimeEntry Runtime 入口信息
type RuntimeEntry struct {
	Workspace    *entity.Workspace       `json:"workspace"`
	App          *entity.App             `json:"app"`
	AccessPolicy *entity.AppAccessPolicy `json:"access_policy"`
}

// RuntimeSchema Runtime Schema 输出
type RuntimeSchema struct {
	RuntimeEntry
	Version *entity.AppVersion `json:"version"`
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
	Session  *entity.AppSession    `json:"session"`
	Decision RuntimeAccessDecision `json:"decision"`
}

type runtimeService struct {
	workspaceRepo       repository.WorkspaceRepository
	slugAliasRepo       repository.WorkspaceSlugAliasRepository
	workspaceMemberRepo repository.WorkspaceMemberRepository
	appRepo             repository.AppRepository
	appSlugAliasRepo    repository.AppSlugAliasRepository
	appVersionRepo      repository.AppVersionRepository
	appPolicyRepo       repository.AppAccessPolicyRepository
	appDomainRepo       repository.AppDomainRepository
	appSessionRepo      repository.AppSessionRepository
	appEventRepo        repository.AppEventRepository
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
	appRepo repository.AppRepository,
	appSlugAliasRepo repository.AppSlugAliasRepository,
	appVersionRepo repository.AppVersionRepository,
	appPolicyRepo repository.AppAccessPolicyRepository,
	appDomainRepo repository.AppDomainRepository,
	appSessionRepo repository.AppSessionRepository,
	appEventRepo repository.AppEventRepository,
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
		appRepo:             appRepo,
		appSlugAliasRepo:    appSlugAliasRepo,
		appVersionRepo:      appVersionRepo,
		appPolicyRepo:       appPolicyRepo,
		appDomainRepo:       appDomainRepo,
		appSessionRepo:      appSessionRepo,
		appEventRepo:        appEventRepo,
		eventRecorder:       eventRecorder,
		pii:                 newPIISanitizer(piiEnabled),
		cache:               runtimeCache,
		cacheGroup:          cacheGroup,
	}
}

func (s *runtimeService) GetEntry(ctx context.Context, workspaceSlug, appSlug string, userID *uuid.UUID) (*RuntimeEntry, error) {
	normalizedWorkspace := strings.TrimSpace(workspaceSlug)
	normalizedApp := strings.TrimSpace(appSlug)
	if normalizedWorkspace == "" || normalizedApp == "" {
		return nil, ErrRuntimeInvalidSlug
	}

	workspace, err := s.getWorkspaceBySlug(ctx, normalizedWorkspace)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrRuntimeWorkspaceNotFound
		}
		return nil, err
	}

	app, err := s.getAppBySlug(ctx, workspace.ID, normalizedApp)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrRuntimeAppNotFound
		}
		return nil, err
	}

	if !isRuntimeAccessibleAppStatus(app.Status) {
		return nil, ErrRuntimeNotPublished
	}

	policy, err := s.getPolicyByAppID(ctx, app.ID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrRuntimePolicyNotFound
		}
		return nil, err
	}

	if err := s.authorizeAccess(ctx, policy, workspace, app, userID); err != nil {
		return nil, err
	}

	return &RuntimeEntry{
		Workspace:    workspace,
		App:          app,
		AccessPolicy: policy,
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

func (s *runtimeService) getAppBySlug(ctx context.Context, workspaceID uuid.UUID, slug string) (*entity.App, error) {
	normalized := strings.TrimSpace(slug)
	if normalized == "" {
		return nil, gorm.ErrRecordNotFound
	}
	cacheKey := runtimeAppSlugCacheKey(workspaceID, normalized)
	if s.cache != nil {
		if cached, ok := s.cache.appByWorkspaceSlug.Get(cacheKey); ok && cached != nil {
			return cached, nil
		}
		if cacheMissHit(s.cache.appByWorkspaceSlugMiss, cacheKey) {
			return nil, gorm.ErrRecordNotFound
		}
	}
	loader := func() (*entity.App, error) {
		app, err := s.appRepo.GetByWorkspaceAndSlug(ctx, workspaceID, normalized)
		if err == nil {
			s.cacheApp(app, cacheKey)
			return app, nil
		}
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, err
		}
		if s.appSlugAliasRepo == nil {
			if s.cache != nil {
				cacheMissSet(s.cache.appByWorkspaceSlugMiss, cacheKey)
			}
			return nil, err
		}
		alias, aliasErr := s.appSlugAliasRepo.GetByWorkspaceAndSlug(ctx, workspaceID, normalized)
		if aliasErr != nil {
			if errors.Is(aliasErr, gorm.ErrRecordNotFound) {
				if s.cache != nil {
					cacheMissSet(s.cache.appByWorkspaceSlugMiss, cacheKey)
				}
				return nil, err
			}
			return nil, aliasErr
		}
		app, aliasErr = s.getAppByID(ctx, alias.AppID)
		if aliasErr != nil {
			return nil, aliasErr
		}
		s.cacheApp(app, cacheKey)
		return app, nil
	}
	if s.cacheGroup != nil {
		value, err := s.cacheGroup.Do("app_slug:"+cacheKey, func() (interface{}, error) {
			return loader()
		})
		if err != nil {
			return nil, err
		}
		app, ok := value.(*entity.App)
		if !ok || app == nil {
			return nil, gorm.ErrRecordNotFound
		}
		return app, nil
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

func (s *runtimeService) getAppByID(ctx context.Context, appID uuid.UUID) (*entity.App, error) {
	cacheKey := appID.String()
	if s.cache != nil {
		if cached, ok := s.cache.appByID.Get(cacheKey); ok && cached != nil {
			return cached, nil
		}
		if cacheMissHit(s.cache.appByIDMiss, cacheKey) {
			return nil, gorm.ErrRecordNotFound
		}
	}
	loader := func() (*entity.App, error) {
		app, err := s.appRepo.GetByID(ctx, appID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) && s.cache != nil {
				cacheMissSet(s.cache.appByIDMiss, cacheKey)
			}
			return nil, err
		}
		s.cacheApp(app, runtimeAppSlugCacheKey(app.WorkspaceID, strings.TrimSpace(app.Slug)))
		return app, nil
	}
	if s.cacheGroup != nil {
		value, err := s.cacheGroup.Do("app_id:"+cacheKey, func() (interface{}, error) {
			return loader()
		})
		if err != nil {
			return nil, err
		}
		app, ok := value.(*entity.App)
		if !ok || app == nil {
			return nil, gorm.ErrRecordNotFound
		}
		return app, nil
	}
	return loader()
}

func (s *runtimeService) getPolicyByAppID(ctx context.Context, appID uuid.UUID) (*entity.AppAccessPolicy, error) {
	cacheKey := appID.String()
	if s.cache != nil {
		if cached, ok := s.cache.policyByAppID.Get(cacheKey); ok && cached != nil {
			return cached, nil
		}
		if cacheMissHit(s.cache.policyByAppIDMiss, cacheKey) {
			return nil, gorm.ErrRecordNotFound
		}
	}
	loader := func() (*entity.AppAccessPolicy, error) {
		policy, err := s.appPolicyRepo.GetByAppID(ctx, appID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) && s.cache != nil {
				cacheMissSet(s.cache.policyByAppIDMiss, cacheKey)
			}
			return nil, err
		}
		if s.cache != nil {
			s.cache.policyByAppID.Set(cacheKey, policy)
		}
		if s.cache != nil {
			cacheMissClear(s.cache.policyByAppIDMiss, cacheKey)
		}
		return policy, nil
	}
	if s.cacheGroup != nil {
		value, err := s.cacheGroup.Do("policy:"+cacheKey, func() (interface{}, error) {
			return loader()
		})
		if err != nil {
			return nil, err
		}
		policy, ok := value.(*entity.AppAccessPolicy)
		if !ok || policy == nil {
			return nil, gorm.ErrRecordNotFound
		}
		return policy, nil
	}
	return loader()
}

func (s *runtimeService) getAppVersionByID(ctx context.Context, versionID uuid.UUID) (*entity.AppVersion, error) {
	cacheKey := versionID.String()
	if s.cache != nil {
		if cached, ok := s.cache.versionByID.Get(cacheKey); ok && cached != nil {
			return cloneAppVersion(cached), nil
		}
		if cacheMissHit(s.cache.versionByIDMiss, cacheKey) {
			return nil, gorm.ErrRecordNotFound
		}
	}
	loader := func() (*entity.AppVersion, error) {
		version, err := s.appVersionRepo.GetByID(ctx, versionID)
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
		return cloneAppVersion(version), nil
	}
	if s.cacheGroup != nil {
		value, err := s.cacheGroup.Do("version:"+cacheKey, func() (interface{}, error) {
			return loader()
		})
		if err != nil {
			return nil, err
		}
		version, ok := value.(*entity.AppVersion)
		if !ok || version == nil {
			return nil, gorm.ErrRecordNotFound
		}
		return cloneAppVersion(version), nil
	}
	return loader()
}

func (s *runtimeService) getDomainByHost(ctx context.Context, domain string) (*entity.AppDomain, error) {
	normalized := strings.TrimSpace(domain)
	if normalized == "" {
		return nil, gorm.ErrRecordNotFound
	}
	if s.cache != nil {
		if cached, ok := s.cache.domainByHost.Get(normalized); ok && cached != nil {
			return cached, nil
		}
		if cacheMissHit(s.cache.domainByHostMiss, normalized) {
			return nil, gorm.ErrRecordNotFound
		}
	}
	loader := func() (*entity.AppDomain, error) {
		record, err := s.appDomainRepo.GetByDomain(ctx, normalized)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) && s.cache != nil {
				cacheMissSet(s.cache.domainByHostMiss, normalized)
			}
			return nil, err
		}
		if s.cache != nil {
			s.cache.domainByHost.Set(normalized, record)
		}
		if s.cache != nil {
			cacheMissClear(s.cache.domainByHostMiss, normalized)
		}
		return record, nil
	}
	if s.cacheGroup != nil {
		value, err := s.cacheGroup.Do("domain:"+normalized, func() (interface{}, error) {
			return loader()
		})
		if err != nil {
			return nil, err
		}
		record, ok := value.(*entity.AppDomain)
		if !ok || record == nil {
			return nil, gorm.ErrRecordNotFound
		}
		return record, nil
	}
	return loader()
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

func (s *runtimeService) cacheApp(app *entity.App, cacheKey string) {
	if s.cache == nil || app == nil {
		return
	}
	appID := app.ID.String()
	s.cache.appByID.Set(appID, app)
	cacheMissClear(s.cache.appByIDMiss, appID)
	if cacheKey != "" {
		s.cache.appByWorkspaceSlug.Set(cacheKey, app)
		cacheMissClear(s.cache.appByWorkspaceSlugMiss, cacheKey)
	}
	if slug := strings.TrimSpace(app.Slug); slug != "" {
		slugKey := runtimeAppSlugCacheKey(app.WorkspaceID, slug)
		s.cache.appByWorkspaceSlug.Set(slugKey, app)
		cacheMissClear(s.cache.appByWorkspaceSlugMiss, slugKey)
	}
}

func runtimeAppSlugCacheKey(workspaceID uuid.UUID, slug string) string {
	return workspaceID.String() + ":" + strings.TrimSpace(slug)
}

func cloneAppVersion(version *entity.AppVersion) *entity.AppVersion {
	if version == nil {
		return nil
	}
	cloned := *version
	return &cloned
}

func (s *runtimeService) GetSchema(ctx context.Context, workspaceSlug, appSlug string, userID *uuid.UUID) (*RuntimeSchema, error) {
	entry, err := s.GetEntry(ctx, workspaceSlug, appSlug, userID)
	if err != nil {
		return nil, err
	}

	if entry.App.CurrentVersionID == nil {
		return nil, ErrRuntimeVersionRequired
	}

	version, err := s.getAppVersionByID(ctx, *entry.App.CurrentVersionID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrRuntimeVersionNotFound
		}
		return nil, err
	}
	if version.AppID != entry.App.ID {
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

	app, err := s.getAppByID(ctx, domainRecord.AppID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrRuntimeAppNotFound
		}
		return nil, err
	}
	if !isRuntimeAccessibleAppStatus(app.Status) {
		return nil, ErrRuntimeNotPublished
	}

	workspace, err := s.getWorkspaceByID(ctx, app.WorkspaceID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrRuntimeWorkspaceNotFound
		}
		return nil, err
	}

	policy, err := s.getPolicyByAppID(ctx, app.ID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrRuntimePolicyNotFound
		}
		return nil, err
	}

	if err := s.authorizeAccess(ctx, policy, workspace, app, userID); err != nil {
		return nil, err
	}

	return &RuntimeEntry{
		Workspace:    workspace,
		App:          app,
		AccessPolicy: policy,
	}, nil
}

func (s *runtimeService) GetSchemaByDomain(ctx context.Context, domain string, userID *uuid.UUID) (*RuntimeSchema, error) {
	entry, err := s.GetEntryByDomain(ctx, domain, userID)
	if err != nil {
		return nil, err
	}

	if entry.App.CurrentVersionID == nil {
		return nil, ErrRuntimeVersionRequired
	}

	version, err := s.getAppVersionByID(ctx, *entry.App.CurrentVersionID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrRuntimeVersionNotFound
		}
		return nil, err
	}
	if version.AppID != entry.App.ID {
		return nil, ErrRuntimeVersionNotFound
	}

	return &RuntimeSchema{
		RuntimeEntry: *entry,
		Version:      version,
	}, nil
}

func (s *runtimeService) TrackAnonymousAccess(ctx context.Context, entry *RuntimeEntry, meta RuntimeAccessMeta) (*RuntimeAccessResult, error) {
	if entry == nil || entry.AccessPolicy == nil || entry.App == nil || entry.Workspace == nil {
		return nil, ErrRuntimePolicyNotFound
	}

	if strings.ToLower(strings.TrimSpace(entry.AccessPolicy.AccessMode)) != "public_anonymous" {
		return &RuntimeAccessResult{}, nil
	}

	now := time.Now()
	ipHash := hashValue(meta.IP)
	userAgentHash := hashValue(meta.UserAgent)

	skipSession := meta.SkipSession && meta.SessionID == nil
	var session *entity.AppSession
	if !skipSession {
		if meta.SessionID != nil {
			existing, err := s.appSessionRepo.GetByID(ctx, *meta.SessionID)
			if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, err
			}
			if err == nil && existing.AppID == entry.App.ID {
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

	config := resolveRateLimitConfig(entry.AccessPolicy)
	decision := RuntimeAccessDecision{
		RequireCaptcha: entry.AccessPolicy.RequireCaptcha,
	}

	if isListed(meta.IP, ipHash, config.blacklist) {
		if session != nil && session.BlockedAt == nil {
			_ = s.appSessionRepo.Block(ctx, session.ID, "blacklist", now)
		}
		if err := s.recordRuntimeEvent(ctx, entry.App.ID, session, RuntimeEventAccessBlocked, buildRiskPayload(meta, ipHash, userAgentHash, []string{"blacklist"}, entity.JSON{
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
	perApp := config.perApp
	if graylisted {
		perIP = applyGrayPolicy(perIP, config.grayPolicy)
		perSession = applyGrayPolicy(perSession, config.grayPolicy)
		perApp = applyGrayPolicy(perApp, config.grayPolicy)
		if config.grayPolicy.requireCaptcha {
			decision.RequireCaptcha = true
		}
	}

	if err := s.enforceRateLimit(ctx, entry, session, ipHash, perIP, perSession, perApp, now); err != nil {
		return nil, err
	}

	riskSignals, err := s.detectAnomalies(ctx, entry, session, ipHash, config, now)
	if err != nil {
		return nil, err
	}
	if len(riskSignals) > 0 {
		decision.RiskSignals = append(decision.RiskSignals, riskSignals...)
		decision.RequireCaptcha = true
		if err := s.recordRuntimeEvent(ctx, entry.App.ID, session, RuntimeEventRiskDetected, buildRiskPayload(meta, ipHash, userAgentHash, riskSignals, entity.JSON{
			"reason": "anomaly",
		})); err != nil {
			return nil, err
		}
		if shouldLoadShed(eventType, riskSignals) {
			if err := s.recordRuntimeEvent(ctx, entry.App.ID, session, RuntimeEventLoadShed, buildRiskPayload(meta, ipHash, userAgentHash, riskSignals, entity.JSON{
				"reason": "load_shed",
			})); err != nil {
				return nil, err
			}
			return nil, ErrRuntimeOverloaded
		}
	}

	if decision.RequireCaptcha && !meta.CaptchaProvided {
		if err := s.recordRuntimeEvent(ctx, entry.App.ID, session, RuntimeEventCaptchaRequired, buildRiskPayload(meta, ipHash, userAgentHash, decision.RiskSignals, entity.JSON{
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
	if err := s.recordRuntimeEvent(ctx, entry.App.ID, session, eventType, payload); err != nil {
		return nil, err
	}

	s.recordAppAccessed(ctx, entry, session, meta, ipHash, userAgentHash)
	return &RuntimeAccessResult{Session: session, Decision: decision}, nil
}

func (s *runtimeService) authorizeAccess(ctx context.Context, policy *entity.AppAccessPolicy, workspace *entity.Workspace, app *entity.App, userID *uuid.UUID) error {
	if err := s.authorizeAccessMode(policy, app, userID); err != nil {
		return err
	}
	return s.authorizeClassification(ctx, policy, workspace, app, userID)
}

func (s *runtimeService) authorizeAccessMode(policy *entity.AppAccessPolicy, app *entity.App, userID *uuid.UUID) error {
	mode := strings.ToLower(strings.TrimSpace(policy.AccessMode))
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
		if *userID != app.OwnerUserID {
			return ErrRuntimeAccessDenied
		}
		return nil
	default:
		return ErrRuntimeAccessDenied
	}
}

func (s *runtimeService) authorizeClassification(ctx context.Context, policy *entity.AppAccessPolicy, workspace *entity.Workspace, app *entity.App, userID *uuid.UUID) error {
	requirement := resolveDataClassificationRequirement(policy.DataClassification)
	if !requirement.requireAuth && !requirement.requireMember && !requirement.requireOwner {
		return nil
	}

	if requirement.requireAuth && userID == nil {
		return ErrRuntimeAuthRequired
	}

	if requirement.requireOwner {
		if userID == nil || *userID != app.OwnerUserID {
			return ErrRuntimeAccessDenied
		}
		return nil
	}

	if userID == nil {
		return ErrRuntimeAuthRequired
	}
	if *userID == app.OwnerUserID {
		return nil
	}
	if workspace == nil {
		return ErrRuntimeAccessDenied
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

func (s *runtimeService) ensureAnonymousSession(ctx context.Context, entry *RuntimeEntry, meta RuntimeAccessMeta, ipHash, userAgentHash string) (*entity.AppSession, error) {
	var session *entity.AppSession

	if meta.SessionID != nil {
		existing, err := s.appSessionRepo.GetValidByID(ctx, *meta.SessionID)
		if err == nil && existing.AppID == entry.App.ID {
			session = existing
		} else if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, err
		}
	}

	if session == nil {
		expiredAt := time.Now().Add(defaultAnonymousSessionTTL)
		session = &entity.AppSession{
			AppID:         entry.App.ID,
			WorkspaceID:   entry.Workspace.ID,
			SessionType:   "anon",
			UserID:        nil,
			IPHash:        stringPtrOrNil(ipHash),
			UserAgentHash: stringPtrOrNil(userAgentHash),
			ExpiredAt:     &expiredAt,
		}
		if err := s.appSessionRepo.Create(ctx, session); err != nil {
			return nil, err
		}
	} else {
		expiredAt := time.Now().Add(defaultAnonymousSessionTTL)
		if err := s.appSessionRepo.UpdateExpiry(ctx, session.ID, expiredAt); err != nil {
			return nil, err
		}
		session.ExpiredAt = &expiredAt
	}

	return session, nil
}

func (s *runtimeService) RecordRuntimeEvent(ctx context.Context, entry *RuntimeEntry, session *entity.AppSession, eventType string, payload entity.JSON) error {
	if entry == nil || entry.App == nil {
		return nil
	}
	return s.recordRuntimeEvent(ctx, entry.App.ID, session, eventType, payload)
}

func (s *runtimeService) recordRuntimeEvent(ctx context.Context, appID uuid.UUID, session *entity.AppSession, eventType string, payload entity.JSON) error {
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
	return s.appEventRepo.Create(ctx, &entity.AppEvent{
		AppID:     appID,
		SessionID: session.ID,
		EventType: normalized,
		Payload:   payloadForLog,
	})
}

func (s *runtimeService) recordAppAccessed(ctx context.Context, entry *RuntimeEntry, session *entity.AppSession, meta RuntimeAccessMeta, ipHash, userAgentHash string) {
	if s.eventRecorder == nil || entry == nil || entry.App == nil || entry.Workspace == nil {
		return
	}
	eventType := resolveAppAccessEventType(meta.EventType)
	metadata := entity.JSON{}
	if entry.AccessPolicy != nil && strings.TrimSpace(entry.AccessPolicy.AccessMode) != "" {
		metadata["access_mode"] = entry.AccessPolicy.AccessMode
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
	_ = s.eventRecorder.RecordAppEvent(ctx, eventType, entry.App.ID, entry.Workspace.ID, sessionID, "app accessed", metadata)
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
	algorithm  string
	perIP      rateLimitRule
	perSession rateLimitRule
	perApp     rateLimitRule
	blacklist  []string
	graylist   []string
	grayPolicy graylistPolicy
	anomaly    runtimeAnomalyConfig
}

func resolveRateLimitConfig(policy *entity.AppAccessPolicy) runtimeRateLimitConfig {
	config := runtimeRateLimitConfig{
		algorithm: rateLimitAlgorithmFixedWindow,
		perIP: rateLimitRule{
			maxRequests: defaultAnonymousMaxRequests,
			window:      defaultAnonymousWindow,
		},
		perSession: rateLimitRule{},
		perApp:     rateLimitRule{},
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

	if policy == nil || policy.RateLimitJSON == nil {
		config.anomaly.highFreq = defaultHighFreqRule(config.perIP)
		return config
	}

	raw := policy.RateLimitJSON
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
	if perAppRaw, ok := raw["per_app"]; ok {
		config.perApp = parseRateLimitRule(perAppRaw, config.perApp)
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
	session *entity.AppSession,
	ipHash string,
	perIP rateLimitRule,
	perSession rateLimitRule,
	perApp rateLimitRule,
	now time.Time,
) error {
	if entry == nil || entry.App == nil {
		return nil
	}
	if perSession.enabled() && session != nil {
		since := now.Add(-perSession.window)
		count, err := s.appEventRepo.CountRecentByAppAndSessionID(ctx, entry.App.ID, session.ID, since, runtimeRequestEventTypes())
		if err != nil {
			return err
		}
		if err := s.handleRateLimit(ctx, entry.App.ID, entry.Workspace.ID, session, "per_session", perSession, count, now); err != nil {
			return err
		}
	}
	if perIP.enabled() && ipHash != "" {
		since := now.Add(-perIP.window)
		count, err := s.appEventRepo.CountRecentByAppAndIPHash(ctx, entry.App.ID, ipHash, since, runtimeRequestEventTypes())
		if err != nil {
			return err
		}
		if err := s.handleRateLimit(ctx, entry.App.ID, entry.Workspace.ID, session, "per_ip", perIP, count, now); err != nil {
			return err
		}
	}
	if perApp.enabled() {
		since := now.Add(-perApp.window)
		count, err := s.appEventRepo.CountRecentByApp(ctx, entry.App.ID, since, runtimeRequestEventTypes())
		if err != nil {
			return err
		}
		if err := s.handleRateLimit(ctx, entry.App.ID, entry.Workspace.ID, session, "per_app", perApp, count, now); err != nil {
			return err
		}
	}
	return nil
}

func (s *runtimeService) handleRateLimit(
	ctx context.Context,
	appID uuid.UUID,
	workspaceID uuid.UUID,
	session *entity.AppSession,
	scope string,
	rule rateLimitRule,
	count int64,
	now time.Time,
) error {
	if count < int64(rule.maxRequests) {
		return nil
	}
	if session != nil && session.BlockedAt == nil {
		_ = s.appSessionRepo.Block(ctx, session.ID, "rate_limit", now)
	}
	payload := entity.JSON{
		"limit_scope":    scope,
		"max_requests":   rule.maxRequests,
		"window_seconds": int(rule.window.Seconds()),
		"current_count":  count,
	}
	if err := s.recordRuntimeEvent(ctx, appID, session, RuntimeEventRateLimited, payload); err != nil {
		return err
	}
	if s.eventRecorder != nil {
		var sessionID *uuid.UUID
		if session != nil {
			sessionID = &session.ID
		}
		_ = s.eventRecorder.RecordAppEvent(ctx, entity.EventAppRateLimited, appID, workspaceID, sessionID, "app rate limited", payload)
	}
	return ErrRuntimeRateLimited
}

func (s *runtimeService) detectAnomalies(
	ctx context.Context,
	entry *RuntimeEntry,
	session *entity.AppSession,
	ipHash string,
	config runtimeRateLimitConfig,
	now time.Time,
) ([]string, error) {
	if entry == nil || entry.App == nil {
		return nil, nil
	}
	signals := make([]string, 0)
	if config.anomaly.highFreq.enabled() {
		since := now.Add(-config.anomaly.highFreq.window)
		var count int64
		var err error
		if ipHash != "" {
			count, err = s.appEventRepo.CountRecentByAppAndIPHash(ctx, entry.App.ID, ipHash, since, runtimeRequestEventTypes())
		} else if session != nil {
			count, err = s.appEventRepo.CountRecentByAppAndSessionID(ctx, entry.App.ID, session.ID, since, runtimeRequestEventTypes())
		} else {
			count, err = s.appEventRepo.CountRecentByApp(ctx, entry.App.ID, since, runtimeRequestEventTypes())
		}
		if err != nil {
			return nil, err
		}
		if count >= int64(config.anomaly.highFreq.maxRequests) {
			signals = append(signals, "high_frequency")
		}
	}

	if config.anomaly.failureRate.window > 0 && config.anomaly.failureRate.threshold > 0 {
		since := now.Add(-config.anomaly.failureRate.window)
		total, err := s.appEventRepo.CountRecentByApp(ctx, entry.App.ID, since, runtimeExecuteOutcomeEventTypes())
		if err != nil {
			return nil, err
		}
		if total >= int64(config.anomaly.failureRate.minRequests) && total > 0 {
			failed, err := s.appEventRepo.CountRecentByApp(ctx, entry.App.ID, since, []string{RuntimeEventExecuteFailed})
			if err != nil {
				return nil, err
			}
			if float64(failed)/float64(total) >= config.anomaly.failureRate.threshold {
				signals = append(signals, "failure_rate")
			}
		}
	}

	if config.anomaly.spike.window > 0 && config.anomaly.spike.ratio > 0 {
		window := config.anomaly.spike.window
		sinceCurrent := now.Add(-window)
		sincePrevious := now.Add(-2 * window)
		var currentCount int64
		var previousCount int64
		var err error
		if ipHash != "" {
			currentCount, err = s.appEventRepo.CountRecentByAppAndIPHash(ctx, entry.App.ID, ipHash, sinceCurrent, runtimeRequestEventTypes())
			if err != nil {
				return nil, err
			}
			previousCount, err = s.appEventRepo.CountRecentByAppAndIPHash(ctx, entry.App.ID, ipHash, sincePrevious, runtimeRequestEventTypes())
		} else {
			currentCount, err = s.appEventRepo.CountRecentByApp(ctx, entry.App.ID, sinceCurrent, runtimeRequestEventTypes())
			if err != nil {
				return nil, err
			}
			previousCount, err = s.appEventRepo.CountRecentByApp(ctx, entry.App.ID, sincePrevious, runtimeRequestEventTypes())
		}
		if err != nil {
			return nil, err
		}
		previousWindowCount := previousCount - currentCount
		if previousWindowCount < 0 {
			previousWindowCount = 0
		}
		if previousWindowCount >= int64(config.anomaly.spike.minPrevious) &&
			float64(currentCount) >= config.anomaly.spike.ratio*float64(previousWindowCount) {
			signals = append(signals, "rate_spike")
		}
	}

	return signals, nil
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

func runtimeExecuteOutcomeEventTypes() []string {
	return []string{RuntimeEventExecuteSuccess, RuntimeEventExecuteFailed}
}

func resolveAppAccessEventType(eventType string) entity.RuntimeEventType {
	switch strings.TrimSpace(eventType) {
	case RuntimeEventExecute:
		return entity.EventAppExecuted
	default:
		return entity.EventAppAccessed
	}
}

var (
	ErrRuntimeWorkspaceNotFound = errors.New("runtime workspace not found")
	ErrRuntimeAppNotFound       = errors.New("runtime app not found")
	ErrRuntimePolicyNotFound    = errors.New("runtime access policy not found")
	ErrRuntimeInvalidSlug       = errors.New("runtime slug is invalid")
	ErrRuntimeInvalidDomain     = errors.New("runtime domain is invalid")
	ErrRuntimeNotPublished      = errors.New("runtime app not published")
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
