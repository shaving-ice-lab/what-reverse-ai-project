"use client";

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
import { Folder, FolderPlus, Trash2, Edit2, Check, X } from "lucide-react";
import { folderApi, type Folder as FolderType } from "@/lib/api/folder";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// 预设颜色
const PRESET_COLORS = [
  "hsl(var(--primary))", "#3B82F6", "#8B5CF6", "#EC4899", 
  "#F59E0B", "#EF4444", "#10B981", "#6B7280"
];

// 预设图标
const PRESET_ICONS = ["📁", "📂", "💼", "📊", "📈", "🔧", "⚡", "🎯", "💡", "🚀"];

interface FolderManageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: FolderType[];
  onFoldersChange: () => void;
}

export function FolderManageDialog({
  open,
  onOpenChange,
  folders,
  onFoldersChange,
}: FolderManageDialogProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderIcon, setNewFolderIcon] = useState("📁");
  const [newFolderColor, setNewFolderColor] = useState("primary");
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
      await folderApi.create({
        name: newFolderName.trim(),
        icon: newFolderIcon,
        color: newFolderColor,
      });
      toast.success("文件夹创建成功");
      setNewFolderName("");
      setIsCreating(false);
      onFoldersChange();
    } catch (error) {
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
      await folderApi.update(id, { name: editName.trim() });
      toast.success("文件夹已更新");
      setEditingId(null);
      onFoldersChange();
    } catch (error) {
      toast.error("更新失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  // 删除文件夹
  const handleDelete = async (id: string", name: string) => {
    if (!confirm(`确定要删除文件夹"${name}"吗？其中的工作流将移至根目录。`)) {
      return;
    }

    setIsLoading(true);
    try {
      await folderApi.delete(id);
      toast.success("文件夹已删除");
      onFoldersChange();
    } catch (error) {
      toast.error("删除失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  // 过滤掉系统文件夹
  const userFolders = folders.filter((f) => !f.is_system);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Folder className="w-5 h-5" />
            管理文件夹
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 新建文件夹 */}
          {isCreating ? (
            <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
              <Input
                placeholder="文件夹名称"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">图标</Label>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {PRESET_ICONS.map((icon) => (
                      <button
                        key={icon}
                        className={cn(
                          "w-8 h-8 rounded hover:bg-muted transition-colors",
                          newFolderIcon === icon && "bg-muted ring-2 ring-primary"
                        )}
                        onClick={() => setNewFolderIcon(icon)}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">颜色</Label>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        className={cn(
                          "w-6 h-6 rounded-full transition-transform",
                          newFolderColor === color && "ring-2 ring-offset-2 ring-primary scale-110"
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewFolderColor(color)}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsCreating(false)}>
                  取消
                </Button>
                <Button size="sm" onClick={handleCreate} disabled={isLoading}>
                  创建
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
          <div className="space-y-2">
            {userFolders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                暂无自定义文件夹
              </p>
            ) : (
              userFolders.map((folder) => (
                <div
                  key={folder.id}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 group"
                >
                  <span
                    className="w-8 h-8 flex items-center justify-center rounded"
                    style={{ backgroundColor: folder.color + "20" }}
                  >
                    {folder.icon}
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
                    <span className="flex-1 truncate">{folder.name}</span>
                  )}
                  
                  <span className="text-xs text-muted-foreground">
                    {folder.workflow_count} 个工作流
                  </span>

                  {editingId === folder.id ? (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleUpdate(folder.id)}
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
                        className="h-8 w-8 opacity-0 group-hover:opacity-100"
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
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive"
                        onClick={() => handleDelete(folder.id, folder.name)}
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
