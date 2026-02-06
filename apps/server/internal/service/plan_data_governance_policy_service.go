package service

import (
	"context"
	"errors"
	"fmt"
	"sort"
	"time"

	"github.com/agentflow/server/internal/config"
	"github.com/agentflow/server/internal/pkg/security"
)

// DataGovernancePolicy 数据治理与隐私策略
type DataGovernancePolicy struct {
	Key                  string                   `json:"key"`
	Title                string                   `json:"title"`
	ClassificationMatrix DataClassificationMatrix `json:"classification_matrix"`
	MinimizationPolicy   DataMinimizationPolicy   `json:"minimization_policy"`
	ExportDeletionSLA    DataExportDeletionSLA    `json:"export_deletion_sla"`
	AnonymizationPolicy  LogAnonymizationPolicy   `json:"anonymization_policy"`
	Notes                []string                 `json:"notes,omitempty"`
}

// DataClassificationMatrix 数据分类与访问权限矩阵
type DataClassificationMatrix struct {
	Key   string                        `json:"key"`
	Title string                        `json:"title"`
	Rows  []DataClassificationMatrixRow `json:"rows"`
	Notes []string                      `json:"notes,omitempty"`
}

// DataClassificationMatrixRow 矩阵行
type DataClassificationMatrixRow struct {
	Category      string             `json:"category"`
	Level         string             `json:"level"`
	RegistryLevel string             `json:"registry_level,omitempty"`
	Description   string             `json:"description"`
	Fields        []string           `json:"fields"`
	AccessPolicy  AccessPolicyMatrix `json:"access_policy"`
}

// AccessPolicyMatrix 访问权限策略
type AccessPolicyMatrix struct {
	MinRole         string   `json:"min_role"`
	RequiredPerms   []string `json:"required_perms,omitempty"`
	AllowAnonymous  bool     `json:"allow_anonymous"`
	AuditRequired   bool     `json:"audit_required"`
	EncryptRequired bool     `json:"encrypt_required"`
	MaskOnExport    bool     `json:"mask_on_export"`
}

// DataMinimizationPolicy 数据最小化与用途限制策略
type DataMinimizationPolicy struct {
	Key   string                 `json:"key"`
	Title string                 `json:"title"`
	Rules []DataMinimizationRule `json:"rules"`
	Notes []string               `json:"notes,omitempty"`
}

// DataMinimizationRule 最小化规则
type DataMinimizationRule struct {
	Key         string   `json:"key"`
	Title       string   `json:"title"`
	Purpose     string   `json:"purpose"`
	Scope       string   `json:"scope"`
	Description string   `json:"description"`
	Enforced    bool     `json:"enforced"`
	Source      string   `json:"source,omitempty"`
	ConfigKeys  []string `json:"config_keys,omitempty"`
	Notes       []string `json:"notes,omitempty"`
}

// SLATarget SLA 目标
type SLATarget struct {
	Key         string   `json:"key"`
	Title       string   `json:"title"`
	Target      string   `json:"target"`
	Measurement string   `json:"measurement"`
	Enabled     bool     `json:"enabled"`
	Source      string   `json:"source,omitempty"`
	ConfigKeys  []string `json:"config_keys,omitempty"`
	Notes       []string `json:"notes,omitempty"`
}

// DataExportDeletionSLA 数据导出与删除 SLA
type DataExportDeletionSLA struct {
	Key       string      `json:"key"`
	Title     string      `json:"title"`
	Exports   []SLATarget `json:"exports"`
	Deletions []SLATarget `json:"deletions"`
	Notes     []string    `json:"notes,omitempty"`
}

// LogAnonymizationPolicy 日志与指标匿名化策略
type LogAnonymizationPolicy struct {
	Key   string              `json:"key"`
	Title string              `json:"title"`
	Rules []AnonymizationRule `json:"rules"`
	Notes []string            `json:"notes,omitempty"`
}

// AnonymizationRule 匿名化规则
type AnonymizationRule struct {
	Key        string   `json:"key"`
	Title      string   `json:"title"`
	Scope      string   `json:"scope"`
	Method     string   `json:"method"`
	Enforced   bool     `json:"enforced"`
	Source     string   `json:"source,omitempty"`
	ConfigKeys []string `json:"config_keys,omitempty"`
	Notes      []string `json:"notes,omitempty"`
}

// PlanDataGovernancePolicyService 数据治理规划服务接口
type PlanDataGovernancePolicyService interface {
	GetPolicy(ctx context.Context) (*DataGovernancePolicy, error)
}

type planDataGovernancePolicyService struct {
	policy DataGovernancePolicy
}

// ErrDataGovernancePolicyNotFound 数据治理策略不存在
var ErrDataGovernancePolicyNotFound = errors.New("data governance policy not found")

