-- 添加应用评分表
-- 版本: 000031
-- 创建时间: 2026-02-02

-- =====================
-- App 评分表 (what_reverse_app_ratings)
-- =====================
CREATE TABLE what_reverse_app_ratings (
    id         CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    app_id     CHAR(36) NOT NULL,
    user_id    CHAR(36) NOT NULL,
    rating     INT NOT NULL,
    comment    TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME,

    UNIQUE KEY uniq_app_rating (app_id, user_id),
    INDEX idx_app_ratings_app (app_id),
    INDEX idx_app_ratings_user (user_id),
    INDEX idx_app_ratings_rating (rating),
    INDEX idx_app_ratings_deleted_at (deleted_at),
    FOREIGN KEY (app_id) REFERENCES what_reverse_apps(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES what_reverse_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
