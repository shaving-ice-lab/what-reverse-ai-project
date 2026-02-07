"use client";

/**
 * CreativeDocumentListPage
 * Supabase Style: Minimal, Professional
 */

import { useState } from "react";
import Link from "next/link";
import {
 FileText,
 Plus,
 Search,
 MoreVertical,
 Edit,
 Trash2,
 Copy,
 Download,
 Clock,
 Star,
 Filter,
 LayoutGrid,
 List,
 Folder,
 Tag,
 Eye,
 ArrowUpDown,
 Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// DocumentType
const documentTypes = [
 { id: "all", name: "allsection" },
 { id: "blog", name: "BlogArticle" },
 { id: "social", name: "Social Media" },
 { id: "marketing", name: "Marketing Copy" },
 { id: "email", name: "Email" },
 { id: "product", name: "ProductDescription" },
];

// DocumentData
const documents = [
 {
 id: "doc-1",
 title: "2026yearsAIDevelopmentTrendAnalytics",
 type: "blog",
 excerpt: "enterAnalytics2026yearspersonSmartDomain'smainneedDevelopmentTrend, IncludelargeLanguageModel, multipleModalAIandmainAgent...",
 wordCount: 2500,
 createdAt: "2026-01-28",
 updatedAt: "2 hbefore",
 starred: true,
 tags: ["AI", "Trend", "Analytics"],
 },
 {
 id: "doc-2",
 title: "newProductPublishSeries",
 type: "social",
 excerpt: "asnewProductPublishPrepare's1Series Twitter , Contains10centerDesign's...",
 wordCount: 800,
 createdAt: "2026-01-27",
 updatedAt: "Yesterday",
 starred: false,
 tags: ["Twitter", "ProductPublish", "Marketing"],
 },
 {
 id: "doc-3",
 title: "Q1MarketingActivityPlan",
 type: "marketing",
 excerpt: "Detailed's#1QuarterMarketingActivityPlan, ContainsTarget, Policy, BudgetandExecutePlan...",
 wordCount: 3200,
 createdAt: "2026-01-25",
 updatedAt: "3 daysbefore",
 starred: true,
 tags: ["Marketing", "QuarterPlan", "Activity"],
 },
 {
 id: "doc-4",
 title: "CustomerWelcomeEmailTemplate",
 type: "email",
 excerpt: "asnewCustomerDesign'sWelcomeEmailSeries, Contains3notPhase'sEmailTemplate...",
 wordCount: 1200,
 createdAt: "2026-01-22",
 updatedAt: "1 weeksbefore",
 starred: false,
 tags: ["Email", "Customer", "Template"],
 },
 {
 id: "doc-5",
 title: "SmartAssistantProductDescription",
 type: "product",
 excerpt: "asE-commercePlatformPrepare'sSmartAssistantProductDescription, CoreFeaturesandUservalue...",
 wordCount: 600,
 createdAt: "2026-01-20",
 updatedAt: "1 weeksbefore",
 starred: false,
 tags: ["Product", "E-commerce", "Description"],
 },
 {
 id: "doc-6",
 title: "ContentMarketingBest Practices",
 type: "blog",
 excerpt: "SummaryContentMarketing'sBest Practices, HelpEnterpriseImproveContentMarketingEffect...",
 wordCount: 1800,
 createdAt: "2026-01-18",
 updatedAt: "2 weeksbefore",
 starred: true,
 tags: ["ContentMarketing", "Best Practices", "Guide"],
 },
];

// FetchTypeName
const getTypeName = (type: string) => {
 return documentTypes.find((t) => t.id === type)?.name || type;
};

export default function CreativeDocumentsPage() {
 const [selectedType, setSelectedType] = useState("all");
 const [searchQuery, setSearchQuery] = useState("");
 const [viewMode, setViewMode] = useState<"grid" | "list">("list");
 const [activeMenu, setActiveMenu] = useState<string | null>(null);

 // FilterDocument
 const filteredDocuments = documents.filter((doc) => {
 const matchesType = selectedType === "all" || doc.type === selectedType;
 const matchesSearch =
 doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
 doc.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
 return matchesType && matchesSearch;
 });

 // Statistics
 const stats = {
 total: documents.length,
 starred: documents.filter((d) => d.starred).length,
 totalWords: documents.reduce((sum, d) => sum + d.wordCount, 0),
 };

 return (
 <div className="flex-1 flex flex-col bg-background-studio">
 {/* Header */}
 <div className="border-b border-border bg-background-studio/95 backdrop-blur">
 <div className="max-w-7xl mx-auto px-6 py-6">
 <p className="page-caption mb-3">Creative</p>
 <div className="flex items-center justify-between mb-6">
 <div>
 <h1 className="text-page-title text-foreground">I'sDocument</h1>
 <p className="text-description">
 ManageyouGenerate'sAllCreativeContent
 </p>
 </div>
 <Link href="/dashboard/creative/generate">
 <Button className="bg-brand-500 hover:bg-brand-600 text-background">
 <Plus className="mr-2 w-4 h-4" />
 CreateDocument
 </Button>
 </Link>
 </div>

 {/* Statistics */}
 <div className="page-grid grid-cols-3">
 <div className="page-panel p-4">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-md bg-brand-200 flex items-center justify-center">
 <FileText className="w-4 h-4 text-brand-500" />
 </div>
 <div>
 <div className="text-stat-number text-foreground">
 {stats.total}
 </div>
 <div className="text-category">totalDocumentcount</div>
 </div>
 </div>
 </div>
 <div className="page-panel p-4">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-md bg-surface-200 flex items-center justify-center">
 <Star className="w-4 h-4 text-foreground-muted" />
 </div>
 <div>
 <div className="text-stat-number text-foreground">
 {stats.starred}
 </div>
 <div className="text-category">FavoriteDocument</div>
 </div>
 </div>
 </div>
 <div className="page-panel p-4">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-md bg-brand-200 flex items-center justify-center">
 <Sparkles className="w-4 h-4 text-brand-500" />
 </div>
 <div>
 <div className="text-stat-number text-foreground">
 {(stats.totalWords / 1000).toFixed(1)}k
 </div>
 <div className="text-category">totalcharcount</div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Filter */}
 <div className="border-b border-border bg-background-studio/95 backdrop-blur">
 <div className="max-w-7xl mx-auto px-6 py-4">
 <div className="page-panel p-4 flex flex-wrap items-center gap-4">
 {/* Search */}
 <div className="relative flex-1 max-w-md">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
 <Input
 placeholder="SearchDocument..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="pl-9 h-9 bg-surface-200 border-border"
 />
 </div>

 {/* TypeFilter */}
 <div className="flex items-center gap-1 p-1 rounded-md border border-border bg-surface-100">
 {documentTypes.map((type) => (
 <button
 key={type.id}
 onClick={() => setSelectedType(type.id)}
 className={cn(
 "px-3 py-1.5 rounded-md text-[13px] font-medium transition-all",
 selectedType === type.id
 ? "bg-surface-200 text-foreground shadow-sm"
 : "text-foreground-muted hover:text-foreground hover:bg-surface-200/70"
 )}
 >
 {type.name}
 </button>
 ))}
 </div>

 {/* ViewSwitch */}
 <div className="ml-auto flex items-center rounded-md border border-border bg-surface-100 p-1">
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
 </div>
 </div>
 </div>
 </div>

 {/* DocumentList */}
 <div className="flex-1 overflow-auto">
 <div className="max-w-7xl mx-auto px-6 py-6">
 <div className="page-divider" />
 {filteredDocuments.length > 0 ? (
 viewMode === "list" ? (
 <div className="space-y-3">
 {filteredDocuments.map((doc) => (
 <div
 key={doc.id}
 className={cn(
 "p-4 rounded-md",
 "bg-surface-100 border border-border",
 "hover:border-border-strong hover:bg-surface-75",
 "transition-all group"
 )}
 >
 <div className="flex items-start gap-4">
 {/* Icon */}
 <div className="w-9 h-9 rounded-md bg-surface-200 flex items-center justify-center shrink-0">
 <FileText className="w-4 h-4 text-foreground-muted" />
 </div>

 {/* Content */}
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-1">
 {doc.starred && (
 <Star className="w-4 h-4 text-brand-500 fill-brand-500" />
 )}
 <Link
 href={`/creative/document/${doc.id}`}
 className="text-[13px] font-medium text-foreground hover:text-brand-500 transition-colors"
 >
 {doc.title}
 </Link>
 <span className="px-2 py-0.5 rounded-md bg-surface-200 text-xs text-foreground-muted">
 {getTypeName(doc.type)}
 </span>
 </div>
 <p className="text-xs text-foreground-muted truncate mb-2">
 {doc.excerpt}
 </p>
 <div className="flex flex-wrap gap-1.5">
 {doc.tags.map((tag) => (
 <span
 key={tag}
 className="px-2 py-0.5 rounded-md bg-surface-200 text-foreground-muted text-xs"
 >
 {tag}
 </span>
 ))}
 </div>
 </div>

 {/* Meta */}
 <div className="hidden lg:flex items-center gap-6 text-xs text-foreground-muted shrink-0">
 <span className="w-16">{doc.wordCount} char</span>
 <span className="w-20 flex items-center gap-1">
 <Clock className="w-3 h-3" />
 {doc.updatedAt}
 </span>
 </div>

 {/* Action */}
 <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
 <Link href={`/creative/document/${doc.id}`}>
 <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground-muted hover:text-foreground">
 <Edit className="w-4 h-4" />
 </Button>
 </Link>
 <div className="relative">
 <Button
 variant="ghost"
 size="icon"
 className="h-8 w-8 text-foreground-muted hover:text-foreground"
 onClick={() =>
 setActiveMenu(
 activeMenu === doc.id ? null : doc.id
 )
 }
 >
 <MoreVertical className="w-4 h-4" />
 </Button>
 {activeMenu === doc.id && (
 <div className="absolute right-0 top-full mt-1 w-40 py-1 rounded-md bg-surface-100 border border-border z-10">
 <button className="w-full px-3 py-2 text-left text-[13px] text-foreground hover:bg-surface-75 flex items-center gap-2">
 <Copy className="w-4 h-4" />
 Copy
 </button>
 <button className="w-full px-3 py-2 text-left text-[13px] text-foreground hover:bg-surface-75 flex items-center gap-2">
 <Download className="w-4 h-4" />
 Export
 </button>
 <button className="w-full px-3 py-2 text-left text-[13px] text-foreground hover:bg-surface-75 flex items-center gap-2">
 <Star className="w-4 h-4" />
 {doc.starred ? "Unfavorite": "Favorite"}
 </button>
 <hr className="my-1 border-border" />
 <button className="w-full px-3 py-2 text-left text-[13px] text-foreground hover:bg-surface-200 flex items-center gap-2">
 <Trash2 className="w-4 h-4" />
 Delete
 </button>
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="page-grid sm:grid-cols-2 lg:grid-cols-3">
 {filteredDocuments.map((doc) => (
 <Link
 key={doc.id}
 href={`/creative/document/${doc.id}`}
 className={cn(
 "p-5 rounded-md",
 "bg-surface-100 border border-border",
 "hover:border-border-strong hover:bg-surface-75",
 "transition-all group"
 )}
 >
 <div className="flex items-start justify-between mb-3">
 <div className="w-9 h-9 rounded-md bg-surface-200 flex items-center justify-center">
 <FileText className="w-4 h-4 text-foreground-muted" />
 </div>
 {doc.starred && (
 <Star className="w-4 h-4 text-brand-500 fill-brand-500" />
 )}
 </div>
 <h3 className="text-[13px] font-medium text-foreground mb-1 group-hover:text-brand-500 transition-colors line-clamp-1">
 {doc.title}
 </h3>
 <p className="text-xs text-foreground-muted mb-3 line-clamp-2">
 {doc.excerpt}
 </p>
 <div className="flex items-center justify-between text-xs text-foreground-muted">
 <span className="px-2 py-0.5 rounded-md bg-surface-200">
 {getTypeName(doc.type)}
 </span>
 <span>{doc.wordCount} char</span>
 </div>
 </Link>
 ))}
 </div>
 )
 ) : (
 <div className="text-center py-16">
 <FileText className="w-10 h-10 text-foreground-muted mx-auto mb-4" />
 <h3 className="text-sm font-medium text-foreground mb-2">
 {searchQuery || selectedType !== "all"
 ? "NotoMatch'sDocument"
: "Not yetCreateDocument"}
 </h3>
 <p className="text-[13px] text-foreground-muted mb-6">
 {searchQuery || selectedType !== "all"
 ? "TryUsageotherheKeywordsorFilterCondition"
: "StartCreateyou's#1CreativeDocument"}
 </p>
 {searchQuery || selectedType !== "all" ? (
 <Button
 variant="outline"
 onClick={() => {
 setSearchQuery("");
 setSelectedType("all");
 }}
 className="border-border text-foreground-light"
 >
 ClearFilter
 </Button>
 ) : (
 <Link href="/dashboard/creative/generate">
 <Button className="bg-brand-500 hover:bg-brand-600 text-background">
 <Plus className="mr-2 w-4 h-4" />
 CreateDocument
 </Button>
 </Link>
 )}
 </div>
 )}
 </div>
 </div>
 </div>
 );
}
