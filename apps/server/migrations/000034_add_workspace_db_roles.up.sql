-- 添加 Workspace DB 角色表
-- 版本: 000034
-- 创建时间: 2026-02-02

CREATE TABLE what_reverse_workspace_db_roles (
    id             CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    workspace_id   CHAR(36) NOT NULL,
    app_id         CHAR(36),
    role_type      VARCHAR(20) NOT NULL,
    db_user        VARCHAR(100) NOT NULL,
    secret_ref     VARCHAR(200),
    status         VARCHAR(20) DEFAULT 'active',
    expires_at     DATETIME,
    last_used_at   DATETIME,
    last_rotated_at DATETIME,
    revoked_at     DATETIME,
    revoked_by     CHAR(36),
    revoked_reason VARCHAR(255),
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uniq_workspace_app_role_status (workspace_id, app_id, role_type, status),
    INDEX idx_workspace_db_roles_workspace (workspace_id),
    INDEX idx_workspace_db_roles_app (app_id),
    INDEX idx_workspace_db_roles_role_type (role_type),
    INDEX idx_workspace_db_roles_status (status),
    INDEX idx_workspace_db_roles_expires_at (expires_at),
    FOREIGN KEY (workspace_id) REFERENCES what_reverse_workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (app_id) REFERENCES what_reverse_apps(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
