---
name: supabase-style
description: Transform web pages to match Supabase's design system. Applies Supabase's dark theme, color palette, typography, spacing, and component patterns. Use when modifying UI/frontend code, styling pages, or when the user mentions Supabase style, Supabase design, or wants a similar aesthetic.
---

# Supabase Style System

将 Web 页面样式和布局转换为 Supabase 风格的完整指南。

## 核心设计理念

Supabase 的设计语言特点：

- **深色优先**：以深绿灰色为基调的暗色主题
- **层次分明**：通过 surface 层级创造视觉深度
- **品牌绿色点缀**：`#3ECF8E` 作为主要强调色
- **简洁克制**：大量留白，避免视觉噪音
- **现代工程感**：monospace 字体用于代码，清晰的信息层级

## 快速开始

### 1. 安装必要依赖

```bash
# 使用 shadcn/ui 作为组件基础
npx shadcn@latest init

# 安装 Supabase UI (可选)
npx shadcn add "https://supabase.com/ui/r/password-based-auth"
```

### 2. 配置 Tailwind

在 `tailwind.config.ts` 中扩展主题：

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Supabase Brand Colors
        brand: {
          DEFAULT: '#3ECF8E',
          200: '#1a3a2a',
          300: '#1f4a35',
          400: '#2a6348',
          500: '#3ECF8E',
          600: '#5fd9a3',
        },
        // Background Surfaces
        background: {
          DEFAULT: '#171717', // bg
          200: '#1c1c1c', // bg-200
          studio: '#0f0f0f', // bg-studio (dashboard)
          alternative: '#0a0a0a', // bg-alternative
        },
        surface: {
          75: '#1a1a1a',
          100: '#1f1f1f',
          200: '#262626',
          300: '#2e2e2e',
          400: '#363636',
        },
        // Text Colors
        foreground: {
          DEFAULT: '#ededed', // text
          light: '#a3a3a3', // text-light
          lighter: '#6b6b6b', // text-lighter
          muted: '#525252', // text-muted
        },
        // Borders
        border: {
          DEFAULT: '#2e2e2e',
          muted: '#262626',
          strong: '#404040',
          stronger: '#525252',
        },
        // Semantic Colors
        destructive: {
          DEFAULT: '#ef4444',
          200: '#3b1818',
          400: '#dc2626',
        },
        warning: {
          DEFAULT: '#f59e0b',
          200: '#3b2e0a',
          400: '#d97706',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Source Code Pro', 'Menlo', 'Monaco', 'monospace'],
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem',
      },
    },
  },
}
export default config
```

### 3. 全局样式设置

在 `globals.css` 中添加：

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 9%;
    --foreground: 0 0% 93%;
    --card: 0 0% 11%;
    --card-foreground: 0 0% 93%;
    --popover: 0 0% 11%;
    --popover-foreground: 0 0% 93%;
    --primary: 153 68% 52%;
    --primary-foreground: 0 0% 9%;
    --secondary: 0 0% 15%;
    --secondary-foreground: 0 0% 93%;
    --muted: 0 0% 15%;
    --muted-foreground: 0 0% 64%;
    --accent: 0 0% 15%;
    --accent-foreground: 0 0% 93%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 93%;
    --border: 0 0% 18%;
    --input: 0 0% 18%;
    --ring: 153 68% 52%;
    --radius: 0.5rem;
  }
}

@layer base {
  body {
    @apply bg-background text-foreground antialiased;
    font-feature-settings:
      'rlig' 1,
      'calt' 1;
  }
}
```

## 组件样式指南

### 按钮 (Button)

```tsx
// Primary Button - 品牌绿色
<button className="bg-brand-500 hover:bg-brand-600 text-background px-4 py-2 rounded-md font-medium transition-colors">
  Primary Action
</button>

// Secondary Button - 透明边框
<button className="bg-transparent border border-border-strong hover:bg-surface-200 text-foreground px-4 py-2 rounded-md transition-colors">
  Secondary
</button>

// Destructive Button
<button className="bg-destructive-400 hover:bg-destructive text-white px-4 py-2 rounded-md transition-colors">
  Delete
</button>

// Ghost Button
<button className="hover:bg-surface-200 text-foreground-light px-4 py-2 rounded-md transition-colors">
  Ghost
</button>
```

### 卡片 (Card)

```tsx
<div className="bg-surface-100 border border-border rounded-lg p-6">
  <h3 className="text-foreground font-medium mb-2">Card Title</h3>
  <p className="text-foreground-light text-sm">Card description text</p>
</div>

// 带hover效果的卡片
<div className="bg-surface-100 border border-border rounded-lg p-6 hover:border-border-strong transition-colors cursor-pointer">
  {/* content */}
</div>
```

### 输入框 (Input)

```tsx
<input
  type="text"
  className="w-full bg-surface-200 border border-border focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-md px-3 py-2 text-foreground placeholder:text-foreground-muted outline-none transition-colors"
  placeholder="Enter value..."
/>

// 带标签的输入框
<div className="space-y-2">
  <label className="text-sm text-foreground-light">Label</label>
  <input className="w-full bg-surface-200 border border-border focus:border-brand-500 rounded-md px-3 py-2 text-foreground" />
  <p className="text-xs text-foreground-muted">Helper text</p>
</div>
```

