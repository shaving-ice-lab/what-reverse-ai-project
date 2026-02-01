"use client";

/**
 * 模板市场页面
 * Supabase 风格：深色层级、克制排版、品牌绿色点缀
 * 
 * 功能：
 * - 展示所有可用工作流模板
 * - 分类筛选和搜索
 * - 一键使用模板创建工作流
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Sparkles,
  Clock,
  Users,
  ArrowRight,
  RefreshCw,
  Loader2,
  X,
  Filter,
  Grid3X3,
  List,
  CheckCircle2,
  Boxes,
  TrendingUp,
  Zap,
  FileText,
  BarChart3,
  MessageSquare,
  Code2,
  Globe,
  GraduationCap,
  DollarSign,
  Megaphone,
  Package,
} from "lucide-react";
import { Button, ButtonGroup } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { PageContainer, PageHeader } from "@/components/dashboard/page-layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  templateApiNew,
  type Template,
  type TemplateCategory,
} from "@/lib/api/template";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PAGE_SIZE = 12;
const sortLabelMap: Record<string, string> = {
  popular: "最热门",
  newest: "最新",
  name: "名称",
};

// 分类图标映射
const categoryIconMap: Record<string, typeof FileText> = {
  content: FileText,
  data: BarChart3,
  customer: MessageSquare,
  productivity: Users,
  developer: Code2,
  research: Globe,
  education: GraduationCap,
  finance: DollarSign,
  marketing: Megaphone,
  other: Package,
};

// 难度配置 - Supabase 风格
const difficultyConfig: Record<
  string,
  { label: string; variant: "success" | "warning" | "destructive"; className?: string }
> = {
  beginner: {
    label: "入门",
    variant: "success",
    className: "border-brand-400/40",
  },
  intermediate: {
    label: "进阶",
    variant: "warning",
    className: "border-warning/40",
  },
  advanced: {
    label: "高级",
    variant: "destructive",
    className: "border-destructive/40",
  },
};

// 格式化数字
const formatCount = (num: number): string => {
  if (num >= 10000) return `${(num / 10000).toFixed(1)}万`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

export default function TemplatesPage() {
  const router = useRouter();

  // 数据状态
  const [templates, setTemplates] = useState<Template[]>([]);
  const [featuredTemplates, setFeaturedTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // 加载状态
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isUsingTemplate, setIsUsingTemplate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 筛选状态
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [sortBy, setSortBy] = useState("popular");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const sortLabel = useMemo(() => sortLabelMap[sortBy] ?? "最热门", [sortBy]);
  const totalUsage = useMemo(
    () => templates.reduce((sum, template) => sum + template.use_count, 0),
    [templates]
  );
  const categoryNameMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((category) => {
      map.set(category.id, category.name);
    });
    return map;
  }, [categories]);
  const getCategoryLabel = (categoryId: string) =>
    categoryNameMap.get(categoryId) || "其他";
  const featuredHero = featuredTemplates[0];
  const featuredSecondary = featuredTemplates.slice(1);
  const officialCount = useMemo(
    () => templates.filter((template) => template.is_official).length,
    [templates]
  );
  const topCategories = useMemo(
    () =>
      [...categories]
        .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
        .slice(0, 5),
    [categories]
  );

  // 加载分类列表
  const loadCategories = useCallback(async () => {
    try {
      const response = await templateApiNew.getCategories();
      setCategories(response.data.categories || []);
    } catch (err) {
      console.error("加载分类失败:", err);
    }
  }, []);

  // 加载精选模板
  const loadFeaturedTemplates = useCallback(async () => {
    try {
      const response = await templateApiNew.getFeatured(6);
      setFeaturedTemplates(response.data.templates || []);
    } catch (err) {
      console.error("加载精选失败:", err);
    }
  }, []);

  // 加载模板列表
  const loadTemplates = useCallback(
    async (resetPage = false, targetPage?: number) => {
      if (resetPage) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);

      try {
        const currentPage = resetPage ? 1 : targetPage ?? page;
        const response = await templateApiNew.list({
          category: activeCategory !== "all" ? activeCategory : undefined,
          search: searchQuery || undefined,
          difficulty: difficulty !== "all" ? difficulty : undefined,
          sort: sortBy,
          page: currentPage,
          page_size: PAGE_SIZE,
        });

        const newTemplates = response.data.templates || [];
        const totalCount = response.meta?.total ?? newTemplates.length;

        if (resetPage) {
          setTemplates(newTemplates);
          setPage(1);
        } else {
          setTemplates((prev) =>
            currentPage === 1 ? newTemplates : [...prev, ...newTemplates]
          );
        }

        setTotal(totalCount);
        if (response.meta?.total !== undefined) {
          setHasMore(currentPage * PAGE_SIZE < response.meta.total);
        } else {
          setHasMore(newTemplates.length === PAGE_SIZE);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载失败");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [activeCategory, searchQuery, difficulty, sortBy, page]
  );

  // 初始加载
  useEffect(() => {
    loadCategories();
    loadFeaturedTemplates();
  }, [loadCategories, loadFeaturedTemplates]);

  // 筛选变化时重新加载
  useEffect(() => {
    loadTemplates(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, searchQuery, difficulty, sortBy]);

  // 使用模板
  const handleUseTemplate = async (template: Template) => {
    setIsUsingTemplate(template.id);
    try {
      const response = await templateApiNew.use(template.id);
      toast.success("工作流创建成功", {
        description: `已基于「${template.name}」模板创建工作流`,
      });
      // 跳转到编辑器
      const workflow = response.data.workflow as { id: string };
      if (workflow?.id) {
        router.push(`/editor/${workflow.id}`);
      }
    } catch (err) {
      toast.error("使用模板失败", {
        description: err instanceof Error ? err.message : "请重试",
      });
    } finally {
      setIsUsingTemplate(null);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadTemplates(false, nextPage);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setActiveCategory("all");
    setDifficulty("all");
  };

  const hasFilters =
    searchQuery || activeCategory !== "all" || difficulty !== "all";

  return (
    <PageContainer className="relative">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[80%] -translate-x-1/2 rounded-full bg-brand-500/10 blur-3xl" />
      <div className="pointer-events-none absolute top-20 right-[-10%] h-48 w-72 rounded-full bg-brand-500/5 blur-2xl" />
      <div className="relative space-y-6">
        <PageHeader
          title="模板库"
          eyebrow="Template Gallery"
          description="精选工作流模板，一键使用，快速构建你的 AI 工作流与自动化协作。"
          icon={<Boxes className="w-4 h-4" />}
          badge={
            <Badge
              variant="secondary"
              size="sm"
              className="bg-surface-200 text-foreground-light"
            >
              已上线 {total} 个模板
            </Badge>
          }
          actions={
            <div className="flex items-center gap-2">
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-foreground-muted hover:text-foreground"
                  onClick={handleClearFilters}
                >
                  清除筛选
                </Button>
              )}
              <ButtonGroup
                attached
                className="border border-border rounded-md overflow-hidden bg-surface-100/70"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "rounded-none h-9 px-3",
                    viewMode === "grid"
                      ? "bg-surface-200 text-foreground"
                      : "text-foreground-muted hover:text-foreground"
                  )}
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "rounded-none h-9 px-3",
                    viewMode === "list"
                      ? "bg-surface-200 text-foreground"
                      : "text-foreground-muted hover:text-foreground"
                  )}
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </Button>
              </ButtonGroup>
            </div>
          }
        >
          <div className="flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
            <Badge variant="secondary" size="sm" className="bg-surface-200 text-foreground-light">
              精选工作流
            </Badge>
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              热门模板每周更新
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              官方模板已校验
            </span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              支持一键创建工作流
            </span>
          </div>
        </PageHeader>

        <section className="page-panel overflow-hidden">
          <div className="relative">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(62,207,142,0.12),transparent_55%)]" />
            <div className="relative p-6">
              <div className="page-grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] gap-6">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <div className="page-caption">模板概览</div>
                    <h2 className="text-section-title">以行业最佳实践驱动的自动化模板库</h2>
                    <p className="page-subtle max-w-xl">
                      从官方模板到社区沉淀，将高频场景与可复用流程快速串联。
                    </p>
                  </div>

                  <div className="page-grid sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-3">
                    <div className="rounded-md border border-border bg-surface-75/80 p-3">
                      <p className="text-category">模板总量</p>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-stat-number font-mono text-foreground">{total}</span>
                        <span className="text-xs text-foreground-muted">已上架</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs text-foreground-muted">
                        <Boxes className="w-3.5 h-3.5" />
                        持续新增
                      </div>
                    </div>
                    <div className="rounded-md border border-border bg-surface-75/80 p-3">
                      <p className="text-category">精选模板</p>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-stat-number font-mono text-foreground">
                          {featuredTemplates.length}
                        </span>
                        <span className="text-xs text-foreground-muted">已推荐</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs text-foreground-muted">
                        <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                        编辑推荐
                      </div>
                    </div>
                    <div className="rounded-md border border-border bg-surface-75/80 p-3">
                      <p className="text-category">官方模板</p>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-stat-number font-mono text-foreground">
                          {officialCount}
                        </span>
                        <span className="text-xs text-foreground-muted">已加载</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs text-foreground-muted">
                        <CheckCircle2 className="w-3.5 h-3.5 text-brand-500" />
                        官方校验
                      </div>
                    </div>
                    <div className="rounded-md border border-border bg-surface-75/80 p-3">
                      <p className="text-category">累计使用</p>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-stat-number font-mono text-foreground">
                          {formatCount(totalUsage)}
                        </span>
                        <span className="text-xs text-foreground-muted">当前页</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs text-foreground-muted">
                        <TrendingUp className="w-3.5 h-3.5 text-brand-500" />
                        需求上升
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-foreground-muted">
                    <RefreshCw className="w-3 h-3" />
                    统计基于已加载模板
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-surface-75/80 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Filter className="w-3.5 h-3.5 text-foreground-muted" />
                      <h3 className="text-sm font-medium text-foreground">热门分类</h3>
                    </div>
                    <span className="text-xs text-foreground-muted">一键筛选</span>
                  </div>
                  <div className="mt-4 space-y-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "w-full justify-between rounded-md border px-3 py-2 text-[12px]",
                        activeCategory === "all"
                          ? "border-brand-500/40 bg-brand-200/40 text-foreground"
                          : "border-border bg-surface-100/70 text-foreground-light hover:bg-surface-200 hover:text-foreground"
                      )}
                      onClick={() => setActiveCategory("all")}
                    >
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                        全部分类
                      </span>
                      <span
                        className={cn(
                          "text-xs font-mono",
                          activeCategory === "all" ? "text-brand-500" : "text-foreground-muted"
                        )}
                      >
                        {total}
                      </span>
                    </Button>
                    {topCategories.map((cat) => {
                      const CategoryIcon = categoryIconMap[cat.id] || Package;
                      const isActive = activeCategory === cat.id;
                      return (
                        <Button
                          key={cat.id}
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "w-full justify-between rounded-md border px-3 py-2 text-[12px]",
                            isActive
                              ? "border-brand-500/40 bg-brand-200/40 text-foreground"
                              : "border-border bg-surface-100/70 text-foreground-light hover:bg-surface-200 hover:text-foreground"
                          )}
                          onClick={() => setActiveCategory(cat.id)}
                        >
                          <span className="flex items-center gap-2">
                            <CategoryIcon
                              className={cn(
                                "w-3.5 h-3.5",
                                isActive ? "text-brand-500" : "text-foreground-muted"
                              )}
                            />
                            {cat.name}
                          </span>
                          <span
                            className={cn(
                              "text-xs font-mono",
                              isActive ? "text-brand-500" : "text-foreground-muted"
                            )}
                          >
                            {cat.count}
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-foreground-muted">
                    <span>覆盖 {categories.length} 个分类</span>
                    <span>{categories.length ? "点击查看细分" : "等待加载"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {featuredHero && !searchQuery && activeCategory === "all" && (
          <section className="page-panel overflow-hidden">
            <div className="page-panel-header flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-500" />
                <h2 className="page-panel-title">精选模板</h2>
              </div>
              <div className="flex items-center gap-2 text-xs text-foreground-muted">
                <Badge
                  variant="secondary"
                  size="sm"
                  className="bg-surface-200 text-foreground-light"
                >
                  {featuredTemplates.length} 个推荐
                </Badge>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  每周更新
                </span>
              </div>
            </div>

            <div className="p-6">
              <div className="page-grid lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] gap-6">
                <FeaturedTemplateHero
                  template={featuredHero}
                  categoryLabel={getCategoryLabel(featuredHero.category)}
                  onUse={handleUseTemplate}
                  isUsing={isUsingTemplate === featuredHero.id}
                />
                <div className="space-y-3">
                  {featuredSecondary.length > 0 ? (
                    featuredSecondary.map((template, index) => (
                      <FeaturedTemplateCompact
                        key={template.id}
                        template={template}
                        index={index}
                        categoryLabel={getCategoryLabel(template.category)}
                        onUse={handleUseTemplate}
                        isUsing={isUsingTemplate === template.id}
                      />
                    ))
                  ) : (
                    <div className="rounded-lg border border-dashed border-border bg-surface-75/80 p-6 text-center text-xs text-foreground-muted">
                      暂无更多精选模板
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="page-panel">
          <div className="page-panel-header flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-foreground-muted" />
                <span className="page-panel-title">筛选与搜索</span>
              </div>
              <p className="page-panel-description">
                按分类、难度和热度快速定位需要的模板
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
              <span>已加载 {templates.length} 个</span>
              <Badge
                variant="secondary"
                size="sm"
                className="bg-surface-200 text-foreground-light"
              >
                排序: {sortLabel}
              </Badge>
            </div>
          </div>

          <div className="p-5 space-y-5">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
              <Button
                variant={activeCategory === "all" ? "default" : "outline"}
                size="sm"
                className={cn(
                  "rounded-md shrink-0 h-8 px-3 text-[12px]",
                  activeCategory === "all"
                    ? "bg-brand-500 hover:bg-brand-600 text-background"
                    : "border-border text-foreground-light hover:bg-surface-200 hover:text-foreground"
                )}
                onClick={() => setActiveCategory("all")}
              >
                全部
              </Button>
              {categories.map((cat) => {
                return (
                  <Button
                    key={cat.id}
                    variant={activeCategory === cat.id ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "rounded-md shrink-0 h-8 px-3 text-[12px]",
                      activeCategory === cat.id
                        ? "bg-brand-500 hover:bg-brand-600 text-background"
                        : "border-border text-foreground-light hover:bg-surface-200 hover:text-foreground"
                    )}
                    onClick={() => setActiveCategory(cat.id)}
                  >
                    <span className="mr-1.5">{cat.icon}</span>
                    {cat.name}
                    {cat.count > 0 && (
                      <span
                        className={cn(
                          "ml-1.5 px-1.5 py-0.5 text-[10px] rounded",
                          activeCategory === cat.id ? "bg-background/20" : "bg-surface-200"
                        )}
                      >
                        {cat.count}
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>

            <div className="page-grid lg:grid-cols-[minmax(0,1fr)_160px_160px] gap-3 lg:gap-3 items-center">
              <Input
                placeholder="搜索模板名称、描述或标签..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                variant="search"
                inputSize="lg"
                leftIcon={<Search className="w-4 h-4" />}
                className="w-full"
              />

              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="h-10 w-full bg-surface-100 border-border text-[12px]">
                  <SelectValue placeholder="难度" />
                </SelectTrigger>
                <SelectContent className="bg-surface-100 border-border">
                  <SelectItem value="all">全部难度</SelectItem>
                  <SelectItem value="beginner">入门</SelectItem>
                  <SelectItem value="intermediate">进阶</SelectItem>
                  <SelectItem value="advanced">高级</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-10 w-full bg-surface-100 border-border text-[12px]">
                  <SelectValue placeholder="排序" />
                </SelectTrigger>
                <SelectContent className="bg-surface-100 border-border">
                  <SelectItem value="popular">最热门</SelectItem>
                  <SelectItem value="newest">最新</SelectItem>
                  <SelectItem value="name">名称</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hasFilters && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-foreground-muted">筛选：</span>
                {searchQuery && (
                  <Badge
                    variant="secondary"
                    size="sm"
                    className="bg-surface-200 text-foreground-light"
                    onClose={() => setSearchQuery("")}
                  >
                    搜索: {searchQuery}
                  </Badge>
                )}
                {activeCategory !== "all" && (
                  <Badge
                    variant="secondary"
                    size="sm"
                    className="bg-surface-200 text-foreground-light"
                    onClose={() => setActiveCategory("all")}
                  >
                    分类: {getCategoryLabel(activeCategory)}
                  </Badge>
                )}
                {difficulty !== "all" && (
                  <Badge
                    variant="secondary"
                    size="sm"
                    className="bg-surface-200 text-foreground-light"
                    onClose={() => setDifficulty("all")}
                  >
                    难度: {difficultyConfig[difficulty]?.label}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="page-panel">
          <div className="page-panel-header flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="page-caption">Templates</div>
              <h2 className="page-panel-title">模板列表</h2>
              <p className="page-panel-description">
                共找到 <span className="font-medium text-foreground">{total}</span> 个模板
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
              <span>当前显示 {templates.length} 个</span>
              <Badge
                variant="secondary"
                size="sm"
                className="bg-surface-200 text-foreground-light"
              >
                排序: {sortLabel}
              </Badge>
              <Badge
                variant="secondary"
                size="sm"
                className="bg-surface-200 text-foreground-light"
              >
                视图: {viewMode === "grid" ? "网格" : "列表"}
              </Badge>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-6">
              {error ? (
                <div className="text-center py-16">
                  <p className="text-destructive-400 mb-4">{error}</p>
                  <Button
                    variant="outline"
                    className="border-border text-foreground-light hover:bg-surface-200 hover:text-foreground"
                    onClick={() => loadTemplates(true)}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    重试
                  </Button>
                </div>
              ) : isLoading ? (
                <div
                  className={cn(
                    viewMode === "grid"
                      ? "page-grid md:grid-cols-2 lg:grid-cols-3"
                      : "space-y-4"
                  )}
                >
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "bg-surface-100/80 rounded-md border border-border animate-pulse",
                        viewMode === "grid" ? "h-64" : "h-28"
                      )}
                    />
                  ))}
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-md bg-surface-200 flex items-center justify-center">
                    <Search className="w-8 h-8 text-foreground-muted" />
                  </div>
                  <p className="text-foreground-light mb-2">没有找到匹配的模板</p>
                  <p className="text-sm text-foreground-muted mb-4">
                    尝试其他关键词或筛选条件
                  </p>
                  {hasFilters && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border text-foreground-light hover:bg-surface-200 hover:text-foreground"
                      onClick={handleClearFilters}
                    >
                      <X className="w-4 h-4 mr-2" />
                      清除筛选
                    </Button>
                  )}
                </div>
              ) : viewMode === "grid" ? (
                <div className="page-grid md:grid-cols-2 lg:grid-cols-3">
                  {templates.map((template, index) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      index={index}
                      categoryLabel={getCategoryLabel(template.category)}
                      onUse={handleUseTemplate}
                      isUsing={isUsingTemplate === template.id}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {templates.map((template, index) => (
                    <TemplateListItem
                      key={template.id}
                      template={template}
                      index={index}
                      categoryLabel={getCategoryLabel(template.category)}
                      onUse={handleUseTemplate}
                      isUsing={isUsingTemplate === template.id}
                    />
                  ))}
                </div>
              )}

              {hasMore && templates.length > 0 && (
                <div className="pt-2 text-center">
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-11 px-6 font-medium rounded-md border-border text-foreground-light hover:bg-surface-200 hover:text-foreground"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        加载中...
                      </>
                    ) : (
                      "加载更多"
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </PageContainer>
  );
}

// 精选模板主卡片
interface FeaturedTemplateHeroProps {
  template: Template;
  categoryLabel: string;
  onUse: (template: Template) => void;
  isUsing: boolean;
}

function FeaturedTemplateHero({
  template,
  categoryLabel,
  onUse,
  isUsing,
}: FeaturedTemplateHeroProps) {
  const difficulty = difficultyConfig[template.difficulty] || difficultyConfig.beginner;
  const CategoryIcon = categoryIconMap[template.category] || Package;
  const tags = template.tags?.slice(0, 3) || [];

  return (
    <Card
      variant="default"
      hover="glow-border"
      className="group relative overflow-hidden h-full"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(62,207,142,0.16),transparent_60%)]" />
      <CardContent className="relative p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-12 h-12 rounded-md bg-surface-200 border border-border/60 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
              {template.icon}
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/templates/${template.slug}`}
                  className="text-base font-semibold text-foreground hover:text-brand-500 transition-colors truncate"
                >
                  {template.name}
                </Link>
                {template.is_official && (
                  <Badge variant="primary" size="sm" className="text-[10px]">
                    官方
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-foreground-muted">
                <CategoryIcon className="w-3.5 h-3.5" />
                <span>{categoryLabel}</span>
                <span className="text-foreground-muted/60">·</span>
                <span>{template.node_count} 节点</span>
              </div>
            </div>
          </div>
          <Badge
            variant="primary"
            size="sm"
            className="text-[10px]"
            icon={<Sparkles className="w-3 h-3" />}
          >
            精选
          </Badge>
        </div>

        <p className="text-sm text-foreground-light line-clamp-3">
          {template.description}
        </p>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                size="sm"
                className="text-foreground-muted border-border"
              >
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge
            variant={difficulty.variant}
            size="sm"
            className={cn("uppercase", difficulty.className)}
          >
            {difficulty.label}
          </Badge>
          <Badge variant="outline" size="sm" className="border-border text-foreground-light">
            <Clock className="w-3 h-3 mr-1" />
            {template.estimated_time} 分钟
          </Badge>
          <Badge variant="outline" size="sm" className="border-border text-foreground-light">
            {template.node_count} 节点
          </Badge>
        </div>
      </CardContent>

      <CardFooter
        className="px-6 py-4 border-t border-border bg-surface-75/70"
        align="between"
      >
        <div className="flex items-center gap-3 text-xs text-foreground-muted">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {formatCount(template.use_count)} 使用
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            {formatCount(template.view_count)} 浏览
          </span>
        </div>
        <Button
          size="sm"
          className="bg-brand-500 hover:bg-brand-600 text-background"
          onClick={() => onUse(template)}
          loading={isUsing}
          loadingText="创建中..."
          leftIcon={!isUsing ? <Zap className="w-4 h-4" /> : undefined}
        >
          立即使用
        </Button>
      </CardFooter>
    </Card>
  );
}

// 精选模板紧凑卡片
interface FeaturedTemplateCompactProps {
  template: Template;
  index: number;
  categoryLabel: string;
  onUse: (template: Template) => void;
  isUsing: boolean;
}

function FeaturedTemplateCompact({
  template,
  index,
  categoryLabel,
  onUse,
  isUsing,
}: FeaturedTemplateCompactProps) {
  const difficulty = difficultyConfig[template.difficulty] || difficultyConfig.beginner;
  const CategoryIcon = categoryIconMap[template.category] || Package;

  return (
    <Card
      variant="muted"
      hover="border"
      className={cn("group relative overflow-hidden animate-stagger-in")}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-md bg-surface-200 border border-border/60 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
              {template.icon}
            </div>
            <div className="min-w-0 space-y-1">
              <Link
                href={`/templates/${template.slug}`}
                className="text-sm font-semibold text-foreground group-hover:text-brand-500 transition-colors truncate"
              >
                {template.name}
              </Link>
              <div className="flex items-center gap-2 text-xs text-foreground-muted">
                <CategoryIcon className="w-3.5 h-3.5" />
                <span>{categoryLabel}</span>
              </div>
            </div>
          </div>
          <Button
            size="sm"
            className="bg-brand-500 hover:bg-brand-600 text-background"
            onClick={() => onUse(template)}
            loading={isUsing}
            loadingText="创建中..."
          >
            使用
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge
            variant={difficulty.variant}
            size="sm"
            className={cn("uppercase", difficulty.className)}
          >
            {difficulty.label}
          </Badge>
          <span className="flex items-center gap-1 text-foreground-muted">
            <Clock className="w-3 h-3" />
            {template.estimated_time} 分钟
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// 模板卡片（网格视图）
interface TemplateCardProps {
  template: Template;
  index: number;
  categoryLabel: string;
  onUse: (template: Template) => void;
  isUsing: boolean;
}

function TemplateCard({ template, index, categoryLabel, onUse, isUsing }: TemplateCardProps) {
  const difficulty = difficultyConfig[template.difficulty] || difficultyConfig.beginner;
  const IconComponent = categoryIconMap[template.category] || Package;
  const tags = template.tags?.slice(0, 2) || [];

  return (
    <Card
      variant="default"
      hover="interactive"
      className={cn("group relative h-full overflow-hidden animate-stagger-in")}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-11 h-11 rounded-md bg-surface-200 border border-border/60 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
              {template.icon}
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/templates/${template.slug}`}
                  className="block text-[15px] font-semibold text-foreground group-hover:text-brand-500 transition-colors truncate"
                >
                  {template.name}
                </Link>
                {template.is_official && (
                  <Badge variant="primary" size="sm" className="text-[10px]">
                    官方
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-foreground-muted">
                <IconComponent className="w-3.5 h-3.5" />
                <span>{categoryLabel}</span>
                <span className="text-foreground-muted/60">·</span>
                <span>{template.node_count} 节点</span>
              </div>
            </div>
          </div>
          {template.is_featured && (
            <Badge
              variant="secondary"
              size="sm"
              className="text-[10px]"
              icon={<Sparkles className="w-3 h-3" />}
            >
              精选
            </Badge>
          )}
        </div>

        <p className="text-sm text-foreground-light line-clamp-2">
          {template.description}
        </p>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                size="sm"
                className="text-foreground-muted border-border"
              >
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge
            variant={difficulty.variant}
            size="sm"
            className={cn("uppercase", difficulty.className)}
          >
            {difficulty.label}
          </Badge>
          <Badge variant="outline" size="sm" className="border-border text-foreground-light">
            <Clock className="w-3 h-3 mr-1" />
            {template.estimated_time} 分钟
          </Badge>
          <Badge variant="outline" size="sm" className="border-border text-foreground-light">
            {template.node_count} 节点
          </Badge>
        </div>
      </CardContent>

      <CardFooter className="px-5 py-3 border-t border-border bg-surface-75/80" align="between">
        <div className="flex items-center gap-3 text-xs text-foreground-muted">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {formatCount(template.use_count)} 使用
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            {formatCount(template.view_count)} 浏览
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/templates/${template.slug}`}>
            <Button
              variant="outline"
              size="sm"
              className="border-border text-foreground-light hover:bg-surface-200 hover:text-foreground"
              rightIcon={<ArrowRight className="w-3 h-3" />}
            >
              查看详情
            </Button>
          </Link>
          <Button
            size="sm"
            className="bg-brand-500 hover:bg-brand-600 text-background"
            onClick={(e) => {
              e.preventDefault();
              onUse(template);
            }}
            loading={isUsing}
            loadingText="创建中..."
            leftIcon={!isUsing ? <CheckCircle2 className="w-4 h-4" /> : undefined}
          >
            使用
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

// 模板列表项（列表视图）
interface TemplateListItemProps {
  template: Template;
  index: number;
  categoryLabel: string;
  onUse: (template: Template) => void;
  isUsing: boolean;
}

function TemplateListItem({ template, index, categoryLabel, onUse, isUsing }: TemplateListItemProps) {
  const difficulty = difficultyConfig[template.difficulty] || difficultyConfig.beginner;
  const IconComponent = categoryIconMap[template.category] || Package;
  const accentClass = template.is_featured
    ? "border-l-brand-500"
    : template.is_official
      ? "border-l-brand-200"
      : "border-l-transparent";

  return (
    <Card
      variant="default"
      hover="interactive"
      className={cn("group animate-stagger-in border-l-2", accentClass)}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-md bg-surface-200 border border-border/60 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
              {template.icon}
            </div>

            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/templates/${template.slug}`}
                  className="font-semibold text-foreground hover:text-brand-500 transition-colors"
                >
                  {template.name}
                </Link>
                {template.is_featured && (
                  <Badge
                    variant="secondary"
                    size="sm"
                    className="text-[10px]"
                    icon={<Sparkles className="w-3 h-3" />}
                  >
                    精选
                  </Badge>
                )}
                {template.is_official && (
                  <Badge variant="primary" size="sm" className="text-[10px]">
                    官方
                  </Badge>
                )}
                <Badge
                  variant={difficulty.variant}
                  size="sm"
                  className={cn("uppercase", difficulty.className)}
                >
                  {difficulty.label}
                </Badge>
              </div>
              <p className="text-sm text-foreground-light line-clamp-1">
                {template.description}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
                <span className="flex items-center gap-1">
                  <IconComponent className="w-3.5 h-3.5" />
                  {categoryLabel}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {template.estimated_time} 分钟
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {formatCount(template.use_count)} 使用
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {formatCount(template.view_count)} 浏览
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link href={`/templates/${template.slug}`}>
              <Button
                variant="outline"
                size="sm"
                className="border-border text-foreground-light hover:bg-surface-200 hover:text-foreground"
                rightIcon={<ArrowRight className="w-3 h-3" />}
              >
                详情
              </Button>
            </Link>
            <Button
              size="sm"
              className="bg-brand-500 hover:bg-brand-600 text-background"
              onClick={() => onUse(template)}
              loading={isUsing}
              loadingText="创建中..."
              leftIcon={!isUsing ? <CheckCircle2 className="w-4 h-4" /> : undefined}
            >
              使用
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
