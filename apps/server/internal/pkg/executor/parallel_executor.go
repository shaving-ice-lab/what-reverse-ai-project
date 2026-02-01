package executor

import (
	"context"
	"fmt"
	"sync"
	"time"
)

// NodeTypeParallel 并行执行节点类型
const NodeTypeParallel NodeType = "parallel"

// ParallelExecutor 并行执行节点执行器
type ParallelExecutor struct{}

// NewParallelExecutor 创建并行执行器
func NewParallelExecutor() *ParallelExecutor {
	return &ParallelExecutor{}
}

func (e *ParallelExecutor) GetType() NodeType {
	return NodeTypeParallel
}

func (e *ParallelExecutor) Execute(ctx context.Context, node *NodeDefinition, inputs map[string]interface{}, execCtx *ExecutionContext) (*NodeResult, error) {
	branchCount := getInt(node.Config, "branchCount", 2)
	waitAll := getBool(node.Config, "waitAll")
	if node.Config["waitAll"] == nil {
		waitAll = true // 默认等待全部
	}
	timeout := getInt(node.Config, "timeout", 0)
	failFast := getBool(node.Config, "failFast")

	// 创建带超时的上下文
	var execCtx2 context.Context
	var cancel context.CancelFunc
	if timeout > 0 {
		execCtx2, cancel = context.WithTimeout(ctx, time.Duration(timeout)*time.Millisecond)
		defer cancel()
	} else {
		execCtx2, cancel = context.WithCancel(ctx)
		defer cancel()
	}

	// 准备分支输出通道
	type branchResult struct {
		Index  int
		Output interface{}
		Error  error
	}

	resultChan := make(chan branchResult, branchCount)

	// 并行执行标记 - 实际的分支执行由调度器处理
	// 这里只是准备输出数据
	var wg sync.WaitGroup
	var firstError error
	var mu sync.Mutex

	for i := 0; i < branchCount; i++ {
		wg.Add(1)
		go func(branchIndex int) {
			defer wg.Done()

			// 检查是否需要取消
			select {
			case <-execCtx2.Done():
				resultChan <- branchResult{
					Index: branchIndex,
					Error: execCtx2.Err(),
				}
				return
			default:
			}

			// 分支输出
			branchOutput := map[string]interface{}{
				"branchIndex": branchIndex,
				"input":       inputs,
			}

			resultChan <- branchResult{
				Index:  branchIndex,
				Output: branchOutput,
			}
		}(i)
	}

	// 等待结果
	go func() {
		wg.Wait()
		close(resultChan)
	}()

	// 收集结果
	results := make(map[int]interface{})
	errors := make([]error, 0)

	for result := range resultChan {
		if result.Error != nil {
			mu.Lock()
			errors = append(errors, result.Error)
			if firstError == nil {
				firstError = result.Error
			}
			mu.Unlock()

			if failFast {
				cancel()
				break
			}
		} else {
			mu.Lock()
			results[result.Index] = result.Output
			mu.Unlock()
		}

		// 如果不需要等待全部，第一个完成就返回
		if !waitAll && len(results) > 0 {
			cancel()
			break
		}
	}

	// 检查错误
	if failFast && firstError != nil {
		return &NodeResult{
			NodeID: node.ID,
			Status: NodeStatusFailed,
			Error:  firstError,
		}, firstError
	}

	// 构建输出
	branchOutputs := make([]interface{}, branchCount)
	for i := 0; i < branchCount; i++ {
		if output, ok := results[i]; ok {
			branchOutputs[i] = output
		} else {
			branchOutputs[i] = nil
		}
	}

	outputs := map[string]interface{}{
		"branches":   branchOutputs,
		"results":    results,
		"errors":     errors,
		"hasError":   len(errors) > 0,
		"completed":  len(results),
		"total":      branchCount,
		"allSuccess": len(errors) == 0 && len(results) == branchCount,
	}

	// 为每个分支创建独立输出
	for i := 0; i < branchCount; i++ {
		key := fmt.Sprintf("branch-%d", i)
		if output, ok := results[i]; ok {
			outputs[key] = output
		}
	}

	// 设置下一个处理句柄
	nextHandle := "join"

	return &NodeResult{
		NodeID:     node.ID,
		Status:     NodeStatusCompleted,
		Outputs:    outputs,
		NextHandle: nextHandle,
	}, nil
}

// ParallelJoinExecutor 并行汇合节点执行器
type ParallelJoinExecutor struct{}

// NewParallelJoinExecutor 创建并行汇合执行器
func NewParallelJoinExecutor() *ParallelJoinExecutor {
	return &ParallelJoinExecutor{}
}

func (e *ParallelJoinExecutor) GetType() NodeType {
	return "paralleljoin"
}

func (e *ParallelJoinExecutor) Execute(ctx context.Context, node *NodeDefinition, inputs map[string]interface{}, execCtx *ExecutionContext) (*NodeResult, error) {
	// 收集所有分支的输入
	branchResults := make([]interface{}, 0)

	// 尝试从多个输入端口收集数据
	for i := 0; ; i++ {
		key := fmt.Sprintf("branch-%d", i)
		if v, ok := inputs[key]; ok {
			branchResults = append(branchResults, v)
		} else if i > 0 {
			break
		}
	}

	// 如果没有分支输入，尝试其他输入格式
	if len(branchResults) == 0 {
		if branches, ok := inputs["branches"]; ok {
			if arr, ok := branches.([]interface{}); ok {
				branchResults = arr
			}
		}
	}

	// 合并所有分支结果
	mergedOutputs := make(map[string]interface{})
	for i, result := range branchResults {
		if resultMap, ok := result.(map[string]interface{}); ok {
			for k, v := range resultMap {
				mergedOutputs[fmt.Sprintf("branch%d_%s", i, k)] = v
			}
		}
		mergedOutputs[fmt.Sprintf("branch%d", i)] = result
	}

	outputs := map[string]interface{}{
		"results": branchResults,
		"merged":  mergedOutputs,
		"count":   len(branchResults),
	}

	return &NodeResult{
		NodeID:  node.ID,
		Status:  NodeStatusCompleted,
		Outputs: outputs,
	}, nil
}
