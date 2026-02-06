# 后端服务边界与模块职责

版本：v0.1  
日期：2026-02-02  
范围：Workspace / App / Runtime / DB Provisioner / Domain / Billing

## 0. 边界约定

- 服务入口与装配统一在 `apps/server/internal/api/server.go`
- Handler 负责鉴权、参数校验、审计日志；业务规则集中在 Service
- Repository 负责持久化与查询；Domain Entity 为数据结构来源

## 1. Workspace Service

职责：

- Default Workspace 自动创建、Workspace 创建/更新/查询
- 成员与角色管理、权限解析（Workspace 级）

不负责：

- App 管理、计费、数据库 Provision

代码定位：

- Service：`apps/server/internal/service/workspace_service.go`
- Handler：`apps/server/internal/api/handler/workspace.go`
- Repository：`apps/server/internal/repository/workspace_repo.go`、`workspace_member_repo.go`、`workspace_role_repo.go`
- 权限定义：`apps/server/internal/service/permissions.go`

接口入口（API v1）：

- `GET /api/v1/workspaces`
- `POST /api/v1/workspaces`
- `GET /api/v1/workspaces/:id`
- `PATCH /api/v1/workspaces/:id`
- `GET /api/v1/workspaces/:id/members`
- `POST /api/v1/workspaces/:id/members`
- `PATCH /api/v1/workspaces/:id/members/:memberId`

## 2. App Service

职责：

- App 创建/列表/详情、版本创建、发布/回滚/下线
- 访问策略读写、从 Workflow/AI 生成 App

不负责：

- 域名绑定、Runtime 访问、计费用量扣减

代码定位：

- Service：`apps/server/internal/service/app_service.go`
- Handler：`apps/server/internal/api/handler/app.go`
- Repository：`apps/server/internal/repository/app_repo.go`、`app_version_repo.go`、`app_access_policy_repo.go`
- 依赖：`WorkflowRepository`、`AIAssistantService`

接口入口（API v1）：

- `POST /api/v1/workspaces`
- `POST /api/v1/workspaces/from-workflow`
- `POST /api/v1/workspaces/from-ai`
- `GET /api/v1/workspaces`
- `GET /api/v1/workspaces/:id`
- `POST /api/v1/workspaces/:id/versions`
- `POST /api/v1/workspaces/:id/publish`
- `POST /api/v1/workspaces/:id/rollback`
- `POST /api/v1/workspaces/:id/deprecate`
- `POST /api/v1/workspaces/:id/archive`
- `GET /api/v1/workspaces/:id/access-policy`
- `PATCH /api/v1/workspaces/:id/access-policy`

## 3. Runtime Service

职责：

- Runtime 入口解析（workspace/app、domain）
- 访问策略与权限校验、匿名会话与事件记录

不负责：

- Workflow 执行（由 `ExecutionService` 处理）
- 计费用量扣减（由 `BillingService` 处理）

代码定位：

- Service：`apps/server/internal/service/runtime_service.go`
- Handler：`apps/server/internal/api/handler/runtime.go`
- Repository：`app_repo.go`、`app_version_repo.go`、`app_access_policy_repo.go`、`app_domain_repo.go`、`app_session_repo.go`、`app_event_repo.go`

接口入口（公开 Runtime）：

- `GET /runtime/:workspaceSlug/:appSlug`
- `GET /runtime/:workspaceSlug/:appSlug/schema`
- `POST /runtime/:workspaceSlug/:appSlug`
- `GET /`（域名入口）
- `GET /schema`（域名入口）
- `POST /`（域名入口）
- `GET /:workspaceSlug/:appSlug`（兼容入口）

## 4. DB Provisioner Service（WorkspaceDatabaseService）

职责：

- Workspace 独立数据库创建、密钥轮换、迁移、备份/恢复
- 预检与扣减数据库存储配额

不负责：

- 运行时数据库连接与执行（由 `WorkspaceDBRuntime` 负责）

代码定位：

- Service：`apps/server/internal/service/workspace_database_service.go`
- Handler：`apps/server/internal/api/handler/workspace_database.go`
- Repository：`apps/server/internal/repository/workspace_database_repo.go`
- 运行时连接：`apps/server/internal/service/workspace_db_runtime.go`
- Provision 工具：`apps/server/internal/pkg/workspace_db`

接口入口（API v1）：

- `POST /api/v1/workspaces/:id/database`
- `GET /api/v1/workspaces/:id/database`
- `POST /api/v1/workspaces/:id/database/rotate-secret`
- `POST /api/v1/workspaces/:id/database/migrate`
- `POST /api/v1/workspaces/:id/database/backup`
- `POST /api/v1/workspaces/:id/database/restore`

## 5. Domain Service（AppDomainService）

职责：

- 域名绑定、DNS 验证、证书签发/续期
- 绑定生效/回滚、路由切流通知

不负责：

- Runtime 访问鉴权（由 Runtime Service 处理）

代码定位：

- Service：`apps/server/internal/service/app_domain_service.go`
- 路由执行：`apps/server/internal/service/domain_routing_executor.go`
- Handler：`apps/server/internal/api/handler/app_domain.go`
- Repository：`apps/server/internal/repository/app_domain_repo.go`

接口入口（API v1）：

- `GET /api/v1/workspaces/:id/domains`
- `POST /api/v1/workspaces/:id/domains`
- `POST /api/v1/workspaces/:id/domains/:domainId/verify`
- `POST /api/v1/workspaces/:id/domains/:domainId/cert/issue`
- `POST /api/v1/workspaces/:id/domains/:domainId/cert/renew`
- `POST /api/v1/workspaces/:id/domains/:domainId/activate`
- `POST /api/v1/workspaces/:id/domains/:domainId/rollback`
- `DELETE /api/v1/workspaces/:id/domains/:domainId`
- `POST /api/v1/domains/:domainId/verify`

## 6. Billing Service

职责：

- 计费维度定义、套餐读取
- Workspace 配额读取与用量扣减
- App 用量统计聚合

不负责：

- 付款、发票、订阅生命周期（后续模块）

代码定位：

- Service：`apps/server/internal/service/billing_service.go`
- Handler：`apps/server/internal/api/handler/billing.go`
- Repository：`apps/server/internal/repository/billing_repo.go`、`workspace_quota_repo.go`、`billing_usage_event_repo.go`、`app_usage_stat_repo.go`

接口入口（API v1）：

- `GET /api/v1/billing/dimensions`
- `GET /api/v1/billing/plans`
- `GET /api/v1/billing/workspaces/:id/quota`
- `POST /api/v1/billing/workspaces/:id/consume`
- `GET /api/v1/billing/workspaces/:id/apps/usage`

## 7. 服务依赖与协作

- `WorkspaceService` 为中心服务：App/Billing/DB Provisioner/Auth 依赖其权限与 Workspace 基础信息
- `BillingService` 提供配额能力：Runtime 访问扣减、Workspace DB Provision 预检/扣减
- `RuntimeService` 读取 Domain 绑定结果：Domain Service 负责写入与状态流转
- `ExecutionService` 独立处理工作流执行：Runtime Handler 调用并记录执行结果
