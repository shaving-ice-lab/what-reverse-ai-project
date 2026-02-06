package service

import (
	"context"
	"errors"
)

// SecurityPenTestPlan 渗透测试计划
type SecurityPenTestPlan struct {
	Key           string             `json:"key"`
	Title         string             `json:"title"`
	Summary       string             `json:"summary"`
	Cadence       string             `json:"cadence"`
	Scope         []string           `json:"scope"`
	Methodology   []string           `json:"methodology"`
	Preconditions []string           `json:"preconditions"`
	Steps         []SecurityPlanStep `json:"steps"`
	Deliverables  []string           `json:"deliverables"`
	Validation    []string           `json:"validation"`
	Owners        []string           `json:"owners"`
	References    []string           `json:"references,omitempty"`
}

// SecurityPlanStep 计划步骤
type SecurityPlanStep struct {
	Stage   string   `json:"stage"`
	Actions []string `json:"actions"`
	Output  string   `json:"output"`
}

// VulnerabilityScanProcess 依赖与镜像漏洞扫描流程
type VulnerabilityScanProcess struct {
	Key        string                  `json:"key"`
	Title      string                  `json:"title"`
	Summary    string                  `json:"summary"`
	Cadence    string                  `json:"cadence"`
	Targets    []string                `json:"targets"`
	Tools      []string                `json:"tools"`
	Workflow   []string                `json:"workflow"`
	Gates      []VulnerabilityScanGate `json:"gates"`
	Reporting  []string                `json:"reporting"`
	Owners     []string                `json:"owners"`
	References []string                `json:"references,omitempty"`
}

// VulnerabilityScanGate 漏洞扫描阻断策略
type VulnerabilityScanGate struct {
	Severity string `json:"severity"`
	Action   string `json:"action"`
	SLA      string `json:"sla"`
}

// VulnerabilityReportChannel 漏洞报告通道
type VulnerabilityReportChannel struct {
	Channel     string `json:"channel"`
	Description string `json:"description"`
	Owner       string `json:"owner"`
}

// BugBountyProgram 漏洞报告与 Bug Bounty 流程
type BugBountyProgram struct {
	Key                string                       `json:"key"`
	Title              string                       `json:"title"`
	Summary            string                       `json:"summary"`
	Channels           []VulnerabilityReportChannel `json:"channels"`
	ReportRequirements []string                     `json:"report_requirements"`
	SLA                []string                     `json:"sla"`
	SafeHarbor         []string                     `json:"safe_harbor"`
	OutOfScope         []string                     `json:"out_of_scope"`
	RewardPolicy       []string                     `json:"reward_policy"`
	Notes              []string                     `json:"notes,omitempty"`
}

// VulnerabilityResponseProcess 漏洞响应与披露流程
type VulnerabilityResponseProcess struct {
	Key              string                        `json:"key"`
	Title            string                        `json:"title"`
	Summary          string                        `json:"summary"`
	SeverityMatrix   []VulnerabilitySeverity       `json:"severity_matrix"`
	Workflow         []VulnerabilityResponseStage  `json:"workflow"`
	DisclosurePolicy VulnerabilityDisclosurePolicy `json:"disclosure_policy"`
	Validation       []string                      `json:"validation"`
	Owners           []string                      `json:"owners"`
}

// VulnerabilitySeverity 漏洞严重级别定义
type VulnerabilitySeverity struct {
	Severity   string   `json:"severity"`
	Definition string   `json:"definition"`
	SLA        string   `json:"sla"`
	Examples   []string `json:"examples"`
}

// VulnerabilityResponseStage 漏洞响应阶段
type VulnerabilityResponseStage struct {
	Stage   string   `json:"stage"`
	Actions []string `json:"actions"`
	Output  string   `json:"output"`
}

// VulnerabilityDisclosurePolicy 披露策略
type VulnerabilityDisclosurePolicy struct {
	Timeline   string   `json:"timeline"`
	Conditions []string `json:"conditions"`
	Channels   []string `json:"channels"`
	Exceptions []string `json:"exceptions"`
}

