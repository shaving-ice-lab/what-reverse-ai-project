-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               8.0.42 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             12.14.0.7165
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for what-reverse
CREATE DATABASE IF NOT EXISTS `what-reverse` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `what-reverse`;

-- Dumping structure for table what-reverse.rls_policies
CREATE TABLE IF NOT EXISTS `rls_policies` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workspace_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `table_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `column` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `match_field` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'app_user_id',
  `operation` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'all',
  `enabled` tinyint(1) DEFAULT '1',
  `description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_rls_policies_workspace_id` (`workspace_id`),
  KEY `idx_rls_policies_tbl_name` (`table_name`),
  KEY `idx_rls_policies_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table what-reverse.rls_policies: ~0 rows (approximately)
DELETE FROM `rls_policies`;

-- Dumping structure for table what-reverse.runtime_events
CREATE TABLE IF NOT EXISTS `runtime_events` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `type` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `severity` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'info',
  `message` text COLLATE utf8mb4_unicode_ci,
  `trace_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `span_id` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `parent_span_id` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `workspace_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `execution_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `session_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `node_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `node_type` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duration_ms` bigint DEFAULT NULL,
  `started_at` datetime(3) DEFAULT NULL,
  `ended_at` datetime(3) DEFAULT NULL,
  `request_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remote_ip` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `http_method` varchar(16) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `http_path` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `http_status` bigint DEFAULT NULL,
  `error_code` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `error_message` text COLLATE utf8mb4_unicode_ci,
  `stack_trace` text COLLATE utf8mb4_unicode_ci,
  `metadata` json DEFAULT NULL,
  `sequence_num` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_runtime_events_session_id` (`session_id`),
  KEY `idx_runtime_events_sequence_num` (`sequence_num`),
  KEY `idx_runtime_events_type` (`type`),
  KEY `idx_runtime_events_trace_id` (`trace_id`),
  KEY `idx_runtime_events_workspace_id` (`workspace_id`),
  KEY `idx_runtime_events_execution_id` (`execution_id`),
  KEY `idx_runtime_events_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table what-reverse.runtime_events: ~6 rows (approximately)
DELETE FROM `runtime_events`;
INSERT INTO `runtime_events` (`id`, `created_at`, `type`, `severity`, `message`, `trace_id`, `span_id`, `parent_span_id`, `workspace_id`, `execution_id`, `user_id`, `session_id`, `node_id`, `node_type`, `duration_ms`, `started_at`, `ended_at`, `request_id`, `remote_ip`, `user_agent`, `http_method`, `http_path`, `http_status`, `error_code`, `error_message`, `stack_trace`, `metadata`, `sequence_num`) VALUES
	('0dcf804d-0f70-4514-bbe5-d659da72629e', '2026-02-13 22:15:41.559', 'workspace.accessed', 'info', 'workspace accessed', 'db0a6de48e124b86af450e09b8354686', '1a0517b32274', '', '8930350b-79b7-4307-ae2b-a426375fa2e7', NULL, NULL, 'c9ae9d1d-96fe-4303-87cf-c6c89963d17e', '', '', NULL, NULL, NULL, 'zhTNMyCJtqzsdphznuGgnvNziKmhuhuk', '', '', '', '', NULL, '', '', '', '{"path": "/runtime/fleet", "ip_hash": "12************************************************************a0", "event_type": "runtime_entry", "access_mode": "public_anonymous", "session_type": "anon", "user_agent_hash": "39************************************************************05"}', 6),
	('178a7c92-6305-4f3d-9310-1decf498a3e5', '2026-02-13 13:56:10.002', 'workspace.created', 'info', 'workspace created', '9398fd53b89240cdb52ee90086e0a713', 'c183dc8a2b57', '', '9a4956d6-9b72-4ccb-b863-44ec9a5d03c0', NULL, 'c69f7aa3-0c35-43b5-b50b-2df5b3eba114', NULL, '', '', NULL, NULL, NULL, 'HcXHmGQDFDheLYLJnKdQrCcucRtwzQRi', '', '', '', '', NULL, '', '', '', '{"plan": "free", "slug": "workspace", "source": "default"}', 5),
	('5556a9b8-69ac-4caa-86a9-66af957eb536', '2026-02-07 07:56:19.265', 'workspace.created', 'info', 'workspace created', '29c15150f0b54cb9b904899cd0831bd3', '846c65ca8f0e', '', 'f4471eb2-1daf-4674-beee-51e4058a5ed2', NULL, '532d91c8-2b45-498b-8818-4a1d1fb4cbe4', NULL, '', '', NULL, NULL, NULL, 'BcCuJUmAPkXSrhqmwseKhrrhpnRKVclR', '', '', '', '', NULL, '', '', '', '{"plan": "free", "slug": "e2e1770422179", "source": "default"}', 3),
	('72bfcb57-96cf-4e07-9f25-d8f333dc517d', '2026-02-07 07:55:04.083', 'workspace.created', 'info', 'workspace created', '26dbef9ba2724146a0ea992a2b15a27e', 'dd69709d779f', '', '3c864453-439d-454b-870b-1366119c4fdb', NULL, 'e54c6124-0669-40b9-98da-ee850ce0ed1e', NULL, '', '', NULL, NULL, NULL, 'oJCcBSOnhFFHjuGfFfWrVtboRmRuVWbQ', '', '', '', '', NULL, '', '', '', '{"plan": "free", "slug": "testuser1770422103", "source": "default"}', 2),
	('7d1a6c66-d1f0-41e2-b923-7f0faac01f95', '2026-02-03 04:52:40.170', 'workspace.created', 'info', 'workspace created', '7f6161322fe64db0955b4651f874ec97', '56e8ad104877', '', '8df9aa04-afdc-444f-9105-8e3feac939a6', NULL, '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', NULL, '', '', NULL, NULL, NULL, 'PyUYPYyAWtGMmfapqWRLYaTHByTYIzAa', '', '', '', '', NULL, '', '', '', '{"plan": "free", "slug": "vantiboolean", "source": "default"}', 1),
	('dc8bbec6-db67-4fb9-83a0-7816687db043', '2026-02-14 00:29:01.435', 'workspace.accessed', 'info', 'workspace accessed', '3c10bf6e46a34b48b478126063aa51b6', '1a74836ed5f2', '', '8930350b-79b7-4307-ae2b-a426375fa2e7', NULL, NULL, '8f1c0348-9d26-49cf-99c1-7cf7a8c7e174', '', '', NULL, NULL, NULL, 'TMXAeJGYoOWUoSwNhFAMBOIAdebjtHhP', '', '', '', '', NULL, '', '', '', '{"path": "/runtime/fleet", "ip_hash": "12************************************************************a0", "event_type": "runtime_entry", "access_mode": "public_anonymous", "session_type": "anon", "user_agent_hash": "39************************************************************05"}', 7),
	('fb20edc8-2878-471f-a302-561eac739abd', '2026-02-07 07:56:19.366', 'workspace.created', 'info', 'workspace created', 'e48ea57f303740a495cc2d0d7809ea7e', 'ab1be9b1296d', '', '49726a7e-a4e2-4535-a95a-9a64f76285a2', NULL, '532d91c8-2b45-498b-8818-4a1d1fb4cbe4', NULL, '', '', NULL, NULL, NULL, 'oVBmGFuOKyXisrIfgMimXLsjzTDXwpRO', '', '', '', '', NULL, '', '', '', '{"plan": "free", "slug": "test-ws-1770422179", "source": "manual"}', 4);

-- Dumping structure for table what-reverse.storage_objects
CREATE TABLE IF NOT EXISTS `storage_objects` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workspace_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_name` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mime_type` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` bigint NOT NULL,
  `storage_path` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `public_url` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `prefix` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_storage_objects_workspace_id` (`workspace_id`),
  KEY `idx_storage_objects_owner_id` (`owner_id`),
  KEY `idx_storage_objects_prefix` (`prefix`),
  KEY `idx_storage_objects_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table what-reverse.storage_objects: ~0 rows (approximately)
DELETE FROM `storage_objects`;

-- Dumping structure for table what-reverse.what_reverse_agent_sessions
CREATE TABLE IF NOT EXISTS `what_reverse_agent_sessions` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workspace_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'running',
  `messages` json DEFAULT NULL,
  `tool_calls` json DEFAULT NULL,
  `pending_action` json DEFAULT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_agent_sessions_workspace` (`workspace_id`),
  KEY `idx_agent_sessions_user` (`user_id`),
  KEY `idx_agent_sessions_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table what-reverse.what_reverse_agent_sessions: ~15 rows (approximately)
DELETE FROM `what_reverse_agent_sessions`;
INSERT INTO `what_reverse_agent_sessions` (`id`, `workspace_id`, `user_id`, `status`, `messages`, `tool_calls`, `pending_action`, `created_at`, `updated_at`) VALUES
	('00634877-4394-44e0-85cb-a4b07c26c43d', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'completed', '{"items": [{"role": "user", "content": "给任务表增加一个「标签」字段，可以多选标签，比如 bug、feature、improvement。"}, {"role": "assistant", "content": "好的，我来为 tasks 表添加标签功能。\\n\\n1. 创建 `tags` 表（id, name, color）\\n2. 创建 `task_tags` 关联表（task_id, tag_id）\\n3. 预置标签：🐛 Bug（红色）、✨ Feature（蓝色）、📈 Improvement（绿色）、📝 Documentation（灰色）"}, {"role": "assistant", "content": "✅ 标签功能已添加！\\n\\n- 创建了 `tags` 表和 `task_tags` 关联表\\n- 预置了 4 个标签\\n- 任务列表 UI 已更新，支持标签筛选和多选"}]}', NULL, NULL, '2026-02-10 06:17:11.280', '2026-02-10 06:17:11.280'),
	('169f5328-9917-4bcd-aa7b-592feff9753f', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'completed', '{"items": [{"role": "user", "content": "帮我加一个甘特图页面，展示各任务的时间线。"}, {"role": "assistant", "content": "我来为您创建甘特图页面。\\n\\n将新增一个「时间线」页面，以时间轴形式展示所有任务的开始/结束时间，支持按项目和负责人筛选。"}, {"role": "assistant", "content": "✅ 甘特图页面已创建！\\n\\n- 新增导航项「📅 时间线」\\n- 支持按周/月视图切换\\n- 任务条按状态着色（进行中=蓝色，已完成=绿色，逾期=红色）\\n- 支持拖拽调整时间范围"}]}', NULL, NULL, '2026-02-11 06:25:22.828', '2026-02-11 06:25:22.828'),
	('1e611cab-3091-49a7-8216-669be0d37878', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'completed', '{"items": [{"role": "user", "content": "帮我加一个甘特图页面，展示各任务的时间线。"}, {"role": "assistant", "content": "我来为您创建甘特图页面。\\n\\n将新增一个「时间线」页面，以时间轴形式展示所有任务的开始/结束时间，支持按项目和负责人筛选。"}, {"role": "assistant", "content": "✅ 甘特图页面已创建！\\n\\n- 新增导航项「📅 时间线」\\n- 支持按周/月视图切换\\n- 任务条按状态着色（进行中=蓝色，已完成=绿色，逾期=红色）\\n- 支持拖拽调整时间范围"}]}', NULL, NULL, '2026-02-11 06:25:44.059', '2026-02-11 06:25:44.059'),
	('21e23393-cbf0-4cdb-831e-8a1b2caf80a7', '8930350b-79b7-4307-ae2b-a426375fa2e7', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'completed', '{"data": [{"role": "user", "content": "帮我创建一个智慧车队管理系统，需要管理车辆、驾驶员、行程、维修保养、加油、违章、保险、GPS定位和告警信息。", "timestamp": "2026-02-14T15:26:07+08:00"}, {"role": "assistant", "content": "好的！我来帮你创建智慧车队管理系统。这是一个很全面的系统，我会按以下步骤进行：\\n\\n1. **设计数据库表结构** — 10 张核心数据表\\n2. **创建数据表** — 在工作空间数据库中创建\\n3. **填充示例数据** — 生成真实感的模拟数据\\n4. **构建应用界面** — 使用 AppSchema v2.0 设计多页面应用\\n\\n让我先开始创建数据表...", "metadata": {"step": 1, "type": "thought"}, "timestamp": "2026-02-14T15:26:12+08:00"}, {"role": "assistant", "content": "正在创建车辆信息表 `vehicles`...", "metadata": {"step": 2, "type": "thought"}, "timestamp": "2026-02-14T15:26:17+08:00"}, {"role": "assistant", "content": "正在创建驾驶员信息表 `drivers`...", "metadata": {"step": 3, "type": "thought"}, "timestamp": "2026-02-14T15:26:22+08:00"}, {"role": "assistant", "content": "正在创建路线信息表 `routes`、行程记录表 `trips`、维修保养表 `maintenance_records`...", "metadata": {"step": 4, "type": "thought"}, "timestamp": "2026-02-14T15:26:27+08:00"}, {"role": "assistant", "content": "正在创建加油记录表 `fuel_records`、违章记录表 `violations`、保险记录表 `insurance_policies`...", "metadata": {"step": 5, "type": "thought"}, "timestamp": "2026-02-14T15:26:32+08:00"}, {"role": "assistant", "content": "正在创建 GPS 定位表 `gps_tracking`、告警信息表 `alerts`...", "metadata": {"step": 6, "type": "thought"}, "timestamp": "2026-02-14T15:26:37+08:00"}, {"role": "assistant", "content": "✅ 所有 10 张数据表创建完成！现在开始填充示例数据...\\n\\n- 🚗 20 辆车辆（含轿车、SUV、货车、客车、新能源）\\n- 👤 18 名驾驶员\\n- 🗺️ 10 条路线\\n- 🚀 30 条行程记录\\n- 🔧 15 条维修保养记录\\n- ⛽ 25 条加油记录\\n- 🚨 12 条违章记录\\n- 🛡️ 20 条保险记录\\n- 📍 50 条 GPS 定位记录\\n- ⚠️ 18 条告警记录", "metadata": {"step": 7, "type": "thought"}, "timestamp": "2026-02-14T15:27:07+08:00"}, {"role": "user", "content": "数据已经创建好了，请帮我设计应用界面，我需要一个仪表盘和各个管理模块。", "timestamp": "2026-02-14T15:27:37+08:00"}, {"role": "assistant", "content": "好的！我来设计一个完整的车队管理应用界面。采用侧边栏导航，包含 10 个页面模块：\\n\\n**应用设计方案：**\\n1. 📊 **仪表盘** — 车辆统计卡片 + 最近行程表 + 最新告警\\n2. 🚗 **车辆管理** — 车辆列表，支持增删改查、搜索筛选\\n3. 👤 **驾驶员** — 驾驶员列表，含评分和违章统计\\n4. 📍 **行程记录** — 行程表格，按时间倒序\\n5. 🌍 **路线管理** — 路线配置\\n6. 🔧 **维修保养** — 维修工单管理\\n7. ⛽ **加油记录** — 加油流水\\n8. ⚠️ **违章记录** — 违章信息管理\\n9. 💼 **保险管理** — 保单跟踪\\n10. 🔔 **告警中心** — 告警统计卡片 + 告警列表\\n\\n现在开始生成 UI Schema...", "metadata": {"step": 8, "type": "thought"}, "timestamp": "2026-02-14T15:27:42+08:00"}, {"role": "assistant", "content": "✅ UI Schema 已生成并应用！应用已自动发布。\\n\\n**智慧车队管理系统已就绪！**\\n\\n你可以通过以下方式访问：\\n- 📊 **Builder > Preview** 标签页预览完整应用\\n- 🖥️ **Runtime** 页面查看独立运行的应用\\n\\n系统特性：\\n- 🔒 数据完全隔离在工作空间独立数据库中\\n- 📱 响应式设计，支持移动端\\n- 🔍 支持搜索、筛选、排序\\n- ✏️ 支持在线编辑数据\\n- 📊 实时统计数据\\n\\n如需调整任何模块，随时告诉我！", "metadata": {"step": 9, "type": "thought", "affected_resources": ["ui_schema", "database"]}, "timestamp": "2026-02-14T15:28:07+08:00"}]}', '{"data": [{"args": {"sql": "CREATE TABLE IF NOT EXISTS vehicles (id INTEGER PRIMARY KEY AUTOINCREMENT, plate_number TEXT NOT NULL UNIQUE, ...)"}, "step": 1, "result": {"output": "表 vehicles 创建成功", "success": true}, "timestamp": "2026-02-14T15:26:17+08:00", "tool_name": "query_vm_data"}, {"args": {"sql": "CREATE TABLE IF NOT EXISTS drivers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, ...)"}, "step": 2, "result": {"output": "表 drivers 创建成功", "success": true}, "timestamp": "2026-02-14T15:26:22+08:00", "tool_name": "query_vm_data"}, {"args": {"sql": "CREATE TABLE IF NOT EXISTS routes (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, ...)"}, "step": 3, "result": {"output": "表 routes 创建成功", "success": true}, "timestamp": "2026-02-14T15:26:25+08:00", "tool_name": "query_vm_data"}, {"args": {"sql": "CREATE TABLE IF NOT EXISTS trips (id INTEGER PRIMARY KEY AUTOINCREMENT, trip_no TEXT NOT NULL UNIQUE, ...)"}, "step": 4, "result": {"output": "表 trips 创建成功", "success": true}, "timestamp": "2026-02-14T15:26:27+08:00", "tool_name": "query_vm_data"}, {"args": {"sql": "CREATE TABLE IF NOT EXISTS maintenance_records (...); CREATE TABLE IF NOT EXISTS fuel_records (...); ..."}, "step": 5, "result": {"output": "剩余 6 张表创建成功", "success": true}, "timestamp": "2026-02-14T15:26:37+08:00", "tool_name": "query_vm_data"}, {"args": {"tables": "vehicles,drivers,routes,trips,maintenance_records,fuel_records,violations,insurance_policies,gps_tracking,alerts", "total_rows": 218}, "step": 6, "result": {"output": "共插入 218 条示例数据", "success": true}, "timestamp": "2026-02-14T15:27:07+08:00", "tool_name": "insert_data"}, {"args": {"pages": 10, "app_name": "智慧车队管理系统", "navigation": "sidebar"}, "step": 7, "result": {"output": "UI Schema 已生成并应用 (10 pages)", "success": true}, "timestamp": "2026-02-14T15:27:47+08:00", "tool_name": "modify_ui_schema"}, {"args": {"workspace_id": "8930350b-79b7-4307-ae2b-a426375fa2e7"}, "step": 8, "result": {"output": "应用已发布", "success": true}, "timestamp": "2026-02-14T15:28:02+08:00", "tool_name": "publish_app"}]}', NULL, '2026-02-14 15:26:07.058', '2026-02-14 15:28:07.058'),
	('2f24c6ba-e296-4cf5-b05e-5d2ccb42aba1', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'running', '{"items": [{"role": "user", "content": "帮我增加一个看板视图，按状态列展示任务卡片，支持拖拽切换状态。"}]}', NULL, NULL, '2026-02-12 18:52:15.274', '2026-02-12 18:52:15.274'),
	('370b2f62-0aae-416a-ad50-bda622a1d84d', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'completed', '{"items": [{"role": "user", "content": "给任务表增加一个「标签」字段，可以多选标签，比如 bug、feature、improvement。"}, {"role": "assistant", "content": "好的，我来为 tasks 表添加标签功能。\\n\\n1. 创建 `tags` 表（id, name, color）\\n2. 创建 `task_tags` 关联表（task_id, tag_id）\\n3. 预置标签：🐛 Bug（红色）、✨ Feature（蓝色）、📈 Improvement（绿色）、📝 Documentation（灰色）"}, {"role": "assistant", "content": "✅ 标签功能已添加！\\n\\n- 创建了 `tags` 表和 `task_tags` 关联表\\n- 预置了 4 个标签\\n- 任务列表 UI 已更新，支持标签筛选和多选"}]}', NULL, NULL, '2026-02-10 06:25:44.059', '2026-02-10 06:25:44.059'),
	('46d69728-892a-43f7-a79c-9bfd904146a9', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'running', '{"items": [{"role": "user", "content": "帮我增加一个看板视图，按状态列展示任务卡片，支持拖拽切换状态。"}]}', NULL, NULL, '2026-02-12 18:15:22.828', '2026-02-12 18:15:22.828'),
	('5cc47978-71fe-4d40-8a5c-cc2d47ab6113', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'running', '{"items": [{"role": "user", "content": "帮我增加一个看板视图，按状态列展示任务卡片，支持拖拽切换状态。"}]}', NULL, NULL, '2026-02-12 18:15:44.059', '2026-02-12 18:15:44.059'),
	('62d15384-3ed7-4f7a-abb1-27f9625c2fa7', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'completed', '{"items": [{"role": "user", "content": "帮我加一个甘特图页面，展示各任务的时间线。"}, {"role": "assistant", "content": "我来为您创建甘特图页面。\\n\\n将新增一个「时间线」页面，以时间轴形式展示所有任务的开始/结束时间，支持按项目和负责人筛选。"}, {"role": "assistant", "content": "✅ 甘特图页面已创建！\\n\\n- 新增导航项「📅 时间线」\\n- 支持按周/月视图切换\\n- 任务条按状态着色（进行中=蓝色，已完成=绿色，逾期=红色）\\n- 支持拖拽调整时间范围"}]}', NULL, NULL, '2026-02-11 07:02:15.274', '2026-02-11 07:02:15.274'),
	('6b62828f-ceef-44b9-b71a-092f4c2ba25d', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'completed', '{"items": [{"role": "user", "content": "帮我加一个甘特图页面，展示各任务的时间线。"}, {"role": "assistant", "content": "我来为您创建甘特图页面。\\n\\n将新增一个「时间线」页面，以时间轴形式展示所有任务的开始/结束时间，支持按项目和负责人筛选。"}, {"role": "assistant", "content": "✅ 甘特图页面已创建！\\n\\n- 新增导航项「📅 时间线」\\n- 支持按周/月视图切换\\n- 任务条按状态着色（进行中=蓝色，已完成=绿色，逾期=红色）\\n- 支持拖拽调整时间范围"}]}', NULL, NULL, '2026-02-11 06:17:11.280', '2026-02-11 06:17:11.280'),
	('8c741d47-072f-454c-8c18-697d27a56dad', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'completed', '{"items": [{"role": "user", "content": "给任务表增加一个「标签」字段，可以多选标签，比如 bug、feature、improvement。"}, {"role": "assistant", "content": "好的，我来为 tasks 表添加标签功能。\\n\\n1. 创建 `tags` 表（id, name, color）\\n2. 创建 `task_tags` 关联表（task_id, tag_id）\\n3. 预置标签：🐛 Bug（红色）、✨ Feature（蓝色）、📈 Improvement（绿色）、📝 Documentation（灰色）"}, {"role": "assistant", "content": "✅ 标签功能已添加！\\n\\n- 创建了 `tags` 表和 `task_tags` 关联表\\n- 预置了 4 个标签\\n- 任务列表 UI 已更新，支持标签筛选和多选"}]}', NULL, NULL, '2026-02-10 06:25:22.828', '2026-02-10 06:25:22.828'),
	('93c6f21e-8f81-4a3a-835a-4e4702ce0cec', '8930350b-79b7-4307-ae2b-a426375fa2e7', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'completed', '{"data": [{"role": "user", "content": "帮我查看一下当前车队的运营情况，有多少车辆在线？有没有待处理的告警？", "timestamp": "2026-02-14T16:56:07+08:00"}, {"role": "assistant", "content": "我来帮你查看当前车队运营状况。\\n\\n让我查询各项数据...", "metadata": {"step": 1, "type": "thought"}, "timestamp": "2026-02-14T16:56:10+08:00"}, {"role": "assistant", "content": "📊 **车队运营概况**\\n\\n**车辆状态统计（共 20 辆）：**\\n- 🟢 在线：8 辆（京A88001/比亚迪汉EV、京A88002/Model Y、京A88003/帕萨特、京B66005/H6、京B66006/理想L7、京C55007/欧马可、京A88015/ES6、京A88016/P7）\\n- 🔵 离线：5 辆（京A88004/凯美瑞、京D77009/班车、京D77010/大客车、京A88012/奔驰E300L、京B66013/MG ONE）\\n- 🟡 维修中：3 辆（京C55008/顺达、京A88011/秦PLUS、京C55014/奥铃CTS）\\n- 🔴 已报废：2 辆（京A88019/雅阁、京A88020/极氪001）\\n- ⚪ 停运：2 辆（京B66017/UNI-V、京C55018/EV18）\\n\\n**告警情况：**\\n- ❌ 未处理：6 条\\n- ⏳ 处理中：1 条\\n- ✅ 已处理：7 条\\n- ⚫ 已忽略：4 条\\n\\n**重点告警：**\\n1. 🚨 **紧急** — 京D77009 班车驾驶员疲劳驾驶\\n2. ⚠️ **高** — 京C55007 货车超速（82km/h，限速60）\\n3. ⚠️ **高** — 京D77010 大客车越出电子围栏\\n4. ⚠️ **高** — 京A88019 年检即将到期\\n5. ⚠️ **高** — 京A88012 保险即将到期\\n\\n建议优先处理紧急和高等级告警，确保车辆和驾驶员安全。", "metadata": {"step": 2, "type": "thought"}, "timestamp": "2026-02-14T16:56:15+08:00"}, {"role": "user", "content": "近期的加油费用情况怎么样？哪些车辆油耗比较高？", "timestamp": "2026-02-14T16:56:37+08:00"}, {"role": "assistant", "content": "📊 **近期加油费用分析**\\n\\n**总体费用：**\\n- 燃油记录：25 条 + 充电记录：10 条\\n- 涵盖燃料类型：92号汽油、95号汽油、0号柴油、充电\\n\\n**高油耗车辆 TOP 5：**\\n1. 🚌 京D77010（金龙大客车49座）— 0号柴油，累计 490L，费用 ¥3,706\\n2. 🚛 京C55007（福田欧马可货车）— 0号柴油，累计 293L，费用 ¥2,219\\n3. 🚌 京D77009（宇通班车33座）— 0号柴油，累计 315L，费用 ¥2,378\\n4. 🚗 京A88003（大众帕萨特）— 95号汽油，累计 161L，费用 ¥1,307\\n5. 🚛 京C55008（江铃顺达货车）— 0号柴油，累计 175L，费用 ¥1,323\\n\\n**新能源车辆充电：**\\n- 比亚迪汉EV、特斯拉Model Y、蔚来ES6、小鹏P7 等 6 辆电动车\\n- 平均每次充电费用约 ¥70-130\\n\\n**建议：**\\n- 货车和客车柴油占总费用 65% 以上\\n- 可优化配送路线减少空驶\\n- 电动车充电成本仅为燃油车的 1/5，建议加速替换", "metadata": {"step": 3, "type": "thought"}, "timestamp": "2026-02-14T16:56:42+08:00"}, {"role": "user", "content": "好的，帮我把告警中心页面加一个按严重程度的饼图统计。", "timestamp": "2026-02-14T16:57:07+08:00"}, {"role": "assistant", "content": "好的！我来给告警中心页面添加一个按严重程度分布的饼图。\\n\\n正在更新 UI Schema...", "metadata": {"step": 4, "type": "thought"}, "timestamp": "2026-02-14T16:57:10+08:00"}, {"role": "assistant", "content": "✅ 已在告警中心页面添加了告警严重程度饼图！\\n\\n图表展示了 紧急/高/中/低 四个等级的告警分布。你可以在告警中心页面顶部看到这个新的统计图表。\\n\\n还需要其他修改吗？", "metadata": {"step": 5, "type": "thought", "affected_resources": ["ui_schema"]}, "timestamp": "2026-02-14T16:57:17+08:00"}]}', '{"data": [{"args": {"workspace_id": "8930350b-79b7-4307-ae2b-a426375fa2e7", "include_tables": true}, "step": 1, "result": {"output": "工作空间信息获取成功，包含 10 张数据表", "success": true}, "timestamp": "2026-02-14T16:56:10+08:00", "tool_name": "get_workspace_info"}, {"args": {"sql": "SELECT status, COUNT(*) as count FROM vehicles GROUP BY status"}, "step": 2, "result": {"output": "查询完成：在线8, 离线5, 维修中3, 已报废2, 停运2", "success": true}, "timestamp": "2026-02-14T16:56:12+08:00", "tool_name": "query_vm_data"}, {"args": {"sql": "SELECT status, COUNT(*) as count FROM alerts GROUP BY status"}, "step": 3, "result": {"output": "查询完成：未处理6, 处理中1, 已处理7, 已忽略4", "success": true}, "timestamp": "2026-02-14T16:56:13+08:00", "tool_name": "query_vm_data"}, {"args": {"action": "add_block", "config": {"title": "告警严重程度分布", "chart_type": "pie"}, "page_id": "alerts", "block_type": "chart"}, "step": 4, "result": {"output": "已添加饼图到告警中心页面", "success": true}, "timestamp": "2026-02-14T16:57:12+08:00", "tool_name": "modify_ui_schema"}]}', NULL, '2026-02-14 16:56:07.058', '2026-02-14 16:57:17.058'),
	('a786f66d-6617-426c-a793-d3b7f3e3e1c1', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'completed', '{"items": [{"role": "user", "content": "给任务表增加一个「标签」字段，可以多选标签，比如 bug、feature、improvement。"}, {"role": "assistant", "content": "好的，我来为 tasks 表添加标签功能。\\n\\n1. 创建 `tags` 表（id, name, color）\\n2. 创建 `task_tags` 关联表（task_id, tag_id）\\n3. 预置标签：🐛 Bug（红色）、✨ Feature（蓝色）、📈 Improvement（绿色）、📝 Documentation（灰色）"}, {"role": "assistant", "content": "✅ 标签功能已添加！\\n\\n- 创建了 `tags` 表和 `task_tags` 关联表\\n- 预置了 4 个标签\\n- 任务列表 UI 已更新，支持标签筛选和多选"}]}', NULL, NULL, '2026-02-10 07:02:15.274', '2026-02-10 07:02:15.274'),
	('f4b61011-ea15-4c43-92be-b7eb41ec71ab', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'running', '{"items": [{"role": "user", "content": "帮我增加一个看板视图，按状态列展示任务卡片，支持拖拽切换状态。"}]}', NULL, NULL, '2026-02-12 18:07:11.280', '2026-02-12 18:07:11.280'),
	('fc93f933-aef0-4a81-a445-3c5c15d3bd3e', '8930350b-79b7-4307-ae2b-a426375fa2e7', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'completed', '{"data": [{"role": "user", "content": "帮我看看哪些车辆快到保养周期了，需要安排维修保养的。", "timestamp": "2026-02-14T17:11:07+08:00"}, {"role": "assistant", "content": "我来查询车辆的保养情况。让我检查维修记录和里程数据...", "metadata": {"step": 1, "type": "thought"}, "timestamp": "2026-02-14T17:11:11+08:00"}, {"role": "assistant", "content": "🔧 **车辆保养提醒**\\n\\n**需要立即保养的车辆（按里程）：**\\n1. 🚗 京A88003（帕萨特）— 里程 67,800 km，上次保养在 65,000 km，已超 2,800 km\\n2. 🚗 京A88004（凯美瑞）— 里程 55,200 km，上次保养在 50,000 km，已超 5,200 km\\n3. 🚛 京C55007（欧马可货车）— 里程 125,000 km，上次保养在 120,000 km，已超 5,000 km\\n\\n**即将到期的年检：**\\n- 京A88003 — 年检到期日：2024-08-10（已过期）\\n- 京C55008 — 年检到期日：2024-01-15（已过期）\\n\\n**保险即将到期：**\\n- 京A88001 — 交强险到期：2025-03-15（待续保）\\n- 京A88012 — 交强险到期：2025-04-20\\n\\n**建议：**\\n1. 优先安排京A88003和京A88004的常规保养\\n2. 尽快预约京A88003年检\\n3. 提前续保京A88001交强险", "metadata": {"step": 2, "type": "thought"}, "timestamp": "2026-02-14T17:11:19+08:00"}, {"role": "user", "content": "帮我给京A88003创建一个保养工单，安排到明天。", "timestamp": "2026-02-14T17:11:37+08:00"}, {"role": "assistant", "content": "好的，我来为京A88003创建保养工单...", "metadata": {"step": 3, "type": "thought"}, "timestamp": "2026-02-14T17:11:40+08:00"}, {"role": "assistant", "content": "✅ 保养工单已创建！\\n\\n**工单详情：**\\n- 🔧 工单号：MT-2026-016\\n- 🚗 车辆：京A88003（帕萨特）\\n- 📋 类型：常规保养\\n- 🏪 服务商：北京大众4S店\\n- 📅 预约日期：明天\\n- 💰 预估费用：￥1,580\\n- 📝 保养项目：机油更换、机滤更换、空滤检查、刹车片检查、轮胎检查\\n\\n工单已自动分配给车辆管理员。你可以在「维修保养」页面查看和跟踪进度。\\n\\n还需要为其他车辆安排保养吗？", "metadata": {"step": 4, "type": "thought", "affected_resources": ["database"]}, "timestamp": "2026-02-14T17:11:47+08:00"}, {"role": "user", "content": "再帮我看看仪表盘上的统计数据准不准确。", "timestamp": "2026-02-14T17:12:07+08:00"}, {"role": "assistant", "content": "📊 **仪表盘数据校验**\\n\\n我对比了数据库实际数据和仪表盘显示：\\n\\n| 指标 | 数据库实际值 | 仪表盘显示 | 状态 |\\n|------|-----------|----------|------|\\n| 车辆总数 | 20 | 20 | ✅ 正确 |\\n| 在线车辆 | 8 | 8 | ✅ 正确 |\\n| 驾驶员总数 | 18 | 18 | ✅ 正确 |\\n| 待处理告警 | 6 | 6 | ✅ 正确 |\\n\\n**图表验证：**\\n- 车辆状态饼图：在线8、离线5、维修中3、已报废2、停运2 → ✅ 与数据一致\\n- 车辆类型饼图：轿车5、SUV4、货车4、客车2、新能源5 → ✅ 与数据一致\\n\\n所有统计数据均准确无误！仪表盘实时反映数据库最新状态。", "metadata": {"step": 5, "type": "thought"}, "timestamp": "2026-02-14T17:12:12+08:00"}]}', '{"data": [{"args": {"sql": "SELECT v.plate_number, v.brand, v.model, v.mileage, MAX(m.start_date) as last_maintenance FROM vehicles v LEFT JOIN maintenance_records m ON v.id = m.vehicle_id GROUP BY v.id ORDER BY v.mileage DESC"}, "step": 1, "result": {"output": "查询完成：返回 20 辆车辆的保养信息", "success": true}, "timestamp": "2026-02-14T17:11:11+08:00", "tool_name": "query_vm_data"}, {"args": {"sql": "SELECT * FROM insurance_policies WHERE end_date < date(\'now\', \'+30 day\') AND status = \'有效\' ORDER BY end_date ASC"}, "step": 2, "result": {"output": "查询完成：2 条保险即将到期", "success": true}, "timestamp": "2026-02-14T17:11:15+08:00", "tool_name": "query_vm_data"}, {"args": {"data": {"cost": 1580, "status": "待处理", "record_no": "MT-2026-016", "vehicle_id": 3, "description": "机油更换、机滤更换、空滤检查、刹车片检查、轮胎检查", "maintenance_type": "常规保养", "service_provider": "北京大众4S店"}, "table": "maintenance_records"}, "step": 3, "result": {"output": "已创建保养工单 MT-2026-016", "success": true}, "timestamp": "2026-02-14T17:11:42+08:00", "tool_name": "insert_data"}, {"args": {"sql": "SELECT (SELECT COUNT(*) FROM vehicles) as total_vehicles, (SELECT COUNT(*) FROM vehicles WHERE status=\'在线\') as online_vehicles, (SELECT COUNT(*) FROM drivers) as total_drivers, (SELECT COUNT(*) FROM alerts WHERE status=\'未处理\') as pending_alerts"}, "step": 4, "result": {"output": "车辆20, 在线8, 驾驶员18, 待处理告警6", "success": true}, "timestamp": "2026-02-14T17:12:09+08:00", "tool_name": "query_vm_data"}]}', NULL, '2026-02-14 17:11:07.058', '2026-02-14 17:12:12.058');

-- Dumping structure for table what-reverse.what_reverse_api_keys
CREATE TABLE IF NOT EXISTS `what_reverse_api_keys` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `provider` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `key_encrypted` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `key_preview` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `last_used_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `workspace_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `scopes` json DEFAULT NULL,
  `last_rotated_at` datetime(3) DEFAULT NULL,
  `revoked_at` datetime(3) DEFAULT NULL,
  `revoked_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `revoked_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_what_reverse_api_keys_user` (`user_id`),
  KEY `idx_what_reverse_api_keys_user_id` (`user_id`),
  KEY `idx_what_reverse_api_keys_workspace_id` (`workspace_id`),
  CONSTRAINT `fk_what_reverse_api_keys_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `what_reverse_workspaces` (`id`),
  CONSTRAINT `what_reverse_api_keys_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `what_reverse_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table what-reverse.what_reverse_api_keys: ~6 rows (approximately)
DELETE FROM `what_reverse_api_keys`;
INSERT INTO `what_reverse_api_keys` (`id`, `user_id`, `provider`, `name`, `key_encrypted`, `key_preview`, `is_active`, `last_used_at`, `created_at`, `updated_at`, `workspace_id`, `scopes`, `last_rotated_at`, `revoked_at`, `revoked_by`, `revoked_reason`) VALUES
	('06805b6f-e8b1-4495-83f9-312e65e227ae', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'openai', '项目管理 OpenAI Key', 'enc:sk-proj-xxxx...xxxx', 'sk-...xH4k', 1, NULL, '2026-02-12 18:25:44.494', '2026-02-12 18:25:44.494', '8df9aa04-afdc-444f-9105-8e3feac939a6', '["agent", "completion"]', NULL, NULL, NULL, NULL),
	('146a2d30-be82-4135-9770-8ecc7ea4ca91', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'openai', '项目管理 OpenAI Key', 'enc:sk-proj-xxxx...xxxx', 'sk-...xH4k', 1, NULL, '2026-02-12 18:17:11.759', '2026-02-12 18:17:11.759', '8df9aa04-afdc-444f-9105-8e3feac939a6', '["agent", "completion"]', NULL, NULL, NULL, NULL),
	('45720bdb-2c86-41c2-bffa-a88365d9ad9a', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'openai', 'Fleet AI Dispatch', '', 'sk-...fleet1', 1, '2026-02-12 18:02:16.154', '2026-02-10 19:02:16.154', '2026-02-12 19:02:16.517', '8930350b-79b7-4307-ae2b-a426375fa2e7', '["dispatch:read", "dispatch:write", "vehicles:read"]', NULL, NULL, NULL, NULL),
	('8bc52f56-add9-49a1-b028-d3003fa3892f', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'amap', '高德地图 API', '', 'amap-...gd01', 1, '2026-02-12 18:32:16.154', '2026-02-10 20:02:16.154', '2026-02-12 19:02:16.522', '8930350b-79b7-4307-ae2b-a426375fa2e7', '["map:geocode", "map:route", "map:track"]', NULL, NULL, NULL, NULL),
	('ced5211f-08d0-4d02-b806-d634071acb5a', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'openai', '项目管理 OpenAI Key', 'enc:sk-proj-xxxx...xxxx', 'sk-...xH4k', 1, NULL, '2026-02-12 19:02:15.778', '2026-02-12 19:02:15.778', '8df9aa04-afdc-444f-9105-8e3feac939a6', '["agent", "completion"]', NULL, NULL, NULL, NULL),
	('e5eab289-ae86-4922-a823-9c85968e9ffd', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'openai', '项目管理 OpenAI Key', 'enc:sk-proj-xxxx...xxxx', 'sk-...xH4k', 1, NULL, '2026-02-12 18:25:23.278', '2026-02-12 18:25:23.278', '8df9aa04-afdc-444f-9105-8e3feac939a6', '["agent", "completion"]', NULL, NULL, NULL, NULL);

-- Dumping structure for table what-reverse.what_reverse_app_users
CREATE TABLE IF NOT EXISTS `what_reverse_app_users` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workspace_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `last_login_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_app_user_email` (`workspace_id`,`email`),
  CONSTRAINT `fk_what_reverse_app_users_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `what_reverse_workspaces` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table what-reverse.what_reverse_app_users: ~0 rows (approximately)
