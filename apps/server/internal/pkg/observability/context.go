package observability

import (
	"context"

	"github.com/google/uuid"
)

// ContextKey 上下文键类型
type ContextKey string

// 标准上下文键定义
const (
	// TraceIDKey 追踪 ID 键
	TraceIDKey ContextKey = "trace_id"
	// SpanIDKey Span ID 键
	SpanIDKey ContextKey = "span_id"
	// ParentSpanIDKey 父 Span ID 键
	ParentSpanIDKey ContextKey = "parent_span_id"
	// WorkspaceIDKey 工作空间 ID 键
	WorkspaceIDKey ContextKey = "workspace_id"
	// AppIDKey 应用 ID 键
	AppIDKey ContextKey = "app_id"
	// ExecutionIDKey 执行 ID 键
	ExecutionIDKey ContextKey = "execution_id"
	// UserIDKey 用户 ID 键
	UserIDKey ContextKey = "user_id"
	// RequestIDKey 请求 ID 键
	RequestIDKey ContextKey = "request_id"
	// SessionIDKey 会话 ID 键
	SessionIDKey ContextKey = "session_id"
)

// TraceContext 追踪上下文结构
type TraceContext struct {
	// TraceID 全局追踪 ID (W3C trace-id 格式: 32 hex chars)
	TraceID string `json:"trace_id,omitempty"`
	// SpanID 当前 Span ID (W3C span-id 格式: 16 hex chars)
	SpanID string `json:"span_id,omitempty"`
	// ParentSpanID 父 Span ID
	ParentSpanID string `json:"parent_span_id,omitempty"`
	// WorkspaceID 工作空间 ID
	WorkspaceID string `json:"workspace_id,omitempty"`
	// AppID 应用 ID
	AppID string `json:"app_id,omitempty"`
	// ExecutionID 工作流执行 ID
	ExecutionID string `json:"execution_id,omitempty"`
	// UserID 用户 ID
	UserID string `json:"user_id,omitempty"`
	// RequestID HTTP 请求 ID
	RequestID string `json:"request_id,omitempty"`
	// SessionID 会话 ID (匿名/登录会话)
	SessionID string `json:"session_id,omitempty"`
}

// NewTraceContext 创建新的追踪上下文
func NewTraceContext() *TraceContext {
	return &TraceContext{
		TraceID: generateTraceID(),
		SpanID:  generateSpanID(),
	}
}

// NewChildSpan 创建子 Span 上下文
func (tc *TraceContext) NewChildSpan() *TraceContext {
	return &TraceContext{
		TraceID:      tc.TraceID,
		SpanID:       generateSpanID(),
		ParentSpanID: tc.SpanID,
		WorkspaceID:  tc.WorkspaceID,
		AppID:        tc.AppID,
		ExecutionID:  tc.ExecutionID,
		UserID:       tc.UserID,
		RequestID:    tc.RequestID,
		SessionID:    tc.SessionID,
	}
}

// WithWorkspace 设置工作空间 ID
func (tc *TraceContext) WithWorkspace(workspaceID string) *TraceContext {
	tc.WorkspaceID = workspaceID
	return tc
}

// WithApp 设置应用 ID
func (tc *TraceContext) WithApp(appID string) *TraceContext {
	tc.AppID = appID
	return tc
}

// WithExecution 设置执行 ID
func (tc *TraceContext) WithExecution(executionID string) *TraceContext {
	tc.ExecutionID = executionID
	return tc
}

// WithUser 设置用户 ID
func (tc *TraceContext) WithUser(userID string) *TraceContext {
	tc.UserID = userID
	return tc
}

// WithRequest 设置请求 ID
func (tc *TraceContext) WithRequest(requestID string) *TraceContext {
	tc.RequestID = requestID
	return tc
}

// WithSession 设置会话 ID
func (tc *TraceContext) WithSession(sessionID string) *TraceContext {
	tc.SessionID = sessionID
	return tc
}

// ToMap 转换为 map (用于日志)
func (tc *TraceContext) ToMap() map[string]interface{} {
	m := make(map[string]interface{})
	if tc.TraceID != "" {
		m[string(TraceIDKey)] = tc.TraceID
	}
	if tc.SpanID != "" {
		m[string(SpanIDKey)] = tc.SpanID
	}
	if tc.ParentSpanID != "" {
		m[string(ParentSpanIDKey)] = tc.ParentSpanID
	}
	if tc.WorkspaceID != "" {
		m[string(WorkspaceIDKey)] = tc.WorkspaceID
	}
	if tc.AppID != "" {
		m[string(AppIDKey)] = tc.AppID
	}
	if tc.ExecutionID != "" {
		m[string(ExecutionIDKey)] = tc.ExecutionID
	}
	if tc.UserID != "" {
		m[string(UserIDKey)] = tc.UserID
	}
	if tc.RequestID != "" {
		m[string(RequestIDKey)] = tc.RequestID
	}
	if tc.SessionID != "" {
		m[string(SessionIDKey)] = tc.SessionID
	}
	return m
}

