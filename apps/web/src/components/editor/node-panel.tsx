"use client";

import { useState, useMemo } from "react";
import {
  Bot,
  Globe,
  GitBranch,
  Repeat,
  Code2,
  FileText,
  Variable,
  Play,
  Square,
  Webhook,
  Timer,
  ShieldAlert,
  Merge,
  Filter,
  Split,
  Search,
  FormInput,
  FileOutput,
  GripVertical,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Database,
  Plus,
  Pencil,
  Trash2,
  ArrowUpDown,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { NodeCategory } from "@/types/workflow";

/**
 * 节点面板 - Manus 风格
 */

// Manus 风格节点类型颜色
const nodeTypeColors = {
  ai: { bg: "bg-brand-200/60", icon: "text-brand-500" },
  logic: { bg: "bg-surface-200/80", icon: "text-foreground-muted" },
  data: { bg: "bg-surface-200/80", icon: "text-foreground-muted" },
  integration: { bg: "bg-surface-200/80", icon: "text-foreground-muted" },
  io: { bg: "bg-surface-200/80", icon: "text-foreground-muted" },
  code: { bg: "bg-surface-200/80", icon: "text-foreground-muted" },
  flow: { bg: "bg-brand-200/60", icon: "text-brand-500" },
  text: { bg: "bg-surface-200/80", icon: "text-foreground-muted" },
};

interface NodeDefinition {
  type: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: NodeCategory;
  colorType: keyof typeof nodeTypeColors;
}

const categories: { id: NodeCategory; label: string }[] = [
  { id: "ai", label: "AI 节点" },
  { id: "logic", label: "逻辑节点" },
  { id: "data", label: "数据节点" },
  { id: "integration", label: "集成节点" },
  { id: "io", label: "输入输出" },
  { id: "flow", label: "流程节点" },
  { id: "text", label: "文本节点" },
  { id: "code", label: "代码节点" },
];

const nodeDefinitions: NodeDefinition[] = [
  // AI 节点
  {
    type: "llm",
    label: "LLM 调用",
    description: "调用大语言模型",
    icon: <Bot className="w-4 h-4" />,
    category: "ai",
    colorType: "ai",
  },
  // 逻辑节点
  {
    type: "condition",
    label: "条件判断",
    description: "If/Else 分支",
    icon: <GitBranch className="w-4 h-4" />,
    category: "logic",
    colorType: "logic",
  },
  {
    type: "loop",
    label: "循环",
    description: "循环执行",
    icon: <Repeat className="w-4 h-4" />,
    category: "logic",
    colorType: "logic",
  },
  {
    type: "delay",
    label: "延迟",
    description: "等待指定时间",
    icon: <Timer className="w-4 h-4" />,
    category: "logic",
    colorType: "logic",
  },
  {
    type: "error",
    label: "错误处理",
    description: "Try/Catch 错误捕获",
    icon: <ShieldAlert className="w-4 h-4" />,
    category: "logic",
    colorType: "logic",
  },
  // 数据节点
  {
    type: "variable",
    label: "变量",
    description: "设置/获取变量",
    icon: <Variable className="w-4 h-4" />,
    category: "data",
    colorType: "data",
  },
  {
    type: "merge",
    label: "合并",
    description: "合并多个数据",
    icon: <Merge className="w-4 h-4" />,
    category: "data",
    colorType: "data",
  },
  {
    type: "filter",
    label: "筛选",
    description: "筛选数据",
    icon: <Filter className="w-4 h-4" />,
    category: "data",
    colorType: "data",
  },
  {
    type: "db_select",
    label: "DB 查询",
    description: "读取数据行",
    icon: <Database className="w-4 h-4" />,
    category: "data",
    colorType: "data",
  },
  {
    type: "db_insert",
    label: "DB 新增",
    description: "插入数据行",
    icon: <Plus className="w-4 h-4" />,
    category: "data",
    colorType: "data",
  },
  {
    type: "db_update",
    label: "DB 更新",
    description: "更新数据行",
    icon: <Pencil className="w-4 h-4" />,
    category: "data",
    colorType: "data",
  },
  {
    type: "db_delete",
    label: "DB 删除",
    description: "删除数据行",
    icon: <Trash2 className="w-4 h-4" />,
    category: "data",
    colorType: "data",
  },
  {
    type: "db_migrate",
    label: "DB 迁移",
    description: "执行结构变更",
    icon: <ArrowUpDown className="w-4 h-4" />,
    category: "data",
    colorType: "data",
  },
  // 集成节点
  {
    type: "http",
    label: "HTTP 请求",
    description: "发送 HTTP 请求",
    icon: <Globe className="w-4 h-4" />,
    category: "integration",
    colorType: "integration",
  },
  {
    type: "webhook",
    label: "Webhook",
    description: "接收 Webhook 请求",
    icon: <Webhook className="w-4 h-4" />,
    category: "integration",
    colorType: "integration",
  },
  // 输入输出节点
  {
    type: "input",
    label: "表单输入",
    description: "定义 App 表单输入字段",
    icon: <FormInput className="w-4 h-4" />,
    category: "io",
    colorType: "io",
  },
  {
    type: "output",
    label: "结果输出",
    description: "定义运行结果展示方式",
    icon: <FileOutput className="w-4 h-4" />,
    category: "io",
    colorType: "io",
  },
  // 流程节点
  {
    type: "start",
    label: "开始",
    description: "工作流入口",
    icon: <Play className="w-4 h-4" />,
    category: "flow",
    colorType: "flow",
  },
  {
    type: "end",
    label: "结束",
    description: "工作流出口",
    icon: <Square className="w-4 h-4" />,
    category: "flow",
    colorType: "io",
  },
  // 文本节点
  {
    type: "template",
    label: "文本模板",
    description: "模板字符串渲染",
    icon: <FileText className="w-4 h-4" />,
    category: "text",
    colorType: "text",
  },
  {
    type: "split",
    label: "分割/合并",
    description: "文本分割或合并",
    icon: <Split className="w-4 h-4" />,
    category: "text",
    colorType: "text",
  },
  {
    type: "documentAssembler",
    label: "文档组装",
    description: "整合章节生成文档",
    icon: <BookOpen className="w-4 h-4" />,
    category: "text",
    colorType: "text",
  },
  // 代码节点
  {
    type: "code",
    label: "JavaScript",
    description: "执行 JS 代码",
    icon: <Code2 className="w-4 h-4" />,
    category: "code",
    colorType: "code",
  },
];

function NodeItem({ node }: { node: NodeDefinition }) {
  const [isDragging, setIsDragging] = useState(false);
  const colors = nodeTypeColors[node.colorType];
  
  const onDragStart = (event: React.DragEvent) => {
    setIsDragging(true);
    event.dataTransfer.setData("application/reactflow", node.type);
    event.dataTransfer.setData("node/label", node.label);
    event.dataTransfer.effectAllowed = "move";
    
    // 创建自定义拖拽预览
    const dragImage = document.createElement('div');
    dragImage.className = 'fixed pointer-events-none z-50 px-3 py-2 rounded-lg bg-surface-100 border border-brand-500/30 shadow-lg shadow-brand-500/10';
    dragImage.innerHTML = `
      <div class="flex items-center gap-2">
        <div class="w-6 h-6 rounded flex items-center justify-center ${colors.bg.replace('/', '\\/')}">${node.icon}</div>
        <span class="text-sm font-medium text-foreground">${node.label}</span>
      </div>
    `;
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    event.dataTransfer.setDragImage(dragImage, 50, 25);
    
    // 清理拖拽预览元素
    requestAnimationFrame(() => {
      document.body.removeChild(dragImage);
    });
  };
  
  const onDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-grab",
        "border border-transparent",
        "hover:bg-surface-200/60 hover:border-border/70",
        "transition-all duration-150",
        "active:cursor-grabbing active:scale-[0.97]",
        "group",
        isDragging && "opacity-50 scale-[0.97] border-brand-500/30 bg-brand-500/5"
      )}
    >
      <div className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
        "transition-all duration-150",
        "group-hover:scale-110 group-hover:shadow-lg",
        colors.bg,
        isDragging && "scale-110"
      )}>
        <span className={cn(colors.icon, "transition-colors text-base")}>{node.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] text-foreground font-medium leading-tight group-hover:text-foreground">
          {node.label}
        </div>
        <div className="text-[10px] text-foreground-muted leading-tight truncate group-hover:text-foreground-light">
          {node.description}
        </div>
      </div>
      <div className={cn(
        "flex items-center justify-center w-6 h-6 rounded",
        "opacity-0 group-hover:opacity-100",
        "transition-all duration-150",
        "bg-surface-200/70"
      )}>
        <GripVertical className="w-3.5 h-3.5 text-foreground-muted" />
      </div>
    </div>
  );
}

