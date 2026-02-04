-- 回滚 App 访问策略数据分级
-- 版本: 000024
-- 创建时间: 2026-02-02

ALTER TABLE what_reverse_app_access_policies
    DROP INDEX idx_app_policy_classification,
    DROP COLUMN data_classification;
