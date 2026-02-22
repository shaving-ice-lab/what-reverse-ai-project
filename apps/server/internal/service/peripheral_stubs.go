package service

// peripheral_stubs.go
// 保留被移除的周边模块的占位类型，确保核心服务编译通过。

import "errors"

// ==================== Data Classification Stubs ====================

type dataClassificationRequirement struct {
	requireAuth   bool
	requireMember bool
	requireOwner  bool
	requireAdmin  bool
}

func resolveDataClassificationRequirement(classification string) dataClassificationRequirement {
	switch classification {
	case "confidential":
		return dataClassificationRequirement{requireAuth: true, requireMember: true}
	case "internal":
		return dataClassificationRequirement{requireAuth: true}
	case "restricted":
		return dataClassificationRequirement{requireAuth: true, requireOwner: true}
	default:
		return dataClassificationRequirement{}
	}
}

// ==================== Misc Error Stubs ====================

var ErrUnauthorized = errors.New("unauthorized")
