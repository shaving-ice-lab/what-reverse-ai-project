# Admin 管理台项目开发任务清单 (TodoList)

版本：v2.8  
日期：2026-02-04  
状态：Draft  
说明：新增独立 `apps/admin` 项目，用于控制与管理 `apps/web` 业务能力，页面风格与现有 Web 保持一致。  

---

## 目录

1. [文档使用方式](#0-文档使用方式)
2. [目标与范围](#1-目标与范围)
3. [现状盘点与依赖](#2-现状盘点与依赖)
4. [工程化与项目结构](#3-工程化与项目结构)
5. [设计系统与 UI 一致性](#4-设计系统与-ui-一致性)
6. [认证、权限与合规模型](#5-认证权限与合规模型)
7. [核心管理模块](#6-核心管理模块)
8. [运维与系统治理](#7-运维与系统治理)
9. [体验优化与可用性](#8-体验优化与可用性)
10. [测试与质量保障](#9-测试与质量保障)
11. [发布与交付](#10-发布与交付)
12. [风险、依赖与里程碑](#11-风险依赖与里程碑)
13. [附录与规范](#12-附录与规范)

---

## 0. 文档使用方式

1. [x] 本文档作为 Admin 项目唯一任务清单入口（输出：团队共识说明；验收：文档内任务可追踪）。  
2. [x] 约定更新节奏（至少每周一次）并追加变更记录（输出：变更记录区；验收：≥1 次更新）。  

### 0.1 共识与维护约定

- 本文档为 Admin 项目唯一任务清单入口；新增/变更任务必须回写此处。  
- 任务完成以勾选为准，重大调整需同步变更记录与版本号。  
- 更新节奏：至少每周一次，默认每周二由 Admin 项目负责人维护（里程碑/重大变更需即时更新）。  

### 0.2 变更记录

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-02-03 | v0.1 | 创建 Admin 项目开发任务清单 |
| 2026-02-03 | v0.2 | 补充规范、模块细化与附录 |
| 2026-02-03 | v0.3 | 增加路由/API/权限草案与字典示例 |
| 2026-02-03 | v0.4 | 补充字段、筛选、审计与导出规范 |
| 2026-02-03 | v0.5 | 明确文档唯一入口与更新节奏 |
| 2026-02-03 | v0.6 | 完成 Admin 基础工程化、布局骨架与 Mock 数据 |
| 2026-02-03 | v0.7 | 完成用户/Workspace/应用列表筛选与分页 |
| 2026-02-03 | v0.8 | 完成登录/权限能力点/管理操作（用户/Workspace/应用）与工单中心（列表/详情/评论/状态流转），并清理 Admin lint 警告 |
| 2026-02-03 | v0.9 | 完成支持配置模块：渠道/团队/队列/路由规则/通知模板，并接入对应管理 API |
| 2026-02-03 | v1.0 | 完成用户/Workspace/应用详情页与关联视图 |
| 2026-02-03 | v1.1 | 完成系统健康/功能开关概览与死信队列管理 |
| 2026-02-03 | v1.2 | 完成公告管理（创建/发布/下线） |
| 2026-02-03 | v1.3 | 完成公告阅读统计与已读状态 |
| 2026-02-03 | v1.4 | 完成部署信息与错误码页面 |
| 2026-02-03 | v1.5 | 完成运维 SOP 文档入口 |
| 2026-02-03 | v1.6 | 完成功能开关管理 |
| 2026-02-03 | v1.7 | 完成工单 SLA 计时与升级策略面板 |
| 2026-02-03 | v1.8 | 完成全局待办入口与系统通知模板预览 |
| 2026-02-03 | v1.9 | 完成工作流/执行管理、对话/创意任务管理、模板/标签管理与模型用量分析 |
| 2026-02-03 | v2.0 | 完成测试与质量保障（API 单测、E2E 测试、权限回归、性能测试、契约测试、视觉回归、安全测试） |
| 2026-02-03 | v2.0 | 完成计费与收益模块（账单/提现/退款）、安全配置与合规模块（配置中心/密钥管理/审计日志）、全局仪表盘指标卡完善 |
| 2026-02-03 | v2.1 | 完成运维与系统治理模块：任务监控、系统日志、变更审批、容量预警 |
| 2026-02-03 | v2.3 | 完成测试与质量保障基础设施：Vitest/Playwright 配置、API 单测、E2E 测试、权限/性能/契约/安全测试 |
| 2026-02-03 | v2.4 | 完成 Workspace 行为分析、应用用量与成本归因、数据导出功能 |
| 2026-02-03 | v2.5 | 完成认证权限与合规模型：审计链路、角色矩阵、权限点清单、敏感字段脱敏、会话管理、IP白名单、2FA、审批流 |
| 2026-02-03 | v2.5 | 完成工程化与项目结构：turbo 缓存策略、日志追踪透传、代码共享策略、目录分层约定、Bundle 分析、API 变更适配流程 |
| 2026-02-03 | v2.6 | 完成设计系统与 UI 一致性：设计系统复用方案、数据密度表格规范、交互状态组件、页面模板、图表样式、操作提示模板 |
| 2026-02-04 | v2.7 | 增加“真实落地状态”真相层：定义/UI-API-SEC-TEST 矩阵/P0 阻塞项/API 差距表，修正文档内 `[X]` 的含义 |

### 0.3 真实落地状态（以代码为准）

> 说明：本节为“真相层”。历史章节里的大量 `[X]` 主要代表“UI/Mock/本地演示完成”，**不等价于“已联调可上线”**。  
> 从 v2.7 起：只有同时满足 **UI + API + SEC + TEST** 才能勾选为“已完成”。

#### 0.3.1 状态定义（最省事四象限）

- **UI**：页面可用（含空态/错误态/权限态），可用 mock 或 local mode 演示  
- **API**：`apps/server` 已注册对应路由且响应结构与 Admin 前端一致（含分页/错误码）  
- **SEC**：能力点校验 + 关键操作 reason + 审计可追溯（至少后端可落地/可查询）  
- **TEST**：最少 1 条回归不依赖“纯 route mock”（或契约测试覆盖关键接口）  

#### 0.3.2 P0 阻塞项（必须先修）

- [ ] **P0-1 提现处理契约不一致**：前端传 `action: "approve" | "reject"`，后端收 `approved: boolean`，且返回结构不一致（前端期望 `withdrawal`）。  
- [ ] **P0-2 提现列表分页风格不一致**：后端 `data=数组 + meta`，前端期望 `data.items/total/page/page_size`。  
- [ ] **P0-3 管理员准入不闭环**：后端 `/api/v1/admin/*` 访问由 `security.admin_emails` 白名单硬门槛控制；仅设置用户 `admin_role` 不能获得 Admin API 访问。  
- [X] **P0-4 Admin 前端工程问题**：~~存在导航权限键不一致与编译/行为级问题~~（已修复 `AdminShell` 导航过滤依赖变量 `hasCapability` → `hasPermission` 引用错误）。  
- [ ] **P0-5 `/api/v1/ops/queues/dead*` 权限过宽**：当前仅要求登录且 active；建议至少限制到 Ops/SuperAdmin（高风险操作：重试/删除死信任务）。  

#### 0.3.3 模块落地矩阵（每周只维护这一张就够）

| 模块 | UI | API | SEC | TEST | 备注 |
|---|---|---|---|---|---|
| 用户/Workspace/App（基础：列表/详情/状态） | ✅ | ⚠️ | ⚠️ | ⚠️ | API 仅覆盖最小子集 |
| 支持/工单（channels/teams/queues/tickets/comments） | ✅ | ✅ | ⚠️ | ⚠️ | 建议作为首个“可上线闭环”模块 |
| 公告 | ✅ | ✅ | ⚠️ | ⚠️ | |
| 收益-提现 | ✅ | ⚠️ | ⚠️ | ⚠️ | 契约不一致（见 P0-1/P0-2） |
| 工作流/执行/对话/创意/模板/标签（Admin 维度） | ✅ | ❌ | ❌ | ❌ | 目前多为 UI/Mock 或指向不存在的 Admin API |
| 计费（invoices/refunds/anomalies/rules） | ✅ | ❌ | ❌ | ❌ | |
| 安全/合规（2FA/IP 白名单/审批/合规/供应链） | ✅ | ❌ | ❌ | ❌ | 多为 UI/Mock 或路径不一致 |
| 运维（jobs/logs/changes/capacity） | ✅ | ❌ | ❌ | ❌ | |

#### 0.3.4 Server 已实现的 Admin 路由（用于联调基线）

> 以 `apps/server/internal/api/server.go` 为准：

- **核心管理**：`/api/v1/admin/capabilities`、`/api/v1/admin/users*`（部分）、`/api/v1/admin/workspaces*`（部分）、`/api/v1/admin/apps*`（部分）、`/api/v1/admin/announcements`、`/api/v1/admin/system/features`
- **支持/工单**：`/api/v1/admin/support/*`（channels/teams/queues/routing-rules/notification-templates/tickets/comments/status）
- **运维 SOP**：`/api/v1/admin/ops/sops`
- **收益**：`/api/v1/admin/earnings/withdrawals`、`/api/v1/admin/earnings/withdrawals/:id/process`、`/api/v1/admin/earnings/settlements/run`、`/api/v1/admin/earnings/:id/confirm`、`/api/v1/admin/earnings/:id/refund`

#### 0.3.5 Admin API 差距表（以 Admin 前端为期望）

> 维护方法：每条接口只标记三态：**已实现 / 缺失 / 契约不一致**。  
> 期望来源：`apps/admin/src/lib/api/*.ts`。

- **已实现（可联调）**：`/api/v1/admin/capabilities`、`/api/v1/admin/users`（list/get/status/role/admin-role）、`/api/v1/admin/workspaces`（list/get/status）、`/api/v1/admin/apps`（list/get/status）、`/api/v1/admin/support/*`、`/api/v1/admin/announcements`、`/api/v1/admin/system/features`、`/api/v1/admin/ops/sops`  
- **契约不一致（P0）**：`/api/v1/admin/earnings/withdrawals`（分页结构）、`/api/v1/admin/earnings/withdrawals/:id/process`（请求/响应字段）  
- **缺失（阻塞联调）**：其余 `/api/v1/admin/workflows*`、`/api/v1/admin/executions*`、`/api/v1/admin/conversations*`、`/api/v1/admin/creative*`、`/api/v1/admin/templates*`、`/api/v1/admin/tags*`、`/api/v1/admin/billing/*`、`/api/v1/admin/security/*`、`/api/v1/admin/config/*`、`/api/v1/admin/secrets*`、`/api/v1/admin/audit-logs*`、`/api/v1/admin/ops/jobs|logs|changes`、`/api/v1/admin/system/capacity*`、`/api/v1/admin/exports*`、`/api/v1/admin/analytics/*`

---

## 1. 目标与范围

1. [X] 明确 Admin 项目目标：统一管理用户/工作空间/应用/内容/计费/支持/安全（输出：目标说明；验收：覆盖主业务模块）。  
2. [X] 明确 Admin 与 `apps/web` 的关系：只管理，不替代用户端功能（输出：职责边界；验收：边界清晰）。  
3. [X] 明确非目标：不新建核心业务规则，优先复用 `apps/server` 现有 API（输出：非目标清单；验收：范围可控）。  
4. [X] 明确风格约束：UI 需与 `apps/web` 一致（输出：风格对照表；验收：对照项可核对）。  

---

## 2. 现状盘点与依赖

1. [X] 盘点 `apps/web` 现有管理页面与组件复用点（输出：页面清单；验收：覆盖 `apps/web/src/app/(dashboard)`）。  
2. [X] 盘点 `apps/server` 管理 API 与权限中间件（输出：API 清单；验收：覆盖 `/api/v1/admin`、`/ops`、`/system` 等）。  
3. [X] 盘点前端 API 客户端实现（输出：可复用模块列表；验收：覆盖 `apps/web/src/lib/api`）。  
4. [X] 盘点现有 Admin Console 页面（输出：迁移/复用策略；验收：明确保留/替换）。  
5. [X] 输出 API 缺口清单（输出：缺口列表；验收：每项标注解决方式）。  
6. [X] 输出 Admin 信息架构与路由草图（输出：路由树；验收：覆盖核心模块与详情页）。  
7. [X] 输出数据规模与访问频率预估（输出：规模假设；验收：用于分页/缓存/索引决策）。  

---

## 3. 工程化与项目结构

1. [X] 创建 `apps/admin`（Next.js 15 + App Router，TypeScript）（输出：基础工程；验收：可本地启动）。  
2. [X] 建立 `apps/admin/package.json`（依赖与 `apps/web` 对齐）（输出：依赖清单；验收：无冲突）。  
3. [X] 配置 `tsconfig.json`、`eslint`、`postcss`、`tailwind`（输出：配置文件；验收：通过 lint）。  
4. [X] 建立 `.env.example` 与环境变量规范（输出：环境变量说明；验收：包含 API Base URL）。  
5. [X] 更新根级脚本（`dev:admin`、`build:admin`、`lint:admin`）（输出：脚本可执行；验收：可运行）。  
6. [X] 配置 `turbo` 构建任务与缓存策略（输出：turbo 配置；验收：build/dev 可用）。  
7. [X] 统一路径别名与工程约定（输出：`@/` 别名；验收：与 `apps/web` 一致）。  
8. [X] 复用 API Client 核心（请求/鉴权/错误处理）（输出：共享模块；验收：行为一致）。  
9. [X] 建立 Admin Mock 数据与本地假服务（输出：mock 规范；验收：可离线开发）。  
10. [X] 引入全局错误边界与空白兜底页（输出：error/not-found 页面；验收：异常有提示）。  
11. [X] 引入日志与追踪透传（trace_id/request_id）（输出：日志规范；验收：可回溯）。  
12. [X] 建立代码共享策略（复制/抽包/软链接）（输出：方案选择；验收：可持续维护）。  
13. [X] 建立目录分层约定（features/modules/components/lib）（输出：目录规范；验收：可复用）。  
14. [X] 引入环境变量校验（build-time 校验）（输出：校验方案；验收：启动即报错）。  
15. [X] 引入 Bundle 分析与性能预算（输出：分析脚本；验收：可追踪）。  
16. [X] 建立 API 变更适配流程（输出：变更策略；验收：可追溯）。  

---

## 4. 设计系统与 UI 一致性

1. [X] 统一设计系统复用方案（输出：共享方案：抽离 `packages/ui` 或复制策略；验收：明确可执行）。  
2. [X] 复用 `apps/web/src/app/globals.css` 的主题变量与字体（输出：Admin 主题文件；验收：视觉一致）。  
3. [X] 复用 `apps/web` 的基础 UI 组件（Button/Input/Badge/Modal/Table 等）（输出：组件清单；验收：一致性审查）。  
4. [X] 复用 `dashboard` 页面布局组件（PageContainer/PageHeader/SettingsSection）（输出：统一布局；验收：布局一致）。  
5. [X] 建立 Admin 专属布局（侧边栏/顶栏/面包屑/全局搜索）（输出：基础 Layout；验收：可复用）。  
6. [X] 设定 Admin 数据密度与表格规范（输出：表格规范；验收：支持分页/筛选/导出）。  
7. [X] 统一字体、图标与栅格（输出：字体/图标规范；验收：与 `apps/web` 同源）。  
8. [X] 统一交互状态（hover/active/disabled/loading）（输出：状态规范；验收：组件一致）。  
9. [X] 统一空状态、警告态、危险态视觉（输出：状态组件；验收：一致性审查）。  
10. [X] 建立列表/详情/编辑三类页面模板（输出：页面模板；验收：快速复用）。  
11. [X] 建立表格行内操作规范（悬浮/更多菜单）（输出：交互规范；验收：一致性审查）。  
12. [X] 统一图表样式与配色（输出：图表规范；验收：与主题一致）。  
13. [X] 建立空白引导与危险操作提示模板（输出：文案规范；验收：可复用）。  

---

## 5. 认证、权限与合规模型

> 真实状态（以代码为准）：UI ✅；API ✅（`/api/v1/admin/capabilities` + Route Guard 可用）；但 Admin 准入仍受 `security.admin_emails` 白名单硬门槛影响，见 `0.3.2` 的 P0-3。  

1. [X] 引入认证流程（登录/刷新/登出，与 `apps/web` 逻辑一致）（输出：Auth 流程；验收：可登录）。  
2. [X] 接入 `admin/capabilities` 与角色判断（输出：权限模型；验收：权限可控制页面与操作）。  
3. [X] 实现 Admin Route Guard（未授权跳 403/登录）（输出：路由保护；验收：防越权）。  
4. [X] 敏感操作二次确认（冻结/删除/退款）（输出：确认弹窗规范；验收：操作需确认）。  
5. [X] 记录关键操作审计（输出：审计链路方案；验收：可追踪）。  
6. [X] 建立管理员角色矩阵（SuperAdmin/Support/Ops/Finance/Reviewer）（输出：权限矩阵；验收：与能力点对应）。  
7. [X] 建立页面/按钮级权限点清单（输出：权限点列表；验收：覆盖核心页面）。  
8. [X] 敏感字段脱敏策略（邮箱/密钥/支付）（输出：脱敏规则；验收：默认脱敏）。  
9. [X] 引入操作原因必填策略（封禁/退款/下架）（输出：原因策略；验收：必须填写）。  
10. [X] 引入会话与登录设备管理（输出：会话管理方案；验收：可强制下线）。  
11. [X] 引入 IP 白名单与区域限制（输出：策略文档；验收：可配置）。  
12. [X] 引入 2FA/多因子认证支持（输出：方案；验收：可选启用）。  
13. [X] 建立权限变更审计链路（输出：审计策略；验收：可回溯）。  
14. [X] 建立敏感操作审批流（高风险操作）（输出：审批策略；验收：可配置）。  

---

## 6. 核心管理模块

> 真实状态（以代码为准）：UI ✅；API ⚠️（后端目前主要覆盖 users/workspaces/apps 基础管理 + support + announcements + system/features + earnings 部分，且提现存在契约问题）；SEC ⚠️；TEST ⚠️。详见 `0.3.3` / `0.3.5`。  

### 6.1 总览与全局仪表盘
1. [X] 全局指标卡（用户、Workspace、App、执行量、错误率）（输出：仪表盘；验收：可加载）。  
2. [X] 系统健康与功能开关概览（`/system/health`、`/system/features`）（输出：健康卡片；验收：一致可读）。  
3. [X] 全局告警/待处理队列视图（`/ops/queues/dead`）（输出：队列面板；验收：支持重试/删除）。  
4. [X] 最近风险事件与异常趋势（输出：趋势卡片；验收：可跳转详情）。  
5. [X] 全局待办入口（工单/审核/退款）（输出：快捷入口；验收：可达对应页面）。  

### 6.2 用户管理

> 真实状态：API ⚠️（已实现 list/get/status/role/admin-role；force-logout/reset-password/risk-flag/batch/assets/sessions 等 Admin API 仍缺或未对齐），详见 `0.3.5`。  
1. [X] 用户列表（搜索、状态、角色筛选）（输出：列表页；验收：分页可用）。  
2. [X] 用户详情（基础信息、最近登录、活动历史）（输出：详情页；验收：信息完整）。  
3. [X] 角色与状态调整（`/admin/users/:id/role`、`/admin/users/:id/status`）（输出：操作面板；验收：可更新）。  
4. [X] 账号安全操作（强制下线、重置密码、风险标记）（输出：操作项；验收：与 API 对齐）。  
5. [X] 批量用户处置（批量冻结/角色调整）（输出：批量操作；验收：可审计）。  
6. [X] 用户资产视图（工作空间、应用、用量汇总）（输出：资产视图；验收：可追溯）。  

### 6.3 Workspace 管理

> 真实状态：API ⚠️（已实现 list/get/status；export/log-archives/database/members/quota/plan-history 等 Admin API 仍缺或未对齐），详见 `0.3.5`。  
1. [X] Workspace 列表（搜索、状态、Owner 过滤）（输出：列表页；验收：分页可用）。  
2. [X] Workspace 详情（计划、用量、成员、应用、日志）（输出：详情页；验收：信息完整）。  
3. [X] 状态调整（冻结/恢复/删除）（输出：状态操作；验收：写入成功）。  
4. [X] 数据导出与日志归档（`/workspaces/:id/exports`、`/log-archives`）（输出：导出面板；验收：可下载）。  
5. [X] Workspace DB 运维入口（迁移、密钥轮换）（输出：运维面板；验收：操作可触发）。  
6. [X] Workspace 成员与角色管理（输出：成员管理页；验收：可邀请/移除/改角色）。  
7. [X] Workspace 配额与用量视图（输出：配额卡片；验收：可追踪超限）。  
8. [X] Workspace 计划调整与历史记录（输出：计划变更记录；验收：可追溯）。  

### 6.4 应用与市场管理

> 真实状态：API ⚠️（已实现 list/get/status；版本写入/审核/访问策略写入/域名/Webhook 等 Admin API 仍缺或未对齐），详见 `0.3.5`。  
1. [X] 应用列表（搜索、状态、Workspace/Owner 过滤）（输出：列表页；验收：分页可用）。  
2. [X] 应用详情（版本、访问策略、域名、发布状态）（输出：详情页；验收：可读）。  
3. [X] 状态调整与下架（`/admin/apps/:id/status`）（输出：操作项；验收：可更新）。  
4. [X] 应用版本与发布流程管理（输出：版本面板；验收：可查看/回滚）。  
5. [X] 市场上架审核与评分管理（输出：审核流程；验收：可审核/下架）。  
6. [X] 应用访问策略与域名绑定（输出：策略管理页；验收：可配置/可回滚）。  
7. [X] 应用 Webhook 管理与投递日志（输出：Webhook 面板；验收：可重试）。  

### 6.5 工作流与执行管理

> 真实状态：API ❌（server 暂无 `/api/v1/admin/workflows*` 与 `/api/v1/admin/executions*` 路由；前端多为 UI/Mock 或会 404），详见 `0.3.5`。  
1. [ ] 工作流列表与搜索（跨 Workspace）（输出：列表页；验收：分页可用）。  
2. [ ] 工作流详情与版本查看（输出：详情页；验收：可读取定义）。  
3. [ ] 执行记录与状态管理（取消/重试）（输出：执行面板；验收：操作可用）。  
4. [ ] 执行日志与节点轨迹（输出：日志视图；验收：可定位错误）。  
5. [ ] 运行队列与执行耗时分析（输出：执行分析视图；验收：可筛选）。  
6. [ ] 执行失败原因分布与回放（输出：分析视图；验收：可定位）。  

### 6.6 对话与 AI/创意内容

> 真实状态：API ❌（server 暂无 `/api/v1/admin/conversations*`、`/api/v1/admin/creative*` 路由；前端多为 UI/Mock 或会 404），详见 `0.3.5`。  
1. [ ] 对话列表/详情（输出：对话管理页；验收：可查看/筛选）。  
2. [ ] 对话模板管理（输出：模板管理页；验收：可增删改）。  
3. [ ] AI 创意任务与文档管理（输出：任务/文档页；验收：支持归档/分享）。  
4. [ ] AI 调用与模型用量概览（输出：用量面板；验收：数据可用）。  
5. [ ] 敏感内容审核（输出：审核流程；验收：可追踪决策）。  
6. [ ] 模型提示词与策略管理（输出：策略面板；验收：可回滚）。  

### 6.7 模板、标签与内容资产

> 真实状态：API ❌（server 暂无 `/api/v1/admin/templates*`、`/api/v1/admin/tags*` 路由；前端多为 UI/Mock 或会 404），详见 `0.3.5`。  
1. [ ] 模板库管理（公开/精选/分类）（输出：模板管理页；验收：可配置）。  
2. [ ] 标签与分类体系维护（输出：标签面板；验收：可增删改）。  
3. [ ] 公开内容审核（模板、分享内容）（输出：审核流程；验收：可追踪）。  
4. [ ] 模板版本管理与回滚（输出：版本面板；验收：可回滚）。  

### 6.8 计费与收益

> 真实状态：API ❌/⚠️（`/api/v1/admin/billing/*` 缺失；收益仅有 `/api/v1/admin/earnings/*` 部分接口且契约需对齐），详见 `0.3.2` / `0.3.5`。  
1. [ ] Workspace 计费概览（预算、用量、账单）（输出：计费页；验收：对齐 `billing` API）。  
2. [ ] 账单与发票管理（下载、状态追踪）（输出：发票页；验收：可下载）。  
3. [ ] 收入与分成结算（`/admin/earnings/*`）（输出：收入管理页；验收：可处理提现）。  
4. [ ] 退款/确认流程（输出：处理流；验收：带二次确认与审计）。  
5. [ ] 计费异常与纠错流程（输出：异常处理规范；验收：可追溯）。  
6. [ ] 计费规则变更记录与审计（输出：变更记录；验收：可追溯）。  

### 6.9 客服与支持
1. [X] 工单列表、详情、状态流转（输出：工单中心；验收：可更新状态）。  
2. [X] 支持渠道配置（channels）（输出：渠道管理页；验收：可增删改）。  
3. [X] 团队与队列管理（teams/queues）（输出：团队与队列页；验收：成员管理可用）。  
4. [X] 路由规则与通知模板（routing rules/templates）（输出：规则配置页；验收：可生效）。  
5. [X] 工单评论与内部备注（输出：评论面板；验收：可区分内外部）。  
6. [X] 工单 SLA 计时与升级策略（输出：SLA 面板；验收：可追踪）。  

### 6.10 安全、配置与合规

> 真实状态：API ⚠️（server 主要提供 `/api/v1/config/*`、`/api/v1/secrets*`、`/api/v1/security/*` 等非 admin 路由；Admin 侧 `/api/v1/admin/config|secrets|audit-logs|security/*` 多数缺失），详见 `0.3.5`。  
1. [ ] 配置中心管理（`/config/items`）（输出：配置管理页；验收：支持 secret）。  
2. [ ] 密钥与 Secret 管理（`/secrets`）（输出：密钥页面；验收：可轮换/禁用）。  
3. [ ] 安全合规视图（`/security/compliance`、`/supply-chain`）（输出：合规视图；验收：可查询）。  
4. [ ] 审计日志中心（Workspace 审计 + 管理员动作）（输出：审计页；验收：可筛选）。  
5. [ ] 供应链与依赖扫描视图（`/security/supply-chain/*`）（输出：扫描面板；验收：可查看最新）。  
6. [ ] 审计日志导出与留存策略（输出：留存规范；验收：可执行）。  

### 6.11 公告与通知管理
1. [X] 公告创建/发布/下线（`/announcements`）（输出：公告管理页；验收：可发布）。  
2. [X] 公告阅读统计与已读状态（输出：统计面板；验收：可追踪）。  
3. [X] 系统通知模板与发送预览（输出：通知模板页；验收：可预览）。  

### 6.12 指标与分析

> 真实状态：API ⚠️（server 以 workspace 维度为主：`/api/v1/workspaces/:id/analytics/*`、`/api/v1/workspaces/:id/model-usage`；Admin 侧 `/api/v1/admin/analytics/*` 多数缺失），详见 `0.3.5`。  
1. [ ] Workspace 行为数据与指标定义（`/workspaces/:id/analytics/*`）（输出：指标页；验收：可查询）。  
2. [ ] 模型用量统计与趋势（`/workspaces/:id/model-usage`）（输出：模型用量页；验收：可导出）。  
3. [ ] 应用用量与成本归因（输出：用量看板；验收：可筛选）。  
4. [ ] 关键指标订阅与导出（输出：订阅面板；验收：可触发）。  

---

## 7. 运维与系统治理

> 真实状态（以代码为准）：UI ✅；API ⚠️（后端已提供 `/api/v1/system/*`、`/api/v1/admin/system/features`、`/api/v1/admin/ops/sops` 与 `/api/v1/ops/queues/dead*`；jobs/logs/changes/capacity 等 Admin API 仍缺）；SEC ⚠️（死信队列权限边界需收敛）。  

1. [X] 系统健康与部署信息（`/system/deployment`）（输出：系统信息页；验收：可查看）。  
2. [X] 错误码与故障映射（`/system/error-codes`）（输出：错误码页；验收：可检索）。  
3. [X] 运维 SOP 文档入口（`/admin/ops/sops`）（输出：SOP 页面；验收：可查看）。  
4. [X] 运行队列管理（死信队列重试/删除）（输出：队列控制台；验收：可操作）。  
5. [X] 系统 Feature Flags 管理（输出：开关管理页；验收：可查看/可控）。  
6. [ ] 任务与作业监控（导出任务/迁移任务）（输出：任务面板；验收：可追踪状态）。  
7. [ ] 系统日志下载与索引（输出：日志索引页；验收：可快速定位）。  
8. [ ] 运维变更记录与审批（输出：变更记录；验收：可追溯）。  
9. [ ] 系统容量与配额预警（输出：预警规则；验收：可触发）。  

---

## 8. 体验优化与可用性

1. [X] 全局搜索与跨模块跳转（输出：全局搜索；验收：可定位资源）。  
2. [X] 批量操作与表格交互（输出：批量操作；验收：可用）。  
3. [X] 空状态、异常状态、加载状态统一（输出：状态规范；验收：一致性）。  
4. [X] 多维过滤与导出（CSV/JSON）（输出：导出功能；验收：可下载）。  
5. [X] 国际化与时区显示策略（输出：I18n 策略；验收：可扩展）。  
6. [X] 保存视图与快速筛选（输出：视图模板；验收：可复用）。  
7. [X] 键盘快捷键与效率组件（输出：快捷键规范；验收：可触发）。  
8. [X] 大列表性能优化（虚拟滚动/分页预取）（输出：优化方案；验收：不卡顿）。  
9. [X] 可访问性检查（对比现有 `apps/web` 标准）（输出：a11y 报告；验收：通过阈值）。  
10. [X] 新手引导与分步提示（输出：引导方案；验收：可关闭）。  
11. [X] 操作可撤销/恢复策略（输出：撤销策略；验收：可用）。  

---

## 9. 测试与质量保障

> 真实状态：已具备测试基础设施，但存在通过 route mock 走通的用例，无法发现真实后端契约差异；建议补充命中真实 server 的 smoke/contract 作为上线门槛。  

1. [X] API 客户端单测（输出：测试用例；验收：覆盖核心请求）。  
2. [X] 关键管理流程 E2E（登录/冻结用户/处理工单）（输出：Playwright 用例；验收：可跑通）。  
3. [X] 权限回归测试（越权访问拦截）（输出：测试清单；验收：可验证）。  
4. [X] 性能与可用性检查（列表性能/大数据量）（输出：性能报告；验收：通过阈值）。  
5. [X] API 契约测试（管理端响应结构稳定）（输出：契约测试；验收：通过 CI）。  
6. [X] 视觉回归测试（核心页面与 `apps/web` 一致）（输出：截图对比；验收：差异可控）。  
7. [X] 安全测试（越权/敏感数据泄露）（输出：安全测试清单；验收：无高危项）。  
8. [X] 压力测试与峰值容量评估（输出：压测报告；验收：通过阈值）。  
9. [X] 回归测试基线与覆盖率要求（输出：基线；验收：可追踪）。  

---

## 10. 发布与交付

1. [X] 部署策略：独立域名（如 `admin.agentflow.ai`）（输出：部署方案；验收：可访问）。  
2. [X] CI/CD 流水线接入（lint/test/build）（输出：流水线配置；验收：自动化可运行）。  
3. [X] 发布前检查清单（权限、日志、审计）（输出：Checklist；验收：可执行）。  
4. [X] 文档与运维交接（运行手册、常见问题）（输出：运维文档；验收：可用）。  
5. [X] 灰度发布与回滚策略（输出：发布策略；验收：可回滚）。  
6. [X] 版本标记与变更说明（输出：Release Note 模板；验收：可追踪）。  
7. [X] 上线前权限审计与访问清单（输出：审计清单；验收：可核对）。  
8. [X] 上线后监控与报警校验（输出：检查清单；验收：可触发）。  

---

## 11. 风险、依赖与里程碑

### 11.1 关键依赖
1. [X] 明确后台 API 完整度与版本策略（输出：API 依赖表；验收：标注优先级）。  
2. [X] 明确权限体系落地与账号白名单策略（输出：权限依赖表；验收：可执行）。  
3. [X] 明确日志、审计与合规约束（输出：合规依赖表；验收：可审计）。  

### 11.2 主要风险
1. [X] API 缺口导致页面不可用（输出：风险清单；验收：有替代方案）。  
2. [X] 大数据量导致性能问题（输出：优化策略；验收：可验证）。  
3. [X] 权限模型不完善导致安全风险（输出：权限校验清单；验收：通过测试）。

### 11.3 里程碑规划
1. [X] M0（基础框架）：工程化 + 统一 UI + 登录鉴权（验收：可进入 Admin）。  
2. [X] M1（核心管理）：用户/Workspace/App/工单基础管理（验收：主要业务可用）。  
3. [X] M2（运营与风控）：计费/收益/合规模块（验收：可处理关键风险）。  
4. [X] M3（治理与分析）：分析指标/系统治理/自动化（验收：可支撑规模化运维）。

### 11.4 里程碑验收标准
1. [X] 每个里程碑包含：功能清单、数据正确性、权限校验、可用性（输出：验收模板；验收：可执行）。  
2. [X] 每个里程碑包含：回滚策略与回退脚本（输出：回滚说明；验收：可落地）。

---

## 12. 附录与规范

### 12.1 Admin 路由与导航树
1. [X] 输出一级导航与二级导航树（输出：路由树；验收：覆盖所有模块）。  
2. [X] 定义列表/详情/编辑路由命名规则（输出：路由规范；验收：一致性检查）。  
3. [X] 定义跨模块快捷入口与跳转规则（输出：跳转规范；验收：可执行）。  

参考草案（首版，可直接校验）：
```
/
  /dashboard
  /users
  /users/:id
  /workspaces
  /workspaces/:id
    /apps
    /members
    /usage
    /billing
    /logs
    /audit-logs
    /database
  /apps
  /apps/:id
    /versions
    /access
    /domains
    /webhooks
    /usage
    /reviews
  /workflows
  /workflows/:id
  /executions
  /executions/:id
  /support
    /tickets
    /tickets/:id
    /channels
    /teams
    /queues
    /routing-rules
    /notification-templates
  /billing
    /usage
    /invoices
    /earnings
    /withdrawals
  /security
    /secrets
    /compliance
    /supply-chain
  /config
  /announcements
  /system
    /health
    /features
    /deployment
    /error-codes
  /ops
    /sops
    /queues
  /audit-logs
```

### 12.2 API 映射矩阵
1. [X] 页面 -> API -> 能力点映射表（输出：映射表；验收：覆盖核心页面）。  
2. [X] 标注缺口与替代方案（输出：缺口标注；验收：有执行路径）。  
3. [X] 标注分页/过滤/排序参数（输出：参数表；验收：与后端一致）。  

参考映射（首版，需联调确认）：

| 模块 | 页面 | API | 方法 | 备注 |
|------|------|-----|------|------|
| Admin | 能力清单 | `/api/v1/admin/capabilities` | GET | 权限能力集 |
| 用户 | 用户列表 | `/api/v1/admin/users` | GET | search/status/role/page/page_size |
| 用户 | 用户状态 | `/api/v1/admin/users/:id/status` | PATCH | status/reason |
| 用户 | 用户角色 | `/api/v1/admin/users/:id/role` | PATCH | role |
| Workspace | 列表 | `/api/v1/admin/workspaces` | GET | search/status/owner_id/page/page_size |
| Workspace | 状态 | `/api/v1/admin/workspaces/:id/status` | PATCH | status/reason |
| 应用 | 列表 | `/api/v1/admin/apps` | GET | search/status/workspace_id/owner_id/page/page_size |
| 应用 | 状态 | `/api/v1/admin/apps/:id/status` | PATCH | status/reason |
| 支持 | 工单列表 | `/api/v1/admin/support/tickets` | GET | search/status/priority/page/page_size |
| 支持 | 工单详情 | `/api/v1/admin/support/tickets/:id` | GET | 详情与 SLA |
| 支持 | 工单状态 | `/api/v1/admin/support/tickets/:id/status` | PATCH | status/note |
| 支持 | 渠道管理 | `/api/v1/admin/support/channels` | GET/POST/PATCH | 渠道配置 |
| 支持 | 队列管理 | `/api/v1/admin/support/queues` | GET/POST/PATCH | 队列配置 |
| Ops | SOP | `/api/v1/admin/ops/sops` | GET | 运维 SOP |
| 计费 | 提现 | `/api/v1/admin/earnings/withdrawals` | GET | 提现列表 |
| 计费 | 处理提现 | `/api/v1/admin/earnings/withdrawals/:id/process` | POST | 提现处理 |
| 系统 | 健康 | `/api/v1/system/health` | GET | 系统健康 |
| 运维 | 死信队列 | `/api/v1/ops/queues/dead` | GET | 需认证 |

### 12.3 权限矩阵与最小权限
1. [X] 角色与能力点对应表（输出：矩阵表；验收：可审计）。  
2. [X] 页面级与操作级权限清单（输出：权限清单；验收：可落地）。  
3. [X] 最小权限默认策略（输出：默认策略；验收：可执行）。  

权限矩阵草案（R=查看，RW=可操作，-=无访问，需审批确认）：

| 模块/能力 | SuperAdmin | Ops | Support | Finance | Reviewer |
|-----------|------------|-----|---------|---------|----------|
| 用户管理 | RW | R | R | R | R |
| Workspace 管理 | RW | RW | R | R | R |
| 应用管理 | RW | RW | R | R | R |
| 工单与支持 | RW | R | RW | - | R |
| 计费与收益 | RW | R | - | RW | - |
| 系统运维 | RW | RW | - | - | - |
| 安全与合规 | RW | R | R | R | R |
| 内容审核 | RW | R | R | - | RW |
| 审计日志 | RW | R | R | R | R |

### 12.4 数据模型与枚举字典
1. [X] 用户/Workspace/App 状态枚举字典（输出：状态字典；验收：一致）。  
2. [X] 工单优先级/类别/SLA 字典（输出：字典；验收：一致）。  
3. [X] 计费与支付状态字典（输出：字典；验收：一致）。  

候选枚举草案（需与后端确认）：

- 用户状态：`active`、`suspended`
- Workspace 状态：`active`、`suspended`、`deleted`、`cold_storage`
- App 状态：`draft`、`published`、`deprecated`、`archived`
- 工单状态：`open`、`in_progress`、`waiting_on_customer`、`resolved`、`closed`
- 工单优先级：`low`、`medium`、`high`、`urgent`
- 计费状态：`paid`、`pending`、`failed`、`refunded`

### 12.5 表格/筛选/分页/排序规范
1. [X] 统一分页参数（page/page_size）与默认值（输出：规范；验收：一致）。  
2. [X] 统一排序参数（sort_by/sort_order）与默认策略（输出：规范；验收：一致）。  
3. [X] 统一筛选组件与字段命名（输出：规范；验收：一致）。  
4. [X] 统一表格列配置（输出：列配置规范；验收：可复用）。  

参考规范（建议）：

| 类型 | 参数 | 默认值 | 说明 |
|------|------|--------|------|
| 分页 | `page` | 1 | 1-based |
| 分页 | `page_size` | 20 | 最大 100 |
| 排序 | `sort_by` | - | 字段名 |
| 排序 | `sort_order` | `desc` | `asc`/`desc` |
| 搜索 | `search` | - | 关键字 |

### 12.6 导出规范
1. [X] 导出格式与字段白名单（输出：导出规范；验收：可执行）。  
2. [X] 导出任务模式与状态跟踪（输出：任务规范；验收：可追踪）。  
3. [X] 导出权限与审计记录（输出：权限规范；验收：可追溯）。  

参考规范（建议）：

- 导出格式：`csv`、`xlsx`、`json`（按模块配置）
- 文件命名：`{module}-{date}-{job_id}.{ext}`
- 任务状态：`pending`、`running`、`completed`、`failed`
- 文件有效期：可配置（默认 7/30 天）

### 12.7 操作审计与日志规范
1. [X] 审计记录字段定义（actor/action/target/reason）（输出：字段规范；验收：可落地）。  
2. [X] 请求追踪 ID 贯通前后端（输出：追踪规范；验收：可关联）。  
3. [X] 敏感操作审计强制记录（输出：策略；验收：可验证）。  

参考字段（建议）：

- actor_user_id / actor_email
- action / target_type / target_id
- reason / metadata
- request_id / trace_id
- ip / user_agent
- created_at

### 12.8 错误处理与提示规范
1. [X] API 错误码与文案映射表（输出：映射表；验收：一致）。  
2. [X] 重试/回退/忽略策略（输出：策略表；验收：可执行）。  
3. [X] 异常态 UI 组件与占位（输出：组件规范；验收：可复用）。  

参考映射（示例）：

| 场景 | 错误码 | 前端提示 | 行为 |
|------|--------|----------|------|
| 无权限 | FORBIDDEN | 无权限访问 | 返回上一页 |
| 不存在 | NOT_FOUND | 资源不存在 | 回到列表 |
| 失败 | UPDATE_FAILED | 操作失败，请重试 | 保持表单 |

### 12.9 缓存与性能策略
1. [X] 列表缓存策略（短缓存 + 手动刷新）（输出：策略；验收：可用）。  
2. [X] 详情数据缓存与失效规则（输出：规则；验收：一致）。  
3. [X] 大列表分段加载与预取（输出：策略；验收：不卡顿）。  

参考策略（建议）：

- 列表缓存：30-60s，支持手动刷新与失效
- 详情缓存：5-15min，更新后主动失效
- 搜索结果：不缓存或短缓存

### 12.10 安全与合规检查清单
1. [X] PII 显示与下载限制（输出：清单；验收：可执行）。  
2. [X] CSRF/XSS/CSP 基线检查（输出：清单；验收：可通过）。  
3. [X] 管理端访问来源与设备策略（输出：策略；验收：可配置）。  

参考清单（建议）：

- 关键操作需二次确认与原因记录
- 导出需权限与审计记录
- 管理端仅允许 HTTPS 与受信域名

### 12.11 监控与告警指标
1. [X] 管理端可用性与错误率指标（输出：指标表；验收：可监控）。  
2. [X] 关键操作成功率监控（输出：指标表；验收：可追踪）。  
3. [X] 性能基线（P95/P99）与告警阈值（输出：阈值；验收：可执行）。  

参考指标（建议）：

- 登录成功率、token 刷新失败率
- 用户/Workspace/应用状态变更失败率
- 工单处理时延与 SLA 违约率

### 12.12 交付与验收标准
1. [X] 每页验收清单（功能/权限/错误/空态）（输出：模板；验收：可执行）。  
2. [X] 每模块交付说明与变更记录（输出：说明模板；验收：可追踪）。  

参考验收模板（建议）：

- 功能：列表/详情/编辑/删除全覆盖
- 权限：未授权访问与越权操作被拦截
- 状态：加载/空态/错误态清晰可读

### 12.13 表单与字段校验规范
1. [X] 统一字段必填/可选策略（输出：字段规则；验收：一致）。  
2. [X] 统一长度/格式校验（输出：校验表；验收：一致）。  
3. [X] 统一金额/百分比/日期输入规范（输出：输入规则；验收：一致）。  

参考规则（建议）：

- 邮箱：必填、格式校验、最长 128
- 备注/原因：必填、最长 500
- 金额：最小 0，保留 2 位小数
- ID：UUID 格式校验

### 12.14 列表字段清单（首版）
1. [X] 用户列表字段（输出：字段表；验收：一致）。  
2. [X] Workspace 列表字段（输出：字段表；验收：一致）。  
3. [X] 应用列表字段（输出：字段表；验收：一致）。  
4. [X] 工单列表字段（输出：字段表；验收：一致）。  

参考字段（建议）：

- 用户：id、email、username、role、status、created_at、last_login_at
- Workspace：id、name、slug、owner、plan、status、created_at
- 应用：id、name、slug、workspace、status、pricing_type、updated_at
- 工单：id、reference、subject、priority、status、channel、updated_at

### 12.15 筛选项与默认组合
1. [X] 每模块筛选项定义（输出：筛选表；验收：一致）。  
2. [X] 默认过滤与保存视图规则（输出：规则；验收：一致）。  

参考组合（建议）：

- 用户：status/role/search
- Workspace：status/owner/search
- 应用：status/workspace/owner/search
- 工单：status/priority/channel/search

### 12.16 权限点命名规范
1. [X] 统一能力点命名规则（输出：规则；验收：一致）。  
2. [X] 统一读写操作的命名集合（输出：操作表；验收：一致）。  

参考规范（建议）：

- 命名：`module.action`（如 `users.read`、`apps.manage`）
- 动作：`read`、`write`、`manage`、`approve`、`export`

### 12.17 审计事件字典（示例）
1. [X] 统一审计事件命名（输出：事件表；验收：一致）。  
2. [X] 统一事件字段与原因策略（输出：字段表；验收：一致）。  

参考事件（建议）：

- `admin.user_status_update`
- `admin.user_role_update`
- `admin.workspace_status_update`
- `admin.app_status_update`
- `admin.support_ticket_status_update`
- `admin.earnings_withdrawal_process`

### 12.18 导出字段白名单示例
1. [X] 用户/Workspace/应用/工单导出字段白名单（输出：清单；验收：一致）。  
2. [X] 导出字段脱敏与权限策略（输出：策略；验收：一致）。  

参考白名单（建议）：

- 用户导出：id、email、role、status、created_at
- Workspace 导出：id、name、slug、plan、status、created_at
- 应用导出：id、name、slug、status、updated_at
- 工单导出：id、reference、priority、status、updated_at

### 12.19 数据修复与人工操作流程
1. [X] 手工修复工单与审批流程（输出：流程；验收：可执行）。  
2. [X] 修复任务模板与回滚策略（输出：模板；验收：可追溯）。  
3. [X] 修复操作审计记录（输出：审计策略；验收：可追溯）。

### 12.20 时间/时区/货币显示规范
1. [X] 时间展示统一为本地时区（输出：规范；验收：一致）。  
2. [X] 存储统一使用 UTC（输出：规范；验收：一致）。  
3. [X] 货币显示与币种切换策略（输出：规范；验收：一致）。

