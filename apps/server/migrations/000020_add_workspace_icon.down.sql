-- 回滚 Workspace 图标字段
-- 版本: 000020
-- 创建时间: 2026-02-02

ALTER TABLE what_reverse_workspaces
    DROP COLUMN icon;
