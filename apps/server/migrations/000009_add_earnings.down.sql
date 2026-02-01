-- 创作者经济 - 收入系统回滚 (MySQL 版本)
-- 版本: 000009

-- 删除表 (按依赖顺序)
DROP TABLE IF EXISTS what_reverse_settlements;
DROP TABLE IF EXISTS what_reverse_withdrawals;
DROP TABLE IF EXISTS what_reverse_earnings;
DROP TABLE IF EXISTS what_reverse_creator_accounts;
DROP TABLE IF EXISTS what_reverse_commission_tiers;
