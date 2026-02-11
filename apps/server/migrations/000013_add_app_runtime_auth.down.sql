-- Rollback: App Runtime Auth
-- 版本: 000013

ALTER TABLE what_reverse_workspace_sessions
    DROP INDEX idx_ws_sessions_token,
    DROP INDEX idx_ws_sessions_app_user,
    DROP COLUMN auth_method,
    DROP COLUMN token_hash,
    DROP COLUMN app_user_id;

DROP TABLE IF EXISTS what_reverse_app_users;
