package idempotency

import (
	"context"
	"strings"
)

type contextKey string

const keyContextKey contextKey = "idempotency_key"

// WithKey 在上下文中设置幂等键
func WithKey(ctx context.Context, key string) context.Context {
	trimmed := strings.TrimSpace(key)
	if trimmed == "" {
		return ctx
	}
	return context.WithValue(ctx, keyContextKey, trimmed)
}

// KeyFromContext 从上下文读取幂等键
func KeyFromContext(ctx context.Context) string {
	if ctx == nil {
		return ""
	}
	value := ctx.Value(keyContextKey)
	if value == nil {
		return ""
	}
	if key, ok := value.(string); ok {
		return strings.TrimSpace(key)
	}
	return ""
}
