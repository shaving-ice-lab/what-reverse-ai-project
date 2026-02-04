# API 参考

> 以 Swagger 与现有文档为准，本页提供入口概览与响应结构。

## 基础信息

- **API 基础路径**: `/api/v1`
- **Runtime 公开入口**: `/runtime/:workspaceSlug/:appSlug`（不走 `/api/v1`）
- **自定义域名入口**: 绑定域名后，使用根路径 `/` 与 `/schema`

## 响应结构

### 成功响应

```json
{
  "success": true,
  "data": {}
}
```

### 失败响应

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {}
  }
}
```

### 分页响应

```json
{
  "success": true,
  "data": [],
  "meta": {
    "total": 100,
    "page": 1,
    "page_size": 20
  }
}
```

## 文档与规范入口

- Swagger: `apps/server/docs/swagger/swagger.json`
- 现有 API 文档: `docs/api/creative-assistant-api.md`
- 错误码表: `docs/ERROR-CODES.md`
- App 字段定义: `docs/API-FIELDS-APP.md`
- Runtime 字段定义: `docs/API-FIELDS-RUNTIME.md`
- Domain 字段定义: `docs/API-FIELDS-DOMAIN.md`

## 常用公开入口（示例）

- `GET /api/v1/system/health` 健康检查
- `GET /api/v1/system/features` 功能开关

> 更多接口请以 Swagger 为准，或从 `apps/server/internal/api/handler/` 查看具体路由说明。
