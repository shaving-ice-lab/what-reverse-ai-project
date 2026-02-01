"use client";

/**
 * 空状态组件
 * 用于展示列表为空、搜索无结果等场景
 */

import { ReactNode } from "react";
import Link from "next/link";
import {
  FolderOpen,
  Search,
  FileText,
  MessageSquare,
  Zap,
  Bot,
  Users,
  Inbox,
  AlertCircle,
  RefreshCw,
  Plus,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

// ============================================
// 主空状态组件
// ============================================

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
  children?: ReactNode;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  secondaryAction,
  className,
  children,
}: EmptyStateProps) {
  const ActionIcon = action?.icon || Plus;

  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4", className)}>
      <div className="w-12 h-12 rounded-lg bg-surface-200 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-foreground-muted" />
      </div>
      
      <h3 className="text-base font-medium text-foreground mb-2 text-center">
        {title}
      </h3>
      
      {description && (
        <p className="text-[13px] text-foreground-light text-center max-w-sm mb-6">
          {description}
        </p>
      )}
      
      {children}
      
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3 mt-2">
          {secondaryAction && (
            secondaryAction.href ? (
              <Link href={secondaryAction.href}>
                <Button variant="outline" size="sm">
                  {secondaryAction.label}
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            )
          )}
          
          {action && (
            action.href ? (
              <Link href={action.href}>
                <Button size="sm">
                  <ActionIcon className="w-4 h-4 mr-2" />
                  {action.label}
                </Button>
              </Link>
            ) : (
              <Button size="sm" onClick={action.onClick}>
                <ActionIcon className="w-4 h-4 mr-2" />
                {action.label}
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// 预设空状态变体
// ============================================

// 搜索无结果
interface SearchEmptyStateProps {
  query?: string;
  onClear?: () => void;
  className?: string;
}

export function SearchEmptyState({ query, onClear, className }: SearchEmptyStateProps) {
  return (
    <EmptyState
      icon={Search}
      title={query ? `没有找到 "${query}" 的相关结果` : "没有找到结果"}
      description="尝试使用其他关键词或调整筛选条件"
      secondaryAction={
        onClear
          ? {
              label: "清除搜索",
              onClick: onClear,
            }
          : undefined
      }
      className={className}
    />
  );
}

// 空文件夹
interface FolderEmptyStateProps {
  onUpload?: () => void;
  className?: string;
}

export function FolderEmptyState({ onUpload, className }: FolderEmptyStateProps) {
  return (
    <EmptyState
      icon={FolderOpen}
      title="文件夹为空"
      description="上传文件或创建新文件夹开始整理您的内容"
      action={
        onUpload
          ? {
              label: "上传文件",
              onClick: onUpload,
            }
          : undefined
      }
      className={className}
    />
  );
}

// 无工作流
interface WorkflowEmptyStateProps {
  className?: string;
}

export function WorkflowEmptyState({ className }: WorkflowEmptyStateProps) {
  return (
    <EmptyState
      icon={Zap}
      title="还没有工作流"
      description="创建您的第一个工作流，开始自动化之旅"
      action={{
        label: "创建工作流",
        href: "/workflows/new",
      }}
      className={className}
    />
  );
}

// 无对话
interface ConversationEmptyStateProps {
  className?: string;
}

export function ConversationEmptyState({ className }: ConversationEmptyStateProps) {
  return (
    <EmptyState
      icon={MessageSquare}
      title="开始新对话"
      description="与 AI 助手交流，获取帮助和灵感"
      action={{
        label: "新建对话",
        href: "/",
        icon: MessageSquare,
      }}
      className={className}
    />
  );
}

// 无 Agent
interface AgentEmptyStateProps {
  className?: string;
}

export function AgentEmptyState({ className }: AgentEmptyStateProps) {
  return (
    <EmptyState
      icon={Bot}
      title="还没有 Agent"
      description="创建您的第一个 AI Agent，让它帮您处理任务"
      action={{
        label: "创建 Agent",
        href: "/my-agents/new",
      }}
      className={className}
    />
  );
}

// 无团队成员
interface TeamEmptyStateProps {
  onInvite?: () => void;
  className?: string;
}

export function TeamEmptyState({ onInvite, className }: TeamEmptyStateProps) {
  return (
    <EmptyState
      icon={Users}
      title="邀请团队成员"
      description="与团队一起协作，提高工作效率"
      action={
        onInvite
          ? {
              label: "邀请成员",
              onClick: onInvite,
            }
          : undefined
      }
      className={className}
    />
  );
}

// 加载错误
interface ErrorEmptyStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorEmptyState({
  title = "加载失败",
  description = "发生了一些错误，请重试",
  onRetry,
  className,
}: ErrorEmptyStateProps) {
  return (
    <EmptyState
      icon={AlertCircle}
      title={title}
      description={description}
      action={
        onRetry
          ? {
              label: "重试",
              onClick: onRetry,
              icon: RefreshCw,
            }
          : undefined
      }
      className={className}
    />
  );
}

// 无文档
interface DocumentEmptyStateProps {
  onCreate?: () => void;
  className?: string;
}

export function DocumentEmptyState({ onCreate, className }: DocumentEmptyStateProps) {
  return (
    <EmptyState
      icon={FileText}
      title="还没有文档"
      description="创建您的第一个文档，开始内容创作"
      action={
        onCreate
          ? {
              label: "新建文档",
              onClick: onCreate,
            }
          : {
              label: "新建文档",
              href: "/creative/generate",
            }
      }
      className={className}
    />
  );
}
