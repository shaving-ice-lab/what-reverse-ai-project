package service

import (
	"context"
	"errors"
)

// RuntimeRetryRule 运行时重试规则
type RuntimeRetryRule struct {
	Key               string   `json:"key"`
	ErrorCodes        []string `json:"error_codes,omitempty"`
	HTTPStatuses      []int    `json:"http_statuses,omitempty"`
	MaxAttempts       int      `json:"max_attempts"`
	BackoffStrategy   string   `json:"backoff_strategy"`
	BaseDelaySeconds  int      `json:"base_delay_seconds"`
	MaxDelaySeconds   int      `json:"max_delay_seconds"`
	Jitter            bool     `json:"jitter"`
	RespectRetryAfter bool     `json:"respect_retry_after"`
	Notes             []string `json:"notes,omitempty"`
}

// RuntimeRetryPolicyTable 运行时重试策略表
type RuntimeRetryPolicyTable struct {
	Key   string             `json:"key"`
	Title string             `json:"title"`
	Rules []RuntimeRetryRule `json:"rules"`
	Notes []string           `json:"notes,omitempty"`
}

// PlanRuntimeRetryPolicyService 运行时重试策略规划服务接口
type PlanRuntimeRetryPolicyService interface {
	GetPolicy(ctx context.Context) (*RuntimeRetryPolicyTable, error)
}

type planRuntimeRetryPolicyService struct {
	policy RuntimeRetryPolicyTable
}

// ErrRuntimeRetryPolicyNotFound 运行时重试策略不存在
var ErrRuntimeRetryPolicyNotFound = errors.New("runtime retry policy not found")

// NewPlanRuntimeRetryPolicyService 创建运行时重试策略规划服务
func NewPlanRuntimeRetryPolicyService() PlanRuntimeRetryPolicyService {
	return &planRuntimeRetryPolicyService{
		policy: defaultRuntimeRetryPolicy(),
	}
}

func (s *planRuntimeRetryPolicyService) GetPolicy(ctx context.Context) (*RuntimeRetryPolicyTable, error) {
	if s == nil || s.policy.Key == "" {
		return nil, ErrRuntimeRetryPolicyNotFound
	}
	output := s.policy
	return &output, nil
}

func defaultRuntimeRetryPolicy() RuntimeRetryPolicyTable {
	return RuntimeRetryPolicyTable{
		Key:   "runtime_retry_policy",
		Title: "运行时重试策略",
		Rules: []RuntimeRetryRule{
			{
				Key:               "rate_limited",
				ErrorCodes:        []string{"RATE_LIMITED"},
				HTTPStatuses:      []int{429},
				MaxAttempts:       3,
				BackoffStrategy:   "exponential",
				BaseDelaySeconds:  5,
				MaxDelaySeconds:   60,
				Jitter:            true,
				RespectRetryAfter: true,
				Notes: []string{
					"优先使用 retry_after_seconds 或 Retry-After。",
				},
			},
			{
				Key:               "overloaded",
				ErrorCodes:        []string{"OVERLOADED"},
				HTTPStatuses:      []int{503},
				MaxAttempts:       3,
				BackoffStrategy:   "exponential",
				BaseDelaySeconds:  2,
				MaxDelaySeconds:   30,
				Jitter:            true,
				RespectRetryAfter: false,
			},
			{
				Key:               "internal_error",
				ErrorCodes:        []string{"RUNTIME_FAILED", "EXECUTE_FAILED", "BILLING_FAILED"},
				HTTPStatuses:      []int{500},
				MaxAttempts:       2,
				BackoffStrategy:   "exponential",
				BaseDelaySeconds:  5,
				MaxDelaySeconds:   20,
				Jitter:            true,
				RespectRetryAfter: false,
				Notes: []string{
					"仅在读取类请求或具备幂等保障时自动重试。",
				},
			},
			{
				Key:               "quota_exceeded",
				ErrorCodes:        []string{"QUOTA_EXCEEDED"},
				HTTPStatuses:      []int{403},
				MaxAttempts:       0,
				BackoffStrategy:   "none",
				BaseDelaySeconds:  0,
				MaxDelaySeconds:   0,
				Jitter:            false,
				RespectRetryAfter: false,
				Notes: []string{
					"等待 reset_at 或升级套餐后重试。",
				},
			},
			{
				Key:               "validation_error",
				ErrorCodes:        []string{"INVALID_REQUEST", "INVALID_INPUTS", "INVALID_UI_SCHEMA", "INVALID_SLUG", "INVALID_DOMAIN", "VERSION_REQUIRED", "WORKFLOW_REQUIRED"},
				HTTPStatuses:      []int{400},
				MaxAttempts:       0,
				BackoffStrategy:   "none",
				BaseDelaySeconds:  0,
				MaxDelaySeconds:   0,
				Jitter:            false,
				RespectRetryAfter: false,
			},
			{
				Key:               "auth_access_error",
				ErrorCodes:        []string{"INVALID_TOKEN", "UNAUTHORIZED", "FORBIDDEN", "IP_BLOCKED", "SESSION_BLOCKED"},
				HTTPStatuses:      []int{401, 403},
				MaxAttempts:       0,
				BackoffStrategy:   "none",
				BaseDelaySeconds:  0,
				MaxDelaySeconds:   0,
				Jitter:            false,
				RespectRetryAfter: false,
			},
		},
		Notes: []string{
			"默认不自动重试具有副作用的写请求，除非具备幂等键。",
			"前端可根据 error_code 与 retry_after_seconds 做交互提示。",
		},
	}
}
