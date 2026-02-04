package service

import "strings"

const (
	ExecutionStatusPending   = "pending"
	ExecutionStatusRunning   = "running"
	ExecutionStatusCompleted = "completed"
	ExecutionStatusFailed    = "failed"
	ExecutionStatusCancelled = "cancelled"
)

func normalizeExecutionStatus(status string) string {
	return strings.ToLower(strings.TrimSpace(status))
}

func canTransitionExecutionStatus(from, to string) bool {
	normalizedFrom := normalizeExecutionStatus(from)
	normalizedTo := normalizeExecutionStatus(to)
	if normalizedFrom == "" || normalizedTo == "" {
		return false
	}
	if normalizedFrom == normalizedTo {
		return true
	}
	switch normalizedFrom {
	case ExecutionStatusPending:
		return normalizedTo == ExecutionStatusRunning || normalizedTo == ExecutionStatusCancelled
	case ExecutionStatusRunning:
		return normalizedTo == ExecutionStatusCompleted || normalizedTo == ExecutionStatusFailed || normalizedTo == ExecutionStatusCancelled
	default:
		return false
	}
}
