package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/agentflow/server/internal/pkg/uischema"
	"github.com/google/uuid"
)

var (
	ErrInvalidIntent    = errors.New("无法理解用户意图")
	ErrGenerationFailed = errors.New("工作流生成失败")
	ErrValidationFailed = errors.New("工作流验证失败")
	ErrLLMUnavailable   = errors.New("LLM 服务不可用")
)

// AIAssistantService AI 助手服务接口
type AIAssistantService interface {
	// 对话式生成
	GenerateWorkflow(ctx context.Context, userID uuid.UUID, req GenerateWorkflowRequest) (*GenerateWorkflowResponse, error)

	// 意图理解
	ParseIntent(ctx context.Context, message string) (*IntentResult, error)

	// 智能建议
	SuggestNextNode(ctx context.Context, workflowJSON string, currentNodeID string) ([]NodeSuggestion, error)
	SuggestConfig(ctx context.Context, nodeType string, context string) (map[string]interface{}, error)
	SuggestFix(ctx context.Context, errorMessage string, nodeJSON string) (*FixSuggestion, error)

	// 对话管理
	Chat(ctx context.Context, userID uuid.UUID, sessionID string, message string) (*ChatResponse, error)
}

// GenerateWorkflowRequest 生成工作流请求
type GenerateWorkflowRequest struct {
	// 用户描述
	Description string `json:"description" validate:"required"`
	// 对话历史
	ConversationHistory []ChatMessage `json:"conversation_history,omitempty"`
	// 偏好设置
	Preferences *GenerationPreferences `json:"preferences,omitempty"`
}

// GenerationPreferences 生成偏好
type GenerationPreferences struct {
	// 首选模型提供商
	PreferredProvider string `json:"preferred_provider,omitempty"`
	// 首选模型
	PreferredModel string `json:"preferred_model,omitempty"`
	// 是否使用本地模型
	UseLocalModels bool `json:"use_local_models,omitempty"`
	// 复杂度级别 (simple, medium, complex)
	Complexity string `json:"complexity,omitempty"`
}

// GenerateWorkflowResponse 生成工作流响应
type GenerateWorkflowResponse struct {
	// 生成的工作流 JSON
	WorkflowJSON string `json:"workflow_json"`
	// 生成的 UI schema
	UISchema map[string]interface{} `json:"ui_schema,omitempty"`
	// 生成的 DB schema
	DBSchema map[string]interface{} `json:"db_schema,omitempty"`
	// AI 输出协议
	OutputProtocol *AIOutputProtocol `json:"output_protocol,omitempty"`
	// 工作流说明
	Explanation string `json:"explanation"`
	// 节点列表说明
	NodeExplanations []NodeExplanation `json:"node_explanations"`
	// 建议的改进
	Suggestions []string `json:"suggestions,omitempty"`
	// 置信度 (0-1)
	Confidence float64 `json:"confidence"`
}

// NodeExplanation 节点说明
type NodeExplanation struct {
	NodeID      string `json:"node_id"`
	NodeType    string `json:"node_type"`
	NodeName    string `json:"node_name"`
	Description string `json:"description"`
	Purpose     string `json:"purpose"`
}

// IntentResult 意图分析结果
type IntentResult struct {
	// 主要意图
	Intent string `json:"intent"`
	// 实体
	Entities map[string]interface{} `json:"entities"`
	// 置信度
	Confidence float64 `json:"confidence"`
	// 建议的节点类型
	SuggestedNodeTypes []string `json:"suggested_node_types"`
	// 是否需要澄清
	NeedsClarification bool `json:"needs_clarification"`
	// 澄清问题
	ClarificationQuestion string `json:"clarification_question,omitempty"`
}

// NodeSuggestion 节点建议
type NodeSuggestion struct {
	NodeType    string                 `json:"node_type"`
	NodeName    string                 `json:"node_name"`
	Description string                 `json:"description"`
	Config      map[string]interface{} `json:"config"`
	Confidence  float64                `json:"confidence"`
	Reason      string                 `json:"reason"`
}

