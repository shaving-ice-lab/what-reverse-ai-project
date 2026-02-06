-- 回滚: 合并 App 到 Workspace
-- 版本: 000037
-- 说明: 恢复 App 独立表结构

-- =====================
-- 1. 恢复 App 表
-- =====================
CREATE TABLE what_reverse_apps (
    id                CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    workspace_id      CHAR(36) NOT NULL,
    owner_user_id     CHAR(36) NOT NULL,
    name              VARCHAR(200) NOT NULL,
    slug              VARCHAR(100) NOT NULL,
    icon              VARCHAR(50) DEFAULT '📦',
    description       TEXT,
    status            VARCHAR(20) DEFAULT 'draft',
    current_version_id CHAR(36),
    pricing_type      VARCHAR(20) DEFAULT 'free',
    price             DECIMAL(10, 2),
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    published_at      DATETIME,
    deleted_at        DATETIME,

    UNIQUE KEY uniq_apps_workspace_slug (workspace_id, slug),
    INDEX idx_apps_workspace (workspace_id),
    INDEX idx_apps_owner (owner_user_id),
    INDEX idx_apps_status (status),
    INDEX idx_apps_deleted_at (deleted_at),
    FOREIGN KEY (workspace_id) REFERENCES what_reverse_workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_user_id) REFERENCES what_reverse_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- 2. 恢复 App 版本表
