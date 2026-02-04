package middleware

import (
	"github.com/agentflow/server/internal/pkg/observability"
	"github.com/labstack/echo/v4"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/propagation"
	semconv "go.opentelemetry.io/otel/semconv/v1.21.0"
	"go.opentelemetry.io/otel/trace"
)

// Tracing OpenTelemetry 追踪中间件
func Tracing(serviceName string) echo.MiddlewareFunc {
	tracer := otel.Tracer(serviceName)
	propagator := otel.GetTextMapPropagator()

	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			req := c.Request()
			ctx := req.Context()

			// 1. 从请求头提取 trace context (W3C Trace Context propagation)
			ctx = propagator.Extract(ctx, propagation.HeaderCarrier(req.Header))

			// 2. 创建 Span
			spanName := c.Path()
			if spanName == "" {
				spanName = req.URL.Path
			}

			ctx, span := tracer.Start(ctx, spanName,
				trace.WithSpanKind(trace.SpanKindServer),
				trace.WithAttributes(
					semconv.HTTPMethod(req.Method),
					semconv.HTTPTarget(req.URL.Path),
					semconv.HTTPScheme(req.URL.Scheme),
					semconv.NetHostName(req.Host),
					semconv.UserAgentOriginal(req.UserAgent()),
					semconv.NetSockPeerAddr(c.RealIP()),
				),
			)
			defer span.End()

			// 3. 更新 request context
			c.SetRequest(req.WithContext(ctx))

			// 4. 从已有的 TraceContext 设置 Span 属性
			if tc := GetTraceContext(c); tc != nil {
				observability.SetSpanAttributes(span, tc)
			}

			// 5. 将 trace 信息注入响应头
			propagator.Inject(ctx, propagation.HeaderCarrier(c.Response().Header()))

			// 6. 处理请求
			err := next(c)

			// 7. 记录响应状态
			res := c.Response()
			span.SetAttributes(
				semconv.HTTPStatusCode(res.Status),
				attribute.Int64("http.response_content_length", res.Size),
			)

			// 8. 记录错误（如果有）
			if err != nil {
				span.RecordError(err)
				span.SetAttributes(attribute.String("error.message", err.Error()))
			}

			// 9. 根据状态码设置 Span 状态
			if res.Status >= 400 {
				span.SetAttributes(attribute.String("status", "error"))
			} else {
				span.SetAttributes(attribute.String("status", "ok"))
			}

			return err
		}
	}
}

// TracingWithProvider 使用指定的 TracerProvider 创建追踪中间件
func TracingWithProvider(tp *observability.TracerProvider) echo.MiddlewareFunc {
	if tp == nil || !tp.IsEnabled() {
		// 返回空操作中间件
		return func(next echo.HandlerFunc) echo.HandlerFunc {
			return next
		}
	}

	tracer := tp.Tracer()
	propagator := otel.GetTextMapPropagator()

	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			req := c.Request()
			ctx := req.Context()

			// 从请求头提取 trace context
			ctx = propagator.Extract(ctx, propagation.HeaderCarrier(req.Header))

			// 创建 Span
			spanName := c.Path()
			if spanName == "" {
				spanName = req.URL.Path
			}

			ctx, span := tracer.Start(ctx, spanName,
				trace.WithSpanKind(trace.SpanKindServer),
				trace.WithAttributes(
					semconv.HTTPMethod(req.Method),
					semconv.HTTPTarget(req.URL.Path),
					semconv.HTTPScheme(req.URL.Scheme),
					semconv.NetHostName(req.Host),
					semconv.UserAgentOriginal(req.UserAgent()),
					semconv.NetSockPeerAddr(c.RealIP()),
				),
			)
			defer span.End()

			// 更新 request context
			c.SetRequest(req.WithContext(ctx))

			// 设置 Span 属性
			if tc := GetTraceContext(c); tc != nil {
				observability.SetSpanAttributes(span, tc)
			}

			// 注入响应头
			propagator.Inject(ctx, propagation.HeaderCarrier(c.Response().Header()))

			// 处理请求
			err := next(c)

			// 记录响应
			res := c.Response()
			span.SetAttributes(
				semconv.HTTPStatusCode(res.Status),
				attribute.Int64("http.response_content_length", res.Size),
			)

			if err != nil {
				span.RecordError(err)
			}

			if res.Status >= 400 {
				span.SetAttributes(attribute.String("status", "error"))
			} else {
				span.SetAttributes(attribute.String("status", "ok"))
			}

			return err
		}
	}
}

// StartSpan 在当前请求中开始一个子 Span
func StartSpan(c echo.Context, name string, opts ...trace.SpanStartOption) (echo.Context, trace.Span) {
	req := c.Request()
	ctx, span := otel.Tracer("agentflow-server").Start(req.Context(), name, opts...)
	c.SetRequest(req.WithContext(ctx))

	// 同步更新 TraceContext
	if tc := GetTraceContext(c); tc != nil {
		spanCtx := span.SpanContext()
		tc.SpanID = spanCtx.SpanID().String()
		c.Set(TraceContextKey, tc)
	}

	return c, span
}

// GetCurrentSpan 获取当前 Span
func GetCurrentSpan(c echo.Context) trace.Span {
	return trace.SpanFromContext(c.Request().Context())
}

// AddSpanEvent 向当前 Span 添加事件
func AddSpanEvent(c echo.Context, name string, attrs ...attribute.KeyValue) {
	span := GetCurrentSpan(c)
	span.AddEvent(name, trace.WithAttributes(attrs...))
}

// SetSpanAttribute 设置当前 Span 的属性
func SetSpanAttribute(c echo.Context, key string, value interface{}) {
	span := GetCurrentSpan(c)
	var attr attribute.KeyValue
	switch v := value.(type) {
	case string:
		attr = attribute.String(key, v)
	case int:
		attr = attribute.Int(key, v)
	case int64:
		attr = attribute.Int64(key, v)
	case float64:
		attr = attribute.Float64(key, v)
	case bool:
		attr = attribute.Bool(key, v)
	default:
		return
	}
	span.SetAttributes(attr)
}
