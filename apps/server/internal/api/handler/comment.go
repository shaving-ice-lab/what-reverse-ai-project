package handler

import (
	"net/http"
	"strconv"

	"github.com/agentflow/server/internal/api/middleware"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// CommentHandler 评论处理器
type CommentHandler struct {
	commentService service.CommentService
}

// NewCommentHandler 创建评论处理器实例
func NewCommentHandler(commentService service.CommentService) *CommentHandler {
	return &CommentHandler{
		commentService: commentService,
	}
}

// CreateCommentRequest 创建评论请求
type CreateCommentRequest struct {
	TargetType    string  `json:"target_type" validate:"required"`
	TargetID      string  `json:"target_id" validate:"required"`
	ParentID      *string `json:"parent_id,omitempty"`
	ReplyToUserID *string `json:"reply_to_user_id,omitempty"`
	Content       string  `json:"content" validate:"required"`
}

// UpdateCommentRequest 更新评论请求
type UpdateCommentRequest struct {
	Content string `json:"content" validate:"required"`
}

// Create 创建评论
// @Summary 创建评论
// @Tags 评论
// @Accept json
// @Produce json
// @Param body body CreateCommentRequest true "评论内容"
// @Success 200 {object} service.CommentResponse
// @Router /api/v1/comments [post]
func (h *CommentHandler) Create(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var req CreateCommentRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	targetID, err := uuid.Parse(req.TargetID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_TARGET_ID", "目标 ID 无效")
	}

	createReq := service.CreateCommentRequest{
		UserID:     uid,
		TargetType: req.TargetType,
		TargetID:   targetID,
		Content:    req.Content,
	}

	// 处理父评论 ID
	if req.ParentID != nil && *req.ParentID != "" {
		parentID, err := uuid.Parse(*req.ParentID)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_PARENT_ID", "父评论 ID 无效")
		}
		createReq.ParentID = &parentID
	}

	// 处理回复目标用户 ID
	if req.ReplyToUserID != nil && *req.ReplyToUserID != "" {
		replyToUserID, err := uuid.Parse(*req.ReplyToUserID)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_REPLY_TO_USER_ID", "回复目标用户 ID 无效")
		}
		createReq.ReplyToUserID = &replyToUserID
	}

	comment, err := h.commentService.Create(c.Request().Context(), createReq)
	if err != nil {
		switch err {
		case service.ErrEmptyComment:
			return errorResponse(c, http.StatusBadRequest, "EMPTY_COMMENT", "评论内容不能为空")
		case service.ErrCommentTooLong:
			return errorResponse(c, http.StatusBadRequest, "COMMENT_TOO_LONG", "评论内容过长")
		case service.ErrInvalidTargetType:
			return errorResponse(c, http.StatusBadRequest, "INVALID_TARGET_TYPE", "无效的目标类型")
		case service.ErrCommentNotFound:
			return errorResponse(c, http.StatusNotFound, "PARENT_NOT_FOUND", "父评论不存在")
		case service.ErrCannotReplyToReply:
			return errorResponse(c, http.StatusBadRequest, "CANNOT_REPLY_TO_REPLY", "不能回复回复")
		default:
			return errorResponse(c, http.StatusInternalServerError, "CREATE_FAILED", "创建评论失败")
		}
	}

	return successResponse(c, comment)
}

