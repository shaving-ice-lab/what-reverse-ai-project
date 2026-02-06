package handler

import (
	"bytes"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"time"

	"github.com/agentflow/server/internal/api/middleware"
	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/phpdave11/gofpdf"
)

type BillingHandler struct {
	billingService service.BillingService
}

func NewBillingHandler(billingService service.BillingService) *BillingHandler {
	return &BillingHandler{billingService: billingService}
}

type ConsumeUsageRequest struct {
	Usage map[string]float64 `json:"usage"`
}

type EstimateCostRequest struct {
	Usage map[string]float64 `json:"usage"`
}

type UpdateBudgetRequest struct {
	MonthlyBudget     *float64  `json:"monthly_budget"`
	Currency          *string   `json:"currency"`
	Thresholds        []float64 `json:"thresholds"`
	SpendLimit        *float64  `json:"spend_limit"`
	SpendLimitEnabled *bool     `json:"spend_limit_enabled"`
}

type UpdateInvoiceSettingsRequest struct {
	TaxRate        *float64 `json:"tax_rate"`
	DiscountRate   *float64 `json:"discount_rate"`
	DiscountAmount *float64 `json:"discount_amount"`
}

type SyncInvoicePaymentRequest struct {
	Status         string  `json:"status"`
	PaymentChannel *string `json:"payment_channel,omitempty"`
	TransactionID  *string `json:"transaction_id,omitempty"`
	PaidAt         *string `json:"paid_at,omitempty"`
}

// ListDimensions 获取计费维度定义
func (h *BillingHandler) ListDimensions(c echo.Context) error {
	dimensions := h.billingService.ListDimensions(c.Request().Context())
	return successResponse(c, map[string]interface{}{
		"dimensions": dimensions,
	})
}

// ListPlans 获取套餐列表
func (h *BillingHandler) ListPlans(c echo.Context) error {
	plans, err := h.billingService.ListPlans(c.Request().Context())
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取套餐列表失败")
	}
	return successResponse(c, map[string]interface{}{
		"plans": plans,
	})
}

// QuotaItem 配额项结构
type QuotaItem struct {
	Used  float64 `json:"used"`
	Limit float64 `json:"limit"`
}

// GetWorkspaceQuota 获取 Workspace 配额
func (h *BillingHandler) GetWorkspaceQuota(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	quota, plan, err := h.billingService.GetWorkspaceQuota(c.Request().Context(), uid, workspaceID)
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此工作空间")
		default:
			return errorResponse(c, http.StatusInternalServerError, "GET_FAILED", "获取配额失败")
		}
	}

	// 转换为前端期望的格式
	formattedQuota := formatQuotaForFrontendEntity(quota, plan)

	return successResponse(c, map[string]interface{}{
		"plan":       plan.Code,
		"requests":   formattedQuota["requests"],
		"tokens":     formattedQuota["tokens"],
		"storage":    formattedQuota["storage"],
		"bandwidth":  formattedQuota["bandwidth"],
		"dimensions": h.billingService.ListDimensions(c.Request().Context()),
	})
}

// formatQuotaForFrontendEntity 将 quota entity 数据转换为前端期望的格式
func formatQuotaForFrontendEntity(quota *entity.WorkspaceQuota, plan *entity.BillingPlan) map[string]QuotaItem {
	if quota == nil {
		return map[string]QuotaItem{
			"requests":  {Used: 0, Limit: 0},
			"tokens":    {Used: 0, Limit: 0},
			"storage":   {Used: 0, Limit: 0},
			"bandwidth": {Used: 0, Limit: 0},
		}
	}

	// 解析 limits 和 usage
	limits := parseEntityJSONToMap(quota.Limits)
	usage := parseEntityJSONToMap(quota.Usage)

	// 获取 plan 中的默认限制
	planLimits := map[string]float64{}
	if plan != nil {
		planLimits = parseEntityJSONToMap(plan.QuotaLimits)
	}

	// 辅助函数：获取限制值
	getLimit := func(key string) float64 {
		if v, ok := limits[key]; ok && v > 0 {
			return v
		}
		if v, ok := planLimits[key]; ok {
			return v
		}
		return 0
	}

	// 辅助函数：获取使用值
	getUsage := func(key string) float64 {
		if v, ok := usage[key]; ok {
			return v
		}
		return 0
	}

	return map[string]QuotaItem{
		"requests": {
			Used:  getUsage("requests"),
			Limit: getLimit("requests"),
		},
		"tokens": {
			Used:  getUsage("tokens"),
			Limit: getLimit("tokens"),
		},
		"storage": {
			Used:  getUsage("storage"),
			Limit: getLimit("storage"),
		},
		"bandwidth": {
			Used:  getUsage("bandwidth"),
			Limit: getLimit("bandwidth"),
		},
	}
}

