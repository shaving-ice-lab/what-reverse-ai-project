# Supabase 色彩系统

完整的 Supabase 调色板参考。

## 品牌色 (Brand)

主要强调色，用于 CTA 按钮、链接、重要高亮等。

| 名称 | HEX | RGB | 用途 |
|------|-----|-----|------|
| brand-200 | `#1a3a2a` | `26, 58, 42` | 深色背景叠加 |
| brand-300 | `#1f4a35` | `31, 74, 53` | 深色悬停态 |
| brand-400 | `#2a6348` | `42, 99, 72` | 中等深度 |
| brand-500 | `#3ECF8E` | `62, 207, 142` | **主品牌色** |
| brand-600 | `#5fd9a3` | `95, 217, 163` | 悬停高亮 |

### CSS 变量

```css
:root {
  --brand-200: 152 38% 16%;
  --brand-300: 152 41% 21%;
  --brand-400: 152 40% 28%;
  --brand-500: 153 68% 52%;
  --brand-600: 153 60% 61%;
}
```

## 背景色 (Background)

用于页面和区域背景。

| 名称 | HEX | RGB | 用途 |
|------|-----|-----|------|
| bg | `#171717` | `23, 23, 23` | 主背景 (www/docs) |
| bg-200 | `#1c1c1c` | `28, 28, 28` | 略浅背景 |
| bg-studio | `#0f0f0f` | `15, 15, 15` | Dashboard 背景 |
| bg-alternative | `#0a0a0a` | `10, 10, 10` | 最深背景/数据网格 |

### Surface 层级

用于创造视觉层次的表面色。

| 名称 | HEX | RGB | 用途 |
|------|-----|-----|------|
| surface-75 | `#1a1a1a` | `26, 26, 26` | 最浅表面 |
| surface-100 | `#1f1f1f` | `31, 31, 31` | 卡片/面板 |
| surface-200 | `#262626` | `38, 38, 38` | 输入框/表头 |
| surface-300 | `#2e2e2e` | `46, 46, 46` | 悬停态 |
| surface-400 | `#363636` | `54, 54, 54` | 激活态 |

```css
:root {
  --background: 0 0% 9%;
  --background-200: 0 0% 11%;
  --background-studio: 0 0% 6%;
  --background-alternative: 0 0% 4%;
  
  --surface-75: 0 0% 10%;
  --surface-100: 0 0% 12%;
  --surface-200: 0 0% 15%;
  --surface-300: 0 0% 18%;
  --surface-400: 0 0% 21%;
}
```

## 文字色 (Text)

| 名称 | HEX | RGB | 用途 |
|------|-----|-----|------|
| text | `#ededed` | `237, 237, 237` | 主文字 |
| text-light | `#a3a3a3` | `163, 163, 163` | 次要文字 |
| text-lighter | `#6b6b6b` | `107, 107, 107` | 辅助文字 |
| text-muted | `#525252` | `82, 82, 82` | 占位符/禁用 |
| text-contrast | `#ffffff` | `255, 255, 255` | 高对比度 |

```css
:root {
  --foreground: 0 0% 93%;
  --foreground-light: 0 0% 64%;
  --foreground-lighter: 0 0% 42%;
  --foreground-muted: 0 0% 32%;
}
```

## 边框色 (Border)

| 名称 | HEX | RGB | 用途 |
|------|-----|-----|------|
| border | `#2e2e2e` | `46, 46, 46` | 默认边框 |
| border-muted | `#262626` | `38, 38, 38` | 细微边框 |
| border-secondary | `#333333` | `51, 51, 51` | 二级边框 |
| border-strong | `#404040` | `64, 64, 64` | 强调边框 |
| border-stronger | `#525252` | `82, 82, 82` | 最强边框 |

```css
:root {
  --border: 0 0% 18%;
  --border-muted: 0 0% 15%;
  --border-secondary: 0 0% 20%;
  --border-strong: 0 0% 25%;
  --border-stronger: 0 0% 32%;
}
```

## 语义色 (Semantic)

### Destructive (错误/危险)

| 名称 | HEX | 用途 |
|------|-----|------|
| destructive-200 | `#3b1818` | 背景 |
| destructive-300 | `#5c1d1d` | 深色调 |
| destructive-400 | `#dc2626` | 文字/图标 |
| destructive | `#ef4444` | 主色 |

### Warning (警告)

| 名称 | HEX | 用途 |
|------|-----|------|
| warning-200 | `#3b2e0a` | 背景 |
| warning-300 | `#5c4a10` | 深色调 |
| warning-400 | `#d97706` | 文字/图标 |
| warning | `#f59e0b` | 主色 |

### Success

使用 brand 色系表示成功状态。

