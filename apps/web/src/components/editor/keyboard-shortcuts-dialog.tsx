"use client";

/**
 * 快捷键帮助对话框 - 极简风格
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Keyboard,
  Save,
  Undo2,
  Redo2,
  Copy,
  ClipboardPaste,
  Trash2,
  MousePointer2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid3X3,
  Search,
} from "lucide-react";

interface ShortcutItem {
  keys: string[];
  description: string;
  icon?: React.ReactNode;
}

interface ShortcutGroup {
  title: string;
  shortcuts: ShortcutItem[];
}

const isMac = typeof window !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
const cmdKey = isMac ? "⌘" : "Ctrl";

const shortcutGroups: ShortcutGroup[] = [
  {
    title: "文件操作",
    shortcuts: [
      { keys: [cmdKey, "S"], description: "保存工作流", icon: <Save className="h-4 w-4" /> },
      { keys: [cmdKey, "Shift", "S"], description: "另存为", icon: <Save className="h-4 w-4" /> },
    ],
  },
  {
    title: "编辑操作",
    shortcuts: [
      { keys: [cmdKey, "Z"], description: "撤销", icon: <Undo2 className="h-4 w-4" /> },
      { keys: [cmdKey, "Shift", "Z"], description: "重做", icon: <Redo2 className="h-4 w-4" /> },
      { keys: [cmdKey, "C"], description: "复制选中节点", icon: <Copy className="h-4 w-4" /> },
      { keys: [cmdKey, "V"], description: "粘贴节点", icon: <ClipboardPaste className="h-4 w-4" /> },
      { keys: [cmdKey, "D"], description: "复制并粘贴", icon: <Copy className="h-4 w-4" /> },
      { keys: ["Delete"], description: "删除选中节点", icon: <Trash2 className="h-4 w-4" /> },
      { keys: [cmdKey, "A"], description: "全选节点", icon: <MousePointer2 className="h-4 w-4" /> },
    ],
  },
  {
    title: "视图控制",
    shortcuts: [
      { keys: [cmdKey, "+"], description: "放大", icon: <ZoomIn className="h-4 w-4" /> },
      { keys: [cmdKey, "-"], description: "缩小", icon: <ZoomOut className="h-4 w-4" /> },
      { keys: [cmdKey, "0"], description: "重置缩放", icon: <Maximize2 className="h-4 w-4" /> },
      { keys: [cmdKey, "1"], description: "适应画布", icon: <Maximize2 className="h-4 w-4" /> },
      { keys: [cmdKey, "G"], description: "切换网格", icon: <Grid3X3 className="h-4 w-4" /> },
    ],
  },
  {
    title: "节点操作",
    shortcuts: [
      { keys: [cmdKey, "F"], description: "搜索节点", icon: <Search className="h-4 w-4" /> },
      { keys: ["Enter"], description: "编辑选中节点", icon: <MousePointer2 className="h-4 w-4" /> },
      { keys: ["Escape"], description: "取消选择 / 关闭面板", icon: <MousePointer2 className="h-4 w-4" /> },
      { keys: ["Tab"], description: "切换到下一个节点", icon: <MousePointer2 className="h-4 w-4" /> },
    ],
  },
  {
    title: "画布导航",
    shortcuts: [
      { keys: ["Space", "拖动"], description: "平移画布", icon: <MousePointer2 className="h-4 w-4" /> },
      { keys: ["滚轮"], description: "上下滚动", icon: <MousePointer2 className="h-4 w-4" /> },
      { keys: [cmdKey, "滚轮"], description: "缩放画布", icon: <ZoomIn className="h-4 w-4" /> },
      { keys: ["Shift", "滚轮"], description: "左右滚动", icon: <MousePointer2 className="h-4 w-4" /> },
    ],
  },
];

function KeyBadge({ children }: { children: React.ReactNode }) {
  return (
    <kbd className={cn(
      "inline-flex items-center justify-center min-w-[24px] h-6 px-1.5",
      "text-xs font-mono font-medium",
      "bg-surface-200 border border-border",
      "rounded-md"
    )}>
      {children}
    </kbd>
  );
}

function ShortcutRow({ shortcut }: { shortcut: ShortcutItem }) {
  return (
    <div className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-surface-200">
      <div className="flex items-center gap-2">
        {shortcut.icon && (
          <span className="flex items-center justify-center w-6 h-6 rounded text-foreground-muted">
            {shortcut.icon}
          </span>
        )}
        <span className="text-sm">{shortcut.description}</span>
      </div>
      <div className="flex items-center gap-1">
        {shortcut.keys.map((key, index) => (
          <span key={index} className="flex items-center">
            <KeyBadge>{key}</KeyBadge>
            {index < shortcut.keys.length - 1 && (
              <span className="mx-0.5 text-foreground-muted text-xs">+</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-200">
              <Keyboard className="h-4 w-4" />
            </div>
            快捷键帮助
          </DialogTitle>
          <DialogDescription>
            使用快捷键可以更高效地操作编辑器
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4">
            {shortcutGroups.map((group) => (
              <div key={group.title} className="p-3 rounded-lg border border-border">
                <h3 className="text-xs font-medium text-foreground-muted uppercase tracking-wider mb-2 px-2">
                  {group.title}
                </h3>
                <div className="space-y-0.5">
                  {group.shortcuts.map((shortcut, index) => (
                    <ShortcutRow key={index} shortcut={shortcut} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="pt-3 border-t border-border text-center">
          <p className="text-xs text-foreground-muted flex items-center justify-center gap-1">
            按 <KeyBadge>?</KeyBadge> 或 <KeyBadge>{cmdKey}</KeyBadge> <span>+</span> <KeyBadge>/</KeyBadge> 打开此帮助
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function useKeyboardShortcutsDialog() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "?" || ((e.metaKey || e.ctrlKey) && e.key === "/")) {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return {
    isOpen,
    setIsOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  };
}
