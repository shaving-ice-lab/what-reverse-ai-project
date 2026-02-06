package service

import (
	"context"
	"errors"
)

// ChaosScenarioCatalog 混沌工程场景清单
type ChaosScenarioCatalog struct {
	Key       string          `json:"key"`
	Title     string          `json:"title"`
	Summary   string          `json:"summary"`
	Scenarios []ChaosScenario `json:"scenarios"`
	Notes     []string        `json:"notes,omitempty"`
}

// ChaosScenario 混沌演练场景定义
type ChaosScenario struct {
	Key           string   `json:"key"`
	Title         string   `json:"title"`
	Category      string   `json:"category"`
	Scope         string   `json:"scope"`
	Description   string   `json:"description"`
	Impact        string   `json:"impact"`
	Signals       []string `json:"signals"`
	Preconditions []string `json:"preconditions"`
	Injection     []string `json:"injection"`
	Rollback      []string `json:"rollback"`
	Validation    []string `json:"validation,omitempty"`
	SafetyGuards  []string `json:"safety_guards,omitempty"`
	Owners        []string `json:"owners,omitempty"`
	References    []string `json:"references,omitempty"`
}

// ChaosAutomationPlan 自动化注入与回滚机制
type ChaosAutomationPlan struct {
	Key               string                 `json:"key"`
	Title             string                 `json:"title"`
	Summary           string                 `json:"summary"`
	Stages            []ChaosAutomationStage `json:"stages"`
	Guardrails        []string               `json:"guardrails"`
	RollbackChecklist []string               `json:"rollback_checklist"`
	Observability     []string               `json:"observability"`
	References        []string               `json:"references,omitempty"`
}

// ChaosAutomationStage 自动化阶段
type ChaosAutomationStage struct {
	Stage   string   `json:"stage"`
	Actions []string `json:"actions"`
	Output  string   `json:"output"`
}

// ChaosDrillEvaluationTemplate 演练结果评估模板
type ChaosDrillEvaluationTemplate struct {
	Key              string                   `json:"key"`
	Title            string                   `json:"title"`
	Summary          string                   `json:"summary"`
	Sections         []ChaosEvaluationSection `json:"sections"`
	Scorecard        []ChaosScorecardItem     `json:"scorecard"`
	ActionItemFields []string                 `json:"action_item_fields"`
	Notes            []string                 `json:"notes,omitempty"`
}

// ChaosEvaluationSection 评估模板分区
type ChaosEvaluationSection struct {
	Key       string   `json:"key"`
	Title     string   `json:"title"`
	Questions []string `json:"questions"`
}

// ChaosScorecardItem 评分卡指标
type ChaosScorecardItem struct {
	Key        string   `json:"key"`
	Title      string   `json:"title"`
	Definition string   `json:"definition"`
	Target     string   `json:"target"`
	Evidence   []string `json:"evidence,omitempty"`
}

// PlanChaosEngineeringService 混沌工程与稳定性演练规划服务
type PlanChaosEngineeringService interface {
	GetChaosScenarioCatalog(ctx context.Context) (*ChaosScenarioCatalog, error)
	GetChaosAutomationPlan(ctx context.Context) (*ChaosAutomationPlan, error)
	GetChaosEvaluationTemplate(ctx context.Context) (*ChaosDrillEvaluationTemplate, error)
}

type planChaosEngineeringService struct {
	scenarios  ChaosScenarioCatalog
	automation ChaosAutomationPlan
	template   ChaosDrillEvaluationTemplate
}

// ErrChaosScenarioCatalogNotFound 场景清单不存在
var ErrChaosScenarioCatalogNotFound = errors.New("chaos scenario catalog not found")

// ErrChaosAutomationPlanNotFound 自动化流程不存在
var ErrChaosAutomationPlanNotFound = errors.New("chaos automation plan not found")

