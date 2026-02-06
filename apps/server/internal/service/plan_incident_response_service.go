package service

import (
	"context"
	"errors"
)

// IncidentDrillPlanSet 故障演练计划集合
type IncidentDrillPlanSet struct {
	Key     string              `json:"key"`
	Title   string              `json:"title"`
	Summary string              `json:"summary"`
	Drills  []IncidentDrillPlan `json:"drills"`
	Notes   []string            `json:"notes,omitempty"`
}

// IncidentDrillPlan 单个演练计划
type IncidentDrillPlan struct {
	Key           string                  `json:"key"`
	Title         string                  `json:"title"`
	Severity      string                  `json:"severity"`
	Frequency     string                  `json:"frequency"`
	Objectives    []string                `json:"objectives"`
	Scenarios     []IncidentDrillScenario `json:"scenarios"`
	Preconditions []string                `json:"preconditions"`
	Steps         []IncidentDrillStep     `json:"steps"`
	Validation    []string                `json:"validation"`
	Rollback      []string                `json:"rollback"`
	Owners        []string                `json:"owners"`
	References    []string                `json:"references,omitempty"`
}

// IncidentDrillScenario 演练场景
type IncidentDrillScenario struct {
	Key     string   `json:"key"`
	Title   string   `json:"title"`
	Trigger string   `json:"trigger"`
	Impact  string   `json:"impact"`
	Signals []string `json:"signals"`
}

// IncidentDrillStep 演练步骤
type IncidentDrillStep struct {
	Title    string   `json:"title"`
	Actions  []string `json:"actions"`
	Expected string   `json:"expected,omitempty"`
}

// IncidentOwnerTable 应急响应与回滚责任表
type IncidentOwnerTable struct {
	Key        string               `json:"key"`
	Title      string               `json:"title"`
	Summary    string               `json:"summary"`
	Roles      []IncidentRole       `json:"roles"`
	Escalation []IncidentEscalation `json:"escalation"`
	Notes      []string             `json:"notes,omitempty"`
}

// IncidentRole 应急角色定义
type IncidentRole struct {
	Role             string   `json:"role"`
	Primary          string   `json:"primary"`
	Backup           string   `json:"backup"`
	Responsibilities []string `json:"responsibilities"`
	RequiredSkills   []string `json:"required_skills,omitempty"`
}

// IncidentEscalation 升级路径
type IncidentEscalation struct {
	Level     string `json:"level"`
	Condition string `json:"condition"`
	Action    string `json:"action"`
}

// PostmortemTemplate 事故复盘模板
type PostmortemTemplate struct {
	Key              string              `json:"key"`
	Title            string              `json:"title"`
	Summary          string              `json:"summary"`
	Sections         []PostmortemSection `json:"sections"`
	Checklist        []string            `json:"checklist"`
	ActionItemFields []string            `json:"action_item_fields"`
}

// PostmortemSection 复盘模板分区
type PostmortemSection struct {
	Key       string   `json:"key"`
	Title     string   `json:"title"`
	Questions []string `json:"questions"`
}

// PostmortemProcess 事故复盘流程
type PostmortemProcess struct {
	Key           string            `json:"key"`
	Title         string            `json:"title"`
	Summary       string            `json:"summary"`
	EntryCriteria []string          `json:"entry_criteria"`
	Stages        []PostmortemStage `json:"stages"`
	Roles         []PostmortemRole  `json:"roles"`
	ExitCriteria  []string          `json:"exit_criteria"`
	Notes         []string          `json:"notes,omitempty"`
}

// PostmortemStage 复盘阶段
type PostmortemStage struct {
	Key      string   `json:"key"`
	Title    string   `json:"title"`
	Owner    string   `json:"owner"`
	Duration string   `json:"duration"`
	Inputs   []string `json:"inputs"`
	Actions  []string `json:"actions"`
	Outputs  []string `json:"outputs"`
}

// PostmortemRole 复盘角色定义
type PostmortemRole struct {
	Role             string   `json:"role"`
	Responsibilities []string `json:"responsibilities"`
}

// RootCauseTaxonomy Root Cause 分类与统计
type RootCauseTaxonomy struct {
	Key        string               `json:"key"`
	Title      string               `json:"title"`
	Summary    string               `json:"summary"`
	Dimensions []RootCauseDimension `json:"dimensions"`
	Categories []RootCauseCategory  `json:"categories"`
	Metrics    []RootCauseMetric    `json:"metrics"`
	Notes      []string             `json:"notes,omitempty"`
}

