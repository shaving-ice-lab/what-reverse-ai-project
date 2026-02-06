package service

import (
	"context"
	"errors"
	"fmt"
	"math"

	"github.com/agentflow/server/internal/config"
)

// CapacityBaseline 容量与资源基线配置
type CapacityBaseline struct {
	ExecutionMaxConcurrent    int            `json:"execution_max_concurrent"`
	ExecutionMaxInFlight      int            `json:"execution_max_in_flight"`
	WorkerConcurrency         int            `json:"worker_concurrency"`
	QueueWeights              map[string]int `json:"queue_weights"`
	DatabaseMaxOpenConns      int            `json:"database_max_open_conns"`
	DatabaseMaxIdleConns      int            `json:"database_max_idle_conns"`
	WorkspaceDBMaxOpenConns   int            `json:"workspace_db_max_open_conns"`
	WorkspaceDBMaxIdleConns   int            `json:"workspace_db_max_idle_conns"`
	WorkspaceDBConnMaxIdleAge string         `json:"workspace_db_conn_max_idle_time"`
}

// CapacityThreshold 容量阈值定义
type CapacityThreshold struct {
	Metric   string `json:"metric"`
	Warning  string `json:"warning"`
	Critical string `json:"critical"`
	Action   string `json:"action,omitempty"`
}

// CapacityForecastModel 容量预测模型
type CapacityForecastModel struct {
	Key        string              `json:"key"`
	Title      string              `json:"title"`
	Summary    string              `json:"summary"`
	Inputs     []string            `json:"inputs"`
	Formula    string              `json:"formula"`
	Example    string              `json:"example"`
	Thresholds []CapacityThreshold `json:"thresholds,omitempty"`
	Notes      []string            `json:"notes,omitempty"`
}

// AutoscalingRule 自动扩缩容策略
type AutoscalingRule struct {
	Key      string   `json:"key"`
	Title    string   `json:"title"`
	Target   string   `json:"target"`
	Triggers []string `json:"triggers"`
	ScaleOut string   `json:"scale_out"`
	ScaleIn  string   `json:"scale_in"`
	Cooldown string   `json:"cooldown"`
	Notes    []string `json:"notes,omitempty"`
}

// PeakProtectionRule 峰值保护与排队策略
type PeakProtectionRule struct {
	Key      string   `json:"key"`
	Title    string   `json:"title"`
	Triggers []string `json:"triggers"`
	Actions  []string `json:"actions"`
	Recovery []string `json:"recovery,omitempty"`
	Notes    []string `json:"notes,omitempty"`
}

// CostOptimizationMeasure 成本优化措施
type CostOptimizationMeasure struct {
	Key         string   `json:"key"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Actions     []string `json:"actions,omitempty"`
	References  []string `json:"references,omitempty"`
	Notes       []string `json:"notes,omitempty"`
}

// NoisyNeighborIsolationRule 噪声邻居隔离策略
type NoisyNeighborIsolationRule struct {
	Key         string   `json:"key"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Signals     []string `json:"signals,omitempty"`
	Actions     []string `json:"actions"`
	Notes       []string `json:"notes,omitempty"`
}

// CapacityCostPlan 容量规划与成本优化方案
type CapacityCostPlan struct {
	Key                    string                       `json:"key"`
	Title                  string                       `json:"title"`
	Summary                string                       `json:"summary"`
	Baseline               CapacityBaseline             `json:"baseline"`
	ForecastModels         []CapacityForecastModel      `json:"forecast_models"`
	Autoscaling            []AutoscalingRule            `json:"autoscaling"`
	PeakProtection         []PeakProtectionRule         `json:"peak_protection"`
	CostOptimizations      []CostOptimizationMeasure    `json:"cost_optimizations"`
	NoisyNeighborIsolation []NoisyNeighborIsolationRule `json:"noisy_neighbor_isolation"`
	Notes                  []string                     `json:"notes,omitempty"`
}

// PlanCapacityCostService 容量规划与成本优化规划服务接口
type PlanCapacityCostService interface {
	GetPlan(ctx context.Context) (*CapacityCostPlan, error)
}

type planCapacityCostService struct {
	plan CapacityCostPlan
}

