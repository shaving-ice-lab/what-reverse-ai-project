package service

import (
	"testing"
)

// ── ClassifyRequestComplexity ─────────────────────────────────────────────────

func TestClassify_ComplexRequests_Chinese(t *testing.T) {
	cases := []string{
		"帮我创建一个员工管理系统",
		"开发一个完整的订单管理平台",
		"搭建一个电商网站",
		"帮我做一个完整的任务管理系统，包括看板和甘特图",
		"设计一个业务管理平台，包含员工、部门、考勤模块",
		"创建一个全新的CRM系统",
		"做一个从头搭建的进销存系统",
		"帮我开发一个包含多个功能模块的企业后台系统",
		"建立一套完整的用户权限管理系统",
	}
	for _, msg := range cases {
		t.Run(msg, func(t *testing.T) {
			got := ClassifyRequestComplexity(msg)
			if got != RequestComplexityComplex {
				t.Errorf("ClassifyRequestComplexity(%q) = %q, want complex", msg, got)
			}
		})
	}
}

func TestClassify_ComplexRequests_English(t *testing.T) {
	cases := []string{
		"build a complete task management system with user authentication",
		"create an employee management system with departments and attendance",
		"develop a full e-commerce platform with product catalog and orders",
		"I want a complete CRM platform from scratch",
		"build an entire order management system including reporting dashboard",
		"create a management system for inventory, sales, and customers",
	}
	for _, msg := range cases {
		t.Run(msg, func(t *testing.T) {
			got := ClassifyRequestComplexity(msg)
			if got != RequestComplexityComplex {
				t.Errorf("ClassifyRequestComplexity(%q) = %q, want complex", msg, got)
			}
		})
	}
}

func TestClassify_SimpleRequests_Chinese(t *testing.T) {
	cases := []string{
		"给users表加一列status字段",
		"添加一个age字段到employees表",
		"删除orders表中的备注字段",
		"修改employees表的name字段为employee_name",
		"重命名email字段为user_email",
		"调整用户表的phone字段长度",
		"删掉products表的description列",
	}
	for _, msg := range cases {
		t.Run(msg, func(t *testing.T) {
			got := ClassifyRequestComplexity(msg)
			if got != RequestComplexitySimple {
				t.Errorf("ClassifyRequestComplexity(%q) = %q, want simple", msg, got)
			}
		})
	}
}

func TestClassify_SimpleRequests_English(t *testing.T) {
	cases := []string{
		"add a status column to the users table",
		"add a field called age to employees",
		"rename the email field to user_email",
		"remove the description column from products",
		"delete the notes field from orders",
		"fix the typo in the page title",
		"change the label from Name to Full Name",
	}
	for _, msg := range cases {
		t.Run(msg, func(t *testing.T) {
			got := ClassifyRequestComplexity(msg)
			if got != RequestComplexitySimple {
				t.Errorf("ClassifyRequestComplexity(%q) = %q, want simple", msg, got)
			}
		})
	}
}

func TestClassify_QuestionRequests_Chinese(t *testing.T) {
	cases := []string{
		"当前工作区有哪些表？",
		"什么是员工管理系统的最佳实践？",
		"哪些字段是必填的？",
		"怎么设置外键约束？",
		"如何优化查询性能？",
		"查询所有员工信息",
		"查看当前数据库结构",
		"展示orders表的数据",
		"列出所有用户",
	}
	for _, msg := range cases {
		t.Run(msg, func(t *testing.T) {
			got := ClassifyRequestComplexity(msg)
			if got != RequestComplexityQuestion {
				t.Errorf("ClassifyRequestComplexity(%q) = %q, want question", msg, got)
			}
		})
	}
}

func TestClassify_QuestionRequests_English(t *testing.T) {
	cases := []string{
		"what tables do I have?",
		"which fields are required?",
		"how do I set up foreign keys?",
		"what is the current database schema?",
		"list all the tables",
		"show me all users",
	}
	for _, msg := range cases {
		t.Run(msg, func(t *testing.T) {
			got := ClassifyRequestComplexity(msg)
			if got != RequestComplexityQuestion {
				t.Errorf("ClassifyRequestComplexity(%q) = %q, want question", msg, got)
			}
		})
	}
}

