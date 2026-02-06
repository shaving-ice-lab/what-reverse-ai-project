-- 合并 App 到 Workspace
-- 版本: 000037
-- 创建时间: 2026-02-06
-- 说明: 将 App 层级合并到 Workspace，一个 Workspace = 一个 SaaS 应用

-- =====================
-- 1. 为 Workspace 表添加 App 相关字段
-- =====================
ALTER TABLE what_reverse_workspaces
ADD COLUMN description TEXT AFTER icon,
ADD COLUMN app_status VARCHAR(20) DEFAULT 'draft' AFTER status,
ADD COLUMN current_version_id CHAR(36) AFTER app_status,
ADD COLUMN pricing_type VARCHAR(20) DEFAULT 'free' AFTER current_version_id,
ADD COLUMN price DECIMAL(10, 2) AFTER pricing_type,
ADD COLUMN published_at DATETIME AFTER price,
ADD COLUMN access_mode VARCHAR(30) DEFAULT 'private' AFTER published_at,
ADD COLUMN data_classification VARCHAR(30) DEFAULT 'public' AFTER access_mode,
ADD COLUMN rate_limit_json JSON AFTER data_classification,
ADD COLUMN allowed_origins JSON DEFAULT (JSON_ARRAY()) AFTER rate_limit_json,
ADD COLUMN require_captcha BOOLEAN DEFAULT FALSE AFTER allowed_origins;

-- 添加索引
ALTER TABLE what_reverse_workspaces
ADD INDEX idx_workspaces_app_status (app_status),
ADD INDEX idx_workspaces_access_mode (access_mode);

