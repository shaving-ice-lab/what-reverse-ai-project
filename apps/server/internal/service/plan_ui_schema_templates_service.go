package service

import (
	"context"
	"errors"

	"github.com/agentflow/server/internal/pkg/uischema"
)

// UISchemaTemplate UI Schema 模板
type UISchemaTemplate struct {
	Key         string          `json:"key"`
	Title       string          `json:"title"`
	Description string          `json:"description"`
	Tags        []string        `json:"tags,omitempty"`
	Schema      uischema.Schema `json:"schema"`
	Notes       []string        `json:"notes,omitempty"`
}

// UISchemaTemplateLibrary UI Schema 模板库
type UISchemaTemplateLibrary struct {
	Key       string             `json:"key"`
	Title     string             `json:"title"`
	Templates []UISchemaTemplate `json:"templates"`
	Notes     []string           `json:"notes,omitempty"`
}

// PlanUISchemaTemplateService UI Schema 模板库规划服务接口
type PlanUISchemaTemplateService interface {
	GetLibrary(ctx context.Context) (*UISchemaTemplateLibrary, error)
}

type planUISchemaTemplateService struct {
	library UISchemaTemplateLibrary
}

// ErrUISchemaTemplateNotFound UI Schema 模板库不存在
var ErrUISchemaTemplateNotFound = errors.New("ui schema template not found")

// NewPlanUISchemaTemplateService 创建 UI Schema 模板库规划服务
func NewPlanUISchemaTemplateService() PlanUISchemaTemplateService {
	return &planUISchemaTemplateService{
		library: defaultUISchemaTemplateLibrary(),
	}
}

func (s *planUISchemaTemplateService) GetLibrary(ctx context.Context) (*UISchemaTemplateLibrary, error) {
	if s == nil || s.library.Key == "" {
		return nil, ErrUISchemaTemplateNotFound
	}
	output := s.library
	return &output, nil
}

