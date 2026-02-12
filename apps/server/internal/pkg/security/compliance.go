package security

import (
	"context"
	"time"
)

// AuditActionCategory 审计动作类别
type AuditActionCategory string

const (
	// AuditCategoryAccess 访问审计
	AuditCategoryAccess AuditActionCategory = "access"
	// AuditCategoryOperation 操作审计
	AuditCategoryOperation AuditActionCategory = "operation"
	// AuditCategoryExport 导出审计
	AuditCategoryExport AuditActionCategory = "export"
	// AuditCategorySecurity 安全审计
	AuditCategorySecurity AuditActionCategory = "security"
	// AuditCategoryAdmin 管理审计
	AuditCategoryAdmin AuditActionCategory = "admin"
)

// AuditAction 审计动作定义
type AuditAction struct {
	Name        string              `json:"name"`
	Category    AuditActionCategory `json:"category"`
	Description string              `json:"description"`
	Severity    string              `json:"severity"` // low, medium, high, critical
	Required    bool                `json:"required"` // 是否必须审计
}

// AuditChecklistCategory 审计清单分类
type AuditChecklistCategory struct {
	Category AuditActionCategory `json:"category"`
	Required []AuditAction       `json:"required"`
	Optional []AuditAction       `json:"optional"`
}

// AuditChecklist 审计与合规清单
type AuditChecklist struct {
	GeneratedAt   time.Time                `json:"generated_at"`
	AuditEnabled  bool                     `json:"audit_enabled"`
	RetentionDays int                      `json:"retention_days"`
	RequiredCount int                      `json:"required_count"`
	OptionalCount int                      `json:"optional_count"`
	Categories    []AuditChecklistCategory `json:"categories"`
}

// DependencyScanStatus 依赖扫描状态
type DependencyScanStatus struct {
	Enabled    bool      `json:"enabled"`
	ScanPath   string    `json:"scan_path,omitempty"`
	Schedule   string    `json:"schedule,omitempty"`
	Checks     []string  `json:"checks,omitempty"`
	DetectedAt time.Time `json:"detected_at"`
}

