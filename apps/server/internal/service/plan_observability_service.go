package service

import (
	"context"
	"errors"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/pkg/observability"
)

// MetricsDictionary defines the observability metrics dictionary table.
type MetricsDictionary struct {
	Key     string                           `json:"key"`
	Title   string                           `json:"title"`
	Summary string                           `json:"summary"`
	Metrics []observability.MetricsDimension `json:"metrics"`
	Notes   []string                         `json:"notes,omitempty"`
}

// TrackingEventDefinition defines an analytics event.
type TrackingEventDefinition struct {
	Key         string   `json:"key"`
	Event       string   `json:"event"`
	Category    string   `json:"category"`
	Description string   `json:"description"`
	Trigger     string   `json:"trigger"`
	Properties  []string `json:"properties"`
	Source      string   `json:"source,omitempty"`
}

// TrackingEventPlan defines a tracking event table.
type TrackingEventPlan struct {
	Key     string                    `json:"key"`
	Title   string                    `json:"title"`
	Summary string                    `json:"summary"`
	Events  []TrackingEventDefinition `json:"events"`
	Notes   []string                  `json:"notes,omitempty"`
}

// PlanObservabilityService provides monitoring dictionary and tracking plans.
type PlanObservabilityService interface {
	GetMetricsDictionary(ctx context.Context) (*MetricsDictionary, error)
	GetFrontendTrackingPlan(ctx context.Context) (*TrackingEventPlan, error)
	GetBackendTrackingPlan(ctx context.Context) (*TrackingEventPlan, error)
}

type planObservabilityService struct {
	metrics  MetricsDictionary
	frontend TrackingEventPlan
	backend  TrackingEventPlan
}

// ErrMetricsDictionaryNotFound indicates metrics dictionary missing.
var ErrMetricsDictionaryNotFound = errors.New("metrics dictionary not found")

// ErrFrontendTrackingPlanNotFound indicates frontend tracking plan missing.
var ErrFrontendTrackingPlanNotFound = errors.New("frontend tracking plan not found")

// ErrBackendTrackingPlanNotFound indicates backend tracking plan missing.
var ErrBackendTrackingPlanNotFound = errors.New("backend tracking plan not found")

// NewPlanObservabilityService creates a new observability planning service.
func NewPlanObservabilityService() PlanObservabilityService {
	return &planObservabilityService{
		metrics:  defaultMetricsDictionary(),
		frontend: defaultFrontendTrackingPlan(),
		backend:  defaultBackendTrackingPlan(),
	}
}

func (s *planObservabilityService) GetMetricsDictionary(ctx context.Context) (*MetricsDictionary, error) {
	if s == nil || s.metrics.Key == "" {
		return nil, ErrMetricsDictionaryNotFound
	}
	output := s.metrics
	return &output, nil
}

func (s *planObservabilityService) GetFrontendTrackingPlan(ctx context.Context) (*TrackingEventPlan, error) {
	if s == nil || s.frontend.Key == "" {
		return nil, ErrFrontendTrackingPlanNotFound
	}
	output := s.frontend
	return &output, nil
}

func (s *planObservabilityService) GetBackendTrackingPlan(ctx context.Context) (*TrackingEventPlan, error) {
	if s == nil || s.backend.Key == "" {
		return nil, ErrBackendTrackingPlanNotFound
	}
	output := s.backend
	return &output, nil
}

func defaultMetricsDictionary() MetricsDictionary {
	return MetricsDictionary{
		Key:     "monitoring_metrics_dictionary",
		Title:   "Monitoring metrics dictionary",
		Summary: "Prometheus metrics covering HTTP, execution, runtime, database, domain, LLM, websocket, system, and ops.",
		Metrics: observability.GetMetricsDictionary(),
		Notes: []string{
			"Use labels to slice by workspace_id, app_id, status, or provider/model.",
			"Histogram buckets are tuned for core request, execution, and runtime paths.",
		},
	}
}

