# Admin 权限矩阵

## 概述

本文档定义 Admin 应用的权限体系，包括角色定义、能力点清单和页面级权限。

---

## 1. 角色定义

### 1.1 角色列表

| 角色 | 代码 | 描述 | 权限级别 |
|------|------|------|----------|
| Super Admin | `super_admin` | 超级管理员，拥有所有权限 | 最高 |
| Admin | `admin` | 管理员，日常管理操作 | 高 |
| Support | `support` | 客服人员，处理用户问题 | 中 |
| Finance | `finance` | 财务人员，处理计费相关 | 中 |
| Ops | `ops` | 运维人员，系统运维操作 | 中 |
| Reviewer | `reviewer` | 审核人员，内容审核 | 低 |
| Viewer | `viewer` | 只读人员，仅查看 | 最低 |

### 1.2 角色继承

```
super_admin
    │
    ├── admin
    │     ├── support
    │     ├── finance
    │     ├── ops
    │     └── reviewer
    │
    └── viewer (独立，不继承)
```

---

## 2. 能力点清单

### 2.1 命名规则

```
{module}.{resource}.{action}

例如：
- users.list.read        # 用户列表-读取
- users.status.write     # 用户状态-写入
- workspaces.billing.read # 工作空间计费-读取
```

### 2.2 用户管理能力点

| 能力点 | 描述 | super_admin | admin | support | finance | ops | reviewer | viewer |
|--------|------|:-----------:|:-----:|:-------:|:-------:|:---:|:--------:|:------:|
| `users.list.read` | 查看用户列表 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `users.detail.read` | 查看用户详情 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `users.role.write` | 修改用户角色 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `users.status.write` | 修改用户状态 | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `users.security.write` | 安全操作（强制下线等） | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `users.batch.write` | 批量操作 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `users.export.read` | 导出用户数据 | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |

### 2.3 Workspace 管理能力点

| 能力点 | 描述 | super_admin | admin | support | finance | ops | reviewer | viewer |
|--------|------|:-----------:|:-----:|:-------:|:-------:|:---:|:--------:|:------:|
| `workspaces.list.read` | 查看 Workspace 列表 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `workspaces.detail.read` | 查看 Workspace 详情 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `workspaces.status.write` | 修改状态 | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `workspaces.members.write` | 管理成员 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `workspaces.quota.write` | 修改配额 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `workspaces.plan.write` | 修改计划 | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `workspaces.database.write` | 数据库运维 | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `workspaces.export.read` | 数据导出 | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |

### 2.4 应用管理能力点

| 能力点 | 描述 | super_admin | admin | support | finance | ops | reviewer | viewer |
|--------|------|:-----------:|:-----:|:-------:|:-------:|:---:|:--------:|:------:|
| `apps.list.read` | 查看应用列表 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `apps.detail.read` | 查看应用详情 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `apps.status.write` | 修改状态 | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| `apps.versions.write` | 版本管理 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `apps.review.write` | 审核操作 | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| `apps.domains.write` | 域名管理 | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `apps.webhooks.write` | Webhook 管理 | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |

### 2.5 计费管理能力点

| 能力点 | 描述 | super_admin | admin | support | finance | ops | reviewer | viewer |
|--------|------|:-----------:|:-----:|:-------:|:-------:|:---:|:--------:|:------:|
| `billing.invoices.read` | 查看账单 | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `billing.refunds.read` | 查看退款 | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `billing.refunds.write` | 处理退款 | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `billing.anomalies.read` | 查看异常 | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `billing.anomalies.write` | 处理异常 | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `billing.rules.read` | 查看规则 | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `billing.rules.write` | 修改规则 | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |

### 2.6 安全与合规能力点

| 能力点 | 描述 | super_admin | admin | support | finance | ops | reviewer | viewer |
|--------|------|:-----------:|:-----:|:-------:|:-------:|:---:|:--------:|:------:|
| `security.config.read` | 查看配置 | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `security.config.write` | 修改配置 | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `security.secrets.read` | 查看密钥 | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `security.secrets.write` | 管理密钥 | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `security.audit.read` | 查看审计日志 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `security.audit.export` | 导出审计日志 | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `security.compliance.read` | 查看合规状态 | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `security.compliance.write` | 更新合规状态 | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |

---

## 3. 页面级权限

