-- 添加数据分析平台与数仓接口表
-- 版本: 000033
-- 创建时间: 2026-02-02

-- =====================
-- 指标口径定义表 (what_reverse_analytics_metric_definitions)
-- =====================
CREATE TABLE what_reverse_analytics_metric_definitions (
    id             CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    workspace_id   CHAR(36) NOT NULL,
    name           VARCHAR(120) NOT NULL,
    display_name   VARCHAR(160),
    description    TEXT,
    unit           VARCHAR(40),
    formula        TEXT,
    dimensions_json JSON,
    tags_json       JSON,
    is_active      TINYINT(1) DEFAULT 1,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_metric_def_workspace_name (workspace_id, name),
    INDEX idx_metric_def_workspace (workspace_id),
    INDEX idx_metric_def_active (is_active),
    FOREIGN KEY (workspace_id) REFERENCES what_reverse_workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- 指标入湖表 (what_reverse_analytics_metrics)
-- =====================
CREATE TABLE what_reverse_analytics_metrics (
    id             CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    workspace_id   CHAR(36) NOT NULL,
    app_id         CHAR(36),
    definition_id  CHAR(36),
    name           VARCHAR(120) NOT NULL,
    unit           VARCHAR(40),
    value          DOUBLE NOT NULL,
    recorded_at    DATETIME NOT NULL,
    labels_json    JSON,
    metadata_json  JSON,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_metrics_workspace (workspace_id),
    INDEX idx_metrics_app (app_id),
    INDEX idx_metrics_name (name),
    INDEX idx_metrics_recorded_at (recorded_at),
    FOREIGN KEY (workspace_id) REFERENCES what_reverse_workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (definition_id) REFERENCES what_reverse_analytics_metric_definitions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- 数据导出任务表 (what_reverse_analytics_exports)
-- =====================
CREATE TABLE what_reverse_analytics_exports (
    id             CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    workspace_id   CHAR(36) NOT NULL,
    requested_by   CHAR(36),
    export_type    VARCHAR(30) NOT NULL,
    format         VARCHAR(20) NOT NULL,
    status         VARCHAR(20) DEFAULT 'pending',
    filter_json    JSON,
    file_name      VARCHAR(255),
    file_path      VARCHAR(512),
    file_size      BIGINT,
    checksum       VARCHAR(128),
    error_message  TEXT,
    started_at     DATETIME,
    completed_at   DATETIME,
    expires_at     DATETIME,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_analytics_exports_workspace (workspace_id),
    INDEX idx_analytics_exports_status (status),
    INDEX idx_analytics_exports_created_at (created_at),
    FOREIGN KEY (workspace_id) REFERENCES what_reverse_workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (requested_by) REFERENCES what_reverse_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- 数据订阅表 (what_reverse_analytics_subscriptions)
-- =====================
CREATE TABLE what_reverse_analytics_subscriptions (
    id             CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    workspace_id   CHAR(36) NOT NULL,
    created_by     CHAR(36),
    name           VARCHAR(120) NOT NULL,
    export_type    VARCHAR(30) NOT NULL,
    format         VARCHAR(20) NOT NULL,
    delivery_type  VARCHAR(30) NOT NULL,
    destination    VARCHAR(512),
    schedule       VARCHAR(50),
    status         VARCHAR(20) DEFAULT 'active',
    filter_json    JSON,
    last_run_at    DATETIME,
    last_export_id CHAR(36),
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_analytics_subscriptions_workspace (workspace_id),
    INDEX idx_analytics_subscriptions_status (status),
    FOREIGN KEY (workspace_id) REFERENCES what_reverse_workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES what_reverse_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
