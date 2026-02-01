package handler

import (
	"fmt"
	"net/http"

	"github.com/agentflow/server/internal/api/middleware"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type FolderHandler struct {
	folderService service.FolderService
}

func NewFolderHandler(folderService service.FolderService) *FolderHandler {
	return &FolderHandler{folderService: folderService}
}

type CreateFolderRequest struct {
	Name     string  `json:"name" validate:"required,max=100"`
	Icon     string  `json:"icon"`
	Color    string  `json:"color"`
	ParentID *string `json:"parent_id"`
}

type UpdateFolderRequest struct {
	Name      *string `json:"name"`
	Icon      *string `json:"icon"`
	Color     *string `json:"color"`
	SortOrder *int    `json:"sort_order"`
}

type MoveWorkflowRequest struct {
	FolderID *string `json:"folder_id"`
}

type BatchMoveRequest struct {
	IDs      []string `json:"ids" validate:"required,min=1,max=100"`
	FolderID *string  `json:"folder_id"`
}

// List 获取文件夹列表
func (h *FolderHandler) List(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	folders, err := h.folderService.List(c.Request().Context(), uid)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取文件夹列表失败")
	}

	return successResponse(c, map[string]interface{}{
		"folders": folders,
		"total":   len(folders),
	})
}

// Create 创建文件夹
func (h *FolderHandler) Create(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var req CreateFolderRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	if req.Name == "" {
		return errorResponse(c, http.StatusBadRequest, "NAME_REQUIRED", "文件夹名称不能为空")
	}

	// 解析父文件夹ID
	var parentID *uuid.UUID
	if req.ParentID != nil && *req.ParentID != "" {
		parsed, err := uuid.Parse(*req.ParentID)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_PARENT_ID", "父文件夹 ID 无效")
		}
		parentID = &parsed
	}

	folder, err := h.folderService.Create(c.Request().Context(), uid, service.CreateFolderRequest{
		Name:     req.Name,
		Icon:     req.Icon,
		Color:    req.Color,
		ParentID: parentID,
	})
	if err != nil {
		switch err {
		case service.ErrFolderNotFound:
			return errorResponse(c, http.StatusNotFound, "PARENT_NOT_FOUND", "父文件夹不存在")
		case service.ErrFolderUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问父文件夹")
		default:
			return errorResponse(c, http.StatusInternalServerError, "CREATE_FAILED", "创建文件夹失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"folder": folder,
	})
}

// Get 获取文件夹详情
func (h *FolderHandler) Get(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "文件夹 ID 无效")
	}

	folder, err := h.folderService.GetByID(c.Request().Context(), id, uid)
	if err != nil {
		switch err {
		case service.ErrFolderNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "文件夹不存在")
		case service.ErrFolderUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此文件夹")
		default:
			return errorResponse(c, http.StatusInternalServerError, "GET_FAILED", "获取文件夹失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"folder": folder,
	})
}

// Update 更新文件夹
func (h *FolderHandler) Update(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "文件夹 ID 无效")
	}

	var req UpdateFolderRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	folder, err := h.folderService.Update(c.Request().Context(), id, uid, service.UpdateFolderRequest{
		Name:      req.Name,
		Icon:      req.Icon,
		Color:     req.Color,
		SortOrder: req.SortOrder,
	})
	if err != nil {
		switch err {
		case service.ErrFolderNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "文件夹不存在")
		case service.ErrFolderUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限修改此文件夹")
		default:
			if err.Error() == "cannot modify system folder" {
				return errorResponse(c, http.StatusForbidden, "SYSTEM_FOLDER", "无法修改系统文件夹")
			}
			return errorResponse(c, http.StatusInternalServerError, "UPDATE_FAILED", "更新文件夹失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"folder": folder,
	})
}

// Delete 删除文件夹
func (h *FolderHandler) Delete(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "文件夹 ID 无效")
	}

	if err := h.folderService.Delete(c.Request().Context(), id, uid); err != nil {
		switch err {
		case service.ErrFolderNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "文件夹不存在")
		case service.ErrFolderUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限删除此文件夹")
		default:
			if err.Error() == "cannot delete system folder" {
				return errorResponse(c, http.StatusForbidden, "SYSTEM_FOLDER", "无法删除系统文件夹")
			}
			return errorResponse(c, http.StatusInternalServerError, "DELETE_FAILED", "删除文件夹失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"success": true,
		"message": "文件夹删除成功",
	})
}

// MoveWorkflow 移动工作流到文件夹
func (h *FolderHandler) MoveWorkflow(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workflowID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作流 ID 无效")
	}

	var req MoveWorkflowRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	// 解析目标文件夹ID
	var folderID *uuid.UUID
	if req.FolderID != nil && *req.FolderID != "" {
		parsed, err := uuid.Parse(*req.FolderID)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_FOLDER_ID", "文件夹 ID 无效")
		}
		folderID = &parsed
	}

	if err := h.folderService.MoveWorkflow(c.Request().Context(), workflowID, folderID, uid); err != nil {
		switch err {
		case service.ErrWorkflowNotFound:
			return errorResponse(c, http.StatusNotFound, "WORKFLOW_NOT_FOUND", "工作流不存在")
		case service.ErrFolderNotFound:
			return errorResponse(c, http.StatusNotFound, "FOLDER_NOT_FOUND", "文件夹不存在")
		case service.ErrUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限移动此工作流")
		case service.ErrFolderUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问目标文件夹")
		default:
			return errorResponse(c, http.StatusInternalServerError, "MOVE_FAILED", "移动工作流失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"success": true,
		"message": "工作流已移动",
	})
}

// BatchMoveWorkflows 批量移动工作流到文件夹
func (h *FolderHandler) BatchMoveWorkflows(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var req BatchMoveRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	if len(req.IDs) == 0 {
		return errorResponse(c, http.StatusBadRequest, "IDS_REQUIRED", "请选择要移动的工作流")
	}

	// 转换工作流ID
	workflowIDs := make([]uuid.UUID, len(req.IDs))
	for i, idStr := range req.IDs {
		parsed, err := uuid.Parse(idStr)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_WORKFLOW_ID", "工作流 ID 无效: "+idStr)
		}
		workflowIDs[i] = parsed
	}

	// 解析目标文件夹ID
	var folderID *uuid.UUID
	if req.FolderID != nil && *req.FolderID != "" {
		parsed, err := uuid.Parse(*req.FolderID)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_FOLDER_ID", "文件夹 ID 无效")
		}
		folderID = &parsed
	}

	count, err := h.folderService.BatchMoveWorkflows(c.Request().Context(), workflowIDs, folderID, uid)
	if err != nil {
		switch err {
		case service.ErrFolderNotFound:
			return errorResponse(c, http.StatusNotFound, "FOLDER_NOT_FOUND", "文件夹不存在")
		case service.ErrFolderUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问目标文件夹")
		default:
			return errorResponse(c, http.StatusInternalServerError, "BATCH_MOVE_FAILED", "批量移动失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"success": true,
		"count":   count,
		"message": fmt.Sprintf("成功移动 %d 个工作流", count),
	})
}
