package service

import (
	"context"
	"crypto/sha256"
	"encoding/csv"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/agentflow/server/internal/config"
	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/pkg/security"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
)

const (
	defaultAnalyticsExportLimit = 5000
	maxAnalyticsExportLimit     = 50000
)

var (
	ErrAnalyticsInvalidInput         = errors.New("analytics input invalid")
	ErrAnalyticsDefinitionNotFound   = errors.New("analytics metric definition not found")
	ErrAnalyticsExportNotFound       = errors.New("analytics export not found")
	ErrAnalyticsExportNotReady       = errors.New("analytics export not ready")
	ErrAnalyticsExportExpired        = errors.New("analytics export expired")
	ErrAnalyticsExportUnavailable    = errors.New("analytics export unavailable")
	ErrAnalyticsExportDisabled       = errors.New("analytics export disabled")
	ErrAnalyticsSubscriptionNotFound = errors.New("analytics subscription not found")
)

// AnalyticsService 数据分析平台服务接口
type AnalyticsService interface {
	GetIngestionSpec(ctx context.Context, userID, workspaceID uuid.UUID) (*AnalyticsIngestionSpec, error)
	IngestEvents(ctx context.Context, userID, workspaceID uuid.UUID, req AnalyticsEventIngestRequest) (int, error)
	IngestMetrics(ctx context.Context, userID, workspaceID uuid.UUID, req AnalyticsMetricIngestRequest) (int, error)
	ListEvents(ctx context.Context, userID, workspaceID uuid.UUID, params AnalyticsEventListParams) ([]entity.RuntimeEvent, int64, error)
	ListMetrics(ctx context.Context, userID, workspaceID uuid.UUID, params AnalyticsMetricListParams) ([]entity.AnalyticsMetric, int64, error)
	ListMetricDefinitions(ctx context.Context, userID, workspaceID uuid.UUID, includeInactive bool) ([]entity.AnalyticsMetricDefinition, error)
	UpsertMetricDefinition(ctx context.Context, userID, workspaceID uuid.UUID, req AnalyticsMetricDefinitionInput) (*entity.AnalyticsMetricDefinition, error)
	RequestExport(ctx context.Context, userID, workspaceID uuid.UUID, req AnalyticsExportRequest) (*entity.AnalyticsExportJob, error)
	GetExport(ctx context.Context, userID, workspaceID, exportID uuid.UUID) (*entity.AnalyticsExportJob, error)
	DownloadExport(ctx context.Context, userID, workspaceID, exportID uuid.UUID) (*AnalyticsExportDownload, error)
	CreateSubscription(ctx context.Context, userID, workspaceID uuid.UUID, req AnalyticsSubscriptionRequest) (*entity.AnalyticsSubscription, error)
	ListSubscriptions(ctx context.Context, userID, workspaceID uuid.UUID) ([]entity.AnalyticsSubscription, error)
	UpdateSubscription(ctx context.Context, userID, workspaceID, subscriptionID uuid.UUID, req AnalyticsSubscriptionUpdate) (*entity.AnalyticsSubscription, error)
	DeleteSubscription(ctx context.Context, userID, workspaceID, subscriptionID uuid.UUID) error
	TriggerSubscription(ctx context.Context, userID, workspaceID, subscriptionID uuid.UUID) (*entity.AnalyticsExportJob, error)
}

type analyticsService struct {
	metricRepo       repository.AnalyticsMetricRepository
	metricDefRepo    repository.AnalyticsMetricDefinitionRepository
	exportRepo       repository.AnalyticsExportRepository
	subscriptionRepo repository.AnalyticsSubscriptionRepository
	workspaceService WorkspaceService
	eventRecorder    EventRecorderService
	archiveCfg       config.ArchiveConfig
	classificationOn bool
}

// NewAnalyticsService 创建数据分析服务实例
func NewAnalyticsService(
	metricRepo repository.AnalyticsMetricRepository,
	metricDefRepo repository.AnalyticsMetricDefinitionRepository,
	exportRepo repository.AnalyticsExportRepository,
	subscriptionRepo repository.AnalyticsSubscriptionRepository,
	workspaceService WorkspaceService,
	eventRecorder EventRecorderService,
	archiveCfg config.ArchiveConfig,
	securityCfg config.SecurityConfig,
) AnalyticsService {
	return &analyticsService{
		metricRepo:       metricRepo,
		metricDefRepo:    metricDefRepo,
		exportRepo:       exportRepo,
		subscriptionRepo: subscriptionRepo,
		workspaceService: workspaceService,
		eventRecorder:    eventRecorder,
		archiveCfg:       archiveCfg,
		classificationOn: securityCfg.DataClassificationEnabled,
	}
}

// ====== Ingestion Spec ======

// AnalyticsIngestionSpec 入湖规范
type AnalyticsIngestionSpec struct {
	EventSchema       map[string]interface{}             `json:"event_schema"`
	MetricSchema      map[string]interface{}             `json:"metric_schema"`
	MetricDefinitions []entity.AnalyticsMetricDefinition `json:"metric_definitions"`
	EventTypeCatalog  []entity.EventTypeMeta             `json:"event_type_catalog"`
}

func (s *analyticsService) GetIngestionSpec(ctx context.Context, userID, workspaceID uuid.UUID) (*AnalyticsIngestionSpec, error) {
	if _, err := s.authorizeWorkspace(ctx, workspaceID, userID, security.DataLevelInternal, PermissionWorkspaceViewMetrics, PermissionLogsView); err != nil {
		return nil, err
	}

	definitions, err := s.metricDefRepo.ListByWorkspace(ctx, workspaceID, true)
	if err != nil {
		return nil, err
	}

	return &AnalyticsIngestionSpec{
		EventSchema: map[string]interface{}{
			"required_fields": []string{"name"},
			"optional_fields": []string{"message", "severity", "user_id", "session_id", "timestamp", "properties"},
		},
		MetricSchema: map[string]interface{}{
			"required_fields": []string{"name", "value"},
			"optional_fields": []string{"unit", "recorded_at", "labels", "metadata"},
		},
		MetricDefinitions: definitions,
		EventTypeCatalog:  entity.GetEventTypeMetadata(),
	}, nil
}

