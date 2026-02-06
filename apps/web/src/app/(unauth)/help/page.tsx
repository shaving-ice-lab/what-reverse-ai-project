"use client";

/**
 * 帮助中心页面 - LobeHub 风格
 */

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  HelpCircle,
  BookOpen,
  LifeBuoy,
  Zap,
  Users,
  Settings,
  Shield,
  CreditCard,
  ArrowRight,
  ExternalLink,
  Mail,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/utils";

// 帮助分类
const categories = [
  {
    icon: Zap,
    title: "入门指南",
    description: "快速开始使用 AgentFlow",
    href: "/docs/getting-started",
    articles: 12,
  },
  {
    icon: BookOpen,
    title: "工作流管理",
    description: "创建、编辑和运行工作流",
    href: "/docs/guide/workflows",
    articles: 25,
  },
  {
    icon: Settings,
    title: "集成与连接",
    description: "连接第三方服务和 API",
    href: "/docs/integrations",
    articles: 45,
  },
  {
    icon: Users,
    title: "团队协作",
    description: "管理团队成员和权限",
    href: "/docs/guide/team",
    articles: 8,
  },
  {
    icon: CreditCard,
    title: "账单与订阅",
    description: "计费、发票和订阅管理",
    href: "/docs/billing",
    articles: 10,
  },
  {
    icon: Shield,
    title: "安全与隐私",
    description: "账户安全和数据保护",
    href: "/docs/security",
    articles: 15,
  },
];

// 帮助中心目录
const helpDirectory = [
  {
    title: "入门与概览",
    description: "从 0 到 1 上手并掌握核心概念",
    links: [
      { title: "快速开始", href: "/docs/getting-started" },
      { title: "功能概览", href: "/docs" },
      { title: "FAQ 常见问题", href: "/faq" },
    ],
  },
  {
    title: "故障排查",
    description: "自助排查运行与集成问题",
    links: [
      { title: "故障自助指南", href: "/help/troubleshooting" },
      { title: "运行时入口说明", href: "/docs" },
      { title: "访问策略与限流", href: "/docs" },
    ],
  },
  {
    title: "支持与协作",
    description: "获取支持与团队协作方式",
    links: [
      { title: "提交工单", href: "/support" },
      { title: "联系我们", href: "/contact" },
      { title: "社区讨论", href: "/community" },
    ],
  },
  {
    title: "安全与合规",
    description: "安全、隐私与运营保障",
    links: [
      { title: "安全中心", href: "/security" },
      { title: "隐私政策", href: "/privacy" },
      { title: "服务条款", href: "/terms" },
    ],
  },
];

// 热门文章
const popularArticles = [
  { title: "如何创建第一个工作流", views: 12500, href: "/docs/guide/first-workflow" },
  { title: "连接 Slack 发送通知", views: 8900, href: "/docs/integrations/slack" },
  { title: "设置定时触发器", views: 7600, href: "/docs/guide/triggers" },
  { title: "邀请团队成员", views: 5400, href: "/docs/guide/team" },
  { title: "设置 Webhook 触发器", views: 4800, href: "/docs/integrations/webhook" },
  { title: "故障自助排查指南", views: 4200, href: "/help/troubleshooting" },
];

