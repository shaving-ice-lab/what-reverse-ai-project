# Phase 1: MVP 闭环 - 详细需求文档

> **版本**: v1.0  
> **更新日期**: 2026-01-29  
> **预计周期**: 4-6 周  
> **优先级**: P0 - 必须完成

---

## 目录

1. [阶段目标](#1-阶段目标)
2. [功能需求](#2-功能需求)
3. [技术需求](#3-技术需求)
4. [API 设计](#4-api-设计)
5. [数据模型](#5-数据模型)
6. [验收标准](#6-验收标准)
7. [开发任务分解](#7-开发任务分解)

---

## 1. 阶段目标

### 1.1 核心目标

> **让用户能创建、保存、真正运行工作流，并看到执行结果**

当前状态：
- ✅ 前端编辑器基本完成
- ❌ 后端执行引擎未实现
- ❌ 工作流无法真正运行
- ❌ 数据无法持久化

### 1.2 用户故事

**US-001: 作为用户，我想创建一个工作流并保存**
```gherkin
Given 我在编辑器页面
When 我拖拽节点到画布并配置
And 我点击保存按钮
Then 工作流应该被保存到服务器
And 我应该看到"保存成功"提示
```

**US-002: 作为用户，我想运行一个工作流**
```gherkin
Given 我有一个已保存的工作流
When 我点击运行按钮
Then 工作流应该开始执行
And 我应该看到实时执行日志
And 执行完成后我应该看到结果
```

**US-003: 作为用户，我想使用 LLM 节点**
```gherkin
Given 我的工作流包含一个 LLM 节点
And 我已配置 API Key
When 工作流执行到 LLM 节点
Then 应该调用实际的 LLM API
And 返回 AI 生成的内容
```

### 1.3 成功标准

| 指标 | 目标 |
|------|------|
| 工作流保存成功率 | > 99% |
| 工作流执行成功率 | > 95% |
| 执行日志实时性 | < 500ms 延迟 |
| 内测用户完成首个工作流 | > 10 人 |

---

## 2. 功能需求

### 2.1 执行引擎 (P0)

#### REQ-101: 工作流执行器

**描述**: 实现后端工作流执行引擎，能够按照工作流定义顺序执行节点。

**功能点**:

| ID | 功能 | 优先级 | 说明 |
|----|------|--------|------|
| REQ-101-1 | 工作流解析 | P0 | 解析工作流 JSON 定义 |
| REQ-101-2 | 拓扑排序 | P0 | 确定节点执行顺序 |
| REQ-101-3 | 节点执行 | P0 | 按顺序执行每个节点 |
| REQ-101-4 | 数据传递 | P0 | 节点间数据流转 |
| REQ-101-5 | 执行状态管理 | P0 | pending/running/completed/failed |
| REQ-101-6 | 错误处理 | P0 | 节点执行失败处理 |
| REQ-101-7 | 超时控制 | P1 | 单节点/整体超时 |

**执行流程**:

```
┌─────────────────────────────────────────────────────────────┐
│                     执行引擎流程                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 接收执行请求                                              │
│     ↓                                                        │
│  2. 解析工作流定义                                            │
│     ↓                                                        │
│  3. 拓扑排序确定执行顺序                                       │
│     ↓                                                        │
│  4. 创建执行记录 (status: pending)                            │
│     ↓                                                        │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 5. 循环执行每个节点                                       ││
│  │    ├── 获取节点输入 (从上游节点输出)                       ││
│  │    ├── 执行节点逻辑                                       ││
│  │    ├── 保存节点输出                                       ││
│  │    ├── 推送执行日志 (WebSocket)                           ││
│  │    └── 更新执行状态                                       ││
│  └─────────────────────────────────────────────────────────┘│
│     ↓                                                        │
│  6. 所有节点完成，更新执行记录 (status: completed)             │
│     ↓                                                        │
│  7. 返回执行结果                                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**技术要求**:
- 语言: Go
- 并发: 支持多工作流并行执行
- 持久化: 执行状态和结果存入数据库
- 日志: 每个节点的输入输出都记录

#### REQ-102: 节点执行器

**描述**: 为每种节点类型实现具体的执行逻辑。

**MVP 必须实现的节点**:

| 节点类型 | 优先级 | 输入 | 输出 | 说明 |
|----------|--------|------|------|------|
| `start` | P0 | 触发数据 | 透传 | 工作流入口 |
| `end` | P0 | 任意 | 无 | 工作流出口，收集结果 |
| `llm` | P0 | prompt, config | text | 调用 LLM API |
| `http` | P0 | url, method, body | response | HTTP 请求 |
| `template` | P0 | template, variables | text | 模板渲染 |
| `variable` | P1 | name, value | value | 变量设置 |
| `condition` | P1 | condition, input | true/false 分支 | 条件判断 |

**LLM 节点详细设计**:

```go
// LLM 节点配置
type LLMNodeConfig struct {
    Model        string  `json:"model"`        // gpt-4, claude-3, etc.
    SystemPrompt string  `json:"systemPrompt"` // 系统提示词
    UserPrompt   string  `json:"userPrompt"`   // 用户提示词，支持 {{变量}}
    Temperature  float64 `json:"temperature"`  // 0-2
    MaxTokens    int     `json:"maxTokens"`    // 最大输出 token
    Streaming    bool    `json:"streaming"`    // 是否流式输出
}

// LLM 节点输出
type LLMNodeOutput struct {
    Text         string `json:"text"`         // 生成的文本
    TokensUsed   int    `json:"tokensUsed"`   // 使用的 token 数
    Model        string `json:"model"`        // 实际使用的模型
    FinishReason string `json:"finishReason"` // 结束原因
}
```

**HTTP 节点详细设计**:

```go
// HTTP 节点配置
type HTTPNodeConfig struct {
    Method  string            `json:"method"`  // GET, POST, PUT, DELETE
    URL     string            `json:"url"`     // 支持 {{变量}}
    Headers map[string]string `json:"headers"` // 请求头
    Body    string            `json:"body"`    // 请求体，支持 {{变量}}
    Timeout int               `json:"timeout"` // 超时秒数
}

// HTTP 节点输出
type HTTPNodeOutput struct {
    StatusCode int               `json:"statusCode"`
    Headers    map[string]string `json:"headers"`
    Body       interface{}       `json:"body"` // 自动解析 JSON
    Duration   int64             `json:"duration"` // 请求耗时 ms
}
```

### 2.2 工作流管理 (P0)

#### REQ-201: 工作流 CRUD

**描述**: 实现工作流的创建、读取、更新、删除功能。

**功能点**:

| ID | 功能 | 方法 | 端点 | 说明 |
|----|------|------|------|------|
| REQ-201-1 | 创建工作流 | POST | /api/v1/workflows | 创建新工作流 |
| REQ-201-2 | 获取工作流列表 | GET | /api/v1/workflows | 分页获取用户工作流 |
| REQ-201-3 | 获取工作流详情 | GET | /api/v1/workflows/:id | 获取单个工作流 |
| REQ-201-4 | 更新工作流 | PUT | /api/v1/workflows/:id | 更新工作流定义 |
| REQ-201-5 | 删除工作流 | DELETE | /api/v1/workflows/:id | 软删除工作流 |
| REQ-201-6 | 复制工作流 | POST | /api/v1/workflows/:id/duplicate | 复制工作流 |

#### REQ-202: 工作流执行

**描述**: 实现工作流的执行和执行记录管理。

**功能点**:

| ID | 功能 | 方法 | 端点 | 说明 |
|----|------|------|------|------|
| REQ-202-1 | 执行工作流 | POST | /api/v1/workflows/:id/execute | 触发执行 |
| REQ-202-2 | 获取执行记录 | GET | /api/v1/executions | 获取执行历史 |
| REQ-202-3 | 获取执行详情 | GET | /api/v1/executions/:id | 执行详情和日志 |
| REQ-202-4 | 取消执行 | POST | /api/v1/executions/:id/cancel | 取消运行中的执行 |

### 2.3 实时日志推送 (P0)

#### REQ-301: WebSocket 实时通信

**描述**: 通过 WebSocket 实时推送执行状态和日志到前端。

**消息类型**:

```typescript
// WebSocket 消息类型
type WSMessageType = 
  | 'execution:started'      // 执行开始
  | 'execution:node_started' // 节点开始
  | 'execution:node_output'  // 节点输出 (流式)
  | 'execution:node_completed' // 节点完成
  | 'execution:node_failed'  // 节点失败
  | 'execution:completed'    // 执行完成
  | 'execution:failed'       // 执行失败
  | 'execution:log';         // 日志消息

// 消息格式
interface WSMessage {
  type: WSMessageType;
  executionId: string;
  payload: {
    nodeId?: string;
    nodeName?: string;
    status?: string;
    outputs?: Record<string, any>;
    error?: string;
    timestamp: string;
  };
}
```

**流程**:

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  前端    │     │  后端    │     │ 执行引擎 │
└────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │
     │ 1. 连接 WS     │                │
     │───────────────>│                │
     │                │                │
     │ 2. 订阅执行    │                │
     │───────────────>│                │
     │                │                │
     │                │ 3. 触发执行    │
     │                │───────────────>│
     │                │                │
     │                │ 4. 节点执行中  │
     │<───────────────│<───────────────│
     │ (推送日志)     │                │
     │                │                │
     │                │ 5. 执行完成    │
     │<───────────────│<───────────────│
     │ (推送结果)     │                │
     │                │                │
```

### 2.4 用户 API Key 管理 (P1)

#### REQ-401: API Key 管理

**描述**: 用户可以配置自己的 LLM API Key。

**功能点**:

| ID | 功能 | 说明 |
|----|------|------|
| REQ-401-1 | 添加 API Key | 支持 OpenAI, Claude, Azure 等 |
| REQ-401-2 | 加密存储 | AES-256 加密存储 |
| REQ-401-3 | Key 验证 | 添加时验证 Key 有效性 |
| REQ-401-4 | 删除 Key | 用户可删除已配置的 Key |

---

## 3. 技术需求

### 3.1 后端技术栈

```yaml
语言: Go 1.22+
框架: Gin / Echo
数据库: PostgreSQL 16
缓存: Redis 7
消息队列: Redis Streams (简化版) / BullMQ
WebSocket: gorilla/websocket
ORM: GORM
配置: Viper
日志: Zap
```

### 3.2 项目结构

```
apps/api/
├── cmd/
│   └── server/
│       └── main.go           # 入口
├── internal/
│   ├── config/              # 配置
│   ├── handler/             # HTTP 处理器
│   │   ├── workflow.go
│   │   ├── execution.go
│   │   └── websocket.go
│   ├── service/             # 业务逻辑
│   │   ├── workflow.go
│   │   ├── execution.go
│   │   └── executor/        # 执行引擎
│   │       ├── engine.go
│   │       ├── node.go
│   │       └── nodes/       # 节点实现
│   │           ├── start.go
│   │           ├── end.go
│   │           ├── llm.go
│   │           ├── http.go
│   │           └── template.go
│   ├── repository/          # 数据访问
│   │   ├── workflow.go
│   │   └── execution.go
│   ├── model/               # 数据模型
│   │   ├── workflow.go
│   │   ├── execution.go
│   │   └── user.go
│   └── middleware/          # 中间件
│       ├── auth.go
│       └── cors.go
├── pkg/                     # 公共包
│   ├── llm/                 # LLM 客户端
│   │   ├── client.go
│   │   ├── openai.go
│   │   └── claude.go
│   └── utils/
├── migrations/              # 数据库迁移
└── go.mod
```

### 3.3 性能要求

| 指标 | 要求 |
|------|------|
| API 响应时间 (P95) | < 200ms |
| 工作流启动延迟 | < 500ms |
| 单节点执行超时 | 默认 30s，可配置 |
| WebSocket 消息延迟 | < 500ms |
| 并发执行数 | 支持 100+ |

---

## 4. API 设计

### 4.1 工作流 API

#### 创建工作流

```http
POST /api/v1/workflows
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "我的工作流",
  "description": "获取天气并用 AI 总结",
  "definition": {
    "nodes": [
      {
        "id": "node_1",
        "type": "start",
        "position": { "x": 100, "y": 100 },
        "data": { "label": "开始" }
      },
      {
        "id": "node_2",
        "type": "http",
        "position": { "x": 300, "y": 100 },
        "data": {
          "label": "获取天气",
          "config": {
            "method": "GET",
            "url": "https://api.weather.com/v1/current?city=beijing"
          }
        }
      },
      {
        "id": "node_3",
        "type": "llm",
        "position": { "x": 500, "y": 100 },
        "data": {
          "label": "AI 总结",
          "config": {
            "model": "gpt-4",
            "userPrompt": "请用中文总结以下天气数据：{{node_2.output.body}}"
          }
        }
      },
      {
        "id": "node_4",
        "type": "end",
        "position": { "x": 700, "y": 100 },
        "data": { "label": "结束" }
      }
    ],
    "edges": [
      { "id": "edge_1", "source": "node_1", "target": "node_2" },
      { "id": "edge_2", "source": "node_2", "target": "node_3" },
      { "id": "edge_3", "source": "node_3", "target": "node_4" }
    ]
  }
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "id": "wf_abc123",
    "name": "我的工作流",
    "description": "获取天气并用 AI 总结",
    "status": "draft",
    "version": 1,
    "createdAt": "2026-01-29T10:00:00Z",
    "updatedAt": "2026-01-29T10:00:00Z"
  }
}
```

#### 执行工作流

```http
POST /api/v1/workflows/wf_abc123/execute
Authorization: Bearer <token>
Content-Type: application/json

{
  "inputs": {
    "city": "beijing"
  }
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "executionId": "exec_xyz789",
    "status": "pending",
    "startedAt": "2026-01-29T10:05:00Z"
  }
}
```

#### 获取执行详情

```http
GET /api/v1/executions/exec_xyz789
Authorization: Bearer <token>
```

**响应**:

```json
{
  "success": true,
  "data": {
    "id": "exec_xyz789",
    "workflowId": "wf_abc123",
    "status": "completed",
    "startedAt": "2026-01-29T10:05:00Z",
    "completedAt": "2026-01-29T10:05:15Z",
    "durationMs": 15000,
    "nodes": {
      "node_2": {
        "status": "completed",
        "startedAt": "2026-01-29T10:05:01Z",
        "completedAt": "2026-01-29T10:05:03Z",
        "outputs": {
          "statusCode": 200,
          "body": { "temperature": 15, "weather": "sunny" }
        }
      },
      "node_3": {
        "status": "completed",
        "startedAt": "2026-01-29T10:05:03Z",
        "completedAt": "2026-01-29T10:05:14Z",
        "outputs": {
          "text": "今天北京天气晴朗，气温15度，适合外出活动。"
        }
      }
    },
    "outputs": {
      "result": "今天北京天气晴朗，气温15度，适合外出活动。"
    }
  }
}
```

### 4.2 WebSocket API

#### 连接

```
ws://api.agentflow.app/ws?token=<jwt>
```

#### 订阅执行

```json
{
  "type": "subscribe",
  "executionId": "exec_xyz789"
}
```

#### 执行事件推送

```json
{
  "type": "execution:node_completed",
  "executionId": "exec_xyz789",
  "payload": {
    "nodeId": "node_2",
    "nodeName": "获取天气",
    "status": "completed",
    "outputs": {
      "statusCode": 200,
      "body": { "temperature": 15, "weather": "sunny" }
    },
    "durationMs": 2000,
    "timestamp": "2026-01-29T10:05:03Z"
  }
}
```

---

## 5. 数据模型

### 5.1 工作流表 (workflows)

```sql
CREATE TABLE workflows (
    id              VARCHAR(36) PRIMARY KEY,
    user_id         VARCHAR(36) NOT NULL,
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    icon            VARCHAR(50) DEFAULT 'workflow',
    
    -- 工作流定义 (JSON)
    definition      JSONB NOT NULL,
    
    -- 状态
    status          VARCHAR(20) DEFAULT 'draft', -- draft, active, archived
    
    -- 版本控制
    version         INTEGER DEFAULT 1,
    
    -- 统计
    run_count       INTEGER DEFAULT 0,
    
    -- 时间戳
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ,
    
    -- 索引
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_workflows_user ON workflows(user_id);
CREATE INDEX idx_workflows_status ON workflows(status);
```

### 5.2 执行记录表 (executions)

```sql
CREATE TABLE executions (
    id              VARCHAR(36) PRIMARY KEY,
    workflow_id     VARCHAR(36) NOT NULL,
    user_id         VARCHAR(36) NOT NULL,
    
    -- 执行状态
    status          VARCHAR(20) NOT NULL, -- pending, running, completed, failed, cancelled
    
    -- 触发信息
    trigger_type    VARCHAR(50) DEFAULT 'manual', -- manual, schedule, webhook
    
    -- 执行数据
    inputs          JSONB DEFAULT '{}',
    outputs         JSONB DEFAULT '{}',
    
    -- 节点执行详情
    node_states     JSONB DEFAULT '{}',
    
    -- 错误信息
    error_message   TEXT,
    error_node_id   VARCHAR(100),
    
    -- 时间
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    duration_ms     INTEGER,
    
    -- 资源消耗
    token_usage     JSONB DEFAULT '{}',
    
    -- 时间戳
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    
    -- 索引
    FOREIGN KEY (workflow_id) REFERENCES workflows(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_executions_workflow ON executions(workflow_id);
CREATE INDEX idx_executions_user ON executions(user_id);
CREATE INDEX idx_executions_status ON executions(status);
CREATE INDEX idx_executions_created ON executions(created_at DESC);
```

### 5.3 执行日志表 (execution_logs)

```sql
CREATE TABLE execution_logs (
    id              VARCHAR(36) PRIMARY KEY,
    execution_id    VARCHAR(36) NOT NULL,
    node_id         VARCHAR(100),
    
    -- 日志内容
    level           VARCHAR(10) NOT NULL, -- info, warn, error, debug
    message         TEXT NOT NULL,
    data            JSONB,
    
    -- 时间戳
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    
    FOREIGN KEY (execution_id) REFERENCES executions(id)
);

CREATE INDEX idx_execution_logs_execution ON execution_logs(execution_id);
CREATE INDEX idx_execution_logs_created ON execution_logs(created_at);
```

### 5.4 API Keys 表 (api_keys)

```sql
CREATE TABLE api_keys (
    id              VARCHAR(36) PRIMARY KEY,
    user_id         VARCHAR(36) NOT NULL,
    
    -- Key 信息
    provider        VARCHAR(50) NOT NULL, -- openai, anthropic, azure
    name            VARCHAR(100),
    key_encrypted   TEXT NOT NULL, -- AES-256 加密
    key_hint        VARCHAR(20), -- 显示后几位
    
    -- 状态
    is_valid        BOOLEAN DEFAULT TRUE,
    last_used_at    TIMESTAMPTZ,
    
    -- 时间戳
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_api_keys_user ON api_keys(user_id);
```

---

## 6. 验收标准

### 6.1 功能验收

| 验收项 | 验收标准 | 测试方法 |
|--------|----------|----------|
| 创建工作流 | 能创建包含 4+ 节点的工作流 | 手动测试 |
| 保存工作流 | 保存后刷新页面数据不丢失 | 手动测试 |
| 执行工作流 | 点击运行后能看到执行过程 | 手动测试 |
| LLM 节点 | 能调用 OpenAI API 并返回结果 | 集成测试 |
| HTTP 节点 | 能发送请求并获取响应 | 集成测试 |
| 实时日志 | 执行过程中能看到实时日志 | 手动测试 |
| 错误处理 | 节点失败时显示错误信息 | 手动测试 |

### 6.2 性能验收

| 验收项 | 验收标准 |
|--------|----------|
| 工作流保存 | < 1s |
| 执行启动 | < 500ms |
| WebSocket 延迟 | < 500ms |
| 10 并发执行 | 系统稳定 |

### 6.3 用户验收

- [ ] 10 个内测用户成功创建并运行工作流
- [ ] 用户无需查看文档即可完成基本操作
- [ ] 用户反馈满意度 > 70%

---

## 7. 开发任务分解

### 7.1 Week 1-2: 基础架构

| 任务 | 负责人 | 预估 | 状态 |
|------|--------|------|------|
| 搭建 Go 项目结构 | - | 2d | ⬜ |
| 配置数据库和迁移 | - | 1d | ⬜ |
| 实现基础 CRUD API | - | 2d | ⬜ |
| 集成现有用户认证 | - | 1d | ⬜ |
| WebSocket 基础实现 | - | 2d | ⬜ |

### 7.2 Week 3-4: 执行引擎

| 任务 | 负责人 | 预估 | 状态 |
|------|--------|------|------|
| 执行引擎核心逻辑 | - | 3d | ⬜ |
| Start/End 节点实现 | - | 1d | ⬜ |
| HTTP 节点实现 | - | 2d | ⬜ |
| LLM 节点实现 | - | 3d | ⬜ |
| Template 节点实现 | - | 1d | ⬜ |

### 7.3 Week 5-6: 集成和测试

| 任务 | 负责人 | 预估 | 状态 |
|------|--------|------|------|
| 前后端联调 | - | 3d | ⬜ |
| WebSocket 日志推送 | - | 2d | ⬜ |
| API Key 管理 | - | 2d | ⬜ |
| 集成测试 | - | 2d | ⬜ |
| Bug 修复和优化 | - | 3d | ⬜ |
| 内测发布 | - | 1d | ⬜ |

### 7.4 依赖关系

```
Week 1-2                Week 3-4                Week 5-6
┌─────────┐            ┌─────────┐            ┌─────────┐
│ 项目结构 │──────────>│ 执行引擎 │──────────>│ 前后端  │
└─────────┘            └─────────┘            │ 联调    │
                                              └─────────┘
┌─────────┐            ┌─────────┐                 │
│ 数据库  │──────────>│ 节点实现 │─────────────────┘
└─────────┘            └─────────┘
                            │
┌─────────┐                 │
│ WebSocket│────────────────┘
└─────────┘
```

---

## 附录

### A. 变量引用语法

工作流中支持使用 `{{}}` 语法引用上游节点的输出:

```
{{node_id.output}}           // 节点输出
{{node_id.output.body}}      // 嵌套属性
{{node_id.output.data[0]}}   // 数组索引
{{inputs.city}}              // 工作流输入
```

### B. 错误码定义

| 错误码 | 说明 |
|--------|------|
| WORKFLOW_NOT_FOUND | 工作流不存在 |
| EXECUTION_NOT_FOUND | 执行记录不存在 |
| INVALID_WORKFLOW_DEFINITION | 工作流定义无效 |
| NODE_EXECUTION_FAILED | 节点执行失败 |
| LLM_API_ERROR | LLM API 调用失败 |
| HTTP_REQUEST_FAILED | HTTP 请求失败 |
| TIMEOUT | 执行超时 |

### C. 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1.0 | 2026-01-29 | 初始版本 | - |
