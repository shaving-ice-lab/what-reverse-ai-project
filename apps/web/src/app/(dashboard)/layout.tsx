"use client";

/**
 * Dashboard 布局 - Supabase 风格
 * 顶部导航栏 + 可展开侧边栏
 * 支持亮色/暗色主题切换
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Sparkles,
  MessageSquare,
  Zap,
  Settings,
  Plus,
  Search,
  User,
  LogOut,
  CreditCard,
  LayoutGrid,
  Store,
  Palette,
  FolderOpen,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  Bot,
  HelpCircle,
  Crown,
  Activity,
  PanelLeftClose,
  PanelLeft,
  BarChart3,
  PlugZap,
} from "lucide-react";
import { RequireAuth } from "@/components/auth/auth-guard";
import { useAuthStore } from "@/stores/useAuthStore";
import { NotificationPanel } from "@/components/dashboard/notification-panel";
import { CommandPalette, useCommandPalette } from "@/components/dashboard/command-palette";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// 主导航菜单
const mainNavItems = [
  { title: "项目概览", href: "/dashboard", icon: Activity },
  { title: "对话", href: "/conversations", icon: MessageSquare },
  { title: "工作流", href: "/workflows", icon: Zap },
  { title: "创意工坊", href: "/creative", icon: Palette },
  { title: "模板库", href: "/template-gallery", icon: LayoutGrid },
  { title: "商店", href: "/store", icon: Store },
];

// 个人菜单
const personalNavItems = [
  { title: "我的 Agent", href: "/my-agents", icon: Bot },
  { title: "我的文件", href: "/files", icon: FolderOpen },
  { title: "数据分析", href: "/analytics", icon: BarChart3 },
];

// 全宽页面（由页面自身控制布局和滚动）
const fullBleedRoutes = [
  "/dashboard",
  "/editor",
  "/chat",
  "/conversations",
  "/creative",
  "/review",
  "/workflows",
  "/my-agents",
  "/files",
  "/analytics",
];

// 模拟对话历史
const recentConversations = [
  { id: "1", title: "创建自动化邮件工作流", time: "2分钟前" },
  { id: "2", title: "Webhook 触发器配置", time: "1小时前" },
  { id: "3", title: "销售数据分析报告", time: "昨天" },
  { id: "4", title: "GitHub Issue 自动分类", time: "昨天" },
  { id: "5", title: "客户反馈情感分析", time: "3天前" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const commandPalette = useCommandPalette();

  // 等待客户端挂载以避免 hydration 问题
  useEffect(() => {
    setMounted(true);
  }, []);

  // 切换主题
  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  // 获取当前是否为暗色模式
  const isDark = mounted ? resolvedTheme === "dark" : true;

  // 判断路径是否活跃
  const isActive = (href: string) => {
    return pathname.startsWith(href);
  };

  const isFullBleed = fullBleedRoutes.some((route) => {
    return pathname === route || pathname.startsWith(`${route}/`);
  });

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        commandPalette.toggle();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        router.push("/conversations");
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        setSidebarCollapsed(!sidebarCollapsed);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, commandPalette, sidebarCollapsed]);

  // 图标按钮组件
  const IconButton = ({ 
    icon: Icon, 
    tooltip, 
    onClick, 
    href,
    active,
    badge 
  }: { 
    icon: React.ElementType; 
    tooltip: string; 
    onClick?: () => void;
    href?: string;
    active?: boolean;
    badge?: boolean;
  }) => {
    const content = (
      <button
        onClick={onClick}
        className={cn(
          "w-7 h-7 rounded-md flex items-center justify-center transition-all relative",
          active
            ? "bg-surface-200 text-foreground"
            : "text-foreground-light hover:text-foreground hover:bg-surface-100"
        )}
      >
        <Icon className="w-4 h-4" />
        {badge && (
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-brand-500" />
        )}
      </button>
    );

    const wrapped = href ? <Link href={href}>{content}</Link> : content;

    return (
      <Tooltip>
        <TooltipTrigger asChild>{wrapped}</TooltipTrigger>
        <TooltipContent side="top" sideOffset={8} className="rounded-md px-2.5 py-1.5 bg-surface-100 border border-border text-foreground">
          <p className="text-xs">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <RequireAuth>
      <TooltipProvider delayDuration={100}>
        <div className="flex flex-col h-screen overflow-hidden transition-colors duration-200 bg-background-studio text-foreground">
          {/* ===== Supabase 风格顶部导航栏 ===== */}
          <header className="h-11 shrink-0 border-b border-border bg-background-studio/95 backdrop-blur flex items-center px-4 gap-2">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
              <div className="w-6 h-6 rounded-md flex items-center justify-center bg-brand-500">
                <Sparkles className="w-3.5 h-3.5 text-background" />
              </div>
              <span className="hidden sm:inline text-[12px] font-semibold tracking-tight text-foreground">
                AgentFlow
              </span>
            </Link>

            <span className="text-foreground-muted">/</span>

            {/* 组织选择 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-2 py-0.5 rounded-md hover:bg-surface-100 transition-colors text-foreground-light hover:text-foreground">
                  <span className="text-[12px] font-medium">WhatTech</span>
                  <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-surface-200 text-foreground-muted">
                    FREE
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-foreground-muted" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52 bg-surface-100 border-border">
                <DropdownMenuItem className="text-[13px] text-foreground-light hover:text-foreground hover:bg-surface-200">
                  切换组织
                </DropdownMenuItem>
                <DropdownMenuItem className="text-[13px] text-foreground-light hover:text-foreground hover:bg-surface-200">
                  组织设置
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <span className="text-foreground-muted">/</span>

            {/* 项目名称 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-2 py-0.5 rounded-md hover:bg-surface-100 transition-colors text-foreground-light hover:text-foreground">
                  <Settings className="w-3.5 h-3.5" />
                  <span className="text-[12px] font-medium">Dashboard</span>
                  <ChevronDown className="w-3.5 h-3.5 text-foreground-muted" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52 bg-surface-100 border-border">
                <DropdownMenuItem className="text-[13px] text-foreground-light hover:text-foreground hover:bg-surface-200">
                  项目设置
                </DropdownMenuItem>
                <DropdownMenuItem className="text-[13px] text-foreground-light hover:text-foreground hover:bg-surface-200">
                  环境与部署
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <span className="px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded-full bg-warning/15 text-warning">
              PRODUCTION
            </span>

            {/* 右侧工具栏 */}
            <div className="ml-auto flex items-center gap-1.5">
              <Link href="/integrations">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-[11px] border-border text-foreground-light hover:text-foreground"
                >
                  <PlugZap className="w-3.5 h-3.5 mr-1.5" />
                  Connect
                </Button>
              </Link>

              <button
                onClick={() => commandPalette.toggle()}
                className="hidden md:flex items-center gap-2 px-3 py-1 rounded-md bg-surface-100 border border-border text-[11px] text-foreground-light hover:text-foreground hover:border-border-strong transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search...</span>
                <kbd className="ml-2 px-1.5 py-0.5 text-[10px] rounded bg-surface-200 text-foreground-muted">
                  ⌘K
                </kbd>
              </button>

              {/* 帮助 */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="w-7 h-7 rounded-md flex items-center justify-center text-foreground-light hover:text-foreground hover:bg-surface-100 transition-colors">
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-surface-100 border-border text-foreground">
                  <p className="text-xs">帮助</p>
                </TooltipContent>
              </Tooltip>

              {/* 通知 */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setShowNotifications(true)}
                    className="w-7 h-7 rounded-md flex items-center justify-center text-foreground-light hover:text-foreground hover:bg-surface-100 transition-colors relative"
                  >
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-brand-500" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-surface-100 border-border text-foreground">
                  <p className="text-xs">通知</p>
                </TooltipContent>
              </Tooltip>

              {/* 主题切换 */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleTheme}
                    className="w-7 h-7 rounded-md flex items-center justify-center text-foreground-light hover:text-foreground hover:bg-surface-100 transition-colors"
                  >
                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-surface-100 border-border text-foreground">
                  <p className="text-xs">{isDark ? "亮色模式" : "暗色模式"}</p>
                </TooltipContent>
              </Tooltip>

              {/* 用户头像 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-border hover:ring-brand-500/50 transition-all">
                    <Avatar className="w-full h-full">
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback className="bg-surface-200 text-foreground-light text-xs">
                        {user?.displayName?.charAt(0) || user?.username?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-surface-100 border-border">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-[12px] font-medium text-foreground">{user?.displayName || user?.username}</p>
                    <p className="text-[11px] text-foreground-light">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-foreground-light hover:text-foreground hover:bg-surface-200 cursor-pointer">
                        <User className="w-3.5 h-3.5" />
                        个人资料
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-foreground-light hover:text-foreground hover:bg-surface-200 cursor-pointer">
                        <Settings className="w-3.5 h-3.5" />
                        设置
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/billing" className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-foreground-light hover:text-foreground hover:bg-surface-200 cursor-pointer">
                        <CreditCard className="w-3.5 h-3.5" />
                        订阅计划
                      </Link>
                    </DropdownMenuItem>
                  </div>
                  <DropdownMenuSeparator className="bg-border" />
                  <div className="py-1">
                    <DropdownMenuItem
                      onClick={() => logout()}
                      className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-destructive-400 hover:bg-destructive-200 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      退出登录
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          
          {/* ===== 主体区域（侧边栏 + 内容） ===== */}
          <div className="flex flex-1 overflow-hidden">
            {/* 侧边栏 */}
            <aside
              data-collapsed={sidebarCollapsed}
              className={cn(
                "flex flex-col transition-all duration-300 ease-out relative shrink-0 bg-background-studio border-r border-border overflow-hidden",
                sidebarCollapsed ? "w-[52px]" : "w-[188px]"
              )}
            >
              <div className="relative z-10 flex h-full flex-col">
                {/* 新建按钮 */}
                <div className={cn("shrink-0", sidebarCollapsed ? "px-1.5 pt-3 pb-2" : "px-2 pt-3 pb-2")}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href="/conversations">
                        <button
                          className={cn(
                            "w-full flex items-center gap-2 rounded-md text-[12px] font-medium transition-colors",
                            sidebarCollapsed ? "h-8 justify-center" : "h-8 px-2",
                            "text-foreground-light hover:text-foreground hover:bg-surface-100/60"
                          )}
                        >
                          {sidebarCollapsed && <Plus className="w-4 h-4" strokeWidth={2.5} />}
                          {!sidebarCollapsed && <span>新建对话</span>}
                        </button>
                      </Link>
                    </TooltipTrigger>
                    {sidebarCollapsed && (
                      <TooltipContent side="right" sideOffset={8} className="rounded-md px-2.5 py-1.5 bg-surface-100 border border-border text-foreground">
                        <p className="text-xs">新建对话</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </div>

              {/* 可滚动的导航区域 */}
              <div
                className={cn(
                  "flex-1 overflow-y-auto overflow-x-hidden min-h-0 scrollbar-thin",
                  sidebarCollapsed ? "px-1.5" : "px-2"
                )}
              >
                {/* 主导航 */}
                <div className="py-1">
                  <nav className="space-y-0">
                    {mainNavItems.map((item) => {
                      const active = isActive(item.href);
                      return sidebarCollapsed ? (
                        <Tooltip key={item.href}>
                          <TooltipTrigger asChild>
                            <Link href={item.href}>
                              <button
                                className={cn(
                                  "w-full h-8 rounded-md flex items-center justify-center transition-colors",
                                  active
                                    ? "bg-surface-100/70 text-foreground"
                                    : "text-foreground-muted hover:text-foreground hover:bg-surface-100/60"
                                )}
                              >
                                <item.icon className="w-4 h-4" />
                              </button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent side="right" sideOffset={8} className="rounded-md px-2.5 py-1.5 bg-surface-100 border border-border text-foreground">
                            <p className="text-xs">{item.title}</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Link key={item.href} href={item.href}>
                          <button
                            className={cn(
                              "w-full h-8 rounded-md flex items-center px-2 transition-colors text-[12px] font-medium",
                              active
                                ? "bg-surface-100/70 text-foreground"
                                : "text-foreground-light hover:text-foreground hover:bg-surface-100/60"
                            )}
                          >
                            <span className="truncate">{item.title}</span>
                          </button>
                        </Link>
                      );
                    })}
                  </nav>
                </div>

                {/* 个人菜单 */}
                <div className="py-1">
                  <nav className="space-y-0">
                    {personalNavItems.map((item) => {
                      const active = isActive(item.href);
                      return sidebarCollapsed ? (
                        <Tooltip key={item.href}>
                          <TooltipTrigger asChild>
                            <Link href={item.href}>
                              <button
                                className={cn(
                                  "w-full h-8 rounded-md flex items-center justify-center transition-colors",
                                  active
                                    ? "bg-surface-100/70 text-foreground"
                                    : "text-foreground-muted hover:text-foreground hover:bg-surface-100/60"
                                )}
                              >
                                <item.icon className="w-4 h-4" />
                              </button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent side="right" sideOffset={8} className="rounded-md px-2.5 py-1.5 bg-surface-100 border border-border text-foreground">
                            <p className="text-xs">{item.title}</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Link key={item.href} href={item.href}>
                          <button
                            className={cn(
                              "w-full h-8 rounded-md flex items-center px-2 transition-colors text-[12px] font-medium",
                              active
                                ? "bg-surface-100/70 text-foreground"
                                : "text-foreground-light hover:text-foreground hover:bg-surface-100/60"
                            )}
                          >
                            <span className="truncate">{item.title}</span>
                          </button>
                        </Link>
                      );
                    })}
                  </nav>
                </div>

                {/* 对话历史 */}
                {!sidebarCollapsed && (
                  <>
                    <div className="my-1.5 h-px bg-border" />
                    <div>
                      <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium text-foreground-muted transition-colors w-full hover:text-foreground"
                      >
                        <ChevronDown
                          className={cn("w-3 h-3 transition-transform", !showHistory && "-rotate-90")}
                        />
                        最近对话
                      </button>

                      {showHistory && (
                        <div className="py-1 space-y-0.5">
                          {recentConversations.map((conv) => (
                            <button
                              key={conv.id}
                              onClick={() => setActiveConversation(conv.id)}
                              className={cn(
                                "w-full text-left px-2 py-1.5 rounded-md text-[11px] transition-colors relative",
                                activeConversation === conv.id
                                  ? "bg-surface-100/70 text-foreground"
                                  : "text-foreground-muted hover:bg-surface-100/60 hover:text-foreground"
                              )}
                            >
                              {activeConversation === conv.id && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-3 rounded-r-full bg-brand-500" />
                              )}
                              <p className="truncate leading-snug">{conv.title}</p>
                              <p className="text-[10px] mt-0.5 text-foreground-muted">{conv.time}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* 底部区域 */}
              <div className="mt-auto shrink-0">
                {!sidebarCollapsed && (
                  <div className="px-2 py-2">
                    <div className="p-2.5 rounded-md bg-surface-100 border border-border">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Crown className="w-3.5 h-3.5 text-brand-500" />
                          <span className="text-[11px] font-medium text-foreground-light">免费版</span>
                        </div>
                        <Link href="/billing" className="text-[10px] text-brand-500 hover:underline">
                          升级
                        </Link>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden bg-surface-300">
                        <div className="h-full rounded-full bg-brand-500" style={{ width: "85%" }} />
                      </div>
                      <div className="flex items-center justify-between text-[10px] mt-1 text-foreground-muted">
                        <span>850 / 1000 Credits</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="h-px mx-2 my-2 bg-border" />

                <div className={cn("py-2", sidebarCollapsed ? "px-1.5" : "px-2")}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className={cn(
                          "w-full h-8 rounded-md flex items-center transition-colors text-[12px] font-medium",
                          sidebarCollapsed ? "justify-center" : "gap-2 px-2",
                          "text-foreground-muted hover:text-foreground hover:bg-surface-100/60"
                        )}
                      >
                        {sidebarCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
                        {!sidebarCollapsed && <span className="truncate text-[12px] font-medium">收起侧边栏</span>}
                      </button>
                    </TooltipTrigger>
                    {sidebarCollapsed && (
                      <TooltipContent side="right" className="bg-surface-100 border-border">
                        <p className="text-xs">展开侧边栏</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </div>
              </div>
              </div>
            </aside>

          {/* 主内容区域 */}
          <main className="flex-1 overflow-hidden bg-background-studio">
            <div
              className="dashboard-shell"
              data-layout={isFullBleed ? "full" : "standard"}
            >
              <div className="dashboard-content">
                <div className="dashboard-page">{children}</div>
              </div>
            </div>
          </main>
        </div>

        {/* 通知面板 */}
        <NotificationPanel
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
        />

        {/* 命令面板 */}
        <CommandPalette
          isOpen={commandPalette.isOpen}
          onClose={commandPalette.close}
        />
      </div>
    </TooltipProvider>
  </RequireAuth>
  );
}
