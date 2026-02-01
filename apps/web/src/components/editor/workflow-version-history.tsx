"use client";

/**
 * 工作流版本历史组件
 *
 * 功能：
 * - 自动版本创建
 * - 版本列表查看
 * - 版本对比
 * - 版本回滚
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  History,
  Clock,
  GitBranch,
  GitCompare,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Eye,
  Copy,
  Trash2,
  MoreHorizontal,
  Plus,
  Minus,
  AlertCircle,
  Save,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

// ========== 类型定义 ==========

export interface WorkflowVersion {
  id: string;
  versionNumber: number;
  name?: string;
  description?: string;
  createdAt: Date;
  createdBy?: string;
  isAutoSave: boolean;
  isCurrent: boolean;
  isTagged?: boolean;
  tagName?: string;
  changes?: VersionChanges;
  workflowSnapshot: string; // JSON 快照
}

export interface VersionChanges {
  nodesAdded: number;
  nodesRemoved: number;
  nodesModified: number;
  edgesAdded: number;
  edgesRemoved: number;
}

export interface WorkflowVersionHistoryProps {
  /** 工作流 ID */
  workflowId: string;
  /** 版本列表 */
  versions: WorkflowVersion[];
  /** 当前版本 */
  currentVersionId?: string;
  /** 创建版本回调 */
  onCreateVersion?: (name?: string, description?: string) => Promise<void>;
  /** 恢复版本回调 */
  onRestoreVersion?: (versionId: string) => Promise<void>;
  /** 预览版本回调 */
  onPreviewVersion?: (versionId: string) => void;
  /** 删除版本回调 */
  onDeleteVersion?: (versionId: string) => Promise<void>;
  /** 添加标签回调 */
  onTagVersion?: (versionId: string, tagName: string) => Promise<void>;
  /** 获取版本对比回调 */
  onCompareVersions?: (versionA: string, versionB: string) => Promise<VersionDiff>;
  /** 是否加载中 */
  isLoading?: boolean;
  /** 自定义类名 */
  className?: string;
}

export interface VersionDiff {
  nodesAdded: NodeDiffItem[];
  nodesRemoved: NodeDiffItem[];
  nodesModified: NodeDiffItem[];
  edgesAdded: EdgeDiffItem[];
  edgesRemoved: EdgeDiffItem[];
}

interface NodeDiffItem {
  id: string;
  type: string;
  label?: string;
  changes?: string[];
}

interface EdgeDiffItem {
  id: string;
  sourceId: string;
  targetId: string;
}

// 格式化时间
const formatTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return "刚刚";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;

  return date.toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ========== 版本项组件 ==========

interface VersionItemProps {
  version: WorkflowVersion;
  isSelected: boolean;
  compareMode: boolean;
  isCompareA: boolean;
  isCompareB: boolean;
  onSelect: () => void;
  onRestore: () => void;
  onPreview: () => void;
  onDelete: () => void;
  onTag: () => void;
  onCompareSelect: () => void;
}

