-- 回滚 AI 创意助手任务管理表 (MySQL 版本)
-- 版本: 000008

-- 删除表 (按依赖顺序)
DROP TABLE IF EXISTS what_reverse_creative_section_versions;
DROP TABLE IF EXISTS what_reverse_creative_documents;
DROP TABLE IF EXISTS what_reverse_creative_tasks;
