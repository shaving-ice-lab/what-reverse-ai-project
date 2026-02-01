package executor

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/agentflow/server/internal/pkg/logger"
)

var (
	ErrExecutionCancelled = errors.New("execution cancelled")
	ErrExecutionTimeout   = errors.New("execution timeout")
	ErrNodeNotFound       = errors.New("node not found")
	ErrExecutorNotFound   = errors.New("executor not found for node type")
)

// Engine 工作流执行引擎
type Engine struct {
	executors     map[NodeType]NodeExecutor
	eventHandlers []EventHandler
	log           logger.Logger
	maxConcurrent int
	timeout       time.Duration
	mu            sync.RWMutex
}

// EngineConfig 引擎配置
type EngineConfig struct {
	MaxConcurrent int           // 最大并发执行数
	Timeout       time.Duration // 执行超时时间
}

// DefaultEngineConfig 默认配置
func DefaultEngineConfig() *EngineConfig {
	return &EngineConfig{
		MaxConcurrent: 10,
		Timeout:       5 * time.Minute,
	}
}

// NewEngine 创建执行引擎
func NewEngine(cfg *EngineConfig, log logger.Logger) *Engine {
	if cfg == nil {
		cfg = DefaultEngineConfig()
	}

	engine := &Engine{
		executors:     make(map[NodeType]NodeExecutor),
		eventHandlers: make([]EventHandler, 0),
		log:           log,
		maxConcurrent: cfg.MaxConcurrent,
		timeout:       cfg.Timeout,
	}

	// 注册内置执行器
	engine.RegisterExecutor(NewStartExecutor())
	engine.RegisterExecutor(NewEndExecutor())
	engine.RegisterExecutor(NewVariableExecutor())
	engine.RegisterExecutor(NewTemplateExecutor())
	engine.RegisterExecutor(NewConditionExecutor())
	engine.RegisterExecutor(NewLoopExecutor())
	engine.RegisterExecutor(NewHTTPExecutor())
	engine.RegisterExecutor(NewLLMExecutor())
	engine.RegisterExecutor(NewCodeExecutor())
	engine.RegisterExecutor(NewInputExecutor())
	engine.RegisterExecutor(NewOutputExecutor())
	engine.RegisterExecutor(NewExpressionExecutor())
	engine.RegisterExecutor(NewTryCatchExecutor())
	engine.RegisterExecutor(NewTransformExecutor())
	engine.RegisterExecutor(NewRegexExecutor())
	engine.RegisterExecutor(NewReplaceExecutor())
	engine.RegisterExecutor(NewTextSplitExecutor())
	engine.RegisterExecutor(NewMergeExecutor())
	engine.RegisterExecutor(NewFilterExecutor())
	engine.RegisterExecutor(NewParallelExecutor())
	engine.RegisterExecutor(NewParallelJoinExecutor())
	engine.RegisterExecutor(NewDelayExecutor())
	engine.RegisterExecutor(NewWebhookExecutor())
	engine.RegisterExecutor(NewDocumentAssemblerExecutor())

	return engine
}

// RegisterExecutor 注册节点执行器
func (e *Engine) RegisterExecutor(executor NodeExecutor) {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.executors[executor.GetType()] = executor
}

// RegisterEventHandler 注册事件处理器
func (e *Engine) RegisterEventHandler(handler EventHandler) {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.eventHandlers = append(e.eventHandlers, handler)
}

// emitEvent 发送事件
func (e *Engine) emitEvent(event *ExecutionEvent) {
	e.mu.RLock()
	handlers := e.eventHandlers
	e.mu.RUnlock()

	for _, handler := range handlers {
		go handler.HandleEvent(event)
	}
}

