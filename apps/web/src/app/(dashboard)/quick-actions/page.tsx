"use client";

/**
 * 快捷操作中心页面 - Supabase 风格
 * 常用操作和快捷入口
 */

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/page-layout";
import {
  ArrowRight,
  Bell,
  Bot,
  ChevronRight,
  Code,
  Command,
  ExternalLink,
  FileText,
  FolderOpen,
  History,
  MessageSquare,
  Palette,
  Plus,
  Search,
  Settings,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
  Upload,
  Users,
  Zap,
} from "lucide-react";

const actionFilters = [
  { id: "all", label: "全部" },
  { id: "create", label: "创建" },
  { id: "generate", label: "生成" },
  { id: "manage", label: "管理" },
  { id: "settings", label: "设置" },
];

const featuredActions = [
  {
    title: "新建对话",
    description: "立即开始一个新的对话",
    icon: MessageSquare,
    href: "/conversations",
    badge: "快捷",
    badgeVariant: "secondary",
    iconBg: "bg-brand-200/60",
    iconColor: "text-brand-500",
  },
  {
    title: "创建工作流",
    description: "用模板快速搭建自动化",
    icon: Zap,
    href: "/workflows/new",
    badge: "推荐",
    badgeVariant: "primary",
    iconBg: "bg-brand-200/60",
    iconColor: "text-brand-500",
  },
  {
    title: "生成内容",
    description: "文本、图像与代码生成",
    icon: Sparkles,
    href: "/creative/generate",
    badge: "AI",
    badgeVariant: "primary",
    iconBg: "bg-surface-200",
    iconColor: "text-foreground",
  },
  {
    title: "上传文件",
    description: "整理素材与知识库",
    icon: Upload,
    href: "/files",
    badge: "常用",
    badgeVariant: "secondary",
    iconBg: "bg-surface-200",
    iconColor: "text-foreground",
  },
];

const quickStats = [
  {
    label: "今日对话",
    value: "12",
    icon: MessageSquare,
    trend: "+5",
    hint: "较昨日",
    trendVariant: "primary",
  },
  {
    label: "工作流执行",
    value: "48",
    icon: Zap,
    trend: "+12",
    hint: "较昨日",
    trendVariant: "primary",
  },
  {
    label: "Agent 调用",
    value: "156",
    icon: Bot,
    trend: "+23",
    hint: "本周",
    trendVariant: "primary",
  },
  {
    label: "文件上传",
    value: "8",
    icon: Upload,
    trend: "+2",
    hint: "本周",
    trendVariant: "secondary",
  },
];

const quickActionCategories = [
  {
    id: "create",
    title: "创建",
    description: "从零开始构建新的工作流与内容",
    icon: Plus,
    color: "text-brand-500",
    bgColor: "bg-brand-200/60",
    actions: [
      {
        title: "新建对话",
        description: "开始新的 AI 对话",
        icon: MessageSquare,
        href: "/conversations",
        shortcut: "⌘ N",
        badge: "快捷",
        badgeVariant: "primary",
      },
      {
        title: "新建工作流",
        description: "创建自动化工作流",
        icon: Zap,
        href: "/workflows/new",
        shortcut: "⌘ W",
      },
      {
        title: "新建 Agent",
        description: "创建自定义 AI 助手",
        icon: Bot,
        href: "/my-agents/new",
        badge: "Beta",
        badgeVariant: "secondary",
      },
      {
        title: "新建文档",
        description: "创建创意文档",
        icon: FileText,
        href: "/creative/documents",
      },
    ],
  },
  {
    id: "generate",
    title: "生成",
    description: "使用 AI 生成文本、图像和代码",
    icon: Sparkles,
    color: "text-foreground-light",
    bgColor: "bg-surface-200",
    actions: [
      {
        title: "生成文本",
        description: "AI 文本生成",
        icon: FileText,
        href: "/creative/generate?type=text",
        badge: "AI",
        badgeVariant: "primary",
      },
      {
        title: "生成图片",
        description: "AI 图像生成",
        icon: Palette,
        href: "/creative/generate?type=image",
        badge: "AI",
        badgeVariant: "primary",
      },
      {
        title: "生成代码",
        description: "AI 代码生成",
        icon: Code,
        href: "/creative/generate?type=code",
        badge: "AI",
        badgeVariant: "primary",
      },
    ],
  },
  {
    id: "manage",
    title: "管理",
    description: "集中管理你的资产和自动化",
    icon: FolderOpen,
    color: "text-foreground-light",
    bgColor: "bg-surface-200",
    actions: [
      {
        title: "我的工作流",
        description: "管理所有工作流",
        icon: Zap,
        href: "/workflows",
      },
      {
        title: "我的 Agent",
        description: "管理 AI 助手",
        icon: Bot,
        href: "/my-agents",
        badge: "常用",
        badgeVariant: "secondary",
      },
      {
        title: "文件库",
        description: "管理上传文件",
        icon: Upload,
        href: "/files",
        badge: "资源",
        badgeVariant: "secondary",
      },
      {
        title: "收藏夹",
        description: "收藏的内容",
        icon: Star,
        href: "/favorites",
      },
    ],
  },
  {
    id: "settings",
    title: "设置",
    description: "账户、安全与团队配置",
    icon: Settings,
    color: "text-foreground-light",
    bgColor: "bg-surface-200",
    actions: [
      {
        title: "账户设置",
        description: "管理账户信息",
        icon: Settings,
        href: "/settings",
        shortcut: "⌘ ,",
      },
      {
        title: "API 密钥",
        description: "管理 API 配置",
        icon: Shield,
        href: "/settings/api-keys",
        badge: "敏感",
        badgeVariant: "warning",
      },
      {
        title: "通知设置",
        description: "配置通知偏好",
        icon: Bell,
        href: "/settings/notifications",
      },
      {
        title: "团队管理",
        description: "管理团队成员",
        icon: Users,
        href: "/team",
      },
    ],
  },
];

