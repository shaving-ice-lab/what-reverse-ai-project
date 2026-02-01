# 03 - 认证布局

**目标文件**: `apps/web/src/app/(auth)/layout.tsx`

---

```
/ui-ux-pro-max

请重构 AgentFlow 的认证页面布局组件。

## 文件位置
- apps/web/src/app/(auth)/layout.tsx

## 设计规范
参考:
- design-system/agentflow/MASTER.md
- design-system/agentflow/pages/auth.md

## 布局结构

Auth Layout
├── Full-screen container (min-h-screen, flex, items-center, justify-center)
│   ├── Mesh gradient background (absolute, inset-0)
│   └── Content wrapper (relative, z-10)
│       └── {children}

## 背景样式

.auth-background {
  background-color: #09090B;
  background-image: 
    radial-gradient(at 0% 0%, hsla(268, 90%, 55%, 0.2) 0px, transparent 50%),
    radial-gradient(at 100% 100%, hsla(189, 100%, 56%, 0.15) 0px, transparent 50%),
    radial-gradient(at 50% 50%, hsla(268, 90%, 55%, 0.1) 0px, transparent 50%);
  min-height: 100vh;
}

## Tailwind 实现

<div className="min-h-screen flex items-center justify-center relative">
  {/* Mesh gradient background */}
  <div 
    className="absolute inset-0 bg-[#09090B]"
    style={{
      backgroundImage: `
        radial-gradient(at 0% 0%, hsla(268, 90%, 55%, 0.2) 0px, transparent 50%),
        radial-gradient(at 100% 100%, hsla(189, 100%, 56%, 0.15) 0px, transparent 50%),
        radial-gradient(at 50% 50%, hsla(268, 90%, 55%, 0.1) 0px, transparent 50%)
      `
    }}
  />
  
  {/* Content */}
  <div className="relative z-10 w-full px-4">
    {children}
  </div>
</div>

## 响应式
- 移动端: padding 16px (px-4)
- 桌面端: 内容居中显示
```
