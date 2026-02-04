# Admin API 依赖表

## 概述

本文档列出 Admin 应用依赖的所有后端 API，包括 API 完整度、版本策略和优先级。

---

## 1. 核心 API 依赖

### 1.1 认证 API

| 端点 | 方法 | 完整度 | 优先级 | 说明 |
|------|------|--------|--------|------|
| `/auth/admin/login` | POST | ✅ 完整 | P0 | 管理员登录 |
| `/auth/admin/logout` | POST | ✅ 完整 | P0 | 管理员登出 |
| `/auth/admin/refresh` | POST | ✅ 完整 | P0 | Token 刷新 |
| `/auth/admin/2fa/verify` | POST | ✅ 完整 | P1 | 2FA 验证 |
| `/auth/admin/sessions` | GET | ✅ 完整 | P1 | 会话列表 |
| `/auth/admin/sessions/:id` | DELETE | ✅ 完整 | P1 | 终止会话 |

### 1.2 用户管理 API

| 端点 | 方法 | 完整度 | 优先级 | 说明 |
|------|------|--------|--------|------|
| `/admin/users` | GET | ✅ 完整 | P0 | 用户列表 |
| `/admin/users/:id` | GET | ✅ 完整 | P0 | 用户详情 |
| `/admin/users/:id/role` | PATCH | ✅ 完整 | P0 | 更新角色 |
| `/admin/users/:id/status` | PATCH | ✅ 完整 | P0 | 更新状态 |
| `/admin/users/:id/force-logout` | POST | ✅ 完整 | P1 | 强制下线 |
| `/admin/users/:id/reset-password` | POST | ✅ 完整 | P1 | 重置密码 |
| `/admin/users/:id/risk-flag` | PATCH | ✅ 完整 | P1 | 风险标记 |
| `/admin/users/:id/assets` | GET | ✅ 完整 | P1 | 用户资产 |
| `/admin/users/:id/sessions` | GET | ✅ 完整 | P1 | 用户会话 |
| `/admin/users/batch/status` | POST | ✅ 完整 | P2 | 批量状态更新 |
| `/admin/users/batch/role` | POST | ✅ 完整 | P2 | 批量角色更新 |

### 1.3 Workspace 管理 API

| 端点 | 方法 | 完整度 | 优先级 | 说明 |
|------|------|--------|--------|------|
| `/admin/workspaces` | GET | ✅ 完整 | P0 | Workspace 列表 |
| `/admin/workspaces/:id` | GET | ✅ 完整 | P0 | Workspace 详情 |
| `/admin/workspaces/:id/status` | PATCH | ✅ 完整 | P0 | 更新状态 |
| `/admin/workspaces/:id/members` | GET | ✅ 完整 | P1 | 成员列表 |
| `/admin/workspaces/:id/members/:userId/role` | PATCH | ✅ 完整 | P1 | 更新成员角色 |
| `/admin/workspaces/:id/members/:userId` | DELETE | ✅ 完整 | P1 | 移除成员 |
| `/admin/workspaces/:id/quota` | GET | ✅ 完整 | P1 | 配额信息 |
| `/admin/workspaces/:id/quota` | PATCH | ✅ 完整 | P2 | 更新配额 |
| `/admin/workspaces/:id/plan` | PATCH | ✅ 完整 | P1 | 更新计划 |
| `/admin/workspaces/:id/plan-history` | GET | ✅ 完整 | P2 | 计划历史 |
| `/admin/workspaces/:id/export` | POST | ✅ 完整 | P2 | 数据导出 |
| `/admin/workspaces/:id/log-archives` | GET | ✅ 完整 | P2 | 日志归档列表 |
| `/admin/workspaces/:id/log-archives` | POST | ✅ 完整 | P2 | 创建归档 |
| `/admin/workspaces/:id/database` | GET | ✅ 完整 | P2 | 数据库信息 |
| `/admin/workspaces/:id/database/migrate` | POST | ✅ 完整 | P2 | 数据库迁移 |
| `/admin/workspaces/:id/database/rotate-key` | POST | ✅ 完整 | P2 | 密钥轮换 |

### 1.4 应用管理 API

