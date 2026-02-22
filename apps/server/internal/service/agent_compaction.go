package service

import (
	"context"
	"fmt"
	"strings"
	"time"
)

// CompactionConfig controls when and how message compaction triggers
type CompactionConfig struct {
	// Threshold is the message count above which compaction is triggered
	Threshold int
	// KeepRecent is how many recent messages to preserve verbatim
	KeepRecent int
}

// DefaultCompactionConfig returns sensible defaults
func DefaultCompactionConfig() CompactionConfig {
	return CompactionConfig{
		Threshold:  40,
		KeepRecent: 10,
	}
}

// compactSessionMessages checks if the session message count exceeds the threshold.
// If so, it summarizes older messages into a single system message and replaces them.
// This mirrors OpenCode's compaction agent pattern.
func (e *agentEngine) compactSessionMessages(_ context.Context, session *AgentSession, sessionID string) {
	cfg := DefaultCompactionConfig()

	messages := session.GetMessages()
	if len(messages) <= cfg.Threshold {
		return
	}

	// Split: older messages to compact, recent messages to keep.
	// IMPORTANT: cutoff must land on a 'user' message boundary to avoid
	// leaving orphaned 'tool' messages (whose assistant pair was compacted).
	cutoff := len(messages) - cfg.KeepRecent
	if cutoff <= 1 {
		return
	}
	// Walk backward from cutoff to find the nearest 'user' message start,
	// ensuring no assistant+tool pairs are split across the boundary.
	for cutoff > 1 && messages[cutoff-1].Role != "user" {
		cutoff--
	}
	if cutoff <= 1 {
		return // Can't find a safe boundary — skip compaction this round
	}
	olderMessages := messages[:cutoff]
	recentMessages := messages[cutoff:]

	// Build a summary of the older messages without LLM (rule-based compaction)
	// This is cheaper and faster than LLM-based compaction. Can upgrade later.
	summary := buildCompactionSummary(olderMessages)

	// Replace session messages: [summary_system_msg] + recentMessages
	summaryMsg := AgentMessageEntry{
		Role:      "system",
		Content:   summary,
		Timestamp: time.Now(),
		Metadata: map[string]interface{}{
			"type":            "compaction_summary",
			"compacted_count": cutoff,
			"original_count":  len(messages),
			"remaining_count": len(recentMessages) + 1,
		},
	}

	newMessages := make([]AgentMessageEntry, 0, len(recentMessages)+1)
	newMessages = append(newMessages, summaryMsg)
	newMessages = append(newMessages, recentMessages...)

	session.mu.Lock()
	session.Messages = newMessages
	session.UpdatedAt = time.Now()
	session.mu.Unlock()

	e.sessions.Persist(sessionID)
}

// buildCompactionSummary creates a rule-based summary of conversation history.
// Extracts: user requests, tool calls made, tool results (success/fail), key decisions.
func buildCompactionSummary(messages []AgentMessageEntry) string {
	var sb strings.Builder
	sb.WriteString("[Conversation Summary — earlier messages compacted]\n\n")

	var userRequests []string
	var toolsExecuted []string
	var tablesCreated []string
	var errorsEncountered []string
	var uiActions []string

	for _, m := range messages {
		switch m.Role {
		case "user":
			if m.Content != "" {
				// Keep first 200 chars of each user message
				msg := m.Content
				if len(msg) > 200 {
					msg = msg[:197] + "..."
				}
				userRequests = append(userRequests, msg)
			}
		case "tool":
			toolName, _ := m.Metadata["tool"].(string)
			success, _ := m.Metadata["success"].(bool)
			if toolName != "" {
				status := "OK"
				if !success {
					status = "FAILED"
					// Extract short error
					if len(m.Content) > 100 {
						errorsEncountered = append(errorsEncountered, fmt.Sprintf("%s: %s", toolName, m.Content[:97]+"..."))
					} else if m.Content != "" {
						errorsEncountered = append(errorsEncountered, fmt.Sprintf("%s: %s", toolName, m.Content))
					}
				}
				toolsExecuted = append(toolsExecuted, fmt.Sprintf("%s (%s)", toolName, status))

				// Track specific outcomes
				switch toolName {
				case "create_table":
					if success {
						tablesCreated = append(tablesCreated, extractTableName(m.Content))
					}
				case "generate_ui_schema", "modify_ui_schema":
					if success {
						uiActions = append(uiActions, toolName)
					}
				}
			}
		}
	}

	if len(userRequests) > 0 {
		sb.WriteString("User requests:\n")
		for _, r := range userRequests {
			sb.WriteString(fmt.Sprintf("- %s\n", r))
		}
		sb.WriteString("\n")
	}

	if len(toolsExecuted) > 0 {
		sb.WriteString(fmt.Sprintf("Tools executed (%d total):\n", len(toolsExecuted)))
		// Group by tool name for compactness
		toolCounts := make(map[string]int)
		for _, t := range toolsExecuted {
			toolCounts[t]++
		}
		for tool, count := range toolCounts {
			if count > 1 {
				sb.WriteString(fmt.Sprintf("- %s x%d\n", tool, count))
			} else {
				sb.WriteString(fmt.Sprintf("- %s\n", tool))
			}
		}
		sb.WriteString("\n")
	}

	if len(tablesCreated) > 0 {
		sb.WriteString(fmt.Sprintf("Tables created: %s\n\n", strings.Join(tablesCreated, ", ")))
	}

	if len(uiActions) > 0 {
		sb.WriteString(fmt.Sprintf("UI schema actions: %s\n\n", strings.Join(uiActions, ", ")))
	}

	if len(errorsEncountered) > 0 {
		sb.WriteString("Errors encountered:\n")
		for _, errLine := range errorsEncountered {
			sb.WriteString(fmt.Sprintf("- %s\n", errLine))
		}
	}

	return sb.String()
}

// extractTableName tries to extract a table name from a tool result message
func extractTableName(content string) string {
	// Simple heuristic: look for common patterns like "Table 'xxx' created"
	if idx := strings.Index(content, "Table '"); idx >= 0 {
		rest := content[idx+7:]
		if endIdx := strings.Index(rest, "'"); endIdx > 0 {
			return rest[:endIdx]
		}
	}
	if idx := strings.Index(content, "table "); idx >= 0 {
		rest := content[idx+6:]
		if endIdx := strings.IndexAny(rest, " .,;"); endIdx > 0 {
			return rest[:endIdx]
		}
		if len(rest) < 50 {
			return strings.TrimSpace(rest)
		}
	}
	return "(unknown)"
}
