package observability

import (
	"context"
	"time"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.21.0"
	"go.opentelemetry.io/otel/trace"
)

// TracingConfig 追踪配置
type TracingConfig struct {
	// Enabled 是否启用追踪
	Enabled bool `mapstructure:"enabled"`
	// ServiceName 服务名称
	ServiceName string `mapstructure:"service_name"`
	// ServiceVersion 服务版本
	ServiceVersion string `mapstructure:"service_version"`
	// Environment 环境 (development, staging, production)
	Environment string `mapstructure:"environment"`
	// Endpoint OTLP 端点 (例: localhost:4317)
	Endpoint string `mapstructure:"endpoint"`
	// Protocol 协议 (grpc, http)
	Protocol string `mapstructure:"protocol"`
	// Insecure 是否使用不安全连接
	Insecure bool `mapstructure:"insecure"`
	// SampleRate 采样率 (0.0-1.0)
	SampleRate float64 `mapstructure:"sample_rate"`
	// Headers 额外的 HTTP 头 (用于认证)
	Headers map[string]string `mapstructure:"headers"`
}

// DefaultTracingConfig 默认追踪配置
func DefaultTracingConfig() *TracingConfig {
	return &TracingConfig{
		Enabled:        false,
		ServiceName:    "agentflow-server",
		ServiceVersion: "1.0.0",
		Environment:    "development",
		Endpoint:       "localhost:4317",
		Protocol:       "grpc",
		Insecure:       true,
		SampleRate:     1.0,
		Headers:        make(map[string]string),
	}
}

// TracerProvider 追踪提供者包装
type TracerProvider struct {
	provider *sdktrace.TracerProvider
	tracer   trace.Tracer
	config   *TracingConfig
}

// InitTracing 初始化分布式追踪
func InitTracing(ctx context.Context, cfg *TracingConfig) (*TracerProvider, error) {
	if cfg == nil {
		cfg = DefaultTracingConfig()
	}

	if !cfg.Enabled {
		// 返回 noop provider
		return &TracerProvider{
			provider: nil,
			tracer:   otel.Tracer(cfg.ServiceName),
			config:   cfg,
		}, nil
	}

	// 创建 OTLP exporter
	exporter, err := createExporter(ctx, cfg)
	if err != nil {
		return nil, err
	}

	// 创建资源
	res, err := resource.New(ctx,
		resource.WithAttributes(
			semconv.ServiceName(cfg.ServiceName),
			semconv.ServiceVersion(cfg.ServiceVersion),
			semconv.DeploymentEnvironment(cfg.Environment),
			attribute.String("service.namespace", "agentflow"),
		),
		resource.WithHost(),
		resource.WithOS(),
		resource.WithProcess(),
	)
	if err != nil {
		return nil, err
	}

	// 创建采样器
	var sampler sdktrace.Sampler
	if cfg.SampleRate >= 1.0 {
		sampler = sdktrace.AlwaysSample()
	} else if cfg.SampleRate <= 0 {
		sampler = sdktrace.NeverSample()
	} else {
		sampler = sdktrace.TraceIDRatioBased(cfg.SampleRate)
	}

	// 创建 TracerProvider
	tp := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exporter,
			sdktrace.WithBatchTimeout(5*time.Second),
			sdktrace.WithMaxExportBatchSize(512),
		),
		sdktrace.WithResource(res),
		sdktrace.WithSampler(sampler),
	)

	// 设置全局 TracerProvider
	otel.SetTracerProvider(tp)

	// 设置全局 Propagator (W3C Trace Context)
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	))

	return &TracerProvider{
		provider: tp,
		tracer:   tp.Tracer(cfg.ServiceName),
		config:   cfg,
	}, nil
}

