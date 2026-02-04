-- API 密钥增加轮换/吊销/权限字段
-- 版本: 000025
-- 创建时间: 2026-02-02

ALTER TABLE what_reverse_api_keys
    ADD COLUMN scopes JSON DEFAULT (JSON_ARRAY()) AFTER key_preview,
    ADD COLUMN last_rotated_at DATETIME AFTER last_used_at,
    ADD COLUMN revoked_at DATETIME AFTER last_rotated_at,
    ADD COLUMN revoked_by CHAR(36) AFTER revoked_at,
    ADD COLUMN revoked_reason VARCHAR(255) AFTER revoked_by,
    ADD INDEX idx_api_keys_active (is_active),
    ADD INDEX idx_api_keys_revoked (revoked_at),
    ADD INDEX idx_api_keys_rotated (last_rotated_at),
    ADD INDEX idx_api_keys_provider (provider);
