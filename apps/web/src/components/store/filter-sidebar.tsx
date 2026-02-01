"use client";

/**
 * 筛选侧边栏组件
 * 
 * 提供分类、价格、评分等多维度筛选功能
 */

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Star,
  X,
  SlidersHorizontal,
  FileText,
  BarChart3,
  MessageSquare,
  Users,
  Code2,
  Globe,
  TrendingUp,
  Sparkles,
  GraduationCap,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AgentCategory, PricingType } from "@/types/agent";

// 分类配置
const categoryOptions: Array<{
  id: AgentCategory;
  label: string;
  icon: typeof MessageSquare;
}> = [
  { id: "content", label: "内容创作", icon: FileText },
  { id: "data", label: "数据处理", icon: BarChart3 },
  { id: "customer", label: "客户服务", icon: MessageSquare },
  { id: "productivity", label: "办公效率", icon: Users },
  { id: "developer", label: "开发工具", icon: Code2 },
  { id: "research", label: "研究分析", icon: Globe },
  { id: "education", label: "教育学习", icon: GraduationCap },
  { id: "finance", label: "金融财务", icon: Wallet },
  { id: "marketing", label: "市场营销", icon: TrendingUp },
  { id: "other", label: "其他", icon: Sparkles },
];

// 价格选项
const pricingOptions: Array<{
  id: PricingType | "all";
  label: string;
}> = [
  { id: "all", label: "全部" },
  { id: "free", label: "免费" },
  { id: "paid", label: "付费" },
  { id: "subscription", label: "订阅" },
];

// 评分选项
const ratingOptions = [
  { id: 4.5", label: "4.5 及以上" },
  { id: 4.0, label: "4.0 及以上" },
  { id: 3.5, label: "3.5 及以上" },
  { id: 3.0, label: "3.0 及以上" },
];

interface FilterSidebarProps {
  // 当前筛选值
  selectedCategories?: AgentCategory[];
  selectedPricing?: PricingType | "all";
  selectedMinRating?: number;
  
  // 回调函数
  onCategoryChange?: (categories: AgentCategory[]) => void;
  onPricingChange?: (pricing: PricingType | "all") => void;
  onMinRatingChange?: (rating: number | undefined) => void;
  onClearAll?: () => void;
  
  // 显示统计
  categoryCounts?: Record<AgentCategory, number>;
  
  // 样式
  className?: string;
  collapsible?: boolean;
}

export function FilterSidebar({
  selectedCategories = [],
  selectedPricing = "all",
  selectedMinRating,
  onCategoryChange,
  onPricingChange,
  onMinRatingChange,
  onClearAll,
  categoryCounts = {} as Record<AgentCategory, number>,
  className,
  collapsible = true,
}: FilterSidebarProps) {
  // 折叠状态
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    category: true,
    pricing: true,
    rating: true,
  });

  const toggleSection = (section: string) => {
    if (!collapsible) return;
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // 切换分类选择
  const toggleCategory = (categoryId: AgentCategory) => {
    if (!onCategoryChange) return;
    
    const isSelected = selectedCategories.includes(categoryId);
    if (isSelected) {
      onCategoryChange(selectedCategories.filter((c) => c !== categoryId));
    } else {
      onCategoryChange([...selectedCategories, categoryId]);
    }
  };

  // 计算活跃筛选数量
  const activeFilterCount =
    selectedCategories.length +
    (selectedPricing !== "all" ? 1 : 0) +
    (selectedMinRating ? 1 : 0);

  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div className={cn("w-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
          <span className="font-semibold text-foreground">筛选</span>
          {hasActiveFilters && (
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
              {activeFilterCount}
            </span>
          )}
        </div>
        {hasActiveFilters && onClearAll && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-7 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3 mr-1" />
            清除
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* 分类筛选 */}
        <div className="border-b border-border pb-6">
          <button
            onClick={() => toggleSection("category")}
            className="flex items-center justify-between w-full text-left mb-3"
          >
            <span className="text-sm font-medium text-foreground">分类</span>
            {collapsible && (
              expandedSections.category ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )
            )}
          </button>

          {expandedSections.category && (
            <div className="space-y-1">
              {categoryOptions.map((category) => {
                const isSelected = selectedCategories.includes(category.id);
                const count = categoryCounts[category.id] || 0;
                const IconComponent = category.icon;

                return (
                  <button
                    key={category.id}
                    onClick={() => toggleCategory(category.id)}
                    className={cn(
                      "flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors",
                      isSelected
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span className="flex-1 text-left">{category.label}</span>
                    {count > 0 && (
                      <span className={cn(
                        "text-xs",
                        isSelected ? "text-primary" : "text-muted-foreground/60"
                      )}>
                        {count}
                      </span>
                    )}
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 价格筛选 */}
        <div className="border-b border-border pb-6">
          <button
            onClick={() => toggleSection("pricing")}
            className="flex items-center justify-between w-full text-left mb-3"
          >
            <span className="text-sm font-medium text-foreground">价格</span>
            {collapsible && (
              expandedSections.pricing ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )
            )}
          </button>

          {expandedSections.pricing && (
            <div className="space-y-1">
              {pricingOptions.map((option) => {
                const isSelected = selectedPricing === option.id;

                return (
                  <button
                    key={option.id}
                    onClick={() => onPricingChange?.(option.id)}
                    className={cn(
                      "flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors",
                      isSelected
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                        isSelected
                          ? "border-primary"
                          : "border-muted-foreground/30"
                      )}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <span className="flex-1 text-left">{option.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 评分筛选 */}
        <div>
          <button
            onClick={() => toggleSection("rating")}
            className="flex items-center justify-between w-full text-left mb-3"
          >
            <span className="text-sm font-medium text-foreground">最低评分</span>
            {collapsible && (
              expandedSections.rating ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )
            )}
          </button>

          {expandedSections.rating && (
            <div className="space-y-1">
              <button
                onClick={() => onMinRatingChange?.(undefined)}
                className={cn(
                  "flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors",
                  !selectedMinRating
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <div
                  className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                    !selectedMinRating
                      ? "border-primary"
                      : "border-muted-foreground/30"
                  )}
                >
                  {!selectedMinRating && (
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </div>
                <span className="flex-1 text-left">不限</span>
              </button>

              {ratingOptions.map((option) => {
                const isSelected = selectedMinRating === option.id;

                return (
                  <button
                    key={option.id}
                    onClick={() => onMinRatingChange?.(option.id)}
                    className={cn(
                      "flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors",
                      isSelected
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                        isSelected
                          ? "border-primary"
                          : "border-muted-foreground/30"
                      )}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-1">
                      <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                      <span>{option.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
