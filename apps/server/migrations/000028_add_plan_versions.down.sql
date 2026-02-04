-- 回滚规划版本与任务编码
-- 版本: 000028
-- 创建时间: 2026-02-02

DROP TABLE IF EXISTS what_reverse_plan_versions;

ALTER TABLE what_reverse_plan_tasks
    DROP INDEX idx_plan_tasks_code,
    DROP COLUMN code;
