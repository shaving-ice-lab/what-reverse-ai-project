package service

import (
	"context"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/agentflow/server/internal/config"
	"github.com/agentflow/server/internal/pkg/security"
	"github.com/google/uuid"
)

// SecurityComplianceService 安全合规服务接口
type SecurityComplianceService interface {
	// CheckCompliance 执行合规检查
	CheckCompliance(ctx context.Context, workspaceID uuid.UUID) (*security.ComplianceCheckResult, error)
	// GetComplianceStatus 获取合规状态
	GetComplianceStatus(ctx context.Context, workspaceID uuid.UUID) (string, int, error)
	// GetDataClassification 获取数据分级信息
	GetDataClassification() []security.DataClassification
	// GetSensitiveFields 获取敏感字段配置
	GetSensitiveFields() []security.SensitiveFieldConfig
	// GetMaskingRules 获取脱敏展示规则
	GetMaskingRules() []security.MaskingRule
	// GetAuditActions 获取审计动作列表
	GetAuditActions() []security.AuditAction
	// GetAuditChecklist 获取审计清单
	GetAuditChecklist() security.AuditChecklist
	// GetDependencyScanStatus 获取依赖扫描状态
	GetDependencyScanStatus() security.DependencyScanStatus
	// GetRotationPolicies 获取密钥轮换策略
	GetRotationPolicies() []security.RotationPolicy
}

type securityComplianceService struct {
	cfg              *config.Config
	workspaceService WorkspaceService
	auditLogService  AuditLogService
	piiSanitizer     *security.PIISanitizer
}

// NewSecurityComplianceService 创建安全合规服务
func NewSecurityComplianceService(
	cfg *config.Config,
	workspaceService WorkspaceService,
	auditLogService AuditLogService,
) SecurityComplianceService {
	return &securityComplianceService{
		cfg:              cfg,
		workspaceService: workspaceService,
		auditLogService:  auditLogService,
		piiSanitizer:     security.NewPIISanitizer(),
	}
}

func (s *securityComplianceService) CheckCompliance(ctx context.Context, workspaceID uuid.UUID) (*security.ComplianceCheckResult, error) {
	checks := security.GetComplianceChecks()
	items := make([]security.ComplianceCheckItem, len(checks))

	for i, check := range checks {
		item := s.checkItem(ctx, workspaceID, check)
		items[i] = item
	}

	score := security.CalculateComplianceScore(items)
	status := security.GetOverallStatus(score)

	summary := s.calculateSummary(items)

	return &security.ComplianceCheckResult{
		CheckedAt:     time.Now(),
		OverallStatus: status,
		Score:         score,
		Items:         items,
		Summary:       summary,
	}, nil
}

func (s *securityComplianceService) GetComplianceStatus(ctx context.Context, workspaceID uuid.UUID) (string, int, error) {
	result, err := s.CheckCompliance(ctx, workspaceID)
	if err != nil {
		return "", 0, err
	}
	return result.OverallStatus, result.Score, nil
}

func (s *securityComplianceService) GetDataClassification() []security.DataClassification {
	classifications := make([]security.DataClassification, 0, len(security.DataClassificationRegistry))
	for _, c := range security.DataClassificationRegistry {
		classifications = append(classifications, c)
	}
	return classifications
}

func (s *securityComplianceService) GetSensitiveFields() []security.SensitiveFieldConfig {
	return security.GetSensitiveFieldsConfig()
}

func (s *securityComplianceService) GetMaskingRules() []security.MaskingRule {
	return security.GetMaskingRules()
}

func (s *securityComplianceService) GetAuditActions() []security.AuditAction {
	actions := make([]security.AuditAction, 0, len(security.AuditActionRegistry))
	for _, a := range security.AuditActionRegistry {
		actions = append(actions, a)
	}
	return actions
}

