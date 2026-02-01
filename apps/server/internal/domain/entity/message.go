package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// MessageRole 消息角色
type MessageRole string

const (
	MessageRoleUser      MessageRole = "user"
	MessageRoleAssistant MessageRole = "assistant"
	MessageRoleSystem    MessageRole = "system"
)

// Message 消息实体
type Message struct {
	ID             uuid.UUID      `gorm:"type:char(36);primaryKey" json:"id"`
	ConversationID uuid.UUID      `gorm:"type:char(36);not null;index" json:"conversation_id"`
	
	// 消息内容
	Role           MessageRole    `gorm:"size:20;not null" json:"role"`
	Content        string         `gorm:"type:longtext;not null" json:"content"`
	
	// AI 相关
	Model          string         `gorm:"size:50" json:"model"`
	TokenUsage     int            `gorm:"default:0" json:"token_usage"`
	PromptTokens   int            `gorm:"default:0" json:"prompt_tokens"`
	CompletionTokens int          `gorm:"default:0" json:"completion_tokens"`
	
	// 附件 (JSON 数组)
	Attachments    JSON           `gorm:"type:json" json:"attachments"`
	
	// 元数据 (JSON)
	Metadata       JSON           `gorm:"type:json" json:"metadata"`
	
	// 父消息 (用于编辑历史/分支对话)
	ParentID       *uuid.UUID     `gorm:"type:char(36);index" json:"parent_id"`
	
	// 用户反馈
	Liked          bool           `gorm:"default:false" json:"liked"`
	Disliked       bool           `gorm:"default:false" json:"disliked"`
	Bookmarked     bool           `gorm:"default:false" json:"bookmarked"`
	
	// 时间戳
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`

	// 关联
	Conversation   *Conversation  `gorm:"foreignKey:ConversationID" json:"conversation,omitempty"`
	Parent         *Message       `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
}

// TableName 表名
func (Message) TableName() string {
	return "what_reverse_messages"
}

// BeforeCreate 创建前钩子
func (m *Message) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

// MessageAttachment 消息附件结构
type MessageAttachment struct {
	ID       string `json:"id"`
	Type     string `json:"type"`     // image, file, code
	Name     string `json:"name"`
	URL      string `json:"url"`
	Size     int64  `json:"size"`
	MimeType string `json:"mime_type"`
}
