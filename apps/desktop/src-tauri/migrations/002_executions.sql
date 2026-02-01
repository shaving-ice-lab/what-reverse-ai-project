-- 执行记录表

CREATE TABLE IF NOT EXISTS executions (
    id TEXT PRIMARY KEY NOT NULL,
    workflow_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    inputs TEXT NOT NULL DEFAULT '{}',
    outputs TEXT,
    error TEXT,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    duration_ms INTEGER,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_executions_workflow_id ON executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_executions_status ON executions(status);
CREATE INDEX IF NOT EXISTS idx_executions_started_at ON executions(started_at DESC);

-- 节点执行结果表
CREATE TABLE IF NOT EXISTS node_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    execution_id TEXT NOT NULL,
    node_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    inputs TEXT NOT NULL DEFAULT '{}',
    outputs TEXT,
    error TEXT,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    duration_ms INTEGER,
    FOREIGN KEY (execution_id) REFERENCES executions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_node_results_execution_id ON node_results(execution_id);
CREATE INDEX IF NOT EXISTS idx_node_results_node_id ON node_results(node_id);
