-- 删除触发器
DROP TRIGGER IF EXISTS trigger_update_agent_use_count;

-- 删除索引
DROP INDEX idx_agent_usage_stats_agent_date ON what_reverse_agent_usage_stats;
DROP INDEX idx_agent_usage_stats_date ON what_reverse_agent_usage_stats;
DROP INDEX idx_agent_usage_stats_agent ON what_reverse_agent_usage_stats;
DROP INDEX idx_agent_usages_agent_date ON what_reverse_agent_usages;
DROP INDEX idx_agent_usages_source ON what_reverse_agent_usages;
DROP INDEX idx_agent_usages_status ON what_reverse_agent_usages;
DROP INDEX idx_agent_usages_created ON what_reverse_agent_usages;
DROP INDEX idx_agent_usages_user ON what_reverse_agent_usages;
DROP INDEX idx_agent_usages_agent ON what_reverse_agent_usages;

-- 删除表
DROP TABLE IF EXISTS what_reverse_agent_usage_stats;
DROP TABLE IF EXISTS what_reverse_agent_usages;
