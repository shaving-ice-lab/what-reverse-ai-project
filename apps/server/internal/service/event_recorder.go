package service

import (
	"context"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/reverseai/server/internal/domain/entity"
	"github.com/reverseai/server/internal/pkg/logger"
	"github.com/reverseai/server/internal/pkg/observability"
	"github.com/reverseai/server/internal/repository"
)

// EventRecorderService 事件记录器服务接口
type EventRecorderService interface {
	// Record 记录单个事件
	Record(ctx context.Context, event *entity.RuntimeEvent) error
	// RecordAsync 异步记录事件（不阻塞）
	RecordAsync(event *entity.RuntimeEvent)
	// RecordBatch 批量记录事件
	RecordBatch(ctx context.Context, events []*entity.RuntimeEvent) error

	// 便捷记录方法
	RecordWorkspaceEvent(ctx context.Context, eventType entity.RuntimeEventType, workspaceID uuid.UUID, sessionID *uuid.UUID, message string, metadata entity.JSON) error
	RecordDBEvent(ctx context.Context, eventType entity.RuntimeEventType, workspaceID uuid.UUID, durationMs int64, err error) error
	RecordDomainEvent(ctx context.Context, eventType entity.RuntimeEventType, workspaceID uuid.UUID, domain string, durationMs int64, err error) error
	RecordLLMEvent(ctx context.Context, eventType entity.RuntimeEventType, provider, model string, durationMs, promptTokens, completionTokens int64, err error) error
	RecordSecurityEvent(ctx context.Context, eventType entity.RuntimeEventType, remoteIP, userAgent, reason string) error
	RecordSystemEvent(ctx context.Context, eventType entity.RuntimeEventType, message string, err error) error

	// 查询方法
	GetEventsByExecution(ctx context.Context, executionID uuid.UUID) ([]entity.RuntimeEvent, error)
	GetEventsByTrace(ctx context.Context, traceID string) ([]entity.RuntimeEvent, error)
	GetEvents(ctx context.Context, filter entity.RuntimeEventFilter) ([]entity.RuntimeEvent, int64, error)
	GetEventStats(ctx context.Context, filter entity.RuntimeEventFilter) (*entity.RuntimeEventStats, error)

	// 回放支持
	StreamEvents(ctx context.Context, afterSequenceNum int64, limit int) ([]entity.RuntimeEvent, error)

	// 生命周期
	Flush() error
	Close() error

	// Webhook 分发
	SetWebhookDispatcher(dispatcher WebhookDispatcher)
	// 关键事件通知分发
	SetNotificationDispatcher(dispatcher NotificationDispatcher)
}

// WebhookDispatcher 运行时事件 Webhook 分发器
type WebhookDispatcher interface {
	DispatchRuntimeEvent(ctx context.Context, event *entity.RuntimeEvent)
}

// NotificationDispatcher 关键事件通知分发器
type NotificationDispatcher interface {
	DispatchRuntimeEvent(ctx context.Context, event *entity.RuntimeEvent)
}

type eventRecorderService struct {
	repo                   repository.RuntimeEventRepository
	log                    logger.Logger
	metrics                *observability.MetricsCollector
	pii                    *piiSanitizer
	dispatcher             WebhookDispatcher
	notificationDispatcher NotificationDispatcher

	// 异步写入支持
	eventChan     chan *entity.RuntimeEvent
	flushChan     chan struct{}
	closeChan     chan struct{}
	wg            sync.WaitGroup
	bufferSize    int
	flushInterval time.Duration
}

// EventRecorderConfig 事件记录器配置
type EventRecorderConfig struct {
	// BufferSize 异步写入缓冲区大小
	BufferSize int
	// FlushInterval 定时刷新间隔
	FlushInterval time.Duration
	// Enabled 是否启用事件记录
	Enabled bool
}

// DefaultEventRecorderConfig 默认配置
func DefaultEventRecorderConfig() *EventRecorderConfig {
	return &EventRecorderConfig{
		BufferSize:    1000,
		FlushInterval: 5 * time.Second,
		Enabled:       true,
	}
}

// NewEventRecorderService 创建事件记录器服务
func NewEventRecorderService(
	repo repository.RuntimeEventRepository,
	log logger.Logger,
	cfg *EventRecorderConfig,
	piiEnabled bool,
) EventRecorderService {
	if cfg == nil {
		cfg = DefaultEventRecorderConfig()
	}

	svc := &eventRecorderService{
		repo:          repo,
		log:           log,
		metrics:       observability.GetMetricsCollector(),
		pii:           newPIISanitizer(piiEnabled),
		eventChan:     make(chan *entity.RuntimeEvent, cfg.BufferSize),
		flushChan:     make(chan struct{}, 1),
		closeChan:     make(chan struct{}),
		bufferSize:    cfg.BufferSize,
		flushInterval: cfg.FlushInterval,
	}

	// 启动后台写入 goroutine
	if cfg.Enabled {
		svc.wg.Add(1)
		go svc.backgroundWriter()
	}

	return svc
}

