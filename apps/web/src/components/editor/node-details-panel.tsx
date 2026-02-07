"use client";

/**
 * NodeDetailsPanelComponent
 *
 * Features: 
 * - DisplayNodeInput JSON
 * - DisplayNodeOutput JSON
 * - DisplayExecuteTime
 * - Display Token Usage
 * - DisplayErrorInfo
 */

import { useState, useMemo } from "react";
import {
 Clock,
 Cpu,
 AlertTriangle,
 CheckCircle2,
 XCircle,
 ChevronDown,
 ChevronRight,
 Copy,
 Check,
 Loader2,
 Brain,
 Globe,
 FileText,
 Code,
 GitBranch,
 Play,
 RefreshCw,
 Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
 Collapsible,
 CollapsibleContent,
 CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
 Tooltip,
 TooltipContent,
 TooltipProvider,
 TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

// ========== TypeDefinition ==========

export type NodeStatus =
 | "pending"
 | "running"
 | "completed"
 | "failed"
 | "skipped"
 | "paused";

export interface NodeError {
 code?: string;
 message: string;
 stack?: string;
 details?: Record<string, unknown>;
}

export interface NodeMetadata {
 tokensUsed?: number;
 model?: string;
 promptTokens?: number;
 completionTokens?: number;
 httpStatusCode?: number;
 httpUrl?: string;
 httpMethod?: string;
 conditionBranch?: string;
 loopIterations?: number;
 currentIteration?: number;
 retryCount?: number;
}

export interface NodeLogEntry {
 level: string;
 message: string;
 timestamp: string;
 data?: Record<string, unknown>;
}

export interface NodeSnapshot {
 nodeId: string;
 nodeName: string;
 nodeType: string;
 status: NodeStatus;
 startedAt: string;
 completedAt?: string;
 durationMs: number;
 inputs: unknown;
 outputs: unknown;
 resolvedConfig?: unknown;
 error?: NodeError;
 metadata?: NodeMetadata;
 logs?: NodeLogEntry[];
 isBreakpoint?: boolean;
}

export interface NodeDetailsPanelProps {
 /** NodeSnapshotData */
 snapshot: NodeSnapshot | null;
 /** re-NodeCallback */
 onRerunNode?: (nodeId: string, newInputs?: unknown) => void;
 /** EditInputandre-Callback */
 onEditAndRerun?: (nodeId: string) => void;
 /** HighlightNodeCallback */
 onHighlightNode?: (nodeId: string) => void;
 /** isnoLoading */
 isLoading?: boolean;
 /** CustomClass Name */
 className?: string;
}

// StatusConfig
const STATUS_CONFIG: Record<
 NodeStatus,
 { icon: typeof CheckCircle2; color: string; bgColor: string; label: string }
> = {
 pending: {
 icon: Clock,
 color: "text-foreground-muted",
 bgColor: "bg-surface-200",
 label: "etcpending",
 },
 running: {
 icon: Loader2,
 color: "text-brand-500",
 bgColor: "bg-brand-200/40",
 label: "Execute",
 },
 completed: {
 icon: CheckCircle2,
 color: "text-brand-500",
 bgColor: "bg-brand-200/60",
 label: "Completed",
 },
 failed: {
 icon: XCircle,
 color: "text-destructive",
 bgColor: "bg-destructive-200",
 label: "Failed",
 },
 skipped: {
 icon: ChevronRight,
 color: "text-foreground-muted",
 bgColor: "bg-surface-200",
 label: "alreadySkip",
 },
 paused: {
 icon: Clock,
 color: "text-warning",
 bgColor: "bg-warning-200",
 label: "Paused",
 },
};

// NodeTypeIcon
const NODE_TYPE_ICONS: Record<string, typeof Brain> = {
 llm: Brain,
 http: Globe,
 template: FileText,
 code: Code,
 condition: GitBranch,
 start: Play,
};

// FormatTime
const formatDuration = (ms: number): string => {
 if (ms < 1000) return `${ms}ms`;
 if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
 const minutes = Math.floor(ms / 60000);
 const seconds = ((ms % 60000) / 1000).toFixed(1);
 return `${minutes}m ${seconds}s`;
};

const formatDateTime = (dateStr: string): string => {
 const date = new Date(dateStr);
 return date.toLocaleString("zh-CN", {
 month: "short",
 day: "numeric",
 hour: "2-digit",
 minute: "2-digit",
 second: "2-digit",
 });
};

// ========== JSON ViewComponent ==========

interface JsonViewerProps {
 data: unknown;
 title: string;
 defaultOpen?: boolean;
 maxHeight?: string;
}

function JsonViewer({
 data,
 title,
 defaultOpen = false,
 maxHeight = "200px",
}: JsonViewerProps) {
 const [isOpen, setIsOpen] = useState(defaultOpen);
 const [copied, setCopied] = useState(false);

 const jsonString = useMemo(() => {
 try {
 return JSON.stringify(data, null, 2);
 } catch {
 return String(data);
 }
 }, [data]);

 const handleCopy = async () => {
 try {
 await navigator.clipboard.writeText(jsonString);
 setCopied(true);
 toast.success("alreadyCopied to clipboard");
 setTimeout(() => setCopied(false), 2000);
 } catch {
 toast.error("CopyFailed");
 }
 };

 const isEmpty =
 data === null ||
 data === undefined ||
 (typeof data === "object" && Object.keys(data as object).length === 0);

 return (
 <Collapsible open={isOpen} onOpenChange={setIsOpen}>
 <CollapsibleTrigger asChild>
 <button className="w-full flex items-center justify-between p-3 rounded-lg bg-surface-100 hover:bg-surface-200 transition-colors">
 <div className="flex items-center gap-2">
 {isOpen ? (
 <ChevronDown className="w-4 h-4 text-foreground-muted" />
 ) : (
 <ChevronRight className="w-4 h-4 text-foreground-muted" />
 )}
 <span className="text-sm font-medium text-foreground">{title}</span>
 {isEmpty && (
 <Badge
 variant="secondary"
 className="text-[10px] bg-surface-200 text-foreground-muted"
 >
 Empty
 </Badge>
 )}
 </div>
 <TooltipProvider>
 <Tooltip>
 <TooltipTrigger asChild>
 <Button
 variant="ghost"
 size="sm"
 className="h-6 w-6 p-0"
 onClick={(e) => {
 e.stopPropagation();
 handleCopy();
 }}
 >
 {copied ? (
 <Check className="w-3.5 h-3.5 text-brand-500" />
 ) : (
 <Copy className="w-3.5 h-3.5 text-foreground-muted" />
 )}
 </Button>
 </TooltipTrigger>
 <TooltipContent>Copy JSON</TooltipContent>
 </Tooltip>
 </TooltipProvider>
 </button>
 </CollapsibleTrigger>
 <CollapsibleContent>
 <ScrollArea
 className="mt-2 rounded-lg bg-surface-200 border border-border"
 style={{ maxHeight }}
 >
 <pre className="p-3 text-xs text-foreground-muted font-mono whitespace-pre-wrap break-all">
 {isEmpty ? (
 <span className="text-foreground-muted italic">No data</span>
 ) : (
 jsonString
 )}
 </pre>
 </ScrollArea>
 </CollapsibleContent>
 </Collapsible>
 );
}

// ========== mainComponent ==========

export function NodeDetailsPanel({
 snapshot,
 onRerunNode,
 onEditAndRerun,
 onHighlightNode,
 isLoading = false,
 className,
}: NodeDetailsPanelProps) {
 if (isLoading) {
 return (
 <div
 className={cn(
 "flex items-center justify-center h-full",
 className
 )}
 >
 <Loader2 className="w-6 h-6 text-foreground-muted animate-spin" />
 </div>
 );
 }

 if (!snapshot) {
 return (
 <div
 className={cn(
 "flex flex-col items-center justify-center h-full text-foreground-muted",
 className
 )}
 >
 <FileText className="w-10 h-10 mb-3 opacity-50" />
 <p className="text-sm">Select1StepViewDetails</p>
 </div>
 );
 }

 const statusConfig = STATUS_CONFIG[snapshot.status];
 const StatusIcon = statusConfig.icon;
 const NodeIcon = NODE_TYPE_ICONS[snapshot.nodeType] || Code;

 return (
 <div className={cn("flex flex-col h-full", className)}>
 {/* HeaderInfo */}
 <div className="shrink-0 p-4 border-b border-border">
 <div className="flex items-start justify-between mb-3">
 <div className="flex items-center gap-3">
 <div
 className={cn(
 "w-10 h-10 rounded-lg flex items-center justify-center",
 statusConfig.bgColor
 )}
 >
 <NodeIcon className={cn("w-5 h-5", statusConfig.color)} />
 </div>
 <div>
 <h3 className="text-base font-medium text-foreground">
 {snapshot.nodeName}
 </h3>
 <div className="flex items-center gap-2 mt-1">
 <Badge
 variant="secondary"
 className="text-[10px] bg-surface-200 text-foreground-muted"
 >
 {snapshot.nodeType}
 </Badge>
 <Badge
 variant="secondary"
 className={cn(
 "text-[10px]",
 statusConfig.bgColor,
 statusConfig.color
 )}
 >
 <StatusIcon
 className={cn(
 "w-3 h-3 mr-1",
 snapshot.status === "running" && "animate-spin"
 )}
 />
 {statusConfig.label}
 </Badge>
 </div>
 </div>
 </div>

 {/* ActionButton */}
 <div className="flex items-center gap-1">
 {onHighlightNode && (
 <TooltipProvider>
 <Tooltip>
 <TooltipTrigger asChild>
 <Button
 variant="ghost"
 size="sm"
 className="h-8 w-8 p-0"
 onClick={() => onHighlightNode(snapshot.nodeId)}
 >
 <Cpu className="w-4 h-4 text-foreground-muted" />
 </Button>
 </TooltipTrigger>
 <TooltipContent>atCanvasHighlight</TooltipContent>
 </Tooltip>
 </TooltipProvider>
 )}
 {onRerunNode && (
 <TooltipProvider>
 <Tooltip>
 <TooltipTrigger asChild>
 <Button
 variant="ghost"
 size="sm"
 className="h-8 w-8 p-0"
 onClick={() => onRerunNode(snapshot.nodeId)}
 >
 <RefreshCw className="w-4 h-4 text-foreground-muted" />
 </Button>
 </TooltipTrigger>
 <TooltipContent>re-thisNode</TooltipContent>
 </Tooltip>
 </TooltipProvider>
 )}
 {onEditAndRerun && (
 <TooltipProvider>
 <Tooltip>
 <TooltipTrigger asChild>
 <Button
 variant="ghost"
 size="sm"
 className="h-8 w-8 p-0"
 onClick={() => onEditAndRerun(snapshot.nodeId)}
 >
 <Pencil className="w-4 h-4 text-foreground-muted" />
 </Button>
 </TooltipTrigger>
 <TooltipContent>EditInputandre-</TooltipContent>
 </Tooltip>
 </TooltipProvider>
 )}
 </div>
 </div>

 {/* TimeandcanMetrics */}
 <div className="grid grid-cols-2 gap-3">
 <div className="p-2.5 rounded-lg bg-surface-200">
 <div className="flex items-center gap-1.5 mb-1">
 <Clock className="w-3.5 h-3.5 text-foreground-muted" />
 <span className="text-[10px] text-foreground-muted">ExecuteTime</span>
 </div>
 <p className="text-sm font-medium text-foreground">
 {formatDuration(snapshot.durationMs)}
 </p>
 </div>

 {snapshot.metadata?.tokensUsed && (
 <div className="p-2.5 rounded-lg bg-surface-200">
 <div className="flex items-center gap-1.5 mb-1">
 <Brain className="w-3.5 h-3.5 text-foreground-muted" />
 <span className="text-[10px] text-foreground-muted">Token Usage</span>
 </div>
 <p className="text-sm font-medium text-foreground">
 {snapshot.metadata.tokensUsed.toLocaleString()}
 </p>
 {snapshot.metadata.promptTokens &&
 snapshot.metadata.completionTokens && (
 <p className="text-[10px] text-foreground-muted mt-0.5">
 {snapshot.metadata.promptTokens} +{""}
 {snapshot.metadata.completionTokens}
 </p>
 )}
 </div>
 )}

 {snapshot.metadata?.httpStatusCode && (
 <div className="p-2.5 rounded-lg bg-surface-200">
 <div className="flex items-center gap-1.5 mb-1">
 <Globe className="w-3.5 h-3.5 text-foreground-muted" />
 <span className="text-[10px] text-foreground-muted">HTTP Status</span>
 </div>
 <p
 className={cn(
 "text-sm font-medium",
 snapshot.metadata.httpStatusCode >= 400
 ? "text-destructive"
 : "text-brand-500"
 )}
 >
 {snapshot.metadata.httpStatusCode}
 </p>
 </div>
 )}

 {snapshot.metadata?.model && (
 <div className="p-2.5 rounded-lg bg-surface-200">
 <div className="flex items-center gap-1.5 mb-1">
 <Brain className="w-3.5 h-3.5 text-foreground-muted" />
 <span className="text-[10px] text-foreground-muted">Model</span>
 </div>
 <p className="text-sm font-medium text-foreground truncate">
 {snapshot.metadata.model}
 </p>
 </div>
 )}
 </div>

 {/* Time */}
 <div className="mt-3 flex items-center gap-4 text-[10px] text-foreground-muted">
 <span>Start: {formatDateTime(snapshot.startedAt)}</span>
 {snapshot.completedAt && (
 <span>Done: {formatDateTime(snapshot.completedAt)}</span>
 )}
 </div>
 </div>

 {/* ContentRegion */}
 <ScrollArea className="flex-1">
 <div className="p-4 space-y-4">
 {/* ErrorInfo */}
 {snapshot.error && (
 <div className="p-3 rounded-lg bg-destructive-200 border border-destructive/30">
 <div className="flex items-center gap-2 mb-2">
 <AlertTriangle className="w-4 h-4 text-destructive" />
 <span className="text-sm font-medium text-destructive">
 ExecuteError
 </span>
 {snapshot.error.code && (
 <Badge
 variant="secondary"
 className="text-[10px] bg-destructive-200/60 text-destructive"
 >
 {snapshot.error.code}
 </Badge>
 )}
 </div>
 <p className="text-sm text-destructive">{snapshot.error.message}</p>
 {snapshot.error.stack && (
 <Collapsible className="mt-2">
 <CollapsibleTrigger asChild>
 <button className="text-[10px] text-destructive hover:text-destructive">
 ViewStack
 </button>
 </CollapsibleTrigger>
 <CollapsibleContent>
 <pre className="mt-2 p-2 text-[10px] text-destructive bg-destructive-200/60 rounded overflow-x-auto">
 {snapshot.error.stack}
 </pre>
 </CollapsibleContent>
 </Collapsible>
 )}
 </div>
 )}

 {/* InputData */}
 <JsonViewer
 data={snapshot.inputs}
 title="InputData"
 defaultOpen={true}
 />

 {/* OutputData */}
 <JsonViewer
 data={snapshot.outputs}
 title="OutputData"
 defaultOpen={snapshot.status === "completed"}
 />

 {/* Parseafter'sConfig */}
 {snapshot.resolvedConfig && (
 <JsonViewer
 data={snapshot.resolvedConfig}
 title="ParseafterConfig"
 defaultOpen={false}
 />
 )}

 {/* Logs */}
 {snapshot.logs && snapshot.logs.length > 0 && (
 <Collapsible defaultOpen={false}>
 <CollapsibleTrigger asChild>
 <button className="w-full flex items-center justify-between p-3 rounded-lg bg-surface-200 hover:bg-surface-200/60 transition-colors">
 <div className="flex items-center gap-2">
 <ChevronRight className="w-4 h-4 text-foreground-muted data-[state=open]:rotate-90 transition-transform" />
 <span className="text-sm font-medium text-foreground">
 Logs
 </span>
 <Badge
 variant="secondary"
 className="text-[10px] bg-surface-200 text-foreground-muted"
 >
 {snapshot.logs.length}
 </Badge>
 </div>
 </button>
 </CollapsibleTrigger>
 <CollapsibleContent>
 <div className="mt-2 space-y-1">
 {snapshot.logs.map((log, index) => (
 <div
 key={index}
 className={cn(
 "p-2 rounded text-xs font-mono",
 log.level === "error"
 ? "bg-destructive-200 text-destructive"
 : log.level === "warn"
 ? "bg-warning-200 text-warning"
 : "bg-surface-200 text-foreground-muted"
 )}
 >
 <span className="text-foreground-muted mr-2">
 {new Date(log.timestamp).toLocaleTimeString()}
 </span>
 <span
 className={cn(
 "mr-2 uppercase",
 log.level === "error"
 ? "text-destructive"
 : log.level === "warn"
 ? "text-warning"
 : "text-foreground-muted"
 )}
 >
 [{log.level}]
 </span>
 {log.message}
 </div>
 ))}
 </div>
 </CollapsibleContent>
 </Collapsible>
 )}
 </div>
 </ScrollArea>
 </div>
 );
}

export default NodeDetailsPanel;
