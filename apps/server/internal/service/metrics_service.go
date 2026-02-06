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
// Workspace 现在就是 App，所有指标都基于 Workspace
type MetricsService interface {
	GetWorkspaceMetrics(ctx context.Context, userID, workspaceID uuid.UUID) (*WorkspaceMetrics, error)
	GetWorkspaceAccessStats(ctx context.Context, userID, workspaceID uuid.UUID, windowDays int) (*WorkspaceAccessStats, error)
	GetWorkspaceUsage(ctx context.Context, userID, workspaceID uuid.UUID) (*WorkspaceUsage, error)
}

type metricsService struct {
	workspaceRepo      repository.WorkspaceRepository
	executionRepo      repository.ExecutionRepository
	runtimeEventRepo   repository.RuntimeEventRepository
	workspaceService   WorkspaceService
	workspaceQuotaRepo repository.WorkspaceQuotaRepository
	cache              *redis.Client
	cacheTTL           time.Duration
}

// NewMetricsService 创建指标服务实例
func NewMetricsService(
	workspaceRepo repository.WorkspaceRepository,
	executionRepo repository.ExecutionRepository,
	runtimeEventRepo repository.RuntimeEventRepository,
	workspaceService WorkspaceService,
	workspaceQuotaRepo repository.WorkspaceQuotaRepository,
	cache *redis.Client,
) MetricsService {
	return &metricsService{
		workspaceRepo:      workspaceRepo,
		executionRepo:      executionRepo,
		runtimeEventRepo:   runtimeEventRepo,
		workspaceService:   workspaceService,
		workspaceQuotaRepo: workspaceQuotaRepo,
		cache:              cache,
		cacheTTL:           2 * time.Minute,
	}
}

// WorkspaceMetrics Workspace 维度指标（原 AppMetrics）
type WorkspaceMetrics struct {
	WorkspaceID    uuid.UUID  `json:"workspace_id"`
	WorkflowID     *uuid.UUID `json:"workflow_id,omitempty"`
	Requests       int64      `json:"requests"`
	SuccessfulRuns int64      `json:"successful_runs"`
	FailedRuns     int64      `json:"failed_runs"`
	SuccessRate    float64    `json:"success_rate"`
	AvgDurationMs  int64      `json:"avg_duration_ms"`
	TokensUsed     int64      `json:"tokens_used"`
	LastRunAt      *time.Time `json:"last_run_at,omitempty"`
}

// WorkspaceAccessStats Workspace 访问统计概览（原 AppAccessStats）
type WorkspaceAccessStats struct {
	WorkspaceID uuid.UUID  `json:"workspace_id"`
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

func (s *metricsService) GetWorkspaceMetrics(ctx context.Context, userID, workspaceID uuid.UUID) (*WorkspaceMetrics, error) {
	workspace, err := s.workspaceRepo.GetByID(ctx, workspaceID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrWorkspaceNotFound
		}
		return nil, err
	}

	if err := s.ensureWorkspaceMetricsAccess(ctx, userID, workspace); err != nil {
		return nil, err
	}

	if cached := s.getCachedWorkspaceMetrics(ctx, workspace.ID); cached != nil {
		return cached, nil
	}

	metrics := &WorkspaceMetrics{
		WorkspaceID: workspace.ID,
	}

	if workspace.CurrentVersionID == nil {
		return metrics, nil
	}

	version, err := s.workspaceRepo.GetVersionByID(ctx, *workspace.CurrentVersionID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrWorkspaceVersionNotFound
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

	s.setCachedWorkspaceMetrics(ctx, workspace.ID, metrics)
	return metrics, nil
}

func (s *metricsService) GetWorkspaceAccessStats(ctx context.Context, userID, workspaceID uuid.UUID, windowDays int) (*WorkspaceAccessStats, error) {
	workspace, err := s.workspaceRepo.GetByID(ctx, workspaceID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrWorkspaceNotFound
		}
		return nil, err
	}
	if err := s.ensureWorkspaceMetricsAccess(ctx, userID, workspace); err != nil {
		return nil, err
	}

	if windowDays <= 0 {
		windowDays = 30
	}
	now := time.Now()
	start := now.AddDate(0, 0, -windowDays)

	filter := entity.RuntimeEventFilter{
		WorkspaceID: &workspace.ID,
		StartTime:   &start,
		EndTime:     &now,
		Types: []entity.RuntimeEventType{
			entity.EventWorkspaceAccessed,
			entity.EventWorkspaceExecuted,
			entity.EventWorkspaceRateLimited,
		},
	}
	stats, err := s.runtimeEventRepo.GetStats(ctx, filter)
	if err != nil {
		return nil, err
	}

	result := &WorkspaceAccessStats{
		WorkspaceID: workspace.ID,
		WindowDays:  windowDays,
		StartAt:     &start,
		EndAt:       &now,
	}
	if stats != nil {
		result.Total = stats.TotalCount
		if stats.CountByType != nil {
			result.Accessed = stats.CountByType[entity.EventWorkspaceAccessed]
			result.Executed = stats.CountByType[entity.EventWorkspaceExecuted]
			result.RateLimited = stats.CountByType[entity.EventWorkspaceRateLimited]
		}
	}
	return result, nil
}

func (s *metricsService) GetWorkspaceUsage(ctx context.Context, userID, workspaceID uuid.UUID) (*WorkspaceUsage, error) {
	access, err := s.workspaceService.GetWorkspaceAccess(ctx, workspaceID, userID)
	if err != nil {
		return nil, err
	}
	if !hasAnyPermission(access.Permissions, PermissionBillingManage, PermissionWorkspaceViewMetrics, PermissionLogsView) {
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

func (s *metricsService) ensureWorkspaceMetricsAccess(ctx context.Context, userID uuid.UUID, workspace *entity.Workspace) error {
	if workspace == nil {
		return ErrWorkspaceNotFound
	}
	access, err := s.workspaceService.GetWorkspaceAccess(ctx, workspace.ID, userID)
	if err != nil {
		return err
	}
	if !hasAnyPermission(access.Permissions, PermissionWorkspaceViewMetrics, PermissionWorkspaceEdit, PermissionWorkspacePublish, PermissionWorkspaceCreate) {
		return ErrWorkspaceUnauthorized
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

func (s *metricsService) getCachedWorkspaceMetrics(ctx context.Context, workspaceID uuid.UUID) *WorkspaceMetrics {
	if s.cache == nil {
		return nil
	}
	raw, err := s.cache.Get(ctx, workspaceMetricsCacheKey(workspaceID))
	if err != nil || raw == "" {
		return nil
	}
	var metrics WorkspaceMetrics
	if err := json.Unmarshal([]byte(raw), &metrics); err != nil {
		return nil
	}
	return &metrics
}

func (s *metricsService) setCachedWorkspaceMetrics(ctx context.Context, workspaceID uuid.UUID, metrics *WorkspaceMetrics) {
	if s.cache == nil || metrics == nil {
		return
	}
	payload, err := json.Marshal(metrics)
	if err != nil {
		return
	}
	_ = s.cache.Set(ctx, workspaceMetricsCacheKey(workspaceID), payload, s.cacheTTL)
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

func workspaceMetricsCacheKey(workspaceID uuid.UUID) string {
	return "metrics:workspace:" + workspaceID.String()
}

func workspaceUsageCacheKey(workspaceID uuid.UUID) string {
	return "metrics:workspace:" + workspaceID.String() + ":usage"
}

// 错误定义
var (
	ErrWorkspaceVersionNotFound = errors.New("workspace version not found")
)
