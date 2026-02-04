package handler

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/agentflow/server/internal/api/middleware"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// AnalyticsHandler 数据分析处理器
type AnalyticsHandler struct {
	analyticsService service.AnalyticsService
}

// NewAnalyticsHandler 创建数据分析处理器
func NewAnalyticsHandler(analyticsService service.AnalyticsService) *AnalyticsHandler {
	return &AnalyticsHandler{analyticsService: analyticsService}
}

// GetIngestionSpec 获取入湖规范
func (h *AnalyticsHandler) GetIngestionSpec(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	spec, err := h.analyticsService.GetIngestionSpec(c.Request().Context(), uid, workspaceID)
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此工作空间")
		default:
			return errorResponse(c, http.StatusInternalServerError, "SPEC_FAILED", "获取入湖规范失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"spec": spec,
	})
}

// IngestEvents 事件入湖
func (h *AnalyticsHandler) IngestEvents(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	var req service.AnalyticsEventIngestRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	count, err := h.analyticsService.IngestEvents(c.Request().Context(), uid, workspaceID, req)
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限写入事件")
		case service.ErrAnalyticsInvalidInput:
			return errorResponse(c, http.StatusBadRequest, "INVALID_INPUT", "事件入湖参数无效")
		default:
			return errorResponse(c, http.StatusInternalServerError, "INGEST_FAILED", "事件入湖失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"ingested": count,
	})
}

// IngestMetrics 指标入湖
func (h *AnalyticsHandler) IngestMetrics(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	var req service.AnalyticsMetricIngestRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	count, err := h.analyticsService.IngestMetrics(c.Request().Context(), uid, workspaceID, req)
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限写入指标")
		case service.ErrAnalyticsDefinitionNotFound:
			return errorResponse(c, http.StatusNotFound, "DEFINITION_NOT_FOUND", "指标口径未定义")
		case service.ErrAnalyticsInvalidInput:
			return errorResponse(c, http.StatusBadRequest, "INVALID_INPUT", "指标入湖参数无效")
		default:
			return errorResponse(c, http.StatusInternalServerError, "INGEST_FAILED", "指标入湖失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"ingested": count,
	})
}

