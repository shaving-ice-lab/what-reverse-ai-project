-- 添加用户活动日志、会话管理和公告表 (MySQL 版本)
-- 版本: 000006
-- 创建时间: 2026-01-29

-- 用户活动日志表
CREATE TABLE what_reverse_user_activities (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id         CHAR(36) NOT NULL,
    action          VARCHAR(100) NOT NULL,  -- 操作类型: login, logout, create_workflow, run_workflow, update_profile, etc.
    entity_type     VARCHAR(50),            -- 相关实体类型: workflow, agent, template, etc.
    entity_id       CHAR(36),               -- 相关实体ID
    device          VARCHAR(200),           -- 设备信息: Chrome / Windows
    ip              VARCHAR(45),            -- IP地址 (支持IPv6)
    location        VARCHAR(200),           -- 地理位置
    user_agent      TEXT,                   -- User Agent
    metadata        JSON,                   -- 额外元数据
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES what_reverse_users(id) ON DELETE CASCADE,
    INDEX idx_user_activities_user (user_id),
    INDEX idx_user_activities_action (action),
    INDEX idx_user_activities_created (created_at DESC),
    INDEX idx_user_activities_entity (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 用户会话表 (登录设备管理)
CREATE TABLE what_reverse_user_sessions (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id         CHAR(36) NOT NULL,
    token_hash      VARCHAR(64) NOT NULL,   -- Token 哈希 (用于验证)
    device_type     VARCHAR(20) NOT NULL DEFAULT 'desktop',  -- desktop, mobile, tablet
    device_name     VARCHAR(100),           -- 设备名称: Windows PC, iPhone 15 Pro
    browser         VARCHAR(100),           -- 浏览器: Chrome 120, Safari 17
    os              VARCHAR(100),           -- 操作系统: Windows 11, macOS 14
    ip              VARCHAR(45),            -- IP地址
    location        VARCHAR(200),           -- 地理位置
    user_agent      TEXT,                   -- User Agent
    is_active       BOOLEAN DEFAULT TRUE,   -- 是否活跃
    last_active_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at      DATETIME NOT NULL,      -- 过期时间
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES what_reverse_users(id) ON DELETE CASCADE,
    INDEX idx_user_sessions_user (user_id),
    INDEX idx_user_sessions_token (token_hash),
    INDEX idx_user_sessions_active (is_active, user_id),
    INDEX idx_user_sessions_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 系统公告表
CREATE TABLE what_reverse_announcements (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    title           VARCHAR(200) NOT NULL,
    description     TEXT NOT NULL,
    type            VARCHAR(50) NOT NULL DEFAULT 'notice',  -- feature, improvement, notice, warning
    priority        INT DEFAULT 0,          -- 优先级，数字越大越优先
    is_active       BOOLEAN DEFAULT TRUE,   -- 是否生效
    starts_at       DATETIME DEFAULT CURRENT_TIMESTAMP,  -- 开始展示时间
    ends_at         DATETIME,               -- 结束展示时间 (可为空表示永久)
    target_users    JSON,                   -- 目标用户筛选条件 (可为空表示所有用户)
    metadata        JSON,                   -- 额外元数据 (链接、图片等)
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_announcements_active (is_active, starts_at, ends_at),
    INDEX idx_announcements_type (type),
    INDEX idx_announcements_priority (priority DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 公告已读记录表
CREATE TABLE what_reverse_announcement_reads (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    announcement_id CHAR(36) NOT NULL,
    user_id         CHAR(36) NOT NULL,
    read_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (announcement_id) REFERENCES what_reverse_announcements(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES what_reverse_users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_announcement_user (announcement_id, user_id),
    INDEX idx_announcement_reads_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
