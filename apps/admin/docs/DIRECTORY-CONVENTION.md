# Admin 目录分层约定

版本：v1.0  
日期：2026-02-03  
状态：Active  

---

## 1. 目录结构概览

```
apps/admin/
├── docs/                          # 项目文档
│   ├── CODE-SHARING.md           # 代码共享策略
│   ├── DIRECTORY-CONVENTION.md   # 目录分层约定
│   └── API-CHANGE-FLOW.md        # API 变更适配流程
├── public/                        # 静态资源
│   └── favicon.ico
├── src/
│   ├── app/                       # Next.js App Router 页面
│   │   ├── (admin)/              # Admin 主布局组
│   │   │   ├── layout.tsx        # Admin 布局
│   │   │   ├── page.tsx          # 仪表盘首页
│   │   │   ├── users/            # 用户管理
│   │   │   ├── workspaces/       # Workspace 管理
│   │   │   ├── apps/             # 应用管理
│   │   │   ├── workflows/        # 工作流管理
│   │   │   ├── executions/       # 执行管理
│   │   │   ├── support/          # 支持工单
│   │   │   ├── billing/          # 计费管理
│   │   │   ├── security/         # 安全配置
│   │   │   ├── system/           # 系统管理
│   │   │   ├── ops/              # 运维管理
│   │   │   └── analytics/        # 分析指标
│   │   ├── (auth)/               # 认证布局组
│   │   │   ├── layout.tsx        # 认证布局
│   │   │   └── login/            # 登录页
│   │   ├── 403/                  # 无权限页
│   │   ├── error.tsx             # 错误边界
│   │   ├── not-found.tsx         # 404 页面
│   │   ├── layout.tsx            # 根布局
│   │   ├── globals.css           # 全局样式
│   │   └── providers.tsx         # 全局 Provider
│   ├── components/                # 组件
│   │   ├── ui/                   # 基础 UI 组件
│   │   ├── layout/               # 布局组件
│   │   ├── dashboard/            # 仪表盘组件
│   │   ├── auth/                 # 认证相关组件
│   │   └── features/             # 业务功能组件（规划）
│   ├── contexts/                  # React Context
│   ├── hooks/                     # 自定义 Hooks（规划）
│   ├── lib/                       # 工具库
│   │   ├── api/                  # API 客户端
│   │   │   ├── client.ts         # 核心请求
│   │   │   ├── admin.ts          # Admin API
│   │   │   ├── auth.ts           # 认证 API
│   │   │   ├── ops.ts            # 运维 API
│   │   │   └── system.ts         # 系统 API
│   │   ├── env.ts                # 环境变量
│   │   ├── i18n.ts               # 国际化
│   │   ├── logger.ts             # 日志工具
│   │   ├── mock-data.ts          # Mock 数据
│   │   ├── navigation.ts         # 导航配置
│   │   └── utils.ts              # 通用工具
│   ├── stores/                    # 状态管理
│   │   └── useAuthStore.ts       # 认证状态
│   ├── test/                      # 测试工具
│   │   ├── setup.ts              # 测试配置
│   │   ├── utils.tsx             # 测试工具
│   │   ├── performance/          # 性能测试
│   │   └── security/             # 安全测试
│   └── types/                     # 类型定义
│       ├── admin.ts              # Admin 类型
│       ├── auth.ts               # 认证类型
│       ├── ops.ts                # 运维类型
│       └── system.ts             # 系统类型
├── tests/                         # E2E 测试
│   └── e2e/
│       ├── auth-login.spec.ts
│       ├── user-management.spec.ts
│       └── ...
├── .env.example                   # 环境变量示例
├── next.config.ts                 # Next.js 配置
├── package.json                   # 依赖配置
├── playwright.config.ts           # Playwright 配置
├── tsconfig.json                  # TypeScript 配置
├── vitest.config.ts              # Vitest 配置
└── vitest.perf.config.ts         # 性能测试配置
```

---

## 2. 分层说明

### 2.1 App 层 (`src/app/`)

Next.js App Router 页面层，负责路由与页面组织。

**命名规则**：
- 目录名使用 kebab-case（如 `user-management`）
- 动态路由使用 `[param]` 格式
- 路由组使用 `(group)` 格式

