package observability

import (
	"sync"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

// MetricsCollector Prometheus 指标收集器
type MetricsCollector struct {
	// HTTP 请求指标
	HTTPRequestsTotal    *prometheus.CounterVec
	HTTPRequestDuration  *prometheus.HistogramVec
	HTTPRequestsInFlight prometheus.Gauge
	HTTPResponseSize     *prometheus.HistogramVec

	// 工作流执行指标
	ExecutionTotal       *prometheus.CounterVec
	ExecutionDuration    *prometheus.HistogramVec
	ExecutionSuccessRate *prometheus.GaugeVec
	ExecutionsInProgress *prometheus.GaugeVec

	// 节点执行指标
	NodeExecutionTotal    *prometheus.CounterVec
	NodeExecutionDuration *prometheus.HistogramVec

	// 数据库操作指标
	DBQueryDuration     *prometheus.HistogramVec
	DBConnectionsActive prometheus.Gauge

	// LLM 调用指标
	LLMRequestsTotal   *prometheus.CounterVec
	LLMRequestDuration *prometheus.HistogramVec
	LLMTokensUsed      *prometheus.CounterVec
	LLMCost            *prometheus.CounterVec

	// 域名操作指标
	DomainVerifyTotal    *prometheus.CounterVec
	DomainVerifyDuration *prometheus.HistogramVec
	CertIssueTotal       *prometheus.CounterVec
	CertIssueDuration    *prometheus.HistogramVec

	// 运行时指标
	RuntimeRequestsTotal   *prometheus.CounterVec
	RuntimeRequestDuration *prometheus.HistogramVec
	SessionsActive         *prometheus.GaugeVec

	// WebSocket 指标
	WebSocketConnections prometheus.Gauge
	WebSocketMessages    *prometheus.CounterVec

	// 系统资源指标
	GoRoutines prometheus.Gauge
	MemoryUsed prometheus.Gauge

	// 运维与发布指标
	OpsAlertTestTotal *prometheus.CounterVec
}

var (
	defaultCollector *MetricsCollector
	collectorOnce    sync.Once
)

// GetMetricsCollector 获取全局指标收集器实例（单例）
func GetMetricsCollector() *MetricsCollector {
	collectorOnce.Do(func() {
		defaultCollector = NewMetricsCollector()
	})
	return defaultCollector
}

// NewMetricsCollector 创建新的指标收集器
func NewMetricsCollector() *MetricsCollector {
	return &MetricsCollector{
		// ===== HTTP 请求指标 =====
		HTTPRequestsTotal: promauto.NewCounterVec(
			prometheus.CounterOpts{
				Namespace: "reverseai",
				Subsystem: "http",
				Name:      "requests_total",
				Help:      "Total number of HTTP requests",
			},
			[]string{"method", "path", "status"},
		),
		HTTPRequestDuration: promauto.NewHistogramVec(
			prometheus.HistogramOpts{
				Namespace: "reverseai",
				Subsystem: "http",
				Name:      "request_duration_seconds",
				Help:      "HTTP request latency in seconds",
				Buckets:   []float64{.005, .01, .025, .05, .1, .25, .5, 1, 2.5, 5, 10},
			},
			[]string{"method", "path", "status"},
		),
		HTTPRequestsInFlight: promauto.NewGauge(
			prometheus.GaugeOpts{
				Namespace: "reverseai",
				Subsystem: "http",
				Name:      "requests_in_flight",
				Help:      "Number of HTTP requests currently being processed",
			},
		),
		HTTPResponseSize: promauto.NewHistogramVec(
			prometheus.HistogramOpts{
				Namespace: "reverseai",
				Subsystem: "http",
				Name:      "response_size_bytes",
				Help:      "HTTP response size in bytes",
				Buckets:   prometheus.ExponentialBuckets(100, 10, 7), // 100B to 100MB
			},
			[]string{"method", "path"},
		),

		// ===== 执行指标 =====
		ExecutionTotal: promauto.NewCounterVec(
			prometheus.CounterOpts{
				Namespace: "reverseai",
				Subsystem: "execution",
				Name:      "total",
				Help:      "Total number of task executions",
			},
			[]string{"workspace_id", "status", "trigger_type"},
		),
		ExecutionDuration: promauto.NewHistogramVec(
			prometheus.HistogramOpts{
				Namespace: "reverseai",
				Subsystem: "execution",
				Name:      "duration_seconds",
				Help:      "Task execution duration in seconds",
				Buckets:   []float64{.1, .5, 1, 2.5, 5, 10, 30, 60, 120, 300},
			},
			[]string{"workspace_id", "status"},
		),
		ExecutionSuccessRate: promauto.NewGaugeVec(
			prometheus.GaugeOpts{
				Namespace: "reverseai",
				Subsystem: "execution",
				Name:      "success_rate",
				Help:      "Task execution success rate (0-1)",
			},
			[]string{"workspace_id"},
		),
		ExecutionsInProgress: promauto.NewGaugeVec(
			prometheus.GaugeOpts{
				Namespace: "reverseai",
				Subsystem: "execution",
				Name:      "in_progress",
				Help:      "Number of task executions currently in progress",
			},
			[]string{"workspace_id"},
		),

		// ===== 节点执行指标 =====
		NodeExecutionTotal: promauto.NewCounterVec(
			prometheus.CounterOpts{
				Namespace: "reverseai",
				Subsystem: "node",
				Name:      "execution_total",
				Help:      "Total number of node executions",
			},
			[]string{"node_type", "status"},
		),
		NodeExecutionDuration: promauto.NewHistogramVec(
			prometheus.HistogramOpts{
				Namespace: "reverseai",
				Subsystem: "node",
				Name:      "execution_duration_seconds",
				Help:      "Node execution duration in seconds",
				Buckets:   []float64{.01, .05, .1, .25, .5, 1, 2.5, 5, 10, 30},
			},
			[]string{"node_type"},
		),

		// ===== 数据库操作指标 =====
		DBQueryDuration: promauto.NewHistogramVec(
			prometheus.HistogramOpts{
				Namespace: "reverseai",
				Subsystem: "db",
				Name:      "query_duration_seconds",
				Help:      "Database query duration in seconds",
				Buckets:   []float64{.001, .005, .01, .025, .05, .1, .25, .5, 1, 2.5},
			},
			[]string{"operation"},
		),
		DBConnectionsActive: promauto.NewGauge(
			prometheus.GaugeOpts{
				Namespace: "reverseai",
				Subsystem: "db",
				Name:      "connections_active",
				Help:      "Number of active database connections",
			},
		),

		// ===== LLM 调用指标 =====
		LLMRequestsTotal: promauto.NewCounterVec(
			prometheus.CounterOpts{
				Namespace: "reverseai",
				Subsystem: "llm",
				Name:      "requests_total",
				Help:      "Total number of LLM API requests",
			},
			[]string{"provider", "model", "status"},
		),
		LLMRequestDuration: promauto.NewHistogramVec(
			prometheus.HistogramOpts{
				Namespace: "reverseai",
				Subsystem: "llm",
				Name:      "request_duration_seconds",
				Help:      "LLM API request duration in seconds",
				Buckets:   []float64{.5, 1, 2.5, 5, 10, 30, 60, 120},
			},
			[]string{"provider", "model"},
		),
		LLMTokensUsed: promauto.NewCounterVec(
			prometheus.CounterOpts{
				Namespace: "reverseai",
				Subsystem: "llm",
				Name:      "tokens_used_total",
				Help:      "Total number of LLM tokens used",
			},
			[]string{"provider", "model", "token_type"}, // token_type: prompt, completion
		),
		LLMCost: promauto.NewCounterVec(
			prometheus.CounterOpts{
				Namespace: "reverseai",
				Subsystem: "llm",
				Name:      "cost_usd_total",
				Help:      "Total LLM cost in USD",
			},
			[]string{"provider", "model"},
		),

		// ===== 域名操作指标 =====
		DomainVerifyTotal: promauto.NewCounterVec(
			prometheus.CounterOpts{
				Namespace: "reverseai",
				Subsystem: "domain",
				Name:      "verify_total",
				Help:      "Total number of domain verification attempts",
			},
			[]string{"status"},
		),
		DomainVerifyDuration: promauto.NewHistogramVec(
			prometheus.HistogramOpts{
				Namespace: "reverseai",
				Subsystem: "domain",
				Name:      "verify_duration_seconds",
				Help:      "Domain verification duration in seconds",
				Buckets:   []float64{.5, 1, 2.5, 5, 10, 30},
			},
			[]string{},
		),
		CertIssueTotal: promauto.NewCounterVec(
			prometheus.CounterOpts{
				Namespace: "reverseai",
				Subsystem: "domain",
				Name:      "cert_issue_total",
				Help:      "Total number of certificate issue attempts",
			},
			[]string{"status"},
		),
		CertIssueDuration: promauto.NewHistogramVec(
			prometheus.HistogramOpts{
				Namespace: "reverseai",
				Subsystem: "domain",
				Name:      "cert_issue_duration_seconds",
				Help:      "Certificate issue duration in seconds",
				Buckets:   []float64{1, 5, 10, 30, 60, 120, 300},
			},
			[]string{},
		),

		// ===== 运行时指标 =====
		RuntimeRequestsTotal: promauto.NewCounterVec(
			prometheus.CounterOpts{
				Namespace: "reverseai",
				Subsystem: "runtime",
				Name:      "requests_total",
				Help:      "Total number of runtime (public app) requests",
			},
			[]string{"workspace_id", "status"},
		),
		RuntimeRequestDuration: promauto.NewHistogramVec(
			prometheus.HistogramOpts{
				Namespace: "reverseai",
				Subsystem: "runtime",
				Name:      "request_duration_seconds",
				Help:      "Runtime request duration in seconds",
				Buckets:   []float64{.1, .5, 1, 2.5, 5, 10, 30, 60},
			},
			[]string{"workspace_id"},
		),
		SessionsActive: promauto.NewGaugeVec(
			prometheus.GaugeOpts{
				Namespace: "reverseai",
				Subsystem: "runtime",
				Name:      "sessions_active",
				Help:      "Number of active runtime sessions",
			},
			[]string{"workspace_id"},
		),

		// ===== WebSocket 指标 =====
		WebSocketConnections: promauto.NewGauge(
			prometheus.GaugeOpts{
				Namespace: "reverseai",
				Subsystem: "websocket",
				Name:      "connections",
				Help:      "Number of active WebSocket connections",
			},
		),
		WebSocketMessages: promauto.NewCounterVec(
			prometheus.CounterOpts{
				Namespace: "reverseai",
				Subsystem: "websocket",
				Name:      "messages_total",
				Help:      "Total number of WebSocket messages",
			},
			[]string{"direction", "type"}, // direction: inbound, outbound
		),

		// ===== 系统资源指标 =====
		GoRoutines: promauto.NewGauge(
			prometheus.GaugeOpts{
				Namespace: "reverseai",
				Subsystem: "system",
				Name:      "goroutines",
				Help:      "Number of goroutines",
			},
		),
		MemoryUsed: promauto.NewGauge(
			prometheus.GaugeOpts{
				Namespace: "reverseai",
				Subsystem: "system",
				Name:      "memory_used_bytes",
				Help:      "Memory used in bytes",
			},
		),
		OpsAlertTestTotal: promauto.NewCounterVec(
			prometheus.CounterOpts{
				Namespace: "reverseai",
				Subsystem: "ops",
				Name:      "alert_test_total",
				Help:      "Total number of ops alert tests triggered",
			},
			[]string{"severity"},
		),
	}
}

// ===== 便捷方法 =====

// RecordHTTPRequest 记录 HTTP 请求指标
func (m *MetricsCollector) RecordHTTPRequest(method, path string, statusCode int, durationSeconds float64, responseSize int64) {
	status := statusCodeToLabel(statusCode)
	m.HTTPRequestsTotal.WithLabelValues(method, path, status).Inc()
	m.HTTPRequestDuration.WithLabelValues(method, path, status).Observe(durationSeconds)
	m.HTTPResponseSize.WithLabelValues(method, path).Observe(float64(responseSize))
}

// RecordExecution 记录工作流执行指标
func (m *MetricsCollector) RecordExecution(workspaceID, status, triggerType string, durationSeconds float64) {
	m.ExecutionTotal.WithLabelValues(workspaceID, status, triggerType).Inc()
	m.ExecutionDuration.WithLabelValues(workspaceID, status).Observe(durationSeconds)
}

// RecordNodeExecution 记录节点执行指标
func (m *MetricsCollector) RecordNodeExecution(nodeType, status string, durationSeconds float64) {
	m.NodeExecutionTotal.WithLabelValues(nodeType, status).Inc()
	m.NodeExecutionDuration.WithLabelValues(nodeType).Observe(durationSeconds)
}

// RecordLLMRequest 记录 LLM 请求指标
func (m *MetricsCollector) RecordLLMRequest(provider, model, status string, durationSeconds float64, promptTokens, completionTokens int64, costUSD float64) {
	m.LLMRequestsTotal.WithLabelValues(provider, model, status).Inc()
	m.LLMRequestDuration.WithLabelValues(provider, model).Observe(durationSeconds)
	m.LLMTokensUsed.WithLabelValues(provider, model, "prompt").Add(float64(promptTokens))
	m.LLMTokensUsed.WithLabelValues(provider, model, "completion").Add(float64(completionTokens))
	m.LLMCost.WithLabelValues(provider, model).Add(costUSD)
}

// RecordRuntimeRequest 记录运行时请求指标
func (m *MetricsCollector) RecordRuntimeRequest(workspaceID, status string, durationSeconds float64) {
	m.RuntimeRequestsTotal.WithLabelValues(workspaceID, status).Inc()
	m.RuntimeRequestDuration.WithLabelValues(workspaceID).Observe(durationSeconds)
}

// statusCodeToLabel 将状态码转换为标签
func statusCodeToLabel(code int) string {
	switch {
	case code >= 200 && code < 300:
		return "2xx"
	case code >= 300 && code < 400:
		return "3xx"
	case code >= 400 && code < 500:
		return "4xx"
	case code >= 500:
		return "5xx"
	default:
		return "unknown"
	}
}
