package service

import (
	"context"
	"errors"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/pkg/observability"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
)

var ErrInvalidAlertSeverity = errors.New("invalid alert severity")

// OpsService 运维与发布辅助服务
type OpsService interface {
	TriggerAlertTest(ctx context.Context, req AlertTestRequest) (*AlertTestResult, error)
}

// AlertTestRequest 告警演练请求
type AlertTestRequest struct {
	Severity entity.RuntimeEventSeverity
	Message  string
	Source   string
	Metadata entity.JSON
	UserID   *uuid.UUID
}

// AlertTestResult 告警演练结果
type AlertTestResult struct {
	EventID   uuid.UUID                   `json:"event_id"`
	CreatedAt time.Time                   `json:"created_at"`
	Type      entity.RuntimeEventType     `json:"type"`
	Severity  entity.RuntimeEventSeverity `json:"severity"`
	Message   string                      `json:"message"`
}

type opsService struct {
	runtimeEventRepo repository.RuntimeEventRepository
	metrics          *observability.MetricsCollector
}

// NewOpsService 创建运维服务实例
func NewOpsService(runtimeEventRepo repository.RuntimeEventRepository) OpsService {
	return &opsService{
		runtimeEventRepo: runtimeEventRepo,
		metrics:          observability.GetMetricsCollector(),
	}
}

func (s *opsService) TriggerAlertTest(ctx context.Context, req AlertTestRequest) (*AlertTestResult, error) {
	severity := req.Severity
	if severity == "" {
		severity = entity.SeverityWarning
	}
	if !isAllowedAlertSeverity(severity) {
		return nil, ErrInvalidAlertSeverity
	}

	message := req.Message
	if message == "" {
		message = "Ops alert test"
	}

	eventType := entity.EventSystemWarning
	if severity == entity.SeverityError || severity == entity.SeverityCritical {
		eventType = entity.EventSystemError
	}

	source := req.Source
	if source == "" {
		source = "ops.alert_test"
	}

	builder := entity.NewRuntimeEvent(eventType).
		WithSeverity(severity).
		WithMessage(message).
		WithMetadata("source", source).
		WithMetadata("test", true)
	if req.UserID != nil {
		builder = builder.WithUser(*req.UserID)
	}

	event := builder.Build()
	if event.ID == uuid.Nil {
		event.ID = uuid.New()
	}
	if event.CreatedAt.IsZero() {
		event.CreatedAt = time.Now().UTC()
	}
	if req.Metadata != nil {
		if event.Metadata == nil {
			event.Metadata = entity.JSON{}
		}
		for key, value := range req.Metadata {
			event.Metadata[key] = value
		}
	}

	if err := s.runtimeEventRepo.Create(ctx, event); err != nil {
		return nil, err
	}

	if s.metrics != nil && s.metrics.OpsAlertTestTotal != nil {
		s.metrics.OpsAlertTestTotal.WithLabelValues(string(severity)).Inc()
	}

	return &AlertTestResult{
		EventID:   event.ID,
		CreatedAt: event.CreatedAt,
		Type:      event.Type,
		Severity:  event.Severity,
		Message:   event.Message,
	}, nil
}

func isAllowedAlertSeverity(severity entity.RuntimeEventSeverity) bool {
	switch severity {
	case entity.SeverityInfo, entity.SeverityWarning, entity.SeverityError, entity.SeverityCritical:
		return true
	default:
		return false
	}
}
