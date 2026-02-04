-- 添加模型用量统计表
-- 版本: 000032
-- 创建时间: 2026-02-02

-- =====================
-- 模型用量事件表 (what_reverse_model_usage_events)
-- =====================
CREATE TABLE what_reverse_model_usage_events (
    id               CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    workspace_id     CHAR(36) NOT NULL,
    user_id          CHAR(36) NOT NULL,
    execution_id     CHAR(36),
    workflow_id      CHAR(36),
    node_id          VARCHAR(120),
    provider         VARCHAR(50) NOT NULL,
    model            VARCHAR(100) NOT NULL,
    strategy         VARCHAR(30) DEFAULT 'quality',
    prompt_tokens    INT DEFAULT 0,
    completion_tokens INT DEFAULT 0,
    total_tokens     INT DEFAULT 0,
    cost_amount      DECIMAL(12, 6) DEFAULT 0,
    currency         VARCHAR(10) DEFAULT 'USD',
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at       DATETIME,

    INDEX idx_model_usage_workspace (workspace_id),
    INDEX idx_model_usage_user (user_id),
    INDEX idx_model_usage_model (provider, model),
    INDEX idx_model_usage_created_at (created_at),
    INDEX idx_model_usage_deleted_at (deleted_at),
    FOREIGN KEY (workspace_id) REFERENCES what_reverse_workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES what_reverse_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
