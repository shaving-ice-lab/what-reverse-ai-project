package service

import (
	"context"
	"errors"
)

// AccessibilityPlan 可访问性（A11y）规划
type AccessibilityPlan struct {
	Key                  string                           `json:"key"`
	Title                string                           `json:"title"`
	Summary              string                           `json:"summary"`
	PageChecklist        AccessibilityChecklist           `json:"page_checklist"`
	ComponentConstraints AccessibilityComponentConstraint `json:"component_constraints"`
	AutomationProcess    AccessibilityAutomationProcess   `json:"automation_process"`
	Notes                []string                         `json:"notes,omitempty"`
}

// AccessibilityChecklist 关键页面 A11y 标准清单
type AccessibilityChecklist struct {
	Key      string                          `json:"key"`
	Title    string                          `json:"title"`
	Sections []AccessibilityChecklistSection `json:"sections"`
	Notes    []string                        `json:"notes,omitempty"`
}

// AccessibilityChecklistSection 清单分区
type AccessibilityChecklistSection struct {
	Key        string   `json:"key"`
	Title      string   `json:"title"`
	Scope      string   `json:"scope"`
	Targets    []string `json:"targets,omitempty"`
	Items      []string `json:"items"`
	Acceptance []string `json:"acceptance,omitempty"`
}

// AccessibilityComponentConstraint 组件可访问性约束
type AccessibilityComponentConstraint struct {
	Key        string                       `json:"key"`
	Title      string                       `json:"title"`
	Components []AccessibilityComponentRule `json:"components"`
	Notes      []string                     `json:"notes,omitempty"`
}

// AccessibilityComponentRule 组件约束规则
type AccessibilityComponentRule struct {
	Key           string   `json:"key"`
	Title         string   `json:"title"`
	Scope         string   `json:"scope"`
	RequiredProps []string `json:"required_props,omitempty"`
	Rules         []string `json:"rules"`
	Enforced      bool     `json:"enforced"`
	Source        string   `json:"source,omitempty"`
	Notes         []string `json:"notes,omitempty"`
}

// AccessibilityAutomationProcess 自动化 A11y 检测流程
type AccessibilityAutomationProcess struct {
	Key     string                        `json:"key"`
	Title   string                        `json:"title"`
	Tools   []AccessibilityAutomationTool `json:"tools"`
	Steps   []string                      `json:"steps"`
	Reports []string                      `json:"reports,omitempty"`
	Enabled bool                          `json:"enabled"`
	Notes   []string                      `json:"notes,omitempty"`
}

// AccessibilityAutomationTool 自动化工具说明
type AccessibilityAutomationTool struct {
	Name    string   `json:"name"`
	Purpose string   `json:"purpose"`
	Status  string   `json:"status"`
	Source  string   `json:"source,omitempty"`
	Notes   []string `json:"notes,omitempty"`
}

// PlanAccessibilityService 可访问性规划服务接口
type PlanAccessibilityService interface {
	GetPlan(ctx context.Context) (*AccessibilityPlan, error)
}

type planAccessibilityService struct {
	plan AccessibilityPlan
}

// ErrAccessibilityPlanNotFound 可访问性规划不存在
var ErrAccessibilityPlanNotFound = errors.New("accessibility plan not found")

// NewPlanAccessibilityService 创建可访问性规划服务
func NewPlanAccessibilityService() PlanAccessibilityService {
	return &planAccessibilityService{
		plan: defaultAccessibilityPlan(),
	}
}

func (s *planAccessibilityService) GetPlan(ctx context.Context) (*AccessibilityPlan, error) {
	if s == nil || s.plan.Key == "" {
		return nil, ErrAccessibilityPlanNotFound
	}
	output := s.plan
	return &output, nil
}

