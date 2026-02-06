package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/agentflow/server/internal/pkg/uischema"
)

// AITemplate AI 生成模板
type AITemplate struct {
	Key          string   `json:"key"`
	Title        string   `json:"title"`
	Intent       string   `json:"intent"`
	Description  string   `json:"description"`
	SystemPrompt string   `json:"system_prompt"`
	UserPrompt   string   `json:"user_prompt"`
	OutputFormat string   `json:"output_format,omitempty"`
	Notes        []string `json:"notes,omitempty"`
}

// AITemplateLibrary AI 模板库
type AITemplateLibrary struct {
	Key       string       `json:"key"`
	Title     string       `json:"title"`
	Templates []AITemplate `json:"templates"`
	Notes     []string     `json:"notes,omitempty"`
}

// PlanAITemplateService AI 模板库规划服务接口
type PlanAITemplateService interface {
	GetLibrary(ctx context.Context) (*AITemplateLibrary, error)
}

type planAITemplateService struct {
	library AITemplateLibrary
}

// ErrAITemplateNotFound AI 模板库不存在
var ErrAITemplateNotFound = errors.New("ai template not found")

// NewPlanAITemplateService 创建 AI 模板库规划服务
func NewPlanAITemplateService() PlanAITemplateService {
	return &planAITemplateService{
		library: defaultAITemplateLibrary(),
	}
}

func (s *planAITemplateService) GetLibrary(ctx context.Context) (*AITemplateLibrary, error) {
	if s == nil || s.library.Key == "" {
		return nil, ErrAITemplateNotFound
	}
	output := s.library
	return &output, nil
}

func defaultAITemplateLibrary() AITemplateLibrary {
	appOutputFormat := fmt.Sprintf(`{
  "schema_version": "%s",
  "workspace_metadata": { "name": "应用名称", "description": "应用描述" },
  "workflow_definition": { "name": "工作流名称", "nodes": [], "edges": [] },
  "ui_schema": { "schema_version": "%s", "blocks": [] },
  "db_schema": { "tables": [] },
  "access_policy": { "access_mode": "private", "data_classification": "public" }
}`, AIOutputSchemaVersion, uischema.CurrentSchemaVersion)

	patchFormat := fmt.Sprintf(`{
  "schema_version": "%s",
  "ops": [
    { "op": "set", "path": "/workspace_metadata/name", "value": "新名称" }
  ]
}`, AIPatchSchemaVersion)

	perfFormat := `{
  "summary": "优化概览",
  "bottlenecks": [{ "area": "execution", "evidence": "metrics/logs" }],
  "actions": [{ "action": "优化建议", "expected_impact": "p95 -30%" }],
  "measurement_plan": ["PromQL/日志指标"]
}`

	securityFormat := `{
  "summary": "安全审查结论",
  "risks": [
    { "id": "R-1", "severity": "high", "description": "风险描述", "mitigation": "建议" }
  ],
  "assumptions": ["假设条件"]
}`

	return AITemplateLibrary{
		Key:   "ai_template_library",
		Title: "AI 生成模板库（按意图）",
		Templates: []AITemplate{
			{
				Key:         "generate_workspace",
				Title:       "生成 Workspace",
				Intent:      "从需求生成 workspace_metadata/workflow/ui/db",
				Description: "输出符合 AI 输出协议的 JSON。",
				SystemPrompt: fmt.Sprintf("你是 Workspace 生成助手。必须输出符合 AI 输出协议的 JSON。schema_version=%s，ui_schema.schema_version=%s。只输出 JSON。",
					AIOutputSchemaVersion,
					uischema.CurrentSchemaVersion,
				),
				UserPrompt: `需求描述:
{{requirements}}

约束/边界:
{{constraints}}

访问策略:
{{access_policy}}

请输出 AI 输出协议 JSON。`,
				OutputFormat: appOutputFormat,
				Notes: []string{
					"仅输出 JSON，不要附加说明。",
				},
			},
			{
				Key:         "modify_app",
				Title:       "修改 Workspace",
				Intent:      "输出 diff/patch 模板",
				Description: "基于现有 AI 输出协议生成补丁。",
				SystemPrompt: fmt.Sprintf("你是 Workspace 修改助手。输出 AI 补丁协议 JSON。schema_version=%s。只输出 JSON。",
					AIPatchSchemaVersion,
				),
				UserPrompt: `现有协议:
{{current_protocol_json}}

修改需求:
{{change_request}}

请输出补丁 JSON。`,
				OutputFormat: patchFormat,
				Notes: []string{
					"op 支持 set/delete/merge/append，path 使用 JSON Pointer。",
				},
			},
			{
				Key:          "optimize_performance",
				Title:        "优化性能",
				Intent:       "输出性能优化提示词模板",
				Description:  "基于指标与现状输出优化建议。",
				SystemPrompt: "你是性能优化助手。输出结构化优化建议 JSON。只输出 JSON。",
				UserPrompt: `当前指标:
{{metrics}}

现状描述:
{{context}}

请输出优化建议与测量方案。`,
				OutputFormat: perfFormat,
				Notes: []string{
					"建议包含可量化的影响与回归指标。",
				},
			},
			{
				Key:          "security_review",
				Title:        "安全审查",
				Intent:       "输出安全审查提示词模板",
				Description:  "识别风险并给出缓解措施。",
				SystemPrompt: "你是安全审查助手。输出结构化风险清单 JSON。只输出 JSON。",
				UserPrompt: `功能描述:
{{feature_description}}

威胁模型/约束:
{{constraints}}

请输出风险与缓解建议。`,
				OutputFormat: securityFormat,
				Notes: []string{
					"风险项需给出严重级别与缓解动作。",
				},
			},
		},
		Notes: []string{
			"模板支持占位符替换，适合作为生成提示词基线。",
		},
	}
}
