package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Execution 执行记录实体
type Execution struct {
	ID            uuid.UUID      `gorm:"type:char(36);primaryKey" json:"id"`
	WorkflowID    uuid.UUID      `gorm:"type:char(36);not null;index" json:"workflow_id"`
	UserID        uuid.UUID      `gorm:"type:char(36);not null;index" json:"user_id"`
	WorkspaceID   uuid.UUID      `gorm:"type:char(36);index" json:"workspace_id"`

	// 执行状态
	Status        string         `gorm:"size:20;not null;default:'pending'" json:"status"`

	// 触发信息
	TriggerType   string         `gorm:"size:50;not null" json:"trigger_type"`
	TriggerData   JSON           `gorm:"type:json" json:"trigger_data"`

	// 执行数据
	Inputs        JSON           `gorm:"type:json" json:"inputs"`
	Outputs       JSON           `gorm:"type:json" json:"outputs"`
	Context       JSON           `gorm:"type:json" json:"context"`

	// 性能指标
	StartedAt     *time.Time     `json:"started_at"`
	CompletedAt   *time.Time     `json:"completed_at"`
	DurationMs    *int           `json:"duration_ms"`

	// 错误信息
	ErrorMessage  *string        `gorm:"type:text" json:"error_message"`
	ErrorNodeID   *string        `gorm:"size:100" json:"error_node_id"`

	// 资源消耗
	TokenUsage    JSON           `gorm:"type:json" json:"token_usage"`

	// 时间戳
	CreatedAt     time.Time      `json:"created_at"`

	// 关联
	Workflow      *Workflow      `gorm:"foreignKey:WorkflowID" json:"workflow,omitempty"`
	User          *User          `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Workspace     *Workspace     `gorm:"foreignKey:WorkspaceID" json:"workspace,omitempty"`
	NodeLogs      []NodeLog      `gorm:"foreignKey:ExecutionID" json:"node_logs,omitempty"`
}

// TableName 表名
func (Execution) TableName() string {
	return "what_reverse_executions"
}

// BeforeCreate 创建前钩子
func (e *Execution) BeforeCreate(tx *gorm.DB) error {
	if e.ID == uuid.Nil {
		e.ID = uuid.New()
	}
	return nil
}

// NodeLog 节点执行日志
type NodeLog struct {
	ID            uuid.UUID      `gorm:"type:char(36);primaryKey" json:"id"`
	ExecutionID   uuid.UUID      `gorm:"type:char(36);not null;index" json:"execution_id"`
	NodeID        string         `gorm:"size:100;not null;index" json:"node_id"`
	NodeType      string         `gorm:"size:50;not null" json:"node_type"`

	// 执行数据
	Status        string         `gorm:"size:20;not null" json:"status"`
	Inputs        JSON           `gorm:"type:json" json:"inputs"`
	Outputs       JSON           `gorm:"type:json" json:"outputs"`

	// 时间
	StartedAt     *time.Time     `json:"started_at"`
	CompletedAt   *time.Time     `json:"completed_at"`
	DurationMs    *int           `json:"duration_ms"`

	// 错误
	ErrorMessage  *string        `gorm:"type:text" json:"error_message"`

	// 日志
	Logs          JSON           `gorm:"type:json" json:"logs"`

	// 时间戳
	CreatedAt     time.Time      `json:"created_at"`
}

// TableName 表名
func (NodeLog) TableName() string {
	return "what_reverse_node_logs"
}

// BeforeCreate 创建前钩子
func (n *NodeLog) BeforeCreate(tx *gorm.DB) error {
	if n.ID == uuid.Nil {
		n.ID = uuid.New()
	}
	return nil
}
