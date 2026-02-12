package service

import (
	"context"

	"github.com/google/uuid"
	"github.com/reverseai/server/internal/domain/entity"
	"github.com/reverseai/server/internal/repository"
)

// ActivityService 活动服务接口
type ActivityService interface {
	// RecordActivity 记录用户活动
	RecordActivity(ctx context.Context, activity *entity.UserActivity) error
	// ListActivities 获取用户活动列表
	ListActivities(ctx context.Context, userID uuid.UUID, page, pageSize int) ([]entity.UserActivity, int64, error)
}

type activityService struct {
	activityRepo repository.ActivityRepository
}

// NewActivityService 创建活动服务实例
func NewActivityService(activityRepo repository.ActivityRepository) ActivityService {
	return &activityService{
		activityRepo: activityRepo,
	}
}

func (s *activityService) RecordActivity(ctx context.Context, activity *entity.UserActivity) error {
	return s.activityRepo.Create(ctx, activity)
}

func (s *activityService) ListActivities(ctx context.Context, userID uuid.UUID, page, pageSize int) ([]entity.UserActivity, int64, error) {
	return s.activityRepo.List(ctx, repository.ActivityListParams{
		UserID:   userID,
		Page:     page,
		PageSize: pageSize,
	})
}

// ActivityResponse 活动响应结构
type ActivityResponse struct {
	ID         string `json:"id"`
	Action     string `json:"action"`
	EntityType string `json:"entity_type,omitempty"`
	EntityID   string `json:"entity_id,omitempty"`
	Device     string `json:"device"`
	IP         string `json:"ip"`
	Location   string `json:"location"`
	CreatedAt  string `json:"created_at"`
}

// ToResponse 转换为响应结构
func ToActivityResponse(a *entity.UserActivity) ActivityResponse {
	resp := ActivityResponse{
		ID:        a.ID.String(),
		Action:    a.Action,
		CreatedAt: a.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
	if a.EntityType != nil {
		resp.EntityType = *a.EntityType
	}
	if a.EntityID != nil {
		resp.EntityID = a.EntityID.String()
	}
	if a.Device != nil {
		resp.Device = *a.Device
	}
	if a.IP != nil {
		resp.IP = *a.IP
	}
	if a.Location != nil {
		resp.Location = *a.Location
	}
	return resp
}
