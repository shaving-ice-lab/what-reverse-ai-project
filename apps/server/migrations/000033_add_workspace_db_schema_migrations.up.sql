-- 工作空间 DB Schema 迁移审批与流水线
-- 版本: 000033
-- 创建时间: 2026-02-02

CREATE TABLE what_reverse_workspace_db_schema_migrations (
    id              CHAR(36) PRIMARY KEY,
    workspace_id    CHAR(36) NOT NULL,
    submitter_id    CHAR(36) NOT NULL,
    review_queue_id CHAR(36) DEFAULT NULL,
    status          VARCHAR(30) NOT NULL DEFAULT 'pending_review',

    from_version     VARCHAR(100),
    target_version   VARCHAR(100),
    pending_versions JSON,
    plan             JSON,
    precheck         JSON,
    result           JSON,

    verify_sql    TEXT,
    backup_id     VARCHAR(255),
    review_note   TEXT,
    error_message TEXT,

    approved_by  CHAR(36) DEFAULT NULL,
    approved_at  TIMESTAMP NULL,
    started_at   TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,

    KEY idx_workspace_db_schema_migrations_workspace (workspace_id),
    KEY idx_workspace_db_schema_migrations_status (status),
    KEY idx_workspace_db_schema_migrations_submitter (submitter_id),
    KEY idx_workspace_db_schema_migrations_review_queue (review_queue_id),
    KEY idx_workspace_db_schema_migrations_approved_by (approved_by),

    CONSTRAINT fk_workspace_db_schema_migrations_workspace FOREIGN KEY (workspace_id)
        REFERENCES what_reverse_workspaces(id),
    CONSTRAINT fk_workspace_db_schema_migrations_submitter FOREIGN KEY (submitter_id)
        REFERENCES what_reverse_users(id),
    CONSTRAINT fk_workspace_db_schema_migrations_review_queue FOREIGN KEY (review_queue_id)
        REFERENCES what_reverse_review_queue(id),
    CONSTRAINT fk_workspace_db_schema_migrations_approved_by FOREIGN KEY (approved_by)
        REFERENCES what_reverse_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
