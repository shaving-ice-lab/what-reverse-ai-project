"use client";

/**
 * 键盘快捷键指南组件
 * 展示所有可用的键盘快捷键
 */

import { useState, useEffect, useCallback } from "react";
import {
  Keyboard,
  X,
  Search,
  Plus,
  MessageSquare,
  Zap,
  Bot,
  Settings,
  Home,
  ArrowUp,
  ArrowDown,
  CornerDownLeft,
  Command,
} from "lucide-react";
import { cn } from "@/lib/utils";

// 快捷键分组
const shortcutGroups = [
  {
    name: "全局",
    shortcuts: [
      { keys: ["⌘", "K"], description: "打开命令面板", icon: Search },
      { keys: ["⌘", "N"], description: "新建对话", icon: MessageSquare },
      { keys: ["⌘", "W"], description: "新建工作流", icon: Zap },
      { keys: ["⌘", ","], description: "打开设置", icon: Settings },
      { keys: ["?"], description: "显示快捷键帮助", icon: Keyboard },
      { keys: ["Esc"], description: "关闭弹窗/面板", icon: X },
    ],
  },
  {
    name: "导航",
    shortcuts: [
      { keys: ["G", "H"], description: "返回首页", icon: Home },
      { keys: ["G", "W"], description: "工作流列表", icon: Zap },
      { keys: ["G", "A"], description: "我的 Agent", icon: Bot },
      { keys: ["G", "S"], description: "设置页面", icon: Settings },
    ],
  },
  {
    name: "对话",
    shortcuts: [
      { keys: ["Enter"], description: "发送消息", icon: CornerDownLeft },
      { keys: ["Shift", "Enter"], description: "换行", icon: CornerDownLeft },
      { keys: ["⌘", "↑"], description: "编辑上一条消息", icon: ArrowUp },
      { keys: ["/"], description: "聚焦输入框", icon: Search },
    ],
  },
  {
    name: "命令面板",
    shortcuts: [
      { keys: ["↑", "↓"], description: "选择命令", icon: ArrowDown },
      { keys: ["Enter"], description: "执行选中命令", icon: CornerDownLeft },
      { keys: ["Tab"], description: "自动补全", icon: Command },
    ],
  },
];

interface KeyboardShortcutsGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsGuide({ isOpen, onClose }: KeyboardShortcutsGuideProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // 过滤快捷键
  const filteredGroups = shortcutGroups.map((group) => ({
    ...group,
    shortcuts: group.shortcuts.filter(
      (shortcut) =>
        shortcut.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shortcut.keys.join(" ").toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((group) => group.shortcuts.length > 0);

  // ESC 关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* 快捷键面板 */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-2xl bg-card border border-border shadow-2xl z-50">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Keyboard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">键盘快捷键</h2>
              <p className="text-sm text-muted-foreground">快速访问常用功能</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 搜索框 */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索快捷键..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-lg bg-muted border-none text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20"
              autoFocus
            />
          </div>
        </div>

        {/* 快捷键列表 */}
        <div className="overflow-y-auto max-h-[calc(80vh-180px)] p-4">
          {filteredGroups.length === 0 ? (
            <div className="text-center py-8">
              <Keyboard className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">没有找到匹配的快捷键</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredGroups.map((group) => (
                <div key={group.name}>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    {group.name}
                  </h3>
                  <div className="grid gap-2">
                    {group.shortcuts.map((shortcut, index) => {
                      const Icon = shortcut.icon;
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-foreground">
                              {shortcut.description}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {shortcut.keys.map((key, idx) => (
                              <kbd
                                key={idx}
                                className="min-w-[24px] h-6 px-2 flex items-center justify-center rounded bg-card border border-border text-xs font-medium text-muted-foreground"
                              >
                                {key}
                              </kbd>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部提示 */}
        <div className="p-4 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            按 <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground">?</kbd> 键随时打开此面板
          </p>
        </div>
      </div>
    </>
  );
}

// 快捷键 Hook
export function useKeyboardShortcuts() {
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const openGuide = useCallback(() => setIsGuideOpen(true), []);
  const closeGuide = useCallback(() => setIsGuideOpen(false), []);

  // 监听 ? 键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 忽略输入框中的按键
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === "?") {
        e.preventDefault();
        setIsGuideOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return {
    isGuideOpen,
    openGuide,
    closeGuide,
  };
}
