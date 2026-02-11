package service

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
)

// AgentTool 定义 Agent 可调用的工具接口
type AgentTool interface {
	// Name 工具名称（唯一标识）
	Name() string
	// Description 工具描述（供 LLM 理解用途）
	Description() string
	// Parameters 参数的 JSON Schema 定义
	Parameters() json.RawMessage
	// RequiresConfirmation 是否需要用户确认后才执行
	RequiresConfirmation() bool
	// Execute 执行工具
	Execute(ctx context.Context, params json.RawMessage) (*AgentToolResult, error)
}

// AgentToolMeta 工具元信息（用于发送给 LLM）
type AgentToolMeta struct {
	Name                 string          `json:"name"`
	Description          string          `json:"description"`
	Parameters           json.RawMessage `json:"parameters"`
	RequiresConfirmation bool            `json:"requires_confirmation"`
}

// AgentToolResult 工具执行结果
type AgentToolResult struct {
	// Success 是否成功
	Success bool `json:"success"`
	// Output 输出内容（文本摘要，供 LLM 使用）
	Output string `json:"output"`
	// Data 结构化数据（可选）
	Data interface{} `json:"data,omitempty"`
	// Error 错误信息
	Error string `json:"error,omitempty"`
}

// AgentToolRegistry 工具注册表
type AgentToolRegistry struct {
	mu    sync.RWMutex
	tools map[string]AgentTool
}

// NewAgentToolRegistry 创建工具注册表
func NewAgentToolRegistry() *AgentToolRegistry {
	return &AgentToolRegistry{
		tools: make(map[string]AgentTool),
	}
}

// Register 注册工具
func (r *AgentToolRegistry) Register(tool AgentTool) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	name := tool.Name()
	if _, exists := r.tools[name]; exists {
		return fmt.Errorf("agent tool %q already registered", name)
	}
	r.tools[name] = tool
	return nil
}

// MustRegister 注册工具（失败时 panic）
func (r *AgentToolRegistry) MustRegister(tool AgentTool) {
	if err := r.Register(tool); err != nil {
		panic(err)
	}
}

// Get 获取工具
func (r *AgentToolRegistry) Get(name string) (AgentTool, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	tool, ok := r.tools[name]
	return tool, ok
}

// ListAll 列出所有工具元信息
func (r *AgentToolRegistry) ListAll() []AgentToolMeta {
	r.mu.RLock()
	defer r.mu.RUnlock()
	metas := make([]AgentToolMeta, 0, len(r.tools))
	for _, tool := range r.tools {
		metas = append(metas, AgentToolMeta{
			Name:                 tool.Name(),
			Description:          tool.Description(),
			Parameters:           tool.Parameters(),
			RequiresConfirmation: tool.RequiresConfirmation(),
		})
	}
	return metas
}

// ListAllJSON 列出所有工具定义（OpenAI function calling 格式）
func (r *AgentToolRegistry) ListAllJSON() []map[string]interface{} {
	metas := r.ListAll()
	result := make([]map[string]interface{}, 0, len(metas))
	for _, m := range metas {
		var params interface{}
		if len(m.Parameters) > 0 {
			_ = json.Unmarshal(m.Parameters, &params)
		}
		result = append(result, map[string]interface{}{
			"type": "function",
			"function": map[string]interface{}{
				"name":        m.Name,
				"description": m.Description,
				"parameters":  params,
			},
		})
	}
	return result
}

// Execute 执行指定工具
func (r *AgentToolRegistry) Execute(ctx context.Context, name string, params json.RawMessage) (*AgentToolResult, error) {
	tool, ok := r.Get(name)
	if !ok {
		return &AgentToolResult{
			Success: false,
			Error:   fmt.Sprintf("unknown tool: %s", name),
		}, fmt.Errorf("unknown tool: %s", name)
	}
	return tool.Execute(ctx, params)
}

// ToolCount 返回已注册工具数量
func (r *AgentToolRegistry) ToolCount() int {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return len(r.tools)
}
