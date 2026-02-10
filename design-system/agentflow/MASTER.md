# Design System Master File - Manus Style

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** AgentFlow
**Generated:** 2026-01-27
**Style:** Manus-inspired Dark AI Theme
**Category:** AI Agent Platform

---

## Global Rules

### Color Palette (Dark Theme)

| Role             | Hex       | CSS Variable               | Tailwind     |
| ---------------- | --------- | -------------------------- | ------------ |
| Primary          | `#8B5CF6` | `--color-primary`          | `violet-500` |
| Primary Hover    | `#A78BFA` | `--color-primary-hover`    | `violet-400` |
| Secondary        | `#6366F1` | `--color-secondary`        | `indigo-500` |
| CTA/Accent       | `#22D3EE` | `--color-cta`              | `cyan-400`   |
| Background       | `#09090B` | `--color-background`       | `zinc-950`   |
| Surface          | `#18181B` | `--color-surface`          | `zinc-900`   |
| Surface Elevated | `#27272A` | `--color-surface-elevated` | `zinc-800`   |
| Border           | `#3F3F46` | `--color-border`           | `zinc-700`   |
| Text Primary     | `#FAFAFA` | `--color-text`             | `zinc-50`    |
| Text Secondary   | `#A1A1AA` | `--color-text-secondary`   | `zinc-400`   |
| Text Muted       | `#71717A` | `--color-text-muted`       | `zinc-500`   |
| Success          | `#22C55E` | `--color-success`          | `green-500`  |
| Error            | `#EF4444` | `--color-error`            | `red-500`    |
| Warning          | `#F59E0B` | `--color-warning`          | `amber-500`  |

**Color Notes:** Deep dark background with violet primary and cyan accents - Manus-inspired AI aesthetic

### Gradient Effects

```css
/* Primary Gradient - for buttons, highlights */
.gradient-primary {
  background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
}

/* Glow Effect - for hover states */
.glow-primary {
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.4);
}

/* Card Gradient Border */
.gradient-border {
  background: linear-gradient(135deg, #8b5cf6 0%, #22d3ee 100%);
  padding: 1px;
  border-radius: 12px;
}

/* Mesh Background - for hero sections */
.mesh-background {
  background-color: #09090b;
  background-image:
    radial-gradient(at 40% 20%, hsla(268, 90%, 55%, 0.15) 0px, transparent 50%),
    radial-gradient(at 80% 0%, hsla(189, 100%, 56%, 0.1) 0px, transparent 50%),
    radial-gradient(at 0% 50%, hsla(268, 90%, 55%, 0.1) 0px, transparent 50%);
}
```

### Typography

- **Heading Font:** Inter (or system-ui)
- **Body Font:** Inter
- **Mono Font:** JetBrains Mono (for code/technical content)
- **Mood:** Modern, professional, tech, clean, AI-native

**Google Fonts:**

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
```

**Font Sizes:**
| Token | Size | Line Height | Usage |
|-------|------|-------------|-------|
| `text-xs` | 12px | 16px | Labels, captions |
| `text-sm` | 14px | 20px | Secondary text |
| `text-base` | 16px | 24px | Body text |
| `text-lg` | 18px | 28px | Large body |
| `text-xl` | 20px | 28px | Small headings |
| `text-2xl` | 24px | 32px | Section headings |
| `text-3xl` | 30px | 36px | Page headings |
| `text-4xl` | 36px | 40px | Hero headings |

### Spacing Variables

| Token         | Value             | Usage                     |
| ------------- | ----------------- | ------------------------- |
| `--space-xs`  | `4px` / `0.25rem` | Tight gaps                |
| `--space-sm`  | `8px` / `0.5rem`  | Icon gaps, inline spacing |
| `--space-md`  | `16px` / `1rem`   | Standard padding          |
| `--space-lg`  | `24px` / `1.5rem` | Section padding           |
| `--space-xl`  | `32px` / `2rem`   | Large gaps                |
| `--space-2xl` | `48px` / `3rem`   | Section margins           |
| `--space-3xl` | `64px` / `4rem`   | Hero padding              |

### Border Radius

| Token         | Value  | Usage           |
| ------------- | ------ | --------------- |
| `rounded-sm`  | `4px`  | Small elements  |
| `rounded-md`  | `6px`  | Buttons, inputs |
| `rounded-lg`  | `8px`  | Cards, panels   |
| `rounded-xl`  | `12px` | Large cards     |
| `rounded-2xl` | `16px` | Modals, dialogs |

### Shadow Depths (Dark Mode)

| Level           | Value                           | Usage             |
| --------------- | ------------------------------- | ----------------- |
| `--shadow-sm`   | `0 1px 2px rgba(0,0,0,0.3)`     | Subtle lift       |
| `--shadow-md`   | `0 4px 6px rgba(0,0,0,0.4)`     | Cards, buttons    |
| `--shadow-lg`   | `0 10px 15px rgba(0,0,0,0.5)`   | Modals, dropdowns |
| `--shadow-glow` | `0 0 20px rgba(139,92,246,0.3)` | Glow effect       |

---

## Component Specs

### Buttons

```css
/* Primary Button - Gradient */
.btn-primary {
  background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
  transition: all 200ms ease;
  cursor: pointer;
  border: none;
}

