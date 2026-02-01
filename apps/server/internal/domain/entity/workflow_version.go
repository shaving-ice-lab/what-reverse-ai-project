package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// WorkflowVersion 工作流版本实体
type WorkflowVersion struct {
	ID          uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	WorkflowID  uuid.UUID `gorm:"type:char(36);not null;index" json:"workflow_id"`
	Version     int       `gorm:"not null" json:"version"`

	// 快照数据
	Name        string  `gorm:"size:200;not null" json:"name"`
	Description *string `gorm:"type:text" json:"description"`
	Definition  JSON    `gorm:"type:json;not null" json:"definition"`
	Variables   JSON    `gorm:"type:json" json:"variables"`

	// 版本信息
	ChangeLog  string `gorm:"type:text" json:"change_log"`
	ChangeType string `gorm:"size:50;default:'update'" json:"change_type"` // create, update, restore, manual

	// 创建信息
	CreatedBy uuid.UUID `gorm:"type:char(36);not null" json:"created_by"`
	CreatedAt time.Time `json:"created_at"`

	// 统计信息
	NodeCount int `gorm:"default:0" json:"node_count"`
	EdgeCount int `gorm:"default:0" json:"edge_count"`

	// 关联
	Workflow *Workflow `gorm:"foreignKey:WorkflowID" json:"workflow,omitempty"`
	Creator  *User     `gorm:"foreignKey:CreatedBy" json:"creator,omitempty"`
}

// TableName 表名
func (WorkflowVersion) TableName() string {
	return "what_reverse_workflow_versions"
}

// BeforeCreate 创建前钩子
func (v *WorkflowVersion) BeforeCreate(tx *gorm.DB) error {
	if v.ID == uuid.Nil {
		v.ID = uuid.New()
	}
	// 计算节点和边的数量
	if v.Definition != nil {
		if nodes, ok := v.Definition["nodes"].([]interface{}); ok {
			v.NodeCount = len(nodes)
		}
		if edges, ok := v.Definition["edges"].([]interface{}); ok {
			v.EdgeCount = len(edges)
		}
	}
	if v.ChangeType == "" {
		v.ChangeType = "update"
	}
	return nil
}

// VersionDiff 版本差异
type VersionDiff struct {
	V1               int                      `json:"v1"`
	V2               int                      `json:"v2"`
	NodesAdded       []map[string]interface{} `json:"nodes_added"`
	NodesRemoved     []map[string]interface{} `json:"nodes_removed"`
	NodesModified    []NodeModification       `json:"nodes_modified"`
	EdgesAdded       []map[string]interface{} `json:"edges_added"`
	EdgesRemoved     []map[string]interface{} `json:"edges_removed"`
	VariablesChanged map[string]interface{}   `json:"variables_changed"`
	Summary          DiffSummary              `json:"summary"`
}

// NodeModification 节点修改
type NodeModification struct {
	NodeID  string                 `json:"node_id"`
	Before  map[string]interface{} `json:"before"`
	After   map[string]interface{} `json:"after"`
	Changes []string               `json:"changes"` // 变更的字段列表
}

// DiffSummary 差异摘要
type DiffSummary struct {
	TotalChanges     int `json:"total_changes"`
	NodesChangeCount int `json:"nodes_change_count"`
	EdgesChangeCount int `json:"edges_change_count"`
}
