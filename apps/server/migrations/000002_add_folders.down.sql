-- 回滚文件夹表 (MySQL 版本)
-- 版本: 000002

-- 删除工作流表的文件夹外键约束
ALTER TABLE what_reverse_workflows DROP FOREIGN KEY fk_workflows_folder;

-- 删除文件夹表
DROP TABLE IF EXISTS what_reverse_folders;