const recentActions = [
  {
    title: "客户反馈处理工作流",
    type: "工作流",
    icon: Zap,
    href: "/workflows/1",
    time: "10 分钟前",
  },
  {
    title: "写作助手 Agent",
    type: "Agent",
    icon: Bot,
    href: "/my-agents/1",
    time: "30 分钟前",
  },
  {
    title: "SEO 博客模板",
    type: "模板",
    icon: FileText,
    href: "/creative/templates",
    time: "1 小时前",
  },
  {
    title: "产品需求讨论",
    type: "对话",
    icon: MessageSquare,
    href: "/conversations/1",
    time: "2 小时前",
  },
];

const keyboardShortcuts = [
  { keys: ["⌘", "K"], description: "打开命令面板" },
  { keys: ["⌘", "N"], description: "新建对话" },
  { keys: ["⌘", "W"], description: "新建工作流" },
  { keys: ["⌘", ","], description: "打开设置" },
  { keys: ["/"], description: "聚焦搜索" },
  { keys: ["?"], description: "快捷键帮助" },
];

const helpLinks = [
  {
    title: "帮助中心",
    description: "产品与功能指南",
    href: "/help",
  },
  {
    title: "学习中心",
    description: "最佳实践与模板",
    href: "/learn",
  },
  {
    title: "反馈建议",
    description: "告诉我们你的想法",
    href: "/feedback",
  },
];

