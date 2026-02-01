-- 回滚自定义节点市场数据库结构 (MySQL 版本)
-- 版本: 000010

-- 删除视图
DROP VIEW IF EXISTS what_reverse_latest_nodes;
DROP VIEW IF EXISTS what_reverse_popular_nodes;

-- 删除触发器
DROP TRIGGER IF EXISTS trigger_update_node_review_stats_delete;
DROP TRIGGER IF EXISTS trigger_update_node_review_stats_update;
DROP TRIGGER IF EXISTS trigger_update_node_review_stats_insert;
DROP TRIGGER IF EXISTS trigger_update_node_star_count_delete;
DROP TRIGGER IF EXISTS trigger_update_node_star_count_insert;
DROP TRIGGER IF EXISTS trigger_update_node_install_count_update;
DROP TRIGGER IF EXISTS trigger_update_node_install_count_insert;
DROP TRIGGER IF EXISTS trigger_update_node_download_count;

-- 删除表 (按依赖顺序)
DROP TABLE IF EXISTS what_reverse_custom_node_dependencies;
DROP TABLE IF EXISTS what_reverse_custom_node_stars;
DROP TABLE IF EXISTS what_reverse_custom_node_reviews;
DROP TABLE IF EXISTS what_reverse_custom_node_downloads;
DROP TABLE IF EXISTS what_reverse_custom_node_installs;
DROP TABLE IF EXISTS what_reverse_custom_node_versions;
DROP TABLE IF EXISTS what_reverse_custom_nodes;
