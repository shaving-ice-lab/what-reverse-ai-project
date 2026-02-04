-- 为日志归档增加时间范围字段
-- 版本: 000033
-- 创建时间: 2026-02-02

ALTER TABLE what_reverse_workspace_export_jobs
    ADD COLUMN archive_range_start DATETIME NULL,
    ADD COLUMN archive_range_end DATETIME NULL,
    ADD INDEX idx_workspace_export_jobs_archive_range (archive_range_start, archive_range_end);
