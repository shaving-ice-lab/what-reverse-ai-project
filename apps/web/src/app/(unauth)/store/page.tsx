"use client";

/**
 * Agent 商店页面 - Manus 风格
 */

import { useState, useEffect } from "react";
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
  Clock,
  Users,
  CheckCircle,
  ChevronDown,
  Grid,
  List,
  TrendingUp,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/layout/site-header";
import { cn } from "@/lib/utils";

// 分类数据
const categories = [
  { id: "all", name: "全部", icon: Grid, count: 256 },
  { id: "ai-writing", name: "AI 写作", icon: FileText, count: 45 },
  { id: "data-analysis", name: "数据分析", icon: BarChart3, count: 38 },
  { id: "automation", name: "自动化", icon: Zap, count: 52 },
  { id: "code-assistant", name: "代码助手", icon: Code, count: 34 },
  { id: "customer-service", name: "客服机器人", icon: MessageSquare, count: 28 },
  { id: "content-creation", name: "内容创作", icon: Sparkles, count: 41 },
];

// 热门标签
const trendingTags = [
  { name: "AI 写作", count: 128, hot: true },
  { name: "数据分析", count: 95, hot: true },
  { name: "自动化", count: 87, hot: false },
  { name: "代码助手", count: 76, hot: true },
  { name: "客服机器人", count: 65, hot: false },
  { name: "图像处理", count: 58, hot: false },
];

// 模拟 Agent 数据
const mockAgents = [
  {
    id: "1",
    name: "智能写作助手",
    description: "基于 GPT-4 的智能写作助手，支持多种文体和风格",
    icon: "✍️",
    category: "AI 写作",
    author: "AI Lab",
    rating: 4.9,
    downloads: 12500,
    price: "free",
    tags: ["写作", "AI", "GPT-4"],
    featured: true,
  },
  {
    id: "2",
    name: "数据可视化大师",
    description: "一键将数据转化为精美图表，支持多种图表类型",
    icon: "📊",
    category: "数据分析",
    author: "DataViz",
    rating: 4.8,
    downloads: 8900,
    price: "free",
    tags: ["数据", "图表", "可视化"],
    featured: true,
  },
  {
    id: "3",
    name: "代码审查专家",
    description: "自动审查代码质量，发现潜在问题和优化建议",
    icon: "🔍",
    category: "代码助手",
    author: "DevTools",
    rating: 4.7,
    downloads: 6700,
    price: 29,
    tags: ["代码", "审查", "质量"],
    featured: false,
  },
  {
    id: "4",
    name: "智能客服机器人",
    description: "7x24 小时在线客服，智能回复客户问题",
    icon: "🤖",
    category: "客服机器人",
    author: "ServiceBot",
    rating: 4.6,
    downloads: 5400,
    price: 49,
    tags: ["客服", "自动回复", "AI"],
    featured: true,
  },
  {
    id: "5",
    name: "SEO 优化助手",
    description: "分析网站 SEO 问题，提供优化建议",
    icon: "🔎",
    category: "内容创作",
    author: "SEO Pro",
    rating: 4.5,
    downloads: 4200,
    price: "free",
    tags: ["SEO", "优化", "网站"],
    featured: false,
  },
  {
    id: "6",
    name: "邮件自动化",
    description: "自动处理邮件，智能分类和回复",
    icon: "📧",
    category: "自动化",
    author: "MailBot",
    rating: 4.8,
    downloads: 7800,
    price: "free",
    tags: ["邮件", "自动化", "效率"],
    featured: true,
  },
  {
    id: "7",
    name: "翻译助手",
    description: "支持 100+ 语言的智能翻译，保持原文风格",
    icon: "🌐",
    category: "AI 写作",
    author: "TransAI",
    rating: 4.9,
    downloads: 11200,
    price: "free",
    tags: ["翻译", "多语言", "AI"],
    featured: false,
  },
  {
    id: "8",
    name: "会议纪要生成器",
    description: "自动将会议录音转化为结构化的会议纪要",
    icon: "📝",
    category: "自动化",
    author: "MeetingAI",
    rating: 4.7,
    downloads: 6100,
    price: 39,
    tags: ["会议", "纪要", "语音转文字"],
    featured: false,
  },
];

// 统计数据
const stats = [
  { label: "活跃 Agent", value: "256+", icon: Bot },
  { label: "总下载量", value: "1.2M+", icon: Download },
  { label: "活跃用户", value: "50K+", icon: Users },
  { label: "用户满意度", value: "98%", icon: Heart },
];