// Get 获取评论详情
// @Summary 获取评论详情
// @Tags 评论
// @Accept json
// @Produce json
// @Param id path string true "评论 ID"
// @Success 200 {object} service.CommentResponse
// @Router /api/v1/comments/{id} [get]
func (h *CommentHandler) Get(c echo.Context) error {
	commentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_COMMENT_ID", "评论 ID 无效")
	}

	// 获取当前用户 ID（可选）
	var currentUserID *uuid.UUID
	if userID := middleware.GetUserID(c); userID != "" {
		if uid, err := uuid.Parse(userID); err == nil {
			currentUserID = &uid
		}
	}

	comment, err := h.commentService.GetByID(c.Request().Context(), commentID, currentUserID)
	if err != nil {
		if err == service.ErrCommentNotFound {
			return errorResponse(c, http.StatusNotFound, "COMMENT_NOT_FOUND", "评论不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "GET_FAILED", "获取评论失败")
	}

	return successResponse(c, comment)
}

// Update 更新评论
// @Summary 更新评论
// @Tags 评论
// @Accept json
// @Produce json
// @Param id path string true "评论 ID"
// @Param body body UpdateCommentRequest true "评论内容"
// @Success 200 {object} service.CommentResponse
// @Router /api/v1/comments/{id} [put]
func (h *CommentHandler) Update(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	commentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_COMMENT_ID", "评论 ID 无效")
	}

	var req UpdateCommentRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	comment, err := h.commentService.Update(c.Request().Context(), commentID, uid, req.Content)
	if err != nil {
		switch err {
		case service.ErrCommentNotFound:
			return errorResponse(c, http.StatusNotFound, "COMMENT_NOT_FOUND", "评论不存在")
		case service.ErrCommentUnauthorized:
			return errorResponse(c, http.StatusForbidden, "UNAUTHORIZED", "无权修改此评论")
		case service.ErrEmptyComment:
			return errorResponse(c, http.StatusBadRequest, "EMPTY_COMMENT", "评论内容不能为空")
		case service.ErrCommentTooLong:
			return errorResponse(c, http.StatusBadRequest, "COMMENT_TOO_LONG", "评论内容过长")
		default:
			return errorResponse(c, http.StatusInternalServerError, "UPDATE_FAILED", "更新评论失败")
		}
	}

	return successResponse(c, comment)
}

// Delete 删除评论
// @Summary 删除评论
// @Tags 评论
// @Accept json
// @Produce json
// @Param id path string true "评论 ID"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/comments/{id} [delete]
func (h *CommentHandler) Delete(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	commentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_COMMENT_ID", "评论 ID 无效")
	}

	if err := h.commentService.Delete(c.Request().Context(), commentID, uid); err != nil {
		switch err {
		case service.ErrCommentNotFound:
			return errorResponse(c, http.StatusNotFound, "COMMENT_NOT_FOUND", "评论不存在")
		case service.ErrCommentUnauthorized:
			return errorResponse(c, http.StatusForbidden, "UNAUTHORIZED", "无权删除此评论")
		default:
			return errorResponse(c, http.StatusInternalServerError, "DELETE_FAILED", "删除评论失败")
		}
	}

	return successResponse(c, map[string]string{"message": "评论已删除"})
}

// ListByTarget 获取目标的评论列表
// @Summary 获取目标的评论列表
// @Tags 评论
// @Accept json
// @Produce json
// @Param target_type query string true "目标类型 (agent/workflow/document)"
// @Param target_id query string true "目标 ID"
// @Param page query int false "页码" default(1)
// @Param page_size query int false "每页数量" default(20)
// @Success 200 {object} service.CommentListResponse
// @Router /api/v1/comments [get]
func (h *CommentHandler) ListByTarget(c echo.Context) error {
	targetType := c.QueryParam("target_type")
	targetIDStr := c.QueryParam("target_id")

	if targetType == "" || targetIDStr == "" {
		return errorResponse(c, http.StatusBadRequest, "MISSING_PARAMS", "缺少必要参数")
	}

	targetID, err := uuid.Parse(targetIDStr)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_TARGET_ID", "目标 ID 无效")
	}

	page, _ := strconv.Atoi(c.QueryParam("page"))
	pageSize, _ := strconv.Atoi(c.QueryParam("page_size"))

	// 获取当前用户 ID（可选）
	var currentUserID *uuid.UUID
	if userID := middleware.GetUserID(c); userID != "" {
		if uid, err := uuid.Parse(userID); err == nil {
			currentUserID = &uid
		}
	}

	result, err := h.commentService.ListByTarget(c.Request().Context(), targetType, targetID, page, pageSize, currentUserID)
	if err != nil {
		if err == service.ErrInvalidTargetType {
			return errorResponse(c, http.StatusBadRequest, "INVALID_TARGET_TYPE", "无效的目标类型")
		}
		return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取评论列表失败")
	}

	return successResponse(c, result)
}