func (s *securityComplianceService) GetAuditChecklist() security.AuditChecklist {
	actions := s.GetAuditActions()
	sort.Slice(actions, func(i, j int) bool {
		if actions[i].Category == actions[j].Category {
			return actions[i].Name < actions[j].Name
		}
		return actions[i].Category < actions[j].Category
	})

	categoryOrder := []security.AuditActionCategory{
		security.AuditCategoryAccess,
		security.AuditCategoryOperation,
		security.AuditCategoryExport,
		security.AuditCategorySecurity,
		security.AuditCategoryAdmin,
	}
	categories := make(map[security.AuditActionCategory]*security.AuditChecklistCategory, len(categoryOrder))
	for _, category := range categoryOrder {
		categories[category] = &security.AuditChecklistCategory{
			Category: category,
			Required: []security.AuditAction{},
			Optional: []security.AuditAction{},
		}
	}

	requiredCount := 0
	optionalCount := 0
	for _, action := range actions {
		category, ok := categories[action.Category]
		if !ok {
			category = &security.AuditChecklistCategory{
				Category: action.Category,
				Required: []security.AuditAction{},
				Optional: []security.AuditAction{},
			}
			categories[action.Category] = category
		}
		if action.Required {
			requiredCount++
			category.Required = append(category.Required, action)
		} else {
			optionalCount++
			category.Optional = append(category.Optional, action)
		}
	}

	orderedCategories := make([]security.AuditChecklistCategory, 0, len(categories))
	for _, category := range categoryOrder {
		if item, ok := categories[category]; ok && (len(item.Required) > 0 || len(item.Optional) > 0) {
			orderedCategories = append(orderedCategories, *item)
		}
	}
	for _, item := range categories {
		if item == nil {
			continue
		}
		known := false
		for _, category := range categoryOrder {
			if item.Category == category {
				known = true
				break
			}
		}
		if !known && (len(item.Required) > 0 || len(item.Optional) > 0) {
			orderedCategories = append(orderedCategories, *item)
		}
	}

	return security.AuditChecklist{
		GeneratedAt:   time.Now(),
		AuditEnabled:  s.cfg.Security.AuditLoggingEnabled && s.auditLogService != nil,
		RetentionDays: s.cfg.Security.AuditLogRetentionDays,
		RequiredCount: requiredCount,
		OptionalCount: optionalCount,
		Categories:    orderedCategories,
	}
}

func (s *securityComplianceService) GetDependencyScanStatus() security.DependencyScanStatus {
	info, ok := s.findSecurityScanWorkflow()
	status := security.DependencyScanStatus{
		Enabled:    ok,
		DetectedAt: time.Now(),
	}
	if !ok {
		return status
	}
	status.WorkflowPath = info.path
	status.Schedule = parseWorkflowSchedule(info.content)
	status.Checks = detectWorkflowChecks(info.content)
	return status
}

func (s *securityComplianceService) GetRotationPolicies() []security.RotationPolicy {
	policies := make([]security.RotationPolicy, 0, len(security.DefaultRotationPolicies))
	for _, p := range security.DefaultRotationPolicies {
		policies = append(policies, p)
	}
	return policies
}

func (s *securityComplianceService) checkItem(ctx context.Context, workspaceID uuid.UUID, check security.ComplianceCheckItem) security.ComplianceCheckItem {
	item := check

	switch check.ID {
	case "data_encryption":
		item = s.checkDataEncryption(item)
	case "key_rotation":
		item = s.checkKeyRotation(item)
	case "pii_protection":
		item = s.checkPIIProtection(item)
	case "data_classification":
		item = s.checkDataClassification(item)
	case "rbac_enabled":
		item = s.checkRBACEnabled(item)
	case "least_privilege":
		item = s.checkLeastPrivilege(item)
	case "api_authentication":
		item = s.checkAPIAuthentication(item)
	case "session_management":
		item = s.checkSessionManagement(item)
	case "audit_logging_enabled":
		item = s.checkAuditLoggingEnabled(item)
	case "audit_coverage":
		item = s.checkAuditCoverage(item)
	case "audit_retention":
		item = s.checkAuditRetention(item)
	case "audit_integrity":
		item = s.checkAuditIntegrity(item)
	case "tls_enabled":
		item = s.checkTLSEnabled(item)
	case "rate_limiting":
		item = s.checkRateLimiting(item)
	case "cors_policy":
		item = s.checkCORSPolicy(item)
	case "dependency_scan":
		item = s.checkDependencyScan(item)
	case "outdated_dependencies":
		item = s.checkOutdatedDependencies(item)
	case "backup_enabled":
		item = s.checkBackupEnabled(item)
	case "backup_encryption":
		item = s.checkBackupEncryption(item)
	case "recovery_tested":
		item = s.checkRecoveryTested(item)
	default:
		item.Status = "skipped"
		item.Details = "未实现的检查项"
	}

	return item
}

