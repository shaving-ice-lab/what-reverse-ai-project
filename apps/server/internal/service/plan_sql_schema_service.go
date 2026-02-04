package service

import (
	"context"
	"errors"
)

// SQLTableDraft SQL 建表草案
type SQLTableDraft struct {
	Key    string   `json:"key"`
	Title  string   `json:"title"`
	Tables []string `json:"tables"`
	SQL    string   `json:"sql"`
	Notes  []string `json:"notes,omitempty"`
}

// SQLSchemaDraft SQL 全量建表草案
type SQLSchemaDraft struct {
	Key    string          `json:"key"`
	Title  string          `json:"title"`
	Drafts []SQLTableDraft `json:"drafts"`
	Notes  []string        `json:"notes,omitempty"`
}

// PlanSQLSchemaService SQL 草案规划服务接口
type PlanSQLSchemaService interface {
	GetSQLDraft(ctx context.Context) (*SQLSchemaDraft, error)
}

type planSQLSchemaService struct {
	draft SQLSchemaDraft
}

// ErrSQLSchemaDraftNotFound SQL 草案不存在
var ErrSQLSchemaDraftNotFound = errors.New("sql schema draft not found")

// NewPlanSQLSchemaService 创建 SQL 草案规划服务
func NewPlanSQLSchemaService() PlanSQLSchemaService {
	return &planSQLSchemaService{draft: defaultSQLSchemaDraft()}
}

func (s *planSQLSchemaService) GetSQLDraft(ctx context.Context) (*SQLSchemaDraft, error) {
	if s == nil || s.draft.Key == "" {
		return nil, ErrSQLSchemaDraftNotFound
	}
	draft := s.draft
	return &draft, nil
}