```css
:root {
  --destructive-200: 0 45% 16%;
  --destructive-400: 0 74% 50%;
  --destructive: 0 84% 60%;
  
  --warning-200: 40 74% 14%;
  --warning-400: 32 95% 44%;
  --warning: 38 92% 50%;
}
```

## 覆盖层 (Overlay)

| 名称 | HEX / RGBA | 用途 |
|------|------------|------|
| overlay | `rgba(0,0,0,0.8)` | Modal 背景 |
| overlay-hover | `rgba(0,0,0,0.6)` | 较浅覆盖 |

## 完整 CSS 变量配置

```css
@layer base {
  :root {
    /* Background */
    --background: 0 0% 9%;
    --background-200: 0 0% 11%;
    --background-studio: 0 0% 6%;
    --background-alternative: 0 0% 4%;
    
    /* Surface */
    --surface-75: 0 0% 10%;
    --surface-100: 0 0% 12%;
    --surface-200: 0 0% 15%;
    --surface-300: 0 0% 18%;
    --surface-400: 0 0% 21%;
    
    /* Foreground */
    --foreground: 0 0% 93%;
    --foreground-light: 0 0% 64%;
    --foreground-lighter: 0 0% 42%;
    --foreground-muted: 0 0% 32%;
    
    /* Border */
    --border: 0 0% 18%;
    --border-muted: 0 0% 15%;
    --border-strong: 0 0% 25%;
    --border-stronger: 0 0% 32%;
    
    /* Brand */
    --brand-200: 152 38% 16%;
    --brand-300: 152 41% 21%;
    --brand-400: 152 40% 28%;
    --brand-500: 153 68% 52%;
    --brand-600: 153 60% 61%;
    
    /* Semantic */
    --destructive-200: 0 45% 16%;
    --destructive-400: 0 74% 50%;
    --destructive: 0 84% 60%;
    
    --warning-200: 40 74% 14%;
    --warning-400: 32 95% 44%;
    --warning: 38 92% 50%;
    
    /* Components */
    --card: 0 0% 12%;
    --card-foreground: 0 0% 93%;
    --popover: 0 0% 12%;
    --popover-foreground: 0 0% 93%;
    --primary: 153 68% 52%;
    --primary-foreground: 0 0% 9%;
    --secondary: 0 0% 15%;
    --secondary-foreground: 0 0% 93%;
    --muted: 0 0% 15%;
    --muted-foreground: 0 0% 64%;
    --accent: 0 0% 15%;
    --accent-foreground: 0 0% 93%;
    --destructive-foreground: 0 0% 93%;
    --input: 0 0% 18%;
    --ring: 153 68% 52%;
    --radius: 0.5rem;
  }
  
  /* Light theme (optional) */
  .light {
    --background: 0 0% 100%;
    --foreground: 0 0% 9%;
    --surface-100: 0 0% 98%;
    --surface-200: 0 0% 96%;
    --border: 0 0% 90%;
    --brand-500: 153 68% 42%;
  }
}
```

## Tailwind 配色方案

在 `tailwind.config.ts` 中使用：

```typescript
import { Config } from 'tailwindcss'

const config: Config = {
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: 'hsl(var(--background))',
          200: 'hsl(var(--background-200))',
          studio: 'hsl(var(--background-studio))',
          alternative: 'hsl(var(--background-alternative))',
        },
        surface: {
          75: 'hsl(var(--surface-75))',
          100: 'hsl(var(--surface-100))',
          200: 'hsl(var(--surface-200))',
          300: 'hsl(var(--surface-300))',
          400: 'hsl(var(--surface-400))',
        },
        foreground: {
          DEFAULT: 'hsl(var(--foreground))',
          light: 'hsl(var(--foreground-light))',
          lighter: 'hsl(var(--foreground-lighter))',
          muted: 'hsl(var(--foreground-muted))',
        },
        border: {
          DEFAULT: 'hsl(var(--border))',
          muted: 'hsl(var(--border-muted))',
          strong: 'hsl(var(--border-strong))',
          stronger: 'hsl(var(--border-stronger))',
        },
        brand: {
          200: 'hsl(var(--brand-200))',
          300: 'hsl(var(--brand-300))',
          400: 'hsl(var(--brand-400))',
          500: 'hsl(var(--brand-500))',
          600: 'hsl(var(--brand-600))',
          DEFAULT: 'hsl(var(--brand-500))',
        },
        destructive: {
          200: 'hsl(var(--destructive-200))',
          400: 'hsl(var(--destructive-400))',
          DEFAULT: 'hsl(var(--destructive))',
        },
        warning: {
          200: 'hsl(var(--warning-200))',
          400: 'hsl(var(--warning-400))',
          DEFAULT: 'hsl(var(--warning))',
        },
      },
    },
  },
}

export default config
```
