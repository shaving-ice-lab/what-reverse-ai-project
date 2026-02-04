# Admin 代码共享策略

版本：v1.0  
日期：2026-02-03  
状态：Active  

---

## 1. 策略概述

Admin 项目与 `apps/web` 共享大量代码，包括 UI 组件、API 客户端、类型定义等。本文档定义代码共享的策略与最佳实践。

### 1.1 共享原则

1. **一致性优先**：共享代码确保 Admin 与 Web 端行为一致
2. **可维护性**：选择易于长期维护的共享方式
3. **渐进演进**：从复制开始，逐步抽取公共包
4. **最小依赖**：避免不必要的耦合

---

## 2. 共享策略分级

### 2.1 第一级：复制策略（当前采用）

适用于：快速启动、独立演进需求

```
apps/web/src/components/ui/  →  apps/admin/src/components/ui/
apps/web/src/lib/utils.ts    →  apps/admin/src/lib/utils.ts
apps/web/src/app/globals.css →  apps/admin/src/app/globals.css
```

**优点**：
- 无额外构建配置
- 可独立演进
- 快速启动

**缺点**：
- 需要手动同步
- 可能出现版本漂移

**同步规则**：
- 每周检查 Web 端 UI 组件更新
- 重大变更需同步更新
- 记录变更差异

### 2.2 第二级：公共包策略（规划中）

适用于：稳定且需要强一致性的代码

```
packages/
├── ui/                 # 共享 UI 组件
│   ├── src/
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   └── index.ts
│   └── package.json
├── api-client/         # 共享 API 客户端
│   ├── src/
│   │   ├── client.ts
│   │   └── types.ts
│   └── package.json
└── shared/             # 共享工具函数
    ├── src/
    │   ├── utils.ts
    │   └── constants.ts
    └── package.json
```

**迁移计划**：

| 阶段 | 内容 | 状态 |
|------|------|------|
| P1 | 类型定义抽取到 `packages/types` | 规划中 |
| P2 | 工具函数抽取到 `packages/shared` | 规划中 |
| P3 | UI 组件抽取到 `packages/ui` | 规划中 |
| P4 | API 客户端抽取到 `packages/api-client` | 规划中 |

### 2.3 第三级：软链接策略（备选）

适用于：开发期间快速同步

```bash
# 创建软链接（仅开发环境）
ln -s ../../web/src/components/ui apps/admin/src/components/shared-ui
```

**注意**：
- 仅限开发环境使用
- 需要处理构建时路径解析
- 可能影响 IDE 智能提示

---

## 3. 当前共享清单

### 3.1 已复制的代码

| 源路径 | 目标路径 | 同步状态 |
|--------|----------|----------|
| `apps/web/src/components/ui/*` | `apps/admin/src/components/ui/*` | ✅ 已同步 |
| `apps/web/src/lib/utils.ts` | `apps/admin/src/lib/utils.ts` | ✅ 已同步 |
| `apps/web/src/app/globals.css` | `apps/admin/src/app/globals.css` | ✅ 已同步 |

### 3.2 需要独立维护的代码

| 模块 | 说明 |
|------|------|
| `src/lib/api/admin.ts` | Admin 专用 API |
| `src/components/layout/admin-shell.tsx` | Admin 专用布局 |
| `src/contexts/admin-capabilities.tsx` | Admin 权限上下文 |

### 3.3 计划共享的代码

| 模块 | 优先级 | 说明 |
|------|--------|------|
| API 类型定义 | P1 | 请求/响应类型 |
| 通用 Hooks | P2 | useDebounce, useLocalStorage 等 |
| 表单组件 | P2 | 表单验证与提交逻辑 |

---

## 4. 同步流程

### 4.1 手动同步检查清单

```bash
# 检查 Web 端 UI 组件变更
git diff main -- apps/web/src/components/ui/

# 检查工具函数变更
git diff main -- apps/web/src/lib/utils.ts

# 检查主题样式变更
git diff main -- apps/web/src/app/globals.css
```

### 4.2 同步脚本（规划中）

```bash
# scripts/sync-shared.sh
#!/bin/bash

# 同步 UI 组件
rsync -av --delete \
  apps/web/src/components/ui/ \
  apps/admin/src/components/ui/ \
  --exclude="*.test.*" \
  --exclude="*.stories.*"

# 同步工具函数
cp apps/web/src/lib/utils.ts apps/admin/src/lib/utils.ts

echo "同步完成，请检查并提交变更"
```

---

## 5. 版本管理

### 5.1 共享代码版本标记

在共享文件头部添加版本注释：

```typescript
/**
 * @shared-from apps/web/src/components/ui/button.tsx
 * @synced-at 2026-02-03
 * @version 1.0.0
 */
```

### 5.2 变更记录

| 日期 | 变更 | 影响范围 |
|------|------|----------|
| 2026-02-03 | 初始复制 UI 组件 | 全量组件 |

---

## 6. 最佳实践

### 6.1 何时复制

- 组件/函数相对稳定
- 需要 Admin 特有的定制
- 快速启动优先

### 6.2 何时抽包

- 多个项目使用相同代码
- 需要强版本控制
- 需要独立测试与发布

### 6.3 避免的做法

- ❌ 在 Admin 中直接 import Web 端代码（路径问题）
- ❌ 频繁修改共享代码而不同步
- ❌ 在共享代码中添加 Admin 特有逻辑

---

## 7. 相关文档

- [目录分层约定](./DIRECTORY-CONVENTION.md)
- [API 变更适配流程](./API-CHANGE-FLOW.md)
