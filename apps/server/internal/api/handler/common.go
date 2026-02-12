package handler

import (
	"net/http"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/reverseai/server/internal/api/middleware"
	"github.com/reverseai/server/internal/service"
)

// APIResponse 统一响应包裹
type APIResponse struct {
	Code         string      `json:"code"`
	Message      string      `json:"message"`
	Data         interface{} `json:"data,omitempty"`
	Meta         *Meta       `json:"meta,omitempty"`
	TraceID      string      `json:"trace_id,omitempty"`
	RequestID    string      `json:"request_id,omitempty"`
	ErrorCode    string      `json:"error_code,omitempty"`
	ErrorMessage string      `json:"error_message,omitempty"`
	Details      interface{} `json:"details,omitempty"`
}

// SuccessResponse 成功响应（用于文档标注）
type SuccessResponse = APIResponse

// ErrorResponse 错误响应（用于文档标注）
type ErrorResponse = APIResponse

// Meta 分页元数据
type Meta struct {
	Total    int64 `json:"total,omitempty"`
	Page     int   `json:"page,omitempty"`
	PageSize int   `json:"page_size,omitempty"`
}

func buildResponse(c echo.Context, code, message string, data interface{}, meta *Meta) APIResponse {
	tc := middleware.GetTraceContext(c)
	return APIResponse{
		Code:      code,
		Message:   message,
		Data:      data,
		Meta:      meta,
		TraceID:   tc.TraceID,
		RequestID: tc.RequestID,
	}
}

// successResponse 返回成功响应
func successResponse(c echo.Context, data interface{}) error {
	return c.JSON(http.StatusOK, buildResponse(c, "OK", "OK", data, nil))
}

// successResponseWithMeta 返回带分页的成功响应
func successResponseWithMeta(c echo.Context, data interface{}, meta map[string]interface{}) error {
	respMeta := &Meta{}
	if total, ok := meta["total"].(int64); ok {
		respMeta.Total = total
	}
	if page, ok := meta["page"].(int); ok {
		respMeta.Page = page
	}
	if pageSize, ok := meta["page_size"].(int); ok {
		respMeta.PageSize = pageSize
	}
	return c.JSON(http.StatusOK, buildResponse(c, "OK", "OK", data, respMeta))
}

// errorResponse 返回错误响应
func errorResponse(c echo.Context, status int, code, message string) error {
	resp := buildResponse(c, code, message, nil, nil)
	resp.ErrorCode = code
	resp.ErrorMessage = message
	return c.JSON(status, resp)
}

// errorResponseWithDetails 返回带详情的错误响应
func errorResponseWithDetails(c echo.Context, status int, code, message string, details interface{}) error {
	var payload interface{}
	if details != nil {
		payload = map[string]interface{}{
			"details": details,
		}
	}
	resp := buildResponse(c, code, message, payload, nil)
	resp.ErrorCode = code
	resp.ErrorMessage = message
	resp.Details = details
	return c.JSON(status, resp)
}

func buildQuotaExceededDetails(result *service.ConsumeUsageResult) map[string]interface{} {
	if result == nil {
		return nil
	}
	details := map[string]interface{}{
		"exceeded":    result.Exceeded,
		"plan":        result.Plan,
		"quota":       result.Quota,
		"cost_amount": result.CostAmount,
		"currency":    result.Currency,
		"budget":      result.Budget,
	}
	overagePolicy := "block"
	if result.Plan != nil && result.Plan.Policy != nil {
		if value, ok := result.Plan.Policy["overage_policy"].(string); ok && value != "" {
			overagePolicy = value
		}
	}
	details["overage_policy"] = overagePolicy
	if result.Quota != nil {
		resetAt := result.Quota.PeriodEnd
		details["reset_at"] = resetAt
		retryAfter := int(time.Until(resetAt).Seconds())
		if retryAfter < 0 {
			retryAfter = 0
		}
		details["retry_after_seconds"] = retryAfter
	}
	return details
}

func isAsyncRequest(c echo.Context) bool {
	raw := strings.ToLower(strings.TrimSpace(c.QueryParam("async")))
	if raw == "" {
		prefer := strings.ToLower(c.Request().Header.Get("Prefer"))
		return strings.Contains(prefer, "respond-async")
	}
	return raw == "1" || raw == "true" || raw == "yes"
}