// RootCauseDimension 根因分类维度
type RootCauseDimension struct {
	Key         string   `json:"key"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Values      []string `json:"values"`
}

// RootCauseCategory 根因分类项
type RootCauseCategory struct {
	Key         string   `json:"key"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Tags        []string `json:"tags"`
	Signals     []string `json:"signals"`
	Examples    []string `json:"examples,omitempty"`
}

// RootCauseMetric 根因统计指标
type RootCauseMetric struct {
	Key         string   `json:"key"`
	Title       string   `json:"title"`
	Definition  string   `json:"definition"`
	GroupBy     []string `json:"group_by"`
	Cadence     string   `json:"cadence"`
	Calculation string   `json:"calculation"`
}

// KnowledgeBaseGuide 知识库维护与检索规范
type KnowledgeBaseGuide struct {
	Key                 string                       `json:"key"`
	Title               string                       `json:"title"`
	Summary             string                       `json:"summary"`
	ContentSources      []KnowledgeBaseSource        `json:"content_sources"`
	ContentTypes        []KnowledgeBaseContentType   `json:"content_types"`
	MetadataFields      []KnowledgeBaseMetadataField `json:"metadata_fields"`
	MaintenanceWorkflow []KnowledgeBaseStep          `json:"maintenance_workflow"`
	SearchPlan          KnowledgeBaseSearchPlan      `json:"search_plan"`
	QualityMetrics      []KnowledgeBaseMetric        `json:"quality_metrics"`
	Notes               []string                     `json:"notes,omitempty"`
}

// KnowledgeBaseSource 知识库内容来源
type KnowledgeBaseSource struct {
	Key            string `json:"key"`
	Title          string `json:"title"`
	Description    string `json:"description"`
	Owner          string `json:"owner"`
	RefreshCadence string `json:"refresh_cadence"`
}

// KnowledgeBaseContentType 知识库内容类型
type KnowledgeBaseContentType struct {
	Key       string `json:"key"`
	Title     string `json:"title"`
	Structure string `json:"structure"`
	Usage     string `json:"usage"`
}

// KnowledgeBaseMetadataField 知识库元数据字段
type KnowledgeBaseMetadataField struct {
	Key         string `json:"key"`
	Description string `json:"description"`
	Required    bool   `json:"required"`
}

// KnowledgeBaseStep 知识库维护流程步骤
type KnowledgeBaseStep struct {
	Key          string   `json:"key"`
	Title        string   `json:"title"`
	Owner        string   `json:"owner"`
	Actions      []string `json:"actions"`
	ExitCriteria []string `json:"exit_criteria"`
}

// KnowledgeBaseSearchPlan 知识库检索方案
type KnowledgeBaseSearchPlan struct {
	Strategy       string                    `json:"strategy"`
	IndexFields    []string                  `json:"index_fields"`
	RetrievalSteps []KnowledgeBaseSearchStep `json:"retrieval_steps"`
	RankingSignals []string                  `json:"ranking_signals"`
	FeedbackLoops  []string                  `json:"feedback_loops"`
}

// KnowledgeBaseSearchStep 知识库检索步骤
type KnowledgeBaseSearchStep struct {
	Step        string   `json:"step"`
	Description string   `json:"description"`
	Inputs      []string `json:"inputs"`
	Outputs     []string `json:"outputs"`
}

// KnowledgeBaseMetric 知识库质量指标
type KnowledgeBaseMetric struct {
	Key        string `json:"key"`
	Title      string `json:"title"`
	Definition string `json:"definition"`
	Target     string `json:"target"`
}

// PlanIncidentResponseService 故障演练与应急预案规划服务
type PlanIncidentResponseService interface {
	GetIncidentDrillPlans(ctx context.Context) (*IncidentDrillPlanSet, error)
	GetIncidentOwnerTable(ctx context.Context) (*IncidentOwnerTable, error)
	GetPostmortemTemplate(ctx context.Context) (*PostmortemTemplate, error)
	GetPostmortemProcess(ctx context.Context) (*PostmortemProcess, error)
	GetRootCauseTaxonomy(ctx context.Context) (*RootCauseTaxonomy, error)
	GetKnowledgeBaseGuide(ctx context.Context) (*KnowledgeBaseGuide, error)
}

