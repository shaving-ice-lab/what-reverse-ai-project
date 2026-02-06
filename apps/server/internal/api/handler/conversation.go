package handler

import (
	"fmt"
	"net/http"

	"github.com/agentflow/server/internal/api/middleware"
	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type ConversationHandler struct {
	conversationService service.ConversationService
	workspaceService    service.WorkspaceService
}

func NewConversationHandler(
	conversationService service.ConversationService,
	workspaceService service.WorkspaceService,
) *ConversationHandler {
	return &ConversationHandler{
		conversationService: conversationService,
		workspaceService:    workspaceService,
	}
}

// 请求结构体
type CreateConversationRequest struct {
	WorkspaceID  string   `json:"workspace_id" validate:"required"`
	Title        string   `json:"title" validate:"required,max=500"`
	Model        string   `json:"model"`
	SystemPrompt *string  `json:"system_prompt"`
	FolderID     *string  `json:"folder_id"`
	Tags         []string `json:"tags"`
}

type UpdateConversationRequest struct {
	Title        *string `json:"title"`
	Model        *string `json:"model"`
	SystemPrompt *string `json:"system_prompt"`
	FolderID     *string `json:"folder_id"`
}

type SetStatusRequest struct {
	Value bool `json:"value"`
}

type BatchOperationRequest struct {
	IDs []string `json:"ids" validate:"required,min=1,max=100"`
}

type BatchStarRequest struct {
	IDs     []string `json:"ids" validate:"required,min=1,max=100"`
	Starred bool     `json:"starred"`
}

type BatchArchiveConversationRequest struct {
	IDs      []string `json:"ids" validate:"required,min=1,max=100"`
	Archived bool     `json:"archived"`
}

type BatchMoveConversationRequest struct {
	IDs      []string `json:"ids" validate:"required,min=1,max=100"`
	FolderID *string  `json:"folder_id"`
}

type AddMessageRequest struct {
	Role             string  `json:"role" validate:"required"`
	Content          string  `json:"content" validate:"required"`
	Model            string  `json:"model"`
	TokenUsage       int     `json:"token_usage"`
	PromptTokens     int     `json:"prompt_tokens"`
	CompletionTokens int     `json:"completion_tokens"`
	ParentID         *string `json:"parent_id"` // 回复/引用的消息 ID
}

type SetTagsRequest struct {
	Tags []string `json:"tags"`
}

// List 获取对话列表
func (h *ConversationHandler) List(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var workspaceID *uuid.UUID
	if workspaceIDStr := c.QueryParam("workspace_id"); workspaceIDStr != "" {
		parsed, err := uuid.Parse(workspaceIDStr)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
		}
		workspaceID = &parsed
		if _, err := h.workspaceService.GetByID(c.Request().Context(), parsed, uid); err != nil {
			switch err {
			case service.ErrWorkspaceNotFound:
				return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
			case service.ErrWorkspaceUnauthorized:
				return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问该工作空间")
			default:
				return errorResponse(c, http.StatusInternalServerError, "WORKSPACE_GET_FAILED", "获取工作空间失败")
			}
		}
	}

	ctx := c.Request().Context()

	// 解析查询参数
	var folderID *uuid.UUID
	if folderIDStr := c.QueryParam("folder_id"); folderIDStr != "" {
		parsed, err := uuid.Parse(folderIDStr)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_FOLDER_ID", "文件夹 ID 无效")
		}
		folderID = &parsed
	}

	var starred, pinned, archived *bool
	if starredStr := c.QueryParam("starred"); starredStr != "" {
		val := starredStr == "true"
		starred = &val
	}
	if pinnedStr := c.QueryParam("pinned"); pinnedStr != "" {
		val := pinnedStr == "true"
		pinned = &val
	}
	if archivedStr := c.QueryParam("archived"); archivedStr != "" {
		val := archivedStr == "true"
		archived = &val
	}

	page := 1
	pageSize := 20
	if pageStr := c.QueryParam("page"); pageStr != "" {
		fmt.Sscanf(pageStr, "%d", &page)
	}
	if pageSizeStr := c.QueryParam("page_size"); pageSizeStr != "" {
		fmt.Sscanf(pageSizeStr, "%d", &pageSize)
	}

	req := service.ListConversationsRequest{
		WorkspaceID: workspaceID,
		FolderID:    folderID,
		Starred:     starred,
		Pinned:      pinned,
		Archived:    archived,
		Search:      c.QueryParam("search"),
		Page:        page,
		PageSize:    pageSize,
		OrderBy:     c.QueryParam("order_by"),
	}

	result, err := h.conversationService.List(ctx, uid, req)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取对话列表失败")
	}

	return successResponse(c, result)
}

