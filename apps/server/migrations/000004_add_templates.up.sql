-- 创建模板表 (MySQL 版本)
-- 版本: 000004
-- 创建时间: 2026-01-29

CREATE TABLE what_reverse_templates (
    id                  CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    
    -- 基础信息
    name                VARCHAR(200) NOT NULL,
    slug                VARCHAR(100) UNIQUE NOT NULL,
    description         TEXT,
    long_description    TEXT,
    
    -- 分类和标签
    category            VARCHAR(50) NOT NULL,
    tags                JSON DEFAULT (JSON_ARRAY()),
    
    -- 显示信息
    icon                VARCHAR(50) DEFAULT '📋',
    cover_image         VARCHAR(500),
    screenshots         JSON DEFAULT (JSON_ARRAY()),
    
    -- 工作流定义
    definition          JSON NOT NULL,
    variables           JSON DEFAULT (JSON_OBJECT()),
    input_schema        JSON,
    
    -- 元数据
    difficulty          VARCHAR(20) DEFAULT 'beginner',
    estimated_time      INT DEFAULT 5,
    node_count          INT DEFAULT 0,
    
    -- 状态
    is_featured         BOOLEAN DEFAULT FALSE,
    is_official         BOOLEAN DEFAULT FALSE,
    is_published        BOOLEAN DEFAULT TRUE,
    
    -- 统计
    use_count           INT DEFAULT 0,
    view_count          INT DEFAULT 0,
    like_count          INT DEFAULT 0,
    
    -- 作者信息
    author_id           CHAR(36),
    
    -- 时间戳
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    published_at        DATETIME,
    deleted_at          DATETIME NULL,
    
    FOREIGN KEY (author_id) REFERENCES what_reverse_users(id) ON DELETE SET NULL,
    INDEX idx_templates_category (category),
    INDEX idx_templates_featured (is_featured),
    INDEX idx_templates_slug (slug),
    INDEX idx_templates_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入初始模板数据
INSERT INTO what_reverse_templates (id, name, slug, description, category, icon, definition, is_official, is_featured, published_at) VALUES
(UUID(), '每日新闻摘要', 'daily-news-summary', '自动收集和摘要每日新闻', 'content', '📰', '{"version":"1.0.0","nodes":[],"edges":[],"settings":{"timeout":300000}}', TRUE, TRUE, NOW()),
(UUID(), '客户反馈分析', 'customer-feedback-analysis', '自动分析客户反馈并生成报告', 'customer', '📊', '{"version":"1.0.0","nodes":[],"edges":[],"settings":{"timeout":300000}}', TRUE, TRUE, NOW()),
(UUID(), '社媒内容生成', 'social-media-generator', '根据主题自动生成社交媒体内容', 'marketing', '📱', '{"version":"1.0.0","nodes":[],"edges":[],"settings":{"timeout":300000}}', TRUE, TRUE, NOW()),
(UUID(), '代码审查助手', 'code-review-assistant', '自动进行代码审查并提供改进建议', 'developer', '💻', '{"version":"1.0.0","nodes":[],"edges":[],"settings":{"timeout":300000}}', TRUE, FALSE, NOW()),
(UUID(), '邮件自动回复', 'email-auto-reply', '智能分析邮件内容并生成回复草稿', 'productivity', '📧', '{"version":"1.0.0","nodes":[],"edges":[],"settings":{"timeout":300000}}', TRUE, FALSE, NOW());