// ====== Event Ingestion ======

// AnalyticsEventIngestRequest 事件入湖请求
type AnalyticsEventIngestRequest struct {
	Source string                  `json:"source"`
	Events []AnalyticsEventPayload `json:"events"`
}

// AnalyticsEventPayload 事件负载
type AnalyticsEventPayload struct {
	Name       string                 `json:"name"`
	Message    string                 `json:"message"`
	Severity   string                 `json:"severity"`
	UserID     *string                `json:"user_id,omitempty"`
	SessionID  *string                `json:"session_id,omitempty"`
	Timestamp  *time.Time             `json:"timestamp,omitempty"`
	Properties map[string]interface{} `json:"properties,omitempty"`
}

func (s *analyticsService) IngestEvents(ctx context.Context, userID, workspaceID uuid.UUID, req AnalyticsEventIngestRequest) (int, error) {
	if s.eventRecorder == nil {
		return 0, ErrAnalyticsExportUnavailable
	}
	if _, err := s.authorizeWorkspace(ctx, workspaceID, userID, security.DataLevelConfidential, PermissionLogsView, PermissionWorkspaceAdmin); err != nil {
		return 0, err
	}
	if len(req.Events) == 0 {
		return 0, ErrAnalyticsInvalidInput
	}

	source := strings.TrimSpace(req.Source)
	if source == "" {
		source = "api"
	}

	events := make([]*entity.RuntimeEvent, 0, len(req.Events))
	for _, payload := range req.Events {
		name := strings.TrimSpace(payload.Name)
		if name == "" {
			return 0, ErrAnalyticsInvalidInput
		}
		severity, err := parseRuntimeSeverity(payload.Severity)
		if err != nil {
			return 0, err
		}
		builder := entity.NewRuntimeEvent(entity.EventAnalyticsEvent).
			WithWorkspace(workspaceID).
			WithMessage(resolveEventMessage(payload.Message, name)).
			WithSeverity(severity)

		if payload.UserID != nil && strings.TrimSpace(*payload.UserID) != "" {
			uid, err := uuid.Parse(strings.TrimSpace(*payload.UserID))
			if err != nil {
				return 0, ErrAnalyticsInvalidInput
			}
			builder.WithUser(uid)
		}
		if payload.SessionID != nil && strings.TrimSpace(*payload.SessionID) != "" {
			sid, err := uuid.Parse(strings.TrimSpace(*payload.SessionID))
			if err != nil {
				return 0, ErrAnalyticsInvalidInput
			}
			builder.WithSession(sid)
		}

		event := builder.Build()
		event.Metadata = entity.JSON{
			"event_name": name,
			"source":     source,
		}
		if len(payload.Properties) > 0 {
			event.Metadata["properties"] = payload.Properties
		}
		if payload.Timestamp != nil && !payload.Timestamp.IsZero() {
			event.CreatedAt = *payload.Timestamp
		}
		events = append(events, event)
	}

	if err := s.eventRecorder.RecordBatch(ctx, events); err != nil {
		return 0, err
	}
	return len(events), nil
}

// ====== Metric Ingestion ======

// AnalyticsMetricIngestRequest 指标入湖请求
type AnalyticsMetricIngestRequest struct {
	AllowAdhoc bool                     `json:"allow_adhoc"`
	Metrics    []AnalyticsMetricPayload `json:"metrics"`
}

// AnalyticsMetricPayload 指标负载
type AnalyticsMetricPayload struct {
	Name       string                 `json:"name"`
	Value      float64                `json:"value"`
	Unit       string                 `json:"unit"`
	RecordedAt *time.Time             `json:"recorded_at,omitempty"`
	Labels     map[string]interface{} `json:"labels,omitempty"`
	Metadata   map[string]interface{} `json:"metadata,omitempty"`
}

func (s *analyticsService) IngestMetrics(ctx context.Context, userID, workspaceID uuid.UUID, req AnalyticsMetricIngestRequest) (int, error) {
	if _, err := s.authorizeWorkspace(ctx, workspaceID, userID, security.DataLevelInternal, PermissionWorkspaceViewMetrics, PermissionBillingManage, PermissionWorkspaceAdmin); err != nil {
		return 0, err
	}
	if len(req.Metrics) == 0 {
		return 0, ErrAnalyticsInvalidInput
	}

	now := time.Now()
	records := make([]*entity.AnalyticsMetric, 0, len(req.Metrics))
	for _, payload := range req.Metrics {
		name := strings.TrimSpace(payload.Name)
		if name == "" {
			return 0, ErrAnalyticsInvalidInput
		}
		if math.IsNaN(payload.Value) || math.IsInf(payload.Value, 0) {
			return 0, ErrAnalyticsInvalidInput
		}

		var definitionID *uuid.UUID
		unit := strings.TrimSpace(payload.Unit)
		definition, err := s.metricDefRepo.GetByName(ctx, workspaceID, name)
		if err != nil {
			return 0, err
		}
		if definition != nil {
			definitionID = &definition.ID
			if definition.Unit != nil && strings.TrimSpace(*definition.Unit) != "" {
				if unit == "" {
					unit = strings.TrimSpace(*definition.Unit)
				} else if unit != strings.TrimSpace(*definition.Unit) {
					return 0, ErrAnalyticsInvalidInput
				}
			}
		} else if !req.AllowAdhoc {
			return 0, ErrAnalyticsDefinitionNotFound
		}

		recordedAt := now
		if payload.RecordedAt != nil && !payload.RecordedAt.IsZero() {
			recordedAt = *payload.RecordedAt
		}

		records = append(records, &entity.AnalyticsMetric{
			WorkspaceID:  workspaceID,
			DefinitionID: definitionID,
			Name:         name,
			Unit:         unit,
			Value:        payload.Value,
			RecordedAt:   recordedAt,
			Labels:       entity.JSON(payload.Labels),
			Metadata:     entity.JSON(payload.Metadata),
		})
	}

	if err := s.metricRepo.CreateBatch(ctx, records); err != nil {
		return 0, err
	}
	return len(records), nil
}

