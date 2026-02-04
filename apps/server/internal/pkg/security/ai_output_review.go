package security

import (
	"regexp"
	"strings"
)

// AIOutputReviewResult indicates whether output is safe to return.
type AIOutputReviewResult struct {
	Allowed    bool
	Categories []string
	Matches    []string
	Reason     string
}

// AIOutputRule defines a review rule.
type AIOutputRule struct {
	ID          string
	Category    string
	Description string
	Keywords    []string
	Patterns    []string
}

// UnsafeAIOutputError is returned when output is blocked.
type UnsafeAIOutputError struct {
	Result AIOutputReviewResult
}

func (e *UnsafeAIOutputError) Error() string {
	return "AI 输出包含不安全内容，已拦截"
}

// NewUnsafeAIOutputError creates a new unsafe output error.
func NewUnsafeAIOutputError(result AIOutputReviewResult) error {
	return &UnsafeAIOutputError{Result: result}
}

type aiOutputRuleCompiled struct {
	rule      AIOutputRule
	keywords  []string
	patterns  []*regexp.Regexp
	patternID []string
}

// AIOutputReviewer reviews AI output with a rule set.
type AIOutputReviewer struct {
	rules []aiOutputRuleCompiled
}

// ReviewAIOutput reviews content with default rules.
func ReviewAIOutput(content string) AIOutputReviewResult {
	return DefaultAIOutputReviewer().Review(content)
}

// DefaultAIOutputReviewer returns the shared reviewer.
func DefaultAIOutputReviewer() *AIOutputReviewer {
	return defaultAIOutputReviewer
}

var defaultAIOutputReviewer = NewAIOutputReviewer(DefaultAIOutputRules())

// NewAIOutputReviewer compiles rules into a reviewer.
func NewAIOutputReviewer(rules []AIOutputRule) *AIOutputReviewer {
	compiled := make([]aiOutputRuleCompiled, 0, len(rules))
	for _, rule := range rules {
		item := aiOutputRuleCompiled{
			rule: rule,
		}
		for _, keyword := range rule.Keywords {
			kw := strings.ToLower(strings.TrimSpace(keyword))
			if kw != "" {
				item.keywords = append(item.keywords, kw)
			}
		}
		for _, pattern := range rule.Patterns {
			re, err := regexp.Compile(pattern)
			if err != nil {
				continue
			}
			item.patterns = append(item.patterns, re)
			item.patternID = append(item.patternID, pattern)
		}
		compiled = append(compiled, item)
	}
	return &AIOutputReviewer{rules: compiled}
}

// Review checks content against all rules.
func (r *AIOutputReviewer) Review(content string) AIOutputReviewResult {
	trimmed := strings.TrimSpace(content)
	if trimmed == "" {
		return AIOutputReviewResult{Allowed: true}
	}

	lower := strings.ToLower(trimmed)
	categories := make([]string, 0)
	matches := make([]string, 0)

	for _, rule := range r.rules {
		if matchRule(rule, lower, trimmed, &matches) {
			categories = append(categories, rule.rule.Category)
		}
	}

	if len(categories) > 0 {
		return AIOutputReviewResult{
			Allowed:    false,
			Categories: uniqueStrings(categories),
			Matches:    uniqueStrings(matches),
			Reason:     "unsafe_content",
		}
	}

	return AIOutputReviewResult{Allowed: true}
}

func matchRule(rule aiOutputRuleCompiled, lowerContent string, rawContent string, matches *[]string) bool {
	for _, keyword := range rule.keywords {
		if strings.Contains(lowerContent, keyword) {
			*matches = append(*matches, keyword)
			return true
		}
	}
	for idx, re := range rule.patterns {
		if re.MatchString(rawContent) {
			if idx < len(rule.patternID) {
				*matches = append(*matches, rule.patternID[idx])
			} else {
				*matches = append(*matches, re.String())
			}
			return true
		}
	}
	return false
}

func uniqueStrings(items []string) []string {
	seen := make(map[string]struct{}, len(items))
	result := make([]string, 0, len(items))
	for _, item := range items {
		if item == "" {
			continue
		}
		if _, ok := seen[item]; ok {
			continue
		}
		seen[item] = struct{}{}
		result = append(result, item)
	}
	return result
}

// DefaultAIOutputRules defines baseline safety rules.
func DefaultAIOutputRules() []AIOutputRule {
	return []AIOutputRule{
		{
			ID:          "self_harm",
			Category:    "self_harm",
			Description: "Self-harm or suicide related content",
			Keywords: []string{
				"自杀", "自残", "结束生命", "suicide", "self-harm", "kill myself", "cut myself",
			},
		},
		{
			ID:          "violence",
			Category:    "violence",
			Description: "Violence or weapon-related instructions",
			Keywords: []string{
				"杀人", "谋杀", "爆炸", "炸弹", "枪支", "枪械", "weapon", "bomb", "how to kill", "make a bomb", "shoot",
			},
		},
		{
			ID:          "illegal",
			Category:    "illegal",
			Description: "Illegal activity instructions",
			Keywords: []string{
				"毒品", "制毒", "贩毒", "诈骗", "洗钱", "盗号", "黑客", "malware", "ransomware", "phishing", "credit card fraud", "steal password", "hack",
			},
		},
		{
			ID:          "hate",
			Category:    "hate",
			Description: "Hate or violent extremism",
			Keywords: []string{
				"仇恨", "灭绝", "种族灭绝", "kill all", "exterminate",
			},
		},
		{
			ID:          "sexual_minors",
			Category:    "sexual_minors",
			Description: "Sexual content involving minors",
			Keywords: []string{
				"未成年", "儿童色情", "child porn", "underage", "child sexual",
			},
		},
	}
}
