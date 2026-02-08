"use client";

/**
 * Search Result Display Component
 * Used for displaying all search feature results
 */

import { useState } from "react";
import Link from "next/link";
import {
 Search,
 Zap,
 Bot,
 MessageSquare,
 FileText,
 Users,
 Settings,
 Clock,
 ArrowRight,
 Star,
 History,
 TrendingUp,
 Sparkles,
 Command,
 X,
 Filter,
 Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Search result type
export type SearchResultType = 
 | "workflow"
 | "agent"
 | "conversation"
 | "document"
 | "team"
 | "setting"
 | "action";

// Search result config
const resultTypeConfig: Record<SearchResultType, {
 icon: typeof Zap;
 label: string;
 color: string;
 bg: string;
}> = {
 workflow: { icon: Zap, label: "Workflow", color: "text-amber-500", bg: "bg-amber-500/10" },
 agent: { icon: Bot, label: "Agent", color: "text-purple-500", bg: "bg-purple-500/10" },
 conversation: { icon: MessageSquare, label: "Conversation", color: "text-blue-500", bg: "bg-blue-500/10" },
 document: { icon: FileText, label: "Document", color: "text-emerald-500", bg: "bg-emerald-500/10" },
 team: { icon: Users, label: "Team", color: "text-pink-500", bg: "bg-pink-500/10" },
 setting: { icon: Settings, label: "Settings", color: "text-muted-foreground", bg: "bg-muted/50" },
 action: { icon: Command, label: "Action", color: "text-cyan-500", bg: "bg-cyan-500/10" },
};

// ============================================
// Search result
// ============================================

export interface SearchResult {
 id: string;
 type: SearchResultType;
 title: string;
 description?: string;
 href: string;
 starred?: boolean;
 updatedAt?: string;
 meta?: Record<string, string | number>;
}

interface SearchResultItemProps {
 result: SearchResult;
 isActive?: boolean;
 onClick?: () => void;
 className?: string;
}

export function SearchResultItem({
 result,
 isActive,
 onClick,
 className,
}: SearchResultItemProps) {
 const config = resultTypeConfig[result.type];
 const Icon = config.icon;

 return (
 <Link
 href={result.href}
 onClick={onClick}
 className={cn(
 "flex items-center gap-3 p-3 rounded-xl transition-all",
 "hover:bg-muted/50",
 isActive && "bg-primary/5 border border-primary/20",
 className
 )}
 >
 <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", config.bg)}>
 <Icon className={cn("w-5 h-5", config.color)} />
 </div>

 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-0.5">
 <h4 className="font-medium text-foreground truncate">{result.title}</h4>
 {result.starred && (
 <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
 )}
 </div>
 {result.description && (
 <p className="text-sm text-muted-foreground truncate">{result.description}</p>
 )}
 </div>

 <Badge variant="secondary" className={cn("shrink-0 text-xs", config.bg, config.color)}>
 {config.label}
 </Badge>

 <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
 </Link>
 );
}

// ============================================
// Search result group
// ============================================

interface SearchResultGroupProps {
 title: string;
 results: SearchResult[];
 showAll?: boolean;
 onShowAll?: () => void;
 maxItems?: number;
 className?: string;
}

export function SearchResultGroup({
 title,
 results,
 showAll,
 onShowAll,
 maxItems = 3,
 className,
}: SearchResultGroupProps) {
 const displayResults = showAll ? results : results.slice(0, maxItems);
 const hasMore = results.length > maxItems && !showAll;

 if (results.length === 0) return null;

 return (
 <div className={cn("", className)}>
 <div className="flex items-center justify-between mb-2 px-2">
 <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
 {title}
 </h3>
 {hasMore && (
 <button
 onClick={onShowAll}
 className="text-xs text-primary hover:underline"
 >
 View all ({results.length})
 </button>
 )}
 </div>
 <div className="space-y-1">
 {displayResults.map((result) => (
 <SearchResultItem key={result.id} result={result} />
 ))}
 </div>
 </div>
 );
}

// ============================================
// Search suggestion
// ============================================

interface SearchSuggestion {
 id: string;
 query: string;
 type: "recent" | "trending" | "suggested";
}

interface SearchSuggestionsProps {
 suggestions: SearchSuggestion[];
 onSelect: (query: string) => void;
 className?: string;
}

export function SearchSuggestions({
 suggestions,
 onSelect,
 className,
}: SearchSuggestionsProps) {
 const getSuggestionIcon = (type: SearchSuggestion["type"]) => {
 switch (type) {
 case "recent":
 return History;
 case "trending":
 return TrendingUp;
 case "suggested":
 return Sparkles;
 }
 };

 const getSuggestionLabel = (type: SearchSuggestion["type"]) => {
 switch (type) {
 case "recent":
 return "Recent Searches";
 case "trending":
 return "Popular Searches";
 case "suggested":
 return "Recommended";
 }
 };

 // Group by type
 const groupedSuggestions = suggestions.reduce((acc, suggestion) => {
 if (!acc[suggestion.type]) {
 acc[suggestion.type] = [];
 }
 acc[suggestion.type].push(suggestion);
 return acc;
 }, {} as Record<string, SearchSuggestion[]>);

 return (
 <div className={cn("space-y-4", className)}>
 {Object.entries(groupedSuggestions).map(([type, items]) => {
 const Icon = getSuggestionIcon(type as SearchSuggestion["type"]);
 const label = getSuggestionLabel(type as SearchSuggestion["type"]);

 return (
 <div key={type}>
 <div className="flex items-center gap-2 mb-2 px-2">
 <Icon className="w-4 h-4 text-muted-foreground" />
 <span className="text-xs font-medium text-muted-foreground">
 {label}
 </span>
 </div>
 <div className="flex flex-wrap gap-2">
 {items.map((suggestion) => (
 <button
 key={suggestion.id}
 onClick={() => onSelect(suggestion.query)}
 className="px-3 py-1.5 rounded-full bg-muted text-sm text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
 >
 {suggestion.query}
 </button>
 ))}
 </div>
 </div>
 );
 })}
 </div>
 );
}

// ============================================
// Empty Search State
// ============================================

interface EmptySearchStateProps {
 query?: string;
 className?: string;
}

export function EmptySearchState({ query, className }: EmptySearchStateProps) {
 return (
 <div className={cn("flex flex-col items-center justify-center py-12", className)}>
 <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
 <Search className="w-8 h-8 text-muted-foreground" />
 </div>
 <h3 className="text-lg font-medium text-foreground mb-2">
 {query ? `No results for "${query}"` : "Start searching"}
 </h3>
 <p className="text-sm text-muted-foreground text-center max-w-sm">
 {query
 ? "Try different keywords or check spelling"
: "Search workflows, agents, conversations, documents and more"}
 </p>
 </div>
 );
}

// ============================================
// Search Loading State
// ============================================

interface SearchLoadingStateProps {
 className?: string;
}

export function SearchLoadingState({ className }: SearchLoadingStateProps) {
 return (
 <div className={cn("flex flex-col items-center justify-center py-12", className)}>
 <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
 <p className="text-sm text-muted-foreground">Searching...</p>
 </div>
 );
}

// ============================================
// Search Filters
// ============================================

interface SearchFiltersProps {
 selectedType: SearchResultType | "all";
 onTypeChange: (type: SearchResultType | "all") => void;
 className?: string;
}

export function SearchFilters({
 selectedType,
 onTypeChange,
 className,
}: SearchFiltersProps) {
 const types: (SearchResultType | "all")[] = [
 "all",
 "workflow",
 "agent",
 "conversation",
 "document",
 ];

 return (
 <div className={cn("flex items-center gap-2 overflow-x-auto pb-2", className)}>
 {types.map((type) => {
 const config = type === "all" ? null : resultTypeConfig[type];
 const Icon = config?.icon || Filter;

 return (
 <button
 key={type}
 onClick={() => onTypeChange(type)}
 className={cn(
 "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
 selectedType === type
 ? "bg-primary text-primary-foreground"
 : "bg-muted text-muted-foreground hover:text-foreground"
 )}
 >
 <Icon className="w-4 h-4" />
 {type === "all" ? "All": config?.label}
 </button>
 );
 })}
 </div>
 );
}

// ============================================
// Quick Actions
// ============================================

interface QuickAction {
 id: string;
 title: string;
 description?: string;
 icon: typeof Zap;
 action: () => void;
 shortcut?: string[];
}

interface QuickActionsProps {
 actions: QuickAction[];
 className?: string;
}

export function QuickActions({ actions, className }: QuickActionsProps) {
 if (actions.length === 0) return null;

 return (
 <div className={cn("", className)}>
 <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
 Quick Actions
 </h3>
 <div className="space-y-1">
 {actions.map((action) => {
 const Icon = action.icon;
 return (
 <button
 key={action.id}
 onClick={action.action}
 className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left"
 >
 <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
 <Icon className="w-5 h-5 text-primary" />
 </div>
 <div className="flex-1 min-w-0">
 <h4 className="font-medium text-foreground">{action.title}</h4>
 {action.description && (
 <p className="text-sm text-muted-foreground truncate">
 {action.description}
 </p>
 )}
 </div>
 {action.shortcut && (
 <div className="flex items-center gap-1">
 {action.shortcut.map((key, idx) => (
 <kbd
 key={idx}
 className="min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded bg-muted border border-border text-[10px] font-medium text-muted-foreground"
 >
 {key}
 </kbd>
 ))}
 </div>
 )}
 </button>
 );
 })}
 </div>
 </div>
 );
}
