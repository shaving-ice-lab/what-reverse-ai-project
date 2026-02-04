# {{projectName}}

AgentFlow 自定义节点 - HTTP 请求模板

## 功能

灵活的 HTTP 请求节点，支持：

- 多种 HTTP 方法 (GET/POST/PUT/PATCH/DELETE)
- 自定义请求头
- JSON 请求体
- 超时控制
- 自动重试

## 安装

```bash
npm install
```

## 使用示例

### GET 请求

```json
{
  "url": "https://api.example.com/users",
  "method": "GET",
  "headers": {
    "Authorization": "Bearer {{token}}"
  }
}
```

### POST 请求

```json
{
  "url": "https://api.example.com/users",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

## 输入参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| url | string | 是 | - | 完整的请求 URL |
| method | select | 否 | GET | HTTP 方法 |
| headers | json | 否 | {} | 请求头 |
| body | json | 否 | - | 请求体 |
| timeout | number | 否 | 30000 | 超时时间(ms) |
| retries | number | 否 | 0 | 重试次数 |

## 输出

| 字段 | 类型 | 说明 |
|------|------|------|
| status | number | HTTP 状态码 |
| headers | json | 响应头 |
| body | json | 解析后的响应体 |
| rawBody | string | 原始响应文本 |
| duration | number | 请求耗时(ms) |
| success | boolean | 是否成功(2xx) |

## 许可证

MIT