// ListEvents 查询事件
func (h *AnalyticsHandler) ListEvents(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	page, _ := strconv.Atoi(c.QueryParam("page"))
	pageSize, _ := strconv.Atoi(c.QueryParam("page_size"))
	start, err := parseRFC3339Time(c.QueryParam("start"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_START", "start 参数无效")
	}
	end, err := parseRFC3339Time(c.QueryParam("end"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_END", "end 参数无效")
	}
	orderDesc := strings.ToLower(strings.TrimSpace(c.QueryParam("order"))) == "desc"

	events, total, err := h.analyticsService.ListEvents(c.Request().Context(), uid, workspaceID, service.AnalyticsEventListParams{
		StartTime: start,
		EndTime:   end,
		Page:      page,
		PageSize:  pageSize,
		OrderDesc: orderDesc,
	})
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限查看事件")
		default:
			return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取事件失败")
		}
	}

	return successResponseWithMeta(c, events, map[string]interface{}{
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// ListMetrics 查询指标
func (h *AnalyticsHandler) ListMetrics(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	page, _ := strconv.Atoi(c.QueryParam("page"))
	pageSize, _ := strconv.Atoi(c.QueryParam("page_size"))
	start, err := parseRFC3339Time(c.QueryParam("start"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_START", "start 参数无效")
	}
	end, err := parseRFC3339Time(c.QueryParam("end"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_END", "end 参数无效")
	}
	orderDesc := strings.ToLower(strings.TrimSpace(c.QueryParam("order"))) == "desc"

	var appID *uuid.UUID
	if raw := strings.TrimSpace(c.QueryParam("app_id")); raw != "" {
		parsed, err := uuid.Parse(raw)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_APP_ID", "App ID 无效")
		}
		appID = &parsed
	}
	names := splitCommaList(c.QueryParam("names"))

	metrics, total, err := h.analyticsService.ListMetrics(c.Request().Context(), uid, workspaceID, service.AnalyticsMetricListParams{
		StartTime: start,
		EndTime:   end,
		Page:      page,
		PageSize:  pageSize,
		OrderDesc: orderDesc,
		Names:     names,
		AppID:     appID,
	})
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限查看指标")
		default:
			return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取指标失败")
		}
	}

	return successResponseWithMeta(c, metrics, map[string]interface{}{
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// ListMetricDefinitions 查询指标字典
func (h *AnalyticsHandler) ListMetricDefinitions(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}
	includeInactive := strings.ToLower(strings.TrimSpace(c.QueryParam("include_inactive"))) == "true"

	definitions, err := h.analyticsService.ListMetricDefinitions(c.Request().Context(), uid, workspaceID, includeInactive)
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限查看指标字典")
		default:
			return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取指标字典失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"definitions": definitions,
	})
}

// UpsertMetricDefinition 创建或更新指标字典
func (h *AnalyticsHandler) UpsertMetricDefinition(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	var req service.AnalyticsMetricDefinitionInput
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	definition, err := h.analyticsService.UpsertMetricDefinition(c.Request().Context(), uid, workspaceID, req)
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限维护指标字典")
		case service.ErrAnalyticsInvalidInput:
			return errorResponse(c, http.StatusBadRequest, "INVALID_INPUT", "指标字典参数无效")
		default:
			return errorResponse(c, http.StatusInternalServerError, "UPSERT_FAILED", "更新指标字典失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"definition": definition,
	})
}

// RequestExport 请求导出
func (h *AnalyticsHandler) RequestExport(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	var req service.AnalyticsExportRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	job, err := h.analyticsService.RequestExport(c.Request().Context(), uid, workspaceID, req)
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限导出数据")
		case service.ErrAnalyticsExportDisabled:
			return errorResponse(c, http.StatusServiceUnavailable, "EXPORT_DISABLED", "导出功能未开启")
		case service.ErrAnalyticsInvalidInput:
			return errorResponse(c, http.StatusBadRequest, "INVALID_INPUT", "导出参数无效")
		default:
			return errorResponse(c, http.StatusInternalServerError, "EXPORT_FAILED", "导出任务创建失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"export": job,
	})
}

// GetExport 获取导出状态
func (h *AnalyticsHandler) GetExport(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}
	exportID, err := uuid.Parse(c.Param("exportId"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_EXPORT_ID", "导出任务 ID 无效")
	}

	job, err := h.analyticsService.GetExport(c.Request().Context(), uid, workspaceID, exportID)
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限查看导出任务")
		case service.ErrAnalyticsExportNotFound:
			return errorResponse(c, http.StatusNotFound, "EXPORT_NOT_FOUND", "导出任务不存在")
		default:
			return errorResponse(c, http.StatusInternalServerError, "EXPORT_FETCH_FAILED", "获取导出任务失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"export": job,
	})
}

// DownloadExport 下载导出文件
func (h *AnalyticsHandler) DownloadExport(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}
	exportID, err := uuid.Parse(c.Param("exportId"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_EXPORT_ID", "导出任务 ID 无效")
	}

	download, err := h.analyticsService.DownloadExport(c.Request().Context(), uid, workspaceID, exportID)
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限下载导出文件")
		case service.ErrAnalyticsExportNotFound:
			return errorResponse(c, http.StatusNotFound, "EXPORT_NOT_FOUND", "导出任务不存在")
		case service.ErrAnalyticsExportNotReady:
			return errorResponse(c, http.StatusConflict, "EXPORT_NOT_READY", "导出任务尚未完成")
		case service.ErrAnalyticsExportExpired:
			return errorResponse(c, http.StatusGone, "EXPORT_EXPIRED", "导出文件已过期")
		case service.ErrAnalyticsExportUnavailable:
			return errorResponse(c, http.StatusNotFound, "EXPORT_UNAVAILABLE", "导出文件不可用")
		default:
			return errorResponse(c, http.StatusInternalServerError, "EXPORT_DOWNLOAD_FAILED", "下载导出文件失败")
		}
	}

	return c.Attachment(download.FilePath, download.FileName)
}

