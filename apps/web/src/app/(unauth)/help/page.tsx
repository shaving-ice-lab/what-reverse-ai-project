"use client";

/**
 * 帮助中心页面 - Manus 风格
 */

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  HelpCircle,
  BookOpen,
  MessageSquare,
  Zap,
  Users,
  Settings,
  Shield,
  CreditCard,
  ArrowRight,
  ExternalLink,
  Mail,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/layout/site-header";
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

// 热门文章
const popularArticles = [
  { title: "如何创建第一个工作流", views: 12500, href: "/docs/guide/first-workflow" },
  { title: "连接 Slack 发送通知", views: 8900, href: "/docs/integrations/slack" },
  { title: "设置定时触发器", views: 7600, href: "/docs/guide/triggers" },
  { title: "邀请团队成员", views: 5400, href: "/docs/guide/team" },
  { title: "设置 Webhook 触发器", views: 4800, href: "/docs/integrations/webhook" },
];

// 联系方式
const contactMethods = [
  {
    icon: MessageSquare,
    title: "在线客服",
    description: "实时在线支持",
    action: "开始对话",
    href: "#chat",
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
      <section className="relative pt-20 pb-16 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight mb-6">
            帮助中心
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            搜索常见问题解答，或浏览下方分类
          </p>

          {/* Search */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="搜索帮助文章..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-full"
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-semibold text-foreground mb-6">帮助分类</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <Link
                key={category.title}
                href={category.href}
                className={cn(
                  "p-6 rounded-2xl",
                  "bg-card border border-border",
                  "hover:border-primary/30 hover:shadow-lg",
                  "transition-all duration-300 group"
                )}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <category.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                  {category.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {category.description}
                </p>
                <span className="text-xs text-primary">{category.articles} 篇文章</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="py-12 px-6 bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-semibold text-foreground mb-6">热门文章</h2>
          <div className="space-y-3">
            {popularArticles.map((article) => (
              <Link
                key={article.title}
                href={article.href}
                className={cn(
                  "block p-4 rounded-xl",
                  "bg-card border border-border",
                  "hover:border-primary/30",
                  "transition-all duration-300 group"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-foreground group-hover:text-primary transition-colors">
                    {article.title}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {article.views.toLocaleString()} 次查看
                    </span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-semibold text-foreground mb-6">快速链接</h2>
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
                  "p-4 rounded-xl text-center",
                  "bg-card border border-border",
                  "hover:border-primary/30",
                  "transition-all duration-300 group"
                )}
              >
                <span className="text-2xl mb-2 block">{link.icon}</span>
                <span className="text-foreground group-hover:text-primary transition-colors">
                  {link.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-12 px-6 bg-muted/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            没有找到答案？
          </h2>
          <p className="text-muted-foreground mb-8">
            联系我们的支持团队获取帮助
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {contactMethods.map((method) => (
              <a
                key={method.title}
                href={method.href}
                className={cn(
                  "p-6 rounded-2xl text-center",
                  "bg-card border border-border",
                  "hover:border-primary/30 hover:shadow-lg",
                  "transition-all duration-300"
                )}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <method.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">
                  {method.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {method.description}
                </p>
                <span className="text-sm text-primary font-medium">
                  {method.action} →
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground">
          <p>&copy; 2026 AgentFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
