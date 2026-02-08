/**
 * Workflow Node Catalog and Extension Mechanism
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
 { id: "ai", name: "AI", description: "Smart generate and inference", icon: Bot, color: "#8B5CF6" },
 { id: "http", name: "HTTP", description: "Interface and integration", icon: Globe, color: "#3B82F6" },
 { id: "db", name: "DB", description: "Data and storage", icon: Database, color: "#10B981" },
 { id: "ui", name: "UI", description: "Interactive and showcase", icon: MousePointerClick, color: "#F97316" },
 { id: "utility", name: "Utility", description: "Flow and utility tools", icon: Settings, color: "#64748B" },
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
 name: "Webhook Trigger",
 description: "Trigger workflow via HTTP request",
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
 name: "Scheduled Trigger",
 description: "Execute workflow by schedule plan",
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
    name: "Manual Trigger",
 description: "Manual click to execute workflow",
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
 name: "AI Conversation",
 description: "Call AI model to proceed conversation",
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
 description: "Call custom AI agent",
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
 name: "HTTP Request",
 description: "Send HTTP API Request",
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
 name: "Send Email",
 description: "Send email notifications",
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
 name: "Database Action",
 description: "Read database data",
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
 name: "Condition",
 description: "Conditional branch execution based on condition",
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
 name: "Loop",
 description: "Re-execute a group of actions",
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
 name: "Filter",
 description: "Filter and transform data",
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
 name: "Code Execution",
 description: "Execute custom code",
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
    name: "Data Convert",
 description: "Convert and process data format",
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
 name: "File Action",
 description: "Read and process file",
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
 name: "Form Input",
 description: "User input and output",
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
 name: "Result Output",
 description: "Show or return result",
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
 "CustomNode";
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