// FixSuggestion 修复建议
type FixSuggestion struct {
	Problem     string                 `json:"problem"`
	Solution    string                 `json:"solution"`
	FixedConfig map[string]interface{} `json:"fixed_config,omitempty"`
	Confidence  float64                `json:"confidence"`
}

// ChatMessage 聊天消息
type ChatMessage struct {
	Role    string `json:"role"` // user, assistant, system
	Content string `json:"content"`
}

// ChatResponse 聊天响应
type ChatResponse struct {
	Message        string                 `json:"message"`
	WorkflowJSON   string                 `json:"workflow_json,omitempty"`
	UISchema       map[string]interface{} `json:"ui_schema,omitempty"`
	DBSchema       map[string]interface{} `json:"db_schema,omitempty"`
	OutputProtocol *AIOutputProtocol      `json:"output_protocol,omitempty"`
	Suggestions    []string               `json:"suggestions,omitempty"`
	Actions        []ChatAction           `json:"actions,omitempty"`
}

// ChatAction 聊天动作
type ChatAction struct {
	Type  string                 `json:"type"` // generate, modify, modify_app, explain, suggest
	Label string                 `json:"label"`
	Data  map[string]interface{} `json:"data,omitempty"`
}

// ========== 实现 ==========

type aiAssistantService struct {
	// 这里可以注入 LLM 客户端
}

// NewAIAssistantService 创建 AI 助手服务
func NewAIAssistantService() AIAssistantService {
	return &aiAssistantService{}
}

// 意图分析系统提示词
const intentParsingSystemPrompt = `分析用户的意图，提取关键信息。返回 JSON 格式：

{
  "intent": "主要意图(create_workflow|modify_workflow|modify_app|suggest_db_schema|ask_question|other)",
  "entities": {
    "task_type": "任务类型",
    "input_source": "输入来源",
    "output_target": "输出目标",
    "processing_steps": ["处理步骤列表"]
  },
  "suggested_node_types": ["建议使用的节点类型"],
  "confidence": 0.0-1.0,
  "needs_clarification": true/false,
  "clarification_question": "需要澄清时的问题"
}`

func (s *aiAssistantService) GenerateWorkflow(ctx context.Context, userID uuid.UUID, req GenerateWorkflowRequest) (*GenerateWorkflowResponse, error) {
	// 构建提示词
	promptBundle := BuildWorkflowPromptBundle(req)
	messages := []ChatMessage{
		{Role: "system", Content: promptBundle.SystemMessage()},
	}

	// 添加对话历史
	for _, msg := range req.ConversationHistory {
		messages = append(messages, msg)
	}

	// 添加用户请求
	messages = append(messages, ChatMessage{Role: "user", Content: promptBundle.UserMessage()})

	// 这里应该调用实际的 LLM API
	// 目前返回示例工作流与 UI/DB schema，并进行自动修复/重试
	const maxOutputAttempts = 2

	var (
		workflowJSON   string
		uiSchema       map[string]interface{}
		dbSchema       map[string]interface{}
		workflow       map[string]interface{}
		outputProtocol *AIOutputProtocol
	)

	for attempt := 1; attempt <= maxOutputAttempts; attempt++ {
		workflowDefinition := buildSampleWorkflowDefinition(req.Description)
		uiSchema = generateSampleUISchema(req.Description)
		dbSchema = generateSampleDBSchema()

		if attempt > 1 {
			retryJSON, err := generateSampleAIOutputProtocolJSON(req.Description, workflowDefinition, uiSchema, dbSchema)
			if err != nil {
				continue
			}
			workflowJSON = retryJSON
		} else {
			rawJSON, err := marshalWorkflowDefinition(workflowDefinition)
			if err != nil {
				continue
			}
			workflowJSON = rawJSON
		}

		if err := json.Unmarshal([]byte(workflowJSON), &workflow); err != nil {
			continue
		}

		protocol, _, err := ParseOrRepairAIOutputProtocol(workflowJSON, req.Description)
		if err != nil {
			continue
		}

		if len(protocol.UISchema) == 0 {
			protocol.UISchema = uiSchema
		}
		if len(protocol.DBSchema) == 0 {
			protocol.DBSchema = dbSchema
		}
		uiSchema = protocol.UISchema
		dbSchema = protocol.DBSchema

		if err := ValidateAIOutputProtocol(*protocol); err != nil {
			continue
		}

		outputProtocol = protocol
		workflow = protocol.WorkflowDefinition

		canonicalWorkflowJSON, err := marshalWorkflowDefinition(workflow)
		if err != nil {
			outputProtocol = nil
			continue
		}
		workflowJSON = canonicalWorkflowJSON
		break
	}

	if outputProtocol == nil {
		return nil, ErrValidationFailed
	}

	// 生成节点说明
	nodeExplanations := extractNodeExplanations(workflow)

	return &GenerateWorkflowResponse{
		WorkflowJSON:     workflowJSON,
		UISchema:         uiSchema,
		DBSchema:         dbSchema,
		OutputProtocol:   outputProtocol,
		Explanation:      fmt.Sprintf("根据您的描述「%s」，我创建了一个工作流", req.Description),
		NodeExplanations: nodeExplanations,
		Suggestions: []string{
			"可以添加错误处理节点来增强健壮性",
			"考虑添加日志节点来记录执行过程",
		},
		Confidence: 0.85,
	}, nil
}

