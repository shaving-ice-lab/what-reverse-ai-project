package service

import (
	"context"
	"errors"
)

// RunbookPlan SRE 运行手册规划
type RunbookPlan struct {
	Key      string    `json:"key"`
	Title    string    `json:"title"`
	Summary  string    `json:"summary"`
	Runbooks []Runbook `json:"runbooks"`
	Notes    []string  `json:"notes,omitempty"`
}

// Runbook 故障排查手册
type Runbook struct {
	Key           string        `json:"key"`
	Title         string        `json:"title"`
	Summary       string        `json:"summary"`
	Severity      string        `json:"severity"`
	Signals       []string      `json:"signals"`
	Preconditions []string      `json:"preconditions,omitempty"`
	Steps         []RunbookStep `json:"steps"`
	Verification  []string      `json:"verification"`
	Escalation    []string      `json:"escalation"`
	References    []string      `json:"references,omitempty"`
}

// RunbookStep 排查步骤
type RunbookStep struct {
	Phase    string   `json:"phase"`
	Actions  []string `json:"actions"`
	Expected []string `json:"expected,omitempty"`
	Rollback []string `json:"rollback,omitempty"`
}

// PlanRunbookService SRE 运行手册规划服务接口
type PlanRunbookService interface {
	GetPlan(ctx context.Context) (*RunbookPlan, error)
}

type planRunbookService struct {
	plan RunbookPlan
}

// ErrRunbookPlanNotFound 运行手册规划不存在
var ErrRunbookPlanNotFound = errors.New("runbook plan not found")

// NewPlanRunbookService 创建运行手册规划服务
func NewPlanRunbookService() PlanRunbookService {
	return &planRunbookService{
		plan: defaultRunbookPlan(),
	}
}

func (s *planRunbookService) GetPlan(ctx context.Context) (*RunbookPlan, error) {
	if s == nil || s.plan.Key == "" {
		return nil, ErrRunbookPlanNotFound
	}
	output := s.plan
	return &output, nil
}