type planIncidentResponseService struct {
	drillPlans         IncidentDrillPlanSet
	ownerTable         IncidentOwnerTable
	template           PostmortemTemplate
	postmortemProcess  PostmortemProcess
	rootCauseTaxonomy  RootCauseTaxonomy
	knowledgeBaseGuide KnowledgeBaseGuide
}

// ErrIncidentDrillPlanNotFound 演练计划不存在
var ErrIncidentDrillPlanNotFound = errors.New("incident drill plan not found")

// ErrIncidentOwnerTableNotFound 责任表不存在
var ErrIncidentOwnerTableNotFound = errors.New("incident owner table not found")

// ErrPostmortemTemplateNotFound 复盘模板不存在
var ErrPostmortemTemplateNotFound = errors.New("postmortem template not found")

// ErrPostmortemProcessNotFound 复盘流程不存在
var ErrPostmortemProcessNotFound = errors.New("postmortem process not found")

// ErrRootCauseTaxonomyNotFound 根因分类不存在
var ErrRootCauseTaxonomyNotFound = errors.New("root cause taxonomy not found")

// ErrKnowledgeBaseGuideNotFound 知识库规范不存在
var ErrKnowledgeBaseGuideNotFound = errors.New("knowledge base guide not found")

// NewPlanIncidentResponseService 创建故障演练与应急预案规划服务
func NewPlanIncidentResponseService() PlanIncidentResponseService {
	return &planIncidentResponseService{
		drillPlans:         defaultIncidentDrillPlanSet(),
		ownerTable:         defaultIncidentOwnerTable(),
		template:           defaultPostmortemTemplate(),
		postmortemProcess:  defaultPostmortemProcess(),
		rootCauseTaxonomy:  defaultRootCauseTaxonomy(),
		knowledgeBaseGuide: defaultKnowledgeBaseGuide(),
	}
}

func (s *planIncidentResponseService) GetIncidentDrillPlans(ctx context.Context) (*IncidentDrillPlanSet, error) {
	if s == nil || s.drillPlans.Key == "" {
		return nil, ErrIncidentDrillPlanNotFound
	}
	output := s.drillPlans
	return &output, nil
}

func (s *planIncidentResponseService) GetIncidentOwnerTable(ctx context.Context) (*IncidentOwnerTable, error) {
	if s == nil || s.ownerTable.Key == "" {
		return nil, ErrIncidentOwnerTableNotFound
	}
	output := s.ownerTable
	return &output, nil
}

func (s *planIncidentResponseService) GetPostmortemTemplate(ctx context.Context) (*PostmortemTemplate, error) {
	if s == nil || s.template.Key == "" {
		return nil, ErrPostmortemTemplateNotFound
	}
	output := s.template
	return &output, nil
}

func (s *planIncidentResponseService) GetPostmortemProcess(ctx context.Context) (*PostmortemProcess, error) {
	if s == nil || s.postmortemProcess.Key == "" {
		return nil, ErrPostmortemProcessNotFound
	}
	output := s.postmortemProcess
	return &output, nil
}

func (s *planIncidentResponseService) GetRootCauseTaxonomy(ctx context.Context) (*RootCauseTaxonomy, error) {
	if s == nil || s.rootCauseTaxonomy.Key == "" {
		return nil, ErrRootCauseTaxonomyNotFound
	}
	output := s.rootCauseTaxonomy
	return &output, nil
}

func (s *planIncidentResponseService) GetKnowledgeBaseGuide(ctx context.Context) (*KnowledgeBaseGuide, error) {
	if s == nil || s.knowledgeBaseGuide.Key == "" {
		return nil, ErrKnowledgeBaseGuideNotFound
	}
	output := s.knowledgeBaseGuide
	return &output, nil
}