func (s *aiAssistantService) ParseIntent(ctx context.Context, message string) (*IntentResult, error) {
	// 简单的意图解析逻辑
	message = strings.ToLower(message)

	result := &IntentResult{
		Entities:   make(map[string]interface{}),
		Confidence: 0.8,
	}

	// 关键词匹配
	isCreate := strings.Contains(message, "创建") || strings.Contains(message, "生成") || strings.Contains(message, "做一个")
	isModify := strings.Contains(message, "修改") || strings.Contains(message, "改一下") || strings.Contains(message, "调整") || strings.Contains(message, "优化") || strings.Contains(message, "更新")
	isQuestion := strings.Contains(message, "什么是") || strings.Contains(message, "怎么") || strings.Contains(message, "为什么") || strings.Contains(message, "如何") || strings.Contains(message, "?") || strings.Contains(message, "？")
	isApp := strings.Contains(message, "app") || strings.Contains(message, "应用") || strings.Contains(message, "应用程序") || strings.Contains(message, "页面") || strings.Contains(message, "界面")
	isWorkflow := strings.Contains(message, "workflow") || strings.Contains(message, "工作流") || strings.Contains(message, "流程")
	isDataModel := strings.Contains(message, "数据模型") || strings.Contains(message, "表结构") || strings.Contains(message, "数据表") || strings.Contains(message, "数据库") || strings.Contains(message, "字段") || strings.Contains(message, "schema") || strings.Contains(message, "migration") || strings.Contains(message, "migrate") || strings.Contains(message, "迁移")

	if isCreate {
		result.Intent = "create_workflow"
	} else if isDataModel {
		result.Intent = "suggest_db_schema"
	} else if isModify {
		if isApp && !isWorkflow {
			result.Intent = "modify_app"
		} else {
			result.Intent = "modify_workflow"
		}
	} else if isQuestion {
		result.Intent = "ask_question"
	} else {
		result.Intent = "other"
		result.NeedsClarification = true
		result.ClarificationQuestion = "请问您想要做什么？是创建新工作流、修改现有 Workspace，还是有其他问题？"
	}

	// 提取节点类型建议
	if strings.Contains(message, "api") || strings.Contains(message, "接口") || strings.Contains(message, "请求") {
		result.SuggestedNodeTypes = append(result.SuggestedNodeTypes, "http")
	}
	if strings.Contains(message, "ai") || strings.Contains(message, "gpt") || strings.Contains(message, "大模型") || strings.Contains(message, "生成文本") {
		result.SuggestedNodeTypes = append(result.SuggestedNodeTypes, "llm")
	}
	if strings.Contains(message, "判断") || strings.Contains(message, "如果") || strings.Contains(message, "条件") {
		result.SuggestedNodeTypes = append(result.SuggestedNodeTypes, "condition")
	}
	if containsAny(message, "数据库", "db", "sql", "表", "查询", "读取") {
		result.SuggestedNodeTypes = append(result.SuggestedNodeTypes, "db_select")
	}
	if containsAny(message, "插入", "新增", "写入") {
		result.SuggestedNodeTypes = append(result.SuggestedNodeTypes, "db_insert")
	}
	if containsAny(message, "更新", "修改") {
		result.SuggestedNodeTypes = append(result.SuggestedNodeTypes, "db_update")
	}
	if containsAny(message, "删除") {
		result.SuggestedNodeTypes = append(result.SuggestedNodeTypes, "db_delete")
	}
	if containsAny(message, "迁移", "migrate", "schema") {
		result.SuggestedNodeTypes = append(result.SuggestedNodeTypes, "db_migrate")
	}

	return result, nil
}

