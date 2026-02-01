package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// CustomNodeCategory 自定义节点分类
type CustomNodeCategory string

const (
	CustomNodeCategoryTrigger     CustomNodeCategory = "trigger"
	CustomNodeCategoryAction      CustomNodeCategory = "action"
	CustomNodeCategoryLogic       CustomNodeCategory = "logic"
	CustomNodeCategoryData        CustomNodeCategory = "data"
	CustomNodeCategoryAI          CustomNodeCategory = "ai"
	CustomNodeCategoryIntegration CustomNodeCategory = "integration"
	CustomNodeCategoryUtility     CustomNodeCategory = "utility"
	CustomNodeCategoryCustom      CustomNodeCategory = "custom"
)

// CustomNodeStatus 自定义节点状态
type CustomNodeStatus string

const (
	CustomNodeStatusDraft      CustomNodeStatus = "draft"
	CustomNodeStatusPending    CustomNodeStatus = "pending"
	CustomNodeStatusApproved   CustomNodeStatus = "approved"
	CustomNodeStatusRejected   CustomNodeStatus = "rejected"
	CustomNodeStatusPublished  CustomNodeStatus = "published"
	CustomNodeStatusDeprecated CustomNodeStatus = "deprecated"
	CustomNodeStatusRemoved    CustomNodeStatus = "removed"
)

// CustomNodePricingType 自定义节点定价类型
type CustomNodePricingType string

const (
	CustomNodePricingFree    CustomNodePricingType = "free"
	CustomNodePricingPaid    CustomNodePricingType = "paid"
	CustomNodePricingFreemium CustomNodePricingType = "freemium"
)

// CustomNode 自定义节点实体
type CustomNode struct {
	ID uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`

	// 发布者信息
	AuthorID uuid.UUID `gorm:"type:char(36);not null;index" json:"author_id"`

	// 节点标识
	Name string `gorm:"size:100;not null" json:"name"`
	Slug string `gorm:"uniqueIndex;size:100;not null" json:"slug"`

	// 基础信息
	DisplayName     string  `gorm:"size:200;not null" json:"display_name"`
	Description     string  `gorm:"type:text;not null" json:"description"`
	LongDescription *string `gorm:"type:longtext" json:"long_description"`

	// 图标和媒体
	Icon        string       `gorm:"size:100;default:'puzzle'" json:"icon"`
	IconURL     *string      `gorm:"size:500" json:"icon_url"`
	CoverImage  *string      `gorm:"size:500" json:"cover_image"`
	Screenshots StringArray  `gorm:"type:json" json:"screenshots"`
	DemoVideo   *string      `gorm:"size:500" json:"demo_video"`

	// 分类和标签
	Category CustomNodeCategory `gorm:"type:varchar(20);not null;default:'custom';index" json:"category"`
	Tags     StringArray        `gorm:"type:json" json:"tags"`

	// 状态
	Status CustomNodeStatus `gorm:"type:varchar(20);default:'draft';index" json:"status"`

	// 定价
	PricingType CustomNodePricingType `gorm:"type:varchar(20);default:'free'" json:"pricing_type"`
	Price       float64               `gorm:"type:decimal(10,2);default:0" json:"price"`
	Currency    string                `gorm:"size:10;default:'CNY'" json:"currency"`

	// 仓库信息
	RepositoryURL    *string `gorm:"size:500" json:"repository_url"`
	HomepageURL      *string `gorm:"size:500" json:"homepage_url"`
	DocumentationURL *string `gorm:"size:500" json:"documentation_url"`

	// 最新版本信息
	LatestVersion   *string    `gorm:"size:20" json:"latest_version"`
	LatestVersionID *uuid.UUID `gorm:"type:char(36)" json:"latest_version_id"`

	// 兼容性
	MinSDKVersion string  `gorm:"size:20;default:'0.1.0'" json:"min_sdk_version"`
	MaxSDKVersion *string `gorm:"size:20" json:"max_sdk_version"`

	// 统计
	DownloadCount int     `gorm:"default:0" json:"download_count"`
	InstallCount  int     `gorm:"default:0" json:"install_count"`
	StarCount     int     `gorm:"default:0" json:"star_count"`
	ReviewCount   int     `gorm:"default:0" json:"review_count"`
	AvgRating     float64 `gorm:"type:decimal(3,2);default:0" json:"avg_rating"`

	// 收入统计
	TotalRevenue float64 `gorm:"type:decimal(12,2);default:0" json:"total_revenue"`

	// 排序权重
	Featured  bool `gorm:"default:false" json:"featured"`
	SortOrder int  `gorm:"default:0" json:"sort_order"`

	// 时间戳
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	PublishedAt  *time.Time     `json:"published_at"`
	DeprecatedAt *time.Time     `json:"deprecated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`

	// 关联
	Author   *User                 `gorm:"foreignKey:AuthorID" json:"author,omitempty"`
	Versions []CustomNodeVersion   `gorm:"foreignKey:NodeID" json:"versions,omitempty"`
}