// CreateSubscription 创建订阅
func (h *AnalyticsHandler) CreateSubscription(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	var req service.AnalyticsSubscriptionRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	subscription, err := h.analyticsService.CreateSubscription(c.Request().Context(), uid, workspaceID, req)
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限创建订阅")
		case service.ErrAnalyticsInvalidInput:
			return errorResponse(c, http.StatusBadRequest, "INVALID_INPUT", "订阅参数无效")
		default:
			return errorResponse(c, http.StatusInternalServerError, "SUBSCRIBE_FAILED", "创建订阅失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"subscription": subscription,
	})
}

// ListSubscriptions 查询订阅
func (h *AnalyticsHandler) ListSubscriptions(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	subscriptions, err := h.analyticsService.ListSubscriptions(c.Request().Context(), uid, workspaceID)
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限查看订阅")
		default:
			return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取订阅失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"subscriptions": subscriptions,
	})
}

// UpdateSubscription 更新订阅
func (h *AnalyticsHandler) UpdateSubscription(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}
	subscriptionID, err := uuid.Parse(c.Param("subscriptionId"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_SUBSCRIPTION_ID", "订阅 ID 无效")
	}

	var req service.AnalyticsSubscriptionUpdate
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	subscription, err := h.analyticsService.UpdateSubscription(c.Request().Context(), uid, workspaceID, subscriptionID, req)
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限更新订阅")
		case service.ErrAnalyticsSubscriptionNotFound:
			return errorResponse(c, http.StatusNotFound, "SUBSCRIPTION_NOT_FOUND", "订阅不存在")
		case service.ErrAnalyticsInvalidInput:
			return errorResponse(c, http.StatusBadRequest, "INVALID_INPUT", "订阅参数无效")
		default:
			return errorResponse(c, http.StatusInternalServerError, "UPDATE_FAILED", "更新订阅失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"subscription": subscription,
	})
}

// DeleteSubscription 删除订阅
func (h *AnalyticsHandler) DeleteSubscription(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}
	subscriptionID, err := uuid.Parse(c.Param("subscriptionId"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_SUBSCRIPTION_ID", "订阅 ID 无效")
	}

	if err := h.analyticsService.DeleteSubscription(c.Request().Context(), uid, workspaceID, subscriptionID); err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限删除订阅")
		case service.ErrAnalyticsSubscriptionNotFound:
			return errorResponse(c, http.StatusNotFound, "SUBSCRIPTION_NOT_FOUND", "订阅不存在")
		default:
			return errorResponse(c, http.StatusInternalServerError, "DELETE_FAILED", "删除订阅失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"deleted": true,
	})
}

// TriggerSubscription 触发订阅导出
func (h *AnalyticsHandler) TriggerSubscription(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}
	subscriptionID, err := uuid.Parse(c.Param("subscriptionId"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_SUBSCRIPTION_ID", "订阅 ID 无效")
	}

	job, err := h.analyticsService.TriggerSubscription(c.Request().Context(), uid, workspaceID, subscriptionID)
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限触发订阅")
		case service.ErrAnalyticsSubscriptionNotFound:
			return errorResponse(c, http.StatusNotFound, "SUBSCRIPTION_NOT_FOUND", "订阅不存在")
		default:
			return errorResponse(c, http.StatusInternalServerError, "TRIGGER_FAILED", "触发订阅失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"export": job,
	})
}

func splitCommaList(value string) []string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return nil
	}
	parts := strings.Split(trimmed, ",")
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		item := strings.TrimSpace(part)
		if item != "" {
			result = append(result, item)
		}
	}
	return result
}
