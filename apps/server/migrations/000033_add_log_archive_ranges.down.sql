-- 移除日志归档时间范围字段
-- 版本: 000033
-- 创建时间: 2026-02-02

ALTER TABLE what_reverse_workspace_export_jobs
    DROP INDEX idx_workspace_export_jobs_archive_range,
    DROP COLUMN archive_range_start,
    DROP COLUMN archive_range_end;