// ====== Dictionary ======

// AnalyticsMetricDefinitionInput 指标定义输入
type AnalyticsMetricDefinitionInput struct {
	Name        string   `json:"name"`
	DisplayName *string  `json:"display_name,omitempty"`
	Description *string  `json:"description,omitempty"`
	Unit        *string  `json:"unit,omitempty"`
	Formula     *string  `json:"formula,omitempty"`
	Dimensions  []string `json:"dimensions,omitempty"`
	Tags        []string `json:"tags,omitempty"`
	IsActive    *bool    `json:"is_active,omitempty"`
}

func (s *analyticsService) ListMetricDefinitions(ctx context.Context, userID, workspaceID uuid.UUID, includeInactive bool) ([]entity.AnalyticsMetricDefinition, error) {
	if _, err := s.authorizeWorkspace(ctx, workspaceID, userID, security.DataLevelInternal, PermissionWorkspaceViewMetrics, PermissionLogsView); err != nil {
		return nil, err
	}
	return s.metricDefRepo.ListByWorkspace(ctx, workspaceID, includeInactive)
}

func (s *analyticsService) UpsertMetricDefinition(ctx context.Context, userID, workspaceID uuid.UUID, req AnalyticsMetricDefinitionInput) (*entity.AnalyticsMetricDefinition, error) {
	if _, err := s.authorizeWorkspace(ctx, workspaceID, userID, security.DataLevelInternal, PermissionWorkspaceAdmin, PermissionWorkspaceEdit); err != nil {
		return nil, err
	}
	name := strings.TrimSpace(req.Name)
	if name == "" {
		return nil, ErrAnalyticsInvalidInput
	}

	existing, err := s.metricDefRepo.GetByName(ctx, workspaceID, name)
	if err != nil {
		return nil, err
	}
	active := true
	if req.IsActive != nil {
		active = *req.IsActive
	}

	if existing != nil {
		existing.DisplayName = req.DisplayName
		existing.Description = req.Description
		existing.Unit = req.Unit
		existing.Formula = req.Formula
		existing.Dimensions = entity.StringArray(req.Dimensions)
		existing.Tags = entity.StringArray(req.Tags)
		existing.IsActive = active
		if err := s.metricDefRepo.Update(ctx, existing); err != nil {
			return nil, err
		}
		return existing, nil
	}

	definition := &entity.AnalyticsMetricDefinition{
		WorkspaceID: workspaceID,
		Name:        name,
		DisplayName: req.DisplayName,
		Description: req.Description,
		Unit:        req.Unit,
		Formula:     req.Formula,
		Dimensions:  entity.StringArray(req.Dimensions),
		Tags:        entity.StringArray(req.Tags),
		IsActive:    active,
	}
	if err := s.metricDefRepo.Create(ctx, definition); err != nil {
		return nil, err
	}
	return definition, nil
}

// ====== Query ======

// AnalyticsEventListParams 事件查询参数
type AnalyticsEventListParams struct {
	StartTime *time.Time
	EndTime   *time.Time
	Page      int
	PageSize  int
	OrderDesc bool
}

func (s *analyticsService) ListEvents(ctx context.Context, userID, workspaceID uuid.UUID, params AnalyticsEventListParams) ([]entity.RuntimeEvent, int64, error) {
	if s.eventRecorder == nil {
		return nil, 0, ErrAnalyticsExportUnavailable
	}
	if _, err := s.authorizeWorkspace(ctx, workspaceID, userID, security.DataLevelConfidential, PermissionLogsView, PermissionWorkspaceAdmin); err != nil {
		return nil, 0, err
	}

	filter := entity.RuntimeEventFilter{
		WorkspaceID: &workspaceID,
		Types:       []entity.RuntimeEventType{entity.EventAnalyticsEvent},
		StartTime:   params.StartTime,
		EndTime:     params.EndTime,
		Page:        params.Page,
		PageSize:    params.PageSize,
		OrderBy:     "created_at",
		OrderDesc:   params.OrderDesc,
	}

	return s.eventRecorder.GetEvents(ctx, filter)
}

// AnalyticsMetricListParams 指标查询参数
type AnalyticsMetricListParams struct {
	StartTime *time.Time
	EndTime   *time.Time
	Page      int
	PageSize  int
	OrderDesc bool
	Names     []string
}

func (s *analyticsService) ListMetrics(ctx context.Context, userID, workspaceID uuid.UUID, params AnalyticsMetricListParams) ([]entity.AnalyticsMetric, int64, error) {
	if _, err := s.authorizeWorkspace(ctx, workspaceID, userID, security.DataLevelInternal, PermissionWorkspaceViewMetrics, PermissionBillingManage, PermissionWorkspaceAdmin); err != nil {
		return nil, 0, err
	}

	return s.metricRepo.List(ctx, repository.AnalyticsMetricFilter{
		WorkspaceID: workspaceID,
		Names:       params.Names,
		StartTime:   params.StartTime,
		EndTime:     params.EndTime,
		Page:        params.Page,
		PageSize:    params.PageSize,
		OrderDesc:   params.OrderDesc,
	})
}

// ====== Export ======

// AnalyticsExportRequest 导出请求
type AnalyticsExportRequest struct {
	ExportType  string     `json:"export_type"`
	Format      string     `json:"format"`
	Start       *time.Time `json:"start,omitempty"`
	End         *time.Time `json:"end,omitempty"`
	Limit       *int       `json:"limit,omitempty"`
	MetricNames []string   `json:"metric_names,omitempty"`
}

