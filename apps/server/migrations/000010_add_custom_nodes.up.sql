-- 自定义节点市场数据库结构 (MySQL 版本)
-- 版本: 000010
-- 创建时间: 2026-01-29
-- 功能: 自定义节点发布、版本管理、安装、评价

-- =====================
-- 自定义节点表 (what_reverse_custom_nodes)
-- =====================
CREATE TABLE what_reverse_custom_nodes (
    id              VARCHAR(36) PRIMARY KEY,
    
    -- 发布者信息
    author_id       VARCHAR(36) NOT NULL,
    
    -- 节点标识
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(100) UNIQUE NOT NULL,
    
    -- 基础信息
    display_name    VARCHAR(200) NOT NULL,
    description     TEXT NOT NULL,
    long_description LONGTEXT,
    
    -- 图标和媒体
    icon            VARCHAR(100) DEFAULT 'puzzle',
    icon_url        VARCHAR(500),
    cover_image     VARCHAR(500),
    screenshots     JSON,
    demo_video      VARCHAR(500),
    
    -- 分类和标签
    category        ENUM('trigger', 'action', 'logic', 'data', 'ai', 'integration', 'utility', 'custom') NOT NULL DEFAULT 'custom',
    tags            JSON,
    
    -- 状态
    status          ENUM('draft', 'pending', 'approved', 'rejected', 'published', 'deprecated', 'removed') DEFAULT 'draft',
    
    -- 定价
    pricing_type    ENUM('free', 'paid', 'freemium') DEFAULT 'free',
    price           DECIMAL(10, 2) DEFAULT 0,
    currency        VARCHAR(10) DEFAULT 'CNY',
    
    -- 仓库信息
    repository_url  VARCHAR(500),
    homepage_url    VARCHAR(500),
    documentation_url VARCHAR(500),
    
    -- 最新版本信息
    latest_version  VARCHAR(20),
    latest_version_id VARCHAR(36),
    
    -- 兼容性
    min_sdk_version VARCHAR(20) DEFAULT '0.1.0',
    max_sdk_version VARCHAR(20),
    
    -- 统计
    download_count  INT DEFAULT 0,
    install_count   INT DEFAULT 0,
    star_count      INT DEFAULT 0,
    review_count    INT DEFAULT 0,
    avg_rating      DECIMAL(3, 2) DEFAULT 0,
    
    -- 收入统计
    total_revenue   DECIMAL(12, 2) DEFAULT 0,
    
    -- 排序权重
    featured        BOOLEAN DEFAULT FALSE,
    sort_order      INT DEFAULT 0,
    
    -- 时间戳
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    published_at    TIMESTAMP NULL,
    deprecated_at   TIMESTAMP NULL,
    deleted_at      TIMESTAMP NULL,
    
    FOREIGN KEY (author_id) REFERENCES what_reverse_users(id) ON DELETE CASCADE,
    INDEX idx_custom_nodes_author (author_id),
    INDEX idx_custom_nodes_slug (slug),
    INDEX idx_custom_nodes_category (category),
    INDEX idx_custom_nodes_status (status),
    INDEX idx_custom_nodes_pricing (pricing_type),
    INDEX idx_custom_nodes_featured (featured, sort_order),
    INDEX idx_custom_nodes_downloads (download_count DESC),
    INDEX idx_custom_nodes_deleted (deleted_at),
    FULLTEXT INDEX idx_custom_nodes_search (name, display_name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- 节点版本表 (what_reverse_custom_node_versions)
-- =====================
CREATE TABLE what_reverse_custom_node_versions (
    id              VARCHAR(36) PRIMARY KEY,
    node_id         VARCHAR(36) NOT NULL,
    
    -- 版本信息
    version         VARCHAR(20) NOT NULL,
    version_code    INT NOT NULL,
    
    -- 变更说明
    changelog       TEXT,
    
    -- 包信息
    package_url     VARCHAR(500) NOT NULL,
    package_size    BIGINT DEFAULT 0,
    package_hash    VARCHAR(64),
    
    -- 节点定义
    definition      JSON NOT NULL,
    
    -- 输入输出定义
    inputs_schema   JSON NOT NULL,
    outputs_schema  JSON NOT NULL,
    
    -- 依赖
    dependencies    JSON,
    peer_dependencies JSON,
    
    -- SDK 兼容性
    min_sdk_version VARCHAR(20) DEFAULT '0.1.0',
    max_sdk_version VARCHAR(20),
    
    -- 状态
    is_latest       BOOLEAN DEFAULT FALSE,
    is_prerelease   BOOLEAN DEFAULT FALSE,
    is_deprecated   BOOLEAN DEFAULT FALSE,
    
    -- 统计
    download_count  INT DEFAULT 0,
    
    -- 安全审核
    security_scan_status VARCHAR(20) DEFAULT 'pending',
    security_scan_at TIMESTAMP NULL,
    security_issues JSON,
    
    -- 时间戳
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at    TIMESTAMP NULL,
    deprecated_at   TIMESTAMP NULL,
    
    FOREIGN KEY (node_id) REFERENCES what_reverse_custom_nodes(id) ON DELETE CASCADE,
    UNIQUE KEY uk_node_version (node_id, version),
    INDEX idx_node_versions_node (node_id),
    INDEX idx_node_versions_latest (node_id, is_latest),
    INDEX idx_node_versions_code (node_id, version_code DESC),
    INDEX idx_node_versions_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- 节点安装记录表 (what_reverse_custom_node_installs)
-- =====================
CREATE TABLE what_reverse_custom_node_installs (
    id              VARCHAR(36) PRIMARY KEY,
    node_id         VARCHAR(36) NOT NULL,
    version_id      VARCHAR(36) NOT NULL,
    user_id         VARCHAR(36) NOT NULL,
    
    -- 安装信息
    installed_version VARCHAR(20) NOT NULL,
    
    -- 状态
    is_active       BOOLEAN DEFAULT TRUE,
    
    -- 配置
    settings        JSON,
    
    -- 时间戳
    installed_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    uninstalled_at  TIMESTAMP NULL,
    
    FOREIGN KEY (node_id) REFERENCES what_reverse_custom_nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (version_id) REFERENCES what_reverse_custom_node_versions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES what_reverse_users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_node_user (node_id, user_id),
    INDEX idx_node_installs_node (node_id),
    INDEX idx_node_installs_user (user_id),
    INDEX idx_node_installs_active (user_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- 节点下载记录表 (what_reverse_custom_node_downloads)
-- =====================
CREATE TABLE what_reverse_custom_node_downloads (
    id              VARCHAR(36) PRIMARY KEY,
    node_id         VARCHAR(36) NOT NULL,
    version_id      VARCHAR(36) NOT NULL,
    user_id         VARCHAR(36),
    
    -- 下载信息
    ip_address      VARCHAR(45),
    user_agent      VARCHAR(500),
    
    -- 时间戳
    downloaded_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (node_id) REFERENCES what_reverse_custom_nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (version_id) REFERENCES what_reverse_custom_node_versions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES what_reverse_users(id) ON DELETE SET NULL,
    INDEX idx_node_downloads_node (node_id),
    INDEX idx_node_downloads_version (version_id),
    INDEX idx_node_downloads_user (user_id),
    INDEX idx_node_downloads_date (downloaded_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- 节点评价表 (what_reverse_custom_node_reviews)
-- =====================
CREATE TABLE what_reverse_custom_node_reviews (
    id              VARCHAR(36) PRIMARY KEY,
    node_id         VARCHAR(36) NOT NULL,
    user_id         VARCHAR(36) NOT NULL,
    
    -- 评分
    rating          TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    
    -- 评价内容
    title           VARCHAR(200),
    content         TEXT,
    
    -- 版本信息
    reviewed_version VARCHAR(20),
    
    -- 互动
    helpful_count   INT DEFAULT 0,
    
    -- 状态
    is_verified     BOOLEAN DEFAULT FALSE,
    is_featured     BOOLEAN DEFAULT FALSE,
    
    -- 作者回复
    author_reply    TEXT,
    author_reply_at TIMESTAMP NULL,
    
    -- 时间戳
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP NULL,
    
    FOREIGN KEY (node_id) REFERENCES what_reverse_custom_nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES what_reverse_users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_node_user_review (node_id, user_id),
    INDEX idx_node_reviews_node (node_id),
    INDEX idx_node_reviews_user (user_id),
    INDEX idx_node_reviews_rating (node_id, rating DESC),
    INDEX idx_node_reviews_helpful (node_id, helpful_count DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- 节点收藏表 (what_reverse_custom_node_stars)
-- =====================
CREATE TABLE what_reverse_custom_node_stars (
    id              VARCHAR(36) PRIMARY KEY,
    node_id         VARCHAR(36) NOT NULL,
    user_id         VARCHAR(36) NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (node_id) REFERENCES what_reverse_custom_nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES what_reverse_users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_node_user_star (node_id, user_id),
    INDEX idx_node_stars_node (node_id),
    INDEX idx_node_stars_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- 节点依赖关系表 (what_reverse_custom_node_dependencies)
-- =====================
CREATE TABLE what_reverse_custom_node_dependencies (
    id              VARCHAR(36) PRIMARY KEY,
    node_id         VARCHAR(36) NOT NULL,
    depends_on_id   VARCHAR(36) NOT NULL,
    
    -- 版本约束
    version_constraint VARCHAR(100),
    
    -- 依赖类型
    dependency_type VARCHAR(20) DEFAULT 'runtime',
    
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (node_id) REFERENCES what_reverse_custom_nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (depends_on_id) REFERENCES what_reverse_custom_nodes(id) ON DELETE CASCADE,
    UNIQUE KEY uk_node_dependency (node_id, depends_on_id),
    INDEX idx_node_deps_node (node_id),
    INDEX idx_node_deps_depends (depends_on_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- 触发器: 更新下载计数
-- =====================
DELIMITER //

CREATE TRIGGER trigger_update_node_download_count
AFTER INSERT ON what_reverse_custom_node_downloads
FOR EACH ROW
BEGIN
    UPDATE what_reverse_custom_nodes 
    SET download_count = download_count + 1
    WHERE id = NEW.node_id;
    
    UPDATE what_reverse_custom_node_versions
    SET download_count = download_count + 1
    WHERE id = NEW.version_id;
END//

-- 触发器: 更新安装计数 (INSERT)
CREATE TRIGGER trigger_update_node_install_count_insert
AFTER INSERT ON what_reverse_custom_node_installs
FOR EACH ROW
BEGIN
    UPDATE what_reverse_custom_nodes 
    SET install_count = install_count + 1
    WHERE id = NEW.node_id;
END//

-- 触发器: 更新安装计数 (UPDATE)
CREATE TRIGGER trigger_update_node_install_count_update
AFTER UPDATE ON what_reverse_custom_node_installs
FOR EACH ROW
BEGIN
    IF OLD.is_active = TRUE AND NEW.is_active = FALSE THEN
        UPDATE what_reverse_custom_nodes 
        SET install_count = GREATEST(0, install_count - 1)
        WHERE id = NEW.node_id;
    ELSEIF OLD.is_active = FALSE AND NEW.is_active = TRUE THEN
        UPDATE what_reverse_custom_nodes 
        SET install_count = install_count + 1
        WHERE id = NEW.node_id;
    END IF;
END//

-- 触发器: 更新收藏计数 (INSERT)
CREATE TRIGGER trigger_update_node_star_count_insert
AFTER INSERT ON what_reverse_custom_node_stars
FOR EACH ROW
BEGIN
    UPDATE what_reverse_custom_nodes 
    SET star_count = star_count + 1
    WHERE id = NEW.node_id;
END//

-- 触发器: 更新收藏计数 (DELETE)
CREATE TRIGGER trigger_update_node_star_count_delete
AFTER DELETE ON what_reverse_custom_node_stars
FOR EACH ROW
BEGIN
    UPDATE what_reverse_custom_nodes 
    SET star_count = GREATEST(0, star_count - 1)
    WHERE id = OLD.node_id;
END//

-- 触发器: 更新评价统计 (INSERT)
CREATE TRIGGER trigger_update_node_review_stats_insert
AFTER INSERT ON what_reverse_custom_node_reviews
FOR EACH ROW
BEGIN
    UPDATE what_reverse_custom_nodes 
    SET 
        review_count = (
            SELECT COUNT(*) FROM what_reverse_custom_node_reviews 
            WHERE node_id = NEW.node_id AND deleted_at IS NULL
        ),
        avg_rating = (
            SELECT COALESCE(AVG(rating), 0) FROM what_reverse_custom_node_reviews 
            WHERE node_id = NEW.node_id AND deleted_at IS NULL
        )
    WHERE id = NEW.node_id;
END//

-- 触发器: 更新评价统计 (UPDATE)
CREATE TRIGGER trigger_update_node_review_stats_update
AFTER UPDATE ON what_reverse_custom_node_reviews
FOR EACH ROW
BEGIN
    UPDATE what_reverse_custom_nodes 
    SET 
        review_count = (
            SELECT COUNT(*) FROM what_reverse_custom_node_reviews 
            WHERE node_id = NEW.node_id AND deleted_at IS NULL
        ),
        avg_rating = (
            SELECT COALESCE(AVG(rating), 0) FROM what_reverse_custom_node_reviews 
            WHERE node_id = NEW.node_id AND deleted_at IS NULL
        )
    WHERE id = NEW.node_id;
END//

-- 触发器: 更新评价统计 (DELETE)
CREATE TRIGGER trigger_update_node_review_stats_delete
AFTER DELETE ON what_reverse_custom_node_reviews
FOR EACH ROW
BEGIN
    UPDATE what_reverse_custom_nodes 
    SET 
        review_count = (
            SELECT COUNT(*) FROM what_reverse_custom_node_reviews 
            WHERE node_id = OLD.node_id AND deleted_at IS NULL
        ),
        avg_rating = (
            SELECT COALESCE(AVG(rating), 0) FROM what_reverse_custom_node_reviews 
            WHERE node_id = OLD.node_id AND deleted_at IS NULL
        )
    WHERE id = OLD.node_id;
END//

DELIMITER ;

-- =====================
-- 视图: 热门节点
-- =====================
CREATE OR REPLACE VIEW what_reverse_popular_nodes AS
SELECT 
    cn.*,
    u.username AS author_username,
    u.display_name AS author_display_name,
    u.avatar_url AS author_avatar
FROM what_reverse_custom_nodes cn
JOIN what_reverse_users u ON cn.author_id = u.id
WHERE cn.status = 'published' 
  AND cn.deleted_at IS NULL
ORDER BY 
    (cn.download_count * 0.3 + cn.star_count * 0.4 + cn.avg_rating * cn.review_count * 0.3) DESC;

-- =====================
-- 视图: 最新节点
-- =====================
CREATE OR REPLACE VIEW what_reverse_latest_nodes AS
SELECT 
    cn.*,
    u.username AS author_username,
    u.display_name AS author_display_name,
    u.avatar_url AS author_avatar
FROM what_reverse_custom_nodes cn
JOIN what_reverse_users u ON cn.author_id = u.id
WHERE cn.status = 'published' 
  AND cn.deleted_at IS NULL
ORDER BY cn.published_at DESC;
