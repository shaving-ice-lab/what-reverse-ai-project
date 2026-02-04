-- 回滚域名生命周期字段
-- 版本: 000034
-- 创建时间: 2026-02-02

ALTER TABLE what_reverse_app_domains
    DROP INDEX idx_app_domains_domain_expires_at,
    DROP INDEX idx_app_domains_ssl_expires_at,
    DROP COLUMN ssl_expiry_notified_at,
    DROP COLUMN blocked_reason,
    DROP COLUMN blocked_at,
    DROP COLUMN domain_expiry_notified_at,
    DROP COLUMN domain_expires_at;
