// Package database 提供数据库相关功能
package database

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/pkg/logger"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// toJSON 将任意值转换为 entity.JSON
func toJSON(v interface{}) entity.JSON {
	data, err := json.Marshal(v)
	if err != nil {
		return entity.JSON{}
	}
	var result entity.JSON
	if err := json.Unmarshal(data, &result); err != nil {
		// 如果是数组，包装成带 "items" 键的对象
		var arr []interface{}
		if err := json.Unmarshal(data, &arr); err == nil {
			return entity.JSON{"items": arr}
		}
		return entity.JSON{}
	}
	return result
}

// TemplateSeeder 模板种子数据播种器
type TemplateSeeder struct {
	db  *gorm.DB
	log logger.Logger
}

// NewTemplateSeeder 创建模板种子数据播种器
func NewTemplateSeeder(db *gorm.DB, log logger.Logger) *TemplateSeeder {
	return &TemplateSeeder{
		db:  db,
		log: log,
	}
}

// SeedOfficialTemplates 播种官方模板
func (s *TemplateSeeder) SeedOfficialTemplates() error {
	templates := s.getOfficialTemplates()

	for _, t := range templates {
		// 检查是否已存在
		var existing entity.CreativeTemplate
		result := s.db.Where("slug = ?", t.Slug).First(&existing)
		if result.Error == nil {
			s.log.Info("Template already exists, skipping", "slug", t.Slug)
			continue
		}

		// 创建模板
		if err := s.db.Create(&t).Error; err != nil {
			s.log.Error("Failed to create template", "slug", t.Slug, "error", err)
			return fmt.Errorf("failed to create template %s: %w", t.Slug, err)
		}

		s.log.Info("Created official template", "slug", t.Slug, "name", t.Name)
	}

	return nil
}

// getOfficialTemplates 获取官方模板列表
func (s *TemplateSeeder) getOfficialTemplates() []entity.CreativeTemplate {
	now := time.Now()
	return []entity.CreativeTemplate{
		s.businessPlanGenerator(now),
		s.contentStrategyGenerator(now),
		s.prdGenerator(now),
		s.viralTopicsGenerator(now),
	}
}