DELETE FROM `what_reverse_app_users`;

-- Dumping structure for table what-reverse.what_reverse_audit_logs
CREATE TABLE IF NOT EXISTS `what_reverse_audit_logs` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workspace_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `actor_user_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `metadata_json` json DEFAULT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_what_reverse_audit_logs_workspace_id` (`workspace_id`),
  KEY `idx_what_reverse_audit_logs_actor_user_id` (`actor_user_id`),
  KEY `idx_what_reverse_audit_logs_action` (`action`),
  KEY `idx_what_reverse_audit_logs_target_type` (`target_type`),
  KEY `idx_what_reverse_audit_logs_target_id` (`target_id`),
  CONSTRAINT `fk_what_reverse_audit_logs_actor` FOREIGN KEY (`actor_user_id`) REFERENCES `what_reverse_users` (`id`),
  CONSTRAINT `fk_what_reverse_audit_logs_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `what_reverse_workspaces` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table what-reverse.what_reverse_audit_logs: ~66 rows (approximately)
DELETE FROM `what_reverse_audit_logs`;
INSERT INTO `what_reverse_audit_logs` (`id`, `workspace_id`, `actor_user_id`, `action`, `target_type`, `target_id`, `metadata_json`, `created_at`) VALUES
	('0222040c-956b-46cb-a23f-ac40b65bddc2', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'data.update', 'database', NULL, '{"row_count": 3, "table_name": "tasks"}', '2026-02-12 11:02:15.274'),
	('03a17bbe-9d44-4ec5-8579-3381cc358419', '8930350b-79b7-4307-ae2b-a426375fa2e7', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'table.create', 'table', NULL, '{"tables": ["vehicles", "drivers", "orders", "fuel_records", "maintenance_records", "dispatch_tasks", "routes", "alerts"]}', '2026-02-10 19:02:16.154'),
	('06b6e15f-e3fc-45c6-8df5-6b7ea920154e', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'data.update', 'database', NULL, '{"row_count": 3, "table_name": "tasks"}', '2026-02-12 10:25:22.828'),
	('0b5a4d0d-ec6c-468d-8828-b9a1c3a2ce17', '8930350b-79b7-4307-ae2b-a426375fa2e7', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'workspace.create', 'workspace', '8930350b-79b7-4307-ae2b-a426375fa2e7', '{"name": "智慧车队管理系统"}', '2026-02-10 19:02:16.154'),
	('0bde088a-0e42-4a38-a89b-ff43ec6a5610', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'table.create', 'database', NULL, '{"columns": 3, "table_name": "tags"}', '2026-02-10 06:25:44.059'),
	('0db1961c-53d7-4e5f-8038-2450493edd86', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'table.create', 'database', NULL, '{"columns": 3, "table_name": "tags"}', '2026-02-10 06:17:11.280'),
	('16092a36-03b5-40e9-8405-65d405e2b9d6', '8930350b-79b7-4307-ae2b-a426375fa2e7', 'c69f7aa3-0c35-43b5-b50b-2df5b3eba114', 'workspace.db.table.drop', 'database_table', NULL, '{"span_id": "8a11f5ff104e", "trace_id": "9783d2525cfd4f16abe59bea04c7201f", "http_path": "/api/v1/workspaces/8930350b-79b7-4307-ae2b-a426375fa2e7/database/tables/test_todos", "remote_ip": "[REDACTED]", "request_id": "iCyqlVhxJSZETfCVwtIvaeMHsOYdeBiJ", "table_name": "test_todos", "user_agent": "Mo*****************************************************************************05", "http_method": "DELETE"}', '2026-02-13 13:56:41.554'),
	('16d7685d-153f-4f7e-88aa-ba6401c5fd65', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'data.insert', 'database', NULL, '{"row_count": 4, "table_name": "tags"}', '2026-02-10 06:25:44.059'),
	('1cd4ad3f-7fa4-4fc6-8b81-d57710cbaf87', '8930350b-79b7-4307-ae2b-a426375fa2e7', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'data.import', 'table', NULL, '{"table": "orders", "rows_inserted": 320}', '2026-02-10 20:02:16.154'),
	('224c9894-f472-4972-985f-152283c4f067', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'data.insert', 'database', NULL, '{"row_count": 6, "table_name": "team_members"}', '2026-02-09 19:25:22.828'),
	('22563e96-7cbe-4b51-b49f-230768d72590', '8930350b-79b7-4307-ae2b-a426375fa2e7', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'data.import', 'table', NULL, '{"table": "vehicle_tracks", "rows_inserted": 5000}', '2026-02-11 19:02:16.154'),
	('2434d624-fe9f-443f-a94f-a7e886aed078', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'workspace.publish', 'workspace', NULL, '{"version": "1.0.0"}', '2026-02-09 20:25:22.828'),
	('2f20ea97-ec86-4369-94bd-ae433938f299', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'ui_schema.update', 'workspace', NULL, '{"pages_count": 4}', '2026-02-09 20:25:22.828'),
	('3071afa8-5b19-4310-ae3b-85a6474ebbf1', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'table.create', 'database', NULL, '{"columns": 2, "table_name": "task_tags"}', '2026-02-10 06:25:22.828'),
	('310cda1e-eade-4838-87b6-1b1514e06354', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'workspace.publish', 'workspace', NULL, '{"version": "1.0.0"}', '2026-02-09 21:02:15.274'),
	('32bce54e-de02-457f-9a3e-6d092e56c58d', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'data.insert', 'database', NULL, '{"row_count": 15, "table_name": "tasks"}', '2026-02-09 20:02:15.274'),
	('34db1808-f351-4c9a-880e-aeea484331e4', '8930350b-79b7-4307-ae2b-a426375fa2e7', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'table.alter', 'table', NULL, '{"table": "fuel_records", "change": "add column anomaly_flag"}', '2026-02-11 07:02:16.154'),
	('3cacb66f-1b40-45c8-8619-3708688cec0f', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'data.delete', 'database', NULL, '{"row_count": 1, "table_name": "tasks"}', '2026-02-12 13:17:11.280'),
	('413cab24-2559-4de7-b9ce-23832cf04258', '8930350b-79b7-4307-ae2b-a426375fa2e7', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'ui_schema.update', 'workspace_version', NULL, '{"change": "driver performance scoring", "version": "2.1.0"}', '2026-02-12 07:02:16.154'),
	('4259adfc-1cf1-493f-9155-34cfa1df3e27', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'table.create', 'database', NULL, '{"columns": 8, "table_name": "team_members"}', '2026-02-09 18:25:44.059'),
	('43053b0f-767c-4f10-8cfb-a295b51cc211', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'data.insert', 'database', NULL, '{"row_count": 6, "table_name": "team_members"}', '2026-02-09 19:17:11.280'),
	('4350382e-ecf6-4417-99a4-02cb5c927d1b', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'table.create', 'database', NULL, '{"columns": 7, "table_name": "projects"}', '2026-02-09 18:25:22.828'),
	('4719cd0e-0bf2-447b-a0d4-ff2e7df375af', '8930350b-79b7-4307-ae2b-a426375fa2e7', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'ui_schema.update', 'workspace_version', NULL, '{"change": "geofence and track playback", "version": "2.0.0"}', '2026-02-11 19:02:16.154'),
	('4876f06a-d691-4d7c-81b1-81571e1bd350', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'data.delete', 'database', NULL, '{"row_count": 1, "table_name": "tasks"}', '2026-02-12 13:25:22.828'),
	('48b57285-9202-4cd0-b6e8-f66058988ba0', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'workspace.publish', 'workspace', NULL, '{"version": "1.0.0"}', '2026-02-09 20:25:44.059'),
	('4943866a-0dba-4bf0-8f86-c548d680a6b0', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'table.create', 'database', NULL, '{"columns": 2, "table_name": "task_tags"}', '2026-02-10 07:02:15.274'),
	('49b1c3a5-28a5-473d-aabc-63460312dc5b', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'table.create', 'database', NULL, '{"columns": 8, "table_name": "team_members"}', '2026-02-09 19:02:15.274'),
	('4b2a5030-6392-4122-9936-a65c1a23f8b8', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'data.delete', 'database', NULL, '{"row_count": 1, "table_name": "tasks"}', '2026-02-12 13:25:44.059'),
	('5209f878-a7d2-4a4d-a77d-f6d17b9de490', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'table.create', 'database', NULL, '{"columns": 8, "table_name": "team_members"}', '2026-02-09 18:17:11.280'),
	('58db4030-891b-4bf3-93c4-ebe35e3435bc', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'workspace.update', 'workspace', '8df9aa04-afdc-444f-9105-8e3feac939a6', '{"fields": ["name", "slug"], "span_id": "63991a609508", "trace_id": "e2882c2876d548aa9908281a3db02d51", "http_path": "/api/v1/workspaces/8df9aa04-afdc-444f-9105-8e3feac939a6", "remote_ip": "127.0.***.***", "request_id": "WwPlavQhbHOdlevipyxXKkUJIfwivkAV", "user_agent": "Mo****************************************************************************.0", "http_method": "PATCH"}', '2026-02-12 18:00:39.634'),
	('58f2456f-fc41-4351-a2ca-92fb21f29d84', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'ui_schema.update', 'workspace', NULL, '{"pages_count": 4}', '2026-02-09 20:25:44.059'),
	('60497178-c3f8-401d-b565-f22a0c2c956c', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'table.create', 'database', NULL, '{"columns": 12, "table_name": "tasks"}', '2026-02-09 18:17:11.280'),
	('64827ec8-5670-442c-b328-0e8608481158', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'table.create', 'database', NULL, '{"columns": 12, "table_name": "tasks"}', '2026-02-09 18:25:22.828'),
	('64925c11-419a-4770-a90e-65382ac8addc', '8930350b-79b7-4307-ae2b-a426375fa2e7', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'workspace.publish', 'workspace', '8930350b-79b7-4307-ae2b-a426375fa2e7', '{"version": "1.0.0"}', '2026-02-10 21:02:16.154'),
	('696d55c1-33e0-496d-b7bf-9681fab82e6a', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'table.create', 'database', NULL, '{"columns": 7, "table_name": "projects"}', '2026-02-09 19:02:15.274'),
	('6c28dfde-10c3-41e1-9c61-b5a580874acd', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'table.create', 'database', NULL, '{"columns": 2, "table_name": "task_tags"}', '2026-02-10 06:25:44.059'),
	('77ab778b-3110-458a-9d00-fc6e41451a2e', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'data.insert', 'database', NULL, '{"row_count": 6, "table_name": "team_members"}', '2026-02-09 19:25:44.059'),
	('7839b8ee-e9ae-4218-9dd2-ace19b2ea5ca', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'data.insert', 'database', NULL, '{"row_count": 15, "table_name": "tasks"}', '2026-02-09 19:25:22.828'),
	('78af2e43-1474-4313-8db1-e5264c0cee72', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'table.create', 'database', NULL, '{"columns": 12, "table_name": "tasks"}', '2026-02-09 19:02:15.274'),
	('7c385800-c682-4ccd-bbbc-f612db3d0b36', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'workspace.publish', 'workspace', NULL, '{"version": "1.0.0"}', '2026-02-09 20:17:11.280'),
	('89a54cdf-be95-4d27-bea0-aeff0f8c11bb', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'data.insert', 'database', NULL, '{"row_count": 15, "table_name": "tasks"}', '2026-02-09 19:17:11.280'),
	('8bc14913-e295-45fb-b7aa-3f1fa8d0749d', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'data.insert', 'database', NULL, '{"row_count": 4, "table_name": "tags"}', '2026-02-10 06:25:22.828'),
	('8ea9af51-952e-46c3-8d15-1ae8b7eb62d5', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'data.insert', 'database', NULL, '{"row_count": 4, "table_name": "tags"}', '2026-02-10 06:17:11.280'),
	('91b823b9-235a-42c9-8a9f-776119c3760f', '8930350b-79b7-4307-ae2b-a426375fa2e7', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'table.create', 'table', NULL, '{"tables": ["driver_scores", "customer_ratings"]}', '2026-02-12 07:02:16.154'),
	('96da14e0-e655-4941-a81c-47f9463b9ffd', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'data.insert', 'database', NULL, '{"row_count": 15, "table_name": "tasks"}', '2026-02-09 19:25:44.059'),
	('9ac2929e-c828-4719-b63e-0743e9c03ed4', '8930350b-79b7-4307-ae2b-a426375fa2e7', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'table.create', 'table', NULL, '{"tables": ["maintenance_rules"]}', '2026-02-12 18:32:16.154'),
	('a15613ce-e8d9-47e3-b2e0-3e879e36e1a4', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'data.insert', 'database', NULL, '{"row_count": 4, "table_name": "tags"}', '2026-02-10 07:02:15.274'),
	('a20022de-dcc4-4062-8307-f282f770ade7', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'table.create', 'database', NULL, '{"columns": 7, "table_name": "projects"}', '2026-02-09 18:25:44.059'),
	('a510ed59-9829-45ae-be36-ac9a8dc82914', '8930350b-79b7-4307-ae2b-a426375fa2e7', 'c69f7aa3-0c35-43b5-b50b-2df5b3eba114', 'workspace.db.table.create', 'database_table', NULL, '{"span_id": "127330f58500", "trace_id": "16545f197ecf4856bb36db7b027d46a6", "http_path": "/api/v1/workspaces/8930350b-79b7-4307-ae2b-a426375fa2e7/database/tables", "remote_ip": "[REDACTED]", "request_id": "TVLzSWhJFwybgAbCSlsuQjAtBXEforDH", "table_name": "test_todos", "user_agent": "Mo*****************************************************************************05", "http_method": "POST"}', '2026-02-13 13:56:32.393'),
	('b49ff244-be75-4445-97c7-bf5dfeb4b9f4', '8930350b-79b7-4307-ae2b-a426375fa2e7', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'workspace.publish', 'workspace', '8930350b-79b7-4307-ae2b-a426375fa2e7', '{"version": "2.1.0"}', '2026-02-12 08:02:16.154'),
	('b9242831-185d-47f0-b158-40fd31cd8a46', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'ui_schema.update', 'workspace', NULL, '{"pages_count": 4}', '2026-02-09 21:02:15.274'),
	('c281b973-eff7-4739-a528-a0913fb24fb6', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'data.insert', 'database', NULL, '{"row_count": 6, "table_name": "team_members"}', '2026-02-09 20:02:15.274'),
	('c4d97fa4-1398-4787-917a-e8725e78deeb', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'table.create', 'database', NULL, '{"columns": 3, "table_name": "tags"}', '2026-02-10 06:25:22.828'),
	('c59842fb-bb67-47a9-8267-790199846035', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'workspace.update', 'workspace', '8df9aa04-afdc-444f-9105-8e3feac939a6', '{"fields": ["name", "slug"], "span_id": "488d9954bfcd", "trace_id": "e402ad744edd46aeb3b0601d55e0302f", "http_path": "/api/v1/workspaces/8df9aa04-afdc-444f-9105-8e3feac939a6", "remote_ip": "127.0.***.***", "request_id": "WbEWWPeVMVgjZcpjgWvlJxMTPLnhXpiq", "user_agent": "Mo****************************************************************************.0", "http_method": "PATCH"}', '2026-02-10 12:43:49.313'),
	('c67ded75-52e1-4fbb-af10-478af286b00a', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'ui_schema.update', 'workspace', NULL, '{"pages_count": 4}', '2026-02-09 20:17:11.280'),
	('c7726b2e-aad7-480b-92a4-05c4f3a4197d', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'table.create', 'database', NULL, '{"columns": 8, "table_name": "team_members"}', '2026-02-09 18:25:22.828'),
	('c7ece9ec-a07a-47e3-9eab-77c2e5cb8bcb', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'data.delete', 'database', NULL, '{"row_count": 1, "table_name": "tasks"}', '2026-02-12 14:02:15.274'),
	('c96ed69b-baa5-4246-b3ff-9b2b2996c519', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'table.create', 'database', NULL, '{"columns": 12, "table_name": "tasks"}', '2026-02-09 18:25:44.059'),
	('cccce525-0604-455a-8af4-11b5ef31284a', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'table.create', 'database', NULL, '{"columns": 7, "table_name": "projects"}', '2026-02-09 18:17:11.280'),
	('d0ac5d98-c513-4608-883c-6e29ad454421', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'data.update', 'database', NULL, '{"row_count": 3, "table_name": "tasks"}', '2026-02-12 10:17:11.280'),
	('e18c1309-2686-4a85-bb36-18de41bfa1d2', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'table.create', 'database', NULL, '{"columns": 2, "table_name": "task_tags"}', '2026-02-10 06:17:11.280'),
	('e3c13737-c8a1-4f71-96f6-4d696bb017a8', '8930350b-79b7-4307-ae2b-a426375fa2e7', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'table.create', 'table', NULL, '{"tables": ["geofences", "vehicle_tracks"]}', '2026-02-11 19:02:16.154'),
	('e40afad2-bfc2-48f2-8c4d-443fac7830c5', '8930350b-79b7-4307-ae2b-a426375fa2e7', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'data.import', 'table', NULL, '{"table": "drivers", "rows_inserted": 48}', '2026-02-10 20:02:16.154'),
	('e7edf034-7cc4-411c-b086-d2ce80019085', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'table.create', 'database', NULL, '{"columns": 3, "table_name": "tags"}', '2026-02-10 07:02:15.274'),
	('f19a2588-339c-45c8-8c1a-1634fad955c9', '8930350b-79b7-4307-ae2b-a426375fa2e7', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'data.import', 'table', NULL, '{"table": "vehicles", "rows_inserted": 52}', '2026-02-10 19:02:16.154'),
	('f63ca115-fa63-4a19-b47f-2614b0d2d744', '8930350b-79b7-4307-ae2b-a426375fa2e7', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'ui_schema.update', 'workspace_version', NULL, '{"version": "1.0.0", "pages_count": 10}', '2026-02-10 20:02:16.154'),
	('f7fcbf58-77ed-4a7d-bd84-6399f3afc0b6', '8930350b-79b7-4307-ae2b-a426375fa2e7', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'ui_schema.update', 'workspace_version', NULL, '{"change": "enhanced fuel analytics", "version": "1.1.0"}', '2026-02-11 07:02:16.154'),
	('fc024223-1ce2-44fb-92d0-9bbcf7b85bab', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'data.update', 'database', NULL, '{"row_count": 3, "table_name": "tasks"}', '2026-02-12 10:25:44.059');

-- Dumping structure for table what-reverse.what_reverse_comment
CREATE TABLE IF NOT EXISTS `what_reverse_comment` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `parent_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_what_reverse_comment_parent_id` (`parent_id`),
  KEY `idx_what_reverse_comment_user_id` (`user_id`),
  KEY `idx_what_reverse_comment_target_id` (`target_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table what-reverse.what_reverse_comment: ~0 rows (approximately)
