"use client";

/**
 * 文档首页 - Manus 风格
 */

import Link from "next/link";
import {
  BookOpen,
  Code,
  Rocket,
  Puzzle,
  Settings,
  Shield,
  FileText,
  Video,
  MessageSquare,
  Search,
  ArrowRight,
  Zap,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/layout/site-header";
import { cn } from "@/lib/utils";

// 快速入门
const quickLinks = [
  {
    icon: Rocket,
    title: "5 分钟快速开始",
    description: "从零开始创建您的第一个工作流",
    href: "/docs/getting-started",
  },
  {
    icon: BookOpen,
    title: "核心概念",
    description: "了解工作流、节点、触发器等核心概念",
    href: "/docs/concepts",
  },
  {
    icon: Video,
    title: "视频教程",
    description: "通过视频快速掌握使用技巧",
    href: "/docs/tutorials",
  },
];

// 文档分类
const categories = [
  {
    title: "使用指南",
    icon: BookOpen,
    description: "学习如何使用 AgentFlow",
    links: [
      { title: "创建工作流", href: "/docs/guide/workflows" },
      { title: "使用 AI Agent", href: "/docs/guide/agents" },
      { title: "设置触发器", href: "/docs/guide/triggers" },
      { title: "数据处理", href: "/docs/guide/data" },
    ],
  },
  {
    title: "集成指南",
    icon: Puzzle,
    description: "连接第三方服务",
    links: [
      { title: "Slack 集成", href: "/docs/integrations/slack" },
      { title: "GitHub 集成", href: "/docs/integrations/github" },
      { title: "数据库连接", href: "/docs/integrations/database" },
      { title: "自定义 Webhook", href: "/docs/integrations/webhook" },
    ],
  },
  {
    title: "API 参考",
    icon: Code,
    description: "完整的 API 文档",
    links: [
      { title: "REST API", href: "/docs/api/rest" },
      { title: "工作流 API", href: "/docs/api/workflows" },
      { title: "Agent API", href: "/docs/api/agents" },
      { title: "Webhook API", href: "/docs/api/webhooks" },
    ],
  },
  {
    title: "高级主题",
    icon: Settings,
    description: "深入了解高级功能",
    links: [
      { title: "自定义节点", href: "/docs/advanced/custom-nodes" },
      { title: "性能优化", href: "/docs/advanced/performance" },
      { title: "错误处理", href: "/docs/advanced/error-handling" },
      { title: "私有化部署", href: "/docs/advanced/self-hosted" },
    ],
  },
];

// 热门文章
const popularArticles = [
  { title: "如何创建第一个 AI 工作流", href: "/docs/guide/first-workflow" },
  { title: "常用集成配置指南", href: "/docs/integrations/guide" },
  { title: "工作流性能优化技巧", href: "/docs/advanced/performance" },
  { title: "API 认证与授权", href: "/docs/api/authentication" },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative pt-20 pb-16 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight mb-6">
            文档中心
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            从入门到精通，这里有您需要的一切资料
          </p>

          {/* Search */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="搜索文档..."
              className="pl-12 h-12 rounded-full"
            />
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-semibold text-foreground mb-6">快速入门</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {quickLinks.map((link) => (
              <Link
                key={link.title}
                href={link.href}
                className={cn(
                  "group p-6 rounded-2xl",
                  "bg-card border border-border",
                  "hover:border-primary/30 hover:shadow-lg",
                  "transition-all duration-300"
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <link.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {link.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {link.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 px-6 bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-semibold text-foreground mb-6">文档分类</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {categories.map((category) => (
              <div
                key={category.title}
                className="p-6 rounded-2xl bg-card border border-border"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <category.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {category.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {category.links.map((link) => (
                    <li key={link.title}>
                      <Link
                        href={link.href}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        <FileText className="w-4 h-4" />
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
      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-semibold text-foreground mb-6">热门文章</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {popularArticles.map((article) => (
              <Link
                key={article.title}
                href={article.href}
                className={cn(
                  "p-4 rounded-xl",
                  "bg-card border border-border",
                  "hover:border-primary/30",
                  "transition-all duration-300 group"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-foreground group-hover:text-primary transition-colors">
                    {article.title}
                  </span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Help */}
      <section className="py-16 px-6 bg-muted/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            需要更多帮助？
          </h2>
          <p className="text-muted-foreground mb-6">
            加入我们的社区或联系支持团队
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/community">
              <Button variant="outline" className="rounded-full">
                <Users className="w-4 h-4 mr-2" />
                加入社区
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="rounded-full">
                <MessageSquare className="w-4 h-4 mr-2" />
                联系支持
              </Button>
            </Link>
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
