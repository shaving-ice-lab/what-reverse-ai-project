-- 添加 Workspace 相关表
-- 版本: 000015
-- 创建时间: 2026-02-02

-- =====================
-- 工作空间表 (what_reverse_workspaces)
-- =====================
CREATE TABLE what_reverse_workspaces (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    owner_user_id   CHAR(36) NOT NULL,
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(100) NOT NULL,
    status          VARCHAR(20) DEFAULT 'active',
    plan            VARCHAR(20) DEFAULT 'free',
    region          VARCHAR(50),
    default_app_id  CHAR(36),
    settings_json   JSON DEFAULT (JSON_OBJECT()),
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      DATETIME,

    UNIQUE KEY uniq_workspaces_slug (slug),
    INDEX idx_workspaces_owner (owner_user_id),
    INDEX idx_workspaces_status (status),
    INDEX idx_workspaces_deleted_at (deleted_at),
    FOREIGN KEY (owner_user_id) REFERENCES what_reverse_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- 工作空间角色表 (what_reverse_workspace_roles)
-- =====================
CREATE TABLE what_reverse_workspace_roles (
    id               CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    workspace_id     CHAR(36) NOT NULL,
    name             VARCHAR(50) NOT NULL,
    permissions_json JSON DEFAULT (JSON_OBJECT()),
    is_system        BOOLEAN DEFAULT FALSE,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_workspace_roles_workspace (workspace_id),
    INDEX idx_workspace_roles_name (name),
    FOREIGN KEY (workspace_id) REFERENCES what_reverse_workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- 工作空间成员表 (what_reverse_workspace_members)
-- =====================
CREATE TABLE what_reverse_workspace_members (
    id            CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    workspace_id  CHAR(36) NOT NULL,
    user_id       CHAR(36) NOT NULL,
    role_id       CHAR(36),
    status        VARCHAR(20) DEFAULT 'active',
    invited_by    CHAR(36),
    joined_at     DATETIME,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uniq_workspace_member (workspace_id, user_id),
    INDEX idx_workspace_members_workspace (workspace_id),
    INDEX idx_workspace_members_user (user_id),
    INDEX idx_workspace_members_role (role_id),
    FOREIGN KEY (workspace_id) REFERENCES what_reverse_workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES what_reverse_users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES what_reverse_workspace_roles(id) ON DELETE SET NULL,
    FOREIGN KEY (invited_by) REFERENCES what_reverse_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