func defaultIncidentDrillPlanSet() IncidentDrillPlanSet {
	return IncidentDrillPlanSet{
		Key:     "incident_drill_plans",
		Title:   "关键故障演练计划",
		Summary: "覆盖 DB Provision、Runtime 超时、域名解析错误三类高频故障演练。",
		Drills: []IncidentDrillPlan{
			{
				Key:       "db_provision_failure",
				Title:     "DB Provision 失败演练",
				Severity:  "P1",
				Frequency: "每季度 1 次",
				Objectives: []string{
					"验证配额、重试与回滚流程可执行",
					"确保审计与告警链路闭环",
				},
				Scenarios: []IncidentDrillScenario{
					{
						Key:     "provision_timeout",
						Title:   "创建超时",
						Trigger: "Provisioning 超过 10 分钟",
						Impact:  "新工作空间无法创建数据库",
						Signals: []string{"数据库状态停留在 provisioning", "告警：db_provision_timeout"},
					},
				},
				Preconditions: []string{
					"演练环境已开启 workspace DB 功能",
					"准备至少 1 个可创建的 workspace",
				},
				Steps: []IncidentDrillStep{
					{
						Title: "确认状态与配额",
						Actions: []string{
							"调用 GET /api/v1/workspaces/:id/database 获取状态",
							"调用 GET /api/v1/billing/workspaces/:id/quota 核对配额",
						},
						Expected: "确认失败原因是配额/超时/系统异常",
					},
					{
						Title: "触发重试与回滚",
						Actions: []string{
							"调用 POST /api/v1/workspaces/:id/database 触发重建",
							"如连续失败，记录失败原因并回滚到 pending 状态",
						},
						Expected: "数据库状态恢复为 ready 或明确失败原因",
					},
					{
						Title: "验证密钥轮换与迁移",
						Actions: []string{
							"调用 POST /api/v1/workspaces/:id/database/rotate-secret",
							"调用 POST /api/v1/workspaces/:id/database/migrate",
						},
						Expected: "数据库可连接且迁移完成",
					},
				},
				Validation: []string{
					"演练结束后数据库状态为 ready",
					"审计日志包含 provision/rotate/migrate 事件",
				},
				Rollback: []string{
					"删除失败的数据库记录并恢复配额",
					"通知业务重试创建流程",
				},
				Owners: []string{"ops", "backend"},
			},
			{
				Key:       "runtime_timeout",
				Title:     "Runtime 超时演练",
				Severity:  "P1",
				Frequency: "每季度 1 次",
				Objectives: []string{
					"验证超时告警、限流与重试策略",
					"验证用户侧回退与降级提示",
				},
				Scenarios: []IncidentDrillScenario{
					{
						Key:     "execution_timeout",
						Title:   "执行超时",
						Trigger: "执行耗时超过 2 分钟",
						Impact:  "用户请求超时",
						Signals: []string{"告警：runtime_timeout", "执行失败率上升"},
					},
				},
				Preconditions: []string{
					"已配置超时阈值与告警规则",
					"准备一个可触发长耗时执行的 workflow",
				},
				Steps: []IncidentDrillStep{
					{
						Title: "确认超时与队列压力",
						Actions: []string{
							"调用 GET /api/v1/workspaces/:id/metrics 查看失败率",
							"查看执行队列中超时任务数量",
						},
						Expected: "确认超时影响范围与队列压力",
					},
					{
						Title: "启用降级与限流",
						Actions: []string{
							"启用 app 限流策略或提高超时保护",
							"通知前端显示降级提示",
						},
						Expected: "超时趋势下降，用户获得降级体验",
					},
				},
				Validation: []string{
					"执行超时告警触发且记录完整",
					"降级策略生效并恢复正常服务",
				},
				Rollback: []string{
					"恢复默认超时阈值与限流策略",
					"清理异常执行队列",
				},
				Owners: []string{"ops", "runtime"},
			},
			{
				Key:       "domain_resolution_error",
				Title:     "域名解析错误演练",
				Severity:  "P1",
				Frequency: "每半年 1 次",
				Objectives: []string{
					"验证域名验证失败的排查流程",
					"验证证书与路由回滚策略",
				},
				Scenarios: []IncidentDrillScenario{
					{
						Key:     "dns_misconfig",
						Title:   "DNS 配置错误",
						Trigger: "域名状态 failed",
						Impact:  "域名无法访问",
						Signals: []string{"告警：domain_failed", "用户反馈域名不可访问"},
					},
				},
				Preconditions: []string{
					"演练域名已绑定至测试 workspace",
					"准备可回滚的 CNAME/TXT 记录",
				},
				Steps: []IncidentDrillStep{
					{
						Title: "确认域名状态",
						Actions: []string{
							"调用 GET /api/v1/workspaces/:id/domains 获取状态",
							"检查 last_verification_error 与 retry 次数",
						},
						Expected: "定位失败原因",
					},
					{
						Title: "修正 DNS 并验证",
						Actions: []string{
							"修正 CNAME/TXT 记录后调用 verify",
							"必要时触发证书签发",
						},
						Expected: "域名状态变为 verified 或 active",
					},
				},
				Validation: []string{
					"域名验证成功且路由可访问",
					"记录回滚与恢复步骤",
				},
				Rollback: []string{
					"恢复默认域名访问入口",
					"撤销错误 DNS 记录",
				},
				Owners: []string{"ops", "support"},
			},
		},
		Notes: []string{
			"演练结束后需产出复盘记录，并更新 SOP/报警策略。",
		},
	}
}

