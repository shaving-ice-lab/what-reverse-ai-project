-- 添加 App 域名验证重试字段
-- 版本: 000023
-- 创建时间: 2026-02-02

ALTER TABLE what_reverse_app_domains
    ADD COLUMN verification_attempts INT DEFAULT 0 AFTER verification_token,
    ADD COLUMN last_verification_error VARCHAR(255) AFTER verification_attempts,
    ADD COLUMN next_retry_at DATETIME AFTER last_verification_error,
    ADD COLUMN support_url VARCHAR(255) AFTER next_retry_at;
