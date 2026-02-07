"use client";

/**
 * Real-timeExecuteMonitorPanel
 * 
 * CurrentExecute'sWorkflowList, ExecuteProgress BarandNodeStatus, Real-timeLogs
 * Usage WebSocket ProceedReal-timeUpdate
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
 Activity,
 Play,
 Pause,
 Square,
 ChevronDown,
 ChevronUp,
 Terminal,
 Clock,
 Zap,
 RefreshCw,
 Wifi,
 WifiOff,
 Loader2,
 ExternalLink,
} from "lucide-react";
import { useWebSocket, type WSMessage, type ExecutionPayload, type LogPayload } from "@/hooks/useWebSocket";
import { executionApi } from "@/lib/api";
import type { ExecutionRecord } from "@/types/execution";

interface ExecutingWorkflow {
 id: string;
 executionId: string;
 workflowId: string;
 name: string;
 icon: string;
 startTime: Date;
 currentNode: string;
 totalNodes: number;
 completedNodes: number;
 status: "pending" | "running" | "paused" | "completing" | "completed" | "failed";
 progress: number;
 logs: LogEntry[];
}

interface LogEntry {
 id: string;
 timestamp: Date;
 level: "info" | "success" | "warning" | "error";
 message: string;
 node?: string;
}

interface LiveExecutionMonitorProps {
 className?: string;
 workflowId?: string; // Optional, SpecifyMonitorSpecificWorkflow
}

export function LiveExecutionMonitor({ className, workflowId }: LiveExecutionMonitorProps) {
 const router = useRouter();
 const [workflows, setWorkflows] = useState<ExecutingWorkflow[]>([]);
 const [expandedId, setExpandedId] = useState<string | null>(null);
 const [isAutoScroll, setIsAutoScroll] = useState(true);
 const logEndRef = useRef<HTMLDivElement>(null);
 const [isLoading, setIsLoading] = useState(true);

 // LoadRun'sExecuteRecord
 const loadRunningExecutions = useCallback(async () => {
 try {
 const response = await executionApi.list({
 status: "running",
 workflowId: workflowId,
 pageSize: 10,
 });
 
 // Convertas ExecutingWorkflow Format
 const runningWorkflows: ExecutingWorkflow[] = (response.data || []).map((exec: ExecutionRecord) => ({
 id: exec.id,
 executionId: exec.id,
 workflowId: exec.workflowId,
 name: exec.workflowName || `Workflow ${exec.workflowId.slice(-6)}`,
 icon: exec.workflowIcon || "🔄",
 startTime: exec.startedAt ? new Date(exec.startedAt) : new Date(exec.createdAt),
 currentNode: "Execute",
 totalNodes: 1,
 completedNodes: 0,
 status: "running" as const,
 progress: 50,
 logs: [{
 id: `log-${Date.now()}`,
 timestamp: new Date(),
 level: "info" as const,
 message: "currentlyatExecute...",
 }],
 }));
 
 setWorkflows(runningWorkflows);
 } catch (err) {
 console.error("LoadExecuteRecordFailed:", err);
 } finally {
 setIsLoading(false);
 }
 }, [workflowId]);

 // InitialLoad
 useEffect(() => {
 loadRunningExecutions();
 }, [loadRunningExecutions]);

 // WebSocket Connect
 const handleMessage = useCallback((message: WSMessage) => {
 const { type, payload, timestamp } = message;

 switch (type) {
 case "execution.started": {
 const execPayload = payload as ExecutionPayload;
 // CheckisnoneedneedFilterWorkflow
 if (workflowId && execPayload.workflowId !== workflowId) return;
 
 setWorkflows((prev) => {
 // CheckisnoAlready exists
 if (prev.find((w) => w.executionId === execPayload.executionId)) return prev;
 
 return [
 ...prev,
 {
 id: execPayload.executionId,
 executionId: execPayload.executionId,
 workflowId: execPayload.workflowId || "",
 name: `Workflow ${execPayload.workflowId?.slice(-6) || "Unknown"}`,
 icon: "🔄",
 startTime: new Date(timestamp),
 currentNode: "Start",
 totalNodes: execPayload.totalNodes || 1,
 completedNodes: 0,
 status: "running",
 progress: 0,
 logs: [
 {
 id: `log-${Date.now()}`,
 timestamp: new Date(timestamp),
 level: "info",
 message: "ExecutealreadyStart",
 },
 ],
 },
 ];
 });
 break;
 }

 case "execution.node.started": {
 const nodePayload = payload as ExecutionPayload;
 setWorkflows((prev) =>
 prev.map((wf) =>
 wf.executionId === nodePayload.executionId
 ? {
 ...wf,
 currentNode: nodePayload.nodeType || nodePayload.nodeId || wf.currentNode,
 logs: [
 ...wf.logs.slice(-50),
 {
 id: `log-${Date.now()}`,
 timestamp: new Date(timestamp),
 level: "info" as const,
 message: `Node ${nodePayload.nodeType || nodePayload.nodeId} StartExecute`,
 node: nodePayload.nodeType || nodePayload.nodeId,
 },
 ],
 }
 : wf
 )
 );
 break;
 }

 case "execution.node.completed": {
 const nodePayload = payload as ExecutionPayload;
 setWorkflows((prev) =>
 prev.map((wf) =>
 wf.executionId === nodePayload.executionId
 ? {
 ...wf,
 completedNodes: (nodePayload.completedNodes ?? wf.completedNodes + 1),
 progress: nodePayload.progress ?? wf.progress,
 status: nodePayload.completedNodes === nodePayload.totalNodes ? "completing" : wf.status,
 logs: [
 ...wf.logs.slice(-50),
 {
 id: `log-${Date.now()}`,
 timestamp: new Date(timestamp),
 level: "success" as const,
 message: `Node ${nodePayload.nodeType || nodePayload.nodeId} Done (${nodePayload.durationMs}ms)`,
 node: nodePayload.nodeType || nodePayload.nodeId,
 },
 ],
 }
 : wf
 )
 );
 break;
 }

 case "execution.node.failed": {
 const nodePayload = payload as ExecutionPayload;
 setWorkflows((prev) =>
 prev.map((wf) =>
 wf.executionId === nodePayload.executionId
 ? {
 ...wf,
 logs: [
 ...wf.logs.slice(-50),
 {
 id: `log-${Date.now()}`,
 timestamp: new Date(timestamp),
 level: "error" as const,
 message: `Node ${nodePayload.nodeType || nodePayload.nodeId} Failed: ${nodePayload.error}`,
 node: nodePayload.nodeType || nodePayload.nodeId,
 },
 ],
 }
 : wf
 )
 );
 break;
 }

 case "execution.progress": {
 const progressPayload = payload as ExecutionPayload;
 setWorkflows((prev) =>
 prev.map((wf) =>
 wf.executionId === progressPayload.executionId
 ? {
 ...wf,
 completedNodes: progressPayload.completedNodes ?? wf.completedNodes,
 totalNodes: progressPayload.totalNodes ?? wf.totalNodes,
 progress: progressPayload.progress ?? wf.progress,
 }
 : wf
 )
 );
 break;
 }

 case "execution.log": {
 const logPayload = payload as LogPayload;
 setWorkflows((prev) =>
 prev.map((wf) =>
 wf.executionId === logPayload.executionId
 ? {
 ...wf,
 logs: [
 ...wf.logs.slice(-50),
 {
 id: `log-${Date.now()}`,
 timestamp: new Date(logPayload.timestamp || timestamp),
 level: logPayload.level === "debug" ? "info" : logPayload.level,
 message: logPayload.message,
 node: logPayload.nodeId,
 },
 ],
 }
 : wf
 )
 );
 break;
 }

 case "execution.completed": {
 const execPayload = payload as ExecutionPayload;
 setWorkflows((prev) =>
 prev.map((wf) =>
 wf.executionId === execPayload.executionId
 ? {
 ...wf,
 status: "completed",
 completedNodes: wf.totalNodes,
 progress: 100,
 logs: [
 ...wf.logs.slice(-50),
 {
 id: `log-${Date.now()}`,
 timestamp: new Date(timestamp),
 level: "success" as const,
 message: `ExecuteDone (totalDuration: ${execPayload.durationMs}ms)`,
 },
 ],
 }
 : wf
 )
 );
 // 3safterAutoRemoveCompleted'sExecute
 setTimeout(() => {
 setWorkflows((prev) => prev.filter((wf) => wf.executionId !== execPayload.executionId));
 }, 5000);
 break;
 }

 case "execution.failed": {
 const execPayload = payload as ExecutionPayload;
 setWorkflows((prev) =>
 prev.map((wf) =>
 wf.executionId === execPayload.executionId
 ? {
 ...wf,
 status: "failed",
 logs: [
 ...wf.logs.slice(-50),
 {
 id: `log-${Date.now()}`,
 timestamp: new Date(timestamp),
 level: "error" as const,
 message: `ExecuteFailed: ${execPayload.error}`,
 },
 ],
 }
 : wf
 )
 );
 break;
 }

 case "execution.cancelled": {
 const execPayload = payload as ExecutionPayload;
 setWorkflows((prev) => prev.filter((wf) => wf.executionId !== execPayload.executionId));
 break;
 }
 }
 }, [workflowId]);

 const {
 connectionState,
 isConnected,
 connect,
 disconnect,
 subscribe,
 unsubscribe,
 } = useWebSocket({
 onMessage: handleMessage,
 autoConnect: true,
 });

 // CancelExecute
 const handleCancel = async (executionId: string) => {
 try {
 await executionApi.cancel(executionId);
 setWorkflows((prev) => prev.filter((wf) => wf.executionId !== executionId));
 } catch (err) {
 console.error("CancelExecuteFailed:", err);
 }
 };

 // AutoScrolltomostnewLogs
 useEffect(() => {
 if (isAutoScroll && logEndRef.current) {
 logEndRef.current.scrollIntoView({ behavior: "smooth" });
 }
 }, [workflows, isAutoScroll]);

 // NavigatetoExecuteDetails
 const handleViewDetail = (executionId: string) => {
 router.push(`/executions/${executionId}`);
 };

 const formatDuration = (startTime: Date) => {
 const seconds = Math.floor((Date.now() - startTime.getTime()) / 1000);
 if (seconds < 60) return `${seconds}s`;
 const minutes = Math.floor(seconds / 60);
 const remainingSeconds = seconds % 60;
 return `${minutes}m ${remainingSeconds}s`;
 };

 const getLogLevelStyle = (level: LogEntry["level"]) => {
 switch (level) {
 case "success":
 return "text-primary";
 case "warning":
 return "text-amber-500";
 case "error":
 return "text-red-500";
 default:
 return "text-muted-foreground";
 }
 };

 const getStatusStyle = (status: ExecutingWorkflow["status"]) => {
 switch (status) {
 case "pending":
 return "bg-orange-500/10 text-orange-500";
 case "running":
 return "bg-blue-500/10 text-blue-500";
 case "paused":
 return "bg-amber-500/10 text-amber-500";
 case "completing":
 case "completed":
 return "bg-primary/10 text-primary";
 case "failed":
 return "bg-red-500/10 text-red-500";
 default:
 return "bg-muted text-muted-foreground";
 }
 };

 const getStatusText = (status: ExecutingWorkflow["status"]) => {
 switch (status) {
 case "pending":
 return "etcpending";
 case "running":
 return "Run";
 case "paused":
 return "Paused";
 case "completing":
 return "nowwillDone";
 case "completed":
 return "Completed";
 case "failed":
 return "Failed";
 default:
 return status;
 }
 };

 const runningCount = workflows.filter((w) => w.status === "running" || w.status === "pending").length;

 return (
 <Card className={cn("border border-border/60 bg-card/80 backdrop-blur-sm overflow-hidden hover:border-amber-500/20 transition-colors duration-300", className)}>
 {/* Header - Enhanced */}
 <div className="flex items-center justify-between p-4 border-b border-border/50 bg-gradient-to-r from-amber-500/5 via-transparent to-transparent">
 <div className="flex items-center gap-3">
 <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-amber-500/15 to-amber-500/5 ring-1 ring-amber-500/20 shadow-lg shadow-amber-500/10">
 <Activity className="w-5 h-5 text-amber-500" />
 {runningCount > 0 && (
 <>
 <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full ring-2 ring-card flex items-center justify-center">
 <span className="text-[9px] font-bold text-primary-foreground">{runningCount}</span>
 </span>
 <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full animate-ping opacity-50" />
 </>
 )}
 </div>
 <div>
 <h3 className="font-bold text-foreground flex items-center gap-2">
 Real-timeExecuteMonitor
 {runningCount > 0 && (
 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
 <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
 Active
 </span>
 )}
 </h3>
 <p className="text-xs text-muted-foreground">
 {runningCount > 0 ? `${runningCount} WorkflowcurrentlyatExecute`: "NoneExecute'sTask"}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 {/* ConnectStatusIndicator - Enhanced */}
 <div className={cn(
 "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-300",
 isConnected 
 ? "bg-primary/10 text-primary ring-1 ring-primary/20" 
 : "bg-red-500/10 text-red-500 ring-1 ring-red-500/20"
 )}>
 {connectionState === "connecting" ? (
 <Loader2 className="w-3.5 h-3.5 animate-spin" />
 ) : isConnected ? (
 <Wifi className="w-3.5 h-3.5" />
 ) : (
 <WifiOff className="w-3.5 h-3.5" />
 )}
 <span>{isConnected ? "Connected": connectionState === "connecting" ? "Connecting": "Disconnected"}</span>
 </div>
 {!isConnected && (
 <Button
 variant="ghost"
 size="sm"
 onClick={connect}
 className="text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10"
 >
 <RefreshCw className="w-4 h-4" />
 </Button>
 )}
 </div>
 </div>

 {/* ExecuteList - Enhanced */}
 <div className="max-h-[400px] overflow-auto">
 {isLoading ? (
 <div className="p-10 flex flex-col items-center justify-center">
 <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4 ring-1 ring-amber-500/20">
 <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
 </div>
 <p className="text-sm font-medium text-muted-foreground">LoadExecuteRecord...</p>
 </div>
 ) : workflows.length === 0 ? (
 <div className="p-10 text-center">
 <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4 ring-1 ring-border/50">
 <Zap className="w-8 h-8 text-muted-foreground/70" />
 </div>
 <p className="text-sm font-semibold text-foreground">NoneExecute'sTask</p>
 <p className="text-xs text-muted-foreground mt-1.5">
 {isConnected ? (
 <span className="flex items-center justify-center gap-1.5">
 <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
 WebSocket Connected, etcpendingExecuteEvent...
 </span>
 ) : (
 "PleaseCheck WebSocket Connect"
 )}
 </p>
 </div>
 ) : (
 workflows.map((workflow, index) => (
 <div 
 key={workflow.executionId} 
 className="border-b border-border/30 last:border-0"
 style={{
 animationDelay: `${index * 50}ms`,
 animation: 'fadeInUp 300ms ease-out both'
 }}
 >
 {/* WorkflowInfo */}
 <button
 onClick={() => setExpandedId(expandedId === workflow.executionId ? null : workflow.executionId)}
 className="w-full p-4 flex items-center gap-4 hover:bg-amber-500/5 transition-all duration-200 group"
 >
 <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform ring-1 ring-border/50">
 {workflow.icon}
 </div>
 <div className="flex-1 min-w-0 text-left">
 <div className="flex items-center gap-2 mb-2">
 <h4 className="font-semibold text-foreground truncate group-hover:text-amber-500 transition-colors">{workflow.name}</h4>
 <span className={cn(
 "px-2.5 py-0.5 rounded-full text-[10px] font-semibold ring-1",
 workflow.status === "running" && "bg-blue-500/10 text-blue-500 ring-blue-500/20",
 workflow.status === "pending" && "bg-orange-500/10 text-orange-500 ring-orange-500/20",
 workflow.status === "paused" && "bg-amber-500/10 text-amber-500 ring-amber-500/20",
 workflow.status === "completing" && "bg-primary/10 text-primary ring-primary/20",
 workflow.status === "completed" && "bg-primary/10 text-primary ring-primary/20",
 workflow.status === "failed" && "bg-red-500/10 text-red-500 ring-red-500/20"
 )}>
 {workflow.status === "running" && <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5 animate-pulse" />}
 {getStatusText(workflow.status)}
 </span>
 </div>

 {/* Progress Bar - Enhanced */}
 <div className="flex items-center gap-3">
 <div className="flex-1 h-2.5 bg-muted/50 rounded-full overflow-hidden ring-1 ring-border/30">
 <div
 className={cn(
 "h-full rounded-full transition-all duration-500 relative",
 workflow.status === "running" && "bg-gradient-to-r from-blue-500 to-blue-400",
 workflow.status === "completing" && "bg-gradient-to-r from-primary to-primary/90",
 workflow.status === "completed" && "bg-gradient-to-r from-primary to-primary/90",
 workflow.status === "failed" && "bg-gradient-to-r from-red-500 to-red-400"
 )}
 style={{
 width: `${workflow.totalNodes > 0 ? (workflow.completedNodes / workflow.totalNodes) * 100 : workflow.progress}%`,
 }}
 >
 {workflow.status === "running" && (
 <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 animate-shimmer" />
 )}
 </div>
 </div>
 <span className="text-xs font-mono text-muted-foreground shrink-0 bg-muted/50 px-2 py-0.5 rounded-md">
 {workflow.completedNodes}/{workflow.totalNodes}
 </span>
 </div>

 <div className="flex items-center gap-4 mt-2.5 text-xs text-muted-foreground">
 <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/30">
 <Clock className="w-3 h-3" />
 {formatDuration(workflow.startTime)}
 </span>
 <span className="truncate flex items-center gap-1.5">
 <Zap className="w-3 h-3 text-amber-500" />
 {workflow.currentNode}
 </span>
 </div>
 </div>

 <div className="flex items-center gap-2">
 {(workflow.status === "running" || workflow.status === "pending") && (
 <Button
 variant="ghost"
 size="sm"
 className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
 onClick={(e) => {
 e.stopPropagation();
 handleCancel(workflow.executionId);
 }}
 >
 <Square className="w-4 h-4" />
 </Button>
 )}
 <Button
 variant="ghost"
 size="sm"
 className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
 onClick={(e) => {
 e.stopPropagation();
 handleViewDetail(workflow.executionId);
 }}
 >
 <ExternalLink className="w-4 h-4" />
 </Button>
 {expandedId === workflow.executionId ? (
 <ChevronUp className="w-4 h-4 text-muted-foreground" />
 ) : (
 <ChevronDown className="w-4 h-4 text-muted-foreground" />
 )}
 </div>
 </button>

 {/* Expand'sLogsRegion - Enhanced */}
 {expandedId === workflow.executionId && (
 <div className="border-t border-border/50 bg-gradient-to-b from-muted/30 to-muted/10">
 <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30">
 <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
 <div className="p-1 rounded-md bg-muted/50">
 <Terminal className="w-3 h-3" />
 </div>
 ExecuteLogs
 <span className="text-[10px] text-muted-foreground/60 px-1.5 py-0.5 rounded-full bg-muted/50">
 {workflow.logs.length} 
 </span>
 </div>
 <button
 onClick={() => setIsAutoScroll(!isAutoScroll)}
 className={cn(
 "text-xs px-2 py-1 rounded-lg transition-all duration-200",
 isAutoScroll 
 ? "text-primary bg-primary/10 ring-1 ring-primary/20" 
 : "text-muted-foreground hover:bg-muted/50"
 )}
 >
 {isAutoScroll ? "⏬ AutoScroll": "⏸ ManualScroll"}
 </button>
 </div>
 <div className="max-h-48 overflow-auto p-3 font-mono text-xs space-y-1.5 bg-card/50">
 {workflow.logs.map((log, logIndex) => (
 <div 
 key={log.id} 
 className="flex items-start gap-2 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
 style={{
 animationDelay: `${logIndex * 20}ms`,
 animation: logIndex >= workflow.logs.length - 3 ? 'fadeInUp 200ms ease-out both' : 'none'
 }}
 >
 <span className="text-muted-foreground/40 shrink-0 font-normal">
 {log.timestamp.toLocaleTimeString()}
 </span>
 {log.node && (
 <span className="text-blue-400 shrink-0 px-1.5 py-0.5 rounded bg-blue-500/10 text-[10px]">{log.node}</span>
 )}
 <span className={cn(getLogLevelStyle(log.level), "flex-1")}>{log.message}</span>
 </div>
 ))}
 <div ref={logEndRef} />
 </div>
 </div>
 )}
 </div>
 ))
 )}
 </div>
 </Card>
 );
}
