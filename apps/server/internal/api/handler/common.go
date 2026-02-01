package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

// SuccessResponse 成功响应
type SuccessResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Meta    *Meta       `json:"meta,omitempty"`
}

// ErrorResponse 错误响应
type ErrorResponse struct {
	Success bool       `json:"success"`
	Error   *ErrorInfo `json:"error"`
}

// ErrorInfo 错误信息
type ErrorInfo struct {
	Code    string      `json:"code"`
	Message string      `json:"message"`
	Details interface{} `json:"details,omitempty"`
}

// Meta 分页元数据
type Meta struct {
	Total    int64 `json:"total,omitempty"`
	Page     int   `json:"page,omitempty"`
	PageSize int   `json:"page_size,omitempty"`
}

// successResponse 返回成功响应
func successResponse(c echo.Context, data interface{}) error {
	return c.JSON(http.StatusOK, SuccessResponse{
		Success: true,
		Data:    data,
	})
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
	return c.JSON(http.StatusOK, SuccessResponse{
		Success: true,
		Data:    data,
		Meta:    respMeta,
	})
}

// errorResponse 返回错误响应
func errorResponse(c echo.Context, status int, code, message string) error {
	return c.JSON(status, ErrorResponse{
		Success: false,
		Error: &ErrorInfo{
			Code:    code,
			Message: message,
		},
	})
}

// errorResponseWithDetails 返回带详情的错误响应
func errorResponseWithDetails(c echo.Context, status int, code, message string, details interface{}) error {
	return c.JSON(status, ErrorResponse{
		Success: false,
		Error: &ErrorInfo{
			Code:    code,
			Message: message,
			Details: details,
		},
	})
}
