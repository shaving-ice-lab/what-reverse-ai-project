package executor

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"regexp"
	"strings"
	"time"
)

// ========================
// Start 节点执行器
// ========================

type StartExecutor struct{}

func NewStartExecutor() *StartExecutor {
	return &StartExecutor{}
}

func (e *StartExecutor) GetType() NodeType {
	return NodeTypeStart
}

func (e *StartExecutor) Execute(ctx context.Context, node *NodeDefinition, inputs map[string]interface{}, execCtx *ExecutionContext) (*NodeResult, error) {
	// 开始节点直接传递输入
	return &NodeResult{
		NodeID:  node.ID,
		Status:  NodeStatusCompleted,
		Outputs: inputs,
	}, nil
}

// ========================
// End 节点执行器
// ========================

type EndExecutor struct{}

func NewEndExecutor() *EndExecutor {
	return &EndExecutor{}
}

func (e *EndExecutor) GetType() NodeType {
	return NodeTypeEnd
}

func (e *EndExecutor) Execute(ctx context.Context, node *NodeDefinition, inputs map[string]interface{}, execCtx *ExecutionContext) (*NodeResult, error) {
	// 结束节点收集所有输入作为输出
	return &NodeResult{
		NodeID:  node.ID,
		Status:  NodeStatusCompleted,
		Outputs: inputs,
	}, nil
}

// ========================
// Variable 节点执行器
// ========================

type VariableExecutor struct{}

func NewVariableExecutor() *VariableExecutor {
	return &VariableExecutor{}
}

func (e *VariableExecutor) GetType() NodeType {
	return NodeTypeVariable
}

func (e *VariableExecutor) Execute(ctx context.Context, node *NodeDefinition, inputs map[string]interface{}, execCtx *ExecutionContext) (*NodeResult, error) {
	outputs := make(map[string]interface{})

	switch variables := node.Config["variables"].(type) {
	case map[string]interface{}:
		// 支持直接传入键值对形式的变量配置
		for name, rawVal := range variables {
			value := rawVal
			if strVal, ok := rawVal.(string); ok {
				value = interpolateVariables(strVal, inputs, execCtx)
			}
			outputs[name] = value
			execCtx.Variables[name] = value
		}
	case []interface{}:
		// 兼容原有的数组配置
		for _, v := range variables {
			if variable, ok := v.(map[string]interface{}); ok {
				name := getString(variable, "name")
				value := variable["value"]
				varType := getString(variable, "type")

				// 处理变量插值
				if strVal, ok := value.(string); ok {
					value = interpolateVariables(strVal, inputs, execCtx)
				}

				// 类型转换
				value = convertType(value, varType)
				outputs[name] = value

				// 更新全局变量
				execCtx.Variables[name] = value
			}
		}
	}

	return &NodeResult{
		NodeID:  node.ID,
		Status:  NodeStatusCompleted,
		Outputs: outputs,
	}, nil
}

// ========================
// Template 节点执行器
// ========================

type TemplateExecutor struct{}

func NewTemplateExecutor() *TemplateExecutor {
	return &TemplateExecutor{}
}

func (e *TemplateExecutor) GetType() NodeType {
	return NodeTypeTemplate
}

func (e *TemplateExecutor) Execute(ctx context.Context, node *NodeDefinition, inputs map[string]interface{}, execCtx *ExecutionContext) (*NodeResult, error) {
	template := getString(node.Config, "template")

	// 处理变量插值
	result := interpolateVariables(template, inputs, execCtx)

	return &NodeResult{
		NodeID: node.ID,
		Status: NodeStatusCompleted,
		Outputs: map[string]interface{}{
			"output": result,
			"text":   result,
		},
	}, nil
}

// ========================
// Condition 节点执行器
// ========================

type ConditionExecutor struct{}

func NewConditionExecutor() *ConditionExecutor {
	return &ConditionExecutor{}
}

func (e *ConditionExecutor) GetType() NodeType {
	return NodeTypeCondition
}

