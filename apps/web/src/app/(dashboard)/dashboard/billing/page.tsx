"use client";

/**
 * 计费与订阅页面 - Supabase 风格
 * 管理订阅套餐、用量、付款方式与账单历史
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageContainer, PageHeader } from "@/components/dashboard/page-layout";
import {
  ArrowUpRight,
  Bot,
  Check,
  ChevronRight,
  CreditCard,
  Crown,
  Database,
  Download,
  ExternalLink,
  Gift,
  Infinity,
  Plus,
  Receipt,
  Star,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react";

// 订阅套餐
const plans = [
  {
    id: "free",
    name: "免费版",
    description: "适合个人探索和轻度使用",
    price: 0,
    priceMonthly: 0,
    current: false,
    features: [
      { name: "每月 100 次 API 调用", included: true },
      { name: "3 个工作流", included: true },
      { name: "1 个 AI Agent", included: true },
      { name: "基础模型访问", included: true },
      { name: "社区支持", included: true },
      { name: "高级模型", included: false },
      { name: "团队协作", included: false },
      { name: "优先客服", included: false },
    ],
  },
  {
    id: "pro",
    name: "专业版",
    description: "适合专业用户和小团队",
    price: 99,
    priceMonthly: 99,
    current: true,
    popular: true,
    features: [
      { name: "每月 5,000 次 API 调用", included: true },
      { name: "无限工作流", included: true },
      { name: "10 个 AI Agent", included: true },
      { name: "高级模型访问", included: true },
      { name: "优先邮件支持", included: true },
      { name: "自定义集成", included: true },
      { name: "团队协作 (3人)", included: true },
      { name: "专属客服", included: false },
    ],
  },
  {
    id: "business",
    name: "企业版",
    description: "适合大型团队和企业",
    price: 299,
    priceMonthly: 299,
    current: false,
    features: [
      { name: "无限 API 调用", included: true },
      { name: "无限工作流", included: true },
      { name: "无限 AI Agent", included: true },
      { name: "所有模型访问", included: true },
      { name: "24/7 专属客服", included: true },
      { name: "高级安全功能", included: true },
      { name: "无限团队成员", included: true },
      { name: "SLA 保障", included: true },
    ],
  },
];

// 当前使用情况
const currentUsage = {
  apiCalls: { used: 3247, limit: 5000 },
  workflows: { used: 8, limit: -1 }, // -1 表示无限
  agents: { used: 4, limit: 10 },
  storage: { used: 2.4, limit: 10 }, // GB
  teamMembers: { used: 2, limit: 3 },
};

// 账单历史
const billingHistory = [
  {
    id: "1",
    date: "2026-01-31",
    description: "专业版订阅 - 1月",
    amount: 99,
    status: "paid",
    invoice: "INV-2026-001",
  },
  {
    id: "2",
    date: "2025-12-31",
    description: "专业版订阅 - 12月",
    amount: 99,
    status: "paid",
    invoice: "INV-2025-012",
  },
  {
    id: "3",
    date: "2025-11-30",
    description: "专业版订阅 - 11月",
    amount: 99,
    status: "paid",
    invoice: "INV-2025-011",
  },
  {
    id: "4",
    date: "2025-10-31",
    description: "额外 API 调用包",
    amount: 29,
    status: "paid",
    invoice: "INV-2025-010B",
  },
];

// 付款方式
const paymentMethods = [
  {
    id: "1",
    type: "card",
    brand: "Visa",
    last4: "4242",
    expiry: "12/27",
    default: true,
  },
];

const billingContact = {
  primaryEmail: "finance@whattech.com",
  additionalEmails: ["billing@whattech.com", "ops@whattech.com"],
};

const billingAddress = {
  name: "WhatTech",
  line1: "123 Main Street",
  line2: "Suite 7F",
  country: "中国",
  postalCode: "200000",
  city: "上海",
  state: "上海",
  taxId: "CN12345678",
};

export default function BillingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [spendCapEnabled, setSpendCapEnabled] = useState(true);
  const currentPlan = plans.find((plan) => plan.current);

  const formatCurrency = (value: number) => `¥${value.toLocaleString("zh-CN")}`;
  const formatNumber = (value: number, digits = 0) =>
    value.toLocaleString("zh-CN", { maximumFractionDigits: digits });
  const priceMultiplier = billingCycle === "yearly" ? 0.8 : 1;
  const billingLabel = billingCycle === "yearly" ? "年付" : "月付";
  const billingHint = billingCycle === "yearly" ? "已包含 20% 折扣" : "切换年付享 20% 折扣";
  const currentPlanPrice = currentPlan ? Math.round(currentPlan.price * priceMultiplier) : 0;
  const currentPlanHighlights =
    currentPlan?.features.filter((feature) => feature.included).slice(0, 3) ?? [];
  const discountAmount =
    billingCycle === "yearly" ? Math.round((currentPlan?.price ?? 0) * 0.2) : 0;
  const creditBalance = 0;

  const usageItems = [
    {
      id: "apiCalls",
      label: "API 调用",
      caption: "月度请求配额",
      icon: Zap,
      used: currentUsage.apiCalls.used,
      limit: currentUsage.apiCalls.limit,
      helper: `剩余 ${formatNumber(
        Math.max(currentUsage.apiCalls.limit - currentUsage.apiCalls.used, 0)
      )} 次`,
    },
    {
      id: "workflows",
      label: "工作流",
      caption: "已启用",
      icon: TrendingUp,
      used: currentUsage.workflows.used,
      limit: currentUsage.workflows.limit,
      helper: "无限制",
    },
    {
      id: "agents",
      label: "AI Agent",
      caption: "运行中",
      icon: Bot,
      used: currentUsage.agents.used,
      limit: currentUsage.agents.limit,
      helper: `还可创建 ${formatNumber(
        Math.max(currentUsage.agents.limit - currentUsage.agents.used, 0)
      )} 个`,
    },
    {
      id: "storage",
      label: "存储空间",
      caption: "对象存储",
      icon: Database,
      used: currentUsage.storage.used,
      limit: currentUsage.storage.limit,
      unit: "GB",
      digits: 1,
      helper: `剩余 ${formatNumber(
        Math.max(currentUsage.storage.limit - currentUsage.storage.used, 0),
        1
      )} GB`,
    },
    {
      id: "teamMembers",
      label: "团队成员",
      caption: "成员席位",
      icon: Users,
      used: currentUsage.teamMembers.used,
      limit: currentUsage.teamMembers.limit,
      helper: `还可邀请 ${formatNumber(
        Math.max(currentUsage.teamMembers.limit - currentUsage.teamMembers.used, 0)
      )} 人`,
    },
  ];

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="订阅与账单"
          description="管理套餐、额度、付款方式与发票记录"
          actions={(
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Receipt className="w-3.5 h-3.5" />}
              >
                开具发票
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
              >
                联系销售
              </Button>
              <Button
                size="sm"
                rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
              >
                升级套餐
              </Button>
            </div>
          )}
        >
          <div className="flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
            <span className="inline-flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5" />
              当前套餐 {currentPlan?.name || "专业版"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              计费方式 {billingLabel}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              折扣 {billingCycle === "yearly" ? "20%" : "无"}
            </span>
          </div>
        </PageHeader>
        <div className="page-divider" />
        <section className="page-panel relative overflow-hidden">
          <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand-500/10 blur-3xl" />
          <div className="page-panel-header flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="page-caption">当前套餐</p>
              <h2 className="text-section-title text-foreground">
                {currentPlan?.name || "专业版"}
              </h2>
              <p className="page-panel-description">
                {currentPlan?.description || "面向专业用户与小团队的高性能套餐"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="success" size="sm">
                活跃
              </Badge>
              <Button variant="outline" size="sm">
                管理订阅
              </Button>
            </div>
          </div>
          <div className="p-6 page-grid lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-md bg-brand-200/70 border border-brand-400/40 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-brand-500" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-card-title">{currentPlan?.name || "专业版"}</h3>
                    {currentPlan?.popular && (
                      <Badge variant="primary" size="sm">
                        <Star className="w-3 h-3" />
                        推荐
                      </Badge>
                    )}
                  </div>
                  <p className="text-description">{currentPlan?.description}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <div className="text-stat-large tabular-nums">
                    {formatCurrency(currentPlanPrice)}
                  </div>
                  <p className="text-xs text-foreground-muted">
                    /月 · {billingLabel} · {billingHint}
                  </p>
                </div>
                <Badge variant="secondary" size="sm">
                  下次续费：2026-02-28
                </Badge>
              </div>
              <div className="page-grid sm:grid-cols-2">
                <div className="rounded-md border border-border bg-surface-75 p-4">
                  <p className="text-xs text-foreground-muted">团队席位</p>
                  <p className="text-sm font-medium text-foreground tabular-nums">
                    {currentUsage.teamMembers.used} / {currentUsage.teamMembers.limit}
                  </p>
                  <p className="text-xs text-foreground-light">已分配</p>
                </div>
                <div className="rounded-md border border-border bg-surface-75 p-4">
                  <p className="text-xs text-foreground-muted">存储空间</p>
                  <p className="text-sm font-medium text-foreground tabular-nums">
                    {formatNumber(currentUsage.storage.used, 1)} GB /{" "}
                    {formatNumber(currentUsage.storage.limit, 1)} GB
                  </p>
                  <p className="text-xs text-foreground-light">本月使用</p>
                </div>
                <div className="rounded-md border border-border bg-surface-75 p-4">
                  <p className="text-xs text-foreground-muted">API 调用</p>
                  <p className="text-sm font-medium text-foreground tabular-nums">
                    {formatNumber(currentUsage.apiCalls.used)} /{" "}
                    {formatNumber(currentUsage.apiCalls.limit)}
                  </p>
                  <p className="text-xs text-foreground-light">本月用量</p>
                </div>
                <div className="rounded-md border border-border bg-surface-75 p-4">
                  <p className="text-xs text-foreground-muted">支持等级</p>
                  <p className="text-sm font-medium text-foreground">标准支持</p>
                  <p className="text-xs text-foreground-light">24 小时响应</p>
                </div>
              </div>
              {currentPlanHighlights.length > 0 && (
                <div className="flex flex-wrap gap-3 text-xs text-foreground-light">
                  {currentPlanHighlights.map((feature) => (
                    <span key={feature.name} className="flex items-center gap-1">
                      <Check className="w-3 h-3 text-brand-500" />
                      {feature.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div className="rounded-md border border-border bg-surface-75 p-4">
                <p className="text-xs text-foreground-muted mb-3">账单摘要</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-light">套餐费用</span>
                    <span className="text-foreground tabular-nums">
                      {formatCurrency(currentPlan?.price || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-light">折扣</span>
                    <span className="text-foreground tabular-nums">
                      -{formatCurrency(discountAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-light">税费</span>
                    <span className="text-foreground tabular-nums">¥0</span>
                  </div>
                  <div className="h-px bg-border my-2" />
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-foreground">预计总额</span>
                    <span className="text-foreground tabular-nums">
                      {formatCurrency(currentPlanPrice)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="rounded-md border border-border bg-surface-75 p-4">
                <p className="text-xs text-foreground-muted mb-3">快速操作</p>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between"
                    rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                  >
                    下载本期发票
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between"
                    rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                  >
                    更新付款方式
                  </Button>
                </div>
              </div>
              <div className="rounded-md border border-border bg-surface-75 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-foreground-muted">信用余额</p>
                  <Badge variant="secondary" size="xs">
                    自动抵扣
                  </Badge>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold text-foreground tabular-nums">
                    {formatCurrency(creditBalance)}
                  </span>
                  <span className="text-xs text-foreground-muted">可用于未来账单</span>
                </div>
                <p className="text-xs text-foreground-muted mt-2">
                  余额会优先抵扣套餐与超额用量费用。
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 w-full justify-between"
                  rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                >
                  充值额度
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="page-panel">
          <div className="page-panel-header flex items-center justify-between">
            <div>
              <h3 className="page-panel-title">本月使用情况</h3>
              <p className="page-panel-description">按套餐配额实时统计</p>
            </div>
            <Button variant="outline" size="sm">
              购买额外配额
            </Button>
          </div>
          <div className="p-6 grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {usageItems.map((item) => {
              const isUnlimited = item.limit < 0;
              const progressValue = isUnlimited
                ? 100
                : (item.used / Math.max(item.limit, 1)) * 100;
              const precision = item.digits ?? 0;
              const usageText = isUnlimited ? (
                <span className="inline-flex items-center gap-1">
                  {formatNumber(item.used)}
                  <span className="text-foreground-muted">/</span>
                  <Infinity className="w-3 h-3" />
                </span>
              ) : item.unit ? (
                `${formatNumber(item.used, precision)} ${item.unit} / ${formatNumber(
                  item.limit,
                  precision
                )} ${item.unit}`
              ) : (
                `${formatNumber(item.used)} / ${formatNumber(item.limit)}`
              );

              return (
                <div
                  key={item.id}
                  className="rounded-md border border-border bg-surface-75 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-md bg-surface-200 flex items-center justify-center">
                        <item.icon className="w-4 h-4 text-foreground-light" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="text-xs text-foreground-muted">{item.caption}</p>
                      </div>
                    </div>
                    <span className="text-xs text-foreground-light tabular-nums">
                      {usageText}
                    </span>
                  </div>
                  <Progress
                    value={progressValue}
                    size="sm"
                    variant={isUnlimited ? "success" : "default"}
                    className="mt-3"
                  />
                  <p
                    className={cn(
                      "text-xs mt-2",
                      isUnlimited ? "text-brand-500" : "text-foreground-muted"
                    )}
                  >
                    {item.helper}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="page-panel">
          <div className="page-panel-header flex items-center justify-between">
            <div>
              <h3 className="page-panel-title">成本控制</h3>
              <p className="page-panel-description">保持预算可控，避免超额费用</p>
            </div>
            <Button variant="outline" size="sm">
              调整上限
            </Button>
          </div>
          <div className="p-6 grid md:grid-cols-2 gap-4">
            <div className="rounded-md border border-border bg-surface-75 p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md bg-surface-200 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-foreground-light" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">支出上限</p>
                    <p className="text-xs text-foreground-muted">超出额度时的安全阈值</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={spendCapEnabled ? "secondary" : "warning"} size="sm">
                    {spendCapEnabled ? "已启用" : "已关闭"}
                  </Badge>
                  <Switch
                    checked={spendCapEnabled}
                    onCheckedChange={setSpendCapEnabled}
                    aria-label="切换支出上限"
                  />
                </div>
              </div>
              <p className="text-xs text-foreground-muted">
                启用后超额请求将受到限制，避免产生额外费用。
              </p>
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-foreground-light">
                <span>当前上限</span>
                <div className="flex items-center gap-2">
                  <Input
                    value={formatCurrency(0)}
                    readOnly
                    className="h-8 max-w-[120px] text-xs bg-surface-200"
                  />
                  <Button variant="outline" size="xs">
                    修改
                  </Button>
                </div>
              </div>
            </div>
            <div className="rounded-md border border-border bg-surface-75 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-surface-200 flex items-center justify-center">
                  <Crown className="w-4 h-4 text-foreground-light" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">包含额度</p>
                  <p className="text-xs text-foreground-muted">当前套餐可用的基础配额</p>
                </div>
              </div>
              <div className="page-grid grid-cols-2 gap-2 text-xs lg:gap-2">
                <div className="flex items-center justify-between rounded-md border border-border bg-surface-200/60 px-2 py-1">
                  <span className="text-foreground-light">API 调用</span>
                  <span className="text-foreground tabular-nums">
                    {formatNumber(currentUsage.apiCalls.limit)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-border bg-surface-200/60 px-2 py-1">
                  <span className="text-foreground-light">存储空间</span>
                  <span className="text-foreground tabular-nums">
                    {formatNumber(currentUsage.storage.limit, 1)} GB
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-border bg-surface-200/60 px-2 py-1">
                  <span className="text-foreground-light">团队成员</span>
                  <span className="text-foreground tabular-nums">
                    {formatNumber(currentUsage.teamMembers.limit)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-border bg-surface-200/60 px-2 py-1">
                  <span className="text-foreground-light">工作流</span>
                  <span className="text-foreground inline-flex items-center gap-1">
                    <Infinity className="w-3 h-3" />
                    不限
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="page-panel">
          <div className="page-panel-header flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="page-panel-title">套餐对比</h3>
              <p className="page-panel-description">根据团队规模选择更合适的套餐</p>
            </div>
            <div className="flex items-center gap-1 rounded-md bg-surface-200 border border-border p-1">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  billingCycle === "monthly"
                    ? "bg-surface-100 text-foreground"
                    : "text-foreground-muted hover:text-foreground"
                )}
              >
                月付
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-2",
                  billingCycle === "yearly"
                    ? "bg-surface-100 text-foreground"
                    : "text-foreground-muted hover:text-foreground"
                )}
              >
                年付
                <Badge variant="primary" size="xs">
                  省 20%
                </Badge>
              </button>
            </div>
          </div>
          <div className="p-6 page-grid md:grid-cols-3">
            {plans.map((plan) => {
              const computedPrice = Math.round(plan.price * priceMultiplier);
              return (
                <div
                  key={plan.id}
                  className={cn(
                    "relative flex h-full flex-col gap-4 rounded-md border p-5 transition-all",
                    plan.current
                      ? "bg-brand-200/20 border-brand-500/40"
                      : "bg-surface-100 border-border hover:border-border-strong",
                    plan.popular && "ring-1 ring-brand-500/30"
                  )}
                >
                  {plan.popular && (
                    <Badge variant="primary" size="sm" className="absolute top-4 right-4">
                      <Star className="w-3 h-3" />
                      热门
                    </Badge>
                  )}
                  <div>
                    <h4 className="text-card-title">{plan.name}</h4>
                    <p className="text-description mt-1">{plan.description}</p>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-stat-number tabular-nums">
                      {formatCurrency(computedPrice)}
                    </span>
                    <span className="text-xs text-foreground-muted">/月</span>
                  </div>
                  {plan.current ? (
                    <Button variant="outline" size="sm" className="w-full" disabled>
                      当前套餐
                    </Button>
                  ) : (
                    <Button
                      variant={plan.id === "business" ? "outline" : "default"}
                      size="sm"
                      className={cn("w-full", plan.id === "business" && "text-foreground-light")}
                    >
                      {plan.id === "business"
                        ? "联系销售"
                        : plan.price === 0
                        ? "开始使用"
                        : "升级到此套餐"}
                    </Button>
                  )}
                  <div className="space-y-2 text-sm">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        {feature.included ? (
                          <Check className="w-4 h-4 text-brand-500 shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-foreground-muted shrink-0" />
                        )}
                        <span
                          className={feature.included ? "text-foreground" : "text-foreground-muted"}
                        >
                          {feature.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="page-grid lg:grid-cols-2">
          <section className="page-panel">
            <div className="page-panel-header flex items-center justify-between">
              <div>
                <h3 className="page-panel-title">付款方式</h3>
                <p className="page-panel-description">用于自动续费与发票支付</p>
              </div>
              <Button variant="outline" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                添加方式
              </Button>
            </div>
            <div className="p-6 space-y-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between p-4 rounded-md bg-surface-75 border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-surface-200 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-foreground-light" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {method.brand} •••• {method.last4}
                      </p>
                      <p className="text-xs text-foreground-muted">到期：{method.expiry}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {method.default && (
                      <Badge variant="secondary" size="sm">
                        默认
                      </Badge>
                    )}
                    <Button variant="ghost" size="sm">
                      编辑
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="page-panel">
            <div className="page-panel-header flex items-center justify-between">
              <div>
                <h3 className="page-panel-title">账单历史</h3>
                <p className="page-panel-description">最近 6 个月的付款记录</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
              >
                查看全部
              </Button>
            </div>
            <div className="p-6">
              <div className="rounded-md border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-surface-200">
                    <tr>
                      <th className="text-table-header text-left px-4 py-2">日期</th>
                      <th className="text-table-header text-left px-4 py-2">说明</th>
                      <th className="text-table-header text-left px-4 py-2">发票号</th>
                      <th className="text-table-header text-right px-4 py-2">金额</th>
                      <th className="text-table-header text-right px-4 py-2">状态</th>
                      <th className="text-table-header text-right px-4 py-2">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {billingHistory.map((bill) => (
                      <tr key={bill.id} className="bg-surface-75">
                        <td className="px-4 py-3 text-foreground-light">{bill.date}</td>
                        <td className="px-4 py-3">
                          <div className="text-foreground font-medium">{bill.description}</div>
                        </td>
                        <td className="px-4 py-3 text-foreground-muted">{bill.invoice}</td>
                        <td className="px-4 py-3 text-right text-foreground tabular-nums">
                          {formatCurrency(bill.amount)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Badge variant="secondary" size="sm">
                            {bill.status === "paid" ? "已支付" : "待处理"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="icon-sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-foreground-muted mt-3">
                显示 1 至 {billingHistory.length} 条，共 {billingHistory.length} 条记录
              </p>
            </div>
          </section>
        </div>

        <div className="page-grid lg:grid-cols-2">
          <section className="page-panel">
            <div className="page-panel-header flex items-center justify-between">
              <div>
                <h3 className="page-panel-title">账单收件人</h3>
                <p className="page-panel-description">所有账单通知将发送至此邮箱</p>
              </div>
              <Button variant="outline" size="sm">
                管理收件人
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="billing-email">邮箱地址</Label>
                <Input id="billing-email" defaultValue={billingContact.primaryEmail} />
                <p className="text-xs text-foreground-muted">
                  发票、付款提醒与变更通知都会同步发送至此邮箱。
                </p>
              </div>
              <div className="space-y-2">
                <Label variant="optional">额外收件人</Label>
                <div className="flex flex-wrap items-center gap-2">
                  {billingContact.additionalEmails.map((email) => (
                    <Badge key={email} variant="secondary" size="sm">
                      {email}
                    </Badge>
                  ))}
                  <Button variant="outline" size="xs">
                    添加
                  </Button>
                </div>
              </div>
              <div className="rounded-md border border-border bg-surface-75 p-3 text-xs text-foreground-muted">
                额外收件人将接收与主邮箱一致的账单和付款提醒。
              </div>
            </div>
          </section>

          <section className="page-panel">
            <div className="page-panel-header flex items-center justify-between">
              <div>
                <h3 className="page-panel-title">账单地址与税务信息</h3>
                <p className="page-panel-description">用于生成合规发票与税务信息</p>
              </div>
              <Button variant="outline" size="sm">
                保存更改
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div className="page-grid md:grid-cols-2 gap-4 lg:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="billing-name">名称</Label>
                  <Input id="billing-name" defaultValue={billingAddress.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billing-tax-id" variant="optional">
                    税号
                  </Label>
                  <Input id="billing-tax-id" defaultValue={billingAddress.taxId} />
                </div>
              </div>
              <div className="page-grid md:grid-cols-2 gap-4 lg:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="billing-line1">地址行 1</Label>
                  <Input id="billing-line1" defaultValue={billingAddress.line1} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billing-line2" variant="optional">
                    地址行 2
                  </Label>
                  <Input id="billing-line2" defaultValue={billingAddress.line2} />
                </div>
              </div>
              <div className="page-grid md:grid-cols-3 gap-4 lg:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="billing-country">国家/地区</Label>
                  <Input id="billing-country" defaultValue={billingAddress.country} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billing-city">城市</Label>
                  <Input id="billing-city" defaultValue={billingAddress.city} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billing-state">省/州</Label>
                  <Input id="billing-state" defaultValue={billingAddress.state} />
                </div>
              </div>
              <div className="page-grid md:grid-cols-2 gap-4 lg:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="billing-postal">邮编</Label>
                  <Input id="billing-postal" defaultValue={billingAddress.postalCode} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billing-contact" variant="optional">
                    联系电话
                  </Label>
                  <Input id="billing-contact" placeholder="填写可选联系方式" />
                </div>
              </div>
              <div className="text-xs text-foreground-muted">
                更改仅影响未来账单，历史账单不会更新。
              </div>
            </div>
          </section>
        </div>

        <section className="page-panel relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-r from-brand-200/30 via-transparent to-transparent" />
          <div className="p-6 flex flex-col md:flex-row md:items-center gap-4 relative">
            <div className="w-12 h-12 rounded-md bg-brand-200/60 border border-brand-400/40 flex items-center justify-center shrink-0">
              <Gift className="w-6 h-6 text-brand-500" />
            </div>
            <div className="flex-1">
              <h4 className="text-card-title">邀请好友，获得奖励</h4>
              <p className="text-description mt-1">
                每成功邀请一位好友注册，双方都将获得 1000 次额外 API 调用额度。
              </p>
            </div>
            <Button
              size="sm"
              className="bg-brand-500 text-background hover:bg-brand-600"
              rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
            >
              立即邀请
            </Button>
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
