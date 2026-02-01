-- AgentFlow 社交功能回滚 (MySQL 版本)
-- 版本: 000009

-- 删除触发器
DROP TRIGGER IF EXISTS trigger_comment_like_delete;
DROP TRIGGER IF EXISTS trigger_comment_like_insert;
DROP TRIGGER IF EXISTS trigger_follow_delete;
DROP TRIGGER IF EXISTS trigger_follow_insert;

-- 删除表 (按依赖顺序)
DROP TABLE IF EXISTS what_reverse_notifications;
DROP TABLE IF EXISTS what_reverse_comment_likes;
DROP TABLE IF EXISTS what_reverse_comments;
DROP TABLE IF EXISTS what_reverse_user_follows;

-- 删除用户表新增字段
ALTER TABLE what_reverse_users DROP COLUMN IF EXISTS follower_count;
ALTER TABLE what_reverse_users DROP COLUMN IF EXISTS following_count;
