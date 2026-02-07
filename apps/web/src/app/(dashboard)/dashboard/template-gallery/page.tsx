"use client";

/**
 * TemplateMarketplacePage
 * Supabase Style: DarkHierarchy, version, BrandGreen
 * 
 * Features: 
 * - ShowcaseAllAvailableWorkflowTemplate
 * - CategoryFilterandSearch
 * - 1keyUsageTemplateCreateWorkflow
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

// DifficultyConfig
const difficultyConfig: Record<
 string,
 { label: string; variant: "success" | "warning" | "destructive"; className?: string }
> = {
 beginner: {
 label: "Getting Started",
 variant: "success",
 className: "border-brand-400/40",
 },
 intermediate: {
 label: "Advanced",
 variant: "warning",
 className: "border-warning/40",
 },
 advanced: {
 label: "Advanced",
 variant: "destructive",
 className: "border-destructive/40",
 },
};

// Formatcountchar
const formatCount = (num: number): string => {
 if (num >= 10000) return `${(num / 10000).toFixed(1)}10000`;
 if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
 return num.toString();
};

export default function TemplatesPage() {
 const router = useRouter();

 // DataStatus
 const [templates, setTemplates] = useState<Template[]>([]);
 const [featuredTemplates, setFeaturedTemplates] = useState<Template[]>([]);
 const [categories, setCategories] = useState<TemplateCategory[]>([]);
 const [total, setTotal] = useState(0);
 const [page, setPage] = useState(1);
 const [hasMore, setHasMore] = useState(true);

 // LoadStatus
 const [isLoading, setIsLoading] = useState(true);
 const [isLoadingMore, setIsLoadingMore] = useState(false);
 const [isUsingTemplate, setIsUsingTemplate] = useState<string | null>(null);
 const [error, setError] = useState<string | null>(null);

 // FilterStatus
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
 categoryNameMap.get(categoryId) || "otherhe";
 const officialCount = useMemo(
 () => templates.filter((template) => template.is_official).length,
 [templates]
 );

 // LoadCategoryList
 const loadCategories = useCallback(async () => {
 try {
 const response = await templateApiNew.getCategories();
 setCategories(response.data.categories || []);
 } catch (err) {
 console.error("LoadCategoryFailed:", err);
 }
 }, []);

 // LoadFeaturedTemplate
 const loadFeaturedTemplates = useCallback(async () => {
 try {
 const response = await templateApiNew.getFeatured(6);
 setFeaturedTemplates(response.data.templates || []);
 } catch (err) {
 console.error("LoadFeaturedFailed:", err);
 }
 }, []);

 // LoadTemplateList
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
 setError(err instanceof Error ? err.message: "LoadFailed");
 } finally {
 setIsLoading(false);
 setIsLoadingMore(false);
 }
 },
 [activeCategory, searchQuery, difficulty, sortBy, page]
 );

 // InitialLoad
 useEffect(() => {
 loadCategories();
 loadFeaturedTemplates();
 }, [loadCategories, loadFeaturedTemplates]);

 // Filtertimere-newLoad
 useEffect(() => {
 loadTemplates(true);
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [activeCategory, searchQuery, difficulty, sortBy]);

 // UsageTemplate
 const handleUseTemplate = async (template: Template) => {
 setIsUsingTemplate(template.id);
 try {
 const response = await templateApiNew.use(template.id);
 toast.success("WorkflowCreated successfully", {
 description: `alreadyBased on"${template.name}"TemplateCreateWorkflow`,
 });
 // NavigatetoEdit
 const workflow = response.data.workflow as { id: string };
 if (workflow?.id) {
 router.push(`/editor/${workflow.id}`);
 }
 } catch (err) {
 toast.error("UsageTemplateFailed", {
 description: err instanceof Error ? err.message: "PleaseRetry",
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
 title="Template Gallery"
 description="FeaturedWorkflowTemplate, QuickBuild AI Workflow"
 actions={
 <div className="flex items-center gap-2">
 {hasFilters && (
 <Button
 variant="ghost"
 size="sm"
 className="h-8 text-[12px] text-foreground-muted hover:text-foreground"
 onClick={handleClearFilters}
 >
 ClearFilter
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

 {/* CompactStatistics */}
 <div className="flex items-center gap-6 py-3 px-4 bg-surface-75 rounded-md border border-border text-[11px] text-foreground-muted">
 <span className="flex items-center gap-1.5">
 <Boxes className="w-3 h-3" />
 <span className="font-mono text-foreground">{total}</span> Template
 </span>
 <span className="flex items-center gap-1.5">
 <Sparkles className="w-3 h-3 text-brand-500" />
 <span className="font-mono text-foreground">{featuredTemplates.length}</span> Featured
 </span>
 <span className="flex items-center gap-1.5">
 <CheckCircle2 className="w-3 h-3" />
 <span className="font-mono text-foreground">{officialCount}</span> method
 </span>
 <span className="flex items-center gap-1.5">
 <TrendingUp className="w-3 h-3" />
 <span className="font-mono text-foreground">{formatCount(totalUsage)}</span> Usage
 </span>
 </div>


 {/* FilterRegion */}
 <div className="space-y-3">
 {/* CategoryTags */}
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
 allsection
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

 {/* SearchandFilter */}
 <div className="flex items-center gap-3">
 <Input
 placeholder="SearchTemplate..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 leftIcon={<Search className="w-3.5 h-3.5" />}
 className="w-[240px] h-8 text-[12px]"
 />

 <Select value={difficulty} onValueChange={setDifficulty}>
 <SelectTrigger className="h-8 w-[100px] bg-surface-100 border-border text-[12px]">
 <SelectValue placeholder="Difficulty" />
 </SelectTrigger>
 <SelectContent className="bg-surface-100 border-border">
 <SelectItem value="all">allsectionDifficulty</SelectItem>
 <SelectItem value="beginner">Getting Started</SelectItem>
 <SelectItem value="intermediate">Advanced</SelectItem>
 <SelectItem value="advanced">Advanced</SelectItem>
 </SelectContent>
 </Select>

 <Select value={sortBy} onValueChange={setSortBy}>
 <SelectTrigger className="h-8 w-[100px] bg-surface-100 border-border text-[12px]">
 <SelectValue placeholder="Sort" />
 </SelectTrigger>
 <SelectContent className="bg-surface-100 border-border">
 <SelectItem value="popular">mostPopular</SelectItem>
 <SelectItem value="newest">mostnew</SelectItem>
 <SelectItem value="name">Name</SelectItem>
 </SelectContent>
 </Select>

 <div className="flex-1" />

 <span className="text-[11px] text-foreground-muted">
 {templates.length} / {total} Template
 </span>
 </div>
 </div>

 {/* TemplateList */}
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
 Retry
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
 <p className="text-sm text-foreground-light mb-1">NotoMatch'sTemplate</p>
 <p className="text-xs text-foreground-muted mb-3">
 TryotherheKeywordsorFilterCondition
 </p>
 {hasFilters && (
 <Button
 variant="outline"
 size="sm"
 className="h-7 text-[12px] border-border text-foreground-light hover:bg-surface-100/60 hover:text-foreground"
 onClick={handleClearFilters}
 >
 <X className="w-3 h-3 mr-1" />
 ClearFilter
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
 Loading...
 </>
 ) : (
 "Load more"
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

// TemplateCard(GridView)- CompactMinimalDesign
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
 Featured
 </Badge>
 )}
 {template.is_official && (
 <Badge variant="primary" size="sm" className="text-[10px]">
 method
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
 <span>{template.node_count} Node</span>
 <span>·</span>
 <span>{formatCount(template.use_count)} Usage</span>
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
 loadingText="Create..."
 >
 Usage
 </Button>
 </CardFooter>
 </Card>
 );
}

// TemplateList(ListView)- CompactMinimalDesign
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
 Featured
 </Badge>
 )}
 {template.is_official && (
 <Badge variant="primary" size="sm" className="text-[10px]">
 method
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
 <span>{template.node_count} Node</span>
 <span>{formatCount(template.use_count)} Usage</span>
 </div>

 <Button
 size="sm"
 className="h-7 shrink-0 bg-brand-500 hover:bg-brand-600 text-background text-[12px]"
 onClick={() => onUse(template)}
 loading={isUsing}
 loadingText="Create..."
 >
 Usage
 </Button>
 </div>
 );
}
