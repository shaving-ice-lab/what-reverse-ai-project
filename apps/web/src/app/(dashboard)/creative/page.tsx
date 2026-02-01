"use client";

/**
 * 创意助手首页 - Supabase 风格
 * 强调结构化面板与低噪音信息层级
 */

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  FileText,
  Image,
  Code,
  MessageSquare,
  ArrowRight,
  Plus,
  Clock,
  Star,
  Zap,
  Wand2,
  PenTool,
  Lightbulb,
  Search,
  History,
  BookOpen,
  Flame,
  ChevronRight,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PageContainer, PageHeader } from "@/components/dashboard/page-layout";

// 创作类型 - Supabase 风格
const creativeTypes = [
  {
    id: "text",
    title: "文字创作",
    description: "文章、文案、邮件、报告等",
    icon: FileText,
    href: "/creative/generate?type=text",
    popular: true,
  },
  {
    id: "image",
    title: "图像生成",
    description: "插画、海报、产品图等",
    icon: Image,
    href: "/creative/generate?type=image",
    popular: false,
  },
  {
    id: "code",
    title: "代码助手",
    description: "代码生成、调试、解释",
    icon: Code,
    href: "/creative/generate?type=code",
    popular: true,
  },
  {
    id: "chat",
    title: "智能对话",
    description: "问答、头脑风暴、创意",
    icon: MessageSquare,
    href: "/creative/generate?type=chat",
    popular: false,
  },
];

// 快捷模板
const quickTemplates = [
  { id: "1", title: "营销文案", icon: PenTool, uses: 12500, category: "营销" },
  { id: "2", title: "产品描述", icon: FileText, uses: 9800, category: "电商" },
  { id: "3", title: "社交媒体", icon: MessageSquare, uses: 8600, category: "社媒" },
  { id: "4", title: "邮件回复", icon: Lightbulb, uses: 7200, category: "商务" },
  { id: "5", title: "技术文档", icon: BookOpen, uses: 6500, category: "技术" },
  { id: "6", title: "新闻稿件", icon: FileText, uses: 5800, category: "媒体" },
];

// 最近文档
const recentDocuments = [
  {
    id: "1",
    title: "Q1 营销方案",
    type: "text",
    updatedAt: "10 分钟前",
    preview: "本季度营销重点聚焦于...",
    status: "completed",
  },
  {
    id: "2",
    title: "产品发布公告",
    type: "text",
    updatedAt: "2 小时前",
    preview: "我们很高兴地宣布...",
    status: "completed",
  },
  {
    id: "3",
    title: "客户回访话术",
    type: "text",
    updatedAt: "昨天",
    preview: "尊敬的客户，感谢您...",
    status: "draft",
  },
  {
    id: "4",
    title: "技术文档草稿",
    type: "code",
    updatedAt: "2 天前",
    preview: "API 接口说明文档...",
    status: "draft",
  },
];

// 统计数据 - Supabase 风格
const stats = [
  { label: "本月生成", value: "1,234", icon: Zap, trend: "+12%", color: "text-brand-500" },
  { label: "节省时间", value: "48h", icon: Clock, trend: "+25%", color: "text-foreground-light" },
  { label: "文档数量", value: "56", icon: FileText, trend: "+8%", color: "text-foreground-light" },
  { label: "使用模板", value: "23", icon: Star, trend: "+15%", color: "text-warning" },
];

// 每日提示
const dailyTips = [
  "💡 尝试使用更具体的描述来获得更好的生成结果",
  "🎯 为文案添加目标受众信息可以提高转化率",
  "✨ 使用模板可以节省 50% 以上的创作时间",
  "📊 定期查看数据分析可以优化您的创作策略",
];

// 快速操作
const quickActions = [
  { label: "继续上次创作", icon: History, href: "/creative/document/1" },
  { label: "使用模板", icon: BookOpen, href: "/creative/templates" },
  { label: "查看所有文档", icon: FileText, href: "/creative/documents" },
  { label: "数据分析", icon: BarChart3, href: "/creator/analytics" },
];

