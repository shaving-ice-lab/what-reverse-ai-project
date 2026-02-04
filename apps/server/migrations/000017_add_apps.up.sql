-- 添加 App 相关表
-- 版本: 000017
-- 创建时间: 2026-02-02

-- =====================
-- App 表 (what_reverse_apps)
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
-- App 版本表 (what_reverse_app_versions)
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
-- App 访问策略表 (what_reverse_app_access_policies)
-- =====================
CREATE TABLE what_reverse_app_access_policies (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    app_id          CHAR(36) NOT NULL,
    access_mode     VARCHAR(30) DEFAULT 'private',
    rate_limit_json JSON,
    allowed_origins JSON DEFAULT (JSON_ARRAY()),
    require_captcha BOOLEAN DEFAULT FALSE,
    updated_by      CHAR(36),
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uniq_app_policy (app_id),
    INDEX idx_app_policy_app (app_id),
    INDEX idx_app_policy_mode (access_mode),
    FOREIGN KEY (app_id) REFERENCES what_reverse_apps(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES what_reverse_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- App 域名表 (what_reverse_app_domains)
-- =====================
CREATE TABLE what_reverse_app_domains (
    id                 CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    app_id             CHAR(36) NOT NULL,
    domain             VARCHAR(255) NOT NULL,
    status             VARCHAR(20) DEFAULT 'pending',
    verification_token VARCHAR(100),
    verified_at        DATETIME,
    ssl_status         VARCHAR(20) DEFAULT 'pending',
    ssl_issued_at      DATETIME,
    ssl_expires_at     DATETIME,
    created_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uniq_app_domain (domain),
    INDEX idx_app_domains_app (app_id),
    INDEX idx_app_domains_status (status),
    FOREIGN KEY (app_id) REFERENCES what_reverse_apps(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