func (s *aiAssistantService) SuggestNextNode(ctx context.Context, workflowJSON string, currentNodeID string) ([]NodeSuggestion, error) {
	// 解析工作流
	var workflow map[string]interface{}
	if err := json.Unmarshal([]byte(workflowJSON), &workflow); err != nil {
		return nil, err
	}

	// 分析当前节点类型
	nodes, _ := workflow["nodes"].([]interface{})
	var currentNodeType string
	for _, n := range nodes {
		node := n.(map[string]interface{})
		if node["id"] == currentNodeID {
			currentNodeType = node["type"].(string)
			break
		}
	}

	// 根据当前节点类型建议下一个节点
	suggestions := []NodeSuggestion{}

	switch currentNodeType {
	case "start":
		suggestions = append(suggestions, NodeSuggestion{
			NodeType:    "llm",
			NodeName:    "AI 处理",
			Description: "使用 AI 模型处理输入数据",
			Confidence:  0.9,
			Reason:      "开始节点后通常接 AI 处理或数据获取",
		})
		suggestions = append(suggestions, NodeSuggestion{
			NodeType:    "http",
			NodeName:    "获取数据",
			Description: "从外部 API 获取数据",
			Confidence:  0.8,
			Reason:      "可以从外部来源获取数据作为输入",
		})
	case "llm":
		suggestions = append(suggestions, NodeSuggestion{
			NodeType:    "template",
			NodeName:    "格式化输出",
			Description: "格式化 AI 生成的内容",
			Confidence:  0.85,
			Reason:      "AI 输出通常需要格式化处理",
		})
		suggestions = append(suggestions, NodeSuggestion{
			NodeType:    "condition",
			NodeName:    "结果判断",
			Description: "根据 AI 结果进行分支判断",
			Confidence:  0.7,
			Reason:      "可以根据 AI 输出进行条件分支",
		})
	case "http":
		suggestions = append(suggestions, NodeSuggestion{
			NodeType:    "condition",
			NodeName:    "状态检查",
			Description: "检查 HTTP 响应状态",
			Confidence:  0.9,
			Reason:      "HTTP 请求后通常需要检查响应状态",
		})
		suggestions = append(suggestions, NodeSuggestion{
			NodeType:    "llm",
			NodeName:    "AI 分析",
			Description: "使用 AI 分析获取的数据",
			Confidence:  0.8,
			Reason:      "获取的数据可以用 AI 进行分析",
		})
	case "condition":
		suggestions = append(suggestions, NodeSuggestion{
			NodeType:    "llm",
			NodeName:    "处理分支 A",
			Description: "条件成立时的处理",
			Confidence:  0.85,
			Reason:      "条件节点需要连接分支处理",
		})
	default:
		suggestions = append(suggestions, NodeSuggestion{
			NodeType:    "end",
			NodeName:    "结束",
			Description: "结束工作流",
			Confidence:  0.7,
			Reason:      "可以在此结束工作流",
		})
	}

	return suggestions, nil
}

