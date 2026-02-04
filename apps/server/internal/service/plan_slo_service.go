package service

import (
	"context"
	"errors"
)

// SLOIndicator SLO/SLA 指标项
type SLOIndicator struct {
	Key         string   `json:"key"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Source      string   `json:"source"`
	Metric      string   `json:"metric"`
	Objective   string   `json:"objective"`
	Window      string   `json:"window"`
	Target      string   `json:"target"`
	Query       string   `json:"query"`
	Notes       []string `json:"notes,omitempty"`
}

// SLOTable 指标表
type SLOTable struct {
	Key        string         `json:"key"`
	Title      string         `json:"title"`
	Indicators []SLOIndicator `json:"indicators"`
	Notes      []string       `json:"notes,omitempty"`
}

// PlanSLOService SLO/SLA 规划服务接口
type PlanSLOService interface {
	GetSLOTable(ctx context.Context) (*SLOTable, error)
}

type planSLOService struct {
	table SLOTable
}

// ErrSLOTableNotFound SLO 指标表不存在
var ErrSLOTableNotFound = errors.New("slo table not found")

// NewPlanSLOService 创建 SLO/SLA 规划服务
func NewPlanSLOService() PlanSLOService {
	return &planSLOService{
		table: defaultSLOTable(),
	}
}

func (s *planSLOService) GetSLOTable(ctx context.Context) (*SLOTable, error) {
	if s == nil || s.table.Key == "" {
		return nil, ErrSLOTableNotFound
	}
	table := s.table
	return &table, nil
}

func defaultSLOTable() SLOTable {
	return SLOTable{
		Key:   "slo_sla_metrics",
		Title: "SLO/SLA 验收指标表",
		Indicators: []SLOIndicator{
			{
				Key:         "runtime_latency_p95",
				Title:       "Runtime 响应时间 SLO",
				Description: "公开运行时请求的 P95 延迟",
				Source:      "prometheus",
				Metric:      "agentflow_http_request_duration_seconds",
				Objective:   "P95 < 2s",
				Window:      "5m",
				Target:      "2s",
				Query:       "histogram_quantile(0.95, sum(rate(agentflow_http_request_duration_seconds_bucket{method=\"POST\", path=\"/runtime/:workspaceSlug/:appSlug\"}[5m])) by (le))",
				Notes: []string{
					"若使用根域名入口，可将 path 替换为 \"/\" 或 \"/:workspaceSlug/:appSlug\"。",
				},
			},
			{
				Key:         "execution_success_rate",
				Title:       "执行成功率 SLO",
				Description: "工作流执行成功率",
				Source:      "prometheus",
				Metric:      "agentflow_execution_total",
				Objective:   "success_rate >= 99%",
				Window:      "5m",
				Target:      ">= 0.99",
				Query:       "sum(rate(agentflow_execution_total{status=\"completed\"}[5m])) / sum(rate(agentflow_execution_total[5m]))",
			},
			{
				Key:         "db_provision_success_rate",
				Title:       "DB Provision 成功率 SLO",
				Description: "数据库创建接口成功率",
				Source:      "prometheus",
				Metric:      "agentflow_http_requests_total",
				Objective:   "success_rate >= 99%",
				Window:      "30m",
				Target:      ">= 0.99",
				Query:       "sum(rate(agentflow_http_requests_total{method=\"POST\", path=\"/api/v1/workspaces/:id/database\", status=\"2xx\"}[30m])) / sum(rate(agentflow_http_requests_total{method=\"POST\", path=\"/api/v1/workspaces/:id/database\"}[30m]))",
			},
			{
				Key:         "db_provision_latency_p95",
				Title:       "DB Provision 耗时 SLO",
				Description: "数据库创建接口 P95 耗时",
				Source:      "prometheus",
				Metric:      "agentflow_http_request_duration_seconds",
				Objective:   "P95 < 60s",
				Window:      "30m",
				Target:      "60s",
				Query:       "histogram_quantile(0.95, sum(rate(agentflow_http_request_duration_seconds_bucket{method=\"POST\", path=\"/api/v1/workspaces/:id/database\"}[30m])) by (le))",
			},
			{
				Key:         "domain_verify_success_rate",
				Title:       "域名验证成功率 SLO",
				Description: "域名验证接口成功率",
				Source:      "prometheus",
				Metric:      "agentflow_http_requests_total",
				Objective:   "success_rate >= 99%",
				Window:      "30m",
				Target:      ">= 0.99",
				Query:       "sum(rate(agentflow_http_requests_total{method=\"POST\", path=\"/api/v1/apps/:id/domains/:domainId/verify\", status=\"2xx\"}[30m])) / sum(rate(agentflow_http_requests_total{method=\"POST\", path=\"/api/v1/apps/:id/domains/:domainId/verify\"}[30m]))",
			},
		},
		Notes: []string{
			"PromQL 查询默认聚合全局，可按 workspace_id、app_id 或 status 维度扩展。",
			"如需区分 4xx/5xx，可补充 status 标签筛选。",
		},
	}
}