.btn-primary:hover {
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.4);
  transform: translateY(-1px);
}

/* Secondary Button - Ghost */
.btn-secondary {
  background: transparent;
  color: #fafafa;
  border: 1px solid #3f3f46;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-secondary:hover {
  background: #27272a;
  border-color: #52525b;
}

/* CTA Button - Cyan Accent */
.btn-cta {
  background: #22d3ee;
  color: #09090b;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  transition: all 200ms ease;
  cursor: pointer;
  border: none;
}

.btn-cta:hover {
  background: #06b6d4;
  box-shadow: 0 0 20px rgba(34, 211, 238, 0.3);
}
```

### Cards

```css
/* Base Card */
.card {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 12px;
  padding: 24px;
  transition: all 200ms ease;
}

.card:hover {
  border-color: #3f3f46;
  background: #1f1f23;
}

/* Interactive Card */
.card-interactive {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 12px;
  padding: 24px;
  transition: all 200ms ease;
  cursor: pointer;
}

.card-interactive:hover {
  border-color: #8b5cf6;
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.15);
  transform: translateY(-2px);
}

/* Glass Card */
.card-glass {
  background: rgba(24, 24, 27, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(63, 63, 70, 0.5);
  border-radius: 12px;
  padding: 24px;
}
```

### Inputs

```css
.input {
  background: #18181b;
  color: #fafafa;
  padding: 10px 14px;
  border: 1px solid #3f3f46;
  border-radius: 8px;
  font-size: 14px;
  transition: all 200ms ease;
}

.input::placeholder {
  color: #71717a;
}

.input:focus {
  border-color: #8b5cf6;
  outline: none;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
}

.input:hover:not(:focus) {
  border-color: #52525b;
}
```

### Modals/Dialogs

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
}

.modal {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
  max-width: 500px;
  width: 90%;
}

.modal-header {
  font-size: 18px;
  font-weight: 600;
  color: #fafafa;
  margin-bottom: 16px;
}
```

### Navigation

```css
.nav {
  background: rgba(9, 9, 11, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid #27272a;
  padding: 12px 24px;
}

.nav-item {
  color: #a1a1aa;
  font-size: 14px;
  font-weight: 500;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 150ms ease;
  cursor: pointer;
}

.nav-item:hover {
  color: #fafafa;
  background: #27272a;
}

.nav-item.active {
  color: #fafafa;
  background: #27272a;
}
```

### Sidebar

```css
.sidebar {
  background: #0f0f12;
  border-right: 1px solid #27272a;
  width: 260px;
  padding: 16px;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  color: #a1a1aa;
  font-size: 14px;
  transition: all 150ms ease;
  cursor: pointer;
}

.sidebar-item:hover {
  background: #18181b;
  color: #fafafa;
}

.sidebar-item.active {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%);
  color: #fafafa;
  border: 1px solid rgba(139, 92, 246, 0.3);
}
```

### Badges/Tags

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
}

