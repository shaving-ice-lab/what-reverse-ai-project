package handler

import (
	"net/http"
	"strconv"

	"github.com/agentflow/server/internal/api/middleware"
	"github.com/agentflow/server/internal/repository"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type ReviewHandler struct {
	reviewService service.ReviewService
}

func NewReviewHandler(reviewService service.ReviewService) *ReviewHandler {
	return &ReviewHandler{reviewService: reviewService}
}

type CreateReviewRequest struct {
	AgentID string `json:"agent_id" validate:"required"`
	Rating  int    `json:"rating" validate:"required,min=1,max=5"`
	Title   string `json:"title"`
	Content string `json:"content" validate:"required"`
}

type UpdateReviewRequest struct {
	Rating  *int    `json:"rating"`
	Title   *string `json:"title"`
	Content *string `json:"content"`
}

// List 获取 Agent 评价列表
// @Summary 获取 Agent 评价列表
// @Tags Reviews
// @Param agent_id path string true "Agent ID"
// @Param page query int false "页码"
// @Param page_size query int false "每页数量"
// @Param sort query string false "排序方式: recent, helpful, highest, lowest"
// @Param rating query int false "筛选评分 1-5"
// @Success 200 {array} entity.Review
// @Router /api/v1/agents/{agent_id}/reviews [get]
func (h *ReviewHandler) List(c echo.Context) error {
	agentID, err := uuid.Parse(c.Param("agent_id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "Agent ID 无效")
	}

	page, _ := strconv.Atoi(c.QueryParam("page"))
	pageSize, _ := strconv.Atoi(c.QueryParam("page_size"))
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 10
	}

	var rating *int
	if r := c.QueryParam("rating"); r != "" {
		if rInt, err := strconv.Atoi(r); err == nil && rInt >= 1 && rInt <= 5 {
			rating = &rInt
		}
	}

	params := repository.ReviewListParams{
		Page:     page,
		PageSize: pageSize,
		Sort:     c.QueryParam("sort"),
		Rating:   rating,
	}

	reviews, total, err := h.reviewService.List(c.Request().Context(), agentID, params)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取评价列表失败")
	}

	return successResponseWithMeta(c, reviews, map[string]interface{}{
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// Create 创建评价
// @Summary 创建评价
// @Tags Reviews
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body CreateReviewRequest true "评价信息"
// @Success 200 {object} entity.Review
// @Router /api/v1/reviews [post]
func (h *ReviewHandler) Create(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var req CreateReviewRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	agentID, err := uuid.Parse(req.AgentID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_AGENT_ID", "Agent ID 无效")
	}

	review, err := h.reviewService.Create(c.Request().Context(), uid, service.CreateReviewRequest{
		AgentID: agentID,
		Rating:  req.Rating,
		Title:   req.Title,
		Content: req.Content,
	})
	if err != nil {
		switch err {
		case service.ErrAgentNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "Agent 不存在")
		case service.ErrAlreadyReviewed:
			return errorResponse(c, http.StatusConflict, "ALREADY_REVIEWED", "您已经评价过此 Agent")
		case service.ErrCannotReviewOwn:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "不能评价自己的 Agent")
		case service.ErrInvalidRating:
			return errorResponse(c, http.StatusBadRequest, "INVALID_RATING", "评分必须在 1-5 之间")
		default:
			return errorResponse(c, http.StatusInternalServerError, "CREATE_FAILED", "创建评价失败")
		}
	}

	return successResponse(c, review)
}

// Get 获取评价详情
// @Summary 获取评价详情
// @Tags Reviews
// @Param id path string true "评价 ID"
// @Success 200 {object} entity.Review
// @Router /api/v1/reviews/{id} [get]
func (h *ReviewHandler) Get(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "评价 ID 无效")
	}

	review, err := h.reviewService.GetByID(c.Request().Context(), id)
	if err != nil {
		return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "评价不存在")
	}

	return successResponse(c, review)
}

// Update 更新评价
// @Summary 更新评价
// @Tags Reviews
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path string true "评价 ID"
// @Param request body UpdateReviewRequest true "更新信息"
// @Success 200 {object} entity.Review
// @Router /api/v1/reviews/{id} [put]
func (h *ReviewHandler) Update(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "评价 ID 无效")
	}

	var req UpdateReviewRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	review, err := h.reviewService.Update(c.Request().Context(), id, uid, service.UpdateReviewRequest{
		Rating:  req.Rating,
		Title:   req.Title,
		Content: req.Content,
	})
	if err != nil {
		switch err {
		case service.ErrReviewNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "评价不存在")
		case service.ErrUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权修改此评价")
		case service.ErrInvalidRating:
			return errorResponse(c, http.StatusBadRequest, "INVALID_RATING", "评分必须在 1-5 之间")
		default:
			return errorResponse(c, http.StatusInternalServerError, "UPDATE_FAILED", "更新评价失败")
		}
	}

	return successResponse(c, review)
}

// Delete 删除评价
// @Summary 删除评价
// @Tags Reviews
// @Security BearerAuth
// @Param id path string true "评价 ID"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/reviews/{id} [delete]
func (h *ReviewHandler) Delete(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "评价 ID 无效")
	}

	if err := h.reviewService.Delete(c.Request().Context(), id, uid); err != nil {
		switch err {
		case service.ErrReviewNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "评价不存在")
		case service.ErrUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权删除此评价")
		default:
			return errorResponse(c, http.StatusInternalServerError, "DELETE_FAILED", "删除评价失败")
		}
	}

	return successResponse(c, map[string]string{"message": "评价已删除"})
}

// MarkHelpful 标记评价有帮助
// @Summary 标记评价有帮助
// @Tags Reviews
// @Security BearerAuth
// @Param id path string true "评价 ID"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/reviews/{id}/helpful [post]
func (h *ReviewHandler) MarkHelpful(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "评价 ID 无效")
	}

	if err := h.reviewService.MarkHelpful(c.Request().Context(), id, uid); err != nil {
		switch err {
		case service.ErrReviewNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "评价不存在")
		case service.ErrUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "不能给自己的评价点赞")
		default:
			return errorResponse(c, http.StatusInternalServerError, "MARK_FAILED", "操作失败")
		}
	}

	return successResponse(c, map[string]string{"message": "已标记为有帮助"})
}

// GetMyReview 获取当前用户对某 Agent 的评价
// @Summary 获取当前用户对某 Agent 的评价
// @Tags Reviews
// @Security BearerAuth
// @Param agent_id path string true "Agent ID"
// @Success 200 {object} entity.Review
// @Router /api/v1/agents/{agent_id}/reviews/me [get]
func (h *ReviewHandler) GetMyReview(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	agentID, err := uuid.Parse(c.Param("agent_id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "Agent ID 无效")
	}

	review, err := h.reviewService.GetUserReview(c.Request().Context(), agentID, uid)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "GET_FAILED", "获取评价失败")
	}

	if review == nil {
		return successResponse(c, nil)
	}

	return successResponse(c, review)
}