// PlanSecurityTestingService 安全测试与漏洞响应规划服务接口
type PlanSecurityTestingService interface {
	GetPenTestPlan(ctx context.Context) (*SecurityPenTestPlan, error)
	GetVulnerabilityScanProcess(ctx context.Context) (*VulnerabilityScanProcess, error)
	GetBugBountyProgram(ctx context.Context) (*BugBountyProgram, error)
	GetVulnerabilityResponseProcess(ctx context.Context) (*VulnerabilityResponseProcess, error)
}

type planSecurityTestingService struct {
	penTestPlan     SecurityPenTestPlan
	scanProcess     VulnerabilityScanProcess
	bugBounty       BugBountyProgram
	responseProcess VulnerabilityResponseProcess
}

// ErrSecurityPenTestPlanNotFound 渗透测试计划不存在
var ErrSecurityPenTestPlanNotFound = errors.New("security pen test plan not found")

// ErrVulnerabilityScanProcessNotFound 漏洞扫描流程不存在
var ErrVulnerabilityScanProcessNotFound = errors.New("vulnerability scan process not found")

// ErrBugBountyProgramNotFound 漏洞报告流程不存在
var ErrBugBountyProgramNotFound = errors.New("bug bounty program not found")

// ErrVulnerabilityResponseProcessNotFound 漏洞响应流程不存在
var ErrVulnerabilityResponseProcessNotFound = errors.New("vulnerability response process not found")

// NewPlanSecurityTestingService 创建安全测试与漏洞响应规划服务
func NewPlanSecurityTestingService() PlanSecurityTestingService {
	return &planSecurityTestingService{
		penTestPlan:     defaultSecurityPenTestPlan(),
		scanProcess:     defaultVulnerabilityScanProcess(),
		bugBounty:       defaultBugBountyProgram(),
		responseProcess: defaultVulnerabilityResponseProcess(),
	}
}

func (s *planSecurityTestingService) GetPenTestPlan(ctx context.Context) (*SecurityPenTestPlan, error) {
	if s == nil || s.penTestPlan.Key == "" {
		return nil, ErrSecurityPenTestPlanNotFound
	}
	output := s.penTestPlan
	return &output, nil
}

func (s *planSecurityTestingService) GetVulnerabilityScanProcess(ctx context.Context) (*VulnerabilityScanProcess, error) {
	if s == nil || s.scanProcess.Key == "" {
		return nil, ErrVulnerabilityScanProcessNotFound
	}
	output := s.scanProcess
	return &output, nil
}

func (s *planSecurityTestingService) GetBugBountyProgram(ctx context.Context) (*BugBountyProgram, error) {
	if s == nil || s.bugBounty.Key == "" {
		return nil, ErrBugBountyProgramNotFound
	}
	output := s.bugBounty
	return &output, nil
}

func (s *planSecurityTestingService) GetVulnerabilityResponseProcess(ctx context.Context) (*VulnerabilityResponseProcess, error) {
	if s == nil || s.responseProcess.Key == "" {
		return nil, ErrVulnerabilityResponseProcessNotFound
	}
	output := s.responseProcess
	return &output, nil
}

