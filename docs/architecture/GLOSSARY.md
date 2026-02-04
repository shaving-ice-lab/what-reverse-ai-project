# 术语表与概念定义

版本：v1.0
日期：2026-02-03
状态：Active

---

## 核心术语定义

### Workspace（工作空间）

**定义**：用户或团队的逻辑隔离单元，是资源组织和权限控制的基础边界。

| 属性 | 说明 |
|-----|------|
| 所有者 | 每个 Workspace 有一个 Owner |
| 成员 | 支持邀请多个成员协作 |
| 资源 | 包含 Apps、Workflows、API Keys 等 |
| 数据 | 可配置独立数据库 |
| 计划 | 支持 free/pro/enterprise 套餐 |

```
Workspace
├── Apps[]
├── Workflows[]
├── Members[]
├── API Keys[]
├── Database (optional)
└── Settings
```

---

### App（应用）

**定义**：可发布、可访问的工作流应用单元。

**App = Workflow + UI Schema + DB Schema + Access Policy + Runtime Config**

| 组成部分 | 说明 |
|---------|------|
| Workflow | 工作流定义（节点 + 边） |
| UI Schema | 输入表单和结果展示的 UI 描述 |
| DB Schema | 应用所需的数据模型定义 |
| Access Policy | 访问控制策略（private/public_auth/public_anonymous） |
| Runtime Config | 运行时配置（限流、缓存、超时等） |

```
App
├── id: string
├── workspace_id: string
├── name: string
├── slug: string
├── status: draft | published | deprecated | archived
├── current_version_id: string
├── versions[]
│   ├── workflow_id: string
│   ├── ui_schema: JSON
│   ├── db_schema: JSON
│   └── config_json: JSON
└── access_policy
    ├── access_mode: private | public_auth | public_anonymous
    ├── rate_limit_json: JSON
    └── require_captcha: boolean
```

---

### Workflow（工作流）

**定义**：由节点和边组成的可执行流程定义。

| 元素 | 说明 |
|-----|------|
| Node | 执行单元（start、end、llm、http、db、code 等） |
| Edge | 节点间的连接关系 |
| Version | 工作流版本号 |
| Definition | 完整的节点和边定义 JSON |

---

### Runtime（运行时）

**定义**：App 的公开访问入口和执行环境。

| 特性 | 说明 |
|-----|------|
| 入口 | `/{workspaceSlug}/{appSlug}` 或自定义域名 |
| 执行 | 解析访问策略 → 创建会话 → 调用工作流 → 返回结果 |
| 监控 | 记录执行日志、指标、事件 |

---

### App User（应用用户）

**定义**：访问 App 公开服务的用户。

| 类型 | 说明 | 身份标识 |
|-----|------|---------|
| 已认证用户 | 登录平台的用户 | user_id |
| 匿名用户 | 未登录的访客 | session_id |

---

### Anonymous Session（匿名会话）

**定义**：未登录用户访问公开 App 时创建的临时会话。

| 属性 | 说明 |
|-----|------|
| session_id | 会话唯一标识 |
| session_type | `anon` |
| ip_hash | IP 地址哈希（脱敏） |
| user_agent_hash | UA 哈希 |
| created_at | 创建时间 |
| expired_at | 过期时间（默认 24h） |

---

## 访问策略定义

### access_mode（访问模式）

| 模式 | 说明 | 认证要求 |
|-----|------|---------|
| `private` | 仅 Workspace 成员可访问 | 必须登录且为成员 |
| `public_auth` | 公开但需登录 | 必须登录 |
| `public_anonymous` | 公开且允许匿名 | 无需登录 |

### 访问策略配置

```json
{
  "access_mode": "public_anonymous",
  "rate_limit_json": {
    "per_ip": { "max_requests": 120, "window_seconds": 60 },
    "per_session": { "max_requests": 60, "window_seconds": 60 }
  },
  "allowed_origins": ["*"],
  "require_captcha": false,
  "data_classification": "public"
}
```

---

## 状态定义

### App 状态

| 状态 | 说明 | 可转换到 |
|-----|------|---------|
| `draft` | 草稿，未发布 | published |
| `published` | 已发布，可访问 | deprecated, draft |
| `deprecated` | 已下线，不可访问 | archived, published |
| `archived` | 已归档 | - |

### Execution 状态

| 状态 | 说明 |
|-----|------|
| `pending` | 等待执行 |
| `running` | 执行中 |
| `completed` | 执行完成 |
| `failed` | 执行失败 |
| `cancelled` | 已取消 |

---

## 前后端一致性要求

### 字段命名规范

| 位置 | 规范 | 示例 |
|-----|------|------|
| API 请求/响应 | snake_case | `workspace_id`, `access_mode` |
| 前端组件 Props | camelCase | `workspaceId`, `accessMode` |
| 数据库字段 | snake_case | `workspace_id`, `access_mode` |

### 枚举值统一

所有枚举值在前后端使用相同的字符串常量：

```typescript
// 前端
type AccessMode = 'private' | 'public_auth' | 'public_anonymous';
type AppStatus = 'draft' | 'published' | 'deprecated' | 'archived';
type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
```

```go
// 后端
const (
    AccessModePrivate         = "private"
    AccessModePublicAuth      = "public_auth"
    AccessModePublicAnonymous = "public_anonymous"
)
```

---

## 变更记录

| 日期 | 版本 | 变更内容 | 作者 |
|------|------|---------|------|
| 2026-02-03 | v1.0 | 初始版本 | AgentFlow Team |
