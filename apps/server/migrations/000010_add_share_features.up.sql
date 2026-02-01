-- AgentFlow 分享功能数据库结构 (MySQL 版本)
-- 版本: 000010
-- 创建时间: 2026-01-29

-- =====================
-- 分享记录表 (what_reverse_shares)
-- =====================
CREATE TABLE what_reverse_shares (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id         CHAR(36) NOT NULL,
    
    -- 分享目标
    target_type     VARCHAR(50) NOT NULL,
    target_id       CHAR(36) NOT NULL,
    
    -- 分享码 (短链接使用)
    share_code      VARCHAR(20) UNIQUE NOT NULL,
    
    -- 分享设置
    is_public       BOOLEAN DEFAULT TRUE,
    password        VARCHAR(100),
    expires_at      DATETIME,
    
    -- 权限设置
    allow_copy      BOOLEAN DEFAULT FALSE,
    allow_comment   BOOLEAN DEFAULT TRUE,
    
    -- 统计
    view_count      INT DEFAULT 0,
    unique_views    INT DEFAULT 0,
    
    -- 元数据
    metadata        JSON DEFAULT (JSON_OBJECT()),
    
    -- 时间戳
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      DATETIME,
    
    INDEX idx_shares_user (user_id),
    INDEX idx_shares_target (target_type, target_id),
    INDEX idx_shares_code (share_code),
    INDEX idx_shares_expires (expires_at),
    INDEX idx_shares_deleted (deleted_at),
    
    FOREIGN KEY (user_id) REFERENCES what_reverse_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- 分享访问记录表 (what_reverse_share_views)
-- =====================
CREATE TABLE what_reverse_share_views (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    share_id        CHAR(36) NOT NULL,
    
    -- 访问者信息
    viewer_id       CHAR(36),
    ip_address      VARCHAR(45),
    user_agent      TEXT,
    referer         VARCHAR(500),
    
    -- 时间戳
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_share_views_share (share_id),
    INDEX idx_share_views_viewer (viewer_id),
    INDEX idx_share_views_created (created_at),
    
    FOREIGN KEY (share_id) REFERENCES what_reverse_shares(id) ON DELETE CASCADE,
    FOREIGN KEY (viewer_id) REFERENCES what_reverse_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- MySQL 触发器：更新分享访问数
-- =====================
DELIMITER //

CREATE TRIGGER trigger_share_view_insert
AFTER INSERT ON what_reverse_share_views
FOR EACH ROW
BEGIN
    UPDATE what_reverse_shares SET view_count = view_count + 1 WHERE id = NEW.share_id;
END//

DELIMITER ;
