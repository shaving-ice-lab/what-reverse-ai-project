"use client";

/**
 * CreativeAssistantHome - Supabase Settings Style
 * useSidebar'sLayout, MinimalTextPriorityDesign
 */

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
 Sparkles,
 FileText,
 Image,
 Code,
 MessageSquare,
 ArrowRight,
 Plus,
 Clock,
 Star,
 Zap,
 PenTool,
 Lightbulb,
 BookOpen,
 ChevronRight,
 BarChart3,
 FolderOpen,
 Layout,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
 PageHeader,
 PageWithSidebar,
 SidebarNavGroup,
 SidebarNavItem,
 SettingsSection,
} from "@/components/dashboard/page-layout";

// CreativeType
const creativeTypes = [
 {
 id: "text",
 title: "charCreative",
 description: "Article, Copy, Email, Reportetc",
 icon: FileText,
 href: "/dashboard/creative/generate?type=text",
 },
 {
 id: "image",
 title: "ImageGenerate",
 description: ", , Productetc",
 icon: Image,
 href: "/dashboard/creative/generate?type=image",
 },
 {
 id: "code",
 title: "CodeAssistant",
 description: "CodeGenerate, Debug, Explain",
 icon: Code,
 href: "/dashboard/creative/generate?type=code",
 },
 {
 id: "chat",
 title: "SmartConversation",
 description: "Q&A, head, Creative",
 icon: MessageSquare,
 href: "/dashboard/creative/generate?type=chat",
 },
];

// ShortcutTemplate
const quickTemplates = [
 { id: "1", title: "Marketing Copy", icon: PenTool, uses: 12500, category: "Marketing" },
 { id: "2", title: "ProductDescription", icon: FileText, uses: 9800, category: "E-commerce" },
 { id: "3", title: "Social Media", icon: MessageSquare, uses: 8600, category: "" },
 { id: "4", title: "EmailReply", icon: Lightbulb, uses: 7200, category: "" },
 { id: "5", title: "TechnologyDocument", icon: BookOpen, uses: 6500, category: "Technology" },
 { id: "6", title: "News", icon: FileText, uses: 5800, category: "Media" },
];

// RecentDocument
const recentDocuments = [
 {
 id: "1",
 title: "Q1 MarketingPlan",
 type: "text",
 updatedAt: "10 minbefore",
 status: "completed",
 },
 {
 id: "2",
 title: "ProductPublishAnnouncement",
 type: "text",
 updatedAt: "2 hbefore",
 status: "completed",
 },
 {
 id: "3",
 title: "Customer",
 type: "text",
 updatedAt: "Yesterday",
 status: "draft",
 },
 {
 id: "4",
 title: "TechnologyDocumentDraft",
 type: "code",
 updatedAt: "2 daysbefore",
 status: "draft",
 },
];

// StatisticsData
const stats = [
 { label: "currentmonthsGenerate", value: "1,234", icon: Zap, trend: "+12%" },
 { label: "SaveTime", value: "48h", icon: Clock, trend: "+25%" },
 { label: "DocumentCount", value: "56", icon: FileText, trend: "+8%" },
 { label: "UsageTemplate", value: "23", icon: Star, trend: "+15%" },
];

// eachdayTip - Remove emoji
const dailyTips = [
 "TryUsagemoreSpecific'sDescriptioncomeObtainmore'sGenerateResult",
 "asCopyAddTargetAudienceInfocanwithImproveConversion Rate",
 "UsageTemplatecanwithSave 50% withon'sCreativeTime",
 "PeriodicViewDataAnalyticscanwithoptimalyou'sCreativePolicy",
];

