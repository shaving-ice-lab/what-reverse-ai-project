-- 添加 Workspace 图标字段
-- 版本: 000020
-- 创建时间: 2026-02-02

ALTER TABLE what_reverse_workspaces
    ADD COLUMN icon VARCHAR(50) DEFAULT '🏢' AFTER slug;
