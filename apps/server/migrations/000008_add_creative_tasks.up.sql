-- AI 创意助手任务管理表 (MySQL 版本)
-- 版本: 000008
-- 创建时间: 2026-01-29

-- 创意任务表 - 记录每次生成任务
CREATE TABLE what_reverse_creative_tasks (
    id                  CHAR(36) PRIMARY KEY,
    user_id             CHAR(36) NOT NULL,
    template_id         CHAR(36),
    
    -- 输入数据
    inputs              JSON NOT NULL,
    
    -- 任务状态 (pending, processing, completed, failed, cancelled)
    status              ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    error_message       TEXT,
    
    -- 章节状态
    sections            JSON,
    current_section     VARCHAR(100),
    
    -- 搜索缓存
    search_cache        JSON,
    
    -- 最终输出
    output_markdown     LONGTEXT,
    output_metadata     JSON,
    
    -- Token 消耗统计
    token_usage         JSON,
    
    -- 进度信息
    progress            INT DEFAULT 0,
    total_sections      INT DEFAULT 0,
    completed_sections  INT DEFAULT 0,
    
    -- 时间戳
    started_at          DATETIME(6),
    completed_at        DATETIME(6),
    created_at          DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at          DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    
    -- 外键
    FOREIGN KEY (user_id) REFERENCES what_reverse_users(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES what_reverse_creative_templates(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创意文档表 - 存储生成的文档
CREATE TABLE what_reverse_creative_documents (
    id                  CHAR(36) PRIMARY KEY,
    user_id             CHAR(36) NOT NULL,
    task_id             CHAR(36),
    template_id         CHAR(36),
    
    -- 文档基本信息
    title               VARCHAR(200) NOT NULL,
    description         VARCHAR(500),
    
    -- 文档内容
    content             LONGTEXT NOT NULL,
    
    -- 章节结构
    sections            JSON NOT NULL,
    
    -- 目录
    table_of_contents   TEXT,
    
    -- 摘要
    summary             TEXT,
    
    -- 统计信息
    word_count          INT DEFAULT 0,
    char_count          INT DEFAULT 0,
    section_count       INT DEFAULT 0,
    
    -- 版本控制
    version             INT DEFAULT 1,
    parent_id           CHAR(36),
    
    -- 分享设置
    share_id            VARCHAR(20) UNIQUE,
    share_password      VARCHAR(100),
    share_expires_at    DATETIME(6),
    is_public           BOOLEAN DEFAULT FALSE,
    allow_download      BOOLEAN DEFAULT TRUE,
    
    -- 状态
    is_archived         BOOLEAN DEFAULT FALSE,
    
    -- Token 使用
    token_usage         JSON,
    
    -- 时间戳
    created_at          DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at          DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at          DATETIME(6),
    
    -- 外键
    FOREIGN KEY (user_id) REFERENCES what_reverse_users(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES what_reverse_creative_tasks(id) ON DELETE SET NULL,
    FOREIGN KEY (template_id) REFERENCES what_reverse_creative_templates(id) ON DELETE SET NULL,
    FOREIGN KEY (parent_id) REFERENCES what_reverse_creative_documents(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 章节版本历史表
CREATE TABLE what_reverse_creative_section_versions (
    id                  CHAR(36) PRIMARY KEY,
    document_id         CHAR(36) NOT NULL,
    section_id          VARCHAR(100) NOT NULL,
    version             INT NOT NULL,
    
    -- 章节内容
    title               VARCHAR(200) NOT NULL,
    content             LONGTEXT NOT NULL,
    
    -- 生成指令
    instruction         TEXT,
    
    -- Token 使用
    token_usage         JSON,
    
    -- 时间戳
    created_at          DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    
    -- 唯一约束
    UNIQUE KEY uk_section_version (document_id, section_id, version),
    
    -- 外键
    FOREIGN KEY (document_id) REFERENCES what_reverse_creative_documents(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建索引
CREATE INDEX idx_creative_tasks_user ON what_reverse_creative_tasks(user_id);
CREATE INDEX idx_creative_tasks_status ON what_reverse_creative_tasks(status);
CREATE INDEX idx_creative_tasks_template ON what_reverse_creative_tasks(template_id);
CREATE INDEX idx_creative_tasks_created ON what_reverse_creative_tasks(created_at DESC);

CREATE INDEX idx_creative_documents_user ON what_reverse_creative_documents(user_id);
CREATE INDEX idx_creative_documents_task ON what_reverse_creative_documents(task_id);
CREATE INDEX idx_creative_documents_template ON what_reverse_creative_documents(template_id);
CREATE INDEX idx_creative_documents_share ON what_reverse_creative_documents(share_id);
CREATE INDEX idx_creative_documents_public ON what_reverse_creative_documents(is_public);
CREATE INDEX idx_creative_documents_created ON what_reverse_creative_documents(created_at DESC);
CREATE INDEX idx_creative_documents_deleted ON what_reverse_creative_documents(deleted_at);

CREATE INDEX idx_creative_section_versions_document ON what_reverse_creative_section_versions(document_id);
