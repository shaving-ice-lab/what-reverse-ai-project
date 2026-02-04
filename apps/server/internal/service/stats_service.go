package service

import (
	"context"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
)

// StatsService 统计服务接口
type StatsService interface {
	GetOverview(ctx context.Context, userID uuid.UUID) (*OverviewStats, error)
	GetExecutionTrends(ctx context.Context, userID uuid.UUID, days int) ([]DailyStats, error)
	GetWorkflowStats(ctx context.Context, workflowID, userID uuid.UUID) (*WorkflowStats, error)
	GetWorkflowAnalytics(ctx context.Context, userID uuid.UUID) (*WorkflowAnalytics, error)
}

// OverviewStats 总览统计
type OverviewStats struct {
	TotalWorkflows    int64   `json:"total_workflows"`
	ActiveWorkflows   int64   `json:"active_workflows"`
	TotalExecutions   int64   `json:"total_executions"`
	SuccessfulRuns    int64   `json:"successful_runs"`
	FailedRuns        int64   `json:"failed_runs"`
	SuccessRate       float64 `json:"success_rate"`
	TotalTokensUsed   int64   `json:"total_tokens_used"`
	AvgResponseTimeMs int64   `json:"avg_response_time_ms"`
	RunsToday         int64   `json:"runs_today"`
	RunsThisWeek      int64   `json:"runs_this_week"`
	RunsThisMonth     int64   `json:"runs_this_month"`
}

// DailyStats 每日统计
type DailyStats struct {
	Date           string `json:"date"`
	Executions     int64  `json:"executions"`
	SuccessfulRuns int64  `json:"successful_runs"`
	FailedRuns     int64  `json:"failed_runs"`
	AvgDurationMs  int64  `json:"avg_duration_ms"`
	TokensUsed     int64  `json:"tokens_used"`
}

// WorkflowStats 工作流统计
type WorkflowStats struct {
	WorkflowID     uuid.UUID    `json:"workflow_id"`
	WorkflowName   string       `json:"workflow_name"`
	TotalRuns      int64        `json:"total_runs"`
	SuccessfulRuns int64        `json:"successful_runs"`
	FailedRuns     int64        `json:"failed_runs"`
	SuccessRate    float64      `json:"success_rate"`
	AvgDurationMs  int64        `json:"avg_duration_ms"`
	LastRunAt      *time.Time   `json:"last_run_at"`
	RecentTrends   []DailyStats `json:"recent_trends"`
	TopErrors      []ErrorStats `json:"top_errors"`
}

// ErrorStats 错误统计
type ErrorStats struct {
	ErrorMessage string `json:"error_message"`
	Count        int64  `json:"count"`
	LastOccurred string `json:"last_occurred"`
}

// WorkflowAnalytics 工作流分析
type WorkflowAnalytics struct {
	StatusDistribution   []DistributionItem `json:"status_distribution"`
	NodeTypeDistribution []DistributionItem `json:"node_type_distribution"`
}

// DistributionItem 分布项
type DistributionItem struct {
	Label string `json:"label"`
	Value int64  `json:"value"`
	Color string `json:"color"`
	Icon  string `json:"icon,omitempty"`
}

type statsService struct {
	executionRepo repository.ExecutionRepository
	workflowRepo  repository.WorkflowRepository
}

// NewStatsService 创建统计服务实例
func NewStatsService(
	executionRepo repository.ExecutionRepository,
	workflowRepo repository.WorkflowRepository,
) StatsService {
	return &statsService{
		executionRepo: executionRepo,
		workflowRepo:  workflowRepo,
	}
}

func (s *statsService) GetOverview(ctx context.Context, userID uuid.UUID) (*OverviewStats, error) {
	// 获取工作流统计
	workflows, total, err := s.workflowRepo.List(ctx, userID, repository.ListParams{
		Page:     1,
		PageSize: 1000,
	})
	if err != nil {
		return nil, err
	}

	activeCount := int64(0)
	for _, w := range workflows {
		if w.Status == "active" || w.Status == "published" {
			activeCount++
		}
	}

	// 获取执行统计
	now := time.Now()
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	weekStart := todayStart.AddDate(0, 0, -int(now.Weekday()))
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())

	executions, totalExecs, err := s.executionRepo.List(ctx, repository.ExecutionListParams{
		UserID:   &userID,
		Page:     1,
		PageSize: 10000,
	})
	if err != nil {
		return nil, err
	}

	var (
		successCount  int64
		failedCount   int64
		totalDuration int64
		totalTokens   int64
		runsToday     int64
		runsThisWeek  int64
		runsThisMonth int64
		durationCount int64
	)

	for _, exec := range executions {
		if exec.Status == "completed" {
			successCount++
		} else if exec.Status == "failed" {
			failedCount++
		}

		if exec.DurationMs != nil {
			totalDuration += int64(*exec.DurationMs)
			durationCount++
		}

		if exec.TokenUsage != nil {
			if tokens, ok := exec.TokenUsage["total_tokens"].(float64); ok {
				totalTokens += int64(tokens)
			}
		}

		if exec.StartedAt != nil {
			if exec.StartedAt.After(todayStart) {
				runsToday++
			}
			if exec.StartedAt.After(weekStart) {
				runsThisWeek++
			}
			if exec.StartedAt.After(monthStart) {
				runsThisMonth++
			}
		}
	}

	avgDuration := int64(0)
	if durationCount > 0 {
		avgDuration = totalDuration / durationCount
	}

	successRate := float64(0)
	if totalExecs > 0 {
		successRate = float64(successCount) / float64(totalExecs) * 100
	}

	return &OverviewStats{
		TotalWorkflows:    total,
		ActiveWorkflows:   activeCount,
		TotalExecutions:   totalExecs,
		SuccessfulRuns:    successCount,
		FailedRuns:        failedCount,
		SuccessRate:       successRate,
		TotalTokensUsed:   totalTokens,
		AvgResponseTimeMs: avgDuration,
		RunsToday:         runsToday,
		RunsThisWeek:      runsThisWeek,
		RunsThisMonth:     runsThisMonth,
	}, nil
}

