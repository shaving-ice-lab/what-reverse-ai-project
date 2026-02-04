package executor

import (
	"context"
	"fmt"
	"time"
)

// NodeTypeTryCatch Try/Catch 节点类型
const NodeTypeTryCatch NodeType = "trycatch"

// TryCatchExecutor 错误处理节点执行器
type TryCatchExecutor struct{}

// NewTryCatchExecutor 创建 Try/Catch 执行器
func NewTryCatchExecutor() *TryCatchExecutor {
	return &TryCatchExecutor{}
}

func (e *TryCatchExecutor) GetType() NodeType {
	return NodeTypeTryCatch
}

func (e *TryCatchExecutor) Execute(ctx context.Context, node *NodeDefinition, inputs map[string]interface{}, execCtx *ExecutionContext) (*NodeResult, error) {
	// 获取配置
	retryCount := getInt(node.Config, "retryCount", 0)
	retryDelay := getInt(node.Config, "retryDelay", 1000)
	errorVariable := getString(node.Config, "errorVariable")
	continueOnError := getBool(node.Config, "continueOnError")
	fallbackValue := node.Config["fallbackValue"]

	// 获取输入中的错误信息（如果有）
	var lastError error
	if errMsg, ok := inputs["error"]; ok {
		if errStr, ok := errMsg.(string); ok && errStr != "" {
			lastError = fmt.Errorf("%s", errStr)
		}
	}

	// 如果有输入值且没有错误，直接传递
	if lastError == nil {
		outputs := make(map[string]interface{})
		for k, v := range inputs {
			outputs[k] = v
		}
		outputs["success"] = true
		outputs["hasError"] = false

		return &NodeResult{
			NodeID:     node.ID,
			Status:     NodeStatusCompleted,
			Outputs:    outputs,
			NextHandle: "success",
		}, nil
	}

	// 处理错误情况
	var finalError error = lastError
	success := false

	// 重试逻辑
	for attempt := 0; attempt <= retryCount; attempt++ {
		if attempt > 0 {
			// 等待重试延迟
			select {
			case <-ctx.Done():
				return &NodeResult{
					NodeID: node.ID,
					Status: NodeStatusFailed,
					Error:  ctx.Err(),
				}, ctx.Err()
			case <-time.After(time.Duration(retryDelay) * time.Millisecond):
			}
		}

		// 检查是否有重试处理器
		// 在实际实现中，这里应该重新执行上游节点
		// 目前简化为检查输入是否有效

		if _, ok := inputs["value"]; ok {
			success = true
			finalError = nil
			break
		}
	}

	// 构建输出
	outputs := make(map[string]interface{})

	if success {
		// 成功路径
		for k, v := range inputs {
			if k != "error" {
				outputs[k] = v
			}
		}
		outputs["success"] = true
		outputs["hasError"] = false
		outputs["retryAttempts"] = 0

		return &NodeResult{
			NodeID:     node.ID,
			Status:     NodeStatusCompleted,
			Outputs:    outputs,
			NextHandle: "success",
		}, nil
	}

	// 失败路径
	outputs["success"] = false
	outputs["hasError"] = true
	outputs["error"] = finalError.Error()

	// 设置错误变量
	if errorVariable != "" && execCtx != nil {
		errorPayload := map[string]interface{}{
			"message": finalError.Error(),
			"type":    "ExecutionError",
		}
		execCtx.SetVariable(node.ID, errorVariable, errorPayload)
		outputs[errorVariable] = errorPayload
	}

	// 设置回退值
	if fallbackValue != nil {
		outputs["value"] = fallbackValue
		outputs["output"] = fallbackValue
	}

	// 根据配置决定是否继续执行
	if continueOnError {
		return &NodeResult{
			NodeID:     node.ID,
			Status:     NodeStatusCompleted,
			Outputs:    outputs,
			NextHandle: "error",
		}, nil
	}

	return &NodeResult{
		NodeID:     node.ID,
		Status:     NodeStatusFailed,
		Outputs:    outputs,
		Error:      finalError,
		NextHandle: "error",
	}, finalError
}

// TryCatchWrapper 包装执行以捕获错误
type TryCatchWrapper struct {
	innerExecutor NodeExecutor
	config        map[string]interface{}
}

// WrapWithTryCatch 创建 Try/Catch 包装器
func WrapWithTryCatch(executor NodeExecutor, config map[string]interface{}) *TryCatchWrapper {
	return &TryCatchWrapper{
		innerExecutor: executor,
		config:        config,
	}
}

func (w *TryCatchWrapper) GetType() NodeType {
	return w.innerExecutor.GetType()
}

func (w *TryCatchWrapper) Execute(ctx context.Context, node *NodeDefinition, inputs map[string]interface{}, execCtx *ExecutionContext) (*NodeResult, error) {
	retryCount := getInt(w.config, "retryCount", 0)
	retryDelay := getInt(w.config, "retryDelay", 1000)
	continueOnError := getBool(w.config, "continueOnError")
	errorVariable := getString(w.config, "errorVariable")

	var lastError error
	var result *NodeResult

	for attempt := 0; attempt <= retryCount; attempt++ {
		if attempt > 0 {
			select {
			case <-ctx.Done():
				return nil, ctx.Err()
			case <-time.After(time.Duration(retryDelay) * time.Millisecond):
			}
		}

		result, lastError = w.innerExecutor.Execute(ctx, node, inputs, execCtx)
		if lastError == nil {
			return result, nil
		}
	}

	// 所有重试失败
	if errorVariable != "" && execCtx != nil {
		errorPayload := map[string]interface{}{
			"message":  lastError.Error(),
			"attempts": retryCount + 1,
		}
		execCtx.SetVariable(node.ID, errorVariable, errorPayload)
	}

	if continueOnError {
		if result == nil {
			result = &NodeResult{
				NodeID: node.ID,
				Status: NodeStatusCompleted,
				Outputs: map[string]interface{}{
					"error":    lastError.Error(),
					"hasError": true,
				},
			}
		}
		return result, nil
	}

	return result, lastError
}
