-- 添加 App 会话与事件表
-- 版本: 000019
-- 创建时间: 2026-02-02

-- =====================
-- App 会话表 (what_reverse_app_sessions)
-- =====================
CREATE TABLE what_reverse_app_sessions (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    app_id          CHAR(36) NOT NULL,
    workspace_id    CHAR(36) NOT NULL,
    session_type    VARCHAR(20) DEFAULT 'anon',
    user_id         CHAR(36),
    ip_hash         VARCHAR(100),
    user_agent_hash VARCHAR(200),
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    expired_at      DATETIME,

    INDEX idx_app_sessions_app (app_id),
    INDEX idx_app_sessions_workspace (workspace_id),
    INDEX idx_app_sessions_session_type (session_type),
    INDEX idx_app_sessions_created (created_at),
    INDEX idx_app_sessions_user (user_id),
    FOREIGN KEY (app_id) REFERENCES what_reverse_apps(id) ON DELETE CASCADE,
    FOREIGN KEY (workspace_id) REFERENCES what_reverse_workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES what_reverse_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- App 事件表 (what_reverse_app_events)
-- =====================
CREATE TABLE what_reverse_app_events (
    id           CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    app_id       CHAR(36) NOT NULL,
    session_id   CHAR(36) NOT NULL,
    event_type   VARCHAR(50) NOT NULL,
    payload_json JSON,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_app_events_app (app_id),
    INDEX idx_app_events_session (session_id),
    INDEX idx_app_events_type (event_type),
    INDEX idx_app_events_created (created_at),
    FOREIGN KEY (app_id) REFERENCES what_reverse_apps(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES what_reverse_app_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
