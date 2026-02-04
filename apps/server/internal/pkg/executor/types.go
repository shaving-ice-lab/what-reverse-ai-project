package executor

import (
	"context"
	"fmt"
	"time"
)

// NodeType 节点类型
type NodeType string

const (
	NodeTypeStart             NodeType = "start"
	NodeTypeEnd               NodeType = "end"
	NodeTypeLLM               NodeType = "llm"
	NodeTypeHTTP              NodeType = "http"
	NodeTypeCondition         NodeType = "condition"
	NodeTypeLoop              NodeType = "loop"
	NodeTypeCode              NodeType = "code"
	NodeTypeTemplate          NodeType = "template"
	NodeTypeVariable          NodeType = "variable"
	NodeTypeDelay             NodeType = "delay"
	NodeTypeWebhook           NodeType = "webhook"
	NodeTypeWebSearch         NodeType = "websearch"
	NodeTypeDocumentAssembler NodeType = "documentAssembler"
)

// NodeStatus 节点执行状态
type NodeStatus string

const (
	NodeStatusPending   NodeStatus = "pending"
	NodeStatusRunning   NodeStatus = "running"
	NodeStatusCompleted NodeStatus = "completed"
	NodeStatusFailed    NodeStatus = "failed"
	NodeStatusSkipped   NodeStatus = "skipped"
)

// ExecutionStatus 执行状态
type ExecutionStatus string

const (
	ExecutionStatusPending   ExecutionStatus = "pending"
	ExecutionStatusRunning   ExecutionStatus = "running"
	ExecutionStatusCompleted ExecutionStatus = "completed"
	ExecutionStatusFailed    ExecutionStatus = "failed"
	ExecutionStatusCancelled ExecutionStatus = "cancelled"
)

// ModelUsageRecord 模型用量记录
type ModelUsageRecord struct {
	WorkspaceID      string
	UserID           string
	ExecutionID      string
	WorkflowID       string
	NodeID           string
	Provider         string
	Model            string
	Strategy         string
	PromptTokens     int
	CompletionTokens int
	TotalTokens      int
	CostAmount       float64
	Currency         string
}

// ModelUsageRecorder 模型用量记录器
type ModelUsageRecorder interface {
	RecordModelUsage(ctx context.Context, record ModelUsageRecord)
}

// AuditEvent 执行审计事件
type AuditEvent struct {
	Action     string
	TargetType string
	TargetID   string
	Metadata   map[string]interface{}
}

// AuditRecorder 审计记录器
type AuditRecorder interface {
	RecordAudit(ctx context.Context, execCtx *ExecutionContext, event AuditEvent)
}

// WorkflowDefinition 工作流定义
type WorkflowDefinition struct {
	Version  string                 `json:"version"`
	Nodes    []NodeDefinition       `json:"nodes"`
	Edges    []EdgeDefinition       `json:"edges"`
	Settings map[string]interface{} `json:"settings"`
}

// NodeDefinition 节点定义
type NodeDefinition struct {
	ID       string                 `json:"id"`
	Type     NodeType               `json:"type"`
	Label    string                 `json:"label"`
	Position Position               `json:"position"`
	Data     map[string]interface{} `json:"data,omitempty"`
	Config   map[string]interface{} `json:"config"`
	Inputs   []PortDefinition       `json:"inputs"`
	Outputs  []PortDefinition       `json:"outputs"`
}

// Position 位置
type Position struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

// PortDefinition 端口定义
type PortDefinition struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Type string `json:"type"`
}

// EdgeDefinition 边定义
type EdgeDefinition struct {
	ID           string `json:"id"`
	Source       string `json:"source"`
	SourceHandle string `json:"sourceHandle"`
	Target       string `json:"target"`
	TargetHandle string `json:"targetHandle"`
	Label        string `json:"label,omitempty"`
}

