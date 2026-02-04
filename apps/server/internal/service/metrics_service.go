package service

import (
	"context"
	"encoding/json"
	"errors"
	"strconv"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/pkg/redis"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// MetricsService 可观测性指标服务接口
type MetricsService interface {
	GetAppMetrics(ctx context.Context, userID, appID uuid.UUID) (*AppMetrics, error)
	GetAppAccessStats(ctx context.Context, userID, appID uuid.UUID, windowDays int) (*AppAccessStats, error)
	GetWorkspaceUsage(ctx context.Context, userID, workspaceID uuid.UUID) (*WorkspaceUsage, error)
}

type metricsService struct {
	appRepo            repository.AppRepository
	appVersionRepo     repository.AppVersionRepository
	executionRepo      repository.ExecutionRepository
	runtimeEventRepo   repository.RuntimeEventRepository
	workspaceService   WorkspaceService
	workspaceQuotaRepo repository.WorkspaceQuotaRepository
	cache              *redis.Client
	cacheTTL           time.Duration
}

// NewMetricsService 创建指标服务实例
func NewMetricsService(
	appRepo repository.AppRepository,
	appVersionRepo repository.AppVersionRepository,
	executionRepo repository.ExecutionRepository,
	runtimeEventRepo repository.RuntimeEventRepository,
	workspaceService WorkspaceService,
	workspaceQuotaRepo repository.WorkspaceQuotaRepository,
	cache *redis.Client,
) MetricsService {
	return &metricsService{
		appRepo:            appRepo,
		appVersionRepo:     appVersionRepo,
		executionRepo:      executionRepo,
		runtimeEventRepo:   runtimeEventRepo,
		workspaceService:   workspaceService,
		workspaceQuotaRepo: workspaceQuotaRepo,
		cache:              cache,
		cacheTTL:           2 * time.Minute,
	}
}

// AppMetrics App 维度指标
type AppMetrics struct {
	AppID          uuid.UUID  `json:"app_id"`
	WorkflowID     *uuid.UUID `json:"workflow_id,omitempty"`
	Requests       int64      `json:"requests"`
	SuccessfulRuns int64      `json:"successful_runs"`
	FailedRuns     int64      `json:"failed_runs"`
	SuccessRate    float64    `json:"success_rate"`
	AvgDurationMs  int64      `json:"avg_duration_ms"`
	TokensUsed     int64      `json:"tokens_used"`
	LastRunAt      *time.Time `json:"last_run_at,omitempty"`
}

// AppAccessStats App 访问统计概览
type AppAccessStats struct {
	AppID       uuid.UUID  `json:"app_id"`
	WindowDays  int        `json:"window_days"`
	StartAt     *time.Time `json:"start_at,omitempty"`
	EndAt       *time.Time `json:"end_at,omitempty"`
	Accessed    int64      `json:"accessed"`
	Executed    int64      `json:"executed"`
	RateLimited int64      `json:"rate_limited"`
	Total       int64      `json:"total"`
}

// WorkspaceUsage Workspace 用量统计
type WorkspaceUsage struct {
	WorkspaceID uuid.UUID `json:"workspace_id"`
	Requests    int64     `json:"requests"`
	Tokens      int64     `json:"tokens"`
	Storage     float64   `json:"storage"`
	Bandwidth   float64   `json:"bandwidth"`
}

func (s *metricsService) GetAppMetrics(ctx context.Context, userID, appID uuid.UUID) (*AppMetrics, error) {
	app, err := s.appRepo.GetByID(ctx, appID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAppNotFound
		}
		return nil, err
	}

	if err := s.ensureAppMetricsAccess(ctx, userID, app); err != nil {
		return nil, err
	}

	if cached := s.getCachedAppMetrics(ctx, app.ID); cached != nil {
		return cached, nil
	}

	metrics := &AppMetrics{
		AppID: app.ID,
	}

	if app.CurrentVersionID == nil {
		return metrics, nil
	}

	version, err := s.appVersionRepo.GetByID(ctx, *app.CurrentVersionID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAppVersionNotFound
		}
		return nil, err
	}
	if version.WorkflowID == nil {
		return metrics, nil
	}
	metrics.WorkflowID = version.WorkflowID

	workflowID := *version.WorkflowID
	executions, _, err := s.executionRepo.List(ctx, repository.ExecutionListParams{
		WorkflowID: &workflowID,
		Page:       1,
		PageSize:   10000,
	})
	if err != nil {
		return nil, err
	}

	agg := aggregateExecutions(executions)
	metrics.Requests = agg.Requests
	metrics.SuccessfulRuns = agg.SuccessfulRuns
	metrics.FailedRuns = agg.FailedRuns
	metrics.SuccessRate = agg.SuccessRate
	metrics.AvgDurationMs = agg.AvgDurationMs
	metrics.TokensUsed = agg.TokensUsed
	metrics.LastRunAt = agg.LastRunAt

	s.setCachedAppMetrics(ctx, app.ID, metrics)
	return metrics, nil
}

