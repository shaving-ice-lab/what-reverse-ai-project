package service

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"net/url"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
)

var (
	ErrShareNotFound     = errors.New("share not found")
	ErrShareExpired      = errors.New("share has expired")
	ErrInvalidPassword   = errors.New("invalid share password")
	ErrShareUnauthorized = errors.New("unauthorized to modify this share")
)

// ShareService 分享服务接口
type ShareService interface {
	// 分享管理
	Create(ctx context.Context, req CreateShareRequest) (*ShareResponse, error)
	GetByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*ShareResponse, error)
	GetByCode(ctx context.Context, code string, password *string, viewerInfo *ViewerInfo) (*ShareDetailResponse, error)
	Update(ctx context.Context, id uuid.UUID, userID uuid.UUID, req UpdateShareRequest) (*ShareResponse, error)
	Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error
	List(ctx context.Context, userID uuid.UUID, page, pageSize int) (*ShareListResponse, error)

	// 生成各类分享内容
	GenerateShareLink(ctx context.Context, shareID uuid.UUID, baseURL string) (*ShareLinkResponse, error)
	GenerateQRCode(ctx context.Context, shareID uuid.UUID, baseURL string, size int) (*QRCodeResponse, error)
	GenerateEmbedCode(ctx context.Context, shareID uuid.UUID, baseURL string, options EmbedOptions) (*EmbedCodeResponse, error)
	GenerateSocialShare(ctx context.Context, shareID uuid.UUID, platform string, baseURL string) (*SocialShareResponse, error)

	// 统计
	GetStats(ctx context.Context, shareID uuid.UUID, userID uuid.UUID) (*ShareStatsResponse, error)
}

// CreateShareRequest 创建分享请求
type CreateShareRequest struct {
	UserID       uuid.UUID
	TargetType   string
	TargetID     uuid.UUID
	IsPublic     bool
	Password     *string
	ExpiresIn    *int // 过期时间（秒）
	AllowCopy    bool
	AllowComment bool
}

// UpdateShareRequest 更新分享请求
type UpdateShareRequest struct {
	IsPublic     *bool
	Password     *string
	ExpiresAt    *time.Time
	AllowCopy    *bool
	AllowComment *bool
}

// ViewerInfo 访问者信息
type ViewerInfo struct {
	UserID    *uuid.UUID
	IPAddress string
	UserAgent string
	Referer   string
}

// ShareResponse 分享响应
type ShareResponse struct {
	ID           uuid.UUID `json:"id"`
	TargetType   string    `json:"target_type"`
	TargetID     uuid.UUID `json:"target_id"`
	ShareCode    string    `json:"share_code"`
	ShareURL     string    `json:"share_url,omitempty"`
	IsPublic     bool      `json:"is_public"`
	HasPassword  bool      `json:"has_password"`
	ExpiresAt    *string   `json:"expires_at,omitempty"`
	AllowCopy    bool      `json:"allow_copy"`
	AllowComment bool      `json:"allow_comment"`
	ViewCount    int       `json:"view_count"`
	UniqueViews  int       `json:"unique_views"`
	CreatedAt    string    `json:"created_at"`
}

// ShareDetailResponse 分享详情响应（公开访问）
type ShareDetailResponse struct {
	ShareResponse
	TargetData interface{} `json:"target_data,omitempty"` // 分享目标的详细数据
}

// ShareListResponse 分享列表响应
type ShareListResponse struct {
	Items      []ShareResponse `json:"items"`
	Total      int64           `json:"total"`
	Page       int             `json:"page"`
	PageSize   int             `json:"page_size"`
	TotalPages int             `json:"total_pages"`
}

// ShareLinkResponse 分享链接响应
type ShareLinkResponse struct {
	URL       string `json:"url"`
	ShortURL  string `json:"short_url"`
	ShareCode string `json:"share_code"`
}

// QRCodeResponse 二维码响应
type QRCodeResponse struct {
	URL     string `json:"url"`      // 二维码图片 URL 或 Base64
	DataURL string `json:"data_url"` // Base64 Data URL
	Size    int    `json:"size"`
}

// EmbedOptions 嵌入选项
type EmbedOptions struct {
	Width  int    `json:"width"`
	Height int    `json:"height"`
	Theme  string `json:"theme"` // 'light', 'dark'
}

