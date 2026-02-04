package service

import (
	"context"
	"errors"
)

// ErrorBudgetBurnRate 错误预算燃烧率告警
type ErrorBudgetBurnRate struct {
	Window    string `json:"window"`
	Threshold string `json:"threshold"`
	Action    string `json:"action"`
}

// ErrorBudgetConsumptionRule 错误预算消耗规则
type ErrorBudgetConsumptionRule struct {
	Condition string `json:"condition"`
	Action    string `json:"action"`
}

// ErrorBudgetRule 错误预算规则
type ErrorBudgetRule struct {
	Key              string                       `json:"key"`
	Title            string                       `json:"title"`
	SLO              string                       `json:"slo"`
	Window           string                       `json:"window"`
	Budget           string                       `json:"budget"`
	Measurement      string                       `json:"measurement"`
	Query            string                       `json:"query"`
	BurnRateAlerts   []ErrorBudgetBurnRate        `json:"burn_rate_alerts,omitempty"`
	ConsumptionRules []ErrorBudgetConsumptionRule `json:"consumption_rules,omitempty"`
	Notes            []string                     `json:"notes,omitempty"`
}

// ErrorBudgetPolicyTable 错误预算规则表
type ErrorBudgetPolicyTable struct {
	Key     string            `json:"key"`
	Title   string            `json:"title"`
	Summary string            `json:"summary"`
	Rules   []ErrorBudgetRule `json:"rules"`
	Notes   []string          `json:"notes,omitempty"`
}

// SyntheticProbe 合成监控探针
type SyntheticProbe struct {
	Key             string   `json:"key"`
	Name            string   `json:"name"`
	Method          string   `json:"method"`
	Target          string   `json:"target"`
	Frequency       string   `json:"frequency"`
	Timeout         string   `json:"timeout"`
	Locations       []string `json:"locations"`
	SuccessCriteria []string `json:"success_criteria"`
	Alerts          []string `json:"alerts"`
	Tags            []string `json:"tags,omitempty"`
}

// SyntheticMonitoringPlan 合成监控与探针部署方案
type SyntheticMonitoringPlan struct {
	Key        string           `json:"key"`
	Title      string           `json:"title"`
	Summary    string           `json:"summary"`
	Probes     []SyntheticProbe `json:"probes"`
	Deployment []string         `json:"deployment"`
	Notes      []string         `json:"notes,omitempty"`
}

// OnCallSLOTarget 值班响应目标
type OnCallSLOTarget struct {
	Severity        string `json:"severity"`
	Coverage        string `json:"coverage"`
	AckTarget       string `json:"ack_target"`
	MitigateTarget  string `json:"mitigate_target"`
	UpdateFrequency string `json:"update_frequency"`
	Measurement     string `json:"measurement"`
	Owner           string `json:"owner"`
}

// OnCallSLOTable 值班与响应时间目标表
type OnCallSLOTable struct {
	Key     string            `json:"key"`
	Title   string            `json:"title"`
	Summary string            `json:"summary"`
	Targets []OnCallSLOTarget `json:"targets"`
	Notes   []string          `json:"notes,omitempty"`
}

// StabilityTrack 回归与稳定性专项
type StabilityTrack struct {
	Key        string   `json:"key"`
	Title      string   `json:"title"`
	Summary    string   `json:"summary"`
	Cadence    string   `json:"cadence"`
	Scope      []string `json:"scope"`
	Actions    []string `json:"actions"`
	Acceptance []string `json:"acceptance"`
	Owners     []string `json:"owners"`
}

// StabilityPlan 回归与稳定性专项计划
type StabilityPlan struct {
	Key     string           `json:"key"`
	Title   string           `json:"title"`
	Summary string           `json:"summary"`
	Tracks  []StabilityTrack `json:"tracks"`
	Notes   []string         `json:"notes,omitempty"`
}

// PlanSREService 可用性与错误预算（SRE）规划服务接口
type PlanSREService interface {
	GetErrorBudgetPolicy(ctx context.Context) (*ErrorBudgetPolicyTable, error)
	GetSyntheticMonitoringPlan(ctx context.Context) (*SyntheticMonitoringPlan, error)
	GetOnCallSLOTable(ctx context.Context) (*OnCallSLOTable, error)
	GetStabilityPlan(ctx context.Context) (*StabilityPlan, error)
}

