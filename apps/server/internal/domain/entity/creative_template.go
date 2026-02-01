package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// CreativeTemplateCategory 创意模板分类
type CreativeTemplateCategory string

const (
	CreativeTemplateCategoryBusiness  CreativeTemplateCategory = "business"
	CreativeTemplateCategoryContent   CreativeTemplateCategory = "content"
	CreativeTemplateCategoryProduct   CreativeTemplateCategory = "product"
	CreativeTemplateCategoryMarketing CreativeTemplateCategory = "marketing"
)

// CreativeTemplate AI 创意助手模板实体
type CreativeTemplate struct {
	ID uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`

	// 基础信息
	Name        string                   `gorm:"size:100;not null" json:"name"`
	Slug        string                   `gorm:"size:100;unique;not null" json:"slug"`
	Description string                   `gorm:"size:500;not null" json:"description"`
	Icon        string                   `gorm:"size:50;default:'📝'" json:"icon"`
	Category    CreativeTemplateCategory `gorm:"size:20;not null;index" json:"category"`
	Tags        StringArray              `gorm:"type:json" json:"tags"`

	// 输入字段定义
	InputsRequired JSON `gorm:"type:json;column:inputs_required;not null" json:"inputs_required"`
	InputsOptional JSON `gorm:"type:json;column:inputs_optional" json:"inputs_optional"`

	// 输出章节定义
	OutputSections JSON `gorm:"type:json;column:output_sections;not null" json:"output_sections"`

	// 关联工作流
	WorkflowID *uuid.UUID `gorm:"type:char(36);column:workflow_id" json:"workflow_id"`

	// 示例
	ExampleInput       JSON    `gorm:"type:json;column:example_input" json:"example_input"`
	ExampleOutput      *string `gorm:"type:text;column:example_output" json:"example_output"`
	ExampleTitle       *string `gorm:"size:200;column:example_title" json:"example_title"`
	ExampleDescription *string `gorm:"size:500;column:example_description" json:"example_description"`

	// 统计数据
	UsageCount  int     `gorm:"default:0;column:usage_count" json:"usage_count"`
	Rating      float32 `gorm:"type:decimal(3,2);default:0.00" json:"rating"`
	ReviewCount int     `gorm:"default:0;column:review_count" json:"review_count"`

	// 预计时间(秒)
	EstimatedTime int `gorm:"default:180;column:estimated_time" json:"estimated_time"`

	// 状态标记
	IsOfficial  bool `gorm:"default:false;column:is_official" json:"is_official"`
	IsFeatured  bool `gorm:"default:false;column:is_featured;index" json:"is_featured"`
	IsPublished bool `gorm:"default:true;column:is_published" json:"is_published"`

	// 创建者信息
	CreatorID   *uuid.UUID `gorm:"type:char(36);column:creator_id" json:"creator_id"`
	CreatorName *string    `gorm:"size:100;column:creator_name" json:"creator_name"`

	// 版本管理
	Version int `gorm:"default:1" json:"version"`

	// 时间戳
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	PublishedAt *time.Time     `gorm:"column:published_at" json:"published_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	// 关联
	Creator  *User     `gorm:"foreignKey:CreatorID" json:"creator,omitempty"`
	Workflow *Workflow `gorm:"foreignKey:WorkflowID" json:"workflow,omitempty"`
}

// TableName 表名
func (CreativeTemplate) TableName() string {
	return "what_reverse_creative_templates"
}

// BeforeCreate 创建前钩子
func (t *CreativeTemplate) BeforeCreate(tx *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	if t.Icon == "" {
		t.Icon = "📝"
	}
	if t.EstimatedTime == 0 {
		t.EstimatedTime = 180
	}
	if t.InputsOptional == nil {
		t.InputsOptional = JSON{}
	}
	if t.Tags == nil {
		t.Tags = StringArray{}
	}
	return nil
}

