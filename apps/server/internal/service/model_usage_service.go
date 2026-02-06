package service

import (
	"context"
	"strings"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/pkg/executor"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
)

// ModelUsageReport 模型用量统计
type ModelUsageReport struct {
	WorkspaceID   uuid.UUID                        `json:"workspace_id"`
	StartAt       *time.Time                       `json:"start_at,omitempty"`
	EndAt         *time.Time                       `json:"end_at,omitempty"`
	TotalRequests int64                            `json:"total_requests"`
	TotalTokens   int64                            `json:"total_tokens"`
	TotalCost     float64                          `json:"total_cost"`
	Currency      string                           `json:"currency"`
	Models        []repository.ModelUsageAggregate `json:"models"`
}

// ModelUsageService 模型用量服务接口
type ModelUsageService interface {
	RecordModelUsage(ctx context.Context, record executor.ModelUsageRecord)
	GetWorkspaceUsage(ctx context.Context, userID, workspaceID uuid.UUID, start, end *time.Time) (*ModelUsageReport, error)
}

type modelUsageService struct {
	repo             repository.ModelUsageRepository
	workspaceService WorkspaceService
}

// NewModelUsageService 创建模型用量服务实例
func NewModelUsageService(repo repository.ModelUsageRepository, workspaceService WorkspaceService) ModelUsageService {
	return &modelUsageService{
		repo:             repo,
		workspaceService: workspaceService,
	}
}

func (s *modelUsageService) RecordModelUsage(ctx context.Context, record executor.ModelUsageRecord) {
	if ctx == nil || ctx.Err() != nil {
		ctx = context.Background()
	}
	workspaceID, err := uuid.Parse(record.WorkspaceID)
	if err != nil {
		return
	}
	userID, err := uuid.Parse(record.UserID)
	if err != nil {
		return
	}

	var executionID *uuid.UUID
	if record.ExecutionID != "" {
		if parsed, err := uuid.Parse(record.ExecutionID); err == nil {
			executionID = &parsed
		}
	}
	var workflowID *uuid.UUID
	if record.WorkflowID != "" {
		if parsed, err := uuid.Parse(record.WorkflowID); err == nil {
			workflowID = &parsed
		}
	}
	var nodeID *string
	if record.NodeID != "" {
		value := record.NodeID
		nodeID = &value
	}
	if strings.TrimSpace(record.Provider) == "" || strings.TrimSpace(record.Model) == "" {
		return
	}
	strategy := record.Strategy
	if strategy == "" {
		strategy = "default"
	}
	currency := record.Currency
	if currency == "" {
		currency = "USD"
	}

	event := &entity.ModelUsageEvent{
		WorkspaceID:      workspaceID,
		UserID:           userID,
		ExecutionID:      executionID,
		WorkflowID:       workflowID,
		NodeID:           nodeID,
		Provider:         record.Provider,
		Model:            record.Model,
		Strategy:         strategy,
		PromptTokens:     clampInt(record.PromptTokens),
		CompletionTokens: clampInt(record.CompletionTokens),
		TotalTokens:      clampInt(record.TotalTokens),
		CostAmount:       record.CostAmount,
		Currency:         currency,
	}

	_ = s.repo.Create(ctx, event)
}

func (s *modelUsageService) GetWorkspaceUsage(ctx context.Context, userID, workspaceID uuid.UUID, start, end *time.Time) (*ModelUsageReport, error) {
	access, err := s.workspaceService.GetWorkspaceAccess(ctx, workspaceID, userID)
	if err != nil {
		return nil, err
	}
	if !hasAnyPermission(access.Permissions, PermissionBillingManage, PermissionWorkspaceViewMetrics, PermissionLogsView) {
		return nil, ErrWorkspaceUnauthorized
	}

	startAt := time.Time{}
	endAt := time.Time{}
	if start != nil {
		startAt = *start
	}
	if end != nil {
		endAt = *end
	}

	items, err := s.repo.GetWorkspaceStats(ctx, workspaceID, startAt, endAt)
	if err != nil {
		return nil, err
	}

	report := &ModelUsageReport{
		WorkspaceID: workspaceID,
		Models:      items,
	}
	if start != nil {
		report.StartAt = start
	}
	if end != nil {
		report.EndAt = end
	}

	for _, item := range items {
		report.TotalRequests += item.Requests
		report.TotalTokens += item.TotalTokens
		report.TotalCost += item.TotalCost
		if report.Currency == "" && item.Currency != "" {
			report.Currency = item.Currency
		}
	}
	if report.Currency == "" {
		report.Currency = "USD"
	}
	return report, nil
}

func clampInt(value int) int {
	if value < 0 {
		return 0
	}
	return value
}
