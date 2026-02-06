package service

import (
	"context"
	"errors"
)

// LegacyMigrationPlan 旧功能迁移执行细化方案
type LegacyMigrationPlan struct {
	Key                 string                      `json:"key"`
	Title               string                      `json:"title"`
	Summary             string                      `json:"summary"`
	MappingTable        LegacyMigrationMappingTable `json:"mapping_table"`
	CompletionChecklist MigrationChecklist          `json:"completion_checklist"`
	UserGuide           LegacyMigrationGuide        `json:"user_guide"`
	Notes               []string                    `json:"notes,omitempty"`
}

// LegacyMigrationMappingTable 迁移映射表
type LegacyMigrationMappingTable struct {
	Key      string                       `json:"key"`
	Title    string                       `json:"title"`
	Mappings []LegacyMigrationMappingItem `json:"mappings"`
	Notes    []string                     `json:"notes,omitempty"`
}

// LegacyMigrationMappingItem 迁移映射项
type LegacyMigrationMappingItem struct {
	Key           string                        `json:"key"`
	LegacyType    string                        `json:"legacy_type"`
	LegacyObject  string                        `json:"legacy_object"`
	TargetObject  string                        `json:"target_object"`
	ExecutionPath string                        `json:"execution_path"`
	FieldMappings []LegacyMigrationFieldMapping `json:"field_mappings,omitempty"`
	Preconditions []string                      `json:"preconditions,omitempty"`
	PostActions   []string                      `json:"post_actions,omitempty"`
	Notes         []string                      `json:"notes,omitempty"`
}

// LegacyMigrationFieldMapping 迁移字段映射
type LegacyMigrationFieldMapping struct {
	From string `json:"from"`
	To   string `json:"to"`
	Rule string `json:"rule,omitempty"`
}

// LegacyMigrationGuide 迁移后的用户引导与说明
type LegacyMigrationGuide struct {
	Key      string                        `json:"key"`
	Title    string                        `json:"title"`
	Summary  string                        `json:"summary"`
	Sections []LegacyMigrationGuideSection `json:"sections"`
	FAQs     []LegacyMigrationGuideFAQ     `json:"faqs,omitempty"`
	Notes    []string                      `json:"notes,omitempty"`
}

