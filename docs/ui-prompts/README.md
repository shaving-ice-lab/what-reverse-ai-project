# AgentFlow UI 重构 Prompt 指南

> **设计风格**: Manus-inspired Dark AI Theme  
> **设计规范**: `design-system/agentflow/`  
> **使用方法**: 在 Cursor 中输入 `/ui-ux-pro-max` 然后粘贴对应 Prompt 文件的内容

---

## Prompt 文件列表

| 序号 | 文件 | 描述 | 目标文件 |
|------|------|------|----------|
| 01 | [01-global-styles.md](./01-global-styles.md) | 全局样式 | `globals.css` |
| 02 | [02-ui-components.md](./02-ui-components.md) | UI 组件库 | `components/ui/*` |
| 03 | [03-auth-layout.md](./03-auth-layout.md) | 认证布局 | `(auth)/layout.tsx` |
| 04 | [04-login-page.md](./04-login-page.md) | 登录页面 | `(auth)/login/page.tsx` |
| 05 | [05-register-page.md](./05-register-page.md) | 注册页面 | `(auth)/register/page.tsx` |
| 06 | [06-dashboard-layout.md](./06-dashboard-layout.md) | 仪表板布局 | `(dashboard)/layout.tsx` |
| 07 | [07-workflow-list.md](./07-workflow-list.md) | 工作流列表 | `workflows/page.tsx` |
| 08 | [08-workflow-editor.md](./08-workflow-editor.md) | 工作流编辑器 | `editor/[id]/page.tsx` |
| 09 | [09-settings-page.md](./09-settings-page.md) | 设置页面 | `settings/*` |
| 10 | [10-tailwind-cheatsheet.md](./10-tailwind-cheatsheet.md) | Tailwind 速查表 | - |

---

## 重构顺序建议

```
1. 全局样式 (globals.css) ─────────────────┐
2. UI 组件库 (components/ui/) ─────────────┤ 基础层
3. 认证布局 + 登录/注册 ───────────────────┤
4. 仪表板布局 ─────────────────────────────┤ 页面层
5. 工作流列表 ─────────────────────────────┤
6. 设置页面 ───────────────────────────────┤
7. 工作流编辑器 (最复杂) ──────────────────┘
```

---

## 配色速查表

| 角色 | 颜色 | Tailwind |
|------|------|----------|
| Background | `#09090B` | `zinc-950` |
| Surface | `#18181B` | `zinc-900` |
| Surface Elevated | `#27272A` | `zinc-800` |
| Border | `#3F3F46` | `zinc-700` |
| Primary | `#8B5CF6` | `violet-500` |
| Primary Hover | `#A78BFA` | `violet-400` |
| CTA/Accent | `#22D3EE` | `cyan-400` |
| Text | `#FAFAFA` | `zinc-50` |
| Text Secondary | `#A1A1AA` | `zinc-400` |
| Text Muted | `#71717A` | `zinc-500` |
| Success | `#22C55E` | `green-500` |
| Error | `#EF4444` | `red-500` |

---

## 使用方法

1. 打开对应的 Prompt 文件
2. 复制文件中 `---` 分隔线之后的全部内容
3. 在 Cursor 中输入 `/ui-ux-pro-max`
4. 粘贴复制的内容并执行
