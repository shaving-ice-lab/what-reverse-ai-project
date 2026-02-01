package handler

import (
	"net/http"
	"strconv"

	"github.com/agentflow/server/internal/api/middleware"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// ShareHandler 分享处理器
type ShareHandler struct {
	shareService service.ShareService
	baseURL      string
}

// NewShareHandler 创建分享处理器实例
func NewShareHandler(shareService service.ShareService, baseURL string) *ShareHandler {
	return &ShareHandler{
		shareService: shareService,
		baseURL:      baseURL,
	}
}

// CreateShareRequest 创建分享请求
type CreateShareRequest struct {
	TargetType   string  `json:"target_type" validate:"required"`
	TargetID     string  `json:"target_id" validate:"required"`
	IsPublic     bool    `json:"is_public"`
	Password     *string `json:"password,omitempty"`
	ExpiresIn    *int    `json:"expires_in,omitempty"` // 秒
	AllowCopy    bool    `json:"allow_copy"`
	AllowComment bool    `json:"allow_comment"`
}

// UpdateShareRequest 更新分享请求
type UpdateShareRequest struct {
	IsPublic     *bool   `json:"is_public,omitempty"`
	Password     *string `json:"password,omitempty"`
	ExpiresAt    *string `json:"expires_at,omitempty"`
	AllowCopy    *bool   `json:"allow_copy,omitempty"`
	AllowComment *bool   `json:"allow_comment,omitempty"`
}

// AccessShareRequest 访问分享请求
type AccessShareRequest struct {
	Password *string `json:"password,omitempty"`
}

// EmbedOptionsRequest 嵌入选项请求
type EmbedOptionsRequest struct {
	Width  int    `json:"width"`
	Height int    `json:"height"`
	Theme  string `json:"theme"`
}

// Create 创建分享
// @Summary 创建分享链接
// @Tags 分享
// @Accept json
// @Produce json
// @Param body body CreateShareRequest true "分享设置"
// @Success 200 {object} service.ShareResponse
// @Router /api/v1/shares [post]
func (h *ShareHandler) Create(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var req CreateShareRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	targetID, err := uuid.Parse(req.TargetID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_TARGET_ID", "目标 ID 无效")
	}

	share, err := h.shareService.Create(c.Request().Context(), service.CreateShareRequest{
		UserID:       uid,
		TargetType:   req.TargetType,
		TargetID:     targetID,
		IsPublic:     req.IsPublic,
		Password:     req.Password,
		ExpiresIn:    req.ExpiresIn,
		AllowCopy:    req.AllowCopy,
		AllowComment: req.AllowComment,
	})
	if err != nil {
		if err == service.ErrInvalidTargetType {
			return errorResponse(c, http.StatusBadRequest, "INVALID_TARGET_TYPE", "无效的目标类型")
		}
		return errorResponse(c, http.StatusInternalServerError, "CREATE_FAILED", "创建分享失败")
	}

	// 添加分享链接
	share.ShareURL = h.baseURL + "/s/" + share.ShareCode

	return successResponse(c, share)
}

// Get 获取分享详情（所有者）
// @Summary 获取分享详情
// @Tags 分享
// @Accept json
// @Produce json
// @Param id path string true "分享 ID"
// @Success 200 {object} service.ShareResponse
// @Router /api/v1/shares/{id} [get]
func (h *ShareHandler) Get(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	shareID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_SHARE_ID", "分享 ID 无效")
	}

	share, err := h.shareService.GetByID(c.Request().Context(), shareID, uid)
	if err != nil {
		switch err {
		case service.ErrShareNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "分享不存在")
		case service.ErrShareUnauthorized:
			return errorResponse(c, http.StatusForbidden, "UNAUTHORIZED", "无权访问此分享")
		default:
			return errorResponse(c, http.StatusInternalServerError, "GET_FAILED", "获取分享失败")
		}
	}

	share.ShareURL = h.baseURL + "/s/" + share.ShareCode

	return successResponse(c, share)
}