func defaultIncidentOwnerTable() IncidentOwnerTable {
	return IncidentOwnerTable{
		Key:     "incident_owners",
		Title:   "应急响应与回滚责任表",
		Summary: "定义应急角色与升级路径，确保 30 分钟内完成收敛与回滚。",
		Roles: []IncidentRole{
			{
				Role:    "Incident Commander",
				Primary: "ops_lead",
				Backup:  "platform_pm",
				Responsibilities: []string{
					"确认事件级别与处置优先级",
					"协调跨团队资源与回滚决策",
				},
				RequiredSkills: []string{"incident_management", "stakeholder_comms"},
			},
			{
				Role:    "Backend Lead",
				Primary: "backend_lead",
				Backup:  "backend_oncall",
				Responsibilities: []string{
					"定位 API/DB 故障根因",
					"执行数据库与服务回滚",
				},
				RequiredSkills: []string{"database", "service_debug"},
			},
			{
				Role:    "Runtime Lead",
				Primary: "runtime_lead",
				Backup:  "runtime_oncall",
				Responsibilities: []string{
					"处理执行超时与队列阻塞",
					"调整限流/降级策略",
				},
				RequiredSkills: []string{"runtime", "queue"},
			},
			{
				Role:    "Support/Comms",
				Primary: "support_lead",
				Backup:  "support_oncall",
				Responsibilities: []string{
					"用户沟通与状态同步",
					"收集影响范围与反馈",
				},
				RequiredSkills: []string{"customer_success"},
			},
		},
		Escalation: []IncidentEscalation{
			{
				Level:     "P1",
				Condition: "核心服务不可用超过 10 分钟",
				Action:    "触发全员 oncall + CTO 通知",
			},
			{
				Level:     "P2",
				Condition: "部分功能不可用超过 30 分钟",
				Action:    "通知业务负责人 + 发布状态页公告",
			},
		},
		Notes: []string{
			"责任表需与值班表保持同步，演练时验证联系人可用性。",
		},
	}
}

func defaultPostmortemTemplate() PostmortemTemplate {
	return PostmortemTemplate{
		Key:     "incident_postmortem",
		Title:   "事故复盘模板",
		Summary: "用于记录事件影响、根因分析、响应过程与改进项。",
		Sections: []PostmortemSection{
			{
				Key:   "summary",
				Title: "事件概览",
				Questions: []string{
					"事件开始/结束时间是什么？",
					"影响的用户/工作空间数量？",
					"当前状态是否已恢复？",
				},
			},
			{
				Key:   "timeline",
				Title: "时间线",
				Questions: []string{
					"首次告警触发时间",
					"确认影响范围时间",
					"回滚/修复生效时间",
				},
			},
			{
				Key:   "root_cause",
				Title: "根因分析",
				Questions: []string{
					"直接原因是什么？",
					"系统性原因是什么？",
					"为什么未提前发现？",
				},
			},
			{
				Key:   "response",
				Title: "响应过程",
				Questions: []string{
					"采取了哪些措施？",
					"哪些措施有效？",
					"哪些环节需要改进？",
				},
			},
			{
				Key:   "follow_up",
				Title: "改进与行动项",
				Questions: []string{
					"短期修复项有哪些？",
					"中长期改进项有哪些？",
					"需要更新哪些 SOP/监控策略？",
				},
			},
		},
		Checklist: []string{
			"确认所有受影响用户已通知",
			"修复项有明确负责人与截止时间",
			"相关监控/告警已补齐",
		},
		ActionItemFields: []string{
			"action",
			"owner",
			"priority",
			"due_date",
			"status",
		},
	}
}

