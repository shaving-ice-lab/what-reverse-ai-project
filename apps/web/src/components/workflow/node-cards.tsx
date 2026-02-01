"use client";

/**
 * 工作流节点卡片组件
 * 用于展示和选择工作流节点类型
 */

import { ReactNode } from "react";
import {
  Zap,
  Globe,
  Mail,
  Database,
  FileText,
  Code,
  Clock,
  GitBranch,
  Webhook,
  MessageSquare,
  Bot,
  Filter,
  Repeat,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Settings,
  Play,
  Pause,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// 节点类型定义
// ============================================

export interface NodeType {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  category: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

// 预定义节点类型
export const nodeTypes: NodeType[] = [
  // 触发器
  {
    id: "webhook",
    name: "Webhook 触发器",
    description: "通过 HTTP 请求触发工作流",
    icon: Webhook,
    category: "trigger",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
  },
  {
    id: "schedule",
    name: "定时触发器",
    description: "按计划定时执行工作流",
    icon: Clock,
    category: "trigger",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
  {
    id: "manual",
    name: "手动触发器",
    description: "手动点击执行工作流",
    icon: Play,
    category: "trigger",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
  },
  // AI 节点
  {
    id: "ai-chat",
    name: "AI 对话",
    description: "调用 AI 模型进行对话",
    icon: MessageSquare,
    category: "ai",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
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
  },
  // 集成节点
  {
    id: "http-request",
    name: "HTTP 请求",
    description: "发送 HTTP API 请求",
    icon: Globe,
    category: "integration",
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
  },
  {
    id: "email",
    name: "发送邮件",
    description: "发送电子邮件通知",
    icon: Mail,
    category: "integration",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
  },
  {
    id: "database",
    name: "数据库操作",
    description: "读写数据库数据",
    icon: Database,
    category: "integration",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
  },
  // 逻辑节点
  {
    id: "condition",
    name: "条件判断",
    description: "根据条件分支执行",
    icon: GitBranch,
    category: "logic",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
  },
  {
    id: "loop",
    name: "循环",
    description: "重复执行一组操作",
    icon: Repeat,
    category: "logic",
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/20",
  },
  {
    id: "filter",
    name: "过滤器",
    description: "过滤和筛选数据",
    icon: Filter,
    category: "logic",
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/20",
  },
  // 工具节点
  {
    id: "code",
    name: "代码执行",
    description: "执行自定义代码",
    icon: Code,
    category: "tools",
    color: "text-foreground-light",
    bgColor: "bg-muted/50",
    borderColor: "border-border",
  },
  {
    id: "transform",
    name: "数据转换",
    description: "转换和处理数据格式",
    icon: Settings,
    category: "tools",
    color: "text-foreground-light",
    bgColor: "bg-muted/50",
    borderColor: "border-border",
  },
  {
    id: "file",
    name: "文件操作",
    description: "读取和处理文件",
    icon: FileText,
    category: "tools",
    color: "text-teal-500",
    bgColor: "bg-teal-500/10",
    borderColor: "border-teal-500/20",
  },
];

// 节点分类
export const nodeCategories = [
  { id: "trigger", name: "触发器", icon: Zap },
  { id: "ai", name: "AI", icon: Bot },
  { id: "integration", name: "集成", icon: Globe },
  { id: "logic", name: "逻辑", icon: GitBranch },
  { id: "tools", name: "工具", icon: Code },
];

// ============================================
// 节点选择卡片
// ============================================

interface NodeSelectCardProps {
  node: NodeType;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function NodeSelectCard({
  node,
  selected,
  onClick,
  className,
}: NodeSelectCardProps) {
  const Icon = node.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 p-4 rounded-xl border text-left transition-all",
        "hover:shadow-md",
        selected
          ? cn("border-primary bg-primary/5", node.borderColor)
          : "border-border bg-card hover:border-primary/30",
        className
      )}
    >
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", node.bgColor)}>
        <Icon className={cn("w-5 h-5", node.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-foreground">{node.name}</h4>
        <p className="text-sm text-foreground-light mt-0.5 line-clamp-2">
          {node.description}
        </p>
      </div>
    </button>
  );
}

// ============================================
// 迷你节点卡片
// ============================================

interface MiniNodeCardProps {
  node: NodeType;
  status?: "idle" | "running" | "success" | "error";
  onClick?: () => void;
  className?: string;
}

export function MiniNodeCard({
  node,
  status = "idle",
  onClick,
  className,
}: MiniNodeCardProps) {
  const Icon = node.icon;

  const getStatusIndicator = () => {
    switch (status) {
      case "running":
        return <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />;
      case "success":
        return <CheckCircle className="w-3 h-3 text-emerald-500" />;
      case "error":
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer",
        "hover:shadow-sm hover:border-primary/30",
        status === "error" && "border-red-500/30 bg-red-500/5",
        status === "success" && "border-emerald-500/30 bg-emerald-500/5",
        className
      )}
    >
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", node.bgColor)}>
        <Icon className={cn("w-4 h-4", node.color)} />
      </div>
      <span className="flex-1 text-sm font-medium text-foreground truncate">
        {node.name}
      </span>
      {getStatusIndicator()}
    </div>
  );
}

// ============================================
// 节点连接器
// ============================================

interface NodeConnectorProps {
  direction?: "horizontal" | "vertical";
  animated?: boolean;
  className?: string;
}

export function NodeConnector({
  direction = "horizontal",
  animated = false,
  className,
}: NodeConnectorProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center",
        direction === "horizontal" ? "w-12 h-8" : "w-8 h-12",
        className
      )}
    >
      {direction === "horizontal" ? (
        <div className="flex items-center">
          <div className={cn(
            "w-8 h-0.5 bg-border",
            animated && "bg-gradient-to-r from-border via-primary to-border animate-pulse"
          )} />
          <ArrowRight className="w-4 h-4 text-foreground-light -ml-1" />
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className={cn(
            "w-0.5 h-8 bg-border",
            animated && "bg-gradient-to-b from-border via-primary to-border animate-pulse"
          )} />
        </div>
      )}
    </div>
  );
}

