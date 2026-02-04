-- 移除 App 会话复合索引
-- 版本: 000026
-- 创建时间: 2026-02-02

DROP INDEX idx_app_sessions_app_created ON what_reverse_app_sessions;