// AnalyticsExportDownload 导出下载信息
type AnalyticsExportDownload struct {
	FilePath string
	FileName string
}

func (s *analyticsService) RequestExport(ctx context.Context, userID, workspaceID uuid.UUID, req AnalyticsExportRequest) (*entity.AnalyticsExportJob, error) {
	if !s.archiveCfg.Enabled {
		return nil, ErrAnalyticsExportDisabled
	}
	exportType, err := normalizeExportType(req.ExportType)
	if err != nil {
		return nil, ErrAnalyticsInvalidInput
	}
	if _, err := s.authorizeWorkspace(ctx, workspaceID, userID, exportClassification(exportType), PermissionLogsView, PermissionWorkspaceViewMetrics, PermissionWorkspaceAdmin); err != nil {
		return nil, err
	}
	format := normalizeExportFormat(req.Format)
	if format == "" {
		return nil, ErrAnalyticsInvalidInput
	}

	filter := buildExportFilter(req)
	var expiresAt *time.Time
	if s.archiveCfg.ExportRetentionDays > 0 {
		t := time.Now().AddDate(0, 0, s.archiveCfg.ExportRetentionDays)
		expiresAt = &t
	}

	job := &entity.AnalyticsExportJob{
		WorkspaceID: workspaceID,
		RequestedBy: &userID,
		ExportType:  exportType,
		Format:      format,
		Status:      entity.AnalyticsExportStatusPending,
		Filter:      filter,
		ExpiresAt:   expiresAt,
	}
	if err := s.exportRepo.Create(ctx, job); err != nil {
		return nil, err
	}

	if err := s.processExportJob(ctx, job); err != nil {
		return nil, err
	}
	return s.exportRepo.GetByIDAndWorkspace(ctx, job.ID, workspaceID)
}

func (s *analyticsService) GetExport(ctx context.Context, userID, workspaceID, exportID uuid.UUID) (*entity.AnalyticsExportJob, error) {
	if _, err := s.authorizeWorkspace(ctx, workspaceID, userID, security.DataLevelInternal, PermissionWorkspaceViewMetrics, PermissionLogsView, PermissionWorkspaceAdmin); err != nil {
		return nil, err
	}
	job, err := s.exportRepo.GetByIDAndWorkspace(ctx, exportID, workspaceID)
	if err != nil {
		return nil, err
	}
	if job == nil {
		return nil, ErrAnalyticsExportNotFound
	}
	return job, nil
}

func (s *analyticsService) DownloadExport(ctx context.Context, userID, workspaceID, exportID uuid.UUID) (*AnalyticsExportDownload, error) {
	job, err := s.GetExport(ctx, userID, workspaceID, exportID)
	if err != nil {
		return nil, err
	}
	if job.Status != entity.AnalyticsExportStatusCompleted {
		return nil, ErrAnalyticsExportNotReady
	}
	if job.ExpiresAt != nil && time.Now().After(*job.ExpiresAt) {
		return nil, ErrAnalyticsExportExpired
	}
	if job.FilePath == nil || strings.TrimSpace(*job.FilePath) == "" {
		return nil, ErrAnalyticsExportUnavailable
	}
	if _, err := os.Stat(*job.FilePath); err != nil {
		return nil, ErrAnalyticsExportUnavailable
	}
	fileName := fmt.Sprintf("analytics-export-%s.%s", job.ID.String(), job.Format)
	if job.FileName != nil && strings.TrimSpace(*job.FileName) != "" {
		fileName = *job.FileName
	}
	return &AnalyticsExportDownload{
		FilePath: *job.FilePath,
		FileName: fileName,
	}, nil
}

// ====== Subscription ======

// AnalyticsSubscriptionRequest 订阅创建请求
type AnalyticsSubscriptionRequest struct {
	Name         string                 `json:"name"`
	ExportType   string                 `json:"export_type"`
	Format       string                 `json:"format"`
	DeliveryType string                 `json:"delivery_type"`
	Destination  *string                `json:"destination,omitempty"`
	Schedule     *string                `json:"schedule,omitempty"`
	Filter       map[string]interface{} `json:"filter,omitempty"`
}

// AnalyticsSubscriptionUpdate 订阅更新请求
type AnalyticsSubscriptionUpdate struct {
	Name         *string                `json:"name,omitempty"`
	Format       *string                `json:"format,omitempty"`
	DeliveryType *string                `json:"delivery_type,omitempty"`
	Destination  *string                `json:"destination,omitempty"`
	Schedule     *string                `json:"schedule,omitempty"`
	Status       *string                `json:"status,omitempty"`
	Filter       map[string]interface{} `json:"filter,omitempty"`
}

func (s *analyticsService) CreateSubscription(ctx context.Context, userID, workspaceID uuid.UUID, req AnalyticsSubscriptionRequest) (*entity.AnalyticsSubscription, error) {
	exportType, err := normalizeExportType(req.ExportType)
	if err != nil {
		return nil, ErrAnalyticsInvalidInput
	}
	if _, err := s.authorizeWorkspace(ctx, workspaceID, userID, exportClassification(exportType), PermissionLogsView, PermissionWorkspaceViewMetrics, PermissionWorkspaceAdmin); err != nil {
		return nil, err
	}

	name := strings.TrimSpace(req.Name)
	if name == "" {
		return nil, ErrAnalyticsInvalidInput
	}
	format := normalizeExportFormat(req.Format)
	if format == "" {
		return nil, ErrAnalyticsInvalidInput
	}

	delivery := normalizeDeliveryType(req.DeliveryType)
	if delivery == "" {
		return nil, ErrAnalyticsInvalidInput
	}
	if (delivery == entity.AnalyticsDeliveryWebhook || delivery == entity.AnalyticsDeliveryEmail) && (req.Destination == nil || strings.TrimSpace(*req.Destination) == "") {
		return nil, ErrAnalyticsInvalidInput
	}

	subscription := &entity.AnalyticsSubscription{
		WorkspaceID:  workspaceID,
		CreatedBy:    &userID,
		Name:         name,
		ExportType:   exportType,
		Format:       format,
		DeliveryType: delivery,
		Destination:  req.Destination,
		Schedule:     req.Schedule,
		Status:       entity.AnalyticsSubscriptionActive,
		Filter:       entity.JSON(req.Filter),
	}
	if err := s.subscriptionRepo.Create(ctx, subscription); err != nil {
		return nil, err
	}
	return subscription, nil
}