func (e *ConditionExecutor) Execute(ctx context.Context, node *NodeDefinition, inputs map[string]interface{}, execCtx *ExecutionContext) (*NodeResult, error) {
	// 获取条件组
	conditionGroups, _ := node.Config["conditionGroups"].([]interface{})

	result := false
	// 兼容简易配置：直接使用 field/operator/value
	if len(conditionGroups) == 0 {
		field := getString(node.Config, "field")
		operator := getString(node.Config, "operator")
		right := resolveValue(node.Config["value"], inputs, execCtx)

		if field != "" && operator != "" {
			left := resolveValue(fmt.Sprintf("{{%s}}", field), inputs, execCtx)
			result = evaluateCondition(left, operator, right)
		}
	} else {
		for _, group := range conditionGroups {
			groupMap, ok := group.(map[string]interface{})
			if !ok {
				continue
			}

			conditions, _ := groupMap["conditions"].([]interface{})
			logic := getString(groupMap, "logic")
			if logic == "" {
				logic = "and"
			}

			groupResult := e.evaluateGroup(conditions, logic, inputs, execCtx)
			if groupResult {
				result = true
				break // OR 逻辑，任一组为真则整体为真
			}
		}
	}

	branch := "false"
	if result {
		branch = "true"
	}

	// 输出分支结果
	return &NodeResult{
		NodeID: node.ID,
		Status: NodeStatusCompleted,
		Outputs: map[string]interface{}{
			"result":   result,
			"branch":   branch,                           // 便于直接使用字符串分支
			"branches": map[string]bool{"true": result, "false": !result}, // 保持兼容的布尔映射
		},
	}, nil
}

func (e *ConditionExecutor) evaluateGroup(conditions []interface{}, logic string, inputs map[string]interface{}, execCtx *ExecutionContext) bool {
	if len(conditions) == 0 {
		return true
	}

	for _, cond := range conditions {
		condMap, ok := cond.(map[string]interface{})
		if !ok {
			continue
		}

		leftValue := resolveValue(condMap["left"], inputs, execCtx)
		operator := getString(condMap, "operator")
		rightValue := resolveValue(condMap["right"], inputs, execCtx)

		condResult := evaluateCondition(leftValue, operator, rightValue)

		if logic == "and" && !condResult {
			return false
		}
		if logic == "or" && condResult {
			return true
		}
	}

	return logic == "and"
}

// ========================
// Loop 节点执行器
// ========================

type LoopExecutor struct{}

func NewLoopExecutor() *LoopExecutor {
	return &LoopExecutor{}
}

func (e *LoopExecutor) GetType() NodeType {
	return NodeTypeLoop
}

func (e *LoopExecutor) Execute(ctx context.Context, node *NodeDefinition, inputs map[string]interface{}, execCtx *ExecutionContext) (*NodeResult, error) {
	loopType := getString(node.Config, "loopType")
	maxIterations := getInt(node.Config, "maxIterations", 1000)

	var results []interface{}
	iteration := 0

	switch loopType {
	case "forEach":
		// 获取要遍历的数组
		itemsKey := getString(node.Config, "itemsKey")
		items := resolveValue(itemsKey, inputs, execCtx)

		itemsArray, ok := toArray(items)
		if !ok {
			return nil, fmt.Errorf("forEach requires an array, got %T", items)
		}

		for i, item := range itemsArray {
			if i >= maxIterations {
				break
			}
			// 在实际实现中，这里应该执行循环体内的节点
			// 这里简化为直接收集结果
			results = append(results, item)
			iteration++
		}

	case "count":
		count := getInt(node.Config, "count", 1)
		if count > maxIterations {
			count = maxIterations
		}
		for i := 0; i < count; i++ {
			results = append(results, i)
			iteration++
		}

	case "while":
		// While 循环需要在每次迭代后重新评估条件
		// 这里简化实现
		for iteration < maxIterations {
			// 评估条件
			condition := node.Config["condition"]
			if condition == nil {
				break
			}
			// 简化：直接中断
			break
		}
	}

	return &NodeResult{
		NodeID: node.ID,
		Status: NodeStatusCompleted,
		Outputs: map[string]interface{}{
			"results":   results,
			"count":     iteration,
			"completed": true,
		},
	}, nil
}

