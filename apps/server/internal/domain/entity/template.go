package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Template 工作流模板实体
type Template struct {
	ID uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`

	// 基础信息
	Name            string  `gorm:"size:200;not null" json:"name"`
	Slug            string  `gorm:"size:100;unique;not null" json:"slug"`
	Description     string  `gorm:"type:text" json:"description"`
	LongDescription string  `gorm:"type:text" json:"long_description"`

	// 分类和标签
	Category string      `gorm:"size:50;not null;index" json:"category"`
	Tags     StringArray `gorm:"type:json" json:"tags"`

	// 显示信息
	Icon        string      `gorm:"size:50;default:'📋'" json:"icon"`
	CoverImage  *string     `gorm:"size:500" json:"cover_image"`
	Screenshots StringArray `gorm:"type:json" json:"screenshots"`

	// 工作流定义
	Definition  JSON `gorm:"type:json;not null" json:"definition"`
	Variables   JSON `gorm:"type:json" json:"variables"`
	InputSchema JSON `gorm:"type:json" json:"input_schema"` // 输入参数定义

	// 元数据
	Difficulty    string `gorm:"size:20;default:'beginner'" json:"difficulty"` // beginner, intermediate, advanced
	EstimatedTime int    `gorm:"default:5" json:"estimated_time"`              // 预计完成时间（分钟）
	NodeCount     int    `gorm:"default:0" json:"node_count"`

	// 状态
	IsFeatured  bool `gorm:"default:false;index" json:"is_featured"`
	IsOfficial  bool `gorm:"default:false" json:"is_official"`
	IsPublished bool `gorm:"default:true" json:"is_published"`

	// 统计
	UseCount  int `gorm:"default:0" json:"use_count"`
	ViewCount int `gorm:"default:0" json:"view_count"`
	LikeCount int `gorm:"default:0" json:"like_count"`

	// 作者信息（可选，用于社区模板）
	AuthorID *uuid.UUID `gorm:"type:char(36)" json:"author_id"`

	// 时间戳
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	PublishedAt *time.Time     `json:"published_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	// 关联
	Author *User `gorm:"foreignKey:AuthorID" json:"author,omitempty"`
}

// TableName 表名
func (Template) TableName() string {
	return "what_reverse_templates"
}

// BeforeCreate 创建前钩子
func (t *Template) BeforeCreate(tx *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	// 计算节点数量
	if t.Definition != nil {
		if nodes, ok := t.Definition["nodes"].([]interface{}); ok {
			t.NodeCount = len(nodes)
		}
	}
	if t.Icon == "" {
		t.Icon = "📋"
	}
	if t.Difficulty == "" {
		t.Difficulty = "beginner"
	}
	if t.EstimatedTime == 0 {
		t.EstimatedTime = 5
	}
	return nil
}

// TemplateCategory 模板分类
type TemplateCategory struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
	Count       int    `json:"count"`
}

// GetTemplateCategories 获取预定义分类
func GetTemplateCategories() []TemplateCategory {
	return []TemplateCategory{
		{ID: "content", Name: "内容创作", Description: "文章写作、社媒内容生成", Icon: "✍️"},
		{ID: "data", Name: "数据处理", Description: "数据清洗、报表生成、分析", Icon: "📊"},
		{ID: "customer", Name: "客户服务", Description: "智能客服、FAQ自动回复", Icon: "💬"},
		{ID: "marketing", Name: "市场营销", Description: "营销自动化、竞品分析", Icon: "📢"},
		{ID: "productivity", Name: "办公效率", Description: "日程管理、邮件处理", Icon: "⚡"},
		{ID: "developer", Name: "开发工具", Description: "代码审查、文档生成", Icon: "💻"},
		{ID: "research", Name: "研究分析", Description: "论文阅读、市场调研", Icon: "🔬"},
		{ID: "education", Name: "教育学习", Description: "学习辅助、课程创建", Icon: "📚"},
		{ID: "finance", Name: "金融财务", Description: "财务分析、报表处理", Icon: "💰"},
		{ID: "other", Name: "其他", Description: "其他类型模板", Icon: "📦"},
	}
}
