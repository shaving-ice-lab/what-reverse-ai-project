"use client";

/**
 * 快捷键指南页面 - Supabase 风格
 * 显示所有可用的键盘快捷键
 */

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React, { useState } from "react";
import { PageContainer, PageHeader } from "@/components/dashboard/page-layout";
import {
  Keyboard,
  Search,
  MessageSquare,
  Zap,
  FileText,
  Settings,
  Navigation,
  Edit3,
  Eye,
  Command,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  CornerDownLeft,
  Delete,
} from "lucide-react";

// 快捷键分类
const shortcutCategories = [
  {
    title: "全局快捷键",
    icon: Command,
    shortcuts: [
      { keys: ["⌘", "K"], description: "打开命令面板/搜索", action: "search" },
      { keys: ["⌘", "N"], description: "新建对话", action: "new-chat" },
      { keys: ["⌘", "⇧", "N"], description: "新建工作流", action: "new-workflow" },
      { keys: ["⌘", ","], description: "打开设置", action: "settings" },
      { keys: ["⌘", "/"], description: "显示快捷键帮助", action: "shortcuts" },
      { keys: ["Esc"], description: "关闭弹窗/取消操作", action: "escape" },
    ],
  },
  {
    title: "对话操作",
    icon: MessageSquare,
    shortcuts: [
      { keys: ["/"], description: "聚焦到输入框", action: "focus-input" },
      { keys: ["⌘", "↵"], description: "发送消息", action: "send" },
      { keys: ["⇧", "↵"], description: "换行（不发送）", action: "newline" },
      { keys: ["↑"], description: "编辑上一条消息", action: "edit-last" },
      { keys: ["⌘", "C"], description: "复制选中内容/消息", action: "copy" },
      { keys: ["⌘", "⇧", "C"], description: "复制代码块", action: "copy-code" },
    ],
  },
  {
    title: "导航",
    icon: Navigation,
    shortcuts: [
      { keys: ["⌘", "1"], description: "切换到对话页面", action: "nav-chat" },
      { keys: ["⌘", "2"], description: "切换到工作流页面", action: "nav-workflow" },
      { keys: ["⌘", "3"], description: "切换到创意工坊", action: "nav-creative" },
      { keys: ["⌘", "4"], description: "切换到模板库", action: "nav-templates" },
      { keys: ["⌘", "["], description: "返回上一页", action: "back" },
      { keys: ["⌘", "]"], description: "前进到下一页", action: "forward" },
    ],
  },
  {
    title: "工作流编辑",
    icon: Zap,
    shortcuts: [
      { keys: ["⌘", "S"], description: "保存工作流", action: "save" },
      { keys: ["⌘", "Z"], description: "撤销", action: "undo" },
      { keys: ["⌘", "⇧", "Z"], description: "重做", action: "redo" },
      { keys: ["⌘", "D"], description: "复制选中节点", action: "duplicate" },
      { keys: ["Delete"], description: "删除选中节点", action: "delete" },
      { keys: ["⌘", "A"], description: "全选节点", action: "select-all" },
      { keys: ["+"], description: "放大画布", action: "zoom-in" },
      { keys: ["-"], description: "缩小画布", action: "zoom-out" },
      { keys: ["0"], description: "重置缩放", action: "zoom-reset" },
    ],
  },
  {
    title: "编辑器操作",
    icon: Edit3,
    shortcuts: [
      { keys: ["⌘", "B"], description: "粗体", action: "bold" },
      { keys: ["⌘", "I"], description: "斜体", action: "italic" },
      { keys: ["⌘", "U"], description: "下划线", action: "underline" },
      { keys: ["⌘", "⇧", "K"], description: "插入代码块", action: "code-block" },
      { keys: ["⌘", "⇧", "L"], description: "插入链接", action: "link" },
      { keys: ["Tab"], description: "增加缩进", action: "indent" },
      { keys: ["⇧", "Tab"], description: "减少缩进", action: "outdent" },
    ],
  },
  {
    title: "查看与显示",
    icon: Eye,
    shortcuts: [
      { keys: ["⌘", "\\"], description: "切换侧边栏", action: "toggle-sidebar" },
      { keys: ["⌘", "⇧", "F"], description: "全屏模式", action: "fullscreen" },
      { keys: ["⌘", "⇧", "D"], description: "切换暗色模式", action: "dark-mode" },
      { keys: ["⌘", "+"], description: "放大界面", action: "ui-zoom-in" },
      { keys: ["⌘", "-"], description: "缩小界面", action: "ui-zoom-out" },
    ],
  },
];

