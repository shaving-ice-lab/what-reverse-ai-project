package service

import (
	"strings"
	"unicode"
)

// RequestComplexity classifies the scope of a user's build request.
type RequestComplexity string

const (
	// RequestComplexityComplex indicates a multi-feature or full-app request.
	// The LLM should engage in a multi-turn Q&A planning conversation.
	RequestComplexityComplex RequestComplexity = "complex"

	// RequestComplexitySimple indicates a single-operation request
	// (e.g., "add a column", "rename a field").
	// The LLM should skip Q&A and call create_plan directly with 1-3 steps.
	RequestComplexitySimple RequestComplexity = "simple"

	// RequestComplexityQuestion indicates a pure informational query with no build intent
	// (e.g., "what tables exist?", "查询所有员工").
	// The LLM should answer directly without creating a plan.
	RequestComplexityQuestion RequestComplexity = "question"
)

// ClassifyRequestComplexity performs deterministic rule-based analysis of a user message
// and returns its complexity classification. Used in the planning phase to give the LLM
// a reliable hint about how to behave — avoiding unnecessary Q&A for simple requests.
//
// Priority order: complex → question → simple → default(complex)
// Defaulting to complex is intentional: better to ask one extra question than to skip
// necessary requirements gathering.
func ClassifyRequestComplexity(message string) RequestComplexity {
	if strings.TrimSpace(message) == "" {
		return RequestComplexitySimple
	}

	lower := strings.ToLower(strings.TrimSpace(message))
	tokenCount := countTokens(message)

	// 0. Explicit question mark with no build intent → always a question
	// This must run before the complex-keyword check to correctly classify
	// messages like "什么是管理系统的最佳实践？" or "how do I set up foreign keys?"
	trimmed := strings.TrimSpace(message)
	if strings.HasSuffix(trimmed, "?") || strings.HasSuffix(trimmed, "？") {
		if !containsAnyStr(lower, buildVerbsCN) && !containsAnyStr(lower, buildVerbsEN) {
			return RequestComplexityQuestion
		}
	}

	// 1. Complex signals take highest priority to avoid false "simple" or "question" calls
	if isComplexRequest(lower, tokenCount) {
		return RequestComplexityComplex
	}

	// 2. Question: pure informational query — no build verbs present
	if isQuestionRequest(lower, message) {
		return RequestComplexityQuestion
	}

	// 3. Simple: single-operation build request
	if isSimpleRequest(lower, tokenCount) {
		return RequestComplexitySimple
	}

	// Default: conservative — treat as complex so Q&A is not skipped unnecessarily
	return RequestComplexityComplex
}

// ── Classifier helpers ────────────────────────────────────────────────────────

func isComplexRequest(lower string, tokenCount int) bool {
	// Long messages almost always describe multi-feature requirements
	if tokenCount > 25 {
		return true
	}

	// System / platform scope keywords (Chinese)
	complexKWsCN := []string{
		"系统", "平台", "应用", "网站", "后台", "前台",
		"管理系统", "管理平台", "业务系统", "业务平台",
		"模块", "完整", "整个", "全部", "全新", "从头", "从零",
		"多个", "几个", "一套",
	}
	// System / platform scope keywords (English)
	complexKWsEN := []string{
		"system", "platform", "application", " app ", "website", "portal",
		"complete", "entire", "full app", "full stack", "full system", "whole ", "from scratch",
		"management system", "management platform",
	}
	if containsAnyStr(lower, complexKWsCN) || containsAnyStr(lower, complexKWsEN) {
		return true
	}

	// Multiple requirements joined by conjunctions (Chinese)
	multiReqCN := []string{"以及", "还要", "另外", "同时还", "包括", "并且", "还有", "同时需要"}
	// Multiple requirements joined by conjunctions (English)
	multiReqEN := []string{" and also", " as well as", " plus ", " including ", " along with ", " in addition"}
	if containsAnyStr(lower, multiReqCN) || containsAnyStr(lower, multiReqEN) {
		// Only flag as complex when combined with at least one build verb
		if containsAnyStr(lower, buildVerbsCN) || containsAnyStr(lower, buildVerbsEN) {
			return true
		}
	}

	// Three or more distinct build verbs suggest broad scope
	buildVerbCount := 0
	for _, v := range append(buildVerbsCN, buildVerbsEN...) {
		if strings.Contains(lower, v) {
			buildVerbCount++
		}
	}
	if buildVerbCount >= 3 {
		return true
	}

	return false
}

