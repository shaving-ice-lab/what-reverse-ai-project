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

// Manus StyleNodeTypeColor
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
 { id: "ai", label: "AI Node" },
 { id: "logic", label: "LogicNode" },
 { id: "data", label: "DataNode" },
 { id: "integration", label: "IntegrationNode" },
 { id: "io", label: "InputOutput" },
 { id: "flow", label: "FlowNode" },
 { id: "text", label: "TextNode" },
 { id: "code", label: "CodeNode" },
];

const nodeDefinitions: NodeDefinition[] = [
 // AI Node
 {
 type: "llm",
 label: "LLM Call",
 description: "CalllargeLanguageModel",
 icon: <Bot className="w-4 h-4" />,
 category: "ai",
 colorType: "ai",
 },
 // LogicNode
 {
 type: "condition",
 label: "ConditionDetermine",
 description: "If/Else Branch",
 icon: <GitBranch className="w-4 h-4" />,
 category: "logic",
 colorType: "logic",
 },
 {
 type: "loop",
 label: "Loop",
 description: "LoopExecute",
 icon: <Repeat className="w-4 h-4" />,
 category: "logic",
 colorType: "logic",
 },
 {
 type: "delay",
 label: "Latency",
 description: "etcpendingSpecifyTime",
 icon: <Timer className="w-4 h-4" />,
 category: "logic",
 colorType: "logic",
 },
 {
 type: "error",
 label: "ErrorProcess",
 description: "Try/Catch ErrorCapture",
 icon: <ShieldAlert className="w-4 h-4" />,
 category: "logic",
 colorType: "logic",
 },
 // DataNode
 {
 type: "variable",
 label: "Variable",
 description: "Settings/FetchVariable",
 icon: <Variable className="w-4 h-4" />,
 category: "data",
 colorType: "data",
 },
 {
 type: "merge",
 label: "and",
 description: "andmultipleData",
 icon: <Merge className="w-4 h-4" />,
 category: "data",
 colorType: "data",
 },
 {
 type: "filter",
 label: "Filter",
 description: "FilterData",
 icon: <Filter className="w-4 h-4" />,
 category: "data",
 colorType: "data",
 },
 {
 type: "db_select",
 label: "DB Query",
 description: "ReadDatarow",
 icon: <Database className="w-4 h-4" />,
 category: "data",
 colorType: "data",
 },
 {
 type: "db_insert",
 label: "DB Add",
 description: "enterDatarow",
 icon: <Plus className="w-4 h-4" />,
 category: "data",
 colorType: "data",
 },
 {
 type: "db_update",
 label: "DB Update",
 description: "UpdateDatarow",
 icon: <Pencil className="w-4 h-4" />,
 category: "data",
 colorType: "data",
 },
 {
 type: "db_delete",
 label: "DB Delete",
 description: "DeleteDatarow",
 icon: <Trash2 className="w-4 h-4" />,
 category: "data",
 colorType: "data",
 },
 {
 type: "db_migrate",
 label: "DB Migration",
 description: "ExecuteStructureChange",
 icon: <ArrowUpDown className="w-4 h-4" />,
 category: "data",
 colorType: "data",
 },
 // IntegrationNode
 {
 type: "http",
 label: "HTTP Request",
 description: "Send HTTP Request",
 icon: <Globe className="w-4 h-4" />,
 category: "integration",
 colorType: "integration",
 },
 {
 type: "webhook",
 label: "Webhook",
 description: "Receive Webhook Request",
 icon: <Webhook className="w-4 h-4" />,
 category: "integration",
 colorType: "integration",
 },
 // InputOutputNode
 {
 type: "input",
 label: "FormInput",
 description: "Definition App FormInputField",
 icon: <FormInput className="w-4 h-4" />,
 category: "io",
 colorType: "io",
 },
 {
 type: "output",
 label: "ResultOutput",
 description: "DefinitionRunResultShowcasemethod",
 icon: <FileOutput className="w-4 h-4" />,
 category: "io",
 colorType: "io",
 },
 // FlowNode
 {
 type: "start",
 label: "Start",
 description: "WorkflowEntry",
 icon: <Play className="w-4 h-4" />,
 category: "flow",
 colorType: "flow",
 },
 {
 type: "end",
 label: "End",
 description: "Workflow",
 icon: <Square className="w-4 h-4" />,
 category: "flow",
 colorType: "io",
 },
 // TextNode
 {
 type: "template",
 label: "TextTemplate",
 description: "TemplateStringRender",
 icon: <FileText className="w-4 h-4" />,
 category: "text",
 colorType: "text",
 },
 {
 type: "split",
 label: "Split/and",
 description: "TextSplitorand",
 icon: <Split className="w-4 h-4" />,
 category: "text",
 colorType: "text",
 },
 {
 type: "documentAssembler",
 label: "Documentgroup",
 description: "IntegrateChapterGenerateDocument",
 icon: <BookOpen className="w-4 h-4" />,
 category: "text",
 colorType: "text",
 },
 // CodeNode
 {
 type: "code",
 label: "JavaScript",
 description: "Execute JS Code",
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
 
 // CreateCustomDrag & DropPreview
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
 
 // Clean upDrag & DropPreviewElement
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
 {/* CategoryTitle - canCollapse */}
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
 
 {/* NodeList - canCollapse */}
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
 placeholder="SearchNode..." 
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
 defaultOpen={isSearching || index < 3} // SearchtimeallsectionExpand, nothenDefaultExpandbefore3
 />
 ))}

 {filteredNodes.length === 0 && (
 <div className="text-center py-12 text-foreground-muted">
 <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-surface-100 flex items-center justify-center">
 <Search className="h-5 w-5 opacity-40" />
 </div>
 <p className="text-sm font-medium text-foreground-muted">NotoNode</p>
 <p className="text-xs text-foreground-muted mt-1">TryotherheKeywords</p>
 </div>
 )}
 </div>
 </ScrollArea>

 {/* FooterTip - moreCompact */}
 <div className="p-3 border-t border-border">
 <div className="flex items-center justify-center gap-2 text-[11px] text-foreground-muted py-2 px-3 rounded-md bg-linear-to-r from-surface-100 to-surface-100 border border-dashed border-border/70">
 <GripVertical className="h-3 w-3" />
 <span>Drag & DropNodetoCanvas</span>
 </div>
 </div>
 </aside>
 );
}