func defaultSecurityPenTestPlan() SecurityPenTestPlan {
	return SecurityPenTestPlan{
		Key:     "security_pentest_plan",
		Title:   "周期性渗透测试计划",
		Summary: "每半年进行外部渗透测试、每季度执行内部复测，覆盖公开访问、控制台、API 与权限边界。",
		Cadence: "外部：每半年 1 次；内部复测：每季度 1 次",
		Scope: []string{
			"公开访问入口（App 公开页面 / Runtime）",
			"控制台登录、工作空间管理与权限配置",
			"Workspace/API 关键管理接口",
			"Webhook/回调与第三方集成入口",
			"导出、密钥、配置中心等高风险功能",
		},
		Methodology: []string{
			"OWASP ASVS + OWASP API Top 10",
			"基于威胁模型的攻击路径验证",
			"黑盒与灰盒结合（最小权限账号）",
		},
		Preconditions: []string{
			"准备隔离的测试环境与测试账号",
			"测试 IP 白名单与告警开启",
			"明确测试时间窗口与回滚预案",
		},
		Steps: []SecurityPlanStep{
			{
				Stage: "准备与范围确认",
				Actions: []string{
					"确认资产清单与测试边界",
					"冻结高风险变更并准备回滚负责人",
					"收集最新架构与数据流图",
				},
				Output: "渗透测试范围说明与时间表",
			},
			{
				Stage: "执行与复测",
				Actions: []string{
					"执行核心链路测试（登录、权限、公开访问、API）",
					"记录漏洞 PoC 与影响范围",
					"修复后复测并更新漏洞状态",
				},
				Output: "漏洞清单与复测记录",
			},
			{
				Stage: "报告与改进",
				Actions: []string{
					"输出修复建议与优先级",
					"更新安全基线与测试用例",
					"复盘测试过程并追踪修复 SLA",
				},
				Output: "渗透测试报告与整改清单",
			},
		},
		Deliverables: []string{
			"漏洞清单（含 PoC、影响范围、修复建议）",
			"复测验证记录与修复状态",
			"安全基线与测试用例更新记录",
		},
		Validation: []string{
			"高危漏洞 7 天内完成修复并复测",
			"中危漏洞 30 天内完成修复并复测",
			"渗透测试报告提交并完成复盘",
		},
		Owners: []string{"security", "backend", "frontend", "ops"},
		References: []string{
			"apps/web/src/app/(unauth)/security/page.tsx",
			"docs/DEV-PLAN-WORKSPACE-APP-PLATFORM.md",
		},
	}
}

func defaultVulnerabilityScanProcess() VulnerabilityScanProcess {
	return VulnerabilityScanProcess{
		Key:     "vulnerability_scanning",
		Title:   "依赖与镜像漏洞扫描流程",
		Summary: "CI 自动执行依赖、密钥与 SAST 扫描，镜像构建前执行漏洞扫描并生成报告。",
		Cadence: "每次 push/PR + 每周定时 + 发布前",
		Targets: []string{
			"Go 依赖与二进制",
			"Node.js 依赖（apps/web、packages/sdk）",
			"容器镜像（Runtime/Worker）",
			"密钥泄露与敏感信息",
		},
		Tools: []string{
			"govulncheck",
			"gosec",
			"npm audit",
			"CodeQL",
			"gitleaks",
			"trivy（镜像扫描）",
		},
		Workflow: []string{
			"执行 `.github/workflows/security-scan.yml` 进行依赖与 SAST 扫描",
			"上传 SARIF 至 GitHub Security，生成周报汇总",
			"镜像构建阶段执行 `trivy image --severity HIGH,CRITICAL` 并阻断高危",
			"生成 SBOM 并存档（与镜像签名一起进入发布记录）",
		},
		Gates: []VulnerabilityScanGate{
			{
				Severity: "critical",
				Action:   "阻断合并/发布，24h 内修复或回滚",
				SLA:      "24h",
			},
			{
				Severity: "high",
				Action:   "阻断发布，7 天内修复或隔离",
				SLA:      "7d",
			},
			{
				Severity: "medium",
				Action:   "创建工单并排期修复",
				SLA:      "30d",
			},
			{
				Severity: "low",
				Action:   "记录到安全技术债清单",
				SLA:      "90d",
			},
		},
		Reporting: []string{
			"扫描结果同步到安全看板与周报",
			"高危事件进入安全事件响应流程",
		},
		Owners: []string{"security", "devops"},
		References: []string{
			".github/workflows/security-scan.yml",
			".gitleaks.toml",
		},
	}
}

