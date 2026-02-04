"use client";

/**
 * 创作者中心 - 仪表盘页面
 *
 * Supabase 风格：极简、清晰、专业
 *
 * 功能：
 * - 收入概览
 * - 收入趋势图表
 * - 提现管理
 * - Agent 收入排行
 * - 最近收入记录
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

// 模拟数据

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
    tier_name: "成长创作者",

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

    { id: "1", earning_type: "sale", gross_amount: 99.00, net_amount: 74.25, status: "confirmed", agent: { name: "AI 文案助手" }, created_at: "2026-01-29T10:30:00Z" },

    { id: "2", earning_type: "subscription", gross_amount: 29.00, net_amount: 21.75, status: "confirmed", agent: { name: "数据分析师" }, created_at: "2026-01-29T09:15:00Z" },

    { id: "3", earning_type: "tip", gross_amount: 10.00, net_amount: 10.00, status: "pending", agent: null, created_at: "2026-01-28T18:20:00Z" },

    { id: "4", earning_type: "sale", gross_amount: 199.00, net_amount: 149.25, status: "confirmed", agent: { name: "客服机器人" }, created_at: "2026-01-28T14:00:00Z" },

    { id: "5", earning_type: "referral", gross_amount: 50.00, net_amount: 50.00, status: "settled", agent: null, created_at: "2026-01-27T12:00:00Z" },

  ],

  top_agents: [

    { agent_id: "1", agent_name: "AI 文案助手", count: 68, amount: 5200.00 },

    { agent_id: "2", agent_name: "数据分析师", count: 45, amount: 3800.00 },

    { agent_id: "3", agent_name: "客服机器人", count: 32, amount: 2600.00 },

    { agent_id: "4", agent_name: "代码审查助手", count: 18, amount: 1500.00 },

  ],
};

// 收入类型配置

const earningTypeConfig = {
  sale: { label: "销售", icon: Package, color: "text-brand-500", bgColor: "bg-brand-200/70" },
  subscription: { label: "订阅", icon: RefreshCw, color: "text-foreground-light", bgColor: "bg-surface-200" },
  tip: { label: "打赏", icon: Gift, color: "text-foreground-light", bgColor: "bg-surface-200" },
  referral: { label: "推荐", icon: Users, color: "text-foreground-light", bgColor: "bg-surface-200" },
};

// 状态配置

const statusConfig = {
  pending: { label: "待确认", icon: Clock, color: "text-warning", bgColor: "bg-warning-200" },
  confirmed: { label: "已确认", icon: CheckCircle2, color: "text-foreground-light", bgColor: "bg-surface-200" },
  settled: { label: "已结算", icon: CheckCircle2, color: "text-brand-500", bgColor: "bg-brand-200/70" },
  refunded: { label: "已退款", icon: XCircle, color: "text-destructive", bgColor: "bg-destructive-200" },
};

export default function CreatorDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);

  const [dashboard, setDashboard] = useState<typeof mockDashboard | null>(null);

  const [isWithdrawalOpen, setIsWithdrawalOpen] = useState(false);

  // 模拟加载数据

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

  // 计算距离下一等级的进度

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
      ? "支付宝"
      : account.payment_method === "wechat"
        ? "微信支付"
        : account.payment_method === "bank"
          ? "银行卡"
          : "未设置";

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
          description="管理您的收入、查看数据分析、申请提现"
          actions={(
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="border-border text-foreground-light"
              >
                <Download className="h-4 w-4 mr-2" />
                导出报表
              </Button>
              <Button
                size="sm"
                onClick={() => setIsWithdrawalOpen(true)}
                className="bg-brand-500 hover:bg-brand-600 text-background"
                disabled={account.balance < 100}
              >
                <Wallet className="h-4 w-4 mr-2" />
                申请提现
              </Button>
            </div>
          )}
        >
          <div className="flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
            <Badge variant={account.is_verified ? "success" : "warning"} size="sm">
              {account.is_verified ? "已认证" : "未认证"}
            </Badge>
            <span>收款方式: {paymentMethodLabel}</span>
            <span>当前分成 {(current_tier.commission_rate * 100).toFixed(0)}%</span>
          </div>
        </PageHeader>

        <div className="space-y-6">

        {/* 账户概览 */}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

          {/* 可提现余额 */}

          <Card className="bg-brand-200/60 border-brand-500/30">

            <CardHeader className="flex flex-row items-center justify-between pb-2">

              <CardTitle className="text-[13px] font-medium text-foreground-light">

                可提现余额

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

                待结算: {account.pending_balance.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}

              </p>

            </CardContent>

          </Card>

          {/* 今日收入 */}

          <Card className="bg-surface-100 border-border">

            <CardHeader className="flex flex-row items-center justify-between pb-2">

              <CardTitle className="text-[13px] font-medium text-foreground-light">

                今日收入

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

                较昨日 +12.5%

              </p>

            </CardContent>

          </Card>

          {/* 本周收入 */}

          <Card className="bg-surface-100 border-border">

            <CardHeader className="flex flex-row items-center justify-between pb-2">

              <CardTitle className="text-[13px] font-medium text-foreground-light">

                本周收入

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

                较上周 +8.3%

              </p>

            </CardContent>

          </Card>

          {/* 本月收入 */}

          <Card className="bg-surface-100 border-border">

            <CardHeader className="flex flex-row items-center justify-between pb-2">

              <CardTitle className="text-[13px] font-medium text-foreground-light">

                本月收入

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

                较上月 +15.2%

              </p>

            </CardContent>

          </Card>

        </div>

        {/* 分成等级卡片 */}

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

                    当前分成比例: {(current_tier.commission_rate * 100).toFixed(0)}%

                  </CardDescription>

                </div>

              </div>

              <Tooltip>

                <TooltipTrigger>

                  <Info className="h-4 w-4 text-foreground-muted" />

                </TooltipTrigger>

                <TooltipContent side="left" className="max-w-xs">

                  <p>月收入越高，分成比例越高。继续加油！</p>

                </TooltipContent>

              </Tooltip>

            </div>

          </CardHeader>

          <CardContent>

            <div className="space-y-3">

              <div className="flex justify-between text-[13px]">

                <span className="text-foreground-light">

                  本月收入: {account.monthly_revenue.toLocaleString()}

                </span>

                {current_tier.max_revenue && (
                  <span className="text-foreground-light">

                    下一等级: {current_tier.max_revenue.toLocaleString()}

                  </span>

                )}

              </div>

              <Progress value={tierProgress} size="sm" />

              <p className="text-xs text-foreground-muted">

                {current_tier.max_revenue 

                  ? `还需 ${(current_tier.max_revenue - account.monthly_revenue).toLocaleString()} 即可升级到下一等级`

                  : "您已达到最高等级！"

                }

              </p>

            </div>

          </CardContent>

        </Card>

        {/* 收入分布和趋势 */}

        <div className="grid gap-6 lg:grid-cols-3">

          {/* 收入类型分布 */}

          <Card className="bg-surface-100 border-border">

            <CardHeader>

              <CardTitle className="text-sm font-medium">收入来源</CardTitle>

              <CardDescription className="text-[13px]">本月各类型收入占比</CardDescription>

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

          {/* 收入趋势图表 */}

          <Card className="lg:col-span-2 bg-surface-100 border-border">

            <CardHeader>

              <CardTitle className="text-sm font-medium">收入趋势</CardTitle>

              <CardDescription className="text-[13px]">近 6 个月收入变化</CardDescription>

            </CardHeader>

            <CardContent>

              <EarningsChart data={dashboard.monthly} />

            </CardContent>

          </Card>

        </div>

        {/* Top Agents 和最近收入 */}

        <div className="grid gap-6 lg:grid-cols-2">

          {/* Top Agents */}

          <Card className="bg-surface-100 border-border">

            <CardHeader>

              <CardTitle className="text-sm font-medium">热门 Agent</CardTitle>

              <CardDescription className="text-[13px]">收入最高的 Agent</CardDescription>

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

                      {agent.count} 笔交易

                    </div>

                  </div>

                  <div className="text-[13px] font-semibold text-brand-500">

                    {agent.amount.toLocaleString()}

                  </div>

                </div>

              ))}

            </CardContent>

            <CardFooter className="border-t border-border bg-surface-75/70">

              <Link href="/my-agents" className="text-[13px] text-brand-500 hover:underline flex items-center">

                查看所有 Agent

                <ChevronRight className="h-4 w-4 ml-1" />

              </Link>

            </CardFooter>

          </Card>

          {/* 最近收入 */}

          <Card className="bg-surface-100 border-border">

            <CardHeader>

              <CardTitle className="text-sm font-medium">最近收入</CardTitle>

              <CardDescription className="text-[13px]">最新的收入记录</CardDescription>

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

              <Link href="/creator/earnings" className="text-[13px] text-brand-500 hover:underline flex items-center">

                查看全部记录

                <ChevronRight className="h-4 w-4 ml-1" />

              </Link>

            </CardFooter>

          </Card>

        </div>

        {/* 收入明细表格 */}

        <Card className="bg-surface-100 border-border">

          <CardHeader>

            <div className="flex items-center justify-between">

              <div>

                <CardTitle className="text-sm font-medium">收入明细</CardTitle>

                <CardDescription className="text-[13px]">查看所有收入记录</CardDescription>

              </div>

              <Tabs defaultValue="all" className="w-auto">

                <TabsList variant="segment" size="sm" className="bg-surface-200 border border-border">

                  <TabsTrigger value="all">全部</TabsTrigger>

                  <TabsTrigger value="sale">销售</TabsTrigger>

                  <TabsTrigger value="subscription">订阅</TabsTrigger>

                  <TabsTrigger value="tip">打赏</TabsTrigger>

                </TabsList>

              </Tabs>

            </div>

          </CardHeader>

          <CardContent>

            <EarningsTable earnings={dashboard.recent_earnings} />

          </CardContent>

        </Card>

      </div>

      {/* 提现对话框 */}

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

// 骨架屏

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