// NewPlanDataGovernancePolicyService 创建数据治理策略规划服务
func NewPlanDataGovernancePolicyService(retention config.RetentionConfig, securityCfg config.SecurityConfig, archive config.ArchiveConfig) PlanDataGovernancePolicyService {
	return &planDataGovernancePolicyService{
		policy: defaultDataGovernancePolicy(retention, securityCfg, archive),
	}
}

func (s *planDataGovernancePolicyService) GetPolicy(ctx context.Context) (*DataGovernancePolicy, error) {
	if s == nil || s.policy.Key == "" {
		return nil, ErrDataGovernancePolicyNotFound
	}
	policy := s.policy
	return &policy, nil
}

func defaultDataGovernancePolicy(retention config.RetentionConfig, securityCfg config.SecurityConfig, archive config.ArchiveConfig) DataGovernancePolicy {
	cleanupInterval := retention.CleanupInterval
	if cleanupInterval <= 0 {
		cleanupInterval = 24 * time.Hour
	}
	workerInterval := archive.WorkerInterval
	if workerInterval <= 0 {
		workerInterval = 30 * time.Second
	}

	classificationMatrix := buildDataClassificationMatrix()
	minimization := defaultDataMinimizationPolicy(retention, securityCfg, archive, cleanupInterval, workerInterval)
	exportDeletionSLA := defaultDataExportDeletionSLA(retention, archive, cleanupInterval, workerInterval)
	anonymization := defaultAnonymizationPolicy(securityCfg)

	return DataGovernancePolicy{
		Key:                  "data_governance_policy",
		Title:                "数据治理与隐私策略",
		ClassificationMatrix: classificationMatrix,
		MinimizationPolicy:   minimization,
		ExportDeletionSLA:    exportDeletionSLA,
		AnonymizationPolicy:  anonymization,
		Notes: []string{
			"策略输出与现有实现保持一致，未启用项按 Enforced/Enabled=false 标注。",
			"导出与删除 SLA 以配置与后台任务周期为准。",
		},
	}
}

func buildDataClassificationMatrix() DataClassificationMatrix {
	classifications := make([]security.DataClassification, 0, len(security.DataClassificationRegistry))
	for _, classification := range security.DataClassificationRegistry {
		classifications = append(classifications, classification)
	}
	sort.Slice(classifications, func(i, j int) bool {
		if classifications[i].Level != classifications[j].Level {
			return classifications[i].Level < classifications[j].Level
		}
		return string(classifications[i].Category) < string(classifications[j].Category)
	})

	rows := make([]DataClassificationMatrixRow, 0, len(classifications))
	for _, classification := range classifications {
		policy := security.GetAccessPolicy(classification.Level)
		levelLabel := classificationLevelLabel(classification.Level)
		registryLevel := classification.Level.String()
		row := DataClassificationMatrixRow{
			Category:      string(classification.Category),
			Level:         levelLabel,
			RegistryLevel: "",
			Description:   classification.Description,
			Fields:        classification.Fields,
			AccessPolicy: AccessPolicyMatrix{
				MinRole:         policy.MinRole,
				RequiredPerms:   policy.RequiredPerms,
				AllowAnonymous:  policy.AllowAnonymous,
				AuditRequired:   policy.AuditRequired,
				EncryptRequired: policy.EncryptRequired,
				MaskOnExport:    policy.MaskOnExport,
			},
		}
		if registryLevel != levelLabel {
			row.RegistryLevel = registryLevel
		}
		rows = append(rows, row)
	}

	return DataClassificationMatrix{
		Key:   "data_classification_matrix",
		Title: "数据分类与访问权限矩阵",
		Rows:  rows,
		Notes: []string{
			"分类来自 security.DataClassificationRegistry，访问策略来自 DefaultAccessPolicies。",
			"registry_level 用于标注内部级别映射（如 secret -> restricted）。",
		},
	}
}

