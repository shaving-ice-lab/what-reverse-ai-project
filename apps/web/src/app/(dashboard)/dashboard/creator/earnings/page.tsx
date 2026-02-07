"use client";

/**
 * CreativeuserRevenuePage
 * Supabase Style: Minimal, Professional, DataDriven
 */

import { useState } from "react";
import Link from "next/link";
import {
 DollarSign,
 TrendingUp,
 TrendingDown,
 Download,
 Calendar,
 ArrowRight,
 CreditCard,
 Clock,
 CheckCircle,
 AlertCircle,
 Users,
 Eye,
 ShoppingCart,
 ChevronRight,
 Filter,
 BarChart3,
 PieChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PageContainer, PageHeader } from "@/components/dashboard/page-layout";

// RevenueOverview
const earningsOverview = {
 totalEarnings: 12580.50,
 thisMonth: 2340.80,
 lastMonth: 1890.20,
 pending: 580.00,
 available: 1760.80,
};

// RevenueTrend(Recent 7 days)
const earningsTrend = [
 { date: "1/24", amount: 120 },
 { date: "1/25", amount: 180 },
 { date: "1/26", amount: 95 },
 { date: "1/27", amount: 250 },
 { date: "1/28", amount: 310 },
 { date: "1/29", amount: 175 },
 { date: "1/30", amount: 220 },
];

// RevenueSource
const earningSources = [
 { source: "TemplateSales", amount: 1520.50, percentage: 65, color: "bg-brand-500" },
 { source: "SubscriptionSplit", amount: 580.30, percentage: 25, color: "bg-surface-300" },
 { source: "RecommendedRewards", amount: 240.00, percentage: 10, color: "bg-surface-200" },
];

// TransactionRecord
const transactions = [
 {
 id: "txn-1",
 type: "sale",
 description: "SEO BlogArticleTemplateSales",
 amount: 29.99,
 status: "completed",
 date: "2026-01-30 14:23",
 },
 {
 id: "txn-2",
 type: "sale",
 description: "ProductPublishAnnouncementTemplateSales",
 amount: 19.99,
 status: "completed",
 date: "2026-01-30 11:15",
 },
 {
 id: "txn-3",
 type: "subscription",
 description: "1monthsSubscriptionSplit",
 amount: 145.50,
 status: "pending",
 date: "2026-01-29 00:00",
 },
 {
 id: "txn-4",
 type: "referral",
 description: "RecommendednewUserRewards",
 amount: 50.00,
 status: "completed",
 date: "2026-01-28 09:30",
 },
 {
 id: "txn-5",
 type: "withdrawal",
 description: "WithdrawtorowAccount",
 amount: -500.00,
 status: "completed",
 date: "2026-01-25 16:00",
 },
 {
 id: "txn-6",
 type: "sale",
 description: "Twitter TemplateSales",
 amount: 14.99,
 status: "completed",
 date: "2026-01-25 10:45",
 },
];

// FetchTransactionIcon
const getTransactionIcon = (type: string) => {
 switch (type) {
 case "sale":
 return ShoppingCart;
 case "subscription":
 return Users;
 case "referral":
 return Users;
 case "withdrawal":
 return CreditCard;
 default:
 return DollarSign;
 }
};

// FetchStatusInfo
const getStatusInfo = (status: string) => {
 switch (status) {
 case "completed":
 return { label: "Completed", color: "text-brand-500", bg: "bg-brand-200" };
 case "pending":
 return { label: "Processing", color: "text-foreground-light", bg: "bg-surface-200" };
 case "failed":
 return { label: "Failed", color: "text-destructive", bg: "bg-destructive-200" };
 default:
 return { label: status, color: "text-foreground-muted", bg: "bg-surface-200" };
 }
};