// EmbedCodeResponse 嵌入代码响应
type EmbedCodeResponse struct {
	IframeCode string `json:"iframe_code"`
	ScriptCode string `json:"script_code"`
	HTMLCode   string `json:"html_code"`
}

// SocialShareResponse 社交分享响应
type SocialShareResponse struct {
	Platform string `json:"platform"`
	ShareURL string `json:"share_url"`
	Title    string `json:"title"`
	Summary  string `json:"summary"`
	ImageURL string `json:"image_url,omitempty"`
}

// ShareStatsResponse 分享统计响应
type ShareStatsResponse struct {
	TotalViews  int64 `json:"total_views"`
	UniqueViews int64 `json:"unique_views"`
	TodayViews  int64 `json:"today_views"`
	WeekViews   int64 `json:"week_views"`
}

type shareService struct {
	shareRepo repository.ShareRepository
	userRepo  repository.UserRepository
}

// NewShareService 创建分享服务实例
func NewShareService(
	shareRepo repository.ShareRepository,
	userRepo repository.UserRepository,
) ShareService {
	return &shareService{
		shareRepo: shareRepo,
		userRepo:  userRepo,
	}
}

func (s *shareService) Create(ctx context.Context, req CreateShareRequest) (*ShareResponse, error) {
	// 验证目标类型
	if !entity.IsValidShareTargetType(req.TargetType) {
		return nil, ErrInvalidTargetType
	}

	// 检查是否已存在分享
	existing, err := s.shareRepo.GetByTarget(ctx, req.UserID, req.TargetType, req.TargetID)
	if err == nil && existing != nil {
		// 返回已存在的分享
		return s.toShareResponse(existing), nil
	}

	// 生成分享码
	shareCode, err := s.shareRepo.GenerateShareCode(ctx)
	if err != nil {
		return nil, err
	}

	share := &entity.Share{
		UserID:       req.UserID,
		TargetType:   req.TargetType,
		TargetID:     req.TargetID,
		ShareCode:    shareCode,
		IsPublic:     req.IsPublic,
		AllowCopy:    req.AllowCopy,
		AllowComment: req.AllowComment,
	}

	// 设置密码
	if req.Password != nil && *req.Password != "" {
		hashed := hashPassword(*req.Password)
		share.Password = &hashed
	}

	// 设置过期时间
	if req.ExpiresIn != nil && *req.ExpiresIn > 0 {
		expiresAt := time.Now().Add(time.Duration(*req.ExpiresIn) * time.Second)
		share.ExpiresAt = &expiresAt
	}

	if err := s.shareRepo.Create(ctx, share); err != nil {
		return nil, err
	}

	return s.toShareResponse(share), nil
}

func (s *shareService) GetByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*ShareResponse, error) {
	share, err := s.shareRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrShareNotFound) {
			return nil, ErrShareNotFound
		}
		return nil, err
	}

	// 检查权限
	if share.UserID != userID {
		return nil, ErrShareUnauthorized
	}

	return s.toShareResponse(share), nil
}

func (s *shareService) GetByCode(ctx context.Context, code string, password *string, viewerInfo *ViewerInfo) (*ShareDetailResponse, error) {
	share, err := s.shareRepo.GetByCode(ctx, code)
	if err != nil {
		if errors.Is(err, repository.ErrShareNotFound) {
			return nil, ErrShareNotFound
		}
		return nil, err
	}

	// 检查是否过期
	if share.IsExpired() {
		return nil, ErrShareExpired
	}

	// 检查密码
	if share.HasPassword() {
		if password == nil || *password == "" {
			return nil, ErrInvalidPassword
		}
		if hashPassword(*password) != *share.Password {
			return nil, ErrInvalidPassword
		}
	}

	// 记录访问
	if viewerInfo != nil {
		view := &entity.ShareView{
			ShareID:   share.ID,
			ViewerID:  viewerInfo.UserID,
			IPAddress: &viewerInfo.IPAddress,
			UserAgent: &viewerInfo.UserAgent,
			Referer:   &viewerInfo.Referer,
		}
		_ = s.shareRepo.CreateView(ctx, view)
	}

	resp := &ShareDetailResponse{
		ShareResponse: *s.toShareResponse(share),
	}

	// TODO: 根据 target_type 获取目标详细数据
	// resp.TargetData = ...

	return resp, nil
}

