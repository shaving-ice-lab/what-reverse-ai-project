package service

import (
	"context"
	"errors"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
)

var (
	ErrReviewNotFound     = errors.New("review not found")
	ErrAlreadyReviewed    = errors.New("already reviewed this agent")
	ErrCannotReviewOwn    = errors.New("cannot review your own agent")
	ErrInvalidRating      = errors.New("rating must be between 1 and 5")
)

// ReviewService 评价服务接口
type ReviewService interface {
	Create(ctx context.Context, userID uuid.UUID, req CreateReviewRequest) (*entity.Review, error)
	GetByID(ctx context.Context, id uuid.UUID) (*entity.Review, error)
	List(ctx context.Context, agentID uuid.UUID, params repository.ReviewListParams) ([]entity.Review, int64, error)
	Update(ctx context.Context, id, userID uuid.UUID, req UpdateReviewRequest) (*entity.Review, error)
	Delete(ctx context.Context, id, userID uuid.UUID) error
	MarkHelpful(ctx context.Context, id, userID uuid.UUID) error
	GetUserReview(ctx context.Context, agentID, userID uuid.UUID) (*entity.Review, error)
}

// CreateReviewRequest 创建评价请求
type CreateReviewRequest struct {
	AgentID uuid.UUID
	Rating  int
	Title   string
	Content string
}

// UpdateReviewRequest 更新评价请求
type UpdateReviewRequest struct {
	Rating  *int
	Title   *string
	Content *string
}

type reviewService struct {
	reviewRepo repository.ReviewRepository
	agentRepo  repository.AgentRepository
}

// NewReviewService 创建评价服务实例
func NewReviewService(reviewRepo repository.ReviewRepository, agentRepo repository.AgentRepository) ReviewService {
	return &reviewService{
		reviewRepo: reviewRepo,
		agentRepo:  agentRepo,
	}
}

func (s *reviewService) Create(ctx context.Context, userID uuid.UUID, req CreateReviewRequest) (*entity.Review, error) {
	// 验证评分
	if req.Rating < 1 || req.Rating > 5 {
		return nil, ErrInvalidRating
	}

	// 获取 Agent
	agent, err := s.agentRepo.GetByID(ctx, req.AgentID)
	if err != nil {
		return nil, ErrAgentNotFound
	}

	// 不能评价自己的 Agent
	if agent.UserID == userID {
		return nil, ErrCannotReviewOwn
	}

	// 检查是否已评价
	existing, _ := s.reviewRepo.GetByAgentAndUser(ctx, req.AgentID, userID)
	if existing != nil {
		return nil, ErrAlreadyReviewed
	}

	// 创建评价
	review := &entity.Review{
		AgentID: req.AgentID,
		UserID:  userID,
		Rating:  req.Rating,
		Title:   req.Title,
		Content: req.Content,
	}

	if err := s.reviewRepo.Create(ctx, review); err != nil {
		return nil, err
	}

	// 更新 Agent 的评价统计
	s.updateAgentRatingStats(ctx, req.AgentID)

	return review, nil
}

func (s *reviewService) GetByID(ctx context.Context, id uuid.UUID) (*entity.Review, error) {
	review, err := s.reviewRepo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrReviewNotFound
	}
	return review, nil
}

func (s *reviewService) List(ctx context.Context, agentID uuid.UUID, params repository.ReviewListParams) ([]entity.Review, int64, error) {
	return s.reviewRepo.List(ctx, agentID, params)
}

func (s *reviewService) Update(ctx context.Context, id, userID uuid.UUID, req UpdateReviewRequest) (*entity.Review, error) {
	review, err := s.reviewRepo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrReviewNotFound
	}

	// 检查权限
	if review.UserID != userID {
		return nil, ErrUnauthorized
	}

	// 更新字段
	if req.Rating != nil {
		if *req.Rating < 1 || *req.Rating > 5 {
			return nil, ErrInvalidRating
		}
		review.Rating = *req.Rating
	}
	if req.Title != nil {
		review.Title = *req.Title
	}
	if req.Content != nil {
		review.Content = *req.Content
	}

	if err := s.reviewRepo.Update(ctx, review); err != nil {
		return nil, err
	}

	// 更新 Agent 的评价统计
	s.updateAgentRatingStats(ctx, review.AgentID)

	return review, nil
}

func (s *reviewService) Delete(ctx context.Context, id, userID uuid.UUID) error {
	review, err := s.reviewRepo.GetByID(ctx, id)
	if err != nil {
		return ErrReviewNotFound
	}

	// 检查权限
	if review.UserID != userID {
		return ErrUnauthorized
	}

	agentID := review.AgentID

	if err := s.reviewRepo.Delete(ctx, id); err != nil {
		return err
	}

	// 更新 Agent 的评价统计
	s.updateAgentRatingStats(ctx, agentID)

	return nil
}

func (s *reviewService) MarkHelpful(ctx context.Context, id, userID uuid.UUID) error {
	// 检查评价是否存在
	review, err := s.reviewRepo.GetByID(ctx, id)
	if err != nil {
		return ErrReviewNotFound
	}

	// 不能给自己的评价点赞
	if review.UserID == userID {
		return ErrUnauthorized
	}

	// TODO: 检查用户是否已经点过赞（需要添加 helpful 关系表）

	return s.reviewRepo.IncrementHelpful(ctx, id)
}

func (s *reviewService) GetUserReview(ctx context.Context, agentID, userID uuid.UUID) (*entity.Review, error) {
	review, err := s.reviewRepo.GetByAgentAndUser(ctx, agentID, userID)
	if err != nil {
		return nil, nil // 没有评价，返回 nil
	}
	return review, nil
}

func (s *reviewService) updateAgentRatingStats(ctx context.Context, agentID uuid.UUID) {
	avgRating, count, err := s.reviewRepo.GetAverageRating(ctx, agentID)
	if err != nil {
		return
	}

	// 更新 Agent 统计
	agent, err := s.agentRepo.GetByID(ctx, agentID)
	if err != nil {
		return
	}

	agent.AvgRating = avgRating
	agent.ReviewCount = int(count)
	_ = s.agentRepo.Update(ctx, agent)
}
