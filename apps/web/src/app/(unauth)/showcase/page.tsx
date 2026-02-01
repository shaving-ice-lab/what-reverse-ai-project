"use client";

/**
 * 展示页面 - 社区精选工作流
 */

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Star,
  Eye,
  Copy,
  ArrowRight,
  Sparkles,
  Filter,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/layout/site-header";
import { cn } from "@/lib/utils";

// 展示作品
const showcaseItems = [
  {
    id: "1",
    title: "智能客服自动化系统",
    description: "7x24 小时自动回复客户问题，支持多渠道接入，处理效率提升 300%",
    author: "某电商公司",
    category: "客服",
    views: 12500,
    stars: 456,
    icon: "🤖",
    featured: true,
  },
  {
    id: "2",
    title: "GitHub PR 自动化审核",
    description: "自动审核 Pull Request，检查代码质量和规范，减少人工审核时间",
    author: "DevOps 工程师小张",
    category: "开发",
    views: 8900,
    stars: 342,
    icon: "🔍",
    featured: true,
  },
  {
    id: "3",
    title: "社交媒体内容管理器",
    description: "自动发布内容到多个社交媒体平台，支持定时发布和数据分析",
    author: "内容创作者小李",
    category: "营销",
    views: 7600,
    stars: 289,
    icon: "📱",
    featured: false,
  },
  {
    id: "4",
    title: "财务报表自动化",
    description: "自动汇总财务数据，生成标准化报表，与 ERP 系统无缝对接",
    author: "某金融公司",
    category: "财务",
    views: 6700,
    stars: 234,
    icon: "📊",
    featured: true,
  },
  {
    id: "5",
    title: "Bug 智能分流机器人",
    description: "自动分类和分配 Bug 给相应的开发人员，提高问题解决效率",
    author: "技术团队",
    category: "开发",
    views: 5400,
    stars: 198,
    icon: "🐛",
    featured: false,
  },
  {
    id: "6",
    title: "销售线索自动评分",
    description: "自动评估销售线索质量，优先跟进高价值客户，提升转化率",
    author: "销售团队",
    category: "销售",
    views: 4800,
    stars: 176,
    icon: "📈",
    featured: false,
  },
];

// 分类
const categories = ["全部", "客服", "开发", "营销", "财务", "销售"];

export default function ShowcasePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("全部");

  const filteredItems = showcaseItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      activeCategory === "全部" || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative pt-20 pb-16 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-8">
            <Sparkles className="h-4 w-4" />
            社区精选
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight mb-6">
            工作流展示
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            探索社区成员创建的优秀工作流，获取灵感和最佳实践
          </p>

          {/* Search */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="搜索工作流..."
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
                key={category}
                onClick={() => setActiveCategory(category)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all",
                  activeCategory === category
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Showcase Grid */}
      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "p-6 rounded-2xl",
                  "bg-card border border-border",
                  "hover:border-primary/30 hover:shadow-lg",
                  "transition-all duration-300 group"
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl">
                    {item.icon}
                  </div>
                  {item.featured && (
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      精选
                    </span>
                  )}
                </div>

                <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {item.description}
                </p>

                <div className="text-xs text-muted-foreground mb-4">
                  by {item.author}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {(item.views / 1000).toFixed(1)}k
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5" />
                      {item.stars}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-muted text-xs">
                    {item.category}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-16">
              <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                没有找到匹配的工作流
              </h3>
              <p className="text-muted-foreground">
                尝试调整筛选条件或搜索关键词
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-muted/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            分享您的工作流
          </h2>
          <p className="text-muted-foreground mb-6">
            将您的创意分享给社区，帮助更多人提升效率
          </p>
          <Link href="/workflows/new">
            <Button size="lg" className="rounded-full">
              提交作品
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