// TableName 表名
func (CustomNode) TableName() string {
	return "what_reverse_custom_nodes"
}

// BeforeCreate 创建前钩子
func (n *CustomNode) BeforeCreate(tx *gorm.DB) error {
	if n.ID == uuid.Nil {
		n.ID = uuid.New()
	}
	return nil
}

// CustomNodeVersion 自定义节点版本
type CustomNodeVersion struct {
	ID     uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	NodeID uuid.UUID `gorm:"type:char(36);not null;index" json:"node_id"`

	// 版本信息
	Version     string `gorm:"size:20;not null" json:"version"`
	VersionCode int    `gorm:"not null" json:"version_code"`

	// 变更说明
	Changelog *string `gorm:"type:text" json:"changelog"`

	// 包信息
	PackageURL  string  `gorm:"size:500;not null" json:"package_url"`
	PackageSize int64   `gorm:"default:0" json:"package_size"`
	PackageHash *string `gorm:"size:64" json:"package_hash"`

	// 节点定义
	Definition JSON `gorm:"type:json;not null" json:"definition"`

	// 输入输出定义
	InputsSchema  JSON `gorm:"type:json;not null" json:"inputs_schema"`
	OutputsSchema JSON `gorm:"type:json;not null" json:"outputs_schema"`

	// 依赖
	Dependencies     JSON `gorm:"type:json" json:"dependencies"`
	PeerDependencies JSON `gorm:"type:json" json:"peer_dependencies"`

	// SDK 兼容性
	MinSDKVersion string  `gorm:"size:20;default:'0.1.0'" json:"min_sdk_version"`
	MaxSDKVersion *string `gorm:"size:20" json:"max_sdk_version"`

	// 状态
	IsLatest     bool `gorm:"default:false" json:"is_latest"`
	IsPrerelease bool `gorm:"default:false" json:"is_prerelease"`
	IsDeprecated bool `gorm:"default:false" json:"is_deprecated"`

	// 统计
	DownloadCount int `gorm:"default:0" json:"download_count"`

	// 安全审核
	SecurityScanStatus string     `gorm:"size:20;default:'pending'" json:"security_scan_status"`
	SecurityScanAt     *time.Time `json:"security_scan_at"`
	SecurityIssues     JSON       `gorm:"type:json" json:"security_issues"`

	// 时间戳
	CreatedAt    time.Time  `json:"created_at"`
	PublishedAt  *time.Time `json:"published_at"`
	DeprecatedAt *time.Time `json:"deprecated_at"`

	// 关联
	Node *CustomNode `gorm:"foreignKey:NodeID" json:"node,omitempty"`
}

// TableName 表名
func (CustomNodeVersion) TableName() string {
	return "what_reverse_custom_node_versions"
}

// BeforeCreate 创建前钩子
func (v *CustomNodeVersion) BeforeCreate(tx *gorm.DB) error {
	if v.ID == uuid.Nil {
		v.ID = uuid.New()
	}
	return nil
}

