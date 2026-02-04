package security

import (
	"strings"
)

// DataClassificationLevel 数据分级级别
type DataClassificationLevel int

const (
	// DataLevelPublic 公开数据 - 可公开访问的数据
	DataLevelPublic DataClassificationLevel = 0
	// DataLevelInternal 内部数据 - 业务数据 (L1)
	DataLevelInternal DataClassificationLevel = 1
	// DataLevelConfidential 机密数据 - 日志数据 (L2)
	DataLevelConfidential DataClassificationLevel = 2
	// DataLevelSecret 秘密数据 - 密钥数据 (L3)
	DataLevelSecret DataClassificationLevel = 3
)

// String 返回数据分级名称
func (l DataClassificationLevel) String() string {
	switch l {
	case DataLevelPublic:
		return "public"
	case DataLevelInternal:
		return "internal"
	case DataLevelConfidential:
		return "confidential"
	case DataLevelSecret:
		return "secret"
	default:
		return "unknown"
	}
}

// DataCategory 数据类别
type DataCategory string

const (
	// CategoryBusiness 业务数据
	CategoryBusiness DataCategory = "business"
	// CategoryLog 日志数据
	CategoryLog DataCategory = "log"
	// CategoryCredential 凭证数据
	CategoryCredential DataCategory = "credential"
	// CategoryPII 个人身份信息
	CategoryPII DataCategory = "pii"
	// CategoryAudit 审计数据
	CategoryAudit DataCategory = "audit"
)

// DataClassification 数据分类定义
type DataClassification struct {
	Category    DataCategory            `json:"category"`
	Level       DataClassificationLevel `json:"level"`
	Description string                  `json:"description"`
	Fields      []string                `json:"fields"`
}

// DataClassificationRegistry 数据分类注册表
var DataClassificationRegistry = map[DataCategory]DataClassification{
	CategoryBusiness: {
		Category:    CategoryBusiness,
		Level:       DataLevelInternal,
		Description: "业务数据 - 工作流、应用、执行结果等核心业务数据",
		Fields: []string{
			"workflow_definition", "app_config", "execution_result",
			"ui_schema", "db_schema", "node_config",
		},
	},
	CategoryLog: {
		Category:    CategoryLog,
		Level:       DataLevelConfidential,
		Description: "日志数据 - 执行日志、访问日志、错误日志",
		Fields: []string{
			"execution_log", "access_log", "error_log",
			"request_body", "response_body", "stack_trace",
		},
	},
	CategoryCredential: {
		Category:    CategoryCredential,
		Level:       DataLevelSecret,
		Description: "凭证数据 - API密钥、数据库密码、加密密钥",
		Fields: []string{
			"api_key", "password", "secret", "token",
			"private_key", "encryption_key", "db_password",
			"secret_ref", "key_encrypted",
		},
	},
	CategoryPII: {
		Category:    CategoryPII,
		Level:       DataLevelConfidential,
		Description: "个人身份信息 - 邮箱、手机号、IP地址等",
		Fields: []string{
			"email", "phone", "ip_address", "ip_hash",
			"user_agent", "user_agent_hash", "real_name",
			"id_card", "address", "birthday",
		},
	},
	CategoryAudit: {
		Category:    CategoryAudit,
		Level:       DataLevelConfidential,
		Description: "审计数据 - 操作记录、访问记录",
		Fields: []string{
			"audit_log", "access_record", "operation_record",
			"actor_user_id", "target_id", "action",
		},
	},
}

// AccessPolicy 访问策略
type AccessPolicy struct {
	MinRole         string   `json:"min_role"`         // 最低角色要求
	RequiredPerms   []string `json:"required_perms"`   // 所需权限
	AllowAnonymous  bool     `json:"allow_anonymous"`  // 是否允许匿名访问
	AuditRequired   bool     `json:"audit_required"`   // 是否需要审计
	EncryptRequired bool     `json:"encrypt_required"` // 是否需要加密
	MaskOnExport    bool     `json:"mask_on_export"`   // 导出时是否脱敏
}

// DefaultAccessPolicies 默认访问策略
var DefaultAccessPolicies = map[DataClassificationLevel]AccessPolicy{
	DataLevelPublic: {
		MinRole:         "",
		RequiredPerms:   nil,
		AllowAnonymous:  true,
		AuditRequired:   false,
		EncryptRequired: false,
		MaskOnExport:    false,
	},
	DataLevelInternal: {
		MinRole:         "member",
		RequiredPerms:   []string{"app_view_metrics"},
		AllowAnonymous:  false,
		AuditRequired:   false,
		EncryptRequired: false,
		MaskOnExport:    false,
	},
	DataLevelConfidential: {
		MinRole:         "admin",
		RequiredPerms:   []string{"logs_view"},
		AllowAnonymous:  false,
		AuditRequired:   true,
		EncryptRequired: false,
		MaskOnExport:    true,
	},
	DataLevelSecret: {
		MinRole:         "owner",
		RequiredPerms:   []string{"workspace_admin"},
		AllowAnonymous:  false,
		AuditRequired:   true,
		EncryptRequired: true,
		MaskOnExport:    true,
	},
}

// GetClassificationLevel 获取字段的数据分级
func GetClassificationLevel(fieldName string) DataClassificationLevel {
	fieldLower := strings.ToLower(fieldName)

	for _, classification := range DataClassificationRegistry {
		for _, field := range classification.Fields {
			if strings.Contains(fieldLower, field) || strings.Contains(field, fieldLower) {
				return classification.Level
			}
		}
	}

	return DataLevelPublic
}

// GetAccessPolicy 获取数据分级对应的访问策略
func GetAccessPolicy(level DataClassificationLevel) AccessPolicy {
	if policy, ok := DefaultAccessPolicies[level]; ok {
		return policy
	}
	return DefaultAccessPolicies[DataLevelPublic]
}

// CheckAccess 检查访问权限
func CheckAccess(level DataClassificationLevel, userRole string, userPerms []string) bool {
	policy := GetAccessPolicy(level)

	// 公开数据或允许匿名访问
	if policy.AllowAnonymous {
		return true
	}

	// 检查角色
	if !checkRoleLevel(userRole, policy.MinRole) {
		return false
	}

	// 检查权限
	if len(policy.RequiredPerms) > 0 {
		hasRequired := false
		for _, required := range policy.RequiredPerms {
			for _, perm := range userPerms {
				if perm == required {
					hasRequired = true
					break
				}
			}
			if hasRequired {
				break
			}
		}
		if !hasRequired {
			return false
		}
	}

	return true
}

// checkRoleLevel 检查角色级别
func checkRoleLevel(userRole, minRole string) bool {
	roleLevels := map[string]int{
		"":       0,
		"member": 1,
		"admin":  2,
		"owner":  3,
	}

	userLevel, ok := roleLevels[userRole]
	if !ok {
		userLevel = 0
	}

	minLevel, ok := roleLevels[minRole]
	if !ok {
		minLevel = 0
	}

	return userLevel >= minLevel
}

// NeedsAudit 检查是否需要审计
func NeedsAudit(level DataClassificationLevel) bool {
	return GetAccessPolicy(level).AuditRequired
}

// NeedsEncryption 检查是否需要加密
func NeedsEncryption(level DataClassificationLevel) bool {
	return GetAccessPolicy(level).EncryptRequired
}

// NeedsMaskOnExport 检查导出时是否需要脱敏
func NeedsMaskOnExport(level DataClassificationLevel) bool {
	return GetAccessPolicy(level).MaskOnExport
}
