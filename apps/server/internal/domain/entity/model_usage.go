package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ModelUsageEvent 模型用量事件
type ModelUsageEvent struct {
	ID          uuid.UUID  `gorm:"type:char(36);primaryKey" json:"id"`
	WorkspaceID uuid.UUID  `gorm:"type:char(36);not null;index" json:"workspace_id"`
	UserID      uuid.UUID  `gorm:"type:char(36);not null;index" json:"user_id"`
	ExecutionID *uuid.UUID `gorm:"type:char(36);index" json:"execution_id,omitempty"`
	WorkflowID  *uuid.UUID `gorm:"type:char(36);index" json:"workflow_id,omitempty"`
	NodeID      *string    `gorm:"size:120" json:"node_id,omitempty"`

	Provider string `gorm:"size:50;not null" json:"provider"`
	Model    string `gorm:"size:100;not null" json:"model"`
	Strategy string `gorm:"size:30;default:'quality'" json:"strategy"`

	PromptTokens     int `gorm:"default:0" json:"prompt_tokens"`
	CompletionTokens int `gorm:"default:0" json:"completion_tokens"`
	TotalTokens      int `gorm:"default:0" json:"total_tokens"`

	CostAmount float64 `gorm:"type:decimal(12,6);default:0" json:"cost_amount"`
	Currency   string  `gorm:"size:10;default:'USD'" json:"currency"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	Workspace *Workspace `gorm:"foreignKey:WorkspaceID" json:"workspace,omitempty"`
	User      *User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// TableName 表名
func (ModelUsageEvent) TableName() string {
	return "what_reverse_model_usage_events"
}

// BeforeCreate 创建前钩子
func (e *ModelUsageEvent) BeforeCreate(tx *gorm.DB) error {
	if e.ID == uuid.Nil {
		e.ID = uuid.New()
	}
	return nil
}