-- =====================
-- 2. 创建 Workspace 版本表 (从 app_versions 重构)
-- =====================
CREATE TABLE what_reverse_workspace_versions (
    id           CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    workspace_id CHAR(36) NOT NULL,
    version      VARCHAR(50) NOT NULL,
    changelog    TEXT,
    workflow_id  CHAR(36),
    ui_schema    JSON,
    db_schema    JSON,
    config_json  JSON,
    created_by   CHAR(36),
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uniq_workspace_version (workspace_id, version),
    INDEX idx_workspace_versions_workspace (workspace_id),
    INDEX idx_workspace_versions_created (created_at),
    FOREIGN KEY (workspace_id) REFERENCES what_reverse_workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (workflow_id) REFERENCES what_reverse_workflows(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES what_reverse_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- 3. 创建 Workspace 域名表 (从 app_domains 重构)
-- =====================
CREATE TABLE what_reverse_workspace_domains (
    id                     CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    workspace_id           CHAR(36) NOT NULL,
    domain                 VARCHAR(255) NOT NULL,
    status                 VARCHAR(20) DEFAULT 'pending',
    blocked_at             DATETIME,
    blocked_reason         VARCHAR(255),
    domain_expires_at      DATETIME,
    domain_expiry_notified_at DATETIME,
    verification_token     VARCHAR(100),
    verification_attempts  INT DEFAULT 0,
    last_verification_error VARCHAR(255),
    next_retry_at          DATETIME,
    support_url            VARCHAR(255),
    verified_at            DATETIME,
    ssl_status             VARCHAR(20) DEFAULT 'pending',
    ssl_issue_attempts     INT DEFAULT 0,
    last_ssl_error         VARCHAR(255),
    ssl_next_retry_at      DATETIME,
    ssl_issued_at          DATETIME,
    ssl_expires_at         DATETIME,
    ssl_expiry_notified_at DATETIME,
    created_at             DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at             DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uniq_workspace_domain (domain),
    INDEX idx_workspace_domains_workspace (workspace_id),
    INDEX idx_workspace_domains_status (status),
    FOREIGN KEY (workspace_id) REFERENCES what_reverse_workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- 4. 创建 Workspace 会话表 (从 app_sessions 重构)
-- =====================
CREATE TABLE what_reverse_workspace_sessions (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    workspace_id    CHAR(36) NOT NULL,
    session_type    VARCHAR(20) DEFAULT 'anon',
    user_id         CHAR(36),
    ip_hash         VARCHAR(100),
    user_agent_hash VARCHAR(200),
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    expired_at      DATETIME,
    blocked_at      DATETIME,
    blocked_reason  VARCHAR(255),

    INDEX idx_workspace_sessions_workspace (workspace_id),
    INDEX idx_workspace_sessions_session_type (session_type),
    INDEX idx_workspace_sessions_created (created_at),
    INDEX idx_workspace_sessions_user (user_id),
    FOREIGN KEY (workspace_id) REFERENCES what_reverse_workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES what_reverse_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- 5. 创建 Workspace 事件表 (从 app_events 重构)
-- =====================
CREATE TABLE what_reverse_workspace_events (
    id           CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    workspace_id CHAR(36) NOT NULL,
    session_id   CHAR(36) NOT NULL,
    event_type   VARCHAR(50) NOT NULL,
    payload_json JSON,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_workspace_events_workspace (workspace_id),
    INDEX idx_workspace_events_session (session_id),
    INDEX idx_workspace_events_type (event_type),
    INDEX idx_workspace_events_created (created_at),
    FOREIGN KEY (workspace_id) REFERENCES what_reverse_workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES what_reverse_workspace_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- 6. 创建 Workspace 评分表 (从 app_ratings 重构)
-- =====================
CREATE TABLE what_reverse_workspace_ratings (
    id           CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    workspace_id CHAR(36) NOT NULL,
    user_id      CHAR(36) NOT NULL,
    rating       TINYINT NOT NULL,
    review       TEXT,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uniq_workspace_user_rating (workspace_id, user_id),
    INDEX idx_workspace_ratings_workspace (workspace_id),
    INDEX idx_workspace_ratings_user (user_id),
    INDEX idx_workspace_ratings_rating (rating),
    FOREIGN KEY (workspace_id) REFERENCES what_reverse_workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES what_reverse_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- 7. 删除 Workspace 中不再需要的 default_app_id 字段
-- =====================
ALTER TABLE what_reverse_workspaces
DROP COLUMN default_app_id;

-- =====================
-- 8. 更新引用 app_id 的表
-- =====================

-- 8.1 更新 conversations 表 (移除 app_id 列，因为现在直接关联 workspace)
-- 注意: 如果存在外键约束，需要先删除
ALTER TABLE what_reverse_conversations
DROP COLUMN IF EXISTS app_id;

-- 8.2 更新 billing_usage_events 表
ALTER TABLE what_reverse_billing_usage_events
DROP COLUMN IF EXISTS app_id;

-- 8.3 更新 app_usage_stats 表 -> 重命名为 workspace_usage_stats
DROP TABLE IF EXISTS what_reverse_app_usage_stats;
CREATE TABLE what_reverse_workspace_usage_stats (
    id                CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    workspace_id      CHAR(36) NOT NULL,
    date              DATE NOT NULL,
    total_executions  INT DEFAULT 0,
    success_count     INT DEFAULT 0,
    failure_count     INT DEFAULT 0,
    total_tokens      BIGINT DEFAULT 0,
    total_duration_ms BIGINT DEFAULT 0,
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uniq_workspace_usage_date (workspace_id, date),
    INDEX idx_workspace_usage_workspace (workspace_id),
    INDEX idx_workspace_usage_date (date),
    FOREIGN KEY (workspace_id) REFERENCES what_reverse_workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8.4 更新 idempotency_keys 表
ALTER TABLE what_reverse_idempotency_keys
DROP COLUMN IF EXISTS app_id;

-- 8.5 更新 workspace_db_roles 表
ALTER TABLE what_reverse_workspace_db_roles
DROP COLUMN IF EXISTS app_id;

-- =====================
-- 9. 删除旧的 App 相关表 (级联删除会自动处理依赖)
-- =====================
-- 先删除依赖表
DROP TABLE IF EXISTS what_reverse_app_events;
DROP TABLE IF EXISTS what_reverse_app_sessions;
DROP TABLE IF EXISTS what_reverse_app_ratings;
DROP TABLE IF EXISTS what_reverse_app_slug_aliases;
DROP TABLE IF EXISTS what_reverse_app_domains;
DROP TABLE IF EXISTS what_reverse_app_versions;
DROP TABLE IF EXISTS what_reverse_app_access_policies;
DROP TABLE IF EXISTS what_reverse_apps;
