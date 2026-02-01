package handler

import (
	"net/http"
	"strconv"

	"github.com/agentflow/server/internal/api/middleware"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// FollowHandler 关注处理器
type FollowHandler struct {
	followService service.FollowService
}

// NewFollowHandler 创建关注处理器实例
func NewFollowHandler(followService service.FollowService) *FollowHandler {
	return &FollowHandler{
		followService: followService,
	}
}

// Follow 关注用户
// @Summary 关注用户
// @Tags 社交
// @Accept json
// @Produce json
// @Param id path string true "用户 ID"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/users/{id}/follow [post]
func (h *FollowHandler) Follow(c echo.Context) error {
	userID := middleware.GetUserID(c)
	followerID, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	followingID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_TARGET_ID", "目标用户 ID 无效")
	}

	if err := h.followService.Follow(c.Request().Context(), followerID, followingID); err != nil {
		switch err {
		case service.ErrCannotFollowSelf:
			return errorResponse(c, http.StatusBadRequest, "CANNOT_FOLLOW_SELF", "不能关注自己")
		case service.ErrAlreadyFollowing:
			return errorResponse(c, http.StatusBadRequest, "ALREADY_FOLLOWING", "已经关注该用户")
		case service.ErrUserNotFound:
			return errorResponse(c, http.StatusNotFound, "USER_NOT_FOUND", "用户不存在")
		default:
			return errorResponse(c, http.StatusInternalServerError, "FOLLOW_FAILED", "关注失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"message":      "关注成功",
		"is_following": true,
	})
}

// Unfollow 取消关注
// @Summary 取消关注用户
// @Tags 社交
// @Accept json
// @Produce json
// @Param id path string true "用户 ID"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/users/{id}/follow [delete]
func (h *FollowHandler) Unfollow(c echo.Context) error {
	userID := middleware.GetUserID(c)
	followerID, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	followingID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_TARGET_ID", "目标用户 ID 无效")
	}

	if err := h.followService.Unfollow(c.Request().Context(), followerID, followingID); err != nil {
		if err == service.ErrNotFollowing {
			return errorResponse(c, http.StatusBadRequest, "NOT_FOLLOWING", "未关注该用户")
		}
		return errorResponse(c, http.StatusInternalServerError, "UNFOLLOW_FAILED", "取消关注失败")
	}

	return successResponse(c, map[string]interface{}{
		"message":      "取消关注成功",
		"is_following": false,
	})
}

// GetFollowers 获取粉丝列表
// @Summary 获取用户的粉丝列表
// @Tags 社交
// @Accept json
// @Produce json
// @Param id path string true "用户 ID"
// @Param page query int false "页码" default(1)
// @Param page_size query int false "每页数量" default(20)
// @Success 200 {object} service.FollowListResponse
// @Router /api/v1/users/{id}/followers [get]
func (h *FollowHandler) GetFollowers(c echo.Context) error {
	targetUserID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	page, _ := strconv.Atoi(c.QueryParam("page"))
	pageSize, _ := strconv.Atoi(c.QueryParam("page_size"))

	result, err := h.followService.GetFollowers(c.Request().Context(), targetUserID, page, pageSize)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "GET_FOLLOWERS_FAILED", "获取粉丝列表失败")
	}

	return successResponse(c, result)
}

// GetFollowing 获取关注列表
// @Summary 获取用户的关注列表
// @Tags 社交
// @Accept json
// @Produce json
// @Param id path string true "用户 ID"
// @Param page query int false "页码" default(1)
// @Param page_size query int false "每页数量" default(20)
// @Success 200 {object} service.FollowListResponse
// @Router /api/v1/users/{id}/following [get]
func (h *FollowHandler) GetFollowing(c echo.Context) error {
	targetUserID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	page, _ := strconv.Atoi(c.QueryParam("page"))
	pageSize, _ := strconv.Atoi(c.QueryParam("page_size"))

	result, err := h.followService.GetFollowing(c.Request().Context(), targetUserID, page, pageSize)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "GET_FOLLOWING_FAILED", "获取关注列表失败")
	}

	return successResponse(c, result)
}

