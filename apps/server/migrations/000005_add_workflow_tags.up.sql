-- 创建标签表 (MySQL 版本)
-- 版本: 000005
-- 创建时间: 2026-01-29

CREATE TABLE what_reverse_tags (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id         CHAR(36) NOT NULL,
    name            VARCHAR(50) NOT NULL,
    color           VARCHAR(20) DEFAULT '#3ECF8E',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES what_reverse_users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_tag (user_id, name),
    INDEX idx_tags_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建工作流标签关联表
CREATE TABLE what_reverse_workflow_tags (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    workflow_id     CHAR(36) NOT NULL,
    tag_id          CHAR(36) NOT NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (workflow_id) REFERENCES what_reverse_workflows(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES what_reverse_tags(id) ON DELETE CASCADE,
    UNIQUE KEY uk_workflow_tag (workflow_id, tag_id),
    INDEX idx_workflow_tags_workflow (workflow_id),
    INDEX idx_workflow_tags_tag (tag_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
