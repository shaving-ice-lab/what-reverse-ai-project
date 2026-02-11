package service

import (
	"context"
	"fmt"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
)

// WorkflowTemplate 工作流模板
type WorkflowTemplate struct {
	ID          string                 `json:"id"`
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	Category    string                 `json:"category"`
	Icon        string                 `json:"icon"`
	Definition  map[string]interface{} `json:"definition"`
	Variables   map[string]interface{} `json:"variables,omitempty"`
	Builtin     bool                   `json:"builtin"`
}

// WorkflowTemplateService 工作流模板服务
type WorkflowTemplateService interface {
	ListTemplates(ctx context.Context) []WorkflowTemplate
	GetTemplate(ctx context.Context, templateID string) (*WorkflowTemplate, error)
	CreateFromTemplate(ctx context.Context, userID uuid.UUID, templateID string, name string) (*entity.Workflow, error)
	SaveAsTemplate(ctx context.Context, userID uuid.UUID, workflowID uuid.UUID, name, description, category string) (*WorkflowTemplate, error)
}

type workflowTemplateService struct {
	workflowService WorkflowService
	builtinTemplates []WorkflowTemplate
	customTemplates  []WorkflowTemplate
}

// NewWorkflowTemplateService 创建模板服务
func NewWorkflowTemplateService(workflowService WorkflowService) WorkflowTemplateService {
	return &workflowTemplateService{
		workflowService:  workflowService,
		builtinTemplates: initBuiltinTemplates(),
		customTemplates:  make([]WorkflowTemplate, 0),
	}
}

func (s *workflowTemplateService) ListTemplates(ctx context.Context) []WorkflowTemplate {
	all := make([]WorkflowTemplate, 0, len(s.builtinTemplates)+len(s.customTemplates))
	all = append(all, s.builtinTemplates...)
	all = append(all, s.customTemplates...)
	return all
}

func (s *workflowTemplateService) GetTemplate(ctx context.Context, templateID string) (*WorkflowTemplate, error) {
	for _, t := range s.builtinTemplates {
		if t.ID == templateID {
			return &t, nil
		}
	}
	for _, t := range s.customTemplates {
		if t.ID == templateID {
			return &t, nil
		}
	}
	return nil, fmt.Errorf("template %q not found", templateID)
}

func (s *workflowTemplateService) CreateFromTemplate(ctx context.Context, userID uuid.UUID, templateID string, name string) (*entity.Workflow, error) {
	tmpl, err := s.GetTemplate(ctx, templateID)
	if err != nil {
		return nil, err
	}

	if name == "" {
		name = tmpl.Name + " (Copy)"
	}

	desc := tmpl.Description
	req := CreateWorkflowRequest{
		Name:        name,
		Description: &desc,
		Definition:  entity.JSON(tmpl.Definition),
	}
	if tmpl.Variables != nil {
		req.Variables = entity.JSON(tmpl.Variables)
	}

	return s.workflowService.Create(ctx, userID, req)
}

func (s *workflowTemplateService) SaveAsTemplate(ctx context.Context, userID uuid.UUID, workflowID uuid.UUID, name, description, category string) (*WorkflowTemplate, error) {
	workflow, err := s.workflowService.GetByID(ctx, workflowID)
	if err != nil {
		return nil, fmt.Errorf("workflow not found: %w", err)
	}

	tmpl := WorkflowTemplate{
		ID:          fmt.Sprintf("custom_%s", uuid.New().String()[:8]),
		Name:        name,
		Description: description,
		Category:    category,
		Icon:        "FileText",
		Definition:  workflow.Definition,
		Variables:   workflow.Variables,
		Builtin:     false,
	}

	s.customTemplates = append(s.customTemplates, tmpl)
	return &tmpl, nil
}

// ========== Built-in Templates ==========

func initBuiltinTemplates() []WorkflowTemplate {
	return []WorkflowTemplate{
		crudTemplate(),
		dashboardTemplate(),
		approvalTemplate(),
	}
}