// parseEntityJSONToMap 解析 entity.JSON 到 map[string]float64
func parseEntityJSONToMap(data entity.JSON) map[string]float64 {
	result := make(map[string]float64)
	if data == nil {
		return result
	}
	for key, val := range data {
		switch num := val.(type) {
		case float64:
			result[key] = num
		case float32:
			result[key] = float64(num)
		case int:
			result[key] = float64(num)
		case int64:
			result[key] = float64(num)
		case int32:
			result[key] = float64(num)
		case uint:
			result[key] = float64(num)
		case uint64:
			result[key] = float64(num)
		case uint32:
			result[key] = float64(num)
		}
	}
	return result
}

// ConsumeUsage 记录用量并扣减
func (h *BillingHandler) ConsumeUsage(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	var req ConsumeUsageRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	result, err := h.billingService.ConsumeUsage(c.Request().Context(), uid, workspaceID, service.ConsumeUsageRequest{
		Usage: req.Usage,
	})
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此工作空间")
		case service.ErrBillingInvalidUsage, service.ErrBillingInvalidDimension:
			return errorResponse(c, http.StatusBadRequest, "INVALID_USAGE", "用量数据无效")
		default:
			return errorResponse(c, http.StatusInternalServerError, "CONSUME_FAILED", "扣减失败")
		}
	}

	if !result.Allowed {
		return errorResponseWithDetails(c, http.StatusForbidden, "QUOTA_EXCEEDED", "配额已超限", buildQuotaExceededDetails(result))
	}

	return successResponse(c, map[string]interface{}{
		"plan":        result.Plan,
		"quota":       result.Quota,
		"exceeded":    result.Exceeded,
		"cost_amount": result.CostAmount,
		"currency":    result.Currency,
		"budget":      result.Budget,
	})
}

// GetWorkspaceUsageStats 获取 Workspace 用量统计
func (h *BillingHandler) GetWorkspaceUsageStats(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	var periodStart time.Time
	var periodEnd time.Time
	periodStartParam := c.QueryParam("period_start")
	periodEndParam := c.QueryParam("period_end")
	if periodStartParam != "" {
		parsed, err := time.Parse("2006-01-02", periodStartParam)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_PERIOD", "开始日期无效")
		}
		periodStart = parsed
	}
	if periodEndParam != "" {
		parsed, err := time.Parse("2006-01-02", periodEndParam)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_PERIOD", "结束日期无效")
		}
		periodEnd = parsed
	}

	if periodStart.IsZero() || periodEnd.IsZero() {
		quota, _, err := h.billingService.GetWorkspaceQuota(c.Request().Context(), uid, workspaceID)
		if err != nil {
			switch err {
			case service.ErrWorkspaceNotFound:
				return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
			case service.ErrWorkspaceUnauthorized:
				return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此工作空间")
			default:
				return errorResponse(c, http.StatusInternalServerError, "GET_FAILED", "获取配额失败")
			}
		}
		if periodStart.IsZero() {
			periodStart = quota.PeriodStart
		}
		if periodEnd.IsZero() {
			periodEnd = quota.PeriodEnd
		}
	}

	stats, err := h.billingService.GetWorkspaceUsageStats(c.Request().Context(), uid, workspaceID, periodStart, periodEnd)
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此工作空间")
		default:
			return errorResponse(c, http.StatusInternalServerError, "GET_FAILED", "获取 Workspace 用量失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"period_start": periodStart.Format("2006-01-02"),
		"period_end":   periodEnd.Format("2006-01-02"),
		"stats":        stats,
	})
}

// GetCostModel 获取成本模型
func (h *BillingHandler) GetCostModel(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	model, err := h.billingService.GetCostModel(c.Request().Context(), uid, workspaceID)
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此工作空间")
		default:
			return errorResponse(c, http.StatusInternalServerError, "GET_FAILED", "获取成本模型失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"model": model,
	})
}

