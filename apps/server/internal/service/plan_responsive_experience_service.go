package service

import (
	"context"
	"errors"
)

// ResponsiveExperiencePlan 响应式与多端体验规划
type ResponsiveExperiencePlan struct {
	Key                 string                   `json:"key"`
	Title               string                   `json:"title"`
	Summary             string                   `json:"summary"`
	Breakpoints         []ResponsiveBreakpoint   `json:"breakpoints"`
	LayoutRules         []ResponsiveLayoutRule   `json:"layout_rules"`
	PublicPageGuideline ResponsiveGuideline      `json:"public_page_guideline"`
	EditorStrategy      ResponsiveEditorStrategy `json:"editor_strategy"`
	Notes               []string                 `json:"notes,omitempty"`
}

// ResponsiveBreakpoint 响应式断点
type ResponsiveBreakpoint struct {
	Key         string   `json:"key"`
	MinWidth    int      `json:"min_width"`
	MaxWidth    *int     `json:"max_width,omitempty"`
	Columns     int      `json:"columns"`
	Description string   `json:"description"`
	Targets     []string `json:"targets,omitempty"`
	Notes       []string `json:"notes,omitempty"`
}

// ResponsiveLayoutRule 布局规则
type ResponsiveLayoutRule struct {
	Key     string   `json:"key"`
	Title   string   `json:"title"`
	Scope   string   `json:"scope"`
	Rules   []string `json:"rules"`
	Targets []string `json:"targets,omitempty"`
	Notes   []string `json:"notes,omitempty"`
}

// ResponsiveGuideline 响应式体验规范
type ResponsiveGuideline struct {
	Key      string                       `json:"key"`
	Title    string                       `json:"title"`
	Summary  string                       `json:"summary"`
	Sections []ResponsiveGuidelineSection `json:"sections"`
	Notes    []string                     `json:"notes,omitempty"`
}

// ResponsiveGuidelineSection 规范分区
type ResponsiveGuidelineSection struct {
	Key        string   `json:"key"`
	Title      string   `json:"title"`
	Scope      string   `json:"scope"`
	Goals      []string `json:"goals"`
	Rules      []string `json:"rules"`
	Targets    []string `json:"targets,omitempty"`
	Acceptance []string `json:"acceptance,omitempty"`
}

// ResponsiveEditorStrategy 编辑器多端策略
type ResponsiveEditorStrategy struct {
	Key     string                   `json:"key"`
	Title   string                   `json:"title"`
	Summary string                   `json:"summary"`
	Layouts []ResponsiveEditorLayout `json:"layouts"`
	Notes   []string                 `json:"notes,omitempty"`
}

// ResponsiveEditorLayout 编辑器布局策略
type ResponsiveEditorLayout struct {
	Key        string   `json:"key"`
	Title      string   `json:"title"`
	Breakpoint string   `json:"breakpoint"`
	Structure  []string `json:"structure"`
	Behaviors  []string `json:"behaviors"`
	Targets    []string `json:"targets,omitempty"`
	Acceptance []string `json:"acceptance,omitempty"`
}

// PlanResponsiveExperienceService 响应式体验规划服务接口
type PlanResponsiveExperienceService interface {
	GetPlan(ctx context.Context) (*ResponsiveExperiencePlan, error)
}

type planResponsiveExperienceService struct {
	plan ResponsiveExperiencePlan
}

// ErrResponsiveExperiencePlanNotFound 响应式规划不存在
var ErrResponsiveExperiencePlanNotFound = errors.New("responsive experience plan not found")

// NewPlanResponsiveExperienceService 创建响应式体验规划服务
func NewPlanResponsiveExperienceService() PlanResponsiveExperienceService {
	return &planResponsiveExperienceService{
		plan: defaultResponsiveExperiencePlan(),
	}
}

func (s *planResponsiveExperienceService) GetPlan(ctx context.Context) (*ResponsiveExperiencePlan, error) {
	if s == nil || s.plan.Key == "" {
		return nil, ErrResponsiveExperiencePlanNotFound
	}
	output := s.plan
	return &output, nil
}

