"use client";

/**
 * 对话历史/消息中心页面 - Supabase 风格 + 极简文本侧边栏
 * 采用 PageWithSidebar 三栏布局
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  PageWithSidebar,
  PageHeader,
  SidebarNavGroup,
  SidebarNavItem,
  EmptyState,
} from "@/components/dashboard/page-layout";
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
  Brain,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  LayoutList,
  SortAsc,
  SortDesc,
  ChevronDown,
  Folder,
  FolderPlus,
  MessageCircle,
  Bot,
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
import { appApi, conversationApi, conversationFolderApi } from "@/lib/api";
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

// 排序选项
const sortOptions = [
  { id: "updated", label: "最近更新", desc: true },
  { id: "created", label: "创建时间", desc: true },
  { id: "title", label: "标题", desc: false },
  { id: "messages", label: "消息数", desc: true },
];

// 视图类型 - 移除 timeline
type ViewType = "list" | "grid";

const LAST_WORKSPACE_STORAGE_KEY = "last_workspace_id";

const readStoredWorkspaceId = () => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(LAST_WORKSPACE_STORAGE_KEY);
  } catch {
    return null;
  }
};

const writeStoredWorkspaceId = (workspaceId: string) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LAST_WORKSPACE_STORAGE_KEY, workspaceId);
  } catch {
    // ignore storage errors
  }
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

// 简化的对话卡片组件
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
  // 网格视图
  if (viewType === "grid") {
    return (
      <div
        className={cn(
          "group relative p-4 rounded-lg cursor-pointer transition-colors duration-150",
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
            <Pin className="w-3 h-3 text-brand-500 fill-brand-500" />
          )}
          {conversation.starred && (
            <Star className="w-3 h-3 text-warning fill-warning" />
          )}
        </div>

        {/* 模型图标 - 统一使用 surface 背景 */}
        <div className="w-10 h-10 rounded-lg bg-surface-200 border border-border flex items-center justify-center mb-3">
          <Bot className="w-5 h-5 text-foreground-light" />
        </div>

        {/* 标题 */}
        <h3 className="text-[13px] font-medium text-foreground truncate mb-1 pr-8">
          <HighlightText text={conversation.title} search={searchQuery} />
        </h3>

        {/* 预览 */}
        <p className="text-[12px] text-foreground-light line-clamp-2 mb-3 min-h-[32px]">
          {conversation.preview ? (
            <HighlightText text={conversation.preview} search={searchQuery} />
          ) : (
            "暂无消息预览"
          )}
        </p>

        {/* 元信息 */}
        <div className="flex items-center justify-between text-[11px] text-foreground-muted">
          <span className="flex items-center gap-1">
            <MessageCircle className="w-3 h-3" />
            {conversation.messageCount}
          </span>
          <span>{formatRelativeTime(conversation.updatedAt)}</span>
        </div>

        {/* 模型标签 */}
        <div className="mt-3 pt-3 border-t border-border">
          <Badge variant="secondary" className="text-[10px] bg-surface-200 text-foreground-muted border-0">
            {conversation.model}
          </Badge>
        </div>

        {/* 悬停操作按钮 */}
        {!isSelectionMode && (
          <div 
            className="absolute bottom-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="p-1.5 rounded-md hover:bg-surface-200 text-foreground-muted hover:text-foreground transition-colors"
              onClick={() => onToggleStar(conversation.id, conversation.starred)}
            >
              <Star className={cn("w-3.5 h-3.5", conversation.starred && "text-warning fill-warning")} />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1.5 rounded-md hover:bg-surface-200 text-foreground-muted hover:text-foreground transition-colors">
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 bg-surface-100 border-border">
                <DropdownMenuItem onClick={() => onRename(conversation)} className="text-[12px]">
                  <Edit3 className="w-3.5 h-3.5 mr-2" />
                  重命名
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(conversation.id)} className="text-[12px]">
                  <Copy className="w-3.5 h-3.5 mr-2" />
                  复制
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onMoveToFolder(conversation.id, conversation.folderId)} className="text-[12px]">
                  <FolderOpen className="w-3.5 h-3.5 mr-2" />
                  移动到文件夹
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem onClick={() => onExport(conversation.id, "json")} className="text-[12px]">
                  <Download className="w-3.5 h-3.5 mr-2" />
                  导出
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem onClick={() => onArchive(conversation.id)} className="text-[12px]">
                  <Archive className="w-3.5 h-3.5 mr-2" />
                  归档
                </DropdownMenuItem>
                <DropdownMenuItem className="text-[12px] text-destructive" onClick={() => onDelete(conversation.id)}>
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    );
  }

  // 列表视图 - 简化样式
  return (
    <div
      className={cn(
        "group p-4 rounded-lg cursor-pointer transition-colors duration-150",
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

        {/* AI 头像 - 简化 */}
        <div className="w-10 h-10 rounded-lg bg-surface-200 border border-border flex items-center justify-center shrink-0">
          <Bot className="w-5 h-5 text-foreground-light" />
        </div>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {conversation.pinned && (
              <Pin className="w-3 h-3 text-brand-500 fill-brand-500" />
            )}
            {conversation.starred && (
              <Star className="w-3 h-3 text-warning fill-warning" />
            )}
            <span className="font-medium text-[13px] text-foreground truncate">
              <HighlightText text={conversation.title} search={searchQuery} />
            </span>
            <Badge variant="secondary" className="text-[10px] shrink-0 bg-surface-200 text-foreground-muted border-0">
              {conversation.model}
            </Badge>
          </div>

          <p className="text-[12px] text-foreground-light line-clamp-1 mb-2">
            {conversation.preview ? (
              <HighlightText text={conversation.preview} search={searchQuery} />
            ) : (
              <span className="italic">暂无消息预览</span>
            )}
          </p>

          <div className="flex items-center gap-4 text-[11px] text-foreground-muted">
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              {conversation.messageCount} 条消息
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatRelativeTime(conversation.updatedAt)}
            </span>
          </div>
        </div>

        {/* 操作按钮 - 悬停显示 */}
        {!isSelectionMode && (
          <div
            className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="p-2 rounded-md hover:bg-surface-200 text-foreground-muted hover:text-foreground transition-colors"
              onClick={() => onToggleStar(conversation.id, conversation.starred)}
            >
              <Star className={cn("w-4 h-4", conversation.starred && "text-warning fill-warning")} />
            </button>
            
            <button
              className="p-2 rounded-md hover:bg-surface-200 text-foreground-muted hover:text-foreground transition-colors"
              onClick={() => onTogglePin(conversation.id, conversation.pinned)}
            >
              <Pin className={cn("w-4 h-4", conversation.pinned && "text-brand-500 fill-brand-500")} />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 rounded-md hover:bg-surface-200 text-foreground-muted hover:text-foreground transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 bg-surface-100 border-border">
                <DropdownMenuItem onClick={() => onRename(conversation)} className="text-[12px]">
                  <Edit3 className="w-3.5 h-3.5 mr-2" />
                  重命名
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(conversation.id)} className="text-[12px]">
                  <Copy className="w-3.5 h-3.5 mr-2" />
                  复制
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onMoveToFolder(conversation.id, conversation.folderId)} className="text-[12px]">
                  <FolderOpen className="w-3.5 h-3.5 mr-2" />
                  移动到文件夹
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onShare(conversation.id)} className="text-[12px]">
                  <Share2 className="w-3.5 h-3.5 mr-2" />
                  分享
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem onClick={() => onExport(conversation.id, "json")} className="text-[12px]">
                  <Download className="w-3.5 h-3.5 mr-2" />
                  导出 JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport(conversation.id, "markdown")} className="text-[12px]">
                  <Download className="w-3.5 h-3.5 mr-2" />
                  导出 Markdown
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem onClick={() => onArchive(conversation.id)} className="text-[12px]">
                  <Archive className="w-3.5 h-3.5 mr-2" />
                  归档
                </DropdownMenuItem>
                <DropdownMenuItem className="text-[12px] text-destructive" onClick={() => onDelete(conversation.id)}>
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
}

