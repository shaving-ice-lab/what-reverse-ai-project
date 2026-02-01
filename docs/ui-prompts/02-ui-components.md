# 02 - UI 组件库

**目标文件**: `apps/web/src/components/ui/`

---

```
/ui-ux-pro-max

请优化 AgentFlow 的 UI 组件库，使其符合 Manus 风格。

## 文件位置
- apps/web/src/components/ui/button.tsx
- apps/web/src/components/ui/card.tsx
- apps/web/src/components/ui/input.tsx
- apps/web/src/components/ui/dialog.tsx
- apps/web/src/components/ui/loading.tsx
- apps/web/src/components/ui/empty-state.tsx
- apps/web/src/components/ui/badge.tsx

## 设计规范
参考: design-system/agentflow/MASTER.md

## Button 组件

变体:
- default: 紫色渐变背景 (linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)), hover 发光
- secondary: ghost 样式, 边框 #3F3F46, hover 背景 #27272A
- destructive: 红色边框, hover 填充红色
- ghost: 透明背景, hover 背景 #27272A
- link: 紫色文字, hover 下划线

尺寸:
- sm: padding 6px 12px, font-size 13px
- default: padding 10px 20px, font-size 14px
- lg: padding 12px 28px, font-size 16px

所有按钮:
- cursor: pointer
- transition: all 200ms ease
- border-radius: 8px
- font-weight: 500

## Card 组件

- 背景: #18181B
- 边框: 1px solid #27272A
- 圆角: 12px
- padding: 24px
- hover 变体 (card-interactive): 紫色边框 + box-shadow glow + translateY(-2px)

## Input 组件

- 背景: #18181B (或 #0F0F12 用于深色表单)
- 边框: 1px solid #3F3F46
- 圆角: 8px
- padding: 10px 14px
- focus: 紫色边框 (#8B5CF6) + box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2)
- placeholder 颜色: #71717A

## Dialog 组件

- Overlay: rgba(0, 0, 0, 0.8) + backdrop-filter: blur(8px)
- Content 背景: #18181B
- Content 边框: 1px solid #27272A
- Content 圆角: 16px
- 入场动画: fadeIn + scale

## Loading 组件

- Spinner: 紫色渐变 (#8B5CF6)
- Skeleton: shimmer 动画
  - 背景: linear-gradient(90deg, #27272A 0%, #3F3F46 50%, #27272A 100%)
  - animation: shimmer 1.5s infinite

## Empty State 组件

- 图标容器: 80x80, 紫色渐变背景, 圆角 20px
- 标题: 18px, font-weight 600, #FAFAFA
- 描述: 14px, #A1A1AA, max-width 400px
- 操作按钮: 居中

## Badge 组件

变体 (都使用半透明背景 + 对应颜色边框):
- default/primary: rgba(139, 92, 246, 0.15), border rgba(139, 92, 246, 0.3), color #A78BFA
- success: rgba(34, 197, 94, 0.15), border rgba(34, 197, 94, 0.3), color #4ADE80
- warning: rgba(245, 158, 11, 0.15), border rgba(245, 158, 11, 0.3), color #FBBF24
- error: rgba(239, 68, 68, 0.15), border rgba(239, 68, 68, 0.3), color #F87171
- secondary: rgba(161, 161, 170, 0.15), border rgba(161, 161, 170, 0.3), color #A1A1AA

样式:
- padding: 4px 10px
- border-radius: 9999px (pill)
- font-size: 12px
- font-weight: 500
```
