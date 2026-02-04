package service

import (
	"context"
	"errors"
)

// QueueSystemPlan 异步任务与队列系统规划
type QueueSystemPlan struct {
	Key          string             `json:"key"`
	Title        string             `json:"title"`
	Summary      string             `json:"summary"`
	ConfigKeys   []string           `json:"config_keys,omitempty"`
	Queues       []QueueDefinition  `json:"queues"`
	RetryPolicy  RetryBackoffPolicy `json:"retry_policy"`
	DeadLetter   DeadLetterPolicy   `json:"dead_letter"`
	Idempotency  IdempotencyPolicy  `json:"idempotency"`
	DelayedTasks DelayedTaskPolicy  `json:"delayed_tasks"`
	Notes        []string           `json:"notes,omitempty"`
}

// QueueDefinition 队列定义
type QueueDefinition struct {
	Name           string   `json:"name"`
	PriorityWeight int      `json:"priority_weight"`
	Purpose        string   `json:"purpose"`
	TaskTypes      []string `json:"task_types"`
	Source         string   `json:"source,omitempty"`
	Notes          []string `json:"notes,omitempty"`
}

// RetryBackoffPolicy 重试与退避策略
type RetryBackoffPolicy struct {
	Strategy       string         `json:"strategy"`
	BaseDelay      string         `json:"base_delay"`
	MaxDelay       string         `json:"max_delay"`
	JitterRatio    string         `json:"jitter_ratio"`
	MaxRetryByTask map[string]int `json:"max_retry_by_task"`
	Notes          []string       `json:"notes,omitempty"`
}

// DeadLetterPolicy 死信队列策略
type DeadLetterPolicy struct {
	Behavior        string   `json:"behavior"`
	Operations      []string `json:"operations"`
	RemediationFlow []string `json:"remediation_flow"`
	Source          string   `json:"source,omitempty"`
}

// IdempotencyPolicy 幂等性与去重策略
type IdempotencyPolicy struct {
	Strategy   string            `json:"strategy"`
	DedupTTLs  map[string]string `json:"dedup_ttls"`
	ErrorHints []string          `json:"error_hints"`
	Notes      []string          `json:"notes,omitempty"`
}

// DelayedTaskPolicy 延时任务与定时清理策略
type DelayedTaskPolicy struct {
	SupportedQueues []string `json:"supported_queues"`
	Mechanisms      []string `json:"mechanisms"`
	UseCases        []string `json:"use_cases"`
	Notes           []string `json:"notes,omitempty"`
}

// PlanQueueSystemService 异步任务与队列系统规划服务接口
type PlanQueueSystemService interface {
	GetPlan(ctx context.Context) (*QueueSystemPlan, error)
}

type planQueueSystemService struct {
	plan QueueSystemPlan
}

// ErrQueueSystemPlanNotFound 队列系统规划不存在
var ErrQueueSystemPlanNotFound = errors.New("queue system plan not found")

// NewPlanQueueSystemService 创建队列系统规划服务
func NewPlanQueueSystemService() PlanQueueSystemService {
	return &planQueueSystemService{
		plan: defaultQueueSystemPlan(),
	}
}

func (s *planQueueSystemService) GetPlan(ctx context.Context) (*QueueSystemPlan, error) {
	if s == nil || s.plan.Key == "" {
		return nil, ErrQueueSystemPlanNotFound
	}
	output := s.plan
	return &output, nil
}

