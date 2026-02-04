-- 回滚 API 密钥轮换/吊销/权限字段
-- 版本: 000025
-- 创建时间: 2026-02-02

ALTER TABLE what_reverse_api_keys
    DROP INDEX idx_api_keys_provider,
    DROP INDEX idx_api_keys_rotated,
    DROP INDEX idx_api_keys_revoked,
    DROP INDEX idx_api_keys_active,
    DROP COLUMN revoked_reason,
    DROP COLUMN revoked_by,
    DROP COLUMN revoked_at,
    DROP COLUMN last_rotated_at,
    DROP COLUMN scopes;
