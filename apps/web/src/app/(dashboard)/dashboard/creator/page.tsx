"use client";

/**
 * Creativeusercenter - DashboardPage
 *
 * Supabase Style: Minimal, Clear, Professional
 *
 * Features: 
 * - EarningsOverview
 * - EarningsTrendChart
 * - WithdrawManage
 * - Agent Earningsrow
 * - RecentEarningsRecord
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import {
 Wallet,
 TrendingUp,
 ArrowUpRight,
 DollarSign,
 Users,
 Package,
 Gift,
 RefreshCw,
 Download,
 ChevronRight,
 Info,
 CheckCircle2,
 Clock,
 XCircle,
 Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { PageContainer, PageHeader } from "@/components/dashboard/page-layout";
import { EarningsChart } from "@/components/creator/earnings-chart";
import { EarningsTable } from "@/components/creator/earnings-table";
import { WithdrawalDialog } from "@/components/creator/withdrawal-dialog";

// MockData

const mockDashboard = {
 account: {
 balance: 2580.50,

 pending_balance: 680.00,

 total_earned: 15680.50,

 total_withdrawn: 12420.00,

 monthly_revenue: 3260.50,

 sale_count: 156,

 subscription_count: 23,

 tip_count: 45,

 referral_count: 12,

 is_verified: true,

 payment_method: "alipay",

 },

 current_tier: {
 tier_name: "GrowthCreativeuser",

 commission_rate: 0.75,

 min_revenue: 1000,

 max_revenue: 5000,

 },

 today_earnings: 128.50,

 week_earnings: 856.00,

 month_earnings: 3260.50,

 by_type: [

 { type: "sale", count: 45, amount: 2280.50 },

 { type: "subscription", count: 18, amount: 680.00 },

 { type: "tip", count: 12, amount: 200.00 },

 { type: "referral", count: 3, amount: 100.00 },

 ],

 monthly: [

 { month: "2025-08", gross: 2100, net: 1575, count: 32 },

 { month: "2025-09", gross: 2450, net: 1838, count: 38 },

 { month: "2025-10", gross: 2800, net: 2100, count: 42 },

 { month: "2025-11", gross: 3100, net: 2325, count: 48 },

 { month: "2025-12", gross: 3500, net: 2625, count: 52 },

 { month: "2026-01", gross: 3260.50, net: 2445.38, count: 45 },

 ],

 recent_earnings: [

 { id: "1", earning_type: "sale", gross_amount: 99.00, net_amount: 74.25, status: "confirmed", agent: { name: "AI CopyAssistant" }, created_at: "2026-01-29T10:30:00Z" },

 { id: "2", earning_type: "subscription", gross_amount: 29.00, net_amount: 21.75, status: "confirmed", agent: { name: "DataAnalytics" }, created_at: "2026-01-29T09:15:00Z" },

 { id: "3", earning_type: "tip", gross_amount: 10.00, net_amount: 10.00, status: "pending", agent: null, created_at: "2026-01-28T18:20:00Z" },

 { id: "4", earning_type: "sale", gross_amount: 199.00, net_amount: 149.25, status: "confirmed", agent: { name: "SupportBot" }, created_at: "2026-01-28T14:00:00Z" },

 { id: "5", earning_type: "referral", gross_amount: 50.00, net_amount: 50.00, status: "settled", agent: null, created_at: "2026-01-27T12:00:00Z" },

 ],

 top_agents: [

 { agent_id: "1", agent_name: "AI CopyAssistant", count: 68, amount: 5200.00 },

 { agent_id: "2", agent_name: "DataAnalytics", count: 45, amount: 3800.00 },

 { agent_id: "3", agent_name: "SupportBot", count: 32, amount: 2600.00 },

 { agent_id: "4", agent_name: "CodeReviewAssistant", count: 18, amount: 1500.00 },

 ],
};

// EarningsTypeConfig

const earningTypeConfig = {
 sale: { label: "Sales", icon: Package, color: "text-brand-500", bgColor: "bg-brand-200/70" },
 subscription: { label: "Subscription", icon: RefreshCw, color: "text-foreground-light", bgColor: "bg-surface-200" },
 tip: { label: "", icon: Gift, color: "text-foreground-light", bgColor: "bg-surface-200" },
 referral: { label: "Recommended", icon: Users, color: "text-foreground-light", bgColor: "bg-surface-200" },
};

// StatusConfig

const statusConfig = {
 pending: { label: "pendingConfirm", icon: Clock, color: "text-warning", bgColor: "bg-warning-200" },
 confirmed: { label: "alreadyConfirm", icon: CheckCircle2, color: "text-foreground-light", bgColor: "bg-surface-200" },
 settled: { label: "alreadySettlement", icon: CheckCircle2, color: "text-brand-500", bgColor: "bg-brand-200/70" },
 refunded: { label: "alreadyRefund", icon: XCircle, color: "text-destructive", bgColor: "bg-destructive-200" },
};

export default function CreatorDashboardPage() {
 const [isLoading, setIsLoading] = useState(true);

 const [dashboard, setDashboard] = useState<typeof mockDashboard | null>(null);

 const [isWithdrawalOpen, setIsWithdrawalOpen] = useState(false);

 // MockLoadData

 useEffect(() => {
 const timer = setTimeout(() => {
 setDashboard(mockDashboard);

 setIsLoading(false);

 }, 800);

 return () => clearTimeout(timer);

 }, []);

 if (isLoading) {
 return <CreatorDashboardSkeleton />;

 }

 if (!dashboard) {
 return null;

 }

 const { account, current_tier, today_earnings, week_earnings, month_earnings } = dashboard;

 // CalculateDistancedown1etc'sProgress

 const tierProgress = current_tier.max_revenue
 ? Math.max(
 0,
 Math.min(
 ((account.monthly_revenue - current_tier.min_revenue) /
 (current_tier.max_revenue - current_tier.min_revenue)) *
 100,
 100
 )
 )
 : 100;

 const paymentMethodLabel =
 account.payment_method === "alipay"
 ? "Payment"
 : account.payment_method === "wechat"
 ? "WeChatPayment"
 : account.payment_method === "bank"
 ? "row"
: "not yetSettings";

 return (
 <PageContainer>
 <div className="max-w-6xl mx-auto space-y-6">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-md bg-brand-500 flex items-center justify-center">
 <Sparkles className="w-4 h-4 text-background" />
 </div>
 <div className="page-caption">Creator</div>
 </div>
 <PageHeader
 title="Creator Studio"
 description="Manageyou'sEarnings, ViewDataAnalytics, PleaseWithdraw"
 actions={(
 <div className="flex items-center gap-3">
 <Button
 variant="outline"
 size="sm"
 className="border-border text-foreground-light"
 >
 <Download className="h-4 w-4 mr-2" />
 ExportReport
 </Button>
 <Button
 size="sm"
 onClick={() => setIsWithdrawalOpen(true)}
 className="bg-brand-500 hover:bg-brand-600 text-background"
 disabled={account.balance < 100}
 >
 <Wallet className="h-4 w-4 mr-2" />
 PleaseWithdraw
 </Button>
 </div>
 )}
 >
 <div className="flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
 <Badge variant={account.is_verified ? "success" : "warning"} size="sm">
 {account.is_verified ? "alreadyAuthentication": "not yetAuthentication"}
 </Badge>
 <span>Paymentmethod: {paymentMethodLabel}</span>
 <span>CurrentSplit {(current_tier.commission_rate * 100).toFixed(0)}%</span>
 </div>
 </PageHeader>

 <div className="space-y-6">

 {/* AccountOverview */}

 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

 {/* canWithdrawBalance */}

 <Card className="bg-brand-200/60 border-brand-500/30">

 <CardHeader className="flex flex-row items-center justify-between pb-2">

 <CardTitle className="text-[13px] font-medium text-foreground-light">

 canWithdrawBalance

 </CardTitle>

 <div className="h-8 w-8 rounded-md bg-brand-500 flex items-center justify-center">

 <Wallet className="h-4 w-4 text-background" />

 </div>

 </CardHeader>

 <CardContent>

 <div className="text-xl font-semibold text-foreground">

 {account.balance.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}

 </div>

 <p className="text-xs text-foreground-muted mt-1">

 pendingSettlement: {account.pending_balance.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}

 </p>

 </CardContent>

 </Card>

 {/* TodayEarnings */}

 <Card className="bg-surface-100 border-border">

 <CardHeader className="flex flex-row items-center justify-between pb-2">

 <CardTitle className="text-[13px] font-medium text-foreground-light">

 TodayEarnings

 </CardTitle>

 <div className="h-8 w-8 rounded-md bg-brand-200 flex items-center justify-center">

 <TrendingUp className="h-4 w-4 text-brand-500" />

 </div>

 </CardHeader>

 <CardContent>

 <div className="text-xl font-semibold text-foreground">

 {today_earnings.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}

 </div>

 <p className="text-xs text-brand-500 mt-1 flex items-center">

 <ArrowUpRight className="h-3 w-3 mr-1" />

 day +12.5%

 </p>

 </CardContent>

 </Card>

 {/* currentweeksEarnings */}

 <Card className="bg-surface-100 border-border">

 <CardHeader className="flex flex-row items-center justify-between pb-2">

 <CardTitle className="text-[13px] font-medium text-foreground-light">

 currentweeksEarnings

 </CardTitle>

 <div className="h-8 w-8 rounded-md bg-brand-200 flex items-center justify-center">

 <DollarSign className="h-4 w-4 text-brand-500" />

 </div>

 </CardHeader>

 <CardContent>

 <div className="text-xl font-semibold text-foreground">

 {week_earnings.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}

 </div>

 <p className="text-xs text-brand-500 mt-1 flex items-center">

 <ArrowUpRight className="h-3 w-3 mr-1" />

 onweeks +8.3%

 </p>

 </CardContent>

 </Card>

 {/* currentmonthsEarnings */}

 <Card className="bg-surface-100 border-border">

 <CardHeader className="flex flex-row items-center justify-between pb-2">

 <CardTitle className="text-[13px] font-medium text-foreground-light">

 currentmonthsEarnings

 </CardTitle>

 <div className="h-8 w-8 rounded-md bg-surface-200 flex items-center justify-center">

 <TrendingUp className="h-4 w-4 text-foreground-light" />

 </div>

 </CardHeader>

 <CardContent>

 <div className="text-xl font-semibold text-foreground">

 {month_earnings.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}

 </div>

 <p className="text-xs text-brand-500 mt-1 flex items-center">

 <ArrowUpRight className="h-3 w-3 mr-1" />

 onmonths +15.2%

 </p>

 </CardContent>

 </Card>

 </div>

 {/* SplitetcCard */}

 <Card className="bg-surface-100 border-border">

 <CardHeader>

 <div className="flex items-center justify-between">

 <div className="flex items-center gap-3">

 <div className="h-9 w-9 rounded-md bg-surface-200 flex items-center justify-center">

 <Sparkles className="h-4 w-4 text-foreground-light" />

 </div>

 <div>

 <CardTitle className="text-sm font-medium">{current_tier.tier_name}</CardTitle>

 <CardDescription className="text-[13px]">

 CurrentSplitcompareexample: {(current_tier.commission_rate * 100).toFixed(0)}%

 </CardDescription>

 </div>

 </div>

 <Tooltip>

 <TooltipTrigger>

 <Info className="h-4 w-4 text-foreground-muted" />

 </TooltipTrigger>

 <TooltipContent side="left" className="max-w-xs">

 <p>monthsEarnings, Splitcompareexample.Continue!</p>

 </TooltipContent>

 </Tooltip>

 </div>

 </CardHeader>

 <CardContent>

 <div className="space-y-3">

 <div className="flex justify-between text-[13px]">

 <span className="text-foreground-light">

 currentmonthsEarnings: {account.monthly_revenue.toLocaleString()}

 </span>

 {current_tier.max_revenue && (
 <span className="text-foreground-light">

 down1etc: {current_tier.max_revenue.toLocaleString()}

 </span>

 )}

 </div>

 <Progress value={tierProgress} size="sm" />

 <p className="text-xs text-foreground-muted">

 {current_tier.max_revenue 

 ? `stillneed ${(current_tier.max_revenue - account.monthly_revenue).toLocaleString()} nowcanUpgradetodown1etc`

: "youalreadytomostetc!"

 }

 </p>

 </div>

 </CardContent>

 </Card>

 {/* EarningsDistributionandTrend */}

 <div className="grid gap-6 lg:grid-cols-3">

 {/* EarningsTypeDistribution */}

 <Card className="bg-surface-100 border-border">

 <CardHeader>

 <CardTitle className="text-sm font-medium">EarningsSource</CardTitle>

 <CardDescription className="text-[13px]">currentmonthsTypeEarningscompare</CardDescription>

 </CardHeader>

 <CardContent className="space-y-4">

 {dashboard.by_type.map((item) => {
 const config = earningTypeConfig[item.type as keyof typeof earningTypeConfig];

 const Icon = config.icon;

 const totalAmount = dashboard.by_type.reduce((sum, t) => sum + t.amount, 0);

 const percentage = (item.amount / totalAmount) * 100;

 return (
 <div key={item.type} className="flex items-center gap-3">

 <div className={cn("h-8 w-8 rounded-md flex items-center justify-center", config.bgColor)}>

 <Icon className={cn("h-4 w-4", config.color)} />

 </div>

 <div className="flex-1 min-w-0">

 <div className="flex items-center justify-between mb-1">

 <span className="text-[13px] font-medium text-foreground">

 {config.label}

 </span>

 <span className="text-[13px] text-foreground-muted">

 {item.amount.toLocaleString()}

 </span>

 </div>

 <Progress value={percentage} size="sm" />

 </div>

 <span className="text-xs text-foreground-muted w-12 text-right">

 {percentage.toFixed(0)}%

 </span>

 </div>

 );

 })}

 </CardContent>

 </Card>

 {/* EarningsTrendChart */}

 <Card className="lg:col-span-2 bg-surface-100 border-border">

 <CardHeader>

 <CardTitle className="text-sm font-medium">EarningsTrend</CardTitle>

 <CardDescription className="text-[13px]"> 6 monthsEarnings</CardDescription>

 </CardHeader>

 <CardContent>

 <EarningsChart data={dashboard.monthly} />

 </CardContent>

 </Card>

 </div>

 {/* Top Agents andRecentEarnings */}

 <div className="grid gap-6 lg:grid-cols-2">

 {/* Top Agents */}

 <Card className="bg-surface-100 border-border">

 <CardHeader>

 <CardTitle className="text-sm font-medium">Popular Agent</CardTitle>

 <CardDescription className="text-[13px]">Earningsmost's Agent</CardDescription>

 </CardHeader>

 <CardContent className="space-y-4">

 {dashboard.top_agents.map((agent, index) => (
 <div key={agent.agent_id} className="flex items-center gap-3">

 <div className={cn(
 "h-8 w-8 rounded-md flex items-center justify-center text-[13px] font-semibold",

 index === 0 ? "bg-brand-200 text-brand-500" :

 index === 1 ? "bg-surface-200 text-foreground-muted" :

 index === 2 ? "bg-surface-200 text-foreground-muted" :

 "bg-surface-200 text-foreground-muted"

 )}>

 {index + 1}

 </div>

 <div className="flex-1 min-w-0">

 <div className="text-[13px] font-medium text-foreground truncate">

 {agent.agent_name}

 </div>

 <div className="text-xs text-foreground-muted">

 {agent.count} Transaction

 </div>

 </div>

 <div className="text-[13px] font-semibold text-brand-500">

 {agent.amount.toLocaleString()}

 </div>

 </div>

 ))}

 </CardContent>

 <CardFooter className="border-t border-border bg-surface-75/70">

 <Link href="/dashboard/my-agents" className="text-[13px] text-brand-500 hover:underline flex items-center">

 ViewAll Agent

 <ChevronRight className="h-4 w-4 ml-1" />

 </Link>

 </CardFooter>

 </Card>

 {/* RecentEarnings */}

 <Card className="bg-surface-100 border-border">

 <CardHeader>

 <CardTitle className="text-sm font-medium">RecentEarnings</CardTitle>

 <CardDescription className="text-[13px]">mostnew'sEarningsRecord</CardDescription>

 </CardHeader>

 <CardContent className="space-y-4">

 {dashboard.recent_earnings.slice(0, 5).map((earning) => {
 const typeConfig = earningTypeConfig[earning.earning_type as keyof typeof earningTypeConfig];

 const TypeIcon = typeConfig.icon;

 const statusCfg = statusConfig[earning.status as keyof typeof statusConfig];

 return (
 <div key={earning.id} className="flex items-center gap-3">

 <div className={cn("h-8 w-8 rounded-md flex items-center justify-center", typeConfig.bgColor)}>

 <TypeIcon className={cn("h-4 w-4", typeConfig.color)} />

 </div>

 <div className="flex-1 min-w-0">

 <div className="text-[13px] font-medium text-foreground truncate">

 {earning.agent?.name || typeConfig.label}

 </div>

 <div className="flex items-center gap-2 text-xs text-foreground-muted">

 <span>{new Date(earning.created_at).toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>

 <Badge variant="secondary" size="sm" className={cn("text-[11px]", statusCfg.bgColor, statusCfg.color)}>

 {statusCfg.label}

 </Badge>

 </div>

 </div>

 <div className="text-[13px] font-semibold text-brand-500">

 +{earning.net_amount.toLocaleString()}

 </div>

 </div>

 );

 })}

 </CardContent>

 <CardFooter className="border-t border-border bg-surface-75/70">

 <Link href="/dashboard/creator/earnings" className="text-[13px] text-brand-500 hover:underline flex items-center">

 View allRecord

 <ChevronRight className="h-4 w-4 ml-1" />

 </Link>

 </CardFooter>

 </Card>

 </div>

 {/* EarningsDetailTable */}

 <Card className="bg-surface-100 border-border">

 <CardHeader>

 <div className="flex items-center justify-between">

 <div>

 <CardTitle className="text-sm font-medium">EarningsDetail</CardTitle>

 <CardDescription className="text-[13px]">ViewAllEarningsRecord</CardDescription>

 </div>

 <Tabs defaultValue="all" className="w-auto">

 <TabsList variant="segment" size="sm" className="bg-surface-200 border border-border">

 <TabsTrigger value="all">allsection</TabsTrigger>

 <TabsTrigger value="sale">Sales</TabsTrigger>

 <TabsTrigger value="subscription">Subscription</TabsTrigger>

 <TabsTrigger value="tip"></TabsTrigger>

 </TabsList>

 </Tabs>

 </div>

 </CardHeader>

 <CardContent>

 <EarningsTable earnings={dashboard.recent_earnings} />

 </CardContent>

 </Card>

 </div>

 {/* WithdrawDialog */}

 <WithdrawalDialog

 open={isWithdrawalOpen}

 onOpenChange={setIsWithdrawalOpen}

 balance={account.balance}

 paymentMethod={account.payment_method}

 isVerified={account.is_verified}

 />

 </div>
 </PageContainer>

 );
}

// Skeleton

function CreatorDashboardSkeleton() {
 return (
 <PageContainer>
 <div className="max-w-6xl mx-auto space-y-6">
 <div className="space-y-2">
 <Skeleton className="h-3 w-16" />
 <Skeleton className="h-8 w-48" />
 <Skeleton className="h-4 w-64" />
 </div>

 <div className="space-y-6">

 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

 {[1, 2, 3, 4].map((i) => (
 <Card key={i} className="bg-surface-100 border-border">

 <CardHeader className="pb-2">

 <Skeleton className="h-4 w-24" />

 </CardHeader>

 <CardContent>

 <Skeleton className="h-8 w-32 mb-2" />

 <Skeleton className="h-3 w-20" />

 </CardContent>

 </Card>

 ))}

 </div>

 <Skeleton className="h-[200px] w-full" />

 <div className="grid gap-6 lg:grid-cols-2">

 <Skeleton className="h-[300px]" />

 <Skeleton className="h-[300px]" />

 </div>

 </div>
 </div>
 </PageContainer>

 );
}