// backgroundWriter 后台批量写入
func (s *eventRecorderService) backgroundWriter() {
	defer s.wg.Done()

	ticker := time.NewTicker(s.flushInterval)
	defer ticker.Stop()

	buffer := make([]*entity.RuntimeEvent, 0, 100)

	flush := func() {
		if len(buffer) == 0 {
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()

		if err := s.repo.CreateBatch(ctx, buffer); err != nil {
			s.log.Error("Failed to batch write events", "count", len(buffer), "error", err)
		}

		buffer = buffer[:0]
	}

	for {
		select {
		case event := <-s.eventChan:
			buffer = append(buffer, event)
			if len(buffer) >= 100 {
				flush()
			}

		case <-ticker.C:
			flush()

		case <-s.flushChan:
			flush()

		case <-s.closeChan:
			// 关闭前刷新剩余事件
			close(s.eventChan)
			for event := range s.eventChan {
				buffer = append(buffer, event)
			}
			flush()
			return
		}
	}
}

func (s *eventRecorderService) Record(ctx context.Context, event *entity.RuntimeEvent) error {
	// 从上下文提取追踪信息
	tc := observability.TraceContextFromContext(ctx)
	enrichEventWithTraceContext(event, tc)
	s.sanitizeEvent(event)

	if err := s.repo.Create(ctx, event); err != nil {
		return err
	}

	s.dispatchWebhook(event)
	s.dispatchNotification(event)
	return nil
}

func (s *eventRecorderService) RecordAsync(event *entity.RuntimeEvent) {
	s.sanitizeEvent(event)
	enqueued := false
	select {
	case s.eventChan <- event:
		enqueued = true
	default:
		// 缓冲区满，记录警告
		s.log.Warn("Event buffer full, dropping event", "type", event.Type)
	}
	if enqueued {
		s.dispatchWebhook(event)
		s.dispatchNotification(event)
	}
}

func (s *eventRecorderService) RecordBatch(ctx context.Context, events []*entity.RuntimeEvent) error {
	// 从上下文提取追踪信息
	tc := observability.TraceContextFromContext(ctx)
	for _, event := range events {
		enrichEventWithTraceContext(event, tc)
		s.sanitizeEvent(event)
	}

	if err := s.repo.CreateBatch(ctx, events); err != nil {
		return err
	}

	for _, event := range events {
		s.dispatchWebhook(event)
		s.dispatchNotification(event)
	}
	return nil
}

func (s *eventRecorderService) sanitizeEvent(event *entity.RuntimeEvent) {
	if s.pii == nil || event == nil {
		return
	}
	if event.Message != "" {
		event.Message = s.pii.sanitizeString(event.Message)
	}
	if event.ErrorMessage != "" {
		event.ErrorMessage = s.pii.sanitizeString(event.ErrorMessage)
	}
	if event.StackTrace != "" {
		event.StackTrace = s.pii.sanitizeString(event.StackTrace)
	}
	if event.HTTPPath != "" {
		event.HTTPPath = s.pii.sanitizeString(event.HTTPPath)
	}
	if event.RemoteIP != "" || event.UserAgent != "" {
		sanitized := s.pii.sanitizeMap(map[string]interface{}{
			"remote_ip":  event.RemoteIP,
			"user_agent": event.UserAgent,
		})
		if value, ok := sanitized["remote_ip"].(string); ok {
			event.RemoteIP = value
		}
		if value, ok := sanitized["user_agent"].(string); ok {
			event.UserAgent = value
		}
	}
	if event.Metadata != nil {
		event.Metadata = s.pii.sanitizeJSON(event.Metadata)
	}
}

func (s *eventRecorderService) SetWebhookDispatcher(dispatcher WebhookDispatcher) {
	s.dispatcher = dispatcher
}

func (s *eventRecorderService) SetNotificationDispatcher(dispatcher NotificationDispatcher) {
	s.notificationDispatcher = dispatcher
}

func (s *eventRecorderService) dispatchWebhook(event *entity.RuntimeEvent) {
	if s.dispatcher == nil || event == nil {
		return
	}
	go func(evt *entity.RuntimeEvent) {
		ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
		defer cancel()
		s.dispatcher.DispatchRuntimeEvent(ctx, evt)
	}(event)
}

func (s *eventRecorderService) dispatchNotification(event *entity.RuntimeEvent) {
	if s.notificationDispatcher == nil || event == nil {
		return
	}
	go func(evt *entity.RuntimeEvent) {
		ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
		defer cancel()
		s.notificationDispatcher.DispatchRuntimeEvent(ctx, evt)
	}(event)
}

// ===== 便捷记录方法 =====

func (s *eventRecorderService) RecordWorkspaceEvent(ctx context.Context, eventType entity.RuntimeEventType, workspaceID uuid.UUID, sessionID *uuid.UUID, message string, metadata entity.JSON) error {
	builder := entity.NewRuntimeEvent(eventType).
		WithWorkspace(workspaceID).
		WithMessage(message)

	if sessionID != nil {
		builder.WithSession(*sessionID)
	}

	event := builder.Build()
	if metadata != nil {
		event.Metadata = metadata
	}

	return s.Record(ctx, event)
}

func (s *eventRecorderService) RecordDBEvent(ctx context.Context, eventType entity.RuntimeEventType, workspaceID uuid.UUID, durationMs int64, err error) error {
	builder := entity.NewRuntimeEvent(eventType).
		WithWorkspace(workspaceID).
		WithDuration(durationMs)

	if err != nil {
		builder.WithError("", err.Error(), "").WithSeverity(entity.SeverityError)
	}

	return s.Record(ctx, builder.Build())
}

func (s *eventRecorderService) RecordDomainEvent(ctx context.Context, eventType entity.RuntimeEventType, workspaceID uuid.UUID, domain string, durationMs int64, err error) error {
	builder := entity.NewRuntimeEvent(eventType).
		WithWorkspace(workspaceID).
		WithDuration(durationMs).
		WithMetadata("domain", domain)

	if err != nil {
		builder.WithError("", err.Error(), "").WithSeverity(entity.SeverityError)
	}

	return s.Record(ctx, builder.Build())
}

func (s *eventRecorderService) RecordLLMEvent(ctx context.Context, eventType entity.RuntimeEventType, provider, model string, durationMs, promptTokens, completionTokens int64, err error) error {
	builder := entity.NewRuntimeEvent(eventType).
		WithDuration(durationMs).
		WithMetadata("provider", provider).
		WithMetadata("model", model).
		WithMetadata("prompt_tokens", promptTokens).
		WithMetadata("completion_tokens", completionTokens).
		WithMetadata("total_tokens", promptTokens+completionTokens)

	if err != nil {
		builder.WithError("", err.Error(), "").WithSeverity(entity.SeverityError)
	}

	return s.Record(ctx, builder.Build())
}

func (s *eventRecorderService) RecordSecurityEvent(ctx context.Context, eventType entity.RuntimeEventType, remoteIP, userAgent, reason string) error {
	event := entity.NewRuntimeEvent(eventType).
		WithSeverity(entity.SeverityWarning).
		WithRequestInfo("", remoteIP, userAgent).
		WithMessage(reason).
		Build()

	return s.Record(ctx, event)
}

func (s *eventRecorderService) RecordSystemEvent(ctx context.Context, eventType entity.RuntimeEventType, message string, err error) error {
	builder := entity.NewRuntimeEvent(eventType).WithMessage(message)

	if err != nil {
		builder.WithError("", err.Error(), "").WithSeverity(entity.SeverityError)
	}

	return s.Record(ctx, builder.Build())
}

// ===== 查询方法 =====

func (s *eventRecorderService) GetEventsByExecution(ctx context.Context, executionID uuid.UUID) ([]entity.RuntimeEvent, error) {
	return s.repo.ListByExecution(ctx, executionID)
}

func (s *eventRecorderService) GetEventsByTrace(ctx context.Context, traceID string) ([]entity.RuntimeEvent, error) {
	return s.repo.ListByTraceID(ctx, traceID)
}

func (s *eventRecorderService) GetEvents(ctx context.Context, filter entity.RuntimeEventFilter) ([]entity.RuntimeEvent, int64, error) {
	return s.repo.List(ctx, filter)
}

func (s *eventRecorderService) GetEventStats(ctx context.Context, filter entity.RuntimeEventFilter) (*entity.RuntimeEventStats, error) {
	return s.repo.GetStats(ctx, filter)
}

func (s *eventRecorderService) StreamEvents(ctx context.Context, afterSequenceNum int64, limit int) ([]entity.RuntimeEvent, error) {
	return s.repo.StreamAfterSequenceNum(ctx, afterSequenceNum, limit)
}

// ===== 生命周期 =====

func (s *eventRecorderService) Flush() error {
	select {
	case s.flushChan <- struct{}{}:
	default:
	}
	return nil
}

func (s *eventRecorderService) Close() error {
	close(s.closeChan)
	s.wg.Wait()
	return nil
}

// enrichEventWithTraceContext 从追踪上下文填充事件字段
func enrichEventWithTraceContext(event *entity.RuntimeEvent, tc *observability.TraceContext) {
	if tc == nil {
		return
	}

	event.TraceID = tc.TraceID
	event.SpanID = tc.SpanID
	event.ParentSpanID = tc.ParentSpanID
	event.RequestID = tc.RequestID

	if tc.WorkspaceID != "" && event.WorkspaceID == nil {
		if id, err := uuid.Parse(tc.WorkspaceID); err == nil {
			event.WorkspaceID = &id
		}
	}
	if tc.ExecutionID != "" && event.ExecutionID == nil {
		if id, err := uuid.Parse(tc.ExecutionID); err == nil {
			event.ExecutionID = &id
		}
	}
	if tc.UserID != "" && event.UserID == nil {
		if id, err := uuid.Parse(tc.UserID); err == nil {
			event.UserID = &id
		}
	}
	if tc.SessionID != "" && event.SessionID == nil {
		if id, err := uuid.Parse(tc.SessionID); err == nil {
			event.SessionID = &id
		}
	}
}
