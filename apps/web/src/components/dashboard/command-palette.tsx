"use client";

/**
 * 全局命令面板 - Manus 风格

 * 支持快捷搜索、命令执行、导航跳转
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Search,

  X,

  Zap,

  MessageSquare,

  Settings,

  FileText,

  Users,

  Store,

  Palette,

  LayoutGrid,

  HelpCircle,

  Plus,

  ArrowRight,

  Command,

  Clock,

  Star,

  Folder,

  Bot,

  Code,

  Image as ImageIcon,

  Terminal,

  Mail,

  Github,

  Database,

  Globe,

  ChevronRight,

  Sparkles,

  History,

  Bookmark,

  Hash,
} from "lucide-react";

// 命令类型

type CommandType = "navigation" | "action" | "recent" | "workflow" | "agent";

interface CommandItem {
  id: string;

  type: CommandType;

  title: string;

  description?: string;

  icon: React.ElementType;

  shortcut?: string;

  href?: string;

  action?: () => void;

  keywords?: string[];
}

// 命令分组

const commandGroups: { title: string; items: CommandItem[] }[] = [

  {
    title: "快捷操作",

    items: [

      {
        id: "new-conversation",

        type: "action",

        title: "新建对话",

        description: "开始一个新的 AI 对话",

        icon: MessageSquare,

        shortcut: "⌘N",

        href: "/",

      },

      {
        id: "new-workflow",

        type: "action",

        title: "创建工作流",

        description: "创建新的自动化工作流",

        icon: Zap,

        shortcut: "⌘W",

        href: "/workflows/new",

      },

      {
        id: "new-agent",

        type: "action",

        title: "创建 Agent",

        description: "创建自定义 AI Agent",

        icon: Bot,

        href: "/my-agents/new",

      },

      {
        id: "generate-code",

        type: "action",

        title: "生成代码",

        description: "使用 AI 生成代码",

        icon: Code,

        shortcut: "⌘K",

      },

      {
        id: "generate-image",

        type: "action",

        title: "生成图像",

        description: "使用 AI 生成图像",

        icon: ImageIcon,

        shortcut: "⌘I",

      },

    ],

  },

  {
    title: "导航",

    items: [

      {
        id: "nav-workflows",

        type: "navigation",

        title: "工作流列表",

        icon: Zap,

        href: "/workflows",

        keywords: ["workflow", "automation", "自动化"],

      },

      {
        id: "nav-creative",

        type: "navigation",

        title: "创意工坊",

        icon: Palette,

        href: "/creative",

        keywords: ["creative", "design", "创意", "设计"],

      },

      {
        id: "nav-templates",

        type: "navigation",

        title: "模板库",

        icon: LayoutGrid,

        href: "/template-gallery",

        keywords: ["template", "模板"],

      },

      {
        id: "nav-store",

        type: "navigation",

        title: "应用商店",

        icon: Store,

        href: "/store",

        keywords: ["store", "app", "应用", "商店"],

      },

      {
        id: "nav-agents",

        type: "navigation",

        title: "我的 Agent",

        icon: Users,

        href: "/my-agents",

        keywords: ["agent", "bot"],

      },

      {
        id: "nav-settings",

        type: "navigation",

        title: "设置",

        icon: Settings,

        href: "/settings",

        keywords: ["settings", "设置", "配置"],

      },

      {
        id: "nav-docs",

        type: "navigation",

        title: "文档",

        icon: FileText,

        href: "/docs",

        keywords: ["docs", "documentation", "文档", "帮助"],

      },

    ],

  },

  {
    title: "最近使用",

    items: [

      {
        id: "recent-1",

        type: "recent",

        title: "客户反馈自动处理",

        description: "工作流  编辑于 2 小时前",

        icon: Zap,

        href: "/workflows/wf-1",

      },

      {
        id: "recent-2",

        type: "recent",

        title: "邮件助手 Agent",

        description: "Agent  编辑于 昨天",

        icon: Bot,

        href: "/my-agents/agent-1",

      },

      {
        id: "recent-3",

        type: "recent",

        title: "数据分析报告",

        description: "对话  3 天前",

        icon: MessageSquare,

        href: "/",

      },

    ],

  },

];

interface CommandPaletteProps {
  isOpen: boolean;

  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();

  const [query, setQuery] = useState("");

  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  const listRef = useRef<HTMLDivElement>(null);

  // 过滤命令

  const filteredGroups = commandGroups

    .map((group) => ({
      ...group,

      items: group.items.filter((item) => {
        const searchLower = query.toLowerCase();

        return (
          item.title.toLowerCase().includes(searchLower) ||

          item.description?.toLowerCase().includes(searchLower) ||

          item.keywords?.some((k) => k.toLowerCase().includes(searchLower))

        );

      }),

    }))

    .filter((group) => group.items.length > 0);

  // 扁平化的命令列表

  const flatItems = filteredGroups.flatMap((group) => group.items);

  // 执行命令

  const executeCommand = useCallback(
    (item: CommandItem) => {
      if (item.action) {
        item.action();

      } else if (item.href) {
        router.push(item.href);

      }

      onClose();

    },

    [router, onClose]

  );

  // 键盘导航

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":

          e.preventDefault();

          setSelectedIndex((prev) =>

            prev < flatItems.length - 1 ? prev + 1 : 0

          );

          break;

        case "ArrowUp":

          e.preventDefault();

          setSelectedIndex((prev) =>

            prev > 0 ? prev - 1 : flatItems.length - 1

          );

          break;

        case "Enter":

          e.preventDefault();

          if (flatItems[selectedIndex]) {
            executeCommand(flatItems[selectedIndex]);

          }

          break;

        case "Escape":

          e.preventDefault();

          onClose();

          break;

      }

    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);

  }, [isOpen, selectedIndex, flatItems, executeCommand, onClose]);

  // 重置选中状态

  useEffect(() => {
    setSelectedIndex(0);

  }, [query]);

  // 自动聚焦

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();

      setQuery("");

      setSelectedIndex(0);

    }

  }, [isOpen]);

  // 滚动到选中项

  useEffect(() => {
    if (listRef.current && flatItems[selectedIndex]) {
      const item = listRef.current.querySelector(
        `[data-index="${selectedIndex}"]`

      );

      item?.scrollIntoView({ block: "nearest" });

    }

  }, [selectedIndex, flatItems]);

  if (!isOpen) return null;

  // 计算扁平索引

  let flatIndex = -1;

  return (
    <>

      {/* 背景遮罩 */}

      <div

        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"

        onClick={onClose}

      />

      {/* 命令面板 */}

      <div className="fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-[600px] bg-card border border-border rounded-2xl shadow-2xl shadow-black/50 z-50 overflow-hidden animate-in zoom-in-95 fade-in duration-150">

        {/* 搜索输入框 */}

        <div className="flex items-center gap-3 p-4 border-b border-border">

          <Search className="w-5 h-5 text-foreground-light" />

          <input

            ref={inputRef}

            type="text"

            value={query}

            onChange={(e) => setQuery(e.target.value)}

            placeholder="搜索命令、页面或功能..."

            className="flex-1 bg-transparent text-foreground text-sm placeholder:text-foreground-light focus:outline-none"

          />

          {query && (
            <button

              onClick={() => setQuery("")}

              className="p-1 rounded-lg hover:bg-surface-200 text-foreground-light hover:text-foreground/70 transition-colors"

            >

              <X className="w-4 h-4" />

            </button>

          )}

          <kbd className="px-2 py-1 text-[10px] font-mono rounded bg-surface-200 text-foreground-light">

            ESC

          </kbd>

        </div>

        {/* 命令列表 */}

        <div

          ref={listRef}

          className="max-h-[400px] overflow-y-auto py-2"

        >

          {filteredGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">

              <Search className="w-10 h-10 text-foreground-light/30 mb-3" />

              <p className="text-sm text-foreground-light">未找到相关命令</p>

              <p className="text-xs text-foreground-light/70 mt-1">尝试其他关键词</p>

            </div>

          ) : (
            filteredGroups.map((group) => (
              <div key={group.title} className="mb-2">

                <div className="px-4 py-2 text-[11px] font-medium text-foreground-light uppercase tracking-wider">

                  {group.title}

                </div>

                {group.items.map((item) => {
                  flatIndex++;

                  const currentIndex = flatIndex;

                  const isSelected = selectedIndex === currentIndex;

                  return (
                    <button

                      key={item.id}

                      data-index={currentIndex}

                      onClick={() => executeCommand(item)}

                      onMouseEnter={() => setSelectedIndex(currentIndex)}

                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 transition-all",

                        isSelected

                          ? "bg-surface-200"

                          : "hover:bg-muted/50"

                      )}

                    >

                      {/* 图标 */}

                      <div

                        className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors",

                          isSelected

                            ? "bg-primary/20 text-primary"

                            : "bg-surface-200 text-foreground-light"

                        )}

                      >

                        <item.icon className="w-4 h-4" />

                      </div>

                      {/* 内容 */}

                      <div className="flex-1 min-w-0 text-left">

                        <p

                          className={cn(
                            "text-sm font-medium truncate",

                            isSelected ? "text-foreground" : "text-foreground/80"

                          )}

                        >

                          {item.title}

                        </p>

                        {item.description && (
                          <p className="text-xs text-foreground-light truncate mt-0.5">

                            {item.description}

                          </p>

                        )}

                      </div>

                      {/* 快捷键 */}

                      {item.shortcut && (
                        <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-surface-200 text-foreground-light">

                          {item.shortcut}

                        </kbd>

                      )}

                      {/* 箭头 */}

                      <ChevronRight

                        className={cn(
                          "w-4 h-4 shrink-0 transition-all",

                          isSelected

                            ? "text-foreground/70 translate-x-0.5"

                            : "text-foreground-light/50"

                        )}

                      />

                    </button>

                  );

                })}

              </div>

            ))

          )}

        </div>

        {/* 底部提示 */}

        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">

          <div className="flex items-center gap-4 text-[11px] text-foreground-light">

            <span className="flex items-center gap-1">

              <kbd className="px-1 py-0.5 rounded bg-surface-200">↑</kbd>

              <kbd className="px-1 py-0.5 rounded bg-surface-200">↓</kbd>

              导航

            </span>

            <span className="flex items-center gap-1">

              <kbd className="px-1.5 py-0.5 rounded bg-surface-200">↵</kbd>

              执行

            </span>

          </div>

          <div className="flex items-center gap-2 text-[11px] text-foreground-light">

            <Sparkles className="w-3 h-3 text-primary" />

            <span>AgentFlow</span>

          </div>

        </div>

      </div>

    </>

  );
}

// 快捷键钩子

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();

        setIsOpen((prev) => !prev);

      }

    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);

  }, []);

  return {
    isOpen,

    open: () => setIsOpen(true),

    close: () => setIsOpen(false),

    toggle: () => setIsOpen((prev) => !prev),

  };
}

