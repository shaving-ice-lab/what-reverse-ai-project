-- 时间旅行调试 - 执行快照表
-- 用于存储工作流执行的完整状态快照

CREATE TABLE IF NOT EXISTS execution_snapshots (
    -- 主键
    execution_id TEXT PRIMARY KEY,
    
    -- 工作流信息
    workflow_id TEXT NOT NULL,
    workflow_name TEXT,
    
    -- 执行状态
    status TEXT NOT NULL,
    
    -- 时间信息
    started_at TEXT NOT NULL,
    completed_at TEXT,
    duration_ms INTEGER,
    
    -- 快照数据 (JSON 格式，可压缩)
    data BLOB NOT NULL,
    
    -- 压缩信息
    compressed INTEGER NOT NULL DEFAULT 1,
    original_size INTEGER NOT NULL,
    compressed_size INTEGER,
    
    -- 元数据
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- 外键约束
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);

-- 索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_snapshots_workflow_id ON execution_snapshots(workflow_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_started_at ON execution_snapshots(started_at);
CREATE INDEX IF NOT EXISTS idx_snapshots_status ON execution_snapshots(status);
CREATE INDEX IF NOT EXISTS idx_snapshots_workflow_status ON execution_snapshots(workflow_id, status);