// ErrChaosEvaluationTemplateNotFound 评估模板不存在
var ErrChaosEvaluationTemplateNotFound = errors.New("chaos evaluation template not found")

// NewPlanChaosEngineeringService 创建混沌工程规划服务
func NewPlanChaosEngineeringService() PlanChaosEngineeringService {
	return &planChaosEngineeringService{
		scenarios:  defaultChaosScenarioCatalog(),
		automation: defaultChaosAutomationPlan(),
		template:   defaultChaosDrillEvaluationTemplate(),
	}
}

func (s *planChaosEngineeringService) GetChaosScenarioCatalog(ctx context.Context) (*ChaosScenarioCatalog, error) {
	if s == nil || s.scenarios.Key == "" {
		return nil, ErrChaosScenarioCatalogNotFound
	}
	output := s.scenarios
	return &output, nil
}

func (s *planChaosEngineeringService) GetChaosAutomationPlan(ctx context.Context) (*ChaosAutomationPlan, error) {
	if s == nil || s.automation.Key == "" {
		return nil, ErrChaosAutomationPlanNotFound
	}
	output := s.automation
	return &output, nil
}

func (s *planChaosEngineeringService) GetChaosEvaluationTemplate(ctx context.Context) (*ChaosDrillEvaluationTemplate, error) {
	if s == nil || s.template.Key == "" {
		return nil, ErrChaosEvaluationTemplateNotFound
	}
	output := s.template
	return &output, nil
}

