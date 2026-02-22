package service

import (
	"fmt"
	"sort"
	"sync"
)

// PersonaCategory Persona 分类
type PersonaCategory string

const (
	PersonaCategoryBuilder    PersonaCategory = "builder"
	PersonaCategoryConsultant PersonaCategory = "consultant"
	PersonaCategoryStaff      PersonaCategory = "staff"
	PersonaCategoryCustom     PersonaCategory = "custom"
)

// PersonaSuggestion Persona 快捷建议
type PersonaSuggestion struct {
	Label  string `json:"label"`
	Prompt string `json:"prompt"`
}

// Persona AI 角色定义
type Persona struct {
	ID           string              `json:"id"`
	Name         string              `json:"name"`
	Description  string              `json:"description"`
	Icon         string              `json:"icon"`
	Color        string              `json:"color"`
	SystemPrompt string              `json:"system_prompt"`
	ToolFilter   []string            `json:"tool_filter"`
	Suggestions  []PersonaSuggestion `json:"suggestions"`
	Category     PersonaCategory     `json:"category"`
	Builtin      bool                `json:"builtin"`
	Enabled      bool                `json:"enabled"`
}

// PersonaMeta Persona 元信息（前端展示用）
type PersonaMeta struct {
	ID          string              `json:"id"`
	Name        string              `json:"name"`
	Description string              `json:"description"`
	Icon        string              `json:"icon"`
	Color       string              `json:"color"`
	Category    PersonaCategory     `json:"category"`
	Suggestions []PersonaSuggestion `json:"suggestions"`
	Builtin     bool                `json:"builtin"`
	Enabled     bool                `json:"enabled"`
}

// ToMeta 转换为元信息
func (p *Persona) ToMeta() PersonaMeta {
	return PersonaMeta{
		ID:          p.ID,
		Name:        p.Name,
		Description: p.Description,
		Icon:        p.Icon,
		Color:       p.Color,
		Category:    p.Category,
		Suggestions: p.Suggestions,
		Builtin:     p.Builtin,
		Enabled:     p.Enabled,
	}
}

// PersonaRegistry Persona 注册表
type PersonaRegistry struct {
	mu       sync.RWMutex
	personas map[string]*Persona
}

// NewPersonaRegistry 创建 Persona 注册表
func NewPersonaRegistry() *PersonaRegistry {
	return &PersonaRegistry{
		personas: make(map[string]*Persona),
	}
}

// Register 注册 Persona
func (r *PersonaRegistry) Register(persona *Persona) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, exists := r.personas[persona.ID]; exists {
		return fmt.Errorf("persona %q already registered", persona.ID)
	}
	r.personas[persona.ID] = persona
	return nil
}

// Get 获取 Persona
func (r *PersonaRegistry) Get(id string) (*Persona, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	p, ok := r.personas[id]
	return p, ok
}

// Unregister removes a persona by ID (used for temporary sub-agent personas)
func (r *PersonaRegistry) Unregister(id string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.personas, id)
}

// ListAll 列出所有 Personas（按 category + id 排序，保证顺序确定性）
func (r *PersonaRegistry) ListAll() []PersonaMeta {
	r.mu.RLock()
	defer r.mu.RUnlock()
	result := make([]PersonaMeta, 0, len(r.personas))
	for _, p := range r.personas {
		if p.Enabled {
			result = append(result, p.ToMeta())
		}
	}
	sort.Slice(result, func(i, j int) bool {
		if result[i].Category != result[j].Category {
			return result[i].Category < result[j].Category
		}
		return result[i].ID < result[j].ID
	})
	return result
}

// RegisterCustom 注册用户自定义 Persona
func (r *PersonaRegistry) RegisterCustom(id, name, description, icon, color, systemPrompt string, suggestions []PersonaSuggestion) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, exists := r.personas[id]; exists {
		return fmt.Errorf("persona %q already registered", id)
	}
	if icon == "" {
		icon = "Bot"
	}
	if color == "" {
		color = "violet"
	}
	r.personas[id] = &Persona{
		ID:           id,
		Name:         name,
		Description:  description,
		Icon:         icon,
		Color:        color,
		SystemPrompt: systemPrompt,
		Suggestions:  suggestions,
		Category:     PersonaCategoryCustom,
		Builtin:      false,
		Enabled:      true,
	}
	return nil
}

// UpdateCustom 更新自定义 Persona
func (r *PersonaRegistry) UpdateCustom(id, name, description, icon, color, systemPrompt string, suggestions []PersonaSuggestion) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	p, ok := r.personas[id]
	if !ok {
		return fmt.Errorf("persona %q not found", id)
	}
	if p.Builtin {
		return fmt.Errorf("cannot modify built-in persona %q", id)
	}
	if name != "" {
		p.Name = name
	}
	if description != "" {
		p.Description = description
	}
	if icon != "" {
		p.Icon = icon
	}
	if color != "" {
		p.Color = color
	}
	if systemPrompt != "" {
		p.SystemPrompt = systemPrompt
	}
	if suggestions != nil {
		p.Suggestions = suggestions
	}
	return nil
}

// Delete 删除自定义 Persona
func (r *PersonaRegistry) Delete(id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	p, ok := r.personas[id]
	if !ok {
		return fmt.Errorf("persona %q not found", id)
	}
	if p.Builtin {
		return fmt.Errorf("cannot delete built-in persona %q", id)
	}
	delete(r.personas, id)
	return nil
}

// Count 返回 Persona 数量
func (r *PersonaRegistry) Count() int {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return len(r.personas)
}