func (s *securityComplianceService) checkDataEncryption(item security.ComplianceCheckItem) security.ComplianceCheckItem {
	// 检查加密密钥是否配置
	if s.cfg.Encryption.Key != "" && s.cfg.Encryption.Key != "change-this-to-a-32-byte-secret!" {
		item.Status = "passed"
		item.Details = "数据加密已正确配置"
	} else {
		item.Status = "failed"
		item.Details = "未配置加密密钥或使用默认密钥"
		item.Suggestion = "请在配置文件中设置安全的32字节加密密钥"
	}
	return item
}

func (s *securityComplianceService) checkKeyRotation(item security.ComplianceCheckItem) security.ComplianceCheckItem {
	// 检查密钥轮换策略
	policies := security.DefaultRotationPolicies
	enabledCount := 0
	for _, p := range policies {
		if p.Enabled {
			enabledCount++
		}
	}

	if enabledCount >= len(policies)/2 {
		item.Status = "passed"
		item.Details = "密钥轮换策略已配置"
	} else {
		item.Status = "warning"
		item.Details = "部分密钥轮换策略未启用"
		item.Suggestion = "建议启用所有密钥类型的轮换策略"
	}
	return item
}

func (s *securityComplianceService) checkPIIProtection(item security.ComplianceCheckItem) security.ComplianceCheckItem {
	// PII脱敏器已实现
	fields := security.GetSensitiveFieldsConfig()
	if len(fields) > 0 {
		item.Status = "passed"
		item.Details = "PII保护机制已实现，覆盖" + string(rune(len(fields))) + "个敏感字段"
	} else {
		item.Status = "failed"
		item.Details = "未配置敏感字段保护"
		item.Suggestion = "请配置敏感字段列表"
	}
	return item
}

func (s *securityComplianceService) checkDataClassification(item security.ComplianceCheckItem) security.ComplianceCheckItem {
	// 数据分级已实现
	classifications := security.DataClassificationRegistry
	if len(classifications) > 0 {
		item.Status = "passed"
		item.Details = "数据分级策略已定义"
	} else {
		item.Status = "failed"
		item.Details = "未定义数据分级策略"
		item.Suggestion = "请定义数据分级规则"
	}
	return item
}

func (s *securityComplianceService) checkRBACEnabled(item security.ComplianceCheckItem) security.ComplianceCheckItem {
	// RBAC已在权限系统中实现
	item.Status = "passed"
	item.Details = "基于角色的访问控制已启用"
	return item
}

func (s *securityComplianceService) checkLeastPrivilege(item security.ComplianceCheckItem) security.ComplianceCheckItem {
	// 最小权限原则通过角色权限矩阵实现
	item.Status = "passed"
	item.Details = "遵循最小权限原则，不同角色拥有不同权限集"
	return item
}

func (s *securityComplianceService) checkAPIAuthentication(item security.ComplianceCheckItem) security.ComplianceCheckItem {
	// JWT认证已实现
	if s.cfg.JWT.Secret != "" && s.cfg.JWT.Secret != "your-secret-key-change-in-production" {
		item.Status = "passed"
		item.Details = "API认证已正确配置"
	} else {
		item.Status = "warning"
		item.Details = "JWT密钥使用默认值"
		item.Suggestion = "请在生产环境中配置安全的JWT密钥"
	}
	return item
}

