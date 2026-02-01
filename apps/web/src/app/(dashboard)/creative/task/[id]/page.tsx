"use client";

/**
 * 创作任务详情页面 - Supabase 风格
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

// 任务状态
type TaskStatus = "pending" | "running" | "completed" | "failed";

// 模拟任务数据
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
    title: "营销文案生成",
    type: "text",
    status: "completed",
    progress: 100,
    createdAt: "2026-01-30 10:30",
    completedAt: "2026-01-30 10:31",
    prompt: "为我们的新产品 AgentFlow 2.3 写一段吸引人的营销文案，强调 Multi-Agent 协作功能和性能提升。",
    result: `🚀 AgentFlow 2.3 震撼发布！

告别单打独斗，迎接 AI 协作新时代！

✨ 全新 Multi-Agent 协作功能
- 多个 AI 智能体协同工作
- 自动任务分解与分配
- 智能结果汇总与优化

⚡ 性能飞跃提升
- 执行速度提升 50%
- 内存占用降低 30%
- 让复杂工作流更加流畅

🔗 更多集成，无限可能
飞书 | 语雀 | Notion
一键打通你的工作场景

立即升级，体验 AI 协作的无限可能！

👉 agentflow.ai/upgrade`,
    model: "GPT-4 Turbo",
    tokens: 256,
    duration: 12,
  },
  "task-2": {
    id: "task-2",
    title: "代码优化建议",
    type: "code",
    status: "running",
    progress: 65,
    createdAt: "2026-01-30 11:00",
    prompt: "分析这段代码并提供优化建议...",
    model: "Claude 3",
    tokens: 0,
  },
  "task-3": {
    id: "task-3",
    title: "图像描述生成",
    type: "image",
    status: "failed",
    progress: 0,
    createdAt: "2026-01-30 09:15",
    prompt: "为这张产品图生成详细描述...",
    error: "图像格式不支持，请使用 PNG 或 JPG 格式",
    model: "GPT-4 Vision",
    tokens: 0,
  },
};

// 类型配置 - Supabase 风格
const typeConfig: Record<string, { icon: any; label: string; color: string }> = {
  text: { icon: FileText, label: "文字创作", color: "text-foreground-light" },
  image: { icon: Image, label: "图像处理", color: "text-foreground-light" },
  code: { icon: Code, label: "代码助手", color: "text-brand-500" },
  chat: { icon: MessageSquare, label: "智能对话", color: "text-foreground-light" },
};

// 状态配置 - Supabase 风格
const statusConfig: Record<TaskStatus, { icon: any; label: string; color: string; bgColor: string }> = {
  pending: { icon: Clock, label: "等待中", color: "text-foreground-muted", bgColor: "bg-surface-200" },
  running: { icon: Loader2, label: "生成中", color: "text-foreground-light", bgColor: "bg-surface-200" },
  completed: { icon: CheckCircle, label: "已完成", color: "text-brand-500", bgColor: "bg-brand-200" },
  failed: { icon: XCircle, label: "失败", color: "text-destructive", bgColor: "bg-destructive-200" },
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
          <h2 className="text-lg font-medium text-foreground mb-2">任务不存在</h2>
          <p className="text-foreground-muted mb-4">该任务可能已被删除</p>
          <Link href="/creative">
            <Button className="bg-brand-500 hover:bg-brand-600 text-background">
              返回创意助手
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
    // 模拟重试
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
              href="/creative"
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
          {/* 状态标签 */}
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
              重试
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
                {copied ? "已复制" : "复制"}
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                导出
              </Button>
            </>
          )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 进度条 (运行中时显示) */}
          {task.status === "running" && (
            <div className="p-4 rounded-md bg-surface-100 border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-foreground">生成进度</span>
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

          {/* 错误信息 */}
          {task.status === "failed" && task.error && (
            <div className="p-4 rounded-md bg-destructive-200 border border-border-muted">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-destructive mb-1">任务失败</h4>
                  <p className="text-sm text-destructive/80">{task.error}</p>
                </div>
              </div>
            </div>
          )}

          {/* 原始提示 */}
          <div className="p-5 rounded-md bg-surface-100 border border-border">
            <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-foreground-muted" />
              输入提示
            </h3>
            <p className="text-foreground-muted">{task.prompt}</p>
          </div>

          {/* 生成结果 */}
          {task.result && (
            <div className="p-5 rounded-md bg-surface-100 border border-border">
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-brand-500" />
                生成结果
              </h3>
              <div className="whitespace-pre-wrap text-foreground-muted leading-relaxed">
                {task.result}
              </div>
            </div>
          )}

          {/* 任务详情 */}
          <div className="p-5 rounded-md bg-surface-100 border border-border">
            <h3 className="text-sm font-medium text-foreground mb-4">任务详情</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-foreground-muted mb-1">任务 ID</div>
                <div className="text-sm text-foreground font-mono">{task.id}</div>
              </div>
              <div>
                <div className="text-xs text-foreground-muted mb-1">使用模型</div>
                <div className="text-sm text-foreground">{task.model}</div>
              </div>
              <div>
                <div className="text-xs text-foreground-muted mb-1">Token 消耗</div>
                <div className="text-sm text-foreground">{task.tokens.toLocaleString()}</div>
              </div>
              {task.duration && (
                <div>
                  <div className="text-xs text-foreground-muted mb-1">耗时</div>
                  <div className="text-sm text-foreground">{task.duration} 秒</div>
                </div>
              )}
            </div>
          </div>

          {/* 操作建议 */}
          {task.status === "completed" && (
            <div className="p-5 rounded-md bg-surface-75 border border-border">
              <h3 className="text-sm font-medium text-foreground mb-3">下一步</h3>
              <div className="grid sm:grid-cols-3 gap-3">
                <Link
                  href={`/creative/generate?template=${task.id}`}
                  className="flex items-center gap-3 p-3 rounded-md bg-surface-100 border border-border hover:border-brand-400 transition-supabase group"
                >
                  <RotateCcw className="w-5 h-5 text-foreground-muted group-hover:text-brand-500" />
                  <span className="text-sm text-foreground">重新生成</span>
                  <ChevronRight className="w-4 h-4 text-foreground-muted ml-auto" />
                </Link>
                <Link
                  href="/creative/generate"
                  className="flex items-center gap-3 p-3 rounded-md bg-surface-100 border border-border hover:border-brand-400 transition-supabase group"
                >
                  <Zap className="w-5 h-5 text-foreground-muted group-hover:text-brand-500" />
                  <span className="text-sm text-foreground">新建任务</span>
                  <ChevronRight className="w-4 h-4 text-foreground-muted ml-auto" />
                </Link>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-3 p-3 rounded-md bg-surface-100 border border-border hover:border-brand-400 transition-supabase group"
                >
                  <Copy className="w-5 h-5 text-foreground-muted group-hover:text-brand-500" />
                  <span className="text-sm text-foreground">复制结果</span>
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
