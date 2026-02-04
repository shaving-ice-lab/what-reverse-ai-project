-- 添加 App 会话封禁字段
-- 版本: 000021
-- 创建时间: 2026-02-02

ALTER TABLE what_reverse_app_sessions
    ADD COLUMN blocked_at DATETIME NULL AFTER expired_at,
    ADD COLUMN blocked_reason VARCHAR(255) NULL AFTER blocked_at;

CREATE INDEX idx_app_sessions_blocked_at ON what_reverse_app_sessions (blocked_at);
