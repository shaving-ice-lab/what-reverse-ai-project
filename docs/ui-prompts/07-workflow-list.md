# 07 - 工作流列表页面

**目标文件**: `apps/web/src/app/(dashboard)/workflows/page.tsx`

---

```
/ui-ux-pro-max

请重构 AgentFlow 的工作流列表页面，使用 Manus 风格。

## 文件位置
- apps/web/src/app/(dashboard)/workflows/page.tsx
- apps/web/src/components/workflow/WorkflowCard.tsx
- apps/web/src/components/workflow/CreateWorkflowDialog.tsx

## 设计规范
参考：
- design-system/agentflow/MASTER.md
- design-system/agentflow/pages/dashboard.md

## 页面结构

Workflows Page
├── Header
│   ├── Left: Title + Subtitle
│   └── Right: Search + Filter + Create Button
├── Content
│   ├── Workflow Grid (或 Empty State)
│   └── Pagination (如果需要)
└── Create Workflow Dialog

## 页面头部

<div className="flex items-center justify-between mb-8">
  <div>
    <h1 className="text-2xl font-semibold text-zinc-50">我的工作流</h1>
    <p className="text-sm text-zinc-400 mt-1">管理和运行你的 AI 工作流</p>
  </div>
  <div className="flex items-center gap-3">
    {/* 搜索框 */}
    {/* 筛选按钮 */}
    {/* 创建按钮 */}
  </div>
</div>

## 搜索框
- 背景: #18181B
- 边框: 1px solid #3F3F46
- 圆角: 8px
- padding: 8px 16px
- 左侧 Search 图标 (#71717A)
- placeholder: "搜索工作流..."
- focus: 紫色边框

## 创建按钮
- 紫色渐变背景
- Plus 图标 + "新建工作流"
- hover: 发光效果

## 工作流卡片网格

.workflow-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

## WorkflowCard 组件

<div className="
  bg-[#18181B] 
  border border-[#27272A] 
  rounded-xl 
  p-5 
  cursor-pointer 
  transition-all duration-200
  hover:border-violet-500 
  hover:shadow-[0_0_20px_rgba(139,92,246,0.15)]
  hover:-translate-y-0.5
">
  {/* 头部: 图标 + 更多按钮 */}
  <div className="flex items-start justify-between mb-4">
    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/30 flex items-center justify-center">
      <Layers className="w-5 h-5 text-violet-400" />
    </div>
    <DropdownMenu>...</DropdownMenu>
  </div>
  
  {/* 标题 */}
  <h3 className="text-base font-semibold text-zinc-50 mb-2">{workflow.name}</h3>
  
  {/* 描述 (2行截断) */}
  <p className="text-sm text-zinc-400 line-clamp-2 mb-4">{workflow.description}</p>
  
  {/* 底部元信息 */}
  <div className="flex items-center gap-4 text-xs text-zinc-500">
    <span>{workflow.nodeCount} 个节点</span>
    <span>编辑于 {workflow.updatedAt}</span>
    <Badge variant={workflow.status}>{workflow.status}</Badge>
  </div>
</div>

## 状态徽章
- active: 绿色 (bg-green-500/15, border-green-500/30, text-green-400)
- draft: 灰色 (bg-zinc-500/15, border-zinc-500/30, text-zinc-400)

## 创建新工作流卡片

<div className="
  border-2 border-dashed border-[#3F3F46] 
  rounded-xl 
  p-5 
  flex flex-col items-center justify-center 
  min-h-[200px]
  cursor-pointer
  transition-all duration-200
  hover:border-violet-500 
  hover:bg-violet-500/5
">
  <div className="w-12 h-12 rounded-xl bg-[#27272A] flex items-center justify-center mb-3">
    <Plus className="w-6 h-6 text-violet-500" />
  </div>
  <span className="text-sm font-medium text-zinc-400">新建工作流</span>
</div>

## 空状态

<div className="flex flex-col items-center justify-center py-16 text-center">
  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/15 to-indigo-500/15 border border-violet-500/20 flex items-center justify-center mb-6">
    <Layers className="w-10 h-10 text-violet-500" />
  </div>
  <h3 className="text-lg font-semibold text-zinc-50 mb-2">还没有工作流</h3>
  <p className="text-sm text-zinc-400 max-w-md mb-6">
    创建你的第一个 AI 工作流，自动化你的任务
  </p>
  <Button>
    <Plus className="w-4 h-4 mr-2" />
    新建工作流
  </Button>
</div>

## 入场动画

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.workflow-card {
  animation: fadeInUp 300ms ease-out both;
}

.workflow-card:nth-child(1) { animation-delay: 0ms; }
.workflow-card:nth-child(2) { animation-delay: 50ms; }
.workflow-card:nth-child(3) { animation-delay: 100ms; }

保持原有的工作流 CRUD 功能和对话框逻辑。
```
