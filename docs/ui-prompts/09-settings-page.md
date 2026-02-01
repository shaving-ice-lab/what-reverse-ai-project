# 09 - 设置页面

**目标文件**: `apps/web/src/app/(dashboard)/settings/`

---

```
/ui-ux-pro-max

请重构 AgentFlow 的设置页面，使用 Manus 风格。

## 文件位置
- apps/web/src/app/(dashboard)/settings/page.tsx
- apps/web/src/app/(dashboard)/settings/layout.tsx
- apps/web/src/app/(dashboard)/settings/profile/page.tsx
- apps/web/src/app/(dashboard)/settings/api-keys/page.tsx
- apps/web/src/app/(dashboard)/settings/local-llm/page.tsx

## 设计规范
参考：
- design-system/agentflow/MASTER.md
- design-system/agentflow/pages/settings.md

## 布局结构

Settings Layout (flex)
├── Settings Sidebar (w-[240px])
│   ├── Back Link
│   ├── Account Section
│   │   ├── 个人资料
│   │   └── 偏好设置
│   ├── Configuration Section
│   │   ├── API 密钥
│   │   └── 本地 LLM
│   └── Danger Zone
│       └── 删除账户
└── Content Area (flex-1, max-w-[800px])
    └── {children}

## Settings Layout

<div className="flex min-h-screen bg-[#09090B]">
  {/* 设置侧边栏 */}
  <aside className="w-[240px] bg-[#0F0F12] border-r border-[#27272A] p-4">
    {/* 返回链接 */}
    <Link href="/workflows" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-50 mb-6">
      <ChevronLeft className="w-4 h-4" />
      返回仪表板
    </Link>
    
    {/* 导航分组 */}
    <div className="space-y-6">
      {/* 账户 */}
      <div>
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 px-3 mb-2">
          账户
        </h3>
        <nav className="space-y-1">
          <NavItem href="/settings/profile" icon={User}>个人资料</NavItem>
          <NavItem href="/settings" icon={Settings}>偏好设置</NavItem>
        </nav>
      </div>
      
      {/* 配置 */}
      <div>
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 px-3 mb-2">
          配置
        </h3>
        <nav className="space-y-1">
          <NavItem href="/settings/api-keys" icon={Key}>API 密钥</NavItem>
          <NavItem href="/settings/local-llm" icon={Cpu}>本地 LLM</NavItem>
        </nav>
      </div>
    </div>
  </aside>
  
  {/* 内容区域 */}
  <main className="flex-1 p-8 max-w-[800px]">
    {children}
  </main>
</div>

## NavItem 组件

function NavItem({ href, icon: Icon, children, active }) {
  return (
    <Link 
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
        active 
          ? "bg-gradient-to-r from-violet-500/15 to-indigo-500/15 text-zinc-50 border border-violet-500/30" 
          : "text-zinc-400 hover:bg-[#18181B] hover:text-zinc-50"
      )}
    >
      <Icon className="w-5 h-5" />
      {children}
    </Link>
  )
}

## 页面头部

<div className="mb-8">
  <h1 className="text-2xl font-semibold text-zinc-50">{title}</h1>
  <p className="text-sm text-zinc-400 mt-2">{description}</p>
</div>

## 设置卡片 (Section)

<div className="bg-[#18181B] border border-[#27272A] rounded-xl p-6 mb-6">
  <div className="mb-5">
    <h2 className="text-base font-semibold text-zinc-50">{title}</h2>
    {description && (
      <p className="text-sm text-zinc-400 mt-1">{description}</p>
    )}
  </div>
  {children}
</div>

## 表单字段

<div className="space-y-5">
  <div>
    <label className="text-sm font-medium text-zinc-50 mb-2 block">{label}</label>
    {hint && <p className="text-xs text-zinc-500 mb-2">{hint}</p>}
    <Input ... />
  </div>
</div>

## Toggle Row

<div className="flex items-center justify-between py-4 border-b border-[#27272A] last:border-0">
  <div>
    <div className="text-sm font-medium text-zinc-50">{label}</div>
    <div className="text-sm text-zinc-500 mt-0.5">{description}</div>
  </div>
  <Switch checked={...} onCheckedChange={...} />
</div>

## API Keys 页面

{/* API Key 列表 */}
<div className="space-y-3">
  {apiKeys.map(key => (
    <div key={key.id} className="flex items-center justify-between bg-[#0F0F12] border border-[#27272A] rounded-lg px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#18181B] flex items-center justify-center">
          <Key className="w-4 h-4 text-zinc-400" />
        </div>
        <div>
          <div className="text-sm font-medium text-zinc-50">{key.name}</div>
          <div className="text-xs font-mono text-zinc-500">
            {key.key.slice(0, 8)}...{key.key.slice(-4)}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Copy className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  ))}
</div>

{/* 添加按钮 */}
<button className="w-full mt-4 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-[#3F3F46] rounded-lg text-sm text-zinc-400 hover:border-violet-500 hover:text-zinc-50 hover:bg-violet-500/5 transition-all">
  <Plus className="w-4 h-4" />
  添加 API 密钥
</button>

## 危险区域

<div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
  <h2 className="text-base font-semibold text-red-400 mb-2">危险区域</h2>
  <p className="text-sm text-zinc-400 mb-4">
    删除账户后，所有数据将被永久删除且无法恢复。
  </p>
  <Button variant="destructive">
    删除账户
  </Button>
</div>

## 保存按钮区域

<div className="flex justify-end gap-3 pt-6 border-t border-[#27272A] mt-6">
  <Button variant="ghost">取消</Button>
  <Button className="bg-gradient-to-r from-violet-500 to-indigo-500">
    保存更改
  </Button>
</div>

保持原有的设置保存逻辑和 API 调用。
```
