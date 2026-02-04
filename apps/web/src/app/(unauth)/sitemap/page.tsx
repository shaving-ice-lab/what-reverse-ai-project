"use client";

/**
 * 网站地图页面

 * Manus 风格：极简、大留白、清晰层? */

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Map,

  Home,

  Sparkles,

  CreditCard,

  Book,

  FileText,

  Users,

  Briefcase,

  Building,

  HelpCircle,

  Shield,

  Scale,

  Rocket,

  MessageSquare,

  Store,

  Activity,

  ArrowRight,

  ExternalLink,

  Code,

  Calendar,

  Puzzle,

  Palette,

  Newspaper,

  Mail,

  Layers,

  Compass,

  Search,
} from "lucide-react";

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/utils";

// 网站地图数据

const sitemapSections = [

  {
    title: "产品",

    icon: Home,

    color: "primary",

    links: [

      { name: "首页", href: "/" },

      { name: "功能介绍", href: "/features" },

      { name: "定价方案", href: "/pricing" },

      { name: "企业?", href: "/enterprise" },

      { name: "集成应用", href: "/dashboard/integrations" },

      { name: "模板市场", href: "/store" },

    ],

  },

  {
    title: "开发?", icon: Code,

    color: "#3B82F6",

    links: [

      { name: "开发者中?", href: "/developers" },

      { name: "文档中心", href: "/docs" },

      { name: "API 文档", href: "/docs/api" },

      { name: "SDK 下载", href: "/docs/sdk" },

      { name: "更新日志", href: "/changelog" },

      { name: "路线?", href: "/roadmap" },

    ],

  },

  {
    title: "资源",

    icon: Book,

    color: "#8B5CF6",

    links: [

      { name: "博客", href: "/blog" },

      { name: "帮助中心", href: "/help" },

      { name: "学习资源", href: "/learn/courses" },

      { name: "网络研讨会", href: "/webinars" },

      { name: "Newsletter", href: "/newsletter" },

    ],

  },

  {
    title: "社区",

    icon: Users,

    color: "#F59E0B",

    links: [

      { name: "社区首页", href: "/community" },

      { name: "作品展示", href: "/showcase" },

      { name: "使用案例", href: "/use-cases" },

      { name: "客户评价", href: "/testimonials" },

      { name: "案例研究", href: "/case-studies" },

      { name: "活动", href: "/events" },

    ],

  },

  {
    title: "公司",

    icon: Building,

    color: "#EC4899",

    links: [

      { name: "关于我们", href: "/about" },

      { name: "招聘", href: "/careers" },

      { name: "合作伙伴", href: "/partners" },

      { name: "媒体中心", href: "/press" },

      { name: "联系我们", href: "/contact" },

      { name: "最新动效", href: "/whats-new" },

    ],

  },

  {
    title: "支持",

    icon: HelpCircle,

    color: "#06B6D4",

    links: [

      { name: "常见问题", href: "/faq" },

      { name: "系统状态", href: "/status" },

      { name: "推荐计划", href: "/referral-program" },

      { name: "预约演示", href: "/demo" },

    ],

  },

  {
    title: "法律与安?", icon: Shield,

    color: "#EF4444",

    links: [

      { name: "服务条款", href: "/terms" },

      { name: "隐私政策", href: "/privacy" },

      { name: "安全中心", href: "/security" },

      { name: "品牌资源", href: "/brand" },

    ],

  },

  {
    title: "账户",

    icon: Users,

    color: "#10B981",

    links: [

      { name: "登录", href: "/login" },

      { name: "注册", href: "/register" },

    ],

  },

];

// 外部资源

const externalResources = [

  { name: "GitHub", href: "https://github.com/agentflow", icon: "🐙" },

  { name: "Discord 社区", href: "https://discord.gg/agentflow", icon: "💬" },

  { name: "Twitter / X", href: "https://twitter.com/agentflow", icon: "𝕏" },

  { name: "YouTube", href: "https://youtube.com/@agentflow", icon: "📺" },

  { name: "LinkedIn", href: "https://linkedin.com/company/agentflow", icon: "💼" },

];