type planSREService struct {
	errorBudget ErrorBudgetPolicyTable
	synthetic   SyntheticMonitoringPlan
	oncall      OnCallSLOTable
	stability   StabilityPlan
}

// ErrErrorBudgetPolicyNotFound 错误预算规则不存在
var ErrErrorBudgetPolicyNotFound = errors.New("error budget policy not found")

// ErrSyntheticMonitoringPlanNotFound 合成监控方案不存在
var ErrSyntheticMonitoringPlanNotFound = errors.New("synthetic monitoring plan not found")

// ErrOnCallSLOTableNotFound 值班 SLO 表不存在
var ErrOnCallSLOTableNotFound = errors.New("oncall slo table not found")

// ErrStabilityPlanNotFound 稳定性专项计划不存在
var ErrStabilityPlanNotFound = errors.New("stability plan not found")

// NewPlanSREService 创建 SRE 规划服务
func NewPlanSREService() PlanSREService {
	return &planSREService{
		errorBudget: defaultErrorBudgetPolicy(),
		synthetic:   defaultSyntheticMonitoringPlan(),
		oncall:      defaultOnCallSLOTable(),
		stability:   defaultStabilityPlan(),
	}
}

func (s *planSREService) GetErrorBudgetPolicy(ctx context.Context) (*ErrorBudgetPolicyTable, error) {
	if s == nil || s.errorBudget.Key == "" {
		return nil, ErrErrorBudgetPolicyNotFound
	}
	output := s.errorBudget
	return &output, nil
}

func (s *planSREService) GetSyntheticMonitoringPlan(ctx context.Context) (*SyntheticMonitoringPlan, error) {
	if s == nil || s.synthetic.Key == "" {
		return nil, ErrSyntheticMonitoringPlanNotFound
	}
	output := s.synthetic
	return &output, nil
}

func (s *planSREService) GetOnCallSLOTable(ctx context.Context) (*OnCallSLOTable, error) {
	if s == nil || s.oncall.Key == "" {
		return nil, ErrOnCallSLOTableNotFound
	}
	output := s.oncall
	return &output, nil
}

func (s *planSREService) GetStabilityPlan(ctx context.Context) (*StabilityPlan, error) {
	if s == nil || s.stability.Key == "" {
		return nil, ErrStabilityPlanNotFound
	}
	output := s.stability
	return &output, nil
}

