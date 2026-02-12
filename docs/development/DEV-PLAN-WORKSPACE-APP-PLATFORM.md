# 工作流应用平台落地开发计划（Workspace = App + 独立数据库 + 公开访问/域名）

版本：v0.2  
日期：2026-02-06  
状态：Draft  
说明：本计划为单文档分段式 Todo List，可持续追加与追踪。

---

> **重大架构变更（v0.2，2026-02-06）：Workspace = App 合并**
>
> 原有的 **Workspace -> App（一对多）** 架构已重构为 **Workspace = App（一对一）** 架构：
>
> - 一个 Workspace 就是一个 SaaS 应用，不再有独立的 App 层级
> - 原 App 的所有功能（版本管理、域名、访问策略、发布等）已整合到 Workspace
> - 原 `what_reverse_apps` 及关联表已删除，字段合并到 `what_reverse_workspaces`
> - 原 App API 路由已合并到 `/api/v1/workspaces/:id/*`
> - 前端路由从 `/workspaces/[workspaceId]/apps/[appId]/*` 简化为 `/app/[appId]/*`
> - 详见重构计划：`.cursor/plans/合并workspace和app架构_fa8d23d6.plan.md`
>
> 本文档中部分章节仍保留 "App" 术语用于描述应用能力，但实际代码中 App 概念已合并到 Workspace。
> 后续章节中 "App" 均指 Workspace 的应用功能部分。

---

## 0. 文档使用方式

1. [x] 统一此文档为唯一计划入口，后续所有任务仅在此追加（输出：团队共识说明；验收：团队确认）。
   - 确认：本文档为 Workspace 应用平台开发的唯一计划入口，所有任务在此追踪。
2. [x] 规定更新节奏（如每周一次），并在文首追加变更记录（输出：变更记录区；验收：至少一次更新）。
   - 更新节奏：每周一更新进度，重大变更及时同步。

---

## 1. 目标与范围

1. [x] 定义产品目标：用户可用 AI Work Flow 构建应用并托管在平台上（输出：目标说明；验收：目标覆盖“构建+运行+发布”）。
2. [x] 定义核心能力：默认 Workspace、多应用、公开访问、可选匿名、独立数据库、域名绑定（输出：能力清单；验收：与需求一一对应）。
   - 文档：`docs/architecture/PRODUCT-GOALS.md` 第 2 节
3. [x] 定义边界与非目标（例如：不做全托管云函数、暂不支持外部自定义运行时）（输出：非目标清单；验收：范围可控）。
   - 文档：`docs/architecture/PRODUCT-GOALS.md` 第 3 节

---

## 2. 术语与概念统一

1. [x] 统一术语：Workspace、App、Workflow、Runtime、App User、Anonymous Session（输出：术语表；验收：前后端一致）。
   - 文档：`docs/architecture/GLOSSARY.md`
2. [x] 明确“App = Workflow + UI/表单 + 数据模型 + 访问策略 + 运行配置”（输出：App 定义；验收：可落到数据模型）。
3. [x] 明确“匿名访问可选”含义：按 App 级别开关（输出：访问策略定义；验收：支持 public_anonymous / public_auth / private）。

---

## 3. 现状快照与差距分析

1. [x] 盘点现有工作流与执行引擎能力（输出：现状说明；验收：覆盖 workflow/exec/ai 模块）。
   - 已完成，分析结果已整合到系统架构文档
2. [x] 盘点现有数据隔离方式（user_id）与缺少的 workspace 层（输出：差距清单；验收：明确要改的表）。
   - 已完成，Workspace 数据模型已实现
3. [x] 盘点现有 agent/market 结构可复用点（输出：复用建议；验收：可映射为 App）。
   - 已完成，Agent/App 映射已实现

---

## 4. 总体架构与模块边界

1. [x] 给出目标架构图（逻辑层即可）：Web、Server、Runtime、AI、DB Provisioner、Domain Service（输出：架构图或文字描述；验收：可指导分工）。
   - 文档：`docs/architecture/SYSTEM-ARCHITECTURE.md` 第 1 节
2. [x] 明确服务边界：
   - App Runtime：公开访问入口与执行编排
   - Workspace Service：租户与权限
   - DB Provisioner：独立数据库创建/连接
   - Domain Service：域名绑定与证书
   - 文档：`docs/architecture/SYSTEM-ARCHITECTURE.md` 第 2 节

3. [x] 明确存储边界：平台主库 vs Workspace 独立库（输出：数据流说明；验收：DB 责任清晰）。
   - 文档：`docs/architecture/SYSTEM-ARCHITECTURE.md` 第 3 节

---

## 5. 数据模型与迁移策略（重点）

1. [x] 新增 Workspace 相关表：`workspaces`、`workspace_members`、`workspace_roles`（输出：字段草案；验收：满足默认 workspace 与团队扩展）。
2. [x] 新增 App 相关表（可演进自 agents）：`apps`、`app_versions`、`app_access_policies`、`app_domains`（输出：字段草案；验收：覆盖公开/匿名/域名）。
3. [x] 定义 Workspace 与 App 的 1:N 关系（一个 Workspace 可创建多个 App）（输出：关系说明；验收：数据模型可表达）。
   - `apps.workspace_id -> workspaces.id` 已建立外键关系。
4. [x] 新增 Workspace DB 连接表：`workspace_databases`（字段含 db_name、db_user、db_secret_ref、status）（输出：字段草案；验收：可定位独立库连接）。
   - 已加入 `db_host`、`db_port` 与 `workspace_id` 唯一约束，支持每 workspace 单库。
5. [x] 现有表迁移：`workflows`、`executions`、`api_keys` 增加 `workspace_id`（输出：迁移清单；验收：不丢数据）。
6. [x] 设计匿名访问数据表：`app_sessions`、`app_events`（输出：字段草案；验收：支持匿名与审计）。
   - 已包含 `session_type`、`ip_hash`、`user_agent_hash`、`payload_json` 字段与外键约束。
7. [x] 输出详细迁移方案：
   - 新增列默认值：`workspace_id` 先允许 NULL，回填完成后设为 NOT NULL；JSON 字段默认 `JSON_OBJECT()`；plan 默认 `free`。
   - 数据回填到 default workspace：为缺失用户创建 default workspace（slug 取 username），回填 `workflows/executions/api_keys.workspace_id`。
   - 灰度切换逻辑：通过 `workspace_enabled` / `app_runtime_enabled` / `domain_enabled` 控制读写路径，先读后写，小流量验证后全量。
   - 验证与回滚：校验 `workspace_id` 空值、数量一致性；异常时关闭开关并执行相关 down migration 回退。

---

## 6. Workspace 生命周期与默认空间

1. [x] 用户注册后自动创建 Default Workspace（输出：流程说明；验收：所有用户必有 workspace）。
2. [x] Workspace 基础设置：名称、slug、图标、计费计划（输出：字段与 API 草案；验收：可配置）。
   - 已提供 `PATCH /api/v1/workspaces/{id}` 支持 name/slug/icon/plan 更新。
3. [x] Workspace 成员与权限：Owner/Admin/Member（输出：权限矩阵；验收：符合基本协作需求）。
   - 默认创建 owner/admin/member 角色与 owner 成员；支持成员邀请与角色更新接口。
4. [x] Workspace 下可创建多个 App（输出：规则说明；验收：可创建与管理多应用）。
   - 已实现 App 创建/列表/详情接口，支持按 `workspace_id` 过滤。
5. [x] App 数量配额与上限规则（输出：规则说明；验收：按计划可扩容/限制）。
   - 规则：free=3，pro=20，enterprise=不限；创建 App 时按 workspace.plan 校验上限。

---

## 7. App 生命周期与发布流程

1. [x] App 创建流程：由 AI 生成或从工作流转化（输出：流程图；验收：两种入口清晰）。
   - 已提供两种入口：`/api/v1/apps/from-ai` 与 `/api/v1/apps/from-workflow`。
2. [x] App 版本管理：草稿/发布、回滚（输出：状态机；验收：可回滚）。
   - 已支持版本创建、发布与回滚接口，并设置 `current_version_id`。
3. [x] 发布配置：公开访问、匿名开关、速率限制（输出：发布配置字段；验收：覆盖访问需求）。
   - 已提供 App 访问策略读取/更新接口：`GET/PATCH /api/v1/apps/:id/access-policy`（支持 access_mode/匿名开关与 rate_limit_json）。

---

## 8. App Runtime 与访问策略

1. [x] 统一 App 访问入口：`/{workspaceSlug}/{appSlug}`（输出：路由规范；验收：可解析到 app）。
   - 已提供入口：`GET /{workspaceSlug}/{appSlug}`，可解析 workspace/app 并返回访问策略。
2. [x] 实现访问策略解析：private / public_auth / public_anonymous（输出：策略表；验收：匹配需求）。
   - 已在 Runtime 入口校验 access_mode，并提供 `GET /runtime/{workspaceSlug}/{appSlug}/schema` 获取 UI/输入规范。
3. [x] 匿名访问会话机制：生成 `session_id`、限制频率、记录事件（输出：流程说明；验收：可审计）。
   - 公开匿名访问会返回 `session_id`，并支持 `X-App-Session-Id` 复用；记录 `runtime_entry/runtime_schema` 事件并按访问频率限制。
4. [x] 运行时与执行引擎的对接：App -> Workflow -> Execution（输出：调用链；验收：清晰可实现）。
   - 已支持 `POST /runtime/{workspaceSlug}/{appSlug}` 执行，使用 App 当前版本 workflow 创建 Execution。

---

## 9. AI 生成能力升级

1. [x] AI 输出不仅包含 workflow JSON，还需包含 UI schema 与 DB schema（输出：新输出规范；验收：能落地为 App）。
   - 生成接口已返回 `ui_schema`/`db_schema`，并在 AI 创建 App 时写入 AppVersion。
2. [x] AI 对话支持“修改 App”的语义（输出：意图定义扩展；验收：支持 modify_app）。
   - 已在 AI 助手意图解析与对话动作中新增 `modify_app` 支持。
3. [x] AI 增加“数据模型建议与迁移”能力（输出：节点与模板定义；验收：可生成表结构）。
   - AI 对话已支持数据模型意图，返回 `db_schema` 与迁移建议并在前端展示。

---

## 10. Workflow/节点扩展（与 App 对齐）

1. [x] 增加 DB 节点类型（select/insert/update/delete/migrate）（输出：节点规格；验收：可被 AI 生成）。
   - 已接入 workspace 独立数据库真实执行（select/insert/update/delete/migrate），并增加权限校验与 SQL 注入防护。
2. [x] 增加 UI 触发/表单节点（输出：节点规格；验收：支持 App 表单与输入）。
3. [x] 增加运行时输出标准（输出：output schema；验收：可映射 UI 展示）。
   - 已补齐 input/output 节点：编辑器节点面板 + 默认节点数据 + 前端执行器。
   - UI 表单输入默认从 `start.inputs` / `input` 节点生成 `ui_schema`（缺省时补齐）。
   - 运行时输出标准：`output` 节点与 `end.outputs` 生成 `output_schema`，写入 `app_version.config_json.output_schema`。

---

## 11. Workspace 独立数据库（强隔离要求）

1. [x] 设计独立数据库策略：每 workspace 一个独立数据库（输出：策略文档；验收：符合强隔离）。
   - 每 workspace 一条数据库记录：`what_reverse_workspace_databases`，`workspace_id` 唯一
   - 命名规则：`db_name=ws_<workspace_id>`，`db_user=wsu_<workspace_id>`

2. [x] DB Provisioner 设计：创建 DB、账号、权限、连接字符串（输出：流程图；验收：可自动化）。
   - 服务：`WorkspaceDatabaseService.Provision` + API `POST /api/v1/workspaces/:id/database/provision`
   - 自动创建 DB / 用户 / 授权（SELECT/INSERT/UPDATE/DELETE/CREATE/ALTER/INDEX/DROP）

3. [x] 连接信息安全存储：密钥加密或外部 Secret 管理（输出：安全方案；验收：不明文存储）。
   - `secret_ref` 使用 `enc:` 前缀 + `encryption.key` 加密存储
   - 支持密钥轮换：`POST /api/v1/workspaces/:id/database/rotate-secret`

4. [x] Workspace DB 迁移机制：表结构创建/版本升级（输出：迁移策略；验收：可持续演进）。
   - `workspace_db_migrations` + 内置迁移 `internal/pkg/workspace_db/migrations`
   - Provision 自动执行迁移，手动迁移入口：`POST /api/v1/workspaces/:id/database/migrate`

5. [x] 运行时连接池与隔离策略（输出：连接池方案；验收：可扩展）。
   - `WorkspaceDBRuntime` 按 workspace 缓存连接池
   - 连接数使用 `database.max_open_conns` / `database.max_idle_conns` 配置

---

## 12. 域名绑定与证书（公开访问）

1. [x] 自定义域名绑定流程：验证、绑定、启用（输出：流程说明；验收：可运营）。
   - 绑定：`POST /api/v1/apps/:id/domains`（返回 `verification` 信息）
   - 验证：`POST /api/v1/apps/:id/domains/:domainId/verify`
   - 启用：`POST /api/v1/apps/:id/domains/:domainId/activate`（支持回滚）

2. [x] DNS 验证机制：CNAME/TXT 校验（输出：校验策略；验收：可操作）。
   - TXT：`_reverseai.<domain>` = `verification_token`
   - CNAME：`<domain>` 指向 `verification.cname_target`（由 base_url 推导）

3. [x] 自动 TLS 证书签发与续期（输出：证书方案；验收：安全可靠）。
   - 已接入证书签发执行器（支持 webhook provider），签发/续期失败会标记 SSL 状态为 failed 并返回错误。
4. [x] 域名路由到 App Runtime（输出：路由映射表；验收：访问可用）。
   - 已支持基于 Host 的域名解析：`GET /`、`GET /schema`、`POST /` 自动映射到 active 域名的 App Runtime。

---

## 13. 权限、安全与滥用防护

1. [x] 权限模型升级为 workspace 级（输出：权限矩阵；验收：覆盖协作与访问）。
2. [x] 公共访问限流与配额策略（输出：限流规则；验收：匿名可控）。
   - 已落地：匿名访问按 IP/Session/App 固定窗口限流，超限返回 RATE_LIMITED
   - 已落地：Runtime 执行扣减 workspace 配额（requests），超限返回 QUOTA_EXCEEDED
   - 已落地：限流触发写入 runtime_events（app.rate_limited）
3. [x] 审计日志：匿名访问、执行、数据写入（输出：日志表/规范；验收：可追溯）。
   - 已记录匿名访问（runtime_entry/runtime_schema/runtime_execute）、执行启动（workflow_executed）、DB 写入节点（data_written，含 table/rows/节点/触发来源）。
4. [x] 安全基线：SQL 注入、防爬虫、异常报警（输出：安全清单；验收：基础可用）。

---

## 14. 计费与配额（与公开访问绑定）

1. [x] 定义计费维度：调用次数、Token、DB 存储、带宽（输出：计费模型；验收：可扩展）。
2. [x] 实现 workspace 级配额（输出：配额规则；验收：能触发限制）。
3. [x] App 级用量统计（输出：统计指标；验收：可计费/显示）。
   - 已接入 Runtime 执行扣减（每次执行计为 1 requests），超限返回 `QUOTA_EXCEEDED`。

---

## 15. 前端工作台与产品体验

1. [x] 新 Workbench 信息架构：Workspace 切换、App 列表、运行监控（输出：页面清单；验收：主要路径完整）。
2. [x] App 编辑器与 AI 对话融合：一体化构建体验（输出：交互说明；验收：符合产品方向）。
3. [x] App 公开访问页面样式与落地页（输出：UI 规范；验收：用户可直接使用）。
4. [x] 公开访问时的匿名体验：引导、限制提示、隐私说明（输出：文案与交互；验收：可上线）。

---

## 16. 兼容旧功能与迁移

1. [x] 现有 workflow 全部自动绑定 default workspace（输出：迁移脚本计划；验收：无数据丢失）。
   - 已在迁移脚本中为缺失用户创建默认 workspace 并回填 workflow/workspace 关联。
2. [x] 旧入口逐步引导到 App 入口（输出：重定向策略；验收：用户不迷路）。
   - 已在工作流/Agent 列表页加入旧入口提示与 Workbench 直达入口。
3. [x] 现有 agent 逐步演进为 App（输出：字段映射；验收：可平滑升级）。

---

## 17. 可观测性与运维

1. [x] 运行时指标：请求数、成功率、耗时、token（输出：指标清单；验收：可监控）。
   - 已落地：运行时入口/Schema/执行请求 Prometheus 指标（runtime.requests_total / runtime.request_duration_seconds），成功率由状态码分布计算
   - Token 指标来源：execution.token_usage 聚合 + LLM tokens 指标（reverseai_llm_tokens_used_total）
2. [x] 执行日志链路：App -> Workflow -> Execution（输出：链路规范；验收：可追踪）。
   - 已落地：runtime 执行写入 execution.trigger_data（app_id/app_version_id/workspace_id/workflow_id/session_id），与 execution.workflow_id 形成可追踪链路
3. [x] 异常告警：DB 创建失败、域名验证失败、执行失败（输出：告警规则；验收：可响应）。
   - 已落地：失败时写入 runtime_events（db.provision.failed / domain.verify.failed / execution.failed，severity=error）

---

## 18. 测试与验收

1. [x] 单元测试：工作流执行、AI 生成、权限（输出：测试清单；验收：覆盖核心）。
2. [x] 集成测试：Workspace 创建、DB provision、App 访问（输出：集成用例；验收：通过）。
3. [x] 安全测试：匿名访问滥用、权限绕过（输出：安全用例；验收：无高危漏洞）。
4. [x] 线上验收指标：成功率、首屏时间、错误率（输出：验收阈值；验收：上线标准明确）。

---

## 19. 发布与回滚策略

1. [x] 灰度发布：按 workspace 或用户白名单（输出：发布策略；验收：可控）。
2. [x] 回滚机制：App 版本回滚、Schema 回退（输出：回滚流程；验收：可执行）。
   - 已提供 App 版本回滚与 DB Schema 回退接口，并纳入 Runbook 流程（`GET /api/v1/plans/runbook`）。
3. [x] 迁移窗口与维护通知（输出：运维规范；验收：用户可理解）。

---

## 20. 风险与预案

1. [x] 独立数据库成本上升：资源上限与限额策略（输出：成本预案；验收：可控）。
   - 已落地：Workspace 数据库创建前进行 `db_storage_gb` 配额预检（默认占用 1GB），成功后记录用量；超限返回 QUOTA_EXCEEDED。
2. [x] 匿名访问滥用：限流、验证码、黑名单（输出：安全预案；验收：可落地）。
   - 已落地：匿名访问限流（rate_limit_json）、IP 黑名单（blocked_ips/blocked_ip_hashes）、验证码校验（captcha.provider=turnstile + X-App-Captcha-Token 或 captcha_token）。
3. [x] 域名验证失败：重试机制与客服流程（输出：故障预案；验收：可处理）。
   - 已落地：验证失败记录次数与错误，指数退避设置 `next_retry_at`；超过阈值返回 `support_url` 指引并提示联系客服。

---

## 21. 里程碑与阶段划分（建议）

1. [x] Phase 0：数据模型与 workspace 基础（输出：schema + 默认 workspace；验收：可创建并绑定）
2. [x] Phase 1：App 运行时与公开访问（输出：runtime 路由 + 访问策略；验收：可匿名访问）
3. [x] Phase 2：独立数据库与 DB 节点（输出：provision + db nodes；验收：可读写）
   - 已完成 workspace DB provision + db\_\* 节点真实执行，支持读写与迁移。