// Create 创建对话
func (h *ConversationHandler) Create(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var req CreateConversationRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	if req.Title == "" {
		return errorResponse(c, http.StatusBadRequest, "TITLE_REQUIRED", "对话标题不能为空")
	}

	if req.WorkspaceID == "" {
		return errorResponse(c, http.StatusBadRequest, "WORKSPACE_ID_REQUIRED", "Workspace ID 不能为空")
	}
	workspaceID, err := uuid.Parse(req.WorkspaceID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	ctx := c.Request().Context()
	if _, err := h.workspaceService.GetByID(ctx, workspaceID, uid); err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问该工作空间")
		default:
			return errorResponse(c, http.StatusInternalServerError, "WORKSPACE_GET_FAILED", "获取工作空间失败")
		}
	}

	// 解析文件夹ID
	var folderID *uuid.UUID
	if req.FolderID != nil && *req.FolderID != "" {
		parsed, err := uuid.Parse(*req.FolderID)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_FOLDER_ID", "文件夹 ID 无效")
		}
		folderID = &parsed
	}

	conversation, err := h.conversationService.Create(ctx, uid, service.CreateConversationRequest{
		WorkspaceID:  workspaceID,
		Title:        req.Title,
		Model:        req.Model,
		SystemPrompt: req.SystemPrompt,
		FolderID:     folderID,
		Tags:         req.Tags,
	})
	if err != nil {
		switch err {
		case service.ErrFolderNotFound:
			return errorResponse(c, http.StatusNotFound, "FOLDER_NOT_FOUND", "文件夹不存在")
		case service.ErrFolderUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此文件夹")
		default:
			return errorResponse(c, http.StatusInternalServerError, "CREATE_FAILED", "创建对话失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"conversation": conversation,
	})
}

// Get 获取对话详情
func (h *ConversationHandler) Get(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "对话 ID 无效")
	}

	workspaceIDStr := c.QueryParam("workspace_id")
	if workspaceIDStr == "" {
		return errorResponse(c, http.StatusBadRequest, "WORKSPACE_ID_REQUIRED", "Workspace ID 不能为空")
	}
	workspaceID, err := uuid.Parse(workspaceIDStr)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	ctx := c.Request().Context()
	if _, err := h.workspaceService.GetByID(ctx, workspaceID, uid); err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问该工作空间")
		default:
			return errorResponse(c, http.StatusInternalServerError, "WORKSPACE_GET_FAILED", "获取工作空间失败")
		}
	}

	// 检查是否需要加载消息
	messageLimit := 50 // 默认加载最近50条消息
	if limitStr := c.QueryParam("message_limit"); limitStr != "" {
		fmt.Sscanf(limitStr, "%d", &messageLimit)
	}

	conversation, err := h.conversationService.GetWithMessages(ctx, id, uid, messageLimit)
	if err != nil {
		switch err {
		case service.ErrConversationNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "对话不存在")
		case service.ErrConversationUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此对话")
		default:
			return errorResponse(c, http.StatusInternalServerError, "GET_FAILED", "获取对话失败")
		}
	}

	if conversation.WorkspaceID != workspaceID {
		return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "对话不存在")
	}

	return successResponse(c, map[string]interface{}{
		"conversation": conversation,
	})
}

