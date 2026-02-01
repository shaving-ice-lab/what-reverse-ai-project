package executor

import (
	"context"
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

	// 全局变量
	Variables map[string]interface{}

	// 节点输出缓存 (nodeId -> outputs)
	NodeOutputs map[string]map[string]interface{}

	// API 密钥 (provider -> key)
	APIKeys map[string]string

	// 取消通道
	CancelChan chan struct{}

	// 是否已取消
	Cancelled bool
}

// NewExecutionContext 创建执行上下文
func NewExecutionContext(executionID, workflowID, userID string) *ExecutionContext {
	return &ExecutionContext{
		ExecutionID: executionID,
		WorkflowID:  workflowID,
		UserID:      userID,
		Variables:   make(map[string]interface{}),
		NodeOutputs: make(map[string]map[string]interface{}),
		APIKeys:     make(map[string]string),
		CancelChan:  make(chan struct{}),
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
	Level     string    `json:"level"`
	Message   string    `json:"message"`
	Timestamp time.Time `json:"timestamp"`
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