func defaultErrorBudgetPolicy() ErrorBudgetPolicyTable {
	return ErrorBudgetPolicyTable{
		Key:     "sre_error_budget",
		Title:   "Error Budget 计算与消耗规则",
		Summary: "定义 Runtime 与控制面可用性预算，并明确燃烧率告警与冻结策略。",
		Rules: []ErrorBudgetRule{
			{
				Key:         "runtime_availability",
				Title:       "Runtime 公网入口可用性",
				SLO:         "99.9%",
				Window:      "30d",
				Budget:      "43m",
				Measurement: "runtime 2xx / 总请求",
				Query:       "sum(rate(agentflow_runtime_requests_total{status=\"2xx\"}[5m])) / sum(rate(agentflow_runtime_requests_total[5m]))",
				BurnRateAlerts: []ErrorBudgetBurnRate{
					{Window: "1h", Threshold: ">= 2.0x", Action: "触发 P2 可用性告警"},
					{Window: "30m", Threshold: ">= 6.0x", Action: "触发 P1 告警并冻结高风险发布"},
				},
				ConsumptionRules: []ErrorBudgetConsumptionRule{
					{Condition: "30d 预算消耗 >= 50%", Action: "冻结非紧急发布，启用降级与限流"},
					{Condition: "剩余预算 <= 25%", Action: "仅允许修复类发布，需 SRE 审批"},
					{Condition: "预算耗尽", Action: "进入稳定期，暂停变更直至恢复"},
				},
			},
			{
				Key:         "control_plane_availability",
				Title:       "控制面 API 可用性",
				SLO:         "99.5%",
				Window:      "30d",
				Budget:      "216m",
				Measurement: "核心 API 2xx / 总请求",
				Query:       "sum(rate(agentflow_http_requests_total{path=~\"/api/v1/.*\", status=\"2xx\"}[5m])) / sum(rate(agentflow_http_requests_total{path=~\"/api/v1/.*\"}[5m]))",
				BurnRateAlerts: []ErrorBudgetBurnRate{
					{Window: "2h", Threshold: ">= 2.0x", Action: "触发 P2 控制面告警"},
					{Window: "30m", Threshold: ">= 5.0x", Action: "触发 P1 告警并暂停发布"},
				},
				ConsumptionRules: []ErrorBudgetConsumptionRule{
					{Condition: "30d 预算消耗 >= 60%", Action: "冻结功能性发布，优先修复"},
					{Condition: "剩余预算 <= 20%", Action: "仅允许紧急修复，需审批"},
				},
			},
			{
				Key:         "execution_success_rate",
				Title:       "工作流执行成功率",
				SLO:         "99.0%",
				Window:      "30d",
				Budget:      "432m",
				Measurement: "completed / 总执行",
				Query:       "sum(rate(agentflow_execution_total{status=\"completed\"}[5m])) / sum(rate(agentflow_execution_total[5m]))",
				BurnRateAlerts: []ErrorBudgetBurnRate{
					{Window: "4h", Threshold: ">= 1.5x", Action: "触发 P2 执行成功率告警"},
					{Window: "1h", Threshold: ">= 3.0x", Action: "触发 P1 告警并启动回归排查"},
				},
				ConsumptionRules: []ErrorBudgetConsumptionRule{
					{Condition: "失败率连续 30m 高于阈值", Action: "冻结新版本发布，回滚最近变更"},
				},
			},
		},
		Notes: []string{
			"错误预算以 30 天滚动窗口计算，预算消耗需结合 burn rate 与剩余额度判断。",
			"若启用多区域，建议按 region 与 workspace_id 维度拆分统计。",
		},
	}
}

func defaultSyntheticMonitoringPlan() SyntheticMonitoringPlan {
	return SyntheticMonitoringPlan{
		Key:     "sre_synthetic_monitoring",
		Title:   "合成监控与探针部署方案",
		Summary: "通过多地域探针监控 Runtime 入口、控制面与健康检查。",
		Probes: []SyntheticProbe{
			{
				Key:       "edge_health",
				Name:      "边缘健康检查",
				Method:    "GET",
				Target:    "/health",
				Frequency: "1m",
				Timeout:   "2s",
				Locations: []string{"ap-southeast", "us-east", "eu-west"},
				SuccessCriteria: []string{
					"HTTP 200",
					"P95 < 200ms",
				},
				Alerts: []string{
					"连续 3 次失败触发 P1 告警",
					"可用性 < 99.9% 触发错误预算告警",
				},
				Tags: []string{"health", "edge"},
			},
			{
				Key:       "runtime_entry",
				Name:      "Runtime 入口请求",
				Method:    "GET",
				Target:    "/runtime/:workspaceSlug/:appSlug",
				Frequency: "1m",
				Timeout:   "3s",
				Locations: []string{"ap-southeast", "us-east", "eu-west"},
				SuccessCriteria: []string{
					"HTTP 2xx",
					"P95 < 1.5s",
				},
				Alerts: []string{
					"连续 2 次失败触发 P1 告警",
					"P95 > 2s 持续 10m 触发 P2 告警",
				},
				Tags: []string{"runtime", "public"},
			},
			{
				Key:       "runtime_schema",
				Name:      "Runtime Schema 获取",
				Method:    "GET",
				Target:    "/runtime/:workspaceSlug/:appSlug/schema",
				Frequency: "5m",
				Timeout:   "3s",
				Locations: []string{"ap-southeast", "us-east", "eu-west"},
				SuccessCriteria: []string{
					"HTTP 2xx",
					"响应体包含 schema 字段",
				},
				Alerts: []string{
					"连续 3 次失败触发 P2 告警",
				},
				Tags: []string{"runtime", "schema"},
			},
			{
				Key:       "control_plane_health",
				Name:      "控制面健康状态",
				Method:    "GET",
				Target:    "/api/v1/system/health",
				Frequency: "2m",
				Timeout:   "3s",
				Locations: []string{"ap-southeast", "us-east"},
				SuccessCriteria: []string{
					"HTTP 2xx",
					"返回服务状态列表",
				},
				Alerts: []string{
					"连续 3 次失败触发 P2 告警",
				},
				Tags: []string{"control-plane"},
			},
		},
		Deployment: []string{
			"在三大区域部署探针，确保跨地域可用性覆盖",
			"为私有端点配置专用 Token 或白名单",
			"探针告警与值班系统/通知渠道打通（电话、IM、邮件）",
			"探针结果写入可观测性面板并关联错误预算消耗",
		},
		Notes: []string{
			"探针失败需自动生成事件并关联 runbook。",
		},
	}
}

