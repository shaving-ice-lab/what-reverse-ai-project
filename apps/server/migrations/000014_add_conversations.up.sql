-- 对话文件夹表
CREATE TABLE IF NOT EXISTS `what_reverse_conversation_folders` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `icon` VARCHAR(50) DEFAULT '📁',
    `color` VARCHAR(20) DEFAULT '#3ECF8E',
    `parent_id` CHAR(36) DEFAULT NULL,
    `sort_order` INT DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) DEFAULT NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_conversation_folders_user_id` (`user_id`),
    INDEX `idx_conversation_folders_parent_id` (`parent_id`),
    INDEX `idx_conversation_folders_deleted_at` (`deleted_at`),
    CONSTRAINT `fk_conversation_folders_user` FOREIGN KEY (`user_id`) REFERENCES `what_reverse_users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_conversation_folders_parent` FOREIGN KEY (`parent_id`) REFERENCES `what_reverse_conversation_folders` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 对话表
CREATE TABLE IF NOT EXISTS `what_reverse_conversations` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `title` VARCHAR(500) NOT NULL,
    `preview` VARCHAR(500) DEFAULT '',
    `model` VARCHAR(50) DEFAULT 'gpt-4',
    `system_prompt` TEXT DEFAULT NULL,
    `starred` BOOLEAN DEFAULT FALSE,
    `pinned` BOOLEAN DEFAULT FALSE,
    `archived` BOOLEAN DEFAULT FALSE,
    `message_count` INT DEFAULT 0,
    `token_usage` INT DEFAULT 0,
    `folder_id` CHAR(36) DEFAULT NULL,
    `metadata` JSON DEFAULT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) DEFAULT NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_conversations_user_id` (`user_id`),
    INDEX `idx_conversations_folder_id` (`folder_id`),
    INDEX `idx_conversations_starred` (`starred`),
    INDEX `idx_conversations_pinned` (`pinned`),
    INDEX `idx_conversations_archived` (`archived`),
    INDEX `idx_conversations_deleted_at` (`deleted_at`),
    INDEX `idx_conversations_created_at` (`created_at`),
    INDEX `idx_conversations_updated_at` (`updated_at`),
    FULLTEXT INDEX `idx_conversations_title` (`title`),
    CONSTRAINT `fk_conversations_user` FOREIGN KEY (`user_id`) REFERENCES `what_reverse_users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_conversations_folder` FOREIGN KEY (`folder_id`) REFERENCES `what_reverse_conversation_folders` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 消息表
CREATE TABLE IF NOT EXISTS `what_reverse_messages` (
    `id` CHAR(36) NOT NULL,
    `conversation_id` CHAR(36) NOT NULL,
    `role` VARCHAR(20) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `model` VARCHAR(50) DEFAULT NULL,
    `token_usage` INT DEFAULT 0,
    `prompt_tokens` INT DEFAULT 0,
    `completion_tokens` INT DEFAULT 0,
    `attachments` JSON DEFAULT NULL,
    `metadata` JSON DEFAULT NULL,
    `parent_id` CHAR(36) DEFAULT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) DEFAULT NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_messages_conversation_id` (`conversation_id`),
    INDEX `idx_messages_role` (`role`),
    INDEX `idx_messages_parent_id` (`parent_id`),
    INDEX `idx_messages_deleted_at` (`deleted_at`),
    INDEX `idx_messages_created_at` (`created_at`),
    CONSTRAINT `fk_messages_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `what_reverse_conversations` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_messages_parent` FOREIGN KEY (`parent_id`) REFERENCES `what_reverse_messages` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 对话标签表
CREATE TABLE IF NOT EXISTS `what_reverse_conversation_tags` (
    `id` CHAR(36) NOT NULL,
    `conversation_id` CHAR(36) NOT NULL,
    `tag_name` VARCHAR(50) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `idx_conversation_tags_conversation_id` (`conversation_id`),
    INDEX `idx_conversation_tags_tag_name` (`tag_name`),
    UNIQUE INDEX `idx_conversation_tags_unique` (`conversation_id`, `tag_name`),
    CONSTRAINT `fk_conversation_tags_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `what_reverse_conversations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