func defaultFrontendTrackingPlan() TrackingEventPlan {
	return TrackingEventPlan{
		Key:     "frontend_tracking_events",
		Title:   "Frontend tracking event table",
		Summary: "Client-side analytics events for core workspace, app, workflow, runtime, and billing flows.",
		Events: []TrackingEventDefinition{
			{
				Key:         "workspace.created",
				Event:       "workspace.created",
				Category:    "workspace",
				Description: "Workspace created",
				Trigger:     "User completes workspace creation",
				Properties:  []string{"workspace_id", "user_id", "region", "plan"},
				Source:      "frontend",
			},
			{
				Key:         "workspace.selected",
				Event:       "workspace.selected",
				Category:    "workspace",
				Description: "Workspace switched",
				Trigger:     "User selects a workspace from the workspace switcher",
				Properties:  []string{"workspace_id", "user_id", "source"},
				Source:      "frontend",
			},
			{
				Key:         "app.created",
				Event:       "app.created",
				Category:    "app",
				Description: "App created",
				Trigger:     "App creation succeeds",
				Properties:  []string{"app_id", "workspace_id", "user_id", "source"},
				Source:      "frontend",
			},
			{
				Key:         "app.published",
				Event:       "app.published",
				Category:    "app",
				Description: "App published",
				Trigger:     "Publish action completes successfully",
				Properties:  []string{"app_id", "workspace_id", "version_id", "access_mode", "domain_bound"},
				Source:      "frontend",
			},
			{
				Key:         "workflow.editor.opened",
				Event:       "workflow.editor.opened",
				Category:    "workflow",
				Description: "Workflow editor opened",
				Trigger:     "User enters workflow editor",
				Properties:  []string{"workflow_id", "app_id", "workspace_id", "user_id", "source"},
				Source:      "frontend",
			},
			{
				Key:         "workflow.node.added",
				Event:       "workflow.node.added",
				Category:    "workflow",
				Description: "Workflow node added",
				Trigger:     "User adds a node in the editor",
				Properties:  []string{"workflow_id", "node_type", "source", "count"},
				Source:      "frontend",
			},
			{
				Key:         "workflow.node.config_saved",
				Event:       "workflow.node.config_saved",
				Category:    "workflow",
				Description: "Workflow node configuration saved",
				Trigger:     "User saves node configuration",
				Properties:  []string{"workflow_id", "node_id", "node_type", "has_validation_error"},
				Source:      "frontend",
			},
			{
				Key:         "runtime.entry.viewed",
				Event:       "runtime.entry.viewed",
				Category:    "runtime",
				Description: "Runtime entry viewed",
				Trigger:     "User opens the public runtime entry",
				Properties:  []string{"workspace_id", "app_id", "session_id", "client", "referrer"},
				Source:      "frontend",
			},
			{
				Key:         "runtime.schema.viewed",
				Event:       "runtime.schema.viewed",
				Category:    "runtime",
				Description: "Runtime schema viewed",
				Trigger:     "User requests the runtime schema",
				Properties:  []string{"workspace_id", "app_id", "session_id"},
				Source:      "frontend",
			},
			{
				Key:         "runtime.executed",
				Event:       "runtime.executed",
				Category:    "runtime",
				Description: "Runtime execution submitted",
				Trigger:     "User submits runtime execution",
				Properties:  []string{"workspace_id", "app_id", "session_id", "trigger_type", "input_size"},
				Source:      "frontend",
			},
			{
				Key:         "execution.cancel_requested",
				Event:       "execution.cancel_requested",
				Category:    "execution",
				Description: "Execution cancel requested",
				Trigger:     "User cancels an in-flight execution",
				Properties:  []string{"execution_id", "app_id", "workspace_id", "user_id"},
				Source:      "frontend",
			},
			{
				Key:         "plan.task.updated",
				Event:       "plan.task.updated",
				Category:    "planning",
				Description: "Plan task updated",
				Trigger:     "User updates a planning task",
				Properties:  []string{"task_id", "module_id", "status", "phase", "estimate_days"},
				Source:      "frontend",
			},
			{
				Key:         "billing.upgrade.clicked",
				Event:       "billing.upgrade.clicked",
				Category:    "billing",
				Description: "Upgrade CTA clicked",
				Trigger:     "User clicks upgrade call-to-action",
				Properties:  []string{"workspace_id", "plan", "source"},
				Source:      "frontend",
			},
		},
		Notes: []string{
			"Include user_id, workspace_id, and app_id when available for segmentation.",
			"Event names are stable identifiers for dashboarding.",
		},
	}
}

func defaultBackendTrackingPlan() TrackingEventPlan {
	metadata := entity.GetEventTypeMetadata()
	events := make([]TrackingEventDefinition, 0, len(metadata))
	for _, meta := range metadata {
		events = append(events, TrackingEventDefinition{
			Key:         string(meta.Type),
			Event:       string(meta.Type),
			Category:    meta.Category,
			Description: meta.Description,
			Trigger:     backendTriggerForCategory(meta.Category),
			Properties:  backendPropertiesForCategory(meta.Category),
			Source:      "runtime_events",
		})
	}
	return TrackingEventPlan{
		Key:     "backend_tracking_events",
		Title:   "Backend tracking event table",
		Summary: "Server-side events persisted to runtime_events for analytics, auditing, and replay.",
		Events:  events,
		Notes: []string{
			"Join with logs via trace_id or request_id for full incident timelines.",
			"Use metadata for event-specific payloads (domain, model, token usage, etc.).",
		},
	}
}

func backendTriggerForCategory(category string) string {
	triggers := map[string]string{
		"execution": "Execution lifecycle state change",
		"node":      "Node execution state change",
		"workspace": "Workspace lifecycle event",
		"app":       "App runtime or access event",
		"database":  "Database provision or migration event",
		"domain":    "Domain verification or certificate event",
		"llm":       "LLM request lifecycle event",
		"billing":   "Quota or billing lifecycle event",
		"security":  "Security enforcement event",
		"system":    "System operational event",
	}
	if trigger, ok := triggers[category]; ok {
		return trigger
	}
	return "Server-side event emitted"
}

func backendPropertiesForCategory(category string) []string {
	base := []string{
		"type",
		"severity",
		"message",
		"trace_id",
		"request_id",
		"workspace_id",
		"app_id",
		"execution_id",
		"user_id",
		"session_id",
		"node_id",
		"node_type",
		"duration_ms",
		"http_method",
		"http_path",
		"http_status",
		"remote_ip",
		"user_agent",
		"error_code",
		"error_message",
		"metadata",
		"sequence_num",
	}
	byCategory := map[string][]string{
		"execution": {"metadata.workflow_id"},
		"domain":    {"metadata.domain"},
		"llm":       {"metadata.provider", "metadata.model", "metadata.prompt_tokens", "metadata.completion_tokens", "metadata.total_tokens"},
	}
	merged := append([]string{}, base...)
	if extras, ok := byCategory[category]; ok {
		merged = append(merged, extras...)
	}
	return uniqueStrings(merged)
}

func uniqueStrings(values []string) []string {
	seen := make(map[string]struct{}, len(values))
	result := make([]string, 0, len(values))
	for _, value := range values {
		if value == "" {
			continue
		}
		if _, ok := seen[value]; ok {
			continue
		}
		seen[value] = struct{}{}
		result = append(result, value)
	}
	return result
}
