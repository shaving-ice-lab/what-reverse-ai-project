"use client";

/**
 * Marketplace Store shared content (public + dashboard)
 * - Public wrapper: renders SiteHeader + footer outside this component
 * - Dashboard wrapper: renders inside /dashboard layout
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Star,
  ArrowRight,
  Sparkles,
  Bot,
  Grid,
  TrendingUp,
  Users,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { marketplaceApi, type MarketplaceApp } from "@/lib/api/marketplace";
import { toast } from "sonner";

const priceOptions = [
  { id: "all", label: "全部" },
  { id: "free", label: "免费" },
  { id: "paid", label: "付费" },
] as const;

const formatNumber = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 10000) return `${(value / 10000).toFixed(1)}W`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return String(value);
};

const formatRating = (value: number) => {
  if (!value) return "0.0";
  return value.toFixed(1);
};

export type MarketplaceStoreVariant = "public" | "dashboard";

export function MarketplaceStoreContent({ variant }: { variant: MarketplaceStoreVariant }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [priceFilter, setPriceFilter] = useState<"all" | "free" | "paid">("all");
  const [sortBy, setSortBy] = useState<"popular" | "rating" | "newest">("popular");
  const [isLoaded, setIsLoaded] = useState(false);
  const [apps, setApps] = useState<MarketplaceApp[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ratingTarget, setRatingTarget] = useState<MarketplaceApp | null>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const loadApps = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await marketplaceApi.listApps({
        search: searchQuery || undefined,
        pricing: priceFilter === "all" ? undefined : priceFilter,
        sort: sortBy,
        page: 1,
        page_size: 60,
      });
      const list = response.data?.apps || [];
      setApps(list);
      setTotal(response.meta?.total ?? list.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载应用失败");
    } finally {
      setIsLoading(false);
    }
  }, [priceFilter, searchQuery, sortBy]);

  useEffect(() => {
    loadApps();
  }, [loadApps]);

  const workspaceCount = useMemo(() => {
    const ids = apps.map((app) => app.workspace?.id).filter(Boolean);
    return new Set(ids).size;
  }, [apps]);

  const totalRatings = useMemo(
    () => apps.reduce((sum, app) => sum + (app.rating_count || 0), 0),
    [apps]
  );

  const averageRating = useMemo(() => {
    if (!totalRatings) return 0;
    const weighted = apps.reduce((sum, app) => sum + app.rating_avg * app.rating_count, 0);
    return weighted / totalRatings;
  }, [apps, totalRatings]);

  const stats = useMemo(
    () => [
      { label: "上架应用", value: formatNumber(total || apps.length), icon: Grid },
      { label: "公开工作空间", value: formatNumber(workspaceCount), icon: Users },
      { label: "累计评分", value: formatNumber(totalRatings), icon: TrendingUp },
      { label: "平均评分", value: formatRating(averageRating), icon: Star },
    ],
    [apps.length, averageRating, total, totalRatings, workspaceCount]
  );

  const filteredApps = useMemo(() => {
    let filtered = [...apps];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((app) => {
        return (
          app.name.toLowerCase().includes(q) ||
          app.description.toLowerCase().includes(q) ||
          app.tags?.some((tag) => tag.toLowerCase().includes(q))
        );
      });
    }
    if (priceFilter !== "all") {
      filtered = filtered.filter((app) => {
        return priceFilter === "free" ? app.price === 0 : app.price > 0;
      });
    }
    if (sortBy === "rating") {
      filtered.sort((a, b) => b.rating_avg - a.rating_avg);
    } else if (sortBy === "newest") {
      filtered.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
    } else {
      filtered.sort((a, b) => (b.download_count || 0) - (a.download_count || 0));
    }
    return filtered;
  }, [apps, priceFilter, searchQuery, sortBy]);

  const handleSubmitRating = useCallback(async () => {
    if (!ratingTarget) return;
    setIsSubmittingRating(true);
    try {
      await marketplaceApi.submitRating(ratingTarget.id, {
        rating: ratingValue,
        comment: ratingComment.trim() || undefined,
      });
      toast.success("评分已提交");
      setRatingTarget(null);
      setRatingComment("");
      setRatingValue(5);
      await loadApps();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "提交评分失败");
    } finally {
      setIsSubmittingRating(false);
    }
  }, [loadApps, ratingComment, ratingTarget, ratingValue]);

  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setPriceFilter("all");
    setSortBy("popular");
  }, []);

  const heroTopPadding = variant === "public" ? "pt-16" : "pt-6";
  const sidebarStickyTop = variant === "public" ? "top-24" : "top-6";

  return (
    <>
      <Dialog
        open={Boolean(ratingTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setRatingTarget(null);
            setRatingComment("");
            setRatingValue(5);
          }
        }}
      >
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              为「{ratingTarget?.name ?? ""}」评分
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, idx) => {
                const value = idx + 1;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRatingValue(value)}
                    className={cn(
                      "p-1 rounded-md transition-colors",
                      value <= ratingValue ? "text-warning" : "text-muted-foreground hover:text-warning"
                    )}
                  >
                    <Star className={cn("w-5 h-5", value <= ratingValue && "fill-current")} />
                  </button>
                );
              })}
            </div>
            <div>
              <Textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="写下你的使用体验（可选）"
                className="min-h-28 bg-background border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRatingTarget(null);
                setRatingComment("");
                setRatingValue(5);
              }}
            >
              取消
            </Button>
            <Button onClick={handleSubmitRating} disabled={isSubmittingRating}>
              {isSubmittingRating ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  提交中
                </span>
              ) : (
                "提交评分"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hero Section */}
      <section className={cn("relative pb-12 px-6 overflow-hidden", heroTopPadding)}>
        <div className="absolute inset-0 bg-linear-to-b from-primary/5 to-transparent" />

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
              发现优质 AI 应用
            </div>

            <h1
              className={cn(
                "text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-4",
                "transition-all duration-700 delay-100",
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
            >
              应用市场
            </h1>

            <p
              className={cn(
                "text-lg text-muted-foreground max-w-2xl mx-auto mb-8",
                "transition-all duration-700 delay-200",
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
            >
              探索由社区发布的优质应用，快速组装你的自动化工作流能力栈
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
                  placeholder="搜索应用..."
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
            {/* 侧边栏 - 筛选 */}
            <aside className="lg:w-64 shrink-0">
              <div className={cn("sticky space-y-6", sidebarStickyTop)}>
                {/* 价格筛选 */}
                <div className="p-4 rounded-xl bg-card border border-border">
                  <h3 className="font-semibold text-foreground mb-4">价格</h3>
                  <div className="space-y-2">
                    {priceOptions.map((option) => (
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

                <div className="p-4 rounded-xl bg-card border border-border">
                  <h3 className="font-semibold text-foreground mb-2">上架规则</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    已发布且设置为公开访问的应用会自动进入市场展示，评分与反馈将同步影响排序与曝光。
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-card border border-border">
                  <h3 className="font-semibold text-foreground mb-2">合规与免责声明</h3>
                  <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                    <p>公开访问内容由发布者创建并承担责任，平台仅提供技术服务与展示通道。</p>
                    <p>AI 生成内容可能存在误差，请结合人工核验后使用。</p>
                    <p className="text-[11px]">
                      了解更多：
                      <Link href="/terms" className="mx-1 text-primary hover:underline">
                        服务条款
                      </Link>
                      /
                      <Link href="/privacy" className="ml-1 text-primary hover:underline">
                        隐私政策
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </aside>

            {/* 应用列表 */}
            <main className="flex-1">
              {/* 排序栏 */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-muted-foreground">共 {total || apps.length} 个应用</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">排序:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="h-9 px-3 rounded-lg bg-card border border-border text-sm"
                  >
                    <option value="popular">最热门</option>
                    <option value="rating">评分最高</option>
                    <option value="newest">最新</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {isLoading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-60 rounded-2xl bg-card/70 border border-border animate-pulse"
                    />
                  ))}
                </div>
              ) : filteredApps.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredApps.map((app) => (
                    <div
                      key={app.id}
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
                          {app.icon || "📦"}
                        </div>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium",
                            app.access_mode === "public_anonymous"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-amber-500/10 text-amber-500"
                          )}
                        >
                          {app.access_mode === "public_anonymous" ? "公开" : "需登录"}
                        </span>
                      </div>

                      {/* Content */}
                      <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                        {app.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {app.description}
                      </p>

                      {/* Meta */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-warning fill-current" />
                          <span className="text-sm font-medium text-foreground">
                            {formatRating(app.rating_avg)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            ({formatNumber(app.rating_count || 0)})
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Users className="w-4 h-4" />
                          {formatNumber(app.download_count || 0)}
                        </div>
                      </div>

                      {/* Tags */}
                      {app.tags && app.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {app.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="flex-1 rounded-lg"
                          onClick={() => {
                            toast.info("暂未开放一键安装，敬请期待");
                          }}
                        >
                          安装
                          <ArrowRight className="ml-1 w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg"
                          onClick={() => setRatingTarget(app)}
                        >
                          评分
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">没有找到应用</h3>
                  <p className="text-muted-foreground mb-6">尝试调整搜索条件或筛选器</p>
                  <Button variant="outline" onClick={resetFilters}>
                    重置筛选
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
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">成为应用创作者</h2>
          <p className="text-muted-foreground mb-6">
            分享你的应用，获得创作者收益，加入我们的开发者社区
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard/creator">
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
    </>
  );
}