// AuditActionRegistry 审计动作注册表
var AuditActionRegistry = map[string]AuditAction{
	// 访问审计
	"login": {
		Name:        "login",
		Category:    AuditCategoryAccess,
		Description: "用户登录",
		Severity:    "low",
		Required:    true,
	},
	"logout": {
		Name:        "logout",
		Category:    AuditCategoryAccess,
		Description: "用户登出",
		Severity:    "low",
		Required:    true,
	},
	"login_failed": {
		Name:        "login_failed",
		Category:    AuditCategoryAccess,
		Description: "登录失败",
		Severity:    "medium",
		Required:    true,
	},
	"token_refresh": {
		Name:        "token_refresh",
		Category:    AuditCategoryAccess,
		Description: "刷新令牌",
		Severity:    "low",
		Required:    false,
	},
	"session_created": {
		Name:        "session_created",
		Category:    AuditCategoryAccess,
		Description: "创建会话",
		Severity:    "low",
		Required:    true,
	},
	"session_terminated": {
		Name:        "session_terminated",
		Category:    AuditCategoryAccess,
		Description: "终止会话",
		Severity:    "low",
		Required:    true,
	},
	"anonymous_access": {
		Name:        "anonymous_access",
		Category:    AuditCategoryAccess,
		Description: "匿名访问",
		Severity:    "low",
		Required:    false,
	},
	"api_access": {
		Name:        "api_access",
		Category:    AuditCategoryAccess,
		Description: "API访问",
		Severity:    "low",
		Required:    false,
	},

	// 操作审计
	"workspace_created": {
		Name:        "workspace_created",
		Category:    AuditCategoryOperation,
		Description: "创建工作空间",
		Severity:    "medium",
		Required:    true,
	},
	"workspace_updated": {
		Name:        "workspace_updated",
		Category:    AuditCategoryOperation,
		Description: "更新工作空间",
		Severity:    "low",
		Required:    true,
	},
	"workspace_deleted": {
		Name:        "workspace_deleted",
		Category:    AuditCategoryOperation,
		Description: "删除工作空间",
		Severity:    "high",
		Required:    true,
	},
	"member_invited": {
		Name:        "member_invited",
		Category:    AuditCategoryOperation,
		Description: "邀请成员",
		Severity:    "medium",
		Required:    true,
	},
	"member_removed": {
		Name:        "member_removed",
		Category:    AuditCategoryOperation,
		Description: "移除成员",
		Severity:    "medium",
		Required:    true,
	},
	"member_role_changed": {
		Name:        "member_role_changed",
		Category:    AuditCategoryOperation,
		Description: "变更成员角色",
		Severity:    "high",
		Required:    true,
	},
	"workspace_published": {
		Name:        "workspace_published",
		Category:    AuditCategoryOperation,
		Description: "发布工作空间",
		Severity:    "medium",
		Required:    true,
	},
	"task_executed": {
		Name:        "task_executed",
		Category:    AuditCategoryOperation,
		Description: "执行任务",
		Severity:    "low",
		Required:    false,
	},
	"domain_bound": {
		Name:        "domain_bound",
		Category:    AuditCategoryOperation,
		Description: "绑定域名",
		Severity:    "medium",
		Required:    true,
	},
	"domain_unbound": {
		Name:        "domain_unbound",
		Category:    AuditCategoryOperation,
		Description: "解绑域名",
		Severity:    "medium",
		Required:    true,
	},

	// 导出审计
	"data_exported": {
		Name:        "data_exported",
		Category:    AuditCategoryExport,
		Description: "导出数据",
		Severity:    "high",
		Required:    true,
	},
	"logs_exported": {
		Name:        "logs_exported",
		Category:    AuditCategoryExport,
		Description: "导出日志",
		Severity:    "high",
		Required:    true,
	},
	"audit_logs_exported": {
		Name:        "audit_logs_exported",
		Category:    AuditCategoryExport,
		Description: "导出审计日志",
		Severity:    "critical",
		Required:    true,
	},
	"backup_created": {
		Name:        "backup_created",
		Category:    AuditCategoryExport,
		Description: "创建备份",
		Severity:    "high",
		Required:    true,
	},
	"backup_restored": {
		Name:        "backup_restored",
		Category:    AuditCategoryExport,
		Description: "恢复备份",
		Severity:    "critical",
		Required:    true,
	},

	// 安全审计
	"api_key_created": {
		Name:        "api_key_created",
		Category:    AuditCategorySecurity,
		Description: "创建API密钥",
		Severity:    "high",
		Required:    true,
	},
	"api_key_revoked": {
		Name:        "api_key_revoked",
		Category:    AuditCategorySecurity,
		Description: "吊销API密钥",
		Severity:    "high",
		Required:    true,
	},
	"api_key_rotated": {
		Name:        "api_key_rotated",
		Category:    AuditCategorySecurity,
		Description: "轮换API密钥",
		Severity:    "high",
		Required:    true,
	},
	"password_changed": {
		Name:        "password_changed",
		Category:    AuditCategorySecurity,
		Description: "修改密码",
		Severity:    "high",
		Required:    true,
	},
	"permission_granted": {
		Name:        "permission_granted",
		Category:    AuditCategorySecurity,
		Description: "授予权限",
		Severity:    "high",
		Required:    true,
	},
	"permission_revoked": {
		Name:        "permission_revoked",
		Category:    AuditCategorySecurity,
		Description: "撤销权限",
		Severity:    "high",
		Required:    true,
	},
	"access_policy_changed": {
		Name:        "access_policy_changed",
		Category:    AuditCategorySecurity,
		Description: "变更访问策略",
		Severity:    "high",
		Required:    true,
	},
	"security_scan_triggered": {
		Name:        "security_scan_triggered",
		Category:    AuditCategorySecurity,
		Description: "触发安全扫描",
		Severity:    "medium",
		Required:    true,
	},

	// 管理审计
	"system_config_changed": {
		Name:        "system_config_changed",
		Category:    AuditCategoryAdmin,
		Description: "变更系统配置",
		Severity:    "critical",
		Required:    true,
	},
	"feature_flag_changed": {
		Name:        "feature_flag_changed",
		Category:    AuditCategoryAdmin,
		Description: "变更功能开关",
		Severity:    "high",
		Required:    true,
	},
	"quota_changed": {
		Name:        "quota_changed",
		Category:    AuditCategoryAdmin,
		Description: "变更配额",
		Severity:    "medium",
		Required:    true,
	},
	"billing_plan_changed": {
		Name:        "billing_plan_changed",
		Category:    AuditCategoryAdmin,
		Description: "变更计费计划",
		Severity:    "high",
		Required:    true,
	},
}

