-- =====================
-- Agent 举报表 (what_reverse_agent_reports)
-- =====================

CREATE TABLE what_reverse_agent_reports (
    id              CHAR(36) PRIMARY KEY,
    agent_id        CHAR(36) NOT NULL,
    user_id         CHAR(36) NOT NULL,
    
    -- 举报信息
    reason          VARCHAR(50) NOT NULL,
    description     TEXT,
    evidence        JSON,
    
    -- 处理状态
    status          VARCHAR(20) DEFAULT 'pending',
    resolution      TEXT,
    reviewed_by     CHAR(36),
    reviewed_at     TIMESTAMP NULL,
    
    -- 时间戳
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 外键
    FOREIGN KEY (agent_id) REFERENCES what_reverse_agents(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES what_reverse_users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES what_reverse_users(id),
    
    -- 唯一约束
    UNIQUE KEY uk_agent_user_report (agent_id, user_id)
);

-- 索引
CREATE INDEX idx_agent_reports_agent ON what_reverse_agent_reports(agent_id);
CREATE INDEX idx_agent_reports_user ON what_reverse_agent_reports(user_id);
CREATE INDEX idx_agent_reports_status ON what_reverse_agent_reports(status);
CREATE INDEX idx_agent_reports_reason ON what_reverse_agent_reports(reason);
CREATE INDEX idx_agent_reports_created ON what_reverse_agent_reports(created_at);