**文件约定**：
- `page.tsx` - 页面组件
- `layout.tsx` - 布局组件
- `loading.tsx` - 加载状态
- `error.tsx` - 错误边界

### 2.2 Components 层 (`src/components/`)

可复用的 React 组件。

**子目录分类**：

| 目录 | 用途 | 示例 |
|------|------|------|
| `ui/` | 基础 UI 组件 | Button, Input, Table |
| `layout/` | 布局组件 | AdminShell, Sidebar |
| `dashboard/` | 仪表盘组件 | PageLayout, MetricCard |
| `auth/` | 认证组件 | RequireAdmin |
| `features/` | 业务功能组件 | UserTable, WorkspaceCard |

**命名规则**：
- 文件名使用 kebab-case（如 `admin-shell.tsx`）
- 组件名使用 PascalCase（如 `AdminShell`）
- 每个组件一个文件

### 2.3 Lib 层 (`src/lib/`)

工具函数与核心库。

**子目录分类**：

| 目录/文件 | 用途 |
|-----------|------|
| `api/` | API 客户端与请求 |
| `env.ts` | 环境变量管理 |
| `logger.ts` | 日志与追踪 |
| `utils.ts` | 通用工具函数 |
| `i18n.ts` | 国际化配置 |
| `navigation.ts` | 导航配置 |

**命名规则**：
- 文件名使用 kebab-case
- 导出函数使用 camelCase
- 导出常量使用 UPPER_SNAKE_CASE

### 2.4 Stores 层 (`src/stores/`)

Zustand 状态管理。

**命名规则**：
- 文件名使用 `use{Name}Store.ts` 格式
- 每个 Store 一个文件

### 2.5 Types 层 (`src/types/`)

TypeScript 类型定义。

**命名规则**：
- 文件名使用 kebab-case
- 类型名使用 PascalCase
- 接口名以 `I` 前缀（可选）

### 2.6 Contexts 层 (`src/contexts/`)

React Context 定义。

**命名规则**：
- 文件名使用 kebab-case
- Context 名使用 PascalCase

### 2.7 Hooks 层 (`src/hooks/`，规划中）

自定义 React Hooks。

**命名规则**：
- 文件名使用 `use-{name}.ts` 格式
- Hook 名使用 `use{Name}` 格式

---

## 3. 导入路径约定

### 3.1 路径别名

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 3.2 导入顺序

```typescript
// 1. 外部依赖
import React from 'react';
import { useRouter } from 'next/navigation';

// 2. 内部别名导入
import { Button } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import type { User } from '@/types/admin';

// 3. 相对导入（同目录下）
import { LocalComponent } from './local-component';
```

---

## 4. Features 目录结构（规划中）

对于复杂业务模块，采用 Feature-based 结构：

```
src/features/
├── users/
│   ├── components/
│   │   ├── user-table.tsx
│   │   ├── user-detail.tsx
│   │   └── user-form.tsx
│   ├── hooks/
│   │   ├── use-users.ts
│   │   └── use-user-actions.ts
│   ├── api/
│   │   └── user-api.ts
│   ├── types/
│   │   └── user.types.ts
│   └── index.ts
├── workspaces/
│   └── ...
└── support/
    └── ...
```

**迁移计划**：
1. 当前：所有组件在 `components/` 下
2. 阶段一：抽取复杂模块到 `features/`
3. 阶段二：统一 Feature 结构

---

## 5. 命名规范汇总

| 类型 | 命名格式 | 示例 |
|------|----------|------|
| 目录 | kebab-case | `user-management` |
| 组件文件 | kebab-case | `admin-shell.tsx` |
| 组件名 | PascalCase | `AdminShell` |
| Hook 文件 | use-{name}.ts | `use-users.ts` |
| Hook 名 | use{Name} | `useUsers` |
| Store 文件 | use{Name}Store.ts | `useAuthStore.ts` |
| 工具文件 | kebab-case | `mock-data.ts` |
| 类型文件 | kebab-case | `admin.ts` |
| 常量 | UPPER_SNAKE_CASE | `API_BASE_URL` |
| 函数 | camelCase | `formatDate` |

---

## 6. 相关文档

- [代码共享策略](./CODE-SHARING.md)
- [API 变更适配流程](./API-CHANGE-FLOW.md)
