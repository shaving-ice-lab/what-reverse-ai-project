package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var (
	ErrMarketplaceAppNotFound    = errors.New("marketplace app not found")
	ErrMarketplaceRatingInvalid  = errors.New("rating must be between 1 and 5")
	ErrMarketplaceRatingOwn      = errors.New("cannot rate your own app")
	ErrMarketplaceCommentTooLong = errors.New("comment too long")
)

// MarketplaceApp 应用市场应用信息
type MarketplaceApp struct {
	ID          uuid.UUID  `json:"id"`
	Name        string     `json:"name"`
	Slug        string     `json:"slug"`
	Icon        string     `json:"icon"`
	Description *string    `json:"description"`
	PricingType string     `json:"pricing_type"`
	Price       *float64   `json:"price"`
	PublishedAt *time.Time `json:"published_at"`
	AccessMode  string     `json:"access_mode"`
	Workspace   struct {
		ID   uuid.UUID `json:"id"`
		Name string    `json:"name"`
		Slug string    `json:"slug"`
		Icon *string   `json:"icon"`
	} `json:"workspace"`
	RatingAvg   float64 `json:"rating_avg"`
	RatingCount int64   `json:"rating_count"`
}

// MarketplaceListParams 应用市场列表参数
type MarketplaceListParams struct {
	Search   string
	Pricing  string
	Sort     string
	Page     int
	PageSize int
}

// SubmitAppRatingRequest 提交评分请求
type SubmitAppRatingRequest struct {
	Rating  int
	Comment *string
}

// AppMarketplaceService 应用市场服务接口
type AppMarketplaceService interface {
	ListApps(ctx context.Context, params MarketplaceListParams) ([]MarketplaceApp, int64, error)
	GetApp(ctx context.Context, appID uuid.UUID) (*MarketplaceApp, error)
	ListRatings(ctx context.Context, appID uuid.UUID, params repository.AppRatingListParams) ([]entity.AppRating, int64, error)
	SubmitRating(ctx context.Context, appID, userID uuid.UUID, req SubmitAppRatingRequest) (*entity.AppRating, error)
	GetRatingStats(ctx context.Context, appID uuid.UUID) (repository.AppRatingStats, error)
}

type appMarketplaceService struct {
	marketplaceRepo repository.AppMarketplaceRepository
	ratingRepo      repository.AppRatingRepository
}

// NewAppMarketplaceService 创建应用市场服务实例
func NewAppMarketplaceService(
	marketplaceRepo repository.AppMarketplaceRepository,
	ratingRepo repository.AppRatingRepository,
) AppMarketplaceService {
	return &appMarketplaceService{
		marketplaceRepo: marketplaceRepo,
		ratingRepo:      ratingRepo,
	}
}

func (s *appMarketplaceService) ListApps(ctx context.Context, params MarketplaceListParams) ([]MarketplaceApp, int64, error) {
	rows, total, err := s.marketplaceRepo.ListPublished(ctx, repository.MarketplaceListParams{
		Search:   params.Search,
		Pricing:  params.Pricing,
		Sort:     params.Sort,
		Page:     params.Page,
		PageSize: params.PageSize,
	})
	if err != nil {
		return nil, 0, err
	}

	apps := make([]MarketplaceApp, 0, len(rows))
	for _, row := range rows {
		apps = append(apps, mapMarketplaceRow(row))
	}
	return apps, total, nil
}

func (s *appMarketplaceService) GetApp(ctx context.Context, appID uuid.UUID) (*MarketplaceApp, error) {
	row, err := s.marketplaceRepo.GetPublishedByID(ctx, appID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrMarketplaceAppNotFound
		}
		return nil, err
	}
	app := mapMarketplaceRow(*row)
	return &app, nil
}

func (s *appMarketplaceService) ListRatings(ctx context.Context, appID uuid.UUID, params repository.AppRatingListParams) ([]entity.AppRating, int64, error) {
	if _, err := s.marketplaceRepo.GetPublishedByID(ctx, appID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, 0, ErrMarketplaceAppNotFound
		}
		return nil, 0, err
	}
	return s.ratingRepo.ListByApp(ctx, appID, params)
}

func (s *appMarketplaceService) SubmitRating(ctx context.Context, appID, userID uuid.UUID, req SubmitAppRatingRequest) (*entity.AppRating, error) {
	row, err := s.marketplaceRepo.GetPublishedByID(ctx, appID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrMarketplaceAppNotFound
		}
		return nil, err
	}
	if row.OwnerUserID == userID {
		return nil, ErrMarketplaceRatingOwn
	}

	if req.Rating < 1 || req.Rating > 5 {
		return nil, ErrMarketplaceRatingInvalid
	}

	if req.Comment != nil {
		trimmed := strings.TrimSpace(*req.Comment)
		if trimmed == "" {
			req.Comment = nil
		} else if len(trimmed) > 2000 {
			return nil, ErrMarketplaceCommentTooLong
		} else {
			req.Comment = &trimmed
		}
	}

	existing, err := s.ratingRepo.GetByAppAndUser(ctx, appID, userID)
	if err == nil && existing != nil {
		existing.Rating = req.Rating
		existing.Comment = req.Comment
		if err := s.ratingRepo.Update(ctx, existing); err != nil {
			return nil, err
		}
		return existing, nil
	}
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	rating := &entity.AppRating{
		AppID:   appID,
		UserID:  userID,
		Rating:  req.Rating,
		Comment: req.Comment,
	}
	if err := s.ratingRepo.Create(ctx, rating); err != nil {
		return nil, err
	}
	return rating, nil
}

func (s *appMarketplaceService) GetRatingStats(ctx context.Context, appID uuid.UUID) (repository.AppRatingStats, error) {
	if _, err := s.marketplaceRepo.GetPublishedByID(ctx, appID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return repository.AppRatingStats{}, ErrMarketplaceAppNotFound
		}
		return repository.AppRatingStats{}, err
	}
	return s.ratingRepo.GetStatsByAppID(ctx, appID)
}

func mapMarketplaceRow(row repository.MarketplaceAppRow) MarketplaceApp {
	app := MarketplaceApp{
		ID:          row.ID,
		Name:        row.Name,
		Slug:        row.Slug,
		Icon:        row.Icon,
		Description: row.Description,
		PricingType: row.PricingType,
		Price:       row.Price,
		AccessMode:  row.AccessMode,
		RatingAvg:   row.RatingAvg,
		RatingCount: row.RatingCount,
	}
	app.PublishedAt = row.PublishedAt
	app.Workspace = struct {
		ID   uuid.UUID `json:"id"`
		Name string    `json:"name"`
		Slug string    `json:"slug"`
		Icon *string   `json:"icon"`
	}{
		ID:   row.WorkspaceID,
		Name: row.WorkspaceName,
		Slug: row.WorkspaceSlug,
		Icon: row.WorkspaceIcon,
	}
	return app
}
