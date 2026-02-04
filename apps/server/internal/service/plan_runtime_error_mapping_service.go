package service

import (
	"context"
	"errors"
)

// RuntimeErrorMappingItem 运行时错误映射项
type RuntimeErrorMappingItem struct {
	ErrorCode      string   `json:"error_code"`
	UserMessage    string   `json:"user_message"`
	HTTPStatus     int      `json:"http_status"`
	Category       string   `json:"category"`
	Retryable      bool     `json:"retryable"`
	InternalErrors []string `json:"internal_errors,omitempty"`
	Notes          []string `json:"notes,omitempty"`
}

// RuntimeErrorMappingTable 运行时错误映射表
type RuntimeErrorMappingTable struct {
	Key      string                    `json:"key"`
	Title    string                    `json:"title"`
	Mappings []RuntimeErrorMappingItem `json:"mappings"`
	Notes    []string                  `json:"notes,omitempty"`
}

// PlanRuntimeErrorMappingService 运行时错误映射规划服务接口
type PlanRuntimeErrorMappingService interface {
	GetTable(ctx context.Context) (*RuntimeErrorMappingTable, error)
}

type planRuntimeErrorMappingService struct {
	table RuntimeErrorMappingTable
}

// ErrRuntimeErrorMappingNotFound 运行时错误映射表不存在
var ErrRuntimeErrorMappingNotFound = errors.New("runtime error mapping not found")

// NewPlanRuntimeErrorMappingService 创建运行时错误映射规划服务
func NewPlanRuntimeErrorMappingService() PlanRuntimeErrorMappingService {
	return &planRuntimeErrorMappingService{
		table: defaultRuntimeErrorMappingTable(),
	}
}

func (s *planRuntimeErrorMappingService) GetTable(ctx context.Context) (*RuntimeErrorMappingTable, error) {
	if s == nil || s.table.Key == "" {
		return nil, ErrRuntimeErrorMappingNotFound
	}
	output := s.table
	return &output, nil
}

