"use client";

/**
 * 模板市场页面 - Manus 风格
 */

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Star,
  Download,
  ArrowRight,
  Sparkles,
  Zap,
  Bot,
  Code,
  FileText,
  MessageSquare,
  BarChart3,
  Mail,
  Users,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/layout/site-header";
import { cn } from "@/lib/utils";

// 分类
const categories = [
  { id: "all", name: "全部", icon: Sparkles },
  { id: "automation", name: "自动化", icon: Zap },
  { id: "ai", name: "AI 助手", icon: Bot },
  { id: "data", name: "数据处理", icon: BarChart3 },
  { id: "communication", name: "通讯", icon: MessageSquare },
  { id: "development", name: "开发", icon: Code },
];

// 模板数据
const templates = [
  {
    id: "1",
    name: "智能客服机器人",
    description: "7x24 小时自动回复客户问题，支持多渠道接入",
    category: "ai",
    author: "AgentFlow",
    rating: 4.9,
    downloads: 12500,
    icon: "🤖",
    tags: ["客服", "AI", "自动化"],
    featured: true,
  },
  {
    id: "2",
    name: "GitHub PR 自动审核",
    description: "自动审核 Pull Request，检查代码质量和规范",
    category: "development",
    author: "DevTools",
    rating: 4.8,
    downloads: 8900,
    icon: "🔍",
    tags: ["GitHub", "代码审核", "CI/CD"],
    featured: true,
  },
  {
    id: "3",
    name: "社交媒体内容发布",
    description: "一键发布内容到多个社交媒体平台",
    category: "automation",
    author: "ContentAI",
    rating: 4.7,
    downloads: 6700,
    icon: "📱",
    tags: ["社交媒体", "内容", "自动化"],
    featured: false,
  },
  {
    id: "4",
    name: "销售线索评分",
    description: "自动评估销售线索质量，优先跟进高价值客户",
    category: "data",
    author: "SalesBot",
    rating: 4.6,
    downloads: 5400,
    icon: "📊",
    tags: ["销售", "CRM", "数据分析"],
    featured: false,
  },
  {
    id: "5",
    name: "邮件自动回复",
    description: "智能分类邮件并自动发送回复",
    category: "communication",
    author: "MailBot",
    rating: 4.8,
    downloads: 7800,
    icon: "📧",
    tags: ["邮件", "自动化", "效率"],
    featured: true,
  },
  {
    id: "6",
    name: "数据报表生成器",
    description: "自动汇总数据并生成可视化报表",
    category: "data",
    author: "DataViz",
    rating: 4.7,
    downloads: 6100,
    icon: "📈",
    tags: ["数据", "报表", "可视化"],
    featured: false,
  },
  {
    id: "7",
    name: "会议纪要生成器",
    description: "将会议录音转化为结构化的会议纪要",
    category: "ai",
    author: "MeetingAI",
    rating: 4.9,
    downloads: 9200,
    icon: "📝",
    tags: ["会议", "AI", "语音转文字"],
    featured: true,
  },
  {
    id: "8",
    name: "Bug 分流机器人",
    description: "自动分类和分配 Bug 给相应的开发人员",
    category: "development",
    author: "BugBot",
    rating: 4.5,
    downloads: 4300,
    icon: "🐛",
    tags: ["Bug", "项目管理", "自动化"],
    featured: false,
  },
];

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      activeCategory === "all" || template.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredTemplates = templates.filter((t) => t.featured);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative pt-20 pb-16 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-8">
            <Sparkles className="h-4 w-4" />
            120+ 精选模板
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight mb-6">
            模板市场
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            从精选模板开始，快速构建您的自动化工作流
          </p>

          {/* Search */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="搜索模板..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-full"
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                  activeCategory === category.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <category.icon className="w-4 h-4" />
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      {activeCategory === "all" && searchQuery === "" && (
        <section className="py-12 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl font-semibold text-foreground mb-6">
              精选推荐
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredTemplates.map((template) => (
                <Link
                  key={template.id}
                  href={`/templates/${template.id}`}
                  className={cn(
                    "group p-5 rounded-2xl",
                    "bg-card border border-border",
                    "hover:border-primary/30 hover:shadow-lg",
                    "transition-all duration-300"
                  )}
                >
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl mb-4">
                    {template.icon}
                  </div>
                  <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {template.description}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                      {template.rating}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="w-3.5 h-3.5" />
                      {(template.downloads / 1000).toFixed(1)}k
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Templates */}
      <section className="py-12 px-6 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              {activeCategory === "all" ? "所有模板" : categories.find((c) => c.id === activeCategory)?.name}
            </h2>
            <span className="text-sm text-muted-foreground">
              {filteredTemplates.length} 个模板
            </span>
          </div>

          {filteredTemplates.length === 0 ? (
            <div className="text-center py-16">
              <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                没有找到匹配的模板
              </h3>
              <p className="text-muted-foreground mb-6">
                尝试调整筛选条件或搜索关键词
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("all");
                }}
              >
                清除筛选
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTemplates.map((template) => (
                <Link
                  key={template.id}
                  href={`/templates/${template.id}`}
                  className={cn(
                    "group p-5 rounded-2xl",
                    "bg-card border border-border",
                    "hover:border-primary/30 hover:shadow-lg",
                    "transition-all duration-300"
                  )}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl">
                      {template.icon}
                    </div>
                    {template.featured && (
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        精选
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {template.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {template.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <span className="text-xs text-muted-foreground">
                      by {template.author}
                    </span>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                        {template.rating}
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="w-3.5 h-3.5" />
                        {(template.downloads / 1000).toFixed(1)}k
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            找不到合适的模板？
          </h2>
          <p className="text-muted-foreground mb-6">
            从零开始创建您的自定义工作流
          </p>
          <Link href="/dashboard/workflows/new">
            <Button size="lg" className="rounded-full">
              创建工作流
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
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
