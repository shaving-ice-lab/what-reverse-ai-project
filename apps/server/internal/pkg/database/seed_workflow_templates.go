// Package database 提供数据库相关功能
package database

import (
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/pkg/logger"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// WorkflowTemplateSeeder 工作流模板种子数据播种器
type WorkflowTemplateSeeder struct {
	db  *gorm.DB
	log logger.Logger
}

// NewWorkflowTemplateSeeder 创建工作流模板种子数据播种器
func NewWorkflowTemplateSeeder(db *gorm.DB, log logger.Logger) *WorkflowTemplateSeeder {
	return &WorkflowTemplateSeeder{
		db:  db,
		log: log,
	}
}

// SeedOfficialWorkflowTemplates 播种官方工作流模板
func (s *WorkflowTemplateSeeder) SeedOfficialWorkflowTemplates() error {
	templates := s.getOfficialWorkflowTemplates()

	for _, t := range templates {
		// 检查是否已存在
		var existing entity.Template
		result := s.db.Where("slug = ?", t.Slug).First(&existing)
		if result.Error == nil {
			s.log.Info("Workflow template already exists, skipping", "slug", t.Slug)
			continue
		}

		// 创建模板
		if err := s.db.Create(&t).Error; err != nil {
			s.log.Error("Failed to create workflow template", "slug", t.Slug, "error", err)
			continue
		}

		s.log.Info("Created workflow template", "slug", t.Slug, "name", t.Name)
	}

	return nil
}

// getOfficialWorkflowTemplates 获取官方工作流模板列表（20个）
func (s *WorkflowTemplateSeeder) getOfficialWorkflowTemplates() []entity.Template {
	now := time.Now()
	return []entity.Template{
		// 1. 内容创作类
		s.articleSummaryGenerator(now),
		s.socialMediaGenerator(now),
		s.seoArticleWriter(now),
		s.adCopyGenerator(now),
		s.newsSummaryAggregator(now),

		// 2. 数据处理类
		s.jsonDataTransformer(now),
		s.csvDataAnalyzer(now),
		s.apiDataAggregator(now),
		s.userReviewAnalyzer(now),

		// 3. 客户服务类
		s.faqChatbot(now),
		s.ticketClassifier(now),
		s.emailAutoReply(now),

		// 4. 开发工具类
		s.codeReviewAssistant(now),
		s.apiDocGenerator(now),
		s.errorLogAnalyzer(now),

		// 5. 办公效率类
		s.meetingNotesGenerator(now),
		s.dailyWeeklyReport(now),
		s.competitorAnalysis(now),

		// 6. 教育学习类
		s.languageTranslator(now),
		s.studyNotesOrganizer(now),
	}
}

// ============= 1. 内容创作类模板 =============

// articleSummaryGenerator 文章摘要生成器
func (s *WorkflowTemplateSeeder) articleSummaryGenerator(now time.Time) entity.Template {
	return entity.Template{
		ID:          uuid.New(),
		Name:        "文章摘要生成器",
		Slug:        "article-summary-generator",
		Description: "智能提取文章要点，生成结构化摘要",
		LongDescription: `将长文章自动转换为精炼摘要。

**功能特点：**
- 自动提取核心观点
- 生成多种长度的摘要
- 保留关键数据和引用
- 支持多种文章类型

**适用场景：**
- 新闻简报制作
- 学术论文概述
- 报告快速阅读`,
		Category: "content",
		Tags:     entity.StringArray{"摘要", "内容提取", "文章处理", "AI写作"},
		Icon:     "📝",
		Definition: entity.JSON{
			"version": "1.0.0",
			"nodes": []map[string]interface{}{
				{
					"id":       "start",
					"type":     "start",
					"position": map[string]int{"x": 100, "y": 200},
					"data": map[string]interface{}{
						"label": "开始",
						"inputs": []map[string]interface{}{
							{"id": "article", "label": "文章内容", "type": "textarea", "required": true},
							{"id": "length", "label": "摘要长度", "type": "select", "options": []string{"短摘要(100字)", "中摘要(300字)", "长摘要(500字)"}, "default": "中摘要(300字)"},
						},
					},
				},
				{
					"id":       "extract_points",
					"type":     "llm",
					"position": map[string]int{"x": 400, "y": 200},
					"data": map[string]interface{}{
						"label": "提取要点",
						"config": map[string]interface{}{
							"model":       "gpt-4o-mini",
							"temperature": 0.3,
							"systemPrompt": "你是专业的内容分析师。请提取文章的核心要点。",
							"userPrompt":   "请分析以下文章，提取3-5个核心要点：\n\n{{start.article}}",
						},
					},
				},
				{
					"id":       "generate_summary",
					"type":     "llm",
					"position": map[string]int{"x": 700, "y": 200},
					"data": map[string]interface{}{
						"label": "生成摘要",
						"config": map[string]interface{}{
							"model":       "gpt-4o-mini",
							"temperature": 0.5,
							"systemPrompt": "你是专业的内容编辑。请根据要点生成流畅的摘要。",
							"userPrompt":   "基于以下要点，生成{{start.length}}的摘要：\n\n要点：{{extract_points.text}}",
						},
					},
				},
				{
					"id":       "end",
					"type":     "end",
					"position": map[string]int{"x": 1000, "y": 200},
					"data": map[string]interface{}{
						"label": "结束",
						"outputs": []map[string]interface{}{
							{"id": "summary", "label": "文章摘要", "source": "generate_summary.text"},
							{"id": "key_points", "label": "核心要点", "source": "extract_points.text"},
						},
					},
				},
			},
			"edges": []map[string]interface{}{
				{"id": "e1", "source": "start", "target": "extract_points"},
				{"id": "e2", "source": "extract_points", "target": "generate_summary"},
				{"id": "e3", "source": "generate_summary", "target": "end"},
			},
			"settings": map[string]interface{}{
				"timeout": 120000,
			},
		},
		Variables:     entity.JSON{},
		InputSchema:   entity.JSON{},
		Difficulty:    "beginner",
		EstimatedTime: 2,
		NodeCount:     4,
		IsFeatured:    true,
		IsOfficial:    true,
		IsPublished:   true,
		PublishedAt:   &now,
		CreatedAt:     now,
		UpdatedAt:     now,
	}
}

// socialMediaGenerator 社交媒体内容生成
func (s *WorkflowTemplateSeeder) socialMediaGenerator(now time.Time) entity.Template {
	return entity.Template{
		ID:          uuid.New(),
		Name:        "社交媒体内容生成",
		Slug:        "social-media-generator",
		Description: "一键生成多平台社交媒体内容",
		LongDescription: `根据主题自动生成适配各平台的社媒内容。

**支持平台：**
- 小红书/抖音
- 微信公众号
- 微博/Twitter
- LinkedIn

**输出内容：**
- 吸引眼球的标题
- 平台优化的正文
- 热门标签推荐`,
		Category: "content",
		Tags:     entity.StringArray{"社媒", "内容创作", "小红书", "抖音", "营销"},
		Icon:     "📱",
		Definition: entity.JSON{
			"version": "1.0.0",
			"nodes": []map[string]interface{}{
				{
					"id":       "start",
					"type":     "start",
					"position": map[string]int{"x": 100, "y": 200},
					"data": map[string]interface{}{
						"label": "开始",
						"inputs": []map[string]interface{}{
							{"id": "topic", "label": "内容主题", "type": "textarea", "required": true},
							{"id": "platform", "label": "目标平台", "type": "select", "options": []string{"小红书", "抖音", "微信公众号", "微博", "LinkedIn"}, "default": "小红书"},
							{"id": "tone", "label": "内容风格", "type": "select", "options": []string{"专业严谨", "轻松活泼", "幽默诙谐", "温暖治愈"}, "default": "轻松活泼"},
						},
					},
				},
				{
					"id":       "generate_content",
					"type":     "llm",
					"position": map[string]int{"x": 400, "y": 200},
					"data": map[string]interface{}{
						"label": "生成内容",
						"config": map[string]interface{}{
							"model":       "gpt-4o-mini",
							"temperature": 0.8,
							"systemPrompt": "你是资深社媒运营专家，擅长创作爆款内容。",
							"userPrompt":   "请为{{start.platform}}平台创作关于「{{start.topic}}」的内容。\n\n风格要求：{{start.tone}}\n\n请输出：\n1. 3个吸引眼球的标题\n2. 正文内容（适配平台特点）\n3. 5个热门标签",
						},
					},
				},
				{
					"id":       "end",
					"type":     "end",
					"position": map[string]int{"x": 700, "y": 200},
					"data": map[string]interface{}{
						"label": "结束",
						"outputs": []map[string]interface{}{
							{"id": "content", "label": "社媒内容", "source": "generate_content.text"},
						},
					},
				},
			},
			"edges": []map[string]interface{}{
				{"id": "e1", "source": "start", "target": "generate_content"},
				{"id": "e2", "source": "generate_content", "target": "end"},
			},
			"settings": map[string]interface{}{
				"timeout": 60000,
			},
		},
		Variables:     entity.JSON{},
		InputSchema:   entity.JSON{},
		Difficulty:    "beginner",
		EstimatedTime: 1,
		NodeCount:     3,
		IsFeatured:    true,
		IsOfficial:    true,
		IsPublished:   true,
		PublishedAt:   &now,
		CreatedAt:     now,
		UpdatedAt:     now,
	}
}

// seoArticleWriter SEO文章写作
func (s *WorkflowTemplateSeeder) seoArticleWriter(now time.Time) entity.Template {
	return entity.Template{
		ID:          uuid.New(),
		Name:        "SEO 文章写作",
		Slug:        "seo-article-writer",
		Description: "生成搜索引擎优化的高质量文章",
		LongDescription: `创作符合SEO规范的专业文章。

**优化特点：**
- 关键词密度优化
- 标题结构优化
- 内链外链建议
- 元描述生成

**适用场景：**
- 企业博客
- 产品介绍
- 行业资讯`,
		Category: "content",
		Tags:     entity.StringArray{"SEO", "文章写作", "内容营销", "搜索优化"},
		Icon:     "🔍",
		Definition: entity.JSON{
			"version": "1.0.0",
			"nodes": []map[string]interface{}{
				{
					"id":       "start",
					"type":     "start",
					"position": map[string]int{"x": 100, "y": 200},
					"data": map[string]interface{}{
						"label": "开始",
						"inputs": []map[string]interface{}{
							{"id": "topic", "label": "文章主题", "type": "text", "required": true},
							{"id": "keywords", "label": "目标关键词", "type": "text", "required": true},
							{"id": "wordCount", "label": "字数要求", "type": "select", "options": []string{"800字", "1500字", "3000字"}, "default": "1500字"},
						},
					},
				},
				{
					"id":       "outline",
					"type":     "llm",
					"position": map[string]int{"x": 400, "y": 100},
					"data": map[string]interface{}{
						"label": "生成大纲",
						"config": map[string]interface{}{
							"model":       "gpt-4o-mini",
							"temperature": 0.5,
							"systemPrompt": "你是SEO专家，擅长规划文章结构。",
							"userPrompt":   "为主题「{{start.topic}}」创建SEO优化的文章大纲。\n关键词：{{start.keywords}}\n目标字数：{{start.wordCount}}",
						},
					},
				},
				{
					"id":       "write_article",
					"type":     "llm",
					"position": map[string]int{"x": 700, "y": 100},
					"data": map[string]interface{}{
						"label": "撰写文章",
						"config": map[string]interface{}{
							"model":       "gpt-4o",
							"temperature": 0.7,
							"systemPrompt": "你是专业的SEO内容作家。",
							"userPrompt":   "根据以下大纲撰写SEO优化文章：\n\n{{outline.text}}\n\n要求：\n1. 自然融入关键词「{{start.keywords}}」\n2. 使用H2、H3标题结构\n3. 目标字数约{{start.wordCount}}",
						},
					},
				},
				{
					"id":       "meta_desc",
					"type":     "llm",
					"position": map[string]int{"x": 700, "y": 300},
					"data": map[string]interface{}{
						"label": "生成元描述",
						"config": map[string]interface{}{
							"model":       "gpt-4o-mini",
							"temperature": 0.3,
							"systemPrompt": "你是SEO专家。",
							"userPrompt":   "为以下文章生成SEO元描述（150字以内）：\n\n{{write_article.text}}",
						},
					},
				},
				{
					"id":       "end",
					"type":     "end",
					"position": map[string]int{"x": 1000, "y": 200},
					"data": map[string]interface{}{
						"label": "结束",
						"outputs": []map[string]interface{}{
							{"id": "article", "label": "SEO文章", "source": "write_article.text"},
							{"id": "metaDesc", "label": "元描述", "source": "meta_desc.text"},
							{"id": "outline", "label": "文章大纲", "source": "outline.text"},
						},
					},
				},
			},
			"edges": []map[string]interface{}{
				{"id": "e1", "source": "start", "target": "outline"},
				{"id": "e2", "source": "outline", "target": "write_article"},
				{"id": "e3", "source": "outline", "target": "meta_desc"},
				{"id": "e4", "source": "write_article", "target": "end"},
				{"id": "e5", "source": "meta_desc", "target": "end"},
			},
			"settings": map[string]interface{}{
				"timeout": 180000,
			},
		},
		Variables:     entity.JSON{},
		InputSchema:   entity.JSON{},
		Difficulty:    "intermediate",
		EstimatedTime: 5,
		NodeCount:     5,
		IsFeatured:    true,
		IsOfficial:    true,
		IsPublished:   true,
		PublishedAt:   &now,
		CreatedAt:     now,
		UpdatedAt:     now,
	}
}

// adCopyGenerator 广告文案生成
func (s *WorkflowTemplateSeeder) adCopyGenerator(now time.Time) entity.Template {
	return entity.Template{
		ID:          uuid.New(),
		Name:        "广告文案生成",
		Slug:        "ad-copy-generator",
		Description: "快速生成高转化率的广告文案",
		LongDescription: `根据产品特点生成吸引眼球的广告文案。

**支持类型：**
- 信息流广告
- 搜索广告
- 社交媒体广告
- 落地页文案

**输出包含：**
- 多版本标题
- 正文内容
- CTA按钮文案`,
		Category: "marketing",
		Tags:     entity.StringArray{"广告", "文案", "营销", "转化", "投放"},
		Icon:     "📢",
		Definition: entity.JSON{
			"version": "1.0.0",
			"nodes": []map[string]interface{}{
				{
					"id":       "start",
					"type":     "start",
					"position": map[string]int{"x": 100, "y": 200},
					"data": map[string]interface{}{
						"label": "开始",
						"inputs": []map[string]interface{}{
							{"id": "product", "label": "产品/服务名称", "type": "text", "required": true},
							{"id": "features", "label": "核心卖点", "type": "textarea", "required": true},
							{"id": "audience", "label": "目标人群", "type": "text"},
							{"id": "adType", "label": "广告类型", "type": "select", "options": []string{"信息流", "搜索广告", "朋友圈", "落地页"}},
						},
					},
				},
				{
					"id":       "generate_copies",
					"type":     "llm",
					"position": map[string]int{"x": 400, "y": 200},
					"data": map[string]interface{}{
						"label": "生成文案",
						"config": map[string]interface{}{
							"model":       "gpt-4o",
							"temperature": 0.8,
							"systemPrompt": "你是顶级广告创意总监，擅长创作高转化文案。",
							"userPrompt":   "为「{{start.product}}」创作{{start.adType}}广告文案。\n\n核心卖点：{{start.features}}\n目标人群：{{start.audience}}\n\n请生成：\n1. 5个吸引点击的标题\n2. 3个版本的正文\n3. 3个CTA按钮文案",
						},
					},
				},
				{
					"id":       "end",
					"type":     "end",
					"position": map[string]int{"x": 700, "y": 200},
					"data": map[string]interface{}{
						"label": "结束",
						"outputs": []map[string]interface{}{
							{"id": "copies", "label": "广告文案", "source": "generate_copies.text"},
						},
					},
				},
			},
			"edges": []map[string]interface{}{
				{"id": "e1", "source": "start", "target": "generate_copies"},
				{"id": "e2", "source": "generate_copies", "target": "end"},
			},
			"settings": map[string]interface{}{
				"timeout": 60000,
			},
		},
		Variables:     entity.JSON{},
		InputSchema:   entity.JSON{},
		Difficulty:    "beginner",
		EstimatedTime: 2,
		NodeCount:     3,
		IsFeatured:    false,
		IsOfficial:    true,
		IsPublished:   true,
		PublishedAt:   &now,
		CreatedAt:     now,
		UpdatedAt:     now,
	}
}

// newsSummaryAggregator 新闻摘要聚合
func (s *WorkflowTemplateSeeder) newsSummaryAggregator(now time.Time) entity.Template {
	return entity.Template{
		ID:          uuid.New(),
		Name:        "新闻摘要聚合",
		Slug:        "news-summary-aggregator",
		Description: "聚合多源新闻并生成结构化简报",
		LongDescription: `自动收集、整理和摘要行业新闻。

**功能特点：**
- 多源信息聚合
- 智能去重
- 重要性排序
- 结构化输出

**适用场景：**
- 每日行业简报
- 竞品动态追踪
- 市场情报收集`,
		Category: "content",
		Tags:     entity.StringArray{"新闻", "资讯", "聚合", "简报", "情报"},
		Icon:     "📰",
		Definition: entity.JSON{
			"version": "1.0.0",
			"nodes": []map[string]interface{}{
				{
					"id":       "start",
					"type":     "start",
					"position": map[string]int{"x": 100, "y": 200},
					"data": map[string]interface{}{
						"label": "开始",
						"inputs": []map[string]interface{}{
							{"id": "topic", "label": "关注领域/关键词", "type": "text", "required": true},
							{"id": "timeRange", "label": "时间范围", "type": "select", "options": []string{"今日", "本周", "本月"}},
							{"id": "count", "label": "新闻数量", "type": "select", "options": []string{"5条", "10条", "20条"}, "default": "10条"},
						},
					},
				},
				{
					"id":       "search_news",
					"type":     "web_search",
					"position": map[string]int{"x": 400, "y": 200},
					"data": map[string]interface{}{
						"label": "搜索新闻",
						"config": map[string]interface{}{
							"query":      "{{start.topic}} 最新新闻 {{start.timeRange}}",
							"maxResults": 15,
						},
					},
				},
				{
					"id":       "summarize",
					"type":     "llm",
					"position": map[string]int{"x": 700, "y": 200},
					"data": map[string]interface{}{
						"label": "生成简报",
						"config": map[string]interface{}{
							"model":       "gpt-4o-mini",
							"temperature": 0.3,
							"systemPrompt": "你是专业的新闻编辑，擅长整理和摘要新闻。",
							"userPrompt":   "请将以下新闻整理成结构化简报，选取最重要的{{start.count}}条：\n\n{{search_news.results}}\n\n输出格式：\n1. 今日要闻（最重要的3条）\n2. 行业动态\n3. 趋势分析",
						},
					},
				},
				{
					"id":       "end",
					"type":     "end",
					"position": map[string]int{"x": 1000, "y": 200},
					"data": map[string]interface{}{
						"label": "结束",
						"outputs": []map[string]interface{}{
							{"id": "briefing", "label": "新闻简报", "source": "summarize.text"},
						},
					},
				},
			},
			"edges": []map[string]interface{}{
				{"id": "e1", "source": "start", "target": "search_news"},
				{"id": "e2", "source": "search_news", "target": "summarize"},
				{"id": "e3", "source": "summarize", "target": "end"},
			},
			"settings": map[string]interface{}{
				"timeout": 120000,
			},
		},
		Variables:     entity.JSON{},
		InputSchema:   entity.JSON{},
		Difficulty:    "intermediate",
		EstimatedTime: 3,
		NodeCount:     4,
		IsFeatured:    true,
		IsOfficial:    true,
		IsPublished:   true,
		PublishedAt:   &now,
		CreatedAt:     now,
		UpdatedAt:     now,
	}
}

// ============= 2. 数据处理类模板 =============

// jsonDataTransformer JSON数据转换
func (s *WorkflowTemplateSeeder) jsonDataTransformer(now time.Time) entity.Template {
	return entity.Template{
		ID:          uuid.New(),
		Name:        "JSON 数据转换",
		Slug:        "json-data-transformer",
		Description: "智能转换和处理JSON数据结构",
		LongDescription: `使用AI智能转换JSON数据格式。

**支持操作：**
- 结构重塑
- 字段映射
- 数据清洗
- 格式转换

**适用场景：**
- API数据适配
- 数据迁移
- 格式标准化`,
		Category: "data",
		Tags:     entity.StringArray{"JSON", "数据转换", "API", "格式化"},
		Icon:     "🔄",
		Definition: entity.JSON{
			"version": "1.0.0",
			"nodes": []map[string]interface{}{
				{
					"id":       "start",
					"type":     "start",
					"position": map[string]int{"x": 100, "y": 200},
					"data": map[string]interface{}{
						"label": "开始",
						"inputs": []map[string]interface{}{
							{"id": "sourceJson", "label": "源JSON数据", "type": "textarea", "required": true},
							{"id": "targetFormat", "label": "目标格式描述", "type": "textarea", "required": true},
						},
					},
				},
				{
					"id":       "analyze",
					"type":     "llm",
					"position": map[string]int{"x": 400, "y": 200},
					"data": map[string]interface{}{
						"label": "分析结构",
						"config": map[string]interface{}{
							"model":       "gpt-4o-mini",
							"temperature": 0.1,
							"systemPrompt": "你是数据工程师，精通JSON数据处理。",
							"userPrompt":   "分析以下JSON结构并生成转换代码：\n\n源数据：{{start.sourceJson}}\n\n目标格式：{{start.targetFormat}}\n\n请输出JavaScript转换函数。",
						},
					},
				},
				{
					"id":       "transform",
					"type":     "code",
					"position": map[string]int{"x": 700, "y": 200},
					"data": map[string]interface{}{
						"label": "执行转换",
						"config": map[string]interface{}{
							"language": "javascript",
							"code":     "// 解析源数据\nconst source = JSON.parse(inputs.sourceJson);\n// AI生成的转换逻辑会在这里执行\nreturn { result: source };",
						},
					},
				},
				{
					"id":       "end",
					"type":     "end",
					"position": map[string]int{"x": 1000, "y": 200},
					"data": map[string]interface{}{
						"label": "结束",
						"outputs": []map[string]interface{}{
							{"id": "result", "label": "转换结果", "source": "transform.result"},
							{"id": "code", "label": "转换代码", "source": "analyze.text"},
						},
					},
				},
			},
			"edges": []map[string]interface{}{
				{"id": "e1", "source": "start", "target": "analyze"},
				{"id": "e2", "source": "analyze", "target": "transform"},
				{"id": "e3", "source": "transform", "target": "end"},
			},
			"settings": map[string]interface{}{
				"timeout": 60000,
			},
		},
		Variables:     entity.JSON{},
		InputSchema:   entity.JSON{},
		Difficulty:    "intermediate",
		EstimatedTime: 2,
		NodeCount:     4,
		IsFeatured:    false,
		IsOfficial:    true,
		IsPublished:   true,
		PublishedAt:   &now,
		CreatedAt:     now,
		UpdatedAt:     now,
	}
}

// csvDataAnalyzer CSV数据分析
func (s *WorkflowTemplateSeeder) csvDataAnalyzer(now time.Time) entity.Template {
	return entity.Template{
		ID:          uuid.New(),
		Name:        "CSV 数据分析",
		Slug:        "csv-data-analyzer",
		Description: "智能分析CSV数据并生成洞察报告",
		LongDescription: `上传CSV数据，自动进行数据分析。

**分析内容：**
- 数据概览
- 统计指标
- 趋势分析
- 异常检测

**输出报告：**
- 可视化图表描述
- 关键发现
- 行动建议`,
		Category: "data",
		Tags:     entity.StringArray{"CSV", "数据分析", "报表", "统计"},
		Icon:     "📊",
		Definition: entity.JSON{
			"version": "1.0.0",
			"nodes": []map[string]interface{}{
				{
					"id":       "start",
					"type":     "start",
					"position": map[string]int{"x": 100, "y": 200},
					"data": map[string]interface{}{
						"label": "开始",
						"inputs": []map[string]interface{}{
							{"id": "csvData", "label": "CSV数据", "type": "textarea", "required": true},
							{"id": "question", "label": "分析问题", "type": "text", "placeholder": "例如：销售趋势如何？"},
						},
					},
				},
				{
					"id":       "analyze",
					"type":     "llm",
					"position": map[string]int{"x": 400, "y": 200},
					"data": map[string]interface{}{
						"label": "数据分析",
						"config": map[string]interface{}{
							"model":       "gpt-4o",
							"temperature": 0.2,
							"systemPrompt": "你是数据分析师，擅长从数据中发现洞察。",
							"userPrompt":   "请分析以下CSV数据：\n\n{{start.csvData}}\n\n分析问题：{{start.question}}\n\n请提供：\n1. 数据概览\n2. 关键统计指标\n3. 趋势和模式\n4. 异常值\n5. 行动建议",
						},
					},
				},
				{
					"id":       "end",
					"type":     "end",
					"position": map[string]int{"x": 700, "y": 200},
					"data": map[string]interface{}{
						"label": "结束",
						"outputs": []map[string]interface{}{
							{"id": "report", "label": "分析报告", "source": "analyze.text"},
						},
					},
				},
			},
			"edges": []map[string]interface{}{
				{"id": "e1", "source": "start", "target": "analyze"},
				{"id": "e2", "source": "analyze", "target": "end"},
			},
			"settings": map[string]interface{}{
				"timeout": 120000,
			},
		},
		Variables:     entity.JSON{},
		InputSchema:   entity.JSON{},
		Difficulty:    "intermediate",
		EstimatedTime: 3,
		NodeCount:     3,
		IsFeatured:    true,
		IsOfficial:    true,
		IsPublished:   true,
		PublishedAt:   &now,
		CreatedAt:     now,
		UpdatedAt:     now,
	}
}

// apiDataAggregator API数据聚合
func (s *WorkflowTemplateSeeder) apiDataAggregator(now time.Time) entity.Template {
	return entity.Template{
		ID:          uuid.New(),
		Name:        "API 数据聚合",
		Slug:        "api-data-aggregator",
		Description: "聚合多个API数据源并统一处理",
		LongDescription: `从多个API获取数据并智能聚合。

**功能特点：**
- 并行请求多个API
- 数据标准化
- 智能合并
- 冲突处理

**适用场景：**
- 数据整合
- 报表生成
- 监控面板`,
		Category: "data",
		Tags:     entity.StringArray{"API", "数据聚合", "集成", "自动化"},
		Icon:     "🔗",
		Definition: entity.JSON{
			"version": "1.0.0",
			"nodes": []map[string]interface{}{
				{
					"id":       "start",
					"type":     "start",
					"position": map[string]int{"x": 100, "y": 200},
					"data": map[string]interface{}{
						"label": "开始",
						"inputs": []map[string]interface{}{
							{"id": "apis", "label": "API配置(JSON)", "type": "textarea", "required": true, "placeholder": "[{\"url\":\"...\",\"method\":\"GET\"}]"},
							{"id": "mergeStrategy", "label": "合并策略", "type": "select", "options": []string{"合并所有", "取最新", "去重合并"}},
						},
					},
				},
				{
					"id":       "fetch_data",
					"type":     "http",
					"position": map[string]int{"x": 400, "y": 200},
					"data": map[string]interface{}{
						"label": "请求API",
						"config": map[string]interface{}{
							"parallel": true,
						},
					},
				},
				{
					"id":       "merge",
					"type":     "llm",
					"position": map[string]int{"x": 700, "y": 200},
					"data": map[string]interface{}{
						"label": "智能聚合",
						"config": map[string]interface{}{
							"model":       "gpt-4o-mini",
							"temperature": 0.1,
							"systemPrompt": "你是数据工程师，擅长数据处理和聚合。",
							"userPrompt":   "请按照{{start.mergeStrategy}}策略合并以下数据：\n\n{{fetch_data.results}}\n\n输出统一格式的JSON。",
						},
					},
				},
				{
					"id":       "end",
					"type":     "end",
					"position": map[string]int{"x": 1000, "y": 200},
					"data": map[string]interface{}{
						"label": "结束",
						"outputs": []map[string]interface{}{
							{"id": "data", "label": "聚合数据", "source": "merge.text"},
						},
					},
				},
			},
			"edges": []map[string]interface{}{
				{"id": "e1", "source": "start", "target": "fetch_data"},
				{"id": "e2", "source": "fetch_data", "target": "merge"},
				{"id": "e3", "source": "merge", "target": "end"},
			},
			"settings": map[string]interface{}{
				"timeout": 120000,
			},
		},
		Variables:     entity.JSON{},
		InputSchema:   entity.JSON{},
		Difficulty:    "advanced",
		EstimatedTime: 3,
		NodeCount:     4,
		IsFeatured:    false,
		IsOfficial:    true,
		IsPublished:   true,
		PublishedAt:   &now,
		CreatedAt:     now,
		UpdatedAt:     now,
	}
}

// userReviewAnalyzer 用户评论分析
func (s *WorkflowTemplateSeeder) userReviewAnalyzer(now time.Time) entity.Template {
	return entity.Template{
		ID:          uuid.New(),
		Name:        "用户评论分析",
		Slug:        "user-review-analyzer",
		Description: "批量分析用户评论，提取情感和关键洞察",
		LongDescription: `智能分析用户评论和反馈。

**分析维度：**
- 情感倾向
- 主题分类
- 关键词提取
- 改进建议

**输出报告：**
- 情感分布
- 热点问题
- 用户诉求排序`,
		Category: "data",
		Tags:     entity.StringArray{"评论分析", "情感分析", "用户反馈", "NLP"},
		Icon:     "💬",
		Definition: entity.JSON{
			"version": "1.0.0",
			"nodes": []map[string]interface{}{
				{
					"id":       "start",
					"type":     "start",
					"position": map[string]int{"x": 100, "y": 200},
					"data": map[string]interface{}{
						"label": "开始",
						"inputs": []map[string]interface{}{
							{"id": "reviews", "label": "用户评论", "type": "textarea", "required": true},
							{"id": "productName", "label": "产品/服务名称", "type": "text"},
						},
					},
				},
				{
					"id":       "analyze",
					"type":     "llm",
					"position": map[string]int{"x": 400, "y": 200},
					"data": map[string]interface{}{
						"label": "分析评论",
						"config": map[string]interface{}{
							"model":       "gpt-4o",
							"temperature": 0.2,
							"systemPrompt": "你是用户研究专家，擅长分析用户反馈。",
							"userPrompt":   "请分析以下关于「{{start.productName}}」的用户评论：\n\n{{start.reviews}}\n\n输出：\n1. 情感分布（正面/中性/负面百分比）\n2. 主要好评点（TOP5）\n3. 主要差评点（TOP5）\n4. 高频关键词\n5. 改进建议优先级",
						},
					},
				},
				{
					"id":       "end",
					"type":     "end",
					"position": map[string]int{"x": 700, "y": 200},
					"data": map[string]interface{}{
						"label": "结束",
						"outputs": []map[string]interface{}{
							{"id": "analysis", "label": "分析报告", "source": "analyze.text"},
						},
					},
				},
			},
			"edges": []map[string]interface{}{
				{"id": "e1", "source": "start", "target": "analyze"},
				{"id": "e2", "source": "analyze", "target": "end"},
			},
			"settings": map[string]interface{}{
				"timeout": 120000,
			},
		},
		Variables:     entity.JSON{},
		InputSchema:   entity.JSON{},
		Difficulty:    "intermediate",
		EstimatedTime: 3,
		NodeCount:     3,
		IsFeatured:    true,
		IsOfficial:    true,
		IsPublished:   true,
		PublishedAt:   &now,
		CreatedAt:     now,
		UpdatedAt:     now,
	}
}

// ============= 3. 客户服务类模板 =============

// faqChatbot FAQ问答机器人
func (s *WorkflowTemplateSeeder) faqChatbot(now time.Time) entity.Template {
	return entity.Template{
		ID:          uuid.New(),
		Name:        "FAQ 问答机器人",
		Slug:        "faq-chatbot",
		Description: "基于知识库的智能问答系统",
		LongDescription: `构建智能FAQ问答系统。

**功能特点：**
- 知识库检索
- 语义理解
- 精准回答
- 相关推荐

**适用场景：**
- 客服自动化
- 产品答疑
- 内部知识库`,
		Category: "customer",
		Tags:     entity.StringArray{"FAQ", "问答", "客服", "知识库", "AI"},
		Icon:     "🤖",
		Definition: entity.JSON{
			"version": "1.0.0",
			"nodes": []map[string]interface{}{
				{
					"id":       "start",
					"type":     "start",
					"position": map[string]int{"x": 100, "y": 200},
					"data": map[string]interface{}{
						"label": "开始",
						"inputs": []map[string]interface{}{
							{"id": "question", "label": "用户问题", "type": "text", "required": true},
							{"id": "knowledgeBase", "label": "知识库内容", "type": "textarea", "required": true},
						},
					},
				},
				{
					"id":       "match",
					"type":     "llm",
					"position": map[string]int{"x": 400, "y": 200},
					"data": map[string]interface{}{
						"label": "匹配问题",
						"config": map[string]interface{}{
							"model":       "gpt-4o-mini",
							"temperature": 0.1,
							"systemPrompt": "你是智能客服助手，请根据知识库内容回答用户问题。",
							"userPrompt":   "知识库：\n{{start.knowledgeBase}}\n\n用户问题：{{start.question}}\n\n请提供：\n1. 准确回答\n2. 相关问题推荐（3个）",
						},
					},
				},
				{
					"id":       "end",
					"type":     "end",
					"position": map[string]int{"x": 700, "y": 200},
					"data": map[string]interface{}{
						"label": "结束",
						"outputs": []map[string]interface{}{
							{"id": "answer", "label": "回答内容", "source": "match.text"},
						},
					},
				},
			},
			"edges": []map[string]interface{}{
				{"id": "e1", "source": "start", "target": "match"},
				{"id": "e2", "source": "match", "target": "end"},
			},
			"settings": map[string]interface{}{
				"timeout": 30000,
			},
		},
		Variables:     entity.JSON{},
		InputSchema:   entity.JSON{},
		Difficulty:    "beginner",
		EstimatedTime: 1,
		NodeCount:     3,
		IsFeatured:    true,
		IsOfficial:    true,
		IsPublished:   true,
		PublishedAt:   &now,
		CreatedAt:     now,
		UpdatedAt:     now,
	}
}

// ticketClassifier 工单自动分类
func (s *WorkflowTemplateSeeder) ticketClassifier(now time.Time) entity.Template {
	return entity.Template{
		ID:          uuid.New(),
		Name:        "工单自动分类",
		Slug:        "ticket-classifier",
		Description: "智能分析工单内容并自动分类分派",
		LongDescription: `自动化工单处理流程。

**功能特点：**
- 内容理解
- 紧急程度判断
- 类别分类
- 自动分派建议

**输出信息：**
- 工单类别
- 优先级
- 建议处理人
- 预估处理时间`,
		Category: "customer",
		Tags:     entity.StringArray{"工单", "分类", "客服", "自动化", "ITSM"},
		Icon:     "📋",
		Definition: entity.JSON{
			"version": "1.0.0",
			"nodes": []map[string]interface{}{
				{
					"id":       "start",
					"type":     "start",
					"position": map[string]int{"x": 100, "y": 200},
					"data": map[string]interface{}{
						"label": "开始",
						"inputs": []map[string]interface{}{
							{"id": "ticketContent", "label": "工单内容", "type": "textarea", "required": true},
							{"id": "categories", "label": "分类选项", "type": "textarea", "placeholder": "技术支持, 账单问题, 产品咨询, 投诉建议"},
						},
					},
				},
				{
					"id":       "classify",
					"type":     "llm",
					"position": map[string]int{"x": 400, "y": 200},
					"data": map[string]interface{}{
						"label": "分析分类",
						"config": map[string]interface{}{
							"model":       "gpt-4o-mini",
							"temperature": 0.1,
							"systemPrompt": "你是工单处理专家，擅长分析和分类客户问题。",
							"userPrompt":   "请分析以下工单并分类：\n\n工单内容：{{start.ticketContent}}\n\n可选分类：{{start.categories}}\n\n请输出JSON格式：\n{\n  \"category\": \"分类\",\n  \"priority\": \"高/中/低\",\n  \"summary\": \"一句话摘要\",\n  \"suggestedTeam\": \"建议处理团队\",\n  \"estimatedTime\": \"预估处理时间\"\n}",
						},
					},
				},
				{
					"id":       "end",
					"type":     "end",
					"position": map[string]int{"x": 700, "y": 200},
					"data": map[string]interface{}{
						"label": "结束",
						"outputs": []map[string]interface{}{
							{"id": "result", "label": "分类结果", "source": "classify.text"},
						},
					},
				},
			},
			"edges": []map[string]interface{}{
				{"id": "e1", "source": "start", "target": "classify"},
				{"id": "e2", "source": "classify", "target": "end"},
			},
			"settings": map[string]interface{}{
				"timeout": 30000,
			},
		},
		Variables:     entity.JSON{},
		InputSchema:   entity.JSON{},
		Difficulty:    "intermediate",
		EstimatedTime: 1,
		NodeCount:     3,
		IsFeatured:    false,
		IsOfficial:    true,
		IsPublished:   true,
		PublishedAt:   &now,
		CreatedAt:     now,
		UpdatedAt:     now,
	}
}

// emailAutoReply 邮件自动回复
func (s *WorkflowTemplateSeeder) emailAutoReply(now time.Time) entity.Template {
	return entity.Template{
		ID:          uuid.New(),
		Name:        "邮件自动回复",
		Slug:        "email-auto-reply",
		Description: "智能分析邮件内容并生成专业回复",
		LongDescription: `自动化邮件回复流程。

**功能特点：**
- 理解邮件意图
- 情感识别
- 专业回复生成
- 多语言支持

**适用场景：**
- 客户邮件
- 商务沟通
- 咨询答复`,
		Category: "productivity",
		Tags:     entity.StringArray{"邮件", "自动回复", "客服", "效率", "沟通"},
		Icon:     "📧",
		Definition: entity.JSON{
			"version": "1.0.0",
			"nodes": []map[string]interface{}{
				{
					"id":       "start",
					"type":     "start",
					"position": map[string]int{"x": 100, "y": 200},
					"data": map[string]interface{}{
						"label": "开始",
						"inputs": []map[string]interface{}{
							{"id": "email", "label": "收到的邮件", "type": "textarea", "required": true},
							{"id": "context", "label": "背景信息", "type": "textarea", "placeholder": "产品介绍、公司信息等"},
							{"id": "tone", "label": "回复风格", "type": "select", "options": []string{"正式专业", "友好亲切", "简洁明了"}},
						},
					},
				},
				{
					"id":       "analyze",
					"type":     "llm",
					"position": map[string]int{"x": 400, "y": 100},
					"data": map[string]interface{}{
						"label": "分析邮件",
						"config": map[string]interface{}{
							"model":       "gpt-4o-mini",
							"temperature": 0.2,
							"systemPrompt": "分析邮件的核心诉求和情感倾向。",
							"userPrompt":   "分析以下邮件：\n{{start.email}}\n\n输出：主要诉求、情感倾向、紧急程度",
						},
					},
				},
				{
					"id":       "generate_reply",
					"type":     "llm",
					"position": map[string]int{"x": 700, "y": 200},
					"data": map[string]interface{}{
						"label": "生成回复",
						"config": map[string]interface{}{
							"model":       "gpt-4o",
							"temperature": 0.6,
							"systemPrompt": "你是专业的商务邮件写手。",
							"userPrompt":   "请为以下邮件撰写{{start.tone}}风格的回复：\n\n原邮件：{{start.email}}\n\n分析结果：{{analyze.text}}\n\n背景信息：{{start.context}}",
						},
					},
				},
				{
					"id":       "end",
					"type":     "end",
					"position": map[string]int{"x": 1000, "y": 200},
					"data": map[string]interface{}{
						"label": "结束",
						"outputs": []map[string]interface{}{
							{"id": "reply", "label": "回复邮件", "source": "generate_reply.text"},
							{"id": "analysis", "label": "邮件分析", "source": "analyze.text"},
						},
					},
				},
			},
			"edges": []map[string]interface{}{
				{"id": "e1", "source": "start", "target": "analyze"},
				{"id": "e2", "source": "analyze", "target": "generate_reply"},
				{"id": "e3", "source": "generate_reply", "target": "end"},
			},
			"settings": map[string]interface{}{
				"timeout": 60000,
			},
		},
		Variables:     entity.JSON{},
		InputSchema:   entity.JSON{},
		Difficulty:    "beginner",
		EstimatedTime: 2,
		NodeCount:     4,
		IsFeatured:    true,
		IsOfficial:    true,
		IsPublished:   true,
		PublishedAt:   &now,
		CreatedAt:     now,
		UpdatedAt:     now,
	}
}

// ============= 4. 开发工具类模板 =============

// codeReviewAssistant 代码审查助手
func (s *WorkflowTemplateSeeder) codeReviewAssistant(now time.Time) entity.Template {
	return entity.Template{
		ID:          uuid.New(),
		Name:        "代码审查助手",
		Slug:        "code-review-assistant",
		Description: "自动进行代码审查并提供改进建议",
		LongDescription: `AI辅助代码审查。

**审查维度：**
- 代码质量
- 性能问题
- 安全漏洞
- 最佳实践

**输出内容：**
- 问题列表
- 改进建议
- 重构方案`,
		Category: "developer",
		Tags:     entity.StringArray{"代码审查", "Code Review", "开发", "质量"},
		Icon:     "💻",
		Definition: entity.JSON{
			"version": "1.0.0",
			"nodes": []map[string]interface{}{
				{
					"id":       "start",
					"type":     "start",
					"position": map[string]int{"x": 100, "y": 200},
					"data": map[string]interface{}{
						"label": "开始",
						"inputs": []map[string]interface{}{
							{"id": "code", "label": "代码内容", "type": "textarea", "required": true},
							{"id": "language", "label": "编程语言", "type": "select", "options": []string{"JavaScript", "TypeScript", "Python", "Go", "Java", "C++", "其他"}},
							{"id": "focus", "label": "关注重点", "type": "select", "options": []string{"全面审查", "性能优化", "安全审查", "代码风格"}},
						},
					},
				},
				{
					"id":       "review",
					"type":     "llm",
					"position": map[string]int{"x": 400, "y": 200},
					"data": map[string]interface{}{
						"label": "代码审查",
						"config": map[string]interface{}{
							"model":       "gpt-4o",
							"temperature": 0.2,
							"systemPrompt": "你是资深软件工程师，精通代码审查和最佳实践。",
							"userPrompt":   "请审查以下{{start.language}}代码，重点关注{{start.focus}}：\n\n```{{start.language}}\n{{start.code}}\n```\n\n请提供：\n1. 发现的问题（按严重程度排序）\n2. 具体改进建议\n3. 优化后的代码示例",
						},
					},
				},
				{
					"id":       "end",
					"type":     "end",
					"position": map[string]int{"x": 700, "y": 200},
					"data": map[string]interface{}{
						"label": "结束",
						"outputs": []map[string]interface{}{
							{"id": "review", "label": "审查报告", "source": "review.text"},
						},
					},
				},
			},
			"edges": []map[string]interface{}{
				{"id": "e1", "source": "start", "target": "review"},
				{"id": "e2", "source": "review", "target": "end"},
			},
			"settings": map[string]interface{}{
				"timeout": 120000,
			},
		},
		Variables:     entity.JSON{},
		InputSchema:   entity.JSON{},
		Difficulty:    "intermediate",
		EstimatedTime: 3,
		NodeCount:     3,
		IsFeatured:    true,
		IsOfficial:    true,
		IsPublished:   true,
		PublishedAt:   &now,
		CreatedAt:     now,
		UpdatedAt:     now,
	}
}

// apiDocGenerator API文档生成
func (s *WorkflowTemplateSeeder) apiDocGenerator(now time.Time) entity.Template {
	return entity.Template{
		ID:          uuid.New(),
		Name:        "API 文档生成",
		Slug:        "api-doc-generator",
		Description: "根据代码自动生成API文档",
		LongDescription: `自动化API文档生成。

**支持格式：**
- OpenAPI/Swagger
- Markdown
- HTML

**文档内容：**
- 接口描述
- 参数说明
- 返回值
- 示例代码`,
		Category: "developer",
		Tags:     entity.StringArray{"API", "文档", "Swagger", "OpenAPI", "开发"},
		Icon:     "📄",
		Definition: entity.JSON{
			"version": "1.0.0",
			"nodes": []map[string]interface{}{
				{
					"id":       "start",
					"type":     "start",
					"position": map[string]int{"x": 100, "y": 200},
					"data": map[string]interface{}{
						"label": "开始",
						"inputs": []map[string]interface{}{
							{"id": "code", "label": "API代码", "type": "textarea", "required": true},
							{"id": "format", "label": "输出格式", "type": "select", "options": []string{"Markdown", "OpenAPI YAML", "HTML"}},
						},
					},
				},
				{
					"id":       "generate",
					"type":     "llm",
					"position": map[string]int{"x": 400, "y": 200},
					"data": map[string]interface{}{
						"label": "生成文档",
						"config": map[string]interface{}{
							"model":       "gpt-4o",
							"temperature": 0.2,
							"systemPrompt": "你是技术文档专家，精通API文档编写。",
							"userPrompt":   "请为以下代码生成{{start.format}}格式的API文档：\n\n{{start.code}}\n\n文档需包含：\n1. 接口概述\n2. 请求参数\n3. 返回格式\n4. 错误码\n5. 调用示例",
						},
					},
				},
				{
					"id":       "end",
					"type":     "end",
					"position": map[string]int{"x": 700, "y": 200},
					"data": map[string]interface{}{
						"label": "结束",
						"outputs": []map[string]interface{}{
							{"id": "doc", "label": "API文档", "source": "generate.text"},
						},
					},
				},
			},
			"edges": []map[string]interface{}{
				{"id": "e1", "source": "start", "target": "generate"},
				{"id": "e2", "source": "generate", "target": "end"},
			},
			"settings": map[string]interface{}{
				"timeout": 120000,
			},
		},
		Variables:     entity.JSON{},
		InputSchema:   entity.JSON{},
		Difficulty:    "intermediate",
		EstimatedTime: 3,
		NodeCount:     3,
		IsFeatured:    false,
		IsOfficial:    true,
		IsPublished:   true,
		PublishedAt:   &now,
		CreatedAt:     now,
		UpdatedAt:     now,
	}
}

// errorLogAnalyzer 错误日志分析
func (s *WorkflowTemplateSeeder) errorLogAnalyzer(now time.Time) entity.Template {
	return entity.Template{
		ID:          uuid.New(),
		Name:        "错误日志分析",
		Slug:        "error-log-analyzer",
		Description: "智能分析错误日志并提供解决方案",
		LongDescription: `自动化错误诊断。

**分析内容：**
- 错误类型识别
- 根因分析
- 解决方案建议
- 预防措施

**支持类型：**
- 应用日志
- 系统日志
- 数据库日志`,
		Category: "developer",
		Tags:     entity.StringArray{"日志", "错误分析", "调试", "运维", "Debug"},
		Icon:     "🔍",
		Definition: entity.JSON{
			"version": "1.0.0",
			"nodes": []map[string]interface{}{
				{
					"id":       "start",
					"type":     "start",
					"position": map[string]int{"x": 100, "y": 200},
					"data": map[string]interface{}{
						"label": "开始",
						"inputs": []map[string]interface{}{
							{"id": "logs", "label": "错误日志", "type": "textarea", "required": true},
							{"id": "context", "label": "系统上下文", "type": "textarea", "placeholder": "技术栈、运行环境等"},
						},
					},
				},
				{
					"id":       "analyze",
					"type":     "llm",
					"position": map[string]int{"x": 400, "y": 200},
					"data": map[string]interface{}{
						"label": "分析日志",
						"config": map[string]interface{}{
							"model":       "gpt-4o",
							"temperature": 0.2,
							"systemPrompt": "你是资深SRE工程师，精通日志分析和故障排查。",
							"userPrompt":   "请分析以下错误日志：\n\n{{start.logs}}\n\n系统上下文：{{start.context}}\n\n请提供：\n1. 错误类型和严重程度\n2. 可能的根本原因\n3. 推荐的解决方案\n4. 预防措施建议",
						},
					},
				},
				{
					"id":       "end",
					"type":     "end",
					"position": map[string]int{"x": 700, "y": 200},
					"data": map[string]interface{}{
						"label": "结束",
						"outputs": []map[string]interface{}{
							{"id": "analysis", "label": "分析报告", "source": "analyze.text"},
						},
					},
				},
			},
			"edges": []map[string]interface{}{
				{"id": "e1", "source": "start", "target": "analyze"},
				{"id": "e2", "source": "analyze", "target": "end"},
			},
			"settings": map[string]interface{}{
				"timeout": 60000,
			},
		},
		Variables:     entity.JSON{},
		InputSchema:   entity.JSON{},
		Difficulty:    "intermediate",
		EstimatedTime: 2,
		NodeCount:     3,
		IsFeatured:    false,
		IsOfficial:    true,
		IsPublished:   true,
		PublishedAt:   &now,
		CreatedAt:     now,
		UpdatedAt:     now,
	}
}

// ============= 5. 办公效率类模板 =============

// meetingNotesGenerator 会议纪要生成
func (s *WorkflowTemplateSeeder) meetingNotesGenerator(now time.Time) entity.Template {
	return entity.Template{
		ID:          uuid.New(),
		Name:        "会议纪要生成",
		Slug:        "meeting-notes-generator",
		Description: "从会议记录自动生成结构化纪要",
		LongDescription: `自动化会议纪要生成。

**功能特点：**
- 自动提取关键信息
- 任务项识别
- 决策点归纳
- 待办事项生成

**输出格式：**
- 会议摘要
- 讨论要点
- 行动项清单
- 后续计划`,
		Category: "productivity",
		Tags:     entity.StringArray{"会议", "纪要", "效率", "办公", "协作"},
		Icon:     "📝",
		Definition: entity.JSON{
			"version": "1.0.0",
			"nodes": []map[string]interface{}{
				{
					"id":       "start",
					"type":     "start",
					"position": map[string]int{"x": 100, "y": 200},
					"data": map[string]interface{}{
						"label": "开始",
						"inputs": []map[string]interface{}{
							{"id": "transcript", "label": "会议记录/转写稿", "type": "textarea", "required": true},
							{"id": "meetingType", "label": "会议类型", "type": "select", "options": []string{"项目周会", "头脑风暴", "评审会议", "日常沟通", "其他"}},
							{"id": "participants", "label": "参会人员", "type": "text"},
						},
					},
				},
				{
					"id":       "generate",
					"type":     "llm",
					"position": map[string]int{"x": 400, "y": 200},
					"data": map[string]interface{}{
						"label": "生成纪要",
						"config": map[string]interface{}{
							"model":       "gpt-4o",
							"temperature": 0.3,
							"systemPrompt": "你是专业的会议秘书，擅长整理会议纪要。",
							"userPrompt":   "请根据以下{{start.meetingType}}会议记录生成结构化纪要：\n\n参会人员：{{start.participants}}\n\n会议记录：\n{{start.transcript}}\n\n请输出：\n1. 会议概要（一句话）\n2. 主要讨论点\n3. 做出的决策\n4. 行动项（含负责人和截止日期）\n5. 下次会议安排",
						},
					},
				},
				{
					"id":       "end",
					"type":     "end",
					"position": map[string]int{"x": 700, "y": 200},
					"data": map[string]interface{}{
						"label": "结束",
						"outputs": []map[string]interface{}{
							{"id": "notes", "label": "会议纪要", "source": "generate.text"},
						},
					},
				},
			},
			"edges": []map[string]interface{}{
				{"id": "e1", "source": "start", "target": "generate"},
				{"id": "e2", "source": "generate", "target": "end"},
			},
			"settings": map[string]interface{}{
				"timeout": 120000,
			},
		},
		Variables:     entity.JSON{},
		InputSchema:   entity.JSON{},
		Difficulty:    "beginner",
		EstimatedTime: 2,
		NodeCount:     3,
		IsFeatured:    true,
		IsOfficial:    true,
		IsPublished:   true,
		PublishedAt:   &now,
		CreatedAt:     now,
		UpdatedAt:     now,
	}
}

// dailyWeeklyReport 日报周报生成
func (s *WorkflowTemplateSeeder) dailyWeeklyReport(now time.Time) entity.Template {
	return entity.Template{
		ID:          uuid.New(),
		Name:        "日报周报生成",
		Slug:        "daily-weekly-report",
		Description: "根据工作记录自动生成日报或周报",
		LongDescription: `自动化工作汇报生成。

**支持类型：**
- 日报
- 周报
- 月报

**输出内容：**
- 工作完成情况
- 进展和成果
- 问题和风险
- 下阶段计划`,
		Category: "productivity",
		Tags:     entity.StringArray{"日报", "周报", "工作汇报", "效率", "办公"},
		Icon:     "📋",
		Definition: entity.JSON{
			"version": "1.0.0",
			"nodes": []map[string]interface{}{
				{
					"id":       "start",
					"type":     "start",
					"position": map[string]int{"x": 100, "y": 200},
					"data": map[string]interface{}{
						"label": "开始",
						"inputs": []map[string]interface{}{
							{"id": "workItems", "label": "工作内容记录", "type": "textarea", "required": true, "placeholder": "简单罗列完成的工作"},
							{"id": "reportType", "label": "报告类型", "type": "select", "options": []string{"日报", "周报", "月报"}},
							{"id": "role", "label": "岗位角色", "type": "text", "placeholder": "如：前端工程师"},
						},
					},
				},
				{
					"id":       "generate",
					"type":     "llm",
					"position": map[string]int{"x": 400, "y": 200},
					"data": map[string]interface{}{
						"label": "生成报告",
						"config": map[string]interface{}{
							"model":       "gpt-4o-mini",
							"temperature": 0.5,
							"systemPrompt": "你是职场汇报专家，擅长将零散工作整理成专业汇报。",
							"userPrompt":   "请将以下工作内容整理成{{start.reportType}}：\n\n角色：{{start.role}}\n\n工作内容：\n{{start.workItems}}\n\n请输出结构化的{{start.reportType}}，包含：\n1. 工作概述\n2. 主要完成事项\n3. 进展与成果\n4. 遇到的问题\n5. 下阶段计划",
						},
					},
				},
				{
					"id":       "end",
					"type":     "end",
					"position": map[string]int{"x": 700, "y": 200},
					"data": map[string]interface{}{
						"label": "结束",
						"outputs": []map[string]interface{}{
							{"id": "report", "label": "工作报告", "source": "generate.text"},
						},
					},
				},
			},
			"edges": []map[string]interface{}{
				{"id": "e1", "source": "start", "target": "generate"},
				{"id": "e2", "source": "generate", "target": "end"},
			},
			"settings": map[string]interface{}{
				"timeout": 60000,
			},
		},
		Variables:     entity.JSON{},
		InputSchema:   entity.JSON{},
		Difficulty:    "beginner",
		EstimatedTime: 1,
		NodeCount:     3,
		IsFeatured:    true,
		IsOfficial:    true,
		IsPublished:   true,
		PublishedAt:   &now,
		CreatedAt:     now,
		UpdatedAt:     now,
	}
}

// competitorAnalysis 竞品分析报告
func (s *WorkflowTemplateSeeder) competitorAnalysis(now time.Time) entity.Template {
	return entity.Template{
		ID:          uuid.New(),
		Name:        "竞品分析报告",
		Slug:        "competitor-analysis",
		Description: "生成详细的竞品分析报告",
		LongDescription: `全面的竞品分析工具。

**分析维度：**
- 产品功能对比
- 定价策略分析
- 市场定位
- 优劣势分析

**输出内容：**
- 竞品概览
- 对比矩阵
- SWOT分析
- 策略建议`,
		Category: "research",
		Tags:     entity.StringArray{"竞品分析", "市场研究", "商业分析", "产品"},
		Icon:     "📊",
		Definition: entity.JSON{
			"version": "1.0.0",
			"nodes": []map[string]interface{}{
				{
					"id":       "start",
					"type":     "start",
					"position": map[string]int{"x": 100, "y": 200},
					"data": map[string]interface{}{
						"label": "开始",
						"inputs": []map[string]interface{}{
							{"id": "myProduct", "label": "我的产品/服务", "type": "text", "required": true},
							{"id": "competitors", "label": "竞品名称（逗号分隔）", "type": "text", "required": true},
							{"id": "industry", "label": "所属行业", "type": "text"},
						},
					},
				},
				{
					"id":       "search",
					"type":     "web_search",
					"position": map[string]int{"x": 400, "y": 100},
					"data": map[string]interface{}{
						"label": "搜索信息",
						"config": map[string]interface{}{
							"query":      "{{start.competitors}} 产品功能 定价 评价",
							"maxResults": 10,
						},
					},
				},
				{
					"id":       "analyze",
					"type":     "llm",
					"position": map[string]int{"x": 700, "y": 200},
					"data": map[string]interface{}{
						"label": "分析对比",
						"config": map[string]interface{}{
							"model":       "gpt-4o",
							"temperature": 0.3,
							"systemPrompt": "你是资深市场分析师，精通竞品研究。",
							"userPrompt":   "请为「{{start.myProduct}}」生成竞品分析报告。\n\n竞品：{{start.competitors}}\n行业：{{start.industry}}\n\n参考资料：{{search.results}}\n\n请输出：\n1. 竞品概览\n2. 功能对比矩阵\n3. 定价策略对比\n4. 各产品SWOT分析\n5. 竞争策略建议",
						},
					},
				},
				{
					"id":       "end",
					"type":     "end",
					"position": map[string]int{"x": 1000, "y": 200},
					"data": map[string]interface{}{
						"label": "结束",
						"outputs": []map[string]interface{}{
							{"id": "report", "label": "竞品分析报告", "source": "analyze.text"},
						},
					},
				},
			},
			"edges": []map[string]interface{}{
				{"id": "e1", "source": "start", "target": "search"},
				{"id": "e2", "source": "search", "target": "analyze"},
				{"id": "e3", "source": "analyze", "target": "end"},
			},
			"settings": map[string]interface{}{
				"timeout": 180000,
			},
		},
		Variables:     entity.JSON{},
		InputSchema:   entity.JSON{},
		Difficulty:    "intermediate",
		EstimatedTime: 5,
		NodeCount:     4,
		IsFeatured:    true,
		IsOfficial:    true,
		IsPublished:   true,
		PublishedAt:   &now,
		CreatedAt:     now,
		UpdatedAt:     now,
	}
}

// ============= 6. 教育学习类模板 =============

// languageTranslator 语言翻译助手
func (s *WorkflowTemplateSeeder) languageTranslator(now time.Time) entity.Template {
	return entity.Template{
		ID:          uuid.New(),
		Name:        "语言翻译助手",
		Slug:        "language-translator",
		Description: "智能翻译，支持多语言和专业领域",
		LongDescription: `专业级智能翻译。

**支持语言：**
- 中英互译
- 日韩翻译
- 欧洲语言

**特色功能：**
- 领域术语支持
- 语气风格调整
- 本地化优化`,
		Category: "education",
		Tags:     entity.StringArray{"翻译", "多语言", "国际化", "学习"},
		Icon:     "🌐",
		Definition: entity.JSON{
			"version": "1.0.0",
			"nodes": []map[string]interface{}{
				{
					"id":       "start",
					"type":     "start",
					"position": map[string]int{"x": 100, "y": 200},
					"data": map[string]interface{}{
						"label": "开始",
						"inputs": []map[string]interface{}{
							{"id": "text", "label": "待翻译内容", "type": "textarea", "required": true},
							{"id": "targetLang", "label": "目标语言", "type": "select", "options": []string{"英文", "中文", "日文", "韩文", "法文", "德文", "西班牙文"}},
							{"id": "domain", "label": "专业领域", "type": "select", "options": []string{"通用", "技术/IT", "商务", "法律", "医学", "学术"}},
							{"id": "style", "label": "翻译风格", "type": "select", "options": []string{"直译", "意译", "口语化"}},
						},
					},
				},
				{
					"id":       "translate",
					"type":     "llm",
					"position": map[string]int{"x": 400, "y": 200},
					"data": map[string]interface{}{
						"label": "翻译",
						"config": map[string]interface{}{
							"model":       "gpt-4o",
							"temperature": 0.3,
							"systemPrompt": "你是专业翻译，精通多语言翻译和本地化。",
							"userPrompt":   "请将以下内容翻译成{{start.targetLang}}。\n\n专业领域：{{start.domain}}\n翻译风格：{{start.style}}\n\n原文：\n{{start.text}}\n\n请输出：\n1. 翻译结果\n2. 重要术语对照表（如有）\n3. 翻译说明（如有需要解释的地方）",
						},
					},
				},
				{
					"id":       "end",
					"type":     "end",
					"position": map[string]int{"x": 700, "y": 200},
					"data": map[string]interface{}{
						"label": "结束",
						"outputs": []map[string]interface{}{
							{"id": "translation", "label": "翻译结果", "source": "translate.text"},
						},
					},
				},
			},
			"edges": []map[string]interface{}{
				{"id": "e1", "source": "start", "target": "translate"},
				{"id": "e2", "source": "translate", "target": "end"},
			},
			"settings": map[string]interface{}{
				"timeout": 60000,
			},
		},
		Variables:     entity.JSON{},
		InputSchema:   entity.JSON{},
		Difficulty:    "beginner",
		EstimatedTime: 1,
		NodeCount:     3,
		IsFeatured:    true,
		IsOfficial:    true,
		IsPublished:   true,
		PublishedAt:   &now,
		CreatedAt:     now,
		UpdatedAt:     now,
	}
}

// studyNotesOrganizer 学习笔记整理
func (s *WorkflowTemplateSeeder) studyNotesOrganizer(now time.Time) entity.Template {
	return entity.Template{
		ID:          uuid.New(),
		Name:        "学习笔记整理",
		Slug:        "study-notes-organizer",
		Description: "将零散笔记整理成结构化知识",
		LongDescription: `智能学习笔记整理。

**功能特点：**
- 内容结构化
- 知识点提炼
- 思维导图生成
- 复习卡片制作

**输出格式：**
- 结构化笔记
- 知识点清单
- 复习问答`,
		Category: "education",
		Tags:     entity.StringArray{"学习", "笔记", "知识管理", "教育", "复习"},
		Icon:     "📚",
		Definition: entity.JSON{
			"version": "1.0.0",
			"nodes": []map[string]interface{}{
				{
					"id":       "start",
					"type":     "start",
					"position": map[string]int{"x": 100, "y": 200},
					"data": map[string]interface{}{
						"label": "开始",
						"inputs": []map[string]interface{}{
							{"id": "notes", "label": "原始笔记", "type": "textarea", "required": true},
							{"id": "subject", "label": "学科/主题", "type": "text"},
							{"id": "outputFormat", "label": "输出格式", "type": "select", "options": []string{"结构化笔记", "知识卡片", "思维导图文本", "复习题目"}},
						},
					},
				},
				{
					"id":       "organize",
					"type":     "llm",
					"position": map[string]int{"x": 400, "y": 200},
					"data": map[string]interface{}{
						"label": "整理笔记",
						"config": map[string]interface{}{
							"model":       "gpt-4o",
							"temperature": 0.4,
							"systemPrompt": "你是学习方法专家，擅长知识整理和结构化。",
							"userPrompt":   "请将以下{{start.subject}}相关笔记整理成{{start.outputFormat}}：\n\n原始笔记：\n{{start.notes}}\n\n请确保：\n1. 逻辑清晰\n2. 重点突出\n3. 便于复习\n4. 包含知识点间的关联",
						},
					},
				},
				{
					"id":       "end",
					"type":     "end",
					"position": map[string]int{"x": 700, "y": 200},
					"data": map[string]interface{}{
						"label": "结束",
						"outputs": []map[string]interface{}{
							{"id": "organized", "label": "整理结果", "source": "organize.text"},
						},
					},
				},
			},
			"edges": []map[string]interface{}{
				{"id": "e1", "source": "start", "target": "organize"},
				{"id": "e2", "source": "organize", "target": "end"},
			},
			"settings": map[string]interface{}{
				"timeout": 120000,
			},
		},
		Variables:     entity.JSON{},
		InputSchema:   entity.JSON{},
		Difficulty:    "beginner",
		EstimatedTime: 2,
		NodeCount:     3,
		IsFeatured:    false,
		IsOfficial:    true,
		IsPublished:   true,
		PublishedAt:   &now,
		CreatedAt:     now,
		UpdatedAt:     now,
	}
}
