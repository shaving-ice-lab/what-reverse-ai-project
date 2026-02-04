# API 字段定义

本文档定义各模块 API 接口的请求/响应字段规范，便于前后端对齐。

---

## 目录

1. [Workspace API](#workspace-api)
2. [App API](#app-api)
3. [Domain API](#domain-api)
4. [Runtime API](#runtime-api)

---

## Workspace API

### 创建 Workspace

- **Method**: `POST /api/v1/workspaces`
- **Auth**: 必须登录（Bearer Token）

#### 请求字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 是 | Workspace 名称 |
| `slug` | string | 否 | 自定义 Slug（可读短链） |
| `region` | string | 否 | 区域标识（用于地域亲和） |

> `region` 为空字符串时会被忽略。

#### 响应字段

`data.workspace` 对象中至少包含以下字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | Workspace ID |
| `owner_user_id` | string | 拥有者用户 ID |
| `created_at` | string | 创建时间（ISO8601） |

#### 请求示例

```json
{
  "name": "My Workspace",
  "slug": "my-workspace",
  "region": "ap-east-1"
}
```

#### 响应示例

```json
{
  "code": "OK",
  "message": "OK",
  "data": {
    "workspace": {
      "id": "ws_123",
      "owner_user_id": "user_456",
      "created_at": "2026-02-02T12:00:00Z"
    }
  },
  "trace_id": "trace_xxx",
  "request_id": "req_yyy"
}
```

---

## App API

### 创建 App（基础）

- **Method**: `POST /api/v1/apps`
- **Auth**: 必须登录（Bearer Token）

#### 请求字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `workspace_id` | string | 是 | Workspace ID |
| `name` | string | 是 | App 名称 |
| `slug` | string | 否 | App Slug |

#### 响应字段

`data.app` 中包含 App 基础信息（`id`、`workspace_id`、`created_at` 等）。

### 创建 App（基于 Workflow）

- **Method**: `POST /api/v1/apps/from-workflow`
- **Auth**: 必须登录（Bearer Token）

#### 请求字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `workspace_id` | string | 是 | Workspace ID |
| `workflow_id` | string | 是 | Workflow ID |
| `name` | string | 否 | App 名称（为空时默认 Workflow 名称） |
| `slug` | string | 否 | App Slug |
| `ui_schema` | object | 否 | UI Schema（可选） |

#### 响应字段

`data.app` 中包含 App 基础信息，若提供 `workflow_id` 则会创建首个版本。

### 发布 App

- **Method**: `POST /api/v1/apps/:id/publish`
- **Auth**: 必须登录（Bearer Token）

#### 请求字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `version_id` | string | 否 | 版本 ID（部分状态需要指定） |
| `access_policy` | object | 否 | 访问策略 |
| `rate_limit` | object | 否 | 限流配置（会映射为 `rate_limit_json`） |

`access_policy` 字段（可选）：

| 字段 | 类型 | 说明 |
|------|------|------|
| `access_mode` | string | 访问模式 |
| `data_classification` | string | 数据分级 |
| `rate_limit_json` | object | 限流配置 |
| `allowed_origins` | string[] | 允许的来源 |
| `require_captcha` | bool | 是否需要验证码 |

### 创建 App 版本

- **Method**: `POST /api/v1/apps/:id/versions`
- **Auth**: 必须登录（Bearer Token）

#### 请求字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `workflow_id` | string | 否 | Workflow ID |
| `changelog` | string | 否 | 版本变更说明 |
| `ui_schema` | object | 否 | UI Schema |
| `config_json` | object | 否 | 版本配置 |

#### 响应字段

`data.version` 中包含 `id`、`version`、`created_at` 等字段。

---

## Domain API

### 绑定域名

- **Method**: `POST /api/v1/apps/:id/domains`
- **Auth**: 必须登录（Bearer Token）

#### 请求字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `domain` | string | 是 | 绑定域名 |

#### 响应字段

`data.domain` 与 `data.verification`：

| 字段 | 类型 | 说明 |
|------|------|------|
| `domain.id` | string | 域名记录 ID |
| `domain.domain` | string | 域名 |
| `domain.status` | string | 状态（pending/verified/active） |
| `verification.txt_name` | string | TXT 记录名 |
| `verification.txt_value` | string | TXT 记录值 |
| `verification.cname_target` | string | CNAME 目标 |

### 验证域名（App 维度）

- **Method**: `POST /api/v1/apps/:id/domains/:domainId/verify`
- **Auth**: 必须登录（Bearer Token）

#### 请求字段

无需 body。

#### 响应字段

`data.domain` 与 `data.verification`：

| 字段 | 类型 | 说明 |
|------|------|------|
| `domain.id` | string | 域名记录 ID |
| `domain.domain` | string | 域名 |
| `domain.status` | string | 状态（pending/verified/active） |
| `verified` | bool | 是否验证通过 |
| `method` | string | 验证方法（dns/cached 等） |
| `verification.txt_name` | string | TXT 记录名 |
| `verification.txt_value` | string | TXT 记录值 |
| `verification.cname_target` | string | CNAME 目标 |

### 验证域名（不依赖 App）

- **Method**: `POST /api/v1/domains/:domainId/verify`
- **Auth**: 必须登录（Bearer Token）

#### 请求字段

无需 body。

#### 响应字段

同上。

---

## Runtime API

### 执行 Runtime（路径模式）

- **Method**: `POST /runtime/:workspaceSlug/:appSlug`
- **Auth**: 可选（取决于 App 访问策略）

#### 请求字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `inputs` | object | 否 | 执行输入 |
| `trigger_type` | string | 否 | 触发类型（默认 `app_runtime`） |
| `captcha_token` | string | 否 | 验证码 Token |

#### 请求示例

```json
{
  "inputs": {
    "query": "hello"
  },
  "trigger_type": "app_runtime"
}
```

#### 响应字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `execution_id` | string | 执行 ID |
| `status` | string | 执行状态 |
| `workflow_id` | string | 工作流 ID |
| `started_at` | string | 执行开始时间 |
| `session_id` | string | 会话 ID |
| `message` | string | 提示信息 |

#### 响应示例

```json
{
  "code": "OK",
  "message": "OK",
  "data": {
    "execution_id": "exec_123",
    "status": "running",
    "workflow_id": "wf_456",
    "started_at": "2026-02-02T12:00:00Z",
    "session_id": "sess_789",
    "message": "执行已开始"
  }
}
```

> 说明：实际返回以服务端 `RuntimeHandler` 为准，响应包含 `execution_id`、`status`、`workflow_id`、`started_at`、`session_id`、`message`。

### 执行 Runtime（域名模式）

- **Method**: `POST /`
- **Auth**: 可选（取决于 App 访问策略）

#### 请求字段

同上（域名绑定入口使用相同请求结构）。

#### 响应字段

同上。
