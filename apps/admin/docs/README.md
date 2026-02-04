# Admin 应用文档目录

## 概述

Admin 应用是 AgentFlow 平台的后台管理系统，提供用户管理、工作空间管理、应用管理、计费管理、安全合规等功能。

---

## 文档列表

### 部署与运维

| 文档 | 描述 |
|------|------|
| [DEPLOYMENT.md](./DEPLOYMENT.md) | 部署指南，包括环境配置、部署流程、回滚策略 |
| [OPERATIONS.md](./OPERATIONS.md) | 运维手册，包括日常运维、故障排查、扩容策略 |
| [RELEASE-CHECKLIST.md](./RELEASE-CHECKLIST.md) | 发布检查清单，用于版本发布前后的验证 |

### 技术规范

| 文档 | 描述 |
|------|------|
| [API-DEPENDENCIES.md](./API-DEPENDENCIES.md) | API 依赖表，列出所有依赖的后端 API |
| [PERMISSION-MATRIX.md](./PERMISSION-MATRIX.md) | 权限矩阵，定义角色和能力点 |

### 变更记录

| 文档 | 描述 |
|------|------|
| [../CHANGELOG.md](../CHANGELOG.md) | 版本变更日志 |

---

## 快速链接

### 开发

```bash
# 启动开发服务器
pnpm --filter @agentflow/admin dev

# 运行测试
pnpm --filter @agentflow/admin test

# 运行 E2E 测试
pnpm --filter @agentflow/admin test:e2e

# 构建
pnpm --filter @agentflow/admin build
```

### 环境

| 环境 | URL |
|------|-----|
| 开发 | http://localhost:3002 |
| Staging | https://admin-staging.agentflow.ai |
| 生产 | https://admin.agentflow.ai |

---

## 架构概览

```
apps/admin/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (admin)/           # 管理页面
│   │   │   ├── users/         # 用户管理
│   │   │   ├── workspaces/    # Workspace 管理
│   │   │   ├── apps/          # 应用管理
│   │   │   ├── workflows/     # 工作流管理
│   │   │   ├── conversations/ # 对话管理
│   │   │   ├── templates/     # 模板管理
│   │   │   ├── billing/       # 计费管理
│   │   │   ├── tickets/       # 工单管理
│   │   │   ├── security/      # 安全管理
│   │   │   └── analytics/     # 分析指标
│   │   └── api/               # API 路由
│   ├── components/            # UI 组件
│   │   ├── ui/               # 基础组件
│   │   └── layouts/          # 布局组件
│   ├── lib/                  # 工具库
│   │   ├── api/              # API 客户端
│   │   ├── hooks/            # React Hooks
│   │   └── utils/            # 工具函数
│   └── styles/               # 样式文件
├── docs/                     # 文档
├── tests/                    # 测试文件
│   ├── unit/                # 单元测试
│   └── e2e/                 # E2E 测试
└── public/                   # 静态资源
```

---

## 技术栈

- **框架**: Next.js 15 + React 19
- **语言**: TypeScript
- **样式**: Tailwind CSS 4
- **状态管理**: Zustand
- **数据获取**: TanStack Query
- **测试**: Vitest + Playwright
- **CI/CD**: GitHub Actions

---

## 联系方式

- **技术负责人**: tech-lead@agentflow.ai
- **运维支持**: devops@agentflow.ai
- **安全问题**: security@agentflow.ai