// GetByCode 通过分享码访问（公开）
// @Summary 通过分享码访问
// @Tags 分享
// @Accept json
// @Produce json
// @Param code path string true "分享码"
// @Param body body AccessShareRequest false "访问密码"
// @Success 200 {object} service.ShareDetailResponse
// @Router /api/v1/s/{code} [post]
func (h *ShareHandler) GetByCode(c echo.Context) error {
	code := c.Param("code")

	var req AccessShareRequest
	c.Bind(&req) // 密码是可选的

	// 获取访问者信息
	viewerInfo := &service.ViewerInfo{
		IPAddress: c.RealIP(),
		UserAgent: c.Request().UserAgent(),
		Referer:   c.Request().Referer(),
	}

	// 如果用户已登录，记录用户 ID
	if userID := middleware.GetUserID(c); userID != "" {
		if uid, err := uuid.Parse(userID); err == nil {
			viewerInfo.UserID = &uid
		}
	}

	share, err := h.shareService.GetByCode(c.Request().Context(), code, req.Password, viewerInfo)
	if err != nil {
		switch err {
		case service.ErrShareNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "分享不存在")
		case service.ErrShareExpired:
			return errorResponse(c, http.StatusGone, "EXPIRED", "分享已过期")
		case service.ErrInvalidPassword:
			return errorResponse(c, http.StatusUnauthorized, "INVALID_PASSWORD", "密码错误")
		default:
			return errorResponse(c, http.StatusInternalServerError, "ACCESS_FAILED", "访问分享失败")
		}
	}

	return successResponse(c, share)
}

// Update 更新分享设置
// @Summary 更新分享设置
// @Tags 分享
// @Accept json
// @Produce json
// @Param id path string true "分享 ID"
// @Param body body UpdateShareRequest true "更新设置"
// @Success 200 {object} service.ShareResponse
// @Router /api/v1/shares/{id} [put]
func (h *ShareHandler) Update(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	shareID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_SHARE_ID", "分享 ID 无效")
	}

	var req UpdateShareRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	updateReq := service.UpdateShareRequest{
		IsPublic:     req.IsPublic,
		Password:     req.Password,
		AllowCopy:    req.AllowCopy,
		AllowComment: req.AllowComment,
	}

	share, err := h.shareService.Update(c.Request().Context(), shareID, uid, updateReq)
	if err != nil {
		switch err {
		case service.ErrShareNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "分享不存在")
		case service.ErrShareUnauthorized:
			return errorResponse(c, http.StatusForbidden, "UNAUTHORIZED", "无权修改此分享")
		default:
			return errorResponse(c, http.StatusInternalServerError, "UPDATE_FAILED", "更新分享失败")
		}
	}

	return successResponse(c, share)
}

// Delete 删除分享
// @Summary 删除分享
// @Tags 分享
// @Accept json
// @Produce json
// @Param id path string true "分享 ID"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/shares/{id} [delete]
func (h *ShareHandler) Delete(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	shareID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_SHARE_ID", "分享 ID 无效")
	}

	if err := h.shareService.Delete(c.Request().Context(), shareID, uid); err != nil {
		switch err {
		case service.ErrShareNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "分享不存在")
		case service.ErrShareUnauthorized:
			return errorResponse(c, http.StatusForbidden, "UNAUTHORIZED", "无权删除此分享")
		default:
			return errorResponse(c, http.StatusInternalServerError, "DELETE_FAILED", "删除分享失败")
		}
	}

	return successResponse(c, map[string]string{"message": "分享已删除"})
}

// List 获取分享列表
// @Summary 获取我的分享列表
// @Tags 分享
// @Accept json
// @Produce json
// @Param page query int false "页码" default(1)
// @Param page_size query int false "每页数量" default(20)
// @Success 200 {object} service.ShareListResponse
// @Router /api/v1/shares [get]
func (h *ShareHandler) List(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	page, _ := strconv.Atoi(c.QueryParam("page"))
	pageSize, _ := strconv.Atoi(c.QueryParam("page_size"))

	result, err := h.shareService.List(c.Request().Context(), uid, page, pageSize)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取分享列表失败")
	}

	// 添加分享链接
	for i := range result.Items {
		result.Items[i].ShareURL = h.baseURL + "/s/" + result.Items[i].ShareCode
	}

	return successResponse(c, result)
}

