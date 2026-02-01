package executor

import (
	"context"
	"math/rand"
	"time"
)

// DelayExecutor 延迟节点执行器
type DelayExecutor struct{}

// NewDelayExecutor 创建延迟执行器
func NewDelayExecutor() *DelayExecutor {
	return &DelayExecutor{}
}

func (e *DelayExecutor) GetType() NodeType {
	return NodeTypeDelay
}

func (e *DelayExecutor) Execute(ctx context.Context, node *NodeDefinition, inputs map[string]interface{}, execCtx *ExecutionContext) (*NodeResult, error) {
	// 获取配置
	duration := getInt(node.Config, "duration", 1)
	unit := getString(node.Config, "unit")
	if unit == "" {
		unit = "s" // 默认秒
	}
	mode := getString(node.Config, "mode")
	if mode == "" {
		mode = "fixed" // 默认固定延迟
	}

	// 计算延迟时间（毫秒）
	var delayMs int64

	if mode == "random" {
		// 随机延迟模式
		minDuration := getInt(node.Config, "minDuration", 0)
		maxDuration := getInt(node.Config, "maxDuration", 10)

		// 转换为毫秒
		minMs := convertToMs(int64(minDuration), unit)
		maxMs := convertToMs(int64(maxDuration), unit)

		// 生成随机延迟
		if maxMs > minMs {
			delayMs = minMs + rand.Int63n(maxMs-minMs)
		} else {
			delayMs = minMs
		}
	} else {
		// 固定延迟模式
		delayMs = convertToMs(int64(duration), unit)
	}

	// 安全限制：最大延迟 1 小时
	maxDelayMs := int64(3600000) // 1 hour
	if delayMs > maxDelayMs {
		delayMs = maxDelayMs
	}

	// 创建计时器
	timer := time.NewTimer(time.Duration(delayMs) * time.Millisecond)
	defer timer.Stop()

	// 等待延迟完成或被取消
	select {
	case <-ctx.Done():
		return &NodeResult{
			NodeID: node.ID,
			Status: NodeStatusFailed,
			Error:  ctx.Err(),
		}, ctx.Err()

	case <-execCtx.CancelChan:
		return &NodeResult{
			NodeID: node.ID,
			Status: NodeStatusFailed,
			Error:  ErrExecutionCancelled,
		}, ErrExecutionCancelled

	case <-timer.C:
		// 延迟完成
		outputs := map[string]interface{}{
			"delayed":    true,
			"durationMs": delayMs,
			"mode":       mode,
			"input":      inputs,
		}

		return &NodeResult{
			NodeID:  node.ID,
			Status:  NodeStatusCompleted,
			Outputs: outputs,
		}, nil
	}
}

// convertToMs 将持续时间转换为毫秒
func convertToMs(value int64, unit string) int64 {
	switch unit {
	case "ms":
		return value
	case "s":
		return value * 1000
	case "m":
		return value * 60000
	case "h":
		return value * 3600000
	default:
		return value * 1000 // 默认秒
	}
}