// GetMyFollowers 获取当前用户的粉丝列表
// @Summary 获取当前用户的粉丝列表
// @Tags 社交
// @Accept json
// @Produce json
// @Param page query int false "页码" default(1)
// @Param page_size query int false "每页数量" default(20)
// @Success 200 {object} service.FollowListResponse
// @Router /api/v1/users/me/followers [get]
func (h *FollowHandler) GetMyFollowers(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	page, _ := strconv.Atoi(c.QueryParam("page"))
	pageSize, _ := strconv.Atoi(c.QueryParam("page_size"))

	result, err := h.followService.GetFollowers(c.Request().Context(), uid, page, pageSize)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "GET_FOLLOWERS_FAILED", "获取粉丝列表失败")
	}

	return successResponse(c, result)
}

// GetMyFollowing 获取当前用户的关注列表
// @Summary 获取当前用户的关注列表
// @Tags 社交
// @Accept json
// @Produce json
// @Param page query int false "页码" default(1)
// @Param page_size query int false "每页数量" default(20)
// @Success 200 {object} service.FollowListResponse
// @Router /api/v1/users/me/following [get]
func (h *FollowHandler) GetMyFollowing(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	page, _ := strconv.Atoi(c.QueryParam("page"))
	pageSize, _ := strconv.Atoi(c.QueryParam("page_size"))

	result, err := h.followService.GetFollowing(c.Request().Context(), uid, page, pageSize)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "GET_FOLLOWING_FAILED", "获取关注列表失败")
	}

	return successResponse(c, result)
}

// GetMutualFollowers 获取互相关注列表
// @Summary 获取互相关注的用户列表
// @Tags 社交
// @Accept json
// @Produce json
// @Param page query int false "页码" default(1)
// @Param page_size query int false "每页数量" default(20)
// @Success 200 {object} service.FollowListResponse
// @Router /api/v1/users/me/mutual [get]
func (h *FollowHandler) GetMutualFollowers(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	page, _ := strconv.Atoi(c.QueryParam("page"))
	pageSize, _ := strconv.Atoi(c.QueryParam("page_size"))

	result, err := h.followService.GetMutualFollowers(c.Request().Context(), uid, page, pageSize)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "GET_MUTUAL_FAILED", "获取互相关注列表失败")
	}

	return successResponse(c, result)
}

// GetFollowStats 获取关注统计
// @Summary 获取用户的关注统计
// @Tags 社交
// @Accept json
// @Produce json
// @Param id path string true "用户 ID"
// @Success 200 {object} service.FollowStats
// @Router /api/v1/users/{id}/follow-stats [get]
func (h *FollowHandler) GetFollowStats(c echo.Context) error {
	targetUserID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	stats, err := h.followService.GetFollowStats(c.Request().Context(), targetUserID)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "GET_STATS_FAILED", "获取统计失败")
	}

	return successResponse(c, stats)
}

// CheckFollowStatus 检查关注状态
// @Summary 检查当前用户是否关注了目标用户
// @Tags 社交
// @Accept json
// @Produce json
// @Param id path string true "目标用户 ID"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/users/{id}/follow-status [get]
func (h *FollowHandler) CheckFollowStatus(c echo.Context) error {
	userID := middleware.GetUserID(c)
	followerID, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	followingID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_TARGET_ID", "目标用户 ID 无效")
	}

	isFollowing, err := h.followService.IsFollowing(c.Request().Context(), followerID, followingID)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "CHECK_FAILED", "检查关注状态失败")
	}

	isFollowedBy, err := h.followService.IsFollowing(c.Request().Context(), followingID, followerID)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "CHECK_FAILED", "检查关注状态失败")
	}

	return successResponse(c, map[string]interface{}{
		"is_following":   isFollowing,
		"is_followed_by": isFollowedBy,
		"is_mutual":      isFollowing && isFollowedBy,
	})
}

// GetFollowingActivity 获取关注用户的动态
// @Summary 获取关注用户的动态列表
// @Tags 社交
// @Accept json
// @Produce json
// @Param page query int false "页码" default(1)
// @Param page_size query int false "每页数量" default(20)
// @Success 200 {object} service.ActivityListResponse
// @Router /api/v1/users/me/feed [get]
func (h *FollowHandler) GetFollowingActivity(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	page, _ := strconv.Atoi(c.QueryParam("page"))
	pageSize, _ := strconv.Atoi(c.QueryParam("page_size"))

	result, err := h.followService.GetFollowingActivity(c.Request().Context(), uid, page, pageSize)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "GET_FEED_FAILED", "获取动态失败")
	}

	return successResponse(c, result)
}