// Update 更新对话
func (h *ConversationHandler) Update(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "对话 ID 无效")
	}

	var req UpdateConversationRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	// 解析文件夹ID
	var folderID *uuid.UUID
	if req.FolderID != nil && *req.FolderID != "" {
		parsed, err := uuid.Parse(*req.FolderID)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_FOLDER_ID", "文件夹 ID 无效")
		}
		folderID = &parsed
	}

	conversation, err := h.conversationService.Update(c.Request().Context(), id, uid, service.UpdateConversationRequest{
		Title:        req.Title,
		Model:        req.Model,
		SystemPrompt: req.SystemPrompt,
		FolderID:     folderID,
	})
	if err != nil {
		switch err {
		case service.ErrConversationNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "对话不存在")
		case service.ErrConversationUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限修改此对话")
		case service.ErrFolderNotFound:
			return errorResponse(c, http.StatusNotFound, "FOLDER_NOT_FOUND", "文件夹不存在")
		case service.ErrFolderUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FOLDER_FORBIDDEN", "无权限访问目标文件夹")
		default:
			return errorResponse(c, http.StatusInternalServerError, "UPDATE_FAILED", "更新对话失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"conversation": conversation,
	})
}

// Delete 删除对话
func (h *ConversationHandler) Delete(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "对话 ID 无效")
	}

	if err := h.conversationService.Delete(c.Request().Context(), id, uid); err != nil {
		switch err {
		case service.ErrConversationNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "对话不存在")
		case service.ErrConversationUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限删除此对话")
		default:
			return errorResponse(c, http.StatusInternalServerError, "DELETE_FAILED", "删除对话失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"success": true,
		"message": "对话删除成功",
	})
}

// Duplicate 复制对话
func (h *ConversationHandler) Duplicate(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "对话 ID 无效")
	}

	conversation, err := h.conversationService.Duplicate(c.Request().Context(), id, uid)
	if err != nil {
		switch err {
		case service.ErrConversationNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "对话不存在")
		case service.ErrConversationUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限复制此对话")
		default:
			return errorResponse(c, http.StatusInternalServerError, "DUPLICATE_FAILED", "复制对话失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"conversation": conversation,
	})
}

// SetStarred 设置收藏状态
func (h *ConversationHandler) SetStarred(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "对话 ID 无效")
	}

	var req SetStatusRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	if err := h.conversationService.SetStarred(c.Request().Context(), id, uid, req.Value); err != nil {
		switch err {
		case service.ErrConversationNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "对话不存在")
		case service.ErrConversationUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限操作此对话")
		default:
			return errorResponse(c, http.StatusInternalServerError, "UPDATE_FAILED", "更新收藏状态失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"success": true,
		"starred": req.Value,
	})
}

// SetPinned 设置置顶状态
func (h *ConversationHandler) SetPinned(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "对话 ID 无效")
	}

	var req SetStatusRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	if err := h.conversationService.SetPinned(c.Request().Context(), id, uid, req.Value); err != nil {
		switch err {
		case service.ErrConversationNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "对话不存在")
		case service.ErrConversationUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限操作此对话")
		default:
			return errorResponse(c, http.StatusInternalServerError, "UPDATE_FAILED", "更新置顶状态失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"success": true,
		"pinned":  req.Value,
	})
}

// SetArchived 设置归档状态
func (h *ConversationHandler) SetArchived(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "对话 ID 无效")
	}

	var req SetStatusRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	if err := h.conversationService.SetArchived(c.Request().Context(), id, uid, req.Value); err != nil {
		switch err {
		case service.ErrConversationNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "对话不存在")
		case service.ErrConversationUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限操作此对话")
		default:
			return errorResponse(c, http.StatusInternalServerError, "UPDATE_FAILED", "更新归档状态失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"success":  true,
		"archived": req.Value,
	})
}

