package executor

import (
	"context"
	"errors"
	"fmt"
	"runtime/debug"
	"sync"
	"time"
)

/**
 * 执行引擎错误恢复机制
 *
 * 提供:
 * 1. Panic 恢复 - 防止单节点崩溃导致整个执行中断
 * 2. 重试机制 - 可配置的自动重试
 * 3. 超时处理 - 节点级别的超时控制
 * 4. 错误分类 - 区分可恢复和不可恢复错误
 * 5. 检查点 - 支持从检查点恢复执行
 */

// ===== 错误类型 =====

// ExecutionError 执行错误
type ExecutionError struct {
	Code       string                 `json:"code"`
	Message    string                 `json:"message"`
	NodeID     string                 `json:"nodeId,omitempty"`
	NodeType   NodeType               `json:"nodeType,omitempty"`
	Recoverable bool                  `json:"recoverable"`
	Details    map[string]interface{} `json:"details,omitempty"`
	Stack      string                 `json:"stack,omitempty"`
	Cause      error                  `json:"-"`
}

func (e *ExecutionError) Error() string {
	if e.NodeID != "" {
		return fmt.Sprintf("[%s] %s (node: %s): %s", e.Code, e.Message, e.NodeID, e.Details)
	}
	return fmt.Sprintf("[%s] %s: %v", e.Code, e.Message, e.Details)
}

func (e *ExecutionError) Unwrap() error {
	return e.Cause
}

// 错误码常量
const (
	ErrCodePanic           = "PANIC"
	ErrCodeTimeout         = "TIMEOUT"
	ErrCodeCancelled       = "CANCELLED"
	ErrCodeValidation      = "VALIDATION"
	ErrCodeExecution       = "EXECUTION"
	ErrCodeNetwork         = "NETWORK"
	ErrCodeRateLimit       = "RATE_LIMIT"
	ErrCodeResourceLimit   = "RESOURCE_LIMIT"
	ErrCodeConfiguration   = "CONFIGURATION"
	ErrCodeDependency      = "DEPENDENCY"
	ErrCodeUnknown         = "UNKNOWN"
)

// NewExecutionError 创建执行错误
func NewExecutionError(code string, message string, recoverable bool) *ExecutionError {
	return &ExecutionError{
		Code:        code,
		Message:     message,
		Recoverable: recoverable,
		Details:     make(map[string]interface{}),
	}
}

// WithNode 设置节点信息
func (e *ExecutionError) WithNode(nodeID string, nodeType NodeType) *ExecutionError {
	e.NodeID = nodeID
	e.NodeType = nodeType
	return e
}

// WithDetails 添加详细信息
func (e *ExecutionError) WithDetails(details map[string]interface{}) *ExecutionError {
	for k, v := range details {
		e.Details[k] = v
	}
	return e
}

// WithCause 设置原因
func (e *ExecutionError) WithCause(cause error) *ExecutionError {
	e.Cause = cause
	return e
}

// WithStack 添加堆栈信息
func (e *ExecutionError) WithStack() *ExecutionError {
	e.Stack = string(debug.Stack())
	return e
}

// ===== 重试配置 =====

// RetryConfig 重试配置
type RetryConfig struct {
	MaxRetries     int           // 最大重试次数
	InitialBackoff time.Duration // 初始退避时间
	MaxBackoff     time.Duration // 最大退避时间
	BackoffFactor  float64       // 退避因子
	RetryableErrors []string     // 可重试的错误码
}

// DefaultRetryConfig 默认重试配置
func DefaultRetryConfig() *RetryConfig {
	return &RetryConfig{
		MaxRetries:     3,
		InitialBackoff: 100 * time.Millisecond,
		MaxBackoff:     5 * time.Second,
		BackoffFactor:  2.0,
		RetryableErrors: []string{
			ErrCodeNetwork,
			ErrCodeRateLimit,
			ErrCodeTimeout,
		},
	}
}

// IsRetryable 检查错误是否可重试
func (c *RetryConfig) IsRetryable(err error) bool {
	var execErr *ExecutionError
	if errors.As(err, &execErr) {
		for _, code := range c.RetryableErrors {
			if execErr.Code == code {
				return true
			}
		}
		return execErr.Recoverable
	}
	return false
}

