# 08 - 工作流编辑器

**目标文件**: `apps/web/src/app/editor/[id]/page.tsx` 及相关组件

---

```
/ui-ux-pro-max

请重构 AgentFlow 的工作流编辑器页面，使用 Manus 风格。

## 文件位置
- apps/web/src/app/editor/[id]/page.tsx
- apps/web/src/components/editor/WorkflowEditor.tsx
- apps/web/src/components/editor/EditorToolbar.tsx
- apps/web/src/components/editor/NodePanel.tsx
- apps/web/src/components/editor/ConfigPanel.tsx
- apps/web/src/components/editor/nodes/*.tsx

## 设计规范
参考：
- design-system/agentflow/MASTER.md
- design-system/agentflow/pages/editor.md

## 整体布局

Editor Page (h-screen, overflow-hidden)
├── Header/Toolbar (h-12, border-b)
├── Main Area (flex, flex-1)
│   ├── Node Panel (w-[260px], border-r)
│   ├── Canvas (flex-1)
│   └── Config Panel (w-[320px], border-l, 可折叠)
└── Execution Panel (可折叠, max-h-[300px])

## Header 样式

<header className="h-12 bg-[#0F0F12] border-b border-[#27272A] flex items-center justify-between px-4">
  {/* 左侧: 返回 + 面包屑 */}
  <div className="flex items-center gap-3">
    <Button variant="ghost" size="icon">
      <ChevronLeft className="w-4 h-4" />
    </Button>
    <span className="text-sm text-zinc-400">工作流</span>
    <ChevronRight className="w-4 h-4 text-zinc-600" />
    <span className="text-sm text-zinc-50 font-medium">{workflow.name}</span>
  </div>
  
  {/* 右侧: 操作按钮 */}
  <div className="flex items-center gap-2">
    <Button variant="ghost" size="sm">
      <Settings className="w-4 h-4 mr-2" />
      设置
    </Button>
    <Button variant="ghost" size="sm">
      <Save className="w-4 h-4 mr-2" />
      保存
    </Button>
    <Button size="sm" className="bg-gradient-to-r from-violet-500 to-indigo-500">
      <Play className="w-4 h-4 mr-2" />
      运行
    </Button>
  </div>
</header>

## Node Panel (左侧边栏)

<aside className="w-[260px] bg-[#0F0F12] border-r border-[#27272A] flex flex-col">
  {/* 搜索框 */}
  <div className="p-4 border-b border-[#27272A]">
    <div className="flex items-center gap-2 bg-[#18181B] border border-[#3F3F46] rounded-md px-3 py-2">
      <Search className="w-4 h-4 text-zinc-500" />
      <input 
        type="text" 
        placeholder="搜索节点..." 
        className="bg-transparent text-sm text-zinc-50 placeholder:text-zinc-500 outline-none flex-1"
      />
    </div>
  </div>
  
  {/* 节点列表 */}
  <div className="flex-1 overflow-y-auto">
    {/* 分类标题 */}
    <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
      AI 节点
    </div>
    
    {/* 节点项 */}
    <div className="px-2">
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-grab hover:bg-[#18181B] transition-colors">
        <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
          <Bot className="w-4 h-4 text-violet-400" />
        </div>
        <div>
          <div className="text-sm text-zinc-50">LLM 调用</div>
          <div className="text-[11px] text-zinc-500">调用大语言模型</div>
        </div>
      </div>
    </div>
  </div>
</aside>

## 节点类型颜色

| 类型 | 背景色 | 图标色 |
|------|--------|--------|
| AI/LLM | violet-500/20 | violet-400 |
| Logic | cyan-500/20 | cyan-400 |
| Data | green-500/20 | green-400 |
| Integration | orange-500/20 | orange-400 |
| I/O | pink-500/20 | pink-400 |
| Code | zinc-500/20 | zinc-400 |

## Canvas 样式

<div 
  className="flex-1 bg-[#09090B]"
  style={{
    backgroundImage: 'radial-gradient(circle at 1px 1px, #27272A 1px, transparent 0)',
    backgroundSize: '24px 24px'
  }}
>
  <ReactFlow nodes={nodes} edges={edges}>
    <MiniMap className="!bg-[#18181B] !border-[#27272A]" nodeColor="#3F3F46" />
    <Controls className="!bg-[#18181B] !border-[#27272A] !rounded-lg" />
  </ReactFlow>
</div>

## React Flow 主题覆盖

.react-flow__node {
  background: #18181B;
  border: 1px solid #3F3F46;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.4);
}

.react-flow__node.selected {
  border-color: #8B5CF6;
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.3);
}

.react-flow__edge-path {
  stroke: #3F3F46;
  stroke-width: 2px;
}

.react-flow__edge.selected .react-flow__edge-path {
  stroke: #8B5CF6;
}

.react-flow__handle {
  width: 10px;
  height: 10px;
  background: #3F3F46;
  border: 2px solid #09090B;
}

.react-flow__handle:hover {
  background: #8B5CF6;
}

## 自定义节点组件

<div className="min-w-[200px]">
  {/* 头部 */}
  <div className="flex items-center gap-2.5 px-3 py-2.5 bg-[#0F0F12] border-b border-[#27272A] rounded-t-lg">
    <div className={`w-7 h-7 rounded-md ${nodeTypeColors[type].bg} flex items-center justify-center`}>
      <NodeIcon className={`w-4 h-4 ${nodeTypeColors[type].icon}`} />
    </div>
    <span className="text-sm font-medium text-zinc-50">{data.label}</span>
  </div>
  
  {/* 内容 */}
  <div className="px-3 py-3">
    {/* 节点特定内容 */}
  </div>
</div>

## Config Panel (右侧边栏)

<aside className="w-[320px] bg-[#0F0F12] border-l border-[#27272A] flex flex-col">
  {/* 头部 */}
  <div className="h-12 px-4 flex items-center justify-between border-b border-[#27272A]">
    <span className="text-sm font-medium text-zinc-50">节点配置</span>
    <Button variant="ghost" size="icon" onClick={onClose}>
      <X className="w-4 h-4" />
    </Button>
  </div>
  
  {/* 内容 */}
  <div className="flex-1 overflow-y-auto p-4">
    {/* 配置分组 */}
    <div className="mb-6">
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-3">
        基本设置
      </h4>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-zinc-50 mb-1.5 block">节点名称</label>
          <Input value={...} onChange={...} />
        </div>
      </div>
    </div>
  </div>
</aside>

## Execution Panel (底部)

<div className="bg-[#0F0F12] border-t border-[#27272A]">
  {/* 头部 */}
  <div className="h-10 px-4 flex items-center justify-between border-b border-[#27272A]">
    <div className="flex gap-1">
      <button className="px-3 py-1.5 rounded-md text-sm text-zinc-50 bg-[#27272A]">输出</button>
      <button className="px-3 py-1.5 rounded-md text-sm text-zinc-400 hover:text-zinc-50">日志</button>
      <button className="px-3 py-1.5 rounded-md text-sm text-zinc-400 hover:text-zinc-50">变量</button>
    </div>
    <Button variant="ghost" size="icon">
      <ChevronDown className="w-4 h-4" />
    </Button>
  </div>
  
  {/* 内容 */}
  <div className="h-[200px] overflow-y-auto p-4 font-mono text-xs text-zinc-400">
    {/* 日志内容 */}
  </div>
</div>

保持原有的编辑器功能: 节点拖拽、连线、配置保存、执行等。
```
