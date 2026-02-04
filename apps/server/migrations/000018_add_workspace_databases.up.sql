-- 添加 Workspace 数据库连接表
-- 版本: 000018
-- 创建时间: 2026-02-02

CREATE TABLE what_reverse_workspace_databases (
    id            CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    workspace_id  CHAR(36) NOT NULL,
    db_name       VARCHAR(100) NOT NULL,
    db_user       VARCHAR(100) NOT NULL,
    db_host       VARCHAR(255),
    db_port       INT,
    secret_ref    VARCHAR(200),
    status        VARCHAR(20) DEFAULT 'pending',
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uniq_workspace_database (workspace_id),
    INDEX idx_workspace_databases_status (status),
    FOREIGN KEY (workspace_id) REFERENCES what_reverse_workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
