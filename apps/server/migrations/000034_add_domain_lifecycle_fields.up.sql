-- 添加域名生命周期字段
-- 版本: 000034
-- 创建时间: 2026-02-02

ALTER TABLE what_reverse_app_domains
    ADD COLUMN domain_expires_at DATETIME AFTER domain,
    ADD COLUMN domain_expiry_notified_at DATETIME AFTER domain_expires_at,
    ADD COLUMN blocked_at DATETIME AFTER status,
    ADD COLUMN blocked_reason VARCHAR(255) AFTER blocked_at,
    ADD COLUMN ssl_expiry_notified_at DATETIME AFTER ssl_expires_at,
    ADD INDEX idx_app_domains_domain_expires_at (domain_expires_at),
    ADD INDEX idx_app_domains_ssl_expires_at (ssl_expires_at);
