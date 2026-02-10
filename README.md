# AgentFlow

<p align="center">
  <strong>🚀 本地优先、代码级自定义、社区驱动的 AI Agent 工作流平台</strong>
</p>

<p align="center">
  <a href="#核心特性">核心特性</a> •
  <a href="#快速开始">快速开始</a> •
  <a href="#技术栈">技术栈</a> •
  <a href="#项目结构">项目结构</a> •
  <a href="#开发指南">开发指南</a> •
  <a href="#路线图">路线图</a>
</p>

---

## 项目概述

AgentFlow 是一个功能强大的 AI 工作流平台，让用户能够通过可视化方式快速构建自动化流程，同时提供代码级的自定义能力。支持 Web 端和桌面端（Tauri），实现真正的本地优先体验。

### 核心特性

| 特性                | 描述                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------- |
| 🏠 **本地优先**     | 支持完全本地运行，数据不出本机，隐私安全有保障。桌面端集成 Ollama，实现完全离线的 AI 工作流 |
| 🔧 **代码级自定义** | 通过 SDK 编写自定义节点，突破低代码工具的限制，满足专业开发者需求                           |
| 🌐 **社区生态**     | Agent 商店 + 创作者经济，分享和发现优质工作流，构建增长飞轮                                 |
| ✨ **可视化编辑**   | 拖拽式编辑器，5 分钟上手，支持 20+ 节点类型，快速构建复杂工作流                             |
| 🤖 **AI 创意助手**  | 一句话输入，完整方案输出。自动生成商业计划、内容策略、执行方案                              |
| ⏱️ **时间旅行调试** | 回溯查看任意执行步骤，精准定位问题，高效调试工作流                                          |

### 差异化优势

| 对比维度    | Dify | n8n      | Coze     | Manus | **AgentFlow**   |
| ----------- | ---- | -------- | -------- | ----- | --------------- |
| 本地部署    | 有限 | ✅       | ❌       | ❌    | ✅ 原生支持     |
| 本地 LLM    | 有限 | ✅       | ❌       | ❌    | ✅ Ollama 原生  |
| 桌面应用    | ❌   | ❌       | ❌       | ❌    | ✅ Tauri        |
| 自定义节点  | 中   | 高       | 低       | 无    | ✅ 极高 (SDK)   |
| 社区生态    | 弱   | 社区模板 | Bot 商店 | 无    | ✅ Agent 商店   |
| AI 辅助构建 | 无   | 无       | 有限     | 自动  | ✅ 对话式构建   |
| 调试体验    | 一般 | 好       | 差       | 黑盒  | ✅ 时间旅行调试 |

## 技术栈

### 前端 (Web)

- **框架**: Next.js 15 (App Router) + React 19
- **语言**: TypeScript 5.x
- **样式**: Tailwind CSS 4.x + shadcn/ui
- **画布**: React Flow (工作流可视化)
- **状态**: Zustand + TanStack Query
- **构建**: Turbo (Monorepo)

### 后端 (API)

- **语言**: Go 1.22+
- **框架**: Echo v4 (HTTP)
- **数据库**: PostgreSQL 16 + Redis 7
- **ORM**: GORM
- **队列**: Redis Streams

### 桌面端 (Desktop)

- **框架**: Tauri 2.0
- **后端**: Rust
- **数据库**: SQLite
- **本地 LLM**: Ollama 集成

### 基础设施

- **容器**: Docker + Docker Compose
- **编排**: Kubernetes (生产环境)
- **CI/CD**: GitHub Actions
- **监控**: Prometheus + Grafana

## 项目结构

```
agentflow/
├── apps/
│   ├── web/                  # Next.js 前端应用
│   │   ├── src/
│   │   │   ├── app/          # App Router 页面
│   │   │   ├── components/   # React 组件
│   │   │   ├── hooks/        # 自定义 Hooks
│   │   │   ├── stores/       # Zustand 状态管理
│   │   │   ├── lib/          # 工具库
│   │   │   └── types/        # TypeScript 类型
│   │   └── package.json
│   │
│   ├── server/               # Go 后端服务
│   │   ├── cmd/              # 入口
│   │   ├── internal/         # 内部模块
│   │   │   ├── handler/      # HTTP 处理器
│   │   │   ├── service/      # 业务逻辑
│   │   │   ├── repository/   # 数据访问
│   │   │   └── executor/     # 工作流执行引擎
│   │   └── pkg/              # 公共包
│   │
│   └── desktop/              # Tauri 桌面应用
│       ├── src/              # 前端代码 (复用 web)
│       └── src-tauri/        # Rust 后端
│           ├── src/
│           │   ├── commands/ # IPC 命令
│           │   ├── database.rs
│           │   └── ollama.rs # Ollama 客户端
│           └── migrations/   # SQLite 迁移
│
├── packages/
│   └── sdk/                  # 节点 SDK
│
├── docs/                     # 文档
│   ├── ARCHITECTURE.md       # 技术架构
│   ├── DEVELOPMENT.md        # 开发指南
│   ├── ROADMAP.md            # 产品路线图
│   └── requirements/         # 需求文档
│
├── design-system/            # 设计系统
├── pnpm-workspace.yaml       # pnpm 工作空间
├── turbo.json                # Turbo 配置
└── package.json
```

