package executor

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/agentflow/server/internal/pkg/observability"
	"github.com/agentflow/server/internal/pkg/security"
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
			if execCtx != nil {
				execCtx.SetVariable(node.ID, name, value)
			}
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
				if execCtx != nil {
					execCtx.SetVariable(node.ID, name, value)
				}
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
		NodeID:     node.ID,
		Status:     NodeStatusCompleted,
		NextHandle: branch,
		Outputs: map[string]interface{}{
			"result":   result,
			"branch":   branch,                                            // 便于直接使用字符串分支
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
	provider := strings.TrimSpace(getString(node.Config, "provider"))
	if provider == "" {
		provider = "openai"
	}
	model := getString(node.Config, "model")
	systemPrompt := getString(node.Config, "systemPrompt")
	userPrompt := getString(node.Config, "userPrompt")
	fallbackText := getString(node.Config, "fallbackText")
	fallbackProviders := getStringSlice(node.Config, "fallbackProviders")
	fallbackModels := getStringSlice(node.Config, "fallbackModels")

	// 变量插值
	systemPrompt = interpolateVariables(systemPrompt, inputs, execCtx)
	userPrompt = interpolateVariables(userPrompt, inputs, execCtx)

	// 获取参数
	temperature := getFloat(node.Config, "temperature", 0.7)
	maxTokens := getInt(node.Config, "maxTokens", 0)
	if maxTokens == 0 {
		maxTokens = getInt(node.Config, "max_tokens", 0)
	}
	if maxTokens == 0 {
		maxTokens = 2048
	}

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

	routingStrategy := resolveLLMRoutingStrategy(node.Config)
	routingModels := parseLLMRoutingModels(node.Config)
	if routingStrategy == "" && len(routingModels) > 0 {
		routingStrategy = "quality"
	}
	attempts := buildLLMAttempts(provider, fallbackProviders, model, fallbackModels, routingStrategy, routingModels)
	metrics := observability.GetMetricsCollector()
	var lastErr error
	var attemptLogs []map[string]interface{}
	hadFailure := false
	for index, attempt := range attempts {
		attemptStart := time.Now()
		apiKey := resolveLLMAPIKey(attempt.Provider, node.Config, execCtx, provider)
		if apiKey == "" {
			lastErr = fmt.Errorf("API key not found for provider: %s", attempt.Provider)
			hadFailure = true
			attemptLogs = append(attemptLogs, map[string]interface{}{
				"provider": attempt.Provider,
				"model":    attempt.Model,
				"status":   "skipped",
				"error":    lastErr.Error(),
			})
			if metrics != nil {
				metrics.RecordLLMRequest(attempt.Provider, attempt.Model, "skipped", 0, 0, 0, 0)
			}
			continue
		}
		content, usage, err := e.callProvider(ctx, attempt.Provider, apiKey, attempt.Model, messages, temperature, maxTokens)
		durationMs := time.Since(attemptStart).Milliseconds()
		if err != nil {
			lastErr = err
			hadFailure = true
			attemptLogs = append(attemptLogs, map[string]interface{}{
				"provider":    attempt.Provider,
				"model":       attempt.Model,
				"status":      "failed",
				"duration_ms": durationMs,
				"error":       err.Error(),
			})
			if metrics != nil {
				metrics.RecordLLMRequest(attempt.Provider, attempt.Model, "failed", float64(durationMs)/1000.0, 0, 0, 0)
			}
			continue
		}
		review := security.ReviewAIOutput(content)
		if !review.Allowed {
			lastErr = security.NewUnsafeAIOutputError(review)
			hadFailure = true
			attemptLogs = append(attemptLogs, map[string]interface{}{
				"provider":    attempt.Provider,
				"model":       attempt.Model,
				"status":      "blocked",
				"duration_ms": durationMs,
				"error":       lastErr.Error(),
			})
			if metrics != nil {
				metrics.RecordLLMRequest(attempt.Provider, attempt.Model, "blocked", float64(durationMs)/1000.0, 0, 0, 0)
			}
			continue
		}
		normalizedUsage := NormalizeTokenUsage(usage)
		if execCtx != nil {
			execCtx.AddTokenUsage(normalizedUsage)
		}
		cost := computeLLMCost(attempt, normalizedUsage)
		if execCtx != nil {
			strategy := routingStrategy
			if strategy == "" {
				strategy = "default"
			}
			execCtx.RecordModelUsage(ctx, ModelUsageRecord{
				WorkspaceID:      execCtx.WorkspaceID,
				UserID:           execCtx.UserID,
				ExecutionID:      execCtx.ExecutionID,
				WorkflowID:       execCtx.WorkflowID,
				NodeID:           node.ID,
				Provider:         attempt.Provider,
				Model:            attempt.Model,
				Strategy:         strategy,
				PromptTokens:     normalizedUsage.PromptTokens,
				CompletionTokens: normalizedUsage.CompletionTokens,
				TotalTokens:      normalizedUsage.TotalTokens,
				CostAmount:       roundLLMCost(cost),
				Currency:         "USD",
			})
		}
		if execCtx != nil {
			execCtx.RecordModelUsage(ctx, ModelUsageRecord{
				WorkspaceID:      execCtx.WorkspaceID,
				UserID:           execCtx.UserID,
				ExecutionID:      execCtx.ExecutionID,
				WorkflowID:       execCtx.WorkflowID,
				NodeID:           node.ID,
				Provider:         attempt.Provider,
				Model:            attempt.Model,
				Strategy:         routingStrategy,
				PromptTokens:     normalizedUsage.PromptTokens,
				CompletionTokens: normalizedUsage.CompletionTokens,
				TotalTokens:      normalizedUsage.TotalTokens,
				CostAmount:       roundLLMCost(cost),
				Currency:         "USD",
			})
		}
		if metrics != nil {
			metrics.RecordLLMRequest(
				attempt.Provider,
				attempt.Model,
				"success",
				float64(durationMs)/1000.0,
				int64(normalizedUsage.PromptTokens),
				int64(normalizedUsage.CompletionTokens),
				cost,
			)
		}
		if hadFailure {
			attemptLogs = append(attemptLogs, map[string]interface{}{
				"provider":    attempt.Provider,
				"model":       attempt.Model,
				"status":      "success",
				"duration_ms": durationMs,
			})
		}
		outputs := map[string]interface{}{
			"content":        content,
			"text":           content,
			"usage":          normalizedUsage,
			"provider":       attempt.Provider,
			"model":          attempt.Model,
			"cost":           roundLLMCost(cost),
			"cost_currency":  "USD",
			"cost_estimated": attempt.CostEstimated,
		}
		if routingStrategy != "" {
			outputs["routing_strategy"] = routingStrategy
		}
		if index > 0 {
			outputs["fallback_used"] = true
		}
		if hadFailure && len(attemptLogs) > 0 {
			outputs["attempts"] = attemptLogs
		}
		if outputSchema := resolveLLMOutputSchema(node.Config); outputSchema != nil {
			parsed, parseErr := parseLLMJSONOutput(content)
			if parseErr != nil {
				return nil, fmt.Errorf("llm output is not valid json: %w", parseErr)
			}
			outputs["parsed"] = parsed
			outputs["output_schema"] = outputSchema
		}
		return &NodeResult{
			NodeID:  node.ID,
			Status:  NodeStatusCompleted,
			Outputs: outputs,
		}, nil
	}

	if fallbackText != "" {
		fallbackOutputs := map[string]interface{}{
			"content":       fallbackText,
			"text":          fallbackText,
			"usage":         TokenUsage{},
			"provider":      provider,
			"model":         model,
			"fallback_used": true,
		}
		if routingStrategy != "" {
			fallbackOutputs["routing_strategy"] = routingStrategy
		}
		if len(attemptLogs) > 0 {
			fallbackOutputs["attempts"] = attemptLogs
		}
		if outputSchema := resolveLLMOutputSchema(node.Config); outputSchema != nil {
			parsed, parseErr := parseLLMJSONOutput(fallbackText)
			if parseErr != nil {
				return nil, fmt.Errorf("llm output is not valid json: %w", parseErr)
			}
			fallbackOutputs["parsed"] = parsed
			fallbackOutputs["output_schema"] = outputSchema
		}
		if lastErr != nil {
			fallbackOutputs["fallback_reason"] = lastErr.Error()
		}
		return &NodeResult{
			NodeID:  node.ID,
			Status:  NodeStatusCompleted,
			Outputs: fallbackOutputs,
		}, nil
	}

	if lastErr == nil {
		lastErr = fmt.Errorf("LLM call failed without a specific error")
	}
	return nil, lastErr

}

