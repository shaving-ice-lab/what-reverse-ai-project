-- 创建工作流版本表 (MySQL 版本)
-- 版本: 000003
-- 创建时间: 2026-01-29

CREATE TABLE what_reverse_workflow_versions (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    workflow_id     CHAR(36) NOT NULL,
    version         INT NOT NULL,
    
    -- 快照数据
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    definition      JSON NOT NULL,
    variables       JSON,
    
    -- 版本信息
    change_log      TEXT,
    change_type     VARCHAR(50) DEFAULT 'update',
    
    -- 创建信息
    created_by      CHAR(36) NOT NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- 统计信息
    node_count      INT DEFAULT 0,
    edge_count      INT DEFAULT 0,
    
    FOREIGN KEY (workflow_id) REFERENCES what_reverse_workflows(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES what_reverse_users(id),
    UNIQUE KEY uk_workflow_version (workflow_id, version),
    INDEX idx_versions_workflow (workflow_id),
    INDEX idx_versions_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