// ToKeyValues 转换为 key-value 切片 (用于 zap 日志)
func (tc *TraceContext) ToKeyValues() []interface{} {
	var kv []interface{}
	if tc.TraceID != "" {
		kv = append(kv, string(TraceIDKey), tc.TraceID)
	}
	if tc.SpanID != "" {
		kv = append(kv, string(SpanIDKey), tc.SpanID)
	}
	if tc.ParentSpanID != "" {
		kv = append(kv, string(ParentSpanIDKey), tc.ParentSpanID)
	}
	if tc.WorkspaceID != "" {
		kv = append(kv, string(WorkspaceIDKey), tc.WorkspaceID)
	}
	if tc.AppID != "" {
		kv = append(kv, string(AppIDKey), tc.AppID)
	}
	if tc.ExecutionID != "" {
		kv = append(kv, string(ExecutionIDKey), tc.ExecutionID)
	}
	if tc.UserID != "" {
		kv = append(kv, string(UserIDKey), tc.UserID)
	}
	if tc.RequestID != "" {
		kv = append(kv, string(RequestIDKey), tc.RequestID)
	}
	if tc.SessionID != "" {
		kv = append(kv, string(SessionIDKey), tc.SessionID)
	}
	return kv
}

// ContextWithTraceContext 将 TraceContext 注入 context.Context
func ContextWithTraceContext(ctx context.Context, tc *TraceContext) context.Context {
	if tc == nil {
		return ctx
	}
	ctx = context.WithValue(ctx, TraceIDKey, tc.TraceID)
	ctx = context.WithValue(ctx, SpanIDKey, tc.SpanID)
	ctx = context.WithValue(ctx, ParentSpanIDKey, tc.ParentSpanID)
	ctx = context.WithValue(ctx, WorkspaceIDKey, tc.WorkspaceID)
	ctx = context.WithValue(ctx, AppIDKey, tc.AppID)
	ctx = context.WithValue(ctx, ExecutionIDKey, tc.ExecutionID)
	ctx = context.WithValue(ctx, UserIDKey, tc.UserID)
	ctx = context.WithValue(ctx, RequestIDKey, tc.RequestID)
	ctx = context.WithValue(ctx, SessionIDKey, tc.SessionID)
	return ctx
}

// TraceContextFromContext 从 context.Context 提取 TraceContext
func TraceContextFromContext(ctx context.Context) *TraceContext {
	if ctx == nil {
		return NewTraceContext()
	}

	tc := &TraceContext{}

	if v := ctx.Value(TraceIDKey); v != nil {
		if s, ok := v.(string); ok {
			tc.TraceID = s
		}
	}
	if v := ctx.Value(SpanIDKey); v != nil {
		if s, ok := v.(string); ok {
			tc.SpanID = s
		}
	}
	if v := ctx.Value(ParentSpanIDKey); v != nil {
		if s, ok := v.(string); ok {
			tc.ParentSpanID = s
		}
	}
	if v := ctx.Value(WorkspaceIDKey); v != nil {
		if s, ok := v.(string); ok {
			tc.WorkspaceID = s
		}
	}
	if v := ctx.Value(AppIDKey); v != nil {
		if s, ok := v.(string); ok {
			tc.AppID = s
		}
	}
	if v := ctx.Value(ExecutionIDKey); v != nil {
		if s, ok := v.(string); ok {
			tc.ExecutionID = s
		}
	}
	if v := ctx.Value(UserIDKey); v != nil {
		if s, ok := v.(string); ok {
			tc.UserID = s
		}
	}
	if v := ctx.Value(RequestIDKey); v != nil {
		if s, ok := v.(string); ok {
			tc.RequestID = s
		}
	}
	if v := ctx.Value(SessionIDKey); v != nil {
		if s, ok := v.(string); ok {
			tc.SessionID = s
		}
	}

	// 如果没有 trace_id，生成一个新的
	if tc.TraceID == "" {
		tc.TraceID = generateTraceID()
	}
	if tc.SpanID == "" {
		tc.SpanID = generateSpanID()
	}

	return tc
}

// generateTraceID 生成 W3C 格式的 trace-id (32 hex chars)
func generateTraceID() string {
	u := uuid.New()
	// 将 UUID 转换为 32 字符的 hex 字符串 (移除连字符)
	return u.String()[:8] + u.String()[9:13] + u.String()[14:18] + u.String()[19:23] + u.String()[24:]
}

// generateSpanID 生成 W3C 格式的 span-id (16 hex chars)
func generateSpanID() string {
	u := uuid.New()
	// 取 UUID 的前 16 个字符 (移除连字符)
	return u.String()[:8] + u.String()[9:13]
}

// LogFields 日志字段定义 (用于统一日志格式)
type LogFields struct {
	// 标准字段
	Level     string `json:"level"`
	Timestamp string `json:"timestamp"`
	Message   string `json:"message"`
	Caller    string `json:"caller,omitempty"`

	// 追踪字段
	TraceID      string `json:"trace_id,omitempty"`
	SpanID       string `json:"span_id,omitempty"`
	ParentSpanID string `json:"parent_span_id,omitempty"`

	// 业务上下文字段
	WorkspaceID string `json:"workspace_id,omitempty"`
	AppID       string `json:"app_id,omitempty"`
	ExecutionID string `json:"execution_id,omitempty"`
	UserID      string `json:"user_id,omitempty"`
	RequestID   string `json:"request_id,omitempty"`
	SessionID   string `json:"session_id,omitempty"`

	// HTTP 请求字段
	Method     string `json:"method,omitempty"`
	Path       string `json:"path,omitempty"`
	StatusCode int    `json:"status_code,omitempty"`
	LatencyMs  int64  `json:"latency_ms,omitempty"`
	RemoteIP   string `json:"remote_ip,omitempty"`
	UserAgent  string `json:"user_agent,omitempty"`

	// 错误字段
	Error      string `json:"error,omitempty"`
	StackTrace string `json:"stack_trace,omitempty"`

	// 扩展字段 (任意 key-value)
	Extra map[string]interface{} `json:"extra,omitempty"`
}