type llmAttempt struct {
	Provider            string
	Model               string
	QualityScore        float64
	PromptCostPer1K     float64
	CompletionCostPer1K float64
	CostEstimated       bool
	CostProvided        bool
	QualityProvided     bool
}

func buildLLMAttempts(provider string, fallbackProviders []string, model string, fallbackModels []string, routingStrategy string, routingModels []llmAttempt) []llmAttempt {
	attempts := make([]llmAttempt, 0)
	if len(routingModels) > 0 {
		attempts = append(attempts, routingModels...)
	} else {
		providers := uniqueStrings(append([]string{provider}, fallbackProviders...))
		models := append([]string{model}, fallbackModels...)
		if len(models) == 0 {
			models = []string{model}
		}
		attempts = make([]llmAttempt, 0, len(providers)*len(models))
		for _, candidateProvider := range providers {
			for _, candidateModel := range models {
				attempts = append(attempts, llmAttempt{
					Provider: candidateProvider,
					Model:    candidateModel,
				})
			}
		}
	}

	normalized := make([]llmAttempt, 0, len(attempts))
	for _, attempt := range attempts {
		candidate := normalizeLLMAttempt(attempt)
		if candidate.Model == "" {
			continue
		}
		normalized = append(normalized, candidate)
	}
	if routingStrategy != "" {
		orderLLMAttempts(normalized, routingStrategy)
	}
	return normalized
}

