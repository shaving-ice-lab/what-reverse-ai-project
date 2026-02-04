package service

import "strings"

const (
	AppStatusDraft      = "draft"
	AppStatusPublished  = "published"
	AppStatusDeprecated = "deprecated"
	AppStatusArchived   = "archived"
)

func normalizeAppStatus(status string) string {
	normalized := strings.ToLower(strings.TrimSpace(status))
	if normalized == "" {
		return AppStatusDraft
	}
	return normalized
}

func canTransitionAppStatus(from, to string) bool {
	normalizedFrom := normalizeAppStatus(from)
	normalizedTo := normalizeAppStatus(to)
	if normalizedFrom == normalizedTo {
		return true
	}
	switch normalizedFrom {
	case AppStatusDraft:
		return normalizedTo == AppStatusPublished
	case AppStatusPublished:
		return normalizedTo == AppStatusDeprecated
	case AppStatusDeprecated:
		return normalizedTo == AppStatusArchived
	default:
		return false
	}
}

func canRollbackAppStatus(status string) bool {
	normalized := normalizeAppStatus(status)
	return normalized == AppStatusPublished || normalized == AppStatusDeprecated
}

func isRuntimeAccessibleAppStatus(status string) bool {
	normalized := normalizeAppStatus(status)
	return normalized == AppStatusPublished || normalized == AppStatusDeprecated
}
