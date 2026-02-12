# ReverseAI

<p align="center">
  <strong>🚀 AI-Powered App Builder Platform — Describe it, we build it.</strong>
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

ReverseAI 是一个 AI 驱动的应用构建平台。用户通过与 AI Agent 对话描述需求（例如"帮我建一个车队管理系统"），系统自动创建数据库、生成 UI、部署运行。整个 Web 应用完整地运行在 Workspace 中，数据库管理采用 Supabase 风格。

### 核心特性

| 特性                       | 描述                                                                             |
| -------------------------- | -------------------------------------------------------------------------------- |
| 🤖 **AI Agent 构建**       | 通过自然语言对话，AI Agent 自动创建数据库表、生成多页面 UI、部署应用             |
| 🗄️ **Supabase 风格数据库** | 完整的数据库管理：表编辑器、SQL Editor、Schema Graph、Migrations、RLS、Storage   |
| 🏗️ **App Builder**         | UI 配置、页面管理、实时预览，14 种 Block 类型（数据表、表单、图表、统计卡片等）  |
| 🌐 **应用运行时**          | 构建的应用通过 `/runtime/[slug]` 公开访问，支持应用用户认证、数据 CRUD、文件存储 |
| ✨ **AI Skills 系统**      | 内置数据建模、UI 生成、业务逻辑技能，支持自定义技能扩展 Agent 能力               |
| 🔐 **行级安全 (RLS)**      | 为运行时应用配置行级安全策略，基于用户身份控制数据访问                           |

## 技术栈

### 前端 (Web)

- **框架**: Next.js 15 (App Router) + React 19
- **语言**: TypeScript 5.x
- **样式**: Tailwind CSS 4.x + shadcn/ui
- **状态**: Zustand + TanStack Query
- **构建**: Turbo (Monorepo)

### 后端 (API)

- **语言**: Go 1.22+
- **框架**: Echo v4 (HTTP)
- **数据库**: PostgreSQL 16 + Redis 7
- **ORM**: GORM
- **队列**: Redis Streams

### 基础设施

- **容器**: Docker + Docker Compose
- **编排**: Kubernetes (生产环境)
- **CI/CD**: GitHub Actions
- **监控**: Prometheus + Grafana

## 项目结构

```
reverseai/
├── apps/
│   ├── web/                  # Next.js 前端应用
│   │   ├── src/
│   │   │   ├── app/          # App Router 页面
│   │   │   │   ├── (dashboard)/  # Dashboard (Agent, Builder, Database, Skills)
│   │   │   │   └── (unauth)/     # Runtime 公开访问页面
│   │   │   ├── components/
│   │   │   │   ├── agent/        # AI Agent 对话面板
│   │   │   │   ├── app-renderer/ # 应用渲染引擎 (14 种 Block)
│   │   │   │   ├── builder/      # Builder 页面管理
│   │   │   │   └── database/     # 数据库组件 (表格、过滤器、编辑器)
│   │   │   ├── hooks/        # 自定义 Hooks
│   │   │   ├── stores/       # Zustand 状态管理
│   │   │   └── lib/          # API 客户端、工具库
│   │   └── package.json
│   │
│   └── server/               # Go 后端服务
│       ├── cmd/              # 入口
│       └── internal/
│           ├── api/          # HTTP 路由 + Handler
│           ├── service/      # 业务逻辑 (Agent Engine, DB, Runtime)
│           └── repository/   # 数据访问层
│
├── packages/
│   └── sdk/                  # SDK
│
├── docs/                     # 文档
├── design-system/            # 设计系统
├── pnpm-workspace.yaml
├── turbo.json
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
| `pnpm dev`            | 启动全部开发服务器      |
| `pnpm dev:web`        | 启动 Web 前端开发服务器 |
| `pnpm dev:server`     | 启动 Go 后端服务        |
| `pnpm dev:server:hot` | 启动后端 (热重载)       |
| `pnpm build`          | 构建 Web 前端           |
| `pnpm build:server`   | 构建后端二进制          |
| `pnpm lint`           | 运行代码检查            |
| `pnpm test`           | 运行测试                |

## 开发指南

详细的开发指南请参阅 [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)。

### 提交规范

```
<type>(<scope>): <subject>

类型: feat, fix, docs, style, refactor, test, chore
示例: feat(agent): 添加自定义技能支持
```

## 已实现功能

### AI Agent

- [x] 自然语言对话构建应用
- [x] SSE 流式响应
- [x] LLM 集成（OpenAI 兼容 API）
- [x] 会话管理（创建/恢复/删除）
- [x] 自动发布应用

### AI Skills

- [x] 内置技能：数据建模、UI 生成、业务逻辑
- [x] 自定义技能创建/编辑/删除
- [x] 动态技能提示加载

### Database (Supabase 风格)

- [x] 表管理 (CRUD)
- [x] SQL Editor
- [x] Schema Graph 可视化
- [x] Migrations 管理
- [x] Functions 管理
- [x] Roles 管理
- [x] Storage 文件存储
- [x] RLS 行级安全策略

### App Builder

- [x] UI Schema 配置
- [x] 页面管理面板
- [x] 实时应用预览
- [x] 14 种 Block 类型
- [x] 多页面导航（Sidebar/Topbar）

### App Runtime

- [x] 公开运行 `/runtime/[slug]`
- [x] Runtime Data API (CRUD)
- [x] 应用用户认证 (Login/Register)
- [x] 文件上传/存储
- [x] RLS 策略执行
- [x] 嵌入模式 (iframe)

## 文档

- [技术架构](docs/architecture/) - 系统设计和架构决策
- [开发指南](docs/development/) - 开发环境配置和规范

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
  Built with ❤️ by the ReverseAI Team
</p>
