package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/service"
	"github.com/labstack/echo/v4"
)

// PlanSecurityReviewHandler 安全威胁模型与评审处理器
type PlanSecurityReviewHandler struct {
	planSecurityReviewService service.PlanSecurityReviewService
}

// NewPlanSecurityReviewHandler 创建安全威胁模型与评审处理器
func NewPlanSecurityReviewHandler(planSecurityReviewService service.PlanSecurityReviewService) *PlanSecurityReviewHandler {
	return &PlanSecurityReviewHandler{planSecurityReviewService: planSecurityReviewService}
}

// GetThreatModel 获取威胁建模输出
func (h *PlanSecurityReviewHandler) GetThreatModel(c echo.Context) error {
	model, err := h.planSecurityReviewService.GetThreatModel(c.Request().Context())
	if err != nil {
		if err == service.ErrSecurityThreatModelNotFound {
			return errorResponse(c, http.StatusNotFound, "SECURITY_THREAT_MODEL_NOT_FOUND", "威胁建模不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "SECURITY_THREAT_MODEL_GET_FAILED", "获取威胁建模失败")
	}
	return successResponse(c, map[string]interface{}{
		"model": model,
	})
}

// GetRiskMatrix 获取风险矩阵
func (h *PlanSecurityReviewHandler) GetRiskMatrix(c echo.Context) error {
	matrix, err := h.planSecurityReviewService.GetRiskMatrix(c.Request().Context())
	if err != nil {
		if err == service.ErrSecurityRiskMatrixNotFound {
			return errorResponse(c, http.StatusNotFound, "SECURITY_RISK_MATRIX_NOT_FOUND", "风险矩阵不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "SECURITY_RISK_MATRIX_GET_FAILED", "获取风险矩阵失败")
	}
	return successResponse(c, map[string]interface{}{
		"matrix": matrix,
	})
}

// GetReviewProcess 获取安全评审流程
func (h *PlanSecurityReviewHandler) GetReviewProcess(c echo.Context) error {
	process, err := h.planSecurityReviewService.GetReviewProcess(c.Request().Context())
	if err != nil {
		if err == service.ErrSecurityReviewProcessNotFound {
			return errorResponse(c, http.StatusNotFound, "SECURITY_REVIEW_PROCESS_NOT_FOUND", "安全评审流程不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "SECURITY_REVIEW_PROCESS_GET_FAILED", "获取安全评审流程失败")
	}
	return successResponse(c, map[string]interface{}{
		"process": process,
	})
}