func defaultPostmortemProcess() PostmortemProcess {
	return PostmortemProcess{
		Key:     "incident_postmortem_process",
		Title:   "事故复盘流程",
		Summary: "在事件恢复后 48 小时内完成复盘与行动项跟踪。",
		EntryCriteria: []string{
			"事件已恢复，影响范围已确认",
			"对外沟通已完成或有明确沟通计划",
			"日志、监控、审计记录已归档",
		},
		Stages: []PostmortemStage{
			{
				Key:      "collect",
				Title:    "资料归档与事件关闭",
				Owner:    "Incident Commander",
				Duration: "T+0~2h",
				Inputs: []string{
					"告警与监控截图",
					"执行/审计日志",
					"用户反馈与工单记录",
				},
				Actions: []string{
					"冻结时间线，确认关键节点",
					"记录影响范围与恢复时间",
					"确认是否需要对外公告更新",
				},
				Outputs: []string{
					"事件概要",
					"时间线草稿",
				},
			},
			{
				Key:      "analysis",
				Title:    "根因分析与分类",
				Owner:    "Tech Lead",
				Duration: "T+2~24h",
				Inputs: []string{
					"时间线草稿",
					"相关配置与变更记录",
				},
				Actions: []string{
					"执行 5 Whys 分析",
					"按 Root Cause 分类打标",
					"识别系统性与流程性问题",
				},
				Outputs: []string{
					"根因结论",
					"影响因素清单",
				},
			},
			{
				Key:      "review",
				Title:    "复盘会议与行动项",
				Owner:    "PM/运营",
				Duration: "T+1~3d",
				Inputs: []string{
					"根因结论",
					"响应过程记录",
				},
				Actions: []string{
					"复盘会议确认关键问题",
					"拆解短期修复与长期改进项",
					"确认行动项负责人与截止时间",
				},
				Outputs: []string{
					"行动项列表",
					"风险复发预防清单",
				},
			},
			{
				Key:      "follow_up",
				Title:    "行动项跟踪与知识沉淀",
				Owner:    "Owner/PM",
				Duration: "T+7~30d",
				Inputs: []string{
					"行动项列表",
					"回归验证结果",
				},
				Actions: []string{
					"跟踪行动项完成情况",
					"更新 SOP/监控/预案",
					"沉淀知识库条目与检索标签",
				},
				Outputs: []string{
					"行动项完成报告",
					"更新后的知识库条目",
				},
			},
		},
		Roles: []PostmortemRole{
			{
				Role: "Incident Commander",
				Responsibilities: []string{
					"推动复盘节奏与会议组织",
					"确认影响范围与沟通节奏",
				},
			},
			{
				Role: "Tech Lead",
				Responsibilities: []string{
					"根因分析与技术结论确认",
					"评估改进项优先级",
				},
			},
			{
				Role: "Support/Comms",
				Responsibilities: []string{
					"同步用户侧影响与反馈",
					"维护对外公告与 FAQ",
				},
			},
			{
				Role: "Product/PM",
				Responsibilities: []string{
					"推动行动项落地",
					"沉淀知识库与策略更新",
				},
			},
		},
		ExitCriteria: []string{
			"行动项全部录入并有负责人/截止时间",
			"监控与告警补齐，复发风险已评估",
			"知识库条目发布并可检索",
		},
		Notes: []string{
			"重大事故需在 T+7 天内完成复盘会议。",
		},
	}
}

