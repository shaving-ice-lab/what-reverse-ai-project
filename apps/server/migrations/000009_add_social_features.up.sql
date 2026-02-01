-- AgentFlow 社交功能数据库结构 (MySQL 版本)
-- 版本: 000009
-- 创建时间: 2026-01-29

-- =====================
-- 用户关注表 (what_reverse_user_follows)
-- =====================
CREATE TABLE what_reverse_user_follows (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    follower_id     CHAR(36) NOT NULL,
    following_id    CHAR(36) NOT NULL,
    
    -- 时间戳
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- 确保不能关注自己，且关注关系唯一
    CONSTRAINT chk_no_self_follow CHECK (follower_id != following_id),
    UNIQUE KEY unique_follow (follower_id, following_id),
    
    INDEX idx_user_follows_follower (follower_id),
    INDEX idx_user_follows_following (following_id),
    INDEX idx_user_follows_created (created_at DESC),
    
    FOREIGN KEY (follower_id) REFERENCES what_reverse_users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES what_reverse_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- 添加用户统计字段
-- =====================
ALTER TABLE what_reverse_users ADD COLUMN follower_count INT DEFAULT 0;
ALTER TABLE what_reverse_users ADD COLUMN following_count INT DEFAULT 0;

-- =====================
-- 评论表 (what_reverse_comments)
-- =====================
CREATE TABLE what_reverse_comments (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id         CHAR(36) NOT NULL,
    
    -- 评论目标 (多态关联)
    target_type     VARCHAR(50) NOT NULL,
    target_id       CHAR(36) NOT NULL,
    
    -- 回复关联
    parent_id       CHAR(36),
    reply_to_user_id CHAR(36),
    
    -- 内容
    content         TEXT NOT NULL,
    
    -- 统计
    like_count      INT DEFAULT 0,
    reply_count     INT DEFAULT 0,
    
    -- 状态
    is_pinned       BOOLEAN DEFAULT FALSE,
    is_hidden       BOOLEAN DEFAULT FALSE,
    
    -- 时间戳
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      DATETIME,
    
    INDEX idx_comments_user (user_id),
    INDEX idx_comments_target (target_type, target_id),
    INDEX idx_comments_parent (parent_id),
    INDEX idx_comments_created (created_at DESC),
    INDEX idx_comments_deleted (deleted_at),
    
    FOREIGN KEY (user_id) REFERENCES what_reverse_users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES what_reverse_comments(id) ON DELETE CASCADE,
    FOREIGN KEY (reply_to_user_id) REFERENCES what_reverse_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- 评论点赞表 (what_reverse_comment_likes)
-- =====================
CREATE TABLE what_reverse_comment_likes (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id         CHAR(36) NOT NULL,
    comment_id      CHAR(36) NOT NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_like (user_id, comment_id),
    INDEX idx_comment_likes_user (user_id),
    INDEX idx_comment_likes_comment (comment_id),
    
    FOREIGN KEY (user_id) REFERENCES what_reverse_users(id) ON DELETE CASCADE,
    FOREIGN KEY (comment_id) REFERENCES what_reverse_comments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- 通知表 (what_reverse_notifications)
-- =====================
CREATE TABLE what_reverse_notifications (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id         CHAR(36) NOT NULL,
    
    -- 通知类型
    type            VARCHAR(50) NOT NULL,
    
    -- 通知内容
    title           VARCHAR(200) NOT NULL,
    content         TEXT,
    
    -- 关联数据
    actor_id        CHAR(36),
    target_type     VARCHAR(50),
    target_id       CHAR(36),
    
    -- 元数据
    metadata        JSON DEFAULT (JSON_OBJECT()),
    
    -- 状态
    is_read         BOOLEAN DEFAULT FALSE,
    read_at         DATETIME,
    
    -- 时间戳
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_notifications_user (user_id),
    INDEX idx_notifications_unread (user_id, is_read),
    INDEX idx_notifications_type (type),
    INDEX idx_notifications_created (created_at DESC),
    
    FOREIGN KEY (user_id) REFERENCES what_reverse_users(id) ON DELETE CASCADE,
    FOREIGN KEY (actor_id) REFERENCES what_reverse_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- MySQL 触发器：更新关注数
-- =====================
DELIMITER //

CREATE TRIGGER trigger_follow_insert
AFTER INSERT ON what_reverse_user_follows
FOR EACH ROW
BEGIN
    UPDATE what_reverse_users SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    UPDATE what_reverse_users SET follower_count = follower_count + 1 WHERE id = NEW.following_id;
END//

CREATE TRIGGER trigger_follow_delete
AFTER DELETE ON what_reverse_user_follows
FOR EACH ROW
BEGIN
    UPDATE what_reverse_users SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
    UPDATE what_reverse_users SET follower_count = GREATEST(follower_count - 1, 0) WHERE id = OLD.following_id;
END//

-- =====================
-- MySQL 触发器：更新评论点赞数
-- =====================
CREATE TRIGGER trigger_comment_like_insert
AFTER INSERT ON what_reverse_comment_likes
FOR EACH ROW
BEGIN
    UPDATE what_reverse_comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
END//

CREATE TRIGGER trigger_comment_like_delete
AFTER DELETE ON what_reverse_comment_likes
FOR EACH ROW
BEGIN
    UPDATE what_reverse_comments SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.comment_id;
END//

DELIMITER ;
