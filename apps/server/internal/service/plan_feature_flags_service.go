package service

import (
	"context"
	"errors"
)

// FeatureFlagRule Feature Flag 规则
type FeatureFlagRule struct {
	Key         string   `json:"key"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Enforced    bool     `json:"enforced"`
	ConfigKeys  []string `json:"config_keys,omitempty"`
	Source      string   `json:"source,omitempty"`
	Notes       []string `json:"notes,omitempty"`
}

// FeatureFlagSection Feature Flag 规范分区
type FeatureFlagSection struct {
	Key   string            `json:"key"`
	Title string            `json:"title"`
	Rules []FeatureFlagRule `json:"rules"`
	Notes []string          `json:"notes,omitempty"`
}

// FeatureFlagPolicy Feature Flags 与渐进发布规范
type FeatureFlagPolicy struct {
	Key      string               `json:"key"`
	Title    string               `json:"title"`
	Sections []FeatureFlagSection `json:"sections"`
	Notes    []string             `json:"notes,omitempty"`
}

// PlanFeatureFlagsService Feature Flags 规划服务接口
type PlanFeatureFlagsService interface {
	GetPolicy(ctx context.Context) (*FeatureFlagPolicy, error)
}

type planFeatureFlagsService struct {
	policy FeatureFlagPolicy
}

// ErrFeatureFlagPolicyNotFound Feature Flag 规范不存在
var ErrFeatureFlagPolicyNotFound = errors.New("feature flag policy not found")

// NewPlanFeatureFlagsService 创建 Feature Flags 规划服务
func NewPlanFeatureFlagsService() PlanFeatureFlagsService {
	return &planFeatureFlagsService{
		policy: defaultFeatureFlagPolicy(),
	}
}

func (s *planFeatureFlagsService) GetPolicy(ctx context.Context) (*FeatureFlagPolicy, error) {
	if s == nil || s.policy.Key == "" {
		return nil, ErrFeatureFlagPolicyNotFound
	}
	policy := s.policy
	return &policy, nil
}

func defaultFeatureFlagPolicy() FeatureFlagPolicy {
	return FeatureFlagPolicy{
		Key:   "feature_flags_policy",
		Title: "Feature Flags 与渐进发布",
		Sections: []FeatureFlagSection{
			{
				Key:   "management",
				Title: "Feature Flag 管理规范",
				Rules: []FeatureFlagRule{
					{
						Key:         "flag_registry",
						Title:       "Flag 清单与元数据",
						Description: "每个 Flag 必须登记 key/owner/目标/默认状态/作用域/上线窗口/到期时间，作为发布与回滚依据。",
						Enforced:    false,
						Notes: []string{
							"建议以 feature_flags.<key> 形式维护元数据，保证可追踪与可回收。",
						},
					},
					{
						Key:         "change_audit",
						Title:       "变更审计与审批",
						Description: "开关变更需记录审计事件并关联变更人/原因，高风险开关要求审批。",
						Enforced:    false,
						Source:      "apps/server/internal/pkg/security/compliance.go",
						Notes: []string{
							"审计事件名：feature_flag_changed。",
						},
					},
					{
						Key:         "kill_switch",
						Title:       "全局降级开关",
						Description: "关键模块保留全局开关作为紧急回滚入口，默认关闭新特性。",
						Enforced:    true,
						ConfigKeys: []string{
							"features.workspace_enabled",
							"features.workspace_runtime_enabled",
							"features.domain_enabled",
						},
						Source: "apps/server/internal/config/config.go",
					},
				},
				Notes: []string{
					"管理规范优先保证可回滚与可追踪。",
				},
			},
			{
				Key:   "rollout_strategy",
				Title: "灰度用户群体划分策略",
				Rules: []FeatureFlagRule{
					{
						Key:         "stable_hash_bucket",
						Title:       "稳定分桶策略",
						Description: "基于 workspace_id 或 user_id 做稳定 hash 分桶(0-99)，与 rollout_percentage 比较决定命中。",
						Enforced:    false,
						Notes: []string{
							"allowlist 优先于 denylist；未命中时回退到默认状态。",
						},
					},
					{
						Key:         "allow_deny_list",
						Title:       "白名单/黑名单优先级",
						Description: "支持对指定用户/Workspace 做强制开关，优先级：allowlist > denylist > 分桶。",
						Enforced:    false,
					},
					{
						Key:         "progressive_steps",
						Title:       "渐进发布节奏",
						Description: "推荐 1% → 5% → 20% → 50% → 100% 分阶段放量，每阶段验证核心指标并保留回滚阈值。",
						Enforced:    false,
					},
				},
				Notes: []string{
					"灰度策略应与监控指标（错误率/延迟/转化）绑定。",
				},
			},
			{
				Key:   "cleanup",
				Title: "Flag 回收与清理机制",
				Rules: []FeatureFlagRule{
					{
						Key:         "sunset_fields",
						Title:       "到期与清理字段",
						Description: "每个 Flag 必须配置 sunset_at/cleanup_at，明确到期自动关闭与清理窗口。",
						Enforced:    false,
					},
					{
						Key:         "cleanup_review",
						Title:       "周期巡检与禁用",
						Description: "定期巡检过期/未使用 Flag，执行禁用、归档并记录审计。",
						Enforced:    false,
					},
					{
						Key:         "code_removal",
						Title:       "代码级回收",
						Description: "Flag 完全放量或下线后，2 周内移除相关分支代码与配置。",
						Enforced:    false,
					},
				},
				Notes: []string{
					"回收机制需与发布计划和责任人绑定。",
				},
			},
		},
		Notes: []string{
			"规范输出与 /api/v1/system/features、/api/v1/config/items 管理流程对齐。",
			"渐进发布需同步监控、告警与回滚预案。",
		},
	}
}
