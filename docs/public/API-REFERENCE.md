# API 参考

> 以 Swagger 与现有文档为准，本页提供入口概览与响应结构。

## 基础信息

- **API 基础路径**: `/api/v1`
- **Runtime 公开入口**: `/runtime/:workspaceSlug/:appSlug`（不走 `/api/v1`）
- **自定义域名入口**: 绑定域名后，使用根路径 `/` 与 `/schema`

## 响应结构（统一包裹）

### 成功响应

```json
{
  "code": "OK",
  "message": "OK",
  "data": {},
  "trace_id": "trace_xxx",
  "request_id": "req_yyy"
}
```

### 失败响应

```json
{
  "code": "ERROR_CODE",
  "message": "错误描述",
  "data": {
    "details": {}
  },
  "trace_id": "trace_xxx",
  "request_id": "req_yyy"
}
```

### 分页响应（列表接口）

```json
{
  "code": "OK",
  "message": "OK",
  "data": [],
  "meta": {
    "total": 100,
    "page": 1,
    "page_size": 20
  },
  "trace_id": "trace_xxx",
  "request_id": "req_yyy"
}
```

## 文档与规范入口

- Swagger: `apps/server/docs/swagger/swagger.json`
- 字段定义（Workspace/App/Domain/Runtime）: [`docs/api/API-FIELDS.md`](../api/API-FIELDS.md)
- 错误码表: [`docs/api/ERROR-CODES.md`](../api/ERROR-CODES.md)

## 常用公开入口（示例）

- `GET /api/v1/system/health` 健康检查
- `GET /api/v1/system/features` 功能开关

> 更多接口请以 Swagger 为准，或从 `apps/server/internal/api/handler/` 查看具体路由说明。
