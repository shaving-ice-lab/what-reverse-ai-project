-- 应用运行时认证：App Users + Auth Sessions
-- 版本: 000013
-- 创建时间: 2026-02-11
-- 功能: 为已发布应用的最终用户提供注册/登录/会话管理能力

-- App Users: 应用自身的用户表（区别于平台用户 what_reverse_users）
CREATE TABLE IF NOT EXISTS what_reverse_app_users (
    id              CHAR(36)        NOT NULL PRIMARY KEY,
    workspace_id    CHAR(36)        NOT NULL COMMENT '所属 Workspace（App）',
    email           VARCHAR(255)    NOT NULL,
    password_hash   VARCHAR(255)    NOT NULL,
    display_name    VARCHAR(100)    NULL,
    role            VARCHAR(20)     NOT NULL DEFAULT 'user' COMMENT 'user | admin | viewer',
    status          VARCHAR(20)     NOT NULL DEFAULT 'active' COMMENT 'active | blocked | pending',
    last_login_at   DATETIME(3)     NULL,
    created_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX uniq_app_user_email (workspace_id, email),
    INDEX idx_app_users_workspace (workspace_id),
    INDEX idx_app_users_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 扩展 workspace_sessions 表：新增认证相关字段
ALTER TABLE what_reverse_workspace_sessions
    ADD COLUMN app_user_id     CHAR(36)    NULL AFTER user_id,
    ADD COLUMN token_hash      VARCHAR(255) NULL COMMENT 'Session token hash for auth sessions',
    ADD COLUMN auth_method     VARCHAR(20)  NULL DEFAULT 'password' COMMENT 'password | magic_link | oauth',
    ADD INDEX idx_ws_sessions_app_user (app_user_id),
    ADD INDEX idx_ws_sessions_token (token_hash);