export default function CreativePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  // 切换提示
  const nextTip = () => {
    setCurrentTipIndex((prev) => (prev + 1) % dailyTips.length);
  };

  return (
    <PageContainer>
      <div className="page-section p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-surface-200 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-foreground-light" />
          </div>
          <div className="page-caption">Creative</div>
        </div>
        <PageHeader
          title="创意工坊"
          description="AI 驱动的内容创作工具"
          actions={(
            <div className="page-panel p-2 flex flex-wrap items-center gap-2">
              <div className="w-full sm:w-64">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索文档或模板..."
                  leftIcon={<Search className="w-4 h-4" />}
                  className="h-8 bg-surface-200 border-border text-foreground placeholder:text-foreground-muted focus:border-brand-500"
                />
              </div>
              <Link href="/creative/templates">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 border-border text-foreground-light hover:text-foreground"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  模板库
                </Button>
              </Link>
              <Link href="/creative/generate">
                <Button size="sm" className="h-8 bg-brand-500 hover:bg-brand-600 text-background">
                  <Plus className="w-4 h-4 mr-2" />
                  新建创作
                </Button>
              </Link>
            </div>
          )}
        />

        <div className="page-divider" />

        <div className="page-grid grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="page-panel p-4 transition-supabase hover:border-border-strong"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-category">{stat.label}</span>
                <div className="w-8 h-8 rounded-md bg-surface-200 flex items-center justify-center">
                  <stat.icon className="w-4 h-4 text-foreground-muted" />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-stat-number text-foreground">{stat.value}</span>
                <span className={cn("text-xs font-medium", stat.color)}>
                  {stat.trend}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Daily Tip */}
        <div className="page-panel">
          <div className="page-panel-header flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-warning-200 flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-warning" />
              </div>
              <div>
                <h2 className="page-panel-title">今日灵感</h2>
                <p className="page-panel-description">每日一条创作提示</p>
              </div>
            </div>
            <button
              onClick={nextTip}
              className="p-2 rounded-md hover:bg-surface-200 transition-colors text-foreground-muted hover:text-foreground-light"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <div className="p-6 text-[13px] text-foreground-light">
            {dailyTips[currentTipIndex]}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="page-panel">
          <div className="page-panel-header flex items-center justify-between">
            <div>
              <h2 className="page-panel-title">快速开始</h2>
              <p className="page-panel-description">常用入口与最近访问</p>
            </div>
            <Sparkles className="w-4 h-4 text-brand-500" />
          </div>
          <div className="p-6 page-grid grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center gap-3 p-4 rounded-md bg-surface-100 border border-border hover:border-border-strong hover:bg-surface-75 transition-supabase group"
              >
                <div className="w-9 h-9 rounded-md bg-surface-200 flex items-center justify-center group-hover:bg-surface-300 transition-colors">
                  <action.icon className="w-4 h-4 text-foreground-muted group-hover:text-foreground-light transition-colors" />
                </div>
                <span className="text-sm font-medium text-foreground-light group-hover:text-foreground transition-colors">
                  {action.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Creative Types */}
        <div className="page-panel">
          <div className="page-panel-header flex items-center justify-between">
            <div>
              <h2 className="page-panel-title">创作类型</h2>
              <p className="page-panel-description">选择适合的生成方式</p>
            </div>
            <span className="text-xs text-foreground-muted">{creativeTypes.length} 类</span>
          </div>
          <div className="p-6 page-grid sm:grid-cols-2 lg:grid-cols-4">
            {creativeTypes.map((type) => (
              <Link
                key={type.id}
                href={type.href}
                className={cn(
                  "group relative p-5 rounded-md",
                  "bg-surface-100 border border-border",
                  "hover:border-border-strong hover:bg-surface-75",
                  "transition-supabase"
                )}
              >
                {type.popular && (
                  <div className="absolute -top-2 -right-2">
                    <Badge variant="primary" size="xs" className="gap-1">
                      <Flame className="w-3 h-3" />
                      热门
                    </Badge>
                  </div>
                )}
                <div className="w-10 h-10 rounded-md bg-surface-200 flex items-center justify-center mb-4">
                  <type.icon className="w-5 h-5 text-foreground-light" />
                </div>
                <h3 className="text-sm font-medium text-foreground group-hover:text-foreground-light transition-colors">
                  {type.title}
                </h3>
                <p className="text-xs text-foreground-muted mt-1">
                  {type.description}
                </p>
                <div className="mt-4 flex items-center text-xs text-foreground-muted opacity-0 group-hover:opacity-100 transition-opacity">
                  开始创作
                  <ChevronRight className="w-3 h-3 ml-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="page-grid lg:grid-cols-3">
          {/* Quick Templates */}
          <div className="page-panel lg:col-span-2">
            <div className="page-panel-header flex items-center justify-between">
              <div>
                <h2 className="page-panel-title">热门模板</h2>
                <p className="page-panel-description">高使用率的创作模板</p>
              </div>
              <Link
                href="/creative/templates"
                className="text-xs text-foreground-muted hover:text-foreground flex items-center gap-1 transition-colors"
              >
                查看全部
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="p-6 page-grid sm:grid-cols-2">
              {quickTemplates.map((template) => (
                <Link
                  key={template.id}
                  href={`/creative/generate?template=${template.id}`}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-md",
                    "bg-surface-100 border border-border",
                    "hover:border-border-strong hover:bg-surface-75",
                    "transition-supabase group"
                  )}
                >
                  <div className="w-9 h-9 rounded-md bg-surface-200 flex items-center justify-center group-hover:bg-surface-300 transition-colors">
                    <template.icon className="w-4 h-4 text-foreground-muted group-hover:text-foreground-light transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h4 className="text-sm font-medium text-foreground-light truncate group-hover:text-foreground transition-colors">
                        {template.title}
                      </h4>
                      <span className="text-xs text-foreground-muted px-1.5 py-0.5 rounded-md bg-surface-200 shrink-0">
                        {template.category}
                      </span>
                    </div>
                    <p className="text-xs text-foreground-muted mt-0.5">
                      {template.uses.toLocaleString()} 次使用
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-foreground-muted group-hover:text-foreground-light transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Documents */}
          <div className="page-panel">
            <div className="page-panel-header flex items-center justify-between">
              <div>
                <h2 className="page-panel-title">最近文档</h2>
                <p className="page-panel-description">继续编辑最近内容</p>
              </div>
              <Link
                href="/creative/documents"
                className="text-xs text-foreground-muted hover:text-foreground flex items-center gap-1 transition-colors"
              >
                全部
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="p-6 space-y-3">
              {recentDocuments.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/creative/document/${doc.id}`}
                  className={cn(
                    "block p-4 rounded-md",
                    "bg-surface-100 border border-border",
                    "hover:border-border-strong hover:bg-surface-75",
                    "transition-supabase group"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-md bg-surface-200 flex items-center justify-center shrink-0">
                      {doc.type === "code" ? (
                        <Code className="w-4 h-4 text-foreground-muted" />
                      ) : (
                        <FileText className="w-4 h-4 text-foreground-muted" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h4 className="text-sm font-medium text-foreground-light truncate group-hover:text-foreground transition-colors">
                          {doc.title}
                        </h4>
                        <span className={cn(
                          "text-xs px-1.5 py-0.5 rounded-md shrink-0",
                          doc.status === "completed"
                            ? "bg-brand-200 text-brand-500"
                            : "bg-warning-200 text-warning"
                        )}>
                          {doc.status === "completed" ? "已完成" : "草稿"}
                        </span>
                      </div>
                      <p className="text-xs text-foreground-muted truncate mt-1">
                        {doc.preview}
                      </p>
                      <p className="text-xs text-foreground-muted mt-1">
                        {doc.updatedAt}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Inspiration Section */}
        <div className="page-panel border-brand-400/30 bg-brand-200/20">
          <div className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-md bg-brand-500 flex items-center justify-center">
                <Wand2 className="w-5 h-5 text-background" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground">需要灵感？</h3>
                <p className="text-[13px] text-foreground-light">
                  让 AI 帮你头脑风暴，激发创意灵感
                </p>
              </div>
            </div>
            <Link href="/creative/generate?mode=brainstorm">
              <Button
                variant="outline"
                className="border-border-muted text-foreground-light hover:bg-surface-200 hover:text-foreground"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                开始头脑风暴
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
