"use client";

/**
 * CreativeTaskDetailsPage - Supabase Style
 */

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
 ArrowLeft,
 Clock,
 CheckCircle,
 XCircle,
 Loader2,
 Play,
 Pause,
 RotateCcw,
 Download,
 Copy,
 FileText,
 Image,
 Code,
 MessageSquare,
 Zap,
 AlertCircle,
 ChevronRight,
 Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// TaskStatus
type TaskStatus = "pending" | "running" | "completed" | "failed";

// MockTaskData
const mockTasks: Record<string, {
 id: string;
 title: string;
 type: string;
 status: TaskStatus;
 progress: number;
 createdAt: string;
 completedAt?: string;
 prompt: string;
 result?: string;
 error?: string;
 model: string;
 tokens: number;
 duration?: number;
}> = {
 "task-1": {
 id: "task-1",
 title: "Marketing CopyGenerate",
 type: "text",
 status: "completed",
 progress: 100,
 createdAt: "2026-01-30 10:30",
 completedAt: "2026-01-30 10:31",
 prompt: "asWe'snewProduct AgentFlow 2.3 1person'sMarketing Copy, Emphasize Multi-Agent CollaborationFeaturesandcanImprove.",
 result: `🚀 AgentFlow 2.3 Publish!

, AI Collaborationnewtime!

✨ allnewMulti-Agent CollaborationFeatures
- multipleAI AgentWork
- AutoTaskDecomposeandAllocate
- SmartResulttotalandoptimal

⚡ canImprove
- ExecuteSpeedImprove 50%
- inuseReduce 30%
- letComplexWorkflowmoreSmooth

🔗 moremultipleIntegration, Nonelimitcancan
Feishu | Yuque | Notion
1keyyou'sWorkScenario

NowUpgrade, Experience AI Collaboration'sNonelimitcancan!

👉 agentflow.ai/upgrade`,
 model: "GPT-4 Turbo",
 tokens: 256,
 duration: 12,
 },
 "task-2": {
 id: "task-2",
 title: "CodeoptimalSuggestion",
 type: "code",
 status: "running",
 progress: 65,
 createdAt: "2026-01-30 11:00",
 prompt: "AnalyticsthisCodeandProvideoptimalSuggestion...",
 model: "Claude 3",
 tokens: 0,
 },
 "task-3": {
 id: "task-3",
 title: "ImageDescriptionGenerate",
 type: "image",
 status: "failed",
 progress: 0,
 createdAt: "2026-01-30 09:15",
 prompt: "asthisProductGenerateDetailedDescription...",
 error: "ImageFormatnotSupport, PleaseUsage PNG or JPG Format",
 model: "GPT-4 Vision",
 tokens: 0,
 },
};

// TypeConfig - Supabase Style
const typeConfig: Record<string, { icon: any; label: string; color: string }> = {
 text: { icon: FileText, label: "charCreative", color: "text-foreground-light" },
 image: { icon: Image, label: "ImageProcess", color: "text-foreground-light" },
 code: { icon: Code, label: "CodeAssistant", color: "text-brand-500" },
 chat: { icon: MessageSquare, label: "SmartConversation", color: "text-foreground-light" },
};

// StatusConfig - Supabase Style
const statusConfig: Record<TaskStatus, { icon: any; label: string; color: string; bgColor: string }> = {
 pending: { icon: Clock, label: "etcpending", color: "text-foreground-muted", bgColor: "bg-surface-200" },
 running: { icon: Loader2, label: "Generating", color: "text-foreground-light", bgColor: "bg-surface-200" },
 completed: { icon: CheckCircle, label: "Completed", color: "text-brand-500", bgColor: "bg-brand-200" },
 failed: { icon: XCircle, label: "Failed", color: "text-destructive", bgColor: "bg-destructive-200" },
};

