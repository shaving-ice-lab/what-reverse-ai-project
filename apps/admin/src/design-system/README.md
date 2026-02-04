# Admin 设计系统规范

> 版本: v1.0  
> 更新日期: 2026-02-03  
> 状态: Active

本文档定义 `apps/admin` 的设计系统规范，确保与 `apps/web` 的视觉一致性。

---

## 1. 设计系统复用方案

### 1.1 复用策略

当前采用 **复制策略（Copy Strategy）**，将 `apps/web` 的核心样式和组件复制到 `apps/admin`，并保持同步更新。

**选择理由：**
- Admin 项目独立性高，需要快速迭代
- 避免引入跨项目依赖复杂性
- 组件在 Admin 场景有定制需求

**后续演进路径：**
```
当前：复制策略 → 中期：packages/ui 共享包 → 长期：设计系统 Monorepo
```

### 1.2 同步清单

| 来源 | 目标 | 同步内容 |
|------|------|----------|
| `apps/web/src/app/globals.css` | `apps/admin/src/app/globals.css` | 主题变量、字体、动画 |
| `apps/web/src/components/ui/*` | `apps/admin/src/components/ui/*` | 基础 UI 组件 |
| `apps/web/src/lib/utils.ts` | `apps/admin/src/lib/utils.ts` | 工具函数 |

### 1.3 版本对照

| 组件/模块 | Web 版本 | Admin 版本 | 状态 |
|-----------|----------|------------|------|
| globals.css | v1.0 | v1.0 | ✅ 同步 |
| Button | v1.0 | v1.0 | ✅ 同步 |
| Input | v1.0 | v1.0 | ✅ 同步 |
| Table | v1.0 | v1.0 | ✅ 同步 |
| Badge | v1.0 | v1.0 | ✅ 同步 |
| Dialog | v1.0 | v1.0 | ✅ 同步 |
| Card | v1.0 | v1.0 | ✅ 同步 |

---

## 2. 色彩系统

### 2.1 品牌色

```css
--color-brand-200: #1a3a2a;  /* 深绿背景 */
--color-brand-300: #1f4a35;  /* 次深绿 */
--color-brand-400: #2a6348;  /* 中绿 */
--color-brand-500: #3ECF8E;  /* 主品牌绿 */
--color-brand-600: #5fd9a3;  /* 亮绿 */
```

### 2.2 背景色

```css
--color-background: #111111;         /* 主背景 */
--color-background-200: #181818;     /* 次背景 */
--color-background-studio: #0f0f0f;  /* Studio 背景 */
--color-surface-75: #1a1a1a;         /* 卡片背景-深 */
--color-surface-100: #1f1f1f;        /* 卡片背景 */
--color-surface-200: #242424;        /* 悬浮背景 */
--color-surface-300: #2b2b2b;        /* 激活背景 */
```

### 2.3 语义色

```css
/* 成功 */
--color-success: #3ECF8E;
--color-success-200: #1a3a2a;

/* 警告 */
--color-warning: #f59e0b;
--color-warning-200: #3b2e0a;
--color-warning-400: #d97706;

/* 错误/危险 */
--color-destructive: #ef4444;
--color-destructive-200: #3b1818;
--color-destructive-400: #dc2626;
```

---

## 3. 字体系统

### 3.1 字体栈

```css
font-family: var(--font-mono); /* JetBrains Mono, monospace */
letter-spacing: 0.02em;
```

### 3.2 字号规范

| 用途 | 字号 | 行高 | 字重 | CSS 类 |
|------|------|------|------|--------|
| 页面标题 | 1.25rem (20px) | 1.75rem | 600 | `.page-title` |
| 章节标题 | 1.125rem (18px) | 1.5rem | 600 | `.text-section-title` |
| 卡片标题 | 13px | 1.25rem | 500 | `.page-panel-title` |
| 正文 | 13px | 1.25rem | 400 | 默认 |
| 描述文本 | 12px | 1rem | 400 | `.page-description` |
| 小字 | 11px | 0.875rem | 400 | `.text-small` |
| 分类标签 | 10px | 1rem | 500 | `.page-caption` |
| 表头 | 10px | 1rem | 500 | `.text-table-header` |

---

## 4. 图标系统

### 4.1 图标库

使用 **Lucide React** 作为统一图标库。