func (s *analyticsService) ListSubscriptions(ctx context.Context, userID, workspaceID uuid.UUID) ([]entity.AnalyticsSubscription, error) {
	if _, err := s.authorizeWorkspace(ctx, workspaceID, userID, security.DataLevelInternal, PermissionWorkspaceViewMetrics, PermissionLogsView, PermissionWorkspaceAdmin); err != nil {
		return nil, err
	}
	return s.subscriptionRepo.ListByWorkspace(ctx, workspaceID)
}

func (s *analyticsService) UpdateSubscription(ctx context.Context, userID, workspaceID, subscriptionID uuid.UUID, req AnalyticsSubscriptionUpdate) (*entity.AnalyticsSubscription, error) {
	subscription, err := s.subscriptionRepo.GetByIDAndWorkspace(ctx, subscriptionID, workspaceID)
	if err != nil {
		return nil, err
	}
	if subscription == nil {
		return nil, ErrAnalyticsSubscriptionNotFound
	}
	if _, err := s.authorizeWorkspace(ctx, workspaceID, userID, exportClassification(subscription.ExportType), PermissionLogsView, PermissionWorkspaceViewMetrics, PermissionWorkspaceAdmin); err != nil {
		return nil, err
	}

	if req.Name != nil && strings.TrimSpace(*req.Name) != "" {
		subscription.Name = strings.TrimSpace(*req.Name)
	}
	if req.Format != nil {
		format := normalizeExportFormat(*req.Format)
		if format == "" {
			return nil, ErrAnalyticsInvalidInput
		}
		subscription.Format = format
	}
	if req.DeliveryType != nil {
		delivery := normalizeDeliveryType(*req.DeliveryType)
		if delivery == "" {
			return nil, ErrAnalyticsInvalidInput
		}
		subscription.DeliveryType = delivery
	}
	if req.Destination != nil {
		subscription.Destination = req.Destination
	}
	if req.Schedule != nil {
		subscription.Schedule = req.Schedule
	}
	if req.Status != nil {
		status := strings.ToLower(strings.TrimSpace(*req.Status))
		switch status {
		case string(entity.AnalyticsSubscriptionActive), string(entity.AnalyticsSubscriptionPaused):
			subscription.Status = entity.AnalyticsSubscriptionStatus(status)
		default:
			return nil, ErrAnalyticsInvalidInput
		}
	}
	if req.Filter != nil {
		subscription.Filter = entity.JSON(req.Filter)
	}

	if err := s.subscriptionRepo.Update(ctx, subscription); err != nil {
		return nil, err
	}
	return subscription, nil
}

func (s *analyticsService) DeleteSubscription(ctx context.Context, userID, workspaceID, subscriptionID uuid.UUID) error {
	subscription, err := s.subscriptionRepo.GetByIDAndWorkspace(ctx, subscriptionID, workspaceID)
	if err != nil {
		return err
	}
	if subscription == nil {
		return ErrAnalyticsSubscriptionNotFound
	}
	if _, err := s.authorizeWorkspace(ctx, workspaceID, userID, exportClassification(subscription.ExportType), PermissionLogsView, PermissionWorkspaceViewMetrics, PermissionWorkspaceAdmin); err != nil {
		return err
	}
	return s.subscriptionRepo.Delete(ctx, subscriptionID, workspaceID)
}

func (s *analyticsService) TriggerSubscription(ctx context.Context, userID, workspaceID, subscriptionID uuid.UUID) (*entity.AnalyticsExportJob, error) {
	subscription, err := s.subscriptionRepo.GetByIDAndWorkspace(ctx, subscriptionID, workspaceID)
	if err != nil {
		return nil, err
	}
	if subscription == nil {
		return nil, ErrAnalyticsSubscriptionNotFound
	}
	if _, err := s.authorizeWorkspace(ctx, workspaceID, userID, exportClassification(subscription.ExportType), PermissionLogsView, PermissionWorkspaceViewMetrics, PermissionWorkspaceAdmin); err != nil {
		return nil, err
	}

	job := &entity.AnalyticsExportJob{
		WorkspaceID: workspaceID,
		RequestedBy: &userID,
		ExportType:  subscription.ExportType,
		Format:      subscription.Format,
		Status:      entity.AnalyticsExportStatusPending,
		Filter:      subscription.Filter,
	}
	if s.archiveCfg.ExportRetentionDays > 0 {
		t := time.Now().AddDate(0, 0, s.archiveCfg.ExportRetentionDays)
		job.ExpiresAt = &t
	}
	if err := s.exportRepo.Create(ctx, job); err != nil {
		return nil, err
	}
	if err := s.processExportJob(ctx, job); err != nil {
		return nil, err
	}

	now := time.Now()
	subscription.LastRunAt = &now
	subscription.LastExportID = &job.ID
	_ = s.subscriptionRepo.Update(ctx, subscription)

	return s.exportRepo.GetByIDAndWorkspace(ctx, job.ID, workspaceID)
}

// ====== Internal Helpers ======

func (s *analyticsService) authorizeWorkspace(ctx context.Context, workspaceID, userID uuid.UUID, level security.DataClassificationLevel, fallbackPerms ...string) (*WorkspaceAccess, error) {
	access, err := s.workspaceService.GetWorkspaceAccess(ctx, workspaceID, userID)
	if err != nil {
		return nil, err
	}
	if s.classificationOn {
		role := resolveAccessRole(access)
		perms := extractPermissionKeys(access.Permissions)
		if !security.CheckAccess(level, role, perms) {
			return nil, ErrWorkspaceUnauthorized
		}
	}
	if len(fallbackPerms) > 0 && !hasAnyPermission(access.Permissions, fallbackPerms...) {
		return nil, ErrWorkspaceUnauthorized
	}
	return access, nil
}

