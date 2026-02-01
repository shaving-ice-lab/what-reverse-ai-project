package middleware

import (
	"time"

	"github.com/agentflow/server/internal/pkg/logger"
	"github.com/labstack/echo/v4"
)

// Logger 日志中间件
func Logger(log logger.Logger) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			start := time.Now()
			
			// 处理请求
			err := next(c)
			if err != nil {
				c.Error(err)
			}
			
			// 计算耗时
			latency := time.Since(start)
			
			// 获取请求信息
			req := c.Request()
			res := c.Response()
			
			// 记录日志
			log.Info("HTTP Request",
				"method", req.Method,
				"uri", req.RequestURI,
				"status", res.Status,
				"latency", latency.String(),
				"remote_ip", c.RealIP(),
				"request_id", res.Header().Get(echo.HeaderXRequestID),
			)
			
			return nil
		}
	}
}