func defaultSQLSchemaDraft() SQLSchemaDraft {
	return SQLSchemaDraft{
		Key:   "sql_schema_draft",
		Title: "SQL 全量建表草案（骨架级）",
		Drafts: []SQLTableDraft{
			{
				Key:    "workspaces",
				Title:  "workspaces 全量字段 SQL",
				Tables: []string{"what_reverse_workspaces"},
				SQL: `CREATE TABLE what_reverse_workspaces (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    owner_user_id   CHAR(36) NOT NULL,
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(100) NOT NULL,
    icon            VARCHAR(50) DEFAULT '🏢',
    status          VARCHAR(20) DEFAULT 'active',
    plan            VARCHAR(20) DEFAULT 'free',
    region          VARCHAR(50),
    default_app_id  CHAR(36),
    settings_json   JSON DEFAULT (JSON_OBJECT()),
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      DATETIME,
    UNIQUE KEY uniq_workspaces_slug (slug),
    INDEX idx_workspaces_owner (owner_user_id),
    INDEX idx_workspaces_status (status),
    INDEX idx_workspaces_deleted_at (deleted_at),
    FOREIGN KEY (owner_user_id) REFERENCES what_reverse_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
				Notes: []string{
					"icon 默认值与迁移保持一致。",
				},
			},
			{
				Key:    "workspace_members_roles",
				Title:  "workspace_members、workspace_roles SQL",
				Tables: []string{"what_reverse_workspace_roles", "what_reverse_workspace_members"},
				SQL: `CREATE TABLE what_reverse_workspace_roles (
    id               CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    workspace_id     CHAR(36) NOT NULL,
    name             VARCHAR(50) NOT NULL,
    permissions_json JSON DEFAULT (JSON_OBJECT()),
    is_system        BOOLEAN DEFAULT FALSE,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace_roles_workspace (workspace_id),
    INDEX idx_workspace_roles_name (name),
    FOREIGN KEY (workspace_id) REFERENCES what_reverse_workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE what_reverse_workspace_members (
    id            CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    workspace_id  CHAR(36) NOT NULL,
    user_id       CHAR(36) NOT NULL,
    role_id       CHAR(36),
    status        VARCHAR(20) DEFAULT 'active',
    invited_by    CHAR(36),
    joined_at     DATETIME,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_workspace_member (workspace_id, user_id),
    INDEX idx_workspace_members_workspace (workspace_id),
    INDEX idx_workspace_members_user (user_id),
    INDEX idx_workspace_members_role (role_id),
    FOREIGN KEY (workspace_id) REFERENCES what_reverse_workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES what_reverse_users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES what_reverse_workspace_roles(id) ON DELETE SET NULL,
    FOREIGN KEY (invited_by) REFERENCES what_reverse_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
			},
			{
				Key:    "apps_versions",
				Title:  "apps、app_versions SQL",
				Tables: []string{"what_reverse_apps", "what_reverse_app_versions"},
				SQL: `CREATE TABLE what_reverse_apps (
    id                 CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    workspace_id       CHAR(36) NOT NULL,
    owner_user_id      CHAR(36) NOT NULL,
    name               VARCHAR(200) NOT NULL,
    slug               VARCHAR(100) NOT NULL,
    icon               VARCHAR(50) DEFAULT '📦',
    description        TEXT,
    status             VARCHAR(20) DEFAULT 'draft',
    current_version_id CHAR(36),
    pricing_type       VARCHAR(20) DEFAULT 'free',
    price              DECIMAL(10, 2),
    created_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    published_at       DATETIME,
    deleted_at         DATETIME,
    UNIQUE KEY uniq_apps_workspace_slug (workspace_id, slug),
    INDEX idx_apps_workspace (workspace_id),
    INDEX idx_apps_owner (owner_user_id),
    INDEX idx_apps_status (status),
    INDEX idx_apps_deleted_at (deleted_at),
    FOREIGN KEY (workspace_id) REFERENCES what_reverse_workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_user_id) REFERENCES what_reverse_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE what_reverse_app_versions (
    id           CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    app_id       CHAR(36) NOT NULL,
    version      VARCHAR(50) NOT NULL,
    changelog    TEXT,
    workflow_id  CHAR(36),
    ui_schema    JSON,
    db_schema    JSON,
    config_json  JSON,
    created_by   CHAR(36),
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_app_version (app_id, version),
    INDEX idx_app_versions_app (app_id),
    INDEX idx_app_versions_created (created_at),
    FOREIGN KEY (app_id) REFERENCES what_reverse_apps(id) ON DELETE CASCADE,
    FOREIGN KEY (workflow_id) REFERENCES what_reverse_workflows(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES what_reverse_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
				Notes: []string{
					"App icon 默认值与迁移保持一致。",
				},
			},
			{
				Key:    "app_access_domains",
				Title:  "app_access_policies、app_domains SQL",
				Tables: []string{"what_reverse_app_access_policies", "what_reverse_app_domains"},
				SQL: `CREATE TABLE what_reverse_app_access_policies (
    id                  CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    app_id              CHAR(36) NOT NULL,
    access_mode         VARCHAR(30) DEFAULT 'private',
    data_classification VARCHAR(30) DEFAULT 'public',
    rate_limit_json     JSON,
    allowed_origins     JSON DEFAULT (JSON_ARRAY()),
    require_captcha     BOOLEAN DEFAULT FALSE,
    updated_by          CHAR(36),
    updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_app_policy (app_id),
    INDEX idx_app_policy_app (app_id),
    INDEX idx_app_policy_mode (access_mode),
    INDEX idx_app_policy_classification (data_classification),
    FOREIGN KEY (app_id) REFERENCES what_reverse_apps(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES what_reverse_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE what_reverse_app_domains (
    id                     CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    app_id                 CHAR(36) NOT NULL,
    domain                 VARCHAR(255) NOT NULL,
    status                 VARCHAR(20) DEFAULT 'pending',
    verification_token     VARCHAR(100),
    verification_attempts  INT DEFAULT 0,
    last_verification_error VARCHAR(255),
    next_retry_at          DATETIME,
    support_url            VARCHAR(255),
    verified_at            DATETIME,
    ssl_status             VARCHAR(20) DEFAULT 'pending',
    ssl_issue_attempts     INT DEFAULT 0,
    last_ssl_error         VARCHAR(255),
    ssl_next_retry_at      DATETIME,
    ssl_issued_at          DATETIME,
    ssl_expires_at         DATETIME,
    created_at             DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at             DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_app_domain (domain),
    INDEX idx_app_domains_app (app_id),
    INDEX idx_app_domains_status (status),
    FOREIGN KEY (app_id) REFERENCES what_reverse_apps(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
				Notes: []string{
					"包含域名验证/证书重试字段（迁移 000023/000025）。",
				},
			},
			{
				Key:    "workspace_databases",
				Title:  "workspace_databases SQL",
				Tables: []string{"what_reverse_workspace_databases"},
				SQL: `CREATE TABLE what_reverse_workspace_databases (
    id            CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    workspace_id  CHAR(36) NOT NULL,
    db_name       VARCHAR(100) NOT NULL,
    db_user       VARCHAR(100) NOT NULL,
    db_host       VARCHAR(255),
    db_port       INT,
    secret_ref    VARCHAR(200),
    status        VARCHAR(20) DEFAULT 'pending',
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_workspace_database (workspace_id),
    INDEX idx_workspace_databases_status (status),
    FOREIGN KEY (workspace_id) REFERENCES what_reverse_workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
			},
			{
				Key:    "app_sessions_events_audit",
				Title:  "app_sessions、app_events、audit_logs SQL",
				Tables: []string{"what_reverse_app_sessions", "what_reverse_app_events", "what_reverse_audit_logs"},
				SQL: `CREATE TABLE what_reverse_app_sessions (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    app_id          CHAR(36) NOT NULL,
    workspace_id    CHAR(36) NOT NULL,
    session_type    VARCHAR(20) DEFAULT 'anon',
    user_id         CHAR(36),
    ip_hash         VARCHAR(100),
    user_agent_hash VARCHAR(200),
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    expired_at      DATETIME,
    INDEX idx_app_sessions_app (app_id),
    INDEX idx_app_sessions_workspace (workspace_id),
    INDEX idx_app_sessions_session_type (session_type),
    INDEX idx_app_sessions_created (created_at),
    INDEX idx_app_sessions_user (user_id),
    FOREIGN KEY (app_id) REFERENCES what_reverse_apps(id) ON DELETE CASCADE,
    FOREIGN KEY (workspace_id) REFERENCES what_reverse_workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES what_reverse_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE what_reverse_app_events (
    id           CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    app_id       CHAR(36) NOT NULL,
    session_id   CHAR(36) NOT NULL,
    event_type   VARCHAR(50) NOT NULL,
    payload_json JSON,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_app_events_app (app_id),
    INDEX idx_app_events_session (session_id),
    INDEX idx_app_events_type (event_type),
    INDEX idx_app_events_created (created_at),
    FOREIGN KEY (app_id) REFERENCES what_reverse_apps(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES what_reverse_app_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE what_reverse_audit_logs (
    id             CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    workspace_id   CHAR(36) NOT NULL,
    actor_user_id  CHAR(36),
    action         VARCHAR(100) NOT NULL,
    target_type    VARCHAR(50) NOT NULL,
    target_id      CHAR(36),
    metadata_json  JSON DEFAULT (JSON_OBJECT()),
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_logs_workspace (workspace_id),
    INDEX idx_audit_logs_actor (actor_user_id),
    INDEX idx_audit_logs_action (action),
    INDEX idx_audit_logs_target (target_type, target_id),
    FOREIGN KEY (workspace_id) REFERENCES what_reverse_workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (actor_user_id) REFERENCES what_reverse_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
			},
		},
		Notes: []string{
			"草案来源于现有迁移文件，适用于骨架级建表。",
		},
	}
}