// BatchStar 批量收藏
func (h *ConversationHandler) BatchStar(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var req BatchStarRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	if len(req.IDs) == 0 {
		return errorResponse(c, http.StatusBadRequest, "IDS_REQUIRED", "请选择要操作的对话")
	}

	ids := make([]uuid.UUID, len(req.IDs))
	for i, idStr := range req.IDs {
		parsed, err := uuid.Parse(idStr)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "对话 ID 无效: "+idStr)
		}
		ids[i] = parsed
	}

	count, err := h.conversationService.BatchSetStarred(c.Request().Context(), uid, ids, req.Starred)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "BATCH_STAR_FAILED", "批量收藏失败")
	}

	return successResponse(c, map[string]interface{}{
		"success": true,
		"count":   count,
		"message": fmt.Sprintf("成功操作 %d 个对话", count),
	})
}

// BatchArchive 批量归档
func (h *ConversationHandler) BatchArchive(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var req BatchArchiveConversationRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	if len(req.IDs) == 0 {
		return errorResponse(c, http.StatusBadRequest, "IDS_REQUIRED", "请选择要操作的对话")
	}

	ids := make([]uuid.UUID, len(req.IDs))
	for i, idStr := range req.IDs {
		parsed, err := uuid.Parse(idStr)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "对话 ID 无效: "+idStr)
		}
		ids[i] = parsed
	}

	count, err := h.conversationService.BatchSetArchived(c.Request().Context(), uid, ids, req.Archived)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "BATCH_ARCHIVE_FAILED", "批量归档失败")
	}

	return successResponse(c, map[string]interface{}{
		"success": true,
		"count":   count,
		"message": fmt.Sprintf("成功操作 %d 个对话", count),
	})
}

// BatchDelete 批量删除
func (h *ConversationHandler) BatchDelete(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var req BatchOperationRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	if len(req.IDs) == 0 {
		return errorResponse(c, http.StatusBadRequest, "IDS_REQUIRED", "请选择要删除的对话")
	}

	ids := make([]uuid.UUID, len(req.IDs))
	for i, idStr := range req.IDs {
		parsed, err := uuid.Parse(idStr)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "对话 ID 无效: "+idStr)
		}
		ids[i] = parsed
	}

	count, err := h.conversationService.BatchDelete(c.Request().Context(), uid, ids)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "BATCH_DELETE_FAILED", "批量删除失败")
	}

	return successResponse(c, map[string]interface{}{
		"success": true,
		"count":   count,
		"message": fmt.Sprintf("成功删除 %d 个对话", count),
	})
}

// BatchMove 批量移动到文件夹
func (h *ConversationHandler) BatchMove(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var req BatchMoveConversationRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	if len(req.IDs) == 0 {
		return errorResponse(c, http.StatusBadRequest, "IDS_REQUIRED", "请选择要移动的对话")
	}

	ids := make([]uuid.UUID, len(req.IDs))
	for i, idStr := range req.IDs {
		parsed, err := uuid.Parse(idStr)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "对话 ID 无效: "+idStr)
		}
		ids[i] = parsed
	}

	var folderID *uuid.UUID
	if req.FolderID != nil && *req.FolderID != "" {
		parsed, err := uuid.Parse(*req.FolderID)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_FOLDER_ID", "文件夹 ID 无效")
		}
		folderID = &parsed
	}

	count, err := h.conversationService.BatchMove(c.Request().Context(), uid, ids, folderID)
	if err != nil {
		switch err {
		case service.ErrFolderNotFound:
			return errorResponse(c, http.StatusNotFound, "FOLDER_NOT_FOUND", "文件夹不存在")
		case service.ErrFolderUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FOLDER_FORBIDDEN", "无权限访问目标文件夹")
		default:
			return errorResponse(c, http.StatusInternalServerError, "BATCH_MOVE_FAILED", "批量移动失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"success": true,
		"count":   count,
		"message": fmt.Sprintf("成功移动 %d 个对话", count),
	})
}

