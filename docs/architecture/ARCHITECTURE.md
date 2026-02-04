# AgentFlow 技术架构文档

> **版本**: v1.0  
> **更新日期**: 2026-01-29  
> **文档状态**: 活跃维护

---

## 目录

1. [架构概述](#1-架构概述)
2. [系统架构](#2-系统架构)
3. [前端架构](#3-前端架构)
4. [后端架构](#4-后端架构)
5. [桌面端架构](#5-桌面端架构)
6. [数据架构](#6-数据架构)
7. [执行引擎](#7-执行引擎)
8. [部署架构](#8-部署架构)
9. [安全架构](#9-安全架构)
10. [性能优化](#10-性能优化)

---

## 1. 架构概述

### 1.1 设计原则

| 原则 | 描述 |
|------|------|
| **本地优先** | 核心功能可完全本地运行，云端为可选增强 |
| **模块化** | 各模块低耦合，可独立部署和扩展 |
| **可扩展** | 支持自定义节点、插件扩展 |
| **高性能** | 低延迟、高并发、资源高效利用 |
| **安全性** | 数据加密、权限控制、审计日志 |

### 1.2 技术栈总览

```
┌─────────────────────────────────────────────────────────────────┐
│                        AgentFlow 技术栈                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  前端 (Web)                                                      │
│  ├── Framework: Next.js 14 (App Router)                         │
│  ├── Language: TypeScript 5.x                                   │
│  ├── UI: React 18 + Tailwind CSS + Radix UI                    │
│  ├── State: Zustand + React Query                               │
│  ├── Canvas: React Flow                                         │
│  └── Build: Turbo (Monorepo)                                    │
│                                                                 │
│  后端 (API)                                                      │
│  ├── Language: Go 1.22+                                         │
│  ├── Framework: Gin / Echo                                      │
│  ├── Database: PostgreSQL 16 + Redis 7                          │
│  ├── ORM: GORM                                                  │
│  └── Queue: Redis Streams / BullMQ                              │
│                                                                 │
│  桌面端 (Desktop)                                                │
│  ├── Framework: Tauri 2.0                                       │
│  ├── Backend: Rust                                              │
│  ├── Database: SQLite                                           │
│  └── LLM: Ollama                                                │
│                                                                 │
│  基础设施                                                        │
│  ├── Container: Docker                                          │
│  ├── Orchestration: Docker Compose / Kubernetes                 │
│  ├── CI/CD: GitHub Actions                                      │
│  └── Monitoring: Prometheus + Grafana                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 系统架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              客户端层                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │  Web App    │  │ Desktop App │  │ Mobile App  │  │    CLI      │   │
│  │  (Next.js)  │  │  (Tauri)    │  │  (Future)   │  │  (Future)   │   │
│  └──────┬──────┘  └──────┬──────┘  └─────────────┘  └─────────────┘   │
└─────────┼────────────────┼──────────────────────────────────────────────┘
          │                │
          │    ┌───────────┴───────────┐
          │    │    Local Execution    │ (桌面端本地执行)
          │    │    ┌─────────────┐    │
          │    │    │   SQLite    │    │
          │    │    │   Ollama    │    │
          │    │    └─────────────┘    │
          │    └───────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            API Gateway                                   │
│                    (认证 / 限流 / 路由 / 负载均衡)                        │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
┌───────────────────────────────┴─────────────────────────────────────────┐
│                              服务层                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │ User        │  │ Workflow    │  │ Execution   │  │ Agent       │   │
│  │ Service     │  │ Service     │  │ Service     │  │ Service     │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │ AI Gateway  │  │ Plugin      │  │ Notification│  │ Analytics   │   │
│  │ Service     │  │ Service     │  │ Service     │  │ Service     │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
┌───────────────────────────────┴─────────────────────────────────────────┐
│                              数据层                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │ PostgreSQL  │  │   Redis     │  │ ClickHouse  │  │     S3      │   │
│  │ (主数据库)  │  │ (缓存/队列) │  │ (分析日志)  │  │ (文件存储)  │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 本地/云端双模式

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         部署模式选择                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   模式A: 纯本地                     模式B: 云端                          │
│   ┌─────────────────────┐          ┌─────────────────────┐             │
│   │   Desktop App       │          │    Web App          │             │
│   │   ┌─────────────┐   │          │    ┌─────────────┐  │             │
│   │   │ 本地执行引擎 │   │          │    │ 云端服务    │  │             │
│   │   │ SQLite      │   │          │    │ PostgreSQL  │  │             │
│   │   │ Ollama      │   │          │    │ 多模型 API  │  │             │
│   │   └─────────────┘   │          │    └─────────────┘  │             │
│   │   数据完全本地      │          │    多设备同步       │             │
│   └─────────────────────┘          └─────────────────────┘             │
│                                                                         │
│   模式C: 混合模式（推荐）                                                │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                                                                 │  │
│   │   本地执行 ←───── 智能切换 ─────→ 云端执行                      │  │
│   │      ↓                              ↓                           │  │
│   │   敏感数据处理                    高性能计算                    │  │
│   │   离线可用                        模型丰富                      │  │
│   │                                                                 │  │
│   │              ↑         同步层         ↓                         │  │
│   │   ┌─────────────────────────────────────────────┐              │  │
│   │   │  • 配置同步（E2E 加密）                      │              │  │
│   │   │  • 工作流同步                                │              │  │
│   │   │  • 执行记录同步（可选）                      │              │  │
│   │   └─────────────────────────────────────────────┘              │  │
│   │                                                                 │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 前端架构

### 3.1 项目结构

```
apps/web/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/              # 认证相关页面
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/         # 仪表盘布局
│   │   │   ├── workflows/       # 工作流列表
│   │   │   ├── agents/          # Agent 商店
│   │   │   └── settings/        # 设置
│   │   ├── editor/              # 编辑器
│   │   │   └── [id]/
│   │   ├── api/                 # API Routes
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/              # 组件
│   │   ├── ui/                  # 基础 UI 组件
│   │   ├── editor/              # 编辑器组件
│   │   │   ├── nodes/           # 节点组件
│   │   │   ├── edges/           # 边组件
│   │   │   ├── panels/          # 面板组件
│   │   │   └── ...
│   │   ├── dashboard/           # 仪表盘组件
│   │   └── shared/              # 共享组件
│   │
│   ├── hooks/                   # 自定义 Hooks
│   │   ├── useWorkflow.ts
│   │   ├── useExecution.ts
│   │   └── ...
│   │
│   ├── stores/                  # Zustand Stores
│   │   ├── useWorkflowStore.ts
│   │   ├── useAuthStore.ts
│   │   └── useExecutionStore.ts
│   │
│   ├── lib/                     # 工具库
│   │   ├── api/                 # API 客户端
│   │   ├── utils/               # 工具函数
│   │   └── constants/           # 常量
│   │
│   ├── types/                   # TypeScript 类型
│   │   ├── workflow.ts
│   │   ├── node.ts
│   │   └── ...
│   │
│   └── styles/                  # 样式
│       └── globals.css
│
├── public/                      # 静态资源
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

### 3.2 状态管理

```typescript
// stores/useWorkflowStore.ts

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface WorkflowState {
  // 数据
  workflow: Workflow | null;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodeIds: string[];
  
  // 状态
  isDirty: boolean;
  isExecuting: boolean;
  executionId: string | null;
  
  // 历史记录
  history: HistoryEntry[];
  historyIndex: number;
  
  // Actions
  setWorkflow: (workflow: Workflow) => void;
  setNodes: (nodes: WorkflowNode[]) => void;
  setEdges: (edges: WorkflowEdge[]) => void;
  addNode: (node: WorkflowNode) => void;
  updateNode: (id: string, data: Partial<WorkflowNode['data']>) => void;
  removeNodes: (ids: string[]) => void;
  addEdge: (edge: WorkflowEdge) => void;
  removeEdge: (id: string) => void;
  
  // 选择
  selectNode: (id: string, multi?: boolean) => void;
  clearSelection: () => void;
  
  // 历史
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  // 剪贴板
  copySelectedNodes: () => void;
  pasteNodes: () => void;
  duplicateSelectedNodes: () => void;
}

export const useWorkflowStore = create<WorkflowState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // 初始状态
        workflow: null,
        nodes: [],
        edges: [],
        selectedNodeIds: [],
        isDirty: false,
        isExecuting: false,
        executionId: null,
        history: [],
        historyIndex: -1,
        
        // Actions 实现...
      })),
      {
        name: 'workflow-storage',
        partialize: (state) => ({
          // 只持久化部分状态
          workflow: state.workflow,
        }),
      }
    )
  )
);
```

### 3.3 组件设计模式

```typescript
// 复合组件模式
<Editor>
  <Editor.Toolbar />
  <Editor.Sidebar>
    <NodePanel />
  </Editor.Sidebar>
  <Editor.Canvas />
  <Editor.ConfigPanel />
  <Editor.ExecutionPanel />
</Editor>

// 节点组件抽象
interface NodeProps<T = unknown> {
  id: string;
  data: NodeData<T>;
  selected: boolean;
  isExecuting?: boolean;
}

// 基础节点
function BaseNode<T>({ 
  id, 
  data, 
  selected,
  children,
  inputs,
  outputs,
}: NodeProps<T> & {
  children?: React.ReactNode;
  inputs?: PortDefinition[];
  outputs?: PortDefinition[];
}) {
  return (
    <div className={cn(
      "node-container",
      selected && "node-selected",
    )}>
      <NodeHeader icon={data.icon} label={data.label} />
      <NodeBody>{children}</NodeBody>
      <NodePorts inputs={inputs} outputs={outputs} />
    </div>
  );
}
```

### 3.4 性能优化策略

| 策略 | 实现方式 |
|------|----------|
| 代码分割 | 动态导入编辑器组件 |
| 虚拟化 | 节点面板使用虚拟列表 |
| 记忆化 | useMemo/useCallback 优化渲染 |
| 懒加载 | 图片和非关键资源懒加载 |
| 防抖节流 | 搜索、保存等操作防抖 |

---

## 4. 后端架构

### 4.1 项目结构

```
apps/api/
├── cmd/
│   └── server/
│       └── main.go              # 入口
│
├── internal/
│   ├── config/                  # 配置管理
│   │   ├── config.go
│   │   └── config.yaml
│   │
│   ├── handler/                 # HTTP 处理器
│   │   ├── workflow.go
│   │   ├── execution.go
│   │   ├── agent.go
│   │   ├── user.go
│   │   └── websocket.go
│   │
│   ├── service/                 # 业务逻辑
│   │   ├── workflow/
│   │   │   ├── service.go
│   │   │   └── validator.go
│   │   ├── execution/
│   │   │   ├── service.go
│   │   │   └── scheduler.go
│   │   └── agent/
│   │       └── service.go
│   │
│   ├── executor/                # 执行引擎
│   │   ├── engine.go
│   │   ├── context.go
│   │   ├── node.go
│   │   └── nodes/
│   │       ├── start.go
│   │       ├── end.go
│   │       ├── llm.go
│   │       ├── http.go
│   │       ├── condition.go
│   │       ├── loop.go
│   │       └── ...
│   │
│   ├── repository/              # 数据访问
│   │   ├── workflow.go
│   │   ├── execution.go
│   │   └── agent.go
│   │
│   ├── model/                   # 数据模型
│   │   ├── workflow.go
│   │   ├── execution.go
│   │   ├── agent.go
│   │   └── user.go
│   │
│   ├── middleware/              # 中间件
│   │   ├── auth.go
│   │   ├── cors.go
│   │   ├── ratelimit.go
│   │   └── logger.go
│   │
│   └── websocket/               # WebSocket
│       ├── hub.go
│       ├── client.go
│       └── message.go
│
├── pkg/                         # 公共包
│   ├── llm/                     # LLM 客户端
│   │   ├── client.go
│   │   ├── openai.go
│   │   ├── claude.go
│   │   └── ollama.go
│   ├── crypto/                  # 加密工具
│   ├── validator/               # 验证器
│   └── utils/                   # 工具函数
│
├── migrations/                  # 数据库迁移
│   ├── 001_init.sql
│   ├── 002_workflows.sql
│   └── ...
│
├── scripts/                     # 脚本
├── Dockerfile
├── docker-compose.yml
├── Makefile
└── go.mod
```

### 4.2 分层架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        Handler Layer                             │
│                     (HTTP/WebSocket 处理)                        │
├─────────────────────────────────────────────────────────────────┤
│                        Service Layer                             │
│                      (业务逻辑/编排)                              │
├─────────────────────────────────────────────────────────────────┤
│                       Repository Layer                           │
│                        (数据访问)                                │
├─────────────────────────────────────────────────────────────────┤
│                        Model Layer                               │
│                       (数据模型)                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 依赖注入

```go
// internal/wire.go

//go:build wireinject

package internal

import (
    "github.com/google/wire"
    "agentflow/internal/config"
    "agentflow/internal/handler"
    "agentflow/internal/service"
    "agentflow/internal/repository"
)

func InitializeApp(cfg *config.Config) (*App, error) {
    wire.Build(
        // 基础设施
        NewDB,
        NewRedis,
        
        // Repository
        repository.NewWorkflowRepository,
        repository.NewExecutionRepository,
        repository.NewAgentRepository,
        
        // Service
        service.NewWorkflowService,
        service.NewExecutionService,
        service.NewAgentService,
        
        // Handler
        handler.NewWorkflowHandler,
        handler.NewExecutionHandler,
        handler.NewAgentHandler,
        
        // App
        NewApp,
    )
    return nil, nil
}
```

### 4.4 错误处理

```go
// pkg/errors/errors.go

package errors

type AppError struct {
    Code    string `json:"code"`
    Message string `json:"message"`
    Details any    `json:"details,omitempty"`
    Err     error  `json:"-"`
}

func (e *AppError) Error() string {
    return e.Message
}

// 预定义错误
var (
    ErrNotFound = &AppError{
        Code:    "NOT_FOUND",
        Message: "资源不存在",
    }
    
    ErrUnauthorized = &AppError{
        Code:    "UNAUTHORIZED",
        Message: "未授权",
    }
    
    ErrValidation = &AppError{
        Code:    "VALIDATION_ERROR",
        Message: "验证失败",
    }
    
    ErrExecutionFailed = &AppError{
        Code:    "EXECUTION_FAILED",
        Message: "执行失败",
    }
)

// 创建新错误
func New(code, message string) *AppError {
    return &AppError{
        Code:    code,
        Message: message,
    }
}

func (e *AppError) WithDetails(details any) *AppError {
    e.Details = details
    return e
}

func (e *AppError) Wrap(err error) *AppError {
    e.Err = err
    return e
}
```

---

## 5. 桌面端架构

### 5.1 Tauri 架构

```
apps/desktop/
├── src/                         # 前端代码 (复用 web)
│   └── ...
│
├── src-tauri/                   # Tauri 后端
│   ├── src/
│   │   ├── main.rs             # 入口
│   │   ├── commands/           # 命令处理
│   │   │   ├── mod.rs
│   │   │   ├── workflow.rs
│   │   │   ├── execution.rs
│   │   │   └── settings.rs
│   │   ├── executor/           # 本地执行引擎
│   │   │   ├── mod.rs
│   │   │   ├── engine.rs
│   │   │   └── nodes/
│   │   ├── db/                 # SQLite
│   │   │   ├── mod.rs
│   │   │   └── migrations/
│   │   ├── ollama/             # Ollama 客户端
│   │   │   ├── mod.rs
│   │   │   └── client.rs
│   │   └── sync/               # 云端同步
│   │       ├── mod.rs
│   │       └── client.rs
│   │
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── build.rs
│
├── package.json
└── vite.config.ts
```

### 5.2 IPC 通信

```rust
// src-tauri/src/commands/workflow.rs

use tauri::State;
use crate::db::Database;
use crate::executor::Engine;

#[tauri::command]
pub async fn get_workflows(
    db: State<'_, Database>,
) -> Result<Vec<Workflow>, String> {
    db.get_workflows()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn execute_workflow(
    workflow_id: String,
    inputs: serde_json::Value,
    db: State<'_, Database>,
    engine: State<'_, Engine>,
    app_handle: tauri::AppHandle,
) -> Result<ExecutionResult, String> {
    // 获取工作流
    let workflow = db.get_workflow(&workflow_id)
        .await
        .map_err(|e| e.to_string())?;
    
    // 执行
    let result = engine.execute(
        workflow,
        inputs,
        |event| {
            // 发送执行事件到前端
            app_handle.emit_all("execution-event", event).ok();
        },
    ).await.map_err(|e| e.to_string())?;
    
    // 保存执行记录
    db.save_execution(&result)
        .await
        .map_err(|e| e.to_string())?;
    
    Ok(result)
}

#[tauri::command]
pub async fn check_ollama_status() -> Result<OllamaStatus, String> {
    let client = ollama::Client::new("http://localhost:11434");
    
    match client.health().await {
        Ok(_) => {
            let models = client.list_models().await.unwrap_or_default();
            Ok(OllamaStatus {
                running: true,
                models,
            })
        }
        Err(_) => Ok(OllamaStatus {
            running: false,
            models: vec![],
        }),
    }
}
```

### 5.3 前端调用

```typescript
// lib/tauri.ts

import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';

// 工作流操作
export const tauriApi = {
  // 获取工作流列表
  async getWorkflows(): Promise<Workflow[]> {
    return invoke('get_workflows');
  },
  
  // 执行工作流
  async executeWorkflow(
    workflowId: string,
    inputs: Record<string, any>,
    onEvent: (event: ExecutionEvent) => void,
  ): Promise<ExecutionResult> {
    // 监听执行事件
    const unlisten = await listen('execution-event', (event) => {
      onEvent(event.payload as ExecutionEvent);
    });
    
    try {
      const result = await invoke('execute_workflow', {
        workflowId,
        inputs,
      });
      return result as ExecutionResult;
    } finally {
      unlisten();
    }
  },
  
  // 检查 Ollama 状态
  async checkOllamaStatus(): Promise<OllamaStatus> {
    return invoke('check_ollama_status');
  },
  
  // 获取本地模型列表
  async getLocalModels(): Promise<Model[]> {
    return invoke('list_local_models');
  },
};

// 判断是否在 Tauri 环境
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}
```

---

## 6. 数据架构

### 6.1 数据库设计

#### 主要表结构

```sql
-- 用户表
CREATE TABLE users (
    id              VARCHAR(36) PRIMARY KEY,
    email           VARCHAR(255) UNIQUE NOT NULL,
    username        VARCHAR(50) UNIQUE NOT NULL,
    password_hash   VARCHAR(255),
    display_name    VARCHAR(100),
    avatar_url      VARCHAR(500),
    bio             TEXT,
    
    -- 状态
    status          VARCHAR(20) DEFAULT 'active',
    email_verified  BOOLEAN DEFAULT FALSE,
    
    -- 订阅
    plan            VARCHAR(20) DEFAULT 'free',
    plan_expires_at TIMESTAMPTZ,
    
    -- 统计
    workflow_count  INTEGER DEFAULT 0,
    agent_count     INTEGER DEFAULT 0,
    
    -- 设置
    settings        JSONB DEFAULT '{}',
    
    -- 时间戳
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    last_login_at   TIMESTAMPTZ
);

-- 工作流表
CREATE TABLE workflows (
    id              VARCHAR(36) PRIMARY KEY,
    user_id         VARCHAR(36) NOT NULL REFERENCES users(id),
    
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    icon            VARCHAR(50) DEFAULT 'workflow',
    
    definition      JSONB NOT NULL,
    variables       JSONB DEFAULT '{}',
    
    status          VARCHAR(20) DEFAULT 'draft',
    visibility      VARCHAR(20) DEFAULT 'private',
    
    version         INTEGER DEFAULT 1,
    run_count       INTEGER DEFAULT 0,
    
    folder_id       VARCHAR(36),
    
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

-- 执行记录表
CREATE TABLE executions (
    id              VARCHAR(36) PRIMARY KEY,
    workflow_id     VARCHAR(36) NOT NULL REFERENCES workflows(id),
    user_id         VARCHAR(36) NOT NULL REFERENCES users(id),
    
    status          VARCHAR(20) NOT NULL,
    trigger_type    VARCHAR(50) DEFAULT 'manual',
    
    inputs          JSONB DEFAULT '{}',
    outputs         JSONB DEFAULT '{}',
    node_states     JSONB DEFAULT '{}',
    
    error_message   TEXT,
    error_node_id   VARCHAR(100),
    
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    duration_ms     INTEGER,
    
    token_usage     JSONB DEFAULT '{}',
    
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Agent 表
CREATE TABLE agents (
    id              VARCHAR(36) PRIMARY KEY,
    user_id         VARCHAR(36) NOT NULL REFERENCES users(id),
    workflow_id     VARCHAR(36) NOT NULL REFERENCES workflows(id),
    
    name            VARCHAR(200) NOT NULL,
    slug            VARCHAR(100) UNIQUE NOT NULL,
    description     TEXT,
    icon            VARCHAR(500),
    
    category        VARCHAR(50),
    tags            JSONB DEFAULT '[]',
    
    status          VARCHAR(20) DEFAULT 'draft',
    pricing_type    VARCHAR(20) DEFAULT 'free',
    price           DECIMAL(10, 2),
    
    use_count       INTEGER DEFAULT 0,
    star_count      INTEGER DEFAULT 0,
    avg_rating      DECIMAL(3, 2) DEFAULT 0,
    
    version         VARCHAR(20) DEFAULT '1.0.0',
    
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    published_at    TIMESTAMPTZ
);

-- 索引
CREATE INDEX idx_workflows_user ON workflows(user_id);
CREATE INDEX idx_workflows_status ON workflows(status);
CREATE INDEX idx_executions_workflow ON executions(workflow_id);
CREATE INDEX idx_executions_user ON executions(user_id);
CREATE INDEX idx_executions_status ON executions(status);
CREATE INDEX idx_executions_created ON executions(created_at DESC);
CREATE INDEX idx_agents_user ON agents(user_id);
CREATE INDEX idx_agents_category ON agents(category);
CREATE INDEX idx_agents_status ON agents(status);
```

### 6.2 工作流定义结构

```typescript
interface WorkflowDefinition {
  version: string;  // "1.0.0"
  
  nodes: {
    id: string;
    type: string;
    position: { x: number; y: number };
    data: {
      label: string;
      description?: string;
      config: Record<string, any>;
      inputs?: PortDefinition[];
      outputs?: PortDefinition[];
    };
  }[];
  
  edges: {
    id: string;
    source: string;
    sourceHandle: string;
    target: string;
    targetHandle: string;
    label?: string;
    data?: Record<string, any>;
  }[];
  
  settings: {
    timeout: number;
    retryPolicy: {
      maxRetries: number;
      backoffMs: number;
    };
    errorHandling: 'stop' | 'continue' | 'fallback';
  };
}
```

### 6.3 缓存策略

| 数据类型 | 缓存位置 | TTL | 说明 |
|----------|----------|-----|------|
| 用户信息 | Redis | 1h | 频繁访问 |
| 工作流定义 | Redis | 5m | 编辑时更新 |
| 执行状态 | Redis | 实时 | 执行完成后清理 |
| Agent 列表 | Redis | 10m | 商店首页 |
| 模板列表 | Redis | 1h | 变化较少 |

---

## 7. 执行引擎

### 7.1 执行流程

```
┌─────────────────────────────────────────────────────────────────┐
│                        执行引擎流程                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 接收执行请求                                                 │
│     ├── 验证工作流定义                                           │
│     └── 创建执行上下文                                           │
│                                                                 │
│  2. 解析工作流                                                   │
│     ├── 构建节点图                                               │
│     └── 拓扑排序                                                 │
│                                                                 │
│  3. 执行循环                                                     │
│     ┌──────────────────────────────────────────────────────┐   │
│     │  for each node in sorted_nodes:                       │   │
│     │    ├── 检查前置条件                                    │   │
│     │    ├── 获取输入数据（从上游节点输出）                   │   │
│     │    ├── 解析变量引用                                    │   │
│     │    ├── 执行节点逻辑                                    │   │
│     │    │   ├── 成功 → 保存输出，继续                       │   │
│     │    │   └── 失败 → 错误处理                             │   │
│     │    ├── 保存节点状态                                    │   │
│     │    └── 发送执行事件（WebSocket）                        │   │
│     └──────────────────────────────────────────────────────┘   │
│                                                                 │
│  4. 完成处理                                                     │
│     ├── 收集最终输出                                             │
│     ├── 更新执行记录                                             │
│     └── 发送完成事件                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 执行上下文

```go
// internal/executor/context.go

type ExecutionContext struct {
    // 执行信息
    ExecutionID  string
    WorkflowID   string
    UserID       string
    
    // 数据存储
    Variables    map[string]interface{}  // 全局变量
    NodeOutputs  map[string]interface{}  // 节点输出
    
    // 服务依赖
    LLMClient    llm.Client
    HTTPClient   *http.Client
    Cache        cache.Cache
    
    // 用户配置
    APIKeys      map[string]string
    Settings     map[string]interface{}
    
    // 事件回调
    OnNodeStart  func(nodeID string)
    OnNodeOutput func(nodeID string, output interface{})
    OnNodeEnd    func(nodeID string, err error)
    OnLog        func(level, message string)
    
    // 控制
    Context      context.Context
    Cancel       context.CancelFunc
    Timeout      time.Duration
}

// 获取变量值
func (ctx *ExecutionContext) GetVariable(path string) (interface{}, error) {
    // 支持 {{node_id.output.field}} 格式
    parts := strings.Split(path, ".")
    
    if len(parts) < 2 {
        return ctx.Variables[path], nil
    }
    
    nodeID := parts[0]
    output, ok := ctx.NodeOutputs[nodeID]
    if !ok {
        return nil, fmt.Errorf("node output not found: %s", nodeID)
    }
    
    // 解析嵌套路径
    return getNestedValue(output, parts[1:])
}

// 解析模板字符串中的变量
func (ctx *ExecutionContext) ResolveTemplate(template string) (string, error) {
    re := regexp.MustCompile(`\{\{([^}]+)\}\}`)
    
    result := re.ReplaceAllStringFunc(template, func(match string) string {
        path := strings.Trim(match, "{}")
        path = strings.TrimSpace(path)
        
        value, err := ctx.GetVariable(path)
        if err != nil {
            return match // 保留原始文本
        }
        
        return fmt.Sprintf("%v", value)
    })
    
    return result, nil
}
```

### 7.3 节点执行器接口

```go
// internal/executor/node.go

type NodeExecutor interface {
    // 获取节点类型
    Type() string
    
    // 执行节点
    Execute(ctx *ExecutionContext, node *WorkflowNode) (*NodeResult, error)
    
    // 验证配置
    Validate(config map[string]interface{}) error
}

type NodeResult struct {
    Outputs  map[string]interface{}
    Metadata map[string]interface{}
}

// 注册节点执行器
var nodeExecutors = map[string]NodeExecutor{}

func RegisterNodeExecutor(executor NodeExecutor) {
    nodeExecutors[executor.Type()] = executor
}

func GetNodeExecutor(nodeType string) (NodeExecutor, error) {
    executor, ok := nodeExecutors[nodeType]
    if !ok {
        return nil, fmt.Errorf("unknown node type: %s", nodeType)
    }
    return executor, nil
}
```

### 7.4 LLM 节点实现

```go
// internal/executor/nodes/llm.go

type LLMNodeExecutor struct{}

func (e *LLMNodeExecutor) Type() string {
    return "llm"
}

func (e *LLMNodeExecutor) Execute(ctx *ExecutionContext, node *WorkflowNode) (*NodeResult, error) {
    config := node.Data.Config
    
    // 获取配置
    model := getStringConfig(config, "model", "gpt-4")
    systemPrompt := getStringConfig(config, "systemPrompt", "")
    userPrompt := getStringConfig(config, "userPrompt", "")
    temperature := getFloatConfig(config, "temperature", 0.7)
    maxTokens := getIntConfig(config, "maxTokens", 2048)
    
    // 解析变量
    resolvedPrompt, err := ctx.ResolveTemplate(userPrompt)
    if err != nil {
        return nil, fmt.Errorf("failed to resolve prompt: %w", err)
    }
    
    // 调用 LLM
    response, err := ctx.LLMClient.Chat(ctx.Context, &llm.ChatRequest{
        Model: model,
        Messages: []llm.Message{
            {Role: "system", Content: systemPrompt},
            {Role: "user", Content: resolvedPrompt},
        },
        Temperature: temperature,
        MaxTokens:   maxTokens,
    })
    if err != nil {
        return nil, fmt.Errorf("LLM call failed: %w", err)
    }
    
    // 记录日志
    ctx.OnLog("info", fmt.Sprintf("LLM response: %d tokens", response.Usage.TotalTokens))
    
    return &NodeResult{
        Outputs: map[string]interface{}{
            "text": response.Content,
        },
        Metadata: map[string]interface{}{
            "model":        response.Model,
            "tokensUsed":   response.Usage.TotalTokens,
            "finishReason": response.FinishReason,
        },
    }, nil
}

func (e *LLMNodeExecutor) Validate(config map[string]interface{}) error {
    if _, ok := config["userPrompt"]; !ok {
        return errors.New("userPrompt is required")
    }
    return nil
}

func init() {
    RegisterNodeExecutor(&LLMNodeExecutor{})
}
```

---

## 8. 部署架构

### 8.1 Docker Compose (开发/小规模)

```yaml
# docker-compose.yml

version: '3.8'

services:
  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    ports:
      - "3000:3000"
    environment:
      - API_URL=http://api:8080
    depends_on:
      - api
    
  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=postgres://postgres:password@db:5432/agentflow
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    
  db:
    image: postgres:16
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=agentflow
      - POSTGRES_PASSWORD=password
    
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### 8.2 Kubernetes (生产)

```yaml
# k8s/deployment.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: agentflow-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: agentflow-api
  template:
    metadata:
      labels:
        app: agentflow-api
    spec:
      containers:
      - name: api
        image: agentflow/api:latest
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: agentflow-secrets
              key: database-url
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: agentflow-api
spec:
  selector:
    app: agentflow-api
  ports:
  - port: 80
    targetPort: 8080
  type: ClusterIP
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: agentflow-api
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: agentflow-api
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### 8.3 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml

name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: '1.22'
      
      - name: Run tests
        run: make test
  
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build Docker images
        run: |
          docker build -t agentflow/api:${{ github.sha }} -f apps/api/Dockerfile .
          docker build -t agentflow/web:${{ github.sha }} -f apps/web/Dockerfile .
      
      - name: Push to registry
        run: |
          docker push agentflow/api:${{ github.sha }}
          docker push agentflow/web:${{ github.sha }}
  
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/agentflow-api api=agentflow/api:${{ github.sha }}
          kubectl set image deployment/agentflow-web web=agentflow/web:${{ github.sha }}
          kubectl rollout status deployment/agentflow-api
          kubectl rollout status deployment/agentflow-web
```

---

## 9. 安全架构

### 9.1 安全层次

```
┌─────────────────────────────────────────────────────────────────┐
│                         安全架构                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  应用层安全                                                      │
│  ├── 身份认证 (JWT + Refresh Token)                             │
│  ├── 授权 (RBAC)                                                │
│  ├── 输入验证                                                    │
│  ├── XSS/CSRF 防护                                              │
│  └── 速率限制                                                    │
│                                                                 │
│  数据层安全                                                      │
│  ├── 传输加密 (TLS 1.3)                                         │
│  ├── 存储加密 (AES-256)                                         │
│  ├── API Key 加密存储                                           │
│  └── 敏感数据脱敏                                                │
│                                                                 │
│  执行层安全                                                      │
│  ├── 代码沙箱                                                    │
│  ├── 资源限制                                                    │
│  ├── 网络隔离                                                    │
│  └── 超时控制                                                    │
│                                                                 │
│  基础设施安全                                                    │
│  ├── 防火墙                                                      │
│  ├── DDoS 防护                                                  │
│  ├── 日志审计                                                    │
│  └── 漏洞扫描                                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 API Key 加密

```go
// pkg/crypto/aes.go

import (
    "crypto/aes"
    "crypto/cipher"
    "crypto/rand"
    "encoding/base64"
    "io"
)

type AESCrypto struct {
    key []byte
}

func NewAESCrypto(key string) *AESCrypto {
    return &AESCrypto{
        key: []byte(key), // 32 bytes for AES-256
    }
}

func (c *AESCrypto) Encrypt(plaintext string) (string, error) {
    block, err := aes.NewCipher(c.key)
    if err != nil {
        return "", err
    }
    
    gcm, err := cipher.NewGCM(block)
    if err != nil {
        return "", err
    }
    
    nonce := make([]byte, gcm.NonceSize())
    if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
        return "", err
    }
    
    ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
    return base64.StdEncoding.EncodeToString(ciphertext), nil
}

func (c *AESCrypto) Decrypt(ciphertext string) (string, error) {
    data, err := base64.StdEncoding.DecodeString(ciphertext)
    if err != nil {
        return "", err
    }
    
    block, err := aes.NewCipher(c.key)
    if err != nil {
        return "", err
    }
    
    gcm, err := cipher.NewGCM(block)
    if err != nil {
        return "", err
    }
    
    nonceSize := gcm.NonceSize()
    nonce, ciphertextBytes := data[:nonceSize], data[nonceSize:]
    
    plaintext, err := gcm.Open(nil, nonce, ciphertextBytes, nil)
    if err != nil {
        return "", err
    }
    
    return string(plaintext), nil
}
```

---

## 10. 性能优化

### 10.1 性能指标

| 指标 | 目标值 | 监控方式 |
|------|--------|----------|
| API P95 延迟 | < 200ms | Prometheus |
| 首屏加载 | < 2s | Lighthouse |
| 编辑器响应 | < 100ms | 前端监控 |
| 工作流启动 | < 500ms | 后端监控 |
| WebSocket 延迟 | < 500ms | 实时监控 |

### 10.2 优化策略

**前端优化**:
- 代码分割和懒加载
- 图片压缩和 WebP
- CDN 加速
- Service Worker 缓存

**后端优化**:
- 连接池管理
- 查询优化和索引
- 响应压缩
- 异步处理

**数据库优化**:
- 读写分离
- 查询缓存
- 分区表
- 慢查询监控

### 10.3 监控告警

```yaml
# prometheus/alerts.yml

groups:
- name: agentflow
  rules:
  - alert: HighLatency
    expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.2
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "API 延迟过高"
      
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.01
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "错误率过高"
      
  - alert: ExecutionQueueBacklog
    expr: execution_queue_length > 100
    for: 10m
    labels:
      severity: warning
    annotations:
      summary: "执行队列积压"
```

---

## 附录

### A. 技术决策记录

| 决策 | 选项 | 选择 | 原因 |
|------|------|------|------|
| 前端框架 | React/Vue/Svelte | React + Next.js | 生态成熟、SSR 支持 |
| 后端语言 | Go/Rust/Node.js | Go | 性能好、并发强、部署简单 |
| 桌面框架 | Electron/Tauri | Tauri | 包体小、性能好、安全 |
| 数据库 | PostgreSQL/MySQL | PostgreSQL | JSONB 支持、功能丰富 |
| 画布引擎 | React Flow/自研 | React Flow | 成熟稳定、社区活跃 |

### B. 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1.0 | 2026-01-29 | 初始版本 | - |
