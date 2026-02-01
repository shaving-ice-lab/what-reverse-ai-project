# 01 - 全局样式 (globals.css)

**目标文件**: `apps/web/src/app/globals.css`

---

```
/ui-ux-pro-max

请更新 AgentFlow 的全局样式文件，应用 Manus 风格的 CSS 变量。

## 文件位置
- apps/web/src/app/globals.css

## 设计规范
参考: design-system/agentflow/MASTER.md

## CSS 变量

:root {
  /* 背景色 */
  --background: 9 9 11;         /* #09090B */
  --foreground: 250 250 250;    /* #FAFAFA */
  
  /* 卡片/面板 */
  --card: 24 24 27;             /* #18181B */
  --card-foreground: 250 250 250;
  
  /* 弹出层 */
  --popover: 24 24 27;
  --popover-foreground: 250 250 250;
  
  /* 主色 (紫色) */
  --primary: 139 92 246;        /* #8B5CF6 */
  --primary-foreground: 250 250 250;
  
  /* 次要色 */
  --secondary: 39 39 42;        /* #27272A */
  --secondary-foreground: 250 250 250;
  
  /* 静音色 */
  --muted: 39 39 42;
  --muted-foreground: 161 161 170; /* #A1A1AA */
  
  /* 强调色 (青色) */
  --accent: 34 211 238;         /* #22D3EE */
  --accent-foreground: 9 9 11;
  
  /* 危险色 */
  --destructive: 239 68 68;     /* #EF4444 */
  --destructive-foreground: 250 250 250;
  
  /* 边框 */
  --border: 63 63 70;           /* #3F3F46 */
  --input: 63 63 70;
  --ring: 139 92 246;           /* #8B5CF6 */
  
  /* 圆角 */
  --radius: 0.5rem;
}

/* 全局样式 */
body {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  font-family: 'Inter', system-ui, sans-serif;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #18181B;
}

::-webkit-scrollbar-thumb {
  background: #3F3F46;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #52525B;
}

## Tailwind 配置扩展

在 tailwind.config.js 中添加:

extend: {
  colors: {
    surface: '#18181B',
    'surface-elevated': '#27272A',
  },
  boxShadow: {
    'glow': '0 0 20px rgba(139, 92, 246, 0.3)',
    'glow-lg': '0 0 30px rgba(139, 92, 246, 0.4)',
  },
  backgroundImage: {
    'gradient-primary': 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
  },
}
```
