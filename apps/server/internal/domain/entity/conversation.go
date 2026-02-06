package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Conversation 对话实体
type Conversation struct {
	ID          uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	UserID      uuid.UUID `gorm:"type:char(36);not null;index" json:"user_id"`
	WorkspaceID uuid.UUID `gorm:"type:char(36);not null;index" json:"workspace_id"`

	// 基础信息
	Title   string `gorm:"size:500;not null" json:"title"`
	Preview string `gorm:"size:500" json:"preview"` // 最后一条消息预览

	// AI 模型配置
	Model        string  `gorm:"size:50;default:'gpt-4'" json:"model"`
	SystemPrompt *string `gorm:"type:text" json:"system_prompt"`

	// AI 参数设置
	Temperature      *float64 `gorm:"type:decimal(3,2)" json:"temperature"`       // 0.0-2.0，默认 1.0
	MaxTokens        *int     `json:"max_tokens"`                                 // 最大生成 token 数
	TopP             *float64 `gorm:"type:decimal(3,2)" json:"top_p"`             // 0.0-1.0
	TopK             *int     `json:"top_k"`                                      // Top-K 采样
	FrequencyPenalty *float64 `gorm:"type:decimal(3,2)" json:"frequency_penalty"` // -2.0-2.0
	PresencePenalty  *float64 `gorm:"type:decimal(3,2)" json:"presence_penalty"`  // -2.0-2.0

	// 状态标记
	Starred  bool `gorm:"default:false;index" json:"starred"`
	Pinned   bool `gorm:"default:false;index" json:"pinned"`
	Archived bool `gorm:"default:false;index" json:"archived"`

	// 统计信息
	MessageCount int `gorm:"default:0" json:"message_count"`
	TokenUsage   int `gorm:"default:0" json:"token_usage"`

	// 文件夹
	FolderID *uuid.UUID `gorm:"type:char(36);index" json:"folder_id"`

	// 元数据 (JSON)
	Metadata JSON `gorm:"type:json" json:"metadata"`

	// 时间戳
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// 关联
	User      *User               `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Workspace *Workspace          `gorm:"foreignKey:WorkspaceID" json:"workspace,omitempty"`
	Folder    *ConversationFolder `gorm:"foreignKey:FolderID" json:"folder,omitempty"`
	Messages  []Message           `gorm:"foreignKey:ConversationID" json:"messages,omitempty"`
	Tags      []ConversationTag   `gorm:"foreignKey:ConversationID" json:"tags,omitempty"`
}

// TableName 表名
func (Conversation) TableName() string {
	return "what_reverse_conversations"
}

// BeforeCreate 创建前钩子
func (c *Conversation) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	if c.Model == "" {
		c.Model = "gpt-4"
	}
	return nil
}

// ConversationFolder 对话文件夹实体
type ConversationFolder struct {
	ID                uuid.UUID      `gorm:"type:char(36);primaryKey" json:"id"`
	UserID            uuid.UUID      `gorm:"type:char(36);not null;index" json:"user_id"`
	Name              string         `gorm:"size:100;not null" json:"name"`
	Icon              string         `gorm:"size:50;default:'📁'" json:"icon"`
	Color             string         `gorm:"size:20;default:'#3ECF8E'" json:"color"`
	ParentID          *uuid.UUID     `gorm:"type:char(36);index" json:"parent_id"`
	SortOrder         int            `gorm:"default:0" json:"sort_order"`
	ConversationCount int            `gorm:"-" json:"conversation_count"` // 计算字段
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
	DeletedAt         gorm.DeletedAt `gorm:"index" json:"-"`

	// 关联
	User          *User                `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Parent        *ConversationFolder  `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
	Children      []ConversationFolder `gorm:"foreignKey:ParentID" json:"children,omitempty"`
	Conversations []Conversation       `gorm:"foreignKey:FolderID" json:"conversations,omitempty"`
}

// TableName 表名
func (ConversationFolder) TableName() string {
	return "what_reverse_conversation_folders"
}

// BeforeCreate 创建前钩子
func (f *ConversationFolder) BeforeCreate(tx *gorm.DB) error {
	if f.ID == uuid.Nil {
		f.ID = uuid.New()
	}
	if f.Icon == "" {
		f.Icon = "📁"
	}
	if f.Color == "" {
		f.Color = "#3ECF8E"
	}
	return nil
}

// ConversationTag 对话标签关联实体
type ConversationTag struct {
	ID             uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	ConversationID uuid.UUID `gorm:"type:char(36);not null;index" json:"conversation_id"`
	TagName        string    `gorm:"size:50;not null;index" json:"tag_name"`
	CreatedAt      time.Time `json:"created_at"`
}

// TableName 表名
func (ConversationTag) TableName() string {
	return "what_reverse_conversation_tags"
}

// BeforeCreate 创建前钩子
func (t *ConversationTag) BeforeCreate(tx *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	return nil
}