// CreativeTemplateVersion 创意模板版本历史
type CreativeTemplateVersion struct {
	ID         uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	TemplateID uuid.UUID `gorm:"type:char(36);not null;column:template_id;index" json:"template_id"`
	Version    int       `gorm:"not null" json:"version"`

	// 版本快照
	Name           string `gorm:"size:100;not null" json:"name"`
	Description    string `gorm:"size:500;not null" json:"description"`
	InputsRequired JSON   `gorm:"type:json;column:inputs_required;not null" json:"inputs_required"`
	InputsOptional JSON   `gorm:"type:json;column:inputs_optional" json:"inputs_optional"`
	OutputSections JSON   `gorm:"type:json;column:output_sections;not null" json:"output_sections"`

	// 变更信息
	ChangeSummary *string    `gorm:"size:500;column:change_summary" json:"change_summary"`
	ChangedBy     *uuid.UUID `gorm:"type:char(36);column:changed_by" json:"changed_by"`

	// 时间戳
	CreatedAt time.Time `json:"created_at"`

	// 关联
	Template  *CreativeTemplate `gorm:"foreignKey:TemplateID" json:"template,omitempty"`
	ChangedByUser *User         `gorm:"foreignKey:ChangedBy" json:"changed_by_user,omitempty"`
}

// TableName 表名
func (CreativeTemplateVersion) TableName() string {
	return "what_reverse_creative_template_versions"
}

// BeforeCreate 创建前钩子
func (v *CreativeTemplateVersion) BeforeCreate(tx *gorm.DB) error {
	if v.ID == uuid.Nil {
		v.ID = uuid.New()
	}
	return nil
}

// CreativeTemplateCategoryInfo 模板分类信息
type CreativeTemplateCategoryInfo struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
	Count       int    `json:"count"`
}

// GetCreativeTemplateCategories 获取创意模板分类列表
func GetCreativeTemplateCategories() []CreativeTemplateCategoryInfo {
	return []CreativeTemplateCategoryInfo{
		{
			ID:          "business",
			Name:        "商业策划",
			Description: "商业计划、创业方案、副业规划",
			Icon:        "💼",
		},
		{
			ID:          "content",
			Name:        "内容创作",
			Description: "自媒体运营、选题策划、内容规划",
			Icon:        "📱",
		},
		{
			ID:          "product",
			Name:        "产品规划",
			Description: "PRD文档、MVP规划、功能设计",
			Icon:        "📋",
		},
		{
			ID:          "marketing",
			Name:        "营销策划",
			Description: "营销方案、品牌定位、活动策划",
			Icon:        "📢",
		},
	}
}

// InputField 输入字段定义 (用于 JSON 序列化)
type InputField struct {
	ID              string            `json:"id"`
	Label           string            `json:"label"`
	Type            string            `json:"type"`
	Placeholder     string            `json:"placeholder,omitempty"`
	HelpText        string            `json:"helpText,omitempty"`
	DefaultValue    interface{}       `json:"defaultValue,omitempty"`
	Options         []SelectOption    `json:"options,omitempty"`
	Validation      *InputValidation  `json:"validation,omitempty"`
	AISuggest       bool              `json:"aiSuggest,omitempty"`
	AISuggestPrompt string            `json:"aiSuggestPrompt,omitempty"`
	ShowWhen        *ShowWhenCondition `json:"showWhen,omitempty"`
}

// SelectOption 下拉选项
type SelectOption struct {
	Value       string `json:"value"`
	Label       string `json:"label"`
	Description string `json:"description,omitempty"`
}

// InputValidation 输入验证规则
type InputValidation struct {
	Required       bool   `json:"required,omitempty"`
	MinLength      int    `json:"minLength,omitempty"`
	MaxLength      int    `json:"maxLength,omitempty"`
	Min            int    `json:"min,omitempty"`
	Max            int    `json:"max,omitempty"`
	Pattern        string `json:"pattern,omitempty"`
	PatternMessage string `json:"patternMessage,omitempty"`
}

// ShowWhenCondition 条件显示规则
type ShowWhenCondition struct {
	Field    string      `json:"field"`
	Operator string      `json:"operator"`
	Value    interface{} `json:"value,omitempty"`
}

// OutputSection 输出章节定义
type OutputSection struct {
	ID             string   `json:"id"`
	Title          string   `json:"title"`
	Description    string   `json:"description"`
	PromptTemplate string   `json:"promptTemplate,omitempty"`
	Icon           string   `json:"icon,omitempty"`
	EstimatedTime  int      `json:"estimatedTime,omitempty"`
	DependsOn      []string `json:"dependsOn,omitempty"`
	Regeneratable  bool     `json:"regeneratable,omitempty"`
	OutputFormat   string   `json:"outputFormat,omitempty"`
}

// TemplateExample 模板示例
type TemplateExample struct {
	Input       map[string]interface{} `json:"input"`
	Output      string                 `json:"output"`
	Title       string                 `json:"title,omitempty"`
	Description string                 `json:"description,omitempty"`
}