func (s *metricsService) GetAppAccessStats(ctx context.Context, userID, appID uuid.UUID, windowDays int) (*AppAccessStats, error) {
	app, err := s.appRepo.GetByID(ctx, appID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAppNotFound
		}
		return nil, err
	}
	if err := s.ensureAppMetricsAccess(ctx, userID, app); err != nil {
		return nil, err
	}

	if windowDays <= 0 {
		windowDays = 30
	}
	now := time.Now()
	start := now.AddDate(0, 0, -windowDays)

	filter := entity.RuntimeEventFilter{
		AppID:     &app.ID,
		StartTime: &start,
		EndTime:   &now,
		Types: []entity.RuntimeEventType{
			entity.EventAppAccessed,
			entity.EventAppExecuted,
			entity.EventAppRateLimited,
		},
	}
	stats, err := s.runtimeEventRepo.GetStats(ctx, filter)
	if err != nil {
		return nil, err
	}

	result := &AppAccessStats{
		AppID:      app.ID,
		WindowDays: windowDays,
		StartAt:    &start,
		EndAt:      &now,
	}
	if stats != nil {
		result.Total = stats.TotalCount
		if stats.CountByType != nil {
			result.Accessed = stats.CountByType[entity.EventAppAccessed]
			result.Executed = stats.CountByType[entity.EventAppExecuted]
			result.RateLimited = stats.CountByType[entity.EventAppRateLimited]
		}
	}
	return result, nil
}

func (s *metricsService) GetWorkspaceUsage(ctx context.Context, userID, workspaceID uuid.UUID) (*WorkspaceUsage, error) {
	access, err := s.workspaceService.GetWorkspaceAccess(ctx, workspaceID, userID)
	if err != nil {
		return nil, err
	}
	if !hasAnyPermission(access.Permissions, PermissionBillingManage, PermissionAppViewMetrics, PermissionLogsView) {
		return nil, ErrWorkspaceUnauthorized
	}

	if cached := s.getCachedWorkspaceUsage(ctx, workspaceID); cached != nil {
		return cached, nil
	}

	executions, _, err := s.executionRepo.List(ctx, repository.ExecutionListParams{
		WorkspaceID: &workspaceID,
		Page:        1,
		PageSize:    10000,
	})
	if err != nil {
		return nil, err
	}

	agg := aggregateExecutions(executions)
	storageGB := 0.0
	bandwidthGB := 0.0
	if s.workspaceQuotaRepo != nil {
		quota, err := s.workspaceQuotaRepo.GetActiveByWorkspace(ctx, workspaceID, time.Now())
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, err
		}
		if err == nil && quota != nil {
			usage := jsonToFloatMap(quota.Usage)
			storageGB = usage["db_storage_gb"] + usage["storage_gb"]
			bandwidthGB = usage["egress_gb"]
		}
	}
	result := &WorkspaceUsage{
		WorkspaceID: workspaceID,
		Requests:    agg.Requests,
		Tokens:      agg.TokensUsed,
		Storage:     storageGB,
		Bandwidth:   bandwidthGB,
	}
	s.setCachedWorkspaceUsage(ctx, workspaceID, result)
	return result, nil
}

func (s *metricsService) ensureAppMetricsAccess(ctx context.Context, userID uuid.UUID, app *entity.App) error {
	if app == nil {
		return ErrAppNotFound
	}
	access, err := s.workspaceService.GetWorkspaceAccess(ctx, app.WorkspaceID, userID)
	if err != nil {
		if errors.Is(err, ErrWorkspaceNotFound) {
			return ErrAppNotFound
		}
		if errors.Is(err, ErrWorkspaceUnauthorized) {
			return ErrAppUnauthorized
		}
		return err
	}
	if !hasAnyPermission(access.Permissions, PermissionAppViewMetrics, PermissionAppEdit, PermissionAppPublish, PermissionAppsCreate) {
		return ErrAppUnauthorized
	}
	return nil
}