func defaultChaosScenarioCatalog() ChaosScenarioCatalog {
	return ChaosScenarioCatalog{
		Key:     "chaos_scenarios",
		Title:   "混沌工程场景清单",
		Summary: "覆盖 runtime、执行队列、依赖与数据层的稳定性演练场景。",
		Scenarios: []ChaosScenario{
			{
				Key:         "runtime_latency_spike",
				Title:       "Runtime 延迟抖动",
				Category:    "latency",
				Scope:       "runtime execute",
				Description: "在指定 workspace 上注入固定延迟，验证超时与降级策略。",
				Impact:      "公开请求 P95 上升，可能触发超时与重试。",
				Signals: []string{
					"agentflow_http_request_duration_seconds",
					"runtime_timeout",
					"execution_failed_rate",
				},
				Preconditions: []string{
					"仅在演练环境或白名单 workspace 执行",
					"已配置 runtime 超时阈值与告警",
					"准备回滚负责人和值班窗口",
				},
				Injection: []string{
					"使用 POST /api/v1/config/items 写入 key=chaos.runtime.latency_ms value=500",
					"scope_type=workspace，scope_id 为演练 workspace",
					"触发 runtime 执行，观察延迟与超时趋势",
				},
				Rollback: []string{
					"删除或禁用对应 config item",
					"确认延迟指标恢复并清理异常执行",
				},
				Validation: []string{
					"告警在 5 分钟内触发并记录",
					"降级提示或限流策略生效",
				},
				SafetyGuards: []string{
					"最大延迟 500ms，持续时间 <= 10 分钟",
					"只对指定 workspace 生效",
				},
				Owners:     []string{"ops", "runtime"},
				References: []string{"/api/v1/config/items"},
			},
			{
				Key:         "execution_queue_backlog",
				Title:       "执行队列积压",
				Category:    "capacity",
				Scope:       "execution worker",
				Description: "降低 worker 并发或暂停处理，验证队列告警与扩容流程。",
				Impact:      "执行排队时间上升，用户感知延迟。",
				Signals: []string{
					"queue_length",
					"execution_pending_age_seconds",
				},
				Preconditions: []string{
					"准备可控的队列监控与告警规则",
					"演练流量与目标 workflow 已就绪",
				},
				Injection: []string{
					"使用 POST /api/v1/config/items 写入 key=chaos.worker.max_concurrency value=1",
					"触发批量执行，观察队列长度与等待时间",
				},
				Rollback: []string{
					"恢复 worker 并发配置或重启 worker",
					"确认队列积压清空并恢复稳定",
				},
				Validation: []string{
					"队列告警触发并记录处理时间",
					"扩容或限流策略能在 30 分钟内止血",
				},
				SafetyGuards: []string{
					"禁止在生产高峰时段执行",
					"设置队列积压上限与自动回滚阈值",
				},
				Owners:     []string{"ops", "backend"},
				References: []string{"/api/v1/config/items"},
			},
			{
				Key:         "llm_provider_degraded",
				Title:       "LLM 依赖降级",
				Category:    "dependency",
				Scope:       "LLM provider calls",
				Description: "模拟上游 429/5xx，验证 fallback 与重试策略。",
				Impact:      "模型调用失败率上升，响应可能被降级。",
				Signals: []string{
					"llm_request_error_rate",
					"llm_provider_latency_ms",
				},
				Preconditions: []string{
					"已配置备用模型或降级策略",
					"具备模型调用与 token 使用监控",
				},
				Injection: []string{
					"使用 POST /api/v1/config/items 写入 key=chaos.llm.error_rate value=0.3",
					"触发 LLM 节点执行并观察 error_rate",
				},
				Rollback: []string{
					"删除 chaos.llm.error_rate 配置",
					"确认 error_rate 恢复基线",
				},
				Validation: []string{
					"fallback 模型在 5 分钟内接管",
					"错误提示符合用户体验要求",
				},
				SafetyGuards: []string{
					"仅对白名单 provider 生效",
					"错误率上限 30%",
				},
				Owners:     []string{"runtime", "ai"},
				References: []string{"/api/v1/config/items"},
			},
			{
				Key:         "workspace_db_slow",
				Title:       "Workspace DB 慢查询",
				Category:    "database",
				Scope:       "workspace database",
				Description: "模拟数据库慢查询，验证超时、重试与告警。",
				Impact:      "管理 API 与执行持久化延迟上升。",
				Signals: []string{
					"agentflow_http_request_duration_seconds",
					"db_query_latency_ms",
				},
				Preconditions: []string{
					"已启用慢查询监控与告警",
					"准备可回滚的索引/配置",
				},
				Injection: []string{
					"在演练环境启用慢查询注入配置",
					"触发 workspace 操作与执行写入",
				},
				Rollback: []string{
					"关闭慢查询注入配置",
					"确认 API 延迟与错误率回归基线",
				},
				Validation: []string{
					"慢查询告警触发且定位成功",
					"回滚后延迟恢复正常",
				},
				SafetyGuards: []string{
					"只针对演练环境或隔离租户",
					"限制注入时间窗口",
				},
				Owners:     []string{"backend", "ops"},
				References: []string{"/api/v1/workspaces/:id/database"},
			},
		},
		Notes: []string{
			"每个场景需绑定明确的假设与成功标准。",
			"建议在演练前 24h 完成通知与回滚演练。",
		},
	}
}

