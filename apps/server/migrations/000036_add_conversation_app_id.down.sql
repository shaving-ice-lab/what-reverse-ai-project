ALTER TABLE `what_reverse_conversations`
  DROP FOREIGN KEY `fk_conversations_app`,
  DROP INDEX `idx_conversations_app_id`,
  DROP COLUMN `app_id`;