// GenerateLink 生成分享链接
// @Summary 生成分享链接
// @Tags 分享
// @Accept json
// @Produce json
// @Param id path string true "分享 ID"
// @Success 200 {object} service.ShareLinkResponse
// @Router /api/v1/shares/{id}/link [get]
func (h *ShareHandler) GenerateLink(c echo.Context) error {
	shareID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_SHARE_ID", "分享 ID 无效")
	}

	link, err := h.shareService.GenerateShareLink(c.Request().Context(), shareID, h.baseURL)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "GENERATE_FAILED", "生成链接失败")
	}

	return successResponse(c, link)
}

// GenerateQRCode 生成二维码
// @Summary 生成分享二维码
// @Tags 分享
// @Accept json
// @Produce json
// @Param id path string true "分享 ID"
// @Param size query int false "二维码尺寸" default(200)
// @Success 200 {object} service.QRCodeResponse
// @Router /api/v1/shares/{id}/qrcode [get]
func (h *ShareHandler) GenerateQRCode(c echo.Context) error {
	shareID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_SHARE_ID", "分享 ID 无效")
	}

	size, _ := strconv.Atoi(c.QueryParam("size"))
	if size < 100 {
		size = 200
	}

	qrCode, err := h.shareService.GenerateQRCode(c.Request().Context(), shareID, h.baseURL, size)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "GENERATE_FAILED", "生成二维码失败")
	}

	return successResponse(c, qrCode)
}

// GenerateEmbed 生成嵌入代码
// @Summary 生成嵌入代码
// @Tags 分享
// @Accept json
// @Produce json
// @Param id path string true "分享 ID"
// @Param body body EmbedOptionsRequest false "嵌入选项"
// @Success 200 {object} service.EmbedCodeResponse
// @Router /api/v1/shares/{id}/embed [post]
func (h *ShareHandler) GenerateEmbed(c echo.Context) error {
	shareID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_SHARE_ID", "分享 ID 无效")
	}

	var req EmbedOptionsRequest
	c.Bind(&req)

	embed, err := h.shareService.GenerateEmbedCode(c.Request().Context(), shareID, h.baseURL, service.EmbedOptions{
		Width:  req.Width,
		Height: req.Height,
		Theme:  req.Theme,
	})
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "GENERATE_FAILED", "生成嵌入代码失败")
	}

	return successResponse(c, embed)
}

// GenerateSocial 生成社交分享
// @Summary 生成社交平台分享链接
// @Tags 分享
// @Accept json
// @Produce json
// @Param id path string true "分享 ID"
// @Param platform query string true "平台 (wechat/weibo/qq/twitter/facebook/linkedin)"
// @Success 200 {object} service.SocialShareResponse
// @Router /api/v1/shares/{id}/social [get]
func (h *ShareHandler) GenerateSocial(c echo.Context) error {
	shareID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_SHARE_ID", "分享 ID 无效")
	}

	platform := c.QueryParam("platform")
	if platform == "" {
		return errorResponse(c, http.StatusBadRequest, "MISSING_PLATFORM", "缺少平台参数")
	}

	social, err := h.shareService.GenerateSocialShare(c.Request().Context(), shareID, platform, h.baseURL)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "GENERATE_FAILED", "生成社交分享失败")
	}

	return successResponse(c, social)
}

// GetStats 获取分享统计
// @Summary 获取分享统计数据
// @Tags 分享
// @Accept json
// @Produce json
// @Param id path string true "分享 ID"
// @Success 200 {object} service.ShareStatsResponse
// @Router /api/v1/shares/{id}/stats [get]
func (h *ShareHandler) GetStats(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	shareID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_SHARE_ID", "分享 ID 无效")
	}

	stats, err := h.shareService.GetStats(c.Request().Context(), shareID, uid)
	if err != nil {
		switch err {
		case service.ErrShareNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "分享不存在")
		case service.ErrShareUnauthorized:
			return errorResponse(c, http.StatusForbidden, "UNAUTHORIZED", "无权查看统计")
		default:
			return errorResponse(c, http.StatusInternalServerError, "GET_STATS_FAILED", "获取统计失败")
		}
	}

	return successResponse(c, stats)
}