// CustomNodeInstall 自定义节点安装记录
type CustomNodeInstall struct {
	ID        uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	NodeID    uuid.UUID `gorm:"type:char(36);not null;index" json:"node_id"`
	VersionID uuid.UUID `gorm:"type:char(36);not null" json:"version_id"`
	UserID    uuid.UUID `gorm:"type:char(36);not null;index" json:"user_id"`

	// 安装信息
	InstalledVersion string `gorm:"size:20;not null" json:"installed_version"`

	// 状态
	IsActive bool `gorm:"default:true" json:"is_active"`

	// 配置
	Settings JSON `gorm:"type:json" json:"settings"`

	// 时间戳
	InstalledAt   time.Time  `json:"installed_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
	UninstalledAt *time.Time `json:"uninstalled_at"`

	// 关联
	Node    *CustomNode        `gorm:"foreignKey:NodeID" json:"node,omitempty"`
	Version *CustomNodeVersion `gorm:"foreignKey:VersionID" json:"version,omitempty"`
	User    *User              `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// TableName 表名
func (CustomNodeInstall) TableName() string {
	return "what_reverse_custom_node_installs"
}

// BeforeCreate 创建前钩子
func (i *CustomNodeInstall) BeforeCreate(tx *gorm.DB) error {
	if i.ID == uuid.Nil {
		i.ID = uuid.New()
	}
	if i.InstalledAt.IsZero() {
		i.InstalledAt = time.Now()
	}
	return nil
}

// CustomNodeReview 自定义节点评价
type CustomNodeReview struct {
	ID     uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	NodeID uuid.UUID `gorm:"type:char(36);not null;index" json:"node_id"`
	UserID uuid.UUID `gorm:"type:char(36);not null;index" json:"user_id"`

	// 评分
	Rating int `gorm:"not null" json:"rating"`

	// 评价内容
	Title   *string `gorm:"size:200" json:"title"`
	Content *string `gorm:"type:text" json:"content"`

	// 版本信息
	ReviewedVersion *string `gorm:"size:20" json:"reviewed_version"`

	// 互动
	HelpfulCount int `gorm:"default:0" json:"helpful_count"`

	// 状态
	IsVerified bool `gorm:"default:false" json:"is_verified"`
	IsFeatured bool `gorm:"default:false" json:"is_featured"`

	// 作者回复
	AuthorReply   *string    `gorm:"type:text" json:"author_reply"`
	AuthorReplyAt *time.Time `json:"author_reply_at"`

	// 时间戳
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// 关联
	Node *CustomNode `gorm:"foreignKey:NodeID" json:"node,omitempty"`
	User *User       `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// TableName 表名
func (CustomNodeReview) TableName() string {
	return "what_reverse_custom_node_reviews"
}

// BeforeCreate 创建前钩子
func (r *CustomNodeReview) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}

// CustomNodeStar 自定义节点收藏
type CustomNodeStar struct {
	ID        uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	NodeID    uuid.UUID `gorm:"type:char(36);not null;index" json:"node_id"`
	UserID    uuid.UUID `gorm:"type:char(36);not null;index" json:"user_id"`
	CreatedAt time.Time `json:"created_at"`

	// 关联
	Node *CustomNode `gorm:"foreignKey:NodeID" json:"node,omitempty"`
	User *User       `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// TableName 表名
func (CustomNodeStar) TableName() string {
	return "what_reverse_custom_node_stars"
}

// BeforeCreate 创建前钩子
func (s *CustomNodeStar) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}

// CustomNodeDownload 自定义节点下载记录
type CustomNodeDownload struct {
	ID        uuid.UUID  `gorm:"type:char(36);primaryKey" json:"id"`
	NodeID    uuid.UUID  `gorm:"type:char(36);not null;index" json:"node_id"`
	VersionID uuid.UUID  `gorm:"type:char(36);not null" json:"version_id"`
	UserID    *uuid.UUID `gorm:"type:char(36);index" json:"user_id"`

	// 下载信息
	IPAddress *string `gorm:"size:45" json:"ip_address"`
	UserAgent *string `gorm:"size:500" json:"user_agent"`

	// 时间戳
	DownloadedAt time.Time `json:"downloaded_at"`
}

// TableName 表名
func (CustomNodeDownload) TableName() string {
	return "what_reverse_custom_node_downloads"
}

// BeforeCreate 创建前钩子
func (d *CustomNodeDownload) BeforeCreate(tx *gorm.DB) error {
	if d.ID == uuid.Nil {
		d.ID = uuid.New()
	}
	if d.DownloadedAt.IsZero() {
		d.DownloadedAt = time.Now()
	}
	return nil
}

// GetCustomNodeCategories 获取所有节点分类
func GetCustomNodeCategories() []struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
} {
	return []struct {
		ID          string `json:"id"`
		Name        string `json:"name"`
		Description string `json:"description"`
		Icon        string `json:"icon"`
	}{
		{ID: "trigger", Name: "触发器", Description: "工作流触发节点", Icon: "⚡"},
		{ID: "action", Name: "动作", Description: "执行具体操作", Icon: "🎯"},
		{ID: "logic", Name: "逻辑", Description: "条件和分支控制", Icon: "🔀"},
		{ID: "data", Name: "数据", Description: "数据处理和转换", Icon: "📊"},
		{ID: "ai", Name: "AI", Description: "AI 和机器学习", Icon: "🤖"},
		{ID: "integration", Name: "集成", Description: "第三方服务集成", Icon: "🔗"},
		{ID: "utility", Name: "工具", Description: "通用工具节点", Icon: "🔧"},
		{ID: "custom", Name: "自定义", Description: "其他自定义节点", Icon: "📦"},
	}
}