// LegacyMigrationGuideSection 用户引导分区
type LegacyMigrationGuideSection struct {
	Key         string   `json:"key"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Steps       []string `json:"steps,omitempty"`
	Actions     []string `json:"actions,omitempty"`
}

// LegacyMigrationGuideFAQ 用户常见问题
type LegacyMigrationGuideFAQ struct {
	Question string `json:"question"`
	Answer   string `json:"answer"`
}

// PlanLegacyMigrationService 旧功能迁移规划服务接口
type PlanLegacyMigrationService interface {
	GetPlan(ctx context.Context) (*LegacyMigrationPlan, error)
}

type planLegacyMigrationService struct {
	plan LegacyMigrationPlan
}

// ErrLegacyMigrationPlanNotFound 旧功能迁移方案不存在
var ErrLegacyMigrationPlanNotFound = errors.New("legacy migration plan not found")

// NewPlanLegacyMigrationService 创建旧功能迁移规划服务
func NewPlanLegacyMigrationService() PlanLegacyMigrationService {
	return &planLegacyMigrationService{
		plan: defaultLegacyMigrationPlan(),
	}
}

func (s *planLegacyMigrationService) GetPlan(ctx context.Context) (*LegacyMigrationPlan, error) {
	if s == nil || s.plan.Key == "" {
		return nil, ErrLegacyMigrationPlanNotFound
	}
	output := s.plan
	return &output, nil
}

func defaultLegacyMigrationPlan() LegacyMigrationPlan {
	return LegacyMigrationPlan{
		Key:     "legacy_migration_execution",
		Title:   "旧功能迁移执行细化",
		Summary: "覆盖旧 workflow 与 agent 的迁移映射、完成校验清单与用户引导说明。",
		MappingTable: LegacyMigrationMappingTable{
			Key:   "legacy_migration_mapping",
			Title: "旧 workflow 与 agent 迁移映射表",
			Mappings: []LegacyMigrationMappingItem{
				{
					Key:           "workflow_to_workspace",
					LegacyType:    "workflow",
					LegacyObject:  "what_reverse_workflows",
					TargetObject:  "what_reverse_workspaces / what_reverse_workspace_versions",
					ExecutionPath: "POST /api/v1/workspaces",
					FieldMappings: []LegacyMigrationFieldMapping{
						{From: "workflow.id", To: "workspace_version.workflow_id", Rule: "建立溯源关联"},
						{From: "workflow.name", To: "workspace.name", Rule: "空值时沿用 workflow 名称"},
						{From: "workflow.description", To: "workspace.description", Rule: "空值可保留"},
						{From: "workflow.icon", To: "workspace.icon", Rule: "空值默认 📦"},
						{From: "workflow.definition", To: "workspace_version.ui_schema / config_json", Rule: "自动生成 UI Schema 与 output_schema"},
						{From: "workflow.is_public", To: "workspace.access_mode", Rule: "public -> public_anonymous; private -> private（需手动更新）"},
					},
					Preconditions: []string{
						"workflow 与 workspace 匹配",
						"操作者具备 workspaces:create 权限",
					},
					PostActions: []string{
						"确认 workspace.current_version_id 已生成",
						"按需更新 access_policy 与 slug",
					},
					Notes: []string{
						"CreateFromWorkflow 会自动生成 v1 版本并创建默认访问策略。",
					},
				},
				{
					Key:           "agent_to_workspace",
					LegacyType:    "agent",
					LegacyObject:  "what_reverse_agents",
					TargetObject:  "what_reverse_workspaces / what_reverse_workspace_versions",
					ExecutionPath: "GET /api/v1/agents/:slug -> POST /api/v1/workspaces",
					FieldMappings: []LegacyMigrationFieldMapping{
						{From: "agent.workflow_id", To: "workspace_version.workflow_id", Rule: "使用 agent 的 workflow 作为迁移入口"},
						{From: "agent.name", To: "workspace.name", Rule: "建议保持一致"},
						{From: "agent.description/long_description", To: "workspace.description", Rule: "可合并为 workspace 描述"},
						{From: "agent.icon", To: "workspace.icon", Rule: "空值默认 📦"},
						{From: "agent.pricing_type/price", To: "workspace.pricing_type/price", Rule: "需调用 /api/v1/workspaces/:id 更新"},
						{From: "agent.status", To: "workspace.app_status", Rule: "已发布需调用 /api/v1/workspaces/:id/publish"},
					},
					Preconditions: []string{
						"agent.workflow_id 存在且可访问",
						"操作者为 agent 所有者或具备管理权限",
					},
					PostActions: []string{
						"补充访问策略与商业化字段",
						"如需市场展示，完成 workspace 发布",
					},
					Notes: []string{
						"agent.cover_image/screenshots 暂无直接字段，需手工补充展示素材。",
					},
				},
				{
					Key:           "legacy_ui_schema_normalize",
					LegacyType:    "ui_schema",
					LegacyObject:  "fields-based legacy schema",
					TargetObject:  "ui schema v1.0.0",
					ExecutionPath: "internal/pkg/uischema.NormalizeMap",
					FieldMappings: []LegacyMigrationFieldMapping{
						{From: "fields[]", To: "blocks[]", Rule: "自动转换并补齐 schema_version"},
						{From: "layout", To: "layout", Rule: "默认 single_column"},
					},
					Notes: []string{
						"Normalize 在 runtime 校验与渲染前执行，确保格式统一。",
					},
				},
			},
			Notes: []string{
				"映射表用于迁移执行与回溯对账，建议与实际 API 调用步骤保持一致。",
			},
		},
		CompletionChecklist: MigrationChecklist{
			Key:     "legacy_migration_completion",
			Title:   "迁移完成校验清单",
			Summary: "用于确认旧 workflow/agent 迁移到 App 后数据一致、访问可用。",
			Steps: []MigrationChecklistStep{
				{
					Key:         "inventory_reconcile",
					Title:       "迁移对象对账",
					Deliverable: "对账清单",
					Acceptance:  "数量一致",
					Items: []string{
						"导出旧 workflow/agent 列表",
						"确认每个 workflow/agent 都有对应 app",
						"记录无法迁移或需人工处理项",
					},
				},
				{
					Key:         "version_integrity",
					Title:       "App 版本完整性",
					Deliverable: "版本校验记录",
					Acceptance:  "可运行",
					Items: []string{
						"app.current_version_id 已生成",
						"app_version.workflow_id 与原 workflow 对应",
						"ui_schema 可通过 Normalize 校验",
					},
				},
				{
					Key:         "access_policy_alignment",
					Title:       "访问策略对齐",
					Deliverable: "访问策略记录",
					Acceptance:  "访问一致",
					Items: []string{
						"根据 workflow.is_public / agent.status 设置 access_mode",
						"核对 rate_limit/allowed_origins/require_captcha",
					},
				},
				{
					Key:         "runtime_smoke",
					Title:       "运行态冒烟",
					Deliverable: "运行报告",
					Acceptance:  "关键路径通过",
					Items: []string{
						"调用 runtime 接口进行执行",
						"确认 execution 状态与输出字段",
						"检查 error_code 与旧提示一致",
					},
				},
				{
					Key:         "marketplace_validation",
					Title:       "市场与分享校验",
					Deliverable: "发布记录",
					Acceptance:  "可访问",
					Items: []string{
						"发布 app 并在 marketplace 可检索",
						"更新分享链接与迁移提示文案",
					},
				},
			},
			Notes: []string{
				"建议按 workspace/模块分批迁移，保留回滚窗口。",
			},
		},
		UserGuide: LegacyMigrationGuide{
			Key:     "legacy_migration_user_guide",
			Title:   "迁移后的用户引导与说明",
			Summary: "面向旧 workflow/agent 用户的迁移说明与行动指引。",
			Sections: []LegacyMigrationGuideSection{
				{
					Key:         "workflow_migration",
					Title:       "Workflow 迁移到 App",
					Description: "通过 workflow 创建 Workspace 并生成首个版本。",
					Steps: []string{
						"调用 POST /api/v1/workspaces 创建 workspace（从 workflow）",
						"检查自动生成的 UI Schema 与输出配置",
						"按需更新访问策略与发布设置",
					},
					Actions: []string{
						"必要时调整 app slug 与描述",
						"执行 /api/v1/workspaces/:id/publish 完成发布",
					},
				},
				{
					Key:         "agent_migration",
					Title:       "Agent 迁移到 App",
					Description: "使用 agent.workflow_id 创建 Workspace，并补齐商业化信息。",
					Steps: []string{
						"GET /api/v1/agents/:slug 获取 workflow_id",
						"POST /api/v1/workspaces 创建 Workspace",
						"同步 pricing_type/price 等商业化字段",
					},
					Actions: []string{
						"如需市场展示，完成 workspace 发布并检查 marketplace 列表",
					},
				},
				{
					Key:         "post_migration",
					Title:       "迁移后检查与沟通",
					Description: "确保用户访问与运营信息保持一致。",
					Steps: []string{
						"执行迁移完成校验清单",
						"更新旧入口文案与 FAQ",
						"监控迁移后 24-72h 的执行错误与反馈",
					},
					Actions: []string{
						"保留旧 workflow/agent 数据用于回滚或对照",
					},
				},
			},
			FAQs: []LegacyMigrationGuideFAQ{
				{
					Question: "旧 workflow/agent 是否会被删除？",
					Answer:   "迁移默认只新增 Workspace，不会自动删除旧数据；建议在确认稳定后再清理。",
				},
				{
					Question: "公开访问如何对齐？",
					Answer:   "通过 workspace.access_mode 设置公开策略，并在发布前验证。",
				},
				{
					Question: "封面/截图怎么处理？",
					Answer:   "Workspace 当前无直接字段，建议在描述、品牌配置或外部页面补充。",
				},
			},
			Notes: []string{
				"建议先进行灰度迁移并保留回滚方案。",
			},
		},
		Notes: []string{
			"本方案以现有 API 能力为基础，适用于最短闭环迁移。",
		},
	}
}