func (s *aiAssistantService) SuggestConfig(ctx context.Context, nodeType string, contextStr string) (map[string]interface{}, error) {
	config := make(map[string]interface{})

	switch nodeType {
	case "llm":
		config["model"] = "gpt-4o-mini"
		config["temperature"] = 0.7
		config["maxTokens"] = 2048
		config["systemPrompt"] = "你是一个有帮助的 AI 助手。"
		config["userPrompt"] = "{{input}}"
	case "http":
		config["method"] = "GET"
		config["url"] = ""
		config["headers"] = map[string]string{
			"Content-Type": "application/json",
		}
	case "template":
		config["template"] = "{{input}}"
	case "condition":
		config["field"] = "status"
		config["operator"] = "equals"
		config["value"] = "success"
	case "db_select":
		config["operation"] = "select"
		config["table"] = "table_name"
		config["where"] = "id = {{input.id}}"
		config["limit"] = 100
	case "db_insert":
		config["operation"] = "insert"
		config["table"] = "table_name"
		config["values"] = map[string]interface{}{
			"field": "{{input.value}}",
		}
	case "db_update":
		config["operation"] = "update"
		config["table"] = "table_name"
		config["where"] = "id = {{input.id}}"
		config["values"] = map[string]interface{}{
			"field": "{{input.value}}",
		}
	case "db_delete":
		config["operation"] = "delete"
		config["table"] = "table_name"
		config["where"] = "id = {{input.id}}"
	case "db_migrate":
		config["operation"] = "migrate"
		config["sql"] = "CREATE TABLE example (id INT PRIMARY KEY);"
	}

	return config, nil
}

func (s *aiAssistantService) SuggestFix(ctx context.Context, errorMessage string, nodeJSON string) (*FixSuggestion, error) {
	suggestion := &FixSuggestion{
		Problem:    errorMessage,
		Confidence: 0.75,
	}

	// 分析错误类型
	errorLower := strings.ToLower(errorMessage)

	if strings.Contains(errorLower, "timeout") {
		suggestion.Solution = "增加超时时间或检查网络连接"
		suggestion.FixedConfig = map[string]interface{}{
			"timeout": 30000,
		}
	} else if strings.Contains(errorLower, "auth") || strings.Contains(errorLower, "401") {
		suggestion.Solution = "检查 API Key 是否正确配置"
	} else if strings.Contains(errorLower, "rate limit") || strings.Contains(errorLower, "429") {
		suggestion.Solution = "添加延迟节点或使用重试机制"
	} else if strings.Contains(errorLower, "json") || strings.Contains(errorLower, "parse") {
		suggestion.Solution = "检查输入数据格式是否为有效的 JSON"
	} else {
		suggestion.Solution = "检查节点配置是否正确，并确保所有必填字段都已填写"
	}

	return suggestion, nil
}

func (s *aiAssistantService) Chat(ctx context.Context, userID uuid.UUID, sessionID string, message string) (*ChatResponse, error) {
	// 解析意图
	intent, err := s.ParseIntent(ctx, message)
	if err != nil {
		return nil, err
	}

	response := &ChatResponse{
		Actions: []ChatAction{},
	}

	switch intent.Intent {
	case "create_workflow":
		response.Message = "好的，我来帮您创建工作流。请稍等..."
		response.Actions = append(response.Actions, ChatAction{
			Type:  "generate",
			Label: "生成工作流",
			Data: map[string]interface{}{
				"description": message,
			},
		})

		// 生成工作流
		genResult, err := s.GenerateWorkflow(ctx, userID, GenerateWorkflowRequest{
			Description: message,
		})
		if err == nil {
			response.WorkflowJSON = genResult.WorkflowJSON
			response.UISchema = genResult.UISchema
			response.DBSchema = genResult.DBSchema
			response.OutputProtocol = genResult.OutputProtocol
			response.Message = genResult.Explanation
			response.Suggestions = genResult.Suggestions
		}

	case "modify_workflow":
		response.Message = "请告诉我您想如何修改工作流？"
		response.Actions = append(response.Actions, ChatAction{
			Type:  "modify",
			Label: "修改工作流",
		})

	case "modify_app":
		response.Message = "请告诉我需要修改的 Workspace（名称/ID），以及想调整的功能、界面或数据模型。"
		response.Actions = append(response.Actions, ChatAction{
			Type:  "modify_app",
			Label: "修改 Workspace",
			Data: map[string]interface{}{
				"intent": "modify_app",
			},
		})

	case "suggest_db_schema":
		dbSchema, migrationHints := generateDBSchemaSuggestion(message)
		response.Message = "已根据你的描述生成数据模型建议与迁移步骤。"
		response.DBSchema = dbSchema
		response.Suggestions = migrationHints

	case "ask_question":
		response.Message = "这是一个很好的问题。让我为您解答..."
		// 这里可以调用 LLM 回答问题

	default:
		if intent.NeedsClarification {
			response.Message = intent.ClarificationQuestion
		} else {
			response.Message = "我理解了您的需求。您可以选择以下操作："
			response.Actions = append(response.Actions,
				ChatAction{Type: "generate", Label: "创建新工作流"},
				ChatAction{Type: "suggest", Label: "获取建议"},
			)
		}
	}

	return response, nil
}

