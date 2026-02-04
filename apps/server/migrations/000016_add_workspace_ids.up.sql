-- 为现有表添加 workspace_id 并回填默认空间
-- 版本: 000016
-- 创建时间: 2026-02-02

-- 1) 添加列（允许为空，便于回填）
ALTER TABLE what_reverse_workflows
    ADD COLUMN workspace_id CHAR(36) NULL;

ALTER TABLE what_reverse_executions
    ADD COLUMN workspace_id CHAR(36) NULL;

ALTER TABLE what_reverse_api_keys
    ADD COLUMN workspace_id CHAR(36) NULL;

-- 2) 为缺失的用户创建默认 Workspace
INSERT INTO what_reverse_workspaces (
    id, owner_user_id, name, slug, status, plan, settings_json, created_at, updated_at
)
SELECT
    UUID(), u.id, 'Default Workspace', LOWER(u.username), 'active', COALESCE(u.plan, 'free'), JSON_OBJECT(), NOW(), NOW()
FROM what_reverse_users u
LEFT JOIN what_reverse_workspaces w ON w.owner_user_id = u.id
WHERE w.id IS NULL;

-- 3) 回填 workspace_id
UPDATE what_reverse_workflows wf
JOIN what_reverse_workspaces ws ON ws.owner_user_id = wf.user_id
SET wf.workspace_id = ws.id
WHERE wf.workspace_id IS NULL;

UPDATE what_reverse_executions ex
JOIN what_reverse_workflows wf ON wf.id = ex.workflow_id
SET ex.workspace_id = wf.workspace_id
WHERE ex.workspace_id IS NULL;

UPDATE what_reverse_api_keys ak
JOIN what_reverse_workspaces ws ON ws.owner_user_id = ak.user_id
SET ak.workspace_id = ws.id
WHERE ak.workspace_id IS NULL;

-- 4) 设为 NOT NULL
ALTER TABLE what_reverse_workflows
    MODIFY workspace_id CHAR(36) NOT NULL;

ALTER TABLE what_reverse_executions
    MODIFY workspace_id CHAR(36) NOT NULL;

ALTER TABLE what_reverse_api_keys
    MODIFY workspace_id CHAR(36) NOT NULL;

-- 5) 添加索引与外键
ALTER TABLE what_reverse_workflows
    ADD INDEX idx_workflows_workspace (workspace_id),
    ADD CONSTRAINT fk_workflows_workspace FOREIGN KEY (workspace_id) REFERENCES what_reverse_workspaces(id) ON DELETE CASCADE;

ALTER TABLE what_reverse_executions
    ADD INDEX idx_executions_workspace (workspace_id),
    ADD CONSTRAINT fk_executions_workspace FOREIGN KEY (workspace_id) REFERENCES what_reverse_workspaces(id) ON DELETE CASCADE;

ALTER TABLE what_reverse_api_keys
    ADD INDEX idx_api_keys_workspace (workspace_id),
    ADD CONSTRAINT fk_api_keys_workspace FOREIGN KEY (workspace_id) REFERENCES what_reverse_workspaces(id) ON DELETE CASCADE;