func (s *shareService) Update(ctx context.Context, id uuid.UUID, userID uuid.UUID, req UpdateShareRequest) (*ShareResponse, error) {
	share, err := s.shareRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrShareNotFound) {
			return nil, ErrShareNotFound
		}
		return nil, err
	}

	// 检查权限
	if share.UserID != userID {
		return nil, ErrShareUnauthorized
	}

	// 更新字段
	if req.IsPublic != nil {
		share.IsPublic = *req.IsPublic
	}
	if req.Password != nil {
		if *req.Password == "" {
			share.Password = nil
		} else {
			hashed := hashPassword(*req.Password)
			share.Password = &hashed
		}
	}
	if req.ExpiresAt != nil {
		share.ExpiresAt = req.ExpiresAt
	}
	if req.AllowCopy != nil {
		share.AllowCopy = *req.AllowCopy
	}
	if req.AllowComment != nil {
		share.AllowComment = *req.AllowComment
	}

	if err := s.shareRepo.Update(ctx, share); err != nil {
		return nil, err
	}

	return s.toShareResponse(share), nil
}

func (s *shareService) Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	share, err := s.shareRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrShareNotFound) {
			return ErrShareNotFound
		}
		return err
	}

	// 检查权限
	if share.UserID != userID {
		return ErrShareUnauthorized
	}

	return s.shareRepo.Delete(ctx, id)
}

func (s *shareService) List(ctx context.Context, userID uuid.UUID, page, pageSize int) (*ShareListResponse, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	shares, total, err := s.shareRepo.ListByUser(ctx, userID, page, pageSize)
	if err != nil {
		return nil, err
	}

	items := make([]ShareResponse, len(shares))
	for i, share := range shares {
		items[i] = *s.toShareResponse(&share)
	}

	totalPages := int(total) / pageSize
	if int(total)%pageSize > 0 {
		totalPages++
	}

	return &ShareListResponse{
		Items:      items,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}, nil
}

func (s *shareService) GenerateShareLink(ctx context.Context, shareID uuid.UUID, baseURL string) (*ShareLinkResponse, error) {
	share, err := s.shareRepo.GetByID(ctx, shareID)
	if err != nil {
		return nil, err
	}

	shareURL := fmt.Sprintf("%s/s/%s", baseURL, share.ShareCode)

	return &ShareLinkResponse{
		URL:       shareURL,
		ShortURL:  shareURL,
		ShareCode: share.ShareCode,
	}, nil
}

func (s *shareService) GenerateQRCode(ctx context.Context, shareID uuid.UUID, baseURL string, size int) (*QRCodeResponse, error) {
	share, err := s.shareRepo.GetByID(ctx, shareID)
	if err != nil {
		return nil, err
	}

	if size < 100 {
		size = 200
	}
	if size > 1000 {
		size = 1000
	}

	shareURL := fmt.Sprintf("%s/s/%s", baseURL, share.ShareCode)

	// 使用第三方服务生成二维码 (如 QRCode API)
	qrURL := fmt.Sprintf("https://api.qrserver.com/v1/create-qr-code/?size=%dx%d&data=%s",
		size, size, url.QueryEscape(shareURL))

	return &QRCodeResponse{
		URL:     qrURL,
		DataURL: qrURL, // 可以转换为 base64
		Size:    size,
	}, nil
}

func (s *shareService) GenerateEmbedCode(ctx context.Context, shareID uuid.UUID, baseURL string, options EmbedOptions) (*EmbedCodeResponse, error) {
	share, err := s.shareRepo.GetByID(ctx, shareID)
	if err != nil {
		return nil, err
	}

	if options.Width < 300 {
		options.Width = 800
	}
	if options.Height < 200 {
		options.Height = 600
	}
	if options.Theme == "" {
		options.Theme = "light"
	}

	embedURL := fmt.Sprintf("%s/embed/%s?theme=%s", baseURL, share.ShareCode, options.Theme)

	iframeCode := fmt.Sprintf(
		`<iframe src="%s" width="%d" height="%d" frameborder="0" allowfullscreen></iframe>`,
		embedURL, options.Width, options.Height,
	)

	scriptCode := fmt.Sprintf(
		`<div id="agentflow-embed-%s"></div>
<script src="%s/embed.js" data-share-code="%s" data-theme="%s"></script>`,
		share.ShareCode, baseURL, share.ShareCode, options.Theme,
	)

	htmlCode := fmt.Sprintf(
		`<a href="%s/s/%s" target="_blank">在 AgentFlow 中查看</a>`,
		baseURL, share.ShareCode,
	)

	return &EmbedCodeResponse{
		IframeCode: iframeCode,
		ScriptCode: scriptCode,
		HTMLCode:   htmlCode,
	}, nil
}