4. [x] Phase 3：域名绑定与 TLS（输出：绑定与证书流程；验收：域名可用）
5. [x] Phase 4：计费、监控、增长（输出：计费模型 + 监控；验收：可运营）

---

## 22. 可追踪任务索引（汇总清单）

1. [x] 完成 Workspace 与 App 基础模型设计
2. [x] 完成默认 Workspace 自动创建
3. [x] 完成 App Runtime 访问策略
4. [x] 完成匿名访问会话体系
5. [x] 完成 Workspace 独立数据库创建流程
6. [x] 完成 DB 节点与 AI 生成扩展
7. [x] 完成域名绑定与 TLS
8. [x] 完成权限与审计
9. [x] 完成计费与配额
10. [x] 完成前端 Workbench 与 App 编辑器对齐
11. [x] 完成安全与合规细化（数据分级/PII脱敏/凭证管理/合规检查/漏洞扫描）

---

## 23. 数据模型草案（字段级）

1. [x] `workspaces` 字段清单（输出：字段表；验收：默认空间与隔离可实现）。
   - id、owner_user_id、name、slug、icon、status、plan、region
   - created_at、updated_at、deleted_at
   - default_app_id、settings_json

2. [x] `workspace_members` 字段清单（输出：字段表；验收：协作与权限可表达）。
   - id、workspace_id、user_id、role_id、status
   - invited_by、joined_at、created_at、updated_at

3. [x] `workspace_roles` 字段清单（输出：字段表；验收：权限矩阵可映射）。
   - id、workspace_id、name、permissions_json
   - is_system、created_at、updated_at

4. [x] `apps` 字段清单（输出：字段表；验收：可映射现有 agents）。
   - id、workspace_id、owner_user_id、name、slug、icon、description
   - status、current_version_id、pricing_type、price
   - created_at、updated_at、published_at、deleted_at

5. [x] `app_versions` 字段清单（输出：字段表；验收：可回滚）。
   - id、app_id、version、changelog
   - workflow_id、ui_schema、db_schema、config_json
   - created_by、created_at

6. [x] `app_access_policies` 字段清单（输出：字段表；验收：可选匿名）。
   - id、app_id、access_mode（private/public_auth/public_anonymous）
   - rate_limit_json、allowed_origins、require_captcha
   - updated_by、updated_at、created_at

7. [x] `app_domains` 字段清单（输出：字段表；验收：域名绑定可追踪）。
   - id、app_id、domain、status、verification_token
   - verified_at、ssl_status、ssl_issued_at、ssl_expires_at
   - created_at、updated_at

8. [x] `workspace_databases` 字段清单（输出：字段表；验收：独立库可管理）。
   - id、workspace_id、db_name、db_user、db_host、db_port
   - secret_ref、status、created_at、updated_at

9. [x] `app_sessions` 字段清单（输出：字段表；验收：匿名与实名可统一）。
   - id、app_id、workspace_id、session_type（anon/auth）
   - user_id、ip_hash、user_agent_hash、created_at、expired_at

10. [x] `app_events` 字段清单（输出：字段表；验收：可审计）。
    - id、app_id、session_id、event_type、payload_json
    - created_at

11. [x] `audit_logs` 字段清单（输出：字段表；验收：管理员可追溯）。
    - id、workspace_id、actor_user_id、action、target_type、target_id
    - metadata_json、created_at

---

## 24. API 设计草案（接口清单级）

1. [x] Workspace API（输出：接口列表；验收：覆盖创建/成员/设置）。
   - POST `/api/v1/workspaces` 创建
   - GET `/api/v1/workspaces` 列表
   - GET `/api/v1/workspaces/{id}` 详情
   - PATCH `/api/v1/workspaces/{id}` 更新
   - POST `/api/v1/workspaces/{id}/members` 邀请成员
   - PATCH `/api/v1/workspaces/{id}/members/{memberId}` 更新角色
   - [x] 已实现创建接口：POST `/api/v1/workspaces`
   - [x] 已实现基础读接口：GET `/api/v1/workspaces`、GET `/api/v1/workspaces/{id}`（owner 维度）
   - [x] 已实现更新接口：PATCH `/api/v1/workspaces/{id}`（name/slug/icon/plan）
   - [x] 已实现成员接口：GET `/api/v1/workspaces/{id}/members`、POST `/api/v1/workspaces/{id}/members`、PATCH `/api/v1/workspaces/{id}/members/{memberId}`

2. [x] App API（输出：接口列表；验收：覆盖创建/发布/版本）。
   - POST `/api/v1/apps` 创建
   - POST `/api/v1/apps/from-workflow` 从 workflow 转化
   - POST `/api/v1/apps/from-ai` AI 生成
   - GET `/api/v1/apps` 列表
   - GET `/api/v1/apps/{id}` 详情
   - POST `/api/v1/apps/{id}/publish` 发布
   - POST `/api/v1/apps/{id}/versions` 创建版本
   - POST `/api/v1/apps/{id}/rollback` 回滚
   - [x] 已实现基础接口：POST `/api/v1/apps`、GET `/api/v1/apps`、GET `/api/v1/apps/{id}`
   - [x] 已实现 AI/Workflow 转化接口：POST `/api/v1/apps/from-workflow`、POST `/api/v1/apps/from-ai`
   - [x] 已实现版本与发布接口：POST `/api/v1/apps/{id}/versions`、`/publish`、`/rollback`

3. [x] Runtime API（输出：接口列表；验收：公开访问可执行）。
   - POST `/runtime/{workspaceSlug}/{appSlug}` 执行
   - GET `/runtime/{workspaceSlug}/{appSlug}/schema` 获取 UI/输入规范
   - [x] 已实现公开执行与 schema 获取入口（支持匿名会话与限流）。

4. [x] Domain API（输出：接口列表；验收：域名绑定可用）。
   - POST `/api/v1/apps/{id}/domains` 绑定
   - GET `/api/v1/apps/{id}/domains` 列表
   - POST `/api/v1/apps/{id}/domains/{domainId}/verify` 校验
   - POST `/api/v1/domains/{domainId}/verify` 校验（便捷入口）
   - [x] 已实现绑定/列表/校验（含证书签发/生效/回滚/删除接口）

5. [x] DB Provisioner API（输出：接口列表；验收：独立库可自动化）。
   - POST `/api/v1/workspaces/{id}/database` 创建
   - GET `/api/v1/workspaces/{id}/database` 状态
   - POST `/api/v1/workspaces/{id}/database/migrate` 迁移
   - [x] 已实现创建/状态/迁移/密钥轮换接口

6. [x] Metrics API（输出：接口列表；验收：可观测性可拉取）。
   - GET `/api/v1/apps/{id}/metrics`
   - GET `/api/v1/workspaces/{id}/usage`
   - [x] 已实现 App/Workspace 指标拉取（requests/tokens 基础统计）
   - [x] 补充 storage/bandwidth 的真实统计来源
     - 来源：workspace 配额 usage（storage=db_storage_gb+storage_gb，bandwidth=egress_gb）

---

## 25. 运行时流程与状态机

1. [x] App 访问请求流程（输出：时序步骤；验收：可实现）。
   - 解析 `{workspaceSlug}/{appSlug}`
   - 读取 App 与访问策略
   - 鉴权或创建匿名会话
   - 映射到 workflow 并执行
   - 记录 session 与 events
   - 已实现：runtime 入口/Schema/执行接口 + 访问策略鉴权 + session/events 记录

2. [x] App 发布状态机（输出：状态图；验收：可回滚）。
   - draft -> published -> deprecated -> archived
   - rollback 指向指定 version
   - 已实现：发布/回滚 + 下线/归档接口（`/api/v1/apps/{id}/deprecate`、`/api/v1/apps/{id}/archive`）

3. [x] Execution 状态机（输出：状态图；验收：与现有一致）。
   - pending -> running -> completed/failed/cancelled
   - 已实现：状态常量与转换校验，取消/完成/失败按状态机落库

4. [x] Session 生命周期（输出：TTL 规则；验收：匿名可控）。
   - 创建、续期、过期、封禁
   - 已实现：匿名会话 TTL 24h + 访问续期 + 超限自动封禁会话（blocked_at/blocked_reason）

---

## 26. Workspace 独立数据库 Provisioner 细化

1. [x] DB 创建流程（输出：流程图；验收：独立库可创建）。
   - 创建数据库与专属账号
   - 授权最小权限
   - 初始化基础表或迁移
   - 记录连接信息与密钥引用
   - 已实现：Provisioner 创建 DB/用户、初始化 workspace_meta，并写入加密 secret_ref 与状态

2. [x] 密钥与连接安全（输出：安全规则；验收：合规）。
   - 连接串不落库明文
   - 密钥轮换与失效机制
   - 已实现：secret_ref 采用 AES-GCM 加密存储且不返回 API；提供轮换接口使旧密钥失效

3. [x] 迁移与版本管理（输出：规范；验收：可持续演进）。
   - 迁移脚本版本化
   - 失败回滚策略
   - 已实现：迁移脚本版本化（`internal/pkg/workspace_db/migrations`），提供迁移接口并在失败时执行当前脚本 downSQL 回滚

4. [x] 备份与恢复（输出：策略；验收：可恢复）。
   - 备份频率
   - 恢复演练
   - 已实现：提供按需备份/恢复接口（生成备份库并可回滚恢复），可由调度任务配置备份频率

---

## 27. 域名绑定与 TLS 细化流程

1. [x] 绑定入口流程（输出：流程图；验收：可操作）。
   - `POST /api/v1/apps/:id/domains` 提交域名
   - 生成 `verification_token` 并返回 TXT/CNAME 指引
   - DNS 配置：TXT `_reverseai.<domain>` = token 或 CNAME 指向 `server.base_url` 主机名

2. [x] 域名验证与状态流转（输出：状态表；验收：可追踪）。
   - `pending -> verifying -> verified/failed`
   - 生效后状态可进入 `active`，回滚回 `verified`
   - `POST /api/v1/apps/:id/domains/:domainId/verify` 触发 DNS 校验

3. [x] 证书签发与续期（输出：策略；验收：自动化）。
   - `POST /api/v1/apps/:id/domains/:domainId/cert/issue`：`ssl_status` 进入 `issuing -> issued`
   - 默认证书 90 天有效期，续期窗口 30 天
   - `POST /api/v1/apps/:id/domains/:domainId/cert/renew` 触发续期

4. [x] 路由生效与回滚（输出：策略；验收：可控）。
   - `POST /api/v1/apps/:id/domains/:domainId/activate` 生效切流（同 App 仅保留一个 `active`）
   - `POST /api/v1/apps/:id/domains/:domainId/rollback` 失败回退
   - 通过 `domain_routing` webhook 执行器通知网关进行切流/回滚

---

## 28. UI Schema 与运行时渲染规范

1. [x] 定义 UI Schema 版本号与顶层结构（输出：schema 规范；验收：可版本化）。
   - schema_version: `1.0.0`；layout(type/props)；blocks(id/type/props/validation/input_key/children)；actions；result_view
   - 代码：`apps/server/internal/pkg/uischema`

2. [x] 定义基础组件库映射（输出：组件清单；验收：可渲染）。
   - 白名单：form、input、select、table、card、chart、markdown
   - 运行时校验：`apps/server/internal/pkg/uischema`

3. [x] 输入校验与提示规范（输出：validation 规则；验收：前后端一致）。
   - required、min/max、enum、pattern（运行时输入映射校验）

4. [x] 运行时渲染策略（输出：渲染流程；验收：可支撑公开访问）。
   - 只允许白名单组件
   - 禁止任意 HTML 注入（拒绝 html/dangerouslySetInnerHTML 等属性）

5. [x] UI Schema 与 Workflow 输入映射（输出：映射规则；验收：可执行）。
   - ui.input.id -> execution.inputs.(input_key | id)
   - schema 响应返回 `input_mapping` 提示 UI Schema 与输入节点映射差异
   - schema 响应返回 `output_schema` 作为输出标准

---

## 29. AI 输出协议与提示词规范

1. [x] 定义 AI 输出协议（输出：JSON 协议；验收：可解析）。
   - app_metadata、workflow_definition、ui_schema、db_schema、access_policy

2. [x] 定义 schema_version 与兼容策略（输出：版本策略；验收：可向前兼容）。

3. [x] 建立 AI 输出校验机制（输出：校验规则；验收：无效结果可拒绝）。
   - [x] JSON Schema 校验
   - [x] 自动修复/重试
   - 已实现：AI 输出解析失败时自动修复与重试；最终返回已校验的协议与规范化 workflow JSON

4. [x] 提示词模板化（输出：prompt 模板；验收：可复用）。
   - [x] 系统提示词
   - [x] 任务模板
   - [x] 风格约束

5. [x] AI 修改与增量更新协议（输出：diff/patch 规范；验收：可局部更新）。

---

## 30. 权限矩阵与访问控制细化

1. [x] 定义 Workspace 权限矩阵（输出：权限表；验收：owner/admin/member）。
   - owner：members_manage、billing_manage、app_publish、app_edit、app_view_metrics、logs_view、workspace_admin、apps_create、plan_view、plan_manage
   - admin：members_manage、app_publish、app_edit、app_view_metrics、logs_view、apps_create、plan_view、plan_manage
   - member：app_edit、app_view_metrics、logs_view、apps_create、plan_view

2. [x] 定义 App 级权限矩阵（输出：权限表；验收：发布/编辑/查看）。
   - app_edit：创建/更新版本
   - app_publish：发布/回滚/访问策略更新
   - app_view_metrics：App 详情/列表/访问策略读取

3. [x] API 权限拦截点清单（输出：清单；验收：每个接口有保护）。
   - Workspace：GET /workspaces（成员可见）、GET /workspaces/:id（成员可见）、PATCH /workspaces/:id（workspace_admin）
   - Workspace 成员：GET/POST/PATCH /workspaces/:id/members（members_manage）
   - App：GET /apps（app_view_metrics/app_edit/app_publish/apps_create）、POST /apps（apps_create/app_edit）
   - App：POST /apps/from-workflow、POST /apps/from-ai（apps_create/app_edit）
   - App：GET /apps/:id（app_view_metrics/app_edit/app_publish/apps_create）
   - App 版本：POST /apps/:id/versions（app_edit）
   - App 发布：POST /apps/:id/publish、POST /apps/:id/rollback（app_publish）
   - App 策略：GET /apps/:id/access-policy（app_edit/app_publish）、PATCH /apps/:id/access-policy（app_publish）

4. [x] 前端权限 gate（输出：界面权限规则；验收：按钮与页面可控）。
   - 团队页按钮与菜单项通过 PermissionGate 按权限控制（团队设置/邀请成员/角色与成员管理）

---

## 31. 公开访问风控与限流细化

1. [x] 定义限流策略（输出：规则表；验收：匿名可控）。
   - per_ip / per_session / per_app
   - `rate_limit_json.per_ip|per_session|per_app.{max_requests,window_seconds}`
   - 默认 per_ip = 120/60s，per_session/per_app 需配置开启

2. [x] 定义异常行为识别（输出：规则；验收：可触发限制）。
   - 高频调用、失败率异常、速率突增
   - `rate_limit_json.anomaly.high_freq|failure_rate|spike`

3. [x] 黑名单与灰名单机制（输出：策略；验收：可手动/自动）。
   - `blacklist/denylist/blocklist/blocked_ips/blocked_ip_hashes`
   - `graylist/greylist` + `gray_policy.{max_requests,window_seconds,require_captcha}`

4. [x] CAPTCHA/挑战机制（输出：接入方案；验收：可选开启）。
   - 访问策略 `require_captcha` + 风险信号触发挑战
   - `X-App-Captcha-Token` / `captcha_token` 接入

5. [x] 审计与告警联动（输出：事件规范；验收：可追溯）。
   - 事件：`runtime_access_blocked` / `runtime_rate_limited` / `runtime_risk_detected` / `runtime_captcha_required`
   - 事件：`runtime_execute_success` / `runtime_execute_failed`

---

## 32. 计费与配额细化方案

1. [x] 定义计费维度与计量口径（输出：计量定义；验收：可落地）。
   - requests、token、db_storage、egress

2. [x] 定义套餐与配额模板（输出：plan 表；验收：可配置）。
   - free / pro / enterprise

3. [x] 配额消耗与扣减逻辑（输出：策略；验收：可执行）。
   - 实时扣减与超额处理

4. [x] App 级费用拆分与统计（输出：统计维度；验收：可对账）。
   - 已落地：`what_reverse_billing_plans` / `what_reverse_workspace_quotas` / `what_reverse_billing_usage_events` / `what_reverse_app_usage_stats`
   - 新增 API：`/api/v1/billing/dimensions`、`/api/v1/billing/plans`、`/api/v1/billing/workspaces/:id/quota`、`/api/v1/billing/workspaces/:id/consume`、`/api/v1/billing/workspaces/:id/apps/usage`

---

## 33. 数据迁移与灰度开关细化

1. [x] 定义迁移 Feature Flags（输出：开关清单；验收：可灰度）。
   - workspace_enabled、app_runtime_enabled、domain_enabled
   - 配置路径：`apps/server/config/config.yaml`（可通过 `/api/v1/system/features` 查看）

2. [x] 数据回填策略（输出：迁移脚本设计；验收：无数据丢失）。
   - 为每个 user 创建 default workspace
   - 旧 workflow/app 绑定 workspace_id
   - 可选执行：`migration.workspace_backfill_enabled`（回填 users/workflows/executions/api_keys/apps/app_sessions）

3. [x] 回滚与一致性校验（输出：校验清单；验收：可回退）。
   - 可选执行：`migration.workspace_consistency_check`
   - 回滚脚本：`apps/server/migrations/000016_add_workspace_ids.down.sql`

4. [x] 迁移期间双写策略（输出：策略；验收：平滑过渡）。
   - 新写入默认写入 `user_id` + `workspace_id`
   - 运行中兜底：执行/更新时补齐缺失的 `workspace_id`

---

## 34. 性能与扩展性方案

1. [x] 执行引擎并发与队列策略（输出：并发模型；验收：可扩展）。
   - worker pool / queue
   - 配置项：execution.max_concurrent / execution.timeout
   - 配置项：queue.worker_concurrency / queue.queues
   - Worker 入口：apps/server/cmd/worker

2. [x] App Runtime 缓存策略（输出：缓存规则；验收：减少 DB 压力）。
   - app/版本缓存、ui_schema 缓存
   - 已落地：Runtime 服务内存 TTL 缓存 workspace/app/policy/app_version（默认 30s），Schema 读取复用版本缓存

3. [x] Workspace DB 连接池管理（输出：连接池策略；验收：稳定）。
   - 每 workspace 限制连接数
   - 已落地：workspace_max_open_conns / workspace_max_idle_conns / workspace_conn_max_lifetime / workspace_conn_max_idle_time

4. [x] 热点 App 降载策略（输出：降载规则；验收：保障稳定）。
   - 已落地：匿名访问在 `runtime_execute` 触发高频/失败率/流量激增信号时降载，返回 OVERLOADED 并记录 `runtime_load_shed` 事件

---

## 35. 安全与合规细化

1. [x] 数据分级与访问策略（输出：分级规则；验收：可执行）。
   - 业务数据、日志数据、密钥数据
   - 分级：public / internal / confidential / restricted
   - 访问规则：public 依 access_mode；internal 需登录 + workspace 成员；confidential 需 workspace 管理员；restricted 仅 workspace owner
   - 落地：AppAccessPolicy.data_classification + Runtime 访问校验

2. [x] PII 处理与脱敏规范（输出：脱敏规则；验收：日志合规）。
   - 规则：字段名+正则识别（email/phone/id_card/credit_card/ip/jwt/api_key/token/secret 等）
   - 脱敏：full/partial/hash，默认输出 `[REDACTED]` 或部分遮罩
   - 覆盖：HTTP 访问日志（remote_ip/user_agent/query）、审计日志 metadata、App 运行事件 payload、执行/节点日志 inputs/outputs 与错误信息
   - 开关：`security.pii_sanitization_enabled`