function CategorySection({
  label,
  nodes,
  defaultOpen = true,
}: {
  label: string;
  nodes: NodeDefinition[];
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  if (nodes.length === 0) return null;

  return (
    <div className="mb-1">
      {/* 分类标题 - 可折叠 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2",
          "text-[11px] font-semibold uppercase tracking-wider text-foreground-muted",
          "hover:text-foreground hover:bg-surface-200/60 transition-colors",
          "rounded-md"
        )}
      >
        {isOpen ? (
          <ChevronDown className="w-3.5 h-3.5" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5" />
        )}
        <span>{label}</span>
        <span className="ml-auto text-[10px] font-normal text-foreground-muted tabular-nums">
          {nodes.length}
        </span>
      </button>
      
      {/* 节点列表 - 可折叠 */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-200 ease-out",
          isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-1.5 pb-1">
          {nodes.map((node) => (
            <NodeItem key={node.type} node={node} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function NodePanel() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return nodeDefinitions;
    const query = searchQuery.toLowerCase();
    return nodeDefinitions.filter(
      (node) =>
        node.label.toLowerCase().includes(query) ||
        node.description.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const groupedNodes = useMemo(() => {
    const groups: Record<NodeCategory, NodeDefinition[]> = {
      flow: [],
      ai: [],
      integration: [],
      logic: [],
      data: [],
      text: [],
      code: [],
      io: [],
      custom: [],
    };

    filteredNodes.forEach((node) => {
      if (groups[node.category]) {
        groups[node.category].push(node);
      }
    });

    return groups;
  }, [filteredNodes]);

  const isSearching = searchQuery.trim().length > 0;

  return (
    <aside className="w-full h-full bg-transparent flex flex-col">
      {/* 头部 - 标题 + 搜索 */}
      <div className="p-3 border-b border-border bg-surface-75/80">
      <div className="flex items-center gap-2 bg-surface-200/80 border border-border/70 rounded-lg px-3 py-2 focus-within:border-brand-500/50 transition-colors">
          <Search className="w-4 h-4 text-foreground-muted shrink-0" />
          <input 
            type="text" 
            placeholder="搜索节点..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-sm text-foreground placeholder:text-foreground-muted outline-none flex-1 min-w-0"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-foreground-muted hover:text-foreground transition-colors"
            >
              <span className="text-xs">✕</span>
            </button>
          )}
        </div>
      </div>
      
      {/* 节点列表 */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {categories.map((category, index) => (
            <CategorySection
              key={category.id}
              label={category.label}
              nodes={groupedNodes[category.id]}
              defaultOpen={isSearching || index < 3} // 搜索时全部展开，否则默认展开前3个
            />
          ))}

          {filteredNodes.length === 0 && (
            <div className="text-center py-12 text-foreground-muted">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-surface-100 flex items-center justify-center">
                <Search className="h-5 w-5 opacity-40" />
              </div>
              <p className="text-sm font-medium text-foreground-muted">没有找到节点</p>
              <p className="text-xs text-foreground-muted mt-1">尝试其他关键词</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* 底部提示 - 更紧凑 */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center justify-center gap-2 text-[11px] text-foreground-muted py-2 px-3 rounded-md bg-linear-to-r from-surface-100 to-surface-100 border border-dashed border-border/70">
          <GripVertical className="h-3 w-3" />
          <span>拖拽节点到画布</span>
        </div>
      </div>
    </aside>
  );
}