// ExecutionContext 执行上下文
type ExecutionContext struct {
	// 执行 ID
	ExecutionID string

	// 工作流 ID
	WorkflowID string

	// 用户 ID
	UserID string

	// 工作空间 ID
	WorkspaceID string

	// 触发类型与元信息
	TriggerType string
	TriggerData map[string]interface{}

	// 全局变量
	Variables map[string]interface{}

	// 节点输出缓存 (nodeId -> outputs)
	NodeOutputs map[string]map[string]interface{}

	// Token 使用量汇总
	TokenUsage TokenUsage

	// 变量生命周期日志 (nodeId -> logs)
	VariableLogs map[string][]LogEntry

	// API 密钥 (provider -> key)
	APIKeys map[string]string

	// 模型用量记录器
	ModelUsageRecorder ModelUsageRecorder

	// 审计记录器
	AuditRecorder AuditRecorder

	// 取消通道
	CancelChan chan struct{}

	// 是否已取消
	Cancelled bool
}

// NewExecutionContext 创建执行上下文
func NewExecutionContext(executionID, workflowID, userID, workspaceID string) *ExecutionContext {
	return &ExecutionContext{
		ExecutionID:  executionID,
		WorkflowID:   workflowID,
		UserID:       userID,
		WorkspaceID:  workspaceID,
		Variables:    make(map[string]interface{}),
		NodeOutputs:  make(map[string]map[string]interface{}),
		VariableLogs: make(map[string][]LogEntry),
		APIKeys:      make(map[string]string),
		CancelChan:   make(chan struct{}),
	}
}

// SetNodeOutput 设置节点输出
func (c *ExecutionContext) SetNodeOutput(nodeID string, outputs map[string]interface{}) {
	c.NodeOutputs[nodeID] = outputs
}

// GetNodeOutput 获取节点输出
func (c *ExecutionContext) GetNodeOutput(nodeID string) map[string]interface{} {
	return c.NodeOutputs[nodeID]
}

// GetVariable 获取变量值
func (c *ExecutionContext) GetVariable(path string) interface{} {
	// 支持获取全局变量或节点输出
	// 格式: {{nodeId.outputKey}} 或 {{variableName}}
	return c.Variables[path]
}

// SetVariable 设置变量并记录生命周期日志
func (c *ExecutionContext) SetVariable(nodeID, name string, value interface{}) {
	if c == nil || name == "" {
		return
	}
	if c.Variables == nil {
		c.Variables = make(map[string]interface{})
	}
	previous, exists := c.Variables[name]
	c.Variables[name] = value

	action := "set"
	if exists {
		action = "update"
	}
	if nodeID == "" {
		nodeID = "system"
	}
	if c.VariableLogs == nil {
		c.VariableLogs = make(map[string][]LogEntry)
	}
	logEntry := LogEntry{
		Level:     "variable",
		Message:   fmt.Sprintf("%s variable %s", action, name),
		Timestamp: time.Now(),
		Data: map[string]interface{}{
			"name":   name,
			"action": action,
			"value":  value,
		},
	}
	if exists {
		logEntry.Data["previous"] = previous
	}
	c.VariableLogs[nodeID] = append(c.VariableLogs[nodeID], logEntry)
}

// RecordModelUsage 记录模型用量
func (c *ExecutionContext) RecordModelUsage(ctx context.Context, record ModelUsageRecord) {
	if c == nil || c.ModelUsageRecorder == nil {
		return
	}
	c.ModelUsageRecorder.RecordModelUsage(ctx, record)
}

// RecordAudit 记录审计事件
func (c *ExecutionContext) RecordAudit(ctx context.Context, event AuditEvent) {
	if c == nil || c.AuditRecorder == nil {
		return
	}
	c.AuditRecorder.RecordAudit(ctx, c, event)
}

// AddTokenUsage 累加 Token 使用量
func (c *ExecutionContext) AddTokenUsage(usage TokenUsage) {
	if c == nil {
		return
	}
	normalized := NormalizeTokenUsage(usage)
	c.TokenUsage.PromptTokens += normalized.PromptTokens
	c.TokenUsage.CompletionTokens += normalized.CompletionTokens
	c.TokenUsage.TotalTokens = c.TokenUsage.PromptTokens + c.TokenUsage.CompletionTokens
}