func defaultRootCauseTaxonomy() RootCauseTaxonomy {
	return RootCauseTaxonomy{
		Key:     "root_cause_taxonomy",
		Title:   "Root Cause 分类与统计",
		Summary: "覆盖变更、配置、依赖、容量、流程等维度的根因分类，并定义统计口径。",
		Dimensions: []RootCauseDimension{
			{
				Key:         "origin",
				Title:       "成因维度",
				Description: "导致事故的直接触发类型",
				Values:      []string{"change", "configuration", "dependency", "capacity", "process", "human_error"},
			},
			{
				Key:         "layer",
				Title:       "影响层级",
				Description: "问题出现的系统层级",
				Values:      []string{"frontend", "backend", "workflow_engine", "database", "infra", "third_party"},
			},
			{
				Key:         "impact",
				Title:       "影响类型",
				Description: "事故的主要影响面",
				Values:      []string{"availability", "latency", "data_integrity", "security", "billing"},
			},
		},
		Categories: []RootCauseCategory{
			{
				Key:         "release_regression",
				Title:       "发布回归",
				Description: "代码变更导致功能不可用或异常",
				Tags:        []string{"origin:change", "layer:backend", "impact:availability"},
				Signals:     []string{"发布后错误率上升", "监控告警集中在新版本"},
				Examples:    []string{"工作流执行失败率突增", "API 响应格式不兼容"},
			},
			{
				Key:         "config_misconfig",
				Title:       "配置错误",
				Description: "配置或参数变更导致异常",
				Tags:        []string{"origin:configuration", "layer:infra", "impact:availability"},
				Signals:     []string{"域名解析失败", "环境变量缺失"},
				Examples:    []string{"证书配置错误", "限流阈值配置异常"},
			},
			{
				Key:         "dependency_outage",
				Title:       "依赖故障",
				Description: "第三方或内部依赖不可用",
				Tags:        []string{"origin:dependency", "layer:third_party", "impact:latency"},
				Signals:     []string{"下游响应超时", "外部 API 5xx"},
				Examples:    []string{"模型服务超时", "支付网关异常"},
			},
			{
				Key:         "capacity_limit",
				Title:       "容量/资源瓶颈",
				Description: "资源不足或限额导致服务降级",
				Tags:        []string{"origin:capacity", "layer:database", "impact:latency"},
				Signals:     []string{"CPU/连接池饱和", "队列堆积"},
				Examples:    []string{"DB 连接池耗尽", "队列处理滞后"},
			},
			{
				Key:         "process_gap",
				Title:       "流程缺失",
				Description: "流程或检查清单缺失导致问题被引入",
				Tags:        []string{"origin:process", "layer:workflow_engine", "impact:availability"},
				Signals:     []string{"缺少回滚策略", "未经过评审发布"},
				Examples:    []string{"变更未通知导致配置冲突"},
			},
		},
		Metrics: []RootCauseMetric{
			{
				Key:         "category_distribution",
				Title:       "根因分布",
				Definition:  "按分类统计事故数量与占比",
				GroupBy:     []string{"category", "severity"},
				Cadence:     "monthly",
				Calculation: "count(incidents) / total(incidents)",
			},
			{
				Key:         "mttr_by_category",
				Title:       "分类平均恢复时间",
				Definition:  "不同根因分类的 MTTR",
				GroupBy:     []string{"category"},
				Cadence:     "monthly",
				Calculation: "avg(resolution_time_minutes)",
			},
			{
				Key:         "recurrence_rate",
				Title:       "复发率",
				Definition:  "30 天内重复发生的根因比例",
				GroupBy:     []string{"category"},
				Cadence:     "monthly",
				Calculation: "recurring_incidents / total_incidents",
			},
			{
				Key:         "preventable_ratio",
				Title:       "可预防比例",
				Definition:  "标记为可预防的事故占比",
				GroupBy:     []string{"category", "owner"},
				Cadence:     "quarterly",
				Calculation: "preventable_incidents / total_incidents",
			},
		},
		Notes: []string{
			"分类需在复盘会议中确认并固化到知识库标签。",
		},
	}
}