func defaultQueueSystemPlan() QueueSystemPlan {
	return QueueSystemPlan{
		Key:     "queue_system_plan",
		Title:   "异步任务与队列系统",
		Summary: "覆盖队列类型、重试退避、死信重放、幂等去重与延时任务的最小可执行规范。",
		ConfigKeys: []string{
			"queue.worker_concurrency",
			"queue.queues.*",
		},
		Queues: []QueueDefinition{
			{
				Name:           "execution",
				PriorityWeight: 6,
				Purpose:        "工作流执行与运行时关键任务。",
				TaskTypes:      []string{"workflow:execute"},
				Source:         "apps/server/internal/pkg/queue/queue.go",
			},
			{
				Name:           "db_provision",
				PriorityWeight: 3,
				Purpose:        "Workspace 数据库创建与初始化。",
				TaskTypes:      []string{"workspace:db:provision"},
				Source:         "apps/server/internal/pkg/queue/queue.go",
			},
			{
				Name:           "domain_verify",
				PriorityWeight: 2,
				Purpose:        "域名验证与状态更新。",
				TaskTypes:      []string{"app:domain:verify"},
				Source:         "apps/server/internal/pkg/queue/queue.go",
			},
			{
				Name:           "metrics_aggregation",
				PriorityWeight: 1,
				Purpose:        "指标聚合与统计写入。",
				TaskTypes:      []string{"metrics:aggregate"},
				Source:         "apps/server/internal/pkg/queue/queue.go",
			},
			{
				Name:           "webhook",
				PriorityWeight: 3,
				Purpose:        "Webhook 触发与外部回调处理。",
				TaskTypes:      []string{"workflow:webhook"},
				Source:         "apps/server/internal/pkg/queue/queue.go",
			},
			{
				Name:           "scheduled",
				PriorityWeight: 1,
				Purpose:        "定时任务与延时触发。",
				TaskTypes:      []string{"workflow:scheduled"},
				Source:         "apps/server/internal/pkg/queue/queue.go",
			},
			{
				Name:           "workflow",
				PriorityWeight: 6,
				Purpose:        "历史队列名称兼容（与 execution 权重保持一致）。",
				TaskTypes:      []string{"workflow:execute"},
				Source:         "apps/server/internal/pkg/queue/worker.go",
				Notes: []string{
					"用于兼容旧队列名称，权重同步 execution。",
				},
			},
		},
		RetryPolicy: RetryBackoffPolicy{
			Strategy:    "exponential_backoff_with_jitter",
			BaseDelay:   "500ms",
			MaxDelay:    "10m",
			JitterRatio: "0.2",
			MaxRetryByTask: map[string]int{
				"workflow:execute":       3,
				"workflow:webhook":       3,
				"workflow:scheduled":     1,
				"workspace:db:provision": 5,
				"app:domain:verify":      5,
				"metrics:aggregate":      2,
			},
			Notes: []string{
				"重试退避逻辑使用指数退避 + 抖动，避免雪崩。",
				"支持 RetryLaterError 指定下一次执行时间。",
			},
		},
		DeadLetter: DeadLetterPolicy{
			Behavior: "超过最大重试次数进入死信队列，需人工或自动重放。",
			Operations: []string{
				"ListDeadTasks(queue, page, pageSize)",
				"RetryDeadTask(queue, taskID)",
				"DeleteDeadTask(queue, taskID)",
			},
			RemediationFlow: []string{
				"定位失败原因并修复依赖或数据",
				"选择性重放或删除死信任务",
				"记录重放结果到审计日志",
			},
			Source: "apps/server/internal/pkg/queue/queue.go",
		},
		Idempotency: IdempotencyPolicy{
			Strategy: "asynq.Unique + ErrTaskNoop",
			DedupTTLs: map[string]string{
				"short":  "5m",
				"medium": "15m",
				"long":   "30m",
			},
			ErrorHints: []string{
				"ErrTaskNoop 表示幂等命中无需继续处理",
				"ErrDuplicateTask 表示任务已在队列中",
			},
			Notes: []string{
				"关键写操作需补充业务层幂等校验。",
			},
		},
		DelayedTasks: DelayedTaskPolicy{
			SupportedQueues: []string{"scheduled", "metrics_aggregation"},
			Mechanisms: []string{
				"asynq.ProcessAt 实现延时执行",
				"RetryLaterError 触发延迟重试",
			},
			UseCases: []string{
				"定时触发工作流",
				"延迟聚合统计指标",
				"外部依赖恢复后重试",
			},
			Notes: []string{
				"延时任务需控制堆积量与最大延迟窗口。",
			},
		},
		Notes: []string{
			"队列权重可通过配置覆盖，默认使用内置权重。",
		},
	}
}