func resolveLLMRoutingStrategy(config map[string]interface{}) string {
	if config == nil {
		return ""
	}
	for _, key := range []string{"routingStrategy", "routing_strategy", "modelRouting", "model_routing"} {
		if raw, ok := config[key]; ok {
			if value, ok := raw.(string); ok {
				return normalizeLLMRoutingStrategy(value)
			}
		}
	}
	return ""
}

func normalizeLLMRoutingStrategy(raw string) string {
	normalized := strings.ToLower(strings.TrimSpace(raw))
	switch normalized {
	case "budget", "cost", "price", "budget_first", "cost_first", "price_first":
		return "budget"
	case "quality", "quality_first", "best":
		return "quality"
	default:
		return ""
	}
}

func parseLLMRoutingModels(config map[string]interface{}) []llmAttempt {
	if config == nil {
		return nil
	}
	for _, key := range []string{"routingModels", "routing_models", "modelCandidates", "model_candidates"} {
		if raw, ok := config[key]; ok {
			return parseLLMRoutingModelsValue(raw)
		}
	}
	return nil
}

func parseLLMRoutingModelsValue(raw interface{}) []llmAttempt {
	switch value := raw.(type) {
	case []llmAttempt:
		return value
	case []interface{}:
		results := make([]llmAttempt, 0, len(value))
		for _, item := range value {
			if candidate, ok := parseLLMRoutingModel(item); ok {
				results = append(results, candidate)
			}
		}
		return results
	case []map[string]interface{}:
		results := make([]llmAttempt, 0, len(value))
		for _, item := range value {
			if candidate, ok := parseLLMRoutingModel(item); ok {
				results = append(results, candidate)
			}
		}
		return results
	default:
		return nil
	}
}

func parseLLMRoutingModel(raw interface{}) (llmAttempt, bool) {
	m, ok := raw.(map[string]interface{})
	if !ok {
		return llmAttempt{}, false
	}
	provider := getStringFromMap(m, "provider", "vendor", "source")
	model := getStringFromMap(m, "model", "name", "id")
	if strings.TrimSpace(model) == "" {
		return llmAttempt{}, false
	}
	attempt := llmAttempt{
		Provider: strings.TrimSpace(provider),
		Model:    strings.TrimSpace(model),
	}
	if quality, ok := getFloatFromMap(m, "quality", "quality_score", "qualityScore"); ok {
		attempt.QualityScore = quality
		attempt.QualityProvided = true
	}
	if promptCost, ok := getFloatFromMap(m, "prompt_cost_per_1k", "prompt_per_1k", "input_price", "inputPrice"); ok {
		attempt.PromptCostPer1K = promptCost
		attempt.CostProvided = true
	}
	if completionCost, ok := getFloatFromMap(m, "completion_cost_per_1k", "completion_per_1k", "output_price", "outputPrice"); ok {
		attempt.CompletionCostPer1K = completionCost
		attempt.CostProvided = true
	}
	return attempt, true
}