// 侧边栏筛选项组件 - 遵循极简文本风格
interface FilterNavItemProps {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}

function FilterNavItem({ label, count, active, onClick }: FilterNavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full h-8 flex items-center justify-between px-3 rounded-md text-[12px] font-medium transition-colors duration-150",
        active 
          ? "bg-surface-100/70 text-foreground"
          : "text-foreground-light hover:bg-surface-100/60 hover:text-foreground"
      )}
    >
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span className="text-[11px] text-foreground-muted">{count}</span>
      )}
    </button>
  );
}

type ConversationsPageProps = {
  workspaceId?: string;
};

export function ConversationsPageContent({ workspaceId }: ConversationsPageProps) {
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

  const shouldLogApiError = process.env.NEXT_PUBLIC_DEBUG_API === "true";
  
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
      if (shouldLogApiError) {
        console.error("Failed to fetch folders:", err);
      }
    }
  }, [shouldLogApiError]);

  // 获取对话列表
  const fetchConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!workspaceId) {
        setConversations([]);
        setTotal(0);
        setError("请先选择工作空间");
        setLoading(false);
        return;
      }
      const params: ListConversationsParams = {
        workspaceId,
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
      if (shouldLogApiError) {
        console.error("Failed to fetch conversations:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [workspaceId, page, searchQuery, selectedFolder, filter, shouldLogApiError]);

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
      if (!workspaceId) {
        toast.error("请先选择工作空间");
        router.push("/dashboard/apps");
        return;
      }
      const newConversation = await conversationApi.create({
        workspaceId,
        title: "新对话",
        model: "gpt-4",
      });
      router.push(`/dashboard/app/${workspaceId}/conversations/${newConversation.id}`);
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

  // 获取筛选标签
  const getFilterLabel = () => {
    switch (filter) {
      case "starred": return "收藏";
      case "pinned": return "置顶";
      case "archived": return "归档";
      default: return "全部对话";
    }
  };

  // 侧边栏内容
  const sidebarContent = (
    <div className="space-y-6">
      {/* 筛选导航 */}
      <SidebarNavGroup title="筛选">
        <div className="space-y-0.5">
          <FilterNavItem
            label="全部对话"
            count={total}
            active={filter === "all" && !selectedFolder}
            onClick={() => {
              setFilter("all");
              setSelectedFolder(null);
              setPage(1);
            }}
          />
          <FilterNavItem
            label="收藏"
            active={filter === "starred"}
            onClick={() => {
              setFilter("starred");
              setSelectedFolder(null);
              setPage(1);
            }}
          />
          <FilterNavItem
            label="置顶"
            active={filter === "pinned"}
            onClick={() => {
              setFilter("pinned");
              setSelectedFolder(null);
              setPage(1);
            }}
          />
          <FilterNavItem
            label="归档"
            active={filter === "archived"}
            onClick={() => {
              setFilter("archived");
              setSelectedFolder(null);
              setPage(1);
            }}
          />
        </div>
      </SidebarNavGroup>

      {/* 文件夹列表 */}
      <SidebarNavGroup title="文件夹">
        <div className="space-y-0.5">
          {folders.map((folder) => (
            <FilterNavItem
              key={folder.id}
              label={`${folder.icon || "📁"} ${folder.name}`}
              count={folder.conversationCount}
              active={selectedFolder === folder.id}
              onClick={() => {
                setSelectedFolder(folder.id);
                setFilter("all");
                setPage(1);
              }}
            />
          ))}
          <button
            onClick={() => setFolderManageOpen(true)}
            className="w-full h-8 flex items-center gap-2 px-3 rounded-md text-[12px] text-foreground-muted hover:text-foreground hover:bg-surface-100/60 transition-colors duration-150"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            管理文件夹
          </button>
        </div>
      </SidebarNavGroup>
    </div>
  );

  return (
    <PageWithSidebar
      sidebar={sidebarContent}
      sidebarTitle="对话"
      sidebarWidth="narrow"
    >
      {/* 页面头部 */}
      <PageHeader
        title="对话中心"
        description={
          searchQuery
            ? `搜索 "${searchQuery}" · 找到 ${total} 个结果`
            : `${getFilterLabel()} · 共 ${total} 个对话`
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-border text-foreground-light hover:text-foreground"
              onClick={() =>
                workspaceId ? setImportDialogOpen(true) : toast.error("请先选择工作空间")
              }
              disabled={!workspaceId}
            >
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              导入
            </Button>
            <Button
              size="sm"
              className="h-8 bg-brand-500 hover:bg-brand-600 text-background"
              onClick={handleCreateConversation}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              新建对话
            </Button>
          </div>
        }
      />

      {/* 工具栏 */}
      <div className="flex items-center gap-3 mb-4">
        {/* 搜索框 */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="搜索对话... (Ctrl+K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-8 h-8 text-[12px] bg-surface-100 border-border focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 视图切换 */}
        <div className="flex items-center gap-0.5 p-0.5 bg-surface-100 border border-border rounded-md">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setViewType("list")}
                  className={cn(
                    "p-1.5 rounded transition-colors",
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
                    "p-1.5 rounded transition-colors",
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
        </div>

        {/* 排序 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 border-border text-foreground-light text-[12px]">
              {sortDesc ? <SortDesc className="w-3.5 h-3.5" /> : <SortAsc className="w-3.5 h-3.5" />}
              {sortOptions.find((s) => s.id === sortBy)?.label}
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 bg-surface-100 border-border">
            <DropdownMenuLabel className="text-[11px] text-foreground-muted">排序方式</DropdownMenuLabel>
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
                className="text-[12px]"
              >
                <span className="flex-1">{option.label}</span>
                {sortBy === option.id && (
                  sortDesc ? <SortDesc className="w-3.5 h-3.5" /> : <SortAsc className="w-3.5 h-3.5" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 更多操作 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-8 w-8 border-border text-foreground-light">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 bg-surface-100 border-border">
            <DropdownMenuItem
              onClick={() => setIsSelectionMode(true)}
              className="text-[12px]"
            >
              <Check className="w-3.5 h-3.5 mr-2" />
              批量选择
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => fetchConversations()}
              className="text-[12px]"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-2" />
              刷新列表
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 批量选择工具栏 */}
      {isSelectionMode && (
        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-surface-100 border border-border">
          <Checkbox
            checked={selectedConversations.size === conversations.length && conversations.length > 0}
            onCheckedChange={toggleSelectAll}
          />
          <span className="text-[12px] text-foreground">
            已选择 <span className="font-medium text-brand-500">{selectedConversations.size}</span> 项
          </span>
          <div className="flex-1" />
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => handleBatchStar(true)}
              disabled={selectedConversations.size === 0}
            >
              <Star className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={openBatchMoveToFolder}
              disabled={selectedConversations.size === 0}
            >
              <FolderOpen className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleBatchArchive}
              disabled={selectedConversations.size === 0}
            >
              <Archive className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={handleBatchDelete}
              disabled={selectedConversations.size === 0}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[12px] border-border"
            onClick={() => {
              setIsSelectionMode(false);
              setSelectedConversations(new Set());
            }}
          >
            取消
          </Button>
        </div>
      )}

      {/* 主内容区 */}
      {loading ? (
        // 骨架屏加载
        <div className={cn(
          viewType === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            : "space-y-2"
        )}>
          {Array.from({ length: 8 }).map((_, i) => (
            <ConversationSkeleton key={i} view={viewType} />
          ))}
        </div>
      ) : error ? (
        // 错误状态
        <EmptyState
          icon={<X className="w-6 h-6 text-destructive" />}
          title="加载失败"
          description={error}
          action={{
            label: "重新加载",
            onClick: () => fetchConversations(),
          }}
        />
      ) : sortedConversations.length === 0 ? (
        // 空状态
        <EmptyState
          icon={<MessageSquare className="w-6 h-6" />}
          title={searchQuery ? "没有找到匹配的对话" : "开始你的第一次对话"}
          description={
            searchQuery
              ? `未找到包含 "${searchQuery}" 的对话`
              : "与 AI 助手展开对话，探索无限可能"
          }
          action={{
            label: searchQuery ? "清除搜索" : "开始新对话",
            onClick: searchQuery ? () => setSearchQuery("") : handleCreateConversation,
          }}
        />
      ) : (
        <>
          {/* 对话列表 */}
          {viewType === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  onClick={(id) =>
                    workspaceId
                      ? router.push(`/dashboard/app/${workspaceId}/conversations/${id}`)
                      : toast.error("请先选择工作空间")
                  }
                />
              ))}
            </div>
          ) : (
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
                  onClick={(id) =>
                    workspaceId
                      ? router.push(`/dashboard/app/${workspaceId}/conversations/${id}`)
                      : toast.error("请先选择工作空间")
                  }
                />
              ))}
            </div>
          )}

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
              <div className="text-[12px] text-foreground-light">
                共 <span className="font-medium text-foreground">{total}</span> 条对话
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-[12px] border-border"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
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
                          "w-8 h-8 rounded-md text-[12px] font-medium transition-colors",
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
                  className="h-8 text-[12px] border-border"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                >
                  下一页
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
              <div className="text-[12px] text-foreground-muted">
                第 <span className="font-medium text-brand-500">{page}</span> / {totalPages} 页
              </div>
            </div>
          )}
        </>
      )}

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
        <DialogContent className="sm:max-w-[400px] bg-surface-100 border-border">
          <DialogHeader>
            <DialogTitle className="text-[14px] text-foreground">重命名对话</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="输入新标题"
              className="h-9 text-[13px] bg-surface-100 border-border focus:ring-brand-500/20"
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
              size="sm"
              className="border-border text-foreground-light"
              onClick={() => setRenameDialogOpen(false)}
            >
              取消
            </Button>
            <Button
              size="sm"
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
        workspaceId={workspaceId ?? ""}
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        folders={folders}
        onSuccess={() => {
          fetchConversations();
          setImportDialogOpen(false);
        }}
      />
    </PageWithSidebar>
  );
}

export default function ConversationsPage() {
  const router = useRouter();
  const [redirectError, setRedirectError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const redirectToAppConversations = async () => {
      const storedWorkspaceId = readStoredWorkspaceId();
      if (storedWorkspaceId) {
        router.replace(`/dashboard/app/${storedWorkspaceId}/conversations`);
        return;
      }

      try {
        const { items } = await appApi.list({ pageSize: 1 });
        const firstAppId = items?.[0]?.id;
        if (firstAppId) {
          writeStoredWorkspaceId(firstAppId);
          router.replace(`/dashboard/app/${firstAppId}/conversations`);
          return;
        }
        router.replace("/dashboard/apps");
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to resolve app for conversations:", error);
        setRedirectError("无法加载应用列表，请稍后重试");
      }
    };

    redirectToAppConversations();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (redirectError) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-foreground-muted">{redirectError}</p>
        <Button variant="outline" onClick={() => router.replace("/dashboard/apps")}>
          返回应用列表
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center text-sm text-foreground-muted">
      正在跳转到应用对话...
    </div>
  );
}
