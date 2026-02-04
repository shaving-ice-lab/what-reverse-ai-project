package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/service"
	"github.com/labstack/echo/v4"
)

// PlanIncidentResponseHandler 故障演练与应急预案处理器
type PlanIncidentResponseHandler struct {
	planService service.PlanIncidentResponseService
}

// NewPlanIncidentResponseHandler 创建故障演练与应急预案处理器
func NewPlanIncidentResponseHandler(planService service.PlanIncidentResponseService) *PlanIncidentResponseHandler {
	return &PlanIncidentResponseHandler{planService: planService}
}

// GetIncidentDrillPlans 获取故障演练计划
func (h *PlanIncidentResponseHandler) GetIncidentDrillPlans(c echo.Context) error {
	plan, err := h.planService.GetIncidentDrillPlans(c.Request().Context())
	if err != nil {
		if err == service.ErrIncidentDrillPlanNotFound {
			return errorResponse(c, http.StatusNotFound, "INCIDENT_DRILL_NOT_FOUND", "演练计划不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "INCIDENT_DRILL_GET_FAILED", "获取演练计划失败")
	}
	return successResponse(c, map[string]interface{}{
		"plan": plan,
	})
}

// GetIncidentOwnerTable 获取应急响应责任表
func (h *PlanIncidentResponseHandler) GetIncidentOwnerTable(c echo.Context) error {
	table, err := h.planService.GetIncidentOwnerTable(c.Request().Context())
	if err != nil {
		if err == service.ErrIncidentOwnerTableNotFound {
			return errorResponse(c, http.StatusNotFound, "INCIDENT_OWNER_NOT_FOUND", "责任表不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "INCIDENT_OWNER_GET_FAILED", "获取责任表失败")
	}
	return successResponse(c, map[string]interface{}{
		"table": table,
	})
}

// GetPostmortemTemplate 获取事故复盘模板
func (h *PlanIncidentResponseHandler) GetPostmortemTemplate(c echo.Context) error {
	template, err := h.planService.GetPostmortemTemplate(c.Request().Context())
	if err != nil {
		if err == service.ErrPostmortemTemplateNotFound {
			return errorResponse(c, http.StatusNotFound, "POSTMORTEM_TEMPLATE_NOT_FOUND", "复盘模板不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "POSTMORTEM_TEMPLATE_GET_FAILED", "获取复盘模板失败")
	}
	return successResponse(c, map[string]interface{}{
		"template": template,
	})
}

// GetPostmortemProcess 获取事故复盘流程
func (h *PlanIncidentResponseHandler) GetPostmortemProcess(c echo.Context) error {
	process, err := h.planService.GetPostmortemProcess(c.Request().Context())
	if err != nil {
		if err == service.ErrPostmortemProcessNotFound {
			return errorResponse(c, http.StatusNotFound, "POSTMORTEM_PROCESS_NOT_FOUND", "复盘流程不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "POSTMORTEM_PROCESS_GET_FAILED", "获取复盘流程失败")
	}
	return successResponse(c, map[string]interface{}{
		"process": process,
	})
}

// GetRootCauseTaxonomy 获取 Root Cause 分类与统计
func (h *PlanIncidentResponseHandler) GetRootCauseTaxonomy(c echo.Context) error {
	taxonomy, err := h.planService.GetRootCauseTaxonomy(c.Request().Context())
	if err != nil {
		if err == service.ErrRootCauseTaxonomyNotFound {
			return errorResponse(c, http.StatusNotFound, "ROOT_CAUSE_TAXONOMY_NOT_FOUND", "根因分类不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "ROOT_CAUSE_TAXONOMY_GET_FAILED", "获取根因分类失败")
	}
	return successResponse(c, map[string]interface{}{
		"taxonomy": taxonomy,
	})
}

// GetKnowledgeBaseGuide 获取知识库维护与检索规范
func (h *PlanIncidentResponseHandler) GetKnowledgeBaseGuide(c echo.Context) error {
	guide, err := h.planService.GetKnowledgeBaseGuide(c.Request().Context())
	if err != nil {
		if err == service.ErrKnowledgeBaseGuideNotFound {
			return errorResponse(c, http.StatusNotFound, "KNOWLEDGE_BASE_GUIDE_NOT_FOUND", "知识库规范不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "KNOWLEDGE_BASE_GUIDE_GET_FAILED", "获取知识库规范失败")
	}
	return successResponse(c, map[string]interface{}{
		"guide": guide,
	})
}
