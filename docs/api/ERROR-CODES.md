# API 错误码表

本表用于定位接口错误原因，建议配合 `trace_id` / `request_id` 查询日志。

## 响应字段

- `code`: 错误码
- `message`: 可读错误描述
- `trace_id` / `request_id`: 追踪标识

## WORKSPACE

| 错误码 | HTTP 状态码 | 描述 |
|--------|-------------|------|
| WORKSPACE_DISABLED | 503 | 工作空间功能未开放 |
| WORKSPACE_ID_REQUIRED | 400 | 工作空间 ID 不能为空 |
| WORKSPACE_INVALID_ID | 400 | 工作空间 ID 无效 |
| WORKSPACE_NOT_FOUND | 404 | 工作空间不存在 |

## APP

| 错误码 | HTTP 状态码 | 描述 |
|--------|-------------|------|
| APP_INVALID_ID | 400 | App ID 无效 |
| APP_NOT_FOUND | 404 | App 不存在 |
| APP_MISMATCH | 400 | App 不属于此工作空间 |

## RUNTIME

| 错误码 | HTTP 状态码 | 描述 |
|--------|-------------|------|
| APP_RUNTIME_DISABLED | 503 | App Runtime 暂未开放 |
| RUNTIME_FAILED | 500 | 运行时执行失败 |

## DOMAIN

| 错误码 | HTTP 状态码 | 描述 |
|--------|-------------|------|
| DOMAIN_DISABLED | 503 | 域名功能未开放 |
| DOMAIN_INVALID_ID | 400 | 域名 ID 无效 |
| DOMAIN_NOT_FOUND | 404 | 域名不存在 |
| DOMAIN_EXISTS | 409 | 域名已绑定 |
| DOMAIN_NOT_VERIFIED | 400 | 域名未验证 |
| DOMAIN_NOT_ACTIVE | 409 | 域名未生效 |
| DOMAIN_ACTIVE | 409 | 域名已生效 |

## DB

| 错误码 | HTTP 状态码 | 描述 |
|--------|-------------|------|
| DB_NOT_FOUND | 404 | 工作空间数据库不存在 |
| DB_NOT_READY | 409 | 工作空间数据库尚未就绪 |

## 发现接口

`GET /api/v1/system/error-codes` 返回完整错误码清单。

