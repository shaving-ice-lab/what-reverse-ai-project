-- 添加计费与配额相关表
-- 版本: 000022
-- 创建时间: 2026-02-02

-- =====================
-- 计费套餐表 (what_reverse_billing_plans)
-- =====================
CREATE TABLE what_reverse_billing_plans (
    id                CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    code              VARCHAR(30) NOT NULL,
    name              VARCHAR(100) NOT NULL,
    description       TEXT,
    price_monthly     DECIMAL(10, 2) DEFAULT 0,
    price_yearly      DECIMAL(10, 2) DEFAULT 0,
    currency          VARCHAR(10) DEFAULT 'CNY',
    quota_limits_json JSON,
    rate_rules_json   JSON,
    policy_json       JSON,
    status            VARCHAR(20) DEFAULT 'active',
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uniq_billing_plan_code (code),
    INDEX idx_billing_plans_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- Workspace 配额表 (what_reverse_workspace_quotas)
-- =====================
CREATE TABLE what_reverse_workspace_quotas (
    id            CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    workspace_id  CHAR(36) NOT NULL,
    plan_id       CHAR(36) NOT NULL,
    period_start  DATE NOT NULL,
    period_end    DATE NOT NULL,
    limits_json   JSON,
    usage_json    JSON,
    status        VARCHAR(20) DEFAULT 'active',
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uniq_workspace_quota_period (workspace_id, period_start, period_end),
    INDEX idx_workspace_quota_workspace (workspace_id),
    INDEX idx_workspace_quota_plan (plan_id),
    FOREIGN KEY (workspace_id) REFERENCES what_reverse_workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES what_reverse_billing_plans(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- 用量事件表 (what_reverse_billing_usage_events)
-- =====================
CREATE TABLE what_reverse_billing_usage_events (
    id            CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    workspace_id  CHAR(36) NOT NULL,
    app_id        CHAR(36),
    usage_json    JSON,
    cost_amount   DECIMAL(12, 2) DEFAULT 0,
    currency      VARCHAR(10) DEFAULT 'CNY',
    recorded_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_billing_usage_workspace (workspace_id),
    INDEX idx_billing_usage_app (app_id),
    INDEX idx_billing_usage_recorded_at (recorded_at),
    FOREIGN KEY (workspace_id) REFERENCES what_reverse_workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (app_id) REFERENCES what_reverse_apps(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- App 用量统计表 (what_reverse_app_usage_stats)
-- =====================
CREATE TABLE what_reverse_app_usage_stats (
    id            CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    workspace_id  CHAR(36) NOT NULL,
    app_id        CHAR(36) NOT NULL,
    period_start  DATE NOT NULL,
    period_end    DATE NOT NULL,
    usage_json    JSON,
    cost_amount   DECIMAL(12, 2) DEFAULT 0,
    currency      VARCHAR(10) DEFAULT 'CNY',
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uniq_app_usage_period (workspace_id, app_id, period_start, period_end),
    INDEX idx_app_usage_workspace (workspace_id),
    INDEX idx_app_usage_app (app_id),
    FOREIGN KEY (workspace_id) REFERENCES what_reverse_workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (app_id) REFERENCES what_reverse_apps(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
