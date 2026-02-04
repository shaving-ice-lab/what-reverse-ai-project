package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/agentflow/server/internal/config"
	"github.com/agentflow/server/internal/pkg/security"
)

// AuditComplianceRule 审计合规规则
type AuditComplianceRule struct {
	Key         string   `json:"key"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Enforced    bool     `json:"enforced"`
	ConfigKeys  []string `json:"config_keys,omitempty"`
	Source      string   `json:"source,omitempty"`
	Notes       []string `json:"notes,omitempty"`
}

// AuditComplianceSection 审计合规策略分区
type AuditComplianceSection struct {
	Key   string                `json:"key"`
	Title string                `json:"title"`
	Rules []AuditComplianceRule `json:"rules"`
	Notes []string              `json:"notes,omitempty"`
}

// AuditCompliancePolicy 审计合规策略
type AuditCompliancePolicy struct {
	Key      string                   `json:"key"`
	Title    string                   `json:"title"`
	Sections []AuditComplianceSection `json:"sections"`
	Notes    []string                 `json:"notes,omitempty"`
}

// PlanAuditCompliancePolicyService 审计合规策略规划服务接口
type PlanAuditCompliancePolicyService interface {
	GetPolicy(ctx context.Context) (*AuditCompliancePolicy, error)
}

type planAuditCompliancePolicyService struct {
	policy AuditCompliancePolicy
}

// ErrAuditCompliancePolicyNotFound 审计合规策略不存在
var ErrAuditCompliancePolicyNotFound = errors.New("audit compliance policy not found")

// NewPlanAuditCompliancePolicyService 创建审计合规策略规划服务
func NewPlanAuditCompliancePolicyService(securityCfg config.SecurityConfig, retentionCfg config.RetentionConfig) PlanAuditCompliancePolicyService {
	return &planAuditCompliancePolicyService{
		policy: defaultAuditCompliancePolicy(securityCfg, retentionCfg),
	}
}

func (s *planAuditCompliancePolicyService) GetPolicy(ctx context.Context) (*AuditCompliancePolicy, error) {
	if s == nil || s.policy.Key == "" {
		return nil, ErrAuditCompliancePolicyNotFound
	}
	output := s.policy
	return &output, nil
}

func defaultAuditCompliancePolicy(securityCfg config.SecurityConfig, retentionCfg config.RetentionConfig) AuditCompliancePolicy {
	requiredCount := 0
	for _, action := range security.AuditActionRegistry {
		if action.Required {
			requiredCount++
		}
	}
	totalCount := len(security.AuditActionRegistry)

	retentionInterval := retentionCfg.CleanupInterval
	if retentionInterval <= 0 {
		retentionInterval = 24 * time.Hour
	}
	retentionEnabled := retentionCfg.Enabled && securityCfg.AuditLogRetentionDays > 0

	sections := []AuditComplianceSection{
		{
			Key:   "logging",
			Title: "审计记录与覆盖",
			Rules: []AuditComplianceRule{
				{
					Key:         "audit_logging_enabled",
					Title:       "审计日志启用",
					Description: "关键操作写入审计日志表，支持按 workspace 查询。",
					Enforced:    securityCfg.AuditLoggingEnabled,
					ConfigKeys:  []string{"security.audit_logging_enabled"},
					Source:      "apps/server/internal/service/audit_log_service.go",
				},
				{
					Key:         "audit_action_catalog",
					Title:       "审计动作目录",
					Description: fmt.Sprintf("已定义 %d 个审计动作，其中 %d 个为必审。", totalCount, requiredCount),
					Enforced:    totalCount > 0,
					Source:      "apps/server/internal/pkg/security/compliance.go",
				},
				{
					Key:         "audit_log_schema",
					Title:       "审计字段可追溯",
					Description: "审计日志包含 request_id/trace_id 等追溯字段。",
					Enforced:    true,
					Source:      "apps/server/internal/service/plan_log_schema_service.go",
				},
			},
		},
		{
			Key:   "access_control",
			Title: "访问控制与授权",
			Rules: []AuditComplianceRule{
				{
					Key:         "audit_log_access_control",
					Title:       "审计日志访问权限",
					Description: "仅 owner 或拥有 logs_view 权限的成员可查看审计日志。",
					Enforced:    true,
					Source:      "apps/server/internal/service/audit_log_service.go",
				},
			},
		},
		{
			Key:   "retention",
			Title: "日志保留与清理",
			Rules: []AuditComplianceRule{
				{
					Key:         "audit_log_retention",
					Title:       "审计日志保留周期",
					Description: fmt.Sprintf("审计日志保留 %d 天。", securityCfg.AuditLogRetentionDays),
					Enforced:    retentionEnabled,
					ConfigKeys: []string{
						"security.audit_log_retention_days",
						"retention.enabled",
					},
					Source: "apps/server/internal/service/retention_service.go",
				},
				{
					Key:         "retention_cleanup_interval",
					Title:       "清理执行间隔",
					Description: fmt.Sprintf("清理任务默认每 %s 执行一次。", retentionInterval.String()),
					Enforced:    retentionCfg.Enabled,
					ConfigKeys:  []string{"retention.cleanup_interval"},
					Source:      "apps/server/internal/service/retention_service.go",
				},
			},
		},
		{
			Key:   "privacy",
			Title: "脱敏与隐私保护",
			Rules: []AuditComplianceRule{
				{
					Key:         "audit_log_pii_masking",
					Title:       "审计日志脱敏",
					Description: "审计日志 metadata 写入前进行 PII 脱敏。",
					Enforced:    securityCfg.PIISanitizationEnabled,
					ConfigKeys:  []string{"security.pii_sanitization_enabled"},
					Source:      "apps/server/internal/service/audit_log_service.go",
				},
			},
		},
		{
			Key:   "integrity",
			Title: "完整性与不可抵赖",
			Rules: []AuditComplianceRule{
				{
					Key:         "audit_log_integrity",
					Title:       "审计日志完整性",
					Description: "建议使用签名或哈希链增强完整性。",
					Enforced:    false,
					Notes: []string{
						"当前未实现不可篡改存证。",
					},
				},
			},
		},
	}

	return AuditCompliancePolicy{
		Key:      "audit_compliance_policy",
		Title:    "日志保留与审计合规策略",
		Sections: sections,
		Notes: []string{
			"保留策略与清理任务由 retention 服务执行。",
			"未启用项按 Enforced=false 标注。",
		},
	}
}
