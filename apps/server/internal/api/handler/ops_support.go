package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/service"
	"github.com/labstack/echo/v4"
)

// OpsSupportHandler 运维与客服 SOP 处理器
type OpsSupportHandler struct {
	opsSupportService service.OpsSupportService
}

// NewOpsSupportHandler 创建运维与客服 SOP 处理器
func NewOpsSupportHandler(opsSupportService service.OpsSupportService) *OpsSupportHandler {
	return &OpsSupportHandler{
		opsSupportService: opsSupportService,
	}
}

// ListSOPs 获取 SOP 列表
func (h *OpsSupportHandler) ListSOPs(c echo.Context) error {
	sops := h.opsSupportService.ListSOPs(c.Request().Context())
	return successResponse(c, map[string]interface{}{
		"sops": sops,
	})
}

// GetSOP 获取 SOP 详情
func (h *OpsSupportHandler) GetSOP(c echo.Context) error {
	key := c.Param("key")
	sop, err := h.opsSupportService.GetSOP(c.Request().Context(), key)
	if err != nil {
		if err == service.ErrOpsSOPNotFound {
			return errorResponse(c, http.StatusNotFound, "SOP_NOT_FOUND", "SOP 不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "SOP_GET_FAILED", "获取 SOP 失败")
	}
	return successResponse(c, map[string]interface{}{
		"sop": sop,
	})
}