func defaultAccessibilityPlan() AccessibilityPlan {
	return AccessibilityPlan{
		Key:     "accessibility_plan",
		Title:   "可访问性（A11y）",
		Summary: "覆盖关键页面标准清单、组件约束与自动化检测流程。",
		PageChecklist: AccessibilityChecklist{
			Key:   "a11y_page_checklist",
			Title: "关键页面 A11y 标准",
			Sections: []AccessibilityChecklistSection{
				{
					Key:   "public_pages",
					Title: "公开访问页",
					Scope: "unauth",
					Targets: []string{
						"apps/web/src/app/(unauth)/page.tsx",
						"apps/web/src/app/(unauth)/store/page.tsx",
						"apps/web/src/app/(unauth)/pricing/page.tsx",
					},
					Items: []string{
						"首屏主 CTA 支持键盘访问与可见焦点",
						"图片/图标提供 alt 或 aria-label",
						"标题层级顺序清晰（H1->H2）",
						"避免出现横向滚动条",
						"动效支持 prefers-reduced-motion",
					},
					Acceptance: []string{
						"键盘 Tab 可以遍历主要 CTA",
						"无明显对比度不足的文本",
					},
				},
				{
					Key:   "dashboard_core",
					Title: "Dashboard 核心页",
					Scope: "dashboard",
					Targets: []string{
						"apps/web/src/app/(dashboard)/dashboard/page.tsx",
						"apps/web/src/app/(dashboard)/apps/page.tsx",
						"apps/web/src/app/(dashboard)/workflows/page.tsx",
						"apps/web/src/app/(dashboard)/notifications/page.tsx",
					},
					Items: []string{
						"表格/列表提供可读行焦点与 aria-label",
						"筛选/排序控件具备 aria-pressed 或 aria-expanded",
						"空状态提供可读提示与下一步行动",
						"错误/成功提示具备可读文本",
					},
					Acceptance: []string{
						"键盘可完成筛选与选择操作",
						"关键按钮具备清晰的读屏文案",
					},
				},
				{
					Key:   "app_builder",
					Title: "App 编辑器",
					Scope: "editor",
					Targets: []string{
						"apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/[appId]/builder/page.tsx",
						"apps/web/src/components/editor",
					},
					Items: []string{
						"画布与配置面板切换有明确焦点管理",
						"图标按钮必须提供 aria-label",
						"节点/字段操作支持键盘触达",
					},
					Acceptance: []string{
						"在 768px 宽度下可完成编辑保存",
						"面板切换不会丢失焦点",
					},
				},
				{
					Key:   "auth_pages",
					Title: "认证与设置页",
					Scope: "auth/settings",
					Targets: []string{
						"apps/web/src/app/(auth)/login/page.tsx",
						"apps/web/src/app/(auth)/register/page.tsx",
						"apps/web/src/app/(dashboard)/settings",
					},
					Items: []string{
						"表单字段具备 label 与错误提示关联",
						"验证码/多因子入口可读且可键盘触达",
						"开关类组件提供 aria-checked",
					},
				},
			},
			Notes: []string{
				"检查清单以可评估为目标，覆盖键盘、语义、可读性与对比度。",
			},
		},
		ComponentConstraints: AccessibilityComponentConstraint{
			Key:   "a11y_component_constraints",
			Title: "组件可访问性约束",
			Components: []AccessibilityComponentRule{
				{
					Key:           "icon_button",
					Title:         "IconButton/图标按钮",
					Scope:         "components/ui/button.tsx",
					RequiredProps: []string{"aria-label"},
					Rules: []string{
						"图标按钮必须包含 aria-label",
						"禁用态保持可见度差异",
						"焦点环使用 focus-visible 样式",
					},
					Enforced: true,
					Source:   "apps/web/src/components/ui/button.tsx",
				},
				{
					Key:   "form_inputs",
					Title: "表单输入组件",
					Scope: "components/ui",
					Rules: []string{
						"输入必须与 label 或 aria-labelledby 绑定",
						"错误提示通过 aria-describedby 关联",
						"禁用/只读状态保持可读",
					},
					Enforced: false,
					Notes: []string{
						"可在表单封装组件中统一约束。",
					},
				},
				{
					Key:   "pagination",
					Title: "分页与导航",
					Scope: "components/ui/pagination.tsx",
					Rules: []string{
						"分页按钮带 aria-label 与 aria-current",
						"首页/末页提供明确语义",
					},
					Enforced: true,
					Source:   "apps/web/src/components/ui/pagination.tsx",
				},
				{
					Key:   "tabs_and_toggle",
					Title: "Tabs/切换控件",
					Scope: "dashboard pages",
					Rules: []string{
						"tablist/tab 需设置 aria-selected",
						"切换按钮提供 aria-pressed",
					},
					Enforced: true,
					Notes: []string{
						"已在部分页面使用 role/aria 属性。",
					},
				},
			},
			Notes: []string{
				"约束以可执行为目标，可逐步提升 Enforced 覆盖范围。",
			},
		},
		AutomationProcess: AccessibilityAutomationProcess{
			Key:     "a11y_automation",
			Title:   "自动化 A11y 检测流程",
			Enabled: false,
			Tools: []AccessibilityAutomationTool{
				{
					Name:    "axe-core",
					Purpose: "自动扫描 aria/对比度/语义错误",
					Status:  "planned",
					Source:  "pnpm-lock.yaml (axe-core)",
				},
				{
					Name:    "Lighthouse (A11y)",
					Purpose: "关键页面可访问性评分",
					Status:  "planned",
				},
			},
			Steps: []string{
				"选取关键页面路由进行脚本化访问",
				"运行 axe-core 检测并输出报告",
				"严重级别（critical/serious）阻断合并",
				"定期生成周报与趋势",
			},
			Reports: []string{
				"json: a11y-report.json",
				"html: a11y-report.html",
			},
			Notes: []string{
				"自动化检测以 CI 任务形式接入，启用前需补充测试基建。",
			},
		},
		Notes: []string{
			"清单与约束用于评估与执行，自动化流程可逐步启用。",
		},
	}
}