// ========== 辅助函数 ==========

func buildSampleWorkflowDefinition(description string) map[string]interface{} {
	workflowID := uuid.New().String()[:8]

	return map[string]interface{}{
		"name":        fmt.Sprintf("AI 生成工作流 - %s", workflowID),
		"description": description,
		"nodes": []map[string]interface{}{
			{
				"id":       "start-1",
				"type":     "start",
				"position": map[string]float64{"x": 100, "y": 200},
				"data": map[string]interface{}{
					"label": "开始",
				},
			},
			{
				"id":       "llm-1",
				"type":     "llm",
				"position": map[string]float64{"x": 350, "y": 200},
				"data": map[string]interface{}{
					"label":        "AI 处理",
					"model":        "gpt-4o-mini",
					"systemPrompt": "你是一个有帮助的 AI 助手。",
					"userPrompt":   "{{input}}",
					"temperature":  0.7,
					"maxTokens":    2048,
				},
			},
			{
				"id":       "template-1",
				"type":     "template",
				"position": map[string]float64{"x": 600, "y": 200},
				"data": map[string]interface{}{
					"label":    "格式化输出",
					"template": "处理结果：\n\n{{llm-1.text}}",
				},
			},
			{
				"id":       "end-1",
				"type":     "end",
				"position": map[string]float64{"x": 850, "y": 200},
				"data": map[string]interface{}{
					"label": "结束",
				},
			},
		},
		"edges": []map[string]interface{}{
			{"id": "e1", "source": "start-1", "target": "llm-1"},
			{"id": "e2", "source": "llm-1", "target": "template-1"},
			{"id": "e3", "source": "template-1", "target": "end-1"},
		},
	}
}

// 生成示例工作流
func generateSampleWorkflow(description string) string {
	workflow := buildSampleWorkflowDefinition(description)
	workflowJSON, err := marshalWorkflowDefinition(workflow)
	if err != nil {
		return "{}"
	}
	return workflowJSON
}

func marshalWorkflowDefinition(definition map[string]interface{}) (string, error) {
	if definition == nil {
		return "", errors.New("workflow definition is nil")
	}
	jsonBytes, err := json.MarshalIndent(definition, "", "  ")
	if err != nil {
		return "", err
	}
	return string(jsonBytes), nil
}

func generateSampleAIOutputProtocolJSON(
	description string,
	workflowDefinition map[string]interface{},
	uiSchema map[string]interface{},
	dbSchema map[string]interface{},
) (string, error) {
	protocol := BuildAIOutputProtocol(description, workflowDefinition, uiSchema, dbSchema)
	jsonBytes, err := json.MarshalIndent(protocol, "", "  ")
	if err != nil {
		return "", err
	}
	return string(jsonBytes), nil
}