// ── Edge cases ────────────────────────────────────────────────────────────────

func TestClassify_EmptyMessage(t *testing.T) {
	got := ClassifyRequestComplexity("")
	if got != RequestComplexitySimple {
		t.Fatalf("empty message = %q, want simple", got)
	}
}

func TestClassify_WhitespaceOnly(t *testing.T) {
	got := ClassifyRequestComplexity("   ")
	if got != RequestComplexitySimple {
		t.Fatalf("whitespace-only = %q, want simple", got)
	}
}

func TestClassify_LongMessage_AlwaysComplex(t *testing.T) {
	// 30+ tokens should always be complex regardless of content
	long := "I want to add a status column to the users table and also rename the email field to user_email and then delete the old notes column from the orders table please"
	got := ClassifyRequestComplexity(long)
	if got != RequestComplexityComplex {
		t.Fatalf("long message = %q, want complex", got)
	}
}

func TestClassify_ComplexKeyword_Overrides_SimpleVerb(t *testing.T) {
	// Even if "修改" (simple verb) is present, "管理系统" makes it complex
	msg := "修改员工管理系统的首页标题"
	got := ClassifyRequestComplexity(msg)
	if got != RequestComplexityComplex {
		t.Fatalf("%q = %q, want complex (system keyword takes priority)", msg, got)
	}
}

func TestClassify_BuildVerb_Overrides_Question(t *testing.T) {
	// "创建" (build verb) prevents question classification
	msg := "创建一个查询员工信息的功能"
	got := ClassifyRequestComplexity(msg)
	// Should be simple or complex, NOT question, because "创建" is a build verb
	if got == RequestComplexityQuestion {
		t.Fatalf("%q = question, but it has a build verb (创建) so should not be question", msg)
	}
}

func TestClassify_MultiFeatureConjunction_Chinese(t *testing.T) {
	msg := "创建员工表并且同时还要添加部门管理功能"
	got := ClassifyRequestComplexity(msg)
	if got != RequestComplexityComplex {
		t.Fatalf("%q = %q, want complex (conjunction + build verb)", msg, got)
	}
}

func TestClassify_QuestionMark_ASCII(t *testing.T) {
	got := ClassifyRequestComplexity("is this table correct?")
	if got != RequestComplexityQuestion {
		t.Fatalf("ascii '?' question = %q, want question", got)
	}
}

func TestClassify_QuestionMark_Chinese(t *testing.T) {
	got := ClassifyRequestComplexity("这个表结构正确吗？")
	if got != RequestComplexityQuestion {
		t.Fatalf("chinese '？' question = %q, want question", got)
	}
}

// ── countTokens ───────────────────────────────────────────────────────────────

func TestCountTokens_PureEnglish(t *testing.T) {
	// "hello world test" = 3 words
	n := countTokens("hello world test")
	if n != 3 {
		t.Fatalf("countTokens('hello world test') = %d, want 3", n)
	}
}

func TestCountTokens_PureChinese(t *testing.T) {
	// "员工管理" = 4 Chinese chars = 4 tokens
	n := countTokens("员工管理")
	if n != 4 {
		t.Fatalf("countTokens('员工管理') = %d, want 4", n)
	}
}

func TestCountTokens_Mixed(t *testing.T) {
	// "给users表加一列" — "给"(1) + "users"(1) + "表加一列"(4) = 6
	n := countTokens("给users表加一列")
	if n != 6 {
		t.Fatalf("countTokens('给users表加一列') = %d, want 6", n)
	}
}

func TestCountTokens_Empty(t *testing.T) {
	if countTokens("") != 0 {
		t.Fatal("empty string should have 0 tokens")
	}
}

// ── Integration: complexity hint stored in session ────────────────────────────

