-- 添加规划模块（WBS 可编辑）
-- 版本: 000027
-- 创建时间: 2026-02-02

-- =====================
-- 规划模块表 (what_reverse_plan_modules)
-- =====================
CREATE TABLE what_reverse_plan_modules (
    id            CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    workspace_id  CHAR(36) NOT NULL,
    `key`         VARCHAR(50),
    name          VARCHAR(120) NOT NULL,
    description   TEXT,
    version       VARCHAR(20) DEFAULT 'v1',
    status        VARCHAR(20) DEFAULT 'active',
    sort_order    INT DEFAULT 0,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at    DATETIME NULL,

    INDEX idx_plan_modules_workspace (workspace_id),
    INDEX idx_plan_modules_key (`key`),
    INDEX idx_plan_modules_deleted (deleted_at),
    FOREIGN KEY (workspace_id) REFERENCES what_reverse_workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- 规划任务表 (what_reverse_plan_tasks)
-- =====================
CREATE TABLE what_reverse_plan_tasks (
    id                CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    module_id         CHAR(36) NOT NULL,
    title             VARCHAR(200) NOT NULL,
    phase             VARCHAR(40),
    owner             VARCHAR(50),
    deliverable       TEXT,
    acceptance        TEXT,
    estimate_days     INT DEFAULT 0,
    status            VARCHAR(20) DEFAULT 'todo',
    dependencies_json JSON,
    sequence          INT DEFAULT 0,
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at        DATETIME NULL,

    INDEX idx_plan_tasks_module (module_id),
    INDEX idx_plan_tasks_status (status),
    INDEX idx_plan_tasks_sequence (sequence),
    INDEX idx_plan_tasks_deleted (deleted_at),
    FOREIGN KEY (module_id) REFERENCES what_reverse_plan_modules(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