// businessPlanGenerator 商业计划生成器模板
func (s *TemplateSeeder) businessPlanGenerator(now time.Time) entity.CreativeTemplate {
	inputsRequired := []entity.InputField{
		{
			ID:          "idea",
			Label:       "商业想法",
			Type:        "textarea",
			Placeholder: "例如：我想做AI自媒体，通过教学和工具服务年入1000万",
			HelpText:    "详细描述你的商业想法，越具体越好",
			Validation: &entity.InputValidation{
				Required:  true,
				MinLength: 10,
				MaxLength: 2000,
			},
			AISuggest: true,
		},
		{
			ID:    "targetRevenue",
			Label: "目标收入",
			Type:  "select",
			Options: []entity.SelectOption{
				{Value: "100000", Label: "年入10万"},
				{Value: "500000", Label: "年入50万"},
				{Value: "1000000", Label: "年入100万"},
				{Value: "5000000", Label: "年入500万"},
				{Value: "10000000", Label: "年入1000万"},
				{Value: "custom", Label: "自定义"},
			},
			DefaultValue: "1000000",
		},
		{
			ID:    "timeframe",
			Label: "期望达成时间",
			Type:  "select",
			Options: []entity.SelectOption{
				{Value: "6months", Label: "6个月"},
				{Value: "1year", Label: "1年"},
				{Value: "2years", Label: "2年"},
				{Value: "3years", Label: "3年"},
			},
			DefaultValue: "1year",
		},
	}

	inputsOptional := []entity.InputField{
		{
			ID:          "resources",
			Label:       "可用资源",
			Type:        "textarea",
			Placeholder: "团队人数、启动资金、可投入时间等",
			HelpText:    "描述你目前有哪些可用资源",
		},
		{
			ID:          "background",
			Label:       "个人背景",
			Type:        "textarea",
			Placeholder: "擅长领域、工作经验、已有资源等",
			HelpText:    "你的专业背景和优势",
		},
		{
			ID:          "constraints",
			Label:       "限制条件",
			Type:        "textarea",
			Placeholder: "时间限制、预算限制、地域限制、不想做的事等",
			HelpText:    "有哪些限制或者不想做的事情",
		},
	}

	outputSections := []entity.OutputSection{
		{
			ID:            "market_analysis",
			Title:         "市场机会分析",
			Description:   "分析行业现状、成功案例、核心洞察",
			Icon:          "chart-bar",
			EstimatedTime: 30,
			Regeneratable: true,
		},
		{
			ID:            "business_model",
			Title:         "商业模式设计",
			Description:   "收入结构、产品矩阵、定价策略",
			Icon:          "currency-dollar",
			EstimatedTime: 30,
			DependsOn:     []string{"market_analysis"},
			Regeneratable: true,
		},
		{
			ID:            "execution_strategy",
			Title:         "执行策略",
			Description:   "平台布局、内容计划、获客路径",
			Icon:          "rocket",
			EstimatedTime: 30,
			DependsOn:     []string{"business_model"},
			Regeneratable: true,
		},
		{
			ID:            "timeline",
			Title:         "时间规划",
			Description:   "阶段目标、里程碑、关键指标",
			Icon:          "calendar",
			EstimatedTime: 20,
			DependsOn:     []string{"execution_strategy"},
			Regeneratable: true,
		},
		{
			ID:            "risk_assessment",
			Title:         "风险评估",
			Description:   "主要风险和应对策略",
			Icon:          "shield-exclamation",
			EstimatedTime: 20,
			DependsOn:     []string{"execution_strategy"},
			Regeneratable: true,
		},
		{
			ID:            "action_plan",
			Title:         "立即行动",
			Description:   "本周任务、首月目标、资源清单",
			Icon:          "check-circle",
			EstimatedTime: 20,
			DependsOn:     []string{"timeline"},
			Regeneratable: true,
		},
	}

	exampleInput := map[string]interface{}{
		"idea":          "我想通过AI自媒体实现年入1000万。计划通过知识付费、AI工具服务和企业咨询三条线来变现。",
		"targetRevenue": "10000000",
		"timeframe":     "3years",
		"resources":     "1人团队，3万启动资金，每天可投入4小时",
		"background":    "技术背景，5年开发经验，熟悉AI工具",
		"constraints":   "不想露脸直播，希望能在家工作",
	}

	exampleOutput := `# AI自媒体商业计划

## 一、市场机会分析

### 已验证的成功案例

| 案例 | 模式 | 收入规模 | 关键成功因素 |
|------|------|----------|--------------|
| 李一舟 | AI课程销售 | 1.75亿（3年） | 低价引流+高价转化 |
| 花爷 | AI实战训练营 | 5000万+/年 | 社群运营+实战教学 |

### 核心洞察

1. AI教育市场规模超过百亿，年增长率30%+
2. 技术背景+内容输出能力是核心竞争力
3. 知识付费→工具订阅→企业服务是成熟的变现路径

...`

	exampleTitle := "AI自媒体商业计划"
	exampleDesc := "基于AI自媒体的商业计划示例，包含完整的市场分析、商业模式设计和执行策略"

	return entity.CreativeTemplate{
		ID:                 uuid.New(),
		Name:               "商业计划生成器",
		Slug:               "business-plan-generator",
		Description:        "输入你的商业想法，自动生成完整的商业计划书，包含市场分析、商业模式、执行策略、时间规划等",
		Icon:               "💼",
		Category:           entity.CreativeTemplateCategoryBusiness,
		Tags:               entity.StringArray{"商业计划", "创业", "副业", "变现"},
		InputsRequired:     toJSON(inputsRequired),
		InputsOptional:     toJSON(inputsOptional),
		OutputSections:     toJSON(outputSections),
		ExampleInput:       toJSON(exampleInput),
		ExampleOutput:      &exampleOutput,
		ExampleTitle:       &exampleTitle,
		ExampleDescription: &exampleDesc,
		UsageCount:         0,
		Rating:             0,
		ReviewCount:        0,
		EstimatedTime:      180, // 3分钟
		IsOfficial:         true,
		IsFeatured:         true,
		IsPublished:        true,
		Version:            1,
		CreatedAt:          now,
		UpdatedAt:          now,
		PublishedAt:        &now,
	}
}