// ===== 带重试的执行器包装 =====

// RetryableExecutor 带重试功能的执行器包装
type RetryableExecutor struct {
	executor NodeExecutor
	config   *RetryConfig
}

// NewRetryableExecutor 创建带重试的执行器
func NewRetryableExecutor(executor NodeExecutor, config *RetryConfig) *RetryableExecutor {
	if config == nil {
		config = DefaultRetryConfig()
	}
	return &RetryableExecutor{
		executor: executor,
		config:   config,
	}
}

func (r *RetryableExecutor) GetType() NodeType {
	return r.executor.GetType()
}

func (r *RetryableExecutor) Execute(ctx context.Context, node *NodeDefinition, inputs map[string]interface{}, execCtx *ExecutionContext) (*NodeResult, error) {
	var lastErr error
	backoff := r.config.InitialBackoff

	for attempt := 0; attempt <= r.config.MaxRetries; attempt++ {
		// 执行
		result, err := r.executor.Execute(ctx, node, inputs, execCtx)
		
		if err == nil {
			return result, nil
		}

		lastErr = err

		// 检查是否可重试
		if !r.config.IsRetryable(err) || attempt >= r.config.MaxRetries {
			break
		}

		// 检查上下文
		select {
		case <-ctx.Done():
			return nil, NewExecutionError(ErrCodeCancelled, "execution cancelled during retry", false).
				WithNode(node.ID, node.Type).
				WithCause(ctx.Err())
		default:
		}

		// 退避等待
		time.Sleep(backoff)
		backoff = time.Duration(float64(backoff) * r.config.BackoffFactor)
		if backoff > r.config.MaxBackoff {
			backoff = r.config.MaxBackoff
		}
	}

	return nil, lastErr
}

// ===== 安全执行包装 =====

// SafeExecute 安全执行 (带 panic 恢复)
func SafeExecute(ctx context.Context, executor NodeExecutor, node *NodeDefinition, inputs map[string]interface{}, execCtx *ExecutionContext) (result *NodeResult, err error) {
	defer func() {
		if r := recover(); r != nil {
			err = NewExecutionError(ErrCodePanic, fmt.Sprintf("panic recovered: %v", r), false).
				WithNode(node.ID, node.Type).
				WithStack()
		}
	}()

	return executor.Execute(ctx, node, inputs, execCtx)
}

// SafeExecuteWithTimeout 带超时的安全执行
func SafeExecuteWithTimeout(ctx context.Context, executor NodeExecutor, node *NodeDefinition, inputs map[string]interface{}, execCtx *ExecutionContext, timeout time.Duration) (*NodeResult, error) {
	// 创建带超时的上下文
	timeoutCtx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	// 使用 channel 接收结果
	type execResult struct {
		result *NodeResult
		err    error
	}
	resultChan := make(chan execResult, 1)

	go func() {
		result, err := SafeExecute(timeoutCtx, executor, node, inputs, execCtx)
		resultChan <- execResult{result, err}
	}()

	select {
	case <-timeoutCtx.Done():
		if timeoutCtx.Err() == context.DeadlineExceeded {
			return nil, NewExecutionError(ErrCodeTimeout, "node execution timeout", true).
				WithNode(node.ID, node.Type).
				WithDetails(map[string]interface{}{
					"timeout": timeout.String(),
				})
		}
		return nil, NewExecutionError(ErrCodeCancelled, "node execution cancelled", false).
			WithNode(node.ID, node.Type).
			WithCause(timeoutCtx.Err())
	case res := <-resultChan:
		return res.result, res.err
	}
}

// ===== 检查点管理 =====

// Checkpoint 检查点
type Checkpoint struct {
	ExecutionID    string                            `json:"executionId"`
	WorkflowID     string                            `json:"workflowId"`
	CompletedNodes map[string]*NodeResult            `json:"completedNodes"`
	Variables      map[string]interface{}            `json:"variables"`
	NodeOutputs    map[string]map[string]interface{} `json:"nodeOutputs"`
	CreatedAt      time.Time                         `json:"createdAt"`
}

