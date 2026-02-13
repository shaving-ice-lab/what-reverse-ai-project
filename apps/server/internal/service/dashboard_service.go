package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/reverseai/server/internal/repository"
)

// DashboardService Dashboard 服务接口 — workspace-centric
type DashboardService interface {
	GetDashboardData(ctx context.Context, userID uuid.UUID) (*DashboardData, error)
	GetQuickStats(ctx context.Context, userID uuid.UUID) (*QuickStats, error)
	GetRecentActivities(ctx context.Context, userID uuid.UUID, limit int) ([]ActivitySummary, error)
}

// DashboardData Dashboard 完整数据
type DashboardData struct {
	QuickStats       *QuickStats       `json:"quick_stats"`
	RecentActivities []ActivitySummary `json:"recent_activities"`
	SystemStatus     *SystemStatus     `json:"system_status"`
}

// QuickStats 快捷统计数据
type QuickStats struct {
	TokensUsedToday   int64 `json:"tokens_used_today"`
	TokensUsedMonth   int64 `json:"tokens_used_month"`
	AvgResponseTimeMs int64 `json:"avg_response_time_ms"`
}

// ActivitySummary 活动摘要
type ActivitySummary struct {
	ID          uuid.UUID              `json:"id"`
	Action      string                 `json:"action"`
	Description string                 `json:"description"`
	ResourceID  *uuid.UUID             `json:"resource_id,omitempty"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
	CreatedAt   time.Time              `json:"created_at"`
	TimeAgo     string                 `json:"time_ago"`
}

// SystemStatus 系统状态
type SystemStatus struct {
	IsHealthy      bool   `json:"is_healthy"`
	APILatencyMs   int64  `json:"api_latency_ms"`
	QueuedTasks    int    `json:"queued_tasks"`
	ActiveSessions int    `json:"active_sessions"`
	LastCheckedAt  string `json:"last_checked_at"`
}

type dashboardService struct {
	activityRepo repository.ActivityRepository
}

// NewDashboardService 创建 Dashboard 服务实例
func NewDashboardService(
	activityRepo repository.ActivityRepository,
) DashboardService {
	return &dashboardService{
		activityRepo: activityRepo,
	}
}

func (s *dashboardService) GetDashboardData(ctx context.Context, userID uuid.UUID) (*DashboardData, error) {
	quickStats, err := s.GetQuickStats(ctx, userID)
	if err != nil {
		return nil, err
	}

	recentActivities, err := s.GetRecentActivities(ctx, userID, 10)
	if err != nil {
		return nil, err
	}

	systemStatus := &SystemStatus{
		IsHealthy:      true,
		APILatencyMs:   50,
		QueuedTasks:    0,
		ActiveSessions: 1,
		LastCheckedAt:  time.Now().Format(time.RFC3339),
	}

	return &DashboardData{
		QuickStats:       quickStats,
		RecentActivities: recentActivities,
		SystemStatus:     systemStatus,
	}, nil
}

func (s *dashboardService) GetQuickStats(ctx context.Context, userID uuid.UUID) (*QuickStats, error) {
	return &QuickStats{
		TokensUsedToday:   0,
		TokensUsedMonth:   0,
		AvgResponseTimeMs: 0,
	}, nil
}

func (s *dashboardService) GetRecentActivities(ctx context.Context, userID uuid.UUID, limit int) ([]ActivitySummary, error) {
	activities, _, err := s.activityRepo.List(ctx, repository.ActivityListParams{
		UserID:   userID,
		Page:     1,
		PageSize: limit,
	})
	if err != nil {
		return nil, err
	}

	result := make([]ActivitySummary, 0, len(activities))
	for _, a := range activities {
		summary := ActivitySummary{
			ID:          a.ID,
			Action:      a.Action,
			Description: getActivityDescription(a.Action, a.Metadata),
			Metadata:    a.Metadata,
			CreatedAt:   a.CreatedAt,
			TimeAgo:     getTimeAgo(a.CreatedAt),
		}

		if a.Metadata != nil {
			if resourceID, ok := a.Metadata["resource_id"].(string); ok {
				if uid, err := uuid.Parse(resourceID); err == nil {
					summary.ResourceID = &uid
				}
			}
		}

		result = append(result, summary)
	}

	return result, nil
}

// getActivityDescription 获取活动描述
func getActivityDescription(action string, metadata map[string]interface{}) string {
	descriptions := map[string]string{
		"login":           "登录成功",
		"logout":          "退出登录",
		"update_profile":  "更新了个人资料",
		"change_password": "修改了密码",
		"create_agent":    "与 AI Agent 对话",
		"update_agent":    "更新了应用",
		"create_api_key":  "创建了 API 密钥",
		"delete_api_key":  "删除了 API 密钥",
		"create_table":    "创建了数据表",
		"publish_app":     "发布了应用",
	}

	if desc, ok := descriptions[action]; ok {
		if metadata != nil {
			if name, ok := metadata["name"].(string); ok && name != "" {
				return desc + " \"" + name + "\""
			}
		}
		return desc
	}
	return action
}

// getTimeAgo 计算时间差描述
func getTimeAgo(t time.Time) string {
	now := time.Now()
	diff := now.Sub(t)

	if diff < time.Minute {
		return "刚刚"
	}
	if diff < time.Hour {
		return fmt.Sprintf("%d 分钟前", int(diff.Minutes()))
	}
	if diff < 24*time.Hour {
		return fmt.Sprintf("%d 小时前", int(diff.Hours()))
	}
	if diff < 7*24*time.Hour {
		return fmt.Sprintf("%d 天前", int(diff.Hours()/24))
	}
	if diff < 30*24*time.Hour {
		return fmt.Sprintf("%d 周前", int(diff.Hours()/24/7))
	}
	return t.Format("2006-01-02")
}
