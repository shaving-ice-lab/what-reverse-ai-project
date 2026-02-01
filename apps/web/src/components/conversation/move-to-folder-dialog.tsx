"use client";

/**
 * 移动对话到文件夹对话框
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Folder, FolderOpen, Home, MessageSquare } from "lucide-react";
import { conversationApi } from "@/lib/api";
import type { ConversationFolder } from "@/types/conversation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MoveToFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: ConversationFolder[];
  conversationIds: string[];
  currentFolderId?: string;
  onSuccess: () => void;
}

export function MoveToFolderDialog({
  open,
  onOpenChange,
  folders,
  conversationIds,
  currentFolderId,
  onSuccess,
}: MoveToFolderDialogProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
    currentFolderId || null
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleMove = async () => {
    setIsLoading(true);
    try {
      if (conversationIds.length === 1) {
        // 单个对话移动
        await conversationApi.update(conversationIds[0], {
          folderId: selectedFolderId || undefined,
        });
        toast.success("对话已移动");
      } else {
        // 批量移动
        await conversationApi.batchMove({
          ids: conversationIds,
          folderId: selectedFolderId || undefined,
        });
        toast.success(`已移动 ${conversationIds.length} 个对话`);
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Move error:", error);
      toast.error("移动失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  const isMultiple = conversationIds.length > 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            {isMultiple ? `移动 ${conversationIds.length} 个对话` : "移动对话"}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-foreground-light mb-4">
            选择目标文件夹：
          </p>
          
          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {/* 根目录选项 */}
            <button
              type="button"
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                selectedFolderId === null
                  ? "bg-primary/10 border-2 border-primary"
                  : "hover:bg-surface-200 border-2 border-transparent"
              )}
              onClick={() => setSelectedFolderId(null)}
            >
              <Home className="w-5 h-5 text-foreground-light" />
              <div className="flex-1">
                <p className="font-medium">根目录</p>
                <p className="text-xs text-foreground-light">不放入任何文件夹</p>
              </div>
            </button>

            {/* 文件夹列表 */}
            {folders.map((folder) => (
              <button
                key={folder.id}
                type="button"
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                  selectedFolderId === folder.id
                    ? "bg-primary/10 border-2 border-primary"
                    : "hover:bg-surface-200 border-2 border-transparent"
                )}
                onClick={() => setSelectedFolderId(folder.id)}
              >
                <span
                  className="w-8 h-8 flex items-center justify-center rounded text-lg"
                  style={{ backgroundColor: folder.color + "20" }}
                >
                  {folder.icon || "📁"}
                </span>
                <div className="flex-1">
                  <p className="font-medium">{folder.name}</p>
                  <p className="text-xs text-foreground-light flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {folder.conversationCount} 个对话
                  </p>
                </div>
              </button>
            ))}

            {folders.length === 0 && (
              <div className="text-center py-6">
                <Folder className="w-10 h-10 mx-auto text-foreground-light/50 mb-2" />
                <p className="text-sm text-foreground-light">暂无文件夹</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            取消
          </Button>
          <Button onClick={handleMove} disabled={isLoading}>
            {isLoading ? "移动中..." : "移动"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
