"use client";

/**
 * 创意助手首页 - Supabase Settings 风格
 * 采用带侧边栏的布局，极简文本优先设计
 */

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  PenTool,
  Lightbulb,
  BookOpen,
  ChevronRight,
  BarChart3,
  FolderOpen,
  Layout,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  PageHeader,
  PageWithSidebar,
  SidebarNavGroup,
  SidebarNavItem,
  SettingsSection,
} from "@/components/dashboard/page-layout";

// 创作类型
const creativeTypes = [
  {
    id: "text",
    title: "文字创作",
    description: "文章、文案、邮件、报告等",
    icon: FileText,
    href: "/dashboard/creative/generate?type=text",
  },
  {
    id: "image",
    title: "图像生成",
    description: "插画、海报、产品图等",
    icon: Image,
    href: "/dashboard/creative/generate?type=image",
  },
  {
    id: "code",
    title: "代码助手",
    description: "代码生成、调试、解释",
    icon: Code,
    href: "/dashboard/creative/generate?type=code",
  },
  {
    id: "chat",
    title: "智能对话",
    description: "问答、头脑风暴、创意",
    icon: MessageSquare,
    href: "/dashboard/creative/generate?type=chat",
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
    status: "completed",
  },
  {
    id: "2",
    title: "产品发布公告",
    type: "text",
    updatedAt: "2 小时前",
    status: "completed",
  },
  {
    id: "3",
    title: "客户回访话术",
    type: "text",
    updatedAt: "昨天",
    status: "draft",
  },
  {
    id: "4",
    title: "技术文档草稿",
    type: "code",
    updatedAt: "2 天前",
    status: "draft",
  },
];

// 统计数据
const stats = [
  { label: "本月生成", value: "1,234", icon: Zap, trend: "+12%" },
  { label: "节省时间", value: "48h", icon: Clock, trend: "+25%" },
  { label: "文档数量", value: "56", icon: FileText, trend: "+8%" },
  { label: "使用模板", value: "23", icon: Star, trend: "+15%" },
];

// 每日提示 - 移除 emoji
const dailyTips = [
  "尝试使用更具体的描述来获得更好的生成结果",
  "为文案添加目标受众信息可以提高转化率",
  "使用模板可以节省 50% 以上的创作时间",
  "定期查看数据分析可以优化您的创作策略",
];

// 侧边栏内容组件
function CreativeSidebar() {
  const pathname = usePathname();
  
  return (
    <>
      <SidebarNavGroup title="创作">
        <SidebarNavItem 
          href="/dashboard/creative" 
          label="概览" 
          icon={<Layout className="w-4 h-4" />}
          active={pathname === "/dashboard/creative"} 
        />
        <SidebarNavItem 
          href="/dashboard/creative/generate" 
          label="新建创作" 
          icon={<Plus className="w-4 h-4" />}
        />
        <SidebarNavItem 
          href="/dashboard/creative/documents" 
          label="我的文档" 
          icon={<FolderOpen className="w-4 h-4" />}
        />
        <SidebarNavItem 
          href="/dashboard/creative/templates" 
          label="模板库" 
          icon={<BookOpen className="w-4 h-4" />}
        />
      </SidebarNavGroup>
      <SidebarNavGroup title="数据">
        <SidebarNavItem 
          href="/dashboard/creative/analytics" 
          label="数据分析" 
          icon={<BarChart3 className="w-4 h-4" />}
        />
      </SidebarNavGroup>
    </>
  );
}

