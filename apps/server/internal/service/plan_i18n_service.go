package service

import (
	"context"
	"errors"
)

// I18nPlan 国际化与多语言支持规划
type I18nPlan struct {
	Key                string                 `json:"key"`
	Title              string                 `json:"title"`
	Summary            string                 `json:"summary"`
	ResourceManagement I18nResourceManagement `json:"resource_management"`
	CopyStrategy       I18nCopyStrategy       `json:"copy_strategy"`
	FormatSpec         I18nFormatSpec         `json:"format_spec"`
	Notes              []string               `json:"notes,omitempty"`
}

// I18nResourceManagement 语言资源管理规范
type I18nResourceManagement struct {
	Key            string   `json:"key"`
	Title          string   `json:"title"`
	ResourceFormat string   `json:"resource_format"`
	SourceOfTruth  string   `json:"source_of_truth"`
	Storage        []string `json:"storage"`
	Namespaces     []string `json:"namespaces"`
	KeyRules       []string `json:"key_rules"`
	Fallbacks      []string `json:"fallbacks"`
	Workflow       []string `json:"workflow"`
	Validation     []string `json:"validation"`
	Notes          []string `json:"notes,omitempty"`
}

// I18nCopyStrategy UI 文案与提示词多语言策略
type I18nCopyStrategy struct {
	Key         string   `json:"key"`
	Title       string   `json:"title"`
	Principles  []string `json:"principles"`
	ToneRules   []string `json:"tone_rules"`
	PromptRules []string `json:"prompt_rules"`
	TokenRules  []string `json:"token_rules"`
	ReviewFlow  []string `json:"review_flow"`
	Notes       []string `json:"notes,omitempty"`
}

// I18nFormatDefaults 日期/时区/货币格式默认值
type I18nFormatDefaults struct {
	Locale    string `json:"locale"`
	TimeZone  string `json:"time_zone"`
	Currency  string `json:"currency"`
	DateStyle string `json:"date_style"`
	TimeStyle string `json:"time_style"`
}

// I18nLocaleSample 多语言示例
type I18nLocaleSample struct {
	Locale         string   `json:"locale"`
	DateSample     string   `json:"date_sample"`
	TimeSample     string   `json:"time_sample"`
	DateTimeSample string   `json:"date_time_sample"`
	CurrencySample string   `json:"currency_sample"`
	NumberSample   string   `json:"number_sample"`
	Notes          []string `json:"notes,omitempty"`
}

// I18nFormatSpec 日期/时区/货币格式规范
type I18nFormatSpec struct {
	Key           string             `json:"key"`
	Title         string             `json:"title"`
	Defaults      I18nFormatDefaults `json:"defaults"`
	DateTimeRules []string           `json:"date_time_rules"`
	CurrencyRules []string           `json:"currency_rules"`
	NumberRules   []string           `json:"number_rules"`
	LocaleSamples []I18nLocaleSample `json:"locale_samples"`
	Notes         []string           `json:"notes,omitempty"`
}

// PlanI18nService 国际化规划服务接口
type PlanI18nService interface {
	GetPlan(ctx context.Context) (*I18nPlan, error)
}

type planI18nService struct {
	plan I18nPlan
}

// ErrI18nPlanNotFound 国际化规划不存在
var ErrI18nPlanNotFound = errors.New("i18n plan not found")

// NewPlanI18nService 创建国际化规划服务
func NewPlanI18nService() PlanI18nService {
	return &planI18nService{
		plan: defaultI18nPlan(),
	}
}

func (s *planI18nService) GetPlan(ctx context.Context) (*I18nPlan, error) {
	if s == nil || s.plan.Key == "" {
		return nil, ErrI18nPlanNotFound
	}
	output := s.plan
	return &output, nil
}