// ComplianceCheckItem 合规检查项
type ComplianceCheckItem struct {
	ID          string `json:"id"`
	Category    string `json:"category"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Severity    string `json:"severity"` // low, medium, high, critical
	Status      string `json:"status"`   // passed, failed, warning, skipped
	Details     string `json:"details"`
	Suggestion  string `json:"suggestion"`
}

// ComplianceCheckResult 合规检查结果
type ComplianceCheckResult struct {
	CheckedAt     time.Time             `json:"checked_at"`
	OverallStatus string                `json:"overall_status"` // compliant, non_compliant, partial
	Score         int                   `json:"score"`          // 0-100
	Items         []ComplianceCheckItem `json:"items"`
	Summary       ComplianceSummary     `json:"summary"`
}

// ComplianceSummary 合规摘要
type ComplianceSummary struct {
	TotalChecks  int `json:"total_checks"`
	PassedChecks int `json:"passed_checks"`
	FailedChecks int `json:"failed_checks"`
	Warnings     int `json:"warnings"`
	Skipped      int `json:"skipped"`
}

// ComplianceChecker 合规检查器接口
type ComplianceChecker interface {
	Check(ctx context.Context, workspaceID string) (*ComplianceCheckResult, error)
	CheckItem(ctx context.Context, workspaceID string, itemID string) (*ComplianceCheckItem, error)
}

// DefaultComplianceChecks 默认合规检查项
var DefaultComplianceChecks = []ComplianceCheckItem{
	// 数据安全
	{
		ID:          "data_encryption",
		Category:    "data_security",
		Name:        "数据加密",
		Description: "检查敏感数据是否加密存储",
		Severity:    "critical",
	},
	{
		ID:          "key_rotation",
		Category:    "data_security",
		Name:        "密钥轮换",
		Description: "检查加密密钥是否定期轮换",
		Severity:    "high",
	},
	{
		ID:          "pii_protection",
		Category:    "data_security",
		Name:        "PII保护",
		Description: "检查个人身份信息是否得到保护",
		Severity:    "high",
	},
	{
		ID:          "data_classification",
		Category:    "data_security",
		Name:        "数据分级",
		Description: "检查数据是否按敏感度分级",
		Severity:    "medium",
	},

	// 访问控制
	{
		ID:          "rbac_enabled",
		Category:    "access_control",
		Name:        "RBAC启用",
		Description: "检查基于角色的访问控制是否启用",
		Severity:    "critical",
	},
	{
		ID:          "least_privilege",
		Category:    "access_control",
		Name:        "最小权限",
		Description: "检查是否遵循最小权限原则",
		Severity:    "high",
	},
	{
		ID:          "api_authentication",
		Category:    "access_control",
		Name:        "API认证",
		Description: "检查API是否强制认证",
		Severity:    "critical",
	},
	{
		ID:          "session_management",
		Category:    "access_control",
		Name:        "会话管理",
		Description: "检查会话管理是否安全",
		Severity:    "high",
	},

	// 审计日志
	{
		ID:          "audit_logging_enabled",
		Category:    "audit",
		Name:        "审计日志启用",
		Description: "检查审计日志是否启用",
		Severity:    "critical",
	},
	{
		ID:          "audit_coverage",
		Category:    "audit",
		Name:        "审计覆盖",
		Description: "检查关键操作是否都有审计记录",
		Severity:    "high",
	},
	{
		ID:          "audit_retention",
		Category:    "audit",
		Name:        "审计保留",
		Description: "检查审计日志保留策略",
		Severity:    "medium",
	},
	{
		ID:          "audit_integrity",
		Category:    "audit",
		Name:        "审计完整性",
		Description: "检查审计日志完整性保护",
		Severity:    "high",
	},

	// 网络安全
	{
		ID:          "tls_enabled",
		Category:    "network",
		Name:        "TLS启用",
		Description: "检查是否强制使用TLS",
		Severity:    "critical",
	},
	{
		ID:          "rate_limiting",
		Category:    "network",
		Name:        "限流",
		Description: "检查是否启用请求限流",
		Severity:    "high",
	},
	{
		ID:          "cors_policy",
		Category:    "network",
		Name:        "CORS策略",
		Description: "检查CORS策略是否正确配置",
		Severity:    "medium",
	},

	// 依赖安全
	{
		ID:          "dependency_scan",
		Category:    "dependencies",
		Name:        "依赖扫描",
		Description: "检查是否定期扫描依赖漏洞",
		Severity:    "high",
	},
	{
		ID:          "outdated_dependencies",
		Category:    "dependencies",
		Name:        "过期依赖",
		Description: "检查是否存在过期的依赖",
		Severity:    "medium",
	},

	// 备份与恢复
	{
		ID:          "backup_enabled",
		Category:    "backup",
		Name:        "备份启用",
		Description: "检查是否启用自动备份",
		Severity:    "high",
	},
	{
		ID:          "backup_encryption",
		Category:    "backup",
		Name:        "备份加密",
		Description: "检查备份是否加密",
		Severity:    "high",
	},
	{
		ID:          "recovery_tested",
		Category:    "backup",
		Name:        "恢复测试",
		Description: "检查是否定期测试恢复流程",
		Severity:    "medium",
	},
}

// GetAuditAction 获取审计动作定义
func GetAuditAction(name string) (AuditAction, bool) {
	action, ok := AuditActionRegistry[name]
	return action, ok
}

// IsAuditRequired 检查动作是否需要审计
func IsAuditRequired(actionName string) bool {
	if action, ok := AuditActionRegistry[actionName]; ok {
		return action.Required
	}
	return false
}

// GetComplianceChecks 获取合规检查项列表
func GetComplianceChecks() []ComplianceCheckItem {
	return DefaultComplianceChecks
}

// GetComplianceChecksByCategory 按类别获取合规检查项
func GetComplianceChecksByCategory(category string) []ComplianceCheckItem {
	var result []ComplianceCheckItem
	for _, check := range DefaultComplianceChecks {
		if check.Category == category {
			result = append(result, check)
		}
	}
	return result
}

// CalculateComplianceScore 计算合规得分
func CalculateComplianceScore(items []ComplianceCheckItem) int {
	if len(items) == 0 {
		return 100
	}

	totalWeight := 0
	earnedWeight := 0

	severityWeights := map[string]int{
		"critical": 4,
		"high":     3,
		"medium":   2,
		"low":      1,
	}

	for _, item := range items {
		weight := severityWeights[item.Severity]
		if weight == 0 {
			weight = 1
		}
		totalWeight += weight

		switch item.Status {
		case "passed":
			earnedWeight += weight
		case "warning":
			earnedWeight += weight / 2
		}
	}

	if totalWeight == 0 {
		return 100
	}

	return (earnedWeight * 100) / totalWeight
}

// GetOverallStatus 获取整体合规状态
func GetOverallStatus(score int) string {
	switch {
	case score >= 90:
		return "compliant"
	case score >= 70:
		return "partial"
	default:
		return "non_compliant"
	}
}