// CheckpointManager 检查点管理器
type CheckpointManager struct {
	checkpoints map[string]*Checkpoint
	mu          sync.RWMutex
}

// NewCheckpointManager 创建检查点管理器
func NewCheckpointManager() *CheckpointManager {
	return &CheckpointManager{
		checkpoints: make(map[string]*Checkpoint),
	}
}

// Save 保存检查点
func (m *CheckpointManager) Save(execCtx *ExecutionContext, completedNodes map[string]*NodeResult) *Checkpoint {
	m.mu.Lock()
	defer m.mu.Unlock()

	checkpoint := &Checkpoint{
		ExecutionID:    execCtx.ExecutionID,
		WorkflowID:     execCtx.WorkflowID,
		CompletedNodes: completedNodes,
		Variables:      execCtx.Variables,
		NodeOutputs:    make(map[string]map[string]interface{}),
		CreatedAt:      time.Now(),
	}

	// 复制节点输出
	for nodeID := range completedNodes {
		if outputs := execCtx.GetNodeOutput(nodeID); outputs != nil {
			checkpoint.NodeOutputs[nodeID] = outputs
		}
	}

	m.checkpoints[execCtx.ExecutionID] = checkpoint
	return checkpoint
}

// Get 获取检查点
func (m *CheckpointManager) Get(executionID string) *Checkpoint {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.checkpoints[executionID]
}

// Delete 删除检查点
func (m *CheckpointManager) Delete(executionID string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.checkpoints, executionID)
}

// ===== 错误聚合器 =====

// ErrorAggregator 错误聚合器
type ErrorAggregator struct {
	errors []error
	mu     sync.Mutex
}

// NewErrorAggregator 创建错误聚合器
func NewErrorAggregator() *ErrorAggregator {
	return &ErrorAggregator{
		errors: make([]error, 0),
	}
}

// Add 添加错误
func (a *ErrorAggregator) Add(err error) {
	if err == nil {
		return
	}
	a.mu.Lock()
	defer a.mu.Unlock()
	a.errors = append(a.errors, err)
}

// HasErrors 是否有错误
func (a *ErrorAggregator) HasErrors() bool {
	a.mu.Lock()
	defer a.mu.Unlock()
	return len(a.errors) > 0
}

// Errors 获取所有错误
func (a *ErrorAggregator) Errors() []error {
	a.mu.Lock()
	defer a.mu.Unlock()
	result := make([]error, len(a.errors))
	copy(result, a.errors)
	return result
}

// First 获取第一个错误
func (a *ErrorAggregator) First() error {
	a.mu.Lock()
	defer a.mu.Unlock()
	if len(a.errors) > 0 {
		return a.errors[0]
	}
	return nil
}

// Combined 返回组合错误
func (a *ErrorAggregator) Combined() error {
	a.mu.Lock()
	defer a.mu.Unlock()
	
	if len(a.errors) == 0 {
		return nil
	}
	
	if len(a.errors) == 1 {
		return a.errors[0]
	}

	return fmt.Errorf("multiple errors occurred: %v", a.errors)
}

// ===== 工具函数 =====

// WrapError 包装错误为执行错误
func WrapError(err error, code string, recoverable bool) *ExecutionError {
	if err == nil {
		return nil
	}
	
	// 已经是 ExecutionError
	var execErr *ExecutionError
	if errors.As(err, &execErr) {
		return execErr
	}

	return NewExecutionError(code, err.Error(), recoverable).WithCause(err)
}

// ClassifyError 分类错误
func ClassifyError(err error) (code string, recoverable bool) {
	if err == nil {
		return "", false
	}

	// 检查是否是已知错误
	var execErr *ExecutionError
	if errors.As(err, &execErr) {
		return execErr.Code, execErr.Recoverable
	}

	// 上下文错误
	if errors.Is(err, context.Canceled) {
		return ErrCodeCancelled, false
	}
	if errors.Is(err, context.DeadlineExceeded) {
		return ErrCodeTimeout, true
	}

	// 默认为执行错误
	return ErrCodeExecution, false
}