3. [x] 密钥与凭证管理规范（输出：安全规范；验收：不落库明文）。
   - rotation：API Key 轮换接口（`/me/api-keys/:id/rotate`），记录 `last_rotated_at`
   - revocation：API Key 吊销接口（`/me/api-keys/:id/revoke`），记录 `revoked_at/revoked_by/revoked_reason`
   - least privilege：API Key 支持 `scopes`（JSON），默认最小 `llm:execute`
   - 存储：API Key 仅保存 `key_encrypted + key_preview`，数据库密钥使用 `secret_ref`（加密）

4. [x] 安全审计与合规清单（输出：清单；验收：可审查）。
   - 清单接口：`/api/v1/security/audit-checklist`（分 access/operation/export/security/admin）
   - 审计动作：`/api/v1/security/audit-actions`（required/optional）
   - 合规检查：`/api/v1/security/compliance/:workspaceId`
   - 审计日志：`/api/v1/workspaces/:id/audit-logs`（action/target/actor 过滤）
   - 开关与保留：`security.audit_logging_enabled` / `security.audit_log_retention_days`

5. [x] 依赖安全与漏洞扫描（输出：流程；验收：可持续）。
   - 自动化流程：`.github/workflows/security-scan.yml`（govulncheck/gosec/npm audit/gitleaks/codeql/依赖更新检查）
   - 状态接口：`/api/v1/security/dependency-scan`
   - 合规检查：`dependency_scan` / `outdated_dependencies` 自动识别流程

---

## 36. 可观测性与日志规范（细化）

1. [x] 统一日志格式（输出：日志规范；验收：可搜索）。
   - trace_id、workspace_id、app_id、execution_id
   - 实现：`internal/pkg/observability/context.go` - TraceContext 结构定义
   - 实现：`internal/pkg/logger/logger.go` - WithContext/WithTraceContext 方法
   - 实现：`internal/api/middleware/logger.go` - 增强日志中间件，支持 W3C traceparent 头

2. [x] 指标维度细化（输出：指标字典；验收：可告警）。
   - request_latency、execution_success_rate、db_provision_time
   - 实现：`internal/pkg/observability/metrics.go` - Prometheus 指标收集器
   - 实现：`internal/api/middleware/metrics.go` - HTTP 指标中间件
   - 实现：执行服务埋点 - RecordExecution/RecordNodeExecution
   - 端点：`GET /metrics` - Prometheus 格式指标暴露

3. [x] 分布式追踪接入（输出：方案；验收：可链路追踪）。
   - 实现：`internal/pkg/observability/tracing.go` - OpenTelemetry OTLP exporter
   - 实现：`internal/api/middleware/tracing.go` - W3C Trace Context propagation
   - 配置：TracingConfig 支持 gRPC/HTTP 协议、采样率、服务元数据

4. [x] 运行时事件规范（输出：事件表；验收：可回放）。
   - 实现：`internal/domain/entity/runtime_event.go` - 事件实体定义（40+ 事件类型）
   - 实现：`internal/repository/runtime_event_repo.go` - 事件持久化 + 回放查询
   - 实现：`internal/service/event_recorder.go` - 统一事件记录器（支持异步批量写入）
   - 迁移：`migrations/029_runtime_events.sql` - 事件表 DDL

---

## 37. 前端信息架构与页面 WBS

1. [x] Workspace 入口页（输出：页面草案；验收：可切换空间）。
   - 列表 / 创建 / 选择
   - 实现：`apps/web/src/app/(dashboard)/workspaces/page.tsx`
   - 功能：Workspace 列表展示、创建对话框、搜索筛选

2. [x] App 列表与管理页（输出：页面草案；验收：可创建/发布）。
   - 列表 / 状态 / 版本 / 发布
   - 实现：`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/page.tsx`
   - 功能：App 列表、状态筛选、发布/下线/归档操作

3. [x] App 构建页（输出：页面草案；验收：AI 与编辑器融合）。
   - Chat 区 / Workflow 画布 / UI Schema 配置
   - 实现：`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/[appId]/builder/page.tsx`
   - 功能：三栏布局（AI Chat / Workflow 画布 / UI Schema），基础框架已实现

4. [x] App 运行监控页（输出：页面草案；验收：可追踪执行）。
   - 运行日志 / 指标 / 告警
   - 实现：`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/[appId]/monitoring/page.tsx`
   - 功能：执行记录列表、指标概览、状态筛选、分页

5. [x] 域名管理页（输出：页面草案；验收：可绑定/验证）。
   - 实现：`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/[appId]/domains/page.tsx`
   - 功能：域名列表、绑定对话框、DNS 配置说明、验证操作

6. [x] Workspace 设置页（输出：页面草案；验收：成员与计费）。
   - 实现：`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/settings/page.tsx`
   - 功能：基本设置、成员管理、用量与计费统计

7. [x] 规划模块页（输出：页面草案；验收：可编辑/可视化）。
   - 实现：`apps/web/src/app/(dashboard)/plans/page.tsx`
   - 功能：Workspace 选择、模块/任务编辑、阶段轨道 + 看板视图

8. [x] 规划模块扩展视图（输出：依赖关系图 / 甘特图 / 版本恢复；验收：可切换查看）。
   - 实现：`apps/web/src/app/(dashboard)/plans/page.tsx`
   - 功能：依赖关系流（拖拽建立依赖/连线）、真实日历甘特、版本快照差异预览与恢复（恢复前自动备份）

---

## 38. 后端模块拆解与服务边界

1. [x] Workspace Service（输出：模块职责；验收：用户/成员/权限）。
   - 职责边界：`docs/architecture/BACKEND-SERVICE-BOUNDARIES.md`（Workspace Service）。
   - 代码：`apps/server/internal/service/workspace_service.go`；接口：`apps/server/internal/api/handler/workspace.go`。
2. [x] App Service（输出：模块职责；验收：创建/发布/版本）。
   - 职责边界：`docs/architecture/BACKEND-SERVICE-BOUNDARIES.md`（App Service）。
   - 代码：`apps/server/internal/service/app_service.go`；接口：`apps/server/internal/api/handler/app.go`。
3. [x] Runtime Service（输出：模块职责；验收：公开访问与执行）。
   - 职责边界：`docs/architecture/BACKEND-SERVICE-BOUNDARIES.md`（Runtime Service）。
   - 代码：`apps/server/internal/service/runtime_service.go`；接口：`apps/server/internal/api/handler/runtime.go`。
4. [x] DB Provisioner Service（输出：模块职责；验收：独立库创建）。
   - 职责边界：`docs/architecture/BACKEND-SERVICE-BOUNDARIES.md`（DB Provisioner Service）。
   - 代码：`apps/server/internal/service/workspace_database_service.go`；接口：`apps/server/internal/api/handler/workspace_database.go`。
5. [x] Domain Service（输出：模块职责；验收：域名绑定/证书）。
   - 职责边界：`docs/architecture/BACKEND-SERVICE-BOUNDARIES.md`（Domain Service）。
   - 代码：`apps/server/internal/service/app_domain_service.go`；接口：`apps/server/internal/api/handler/app_domain.go`。
6. [x] Billing Service（输出：模块职责；验收：计费/配额）。
   - 职责边界：`docs/architecture/BACKEND-SERVICE-BOUNDARIES.md`（Billing Service）。
   - 代码：`apps/server/internal/service/billing_service.go`；接口：`apps/server/internal/api/handler/billing.go`。

7. [x] Plan Service（输出：模块职责；验收：规划模块/任务/版本/权限）。
   - 代码：`apps/server/internal/service/plan_module_service.go`、`apps/server/internal/service/plan_version_service.go`。
   - 接口：`apps/server/internal/api/handler/plan_module.go`、`apps/server/internal/api/handler/plan_version.go`。
   - 迁移：`apps/server/migrations/000027_add_plan_modules.*`、`apps/server/migrations/000028_add_plan_versions.*`。

---

## 39. 数据保留与生命周期管理

1. [x] 数据保留策略（输出：策略；验收：可配置）。
   - 执行日志保留周期（配置：retention.execution_log_retention_days；清理 runtime_events / node_logs）。
   - 匿名会话保留周期（配置：retention.anonymous_session_retention_days；清理 anon app sessions）。
   - 定时清理频率（配置：retention.cleanup_interval）。

2. [x] 数据导出与删除（输出：流程；验收：合规）。
   - 导出：`GET /api/v1/workspaces/:id/export`（包含 workspace / 成员 / apps / workflows）。
   - 异步导出：`POST /api/v1/workspaces/:id/exports`、`GET /api/v1/workspaces/:id/exports/:exportId`、`GET /api/v1/workspaces/:id/exports/:exportId/download`。
   - 删除：`DELETE /api/v1/workspaces/:id`（软删除并进入生命周期流程）。
   - 恢复：`POST /api/v1/workspaces/:id/restore`（恢复窗口内可恢复）。

3. [x] Workspace 删除策略（输出：流程；验收：可恢复窗口）。
   - 软删除 -> 冷存储 -> 彻底删除（配置：`retention.workspace_deletion_grace_days`、`retention.workspace_cold_storage_days`）。
   - 定时任务触发状态流转：软删除超期进入 `cold_storage`，冷存储到期后彻底删除。
   - 冷存储外部归档：导出包写入 `archive.base_path`，随冷存储任务生成，彻底删除时清理归档文件。

---

## 40. 失败场景与降级策略

1. [x] DB Provision 失败处理（输出：降级策略；验收：可恢复）。
   - 已实现：Provision 重试（指数退避）、失败回滚（drop db/user）、失败标记并可再次调用 Provision 手动介入

2. [x] LLM 调用失败处理（输出：fallback 策略；验收：可继续）。
   - 已实现：provider/model 失败链路、apiKeys 映射支持、fallbackText 兜底输出

3. [x] 域名证书失败处理（输出：回退策略；验收：可用）。
   - 已实现：签发/续期失败重试退避、失败原因记录、support 引导与重试窗口（`ssl_next_retry_at`）

4. [x] Runtime 高负载降级（输出：策略；验收：稳定）。
   - 已实现：执行入口并发限流（`execution.max_in_flight`），过载返回 503

---

## 41. 测试用例模板与基准

1. [x] Workspace 测试用例模板（输出：模板；验收：可复用）。
   - 见 `docs/operations/TEST-CASE-TEMPLATES.md` 的 Workspace 模板
2. [x] App 公开访问测试用例模板（输出：模板；验收：可复用）。
   - 见 `docs/operations/TEST-CASE-TEMPLATES.md` 的 App 公开访问模板
3. [x] DB Provision 测试用例模板（输出：模板；验收：可复用）。
   - 见 `docs/operations/TEST-CASE-TEMPLATES.md` 的 DB Provision 模板
4. [x] 域名绑定测试用例模板（输出：模板；验收：可复用）。
   - 见 `docs/operations/TEST-CASE-TEMPLATES.md` 的 域名绑定模板
5. [x] 安全测试基准（输出：基准；验收：可执行）。
   - 见 `docs/operations/TEST-CASE-TEMPLATES.md` 的 安全测试基准

---

## 42. 发布检查清单（上线前）

1. [x] 版本发布前 checklist（输出：清单；验收：执行完成）。
   - schema 迁移
   - 兼容性测试
   - 回滚演练
   - 工具：`scripts/ops/release-checklist.mjs`（生成报告至 `reports/`，支持 `--mark-compat/--mark-rollback`）

2. [x] 监控与告警验证（输出：结果；验收：告警可触发）。
   - 接口：`POST /api/v1/ops/alerts/test`（触发系统告警演练事件）
   - 工具：`scripts/ops/alert-smoke.mjs`（生成告警演练报告至 `reports/`）
3. [x] 运行时压测（输出：报告；验收：满足阈值）。
   - 工具：`scripts/ops/runtime-load-test.mjs --url <runtime endpoint>`（生成压测报告至 `reports/`）

---

## 43. 运维与客服流程

1. [x] 域名绑定故障处理 SOP（输出：SOP；验收：可执行）。
   - API：`/api/v1/admin/ops/sops/domain_binding_failure`
2. [x] DB 创建失败处理 SOP（输出：SOP；验收：可执行）。
   - API：`/api/v1/admin/ops/sops/workspace_db_provision_failed`
3. [x] 匿名滥用处理 SOP（输出：SOP；验收：可执行）。
   - API：`/api/v1/admin/ops/sops/anonymous_abuse`
4. [x] 用户数据恢复流程（输出：流程；验收：可执行）。
   - API：`/api/v1/admin/ops/sops/user_data_recovery`
   - 文档：`docs/operations/OPS-SUPPORT-SOPS.md`

curl 示例（需要管理员 JWT）：

```bash
curl -H "Authorization: Bearer <token>" https://<base_url>/api/v1/admin/ops/sops
curl -H "Authorization: Bearer <token>" https://<base_url>/api/v1/admin/ops/sops/domain_binding_failure
```

---

## 44. 成本模型与资源预算

1. [x] 资源成本核算模型（输出：模型；验收：可估算）。
   - DB / LLM / 带宽 / 存储
   - API：`GET /billing/workspaces/:id/cost-model`、`GET /billing/workspaces/:id/costs`、`POST /billing/workspaces/:id/costs/estimate`

2. [x] 预算阈值与提醒（输出：规则；验收：可告警）。
   - API：`GET /api/v1/billing/workspaces/:id/budget`、`PATCH /api/v1/billing/workspaces/:id/budget`
   - ConsumeUsage 返回 `budget.alerts` 用于告警触发

3. [x] 单 workspace 成本上限策略（输出：策略；验收：可控）。
   - 预算设置包含 `spend_limit` 与 `spend_limit_enabled`，超限阻断调用

---

## 45. 数据分析与增长指标

1. [x] 核心漏斗定义（输出：漏斗；验收：可埋点）。
   - 创建 workspace -> 创建 app -> 发布 -> 公开访问
   - 埋点事件：`workspace.created` / `app.created` / `app.published` / `app.accessed`（写入 runtime_events）

2. [x] 关键指标定义（输出：指标表；验收：可统计）。
   - DAU、App 发布数、匿名访问转化

3. [x] A/B 测试框架（输出：方案；验收：可扩展）。

---

## 46. 文档与开发者体验

1. [x] 公共文档结构（输出：目录；验收：可阅读）。
   - 已新增 `docs/public/` 目录（README/QUICKSTART/API-REFERENCE/RUNTIME-GUIDE）
   - 快速开始 / API 参考 / 运行时说明

2. [x] SDK/CLI 规划（输出：规划；验收：可实施）。
   - 规划文档：`docs/development/SDK-CLI-PLAN.md`

3. [x] 示例应用与模板（输出：模板清单；验收：可复用）。

---

## 47. AI 安全与治理

1. [x] AI 输出安全审查（输出：规则；验收：可拦截风险内容）。
   - server：LLM 执行器与对话接口新增输出审查
   - 规则：自伤/暴力/违法/仇恨/未成年性内容关键词
   - 命中后返回 `AI_OUTPUT_BLOCKED`
2. [x] 生成内容的可解释性（输出：说明模板；验收：用户可理解）。
3. [x] 违反政策内容的拦截策略（输出：策略；验收：合规）。

---

## 48. 兼容性与多环境策略

1. [x] 开发/测试/生产环境隔离（输出：规范；验收：可区分）。
   - 规范：通过 `REVERSEAI_ENV` 选择 `config.{env}.yaml` 覆盖基础配置，dev/test/prod 可区分。
2. [x] 配置管理与环境变量规范（输出：清单；验收：可维护）。
   - 已新增 `docs/development/CONFIGURATION.md` 与 `apps/server/config/config.example.yaml` 作为清单与模板。
3. [x] 多地域部署策略（输出：方案；验收：可扩展）。
   - 已新增 `docs/architecture/DEPLOYMENT-MULTI-REGION.md` 并提供部署配置与发现接口 `/api/v1/system/deployment`。

---

## 49. API 请求/响应协议（字段级）

1. [x] 定义统一响应包裹（输出：协议；验收：所有 API 一致）。
   - code、message、data、trace_id、request_id
   - 列表接口保留 meta，错误详情放入 data.details

2. [x] 错误码体系（输出：错误码表；验收：可定位问题）。
   - 已新增 `docs/api/ERROR-CODES.md` 与 `/api/v1/system/error-codes`
   - WORKSPACE*\*, APP*\_, RUNTIME\_\_, DOMAIN*\*, DB*\*

3. [x] Workspace 创建请求/响应字段（输出：字段定义；验收：可用）。
   - request：name、slug、region
   - response：id、owner_user_id、created_at
   - 字段定义见 `docs/api/API-FIELDS.md` 的「Workspace API」章节（含 `region`）。

4. [x] App 创建/发布/版本请求字段（输出：字段定义；验收：可用）。
   - create：name、slug、workflow_id、ui_schema
   - publish：access_policy、rate_limit
   - version：changelog、config_json
   - 字段定义见 `docs/api/API-FIELDS.md` 的「App API」章节（含 `access_policy`/`rate_limit`）。

5. [x] Runtime 执行请求/响应字段（输出：字段定义；验收：可落地）。
   - request：inputs、session_id、client_context
   - response：status、outputs、execution_id、logs
   - 字段定义见 `docs/api/API-FIELDS.md` 的「Runtime API」章节。

6. [x] Domain 绑定/验证请求字段（输出：字段定义；验收：可用）。
   - bind：domain
   - verify：token
   - 字段定义见 `docs/api/API-FIELDS.md` 的「Domain API」章节。

---

## 50. SQL Schema 草案（索引与约束）

1. [x] `workspaces` 约束与索引（输出：SQL 草案；验收：可执行）。
   - unique(slug)、index(owner_user_id)

2. [x] `apps` 约束与索引（输出：SQL 草案；验收：可执行）。
   - unique(workspace_id, slug)、index(status)

3. [x] `app_versions` 约束与索引（输出：SQL 草案；验收：可执行）。
   - unique(app_id, version)、index(created_at)

4. [x] `app_domains` 约束与索引（输出：SQL 草案；验收：可执行）。
   - unique(domain)、index(status)

5. [x] `workspace_databases` 约束与索引（输出：SQL 草案；验收：可执行）。
   - unique(workspace_id)、index(status)

6. [x] `app_sessions` 约束与索引（输出：SQL 草案；验收：可执行）。
   - index(app_id, created_at)、index(session_type)
   - 已新增 `docs/operations/SQL-SCHEMA-INDEX-CONSTRAINTS.md`

---

## 51. UI Schema 示例与约束细化

1. [x] UI Schema 示例结构（输出：示例 JSON；验收：可渲染）。
   - schema_version
   - layout（grid/stack；stack 将归一为 single_column）
   - blocks（form/input/select/...）+ result_view

```json
{
  "schema_version": "1.0.0",
  "layout": { "type": "stack", "props": { "gap": 16 } },
  "blocks": [
    {
      "id": "main_form",
      "type": "form",
      "label": "输入",
      "children": [
        {
          "id": "prompt",
          "type": "input",
          "label": "提示",
          "input_key": "prompt",
          "props": { "placeholder": "请输入需求" },
          "validation": { "required": true, "min": 1, "max": 2000 }
        }
      ]
    }
  ],
  "actions": [{ "id": "submit", "type": "submit", "label": "运行" }],
  "result_view": {
    "type": "markdown",
    "props": { "content": "### 运行结果\n\n{{output}}" }
  }
}
```