// SetTags 设置对话标签
func (h *ConversationHandler) SetTags(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "对话 ID 无效")
	}

	var req SetTagsRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	if err := h.conversationService.SetTags(c.Request().Context(), id, uid, req.Tags); err != nil {
		switch err {
		case service.ErrConversationNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "对话不存在")
		case service.ErrConversationUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限操作此对话")
		default:
			return errorResponse(c, http.StatusInternalServerError, "SET_TAGS_FAILED", "设置标签失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"success": true,
		"tags":    req.Tags,
	})
}

// ListMessages 获取对话消息列表
func (h *ConversationHandler) ListMessages(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	conversationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "对话 ID 无效")
	}

	page := 1
	pageSize := 50
	if pageStr := c.QueryParam("page"); pageStr != "" {
		fmt.Sscanf(pageStr, "%d", &page)
	}
	if pageSizeStr := c.QueryParam("page_size"); pageSizeStr != "" {
		fmt.Sscanf(pageSizeStr, "%d", &pageSize)
	}

	var beforeID, afterID *uuid.UUID
	if beforeIDStr := c.QueryParam("before_id"); beforeIDStr != "" {
		parsed, _ := uuid.Parse(beforeIDStr)
		beforeID = &parsed
	}
	if afterIDStr := c.QueryParam("after_id"); afterIDStr != "" {
		parsed, _ := uuid.Parse(afterIDStr)
		afterID = &parsed
	}

	result, err := h.conversationService.ListMessages(c.Request().Context(), conversationID, uid, service.ListMessagesRequest{
		Page:     page,
		PageSize: pageSize,
		BeforeID: beforeID,
		AfterID:  afterID,
	})
	if err != nil {
		switch err {
		case service.ErrConversationNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "对话不存在")
		case service.ErrConversationUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此对话")
		default:
			return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取消息列表失败")
		}
	}

	return successResponse(c, result)
}

// AddMessage 添加消息
func (h *ConversationHandler) AddMessage(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	conversationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "对话 ID 无效")
	}

	var req AddMessageRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	if req.Role == "" || req.Content == "" {
		return errorResponse(c, http.StatusBadRequest, "CONTENT_REQUIRED", "消息内容不能为空")
	}

	// 解析父消息 ID
	var parentID *uuid.UUID
	if req.ParentID != nil && *req.ParentID != "" {
		parsed, err := uuid.Parse(*req.ParentID)
		if err == nil {
			parentID = &parsed
		}
	}

	message, err := h.conversationService.AddMessage(c.Request().Context(), conversationID, uid, service.AddMessageRequest{
		Role:             entity.MessageRole(req.Role),
		Content:          req.Content,
		Model:            req.Model,
		TokenUsage:       req.TokenUsage,
		PromptTokens:     req.PromptTokens,
		CompletionTokens: req.CompletionTokens,
		ParentID:         parentID,
	})
	if err != nil {
		switch err {
		case service.ErrConversationNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "对话不存在")
		case service.ErrConversationUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限向此对话添加消息")
		default:
			return errorResponse(c, http.StatusInternalServerError, "ADD_FAILED", "添加消息失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"message": message,
	})
}

// UpdateMessageRequest 更新消息请求
type UpdateMessageAPIRequest struct {
	Content string `json:"content" validate:"required"`
}

