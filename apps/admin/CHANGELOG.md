# Changelog

All notable changes to the Admin application will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- 用户管理：账号安全操作（强制下线、重置密码、风险标记）
- 用户管理：批量用户处置（批量冻结/角色调整）
- 用户管理：用户资产视图（工作空间、应用、用量汇总）
- Workspace：数据导出与日志归档
- Workspace：DB 运维入口（迁移、密钥轮换）
- Workspace：成员与角色管理
- Workspace：配额与用量视图
- Workspace：计划调整与历史记录
- 应用管理：版本与发布流程管理
- 应用管理：市场上架审核与评分管理
- 应用管理：访问策略与域名绑定
- 应用管理：Webhook 管理与投递日志
- 工作流：运行队列与执行耗时分析
- 工作流：执行失败原因分布与回放
- 对话管理：对话模板管理
- 对话管理：敏感内容审核
- 对话管理：模型提示词与策略管理
- 模板管理：公开内容审核
- 模板管理：版本管理与回滚
- 计费管理：异常与纠错流程
- 计费管理：规则变更记录与审计
- 安全合规：合规视图
- 安全合规：供应链与依赖扫描视图
- 安全合规：审计日志导出与留存策略
- 指标分析：关键指标订阅与导出

### Changed
- 无

### Deprecated
- 无

### Removed
- 无

### Fixed
- 无

### Security
- 无

---

## [0.1.0] - 2026-02-03

### Added

#### 基础框架
- 项目初始化与工程配置
- Next.js 15 + React 19 + TypeScript 技术栈
- Tailwind CSS 4 样式系统
- Tanstack Query 数据管理
- Zustand 状态管理
- 统一 UI 组件库（对齐 apps/web）

#### 认证与权限
- 管理员登录与会话管理
- 基于能力点的权限控制
- 权限矩阵配置
- 敏感操作审计

#### 用户管理
- 用户列表（搜索、状态、角色筛选）
- 用户详情页
- 角色与状态调整

#### Workspace 管理
- Workspace 列表
- Workspace 详情
- 状态调整（冻结/恢复/删除）

#### 应用管理
- 应用列表
- 应用详情
- 状态调整与下架

#### 工作流管理
- 工作流列表
- 工作流详情与版本
- 执行记录与日志

#### 对话管理
- 对话列表与详情
- AI 创意任务管理
- 模型用量概览

#### 计费管理
- 计费概览
- 账单与发票管理
- 收入与分成结算
- 退款处理

#### 客服支持
- 工单管理
- 支持渠道配置
- SLA 配置

#### 安全配置
- 配置中心
- 密钥管理
- 审计日志

#### 系统治理
- 系统健康监控
- Feature Flags 管理
- 任务监控

#### 体验优化
- 全局搜索
- 批量操作
- 导出功能
- 键盘快捷键

### Security
- 实现 RBAC 权限控制
- 敏感字段脱敏
- 操作审计日志
- CSRF/XSS 防护

---

## Release Notes Template

### Version X.Y.Z

**发布日期：** YYYY-MM-DD

**发布类型：** Major / Minor / Patch

**发布说明：**

简要描述本次发布的主要内容和目的。

**新增功能：**
- 功能 1：简要描述
- 功能 2：简要描述

**改进优化：**
- 优化 1：简要描述
- 优化 2：简要描述

**问题修复：**
- 修复 1：简要描述
- 修复 2：简要描述

**已知问题：**
- 问题 1：描述及临时解决方案

**升级说明：**
1. 步骤 1
2. 步骤 2

**兼容性说明：**
- API 版本要求：vX.Y.Z
- 数据库迁移：是/否

**回滚说明：**
如需回滚，请按以下步骤操作：
1. 步骤 1
2. 步骤 2