func defaultRunbookPlan() RunbookPlan {
	return RunbookPlan{
		Key:     "sre_runbook",
		Title:   "SRE 运行手册（Runbook）",
		Summary: "覆盖运行时故障、数据库创建失败、域名与证书异常的排查与恢复流程。",
		Runbooks: []Runbook{
			{
				Key:      "runtime_incident",
				Title:    "运行时故障排查手册",
				Summary:  "定位 Runtime 5xx、执行失败率升高、延迟抖动等运行时异常。",
				Severity: "P1/P2",
				Signals: []string{
					"Runtime 5xx 比例持续高于阈值",
					"执行失败率持续升高或出现批量超时",
					"健康检查失败或延迟 P95 突增",
					"用户反馈关键工作流不可用",
				},
				Preconditions: []string{
					"建立 incident 频道并确认值班负责人",
					"冻结高风险发布或开启变更审批",
					"确认受影响 workspace 与时间窗",
				},
				Steps: []RunbookStep{
					{
						Phase: "检测与定级",
						Actions: []string{
							"检查系统健康概览与错误趋势（GET /api/v1/dashboard/system-health, /api/v1/dashboard/errors）",
							"抽样查看失败执行记录（GET /api/v1/executions?status=failed）",
							"确认是否为单个 workspace / 单个 workflow 问题",
						},
						Expected: []string{
							"明确影响范围、开始时间与主要失败类型",
						},
					},
					{
						Phase: "定位与隔离",
						Actions: []string{
							"定位最近变更的 workflow/workspace 版本（GET /api/v1/workspaces/:id）",
							"检查队列积压与执行超时（GET /api/v1/dashboard/running-queue）",
							"对异常执行进行取消或暂停（POST /api/v1/executions/:id/cancel）",
						},
						Expected: []string{
							"定位主要失败路径或受影响版本",
						},
					},
					{
						Phase: "缓解与回滚",
						Actions: []string{
							"启用降级或限流策略，减少高风险流量",
							"回滚高风险发布版本（POST /api/v1/workspaces/:id/rollback）",
							"如涉及 DB Schema 变更，生成 Schema 回退版本（POST /api/v1/workspaces/:id/db-schema/rollback）",
							"发布 Schema 回退版本（POST /api/v1/workspaces/:id/publish）",
							"必要时临时关闭非关键入口",
						},
						Expected: []string{
							"错误率下降，核心 workflow 恢复可用",
						},
					},
					{
						Phase: "恢复与验证",
						Actions: []string{
							"执行关键 workflow 验证功能恢复",
							"观察 30-60 分钟指标稳定性",
							"记录根因、修复项与改进计划",
						},
						Expected: []string{
							"执行成功率恢复到目标阈值",
						},
					},
				},
				Verification: []string{
					"错误率恢复至基线范围",
					"关键 workflow 执行成功率 >= 99%",
					"监控告警在 30 分钟内无复发",
				},
				Escalation: []string{
					"30 分钟内无明显改善，升级到 P1 并通知基础设施团队",
					"持续影响多个 workspace，触发跨团队协调",
				},
				References: []string{
					"/api/v1/dashboard/system-health",
					"/api/v1/dashboard/errors",
					"/api/v1/executions",
					"/api/v1/executions/:id/cancel",
					"/api/v1/workspaces/:id/rollback",
					"/api/v1/workspaces/:id/db-schema/rollback",
					"/api/v1/workspaces/:id/publish",
				},
			},
			{
				Key:      "db_provision_failed",
				Title:    "DB Provision 失败排查手册",
				Summary:  "排查工作空间数据库创建失败、队列任务失败或状态异常。",
				Severity: "P2/P3",
				Signals: []string{
					"返回 PROVISION_FAILED 或数据库状态为 failed",
					"创建任务长时间处于 provisioning",
					"配额或资源不足提示",
				},
				Preconditions: []string{
					"确认 workspace_id 与操作者权限",
					"确认是否为异步任务或幂等请求",
				},
				Steps: []RunbookStep{
					{
						Phase: "确认状态",
						Actions: []string{
							"查询数据库状态（GET /api/v1/workspaces/:id/database）",
							"确认是否已存在或正在创建（数据库 status / error 字段）",
							"检查队列执行情况（GET /api/v1/dashboard/running-queue）",
						},
						Expected: []string{
							"明确失败原因：配额、队列、基础设施或权限",
						},
					},
					{
						Phase: "资源与配额核查",
						Actions: []string{
							"确认 workspace 是否达到数据库配额上限",
							"检查存储与网络资源是否正常",
							"必要时临时提升配额或迁移至可用区域",
						},
					},
					{
						Phase: "重试与恢复",
						Actions: []string{
							"重新触发创建（POST /api/v1/workspaces/:id/database）",
							"异步任务失败时使用幂等键重试或重新入队",
							"必要时创建后执行迁移/初始化",
						},
						Expected: []string{
							"数据库状态变为 ready，连接信息可用",
						},
					},
				},
				Verification: []string{
					"数据库状态为 ready 且连接测试通过",
					"关键表结构或迁移已完成",
				},
				Escalation: []string{
					"连续两次创建失败，升级到基础设施排查",
					"涉及配额或账单异常时通知商业支持",
				},
				References: []string{
					"/api/v1/workspaces/:id/database",
					"/api/v1/dashboard/running-queue",
					"/api/v1/workspaces/:id/database/migrations/plan",
				},
			},
			{
				Key:      "domain_cert_issue",
				Title:    "域名绑定/证书故障排查手册",
				Summary:  "排查域名验证失败、证书签发失败与证书续期异常。",
				Severity: "P2/P3",
				Signals: []string{
					"域名验证失败（VERIFICATION_FAILED）",
					"证书签发或续期失败",
					"域名状态持续为 pending/blocked",
				},
				Preconditions: []string{
					"确认 workspace_id 与 domain_id",
					"确认 DNS 记录已更新",
				},
				Steps: []RunbookStep{
					{
						Phase: "验证与记录核查",
						Actions: []string{
							"获取域名详情与验证信息（GET /api/v1/workspaces/:id/domains）",
							"使用验证接口重新验证（POST /api/v1/workspaces/:id/domains/:domainId/verify）",
							"确认 DNS 记录和 CNAME 指向正确",
						},
						Expected: []string{
							"域名验证通过或明确 DNS 配置问题",
						},
					},
					{
						Phase: "证书签发与激活",
						Actions: []string{
							"重新签发证书（POST /api/v1/workspaces/:id/domains/:domainId/cert/issue）",
							"证书续期（POST /api/v1/workspaces/:id/domains/:domainId/cert/renew）",
							"激活证书（POST /api/v1/workspaces/:id/domains/:domainId/activate）",
						},
						Rollback: []string{
							"证书不可用时执行回滚（POST /api/v1/workspaces/:id/domains/:domainId/rollback）",
						},
					},
					{
						Phase: "恢复与验证",
						Actions: []string{
							"确认域名状态为 active",
							"验证 HTTPS 访问正常并无证书错误",
						},
					},
				},
				Verification: []string{
					"域名状态为 active，证书状态正常",
					"HTTPS 访问无证书错误或重定向异常",
				},
				Escalation: []string{
					"DNS 解析异常超过 2 小时升级至域名供应商",
					"证书持续签发失败升级至平台基础设施团队",
				},
				References: []string{
					"/api/v1/workspaces/:id/domains",
					"/api/v1/workspaces/:id/domains/:domainId/verify",
					"/api/v1/workspaces/:id/domains/:domainId/cert/issue",
					"/api/v1/workspaces/:id/domains/:domainId/cert/renew",
					"/api/v1/workspaces/:id/domains/:domainId/activate",
					"/api/v1/workspaces/:id/domains/:domainId/rollback",
				},
			},
		},
		Notes: []string{
			"Runbook 应在每次事故复盘后更新并记录改进项。",
			"建议将告警阈值与执行步骤同步到值班手册。",
		},
	}
}