func defaultChaosAutomationPlan() ChaosAutomationPlan {
	return ChaosAutomationPlan{
		Key:     "chaos_automation",
		Title:   "自动化注入与回滚机制",
		Summary: "定义演练准备、注入、观测与回滚的自动化流程与安全护栏。",
		Stages: []ChaosAutomationStage{
			{
				Stage: "准备",
				Actions: []string{
					"选择场景并定义假设、影响范围与成功标准",
					"确认告警渠道可用（必要时调用 /api/v1/ops/alerts/test）",
					"创建演练窗口与负责人（含回滚 owner）",
				},
				Output: "演练计划与回滚责任人确认",
			},
			{
				Stage: "注入",
				Actions: []string{
					"通过 /api/v1/config/items 写入 chaos 配置（带 scope 与 TTL 描述）",
					"触发目标 workflow/runtime 请求作为演练流量",
				},
				Output: "注入配置已生效并开始影响",
			},
			{
				Stage: "观测",
				Actions: []string{
					"监控延迟、错误率、队列积压与告警触发情况",
					"记录检测时间、响应时间与沟通时间线",
				},
				Output: "观测数据与时间线记录",
			},
			{
				Stage: "回滚",
				Actions: []string{
					"禁用或删除 chaos 配置项",
					"确认指标恢复并清理异常任务",
				},
				Output: "系统恢复稳定与回滚记录",
			},
			{
				Stage: "复盘",
				Actions: []string{
					"填写演练评估模板并产出改进行动项",
					"更新 Runbook/告警策略",
				},
				Output: "演练复盘记录与改进清单",
			},
		},
		Guardrails: []string{
			"仅允许在演练环境或白名单 workspace 执行",
			"所有 chaos 配置必须包含时间窗口与回滚阈值",
			"错误预算消耗超过阈值立即自动回滚",
		},
		RollbackChecklist: []string{
			"删除 chaos 配置项",
			"恢复 worker 并发/限流策略",
			"验证关键 API 与 runtime 执行",
			"确认告警关闭与指标回归基线",
		},
		Observability: []string{
			"agentflow_http_request_duration_seconds",
			"agentflow_execution_total",
			"runtime_timeout",
			"queue_length",
		},
		References: []string{
			"/api/v1/config/items",
			"/api/v1/ops/alerts/test",
		},
	}
}

func defaultChaosDrillEvaluationTemplate() ChaosDrillEvaluationTemplate {
	return ChaosDrillEvaluationTemplate{
		Key:     "chaos_drill_evaluation",
		Title:   "混沌演练评估模板",
		Summary: "评估检测、响应、恢复与改进行动，确保演练结果可复用。",
		Sections: []ChaosEvaluationSection{
			{
				Key:   "overview",
				Title: "演练概览",
				Questions: []string{
					"演练场景与假设是什么？",
					"演练范围与影响的 workspace？",
					"成功标准是否达成？",
				},
			},
			{
				Key:   "detection_response",
				Title: "检测与响应",
				Questions: []string{
					"告警是否按预期触发？",
					"MTTD/MTTR 分别是多少？",
					"响应链路是否顺畅？",
				},
			},
			{
				Key:   "impact_blast_radius",
				Title: "影响范围与用户体验",
				Questions: []string{
					"实际影响范围是否超出预期？",
					"降级/回退提示是否生效？",
				},
			},
			{
				Key:   "rollback_recovery",
				Title: "回滚与恢复",
				Questions: []string{
					"回滚是否按预期执行？",
					"关键指标恢复耗时？",
				},
			},
			{
				Key:   "follow_up",
				Title: "改进与行动项",
				Questions: []string{
					"哪些监控/告警需要补齐？",
					"Runbook 是否需要更新？",
				},
			},
		},
		Scorecard: []ChaosScorecardItem{
			{
				Key:        "mttd",
				Title:      "检测时间",
				Definition: "从注入开始到告警触发的时间",
				Target:     "<= 5m",
				Evidence:   []string{"告警触发时间", "注入开始时间"},
			},
			{
				Key:        "mttr",
				Title:      "恢复时间",
				Definition: "从告警触发到指标恢复的时间",
				Target:     "<= 30m",
				Evidence:   []string{"指标恢复时间", "回滚完成时间"},
			},
			{
				Key:        "error_budget",
				Title:      "错误预算消耗",
				Definition: "演练期间错误预算消耗比例",
				Target:     "<= 10%",
				Evidence:   []string{"错误预算消耗报表"},
			},
			{
				Key:        "rollback_success",
				Title:      "回滚成功率",
				Definition: "是否在预期时间内完成回滚",
				Target:     "100%",
			},
		},
		ActionItemFields: []string{
			"action",
			"owner",
			"priority",
			"due_date",
			"status",
		},
		Notes: []string{
			"评估结果需同步至稳定性看板与季度复盘。",
		},
	}
}