// ListReplies 获取评论的回复列表
// @Summary 获取评论的回复列表
// @Tags 评论
// @Accept json
// @Produce json
// @Param id path string true "评论 ID"
// @Param page query int false "页码" default(1)
// @Param page_size query int false "每页数量" default(20)
// @Success 200 {object} service.CommentListResponse
// @Router /api/v1/comments/{id}/replies [get]
func (h *CommentHandler) ListReplies(c echo.Context) error {
	commentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_COMMENT_ID", "评论 ID 无效")
	}

	page, _ := strconv.Atoi(c.QueryParam("page"))
	pageSize, _ := strconv.Atoi(c.QueryParam("page_size"))

	// 获取当前用户 ID（可选）
	var currentUserID *uuid.UUID
	if userID := middleware.GetUserID(c); userID != "" {
		if uid, err := uuid.Parse(userID); err == nil {
			currentUserID = &uid
		}
	}

	result, err := h.commentService.ListReplies(c.Request().Context(), commentID, page, pageSize, currentUserID)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取回复列表失败")
	}

	return successResponse(c, result)
}

// Like 点赞评论
// @Summary 点赞评论
// @Tags 评论
// @Accept json
// @Produce json
// @Param id path string true "评论 ID"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/comments/{id}/like [post]
func (h *CommentHandler) Like(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	commentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_COMMENT_ID", "评论 ID 无效")
	}

	if err := h.commentService.Like(c.Request().Context(), uid, commentID); err != nil {
		switch err {
		case service.ErrCommentNotFound:
			return errorResponse(c, http.StatusNotFound, "COMMENT_NOT_FOUND", "评论不存在")
		case service.ErrAlreadyLiked:
			return errorResponse(c, http.StatusBadRequest, "ALREADY_LIKED", "已经点赞过该评论")
		default:
			return errorResponse(c, http.StatusInternalServerError, "LIKE_FAILED", "点赞失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"message":  "点赞成功",
		"is_liked": true,
	})
}

// Unlike 取消点赞
// @Summary 取消点赞评论
// @Tags 评论
// @Accept json
// @Produce json
// @Param id path string true "评论 ID"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/comments/{id}/like [delete]
func (h *CommentHandler) Unlike(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	commentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_COMMENT_ID", "评论 ID 无效")
	}

	if err := h.commentService.Unlike(c.Request().Context(), uid, commentID); err != nil {
		if err == service.ErrNotLiked {
			return errorResponse(c, http.StatusBadRequest, "NOT_LIKED", "未点赞该评论")
		}
		return errorResponse(c, http.StatusInternalServerError, "UNLIKE_FAILED", "取消点赞失败")
	}

	return successResponse(c, map[string]interface{}{
		"message":  "取消点赞成功",
		"is_liked": false,
	})
}

// Pin 置顶评论
// @Summary 置顶评论
// @Tags 评论
// @Accept json
// @Produce json
// @Param id path string true "评论 ID"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/comments/{id}/pin [post]
func (h *CommentHandler) Pin(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	commentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_COMMENT_ID", "评论 ID 无效")
	}

	if err := h.commentService.Pin(c.Request().Context(), commentID, uid); err != nil {
		return errorResponse(c, http.StatusInternalServerError, "PIN_FAILED", "置顶失败")
	}

	return successResponse(c, map[string]string{"message": "评论已置顶"})
}

// Unpin 取消置顶
// @Summary 取消置顶评论
// @Tags 评论
// @Accept json
// @Produce json
// @Param id path string true "评论 ID"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/comments/{id}/pin [delete]
func (h *CommentHandler) Unpin(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	commentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_COMMENT_ID", "评论 ID 无效")
	}

	if err := h.commentService.Unpin(c.Request().Context(), commentID, uid); err != nil {
		return errorResponse(c, http.StatusInternalServerError, "UNPIN_FAILED", "取消置顶失败")
	}

	return successResponse(c, map[string]string{"message": "已取消置顶"})
}

// GetMyComments 获取当前用户的评论
// @Summary 获取当前用户的评论列表
// @Tags 评论
// @Accept json
// @Produce json
// @Param page query int false "页码" default(1)
// @Param page_size query int false "每页数量" default(20)
// @Success 200 {object} service.CommentListResponse
// @Router /api/v1/users/me/comments [get]
func (h *CommentHandler) GetMyComments(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	page, _ := strconv.Atoi(c.QueryParam("page"))
	pageSize, _ := strconv.Atoi(c.QueryParam("page_size"))

	result, err := h.commentService.ListByUser(c.Request().Context(), uid, page, pageSize)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取评论列表失败")
	}

	return successResponse(c, result)
}
