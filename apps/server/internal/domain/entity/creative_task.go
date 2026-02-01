package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// CreativeTaskStatus 任务状态
type CreativeTaskStatus string

const (
	CreativeTaskStatusPending    CreativeTaskStatus = "pending"
	CreativeTaskStatusProcessing CreativeTaskStatus = "processing"
	CreativeTaskStatusCompleted  CreativeTaskStatus = "completed"
	CreativeTaskStatusFailed     CreativeTaskStatus = "failed"
	CreativeTaskStatusCancelled  CreativeTaskStatus = "cancelled"
)

// CreativeSectionStatus 章节状态
type CreativeSectionStatus string

const (
	CreativeSectionStatusPending    CreativeSectionStatus = "pending"
	CreativeSectionStatusGenerating CreativeSectionStatus = "generating"
	CreativeSectionStatusCompleted  CreativeSectionStatus = "completed"
	CreativeSectionStatusFailed     CreativeSectionStatus = "failed"
	CreativeSectionStatusSkipped    CreativeSectionStatus = "skipped"
)

// CreativeTask AI 创意助手任务实体
type CreativeTask struct {
	ID         uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	UserID     uuid.UUID `gorm:"type:char(36);not null;index" json:"user_id"`
	TemplateID *uuid.UUID `gorm:"type:char(36);index" json:"template_id"`

	// 输入数据
	Inputs JSON `gorm:"type:json;not null" json:"inputs"`

	// 任务状态
	Status       CreativeTaskStatus `gorm:"type:varchar(20);default:'pending';index" json:"status"`
	ErrorMessage *string            `gorm:"type:text" json:"error_message"`

	// 章节状态 (JSONB: {"section_id": {"status": "completed", "startedAt": "...", "completedAt": "..."}})
	Sections       JSON    `gorm:"type:json" json:"sections"`
	CurrentSection *string `gorm:"size:100" json:"current_section"`

	// 搜索缓存 (联网搜索结果缓存)
	SearchCache JSON `gorm:"type:json" json:"search_cache"`

	// 最终输出
	OutputMarkdown *string `gorm:"type:text" json:"output_markdown"`
	OutputMetadata JSON    `gorm:"type:json" json:"output_metadata"`

	// Token 消耗统计
	TokenUsage JSON `gorm:"type:json" json:"token_usage"`

	// 进度信息
	Progress          int `gorm:"default:0" json:"progress"`
	TotalSections     int `gorm:"default:0" json:"total_sections"`
	CompletedSections int `gorm:"default:0" json:"completed_sections"`

	// 时间戳
	StartedAt   *time.Time `json:"started_at"`
	CompletedAt *time.Time `json:"completed_at"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`

	// 关联
	User     *User             `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Template *CreativeTemplate `gorm:"foreignKey:TemplateID" json:"template,omitempty"`
}

// TableName 表名
func (CreativeTask) TableName() string {
	return "what_reverse_creative_tasks"
}

// BeforeCreate 创建前钩子
func (t *CreativeTask) BeforeCreate(tx *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	if t.Sections == nil {
		t.Sections = JSON{}
	}
	if t.TokenUsage == nil {
		t.TokenUsage = JSON{
			"prompt_tokens":     0,
			"completion_tokens": 0,
			"total_tokens":      0,
		}
	}
	return nil
}

// SectionState 章节状态结构
type SectionState struct {
	Status       CreativeSectionStatus `json:"status"`
	StartedAt    *time.Time            `json:"startedAt,omitempty"`
	CompletedAt  *time.Time            `json:"completedAt,omitempty"`
	ErrorMessage *string               `json:"errorMessage,omitempty"`
	TokenUsage   *TokenUsageInfo       `json:"tokenUsage,omitempty"`
}

// TokenUsageInfo Token 使用信息
type TokenUsageInfo struct {
	PromptTokens     int `json:"prompt_tokens"`
	CompletionTokens int `json:"completion_tokens"`
	TotalTokens      int `json:"total_tokens"`
}

// GetSectionStates 获取所有章节状态
func (t *CreativeTask) GetSectionStates() map[string]SectionState {
	states := make(map[string]SectionState)
	if t.Sections != nil {
		for k, v := range t.Sections {
			if stateMap, ok := v.(map[string]interface{}); ok {
				state := SectionState{}
				if status, ok := stateMap["status"].(string); ok {
					state.Status = CreativeSectionStatus(status)
				}
				// 可以添加更多字段解析...
				states[k] = state
			}
		}
	}
	return states
}

// UpdateSectionState 更新章节状态
func (t *CreativeTask) UpdateSectionState(sectionID string, state SectionState) {
	if t.Sections == nil {
		t.Sections = JSON{}
	}
	t.Sections[sectionID] = map[string]interface{}{
		"status":       string(state.Status),
		"startedAt":    state.StartedAt,
		"completedAt":  state.CompletedAt,
		"errorMessage": state.ErrorMessage,
		"tokenUsage":   state.TokenUsage,
	}
}

// GetTotalTokenUsage 获取总 Token 使用量
func (t *CreativeTask) GetTotalTokenUsage() TokenUsageInfo {
	usage := TokenUsageInfo{}
	if t.TokenUsage != nil {
		if pt, ok := t.TokenUsage["prompt_tokens"].(float64); ok {
			usage.PromptTokens = int(pt)
		}
		if ct, ok := t.TokenUsage["completion_tokens"].(float64); ok {
			usage.CompletionTokens = int(ct)
		}
		if tt, ok := t.TokenUsage["total_tokens"].(float64); ok {
			usage.TotalTokens = int(tt)
		}
	}
	return usage
}

// AddTokenUsage 添加 Token 使用量
func (t *CreativeTask) AddTokenUsage(promptTokens, completionTokens int) {
	if t.TokenUsage == nil {
		t.TokenUsage = JSON{
			"prompt_tokens":     0,
			"completion_tokens": 0,
			"total_tokens":      0,
		}
	}
	
	currentPrompt := 0
	currentCompletion := 0
	
	if pt, ok := t.TokenUsage["prompt_tokens"].(float64); ok {
		currentPrompt = int(pt)
	}
	if ct, ok := t.TokenUsage["completion_tokens"].(float64); ok {
		currentCompletion = int(ct)
	}
	
	t.TokenUsage["prompt_tokens"] = currentPrompt + promptTokens
	t.TokenUsage["completion_tokens"] = currentCompletion + completionTokens
	t.TokenUsage["total_tokens"] = currentPrompt + promptTokens + currentCompletion + completionTokens
}

// CalculateProgress 计算进度百分比
func (t *CreativeTask) CalculateProgress() int {
	if t.TotalSections == 0 {
		return 0
	}
	return (t.CompletedSections * 100) / t.TotalSections
}
