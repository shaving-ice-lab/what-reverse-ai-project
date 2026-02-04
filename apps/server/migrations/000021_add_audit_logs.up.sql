-- 添加审计日志表
-- 版本: 000021
-- 创建时间: 2026-02-02

-- =====================
-- 审计日志表 (what_reverse_audit_logs)
-- =====================
CREATE TABLE what_reverse_audit_logs (
    id             CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    workspace_id   CHAR(36) NOT NULL,
    actor_user_id  CHAR(36),
    action         VARCHAR(100) NOT NULL,
    target_type    VARCHAR(50) NOT NULL,
    target_id      CHAR(36),
    metadata_json  JSON DEFAULT (JSON_OBJECT()),
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_audit_logs_workspace (workspace_id),
    INDEX idx_audit_logs_actor (actor_user_id),
    INDEX idx_audit_logs_action (action),
    INDEX idx_audit_logs_target (target_type, target_id),
    FOREIGN KEY (workspace_id) REFERENCES what_reverse_workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (actor_user_id) REFERENCES what_reverse_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
