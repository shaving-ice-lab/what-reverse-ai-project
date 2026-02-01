"use client";

import { useState, useEffect } from "react";
import { History, RotateCcw, GitCompare, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { versionApi, type WorkflowVersion } from "@/lib/api/version";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface VersionHistoryPanelProps {
  workflowId: string;
  currentVersion: number;
  onRestore?: (version: WorkflowVersion) => void;
}

export function VersionHistoryPanel({
  workflowId,
  currentVersion,
  onRestore,
}: VersionHistoryPanelProps) {
  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState<WorkflowVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState<number[]>([]);

  // 加载版本历史
  const loadVersions = async () => {
    setLoading(true);
    try {
      const response = await versionApi.list(workflowId, { page: 1, page_size: 50 });
      setVersions(response.data.versions);
    } catch (error) {
      toast.error("加载版本历史失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadVersions();
    }
  }, [open, workflowId]);

  // 恢复版本
  const handleRestore = async (version: WorkflowVersion) => {
    if (version.version === currentVersion) {
      toast.info("这已经是当前版本");
      return;
    }

    if (!confirm(`确定要恢复到版本 ${version.version} 吗？当前版本将被保存为新版本。`)) {
      return;
    }

    try {
      await versionApi.restore(workflowId, version.version, `恢复到版本 ${version.version}`);
      toast.success("版本恢复成功");
      onRestore?.(version);
      setOpen(false);
    } catch (error) {
      toast.error("恢复失败，请重试");
    }
  };

  // 选择版本进行对比
  const toggleVersionSelect = (version: number) => {
    setSelectedVersions((prev) => {
      if (prev.includes(version)) {
        return prev.filter((v) => v !== version);
      }
      if (prev.length >= 2) {
        return [prev[1], version];
      }
      return [...prev, version];
    });
  };

  // 获取变更类型标签
  const getChangeTypeBadge = (type: string) => {
    const config = {
      create: { label: "创建", variant: "default" as const },
      update: { label: "更新", variant: "secondary" as const },
      restore: { label: "恢复", variant: "outline" as const },
      manual: { label: "快照", variant: "outline" as const },
    };
    const { label, variant } = config[type as keyof typeof config] || config.update;
    return <Badge variant={variant}>{label}</Badge>;
  };

  // 处理版本对比
  const handleCompare = async () => {
    if (selectedVersions.length !== 2) return;

    try {
      const v1 = Math.min(...selectedVersions);
      const v2 = Math.max(...selectedVersions);
      const response = await versionApi.compare(workflowId, v1, v2);
      const diff = response.data.diff;

      // 显示对比结果摘要
      toast.success(
        `版本对比完成: ${diff.summary.nodes_change_count} 个节点变更, ${diff.summary.edges_change_count} 个连接变更`
      );
    } catch (error) {
      toast.error("版本对比失败");
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <History className="w-4 h-4" />
          版本历史
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <History className="w-5 h-5" />
              版本历史
            </span>
            {selectedVersions.length === 2 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleCompare}
              >
                <GitCompare className="w-4 h-4 mr-2" />
                对比选中版本
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-12 text-foreground-muted">
              暂无版本历史
            </div>
          ) : (
            <div className="space-y-2 pr-4">
              {versions.map((version, index) => (
                <div
                  key={version.id}
                  className={cn(
                    "relative p-3 rounded-lg border transition-colors cursor-pointer",
                    version.version === currentVersion
                      ? "border-brand-500/40 bg-brand-200/30"
                      : "hover:bg-surface-200/60",
                    selectedVersions.includes(version.version) && "ring-2 ring-brand-500"
                  )}
                  onClick={() => toggleVersionSelect(version.version)}
                >
                  {/* 时间线连接器 */}
                  {index < versions.length - 1 && (
                    <div className="absolute left-6 top-12 w-0.5 h-[calc(100%-24px)] bg-border" />
                  )}

                  <div className="flex items-start gap-3">
                    {/* 版本号圆点 */}
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0",
                        version.version === currentVersion
                          ? "bg-brand-500 text-background"
                          : "bg-surface-200"
                      )}
                    >
                      v{version.version}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getChangeTypeBadge(version.change_type)}
                        {version.version === currentVersion && (
                          <Badge variant="default" className="bg-brand-500">
                            当前
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm truncate">
                        {version.change_log || `版本 ${version.version}`}
                      </p>

                      <div className="flex items-center gap-4 mt-2 text-xs text-foreground-muted">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(version.created_at), {
                            addSuffix: true,
                            locale: zhCN,
                          })}
                        </span>
                        <span>{version.node_count} 节点</span>
                        <span>{version.edge_count} 连线</span>
                      </div>

                      {version.creator && (
                        <div className="flex items-center gap-2 mt-2">
                          <Avatar className="w-5 h-5">
                            <AvatarImage src={version.creator.avatar_url} />
                            <AvatarFallback>
                              {version.creator.username[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-foreground-muted">
                            {version.creator.username}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 恢复按钮 */}
                    {version.version !== currentVersion && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestore(version);
                        }}
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        恢复
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