export default function StorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // 筛选 Agents
  const filteredAgents = mockAgents.filter((agent) => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || 
      agent.category === categories.find(c => c.id === activeCategory)?.name;
    const matchesPrice = priceFilter === "all" ||
      (priceFilter === "free" && agent.price === "free") ||
      (priceFilter === "paid" && agent.price !== "free");
    return matchesSearch && matchesCategory && matchesPrice;
  });

  // 排序
  const sortedAgents = [...filteredAgents].sort((a, b) => {
    if (sortBy === "popular") return b.downloads - a.downloads;
    if (sortBy === "rating") return b.rating - a.rating;
    if (sortBy === "newest") return 0; // 模拟数据没有日期
    return 0;
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative pt-16 pb-12 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-10">
            <div
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full",
                "bg-primary/10 border border-primary/20",
                "text-sm text-primary font-medium mb-6",
                "transition-all duration-700",
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
            >
              <Sparkles className="h-4 w-4" />
              发现优质 AI Agent
            </div>

            <h1
              className={cn(
                "text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-4",
                "transition-all duration-700 delay-100",
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
            >
              Agent 商店
            </h1>

            <p
              className={cn(
                "text-lg text-muted-foreground max-w-2xl mx-auto mb-8",
                "transition-all duration-700 delay-200",
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
            >
              探索由社区创建的优质 AI Agent，一键使用，快速构建你的自动化工作流
            </p>

            {/* 搜索框 */}
            <div
              className={cn(
                "max-w-xl mx-auto",
                "transition-all duration-700 delay-300",
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="搜索 Agent..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 h-12 rounded-full bg-card border-border"
                />
              </div>
            </div>
          </div>

          {/* 统计数据 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="text-center p-4 rounded-xl bg-card/50 border border-border"
              >
                <stat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* 侧边栏 - 分类 */}
            <aside className="lg:w-64 shrink-0">
              <div className="sticky top-24 space-y-6">
                {/* 分类 */}
                <div className="p-4 rounded-xl bg-card border border-border">
                  <h3 className="font-semibold text-foreground mb-4">分类</h3>
                  <nav className="space-y-1">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setActiveCategory(category.id)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                          activeCategory === category.id
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <category.icon className="w-4 h-4" />
                          {category.name}
                        </span>
                        <span className="text-xs">{category.count}</span>
                      </button>
                    ))}
                  </nav>
                </div>

                {/* 价格筛选 */}
                <div className="p-4 rounded-xl bg-card border border-border">
                  <h3 className="font-semibold text-foreground mb-4">价格</h3>
                  <div className="space-y-2">
                    {[
                      { id: "all", label: "全部" },
                      { id: "free", label: "免费" },
                      { id: "paid", label: "付费" },
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setPriceFilter(option.id)}
                        className={cn(
                          "w-full px-3 py-2 rounded-lg text-sm text-left transition-colors",
                          priceFilter === option.id
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 热门标签 */}
                <div className="p-4 rounded-xl bg-card border border-border">
                  <h3 className="font-semibold text-foreground mb-4">热门标签</h3>
                  <div className="flex flex-wrap gap-2">
                    {trendingTags.map((tag) => (
                      <span
                        key={tag.name}
                        className={cn(
                          "px-2.5 py-1 rounded-full text-xs",
                          tag.hot
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Agent 列表 */}
            <main className="flex-1">
              {/* 排序栏 */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-muted-foreground">
                  共 {sortedAgents.length} 个 Agent
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">排序:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="h-9 px-3 rounded-lg bg-card border border-border text-sm"
                  >
                    <option value="popular">最热门</option>
                    <option value="rating">评分最高</option>
                    <option value="newest">最新</option>
                  </select>
                </div>
              </div>

              {/* Agent 网格 */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {sortedAgents.map((agent) => (
                  <Link
                    key={agent.id}
                    href={`/store/${agent.id}`}
                    className={cn(
                      "group p-5 rounded-2xl",
                      "bg-card border border-border",
                      "hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5",
                      "transition-all duration-300"
                    )}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl">
                        {agent.icon}
                      </div>
                      {agent.featured && (
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                          精选
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {agent.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {agent.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {agent.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                          {agent.rating}
                        </span>
                        <span className="flex items-center gap-1">
                          <Download className="w-3.5 h-3.5" />
                          {agent.downloads > 1000
                            ? `${(agent.downloads / 1000).toFixed(1)}k`
                            : agent.downloads}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "text-sm font-medium",
                          agent.price === "free" ? "text-primary" : "text-foreground"
                        )}
                      >
                        {agent.price === "free" ? "免费" : `¥${agent.price}`}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>

              {/* 空状态 */}
              {sortedAgents.length === 0 && (
                <div className="text-center py-16">
                  <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    没有找到匹配的 Agent
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    尝试调整筛选条件或搜索关键词
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setActiveCategory("all");
                      setPriceFilter("all");
                    }}
                  >
                    清除筛选
                  </Button>
                </div>
              )}
            </main>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 bg-muted/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
            成为 Agent 创作者
          </h2>
          <p className="text-muted-foreground mb-6">
            分享你的 Agent，获得创作者收益，加入我们的开发者社区
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/creator">
              <Button size="lg" className="rounded-full">
                开始创作
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/docs">
              <Button size="lg" variant="outline" className="rounded-full">
                查看文档
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