export default function SitemapPage() {
  const [isLoaded, setIsLoaded] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setIsLoaded(true);

  }, []);

  // 搜搜索过滤

  const filteredSections = sitemapSections.map(section => ({
    ...section,

    links: section.links.filter(link => 

      link.name.toLowerCase().includes(searchQuery.toLowerCase())

    )

  })).filter(section => section.links.length > 0);

  const totalLinks = sitemapSections.reduce((sum, section) => sum + section.links.length, 0);

  return (
    <div className="min-h-screen bg-background">

      {/* Manus 风格背景 */}

      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">

        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,var(--color-background),var(--color-muted)/30)]" />

      </div>

      <SiteHeader />

      {/* Hero Section - Manus 风格 */}

      <section className="pt-20 sm:pt-32 pb-16 px-6">

        <div className="max-w-4xl mx-auto text-center">

          {/* 标签 */}

          <div className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-full",

            "bg-muted border border-border",

            "text-sm text-muted-foreground font-medium mb-8",

            "transition-all duration-500",

            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"

          )}>

            <Compass className="h-3.5 w-3.5" />

            Site Map

          </div>

          {/* 主标签*/}

          <h1 className={cn(
            "text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-6",

            "transition-all duration-700 delay-100",

            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"

          )}>

            Navigate

            <span className="text-primary"> AgentFlow</span>

          </h1>

          {/* 副标签*/}

          <p className={cn(
            "text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto mb-10",

            "transition-all duration-700 delay-200",

            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"

          )}>

            快速找到您需要的任何页面或资源          </p>

          {/* 搜搜索?*/}

          <div className={cn(
            "max-w-md mx-auto relative mb-12",

            "transition-all duration-700 delay-300",

            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"

          )}>

            <div className="relative group">

              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />

              <input

                type="text"

                placeholder="搜搜索页面..."

                value={searchQuery}

                onChange={(e) => setSearchQuery(e.target.value)}

                className={cn(
                  "w-full h-12 pl-11 pr-4 rounded-full",

                  "bg-card/50 backdrop-blur-sm",

                  "border border-border/50",

                  "text-sm placeholder:text-muted-foreground/60",

                  "focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none",

                  "transition-all duration-300"

                )}

              />

            </div>

          </div>

          {/* 统计 */}

          <div className={cn(
            "flex flex-wrap justify-center gap-8 text-sm",

            "transition-all duration-700 delay-400",

            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"

          )}>

            <div className="flex items-center gap-2">

              <Layers className="w-4 h-4 text-primary" />

              <span className="font-semibold text-foreground">{totalLinks}</span>

              <span className="text-muted-foreground">页面</span>

            </div>

            <div className="flex items-center gap-2">

              <Book className="w-4 h-4 text-primary" />

              <span className="font-semibold text-foreground">{sitemapSections.length}</span>

              <span className="text-muted-foreground">分类</span>

            </div>

            <div className="flex items-center gap-2">

              <ExternalLink className="w-4 h-4 text-primary" />

              <span className="font-semibold text-foreground">{externalResources.length}</span>

              <span className="text-muted-foreground">外部资源</span>

            </div>

          </div>

        </div>

      </section>

      {/* Sitemap Content - Manus 风格网格 */}

      <section className="py-20 px-6 bg-muted/30">

        <div className="max-w-6xl mx-auto">

          {searchQuery && filteredSections.length === 0 ? (
            <div className="text-center py-16">

              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">

                <Search className="w-8 h-8 text-muted-foreground" />

              </div>

              <h3 className="text-xl font-semibold text-foreground mb-2">

                没有找到 "{searchQuery}"

              </h3>

              <p className="text-muted-foreground mb-6">

                尝试使用其他关键词搜?              </p>

              <button

                onClick={() => setSearchQuery("")}

                className="px-6 py-2.5 rounded-full bg-foreground text-background hover:bg-foreground/90 text-sm font-medium transition-colors"

              >

                清除搜搜索

              </button>

            </div>

          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

              {(searchQuery ? filteredSections : sitemapSections).map((section, sectionIndex) => (
                <div

                  key={section.title}

                  className={cn(
                    "p-5 rounded-2xl bg-background border border-border",

                    "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",

                    "transition-all duration-300 animate-fadeInUp"

                  )}

                  style={{ animationDelay: `${sectionIndex * 50}ms` }}

                >

                  {/* 分类头部 */}

                  <div className="flex items-center gap-3 mb-5">

                    <div

                      className="w-9 h-9 rounded-xl flex items-center justify-center"

                      style={{ backgroundColor: `${section.color}12` }}

                    >

                      <section.icon

                        className="w-4.5 h-4.5"

                        style={{ color: section.color }}

                      />

                    </div>

                    <div>

                      <h2 className="font-semibold text-foreground text-sm">

                        {section.title}

                      </h2>

                      <span className="text-xs text-muted-foreground">

                        {section.links.length} 个页面                      </span>

                    </div>

                  </div>

                  {/* 链接列表 */}

                  <ul className="space-y-1">

                    {section.links.map((link) => (
                      <li key={link.href}>

                        <Link

                          href={link.href}

                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg",

                            "text-sm text-muted-foreground",

                            "hover:text-foreground hover:bg-muted/50",

                            "transition-all duration-200 group"

                          )}

                        >

                          <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />

                          <span className="group-hover:translate-x-1 transition-transform duration-200">

                            {link.name}

                          </span>

                        </Link>

                      </li>

                    ))}

                  </ul>

                </div>

              ))}

            </div>

          )}

        </div>

      </section>

      {/* External Resources - Manus 风格 */}

      <section className="py-20 px-6">

        <div className="max-w-4xl mx-auto">

          <div className="flex items-center gap-3 mb-8">

            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">

              <ExternalLink className="w-4 h-4 text-muted-foreground" />

            </div>

            <h2 className="font-semibold text-foreground">外部资源</h2>

          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">

            {externalResources.map((resource, index) => (
              <a

                key={resource.name}

                href={resource.href}

                target="_blank"

                rel="noopener noreferrer"

                className={cn(
                  "flex items-center gap-4 px-5 py-4 rounded-xl",

                  "bg-card border border-border",

                  "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",

                  "transition-all duration-300 group"

                )}

              >

                <span className="text-xl grayscale group-hover:grayscale-0 transition-all">{resource.icon}</span>

                <span className="text-foreground font-medium group-hover:text-primary transition-colors flex-1">

                  {resource.name}

                </span>

                <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />

              </a>

            ))}

          </div>

        </div>

      </section>

      {/* Help CTA - Manus 风格 */}

      <section className="py-20 px-6 bg-muted/30">

        <div className="max-w-2xl mx-auto text-center">

          <div className="w-12 h-12 rounded-2xl bg-foreground flex items-center justify-center mx-auto mb-6">

            <HelpCircle className="w-6 h-6 text-background" />

          </div>

          <h2 className="text-2xl font-bold text-foreground mb-3">

            Need help?

          </h2>

          <p className="text-muted-foreground mb-8">

            找不到您需要的内容？我们的支持团队随时为您提供帮助

          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">

            <Link href="/help">

              <button className="px-8 py-3 rounded-full bg-foreground text-background hover:bg-foreground/90 font-medium transition-colors">

                帮助中心

              </button>

            </Link>

            <Link href="/contact">

              <button className="px-8 py-3 rounded-full bg-background border border-border hover:border-foreground/20 text-foreground font-medium transition-colors">

                联系我们

              </button>

            </Link>

          </div>

        </div>

      </section>

      <SiteFooter />

    </div>

  );
}

