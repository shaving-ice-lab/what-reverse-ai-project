-- 添加 App 域名证书重试字段
-- 版本: 000025
-- 创建时间: 2026-02-02

ALTER TABLE what_reverse_app_domains
    ADD COLUMN ssl_issue_attempts INT DEFAULT 0 AFTER ssl_status,
    ADD COLUMN last_ssl_error VARCHAR(255) AFTER ssl_issue_attempts,
    ADD COLUMN ssl_next_retry_at DATETIME AFTER last_ssl_error;