func normalizeLLMAttempt(attempt llmAttempt) llmAttempt {
	attempt.Provider = strings.TrimSpace(attempt.Provider)
	attempt.Model = strings.TrimSpace(attempt.Model)
	if attempt.Provider == "" {
		attempt.Provider = "openai"
	}
	if attempt.Model == "" {
		return attempt
	}
	if attempt.QualityScore <= 0 && !attempt.QualityProvided {
		attempt.QualityScore = estimateLLMQuality(attempt.Provider, attempt.Model)
	}
	if attempt.PromptCostPer1K == 0 && attempt.CompletionCostPer1K == 0 && !attempt.CostProvided {
		pricing := estimateLLMPricing(attempt.Provider, attempt.Model)
		attempt.PromptCostPer1K = pricing.PromptPer1K
		attempt.CompletionCostPer1K = pricing.CompletionPer1K
		attempt.CostEstimated = pricing.Estimated
	}
	return attempt
}

func orderLLMAttempts(attempts []llmAttempt, strategy string) {
	if len(attempts) == 0 {
		return
	}
	switch strategy {
	case "budget":
		sort.SliceStable(attempts, func(i, j int) bool {
			costI := llmAttemptCostScore(attempts[i])
			costJ := llmAttemptCostScore(attempts[j])
			if costI == costJ {
				return attempts[i].QualityScore > attempts[j].QualityScore
			}
			return costI < costJ
		})
	case "quality":
		sort.SliceStable(attempts, func(i, j int) bool {
			qualityI := attempts[i].QualityScore
			qualityJ := attempts[j].QualityScore
			if qualityI == qualityJ {
				return llmAttemptCostScore(attempts[i]) < llmAttemptCostScore(attempts[j])
			}
			return qualityI > qualityJ
		})
	}
}

func llmAttemptCostScore(attempt llmAttempt) float64 {
	if attempt.PromptCostPer1K == 0 && attempt.CompletionCostPer1K == 0 && !attempt.CostProvided && !attempt.CostEstimated {
		return math.MaxFloat64
	}
	return attempt.PromptCostPer1K + attempt.CompletionCostPer1K
}

type llmPricing struct {
	PromptPer1K     float64
	CompletionPer1K float64
	Estimated       bool
}

func estimateLLMPricing(provider, model string) llmPricing {
	name := strings.ToLower(strings.TrimSpace(model))
	switch {
	case strings.Contains(name, "mini") || strings.Contains(name, "haiku") || strings.Contains(name, "3.5") || strings.Contains(name, "lite") || strings.Contains(name, "small"):
		return llmPricing{PromptPer1K: 0.0005, CompletionPer1K: 0.0015, Estimated: true}
	case strings.Contains(name, "4o") || strings.Contains(name, "turbo") || strings.Contains(name, "sonnet") || strings.Contains(name, "pro"):
		return llmPricing{PromptPer1K: 0.01, CompletionPer1K: 0.03, Estimated: true}
	case strings.Contains(name, "opus") || strings.Contains(name, "gpt-4"):
		return llmPricing{PromptPer1K: 0.03, CompletionPer1K: 0.06, Estimated: true}
	default:
		_ = provider
		return llmPricing{PromptPer1K: 0.002, CompletionPer1K: 0.004, Estimated: true}
	}
}

func estimateLLMQuality(provider, model string) float64 {
	name := strings.ToLower(strings.TrimSpace(model))
	switch {
	case strings.Contains(name, "opus") || (strings.Contains(name, "gpt-4") && !strings.Contains(name, "mini")):
		return 0.95
	case strings.Contains(name, "4o"):
		return 0.9
	case strings.Contains(name, "sonnet") || strings.Contains(name, "turbo") || strings.Contains(name, "pro"):
		return 0.8
	case strings.Contains(name, "3.5") || strings.Contains(name, "haiku") || strings.Contains(name, "mini") || strings.Contains(name, "lite"):
		return 0.6
	default:
		_ = provider
		return 0.7
	}
}

