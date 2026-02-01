"use client";

/**
 * 对话历史/消息中心页面 - Supabase 风格重构
 * 移除内部 sidebar，采用顶部筛选和标签页设计
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageContainer, PageHeader } from "@/components/dashboard/page-layout";
import {
  MessageSquare,
  Search,
  Plus,
  Star,
  Archive,
  Trash2,
  MoreHorizontal,
  Pin,
  Clock,
  FolderOpen,
  Download,
  Share2,
  Edit3,
  Copy,
  Check,
  Loader2,
  Brain,
  Sparkles,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Settings,
  LayoutGrid,
  LayoutList,
  Calendar,
  Filter,
  SortAsc,
  SortDesc,
  ChevronDown,
  Zap,
  Hash,
  Folder,
  FolderPlus,
  MessageCircle,
  Bot,
  ArrowUpRight,
  Layers,
  X,
  Upload,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { HighlightText } from "@/components/ui/highlight-text";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { conversationApi, conversationFolderApi } from "@/lib/api";
import {
  ConversationFolderManageDialog,
  MoveToFolderDialog,
  ImportDialog,
} from "@/components/conversation";
import type {
  Conversation,
  ConversationFolder,
  ListConversationsParams,
} from "@/types/conversation";
import { formatRelativeTime } from "@/types/conversation";
import { toast } from "sonner";

// 筛选选项
const filterTabs = [
  { id: "all", label: "全部", icon: Layers },
  { id: "starred", label: "收藏", icon: Star },
  { id: "pinned", label: "置顶", icon: Pin },
  { id: "archived", label: "归档", icon: Archive },
];

// 排序选项
const sortOptions = [
  { id: "updated", label: "最近更新", desc: true },
  { id: "created", label: "创建时间", desc: true },
  { id: "title", label: "标题", desc: false },
  { id: "messages", label: "消息数", desc: true },
];

// 视图类型
type ViewType = "list" | "grid" | "timeline";

// 模型图标映射
const MODEL_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  "gpt-4": Brain,
  "gpt-4-turbo": Brain,
  "gpt-3.5-turbo": Brain,
  "claude-3-opus": Sparkles,
  "claude-3-sonnet": Sparkles,
  "claude-3-haiku": Sparkles,
};

// 模型颜色映射 - Supabase 风格
const MODEL_COLOR_MAP: Record<string, string> = {
  "gpt-4": "bg-brand-500",
  "gpt-4-turbo": "bg-brand-600",
  "gpt-3.5-turbo": "bg-surface-300",
  "claude-3-opus": "bg-surface-300",
  "claude-3-sonnet": "bg-surface-300",
  "claude-3-haiku": "bg-surface-300",
};

// 骨架屏组件
function ConversationSkeleton({ view }: { view: ViewType }) {
  if (view === "grid") {
    return (
      <div className="p-4 rounded-lg border border-border bg-surface-100 animate-pulse">
        <div className="flex items-start gap-3 mb-3">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <Skeleton className="h-12 w-full mb-3" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16 rounded-md" />
          <Skeleton className="h-5 w-20 rounded-md" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4 rounded-lg border border-border bg-surface-100 animate-pulse">
      <div className="flex items-start gap-4">
        <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-5 w-16 rounded-md" />
          </div>
          <Skeleton className="h-3 w-full mb-2" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

// 对话预览卡片
function ConversationPreview({ conversation }: { conversation: Conversation }) {
  return (
    <div className="w-80 p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center border border-border",
          MODEL_COLOR_MAP[conversation.model] || "bg-surface-200"
        )}>
          <Bot className="w-5 h-5 text-background" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground truncate">{conversation.title}</h4>
          <p className="text-xs text-foreground-light font-mono">
            {conversation.model} · {formatRelativeTime(conversation.updatedAt)}
          </p>
        </div>
      </div>
      
      <div className="space-y-2 mb-3">
        <p className="text-sm text-foreground-light line-clamp-3">
          {conversation.preview || "暂无消息预览"}
        </p>
      </div>
      
      <div className="flex items-center justify-between text-xs text-foreground-muted border-t border-border pt-3">
        <span className="flex items-center gap-1">
          <MessageCircle className="w-3 h-3" />
          {conversation.messageCount} 条消息
        </span>
        <span className="flex items-center gap-1">
          <Zap className="w-3 h-3" />
          {conversation.tokenUsage || 0} tokens
        </span>
      </div>
    </div>
  );
}

// 对话卡片组件
interface ConversationCardProps {
  conversation: Conversation;
  viewType: ViewType;
  isSelected: boolean;
  isSelectionMode: boolean;
  isOperating: boolean;
  searchQuery: string;
  onSelect: (id: string) => void;
  onToggleStar: (id: string, starred: boolean) => void;
  onTogglePin: (id: string, pinned: boolean) => void;
  onRename: (conversation: Conversation) => void;
  onDuplicate: (id: string) => void;
  onMoveToFolder: (id: string, folderId?: string) => void;
  onShare: (id: string) => void;
  onExport: (id: string, format: "json" | "markdown") => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (id: string) => void;
}

function ConversationCard({
  conversation,
  viewType,
  isSelected,
  isSelectionMode,
  isOperating,
  searchQuery,
  onSelect,
  onToggleStar,
  onTogglePin,
  onRename,
  onDuplicate,
  onMoveToFolder,
  onShare,
  onExport,
  onArchive,
  onDelete,
  onClick,
}: ConversationCardProps) {
  const ModelIcon = MODEL_ICON_MAP[conversation.model] || Brain;
  const modelColor = MODEL_COLOR_MAP[conversation.model] || "bg-surface-200";

  // 网格视图
  if (viewType === "grid") {
    return (
      <HoverCard>
        <HoverCardTrigger asChild>
          <div
            className={cn(
              "group relative p-4 rounded-lg cursor-pointer transition-all duration-200",
              "bg-surface-100 border hover:bg-surface-75",
              isSelected
                ? "border-brand-500 ring-1 ring-brand-500/20"
                : "border-border hover:border-border-strong",
              isOperating && "opacity-60 pointer-events-none"
            )}
            onClick={() => isSelectionMode ? onSelect(conversation.id) : onClick(conversation.id)}
          >
            {/* 选择复选框 */}
            {isSelectionMode && (
              <div 
                className="absolute top-3 left-3 z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onSelect(conversation.id)}
                />
              </div>
            )}

            {/* 状态指示器 */}
            <div className="absolute top-3 right-3 flex items-center gap-1">
              {conversation.pinned && (
                <div className="p-1.5 rounded-md bg-brand-500/15 border border-brand-500/30">
                  <Pin className="w-3 h-3 text-brand-500 fill-brand-500" />
                </div>
              )}
              {conversation.starred && (
                <div className="p-1.5 rounded-md bg-warning-200/40 border border-warning/30">
                  <Star className="w-3 h-3 text-warning fill-warning" />
                </div>
              )}
            </div>

            {/* 模型图标 */}
            <div className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center mb-3 border border-border",
              modelColor
            )}>
              <ModelIcon className="w-6 h-6 text-background" />
            </div>

            {/* 标题 */}
            <h3 className="text-[14px] font-semibold text-foreground truncate mb-1 pr-8">
              <HighlightText text={conversation.title} search={searchQuery} />
            </h3>

            {/* 预览 */}
            <p className="text-[13px] text-foreground-light line-clamp-2 mb-3 min-h-[36px]">
              {conversation.preview ? (
                <HighlightText text={conversation.preview} search={searchQuery} />
              ) : (
                "暂无消息预览"
              )}
            </p>

            {/* 元信息 */}
            <div className="flex items-center justify-between text-xs text-foreground-muted">
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                {conversation.messageCount}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatRelativeTime(conversation.updatedAt)}
              </span>
            </div>

            {/* 模型标签 */}
            <div className="mt-3 pt-3 border-t border-border">
              <Badge variant="secondary" className="text-[11px] bg-surface-200 text-foreground-light border border-border">
                {conversation.model}
              </Badge>
            </div>

            {/* 悬停操作按钮 */}
            {!isSelectionMode && (
              <div 
                className="absolute bottom-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className="p-2 rounded-md bg-surface-100 border border-border hover:bg-surface-200 text-foreground-muted hover:text-foreground transition-colors"
                        onClick={() => onToggleStar(conversation.id, conversation.starred)}
                      >
                        <Star className={cn("w-3.5 h-3.5", conversation.starred && "text-warning fill-warning")} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{conversation.starred ? "取消收藏" : "收藏"}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2 rounded-md bg-surface-100 border border-border hover:bg-surface-200 text-foreground-muted hover:text-foreground transition-colors">
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-surface-100 border border-border rounded-lg">
                    <DropdownMenuItem onClick={() => onRename(conversation)} className="text-foreground-light hover:text-foreground hover:bg-surface-200">
                      <Edit3 className="w-4 h-4 mr-2" />
                      重命名
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDuplicate(conversation.id)} className="text-foreground-light hover:text-foreground hover:bg-surface-200">
                      <Copy className="w-4 h-4 mr-2" />
                      复制
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onMoveToFolder(conversation.id, conversation.folderId)} className="text-foreground-light hover:text-foreground hover:bg-surface-200">
                      <FolderOpen className="w-4 h-4 mr-2" />
                      移动到文件夹
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem onClick={() => onExport(conversation.id, "json")} className="text-foreground-light hover:text-foreground hover:bg-surface-200">
                      <Download className="w-4 h-4 mr-2" />
                      导出 JSON
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem onClick={() => onArchive(conversation.id)} className="text-foreground-light hover:text-foreground hover:bg-surface-200">
                      <Archive className="w-4 h-4 mr-2" />
                      归档
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive hover:bg-destructive-200" onClick={() => onDelete(conversation.id)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      删除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </HoverCardTrigger>
        <HoverCardContent side="right" className="w-80 p-0 bg-surface-100 border border-border rounded-lg">
          <ConversationPreview conversation={conversation} />
        </HoverCardContent>
      </HoverCard>
    );
  }

  // 列表视图
  return (
    <HoverCard openDelay={500}>
      <HoverCardTrigger asChild>
        <div
          className={cn(
            "group relative p-4 rounded-lg cursor-pointer transition-all duration-200",
            "bg-surface-100 border hover:bg-surface-75",
            isSelected
              ? "border-brand-500 ring-1 ring-brand-500/20"
              : "border-border hover:border-border-strong",
            isOperating && "opacity-60 pointer-events-none"
          )}
          onClick={() => isSelectionMode ? onSelect(conversation.id) : onClick(conversation.id)}
        >
          <div className="flex items-start gap-4">
            {/* 选择框 */}
            {isSelectionMode && (
              <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onSelect(conversation.id)}
                />
              </div>
            )}

            {/* AI 头像 */}
            <div className={cn(
              "w-11 h-11 rounded-lg flex items-center justify-center shrink-0 border border-border",
              modelColor
            )}>
              <ModelIcon className="w-5 h-5 text-background" />
            </div>

            {/* 内容 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                {conversation.pinned && (
                  <div className="p-1 rounded-sm bg-brand-500/15 border border-brand-500/30">
                    <Pin className="w-3 h-3 text-brand-500 fill-brand-500" />
                  </div>
                )}
                {conversation.starred && (
                  <div className="p-1 rounded-sm bg-warning-200/40 border border-warning/30">
                    <Star className="w-3 h-3 text-warning fill-warning" />
                  </div>
                )}
                <span className="font-medium text-foreground truncate">
                  <HighlightText text={conversation.title} search={searchQuery} />
                </span>
                <Badge variant="secondary" className="text-[11px] shrink-0 bg-surface-200 text-foreground-light border border-border">
                  {conversation.model}
                </Badge>
              </div>

              <p className="text-[13px] text-foreground-light line-clamp-1 mb-2">
                {conversation.preview ? (
                  <HighlightText text={conversation.preview} search={searchQuery} />
                ) : (
                  <span className="italic">暂无消息预览</span>
                )}
              </p>

              <div className="flex items-center gap-4 text-xs text-foreground-muted">
                <span className="flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5" />
                  {conversation.messageCount} 条消息
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {formatRelativeTime(conversation.updatedAt)}
                </span>
                {conversation.tokenUsage && (
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    {conversation.tokenUsage} tokens
                  </span>
                )}
              </div>

              {/* 标签 */}
              {conversation.tags && conversation.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {conversation.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md bg-surface-200 border border-border text-[11px] text-foreground-muted font-mono"
                    >
                      #{tag}
                    </span>
                  ))}
                  {conversation.tags.length > 3 && (
                    <span className="text-xs text-foreground-muted">
                      +{conversation.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* 操作按钮 */}
            {!isSelectionMode && (
              <div
                className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className="p-2 rounded-md hover:bg-surface-200 text-foreground-muted hover:text-foreground transition-colors"
                        onClick={() => onToggleStar(conversation.id, conversation.starred)}
                      >
                        <Star className={cn("w-4 h-4", conversation.starred && "text-warning fill-warning")} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{conversation.starred ? "取消收藏" : "收藏"}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className="p-2 rounded-md hover:bg-surface-200 text-foreground-muted hover:text-foreground transition-colors"
                        onClick={() => onTogglePin(conversation.id, conversation.pinned)}
                      >
                        <Pin className={cn("w-4 h-4", conversation.pinned && "text-brand-500 fill-brand-500")} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{conversation.pinned ? "取消置顶" : "置顶"}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2 rounded-md hover:bg-surface-200 text-foreground-muted hover:text-foreground transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-surface-100 border border-border rounded-lg">
                    <DropdownMenuItem onClick={() => onRename(conversation)} className="text-foreground-light hover:text-foreground hover:bg-surface-200">
                      <Edit3 className="w-4 h-4 mr-2" />
                      重命名
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDuplicate(conversation.id)} className="text-foreground-light hover:text-foreground hover:bg-surface-200">
                      <Copy className="w-4 h-4 mr-2" />
                      复制
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onMoveToFolder(conversation.id, conversation.folderId)} className="text-foreground-light hover:text-foreground hover:bg-surface-200">
                      <FolderOpen className="w-4 h-4 mr-2" />
                      移动到文件夹
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onShare(conversation.id)} className="text-foreground-light hover:text-foreground hover:bg-surface-200">
                      <Share2 className="w-4 h-4 mr-2" />
                      分享
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem onClick={() => onExport(conversation.id, "json")} className="text-foreground-light hover:text-foreground hover:bg-surface-200">
                      <Download className="w-4 h-4 mr-2" />
                      导出 JSON
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onExport(conversation.id, "markdown")} className="text-foreground-light hover:text-foreground hover:bg-surface-200">
                      <Download className="w-4 h-4 mr-2" />
                      导出 Markdown
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem onClick={() => onArchive(conversation.id)} className="text-foreground-light hover:text-foreground hover:bg-surface-200">
                      <Archive className="w-4 h-4 mr-2" />
                      归档
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive hover:bg-destructive-200" onClick={() => onDelete(conversation.id)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      删除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* 快速进入箭头 */}
            {!isSelectionMode && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight className="w-4 h-4 text-foreground-muted group-hover:text-brand-500 transition-colors" />
              </div>
            )}
          </div>
        </div>
      </HoverCardTrigger>
      <HoverCardContent side="right" className="w-80 p-0 bg-surface-100 border border-border rounded-lg">
        <ConversationPreview conversation={conversation} />
      </HoverCardContent>
    </HoverCard>
  );
}

