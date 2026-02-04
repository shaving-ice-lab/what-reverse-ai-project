package middleware

import (
	"strings"

	"github.com/labstack/echo/v4"
)

// GetIdempotencyKey 获取请求幂等键
func GetIdempotencyKey(c echo.Context) string {
	key := strings.TrimSpace(c.Request().Header.Get(IdempotencyKeyHeader))
	if key == "" {
		key = strings.TrimSpace(c.Request().Header.Get(RequestIDHeader))
	}
	return key
}