// ========================
// HTTP 节点执行器
// ========================

type HTTPExecutor struct {
	client *http.Client
}

func NewHTTPExecutor() *HTTPExecutor {
	return &HTTPExecutor{
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (e *HTTPExecutor) GetType() NodeType {
	return NodeTypeHTTP
}

func (e *HTTPExecutor) Execute(ctx context.Context, node *NodeDefinition, inputs map[string]interface{}, execCtx *ExecutionContext) (*NodeResult, error) {
	method := getString(node.Config, "method")
	if method == "" {
		method = "GET"
	}

	url := getString(node.Config, "url")
	url = interpolateVariables(url, inputs, execCtx)

	// 构建请求体
	var body io.Reader
	if method != "GET" && method != "HEAD" {
		bodyConfig := node.Config["body"]
		if bodyConfig != nil {
			bodyBytes, _ := json.Marshal(bodyConfig)
			bodyStr := interpolateVariables(string(bodyBytes), inputs, execCtx)
			body = bytes.NewBufferString(bodyStr)
		}
	}

	// 创建请求
	req, err := http.NewRequestWithContext(ctx, method, url, body)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// 设置 Headers
	if headers, ok := node.Config["headers"].(map[string]interface{}); ok {
		for k, v := range headers {
			req.Header.Set(k, fmt.Sprintf("%v", v))
		}
	}

	// 设置认证
	if auth, ok := node.Config["auth"].(map[string]interface{}); ok {
		authType := getString(auth, "type")
		switch authType {
		case "bearer":
			token := getString(auth, "token")
			token = interpolateVariables(token, inputs, execCtx)
			req.Header.Set("Authorization", "Bearer "+token)
		case "basic":
			username := getString(auth, "username")
			password := getString(auth, "password")
			req.SetBasicAuth(username, password)
		case "apiKey":
			key := getString(auth, "key")
			value := getString(auth, "value")
			value = interpolateVariables(value, inputs, execCtx)
			headerName := getString(auth, "headerName")
			if headerName == "" {
				headerName = "X-API-Key"
			}
			if key != "" {
				req.Header.Set(key, value)
			} else {
				req.Header.Set(headerName, value)
			}
		}
	}

	// 发送请求
	resp, err := e.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	// 读取响应
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	// 解析响应
	var data interface{}
	if err := json.Unmarshal(respBody, &data); err != nil {
		// 如果不是 JSON，返回原始文本
		data = string(respBody)
	}

	return &NodeResult{
		NodeID: node.ID,
		Status: NodeStatusCompleted,
		Outputs: map[string]interface{}{
			"data":       data,
			"status":     resp.StatusCode,
			"statusText": resp.Status,
			"headers":    resp.Header,
			"body":       string(respBody),
		},
	}, nil
}

// ========================
// LLM 节点执行器
// ========================

type LLMExecutor struct {
	client *http.Client
}

func NewLLMExecutor() *LLMExecutor {
	return &LLMExecutor{
		client: &http.Client{
			Timeout: 120 * time.Second,
		},
	}
}

func (e *LLMExecutor) GetType() NodeType {
	return NodeTypeLLM
}

func (e *LLMExecutor) Execute(ctx context.Context, node *NodeDefinition, inputs map[string]interface{}, execCtx *ExecutionContext) (*NodeResult, error) {
	provider := getString(node.Config, "provider")
	model := getString(node.Config, "model")
	systemPrompt := getString(node.Config, "systemPrompt")
	userPrompt := getString(node.Config, "userPrompt")

	// 变量插值
	systemPrompt = interpolateVariables(systemPrompt, inputs, execCtx)
	userPrompt = interpolateVariables(userPrompt, inputs, execCtx)

	// 获取 API 密钥
	apiKey := execCtx.APIKeys[provider]
	if apiKey == "" {
		// 尝试从配置获取
		apiKey = getString(node.Config, "apiKey")
	}

	if apiKey == "" {
		return nil, fmt.Errorf("API key not found for provider: %s", provider)
	}

	// 获取参数
	temperature := getFloat(node.Config, "temperature", 0.7)
	maxTokens := getInt(node.Config, "maxTokens", 2048)

	// 构建消息
	messages := []map[string]string{}
	if systemPrompt != "" {
		messages = append(messages, map[string]string{
			"role":    "system",
			"content": systemPrompt,
		})
	}
	messages = append(messages, map[string]string{
		"role":    "content",
		"content": userPrompt,
	})

	// 根据 provider 调用不同的 API
	var content string
	var usage TokenUsage
	var err error

	switch provider {
	case "openai":
		content, usage, err = e.callOpenAI(ctx, apiKey, model, messages, temperature, maxTokens)
	case "anthropic":
		content, usage, err = e.callAnthropic(ctx, apiKey, model, messages, temperature, maxTokens)
	default:
		// 默认使用 OpenAI 兼容接口
		content, usage, err = e.callOpenAI(ctx, apiKey, model, messages, temperature, maxTokens)
	}

	if err != nil {
		return nil, err
	}

	return &NodeResult{
		NodeID: node.ID,
		Status: NodeStatusCompleted,
		Outputs: map[string]interface{}{
			"content": content,
			"text":    content,
			"usage":   usage,
		},
	}, nil
}

func (e *LLMExecutor) callOpenAI(ctx context.Context, apiKey, model string, messages []map[string]string, temperature float64, maxTokens int) (string, TokenUsage, error) {
	reqBody := map[string]interface{}{
		"model":       model,
		"messages":    messages,
		"temperature": temperature,
		"max_tokens":  maxTokens,
	}

	bodyBytes, _ := json.Marshal(reqBody)
	req, err := http.NewRequestWithContext(ctx, "POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(bodyBytes))
	if err != nil {
		return "", TokenUsage{}, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	resp, err := e.client.Do(req)
	if err != nil {
		return "", TokenUsage{}, err
	}
	defer resp.Body.Close()

	var result struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
		Usage struct {
			PromptTokens     int `json:"prompt_tokens"`
			CompletionTokens int `json:"completion_tokens"`
			TotalTokens      int `json:"total_tokens"`
		} `json:"usage"`
		Error struct {
			Message string `json:"message"`
		} `json:"error"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", TokenUsage{}, err
	}

	if result.Error.Message != "" {
		return "", TokenUsage{}, fmt.Errorf("OpenAI API error: %s", result.Error.Message)
	}

	if len(result.Choices) == 0 {
		return "", TokenUsage{}, fmt.Errorf("no response from OpenAI")
	}

	usage := TokenUsage{
		PromptTokens:     result.Usage.PromptTokens,
		CompletionTokens: result.Usage.CompletionTokens,
		TotalTokens:      result.Usage.TotalTokens,
	}

	return result.Choices[0].Message.Content, usage, nil
}

func (e *LLMExecutor) callAnthropic(ctx context.Context, apiKey, model string, messages []map[string]string, temperature float64, maxTokens int) (string, TokenUsage, error) {
	// 提取 system message
	var systemContent string
	var anthropicMessages []map[string]string
	for _, msg := range messages {
		if msg["role"] == "system" {
			systemContent = msg["content"]
		} else {
			anthropicMessages = append(anthropicMessages, map[string]string{
				"role":    "user",
				"content": msg["content"],
			})
		}
	}

	reqBody := map[string]interface{}{
		"model":       model,
		"messages":    anthropicMessages,
		"max_tokens":  maxTokens,
		"temperature": temperature,
	}
	if systemContent != "" {
		reqBody["system"] = systemContent
	}

	bodyBytes, _ := json.Marshal(reqBody)
	req, err := http.NewRequestWithContext(ctx, "POST", "https://api.anthropic.com/v1/messages", bytes.NewBuffer(bodyBytes))
	if err != nil {
		return "", TokenUsage{}, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", apiKey)
	req.Header.Set("anthropic-version", "2023-06-01")

	resp, err := e.client.Do(req)
	if err != nil {
		return "", TokenUsage{}, err
	}
	defer resp.Body.Close()

	var result struct {
		Content []struct {
			Text string `json:"text"`
		} `json:"content"`
		Usage struct {
			InputTokens  int `json:"input_tokens"`
			OutputTokens int `json:"output_tokens"`
		} `json:"usage"`
		Error struct {
			Message string `json:"message"`
		} `json:"error"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", TokenUsage{}, err
	}

	if result.Error.Message != "" {
		return "", TokenUsage{}, fmt.Errorf("Anthropic API error: %s", result.Error.Message)
	}

	if len(result.Content) == 0 {
		return "", TokenUsage{}, fmt.Errorf("no response from Anthropic")
	}

	usage := TokenUsage{
		PromptTokens:     result.Usage.InputTokens,
		CompletionTokens: result.Usage.OutputTokens,
		TotalTokens:      result.Usage.InputTokens + result.Usage.OutputTokens,
	}

	return result.Content[0].Text, usage, nil
}

// ========================
// 辅助函数
// ========================

var variablePattern = regexp.MustCompile(`\{\{([^}]+)\}\}`)

func interpolateVariables(template string, inputs map[string]interface{}, execCtx *ExecutionContext) string {
	return variablePattern.ReplaceAllStringFunc(template, func(match string) string {
		// 提取变量路径
		path := strings.Trim(match, "{}")
		path = strings.TrimSpace(path)

		// 先从 inputs 查找
		if val, ok := inputs[path]; ok {
			return fmt.Sprintf("%v", val)
		}

		// 支持 nodeId.outputKey 格式
		parts := strings.Split(path, ".")
		if len(parts) >= 2 {
			nodeID := parts[0]
			if nodeOutputs := execCtx.GetNodeOutput(nodeID); nodeOutputs != nil {
				key := strings.Join(parts[1:], ".")
				if val, ok := nodeOutputs[key]; ok {
					return fmt.Sprintf("%v", val)
				}
			}
		}

		// 从全局变量查找
		if val, ok := execCtx.Variables[path]; ok {
			return fmt.Sprintf("%v", val)
		}

		// 未找到，返回原始占位符
		return match
	})
}

func resolveValue(value interface{}, inputs map[string]interface{}, execCtx *ExecutionContext) interface{} {
	if strVal, ok := value.(string); ok {
		// 检查是否是变量引用
		if strings.HasPrefix(strVal, "{{") && strings.HasSuffix(strVal, "}}") {
			path := strings.Trim(strVal, "{}")
			path = strings.TrimSpace(path)

			if val, ok := inputs[path]; ok {
				return val
			}
			if val, ok := execCtx.Variables[path]; ok {
				return val
			}
		}
		return interpolateVariables(strVal, inputs, execCtx)
	}
	return value
}

func evaluateCondition(left interface{}, operator string, right interface{}) bool {
	toFloat := func(val interface{}) (float64, bool) {
		switch v := val.(type) {
		case float64:
			return v, true
		case float32:
			return float64(v), true
		case int:
			return float64(v), true
		case int32:
			return float64(v), true
		case int64:
			return float64(v), true
		case string:
			if f, err := strconv.ParseFloat(v, 64); err == nil {
				return f, true
			}
		}
		return 0, false
	}

	// 转换为字符串比较
	leftStr := fmt.Sprintf("%v", left)
	rightStr := fmt.Sprintf("%v", right)

	switch operator {
	case "==", "equals":
		return leftStr == rightStr
	case "!=", "notEquals":
		return leftStr != rightStr
	case ">", ">=", "<", "<=", "greater_than", "greater_than_or_equal", "less_than", "less_than_or_equal", "gt", "gte", "lt", "lte":
		if lNum, ok := toFloat(left); ok {
			if rNum, rok := toFloat(right); rok {
				switch operator {
				case ">", "greater_than", "gt":
					return lNum > rNum
				case ">=", "greater_than_or_equal", "gte":
					return lNum >= rNum
				case "<", "less_than", "lt":
					return lNum < rNum
				case "<=", "less_than_or_equal", "lte":
					return lNum <= rNum
				}
			}
		}
		// 回退到字符串比较
		switch operator {
		case ">", "greater_than", "gt":
			return leftStr > rightStr
		case ">=", "greater_than_or_equal", "gte":
			return leftStr >= rightStr
		case "<", "less_than", "lt":
			return leftStr < rightStr
		case "<=", "less_than_or_equal", "lte":
			return leftStr <= rightStr
		}
		return false
	case "contains":
		return strings.Contains(leftStr, rightStr)
	case "startsWith":
		return strings.HasPrefix(leftStr, rightStr)
	case "endsWith":
		return strings.HasSuffix(leftStr, rightStr)
	case "matches":
		matched, _ := regexp.MatchString(rightStr, leftStr)
		return matched
	case "isEmpty":
		return leftStr == ""
	case "isNotEmpty":
		return leftStr != ""
	default:
		return false
	}
}

func getString(m map[string]interface{}, key string) string {
	if val, ok := m[key]; ok {
		if str, ok := val.(string); ok {
			return str
		}
	}
	return ""
}

func getInt(m map[string]interface{}, key string, defaultVal int) int {
	if val, ok := m[key]; ok {
		switch v := val.(type) {
		case int:
			return v
		case float64:
			return int(v)
		case int64:
			return int(v)
		}
	}
	return defaultVal
}

func getFloat(m map[string]interface{}, key string, defaultVal float64) float64 {
	if val, ok := m[key]; ok {
		switch v := val.(type) {
		case float64:
			return v
		case int:
			return float64(v)
		case int64:
			return float64(v)
		}
	}
	return defaultVal
}

func convertType(value interface{}, targetType string) interface{} {
	switch targetType {
	case "string":
		return fmt.Sprintf("%v", value)
	case "number":
		if f, ok := value.(float64); ok {
			return f
		}
		return 0
	case "boolean":
		if b, ok := value.(bool); ok {
			return b
		}
		return false
	case "array":
		if arr, ok := value.([]interface{}); ok {
			return arr
		}
		return []interface{}{}
	case "object":
		if obj, ok := value.(map[string]interface{}); ok {
			return obj
		}
		return map[string]interface{}{}
	default:
		return value
	}
}

func toArray(value interface{}) ([]interface{}, bool) {
	switch v := value.(type) {
	case []interface{}:
		return v, true
	case []string:
		arr := make([]interface{}, len(v))
		for i, s := range v {
			arr[i] = s
		}
		return arr, true
	default:
		return nil, false
	}
}

func getBool(m map[string]interface{}, key string) bool {
	if v, ok := m[key]; ok {
		return toBool(v)
	}
	return false
}

func toBool(value interface{}) bool {
	if value == nil {
		return false
	}
	switch v := value.(type) {
	case bool:
		return v
	case string:
		return v == "true" || v == "1" || v == "yes"
	case int:
		return v != 0
	case float64:
		return v != 0
	default:
		return false
	}
}

func toFloat64(value interface{}) (float64, error) {
	switch v := value.(type) {
	case float64:
		return v, nil
	case float32:
		return float64(v), nil
	case int:
		return float64(v), nil
	case int64:
		return float64(v), nil
	case int32:
		return float64(v), nil
	case string:
		var f float64
		_, err := fmt.Sscanf(v, "%f", &f)
		return f, err
	default:
		return 0, fmt.Errorf("cannot convert %T to float64", value)
	}
}