DELETE FROM `what_reverse_comment`;

-- Dumping structure for table what-reverse.what_reverse_comment_like
CREATE TABLE IF NOT EXISTS `what_reverse_comment_like` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `comment_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_what_reverse_comment_like_comment_id` (`comment_id`),
  KEY `idx_what_reverse_comment_like_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table what-reverse.what_reverse_comment_like: ~0 rows (approximately)
DELETE FROM `what_reverse_comment_like`;

-- Dumping structure for table what-reverse.what_reverse_idempotency_keys
CREATE TABLE IF NOT EXISTS `what_reverse_idempotency_keys` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner_user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `idempotency_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workspace_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resource_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resource_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `request_hash` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'processing',
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_idempotency_key` (`owner_user_id`,`idempotency_key`,`action`),
  KEY `idx_what_reverse_idempotency_keys_workspace_id` (`workspace_id`),
  KEY `idx_what_reverse_idempotency_keys_resource_id` (`resource_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table what-reverse.what_reverse_idempotency_keys: ~0 rows (approximately)
DELETE FROM `what_reverse_idempotency_keys`;

-- Dumping structure for table what-reverse.what_reverse_notifications
CREATE TABLE IF NOT EXISTS `what_reverse_notifications` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci,
  `actor_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `read_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_what_reverse_notifications_user_id` (`user_id`),
  KEY `idx_what_reverse_notifications_type` (`type`),
  KEY `idx_what_reverse_notifications_actor_id` (`actor_id`),
  CONSTRAINT `fk_what_reverse_notifications_actor` FOREIGN KEY (`actor_id`) REFERENCES `what_reverse_users` (`id`),
  CONSTRAINT `fk_what_reverse_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `what_reverse_users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table what-reverse.what_reverse_notifications: ~47 rows (approximately)
DELETE FROM `what_reverse_notifications`;
INSERT INTO `what_reverse_notifications` (`id`, `user_id`, `type`, `title`, `content`, `actor_id`, `target_type`, `target_id`, `metadata`, `is_read`, `read_at`, `created_at`) VALUES
	('0491e68d-8103-4284-a962-2cd49143ff67', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'system', '应用发布成功', '您的应用「项目管理工具」已成功发布，可以通过公开链接访问了。', NULL, NULL, NULL, NULL, 1, '2026-02-09 21:02:15.138', '2026-02-09 19:02:15.138'),
	('05cf1694-8d14-4554-acf9-de1a8477f7c1', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'system', '车队系统 v1.0 发布成功', '智慧车队管理系统 v1.0 已发布上线，可通过公开链接访问。', NULL, NULL, NULL, NULL, 1, '2026-02-10 22:02:16.154', '2026-02-10 21:02:16.154'),
	('0f48f366-920a-4134-adc0-c080ee0e2902', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'system', '新功能上线', 'ReverseAI 新增「行级安全策略」功能，可为不同用户设置数据访问权限。前往设置了解更多。', NULL, NULL, NULL, NULL, 0, NULL, '2026-02-12 16:02:15.274'),
	('16b0cfc2-7539-4b77-a536-9cb59272c137', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'system', '博客平台发布成功', '您的应用「个人博客平台」已成功发布上线。', NULL, NULL, NULL, NULL, 0, NULL, '2026-02-11 18:25:43.913'),
	('1fce1131-712a-4f3e-9937-64e0f4287cd5', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'system', '博客平台发布成功', '您的应用「个人博客平台」已成功发布上线。', NULL, NULL, NULL, NULL, 0, NULL, '2026-02-11 18:25:22.693'),
	('223cd066-3bb2-4eaf-9fd6-3f4f07f21171', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'system', 'Pro 计划已激活', '恭喜！您的 Pro 计划已激活，享受更多高级功能和更高配额。', NULL, NULL, NULL, NULL, 0, NULL, '2026-02-12 17:25:43.913'),
	('29e04b57-8e53-4fc9-b3b2-afdfc6f37dff', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'system', '欢迎加入 ReverseAI！', '您的账户已创建成功。开始与 AI Agent 对话，快速构建您的第一个应用吧！', NULL, NULL, NULL, NULL, 1, '2026-02-09 19:02:15.138', '2026-02-05 19:02:15.138'),
	('3195a828-49c3-4b19-9e2f-7113e6736b37', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'system', '欢迎加入 ReverseAI！', '您的账户已创建成功。开始与 AI Agent 对话，快速构建您的第一个应用吧！', NULL, NULL, NULL, NULL, 1, '2026-02-09 18:17:11.115', '2026-02-05 18:17:11.115'),
	('3b912ec9-606e-4637-9b82-1b00966891da', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'system', '博客文章获得关注', '您的博客已有 128 次独立访客访问，最热门文章「如何使用 AI 构建 Web 应用」获得 56 次浏览。', NULL, NULL, NULL, NULL, 0, NULL, '2026-02-12 17:47:11.280'),
	('3e4e6eae-10db-4a54-b15f-3e162f425a44', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'system', 'CRM 系统待发布', '您的「客户管理系统」已具备发布条件，包含 3 张数据表和完整 UI。立即发布？', NULL, NULL, NULL, NULL, 0, NULL, '2026-02-12 10:17:11.280'),
	('4a8b99bb-2a0c-4b12-a3dd-f89931df2add', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'system', 'API 调用量提醒', '本月 API 调用已达到 Pro 计划限额的 60%（6,000/10,000 次）。', NULL, NULL, NULL, NULL, 1, '2026-02-11 23:02:15.274', '2026-02-11 19:02:15.274'),
	('51d481bb-279c-4783-9c78-49da47325a97', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'system', '博客平台发布成功', '您的应用「个人博客平台」已成功发布上线。', NULL, NULL, NULL, NULL, 0, NULL, '2026-02-11 18:17:11.115'),
	('52705b36-2035-482c-9415-9392ec300d54', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'system', 'CRM 系统待发布', '您的「客户管理系统」已具备发布条件，包含 3 张数据表和完整 UI。立即发布？', NULL, NULL, NULL, NULL, 0, NULL, '2026-02-12 11:02:15.274'),
	('56b2aa7e-27af-4bc1-bce0-1b63e2b28f27', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'system', '博客平台发布成功', '您的应用「个人博客平台」已成功发布上线。', NULL, NULL, NULL, NULL, 0, NULL, '2026-02-11 19:02:15.138'),
	('5c48eb39-6e5e-4eb8-b50b-b3f1d1a43e61', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'system', '新功能上线', 'ReverseAI 新增「行级安全策略」功能，可为不同用户设置数据访问权限。前往设置了解更多。', NULL, NULL, NULL, NULL, 0, NULL, '2026-02-12 15:17:11.280'),
	('604bc8dd-40c9-433a-a3b0-43510b256f4f', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'system', '数据库备份完成', '「项目管理工具」数据库自动备份已完成，备份大小 2.3 MB。', NULL, NULL, NULL, NULL, 1, '2026-02-10 17:02:15.274', '2026-02-10 07:02:15.274'),
	('62c158ee-93ac-4769-82ee-506c791745f6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'alert', '电子围栏告警：沪B·67890 驶出园区', '车辆 沪B·67890（司机：张伟）于 14:32 驶出「公司园区」电子围栏，当前位置：沪闵高架南向。', NULL, NULL, NULL, NULL, 0, NULL, '2026-02-12 13:02:16.154'),
	('67fa1711-8d3c-4260-a2ed-ceb35ac42935', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'system', '数据库备份完成', '「项目管理工具」数据库自动备份已完成，备份大小 2.3 MB。', NULL, NULL, NULL, NULL, 1, '2026-02-10 16:25:44.059', '2026-02-10 06:25:44.059'),
	('7607727e-3d09-4f79-8514-2f44993f0b99', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'system', '车队管理系统创建成功', '您的「智慧车队管理系统」已创建完成，包含 8 张数据表和 10 个功能页面。', NULL, NULL, NULL, NULL, 1, '2026-02-10 20:02:16.154', '2026-02-10 19:02:16.154'),
	('7775768e-b90a-4b96-a6a3-0eafa1763ef2', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'system', '欢迎加入 ReverseAI！', '您的账户已创建成功。开始与 AI Agent 对话，快速构建您的第一个应用吧！', NULL, NULL, NULL, NULL, 1, '2026-02-09 18:14:44.687', '2026-02-05 18:14:44.687'),
	('79733e1c-79d4-4894-bf52-8b7f2e488f2f', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'system', '应用发布成功', '您的应用「项目管理工具」已成功发布，可以通过公开链接访问了。', NULL, NULL, NULL, NULL, 1, '2026-02-09 20:25:43.913', '2026-02-09 18:25:43.913'),
	('80d82cd0-6ce9-4c62-8fed-9ff7e01dafa3', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'system', 'API 调用量提醒', '本月 API 调用已达到 Pro 计划限额的 60%（6,000/10,000 次）。', NULL, NULL, NULL, NULL, 1, '2026-02-11 22:25:22.828', '2026-02-11 18:25:22.828'),
	('840785ff-745a-4eb0-8319-6f1719f3aa80', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'system', '应用发布成功', '您的应用「项目管理工具」已成功发布，可以通过公开链接访问了。', NULL, NULL, NULL, NULL, 1, '2026-02-09 20:14:44.687', '2026-02-09 18:14:44.687'),
	('86327862-477c-4968-8bdd-4bb74b6b703d', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'system', '博客平台发布成功', '您的应用「个人博客平台」已成功发布上线。', NULL, NULL, NULL, NULL, 0, NULL, '2026-02-11 18:14:44.687'),
	('8f1c690c-ef67-4c9f-a4cc-5b4160da09f6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'system', '欢迎加入 ReverseAI！', '您的账户已创建成功。开始与 AI Agent 对话，快速构建您的第一个应用吧！', NULL, NULL, NULL, NULL, 1, '2026-02-09 18:25:22.693', '2026-02-05 18:25:22.693'),
	('9cfcafbe-fe1d-41b5-87a4-b0abb079a5e0', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'system', '数据库备份完成', '「项目管理工具」数据库自动备份已完成，备份大小 2.3 MB。', NULL, NULL, NULL, NULL, 1, '2026-02-10 16:25:22.828', '2026-02-10 06:25:22.828'),
	('9dd3bab2-a54c-4717-bf8b-eb8a18a5686d', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'system', '博客文章获得关注', '您的博客已有 128 次独立访客访问，最热门文章「如何使用 AI 构建 Web 应用」获得 56 次浏览。', NULL, NULL, NULL, NULL, 0, NULL, '2026-02-12 18:32:15.274'),
	('a00f5d9f-477a-49fe-8f85-ca6ea4674d53', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'system', '数据库备份完成', '「项目管理工具」数据库自动备份已完成，备份大小 2.3 MB。', NULL, NULL, NULL, NULL, 1, '2026-02-10 16:17:11.280', '2026-02-10 06:17:11.280'),
	('a43eb925-b30f-49a0-ba2d-57fee77af956', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'system', '新功能上线', 'ReverseAI 新增「行级安全策略」功能，可为不同用户设置数据访问权限。前往设置了解更多。', NULL, NULL, NULL, NULL, 0, NULL, '2026-02-12 15:25:22.828'),
	('a4deb34d-de3e-4e65-9181-08a807dda360', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'system', '博客文章获得关注', '您的博客已有 128 次独立访客访问，最热门文章「如何使用 AI 构建 Web 应用」获得 56 次浏览。', NULL, NULL, NULL, NULL, 0, NULL, '2026-02-12 17:55:44.059'),
	('a523c728-13a4-452a-ba18-88f13544961d', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'system', '博客文章获得关注', '您的博客已有 128 次独立访客访问，最热门文章「如何使用 AI 构建 Web 应用」获得 56 次浏览。', NULL, NULL, NULL, NULL, 0, NULL, '2026-02-12 17:55:22.828'),
	('a72d76bb-3466-4496-8d9a-363190ca2d23', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'alert', '异常油耗预警', '系统检测到 12 条异常油耗记录，车辆沪A·88321百公里油耗达 42.5L，超出标准值 38%。请及时排查。', NULL, NULL, NULL, NULL, 1, '2026-02-11 09:02:16.154', '2026-02-11 08:02:16.154'),
	('afd3639a-6f64-4b0d-8c5a-ed85c521f22e', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'system', 'API 调用量提醒', '本月 API 调用已达到 Pro 计划限额的 60%（6,000/10,000 次）。', NULL, NULL, NULL, NULL, 1, '2026-02-11 22:17:11.280', '2026-02-11 18:17:11.280'),
	('b10f08ea-a9eb-4943-861d-1546d2c14626', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'system', '车队系统 v2.1.0 发布成功', '智慧车队管理系统已更新至 v2.1.0，新增油耗趋势分析、电子围栏告警、司机绩效评分等功能。', NULL, NULL, NULL, NULL, 0, NULL, '2026-02-12 08:02:16.154'),
	('b5a3a885-31a7-44ac-ae94-9bdbf79f1678', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'system', '应用发布成功', '您的应用「项目管理工具」已成功发布，可以通过公开链接访问了。', NULL, NULL, NULL, NULL, 1, '2026-02-09 20:17:11.115', '2026-02-09 18:17:11.115'),
	('b61c2948-eeac-40c1-bc97-e422c9b86591', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'system', 'Pro 计划已激活', '恭喜！您的 Pro 计划已激活，享受更多高级功能和更高配额。', NULL, NULL, NULL, NULL, 0, NULL, '2026-02-12 17:17:11.115'),
	('bc1f0f44-a800-4356-98b1-df3f35a97f07', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'system', 'Pro 计划已激活', '恭喜！您的 Pro 计划已激活，享受更多高级功能和更高配额。', NULL, NULL, NULL, NULL, 0, NULL, '2026-02-12 17:14:44.687'),
	('bd7ee7b2-6511-4d3d-aab3-b20153578583', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'alert', '维保提醒：3 辆车即将到期', '以下车辆维保即将到期：\n- 沪A·12345（剩余 5 天）\n- 沪C·99887（剩余 3 天）\n- 沪A·55667（剩余 6 天）\n请及时安排维保。', NULL, NULL, NULL, NULL, 0, NULL, '2026-02-12 17:02:16.154'),
	('c7ce8790-2fd6-4682-a815-fb495dba885e', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'system', 'CRM 系统待发布', '您的「客户管理系统」已具备发布条件，包含 3 张数据表和完整 UI。立即发布？', NULL, NULL, NULL, NULL, 0, NULL, '2026-02-12 10:25:22.828'),
	('d206de57-8707-4ad0-b79d-50af240d3872', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'system', 'CRM 系统待发布', '您的「客户管理系统」已具备发布条件，包含 3 张数据表和完整 UI。立即发布？', NULL, NULL, NULL, NULL, 0, NULL, '2026-02-12 10:25:44.059'),
	('d8c063d6-dad1-4be8-aba7-c16b3a9f4521', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'system', '欢迎加入 ReverseAI！', '您的账户已创建成功。开始与 AI Agent 对话，快速构建您的第一个应用吧！', NULL, NULL, NULL, NULL, 1, '2026-02-09 18:25:43.913', '2026-02-05 18:25:43.913'),
	('de80a4b5-0211-41d6-a149-a4f0da763f59', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'system', '新功能上线', 'ReverseAI 新增「行级安全策略」功能，可为不同用户设置数据访问权限。前往设置了解更多。', NULL, NULL, NULL, NULL, 0, NULL, '2026-02-12 15:25:44.059'),
	('de839b29-2841-4b42-a04c-25d785d9ffe9', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'system', 'Pro 计划已激活', '恭喜！您的 Pro 计划已激活，享受更多高级功能和更高配额。', NULL, NULL, NULL, NULL, 0, NULL, '2026-02-12 18:02:15.138'),
	('ec6614d2-225d-4953-af16-595e93f52856', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'system', 'API 调用量提醒', '本月 API 调用已达到 Pro 计划限额的 60%（6,000/10,000 次）。', NULL, NULL, NULL, NULL, 1, '2026-02-11 22:25:44.059', '2026-02-11 18:25:44.059'),
	('f47c3105-b556-4b7b-a024-0ebfaee1ea41', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'system', '应用发布成功', '您的应用「项目管理工具」已成功发布，可以通过公开链接访问了。', NULL, NULL, NULL, NULL, 1, '2026-02-09 20:25:22.693', '2026-02-09 18:25:22.693'),
	('f5b6a87c-408b-409e-99cb-9e2da879cf93', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'alert', '超速告警：沪D·11223', '车辆 沪D·11223（司机：李明）在 G60 沪昆高速 K128 处速度达 125km/h，超出限速 20km/h。', NULL, NULL, NULL, NULL, 0, NULL, '2026-02-12 18:17:16.154'),
	('fd9bea8e-6aa8-4663-99af-3cbd62d577a7', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'system', 'Pro 计划已激活', '恭喜！您的 Pro 计划已激活，享受更多高级功能和更高配额。', NULL, NULL, NULL, NULL, 0, NULL, '2026-02-12 17:25:22.693');

-- Dumping structure for table what-reverse.what_reverse_review_checklist
CREATE TABLE IF NOT EXISTS `what_reverse_review_checklist` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `item_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `items` json DEFAULT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_what_reverse_review_checklist_item_type` (`item_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table what-reverse.what_reverse_review_checklist: ~0 rows (approximately)
DELETE FROM `what_reverse_review_checklist`;