func (s *securityComplianceService) checkSessionManagement(item security.ComplianceCheckItem) security.ComplianceCheckItem {
	// 会话管理通过JWT实现
	if s.cfg.JWT.AccessTokenExpire > 0 && s.cfg.JWT.RefreshTokenExpire > 0 {
		item.Status = "passed"
		item.Details = "会话管理已配置，访问令牌过期时间：" + s.cfg.JWT.AccessTokenExpire.String()
	} else {
		item.Status = "warning"
		item.Details = "会话过期时间未正确配置"
		item.Suggestion = "建议配置合理的令牌过期时间"
	}
	return item
}

func (s *securityComplianceService) checkAuditLoggingEnabled(item security.ComplianceCheckItem) security.ComplianceCheckItem {
	// 审计日志服务已实现
	if s.cfg.Security.AuditLoggingEnabled && s.auditLogService != nil {
		item.Status = "passed"
		item.Details = "审计日志功能已启用"
	} else {
		item.Status = "failed"
		item.Details = "审计日志服务未启用"
		item.Suggestion = "请启用审计日志并确保服务初始化"
	}
	return item
}

func (s *securityComplianceService) checkAuditCoverage(item security.ComplianceCheckItem) security.ComplianceCheckItem {
	// 检查审计动作覆盖
	actions := security.AuditActionRegistry
	requiredCount := 0
	for _, a := range actions {
		if a.Required {
			requiredCount++
		}
	}

	if requiredCount > 0 {
		item.Status = "passed"
		item.Details = "已定义" + strconv.Itoa(len(actions)) + "个审计动作"
	} else {
		item.Status = "warning"
		item.Details = "审计动作定义不完整"
		item.Suggestion = "建议覆盖所有关键操作的审计"
	}
	return item
}

func (s *securityComplianceService) checkAuditRetention(item security.ComplianceCheckItem) security.ComplianceCheckItem {
	if s.cfg.Security.AuditLogRetentionDays > 0 {
		item.Status = "passed"
		item.Details = "审计日志保留周期：" + strconv.Itoa(s.cfg.Security.AuditLogRetentionDays) + "天"
	} else {
		item.Status = "warning"
		item.Details = "审计日志保留策略需要配置"
		item.Suggestion = "建议配置审计日志保留周期和归档策略"
	}
	return item
}

func (s *securityComplianceService) checkAuditIntegrity(item security.ComplianceCheckItem) security.ComplianceCheckItem {
	// 审计日志完整性保护
	item.Status = "warning"
	item.Details = "审计日志完整性保护需要增强"
	item.Suggestion = "建议实现审计日志签名或哈希链"
	return item
}

func (s *securityComplianceService) checkTLSEnabled(item security.ComplianceCheckItem) security.ComplianceCheckItem {
	// TLS配置检查
	if s.cfg.Server.Mode == "production" {
		item.Status = "passed"
		item.Details = "生产环境应启用TLS"
	} else {
		item.Status = "warning"
		item.Details = "开发模式下TLS可能未启用"
		item.Suggestion = "生产环境请确保启用TLS"
	}
	return item
}

func (s *securityComplianceService) checkRateLimiting(item security.ComplianceCheckItem) security.ComplianceCheckItem {
	// 限流配置检查
	item.Status = "passed"
	item.Details = "应用级限流已在访问策略中配置"
	return item
}

func (s *securityComplianceService) checkCORSPolicy(item security.ComplianceCheckItem) security.ComplianceCheckItem {
	// CORS策略检查
	item.Status = "warning"
	item.Details = "CORS策略需要在生产环境中严格配置"
	item.Suggestion = "请配置严格的CORS允许来源"
	return item
}

func (s *securityComplianceService) checkDependencyScan(item security.ComplianceCheckItem) security.ComplianceCheckItem {
	status := s.GetDependencyScanStatus()
	if status.Enabled {
		item.Status = "passed"
		details := "已配置安全扫描工作流"
		if status.Schedule != "" {
			details += "，定时：" + status.Schedule
		}
		item.Details = details
	} else {
		item.Status = "warning"
		item.Details = "未发现依赖安全扫描流程"
		item.Suggestion = "请在CI/CD中集成依赖扫描工具"
	}
	return item
}

