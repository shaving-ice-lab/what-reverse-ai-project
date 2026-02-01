package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/api/middleware"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type TagHandler struct {
	tagService service.TagService
}

func NewTagHandler(tagService service.TagService) *TagHandler {
	return &TagHandler{tagService: tagService}
}

// List 获取用户标签列表
// @Summary 获取用户标签列表
// @Tags Tag
// @Security BearerAuth
// @Success 200 {array} entity.TagWithCount
// @Router /api/v1/tags [get]
func (h *TagHandler) List(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	tags, err := h.tagService.List(c.Request().Context(), uid)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取标签列表失败")
	}

	return successResponse(c, tags)
}

// Create 创建标签
// @Summary 创建标签
// @Tags Tag
// @Security BearerAuth
// @Param body body CreateTagRequest true "标签信息"
// @Success 200 {object} entity.Tag
// @Router /api/v1/tags [post]
func (h *TagHandler) Create(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var req CreateTagRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	if req.Name == "" {
		return errorResponse(c, http.StatusBadRequest, "NAME_REQUIRED", "标签名称不能为空")
	}

	tag, err := h.tagService.Create(c.Request().Context(), uid, req.Name, req.Color)
	if err != nil {
		switch err {
		case service.ErrTagAlreadyExists:
			return errorResponse(c, http.StatusConflict, "TAG_EXISTS", "标签已存在")
		default:
			return errorResponse(c, http.StatusInternalServerError, "CREATE_FAILED", "创建标签失败")
		}
	}

	return successResponse(c, tag)
}

// Update 更新标签
// @Summary 更新标签
// @Tags Tag
// @Security BearerAuth
// @Param id path string true "标签 ID"
// @Param body body UpdateTagRequest true "标签信息"
// @Success 200 {object} entity.Tag
// @Router /api/v1/tags/{id} [put]
func (h *TagHandler) Update(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	tagID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "标签 ID 无效")
	}

	var req UpdateTagRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	tag, err := h.tagService.Update(c.Request().Context(), uid, tagID, req.Name, req.Color)
	if err != nil {
		switch err {
		case service.ErrTagNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "标签不存在")
		case service.ErrUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限操作")
		case service.ErrTagAlreadyExists:
			return errorResponse(c, http.StatusConflict, "TAG_EXISTS", "标签名称已存在")
		default:
			return errorResponse(c, http.StatusInternalServerError, "UPDATE_FAILED", "更新标签失败")
		}
	}

	return successResponse(c, tag)
}

// Delete 删除标签
// @Summary 删除标签
// @Tags Tag
// @Security BearerAuth
// @Param id path string true "标签 ID"
// @Success 200 {object} SuccessResponse
// @Router /api/v1/tags/{id} [delete]
func (h *TagHandler) Delete(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	tagID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "标签 ID 无效")
	}

	if err := h.tagService.Delete(c.Request().Context(), uid, tagID); err != nil {
		switch err {
		case service.ErrTagNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "标签不存在")
		case service.ErrUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限操作")
		default:
			return errorResponse(c, http.StatusInternalServerError, "DELETE_FAILED", "删除标签失败")
		}
	}

	return successResponse(c, map[string]string{"message": "标签已删除"})
}

// AddToWorkflow 添加标签到工作流
// @Summary 添加标签到工作流
// @Tags Tag
// @Security BearerAuth
// @Param workflow_id path string true "工作流 ID"
// @Param tag_id path string true "标签 ID"
// @Success 200 {object} SuccessResponse
// @Router /api/v1/workflows/{workflow_id}/tags/{tag_id} [post]
func (h *TagHandler) AddToWorkflow(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workflowID, err := uuid.Parse(c.Param("workflow_id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_WORKFLOW_ID", "工作流 ID 无效")
	}

	tagID, err := uuid.Parse(c.Param("tag_id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_TAG_ID", "标签 ID 无效")
	}

	if err := h.tagService.AddToWorkflow(c.Request().Context(), uid, workflowID, tagID); err != nil {
		switch err {
		case service.ErrWorkflowNotFound:
			return errorResponse(c, http.StatusNotFound, "WORKFLOW_NOT_FOUND", "工作流不存在")
		case service.ErrTagNotFound:
			return errorResponse(c, http.StatusNotFound, "TAG_NOT_FOUND", "标签不存在")
		case service.ErrUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限操作")
		default:
			return errorResponse(c, http.StatusInternalServerError, "ADD_FAILED", "添加标签失败")
		}
	}

	return successResponse(c, map[string]string{"message": "标签已添加"})
}

// RemoveFromWorkflow 从工作流移除标签
// @Summary 从工作流移除标签
// @Tags Tag
// @Security BearerAuth
// @Param workflow_id path string true "工作流 ID"
// @Param tag_id path string true "标签 ID"
// @Success 200 {object} SuccessResponse
// @Router /api/v1/workflows/{workflow_id}/tags/{tag_id} [delete]
func (h *TagHandler) RemoveFromWorkflow(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workflowID, err := uuid.Parse(c.Param("workflow_id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_WORKFLOW_ID", "工作流 ID 无效")
	}

	tagID, err := uuid.Parse(c.Param("tag_id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_TAG_ID", "标签 ID 无效")
	}

	if err := h.tagService.RemoveFromWorkflow(c.Request().Context(), uid, workflowID, tagID); err != nil {
		switch err {
		case service.ErrWorkflowNotFound:
			return errorResponse(c, http.StatusNotFound, "WORKFLOW_NOT_FOUND", "工作流不存在")
		case service.ErrUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限操作")
		default:
			return errorResponse(c, http.StatusInternalServerError, "REMOVE_FAILED", "移除标签失败")
		}
	}

	return successResponse(c, map[string]string{"message": "标签已移除"})
}

// CreateTagRequest 创建标签请求
type CreateTagRequest struct {
	Name  string `json:"name" validate:"required"`
	Color string `json:"color"`
}

// UpdateTagRequest 更新标签请求
type UpdateTagRequest struct {
	Name  string `json:"name" validate:"required"`
	Color string `json:"color"`
}
