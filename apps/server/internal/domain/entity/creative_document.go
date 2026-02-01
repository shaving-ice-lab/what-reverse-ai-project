package entity

import (
	"crypto/rand"
	"encoding/hex"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// CreativeDocument 创意文档实体
type CreativeDocument struct {
	ID         uuid.UUID  `gorm:"type:char(36);primaryKey" json:"id"`
	UserID     uuid.UUID  `gorm:"type:char(36);not null;index" json:"user_id"`
	TaskID     *uuid.UUID `gorm:"type:char(36);index" json:"task_id"`
	TemplateID *uuid.UUID `gorm:"type:char(36);index" json:"template_id"`

	// 文档基本信息
	Title       string  `gorm:"size:200;not null" json:"title"`
	Description *string `gorm:"size:500" json:"description"`

	// 文档内容
	Content string `gorm:"type:text;not null" json:"content"`

	// 章节结构 (JSONB: [{"id": "...", "title": "...", "content": "...", "order": 0}])
	Sections JSON `gorm:"type:json;not null" json:"sections"`

	// 目录
	TableOfContents *string `gorm:"type:text" json:"table_of_contents"`

	// 摘要
	Summary *string `gorm:"type:text" json:"summary"`

	// 统计信息
	WordCount    int `gorm:"default:0" json:"word_count"`
	CharCount    int `gorm:"default:0" json:"char_count"`
	SectionCount int `gorm:"default:0" json:"section_count"`

	// 版本控制
	Version  int        `gorm:"default:1" json:"version"`
	ParentID *uuid.UUID `gorm:"type:char(36)" json:"parent_id"`

	// 分享设置
	ShareID        *string    `gorm:"size:20;uniqueIndex" json:"share_id"`
	SharePassword  *string    `gorm:"size:100" json:"-"`
	ShareExpiresAt *time.Time `json:"share_expires_at"`
	IsPublic       bool       `gorm:"default:false" json:"is_public"`
	AllowDownload  bool       `gorm:"default:true" json:"allow_download"`

	// 状态
	IsArchived bool `gorm:"default:false" json:"is_archived"`

	// Token 使用
	TokenUsage JSON `gorm:"type:json" json:"token_usage"`

	// 时间戳
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// 关联
	User     *User             `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Task     *CreativeTask     `gorm:"foreignKey:TaskID" json:"task,omitempty"`
	Template *CreativeTemplate `gorm:"foreignKey:TemplateID" json:"template,omitempty"`
	Parent   *CreativeDocument `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
}

// TableName 表名
func (CreativeDocument) TableName() string {
	return "what_reverse_creative_documents"
}

// BeforeCreate 创建前钩子
func (d *CreativeDocument) BeforeCreate(tx *gorm.DB) error {
	if d.ID == uuid.Nil {
		d.ID = uuid.New()
	}
	if d.Sections == nil {
		d.Sections = JSON{}
	}
	if d.TokenUsage == nil {
		d.TokenUsage = JSON{}
	}
	return nil
}

// GenerateShareID 生成分享 ID
func (d *CreativeDocument) GenerateShareID() string {
	b := make([]byte, 10)
	rand.Read(b)
	shareID := hex.EncodeToString(b)
	d.ShareID = &shareID
	return shareID
}

// SetSharePassword 设置分享密码 (需要外部加密)
func (d *CreativeDocument) SetSharePassword(hashedPassword string) {
	d.SharePassword = &hashedPassword
}

// HasSharePassword 是否有分享密码
func (d *CreativeDocument) HasSharePassword() bool {
	return d.SharePassword != nil && *d.SharePassword != ""
}

// IsShareExpired 分享是否已过期
func (d *CreativeDocument) IsShareExpired() bool {
	if d.ShareExpiresAt == nil {
		return false
	}
	return time.Now().After(*d.ShareExpiresAt)
}

// CanShare 是否可以访问分享
func (d *CreativeDocument) CanShare() bool {
	if d.ShareID == nil || *d.ShareID == "" {
		return false
	}
	if d.IsShareExpired() {
		return false
	}
	return true
}

// DocumentSection 文档章节结构
type DocumentSection struct {
	ID       string `json:"id"`
	Title    string `json:"title"`
	Content  string `json:"content"`
	Order    int    `json:"order"`
	ParentID string `json:"parentId,omitempty"`
	Level    int    `json:"level"`
}

// GetSections 获取章节列表
func (d *CreativeDocument) GetSections() []DocumentSection {
	sections := []DocumentSection{}
	if d.Sections != nil {
		if arr, ok := d.Sections["sections"].([]interface{}); ok {
			for _, item := range arr {
				if m, ok := item.(map[string]interface{}); ok {
					section := DocumentSection{}
					if id, ok := m["id"].(string); ok {
						section.ID = id
					}
					if title, ok := m["title"].(string); ok {
						section.Title = title
					}
					if content, ok := m["content"].(string); ok {
						section.Content = content
					}
					if order, ok := m["order"].(float64); ok {
						section.Order = int(order)
					}
					if level, ok := m["level"].(float64); ok {
						section.Level = int(level)
					}
					sections = append(sections, section)
				}
			}
		}
	}
	return sections
}

// SetSections 设置章节列表
func (d *CreativeDocument) SetSections(sections []DocumentSection) {
	arr := make([]interface{}, len(sections))
	for i, s := range sections {
		arr[i] = map[string]interface{}{
			"id":       s.ID,
			"title":    s.Title,
			"content":  s.Content,
			"order":    s.Order,
			"parentId": s.ParentID,
			"level":    s.Level,
		}
	}
	d.Sections = JSON{"sections": arr}
	d.SectionCount = len(sections)
}

// UpdateSection 更新单个章节
func (d *CreativeDocument) UpdateSection(sectionID string, newContent string, newTitle string) bool {
	sections := d.GetSections()
	for i, s := range sections {
		if s.ID == sectionID {
			if newContent != "" {
				sections[i].Content = newContent
			}
			if newTitle != "" {
				sections[i].Title = newTitle
			}
			d.SetSections(sections)
			return true
		}
	}
	return false
}

// CalculateStats 计算统计信息
func (d *CreativeDocument) CalculateStats() {
	// 计算字符数
	d.CharCount = len([]rune(d.Content))
	
	// 计算字数（简单按空格分词）
	// 对于中文，使用字符数作为近似值
	d.WordCount = d.CharCount
	
	// 章节数
	d.SectionCount = len(d.GetSections())
}

// CreativeSectionVersion 章节版本历史
type CreativeSectionVersion struct {
	ID         uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	DocumentID uuid.UUID `gorm:"type:char(36);not null;index" json:"document_id"`
	SectionID  string    `gorm:"size:100;not null" json:"section_id"`
	Version    int       `gorm:"not null" json:"version"`

	// 章节内容
	Title   string `gorm:"size:200;not null" json:"title"`
	Content string `gorm:"type:text;not null" json:"content"`

	// 生成指令 (重新生成时的用户指令)
	Instruction *string `gorm:"type:text" json:"instruction"`

	// Token 使用
	TokenUsage JSON `gorm:"type:json" json:"token_usage"`

	// 时间戳
	CreatedAt time.Time `json:"created_at"`

	// 关联
	Document *CreativeDocument `gorm:"foreignKey:DocumentID" json:"document,omitempty"`
}

// TableName 表名
func (CreativeSectionVersion) TableName() string {
	return "what_reverse_creative_section_versions"
}

// BeforeCreate 创建前钩子
func (v *CreativeSectionVersion) BeforeCreate(tx *gorm.DB) error {
	if v.ID == uuid.Nil {
		v.ID = uuid.New()
	}
	if v.TokenUsage == nil {
		v.TokenUsage = JSON{}
	}
	return nil
}

// ShareSettings 分享设置结构
type ShareSettings struct {
	ShareID       string     `json:"share_id"`
	Password      *string    `json:"password,omitempty"`
	ExpiresAt     *time.Time `json:"expires_at,omitempty"`
	IsPublic      bool       `json:"is_public"`
	AllowDownload bool       `json:"allow_download"`
}

// GetShareSettings 获取分享设置
func (d *CreativeDocument) GetShareSettings() *ShareSettings {
	if d.ShareID == nil {
		return nil
	}
	return &ShareSettings{
		ShareID:       *d.ShareID,
		ExpiresAt:     d.ShareExpiresAt,
		IsPublic:      d.IsPublic,
		AllowDownload: d.AllowDownload,
	}
}

// DocumentExportFormat 文档导出格式
type DocumentExportFormat string

const (
	ExportFormatMarkdown DocumentExportFormat = "markdown"
	ExportFormatPDF      DocumentExportFormat = "pdf"
	ExportFormatDOCX     DocumentExportFormat = "docx"
	ExportFormatHTML     DocumentExportFormat = "html"
)
