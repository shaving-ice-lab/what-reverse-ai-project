-- 回滚自定义节点审核检查项模板 (MySQL 版本)
-- 版本: 000011

DELETE FROM what_reverse_review_checklists WHERE item_type = 'custom_node';