func defaultUISchemaTemplateLibrary() UISchemaTemplateLibrary {
	return UISchemaTemplateLibrary{
		Key:   "ui_schema_templates",
		Title: "UI Schema 模板库（按场景）",
		Templates: []UISchemaTemplate{
			{
				Key:         "form_report",
				Title:       "表单 + 报告",
				Description: "输入关键信息后生成摘要报告。",
				Tags:        []string{"form", "report"},
				Schema: uischema.Schema{
					SchemaVersion: uischema.CurrentSchemaVersion,
					Layout:        &uischema.Layout{Type: "single_column"},
					Blocks: []uischema.Block{
						{
							ID:    "report_form",
							Type:  "form",
							Label: "生成报告",
							Children: []uischema.Block{
								{
									ID:       "report_title",
									Type:     "input",
									Label:    "标题",
									InputKey: "title",
									Props: map[string]interface{}{
										"placeholder": "例如：月度运营报告",
									},
									Validation: &uischema.ValidationRules{Required: true},
								},
								{
									ID:       "report_period",
									Type:     "select",
									Label:    "周期",
									InputKey: "period",
									Props: map[string]interface{}{
										"options": []interface{}{"本周", "本月", "本季度"},
									},
									Validation: &uischema.ValidationRules{Required: true},
								},
								{
									ID:       "report_goals",
									Type:     "input",
									Label:    "目标",
									InputKey: "goals",
									Props: map[string]interface{}{
										"placeholder": "关键目标或指标",
									},
									Validation: &uischema.ValidationRules{Required: true},
								},
								{
									ID:       "report_notes",
									Type:     "input",
									Label:    "补充说明",
									InputKey: "notes",
									Props: map[string]interface{}{
										"placeholder": "可选背景或限制条件",
										"multiline":   true,
									},
								},
							},
						},
						{
							ID:    "report_preview",
							Type:  "card",
							Label: "报告摘要",
							Props: map[string]interface{}{
								"description": "提交后在此展示摘要与关键结论",
							},
						},
					},
					Actions: []uischema.Action{
						{ID: "submit", Type: "submit", Label: "生成报告"},
					},
					ResultView: &uischema.ResultView{
						Type: "markdown",
						Props: map[string]interface{}{
							"title": "生成结果",
						},
					},
				},
			},
			{
				Key:         "search_list",
				Title:       "搜索 + 列表",
				Description: "通过筛选条件检索并展示列表结果。",
				Tags:        []string{"search", "list"},
				Schema: uischema.Schema{
					SchemaVersion: uischema.CurrentSchemaVersion,
					Layout: &uischema.Layout{
						Type: "grid",
						Props: map[string]interface{}{
							"columns": 2,
						},
					},
					Blocks: []uischema.Block{
						{
							ID:    "search_filters",
							Type:  "card",
							Label: "筛选条件",
							Children: []uischema.Block{
								{
									ID:       "query",
									Type:     "input",
									Label:    "关键词",
									InputKey: "query",
									Props: map[string]interface{}{
										"placeholder": "输入关键词",
									},
								},
								{
									ID:       "status",
									Type:     "select",
									Label:    "状态",
									InputKey: "status",
									Props: map[string]interface{}{
										"options": []interface{}{"all", "active", "draft", "archived"},
									},
								},
								{
									ID:       "sort",
									Type:     "select",
									Label:    "排序字段",
									InputKey: "sort_by",
									Props: map[string]interface{}{
										"options": []interface{}{"updated_at", "created_at", "name"},
									},
								},
							},
						},
						{
							ID:    "result_list",
							Type:  "table",
							Label: "结果列表",
							Props: map[string]interface{}{
								"columns":    []interface{}{"name", "status", "updated_at"},
								"empty_text": "暂无结果",
							},
						},
					},
					Actions: []uischema.Action{
						{ID: "search", Type: "submit", Label: "搜索"},
					},
					ResultView: &uischema.ResultView{
						Type: "table",
						Props: map[string]interface{}{
							"title": "搜索结果",
						},
					},
				},
			},
			{
				Key:         "qa_summary",
				Title:       "问答 + 结果摘要",
				Description: "输入问题与上下文，输出摘要与要点。",
				Tags:        []string{"qa", "summary"},
				Schema: uischema.Schema{
					SchemaVersion: uischema.CurrentSchemaVersion,
					Layout:        &uischema.Layout{Type: "single_column"},
					Blocks: []uischema.Block{
						{
							ID:    "qa_form",
							Type:  "form",
							Label: "提问",
							Children: []uischema.Block{
								{
									ID:       "question",
									Type:     "input",
									Label:    "问题",
									InputKey: "question",
									Props: map[string]interface{}{
										"placeholder": "你想了解什么？",
									},
									Validation: &uischema.ValidationRules{Required: true},
								},
								{
									ID:       "context",
									Type:     "input",
									Label:    "背景",
									InputKey: "context",
									Props: map[string]interface{}{
										"placeholder": "可选背景说明",
										"multiline":   true,
									},
								},
								{
									ID:       "tone",
									Type:     "select",
									Label:    "语气",
									InputKey: "tone",
									Props: map[string]interface{}{
										"options": []interface{}{"专业", "简洁", "友好"},
									},
								},
							},
						},
						{
							ID:    "answer_hint",
							Type:  "markdown",
							Label: "输出说明",
							Props: map[string]interface{}{
								"content": "回答将包含摘要与要点。",
							},
						},
					},
					Actions: []uischema.Action{
						{ID: "ask", Type: "submit", Label: "生成答案"},
					},
					ResultView: &uischema.ResultView{
						Type: "markdown",
						Props: map[string]interface{}{
							"title": "回答",
						},
					},
				},
			},
			{
				Key:         "multi_step_wizard",
				Title:       "多步骤向导",
				Description: "分步收集信息，适合复杂配置流程。",
				Tags:        []string{"wizard", "multi-step"},
				Schema: uischema.Schema{
					SchemaVersion: uischema.CurrentSchemaVersion,
					Layout:        &uischema.Layout{Type: "single_column"},
					Blocks: []uischema.Block{
						{
							ID:    "step_basic",
							Type:  "card",
							Label: "步骤 1：基本信息",
							Props: map[string]interface{}{
								"step": 1,
							},
							Children: []uischema.Block{
								{
									ID:       "name",
									Type:     "input",
									Label:    "名称",
									InputKey: "name",
									Props: map[string]interface{}{
										"placeholder": "请输入名称",
									},
									Validation: &uischema.ValidationRules{Required: true},
								},
								{
									ID:       "category",
									Type:     "select",
									Label:    "分类",
									InputKey: "category",
									Props: map[string]interface{}{
										"options": []interface{}{"基础", "高级", "自定义"},
									},
								},
							},
						},
						{
							ID:    "step_config",
							Type:  "card",
							Label: "步骤 2：配置",
							Props: map[string]interface{}{
								"step": 2,
							},
							Children: []uischema.Block{
								{
									ID:       "priority",
									Type:     "select",
									Label:    "优先级",
									InputKey: "priority",
									Props: map[string]interface{}{
										"options": []interface{}{"低", "中", "高"},
									},
								},
								{
									ID:       "description",
									Type:     "input",
									Label:    "说明",
									InputKey: "description",
									Props: map[string]interface{}{
										"placeholder": "补充说明",
										"multiline":   true,
									},
								},
							},
						},
						{
							ID:    "step_confirm",
							Type:  "card",
							Label: "步骤 3：确认",
							Props: map[string]interface{}{
								"step": 3,
							},
							Children: []uischema.Block{
								{
									ID:    "confirm_note",
									Type:  "markdown",
									Label: "确认说明",
									Props: map[string]interface{}{
										"content": "请确认信息无误后提交。",
									},
								},
							},
						},
					},
					Actions: []uischema.Action{
						{ID: "submit", Type: "submit", Label: "提交"},
					},
					ResultView: &uischema.ResultView{
						Type: "card",
						Props: map[string]interface{}{
							"title": "执行结果",
						},
					},
				},
			},
		},
		Notes: []string{
			"模板基于当前 UI Schema 允许的 block 类型构建。",
		},
	}
}
