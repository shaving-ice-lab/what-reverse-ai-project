-- AgentFlow 初始化数据库结构 (MySQL 版本)
-- 版本: 000001
-- 创建时间: 2026-01-27

-- =====================
-- 用户表 (what_reverse_users)
-- =====================
CREATE TABLE what_reverse_users (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email           VARCHAR(255) UNIQUE NOT NULL,
    username        VARCHAR(50) UNIQUE NOT NULL,
    display_name    VARCHAR(100),
    avatar_url      VARCHAR(500),
    bio             TEXT,
    
    -- 认证相关
    password_hash   VARCHAR(255),
    email_verified  BOOLEAN DEFAULT FALSE,
    
    -- OAuth 关联
    github_id       VARCHAR(50),
    google_id       VARCHAR(50),
    
    -- 配置
    settings        JSON DEFAULT (JSON_OBJECT()),
    
    -- 统计
    workflow_count  INT DEFAULT 0,
    agent_count     INT DEFAULT 0,
    
    -- 订阅
    plan            VARCHAR(20) DEFAULT 'free',
    plan_expires_at DATETIME,
    
    -- 时间戳
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at   DATETIME,
    deleted_at      DATETIME,
    
    INDEX idx_what_reverse_users_email (email),
    INDEX idx_what_reverse_users_username (username),
    INDEX idx_what_reverse_users_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- 工作流表 (what_reverse_workflows)
-- =====================
CREATE TABLE what_reverse_workflows (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id         CHAR(36) NOT NULL,
    
    -- 基础信息
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    icon            VARCHAR(50) DEFAULT '📋',
    
    -- 工作流定义 (JSON)
    definition      JSON NOT NULL,
    variables       JSON DEFAULT (JSON_OBJECT()),
    
    -- 状态
    status          VARCHAR(20) DEFAULT 'draft',
    is_public       BOOLEAN DEFAULT FALSE,
    
    -- 执行配置
    trigger_type    VARCHAR(50) DEFAULT 'manual',
    trigger_config  JSON DEFAULT (JSON_OBJECT()),
    
    -- 统计
    run_count       INT DEFAULT 0,
    star_count      INT DEFAULT 0,
    fork_count      INT DEFAULT 0,
    
    -- 版本
    version         INT DEFAULT 1,
    
    -- 时间戳
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    published_at    DATETIME,
    deleted_at      DATETIME,
    
    -- 文件夹
    folder_id       CHAR(36),
    
    INDEX idx_what_reverse_workflows_user (user_id),
    INDEX idx_what_reverse_workflows_status (status),
    INDEX idx_what_reverse_workflows_deleted_at (deleted_at),
    FOREIGN KEY (user_id) REFERENCES what_reverse_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- 执行记录表 (what_reverse_executions)
-- =====================
CREATE TABLE what_reverse_executions (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    workflow_id     CHAR(36) NOT NULL,
    user_id         CHAR(36) NOT NULL,
    
    -- 执行状态
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',
    
    -- 触发信息
    trigger_type    VARCHAR(50) NOT NULL,
    trigger_data    JSON DEFAULT (JSON_OBJECT()),
    
    -- 执行数据
    inputs          JSON DEFAULT (JSON_OBJECT()),
    outputs         JSON DEFAULT (JSON_OBJECT()),
    context         JSON DEFAULT (JSON_OBJECT()),
    
    -- 性能指标
    started_at      DATETIME,
    completed_at    DATETIME,
    duration_ms     INT,
    
    -- 错误信息
    error_message   TEXT,
    error_node_id   VARCHAR(100),
    
    -- 资源消耗
    token_usage     JSON DEFAULT (JSON_OBJECT()),
    
    -- 时间戳
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_what_reverse_executions_workflow (workflow_id),
    INDEX idx_what_reverse_executions_user (user_id),
    INDEX idx_what_reverse_executions_status (status),
    INDEX idx_what_reverse_executions_created (created_at),
    FOREIGN KEY (workflow_id) REFERENCES what_reverse_workflows(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES what_reverse_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- 节点执行日志表 (what_reverse_node_logs)
-- =====================
CREATE TABLE what_reverse_node_logs (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    execution_id    CHAR(36) NOT NULL,
    node_id         VARCHAR(100) NOT NULL,
    node_type       VARCHAR(50) NOT NULL,
    
    -- 执行数据
    status          VARCHAR(20) NOT NULL,
    inputs          JSON DEFAULT (JSON_OBJECT()),
    outputs         JSON DEFAULT (JSON_OBJECT()),
    
    -- 时间
    started_at      DATETIME,
    completed_at    DATETIME,
    duration_ms     INT,
    
    -- 错误
    error_message   TEXT,
    
    -- 日志
    logs            JSON DEFAULT (JSON_ARRAY()),
    
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_what_reverse_node_logs_execution (execution_id),
    INDEX idx_what_reverse_node_logs_node (node_id),
    FOREIGN KEY (execution_id) REFERENCES what_reverse_executions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- API 密钥表 (what_reverse_api_keys)
-- =====================
CREATE TABLE what_reverse_api_keys (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id         CHAR(36) NOT NULL,
    
    provider        VARCHAR(50) NOT NULL,
    name            VARCHAR(100) NOT NULL,
    key_encrypted   TEXT NOT NULL,
    key_preview     VARCHAR(20),
    
    is_active       BOOLEAN DEFAULT TRUE,
    last_used_at    DATETIME,
    
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_what_reverse_api_keys_user (user_id),
    FOREIGN KEY (user_id) REFERENCES what_reverse_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- Agent 表 (what_reverse_agents)
-- =====================
CREATE TABLE what_reverse_agents (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id         CHAR(36) NOT NULL,
    workflow_id     CHAR(36) NOT NULL,
    
    -- 基础信息
    name            VARCHAR(200) NOT NULL,
    slug            VARCHAR(100) UNIQUE NOT NULL,
    description     TEXT,
    long_description TEXT,
    icon            VARCHAR(50) DEFAULT '🤖',
    cover_image     VARCHAR(500),
    
    -- 分类
    category        VARCHAR(50),
    tags            JSON DEFAULT (JSON_ARRAY()),
    
    -- 状态
    status          VARCHAR(20) DEFAULT 'draft',
    
    -- 定价
    pricing_type    VARCHAR(20) DEFAULT 'free',
    price           DECIMAL(10, 2),
    currency        VARCHAR(10) DEFAULT 'CNY',
    
    -- 统计
    use_count       INT DEFAULT 0,
    star_count      INT DEFAULT 0,
    review_count    INT DEFAULT 0,
    avg_rating      DECIMAL(3, 2) DEFAULT 0,
    revenue         DECIMAL(12, 2) DEFAULT 0,
    
    -- 媒体
    screenshots     JSON DEFAULT (JSON_ARRAY()),
    demo_video      VARCHAR(500),
    
    -- 时间戳
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    published_at    DATETIME,
    deleted_at      DATETIME,
    
    INDEX idx_what_reverse_agents_user (user_id),
    INDEX idx_what_reverse_agents_slug (slug),
    INDEX idx_what_reverse_agents_category (category),
    INDEX idx_what_reverse_agents_status (status),
    INDEX idx_what_reverse_agents_deleted_at (deleted_at),
    FOREIGN KEY (user_id) REFERENCES what_reverse_users(id),
    FOREIGN KEY (workflow_id) REFERENCES what_reverse_workflows(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- 评价表 (what_reverse_reviews)
-- =====================
CREATE TABLE what_reverse_reviews (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    agent_id        CHAR(36) NOT NULL,
    user_id         CHAR(36) NOT NULL,
    
    rating          INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title           VARCHAR(200),
    content         TEXT,
    
    helpful_count   INT DEFAULT 0,
    
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      DATETIME,
    
    UNIQUE KEY unique_agent_user (agent_id, user_id),
    INDEX idx_what_reverse_reviews_agent (agent_id),
    INDEX idx_what_reverse_reviews_user (user_id),
    FOREIGN KEY (agent_id) REFERENCES what_reverse_agents(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES what_reverse_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- 收藏表 (what_reverse_stars)
-- =====================
CREATE TABLE what_reverse_stars (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id         CHAR(36) NOT NULL,
    agent_id        CHAR(36) NOT NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_user_agent (user_id, agent_id),
    INDEX idx_what_reverse_stars_user (user_id),
    INDEX idx_what_reverse_stars_agent (agent_id),
    FOREIGN KEY (user_id) REFERENCES what_reverse_users(id) ON DELETE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES what_reverse_agents(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
