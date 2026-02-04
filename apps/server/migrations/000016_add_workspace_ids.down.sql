-- 回滚 workspace_id 相关变更
-- 版本: 000016
-- 创建时间: 2026-02-02

ALTER TABLE what_reverse_api_keys
    DROP FOREIGN KEY fk_api_keys_workspace,
    DROP INDEX idx_api_keys_workspace,
    DROP COLUMN workspace_id;

ALTER TABLE what_reverse_executions
    DROP FOREIGN KEY fk_executions_workspace,
    DROP INDEX idx_executions_workspace,
    DROP COLUMN workspace_id;

ALTER TABLE what_reverse_workflows
    DROP FOREIGN KEY fk_workflows_workspace,
    DROP INDEX idx_workflows_workspace,
    DROP COLUMN workspace_id;
