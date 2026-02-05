# 运行时说明

> Runtime 用于对外公开已发布的 App，提供入口信息、Schema 与执行能力。

## 入口类型

### Workspace/App 入口

- `GET /runtime/:workspaceSlug/:appSlug` 获取入口信息
- `GET /runtime/:workspaceSlug/:appSlug/schema` 获取 Schema
- `POST /runtime/:workspaceSlug/:appSlug` 发起执行

### 自定义域名入口

当 App 绑定自定义域名后，使用根路径访问：

- `GET /` 获取入口信息
- `GET /schema` 获取 Schema
- `POST /` 发起执行

## Schema 返回字段（关键项）

- `ui_schema`：前端渲染表单/页面的 UI Schema
- `db_schema`：数据存储结构
- `config_json`：运行时配置
- `version` / `version_id`：发布版本信息
- `workflow_id`：关联的工作流
- `changelog`：版本变更说明

## 执行请求

```json
{
  "inputs": {
    "key": "value"
  },
  "trigger_type": "app_runtime",
  "captcha_token": ""
}
```

## 执行响应（示例）

```json
{
  "code": "OK",
  "message": "OK",
  "data": {
    "execution_id": "uuid",
    "status": "running",
    "workflow_id": "uuid",
    "started_at": "2026-02-02T10:00:00Z",
    "session_id": "uuid",
    "message": "执行已开始"
  },
  "trace_id": "trace_xxx",
  "request_id": "req_yyy"
}
```

## 会话与风控

- `X-App-Session-Id` 头用于传递匿名会话（如有）
- 访问策略可能要求验证码（`captcha_token`）
- 可能触发限流/封禁，需按返回错误码处理

## 进一步参考

- `apps/server/internal/api/handler/runtime.go`
- `docs/public/API-REFERENCE.md`