func defaultDataMinimizationPolicy(retention config.RetentionConfig, securityCfg config.SecurityConfig, archive config.ArchiveConfig, cleanupInterval, workerInterval time.Duration) DataMinimizationPolicy {
	piiEnabled := securityCfg.PIISanitizationEnabled
	rules := []DataMinimizationRule{
		{
			Key:         "export_scope_limited",
			Title:       "导出范围受控",
			Purpose:     "用户数据可移植性",
			Scope:       "workspace_export",
			Description: "导出包仅包含 workspace/members/workflows，不包含运行日志与审计日志。",
			Enforced:    true,
			Source:      "apps/server/internal/service/workspace_service.go & workspace_export_service.go",
			Notes: []string{
				"导出内容以 WorkspaceDataExport 结构为准。",
			},
		},
		{
			Key:         "export_access_control",
			Title:       "导出权限限制",
			Purpose:     "最小访问面",
			Scope:       "workspace_export",
			Description: "仅 workspace owner/admin 可发起导出与下载。",
			Enforced:    true,
			Source:      "apps/server/internal/service/workspace_export_service.go",
		},
		{
			Key:         "runtime_event_purpose_limit",
			Title:       "运行事件用途限制",
			Purpose:     "运行观测与故障排查",
			Scope:       "runtime_events",
			Description: "事件记录仅用于观测与排障，metadata 与文本字段在写入前脱敏。",
			Enforced:    piiEnabled,
			Source:      "apps/server/internal/service/event_recorder.go",
			ConfigKeys:  []string{"security.pii_sanitization_enabled"},
		},
		{
			Key:         "execution_log_purpose_limit",
			Title:       "执行日志用途限制",
			Purpose:     "执行排查",
			Scope:       "execution_logs",
			Description: "执行输入/输出与错误信息写入前进行脱敏处理。",
			Enforced:    piiEnabled,
			Source:      "apps/server/internal/service/execution_service.go",
			ConfigKeys:  []string{"security.pii_sanitization_enabled"},
		},
		{
			Key:         "audit_log_purpose_limit",
			Title:       "审计日志用途限制",
			Purpose:     "安全审计",
			Scope:       "audit_logs",
			Description: "审计日志 metadata 脱敏后存储，仅用于合规审计与追溯。",
			Enforced:    piiEnabled,
			Source:      "apps/server/internal/service/audit_log_service.go",
			ConfigKeys:  []string{"security.pii_sanitization_enabled"},
		},
		{
			Key:         "metrics_aggregate_only",
			Title:       "指标聚合最小化",
			Purpose:     "用量统计与运营分析",
			Scope:       "metrics",
			Description: "指标基于聚合统计，不返回原始 payload。",
			Enforced:    true,
			Source:      "apps/server/internal/service/metrics_service.go",
		},
		{
			Key:         "retention_cleanup",
			Title:       "保留与清理约束",
			Purpose:     "数据最小化",
			Scope:       "retention",
			Description: "按 retention 与 audit 配置定期清理运行日志、审计日志与匿名会话。",
			Enforced:    retention.Enabled,
			Source:      "apps/server/internal/service/retention_service.go",
			ConfigKeys: []string{
				"retention.execution_log_retention_days",
				"retention.anonymous_session_retention_days",
				"retention.cleanup_interval",
				"security.audit_log_retention_days",
			},
			Notes: []string{
				fmt.Sprintf("清理任务默认间隔 %s。", cleanupInterval.String()),
			},
		},
		{
			Key:         "export_retention_window",
			Title:       "导出下载有效期",
			Purpose:     "控制导出暴露窗口",
			Scope:       "workspace_export",
			Description: "导出文件在有效期内可下载，过期后拒绝下载。",
			Enforced:    archive.Enabled && archive.ExportRetentionDays > 0,
			Source:      "apps/server/internal/service/workspace_export_service.go",
			ConfigKeys:  []string{"archive.export_retention_days"},
		},
	}

	return DataMinimizationPolicy{
		Key:   "data_minimization_policy",
		Title: "数据最小化与用途限制",
		Rules: rules,
		Notes: []string{
			fmt.Sprintf("导出任务处理间隔默认 %s。", workerInterval.String()),
		},
	}
}

