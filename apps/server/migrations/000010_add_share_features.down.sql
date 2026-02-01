-- AgentFlow 分享功能回滚 (MySQL 版本)
-- 版本: 000010

-- 删除触发器
DROP TRIGGER IF EXISTS trigger_share_view_insert;

-- 删除表 (按依赖顺序)
DROP TABLE IF EXISTS what_reverse_share_views;
DROP TABLE IF EXISTS what_reverse_shares;