// UpdateMessage 更新消息
// PUT /api/v1/conversations/:id/messages/:messageId
func (h *ConversationHandler) UpdateMessage(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	conversationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "对话 ID 无效")
	}

	messageID, err := uuid.Parse(c.Param("messageId"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_MESSAGE_ID", "消息 ID 无效")
	}

	var req UpdateMessageAPIRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	if req.Content == "" {
		return errorResponse(c, http.StatusBadRequest, "CONTENT_REQUIRED", "消息内容不能为空")
	}

	message, err := h.conversationService.UpdateMessage(c.Request().Context(), messageID, conversationID, uid, service.UpdateMessageRequest{
		Content: req.Content,
	})
	if err != nil {
		switch err {
		case service.ErrConversationNotFound:
			return errorResponse(c, http.StatusNotFound, "CONVERSATION_NOT_FOUND", "对话不存在")
		case service.ErrConversationUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限编辑此消息")
		case service.ErrMessageNotFound:
			return errorResponse(c, http.StatusNotFound, "MESSAGE_NOT_FOUND", "消息不存在")
		default:
			return errorResponse(c, http.StatusInternalServerError, "UPDATE_FAILED", "更新消息失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"success": true,
		"message": message,
	})
}

// UpdateMessageFeedbackRequest 更新消息反馈请求
type UpdateMessageFeedbackAPIRequest struct {
	Liked      *bool `json:"liked"`
	Disliked   *bool `json:"disliked"`
	Bookmarked *bool `json:"bookmarked"`
}

// UpdateMessageFeedback 更新消息反馈
// PUT /api/v1/conversations/:id/messages/:messageId/feedback
func (h *ConversationHandler) UpdateMessageFeedback(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	conversationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "对话 ID 无效")
	}

	messageID, err := uuid.Parse(c.Param("messageId"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_MESSAGE_ID", "消息 ID 无效")
	}

	var req UpdateMessageFeedbackAPIRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	message, err := h.conversationService.UpdateMessageFeedback(c.Request().Context(), messageID, conversationID, uid, service.UpdateMessageFeedbackRequest{
		Liked:      req.Liked,
		Disliked:   req.Disliked,
		Bookmarked: req.Bookmarked,
	})
	if err != nil {
		switch err {
		case service.ErrConversationNotFound:
			return errorResponse(c, http.StatusNotFound, "CONVERSATION_NOT_FOUND", "对话不存在")
		case service.ErrConversationUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限操作此消息")
		case service.ErrMessageNotFound:
			return errorResponse(c, http.StatusNotFound, "MESSAGE_NOT_FOUND", "消息不存在")
		default:
			return errorResponse(c, http.StatusInternalServerError, "UPDATE_FAILED", "更新反馈失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"success": true,
		"message": message,
	})
}

// DeleteMessage 删除消息
func (h *ConversationHandler) DeleteMessage(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	conversationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "对话 ID 无效")
	}

	messageID, err := uuid.Parse(c.Param("messageId"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_MESSAGE_ID", "消息 ID 无效")
	}

	if err := h.conversationService.DeleteMessage(c.Request().Context(), messageID, conversationID, uid); err != nil {
		switch err {
		case service.ErrConversationNotFound:
			return errorResponse(c, http.StatusNotFound, "CONVERSATION_NOT_FOUND", "对话不存在")
		case service.ErrConversationUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限删除此消息")
		case service.ErrMessageNotFound:
			return errorResponse(c, http.StatusNotFound, "MESSAGE_NOT_FOUND", "消息不存在")
		default:
			return errorResponse(c, http.StatusInternalServerError, "DELETE_FAILED", "删除消息失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"success": true,
		"message": "消息删除成功",
	})
}

// Export 导出对话
// GET /api/v1/conversations/:id/export
func (h *ConversationHandler) Export(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	conversationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "对话 ID 无效")
	}

	// 获取导出格式
	format := c.QueryParam("format")
	if format == "" {
		format = "json"
	}

	// 获取对话详情（包含所有消息）
	conversation, err := h.conversationService.GetByID(c.Request().Context(), conversationID, uid)
	if err != nil {
		switch err {
		case service.ErrConversationNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "对话不存在")
		case service.ErrConversationUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此对话")
		default:
			return errorResponse(c, http.StatusInternalServerError, "GET_FAILED", "获取对话失败")
		}
	}

	// 获取所有消息
	messageResult, err := h.conversationService.ListMessages(c.Request().Context(), conversationID, uid, service.ListMessagesRequest{
		Page:     1,
		PageSize: 10000,
	})
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "GET_MESSAGES_FAILED", "获取消息失败")
	}
	messages := messageResult.Messages

	switch format {
	case "markdown":
		// 导出为 Markdown 格式
		md := fmt.Sprintf("# %s\n\n", conversation.Title)
		md += fmt.Sprintf("**模型**: %s\n", conversation.Model)
		md += fmt.Sprintf("**创建时间**: %s\n\n", conversation.CreatedAt.Format("2006-01-02 15:04:05"))
		md += "---\n\n"

		for i := len(messages) - 1; i >= 0; i-- {
			msg := messages[i]
			role := "🧑 用户"
			if msg.Role == entity.MessageRoleAssistant {
				role = "🤖 AI"
			} else if msg.Role == entity.MessageRoleSystem {
				role = "⚙️ 系统"
			}
			md += fmt.Sprintf("### %s\n\n%s\n\n", role, msg.Content)
		}

		c.Response().Header().Set("Content-Type", "text/markdown; charset=utf-8")
		c.Response().Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s.md"`, conversation.Title))
		return c.String(http.StatusOK, md)

	default:
		// 导出为 JSON 格式
		exportData := map[string]interface{}{
			"title":      conversation.Title,
			"model":      conversation.Model,
			"created_at": conversation.CreatedAt,
			"messages":   make([]map[string]interface{}, 0, len(messages)),
		}

		// 按时间正序排列
		for i := len(messages) - 1; i >= 0; i-- {
			msg := messages[i]
			exportData["messages"] = append(exportData["messages"].([]map[string]interface{}), map[string]interface{}{
				"role":       msg.Role,
				"content":    msg.Content,
				"model":      msg.Model,
				"created_at": msg.CreatedAt,
			})
		}

		c.Response().Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s.json"`, conversation.Title))
		return c.JSON(http.StatusOK, exportData)
	}
}

