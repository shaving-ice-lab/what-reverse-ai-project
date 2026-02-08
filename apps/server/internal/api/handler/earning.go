package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/agentflow/server/internal/api/middleware"
	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/repository"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// EarningHandler 收入处理器
type EarningHandler struct {
	earningService service.EarningService
}

// NewEarningHandler 创建收入处理器实例
func NewEarningHandler(earningService service.EarningService) *EarningHandler {
	return &EarningHandler{
		earningService: earningService,
	}
}

// =====================
// 收入 API
// =====================

// ListEarnings 获取收入列表
// GET /api/v1/earnings
func (h *EarningHandler) ListEarnings(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	page, _ := strconv.Atoi(c.QueryParam("page"))
	pageSize, _ := strconv.Atoi(c.QueryParam("page_size"))
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}

	params := repository.EarningListParams{
		Type:     c.QueryParam("type"),
		Status:   c.QueryParam("status"),
		Page:     page,
		PageSize: pageSize,
	}

	// 解析日期范围
	if startDateStr := c.QueryParam("start_date"); startDateStr != "" {
		if t, err := time.Parse("2006-01-02", startDateStr); err == nil {
			params.StartDate = &t
		}
	}
	if endDateStr := c.QueryParam("end_date"); endDateStr != "" {
		if t, err := time.Parse("2006-01-02", endDateStr); err == nil {
			params.EndDate = &t
		}
	}

	earnings, total, err := h.earningService.ListEarnings(c.Request().Context(), uid, params)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取收入列表失败")
	}

	return successResponseWithMeta(c, earnings, map[string]interface{}{
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// GetEarning 获取收入详情
// GET /api/v1/earnings/:id
func (h *EarningHandler) GetEarning(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	earningID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "收入 ID 无效")
	}

	earning, err := h.earningService.GetEarning(c.Request().Context(), earningID)
	if err != nil {
		return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "收入记录不存在")
	}

	// 验证权限
	if earning.UserID != uid {
		return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权查看此收入记录")
	}

	return successResponse(c, earning)
}

// =====================
// 分成规则 API
// =====================

// GetCommissionTiers 获取分成规则
// GET /api/v1/earnings/commission-tiers
func (h *EarningHandler) GetCommissionTiers(c echo.Context) error {
	tiers, err := h.earningService.GetCommissionTiers(c.Request().Context())
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取分成规则失败")
	}

	return successResponse(c, tiers)
}

// CalculateCommission 计算分成预览
// POST /api/v1/earnings/calculate-commission
func (h *EarningHandler) CalculateCommission(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var req struct {
		GrossAmount float64 `json:"gross_amount"`
		EarningType string  `json:"earning_type"`
	}

	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	if req.GrossAmount <= 0 {
		return errorResponse(c, http.StatusBadRequest, "INVALID_AMOUNT", "金额必须大于 0")
	}

	earningType := entity.EarningType(req.EarningType)
	if earningType == "" {
		earningType = entity.EarningTypeSale
	}

	result, err := h.earningService.CalculateCommission(c.Request().Context(), uid, req.GrossAmount, earningType)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "CALCULATE_FAILED", "计算分成失败")
	}

	return successResponse(c, result)
}

// =====================
// 账户 API
// =====================

// GetCreatorAccount 获取创作者账户
// GET /api/v1/earnings/account
func (h *EarningHandler) GetCreatorAccount(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	account, err := h.earningService.GetCreatorAccount(c.Request().Context(), uid)
	if err != nil {
		// 如果账户不存在，创建新账户
		account, err = h.earningService.GetOrCreateAccount(c.Request().Context(), uid)
		if err != nil {
			return errorResponse(c, http.StatusInternalServerError, "GET_FAILED", "获取账户失败")
		}
	}

	return successResponse(c, account)
}

// UpdatePaymentInfo 更新收款信息
// PUT /api/v1/earnings/account/payment
func (h *EarningHandler) UpdatePaymentInfo(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var req struct {
		PaymentMethod  string `json:"payment_method"`
		PaymentAccount string `json:"payment_account"`
		PaymentName    string `json:"payment_name"`
	}

	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	if req.PaymentMethod == "" || req.PaymentAccount == "" || req.PaymentName == "" {
		return errorResponse(c, http.StatusBadRequest, "MISSING_FIELDS", "收款信息不完整")
	}

	if err := h.earningService.UpdatePaymentInfo(c.Request().Context(), uid, service.UpdatePaymentRequest{
		PaymentMethod:  req.PaymentMethod,
		PaymentAccount: req.PaymentAccount,
		PaymentName:    req.PaymentName,
	}); err != nil {
		return errorResponse(c, http.StatusInternalServerError, "UPDATE_FAILED", "更新收款信息失败")
	}

	return successResponse(c, map[string]string{"message": "收款信息更新成功"})
}

// =====================
// 仪表盘 API
// =====================

// GetCreatorDashboard 获取创作者仪表盘
// GET /api/v1/earnings/dashboard
func (h *EarningHandler) GetCreatorDashboard(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	dashboard, err := h.earningService.GetCreatorDashboard(c.Request().Context(), uid)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "GET_FAILED", "获取仪表盘数据失败")
	}

	return successResponse(c, dashboard)
}

// =====================
// 提现 API
// =====================

// ListWithdrawals 获取提现记录
// GET /api/v1/earnings/withdrawals
func (h *EarningHandler) ListWithdrawals(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	page, _ := strconv.Atoi(c.QueryParam("page"))
	pageSize, _ := strconv.Atoi(c.QueryParam("page_size"))
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}

	params := repository.WithdrawalListParams{
		Status:   c.QueryParam("status"),
		Page:     page,
		PageSize: pageSize,
	}

	withdrawals, total, err := h.earningService.ListWithdrawals(c.Request().Context(), uid, params)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取提现记录失败")
	}

	return successResponseWithMeta(c, withdrawals, map[string]interface{}{
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// RequestWithdrawal 申请提现
// POST /api/v1/earnings/withdrawals
func (h *EarningHandler) RequestWithdrawal(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var req struct {
		Amount float64 `json:"amount"`
		Note   string  `json:"note"`
	}

	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	if req.Amount <= 0 {
		return errorResponse(c, http.StatusBadRequest, "INVALID_AMOUNT", "提现金额必须大于 0")
	}

	withdrawal, err := h.earningService.RequestWithdrawal(c.Request().Context(), uid, req.Amount, req.Note)
	if err != nil {
		switch err {
		case service.ErrMinWithdrawalAmount:
			return errorResponse(c, http.StatusBadRequest, "MIN_AMOUNT", "提现金额低于最低限额 (100 元)")
		case service.ErrInsufficientBalance:
			return errorResponse(c, http.StatusBadRequest, "INSUFFICIENT_BALANCE", "余额不足")
		case service.ErrPaymentNotVerified:
			return errorResponse(c, http.StatusBadRequest, "PAYMENT_NOT_SET", "请先设置收款信息")
		case service.ErrAccountNotFound:
			return errorResponse(c, http.StatusNotFound, "ACCOUNT_NOT_FOUND", "创作者账户不存在")
		default:
			return errorResponse(c, http.StatusInternalServerError, "REQUEST_FAILED", "申请提现失败")
		}
	}

	return successResponse(c, withdrawal)
}
