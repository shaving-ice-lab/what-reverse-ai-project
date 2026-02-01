# AI 创意助手 API 设计文档

> **版本**: v1.0  
> **更新日期**: 2026-01-29  
> **基础路径**: `/api/v1/creative`

---

## 目录

1. [概述](#1-概述)
2. [认证](#2-认证)
3. [模板接口](#3-模板接口)
4. [生成接口](#4-生成接口)
5. [文档接口](#5-文档接口)
6. [WebSocket 实时推送](#6-websocket-实时推送)
7. [错误处理](#7-错误处理)

---

## 1. 概述

### 1.1 API 设计原则

- **RESTful**: 遵循 REST 设计规范
- **版本控制**: URL 中包含版本号 `/api/v1/`
- **JSON**: 请求和响应均使用 JSON 格式
- **流式支持**: 长内容生成支持 SSE 流式输出

### 1.2 请求格式

```http
Content-Type: application/json
Authorization: Bearer <access_token>
```

### 1.3 响应格式

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

错误响应：

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": { ... }
  }
}
```

---

## 2. 认证

### 2.1 获取 Access Token

```http
POST /api/v1/auth/token
```

**请求体**:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "dGhpcyBpcyBhIHJlZnJl...",
    "expiresIn": 3600
  }
}
```

---

## 3. 模板接口

### 3.1 获取模板列表

```http
GET /api/v1/creative/templates
```

**查询参数**:

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| category | string | 否 | 分类筛选：business/content/product/marketing |
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页数量，默认 20 |
| search | string | 否 | 搜索关键词 |

**响应**:

```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "business-plan-generator",
        "name": "商业计划生成器",
        "description": "输入你的商业想法，自动生成完整的商业计划书",
        "icon": "briefcase",
        "category": "business",
        "tags": ["商业计划", "创业", "副业"],
        "estimatedTime": "3-5分钟",
        "usageCount": 1234,
        "rating": 4.8
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 15,
      "totalPages": 1
    }
  }
}
```

### 3.2 获取模板详情

```http
GET /api/v1/creative/templates/{templateId}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "id": "business-plan-generator",
    "name": "商业计划生成器",
    "description": "输入你的商业想法，自动生成完整的商业计划书",
    "icon": "briefcase",
    "category": "business",
    "tags": ["商业计划", "创业", "副业"],
    "estimatedTime": "3-5分钟",
    
    "inputs": {
      "required": [
        {
          "id": "idea",
          "label": "商业想法",
          "type": "textarea",
          "placeholder": "例如：我想做AI自媒体...",
          "validation": {
            "required": true,
            "minLength": 10
          }
        }
      ],
      "optional": [
        {
          "id": "resources",
          "label": "可用资源",
          "type": "textarea"
        }
      ]
    },
    
    "outputSections": [
      {
        "id": "market_analysis",
        "title": "市场机会分析",
        "description": "分析行业现状、成功案例、核心洞察"
      }
    ],
    
    "example": {
      "input": {
        "idea": "我想做AI自媒体年入1000万"
      },
      "outputPreview": "# AI自媒体商业计划\n\n## 一、市场机会分析..."
    }
  }
}
```

### 3.3 获取模板示例

```http
GET /api/v1/creative/templates/{templateId}/example
```

**响应**:

```json
{
  "success": true,
  "data": {
    "input": {
      "idea": "我想做AI自媒体年入1000万",
      "targetRevenue": "10000000",
      "resources": "1人团队，3万启动资金"
    },
    "output": "# AI自媒体1000万赚钱可行方案\n\n> 基于2025-2026年国内市场调研...\n\n## 一、市场机会分析\n\n### 已验证的成功案例\n\n| 案例 | 模式 | 收入规模 |..."
  }
}
```

---

## 4. 生成接口

### 4.1 创建生成任务

```http
POST /api/v1/creative/generate
```

**请求体**:

```json
{
  "templateId": "business-plan-generator",
  "inputs": {
    "idea": "我想通过AI自媒体年入1000万，计划通过知识付费、AI工具服务和企业咨询三条线来变现。",
    "targetRevenue": "10000000",
    "timeframe": "3years",
    "resources": "1人团队，3万启动资金，每天可投入4小时",
    "background": "技术背景，5年开发经验"
  }
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "taskId": "task_abc123xyz",
    "status": "pending",
    "templateId": "business-plan-generator",
    "estimatedTime": 180,
    "createdAt": "2026-01-29T10:30:00Z"
  }
}
```

### 4.2 获取任务状态

```http
GET /api/v1/creative/generate/{taskId}
```

**响应（进行中）**:

```json
{
  "success": true,
  "data": {
    "taskId": "task_abc123xyz",
    "status": "processing",
    "progress": 45,
    "currentSection": "business_model",
    "completedSections": ["market_analysis"],
    "pendingSections": ["execution_strategy", "timeline", "risk_assessment", "action_plan"],
    "startedAt": "2026-01-29T10:30:05Z"
  }
}
```

**响应（完成）**:

```json
{
  "success": true,
  "data": {
    "taskId": "task_abc123xyz",
    "status": "completed",
    "progress": 100,
    "documentId": "doc_def456uvw",
    "startedAt": "2026-01-29T10:30:05Z",
    "completedAt": "2026-01-29T10:33:45Z",
    "duration": 220,
    "tokenUsage": {
      "input": 2500,
      "output": 8500,
      "total": 11000
    }
  }
}
```

### 4.3 流式获取生成内容 (SSE)

```http
GET /api/v1/creative/generate/{taskId}/stream
```

**SSE 事件流**:

```
event: task_started
data: {"taskId":"task_abc123xyz","totalSections":6}

event: section_started
data: {"section":"market_analysis","title":"市场机会分析","index":1,"total":6}

event: section_chunk
data: {"section":"market_analysis","content":"## 一、市场机会分析\n\n### 已验证的成功案例\n\n","done":false}

event: section_chunk
data: {"section":"market_analysis","content":"| 案例 | 模式 | 收入规模 |\n","done":false}

event: section_completed
data: {"section":"market_analysis","index":1,"total":6}

event: section_started
data: {"section":"business_model","title":"商业模式设计","index":2,"total":6}

... more chunks ...

event: task_completed
data: {"taskId":"task_abc123xyz","documentId":"doc_def456uvw","duration":220}
```

### 4.4 取消生成任务

```http
POST /api/v1/creative/generate/{taskId}/cancel
```

**响应**:

```json
{
  "success": true,
  "data": {
    "taskId": "task_abc123xyz",
    "status": "cancelled",
    "cancelledAt": "2026-01-29T10:31:00Z"
  }
}
```

### 4.5 重新生成单个章节

```http
POST /api/v1/creative/documents/{documentId}/regenerate
```

**请求体**:

```json
{
  "sectionId": "market_analysis",
  "instruction": "请增加更多小红书相关的案例，减少B站的内容"
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "taskId": "task_regen_789",
    "documentId": "doc_def456uvw",
    "sectionId": "market_analysis",
    "status": "processing"
  }
}
```

---

## 5. 文档接口

### 5.1 获取文档列表

```http
GET /api/v1/creative/documents
```

**查询参数**:

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| templateId | string | 否 | 按模板筛选 |
| page | number | 否 | 页码 |
| pageSize | number | 否 | 每页数量 |
| sortBy | string | 否 | 排序字段：createdAt/updatedAt |
| sortOrder | string | 否 | 排序方向：asc/desc |

**响应**:

```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": "doc_def456uvw",
        "title": "AI自媒体1000万赚钱可行方案",
        "templateId": "business-plan-generator",
        "templateName": "商业计划生成器",
        "preview": "基于2025-2026年国内市场调研...",
        "version": 1,
        "createdAt": "2026-01-29T10:33:45Z",
        "updatedAt": "2026-01-29T10:33:45Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 5
    }
  }
}
```

### 5.2 获取文档详情

```http
GET /api/v1/creative/documents/{documentId}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "id": "doc_def456uvw",
    "title": "AI自媒体1000万赚钱可行方案",
    "templateId": "business-plan-generator",
    
    "content": "# AI自媒体1000万赚钱可行方案\n\n> 基于2025-2026年...",
    
    "sections": [
      {
        "id": "market_analysis",
        "title": "市场机会分析",
        "content": "## 一、市场机会分析\n\n### 已验证的成功案例...",
        "startLine": 10,
        "endLine": 85
      }
    ],
    
    "inputs": {
      "idea": "我想做AI自媒体年入1000万",
      "targetRevenue": "10000000"
    },
    
    "metadata": {
      "tokenUsage": { "total": 11000 },
      "generationTime": 220
    },
    
    "version": 1,
    "createdAt": "2026-01-29T10:33:45Z",
    "updatedAt": "2026-01-29T10:33:45Z"
  }
}
```

### 5.3 更新文档内容

```http
PATCH /api/v1/creative/documents/{documentId}
```

**请求体**:

```json
{
  "title": "新标题",
  "content": "更新后的完整内容..."
}
```

### 5.4 导出文档

```http
GET /api/v1/creative/documents/{documentId}/export
```

**查询参数**:

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| format | string | 是 | 导出格式：markdown/pdf/docx/html |

**响应（Markdown）**:

```
Content-Type: text/markdown
Content-Disposition: attachment; filename="AI自媒体商业计划.md"

# AI自媒体1000万赚钱可行方案
...
```

**响应（PDF）**:

```
Content-Type: application/pdf
Content-Disposition: attachment; filename="AI自媒体商业计划.pdf"

[binary data]
```

### 5.5 创建分享链接

```http
POST /api/v1/creative/documents/{documentId}/share
```

**请求体**:

```json
{
  "expiresIn": 604800,
  "password": "optional_password",
  "allowDownload": true
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "shareId": "share_xyz789",
    "shareUrl": "https://agentflow.ai/s/share_xyz789",
    "expiresAt": "2026-02-05T10:33:45Z",
    "hasPassword": true
  }
}
```

### 5.6 删除文档

```http
DELETE /api/v1/creative/documents/{documentId}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "id": "doc_def456uvw",
    "deleted": true
  }
}
```

---

## 6. WebSocket 实时推送

### 6.1 连接

```javascript
const ws = new WebSocket('wss://api.agentflow.ai/ws?token=<access_token>');
```

### 6.2 订阅生成任务

```json
{
  "type": "subscribe",
  "channel": "generation",
  "taskId": "task_abc123xyz"
}
```

### 6.3 接收消息

```json
// 章节开始
{
  "type": "section_started",
  "taskId": "task_abc123xyz",
  "section": "market_analysis",
  "title": "市场机会分析"
}

// 内容片段
{
  "type": "content_chunk",
  "taskId": "task_abc123xyz",
  "section": "market_analysis",
  "content": "部分内容...",
  "done": false
}

// 章节完成
{
  "type": "section_completed",
  "taskId": "task_abc123xyz",
  "section": "market_analysis"
}

// 任务完成
{
  "type": "task_completed",
  "taskId": "task_abc123xyz",
  "documentId": "doc_def456uvw"
}

// 错误
{
  "type": "error",
  "taskId": "task_abc123xyz",
  "error": {
    "code": "GENERATION_FAILED",
    "message": "生成失败"
  }
}
```

---

## 7. 错误处理

### 7.1 错误码列表

| 错误码 | HTTP 状态码 | 描述 |
|--------|-------------|------|
| UNAUTHORIZED | 401 | 未授权，需要登录 |
| FORBIDDEN | 403 | 权限不足 |
| NOT_FOUND | 404 | 资源不存在 |
| VALIDATION_ERROR | 400 | 请求参数验证失败 |
| TEMPLATE_NOT_FOUND | 404 | 模板不存在 |
| TASK_NOT_FOUND | 404 | 任务不存在 |
| DOCUMENT_NOT_FOUND | 404 | 文档不存在 |
| GENERATION_FAILED | 500 | 生成失败 |
| GENERATION_TIMEOUT | 504 | 生成超时 |
| RATE_LIMITED | 429 | 请求过于频繁 |
| QUOTA_EXCEEDED | 402 | 配额已用完 |

### 7.2 错误响应示例

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数验证失败",
    "details": {
      "fields": [
        {
          "field": "inputs.idea",
          "message": "商业想法至少需要10个字符"
        }
      ]
    }
  }
}
```

---

## 附录

### A. 速率限制

| 用户类型 | 生成请求 | API 请求 |
|----------|----------|----------|
| 免费用户 | 5次/天 | 100次/分钟 |
| 基础会员 | 50次/天 | 500次/分钟 |
| 专业会员 | 无限制 | 1000次/分钟 |

### B. SDK 示例

**JavaScript/TypeScript**:

```typescript
import { AgentFlowClient } from '@agentflow/sdk';

const client = new AgentFlowClient({
  apiKey: 'your_api_key'
});

// 创建生成任务
const task = await client.creative.generate({
  templateId: 'business-plan-generator',
  inputs: {
    idea: '我想做AI自媒体年入1000万',
    targetRevenue: '10000000'
  }
});

// 流式获取内容
for await (const event of client.creative.stream(task.taskId)) {
  if (event.type === 'content_chunk') {
    console.log(event.content);
  }
}

// 获取最终文档
const document = await client.creative.getDocument(task.documentId);
console.log(document.content);
```

**Python**:

```python
from agentflow import AgentFlowClient

client = AgentFlowClient(api_key="your_api_key")

# 创建生成任务
task = client.creative.generate(
    template_id="business-plan-generator",
    inputs={
        "idea": "我想做AI自媒体年入1000万",
        "target_revenue": "10000000"
    }
)

# 流式获取内容
for event in client.creative.stream(task.task_id):
    if event.type == "content_chunk":
        print(event.content, end="")

# 获取最终文档
document = client.creative.get_document(task.document_id)
print(document.content)
```

---

*本文档定义了 AI 创意助手的完整 API 接口，供前端和第三方开发者使用。*