func generateSampleUISchema(description string) map[string]interface{} {
	title := "Generated Form"
	trimmed := strings.TrimSpace(description)
	if trimmed != "" {
		title = "Generated Form: " + trimmed
	}

	inputBlock := map[string]interface{}{
		"id":        "input",
		"type":      "input",
		"label":     "Input",
		"input_key": "input",
		"props": map[string]interface{}{
			"placeholder": "Enter input",
		},
		"validation": map[string]interface{}{
			"required": true,
			"min":      1,
		},
	}

	return map[string]interface{}{
		"schema_version": uischema.CurrentSchemaVersion,
		"layout": map[string]interface{}{
			"type": "stack",
			"props": map[string]interface{}{
				"gap": 16,
			},
		},
		"blocks": []map[string]interface{}{
			{
				"id":       "form",
				"type":     "form",
				"label":    title,
				"children": []map[string]interface{}{inputBlock},
			},
			{
				"id":    "result_card",
				"type":  "card",
				"label": "Result",
				"props": map[string]interface{}{
					"title":       "Result",
					"description": "运行结果将在此显示",
				},
			},
		},
		"actions": []map[string]interface{}{
			{"id": "submit", "type": "submit", "label": "运行"},
		},
		"result_view": map[string]interface{}{
			"type": "markdown",
			"props": map[string]interface{}{
				"content": "### 运行结果\n\n{{output}}",
			},
		},
	}
}

func generateSampleDBSchema() map[string]interface{} {
	return map[string]interface{}{
		"version": "1.0",
		"tables": []map[string]interface{}{
			{
				"name": "app_runs",
				"columns": []map[string]interface{}{
					{"name": "id", "type": "uuid", "primary": true},
					{"name": "input", "type": "text"},
					{"name": "output", "type": "text"},
					{"name": "created_at", "type": "timestamp"},
				},
			},
		},
	}
}

type schemaColumn struct {
	Name     string
	DataType string
	Primary  bool
	Nullable bool
}

type schemaTable struct {
	Name    string
	Columns []schemaColumn
}

func generateDBSchemaSuggestion(description string) (map[string]interface{}, []string) {
	lower := strings.ToLower(description)
	tables := []schemaTable{}

	if containsAny(lower, "用户", "user", "account", "member", "会员") {
		tables = append(tables, schemaTable{
			Name: "users",
			Columns: []schemaColumn{
				{Name: "id", DataType: "uuid", Primary: true, Nullable: false},
				{Name: "name", DataType: "text", Nullable: false},
				{Name: "email", DataType: "text", Nullable: false},
				{Name: "created_at", DataType: "timestamp", Nullable: false},
			},
		})
	}

	if containsAny(lower, "订单", "order", "购买", "purchase") {
		tables = append(tables, schemaTable{
			Name: "orders",
			Columns: []schemaColumn{
				{Name: "id", DataType: "uuid", Primary: true, Nullable: false},
				{Name: "user_id", DataType: "uuid", Nullable: false},
				{Name: "status", DataType: "text", Nullable: false},
				{Name: "total_amount", DataType: "decimal(10,2)", Nullable: false},
				{Name: "created_at", DataType: "timestamp", Nullable: false},
			},
		})
	}

	if containsAny(lower, "文章", "内容", "帖子", "post", "blog") {
		tables = append(tables, schemaTable{
			Name: "posts",
			Columns: []schemaColumn{
				{Name: "id", DataType: "uuid", Primary: true, Nullable: false},
				{Name: "title", DataType: "text", Nullable: false},
				{Name: "content", DataType: "text", Nullable: false},
				{Name: "created_at", DataType: "timestamp", Nullable: false},
			},
		})
	}

	if containsAny(lower, "评论", "comment") {
		tables = append(tables, schemaTable{
			Name: "comments",
			Columns: []schemaColumn{
				{Name: "id", DataType: "uuid", Primary: true, Nullable: false},
				{Name: "post_id", DataType: "uuid", Nullable: false},
				{Name: "content", DataType: "text", Nullable: false},
				{Name: "created_at", DataType: "timestamp", Nullable: false},
			},
		})
	}

	if containsAny(lower, "任务", "待办", "todo", "task") {
		tables = append(tables, schemaTable{
			Name: "tasks",
			Columns: []schemaColumn{
				{Name: "id", DataType: "uuid", Primary: true, Nullable: false},
				{Name: "title", DataType: "text", Nullable: false},
				{Name: "status", DataType: "text", Nullable: false},
				{Name: "created_at", DataType: "timestamp", Nullable: false},
			},
		})
	}

	if len(tables) == 0 {
		tables = append(tables, schemaTable{
			Name: "records",
			Columns: []schemaColumn{
				{Name: "id", DataType: "uuid", Primary: true, Nullable: false},
				{Name: "title", DataType: "text", Nullable: false},
				{Name: "content", DataType: "text", Nullable: true},
				{Name: "created_at", DataType: "timestamp", Nullable: false},
			},
		})
	}

	tableMaps := []map[string]interface{}{}
	migrationSteps := []map[string]interface{}{}
	for idx, table := range tables {
		columnMaps := []map[string]interface{}{}
		for _, column := range table.Columns {
			columnMaps = append(columnMaps, map[string]interface{}{
				"name":     column.Name,
				"type":     column.DataType,
				"primary":  column.Primary,
				"nullable": column.Nullable,
			})
		}
		tableMaps = append(tableMaps, map[string]interface{}{
			"name":    table.Name,
			"columns": columnMaps,
		})
		migrationSteps = append(migrationSteps, map[string]interface{}{
			"id":          fmt.Sprintf("m%02d", idx+1),
			"description": fmt.Sprintf("创建表 %s", table.Name),
			"sql":         buildCreateTableSQL(table),
		})
	}

	dbSchema := map[string]interface{}{
		"version":    "1.0",
		"tables":     tableMaps,
		"migrations": migrationSteps,
	}

	hints := []string{
		"迁移建议：先创建新表，回填历史数据后再切换读写。",
		"建议为高频查询字段加索引（如外键与状态字段）。",
	}
	if containsAny(lower, "订单", "order", "购买", "purchase") && containsAny(lower, "用户", "user", "account", "member", "会员") {
		hints = append(hints, "订单表建议关联用户表（orders.user_id -> users.id）。")
	}

	return dbSchema, hints
}