export default function TaskDetailPage() {
 const params = useParams();
 const router = useRouter();
 const taskId = params.id as string;
 
 const [task, setTask] = useState(mockTasks[taskId]);
 const [copied, setCopied] = useState(false);

 if (!task) {
 return (
 <div className="h-full flex items-center justify-center">
 <div className="text-center">
 <AlertCircle className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
 <h2 className="text-lg font-medium text-foreground mb-2">TaskDoes not exist</h2>
 <p className="text-foreground-muted mb-4">TaskcancanalreadybyDelete</p>
 <Link href="/dashboard/creative">
 <Button className="bg-brand-500 hover:bg-brand-600 text-background">
 BackCreativeAssistant
 </Button>
 </Link>
 </div>
 </div>
 );
 }

 const typeInfo = typeConfig[task.type] || typeConfig.text;
 const statusInfo = statusConfig[task.status];
 const StatusIcon = statusInfo.icon;

 const handleCopy = () => {
 if (task.result) {
 navigator.clipboard.writeText(task.result);
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 }
 };

 const handleRetry = () => {
 setTask(prev => prev ? { ...prev, status: "running", progress: 0, error: undefined } : prev);
 // MockRetry
 setTimeout(() => {
 setTask(prev => prev ? { ...prev, status: "completed", progress: 100 } : prev);
 }, 3000);
 };

 return (
 <div className="h-full flex flex-col">
 {/* Header */}
 <div className="border-b border-border bg-background-studio/95 backdrop-blur">
 <div className="max-w-5xl mx-auto w-full px-6 py-4 flex items-center justify-between">
 <div className="flex items-center gap-4">
 <Link
 href="/dashboard/creative"
 className="p-2 rounded-md hover:bg-surface-75 transition-colors"
 >
 <ArrowLeft className="w-5 h-5 text-foreground-muted" />
 </Link>
 <div>
 <p className="page-caption">Creative</p>
 <div className="flex items-center gap-2">
 <typeInfo.icon className={cn("w-4 h-4", typeInfo.color)} />
 <h1 className="text-lg font-semibold text-foreground">{task.title}</h1>
 </div>
 <div className="flex items-center gap-3 text-xs text-foreground-muted mt-0.5">
 <span>{task.createdAt}</span>
 <span>•</span>
 <span>{task.model}</span>
 </div>
 </div>
 </div>

 <div className="flex items-center gap-3">
 {/* StatusTags */}
 <div className={cn(
 "flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-medium",
 statusInfo.bgColor,
 statusInfo.color
 )}>
 <StatusIcon className={cn("w-4 h-4", task.status === "running" && "animate-spin")} />
 {statusInfo.label}
 </div>

 {task.status === "failed" && (
 <Button onClick={handleRetry} variant="outline">
 <RotateCcw className="w-4 h-4 mr-2" />
 Retry
 </Button>
 )}

 {task.status === "completed" && task.result && (
 <>
 <Button variant="outline" onClick={handleCopy}>
 {copied ? (
 <Check className="w-4 h-4 mr-2 text-brand-500" />
 ) : (
 <Copy className="w-4 h-4 mr-2" />
 )}
 {copied ? "alreadyCopy": "Copy"}
 </Button>
 <Button variant="outline">
 <Download className="w-4 h-4 mr-2" />
 Export
 </Button>
 </>
 )}
 </div>
 </div>
 </div>

 {/* Content */}
 <div className="flex-1 overflow-auto p-6">
 <div className="max-w-4xl mx-auto space-y-6">
 {/* Progress Bar (RuntimeDisplay) */}
 {task.status === "running" && (
 <div className="p-4 rounded-md bg-surface-100 border border-border">
 <div className="flex items-center justify-between mb-2">
 <span className="text-sm text-foreground">GenerateProgress</span>
 <span className="text-sm text-foreground-muted">{task.progress}%</span>
 </div>
 <div className="h-2 rounded-full bg-surface-200 overflow-hidden">
 <div
 className="h-full bg-brand-500 rounded-full transition-all duration-300"
 style={{ width: `${task.progress}%` }}
 />
 </div>
 </div>
 )}

 {/* ErrorInfo */}
 {task.status === "failed" && task.error && (
 <div className="p-4 rounded-md bg-destructive-200 border border-border-muted">
 <div className="flex items-start gap-3">
 <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
 <div>
 <h4 className="font-medium text-destructive mb-1">TaskFailed</h4>
 <p className="text-sm text-destructive/80">{task.error}</p>
 </div>
 </div>
 </div>
 )}

 {/* OriginalTip */}
 <div className="p-5 rounded-md bg-surface-100 border border-border">
 <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
 <Zap className="w-4 h-4 text-foreground-muted" />
 InputTip
 </h3>
 <p className="text-foreground-muted">{task.prompt}</p>
 </div>

 {/* GenerateResult */}
 {task.result && (
 <div className="p-5 rounded-md bg-surface-100 border border-border">
 <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
 <CheckCircle className="w-4 h-4 text-brand-500" />
 GenerateResult
 </h3>
 <div className="whitespace-pre-wrap text-foreground-muted leading-relaxed">
 {task.result}
 </div>
 </div>
 )}

 {/* TaskDetails */}
 <div className="p-5 rounded-md bg-surface-100 border border-border">
 <h3 className="text-sm font-medium text-foreground mb-4">TaskDetails</h3>
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
 <div>
 <div className="text-xs text-foreground-muted mb-1">Task ID</div>
 <div className="text-sm text-foreground font-mono">{task.id}</div>
 </div>
 <div>
 <div className="text-xs text-foreground-muted mb-1">UsageModel</div>
 <div className="text-sm text-foreground">{task.model}</div>
 </div>
 <div>
 <div className="text-xs text-foreground-muted mb-1">Token Consumption</div>
 <div className="text-sm text-foreground">{task.tokens.toLocaleString()}</div>
 </div>
 {task.duration && (
 <div>
 <div className="text-xs text-foreground-muted mb-1">Duration</div>
 <div className="text-sm text-foreground">{task.duration} s</div>
 </div>
 )}
 </div>
 </div>

 {/* ActionSuggestion */}
 {task.status === "completed" && (
 <div className="p-5 rounded-md bg-surface-75 border border-border">
 <h3 className="text-sm font-medium text-foreground mb-3">Next</h3>
 <div className="grid sm:grid-cols-3 gap-3">
 <Link
 href={`/dashboard/creative/generate?template=${task.id}`}
 className="flex items-center gap-3 p-3 rounded-md bg-surface-100 border border-border hover:border-brand-400 transition-supabase group"
 >
 <RotateCcw className="w-5 h-5 text-foreground-muted group-hover:text-brand-500" />
 <span className="text-sm text-foreground">re-newGenerate</span>
 <ChevronRight className="w-4 h-4 text-foreground-muted ml-auto" />
 </Link>
 <Link
 href="/dashboard/creative/generate"
 className="flex items-center gap-3 p-3 rounded-md bg-surface-100 border border-border hover:border-brand-400 transition-supabase group"
 >
 <Zap className="w-5 h-5 text-foreground-muted group-hover:text-brand-500" />
 <span className="text-sm text-foreground">CreateTask</span>
 <ChevronRight className="w-4 h-4 text-foreground-muted ml-auto" />
 </Link>
 <button
 onClick={handleCopy}
 className="flex items-center gap-3 p-3 rounded-md bg-surface-100 border border-border hover:border-brand-400 transition-supabase group"
 >
 <Copy className="w-5 h-5 text-foreground-muted group-hover:text-brand-500" />
 <span className="text-sm text-foreground">CopyResult</span>
 <ChevronRight className="w-4 h-4 text-foreground-muted ml-auto" />
 </button>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 );
}