// 联系方式
const contactMethods = [
  {
    icon: LifeBuoy,
    title: "提交工单",
    description: "SLA 跟踪与处理进度可视化",
    action: "提交工单",
    href: "/support",
  },
  {
    icon: Mail,
    title: "发送邮件",
    description: "support@agentflow.ai",
    action: "发送邮件",
    href: "mailto:support@agentflow.ai",
  },
  {
    icon: Users,
    title: "社区论坛",
    description: "与其他用户交流",
    action: "访问社区",
    href: "/community",
  },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative pt-32 sm:pt-40 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <div className="lobe-badge mb-8">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>帮助中心</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-6 leading-[1.1]">
            帮助中心
          </h1>
          <p className="text-lg text-foreground-light max-w-2xl mx-auto mb-10 leading-relaxed">
            搜索常见问题解答，或浏览下方分类
          </p>

          {/* Search */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-lighter" />
            <Input
              placeholder="搜索帮助文章..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-full bg-surface-100/50 border-border/30 text-foreground placeholder:text-foreground-lighter"
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-24 sm:py-32">
        <div className="max-w-5xl mx-auto px-6">
          <div className="lobe-section-header">
            <h2>帮助分类</h2>
            <p>按主题快速找到您需要的帮助</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <Link
                key={category.title}
                href={category.href}
                className={cn(
                  "p-6 rounded-2xl group",
                  "bg-surface-100/30 border border-border/30",
                  "hover:bg-surface-100/60 hover:border-border/60",
                  "transition-all duration-300"
                )}
              >
                <div className="w-12 h-12 rounded-xl bg-surface-200/80 border border-border/30 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300">
                  <category.icon className="w-6 h-6 text-foreground-light" />
                </div>
                <h3 className="text-[15px] font-semibold text-foreground mb-1 group-hover:text-brand-500 transition-colors">
                  {category.title}
                </h3>
                <p className="text-[13px] text-foreground-lighter mb-2 leading-relaxed">
                  {category.description}
                </p>
                <span className="text-[12px] text-brand-500">{category.articles} 篇文章</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Directory */}
      <section className="py-24 sm:py-32 bg-gradient-section">
        <div className="max-w-5xl mx-auto px-6">
          <div className="lobe-section-header">
            <h2>帮助中心目录</h2>
            <p>按主题浏览完整的帮助资料</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {helpDirectory.map((section) => (
              <div
                key={section.title}
                className={cn(
                  "p-6 rounded-2xl",
                  "bg-surface-100/30 border border-border/30"
                )}
              >
                <h3 className="text-[15px] font-semibold text-foreground mb-1">{section.title}</h3>
                <p className="text-[12px] text-foreground-lighter mb-4">
                  {section.description}
                </p>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="flex items-center gap-2 text-[13px] text-foreground-lighter hover:text-foreground transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        {link.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="py-24 sm:py-32">
        <div className="max-w-5xl mx-auto px-6">
          <div className="lobe-section-header">
            <h2>热门文章</h2>
            <p>最受欢迎的帮助文章</p>
          </div>

          <div className="space-y-2">
            {popularArticles.map((article) => (
              <Link
                key={article.title}
                href={article.href}
                className={cn(
                  "block p-5 rounded-xl group",
                  "bg-surface-100/30 border border-border/30",
                  "hover:bg-surface-100/60 hover:border-border/60",
                  "transition-all duration-300"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[14px] text-foreground group-hover:text-brand-500 transition-colors">
                    {article.title}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-foreground-lighter">
                      {article.views.toLocaleString()} 次查看
                    </span>
                    <ArrowRight className="w-4 h-4 text-foreground-lighter group-hover:text-foreground-light transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-24 sm:py-32 bg-gradient-section">
        <div className="max-w-5xl mx-auto px-6">
          <div className="lobe-section-header">
            <h2>快速链接</h2>
            <p>常用资源入口</p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { title: "API 文档", href: "/docs/api", icon: "📚" },
              { title: "视频教程", href: "/docs/tutorials", icon: "🎬" },
              { title: "FAQ 解答", href: "/faq", icon: "❓" },
              { title: "更新日志", href: "/whats-new", icon: "📝" },
            ].map((link) => (
              <Link
                key={link.title}
                href={link.href}
                className={cn(
                  "p-5 rounded-2xl text-center group",
                  "bg-surface-100/30 border border-border/30",
                  "hover:bg-surface-100/60 hover:border-border/60",
                  "transition-all duration-300"
                )}
              >
                <span className="text-2xl mb-3 block">{link.icon}</span>
                <span className="text-[14px] text-foreground group-hover:text-brand-500 transition-colors">
                  {link.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-24 sm:py-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-4">
            没有找到答案？
          </h2>
          <p className="text-foreground-light mb-10">
            联系我们的支持团队获取帮助
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {contactMethods.map((method) => (
              <a
                key={method.title}
                href={method.href}
                className={cn(
                  "p-6 rounded-2xl text-center group",
                  "bg-surface-100/30 border border-border/30",
                  "hover:bg-surface-100/60 hover:border-border/60",
                  "transition-all duration-300"
                )}
              >
                <div className="w-12 h-12 rounded-xl bg-surface-200/80 border border-border/30 flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform duration-300">
                  <method.icon className="w-6 h-6 text-foreground-light" />
                </div>
                <h3 className="text-[15px] font-semibold text-foreground mb-1">
                  {method.title}
                </h3>
                <p className="text-[12px] text-foreground-lighter mb-3">
                  {method.description}
                </p>
                <span className="text-[13px] text-brand-500 font-medium">
                  {method.action} →
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