// ErrCapacityCostPlanNotFound 容量规划不存在
var ErrCapacityCostPlanNotFound = errors.New("capacity cost plan not found")

// NewPlanCapacityCostService 创建容量规划与成本优化服务
func NewPlanCapacityCostService(execution config.ExecutionConfig, queue config.QueueConfig, database config.DatabaseConfig) PlanCapacityCostService {
	return &planCapacityCostService{
		plan: defaultCapacityCostPlan(execution, queue, database),
	}
}

func (s *planCapacityCostService) GetPlan(ctx context.Context) (*CapacityCostPlan, error) {
	if s == nil || s.plan.Key == "" {
		return nil, ErrCapacityCostPlanNotFound
	}
	output := s.plan
	return &output, nil
}

func defaultCapacityCostPlan(execution config.ExecutionConfig, queue config.QueueConfig, database config.DatabaseConfig) CapacityCostPlan {
	maxConcurrent := normalizePositiveInt(execution.MaxConcurrent, 10)
	maxInFlight := normalizePositiveInt(execution.MaxInFlight, maxConcurrent*10)
	workerConcurrency := normalizePositiveInt(queue.WorkerConcurrency, maxConcurrent)
	dbMaxOpen := normalizePositiveInt(database.MaxOpenConns, 100)
	dbMaxIdle := normalizePositiveInt(database.MaxIdleConns, 10)
	workspaceMaxOpen := normalizePositiveInt(database.WorkspaceMaxOpenConns, 10)
	workspaceMaxIdle := normalizePositiveInt(database.WorkspaceMaxIdleConns, 5)

	baseConcurrency := minPositiveInt(maxConcurrent, workerConcurrency)
	if baseConcurrency <= 0 {
		baseConcurrency = maxConcurrent
	}

	queueWeights := copyQueueWeights(queue.Queues)
	if len(queueWeights) == 0 {
		queueWeights = map[string]int{
			"workflow":  6,
			"webhook":   3,
			"scheduled": 1,
		}
	}

	warnInFlight := ceilPercent(maxInFlight, 0.7)
	criticalInFlight := ceilPercent(maxInFlight, 0.9)
	warnDB := ceilPercent(dbMaxOpen, 0.7)
	criticalDB := ceilPercent(dbMaxOpen, 0.9)
	warnQueueDepth := workerConcurrency * 5
	criticalQueueDepth := workerConcurrency * 10

	exampleRPS := estimateSafeRPS(baseConcurrency, 2.0, 0.7)
	example := fmt.Sprintf("base_concurrency=%d, p95=2s, utilization=0.7 => safe_rps≈%.1f", baseConcurrency, exampleRPS)

	return CapacityCostPlan{
		Key:     "capacity_cost_plan",
		Title:   "容量规划与成本优化",
		Summary: "基于执行/队列/数据库配置与指标，给出容量预测、扩缩容、峰值保护、成本优化与噪声隔离策略。",
		Baseline: CapacityBaseline{
			ExecutionMaxConcurrent:    maxConcurrent,
			ExecutionMaxInFlight:      maxInFlight,
			WorkerConcurrency:         workerConcurrency,
			QueueWeights:              queueWeights,
			DatabaseMaxOpenConns:      dbMaxOpen,
			DatabaseMaxIdleConns:      dbMaxIdle,
			WorkspaceDBMaxOpenConns:   workspaceMaxOpen,
			WorkspaceDBMaxIdleConns:   workspaceMaxIdle,
			WorkspaceDBConnMaxIdleAge: database.WorkspaceConnMaxIdleTime.String(),
		},
		ForecastModels: []CapacityForecastModel{
			{
				Key:     "execution_throughput",
				Title:   "执行吞吐预测模型",
				Summary: "用执行 P95 耗时与并发上限估算安全吞吐量。",
				Inputs: []string{
					"execution.max_concurrent",
					"execution.max_in_flight",
					"queue.worker_concurrency",
					"agentflow_execution_duration_seconds{status=\"completed\"} P95",
				},
				Formula: "safe_rps = min(max_concurrent, worker_concurrency) / p95_execution_seconds * utilization_target",
				Example: example,
				Thresholds: []CapacityThreshold{
					{
						Metric:   "agentflow_execution_in_progress",
						Warning:  fmt.Sprintf(">=%d", warnInFlight),
						Critical: fmt.Sprintf(">=%d", criticalInFlight),
						Action:   "触发扩容 + 启用降级或排队策略",
					},
					{
						Metric:   "agentflow_runtime_request_duration_seconds P95",
						Warning:  ">=2s",
						Critical: ">=5s",
						Action:   "增加实例/降级非核心功能",
					},
				},
				Notes: []string{
					"utilization_target 建议 0.6~0.75，避免过度逼近极限。",
					"可按 workspace 维度拆分估算。",
				},
			},
			{
				Key:     "database_connections",
				Title:   "数据库连接容量模型",
				Summary: "根据连接上限与活跃连接数判断容量余量。",
				Inputs: []string{
					"database.max_open_conns",
					"workspace_db_max_open_conns",
					"agentflow_db_connections_active",
				},
				Formula: "connection_headroom = max_open_conns - active_connections",
				Example: fmt.Sprintf("max_open_conns=%d => warning>%d, critical>%d", dbMaxOpen, warnDB, criticalDB),
				Thresholds: []CapacityThreshold{
					{
						Metric:   "agentflow_db_connections_active",
						Warning:  fmt.Sprintf(">=%d", warnDB),
						Critical: fmt.Sprintf(">=%d", criticalDB),
						Action:   "限制高并发写入 + 扩展连接池/副本",
					},
				},
				Notes: []string{
					"Workspace DB 建议单租户连接上限独立控制。",
				},
			},
		},
		Autoscaling: []AutoscalingRule{
			{
				Key:    "runtime_api",
				Title:  "Runtime API 扩缩容",
				Target: "server/runtime 实例",
				Triggers: []string{
					fmt.Sprintf("agentflow_http_requests_in_flight >= %d", warnInFlight),
					"agentflow_runtime_request_duration_seconds P95 >= 2s",
				},
				ScaleOut: "每 5 分钟增加 20% 实例或 +1 副本",
				ScaleIn:  "持续 10 分钟低于 30% in-flight 则缩容",
				Cooldown: "5m",
				Notes: []string{
					"扩容后同步检查错误率与执行成功率。",
				},
			},
			{
				Key:    "worker_queue",
				Title:  "Worker/Queue 扩缩容",
				Target: "asynq worker 实例",
				Triggers: []string{
					fmt.Sprintf("queue_depth >= %d", warnQueueDepth),
					"workflow queue backlog 持续增长",
				},
				ScaleOut: "每新增 50 backlog 增加 1 worker 或提升并发",
				ScaleIn:  "backlog < worker_concurrency 持续 15 分钟后缩容",
				Cooldown: "10m",
				Notes: []string{
					"结合 queue.queues 权重保障 webhook/scheduled 任务。",
				},
			},
			{
				Key:    "database_pool",
				Title:  "数据库连接池与副本扩展",
				Target: "数据库连接池/只读副本",
				Triggers: []string{
					fmt.Sprintf("agentflow_db_connections_active >= %d", warnDB),
					"agentflow_db_query_duration_seconds P95 >= 200ms",
				},
				ScaleOut: "提升 max_open_conns 或新增只读副本",
				ScaleIn:  "稳定低负载后逐步回收连接池",
				Cooldown: "15m",
			},
		},
		PeakProtection: []PeakProtectionRule{
			{
				Key:   "execution_load_shedding",
				Title: "执行并发保护",
				Triggers: []string{
					fmt.Sprintf("in_flight >= %d", maxInFlight),
					"执行失败率上升",
				},
				Actions: []string{
					"ExecutionService 按 max_in_flight 返回 OVERLOADED",
					"对高成本节点增加超时与重试上限",
				},
				Recovery: []string{
					"扩容后逐步提升 max_in_flight",
				},
			},
			{
				Key:   "rate_limit",
				Title: "运行时限流与排队",
				Triggers: []string{
					"per_workspace/per_ip/per_session 超出 rate_limit_json",
					"runtime_rate_limited 事件激增",
				},
				Actions: []string{
					"返回 429 + retry_after_seconds",
					"封禁高频 session 并记录 runtime_event",
				},
				Recovery: []string{
					"降低限流强度或启用灰度白名单",
				},
			},
			{
				Key:   "queue_backpressure",
				Title: "队列积压保护",
				Triggers: []string{
					fmt.Sprintf("queue_depth >= %d", criticalQueueDepth),
					"任务处理延迟持续上升",
				},
				Actions: []string{
					"触发降级或延迟入队",
					"切换到低优先级队列",
				},
			},
		},
		CostOptimizations: []CostOptimizationMeasure{
			{
				Key:         "cost_visibility",
				Title:       "成本可视化与预测",
				Description: "使用成本模型与用量事件进行成本拆解。",
				Actions: []string{
					"GET /api/v1/billing/workspaces/:id/cost-model",
					"GET /api/v1/billing/workspaces/:id/cost-summary",
					"POST /api/v1/billing/workspaces/:id/estimate",
				},
			},
			{
				Key:         "budget_guardrails",
				Title:       "预算与配额约束",
				Description: "通过预算设置和配额策略避免失控成本。",
				Actions: []string{
					"GET/PATCH /api/v1/billing/workspaces/:id/budget",
					"按 quota 触发降级或拒绝",
				},
			},
			{
				Key:         "retention_archive",
				Title:       "日志保留与归档优化",
				Description: "缩短高成本日志保留周期，使用冷存归档降低存储成本。",
				References: []string{
					"retention.* 配置",
					"archive.* 配置",
				},
			},
			{
				Key:         "off_peak_scale_down",
				Title:       "闲时回收与弹性伸缩",
				Description: "根据时段或负载自动缩容 worker 与 API 实例。",
				Actions: []string{
					"低峰时段降低 worker_concurrency",
					"结合 autoscaling cooldown 逐步回收",
				},
			},
		},
		NoisyNeighborIsolation: []NoisyNeighborIsolationRule{
			{
				Key:         "per_workspace_rate_limit",
				Title:       "按 Workspace/Session/IP 限流",
				Description: "使用 rate_limit_json 控制单一租户或来源的负载。",
				Signals: []string{
					"runtime_rate_limited",
					"agentflow_runtime_requests_total",
				},
				Actions: []string{
					"设置 per_workspace/per_ip/per_session 限流窗口",
					"封禁高频 session 并告警",
				},
			},
			{
				Key:         "workspace_quota",
				Title:       "Workspace 配额隔离",
				Description: "用量配额与预算限制防止单租户耗尽资源。",
				Signals: []string{
					"billing usage/quota",
				},
				Actions: []string{
					"超额触发限流或降级",
					"通知 workspace 管理员",
				},
			},
			{
				Key:         "queue_weighting",
				Title:       "队列权重与隔离",
				Description: "通过队列权重保障 webhook/scheduled 任务不被挤压。",
				Actions: []string{
					"配置 queue.queues 权重",
					"高优先级队列单独扩容",
				},
			},
		},
		Notes: []string{
			"容量预测默认使用 P95 耗时；关键路径可升级为 P99。",
			"扩缩容与峰值保护需配合告警与事件复盘。",
		},
	}
}

func normalizePositiveInt(value, fallback int) int {
	if value > 0 {
		return value
	}
	return fallback
}

func minPositiveInt(a, b int) int {
	if a <= 0 {
		return b
	}
	if b <= 0 {
		return a
	}
	if a < b {
		return a
	}
	return b
}

func ceilPercent(value int, percent float64) int {
	if value <= 0 {
		return 0
	}
	return int(math.Ceil(float64(value) * percent))
}

func estimateSafeRPS(concurrency int, p95Seconds float64, utilization float64) float64 {
	if concurrency <= 0 || p95Seconds <= 0 {
		return 0
	}
	raw := float64(concurrency) / p95Seconds * utilization
	return math.Round(raw*10) / 10
}

func copyQueueWeights(input map[string]int) map[string]int {
	if len(input) == 0 {
		return map[string]int{}
	}
	out := make(map[string]int, len(input))
	for key, value := range input {
		out[key] = value
	}
	return out
}
