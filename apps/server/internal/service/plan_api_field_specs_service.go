package service

import (
	"context"
	"errors"
)

// APIFieldSpec API 字段规范
type APIFieldSpec struct {
	Name        string `json:"name"`
	Description string `json:"description,omitempty"`
	Required    bool   `json:"required,omitempty"`
}

// APIOperationSpec API 操作规范
type APIOperationSpec struct {
	Key            string         `json:"key"`
	Title          string         `json:"title"`
	Method         string         `json:"method"`
	Path           string         `json:"path"`
	RequestFields  []APIFieldSpec `json:"request_fields,omitempty"`
	ResponseFields []APIFieldSpec `json:"response_fields,omitempty"`
	Notes          []string       `json:"notes,omitempty"`
}

// APIResourceSpec API 资源规范
type APIResourceSpec struct {
	Key        string             `json:"key"`
	Title      string             `json:"title"`
	Operations []APIOperationSpec `json:"operations"`
	Notes      []string           `json:"notes,omitempty"`
}

// APIFieldSpecTable API 字段级规范表
type APIFieldSpecTable struct {
	Key       string            `json:"key"`
	Title     string            `json:"title"`
	Resources []APIResourceSpec `json:"resources"`
	Notes     []string          `json:"notes,omitempty"`
}

// PlanAPIFieldSpecService API 字段级规范规划服务接口
type PlanAPIFieldSpecService interface {
	GetTable(ctx context.Context) (*APIFieldSpecTable, error)
}

type planAPIFieldSpecService struct {
	table APIFieldSpecTable
}

// ErrAPIFieldSpecNotFound API 字段级规范不存在
var ErrAPIFieldSpecNotFound = errors.New("api field spec not found")

// NewPlanAPIFieldSpecService 创建 API 字段级规范规划服务
func NewPlanAPIFieldSpecService() PlanAPIFieldSpecService {
	return &planAPIFieldSpecService{
		table: defaultAPIFieldSpecTable(),
	}
}

func (s *planAPIFieldSpecService) GetTable(ctx context.Context) (*APIFieldSpecTable, error) {
	if s == nil || s.table.Key == "" {
		return nil, ErrAPIFieldSpecNotFound
	}
	output := s.table
	return &output, nil
}

func defaultAPIFieldSpecTable() APIFieldSpecTable {
	return APIFieldSpecTable{
		Key:   "api_field_specs",
		Title: "API 字段级规范（字段表）",
		Resources: []APIResourceSpec{
			{
				Key:   "workspace",
				Title: "Workspace API",
				Operations: []APIOperationSpec{
					{
						Key:    "create",
						Title:  "创建 Workspace",
						Method: "POST",
						Path:   "/api/v1/workspaces",
						RequestFields: []APIFieldSpec{
							{Name: "name", Required: true},
							{Name: "slug"},
							{Name: "region"},
							{Name: "settings"},
						},
					},
					{
						Key:    "update",
						Title:  "更新 Workspace",
						Method: "PATCH",
						Path:   "/api/v1/workspaces/:id",
						RequestFields: []APIFieldSpec{
							{Name: "name"},
							{Name: "slug"},
							{Name: "status"},
							{Name: "plan"},
						},
					},
				},
			},
			{
				Key:   "app",
				Title: "App API",
				Operations: []APIOperationSpec{
					{
						Key:    "create",
						Title:  "创建 App",
						Method: "POST",
						Path:   "/api/v1/apps",
						RequestFields: []APIFieldSpec{
							{Name: "name", Required: true},
							{Name: "slug"},
							{Name: "description"},
							{Name: "workflow_id"},
							{Name: "ui_schema"},
						},
					},
					{
						Key:    "publish",
						Title:  "发布 App",
						Method: "POST",
						Path:   "/api/v1/apps/:id/publish",
						RequestFields: []APIFieldSpec{
							{Name: "access_policy"},
							{Name: "domain_bindings"},
						},
					},
					{
						Key:    "version",
						Title:  "创建 App 版本",
						Method: "POST",
						Path:   "/api/v1/apps/:id/versions",
						RequestFields: []APIFieldSpec{
							{Name: "changelog"},
							{Name: "config_json"},
						},
					},
				},
			},
			{
				Key:   "runtime",
				Title: "Runtime API",
				Operations: []APIOperationSpec{
					{
						Key:    "execute",
						Title:  "运行时执行",
						Method: "POST",
						Path:   "/runtime/:workspaceSlug/:appSlug",
						RequestFields: []APIFieldSpec{
							{Name: "inputs", Required: true},
							{Name: "session_id"},
							{Name: "client_context"},
							{Name: "dry_run"},
						},
						ResponseFields: []APIFieldSpec{
							{Name: "outputs"},
							{Name: "execution_id"},
							{Name: "usage"},
						},
					},
				},
			},
			{
				Key:   "domain",
				Title: "Domain API",
				Operations: []APIOperationSpec{
					{
						Key:    "bind",
						Title:  "绑定域名",
						Method: "POST",
						Path:   "/api/v1/apps/:id/domains",
						RequestFields: []APIFieldSpec{
							{Name: "domain", Required: true},
						},
						ResponseFields: []APIFieldSpec{
							{Name: "verification_token"},
							{Name: "status"},
						},
					},
				},
			},
			{
				Key:   "db_provisioner",
				Title: "DB Provisioner API",
				Operations: []APIOperationSpec{
					{
						Key:    "provision",
						Title:  "创建独立数据库",
						Method: "POST",
						Path:   "/api/v1/workspaces/:id/database",
						RequestFields: []APIFieldSpec{
							{Name: "db_name"},
							{Name: "region"},
						},
						ResponseFields: []APIFieldSpec{
							{Name: "status"},
							{Name: "secret_ref"},
						},
					},
				},
			},
		},
		Notes: []string{
			"字段级规范用于 API 设计与前后端对齐。",
		},
	}
}