func resolveAccessRole(access *WorkspaceAccess) string {
	if access == nil {
		return "member"
	}
	if access.IsOwner {
		return "owner"
	}
	if access.Role != nil && strings.TrimSpace(access.Role.Name) != "" {
		return strings.TrimSpace(access.Role.Name)
	}
	return "member"
}

func extractPermissionKeys(permissions entity.JSON) []string {
	if permissions == nil {
		return nil
	}
	keys := make([]string, 0, len(permissions))
	for key := range permissions {
		if hasPermission(permissions, key) {
			keys = append(keys, key)
		}
	}
	return keys
}

func resolveEventMessage(message, name string) string {
	trimmed := strings.TrimSpace(message)
	if trimmed != "" {
		return trimmed
	}
	return name
}

func parseRuntimeSeverity(value string) (entity.RuntimeEventSeverity, error) {
	trimmed := strings.ToLower(strings.TrimSpace(value))
	if trimmed == "" {
		return entity.SeverityInfo, nil
	}
	switch trimmed {
	case string(entity.SeverityDebug):
		return entity.SeverityDebug, nil
	case string(entity.SeverityInfo):
		return entity.SeverityInfo, nil
	case string(entity.SeverityWarning):
		return entity.SeverityWarning, nil
	case string(entity.SeverityError):
		return entity.SeverityError, nil
	case string(entity.SeverityCritical):
		return entity.SeverityCritical, nil
	default:
		return "", ErrAnalyticsInvalidInput
	}
}

func normalizeExportType(value string) (entity.AnalyticsExportJobType, error) {
	trimmed := strings.ToLower(strings.TrimSpace(value))
	switch trimmed {
	case string(entity.AnalyticsExportTypeEvents):
		return entity.AnalyticsExportTypeEvents, nil
	case string(entity.AnalyticsExportTypeMetrics):
		return entity.AnalyticsExportTypeMetrics, nil
	default:
		return "", ErrAnalyticsInvalidInput
	}
}

func normalizeExportFormat(value string) string {
	trimmed := strings.ToLower(strings.TrimSpace(value))
	switch trimmed {
	case "csv", "json":
		return trimmed
	default:
		return ""
	}
}

func normalizeDeliveryType(value string) entity.AnalyticsSubscriptionDeliveryType {
	trimmed := strings.ToLower(strings.TrimSpace(value))
	switch trimmed {
	case string(entity.AnalyticsDeliveryManual):
		return entity.AnalyticsDeliveryManual
	case string(entity.AnalyticsDeliveryWebhook):
		return entity.AnalyticsDeliveryWebhook
	case string(entity.AnalyticsDeliveryEmail):
		return entity.AnalyticsDeliveryEmail
	default:
		return ""
	}
}

func exportClassification(exportType entity.AnalyticsExportJobType) security.DataClassificationLevel {
	switch exportType {
	case entity.AnalyticsExportTypeEvents:
		return security.DataLevelConfidential
	case entity.AnalyticsExportTypeMetrics:
		return security.DataLevelInternal
	default:
		return security.DataLevelInternal
	}
}

func buildExportFilter(req AnalyticsExportRequest) entity.JSON {
	filter := entity.JSON{}
	if req.Start != nil && !req.Start.IsZero() {
		filter["start"] = req.Start.Format(time.RFC3339)
	}
	if req.End != nil && !req.End.IsZero() {
		filter["end"] = req.End.Format(time.RFC3339)
	}
	if req.Limit != nil && *req.Limit > 0 {
		filter["limit"] = *req.Limit
	}
	if len(req.MetricNames) > 0 {
		filter["metric_names"] = req.MetricNames
	}
	return filter
}

type analyticsExportFilter struct {
	Start       *time.Time
	End         *time.Time
	Limit       int
	MetricNames []string
}

func parseExportFilter(filter entity.JSON) analyticsExportFilter {
	result := analyticsExportFilter{
		Limit: defaultAnalyticsExportLimit,
	}
	if filter == nil {
		return result
	}
	if raw, ok := filter["start"].(string); ok && strings.TrimSpace(raw) != "" {
		if parsed, err := time.Parse(time.RFC3339, raw); err == nil {
			result.Start = &parsed
		}
	}
	if raw, ok := filter["end"].(string); ok && strings.TrimSpace(raw) != "" {
		if parsed, err := time.Parse(time.RFC3339, raw); err == nil {
			result.End = &parsed
		}
	}
	if raw, ok := filter["limit"].(float64); ok {
		result.Limit = int(raw)
	} else if rawInt, ok := filter["limit"].(int); ok {
		result.Limit = rawInt
	}
	if names, ok := filter["metric_names"].([]interface{}); ok {
		for _, item := range names {
			if str, ok := item.(string); ok && strings.TrimSpace(str) != "" {
				result.MetricNames = append(result.MetricNames, strings.TrimSpace(str))
			}
		}
	} else if names, ok := filter["metric_names"].([]string); ok {
		result.MetricNames = names
	}
	if result.Limit <= 0 {
		result.Limit = defaultAnalyticsExportLimit
	}
	if result.Limit > maxAnalyticsExportLimit {
		result.Limit = maxAnalyticsExportLimit
	}
	return result
}

