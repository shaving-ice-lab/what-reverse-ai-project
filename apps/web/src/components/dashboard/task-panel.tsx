"use client";

/**
 * Task Panel
 * 
 * Today's pending tasks, failed workflows needing attention, and quick action entries
 * Load failed execution records and pending workflows from API
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
 ListTodo,
 Clock,
 AlertCircle,
 Play,
 RefreshCw,
 Trash2,
 Calendar,
 ChevronRight,
 CheckCircle2,
 Circle,
 MoreHorizontal,
 Loader2,
} from "lucide-react";
import { executionApi } from "@/lib/api";
import type { ExecutionRecord } from "@/types/execution";

type TaskStatus = "pending" | "failed" | "scheduled" | "running";

interface Task {
 id: string;
 executionId?: string;
 workflowId?: string;
 name: string;
 icon: string;
 status: TaskStatus;
 description?: string;
 scheduledTime?: Date;
 errorMessage?: string;
 retryCount?: number;
 priority?: "high" | "medium" | "low";
}

interface TaskPanelProps {
 className?: string;
}

export function TaskPanel({ className }: TaskPanelProps) {
 const router = useRouter();
 const [tasks, setTasks] = useState<Task[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [activeTab, setActiveTab] = useState<"all" | "failed" | "scheduled">("all");
 const [actionMenuId, setActionMenuId] = useState<string | null>(null);

 // Load failed execution records
 const loadTasks = useCallback(async () => {
   setIsLoading(true);
   try {
     // Load failed execution records
 const failedResponse = await executionApi.list({
 status: "failed",
 pageSize: 10,
 });
 
     // Load pending execution records
 const pendingResponse = await executionApi.list({
 status: "pending",
 pageSize: 5,
 });
 
     // Convert to task format
 const failedTasks: Task[] = (failedResponse.data || []).map((exec: ExecutionRecord) => ({
 id: exec.id,
 executionId: exec.id,
       workflowId: exec.workflowId,
       name: exec.workflowName || `Workflow ${exec.workflowId.slice(-6)}`,
       icon: exec.workflowIcon || "❌",
       status: "failed" as const,
       description: "Failed to execute",
       errorMessage: exec.errorMessage || "Unknown error",
 priority: "high" as const,
 }));
 
 const pendingTasks: Task[] = (pendingResponse.data || []).map((exec: ExecutionRecord) => ({
 id: exec.id,
 executionId: exec.id,
 workflowId: exec.workflowId,
       name: exec.workflowName || `Workflow ${exec.workflowId.slice(-6)}`,
       icon: exec.workflowIcon || "⏳",
       status: "pending" as const,
       description: "Pending execution",
 priority: "medium" as const,
 }));
 
 setTasks([...failedTasks, ...pendingTasks]);
 } catch (err) {
     console.error("Failed to load tasks:", err);
 } finally {
 setIsLoading(false);
 }
 }, []);

 // InitialLoad
 useEffect(() => {
 loadTasks();
 }, [loadTasks]);

 const filteredTasks = tasks.filter((task) => {
 if (activeTab === "all") return true;
 if (activeTab === "failed") return task.status === "failed";
 if (activeTab === "scheduled") return task.status === "scheduled" || task.status === "pending";
 return task.status === activeTab;
 });

 const failedCount = tasks.filter((t) => t.status === "failed").length;
 const scheduledCount = tasks.filter((t) => t.status === "scheduled" || t.status === "pending").length;

 const handleViewExecution = (executionId?: string) => {
 if (executionId) {
 router.push(`/executions/${executionId}`);
 }
 setActionMenuId(null);
 };

 const handleRunTask = (id: string) => {
 const task = tasks.find(t => t.id === id);
 if (task?.workflowId) {
 router.push(`/editor/${task.workflowId}`);
 }
 setActionMenuId(null);
 };

 const handleRetryTask = async (id: string) => {
 const task = tasks.find(t => t.id === id);
 if (task?.executionId) {
 try {
 const response = await executionApi.retry(task.executionId);
 // Navigate to new execution details
 router.push(`/executions/${response.data.executionId}`);
 } catch (err) {
       console.error("Failed to retry:", err);
 }
 }
 setActionMenuId(null);
 };

 const handleDeleteTask = (id: string) => {
 setTasks((prev) => prev.filter((t) => t.id !== id));
 setActionMenuId(null);
 };

 const handleCompleteTask = (id: string) => {
 setTasks((prev) => prev.filter((t) => t.id !== id));
 };

 const formatScheduledTime = (date: Date) => {
 const now = new Date();
 const diff = date.getTime() - now.getTime();
 const hours = Math.floor(diff / 3600000);
 const minutes = Math.floor((diff % 3600000) / 60000);

   if (hours > 0) return `in ${hours}h ${minutes}m`;
   return `in ${minutes}m`;
 };

 const getPriorityColor = (priority?: Task["priority"]) => {
 switch (priority) {
 case "high":
 return "text-red-500";
 case "medium":
 return "text-amber-500";
 case "low":
 return "text-blue-500";
 default:
 return "text-muted-foreground";
 }
 };

 return (
 <Card className={cn("border border-border/60 bg-card/80 backdrop-blur-sm overflow-hidden hover:border-orange-500/20 transition-colors duration-300", className)}>
 {/* Header */}
 <div className="flex items-center justify-between p-4 border-b border-border/50">
 <div className="flex items-center gap-3">
 <div className="p-2.5 rounded-xl bg-orange-500/10 ring-1 ring-orange-500/20">
 <ListTodo className="w-5 h-5 text-orange-500" />
 </div>
 <div>
           <h3 className="font-bold text-foreground">Tasks</h3>
 <p className="text-xs text-muted-foreground">
 {failedCount > 0 && (
 <span className="text-red-500 font-medium">{failedCount} Failed</span>
 )}
 {failedCount > 0 && scheduledCount > 0 && ""}
 {scheduledCount > 0 && (
             <span>{scheduledCount} pending</span>
           )}
           {failedCount === 0 && scheduledCount === 0 && "No tasks"}
 </p>
 </div>
 </div>

 <Button 
 variant="ghost" 
 size="sm" 
 className="text-muted-foreground"
 onClick={loadTasks}
 disabled={isLoading}
 >
 <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
 </Button>
 </div>

 {/* Tab - Enhanced */}
 <div className="flex items-center gap-1 p-2 border-b border-border/50 bg-gradient-to-r from-muted/30 via-transparent to-muted/30">
 {(["all", "failed", "scheduled"] as const).map((tab) => (
 <button
 key={tab}
 onClick={() => setActiveTab(tab)}
 className={cn(
 "px-3 py-2 text-xs font-medium rounded-xl transition-all duration-200",
 activeTab === tab
 ? cn(
 "shadow-sm",
 tab === "all" && "bg-card text-foreground ring-1 ring-border/50",
 tab === "failed" && "bg-red-500/10 text-red-500 ring-1 ring-red-500/20",
 tab === "scheduled" && "bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20"
 )
 : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
 )}
 >
           {tab === "all" && "All"}
 {tab === "failed" && (
 <span className="flex items-center gap-1.5">
 <AlertCircle className="w-3.5 h-3.5" />
 Failed {failedCount > 0 && <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-[10px] font-bold">{failedCount}</span>}
 </span>
 )}
 {tab === "scheduled" && (
 <span className="flex items-center gap-1.5">
 <Clock className="w-3.5 h-3.5" />
 Plan {scheduledCount > 0 && <span className="px-1.5 py-0.5 rounded-full bg-blue-500/20 text-[10px] font-bold">{scheduledCount}</span>}
 </span>
 )}
 </button>
 ))}
 </div>

 {/* TaskList - Enhanced */}
 <div className="max-h-80 overflow-auto">
 {isLoading ? (
 <div className="py-14 text-center">
 <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-orange-500/10 flex items-center justify-center">
 <Loader2 className="w-7 h-7 text-orange-500 animate-spin" />
 </div>
           <p className="text-sm font-medium text-muted-foreground">Loading tasks...</p>
 </div>
 ) : filteredTasks.length === 0 ? (
 <div className="py-14 text-center">
 <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
 <CheckCircle2 className="w-8 h-8 text-primary" />
 </div>
 <p className="text-sm font-semibold text-foreground">
             {activeTab === "failed" ? "Great!" : "All clear"}
           </p>
           <p className="text-xs text-muted-foreground mt-1">
             {activeTab === "failed" ? "No failed tasks 🎉" : "No pending tasks"}
 </p>
 </div>
 ) : (
 filteredTasks.map((task, index) => (
 <div
 key={task.id}
 className={cn(
 "p-4 border-b border-border/30 last:border-0 transition-all duration-200 group cursor-pointer",
 task.status === "failed" && "hover:bg-red-500/5",
 task.status === "scheduled" && "hover:bg-blue-500/5",
 task.status === "pending" && "hover:bg-muted/30"
 )}
 style={{
 animationDelay: `${index * 50}ms`,
 animation: 'fadeInUp 300ms ease-out both'
 }}
 >
 <div className="flex items-start gap-3">
 {/* Status Icon / Done Button */}
 <button
 onClick={() => task.status === "pending" && handleCompleteTask(task.id)}
 className={cn(
 "shrink-0 mt-0.5 transition-all duration-200 p-1.5 rounded-lg",
 task.status === "pending" && "text-muted-foreground hover:text-primary hover:bg-primary/10",
 task.status === "failed" && "bg-red-500/10",
 task.status === "scheduled" && "bg-blue-500/10"
 )}
 disabled={task.status !== "pending"}
 >
 {task.status === "failed" && (
 <AlertCircle className="w-5 h-5 text-red-500" />
 )}
 {task.status === "scheduled" && (
 <Clock className="w-5 h-5 text-blue-500" />
 )}
 {task.status === "pending" && (
 <Circle className="w-5 h-5" />
 )}
 </button>

 {/* Task Info */}
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-1.5">
 <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center text-base group-hover:scale-110 transition-transform">
 {task.icon}
 </div>
 <div className="flex-1 min-w-0">
 <h4 className="text-sm font-semibold text-foreground truncate group-hover:text-orange-500 transition-colors">
 {task.name}
 </h4>
 {task.description && (
 <p className="text-xs text-muted-foreground truncate">
 {task.description}
 </p>
 )}
 </div>
 {task.priority && (
 <span className={cn(
 "w-2 h-2 rounded-full ring-2 ring-offset-1 ring-offset-card",
 task.priority === "high" && "bg-red-500 ring-red-500/30",
 task.priority === "medium" && "bg-amber-500 ring-amber-500/30",
 task.priority === "low" && "bg-blue-500 ring-blue-500/30"
 )} />
 )}
 </div>

 {/* Status Info */}
 {task.status === "failed" && (
 <div className="flex items-center gap-2 text-xs mt-2">
 <span className="px-2 py-1 rounded-lg bg-red-500/10 text-red-500 ring-1 ring-red-500/20 truncate max-w-[200px]">
 {task.errorMessage}
 </span>
 {task.retryCount && (
 <span className="text-muted-foreground px-1.5 py-0.5 rounded-md bg-muted/50">
                   Retried {task.retryCount} times
 </span>
 )}
 </div>
 )}

 {task.status === "scheduled" && task.scheduledTime && (
 <div className="flex items-center gap-1.5 text-xs text-blue-500 mt-2 px-2 py-1 rounded-lg bg-blue-500/10 ring-1 ring-blue-500/20 w-fit">
 <Clock className="w-3 h-3" />
 {formatScheduledTime(task.scheduledTime)}
 </div>
 )}
 </div>

{/* Action Buttons */}
               <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200">
 {task.status === "failed" && (
 <button
 onClick={() => handleRetryTask(task.id)}
 className="p-2 rounded-xl hover:bg-primary/10 transition-all duration-200 text-muted-foreground hover:text-primary hover:scale-110"
 title="Retry"
 >
 <RefreshCw className="w-4 h-4" />
 </button>
 )}

 {task.status === "scheduled" && (
 <button
 onClick={() => handleRunTask(task.id)}
 className="p-2 rounded-xl hover:bg-primary/10 transition-all duration-200 text-muted-foreground hover:text-primary hover:scale-110"
                   title="Run Now"
 >
 <Play className="w-4 h-4" />
 </button>
 )}

 {/* More Actions */}
 <div className="relative">
 <button
 onClick={() => setActionMenuId(actionMenuId === task.id ? null : task.id)}
 className="p-2 rounded-xl hover:bg-muted/50 transition-all duration-200 text-muted-foreground hover:text-foreground"
 >
 <MoreHorizontal className="w-4 h-4" />
 </button>

 {actionMenuId === task.id && (
 <div className="absolute right-0 top-full mt-2 bg-popover/95 backdrop-blur-sm border border-border/50 rounded-xl shadow-2xl overflow-hidden z-10 min-w-[140px] ring-1 ring-white/5">
 <button
 onClick={() => handleRunTask(task.id)}
 className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-left hover:bg-primary/10 transition-colors group"
 >
 <Play className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
 <span className="group-hover:text-primary">Run</span>
 </button>
 <div className="h-px bg-border/50 mx-2" />
 <button
 onClick={() => handleDeleteTask(task.id)}
 className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-left hover:bg-red-500/10 transition-colors text-red-500"
 >
 <Trash2 className="w-4 h-4" />
 Delete
 </button>
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 ))
 )}
 </div>

 {/* Footer Quick Actions - Enhanced */}
 <div className="p-4 border-t border-border/50 bg-gradient-to-r from-muted/30 via-transparent to-muted/30">
 <div className="flex items-center justify-between">
 <span className="text-xs text-muted-foreground flex items-center gap-2">
 <ListTodo className="w-3 h-3" />
           {tasks.length} tasks
 </span>
 <button
 onClick={() => router.push("/dashboard/executions?status=failed")}
 className="text-xs text-orange-500 hover:text-orange-400 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-orange-500/10 transition-colors group"
 >
           View all execution records
 <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
 </button>
 </div>
 </div>
 </Card>
 );
}
