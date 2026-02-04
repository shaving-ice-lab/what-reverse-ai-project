-- 添加 Webhook 投递记录
-- 版本: 000035
-- 创建时间: 2026-02-03

CREATE TABLE what_reverse_webhook_deliveries (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    endpoint_id     CHAR(36) NOT NULL,
    workspace_id    CHAR(36) NOT NULL,
    event_type      VARCHAR(100) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',
    attempt_count   INT NOT NULL DEFAULT 0,
    max_attempts    INT NOT NULL DEFAULT 3,
    last_attempt_at DATETIME,
    next_retry_at   DATETIME,
    last_status_code INT,
    last_error      TEXT,
    response_body   TEXT,
    payload         JSON,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_webhook_deliveries_endpoint (endpoint_id),
    INDEX idx_webhook_deliveries_workspace (workspace_id),
    INDEX idx_webhook_deliveries_status (status),
    INDEX idx_webhook_deliveries_event_type (event_type),
    INDEX idx_webhook_deliveries_created_at (created_at),
    FOREIGN KEY (endpoint_id) REFERENCES what_reverse_webhook_endpoints(id) ON DELETE CASCADE,
    FOREIGN KEY (workspace_id) REFERENCES what_reverse_workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