func defaultOnCallSLOTable() OnCallSLOTable {
	return OnCallSLOTable{
		Key:     "sre_oncall_slo",
		Title:   "值班与响应时间目标（SLO）",
		Summary: "定义不同等级事件的响应与恢复目标。",
		Targets: []OnCallSLOTarget{
			{
				Severity:        "P1",
				Coverage:        "24x7",
				AckTarget:       "<= 5m",
				MitigateTarget:  "<= 30m",
				UpdateFrequency: "每 15m 更新",
				Measurement:     "告警触发至确认/缓解时间",
				Owner:           "sre_oncall",
			},
			{
				Severity:        "P2",
				Coverage:        "7x16",
				AckTarget:       "<= 15m",
				MitigateTarget:  "<= 2h",
				UpdateFrequency: "每 30m 更新",
				Measurement:     "告警触发至确认/缓解时间",
				Owner:           "platform_oncall",
			},
			{
				Severity:        "P3",
				Coverage:        "工作时间",
				AckTarget:       "<= 4h",
				MitigateTarget:  "<= 3d",
				UpdateFrequency: "每日更新",
				Measurement:     "告警触发至确认/修复时间",
				Owner:           "service_owner",
			},
		},
		Notes: []string{
			"响应目标需与值班表与升级路径保持一致。",
		},
	}
}

func defaultStabilityPlan() StabilityPlan {
	return StabilityPlan{
		Key:     "sre_stability_plan",
		Title:   "回归与稳定性专项计划",
		Summary: "以发布回归、性能基线、依赖治理与故障复发防控为核心。",
		Tracks: []StabilityTrack{
			{
				Key:     "release_regression",
				Title:   "发布回归验证",
				Summary: "确保每次发布前完成核心链路验证与灰度检查。",
				Cadence: "每次发布",
				Scope: []string{
					"Runtime 执行",
					"Workspace / App / Workflow 关键接口",
					"登录与权限校验",
				},
				Actions: []string{
					"执行 smoke + 回归用例集",
					"按 5%/20%/50%/100% 灰度发布",
					"比对 SLO 指标与历史基线",
				},
				Acceptance: []string{
					"无阻断级失败用例",
					"SLO 指标无明显回退",
				},
				Owners: []string{"release_manager", "qa"},
			},
			{
				Key:     "performance_baseline",
				Title:   "性能基线与趋势",
				Summary: "持续观测 P95 延迟与吞吐趋势，快速识别性能回退。",
				Cadence: "每周",
				Scope: []string{
					"Runtime P95 延迟",
					"执行成功率",
					"数据库创建耗时",
				},
				Actions: []string{
					"运行负载基线测试",
					"记录趋势并与上一周期对比",
					"异常阈值触发回归分析",
				},
				Acceptance: []string{
					"核心指标波动 < 10%",
					"性能回退在 48h 内闭环",
				},
				Owners: []string{"sre", "backend"},
			},
			{
				Key:     "dependency_stability",
				Title:   "依赖与运行环境稳定性",
				Summary: "控制依赖升级风险并预防基础设施回归。",
				Cadence: "每月",
				Scope: []string{
					"第三方依赖升级",
					"数据库/缓存版本",
					"运行时基础镜像",
				},
				Actions: []string{
					"依赖更新前执行回归测试",
					"记录变更影响与回滚步骤",
					"维护依赖风险清单",
				},
				Acceptance: []string{
					"升级后无 P1/P2 级回归",
					"回滚流程演练可执行",
				},
				Owners: []string{"platform", "infra"},
			},
		},
		Notes: []string{
			"稳定性专项需产出结论与改进行动项并同步到 WBS。",
		},
	}
}