func (s *statsService) GetExecutionTrends(ctx context.Context, userID uuid.UUID, days int) ([]DailyStats, error) {
	if days <= 0 {
		days = 7
	}
	if days > 90 {
		days = 90
	}

	now := time.Now()
	startDate := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location()).AddDate(0, 0, -days+1)

	executions, _, err := s.executionRepo.List(ctx, repository.ExecutionListParams{
		UserID:   &userID,
		Page:     1,
		PageSize: 10000,
	})
	if err != nil {
		return nil, err
	}

	// 过滤出指定时间范围内的执行记录
	filteredExecutions := make([]entity.Execution, 0)
	for _, exec := range executions {
		if exec.StartedAt != nil && exec.StartedAt.After(startDate) {
			filteredExecutions = append(filteredExecutions, exec)
		}
	}
	executions = filteredExecutions

	// 按日期分组
	dailyMap := make(map[string]*DailyStats)
	for i := 0; i < days; i++ {
		date := startDate.AddDate(0, 0, i).Format("2006-01-02")
		dailyMap[date] = &DailyStats{Date: date}
	}

	for _, exec := range executions {
		if exec.StartedAt == nil {
			continue
		}
		date := exec.StartedAt.Format("2006-01-02")
		stats, ok := dailyMap[date]
		if !ok {
			continue
		}

		stats.Executions++
		if exec.Status == "completed" {
			stats.SuccessfulRuns++
		} else if exec.Status == "failed" {
			stats.FailedRuns++
		}

		if exec.DurationMs != nil {
			stats.AvgDurationMs += int64(*exec.DurationMs)
		}

		if exec.TokenUsage != nil {
			if tokens, ok := exec.TokenUsage["total_tokens"].(float64); ok {
				stats.TokensUsed += int64(tokens)
			}
		}
	}

	// 计算平均值并转换为切片
	result := make([]DailyStats, 0, days)
	for i := 0; i < days; i++ {
		date := startDate.AddDate(0, 0, i).Format("2006-01-02")
		stats := dailyMap[date]
		if stats.Executions > 0 && stats.AvgDurationMs > 0 {
			stats.AvgDurationMs = stats.AvgDurationMs / stats.Executions
		}
		result = append(result, *stats)
	}

	return result, nil
}

