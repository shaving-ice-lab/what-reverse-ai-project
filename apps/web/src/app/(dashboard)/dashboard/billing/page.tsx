"use client";

/**
 * 计费与订阅页面 - Supabase 风格
 * 管理订阅套餐、用量、付款方式与账单历史
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { CircularProgress, Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageContainer, PageHeader } from "@/components/dashboard/page-layout";
import {
  billingApi,
  type BudgetSettings,
  type BillingInvoiceDetail,
  type BillingInvoiceSummary,
  type AppUsageStat,
} from "@/lib/api/billing";
import { workspaceApi, type WorkspaceQuota } from "@/lib/api/workspace";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Bot,
  Calendar,
  Check,
  ChevronRight,
  CreditCard,
  Crown,
  Database,
  Download,
  ExternalLink,
  Gift,
  Globe,
  Infinity,
  LayoutGrid,
  Minus,
  Plus,
  Receipt,
  Star,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react";

const WORKSPACE_STORAGE_KEY = "last_workspace_id";

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
const defaultUsage = {
  apiCalls: { used: 3247, limit: 5000 },
  tokens: { used: 820000, limit: 1000000 },
  storage: { used: 2.4, limit: 10 }, // GB
  bandwidth: { used: 15.6, limit: 50 }, // GB
  apps: { used: 8, limit: 12 },
  teamMembers: { used: 2, limit: 3 },
};

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
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [quota, setQuota] = useState<WorkspaceQuota | null>(null);
  const [budget, setBudget] = useState<BudgetSettings | null>(null);
  const [quotaLoading, setQuotaLoading] = useState(false);
  const [invoices, setInvoices] = useState<BillingInvoiceSummary[]>([]);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [selectedInvoiceDetail, setSelectedInvoiceDetail] =
    useState<BillingInvoiceDetail | null>(null);
  const [invoiceDetailLoading, setInvoiceDetailLoading] = useState(false);
  const [invoiceDownloadId, setInvoiceDownloadId] = useState<string | null>(null);
  const [appUsageStats, setAppUsageStats] = useState<AppUsageStat[]>([]);
  const [appUsageLoading, setAppUsageLoading] = useState(false);
  const [appUsageError, setAppUsageError] = useState<string | null>(null);
  const currentPlan = plans.find((plan) => plan.current);
  const selectedInvoiceSummary =
    (selectedInvoiceId && invoices.find((bill) => bill.id === selectedInvoiceId)) || invoices[0];
  const selectedInvoice = selectedInvoiceDetail ?? selectedInvoiceSummary;

  const formatCurrency = (value: number) => `¥${value.toLocaleString("zh-CN")}`;
  const formatNumber = (value: number, digits = 0) =>
    value.toLocaleString("zh-CN", { maximumFractionDigits: digits });
  const formatSignedCurrency = (value: number) =>
    value < 0 ? `-${formatCurrency(Math.abs(value))}` : formatCurrency(value);
  const priceMultiplier = billingCycle === "yearly" ? 0.8 : 1;
  const billingLabel = billingCycle === "yearly" ? "年付" : "月付";
  const billingHint = billingCycle === "yearly" ? "已包含 20% 折扣" : "切换年付享 20% 折扣";
  const currentPlanPrice = currentPlan ? Math.round(currentPlan.price * priceMultiplier) : 0;
  const currentPlanHighlights =
    currentPlan?.features.filter((feature) => feature.included).slice(0, 3) ?? [];
  const discountAmount =
    billingCycle === "yearly" ? Math.round((currentPlan?.price ?? 0) * 0.2) : 0;
  const creditBalance = 0;
  const spendLimitDisplay =
    budget && budget.spend_limit > 0 ? formatCurrency(budget.spend_limit) : "未设置";
  const invoiceSubtotal = selectedInvoiceSummary?.subtotal ?? (currentPlan?.price ?? 0);
  const invoiceDiscount =
    selectedInvoiceSummary?.discountAmount ?? (discountAmount > 0 ? discountAmount : 0);
  const invoiceTax = selectedInvoiceSummary?.taxAmount ?? 0;
  const invoiceTotal = selectedInvoiceSummary?.totalAmount ?? currentPlanPrice;

  type InvoiceStatus = BillingInvoiceSummary["status"];
  type InvoiceStatusVariant = "success" | "warning" | "error" | "secondary";

  const resolveInvoiceStatusLabel = (status?: InvoiceStatus) => {
    switch (status) {
      case "paid":
        return "已支付";
      case "failed":
        return "支付失败";
      case "refunded":
        return "已退款";
      case "pending":
      default:
        return "待处理";
    }
  };

  const resolveInvoiceStatusVariant = (status?: InvoiceStatus): InvoiceStatusVariant => {
    switch (status) {
      case "paid":
        return "success";
      case "failed":
        return "error";
      case "refunded":
        return "secondary";
      case "pending":
      default:
        return "warning";
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedId = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (storedId) {
      setActiveWorkspaceId(storedId);
    }
  }, []);

  useEffect(() => {
    if (!activeWorkspaceId) return;
    let isActive = true;

    const loadQuotaAndBudget = async () => {
      try {
        setQuotaLoading(true);
        try {
          const quotaData = await workspaceApi.getQuota(activeWorkspaceId);
          if (isActive) setQuota(quotaData);
        } catch {
          // 配额接口可能未实现或无权限
        }

        try {
          const settings = await billingApi.getBudgetSettings(activeWorkspaceId);
          if (isActive) {
            setBudget(settings);
            setSpendCapEnabled(settings.spend_limit_enabled);
          }
        } catch {
          // 预算接口可能未实现或无权限
        }
      } finally {
        if (isActive) setQuotaLoading(false);
      }
    };

    loadQuotaAndBudget();
    return () => {
      isActive = false;
    };
  }, [activeWorkspaceId]);

  useEffect(() => {
    if (!activeWorkspaceId) return;
    let isActive = true;

    const loadInvoices = async () => {
      try {
        setInvoiceLoading(true);
        setInvoiceError(null);
        const list = await billingApi.listInvoices(activeWorkspaceId, { limit: 6 });
        if (!isActive) return;
        setInvoices(list);
        setSelectedInvoiceId((prev) => {
          if (prev && list.some((invoice) => invoice.id === prev)) {
            return prev;
          }
          return list[0]?.id || null;
        });
      } catch (error) {
        if (!isActive) return;
        setInvoiceError(error instanceof Error ? error.message : "获取账单失败");
        setInvoices([]);
        setSelectedInvoiceId(null);
        setSelectedInvoiceDetail(null);
      } finally {
        if (isActive) setInvoiceLoading(false);
      }
    };

    loadInvoices();
    return () => {
      isActive = false;
    };
  }, [activeWorkspaceId]);

  useEffect(() => {
    if (!activeWorkspaceId || !selectedInvoiceId) {
      setSelectedInvoiceDetail(null);
      setInvoiceDetailLoading(false);
      return;
    }
    let isActive = true;

    const loadInvoiceDetail = async () => {
      try {
        setInvoiceDetailLoading(true);
        setSelectedInvoiceDetail(null);
        const detail = await billingApi.getInvoiceDetail(activeWorkspaceId, selectedInvoiceId);
        if (!isActive) return;
        setSelectedInvoiceDetail(detail);
      } catch {
        if (!isActive) return;
        setSelectedInvoiceDetail(null);
      } finally {
        if (isActive) setInvoiceDetailLoading(false);
      }
    };

    loadInvoiceDetail();
    return () => {
      isActive = false;
    };
  }, [activeWorkspaceId, selectedInvoiceId]);

  // 加载 App 用量统计
  useEffect(() => {
    if (!activeWorkspaceId) return;
    let isActive = true;

    const loadAppUsageStats = async () => {
      try {
        setAppUsageLoading(true);
        setAppUsageError(null);
        const stats = await billingApi.getAppUsageStats(activeWorkspaceId);
        if (!isActive) return;
        setAppUsageStats(stats);
      } catch (error) {
        if (!isActive) return;
        setAppUsageError(error instanceof Error ? error.message : "获取 App 用量失败");
        // 使用示例数据
        setAppUsageStats([
          {
            id: "1",
            app_id: "app-1",
            app_name: "智能客服助手",
            app_icon: "🤖",
            workspace_id: activeWorkspaceId,
            period_start: "2026-01-01",
            period_end: "2026-01-31",
            usage: { requests: 1523, tokens: 245000, storage: 0.8, bandwidth: 5.2 },
            cost_amount: 45.8,
            currency: "CNY",
            trend_percent: 12.5,
            trend_direction: "up",
          },
          {
            id: "2",
            app_id: "app-2",
            app_name: "文档分析器",
            app_icon: "📄",
            workspace_id: activeWorkspaceId,
            period_start: "2026-01-01",
            period_end: "2026-01-31",
            usage: { requests: 856, tokens: 320000, storage: 1.2, bandwidth: 6.8 },
            cost_amount: 38.2,
            currency: "CNY",
            trend_percent: 8.3,
            trend_direction: "down",
          },
          {
            id: "3",
            app_id: "app-3",
            app_name: "数据提取工作流",
            app_icon: "📊",
            workspace_id: activeWorkspaceId,
            period_start: "2026-01-01",
            period_end: "2026-01-31",
            usage: { requests: 432, tokens: 156000, storage: 0.3, bandwidth: 2.1 },
            cost_amount: 22.5,
            currency: "CNY",
            trend_percent: 0,
            trend_direction: "flat",
          },
          {
            id: "4",
            app_id: "app-4",
            app_name: "营销文案生成",
            app_icon: "✍️",
            workspace_id: activeWorkspaceId,
            period_start: "2026-01-01",
            period_end: "2026-01-31",
            usage: { requests: 287, tokens: 89000, storage: 0.1, bandwidth: 1.2 },
            cost_amount: 15.3,
            currency: "CNY",
            trend_percent: 25.6,
            trend_direction: "up",
          },
        ]);
      } finally {
        if (isActive) setAppUsageLoading(false);
      }
    };

    loadAppUsageStats();
    return () => {
      isActive = false;
    };
  }, [activeWorkspaceId]);

  const handleInvoiceDownload = async (invoiceId: string, invoiceNo?: string) => {
    if (!activeWorkspaceId) return;
    try {
      setInvoiceDownloadId(invoiceId);
      const blob = await billingApi.downloadInvoice(activeWorkspaceId, invoiceId, "pdf");
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${invoiceNo || `invoice-${invoiceId}`}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download invoice:", error);
    } finally {
      setInvoiceDownloadId(null);
    }
  };

  const resolvedUsage = {
    apiCalls: quota?.requests ?? defaultUsage.apiCalls,
    tokens: quota?.tokens ?? defaultUsage.tokens,
    storage: quota?.storage ?? defaultUsage.storage,
    bandwidth: quota?.bandwidth ?? defaultUsage.bandwidth,
    apps: quota?.apps ?? defaultUsage.apps,
    teamMembers: defaultUsage.teamMembers,
  };

  const buildUsageHelper = (used: number, limit: number, unit?: string, digits = 0) => {
    if (limit <= 0) return "不限";
    const remaining = limit - used;
    const formatted = formatNumber(Math.abs(remaining), digits);
    const unitLabel = unit ? ` ${unit}` : "";
    if (remaining < 0) return `已超额 ${formatted}${unitLabel}`;
    return `剩余 ${formatted}${unitLabel}`;
  };

  const usageItems = [
    {
      id: "apiCalls",
      label: "API 调用",
      caption: "月度请求配额",
      icon: Zap,
      used: resolvedUsage.apiCalls.used,
      limit: resolvedUsage.apiCalls.limit,
      helper: buildUsageHelper(resolvedUsage.apiCalls.used, resolvedUsage.apiCalls.limit, "次"),
    },
    {
      id: "tokens",
      label: "Token 用量",
      caption: "模型消耗",
      icon: Bot,
      used: resolvedUsage.tokens.used,
      limit: resolvedUsage.tokens.limit,
      helper: buildUsageHelper(resolvedUsage.tokens.used, resolvedUsage.tokens.limit, "Token"),
    },
    {
      id: "storage",
      label: "存储空间",
      caption: "对象存储",
      icon: Database,
      used: resolvedUsage.storage.used,
      limit: resolvedUsage.storage.limit,
      unit: "GB",
      digits: 1,
      helper: buildUsageHelper(
        resolvedUsage.storage.used,
        resolvedUsage.storage.limit,
        "GB",
        1
      ),
    },
    {
      id: "bandwidth",
      label: "带宽用量",
      caption: "网络传输",
      icon: Globe,
      used: resolvedUsage.bandwidth.used,
      limit: resolvedUsage.bandwidth.limit,
      unit: "GB",
      digits: 1,
      helper: buildUsageHelper(
        resolvedUsage.bandwidth.used,
        resolvedUsage.bandwidth.limit,
        "GB",
        1
      ),
    },
    {
      id: "apps",
      label: "应用数量",
      caption: "可创建应用",
      icon: LayoutGrid,
      used: resolvedUsage.apps.used,
      limit: resolvedUsage.apps.limit,
      helper: buildUsageHelper(resolvedUsage.apps.used, resolvedUsage.apps.limit, "个"),
    },
    {
      id: "teamMembers",
      label: "团队成员",
      caption: "成员席位",
      icon: Users,
      used: resolvedUsage.teamMembers.used,
      limit: resolvedUsage.teamMembers.limit,
      helper: buildUsageHelper(
        resolvedUsage.teamMembers.used,
        resolvedUsage.teamMembers.limit,
        "人"
      ),
    },
  ];

  const usagePercentages = usageItems
    .filter((item) => item.limit > 0)
    .map((item) => ({
      id: item.id,
      label: item.label,
      percent: item.used / Math.max(item.limit, 1),
    }));
  const usageAlertItems = usagePercentages.filter((item) => item.percent >= 0.8);
  const overLimitItems = usageAlertItems.filter((item) => item.percent >= 1);
  const nearLimitItems = usageAlertItems.filter((item) => item.percent >= 0.8 && item.percent < 1);
  const maxUsagePercent = usagePercentages.length
    ? Math.max(...usagePercentages.map((item) => item.percent))
    : 0;
  const averageUsagePercent = usagePercentages.length
    ? usagePercentages.reduce((sum, item) => sum + item.percent, 0) / usagePercentages.length
    : 0;
  const quotaStatus =
    maxUsagePercent >= 1 ? "已超额" : maxUsagePercent >= 0.8 ? "临近上限" : "健康";
  const quotaStatusVariant = maxUsagePercent >= 1 ? "error" : maxUsagePercent >= 0.8 ? "warning" : "success";
  const quotaSourceLabel = quota ? "实时数据" : "示例数据";

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
        <Callout variant="info" title="升级引导">
          当前配额使用将随着业务增长快速上升，建议提前评估升级或申请额外额度。
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link href="/dashboard/upgrade">
                升级套餐
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/support-tickets?category=billing">申请额外配额</Link>
            </Button>
          </div>
        </Callout>
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
                    {resolvedUsage.teamMembers.used} / {resolvedUsage.teamMembers.limit}
                  </p>
                  <p className="text-xs text-foreground-light">已分配</p>
                </div>
                <div className="rounded-md border border-border bg-surface-75 p-4">
                  <p className="text-xs text-foreground-muted">存储空间</p>
                  <p className="text-sm font-medium text-foreground tabular-nums">
                    {formatNumber(resolvedUsage.storage.used, 1)} GB /{" "}
                    {formatNumber(resolvedUsage.storage.limit, 1)} GB
                  </p>
                  <p className="text-xs text-foreground-light">本月使用</p>
                </div>
                <div className="rounded-md border border-border bg-surface-75 p-4">
                  <p className="text-xs text-foreground-muted">API 调用</p>
                  <p className="text-sm font-medium text-foreground tabular-nums">
                    {formatNumber(resolvedUsage.apiCalls.used)} /{" "}
                    {formatNumber(resolvedUsage.apiCalls.limit)}
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
                    <span className="text-foreground-light">小计</span>
                    <span className="text-foreground tabular-nums">
                      {formatCurrency(invoiceSubtotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-light">折扣</span>
                    <span className="text-foreground tabular-nums">
                      {invoiceDiscount > 0
                        ? `-${formatCurrency(invoiceDiscount)}`
                        : formatCurrency(0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-light">税费</span>
                    <span className="text-foreground tabular-nums">
                      {formatCurrency(invoiceTax)}
                    </span>
                  </div>
                  <div className="h-px bg-border my-2" />
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-foreground">预计总额</span>
                    <span className="text-foreground tabular-nums">
                      {formatCurrency(invoiceTotal)}
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
                    onClick={() =>
                      selectedInvoice &&
                      handleInvoiceDownload(selectedInvoice.id, selectedInvoice.invoice)
                    }
                    disabled={!selectedInvoice}
                    loading={invoiceDownloadId === selectedInvoice?.id}
                    loadingText="下载中"
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
              <h3 className="page-panel-title">配额使用仪表盘</h3>
              <p className="page-panel-description">按工作空间配额实时统计</p>
            </div>
            <div className="flex items-center gap-2">
              {quotaLoading && (
                <Badge variant="secondary" size="xs">
                  同步中
                </Badge>
              )}
              <Button variant="outline" size="sm">
                购买额外配额
              </Button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-border bg-surface-75 p-4">
              <div className="space-y-2">
                <p className="text-xs text-foreground-muted">配额健康度</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={quotaStatusVariant} size="sm">
                    {quotaStatus}
                  </Badge>
                  <span className="text-xs text-foreground-light">
                    最高使用率 {Math.round(maxUsagePercent * 100)}%
                  </span>
                </div>
                <p className="text-xs text-foreground-muted">
                  平均使用率 {Math.round(averageUsagePercent * 100)}% · {quotaSourceLabel}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <CircularProgress
                  value={Math.round(maxUsagePercent * 100)}
                  size={68}
                  showValue
                  variant={quotaStatusVariant}
                  formatValue={(value) => `${Math.round(value)}%`}
                />
                <div className="text-xs text-foreground-muted space-y-1">
                  <p>高峰配额优先展示</p>
                  <p>建议留出 20% 安全边际</p>
                </div>
              </div>
            </div>

            {usageAlertItems.length > 0 && (
              <Callout
                variant={overLimitItems.length > 0 ? "error" : "warning"}
                title={overLimitItems.length > 0 ? "已触发超额" : "配额即将用尽"}
              >
                <p>
                  {overLimitItems.length > 0
                    ? "部分资源已超出套餐配额，建议立即升级或申请额外配额，避免影响业务稳定性。"
                    : "关键资源即将触达配额上限，请提前规划升级或补充额度。"}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {usageAlertItems.map((item) => (
                    <Badge
                      key={item.id}
                      variant={item.percent >= 1 ? "error" : "warning"}
                      size="sm"
                    >
                      {item.label} {Math.round(item.percent * 100)}%
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button asChild size="sm">
                    <Link href="/dashboard/upgrade">
                      升级套餐
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard/support-tickets?category=billing">申请额外配额</Link>
                  </Button>
                </div>
              </Callout>
            )}

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {usageItems.map((item) => {
                const isUnlimited = item.limit <= 0;
                const progressValue = isUnlimited
                  ? 100
                  : (item.used / Math.max(item.limit, 1)) * 100;
                const progressVariant = isUnlimited
                  ? "success"
                  : progressValue >= 100
                  ? "error"
                  : progressValue >= 80
                  ? "warning"
                  : "default";
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
                      variant={progressVariant}
                      className="mt-3"
                    />
                    <p
                      className={cn(
                        "text-xs mt-2",
                        isUnlimited
                          ? "text-brand-500"
                          : progressValue >= 80
                          ? "text-warning"
                          : "text-foreground-muted"
                      )}
                    >
                      {item.helper}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="page-panel">
          <div className="page-panel-header flex items-center justify-between">
            <div>
              <h3 className="page-panel-title">按 App 统计</h3>
              <p className="page-panel-description">分应用查看用量与成本，便于对账与优化</p>
            </div>
            <div className="flex items-center gap-2">
              {appUsageLoading && (
                <Badge variant="secondary" size="xs">
                  同步中
                </Badge>
              )}
              <Button variant="outline" size="sm" rightIcon={<Download className="w-3.5 h-3.5" />}>
                导出报表
              </Button>
            </div>
          </div>
          <div className="p-6">
            <div className="rounded-md border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface-200">
                  <tr>
                    <th className="text-table-header text-left px-4 py-2">应用</th>
                    <th className="text-table-header text-right px-4 py-2">请求数</th>
                    <th className="text-table-header text-right px-4 py-2">Token</th>
                    <th className="text-table-header text-right px-4 py-2">存储</th>
                    <th className="text-table-header text-right px-4 py-2">带宽</th>
                    <th className="text-table-header text-right px-4 py-2">成本</th>
                    <th className="text-table-header text-right px-4 py-2">趋势</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {appUsageStats.length === 0 ? (
                    <tr className="bg-surface-75">
                      <td colSpan={7} className="px-4 py-6 text-center text-foreground-muted">
                        {appUsageError
                          ? `加载失败：${appUsageError}`
                          : appUsageLoading
                          ? "正在加载 App 用量数据..."
                          : "暂无 App 用量数据"}
                      </td>
                    </tr>
                  ) : (
                    appUsageStats.map((stat) => (
                      <tr key={stat.id} className="bg-surface-75 hover:bg-surface-100 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-md bg-surface-200 flex items-center justify-center text-base">
                              {stat.app_icon || "📱"}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{stat.app_name}</p>
                              <p className="text-xs text-foreground-muted">{stat.period_start} ~ {stat.period_end}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-foreground tabular-nums">
                          {formatNumber(stat.usage.requests || 0)}
                        </td>
                        <td className="px-4 py-3 text-right text-foreground tabular-nums">
                          {formatNumber(stat.usage.tokens || 0)}
                        </td>
                        <td className="px-4 py-3 text-right text-foreground tabular-nums">
                          {formatNumber(stat.usage.storage || 0, 1)} GB
                        </td>
                        <td className="px-4 py-3 text-right text-foreground tabular-nums">
                          {formatNumber(stat.usage.bandwidth || 0, 1)} GB
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-foreground font-medium tabular-nums">
                            {formatCurrency(stat.cost_amount)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            {stat.trend_direction === "up" && (
                              <>
                                <ArrowUp className="w-3.5 h-3.5 text-error" />
                                <span className="text-xs text-error tabular-nums">+{stat.trend_percent}%</span>
                              </>
                            )}
                            {stat.trend_direction === "down" && (
                              <>
                                <ArrowDown className="w-3.5 h-3.5 text-success" />
                                <span className="text-xs text-success tabular-nums">-{stat.trend_percent}%</span>
                              </>
                            )}
                            {stat.trend_direction === "flat" && (
                              <>
                                <Minus className="w-3.5 h-3.5 text-foreground-muted" />
                                <span className="text-xs text-foreground-muted">持平</span>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {appUsageStats.length > 0 && (
                  <tfoot className="bg-surface-200/50">
                    <tr>
                      <td className="px-4 py-2 text-sm font-medium text-foreground">合计</td>
                      <td className="px-4 py-2 text-right text-sm font-medium text-foreground tabular-nums">
                        {formatNumber(appUsageStats.reduce((sum, s) => sum + (s.usage.requests || 0), 0))}
                      </td>
                      <td className="px-4 py-2 text-right text-sm font-medium text-foreground tabular-nums">
                        {formatNumber(appUsageStats.reduce((sum, s) => sum + (s.usage.tokens || 0), 0))}
                      </td>
                      <td className="px-4 py-2 text-right text-sm font-medium text-foreground tabular-nums">
                        {formatNumber(appUsageStats.reduce((sum, s) => sum + (s.usage.storage || 0), 0), 1)} GB
                      </td>
                      <td className="px-4 py-2 text-right text-sm font-medium text-foreground tabular-nums">
                        {formatNumber(appUsageStats.reduce((sum, s) => sum + (s.usage.bandwidth || 0), 0), 1)} GB
                      </td>
                      <td className="px-4 py-2 text-right text-sm font-medium text-foreground tabular-nums">
                        {formatCurrency(appUsageStats.reduce((sum, s) => sum + s.cost_amount, 0))}
                      </td>
                      <td className="px-4 py-2 text-right text-xs text-foreground-muted">-</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            <p className="text-xs text-foreground-muted mt-3">
              {appUsageStats.length === 0
                ? "暂无应用数据"
                : `显示 ${appUsageStats.length} 个应用的本月用量统计`}
            </p>
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
                    value={spendLimitDisplay}
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
                    {formatNumber(resolvedUsage.apiCalls.limit)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-border bg-surface-200/60 px-2 py-1">
                  <span className="text-foreground-light">Token 用量</span>
                  <span className="text-foreground tabular-nums">
                    {formatNumber(resolvedUsage.tokens.limit)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-border bg-surface-200/60 px-2 py-1">
                  <span className="text-foreground-light">存储空间</span>
                  <span className="text-foreground tabular-nums">
                    {formatNumber(resolvedUsage.storage.limit, 1)} GB
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-border bg-surface-200/60 px-2 py-1">
                  <span className="text-foreground-light">应用数量</span>
                  <span className="text-foreground tabular-nums">
                    {formatNumber(resolvedUsage.apps.limit)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-border bg-surface-200/60 px-2 py-1">
                  <span className="text-foreground-light">团队成员</span>
                  <span className="text-foreground tabular-nums">
                    {formatNumber(resolvedUsage.teamMembers.limit)}
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
              {selectedInvoiceSummary && (
                <div className="mb-5 rounded-md border border-border bg-surface-75 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs text-foreground-muted">账单明细</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-foreground">
                          {selectedInvoiceSummary.description}
                        </p>
                        <Badge
                          variant={resolveInvoiceStatusVariant(selectedInvoiceSummary.status)}
                          size="xs"
                        >
                          {resolveInvoiceStatusLabel(selectedInvoiceSummary.status)}
                        </Badge>
                      </div>
                      <p className="text-xs text-foreground-muted">
                        账期 {selectedInvoiceSummary.period} · 发票号 {selectedInvoiceSummary.invoice}
                      </p>
                      {selectedInvoiceSummary.paidAt && (
                        <p className="text-xs text-foreground-muted">
                          支付时间 {selectedInvoiceSummary.paidAt}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Download className="w-3.5 h-3.5" />}
                        onClick={() =>
                          handleInvoiceDownload(
                            selectedInvoiceSummary.id,
                            selectedInvoiceSummary.invoice
                          )
                        }
                        loading={invoiceDownloadId === selectedInvoiceSummary.id}
                        loadingText="下载中"
                      >
                        下载发票
                      </Button>
                      <Button variant="ghost" size="sm" leftIcon={<Receipt className="w-3.5 h-3.5" />}>
                        查看收据
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2 text-xs">
                    {selectedInvoiceDetail?.lineItems?.length ? (
                      selectedInvoiceDetail.lineItems.map((item, index) => (
                        <div
                          key={`${item.label}-${index}`}
                          className="flex items-center justify-between rounded-md border border-border bg-surface-200/60 px-3 py-2"
                        >
                          <div className="space-y-0.5">
                            <p className="text-foreground">{item.label}</p>
                            {item.quantity !== undefined && item.unitPrice !== undefined && (
                              <p className="text-foreground-muted">
                                {item.quantity} × {formatCurrency(item.unitPrice)}
                              </p>
                            )}
                          </div>
                          <span className="text-foreground tabular-nums">
                            {formatSignedCurrency(item.total)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-md border border-dashed border-border bg-surface-200/60 px-3 py-3 text-foreground-muted">
                        {invoiceDetailLoading ? "正在加载账单明细..." : "暂无账单明细"}
                      </div>
                    )}
                  </div>
                </div>
              )}
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
                    {invoices.length === 0 ? (
                      <tr className="bg-surface-75">
                        <td colSpan={6} className="px-4 py-6 text-center text-foreground-muted">
                          {invoiceError
                            ? `账单加载失败：${invoiceError}`
                            : invoiceLoading
                            ? "正在加载账单..."
                            : "暂无账单记录"}
                        </td>
                      </tr>
                    ) : (
                      invoices.map((bill) => (
                        <tr
                          key={bill.id}
                          className={cn(
                            "bg-surface-75",
                            bill.id === selectedInvoiceSummary?.id && "bg-surface-100"
                          )}
                        >
                          <td className="px-4 py-3 text-foreground-light">{bill.date}</td>
                          <td className="px-4 py-3">
                            <div className="text-foreground font-medium">{bill.description}</div>
                          </td>
                          <td className="px-4 py-3 text-foreground-muted">{bill.invoice}</td>
                          <td className="px-4 py-3 text-right text-foreground tabular-nums">
                            {formatCurrency(bill.amount)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Badge
                              variant={resolveInvoiceStatusVariant(bill.status)}
                              size="sm"
                            >
                              {resolveInvoiceStatusLabel(bill.status)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedInvoiceId(bill.id)}
                              >
                                查看明细
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleInvoiceDownload(bill.id, bill.invoice)}
                                loading={invoiceDownloadId === bill.id}
                                loadingText=""
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-foreground-muted mt-3">
                {invoices.length === 0
                  ? "暂无账单记录"
                  : `显示 1 至 ${invoices.length} 条，共 ${invoices.length} 条记录`}
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
