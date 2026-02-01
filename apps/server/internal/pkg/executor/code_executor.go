package executor

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"
)

var (
	ErrCodeExecutionTimeout = errors.New("code execution timeout")
	ErrCodeSandbox          = errors.New("sandbox execution error")
	ErrInvalidCode          = errors.New("invalid code")
	ErrUnsafeOperation      = errors.New("unsafe operation detected")
)

// CodeExecutor JavaScript 代码节点执行器
type CodeExecutor struct {
	timeout time.Duration
}

// NewCodeExecutor 创建代码执行器
func NewCodeExecutor() *CodeExecutor {
	return &CodeExecutor{
		timeout: 30 * time.Second,
	}
}

func (e *CodeExecutor) GetType() NodeType {
	return NodeTypeCode
}

func (e *CodeExecutor) Execute(ctx context.Context, node *NodeDefinition, inputs map[string]interface{}, execCtx *ExecutionContext) (*NodeResult, error) {
	code := getString(node.Config, "code")
	if code == "" {
		return nil, ErrInvalidCode
	}

	language := getString(node.Config, "language")
	if language == "" {
		language = "javascript"
	}

	// 获取超时配置
	timeout := getInt(node.Config, "timeout", 30)
	if timeout > 300 {
		timeout = 300 // 最大 5 分钟
	}

	// 创建带超时的上下文
	execCtx2, cancel := context.WithTimeout(ctx, time.Duration(timeout)*time.Second)
	defer cancel()

	// 执行代码
	result, err := e.executeCode(execCtx2, code, language, inputs, execCtx)
	if err != nil {
		return &NodeResult{
			NodeID: node.ID,
			Status: NodeStatusFailed,
			Error:  err,
		}, err
	}

	return &NodeResult{
		NodeID:  node.ID,
		Status:  NodeStatusCompleted,
		Outputs: result,
	}, nil
}

func (e *CodeExecutor) executeCode(ctx context.Context, code, language string, inputs map[string]interface{}, execCtx *ExecutionContext) (map[string]interface{}, error) {
	// 注意：这是一个简化的实现
	// 在生产环境中，应该使用真正的沙箱环境（如 goja、isolated-vm 或 Docker 容器）

	// 对于 JavaScript，我们使用简单的表达式求值
	// 这里提供一个安全的子集功能

	switch language {
	case "javascript", "js":
		return e.executeJavaScript(ctx, code, inputs, execCtx)
	case "expression":
		return e.executeExpression(ctx, code, inputs, execCtx)
	default:
		return nil, fmt.Errorf("unsupported language: %s", language)
	}
}

// executeJavaScript 执行 JavaScript 代码（简化实现）
func (e *CodeExecutor) executeJavaScript(ctx context.Context, code string, inputs map[string]interface{}, execCtx *ExecutionContext) (map[string]interface{}, error) {
	// 检查上下文是否已取消
	select {
	case <-ctx.Done():
		return nil, ErrCodeExecutionTimeout
	default:
	}

	// 简化实现：将代码作为 JSON 表达式处理
	// 在实际生产环境中，应该使用 goja 等 JS 引擎

	// 安全检查：禁止危险操作
	if containsUnsafePatterns(code) {
		return nil, ErrUnsafeOperation
	}

	// 模拟执行结果
	// 在真实实现中，这里应该调用 JS 引擎
	outputs := make(map[string]interface{})

	// 将输入传递到输出（作为示例）
	outputs["input"] = inputs
	outputs["result"] = nil
	outputs["logs"] = []string{}

	// 尝试解析代码中的返回值
	// 这是一个非常简化的实现
	if returnValue := extractReturnValue(code, inputs); returnValue != nil {
		outputs["result"] = returnValue
		outputs["output"] = returnValue
	}

	return outputs, nil
}

// executeExpression 执行表达式（更安全的方式）
func (e *CodeExecutor) executeExpression(ctx context.Context, expr string, inputs map[string]interface{}, execCtx *ExecutionContext) (map[string]interface{}, error) {
	// 检查上下文是否已取消
	select {
	case <-ctx.Done():
		return nil, ErrCodeExecutionTimeout
	default:
	}

	// 变量插值
	result := interpolateVariables(expr, inputs, execCtx)

	return map[string]interface{}{
		"result": result,
		"output": result,
	}, nil
}

// containsUnsafePatterns 检查代码中是否包含不安全的模式
func containsUnsafePatterns(code string) bool {
	unsafePatterns := []string{
		"eval(",
		"Function(",
		"require(",
		"import(",
		"process.",
		"child_process",
		"fs.",
		"__proto__",
		"constructor[",
		"globalThis",
		"window.",
		"document.",
	}

	for _, pattern := range unsafePatterns {
		if containsString(code, pattern) {
			return true
		}
	}
	return false
}

// containsString 检查字符串是否包含子串
func containsString(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > 0 && containsStringHelper(s, substr))
}

func containsStringHelper(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

// extractReturnValue 从代码中提取返回值（简化实现）
func extractReturnValue(code string, inputs map[string]interface{}) interface{} {
	// 这是一个非常简化的实现
	// 只处理简单的 JSON 返回值

	// 尝试将整个代码作为 JSON 解析
	var result interface{}
	if err := json.Unmarshal([]byte(code), &result); err == nil {
		return result
	}

	// 如果有 inputs，返回处理后的 inputs
	if len(inputs) > 0 {
		return inputs
	}

	return nil
}

// SafeJSRuntime 安全的 JS 运行时接口（未来扩展用）
type SafeJSRuntime interface {
	Execute(ctx context.Context, code string, inputs map[string]interface{}) (map[string]interface{}, error)
	SetTimeout(timeout time.Duration)
	SetMemoryLimit(limit int64)
}
