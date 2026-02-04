/**
 * Workflow 节点清单与扩展机制
 */

import {
  Bot,
  Globe,
  Database,
  MousePointerClick,
  Settings,
  Webhook,
  Clock,
  Play,
  MessageSquare,
  Mail,
  GitBranch,
  Repeat,
  Filter,
  Code,
  FileText,
  CheckCircle2,
  Package,
  type LucideIcon,
} from "lucide-react";
import type { CustomNode, CustomNodeCategory } from "@/types/custom-node";
import {
  checkNodeCompatibility,
  DEFAULT_NODE_SDK_VERSION,
  type NodeCompatibilityContext,
  type NodeCompatibilityResult,
} from "./versioning";

export type WorkflowNodeCategoryId = "ai" | "http" | "db" | "ui" | "utility";

export interface WorkflowNodeCategory {
  id: WorkflowNodeCategoryId;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

export type WorkflowNodeSource = "builtin" | "custom" | "extension";

export interface WorkflowNodeCatalogEntry {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  iconGlyph?: string;
  category: WorkflowNodeCategoryId;
  color: string;
  bgColor: string;
  borderColor: string;
  version: string;
  source: WorkflowNodeSource;
  tags?: string[];
  compatibility?: NodeCompatibilityResult;
}

export const WORKFLOW_NODE_CATEGORIES: WorkflowNodeCategory[] = [
  { id: "ai", name: "AI", description: "智能生成与推理", icon: Bot, color: "#8B5CF6" },
  { id: "http", name: "HTTP", description: "接口与集成", icon: Globe, color: "#3B82F6" },
  { id: "db", name: "DB", description: "数据与存储", icon: Database, color: "#10B981" },
  { id: "ui", name: "UI", description: "交互与展示", icon: MousePointerClick, color: "#F97316" },
  { id: "utility", name: "Utility", description: "流程与通用工具", icon: Settings, color: "#64748B" },
];

const CATEGORY_STYLE_MAP: Record<
  WorkflowNodeCategoryId,
  { color: string; bgColor: string; borderColor: string }
> = {
  ai: { color: "text-purple-500", bgColor: "bg-purple-500/10", borderColor: "border-purple-500/20" },
  http: { color: "text-blue-500", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20" },
  db: { color: "text-emerald-500", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/20" },
  ui: { color: "text-orange-500", bgColor: "bg-orange-500/10", borderColor: "border-orange-500/20" },
  utility: { color: "text-foreground-light", bgColor: "bg-muted/50", borderColor: "border-border" },
};

export const BUILTIN_WORKFLOW_NODES: WorkflowNodeCatalogEntry[] = [
  {
    id: "webhook",
    name: "Webhook 触发器",
    description: "通过 HTTP 请求触发工作流",
    icon: Webhook,
    category: "http",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
    version: "1.0.0",
    source: "builtin",
  },
  {
    id: "schedule",
    name: "定时触发器",
    description: "按计划定时执行工作流",
    icon: Clock,
    category: "utility",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    version: "1.0.0",
    source: "builtin",
  },
  {
    id: "manual",
    name: "手动触发器",
    description: "手动点击执行工作流",
    icon: Play,
    category: "ui",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
    version: "1.0.0",
    source: "builtin",
  },
  {
    id: "ai-chat",
    name: "AI 对话",
    description: "调用 AI 模型进行对话",
    icon: MessageSquare,
    category: "ai",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    version: "1.0.0",
    source: "builtin",
  },
  {
    id: "ai-agent",
    name: "AI Agent",
    description: "调用自定义 AI Agent",
    icon: Bot,
    category: "ai",
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/20",
    version: "1.0.0",
    source: "builtin",
  },
  {
    id: "http-request",
    name: "HTTP 请求",
    description: "发送 HTTP API 请求",
    icon: Globe,
    category: "http",
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
    version: "1.0.0",
    source: "builtin",
  },
  {
    id: "email",
    name: "发送邮件",
    description: "发送电子邮件通知",
    icon: Mail,
    category: "http",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    version: "1.0.0",
    source: "builtin",
  },
  {
    id: "database",
    name: "数据库操作",
    description: "读写数据库数据",
    icon: Database,
    category: "db",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    version: "1.0.0",
    source: "builtin",
  },
  {
    id: "condition",
    name: "条件判断",
    description: "根据条件分支执行",
    icon: GitBranch,
    category: "utility",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    version: "1.0.0",
    source: "builtin",
  },
  {
    id: "loop",
    name: "循环",
    description: "重复执行一组操作",
    icon: Repeat,
    category: "utility",
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/20",
    version: "1.0.0",
    source: "builtin",
  },
  {
    id: "filter",
    name: "过滤器",
    description: "过滤和筛选数据",
    icon: Filter,
    category: "utility",
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/20",
    version: "1.0.0",
    source: "builtin",
  },
  {
    id: "code",
    name: "代码执行",
    description: "执行自定义代码",
    icon: Code,
    category: "utility",
    color: "text-foreground-light",
    bgColor: "bg-muted/50",
    borderColor: "border-border",
    version: "1.0.0",
    source: "builtin",
  },
  {
    id: "transform",
    name: "数据转换",
    description: "转换和处理数据格式",
    icon: Settings,
    category: "utility",
    color: "text-foreground-light",
    bgColor: "bg-muted/50",
    borderColor: "border-border",
    version: "1.0.0",
    source: "builtin",
  },
  {
    id: "file",
    name: "文件操作",
    description: "读取和处理文件",
    icon: FileText,
    category: "utility",
    color: "text-teal-500",
    bgColor: "bg-teal-500/10",
    borderColor: "border-teal-500/20",
    version: "1.0.0",
    source: "builtin",
  },
  {
    id: "input",
    name: "表单输入",
    description: "采集用户输入并输出",
    icon: MousePointerClick,
    category: "ui",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
    version: "1.0.0",
    source: "builtin",
  },
  {
    id: "output",
    name: "结果输出",
    description: "展示或返回最终结果",
    icon: CheckCircle2,
    category: "ui",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    version: "1.0.0",
    source: "builtin",
  },
];

const BUILTIN_NODE_IDS = new Set(BUILTIN_WORKFLOW_NODES.map((node) => node.id));
const extensionRegistry = new Map<string, WorkflowNodeCatalogEntry>();

export function registerWorkflowNode(entry: WorkflowNodeCatalogEntry): void {
  if (BUILTIN_NODE_IDS.has(entry.id)) {
    return;
  }
  extensionRegistry.set(entry.id, entry);
}

export function registerWorkflowNodes(entries: WorkflowNodeCatalogEntry[]): void {
  entries.forEach((entry) => registerWorkflowNode(entry));
}

export function unregisterWorkflowNode(id: string): void {
  extensionRegistry.delete(id);
}

export function listWorkflowNodes(options: { includeBuiltin?: boolean; includeExtensions?: boolean } = {}): WorkflowNodeCatalogEntry[] {
  const { includeBuiltin = true, includeExtensions = true } = options;
  const nodes: WorkflowNodeCatalogEntry[] = [];

  if (includeBuiltin) {
    nodes.push(...BUILTIN_WORKFLOW_NODES);
  }
  if (includeExtensions) {
    nodes.push(...extensionRegistry.values());
  }

  return sortNodes(nodes);
}

export interface WorkflowNodeCategorySummary extends WorkflowNodeCategory {
  count: number;
}

export function buildWorkflowNodeCatalog(options: {
  customNodes?: CustomNode[];
  includeBuiltin?: boolean;
  includeExtensions?: boolean;
  compatibilityContext?: NodeCompatibilityContext;
} = {}): { nodes: WorkflowNodeCatalogEntry[]; categories: WorkflowNodeCategorySummary[] } {
  const {
    customNodes = [],
    includeBuiltin = true,
    includeExtensions = true,
    compatibilityContext,
  } = options;

  const baseNodes = listWorkflowNodes({ includeBuiltin, includeExtensions });
  const customEntries = customNodes.map((node) =>
    mapCustomNodeToCatalogEntry(node, compatibilityContext)
  );
  const merged = dedupeNodes([...baseNodes, ...customEntries]);

  return {
    nodes: sortNodes(merged),
    categories: getWorkflowCategorySummary(merged),
  };
}

export function mapCustomNodeToCatalogEntry(
  node: CustomNode,
  context: NodeCompatibilityContext = {}
): WorkflowNodeCatalogEntry {
  const rawCategory = (node.category ||
    (node as unknown as { category?: CustomNodeCategory }).category ||
    "other") as CustomNodeCategory;
  const category = mapCustomNodeCategory(rawCategory);
  const style = CATEGORY_STYLE_MAP[category];

  const rawName =
    (node as unknown as { displayName?: string }).displayName ||
    (node as unknown as { display_name?: string }).display_name ||
    node.name ||
    "自定义节点";
  const description = node.description || "";
  const rawSlug =
    (node as unknown as { slug?: string }).slug ||
    (node as unknown as { id?: string }).id ||
    rawName;
  const rawVersion =
    node.version ||
    (node as unknown as { latestVersion?: string }).latestVersion ||
    (node as unknown as { latest_version?: string }).latest_version ||
    "1.0.0";
  const iconValue =
    (node as unknown as { icon?: string }).icon ||
    (node as unknown as { icon_url?: string }).icon_url ||
    "";
  const iconGlyph = resolveIconGlyph(iconValue) || "📦";
  const minSdkVersion =
    (node as unknown as { minSdkVersion?: string }).minSdkVersion ||
    (node as unknown as { min_sdk_version?: string }).min_sdk_version;
  const maxSdkVersion =
    (node as unknown as { maxSdkVersion?: string }).maxSdkVersion ||
    (node as unknown as { max_sdk_version?: string }).max_sdk_version;

  const compatibility = checkNodeCompatibility(
    { minSdkVersion, maxSdkVersion },
    { sdkVersion: context.sdkVersion || DEFAULT_NODE_SDK_VERSION, appVersion: context.appVersion }
  );

  return {
    id: `custom:${rawSlug}`,
    name: rawName,
    description,
    icon: Package,
    iconGlyph,
    category,
    color: style.color,
    bgColor: style.bgColor,
    borderColor: style.borderColor,
    version: rawVersion,
    source: "custom",
    tags: node.tags || [],
    compatibility,
  };
}

function mapCustomNodeCategory(category: CustomNodeCategory): WorkflowNodeCategoryId {
  switch (category) {
    case "ai":
      return "ai";
    case "data":
    case "storage":
      return "db";
    case "integration":
    case "communication":
      return "http";
    case "logic":
    case "utility":
    case "other":
    default:
      return "utility";
  }
}

function resolveIconGlyph(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return /[^\x00-\x7F]/.test(trimmed) ? trimmed : undefined;
}

function sortNodes(nodes: WorkflowNodeCatalogEntry[]): WorkflowNodeCatalogEntry[] {
  const order = WORKFLOW_NODE_CATEGORIES.map((category) => category.id);
  return [...nodes].sort((a, b) => {
    const categoryDiff = order.indexOf(a.category) - order.indexOf(b.category);
    if (categoryDiff !== 0) return categoryDiff;
    return a.name.localeCompare(b.name, "zh");
  });
}

function dedupeNodes(nodes: WorkflowNodeCatalogEntry[]): WorkflowNodeCatalogEntry[] {
  const map = new Map<string, WorkflowNodeCatalogEntry>();
  for (const node of nodes) {
    map.set(node.id, node);
  }
  return Array.from(map.values());
}

function getWorkflowCategorySummary(nodes: WorkflowNodeCatalogEntry[]): WorkflowNodeCategorySummary[] {
  return WORKFLOW_NODE_CATEGORIES.map((category) => ({
    ...category,
    count: nodes.filter((node) => node.category === category.id).length,
  }));
}
