package service

import (
	"context"
	"errors"
)

// SecurityThreatAsset 威胁建模资产
type SecurityThreatAsset struct {
	Key            string `json:"key"`
	Name           string `json:"name"`
	Classification string `json:"classification"`
	Owner          string `json:"owner"`
	Description    string `json:"description"`
}

// SecurityAttackSurface 攻击面
type SecurityAttackSurface struct {
	Key         string   `json:"key"`
	Name        string   `json:"name"`
	EntryPoints []string `json:"entry_points"`
	Controls    []string `json:"controls,omitempty"`
}

// SecurityThreatCategory STRIDE 分类
type SecurityThreatCategory struct {
	Key         string   `json:"key"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Examples    []string `json:"examples,omitempty"`
}

// SecurityThreatItem 威胁项
type SecurityThreatItem struct {
	Key         string   `json:"key"`
	Title       string   `json:"title"`
	STRIDE      string   `json:"stride"`
	Description string   `json:"description"`
	Assets      []string `json:"assets"`
	EntryPoints []string `json:"entry_points"`
	Controls    []string `json:"controls,omitempty"`
	Gaps        []string `json:"gaps,omitempty"`
	Severity    string   `json:"severity"`
	Owner       string   `json:"owner"`
	TrackingID  string   `json:"tracking_id"`
	Status      string   `json:"status"`
}

// SecurityThreatModel 威胁建模输出
type SecurityThreatModel struct {
	Key            string                   `json:"key"`
	Title          string                   `json:"title"`
	Summary        string                   `json:"summary"`
	Scope          []string                 `json:"scope"`
	Assets         []SecurityThreatAsset    `json:"assets"`
	AttackSurfaces []SecurityAttackSurface  `json:"attack_surfaces"`
	STRIDE         []SecurityThreatCategory `json:"stride"`
	Threats        []SecurityThreatItem     `json:"threats"`
	Checklist      []string                 `json:"checklist,omitempty"`
	Notes          []string                 `json:"notes,omitempty"`
}

// SecurityRiskLevel 风险等级定义
type SecurityRiskLevel struct {
	Key         string `json:"key"`
	Label       string `json:"label"`
	Description string `json:"description"`
	Score       int    `json:"score"`
}

// SecurityRiskCell 风险矩阵单元
type SecurityRiskCell struct {
	Impact     string `json:"impact"`
	Likelihood string `json:"likelihood"`
	Rating     string `json:"rating"`
	Response   string `json:"response"`
	TargetSLA  string `json:"target_sla"`
}

// SecurityMitigationPlaybook 风险缓解措施
type SecurityMitigationPlaybook struct {
	Level             string   `json:"level"`
	Actions           []string `json:"actions"`
	RequiredArtifacts []string `json:"required_artifacts"`
	Escalation        string   `json:"escalation"`
}

// SecurityRiskMatrix 风险分级矩阵
type SecurityRiskMatrix struct {
	Key              string                       `json:"key"`
	Title            string                       `json:"title"`
	Summary          string                       `json:"summary"`
	ImpactLevels     []SecurityRiskLevel          `json:"impact_levels"`
	LikelihoodLevels []SecurityRiskLevel          `json:"likelihood_levels"`
	Cells            []SecurityRiskCell           `json:"cells"`
	Playbook         []SecurityMitigationPlaybook `json:"playbook"`
	Notes            []string                     `json:"notes,omitempty"`
}

// SecurityReviewStage 安全评审阶段
type SecurityReviewStage struct {
	Key          string   `json:"key"`
	Title        string   `json:"title"`
	Owner        string   `json:"owner"`
	Inputs       []string `json:"inputs"`
	Activities   []string `json:"activities"`
	Outputs      []string `json:"outputs"`
	ExitCriteria []string `json:"exit_criteria"`
}

// SecurityReviewRole 评审角色
type SecurityReviewRole struct {
	Role             string   `json:"role"`
	Responsibilities []string `json:"responsibilities"`
}

// SecurityReviewProcess 安全评审流程
type SecurityReviewProcess struct {
	Key               string                `json:"key"`
	Title             string                `json:"title"`
	Summary           string                `json:"summary"`
	Stages            []SecurityReviewStage `json:"stages"`
	GateChecklist     []string              `json:"gate_checklist"`
	RequiredArtifacts []string              `json:"required_artifacts"`
	Roles             []SecurityReviewRole  `json:"roles"`
	Notes             []string              `json:"notes,omitempty"`
}

// PlanSecurityReviewService 安全威胁模型与评审规划服务接口
type PlanSecurityReviewService interface {
	GetThreatModel(ctx context.Context) (*SecurityThreatModel, error)
	GetRiskMatrix(ctx context.Context) (*SecurityRiskMatrix, error)
	GetReviewProcess(ctx context.Context) (*SecurityReviewProcess, error)
}

type planSecurityReviewService struct {
	threatModel   SecurityThreatModel
	riskMatrix    SecurityRiskMatrix
	reviewProcess SecurityReviewProcess
}

// ErrSecurityThreatModelNotFound 威胁建模不存在
var ErrSecurityThreatModelNotFound = errors.New("security threat model not found")

// ErrSecurityRiskMatrixNotFound 风险矩阵不存在
var ErrSecurityRiskMatrixNotFound = errors.New("security risk matrix not found")

// ErrSecurityReviewProcessNotFound 安全评审流程不存在
var ErrSecurityReviewProcessNotFound = errors.New("security review process not found")

// NewPlanSecurityReviewService 创建安全威胁模型与评审规划服务
func NewPlanSecurityReviewService() PlanSecurityReviewService {
	return &planSecurityReviewService{
		threatModel:   defaultSecurityThreatModel(),
		riskMatrix:    defaultSecurityRiskMatrix(),
		reviewProcess: defaultSecurityReviewProcess(),
	}
}

func (s *planSecurityReviewService) GetThreatModel(ctx context.Context) (*SecurityThreatModel, error) {
	if s == nil || s.threatModel.Key == "" {
		return nil, ErrSecurityThreatModelNotFound
	}
	model := s.threatModel
	return &model, nil
}

func (s *planSecurityReviewService) GetRiskMatrix(ctx context.Context) (*SecurityRiskMatrix, error) {
	if s == nil || s.riskMatrix.Key == "" {
		return nil, ErrSecurityRiskMatrixNotFound
	}
	matrix := s.riskMatrix
	return &matrix, nil
}

func (s *planSecurityReviewService) GetReviewProcess(ctx context.Context) (*SecurityReviewProcess, error) {
	if s == nil || s.reviewProcess.Key == "" {
		return nil, ErrSecurityReviewProcessNotFound
	}
	process := s.reviewProcess
	return &process, nil
}

func defaultSecurityThreatModel() SecurityThreatModel {
	return SecurityThreatModel{
		Key:     "security_threat_model",
		Title:   "安全威胁模型（STRIDE）",
		Summary: "覆盖 Workspace/App/Runtime/Domain/Webhook/DB 等核心入口的威胁清单。",
		Scope: []string{
			"workspace",
			"app",
			"runtime",
			"domain",
			"webhook",
			"workspace_db",
			"audit_log",
		},
		Assets: []SecurityThreatAsset{
			{
				Key:            "workspace_data",
				Name:           "Workspace 元数据",
				Classification: "P1",
				Owner:          "backend",
				Description:    "workspace 信息、成员、权限与配置。",
			},
			{
				Key:            "app_configs",
				Name:           "App 配置与访问策略",
				Classification: "P1",
				Owner:          "backend",
				Description:    "workflow 配置、access policy 与版本信息。",
			},
			{
				Key:            "runtime_executions",
				Name:           "Runtime 执行数据",
				Classification: "P0",
				Owner:          "runtime",
				Description:    "执行输入/输出、执行日志与用量数据。",
			},
			{
				Key:            "secrets_api_keys",
				Name:           "Secrets / API Keys",
				Classification: "P0",
				Owner:          "security",
				Description:    "密钥、连接串与第三方凭证。",
			},
			{
				Key:            "workspace_db",
				Name:           "Workspace 数据库",
				Classification: "P0",
				Owner:          "database",
				Description:    "用户业务数据与配置数据。",
			},
			{
				Key:            "audit_logs",
				Name:           "审计日志",
				Classification: "P1",
				Owner:          "security",
				Description:    "敏感操作与安全事件记录。",
			},
		},
		AttackSurfaces: []SecurityAttackSurface{
			{
				Key:  "public_runtime",
				Name: "Runtime 公网入口",
				EntryPoints: []string{
					"POST /runtime/{workspaceSlug}/{appSlug}",
					"POST /api/v1/runtime/execute",
				},
				Controls: []string{
					"app access policy",
					"rate_limit_json",
					"captcha_token",
				},
			},
			{
				Key:  "management_api",
				Name: "管理 API",
				EntryPoints: []string{
					"/api/v1/workspaces",
					"/api/v1/apps",
					"/api/v1/secrets",
				},
				Controls: []string{
					"JWT + workspace permissions",
					"audit logs",
				},
			},
			{
				Key:  "webhook_nodes",
				Name: "Webhook 节点",
				EntryPoints: []string{
					"webhook executor",
					"outbound callbacks",
				},
				Controls: []string{
					"IP whitelist",
					"method allowlist",
					"签名校验",
				},
			},
			{
				Key:  "domain_routing",
				Name: "域名路由",
				EntryPoints: []string{
					"custom domain routing",
					"TLS cert issuance",
				},
				Controls: []string{
					"domain verification token",
					"cert issuance audit",
				},
			},
		},
		STRIDE: []SecurityThreatCategory{
			{
				Key:         "spoofing",
				Title:       "S - Spoofing",
				Description: "身份伪造与凭证冒用。",
				Examples: []string{
					"API key/Session 冒用",
					"域名验证伪造",
				},
			},
			{
				Key:         "tampering",
				Title:       "T - Tampering",
				Description: "数据与请求被篡改。",
				Examples: []string{
					"请求 payload 被修改",
					"配置被越权变更",
				},
			},
			{
				Key:         "repudiation",
				Title:       "R - Repudiation",
				Description: "操作不可追溯。",
				Examples: []string{
					"缺少审计链路",
				},
			},
			{
				Key:         "information_disclosure",
				Title:       "I - Information Disclosure",
				Description: "敏感数据泄漏。",
				Examples: []string{
					"日志泄漏 PII",
					"密钥明文暴露",
				},
			},
			{
				Key:         "denial_of_service",
				Title:       "D - Denial of Service",
				Description: "服务可用性受损。",
				Examples: []string{
					"高频请求导致资源耗尽",
				},
			},
			{
				Key:         "elevation_of_privilege",
				Title:       "E - Elevation of Privilege",
				Description: "权限提升与越权访问。",
				Examples: []string{
					"角色配置缺陷",
				},
			},
		},
		Threats: []SecurityThreatItem{
			{
				Key:         "runtime_token_spoofing",
				Title:       "运行时请求身份伪造",
				STRIDE:      "spoofing",
				Description: "攻击者利用泄露的 API key 或 session_id 访问 runtime。",
				Assets:      []string{"runtime_executions", "app_configs"},
				EntryPoints: []string{"public_runtime"},
				Controls: []string{
					"JWT/API key",
					"rate_limit_json",
					"captcha_token",
				},
				Gaps: []string{
					"高风险 workspace 强制 key 轮换",
					"异常访问告警升级",
				},
				Severity:   "high",
				Owner:      "security",
				TrackingID: "SEC-THREAT-001",
				Status:     "open",
			},
			{
				Key:         "webhook_signature_replay",
				Title:       "Webhook 签名重放",
				STRIDE:      "tampering",
				Description: "重放带签名的 webhook 请求绕过安全校验。",
				Assets:      []string{"runtime_executions"},
				EntryPoints: []string{"webhook_nodes"},
				Controls: []string{
					"签名验证",
					"timestamp header",
				},
				Gaps: []string{
					"timestamp window 约束",
					"nonce 去重存储",
				},
				Severity:   "medium",
				Owner:      "backend",
				TrackingID: "SEC-THREAT-002",
				Status:     "planned",
			},
			{
				Key:         "config_tampering",
				Title:       "配置越权修改",
				STRIDE:      "tampering",
				Description: "低权限成员修改 App/Workspace 关键配置。",
				Assets:      []string{"workspace_data", "app_configs"},
				EntryPoints: []string{"management_api"},
				Controls: []string{
					"workspace permissions",
					"audit logs",
				},
				Gaps: []string{
					"高风险操作二次确认",
				},
				Severity:   "high",
				Owner:      "backend",
				TrackingID: "SEC-THREAT-003",
				Status:     "open",
			},
			{
				Key:         "audit_log_gap",
				Title:       "审计日志不完整",
				STRIDE:      "repudiation",
				Description: "关键安全事件缺少审计追踪，导致无法溯源。",
				Assets:      []string{"audit_logs"},
				EntryPoints: []string{"management_api", "public_runtime"},
				Controls: []string{
					"audit recorder",
					"runtime event logs",
				},
				Gaps: []string{
					"覆盖所有高风险 API",
				},
				Severity:   "medium",
				Owner:      "security",
				TrackingID: "SEC-THREAT-004",
				Status:     "open",
			},
			{
				Key:         "pii_disclosure_logs",
				Title:       "日志泄漏 PII",
				STRIDE:      "information_disclosure",
				Description: "执行日志或审计日志包含敏感字段。",
				Assets:      []string{"runtime_executions", "audit_logs"},
				EntryPoints: []string{"management_api"},
				Controls: []string{
					"PII sanitization",
					"masking rules",
				},
				Gaps: []string{
					"新增敏感字段自动检测",
				},
				Severity:   "high",
				Owner:      "security",
				TrackingID: "SEC-THREAT-005",
				Status:     "open",
			},
			{
				Key:         "runtime_dos",
				Title:       "Runtime 资源耗尽",
				STRIDE:      "denial_of_service",
				Description: "高频请求导致队列拥塞或执行资源耗尽。",
				Assets:      []string{"runtime_executions"},
				EntryPoints: []string{"public_runtime"},
				Controls: []string{
					"rate_limit_json",
					"execution timeout",
				},
				Gaps: []string{
					"自动降级与熔断策略",
				},
				Severity:   "critical",
				Owner:      "runtime",
				TrackingID: "SEC-THREAT-006",
				Status:     "open",
			},
			{
				Key:         "role_privilege_escalation",
				Title:       "权限提升",
				STRIDE:      "elevation_of_privilege",
				Description: "角色/权限配置不当导致越权访问。",
				Assets:      []string{"workspace_data", "app_configs"},
				EntryPoints: []string{"management_api"},
				Controls: []string{
					"workspace role checks",
				},
				Gaps: []string{
					"权限变更审批记录",
				},
				Severity:   "high",
				Owner:      "backend",
				TrackingID: "SEC-THREAT-007",
				Status:     "open",
			},
		},
		Checklist: []string{
			"每个 Threat 标记 STRIDE 分类与责任人",
			"记录现有控制与缺口",
			"高风险威胁必须关联风险矩阵与缓解措施",
		},
		Notes: []string{
			"威胁清单需与审计日志、运行时监控联动更新。",
		},
	}
}

func defaultSecurityRiskMatrix() SecurityRiskMatrix {
	return SecurityRiskMatrix{
		Key:     "security_risk_matrix",
		Title:   "风险分级与缓解矩阵",
		Summary: "按影响度与发生概率分级，定义响应与缓解 SLA。",
		ImpactLevels: []SecurityRiskLevel{
			{Key: "low", Label: "低", Description: "对单个用户影响轻微", Score: 1},
			{Key: "medium", Label: "中", Description: "影响多用户或非关键数据", Score: 2},
			{Key: "high", Label: "高", Description: "影响核心功能或敏感数据", Score: 3},
			{Key: "critical", Label: "严重", Description: "影响全局或合规风险", Score: 4},
		},
		LikelihoodLevels: []SecurityRiskLevel{
			{Key: "rare", Label: "罕见", Description: "极低发生概率", Score: 1},
			{Key: "possible", Label: "可能", Description: "存在触发条件", Score: 2},
			{Key: "likely", Label: "较高", Description: "在生产环境可复现", Score: 3},
			{Key: "frequent", Label: "高频", Description: "频繁发生或可批量触发", Score: 4},
		},
		Cells: []SecurityRiskCell{
			{Impact: "low", Likelihood: "rare", Rating: "low", Response: "记录并观察", TargetSLA: "60d"},
			{Impact: "low", Likelihood: "possible", Rating: "low", Response: "纳入待办", TargetSLA: "60d"},
			{Impact: "low", Likelihood: "likely", Rating: "medium", Response: "安排修复", TargetSLA: "30d"},
			{Impact: "low", Likelihood: "frequent", Rating: "medium", Response: "安排修复+监控", TargetSLA: "30d"},
			{Impact: "medium", Likelihood: "rare", Rating: "medium", Response: "排期修复", TargetSLA: "30d"},
			{Impact: "medium", Likelihood: "possible", Rating: "medium", Response: "排期修复", TargetSLA: "30d"},
			{Impact: "medium", Likelihood: "likely", Rating: "high", Response: "优先修复", TargetSLA: "7d"},
			{Impact: "medium", Likelihood: "frequent", Rating: "high", Response: "优先修复+回滚准备", TargetSLA: "7d"},
			{Impact: "high", Likelihood: "rare", Rating: "high", Response: "优先修复", TargetSLA: "7d"},
			{Impact: "high", Likelihood: "possible", Rating: "high", Response: "优先修复+安全评审", TargetSLA: "7d"},
			{Impact: "high", Likelihood: "likely", Rating: "critical", Response: "阻塞发布", TargetSLA: "24h"},
			{Impact: "high", Likelihood: "frequent", Rating: "critical", Response: "阻塞发布+紧急修复", TargetSLA: "24h"},
			{Impact: "critical", Likelihood: "rare", Rating: "critical", Response: "阻塞发布", TargetSLA: "24h"},
			{Impact: "critical", Likelihood: "possible", Rating: "critical", Response: "阻塞发布+紧急修复", TargetSLA: "24h"},
			{Impact: "critical", Likelihood: "likely", Rating: "critical", Response: "阻塞发布+应急响应", TargetSLA: "24h"},
			{Impact: "critical", Likelihood: "frequent", Rating: "critical", Response: "立即停机+应急响应", TargetSLA: "4h"},
		},
		Playbook: []SecurityMitigationPlaybook{
			{
				Level: "low",
				Actions: []string{
					"记录风险与监控指标",
					"安排非阻塞修复",
				},
				RequiredArtifacts: []string{"风险描述", "责任人"},
				Escalation:        "无",
			},
			{
				Level: "medium",
				Actions: []string{
					"补充控制与告警",
					"30 天内完成修复",
				},
				RequiredArtifacts: []string{"修复计划", "验证步骤"},
				Escalation:        "安全负责人确认",
			},
			{
				Level: "high",
				Actions: []string{
					"7 天内完成修复",
					"灰度验证与回滚预案",
				},
				RequiredArtifacts: []string{"修复方案", "回滚计划", "测试报告"},
				Escalation:        "安全 + 负责人双签",
			},
			{
				Level: "critical",
				Actions: []string{
					"阻塞发布",
					"24 小时内修复或降级",
					"启动应急响应",
				},
				RequiredArtifacts: []string{"紧急修复方案", "应急预案", "复盘计划"},
				Escalation:        "安全 + 业务负责人审批",
			},
		},
		Notes: []string{
			"风险等级需与 Threat 追踪 ID 绑定，便于审计与回溯。",
		},
	}
}

func defaultSecurityReviewProcess() SecurityReviewProcess {
	return SecurityReviewProcess{
		Key:     "security_review_process",
		Title:   "安全评审流程",
		Summary: "上线必经流程，覆盖需求、设计、实现与发布。",
		Stages: []SecurityReviewStage{
			{
				Key:   "intake",
				Title: "需求受理",
				Owner: "product",
				Inputs: []string{
					"需求说明",
					"数据分类/范围",
				},
				Activities: []string{
					"确认数据敏感级别",
					"识别安全相关需求",
				},
				Outputs: []string{
					"评审范围说明",
					"安全责任人",
				},
				ExitCriteria: []string{
					"明确评审范围与边界",
				},
			},
			{
				Key:   "threat_modeling",
				Title: "威胁建模",
				Owner: "security",
				Inputs: []string{
					"系统架构/数据流图",
					"威胁模型模板",
				},
				Activities: []string{
					"STRIDE 分类",
					"风险分级与缓解建议",
				},
				Outputs: []string{
					"威胁清单",
					"风险矩阵",
				},
				ExitCriteria: []string{
					"高风险威胁有明确缓解方案",
				},
			},
			{
				Key:   "design_review",
				Title: "方案评审",
				Owner: "backend",
				Inputs: []string{
					"技术方案",
					"权限与访问策略设计",
				},
				Activities: []string{
					"校验访问控制",
					"确认日志与审计覆盖",
				},
				Outputs: []string{
					"设计评审结论",
					"待办项清单",
				},
				ExitCriteria: []string{
					"风险缓解措施纳入实现计划",
				},
			},
			{
				Key:   "implementation_review",
				Title: "实现评审",
				Owner: "security",
				Inputs: []string{
					"代码变更说明",
					"测试报告",
				},
				Activities: []string{
					"安全测试与依赖扫描",
					"检查审计/脱敏/限流",
				},
				Outputs: []string{
					"安全测试结果",
					"修复清单",
				},
				ExitCriteria: []string{
					"高风险项已关闭或完成豁免审批",
				},
			},
			{
				Key:   "pre_release_gate",
				Title: "上线准入",
				Owner: "ops",
				Inputs: []string{
					"发布计划",
					"回滚方案",
				},
				Activities: []string{
					"确认风险等级",
					"验证监控与告警",
				},
				Outputs: []string{
					"上线批准",
					"回滚演练记录",
				},
				ExitCriteria: []string{
					"通过安全准入检查",
				},
			},
			{
				Key:   "post_release",
				Title: "上线后复盘",
				Owner: "security",
				Inputs: []string{
					"监控数据",
					"告警/事件记录",
				},
				Activities: []string{
					"复盘潜在安全事件",
					"更新威胁模型",
				},
				Outputs: []string{
					"复盘记录",
					"改进项列表",
				},
				ExitCriteria: []string{
					"改进项有明确负责人",
				},
			},
		},
		GateChecklist: []string{
			"威胁清单与风险矩阵已完成",
			"高风险措施已落地或审批豁免",
			"依赖扫描与安全测试通过",
			"监控/告警覆盖关键路径",
			"回滚方案可执行",
		},
		RequiredArtifacts: []string{
			"威胁模型",
			"风险矩阵",
			"访问控制设计",
			"安全测试报告",
			"回滚计划",
		},
		Roles: []SecurityReviewRole{
			{
				Role: "security",
				Responsibilities: []string{
					"风险评估与威胁建模",
					"安全测试与准入审核",
				},
			},
			{
				Role: "backend",
				Responsibilities: []string{
					"实现控制措施",
					"补齐审计与日志",
				},
			},
			{
				Role: "product",
				Responsibilities: []string{
					"确认业务影响与范围",
					"推动风险关闭",
				},
			},
			{
				Role: "ops",
				Responsibilities: []string{
					"上线准入与回滚保障",
					"监控与告警配置",
				},
			},
		},
		Notes: []string{
			"安全评审作为发布门禁，未完成不得上线。",
		},
	}
}