// Execute 执行工作流
func (e *Engine) Execute(ctx context.Context, def *WorkflowDefinition, inputs map[string]interface{}, execCtx *ExecutionContext) (*ExecutionResult, error) {
	startTime := time.Now()

	// 创建带超时的上下文
	ctx, cancel := context.WithTimeout(ctx, e.timeout)
	defer cancel()

	// 监听取消
	go func() {
		select {
		case <-ctx.Done():
			execCtx.Cancel()
		case <-execCtx.CancelChan:
		}
	}()

	// 发送执行开始事件
	e.emitEvent(&ExecutionEvent{
		Type:        EventExecutionStarted,
		ExecutionID: execCtx.ExecutionID,
		WorkflowID:  execCtx.WorkflowID,
		Timestamp:   startTime,
	})

	// 构建 DAG
	dag, err := NewDAG(def)
	if err != nil {
		return e.handleExecutionError(execCtx, startTime, err)
	}

	// 初始化输入
	if inputs == nil {
		inputs = make(map[string]interface{})
	}
	execCtx.Variables = inputs

	// 获取执行层级
	levels, err := dag.GetExecutionLevels()
	if err != nil {
		return e.handleExecutionError(execCtx, startTime, err)
	}

	result := &ExecutionResult{
		ExecutionID: execCtx.ExecutionID,
		Status:      ExecutionStatusRunning,
		StartedAt:   startTime,
		NodeResults: make(map[string]*NodeResult),
	}

	totalNodes := len(dag.Nodes)
	completedNodes := 0

	// 按层级执行
	for _, level := range levels {
		if execCtx.IsCancelled() {
			result.Status = ExecutionStatusCancelled
			result.Error = ErrExecutionCancelled
			e.emitEvent(&ExecutionEvent{
				Type:        EventExecutionCancelled,
				ExecutionID: execCtx.ExecutionID,
				WorkflowID:  execCtx.WorkflowID,
				Timestamp:   time.Now(),
			})
			return result, ErrExecutionCancelled
		}

		// 并发执行同一层级的节点
		nodeResults, err := e.executeLevel(ctx, dag, level, execCtx)
		if err != nil {
			return e.handleExecutionError(execCtx, startTime, err)
		}

		// 收集结果
		for _, nodeResult := range nodeResults {
			result.NodeResults[nodeResult.NodeID] = nodeResult
			completedNodes++

			// 发送进度事件
			e.emitEvent(&ExecutionEvent{
				Type:        EventNodeCompleted,
				ExecutionID: execCtx.ExecutionID,
				WorkflowID:  execCtx.WorkflowID,
				NodeID:      nodeResult.NodeID,
				NodeType:    dag.GetNode(nodeResult.NodeID).Type,
				Status:      string(nodeResult.Status),
				Outputs:     nodeResult.Outputs,
				DurationMs:  nodeResult.DurationMs,
				Progress:    completedNodes * 100 / totalNodes,
				TotalNodes:  totalNodes,
				Timestamp:   nodeResult.FinishedAt,
			})

			// 检查是否有失败
			if nodeResult.Status == NodeStatusFailed {
				result.Status = ExecutionStatusFailed
				result.Error = nodeResult.Error
				e.emitEvent(&ExecutionEvent{
					Type:        EventExecutionFailed,
					ExecutionID: execCtx.ExecutionID,
					WorkflowID:  execCtx.WorkflowID,
					NodeID:      nodeResult.NodeID,
					Error:       nodeResult.Error.Error(),
					Timestamp:   time.Now(),
				})
				return result, nodeResult.Error
			}
		}
	}

	// 收集最终输出 (从结束节点)
	for _, endNodeID := range dag.EndNodeIDs {
		if outputs := execCtx.GetNodeOutput(endNodeID); outputs != nil {
			if result.Outputs == nil {
				result.Outputs = make(map[string]interface{})
			}
			for k, v := range outputs {
				result.Outputs[k] = v
			}
		}
	}

	// 设置最终状态
	finishTime := time.Now()
	result.Status = ExecutionStatusCompleted
	result.FinishedAt = finishTime
	result.DurationMs = int(finishTime.Sub(startTime).Milliseconds())

	// 发送完成事件
	e.emitEvent(&ExecutionEvent{
		Type:        EventExecutionCompleted,
		ExecutionID: execCtx.ExecutionID,
		WorkflowID:  execCtx.WorkflowID,
		Outputs:     result.Outputs,
		DurationMs:  result.DurationMs,
		Timestamp:   finishTime,
	})

	return result, nil
}

// executeLevel 执行同一层级的节点
func (e *Engine) executeLevel(ctx context.Context, dag *DAG, nodeIDs []string, execCtx *ExecutionContext) ([]*NodeResult, error) {
	results := make([]*NodeResult, len(nodeIDs))
	var wg sync.WaitGroup
	var mu sync.Mutex
	var firstError error

	// 使用信号量控制并发
	sem := make(chan struct{}, e.maxConcurrent)

	for i, nodeID := range nodeIDs {
		wg.Add(1)
		go func(idx int, nID string) {
			defer wg.Done()

			// 获取信号量
			sem <- struct{}{}
			defer func() { <-sem }()

			// 检查取消
			if execCtx.IsCancelled() {
				return
			}

			// 获取节点定义
			node := dag.GetNode(nID)
			if node == nil {
				mu.Lock()
				if firstError == nil {
					firstError = fmt.Errorf("%w: %s", ErrNodeNotFound, nID)
				}
				mu.Unlock()
				return
			}

			// 收集输入 (从前置节点的输出)
			inputs := e.collectInputs(dag, node, execCtx)

			// 执行节点
			result, err := e.executeNode(ctx, node, inputs, execCtx)
			if err != nil {
				mu.Lock()
				if firstError == nil {
					firstError = err
				}
				mu.Unlock()
			}

			mu.Lock()
			results[idx] = result
			mu.Unlock()
		}(i, nodeID)
	}

	wg.Wait()
	return results, firstError
}