function VersionItem({
  version,
  isSelected,
  compareMode,
  isCompareA,
  isCompareB,
  onSelect,
  onRestore,
  onPreview,
  onDelete,
  onTag,
  onCompareSelect,
}: VersionItemProps) {
  return (
    <div
      className={cn(
        "relative p-3 rounded-lg border transition-all cursor-pointer",
        isSelected
          ? "bg-brand-200/40 border-brand-500/40"
          : "bg-surface-100/60 border-border/50 hover:border-border",
        compareMode && (isCompareA || isCompareB) && "ring-2",
        isCompareA && "ring-brand-500",
        isCompareB && "ring-warning/60"
      )}
      onClick={compareMode ? onCompareSelect : onSelect}
    >
      {/* 对比模式标记 */}
      {compareMode && (isCompareA || isCompareB) && (
        <div
          className={cn(
            "absolute -top-2 -left-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-background",
            isCompareA ? "bg-brand-500" : "bg-warning"
          )}
        >
          {isCompareA ? "A" : "B"}
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* 版本号和标签 */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              v{version.versionNumber}
            </span>
            {version.isCurrent && (
              <Badge
                variant="secondary"
                className="text-[10px] bg-brand-200/60 text-brand-500"
              >
                当前
              </Badge>
            )}
            {version.isAutoSave && (
              <Badge
                variant="secondary"
                className="text-[10px] bg-surface-200 text-foreground-muted"
              >
                自动
              </Badge>
            )}
            {version.isTagged && version.tagName && (
              <Badge
                variant="secondary"
                className="text-[10px] bg-warning-200 text-warning"
              >
                <Tag className="w-2.5 h-2.5 mr-1" />
                {version.tagName}
              </Badge>
            )}
          </div>

          {/* 名称 */}
          {version.name && (
            <p className="text-sm text-foreground mt-1 truncate">{version.name}</p>
          )}

          {/* 时间和变更信息 */}
          <div className="flex items-center gap-3 mt-1.5 text-xs text-foreground-muted">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(version.createdAt)}
            </span>
            {version.changes && (
              <span className="flex items-center gap-1.5">
                {version.changes.nodesAdded > 0 && (
                  <span className="text-brand-500">
                    +{version.changes.nodesAdded}
                  </span>
                )}
                {version.changes.nodesRemoved > 0 && (
                  <span className="text-destructive">
                    -{version.changes.nodesRemoved}
                  </span>
                )}
                {version.changes.nodesModified > 0 && (
                  <span className="text-warning">
                    ~{version.changes.nodesModified}
                  </span>
                )}
              </span>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        {!compareMode && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1 rounded hover:bg-surface-200 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-4 h-4 text-foreground-muted" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-40 bg-surface-100 border-border"
            >
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview();
                }}
                className="text-foreground focus:bg-surface-200"
              >
                <Eye className="w-4 h-4 mr-2" />
                预览
              </DropdownMenuItem>
              {!version.isCurrent && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onRestore();
                  }}
                  className="text-foreground focus:bg-surface-200"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  恢复
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onTag();
                }}
                className="text-foreground focus:bg-surface-200"
              >
                <Tag className="w-4 h-4 mr-2" />
                添加标签
              </DropdownMenuItem>
              {!version.isCurrent && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="text-destructive focus:bg-surface-200"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  删除
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

// ========== 版本对比组件 ==========

interface VersionDiffViewProps {
  diff: VersionDiff | null;
  isLoading: boolean;
}

function VersionDiffView({ diff, isLoading }: VersionDiffViewProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-foreground-muted">
        <div className="animate-spin w-5 h-5 border-2 border-foreground-muted border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!diff) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-foreground-muted">
        <GitCompare className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm">选择两个版本进行对比</p>
      </div>
    );
  }

  const totalChanges =
    diff.nodesAdded.length +
    diff.nodesRemoved.length +
    diff.nodesModified.length +
    diff.edgesAdded.length +
    diff.edgesRemoved.length;

  if (totalChanges === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-foreground-muted">
        <Check className="w-8 h-8 mb-2 text-brand-500" />
        <p className="text-sm">两个版本完全相同</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 新增节点 */}
      {diff.nodesAdded.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Plus className="w-4 h-4 text-brand-500" />
            <span className="text-sm font-medium text-brand-500">
              新增节点 ({diff.nodesAdded.length})
            </span>
          </div>
          <div className="space-y-1 pl-6">
            {diff.nodesAdded.map((node) => (
              <div
                key={node.id}
                className="text-xs text-foreground-muted flex items-center gap-2"
              >
                <span className="text-foreground-muted/70">{node.type}</span>
                <span>{node.label || node.id}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 删除节点 */}
      {diff.nodesRemoved.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Minus className="w-4 h-4 text-destructive" />
            <span className="text-sm font-medium text-destructive">
              删除节点 ({diff.nodesRemoved.length})
            </span>
          </div>
          <div className="space-y-1 pl-6">
            {diff.nodesRemoved.map((node) => (
              <div
                key={node.id}
                className="text-xs text-foreground-muted flex items-center gap-2 line-through"
              >
                <span className="text-foreground-muted/70">{node.type}</span>
                <span>{node.label || node.id}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 修改节点 */}
      {diff.nodesModified.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <GitBranch className="w-4 h-4 text-warning" />
            <span className="text-sm font-medium text-warning">
              修改节点 ({diff.nodesModified.length})
            </span>
          </div>
          <div className="space-y-1 pl-6">
            {diff.nodesModified.map((node) => (
              <div key={node.id} className="text-xs text-foreground-muted">
                <div className="flex items-center gap-2">
                  <span className="text-foreground-muted/70">{node.type}</span>
                  <span>{node.label || node.id}</span>
                </div>
                {node.changes && node.changes.length > 0 && (
                  <ul className="mt-1 ml-4 text-[10px] text-foreground-muted/70">
                    {node.changes.map((change, i) => (
                      <li key={i}>• {change}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ========== 主组件 ==========

export function WorkflowVersionHistory({
  workflowId,
  versions,
  currentVersionId,
  onCreateVersion,
  onRestoreVersion,
  onPreviewVersion,
  onDeleteVersion,
  onTagVersion,
  onCompareVersions,
  isLoading = false,
  className,
}: WorkflowVersionHistoryProps) {
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareVersionA, setCompareVersionA] = useState<string | null>(null);
  const [compareVersionB, setCompareVersionB] = useState<string | null>(null);
  const [diff, setDiff] = useState<VersionDiff | null>(null);
  const [isDiffLoading, setIsDiffLoading] = useState(false);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [tagVersionId, setTagVersionId] = useState<string | null>(null);
  const [newVersionName, setNewVersionName] = useState("");
  const [newTagName, setNewTagName] = useState("");

  // 排序版本（最新在前）
  const sortedVersions = useMemo(
    () => [...versions].sort((a, b) => b.versionNumber - a.versionNumber),
    [versions]
  );

  // 处理对比选择
  const handleCompareSelect = useCallback((versionId: string) => {
    if (!compareVersionA) {
      setCompareVersionA(versionId);
    } else if (!compareVersionB && versionId !== compareVersionA) {
      setCompareVersionB(versionId);
    } else {
      // 重新选择
      setCompareVersionA(versionId);
      setCompareVersionB(null);
      setDiff(null);
    }
  }, [compareVersionA, compareVersionB]);

  // 执行对比
  useEffect(() => {
    if (compareVersionA && compareVersionB && onCompareVersions) {
      setIsDiffLoading(true);
      onCompareVersions(compareVersionA, compareVersionB)
        .then(setDiff)
        .catch(() => toast.error("对比失败"))
        .finally(() => setIsDiffLoading(false));
    }
  }, [compareVersionA, compareVersionB, onCompareVersions]);

  // 退出对比模式
  const exitCompareMode = useCallback(() => {
    setCompareMode(false);
    setCompareVersionA(null);
    setCompareVersionB(null);
    setDiff(null);
  }, []);

  // 创建版本
  const handleCreateVersion = useCallback(async () => {
    if (!onCreateVersion) return;

    try {
      await onCreateVersion(newVersionName || undefined);
      toast.success("版本已创建");
      setShowCreateDialog(false);
      setNewVersionName("");
    } catch {
      toast.error("创建失败");
    }
  }, [newVersionName, onCreateVersion]);

  // 恢复版本
  const handleRestore = useCallback(async (versionId: string) => {
    if (!onRestoreVersion) return;

    try {
      await onRestoreVersion(versionId);
      toast.success("版本已恢复");
    } catch {
      toast.error("恢复失败");
    }
  }, [onRestoreVersion]);

  // 添加标签
  const handleAddTag = useCallback(async () => {
    if (!onTagVersion || !tagVersionId || !newTagName.trim()) return;

    try {
      await onTagVersion(tagVersionId, newTagName.trim());
      toast.success("标签已添加");
      setShowTagDialog(false);
      setTagVersionId(null);
      setNewTagName("");
    } catch {
      toast.error("添加失败");
    }
  }, [tagVersionId, newTagName, onTagVersion]);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* 头部 */}
      <div className="shrink-0 p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-foreground-muted" />
            <h3 className="text-sm font-medium text-foreground">版本历史</h3>
            <Badge variant="secondary" className="text-[10px] bg-surface-200">
              {versions.length}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {compareMode ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={exitCompareMode}
              >
                <X className="w-3.5 h-3.5 mr-1" />
                退出对比
              </Button>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => setCompareMode(true)}
                    >
                      <GitCompare className="w-4 h-4 text-foreground-muted" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>版本对比</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <Button
              size="sm"
              className="h-7 text-xs bg-brand-500 hover:bg-brand-600 text-background"
              onClick={() => setShowCreateDialog(true)}
            >
              <Save className="w-3.5 h-3.5 mr-1" />
              保存版本
            </Button>
          </div>
        </div>

        {/* 对比模式提示 */}
        {compareMode && (
          <div className="p-2 rounded-lg bg-brand-200/60 text-xs text-brand-500">
            {!compareVersionA
              ? "选择第一个版本 (A)"
              : !compareVersionB
                ? "选择第二个版本 (B)"
                : "对比结果"}
          </div>
        )}
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-hidden flex">
        {/* 版本列表 */}
        <ScrollArea className={cn("flex-1", compareMode && compareVersionA && compareVersionB && "w-1/2")}>
          <div className="p-4 space-y-2">
            {sortedVersions.map((version) => (
              <VersionItem
                key={version.id}
                version={version}
                isSelected={selectedVersionId === version.id}
                compareMode={compareMode}
                isCompareA={compareVersionA === version.id}
                isCompareB={compareVersionB === version.id}
                onSelect={() => setSelectedVersionId(version.id)}
                onRestore={() => handleRestore(version.id)}
                onPreview={() => onPreviewVersion?.(version.id)}
                onDelete={() => onDeleteVersion?.(version.id)}
                onTag={() => {
                  setTagVersionId(version.id);
                  setShowTagDialog(true);
                }}
                onCompareSelect={() => handleCompareSelect(version.id)}
              />
            ))}

            {versions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-foreground-muted">
                <History className="w-10 h-10 mb-3 opacity-50" />
                <p className="text-sm">暂无版本历史</p>
                <p className="text-xs mt-1">保存版本以开始记录</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* 对比结果 */}
        {compareMode && compareVersionA && compareVersionB && (
          <div className="w-1/2 border-l border-border">
            <ScrollArea className="h-full">
              <div className="p-4">
                <h4 className="text-sm font-medium text-foreground mb-4">
                  对比结果
                </h4>
                <VersionDiffView diff={diff} isLoading={isDiffLoading} />
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* 创建版本对话框 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-surface-100 border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">保存版本</DialogTitle>
            <DialogDescription className="text-foreground-muted">
              创建当前工作流的版本快照
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="版本名称（可选）"
              value={newVersionName}
              onChange={(e) => setNewVersionName(e.target.value)}
              className="bg-surface-100 border-border"
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowCreateDialog(false)}
            >
              取消
            </Button>
            <Button
              className="bg-brand-500 hover:bg-brand-600 text-background"
              onClick={handleCreateVersion}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 添加标签对话框 */}
      <Dialog open={showTagDialog} onOpenChange={setShowTagDialog}>
        <DialogContent className="bg-surface-100 border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">添加标签</DialogTitle>
            <DialogDescription className="text-foreground-muted">
              为此版本添加一个便于识别的标签
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="标签名称，如 v1.0、stable"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              className="bg-surface-100 border-border"
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowTagDialog(false)}
            >
              取消
            </Button>
            <Button
              className="bg-brand-500 hover:bg-brand-600 text-background"
              onClick={handleAddTag}
              disabled={!newTagName.trim()}
            >
              添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default WorkflowVersionHistory;
