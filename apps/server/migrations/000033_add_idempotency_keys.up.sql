-- 添加幂等键表
-- 版本: 000033
-- 创建时间: 2026-02-02

CREATE TABLE what_reverse_idempotency_keys (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    owner_user_id   CHAR(36) NOT NULL,
    idempotency_key VARCHAR(100) NOT NULL,
    action          VARCHAR(50) NOT NULL,
    workspace_id    CHAR(36),
    app_id          CHAR(36),
    resource_id     CHAR(36),
    resource_type   VARCHAR(50),
    request_hash    VARCHAR(64),
    status          VARCHAR(20) DEFAULT 'processing',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uniq_idempotency_key (owner_user_id, action, idempotency_key),
    INDEX idx_idempotency_workspace (workspace_id),
    INDEX idx_idempotency_app (app_id),
    INDEX idx_idempotency_resource (resource_id),
    INDEX idx_idempotency_status (status),
    FOREIGN KEY (workspace_id) REFERENCES what_reverse_workspaces(id) ON DELETE SET NULL,
    FOREIGN KEY (app_id) REFERENCES what_reverse_apps(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
