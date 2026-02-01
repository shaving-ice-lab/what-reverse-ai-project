-- AI 创意助手模板表 (MySQL 版本)
-- 版本: 000007
-- 创建时间: 2026-01-29
-- 用途: 存储 AI 创意助手的模板定义

-- 创意模板表
CREATE TABLE what_reverse_creative_templates (
    id                  CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    
    -- 基础信息
    name                VARCHAR(100) NOT NULL COMMENT '模板名称',
    slug                VARCHAR(100) UNIQUE NOT NULL COMMENT '模板标识(URL友好)',
    description         VARCHAR(500) NOT NULL COMMENT '模板描述',
    icon                VARCHAR(50) DEFAULT '📝' COMMENT '模板图标',
    
    -- 分类
    category            ENUM('business', 'content', 'product', 'marketing') NOT NULL COMMENT '模板分类',
    tags                JSON DEFAULT (JSON_ARRAY()) COMMENT '标签列表',
    
    -- 输入字段定义
    inputs_required     JSON NOT NULL COMMENT '必填输入字段定义',
    inputs_optional     JSON DEFAULT (JSON_ARRAY()) COMMENT '选填输入字段定义',
    
    -- 输出章节定义
    output_sections     JSON NOT NULL COMMENT '输出章节定义',
    
    -- 关联工作流
    workflow_id         CHAR(36) COMMENT '关联的工作流ID',
    
    -- 示例
    example_input       JSON COMMENT '示例输入数据',
    example_output      TEXT COMMENT '示例输出内容(Markdown)',
    example_title       VARCHAR(200) COMMENT '示例标题',
    example_description VARCHAR(500) COMMENT '示例描述',
    
    -- 统计数据
    usage_count         INT DEFAULT 0 COMMENT '使用次数',
    rating              DECIMAL(3,2) DEFAULT 0.00 COMMENT '平均评分(0-5)',
    review_count        INT DEFAULT 0 COMMENT '评价数量',
    
    -- 预计时间
    estimated_time      INT DEFAULT 180 COMMENT '预计生成时间(秒)',
    
    -- 状态标记
    is_official         BOOLEAN DEFAULT FALSE COMMENT '是否官方模板',
    is_featured         BOOLEAN DEFAULT FALSE COMMENT '是否精选推荐',
    is_published        BOOLEAN DEFAULT TRUE COMMENT '是否发布',
    
    -- 创建者信息
    creator_id          CHAR(36) COMMENT '创建者用户ID',
    creator_name        VARCHAR(100) COMMENT '创建者名称',
    
    -- 版本管理
    version             INT DEFAULT 1 COMMENT '当前版本号',
    
    -- 时间戳
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    published_at        DATETIME COMMENT '发布时间',
    deleted_at          DATETIME NULL COMMENT '软删除时间',
    
    -- 外键约束
    FOREIGN KEY (workflow_id) REFERENCES what_reverse_workflows(id) ON DELETE SET NULL,
    FOREIGN KEY (creator_id) REFERENCES what_reverse_users(id) ON DELETE SET NULL,
    
    -- 索引
    INDEX idx_creative_templates_category (category),
    INDEX idx_creative_templates_slug (slug),
    INDEX idx_creative_templates_featured (is_featured, is_published),
    INDEX idx_creative_templates_official (is_official, is_published),
    INDEX idx_creative_templates_creator (creator_id),
    INDEX idx_creative_templates_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='AI创意助手模板表';

-- 创意模板版本历史表
CREATE TABLE what_reverse_creative_template_versions (
    id                  CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    template_id         CHAR(36) NOT NULL COMMENT '模板ID',
    version             INT NOT NULL COMMENT '版本号',
    
    -- 版本快照
    name                VARCHAR(100) NOT NULL,
    description         VARCHAR(500) NOT NULL,
    inputs_required     JSON NOT NULL,
    inputs_optional     JSON,
    output_sections     JSON NOT NULL,
    
    -- 变更信息
    change_summary      VARCHAR(500) COMMENT '变更说明',
    changed_by          CHAR(36) COMMENT '变更人ID',
    
    -- 时间戳
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- 外键约束
    FOREIGN KEY (template_id) REFERENCES what_reverse_creative_templates(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES what_reverse_users(id) ON DELETE SET NULL,
    
    -- 唯一约束 (每个模板的版本号唯一)
    UNIQUE KEY uk_template_version (template_id, version),
    
    -- 索引
    INDEX idx_creative_template_versions_template (template_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='创意模板版本历史表';

-- 插入官方预设模板
INSERT INTO what_reverse_creative_templates (
    id, name, slug, description, icon, category, 
    inputs_required, inputs_optional, output_sections,
    is_official, is_featured, published_at, estimated_time
) VALUES 
-- 商业计划生成器
(
    UUID(), 
    '商业计划生成器', 
    'business-plan-generator',
    '输入你的商业想法，自动生成完整的商业计划书，包含市场分析、商业模式、执行策略等',
    '💼',
    'business',
    JSON_ARRAY(
        JSON_OBJECT(
            'id', 'idea',
            'label', '商业想法',
            'type', 'textarea',
            'placeholder', '例如：我想做AI自媒体，通过教学和工具服务年入1000万',
            'validation', JSON_OBJECT('required', true, 'minLength', 10, 'maxLength', 1000),
            'aiSuggest', true
        ),
        JSON_OBJECT(
            'id', 'target_revenue',
            'label', '目标收入',
            'type', 'select',
            'options', JSON_ARRAY(
                JSON_OBJECT('value', '100k', 'label', '年入10万'),
                JSON_OBJECT('value', '500k', 'label', '年入50万'),
                JSON_OBJECT('value', '1m', 'label', '年入100万'),
                JSON_OBJECT('value', '5m', 'label', '年入500万'),
                JSON_OBJECT('value', '10m', 'label', '年入1000万'),
                JSON_OBJECT('value', 'custom', 'label', '自定义')
            ),
            'validation', JSON_OBJECT('required', true)
        )
    ),
    JSON_ARRAY(
        JSON_OBJECT(
            'id', 'resources',
            'label', '可用资源',
            'type', 'textarea',
            'placeholder', '团队人数、启动资金、可投入时间等'
        ),
        JSON_OBJECT(
            'id', 'background',
            'label', '个人背景',
            'type', 'textarea',
            'placeholder', '擅长领域、工作经验、已有资源等'
        ),
        JSON_OBJECT(
            'id', 'constraints',
            'label', '限制条件',
            'type', 'textarea',
            'placeholder', '时间限制、预算限制、地域限制等'
        )
    ),
    JSON_ARRAY(
        JSON_OBJECT('id', 'market-analysis', 'title', '市场机会分析', 'description', '分析行业现状、成功案例、核心洞察', 'estimatedTime', 30),
        JSON_OBJECT('id', 'business-model', 'title', '商业模式设计', 'description', '收入结构、产品矩阵、定价策略', 'dependsOn', JSON_ARRAY('market-analysis'), 'estimatedTime', 25),
        JSON_OBJECT('id', 'execution-strategy', 'title', '执行策略', 'description', '平台布局、内容计划、获客路径', 'dependsOn', JSON_ARRAY('business-model'), 'estimatedTime', 25),
        JSON_OBJECT('id', 'timeline', 'title', '时间规划', 'description', '阶段目标、里程碑、关键指标', 'dependsOn', JSON_ARRAY('execution-strategy'), 'estimatedTime', 20),
        JSON_OBJECT('id', 'risk-assessment', 'title', '风险评估', 'description', '主要风险和应对策略', 'dependsOn', JSON_ARRAY('business-model'), 'estimatedTime', 15),
        JSON_OBJECT('id', 'action-plan', 'title', '立即行动', 'description', '本周任务、首月目标、资源清单', 'dependsOn', JSON_ARRAY('timeline', 'risk-assessment'), 'estimatedTime', 15)
    ),
    TRUE, TRUE, NOW(), 180
),
-- 自媒体内容策划
(
    UUID(),
    '自媒体内容策划',
    'content-strategy-planner',
    '根据你的定位和目标，生成完整的自媒体运营方案，包含选题库、标题模板、发布排期等',
    '📱',
    'content',
    JSON_ARRAY(
        JSON_OBJECT(
            'id', 'platform',
            'label', '目标平台',
            'type', 'multiselect',
            'options', JSON_ARRAY(
                JSON_OBJECT('value', 'xiaohongshu', 'label', '小红书'),
                JSON_OBJECT('value', 'douyin', 'label', '抖音'),
                JSON_OBJECT('value', 'bilibili', 'label', 'B站'),
                JSON_OBJECT('value', 'wechat', 'label', '公众号'),
                JSON_OBJECT('value', 'zhihu', 'label', '知乎'),
                JSON_OBJECT('value', 'weibo', 'label', '微博')
            ),
            'validation', JSON_OBJECT('required', true)
        ),
        JSON_OBJECT(
            'id', 'niche',
            'label', '内容领域',
            'type', 'text',
            'placeholder', '例如：AI工具测评、职场成长、理财投资',
            'validation', JSON_OBJECT('required', true, 'minLength', 2)
        ),
        JSON_OBJECT(
            'id', 'goal',
            'label', '变现目标',
            'type', 'select',
            'options', JSON_ARRAY(
                JSON_OBJECT('value', '10k', 'label', '月入1万'),
                JSON_OBJECT('value', '30k', 'label', '月入3万'),
                JSON_OBJECT('value', '50k', 'label', '月入5万'),
                JSON_OBJECT('value', '100k', 'label', '月入10万'),
                JSON_OBJECT('value', 'brand', 'label', '品牌曝光为主')
            ),
            'validation', JSON_OBJECT('required', true)
        )
    ),
    JSON_ARRAY(
        JSON_OBJECT(
            'id', 'time_available',
            'label', '可投入时间',
            'type', 'select',
            'options', JSON_ARRAY(
                JSON_OBJECT('value', '1h', 'label', '每天1小时'),
                JSON_OBJECT('value', '2h', 'label', '每天2小时'),
                JSON_OBJECT('value', '4h', 'label', '每天4小时'),
                JSON_OBJECT('value', 'fulltime', 'label', '全职投入')
            )
        ),
        JSON_OBJECT(
            'id', 'current_followers',
            'label', '现有粉丝数',
            'type', 'number',
            'placeholder', '0'
        )
    ),
    JSON_ARRAY(
        JSON_OBJECT('id', 'positioning', 'title', '账号定位', 'description', '人设定位、差异化价值、目标受众', 'estimatedTime', 20),
        JSON_OBJECT('id', 'content-pillars', 'title', '内容支柱', 'description', '3-5个核心内容方向', 'dependsOn', JSON_ARRAY('positioning'), 'estimatedTime', 20),
        JSON_OBJECT('id', 'topic-bank', 'title', '选题库', 'description', '50+选题创意，按分类整理', 'dependsOn', JSON_ARRAY('content-pillars'), 'estimatedTime', 30),
        JSON_OBJECT('id', 'title-formulas', 'title', '标题公式', 'description', '10+爆款标题模板', 'dependsOn', JSON_ARRAY('positioning'), 'estimatedTime', 15),
        JSON_OBJECT('id', 'publishing-schedule', 'title', '发布排期', 'description', '月度内容日历', 'dependsOn', JSON_ARRAY('topic-bank'), 'estimatedTime', 15),
        JSON_OBJECT('id', 'monetization', 'title', '变现路径', 'description', '收入来源和转化策略', 'dependsOn', JSON_ARRAY('positioning'), 'estimatedTime', 20),
        JSON_OBJECT('id', 'growth-strategy', 'title', '增长策略', 'description', '涨粉方法和运营技巧', 'dependsOn', JSON_ARRAY('content-pillars'), 'estimatedTime', 20),
        JSON_OBJECT('id', 'action-items', 'title', '行动计划', 'description', '首周任务清单', 'dependsOn', JSON_ARRAY('publishing-schedule', 'growth-strategy'), 'estimatedTime', 10)
    ),
    TRUE, TRUE, NOW(), 200
),
-- PRD 文档生成器
(
    UUID(),
    'PRD 文档生成器',
    'prd-generator',
    '将产品想法转化为完整的产品需求文档，包含用户研究、功能规划、技术需求等',
    '📋',
    'product',
    JSON_ARRAY(
        JSON_OBJECT(
            'id', 'product_idea',
            'label', '产品想法',
            'type', 'textarea',
            'placeholder', '描述你的产品想法，它解决什么问题？',
            'validation', JSON_OBJECT('required', true, 'minLength', 20)
        ),
        JSON_OBJECT(
            'id', 'target_users',
            'label', '目标用户',
            'type', 'text',
            'placeholder', '例如：25-35岁的职场新人',
            'validation', JSON_OBJECT('required', true)
        ),
        JSON_OBJECT(
            'id', 'product_type',
            'label', '产品类型',
            'type', 'select',
            'options', JSON_ARRAY(
                JSON_OBJECT('value', 'mobile_app', 'label', '移动应用'),
                JSON_OBJECT('value', 'web_app', 'label', 'Web应用'),
                JSON_OBJECT('value', 'saas', 'label', 'SaaS产品'),
                JSON_OBJECT('value', 'mini_program', 'label', '小程序'),
                JSON_OBJECT('value', 'ai_tool', 'label', 'AI工具')
            ),
            'validation', JSON_OBJECT('required', true)
        )
    ),
    JSON_ARRAY(
        JSON_OBJECT(
            'id', 'competitors',
            'label', '已知竞品',
            'type', 'textarea',
            'placeholder', '列出你知道的竞品产品'
        ),
        JSON_OBJECT(
            'id', 'budget',
            'label', '开发预算',
            'type', 'select',
            'options', JSON_ARRAY(
                JSON_OBJECT('value', 'low', 'label', '10万以内'),
                JSON_OBJECT('value', 'medium', 'label', '10-50万'),
                JSON_OBJECT('value', 'high', 'label', '50万以上'),
                JSON_OBJECT('value', 'unlimited', 'label', '预算充足')
            )
        )
    ),
    JSON_ARRAY(
        JSON_OBJECT('id', 'overview', 'title', '产品概述', 'description', '背景、目标、范围', 'estimatedTime', 15),
        JSON_OBJECT('id', 'user-research', 'title', '用户研究', 'description', '用户画像、痛点分析', 'dependsOn', JSON_ARRAY('overview'), 'estimatedTime', 20),
        JSON_OBJECT('id', 'competitor-analysis', 'title', '竞品分析', 'description', '竞品对比、差异化机会', 'dependsOn', JSON_ARRAY('overview'), 'estimatedTime', 25),
        JSON_OBJECT('id', 'user-stories', 'title', '用户故事', 'description', '核心用户场景', 'dependsOn', JSON_ARRAY('user-research'), 'estimatedTime', 20),
        JSON_OBJECT('id', 'features', 'title', '功能需求', 'description', '功能列表和优先级', 'dependsOn', JSON_ARRAY('user-stories'), 'estimatedTime', 25),
        JSON_OBJECT('id', 'information-architecture', 'title', '信息架构', 'description', '页面结构和导航', 'dependsOn', JSON_ARRAY('features'), 'estimatedTime', 20),
        JSON_OBJECT('id', 'wireframes', 'title', '原型建议', 'description', '关键页面描述', 'dependsOn', JSON_ARRAY('information-architecture'), 'estimatedTime', 20),
        JSON_OBJECT('id', 'technical-requirements', 'title', '技术需求', 'description', '技术栈和接口设计', 'dependsOn', JSON_ARRAY('features'), 'estimatedTime', 20),
        JSON_OBJECT('id', 'roadmap', 'title', '开发路线图', 'description', 'MVP范围和迭代计划', 'dependsOn', JSON_ARRAY('features', 'technical-requirements'), 'estimatedTime', 15)
    ),
    TRUE, TRUE, NOW(), 240
),
-- 爆款选题生成器
(
    UUID(),
    '爆款选题生成器',
    'viral-topic-generator',
    '批量生成高潜力爆款选题，包含热点、常青、争议、干货多种类型',
    '🔥',
    'content',
    JSON_ARRAY(
        JSON_OBJECT(
            'id', 'niche',
            'label', '内容领域',
            'type', 'text',
            'placeholder', '例如：AI工具、职场成长、投资理财',
            'validation', JSON_OBJECT('required', true)
        ),
        JSON_OBJECT(
            'id', 'count',
            'label', '选题数量',
            'type', 'select',
            'options', JSON_ARRAY(
                JSON_OBJECT('value', '20', 'label', '20个选题'),
                JSON_OBJECT('value', '50', 'label', '50个选题'),
                JSON_OBJECT('value', '100', 'label', '100个选题')
            ),
            'validation', JSON_OBJECT('required', true)
        )
    ),
    JSON_ARRAY(
        JSON_OBJECT(
            'id', 'style',
            'label', '内容风格',
            'type', 'multiselect',
            'options', JSON_ARRAY(
                JSON_OBJECT('value', 'educational', 'label', '干货教程'),
                JSON_OBJECT('value', 'story', 'label', '故事案例'),
                JSON_OBJECT('value', 'opinion', 'label', '观点评论'),
                JSON_OBJECT('value', 'listicle', 'label', '盘点清单'),
                JSON_OBJECT('value', 'howto', 'label', '操作指南')
            )
        )
    ),
    JSON_ARRAY(
        JSON_OBJECT('id', 'trending-topics', 'title', '热点选题', 'description', '结合当前热点的选题', 'estimatedTime', 20),
        JSON_OBJECT('id', 'evergreen-topics', 'title', '常青选题', 'description', '长期有流量的选题', 'estimatedTime', 20),
        JSON_OBJECT('id', 'controversial-topics', 'title', '争议选题', 'description', '容易引发讨论的选题', 'estimatedTime', 15),
        JSON_OBJECT('id', 'educational-topics', 'title', '干货选题', 'description', '实用价值高的选题', 'estimatedTime', 20),
        JSON_OBJECT('id', 'title-optimization', 'title', '标题优化', 'description', '为选题匹配爆款标题', 'dependsOn', JSON_ARRAY('trending-topics', 'evergreen-topics', 'controversial-topics', 'educational-topics'), 'estimatedTime', 15)
    ),
    TRUE, FALSE, NOW(), 120
);
