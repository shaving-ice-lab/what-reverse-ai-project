package service

import (
	"regexp"
	"strings"
)

type ChangeLevel string

const (
	ChangeLevelUnknown ChangeLevel = "unknown"
	ChangeLevelPatch   ChangeLevel = "patch"
	ChangeLevelMinor   ChangeLevel = "minor"
	ChangeLevelMajor   ChangeLevel = "major"
)

var changelogHeaderPattern = regexp.MustCompile(`(?i)^(breaking|major|feat|fix|perf|refactor|docs|chore|style|test|build|ci|revert|misc)(\([^)]+\))?:\s+.+`)

func normalizeChangelog(raw *string) (*string, ChangeLevel) {
	if raw == nil {
		return nil, ChangeLevelUnknown
	}
	trimmed := strings.TrimSpace(*raw)
	if trimmed == "" {
		return nil, ChangeLevelUnknown
	}
	normalized := normalizeChangelogText(trimmed)
	if normalized == "" {
		return nil, ChangeLevelUnknown
	}
	return &normalized, detectChangeLevel(normalized)
}

func normalizeChangelogText(text string) string {
	if text == "" {
		return ""
	}
	lines := strings.Split(text, "\n")
	headIndex := 0
	for headIndex < len(lines) && strings.TrimSpace(lines[headIndex]) == "" {
		headIndex++
	}
	if headIndex >= len(lines) {
		return ""
	}
	head := strings.TrimSpace(lines[headIndex])
	if !changelogHeaderPattern.MatchString(head) {
		head = normalizeChangelogLine(head)
	}
	lines[headIndex] = head
	return strings.TrimSpace(strings.Join(lines, "\n"))
}

func normalizeChangelogLine(line string) string {
	trimmed := strings.TrimSpace(line)
	if trimmed == "" {
		return ""
	}
	lower := strings.ToLower(trimmed)
	switch {
	case strings.HasPrefix(lower, "breaking") || strings.HasPrefix(trimmed, "重大变更"):
		return "breaking: " + trimmed
	case strings.HasPrefix(lower, "rollback") || strings.HasPrefix(lower, "revert") || strings.HasPrefix(trimmed, "回滚"):
		return "revert: " + trimmed
	default:
		return "misc: " + trimmed
	}
}

func detectChangeLevel(text string) ChangeLevel {
	if text == "" {
		return ChangeLevelUnknown
	}
	if hasBreakingMarker(text) {
		return ChangeLevelMajor
	}
	head := strings.TrimSpace(strings.SplitN(text, "\n", 2)[0])
	changeType := extractChangelogType(head)
	switch changeType {
	case "breaking", "major":
		return ChangeLevelMajor
	case "feat", "perf", "refactor":
		return ChangeLevelMinor
	case "fix", "docs", "chore", "style", "test", "build", "ci", "revert", "misc":
		return ChangeLevelPatch
	default:
		return ChangeLevelUnknown
	}
}

func extractChangelogType(line string) string {
	if line == "" {
		return ""
	}
	prefix := strings.TrimSpace(strings.SplitN(line, ":", 2)[0])
	if idx := strings.Index(prefix, "("); idx != -1 {
		prefix = prefix[:idx]
	}
	return strings.ToLower(strings.TrimSpace(prefix))
}

func hasBreakingMarker(text string) bool {
	lower := strings.ToLower(text)
	return strings.Contains(lower, "breaking:") ||
		strings.Contains(lower, "breaking change:") ||
		strings.Contains(lower, "[breaking]") ||
		strings.Contains(text, "重大变更")
}
