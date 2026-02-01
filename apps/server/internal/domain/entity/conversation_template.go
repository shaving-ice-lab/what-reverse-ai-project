package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ConversationTemplate 对话模板实体
type ConversationTemplate struct {
	ID          uuid.UUID      `gorm:"type:char(36);primaryKey" json:"id"`
	UserID      uuid.UUID      `gorm:"type:char(36);not null;index" json:"user_id"`
	
	// 基础信息
	Name        string         `gorm:"size:200;not null" json:"name"`
	Description string         `gorm:"size:500" json:"description"`
	Icon        string         `gorm:"size:50;default:'📝'" json:"icon"`
	
	// 模板配置
	Model        string         `gorm:"size:50;default:'gpt-4'" json:"model"`
	SystemPrompt *string        `gorm:"type:text" json:"system_prompt"`
	
	// AI 参数
	Temperature      *float64   `gorm:"type:decimal(3,2)" json:"temperature"`
	MaxTokens        *int       `json:"max_tokens"`
	TopP             *float64   `gorm:"type:decimal(3,2)" json:"top_p"`
	TopK             *int       `json:"top_k"`
	FrequencyPenalty *float64   `gorm:"type:decimal(3,2)" json:"frequency_penalty"`
	PresencePenalty  *float64   `gorm:"type:decimal(3,2)" json:"presence_penalty"`
	
	// 初始消息（JSON 数组）
	InitialMessages JSON       `gorm:"type:json" json:"initial_messages"`
	
	// 分类标签（JSON 数组）
	Tags         JSON           `gorm:"type:json" json:"tags"`
	
	// 状态
	IsPublic     bool           `gorm:"default:false" json:"is_public"`     // 是否公开
	IsSystem     bool           `gorm:"default:false" json:"is_system"`     // 是否系统预设
	UsageCount   int            `gorm:"default:0" json:"usage_count"`       // 使用次数
	
	// 时间戳
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
	
	// 关联
	User         *User          `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// TableName 表名
func (ConversationTemplate) TableName() string {
	return "what_reverse_conversation_templates"
}

// BeforeCreate 创建前钩子
func (t *ConversationTemplate) BeforeCreate(tx *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	if t.Model == "" {
		t.Model = "gpt-4"
	}
	if t.Icon == "" {
		t.Icon = "📝"
	}
	return nil
}

// TemplateInitialMessage 模板初始消息
type TemplateInitialMessage struct {
	Role    string `json:"role"`    // user, assistant, system
	Content string `json:"content"`
}
