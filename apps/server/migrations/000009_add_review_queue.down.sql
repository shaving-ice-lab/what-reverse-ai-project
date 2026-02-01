-- 回滚审核系统数据库结构 (MySQL 版本)
-- 版本: 000009

-- 删除表 (按照外键依赖顺序)
DROP TABLE IF EXISTS what_reverse_review_checklists;
DROP TABLE IF EXISTS what_reverse_review_comments;
DROP TABLE IF EXISTS what_reverse_review_records;
DROP TABLE IF EXISTS what_reverse_review_queue;
DROP TABLE IF EXISTS what_reverse_reviewers;
