-- 添加 Workspace 导出任务表
-- 版本: 000027
-- 创建时间: 2026-02-02

CREATE TABLE what_reverse_workspace_export_jobs (
    id            CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    workspace_id  CHAR(36) NOT NULL,
    requested_by  CHAR(36),
    export_type   VARCHAR(30) NOT NULL,
    status        VARCHAR(20) DEFAULT 'pending',
    file_name     VARCHAR(255),
    file_path     VARCHAR(512),
    file_size     BIGINT,
    checksum      VARCHAR(128),
    error_message TEXT,
    started_at    DATETIME,
    completed_at  DATETIME,
    expires_at    DATETIME,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_workspace_export_jobs_workspace (workspace_id),
    INDEX idx_workspace_export_jobs_status (status),
    INDEX idx_workspace_export_jobs_type (export_type),
    INDEX idx_workspace_export_jobs_requested_by (requested_by),
    INDEX idx_workspace_export_jobs_expires_at (expires_at),
    FOREIGN KEY (workspace_id) REFERENCES what_reverse_workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (requested_by) REFERENCES what_reverse_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