// ImportConversationRequest 导入对话请求
type ImportConversationRequest struct {
	WorkspaceID  string                 `json:"workspace_id" validate:"required"`
	Title        string                 `json:"title" validate:"required"`
	Model        string                 `json:"model"`
	SystemPrompt string                 `json:"system_prompt"`
	FolderID     *string                `json:"folder_id"`
	Messages     []ImportMessageRequest `json:"messages" validate:"required"`
}

// ImportMessageRequest 导入消息请求
type ImportMessageRequest struct {
	Role      string `json:"role" validate:"required"`
	Content   string `json:"content" validate:"required"`
	Model     string `json:"model"`
	CreatedAt string `json:"created_at"`
}

// Import 导入对话
// POST /api/v1/conversations/import
func (h *ConversationHandler) Import(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var req ImportConversationRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	if req.Title == "" {
		return errorResponse(c, http.StatusBadRequest, "TITLE_REQUIRED", "对话标题不能为空")
	}

	if req.WorkspaceID == "" {
		return errorResponse(c, http.StatusBadRequest, "WORKSPACE_ID_REQUIRED", "Workspace ID 不能为空")
	}
	workspaceID, err := uuid.Parse(req.WorkspaceID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	if len(req.Messages) == 0 {
		return errorResponse(c, http.StatusBadRequest, "MESSAGES_REQUIRED", "对话消息不能为空")
	}

	ctx := c.Request().Context()

	if _, err := h.workspaceService.GetByID(ctx, workspaceID, uid); err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问该工作空间")
		default:
			return errorResponse(c, http.StatusInternalServerError, "WORKSPACE_GET_FAILED", "获取工作空间失败")
		}
	}

	// 解析文件夹 ID
	var folderID *uuid.UUID
	if req.FolderID != nil && *req.FolderID != "" {
		parsed, err := uuid.Parse(*req.FolderID)
		if err == nil {
			folderID = &parsed
		}
	}

	// 创建对话
	model := req.Model
	if model == "" {
		model = "gpt-4"
	}

	createReq := service.CreateConversationRequest{
		WorkspaceID: workspaceID,
		Title:       req.Title,
		Model:       model,
		FolderID:    folderID,
	}
	if req.SystemPrompt != "" {
		createReq.SystemPrompt = &req.SystemPrompt
	}

	conversation, err := h.conversationService.Create(ctx, uid, createReq)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "CREATE_FAILED", "创建对话失败")
	}

	// 导入消息
	importedCount := 0
	for _, msg := range req.Messages {
		role := entity.MessageRoleUser
		switch msg.Role {
		case "assistant":
			role = entity.MessageRoleAssistant
		case "system":
			role = entity.MessageRoleSystem
		}

		_, err := h.conversationService.AddMessage(ctx, conversation.ID, uid, service.AddMessageRequest{
			Role:    role,
			Content: msg.Content,
			Model:   msg.Model,
		})
		if err != nil {
			continue // 跳过失败的消息
		}
		importedCount++
	}

	return successResponse(c, map[string]interface{}{
		"success":        true,
		"conversation":   conversation,
		"imported_count": importedCount,
		"total_messages": len(req.Messages),
	})
}

