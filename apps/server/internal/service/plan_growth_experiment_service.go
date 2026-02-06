package service

import (
	"context"
	"errors"
)

// GrowthExperimentPlan 运营与增长实验平台规划
type GrowthExperimentPlan struct {
	Key     string                `json:"key"`
	Title   string                `json:"title"`
	Summary string                `json:"summary"`
	Access  ExperimentAccessPlan  `json:"access"`
	Metrics ExperimentMetricPlan  `json:"metrics"`
	Routing ExperimentRoutingPlan `json:"routing"`
	Result  ExperimentResultPlan  `json:"result"`
	Notes   []string              `json:"notes,omitempty"`
}

// ExperimentAccessPlan 实验平台接入与指标定义
type ExperimentAccessPlan struct {
	Key           string                 `json:"key"`
	Title         string                 `json:"title"`
	EntryPoints   []ExperimentEntryPoint `json:"entry_points"`
	IdentityRules []string               `json:"identity_rules"`
	EventSchema   ExperimentEventSchema  `json:"event_schema"`
	Validation    []string               `json:"validation"`
	Notes         []string               `json:"notes,omitempty"`
}

// ExperimentEntryPoint 实验接入入口
type ExperimentEntryPoint struct {
	Channel      string   `json:"channel"`
	Owner        string   `json:"owner"`
	Description  string   `json:"description"`
	Requirements []string `json:"requirements"`
}

// ExperimentEventSchema 实验事件字段规范
type ExperimentEventSchema struct {
	Version        string                 `json:"version"`
	RequiredFields []string               `json:"required_fields"`
	OptionalFields []string               `json:"optional_fields"`
	Example        map[string]interface{} `json:"example"`
}

// ExperimentMetricPlan 指标口径定义
type ExperimentMetricPlan struct {
	Key        string                       `json:"key"`
	Title      string                       `json:"title"`
	Primary    []ExperimentMetricDefinition `json:"primary"`
	Secondary  []ExperimentMetricDefinition `json:"secondary"`
	Guardrails []ExperimentMetricDefinition `json:"guardrails"`
	Notes      []string                     `json:"notes,omitempty"`
}

// ExperimentMetricDefinition 指标定义
type ExperimentMetricDefinition struct {
	Key        string   `json:"key"`
	Title      string   `json:"title"`
	Definition string   `json:"definition"`
	Source     string   `json:"source"`
	Direction  string   `json:"direction"`
	Window     string   `json:"window"`
	Notes      []string `json:"notes,omitempty"`
}

// ExperimentRoutingPlan A/B 分流策略
type ExperimentRoutingPlan struct {
	Key             string                `json:"key"`
	Title           string                `json:"title"`
	Strategy        string                `json:"strategy"`
	StickyKey       string                `json:"sticky_key"`
	Buckets         []ExperimentBucket    `json:"buckets"`
	AllocationRules []string              `json:"allocation_rules"`
	RampPlan        []ExperimentRampStage `json:"ramp_plan"`
	Notes           []string              `json:"notes,omitempty"`
}

// ExperimentBucket 分流桶定义
type ExperimentBucket struct {
	Key         string `json:"key"`
	Title       string `json:"title"`
	Allocation  int    `json:"allocation"`
	Description string `json:"description"`
}

// ExperimentRampStage 灰度放量阶段
type ExperimentRampStage struct {
	Stage        string         `json:"stage"`
	Allocations  map[string]int `json:"allocations"`
	Duration     string         `json:"duration"`
	ExitCriteria []string       `json:"exit_criteria"`
}

// ExperimentResultPlan 实验结果回收与决策流程
type ExperimentResultPlan struct {
	Key          string                   `json:"key"`
	Title        string                   `json:"title"`
	Collection   []string                 `json:"collection"`
	Analysis     []string                 `json:"analysis"`
	DecisionFlow []ExperimentDecisionStep `json:"decision_flow"`
	Rollback     []string                 `json:"rollback"`
	Notes        []string                 `json:"notes,omitempty"`
}

// ExperimentDecisionStep 决策步骤
type ExperimentDecisionStep struct {
	Stage   string   `json:"stage"`
	Actions []string `json:"actions"`
	Output  string   `json:"output"`
}

// PlanGrowthExperimentService 运营与增长实验平台规划服务接口
type PlanGrowthExperimentService interface {
	GetPlan(ctx context.Context) (*GrowthExperimentPlan, error)
}

type planGrowthExperimentService struct {
	plan GrowthExperimentPlan
}

