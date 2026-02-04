package service

import (
	"context"
	"strings"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/pkg/executor"
	"github.com/google/uuid"
)

type executionAuditRecorder struct {
	auditLogService AuditLogService
}

// NewExecutionAuditRecorder 创建执行审计记录器
func NewExecutionAuditRecorder(auditLogService AuditLogService) executor.AuditRecorder {
	if auditLogService == nil {
		return nil
	}
	return &executionAuditRecorder{auditLogService: auditLogService}
}

func (r *executionAuditRecorder) RecordAudit(ctx context.Context, execCtx *executor.ExecutionContext, event executor.AuditEvent) {
	if r == nil || r.auditLogService == nil || execCtx == nil {
		return
	}

	action := strings.TrimSpace(event.Action)
	targetType := strings.TrimSpace(event.TargetType)
	if action == "" || targetType == "" {
		return
	}

	workspaceID, err := uuid.Parse(strings.TrimSpace(execCtx.WorkspaceID))
	if err != nil || workspaceID == uuid.Nil {
		return
	}

	var actorID *uuid.UUID
	if execCtx.UserID != "" {
		if parsed, err := uuid.Parse(strings.TrimSpace(execCtx.UserID)); err == nil {
			actorID = &parsed
		}
	}

	var targetID *uuid.UUID
	if event.TargetID != "" {
		if parsed, err := uuid.Parse(strings.TrimSpace(event.TargetID)); err == nil {
			targetID = &parsed
		}
	}

	metadata := entity.JSON{}
	for key, value := range event.Metadata {
		metadata[key] = value
	}
	if execCtx.ExecutionID != "" && metadata["execution_id"] == nil {
		metadata["execution_id"] = execCtx.ExecutionID
	}
	if execCtx.WorkflowID != "" && metadata["workflow_id"] == nil {
		metadata["workflow_id"] = execCtx.WorkflowID
	}
	if execCtx.TriggerType != "" && metadata["trigger_type"] == nil {
		metadata["trigger_type"] = execCtx.TriggerType
	}
	for key, value := range execCtx.TriggerData {
		if metadata[key] == nil {
			metadata[key] = value
		}
	}

	_, _ = r.auditLogService.Record(ctx, AuditLogRecordRequest{
		WorkspaceID: workspaceID,
		ActorUserID: actorID,
		Action:      action,
		TargetType:  targetType,
		TargetID:    targetID,
		Metadata:    metadata,
	})
}
