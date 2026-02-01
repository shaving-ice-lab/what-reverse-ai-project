-- 删除索引
DROP INDEX idx_agent_reports_created ON what_reverse_agent_reports;
DROP INDEX idx_agent_reports_reason ON what_reverse_agent_reports;
DROP INDEX idx_agent_reports_status ON what_reverse_agent_reports;
DROP INDEX idx_agent_reports_user ON what_reverse_agent_reports;
DROP INDEX idx_agent_reports_agent ON what_reverse_agent_reports;

-- 删除表
DROP TABLE IF EXISTS what_reverse_agent_reports;