func crudTemplate() WorkflowTemplate {
	return WorkflowTemplate{
		ID:          "builtin_crud",
		Name:        "CRUD Application",
		Description: "Standard CRUD workflow: list data → form submission → insert/update database → render table page",
		Category:    "application",
		Icon:        "Table",
		Builtin:     true,
		Definition: map[string]interface{}{
			"nodes": []map[string]interface{}{
				{
					"id": "start", "type": "start",
					"position": map[string]interface{}{"x": 100, "y": 200},
					"data":     map[string]interface{}{"label": "Start"},
				},
				{
					"id": "query_list", "type": "db_select",
					"position": map[string]interface{}{"x": 350, "y": 200},
					"data":     map[string]interface{}{"label": "Query List"},
					"config": map[string]interface{}{
						"operation": "select",
						"table":     "{{table_name}}",
						"columns":   []string{},
						"limit":     50,
						"order_by":  []map[string]interface{}{{"column": "created_at", "direction": "DESC"}},
					},
				},
				{
					"id": "render_table", "type": "page_render",
					"position": map[string]interface{}{"x": 600, "y": 100},
					"data":     map[string]interface{}{"label": "Render Table"},
					"config": map[string]interface{}{
						"page_id": "list",
						"title":   "{{table_name}} List",
						"layout":  "table",
						"components": []map[string]interface{}{
							{"type": "data_table", "data_key": "rows", "config": map[string]interface{}{}},
						},
					},
				},
				{
					"id": "form_submit", "type": "form_submit",
					"position": map[string]interface{}{"x": 600, "y": 300},
					"data":     map[string]interface{}{"label": "Form Submit"},
					"config": map[string]interface{}{
						"form_data_key": "form_data",
					},
				},
				{
					"id": "insert_row", "type": "db_insert",
					"position": map[string]interface{}{"x": 850, "y": 300},
					"data":     map[string]interface{}{"label": "Insert Row"},
					"config": map[string]interface{}{
						"operation": "insert",
						"table":     "{{table_name}}",
					},
				},
				{
					"id": "end", "type": "end",
					"position": map[string]interface{}{"x": 1100, "y": 200},
					"data":     map[string]interface{}{"label": "End"},
				},
			},
			"edges": []map[string]interface{}{
				{"id": "e1", "source": "start", "target": "query_list"},
				{"id": "e2", "source": "query_list", "target": "render_table"},
				{"id": "e3", "source": "query_list", "target": "form_submit"},
				{"id": "e4", "source": "form_submit", "target": "insert_row"},
				{"id": "e5", "source": "render_table", "target": "end"},
				{"id": "e6", "source": "insert_row", "target": "end"},
			},
		},
		Variables: map[string]interface{}{
			"table_name": "my_table",
		},
	}
}

func dashboardTemplate() WorkflowTemplate {
	return WorkflowTemplate{
		ID:          "builtin_dashboard",
		Name:        "Dashboard",
		Description: "Dashboard workflow: aggregate database queries → render stats cards and charts",
		Category:    "analytics",
		Icon:        "BarChart3",
		Builtin:     true,
		Definition: map[string]interface{}{
			"nodes": []map[string]interface{}{
				{
					"id": "start", "type": "start",
					"position": map[string]interface{}{"x": 100, "y": 200},
					"data":     map[string]interface{}{"label": "Start"},
				},
				{
					"id": "query_stats", "type": "db_select",
					"position": map[string]interface{}{"x": 350, "y": 200},
					"data":     map[string]interface{}{"label": "Query Data"},
					"config": map[string]interface{}{
						"operation": "select",
						"table":     "{{table_name}}",
					},
				},
				{
					"id": "aggregate", "type": "aggregate",
					"position": map[string]interface{}{"x": 600, "y": 200},
					"data":     map[string]interface{}{"label": "Aggregate Stats"},
					"config": map[string]interface{}{
						"data_key": "rows",
						"aggregations": []map[string]interface{}{
							{"function": "count", "column": "*", "alias": "total_count"},
						},
					},
				},
				{
					"id": "render_dashboard", "type": "page_render",
					"position": map[string]interface{}{"x": 850, "y": 200},
					"data":     map[string]interface{}{"label": "Render Dashboard"},
					"config": map[string]interface{}{
						"page_id": "dashboard",
						"title":   "Dashboard",
						"layout":  "dashboard",
						"components": []map[string]interface{}{
							{"type": "stats_card", "data_key": "result", "label": "Total Records"},
							{"type": "chart", "data_key": "result", "config": map[string]interface{}{"chart_type": "bar"}},
						},
					},
				},
				{
					"id": "end", "type": "end",
					"position": map[string]interface{}{"x": 1100, "y": 200},
					"data":     map[string]interface{}{"label": "End"},
				},
			},
			"edges": []map[string]interface{}{
				{"id": "e1", "source": "start", "target": "query_stats"},
				{"id": "e2", "source": "query_stats", "target": "aggregate"},
				{"id": "e3", "source": "aggregate", "target": "render_dashboard"},
				{"id": "e4", "source": "render_dashboard", "target": "end"},
			},
		},
		Variables: map[string]interface{}{
			"table_name": "my_table",
		},
	}
}