// ========== Built-in Personas ==========

// RegisterBuiltinPersonas 注册内置 Persona
func RegisterBuiltinPersonas(registry *PersonaRegistry) {
	_ = registry.Register(NewWebCreatorPersona())
	_ = registry.Register(NewCompanyConsultantPersona())
	_ = registry.Register(NewAIStaffPersona())
}

// NewWebCreatorPersona 网页创建者
func NewWebCreatorPersona() *Persona {
	return &Persona{
		ID:          "web_creator",
		Name:        "Web Creator",
		Description: "Design and build web applications with database, UI pages, and business logic",
		Icon:        "Globe",
		Color:       "blue",
		Category:    PersonaCategoryBuilder,
		Builtin:     true,
		Enabled:     true,
		ToolFilter:  nil, // all tools available
		Suggestions: []PersonaSuggestion{
			{Label: "🚀 Full App", Prompt: "Build a complete CRUD application with a dashboard showing stats, data tables for managing records, and forms to add new entries."},
			{Label: "🗄️ Database + Data", Prompt: "Create database tables with proper relationships and insert sample data so I can see my app working immediately."},
			{Label: "🎨 Dashboard UI", Prompt: "Design a multi-page UI with stats cards, charts, data tables, and forms. Make it look professional and modern."},
			{Label: "➕ Add Feature", Prompt: "Add a new table to my existing database and generate a management page with search, pagination, and inline editing."},
		},
		SystemPrompt: "", // empty → engine uses defaultWebCreatorFullPrompt with full AppSchema v2.0 spec
	}
}

// NewCompanyConsultantPersona 公司顾问
func NewCompanyConsultantPersona() *Persona {
	return &Persona{
		ID:          "company_consultant",
		Name:        "Company Consultant",
		Description: "Analyze business data, provide insights, and offer strategic recommendations",
		Icon:        "Briefcase",
		Color:       "amber",
		Category:    PersonaCategoryConsultant,
		Builtin:     true,
		Enabled:     true,
		ToolFilter:  []string{"query_data", "get_workspace_info", "get_ui_schema"},
		Suggestions: []PersonaSuggestion{
			{Label: "📊 Data Analysis", Prompt: "Analyze the data in my database and give me a summary of key metrics, trends, and any anomalies you find."},
			{Label: "💡 Business Insights", Prompt: "Based on my current data, what business insights can you provide? What areas need improvement?"},
			{Label: "📈 Growth Strategy", Prompt: "Review my data and suggest a growth strategy. What metrics should I focus on?"},
			{Label: "🔍 Health Check", Prompt: "Perform a health check on my data: are there any data quality issues, missing records, or inconsistencies?"},
		},
		SystemPrompt: companyConsultantSystemPrompt,
	}
}

// NewAIStaffPersona AI 员工
func NewAIStaffPersona() *Persona {
	return &Persona{
		ID:          "ai_staff",
		Name:        "AI Staff",
		Description: "Handle daily data entry, record updates, and routine data maintenance tasks",
		Icon:        "UserCog",
		Color:       "green",
		Category:    PersonaCategoryStaff,
		Builtin:     true,
		Enabled:     true,
		ToolFilter:  []string{"query_data", "insert_data", "update_data", "delete_data", "get_workspace_info"},
		Suggestions: []PersonaSuggestion{
			{Label: "📝 Enter Records", Prompt: "I need to add new records to my database. Guide me through the data entry process for the available tables."},
			{Label: "✏️ Update Records", Prompt: "Help me update existing records. Show me the current data and let me specify what needs to change."},
			{Label: "🧹 Data Cleanup", Prompt: "Review my data for duplicates, incomplete records, or outdated entries that need to be cleaned up."},
			{Label: "📋 Status Report", Prompt: "Give me a status report: how many records are in each table, recent changes, and any pending items."},
		},
		SystemPrompt: aiStaffSystemPrompt,
	}
}

// ========== System Prompts ==========

const companyConsultantSystemPrompt = `You are a **Company Consultant** AI assistant specialized in business analysis and strategic advice.
You can query the workspace database to analyze data, identify trends, and provide actionable insights.

IMPORTANT RULES:
1. You are READ-ONLY: you can query data but NEVER create, modify, or delete tables or records.
2. Always start by examining the workspace's database structure to understand the data model.
3. Use SQL queries to extract meaningful statistics and patterns.
4. Present data-driven insights with clear explanations.
5. Offer concrete, actionable recommendations based on the data.
6. When presenting numbers, use appropriate formatting (percentages, comparisons, trends).
7. Structure your analysis clearly: Findings → Insights → Recommendations.

You MUST respond with either:
- A tool call (function_call) to query data for analysis
- A plain text message with your analysis and recommendations`

const aiStaffSystemPrompt = `You are an **AI Staff** assistant that handles daily data operations and maintenance tasks.
You can query, insert, update, and delete records in the workspace database.

IMPORTANT RULES:
1. You can manage DATA (insert, update, delete records) but NEVER modify the database STRUCTURE (no create/alter/drop tables).
2. Always confirm what the user wants before making changes.
3. Before updating or deleting, query the current data first to verify the target records.
4. After making changes, query the data again to confirm the operation was successful.
5. For bulk operations, summarize what will be changed before proceeding.
6. Keep a clear log of all changes made in your responses.
7. Be careful with delete operations — confirm with the user before deleting.

You MUST respond with either:
- A tool call (function_call) to manage data
- A plain text message summarizing completed work or asking for clarification`