// ============================================
// 节点执行状态卡片
// ============================================

interface NodeExecutionCardProps {
  node: NodeType;
  status: "pending" | "running" | "success" | "error" | "skipped";
  duration?: number;
  error?: string;
  className?: string;
}

export function NodeExecutionCard({
  node,
  status,
  duration,
  error,
  className,
}: NodeExecutionCardProps) {
  const Icon = node.icon;

  const getStatusConfig = () => {
    switch (status) {
      case "pending":
        return { color: "text-foreground-light", bg: "bg-surface-200", label: "待执行" };
      case "running":
        return { color: "text-blue-500", bg: "bg-blue-500/10", label: "执行中" };
      case "success":
        return { color: "text-emerald-500", bg: "bg-emerald-500/10", label: "成功" };
      case "error":
        return { color: "text-red-500", bg: "bg-red-500/10", label: "失败" };
      case "skipped":
        return { color: "text-amber-500", bg: "bg-amber-500/10", label: "跳过" };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div
      className={cn(
        "p-4 rounded-xl border",
        status === "error" ? "border-red-500/30 bg-red-500/5" : "border-border bg-card",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", node.bgColor)}>
          <Icon className={cn("w-5 h-5", node.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-medium text-foreground">{node.name}</h4>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium",
              statusConfig.bg,
              statusConfig.color
            )}>
              {statusConfig.label}
            </span>
          </div>
          
          {duration !== undefined && status !== "pending" && status !== "running" && (
            <p className="text-xs text-foreground-light mt-1">
              耗时: {duration}ms
            </p>
          )}
          
          {error && (
            <p className="text-xs text-red-500 mt-2 p-2 rounded bg-red-500/10">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