func approvalTemplate() WorkflowTemplate {
	return WorkflowTemplate{
		ID:          "builtin_approval",
		Name:        "Approval Flow",
		Description: "Approval workflow: form submission → condition check (status) → notification → update database",
		Category:    "business",
		Icon:        "CheckSquare",
		Builtin:     true,
		Definition: map[string]interface{}{
			"nodes": []map[string]interface{}{
				{
					"id": "start", "type": "start",
					"position": map[string]interface{}{"x": 100, "y": 200},
					"data":     map[string]interface{}{"label": "Start"},
				},
				{
					"id": "form_submit", "type": "form_submit",
					"position": map[string]interface{}{"x": 350, "y": 200},
					"data":     map[string]interface{}{"label": "Submit Request"},
					"config": map[string]interface{}{
						"fields": []map[string]interface{}{
							{"name": "title", "type": "string", "required": true, "label": "Request Title"},
							{"name": "description", "type": "string", "label": "Description"},
							{"name": "amount", "type": "number", "label": "Amount"},
						},
					},
				},
				{
					"id": "check_amount", "type": "condition",
					"position": map[string]interface{}{"x": 600, "y": 200},
					"data":     map[string]interface{}{"label": "Check Amount"},
					"config": map[string]interface{}{
						"conditions": []map[string]interface{}{
							{"expression": "{{amount}} > 1000", "target": "notify_manager"},
						},
						"default": "auto_approve",
					},
				},
				{
					"id": "notify_manager", "type": "notification",
					"position": map[string]interface{}{"x": 850, "y": 100},
					"data":     map[string]interface{}{"label": "Notify Manager"},
					"config": map[string]interface{}{
						"channel": "in_app",
						"subject": "Approval Required: {{title}}",
						"body":    "A new request requires your approval. Amount: {{amount}}",
					},
				},
				{
					"id": "auto_approve", "type": "db_update",
					"position": map[string]interface{}{"x": 850, "y": 300},
					"data":     map[string]interface{}{"label": "Auto Approve"},
					"config": map[string]interface{}{
						"operation": "update",
						"table":     "requests",
						"values":    map[string]interface{}{"status": "approved"},
						"where":     "id = {{request_id}}",
					},
				},
				{
					"id": "end", "type": "end",
					"position": map[string]interface{}{"x": 1100, "y": 200},
					"data":     map[string]interface{}{"label": "End"},
				},
			},
			"edges": []map[string]interface{}{
				{"id": "e1", "source": "start", "target": "form_submit"},
				{"id": "e2", "source": "form_submit", "target": "check_amount"},
				{"id": "e3", "source": "check_amount", "target": "notify_manager"},
				{"id": "e4", "source": "check_amount", "target": "auto_approve"},
				{"id": "e5", "source": "notify_manager", "target": "end"},
				{"id": "e6", "source": "auto_approve", "target": "end"},
			},
		},
	}
}
