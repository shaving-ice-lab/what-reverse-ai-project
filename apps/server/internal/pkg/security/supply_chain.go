package security

import (
	"regexp"
	"strings"
	"time"
)

// LicenseDecision 许可审查结果
type LicenseDecision string

const (
	LicenseDecisionAllowed LicenseDecision = "allowed"
	LicenseDecisionReview  LicenseDecision = "review"
	LicenseDecisionDenied  LicenseDecision = "denied"
	LicenseDecisionUnknown LicenseDecision = "unknown"
)

// LicensePolicy 依赖许可审查策略
type LicensePolicy struct {
	Key           string   `json:"key"`
	Title         string   `json:"title"`
	Version       string   `json:"version"`
	Allowed       []string `json:"allowed"`
	Review        []string `json:"review"`
	Denied        []string `json:"denied"`
	DefaultAction string   `json:"default_action"`
	Notes         []string `json:"notes,omitempty"`
}

// LicenseDependency 依赖项许可信息
type LicenseDependency struct {
	Name    string `json:"name"`
	Version string `json:"version,omitempty"`
	License string `json:"license"`
	Source  string `json:"source,omitempty"`
}

// LicenseReviewItem 许可审查条目
type LicenseReviewItem struct {
	Name       string          `json:"name"`
	Version    string          `json:"version,omitempty"`
	License    string          `json:"license"`
	Decision   LicenseDecision `json:"decision"`
	Reason     string          `json:"reason,omitempty"`
	Suggestion string          `json:"suggestion,omitempty"`
}

// LicenseReviewSummary 许可审查汇总
type LicenseReviewSummary struct {
	Total   int    `json:"total"`
	Allowed int    `json:"allowed"`
	Review  int    `json:"review"`
	Denied  int    `json:"denied"`
	Unknown int    `json:"unknown"`
	Status  string `json:"status"` // passed, warning, failed
}

// LicenseReviewResult 许可审查结果
type LicenseReviewResult struct {
	ReviewedAt time.Time            `json:"reviewed_at"`
	Policy     LicensePolicy        `json:"policy"`
	Items      []LicenseReviewItem  `json:"items"`
	Summary    LicenseReviewSummary `json:"summary"`
}

var licenseSplitter = regexp.MustCompile(`(?i)\s+OR\s+|\s+AND\s+|/|,|\(|\)|\+`)

// EvaluateLicenseCompliance 执行依赖许可审查
func EvaluateLicenseCompliance(policy LicensePolicy, deps []LicenseDependency) LicenseReviewResult {
	allowed := buildLicenseSet(policy.Allowed)
	review := buildLicenseSet(policy.Review)
	denied := buildLicenseSet(policy.Denied)

	items := make([]LicenseReviewItem, 0, len(deps))
	summary := LicenseReviewSummary{Total: len(deps)}

	for _, dep := range deps {
		item := LicenseReviewItem{
			Name:    dep.Name,
			Version: dep.Version,
			License: dep.License,
		}

		decision, reason := evaluateLicenseDecision(dep.License, policy.DefaultAction, allowed, review, denied)
		item.Decision = decision
		item.Reason = reason

		switch decision {
		case LicenseDecisionAllowed:
			summary.Allowed++
		case LicenseDecisionReview:
			summary.Review++
			item.Suggestion = "需要安全或法务人工复核"
		case LicenseDecisionDenied:
			summary.Denied++
			item.Suggestion = "替换依赖或申请豁免"
		default:
			summary.Unknown++
			item.Suggestion = "补充依赖许可信息"
		}

		items = append(items, item)
	}

	switch {
	case summary.Denied > 0:
		summary.Status = "failed"
	case summary.Review > 0 || summary.Unknown > 0:
		summary.Status = "warning"
	default:
		summary.Status = "passed"
	}

	return LicenseReviewResult{
		ReviewedAt: time.Now(),
		Policy:     policy,
		Items:      items,
		Summary:    summary,
	}
}

func evaluateLicenseDecision(raw string, defaultAction string, allowed, review, denied map[string]struct{}) (LicenseDecision, string) {
	license := normalizeLicense(raw)
	if license == "" {
		return applyDefaultDecision(defaultAction, LicenseDecisionUnknown, "缺少许可信息")
	}

	tokens := splitLicenseTokens(license)
	if len(tokens) == 0 {
		return applyDefaultDecision(defaultAction, LicenseDecisionUnknown, "无法解析许可信息")
	}

	for _, token := range tokens {
		if _, ok := denied[token]; ok {
			return LicenseDecisionDenied, "命中拒绝清单: " + token
		}
	}
	for _, token := range tokens {
		if _, ok := review[token]; ok {
			return LicenseDecisionReview, "命中复核清单: " + token
		}
	}
	for _, token := range tokens {
		if _, ok := allowed[token]; ok {
			return LicenseDecisionAllowed, "许可在允许清单中"
		}
	}
	return applyDefaultDecision(defaultAction, LicenseDecisionUnknown, "许可未在策略清单中")
}

func applyDefaultDecision(defaultAction string, fallback LicenseDecision, reason string) (LicenseDecision, string) {
	action := normalizeLicense(defaultAction)
	switch action {
	case "allow", "allowed", "approve", "approved":
		return LicenseDecisionAllowed, reason + "，按默认策略允许"
	case "deny", "denied", "block", "blocked":
		return LicenseDecisionDenied, reason + "，按默认策略拒绝"
	case "review", "warn", "warning":
		return LicenseDecisionReview, reason + "，按默认策略复核"
	default:
		return fallback, reason
	}
}

func buildLicenseSet(values []string) map[string]struct{} {
	if len(values) == 0 {
		return map[string]struct{}{}
	}
	set := make(map[string]struct{}, len(values))
	for _, value := range values {
		key := normalizeLicense(value)
		if key == "" {
			continue
		}
		set[key] = struct{}{}
	}
	return set
}

func normalizeLicense(value string) string {
	return strings.ToLower(strings.TrimSpace(value))
}

func splitLicenseTokens(value string) []string {
	normalized := normalizeLicense(value)
	if normalized == "" {
		return nil
	}
	parts := licenseSplitter.Split(normalized, -1)
	out := make([]string, 0, len(parts))
	for _, part := range parts {
		token := strings.TrimSpace(part)
		if token == "" {
			continue
		}
		out = append(out, token)
	}
	return out
}