-- =====================
CREATE TABLE what_reverse_app_versions (
    id           CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    app_id       CHAR(36) NOT NULL,
    version      VARCHAR(50) NOT NULL,
    changelog    TEXT,
    workflow_id  CHAR(36),
    ui_schema    JSON,
    db_schema    JSON,
    config_json  JSON,
    created_by   CHAR(36),
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uniq_app_version (app_id, version),
    INDEX idx_app_versions_app (app_id),
    INDEX idx_app_versions_created (created_at),
    FOREIGN KEY (app_id) REFERENCES what_reverse_apps(id) ON DELETE CASCADE,
    FOREIGN KEY (workflow_id) REFERENCES what_reverse_workflows(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES what_reverse_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- 3. 恢复 App 访问策略表
-- =====================
CREATE TABLE what_reverse_app_access_policies (
    id                  CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    app_id              CHAR(36) NOT NULL,
    access_mode         VARCHAR(30) DEFAULT 'private',
    data_classification VARCHAR(30) DEFAULT 'public',
    rate_limit_json     JSON,
    allowed_origins     JSON DEFAULT (JSON_ARRAY()),
    require_captcha     BOOLEAN DEFAULT FALSE,
    updated_by          CHAR(36),
    updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uniq_app_policy (app_id),
    INDEX idx_app_policy_app (app_id),
    INDEX idx_app_policy_mode (access_mode),
    FOREIGN KEY (app_id) REFERENCES what_reverse_apps(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES what_reverse_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- 4. 恢复 App 域名表
-- =====================
CREATE TABLE what_reverse_app_domains (
    id                     CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    app_id                 CHAR(36) NOT NULL,
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

    UNIQUE KEY uniq_app_domain (domain),
    INDEX idx_app_domains_app (app_id),
    INDEX idx_app_domains_status (status),
    FOREIGN KEY (app_id) REFERENCES what_reverse_apps(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- 5. 恢复 App 会话表
-- =====================
CREATE TABLE what_reverse_app_sessions (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    app_id          CHAR(36) NOT NULL,
    workspace_id    CHAR(36) NOT NULL,
    session_type    VARCHAR(20) DEFAULT 'anon',
    user_id         CHAR(36),
    ip_hash         VARCHAR(100),
    user_agent_hash VARCHAR(200),
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    expired_at      DATETIME,
    blocked_at      DATETIME,
    blocked_reason  VARCHAR(255),

    INDEX idx_app_sessions_app (app_id),
    INDEX idx_app_sessions_workspace (workspace_id),
    INDEX idx_app_sessions_session_type (session_type),
    INDEX idx_app_sessions_created (created_at),
    INDEX idx_app_sessions_user (user_id),
    FOREIGN KEY (app_id) REFERENCES what_reverse_apps(id) ON DELETE CASCADE,
    FOREIGN KEY (workspace_id) REFERENCES what_reverse_workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES what_reverse_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- 6. 恢复 App 事件表
-- =====================
CREATE TABLE what_reverse_app_events (
    id           CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    app_id       CHAR(36) NOT NULL,
    session_id   CHAR(36) NOT NULL,
    event_type   VARCHAR(50) NOT NULL,
    payload_json JSON,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_app_events_app (app_id),
    INDEX idx_app_events_session (session_id),
    INDEX idx_app_events_type (event_type),
    INDEX idx_app_events_created (created_at),
    FOREIGN KEY (app_id) REFERENCES what_reverse_apps(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES what_reverse_app_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- 7. 恢复 App 评分表
-- =====================
CREATE TABLE what_reverse_app_ratings (
    id         CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    app_id     CHAR(36) NOT NULL,
    user_id    CHAR(36) NOT NULL,
    rating     TINYINT NOT NULL,
    review     TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uniq_app_user_rating (app_id, user_id),
    INDEX idx_app_ratings_app (app_id),
    INDEX idx_app_ratings_user (user_id),
    INDEX idx_app_ratings_rating (rating),
    FOREIGN KEY (app_id) REFERENCES what_reverse_apps(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES what_reverse_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- 8. 恢复 App Slug 别名表
-- =====================
CREATE TABLE what_reverse_app_slug_aliases (
    id         CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    app_id     CHAR(36) NOT NULL,
    alias_slug VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uniq_app_alias_slug (alias_slug),
    INDEX idx_app_slug_aliases_app (app_id),
    FOREIGN KEY (app_id) REFERENCES what_reverse_apps(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- 9. 删除新的 Workspace 相关表
-- =====================
DROP TABLE IF EXISTS what_reverse_workspace_events;
DROP TABLE IF EXISTS what_reverse_workspace_sessions;
DROP TABLE IF EXISTS what_reverse_workspace_ratings;
DROP TABLE IF EXISTS what_reverse_workspace_domains;
DROP TABLE IF EXISTS what_reverse_workspace_versions;
DROP TABLE IF EXISTS what_reverse_workspace_usage_stats;

-- =====================
-- 10. 恢复 Workspace 表原有结构
-- =====================
ALTER TABLE what_reverse_workspaces
DROP INDEX idx_workspaces_app_status,
DROP INDEX idx_workspaces_access_mode,
DROP COLUMN description,
DROP COLUMN app_status,
DROP COLUMN current_version_id,
DROP COLUMN pricing_type,
DROP COLUMN price,
DROP COLUMN published_at,
DROP COLUMN access_mode,
DROP COLUMN data_classification,
DROP COLUMN rate_limit_json,
DROP COLUMN allowed_origins,
DROP COLUMN require_captcha,
ADD COLUMN default_app_id CHAR(36) AFTER region;

-- =====================
-- 11. 恢复 app_usage_stats 表
-- =====================
CREATE TABLE what_reverse_app_usage_stats (
    id                CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    app_id            CHAR(36) NOT NULL,
    workspace_id      CHAR(36) NOT NULL,
    date              DATE NOT NULL,
    total_executions  INT DEFAULT 0,
    success_count     INT DEFAULT 0,
    failure_count     INT DEFAULT 0,
    total_tokens      BIGINT DEFAULT 0,
    total_duration_ms BIGINT DEFAULT 0,
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uniq_app_usage_date (app_id, date),
    INDEX idx_app_usage_app (app_id),
    INDEX idx_app_usage_workspace (workspace_id),
    INDEX idx_app_usage_date (date),
    FOREIGN KEY (app_id) REFERENCES what_reverse_apps(id) ON DELETE CASCADE,
    FOREIGN KEY (workspace_id) REFERENCES what_reverse_workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