func buildCreateTableSQL(table schemaTable) string {
	parts := []string{}
	for _, column := range table.Columns {
		line := fmt.Sprintf("%s %s", column.Name, column.DataType)
		if column.Primary {
			line += " PRIMARY KEY"
		}
		if !column.Nullable {
			line += " NOT NULL"
		}
		parts = append(parts, line)
	}
	return fmt.Sprintf("CREATE TABLE %s (\n  %s\n);", table.Name, strings.Join(parts, ",\n  "))
}

func containsAny(text string, keywords ...string) bool {
	for _, keyword := range keywords {
		if strings.Contains(text, keyword) {
			return true
		}
	}
	return false
}

// 提取节点说明
func extractNodeExplanations(workflow map[string]interface{}) []NodeExplanation {
	explanations := []NodeExplanation{}

	nodes, ok := workflow["nodes"].([]interface{})
	if !ok {
		return explanations
	}

	nodeDescriptions := map[string]string{
		"start":      "工作流的入口点，接收输入数据",
		"end":        "工作流的出口点，输出最终结果",
		"llm":        "调用大语言模型处理数据",
		"http":       "发送 HTTP 请求获取或发送数据",
		"template":   "使用模板格式化文本",
		"condition":  "根据条件进行分支判断",
		"variable":   "设置和管理变量",
		"code":       "执行自定义代码逻辑",
		"db_select":  "查询数据库数据",
		"db_insert":  "向数据库写入数据",
		"db_update":  "更新数据库数据",
		"db_delete":  "删除数据库数据",
		"db_migrate": "执行数据库迁移",
	}

	for _, n := range nodes {
		node := n.(map[string]interface{})
		nodeID := node["id"].(string)
		nodeType := node["type"].(string)
		data := node["data"].(map[string]interface{})
		nodeName := ""
		if label, ok := data["label"].(string); ok {
			nodeName = label
		}

		explanations = append(explanations, NodeExplanation{
			NodeID:      nodeID,
			NodeType:    nodeType,
			NodeName:    nodeName,
			Description: nodeDescriptions[nodeType],
			Purpose:     fmt.Sprintf("在工作流中作为 %s 使用", nodeType),
		})
	}

	return explanations
}