// contentStrategyGenerator 自媒体内容策划模板
func (s *TemplateSeeder) contentStrategyGenerator(now time.Time) entity.CreativeTemplate {
	inputsRequired := []entity.InputField{
		{
			ID:          "niche",
			Label:       "账号定位",
			Type:        "textarea",
			Placeholder: "例如：AI工具教学、职场干货、理财知识等",
			HelpText:    "你想要做的内容领域",
			Validation: &entity.InputValidation{
				Required:  true,
				MinLength: 5,
				MaxLength: 500,
			},
		},
		{
			ID:    "platform",
			Label: "主要平台",
			Type:  "select",
			Options: []entity.SelectOption{
				{Value: "xiaohongshu", Label: "小红书"},
				{Value: "douyin", Label: "抖音"},
				{Value: "bilibili", Label: "B站"},
				{Value: "wechat", Label: "公众号"},
				{Value: "zhihu", Label: "知乎"},
				{Value: "multi", Label: "多平台运营"},
			},
			DefaultValue: "xiaohongshu",
		},
		{
			ID:    "goal",
			Label: "运营目标",
			Type:  "select",
			Options: []entity.SelectOption{
				{Value: "followers", Label: "涨粉"},
				{Value: "monetize", Label: "变现"},
				{Value: "brand", Label: "品牌曝光"},
				{Value: "traffic", Label: "引流私域"},
			},
			DefaultValue: "monetize",
		},
	}

	outputSections := []entity.OutputSection{
		{
			ID:            "positioning",
			Title:         "账号定位",
			Description:   "差异化定位、人设打造、价值主张",
			Icon:          "user-circle",
			EstimatedTime: 20,
			Regeneratable: true,
		},
		{
			ID:            "content_pillars",
			Title:         "内容支柱",
			Description:   "核心内容方向和主题规划",
			Icon:          "collection",
			EstimatedTime: 25,
			DependsOn:     []string{"positioning"},
			Regeneratable: true,
		},
		{
			ID:            "topic_library",
			Title:         "选题库",
			Description:   "30个爆款选题创意",
			Icon:          "light-bulb",
			EstimatedTime: 30,
			DependsOn:     []string{"content_pillars"},
			Regeneratable: true,
		},
		{
			ID:            "title_formulas",
			Title:         "标题公式",
			Description:   "高点击率标题模板",
			Icon:          "pencil-alt",
			EstimatedTime: 15,
			Regeneratable: true,
		},
		{
			ID:            "schedule",
			Title:         "发布排期",
			Description:   "内容日历和发布计划",
			Icon:          "calendar",
			EstimatedTime: 15,
			DependsOn:     []string{"topic_library"},
			Regeneratable: true,
		},
		{
			ID:            "monetization",
			Title:         "变现路径",
			Description:   "适合的变现方式和策略",
			Icon:          "currency-dollar",
			EstimatedTime: 20,
			DependsOn:     []string{"positioning"},
			Regeneratable: true,
		},
		{
			ID:            "growth",
			Title:         "增长策略",
			Description:   "涨粉技巧和互动策略",
			Icon:          "trending-up",
			EstimatedTime: 15,
			Regeneratable: true,
		},
	}

	return entity.CreativeTemplate{
		ID:             uuid.New(),
		Name:           "自媒体内容策划",
		Slug:           "content-strategy-generator",
		Description:    "一键生成完整的自媒体运营方案，包含账号定位、内容支柱、选题库、发布计划等",
		Icon:           "📱",
		Category:       entity.CreativeTemplateCategoryContent,
		Tags:           entity.StringArray{"自媒体", "内容创作", "小红书", "抖音", "涨粉"},
		InputsRequired: toJSON(inputsRequired),
		InputsOptional: entity.JSON{},
		OutputSections: toJSON(outputSections),
		UsageCount:     0,
		Rating:         0,
		ReviewCount:    0,
		EstimatedTime:  150, // 2.5分钟
		IsOfficial:     true,
		IsFeatured:     true,
		IsPublished:    true,
		Version:        1,
		CreatedAt:      now,
		UpdatedAt:      now,
		PublishedAt:    &now,
	}
}

