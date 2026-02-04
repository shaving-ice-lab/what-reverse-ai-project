-- =====================
-- Secrets 表 (what_reverse_secrets)
-- =====================
CREATE TABLE what_reverse_secrets (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    owner_type      VARCHAR(20) NOT NULL,
    owner_id        CHAR(36) NOT NULL,
    secret_type     VARCHAR(50) NOT NULL,
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    value_encrypted TEXT NOT NULL,
    value_preview   VARCHAR(20),
    status          VARCHAR(20) DEFAULT 'active',
    expires_at      DATETIME,
    last_used_at    DATETIME,
    last_rotated_at DATETIME,
    revoked_at      DATETIME,
    revoked_by      CHAR(36),
    revoked_reason  VARCHAR(255),
    metadata        JSON DEFAULT (JSON_OBJECT()),
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_what_reverse_secrets_owner (owner_type, owner_id),
    INDEX idx_what_reverse_secrets_type (secret_type),
    INDEX idx_what_reverse_secrets_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- Config Center 表 (what_reverse_config_items)
-- =====================
CREATE TABLE what_reverse_config_items (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    scope_type      VARCHAR(20) NOT NULL,
    scope_id        CHAR(36),
    config_key      VARCHAR(200) NOT NULL,
    value_encrypted TEXT NOT NULL,
    value_preview   VARCHAR(20),
    value_type      VARCHAR(30) DEFAULT 'string',
    is_secret       BOOLEAN DEFAULT FALSE,
    is_active       BOOLEAN DEFAULT TRUE,
    description     TEXT,
    updated_by      CHAR(36),
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_what_reverse_config_scope (scope_type, scope_id),
    INDEX idx_what_reverse_config_key (config_key),
    INDEX idx_what_reverse_config_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
