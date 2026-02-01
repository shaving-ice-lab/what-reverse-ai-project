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
  RefreshCw,
  Loader2,
  X,
  Grid3X3,
  List,
  CheckCircle2,
  Boxes,
  TrendingUp,
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

// 难度配置
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
  const officialCount = useMemo(
    () => templates.filter((template) => template.is_official).length,
    [templates]
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
    <PageContainer>
      <div className="space-y-5">
        <PageHeader
          title="模板库"
          description="精选工作流模板，快速构建 AI 工作流"
          actions={
            <div className="flex items-center gap-2">
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-[12px] text-foreground-muted hover:text-foreground"
                  onClick={handleClearFilters}
                >
                  清除筛选
                </Button>
              )}
              <ButtonGroup
                attached
                className="border border-border rounded-md overflow-hidden"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "rounded-none h-8 px-2.5",
                    viewMode === "grid"
                      ? "bg-surface-200 text-foreground"
                      : "text-foreground-muted hover:text-foreground"
                  )}
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "rounded-none h-8 px-2.5",
                    viewMode === "list"
                      ? "bg-surface-200 text-foreground"
                      : "text-foreground-muted hover:text-foreground"
                  )}
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-3.5 h-3.5" />
                </Button>
              </ButtonGroup>
            </div>
          }
        />

        {/* 紧凑统计栏 */}
        <div className="flex items-center gap-6 py-3 px-4 bg-surface-75 rounded-md border border-border text-[11px] text-foreground-muted">
          <span className="flex items-center gap-1.5">
            <Boxes className="w-3 h-3" />
            <span className="font-mono text-foreground">{total}</span> 个模板
          </span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-brand-500" />
            <span className="font-mono text-foreground">{featuredTemplates.length}</span> 精选
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3" />
            <span className="font-mono text-foreground">{officialCount}</span> 官方
          </span>
          <span className="flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3" />
            <span className="font-mono text-foreground">{formatCount(totalUsage)}</span> 使用
          </span>
        </div>


        {/* 筛选区域 */}
        <div className="space-y-3">
          {/* 分类标签 */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "shrink-0 h-8 px-3 text-[12px] rounded-md",
                activeCategory === "all"
                  ? "bg-surface-200 text-foreground"
                  : "text-foreground-light hover:bg-surface-100/60 hover:text-foreground"
              )}
              onClick={() => setActiveCategory("all")}
            >
              全部
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant="ghost"
                size="sm"
                className={cn(
                  "shrink-0 h-8 px-3 text-[12px] rounded-md",
                  activeCategory === cat.id
                    ? "bg-surface-200 text-foreground"
                    : "text-foreground-light hover:bg-surface-100/60 hover:text-foreground"
                )}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.name}
              </Button>
            ))}
          </div>

          {/* 搜索和筛选 */}
          <div className="flex items-center gap-3">
            <Input
              placeholder="搜索模板..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-3.5 h-3.5" />}
              className="w-[240px] h-8 text-[12px]"
            />

            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="h-8 w-[100px] bg-surface-100 border-border text-[12px]">
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
              <SelectTrigger className="h-8 w-[100px] bg-surface-100 border-border text-[12px]">
                <SelectValue placeholder="排序" />
              </SelectTrigger>
              <SelectContent className="bg-surface-100 border-border">
                <SelectItem value="popular">最热门</SelectItem>
                <SelectItem value="newest">最新</SelectItem>
                <SelectItem value="name">名称</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex-1" />

            <span className="text-[11px] text-foreground-muted">
              {templates.length} / {total} 个模板
            </span>
          </div>
        </div>

        {/* 模板列表 */}
        <section className="page-panel">
          <div className="p-4">
            <div className="space-y-4">
              {error ? (
                <div className="text-center py-12">
                  <p className="text-xs text-destructive-400 mb-3">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 border-border text-foreground-light hover:bg-surface-100/60 hover:text-foreground"
                    onClick={() => loadTemplates(true)}
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    重试
                  </Button>
                </div>
              ) : isLoading ? (
                <div
                  className={cn(
                    viewMode === "grid"
                      ? "page-grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                      : "space-y-2"
                  )}
                >
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "bg-surface-100 rounded-md border border-border",
                        viewMode === "grid" ? "h-36" : "h-16"
                      )}
                    />
                  ))}
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-md bg-surface-200 flex items-center justify-center">
                    <Search className="w-5 h-5 text-foreground-muted" />
                  </div>
                  <p className="text-sm text-foreground-light mb-1">没有找到匹配的模板</p>
                  <p className="text-xs text-foreground-muted mb-3">
                    尝试其他关键词或筛选条件
                  </p>
                  {hasFilters && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[12px] border-border text-foreground-light hover:bg-surface-100/60 hover:text-foreground"
                      onClick={handleClearFilters}
                    >
                      <X className="w-3 h-3 mr-1" />
                      清除筛选
                    </Button>
                  )}
                </div>
              ) : viewMode === "grid" ? (
                <div className="page-grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
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
                <div className="space-y-2">
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
                <div className="pt-3 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-4 text-[12px] rounded-md border-border text-foreground-light hover:bg-surface-100/60 hover:text-foreground"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
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

// 模板卡片（网格视图）- 紧凑极简设计
interface TemplateCardProps {
  template: Template;
  index: number;
  categoryLabel: string;
  onUse: (template: Template) => void;
  isUsing: boolean;
}

function TemplateCard({ template, index, categoryLabel, onUse, isUsing }: TemplateCardProps) {
  const difficulty = difficultyConfig[template.difficulty] || difficultyConfig.beginner;

  return (
    <Card
      variant="default"
      className="group h-full bg-surface-100 border-border hover:border-border-strong transition-colors"
    >
      <CardContent className="p-4 space-y-2">
        <div>
          <div className="flex items-center gap-2">
              <Link
                href={`/templates/${template.slug}`}
                className="text-sm font-medium text-foreground hover:text-brand-500 transition-colors truncate"
              >
                {template.name}
              </Link>
              {template.is_featured && (
                <Badge variant="secondary" size="sm" className="text-[10px]">
                  精选
                </Badge>
              )}
              {template.is_official && (
                <Badge variant="primary" size="sm" className="text-[10px]">
                  官方
                </Badge>
              )}
            </div>
            <p className="text-xs text-foreground-light line-clamp-2 mt-1">
            {template.description}
          </p>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-foreground-muted">
          <span>{categoryLabel}</span>
          <span>·</span>
          <span>{template.node_count} 节点</span>
          <span>·</span>
          <span>{formatCount(template.use_count)} 使用</span>
        </div>
      </CardContent>

      <CardFooter className="px-4 py-2.5 border-t border-border bg-surface-75" align="between">
        <Badge
          variant={difficulty.variant}
          size="sm"
          className="text-[10px]"
        >
          {difficulty.label}
        </Badge>
        <Button
          size="sm"
          className="h-7 bg-brand-500 hover:bg-brand-600 text-background text-[12px]"
          onClick={(e) => {
            e.preventDefault();
            onUse(template);
          }}
          loading={isUsing}
          loadingText="创建中..."
        >
          使用
        </Button>
      </CardFooter>
    </Card>
  );
}

// 模板列表项（列表视图）- 紧凑极简设计
interface TemplateListItemProps {
  template: Template;
  index: number;
  categoryLabel: string;
  onUse: (template: Template) => void;
  isUsing: boolean;
}

function TemplateListItem({ template, index, categoryLabel, onUse, isUsing }: TemplateListItemProps) {
  const difficulty = difficultyConfig[template.difficulty] || difficultyConfig.beginner;

  return (
    <div className="flex items-center gap-4 py-3 px-4 rounded-md bg-surface-100 border border-border hover:border-border-strong transition-colors">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            href={`/templates/${template.slug}`}
            className="text-sm font-medium text-foreground hover:text-brand-500 transition-colors truncate"
          >
            {template.name}
          </Link>
          {template.is_featured && (
            <Badge variant="secondary" size="sm" className="text-[10px]">
              精选
            </Badge>
          )}
          {template.is_official && (
            <Badge variant="primary" size="sm" className="text-[10px]">
              官方
            </Badge>
          )}
          <Badge variant={difficulty.variant} size="sm" className="text-[10px]">
            {difficulty.label}
          </Badge>
        </div>
        <p className="text-xs text-foreground-light line-clamp-1 mt-0.5">
          {template.description}
        </p>
      </div>

      <div className="flex items-center gap-4 text-[11px] text-foreground-muted shrink-0">
        <span>{categoryLabel}</span>
        <span>{template.node_count} 节点</span>
        <span>{formatCount(template.use_count)} 使用</span>
      </div>

      <Button
        size="sm"
        className="h-7 shrink-0 bg-brand-500 hover:bg-brand-600 text-background text-[12px]"
        onClick={() => onUse(template)}
        loading={isUsing}
        loadingText="创建中..."
      >
        使用
      </Button>
    </div>
  );
}