func isQuestionRequest(lower, original string) bool {
	// If any build verb is present → not a pure question
	if containsAnyStr(lower, buildVerbsCN) || containsAnyStr(lower, buildVerbsEN) {
		return false
	}

	// Ends with question mark (Chinese or ASCII)
	trimmed := strings.TrimSpace(original)
	if strings.HasSuffix(trimmed, "?") || strings.HasSuffix(trimmed, "？") {
		return true
	}

	// Starts with clear question words
	questionPrefixesCN := []string{
		"什么", "哪些", "哪个", "哪种", "怎么", "如何", "为什么",
		"何时", "何处", "是否", "能否", "可以吗", "有没有", "有哪些", "请问",
	}
	questionPrefixesEN := []string{
		"what ", "which ", "how ", "why ", "when ", "where ", "who ",
		"is ", "are ", "can ", "could ", "would ", "should ", "does ", "do ",
		"tell me", "show me", "list all", "list the",
	}
	for _, prefix := range questionPrefixesCN {
		if strings.HasPrefix(lower, prefix) {
			return true
		}
	}
	for _, prefix := range questionPrefixesEN {
		if strings.HasPrefix(lower, prefix) {
			return true
		}
	}

	// Pure data query without build intent
	queryOnlyCN := []string{"查询", "搜索", "查找", "查看", "显示", "展示", "列出", "统计"}
	for _, q := range queryOnlyCN {
		if strings.HasPrefix(lower, q) {
			return true
		}
	}

	return false
}

func isSimpleRequest(lower string, tokenCount int) bool {
	// Must contain a recognizable single-operation verb
	simpleVerbsCN := []string{
		"加一列", "加一个", "加一张", "加个", "加列", "加字段",
		"添加一", "添加一个", "新增一", "插入一",
		"删除", "移除", "删掉", "去掉",
		"修改", "更改", "调整", "改名", "重命名", "改为", "改成",
		"修复", "修正",
		"隐藏", "过滤",
	}
	simpleVerbsEN := []string{
		"add a ", "add an ", "add the ", "add one ", "add column", "add field",
		"remove ", "delete ", "drop the ", "drop column",
		"rename ", "update the ", "change the ", "modify the ",
		"fix the ", "fix a ", "fix this",
		"hide ", "filter ",
	}

	hasSingleOp := containsAnyStr(lower, simpleVerbsCN) || containsAnyStr(lower, simpleVerbsEN)
	if !hasSingleOp {
		return false
	}

	// Short enough to be a single operation
	if tokenCount > 20 {
		return false
	}

	// Ensure no complex scope words slip through
	complexScopeWords := []string{
		"系统", "平台", "完整", "全部", "整个", "全新",
		"system", "platform", "complete", "entire", "full app", "full stack", "full system",
	}
	if containsAnyStr(lower, complexScopeWords) {
		return false
	}

	return true
}

// ── Token counting (Chinese chars + English words) ────────────────────────────

// countTokens counts Chinese characters and English words as equal semantic units.
// This gives a consistent measure for mixed-language messages.
func countTokens(message string) int {
	tokens := 0
	inWord := false
	for _, r := range message {
		if unicode.Is(unicode.Han, r) {
			tokens++
			inWord = false
		} else if unicode.IsLetter(r) || unicode.IsDigit(r) {
			if !inWord {
				tokens++
				inWord = true
			}
		} else {
			inWord = false
		}
	}
	return tokens
}

// ── Shared vocabulary sets ────────────────────────────────────────────────────

var buildVerbsCN = []string{
	"创建", "新建", "开发", "搭建", "实现", "构建", "设计",
	"建立", "做一个", "做个", "写一个", "写个", "生成", "开发",
}

var buildVerbsEN = []string{
	"create", "build", "develop", "implement", "design",
	"make a", "make an", "generate", "write a",
}

// containsAnyStr returns true if s contains any of the given substrings.
func containsAnyStr(s string, patterns []string) bool {
	for _, p := range patterns {
		if strings.Contains(s, p) {
			return true
		}
	}
	return false
}