// prdGenerator PRD文档生成器模板
func (s *TemplateSeeder) prdGenerator(now time.Time) entity.CreativeTemplate {
	inputsRequired := []entity.InputField{
		{
			ID:          "productIdea",
			Label:       "产品想法",
			Type:        "textarea",
			Placeholder: "例如：一个帮助用户管理AI工具订阅的平台",
			HelpText:    "描述你的产品想法和解决的问题",
			Validation: &entity.InputValidation{
				Required:  true,
				MinLength: 20,
				MaxLength: 3000,
			},
		},
		{
			ID:    "productType",
			Label: "产品类型",
			Type:  "select",
			Options: []entity.SelectOption{
				{Value: "saas", Label: "SaaS 产品"},
				{Value: "mobile", Label: "移动 App"},
				{Value: "web", Label: "Web 应用"},
				{Value: "tool", Label: "工具/插件"},
				{Value: "platform", Label: "平台型产品"},
			},
			DefaultValue: "saas",
		},
		{
			ID:          "targetUsers",
			Label:       "目标用户",
			Type:        "textarea",
			Placeholder: "例如：中小企业主、自媒体创作者等",
			HelpText:    "你的产品主要服务谁",
		},
	}

	outputSections := []entity.OutputSection{
		{
			ID:            "overview",
			Title:         "产品概述",
			Description:   "产品愿景、目标、核心价值",
			Icon:          "document-text",
			EstimatedTime: 20,
			Regeneratable: true,
		},
		{
			ID:            "user_research",
			Title:         "用户研究",
			Description:   "用户画像、需求分析、痛点洞察",
			Icon:          "users",
			EstimatedTime: 25,
			Regeneratable: true,
		},
		{
			ID:            "competitive",
			Title:         "竞品分析",
			Description:   "竞品对比、差异化定位",
			Icon:          "chart-bar",
			EstimatedTime: 20,
			Regeneratable: true,
		},
		{
			ID:            "user_stories",
			Title:         "用户故事",
			Description:   "核心场景和用户故事",
			Icon:          "book-open",
			EstimatedTime: 25,
			DependsOn:     []string{"user_research"},
			Regeneratable: true,
		},
		{
			ID:            "features",
			Title:         "功能需求",
			Description:   "功能列表和优先级",
			Icon:          "view-list",
			EstimatedTime: 30,
			DependsOn:     []string{"user_stories"},
			Regeneratable: true,
		},
		{
			ID:            "architecture",
			Title:         "信息架构",
			Description:   "产品结构和导航设计",
			Icon:          "template",
			EstimatedTime: 20,
			DependsOn:     []string{"features"},
			Regeneratable: true,
		},
		{
			ID:            "tech_requirements",
			Title:         "技术需求",
			Description:   "技术栈建议和开发要求",
			Icon:          "code",
			EstimatedTime: 20,
			Regeneratable: true,
		},
		{
			ID:            "roadmap",
			Title:         "开发路线图",
			Description:   "MVP规划和版本迭代计划",
			Icon:          "map",
			EstimatedTime: 20,
			DependsOn:     []string{"features"},
			Regeneratable: true,
		},
	}

	return entity.CreativeTemplate{
		ID:             uuid.New(),
		Name:           "PRD 文档生成器",
		Slug:           "prd-generator",
		Description:    "快速生成专业的产品需求文档，包含用户研究、功能设计、技术需求等",
		Icon:           "📋",
		Category:       entity.CreativeTemplateCategoryProduct,
		Tags:           entity.StringArray{"PRD", "产品需求", "产品设计", "MVP"},
		InputsRequired: toJSON(inputsRequired),
		InputsOptional: entity.JSON{},
		OutputSections: toJSON(outputSections),
		UsageCount:     0,
		Rating:         0,
		ReviewCount:    0,
		EstimatedTime:  200, // 3.3分钟
		IsOfficial:     true,
		IsFeatured:     true,
		IsPublished:    true,
		Version:        1,
		CreatedAt:      now,
		UpdatedAt:      now,
		PublishedAt:    &now,
	}
}

