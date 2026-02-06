-- 对话关联 App
ALTER TABLE `what_reverse_conversations`
  ADD COLUMN `app_id` CHAR(36) DEFAULT NULL AFTER `user_id`,
  ADD INDEX `idx_conversations_app_id` (`app_id`),
  ADD CONSTRAINT `fk_conversations_app`
    FOREIGN KEY (`app_id`) REFERENCES `what_reverse_apps` (`id`) ON DELETE CASCADE;
