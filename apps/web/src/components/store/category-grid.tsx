"use client";

/**
 * PopularCategoryEntryComponent
 * 
 * Showcase Agent Category'sGridEntry, SupportClickFilter
 */

import Link from "next/link";
import {
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
 ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentCategory, Category } from "@/types/agent";

// CategoryConfig
const categoryConfig: Record<
 AgentCategory,
 {
 label: string;
 icon: typeof MessageSquare;
 color: string;
 gradient: string;
 description: string;
 }
> = {
 content: {
 label: "ContentCreative",
 icon: FileText,
 color: "text-blue-500",
 gradient: "from-blue-500/20 to-blue-600/10",
 description: "Article, Copy, currentGenerate",
 },
 data: {
 label: "DataProcess",
 icon: BarChart3,
 color: "text-purple-500",
 gradient: "from-purple-500/20 to-purple-600/10",
 description: "DataAnalytics, Process, Convert",
 },
 customer: {
 label: "CustomerService",
 icon: MessageSquare,
 color: "text-pink-500",
 gradient: "from-pink-500/20 to-pink-600/10",
 description: "SupportAssistant, FAQ, Ticket",
 },
 productivity: {
 label: "Officerate",
 icon: Users,
 color: "text-primary",
 gradient: "from-primary/20 to-primary/10",
 description: "day, willneed, TaskManage",
 },
 developer: {
 label: "DevelopmentTool",
 icon: Code2,
 color: "text-orange-500",
 gradient: "from-orange-500/20 to-orange-600/10",
 description: "CodeGenerate, API Document, Test",
 },
 research: {
 label: "ResearchAnalytics",
 icon: Globe,
 color: "text-cyan-500",
 gradient: "from-cyan-500/20 to-cyan-600/10",
 description: "MarketplaceSurvey, CompetitorAnalytics, Report",
 },
 education: {
 label: "EducationLearn",
 icon: GraduationCap,
 color: "text-yellow-500",
 gradient: "from-yellow-500/20 to-yellow-600/10",
 description: "CourseDesign, Learn, ",
 },
 finance: {
 label: "FinanceFinance",
 icon: Wallet,
 color: "text-emerald-500",
 gradient: "from-emerald-500/20 to-emerald-600/10",
 description: "FinanceReport, RiskEvaluate, Budget",
 },
 marketing: {
 label: "MarketplaceMarketing",
 icon: TrendingUp,
 color: "text-red-500",
 gradient: "from-red-500/20 to-red-600/10",
 description: "Marketing, AdvertisingCopy, SEO",
 },
 other: {
 label: "otherhe",
 icon: Sparkles,
 color: "text-foreground-light",
 gradient: "from-muted/20 to-muted/10",
 description: "moremultipleCreativeTool",
 },
};

interface CategoryGridProps {
 categories?: Category[];
 selectedCategory?: AgentCategory | "all";
 onCategorySelect?: (category: AgentCategory | "all") => void;
 showCount?: boolean;
 variant?: "card" | "pill" | "icon";
 className?: string;
}

