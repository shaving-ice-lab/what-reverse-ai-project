-- 029_runtime_events.sql
-- 运行时事件表：用于可观测性和事件回放

CREATE TABLE IF NOT EXISTS runtime_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 事件基本信息
    type VARCHAR(64) NOT NULL,
    severity VARCHAR(16) NOT NULL DEFAULT 'info',
    message TEXT,
    
    -- 追踪上下文
    trace_id VARCHAR(64),
    span_id VARCHAR(32),
    parent_span_id VARCHAR(32),
    
    -- 业务上下文
    workspace_id UUID,
    execution_id UUID,
    user_id UUID,
    session_id UUID,
    
    -- 事件详情
    node_id VARCHAR(64),
    node_type VARCHAR(64),
    
    -- 性能指标
    duration_ms BIGINT,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    
    -- 请求信息
    request_id VARCHAR(64),
    remote_ip VARCHAR(64),
    user_agent VARCHAR(512),
    http_method VARCHAR(16),
    http_path VARCHAR(512),
    http_status INT,
    
    -- 错误信息
    error_code VARCHAR(64),
    error_message TEXT,
    stack_trace TEXT,
    
    -- 额外数据
    metadata JSONB DEFAULT '{}',
    
    -- 回放支持
    sequence_num BIGINT NOT NULL
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_runtime_events_type ON runtime_events(type);
CREATE INDEX IF NOT EXISTS idx_runtime_events_trace_id ON runtime_events(trace_id);
CREATE INDEX IF NOT EXISTS idx_runtime_events_workspace_id ON runtime_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_runtime_events_execution_id ON runtime_events(execution_id);
CREATE INDEX IF NOT EXISTS idx_runtime_events_user_id ON runtime_events(user_id);
CREATE INDEX IF NOT EXISTS idx_runtime_events_session_id ON runtime_events(session_id);
CREATE INDEX IF NOT EXISTS idx_runtime_events_sequence_num ON runtime_events(sequence_num);
CREATE INDEX IF NOT EXISTS idx_runtime_events_created_at ON runtime_events(created_at);

-- 复合索引（用于常见查询）
CREATE INDEX IF NOT EXISTS idx_runtime_events_workspace_type ON runtime_events(workspace_id, type);
CREATE INDEX IF NOT EXISTS idx_runtime_events_execution_seq ON runtime_events(execution_id, sequence_num);

-- 注释
COMMENT ON TABLE runtime_events IS '运行时事件表，用于可观测性、审计和事件回放';
COMMENT ON COLUMN runtime_events.type IS '事件类型，如 execution.started, node.completed 等';
COMMENT ON COLUMN runtime_events.severity IS '严重级别：debug, info, warning, error, critical';
COMMENT ON COLUMN runtime_events.trace_id IS 'W3C Trace Context 格式的追踪 ID';
COMMENT ON COLUMN runtime_events.sequence_num IS '全局递增序列号，用于事件回放';