// GetCostSummary 获取成本汇总
func (h *BillingHandler) GetCostSummary(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	var periodStart time.Time
	var periodEnd time.Time
	periodStartParam := c.QueryParam("period_start")
	periodEndParam := c.QueryParam("period_end")
	if periodStartParam != "" {
		parsed, err := time.Parse("2006-01-02", periodStartParam)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_PERIOD", "开始日期无效")
		}
		periodStart = parsed
	}
	if periodEndParam != "" {
		parsed, err := time.Parse("2006-01-02", periodEndParam)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_PERIOD", "结束日期无效")
		}
		periodEnd = parsed
	}

	if periodStart.IsZero() || periodEnd.IsZero() {
		quota, _, err := h.billingService.GetWorkspaceQuota(c.Request().Context(), uid, workspaceID)
		if err != nil {
			switch err {
			case service.ErrWorkspaceNotFound:
				return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
			case service.ErrWorkspaceUnauthorized:
				return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此工作空间")
			default:
				return errorResponse(c, http.StatusInternalServerError, "GET_FAILED", "获取配额失败")
			}
		}
		if periodStart.IsZero() {
			periodStart = quota.PeriodStart
		}
		if periodEnd.IsZero() {
			periodEnd = quota.PeriodEnd
		}
	}

	summary, err := h.billingService.GetCostSummary(c.Request().Context(), uid, workspaceID, periodStart, periodEnd)
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此工作空间")
		default:
			return errorResponse(c, http.StatusInternalServerError, "GET_FAILED", "获取成本汇总失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"period_start": periodStart.Format("2006-01-02"),
		"period_end":   periodEnd.Format("2006-01-02"),
		"summary":      summary,
	})
}

// EstimateCost 估算成本
func (h *BillingHandler) EstimateCost(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	var req EstimateCostRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	estimate, err := h.billingService.EstimateCost(c.Request().Context(), uid, workspaceID, req.Usage)
	if err != nil {
		switch err {
		case service.ErrBillingInvalidUsage, service.ErrBillingInvalidDimension:
			return errorResponse(c, http.StatusBadRequest, "INVALID_USAGE", "用量数据无效")
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此工作空间")
		default:
			return errorResponse(c, http.StatusInternalServerError, "ESTIMATE_FAILED", "成本估算失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"estimate": estimate,
	})
}

// GetBudgetSettings 获取预算设置
func (h *BillingHandler) GetBudgetSettings(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	budget, err := h.billingService.GetBudgetSettings(c.Request().Context(), uid, workspaceID)
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此工作空间")
		default:
			return errorResponse(c, http.StatusInternalServerError, "GET_FAILED", "获取预算设置失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"budget": budget,
	})
}

// UpdateBudgetSettings 更新预算设置
func (h *BillingHandler) UpdateBudgetSettings(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	var req UpdateBudgetRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	budget, err := h.billingService.UpdateBudgetSettings(c.Request().Context(), uid, workspaceID, service.BudgetSettingsUpdate{
		MonthlyBudget:     req.MonthlyBudget,
		Currency:          req.Currency,
		Thresholds:        req.Thresholds,
		SpendLimit:        req.SpendLimit,
		SpendLimitEnabled: req.SpendLimitEnabled,
	})
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此工作空间")
		case service.ErrBillingBudgetInvalid:
			return errorResponse(c, http.StatusBadRequest, "INVALID_BUDGET", "预算设置无效")
		default:
			return errorResponse(c, http.StatusInternalServerError, "UPDATE_FAILED", "更新预算设置失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"budget": budget,
	})
}

// GetInvoiceSettings 获取发票设置
func (h *BillingHandler) GetInvoiceSettings(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	settings, err := h.billingService.GetInvoiceSettings(c.Request().Context(), uid, workspaceID)
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限查看发票设置")
		default:
			return errorResponse(c, http.StatusInternalServerError, "GET_FAILED", "获取发票设置失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"settings": settings,
	})
}

// UpdateInvoiceSettings 更新发票设置
func (h *BillingHandler) UpdateInvoiceSettings(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	var req UpdateInvoiceSettingsRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	settings, err := h.billingService.UpdateInvoiceSettings(c.Request().Context(), uid, workspaceID, service.InvoiceSettingsUpdate{
		TaxRate:        req.TaxRate,
		DiscountRate:   req.DiscountRate,
		DiscountAmount: req.DiscountAmount,
	})
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限更新发票设置")
		case service.ErrBillingInvoiceInvalid:
			return errorResponse(c, http.StatusBadRequest, "INVALID_SETTINGS", "发票设置无效")
		default:
			return errorResponse(c, http.StatusInternalServerError, "UPDATE_FAILED", "更新发票设置失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"settings": settings,
	})
}

