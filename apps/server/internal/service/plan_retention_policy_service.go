package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/agentflow/server/internal/config"
)

// RetentionRule 数据保留规则
type RetentionRule struct {
	Key           string `json:"key"`
	Title         string `json:"title"`
	Target        string `json:"target"`
	Action        string `json:"action"`
	RetentionDays int    `json:"retention_days"`
	Enabled       bool   `json:"enabled"`
	Description   string `json:"description"`
}

// RetentionPolicy 数据保留与归档策略
type RetentionPolicy struct {
	Key             string          `json:"key"`
	Title           string          `json:"title"`
	Enabled         bool            `json:"enabled"`
	CleanupInterval string          `json:"cleanup_interval"`
	Rules           []RetentionRule `json:"rules"`
	Notes           []string        `json:"notes,omitempty"`
}

// PlanRetentionPolicyService 数据保留策略规划服务接口
type PlanRetentionPolicyService interface {
	GetPolicy(ctx context.Context) (*RetentionPolicy, error)
}

type planRetentionPolicyService struct {
	policy RetentionPolicy
}

// ErrRetentionPolicyNotFound 保留策略不存在
var ErrRetentionPolicyNotFound = errors.New("retention policy not found")

// NewPlanRetentionPolicyService 创建保留策略规划服务
func NewPlanRetentionPolicyService(retention config.RetentionConfig, security config.SecurityConfig) PlanRetentionPolicyService {
	return &planRetentionPolicyService{
		policy: defaultRetentionPolicy(retention, security),
	}
}

func (s *planRetentionPolicyService) GetPolicy(ctx context.Context) (*RetentionPolicy, error) {
	if s == nil || s.policy.Key == "" {
		return nil, ErrRetentionPolicyNotFound
	}
	policy := s.policy
	return &policy, nil
}

func defaultRetentionPolicy(retention config.RetentionConfig, security config.SecurityConfig) RetentionPolicy {
	cleanupInterval := retention.CleanupInterval
	if cleanupInterval <= 0 {
		cleanupInterval = 24 * time.Hour
	}
	rules := []RetentionRule{
		{
			Key:           "execution_logs",
			Title:         "执行日志保留",
			Target:        "runtime_events + node_logs",
			Action:        "delete",
			RetentionDays: retention.ExecutionLogRetentionDays,
			Enabled:       retention.Enabled && retention.ExecutionLogRetentionDays > 0,
			Description:   "按执行日志保留天数清理运行时事件与节点日志。",
		},
		{
			Key:           "audit_logs",
			Title:         "审计日志保留",
			Target:        "what_reverse_audit_logs",
			Action:        "delete",
			RetentionDays: security.AuditLogRetentionDays,
			Enabled:       retention.Enabled && security.AuditLogRetentionDays > 0,
			Description:   "按审计日志保留天数清理历史审计记录。",
		},
		{
			Key:           "anonymous_sessions",
			Title:         "匿名会话保留",
			Target:        "what_reverse_workspace_sessions",
			Action:        "delete",
			RetentionDays: retention.AnonymousSessionRetentionDays,
			Enabled:       retention.Enabled && retention.AnonymousSessionRetentionDays > 0,
			Description:   "清理匿名访问会话。",
		},
		{
			Key:           "workspace_cold_storage",
			Title:         "工作空间冷存归档",
			Target:        "what_reverse_workspaces",
			Action:        "move_to_cold_storage",
			RetentionDays: retention.WorkspaceDeletionGraceDays,
			Enabled:       retention.Enabled && retention.WorkspaceDeletionGraceDays > 0,
			Description:   "删除宽限期后转入冷存归档状态。",
		},
	}
	if retention.WorkspaceDeletionGraceDays > 0 && retention.WorkspaceColdStorageDays > 0 {
		rules = append(rules, RetentionRule{
			Key:           "workspace_purge",
			Title:         "工作空间冷存清理",
			Target:        "what_reverse_workspaces",
			Action:        "purge",
			RetentionDays: retention.WorkspaceDeletionGraceDays + retention.WorkspaceColdStorageDays,
			Enabled:       retention.Enabled,
			Description:   "冷存超过设定天数后进行彻底清理。",
		})
	}

	return RetentionPolicy{
		Key:             "retention_policy",
		Title:           "日志保留与归档策略",
		Enabled:         retention.Enabled,
		CleanupInterval: cleanupInterval.String(),
		Rules:           rules,
		Notes: []string{
			fmt.Sprintf("清理任务默认每 %s 执行一次。", cleanupInterval.String()),
			"策略可通过配置项调整（retention.* 与 security.audit_log_retention_days）。",
		},
	}
}