export default function ConversationsPage() {
  const router = useRouter();
  
  // 状态
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [folders, setFolders] = useState<ConversationFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [selectedConversations, setSelectedConversations] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [operationLoading, setOperationLoading] = useState<string | null>(null);
  
  // 视图和排序
  const [viewType, setViewType] = useState<ViewType>("list");
  const [sortBy, setSortBy] = useState("updated");
  const [sortDesc, setSortDesc] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // 对话框状态
  const [folderManageOpen, setFolderManageOpen] = useState(false);
  const [moveToFolderOpen, setMoveToFolderOpen] = useState(false);
  const [moveTargetIds, setMoveTargetIds] = useState<string[]>([]);
  const [moveCurrentFolderId, setMoveCurrentFolderId] = useState<string | undefined>();
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  
  // 重命名对话框状态
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ id: string; title: string } | null>(null);
  const [renameValue, setRenameValue] = useState("");
  
  // 计算总页数
  const totalPages = Math.ceil(total / pageSize);
  
  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        handleCreateConversation();
      }
      if (e.key === "Escape" && isSelectionMode) {
        setIsSelectionMode(false);
        setSelectedConversations(new Set());
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSelectionMode]);

  // 获取文件夹列表
  const fetchFolders = useCallback(async () => {
    try {
      const response = await conversationFolderApi.list();
      setFolders(response.folders || []);
    } catch (err) {
      console.error("Failed to fetch folders:", err);
    }
  }, []);

  // 获取对话列表
  const fetchConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params: ListConversationsParams = {
        page,
        pageSize: 20,
        search: searchQuery || undefined,
        folderId: selectedFolder || undefined,
      };

      if (filter === "starred") {
        params.starred = true;
      } else if (filter === "pinned") {
        params.pinned = true;
      } else if (filter === "archived") {
        params.archived = true;
      } else {
        params.archived = false;
      }

      const response = await conversationApi.list(params);
      setConversations(response.conversations || []);
      setTotal(response.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取对话列表失败");
      console.error("Failed to fetch conversations:", err);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, selectedFolder, filter]);

  // 初始化
  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // 搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 切换收藏
  const handleToggleStar = async (id: string, currentStarred: boolean) => {
    setOperationLoading(id);
    try {
      await conversationApi.setStarred(id, !currentStarred);
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, starred: !currentStarred } : c))
      );
    } catch (err) {
      console.error("Failed to toggle star:", err);
    } finally {
      setOperationLoading(null);
    }
  };

  // 切换置顶
  const handleTogglePin = async (id: string, currentPinned: boolean) => {
    setOperationLoading(id);
    try {
      await conversationApi.setPinned(id, !currentPinned);
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, pinned: !currentPinned } : c))
      );
    } catch (err) {
      console.error("Failed to toggle pin:", err);
    } finally {
      setOperationLoading(null);
    }
  };

  // 归档对话
  const handleArchive = async (id: string) => {
    setOperationLoading(id);
    try {
      await conversationApi.setArchived(id, true);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      toast.success("对话已归档");
    } catch (err) {
      console.error("Failed to archive:", err);
      toast.error("归档失败");
    } finally {
      setOperationLoading(null);
    }
  };

  // 删除对话
  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个对话吗？此操作不可恢复。")) return;
    
    setOperationLoading(id);
    try {
      await conversationApi.delete(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      toast.success("对话已删除");
    } catch (err) {
      console.error("Failed to delete:", err);
      toast.error("删除失败");
    } finally {
      setOperationLoading(null);
    }
  };

  // 复制对话
  const handleDuplicate = async (id: string) => {
    setOperationLoading(id);
    try {
      const newConversation = await conversationApi.duplicate(id);
      setConversations((prev) => [newConversation, ...prev]);
      toast.success("对话已复制");
    } catch (err) {
      console.error("Failed to duplicate:", err);
      toast.error("复制失败");
    } finally {
      setOperationLoading(null);
    }
  };

  // 重命名对话
  const openRenameDialog = (conversation: Conversation) => {
    setRenameTarget({ id: conversation.id, title: conversation.title });
    setRenameValue(conversation.title);
    setRenameDialogOpen(true);
  };

  const handleRename = async () => {
    if (!renameTarget || !renameValue.trim()) return;
    
    setOperationLoading(renameTarget.id);
    try {
      await conversationApi.update(renameTarget.id, { title: renameValue.trim() });
      setConversations((prev) =>
        prev.map((c) =>
          c.id === renameTarget.id ? { ...c, title: renameValue.trim() } : c
        )
      );
      setRenameDialogOpen(false);
      setRenameTarget(null);
      toast.success("重命名成功");
    } catch (err) {
      console.error("Failed to rename:", err);
      toast.error("重命名失败");
    } finally {
      setOperationLoading(null);
    }
  };

  // 打开移动到文件夹对话框
  const openMoveToFolder = (conversationId: string, currentFolderId?: string) => {
    setMoveTargetIds([conversationId]);
    setMoveCurrentFolderId(currentFolderId);
    setMoveToFolderOpen(true);
  };

  // 批量移动到文件夹
  const openBatchMoveToFolder = () => {
    if (selectedConversations.size === 0) return;
    setMoveTargetIds(Array.from(selectedConversations));
    setMoveCurrentFolderId(undefined);
    setMoveToFolderOpen(true);
  };

  // 导出对话
  const handleExport = async (id: string, format: "json" | "markdown" = "json") => {
    const conversation = conversations.find((c) => c.id === id);
    if (!conversation) return;
    
    try {
      const blob = await conversationApi.export(id, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `conversation-${conversation.title.slice(0, 30)}.${format === "markdown" ? "md" : "json"}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("导出成功");
    } catch (err) {
      console.error("Failed to export:", err);
      toast.error("导出失败");
    }
  };

  // 分享对话
  const handleShare = async (id: string) => {
    try {
      const result = await conversationApi.share(id, { isPublic: true });
      await navigator.clipboard.writeText(result.shareUrl);
      toast.success("分享链接已复制到剪贴板");
    } catch (err) {
      console.error("Failed to share:", err);
      toast.error("创建分享链接失败");
    }
  };

  // 批量收藏
  const handleBatchStar = async (starred: boolean) => {
    if (selectedConversations.size === 0) return;
    
    try {
      await conversationApi.batchStar({
        ids: Array.from(selectedConversations),
        starred,
      });
      setConversations((prev) =>
        prev.map((c) =>
          selectedConversations.has(c.id) ? { ...c, starred } : c
        )
      );
      setSelectedConversations(new Set());
      setIsSelectionMode(false);
      toast.success(starred ? "已收藏选中对话" : "已取消收藏");
    } catch (err) {
      console.error("Failed to batch star:", err);
      toast.error("操作失败");
    }
  };

  // 批量归档
  const handleBatchArchive = async () => {
    if (selectedConversations.size === 0) return;
    
    try {
      await conversationApi.batchArchive({
        ids: Array.from(selectedConversations),
        archived: true,
      });
      setConversations((prev) =>
        prev.filter((c) => !selectedConversations.has(c.id))
      );
      setSelectedConversations(new Set());
      setIsSelectionMode(false);
      toast.success("已归档选中对话");
    } catch (err) {
      console.error("Failed to batch archive:", err);
      toast.error("归档失败");
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedConversations.size === 0) return;
    if (!confirm(`确定要删除选中的 ${selectedConversations.size} 个对话吗？此操作不可恢复。`)) return;
    
    try {
      await conversationApi.batchDelete({
        ids: Array.from(selectedConversations),
      });
      setConversations((prev) =>
        prev.filter((c) => !selectedConversations.has(c.id))
      );
      setSelectedConversations(new Set());
      setIsSelectionMode(false);
      toast.success("已删除选中对话");
    } catch (err) {
      console.error("Failed to batch delete:", err);
      toast.error("删除失败");
    }
  };

  // 切换选择
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedConversations);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedConversations(newSelected);
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedConversations.size === conversations.length) {
      setSelectedConversations(new Set());
    } else {
      setSelectedConversations(new Set(conversations.map((c) => c.id)));
    }
  };

  // 创建新对话
  const handleCreateConversation = async () => {
    try {
      const newConversation = await conversationApi.create({
        title: "新对话",
        model: "gpt-4",
      });
      router.push(`/chat/${newConversation.id}`);
    } catch (err) {
      console.error("Failed to create conversation:", err);
      toast.error("创建对话失败");
    }
  };

  // 排序对话列表
  const sortedConversations = useMemo(() => {
    const sorted = [...conversations].sort((a, b) => {
      // 置顶对话始终排在最前面
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      
      let comparison = 0;
      switch (sortBy) {
        case "updated":
          comparison = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          break;
        case "created":
          comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "messages":
          comparison = (b.messageCount || 0) - (a.messageCount || 0);
          break;
        default:
          comparison = 0;
      }
      
      return sortDesc ? comparison : -comparison;
    });
    
    return sorted;
  }, [conversations, sortBy, sortDesc]);
  
  // 按日期分组（用于时间线视图）
  const groupedByDate = useMemo(() => {
    const groups: Record<string, Conversation[]> = {};
    
    sortedConversations.forEach((conv) => {
      const date = new Date(conv.updatedAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let key: string;
      if (date.toDateString() === today.toDateString()) {
        key = "今天";
      } else if (date.toDateString() === yesterday.toDateString()) {
        key = "昨天";
      } else if (date.getTime() > today.getTime() - 7 * 24 * 60 * 60 * 1000) {
        key = "最近7天";
      } else if (date.getTime() > today.getTime() - 30 * 24 * 60 * 60 * 1000) {
        key = "最近30天";
      } else {
        key = date.toLocaleDateString("zh-CN", { year: "numeric", month: "long" });
      }
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(conv);
    });
    
    return groups;
  }, [sortedConversations]);

  // 获取当前文件夹名称
  const currentFolderName = selectedFolder
    ? folders.find((f) => f.id === selectedFolder)?.name
    : null;

  return (
    <PageContainer fullWidth>
      <div className="flex flex-col h-full">
        {/* 页面头部 */}
        <header className="shrink-0 border-b border-border bg-background-studio/95 backdrop-blur sticky top-0 z-20">
          <div className="px-6 py-4">
            {/* 标题行 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-brand-500" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-foreground">对话中心</h1>
                  <p className="text-sm text-foreground-light">
                    {searchQuery
                      ? `搜索 "${searchQuery}" · 找到 ${total} 个对话`
                      : `共 ${total} 个对话`}
                    {currentFolderName && ` · ${currentFolderName}`}
                  </p>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center gap-2">
                <Button
                  className="bg-brand-500 hover:bg-brand-600 text-background h-9"
                  onClick={handleCreateConversation}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  新建对话
                </Button>
                <Button
                  variant="outline"
                  className="h-9 border-border text-foreground-light hover:text-foreground"
                  onClick={() => setImportDialogOpen(true)}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  导入
                </Button>
              </div>
            </div>

            {/* 搜索和筛选栏 */}
            <div className="flex flex-wrap items-center gap-3">
              {/* 搜索框 */}
              <div className="relative flex-1 min-w-[240px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="搜索对话... (⌘K)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-8 h-9 bg-surface-100 border-border focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* 文件夹筛选 */}
              <Select
                value={selectedFolder || "all"}
                onValueChange={(value) => {
                  setSelectedFolder(value === "all" ? null : value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[160px] h-9 bg-surface-100 border-border">
                  <Folder className="w-4 h-4 mr-2 text-foreground-muted" />
                  <SelectValue placeholder="全部文件夹" />
                </SelectTrigger>
                <SelectContent className="bg-surface-100 border-border">
                  <SelectItem value="all">全部文件夹</SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.icon || "📁"} {folder.name} ({folder.conversationCount})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 状态筛选标签 */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-surface-100 border border-border">
                {filterTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setFilter(tab.id);
                        setPage(1);
                      }}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors",
                        filter === tab.id
                          ? "bg-surface-200 text-foreground"
                          : "text-foreground-muted hover:text-foreground hover:bg-surface-75"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* 分隔线 */}
              <div className="w-px h-6 bg-border" />

              {/* 视图切换 */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-surface-100 border border-border">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setViewType("list")}
                        className={cn(
                          "p-1.5 rounded-md transition-colors",
                          viewType === "list"
                            ? "bg-surface-200 text-foreground"
                            : "text-foreground-muted hover:text-foreground"
                        )}
                      >
                        <LayoutList className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>列表视图</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setViewType("grid")}
                        className={cn(
                          "p-1.5 rounded-md transition-colors",
                          viewType === "grid"
                            ? "bg-surface-200 text-foreground"
                            : "text-foreground-muted hover:text-foreground"
                        )}
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>网格视图</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setViewType("timeline")}
                        className={cn(
                          "p-1.5 rounded-md transition-colors",
                          viewType === "timeline"
                            ? "bg-surface-200 text-foreground"
                            : "text-foreground-muted hover:text-foreground"
                        )}
                      >
                        <Calendar className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>时间线视图</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* 排序下拉 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-2 border-border text-foreground-light">
                    {sortDesc ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
                    {sortOptions.find((s) => s.id === sortBy)?.label}
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-surface-100 border-border">
                  <DropdownMenuLabel className="text-foreground-muted">排序方式</DropdownMenuLabel>
                  {sortOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.id}
                      onClick={() => {
                        if (sortBy === option.id) {
                          setSortDesc(!sortDesc);
                        } else {
                          setSortBy(option.id);
                          setSortDesc(option.desc);
                        }
                      }}
                      className="text-foreground-light hover:text-foreground hover:bg-surface-200"
                    >
                      <span className="flex-1">{option.label}</span>
                      {sortBy === option.id && (
                        sortDesc ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* 更多操作 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9 border-border text-foreground-light">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-surface-100 border-border">
                  <DropdownMenuItem
                    onClick={() => setIsSelectionMode(true)}
                    className="text-foreground-light hover:text-foreground hover:bg-surface-200"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    批量选择
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => fetchConversations()}
                    className="text-foreground-light hover:text-foreground hover:bg-surface-200"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    刷新列表
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem
                    onClick={() => setFolderManageOpen(true)}
                    className="text-foreground-light hover:text-foreground hover:bg-surface-200"
                  >
                    <FolderPlus className="w-4 h-4 mr-2" />
                    管理文件夹
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* 批量选择工具栏 */}
            {isSelectionMode && (
              <div className="flex items-center gap-3 mt-4 p-3 rounded-lg bg-surface-100 border border-border">
                <Checkbox
                  checked={selectedConversations.size === conversations.length && conversations.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-sm text-foreground">
                  已选择 <span className="font-semibold text-brand-500">{selectedConversations.size}</span> 项
                </span>
                <div className="flex-1" />
                <div className="flex items-center gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-warning hover:text-warning hover:bg-warning-200/60"
                          onClick={() => handleBatchStar(true)}
                          disabled={selectedConversations.size === 0}
                        >
                          <Star className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>收藏选中</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-foreground-light hover:text-foreground"
                          onClick={openBatchMoveToFolder}
                          disabled={selectedConversations.size === 0}
                        >
                          <FolderOpen className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>移动到文件夹</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-foreground-light hover:text-foreground"
                          onClick={handleBatchArchive}
                          disabled={selectedConversations.size === 0}
                        >
                          <Archive className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>归档选中</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive-200/60"
                          onClick={handleBatchDelete}
                          disabled={selectedConversations.size === 0}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>删除选中</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border text-foreground-light"
                  onClick={() => {
                    setIsSelectionMode(false);
                    setSelectedConversations(new Set());
                  }}
                >
                  取消
                </Button>
              </div>
            )}

            {/* 当前筛选条件显示 */}
            {(selectedFolder || searchQuery) && (
              <div className="flex items-center gap-2 mt-3">
                {selectedFolder && (
                  <Badge
                    variant="secondary"
                    className="gap-1.5 bg-surface-200 text-foreground-light border border-border cursor-pointer hover:bg-surface-300"
                    onClick={() => setSelectedFolder(null)}
                  >
                    <Folder className="w-3 h-3" />
                    {currentFolderName}
                    <X className="w-3 h-3" />
                  </Badge>
                )}
                {searchQuery && (
                  <Badge
                    variant="secondary"
                    className="gap-1.5 bg-surface-200 text-foreground-light border border-border cursor-pointer hover:bg-surface-300"
                    onClick={() => setSearchQuery("")}
                  >
                    <Search className="w-3 h-3" />
                    "{searchQuery}"
                    <X className="w-3 h-3" />
                  </Badge>
                )}
                <button
                  onClick={() => {
                    setSelectedFolder(null);
                    setSearchQuery("");
                    setFilter("all");
                  }}
                  className="text-xs text-foreground-muted hover:text-foreground"
                >
                  清除全部
                </button>
              </div>
            )}
          </div>
        </header>

        {/* 主内容区 */}
        <main className="flex-1 overflow-auto bg-background-studio">
          <div className="p-6">
            {loading ? (
              // 骨架屏加载
              <div className={cn(
                viewType === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                  : "space-y-3"
              )}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <ConversationSkeleton key={i} view={viewType} />
                ))}
              </div>
            ) : error ? (
              // 错误状态
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-xl bg-destructive-200 border border-destructive/30 flex items-center justify-center mb-4">
                  <X className="w-8 h-8 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">加载失败</h3>
                <p className="text-sm text-foreground-light mb-6 max-w-md">{error}</p>
                <Button onClick={() => fetchConversations()} className="bg-brand-500 hover:bg-brand-600 text-background">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  重新加载
                </Button>
              </div>
            ) : sortedConversations.length === 0 ? (
              // 空状态
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-xl bg-surface-200 border border-border flex items-center justify-center">
                    <MessageSquare className="w-10 h-10 text-foreground-muted" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-background" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {searchQuery ? "没有找到匹配的对话" : "开始你的第一次对话"}
                </h3>
                <p className="text-sm text-foreground-light mb-6 max-w-md">
                  {searchQuery
                    ? `未找到包含 "${searchQuery}" 的对话，尝试其他关键词`
                    : "与 AI 助手展开对话，探索无限可能"}
                </p>
                <div className="flex items-center gap-3">
                  <Button
                    className="bg-brand-500 hover:bg-brand-600 text-background"
                    onClick={handleCreateConversation}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    开始新对话
                  </Button>
                  {searchQuery && (
                    <Button variant="outline" className="border-border" onClick={() => setSearchQuery("")}>
                      清除搜索
                    </Button>
                  )}
                </div>

                {/* 功能提示卡片 */}
                {!searchQuery && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 max-w-3xl w-full">
                    <div className="p-4 rounded-lg bg-surface-100 border border-border hover:border-border-strong transition-colors group">
                      <div className="w-10 h-10 rounded-lg bg-surface-200 border border-border flex items-center justify-center mb-3 group-hover:bg-surface-300">
                        <Brain className="w-5 h-5 text-foreground-light" />
                      </div>
                      <h4 className="font-medium text-foreground mb-1">多模型支持</h4>
                      <p className="text-sm text-foreground-light">支持 GPT-4、Claude 等主流 AI 模型</p>
                    </div>
                    <div className="p-4 rounded-lg bg-surface-100 border border-border hover:border-border-strong transition-colors group">
                      <div className="w-10 h-10 rounded-lg bg-surface-200 border border-border flex items-center justify-center mb-3 group-hover:bg-surface-300">
                        <FolderOpen className="w-5 h-5 text-brand-500" />
                      </div>
                      <h4 className="font-medium text-foreground mb-1">智能分类</h4>
                      <p className="text-sm text-foreground-light">使用文件夹整理你的对话</p>
                    </div>
                    <div className="p-4 rounded-lg bg-surface-100 border border-border hover:border-border-strong transition-colors group">
                      <div className="w-10 h-10 rounded-lg bg-surface-200 border border-border flex items-center justify-center mb-3 group-hover:bg-surface-300">
                        <Download className="w-5 h-5 text-foreground-light" />
                      </div>
                      <h4 className="font-medium text-foreground mb-1">导出分享</h4>
                      <p className="text-sm text-foreground-light">导出为 JSON 或 Markdown 格式</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* 时间线视图 */}
                {viewType === "timeline" ? (
                  <div className="space-y-8">
                    {Object.entries(groupedByDate).map(([dateKey, convs]) => (
                      <div key={dateKey}>
                        <div className="flex items-center gap-4 mb-4 sticky top-0 bg-background-studio py-2 z-10">
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-100 border border-border">
                            <Calendar className="w-4 h-4 text-brand-500" />
                            <span className="text-sm font-semibold text-foreground">{dateKey}</span>
                            <Badge variant="secondary" className="text-[11px] bg-surface-200 text-foreground-light border border-border">
                              {convs.length}
                            </Badge>
                          </div>
                          <div className="flex-1 h-px bg-border" />
                        </div>
                        <div className="space-y-3 pl-4 border-l-2 border-border">
                          {convs.map((conversation) => (
                            <ConversationCard
                              key={conversation.id}
                              conversation={conversation}
                              viewType="list"
                              isSelected={selectedConversations.has(conversation.id)}
                              isSelectionMode={isSelectionMode}
                              isOperating={operationLoading === conversation.id}
                              searchQuery={searchQuery}
                              onSelect={toggleSelect}
                              onToggleStar={handleToggleStar}
                              onTogglePin={handleTogglePin}
                              onRename={openRenameDialog}
                              onDuplicate={handleDuplicate}
                              onMoveToFolder={openMoveToFolder}
                              onShare={handleShare}
                              onExport={handleExport}
                              onArchive={handleArchive}
                              onDelete={handleDelete}
                              onClick={(id) => router.push(`/chat/${id}`)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : viewType === "grid" ? (
                  // 网格视图
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {sortedConversations.map((conversation) => (
                      <ConversationCard
                        key={conversation.id}
                        conversation={conversation}
                        viewType="grid"
                        isSelected={selectedConversations.has(conversation.id)}
                        isSelectionMode={isSelectionMode}
                        isOperating={operationLoading === conversation.id}
                        searchQuery={searchQuery}
                        onSelect={toggleSelect}
                        onToggleStar={handleToggleStar}
                        onTogglePin={handleTogglePin}
                        onRename={openRenameDialog}
                        onDuplicate={handleDuplicate}
                        onMoveToFolder={openMoveToFolder}
                        onShare={handleShare}
                        onExport={handleExport}
                        onArchive={handleArchive}
                        onDelete={handleDelete}
                        onClick={(id) => router.push(`/chat/${id}`)}
                      />
                    ))}
                  </div>
                ) : (
                  // 列表视图
                  <div className="space-y-2">
                    {sortedConversations.map((conversation) => (
                      <ConversationCard
                        key={conversation.id}
                        conversation={conversation}
                        viewType="list"
                        isSelected={selectedConversations.has(conversation.id)}
                        isSelectionMode={isSelectionMode}
                        isOperating={operationLoading === conversation.id}
                        searchQuery={searchQuery}
                        onSelect={toggleSelect}
                        onToggleStar={handleToggleStar}
                        onTogglePin={handleTogglePin}
                        onRename={openRenameDialog}
                        onDuplicate={handleDuplicate}
                        onMoveToFolder={openMoveToFolder}
                        onShare={handleShare}
                        onExport={handleExport}
                        onArchive={handleArchive}
                        onDelete={handleDelete}
                        onClick={(id) => router.push(`/chat/${id}`)}
                      />
                    ))}
                  </div>
                )}

                {/* 分页 */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                    <div className="text-sm text-foreground-light">
                      共 <span className="font-semibold text-foreground">{total}</span> 条对话
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 border-border"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1 || loading}
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        上一页
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum: number;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (page <= 3) {
                            pageNum = i + 1;
                          } else if (page >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = page - 2 + i;
                          }
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setPage(pageNum)}
                              disabled={loading}
                              className={cn(
                                "w-9 h-9 rounded-lg text-sm font-medium transition-colors",
                                page === pageNum
                                  ? "bg-brand-500 text-background"
                                  : "text-foreground-muted hover:text-foreground hover:bg-surface-200"
                              )}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 border-border"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages || loading}
                      >
                        下一页
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                    <div className="text-sm text-foreground-muted">
                      第 <span className="font-semibold text-brand-500">{page}</span> / {totalPages} 页
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* 文件夹管理对话框 */}
      <ConversationFolderManageDialog
        open={folderManageOpen}
        onOpenChange={setFolderManageOpen}
        folders={folders}
        onFoldersChange={() => {
          fetchFolders();
          fetchConversations();
        }}
      />

      {/* 移动到文件夹对话框 */}
      <MoveToFolderDialog
        open={moveToFolderOpen}
        onOpenChange={setMoveToFolderOpen}
        folders={folders}
        conversationIds={moveTargetIds}
        currentFolderId={moveCurrentFolderId}
        onSuccess={() => {
          fetchFolders();
          fetchConversations();
          setSelectedConversations(new Set());
          setIsSelectionMode(false);
        }}
      />

      {/* 重命名对话框 */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-[420px] bg-surface-100 border border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">重命名对话</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="输入新标题"
              className="bg-surface-100 border-border focus:ring-brand-500/20"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") setRenameDialogOpen(false);
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-border text-foreground-light"
              onClick={() => setRenameDialogOpen(false)}
            >
              取消
            </Button>
            <Button
              onClick={handleRename}
              className="bg-brand-500 hover:bg-brand-600 text-background"
              disabled={!renameValue.trim() || operationLoading === renameTarget?.id}
            >
              {operationLoading === renameTarget?.id ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 导入对话框 */}
      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        folders={folders}
        onSuccess={() => {
          fetchConversations();
          setImportDialogOpen(false);
        }}
      />
    </PageContainer>
  );
}