// ListInvoices 获取账单列表
func (h *BillingHandler) ListInvoices(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	invoices, err := h.billingService.ListInvoices(c.Request().Context(), uid, workspaceID, limit)
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限查看账单")
		default:
			return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取账单失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"invoices": invoices,
		"total":    len(invoices),
	})
}

// GetInvoiceDetail 获取账单详情
func (h *BillingHandler) GetInvoiceDetail(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	invoiceID, err := uuid.Parse(c.Param("invoiceId"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_INVOICE_ID", "账单 ID 无效")
	}

	invoice, err := h.billingService.GetInvoiceDetail(c.Request().Context(), uid, workspaceID, invoiceID)
	if err != nil {
		switch err {
		case service.ErrBillingInvoiceNotFound:
			return errorResponse(c, http.StatusNotFound, "INVOICE_NOT_FOUND", "账单不存在")
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限查看账单")
		default:
			return errorResponse(c, http.StatusInternalServerError, "GET_FAILED", "获取账单详情失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"invoice": invoice,
	})
}

// SyncInvoicePayment 同步账单支付状态
func (h *BillingHandler) SyncInvoicePayment(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	invoiceID, err := uuid.Parse(c.Param("invoiceId"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_INVOICE_ID", "账单 ID 无效")
	}

	var req SyncInvoicePaymentRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	paidAt, err := parseInvoiceTime(req.PaidAt)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_PAID_AT", "支付时间无效")
	}

	status, err := h.billingService.SyncInvoicePayment(c.Request().Context(), uid, workspaceID, invoiceID, service.InvoicePaymentSyncRequest{
		Status:         req.Status,
		PaymentChannel: req.PaymentChannel,
		TransactionID:  req.TransactionID,
		PaidAt:         paidAt,
	})
	if err != nil {
		switch err {
		case service.ErrBillingInvoiceNotFound:
			return errorResponse(c, http.StatusNotFound, "INVOICE_NOT_FOUND", "账单不存在")
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限更新支付状态")
		case service.ErrBillingInvoiceInvalid:
			return errorResponse(c, http.StatusBadRequest, "INVALID_STATUS", "支付状态无效")
		default:
			return errorResponse(c, http.StatusInternalServerError, "UPDATE_FAILED", "同步支付状态失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"payment": status,
	})
}

// DownloadInvoice 下载账单
func (h *BillingHandler) DownloadInvoice(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	invoiceID, err := uuid.Parse(c.Param("invoiceId"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_INVOICE_ID", "账单 ID 无效")
	}

	invoice, err := h.billingService.GetInvoiceDetail(c.Request().Context(), uid, workspaceID, invoiceID)
	if err != nil {
		switch err {
		case service.ErrBillingInvoiceNotFound:
			return errorResponse(c, http.StatusNotFound, "INVOICE_NOT_FOUND", "账单不存在")
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限下载账单")
		default:
			return errorResponse(c, http.StatusInternalServerError, "DOWNLOAD_FAILED", "下载账单失败")
		}
	}

	format := strings.ToLower(strings.TrimSpace(c.QueryParam("format")))
	if format == "" {
		format = "pdf"
	}
	switch format {
	case "csv":
		payload := buildInvoiceCSV(invoice)
		filename := fmt.Sprintf("%s.csv", invoice.InvoiceNo)
		c.Response().Header().Set(echo.HeaderContentDisposition, fmt.Sprintf("attachment; filename=\"%s\"", filename))
		return c.Blob(http.StatusOK, "text/csv", payload)
	case "pdf":
		payload := buildInvoicePDF(invoice)
		filename := fmt.Sprintf("%s.pdf", invoice.InvoiceNo)
		c.Response().Header().Set(echo.HeaderContentDisposition, fmt.Sprintf("attachment; filename=\"%s\"", filename))
		return c.Blob(http.StatusOK, "application/pdf", payload)
	default:
		return errorResponse(c, http.StatusBadRequest, "INVALID_FORMAT", "不支持的下载格式")
	}
}

func buildInvoiceCSV(invoice *service.InvoiceDetail) []byte {
	if invoice == nil {
		return []byte{}
	}
	buffer := bytes.NewBuffer(nil)
	fmt.Fprintf(
		buffer,
		"invoice_no,period_start,period_end,currency,subtotal,discount_amount,tax_amount,total_amount,status\n%s,%s,%s,%s,%.2f,%.2f,%.2f,%.2f,%s\n\n",
		invoice.InvoiceNo,
		invoice.PeriodStart,
		invoice.PeriodEnd,
		invoice.Currency,
		invoice.Subtotal,
		invoice.DiscountAmount,
		invoice.TaxAmount,
		invoice.TotalAmount,
		invoice.Status,
	)
	buffer.WriteString("line_item,quantity,unit_price,total\n")
	for _, item := range invoice.LineItems {
		quantity := ""
		if item.Quantity != nil {
			quantity = fmt.Sprintf("%.2f", *item.Quantity)
		}
		unitPrice := ""
		if item.UnitPrice != nil {
			unitPrice = fmt.Sprintf("%.2f", *item.UnitPrice)
		}
		fmt.Fprintf(
			buffer,
			"%s,%s,%s,%.2f\n",
			item.Label,
			quantity,
			unitPrice,
			item.Total,
		)
	}
	return buffer.Bytes()
}

func buildInvoicePDF(invoice *service.InvoiceDetail) []byte {
	if invoice == nil {
		return []byte{}
	}
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.SetMargins(16, 18, 16)
	pdf.SetAutoPageBreak(true, 18)
	pdf.AddPage()

	fontName, boldAvailable := initInvoiceFont(pdf)
	boldStyle := ""
	if boldAvailable {
		boldStyle = "B"
	}
	if fontName == "" || pdf.Error() != nil {
		fontName = "Helvetica"
		boldStyle = "B"
	}

	pageWidth, _ := pdf.GetPageSize()
	marginLeft, _, marginRight, _ := pdf.GetMargins()
	contentWidth := pageWidth - marginLeft - marginRight

	brandGreen := []int{20, 122, 86}
	neutral900 := []int{22, 27, 45}
	neutral600 := []int{97, 105, 128}

	headerHeight := 22.0
	pdf.SetFillColor(brandGreen[0], brandGreen[1], brandGreen[2])
	pdf.Rect(0, 0, pageWidth, headerHeight, "F")
	pdf.SetTextColor(255, 255, 255)
	pdf.SetFont(fontName, boldStyle, 16)
	pdf.SetXY(marginLeft, 7)
	pdf.CellFormat(0, 6, "AgentFlow 发票", "", 0, "L", false, 0, "")
	pdf.SetFont(fontName, "", 9)
	pdf.SetXY(pageWidth-marginRight-70, 6)
	pdf.CellFormat(70, 5, fmt.Sprintf("发票号 %s", invoice.InvoiceNo), "", 0, "R", false, 0, "")
	pdf.SetXY(pageWidth-marginRight-70, 12)
	pdf.CellFormat(70, 5, fmt.Sprintf("出具日期 %s", invoice.IssuedAt), "", 0, "R", false, 0, "")

	pdf.SetTextColor(neutral900[0], neutral900[1], neutral900[2])
	pdf.SetY(headerHeight + 8)
	pdf.SetFont(fontName, boldStyle, 12)
	pdf.CellFormat(0, 6, "账单信息", "", 1, "L", false, 0, "")

	metaLeft := []invoiceMeta{
		{Label: "账期", Value: fmt.Sprintf("%s ~ %s", invoice.PeriodStart, invoice.PeriodEnd)},
		{Label: "状态", Value: resolveInvoiceStatusLabel(invoice.Status)},
		{Label: "描述", Value: invoice.Description},
	}
	metaRight := []invoiceMeta{
		{Label: "币种", Value: invoice.Currency},
		{Label: "支付时间", Value: fallbackValue(invoice.PaidAt)},
		{Label: "支付渠道", Value: fallbackValue(invoice.PaymentChannel)},
		{Label: "交易号", Value: fallbackValue(invoice.TransactionID)},
	}
	drawInvoiceMeta(pdf, fontName, metaLeft, metaRight, marginLeft, contentWidth, 5.8)

	pdf.SetY(pdf.GetY() + 4)
	pdf.SetFont(fontName, boldStyle, 12)
	pdf.CellFormat(0, 6, "费用明细", "", 1, "L", false, 0, "")

	tableWidths := []float64{
		contentWidth * 0.52,
		contentWidth * 0.14,
		contentWidth * 0.17,
		contentWidth * 0.17,
	}
	pdf.SetFont(fontName, boldStyle, 10)
	pdf.SetFillColor(240, 244, 248)
	pdf.SetTextColor(neutral600[0], neutral600[1], neutral600[2])
	pdf.CellFormat(tableWidths[0], 7, "项目", "1", 0, "L", true, 0, "")
	pdf.CellFormat(tableWidths[1], 7, "数量", "1", 0, "C", true, 0, "")
	pdf.CellFormat(tableWidths[2], 7, "单价", "1", 0, "C", true, 0, "")
	pdf.CellFormat(tableWidths[3], 7, "金额", "1", 1, "C", true, 0, "")

	pdf.SetFont(fontName, "", 10)
	pdf.SetTextColor(neutral900[0], neutral900[1], neutral900[2])
	for _, item := range invoice.LineItems {
		label := item.Label
		quantity := "-"
		unitPrice := "-"
		if item.Quantity != nil {
			quantity = fmt.Sprintf("%.2f", *item.Quantity)
		}
		if item.UnitPrice != nil {
			unitPrice = fmt.Sprintf("%.2f", *item.UnitPrice)
		}
		drawInvoiceRow(pdf, tableWidths, 6, []string{
			label,
			quantity,
			unitPrice,
			fmt.Sprintf("%.2f", item.Total),
		})
	}

	pdf.SetY(pdf.GetY() + 4)
	summaryWidth := contentWidth * 0.46
	summaryX := marginLeft + contentWidth - summaryWidth
	pdf.SetFont(fontName, boldStyle, 11)
	pdf.SetFillColor(245, 248, 250)
	pdf.SetX(summaryX)
	pdf.CellFormat(summaryWidth, 7, "金额汇总", "1", 1, "L", true, 0, "")
	pdf.SetFont(fontName, "", 10)
	drawSummaryRow(pdf, summaryX, summaryWidth, "小计", fmt.Sprintf("%.2f", invoice.Subtotal))
	discountValue := "0.00"
	if invoice.DiscountAmount > 0 {
		discountValue = fmt.Sprintf("-%.2f", invoice.DiscountAmount)
	}
	drawSummaryRow(pdf, summaryX, summaryWidth, "优惠", discountValue)
	drawSummaryRow(pdf, summaryX, summaryWidth, "税费", fmt.Sprintf("%.2f", invoice.TaxAmount))
	pdf.SetFont(fontName, boldStyle, 11)
	drawSummaryRow(pdf, summaryX, summaryWidth, "应付总额", fmt.Sprintf("%.2f", invoice.TotalAmount))

	pdf.SetY(pdf.GetY() + 6)
	pdf.SetFont(fontName, "", 9)
	pdf.SetTextColor(neutral600[0], neutral600[1], neutral600[2])
	pdf.MultiCell(0, 4.5, "此发票由系统自动生成。若需发票抬头或支付协助，请访问 /support-tickets 提交工单。", "", "L", false)

	var buffer bytes.Buffer
	if err := pdf.Output(&buffer); err != nil || pdf.Error() != nil {
		return buildSimplePDF([]string{fmt.Sprintf("Invoice %s", invoice.InvoiceNo)})
	}
	return buffer.Bytes()
}

type invoiceMeta struct {
	Label string
	Value string
}

func drawInvoiceMeta(
	pdf *gofpdf.Fpdf,
	fontName string,
	left []invoiceMeta,
	right []invoiceMeta,
	x float64,
	contentWidth float64,
	lineHeight float64,
) {
	gap := 8.0
	colWidth := (contentWidth - gap) / 2
	maxRows := len(left)
	if len(right) > maxRows {
		maxRows = len(right)
	}
	startY := pdf.GetY()
	for i := 0; i < maxRows; i++ {
		rowY := startY + float64(i)*lineHeight
		if i < len(left) {
			drawInvoiceMetaItem(pdf, fontName, x, rowY, colWidth, lineHeight, left[i])
		}
		if i < len(right) {
			drawInvoiceMetaItem(pdf, fontName, x+colWidth+gap, rowY, colWidth, lineHeight, right[i])
		}
	}
	pdf.SetY(startY + float64(maxRows)*lineHeight)
}

func drawInvoiceMetaItem(
	pdf *gofpdf.Fpdf,
	fontName string,
	x float64,
	y float64,
	width float64,
	lineHeight float64,
	item invoiceMeta,
) {
	labelWidth := 20.0
	pdf.SetXY(x, y)
	pdf.SetFont(fontName, "", 9)
	pdf.SetTextColor(120, 129, 143)
	pdf.CellFormat(labelWidth, lineHeight, item.Label, "", 0, "L", false, 0, "")
	pdf.SetXY(x+labelWidth, y)
	pdf.SetTextColor(22, 27, 45)
	value := truncateText(pdf, item.Value, width-labelWidth)
	pdf.CellFormat(width-labelWidth, lineHeight, value, "", 0, "L", false, 0, "")
}

func drawInvoiceRow(pdf *gofpdf.Fpdf, widths []float64, lineHeight float64, columns []string) {
	if len(widths) == 0 || len(columns) == 0 {
		return
	}
	x := pdf.GetX()
	y := pdf.GetY()
	lines := pdf.SplitLines([]byte(columns[0]), widths[0])
	rowHeight := float64(len(lines)) * lineHeight
	pdf.MultiCell(widths[0], lineHeight, columns[0], "1", "L", false)
	pdf.SetXY(x+widths[0], y)
	for i := 1; i < len(widths); i++ {
		value := ""
		if i < len(columns) {
			value = columns[i]
		}
		pdf.CellFormat(widths[i], rowHeight, value, "1", 0, "C", false, 0, "")
	}
	pdf.SetXY(x, y+rowHeight)
}

func drawSummaryRow(pdf *gofpdf.Fpdf, x float64, width float64, label string, value string) {
	labelWidth := width * 0.55
	valueWidth := width - labelWidth
	pdf.SetX(x)
	pdf.CellFormat(labelWidth, 6, label, "1", 0, "L", false, 0, "")
	pdf.CellFormat(valueWidth, 6, value, "1", 1, "R", false, 0, "")
}

func truncateText(pdf *gofpdf.Fpdf, text string, width float64) string {
	if pdf.GetStringWidth(text) <= width {
		return text
	}
	ellipsis := "..."
	runes := []rune(text)
	for len(runes) > 0 {
		if pdf.GetStringWidth(string(runes)+ellipsis) <= width {
			return string(runes) + ellipsis
		}
		runes = runes[:len(runes)-1]
	}
	return text
}

func resolveInvoiceStatusLabel(status string) string {
	switch strings.ToLower(strings.TrimSpace(status)) {
	case "paid":
		return "已支付"
	case "failed":
		return "支付失败"
	case "refunded":
		return "已退款"
	default:
		return "待处理"
	}
}

func fallbackValue(value *string) string {
	if value == nil {
		return "-"
	}
	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return "-"
	}
	return trimmed
}

func initInvoiceFont(pdf *gofpdf.Fpdf) (string, bool) {
	regularPath, boldPath := resolveInvoiceFontPaths()
	if regularPath == "" {
		return "", false
	}
	fontName := "InvoiceFont"
	pdf.AddUTF8Font(fontName, "", regularPath)
	boldAvailable := false
	if boldPath != "" {
		pdf.AddUTF8Font(fontName, "B", boldPath)
		boldAvailable = true
	}
	if pdf.Error() != nil {
		return "", false
	}
	return fontName, boldAvailable
}

func resolveInvoiceFontPaths() (string, string) {
	if regular := os.Getenv("AGENTFLOW_INVOICE_FONT_REGULAR"); regular != "" && fileExists(regular) {
		bold := os.Getenv("AGENTFLOW_INVOICE_FONT_BOLD")
		if bold != "" && fileExists(bold) {
			return regular, bold
		}
		return regular, ""
	}
	assetCandidates := []struct {
		Regular string
		Bold    string
	}{
		{"NotoSansSC-Regular.ttf", "NotoSansSC-Bold.ttf"},
		{"SourceHanSansSC-Regular.ttf", "SourceHanSansSC-Bold.ttf"},
		{"LXGWWenKai-Regular.ttf", "LXGWWenKai-Bold.ttf"},
	}
	for _, candidate := range assetCandidates {
		regular := resolveAssetFontPath(candidate.Regular)
		if regular == "" {
			continue
		}
		bold := resolveAssetFontPath(candidate.Bold)
		return regular, bold
	}
	systemCandidates := []struct {
		Regular string
		Bold    string
	}{
		{`C:\Windows\Fonts\Deng.ttf`, `C:\Windows\Fonts\Dengb.ttf`},
		{`C:\Windows\Fonts\msyh.ttf`, `C:\Windows\Fonts\msyhbd.ttf`},
		{`C:\Windows\Fonts\simhei.ttf`, ""},
	}
	for _, candidate := range systemCandidates {
		if fileExists(candidate.Regular) {
			bold := ""
			if candidate.Bold != "" && fileExists(candidate.Bold) {
				bold = candidate.Bold
			}
			return candidate.Regular, bold
		}
	}
	return "", ""
}

func resolveAssetFontPath(filename string) string {
	if filename == "" {
		return ""
	}
	if _, file, _, ok := runtime.Caller(0); ok {
		baseDir := filepath.Dir(file)
		candidate := filepath.Join(baseDir, "..", "..", "..", "assets", "fonts", filename)
		if fileExists(candidate) {
			return candidate
		}
	}
	if cwd, err := os.Getwd(); err == nil {
		candidate := filepath.Join(cwd, "assets", "fonts", filename)
		if fileExists(candidate) {
			return candidate
		}
	}
	return ""
}

func fileExists(path string) bool {
	if path == "" {
		return false
	}
	info, err := os.Stat(path)
	if err != nil {
		return false
	}
	return !info.IsDir()
}

func buildSimplePDF(lines []string) []byte {
	if len(lines) == 0 {
		lines = []string{"Invoice"}
	}
	sanitized := make([]string, 0, len(lines))
	for _, line := range lines {
		sanitized = append(sanitized, pdfEscape(sanitizePDFText(line)))
	}
	var contentBuilder strings.Builder
	contentBuilder.WriteString("BT\n/F1 12 Tf\n14 TL\n72 760 Td\n")
	for i, line := range sanitized {
		if i == 0 {
			contentBuilder.WriteString(fmt.Sprintf("(%s) Tj\n", line))
		} else {
			contentBuilder.WriteString(fmt.Sprintf("T* (%s) Tj\n", line))
		}
	}
	contentBuilder.WriteString("ET\n")
	content := contentBuilder.String()

	var buffer bytes.Buffer
	buffer.WriteString("%PDF-1.4\n")
	offsets := make([]int, 0, 5)
	writeObject := func(index int, body string) {
		offsets = append(offsets, buffer.Len())
		fmt.Fprintf(&buffer, "%d 0 obj\n%s\nendobj\n", index, body)
	}
	writeObject(1, "<< /Type /Catalog /Pages 2 0 R >>")
	writeObject(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>")
	writeObject(3, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>")
	writeObject(4, fmt.Sprintf("<< /Length %d >>\nstream\n%s\nendstream", len(content), content))
	writeObject(5, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")

	xrefOffset := buffer.Len()
	buffer.WriteString("xref\n")
	buffer.WriteString("0 6\n")
	buffer.WriteString("0000000000 65535 f \n")
	for _, offset := range offsets {
		buffer.WriteString(fmt.Sprintf("%010d 00000 n \n", offset))
	}
	buffer.WriteString("trailer\n")
	buffer.WriteString("<< /Size 6 /Root 1 0 R >>\n")
	buffer.WriteString("startxref\n")
	buffer.WriteString(fmt.Sprintf("%d\n", xrefOffset))
	buffer.WriteString("%%EOF\n")
	return buffer.Bytes()
}

func sanitizePDFText(value string) string {
	if value == "" {
		return ""
	}
	var builder strings.Builder
	for _, r := range value {
		if r >= 32 && r <= 126 {
			builder.WriteRune(r)
		} else {
			builder.WriteRune('?')
		}
	}
	return builder.String()
}

func pdfEscape(value string) string {
	value = strings.ReplaceAll(value, "\\", "\\\\")
	value = strings.ReplaceAll(value, "(", "\\(")
	value = strings.ReplaceAll(value, ")", "\\)")
	return value
}

func parseInvoiceTime(raw *string) (*time.Time, error) {
	if raw == nil {
		return nil, nil
	}
	trimmed := strings.TrimSpace(*raw)
	if trimmed == "" {
		return nil, nil
	}
	if parsed, err := time.Parse(time.RFC3339, trimmed); err == nil {
		return &parsed, nil
	}
	parsed, err := time.Parse("2006-01-02", trimmed)
	if err != nil {
		return nil, err
	}
	return &parsed, nil
}