export default function QuickActionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredCategories = quickActionCategories
    .filter((category) => activeFilter === "all" || category.id === activeFilter)
    .map((category) => ({
      ...category,
      actions: category.actions.filter((action) => {
        if (!normalizedQuery) return true;
        return (
          action.title.toLowerCase().includes(normalizedQuery) ||
          action.description.toLowerCase().includes(normalizedQuery)
        );
      }),
    }))
    .filter((category) => category.actions.length > 0);

  const filteredFeaturedActions = featuredActions.filter((action) => {
    if (!normalizedQuery) return true;
    return (
      action.title.toLowerCase().includes(normalizedQuery) ||
      action.description.toLowerCase().includes(normalizedQuery)
    );
  });

  return (
    <div className="min-h-full bg-background-studio">
      {/* 页面头部 */}
      <div className="border-b border-border bg-background-studio/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">
          <PageHeader
            eyebrow="Operations"
            title="快捷操作中心"
            description="快速访问常用功能、模板与系统设置"
            icon={<Command className="w-4 h-4 text-brand-500" />}
            actions={(
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Settings className="w-3.5 h-3.5" />}
                >
                  自定义面板
                </Button>
                <Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                  新建操作
                </Button>
              </div>
            )}
          />

          <div className="page-grid lg:grid-cols-[minmax(0,1fr)_auto] gap-3 lg:gap-3 lg:items-center">
            <Input
              variant="search"
              inputSize="lg"
              placeholder="搜索操作、功能或页面..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
              rightIcon={
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-0.5 text-[10px] rounded-md bg-surface-200 border border-border text-foreground-muted">
                    ⌘
                  </kbd>
                  <kbd className="px-2 py-0.5 text-[10px] rounded-md bg-surface-200 border border-border text-foreground-muted">
                    K
                  </kbd>
                </div>
              }
              className="w-full"
            />
            <div className="flex items-center gap-2 flex-wrap">
              {actionFilters.map((filter) => (
                <Button
                  key={filter.id}
                  variant={activeFilter === filter.id ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setActiveFilter(filter.id)}
                  aria-pressed={activeFilter === filter.id}
                  className="h-8 px-3 text-[12px]"
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* 快捷启动 */}
        {filteredFeaturedActions.length > 0 && (
          <section className="page-panel">
            <div className="page-panel-header flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-brand-500" />
                  <span className="page-panel-title">快捷启动</span>
                  <Badge variant="secondary" size="sm">
                    推荐
                  </Badge>
                </div>
                <p className="page-panel-description">高频场景的快速入口</p>
              </div>
              <Button
                asChild
                variant="ghost"
                size="sm"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                className="text-foreground-light hover:text-foreground"
              >
                <Link href="/shortcuts">管理快捷方式</Link>
              </Button>
            </div>
            <div className="p-4 page-grid sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-3">
              {filteredFeaturedActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.title}
                    href={action.href}
                    className="group rounded-md border border-border bg-surface-100 p-4 hover:border-border-strong hover:bg-surface-75/80 transition-supabase"
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={cn(
                          "w-9 h-9 rounded-md flex items-center justify-center border border-transparent",
                          action.iconBg
                        )}
                      >
                        <Icon className={cn("w-4 h-4", action.iconColor)} />
                      </div>
                      {action.badge && (
                        <Badge variant={action.badgeVariant} size="xs">
                          {action.badge}
                        </Badge>
                      )}
                    </div>
                    <h3 className="mt-3 text-[13px] font-medium text-foreground group-hover:text-brand-500 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-xs text-foreground-muted">{action.description}</p>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* 今日概览 */}
        <section className="page-panel">
          <div className="page-panel-header flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-foreground-muted" />
                <span className="page-panel-title">今日概览</span>
              </div>
              <p className="page-panel-description">过去 24 小时的活动趋势</p>
            </div>
            <Button
              asChild
              variant="ghost"
              size="sm"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              className="text-foreground-light hover:text-foreground"
            >
              <Link href="/analytics">查看报表</Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y divide-border md:divide-y-0 md:divide-x">
            {quickStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-foreground-muted">
                      <Icon className="w-4 h-4" />
                      <span>{stat.label}</span>
                    </div>
                    <Badge variant={stat.trendVariant} size="xs" className="tabular-nums">
                      {stat.trend}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-end justify-between">
                    <p className="text-stat-number text-foreground">{stat.value}</p>
                    <span className="text-[11px] text-foreground-muted">{stat.hint}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="page-grid lg:grid-cols-[minmax(0,1fr)_320px] gap-8 lg:gap-8">
          {/* 左侧 - 操作分类 */}
          <div className="space-y-6">
            {filteredCategories.length === 0 ? (
              <div className="page-panel">
                <div className="p-6 text-center">
                  <p className="text-sm text-foreground">未找到匹配的操作</p>
                  <p className="text-xs text-foreground-muted">
                    尝试调整关键词或筛选条件
                  </p>
                </div>
              </div>
            ) : (
              filteredCategories.map((category) => {
                const CategoryIcon = category.icon;
                return (
                  <section key={category.id} className="page-panel">
                    <div className="page-panel-header flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "w-9 h-9 rounded-md flex items-center justify-center border border-transparent",
                            category.bgColor
                          )}
                        >
                          <CategoryIcon className={cn("w-4 h-4", category.color)} />
                        </div>
                        <div>
                          <span className="page-panel-title">{category.title}</span>
                          <p className="page-panel-description">{category.description}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" size="xs">
                        {category.actions.length} 项
                      </Badge>
                    </div>
                    <div className="p-4 space-y-2">
                      {category.actions.map((action) => {
                        const Icon = action.icon;
                        return (
                          <Link
                            key={action.title}
                            href={action.href}
                            className="group flex items-center gap-3 rounded-md border border-transparent bg-surface-100/60 px-3 py-2.5 hover:border-border-strong hover:bg-surface-75/80 transition-supabase"
                          >
                            <div
                              className={cn(
                                "w-9 h-9 rounded-md flex items-center justify-center border border-border",
                                category.bgColor
                              )}
                            >
                              <Icon className={cn("w-4 h-4", category.color)} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[13px] font-medium text-foreground group-hover:text-brand-500 transition-colors">
                                  {action.title}
                                </span>
                                {action.badge && (
                                  <Badge variant={action.badgeVariant ?? "secondary"} size="xs">
                                    {action.badge}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-foreground-muted">{action.description}</p>
                            </div>
                            {action.shortcut ? (
                              <kbd className="px-2 py-1 text-[10px] rounded-md bg-surface-200 border border-border text-foreground-muted shrink-0">
                                {action.shortcut}
                              </kbd>
                            ) : (
                              <ArrowRight className="w-4 h-4 text-foreground-muted shrink-0" />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                );
              })
            )}
          </div>

          {/* 右侧 - 最近使用与快捷键 */}
          <aside className="space-y-6">
            {/* 最近使用 */}
            <div className="page-panel">
              <div className="page-panel-header flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-foreground-muted" />
                  <span className="page-panel-title">最近使用</span>
                </div>
                <Badge variant="secondary" size="xs">
                  {recentActions.length} 项
                </Badge>
              </div>
              <div className="p-4 space-y-2">
                {recentActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={index}
                      href={action.href}
                      className="group flex items-center gap-3 rounded-md px-3 py-2 hover:bg-surface-75 transition-supabase"
                    >
                      <div className="w-8 h-8 rounded-md bg-surface-200 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-foreground-muted" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] text-foreground truncate group-hover:text-brand-500 transition-colors">
                            {action.title}
                          </p>
                          <Badge variant="secondary" size="xs">
                            {action.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-foreground-muted">{action.time}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-foreground-muted shrink-0" />
                    </Link>
                  );
                })}
              </div>
              <div className="px-4 pb-4">
                <Link
                  href="/activity"
                  className="block text-[12px] text-brand-500 hover:underline text-center"
                >
                  查看全部活动
                </Link>
              </div>
            </div>

            {/* 键盘快捷键 */}
            <div className="page-panel">
              <div className="page-panel-header flex items-center gap-2">
                <Command className="w-4 h-4 text-foreground-muted" />
                <span className="page-panel-title">键盘快捷键</span>
              </div>
              <div className="p-4 space-y-3">
                {keyboardShortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-[13px] text-foreground-light">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, idx) => (
                        <kbd
                          key={idx}
                          className="px-2 py-0.5 text-[10px] rounded-md bg-surface-200 border border-border text-foreground-muted min-w-[24px] text-center"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 pb-4">
                <Link
                  href="/shortcuts"
                  className="block text-[12px] text-brand-500 hover:underline text-center"
                >
                  查看全部快捷键
                </Link>
              </div>
            </div>

            {/* 支持与反馈 */}
            <div className="page-panel border-brand-400/30 bg-brand-200/10">
              <div className="page-panel-header bg-transparent border-border/60">
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-brand-500" />
                  <span className="page-panel-title">支持与反馈</span>
                </div>
                <p className="page-panel-description">获取帮助或分享你的想法</p>
              </div>
              <div className="p-4 space-y-3">
                {helpLinks.map((link) => (
                  <Link
                    key={link.title}
                    href={link.href}
                    className="group flex items-start gap-3 rounded-md border border-border/60 bg-surface-100/60 p-3 hover:border-border-strong hover:bg-surface-100 transition-supabase"
                  >
                    <div className="w-8 h-8 rounded-md bg-surface-200 flex items-center justify-center">
                      <ExternalLink className="w-4 h-4 text-foreground-muted group-hover:text-brand-500 transition-colors" />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-foreground group-hover:text-brand-500 transition-colors">
                        {link.title}
                      </p>
                      <p className="text-xs text-foreground-muted">{link.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
