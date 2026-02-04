package middleware

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

type featureErrorResponse struct {
	Code      string `json:"code"`
	Message   string `json:"message"`
	TraceID   string `json:"trace_id,omitempty"`
	RequestID string `json:"request_id,omitempty"`
}

// FeatureChecker 功能开关检查函数
type FeatureChecker func() bool

// RequireFeature 基于开关控制路由可用性
func RequireFeature(checker FeatureChecker, code, message string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			if checker == nil || checker() {
				return next(c)
			}
			tc := GetTraceContext(c)
			return c.JSON(http.StatusServiceUnavailable, featureErrorResponse{
				Code:      code,
				Message:   message,
				TraceID:   tc.TraceID,
				RequestID: tc.RequestID,
			})
		}
	}
}
