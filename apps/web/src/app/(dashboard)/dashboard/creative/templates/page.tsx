"use client";

/**
 * 创意模板页面
 * Supabase 风格：简约、专业、创意导向
 */

import { useState } from "react";
import Link from "next/link";
import {
  Palette,
  Plus,
  Search,
  Star,
  Clock,
  Users,
  Eye,
  Copy,
  Filter,
  LayoutGrid,
  List,
  Sparkles,
  FileText,
  Image as ImageIcon,
  Video,
  MessageSquare,
  Megaphone,
  Mail,
  Hash,
  ArrowRight,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// 模板分类
const categories = [
  { id: "all", name: "全部模板", icon: Sparkles },
  { id: "blog", name: "博客文章", icon: FileText },
  { id: "social", name: "社交媒体", icon: Hash },
  { id: "marketing", name: "营销文案", icon: Megaphone },
  { id: "email", name: "邮件模板", icon: Mail },
  { id: "product", name: "产品描述", icon: MessageSquare },
];

// 模板数据
const templates = [
  {
    id: "blog-seo",
    name: "SEO 优化博客文章",
    description: "生成 SEO 优化的长篇博客文章，包含关键词布局和元描述",
    category: "blog",
    icon: FileText,
    uses: 15234,
    rating: 4.9,
    tags: ["SEO", "博客", "长文"],
    featured: true,
    premium: false,
  },
  {
    id: "twitter-thread",
    name: "Twitter/X 长推文",
    description: "将长内容拆分为引人入胜的 Twitter 推文串",
    category: "social",
    icon: Hash,
    uses: 12500,
    rating: 4.8,
    tags: ["Twitter", "推文", "病毒营销"],
    featured: true,
    premium: false,
  },
  {
    id: "product-launch",
    name: "产品发布公告",
    description: "为新产品发布创建引人注目的公告文案",
    category: "marketing",
    icon: Megaphone,
    uses: 8900,
    rating: 4.7,
    tags: ["产品", "发布", "公告"],
    featured: true,
    premium: true,
  },
  {
    id: "cold-email",
    name: "冷邮件营销",
    description: "生成高转化率的冷邮件，提高回复率",
    category: "email",
    icon: Mail,
    uses: 7800,
    rating: 4.6,
    tags: ["邮件", "销售", "转化"],
    featured: false,
    premium: true,
  },
  {
    id: "instagram-caption",
    name: "Instagram 图片描述",
    description: "为 Instagram 帖子生成吸引人的图片描述和标签",
    category: "social",
    icon: ImageIcon,
    uses: 11200,
    rating: 4.8,
    tags: ["Instagram", "标签", "描述"],
    featured: false,
    premium: false,
  },
  {
    id: "product-description",
    name: "电商产品描述",
    description: "为电商产品生成专业、有说服力的描述",
    category: "product",
    icon: MessageSquare,
    uses: 9500,
    rating: 4.7,
    tags: ["电商", "产品", "描述"],
    featured: false,
    premium: false,
  },
  {
    id: "newsletter",
    name: "Newsletter 周报",
    description: "创建结构清晰、内容丰富的 Newsletter",
    category: "email",
    icon: Mail,
    uses: 5600,
    rating: 4.5,
    tags: ["Newsletter", "周报", "订阅"],
    featured: false,
    premium: false,
  },
  {
    id: "linkedin-post",
    name: "LinkedIn 专业帖子",
    description: "生成专业的 LinkedIn 帖子，提升职业影响力",
    category: "social",
    icon: Hash,
    uses: 8100,
    rating: 4.6,
    tags: ["LinkedIn", "职场", "专业"],
    featured: false,
    premium: true,
  },
  {
    id: "ad-copy",
    name: "广告文案",
    description: "为 Google Ads、Facebook Ads 生成高效广告文案",
    category: "marketing",
    icon: Megaphone,
    uses: 7200,
    rating: 4.7,
    tags: ["广告", "投放", "转化"],
    featured: false,
    premium: true,
  },
  {
    id: "how-to-guide",
    name: "操作指南",
    description: "创建详细的分步操作指南和教程",
    category: "blog",
    icon: FileText,
    uses: 6800,
    rating: 4.8,
    tags: ["教程", "指南", "步骤"],
    featured: false,
    premium: false,
  },
];

export default function CreativeTemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // 筛选模板
  const filteredTemplates = templates.filter((template) => {
    const matchesCategory =
      selectedCategory === "all" || template.category === selectedCategory;
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // 精选模板
  const featuredTemplates = templates.filter((t) => t.featured);

  return (
    <div className="flex-1 flex flex-col bg-background-studio">
      {/* 头部 */}
      <div className="border-b border-border bg-background-studio/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <p className="page-caption mb-3">Creative</p>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-page-title text-foreground">创意模板</h1>
              <p className="text-description">
                使用预设模板快速生成高质量内容
              </p>
            </div>
            <Link href="/dashboard/creative/generate">
              <Button className="bg-brand-500 hover:bg-brand-600 text-background">
                <Plus className="mr-2 w-4 h-4" />
                自定义生成
              </Button>
            </Link>
          </div>

          {/* 搜索和筛选 */}
          <div className="page-panel p-4 flex flex-wrap items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
              <Input
                placeholder="搜索模板..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-surface-200 border-border"
              />
            </div>
            <div className="ml-auto flex items-center rounded-md border border-border bg-surface-100 p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "h-8 w-8 rounded-md",
                  viewMode === "grid"
                    ? "bg-surface-200 text-foreground"
                    : "text-foreground-muted hover:bg-surface-200/70"
                )}
              >
                <LayoutGrid className="w-4 h-4 text-current" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "h-8 w-8 rounded-md",
                  viewMode === "list"
                    ? "bg-surface-200 text-foreground"
                    : "text-foreground-muted hover:bg-surface-200/70"
                )}
              >
                <List className="w-4 h-4 text-current" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 分类标签 */}
      <div className="border-b border-border bg-background-studio/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="page-panel p-2 flex items-center gap-2 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-medium whitespace-nowrap transition-all",
                  selectedCategory === category.id
                    ? "bg-brand-500/15 text-brand-500 border border-brand-400/40"
                    : "bg-surface-100 border border-border text-foreground-muted hover:text-foreground hover:bg-surface-200/60"
                )}
              >
                <category.icon className="w-4 h-4" />
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 内容 */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="page-divider" />
          {/* 精选模板 */}
          {selectedCategory === "all" && !searchQuery && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-4 h-4 text-warning" />
                <h2 className="text-sm font-medium text-foreground">
                  精选模板
                </h2>
              </div>
              <div className="page-grid md:grid-cols-3">
                {featuredTemplates.map((template) => (
                  <Link
                    key={template.id}
                    href={`/dashboard/creative/generate?template=${template.id}`}
                    className={cn(
                      "group p-5 rounded-md",
                      "bg-surface-100 border border-brand-400/30",
                      "hover:border-brand-500 hover:bg-surface-75",
                      "transition-supabase"
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-9 h-9 rounded-md bg-brand-200 flex items-center justify-center">
                        <template.icon className="w-4 h-4 text-brand-500" />
                      </div>
                      {template.premium && (
                        <span className="px-2 py-0.5 rounded-md bg-warning-200 text-warning text-xs font-medium">
                          Premium
                        </span>
                      )}
                    </div>
                    <h3 className="text-[13px] font-semibold text-foreground mb-1 group-hover:text-brand-500 transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-xs text-foreground-muted mb-3 line-clamp-2">
                      {template.description}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-foreground-muted">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {(template.uses / 1000).toFixed(1)}k 使用
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-warning" />
                        {template.rating}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 模板列表 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-foreground">
                {selectedCategory === "all"
                  ? "全部模板"
                  : categories.find((c) => c.id === selectedCategory)?.name}
              </h2>
              <span className="text-xs text-foreground-muted">
                {filteredTemplates.length} 个模板
              </span>
            </div>

            {filteredTemplates.length > 0 ? (
              viewMode === "grid" ? (
                <div className="page-grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredTemplates.map((template) => (
                    <Link
                      key={template.id}
                      href={`/dashboard/creative/generate?template=${template.id}`}
                      className={cn(
                        "group p-4 rounded-md",
                        "bg-surface-100 border border-border",
                        "hover:border-border-strong hover:bg-surface-75",
                        "transition-all"
                      )}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-9 h-9 rounded-md bg-surface-200 flex items-center justify-center">
                          <template.icon className="w-4 h-4 text-foreground-muted" />
                        </div>
                        {template.premium && (
                          <span className="px-1.5 py-0.5 rounded-md bg-warning-200 text-warning text-[10px] font-medium">
                            Pro
                          </span>
                        )}
                      </div>
                      <h3 className="text-[13px] font-medium text-foreground mb-1 group-hover:text-brand-500 transition-colors">
                        {template.name}
                      </h3>
                      <p className="text-xs text-foreground-muted mb-3 line-clamp-2">
                        {template.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {template.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 rounded-md bg-surface-200 text-[10px] text-foreground-muted"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-foreground-muted">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {(template.uses / 1000).toFixed(1)}k
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-warning" />
                          {template.rating}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTemplates.map((template) => (
                    <Link
                      key={template.id}
                      href={`/dashboard/creative/generate?template=${template.id}`}
                      className={cn(
                        "group flex items-center gap-4 p-4 rounded-md",
                        "bg-surface-100 border border-border",
                        "hover:border-border-strong hover:bg-surface-75",
                        "transition-all"
                      )}
                    >
                      <div className="w-9 h-9 rounded-md bg-surface-200 flex items-center justify-center shrink-0">
                        <template.icon className="w-4 h-4 text-foreground-muted" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-[13px] font-medium text-foreground group-hover:text-brand-500 transition-colors">
                            {template.name}
                          </h3>
                          {template.premium && (
                            <span className="px-1.5 py-0.5 rounded-md bg-warning-200 text-warning text-[10px] font-medium">
                              Pro
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-foreground-muted truncate">
                          {template.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-foreground-muted shrink-0">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {(template.uses / 1000).toFixed(1)}k
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-warning" />
                          {template.rating}
                        </span>
                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-16">
                <Palette className="w-10 h-10 text-foreground-muted mx-auto mb-4" />
                <h3 className="text-sm font-medium text-foreground mb-2">
                  没有找到匹配的模板
                </h3>
                <p className="text-[13px] text-foreground-muted mb-6">
                  尝试使用其他关键词或选择其他分类
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                  }}
                  className="border-border text-foreground-light"
                >
                  查看全部模板
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
