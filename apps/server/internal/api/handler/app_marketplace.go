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

type AppMarketplaceHandler struct {
	marketplaceService service.AppMarketplaceService
}

func NewAppMarketplaceHandler(marketplaceService service.AppMarketplaceService) *AppMarketplaceHandler {
	return &AppMarketplaceHandler{marketplaceService: marketplaceService}
}

type SubmitAppRatingRequest struct {
	Rating  int     `json:"rating"`
	Comment *string `json:"comment"`
}

// ListApps 获取应用市场应用列表
func (h *AppMarketplaceHandler) ListApps(c echo.Context) error {
	page, _ := strconv.Atoi(c.QueryParam("page"))
	pageSize, _ := strconv.Atoi(c.QueryParam("page_size"))
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 12
	}

	params := service.MarketplaceListParams{
		Search:   c.QueryParam("search"),
		Pricing:  c.QueryParam("pricing"),
		Sort:     c.QueryParam("sort"),
		Page:     page,
		PageSize: pageSize,
	}

	apps, total, err := h.marketplaceService.ListApps(c.Request().Context(), params)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取应用市场列表失败")
	}

	return successResponseWithMeta(c, map[string]interface{}{
		"apps": apps,
	}, map[string]interface{}{
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// GetApp 获取应用市场应用详情
func (h *AppMarketplaceHandler) GetApp(c echo.Context) error {
	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "应用 ID 无效")
	}

	app, err := h.marketplaceService.GetApp(c.Request().Context(), appID)
	if err != nil {
		switch err {
		case service.ErrMarketplaceAppNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "应用不存在或未公开")
		default:
			return errorResponse(c, http.StatusInternalServerError, "GET_FAILED", "获取应用详情失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"app": app,
	})
}

// ListRatings 获取应用评分列表
func (h *AppMarketplaceHandler) ListRatings(c echo.Context) error {
	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "应用 ID 无效")
	}

	page, _ := strconv.Atoi(c.QueryParam("page"))
	pageSize, _ := strconv.Atoi(c.QueryParam("page_size"))
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 10
	}

	params := repository.AppRatingListParams{
		Page:     page,
		PageSize: pageSize,
		Sort:     c.QueryParam("sort"),
	}

	ratings, total, err := h.marketplaceService.ListRatings(c.Request().Context(), appID, params)
	if err != nil {
		switch err {
		case service.ErrMarketplaceAppNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "应用不存在或未公开")
		default:
			return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取评分列表失败")
		}
	}

	return successResponseWithMeta(c, map[string]interface{}{
		"ratings": ratings,
	}, map[string]interface{}{
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// SubmitRating 提交应用评分
func (h *AppMarketplaceHandler) SubmitRating(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "应用 ID 无效")
	}

	var req SubmitAppRatingRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	rating, err := h.marketplaceService.SubmitRating(c.Request().Context(), appID, uid, service.SubmitAppRatingRequest{
		Rating:  req.Rating,
		Comment: req.Comment,
	})
	if err != nil {
		switch err {
		case service.ErrMarketplaceAppNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "应用不存在或未公开")
		case service.ErrMarketplaceRatingInvalid:
			return errorResponse(c, http.StatusBadRequest, "INVALID_RATING", "评分需为 1-5 分")
		case service.ErrMarketplaceRatingOwn:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "不能评价自己的应用")
		case service.ErrMarketplaceCommentTooLong:
			return errorResponse(c, http.StatusBadRequest, "COMMENT_TOO_LONG", "评价内容过长")
		default:
			return errorResponse(c, http.StatusInternalServerError, "SUBMIT_FAILED", "提交评分失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"rating": rating,
	})
}
