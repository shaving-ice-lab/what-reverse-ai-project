-- =====================
-- Agent 使用记录表 (what_reverse_agent_usages)
-- =====================
-- 记录用户使用 Agent 的详细信息，用于统计分析

CREATE TABLE what_reverse_agent_usages (
    id              CHAR(36) PRIMARY KEY,
    agent_id        CHAR(36) NOT NULL,
    user_id         CHAR(36),
    
    -- 会话信息
    session_id      VARCHAR(100),
    
    -- 使用详情
    duration_ms     INT,
    input_tokens    INT DEFAULT 0,
    output_tokens   INT DEFAULT 0,
    total_tokens    INT DEFAULT 0,
    
    -- 执行状态
    status          VARCHAR(20) DEFAULT 'completed',
    error_message   TEXT,
    
    -- 来源信息
    source          VARCHAR(50) DEFAULT 'web',
    referrer        VARCHAR(500),
    
    -- 设备信息
    user_agent      VARCHAR(500),
    ip_address      VARCHAR(50),
    country         VARCHAR(50),
    city            VARCHAR(100),
    
    -- 付费信息
    is_paid         BOOLEAN DEFAULT FALSE,
    amount          DECIMAL(10, 2),
    currency        VARCHAR(10) DEFAULT 'CNY',
    
    -- 时间戳
    started_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at    TIMESTAMP NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (agent_id) REFERENCES what_reverse_agents(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES what_reverse_users(id) ON DELETE SET NULL
);

-- 索引优化查询性能
CREATE INDEX idx_agent_usages_agent ON what_reverse_agent_usages(agent_id);
CREATE INDEX idx_agent_usages_user ON what_reverse_agent_usages(user_id);
CREATE INDEX idx_agent_usages_created ON what_reverse_agent_usages(created_at);
CREATE INDEX idx_agent_usages_status ON what_reverse_agent_usages(status);
CREATE INDEX idx_agent_usages_source ON what_reverse_agent_usages(source);
CREATE INDEX idx_agent_usages_agent_date ON what_reverse_agent_usages(agent_id, created_at);

-- =====================
-- 每日使用统计聚合表 (what_reverse_agent_usage_stats)
-- =====================

CREATE TABLE what_reverse_agent_usage_stats (
    id              CHAR(36) PRIMARY KEY,
    agent_id        CHAR(36) NOT NULL,
    stat_date       DATE NOT NULL,
    
    -- 使用统计
    use_count       INT DEFAULT 0,
    unique_users    INT DEFAULT 0,
    total_duration  BIGINT DEFAULT 0,
    avg_duration    INT DEFAULT 0,
    
    -- Token 统计
    total_input_tokens   INT DEFAULT 0,
    total_output_tokens  INT DEFAULT 0,
    total_tokens         INT DEFAULT 0,
    
    -- 状态统计
    completed_count INT DEFAULT 0,
    failed_count    INT DEFAULT 0,
    cancelled_count INT DEFAULT 0,
    
    -- 来源统计
    source_breakdown JSON,
    
    -- 收入统计
    total_revenue   DECIMAL(12, 2) DEFAULT 0,
    paid_use_count  INT DEFAULT 0,
    
    -- 时间戳
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_agent_stat_date (agent_id, stat_date),
    FOREIGN KEY (agent_id) REFERENCES what_reverse_agents(id) ON DELETE CASCADE
);

CREATE INDEX idx_agent_usage_stats_agent ON what_reverse_agent_usage_stats(agent_id);
CREATE INDEX idx_agent_usage_stats_date ON what_reverse_agent_usage_stats(stat_date);
CREATE INDEX idx_agent_usage_stats_agent_date ON what_reverse_agent_usage_stats(agent_id, stat_date);

-- =====================
-- 更新 Agent 使用计数的触发器
-- =====================
DELIMITER //

CREATE TRIGGER trigger_update_agent_use_count
AFTER INSERT ON what_reverse_agent_usages
FOR EACH ROW
BEGIN
    UPDATE what_reverse_agents 
    SET use_count = use_count + 1 
    WHERE id = NEW.agent_id;
END//

DELIMITER ;