// SidebarContentComponent
function CreativeSidebar() {
 const pathname = usePathname();
 
 return (
 <>
 <SidebarNavGroup title="Creative">
 <SidebarNavItem 
 href="/dashboard/creative" 
 label="Overview" 
 icon={<Layout className="w-4 h-4" />}
 active={pathname === "/dashboard/creative"} 
 />
 <SidebarNavItem 
 href="/dashboard/creative/generate" 
 label="CreateCreative" 
 icon={<Plus className="w-4 h-4" />}
 />
 <SidebarNavItem 
 href="/dashboard/creative/documents" 
 label="I'sDocument" 
 icon={<FolderOpen className="w-4 h-4" />}
 />
 <SidebarNavItem 
 href="/dashboard/creative/templates" 
 label="Template Gallery" 
 icon={<BookOpen className="w-4 h-4" />}
 />
 </SidebarNavGroup>
 <SidebarNavGroup title="Data">
 <SidebarNavItem 
 href="/dashboard/creative/analytics" 
 label="DataAnalytics" 
 icon={<BarChart3 className="w-4 h-4" />}
 />
 </SidebarNavGroup>
 </>
 );
}

export default function CreativePage() {
 const [currentTipIndex] = useState(0);

 return (
 <PageWithSidebar 
 sidebar={<CreativeSidebar />} 
 sidebarTitle="Creative"
 sidebarWidth="narrow"
 >
 {/* PageHeader */}
 <PageHeader
 title="CreativeWorkshop"
 description="AI Driven'sContentCreativeTool"
 actions={
 <div className="flex items-center gap-2">
 <Link href="/dashboard/creative/templates">
 <Button
 variant="outline"
 size="sm"
 className="h-8 border-border text-foreground-light hover:text-foreground hover:bg-surface-100/60 transition-colors"
 >
 <BookOpen className="w-4 h-4 mr-2" />
 Template Gallery
 </Button>
 </Link>
 <Link href="/dashboard/creative/generate">
 <Button size="sm" className="h-8 bg-brand-500 hover:bg-brand-600 text-background">
 <Plus className="w-4 h-4 mr-2" />
 CreateCreative
 </Button>
 </Link>
 </div>
 }
 />

 <div className="space-y-6">
 {/* UsageStatistics */}
 <SettingsSection 
 title="UsageStatistics" 
 description="currentmonthsCreativeDataOverview"
 compact
 >
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
 {stats.map((stat) => (
 <div
 key={stat.label}
 className="p-3 rounded-md bg-surface-75 border border-border hover:border-border-strong transition-colors"
 >
 <div className="flex items-center justify-between mb-2">
 <span className="text-[11px] font-medium uppercase tracking-wide text-foreground-muted">
 {stat.label}
 </span>
 <stat.icon className="w-3.5 h-3.5 text-foreground-muted" />
 </div>
 <div className="flex items-end gap-2">
 <span className="text-lg font-semibold text-foreground">{stat.value}</span>
 <span className="text-[11px] font-medium text-brand-500">{stat.trend}</span>
 </div>
 </div>
 ))}
 </div>
 </SettingsSection>

 {/* TodayTip */}
 <SettingsSection 
 title="TodayTip" 
 description="CreativeSuggestion"
 compact
 >
 <div className="flex items-start gap-3 p-3 rounded-md bg-surface-75 border border-border">
 <Lightbulb className="w-4 h-4 text-foreground-muted shrink-0 mt-0.5" />
 <p className="text-[12px] text-foreground-light leading-relaxed">
 {dailyTips[currentTipIndex]}
 </p>
 </div>
 </SettingsSection>

 {/* CreativeType */}
 <SettingsSection 
 title="CreativeType" 
 description="SelectSuitable'sGeneratemethod"
 >
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
 {creativeTypes.map((type) => (
 <Link
 key={type.id}
 href={type.href}
 className={cn(
 "group p-4 rounded-md",
 "bg-surface-75 border border-border",
 "hover:border-border-strong hover:bg-surface-100/60",
 "transition-colors"
 )}
 >
 <div className="w-8 h-8 rounded-md bg-surface-200 flex items-center justify-center mb-3">
 <type.icon className="w-4 h-4 text-foreground-light" />
 </div>
 <h3 className="text-[12px] font-medium text-foreground group-hover:text-foreground-light transition-colors">
 {type.title}
 </h3>
 <p className="text-[11px] text-foreground-muted mt-1">
 {type.description}
 </p>
 </Link>
 ))}
 </div>
 </SettingsSection>

 {/* PopularTemplate */}
 <SettingsSection 
 title="PopularTemplate" 
 description="Usagerate'sCreativeTemplate"
 footer={
 <Link
 href="/dashboard/creative/templates"
 className="text-[12px] text-foreground-muted hover:text-foreground flex items-center gap-1 transition-colors"
 >
 View allTemplate
 <ArrowRight className="w-3 h-3" />
 </Link>
 }
 >
 <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
 {quickTemplates.map((template) => (
 <Link
 key={template.id}
 href={`/dashboard/creative/generate?template=${template.id}`}
 className={cn(
 "flex items-center gap-3 p-3 rounded-md",
 "bg-surface-75 border border-border",
 "hover:border-border-strong hover:bg-surface-100/60",
 "transition-colors group"
 )}
 >
 <div className="w-8 h-8 rounded-md bg-surface-200 flex items-center justify-center shrink-0">
 <template.icon className="w-4 h-4 text-foreground-muted group-hover:text-foreground-light transition-colors" />
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2">
 <h4 className="text-[12px] font-medium text-foreground-light truncate group-hover:text-foreground transition-colors">
 {template.title}
 </h4>
 <span className="text-[10px] text-foreground-muted px-1.5 py-0.5 rounded bg-surface-200 shrink-0">
 {template.category}
 </span>
 </div>
 <p className="text-[11px] text-foreground-muted mt-0.5">
 {template.uses.toLocaleString()} timesUsage
 </p>
 </div>
 <ChevronRight className="w-3.5 h-3.5 text-foreground-muted group-hover:text-foreground-light transition-colors shrink-0" />
 </Link>
 ))}
 </div>
 </SettingsSection>

 {/* RecentDocument */}
 <SettingsSection 
 title="RecentDocument" 
 description="ContinueEditRecentContent"
 footer={
 <Link
 href="/dashboard/creative/documents"
 className="text-[12px] text-foreground-muted hover:text-foreground flex items-center gap-1 transition-colors"
 >
 View allDocument
 <ArrowRight className="w-3 h-3" />
 </Link>
 }
 >
 <div className="space-y-2">
 {recentDocuments.map((doc) => (
 <Link
 key={doc.id}
 href={`/dashboard/creative/document/${doc.id}`}
 className={cn(
 "flex items-center gap-3 p-3 rounded-md",
 "bg-surface-75 border border-border",
 "hover:border-border-strong hover:bg-surface-100/60",
 "transition-colors group"
 )}
 >
 <div className="w-8 h-8 rounded-md bg-surface-200 flex items-center justify-center shrink-0">
 {doc.type === "code" ? (
 <Code className="w-4 h-4 text-foreground-muted" />
 ) : (
 <FileText className="w-4 h-4 text-foreground-muted" />
 )}
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2">
 <h4 className="text-[12px] font-medium text-foreground-light truncate group-hover:text-foreground transition-colors">
 {doc.title}
 </h4>
 <span className={cn(
 "text-[10px] px-1.5 py-0.5 rounded shrink-0",
 doc.status === "completed"
 ? "bg-brand-200 text-brand-500"
 : "bg-surface-200 text-foreground-muted"
 )}>
 {doc.status === "completed" ? "Completed": "Draft"}
 </span>
 </div>
 <p className="text-[11px] text-foreground-muted mt-0.5">
 {doc.updatedAt}
 </p>
 </div>
 <ChevronRight className="w-3.5 h-3.5 text-foreground-muted group-hover:text-foreground-light transition-colors shrink-0" />
 </Link>
 ))}
 </div>
 </SettingsSection>

 {/* InspirationEntry - version */}
 <div className="p-4 rounded-lg bg-surface-100 border border-border">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-md bg-surface-200 flex items-center justify-center">
 <Sparkles className="w-4 h-4 text-brand-500" />
 </div>
 <div>
 <h3 className="text-[12px] font-medium text-foreground">needneedInspiration?</h3>
 <p className="text-[11px] text-foreground-light">
 let AI youhead
 </p>
 </div>
 </div>
 <Link href="/dashboard/creative/generate?mode=brainstorm">
 <Button
 variant="outline"
 size="sm"
 className="h-8 border-border text-foreground-light hover:text-foreground hover:bg-surface-100/60 transition-colors"
 >
 StartCreative
 </Button>
 </Link>
 </div>
 </div>
 </div>
 </PageWithSidebar>
 );
}
