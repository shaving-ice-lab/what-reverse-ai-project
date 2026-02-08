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
 * NodePanel - Manus Style
 */

// Manus Style Node Type Colors
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
  { id: "ai", label: "AI Nodes" },
  { id: "logic", label: "Logic Nodes" },
  { id: "data", label: "Data Nodes" },
  { id: "integration", label: "Integration Nodes" },
  { id: "io", label: "Input / Output" },
  { id: "flow", label: "Flow Nodes" },
  { id: "text", label: "Text Nodes" },
  { id: "code", label: "Code Nodes" },
];

const nodeDefinitions: NodeDefinition[] = [
 // AI Node
 {
 type: "llm",
 label: "LLM Call",
 description: "Call large language model",
 icon: <Bot className="w-4 h-4" />,
 category: "ai",
 colorType: "ai",
 },
  // Logic Nodes
  {
    type: "condition",
    label: "Condition",
    description: "If/Else branching logic",
 icon: <GitBranch className="w-4 h-4" />,
 category: "logic",
 colorType: "logic",
 },
 {
 type: "loop",
 label: "Loop",
    description: "Loop execution",
 icon: <Repeat className="w-4 h-4" />,
 category: "logic",
 colorType: "logic",
 },
 {
 type: "delay",
    label: "Delay",
    description: "Run after a specified delay",
 icon: <Timer className="w-4 h-4" />,
 category: "logic",
 colorType: "logic",
 },
 {
 type: "error",
    label: "Error Handler",
    description: "Try/Catch error capture",
 icon: <ShieldAlert className="w-4 h-4" />,
 category: "logic",
 colorType: "logic",
 },
  // Data Nodes
  {
    type: "variable",
    label: "Variable",
    description: "Set or get variables",
 icon: <Variable className="w-4 h-4" />,
 category: "data",
 colorType: "data",
 },
 {
 type: "merge",
    label: "Merge",
    description: "Merge multiple data sources",
 icon: <Merge className="w-4 h-4" />,
 category: "data",
 colorType: "data",
 },
 {
 type: "filter",
 label: "Filter",
    description: "Filter data",
 icon: <Filter className="w-4 h-4" />,
 category: "data",
 colorType: "data",
 },
 {
 type: "db_select",
 label: "DB Query",
    description: "Read data rows",
 icon: <Database className="w-4 h-4" />,
 category: "data",
 colorType: "data",
 },
 {
 type: "db_insert",
    label: "DB Insert",
    description: "Insert data rows",
 icon: <Plus className="w-4 h-4" />,
 category: "data",
 colorType: "data",
 },
 {
 type: "db_update",
 label: "DB Update",
 description: "Update Data Row",
 icon: <Pencil className="w-4 h-4" />,
 category: "data",
 colorType: "data",
 },
 {
 type: "db_delete",
 label: "DB Delete",
 description: "Delete Data Row",
 icon: <Trash2 className="w-4 h-4" />,
 category: "data",
 colorType: "data",
 },
 {
 type: "db_migrate",
 label: "DB Migration",
    description: "Execute schema changes",
 icon: <ArrowUpDown className="w-4 h-4" />,
 category: "data",
 colorType: "data",
 },
  // Integration Nodes
 {
 type: "http",
 label: "HTTP Request",
    description: "Send an HTTP request",
 icon: <Globe className="w-4 h-4" />,
 category: "integration",
 colorType: "integration",
 },
 {
 type: "webhook",
 label: "Webhook",
    description: "Receive a webhook request",
 icon: <Webhook className="w-4 h-4" />,
 category: "integration",
 colorType: "integration",
 },
  // Input / Output Nodes
  {
    type: "input",
    label: "Form Input",
    description: "Define app form input fields",
 icon: <FormInput className="w-4 h-4" />,
 category: "io",
 colorType: "io",
 },
 {
 type: "output",
    label: "Result Output",
    description: "Define how results are displayed",
 icon: <FileOutput className="w-4 h-4" />,
 category: "io",
 colorType: "io",
 },
  // Flow Nodes
  {
    type: "start",
    label: "Start",
    description: "Workflow entry point",
 icon: <Play className="w-4 h-4" />,
 category: "flow",
 colorType: "flow",
 },
 {
 type: "end",
    label: "End",
    description: "Workflow exit point",
 icon: <Square className="w-4 h-4" />,
 category: "flow",
 colorType: "io",
 },
  // Text Nodes
  {
    type: "template",
    label: "Text Template",
    description: "Render template strings",
 icon: <FileText className="w-4 h-4" />,
 category: "text",
 colorType: "text",
 },
 {
 type: "split",
    label: "Split / Merge",
    description: "Split or merge text",
 icon: <Split className="w-4 h-4" />,
 category: "text",
 colorType: "text",
 },
 {
 type: "documentAssembler",
    label: "Document Assembler",
    description: "Generate documents from chapters",
 icon: <BookOpen className="w-4 h-4" />,
 category: "text",
 colorType: "text",
 },
  // Code Nodes
 {
 type: "code",
 label: "JavaScript",
    description: "Execute JavaScript code",
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
 
    // Create custom drag preview
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
 
    // Clean up drag preview element
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
    {/* Category Title - Collapsible */}
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
 
      {/* Node List - Collapsible */}
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
 {/* Header - Title + Search */}
 <div className="p-3 border-b border-border bg-surface-75/80">
 <div className="flex items-center gap-2 bg-surface-200/80 border border-border/70 rounded-lg px-3 py-2 focus-within:border-brand-500/50 transition-colors">
 <Search className="w-4 h-4 text-foreground-muted shrink-0" />
 <input 
 type="text" 
 placeholder="Search nodes..." 
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
 
 {/* NodeList */}
 <ScrollArea className="flex-1">
 <div className="p-2">
 {categories.map((category, index) => (
 <CategorySection
 key={category.id}
 label={category.label}
 nodes={groupedNodes[category.id]}
 defaultOpen={isSearching || index < 3} // Expand all when searching, otherwise default expand first 3
 />
 ))}

 {filteredNodes.length === 0 && (
 <div className="text-center py-12 text-foreground-muted">
 <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-surface-100 flex items-center justify-center">
 <Search className="h-5 w-5 opacity-40" />
 </div>
              <p className="text-sm font-medium text-foreground-muted">No nodes found</p>
              <p className="text-xs text-foreground-muted mt-1">Try different keywords</p>
 </div>
 )}
 </div>
 </ScrollArea>

    {/* Footer Tip */}
 <div className="p-3 border-t border-border">
 <div className="flex items-center justify-center gap-2 text-[11px] text-foreground-muted py-2 px-3 rounded-md bg-linear-to-r from-surface-100 to-surface-100 border border-dashed border-border/70">
 <GripVertical className="h-3 w-3" />
          <span>Drag and drop nodes to canvas</span>
 </div>
 </div>
 </aside>
 );
}
