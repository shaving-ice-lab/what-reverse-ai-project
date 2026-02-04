package service

import (
	"strings"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
)

type ExecutionCacheSettings struct {
	ResultTTL time.Duration
}

type executionResultCacheEntry struct {
	Execution *entity.Execution
	NodeLogs  []entity.NodeLog
}

func newExecutionResultCache(ttl time.Duration) *ttlCache[executionResultCacheEntry] {
	if ttl <= 0 {
		return nil
	}
	return newTTLCache[executionResultCacheEntry](ttl)
}

func isTerminalExecutionStatus(status string) bool {
	normalized := strings.ToLower(strings.TrimSpace(status))
	switch normalized {
	case ExecutionStatusCompleted, ExecutionStatusFailed, ExecutionStatusCancelled:
		return true
	default:
		return false
	}
}

func cloneExecution(execution *entity.Execution) *entity.Execution {
	if execution == nil {
		return nil
	}
	cloned := *execution
	return &cloned
}

func cloneNodeLogs(logs []entity.NodeLog) []entity.NodeLog {
	if len(logs) == 0 {
		return nil
	}
	cloned := make([]entity.NodeLog, len(logs))
	copy(cloned, logs)
	return cloned
}