// 快捷键样式组件
function KeyCap({ children, isSpecial = false }: { children: React.ReactNode; isSpecial?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-md text-xs font-medium",
        "bg-surface-200 border border-border",
        isSpecial ? "text-foreground-muted" : "text-foreground"
      )}
    >
      {children}
    </span>
  );
}

export default function ShortcutsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMac] = useState(true); // 实际应检测用户系统

  // 筛选快捷键
  const filteredCategories = shortcutCategories
    .map((category) => ({
      ...category,
      shortcuts: category.shortcuts.filter(
        (shortcut) =>
          shortcut.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          shortcut.keys.join("").toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((category) => category.shortcuts.length > 0);

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="快捷键指南"
          description="使用键盘快捷键提高工作效率"
        >
          <div className="flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
            <span className="inline-flex items-center gap-1.5">
              <Keyboard className="w-3.5 h-3.5" />
              适用于 {isMac ? "macOS" : "Windows/Linux"}
            </span>
          </div>
        </PageHeader>

        <div className="page-divider" />

        <div className="page-panel">
          <div className="page-panel-header">
            <div>
              <p className="page-panel-title">搜索快捷键</p>
              <p className="page-panel-description">按名称或组合键筛选快捷键</p>
            </div>
          </div>
          <div className="px-6 pb-6">
            <Input
              variant="search"
              placeholder="搜索快捷键..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
              className="max-w-md"
            />
          </div>
        </div>
        {/* 系统提示 */}
        <div className="page-panel p-4">
          <p className="text-[13px] text-foreground-light">
            <span className="font-medium text-foreground">提示：</span> 
            以下快捷键适用于 {isMac ? "macOS" : "Windows/Linux"} 系统。
            {isMac ? " ⌘ 表示 Command 键，⇧ 表示 Shift 键。" : " Ctrl 键替代 ⌘，其他键位相同。"}
          </p>
        </div>

        {/* 快捷键列表 */}
        {filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-14 h-14 rounded-md bg-surface-200 flex items-center justify-center mb-4">
              <Keyboard className="w-6 h-6 text-foreground-muted" />
            </div>
            <h3 className="text-base font-medium text-foreground mb-2">没有找到相关快捷键</h3>
            <p className="text-[13px] text-foreground-light">尝试其他关键词</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredCategories.map((category) => {
              const Icon = category.icon;
              return (
                <div key={category.title} className="page-panel overflow-hidden">
                  <div className="page-panel-header flex items-center gap-2">
                    <Icon className="w-4 h-4 text-brand-500" />
                    <span className="page-panel-title">{category.title}</span>
                  </div>

                  <div className="p-4">
                    <div className="rounded-md bg-surface-100 border border-border overflow-hidden">
                      <table className="w-full">
                        <tbody>
                          {category.shortcuts.map((shortcut, index) => (
                            <tr
                              key={shortcut.action}
                              className={cn(
                                "hover:bg-surface-75 transition-colors",
                                index !== category.shortcuts.length - 1 && "border-b border-border-muted"
                              )}
                            >
                              <td className="px-4 py-3 w-48">
                                <div className="flex items-center gap-1">
                                  {shortcut.keys.map((key, idx) => (
                                    <span key={idx} className="flex items-center">
                                      {idx > 0 && <span className="text-foreground-muted mx-0.5">+</span>}
                                      <KeyCap isSpecial={["⌘", "⇧", "Ctrl", "Alt", "Esc"].includes(key)}>
                                        {key === "↵" ? <CornerDownLeft className="w-3.5 h-3.5" /> :
                                         key === "↑" ? <ArrowUp className="w-3.5 h-3.5" /> :
                                         key === "↓" ? <ArrowDown className="w-3.5 h-3.5" /> :
                                         key === "←" ? <ArrowLeft className="w-3.5 h-3.5" /> :
                                         key === "→" ? <ArrowRight className="w-3.5 h-3.5" /> :
                                         key === "Delete" ? <Delete className="w-3.5 h-3.5" /> :
                                         key}
                                      </KeyCap>
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-[13px] text-foreground-light">
                                {shortcut.description}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 自定义快捷键提示 */}
        <div className="page-panel border-brand-400/30 bg-brand-200/20 text-center">
          <div className="p-5">
            <h3 className="text-sm font-medium text-foreground mb-2">自定义快捷键</h3>
            <p className="text-[13px] text-foreground-light mb-4">
              您可以在设置中自定义快捷键以适应您的使用习惯
            </p>
            <Button
              variant="outline"
              size="sm"
              className="border-border-muted text-foreground-light hover:text-foreground hover:border-border"
            >
              <Settings className="w-4 h-4 mr-2" />
              打开快捷键设置
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
