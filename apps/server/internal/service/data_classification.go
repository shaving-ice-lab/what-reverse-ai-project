package service

import "strings"

const (
	DataClassificationPublic       = "public"
	DataClassificationInternal     = "internal"
	DataClassificationConfidential = "confidential"
	DataClassificationRestricted   = "restricted"
)

type dataClassificationRequirement struct {
	requireAuth   bool
	requireMember bool
	requireAdmin  bool
	requireOwner  bool
}

func normalizeDataClassification(value string) string {
	normalized := strings.ToLower(strings.TrimSpace(value))
	if normalized == "" {
		return DataClassificationPublic
	}
	return normalized
}

func isValidDataClassification(value string) bool {
	switch normalizeDataClassification(value) {
	case DataClassificationPublic, DataClassificationInternal, DataClassificationConfidential, DataClassificationRestricted:
		return true
	default:
		return false
	}
}

func resolveDataClassificationRequirement(value string) dataClassificationRequirement {
	switch normalizeDataClassification(value) {
	case DataClassificationInternal:
		return dataClassificationRequirement{requireAuth: true, requireMember: true}
	case DataClassificationConfidential:
		return dataClassificationRequirement{requireAuth: true, requireMember: true, requireAdmin: true}
	case DataClassificationRestricted:
		return dataClassificationRequirement{requireAuth: true, requireOwner: true}
	default:
		return dataClassificationRequirement{}
	}
}

func validateAccessPolicyClassification(accessMode, classification string) error {
	normalizedMode := strings.ToLower(strings.TrimSpace(accessMode))
	normalizedClassification := normalizeDataClassification(classification)

	switch normalizedClassification {
	case DataClassificationPublic:
		return nil
	case DataClassificationInternal, DataClassificationConfidential:
		if normalizedMode == "public_anonymous" {
			return ErrWorkspaceInvalidAccessPolicy
		}
		return nil
	case DataClassificationRestricted:
		if normalizedMode != "private" {
			return ErrWorkspaceInvalidAccessPolicy
		}
		return nil
	default:
		return ErrWorkspaceInvalidDataClassification
	}
}