export default function CreatorEarningsPage() {
 const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">("30d");

 // CalculateGrowthrate
 const growthRate = ((earningsOverview.thisMonth - earningsOverview.lastMonth) / earningsOverview.lastMonth * 100).toFixed(1);
 const isPositiveGrowth = parseFloat(growthRate) >= 0;

 // MaximumvalueUsed forChart
 const maxEarning = Math.max(...earningsTrend.map((d) => d.amount));

 return (
 <PageContainer>
 <div className="max-w-6xl mx-auto space-y-6">
 <div className="page-caption">Creator</div>
 <PageHeader
 title="RevenueOverview"
 description="ViewandManageyou'sCreativeRevenue"
 actions={(
 <div className="flex items-center gap-3">
 <Button variant="outline" size="sm" className="border-border text-foreground-light hover:bg-surface-100">
 <Download className="mr-2 w-4 h-4" />
 ExportReport
 </Button>
 <Button size="sm" className="bg-brand-500 hover:bg-brand-600 text-background">
 <CreditCard className="mr-2 w-4 h-4" />
 Withdraw
 </Button>
 </div>
 )}
 />

 <div className="page-divider" />

 {/* RevenueCard */}
 <div className="page-grid grid-cols-2 lg:grid-cols-4">
 <div className="page-panel p-6">
 <div className="flex items-center justify-between mb-2">
 <span className="text-[13px] text-foreground-light">totalRevenue</span>
 <DollarSign className="w-4 h-4 text-foreground-muted" />
 </div>
 <div className="text-xl font-semibold text-foreground">
 {earningsOverview.totalEarnings.toLocaleString()}
 </div>
 </div>
 <div className="page-panel p-6">
 <div className="flex items-center justify-between mb-2">
 <span className="text-[13px] text-foreground-light">currentmonthsRevenue</span>
 {isPositiveGrowth ? (
 <TrendingUp className="w-4 h-4 text-brand-500" />
 ) : (
 <TrendingDown className="w-4 h-4 text-destructive" />
 )}
 </div>
 <div className="text-xl font-semibold text-foreground">
 {earningsOverview.thisMonth.toLocaleString()}
 </div>
 <div className={cn(
 "text-xs mt-1",
 isPositiveGrowth ? "text-brand-500" : "text-destructive"
 )}>
 {isPositiveGrowth ? "+": ""}{growthRate}% vs onmonths
 </div>
 </div>
 <div className="page-panel p-6">
 <div className="flex items-center justify-between mb-2">
 <span className="text-[13px] text-foreground-light">pendingSettlement</span>
 <Clock className="w-4 h-4 text-foreground-muted" />
 </div>
 <div className="text-xl font-semibold text-foreground">
 {earningsOverview.pending.toLocaleString()}
 </div>
 <div className="text-xs text-foreground-muted mt-1">
 Estimated 2 months 5 dayto
 </div>
 </div>
 <div className="page-panel p-6">
 <div className="flex items-center justify-between mb-2">
 <span className="text-[13px] text-foreground-light">canWithdraw</span>
 <CheckCircle className="w-4 h-4 text-brand-500" />
 </div>
 <div className="text-xl font-semibold text-foreground">
 {earningsOverview.available.toLocaleString()}
 </div>
 <Link
 href="#"
 className="text-xs text-brand-500 hover:underline mt-1 inline-block"
 >
 NowWithdraw →
 </Link>
 </div>
 </div>
 {/* ContentRegion */}
 <div>
 <div className="grid lg:grid-cols-3 gap-6">
 {/* Left side: ChartandTransactionRecord */}
 <div className="lg:col-span-2 space-y-6">
 {/* RevenueTrend */}
 <div className="page-panel p-6">
 <div className="flex items-center justify-between mb-6">
 <h2 className="page-panel-title flex items-center gap-2">
 <BarChart3 className="w-4 h-4 text-brand-500" />
 RevenueTrend
 </h2>
 <div className="flex items-center gap-1">
 {(["7d", "30d", "90d", "all"] as const).map((range) => (
 <button
 key={range}
 onClick={() => setTimeRange(range)}
 className={cn(
 "px-3 py-1 rounded-md text-xs font-medium transition-all",
 timeRange === range
 ? "bg-brand-500 text-background"
 : "text-foreground-muted hover:text-foreground"
 )}
 >
 {range === "7d" ? "7days": range === "30d" ? "30days": range === "90d" ? "90days": "allsection"}
 </button>
 ))}
 </div>
 </div>

 {/* Bar Chart */}
 <div className="flex items-end justify-between gap-2 h-40">
 {earningsTrend.map((day) => (
 <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
 <div
 className="w-full bg-brand-200 hover:bg-brand-300 rounded-t-md transition-colors"
 style={{
 height: `${(day.amount / maxEarning) * 100}%`,
 }}
 >
 <div
 className="w-full bg-brand-500 rounded-t-md"
 style={{
 height: `${(day.amount / maxEarning) * 100}%`,
 }}
 />
 </div>
 <span className="text-xs text-foreground-muted">{day.date}</span>
 </div>
 ))}
 </div>
 </div>

 {/* TransactionRecord */}
 <div className="page-panel p-6">
 <div className="flex items-center justify-between mb-4">
 <h2 className="page-panel-title">TransactionRecord</h2>
 <Link
 href="/dashboard/creator/earnings"
 className="text-[13px] text-brand-500 hover:underline flex items-center gap-1"
 >
 View all
 <ChevronRight className="w-4 h-4" />
 </Link>
 </div>

 <div className="space-y-3">
 {transactions.map((txn) => {
 const Icon = getTransactionIcon(txn.type);
 const status = getStatusInfo(txn.status);
 return (
 <div
 key={txn.id}
 className="flex items-center gap-4 p-3 rounded-md hover:bg-surface-75 transition-colors"
 >
 <div className="w-9 h-9 rounded-md bg-surface-200 flex items-center justify-center shrink-0">
 <Icon className="w-4 h-4 text-foreground-muted" />
 </div>
 <div className="flex-1 min-w-0">
 <div className="text-[13px] font-medium text-foreground truncate">
 {txn.description}
 </div>
 <div className="text-xs text-foreground-muted">
 {txn.date}
 </div>
 </div>
 <div className="text-right shrink-0">
 <div className={cn(
 "text-[13px] font-semibold",
 txn.amount >= 0 ? "text-brand-500" : "text-foreground"
 )}>
 {txn.amount >= 0 ? "+" : ""}{Math.abs(txn.amount).toFixed(2)}
 </div>
 <span className={cn(
 "text-xs px-1.5 py-0.5 rounded-md",
 status.bg,
 status.color
 )}>
 {status.label}
 </span>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 </div>

 {/* Right side: RevenueSourceandQuick Actions */}
 <div className="space-y-6">
 {/* RevenueSource */}
 <div className="page-panel p-6">
 <h2 className="page-panel-title mb-4 flex items-center gap-2">
 <PieChart className="w-4 h-4 text-brand-500" />
 RevenueSource
 </h2>

 <div className="space-y-4">
 {earningSources.map((source) => (
 <div key={source.source}>
 <div className="flex items-center justify-between mb-1">
 <span className="text-[13px] text-foreground">{source.source}</span>
 <span className="text-[13px] font-medium text-foreground">
 {source.amount.toFixed(2)}
 </span>
 </div>
 <div className="h-1.5 rounded-full bg-surface-200 overflow-hidden">
 <div
 className={cn("h-full rounded-full", source.color)}
 style={{
 width: `${source.percentage}%`,
 }}
 />
 </div>
 <div className="text-xs text-foreground-muted mt-1">
 {source.percentage}%
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Quick Actions */}
 <div className="page-panel p-6">
 <h2 className="page-panel-title mb-4">Quick Actions</h2>
 <div className="space-y-2">
 <Link
 href="/dashboard/store"
 className="flex items-center justify-between p-3 rounded-md hover:bg-surface-75 transition-colors"
 >
 <span className="text-[13px] text-foreground">PublishnewTemplate</span>
 <ArrowRight className="w-4 h-4 text-foreground-muted" />
 </Link>
 <Link
 href="/dashboard/creator/analytics"
 className="flex items-center justify-between p-3 rounded-md hover:bg-surface-75 transition-colors"
 >
 <span className="text-[13px] text-foreground">ViewDataAnalytics</span>
 <ArrowRight className="w-4 h-4 text-foreground-muted" />
 </Link>
 <Link
 href="/dashboard/creator/payouts"
 className="flex items-center justify-between p-3 rounded-md hover:bg-surface-75 transition-colors"
 >
 <span className="text-[13px] text-foreground">WithdrawSettings</span>
 <ArrowRight className="w-4 h-4 text-foreground-muted" />
 </Link>
 <Link
 href="/dashboard/referral"
 className="flex items-center justify-between p-3 rounded-md hover:bg-surface-75 transition-colors"
 >
 <span className="text-[13px] text-foreground">Referral Program</span>
 <ArrowRight className="w-4 h-4 text-foreground-muted" />
 </Link>
 </div>
 </div>

 {/* HelpTip */}
 <div className="p-4 rounded-md bg-brand-200 border border-brand-400/30">
 <h3 className="text-[13px] font-medium text-foreground mb-2">
 ImproveRevenue'sTips
 </h3>
 <ul className="space-y-2 text-xs text-foreground-light">
 <li className="flex items-start gap-2">
 <CheckCircle className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
 optimalTemplateDescriptionandTags
 </li>
 <li className="flex items-start gap-2">
 <CheckCircle className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
 PeriodicUpdatePopularTemplate
 </li>
 <li className="flex items-start gap-2">
 <CheckCircle className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
 andReferral ProgramEarnRewards
 </li>
 </ul>
 <Link href="/dashboard/learn" className="text-brand-500 text-xs hover:underline mt-3 inline-block">
 ViewCompleteGuide →
 </Link>
 </div>
 </div>
 </div>
 </div>
 </div>
 </PageContainer>
 );
}