func computeLLMCost(attempt llmAttempt, usage TokenUsage) float64 {
	if usage.PromptTokens <= 0 && usage.CompletionTokens <= 0 {
		return 0
	}
	promptCost := attempt.PromptCostPer1K * float64(usage.PromptTokens) / 1000.0
	completionCost := attempt.CompletionCostPer1K * float64(usage.CompletionTokens) / 1000.0
	return promptCost + completionCost
}

func roundLLMCost(cost float64) float64 {
	if cost == 0 {
		return 0
	}
	return math.Round(cost*1000000) / 1000000
}

func getStringFromMap(m map[string]interface{}, keys ...string) string {
	for _, key := range keys {
		if val, ok := m[key]; ok {
			if str, ok := val.(string); ok {
				str = strings.TrimSpace(str)
				if str != "" {
					return str
				}
			}
		}
	}
	return ""
}

func getFloatFromMap(m map[string]interface{}, keys ...string) (float64, bool) {
	for _, key := range keys {
		if val, ok := m[key]; ok {
			if parsed, err := toFloat64(val); err == nil {
				return parsed, true
			}
		}
	}
	return 0, false
}

func resolveLLMAPIKey(provider string, nodeConfig map[string]interface{}, execCtx *ExecutionContext, primaryProvider string) string {
	if execCtx != nil {
		if apiKey := execCtx.APIKeys[provider]; strings.TrimSpace(apiKey) != "" {
			return apiKey
		}
	}
	if raw, ok := nodeConfig["apiKeys"]; ok {
		if apiKeys, ok := raw.(map[string]interface{}); ok {
			if val, ok := apiKeys[provider]; ok {
				if apiKey, ok := val.(string); ok && strings.TrimSpace(apiKey) != "" {
					return apiKey
				}
			}
		}
	}
	if provider == primaryProvider || strings.TrimSpace(getString(nodeConfig, "provider")) == "" {
		apiKey := getString(nodeConfig, "apiKey")
		if strings.TrimSpace(apiKey) != "" {
			return apiKey
		}
	}
	return ""
}

func (e *LLMExecutor) callProvider(ctx context.Context, provider, apiKey, model string, messages []map[string]string, temperature float64, maxTokens int) (string, TokenUsage, error) {
	switch provider {
	case "openai":
		return e.callOpenAI(ctx, apiKey, model, messages, temperature, maxTokens)
	case "anthropic":
		return e.callAnthropic(ctx, apiKey, model, messages, temperature, maxTokens)
	default:
		// 默认使用 OpenAI 兼容接口
		return e.callOpenAI(ctx, apiKey, model, messages, temperature, maxTokens)
	}
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

func resolveLLMOutputSchema(config map[string]interface{}) interface{} {
	if config == nil {
		return nil
	}
	if val, ok := config["outputSchema"]; ok {
		return val
	}
	if val, ok := config["output_schema"]; ok {
		return val
	}
	return nil
}

func parseLLMJSONOutput(content string) (interface{}, error) {
	trimmed := strings.TrimSpace(content)
	if trimmed == "" {
		return nil, fmt.Errorf("empty output")
	}
	var parsed interface{}
	if err := json.Unmarshal([]byte(trimmed), &parsed); err == nil {
		return parsed, nil
	}
	if candidate := extractJSONCandidate(trimmed); candidate != "" {
		if err := json.Unmarshal([]byte(candidate), &parsed); err == nil {
			return parsed, nil
		} else {
			return nil, err
		}
	}
	return nil, fmt.Errorf("output is not valid json")
}

func extractJSONCandidate(raw string) string {
	start := strings.Index(raw, "{")
	end := strings.LastIndex(raw, "}")
	if start != -1 && end > start {
		return raw[start : end+1]
	}
	start = strings.Index(raw, "[")
	end = strings.LastIndex(raw, "]")
	if start != -1 && end > start {
		return raw[start : end+1]
	}
	return ""
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

func uniqueStrings(values []string) []string {
	seen := make(map[string]struct{}, len(values))
	result := make([]string, 0, len(values))
	for _, value := range values {
		value = strings.TrimSpace(value)
		if value == "" {
			continue
		}
		if _, ok := seen[value]; ok {
			continue
		}
		seen[value] = struct{}{}
		result = append(result, value)
	}
	return result
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
