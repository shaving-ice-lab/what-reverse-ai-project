-- 回滚 App 域名证书重试字段
-- 版本: 000025
-- 创建时间: 2026-02-02

ALTER TABLE what_reverse_app_domains
    DROP COLUMN ssl_next_retry_at,
    DROP COLUMN last_ssl_error,
    DROP COLUMN ssl_issue_attempts;