func (s *analyticsService) processExportJob(ctx context.Context, job *entity.AnalyticsExportJob) error {
	if job == nil {
		return ErrAnalyticsInvalidInput
	}
	if err := s.exportRepo.SetProcessing(ctx, job.ID); err != nil {
		return err
	}
	filter := parseExportFilter(job.Filter)

	var (
		filePath string
		fileName string
		fileSize int64
		checksum string
		err      error
	)

	switch job.ExportType {
	case entity.AnalyticsExportTypeEvents:
		filePath, fileName, fileSize, checksum, err = s.exportEvents(ctx, job, filter)
	case entity.AnalyticsExportTypeMetrics:
		filePath, fileName, fileSize, checksum, err = s.exportMetrics(ctx, job, filter)
	default:
		err = ErrAnalyticsInvalidInput
	}
	if err != nil {
		_ = s.exportRepo.SetFailed(ctx, job.ID, err.Error())
		return err
	}
	if err := s.exportRepo.SetCompleted(ctx, job.ID, fileName, filePath, fileSize, checksum, job.ExpiresAt); err != nil {
		return err
	}
	return nil
}

func (s *analyticsService) exportEvents(ctx context.Context, job *entity.AnalyticsExportJob, filter analyticsExportFilter) (string, string, int64, string, error) {
	if s.eventRecorder == nil {
		return "", "", 0, "", ErrAnalyticsExportUnavailable
	}
	basePath, err := s.ensureExportBasePath()
	if err != nil {
		return "", "", 0, "", err
	}
	fileName := fmt.Sprintf("analytics-events-%s.%s", job.ID.String(), job.Format)
	finalPath := filepath.Join(basePath, fileName)

	tmpFile, err := os.CreateTemp(basePath, "analytics-events-*.tmp")
	if err != nil {
		return "", "", 0, "", err
	}
	defer func() {
		_ = tmpFile.Close()
	}()

	events, err := s.collectEventsForExport(ctx, job.WorkspaceID, filter)
	if err != nil {
		return "", "", 0, "", err
	}

	if security.NeedsMaskOnExport(security.DataLevelConfidential) {
		sanitizer := security.NewPIISanitizer()
		for i := range events {
			events[i] = sanitizeRuntimeEvent(events[i], sanitizer)
		}
	}

	if err := writeEventsToFile(tmpFile, events, job.Format); err != nil {
		return "", "", 0, "", err
	}
	if err := tmpFile.Close(); err != nil {
		return "", "", 0, "", err
	}
	if err := os.Rename(tmpFile.Name(), finalPath); err != nil {
		return "", "", 0, "", err
	}

	stat, err := os.Stat(finalPath)
	if err != nil {
		return "", "", 0, "", err
	}
	checksum, err := analyticsSha256File(finalPath)
	if err != nil {
		return "", "", 0, "", err
	}
	return finalPath, fileName, stat.Size(), checksum, nil
}

func (s *analyticsService) exportMetrics(ctx context.Context, job *entity.AnalyticsExportJob, filter analyticsExportFilter) (string, string, int64, string, error) {
	basePath, err := s.ensureExportBasePath()
	if err != nil {
		return "", "", 0, "", err
	}
	fileName := fmt.Sprintf("analytics-metrics-%s.%s", job.ID.String(), job.Format)
	finalPath := filepath.Join(basePath, fileName)

	tmpFile, err := os.CreateTemp(basePath, "analytics-metrics-*.tmp")
	if err != nil {
		return "", "", 0, "", err
	}
	defer func() {
		_ = tmpFile.Close()
	}()

	metrics, err := s.collectMetricsForExport(ctx, job.WorkspaceID, filter)
	if err != nil {
		return "", "", 0, "", err
	}

	if err := writeMetricsToFile(tmpFile, metrics, job.Format); err != nil {
		return "", "", 0, "", err
	}
	if err := tmpFile.Close(); err != nil {
		return "", "", 0, "", err
	}
	if err := os.Rename(tmpFile.Name(), finalPath); err != nil {
		return "", "", 0, "", err
	}

	stat, err := os.Stat(finalPath)
	if err != nil {
		return "", "", 0, "", err
	}
	checksum, err := analyticsSha256File(finalPath)
	if err != nil {
		return "", "", 0, "", err
	}
	return finalPath, fileName, stat.Size(), checksum, nil
}

func (s *analyticsService) ensureExportBasePath() (string, error) {
	basePath := strings.TrimSpace(s.archiveCfg.BasePath)
	if basePath == "" {
		basePath = "./data/exports"
	}
	finalPath := filepath.Join(basePath, "analytics")
	return finalPath, os.MkdirAll(finalPath, 0o755)
}

func (s *analyticsService) collectEventsForExport(ctx context.Context, workspaceID uuid.UUID, filter analyticsExportFilter) ([]entity.RuntimeEvent, error) {
	if s.eventRecorder == nil {
		return nil, ErrAnalyticsExportUnavailable
	}
	pageSize := filter.Limit
	if pageSize <= 0 {
		pageSize = defaultAnalyticsExportLimit
	}
	if pageSize > 1000 {
		pageSize = 1000
	}

	events := make([]entity.RuntimeEvent, 0, pageSize)
	page := 1
	for len(events) < filter.Limit {
		batch, _, err := s.eventRecorder.GetEvents(ctx, entity.RuntimeEventFilter{
			WorkspaceID: &workspaceID,
			Types:       []entity.RuntimeEventType{entity.EventAnalyticsEvent},
			StartTime:   filter.Start,
			EndTime:     filter.End,
			Page:        page,
			PageSize:    pageSize,
			OrderBy:     "created_at",
			OrderDesc:   false,
		})
		if err != nil {
			return nil, err
		}
		if len(batch) == 0 {
			break
		}
		events = append(events, batch...)
		if len(batch) < pageSize {
			break
		}
		page++
	}
	if len(events) > filter.Limit {
		events = events[:filter.Limit]
	}
	return events, nil
}

