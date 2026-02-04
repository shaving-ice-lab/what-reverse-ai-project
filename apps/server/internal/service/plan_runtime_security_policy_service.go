package service

import (
	"context"
	"errors"
)

// RuntimeSecurityRule 运行时安全规则
type RuntimeSecurityRule struct {
	Key         string   `json:"key"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Enforced    bool     `json:"enforced"`
	ConfigKeys  []string `json:"config_keys,omitempty"`
	Source      string   `json:"source,omitempty"`
	Notes       []string `json:"notes,omitempty"`
}

// RuntimeSecuritySection 运行时安全策略分区
type RuntimeSecuritySection struct {
	Key   string                `json:"key"`
	Title string                `json:"title"`
	Rules []RuntimeSecurityRule `json:"rules"`
	Notes []string              `json:"notes,omitempty"`
}

// RuntimeSecurityPolicy 运行时安全策略
type RuntimeSecurityPolicy struct {
	Key      string                   `json:"key"`
	Title    string                   `json:"title"`
	Sections []RuntimeSecuritySection `json:"sections"`
	Notes    []string                 `json:"notes,omitempty"`
}

// PlanRuntimeSecurityService 运行时安全策略规划服务接口
type PlanRuntimeSecurityService interface {
	GetPolicy(ctx context.Context) (*RuntimeSecurityPolicy, error)
}

type planRuntimeSecurityService struct {
	policy RuntimeSecurityPolicy
}

// ErrRuntimeSecurityPolicyNotFound 运行时安全策略不存在
var ErrRuntimeSecurityPolicyNotFound = errors.New("runtime security policy not found")

// NewPlanRuntimeSecurityService 创建运行时安全策略规划服务
func NewPlanRuntimeSecurityService() PlanRuntimeSecurityService {
	return &planRuntimeSecurityService{
		policy: defaultRuntimeSecurityPolicy(),
	}
}

func (s *planRuntimeSecurityService) GetPolicy(ctx context.Context) (*RuntimeSecurityPolicy, error) {
	if s == nil || s.policy.Key == "" {
		return nil, ErrRuntimeSecurityPolicyNotFound
	}
	output := s.policy
	return &output, nil
}

func defaultRuntimeSecurityPolicy() RuntimeSecurityPolicy {
	return RuntimeSecurityPolicy{
		Key:   "runtime_security_policy",
		Title: "Runtime 安全策略细化",
		Sections: []RuntimeSecuritySection{
			{
				Key:   "sandbox",
				Title: "运行时执行沙箱策略",
				Rules: []RuntimeSecurityRule{
					{
						Key:         "code_node_timeout",
						Title:       "代码节点超时控制",
						Description: "代码节点默认 30s 超时，最大 300s（超时触发失败）。",
						Enforced:    true,
						ConfigKeys:  []string{"node.config.timeout"},
						Source:      "apps/server/internal/pkg/executor/code_executor.go",
					},
					{
						Key:         "unsafe_pattern_block",
						Title:       "危险操作阻断",
						Description: "检测 eval/require/fs/process 等危险模式并拒绝执行。",
						Enforced:    true,
						Source:      "apps/server/internal/pkg/executor/code_executor.go",
					},
					{
						Key:         "language_allowlist",
						Title:       "语言白名单",
						Description: "仅允许 javascript/js 与 expression 模式执行。",
						Enforced:    true,
						Source:      "apps/server/internal/pkg/executor/code_executor.go",
					},
				},
				Notes: []string{
					"当前为简化沙箱实现，生产环境建议引入隔离运行时（例如 goja/isolated-vm/容器）。",
				},
			},
			{
				Key:   "code_limits",
				Title: "代码节点资源限制",
				Rules: []RuntimeSecurityRule{
					{
						Key:         "timeout_limit",
						Title:       "超时限制",
						Description: "单次执行最长 300 秒，默认 30 秒。",
						Enforced:    true,
						ConfigKeys:  []string{"node.config.timeout"},
						Source:      "apps/server/internal/pkg/executor/code_executor.go",
					},
					{
						Key:         "memory_limit",
						Title:       "内存限制",
						Description: "预留扩展点，当前未启用内存上限。",
						Enforced:    false,
						Source:      "apps/server/internal/pkg/executor/code_executor.go (SafeJSRuntime)",
					},
				},
				Notes: []string{
					"可结合执行引擎或容器运行时补充 CPU/内存上限。",
				},
			},
			{
				Key:   "external_requests",
				Title: "外部请求白名单/黑名单",
				Rules: []RuntimeSecurityRule{
					{
						Key:         "runtime_blacklist_graylist",
						Title:       "运行时访问黑名单/灰名单",
						Description: "通过 rate_limit_json.blacklist/denylist/blocked_ips/blocked_ip_hashes 与 graylist 配置访问控制。",
						Enforced:    true,
						ConfigKeys: []string{
							"app_access_policy.rate_limit_json.blacklist",
							"app_access_policy.rate_limit_json.graylist",
							"app_access_policy.rate_limit_json.graylist_policy",
						},
						Source: "apps/server/internal/service/runtime_service.go",
						Notes: []string{
							"支持 sha256:/hash: 前缀的 IP 哈希。",
						},
					},
					{
						Key:         "webhook_ip_whitelist",
						Title:       "Webhook 节点 IP 白名单",
						Description: "Webhook 节点支持 ipWhitelist 与 allowedMethods 校验。",
						Enforced:    true,
						ConfigKeys:  []string{"node.config.ipWhitelist", "node.config.allowedMethods"},
						Source:      "apps/server/internal/pkg/executor/webhook_executor.go",
					},
					{
						Key:         "http_outbound_allowlist",
						Title:       "HTTP 外呼域名白名单",
						Description: "建议为 HTTP 节点增加 allowlist/denylist，当前未内置强制策略。",
						Enforced:    false,
						Notes: []string{
							"可在执行引擎层新增域名/网段校验。",
						},
					},
				},
			},
			{
				Key:   "auto_degrade",
				Title: "访问速率自动降级",
				Rules: []RuntimeSecurityRule{
					{
						Key:         "rate_limit_rules",
						Title:       "固定窗口限流",
						Description: "支持 per_ip / per_session / per_app 限流，超限返回 RATE_LIMITED。",
						Enforced:    true,
						ConfigKeys: []string{
							"app_access_policy.rate_limit_json.per_ip",
							"app_access_policy.rate_limit_json.per_session",
							"app_access_policy.rate_limit_json.per_app",
						},
						Source: "apps/server/internal/service/runtime_service.go",
					},
					{
						Key:         "graylist_policy",
						Title:       "灰名单降级策略",
						Description: "灰名单可收紧 max_requests 或要求验证码。",
						Enforced:    true,
						ConfigKeys:  []string{"app_access_policy.rate_limit_json.graylist_policy"},
						Source:      "apps/server/internal/service/runtime_service.go",
					},
					{
						Key:         "anomaly_detection",
						Title:       "异常检测与验证码升级",
						Description: "高频/失败率/突刺检测触发 risk_signals，并要求验证码。",
						Enforced:    true,
						ConfigKeys: []string{
							"app_access_policy.rate_limit_json.anomaly.high_freq",
							"app_access_policy.rate_limit_json.anomaly.failure_rate",
							"app_access_policy.rate_limit_json.anomaly.spike",
						},
						Source: "apps/server/internal/service/runtime_service.go",
					},
				},
				Notes: []string{
					"触发异常检测会产生 runtime_risk_detected/runtime_captcha_required 事件。",
				},
			},
		},
		Notes: []string{
			"策略输出与现有实现保持一致，未覆盖项按“未启用/待补充”标注。",
		},
	}
}
