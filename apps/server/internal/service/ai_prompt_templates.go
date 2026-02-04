package service

import (
	"fmt"
	"strings"

	"github.com/agentflow/server/internal/pkg/uischema"
)

// PromptBundle 提示词模板组合
type PromptBundle struct {
	System string
	Task   string
	Style  string
}

// SystemMessage 合并系统提示词与风格约束
func (p PromptBundle) SystemMessage() string {
	parts := []string{
		strings.TrimSpace(p.System),
		strings.TrimSpace(p.Style),
	}

	nonEmpty := make([]string, 0, len(parts))
	for _, part := range parts {
		if part != "" {
			nonEmpty = append(nonEmpty, part)
		}
	}

	return strings.Join(nonEmpty, "\n\n")
}

// UserMessage 返回任务模板内容
func (p PromptBundle) UserMessage() string {
	return strings.TrimSpace(p.Task)
}

const workflowSystemPromptTemplate = `你是一个专业的工作流设计师。用户会描述他们想要自动化的任务，你需要输出一个可解析的 AI 输出协议 JSON。

输出协议结构（JSON 对象）：
{
  "schema_version": "%[1]s",
  "app_metadata": {
    "name": "应用名称",
    "description": "应用描述",
    "icon": "可选",
    "tags": ["可选"],
    "category": "可选",
    "version": "可选"
  },
  "workflow_definition": {
    "name": "工作流名称",
    "description": "工作流描述",
    "nodes": [
      {
        "id": "唯一ID",
        "type": "节点类型",
        "position": {"x": 数字, "y": 数字},
        "data": {
          "label": "节点标签"
        }
      }
    ],
    "edges": [
      {
        "id": "边ID",
        "source": "源节点ID",
        "target": "目标节点ID",
        "sourceHandle": "输出句柄(可选)",
        "targetHandle": "输入句柄(可选)"
      }
    ]
  },
  "ui_schema": {
    "schema_version": "%[2]s",
    "layout": { "type": "stack", "props": { "gap": 16 } },
    "blocks": [
      {
        "id": "main_form",
        "type": "form",
        "label": "输入",
        "children": [
          {
            "id": "prompt",
            "type": "input",
            "label": "提示",
            "input_key": "prompt",
            "props": { "placeholder": "请输入需求" },
            "validation": { "required": true, "min": 1, "max": 2000 }
          }
        ]
      }
    ],
    "actions": [
      { "id": "submit", "type": "submit", "label": "运行" }
    ],
    "result_view": {
      "type": "markdown",
      "props": { "content": "### 结果\\n\\n{{output}}" }
    }
  },
  "db_schema": { "tables": [] },
  "access_policy": {
    "access_mode": "private",
    "data_classification": "public",
    "rate_limit": {},
    "allowed_origins": [],
    "require_captcha": false
  }
}

可用的节点类型：
1. start - 开始节点，工作流的入口
2. end - 结束节点，工作流的出口
3. llm - LLM 节点，调用大语言模型
   - 配置: model, systemPrompt, userPrompt, temperature, maxTokens
4. http - HTTP 请求节点
   - 配置: url, method, headers, body
5. template - 模板节点，字符串模板处理
   - 配置: template (使用 {{variable}} 语法)
6. condition - 条件节点，分支判断
   - 配置: field, operator, value
7. variable - 变量节点，设置和管理变量
   - 配置: variables (键值对)
8. code - 代码节点，执行自定义代码
   - 配置: language, code

布局规则：
- 起始节点放在左侧 (x: 100)
- 节点水平间距约 250px
- 节点垂直居中或按分支排列
- 每个节点 y 坐标根据布局需要调整

UI Schema 约束：
- layout.type 仅允许 stack 或 grid（stack 将归一为 single_column）
- blocks.type 仅允许 form/input/select/table/card/chart/markdown
- input/select 使用 input_key 映射 workflow 输入，缺省时使用 id
- result_view.type 仅允许 text/markdown/table/chart
- props 禁止 script/raw_html/inline_style/html/dangerouslySetInnerHTML/innerHTML`

const workflowTaskTemplate = `请根据以下描述生成应用与工作流：

%s`

const workflowStyleConstraints = `风格约束：
- 仅输出 JSON 对象，不要添加解释文字
- 不要使用 Markdown 代码块
- 不要添加注释或尾随文本
- 输出必须符合 AI 输出协议结构`

// BuildWorkflowPromptBundle 构建工作流生成提示词模板
func BuildWorkflowPromptBundle(req GenerateWorkflowRequest) PromptBundle {
	description := strings.TrimSpace(req.Description)
	task := fmt.Sprintf(workflowTaskTemplate, description)

	preferenceLines := buildPreferenceLines(req.Preferences)
	if len(preferenceLines) > 0 {
		task = strings.TrimSpace(task) + "\n\n" + strings.Join(preferenceLines, "\n")
	}

	system := fmt.Sprintf(workflowSystemPromptTemplate, AIOutputSchemaVersion, uischema.CurrentSchemaVersion)
	return PromptBundle{
		System: system,
		Task:   task,
		Style:  workflowStyleConstraints,
	}
}

func buildPreferenceLines(preferences *GenerationPreferences) []string {
	if preferences == nil {
		return nil
	}

	lines := []string{}
	if preferences.PreferredProvider != "" {
		lines = append(lines, fmt.Sprintf("首选模型提供商：%s", preferences.PreferredProvider))
	}
	if preferences.PreferredModel != "" {
		lines = append(lines, fmt.Sprintf("首选模型：%s", preferences.PreferredModel))
	}
	if preferences.Complexity != "" {
		lines = append(lines, fmt.Sprintf("复杂度：%s", preferences.Complexity))
	}
	if preferences.UseLocalModels {
		lines = append(lines, "允许使用本地模型")
	}

	return lines
}