```tsx
import { Users, Settings, ChevronRight } from "lucide-react";
```

### 4.2 图标尺寸

| 场景 | 尺寸 | CSS 类 |
|------|------|--------|
| 按钮内 | 16px (w-4 h-4) | 默认 |
| 导航项 | 16px | - |
| 页面头部 | 16px | - |
| 状态图标 | 20px (w-5 h-5) | - |
| 空状态 | 24px (w-6 h-6) | - |
| 大图标 | 32px (w-8 h-8) | - |

---

## 5. 栅格与间距

### 5.1 栅格系统

- 页面最大宽度：`1280px`
- 内边距：`24px` (px-6)
- 卡片间距：`16px` (gap-4) 或 `24px` (gap-6)

### 5.2 间距规范

| Token | 值 | 用途 |
|-------|-----|------|
| spacing-1 | 4px | 紧凑间距 |
| spacing-2 | 8px | 元素内间距 |
| spacing-3 | 12px | 小组件间距 |
| spacing-4 | 16px | 标准间距 |
| spacing-5 | 20px | 区块间距 |
| spacing-6 | 24px | 页面内边距 |
| spacing-8 | 32px | 大区块间距 |

---

## 6. 圆角规范

| Token | 值 | 用途 |
|-------|-----|------|
| radius-sm | 4px | 小按钮、徽章 |
| radius-md | 6px | 输入框、按钮 |
| radius-lg | 8px | 卡片、模态框 |
| radius-xl | 12px | 大卡片 |
| radius-full | 9999px | 头像、标签 |

---

## 7. 边框规范

```css
--color-border: #2a2a2a;        /* 默认边框 */
--color-border-muted: #242424;  /* 淡边框 */
--color-border-strong: #3a3a3a; /* 强边框 */
```

---

## 8. 阴影规范

```css
/* 卡片阴影 */
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);

/* 悬浮阴影 */
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

/* 模态框阴影 */
box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);

/* 品牌发光 */
box-shadow: 0 0 20px rgba(62, 207, 142, 0.3);
```

---

## 9. 动画规范

### 9.1 过渡时长

| 场景 | 时长 | 缓动 |
|------|------|------|
| 微交互 | 150ms | ease |
| 状态变化 | 200ms | ease-out |
| 进入动画 | 300ms | ease-out |
| 复杂动画 | 500ms | ease-in-out |

### 9.2 预设动画

```css
.animate-fadeIn      /* 淡入 */
.animate-fadeInUp    /* 淡入上移 */
.animate-scale-in    /* 缩放进入 */
.animate-shimmer     /* 骨架屏闪烁 */
.animate-pulse-soft  /* 柔和脉冲 */
```

---

## 10. 组件索引

### 10.1 基础组件

| 组件 | 路径 | 说明 |
|------|------|------|
| Button | `components/ui/button.tsx` | 按钮（多变体） |
| Input | `components/ui/input.tsx` | 输入框 |
| Badge | `components/ui/badge.tsx` | 徽章 |
| Card | `components/ui/card.tsx` | 卡片容器 |
| Dialog | `components/ui/dialog.tsx` | 对话框/模态框 |
| Table | `components/ui/table.tsx` | 表格 |
| Switch | `components/ui/switch.tsx` | 开关 |
| Pagination | `components/ui/pagination.tsx` | 分页 |

### 10.2 布局组件

| 组件 | 路径 | 说明 |
|------|------|------|
| PageContainer | `components/dashboard/page-layout.tsx` | 页面容器 |
| PageHeader | `components/dashboard/page-layout.tsx` | 页面头部 |
| SettingsSection | `components/dashboard/page-layout.tsx` | 设置区块 |
| AdminShell | `components/layout/admin-shell.tsx` | 管理台外壳 |

### 10.3 状态组件

| 组件 | 路径 | 说明 |
|------|------|------|
| LoadingState | `components/ui/data-states.tsx` | 加载状态 |
| EmptyState | `components/ui/data-states.tsx` | 空状态 |
| ErrorState | `components/ui/data-states.tsx` | 错误状态 |
| WarningState | `components/ui/data-states.tsx` | 警告状态 |
| Skeleton | `components/ui/data-states.tsx` | 骨架屏 |

---

## 更新日志

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-02-03 | v1.0 | 初始版本，定义色彩/字体/图标/栅格/动画规范 |