// executeNode 执行单个节点
func (e *Engine) executeNode(ctx context.Context, node *NodeDefinition, inputs map[string]interface{}, execCtx *ExecutionContext) (*NodeResult, error) {
	startTime := time.Now()

	// 发送节点开始事件
	e.emitEvent(&ExecutionEvent{
		Type:        EventNodeStarted,
		ExecutionID: execCtx.ExecutionID,
		WorkflowID:  execCtx.WorkflowID,
		NodeID:      node.ID,
		NodeType:    node.Type,
		Inputs:      inputs,
		Timestamp:   startTime,
	})

	// 获取执行器
	e.mu.RLock()
	executor, ok := e.executors[node.Type]
	e.mu.RUnlock()

	if !ok {
		err := fmt.Errorf("%w: %s", ErrExecutorNotFound, node.Type)
		return &NodeResult{
			NodeID:     node.ID,
			Status:     NodeStatusFailed,
			Error:      err,
			StartedAt:  startTime,
			FinishedAt: time.Now(),
		}, err
	}

	// 执行
	result, err := executor.Execute(ctx, node, inputs, execCtx)
	if result == nil {
		result = &NodeResult{
			NodeID:    node.ID,
			StartedAt: startTime,
		}
	}

	finishTime := time.Now()
	result.FinishedAt = finishTime
	result.DurationMs = int(finishTime.Sub(startTime).Milliseconds())

	if err != nil {
		result.Status = NodeStatusFailed
		result.Error = err

		// 发送失败事件
		e.emitEvent(&ExecutionEvent{
			Type:        EventNodeFailed,
			ExecutionID: execCtx.ExecutionID,
			WorkflowID:  execCtx.WorkflowID,
			NodeID:      node.ID,
			NodeType:    node.Type,
			Error:       err.Error(),
			DurationMs:  result.DurationMs,
			Timestamp:   finishTime,
		})
	} else {
		result.Status = NodeStatusCompleted
		// 保存输出到上下文
		execCtx.SetNodeOutput(node.ID, result.Outputs)
	}

	return result, err
}

// collectInputs 收集节点输入
func (e *Engine) collectInputs(dag *DAG, node *NodeDefinition, execCtx *ExecutionContext) map[string]interface{} {
	inputs := make(map[string]interface{})

	// 从全局变量获取
	for k, v := range execCtx.Variables {
		inputs[k] = v
	}

	// 从前置节点输出获取
	predecessors := dag.GetPredecessors(node.ID)
	for _, predID := range predecessors {
		predOutputs := execCtx.GetNodeOutput(predID)
		if predOutputs != nil {
			// 获取连接边信息
			edge := dag.GetOutEdge(predID, node.ID)
			if edge != nil {
				// 根据 handle 映射输入
				if edge.SourceHandle != "" && edge.TargetHandle != "" {
					if val, ok := predOutputs[edge.SourceHandle]; ok {
						inputs[edge.TargetHandle] = val
					}
				}
			}
			// 同时提供完整的前置节点输出
			inputs[predID] = predOutputs
		}
	}

	return inputs
}

func (e *Engine) handleExecutionError(execCtx *ExecutionContext, startTime time.Time, err error) (*ExecutionResult, error) {
	finishTime := time.Now()

	e.emitEvent(&ExecutionEvent{
		Type:        EventExecutionFailed,
		ExecutionID: execCtx.ExecutionID,
		WorkflowID:  execCtx.WorkflowID,
		Error:       err.Error(),
		DurationMs:  int(finishTime.Sub(startTime).Milliseconds()),
		Timestamp:   finishTime,
	})

	return &ExecutionResult{
		ExecutionID: execCtx.ExecutionID,
		Status:      ExecutionStatusFailed,
		Error:       err,
		StartedAt:   startTime,
		FinishedAt:  finishTime,
		DurationMs:  int(finishTime.Sub(startTime).Milliseconds()),
	}, err
}

// ParseWorkflowDefinition 解析工作流定义 JSON
func ParseWorkflowDefinition(data []byte) (*WorkflowDefinition, error) {
	var def WorkflowDefinition
	if err := json.Unmarshal(data, &def); err != nil {
		return nil, fmt.Errorf("failed to parse workflow definition: %w", err)
	}
	return &def, nil
}

// ParseWorkflowDefinitionFromMap 从 map 解析工作流定义
func ParseWorkflowDefinitionFromMap(data map[string]interface{}) (*WorkflowDefinition, error) {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return nil, err
	}
	return ParseWorkflowDefinition(jsonData)
}