## 快速开始

### 前置要求

- **Node.js** >= 20.x
- **pnpm** >= 9.x
- **Go** >= 1.22
- **Docker** & Docker Compose
- **Rust** (桌面端开发需要)

### 1. 克隆项目

```bash
git clone git@github.com:shaving-ice-lab/what-reverse-ai-project.git
cd what-reverse-ai-project
```

### 2. 安装依赖

```bash
# 安装前端依赖
pnpm install
```

### 3. 启动数据库

```bash
cd docker
docker-compose up -d
```

### 4. 启动后端

```bash
# 方式一：直接运行
pnpm dev:server

# 方式二：热重载 (需要安装 air)
pnpm dev:server:hot
```

### 5. 启动前端

```bash
# Web 端
pnpm dev:web

# 或桌面端
pnpm dev:desktop
```

访问 http://localhost:3000 即可查看应用。

### 一键开发

```bash
# 同时启动前后端
pnpm dev
```

## 可用脚本

| 命令                  | 描述                    |
| --------------------- | ----------------------- |
| `pnpm dev`            | 启动 Web 前端开发服务器 |
| `pnpm dev:web`        | 启动 Web 前端开发服务器 |
| `pnpm dev:desktop`    | 启动桌面端开发          |
| `pnpm dev:server`     | 启动 Go 后端服务        |
| `pnpm dev:server:hot` | 启动后端 (热重载)       |
| `pnpm build`          | 构建 Web 前端           |
| `pnpm build:desktop`  | 构建桌面应用            |
| `pnpm lint`           | 运行前端代码检查        |
| `pnpm test`           | 运行前端测试            |

## 开发指南

详细的开发指南请参阅 [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)。

### 代码风格

**前端**

- 使用函数组件 + Hooks
- 组件文件使用 PascalCase: `WorkflowCanvas.tsx`
- Hook 文件使用 camelCase: `useWorkflow.ts`
- 状态管理使用 Zustand + immer

**后端**

- 遵循 Go 标准项目布局
- Handler 层只做参数解析和响应
- 业务逻辑放在 Service 层
- 数据访问放在 Repository 层

### 提交规范

```
<type>(<scope>): <subject>

类型: feat, fix, docs, style, refactor, test, chore
示例: feat(editor): 添加节点分组功能
```

## 已实现功能

### 编辑器

- [x] 无限画布 (25%-400% 缩放)
- [x] 节点拖拽 (24px 网格吸附)
- [x] 智能连线 (类型检查)
- [x] 节点配置面板
- [x] 撤销/重做 (Ctrl+Z/Y)
- [x] 复制/粘贴 (Ctrl+C/V)
- [x] 快捷键系统
- [x] 小地图导航
- [x] 自动布局

### 节点类型 (20+)

| 分类 | 节点                           |
| ---- | ------------------------------ |
| AI   | LLM、Embedding (规划中)        |
| 逻辑 | 条件分支、循环、延迟、异常处理 |
| 数据 | 变量、合并、过滤、转换         |
| 集成 | HTTP 请求、Webhook             |
| 流程 | 开始、结束                     |
| 文本 | 模板、分割、正则               |
| 代码 | JavaScript、表达式             |
| I/O  | 输入、输出                     |

## 路线图

| 阶段          | 时间    | 目标                                     | 状态      |
| ------------- | ------- | ---------------------------------------- | --------- |
| **Phase 1**   | Q1 2026 | MVP 闭环：执行引擎、LLM 对接、工作流存储 | 🟡 进行中 |
| **Phase 1.5** | Q1 2026 | AI 创意助手：一键生成完整方案            | 📋 规划中 |
| **Phase 2**   | Q2 2026 | 差异化：本地模式、Ollama、时间旅行调试   | 📋 规划中 |
| **Phase 3**   | Q3 2026 | 社区生态：Agent 商店、创作者经济         | 📋 规划中 |
| **Phase 4**   | Q4 2026 | 规模化：企业版、团队协作                 | 📋 规划中 |

详见 [docs/ROADMAP.md](docs/ROADMAP.md)

## 文档

- [技术架构](docs/ARCHITECTURE.md) - 系统设计和架构决策
- [开发指南](docs/DEVELOPMENT.md) - 开发环境配置和规范
- [产品路线图](docs/ROADMAP.md) - 功能规划和里程碑
- [市场分析](docs/MARKET-ANALYSIS.md) - 竞品分析和定位

## 贡献指南

欢迎贡献！请阅读以下指南了解如何参与项目开发：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交改动 (`git commit -m 'feat: 添加某功能'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件。

---

<p align="center">
  Built with ❤️ by the AgentFlow Team
</p>
