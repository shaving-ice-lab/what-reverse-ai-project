package service

import (
	"context"
	"errors"
)

// FieldNamingRule 字段命名规范
type FieldNamingRule struct {
	Key         string   `json:"key"`
	Scope       string   `json:"scope"`
	Convention  string   `json:"convention"`
	Description string   `json:"description"`
	Example     string   `json:"example,omitempty"`
	Enforced    bool     `json:"enforced"`
	Source      string   `json:"source,omitempty"`
	Notes       []string `json:"notes,omitempty"`
}

// ValidationRule 字段校验规则
type ValidationRule struct {
	Key         string   `json:"key"`
	Field       string   `json:"field"`
	Rule        string   `json:"rule"`
	Description string   `json:"description"`
	Enforced    bool     `json:"enforced"`
	Source      string   `json:"source,omitempty"`
	Notes       []string `json:"notes,omitempty"`
}

// SecurityFilterRule 输入/输出安全过滤规则
type SecurityFilterRule struct {
	Key         string   `json:"key"`
	Scope       string   `json:"scope"`
	Rule        string   `json:"rule"`
	Description string   `json:"description"`
	Enforced    bool     `json:"enforced"`
	Source      string   `json:"source,omitempty"`
	Notes       []string `json:"notes,omitempty"`
}

// PaginationProtocol 通用分页与排序协议
type PaginationProtocol struct {
	PageParam         string   `json:"page_param"`
	PageSizeParam     string   `json:"page_size_param"`
	SortParam         string   `json:"sort_param"`
	OrderParam        string   `json:"order_param"`
	SortParamAliases  []string `json:"sort_param_aliases,omitempty"`
	OrderParamAliases []string `json:"order_param_aliases,omitempty"`
	DefaultPage       int      `json:"default_page"`
	DefaultPageSize   int      `json:"default_page_size"`
	DefaultSort       string   `json:"default_sort"`
	DefaultOrder      string   `json:"default_order"`
	AllowedOrder      []string `json:"allowed_order"`
	Notes             []string `json:"notes,omitempty"`
}

// APIFieldRulesSpec API 字段规范与校验规则
type APIFieldRulesSpec struct {
	Key        string               `json:"key"`
	Title      string               `json:"title"`
	Naming     []FieldNamingRule    `json:"naming"`
	Validation []ValidationRule     `json:"validation"`
	Security   []SecurityFilterRule `json:"security"`
	Pagination PaginationProtocol   `json:"pagination"`
	Notes      []string             `json:"notes,omitempty"`
}

// PlanAPIFieldRulesService API 字段规范规划服务接口
type PlanAPIFieldRulesService interface {
	GetRules(ctx context.Context) (*APIFieldRulesSpec, error)
}

type planAPIFieldRulesService struct {
	spec APIFieldRulesSpec
}

// ErrAPIFieldRulesNotFound API 字段规范不存在
var ErrAPIFieldRulesNotFound = errors.New("api field rules not found")

// NewPlanAPIFieldRulesService 创建 API 字段规范规划服务
func NewPlanAPIFieldRulesService() PlanAPIFieldRulesService {
	return &planAPIFieldRulesService{
		spec: defaultAPIFieldRulesSpec(),
	}
}

func (s *planAPIFieldRulesService) GetRules(ctx context.Context) (*APIFieldRulesSpec, error) {
	if s == nil || s.spec.Key == "" {
		return nil, ErrAPIFieldRulesNotFound
	}
	output := s.spec
	return &output, nil
}

func defaultAPIFieldRulesSpec() APIFieldRulesSpec {
	return APIFieldRulesSpec{
		Key:   "api_field_rules",
		Title: "API 字段规范与校验规则",
		Naming: []FieldNamingRule{
			{
				Key:         "json_snake_case",
				Scope:       "http_json",
				Convention:  "snake_case",
				Description: "API 请求/响应 JSON 字段统一使用 snake_case",
				Example:     "workspace_id / created_at",
				Enforced:    true,
				Source:      "apps/server/internal/api/handler/* (json tags)",
			},
			{
				Key:         "query_params_snake_case",
				Scope:       "query_params",
				Convention:  "snake_case",
				Description: "查询参数使用 snake_case",
				Example:     "page_size / order_by",
				Enforced:    true,
				Source:      "apps/server/internal/api/handler/* (QueryParam)",
			},
		},
		Validation: []ValidationRule{
			{
				Key:         "slug_format",
				Field:       "workspace.slug",
				Rule:        "^[a-z0-9]+(?:-[a-z0-9]+)*$",
				Description: "仅允许小写字母、数字与连字符，首尾不为连字符",
				Enforced:    true,
				Source:      "apps/server/internal/service/workspace_service.go (generateSlug)",
				Notes: []string{
					"空格替换为连字符，非法字符会被移除，连续连字符会被压缩。",
				},
			},
			{
				Key:         "domain_format",
				Field:       "workspace_domains.domain",
				Rule:        "^(?i)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\\.)+[a-z]{2,}$",
				Description: "仅允许标准域名，禁止协议/路径/空格/通配符",
				Enforced:    true,
				Source:      "apps/server/internal/service/workspace_domain_service.go (normalizeDomain)",
				Notes: []string{
					"会自动转小写并去除末尾点号。",
				},
			},
			{
				Key:         "version_format",
				Field:       "workspace_versions.version",
				Rule:        "v{n}",
				Description: "版本号由服务端自动生成，按 v1/v2 递增",
				Enforced:    true,
				Source:      "apps/server/internal/service/workspace_service.go (CreateVersion)",
			},
		},
		Security: []SecurityFilterRule{
			{
				Key:         "html_escape",
				Scope:       "client_render",
				Rule:        "对用户输入进行 HTML 转义后再渲染",
				Description: "防止 XSS 与富文本注入",
				Enforced:    false,
				Notes: []string{
					"当前由前端渲染层负责处理，后端不做自动转义。",
				},
			},
			{
				Key:         "json_size_limit",
				Scope:       "request_body",
				Rule:        "建议单次 JSON payload <= 1MB",
				Description: "避免超大 payload 影响性能与稳定性",
				Enforced:    false,
				Notes: []string{
					"当前未设置全局 body limit，可按接口逐步补齐。",
				},
			},
			{
				Key:         "pii_sanitization",
				Scope:       "runtime_events",
				Rule:        "运行时事件写入前进行 PII 脱敏",
				Description: "日志与审计输出避免暴露敏感信息",
				Enforced:    true,
				Source:      "apps/server/internal/service/event_recorder.go (PII sanitizer)",
			},
		},
		Pagination: PaginationProtocol{
			PageParam:         "page",
			PageSizeParam:     "page_size",
			SortParam:         "sort",
			OrderParam:        "order",
			SortParamAliases:  []string{"sort_by", "order_by"},
			OrderParamAliases: []string{"sort_order"},
			DefaultPage:       1,
			DefaultPageSize:   20,
			DefaultSort:       "updated_at",
			DefaultOrder:      "desc",
			AllowedOrder:      []string{"asc", "desc"},
			Notes: []string{
				"部分接口使用 order_by（如对话列表），其含义等同于 sort。",
				"默认排序字段在不同资源中可能为 created_at 或 updated_at。",
			},
		},
		Notes: []string{
			"规则为 API 级规范输出，实际校验以服务端实现为准。",
		},
	}
}