// GetVariableLogs 获取节点变量日志
func (c *ExecutionContext) GetVariableLogs(nodeID string) []LogEntry {
	if c == nil || nodeID == "" || c.VariableLogs == nil {
		return nil
	}
	logs := c.VariableLogs[nodeID]
	if len(logs) == 0 {
		return nil
	}
	copied := make([]LogEntry, len(logs))
	copy(copied, logs)
	return copied
}

// Cancel 取消执行
func (c *ExecutionContext) Cancel() {
	c.Cancelled = true
	close(c.CancelChan)
}

// IsCancelled 检查是否已取消
func (c *ExecutionContext) IsCancelled() bool {
	select {
	case <-c.CancelChan:
		return true
	default:
		return c.Cancelled
	}
}

// NodeResult 节点执行结果
type NodeResult struct {
	NodeID     string
	Status     NodeStatus
	Outputs    map[string]interface{}
	Error      error
	StartedAt  time.Time
	FinishedAt time.Time
	DurationMs int
	Logs       []LogEntry
	NextHandle string // 用于条件分支和并行执行的下一个处理句柄
}

// LogEntry 日志条目
type LogEntry struct {
	Level     string                 `json:"level"`
	Message   string                 `json:"message"`
	Timestamp time.Time              `json:"timestamp"`
	Data      map[string]interface{} `json:"data,omitempty"`
}

// ExecutionResult 执行结果
type ExecutionResult struct {
	ExecutionID string
	Status      ExecutionStatus
	Outputs     map[string]interface{}
	Error       error
	StartedAt   time.Time
	FinishedAt  time.Time
	DurationMs  int
	NodeResults map[string]*NodeResult
	TokenUsage  TokenUsage
}

// TokenUsage Token 使用量
type TokenUsage struct {
	PromptTokens     int `json:"prompt_tokens"`
	CompletionTokens int `json:"completion_tokens"`
	TotalTokens      int `json:"total_tokens"`
}

// NormalizeTokenUsage 确保 total_tokens = prompt_tokens + completion_tokens
func NormalizeTokenUsage(usage TokenUsage) TokenUsage {
	promptTokens := clampTokenValue(usage.PromptTokens)
	completionTokens := clampTokenValue(usage.CompletionTokens)
	if promptTokens == 0 && completionTokens == 0 && usage.TotalTokens > 0 {
		promptTokens = usage.TotalTokens
	}
	totalTokens := promptTokens + completionTokens
	return TokenUsage{
		PromptTokens:     promptTokens,
		CompletionTokens: completionTokens,
		TotalTokens:      totalTokens,
	}
}

func clampTokenValue(value int) int {
	if value < 0 {
		return 0
	}
	return value
}

// NodeExecutor 节点执行器接口
type NodeExecutor interface {
	// Execute 执行节点
	Execute(ctx context.Context, node *NodeDefinition, inputs map[string]interface{}, execCtx *ExecutionContext) (*NodeResult, error)

	// GetType 获取节点类型
	GetType() NodeType
}

// ExecutionEventType 执行事件类型
type ExecutionEventType string

const (
	EventExecutionStarted   ExecutionEventType = "execution.started"
	EventExecutionCompleted ExecutionEventType = "execution.completed"
	EventExecutionFailed    ExecutionEventType = "execution.failed"
	EventExecutionCancelled ExecutionEventType = "execution.cancelled"
	EventNodeStarted        ExecutionEventType = "node.started"
	EventNodeCompleted      ExecutionEventType = "node.completed"
	EventNodeFailed         ExecutionEventType = "node.failed"
	EventNodeSkipped        ExecutionEventType = "node.skipped"
	EventLog                ExecutionEventType = "log"
)

// ExecutionEvent 执行事件
type ExecutionEvent struct {
	Type        ExecutionEventType
	ExecutionID string
	WorkflowID  string
	NodeID      string
	NodeType    NodeType
	Status      string
	Inputs      map[string]interface{}
	Outputs     map[string]interface{}
	Error       string
	DurationMs  int
	Progress    int
	TotalNodes  int
	Timestamp   time.Time
}

// EventHandler 事件处理器接口
type EventHandler interface {
	HandleEvent(event *ExecutionEvent)
}