| 端点 | 方法 | 完整度 | 优先级 | 说明 |
|------|------|--------|--------|------|
| `/admin/apps` | GET | ✅ 完整 | P0 | 应用列表 |
| `/admin/apps/:id` | GET | ✅ 完整 | P0 | 应用详情 |
| `/admin/apps/:id/status` | PATCH | ✅ 完整 | P0 | 更新状态 |
| `/admin/apps/:id/versions` | GET | ✅ 完整 | P1 | 版本列表 |
| `/admin/apps/:id/versions/:versionId/rollback` | POST | ✅ 完整 | P1 | 版本回滚 |
| `/admin/apps/:id/versions/:versionId/promote` | POST | ✅ 完整 | P1 | 版本提升 |
| `/admin/apps/:id/reviews` | GET | ✅ 完整 | P1 | 审核列表 |
| `/admin/apps/:id/reviews` | POST | ✅ 完整 | P1 | 提交审核 |
| `/admin/apps/:id/ratings` | GET | ✅ 完整 | P2 | 评分信息 |
| `/admin/apps/:id/access-policy` | PATCH | ✅ 完整 | P1 | 更新访问策略 |
| `/admin/apps/:id/domains` | GET | ✅ 完整 | P1 | 域名列表 |
| `/admin/apps/:id/domains` | POST | ✅ 完整 | P1 | 添加域名 |
| `/admin/apps/:id/domains/:domainId/verify` | POST | ✅ 完整 | P2 | 验证域名 |
| `/admin/apps/:id/domains/:domainId` | DELETE | ✅ 完整 | P2 | 删除域名 |
| `/admin/apps/:id/webhooks` | GET | ✅ 完整 | P2 | Webhook 列表 |
| `/admin/apps/:id/webhooks/:webhookId/logs` | GET | ✅ 完整 | P2 | Webhook 日志 |
| `/admin/apps/:id/webhooks/:webhookId/logs/:logId/retry` | POST | ✅ 完整 | P2 | 重试 Webhook |

### 1.5 工作流管理 API

| 端点 | 方法 | 完整度 | 优先级 | 说明 |
|------|------|--------|--------|------|
| `/admin/workflows` | GET | ✅ 完整 | P0 | 工作流列表 |
| `/admin/workflows/:id` | GET | ✅ 完整 | P0 | 工作流详情 |
| `/admin/workflows/:id/status` | PATCH | ✅ 完整 | P0 | 更新状态 |
| `/admin/workflows/queue` | GET | ✅ 完整 | P1 | 执行队列 |
| `/admin/workflows/:id/timing-analysis` | GET | ✅ 完整 | P1 | 耗时分析 |
| `/admin/workflows/:id/failure-distribution` | GET | ✅ 完整 | P1 | 失败分布 |
| `/admin/executions` | GET | ✅ 完整 | P0 | 执行列表 |
| `/admin/executions/:id` | GET | ✅ 完整 | P0 | 执行详情 |
| `/admin/executions/:id/cancel` | POST | ✅ 完整 | P1 | 取消执行 |
| `/admin/executions/:id/retry` | POST | ✅ 完整 | P1 | 重试执行 |
| `/admin/executions/:id/replay` | POST | ✅ 完整 | P2 | 回放执行 |
| `/admin/executions/:id/priority` | PATCH | ✅ 完整 | P2 | 调整优先级 |

---

## 2. API 版本策略

### 当前版本

- API 版本：`v1`
- 基础路径：`/api/v1`

### 版本兼容性

| 版本 | 状态 | 支持期限 |
|------|------|----------|
| v1 | 当前 | - |
| v0 (legacy) | 废弃 | 2026-06-30 |

### 版本升级指南

1. 新版本发布后，旧版本保持 6 个月兼容期
2. 废弃的端点会返回 `X-Deprecated: true` 头
3. 迁移指南会在 API 文档中提供

---

## 3. 缺口与替代方案

### 3.1 已知缺口

| 功能 | API 端点 | 状态 | 替代方案 |
|------|----------|------|----------|
| 批量导出进度 | `/admin/exports/:id/progress` | 待实现 | 轮询 `/admin/exports/:id` |
| 实时通知 | WebSocket | 待实现 | 短轮询 |

### 3.2 本地模式

当 API 不可用时，Admin 支持本地模式（Mock 数据）：

```typescript
// 启用本地模式
NEXT_PUBLIC_LOCAL_MODE=true
```

---

## 4. 优先级说明

| 优先级 | 说明 |
|--------|------|
| P0 | 核心功能，必须实现 |
| P1 | 重要功能，应该实现 |
| P2 | 增强功能，可以延后 |
| P3 | 可选功能，按需实现 |