func defaultRuntimeErrorMappingTable() RuntimeErrorMappingTable {
	return RuntimeErrorMappingTable{
		Key:   "runtime_error_mapping",
		Title: "运行时错误与用户提示映射表",
		Mappings: []RuntimeErrorMappingItem{
			{
				ErrorCode:      "INVALID_TOKEN",
				UserMessage:    "无效或过期的 Token",
				HTTPStatus:     401,
				Category:       "auth",
				Retryable:      false,
				InternalErrors: []string{"jwt.ErrInvalidKey"},
			},
			{
				ErrorCode:      "UNAUTHORIZED",
				UserMessage:    "需要登录后访问",
				HTTPStatus:     401,
				Category:       "auth",
				Retryable:      false,
				InternalErrors: []string{"ErrRuntimeAuthRequired"},
			},
			{
				ErrorCode:   "FORBIDDEN",
				UserMessage: "无权限访问该 App",
				HTTPStatus:  403,
				Category:    "access",
				Retryable:   false,
				InternalErrors: []string{
					"ErrRuntimeAccessDenied",
					"ErrWorkspaceUnauthorized",
					"ErrUnauthorized",
				},
			},
			{
				ErrorCode:   "NOT_FOUND",
				UserMessage: "App 不存在或未发布",
				HTTPStatus:  404,
				Category:    "resource",
				Retryable:   false,
				InternalErrors: []string{
					"ErrRuntimeWorkspaceNotFound",
					"ErrRuntimeAppNotFound",
					"ErrRuntimePolicyNotFound",
					"ErrRuntimeNotPublished",
					"ErrWorkspaceNotFound",
				},
			},
			{
				ErrorCode:      "DOMAIN_NOT_FOUND",
				UserMessage:    "域名未绑定",
				HTTPStatus:     404,
				Category:       "domain",
				Retryable:      false,
				InternalErrors: []string{"ErrRuntimeDomainNotFound"},
			},
			{
				ErrorCode:      "DOMAIN_NOT_ACTIVE",
				UserMessage:    "域名未生效",
				HTTPStatus:     409,
				Category:       "domain",
				Retryable:      false,
				InternalErrors: []string{"ErrRuntimeDomainNotActive"},
			},
			{
				ErrorCode:      "INVALID_DOMAIN",
				UserMessage:    "域名无效",
				HTTPStatus:     400,
				Category:       "validation",
				Retryable:      false,
				InternalErrors: []string{"ErrRuntimeInvalidDomain"},
			},
			{
				ErrorCode:      "INVALID_SLUG",
				UserMessage:    "访问入口参数无效",
				HTTPStatus:     400,
				Category:       "validation",
				Retryable:      false,
				InternalErrors: []string{"ErrRuntimeInvalidSlug"},
			},
			{
				ErrorCode:      "VERSION_REQUIRED",
				UserMessage:    "App 版本未就绪",
				HTTPStatus:     400,
				Category:       "validation",
				Retryable:      false,
				InternalErrors: []string{"ErrRuntimeVersionRequired", "ErrRuntimeVersionNotFound"},
			},
			{
				ErrorCode:      "INVALID_REQUEST",
				UserMessage:    "请求参数无效",
				HTTPStatus:     400,
				Category:       "validation",
				Retryable:      false,
				InternalErrors: []string{"BindError"},
			},
			{
				ErrorCode:      "INVALID_UI_SCHEMA",
				UserMessage:    "UI Schema 无效",
				HTTPStatus:     400,
				Category:       "validation",
				Retryable:      false,
				InternalErrors: []string{"UISchemaNormalizeError"},
			},
			{
				ErrorCode:      "INVALID_INPUTS",
				UserMessage:    "输入校验失败",
				HTTPStatus:     400,
				Category:       "validation",
				Retryable:      false,
				InternalErrors: []string{"UISchemaValidationError"},
			},
			{
				ErrorCode:      "WORKFLOW_REQUIRED",
				UserMessage:    "App 未绑定工作流",
				HTTPStatus:     400,
				Category:       "validation",
				Retryable:      false,
				InternalErrors: []string{"MissingWorkflowID"},
			},
			{
				ErrorCode:      "RATE_LIMITED",
				UserMessage:    "访问过于频繁",
				HTTPStatus:     429,
				Category:       "rate_limit",
				Retryable:      true,
				InternalErrors: []string{"ErrRuntimeRateLimited"},
				Notes:          []string{"优先使用 retry_after_seconds 或 Retry-After 指示重试时间。"},
			},
			{
				ErrorCode:      "IP_BLOCKED",
				UserMessage:    "访问已被封禁",
				HTTPStatus:     403,
				Category:       "abuse",
				Retryable:      false,
				InternalErrors: []string{"ErrRuntimeIPBlocked"},
			},
			{
				ErrorCode:      "SESSION_BLOCKED",
				UserMessage:    "会话已被封禁",
				HTTPStatus:     403,
				Category:       "abuse",
				Retryable:      false,
				InternalErrors: []string{"ErrRuntimeSessionBlocked"},
			},
			{
				ErrorCode:      "INVALID_USAGE",
				UserMessage:    "用量数据无效",
				HTTPStatus:     400,
				Category:       "billing",
				Retryable:      false,
				InternalErrors: []string{"ErrBillingInvalidUsage", "ErrBillingInvalidDimension"},
			},
			{
				ErrorCode:      "APP_NOT_FOUND",
				UserMessage:    "App 不存在",
				HTTPStatus:     404,
				Category:       "billing",
				Retryable:      false,
				InternalErrors: []string{"ErrBillingAppNotFound"},
			},
			{
				ErrorCode:      "APP_MISMATCH",
				UserMessage:    "App 不属于此工作空间",
				HTTPStatus:     400,
				Category:       "billing",
				Retryable:      false,
				InternalErrors: []string{"ErrBillingAppMismatch"},
			},
			{
				ErrorCode:      "QUOTA_EXCEEDED",
				UserMessage:    "配额已超限",
				HTTPStatus:     403,
				Category:       "billing",
				Retryable:      false,
				InternalErrors: []string{"ConsumeUsageDenied"},
				Notes:          []string{"等待 reset_at 或升级套餐后重试。"},
			},
			{
				ErrorCode:      "BILLING_FAILED",
				UserMessage:    "配额扣减失败",
				HTTPStatus:     500,
				Category:       "billing",
				Retryable:      true,
				InternalErrors: []string{"BillingServiceError"},
			},
			{
				ErrorCode:      "OVERLOADED",
				UserMessage:    "系统繁忙，请稍后重试",
				HTTPStatus:     503,
				Category:       "capacity",
				Retryable:      true,
				InternalErrors: []string{"ErrExecutionOverloaded"},
			},
			{
				ErrorCode:      "WORKFLOW_NOT_FOUND",
				UserMessage:    "工作流不存在",
				HTTPStatus:     404,
				Category:       "execution",
				Retryable:      false,
				InternalErrors: []string{"ErrWorkflowNotFound"},
			},
			{
				ErrorCode:      "EXECUTE_FAILED",
				UserMessage:    "执行失败",
				HTTPStatus:     500,
				Category:       "execution",
				Retryable:      true,
				InternalErrors: []string{"ExecutionServiceError"},
			},
			{
				ErrorCode:      "RUNTIME_FAILED",
				UserMessage:    "运行时服务异常",
				HTTPStatus:     500,
				Category:       "system",
				Retryable:      true,
				InternalErrors: []string{"RuntimeServiceError"},
			},
		},
		Notes: []string{
			"error_code/error_message 与 code/message 同步输出，便于前端统一展示。",
			"Retryable=true 仍需满足幂等或由前端确认重试。",
		},
	}
}