// CreateConversationShareRequest 创建对话分享请求
type CreateConversationShareRequest struct {
	ExpiresInDays int  `json:"expires_in_days"` // 过期天数，0 表示永不过期
	IsPublic      bool `json:"is_public"`       // 是否公开
}

// Share 创建对话分享链接
// POST /api/v1/conversations/:id/share
func (h *ConversationHandler) Share(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	conversationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "对话 ID 无效")
	}

	var req CreateConversationShareRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	// 验证对话存在且属于当前用户
	_, err = h.conversationService.GetByID(c.Request().Context(), conversationID, uid)
	if err != nil {
		switch err {
		case service.ErrConversationNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "对话不存在")
		case service.ErrConversationUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此对话")
		default:
			return errorResponse(c, http.StatusInternalServerError, "GET_FAILED", "获取对话失败")
		}
	}

	// 生成分享 token
	shareToken := uuid.New().String()[:16]

	// TODO: 将分享信息保存到数据库
	// 目前返回模拟的分享链接

	baseURL := c.Request().Host
	scheme := "https"
	if c.Request().TLS == nil {
		scheme = "http"
	}

	shareURL := fmt.Sprintf("%s://%s/shared/conversation/%s", scheme, baseURL, shareToken)

	return successResponse(c, map[string]interface{}{
		"share_url":   shareURL,
		"share_token": shareToken,
		"expires_at":  nil, // TODO: 计算过期时间
		"is_public":   req.IsPublic,
	})
}

// GetShared 获取分享的对话（公开访问）
// GET /api/v1/shared/conversations/:token
func (h *ConversationHandler) GetShared(c echo.Context) error {
	// TODO: 根据 token 获取分享的对话
	// 需要实现分享表的数据库模型和仓储

	token := c.Param("token")
	if token == "" {
		return errorResponse(c, http.StatusBadRequest, "INVALID_TOKEN", "分享 token 无效")
	}

	// 目前返回示例响应
	return errorResponse(c, http.StatusNotImplemented, "NOT_IMPLEMENTED", "分享功能尚未完全实现")
}

// GetStatistics 获取对话统计
// GET /api/v1/conversations/statistics
func (h *ConversationHandler) GetStatistics(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	stats, err := h.conversationService.GetStatistics(c.Request().Context(), uid)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "GET_STATS_FAILED", "获取统计失败")
	}

	return successResponse(c, stats)
}