func (s *analyticsService) collectMetricsForExport(ctx context.Context, workspaceID uuid.UUID, filter analyticsExportFilter) ([]entity.AnalyticsMetric, error) {
	pageSize := filter.Limit
	if pageSize <= 0 {
		pageSize = defaultAnalyticsExportLimit
	}
	if pageSize > 1000 {
		pageSize = 1000
	}

	metrics := make([]entity.AnalyticsMetric, 0, pageSize)
	page := 1
	for len(metrics) < filter.Limit {
		batch, _, err := s.metricRepo.List(ctx, repository.AnalyticsMetricFilter{
			WorkspaceID: workspaceID,
			Names:       filter.MetricNames,
			StartTime:   filter.Start,
			EndTime:     filter.End,
			Page:        page,
			PageSize:    pageSize,
			OrderDesc:   false,
		})
		if err != nil {
			return nil, err
		}
		if len(batch) == 0 {
			break
		}
		metrics = append(metrics, batch...)
		if len(batch) < pageSize {
			break
		}
		page++
	}
	if len(metrics) > filter.Limit {
		metrics = metrics[:filter.Limit]
	}
	return metrics, nil
}

func writeEventsToFile(file *os.File, events []entity.RuntimeEvent, format string) error {
	switch format {
	case "json":
		payload := make([]map[string]interface{}, 0, len(events))
		for _, event := range events {
			payload = append(payload, map[string]interface{}{
				"id":           event.ID,
				"type":         event.Type,
				"severity":     event.Severity,
				"message":      event.Message,
				"workspace_id": event.WorkspaceID,
				"user_id":      event.UserID,
				"session_id":   event.SessionID,
				"created_at":   event.CreatedAt,
				"metadata":     event.Metadata,
			})
		}
		data, err := json.MarshalIndent(payload, "", "  ")
		if err != nil {
			return err
		}
		_, err = file.Write(data)
		return err
	case "csv":
		writer := csv.NewWriter(file)
		if err := writer.Write([]string{"event_id", "event_type", "severity", "message", "created_at", "workspace_id", "user_id", "session_id", "event_name", "source", "metadata_json"}); err != nil {
			return err
		}
		for _, event := range events {
			eventName, source := extractEventMeta(event.Metadata)
			metadataJSON := marshalJSON(event.Metadata)
			record := []string{
				event.ID.String(),
				string(event.Type),
				string(event.Severity),
				event.Message,
				event.CreatedAt.Format(time.RFC3339),
				uuidPtrToString(event.WorkspaceID),
				uuidPtrToString(event.UserID),
				uuidPtrToString(event.SessionID),
				eventName,
				source,
				metadataJSON,
			}
			if err := writer.Write(record); err != nil {
				return err
			}
		}
		writer.Flush()
		return writer.Error()
	default:
		return ErrAnalyticsInvalidInput
	}
}

func writeMetricsToFile(file *os.File, metrics []entity.AnalyticsMetric, format string) error {
	switch format {
	case "json":
		payload := make([]map[string]interface{}, 0, len(metrics))
		for _, metric := range metrics {
			payload = append(payload, map[string]interface{}{
				"id":            metric.ID,
				"name":          metric.Name,
				"value":         metric.Value,
				"unit":          metric.Unit,
				"workspace_id":  metric.WorkspaceID,
				"definition_id": metric.DefinitionID,
				"recorded_at":   metric.RecordedAt,
				"labels":        metric.Labels,
				"metadata":      metric.Metadata,
			})
		}
		data, err := json.MarshalIndent(payload, "", "  ")
		if err != nil {
			return err
		}
		_, err = file.Write(data)
		return err
	case "csv":
		writer := csv.NewWriter(file)
		if err := writer.Write([]string{"metric_id", "name", "value", "unit", "recorded_at", "workspace_id", "definition_id", "labels_json", "metadata_json"}); err != nil {
			return err
		}
		for _, metric := range metrics {
			record := []string{
				metric.ID.String(),
				metric.Name,
				fmt.Sprintf("%f", metric.Value),
				metric.Unit,
				metric.RecordedAt.Format(time.RFC3339),
				metric.WorkspaceID.String(),
				uuidPtrToString(metric.DefinitionID),
				marshalJSON(metric.Labels),
				marshalJSON(metric.Metadata),
			}
			if err := writer.Write(record); err != nil {
				return err
			}
		}
		writer.Flush()
		return writer.Error()
	default:
		return ErrAnalyticsInvalidInput
	}
}

func extractEventMeta(metadata entity.JSON) (string, string) {
	if metadata == nil {
		return "", ""
	}
	name := ""
	source := ""
	if raw, ok := metadata["event_name"].(string); ok {
		name = raw
	}
	if raw, ok := metadata["source"].(string); ok {
		source = raw
	}
	return name, source
}

func marshalJSON(payload interface{}) string {
	if payload == nil {
		return ""
	}
	data, err := json.Marshal(payload)
	if err != nil {
		return ""
	}
	return string(data)
}

func uuidPtrToString(value interface{}) string {
	switch v := value.(type) {
	case *uuid.UUID:
		if v == nil {
			return ""
		}
		return v.String()
	case uuid.UUID:
		return v.String()
	default:
		return ""
	}
}

func sanitizeRuntimeEvent(event entity.RuntimeEvent, sanitizer *security.PIISanitizer) entity.RuntimeEvent {
	if sanitizer == nil {
		return event
	}
	if event.Message != "" {
		event.Message = sanitizer.SanitizeString(event.Message)
	}
	if event.ErrorMessage != "" {
		event.ErrorMessage = sanitizer.SanitizeString(event.ErrorMessage)
	}
	if event.StackTrace != "" {
		event.StackTrace = sanitizer.SanitizeString(event.StackTrace)
	}
	if event.RemoteIP != "" || event.UserAgent != "" {
		sanitized := sanitizer.SanitizeMap(map[string]interface{}{
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
		event.Metadata = entity.JSON(sanitizer.SanitizeMap(map[string]interface{}(event.Metadata)))
	}
	return event
}

func analyticsSha256File(path string) (string, error) {
	file, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer file.Close()

	hash := sha256.New()
	if _, err := io.Copy(hash, file); err != nil {
		return "", err
	}
	return hex.EncodeToString(hash.Sum(nil)), nil
}