func defaultKnowledgeBaseGuide() KnowledgeBaseGuide {
	return KnowledgeBaseGuide{
		Key:     "knowledge_base_guide",
		Title:   "知识库维护与检索规范",
		Summary: "沉淀事故复盘、SOP 与 FAQ，形成可检索的运营知识库。",
		ContentSources: []KnowledgeBaseSource{
			{
				Key:            "postmortem",
				Title:          "事故复盘",
				Description:    "复盘模板输出与行动项总结",
				Owner:          "ops",
				RefreshCadence: "每次事故后",
			},
			{
				Key:            "runbook",
				Title:          "SOP/Runbook",
				Description:    "故障排查与应急流程",
				Owner:          "platform",
				RefreshCadence: "每季度复核",
			},
			{
				Key:            "support_ticket",
				Title:          "工单/用户反馈",
				Description:    "高频问题与解决方案",
				Owner:          "support",
				RefreshCadence: "每周汇总",
			},
		},
		ContentTypes: []KnowledgeBaseContentType{
			{
				Key:       "faq",
				Title:     "FAQ",
				Structure: "问题/现象/解决方式",
				Usage:     "支持团队快速响应",
			},
			{
				Key:       "runbook",
				Title:     "排障流程",
				Structure: "触发条件/步骤/回滚",
				Usage:     "值班与应急处理",
			},
			{
				Key:       "rca_summary",
				Title:     "根因摘要",
				Structure: "背景/根因/修复项",
				Usage:     "复盘沉淀与培训",
			},
			{
				Key:       "change_notes",
				Title:     "变更记录",
				Structure: "版本/变更/影响",
				Usage:     "定位回归与影响范围",
			},
		},
		MetadataFields: []KnowledgeBaseMetadataField{
			{Key: "service", Description: "服务/模块标识", Required: true},
			{Key: "severity", Description: "影响等级 (P1/P2/P3)", Required: false},
			{Key: "tags", Description: "主题标签", Required: true},
			{Key: "owner", Description: "内容负责人", Required: true},
			{Key: "updated_at", Description: "最后更新时间", Required: true},
			{Key: "valid_until", Description: "内容有效期", Required: false},
		},
		MaintenanceWorkflow: []KnowledgeBaseStep{
			{
				Key:   "collect",
				Title: "收集与初稿",
				Owner: "content_owner",
				Actions: []string{
					"复盘完成后提交条目初稿",
					"补齐元数据与标签",
				},
				ExitCriteria: []string{
					"字段完整度 >= 90%",
				},
			},
			{
				Key:   "review",
				Title: "技术评审",
				Owner: "tech_lead",
				Actions: []string{
					"核对根因与修复项",
					"确认复发预防措施",
				},
				ExitCriteria: []string{
					"内容审核通过",
				},
			},
			{
				Key:   "publish",
				Title: "发布与索引",
				Owner: "ops",
				Actions: []string{
					"发布到知识库",
					"建立检索索引与推荐",
				},
				ExitCriteria: []string{
					"索引构建完成",
					"可被检索与引用",
				},
			},
			{
				Key:   "deprecate",
				Title: "复核与下线",
				Owner: "ops",
				Actions: []string{
					"定期复核内容有效性",
					"过期条目归档或更新",
				},
				ExitCriteria: []string{
					"过期条目已处理",
				},
			},
		},
		SearchPlan: KnowledgeBaseSearchPlan{
			Strategy:    "keyword + semantic hybrid",
			IndexFields: []string{"title", "summary", "tags", "service", "root_cause", "actions"},
			RetrievalSteps: []KnowledgeBaseSearchStep{
				{
					Step:        "keyword_search",
					Description: "关键词召回与过滤",
					Inputs:      []string{"query", "filters"},
					Outputs:     []string{"candidate_docs"},
				},
				{
					Step:        "semantic_search",
					Description: "语义向量召回补充",
					Inputs:      []string{"query_embedding"},
					Outputs:     []string{"semantic_docs"},
				},
				{
					Step:        "rerank",
					Description: "融合得分排序并返回 TopN",
					Inputs:      []string{"candidate_docs", "semantic_docs"},
					Outputs:     []string{"ranked_docs"},
				},
			},
			RankingSignals: []string{
				"recency",
				"severity_match",
				"reuse_count",
				"owner_confidence",
			},
			FeedbackLoops: []string{
				"搜索点击与满意度回传",
				"零结果查询每周复盘",
			},
		},
		QualityMetrics: []KnowledgeBaseMetric{
			{
				Key:        "coverage_rate",
				Title:      "覆盖率",
				Definition: "高频问题是否有对应条目",
				Target:     ">= 90%",
			},
			{
				Key:        "freshness",
				Title:      "内容新鲜度",
				Definition: "90 天内更新的条目比例",
				Target:     ">= 70%",
			},
			{
				Key:        "zero_result_rate",
				Title:      "零结果率",
				Definition: "搜索无结果的查询占比",
				Target:     "<= 5%",
			},
			{
				Key:        "reuse_rate",
				Title:      "复用率",
				Definition: "条目被引用或解决问题的次数",
				Target:     "持续上升",
			},
		},
		Notes: []string{
			"复盘完成后 48 小时内必须沉淀知识库条目。",
		},
	}
}
