package service

import (
	"encoding/json"
	"fmt"
	"sync"
)

// SkillCategory Skill 分类
type SkillCategory string

const (
	SkillCategoryDataModeling  SkillCategory = "data_modeling"
	SkillCategoryUIGeneration  SkillCategory = "ui_generation"
	SkillCategoryBusinessLogic SkillCategory = "business_logic"
	SkillCategoryIntegration   SkillCategory = "integration"
)

// Skill AI Agent 技能定义
type Skill struct {
	ID                   string          `json:"id"`
	Name                 string          `json:"name"`
	Description          string          `json:"description"`
	Category             SkillCategory   `json:"category"`
	Icon                 string          `json:"icon"`
	Tools                []AgentTool     `json:"-"`
	ToolNames            []string        `json:"tool_names"`
	SystemPromptAddition string          `json:"system_prompt_addition"`
	ConfigSchema         json.RawMessage `json:"config_schema,omitempty"`
	Enabled              bool            `json:"enabled"`
	Builtin              bool            `json:"builtin"`
}

// SkillMeta Skill 元信息（前端展示用）
type SkillMeta struct {
	ID                   string        `json:"id"`
	Name                 string        `json:"name"`
	Description          string        `json:"description"`
	Category             SkillCategory `json:"category"`
	Icon                 string        `json:"icon"`
	ToolCount            int           `json:"tool_count"`
	ToolNames            []string      `json:"tool_names"`
	SystemPromptAddition string        `json:"system_prompt_addition,omitempty"`
	Enabled              bool          `json:"enabled"`
	Builtin              bool          `json:"builtin"`
}

// ToMeta 转换为元信息
func (s *Skill) ToMeta() SkillMeta {
	return SkillMeta{
		ID:                   s.ID,
		Name:                 s.Name,
		Description:          s.Description,
		Category:             s.Category,
		Icon:                 s.Icon,
		ToolCount:            len(s.Tools),
		ToolNames:            s.ToolNames,
		SystemPromptAddition: s.SystemPromptAddition,
		Enabled:              s.Enabled,
		Builtin:              s.Builtin,
	}
}

// SkillRegistry Skill 注册表
type SkillRegistry struct {
	mu     sync.RWMutex
	skills map[string]*Skill
}

// NewSkillRegistry 创建 Skill 注册表
func NewSkillRegistry() *SkillRegistry {
	return &SkillRegistry{
		skills: make(map[string]*Skill),
	}
}

// Register 注册 Skill
func (r *SkillRegistry) Register(skill *Skill) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, exists := r.skills[skill.ID]; exists {
		return fmt.Errorf("skill %q already registered", skill.ID)
	}
	// Build tool names list
	skill.ToolNames = make([]string, 0, len(skill.Tools))
	for _, t := range skill.Tools {
		skill.ToolNames = append(skill.ToolNames, t.Name())
	}
	r.skills[skill.ID] = skill
	return nil
}

// Get 获取 Skill
func (r *SkillRegistry) Get(id string) (*Skill, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	s, ok := r.skills[id]
	return s, ok
}

// ListAll 列出所有 Skills
func (r *SkillRegistry) ListAll() []SkillMeta {
	r.mu.RLock()
	defer r.mu.RUnlock()
	result := make([]SkillMeta, 0, len(r.skills))
	for _, s := range r.skills {
		result = append(result, s.ToMeta())
	}
	return result
}

// ListByCategory 按分类列出 Skills
func (r *SkillRegistry) ListByCategory(category SkillCategory) []SkillMeta {
	r.mu.RLock()
	defer r.mu.RUnlock()
	result := make([]SkillMeta, 0)
	for _, s := range r.skills {
		if s.Category == category {
			result = append(result, s.ToMeta())
		}
	}
	return result
}

// ListEnabled 列出已启用的 Skills
func (r *SkillRegistry) ListEnabled() []*Skill {
	r.mu.RLock()
	defer r.mu.RUnlock()
	result := make([]*Skill, 0)
	for _, s := range r.skills {
		if s.Enabled {
			result = append(result, s)
		}
	}
	return result
}

// SetEnabled 设置 Skill 启用状态
func (r *SkillRegistry) SetEnabled(id string, enabled bool) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	s, ok := r.skills[id]
	if !ok {
		return fmt.Errorf("skill %q not found", id)
	}
	s.Enabled = enabled
	return nil
}

// LoadToolsIntoRegistry 将已启用 Skills 的工具加载到 AgentToolRegistry
func (r *SkillRegistry) LoadToolsIntoRegistry(toolRegistry *AgentToolRegistry) int {
	r.mu.RLock()
	defer r.mu.RUnlock()
	loaded := 0
	for _, skill := range r.skills {
		if !skill.Enabled {
			continue
		}
		for _, tool := range skill.Tools {
			if _, exists := toolRegistry.Get(tool.Name()); !exists {
				if err := toolRegistry.Register(tool); err == nil {
					loaded++
				}
			}
		}
	}
	return loaded
}

// BuildSystemPrompt 构建已启用 Skills 的 System Prompt 附加内容
func (r *SkillRegistry) BuildSystemPrompt() string {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var prompt string
	for _, skill := range r.skills {
		if !skill.Enabled || skill.SystemPromptAddition == "" {
			continue
		}
		prompt += "\n\n## " + skill.Name + "\n" + skill.SystemPromptAddition
	}
	return prompt
}

// RegisterCustom 注册用户自定义 Skill（仅包含 SystemPrompt，无内置 Tools）
func (r *SkillRegistry) RegisterCustom(id, name, description, category, icon, systemPrompt string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, exists := r.skills[id]; exists {
		return fmt.Errorf("skill %q already registered", id)
	}
	cat := SkillCategory(category)
	if cat == "" {
		cat = SkillCategoryIntegration
	}
	if icon == "" {
		icon = "Sparkles"
	}
	r.skills[id] = &Skill{
		ID:                   id,
		Name:                 name,
		Description:          description,
		Category:             cat,
		Icon:                 icon,
		Builtin:              false,
		Enabled:              true,
		Tools:                nil,
		ToolNames:            []string{},
		SystemPromptAddition: systemPrompt,
	}
	return nil
}

// UpdateCustom 更新自定义 Skill
func (r *SkillRegistry) UpdateCustom(id, name, description, category, icon, systemPrompt string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	s, ok := r.skills[id]
	if !ok {
		return fmt.Errorf("skill %q not found", id)
	}
	if s.Builtin {
		return fmt.Errorf("cannot modify built-in skill %q", id)
	}
	if name != "" {
		s.Name = name
	}
	if description != "" {
		s.Description = description
	}
	if category != "" {
		s.Category = SkillCategory(category)
	}
	if icon != "" {
		s.Icon = icon
	}
	if systemPrompt != "" {
		s.SystemPromptAddition = systemPrompt
	}
	return nil
}

// Delete 删除自定义 Skill（不允许删除 Built-in）
func (r *SkillRegistry) Delete(id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	s, ok := r.skills[id]
	if !ok {
		return fmt.Errorf("skill %q not found", id)
	}
	if s.Builtin {
		return fmt.Errorf("cannot delete built-in skill %q", id)
	}
	delete(r.skills, id)
	return nil
}

// Count 返回已注册 Skill 数量
func (r *SkillRegistry) Count() int {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return len(r.skills)
}