export function CategoryGrid({
 categories = [],
 selectedCategory,
 onCategorySelect,
 showCount = true,
 variant = "card",
 className,
}: CategoryGridProps) {
 // Usageenter'sCategoryorGenerateDefaultCategory
 const displayCategories = categories.length > 0
 ? categories
 : (Object.entries(categoryConfig)
 .filter(([key]) => key !== "other")
 .map(([id, config]) => ({
 id: id as AgentCategory,
 name: config.label,
 icon: id,
 description: config.description,
 count: 0,
 })) as Category[]);

 if (variant === "pill") {
 return (
 <div className={cn("flex flex-wrap items-center gap-2", className)}>
 <button
 onClick={() => onCategorySelect?.("all")}
 className={cn(
 "px-4 py-2 rounded-lg text-sm font-medium transition-all",
 selectedCategory === "all" || !selectedCategory
 ? "bg-primary text-primary-foreground shadow-sm"
 : "bg-card text-foreground-light hover:text-foreground hover:bg-surface-200 border border-border"
 )}
 >
 allsection
 </button>
 {displayCategories.map((category) => {
 const config = categoryConfig[category.id];
 return (
 <button
 key={category.id}
 onClick={() => onCategorySelect?.(category.id)}
 className={cn(
 "px-4 py-2 rounded-lg text-sm font-medium transition-all",
 selectedCategory === category.id
 ? "bg-primary text-primary-foreground shadow-sm"
 : "bg-card text-foreground-light hover:text-foreground hover:bg-surface-200 border border-border"
 )}
 >
 {config?.label || category.name}
 {showCount && category.count > 0 && (
 <span className="ml-2 opacity-60">{category.count}</span>
 )}
 </button>
 );
 })}
 </div>
 );
 }

 if (variant === "icon") {
 return (
 <div className={cn("grid grid-cols-5 sm:grid-cols-10 gap-3", className)}>
 {displayCategories.map((category) => {
 const config = categoryConfig[category.id];
 const IconComponent = config?.icon || Sparkles;
 const isSelected = selectedCategory === category.id;

 return (
 <button
 key={category.id}
 onClick={() => onCategorySelect?.(category.id)}
 className={cn(
 "flex flex-col items-center gap-2 p-3 rounded-xl transition-all",
 isSelected
 ? "bg-primary/10 border border-primary/30"
 : "bg-card border border-border hover:border-primary/30 hover:bg-surface-200"
 )}
 >
 <div
 className={cn(
 "w-10 h-10 rounded-xl flex items-center justify-center",
 isSelected ? "bg-primary/20" : "bg-surface-200"
 )}
 >
 <IconComponent
 className={cn("w-5 h-5", isSelected ? "text-primary" : config?.color)}
 />
 </div>
 <span className="text-xs font-medium text-center text-foreground truncate w-full">
 {config?.label || category.name}
 </span>
 </button>
 );
 })}
 </div>
 );
 }

 // Card variant (default)
 return (
 <div
 className={cn(
 "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4",
 className
 )}
 >
 {displayCategories.slice(0, 10).map((category, index) => {
 const config = categoryConfig[category.id];
 const IconComponent = config?.icon || Sparkles;
 const isSelected = selectedCategory === category.id;

 if (onCategorySelect) {
 return (
 <button
 key={category.id}
 onClick={() => onCategorySelect(category.id)}
 className={cn(
 "group relative p-4 rounded-2xl text-left transition-all duration-300",
 "border hover:-translate-y-1",
 isSelected
 ? "bg-primary/10 border-primary/30 shadow-lg shadow-primary/10"
 : "bg-card border-border hover:border-primary/30 hover:shadow-lg"
 )}
 style={{
 animationDelay: `${index * 50}ms`,
 animation: "cardFadeIn 400ms ease-out both",
 }}
 >
 <div
 className={cn(
 "w-12 h-12 rounded-xl flex items-center justify-center mb-3",
 `bg-gradient-to-br ${config?.gradient || "from-muted/20 to-muted/10"}`
 )}
 >
 <IconComponent className={cn("w-6 h-6", config?.color)} />
 </div>
 <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
 {config?.label || category.name}
 </h3>
 <p className="text-xs text-foreground-light line-clamp-1">
 {config?.description || category.description}
 </p>
 {showCount && category.count > 0 && (
 <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-surface-200 text-xs text-foreground-light">
 {category.count}
 </div>
 )}
 </button>
 );
 }

 return (
 <Link key={category.id} href={`/store?category=${category.id}`}>
 <div
 className={cn(
 "group relative p-4 rounded-2xl transition-all duration-300",
 "bg-card border border-border",
 "hover:border-primary/30 hover:shadow-lg hover:-translate-y-1"
 )}
 style={{
 animationDelay: `${index * 50}ms`,
 animation: "cardFadeIn 400ms ease-out both",
 }}
 >
 <div
 className={cn(
 "w-12 h-12 rounded-xl flex items-center justify-center mb-3",
 `bg-gradient-to-br ${config?.gradient || "from-muted/20 to-muted/10"}`
 )}
 >
 <IconComponent className={cn("w-6 h-6", config?.color)} />
 </div>
 <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors flex items-center gap-1">
 {config?.label || category.name}
 <ArrowRight className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
 </h3>
 <p className="text-xs text-foreground-light line-clamp-1">
 {config?.description || category.description}
 </p>
 {showCount && category.count > 0 && (
 <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-surface-200 text-xs text-foreground-light">
 {category.count}
 </div>
 )}
 </div>
 </Link>
 );
 })}
 </div>
 );
}
