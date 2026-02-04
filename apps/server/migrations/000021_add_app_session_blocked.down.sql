-- 移除 App 会话封禁字段
-- 版本: 000021
-- 创建时间: 2026-02-02

DROP INDEX idx_app_sessions_blocked_at ON what_reverse_app_sessions;

ALTER TABLE what_reverse_app_sessions
    DROP COLUMN blocked_reason,
    DROP COLUMN blocked_at;