func (s *shareService) GenerateSocialShare(ctx context.Context, shareID uuid.UUID, platform string, baseURL string) (*SocialShareResponse, error) {
	share, err := s.shareRepo.GetByID(ctx, shareID)
	if err != nil {
		return nil, err
	}

	if !entity.IsValidSocialPlatform(platform) {
		return nil, errors.New("invalid social platform")
	}

	shareURL := fmt.Sprintf("%s/s/%s", baseURL, share.ShareCode)
	title := "查看我在 AgentFlow 上的分享"
	summary := "点击链接查看详情"

	var socialURL string
	switch entity.SocialPlatform(platform) {
	case entity.PlatformWeChat:
		// 微信需要在客户端处理
		socialURL = shareURL
	case entity.PlatformWeibo:
		socialURL = fmt.Sprintf("https://service.weibo.com/share/share.php?url=%s&title=%s",
			url.QueryEscape(shareURL), url.QueryEscape(title))
	case entity.PlatformQQ:
		socialURL = fmt.Sprintf("https://connect.qq.com/widget/shareqq/index.html?url=%s&title=%s&summary=%s",
			url.QueryEscape(shareURL), url.QueryEscape(title), url.QueryEscape(summary))
	case entity.PlatformTwitter:
		socialURL = fmt.Sprintf("https://twitter.com/intent/tweet?url=%s&text=%s",
			url.QueryEscape(shareURL), url.QueryEscape(title))
	case entity.PlatformFacebook:
		socialURL = fmt.Sprintf("https://www.facebook.com/sharer/sharer.php?u=%s",
			url.QueryEscape(shareURL))
	case entity.PlatformLinkedIn:
		socialURL = fmt.Sprintf("https://www.linkedin.com/sharing/share-offsite/?url=%s",
			url.QueryEscape(shareURL))
	}

	return &SocialShareResponse{
		Platform: platform,
		ShareURL: socialURL,
		Title:    title,
		Summary:  summary,
	}, nil
}

func (s *shareService) GetStats(ctx context.Context, shareID uuid.UUID, userID uuid.UUID) (*ShareStatsResponse, error) {
	share, err := s.shareRepo.GetByID(ctx, shareID)
	if err != nil {
		return nil, err
	}

	// 检查权限
	if share.UserID != userID {
		return nil, ErrShareUnauthorized
	}

	stats, err := s.shareRepo.GetViewStats(ctx, shareID)
	if err != nil {
		return nil, err
	}

	return &ShareStatsResponse{
		TotalViews:  stats.TotalViews,
		UniqueViews: stats.UniqueViews,
		TodayViews:  stats.TodayViews,
		WeekViews:   stats.WeekViews,
	}, nil
}

// toShareResponse 转换为响应格式
func (s *shareService) toShareResponse(share *entity.Share) *ShareResponse {
	resp := &ShareResponse{
		ID:           share.ID,
		TargetType:   share.TargetType,
		TargetID:     share.TargetID,
		ShareCode:    share.ShareCode,
		IsPublic:     share.IsPublic,
		HasPassword:  share.HasPassword(),
		AllowCopy:    share.AllowCopy,
		AllowComment: share.AllowComment,
		ViewCount:    share.ViewCount,
		UniqueViews:  share.UniqueViews,
		CreatedAt:    share.CreatedAt.Format("2006-01-02T15:04:05Z"),
	}

	if share.ExpiresAt != nil {
		expiresAt := share.ExpiresAt.Format("2006-01-02T15:04:05Z")
		resp.ExpiresAt = &expiresAt
	}

	return resp
}

// hashPassword 简单密码哈希
func hashPassword(password string) string {
	hash := sha256.Sum256([]byte(password))
	return hex.EncodeToString(hash[:])
}
