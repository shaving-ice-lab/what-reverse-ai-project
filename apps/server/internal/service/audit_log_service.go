package service

import (
	"context"
	"errors"
	"strings"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
)

var (
	ErrAuditLogInvalidInput = errors.New("audit log input invalid")
)

// AuditLogService 审计日志服务接口
type AuditLogService interface {
	Record(ctx context.Context, req AuditLogRecordRequest) (*entity.AuditLog, error)
	ListByWorkspace(ctx context.Context, userID, workspaceID uuid.UUID, params AuditLogListParams) ([]entity.AuditLog, int64, error)
}

// AuditLogRecordRequest 记录审计日志请求
type AuditLogRecordRequest struct {
	WorkspaceID uuid.UUID
	ActorUserID *uuid.UUID
	Action      string
	TargetType  string
	TargetID    *uuid.UUID
	Metadata    entity.JSON
}

// AuditLogListParams 审计日志查询参数
type AuditLogListParams struct {
	ActorUserID *uuid.UUID
	Action      string
	Actions     []string
	TargetType  string
	Page        int
	PageSize    int
}

type auditLogService struct {
	repo             repository.AuditLogRepository
	workspaceService WorkspaceService
	pii              *piiSanitizer
}

// NewAuditLogService 创建审计日志服务实例
func NewAuditLogService(repo repository.AuditLogRepository, workspaceService WorkspaceService, piiEnabled bool) AuditLogService {
	return &auditLogService{
		repo:             repo,
		workspaceService: workspaceService,
		pii:              newPIISanitizer(piiEnabled),
	}
}

func (s *auditLogService) Record(ctx context.Context, req AuditLogRecordRequest) (*entity.AuditLog, error) {
	if req.WorkspaceID == uuid.Nil || strings.TrimSpace(req.Action) == "" || strings.TrimSpace(req.TargetType) == "" {
		return nil, ErrAuditLogInvalidInput
	}

	metadata := req.Metadata
	if s.pii != nil {
		metadata = s.pii.sanitizeJSON(req.Metadata)
	}

	log := &entity.AuditLog{
		WorkspaceID: req.WorkspaceID,
		ActorUserID: req.ActorUserID,
		Action:      strings.TrimSpace(req.Action),
		TargetType:  strings.TrimSpace(req.TargetType),
		TargetID:    req.TargetID,
		Metadata:    metadata,
	}

	if err := s.repo.Create(ctx, log); err != nil {
		return nil, err
	}
	return log, nil
}

func (s *auditLogService) ListByWorkspace(ctx context.Context, userID, workspaceID uuid.UUID, params AuditLogListParams) ([]entity.AuditLog, int64, error) {
	access, err := s.workspaceService.GetWorkspaceAccess(ctx, workspaceID, userID)
	if err != nil {
		return nil, 0, err
	}
	if !access.IsOwner && !hasPermission(access.Permissions, PermissionLogsView) {
		return nil, 0, ErrWorkspaceUnauthorized
	}

	normalizedActions := normalizeActionList(params.Actions)

	return s.repo.ListByWorkspace(ctx, repository.AuditLogListParams{
		WorkspaceID: workspaceID,
		ActorUserID: params.ActorUserID,
		Action:      strings.TrimSpace(params.Action),
		Actions:     normalizedActions,
		TargetType:  strings.TrimSpace(params.TargetType),
		Page:        params.Page,
		PageSize:    params.PageSize,
	})
}

func normalizeActionList(values []string) []string {
	if len(values) == 0 {
		return nil
	}
	unique := make(map[string]struct{}, len(values))
	list := make([]string, 0, len(values))
	for _, value := range values {
		trimmed := strings.TrimSpace(value)
		if trimmed == "" {
			continue
		}
		if _, exists := unique[trimmed]; exists {
			continue
		}
		unique[trimmed] = struct{}{}
		list = append(list, trimmed)
	}
	if len(list) == 0 {
		return nil
	}
	return list
}
