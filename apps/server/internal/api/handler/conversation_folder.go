package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/api/middleware"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type ConversationFolderHandler struct {
	folderService service.ConversationFolderService
}

func NewConversationFolderHandler(folderService service.ConversationFolderService) *ConversationFolderHandler {
	return &ConversationFolderHandler{folderService: folderService}
}

type CreateConversationFolderRequest struct {
	Name     string  `json:"name" validate:"required,max=100"`
	Icon     string  `json:"icon"`
	Color    string  `json:"color"`
	ParentID *string `json:"parent_id"`
}

type UpdateConversationFolderRequest struct {
	Name      *string `json:"name"`
	Icon      *string `json:"icon"`
	Color     *string `json:"color"`
	SortOrder *int    `json:"sort_order"`
}

// List 获取对话文件夹列表
func (h *ConversationFolderHandler) List(c echo.Context) error {
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

// Create 创建对话文件夹
func (h *ConversationFolderHandler) Create(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var req CreateConversationFolderRequest
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

	folder, err := h.folderService.Create(c.Request().Context(), uid, service.CreateConversationFolderRequest{
		Name:     req.Name,
		Icon:     req.Icon,
		Color:    req.Color,
		ParentID: parentID,
	})
	if err != nil {
		switch err {
		case service.ErrConversationFolderNotFound:
			return errorResponse(c, http.StatusNotFound, "PARENT_NOT_FOUND", "父文件夹不存在")
		case service.ErrConversationFolderUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问父文件夹")
		default:
			return errorResponse(c, http.StatusInternalServerError, "CREATE_FAILED", "创建文件夹失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"folder": folder,
	})
}

// Get 获取对话文件夹详情
func (h *ConversationFolderHandler) Get(c echo.Context) error {
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
		case service.ErrConversationFolderNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "文件夹不存在")
		case service.ErrConversationFolderUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此文件夹")
		default:
			return errorResponse(c, http.StatusInternalServerError, "GET_FAILED", "获取文件夹失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"folder": folder,
	})
}

// Update 更新对话文件夹
func (h *ConversationFolderHandler) Update(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "文件夹 ID 无效")
	}

	var req UpdateConversationFolderRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	folder, err := h.folderService.Update(c.Request().Context(), id, uid, service.UpdateConversationFolderRequest{
		Name:      req.Name,
		Icon:      req.Icon,
		Color:     req.Color,
		SortOrder: req.SortOrder,
	})
	if err != nil {
		switch err {
		case service.ErrConversationFolderNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "文件夹不存在")
		case service.ErrConversationFolderUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限修改此文件夹")
		default:
			return errorResponse(c, http.StatusInternalServerError, "UPDATE_FAILED", "更新文件夹失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"folder": folder,
	})
}

// Delete 删除对话文件夹
func (h *ConversationFolderHandler) Delete(c echo.Context) error {
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
		case service.ErrConversationFolderNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "文件夹不存在")
		case service.ErrConversationFolderUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限删除此文件夹")
		default:
			return errorResponse(c, http.StatusInternalServerError, "DELETE_FAILED", "删除文件夹失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"success": true,
		"message": "文件夹删除成功",
	})
}