1. [x] 输入字段与 Workflow 输入映射规则（输出：规则；验收：可执行）。
   - input/select 使用 `input_key` 映射 workflow inputs，缺省时使用 `id`
   - runtime 执行前做 inputs 校验与映射，错误返回字段级提示
   - schema 响应的 `input_mapping` 给出缺失/重复映射提示

2. [x] 结果展示约束（输出：规范；验收：一致）。
   - result_view.type 仅允许 text / table / chart / markdown
   - blocks 可用 markdown/table/card/chart 作为结果辅助展示

3. [x] 禁止的 UI 能力清单（输出：黑名单；验收：可控）。
   - script、raw_html、inline_style、html、dangerouslySetInnerHTML、innerHTML

---

## 52. Workflow 节点协议细化

1. [x] 节点通用字段（输出：规范；验收：统一）。
   - id、type、position、data、inputs、outputs
   - 解析层兼容 data -> config/label/inputs/outputs，并补齐字段别名

2. [x] DB 节点字段（输出：规范；验收：可执行）。
   - operation、table、where、values、limit
   - 解析阶段按节点类型补齐 operation

3. [x] UI 触发节点字段（输出：规范；验收：可映射）。
   - form_id、submit_action、validation
   - start 节点支持 form_id / submit_action，validation 合并为 UI schema

4. [x] LLM 节点输出约束（输出：规范；验收：可解析）。
   - output_schema、temperature、max_tokens
   - 支持 output_schema/max_tokens 别名并解析 JSON 输出

最小可用 workflow JSON（可直接作为 workflow.definition）：

```json
{
  "version": "1.0.0",
  "nodes": [
    {
      "id": "start",
      "type": "start",
      "label": "开始",
      "position": { "x": 0, "y": 0 },
      "data": {
        "label": "开始",
        "inputs": [
          {
            "id": "prompt",
            "name": "prompt",
            "label": "提示词",
            "type": "string",
            "required": true
          }
        ],
        "config": {
          "form_id": "main_form",
          "submit_action": { "id": "submit", "type": "submit", "label": "运行" }
        }
      },
      "outputs": [{ "id": "prompt", "name": "prompt", "type": "string" }]
    },
    {
      "id": "llm",
      "type": "llm",
      "label": "LLM",
      "position": { "x": 240, "y": 0 },
      "config": {
        "model": "gpt-4",
        "systemPrompt": "你是一个总结助手",
        "userPrompt": "请返回 JSON：{\"summary\":\"...\"}。原文：{{prompt}}",
        "temperature": 0.7,
        "max_tokens": 512,
        "output_schema": {
          "type": "object",
          "properties": { "summary": { "type": "string" } },
          "required": ["summary"]
        }
      },
      "inputs": [{ "id": "prompt", "name": "prompt", "type": "string" }],
      "outputs": [{ "id": "parsed", "name": "parsed", "type": "object" }]
    },
    {
      "id": "output",
      "type": "output",
      "label": "输出",
      "position": { "x": 480, "y": 0 },
      "config": {
        "outputType": "json",
        "title": "结果"
      },
      "inputs": [{ "id": "input", "name": "input", "type": "object" }],
      "outputs": []
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "start",
      "sourceHandle": "prompt",
      "target": "llm",
      "targetHandle": "prompt"
    },
    {
      "id": "e2",
      "source": "llm",
      "sourceHandle": "parsed",
      "target": "output",
      "targetHandle": "input"
    }
  ]
}
```

---

## 53. 运行时错误与结果标准化

1. [x] 统一错误响应结构（输出：规范；验收：一致）。
   - error_code、error_message、details
   - 已在 `apps/server/internal/api/handler/common.go` 统一补充字段（保留 code/message 兼容）

2. [x] 运行时状态枚举（输出：枚举表；验收：可监控）。
   - pending / running / completed / failed / cancelled
   - 数据源：`apps/server/internal/service/plan_runtime_status_service.go`
   - API：`GET /api/v1/plans/runtime-statuses`

3. [x] 用户可见错误与内部错误映射（输出：映射表；验收：可用）。
   - 数据源：`apps/server/internal/service/plan_runtime_error_mapping_service.go`
   - API：`GET /api/v1/plans/runtime-error-mapping`
   - Runtime 响应统一映射 `error_code/error_message`（`apps/server/internal/api/handler/runtime.go`）。

4. [x] 运行时重试策略（输出：策略；验收：稳定）。
   - 数据源：`apps/server/internal/service/plan_runtime_retry_policy_service.go`
   - API：`GET /api/v1/plans/runtime-retry-policy`

---

## 54. 限流与配额计算公式草案

1. [x] Token 计量公式（输出：公式；验收：可计费）。
   - total = prompt + completion
   - 执行结束后按 total 计入 tokens 用量（若仅返回 total，默认计入 prompt）

2. [x] 请求计费口径（输出：口径；验收：可统计）。
   - runtime_execute 在通过访问控制与输入校验后计 1 次
   - 执行失败仍计费；被限流/权限/输入拦截不计费

3. [x] 限流算法选型（输出：方案；验收：可实现）。
   - 选型 fixed_window（基于事件计数的固定窗口）
   - rate_limit_json.algorithm 固定为 fixed_window（token_bucket 预留）

4. [x] 超额处理策略（输出：规则；验收：用户可理解）。
   - 超额即阻断返回 QUOTA_EXCEEDED
   - 响应包含 exceeded/plan/quota/budget + reset_at/retry_after_seconds + overage_policy

---

## 55. 实施分解 WBS（按模块）

1. [x] Workspace 模块 WBS（输出：任务表；验收：可排期）。
   - 数据源：`apps/server/internal/service/plan_wbs_service.go`
   - API：`GET /api/v1/plans/wbs/workspace`
2. [x] App 模块 WBS（输出：任务表；验收：可排期）。
   - 数据源：`apps/server/internal/service/plan_wbs_service.go`
   - API：`GET /api/v1/plans/wbs/app`
3. [x] Runtime 模块 WBS（输出：任务表；验收：可排期）。
   - 数据源：`apps/server/internal/service/plan_wbs_service.go`
   - API：`GET /api/v1/plans/wbs/runtime`
4. [x] DB Provisioner 模块 WBS（输出：任务表；验收：可排期）。
   - 数据源：`apps/server/internal/service/plan_wbs_service.go`
   - API：`GET /api/v1/plans/wbs/db-provisioner`
5. [x] Domain 模块 WBS（输出：任务表；验收：可排期）。
   - 数据源：`apps/server/internal/service/plan_wbs_service.go`
   - API：`GET /api/v1/plans/wbs/domain`
6. [x] Billing 模块 WBS（输出：任务表；验收：可排期）。
   - 数据源：`apps/server/internal/service/plan_wbs_service.go`
   - API：`GET /api/v1/plans/wbs/billing`

---

## 56. API 请求/响应示例（JSON）

1. [x] Workspace 创建示例（输出：示例 JSON；验收：可直接用于接口调试）。
   - 数据源：`apps/server/internal/service/plan_api_examples_service.go`
   - API：`GET /api/v1/plans/api-examples`（key: workspace_create）

```json
// Request
{
  "name": "Default Workspace",
  "slug": "vantiboolean",
  "region": "ap-east-1"
}

// Response
{
  "code": "OK",
  "message": "OK",
  "trace_id": "trace_xxx",
  "request_id": "req_xxx",
  "data": {
    "workspace": {
      "id": "ws_123",
      "owner_user_id": "user_123",
      "name": "Default Workspace",
      "slug": "vantiboolean",
      "region": "ap-east-1",
      "created_at": "2026-02-01T12:00:00Z"
    }
  }
}
```

1. [x] App 发布示例（输出：示例 JSON；验收：可直接用于接口调试）。
   - 数据源：`apps/server/internal/service/plan_api_examples_service.go`
   - API：`GET /api/v1/plans/api-examples`（key: app_publish）

```json
// Request
{
  "version_id": "ver_123",
  "access_policy": {
    "access_mode": "public_anonymous",
    "rate_limit_json": { "per_minute": 60 }
  }
}

// Response
{
  "code": "OK",
  "message": "OK",
  "trace_id": "trace_xxx",
  "request_id": "req_xxx",
  "data": {
    "app": {
      "id": "app_123",
      "name": "Daily Report",
      "status": "published",
      "current_version_id": "ver_123",
      "published_at": "2026-02-01T12:05:00Z"
    }
  }
}
```

1. [x] Runtime 执行示例（输出：示例 JSON；验收：可直接用于接口调试）。
   - 数据源：`apps/server/internal/service/plan_api_examples_service.go`
   - API：`GET /api/v1/plans/api-examples`（key: runtime_execute）

```json
// Request
{
  "inputs": {
    "prompt": "帮我生成日报"
  },
  "trigger_type": "app_runtime",
  "captcha_token": "captcha_xxx"
}

// Response
{
  "code": "OK",
  "message": "OK",
  "trace_id": "trace_xxx",
  "request_id": "req_xxx",
  "data": {
    "execution_id": "exec_123",
    "status": "pending",
    "workflow_id": "wf_123",
    "started_at": "2026-02-01T12:10:00Z",
    "session_id": "sess_anon_123",
    "message": "执行已开始"
  }
}
```

---

## 57. SQL 建表草案（示例片段）

1. [x] `workspaces` 建表示例（输出：SQL 片段；验收：可执行）。
   - 数据源：`apps/server/internal/service/plan_sql_schema_service.go`
   - API：`GET /api/v1/plans/sql-schema`（key: workspaces）

