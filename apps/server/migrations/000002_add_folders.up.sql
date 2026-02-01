-- 创建文件夹表 (MySQL 版本)
-- 版本: 000002
-- 创建时间: 2026-01-29

CREATE TABLE what_reverse_folders (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id         CHAR(36) NOT NULL,
    name            VARCHAR(100) NOT NULL,
    icon            VARCHAR(50) DEFAULT '📁',
    color           VARCHAR(20) DEFAULT '#3ECF8E',
    parent_id       CHAR(36) NULL,
    sort_order      INT DEFAULT 0,
    is_system       BOOLEAN DEFAULT FALSE,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      DATETIME NULL,
    
    FOREIGN KEY (user_id) REFERENCES what_reverse_users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES what_reverse_folders(id) ON DELETE SET NULL,
    INDEX idx_folders_user (user_id),
    INDEX idx_folders_parent (parent_id),
    INDEX idx_folders_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 为工作流表添加文件夹外键约束
ALTER TABLE what_reverse_workflows
ADD CONSTRAINT fk_workflows_folder
FOREIGN KEY (folder_id) REFERENCES what_reverse_folders(id) ON DELETE SET NULL;
