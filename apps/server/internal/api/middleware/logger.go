package middleware

import (
	"context"
	"time"

	"github.com/agentflow/server/internal/pkg/logger"
	"github.com/agentflow/server/internal/pkg/observability"
	"github.com/agentflow/server/internal/pkg/security"
	"github.com/labstack/echo/v4"
)

// W3C Trace Context 头名称
const (
	TraceparentHeader    = "traceparent"
	TracestateHeader     = "tracestate"
	RequestIDHeader      = "X-Request-Id"
	IdempotencyKeyHeader = "Idempotency-Key"
	WorkspaceIDHeader    = "X-Workspace-Id"
	ExecutionIDHeader    = "X-Execution-Id"
	SessionIDHeader      = "X-Session-Id"
)

// Echo context key for TraceContext
const TraceContextKey = "trace_context"

// Logger 日志中间件（增强版：支持追踪上下文）
func Logger(log logger.Logger, piiEnabled bool) echo.MiddlewareFunc {
	var sanitizer *security.PIISanitizer
	if piiEnabled {
		sanitizer = security.NewPIISanitizer()
	}

	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			start := time.Now()
			req := c.Request()

			// 1. 创建或提取追踪上下文
			tc := extractOrCreateTraceContext(c)

			// 2. 将追踪上下文注入到 Echo context 和 request context
			c.Set(TraceContextKey, tc)
			ctx := observability.ContextWithTraceContext(req.Context(), tc)
			c.SetRequest(req.WithContext(ctx))

			// 3. 设置响应头（便于客户端追踪）
			res := c.Response()
			res.Header().Set(RequestIDHeader, tc.RequestID)
			res.Header().Set(TraceparentHeader, formatTraceparent(tc))

			// 4. 创建带上下文的 logger
			ctxLog := log.WithTraceContext(tc)

			// 5. 处理请求
			err := next(c)
			if err != nil {
				c.Error(err)
			}

			// 6. 计算耗时
			latency := time.Since(start)
			latencyMs := latency.Milliseconds()

			// 7. 记录访问日志（统一格式）
			query := req.URL.RawQuery
			remoteIP := c.RealIP()
			userAgent := req.UserAgent()
			if sanitizer != nil {
				query = sanitizer.SanitizeString(query)
				sanitized := sanitizer.SanitizeMap(map[string]interface{}{
					"remote_ip":  remoteIP,
					"user_agent": userAgent,
				})
				if value, ok := sanitized["remote_ip"].(string); ok {
					remoteIP = value
				}
				if value, ok := sanitized["user_agent"].(string); ok {
					userAgent = value
				}
			}

			ctxLog.Info("HTTP Request",
				"method", req.Method,
				"path", req.URL.Path,
				"query", query,
				"status", res.Status,
				"latency_ms", latencyMs,
				"latency", latency.String(),
				"remote_ip", remoteIP,
				"user_agent", userAgent,
				"content_length", req.ContentLength,
				"response_size", res.Size,
			)

			return nil
		}
	}
}

// extractOrCreateTraceContext 从请求头提取或创建新的追踪上下文
func extractOrCreateTraceContext(c echo.Context) *observability.TraceContext {
	req := c.Request()
	tc := observability.NewTraceContext()

	// 尝试从 W3C traceparent 头解析
	if traceparent := req.Header.Get(TraceparentHeader); traceparent != "" {
		if parsed := parseTraceparent(traceparent); parsed != nil {
			tc.TraceID = parsed.TraceID
			tc.ParentSpanID = parsed.SpanID
			// 生成新的 span_id 作为当前请求的 span
		}
	}

	// 从请求头获取 request_id（如果已有）
	if requestID := req.Header.Get(RequestIDHeader); requestID != "" {
		tc.RequestID = requestID
	} else if requestID := c.Response().Header().Get(echo.HeaderXRequestID); requestID != "" {
		tc.RequestID = requestID
	} else {
		// 使用 trace_id 的后 16 位作为 request_id
		tc.RequestID = tc.TraceID[len(tc.TraceID)-16:]
	}

	// 从请求头获取业务上下文
	if workspaceID := req.Header.Get(WorkspaceIDHeader); workspaceID != "" {
		tc.WorkspaceID = workspaceID
	}
	if executionID := req.Header.Get(ExecutionIDHeader); executionID != "" {
		tc.ExecutionID = executionID
	}
	if sessionID := req.Header.Get(SessionIDHeader); sessionID != "" {
		tc.SessionID = sessionID
	}

	return tc
}

// parseTraceparent 解析 W3C traceparent 头
// 格式: version-traceid-spanid-flags (例: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01)
func parseTraceparent(traceparent string) *observability.TraceContext {
	if len(traceparent) < 55 {
		return nil
	}

	parts := make([]string, 0, 4)
	start := 0
	for i := 0; i < len(traceparent); i++ {
		if traceparent[i] == '-' {
			parts = append(parts, traceparent[start:i])
			start = i + 1
		}
	}
	parts = append(parts, traceparent[start:])

	if len(parts) != 4 {
		return nil
	}

	// 验证版本 (目前只支持 00)
	if parts[0] != "00" {
		return nil
	}

	// 验证长度
	if len(parts[1]) != 32 || len(parts[2]) != 16 {
		return nil
	}

	return &observability.TraceContext{
		TraceID: parts[1],
		SpanID:  parts[2],
	}
}

// formatTraceparent 格式化为 W3C traceparent 头
func formatTraceparent(tc *observability.TraceContext) string {
	// 格式: 00-{trace_id}-{span_id}-01
	// 01 表示 sampled
	return "00-" + tc.TraceID + "-" + tc.SpanID + "-01"
}

// GetTraceContext 从 Echo context 获取追踪上下文
func GetTraceContext(c echo.Context) *observability.TraceContext {
	if tc, ok := c.Get(TraceContextKey).(*observability.TraceContext); ok {
		return tc
	}
	return observability.NewTraceContext()
}

// GetTraceContextFromContext 从 context.Context 获取追踪上下文
func GetTraceContextFromContext(ctx context.Context) *observability.TraceContext {
	return observability.TraceContextFromContext(ctx)
}

// SetWorkspaceID 设置工作空间 ID 到追踪上下文
func SetWorkspaceID(c echo.Context, workspaceID string) {
	if tc := GetTraceContext(c); tc != nil {
		tc.WorkspaceID = workspaceID
		c.Set(TraceContextKey, tc)
		// 同步更新 request context
		req := c.Request()
		ctx := observability.ContextWithTraceContext(req.Context(), tc)
		c.SetRequest(req.WithContext(ctx))
	}
}

// SetExecutionID 设置执行 ID 到追踪上下文
func SetExecutionID(c echo.Context, executionID string) {
	if tc := GetTraceContext(c); tc != nil {
		tc.ExecutionID = executionID
		c.Set(TraceContextKey, tc)
		req := c.Request()
		ctx := observability.ContextWithTraceContext(req.Context(), tc)
		c.SetRequest(req.WithContext(ctx))
	}
}

// SetUserID 设置用户 ID 到追踪上下文
func SetUserID(c echo.Context, userID string) {
	if tc := GetTraceContext(c); tc != nil {
		tc.UserID = userID
		c.Set(TraceContextKey, tc)
		req := c.Request()
		ctx := observability.ContextWithTraceContext(req.Context(), tc)
		c.SetRequest(req.WithContext(ctx))
	}
}
