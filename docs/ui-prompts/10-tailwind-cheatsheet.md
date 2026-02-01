# 10 - Tailwind 速查表

Manus 风格常用 Tailwind 类名速查

---

## 背景色

| 用途 | 类名 | 颜色值 |
|------|------|--------|
| 页面背景 | `bg-[#09090B]` | #09090B |
| 侧边栏背景 | `bg-[#0F0F12]` | #0F0F12 |
| 卡片/面板背景 | `bg-[#18181B]` | #18181B |
| 悬停/次级背景 | `bg-[#27272A]` | #27272A |
| 紫色渐变背景 | `bg-gradient-to-r from-violet-500 to-indigo-500` | - |
| 半透明紫色 | `bg-violet-500/15` | rgba(139, 92, 246, 0.15) |

---

## 边框

| 用途 | 类名 | 颜色值 |
|------|------|--------|
| 默认边框 | `border-[#27272A]` | #27272A |
| 输入框边框 | `border-[#3F3F46]` | #3F3F46 |
| 紫色边框 (选中/focus) | `border-violet-500` | #8B5CF6 |
| 紫色半透明边框 | `border-violet-500/30` | rgba(139, 92, 246, 0.3) |
| 红色边框 (危险) | `border-red-500/20` | rgba(239, 68, 68, 0.2) |

---

## 文字颜色

| 用途 | 类名 | 颜色值 |
|------|------|--------|
| 主文字 | `text-zinc-50` | #FAFAFA |
| 次要文字 | `text-zinc-400` | #A1A1AA |
| 静音文字 | `text-zinc-500` | #71717A |
| 紫色文字 | `text-violet-400` | #A78BFA |
| 紫色文字 (主) | `text-violet-500` | #8B5CF6 |
| 绿色文字 | `text-green-400` | #4ADE80 |
| 红色文字 | `text-red-400` | #F87171 |
| 黄色文字 | `text-yellow-400` | #FBBF24 |

---

## 渐变

| 用途 | 类名 |
|------|------|
| 紫色渐变按钮 | `bg-gradient-to-r from-violet-500 to-indigo-500` |
| 半透明渐变背景 | `bg-gradient-to-br from-violet-500/20 to-indigo-500/20` |
| 半透明渐变背景 (淡) | `bg-gradient-to-br from-violet-500/15 to-indigo-500/15` |

---

## 发光效果

| 用途 | 类名 |
|------|------|
| 紫色发光 | `shadow-[0_0_20px_rgba(139,92,246,0.3)]` |
| 淡紫色发光 | `shadow-[0_0_20px_rgba(139,92,246,0.15)]` |
| 强紫色发光 | `shadow-[0_0_30px_rgba(139,92,246,0.4)]` |
| 青色发光 | `shadow-[0_0_20px_rgba(34,211,238,0.3)]` |

---

## 圆角

| 用途 | 类名 | 像素值 |
|------|------|--------|
| 小圆角 | `rounded-md` | 6px |
| 标准圆角 | `rounded-lg` | 8px |
| 大圆角 | `rounded-xl` | 12px |
| 超大圆角 | `rounded-2xl` | 16px |
| 药丸形 | `rounded-full` | 9999px |

---

## 过渡动画

| 用途 | 类名 |
|------|------|
| 全属性过渡 (200ms) | `transition-all duration-200` |
| 全属性过渡 (150ms) | `transition-all duration-150` |
| 全属性过渡 (300ms) | `transition-all duration-300` |
| 颜色过渡 | `transition-colors duration-150` |

---

## 常用 Hover 效果

| 效果 | 类名组合 |
|------|----------|
| 背景变亮 | `hover:bg-[#27272A]` |
| 紫色边框 | `hover:border-violet-500` |
| 发光 + 上移 | `hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:-translate-y-0.5` |
| 文字变亮 | `hover:text-zinc-50` |
| 紫色发光卡片 | `hover:border-violet-500 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)]` |

---

## 常用 Focus 效果

| 效果 | 类名组合 |
|------|----------|
| 紫色边框 + 发光 | `focus:border-violet-500 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.2)]` |
| 移除默认轮廓 | `focus:outline-none` |
| Focus Ring | `focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-[#09090B]` |

---

## 布局常用

| 用途 | 类名 |
|------|------|
| 全屏居中 | `min-h-screen flex items-center justify-center` |
| 侧边栏宽度 | `w-[260px]` 或 `w-[240px]` |
| 配置面板宽度 | `w-[320px]` |
| 卡片最大宽度 | `max-w-[400px]` |
| 内容最大宽度 | `max-w-[800px]` |
| 卡片网格 | `grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-5` |

---

## 节点类型颜色 (编辑器)

| 类型 | 背景类名 | 图标类名 |
|------|----------|----------|
| AI/LLM | `bg-violet-500/20` | `text-violet-400` |
| Logic | `bg-cyan-500/20` | `text-cyan-400` |
| Data | `bg-green-500/20` | `text-green-400` |
| Integration | `bg-orange-500/20` | `text-orange-400` |
| I/O | `bg-pink-500/20` | `text-pink-400` |
| Code | `bg-zinc-500/20` | `text-zinc-400` |

---

## Badge 变体

| 变体 | 背景 | 边框 | 文字 |
|------|------|------|------|
| primary | `bg-violet-500/15` | `border-violet-500/30` | `text-violet-400` |
| success | `bg-green-500/15` | `border-green-500/30` | `text-green-400` |
| warning | `bg-yellow-500/15` | `border-yellow-500/30` | `text-yellow-400` |
| error | `bg-red-500/15` | `border-red-500/30` | `text-red-400` |
| secondary | `bg-zinc-500/15` | `border-zinc-500/30` | `text-zinc-400` |