func TestComplexityHint_StoredInSession(t *testing.T) {
	s := &AgentSession{}

	if s.GetComplexityHint() != "" {
		t.Fatal("hint should be empty initially")
	}

	s.SetComplexityHint(RequestComplexitySimple)
	if s.GetComplexityHint() != RequestComplexitySimple {
		t.Fatalf("hint = %q, want simple", s.GetComplexityHint())
	}
}

func TestComplexityHint_OncePerSession(t *testing.T) {
	// Simulate Run() behavior: only classify when hint is empty
	s := &AgentSession{}

	// First message: classify and store
	if s.GetComplexityHint() == "" {
		hint := ClassifyRequestComplexity("帮我创建员工管理系统")
		s.SetComplexityHint(hint)
	}
	if s.GetComplexityHint() != RequestComplexityComplex {
		t.Fatalf("after first message hint = %q, want complex", s.GetComplexityHint())
	}

	// Second message: hint already set, should NOT be overwritten
	previousHint := s.GetComplexityHint()
	if s.GetComplexityHint() == "" { // condition is false — this block won't run
		hint := ClassifyRequestComplexity("简单追问")
		s.SetComplexityHint(hint)
	}
	if s.GetComplexityHint() != previousHint {
		t.Fatal("hint should not be overwritten on subsequent messages")
	}
}

// ── Prompt section contains correct mode text ─────────────────────────────────

func TestPlanningGuide_SimpleHint_ContainsSkipQAInstruction(t *testing.T) {
	guide := buildPlanningConversationGuide(RequestComplexitySimple)
	if !contains(guide, "Skip the Q&A conversation entirely") {
		t.Fatal("simple hint guide should instruct LLM to skip Q&A")
	}
	if !contains(guide, "create_plan") {
		t.Fatal("simple hint guide should mention create_plan")
	}
	// Should NOT contain multi-turn Q&A instructions
	if contains(guide, "Step 2 — Ask Clarifying Questions") {
		t.Fatal("simple hint guide should NOT contain Q&A strategy steps")
	}
}

func TestPlanningGuide_QuestionHint_ContainsDirectAnswerInstruction(t *testing.T) {
	guide := buildPlanningConversationGuide(RequestComplexityQuestion)
	if !contains(guide, "Answer the question directly") {
		t.Fatal("question hint guide should instruct direct answer")
	}
	if !contains(guide, "Do NOT call create_plan") {
		t.Fatal("question hint guide should say not to call create_plan")
	}
}

func TestPlanningGuide_ComplexHint_ContainsQAStrategy(t *testing.T) {
	guide := buildPlanningConversationGuide(RequestComplexityComplex)
	if !contains(guide, "Step 2 — Ask Clarifying Questions") {
		t.Fatal("complex hint guide should contain Q&A strategy")
	}
	if !contains(guide, "3 conversation rounds") {
		t.Fatal("complex hint guide should mention 3-round limit")
	}
}

func TestPlanningGuide_NoHint_DefaultsToComplex(t *testing.T) {
	// Empty/unset hint should default to complex Q&A mode
	guide := buildPlanningConversationGuide("")
	if !contains(guide, "Step 2 — Ask Clarifying Questions") {
		t.Fatal("unset hint should default to complex Q&A mode")
	}
}

func TestPlanningGuide_AllVariants_ContainHardRules(t *testing.T) {
	hints := []RequestComplexity{
		RequestComplexityComplex,
		RequestComplexitySimple,
		RequestComplexityQuestion,
		"",
	}
	for _, h := range hints {
		guide := buildPlanningConversationGuide(h)
		if !contains(guide, "DO NOT call construction tools") {
			t.Errorf("hint=%q: guide should always contain hard rule about construction tools", h)
		}
		if !contains(guide, "Planning Conversation Phase (ACTIVE)") {
			t.Errorf("hint=%q: guide should always have section header", h)
		}
	}
}

// helper to avoid importing strings in test file
func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(substr) == 0 ||
		func() bool {
			for i := 0; i <= len(s)-len(substr); i++ {
				if s[i:i+len(substr)] == substr {
					return true
				}
			}
			return false
		}())
}
