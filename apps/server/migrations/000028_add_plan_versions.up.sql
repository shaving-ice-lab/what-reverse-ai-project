-- 添加规划版本与任务编码
-- 版本: 000028
-- 创建时间: 2026-02-02

-- =====================
-- 规划任务新增 code 字段
-- =====================
ALTER TABLE what_reverse_plan_tasks
    ADD COLUMN code VARCHAR(80) NULL AFTER module_id,
    ADD INDEX idx_plan_tasks_code (code);

-- =====================
-- 规划版本表 (what_reverse_plan_versions)
-- =====================
CREATE TABLE what_reverse_plan_versions (
    id            CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    workspace_id  CHAR(36) NOT NULL,
    label         VARCHAR(100),
    note          TEXT,
    snapshot_json JSON,
    created_by    CHAR(36),
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at    DATETIME NULL,

    INDEX idx_plan_versions_workspace (workspace_id),
    INDEX idx_plan_versions_created_at (created_at),
    INDEX idx_plan_versions_deleted (deleted_at),
    FOREIGN KEY (workspace_id) REFERENCES what_reverse_workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