func defaultI18nPlan() I18nPlan {
	return I18nPlan{
		Key:     "i18n_plan",
		Title:   "国际化与多语言支持",
		Summary: "定义语言资源管理、UI 文案与提示词策略，以及日期/时区/货币格式规范。",
		ResourceManagement: I18nResourceManagement{
			Key:            "language_resource_management",
			Title:          "语言资源管理规范",
			ResourceFormat: "ICU MessageFormat + JSON",
			SourceOfTruth:  "版本库内语言资源为单一来源，运行时覆盖由配置中心下发。",
			Storage: []string{
				"前端控制台资源按 locale/namespace 分层管理",
				"服务端系统文案按 locale 维护并与通知模板复用",
				"运行时临时文案允许通过配置中心覆写",
			},
			Namespaces: []string{
				"common",
				"auth",
				"dashboard",
				"editor",
				"runtime",
				"notifications",
			},
			KeyRules: []string{
				"统一使用 feature.section.action 命名",
				"新增 key 必须先补齐默认语言（zh-CN）",
				"禁止在 UI 代码中拼接可见文案",
			},
			Fallbacks: []string{
				"优先使用 workspace 指定 locale",
				"locale fallback: zh-CN -> en-US",
				"namespace fallback: common",
			},
			Workflow: []string{
				"新增 key -> 默认语言填写 -> 翻译 -> 校验 -> 发布",
				"弃用 key 保留 1 个版本并记录变更",
			},
			Validation: []string{
				"构建时校验所有 locale 的 key 完整性",
				"运行时缺失 key 记录 metrics 并回退默认语言",
			},
			Notes: []string{
				"资源文件建议使用扁平 key，减少深层嵌套。",
			},
		},
		CopyStrategy: I18nCopyStrategy{
			Key:   "ui_copy_and_prompt_strategy",
			Title: "UI 文案与提示词多语言策略",
			Principles: []string{
				"术语表统一，避免同义词造成认知偏差",
				"按钮/提示语控制长度，避免换行溢出",
				"错误信息提供可执行的下一步",
			},
			ToneRules: []string{
				"面向专业用户，语气简洁中性",
				"避免机器直译，保留品牌语气",
			},
			PromptRules: []string{
				"系统提示词按 locale 维护，业务提示词使用模板参数化",
				"提示词中需显式声明输出语言",
				"上下文变量在所有语言版本保持一致",
			},
			TokenRules: []string{
				"变量占位符保持 {{variable}} 格式且不翻译",
				"单位/数值统一通过格式化函数渲染",
			},
			ReviewFlow: []string{
				"新增/变更文案进入双人审校流程",
				"关键页面文案变更需回归截图对比",
			},
			Notes: []string{
				"提示词策略覆盖系统、工作流与模板文案。",
			},
		},
		FormatSpec: I18nFormatSpec{
			Key:   "locale_format_spec",
			Title: "日期/时区/货币格式规范",
			Defaults: I18nFormatDefaults{
				Locale:    "zh-CN",
				TimeZone:  "Asia/Shanghai",
				Currency:  "CNY",
				DateStyle: "yyyy-MM-dd",
				TimeStyle: "HH:mm",
			},
			DateTimeRules: []string{
				"服务端输出使用 ISO 8601 并携带时区偏移",
				"展示层使用 Intl.DateTimeFormat 渲染",
				"默认时区：workspace -> 用户设置 -> UTC",
			},
			CurrencyRules: []string{
				"货币字段使用 ISO 4217 代码存储",
				"展示使用 Intl.NumberFormat(style=currency)",
				"价格计算使用数值类型，禁止存储格式化字符串",
			},
			NumberRules: []string{
				"数字分隔与小数位数由 locale 决定",
				"百分比/比例以数值存储，展示时格式化",
			},
			LocaleSamples: []I18nLocaleSample{
				{
					Locale:         "zh-CN",
					DateSample:     "2026-02-02",
					TimeSample:     "14:35",
					DateTimeSample: "2026-02-02 14:35",
					CurrencySample: "¥1,234.50",
					NumberSample:   "1,234.5",
				},
				{
					Locale:         "en-US",
					DateSample:     "02/02/2026",
					TimeSample:     "2:35 PM",
					DateTimeSample: "02/02/2026, 2:35 PM",
					CurrencySample: "$1,234.50",
					NumberSample:   "1,234.5",
				},
				{
					Locale:         "ja-JP",
					DateSample:     "2026/02/02",
					TimeSample:     "14:35",
					DateTimeSample: "2026/02/02 14:35",
					CurrencySample: "￥1,234.50",
					NumberSample:   "1,234.5",
					Notes: []string{
						"日文默认使用 24 小时制。",
					},
				},
			},
			Notes: []string{
				"所有时间在存储层统一使用 UTC。",
			},
		},
		Notes: []string{
			"国际化规划以可扩展、多端一致为目标。",
		},
	}
}
