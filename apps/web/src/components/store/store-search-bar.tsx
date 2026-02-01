"use client";

/**
 * 商店搜索栏组件
 * 
 * 提供搜索、筛选和排序功能
 */

import { useState, useRef, useEffect } from "react";
import {
  Search,
  SortDesc,
  ChevronDown,
  X,
  Filter,
  Sparkles,
  Clock,
  Star,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const sortOptions = [
  { id: "popular", label: "最受欢迎", icon: TrendingUp },
  { id: "newest", label: "最新发布", icon: Clock },
  { id: "rating", label: "评分最高", icon: Star },
  { id: "price_asc", label: "价格从低到高", icon: SortDesc },
  { id: "price_desc", label: "价格从高到低", icon: SortDesc },
];

const pricingOptions = [
  { id: "all", label: "全部" },
  { id: "free", label: "免费" },
  { id: "paid", label: "付费" },
];

interface StoreSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  pricingFilter?: string;
  onPricingChange?: (pricing: string) => void;
  totalCount?: number;
  placeholder?: string;
  showFilters?: boolean;
  className?: string;
}

export function StoreSearchBar({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  pricingFilter = "all",
  onPricingChange,
  totalCount,
  placeholder = "搜索 Agent...",
  showFilters = true,
  className,
}: StoreSearchBarProps) {
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setShowSortMenu(false);
      }
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setShowFilterMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentSort = sortOptions.find((o) => o.id === sortBy);
  const hasActiveFilters = pricingFilter !== "all" || searchQuery.length > 0;

  return (
    <div className={cn("space-y-4", className)}>
      {/* 搜索栏和操作区 */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* 搜索输入框 */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-light" />
          <input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={cn(
              "w-full h-12 pl-12 pr-10 rounded-xl",
              "bg-card border border-border text-foreground text-sm",
              "focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-primary/50",
              "placeholder:text-foreground-light transition-all"
            )}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-surface-200 transition-colors"
            >
              <X className="w-4 h-4 text-foreground-light" />
            </button>
          )}
        </div>

        {/* 操作按钮区 */}
        <div className="flex items-center gap-2">
          {/* 排序下拉 */}
          <div className="relative" ref={sortMenuRef}>
            <button
              onClick={() => {
                setShowSortMenu(!showSortMenu);
                setShowFilterMenu(false);
              }}
              className={cn(
                "flex items-center gap-2 h-12 px-4 rounded-xl",
                "bg-card border border-border text-sm",
                "hover:border-primary/30 transition-colors",
                showSortMenu && "border-primary/50"
              )}
            >
              <SortDesc className="w-4 h-4 text-foreground-light" />
              <span className="text-foreground hidden sm:inline">
                {currentSort?.label || "排序"}
              </span>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-foreground-light transition-transform",
                  showSortMenu && "rotate-180"
                )}
              />
            </button>

            {showSortMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-lg z-20 py-1 animate-scale-in">
                {sortOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <button
                      key={option.id}
                      onClick={() => {
                        onSortChange(option.id);
                        setShowSortMenu(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors",
                        sortBy === option.id
                          ? "bg-primary/10 text-primary"
                          : "text-foreground-light hover:bg-surface-200 hover:text-foreground"
                      )}
                    >
                      <IconComponent className="w-4 h-4" />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 筛选下拉 */}
          {showFilters && onPricingChange && (
            <div className="relative" ref={filterMenuRef}>
              <button
                onClick={() => {
                  setShowFilterMenu(!showFilterMenu);
                  setShowSortMenu(false);
                }}
                className={cn(
                  "flex items-center gap-2 h-12 px-4 rounded-xl",
                  "bg-card border border-border text-sm",
                  "hover:border-primary/30 transition-colors",
                  (showFilterMenu || pricingFilter !== "all") && "border-primary/50"
                )}
              >
                <Filter className="w-4 h-4 text-foreground-light" />
                <span className="text-foreground hidden sm:inline">
                  {pricingFilter === "all"
                    ? "筛选"
                    : pricingOptions.find((o) => o.id === pricingFilter)?.label}
                </span>
                {pricingFilter !== "all" && (
                  <span className="w-2 h-2 rounded-full bg-primary" />
                )}
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-foreground-light transition-transform",
                    showFilterMenu && "rotate-180"
                  )}
                />
              </button>

              {showFilterMenu && (
                <div className="absolute right-0 top-full mt-2 w-40 bg-card border border-border rounded-xl shadow-lg z-20 py-1 animate-scale-in">
                  <div className="px-3 py-2 text-xs font-medium text-foreground-light">
                    价格类型
                  </div>
                  {pricingOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        onPricingChange(option.id);
                        setShowFilterMenu(false);
                      }}
                      className={cn(
                        "w-full px-4 py-2 text-left text-sm transition-colors",
                        pricingFilter === option.id
                          ? "bg-primary/10 text-primary"
                          : "text-foreground-light hover:bg-surface-200 hover:text-foreground"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 统计和活跃筛选标签 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {totalCount !== undefined && (
            <span className="text-sm text-foreground-light">
              共 <span className="text-foreground font-medium">{totalCount}</span> 个 Agent
            </span>
          )}
          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              <span className="text-foreground-light/50"></span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface-200 text-xs text-foreground">
                  搜索: {searchQuery}
                  <button
                    onClick={() => onSearchChange("")}
                    className="hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {pricingFilter !== "all" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface-200 text-xs text-foreground">
                  {pricingOptions.find((o) => o.id === pricingFilter)?.label}
                  <button
                    onClick={() => onPricingChange?.("all")}
                    className="hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onSearchChange("");
              onPricingChange?.("all");
            }}
            className="text-xs text-foreground-light hover:text-foreground"
          >
            <X className="w-3 h-3 mr-1" />
            清除筛选
          </Button>
        )}
      </div>
    </div>
  );
}