type executionAggregate struct {
	Requests       int64
	SuccessfulRuns int64
	FailedRuns     int64
	SuccessRate    float64
	AvgDurationMs  int64
	TokensUsed     int64
	LastRunAt      *time.Time
}

func aggregateExecutions(executions []entity.Execution) executionAggregate {
	agg := executionAggregate{
		Requests: int64(len(executions)),
	}
	var durationSum int64
	var durationCount int64

	for _, exec := range executions {
		if exec.Status == "completed" {
			agg.SuccessfulRuns++
		} else if exec.Status == "failed" {
			agg.FailedRuns++
		}

		if exec.DurationMs != nil {
			durationSum += int64(*exec.DurationMs)
			durationCount++
		}

		agg.TokensUsed += extractTokenUsage(exec.TokenUsage)

		if exec.StartedAt != nil {
			if agg.LastRunAt == nil || exec.StartedAt.After(*agg.LastRunAt) {
				agg.LastRunAt = exec.StartedAt
			}
		} else if agg.LastRunAt == nil || exec.CreatedAt.After(*agg.LastRunAt) {
			t := exec.CreatedAt
			agg.LastRunAt = &t
		}
	}

	if durationCount > 0 {
		agg.AvgDurationMs = durationSum / durationCount
	}
	if agg.Requests > 0 {
		agg.SuccessRate = float64(agg.SuccessfulRuns) / float64(agg.Requests) * 100
	}

	return agg
}

func extractTokenUsage(tokenUsage entity.JSON) int64 {
	if tokenUsage == nil {
		return 0
	}
	for _, key := range []string{"total_tokens", "tokens", "total"} {
		if raw, ok := tokenUsage[key]; ok {
			return parseTokenValue(raw)
		}
	}
	return 0
}

func parseTokenValue(value interface{}) int64 {
	switch v := value.(type) {
	case float64:
		return int64(v)
	case float32:
		return int64(v)
	case int:
		return int64(v)
	case int64:
		return v
	case int32:
		return int64(v)
	case string:
		parsed, err := strconv.ParseFloat(v, 64)
		if err == nil {
			return int64(parsed)
		}
	}
	return 0
}

func (s *metricsService) getCachedAppMetrics(ctx context.Context, appID uuid.UUID) *AppMetrics {
	if s.cache == nil {
		return nil
	}
	raw, err := s.cache.Get(ctx, appMetricsCacheKey(appID))
	if err != nil || raw == "" {
		return nil
	}
	var metrics AppMetrics
	if err := json.Unmarshal([]byte(raw), &metrics); err != nil {
		return nil
	}
	return &metrics
}

func (s *metricsService) setCachedAppMetrics(ctx context.Context, appID uuid.UUID, metrics *AppMetrics) {
	if s.cache == nil || metrics == nil {
		return
	}
	payload, err := json.Marshal(metrics)
	if err != nil {
		return
	}
	_ = s.cache.Set(ctx, appMetricsCacheKey(appID), payload, s.cacheTTL)
}

func (s *metricsService) getCachedWorkspaceUsage(ctx context.Context, workspaceID uuid.UUID) *WorkspaceUsage {
	if s.cache == nil {
		return nil
	}
	raw, err := s.cache.Get(ctx, workspaceUsageCacheKey(workspaceID))
	if err != nil || raw == "" {
		return nil
	}
	var usage WorkspaceUsage
	if err := json.Unmarshal([]byte(raw), &usage); err != nil {
		return nil
	}
	return &usage
}

func (s *metricsService) setCachedWorkspaceUsage(ctx context.Context, workspaceID uuid.UUID, usage *WorkspaceUsage) {
	if s.cache == nil || usage == nil {
		return
	}
	payload, err := json.Marshal(usage)
	if err != nil {
		return
	}
	_ = s.cache.Set(ctx, workspaceUsageCacheKey(workspaceID), payload, s.cacheTTL)
}

func appMetricsCacheKey(appID uuid.UUID) string {
	return "metrics:app:" + appID.String()
}

func workspaceUsageCacheKey(workspaceID uuid.UUID) string {
	return "metrics:workspace:" + workspaceID.String() + ":usage"
}
