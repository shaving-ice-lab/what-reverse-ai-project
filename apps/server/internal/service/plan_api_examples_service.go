package service

import (
	"context"
	"errors"
)

// APIExample API 请求/响应示例
type APIExample struct {
	Key      string      `json:"key"`
	Title    string      `json:"title"`
	Method   string      `json:"method"`
	Path     string      `json:"path"`
	Request  interface{} `json:"request,omitempty"`
	Response interface{} `json:"response,omitempty"`
	Notes    []string    `json:"notes,omitempty"`
}

// APIExampleTable API 示例表
type APIExampleTable struct {
	Key      string       `json:"key"`
	Title    string       `json:"title"`
	Examples []APIExample `json:"examples"`
	Notes    []string     `json:"notes,omitempty"`
}

// PlanAPIExamplesService API 示例规划服务接口
type PlanAPIExamplesService interface {
	GetExamples(ctx context.Context) (*APIExampleTable, error)
}

type planAPIExamplesService struct {
	table APIExampleTable
}

// ErrAPIExamplesNotFound API 示例不存在
var ErrAPIExamplesNotFound = errors.New("api examples not found")

// NewPlanAPIExamplesService 创建 API 示例规划服务
func NewPlanAPIExamplesService() PlanAPIExamplesService {
	return &planAPIExamplesService{
		table: defaultAPIExampleTable(),
	}
}

func (s *planAPIExamplesService) GetExamples(ctx context.Context) (*APIExampleTable, error) {
	if s == nil || s.table.Key == "" {
		return nil, ErrAPIExamplesNotFound
	}
	output := s.table
	return &output, nil
}

func defaultAPIExampleTable() APIExampleTable {
	return APIExampleTable{
		Key:   "api_examples",
		Title: "API 请求/响应示例",
		Examples: []APIExample{
			{
				Key:    "workspace_create",
				Title:  "Workspace 创建示例",
				Method: "POST",
				Path:   "/api/v1/workspaces",
				Request: map[string]interface{}{
					"name":   "Default Workspace",
					"slug":   "vantiboolean",
					"region": "ap-east-1",
				},
				Response: map[string]interface{}{
					"code":       "OK",
					"message":    "OK",
					"trace_id":   "trace_xxx",
					"request_id": "req_xxx",
					"data": map[string]interface{}{
						"workspace": map[string]interface{}{
							"id":            "ws_123",
							"owner_user_id": "user_123",
							"name":          "Default Workspace",
							"slug":          "vantiboolean",
							"region":        "ap-east-1",
							"created_at":    "2026-02-01T12:00:00Z",
						},
					},
				},
			},
			{
				Key:    "app_publish",
				Title:  "App 发布示例",
				Method: "POST",
				Path:   "/api/v1/apps/{id}/publish",
				Request: map[string]interface{}{
					"version_id": "ver_123",
					"access_policy": map[string]interface{}{
						"access_mode":     "public_anonymous",
						"rate_limit_json": map[string]interface{}{"per_minute": 60},
					},
				},
				Response: map[string]interface{}{
					"code":       "OK",
					"message":    "OK",
					"trace_id":   "trace_xxx",
					"request_id": "req_xxx",
					"data": map[string]interface{}{
						"app": map[string]interface{}{
							"id":                 "app_123",
							"name":               "Daily Report",
							"status":             "published",
							"current_version_id": "ver_123",
							"published_at":       "2026-02-01T12:05:00Z",
						},
					},
				},
			},
			{
				Key:    "runtime_execute",
				Title:  "Runtime 执行示例",
				Method: "POST",
				Path:   "/runtime/{workspaceSlug}/{appSlug}",
				Request: map[string]interface{}{
					"inputs": map[string]interface{}{
						"prompt": "帮我生成日报",
					},
					"trigger_type":  "app_runtime",
					"captcha_token": "captcha_xxx",
				},
				Response: map[string]interface{}{
					"code":       "OK",
					"message":    "OK",
					"trace_id":   "trace_xxx",
					"request_id": "req_xxx",
					"data": map[string]interface{}{
						"execution_id": "exec_123",
						"status":       "pending",
						"workflow_id":  "wf_123",
						"started_at":   "2026-02-01T12:10:00Z",
						"session_id":   "sess_anon_123",
						"message":      "执行已开始",
					},
				},
				Notes: []string{
					"匿名访问会返回 session_id，并通过 X-App-Session-Id 复用。",
				},
			},
		},
		Notes: []string{
			"示例结构与统一响应格式保持一致。",
			"request_id/trace_id 为链路追踪字段。",
		},
	}
}
