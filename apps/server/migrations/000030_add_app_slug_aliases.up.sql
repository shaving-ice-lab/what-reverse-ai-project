-- 添加 App Slug 别名表
-- 版本: 000030
-- 创建时间: 2026-02-02

CREATE TABLE what_reverse_app_slug_aliases (
    id            CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    app_id        CHAR(36) NOT NULL,
    workspace_id  CHAR(36) NOT NULL,
    slug          VARCHAR(100) NOT NULL,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uniq_app_slug_alias (workspace_id, slug),
    INDEX idx_app_slug_alias_app (app_id),
    INDEX idx_app_slug_alias_workspace (workspace_id),
    FOREIGN KEY (app_id) REFERENCES what_reverse_apps(id) ON DELETE CASCADE,
    FOREIGN KEY (workspace_id) REFERENCES what_reverse_workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
