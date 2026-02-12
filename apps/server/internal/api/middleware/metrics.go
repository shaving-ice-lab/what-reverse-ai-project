package middleware

import (
	"strconv"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/reverseai/server/internal/pkg/observability"
)

// Metrics Prometheus 指标收集中间件
func Metrics() echo.MiddlewareFunc {
	metrics := observability.GetMetricsCollector()

	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// 跳过 /metrics 端点本身
			if c.Path() == "/metrics" {
				return next(c)
			}

			start := time.Now()

			// 增加正在处理的请求数
			metrics.HTTPRequestsInFlight.Inc()
			defer metrics.HTTPRequestsInFlight.Dec()

			// 处理请求
			err := next(c)
			if err != nil {
				c.Error(err)
			}

			// 计算耗时
			duration := time.Since(start).Seconds()

			// 获取请求信息
			req := c.Request()
			res := c.Response()

			// 使用路由模板而非实际路径（避免高基数）
			path := c.Path()
			if path == "" {
				path = req.URL.Path
			}

			// 记录指标
			metrics.RecordHTTPRequest(
				req.Method,
				normalizePath(path),
				res.Status,
				duration,
				res.Size,
			)

			return nil
		}
	}
}

// MetricsHandler 返回 Prometheus metrics 端点处理器
func MetricsHandler() echo.HandlerFunc {
	handler := promhttp.Handler()
	return func(c echo.Context) error {
		handler.ServeHTTP(c.Response(), c.Request())
		return nil
	}
}

// normalizePath 规范化路径（避免高基数标签）
func normalizePath(path string) string {
	// 如果路径为空或 /，直接返回
	if path == "" || path == "/" {
		return "/"
	}

	// 简单的路径规范化：
	// - 保留前两级路径段
	// - 将 UUID/数字 ID 替换为占位符
	segments := splitPath(path)
	if len(segments) == 0 {
		return "/"
	}

	normalized := make([]string, 0, len(segments))
	for i, seg := range segments {
		if i < 3 { // 保留前三级
			// 检查是否是 UUID 或纯数字
			if isUUID(seg) || isNumericID(seg) {
				normalized = append(normalized, ":id")
			} else {
				normalized = append(normalized, seg)
			}
		} else {
			normalized = append(normalized, "...")
			break
		}
	}

	return "/" + joinPath(normalized)
}

// splitPath 分割路径
func splitPath(path string) []string {
	var segments []string
	start := 0
	for i := 0; i < len(path); i++ {
		if path[i] == '/' {
			if i > start {
				segments = append(segments, path[start:i])
			}
			start = i + 1
		}
	}
	if start < len(path) {
		segments = append(segments, path[start:])
	}
	return segments
}

// joinPath 连接路径
func joinPath(segments []string) string {
	if len(segments) == 0 {
		return ""
	}
	result := segments[0]
	for i := 1; i < len(segments); i++ {
		result += "/" + segments[i]
	}
	return result
}

// isUUID 检查是否是 UUID 格式
func isUUID(s string) bool {
	// UUID 格式: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (36 chars)
	// 或 32 chars 不带连字符
	if len(s) == 36 {
		for i, c := range s {
			if i == 8 || i == 13 || i == 18 || i == 23 {
				if c != '-' {
					return false
				}
			} else if !isHexChar(byte(c)) {
				return false
			}
		}
		return true
	}
	if len(s) == 32 {
		for _, c := range s {
			if !isHexChar(byte(c)) {
				return false
			}
		}
		return true
	}
	return false
}

// isNumericID 检查是否是纯数字 ID
func isNumericID(s string) bool {
	if len(s) == 0 {
		return false
	}
	_, err := strconv.ParseInt(s, 10, 64)
	return err == nil
}

// isHexChar 检查是否是十六进制字符
func isHexChar(c byte) bool {
	return (c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F')
}
