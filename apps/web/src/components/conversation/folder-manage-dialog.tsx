"use client";

/**
 * 对话文件夹管理对话框
 * 支持创建、编辑、删除对话文件夹
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Folder, FolderPlus, Trash2, Edit2, Check, X, MessageSquare } from "lucide-react";
import { conversationFolderApi } from "@/lib/api";
import type { ConversationFolder } from "@/types/conversation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// 预设颜色
const PRESET_COLORS = [
  "#3B82F6", // blue
  "#8B5CF6", // purple
  "#EC4899", // pink
  "#F59E0B", // amber
  "#EF4444", // red
  "#10B981", // emerald
  "#06B6D4", // cyan
  "#6B7280", // gray
];

// 预设图标
const PRESET_ICONS = ["📁", "📂", "💬", "💡", "🎯", "⚡", "🔧", "📊", "🚀", "💼"];

interface FolderManageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: ConversationFolder[];
  onFoldersChange: () => void;
}

export function ConversationFolderManageDialog({
  open,
  onOpenChange,
  folders,
  onFoldersChange,
}: FolderManageDialogProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderIcon, setNewFolderIcon] = useState("📁");
  const [newFolderColor, setNewFolderColor] = useState("#3B82F6");
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 创建文件夹
  const handleCreate = async () => {
    if (!newFolderName.trim()) {
      toast.error("请输入文件夹名称");
      return;
    }

    setIsLoading(true);
    try {
      await conversationFolderApi.create({
        name: newFolderName.trim(),
        icon: newFolderIcon,
        color: newFolderColor,
      });
      toast.success("文件夹创建成功");
      setNewFolderName("");
      setNewFolderIcon("📁");
      setNewFolderColor("#3B82F6");
      setIsCreating(false);
      onFoldersChange();
    } catch (error) {
      console.error("Create folder error:", error);
      toast.error("创建失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  // 更新文件夹
  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;

    setIsLoading(true);
    try {
      await conversationFolderApi.update(id, { name: editName.trim() });
      toast.success("文件夹已更新");
      setEditingId(null);
      onFoldersChange();
    } catch (error) {
      console.error("Update folder error:", error);
      toast.error("更新失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  // 删除文件夹
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`确定要删除文件夹"${name}"吗？其中的对话将移至根目录。`)) {
      return;
    }

    setIsLoading(true);
    try {
      await conversationFolderApi.delete(id);
      toast.success("文件夹已删除");
      onFoldersChange();
    } catch (error) {
      console.error("Delete folder error:", error);
      toast.error("删除失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Folder className="w-5 h-5" />
            管理对话文件夹
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 新建文件夹 */}
          {isCreating ? (
            <div className="space-y-3 p-3 border rounded-lg bg-surface-200/30">
              <Input
                placeholder="文件夹名称"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") setIsCreating(false);
                }}
              />
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label className="text-xs text-foreground-light">图标</Label>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {PRESET_ICONS.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        className={cn(
                          "w-8 h-8 rounded hover:bg-surface-200 transition-colors text-lg",
                          newFolderIcon === icon && "bg-surface-200 ring-2 ring-brand-500"
                        )}
                        onClick={() => setNewFolderIcon(icon)}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-foreground-light">颜色</Label>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={cn(
                          "w-6 h-6 rounded-full transition-transform",
                          newFolderColor === color && "ring-2 ring-offset-2 ring-brand-500 scale-110"
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewFolderColor(color)}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsCreating(false)}
                  disabled={isLoading}
                >
                  取消
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleCreate} 
                  disabled={isLoading || !newFolderName.trim()}
                >
                  {isLoading ? "创建中..." : "创建"}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setIsCreating(true)}
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              新建文件夹
            </Button>
          )}

          {/* 文件夹列表 */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {folders.length === 0 ? (
              <div className="text-center py-8">
                <Folder className="w-12 h-12 mx-auto text-foreground-light/50 mb-2" />
                <p className="text-foreground-light">暂无文件夹</p>
                <p className="text-xs text-foreground-light">创建文件夹来整理您的对话</p>
              </div>
            ) : (
              folders.map((folder) => (
                <div
                  key={folder.id}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-200/50 group"
                >
                  <span
                    className="w-8 h-8 flex items-center justify-center rounded text-lg"
                    style={{ backgroundColor: folder.color + "20" }}
                  >
                    {folder.icon || "📁"}
                  </span>
                  
                  {editingId === folder.id ? (
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 h-8"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleUpdate(folder.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                    />
                  ) : (
                    <span className="flex-1 truncate font-medium">{folder.name}</span>
                  )}
                  
                  <span className="text-xs text-foreground-light flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {folder.conversationCount}
                  </span>

                  {editingId === folder.id ? (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleUpdate(folder.id)}
                        disabled={isLoading}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          setEditingId(folder.id);
                          setEditName(folder.name);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                        onClick={() => handleDelete(folder.id, folder.name)}
                        disabled={isLoading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            完成
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