export default function CreativePage() {
  const [currentTipIndex] = useState(0);

  return (
    <PageWithSidebar 
      sidebar={<CreativeSidebar />} 
      sidebarTitle="Creative"
      sidebarWidth="narrow"
    >
      {/* 页面头部 */}
      <PageHeader
        title="创意工坊"
        description="AI 驱动的内容创作工具"
        actions={
          <div className="flex items-center gap-2">
            <Link href="/dashboard/creative/templates">
              <Button
                variant="outline"
                size="sm"
                className="h-8 border-border text-foreground-light hover:text-foreground hover:bg-surface-100/60 transition-colors"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                模板库
              </Button>
            </Link>
            <Link href="/dashboard/creative/generate">
              <Button size="sm" className="h-8 bg-brand-500 hover:bg-brand-600 text-background">
                <Plus className="w-4 h-4 mr-2" />
                新建创作
              </Button>
            </Link>
          </div>
        }
      />

      <div className="space-y-6">
        {/* 使用统计 */}
        <SettingsSection 
          title="使用统计" 
          description="本月创作数据概览"
          compact
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="p-3 rounded-md bg-surface-75 border border-border hover:border-border-strong transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-foreground-muted">
                    {stat.label}
                  </span>
                  <stat.icon className="w-3.5 h-3.5 text-foreground-muted" />
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-lg font-semibold text-foreground">{stat.value}</span>
                  <span className="text-[11px] font-medium text-brand-500">{stat.trend}</span>
                </div>
              </div>
            ))}
          </div>
        </SettingsSection>

        {/* 今日提示 */}
        <SettingsSection 
          title="今日提示" 
          description="创作建议"
          compact
        >
          <div className="flex items-start gap-3 p-3 rounded-md bg-surface-75 border border-border">
            <Lightbulb className="w-4 h-4 text-foreground-muted shrink-0 mt-0.5" />
            <p className="text-[12px] text-foreground-light leading-relaxed">
              {dailyTips[currentTipIndex]}
            </p>
          </div>
        </SettingsSection>

        {/* 创作类型 */}
        <SettingsSection 
          title="创作类型" 
          description="选择适合的生成方式"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {creativeTypes.map((type) => (
              <Link
                key={type.id}
                href={type.href}
                className={cn(
                  "group p-4 rounded-md",
                  "bg-surface-75 border border-border",
                  "hover:border-border-strong hover:bg-surface-100/60",
                  "transition-colors"
                )}
              >
                <div className="w-8 h-8 rounded-md bg-surface-200 flex items-center justify-center mb-3">
                  <type.icon className="w-4 h-4 text-foreground-light" />
                </div>
                <h3 className="text-[12px] font-medium text-foreground group-hover:text-foreground-light transition-colors">
                  {type.title}
                </h3>
                <p className="text-[11px] text-foreground-muted mt-1">
                  {type.description}
                </p>
              </Link>
            ))}
          </div>
        </SettingsSection>

        {/* 热门模板 */}
        <SettingsSection 
          title="热门模板" 
          description="高使用率的创作模板"
          footer={
            <Link
              href="/dashboard/creative/templates"
              className="text-[12px] text-foreground-muted hover:text-foreground flex items-center gap-1 transition-colors"
            >
              查看全部模板
              <ArrowRight className="w-3 h-3" />
            </Link>
          }
        >
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {quickTemplates.map((template) => (
              <Link
                key={template.id}
                href={`/dashboard/creative/generate?template=${template.id}`}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-md",
                  "bg-surface-75 border border-border",
                  "hover:border-border-strong hover:bg-surface-100/60",
                  "transition-colors group"
                )}
              >
                <div className="w-8 h-8 rounded-md bg-surface-200 flex items-center justify-center shrink-0">
                  <template.icon className="w-4 h-4 text-foreground-muted group-hover:text-foreground-light transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-[12px] font-medium text-foreground-light truncate group-hover:text-foreground transition-colors">
                      {template.title}
                    </h4>
                    <span className="text-[10px] text-foreground-muted px-1.5 py-0.5 rounded bg-surface-200 shrink-0">
                      {template.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-foreground-muted mt-0.5">
                    {template.uses.toLocaleString()} 次使用
                  </p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-foreground-muted group-hover:text-foreground-light transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        </SettingsSection>

        {/* 最近文档 */}
        <SettingsSection 
          title="最近文档" 
          description="继续编辑最近内容"
          footer={
            <Link
              href="/dashboard/creative/documents"
              className="text-[12px] text-foreground-muted hover:text-foreground flex items-center gap-1 transition-colors"
            >
              查看全部文档
              <ArrowRight className="w-3 h-3" />
            </Link>
          }
        >
          <div className="space-y-2">
            {recentDocuments.map((doc) => (
              <Link
                key={doc.id}
                href={`/dashboard/creative/document/${doc.id}`}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-md",
                  "bg-surface-75 border border-border",
                  "hover:border-border-strong hover:bg-surface-100/60",
                  "transition-colors group"
                )}
              >
                <div className="w-8 h-8 rounded-md bg-surface-200 flex items-center justify-center shrink-0">
                  {doc.type === "code" ? (
                    <Code className="w-4 h-4 text-foreground-muted" />
                  ) : (
                    <FileText className="w-4 h-4 text-foreground-muted" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-[12px] font-medium text-foreground-light truncate group-hover:text-foreground transition-colors">
                      {doc.title}
                    </h4>
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded shrink-0",
                      doc.status === "completed"
                        ? "bg-brand-200 text-brand-500"
                        : "bg-surface-200 text-foreground-muted"
                    )}>
                      {doc.status === "completed" ? "已完成" : "草稿"}
                    </span>
                  </div>
                  <p className="text-[11px] text-foreground-muted mt-0.5">
                    {doc.updatedAt}
                  </p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-foreground-muted group-hover:text-foreground-light transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        </SettingsSection>

        {/* 灵感入口 - 简化版 */}
        <div className="p-4 rounded-lg bg-surface-100 border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-surface-200 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-brand-500" />
              </div>
              <div>
                <h3 className="text-[12px] font-medium text-foreground">需要灵感？</h3>
                <p className="text-[11px] text-foreground-light">
                  让 AI 帮你头脑风暴
                </p>
              </div>
            </div>
            <Link href="/dashboard/creative/generate?mode=brainstorm">
              <Button
                variant="outline"
                size="sm"
                className="h-8 border-border text-foreground-light hover:text-foreground hover:bg-surface-100/60 transition-colors"
              >
                开始创作
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </PageWithSidebar>
  );
}