func (s *statsService) GetWorkflowStats(ctx context.Context, workflowID, userID uuid.UUID) (*WorkflowStats, error) {
	// 获取工作流信息
	workflow, err := s.workflowRepo.GetByID(ctx, workflowID)
	if err != nil {
		return nil, ErrWorkflowNotFound
	}

	// 检查权限
	if workflow.UserID != userID {
		return nil, ErrUnauthorized
	}

	// 获取该工作流的执行记录
	executions, totalRuns, err := s.executionRepo.List(ctx, repository.ExecutionListParams{
		WorkflowID: &workflowID,
		Page:       1,
		PageSize:   10000,
	})
	if err != nil {
		return nil, err
	}

	var (
		successCount  int64
		failedCount   int64
		totalDuration int64
		durationCount int64
		lastRunAt     *time.Time
		errorMap      = make(map[string]*ErrorStats)
	)

	for _, exec := range executions {
		if exec.Status == "completed" {
			successCount++
		} else if exec.Status == "failed" {
			failedCount++
			if exec.ErrorMessage != nil && *exec.ErrorMessage != "" {
				if es, ok := errorMap[*exec.ErrorMessage]; ok {
					es.Count++
					if exec.CompletedAt != nil {
						es.LastOccurred = exec.CompletedAt.Format(time.RFC3339)
					}
				} else {
					lastOccurred := ""
					if exec.CompletedAt != nil {
						lastOccurred = exec.CompletedAt.Format(time.RFC3339)
					}
					errorMap[*exec.ErrorMessage] = &ErrorStats{
						ErrorMessage: *exec.ErrorMessage,
						Count:        1,
						LastOccurred: lastOccurred,
					}
				}
			}
		}

		if exec.DurationMs != nil {
			totalDuration += int64(*exec.DurationMs)
			durationCount++
		}

		if exec.StartedAt != nil {
			if lastRunAt == nil || exec.StartedAt.After(*lastRunAt) {
				lastRunAt = exec.StartedAt
			}
		}
	}

	avgDuration := int64(0)
	if durationCount > 0 {
		avgDuration = totalDuration / durationCount
	}

	successRate := float64(0)
	if totalRuns > 0 {
		successRate = float64(successCount) / float64(totalRuns) * 100
	}

	// 获取最近7天趋势
	trends, _ := s.GetExecutionTrends(ctx, userID, 7)

	// 转换错误统计为切片
	topErrors := make([]ErrorStats, 0)
	for _, es := range errorMap {
		topErrors = append(topErrors, *es)
	}

	return &WorkflowStats{
		WorkflowID:     workflowID,
		WorkflowName:   workflow.Name,
		TotalRuns:      totalRuns,
		SuccessfulRuns: successCount,
		FailedRuns:     failedCount,
		SuccessRate:    successRate,
		AvgDurationMs:  avgDuration,
		LastRunAt:      lastRunAt,
		RecentTrends:   trends,
		TopErrors:      topErrors,
	}, nil
}

func (s *statsService) GetWorkflowAnalytics(ctx context.Context, userID uuid.UUID) (*WorkflowAnalytics, error) {
	// 获取执行统计按状态分布
	executions, _, err := s.executionRepo.List(ctx, repository.ExecutionListParams{
		UserID:   &userID,
		Page:     1,
		PageSize: 10000,
	})
	if err != nil {
		return nil, err
	}

	// 统计状态分布
	statusMap := map[string]int64{
		"running":   0,
		"completed": 0,
		"failed":    0,
		"pending":   0,
	}

	// 统计节点类型分布 (从执行记录的元数据中获取)
	nodeTypeMap := map[string]int64{
		"llm":        0,
		"http":       0,
		"condition":  0,
		"transform":  0,
		"code":       0,
		"db_select":  0,
		"db_insert":  0,
		"db_update":  0,
		"db_delete":  0,
		"db_migrate": 0,
		"other":      0,
	}

	for _, exec := range executions {
		if count, ok := statusMap[exec.Status]; ok {
			statusMap[exec.Status] = count + 1
		} else {
			statusMap["pending"]++
		}

		// 从 context 中提取节点类型统计
		if exec.Context != nil {
			if nodeStats, ok := exec.Context["node_stats"].(map[string]interface{}); ok {
				for nodeType, count := range nodeStats {
					if c, ok := count.(float64); ok {
						if _, exists := nodeTypeMap[nodeType]; exists {
							nodeTypeMap[nodeType] += int64(c)
						} else {
							nodeTypeMap["other"] += int64(c)
						}
					}
				}
			}
		}
	}

	// 转换为响应格式
	statusDistribution := []DistributionItem{
		{Label: "运行中", Value: statusMap["running"], Color: "#3B82F6", Icon: "🔄"},
		{Label: "已完成", Value: statusMap["completed"], Color: "#3ECF8E", Icon: "✅"},
		{Label: "失败", Value: statusMap["failed"], Color: "#EF4444", Icon: "❌"},
		{Label: "待执行", Value: statusMap["pending"], Color: "#F59E0B", Icon: "⏳"},
	}

	dbTotal := nodeTypeMap["db_select"] + nodeTypeMap["db_insert"] + nodeTypeMap["db_update"] + nodeTypeMap["db_delete"] + nodeTypeMap["db_migrate"]

	nodeTypeDistribution := []DistributionItem{
		{Label: "LLM 节点", Value: nodeTypeMap["llm"], Color: "#8B5CF6", Icon: "🤖"},
		{Label: "HTTP 请求", Value: nodeTypeMap["http"], Color: "#3B82F6", Icon: "🌐"},
		{Label: "条件分支", Value: nodeTypeMap["condition"], Color: "#10B981", Icon: "🔀"},
		{Label: "数据转换", Value: nodeTypeMap["transform"], Color: "#F59E0B", Icon: "🔄"},
		{Label: "数据库操作", Value: dbTotal, Color: "#0EA5E9", Icon: "🗄️"},
		{Label: "代码执行", Value: nodeTypeMap["code"], Color: "#EC4899", Icon: "💻"},
		{Label: "其他", Value: nodeTypeMap["other"], Color: "#6B7280", Icon: "📦"},
	}

	return &WorkflowAnalytics{
		StatusDistribution:   statusDistribution,
		NodeTypeDistribution: nodeTypeDistribution,
	}, nil
}