func defaultDataExportDeletionSLA(retention config.RetentionConfig, archive config.ArchiveConfig, cleanupInterval, workerInterval time.Duration) DataExportDeletionSLA {
	exportRetentionDays := archive.ExportRetentionDays
	graceDays := retention.WorkspaceDeletionGraceDays
	coldDays := retention.WorkspaceColdStorageDays
	purgeDays := graceDays + coldDays

	exports := []SLATarget{
		{
			Key:         "export_request_ack",
			Title:       "导出请求受理",
			Target:      "导出任务即时创建",
			Measurement: "POST /api/v1/workspaces/:id/exports",
			Enabled:     archive.Enabled,
			Source:      "apps/server/internal/service/workspace_export_service.go",
		},
		{
			Key:         "export_job_pickup",
			Title:       "导出任务处理周期",
			Target:      fmt.Sprintf("≤ %s/批次", workerInterval.String()),
			Measurement: "导出 worker 调度周期",
			Enabled:     archive.Enabled,
			Source:      "apps/server/internal/service/workspace_export_service.go",
			ConfigKeys:  []string{"archive.worker_interval", "archive.max_jobs_per_tick"},
		},
		{
			Key:         "export_download_window",
			Title:       "导出下载有效期",
			Target:      fmt.Sprintf("%d 天", exportRetentionDays),
			Measurement: "expires_at",
			Enabled:     archive.Enabled && exportRetentionDays > 0,
			Source:      "apps/server/internal/service/workspace_export_service.go",
			ConfigKeys:  []string{"archive.export_retention_days"},
		},
	}

	deletions := []SLATarget{
		{
			Key:         "workspace_soft_delete",
			Title:       "工作空间软删除",
			Target:      "请求后立即标记删除",
			Measurement: "DELETE /api/v1/workspaces/:id",
			Enabled:     true,
			Source:      "apps/server/internal/service/workspace_service.go",
		},
		{
			Key:         "workspace_restore_window",
			Title:       "恢复窗口",
			Target:      fmt.Sprintf("%d 天", graceDays),
			Measurement: "restore_until",
			Enabled:     retention.Enabled && graceDays > 0,
			Source:      "apps/server/internal/service/workspace_service.go",
			ConfigKeys:  []string{"retention.workspace_deletion_grace_days"},
		},
		{
			Key:         "workspace_purge_window",
			Title:       "彻底删除窗口",
			Target:      fmt.Sprintf("%d 天", purgeDays),
			Measurement: "purge_after + cleanup",
			Enabled:     retention.Enabled && graceDays > 0 && coldDays > 0,
			Source:      "apps/server/internal/service/retention_service.go",
			ConfigKeys: []string{
				"retention.workspace_deletion_grace_days",
				"retention.workspace_cold_storage_days",
			},
		},
		{
			Key:         "retention_cleanup_interval",
			Title:       "删除清理执行间隔",
			Target:      cleanupInterval.String(),
			Measurement: "retention cleanup interval",
			Enabled:     retention.Enabled,
			Source:      "apps/server/internal/service/retention_service.go",
			ConfigKeys:  []string{"retention.cleanup_interval"},
		},
	}

	return DataExportDeletionSLA{
		Key:       "data_export_deletion_sla",
		Title:     "用户数据导出与删除 SLA",
		Exports:   exports,
		Deletions: deletions,
		Notes: []string{
			"导出处理时长与数据量相关，SLA 以调度周期为基准。",
			"删除与清理由保留服务定时执行。",
		},
	}
}

func defaultAnonymizationPolicy(securityCfg config.SecurityConfig) LogAnonymizationPolicy {
	piiEnabled := securityCfg.PIISanitizationEnabled
	rules := []AnonymizationRule{
		{
			Key:        "http_access_log",
			Title:      "HTTP 访问日志脱敏",
			Scope:      "access_log",
			Method:     "remote_ip/user_agent/query 参数脱敏",
			Enforced:   piiEnabled,
			Source:     "apps/server/internal/api/middleware/logger.go",
			ConfigKeys: []string{"security.pii_sanitization_enabled"},
		},
		{
			Key:        "runtime_event_log",
			Title:      "运行事件日志脱敏",
			Scope:      "runtime_events",
			Method:     "message/error/stack/metadata 脱敏",
			Enforced:   piiEnabled,
			Source:     "apps/server/internal/service/event_recorder.go",
			ConfigKeys: []string{"security.pii_sanitization_enabled"},
		},
		{
			Key:        "execution_log",
			Title:      "执行日志脱敏",
			Scope:      "execution_logs",
			Method:     "inputs/outputs/错误信息脱敏",
			Enforced:   piiEnabled,
			Source:     "apps/server/internal/service/execution_service.go",
			ConfigKeys: []string{"security.pii_sanitization_enabled"},
		},
		{
			Key:        "audit_log",
			Title:      "审计日志脱敏",
			Scope:      "audit_logs",
			Method:     "metadata 脱敏",
			Enforced:   piiEnabled,
			Source:     "apps/server/internal/service/audit_log_service.go",
			ConfigKeys: []string{"security.pii_sanitization_enabled"},
		},
		{
			Key:      "masking_rules_catalog",
			Title:    "脱敏规则目录",
			Scope:    "masking_rules",
			Method:   "字段名+规则生成展示脱敏样例",
			Enforced: true,
			Source:   "apps/server/internal/pkg/security/masking_rules.go",
			Notes: []string{
				"可通过 /api/v1/security/masking-rules 查看。",
			},
		},
	}

	return LogAnonymizationPolicy{
		Key:   "log_anonymization_policy",
		Title: "日志与指标匿名化策略",
		Rules: rules,
		Notes: []string{
			fmt.Sprintf("PII 脱敏开关：security.pii_sanitization_enabled=%t。", piiEnabled),
		},
	}
}

func classificationLevelLabel(level security.DataClassificationLevel) string {
	if level == security.DataLevelSecret {
		return "restricted"
	}
	return level.String()
}