// ErrGrowthExperimentPlanNotFound 运营与增长实验平台规划不存在
var ErrGrowthExperimentPlanNotFound = errors.New("growth experiment plan not found")

// NewPlanGrowthExperimentService 创建运营与增长实验平台规划服务
func NewPlanGrowthExperimentService() PlanGrowthExperimentService {
	return &planGrowthExperimentService{
		plan: defaultGrowthExperimentPlan(),
	}
}

func (s *planGrowthExperimentService) GetPlan(ctx context.Context) (*GrowthExperimentPlan, error) {
	if s == nil || s.plan.Key == "" {
		return nil, ErrGrowthExperimentPlanNotFound
	}
	output := s.plan
	return &output, nil
}

func defaultGrowthExperimentPlan() GrowthExperimentPlan {
	return GrowthExperimentPlan{
		Key:     "growth_experiments",
		Title:   "运营与增长实验平台",
		Summary: "定义实验接入、指标口径、分流策略与结果决策流程，保证实验可执行与可控。",
		Access: ExperimentAccessPlan{
			Key:   "experiment_access_and_metrics",
			Title: "实验平台接入与指标定义",
			EntryPoints: []ExperimentEntryPoint{
				{
					Channel:     "frontend_sdk",
					Owner:       "frontend",
					Description: "在前端 SDK 中完成曝光与核心行为事件采集。",
					Requirements: []string{
						"支持 workspace_id + user_id/session_id 维度",
						"事件携带 experiment_key、variant、event_name",
						"与运行时响应关联 request_id",
					},
				},
				{
					Channel:     "server_side",
					Owner:       "backend",
					Description: "在服务端埋点关键转化行为与交易类事件。",
					Requirements: []string{
						"支持幂等 key 避免重复计数",
						"写入前完成 PII 脱敏",
					},
				},
				{
					Channel:     "workflow_runtime",
					Owner:       "runtime",
					Description: "在执行链路中记录实验影响的性能与失败指标。",
					Requirements: []string{
						"关联 execution_id 与 workspace_id",
						"采集延迟与失败率指标",
					},
				},
			},
			IdentityRules: []string{
				"优先使用 user_id，其次使用 session_id，匿名访问需稳定 session_id。",
				"跨端同一用户使用统一 user_id 绑定。",
				"实验分流单位默认按 workspace_id + user_id 组合。",
			},
			EventSchema: ExperimentEventSchema{
				Version: "v1",
				RequiredFields: []string{
					"experiment_key",
					"variant",
					"event_name",
					"occurred_at",
					"workspace_id",
				},
				OptionalFields: []string{
					"user_id",
					"session_id",
					"request_id",
					"value",
					"metadata",
				},
				Example: map[string]interface{}{
					"experiment_key": "growth_onboarding_v1",
					"variant":        "B",
					"event_name":     "onboarding_completed",
					"occurred_at":    "2026-02-02T08:30:00Z",
					"workspace_id":   "ws_123",
					"user_id":        "user_456",
					"value":          1,
					"metadata": map[string]interface{}{
						"surface": "dashboard",
						"step":    "invite_team",
					},
				},
			},
			Validation: []string{
				"事件落库前校验 required_fields",
				"实验配置变更需同步更新指标口径",
				"曝光事件与转化事件必须可关联",
			},
			Notes: []string{
				"指标口径必须写入实验配置与结果报告。",
			},
		},
		Metrics: ExperimentMetricPlan{
			Key:   "experiment_metrics",
			Title: "指标口径定义",
			Primary: []ExperimentMetricDefinition{
				{
					Key:        "activation_rate",
					Title:      "激活转化率",
					Definition: "完成核心激活事件的用户 / 实验曝光用户",
					Source:     "event:onboarding_completed",
					Direction:  "higher_is_better",
					Window:     "7d",
				},
				{
					Key:        "retention_d7",
					Title:      "7 日留存率",
					Definition: "曝光后第 7 天仍活跃的用户 / 曝光用户",
					Source:     "event:session_active",
					Direction:  "higher_is_better",
					Window:     "7d",
				},
			},
			Secondary: []ExperimentMetricDefinition{
				{
					Key:        "time_to_value",
					Title:      "价值达成时间",
					Definition: "从曝光到完成关键动作的中位时长",
					Source:     "event:onboarding_completed",
					Direction:  "lower_is_better",
					Window:     "7d",
				},
				{
					Key:        "invite_rate",
					Title:      "邀请转化率",
					Definition: "完成邀请行为的用户 / 曝光用户",
					Source:     "event:invite_sent",
					Direction:  "higher_is_better",
					Window:     "7d",
				},
			},
			Guardrails: []ExperimentMetricDefinition{
				{
					Key:        "error_rate",
					Title:      "错误率",
					Definition: "实验流量中的错误请求 / 总请求",
					Source:     "runtime_events",
					Direction:  "lower_is_better",
					Window:     "24h",
					Notes: []string{
						"超过阈值立即暂停实验。",
					},
				},
				{
					Key:        "p95_latency",
					Title:      "P95 延迟",
					Definition: "实验流量请求 P95 时延",
					Source:     "runtime_metrics",
					Direction:  "lower_is_better",
					Window:     "24h",
				},
				{
					Key:        "cost_per_action",
					Title:      "单次行动成本",
					Definition: "实验流量成本 / 关键动作完成次数",
					Source:     "billing_usage",
					Direction:  "lower_is_better",
					Window:     "7d",
				},
			},
			Notes: []string{
				"Primary 与 Guardrail 指标必须设置阈值与报警。",
			},
		},
		Routing: ExperimentRoutingPlan{
			Key:       "ab_routing_strategy",
			Title:     "A/B 分流策略",
			Strategy:  "consistent_hash",
			StickyKey: "workspace_id + user_id (fallback session_id)",
			Buckets: []ExperimentBucket{
				{
					Key:         "control",
					Title:       "对照组",
					Allocation:  50,
					Description: "保持现有体验",
				},
				{
					Key:         "variant_b",
					Title:       "实验组",
					Allocation:  50,
					Description: "启用新增长策略",
				},
			},
			AllocationRules: []string{
				"首次上线使用 5% 流量验证稳定性",
				"不满足 Guardrail 阈值时自动降级为 0%",
				"支持按 workspace 标签或套餐进行分流",
			},
			RampPlan: []ExperimentRampStage{
				{
					Stage:    "stage_1",
					Duration: "48h",
					Allocations: map[string]int{
						"control":   95,
						"variant_b": 5,
					},
					ExitCriteria: []string{
						"Guardrail 指标无异常",
						"曝光样本 >= 500",
					},
				},
				{
					Stage:    "stage_2",
					Duration: "72h",
					Allocations: map[string]int{
						"control":   75,
						"variant_b": 25,
					},
					ExitCriteria: []string{
						"主要指标提升方向正确",
						"错误率未超过阈值",
					},
				},
				{
					Stage:    "stage_3",
					Duration: "7d",
					Allocations: map[string]int{
						"control":   50,
						"variant_b": 50,
					},
					ExitCriteria: []string{
						"满足最小样本量",
						"结论达到显著性",
					},
				},
			},
			Notes: []string{
				"分流策略变更需记录到实验日志与变更记录。",
			},
		},
		Result: ExperimentResultPlan{
			Key:   "result_collection_and_decision",
			Title: "实验结果回收与决策流程",
			Collection: []string{
				"按日汇总曝光、转化与成本指标",
				"关联实验配置与分流版本信息",
				"保留原始事件用于追溯与复盘",
			},
			Analysis: []string{
				"计算显著性与置信区间（95%）",
				"满足最小样本量与最小运行周期",
				"对分群维度（新用户/老用户）做拆分分析",
			},
			DecisionFlow: []ExperimentDecisionStep{
				{
					Stage: "checkpoint",
					Actions: []string{
						"每日检查 Guardrail 指标",
						"验证分流比例与曝光稳定性",
					},
					Output: "继续/暂停实验的日常结论",
				},
				{
					Stage: "final_review",
					Actions: []string{
						"评估主指标与次指标提升幅度",
						"评估成本与风险变化",
					},
					Output: "决策：全量发布 / 延长实验 / 终止实验",
				},
				{
					Stage: "rollout",
					Actions: []string{
						"发布决策记录到变更日志",
						"更新产品配置与功能说明",
					},
					Output: "实验结果与发布结论归档",
				},
			},
			Rollback: []string{
				"Guardrail 指标超阈值立即回滚",
				"回滚需记录影响范围与恢复时间",
			},
			Notes: []string{
				"实验结论需同步至产品 Roadmap 与运营复盘。",
			},
		},
		Notes: []string{
			"实验平台需与配置中心/审计日志保持同步。",
			"所有实验必须指定负责人与终止时间。",
		},
	}
}