// createExporter 创建 OTLP exporter
func createExporter(ctx context.Context, cfg *TracingConfig) (*otlptrace.Exporter, error) {
	switch cfg.Protocol {
	case "http":
		opts := []otlptracehttp.Option{
			otlptracehttp.WithEndpoint(cfg.Endpoint),
		}
		if cfg.Insecure {
			opts = append(opts, otlptracehttp.WithInsecure())
		}
		if len(cfg.Headers) > 0 {
			opts = append(opts, otlptracehttp.WithHeaders(cfg.Headers))
		}
		return otlptracehttp.New(ctx, opts...)
	default: // grpc
		opts := []otlptracegrpc.Option{
			otlptracegrpc.WithEndpoint(cfg.Endpoint),
		}
		if cfg.Insecure {
			opts = append(opts, otlptracegrpc.WithInsecure())
		}
		if len(cfg.Headers) > 0 {
			opts = append(opts, otlptracegrpc.WithHeaders(cfg.Headers))
		}
		return otlptracegrpc.New(ctx, opts...)
	}
}

// Tracer 获取 Tracer
func (tp *TracerProvider) Tracer() trace.Tracer {
	return tp.tracer
}

// Shutdown 关闭追踪提供者
func (tp *TracerProvider) Shutdown(ctx context.Context) error {
	if tp.provider != nil {
		return tp.provider.Shutdown(ctx)
	}
	return nil
}

// IsEnabled 检查追踪是否启用
func (tp *TracerProvider) IsEnabled() bool {
	return tp.config.Enabled && tp.provider != nil
}

// StartSpan 开始一个新的 Span
func (tp *TracerProvider) StartSpan(ctx context.Context, name string, opts ...trace.SpanStartOption) (context.Context, trace.Span) {
	return tp.tracer.Start(ctx, name, opts...)
}

// SpanFromContext 从 context 获取当前 Span
func SpanFromContext(ctx context.Context) trace.Span {
	return trace.SpanFromContext(ctx)
}

// 标准 Span 属性键
const (
	AttrWorkspaceID  = "workspace.id"
	AttrExecutionID  = "execution.id"
	AttrUserID       = "user.id"
	AttrNodeID       = "node.id"
	AttrNodeType     = "node.type"
	AttrWorkflowID   = "workflow.id"
	AttrTriggerType  = "trigger.type"
	AttrStatus       = "status"
	AttrErrorMessage = "error.message"
)

// SetSpanAttributes 设置 Span 属性
func SetSpanAttributes(span trace.Span, tc *TraceContext) {
	if tc == nil {
		return
	}
	attrs := make([]attribute.KeyValue, 0, 8)
	if tc.WorkspaceID != "" {
		attrs = append(attrs, attribute.String(AttrWorkspaceID, tc.WorkspaceID))
	}
	if tc.ExecutionID != "" {
		attrs = append(attrs, attribute.String(AttrExecutionID, tc.ExecutionID))
	}
	if tc.UserID != "" {
		attrs = append(attrs, attribute.String(AttrUserID, tc.UserID))
	}
	span.SetAttributes(attrs...)
}

// SetSpanError 记录 Span 错误
func SetSpanError(span trace.Span, err error) {
	if err != nil {
		span.RecordError(err)
		span.SetAttributes(attribute.String(AttrStatus, "error"))
	}
}

// SetSpanSuccess 标记 Span 成功
func SetSpanSuccess(span trace.Span) {
	span.SetAttributes(attribute.String(AttrStatus, "ok"))
}

// NewSpanContext 从 TraceContext 创建 SpanContext
func NewSpanContext(tc *TraceContext) trace.SpanContext {
	if tc == nil || tc.TraceID == "" {
		return trace.SpanContext{}
	}

	// 解析 trace_id 和 span_id
	traceID, err := trace.TraceIDFromHex(tc.TraceID)
	if err != nil {
		return trace.SpanContext{}
	}

	spanID, err := trace.SpanIDFromHex(tc.SpanID)
	if err != nil {
		return trace.SpanContext{}
	}

	return trace.NewSpanContext(trace.SpanContextConfig{
		TraceID:    traceID,
		SpanID:     spanID,
		TraceFlags: trace.FlagsSampled,
		Remote:     true,
	})
}

// TraceContextFromSpanContext 从 SpanContext 创建 TraceContext
func TraceContextFromSpanContext(sc trace.SpanContext) *TraceContext {
	return &TraceContext{
		TraceID: sc.TraceID().String(),
		SpanID:  sc.SpanID().String(),
	}
}