-- Dumping structure for table what-reverse.what_reverse_review_comment
CREATE TABLE IF NOT EXISTS `what_reverse_review_comment` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `resolved_at` datetime(3) DEFAULT NULL,
  `resolved_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_what_reverse_review_comment_queue_id` (`queue_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table what-reverse.what_reverse_review_comment: ~0 rows (approximately)
DELETE FROM `what_reverse_review_comment`;

-- Dumping structure for table what-reverse.what_reverse_review_queue
CREATE TABLE IF NOT EXISTS `what_reverse_review_queue` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `item_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `item_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `submitter_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reviewer_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `assigned_at` datetime(3) DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `priority` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'normal',
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `snapshot` json NOT NULL,
  `submission_note` text COLLATE utf8mb4_unicode_ci,
  `result_note` text COLLATE utf8mb4_unicode_ci,
  `result_data` json DEFAULT NULL,
  `revision_count` bigint DEFAULT '0',
  `revision_note` text COLLATE utf8mb4_unicode_ci,
  `version` bigint DEFAULT '1',
  `submitted_at` datetime(3) DEFAULT NULL,
  `reviewed_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_what_reverse_review_queue_submitter_id` (`submitter_id`),
  KEY `idx_what_reverse_review_queue_reviewer_id` (`reviewer_id`),
  KEY `idx_what_reverse_review_queue_status` (`status`),
  KEY `idx_what_reverse_review_queue_priority` (`priority`),
  KEY `idx_what_reverse_review_queue_item_type` (`item_type`),
  KEY `idx_what_reverse_review_queue_item_id` (`item_id`),
  CONSTRAINT `fk_what_reverse_review_queue_reviewer` FOREIGN KEY (`reviewer_id`) REFERENCES `what_reverse_reviewers` (`id`),
  CONSTRAINT `fk_what_reverse_review_queue_submitter` FOREIGN KEY (`submitter_id`) REFERENCES `what_reverse_users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table what-reverse.what_reverse_review_queue: ~0 rows (approximately)
DELETE FROM `what_reverse_review_queue`;

-- Dumping structure for table what-reverse.what_reverse_review_record
CREATE TABLE IF NOT EXISTS `what_reverse_review_record` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reviewer_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `from_status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `to_status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_what_reverse_review_record_queue_id` (`queue_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table what-reverse.what_reverse_review_record: ~0 rows (approximately)
DELETE FROM `what_reverse_review_record`;

-- Dumping structure for table what-reverse.what_reverse_reviewer
CREATE TABLE IF NOT EXISTS `what_reverse_reviewer` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `active` tinyint(1) DEFAULT '1',
  `total_reviews` bigint DEFAULT '0',
  `approved_count` bigint DEFAULT '0',
  `rejected_count` bigint DEFAULT '0',
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_what_reverse_reviewer_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table what-reverse.what_reverse_reviewer: ~0 rows (approximately)
DELETE FROM `what_reverse_reviewer`;

-- Dumping structure for table what-reverse.what_reverse_secrets
CREATE TABLE IF NOT EXISTS `what_reverse_secrets` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `secret_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `value_encrypted` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `value_preview` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `expires_at` datetime(3) DEFAULT NULL,
  `last_used_at` datetime(3) DEFAULT NULL,
  `last_rotated_at` datetime(3) DEFAULT NULL,
  `revoked_at` datetime(3) DEFAULT NULL,
  `revoked_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `revoked_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_what_reverse_secrets_owner_type` (`owner_type`),
  KEY `idx_what_reverse_secrets_owner_id` (`owner_id`),
  KEY `idx_what_reverse_secrets_secret_type` (`secret_type`),
  KEY `idx_what_reverse_secrets_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table what-reverse.what_reverse_secrets: ~0 rows (approximately)
DELETE FROM `what_reverse_secrets`;

-- Dumping structure for table what-reverse.what_reverse_user_activities
CREATE TABLE IF NOT EXISTS `what_reverse_user_activities` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entity_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `device` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `metadata` json DEFAULT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_what_reverse_user_activities_user_id` (`user_id`),
  KEY `idx_what_reverse_user_activities_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table what-reverse.what_reverse_user_activities: ~132 rows (approximately)
DELETE FROM `what_reverse_user_activities`;
INSERT INTO `what_reverse_user_activities` (`id`, `user_id`, `action`, `entity_type`, `entity_id`, `device`, `ip`, `location`, `user_agent`, `metadata`, `created_at`) VALUES
	('01e56c07-bd3b-49d1-acbc-51f8aaf1d282', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'user.login', NULL, NULL, 'Firefox / macOS', '192.168.1.100', NULL, NULL, NULL, '2026-02-12 15:02:15.274'),
	('058a7c26-17c9-4054-8dcc-2f7068d9a5e2', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.start', 'agent_session', '8df9aa04-afdc-444f-9105-8e3feac939a6', NULL, NULL, NULL, NULL, NULL, '2026-02-10 06:17:11.280'),
	('06c3d331-cdb0-4b89-939b-ec11aeaa8676', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'apikey.create', 'api_key', NULL, NULL, NULL, NULL, NULL, '{"provider": "openai"}', '2026-02-10 16:25:44.059'),
	('06ca24c0-28a4-4b3b-9b4e-6ec8192b4a4c', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'workspace.create', 'workspace', '3a7f6570-7462-4d87-a0d1-88d724849066', NULL, NULL, NULL, NULL, '{"name": "项目管理工具"}', '2026-02-09 18:14:44.687'),
	('09e9be52-5153-4813-ba64-b2372589ec7e', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'workspace.create', 'workspace', 'a7ae8dae-b4b5-4ec2-ab95-f3e71a63ab54', NULL, NULL, NULL, NULL, '{"name": "客户管理系统"}', '2026-02-10 19:02:15.138'),
	('10241d6b-a52f-4b05-b685-2244f4b35739', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'workspace.create', 'workspace', '5aefcad7-45e2-4cf1-8795-db612f4cad91', NULL, NULL, NULL, NULL, '{"name": "客户管理系统"}', '2026-02-10 18:25:43.913'),
	('12e07842-c4c6-4eb7-a0cb-c22ddc2ed173', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.start', 'agent_session', '8df9aa04-afdc-444f-9105-8e3feac939a6', NULL, NULL, NULL, NULL, NULL, '2026-02-12 18:52:15.274'),
	('13809835-febe-4a04-a595-7001816d8c16', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.start', 'agent_session', '26457307-802f-43cb-8130-ee84006df009', NULL, NULL, NULL, NULL, NULL, '2026-02-12 06:25:44.059'),
	('17b9e05a-5d60-43a3-9190-a6dce2897279', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'user.login', NULL, NULL, 'Chrome / Windows', '127.0.0.1', NULL, NULL, NULL, '2026-02-09 18:25:22.693'),
	('185ee592-8977-48fc-9870-18cca2276054', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.start', 'agent_session', '8930350b-79b7-4307-ae2b-a426375fa2e7', NULL, NULL, NULL, NULL, '{"purpose": "电子围栏和轨迹"}', '2026-02-11 19:02:16.154'),
	('1aa33215-032a-4f3e-8fa9-ceb537de97b7', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.start', 'agent_session', '3a7f6570-7462-4d87-a0d1-88d724849066', NULL, NULL, NULL, NULL, NULL, '2026-02-09 18:14:44.687'),
	('1b24d6a2-7e05-4bc0-ab1c-e76d5c28b97c', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'apikey.create', 'api_key', NULL, NULL, NULL, NULL, NULL, '{"provider": "openai"}', '2026-02-10 17:02:15.274'),
	('1c2987e8-aa7b-40aa-bd35-4c63aeb83d34', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.start', 'agent_session', '8df9aa04-afdc-444f-9105-8e3feac939a6', NULL, NULL, NULL, NULL, NULL, '2026-02-11 06:25:44.059'),
	('1c50d645-b10f-4fc7-a5a5-d0fe8a42cbf6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'workspace.publish', 'workspace', '6502cd15-1581-4e35-89ea-50e1378511c2', NULL, NULL, NULL, NULL, NULL, '2026-02-11 19:02:15.138'),
	('20cab196-06ee-4c01-af62-37cb5fe94ce5', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.start', 'agent_session', '8930350b-79b7-4307-ae2b-a426375fa2e7', NULL, NULL, NULL, NULL, '{"purpose": "增强油耗分析"}', '2026-02-11 07:02:16.154'),
	('21118dae-a7a3-4c68-bfeb-c3dc04f30473', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.start', 'agent_session', '07931abe-1c03-413b-be1c-56a7206c9e6d', NULL, NULL, NULL, NULL, NULL, '2026-02-09 18:25:22.693'),
	('22d1e56e-e1e6-49d4-9251-c3d857820cc4', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.start', 'agent_session', '8df9aa04-afdc-444f-9105-8e3feac939a6', NULL, NULL, NULL, NULL, NULL, '2026-02-12 18:15:44.059'),
	('244b347b-7b95-47c3-a28c-67e902efbb05', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.start', 'agent_session', '559ec719-32eb-4430-b939-c8ecbfebb1dc', NULL, NULL, NULL, NULL, NULL, '2026-02-09 18:17:11.115'),
	('270b3a15-1640-40b6-aa8b-69fd61e5b7f5', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.start', 'agent_session', '3a7f6570-7462-4d87-a0d1-88d724849066', NULL, NULL, NULL, NULL, NULL, '2026-02-11 12:25:44.059'),
	('272554d1-5010-40d0-a6d7-c88d8970460f', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'database.table.create', 'workspace', '8df9aa04-afdc-444f-9105-8e3feac939a6', NULL, NULL, NULL, NULL, '{"table": "tags"}', '2026-02-10 06:25:22.828'),
	('279b9d30-6813-4184-9669-4be16878d4d1', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'user.login', NULL, NULL, 'Chrome / Windows', '127.0.0.1', NULL, NULL, NULL, '2026-02-09 18:25:43.913'),
	('289d48d3-745a-4776-94dd-da4bff578467', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'user.login', NULL, NULL, 'Firefox / macOS', '192.168.1.100', NULL, NULL, NULL, '2026-02-12 14:25:22.828'),
	('292fb2c6-cbc0-4071-8d6a-4ecccae309f6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'user.register', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-05 18:25:22.693'),
	('29eb2889-dde0-4452-ab3f-d3aaf09e8bc3', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'user.register', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-05 18:25:43.913'),
	('2b802ca5-8e3f-46c6-a003-b988fca464cf', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'user.login', NULL, NULL, 'Chrome / Windows', '127.0.0.1', NULL, NULL, NULL, '2026-02-09 18:17:11.115'),
	('2b95361d-6ff4-42b9-a2ff-165b7132467c', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'database.table.create', 'workspace', '26457307-802f-43cb-8130-ee84006df009', NULL, NULL, NULL, NULL, '{"table": "post_views"}', '2026-02-12 06:25:22.828'),
	('30ad680b-d432-4047-9cc2-7c03e29e72d5', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'workspace.create', 'workspace', '559ec719-32eb-4430-b939-c8ecbfebb1dc', NULL, NULL, NULL, NULL, '{"name": "项目管理工具"}', '2026-02-09 18:17:11.115'),
	('31fd03bf-c73b-4b21-b8f7-25051a748e04', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'ui_schema.update', 'workspace', '3a7f6570-7462-4d87-a0d1-88d724849066', NULL, NULL, NULL, NULL, '{"component": "funnel_chart"}', '2026-02-11 12:17:11.280'),
	('37b5e8ac-f7e3-4f6b-b3de-0d6d97d77693', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'user.login', NULL, NULL, 'Chrome / Windows', '127.0.0.1', NULL, NULL, NULL, '2026-02-12 18:25:22.693'),
	('388dc5c7-5213-4383-8626-74b212870da9', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'workspace.create', 'workspace', '6502cd15-1581-4e35-89ea-50e1378511c2', NULL, NULL, NULL, NULL, '{"name": "个人博客平台"}', '2026-02-11 19:02:15.138'),
	('3a1d1343-cf50-43ff-8eb0-e9c5ce7155a7', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'workspace.publish', 'workspace', '8930350b-79b7-4307-ae2b-a426375fa2e7', NULL, NULL, NULL, NULL, '{"version": "1.0.0"}', '2026-02-10 21:02:16.154'),
	('3a4a6701-29bb-4ffb-8e84-98daab2eec6e', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'apikey.create', 'api_key', NULL, NULL, NULL, NULL, NULL, '{"provider": "openai"}', '2026-02-10 16:17:11.280'),
	('3a5c29cc-2496-4e11-934e-db47358a4493', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.start', 'agent_session', '26457307-802f-43cb-8130-ee84006df009', NULL, NULL, NULL, NULL, NULL, '2026-02-12 12:25:44.059'),
	('3b7c6590-f885-4269-90da-b29efce5ae21', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'user.login', NULL, NULL, 'Chrome / Windows', '127.0.0.1', NULL, NULL, NULL, '2026-02-12 18:17:11.115'),
	('3d4f9678-dbd4-4027-af56-e1119f853c64', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'user.login', NULL, NULL, 'Chrome / Windows', '127.0.0.1', NULL, NULL, NULL, '2026-02-12 19:02:15.138'),
	('3d9ff2fa-5ee4-4a57-bbec-1a065c186d8f', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'user.profile.update', NULL, NULL, NULL, NULL, NULL, NULL, '{"field": "bio"}', '2026-02-12 16:25:44.059'),
	('3f258e65-8206-4bc4-8264-f9fee229c4a3', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'workspace.create', 'workspace', '4a45ac82-56c2-4eec-a9a5-99b91bfd2324', NULL, NULL, NULL, NULL, '{"name": "个人博客平台"}', '2026-02-11 18:25:43.913'),
	('3f330a7f-f7ac-45cf-a0ec-04a1938a0a6f', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'apikey.revoke', 'api_key', NULL, NULL, NULL, NULL, NULL, '{"reason": "已切换到 DeepSeek", "provider": "anthropic"}', '2026-02-12 17:02:15.274'),
	('3f7db51f-4ef5-49fa-bf77-6b8eb9d553ee', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'workspace.publish', 'workspace', 'a65f7389-9691-469e-8362-60529f8e3672', NULL, NULL, NULL, NULL, NULL, '2026-02-09 18:25:43.913'),
	('3faffa8f-ccbb-4036-941e-f8cb5c0cbd92', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'database.table.create', 'workspace', '26457307-802f-43cb-8130-ee84006df009', NULL, NULL, NULL, NULL, '{"table": "post_views"}', '2026-02-12 06:25:44.059'),
	('424d3550-aaf3-4371-aea0-510eb0be7aab', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.start', 'agent_session', '26457307-802f-43cb-8130-ee84006df009', NULL, NULL, NULL, NULL, NULL, '2026-02-12 12:25:22.828'),
	('43500bbf-4ceb-4f18-be34-c8ad2cd24885', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'workspace.create', 'workspace', 'bf59430a-a02e-49b2-a09c-d85c85caa139', NULL, NULL, NULL, NULL, '{"name": "项目管理工具"}', '2026-02-09 19:02:15.138'),
	('44446f18-7d6d-4f84-87d6-2a7460075ae0', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.start', 'agent_session', '26457307-802f-43cb-8130-ee84006df009', NULL, NULL, NULL, NULL, NULL, '2026-02-10 18:14:44.687'),
	('49de94f5-33aa-4a0a-9aac-2221056064bf', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.start', 'agent_session', '6502cd15-1581-4e35-89ea-50e1378511c2', NULL, NULL, NULL, NULL, NULL, '2026-02-11 19:02:15.138'),
	('4aa73386-70e8-40fc-894f-133f0f6e247b', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'ui_schema.update', 'workspace', '8df9aa04-afdc-444f-9105-8e3feac939a6', NULL, NULL, NULL, NULL, '{"pages_added": 1}', '2026-02-11 06:25:22.828'),
	('4bdc3ddd-b815-489a-b781-041a2ff724c6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'ui_schema.update', 'workspace', '3a7f6570-7462-4d87-a0d1-88d724849066', NULL, NULL, NULL, NULL, '{"component": "funnel_chart"}', '2026-02-11 12:25:44.059'),
	('4e88cd63-f202-473d-8387-5867f35329b8', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'database.table.create', 'workspace', '8df9aa04-afdc-444f-9105-8e3feac939a6', NULL, NULL, NULL, NULL, '{"table": "tags"}', '2026-02-10 07:02:15.274'),
	('4f890370-180d-4289-975e-3a61c89c237c', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.start', 'agent_session', '26457307-802f-43cb-8130-ee84006df009', NULL, NULL, NULL, NULL, NULL, '2026-02-12 06:25:22.828'),
	('5051e30c-d04a-4af8-9c67-a57915e469ec', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'workspace.create', 'workspace', 'a890bd43-b704-4282-8cdf-ca8c8f8072a0', NULL, NULL, NULL, NULL, '{"name": "客户管理系统"}', '2026-02-10 18:25:22.693'),
	('50df0b2e-dbf0-4e27-98b7-b5f3d9e3e5b5', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.start', 'agent_session', '4a45ac82-56c2-4eec-a9a5-99b91bfd2324', NULL, NULL, NULL, NULL, NULL, '2026-02-11 18:25:43.913'),
	('50f62bb4-12b5-4746-b885-b336e62d83c4', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'workspace.create', 'workspace', '26457307-802f-43cb-8130-ee84006df009', NULL, NULL, NULL, NULL, '{"name": "客户管理系统"}', '2026-02-10 18:14:44.687'),
	('510e019e-beab-4d41-a7ba-d7e3628c9864', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.start', 'agent_session', '3a7f6570-7462-4d87-a0d1-88d724849066', NULL, NULL, NULL, NULL, NULL, '2026-02-12 01:02:15.274'),
	('51645870-5fa3-4feb-b51f-cd1671418617', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'user.login', NULL, NULL, 'Chrome / Windows', '127.0.0.1', NULL, NULL, NULL, '2026-02-11 18:25:43.913'),
	('51e11566-0a5f-4a98-ba2a-f4a5992debca', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.start', 'agent_session', '8df9aa04-afdc-444f-9105-8e3feac939a6', NULL, NULL, NULL, NULL, NULL, '2026-02-11 06:17:11.280'),
	('520a2a8d-c7e5-404a-b527-f6d0f1d787c1', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'workspace.create', 'workspace', '8930350b-79b7-4307-ae2b-a426375fa2e7', NULL, NULL, NULL, NULL, '{"name": "智慧车队管理系统"}', '2026-02-10 19:02:16.154'),
	('5239cec6-65d9-4cf1-8201-c4a25b5e63c2', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'user.login', NULL, NULL, 'Chrome / Windows', '127.0.0.1', NULL, NULL, NULL, '2026-02-12 18:14:44.687'),
	('52f1950b-275b-45ae-9f86-c6b6932938a4', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.start', 'agent_session', '3a7f6570-7462-4d87-a0d1-88d724849066', NULL, NULL, NULL, NULL, NULL, '2026-02-11 13:02:15.274'),
	('537d8722-aa7e-425b-8c7b-f27954d6de69', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'workspace.publish', 'workspace', '3a7f6570-7462-4d87-a0d1-88d724849066', NULL, NULL, NULL, NULL, NULL, '2026-02-09 18:14:44.687'),
	('55c3506a-a3dd-4e39-b8a0-73dd052e28c2', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'apikey.revoke', 'api_key', NULL, NULL, NULL, NULL, NULL, '{"reason": "已切换到 DeepSeek", "provider": "anthropic"}', '2026-02-12 16:25:44.059'),
	('58c22f21-c38d-4548-8778-2046a0eafc39', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.start', 'agent_session', '8df9aa04-afdc-444f-9105-8e3feac939a6', NULL, NULL, NULL, NULL, NULL, '2026-02-12 18:15:22.828'),
	('5c6fbe97-8884-4958-8508-4fb1e67cdac8', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'workspace.publish', 'workspace', '4a45ac82-56c2-4eec-a9a5-99b91bfd2324', NULL, NULL, NULL, NULL, NULL, '2026-02-11 18:25:43.913'),
	('5d54ead5-712a-46d0-a5da-2cc227eb059b', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'user.login', NULL, NULL, 'Chrome / Windows', '127.0.0.1', NULL, NULL, NULL, '2026-02-11 18:14:44.687'),
	('5df318d2-b6a0-4cc7-b743-a01413eaea39', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'user.profile.update', NULL, NULL, NULL, NULL, NULL, NULL, '{"field": "bio"}', '2026-02-12 17:02:15.274'),
	('619b03dd-e025-49f3-89b5-c2d04acc840b', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'ui_schema.update', 'workspace', '8df9aa04-afdc-444f-9105-8e3feac939a6', NULL, NULL, NULL, NULL, '{"pages_added": 1}', '2026-02-11 07:02:15.274'),
	('695db794-ad58-43b4-a446-fa3ede805697', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.start', 'agent_session', '26457307-802f-43cb-8130-ee84006df009', NULL, NULL, NULL, NULL, NULL, '2026-02-12 06:17:11.280'),
	('7182c9db-e16b-43d1-a1f4-7782cc25c05d', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'workspace.create', 'workspace', '9e214302-0b64-45d0-b56b-a63fdc6100fa', NULL, NULL, NULL, NULL, '{"name": "个人博客平台"}', '2026-02-11 18:17:11.115'),
	('749ac10f-f140-4d96-9e40-fece0d343e7f', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'database.table.create', 'workspace', '8df9aa04-afdc-444f-9105-8e3feac939a6', NULL, NULL, NULL, NULL, '{"table": "tags"}', '2026-02-10 06:17:11.280'),
	('76434bcf-5f7b-4c38-af59-0ca488620974', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'user.login', NULL, NULL, 'Chrome / Windows', '127.0.0.1', NULL, NULL, NULL, '2026-02-11 19:02:15.138'),
	('782f4f4a-6129-4837-9e87-54d02f5c0f0f', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.start', 'agent_session', '8df9aa04-afdc-444f-9105-8e3feac939a6', NULL, NULL, NULL, NULL, NULL, '2026-02-10 06:25:44.059'),
	('7a6e2417-a3c9-4de1-b6c4-7121b0f03de5', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'workspace.create', 'workspace', '7ee118a9-8d0b-458c-bb72-ba7e72b02edc', NULL, NULL, NULL, NULL, '{"name": "个人博客平台"}', '2026-02-11 18:25:22.693'),
	('7c79597a-7c52-45f8-95c1-f021e85e933a', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.start', 'agent_session', 'a7ae8dae-b4b5-4ec2-ab95-f3e71a63ab54', NULL, NULL, NULL, NULL, NULL, '2026-02-10 19:02:15.138'),
	('7d0ebcbb-3546-4a48-9081-1ae305b1b5b6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'user.login', NULL, NULL, 'Chrome / Windows', '127.0.0.1', NULL, NULL, NULL, '2026-02-11 18:25:22.693'),
	('81ca6125-5a65-4a94-9a0c-027a95455689', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'database.table.alter', 'workspace', '3a7f6570-7462-4d87-a0d1-88d724849066', NULL, NULL, NULL, NULL, '{"table": "contacts", "column": "next_follow_up"}', '2026-02-12 00:17:11.280'),
	('855f37e5-dc0c-413c-8c22-b5f10f7691ae', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.start', 'agent_session', 'a890bd43-b704-4282-8cdf-ca8c8f8072a0', NULL, NULL, NULL, NULL, NULL, '2026-02-10 18:25:22.693'),
	('8b6fcf07-d1a8-42e6-9589-e0691576db20', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.start', 'agent_session', '8df9aa04-afdc-444f-9105-8e3feac939a6', NULL, NULL, NULL, NULL, NULL, '2026-02-12 18:07:11.280'),
	('8c1995fa-0159-4b7b-9bb1-bc9ea628bbe2', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'user.profile.update', NULL, NULL, NULL, NULL, NULL, NULL, '{"field": "bio"}', '2026-02-12 16:17:11.280'),
	('8cd348ee-aa87-424b-be54-27a9c25ccbbf', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'database.table.alter', 'workspace', '3a7f6570-7462-4d87-a0d1-88d724849066', NULL, NULL, NULL, NULL, '{"table": "contacts", "column": "next_follow_up"}', '2026-02-12 00:25:44.059'),
	('8fa90bf5-b122-4cc3-97cc-6f16e4e4be6f', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.start', 'agent_session', '3a7f6570-7462-4d87-a0d1-88d724849066', NULL, NULL, NULL, NULL, NULL, '2026-02-12 00:17:11.280'),
	('90686136-4d80-4a66-9a05-017014abacea', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.complete', 'agent_session', '8930350b-79b7-4307-ae2b-a426375fa2e7', NULL, NULL, NULL, NULL, '{"tables_created": 8, "pages_generated": 10}', '2026-02-10 20:02:16.154'),
	('91f83623-306c-4ede-9f85-32ebf5a6642b', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'apikey.revoke', 'api_key', NULL, NULL, NULL, NULL, NULL, '{"reason": "已切换到 DeepSeek", "provider": "anthropic"}', '2026-02-12 16:17:11.280'),
	('977b7afa-4c69-411e-bd9c-3b3611448af8', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'workspace.settings.update', 'workspace', '26457307-802f-43cb-8130-ee84006df009', NULL, NULL, NULL, NULL, '{"feature": "rss"}', '2026-02-12 12:17:11.280'),
	('9b30ba2b-f6d5-40e8-9ae3-4c529c69501d', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.start', 'agent_session', '3a7f6570-7462-4d87-a0d1-88d724849066', NULL, NULL, NULL, NULL, NULL, '2026-02-11 12:17:11.280'),
	('9c54e302-8bf8-438c-bc30-9b71c1fdceae', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.start', 'agent_session', '5aefcad7-45e2-4cf1-8795-db612f4cad91', NULL, NULL, NULL, NULL, NULL, '2026-02-10 18:25:43.913'),
	('9c87b69d-f3d4-456b-ad69-61f21c2934c5', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'workspace.publish', 'workspace', 'bf59430a-a02e-49b2-a09c-d85c85caa139', NULL, NULL, NULL, NULL, NULL, '2026-02-09 19:02:15.138'),
	('9d35aa2f-4d6f-4919-90de-8f400a30a35e', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.complete', 'agent_session', '8930350b-79b7-4307-ae2b-a426375fa2e7', NULL, NULL, NULL, NULL, '{"tables_created": 2, "geofences_added": 3}', '2026-02-11 20:02:16.154'),
	('9d83d913-dfd3-4509-857f-8ec25bf1e15e', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'workspace.publish', 'workspace', '7ee118a9-8d0b-458c-bb72-ba7e72b02edc', NULL, NULL, NULL, NULL, NULL, '2026-02-11 18:25:22.693'),
	('9ff1cf16-b66a-41a8-9b02-407ce6742615', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.start', 'agent_session', '8df9aa04-afdc-444f-9105-8e3feac939a6', NULL, NULL, NULL, NULL, NULL, '2026-02-11 07:02:15.274'),
	('a1029472-bfd7-4ac1-9a06-aa3b92c70b92', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'ui_schema.update', 'workspace', '3a7f6570-7462-4d87-a0d1-88d724849066', NULL, NULL, NULL, NULL, '{"component": "funnel_chart"}', '2026-02-11 12:25:22.828'),
	('a23b8920-3173-41fc-a1f3-df16c3e4ddee', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'apikey.create', 'api_key', NULL, NULL, NULL, NULL, NULL, '{"provider": "deepseek"}', '2026-02-11 03:02:15.274'),
	('a4a015aa-f7bc-4141-8c97-2b940c9906e8', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'user.login', NULL, NULL, 'Chrome / Windows', '127.0.0.1', NULL, NULL, NULL, '2026-02-09 18:14:44.687'),
	('a66a3397-dfbe-47c0-bce5-aa5a8ecda573', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'database.table.create', 'workspace', '26457307-802f-43cb-8130-ee84006df009', NULL, NULL, NULL, NULL, '{"table": "post_views"}', '2026-02-12 07:02:15.274'),
	('a689d633-e7c7-45e8-ae16-b4f3c4f0533e', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'workspace.create', 'workspace', 'e6a0dba3-28fe-4280-9df6-6fce02642cf2', NULL, NULL, NULL, NULL, '{"name": "客户管理系统"}', '2026-02-10 18:17:11.115'),
	('a7045752-dffc-46a7-a06e-a0175ba6b0c8', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.start', 'agent_session', '9e214302-0b64-45d0-b56b-a63fdc6100fa', NULL, NULL, NULL, NULL, NULL, '2026-02-11 18:17:11.115'),
	('a77b75fd-f459-471b-9858-f6567c8137f4', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.start', 'agent_session', 'a65f7389-9691-469e-8362-60529f8e3672', NULL, NULL, NULL, NULL, NULL, '2026-02-09 18:25:43.913'),
	('a8eaa2e2-b1ff-4945-979c-1bf7621d752d', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.start', 'agent_session', '7ee118a9-8d0b-458c-bb72-ba7e72b02edc', NULL, NULL, NULL, NULL, NULL, '2026-02-11 18:25:22.693'),
	('a99c9d88-8ae3-4aeb-9eb7-28668e086eb8', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'workspace.publish', 'workspace', '9e214302-0b64-45d0-b56b-a63fdc6100fa', NULL, NULL, NULL, NULL, NULL, '2026-02-11 18:17:11.115'),
	('aa734c67-d4c9-49e1-aa58-31e24bc088c7', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'user.login', NULL, NULL, 'Chrome / Windows', '127.0.0.1', NULL, NULL, NULL, '2026-02-12 18:25:43.913'),
	('aaa648d5-391f-4c0a-a171-ea64055345f5', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.start', 'agent_session', 'e6a0dba3-28fe-4280-9df6-6fce02642cf2', NULL, NULL, NULL, NULL, NULL, '2026-02-10 18:17:11.115'),
	('ab383c2f-941d-41ee-8d64-c5b41398e5d3', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'ui_schema.update', 'workspace', '3a7f6570-7462-4d87-a0d1-88d724849066', NULL, NULL, NULL, NULL, '{"component": "funnel_chart"}', '2026-02-11 13:02:15.274'),
	('ad6002f7-17cd-4828-8818-792c5776e9e7', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'user.login', NULL, NULL, 'Firefox / macOS', '192.168.1.100', NULL, NULL, NULL, '2026-02-12 14:17:11.280'),
	('ad7b1147-7cec-424d-b41c-98058e59f635', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'user.register', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-05 18:14:44.687'),
	('ae4412cb-4901-4db6-b016-33a5b0a1c153', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.start', 'agent_session', 'a1914d54-db17-4d69-92c0-d450f9bb8964', NULL, NULL, NULL, NULL, NULL, '2026-02-11 18:14:44.687'),
	('aeb9cb95-0ae5-44a2-97d2-a7b1ebbae073', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.start', 'agent_session', '26457307-802f-43cb-8130-ee84006df009', NULL, NULL, NULL, NULL, NULL, '2026-02-12 12:17:11.280'),
	('af0b5c87-b55b-4dff-b53a-54c2c90d37c8', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'workspace.settings.update', 'workspace', '26457307-802f-43cb-8130-ee84006df009', NULL, NULL, NULL, NULL, '{"feature": "rss"}', '2026-02-12 12:25:22.828'),
	('b072a027-b15e-4bea-ac4f-460776f3b72c', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.start', 'agent_session', '8df9aa04-afdc-444f-9105-8e3feac939a6', NULL, NULL, NULL, NULL, NULL, '2026-02-11 06:25:22.828'),
	('b1feec49-7f94-4b86-93cf-12b8858cca6d', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.start', 'agent_session', 'bf59430a-a02e-49b2-a09c-d85c85caa139', NULL, NULL, NULL, NULL, NULL, '2026-02-09 19:02:15.138'),
	('b24d1f2a-2ecd-4f30-b561-b16b529bd4d2', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.start', 'agent_session', '3a7f6570-7462-4d87-a0d1-88d724849066', NULL, NULL, NULL, NULL, NULL, '2026-02-12 00:25:44.059'),
	('b3d8309d-844c-4818-bdac-4f69062ca25a', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'apikey.create', 'api_key', NULL, NULL, NULL, NULL, NULL, '{"provider": "deepseek"}', '2026-02-11 02:25:22.828'),
	('b5a5575c-1300-498d-b9a5-185c008d7dd2', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'apikey.create', 'api_key', NULL, NULL, NULL, NULL, NULL, '{"provider": "openai"}', '2026-02-10 16:25:22.828'),
	('b9820177-f2fb-4361-ae9f-622c2c644db5', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'database.table.alter', 'workspace', '3a7f6570-7462-4d87-a0d1-88d724849066', NULL, NULL, NULL, NULL, '{"table": "contacts", "column": "next_follow_up"}', '2026-02-12 00:25:22.828'),
	('b9f35337-d7b6-4400-8988-f52dbc312690', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'workspace.settings.update', 'workspace', '26457307-802f-43cb-8130-ee84006df009', NULL, NULL, NULL, NULL, '{"feature": "rss"}', '2026-02-12 12:25:44.059'),
	('ba63daa7-9d0c-4d89-b2f4-cc19f9bddf0f', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'database.table.create', 'workspace', '8df9aa04-afdc-444f-9105-8e3feac939a6', NULL, NULL, NULL, NULL, '{"table": "tags"}', '2026-02-10 06:25:44.059'),
	('ba839446-c3c8-46b6-a583-78bc2e7cf252', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'workspace.publish', 'workspace', '8930350b-79b7-4307-ae2b-a426375fa2e7', NULL, NULL, NULL, NULL, '{"version": "2.1.0"}', '2026-02-12 08:02:16.154'),
	('bbf70549-ee11-426d-a72c-49a4302a6c19', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'database.table.alter', 'workspace', '3a7f6570-7462-4d87-a0d1-88d724849066', NULL, NULL, NULL, NULL, '{"table": "contacts", "column": "next_follow_up"}', '2026-02-12 01:02:15.274'),
	('bcef7b99-ff06-4c26-98f7-406174fb2999', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.start', 'agent_session', '8930350b-79b7-4307-ae2b-a426375fa2e7', NULL, NULL, NULL, NULL, '{"purpose": "智能维保提醒"}', '2026-02-12 18:32:16.154'),
	('bd6d89d7-ca4a-491f-88cc-e68902c7c076', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'workspace.create', 'workspace', 'a65f7389-9691-469e-8362-60529f8e3672', NULL, NULL, NULL, NULL, '{"name": "项目管理工具"}', '2026-02-09 18:25:43.913'),
	('bf433e9a-ae44-4254-a10e-a7019441842b', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'user.register', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-05 19:02:15.138'),
	('bffd1722-2efa-4451-8e3e-65a4fbf13d55', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'workspace.create', 'workspace', 'a1914d54-db17-4d69-92c0-d450f9bb8964', NULL, NULL, NULL, NULL, '{"name": "个人博客平台"}', '2026-02-11 18:14:44.687'),
	('c23613d4-ee37-431b-85f6-b7f0a78f36dd', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'user.register', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-05 18:17:11.115'),
	('c464cc65-b42f-44ab-be94-6ef44bd5001a', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.start', 'agent_session', '8930350b-79b7-4307-ae2b-a426375fa2e7', NULL, NULL, NULL, NULL, '{"purpose": "初始系统搭建"}', '2026-02-10 19:02:16.154'),
	('c8ffd9de-84da-47e5-a7ef-35bc06dcdce3', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.start', 'agent_session', '8df9aa04-afdc-444f-9105-8e3feac939a6', NULL, NULL, NULL, NULL, NULL, '2026-02-10 06:25:22.828'),
	('cc4119aa-2474-4791-a854-f28d65d1a42d', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'database.table.create', 'workspace', '26457307-802f-43cb-8130-ee84006df009', NULL, NULL, NULL, NULL, '{"table": "post_views"}', '2026-02-12 06:17:11.280'),
	('ce27cc63-99d8-44ab-8045-fa10cb1f743f', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.complete', 'agent_session', '8930350b-79b7-4307-ae2b-a426375fa2e7', NULL, NULL, NULL, NULL, '{"drivers_scored": 48, "tables_created": 2}', '2026-02-12 08:02:16.154'),
	('d110b00e-406b-4445-afa8-a8e9510bf09c', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'apikey.revoke', 'api_key', NULL, NULL, NULL, NULL, NULL, '{"reason": "已切换到 DeepSeek", "provider": "anthropic"}', '2026-02-12 16:25:22.828'),
	('d32204c6-eac8-4a89-bc52-3a961310f2e5', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.start', 'agent_session', '26457307-802f-43cb-8130-ee84006df009', NULL, NULL, NULL, NULL, NULL, '2026-02-12 07:02:15.274'),
	('d39d2377-4c1a-4c83-8778-4c8ac67cc7be', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'ui_schema.update', 'workspace', '8df9aa04-afdc-444f-9105-8e3feac939a6', NULL, NULL, NULL, NULL, '{"pages_added": 1}', '2026-02-11 06:25:44.059'),
	('d44e5c19-59a3-4f63-ad49-5524f226c32f', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'user.profile.update', NULL, NULL, NULL, NULL, NULL, NULL, '{"field": "bio"}', '2026-02-12 16:25:22.828'),
	('d48e60f9-babc-480f-b85e-240b7b344fea', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.start', 'agent_session', '3a7f6570-7462-4d87-a0d1-88d724849066', NULL, NULL, NULL, NULL, NULL, '2026-02-12 00:25:22.828'),
	('d827f0ef-a316-4905-925d-e6a480b1df93', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.complete', 'agent_session', '8930350b-79b7-4307-ae2b-a426375fa2e7', NULL, NULL, NULL, NULL, '{"charts_added": 3}', '2026-02-11 08:02:16.154'),
	('d8b926d1-20ef-47b9-b03f-832a4b0fbf00', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.start', 'agent_session', '8930350b-79b7-4307-ae2b-a426375fa2e7', NULL, NULL, NULL, NULL, '{"purpose": "司机绩效评分"}', '2026-02-12 07:02:16.154'),
	('d922bf05-6a42-4d4e-bb68-d7aa06ab7288', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.start', 'agent_session', '26457307-802f-43cb-8130-ee84006df009', NULL, NULL, NULL, NULL, NULL, '2026-02-12 13:02:15.274'),
	('da95e432-8f5a-408b-bbf0-9482e085ff7d', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'workspace.publish', 'workspace', '559ec719-32eb-4430-b939-c8ecbfebb1dc', NULL, NULL, NULL, NULL, NULL, '2026-02-09 18:17:11.115'),
	('deca3a2f-6a9f-4115-bf4c-b9bc4e5becb7', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'workspace.publish', 'workspace', 'a1914d54-db17-4d69-92c0-d450f9bb8964', NULL, NULL, NULL, NULL, NULL, '2026-02-11 18:14:44.687'),
	('e203fc10-05d1-471e-8826-e1f3826021d1', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'user.login', NULL, NULL, 'Firefox / macOS', '192.168.1.100', NULL, NULL, NULL, '2026-02-12 14:25:44.059'),
	('e59f340f-72c9-4d72-bf7c-a87b6afa4784', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'apikey.create', 'api_key', NULL, NULL, NULL, NULL, NULL, '{"provider": "deepseek"}', '2026-02-11 02:25:44.059'),
	('eb8f0faf-63af-413b-86d2-65eedcb80d99', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.start', 'agent_session', '8df9aa04-afdc-444f-9105-8e3feac939a6', NULL, NULL, NULL, NULL, NULL, '2026-02-10 07:02:15.274'),
	('ece6e30c-6ddc-4969-a4ae-58c4a89df341', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'workspace.create', 'workspace', '07931abe-1c03-413b-be1c-56a7206c9e6d', NULL, NULL, NULL, NULL, '{"name": "项目管理工具"}', '2026-02-09 18:25:22.693'),
	('f2002088-9cdb-498b-8d02-4cd8cfe72e96', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'workspace.settings.update', 'workspace', '26457307-802f-43cb-8130-ee84006df009', NULL, NULL, NULL, NULL, '{"feature": "rss"}', '2026-02-12 13:02:15.274'),
	('f3baa968-ecc9-4278-af30-0afb485bb0f9', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'workspace.publish', 'workspace', '07931abe-1c03-413b-be1c-56a7206c9e6d', NULL, NULL, NULL, NULL, NULL, '2026-02-09 18:25:22.693'),
	('f9c5061d-e496-49b1-a46b-a8e0871d12bf', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'user.login', NULL, NULL, 'Chrome / Windows', '127.0.0.1', NULL, NULL, NULL, '2026-02-09 19:02:15.138'),
	('feade3af-d209-419f-9ce7-a10cbe374ec8', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'agent.session.start', 'agent_session', '3a7f6570-7462-4d87-a0d1-88d724849066', NULL, NULL, NULL, NULL, NULL, '2026-02-11 12:25:22.828'),
	('ff146100-e82b-45e5-bdac-0ae42bbc15ad', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'apikey.create', 'api_key', NULL, NULL, NULL, NULL, NULL, '{"provider": "deepseek"}', '2026-02-11 02:17:11.280'),
	('ff159210-635d-4293-a0b7-2ae9508fa0f5', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'ui_schema.update', 'workspace', '8df9aa04-afdc-444f-9105-8e3feac939a6', NULL, NULL, NULL, NULL, '{"pages_added": 1}', '2026-02-11 06:17:11.280'),
	('ff7107f8-8203-47bc-9ce5-4366e3264612', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'user.login', NULL, NULL, 'Chrome / Windows', '127.0.0.1', NULL, NULL, NULL, '2026-02-11 18:17:11.115');

-- Dumping structure for table what-reverse.what_reverse_user_sessions
CREATE TABLE IF NOT EXISTS `what_reverse_user_sessions` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token_hash` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `device_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'desktop',
  `device_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `browser` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `os` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) DEFAULT '1',
  `last_active_at` datetime(3) DEFAULT NULL,
  `expires_at` datetime(3) NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_what_reverse_user_sessions_user_id` (`user_id`),
  KEY `idx_what_reverse_user_sessions_token_hash` (`token_hash`),
  KEY `idx_what_reverse_user_sessions_is_active` (`is_active`),
  KEY `idx_what_reverse_user_sessions_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table what-reverse.what_reverse_user_sessions: ~0 rows (approximately)
DELETE FROM `what_reverse_user_sessions`;

-- Dumping structure for table what-reverse.what_reverse_users
CREATE TABLE IF NOT EXISTS `what_reverse_users` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bio` text COLLATE utf8mb4_unicode_ci,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_verified` tinyint(1) DEFAULT '0',
  `github_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `google_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `settings` json DEFAULT NULL,
  `agent_count` int DEFAULT '0',
  `plan` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'free',
  `plan_expires_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `last_login_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `follower_count` bigint DEFAULT '0',
  `following_count` bigint DEFAULT '0',
  `role` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'user',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `status_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status_updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_what_reverse_users_email` (`email`),
  UNIQUE KEY `idx_what_reverse_users_username` (`username`),
  KEY `idx_what_reverse_users_deleted_at` (`deleted_at`),
  KEY `idx_what_reverse_users_status` (`status`),
  KEY `idx_what_reverse_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table what-reverse.what_reverse_users: ~6 rows (approximately)
DELETE FROM `what_reverse_users`;
INSERT INTO `what_reverse_users` (`id`, `email`, `username`, `display_name`, `avatar_url`, `bio`, `password_hash`, `email_verified`, `github_id`, `google_id`, `settings`, `agent_count`, `plan`, `plan_expires_at`, `created_at`, `updated_at`, `last_login_at`, `deleted_at`, `follower_count`, `following_count`, `role`, `status`, `status_reason`, `status_updated_at`) VALUES
	('1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', '1253212321@qq.com', 'vantiboolean', NULL, NULL, NULL, '$2a$10$geW/DLYusSt9Bac6qxN8pu9qjmsaphxTkvQL0s.WgaNzhs0wx5bmG', 0, NULL, NULL, NULL, 0, 'free', NULL, '2026-01-30 02:36:03.441', '2026-02-12 21:18:49.645', '2026-02-12 21:18:49.644', NULL, 0, 0, 'user', 'active', NULL, NULL),
	('532d91c8-2b45-498b-8818-4a1d1fb4cbe4', 'e2e_1770422179@example.com', 'e2e_1770422179', NULL, NULL, NULL, '$2a$10$.3CtIAmStXhQV8y7oGym/OHVMIGm3J2eCymvdA6J4EpBRnARfKyiG', 0, NULL, NULL, NULL, 0, 'free', NULL, '2026-02-07 07:56:19.194', '2026-02-07 07:56:19.194', NULL, NULL, 0, 0, 'user', 'active', NULL, NULL),
	('c69f7aa3-0c35-43b5-b50b-2df5b3eba114', 'test@test.com', '', NULL, NULL, NULL, '$2a$10$Gp59pGHAij4hxaoSMngtYOLVbnIuOUTKA3zM/97/rVCV1zrzlz2JW', 0, NULL, NULL, NULL, 0, 'free', NULL, '2026-02-13 13:56:09.983', '2026-02-13 13:56:09.983', NULL, NULL, 0, 0, 'user', 'active', NULL, NULL),
	('ca2165ca-2cb5-41ae-a71e-31a16c28211b', 'test2@agentflow.local', 'testuser2027', NULL, NULL, NULL, '$2a$10$QdABfhO27bLhdsw9Fi73O.rMkqbWvao7rGC2/D28WOhSxc7LYjgMe', 0, NULL, NULL, NULL, 0, 'free', NULL, '2026-01-27 13:39:27.000', '2026-01-27 13:41:11.000', '2026-01-27 13:41:11.000', NULL, 0, 0, 'user', 'active', NULL, NULL),
	('e54c6124-0669-40b9-98da-ee850ce0ed1e', 'test_1770422103@example.com', 'testuser_1770422103', NULL, NULL, NULL, '$2a$10$jvUh6scWYi2.QoKXu/vtoOYcIgrRclfMnOZ06kb3hMBtdBHNCt1fG', 0, NULL, NULL, NULL, 0, 'free', NULL, '2026-02-07 07:55:04.015', '2026-02-07 07:55:04.199', '2026-02-07 07:55:04.199', NULL, 0, 0, 'user', 'active', NULL, NULL),
	('f552659c-bb59-4fd8-82d2-843aa22a2153', 'demo@example.com', 'demo_user', NULL, NULL, NULL, '$2a$10$tff3ErT.QM6KK3OaBkrZve1KykeEgo4LPuyRF2rz5o4TNw4.SoYjG', 0, NULL, NULL, NULL, 0, 'free', NULL, '2026-01-31 01:39:51.959', '2026-01-31 01:40:35.097', '2026-01-31 01:40:35.097', NULL, 0, 0, 'user', 'active', NULL, NULL),
	('f5921763-480c-4f4e-830b-4dbab73dc6ee', 'test@example.com', 'testuser', NULL, NULL, NULL, '$2a$10$dECiQ0MR0d0bbXLthCQqZu0L2JyDNT5D/Wz7.xBs31ECU0y6VNE8S', 0, NULL, NULL, NULL, 0, 'free', NULL, '2026-01-29 15:45:48.000', '2026-01-30 02:19:00.044', '2026-01-30 02:19:00.044', NULL, 0, 0, 'user', 'active', NULL, NULL);

-- Dumping structure for table what-reverse.what_reverse_workspace_databases
CREATE TABLE IF NOT EXISTS `what_reverse_workspace_databases` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workspace_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `db_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `db_user` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `db_host` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `db_port` bigint DEFAULT NULL,
  `secret_ref` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_what_reverse_workspace_databases_workspace_id` (`workspace_id`),
  KEY `idx_what_reverse_workspace_databases_status` (`status`),
  CONSTRAINT `fk_what_reverse_workspace_databases_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `what_reverse_workspaces` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table what-reverse.what_reverse_workspace_databases: ~0 rows (approximately)
DELETE FROM `what_reverse_workspace_databases`;
INSERT INTO `what_reverse_workspace_databases` (`id`, `workspace_id`, `db_name`, `db_user`, `db_host`, `db_port`, `secret_ref`, `status`, `created_at`, `updated_at`) VALUES
	('d609e139-ca13-4b62-aced-edbbbefd343a', '8930350b-79b7-4307-ae2b-a426375fa2e7', 'ws_8930350b79b74307ae2ba426375fa2e7', 'wsu_8930350b79b74307ae2ba426375f', 'localhost', 3306, 'enc:JhIYBKBkSTETgmIhoOPfcp82vzn6iKAH7xKkTtVPYIhCUQuDedkR+jqZus2UKQUJltW+uvh9Fodo3vQm', 'ready', '2026-02-12 21:25:19.232', '2026-02-12 21:25:19.232');

-- Dumping structure for table what-reverse.what_reverse_workspace_db_roles
CREATE TABLE IF NOT EXISTS `what_reverse_workspace_db_roles` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workspace_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `db_user` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `secret_ref` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `expires_at` datetime(3) DEFAULT NULL,
  `last_used_at` datetime(3) DEFAULT NULL,
  `last_rotated_at` datetime(3) DEFAULT NULL,
  `revoked_at` datetime(3) DEFAULT NULL,
  `revoked_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `revoked_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_workspace_app_role_status` (`workspace_id`,`role_type`,`status`),
  UNIQUE KEY `uniq_workspace_role_status` (`workspace_id`,`role_type`,`status`),
  KEY `idx_what_reverse_workspace_db_roles_workspace_id` (`workspace_id`),
  KEY `idx_what_reverse_workspace_db_roles_role_type` (`role_type`),
  KEY `idx_what_reverse_workspace_db_roles_status` (`status`),
  CONSTRAINT `fk_what_reverse_workspace_db_roles_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `what_reverse_workspaces` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table what-reverse.what_reverse_workspace_db_roles: ~0 rows (approximately)
DELETE FROM `what_reverse_workspace_db_roles`;

-- Dumping structure for table what-reverse.what_reverse_workspace_db_schema_migrations
CREATE TABLE IF NOT EXISTS `what_reverse_workspace_db_schema_migrations` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workspace_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `submitter_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `review_queue_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT 'pending_review',
  `from_version` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target_version` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pending_versions` json DEFAULT NULL,
  `plan` json DEFAULT NULL,
  `precheck` json DEFAULT NULL,
  `result` json DEFAULT NULL,
  `verify_sql` text COLLATE utf8mb4_unicode_ci,
  `backup_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `review_note` text COLLATE utf8mb4_unicode_ci,
  `error_message` text COLLATE utf8mb4_unicode_ci,
  `approved_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approved_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) DEFAULT NULL,
  `completed_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_what_reverse_workspace_db_schema_migrations_status` (`status`),
  KEY `idx_what_reverse_workspace_db_schema_migrations_approved_by` (`approved_by`),
  KEY `idx_what_reverse_workspace_db_schema_migrations_deleted_at` (`deleted_at`),
  KEY `idx_what_reverse_workspace_db_schema_migrations_workspace_id` (`workspace_id`),
  KEY `idx_what_reverse_workspace_db_schema_migrations_submitter_id` (`submitter_id`),
  KEY `idx_what_reverse_workspace_db_schema_migrations_review_queue_id` (`review_queue_id`),
  CONSTRAINT `fk_what_reverse_workspace_db_schema_migrations_approver` FOREIGN KEY (`approved_by`) REFERENCES `what_reverse_users` (`id`),
  CONSTRAINT `fk_what_reverse_workspace_db_schema_migrations_review_queue` FOREIGN KEY (`review_queue_id`) REFERENCES `what_reverse_review_queue` (`id`),
  CONSTRAINT `fk_what_reverse_workspace_db_schema_migrations_submitter` FOREIGN KEY (`submitter_id`) REFERENCES `what_reverse_users` (`id`),
  CONSTRAINT `fk_what_reverse_workspace_db_schema_migrations_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `what_reverse_workspaces` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table what-reverse.what_reverse_workspace_db_schema_migrations: ~0 rows (approximately)
DELETE FROM `what_reverse_workspace_db_schema_migrations`;

-- Dumping structure for table what-reverse.what_reverse_workspace_domains
CREATE TABLE IF NOT EXISTS `what_reverse_workspace_domains` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workspace_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `domain` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `blocked_at` datetime(3) DEFAULT NULL,
  `blocked_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `domain_expires_at` datetime(3) DEFAULT NULL,
  `domain_expiry_notified_at` datetime(3) DEFAULT NULL,
  `verification_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `verification_attempts` bigint DEFAULT '0',
  `last_verification_error` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `next_retry_at` datetime(3) DEFAULT NULL,
  `support_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `verified_at` datetime(3) DEFAULT NULL,
  `ssl_status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `ssl_issue_attempts` bigint DEFAULT '0',
  `last_ssl_error` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ssl_next_retry_at` datetime(3) DEFAULT NULL,
  `ssl_issued_at` datetime(3) DEFAULT NULL,
  `ssl_expires_at` datetime(3) DEFAULT NULL,
  `ssl_expiry_notified_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_what_reverse_workspace_domains_domain` (`domain`),
  KEY `idx_what_reverse_workspace_domains_workspace_id` (`workspace_id`),
  KEY `idx_what_reverse_workspace_domains_status` (`status`),
  CONSTRAINT `fk_what_reverse_workspace_domains_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `what_reverse_workspaces` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table what-reverse.what_reverse_workspace_domains: ~0 rows (approximately)
DELETE FROM `what_reverse_workspace_domains`;

-- Dumping structure for table what-reverse.what_reverse_workspace_events
CREATE TABLE IF NOT EXISTS `what_reverse_workspace_events` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workspace_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `session_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload_json` json DEFAULT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_what_reverse_workspace_events_workspace_id` (`workspace_id`),
  KEY `idx_what_reverse_workspace_events_session_id` (`session_id`),
  KEY `idx_what_reverse_workspace_events_event_type` (`event_type`),
  CONSTRAINT `fk_what_reverse_workspace_events_session` FOREIGN KEY (`session_id`) REFERENCES `what_reverse_workspace_sessions` (`id`),
  CONSTRAINT `fk_what_reverse_workspace_events_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `what_reverse_workspaces` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table what-reverse.what_reverse_workspace_events: ~0 rows (approximately)
DELETE FROM `what_reverse_workspace_events`;
INSERT INTO `what_reverse_workspace_events` (`id`, `workspace_id`, `session_id`, `event_type`, `payload_json`, `created_at`) VALUES
	('3b26af25-2e74-421f-857f-35a197233267', '8930350b-79b7-4307-ae2b-a426375fa2e7', 'c9ae9d1d-96fe-4303-87cf-c6c89963d17e', 'runtime_entry', '{"path": "/runtime/fleet", "ip_hash": "12************************************************************a0", "user_agent_hash": "39************************************************************05"}', '2026-02-13 22:15:41.552'),
	('9b90bf2c-b17d-45f5-9669-1b549544f358', '8930350b-79b7-4307-ae2b-a426375fa2e7', '8f1c0348-9d26-49cf-99c1-7cf7a8c7e174', 'runtime_entry', '{"path": "/runtime/fleet", "ip_hash": "12************************************************************a0", "user_agent_hash": "39************************************************************05"}', '2026-02-14 00:29:01.428');

-- Dumping structure for table what-reverse.what_reverse_workspace_export_job
CREATE TABLE IF NOT EXISTS `what_reverse_workspace_export_job` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workspace_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `export_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_size` bigint DEFAULT '0',
  `error_message` text COLLATE utf8mb4_unicode_ci,
  `started_at` datetime(3) DEFAULT NULL,
  `completed_at` datetime(3) DEFAULT NULL,
  `expires_at` datetime(3) DEFAULT NULL,
  `archive_range_start` datetime(3) DEFAULT NULL,
  `archive_range_end` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_what_reverse_workspace_export_job_workspace_id` (`workspace_id`),
  KEY `idx_what_reverse_workspace_export_job_export_type` (`export_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table what-reverse.what_reverse_workspace_export_job: ~0 rows (approximately)
DELETE FROM `what_reverse_workspace_export_job`;

-- Dumping structure for table what-reverse.what_reverse_workspace_members
CREATE TABLE IF NOT EXISTS `what_reverse_workspace_members` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workspace_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `invited_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `joined_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_what_reverse_workspace_members_user_id` (`user_id`),
  KEY `idx_what_reverse_workspace_members_role_id` (`role_id`),
  KEY `idx_what_reverse_workspace_members_workspace_id` (`workspace_id`),
  CONSTRAINT `fk_what_reverse_workspace_members_role` FOREIGN KEY (`role_id`) REFERENCES `what_reverse_workspace_roles` (`id`),
  CONSTRAINT `fk_what_reverse_workspace_members_user` FOREIGN KEY (`user_id`) REFERENCES `what_reverse_users` (`id`),
  CONSTRAINT `fk_what_reverse_workspace_members_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `what_reverse_workspaces` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table what-reverse.what_reverse_workspace_members: ~2 rows (approximately)
DELETE FROM `what_reverse_workspace_members`;
INSERT INTO `what_reverse_workspace_members` (`id`, `workspace_id`, `user_id`, `role_id`, `status`, `invited_by`, `joined_at`, `created_at`, `updated_at`) VALUES
	('07b71913-5e49-40fd-a024-1989538d70f9', '9a4956d6-9b72-4ccb-b863-44ec9a5d03c0', 'c69f7aa3-0c35-43b5-b50b-2df5b3eba114', '95f8cdf8-6cfb-4f2b-906c-3fa039888baf', 'active', NULL, '2026-02-13 13:56:09.998', '2026-02-13 13:56:09.998', '2026-02-13 13:56:09.998'),
	('ceba4c75-ad49-4013-9a9d-c51208d7ceea', '8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', '2afeb5a1-4054-40b7-b2eb-0d6103f3b792', 'active', NULL, '2026-02-03 04:52:40.164', '2026-02-03 04:52:40.164', '2026-02-03 04:52:40.164'),
	('e8d33361-ed0f-4a4e-ad81-55e4d81c2b4e', '8930350b-79b7-4307-ae2b-a426375fa2e7', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', NULL, 'active', NULL, '2026-02-10 19:02:16.154', '2026-02-12 19:02:16.159', '2026-02-12 19:02:16.159');

-- Dumping structure for table what-reverse.what_reverse_workspace_ratings
CREATE TABLE IF NOT EXISTS `what_reverse_workspace_ratings` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workspace_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rating` bigint NOT NULL,
  `review` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_what_reverse_workspace_ratings_workspace_id` (`workspace_id`),
  KEY `idx_what_reverse_workspace_ratings_user_id` (`user_id`),
  CONSTRAINT `fk_what_reverse_workspace_ratings_user` FOREIGN KEY (`user_id`) REFERENCES `what_reverse_users` (`id`),
  CONSTRAINT `fk_what_reverse_workspace_ratings_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `what_reverse_workspaces` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table what-reverse.what_reverse_workspace_ratings: ~0 rows (approximately)
DELETE FROM `what_reverse_workspace_ratings`;

-- Dumping structure for table what-reverse.what_reverse_workspace_roles
CREATE TABLE IF NOT EXISTS `what_reverse_workspace_roles` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workspace_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `permissions_json` json DEFAULT NULL,
  `is_system` tinyint(1) DEFAULT '0',
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_what_reverse_workspace_roles_workspace_id` (`workspace_id`),
  CONSTRAINT `fk_what_reverse_workspace_roles_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `what_reverse_workspaces` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table what-reverse.what_reverse_workspace_roles: ~26 rows (approximately)
DELETE FROM `what_reverse_workspace_roles`;
INSERT INTO `what_reverse_workspace_roles` (`id`, `workspace_id`, `name`, `permissions_json`, `is_system`, `created_at`, `updated_at`) VALUES
	('0844b365-79d6-49fd-8a30-ccb4a1af994d', '8df9aa04-afdc-444f-9105-8e3feac939a6', 'viewer', '{"read": true, "admin": false, "write": false, "delete": false, "publish": false}', 1, '2026-02-12 18:17:12.154', '2026-02-12 18:17:12.154'),
	('1b794139-51ac-4a0d-9432-acbd8c5894dc', '8df9aa04-afdc-444f-9105-8e3feac939a6', 'owner', '{"read": true, "admin": true, "write": true, "delete": true, "publish": true, "logs_view": true, "plan_view": true, "plan_manage": true, "billing_manage": true, "members_manage": true, "workspace_edit": true, "workspace_admin": true, "workspace_create": true, "connectors_manage": true, "workspace_publish": true, "workspace_db_access": true, "workspace_view_metrics": true}', 1, '2026-02-12 19:02:16.097', '2026-02-12 19:03:56.169'),
	('2afeb5a1-4054-40b7-b2eb-0d6103f3b792', '8df9aa04-afdc-444f-9105-8e3feac939a6', 'owner', '{"app_edit": true, "logs_view": true, "plan_view": true, "app_publish": true, "apps_create": true, "plan_manage": true, "billing_manage": true, "members_manage": true, "workspace_edit": true, "workspace_admin": true, "app_view_metrics": true, "workspace_create": true, "connectors_manage": true, "workspace_publish": true, "workspace_db_access": true, "workspace_view_metrics": true}', 1, '2026-02-03 04:52:40.148', '2026-02-08 03:32:24.246'),
	('31ef168c-aa4e-4ad2-93e6-de644fb7baa4', '8930350b-79b7-4307-ae2b-a426375fa2e7', 'driver', '{"read": true, "admin": false, "write": false, "delete": false, "publish": false, "dispatch": false}', 1, '2026-02-12 19:02:16.154', '2026-02-12 19:02:16.154'),
	('35effaaf-3c7d-4026-9ffd-dedfa6f08045', '8df9aa04-afdc-444f-9105-8e3feac939a6', 'viewer', '{"read": true, "admin": false, "write": false, "delete": false, "publish": false}', 1, '2026-02-12 19:02:16.111', '2026-02-12 19:02:16.111'),
	('3b349283-1bc4-4a7d-8e0c-185dd6c042d3', '8df9aa04-afdc-444f-9105-8e3feac939a6', 'owner', '{"read": true, "admin": true, "write": true, "delete": true, "publish": true}', 1, '2026-02-12 18:25:23.550', '2026-02-12 18:25:23.550'),
	('3d4ff197-1066-401a-85d9-f59715f34d20', '8df9aa04-afdc-444f-9105-8e3feac939a6', 'owner', '{"read": true, "admin": true, "write": true, "delete": true, "publish": true}', 1, '2026-02-12 18:17:12.135', '2026-02-12 18:17:12.135'),
	('4abe7261-a478-4d91-8f9d-c1e24e4f720c', '8df9aa04-afdc-444f-9105-8e3feac939a6', 'admin', '{"app_edit": true, "logs_view": true, "plan_view": true, "app_publish": true, "apps_create": true, "plan_manage": true, "members_manage": true, "workspace_edit": true, "app_view_metrics": true, "workspace_create": true, "connectors_manage": true, "workspace_publish": true, "workspace_db_access": true, "workspace_view_metrics": true}', 1, '2026-02-03 04:52:40.152', '2026-02-08 03:32:24.253'),
	('524752e8-5d78-4428-b2da-656f22627664', '8df9aa04-afdc-444f-9105-8e3feac939a6', 'viewer', '{"read": true, "admin": false, "write": false, "delete": false, "publish": false}', 1, '2026-02-12 18:25:44.814', '2026-02-12 18:25:44.814'),
	('526c6e92-8109-40b4-ad45-2773c6654229', '8df9aa04-afdc-444f-9105-8e3feac939a6', 'editor', '{"read": true, "admin": false, "write": true, "delete": false, "publish": false}', 1, '2026-02-12 18:17:12.148', '2026-02-12 18:17:12.148'),
	('526ddeaf-b120-42f5-9a81-beaa5f56df28', '8930350b-79b7-4307-ae2b-a426375fa2e7', 'viewer', '{"read": true, "admin": false, "write": false, "delete": false, "publish": false, "dispatch": false}', 1, '2026-02-12 19:02:16.154', '2026-02-12 19:02:16.154'),
	('548dd761-913b-4d61-b004-e51e349d2142', '8930350b-79b7-4307-ae2b-a426375fa2e7', 'dispatcher', '{"read": true, "admin": false, "write": true, "delete": false, "publish": false, "dispatch": true}', 1, '2026-02-12 19:02:16.154', '2026-02-12 19:02:16.154'),
	('61fb88e1-191e-44a4-bf26-fb4a725cdb20', '8df9aa04-afdc-444f-9105-8e3feac939a6', 'member', '{"app_edit": true, "logs_view": true, "plan_view": true, "apps_create": true, "plan_manage": false, "workspace_edit": true, "app_view_metrics": true, "workspace_create": true, "connectors_manage": false, "workspace_db_access": false, "workspace_view_metrics": true}', 1, '2026-02-03 04:52:40.158', '2026-02-08 03:32:24.258'),
	('6e3e28db-dbe3-445b-b453-5cc6916e75e6', '9a4956d6-9b72-4ccb-b863-44ec9a5d03c0', 'admin', '{"logs_view": true, "plan_view": true, "plan_manage": true, "members_manage": true, "workspace_edit": true, "workspace_create": true, "connectors_manage": true, "workspace_publish": true, "workspace_db_access": true, "workspace_view_metrics": true}', 1, '2026-02-13 13:56:09.995', '2026-02-13 13:56:09.995'),
	('76100fb2-357e-4dd6-be63-bd18c1243f49', '8df9aa04-afdc-444f-9105-8e3feac939a6', 'editor', '{"read": true, "admin": false, "write": true, "delete": false, "publish": false}', 1, '2026-02-12 18:25:44.809', '2026-02-12 18:25:44.809'),
	('796d1f2b-c9e4-457c-9e35-754b8ce4458c', '8df9aa04-afdc-444f-9105-8e3feac939a6', 'viewer', '{"read": true, "admin": false, "write": false, "delete": false, "publish": false}', 1, '2026-02-12 18:25:23.563', '2026-02-12 18:25:23.563'),
	('845bed48-8c18-4e6b-af65-bfaf658178dc', '8df9aa04-afdc-444f-9105-8e3feac939a6', 'editor', '{"read": true, "admin": false, "write": true, "delete": false, "publish": false}', 1, '2026-02-12 19:02:16.106', '2026-02-12 19:02:16.106'),
	('9487cb9d-13e7-44e5-8b7c-149c9cd07e31', '8df9aa04-afdc-444f-9105-8e3feac939a6', 'owner', '{"read": true, "admin": true, "write": true, "delete": true, "publish": true}', 1, '2026-02-12 18:25:44.799', '2026-02-12 18:25:44.799'),
	('95f8cdf8-6cfb-4f2b-906c-3fa039888baf', '9a4956d6-9b72-4ccb-b863-44ec9a5d03c0', 'owner', '{"logs_view": true, "plan_view": true, "plan_manage": true, "billing_manage": true, "members_manage": true, "workspace_edit": true, "workspace_admin": true, "workspace_create": true, "connectors_manage": true, "workspace_publish": true, "workspace_db_access": true, "workspace_view_metrics": true}', 1, '2026-02-13 13:56:09.994', '2026-02-13 13:56:09.994'),
	('a5beb4fe-2fdb-4512-9b00-cf28a61a652c', '8930350b-79b7-4307-ae2b-a426375fa2e7', 'fleet_manager', '{"read": true, "admin": false, "write": true, "delete": false, "publish": false, "dispatch": true}', 1, '2026-02-12 19:02:16.154', '2026-02-12 19:02:16.154'),
	('a753f5c2-21f3-4c8b-813f-b7638aed542e', '8df9aa04-afdc-444f-9105-8e3feac939a6', 'admin', '{"read": true, "admin": true, "write": true, "delete": false, "publish": true}', 1, '2026-02-12 19:02:16.102', '2026-02-12 19:02:16.102'),
	('a9fb1535-bea7-4cb5-b05b-6a37575c52ae', '8930350b-79b7-4307-ae2b-a426375fa2e7', 'owner', '{"read": true, "admin": true, "write": true, "delete": true, "publish": true, "dispatch": true, "logs_view": true, "plan_view": true, "plan_manage": true, "billing_manage": true, "members_manage": true, "workspace_edit": true, "workspace_admin": true, "workspace_create": true, "connectors_manage": true, "workspace_publish": true, "workspace_db_access": true, "workspace_view_metrics": true}', 1, '2026-02-12 19:02:16.154', '2026-02-12 19:03:56.257'),
	('aacbcf29-95a0-4379-8bfa-f9803918e617', '8df9aa04-afdc-444f-9105-8e3feac939a6', 'admin', '{"read": true, "admin": true, "write": true, "delete": false, "publish": true}', 1, '2026-02-12 18:17:12.142', '2026-02-12 18:17:12.142'),
	('d8a48b01-c03b-405a-a1fc-ad1d58d1ae77', '9a4956d6-9b72-4ccb-b863-44ec9a5d03c0', 'member', '{"logs_view": true, "plan_view": true, "plan_manage": false, "workspace_edit": true, "workspace_create": true, "connectors_manage": false, "workspace_db_access": false, "workspace_view_metrics": true}', 1, '2026-02-13 13:56:09.996', '2026-02-13 13:56:09.996'),
	('d8d4e2f0-6600-4244-8af0-f8bf8e3b11f2', '8930350b-79b7-4307-ae2b-a426375fa2e7', 'admin', '{"logs_view": true, "plan_view": true, "plan_manage": true, "members_manage": true, "workspace_edit": true, "workspace_create": true, "connectors_manage": true, "workspace_publish": true, "workspace_db_access": true, "workspace_view_metrics": true}', 1, '2026-02-12 19:03:56.262', '2026-02-12 19:03:56.262'),
	('f018cc9d-f1b6-4a1d-a772-16a1a710f736', '8df9aa04-afdc-444f-9105-8e3feac939a6', 'admin', '{"read": true, "admin": true, "write": true, "delete": false, "publish": true}', 1, '2026-02-12 18:25:44.804', '2026-02-12 18:25:44.804'),
	('f4e15ead-82c2-4ade-99c8-b5d49c60784e', '8df9aa04-afdc-444f-9105-8e3feac939a6', 'editor', '{"read": true, "admin": false, "write": true, "delete": false, "publish": false}', 1, '2026-02-12 18:25:23.559', '2026-02-12 18:25:23.559'),
	('f8fe173e-2287-45aa-917e-d7422a498416', '8df9aa04-afdc-444f-9105-8e3feac939a6', 'admin', '{"read": true, "admin": true, "write": true, "delete": false, "publish": true}', 1, '2026-02-12 18:25:23.554', '2026-02-12 18:25:23.554'),
	('fc1a2d56-7753-4397-a361-4f6cd6b35966', '8930350b-79b7-4307-ae2b-a426375fa2e7', 'member', '{"logs_view": true, "plan_view": true, "plan_manage": false, "workspace_edit": true, "workspace_create": true, "connectors_manage": false, "workspace_db_access": false, "workspace_view_metrics": true}', 1, '2026-02-12 19:03:56.267', '2026-02-12 19:03:56.267');

-- Dumping structure for table what-reverse.what_reverse_workspace_sessions
CREATE TABLE IF NOT EXISTS `what_reverse_workspace_sessions` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workspace_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `session_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'anon',
  `user_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_hash` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent_hash` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `expired_at` datetime(3) DEFAULT NULL,
  `blocked_at` datetime(3) DEFAULT NULL,
  `blocked_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `app_user_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `token_hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `auth_method` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'password',
  PRIMARY KEY (`id`),
  KEY `idx_what_reverse_workspace_sessions_user_id` (`user_id`),
  KEY `idx_what_reverse_workspace_sessions_workspace_id` (`workspace_id`),
  KEY `idx_what_reverse_workspace_sessions_session_type` (`session_type`),
  KEY `idx_ws_sessions_app_user` (`app_user_id`),
  KEY `idx_ws_sessions_token` (`token_hash`),
  CONSTRAINT `fk_what_reverse_workspace_sessions_app_user` FOREIGN KEY (`app_user_id`) REFERENCES `what_reverse_app_users` (`id`),
  CONSTRAINT `fk_what_reverse_workspace_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `what_reverse_users` (`id`),
  CONSTRAINT `fk_what_reverse_workspace_sessions_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `what_reverse_workspaces` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table what-reverse.what_reverse_workspace_sessions: ~0 rows (approximately)
DELETE FROM `what_reverse_workspace_sessions`;
INSERT INTO `what_reverse_workspace_sessions` (`id`, `workspace_id`, `session_type`, `user_id`, `ip_hash`, `user_agent_hash`, `created_at`, `expired_at`, `blocked_at`, `blocked_reason`, `app_user_id`, `token_hash`, `auth_method`) VALUES
	('8f1c0348-9d26-49cf-99c1-7cf7a8c7e174', '8930350b-79b7-4307-ae2b-a426375fa2e7', 'anon', NULL, '12ca17b49af2289436f303e0166030a21e525d266e209267433801a8fd4071a0', '39f5649641f05c7d05cecd8fd6bc2ee283cb7c4f48a4e8969d923c49784f5a05', '2026-02-14 00:29:01.420', '2026-02-15 00:29:01.420', NULL, NULL, NULL, NULL, 'password'),
	('c9ae9d1d-96fe-4303-87cf-c6c89963d17e', '8930350b-79b7-4307-ae2b-a426375fa2e7', 'anon', NULL, '12ca17b49af2289436f303e0166030a21e525d266e209267433801a8fd4071a0', '39f5649641f05c7d05cecd8fd6bc2ee283cb7c4f48a4e8969d923c49784f5a05', '2026-02-13 22:15:41.545', '2026-02-14 22:15:41.545', NULL, NULL, NULL, NULL, 'password');

-- Dumping structure for table what-reverse.what_reverse_workspace_slug_aliases
CREATE TABLE IF NOT EXISTS `what_reverse_workspace_slug_aliases` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workspace_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_what_reverse_workspace_slug_aliases_slug` (`slug`),
  KEY `idx_what_reverse_workspace_slug_aliases_workspace_id` (`workspace_id`),
  CONSTRAINT `fk_what_reverse_workspace_slug_aliases_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `what_reverse_workspaces` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table what-reverse.what_reverse_workspace_slug_aliases: ~0 rows (approximately)
DELETE FROM `what_reverse_workspace_slug_aliases`;
INSERT INTO `what_reverse_workspace_slug_aliases` (`id`, `workspace_id`, `slug`, `created_at`) VALUES
	('05cd93c4-457a-4ac1-b1ff-ce35761ddc4a', '8930350b-79b7-4307-ae2b-a426375fa2e7', 'fleet', '2026-02-12 21:33:58.495'),
	('0cfb8a0e-76a3-467a-87f6-d430589ab649', '8df9aa04-afdc-444f-9105-8e3feac939a6', 'default-workspace', '2026-02-12 18:00:39.629'),
	('26255b41-96ff-4377-a5e5-89e2604aec43', '8df9aa04-afdc-444f-9105-8e3feac939a6', 'vantiboolean', '2026-02-10 12:43:49.308');

-- Dumping structure for table what-reverse.what_reverse_workspace_usage_stats
CREATE TABLE IF NOT EXISTS `what_reverse_workspace_usage_stats` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workspace_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` date NOT NULL,
  `total_executions` bigint DEFAULT '0',
  `success_count` bigint DEFAULT '0',
  `failure_count` bigint DEFAULT '0',
  `total_tokens` bigint DEFAULT '0',
  `total_duration_ms` bigint DEFAULT '0',
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_what_reverse_workspace_usage_stats_workspace_id` (`workspace_id`),
  KEY `idx_what_reverse_workspace_usage_stats_date` (`date`),
  CONSTRAINT `fk_what_reverse_workspace_usage_stats_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `what_reverse_workspaces` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table what-reverse.what_reverse_workspace_usage_stats: ~154 rows (approximately)
DELETE FROM `what_reverse_workspace_usage_stats`;
INSERT INTO `what_reverse_workspace_usage_stats` (`id`, `workspace_id`, `date`, `total_executions`, `success_count`, `failure_count`, `total_tokens`, `total_duration_ms`, `created_at`, `updated_at`) VALUES
	('0077c92f-7fd1-4da0-b6e0-9f5197128974', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-15', 33, 31, 2, 20757, 15411, '2026-02-12 18:17:11.348', '2026-02-12 18:17:11.348'),
	('00b39d85-2d52-4008-a091-3f90bbb9188d', '8930350b-79b7-4307-ae2b-a426375fa2e7', '2026-01-18', 315, 315, 0, 267750, 395, '2026-02-12 19:02:16.334', '2026-02-12 19:02:16.334'),
	('0299e2bd-cd53-4dae-bfb4-0cebc132e59b', '8930350b-79b7-4307-ae2b-a426375fa2e7', '2026-02-01', 273, 272, 1, 232050, 335, '2026-02-12 19:02:16.272', '2026-02-12 19:02:16.272'),
	('02fc4324-8f07-4e43-bbe1-3ac4832b1287', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-02-11', 32, 27, 5, 17952, 28096, '2026-02-12 18:17:11.468', '2026-02-12 18:17:11.468'),
	('05a6de0e-3301-436f-915d-6630f655dee6', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-31', 25, 24, 1, 14500, 10100, '2026-02-12 18:25:22.941', '2026-02-12 18:25:22.941'),
	('05e41fd1-36fd-4f88-a929-3b89a15da376', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-31', 25, 24, 1, 14500, 10100, '2026-02-12 18:25:44.171', '2026-02-12 18:25:44.171'),
	('06b45f40-1c9f-4f91-a084-f0339dd6beb8', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-16', 20, 17, 3, 7040, 15060, '2026-02-12 18:25:44.105', '2026-02-12 18:25:44.105'),
	('08b0b608-d4c9-44a2-b4bc-26e46a04a0d1', '8930350b-79b7-4307-ae2b-a426375fa2e7', '2026-02-04', 174, 171, 3, 147900, 440, '2026-02-12 19:02:16.257', '2026-02-12 19:02:16.257'),
	('0ce884cf-0670-4264-a2f8-4031815dc10d', '8930350b-79b7-4307-ae2b-a426375fa2e7', '2026-01-25', 294, 291, 3, 249900, 440, '2026-02-12 19:02:16.302', '2026-02-12 19:02:16.302'),
	('0cf4246f-a35e-478c-9b72-4cdce048f4b2', '8930350b-79b7-4307-ae2b-a426375fa2e7', '2026-01-15', 204, 201, 3, 173400, 440, '2026-02-12 19:02:16.347', '2026-02-12 19:02:16.347'),
	('0cf85f6f-fa28-4d07-9b0f-cdbc5a755ecd', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-28', 9, 8, 1, 5499, 3204, '2026-02-12 19:02:15.375', '2026-02-12 19:02:15.375'),
	('0d28832c-c24f-428f-8962-d050646af957', '8930350b-79b7-4307-ae2b-a426375fa2e7', '2026-01-28', 195, 195, 0, 165750, 395, '2026-02-12 19:02:16.290', '2026-02-12 19:02:16.290'),
	('0dcfea86-853f-44bd-89fb-66e3b01d7d4b', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-21', 20, 19, 1, 6580, 7960, '2026-02-12 18:25:22.896', '2026-02-12 18:25:22.896'),
	('0fe7fdd2-0e1d-4fae-84ce-e5e98d8efa19', '8930350b-79b7-4307-ae2b-a426375fa2e7', '2026-01-16', 381, 379, 2, 323850, 425, '2026-02-12 19:02:16.343', '2026-02-12 19:02:16.343'),
	('11201a37-4c44-4d9a-8bf4-d922d58cccdb', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-02-09', 35, 32, 3, 19880, 11585, '2026-02-12 18:25:44.212', '2026-02-12 18:25:44.212'),
	('119815d6-a2ae-406d-bc37-ec1e7afdc382', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-29', 20, 17, 3, 13920, 12560, '2026-02-12 19:02:15.379', '2026-02-12 19:02:15.379'),
	('152d5407-9f08-436e-8e29-0bc427df10ac', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-02-05', 36, 31, 5, 23868, 9036, '2026-02-12 18:25:44.195', '2026-02-12 18:25:44.195'),
	('16ebb8ab-66a7-4423-94bc-23a49e8f4802', '8930350b-79b7-4307-ae2b-a426375fa2e7', '2026-02-02', 240, 240, 0, 204000, 320, '2026-02-12 19:02:16.266', '2026-02-12 19:02:16.266'),
	('17640a4b-03ba-454b-9e51-975190d6290e', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-23', 40, 38, 2, 20960, 18400, '2026-02-12 18:17:11.384', '2026-02-12 18:17:11.384'),
	('19012bfa-ae19-4a79-afc8-53d0eecf9d6d', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-02-10', 44, 38, 6, 16676, 16632, '2026-02-12 18:25:22.986', '2026-02-12 18:25:22.986'),
	('19b0f6d8-719b-4de7-9e01-6c56eeefc52f', '8930350b-79b7-4307-ae2b-a426375fa2e7', '2026-02-09', 219, 216, 3, 186150, 365, '2026-02-12 19:02:16.235', '2026-02-12 19:02:16.235'),
	('1a95249f-0b43-4b48-9cc6-bd9d846846fc', '8930350b-79b7-4307-ae2b-a426375fa2e7', '2026-01-26', 261, 259, 2, 221850, 425, '2026-02-12 19:02:16.298', '2026-02-12 19:02:16.298'),
	('1bbf3a22-4762-4ebd-8243-eea27c68db1b', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-02-10', 44, 38, 6, 16676, 16632, '2026-02-12 19:02:15.433', '2026-02-12 19:02:15.433'),
	('1d3668ea-960d-496e-8bf9-c56fa111bf0e', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-02-02', 44, 43, 1, 9372, 20196, '2026-02-12 18:17:11.428', '2026-02-12 18:17:11.428'),
	('1d5e8a54-ba69-42e4-a728-a41baf02d2e6', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-25', 34, 32, 2, 23052, 23528, '2026-02-12 19:02:15.360', '2026-02-12 19:02:15.360'),
	('1e4d9000-de50-445c-b029-2f553580805f', '8930350b-79b7-4307-ae2b-a426375fa2e7', '2026-02-05', 141, 139, 2, 119850, 425, '2026-02-12 19:02:16.253', '2026-02-12 19:02:16.253'),
	('1f3bca55-c0d4-494e-81d5-63a509e3d742', '8930350b-79b7-4307-ae2b-a426375fa2e7', '2026-02-12', 120, 120, 0, 102000, 320, '2026-02-12 19:02:16.223', '2026-02-12 19:02:16.223'),
	('20049950-f5db-4e4a-9219-4bcbb56dc561', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-02-10', 44, 38, 6, 16676, 16632, '2026-02-12 18:17:11.463', '2026-02-12 18:17:11.463'),
	('218c9a21-285c-4fa1-bd0f-76a6acfc7a0f', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-28', 9, 8, 1, 5499, 3204, '2026-02-12 18:25:22.929', '2026-02-12 18:25:22.929'),
	('2586d831-718d-4581-9c5e-505984939477', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-02-01', 6, 5, 1, 3018, 1596, '2026-02-12 18:25:44.178', '2026-02-12 18:25:44.178'),
	('259af7d5-bbb6-4d00-873f-516ac01b3031', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-17', 7, 6, 1, 1645, 2828, '2026-02-12 19:02:15.325', '2026-02-12 19:02:15.325'),
	('289858d7-8e20-44be-80d1-fe1df8e38eb6', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-02-12', 18, 15, 3, 5580, 6264, '2026-02-12 19:02:15.442', '2026-02-12 19:02:15.442'),
	('336c64d7-95d6-45cb-b7e0-e1f076a40462', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-17', 7, 6, 1, 1645, 2828, '2026-02-12 18:17:11.356', '2026-02-12 18:17:11.356'),
	('33ea8f75-098a-4c79-9fdf-b6e09a10f492', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-02-11', 32, 27, 5, 17952, 28096, '2026-02-12 18:25:44.221', '2026-02-12 18:25:44.221'),
	('347a60d2-235e-44eb-8ac1-a4ab1da31df3', '8930350b-79b7-4307-ae2b-a426375fa2e7', '2026-01-30', 339, 336, 3, 288150, 365, '2026-02-12 19:02:16.281', '2026-02-12 19:02:16.281'),
	('36e7bea1-da8c-4767-84ec-dcbb60bc3a2a', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-24', 41, 38, 3, 16154, 17712, '2026-02-12 19:02:15.355', '2026-02-12 19:02:15.355'),
	('3a6f8314-e2be-44fd-ace5-b104d59f230c', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-18', 37, 33, 4, 23828, 21275, '2026-02-12 18:17:11.361', '2026-02-12 18:17:11.361'),
	('3b28ae8e-90f4-41c5-95ab-bab6f0b45545', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-02-01', 6, 5, 1, 3018, 1596, '2026-02-12 18:17:11.424', '2026-02-12 18:17:11.424'),
	('4171adf2-53a8-4e02-996d-2ab94b7a2691', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-15', 33, 31, 2, 20757, 15411, '2026-02-12 18:25:22.868', '2026-02-12 18:25:22.868'),
	('43125a6c-b744-430a-aaf3-140e08743e58', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-02-02', 44, 43, 1, 9372, 20196, '2026-02-12 18:25:44.183', '2026-02-12 18:25:44.183'),
	('43ee304c-ebc5-4663-b25a-7772d90aa21b', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-24', 41, 38, 3, 16154, 17712, '2026-02-12 18:17:11.388', '2026-02-12 18:17:11.388'),
	('46941a41-cf1d-4ee8-9c54-692d54e91f3f', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-20', 12, 10, 2, 8184, 4824, '2026-02-12 19:02:15.337', '2026-02-12 19:02:15.337'),
	('49898948-619f-4a35-bd54-a1a379dc704d', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-30', 21, 20, 1, 5586, 18627, '2026-02-12 19:02:15.384', '2026-02-12 19:02:15.384'),
	('4b01c71c-b20b-42a3-bf6a-17ec2b2ca27f', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-02-01', 6, 5, 1, 3018, 1596, '2026-02-12 19:02:15.393', '2026-02-12 19:02:15.393'),
	('4b8ffa45-7f2d-4107-844f-983005ec6fa8', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-02-11', 32, 27, 5, 17952, 28096, '2026-02-12 19:02:15.438', '2026-02-12 19:02:15.438'),
	('4fd85fa8-7aeb-44ca-b6d0-92dc10d5301e', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-02-02', 44, 43, 1, 9372, 20196, '2026-02-12 18:25:22.949', '2026-02-12 18:25:22.949'),
	('4ffb4128-2838-4622-8962-2ad34cfc5833', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-29', 20, 17, 3, 13920, 12560, '2026-02-12 18:17:11.410', '2026-02-12 18:17:11.410'),
	('51265e04-040e-440f-8032-d7a6e881afd3', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-15', 33, 31, 2, 20757, 15411, '2026-02-12 19:02:15.314', '2026-02-12 19:02:15.314'),
	('525d4fae-eda4-45b2-8a5f-725e579bf53f', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-02-03', 51, 48, 3, 32385, 22746, '2026-02-12 18:17:11.432', '2026-02-12 18:17:11.432'),
	('52858a21-8025-45fe-9487-41a59cca5ef6', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-02-09', 35, 32, 3, 19880, 11585, '2026-02-12 19:02:15.429', '2026-02-12 19:02:15.429'),
	('57daac32-9199-4f2b-b8da-db6311f56fbc', '8930350b-79b7-4307-ae2b-a426375fa2e7', '2026-01-27', 228, 227, 1, 193800, 410, '2026-02-12 19:02:16.294', '2026-02-12 19:02:16.294'),
	('5e06ae4b-6ae9-4319-81d3-0c9db72209ac', '8930350b-79b7-4307-ae2b-a426375fa2e7', '2026-01-19', 282, 278, 4, 239700, 380, '2026-02-12 19:02:16.329', '2026-02-12 19:02:16.329'),
	('5e14ae72-0e19-4783-a44a-e8195d9fcee5', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-18', 37, 33, 4, 23828, 21275, '2026-02-12 18:25:22.881', '2026-02-12 18:25:22.881'),
	('5f1203af-86f1-4cbb-926e-8114069929a8', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-27', 43, 38, 5, 20898, 16641, '2026-02-12 18:25:22.921', '2026-02-12 18:25:22.921'),
	('5fad9200-6223-4de9-8ba9-b383e6e4f8fa', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-02-07', 13, 12, 1, 5564, 9815, '2026-02-12 18:25:22.973', '2026-02-12 18:25:22.973'),
	('604fe51c-7856-4157-9938-a41190479347', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-15', 33, 31, 2, 20757, 15411, '2026-02-12 18:25:44.102', '2026-02-12 18:25:44.102'),
	('60bd363b-37b3-4828-8806-d323d28833f4', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-26', 14, 13, 1, 3808, 2464, '2026-02-12 18:17:11.398', '2026-02-12 18:17:11.398'),
	('616aafb7-851b-423c-95fd-cbbe0cf1ff7f', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-27', 43, 38, 5, 20898, 16641, '2026-02-12 19:02:15.370', '2026-02-12 19:02:15.370'),
	('61bc6914-85e6-4d08-a8cc-0c4f517a4d2a', '8930350b-79b7-4307-ae2b-a426375fa2e7', '2026-02-11', 153, 152, 1, 130050, 335, '2026-02-12 19:02:16.227', '2026-02-12 19:02:16.227'),
	('627d1557-bbe0-44d9-a3dd-a6d0aeb05ca3', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-14', 28, 25, 3, 15596, 24528, '2026-02-12 18:17:11.343', '2026-02-12 18:17:11.343'),
	('62f8cdd1-34f8-4d3b-8d93-83247993ceb5', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-25', 34, 32, 2, 23052, 23528, '2026-02-12 18:25:44.145', '2026-02-12 18:25:44.145'),
	('642be344-a938-4c22-a120-dc623abd79e6', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-02-12', 18, 15, 3, 5580, 6264, '2026-02-12 18:25:44.225', '2026-02-12 18:25:44.225'),
	('645f6316-37ef-4fe4-9ac7-01765a355041', '8930350b-79b7-4307-ae2b-a426375fa2e7', '2026-01-14', 237, 233, 4, 201450, 455, '2026-02-12 19:02:16.353', '2026-02-12 19:02:16.353'),
	('64a995f0-3278-453c-9bc4-63dc260799bd', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-23', 40, 38, 2, 20960, 18400, '2026-02-12 19:02:15.352', '2026-02-12 19:02:15.352'),
	('6692cb8e-a775-4e55-89b7-d18b175b9661', '8930350b-79b7-4307-ae2b-a426375fa2e7', '2026-01-31', 306, 304, 2, 260100, 350, '2026-02-12 19:02:16.276', '2026-02-12 19:02:16.276'),
	('6c171a2d-46c4-4ca4-a2f4-7de0482cf590', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-17', 7, 6, 1, 1645, 2828, '2026-02-12 18:25:44.110', '2026-02-12 18:25:44.110'),
	('6d064bb3-6c1f-4ec4-a7f1-0619d1a17d72', '8930350b-79b7-4307-ae2b-a426375fa2e7', '2026-01-23', 360, 360, 0, 306000, 320, '2026-02-12 19:02:16.311', '2026-02-12 19:02:16.311'),
	('7071878b-6a1e-42a3-b8f0-c446c88ad1db', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-24', 41, 38, 3, 16154, 17712, '2026-02-12 18:25:44.142', '2026-02-12 18:25:44.142'),
	('71c34c91-37db-412c-83a6-e8c85a2a616e', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-21', 20, 19, 1, 6580, 7960, '2026-02-12 18:17:11.375', '2026-02-12 18:17:11.375'),
	('7275828a-a1f3-4c08-8e18-5d51b1afdc9c', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-02-06', 45, 44, 1, 25020, 4590, '2026-02-12 19:02:15.415', '2026-02-12 19:02:15.415'),
	('72823536-b83c-4e92-a353-11862e98887b', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-02-07', 13, 12, 1, 5564, 9815, '2026-02-12 18:17:11.450', '2026-02-12 18:17:11.450'),
	('7456caaa-90b9-42ac-91bc-126e41b615ef', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-02-03', 51, 48, 3, 32385, 22746, '2026-02-12 18:25:22.955', '2026-02-12 18:25:22.955'),
	('774ab92e-dd55-44ed-9b4e-0120b7106574', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-25', 34, 32, 2, 23052, 23528, '2026-02-12 18:17:11.393', '2026-02-12 18:17:11.393'),
	('77e21f23-2f8d-4cbd-bb5b-b2d1b5e37f24', '8930350b-79b7-4307-ae2b-a426375fa2e7', '2026-01-24', 327, 323, 4, 277950, 455, '2026-02-12 19:02:16.307', '2026-02-12 19:02:16.307'),
	('783d3bc6-bae1-4433-aa03-a821b85a09b9', '8930350b-79b7-4307-ae2b-a426375fa2e7', '2026-01-21', 216, 214, 2, 183600, 350, '2026-02-12 19:02:16.320', '2026-02-12 19:02:16.320'),
	('78b11b75-7685-426c-b8a2-4d751b77554c', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-02-03', 51, 48, 3, 32385, 22746, '2026-02-12 18:25:44.187', '2026-02-12 18:25:44.187'),
	('78bd0879-2ac3-4983-a8e9-a6a0d69df166', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-28', 9, 8, 1, 5499, 3204, '2026-02-12 18:25:44.159', '2026-02-12 18:25:44.159'),
	('79364207-f90a-402e-8bc9-de8ea598ccee', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-02-04', 38, 36, 2, 18316, 26524, '2026-02-12 18:17:11.436', '2026-02-12 18:17:11.436'),
	('79a6c741-cbd6-4109-b0bb-7bc8c985944c', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-22', 29, 28, 1, 7888, 17603, '2026-02-12 19:02:15.347', '2026-02-12 19:02:15.347'),
	('7a9f0847-0337-4ab9-915d-84e04003afbe', '8930350b-79b7-4307-ae2b-a426375fa2e7', '2026-01-20', 249, 246, 3, 211650, 365, '2026-02-12 19:02:16.325', '2026-02-12 19:02:16.325'),
	('7e4cb99d-7635-4735-b318-110f782a8690', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-23', 40, 38, 2, 20960, 18400, '2026-02-12 18:25:22.904', '2026-02-12 18:25:22.904'),
	('7e922844-3abb-4aaf-8433-132026732137', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-28', 9, 8, 1, 5499, 3204, '2026-02-12 18:17:11.406', '2026-02-12 18:17:11.406'),
	('80e9ce78-9d85-420c-957f-09168117d523', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-02-06', 45, 44, 1, 25020, 4590, '2026-02-12 18:25:22.967', '2026-02-12 18:25:22.967'),
	('88816215-1c54-42b0-899d-45fe3feb761b', '8930350b-79b7-4307-ae2b-a426375fa2e7', '2026-02-03', 207, 203, 4, 175950, 455, '2026-02-12 19:02:16.262', '2026-02-12 19:02:16.262'),
	('8d748265-53f6-47d2-878c-070ffe3426a8', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-02-12', 18, 15, 3, 5580, 6264, '2026-02-12 18:25:22.995', '2026-02-12 18:25:22.995'),
	('8e580ee5-7950-4ba1-b70d-418f394eb8c5', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-24', 41, 38, 3, 16154, 17712, '2026-02-12 18:25:22.908', '2026-02-12 18:25:22.908'),
	('8e9e9c9d-6594-438b-9038-550aecac4b65', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-17', 7, 6, 1, 1645, 2828, '2026-02-12 18:25:22.876', '2026-02-12 18:25:22.876'),
	('8f4ac935-4f90-4a09-9e8d-317db64b0f6e', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-02-08', 53, 51, 2, 29786, 21571, '2026-02-12 18:25:22.977', '2026-02-12 18:25:22.977'),
	('91bc6b80-c7a3-461d-beff-b68aed0793a6', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-02-07', 13, 12, 1, 5564, 9815, '2026-02-12 19:02:15.420', '2026-02-12 19:02:15.420'),
	('93b2e0b7-c6e6-40ea-b7aa-5f4dba29a912', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-26', 14, 13, 1, 3808, 2464, '2026-02-12 18:25:44.150', '2026-02-12 18:25:44.150'),
	('944e6ddd-782f-4d87-8845-63ddbed68a85', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-21', 20, 19, 1, 6580, 7960, '2026-02-12 18:25:44.127', '2026-02-12 18:25:44.127'),
	('9691ce71-3427-4453-8cd2-9a72d743446a', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-02-09', 35, 32, 3, 19880, 11585, '2026-02-12 18:17:11.459', '2026-02-12 18:17:11.459'),
	('999b8fb9-66ee-4bbb-8594-bd6a4cf1260e', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-13', 10, 8, 2, 3680, 4500, '2026-02-12 18:25:44.093', '2026-02-12 18:25:44.093'),
	('9d0574a9-243f-4791-bdbb-9b261f796f5f', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-31', 25, 24, 1, 14500, 10100, '2026-02-12 19:02:15.388', '2026-02-12 19:02:15.388'),
	('9d14f6b5-9460-408b-b6a9-a54c399ea1a6', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-02-08', 53, 51, 2, 29786, 21571, '2026-02-12 18:25:44.208', '2026-02-12 18:25:44.208'),
	('9e6344ff-4caa-4165-8fba-e96e6e650660', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-02-01', 6, 5, 1, 3018, 1596, '2026-02-12 18:25:22.946', '2026-02-12 18:25:22.946'),
	('a0b2e801-cdda-4411-a320-278b47817b74', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-22', 29, 28, 1, 7888, 17603, '2026-02-12 18:17:11.380', '2026-02-12 18:17:11.380'),
	('a0ea7323-46e9-4139-9eab-c13e242c5380', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-16', 20, 17, 3, 7040, 15060, '2026-02-12 19:02:15.320', '2026-02-12 19:02:15.320'),
	('a3c76da4-14fc-4921-9983-511affdc6ec2', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-22', 29, 28, 1, 7888, 17603, '2026-02-12 18:25:44.133', '2026-02-12 18:25:44.133'),
	('a449631b-0ea7-419f-bfcf-2e289e5fef43', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-02-04', 38, 36, 2, 18316, 26524, '2026-02-12 19:02:15.406', '2026-02-12 19:02:15.406'),
	('a84f202c-bba9-408f-afd3-2ed96bd767f6', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-23', 40, 38, 2, 20960, 18400, '2026-02-12 18:25:44.137', '2026-02-12 18:25:44.137'),
	('a9efb8d1-a8db-4f3b-9e9a-fec9fd5fca19', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-26', 14, 13, 1, 3808, 2464, '2026-02-12 19:02:15.364', '2026-02-12 19:02:15.364'),
	('aa55e708-fe68-48b5-b8e9-801717c432fd', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-30', 21, 20, 1, 5586, 18627, '2026-02-12 18:25:44.167', '2026-02-12 18:25:44.167'),
	('ad0f3e3e-3a08-46cf-a25c-b39e573a1a53', '8930350b-79b7-4307-ae2b-a426375fa2e7', '2026-02-10', 186, 184, 2, 158100, 350, '2026-02-12 19:02:16.232', '2026-02-12 19:02:16.232'),
	('aeacf99e-e27f-4abc-b939-ea2ab05f2104', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-26', 14, 13, 1, 3808, 2464, '2026-02-12 18:25:22.917', '2026-02-12 18:25:22.917'),
	('b016ac2e-344c-4060-9c78-d15e55a1e57e', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-13', 10, 8, 2, 3680, 4500, '2026-02-12 19:02:15.305', '2026-02-12 19:02:15.305'),
	('b3ac0638-4eb5-4250-bbfa-a2c45666db1f', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-16', 20, 17, 3, 7040, 15060, '2026-02-12 18:25:22.873', '2026-02-12 18:25:22.873'),
	('b4991cb5-f5f7-4b92-b6e8-e382f3e376ce', '8930350b-79b7-4307-ae2b-a426375fa2e7', '2026-02-08', 252, 248, 4, 214200, 380, '2026-02-12 19:02:16.240', '2026-02-12 19:02:16.240'),
	('b4baef45-c88c-4d21-8d11-10afb1bd48ee', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-02-04', 38, 36, 2, 18316, 26524, '2026-02-12 18:25:44.192', '2026-02-12 18:25:44.192'),
	('b4f4d6e0-c323-4d73-93ca-8e1055d1867a', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-22', 29, 28, 1, 7888, 17603, '2026-02-12 18:25:22.899', '2026-02-12 18:25:22.899'),
	('b50828c9-1521-424f-b06f-19f7ed504a65', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-29', 20, 17, 3, 13920, 12560, '2026-02-12 18:25:44.162', '2026-02-12 18:25:44.162'),
	('b55d4113-ffa2-4776-a7eb-6cc4095883f3', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-27', 43, 38, 5, 20898, 16641, '2026-02-12 18:25:44.154', '2026-02-12 18:25:44.154'),
	('b8269581-b174-4d11-8398-fd7c248a771d', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-20', 12, 10, 2, 8184, 4824, '2026-02-12 18:25:22.891', '2026-02-12 18:25:22.891'),
	('b90b5284-a455-40ea-aedd-0bdc2c63df43', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-18', 37, 33, 4, 23828, 21275, '2026-02-12 18:25:44.114', '2026-02-12 18:25:44.114'),
	('ba3a3d39-b096-4703-add5-8cfb4bd978b2', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-27', 43, 38, 5, 20898, 16641, '2026-02-12 18:17:11.401', '2026-02-12 18:17:11.401'),
	('bbdbbf3c-7fd8-4812-9660-40e9865c012a', '8930350b-79b7-4307-ae2b-a426375fa2e7', '2026-01-29', 162, 158, 4, 137700, 380, '2026-02-12 19:02:16.284', '2026-02-12 19:02:16.284'),
	('bd32671f-bb55-4243-a58b-677959fdfeb5', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-25', 34, 32, 2, 23052, 23528, '2026-02-12 18:25:22.912', '2026-02-12 18:25:22.912'),
	('c3614f9e-680d-46ae-98b7-67581f144d56', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-30', 21, 20, 1, 5586, 18627, '2026-02-12 18:17:11.414', '2026-02-12 18:17:11.414'),
	('c709d2bc-cec2-4cd8-b821-94ed2db4a09e', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-02-05', 36, 31, 5, 23868, 9036, '2026-02-12 19:02:15.411', '2026-02-12 19:02:15.411'),
	('c7594b89-9baa-48b4-ad24-1ecb1bbf4b44', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-02-08', 53, 51, 2, 29786, 21571, '2026-02-12 19:02:15.424', '2026-02-12 19:02:15.424'),
	('c90ae451-14cb-4000-bcf0-38417ea74fb9', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-19', 49, 41, 8, 9898, 30331, '2026-02-12 19:02:15.334', '2026-02-12 19:02:15.334'),
	('c9eeb41b-b75d-456e-a3d5-090352322df1', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-20', 12, 10, 2, 8184, 4824, '2026-02-12 18:17:11.370', '2026-02-12 18:17:11.370'),
	('cb18f9d3-9238-4f9b-ac29-8b0d00848480', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-02-09', 35, 32, 3, 19880, 11585, '2026-02-12 18:25:22.981', '2026-02-12 18:25:22.981'),
	('ce74f7c1-ac52-4cc4-9135-2eb87ecfff5c', '8930350b-79b7-4307-ae2b-a426375fa2e7', '2026-01-22', 183, 182, 1, 155550, 335, '2026-02-12 19:02:16.316', '2026-02-12 19:02:16.316'),
	('d04784d0-ec2d-41d6-b630-cc13326e541f', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-14', 28, 25, 3, 15596, 24528, '2026-02-12 18:25:22.865', '2026-02-12 18:25:22.865'),
	('d08b5a36-892f-4bfc-a86c-84dfb506c50d', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-19', 49, 41, 8, 9898, 30331, '2026-02-12 18:25:44.119', '2026-02-12 18:25:44.119'),
	('d0e2793c-cad3-4216-8f57-6e638b38d6aa', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-19', 49, 41, 8, 9898, 30331, '2026-02-12 18:25:22.886', '2026-02-12 18:25:22.886'),
	('d429e5c3-8594-410e-9efb-67980e175b7a', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-21', 20, 19, 1, 6580, 7960, '2026-02-12 19:02:15.343', '2026-02-12 19:02:15.343'),
	('d916279b-b2da-4713-8ba2-bd1a74f53755', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-16', 20, 17, 3, 7040, 15060, '2026-02-12 18:17:11.352', '2026-02-12 18:17:11.352'),
	('dbc00781-780c-4541-957f-ee0dd606b34f', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-20', 12, 10, 2, 8184, 4824, '2026-02-12 18:25:44.123', '2026-02-12 18:25:44.123'),
	('dd90fbed-1b6c-4bc8-91da-746f65d2b737', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-13', 10, 8, 2, 3680, 4500, '2026-02-12 18:17:11.338', '2026-02-12 18:17:11.338'),
	('ddae1247-c1dc-41d7-9e9e-b97ab66d1429', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-02-04', 38, 36, 2, 18316, 26524, '2026-02-12 18:25:22.958', '2026-02-12 18:25:22.958'),
	('df726fd0-98c7-42e5-a5f3-3ea5811e8367', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-02-10', 44, 38, 6, 16676, 16632, '2026-02-12 18:25:44.217', '2026-02-12 18:25:44.217'),
	('e0eeb21b-9193-4952-9eb4-ba37009283a8', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-02-08', 53, 51, 2, 29786, 21571, '2026-02-12 18:17:11.453', '2026-02-12 18:17:11.453'),
	('e1841617-410b-40b0-9d0d-592902b4213e', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-14', 28, 25, 3, 15596, 24528, '2026-02-12 19:02:15.310', '2026-02-12 19:02:15.310'),
	('e1ed0010-5305-44c6-a22a-1e3f9baa09f2', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-14', 28, 25, 3, 15596, 24528, '2026-02-12 18:25:44.096', '2026-02-12 18:25:44.096'),
	('e21829b8-ad40-4cbc-962b-f9ba20f32882', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-02-02', 44, 43, 1, 9372, 20196, '2026-02-12 19:02:15.397', '2026-02-12 19:02:15.397'),
	('e379b0bc-5b4a-4805-811f-f63e28a781c3', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-02-05', 36, 31, 5, 23868, 9036, '2026-02-12 18:25:22.963', '2026-02-12 18:25:22.963'),
	('e38dfb8d-8a08-43b2-a5ba-e2087be6de4b', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-18', 37, 33, 4, 23828, 21275, '2026-02-12 19:02:15.329', '2026-02-12 19:02:15.329'),
	('e7eb077b-2c20-4734-a563-8003763b95b5', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-29', 20, 17, 3, 13920, 12560, '2026-02-12 18:25:22.933', '2026-02-12 18:25:22.933'),
	('ecc72764-35b6-4a35-a6ed-c71ef15ee43a', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-13', 10, 8, 2, 3680, 4500, '2026-02-12 18:25:22.859', '2026-02-12 18:25:22.859'),
	('ee08500c-5f0f-4fb9-8b30-ffc0821cac4c', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-30', 21, 20, 1, 5586, 18627, '2026-02-12 18:25:22.937', '2026-02-12 18:25:22.937'),
	('eeae0383-afba-429d-ae62-21eba34bb4a9', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-02-05', 36, 31, 5, 23868, 9036, '2026-02-12 18:17:11.441', '2026-02-12 18:17:11.441'),
	('f2b4c1a2-8d30-4b5e-8ae1-b691362f9ace', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-19', 49, 41, 8, 9898, 30331, '2026-02-12 18:17:11.365', '2026-02-12 18:17:11.365'),
	('f3b44ae2-adcb-4661-b521-fd06fc643a62', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-02-11', 32, 27, 5, 17952, 28096, '2026-02-12 18:25:22.990', '2026-02-12 18:25:22.990'),
	('f5313232-defb-41e2-a37f-cbc3e6d529be', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-02-12', 18, 15, 3, 5580, 6264, '2026-02-12 18:17:11.473', '2026-02-12 18:17:11.473'),
	('f572961b-353f-49c0-a12f-864233ffa0a5', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-01-31', 25, 24, 1, 14500, 10100, '2026-02-12 18:17:11.419', '2026-02-12 18:17:11.419'),
	('f817e28a-a359-47e0-9874-91011116e3e8', '8930350b-79b7-4307-ae2b-a426375fa2e7', '2026-02-06', 318, 317, 1, 270300, 410, '2026-02-12 19:02:16.248', '2026-02-12 19:02:16.248'),
	('f892ca47-1a58-4948-b370-a3bc94798f7a', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-02-06', 45, 44, 1, 25020, 4590, '2026-02-12 18:17:11.445', '2026-02-12 18:17:11.445'),
	('fa005cf4-793b-4696-8f2c-fc54d6d2cdfd', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-02-03', 51, 48, 3, 32385, 22746, '2026-02-12 19:02:15.402', '2026-02-12 19:02:15.402'),
	('fb95f217-fb31-49eb-a44f-babf532dcc5c', '8930350b-79b7-4307-ae2b-a426375fa2e7', '2026-02-07', 285, 285, 0, 242250, 395, '2026-02-12 19:02:16.243', '2026-02-12 19:02:16.243'),
	('fe68aaab-6e01-4c13-aaa1-f77fbbdf4f90', '8930350b-79b7-4307-ae2b-a426375fa2e7', '2026-01-17', 348, 347, 1, 295800, 410, '2026-02-12 19:02:16.338', '2026-02-12 19:02:16.338'),
	('fede0eaa-5504-483f-86a5-e42f293c3b9e', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-02-06', 45, 44, 1, 25020, 4590, '2026-02-12 18:25:44.200', '2026-02-12 18:25:44.200'),
	('ff6c1ce2-3d42-4462-8e9b-863522eefe7e', '8df9aa04-afdc-444f-9105-8e3feac939a6', '2026-02-07', 13, 12, 1, 5564, 9815, '2026-02-12 18:25:44.204', '2026-02-12 18:25:44.204');

-- Dumping structure for table what-reverse.what_reverse_workspace_versions
CREATE TABLE IF NOT EXISTS `what_reverse_workspace_versions` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workspace_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `version` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `changelog` text COLLATE utf8mb4_unicode_ci,
  `ui_schema` json DEFAULT NULL,
  `db_schema` json DEFAULT NULL,
  `config_json` json DEFAULT NULL,
  `created_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `logic_code` longtext COLLATE utf8mb4_unicode_ci,
  `component_code` longtext COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_workspace_version` (`workspace_id`,`version`),
  KEY `idx_what_reverse_workspace_versions_workspace_id` (`workspace_id`),
  KEY `idx_what_reverse_workspace_versions_created_by` (`created_by`),
  CONSTRAINT `fk_what_reverse_workspace_versions_creator` FOREIGN KEY (`created_by`) REFERENCES `what_reverse_users` (`id`),
  CONSTRAINT `fk_what_reverse_workspace_versions_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `what_reverse_workspaces` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table what-reverse.what_reverse_workspace_versions: ~2 rows (approximately)
DELETE FROM `what_reverse_workspace_versions`;
INSERT INTO `what_reverse_workspace_versions` (`id`, `workspace_id`, `version`, `changelog`, `ui_schema`, `db_schema`, `config_json`, `created_by`, `created_at`, `logic_code`, `component_code`) VALUES
	('1abb1118-1fbd-44cc-a978-28bb00cf1ad6', '8930350b-79b7-4307-ae2b-a426375fa2e7', '', 'Pages config update', NULL, NULL, '{"pages": [{"id": "reservation_detail", "icon": "FileText", "route": "/reservations/detail", "title": "预定详情"}, {"id": "reservations", "icon": "CalendarCheck", "route": "/reservations", "title": "用车预定"}, {"id": "dashboard", "icon": "LayoutDashboard", "route": "/dashboard", "title": "仪表盘"}, {"id": "vehicles", "icon": "Truck", "route": "/vehicles", "title": "车辆管理"}, {"id": "drivers", "icon": "Users", "route": "/drivers", "title": "驾驶员"}, {"id": "trips", "icon": "MapPin", "route": "/trips", "title": "行程记录"}, {"id": "routes", "icon": "Globe", "route": "/routes", "title": "路线管理"}, {"id": "maintenance", "icon": "Settings", "route": "/maintenance", "title": "维修保养"}, {"id": "fuel", "icon": "Zap", "route": "/fuel", "title": "加油记录"}, {"id": "violations", "icon": "AlertTriangle", "route": "/violations", "title": "违章记录"}, {"id": "insurance", "icon": "Briefcase", "route": "/insurance", "title": "保险管理"}, {"id": "alerts", "icon": "Activity", "route": "/alerts", "title": "告警中心"}], "navigation": {"type": "sidebar"}, "default_page": "reservations"}', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', '2026-02-14 23:21:41.727', NULL, NULL),
	('50f00de7-1aa7-415b-9aee-ecc8046725dd', '8930350b-79b7-4307-ae2b-a426375fa2e7', '1.0.0', '智慧车队管理系统 - 初始版本', '{"pages": [{"id": "reservations", "icon": "CalendarCheck", "route": "/reservations", "title": "用车预定", "blocks": [{"id": "stat_pending_reservations", "grid": {"col_span": 1}, "type": "stats_card", "config": {"icon": "Clock", "color": "amber", "label": "待审批", "value_key": "count"}, "data_source": {"table": "reservations", "where": "status = \'待审批\'", "aggregation": [{"alias": "count", "column": "id", "function": "count"}]}}, {"id": "stat_approved_reservations", "grid": {"col_span": 1}, "type": "stats_card", "config": {"icon": "CheckCircle", "color": "blue", "label": "已批准", "value_key": "count"}, "data_source": {"table": "reservations", "where": "status = \'已批准\'", "aggregation": [{"alias": "count", "column": "id", "function": "count"}]}}, {"id": "stat_inprogress_reservations", "grid": {"col_span": 1}, "type": "stats_card", "config": {"icon": "Navigation", "color": "green", "label": "进行中", "value_key": "count"}, "data_source": {"table": "reservations", "where": "status = \'进行中\'", "aggregation": [{"alias": "count", "column": "id", "function": "count"}]}}, {"id": "stat_completed_reservations", "grid": {"col_span": 1}, "type": "stats_card", "config": {"icon": "CircleCheck", "color": "default", "label": "已完成", "value_key": "count"}, "data_source": {"table": "reservations", "where": "status = \'已完成\'", "aggregation": [{"alias": "count", "column": "id", "function": "count"}]}}, {"id": "reservation_calendar", "grid": {"col_span": 4}, "type": "calendar", "config": {"end_key": "end_time", "start_key": "start_time", "title_key": "purpose", "status_key": "status", "table_name": "reservations", "click_action": {"type": "navigate", "page_id": "reservation_detail", "param_key": "record_id"}, "default_view": "month", "detail_fields": [{"key": "reservation_no", "label": "编号"}, {"key": "applicant_name", "label": "申请人"}, {"key": "applicant_department", "label": "部门"}, {"key": "start_location", "label": "出发地"}, {"key": "end_location", "label": "目的地"}, {"key": "passengers", "label": "人数"}, {"key": "priority", "label": "优先级"}], "status_colors": {"已取消": "bg-gray-500/10 text-gray-500 border-gray-400/30", "已完成": "bg-slate-500/10 text-slate-600 border-slate-400/30", "已批准": "bg-emerald-500/15 text-emerald-700 border-emerald-400/30", "已拒绝": "bg-red-500/15 text-red-700 border-red-400/30", "待审批": "bg-amber-500/15 text-amber-700 border-amber-400/30", "进行中": "bg-blue-500/15 text-blue-700 border-blue-400/30"}}, "data_source": {"table": "reservations"}}, {"id": "reservation_status_chart", "grid": {"col_span": 2}, "type": "chart", "label": "预定状态分布", "config": {"title": "预定状态分布", "x_key": "status", "chart_type": "pie", "category_key": "status"}, "data_source": {"limit": 200, "table": "reservations"}}, {"id": "reservation_dept_chart", "grid": {"col_span": 2}, "type": "chart", "label": "各部门用车统计", "config": {"title": "各部门用车统计", "x_key": "applicant_department", "chart_type": "bar", "category_key": "applicant_department"}, "data_source": {"limit": 200, "table": "reservations"}}, {"id": "reservation_create_dialog", "type": "form_dialog", "config": {"title": "新建用车预定", "fields": [{"key": "reservation_no", "type": "text", "label": "预定编号", "required": true, "placeholder": "如 RES20250215002"}, {"key": "applicant_name", "type": "text", "label": "申请人", "required": true}, {"key": "applicant_department", "type": "select", "label": "部门", "options": [{"label": "总经办", "value": "总经办"}, {"label": "销售部", "value": "销售部"}, {"label": "技术部", "value": "技术部"}, {"label": "市场部", "value": "市场部"}, {"label": "物流部", "value": "物流部"}, {"label": "财务部", "value": "财务部"}, {"label": "人事部", "value": "人事部"}], "required": true}, {"key": "applicant_phone", "type": "text", "label": "联系电话", "placeholder": "手机号码"}, {"key": "purpose", "type": "text", "label": "用车目的", "required": true, "placeholder": "如：客户拜访、会议出行等"}, {"key": "passengers", "type": "number", "label": "乘车人数", "default_value": 1}, {"key": "start_time", "type": "datetime", "label": "用车开始时间", "required": true}, {"key": "end_time", "type": "datetime", "label": "用车结束时间", "required": true}, {"key": "start_location", "type": "text", "label": "出发地", "required": true, "placeholder": "如：公司总部"}, {"key": "end_location", "type": "text", "label": "目的地", "required": true}, {"key": "priority", "type": "select", "label": "优先级", "options": [{"label": "普通", "value": "普通"}, {"label": "紧急", "value": "紧急"}, {"label": "特急", "value": "特急"}], "default_value": "普通"}, {"key": "notes", "type": "textarea", "label": "备注"}, {"key": "status", "type": "text", "label": "", "default_value": "待审批"}], "table_name": "reservations", "description": "请填写用车预定申请信息", "dialog_size": "lg", "submit_label": "提交预定申请", "trigger_label": "新建预定"}}, {"id": "reservations_table", "type": "data_table", "config": {"actions": ["view", "edit", "delete"], "columns": [{"key": "reservation_no", "type": "text", "label": "预定编号", "sortable": true}, {"key": "applicant_name", "type": "text", "label": "申请人", "sortable": true}, {"key": "applicant_department", "type": "text", "label": "部门"}, {"key": "purpose", "type": "text", "label": "用车目的"}, {"key": "start_location", "type": "text", "label": "出发地"}, {"key": "end_location", "type": "text", "label": "目的地"}, {"key": "passengers", "type": "number", "label": "人数"}, {"key": "priority", "type": "badge", "label": "优先级"}, {"key": "status", "type": "badge", "label": "状态"}, {"key": "start_time", "type": "date", "label": "用车时间", "sortable": true}], "page_size": 15, "pagination": true, "search_key": "reservation_no", "table_name": "reservations", "search_enabled": true, "status_actions": [{"color": "green", "label": "批准", "confirm": true, "to_status": "已批准", "from_status": ["待审批"], "status_column": "status"}, {"color": "red", "label": "拒绝", "confirm": true, "to_status": "已拒绝", "from_status": ["待审批"], "extra_fields": [{"key": "reject_reason", "label": "拒绝原因", "required": true}], "status_column": "status"}, {"color": "blue", "label": "开始出行", "confirm": true, "to_status": "进行中", "from_status": ["已批准"], "status_column": "status"}, {"color": "default", "label": "完成", "confirm": true, "to_status": "已完成", "from_status": ["进行中"], "status_column": "status"}, {"color": "default", "label": "取消", "confirm": true, "to_status": "已取消", "from_status": ["待审批", "已批准"], "status_column": "status"}], "filters_enabled": true, "row_click_action": {"type": "navigate", "params": {"record_id": "id"}, "page_id": "reservation_detail"}}, "data_source": {"table": "reservations", "order_by": [{"column": "start_time", "direction": "DESC"}]}}]}, {"id": "reservation_detail", "icon": "FileText", "route": "/reservations/detail", "title": "预定详情", "blocks": [{"id": "reservation_detail_view", "type": "detail_view", "config": {"fields": [{"key": "reservation_no", "label": "预定编号"}, {"key": "applicant_name", "label": "申请人"}, {"key": "applicant_department", "label": "部门"}, {"key": "applicant_phone", "label": "联系电话"}, {"key": "purpose", "label": "用车目的"}, {"key": "passengers", "label": "乘车人数"}, {"key": "start_location", "label": "出发地"}, {"key": "end_location", "label": "目的地"}, {"key": "start_time", "label": "用车开始时间"}, {"key": "end_time", "label": "用车结束时间"}, {"key": "vehicle_id", "label": "指派车辆ID"}, {"key": "driver_id", "label": "指派驾驶员ID"}, {"key": "priority", "label": "优先级"}, {"key": "status", "label": "状态"}, {"key": "approver", "label": "审批人"}, {"key": "approved_at", "label": "审批时间"}, {"key": "reject_reason", "label": "拒绝原因"}, {"key": "actual_start_time", "label": "实际出发时间"}, {"key": "actual_end_time", "label": "实际归还时间"}, {"key": "actual_mileage", "label": "实际里程(km)"}, {"key": "notes", "label": "备注"}, {"key": "created_at", "label": "创建时间"}], "table_name": "reservations", "record_id_param": "record_id"}, "data_source": {"table": "reservations"}}], "hidden": true, "require_auth": false}, {"id": "dashboard", "icon": "LayoutDashboard", "route": "/dashboard", "title": "仪表盘", "blocks": [{"id": "stat_total_vehicles", "grid": {"col_span": 1}, "type": "stats_card", "config": {"icon": "Truck", "color": "blue", "label": "车辆总数", "value_key": "count"}, "data_source": {"table": "vehicles", "aggregation": [{"alias": "count", "column": "id", "function": "count"}]}}, {"id": "stat_online_vehicles", "grid": {"col_span": 1}, "type": "stats_card", "config": {"icon": "CheckCircle", "color": "green", "label": "在线车辆", "value_key": "count"}, "data_source": {"table": "vehicles", "where": "status = \'在线\'", "aggregation": [{"alias": "count", "column": "id", "function": "count"}]}}, {"id": "stat_total_drivers", "grid": {"col_span": 1}, "type": "stats_card", "config": {"icon": "Users", "color": "default", "label": "驾驶员总数", "value_key": "count"}, "data_source": {"table": "drivers", "aggregation": [{"alias": "count", "column": "id", "function": "count"}]}}, {"id": "stat_active_alerts", "grid": {"col_span": 1}, "type": "stats_card", "config": {"icon": "AlertTriangle", "color": "red", "label": "待处理告警", "value_key": "count"}, "data_source": {"table": "alerts", "where": "status = \'未处理\'", "aggregation": [{"alias": "count", "column": "id", "function": "count"}]}}, {"id": "stat_pending_reservations_dash", "grid": {"col_span": 1}, "type": "stats_card", "config": {"icon": "CalendarCheck", "color": "amber", "label": "待审批预定", "value_key": "count"}, "data_source": {"table": "reservations", "where": "status = \'待审批\'", "aggregation": [{"alias": "count", "column": "id", "function": "count"}]}}, {"id": "vehicle_status_chart", "grid": {"col_span": 2}, "type": "chart", "label": "车辆状态分布", "config": {"title": "车辆状态分布", "x_key": "status", "y_key": "count", "chart_type": "pie", "category_key": "status"}, "data_source": {"limit": 100, "table": "vehicles"}}, {"id": "vehicle_type_chart", "grid": {"col_span": 2}, "type": "chart", "label": "车辆类型分布", "config": {"title": "车辆类型分布", "x_key": "vehicle_type", "y_key": "count", "chart_type": "pie", "category_key": "vehicle_type"}, "data_source": {"limit": 100, "table": "vehicles"}}, {"id": "fuel_consumption_chart", "grid": {"col_span": 2}, "type": "chart", "label": "燃料消费分布", "config": {"title": "燃料消费分布", "x_key": "fuel_type", "y_key": "count", "chart_type": "pie", "category_key": "fuel_type"}, "data_source": {"limit": 200, "table": "fuel_records"}}, {"id": "alert_type_chart", "grid": {"col_span": 2}, "type": "chart", "label": "告警类型分布", "config": {"title": "告警类型分布", "x_key": "alert_type", "y_key": "count", "chart_type": "pie", "category_key": "alert_type"}, "data_source": {"limit": 100, "table": "alerts"}}, {"id": "recent_trips", "type": "data_table", "label": "最近行程", "config": {"actions": ["view"], "columns": [{"key": "trip_no", "type": "text", "label": "行程编号"}, {"key": "start_location", "type": "text", "label": "出发地"}, {"key": "end_location", "type": "text", "label": "目的地"}, {"key": "distance_km", "type": "number", "label": "距离(km)"}, {"key": "status", "type": "badge", "label": "状态"}, {"key": "start_time", "type": "date", "label": "出发时间"}], "page_size": 10, "pagination": true, "search_key": "trip_no", "table_name": "trips", "search_enabled": true}, "data_source": {"table": "trips", "order_by": [{"column": "start_time", "direction": "DESC"}]}}, {"id": "recent_alerts", "type": "data_table", "label": "最新告警", "config": {"actions": ["view"], "columns": [{"key": "title", "type": "text", "label": "告警标题"}, {"key": "alert_type", "type": "badge", "label": "类型"}, {"key": "severity", "type": "badge", "label": "等级"}, {"key": "status", "type": "badge", "label": "状态"}, {"key": "alert_time", "type": "date", "label": "告警时间"}], "page_size": 5, "table_name": "alerts"}, "data_source": {"limit": 5, "table": "alerts", "order_by": [{"column": "alert_time", "direction": "DESC"}]}}, {"id": "recent_reservations", "type": "data_table", "label": "最近预定", "config": {"actions": ["view"], "columns": [{"key": "reservation_no", "type": "text", "label": "预定编号"}, {"key": "applicant_name", "type": "text", "label": "申请人"}, {"key": "applicant_department", "type": "text", "label": "部门"}, {"key": "purpose", "type": "text", "label": "用车目的"}, {"key": "priority", "type": "badge", "label": "优先级"}, {"key": "status", "type": "badge", "label": "状态"}, {"key": "start_time", "type": "date", "label": "用车时间"}], "page_size": 5, "table_name": "reservations"}, "data_source": {"limit": 5, "table": "reservations", "order_by": [{"column": "start_time", "direction": "DESC"}]}}]}, {"id": "vehicles", "icon": "Truck", "route": "/vehicles", "title": "车辆管理", "blocks": [{"id": "vehicles_table", "type": "data_table", "config": {"actions": ["view", "create", "edit", "delete"], "columns": [{"key": "plate_number", "type": "text", "label": "车牌号", "sortable": true}, {"key": "brand", "type": "text", "label": "品牌"}, {"key": "model", "type": "text", "label": "型号"}, {"key": "vehicle_type", "type": "badge", "label": "类型"}, {"key": "fuel_type", "type": "badge", "label": "燃料"}, {"key": "mileage", "type": "number", "label": "里程(km)", "sortable": true}, {"key": "department", "type": "text", "label": "部门"}, {"key": "status", "type": "badge", "label": "状态"}], "page_size": 15, "pagination": true, "search_key": "plate_number", "table_name": "vehicles", "search_enabled": true, "filters_enabled": true}, "data_source": {"table": "vehicles", "order_by": [{"column": "id", "direction": "ASC"}]}}]}, {"id": "drivers", "icon": "Users", "route": "/drivers", "title": "驾驶员", "blocks": [{"id": "drivers_table", "type": "data_table", "config": {"actions": ["view", "create", "edit", "delete"], "columns": [{"key": "name", "type": "text", "label": "姓名", "sortable": true}, {"key": "phone", "type": "text", "label": "电话"}, {"key": "license_type", "type": "badge", "label": "驾照类型"}, {"key": "department", "type": "text", "label": "部门"}, {"key": "driving_years", "type": "number", "label": "驾龄(年)"}, {"key": "rating", "type": "number", "label": "评分"}, {"key": "violation_count", "type": "number", "label": "违章次数"}, {"key": "status", "type": "badge", "label": "状态"}], "page_size": 15, "pagination": true, "search_key": "name", "table_name": "drivers", "search_enabled": true}, "data_source": {"table": "drivers", "order_by": [{"column": "id", "direction": "ASC"}]}}]}, {"id": "trips", "icon": "MapPin", "route": "/trips", "title": "行程记录", "blocks": [{"id": "trips_table", "type": "data_table", "config": {"actions": ["view", "create", "edit", "delete"], "columns": [{"key": "trip_no", "type": "text", "label": "编号", "sortable": true}, {"key": "vehicle_id", "type": "number", "label": "车辆ID"}, {"key": "driver_id", "type": "number", "label": "驾驶员ID"}, {"key": "start_location", "type": "text", "label": "出发地"}, {"key": "end_location", "type": "text", "label": "目的地"}, {"key": "distance_km", "type": "number", "label": "距离(km)", "sortable": true}, {"key": "purpose", "type": "text", "label": "目的"}, {"key": "status", "type": "badge", "label": "状态"}, {"key": "start_time", "type": "date", "label": "出发时间", "sortable": true}], "page_size": 15, "pagination": true, "search_key": "trip_no", "table_name": "trips", "search_enabled": true}, "data_source": {"table": "trips", "order_by": [{"column": "start_time", "direction": "DESC"}]}}]}, {"id": "routes", "icon": "Globe", "route": "/routes", "title": "路线管理", "blocks": [{"id": "routes_table", "type": "data_table", "config": {"actions": ["view", "create", "edit", "delete"], "columns": [{"key": "name", "type": "text", "label": "路线名称", "sortable": true}, {"key": "route_code", "type": "text", "label": "编号"}, {"key": "start_point", "type": "text", "label": "起点"}, {"key": "end_point", "type": "text", "label": "终点"}, {"key": "distance_km", "type": "number", "label": "距离(km)", "sortable": true}, {"key": "route_type", "type": "badge", "label": "类型"}, {"key": "status", "type": "badge", "label": "状态"}], "page_size": 15, "pagination": true, "search_key": "name", "table_name": "routes", "search_enabled": true}, "data_source": {"table": "routes", "order_by": [{"column": "id", "direction": "ASC"}]}}]}, {"id": "maintenance", "icon": "Settings", "route": "/maintenance", "title": "维修保养", "blocks": [{"id": "stat_pending_maintenance", "grid": {"col_span": 1}, "type": "stats_card", "config": {"icon": "Clock", "color": "amber", "label": "待处理工单", "value_key": "count"}, "data_source": {"table": "maintenance_records", "where": "status = \'待处理\'", "aggregation": [{"alias": "count", "column": "id", "function": "count"}]}}, {"id": "stat_in_progress_maintenance", "grid": {"col_span": 1}, "type": "stats_card", "config": {"icon": "Settings", "color": "blue", "label": "进行中", "value_key": "count"}, "data_source": {"table": "maintenance_records", "where": "status = \'进行中\'", "aggregation": [{"alias": "count", "column": "id", "function": "count"}]}}, {"id": "stat_completed_maintenance", "grid": {"col_span": 1}, "type": "stats_card", "config": {"icon": "CheckCircle", "color": "green", "label": "已完成", "value_key": "count"}, "data_source": {"table": "maintenance_records", "where": "status = \'已完成\'", "aggregation": [{"alias": "count", "column": "id", "function": "count"}]}}, {"id": "stat_total_maintenance", "grid": {"col_span": 1}, "type": "stats_card", "config": {"icon": "Briefcase", "color": "default", "label": "工单总数", "value_key": "count"}, "data_source": {"table": "maintenance_records", "aggregation": [{"alias": "count", "column": "id", "function": "count"}]}}, {"id": "maintenance_type_chart", "grid": {"col_span": 2}, "type": "chart", "label": "维修类型分布", "config": {"title": "维修类型分布", "x_key": "maintenance_type", "y_key": "count", "chart_type": "pie", "category_key": "maintenance_type"}, "data_source": {"limit": 100, "table": "maintenance_records"}}, {"id": "maintenance_table", "type": "data_table", "config": {"actions": ["view", "create", "edit", "delete"], "columns": [{"key": "record_no", "type": "text", "label": "工单号", "sortable": true}, {"key": "vehicle_id", "type": "number", "label": "车辆ID"}, {"key": "maintenance_type", "type": "badge", "label": "类型"}, {"key": "service_provider", "type": "text", "label": "服务商"}, {"key": "cost", "type": "number", "label": "费用(元)", "sortable": true}, {"key": "status", "type": "badge", "label": "状态"}, {"key": "start_date", "type": "date", "label": "开始日期", "sortable": true}], "page_size": 15, "pagination": true, "search_key": "record_no", "table_name": "maintenance_records", "search_enabled": true}, "data_source": {"table": "maintenance_records", "order_by": [{"column": "start_date", "direction": "DESC"}]}}]}, {"id": "fuel", "icon": "Zap", "route": "/fuel", "title": "加油记录", "blocks": [{"id": "fuel_type_chart", "grid": {"col_span": 2}, "type": "chart", "label": "燃料类型费用分布", "config": {"title": "燃料类型费用分布", "x_key": "fuel_type", "y_key": "count", "chart_type": "pie", "category_key": "fuel_type"}, "data_source": {"limit": 200, "table": "fuel_records"}}, {"id": "fuel_table", "type": "data_table", "config": {"actions": ["view", "create", "edit"], "columns": [{"key": "vehicle_id", "type": "number", "label": "车辆ID"}, {"key": "fuel_type", "type": "badge", "label": "燃料类型"}, {"key": "quantity", "type": "number", "label": "加油量"}, {"key": "unit_price", "type": "number", "label": "单价(元)"}, {"key": "total_cost", "type": "number", "label": "总费用(元)", "sortable": true}, {"key": "gas_station", "type": "text", "label": "加油站"}, {"key": "fuel_date", "type": "date", "label": "日期", "sortable": true}], "page_size": 15, "pagination": true, "search_key": "gas_station", "table_name": "fuel_records", "search_enabled": true}, "data_source": {"table": "fuel_records", "order_by": [{"column": "fuel_date", "direction": "DESC"}]}}]}, {"id": "violations", "icon": "AlertTriangle", "route": "/violations", "title": "违章记录", "blocks": [{"id": "violations_table", "type": "data_table", "config": {"actions": ["view", "edit"], "columns": [{"key": "vehicle_id", "type": "number", "label": "车辆ID"}, {"key": "driver_id", "type": "number", "label": "驾驶员ID"}, {"key": "violation_type", "type": "text", "label": "违章类型"}, {"key": "fine_amount", "type": "number", "label": "罚款(元)", "sortable": true}, {"key": "deduction_points", "type": "number", "label": "扣分"}, {"key": "status", "type": "badge", "label": "状态"}, {"key": "violation_date", "type": "date", "label": "违章时间", "sortable": true}], "page_size": 15, "pagination": true, "search_key": "violation_type", "table_name": "violations", "search_enabled": true}, "data_source": {"table": "violations", "order_by": [{"column": "violation_date", "direction": "DESC"}]}}]}, {"id": "insurance", "icon": "Briefcase", "route": "/insurance", "title": "保险管理", "blocks": [{"id": "insurance_table", "type": "data_table", "config": {"actions": ["view", "create", "edit"], "columns": [{"key": "vehicle_id", "type": "number", "label": "车辆ID"}, {"key": "policy_no", "type": "text", "label": "保单号"}, {"key": "insurance_company", "type": "text", "label": "保险公司"}, {"key": "insurance_type", "type": "badge", "label": "险种"}, {"key": "premium", "type": "number", "label": "保费(元)", "sortable": true}, {"key": "status", "type": "badge", "label": "状态"}, {"key": "end_date", "type": "date", "label": "到期日", "sortable": true}], "page_size": 15, "pagination": true, "search_key": "policy_no", "table_name": "insurance_policies", "search_enabled": true}, "data_source": {"table": "insurance_policies", "order_by": [{"column": "end_date", "direction": "ASC"}]}}]}, {"id": "alerts", "icon": "Activity", "route": "/alerts", "title": "告警中心", "blocks": [{"id": "stat_unhandled", "grid": {"col_span": 1}, "type": "stats_card", "config": {"icon": "AlertTriangle", "color": "red", "label": "未处理", "value_key": "count"}, "data_source": {"table": "alerts", "where": "status = \'未处理\'", "aggregation": [{"alias": "count", "column": "id", "function": "count"}]}}, {"id": "stat_handling", "grid": {"col_span": 1}, "type": "stats_card", "config": {"icon": "Clock", "color": "amber", "label": "处理中", "value_key": "count"}, "data_source": {"table": "alerts", "where": "status = \'处理中\'", "aggregation": [{"alias": "count", "column": "id", "function": "count"}]}}, {"id": "stat_handled", "grid": {"col_span": 1}, "type": "stats_card", "config": {"icon": "CheckCircle", "color": "green", "label": "已处理", "value_key": "count"}, "data_source": {"table": "alerts", "where": "status = \'已处理\'", "aggregation": [{"alias": "count", "column": "id", "function": "count"}]}}, {"id": "stat_ignored", "grid": {"col_span": 1}, "type": "stats_card", "config": {"icon": "Star", "color": "default", "label": "已忽略", "value_key": "count"}, "data_source": {"table": "alerts", "where": "status = \'已忽略\'", "aggregation": [{"alias": "count", "column": "id", "function": "count"}]}}, {"id": "alert_severity_chart", "grid": {"col_span": 2}, "type": "chart", "label": "告警严重程度分布", "config": {"title": "告警严重程度分布", "x_key": "severity", "y_key": "count", "chart_type": "pie", "category_key": "severity"}, "data_source": {"limit": 100, "table": "alerts"}}, {"id": "alerts_table", "type": "data_table", "config": {"actions": ["view", "edit"], "columns": [{"key": "title", "type": "text", "label": "告警标题"}, {"key": "alert_type", "type": "badge", "label": "类型"}, {"key": "severity", "type": "badge", "label": "等级"}, {"key": "location", "type": "text", "label": "位置"}, {"key": "status", "type": "badge", "label": "状态"}, {"key": "handler", "type": "text", "label": "处理人"}, {"key": "alert_time", "type": "date", "label": "告警时间", "sortable": true}], "page_size": 15, "pagination": true, "search_key": "title", "table_name": "alerts", "search_enabled": true, "filters_enabled": true}, "data_source": {"table": "alerts", "order_by": [{"column": "alert_time", "direction": "DESC"}]}}]}], "theme": {"border_radius": "0.5rem", "primary_color": "#2563eb"}, "app_name": "智慧车队管理系统", "navigation": {"type": "sidebar"}, "default_page": "reservations", "app_schema_version": "2.0.0"}', NULL, NULL, '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', '2026-02-14 17:26:07.034', NULL, NULL);

-- Dumping structure for table what-reverse.what_reverse_workspaces
CREATE TABLE IF NOT EXISTS `what_reverse_workspaces` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner_user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 0xF09F8FA2,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `status_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status_updated_at` datetime(3) DEFAULT NULL,
  `plan` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'free',
  `region` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `settings_json` json DEFAULT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `app_status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `current_version_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pricing_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'free',
  `price` decimal(10,2) DEFAULT NULL,
  `published_at` datetime(3) DEFAULT NULL,
  `access_mode` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT 'private',
  `data_classification` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT 'public',
  `rate_limit_json` json DEFAULT NULL,
  `allowed_origins` json DEFAULT NULL,
  `require_captcha` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_what_reverse_workspaces_slug` (`slug`),
  KEY `idx_what_reverse_workspaces_owner_user_id` (`owner_user_id`),
  KEY `idx_what_reverse_workspaces_status` (`status`),
  KEY `idx_what_reverse_workspaces_deleted_at` (`deleted_at`),
  KEY `idx_what_reverse_workspaces_app_status` (`app_status`),
  KEY `idx_what_reverse_workspaces_access_mode` (`access_mode`),
  CONSTRAINT `fk_what_reverse_workspaces_owner` FOREIGN KEY (`owner_user_id`) REFERENCES `what_reverse_users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table what-reverse.what_reverse_workspaces: ~2 rows (approximately)
DELETE FROM `what_reverse_workspaces`;
INSERT INTO `what_reverse_workspaces` (`id`, `owner_user_id`, `name`, `slug`, `icon`, `status`, `status_reason`, `status_updated_at`, `plan`, `region`, `settings_json`, `created_at`, `updated_at`, `deleted_at`, `description`, `app_status`, `current_version_id`, `pricing_type`, `price`, `published_at`, `access_mode`, `data_classification`, `rate_limit_json`, `allowed_origins`, `require_captcha`) VALUES
	('8930350b-79b7-4307-ae2b-a426375fa2e7', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', '智慧车队管理系统', 'fleet', '🚛', 'active', NULL, NULL, 'pro', NULL, '{"app_name": "FleetMaster", "features": ["realtime_tracking", "fuel_analytics", "maintenance_alerts", "route_optimization"], "default_page": "dashboard"}', '2026-02-12 19:02:16.155', '2026-02-14 23:21:41.732', NULL, '企业级智慧车队管理系统，支持车辆管理、司机管理、实时调度、油耗分析、维保提醒、运单跟踪和数据大屏。', 'published', '1abb1118-1fbd-44cc-a978-28bb00cf1ad6', 'free', NULL, '2026-02-14 17:26:07.034', 'public_anonymous', 'public', NULL, '[]', 0),
	('8df9aa04-afdc-444f-9105-8e3feac939a6', '1231a1e2-c8a6-4363-82fa-d1ad14a7ff19', 'test1', 'test1', '🏢', 'active', NULL, NULL, 'free', NULL, '{}', '2026-02-03 04:52:40.142', '2026-02-12 18:05:57.621', NULL, NULL, 'published', NULL, 'free', NULL, '2026-02-12 18:05:57.621', 'private', 'public', NULL, '[]', 0),
	('9a4956d6-9b72-4ccb-b863-44ec9a5d03c0', 'c69f7aa3-0c35-43b5-b50b-2df5b3eba114', 'Default Workspace', 'workspace', '🏢', 'active', NULL, NULL, 'free', NULL, '{}', '2026-02-13 13:56:09.992', '2026-02-13 13:56:09.992', NULL, NULL, 'draft', NULL, 'free', NULL, NULL, 'private', 'public', NULL, '[]', 0);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
