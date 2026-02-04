package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/service"
	"github.com/labstack/echo/v4"
)

// PlanSecurityTestingHandler 安全测试与漏洞响应处理器
type PlanSecurityTestingHandler struct {
	planSecurityTestingService service.PlanSecurityTestingService
}

// NewPlanSecurityTestingHandler 创建安全测试与漏洞响应处理器
func NewPlanSecurityTestingHandler(planSecurityTestingService service.PlanSecurityTestingService) *PlanSecurityTestingHandler {
	return &PlanSecurityTestingHandler{planSecurityTestingService: planSecurityTestingService}
}

// GetPenTestPlan 获取渗透测试计划
func (h *PlanSecurityTestingHandler) GetPenTestPlan(c echo.Context) error {
	plan, err := h.planSecurityTestingService.GetPenTestPlan(c.Request().Context())
	if err != nil {
		if err == service.ErrSecurityPenTestPlanNotFound {
			return errorResponse(c, http.StatusNotFound, "SECURITY_PENTEST_PLAN_NOT_FOUND", "渗透测试计划不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "SECURITY_PENTEST_PLAN_GET_FAILED", "获取渗透测试计划失败")
	}
	return successResponse(c, map[string]interface{}{
		"plan": plan,
	})
}

// GetVulnerabilityScanProcess 获取依赖与镜像漏洞扫描流程
func (h *PlanSecurityTestingHandler) GetVulnerabilityScanProcess(c echo.Context) error {
	process, err := h.planSecurityTestingService.GetVulnerabilityScanProcess(c.Request().Context())
	if err != nil {
		if err == service.ErrVulnerabilityScanProcessNotFound {
			return errorResponse(c, http.StatusNotFound, "VULNERABILITY_SCAN_PROCESS_NOT_FOUND", "漏洞扫描流程不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "VULNERABILITY_SCAN_PROCESS_GET_FAILED", "获取漏洞扫描流程失败")
	}
	return successResponse(c, map[string]interface{}{
		"process": process,
	})
}

// GetBugBountyProgram 获取漏洞报告与 Bug Bounty 流程
func (h *PlanSecurityTestingHandler) GetBugBountyProgram(c echo.Context) error {
	program, err := h.planSecurityTestingService.GetBugBountyProgram(c.Request().Context())
	if err != nil {
		if err == service.ErrBugBountyProgramNotFound {
			return errorResponse(c, http.StatusNotFound, "BUG_BOUNTY_PROGRAM_NOT_FOUND", "漏洞报告流程不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "BUG_BOUNTY_PROGRAM_GET_FAILED", "获取漏洞报告流程失败")
	}
	return successResponse(c, map[string]interface{}{
		"program": program,
	})
}

// GetVulnerabilityResponseProcess 获取漏洞响应与披露流程
func (h *PlanSecurityTestingHandler) GetVulnerabilityResponseProcess(c echo.Context) error {
	process, err := h.planSecurityTestingService.GetVulnerabilityResponseProcess(c.Request().Context())
	if err != nil {
		if err == service.ErrVulnerabilityResponseProcessNotFound {
			return errorResponse(c, http.StatusNotFound, "VULNERABILITY_RESPONSE_PROCESS_NOT_FOUND", "漏洞响应流程不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "VULNERABILITY_RESPONSE_PROCESS_GET_FAILED", "获取漏洞响应流程失败")
	}
	return successResponse(c, map[string]interface{}{
		"process": process,
	})
}