func defaultResponsiveExperiencePlan() ResponsiveExperiencePlan {
	return ResponsiveExperiencePlan{
		Key:     "responsive_experience",
		Title:   "响应式与多端体验",
		Summary: "定义断点、布局规则、公开访问页移动端规范与 App 编辑器适配策略。",
		Breakpoints: []ResponsiveBreakpoint{
			{
				Key:         "base",
				MinWidth:    0,
				MaxWidth:    intPtr(639),
				Columns:     1,
				Description: "手机竖屏为主，单列布局，优先信息层级。",
				Targets: []string{
					"apps/web/src/app/(unauth)",
					"apps/web/src/app/(dashboard)",
				},
			},
			{
				Key:         "sm",
				MinWidth:    640,
				MaxWidth:    intPtr(767),
				Columns:     2,
				Description: "小屏平板/大屏手机，允许双列卡片。",
			},
			{
				Key:         "md",
				MinWidth:    768,
				MaxWidth:    intPtr(1023),
				Columns:     2,
				Description: "平板横屏，内容区可拆分为主/辅两列。",
			},
			{
				Key:         "lg",
				MinWidth:    1024,
				MaxWidth:    intPtr(1279),
				Columns:     3,
				Description: "桌面端主流分辨率，支持固定侧栏与双栏表单。",
			},
			{
				Key:         "xl",
				MinWidth:    1280,
				MaxWidth:    intPtr(1535),
				Columns:     3,
				Description: "大屏桌面，支持三栏/分区信息布局。",
			},
			{
				Key:         "2xl",
				MinWidth:    1536,
				MaxWidth:    nil,
				Columns:     4,
				Description: "超宽屏，强调留白与分区密度控制。",
			},
		},
		LayoutRules: []ResponsiveLayoutRule{
			{
				Key:   "grid_rules",
				Title: "网格与分栏",
				Scope: "dashboard + unauth",
				Rules: []string{
					"默认单列，sm 起支持双列，lg 起可使用主/辅分区。",
					"卡片列表使用 grid-cols-1 -> sm:grid-cols-2 -> xl:grid-cols-3。",
					"表单与设置页保持 1 列为主，md 起允许二列并排。",
				},
				Targets: []string{
					"apps/web/src/app/(dashboard)/apps",
					"apps/web/src/app/(unauth)/store",
				},
			},
			{
				Key:   "navigation_rules",
				Title: "导航与工具条",
				Scope: "dashboard",
				Rules: []string{
					"小屏隐藏二级工具栏，保留核心 CTA。",
					"侧栏在 lg 以下折叠为抽屉或顶部菜单。",
					"工具按钮保证触达面积 >= 44px。",
				},
				Targets: []string{
					"apps/web/src/app/(dashboard)/layout.tsx",
				},
			},
			{
				Key:   "spacing_rules",
				Title: "间距与密度",
				Scope: "global",
				Rules: []string{
					"移动端采用更紧凑的垂直间距 (gap-3/gap-4)。",
					"大屏保留留白与分区呼吸感 (gap-6/gap-8)。",
					"避免在 <640px 使用多列表格，优先卡片化。",
				},
			},
		},
		PublicPageGuideline: ResponsiveGuideline{
			Key:     "public_page_mobile",
			Title:   "公开访问页移动端体验",
			Summary: "保证 unauth 页面在移动端的信息层级、CTA 触达与阅读体验。",
			Sections: []ResponsiveGuidelineSection{
				{
					Key:   "hero_layout",
					Title: "首屏与主 CTA",
					Scope: "unauth landing",
					Goals: []string{
						"主标题与 CTA 在首屏 1/2 区域可见",
						"CTA 按钮可单手触达",
					},
					Rules: []string{
						"主标题使用 text-3xl -> sm:text-4xl -> lg:text-5xl",
						"CTA 堆叠排列，避免横向压缩",
						"背景纹理/装饰在移动端降低强度",
					},
					Targets: []string{
						"apps/web/src/app/(unauth)/page.tsx",
						"apps/web/src/app/(unauth)/features",
					},
					Acceptance: []string{
						"在 375px 宽度下 CTA 可完整显示",
						"无横向滚动条",
					},
				},
				{
					Key:   "content_blocks",
					Title: "内容区块",
					Scope: "unauth content",
					Goals: []string{
						"保持模块可扫读",
						"减少图片遮挡文字",
					},
					Rules: []string{
						"卡片与图文模块在 base/sm 下单列",
						"长列表使用分段标题与段落间距",
					},
					Targets: []string{
						"apps/web/src/app/(unauth)/store",
						"apps/web/src/app/(unauth)/templates",
					},
				},
				{
					Key:   "footer_nav",
					Title: "底部与导航",
					Scope: "unauth footer",
					Goals: []string{
						"导航可折叠",
						"减少移动端噪声",
					},
					Rules: []string{
						"footer 按主题分组，移动端折叠展示",
						"社交与订阅入口保持在首个分组",
					},
					Targets: []string{
						"apps/web/src/components/layout",
					},
				},
			},
			Notes: []string{
				"公开访问页范围以 (unauth) 路由组为主。",
			},
		},
		EditorStrategy: ResponsiveEditorStrategy{
			Key:     "app_editor_responsive",
			Title:   "App 编辑器多端适配策略",
			Summary: "保证编辑器在大屏/小屏下可操作、信息不丢失。",
			Layouts: []ResponsiveEditorLayout{
				{
					Key:        "large_screen",
					Title:      "大屏布局 (>= lg)",
					Breakpoint: "lg",
					Structure: []string{
						"左侧画布 + 右侧配置面板双栏",
						"顶部保留全局操作栏",
						"辅助面板支持固定宽度与滚动",
					},
					Behaviors: []string{
						"面板切换不遮挡画布",
						"拖拽与缩放在画布区域完成",
					},
					Targets: []string{
						"apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/[appId]/builder/page.tsx",
						"apps/web/src/components/editor",
					},
					Acceptance: []string{
						"画布与配置面板同时可见",
						"配置面板可滚动且不会覆盖顶部栏",
					},
				},
				{
					Key:        "small_screen",
					Title:      "小屏布局 (< lg)",
					Breakpoint: "base-md",
					Structure: []string{
						"画布全宽展示",
						"配置面板切换为底部抽屉/标签页",
						"重要操作按钮固定底部或顶部",
					},
					Behaviors: []string{
						"面板弹出后保留返回入口",
						"减少同时显示的表单字段数量",
					},
					Targets: []string{
						"apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/[appId]/builder/page.tsx",
						"apps/web/src/components/editor",
					},
					Acceptance: []string{
						"在 768px 宽度下可完成编辑保存",
						"关键操作按钮不被遮挡",
					},
				},
			},
			Notes: []string{
				"编辑器适配优先保证画布可操作与配置可达性。",
			},
		},
		Notes: []string{
			"断点与 Tailwind 默认值保持一致：sm=640, md=768, lg=1024, xl=1280, 2xl=1536。",
		},
	}
}

func intPtr(value int) *int {
	return &value
}
