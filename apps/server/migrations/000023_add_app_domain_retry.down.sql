-- 回滚 App 域名验证重试字段
-- 版本: 000023
-- 创建时间: 2026-02-02

ALTER TABLE what_reverse_app_domains
    DROP COLUMN support_url,
    DROP COLUMN next_retry_at,
    DROP COLUMN last_verification_error,
    DROP COLUMN verification_attempts;
