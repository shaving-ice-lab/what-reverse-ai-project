# 06 - 仪表板布局

**目标文件**: `apps/web/src/app/(dashboard)/layout.tsx`

---

```
/ui-ux-pro-max

请重构 AgentFlow 的仪表板布局组件，使用 Manus 风格。

## 文件位置
- apps/web/src/app/(dashboard)/layout.tsx

## 设计规范
参考：
- design-system/agentflow/MASTER.md
- design-system/agentflow/pages/dashboard.md

## 布局结构

Dashboard Layout (flex, min-h-screen)
├── Sidebar (w-[260px], fixed, left-0, top-0, bottom-0)
│   ├── Header (Logo + 品牌名)
│   ├── Navigation (flex-1)
│   │   ├── Nav Item: 工作流 (Layers icon)
│   │   ├── Nav Item: 模板 (LayoutTemplate icon)
│   │   ├── Nav Item: 执行历史 (Play icon)
│   │   └── Nav Item: 设置 (Settings icon)
│   └── User Profile (底部)
│       ├── Avatar
│       ├── Username
│       └── Dropdown Menu
└── Main Content (ml-[260px], flex-1)
    └── {children}

## 侧边栏样式

.sidebar {
  background: #0F0F12;
  border-right: 1px solid #27272A;
  padding: 16px;
}

## Logo 区域
- padding: 12px
- margin-bottom: 24px
- Logo 图标或 SVG + "AgentFlow" 文字
- font-size: 18px, font-weight: 600

## 导航项样式

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 14px;
  color: #A1A1AA;
  cursor: pointer;
  transition: all 150ms ease;
}

.nav-item:hover {
  background: #18181B;
  color: #FAFAFA;
}

.nav-item.active {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%);
  color: #FAFAFA;
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.nav-item-icon {
  width: 20px;
  height: 20px;
}

## 用户资料区域

.user-profile {
  padding: 12px;
  border-top: 1px solid #27272A;
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #27272A;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #FAFAFA;
}

.user-email {
  font-size: 12px;
  color: #71717A;
}

## 导航图标 (使用 Lucide)
- 工作流: Layers
- 模板: LayoutTemplate
- 执行历史: History 或 Play
- 设置: Settings

## 响应式 (可选)
- 移动端: 侧边栏变为底部导航或抽屉菜单

保持原有的导航路由和用户状态逻辑。
```