func defaultBugBountyProgram() BugBountyProgram {
	return BugBountyProgram{
		Key:     "vulnerability_report_channel",
		Title:   "漏洞报告与 Bug Bounty 通道",
		Summary: "提供统一安全报告入口，定义报告要求与响应 SLA。",
		Channels: []VulnerabilityReportChannel{
			{
				Channel:     "security@agentflow.ai",
				Description: "安全团队官方邮箱，支持加密邮件与附件",
				Owner:       "security",
			},
			{
				Channel:     "/contact?type=security",
				Description: "官网安全联系表单（自动生成工单）",
				Owner:       "support",
			},
		},
		ReportRequirements: []string{
			"漏洞描述、复现步骤与影响范围",
			"受影响的端点/功能与版本信息",
			"PoC/截图/日志（可脱敏）",
			"期望的公开披露时间线",
		},
		SLA: []string{
			"24 小时内确认收到",
			"72 小时内完成初步评估并给出修复计划",
			"高危漏洞 7 天内完成修复与复测",
		},
		SafeHarbor: []string{
			"遵循负责任披露，不进行数据破坏或扩散",
			"仅在授权范围内测试，不影响生产稳定性",
			"发现敏感数据需立即停止并通知安全团队",
		},
		OutOfScope: []string{
			"社会工程学与钓鱼攻击",
			"拒绝服务（DoS）压力测试",
			"已失效或无法复现的漏洞",
		},
		RewardPolicy: []string{
			"根据严重等级、影响范围与复现质量评估奖励",
			"对高质量报告提供公开致谢（可选）",
		},
		Notes: []string{
			"如需支持 PGP，可在邮件中请求公钥。",
		},
	}
}

func defaultVulnerabilityResponseProcess() VulnerabilityResponseProcess {
	return VulnerabilityResponseProcess{
		Key:     "vulnerability_response",
		Title:   "漏洞响应与披露流程",
		Summary: "定义漏洞分级、修复、验证与披露时间线，确保可执行与可追踪。",
		SeverityMatrix: []VulnerabilitySeverity{
			{
				Severity:   "critical",
				Definition: "可导致大规模数据泄露或远程代码执行",
				SLA:        "24h 完成临时缓解，7d 内修复并复测",
				Examples:   []string{"RCE", "敏感数据批量泄露", "跨租户访问"},
			},
			{
				Severity:   "high",
				Definition: "影响核心功能或权限绕过",
				SLA:        "72h 内给出修复计划，14d 内修复并复测",
				Examples:   []string{"权限绕过", "认证绕过", "高价值数据泄露"},
			},
			{
				Severity:   "medium",
				Definition: "影响受限范围或需要特定条件触发",
				SLA:        "30d 内修复并复测",
				Examples:   []string{"信息泄露", "配置错误"},
			},
			{
				Severity:   "low",
				Definition: "低风险或理论性问题",
				SLA:        "90d 内修复或接受风险",
				Examples:   []string{"低风险信息暴露"},
			},
		},
		Workflow: []VulnerabilityResponseStage{
			{
				Stage: "Triage",
				Actions: []string{
					"确认漏洞可复现与影响范围",
					"分配严重等级与责任人",
					"创建跟踪工单与审计记录",
				},
				Output: "漏洞分级与响应负责人",
			},
			{
				Stage: "Containment",
				Actions: []string{
					"启用临时缓解措施（限流/封禁/配置开关）",
					"必要时触发安全告警与状态通报",
				},
				Output: "风险缓解记录",
			},
			{
				Stage: "Fix & Verify",
				Actions: []string{
					"完成修复并补充回归测试",
					"复测漏洞与相关攻击路径",
				},
				Output: "修复版本与复测结果",
			},
			{
				Stage: "Release & Disclosure",
				Actions: []string{
					"发布补丁并通知受影响客户",
					"按披露政策发布安全公告",
				},
				Output: "安全公告与客户通知记录",
			},
		},
		DisclosurePolicy: VulnerabilityDisclosurePolicy{
			Timeline: "默认 90 天协调披露窗口（紧急风险可提前）",
			Conditions: []string{
				"修复完成且复测通过",
				"通知受影响客户并提供缓解建议",
			},
			Channels: []string{
				"安全公告页/邮件通知",
				"漏洞报告人确认",
			},
			Exceptions: []string{
				"正在被主动利用时，优先发布临时缓解与公告",
			},
		},
		Validation: []string{
			"所有高危漏洞需完成复测并记录证据",
			"披露内容需完成合规与法务审阅",
		},
		Owners: []string{"security", "backend", "ops", "support"},
	}
}