// viralTopicsGenerator 爆款选题生成器模板
func (s *TemplateSeeder) viralTopicsGenerator(now time.Time) entity.CreativeTemplate {
	inputsRequired := []entity.InputField{
		{
			ID:          "niche",
			Label:       "内容领域",
			Type:        "textarea",
			Placeholder: "例如：AI工具、职场成长、理财投资等",
			HelpText:    "你创作的主要领域",
			Validation: &entity.InputValidation{
				Required:  true,
				MinLength: 2,
				MaxLength: 200,
			},
		},
		{
			ID:    "platform",
			Label: "发布平台",
			Type:  "select",
			Options: []entity.SelectOption{
				{Value: "xiaohongshu", Label: "小红书"},
				{Value: "douyin", Label: "抖音"},
				{Value: "bilibili", Label: "B站"},
				{Value: "wechat", Label: "公众号"},
				{Value: "zhihu", Label: "知乎"},
			},
			DefaultValue: "xiaohongshu",
		},
		{
			ID:    "contentType",
			Label: "内容类型",
			Type:  "select",
			Options: []entity.SelectOption{
				{Value: "tutorial", Label: "教程干货"},
				{Value: "review", Label: "测评推荐"},
				{Value: "story", Label: "故事案例"},
				{Value: "opinion", Label: "观点输出"},
				{Value: "list", Label: "清单盘点"},
			},
			DefaultValue: "tutorial",
		},
	}

	outputSections := []entity.OutputSection{
		{
			ID:            "trending",
			Title:         "热点选题",
			Description:   "10个结合当前热点的选题",
			Icon:          "fire",
			EstimatedTime: 15,
			Regeneratable: true,
		},
		{
			ID:            "evergreen",
			Title:         "常青选题",
			Description:   "10个长期有效的经典选题",
			Icon:          "clock",
			EstimatedTime: 15,
			Regeneratable: true,
		},
		{
			ID:            "controversial",
			Title:         "争议选题",
			Description:   "5个容易引发讨论的选题",
			Icon:          "chat-alt-2",
			EstimatedTime: 10,
			Regeneratable: true,
		},
		{
			ID:            "practical",
			Title:         "干货选题",
			Description:   "10个实操性强的选题",
			Icon:          "academic-cap",
			EstimatedTime: 15,
			Regeneratable: true,
		},
		{
			ID:            "title_optimization",
			Title:         "标题优化",
			Description:   "每个选题的3种标题写法",
			Icon:          "sparkles",
			EstimatedTime: 20,
			DependsOn:     []string{"trending", "evergreen", "practical"},
			Regeneratable: true,
		},
	}

	return entity.CreativeTemplate{
		ID:             uuid.New(),
		Name:           "爆款选题生成器",
		Slug:           "viral-topics-generator",
		Description:    "一键生成35个爆款选题创意，包含热点、常青、争议、干货多种类型",
		Icon:           "🔥",
		Category:       entity.CreativeTemplateCategoryContent,
		Tags:           entity.StringArray{"选题", "爆款", "内容创作", "标题"},
		InputsRequired: toJSON(inputsRequired),
		InputsOptional: entity.JSON{},
		OutputSections: toJSON(outputSections),
		UsageCount:     0,
		Rating:         0,
		ReviewCount:    0,
		EstimatedTime:  90, // 1.5分钟
		IsOfficial:     true,
		IsFeatured:     true,
		IsPublished:    true,
		Version:        1,
		CreatedAt:      now,
		UpdatedAt:      now,
		PublishedAt:    &now,
	}
}

// SeedAllTemplates 播种所有模板（包括用户贡献的）
func (s *TemplateSeeder) SeedAllTemplates() error {
	// 先播种官方模板
	if err := s.SeedOfficialTemplates(); err != nil {
		return err
	}

	// 这里可以添加其他模板源

	return nil
}