### 3.1 页面权限映射

| 页面 | 路由 | 所需能力点 | 最低角色 |
|------|------|-----------|----------|
| 仪表盘 | `/dashboard` | - | viewer |
| 用户列表 | `/users` | `users.list.read` | viewer |
| 用户详情 | `/users/:id` | `users.detail.read` | viewer |
| Workspace 列表 | `/workspaces` | `workspaces.list.read` | viewer |
| Workspace 详情 | `/workspaces/:id` | `workspaces.detail.read` | viewer |
| 应用列表 | `/apps` | `apps.list.read` | viewer |
| 应用详情 | `/apps/:id` | `apps.detail.read` | viewer |
| 工作流列表 | `/workflows` | `workflows.list.read` | viewer |
| 执行列表 | `/executions` | `executions.list.read` | viewer |
| 对话列表 | `/conversations` | `conversations.list.read` | viewer |
| 对话模板 | `/conversations/templates` | `conversations.templates.read` | admin |
| 敏感内容审核 | `/conversations/moderation` | `conversations.moderation.read` | reviewer |
| 模型策略 | `/conversations/strategies` | `conversations.strategies.read` | admin |
| 模板列表 | `/templates` | `templates.list.read` | viewer |
| 模板审核 | `/templates/review` | `templates.review.read` | reviewer |
| 账单列表 | `/billing/invoices` | `billing.invoices.read` | finance |
| 退款列表 | `/billing/refunds` | `billing.refunds.read` | finance |
| 计费异常 | `/billing/anomalies` | `billing.anomalies.read` | finance |
| 计费规则 | `/billing/rules` | `billing.rules.read` | finance |
| 工单列表 | `/tickets` | `tickets.list.read` | support |
| 配置中心 | `/security/config` | `security.config.read` | ops |
| 密钥管理 | `/security/secrets` | `security.secrets.read` | super_admin |
| 审计日志 | `/security/audit-logs` | `security.audit.read` | admin |
| 合规视图 | `/security/compliance` | `security.compliance.read` | ops |
| 供应链扫描 | `/security/supply-chain` | `security.compliance.read` | ops |
| 指标订阅 | `/analytics/subscriptions` | `analytics.subscriptions.read` | admin |

### 3.2 操作级权限

| 操作 | 所需能力点 | 说明 |
|------|-----------|------|
| 冻结用户 | `users.status.write` | 需填写原因 |
| 批量冻结用户 | `users.batch.write` | 需填写原因 |
| 修改用户角色 | `users.role.write` | 审计记录 |
| 强制下线 | `users.security.write` | 审计记录 |
| 重置密码 | `users.security.write` | 通知用户 |
| 冻结 Workspace | `workspaces.status.write` | 需填写原因 |
| 修改计划 | `workspaces.plan.write` | 审计记录 |
| 数据库迁移 | `workspaces.database.write` | 高危操作 |
| 密钥轮换 | `workspaces.database.write` | 高危操作 |
| 下架应用 | `apps.status.write` | 需填写原因 |
| 审核应用 | `apps.review.write` | 审计记录 |
| 处理退款 | `billing.refunds.write` | 二次确认 |
| 修改计费规则 | `billing.rules.write` | 高危操作 |
| 轮换密钥 | `security.secrets.write` | 高危操作 |
| 导出审计日志 | `security.audit.export` | 审计记录 |

---

## 4. 最小权限原则

### 4.1 默认策略

1. 新用户默认角色为 `viewer`
2. 敏感操作需要二次确认
3. 高危操作需要审批流程
4. 所有写操作记录审计日志

### 4.2 权限升级流程

```
申请权限升级
    │
    ▼
直属领导审批
    │
    ▼
安全团队审核
    │
    ▼
系统管理员执行
    │
    ▼
通知申请人
```

### 4.3 权限降级触发条件

1. 30 天无活跃登录
2. 安全事件触发
3. 人员变动

---

## 5. 审计要求

### 5.1 必须审计的操作

- 所有写操作
- 敏感数据查看
- 导出操作
- 登录/登出

### 5.2 审计字段

```typescript
interface AuditLog {
  id: string;
  actor_id: string;
  actor_email: string;
  actor_role: string;
  action: string;
  target_type: string;
  target_id: string;
  old_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  reason?: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}
```