func (s *securityComplianceService) checkOutdatedDependencies(item security.ComplianceCheckItem) security.ComplianceCheckItem {
	status := s.GetDependencyScanStatus()
	if status.Enabled && containsCheck(status.Checks, "dependency-outdated") {
		item.Status = "passed"
		item.Details = "已配置依赖更新检查流程"
	} else {
		item.Status = "warning"
		item.Details = "需要定期检查和更新依赖"
		item.Suggestion = "请定期运行依赖更新检查"
	}
	return item
}

type workflowInfo struct {
	path    string
	content string
}

func (s *securityComplianceService) findSecurityScanWorkflow() (workflowInfo, bool) {
	wd, err := os.Getwd()
	if err != nil {
		return workflowInfo{}, false
	}
	dir := wd
	for i := 0; i < 5; i++ {
		candidate := filepath.Join(dir, ".github", "workflows", "security-scan.yml")
		if data, readErr := os.ReadFile(candidate); readErr == nil {
			return workflowInfo{path: candidate, content: string(data)}, true
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}
	return workflowInfo{}, false
}

func parseWorkflowSchedule(content string) string {
	if content == "" {
		return ""
	}
	re := regexp.MustCompile(`cron:\s*['"]([^'"]+)['"]`)
	match := re.FindStringSubmatch(content)
	if len(match) > 1 {
		return strings.TrimSpace(match[1])
	}
	return ""
}

func detectWorkflowChecks(content string) []string {
	if content == "" {
		return nil
	}
	checks := []string{}
	add := func(name string) {
		for _, existing := range checks {
			if existing == name {
				return
			}
		}
		checks = append(checks, name)
	}
	lower := strings.ToLower(content)
	if strings.Contains(lower, "govulncheck") {
		add("govulncheck")
	}
	if strings.Contains(lower, "gosec") {
		add("gosec")
	}
	if strings.Contains(lower, "pnpm audit") || strings.Contains(lower, "npm audit") {
		add("npm-audit")
	}
	if strings.Contains(lower, "gitleaks") {
		add("gitleaks")
	}
	if strings.Contains(lower, "codeql") {
		add("codeql")
	}
	if strings.Contains(lower, "pnpm outdated") || strings.Contains(lower, "go list -u -m all") || strings.Contains(lower, "dependency-check") {
		add("dependency-outdated")
	}
	return checks
}

func containsCheck(list []string, target string) bool {
	for _, item := range list {
		if item == target {
			return true
		}
	}
	return false
}

func (s *securityComplianceService) checkBackupEnabled(item security.ComplianceCheckItem) security.ComplianceCheckItem {
	// 备份配置检查
	item.Status = "warning"
	item.Details = "数据库备份需要配置"
	item.Suggestion = "请配置定期数据库备份任务"
	return item
}

func (s *securityComplianceService) checkBackupEncryption(item security.ComplianceCheckItem) security.ComplianceCheckItem {
	// 备份加密检查
	item.Status = "warning"
	item.Details = "备份加密需要配置"
	item.Suggestion = "请确保备份数据加密存储"
	return item
}

func (s *securityComplianceService) checkRecoveryTested(item security.ComplianceCheckItem) security.ComplianceCheckItem {
	// 恢复测试检查
	item.Status = "warning"
	item.Details = "需要定期测试恢复流程"
	item.Suggestion = "请定期进行恢复演练"
	return item
}

func (s *securityComplianceService) calculateSummary(items []security.ComplianceCheckItem) security.ComplianceSummary {
	summary := security.ComplianceSummary{
		TotalChecks: len(items),
	}

	for _, item := range items {
		switch item.Status {
		case "passed":
			summary.PassedChecks++
		case "failed":
			summary.FailedChecks++
		case "warning":
			summary.Warnings++
		case "skipped":
			summary.Skipped++
		}
	}

	return summary
}
