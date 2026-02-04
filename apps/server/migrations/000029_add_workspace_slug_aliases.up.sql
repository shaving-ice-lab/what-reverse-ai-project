-- 添加 Workspace Slug 别名表
-- 版本: 000029
-- 创建时间: 2026-02-02

CREATE TABLE what_reverse_workspace_slug_aliases (
    id           CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    workspace_id CHAR(36) NOT NULL,
    slug         VARCHAR(100) NOT NULL,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uniq_workspace_slug_alias (slug),
    INDEX idx_workspace_slug_alias_workspace (workspace_id),
    FOREIGN KEY (workspace_id) REFERENCES what_reverse_workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
