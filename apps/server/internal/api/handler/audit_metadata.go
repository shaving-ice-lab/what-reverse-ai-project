package handler

import (
	"strings"

	"github.com/agentflow/server/internal/api/middleware"
	"github.com/agentflow/server/internal/domain/entity"
	"github.com/labstack/echo/v4"
)

func buildAuditMetadata(ctx echo.Context, metadata entity.JSON) entity.JSON {
	result := entity.JSON{}
	for key, value := range metadata {
		result[key] = value
	}

	tc := middleware.GetTraceContext(ctx)
	if tc != nil {
		if tc.TraceID != "" && result["trace_id"] == nil {
			result["trace_id"] = tc.TraceID
		}
		if tc.RequestID != "" && result["request_id"] == nil {
			result["request_id"] = tc.RequestID
		}
		if tc.SpanID != "" && result["span_id"] == nil {
			result["span_id"] = tc.SpanID
		}
		if tc.ParentSpanID != "" && result["parent_span_id"] == nil {
			result["parent_span_id"] = tc.ParentSpanID
		}
	}

	req := ctx.Request()
	if req != nil {
		if method := strings.TrimSpace(req.Method); method != "" && result["http_method"] == nil {
			result["http_method"] = method
		}
		if req.URL != nil {
			path := strings.TrimSpace(req.URL.Path)
			if path != "" && result["http_path"] == nil {
				result["http_path"] = path
			}
		}
		if userAgent := strings.TrimSpace(req.UserAgent()); userAgent != "" && result["user_agent"] == nil {
			result["user_agent"] = userAgent
		}
	}

	if remoteIP := strings.TrimSpace(ctx.RealIP()); remoteIP != "" && result["remote_ip"] == nil {
		result["remote_ip"] = remoteIP
	}

	return result
}