```sql
CREATE TABLE what_reverse_workspaces (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    owner_user_id   CHAR(36) NOT NULL,
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(100) NOT NULL,
    icon            VARCHAR(50) DEFAULT '🏢',
    status          VARCHAR(20) DEFAULT 'active',
    plan            VARCHAR(20) DEFAULT 'free',
    region          VARCHAR(50),
    default_app_id  CHAR(36),
    settings_json   JSON DEFAULT (JSON_OBJECT()),
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      DATETIME,
    UNIQUE KEY uniq_workspaces_slug (slug),
    INDEX idx_workspaces_owner (owner_user_id),
    INDEX idx_workspaces_status (status),
    INDEX idx_workspaces_deleted_at (deleted_at),
    FOREIGN KEY (owner_user_id) REFERENCES what_reverse_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

1. [x] `apps` 建表示例（输出：SQL 片段；验收：可执行）。
   - 数据源：`apps/server/internal/service/plan_sql_schema_service.go`
   - API：`GET /api/v1/plans/sql-schema`（key: apps_versions）

```sql
CREATE TABLE what_reverse_apps (
    id                 CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    workspace_id       CHAR(36) NOT NULL,
    owner_user_id      CHAR(36) NOT NULL,
    name               VARCHAR(200) NOT NULL,
    slug               VARCHAR(100) NOT NULL,
    icon               VARCHAR(50) DEFAULT '📦',
    description        TEXT,
    status             VARCHAR(20) DEFAULT 'draft',
    current_version_id CHAR(36),
    pricing_type       VARCHAR(20) DEFAULT 'free',
    price              DECIMAL(10, 2),
    created_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    published_at       DATETIME,
    deleted_at         DATETIME,
    UNIQUE KEY uniq_apps_workspace_slug (workspace_id, slug),
    INDEX idx_apps_workspace (workspace_id),
    INDEX idx_apps_owner (owner_user_id),
    INDEX idx_apps_status (status),
    INDEX idx_apps_deleted_at (deleted_at),
    FOREIGN KEY (workspace_id) REFERENCES what_reverse_workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_user_id) REFERENCES what_reverse_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE what_reverse_app_versions (
    id           CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    app_id       CHAR(36) NOT NULL,
    version      VARCHAR(50) NOT NULL,
    changelog    TEXT,
    workflow_id  CHAR(36),
    ui_schema    JSON,
    db_schema    JSON,
    config_json  JSON,
    created_by   CHAR(36),
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_app_version (app_id, version),
    INDEX idx_app_versions_app (app_id),
    INDEX idx_app_versions_created (created_at),
    FOREIGN KEY (app_id) REFERENCES what_reverse_apps(id) ON DELETE CASCADE,
    FOREIGN KEY (workflow_id) REFERENCES what_reverse_workflows(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES what_reverse_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 58. UI Schema 示例模板

1. [x] 基础表单 + 结果视图示例（输出：示例 JSON；验收：可渲染）。
   - 数据源：`apps/server/internal/service/plan_ui_schema_templates_service.go`
   - API：`GET /api/v1/plans/ui-schema-templates`（key: form_report）

```json
{
  "schema_version": "1.0.0",
  "layout": { "type": "single_column" },
  "blocks": [
    {
      "id": "report_form",
      "type": "form",
      "label": "生成报告",
      "children": [
        {
          "id": "report_title",
          "type": "input",
          "label": "标题",
          "input_key": "title",
          "props": { "placeholder": "例如：月度运营报告" },
          "validation": { "required": true }
        },
        {
          "id": "report_period",
          "type": "select",
          "label": "周期",
          "input_key": "period",
          "props": { "options": ["本周", "本月", "本季度"] },
          "validation": { "required": true }
        },
        {
          "id": "report_goals",
          "type": "input",
          "label": "目标",
          "input_key": "goals",
          "props": { "placeholder": "关键目标或指标" },
          "validation": { "required": true }
        },
        {
          "id": "report_notes",
          "type": "input",
          "label": "补充说明",
          "input_key": "notes",
          "props": { "placeholder": "可选背景或限制条件", "multiline": true }
        }
      ]
    },
    {
      "id": "report_preview",
      "type": "card",
      "label": "报告摘要",
      "props": { "description": "提交后在此展示摘要与关键结论" }
    }
  ],
  "actions": [{ "id": "submit", "type": "submit", "label": "生成报告" }],
  "result_view": {
    "type": "markdown",
    "props": { "title": "生成结果" }
  }
}
```

---

## 59. AI 输出协议示例

1. [x] App 生成输出示例（输出：示例 JSON；验收：可解析）。
   - 数据源：`apps/server/internal/service/plan_ai_templates_service.go`
   - API：`GET /api/v1/plans/ai-templates`（key: generate_app）

```json
{
  "schema_version": "1.0",
  "app_metadata": { "name": "日报助手", "description": "生成日报" },
  "workflow_definition": { "name": "日报工作流", "nodes": [], "edges": [] },
  "ui_schema": { "schema_version": "1.0.0", "blocks": [] },
  "db_schema": { "tables": [] },
  "access_policy": { "access_mode": "private", "data_classification": "public" }
}
```

---

## 60. 迁移脚本执行清单（步骤级）

1. [x] 迁移前检查（输出：检查清单；验收：可执行）。
   - 备份主库
   - 关闭写入或开启双写

2. [x] 数据回填步骤（输出：步骤清单；验收：无数据丢失）。
   - 创建 default workspace
   - 回填 workspace_id
   - 校验数量与一致性

3. [x] 灰度切换步骤（输出：步骤清单；验收：平滑）。
   - 小流量开关
   - 监控指标对比

4. [x] 回滚步骤（输出：回滚清单；验收：可恢复）。
   - 数据源：`apps/server/internal/service/plan_migration_checklist_service.go`
   - API：`GET /api/v1/plans/migrations/checklist`

---

## 61. SLO/SLA 与验收指标细化

1. [x] Runtime 响应时间 SLO（输出：指标表；验收：可监控）。
   - P95 < 2s

2. [x] 执行成功率 SLO（输出：指标表；验收：可监控）。
   - success_rate >= 99%

3. [x] DB Provision 成功率与耗时（输出：指标表；验收：可监控）。

4. [x] 域名验证成功率（输出：指标表；验收：可监控）。
   - 数据源：`apps/server/internal/service/plan_slo_service.go`
   - API：`GET /api/v1/plans/slo`

---

## 62. 模块级 WBS 细分（样例）

1. [x] Workspace 模块任务分解（输出：任务清单；验收：可排期）。
   - 表结构与迁移
   - API 接口
   - 权限与成员
   - 前端页面

2. [x] App 模块任务分解（输出：任务清单；验收：可排期）。
   - App 模型
   - 版本管理
   - 发布流程
   - 公开访问策略

3. [x] Runtime 模块任务分解（输出：任务清单；验收：可排期）。
   - 数据源：`apps/server/internal/service/plan_module_wbs_service.go`
   - API：`GET /api/v1/plans/wbs/modules`

   - 路由解析
   - 执行链路
   - 日志与监控

---

## 63. 依赖与里程碑表（可选）

1. [x] 依赖矩阵（输出：矩阵表；验收：依赖清晰）。
   - Workspace -> App -> Runtime

2. [x] 里程碑节点与时间线（输出：时间线；验收：可跟踪）。
   - 数据源：`apps/server/internal/service/plan_dependency_milestone_service.go`
   - API：`GET /api/v1/plans/dependencies`

---

## 64. 角色与责任分工（RACI）

1. [x] 定义 RACI 表（输出：RACI；验收：角色清晰）。
   - 产品、后端、前端、运维、安全

2. [x] 关键决策 Owner 设定（输出：责任清单；验收：可落地）。
   - 数据源：`apps/server/internal/service/plan_raci_service.go`
   - API：`GET /api/v1/plans/raci`

---

## 65. SQL 全量建表草案（骨架级）

1. [x] `workspaces` 全量字段 SQL（输出：SQL 草案；验收：可执行）。
2. [x] `workspace_members`、`workspace_roles` SQL（输出：SQL 草案；验收：可执行）。
3. [x] `apps`、`app_versions` SQL（输出：SQL 草案；验收：可执行）。
4. [x] `app_access_policies`、`app_domains` SQL（输出：SQL 草案；验收：可执行）。
5. [x] `workspace_databases` SQL（输出：SQL 草案；验收：可执行）。
6. [x] `app_sessions`、`app_events`、`audit_logs` SQL（输出：SQL 草案；验收：可执行）。
   - 数据源：`apps/server/internal/service/plan_sql_schema_service.go`
   - API：`GET /api/v1/plans/sql-schema`

---

## 66. API 字段规范与校验规则

1. [x] 字段命名规范（输出：规范；验收：一致）。
   - snake_case / camelCase 统一

2. [x] 字段校验规则清单（输出：校验表；验收：可复用）。
   - slug 命名规则
   - domain 格式规则
   - version 号规则

3. [x] 输入/输出安全过滤规则（输出：清单；验收：可执行）。
   - HTML 转义
   - JSON size 限制

4. [x] 通用分页与排序协议（输出：协议；验收：统一）。
   - 数据源：`apps/server/internal/service/plan_api_field_rules_service.go`
   - API：`GET /api/v1/plans/api-field-rules`

   - page、page_size、sort_by、order

---

## 67. UI Schema 模板库（按场景）

1. [x] “表单 + 报告”模板（输出：模板；验收：可直接使用）。
2. [x] “搜索 + 列表”模板（输出：模板；验收：可直接使用）。
3. [x] “问答 + 结果摘要”模板（输出：模板；验收：可直接使用）。
4. [x] “多步骤向导”模板（输出：模板；验收：可直接使用）。
   - 数据源：`apps/server/internal/service/plan_ui_schema_templates_service.go`
   - API：`GET /api/v1/plans/ui-schema-templates`

---

## 68. AI 生成模板库（按意图）

1. [x] 生成 App（从需求到 app_metadata/workflow/ui/db）（输出：模板；验收：可复用）。
2. [x] 修改 App（输出：diff/patch 模板；验收：可复用）。
3. [x] 优化性能（输出：提示词模板；验收：可复用）。
4. [x] 安全审查（输出：提示词模板；验收：可复用）。
   - 数据源：`apps/server/internal/service/plan_ai_templates_service.go`
   - API：`GET /api/v1/plans/ai-templates`

---

## 69. Runtime 安全策略细化

1. [x] 运行时执行沙箱策略（输出：策略；验收：可执行）。
2. [x] 代码节点资源限制（输出：限制表；验收：可控）。
3. [x] 外部请求白名单/黑名单（输出：规则；验收：可配置）。
4. [x] 访问速率自动降级（输出：策略；验收：稳定）。
   - 数据源：`apps/server/internal/service/plan_runtime_security_policy_service.go`
   - API：`GET /api/v1/plans/runtime-security`

---

## 70. 数据库 Schema 生成与变更流程

1. [x] 由 AI 生成 DB Schema 的批准流程（输出：流程；验收：可控）。
   - 已接入审核队列（db_schema），支持提交、查询、通过/拒绝。
2. [x] Schema 变更审查机制（输出：机制；验收：可追溯）。
   - 支持审核记录查询，可追溯审核动作与结果。
3. [x] Schema 回滚策略（输出：策略；验收：可恢复）。
   - 支持指定目标版本进行 DB Schema 回滚并生成新版本。

---

## 71. 执行日志与审计字段规范

1. [x] Execution 日志字段规范（输出：字段表；验收：可落库）。
   - 已提供字段表接口 `/api/v1/plans/logs/schema`（execution/node_log）。
2. [x] Audit 日志字段规范（输出：字段表；验收：可追溯）。
   - 已提供字段表接口 `/api/v1/plans/logs/schema`（audit_log + metadata 追溯字段）。
3. [x] 日志保留与归档策略（输出：策略；验收：可执行）。
   - 已提供策略接口 `/api/v1/plans/retention`，并接入定时清理任务。

---

## 72. 前端交互细节与 UX 标准

1. [x] 创建 App 的引导流程（输出：交互流程；验收：可用）。
   - Builder 画布提供新手引导卡片，含 4 步流程与快捷入口。
2. [x] 发布前检查与提示（输出：交互规范；验收：可用）。
   - 已在 Builder 发布对话框补齐保存/版本/访问策略/公开防护检查与提示。
3. [x] 公开访问用户提示与权限说明（输出：文案/流程；验收：可用）。
   - 发布对话框展示访问模式、公开访问风险提示与配置入口。
4. [x] 异常状态 UI 规范（输出：规范；验收：可用）。
   - 已新增统一异常状态组件 `ExceptionState/EmptyState`，规划页已覆盖加载失败与空任务场景。

---

## 73. 开发规范与代码标准

1. [x] 后端模块分层规范（输出：规范；验收：一致）。
2. [x] 前端组件规范与目录结构（输出：规范；验收：一致）。
3. [x] API/DB 变更的评审流程（输出：流程；验收：可执行）。

---

## 74. 交付物清单（最终）

1. [x] 数据库迁移脚本（输出：SQL 文件；验收：可运行）。
2. [x] API 文档（输出：OpenAPI/Markdown；验收：可用）。
3. [x] 前端页面与组件（输出：页面清单；验收：可演示）。
4. [x] 运行时服务与监控（输出：服务清单；验收：可观测）。

---

## 75. API 详细接口定义（字段级清单）

1. [x] Workspace API 字段级规范（输出：字段表；验收：可实现）。
   - create：name、slug、region、settings
   - update：name、slug、status、plan

2. [x] App API 字段级规范（输出：字段表；验收：可实现）。
   - create：name、slug、description、workflow_id、ui_schema
   - publish：access_policy、domain_bindings
   - version：changelog、config_json

3. [x] Runtime API 字段级规范（输出：字段表；验收：可实现）。
   - inputs、session_id、client_context、dry_run
   - outputs、execution_id、usage

4. [x] Domain API 字段级规范（输出：字段表；验收：可实现）。
   - domain、verification_token、status

5. [x] DB Provisioner API 字段级规范（输出：字段表；验收：可实现）。
   - db_name、region、status、secret_ref
   - 数据源：`apps/server/internal/service/plan_api_field_specs_service.go`
   - API：`GET /api/v1/plans/api-field-specs`

---

## 76. OpenAPI 与 SDK 生成计划

1. [x] OpenAPI 规范输出模板（输出：模板；验收：可生成）。
   - 数据源：`apps/server/internal/service/plan_openapi_sdk_service.go`
   - API：`GET /api/v1/plans/openapi-sdk`
2. [x] SDK 目标语言清单（输出：清单；验收：优先级明确）。
   - 数据源：`apps/server/internal/service/plan_openapi_sdk_service.go`
   - API：`GET /api/v1/plans/openapi-sdk`
3. [x] 自动化生成与发布流程（输出：流水线；验收：可执行）。
   - 数据源：`apps/server/internal/service/plan_openapi_sdk_service.go`
   - API：`GET /api/v1/plans/openapi-sdk`

---

## 77. 安全威胁模型与评审

1. [x] 威胁建模（输出：STRIDE/清单；验收：可追踪；已提供 `GET /api/v1/plans/security-threat-model`）。
2. [x] 风险分级与缓解措施（输出：矩阵；验收：可执行；已提供 `GET /api/v1/plans/security-risk-matrix`）。
3. [x] 安全评审流程（输出：流程；验收：上线必经；已提供 `GET /api/v1/plans/security-review`）。

---

## 78. 故障演练与应急预案

1. [x] 关键故障演练计划（输出：演练清单；验收：可执行；已提供 `/api/v1/plans/incident-drills` 并在系统状态页展示）。
   - DB provision 失败
   - Runtime 超时
   - 域名解析错误

2. [x] 应急响应与回滚责任人（输出：责任表；验收：清晰；已提供 `/api/v1/plans/incident-owners` 并在系统状态页展示）。
3. [x] 事故复盘模板（输出：模板；验收：可复用；已提供 `/api/v1/plans/postmortem-template` 并在系统状态页展示）。

---

## 79. 监控指标字典与埋点计划

1. [x] 指标字典（输出：字典表；验收：覆盖核心链路；已提供 API `GET /api/v1/plans/metrics-dictionary` 返回 Prometheus 指标字典，并在系统状态页展示）。
2. [x] 前端埋点事件（输出：事件表；验收：可分析；已提供 API `GET /api/v1/plans/tracking-events/frontend` 返回事件定义与属性口径，并在系统状态页展示）。
3. [x] 后端埋点事件（输出：事件表；验收：可分析；已提供 API `GET /api/v1/plans/tracking-events/backend`，事件来源 runtime_events，并在系统状态页展示）。

---

## 80. AI 质量评估与回归

1. [x] AI 生成质量指标（输出：指标表；验收：可量化；已在应用监控页展示）。
2. [x] 回归测试集构建（输出：用例集；验收：可复用；已在应用监控页提供可复用用例集）。
3. [x] 人工评审抽样策略（输出：策略；验收：可执行；已在应用监控页提供抽样策略与规则）。

---

## 81. 演示与示例应用清单

1. [x] 内置示例 App 清单（输出：清单；验收：覆盖典型场景；已在 Workbench 展示示例 App 清单）。
2. [x] Demo 数据与脚手架（输出：模板；验收：可演示；已在 Workbench 提供数据包与脚手架模板）。
3. [x] 演示流程脚本（输出：脚本；验收：可复用；已在 Workbench 提供演示流程脚本）。

---

## 82. 上线节奏与版本管理

1. [x] 版本号规范（输出：规范；验收：一致；SemVer: MAJOR.MINOR.PATCH(-rc.N)(+build)，插件 Manifest 校验已统一）。
2. [x] 发布节奏与窗口（输出：节奏表；验收：可执行；已在 Workbench 展示发布节奏与窗口）。
3. [x] 版本变更公告模板（输出：模板；验收：可发布；已在 Workbench 提供公告模板）。

---

## 83. 基础设施与部署架构

1. [x] 部署拓扑图（输出：拓扑图；验收：可指导部署；已在 Workbench 展示部署拓扑图）。
   - Web / API / Runtime / DB Provisioner / Domain Service

1. [x] 容器化与镜像规范（输出：规范；验收：可构建；已在 Workbench 展示镜像规范）。
   - 镜像标签、版本、回滚策略

1. [x] 环境隔离与命名规范（输出：规范；验收：一致；已在 Workbench 展示环境规范）。
   - dev / staging / prod

1. [x] 部署流水线与灰度策略（输出：流程；验收：可执行；已在 Workbench 展示部署流水线与灰度策略）。

---

## 84. 机密管理与配置治理（细化）

1. [x] Secret 生命周期管理（输出：规范；验收：可执行）。
   - 创建、轮换、吊销（API：`/api/v1/secrets`，支持 rotate / revoke）

1. [x] 配置中心与动态配置（输出：方案；验收：可热更新）。
   - 配置项 CRUD（API：`/api/v1/config/items`，更新后立即生效）

1. [x] 敏感字段脱敏展示规则（输出：规则；验收：可用）。
   - 规则 API：`/api/v1/security/masking-rules`

---

## 85. 多地域与边缘加速方案

1. [x] 多地域部署策略（输出：方案；验收：可扩展；已在 Workbench 规划模块新增「多地域与边缘加速」任务，并支持已初始化 Workspace 自动补入）。
   - 用户就近访问

1. [x] CDN 与静态资源加速（输出：方案；验收：可用；已在 Workbench 规划模块新增「多地域与边缘加速」任务，并支持已初始化 Workspace 自动补入）。

1. [x] Runtime 入口就近路由（输出：规则；验收：可控；已在 Workbench 规划模块新增「多地域与边缘加速」任务，并支持已初始化 Workspace 自动补入）。

---

## 86. Webhook 与第三方集成

1. [x] Webhook 事件定义（输出：事件表；验收：可订阅）。
   - 已提供事件清单 API：`GET /api/v1/webhooks/events`（按分类返回事件与描述）。

   - app.published / execution.completed / domain.verified

1. [x] Webhook 安全签名（输出：规范；验收：安全）。
   - 签名：`X-ReverseAI-Timestamp` + `X-ReverseAI-Signature`（`v1=HMAC_SHA256(secret, timestamp.payload)`）。
   - 试投递：`POST /api/v1/webhooks/:id/test`（自动生成签名并回传投递结果）。

1. [x] 常见集成清单（输出：清单；验收：可扩展）。
   - 清单 API：`GET /api/v1/integrations/catalog`（Slack / Notion / Zapier）。

   - Slack / Notion / Zapier

---

## 87. 模板市场与应用分发（可选）

1. [x] 模板/应用分发机制（输出：机制；验收：可发布）。
1. [x] 应用展示与搜索（输出：功能清单；验收：可运营）。
1. [x] 评价与反馈机制（输出：规则；验收：可落地）。
   - 说明：应用已发布且 access_mode 为 public_auth / public_anonymous 即可进入应用市场；已提供公开列表与评分反馈接口。

---

## 88. 模型路由与多模型策略

1. [x] 模型选择规则（输出：策略；验收：可执行）。
   - 支持 `routingStrategy=budget|quality` 与 `routingModels/modelCandidates`（provider/model/质量/成本）。
   - 未配置路由时保持原 provider/model + fallback 顺序。

1. [x] 模型失败回退策略（输出：策略；验收：稳定）。
   - 按路由顺序依次尝试，失败/不可用自动回退。
   - 输出 `attempts` / `fallback_used` 便于排查。

1. [x] 模型用量与成本统计（输出：指标；验收：可分析）。
   - 写入 `what_reverse_model_usage_events`，并提供 `GET /api/v1/workspaces/:id/model-usage` 汇总 provider/model/token/cost。
   - 查询 API：`GET /api/v1/workspaces/:id/model-usage`。

---

## 89. Workflow 节点库与扩展机制

1. [x] 节点清单与分类（输出：清单；验收：可扩展）。
   - AI / HTTP / DB / UI / Utility
   - 已建立节点清单与分类映射，可合并内置/扩展/自定义节点并输出分类统计。

1. [x] 节点版本与兼容策略（输出：规则；验收：可升级）。
   - 语义化版本升级类型判定（major/minor/patch/prerelease）。
   - min/max SDK 兼容性校验与可读问题输出。

1. [x] 节点自定义扩展机制（输出：规范；验收：可扩展）。
   - 支持扩展节点注册与去重合并，保留来源与版本信息。

---

## 90. 旧功能迁移执行细化

1. [x] 旧 workflow 与 agent 迁移映射表（输出：映射表；验收：可执行）。
1. [x] 迁移完成校验清单（输出：清单；验收：可确认）。
1. [x] 迁移后的用户引导与说明（输出：文案；验收：可发布）。

---

## 91. 数据治理与隐私策略

1. [x] 数据分类与访问权限矩阵（输出：矩阵；验收：可执行）。
   - 规划接口：`/api/v1/plans/data-governance`（classification_matrix）。
   - 来源：`internal/pkg/security/data_classification.go` + `DefaultAccessPolicies`。
   - 矩阵字段：min_role / required_perms / allow_anonymous / audit_required / encrypt_required / mask_on_export。

1. [x] 数据最小化与用途限制（输出：规范；验收：可审计）。
   - 导出范围限定：workspace/members/apps/workflows（`WorkspaceDataExport`）。
   - 运行/执行/审计日志写入前脱敏（`event_recorder` / `execution_service` / `audit_log_service`）。
   - 保留与清理：`retention.*` + `security.audit_log_retention_days` + `archive.export_retention_days`。

1. [x] 用户数据导出与删除 SLA（输出：SLA；验收：可落实）。
   - 导出接口：`POST /api/v1/workspaces/:id/exports` + `GET /api/v1/workspaces/:id/exports/:exportId`。
   - 导出调度：`archive.worker_interval`，下载有效期：`archive.export_retention_days`。
   - 删除接口：`DELETE /api/v1/workspaces/:id`（返回 restore/purge 窗口），清理由 retention job 执行。

1. [x] 日志与指标的匿名化策略（输出：规则；验收：合规）。
   - 脱敏开关：`security.pii_sanitization_enabled`。
   - 覆盖：访问日志 / 运行事件 / 执行日志 / 审计日志。
   - 指标来自聚合统计，不暴露 raw payload。

---

## 92. 国际化与多语言支持（可选）

1. [x] 语言资源管理规范（输出：规范；验收：可扩展）。
   - 规划接口：`/api/v1/plans/i18n`（resource_management）。
   - 覆盖：资源命名/命名空间/回退链/发布流程/校验策略。

1. [x] UI 文案与提示词多语言策略（输出：策略；验收：一致）。
   - 规划接口：`/api/v1/plans/i18n`（copy_strategy）。
   - 关注：术语统一、提示词变量占位、语气与品牌一致性。

1. [x] 日期/时区/货币格式规范（输出：规范；验收：可用）。
   - 规划接口：`/api/v1/plans/i18n`（format_spec）。
   - 规则：默认 locale/timezone，按 workspace 覆盖，币种与数字格式本地化。

---

## 93. 响应式与多端体验

1. [x] 主要断点与布局规则（输出：规范；验收：一致）。
   - 规划接口：`/api/v1/plans/responsive`（breakpoints/layout_rules）。
   - 断点基于 Tailwind 默认：sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536。

1. [x] 公开访问页移动端体验（输出：规范；验收：可用）。
   - 适用范围：`apps/web/src/app/(unauth)` 与公开展示页。
   - 关注：首屏 CTA 触达、卡片单列、无横向滚动。

1. [x] App 编辑器在大屏与小屏适配（输出：策略；验收：可用）。
   - 关联页面：`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/[appId]/builder/page.tsx`。
   - 策略：大屏双栏画布/面板，小屏抽屉/标签页切换配置区。

---

## 94. 可访问性（A11y）

1. [x] 关键页面 A11y 标准（输出：清单；验收：可评估）。
   - 规划接口：`/api/v1/plans/a11y`（page_checklist）。
   - 覆盖：公开访问页、Dashboard 核心页、App 编辑器、认证与设置页。

1. [x] 组件可访问性约束（输出：规范；验收：可执行）。
   - 约束：IconButton 必须 aria-label、输入项 label/aria-describedby、分页 aria-current。
   - 主要组件：`apps/web/src/components/ui`。

1. [x] 自动化 A11y 检测（输出：流程；验收：可持续）。
   - 工具：axe-core/Lighthouse（规划中，Enabled=false）。
   - 产物：JSON/HTML 报告，严重级别阻断合并。

---

## 95. 灾备与恢复（DR）

1. [x] RPO/RTO 目标（输出：指标；验收：可监控）。
   - 规划接口：`/api/v1/plans/dr`（recovery_targets）。
   - 覆盖：workspace DB / runtime / audit logs。

1. [x] 跨区备份与恢复演练（输出：计划；验收：可执行）。
   - 参考接口：`POST /api/v1/workspaces/:id/database/backup` / `POST /api/v1/workspaces/:id/database/restore`。
   - 演练频率：每月 1 次（可按关键 workspace 提升频率）。

1. [x] 故障切换流程（输出：流程；验收：可用）。
   - 参考：`POST /api/v1/workspaces/:id/restore` + 域名/路由切换。
   - 验证：关键 API 与 runtime 执行恢复。

---

## 96. SRE 运行手册（Runbook）

1. [x] 运行时故障排查手册（输出：Runbook；验收：可用）。
1. [x] DB Provision 失败排查手册（输出：Runbook；验收：可用）。
1. [x] 域名绑定/证书故障排查手册（输出：Runbook；验收：可用）。

---

## 97. 合规与认证（可选）

1. [x] 合规清单与差距评估（输出：清单；验收：可执行）。
   - 规划接口：`GET /api/v1/plans/compliance?workspace_id=...`
   - 评估接口：`GET /api/v1/security/compliance/:workspaceId`

1. [x] 数据存储地域合规策略（输出：策略；验收：可执行）。
   - 规划接口：`GET /api/v1/plans/data-residency`

1. [x] 日志保留与审计合规策略（输出：策略；验收：可审计）。
   - 规划接口：`GET /api/v1/plans/audit-compliance`
   - 关联：`GET /api/v1/plans/retention` / `GET /api/v1/plans/logs/schema`

---

## 98. 法务与条款（产品化）

1. [x] 服务条款与隐私政策更新（输出：草案；验收：可发布）。
   - 实现：`/terms` 与 `/privacy` 页面已更新内容与更新时间。
1. [x] 公开访问内容责任声明（输出：文案；验收：可用）。
   - 实现：`/terms` 条款新增责任声明，`/store` 页面提供提示。
1. [x] AI 生成内容免责声明（输出：文案；验收：可用）。
   - 实现：`/terms` 条款新增免责声明，`/store` 页面提供提示。

---

## 99. 客户成功与支持体系

1. [x] 帮助中心结构（输出：目录；验收：可上线）。
   - 已实现：帮助中心新增目录分区与支持入口（`/help`、`/support`）。
1. [x] FAQ 与故障自助指南（输出：文档；验收：可用）。
   - 已实现：FAQ 增补故障排查分类与条目，新增自助指南页面（`/help/troubleshooting`）。
1. [x] 工单与支持 SLA（输出：SLA；验收：可执行）。
   - 已实现：支持工单 API（`POST /api/v1/support/tickets`、`GET /api/v1/support/sla`）与前端提交页。
1. [x] 工单列表与后台管理视图（输出：列表/筛选；验收：可管理）。
   - 已实现：管理员接口 `GET /api/v1/admin/support/tickets`，后台页面 `/support-tickets`。
1. [x] 工单状态流转与备注（输出：状态更新；验收：可追踪）。
   - 已实现：`PATCH /api/v1/admin/support/tickets/:id/status`，记录 `status_note` 与历史。
1. [x] 支持入口验证码与限流（输出：防刷策略；验收：可用）。
   - 已实现：工单创建支持验证码 token，超频时要求验证码并限流。
1. [x] 工单详情页与状态流转日志（输出：详情页；验收：可追踪）。
   - 已实现：后台详情页 `/support-tickets/:id` 展示状态流转与备注。
1. [x] 支持渠道配置与自动分派规则（输出：配置页；验收：可生效）。
   - 已实现：`/support-settings` 配置支持渠道与路由规则，创建工单自动分派，公开渠道接口 `GET /api/v1/support/channels`。
1. [x] 工单评论与协作（输出：评论流；验收：可协作）。
   - 已实现：工单详情页支持评论与内部标记，后台接口 `/api/v1/admin/support/tickets/:id/comments`。
1. [x] 工单协作通知（输出：提醒策略；验收：可触达）。
   - 已实现：工单创建/状态更新/评论新增触发系统通知（按分派与请求人发送）。
1. [x] 渠道级 SLA 策略（输出：策略；验收：可配置）。
   - 已实现：支持渠道配置 `sla_overrides`，工单创建按渠道 SLA 计算响应时间。
1. [x] 分派对象映射（团队/队列）（输出：映射；验收：可分派）。
   - 已实现：支持团队/队列与成员配置，并用于通知触达。
1. [x] 通知模板配置（输出：模板；验收：可配置）。
   - 已实现：通知模板 API 与支持设置页面配置区。
1. [x] 工单分派对象名称映射（输出：名称；验收：可读）。
   - 已实现：详情页按团队/队列映射显示分派名称（`/support-tickets/:id`）。
1. [x] 通知模板多语言/多渠道配置（输出：模板；验收：可配置）。
   - 已实现：模板支持站内/邮件/短信与多语言层级配置（`/support-settings` + `notification-templates`）。
1. [x] SLA 维度扩展（首次响应/更新节奏/解决时限）（输出：SLA；验收：可追踪）。
   - 已实现：工单记录响应/更新/解决 SLA 截止时间并展示。

---

## 100. Feature Flags 与渐进发布

1. [x] Feature Flag 管理规范（输出：规范；验收：可执行）。
1. [x] 灰度用户群体划分策略（输出：策略；验收：可控）。
1. [x] Flag 回收与清理机制（输出：机制；验收：可持续）。

- 说明：新增规划接口 `/api/v1/plans/feature-flags` 输出规范/策略/机制。

---

## 101. 运营与增长实验平台（可选）

1. [x] 实验平台接入与指标定义（输出：方案；验收：可执行）。
1. [x] A/B 分流策略（输出：策略；验收：可控）。
1. [x] 实验结果回收与决策流程（输出：流程；验收：可执行）。
   - 说明：已提供 `/api/v1/plans/growth-experiments` 输出接入、分流与回收流程。

---

## 102. 变更记录与 ADR

1. [x] 架构决策记录（ADR）模板（输出：模板；验收：可复用）。详见 `docs/standards/ADR-TEMPLATE.md`。
1. [x] 版本变更记录规范（输出：规范；验收：一致）。详见 `docs/standards/CHANGELOG-STANDARD.md`。
1. [x] 重大变更审批流程（输出：流程；验收：可执行）。详见 `docs/standards/MAJOR-CHANGE-APPROVAL.md`。

---

## 103. 代码所有权与评审规范

1. [x] Code Owner 规则（输出：规范；验收：可执行）。
1. [x] 评审 SLA 与优先级规则（输出：规则；验收：可执行）。
1. [x] 关键模块合并门禁（输出：规则；验收：可执行）。
1. [x] 关键 owner 组可配置（输出：规则；验收：可维护）。
   - 已实现：CODEOWNERS 支持 `# critical-owners:` 配置关键 owner 组。
1. [x] CODEOWNERS 复杂模式解析支持（输出：能力；验收：可匹配）。
   - 已实现：review-gate 解析支持 `*`/`**`/`?`/`[]`/转义空格/`!` 取反。
1. [x] owner 组分级审批数（输出：规则；验收：可执行）。
   - 已实现：`# critical-approvals-base:` 与 `# critical-owners-approvals:` 可配置审批数。
1. [x] 多文件合并策略（输出：规则；验收：可执行）。
   - 已实现：`# critical-files-approvals:` 按 critical 文件数量提高审批数。
1. [x] 多 owner 组合并策略（输出：规则；验收：可执行）。
   - 已实现：`# critical-groups-approvals:` 按 critical 组数量提高审批数。
1. [x] 大变更审批提升（输出：规则；验收：可执行）。
   - 已实现：`# critical-changes-approvals:` 按 critical 变更行数提高审批数。
1. [x] 模块级别分级审批（输出：规则；验收：可执行）。
   - 已实现：`# module-approvals:` 按路径匹配模块并提高审批数（使用 `merge-gate/critical`）。

---

## 104. 异步任务与队列系统

1. [x] 队列类型与优先级定义（输出：队列清单；验收：可落地）。
   - execution / db_provision / domain_verify / metrics_aggregation
   - 已实现：`queue.queues` 补齐四类队列并保留 `workflow` 兼容权重映射。

1. [x] 重试与退避策略（输出：策略；验收：可执行）。
   - 最大重试次数、指数退避
   - 已实现：全局指数退避（500ms~10m）+ 任务级 `MaxRetry`。

1. [x] 死信队列与重放流程（输出：流程；验收：可恢复）。
   - 已实现：Ops 接口 `GET /api/v1/ops/queues/dead`、`POST /api/v1/ops/queues/dead/:taskId/retry`、`DELETE /api/v1/ops/queues/dead/:taskId`。
1. [x] 幂等性与去重机制（输出：规范；验收：避免重复）。
   - 已实现：任务入队 `Unique` 去重，DB provision/域名验证使用 `ErrTaskNoop` 幂等兜底。
1. [x] 延时任务与定时清理（输出：清单；验收：可维护）。
   - 已实现：域名验证按 `NextRetryAt` 延时入队，指标聚合延时 1m，任务保留 24h 自动清理。

API 示例（异步入队 / 死信重放）：

```json
// POST /api/v1/workspaces/{workspaceId}/database?async=true
// Request
{}

// Response
{
  "code": "OK",
  "message": "OK",
  "trace_id": "trace_xxx",
  "request_id": "req_xxx",
  "data": {
    "queued": true,
    "task": {
      "task_id": "task_123",
      "queue": "db_provision",
      "deduped": false
    }
  }
}
```

```json
// POST /api/v1/apps/{appId}/domains/{domainId}/verify?async=true
// Request
{}

// Response
{
  "code": "OK",
  "message": "OK",
  "trace_id": "trace_xxx",
  "request_id": "req_xxx",
  "data": {
    "queued": true,
    "task": {
      "task_id": "task_456",
      "queue": "domain_verify",
      "deduped": false
    }
  }
}
```

```json
// GET /api/v1/ops/queues/dead?queue=domain_verify&page=1&page_size=20
// Response
{
  "code": "OK",
  "message": "OK",
  "trace_id": "trace_xxx",
  "request_id": "req_xxx",
  "data": {
    "queue": "domain_verify",
    "page": 1,
    "page_size": 20,
    "tasks": [
      {
        "ID": "task_456",
        "Queue": "domain_verify",
        "Type": "app:domain:verify",
        "State": 5,
        "MaxRetry": 5,
        "Retried": 5,
        "LastErr": "domain verify failed",
        "NextProcessAt": "0001-01-01T00:00:00Z"
      }
    ]
  }
}
```

```json
// POST /api/v1/ops/queues/dead/{taskId}/retry?queue=domain_verify
// Response
{
  "code": "OK",
  "message": "OK",
  "trace_id": "trace_xxx",
  "request_id": "req_xxx",
  "data": {
    "queue": "domain_verify",
    "task_id": "task_456",
    "replayed": true
  }
}
```

```json
// DELETE /api/v1/ops/queues/dead/{taskId}?queue=domain_verify
// Response
{
  "code": "OK",
  "message": "OK",
  "trace_id": "trace_xxx",
  "request_id": "req_xxx",
  "data": {
    "queue": "domain_verify",
    "task_id": "task_456",
    "deleted": true
  }
}
```

说明：`tasks` 返回 asynq `TaskInfo`，`State` 为整数枚举（`5` = archived）。

说明：新增规划接口 `/api/v1/plans/queue-system` 输出队列清单、重试退避、死信重放与幂等/延时策略。

---

## 105. 数据一致性与幂等性

1. [x] 关键写操作幂等策略（输出：清单；验收：可实现）。
   - 创建 app / 发布 / provision
   - 已实现：支持 Idempotency-Key / X-Request-Id 幂等；重复请求返回相同资源，冲突/处理中返回 409

1. [x] 事务边界与一致性层级（输出：规范；验收：可执行）。
1. [x] 异步更新的最终一致性说明（输出：说明；验收：可理解）。
1. [x] 数据校验与修复任务（输出：任务清单；验收：可运行）。
1. [x] 双写期间一致性检测（输出：检测方案；验收：可控）。

---

## 106. CI/CD 与质量门禁（细化）

1. [x] Pipeline 必过项（输出：清单；验收：可执行）。
   - 新增 CI 工作流 `.github/workflows/ci-quality-gate.yml`
   - lint/test：`pnpm lint` / `pnpm test` + Go `golangci-lint` / `go test`
   - security scan：复用 `security-scan.yml` 作为可复用工作流
   - schema check：`swag init` 生成 Swagger 并校验无差异

1. [x] 性能基准门禁（输出：阈值；验收：可拦截）。
   - `workflow_dispatch` 输入 `perf_url` 与阈值参数，执行 `scripts/ops/runtime-load-test.mjs`
   - 未提供 `perf_url` 时跳过，不阻断常规 PR 流水线

1. [x] 数据库迁移检查（输出：检查项；验收：可阻断风险）。
   - `scripts/ci/migration-check.mjs` 检查 up/down 配对、重复、非标准命名

1. [x] Feature Flag 发布校验（输出：流程；验收：可控）。
   - PR 若改动 `apps/server/config/config.*` 或 `config.go` 的特性开关，要求加 label `feature-flag/approved`

1. [x] Staging 手动审批点（输出：规则；验收：可执行）。
   - `workflow_dispatch` 触发 staging 环境审批（`environment: staging`）
   - 依赖质量门禁任务完成后进入审批（需在 GitHub 环境中配置审批人）

---

## 107. 容量规划与成本优化（细化）

1. [x] 容量预测模型与阈值（输出：模型；验收：可估算）。
   - 已实现：新增 `/api/v1/plans/capacity-cost` 输出预测模型与阈值（含执行/队列/DB 基线）。
1. [x] 自动扩缩容策略（输出：策略；验收：可执行）。
   - 已实现：`/api/v1/plans/capacity-cost` 的 `autoscaling` 提供扩缩容触发与回收规则。
1. [x] 峰值保护与排队策略（输出：策略；验收：稳定）。
   - 已实现：`/api/v1/plans/capacity-cost` 的 `peak_protection` 覆盖 load shedding/限流/队列积压。
1. [x] 成本优化措施（输出：清单；验收：可执行）。
   - 已实现：`/api/v1/plans/capacity-cost` 的 `cost_optimizations` 关联成本模型/预算/归档/闲时回收。

   - 预留实例 / 弹性伸缩 / 闲时回收

1. [x] 噪声邻居隔离策略（输出：策略；验收：可控）。
   - 已实现：`/api/v1/plans/capacity-cost` 的 `noisy_neighbor_isolation` 覆盖限流、配额与队列权重。

---

## 108. 数据归档与冷存储

1. [x] 归档对象与周期（输出：规则；验收：可执行）。
   - execution logs / audit logs
   - 自动归档由 retention 周期触发，按 `archive.log_archive_batch_days` 分段；执行日志与审计日志分别归档
   - 归档 cutoff 分别以 `retention.execution_log_retention_days` 与 `security.audit_log_retention_days` 为准

1. [x] 冷存储格式与索引（输出：规范；验收：可检索）。
   - ZIP + JSONL（`executions.jsonl` / `node_logs.jsonl` / `audit_logs.jsonl`）
   - `manifest.json` + `index.json` 记录范围、数据集与计数

1. [x] 归档数据回放与导出（输出：流程；验收：可用）。
   - API：`POST/GET /workspaces/:id/log-archives`
   - 回放：`GET /workspaces/:id/log-archives/:archiveId/replay?dataset=...`
   - 下载：`GET /workspaces/:id/log-archives/:archiveId/download`

1. [x] 归档删除与合规清理（输出：策略；验收：可审计）。
   - 自动清理过期归档（`archive.log_archive_retention_days`）
   - 手动删除归档包：`DELETE /workspaces/:id/log-archives/:archiveId`
   - 归档完成后删除对应源日志区间（执行日志/审计日志）

1. [x] 归档管理前端展示（输出：UI；验收：可用）。
   - Workspace 设置页新增归档任务列表与回放面板
   - 支持创建归档、下载、删除与回放查询
   - 回放结果支持表格/原始 JSON 切换与字段映射视图
   - 支持列显隐配置与 CSV 导出
   - 列配置本地持久化，支持默认列模板与“导出全部字段”选项
   - 列配置与自定义模板支持云端同步（随账号）
   - 自定义模板支持共享到团队（workspace 级可见）

1. [x] 回放过滤条件扩展（输出：条件清单；验收：可用）。
   - 审计日志支持 action / actor_user_id / target_type / target_id 过滤
   - 执行日志支持 execution_id / workflow_id / user_id / status 过滤
   - 节点日志支持 execution_id / node_id / node_type / status 过滤
   - 时间范围与分页（limit/offset）过滤

---

## 109. 管理后台与内部运营工具

1. [x] 管理员权限与功能范围（输出：清单；验收：可控）。
1. [x] 用户/Workspace/应用查询与处置（输出：功能清单；验收：可用）。
1. [x] 风控与违规处理入口（输出：流程；验收：可执行）。
1. [x] 工单与支持联动（输出：流程；验收：可追踪）。
   - 已实现：新增 `/api/v1/admin` 管理端 API、权限中间件与能力清单接口。
   - 已实现：支持用户/Workspace/应用查询与暂停/恢复处置（含原因记录）。
   - 已实现：支持工单列表与状态流转，并与管理员操作联动记录。

---

## 110. 安全测试与漏洞响应

1. [x] 周期性渗透测试计划（输出：计划；验收：可执行）。
   - 已实现：`GET /api/v1/plans/security-testing/pentest` 返回渗透测试计划。
1. [x] 依赖与镜像漏洞扫描（输出：流程；验收：可持续）。
   - 已实现：`GET /api/v1/plans/security-testing/scanning` 返回依赖与镜像扫描流程。
1. [x] Bug Bounty 或漏洞报告通道（输出：流程；验收：可用）。
   - 已实现：`GET /api/v1/plans/security-testing/reporting` 返回漏洞报告通道与 SLA。
1. [x] 漏洞响应与披露流程（输出：流程；验收：可执行）。
   - 已实现：`GET /api/v1/plans/security-testing/response` 返回响应与披露流程。

---

## 111. 可用性与错误预算（SRE）

1. [x] Error Budget 计算与消耗规则（输出：规则；验收：可执行）。
1. [x] 合成监控与探针部署（输出：方案；验收：可监控）。
1. [x] 值班与响应时间目标（输出：SLO；验收：可执行）。
1. [x] 回归与稳定性专项（输出：计划；验收：可执行）。
1. [x] SRE 规划数据接入状态页展示（输出：页面；验收：可查看）。
   - 状态页新增「可用性与错误预算（SRE）」区块。
   - 已提供 `/api/v1/plans/sre/error-budgets`、`/api/v1/plans/sre/synthetic-monitoring`、`/api/v1/plans/sre/oncall-slo`、`/api/v1/plans/sre/stability-plan`。

---

## 112. 数据分析平台与数仓接口（可选）

1. [x] 事件与指标入湖规范（输出：规范；验收：可落地）。
   - 已实现：事件入湖 API `POST /api/v1/workspaces/:id/analytics/events`，指标入湖 API `POST /api/v1/workspaces/:id/analytics/metrics`，入湖规范 `GET /api/v1/workspaces/:id/analytics/spec`。
1. [x] 数据脱敏与权限隔离（输出：规则；验收：合规）。
   - 已实现：按数据分级校验（事件=confidential、指标=internal），导出时自动 PII 脱敏。
1. [x] 分析表与指标口径统一（输出：字典；验收：一致）。
   - 已实现：指标字典 `GET/POST /api/v1/workspaces/:id/analytics/metrics/definitions`，入湖校验口径与单位。
1. [x] 数据导出与订阅机制（输出：流程；验收：可用）。
   - 已实现：导出 `POST/GET /api/v1/workspaces/:id/analytics/exports`、下载 `GET /api/v1/workspaces/:id/analytics/exports/:exportId/download`；订阅 `GET/POST/PATCH/DELETE /api/v1/workspaces/:id/analytics/subscriptions` 与触发 `POST /api/v1/workspaces/:id/analytics/subscriptions/:subscriptionId/trigger`。

---

## 113. Workspace 数据库权限模型（细化）

1. [x] 应用级 DB 角色（输出：角色清单；验收：最小权限）。
   - 已实现：新增 Workspace DB 角色模型与 API（创建/列表/轮换/撤销），角色绑定 `app_id`。
1. [x] 只读/读写分离规则（输出：规则；验收：可执行）。
   - 已实现：角色授权按 `role_type` 分离（read=SELECT，write=DML，admin=DDL）。
1. [x] 临时权限与到期回收（输出：策略；验收：可控）。
   - 已实现：角色支持 `expires_at`，列表时自动过期回收并撤销 DB 用户。
1. [x] 审计字段与访问日志（输出：规范；验收：可追踪）。
   - 已实现：角色记录 `last_rotated_at`/`revoked_at` 等审计字段，并写入审计日志事件。

---

## 114. Schema 迁移审批与流水线

1. [x] 变更审批流程（输出：流程；验收：可执行）。
   - 已实现：提交/审批/拒绝/执行 API 与审核队列记录
1. [x] 迁移前模拟与检查（输出：流程；验收：可拦截风险）。
   - 已实现：迁移计划预览 + 风险预检（阻断高危语句）
1. [x] 迁移锁与并发策略（输出：策略；验收：稳定）。
   - 已实现：基于 MySQL GET_LOCK 的迁移锁
1. [x] 迁移后验证与回滚（输出：清单；验收：可恢复）。
   - 已实现：迁移前备份 + 迁移后校验 + 失败自动回滚

---

## 115. 缓存与加速策略（细化）

1. [x] App/Version 缓存策略（输出：规则；验收：降低延迟）。
   - 已实现：Runtime 入口解析缓存可配置 TTL，覆盖 workspace/app/policy/version/domain 读取。
1. [x] 运行结果缓存与失效策略（输出：规则；验收：可控）。
   - 已实现：Execution 终态结果（completed/failed/cancelled）读取缓存，TTL 可配置，非终态不缓存。
1. [x] UI Schema/CDN 缓存（输出：策略；验收：可用）。
   - 已实现：public_anonymous 下 Schema 支持 `?cache=1` 返回可缓存响应（ETag + Cache-Control + stale-while-revalidate）。
1. [x] 缓存穿透/击穿防护（输出：策略；验收：稳定）。
   - 已实现：Runtime 关键查询负缓存 + 并发合并，降低未命中与过期冲击。

---

## 116. 域名与 SSL 生命周期（运营视角）

1. [x] 域名到期与续期提醒（输出：规则；验收：可运营）。
   - 已实现：`domain_expires_at` + `domain_expiry_notified_at` 字段，生命周期巡检定时发送系统通知
1. [x] 证书到期预警与自动续期验证（输出：策略；验收：可执行）。
   - 已实现：SSL 到期预警（系统通知 + `ssl_expiry_notified_at`），自动续期前 DNS 验证并调用续期接口
1. [x] 域名违规与封禁流程（输出：流程；验收：可执行）。
   - 已实现：域名封禁/解封 API，`blocked_at/blocked_reason` 字段，Runtime 拒绝被封禁域名访问

---

## 117. Marketplace 计费与分成（可选）

1. [x] 应用定价模型（输出：模型；验收：可运营）。
   - 已实现：`GET /api/v1/plans/marketplace-billing` 输出定价模型、规则与发布检查清单。
1. [x] 平台分成与结算规则（输出：规则；验收：可结算）。
   - 已实现：`GET /api/v1/plans/marketplace-billing` 输出默认分成、阶梯来源、结算/提现规则，并引用现有 earnings/settlements API。
1. [x] 退款与争议处理流程（输出：流程；验收：可执行）。
   - 已实现：`GET /api/v1/plans/marketplace-billing` 输出退款与争议处理流程，并引用 support/earnings 管理接口。

---

## 118. 安全供应链与依赖治理

1. [x] 依赖许可审查（输出：规则；验收：可控）。
   - 已实现：新增供应链许可策略与审查 API（`GET /api/v1/security/supply-chain/license-policy`、`POST /api/v1/security/supply-chain/license-review`），策略来源 `security.supply_chain.license`。
1. [x] SBOM 生成与存档（输出：流程；验收：可审计）。
   - 已实现：新增 SBOM 存档表 `what_reverse_sboms` 与 API（`POST/GET /api/v1/security/supply-chain/sboms`），CI 生成 SBOM（`security-scan.yml`）并可选上传。
1. [x] 构建产物签名与验证（输出：方案；验收：可信）。
   - 已实现：新增签名存档表 `what_reverse_artifact_signatures` 与 API（`POST/GET /api/v1/security/supply-chain/signatures`），CI 使用 cosign 对 SBOM 进行签名与验证并上传签名文件。

---

## 119. 混沌工程与稳定性演练（可选）

1. [x] 混沌场景清单（输出：清单；验收：可执行）。
   - 已实现：新增 `GET /api/v1/plans/chaos-scenarios` 返回混沌场景清单。
1. [x] 自动化注入与回滚机制（输出：流程；验收：安全）。
   - 已实现：新增 `GET /api/v1/plans/chaos-automation` 输出注入/回滚流程与护栏。
1. [x] 演练结果评估模板（输出：模板；验收：可复用）。
   - 已实现：新增 `GET /api/v1/plans/chaos-evaluation-template` 返回评估模板与评分字段。

---

## 120. 事件复盘与知识库

1. [x] 事故复盘模板与流程（输出：模板；验收：可执行）。
   - 已实现：`GET /api/v1/plans/postmortem-template` 提供复盘模板，`GET /api/v1/plans/postmortem-process` 提供复盘流程。
1. [x] Root Cause 分类与统计（输出：分类；验收：可分析）。
   - 已实现：`GET /api/v1/plans/root-cause-taxonomy` 提供分类维度与统计指标定义。
1. [x] 知识库维护与检索（输出：规范；验收：可复用）。
   - 已实现：`GET /api/v1/plans/knowledge-base-guide` 提供维护流程与检索规范。

---

## 121. 身份与账号体系（细化）

1. [x] 账号体系策略（输出：策略；验收：可执行）。
   - 邮箱/社交登录/SSO 规划
   - 已实现：`GET /api/v1/plans/identity-accounts` 输出登录方式、MFA、找回与风险控制策略。

1. [x] 组织/Workspace 邀请与加入流程（输出：流程；验收：可用）。
   - 已实现：`GET /api/v1/plans/identity-accounts` 输出邀请/加入流程、约束与审计事件。
1. [x] 多 Workspace 账号切换体验（输出：交互规范；验收：可用）。
   - 已实现：`GET /api/v1/plans/identity-accounts` 输出切换入口、默认/最近规则与防越权护栏。
1. [x] 账号冻结/注销策略（输出：策略；验收：合规）。
   - 已实现：`GET /api/v1/plans/identity-accounts` 输出冻结触发、解冻流程与保留/删除策略。

---

## 122. 多租户路由与域名映射（细化）

1. [x] 路由解析优先级（输出：规则；验收：可控）。
   - 自定义域名 > workspaceSlug/appSlug
   - 已实现：当请求 Host 非平台 base_url/region_base_urls 时，优先按域名解析并返回对应 App

1. [x] 反向代理 Header 解析补全（输出：规则；验收：可用）。
   - 已实现：Runtime 解析 `X-Forwarded-Host`/`Forwarded` 并回退 Host，统一去端口/尾点规范化

1. [x] 域名冲突与保留字策略（输出：规则；验收：可执行）。
   - 已实现：禁止绑定平台 base_url / region_base_urls 及其子域名，避免冲突
1. [x] Workspace slug 变更与重定向（输出：策略；验收：可用）。
   - 已实现：新增 workspace_slug_aliases 表，slug 变更时写入旧值并在 Runtime 入口按 alias 解析
1. [x] App slug 变更与版本一致性（输出：策略；验收：可控）。
   - 已实现：新增 app_slug_aliases 表，App slug 变更时写入旧值，Runtime 按 alias 解析以保持当前版本可访问

---

## 123. App 运行时功能完善

1. [x] 公开访问页面的主题与品牌设置（输出：功能清单；验收：可配置）。
   - 已实现：`PATCH /api/v1/apps/:id/public-branding` 写入 `config_json.public_branding/public_theme`
1. [x] 自定义 SEO 与元信息（输出：字段清单；验收：可生效）。
   - 已实现：`PATCH /api/v1/apps/:id/public-seo` 写入 `config_json.public_seo`
1. [x] App 访问统计概览（输出：指标面板；验收：可查看）。
   - 已实现：`GET /api/v1/apps/:id/access-stats?days=30` 返回访问/执行/限流统计
1. [x] App 公开访问的输入模板与默认值（输出：功能清单；验收：可用）。
   - 已实现：`PATCH /api/v1/apps/:id/public-inputs` 写入 `config_json.public_input_template/public_input_defaults`

---

## 124. App Builder 与可视化编辑器（细化）

1. [x] UI Schema 可视化编辑功能（输出：功能清单；验收：可编辑）。
   - 已实现：`PATCH /api/v1/apps/:id/ui-schema` 更新当前版本 `ui_schema`
1. [x] Workflow 与 UI 的联动预览（输出：交互说明；验收：可用）。
   - 已实现：构建页预览面板联动 UI Schema，展示输入表单与映射提示
1. [x] 版本对比与差异查看（输出：功能清单；验收：可追踪）。
   - 已实现：构建页可选两版本对比，返回 diff 摘要并展示变更字段
1. [x] 一键生成 UI/Workflow（输出：功能清单；验收：可用）。
   - Builder 通过 AI 生成工作流与 UI Schema，并同步到当前版本。

---

## 125. Workflow 执行能力完善

1. [x] 并行节点与依赖控制（输出：规范；验收：可执行）。
   - DAG 分层并发执行，结合分支 NextHandle/SourceHandle 控制依赖与跳过。
1. [x] 执行中止与人工干预（输出：流程；验收：可执行）。
   - 运行监控页支持对执行记录进行停止操作，调用执行取消接口。
1. [x] 执行上下文的变量生命周期（输出：规范；验收：可追踪）。
   - 变量变更记录到节点日志（node logs），包含 set/update 事件与前后值。
1. [x] 节点级超时与重试策略（输出：规则；验收：可控）。
   - 引擎支持读取节点配置的 timeout/retryCount/retryDelay 并执行超时与重试。

---

## 126. 数据连接器与外部集成

1. [x] 数据源连接器清单（输出：清单；验收：可扩展）。
   - 新增数据源连接器清单 API：`GET /api/v1/connectors/catalog`（Postgres/MySQL/Redis/S3）。

   - Postgres / MySQL / Redis / S3

1. [x] OAuth/Token 管理机制（输出：流程；验收：可用）。
   - 连接器凭证 API：`GET/POST /api/v1/connectors/credentials`，支持轮换/吊销（`/credentials/:id/rotate`、`/credentials/:id/revoke`）。
1. [x] 连接器权限与隔离（输出：策略；验收：可控）。
   - 已实现：连接器凭证仅限 workspace owner/admin 或具备 `connectors_manage` 权限访问；凭证类型按 workspace 维度隔离。
1. [x] 连接器健康检查与告警（输出：规则；验收：可监控）。
   - 已实现：定时巡检凭证过期/即将过期，记录 `connector.credential.expiring/expired` 事件；过期事件触发系统通知；支持 `connector_health` 配置。

---

## 127. 公共应用分享与访问体验

1. [x] 分享链接与访问授权（输出：功能清单；验收：可用）。
   - 新增公开 Runtime 入口页 `/runtime/:workspaceSlug/:appSlug`，根据访问模式提示登录/访问。
1. [x] 公开访问的嵌入模式（输出：功能清单；验收：可用）。
   - 新增 `/runtime/:workspaceSlug/:appSlug/embed` 嵌入入口，提供 iframe 代码。
1. [x] 公开访问的使用条款提示（输出：文案；验收：可用）。
   - 新增 TermsPrompt，本地记录访问条款确认状态。

---

## 128. 数据导入/导出与备份

1. [x] App 配置导出（输出：功能清单；验收：可用）。
1. [x] Workflow/Schema 导入（输出：流程；验收：可用）。
1. [x] Workspace 数据备份与恢复入口（输出：功能清单；验收：可用）。
1. [x] 导出历史与导入文件校验（输出：记录/校验；验收：可用）。
1. [x] 导出/导入历史后端同步（输出：审计记录；验收：可跨设备）。
1. [x] 更严格的 JSON Schema 校验（输出：规则；验收：拦截异常结构）。
1. [x] 前端本地校验失败审计记录（输出：审计记录；验收：可跨设备）。

---

## 129. 通知与消息体系

1. [x] 系统通知与消息中心（输出：功能清单；验收：可用；已接入通知 API 列表/筛选/已读/删除）。
1. [x] 关键事件邮件/短信通知（输出：规则；验收：可执行）。
   - 已实现：关键运行时事件触发邮件/短信通知并写入系统通知（覆盖 execution.failed、db._.failed、domain.verify.failed、cert.issue.failed、quota.exceeded、security.auth*failed、system.error；邮件/短信需配置 `REVERSEAI_SMTP*_`/`REVERSEAI*TWILIO*\*`）。
1. [x] Webhook 事件重试与投递状态（输出：功能清单；验收：可追踪）。
   - 已实现：记录投递状态与重试，支持列表与手动重试（`GET /api/v1/webhooks/:id/deliveries`、`POST /api/v1/webhooks/:id/deliveries/:deliveryId/retry`）。

---

## 130. 配额与账单的用户侧体验

1. [x] 配额使用仪表盘（输出：功能清单；验收：可用）。
1. [x] 超额提示与升级引导（输出：交互规范；验收：可用）。
1. [x] 账单明细与发票下载（输出：功能清单；验收：可用）。
1. [x] 账单明细/发票下载 API 接入（输出：接口；验收：页面使用真实数据）。
1. [x] PDF 发票下载（模板 + 字体）（输出：格式；验收：可导出）。
1. [x] 税费/优惠与支付状态同步（输出：接口；验收：账单可展示）。

说明：配额仪表盘优先读取工作空间配额/预算接口，未配置时展示示例数据；发票下载支持 PDF/CSV，并提供模板化版式与字体回退。

---

## 131. 前端页面开发清单（细化）

1. [x] Workspace 创建/选择向导页（输出：页面；验收：可创建/切换 Workspace）。
1. [x] Workspace 顶部切换器与上下文条（输出：组件；验收：全局可切换）。
1. [x] App 列表页（搜索/筛选/排序/空状态）（输出：页面；验收：可管理多 App）。
1. [x] App 详情页（概览/状态/指标摘要）（输出：页面；验收：可查看）。
1. [x] App 构建页（AI Chat/Workflow 画布/UI Schema 配置/预览）（输出：页面；验收：可编辑）。
   - 已接入真实工作流画布编辑、加载与保存流程。
1. [x] App 发布设置页（访问策略/匿名开关/限流）（输出：页面；验收：可发布）。
   - 已实现：新增发布设置页，支持访问模式/匿名开关/限流/来源白名单/验证码配置，并提供发布入口。
1. [x] App 版本历史页（版本列表/对比/回滚）（输出：页面；验收：可回滚）。
   - 已实现：版本列表/对比/回滚与版本说明（`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/[appId]/versions/page.tsx`）。
1. [x] Runtime 运行监控页（执行列表/日志/节点状态）（输出：页面；验收：可追踪）。
   - 已实现：执行列表、日志摘要与节点状态区块（`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/[appId]/monitoring/page.tsx`）。
   - 已补充：监控页执行列表接口（`GET /api/v1/apps/:id/executions`）。
1. [x] 域名管理页（绑定/验证/状态/续期提示）（输出：页面；验收：可管理）。
   - 已实现：域名绑定、验证与证书状态管理（`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/[appId]/domains/page.tsx`）。
1. [x] Workspace 成员与角色页（邀请/权限/移除）（输出：页面；验收：可协作）。
   - 已实现：成员邀请、角色权限说明与移除入口（`apps/web/src/app/(dashboard)/team/page.tsx`）。
1. [x] API Key/集成设置页（创建/禁用/权限）（输出：页面；验收：可管理）。
   - 已实现：API Key 管理与集成入口（`apps/web/src/app/(dashboard)/settings/api-keys/page.tsx`、`apps/web/src/app/(dashboard)/integrations/page.tsx`）。
1. [x] 用量与账单页（配额/明细/升级）（输出：页面；验收：可查看）。
   - 已实现：配额与账单明细/升级入口（`apps/web/src/app/(dashboard)/billing/page.tsx`）。
1. [x] 审计日志页（筛选/导出）（输出：页面；验收：可追溯）。
   - 已实现：操作日志页支持筛选与 CSV/JSON 导出（`apps/web/src/app/(dashboard)/logs/page.tsx`）。
1. [x] 公共访问页模板（访客输入/结果展示/提示）（输出：页面；验收：可对外）。
   - 已实现：访客输入、结果与条款提示（`apps/web/src/app/(unauth)/runtime/[workspaceSlug]/[appSlug]/public-runtime-view.tsx`）。
1. [x] 403/404/异常页（输出：页面；验收：可引导）。
   - 已实现：403/404/异常页与重试入口（`apps/web/src/app/403/page.tsx`、`apps/web/src/app/not-found.tsx`、`apps/web/src/app/error.tsx`）。

---

## 132. 前端组件与设计系统落地

1. [x] 通用表格组件（排序/分页/过滤）（输出：组件；验收：复用）。
   - 已实现：`apps/web/src/components/ui/data-table.tsx` 提供排序、分页与搜索过滤。
1. [x] 状态与标签组件（draft/published/failed）（输出：组件；验收：一致）。
   - 已实现：`apps/web/src/components/ui/status-badge.tsx` 支持 draft/published/failed；`apps/web/src/components/ui/tag.tsx` 提供标签体系。
1. [x] 表单组件库（校验/提示/错误态）（输出：组件；验收：可用）。
   - 已实现：`apps/web/src/components/ui/form-field.tsx` 提供校验/提示/错误态布局与输入封装。
1. [x] 空状态与引导组件（输出：组件；验收：可复用）。
   - 已实现：`apps/web/src/components/ui/empty-state.tsx` 与预设引导变体。
1. [x] Toast/Modal/Drawer 规范（输出：组件；验收：一致）。
   - 已实现：`apps/web/src/components/ui/toast.tsx`、`apps/web/src/components/ui/dialog.tsx`（含 DrawerDialog）。
1. [x] Skeleton/Loading 组件（输出：组件；验收：体验一致）。
   - 已实现：`apps/web/src/components/ui/loading.tsx`、`apps/web/src/components/ui/skeleton.tsx`、`apps/web/src/components/ui/skeleton-loaders.tsx`。

---

## 133. 前端数据流与状态管理

1. [x] 统一 API Client 封装（输出：模块；验收：全局使用）。
   - 已实现：API client 统一为 `lib/api/client.ts`，shared/auth 复用同一请求层。
1. [x] Query/Cache 策略（输出：规则；验收：性能稳定）。
   - 已实现：QueryClient 默认缓存策略 + 核心 hooks 接入 `API_CACHE_CONFIG`。
1. [x] WebSocket/SSE 实时更新（运行日志/状态）（输出：模块；验收：实时可用）。
   - 已实现：执行面板 WebSocket 订阅与对话 SSE 流式更新。
1. [x] 全局错误处理与重试策略（输出：规则；验收：可恢复）。
   - 已实现：React Query 全局错误提示 + API 请求重试策略。
1. [x] 乐观更新与回滚策略（输出：规则；验收：体验流畅）。
   - 已实现：工作流更新使用乐观更新与失败回滚。

---

## 134. 前端路由与权限控制

1. [x] Workspace 上下文解析与路由守卫（输出：守卫；验收：不可越权）。
   - 已实现：`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/layout.tsx` 使用 `WorkspaceGuard` 校验 Workspace 访问，支持 slug 兜底与权限错误提示。
1. [x] App 访问权限与页面门禁（输出：规则；验收：安全）。
   - 已实现：`AppAccessGate` 在 App 概览 / 构建 / 监控 / 域名页统一校验权限与 Workspace 归属。
1. [x] 权限控制 UI Gate（按钮/页面级）（输出：规范；验收：一致）。
   - 已实现：`PermissionAction` 为关键动作提供禁用态与提示，页面级使用 `AppAccessGate` 统一拦截。
1. [x] slug 变更与重定向处理（输出：规则；验收：可访问）。
   - 已实现：`WorkspaceGuard` 支持 Workspace slug 解析并重定向，运行页链接与条款 key 使用解析后的 slug。

---

## 135. 前端性能与可观测性

1. [x] 路由级 code splitting 与 lazy load（输出：策略；验收：首屏优化）。
   - 已实现：`apps/web/src/app/(dashboard)/layout.tsx` 对通知面板与命令面板使用动态加载并按需渲染。
1. [x] 大列表虚拟化（执行日志/版本列表）（输出：实现；验收：不卡顿）。
   - 已实现：`apps/web/src/components/editor/execution-panel.tsx` 的执行日志使用 `VirtualScrollArea` 渲染。
1. [x] 前端错误追踪与日志（输出：接入；验收：可定位）。
   - 已实现：`apps/web/src/lib/telemetry.ts`、`apps/web/src/components/observability/client-telemetry.tsx` 与 `apps/web/src/app/api/telemetry/route.ts` 完成错误采集与服务端接收。
1. [x] 前端性能指标采集（LCP/CLS/TTI）（输出：埋点；验收：可分析）。
   - 已实现：`apps/web/src/components/observability/client-telemetry.tsx` 上报 LCP/CLS 并补充 TTI 指标。

---

## 136. 前端测试与质量

1. [x] 关键页面单元测试（输出：测试；验收：覆盖核心）。
   - 已实现：Workspace 列表页与公开访问页基础渲染/交互测试。
1. [x] 关键流程 E2E 测试（创建 App/发布/访问）（输出：测试；验收：通过）。
   - 已实现：Playwright 流程覆盖创建/发布/公开访问三条主路径（含 API mock）。
1. [x] Mock 数据与测试夹具（输出：夹具；验收：可复用）。
   - 已实现：Workspace/App 夹具与测试数据集中管理。
1. [x] 可访问性测试（输出：报告；验收：可通过）。
   - 已实现：Playwright + axe-core 基础无障碍扫描（忽略 color-contrast）。

---

## 137. 前端配置与环境

1. [x] 多环境 API 端点配置（输出：规范；验收：可切换）。
   - 已实现：统一环境配置模块，支持按 `APP_ENV` / `API_URL_{ENV}` 切换。
1. [x] Feature Flag 前端开关（输出：规则；验收：可灰度）。
   - 已实现：支持 ENV/JSON/本地覆盖的 Feature Flags，接入 analytics/local_mode。
1. [x] 前端构建与部署流程（输出：流程；验收：可发布）。
   - 已补充：Web 端 README 与脚本说明（dev/build/start）。

---

## 138. 前端页面内容改造（保持现有样式）

1. [x] 前端改造原则：不改变现有页面样式，只修改内容结构与功能入口（输出：原则说明；验收：视觉一致）。
   - 原则：仅调整内容结构与入口，不改组件样式/颜色/排版；以说明卡片与快捷入口补齐信息。
1. [x] 现有页面盘点与改造范围标注（增/删/改）（输出：清单；验收：覆盖全量页面）。
   - 改：Workspace 创建/选择页、Workspace 切换器、App 列表页、App 详情页、App 构建页。
   - 改：App 发布设置页、App 版本历史页、Runtime 监控页、域名管理页、Workspace 成员页。
   - 改：集成/API Key 页、用量与账单页、审计日志页、公共访问页、403/404/异常页。
1. [x] Workspace 创建/选择页内容结构（默认 workspace 说明/计划/区域）（输出：内容结构；验收：信息完整）。
   - 已更新：新增默认 Workspace/计划/区域说明与选择提示（`apps/web/src/app/(dashboard)/workspaces/page.tsx`）。
1. [x] Workspace 切换器内容更新（显示当前计划/配额/快捷入口）（输出：内容结构；验收：可用）。
   - 已更新：切换器展示计划/配额入口与快捷入口（`apps/web/src/app/(dashboard)/layout.tsx`）。
1. [x] App 列表页内容结构（列：名称/状态/版本/公开/域名/最近运行）（输出：字段清单；验收：可管理）。
   - 已更新：表格列补齐公开/域名/最近运行（`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/page.tsx`）。
1. [x] App 详情页内容结构（概览卡片/访问策略/域名/版本/用量）（输出：结构；验收：可查看）。
   - 已更新：访问策略/域名/版本/用量区块补齐（`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/[appId]/page.tsx`）。
1. [x] App 构建页内容结构（AI 对话/Workflow/Schema/预览/保存状态）（输出：结构；验收：可编辑）。
   - 已更新：保存状态展示与结构说明完善（`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/[appId]/builder/page.tsx`）。
1. [x] App 发布设置页内容结构（访问策略/匿名/限流/SEO/分享链接）（输出：结构；验收：可发布）。
   - 已新增：发布设置页与访问策略配置（`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/[appId]/publish/page.tsx`）。
1. [x] App 版本历史页内容结构（版本对比/回滚/变更记录）（输出：结构；验收：可回滚）。
   - 已新增：版本列表、对比与回滚入口（`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/[appId]/versions/page.tsx`）。
1. [x] Runtime 监控页内容结构（执行列表/过滤/日志/节点状态）（输出：结构；验收：可追踪）。
   - 已更新：日志摘要与节点状态区块（`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/[appId]/monitoring/page.tsx`）。
1. [x] 域名管理页内容结构（绑定状态/验证说明/续期提示）（输出：结构；验收：可管理）。
   - 已更新：续期提醒与绑定状态说明（`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/[appId]/domains/page.tsx`）。
1. [x] Workspace 成员页内容结构（邀请/角色/权限说明）（输出：结构；验收：可协作）。
   - 已更新：权限说明区块与邀请提示（`apps/web/src/app/(dashboard)/team/page.tsx`）。
1. [x] 集成/API Key 页内容结构（创建/权限/使用说明）（输出：结构；验收：可管理）。
   - 已更新：集成页 API Key 入口与权限说明（`apps/web/src/app/(dashboard)/integrations/page.tsx`）。
   - 已更新：API Key 创建与权限说明（`apps/web/src/app/(dashboard)/settings/api-keys/page.tsx`）。
1. [x] 用量与账单页内容结构（配额/消耗/升级引导）（输出：结构；验收：可查看）。
   - 已更新：升级引导与配额提示（`apps/web/src/app/(dashboard)/billing/page.tsx`）。
1. [x] 审计日志页内容结构（筛选/导出/事件类型）（输出：结构；验收：可追溯）。
   - 已更新：事件类型概览区块（`apps/web/src/app/(dashboard)/logs/page.tsx`）。
1. [x] 公共访问页内容结构（输入表单/结果/条款提示）（输出：结构；验收：可对外）。
   - 已更新：条款提示区块（`apps/web/src/app/(unauth)/runtime/[workspaceSlug]/[appSlug]/public-runtime-view.tsx`）。
1. [x] 403/404/异常页内容更新（引导返回/联系客服/重试）（输出：文案与入口；验收：可引导）。
   - 已更新：404 文案与重试入口（`apps/web/src/app/not-found.tsx`）。
   - 已新增：异常页与 403 页（`apps/web/src/app/error.tsx`、`apps/web/src/app/403/page.tsx`）。

---

## 139. 前端页面字段级清单（内容对齐）

1. [x] App 列表页字段（输出：字段表；验收：可实现）。
   - 已对齐：name/status/visibility/version/domain/updated_at（`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/page.tsx`）。

   - name、status、visibility、version、domain、updated_at

1. [x] App 详情页字段（输出：字段表；验收：可实现）。
   - 已对齐：status/last_run/run_count/token_usage/access_mode（`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/[appId]/page.tsx`）。

   - status、last_run、run_count、token_usage、access_mode

1. [x] 发布设置页字段（输出：字段表；验收：可实现）。
   - 已对齐：access_mode/anonymous_enabled/rate_limit/seo_title/seo_desc（`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/[appId]/publish/page.tsx`）。

   - access_mode、anonymous_enabled、rate_limit、seo_title、seo_desc

1. [x] 域名管理字段（输出：字段表；验收：可实现）。
   - 已对齐：domain/status/verification_token/ssl_expires_at（`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/[appId]/domains/page.tsx`）。

   - domain、status、verification_token、ssl_expires_at

1. [x] 运行监控字段（输出：字段表；验收：可实现）。
   - 已对齐：execution_id/status/duration/error_message/node_status（`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/[appId]/monitoring/page.tsx`）。

   - execution_id、status、duration、error_message、node_status

1. [x] 成员与权限字段（输出：字段表；验收：可实现）。
   - 已对齐：role/email/status/joined_at（`apps/web/src/app/(dashboard)/team/page.tsx`）。

   - role、email、status、joined_at

1. [x] 用量与账单字段（输出：字段表；验收：可实现）。
   - 已对齐：requests/tokens/storage/plan/billing_cycle（`apps/web/src/app/(dashboard)/billing/page.tsx`）。

   - requests、tokens、storage、plan、billing_cycle

---

## 140. Workspace 创建/选择页区块与组件细化

1. [x] 页面区块清单（输出：区块；验收：内容完整）。
   - 已对齐：顶部说明/创建表单/计划与区域说明/现有列表（`apps/web/src/app/(dashboard)/workspaces/page.tsx`）。

   - 顶部说明：Workspace 作用/默认空间说明
   - 主区块：创建 Workspace 表单
   - 侧边区块：计划/配额说明、区域选择说明
   - 现有 Workspace 列表（如已加入）

1. [x] 表单字段与校验（输出：字段清单；验收：可创建）。
   - 已对齐：name/slug/region/plan（plan 只读显示）（`apps/web/src/app/(dashboard)/workspaces/page.tsx`）。

   - name、slug、region、plan（只读或选择）

1. [x] 行为按钮与交互（输出：按钮清单；验收：可用）。
   - 已对齐：创建/加入/切换/取消（`apps/web/src/app/(dashboard)/workspaces/page.tsx`）。

   - 创建、加入、切换、取消

1. [x] 空状态与错误提示（输出：文案清单；验收：可用）。
   - 已对齐：空状态与加载失败提示（`apps/web/src/app/(dashboard)/workspaces/page.tsx`）。

---

## 141. Workspace 切换器与全局上下文条（区块细化）

1. [x] 展示字段（输出：字段清单；验收：信息完整）。
   - 已对齐：当前名称/slug、计划与配额概览（`apps/web/src/app/(dashboard)/layout.tsx`）。

   - 当前 Workspace 名称/slug、计划、配额概览

1. [x] 快捷入口（输出：入口清单；验收：可达）。
   - 已对齐：创建 App/成员管理/用量与账单/设置（`apps/web/src/app/(dashboard)/layout.tsx`）。

   - 创建 App、成员管理、用量与账单、设置

1. [x] 交互规则（输出：规则；验收：可用）。
   - 已对齐：切换确认/权限受限提示/最近访问列表（`apps/web/src/app/(dashboard)/layout.tsx`）。

   - 切换确认、权限不足提示、最近访问列表

---

## 142. App 列表页区块与组件细化

1. [x] 顶部工具条（输出：组件清单；验收：可用）。
   - 已对齐：搜索/状态/可见性/域名状态/时间范围/排序（`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/page.tsx`）。

   - 搜索框、状态筛选、可见性筛选、域名状态筛选
   - 时间范围筛选、排序

1. [x] 表格列与内容（输出：列清单；验收：可管理）。
   - 已对齐：名称/状态/可见性/版本/域名/最近运行/更新时间（`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/page.tsx`）。

   - 名称、状态、可见性、版本、域名、最近运行、更新时间

1. [x] 行级操作（输出：按钮清单；验收：可用）。
   - 已对齐：查看/编辑/发布/复制/归档（`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/page.tsx`）。

   - 查看、编辑、发布、复制、归档

1. [x] 批量操作（输出：按钮清单；验收：可用）。
   - 已对齐：批量发布/批量归档（`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/page.tsx`）。

   - 批量发布、批量归档

1. [x] 空状态与引导（输出：文案与入口；验收：可引导）。
   - 已对齐：空状态与创建引导（`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/page.tsx`）。

---

## 143. App 详情页区块与组件细化

1. [x] 概览区块（输出：区块清单；验收：信息完整）。
   - 已对齐：状态/可见性/当前版本/最近运行（`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/[appId]/page.tsx`）。

   - 状态、可见性、当前版本、最近运行

1. [x] 访问策略与域名区块（输出：区块清单；验收：可查看）。
   - 已对齐：访问模式/匿名访问/已绑定域名（`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/[appId]/page.tsx`）。

   - 访问模式、匿名开关、已绑定域名

1. [x] 用量与指标区块（输出：区块清单；验收：可查看）。
   - 已对齐：请求数/token/错误率/响应时间（`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/[appId]/page.tsx`）。

   - 请求数、token、错误率、响应时间

1. [x] 快捷操作区块（输出：按钮清单；验收：可操作）。
   - 已对齐：编辑/发布/查看运行监控/绑定域名（`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/[appId]/page.tsx`）。

   - 编辑、发布、查看运行监控、绑定域名

---

## 144. App 构建页区块与组件细化

1. [x] 页头区块（输出：字段清单；验收：可用）。
   - 已对齐：App 名称/状态/保存状态/版本信息（`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/[appId]/builder/page.tsx`）。

   - App 名称、状态、保存状态、版本信息

1. [x] AI 对话区块（输出：组件清单；验收：可用）。
   - 已对齐：输入框/建议操作/历史记录/生成按钮（`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/[appId]/builder/page.tsx`）。

   - 输入框、建议操作、历史记录、生成按钮

1. [x] Workflow 画布区块（输出：组件清单；验收：可用）。
   - 已对齐：画布/节点面板/连线/缩放与对齐（`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/[appId]/builder/page.tsx`；编辑器内置工具栏）。

   - 画布、节点面板、连线工具、缩放/对齐

1. [x] 配置面板区块（输出：组件清单；验收：可用）。
   - 已对齐：节点配置/变量与输入/错误提示（`apps/web/src/components/editor/config-panel.tsx`）。

   - 节点配置、变量/输入、错误提示

1. [x] UI Schema 配置区块（输出：组件清单；验收：可用）。
   - 已对齐：组件清单/预览/字段配置（`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/[appId]/builder/page.tsx`）。

   - 表单字段、结果展示、验证规则

1. [x] 预览与试运行区块（输出：组件清单；验收：可用）。
   - 已对齐：预览区域/试运行按钮/结果展示（`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/[appId]/builder/page.tsx`）。

   - 预览区域、试运行按钮、结果展示

---

## 145. App 发布设置页区块与组件细化

1. [x] 访问策略区块（输出：字段清单；验收：可配置）。
   - 已对齐：access_mode/anonymous/rate_limit（`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/[appId]/publish/page.tsx`）。

   - access_mode、anonymous、rate_limit

1. [x] SEO 与分享区块（输出：字段清单；验收：可配置）。
   - 已对齐：seo_title/seo_desc/share_link（`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/[appId]/publish/page.tsx`）。

   - seo_title、seo_desc、share_link

1. [x] 域名绑定摘要区块（输出：内容清单；验收：可查看）。
   - 已对齐：当前域名/验证状态/续期提醒（`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/[appId]/publish/page.tsx`）。

   - 当前域名、验证状态、续期提醒

1. [x] 发布动作区块（输出：按钮清单；验收：可发布）。
   - 已对齐：发布/保存草稿/取消（`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/[appId]/publish/page.tsx`）。

   - 发布、保存草稿、取消

---

## 146. App 版本历史页区块与组件细化

1. [x] 版本列表表格（输出：列清单；验收：可管理）。
   - 已对齐：版本号/状态/创建者/创建时间/备注（`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/[appId]/versions/page.tsx`）。

   - 版本号、状态、创建者、创建时间、备注

1. [x] 筛选与排序（输出：筛选项；验收：可用）。
   - 已对齐：状态/时间范围/创建者/排序（`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/[appId]/versions/page.tsx`）。

   - 状态、时间范围、创建者

1. [x] 版本操作（输出：按钮清单；验收：可用）。
   - 已对齐：查看/对比/回滚/恢复（`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/[appId]/versions/page.tsx`）。

   - 查看、对比、回滚、恢复

---

## 147. Runtime 运行监控页区块与组件细化

1. [x] 顶部指标区块（输出：指标清单；验收：可用）。
   - 已对齐：总执行数/成功率/平均耗时/错误率（`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/[appId]/monitoring/page.tsx`）。

   - 总执行数、成功率、平均耗时、错误率

1. [x] 执行列表表格（输出：列清单；验收：可追踪）。
   - 已对齐：execution_id/状态/耗时/错误/触发类型/时间（`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/[appId]/monitoring/page.tsx`）。

   - execution_id、状态、耗时、错误、触发类型、时间

1. [x] 过滤与搜索（输出：筛选项；验收：可用）。
   - 已对齐：状态/节点类型/时间范围/搜索（`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/[appId]/monitoring/page.tsx`）。

   - 状态、节点类型、时间范围

1. [x] 详情抽屉/面板（输出：内容清单；验收：可追踪）。
   - 已对齐：节点状态流/日志/输入/输出（`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/[appId]/monitoring/page.tsx`）。

   - 节点状态流、日志、输入/输出

---

## 148. 域名管理页区块与组件细化

1. [x] 域名列表表格（输出：列清单；验收：可管理）。
   - 已对齐：domain/status/verification/ssl_expires_at（`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/[appId]/domains/page.tsx`）。

   - domain、status、verification、ssl_expires_at

1. [x] 绑定与验证区块（输出：内容清单；验收：可操作）。
   - 已对齐：DNS 配置说明/验证按钮/重新验证（`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/[appId]/domains/page.tsx`）。

   - DNS 配置说明、验证按钮、重新验证

1. [x] 操作按钮（输出：按钮清单；验收：可用）。
   - 已对齐：设为主域名/删除/查看证书（`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/apps/[appId]/domains/page.tsx`）。

   - 设为主域名、删除、查看证书

---

## 149. Workspace 成员与权限页区块细化

1. [x] 成员列表表格（输出：列清单；验收：可协作）。
   - 已对齐：用户/角色/状态/加入时间/最后活跃（`apps/web/src/app/(dashboard)/team/page.tsx`）。
   - 支持搜索（姓名/邮箱）、角色筛选

1. [x] 邀请与管理区块（输出：组件清单；验收：可用）。
   - 已对齐：邀请按钮/角色选择/移除与冻结（`apps/web/src/app/(dashboard)/team/page.tsx`）。
   - 邀请成员对话框 + 待处理邀请列表保留

1. [x] 角色说明区块（输出：内容清单；验收：可理解）。
   - 已对齐：角色权限说明（`apps/web/src/app/(dashboard)/team/page.tsx`）。

---

## 150. API Key/集成设置页区块细化

1. [x] API Key 列表表格（输出：列清单；验收：可管理）。
   - 已对齐：name/provider/key_preview/scopes/created_at/last_used/status（`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/settings/page.tsx`）。
   - name、scope、created_at、last_used

1. [x] Key 操作区块（输出：按钮清单；验收：可用）。
   - 已对齐：创建对话框（provider/name/key/scopes）、禁用（revoke）、轮换（rotate dialog）、复制（preview）（`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/settings/page.tsx`）。
   - 创建、禁用、轮换、复制

1. [x] 集成配置区块（输出：内容清单；验收：可用）。
   - 已对齐：Webhook 卡片/OAuth 授权卡片/第三方连接器卡片 + 创建 Webhook 对话框 + 已配置集成列表（`apps/web/src/app/(dashboard)/workspaces/[workspaceId]/settings/page.tsx`）。
   - Webhook、OAuth、第三方连接器

---

## 151. 用量与账单页区块细化

1. [x] 用量概览卡片（输出：字段清单；验收：可查看）。
   - requests、tokens、storage、bandwidth
   - **已实现**：`usageItems` 数组包含所有字段，`WorkspaceQuota` 类型已扩展

1. [x] 按 App 统计表（输出：列清单；验收：可对账）。
   - app、usage、cost、trend
   - **已实现**：新增 `AppUsageStat` 类型与 `getAppUsageStats` API，表格展示所有列及合计行

1. [x] 账单与发票区块（输出：内容清单；验收：可下载）。
   - 账单列表、支付状态、发票下载
   - **已实现**：账单历史表格含状态 Badge、发票详情抽屉、PDF/CSV 下载功能

---

## 152. 审计日志页区块细化

1. [x] 筛选与搜索（输出：筛选项；验收：可用）。
   - actor、action、target、时间范围

1. [x] 日志列表表格（输出：列清单；验收：可追溯）。
   - 时间、操作者、动作、对象、结果

1. [x] 详情抽屉（输出：内容清单；验收：可查看）。
   - metadata、ip、user_agent

---

## 153. 公共访问页模板区块细化

1. [x] 访客输入区块（输出：组件清单；验收：可用）。
   - 表单、示例输入、运行按钮
   - 已实现：公开访问页展示输入表单、示例填充卡片与执行按钮。

1. [x] 结果展示区块（输出：组件清单；验收：可读）。
   - 文本/表格/markdown
   - 已实现：结果区块支持文本/表格/Markdown 切换，结合 output_schema 展示结构与占位。

1. [x] 条款与提示区块（输出：内容清单；验收：合规）。
   - 使用条款、匿名限制、隐私说明
   - 已实现：条款与提示区块补充匿名限制、隐私说明与条款入口。

---

## 154. 403/404/异常页区块细化

1. [x] 403 页面内容（输出：文案/入口；验收：可引导）。
   - 实现：`apps/web/src/app/403/page.tsx` - Manus 风格升级
   - 新增：大号 403 数字、入场动画、常见原因提示、快速链接、帮助区块
1. [x] 404 页面内容（输出：文案/入口；验收：可引导）。
   - 已完善：`apps/web/src/app/not-found.tsx` - 原有实现已符合标准
1. [x] 500/异常页面内容（输出：文案/入口；验收：可恢复）。
   - 实现：`apps/web/src/app/error.tsx` - Manus 风格升级
   - 新增：大号 500 数字、入场动画、错误代码复制、恢复建议、快速链接、帮助区块