### 侧边栏 (Sidebar)

```tsx
<aside className="w-64 bg-background-studio border-r border-border h-screen">
  <div className="p-4 border-b border-border">
    <span className="text-brand-500 font-semibold">Logo</span>
  </div>
  <nav className="p-2 space-y-1">
    <a className="flex items-center gap-3 px-3 py-2 text-foreground-light hover:text-foreground hover:bg-surface-100 rounded-md transition-colors">
      <Icon className="w-4 h-4" />
      <span>Menu Item</span>
    </a>
    {/* Active state */}
    <a className="flex items-center gap-3 px-3 py-2 text-foreground bg-surface-200 rounded-md">
      <Icon className="w-4 h-4 text-brand-500" />
      <span>Active Item</span>
    </a>
  </nav>
</aside>
```

### 表格 (Table)

```tsx
<div className="border border-border rounded-lg overflow-hidden">
  <table className="w-full">
    <thead className="bg-surface-200 border-b border-border">
      <tr>
        <th className="px-4 py-3 text-left text-xs font-medium text-foreground-light uppercase tracking-wider">
          Column
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-border">
      <tr className="bg-background-200 hover:bg-surface-100 transition-colors">
        <td className="px-4 py-3 text-sm text-foreground">Cell content</td>
      </tr>
    </tbody>
  </table>
</div>
```

### 弹窗/对话框 (Dialog)

```tsx
<div className="fixed inset-0 bg-black/80 flex items-center justify-center">
  <div className="bg-surface-100 border border-border rounded-lg w-full max-w-md p-6 shadow-2xl">
    <h2 className="text-lg font-medium text-foreground mb-4">Dialog Title</h2>
    <p className="text-foreground-light mb-6">Dialog content goes here.</p>
    <div className="flex justify-end gap-3">
      <button className="px-4 py-2 text-foreground-light hover:text-foreground">Cancel</button>
      <button className="bg-brand-500 hover:bg-brand-600 text-background px-4 py-2 rounded-md">
        Confirm
      </button>
    </div>
  </div>
</div>
```

## 布局模式

### Dashboard 布局

```tsx
<div className="min-h-screen bg-background-studio">
  {/* Top Navigation */}
  <header className="h-14 border-b border-border bg-background-studio flex items-center px-4">
    <Logo />
  </header>

  <div className="flex">
    {/* Sidebar */}
    <aside className="w-64 border-r border-border min-h-[calc(100vh-3.5rem)]">
      {/* nav items */}
    </aside>

    {/* Main Content */}
    <main className="flex-1 p-6">
      <div className="max-w-5xl mx-auto">{/* page content */}</div>
    </main>
  </div>
</div>
```

### 内容面板

```tsx
{
  /* 分层面板 */
}
;<div className="bg-surface-75 border border-border-muted rounded-lg">
  <div className="px-6 py-4 border-b border-border">
    <h3 className="font-medium text-foreground">Panel Title</h3>
  </div>
  <div className="p-6">{/* Panel content */}</div>
</div>
```

## 常用间距规范

| 用途             | 值                |
| ---------------- | ----------------- |
| 组件内部 padding | `p-4` / `p-6`     |
| 元素间距         | `gap-2` / `gap-4` |
| 段落间距         | `space-y-4`       |
| 页面边距         | `px-6 py-8`       |
| 卡片间距         | `gap-6`           |

## 文字规范

| 类型     | 样式                                                     |
| -------- | -------------------------------------------------------- |
| 页面标题 | `text-2xl font-semibold text-foreground`                 |
| 区块标题 | `text-lg font-medium text-foreground`                    |
| 正文     | `text-sm text-foreground-light`                          |
| 辅助文字 | `text-xs text-foreground-muted`                          |
| 代码     | `font-mono text-sm bg-surface-200 px-1.5 py-0.5 rounded` |
| 链接     | `text-brand-500 hover:text-brand-600 underline-offset-4` |

## 动画效果

```css
/* 标准过渡 */
.transition-standard {
  @apply transition-colors duration-150;
}

/* 卡片悬停 */
.card-hover {
  @apply transition-all duration-200 hover:shadow-lg hover:border-border-strong;
}

/* 淡入效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}
```

## 图标使用

推荐使用 [Lucide Icons](https://lucide.dev/)，与 Supabase 风格一致：

```tsx
import { Database, Settings, User, ChevronRight } from 'lucide-react'

<Database className="w-4 h-4 text-foreground-light" />
<Settings className="w-5 h-5 text-brand-500" />
```

## 附加资源

- 详细组件示例：[components.md](components.md)
- 完整色板参考：[colors.md](colors.md)
- Supabase 官方资源：
  - [Supabase UI Library](https://supabase.com/ui)
  - [Design System](https://supabase-design-system.vercel.app/design-system)