.badge-primary {
  background: rgba(139, 92, 246, 0.15);
  color: #a78bfa;
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.badge-success {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.badge-warning {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.badge-error {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}
```

---

## Animation & Effects

### Transitions

```css
/* Default transition */
.transition-default {
  transition: all 200ms ease;
}

/* Fast for micro-interactions */
.transition-fast {
  transition: all 150ms ease;
}

/* Slow for modals, overlays */
.transition-slow {
  transition: all 300ms ease;
}
```

### Hover Effects

```css
/* Glow on hover */
.hover-glow:hover {
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
}

/* Lift on hover */
.hover-lift:hover {
  transform: translateY(-2px);
}

/* Scale on hover (use sparingly) */
.hover-scale:hover {
  transform: scale(1.02);
}
```

### Loading States

```css
/* Pulse animation for loading */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.loading-pulse {
  animation: pulse 2s ease-in-out infinite;
}

/* Skeleton loader */
.skeleton {
  background: linear-gradient(90deg, #27272a 0%, #3f3f46 50%, #27272a 100%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8px;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* AI Typing indicator */
.typing-indicator {
  display: flex;
  gap: 4px;
}

.typing-dot {
  width: 8px;
  height: 8px;
  background: #8b5cf6;
  border-radius: 50%;
  animation: typing-bounce 1.4s infinite ease-in-out both;
}

.typing-dot:nth-child(1) {
  animation-delay: -0.32s;
}
.typing-dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typing-bounce {
  0%,
  80%,
  100% {
    transform: scale(0.6);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
```

---

## Style Guidelines

**Style:** Manus-inspired Dark AI Theme

**Keywords:** Dark mode, deep purple, cyan accents, AI-native, modern, minimal, professional, glass effects, gradient borders, glow effects

**Best For:** AI platforms, agent builders, developer tools, SaaS dashboards, workflow editors

**Key Effects:**

- Gradient buttons with glow on hover
- Glass morphism cards
- Subtle purple glow effects
- Mesh gradient backgrounds
- Smooth 200ms transitions
- Typing indicators for AI interactions

---

## Anti-Patterns (Do NOT Use)

- ❌ Pure white backgrounds
- ❌ Light mode as default
- ❌ Bright/neon colors without purpose
- ❌ Generic AI purple/pink gradients (be subtle)
- ❌ Heavy drop shadows (use glow instead)
- ❌ Emojis as icons — Use SVG icons (Lucide, Heroicons)
- ❌ Missing cursor:pointer on clickable elements
- ❌ Layout-shifting hovers
- ❌ Instant state changes (always use transitions)
- ❌ Low contrast text (maintain 4.5:1 minimum)

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] Dark theme is default
- [ ] No emojis used as icons (use Lucide/Heroicons SVG)
- [ ] All icons use consistent stroke width (1.5-2px)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-200ms)
- [ ] Focus states visible with purple ring
- [ ] Text contrast meets WCAG AA (4.5:1)
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile
- [ ] Loading states for async operations
- [ ] Empty states designed beautifully---## Tailwind CSS Config Extension`js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        background: '#09090B',
        surface: '#18181B',
        'surface-elevated': '#27272A',
        border: '#3F3F46',
        primary: {
          DEFAULT: '#8B5CF6',
          hover: '#A78BFA',
          muted: 'rgba(139, 92, 246, 0.15)',
        },
        secondary: '#6366F1',
        accent: '#22D3EE',
      },
      boxShadow: {
        'glow-sm': '0 0 10px rgba(139, 92, 246, 0.2)',
        'glow': '0 0 20px rgba(139, 92, 246, 0.3)',
        'glow-lg': '0 0 30px rgba(139, 92, 246, 0.4)',
        'glow-cyan': '0 0 20px rgba(34, 211, 238, 0.3)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
        'gradient-radial': 'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
      },
    },
  },
}
`---## CSS Variables for globals.css```css
      :root {
      /_ Colors _/
      --background: 9 9 11; /_ #09090B _/
      --foreground: 250 250 250; /_ #FAFAFA _/
      --card: 24 24 27; /_ #18181B _/
      --card-foreground: 250 250 250;
      --popover: 24 24 27;
      --popover-foreground: 250 250 250;
      --primary: 139 92 246; /_ #8B5CF6 _/
      --primary-foreground: 250 250 250;
      --secondary: 39 39 42; /_ #27272A _/
      --secondary-foreground: 250 250 250;
      --muted: 39 39 42;
      --muted-foreground: 161 161 170; /_ #A1A1AA _/
      --accent: 34 211 238; /_ #22D3EE _/
      --accent-foreground: 9 9 11;
      --destructive: 239 68 68; /_ #EF4444 _/
      --destructive-foreground: 250 250 250;
      --border: 63 63 70; /_ #3F3F46 _/
      --input: 63 63 70;
      --ring: 139 92 246; /_ #8B5CF6 _/
      --radius: 0.5rem;
      }

```

---

## Tailwind CSS 速查表

### 背景色

| 用途 | 类名 | 颜色值 |
|------|------|--------|
| 页面背景 | `bg-[#09090B]` | #09090B |
| 侧边栏背景 | `bg-[#0F0F12]` | #0F0F12 |
| 卡片/面板背景 | `bg-[#18181B]` | #18181B |
| 悬停/次级背景 | `bg-[#27272A]` | #27272A |
| 紫色渐变背景 | `bg-gradient-to-r from-violet-500 to-indigo-500` | - |
| 半透明紫色 | `bg-violet-500/15` | rgba(139, 92, 246, 0.15) |

### 边框

| 用途 | 类名 | 颜色值 |
|------|------|--------|
| 默认边框 | `border-[#27272A]` | #27272A |
| 输入框边框 | `border-[#3F3F46]` | #3F3F46 |
| 紫色边框 (选中/focus) | `border-violet-500` | #8B5CF6 |
| 紫色半透明边框 | `border-violet-500/30` | rgba(139, 92, 246, 0.3) |

### 文字颜色

| 用途 | 类名 | 颜色值 |
|------|------|--------|
| 主文字 | `text-zinc-50` | #FAFAFA |
| 次要文字 | `text-zinc-400` | #A1A1AA |
| 静音文字 | `text-zinc-500` | #71717A |
| 紫色文字 | `text-violet-400` / `text-violet-500` | #A78BFA / #8B5CF6 |
| 绿色文字 | `text-green-400` | #4ADE80 |
| 红色文字 | `text-red-400` | #F87171 |

### 发光效果

| 用途 | 类名 |
|------|------|
| 紫色发光 | `shadow-[0_0_20px_rgba(139,92,246,0.3)]` |
| 淡紫色发光 | `shadow-[0_0_20px_rgba(139,92,246,0.15)]` |
| 强紫色发光 | `shadow-[0_0_30px_rgba(139,92,246,0.4)]` |

### 常用 Hover 效果

| 效果 | 类名组合 |
|------|----------|
| 背景变亮 | `hover:bg-[#27272A]` |
| 紫色边框 | `hover:border-violet-500` |
| 发光 + 上移 | `hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:-translate-y-0.5` |
| 紫色发光卡片 | `hover:border-violet-500 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)]` |

### 常用 Focus 效果

| 效果 | 类名组合 |
|------|----------|
| 紫色边框 + 发光 | `focus:border-violet-500 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.2)]` |
| 移除默认轮廓 | `focus:outline-none` |

### 布局常用

| 用途 | 类名 |
|------|------|
| 全屏居中 | `min-h-screen flex items-center justify-center` |
| 侧边栏宽度 | `w-[260px]` 或 `w-[240px]` |
| 配置面板宽度 | `w-[320px]` |
| 卡片最大宽度 | `max-w-[400px]` |
| 内容最大宽度 | `max-w-[800px]` |
| 卡片网格 | `grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-5` |

### 节点类型颜色 (编辑器)

| 类型 | 背景类名 | 图标类名 |
|------|----------|----------|
| AI/LLM | `bg-violet-500/20` | `text-violet-400` |
| Logic | `bg-cyan-500/20` | `text-cyan-400` |
| Data | `bg-green-500/20` | `text-green-400` |
| Integration | `bg-orange-500/20` | `text-orange-400` |
| I/O | `bg-pink-500/20` | `text-pink-400` |
| Code | `bg-zinc-500/20` | `text-zinc-400` |

### Badge 变体

| 变体 | 背景 | 边框 | 文字 |
|------|------|------|------|
| primary | `bg-violet-500/15` | `border-violet-500/30` | `text-violet-400` |
| success | `bg-green-500/15` | `border-green-500/30` | `text-green-400` |
| warning | `bg-yellow-500/15` | `border-yellow-500/30` | `text-yellow-400` |
| error | `bg-red-500/15` | `border-red-500/30` | `text-red-400` |
| secondary | `bg-zinc-500/15` | `border-zinc-500/30` | `text-zinc-400` |
```
