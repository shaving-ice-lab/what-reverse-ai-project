"use client";

/**
 * BillingandSubscriptionPage - Supabase Style
 * ManageSubscriptionPlan, Usage, PaymentmethodandBillingHistory
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
 type WorkspaceUsageStat,
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

// SubscriptionPlan
const plans = [
 {
 id: "free",
 name: "Freeversion",
 description: "SuitablepersonExploreandUsage",
 price: 0,
 priceMonthly: 0,
 current: false,
 features: [
 { name: "eachmonths 100 times API Call", included: true },
 { name: "3 Workflow", included: true },
 { name: "1 AI Agent", included: true },
 { name: "BasicModelAccess", included: true },
 { name: "CommunitySupport", included: true },
 { name: "AdvancedModel", included: false },
 { name: "TeamCollaboration", included: false },
 { name: "PrioritySupport", included: false },
 ],
 },
 {
 id: "pro",
 name: "Professionalversion",
 description: "SuitableProfessionalUserandsmallTeam",
 price: 99,
 priceMonthly: 99,
 current: true,
 popular: true,
 features: [
 { name: "eachmonths 5,000 times API Call", included: true },
 { name: "NonelimitWorkflow", included: true },
 { name: "10 AI Agent", included: true },
 { name: "AdvancedModelAccess", included: true },
 { name: "PriorityEmailSupport", included: true },
 { name: "CustomIntegration", included: true },
 { name: "TeamCollaboration (3person)", included: true },
 { name: "ExclusiveSupport", included: false },
 ],
 },
 {
 id: "business",
 name: "Enterprise",
 description: "SuitablelargeTeamandEnterprise",
 price: 299,
 priceMonthly: 299,
 current: false,
 features: [
 { name: "Nonelimit API Call", included: true },
 { name: "NonelimitWorkflow", included: true },
 { name: "Nonelimit AI Agent", included: true },
 { name: "AllModelAccess", included: true },
 { name: "24/7 ExclusiveSupport", included: true },
 { name: "AdvancedSecurityFeatures", included: true },
 { name: "NonelimitTeamMember", included: true },
 { name: "SLA Assurance", included: true },
 ],
 },
];

// CurrentUsageSituation
const defaultUsage = {
 apiCalls: { used: 3247, limit: 5000 },
 tokens: { used: 820000, limit: 1000000 },
 storage: { used: 2.4, limit: 10 }, // GB
 bandwidth: { used: 15.6, limit: 50 }, // GB
 apps: { used: 8, limit: 12 },
 teamMembers: { used: 2, limit: 3 },
};

// Paymentmethod
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
 country: "",
 postalCode: "200000",
 city: "on",
 state: "on",
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
 const [workspaceUsageStats, setWorkspaceUsageStats] = useState<WorkspaceUsageStat[]>([]);
 const [workspaceUsageLoading, setWorkspaceUsageLoading] = useState(false);
 const [workspaceUsageError, setWorkspaceUsageError] = useState<string | null>(null);
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
 const billingLabel = billingCycle === "yearly" ? "years": "months";
 const billingHint = billingCycle === "yearly" ? "alreadyContains 20% Discount": "Switchyears 20% Discount";
 const currentPlanPrice = currentPlan ? Math.round(currentPlan.price * priceMultiplier) : 0;
 const currentPlanHighlights =
 currentPlan?.features.filter((feature) => feature.included).slice(0, 3) ?? [];
 const discountAmount =
 billingCycle === "yearly" ? Math.round((currentPlan?.price ?? 0) * 0.2) : 0;
 const creditBalance = 0;
 const spendLimitDisplay =
 budget && budget.spend_limit > 0 ? formatCurrency(budget.spend_limit): "not yetSettings";
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
 return "alreadyPayment";
 case "failed":
 return "PaymentFailed";
 case "refunded":
 return "alreadyRefund";
 case "pending":
 default:
 return "Pending";
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
 // QuotaInterfacecancannot yetImplementorNonePermission
 }

 try {
 const settings = await billingApi.getBudgetSettings(activeWorkspaceId);
 if (isActive) {
 setBudget(settings);
 setSpendCapEnabled(settings.spend_limit_enabled);
 }
 } catch {
 // BudgetInterfacecancannot yetImplementorNonePermission
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
 setInvoiceError(error instanceof Error ? error.message: "FetchBillingFailed");
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

 // LoadWorkspaceUsageStatistics
 useEffect(() => {
 if (!activeWorkspaceId) return;
 let isActive = true;

 const loadWorkspaceUsageStats = async () => {
 try {
 setWorkspaceUsageLoading(true);
 setWorkspaceUsageError(null);
 const stats = await billingApi.getWorkspaceUsageStats(activeWorkspaceId);
 if (!isActive) return;
 setWorkspaceUsageStats(stats);
 } catch (error) {
 if (!isActive) return;
 setWorkspaceUsageError(error instanceof Error ? error.message: "FetchWorkspaceUsageFailed");
 // UsageExampleData
 setWorkspaceUsageStats([
 {
 id: "1",
 workspace_id: activeWorkspaceId,
 workspace_name: "SmartSupportAssistant",
 workspace_icon: "🤖",
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
 workspace_id: activeWorkspaceId,
 workspace_name: "DocumentAnalytics",
 workspace_icon: "📄",
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
 workspace_id: activeWorkspaceId,
 workspace_name: "DataExtractWorkflow",
 workspace_icon: "📊",
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
 workspace_id: activeWorkspaceId,
 workspace_name: "Marketing CopyGenerate",
 workspace_icon: "✍️",
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
 if (isActive) setWorkspaceUsageLoading(false);
 }
 };

 loadWorkspaceUsageStats();
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
 if (limit <= 0) return "notlimit";
 const remaining = limit - used;
 const formatted = formatNumber(Math.abs(remaining), digits);
 const unitLabel = unit ? ` ${unit}` : "";
 if (remaining < 0) return `alreadyExcess ${formatted}${unitLabel}`;
 return `Remaining ${formatted}${unitLabel}`;
 };

 const usageItems = [
 {
 id: "apiCalls",
 label: "API Call",
 caption: "monthsRequestQuota",
 icon: Zap,
 used: resolvedUsage.apiCalls.used,
 limit: resolvedUsage.apiCalls.limit,
 helper: buildUsageHelper(resolvedUsage.apiCalls.used, resolvedUsage.apiCalls.limit, "times"),
 },
 {
 id: "tokens",
 label: "Token Usage",
 caption: "ModelConsumption",
 icon: Bot,
 used: resolvedUsage.tokens.used,
 limit: resolvedUsage.tokens.limit,
 helper: buildUsageHelper(resolvedUsage.tokens.used, resolvedUsage.tokens.limit, "Token"),
 },
 {
 id: "storage",
 label: "StorageEmptybetween",
 caption: "forStorage",
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
 label: "BandwidthUsage",
 caption: "NetworkTransfer",
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
 label: "AppCount",
 caption: "canCreateApp",
 icon: LayoutGrid,
 used: resolvedUsage.apps.used,
 limit: resolvedUsage.apps.limit,
 helper: buildUsageHelper(resolvedUsage.apps.used, resolvedUsage.apps.limit, ""),
 },
 {
 id: "teamMembers",
 label: "TeamMember",
 caption: "Member",
 icon: Users,
 used: resolvedUsage.teamMembers.used,
 limit: resolvedUsage.teamMembers.limit,
 helper: buildUsageHelper(
 resolvedUsage.teamMembers.used,
 resolvedUsage.teamMembers.limit,
 "person"
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
 maxUsagePercent >= 1 ? "alreadyExcess": maxUsagePercent >= 0.8 ? "onlimit": "Health";
 const quotaStatusVariant = maxUsagePercent >= 1 ? "error" : maxUsagePercent >= 0.8 ? "warning" : "success";
 const quotaSourceLabel = quota ? "Real-timeData": "ExampleData";

 return (
 <PageContainer>
 <div className="space-y-6">
 <PageHeader
 title="SubscriptionandBilling"
 description="ManagePlan, Quota, PaymentmethodandInvoiceRecord"
 actions={(
 <div className="flex flex-wrap items-center gap-2">
 <Button
 variant="outline"
 size="sm"
 leftIcon={<Receipt className="w-3.5 h-3.5" />}
 >
 Invoice
 </Button>
 <Button
 variant="outline"
 size="sm"
 leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
 >
 ContactSales
 </Button>
 <Button
 size="sm"
 rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
 >
 UpgradePlan
 </Button>
 </div>
 )}
 >
 <div className="flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
 <span className="inline-flex items-center gap-1.5">
 <Crown className="w-3.5 h-3.5" />
 CurrentPlan {currentPlan?.name || "Professionalversion"}
 </span>
 <span className="inline-flex items-center gap-1.5">
 <Calendar className="w-3.5 h-3.5" />
 Billingmethod {billingLabel}
 </span>
 <span className="inline-flex items-center gap-1.5">
 <TrendingUp className="w-3.5 h-3.5" />
 Discount {billingCycle === "yearly" ? "20%": "None"}
 </span>
 </div>
 </PageHeader>
 <Callout variant="info" title="UpgradeGuide">
 CurrentQuotaUsagewillBusinessGrowthQuickon, SuggestionbeforeEvaluateUpgradeorPleaseoutsideQuota.
 <div className="mt-3 flex flex-wrap gap-2">
 <Button asChild size="sm">
 <Link href="/dashboard/upgrade">
 UpgradePlan
 <ArrowUpRight className="w-3.5 h-3.5" />
 </Link>
 </Button>
 <Button asChild variant="outline" size="sm">
 <Link href="/dashboard/support-tickets?category=billing">PleaseoutsideQuota</Link>
 </Button>
 </div>
 </Callout>
 <div className="page-divider" />
 <section className="page-panel relative overflow-hidden">
 <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand-500/10 blur-3xl" />
 <div className="page-panel-header flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
 <div>
 <p className="page-caption">CurrentPlan</p>
 <h2 className="text-section-title text-foreground">
 {currentPlan?.name || "Professionalversion"}
 </h2>
 <p className="page-panel-description">
 {currentPlan?.description || "faceProfessionalUserandsmallTeam'scanPlan"}
 </p>
 </div>
 <div className="flex items-center gap-2">
 <Badge variant="success" size="sm">
 Active
 </Badge>
 <Button variant="outline" size="sm">
 ManageSubscription
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
 <h3 className="text-card-title">{currentPlan?.name || "Professionalversion"}</h3>
 {currentPlan?.popular && (
 <Badge variant="primary" size="sm">
 <Star className="w-3 h-3" />
 Recommended
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
 /months · {billingLabel} · {billingHint}
 </p>
 </div>
 <Badge variant="secondary" size="sm">
 downtimesRenew: 2026-02-28
 </Badge>
 </div>
 <div className="page-grid sm:grid-cols-2">
 <div className="rounded-md border border-border bg-surface-75 p-4">
 <p className="text-xs text-foreground-muted">Team</p>
 <p className="text-sm font-medium text-foreground tabular-nums">
 {resolvedUsage.teamMembers.used} / {resolvedUsage.teamMembers.limit}
 </p>
 <p className="text-xs text-foreground-light">alreadyAllocate</p>
 </div>
 <div className="rounded-md border border-border bg-surface-75 p-4">
 <p className="text-xs text-foreground-muted">StorageEmptybetween</p>
 <p className="text-sm font-medium text-foreground tabular-nums">
 {formatNumber(resolvedUsage.storage.used, 1)} GB /{""}
 {formatNumber(resolvedUsage.storage.limit, 1)} GB
 </p>
 <p className="text-xs text-foreground-light">currentmonthsUsage</p>
 </div>
 <div className="rounded-md border border-border bg-surface-75 p-4">
 <p className="text-xs text-foreground-muted">API Call</p>
 <p className="text-sm font-medium text-foreground tabular-nums">
 {formatNumber(resolvedUsage.apiCalls.used)} /{""}
 {formatNumber(resolvedUsage.apiCalls.limit)}
 </p>
 <p className="text-xs text-foreground-light">currentmonthsUsage</p>
 </div>
 <div className="rounded-md border border-border bg-surface-75 p-4">
 <p className="text-xs text-foreground-muted">Supportetc</p>
 <p className="text-sm font-medium text-foreground">StandardSupport</p>
 <p className="text-xs text-foreground-light">24 hResponse</p>
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
 <p className="text-xs text-foreground-muted mb-3">BillingSummary</p>
 <div className="space-y-2 text-sm">
 <div className="flex items-center justify-between">
 <span className="text-foreground-light">small</span>
 <span className="text-foreground tabular-nums">
 {formatCurrency(invoiceSubtotal)}
 </span>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-foreground-light">Discount</span>
 <span className="text-foreground tabular-nums">
 {invoiceDiscount > 0
 ? `-${formatCurrency(invoiceDiscount)}`
 : formatCurrency(0)}
 </span>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-foreground-light"></span>
 <span className="text-foreground tabular-nums">
 {formatCurrency(invoiceTax)}
 </span>
 </div>
 <div className="h-px bg-border my-2" />
 <div className="flex items-center justify-between font-medium">
 <span className="text-foreground">Estimatedtotal</span>
 <span className="text-foreground tabular-nums">
 {formatCurrency(invoiceTotal)}
 </span>
 </div>
 </div>
 </div>
 <div className="rounded-md border border-border bg-surface-75 p-4">
 <p className="text-xs text-foreground-muted mb-3">QuickAction</p>
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
 loadingText="Download"
 >
 DownloadcurrentInvoice
 </Button>
 <Button
 variant="ghost"
 size="sm"
 className="w-full justify-between"
 rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
 >
 UpdatePaymentmethod
 </Button>
 </div>
 </div>
 <div className="rounded-md border border-border bg-surface-75 p-4">
 <div className="flex items-center justify-between mb-3">
 <p className="text-xs text-foreground-muted">useBalance</p>
 <Badge variant="secondary" size="xs">
 Auto
 </Badge>
 </div>
 <div className="flex items-baseline gap-2">
 <span className="text-2xl font-semibold text-foreground tabular-nums">
 {formatCurrency(creditBalance)}
 </span>
 <span className="text-xs text-foreground-muted">canUsed fornot yetcomeBilling</span>
 </div>
 <p className="text-xs text-foreground-muted mt-2">
 BalancewillPriorityPlanandExcessUsageCost.
 </p>
 <Button
 variant="ghost"
 size="sm"
 className="mt-3 w-full justify-between"
 rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
 >
 valueQuota
 </Button>
 </div>
 </div>
 </div>
 </section>

 <section className="page-panel">
 <div className="page-panel-header flex items-center justify-between">
 <div>
 <h3 className="page-panel-title">QuotaUsageDashboard</h3>
 <p className="page-panel-description">byWorkspaceQuotaReal-timeStatistics</p>
 </div>
 <div className="flex items-center gap-2">
 {quotaLoading && (
 <Badge variant="secondary" size="xs">
 Sync
 </Badge>
 )}
 <Button variant="outline" size="sm">
 PurchaseoutsideQuota
 </Button>
 </div>
 </div>
 <div className="p-6 space-y-4">
 <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-border bg-surface-75 p-4">
 <div className="space-y-2">
 <p className="text-xs text-foreground-muted">QuotaHealth</p>
 <div className="flex flex-wrap items-center gap-2">
 <Badge variant={quotaStatusVariant} size="sm">
 {quotaStatus}
 </Badge>
 <span className="text-xs text-foreground-light">
 mostUsagerate {Math.round(maxUsagePercent * 100)}%
 </span>
 </div>
 <p className="text-xs text-foreground-muted">
 AverageUsagerate {Math.round(averageUsagePercent * 100)}% · {quotaSourceLabel}
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
 <p>QuotaPriorityShowcase</p>
 <p>Suggestion 20% SecurityEdge</p>
 </div>
 </div>
 </div>

 {usageAlertItems.length > 0 && (
 <Callout
 variant={overLimitItems.length > 0 ? "error" : "warning"}
 title={overLimitItems.length > 0 ? "alreadyTriggerExcess": "Quotanowwilluse"}
 >
 <p>
 {overLimitItems.length > 0
 ? "PartialResourcealreadyExceedPlanQuota, SuggestionNowUpgradeorPleaseoutsideQuota, AvoidImpactBusinessStable."
: "keyResourcenowwillReachQuotaonlimit, PleasebeforePlanningUpgradeorSupplementQuota."}
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
 UpgradePlan
 <ArrowUpRight className="w-3.5 h-3.5" />
 </Link>
 </Button>
 <Button asChild variant="outline" size="sm">
 <Link href="/dashboard/support-tickets?category=billing">PleaseoutsideQuota</Link>
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
 <h3 className="page-panel-title">byApp Statistics</h3>
 <p className="page-panel-description">AppViewUsageandCost, atforandoptimal</p>
 </div>
 <div className="flex items-center gap-2">
 {workspaceUsageLoading && (
 <Badge variant="secondary" size="xs">
 Sync
 </Badge>
 )}
 <Button variant="outline" size="sm" rightIcon={<Download className="w-3.5 h-3.5" />}>
 ExportReport
 </Button>
 </div>
 </div>
 <div className="p-6">
 <div className="rounded-md border border-border overflow-hidden">
 <table className="w-full text-sm">
 <thead className="bg-surface-200">
 <tr>
 <th className="text-table-header text-left px-4 py-2">App</th>
 <th className="text-table-header text-right px-4 py-2">Requests</th>
 <th className="text-table-header text-right px-4 py-2">Token</th>
 <th className="text-table-header text-right px-4 py-2">Storage</th>
 <th className="text-table-header text-right px-4 py-2">Bandwidth</th>
 <th className="text-table-header text-right px-4 py-2">Cost</th>
 <th className="text-table-header text-right px-4 py-2">Trend</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {workspaceUsageStats.length === 0 ? (
 <tr className="bg-surface-75">
 <td colSpan={7} className="px-4 py-6 text-center text-foreground-muted">
 {workspaceUsageError
 ? `LoadFailed: ${workspaceUsageError}`
 : workspaceUsageLoading
 ? "LoadingWorkspaceUsageData..."
: "NoneWorkspaceUsageData"}
 </td>
 </tr>
 ) : (
 workspaceUsageStats.map((stat) => (
 <tr key={stat.id} className="bg-surface-75 hover:bg-surface-100 transition-colors">
 <td className="px-4 py-3">
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 rounded-md bg-surface-200 flex items-center justify-center text-base">
 {stat.workspace_icon || "📱"}
 </div>
 <div>
 <p className="text-sm font-medium text-foreground">{stat.workspace_name}</p>
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
 <span className="text-xs text-foreground-muted"></span>
 </>
 )}
 </div>
 </td>
 </tr>
 ))
 )}
 </tbody>
 {workspaceUsageStats.length > 0 && (
 <tfoot className="bg-surface-200/50">
 <tr>
 <td className="px-4 py-2 text-sm font-medium text-foreground">Sum</td>
 <td className="px-4 py-2 text-right text-sm font-medium text-foreground tabular-nums">
 {formatNumber(workspaceUsageStats.reduce((sum, s) => sum + (s.usage.requests || 0), 0))}
 </td>
 <td className="px-4 py-2 text-right text-sm font-medium text-foreground tabular-nums">
 {formatNumber(workspaceUsageStats.reduce((sum, s) => sum + (s.usage.tokens || 0), 0))}
 </td>
 <td className="px-4 py-2 text-right text-sm font-medium text-foreground tabular-nums">
 {formatNumber(workspaceUsageStats.reduce((sum, s) => sum + (s.usage.storage || 0), 0), 1)} GB
 </td>
 <td className="px-4 py-2 text-right text-sm font-medium text-foreground tabular-nums">
 {formatNumber(workspaceUsageStats.reduce((sum, s) => sum + (s.usage.bandwidth || 0), 0), 1)} GB
 </td>
 <td className="px-4 py-2 text-right text-sm font-medium text-foreground tabular-nums">
 {formatCurrency(workspaceUsageStats.reduce((sum, s) => sum + s.cost_amount, 0))}
 </td>
 <td className="px-4 py-2 text-right text-xs text-foreground-muted">-</td>
 </tr>
 </tfoot>
 )}
 </table>
 </div>
 <p className="text-xs text-foreground-muted mt-3">
 {workspaceUsageStats.length === 0
 ? "NoneAppData"
: `Display ${workspaceUsageStats.length} App'scurrentmonthsUsageStatistics`}
 </p>
 </div>
 </section>

 <section className="page-panel">
 <div className="page-panel-header flex items-center justify-between">
 <div>
 <h3 className="page-panel-title">CostControl</h3>
 <p className="page-panel-description">MaintainBudgetcan, AvoidExcessCost</p>
 </div>
 <Button variant="outline" size="sm">
 Adjustonlimit
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
 <p className="text-sm font-medium text-foreground">Payoutonlimit</p>
 <p className="text-xs text-foreground-muted">ExceedQuotatime'sSecurityvalue</p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <Badge variant={spendCapEnabled ? "secondary" : "warning"} size="sm">
 {spendCapEnabled ? "Enabled": "alreadyClose"}
 </Badge>
 <Switch
 checked={spendCapEnabled}
 onCheckedChange={setSpendCapEnabled}
 aria-label="SwitchPayoutonlimit"
 />
 </div>
 </div>
 <p className="text-xs text-foreground-muted">
 EnableafterExcessRequestwilltoLimit, AvoidoutsideCost.
 </p>
 <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-foreground-light">
 <span>Currentonlimit</span>
 <div className="flex items-center gap-2">
 <Input
 value={spendLimitDisplay}
 readOnly
 className="h-8 max-w-[120px] text-xs bg-surface-200"
 />
 <Button variant="outline" size="xs">
 Edit
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
 <p className="text-sm font-medium text-foreground">ContainsQuota</p>
 <p className="text-xs text-foreground-muted">CurrentPlanAvailable'sBasicQuota</p>
 </div>
 </div>
 <div className="page-grid grid-cols-2 gap-2 text-xs lg:gap-2">
 <div className="flex items-center justify-between rounded-md border border-border bg-surface-200/60 px-2 py-1">
 <span className="text-foreground-light">API Call</span>
 <span className="text-foreground tabular-nums">
 {formatNumber(resolvedUsage.apiCalls.limit)}
 </span>
 </div>
 <div className="flex items-center justify-between rounded-md border border-border bg-surface-200/60 px-2 py-1">
 <span className="text-foreground-light">Token Usage</span>
 <span className="text-foreground tabular-nums">
 {formatNumber(resolvedUsage.tokens.limit)}
 </span>
 </div>
 <div className="flex items-center justify-between rounded-md border border-border bg-surface-200/60 px-2 py-1">
 <span className="text-foreground-light">StorageEmptybetween</span>
 <span className="text-foreground tabular-nums">
 {formatNumber(resolvedUsage.storage.limit, 1)} GB
 </span>
 </div>
 <div className="flex items-center justify-between rounded-md border border-border bg-surface-200/60 px-2 py-1">
 <span className="text-foreground-light">AppCount</span>
 <span className="text-foreground tabular-nums">
 {formatNumber(resolvedUsage.apps.limit)}
 </span>
 </div>
 <div className="flex items-center justify-between rounded-md border border-border bg-surface-200/60 px-2 py-1">
 <span className="text-foreground-light">TeamMember</span>
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
 <h3 className="page-panel-title">Planforcompare</h3>
 <p className="page-panel-description">Based onTeamScaleSelectmore'sPlan</p>
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
 months
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
 years
 <Badge variant="primary" size="xs">
 20%
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
 Popular
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
 <span className="text-xs text-foreground-muted">/months</span>
 </div>
 {plan.current ? (
 <Button variant="outline" size="sm" className="w-full" disabled>
 CurrentPlan
 </Button>
 ) : (
 <Button
 variant={plan.id === "business" ? "outline" : "default"}
 size="sm"
 className={cn("w-full", plan.id === "business" && "text-foreground-light")}
 >
 {plan.id === "business"
 ? "ContactSales"
 : plan.price === 0
 ? "StartUsage"
: "UpgradetothisPlan"}
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
 <h3 className="page-panel-title">Paymentmethod</h3>
 <p className="page-panel-description">Used forAutoRenewandInvoicePayment</p>
 </div>
 <Button variant="outline" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
 Addmethod
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
 <p className="text-xs text-foreground-muted">to: {method.expiry}</p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 {method.default && (
 <Badge variant="secondary" size="sm">
 Default
 </Badge>
 )}
 <Button variant="ghost" size="sm">
 Edit
 </Button>
 </div>
 </div>
 ))}
 </div>
 </section>

 <section className="page-panel">
 <div className="page-panel-header flex items-center justify-between">
 <div>
 <h3 className="page-panel-title">BillingHistory</h3>
 <p className="page-panel-description">Recent 6 months'sPaymentRecord</p>
 </div>
 <Button
 variant="outline"
 size="sm"
 rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
 >
 View all
 </Button>
 </div>
 <div className="p-6">
 {selectedInvoiceSummary && (
 <div className="mb-5 rounded-md border border-border bg-surface-75 p-4">
 <div className="flex flex-wrap items-start justify-between gap-3">
 <div className="space-y-1">
 <p className="text-xs text-foreground-muted">BillingDetail</p>
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
 {selectedInvoiceSummary.period} · Invoice {selectedInvoiceSummary.invoice}
 </p>
 {selectedInvoiceSummary.paidAt && (
 <p className="text-xs text-foreground-muted">
 PaymentTime {selectedInvoiceSummary.paidAt}
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
 loadingText="Download"
 >
 DownloadInvoice
 </Button>
 <Button variant="ghost" size="sm" leftIcon={<Receipt className="w-3.5 h-3.5" />}>
 ViewReceipt
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
 {invoiceDetailLoading ? "Loading billing details..." : "No billing details"}
 </div>
 )}
 </div>
 </div>
 )}
 <div className="rounded-md border border-border overflow-hidden">
 <table className="w-full text-sm">
 <thead className="bg-surface-200">
 <tr>
 <th className="text-table-header text-left px-4 py-2">Date</th>
 <th className="text-table-header text-left px-4 py-2">Description</th>
 <th className="text-table-header text-left px-4 py-2">Invoice</th>
 <th className="text-table-header text-right px-4 py-2">Amount</th>
 <th className="text-table-header text-right px-4 py-2">Status</th>
 <th className="text-table-header text-right px-4 py-2">Action</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {invoices.length === 0 ? (
 <tr className="bg-surface-75">
 <td colSpan={6} className="px-4 py-6 text-center text-foreground-muted">
 {invoiceError
 ? `BillingLoadFailed: ${invoiceError}`
 : invoiceLoading
 ? "LoadingBilling..."
: "NoneBillingRecord"}
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
 ViewDetail
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
 ? "NoneBillingRecord"
: `Display 1 ${invoices.length} , ${invoices.length} Record`}
 </p>
 </div>
 </section>
 </div>

 <div className="page-grid lg:grid-cols-2">
 <section className="page-panel">
 <div className="page-panel-header flex items-center justify-between">
 <div>
 <h3 className="page-panel-title">BillingInboxperson</h3>
 <p className="page-panel-description">AllBillingNotificationswillSendthisEmail</p>
 </div>
 <Button variant="outline" size="sm">
 ManageInboxperson
 </Button>
 </div>
 <div className="p-6 space-y-4">
 <div className="space-y-2">
 <Label htmlFor="billing-email">Email Address</Label>
 <Input id="billing-email" defaultValue={billingContact.primaryEmail} />
 <p className="text-xs text-foreground-muted">
 Invoice, PaymentReminderandChangeNotificationsallwillSyncSendthisEmail.
 </p>
 </div>
 <div className="space-y-2">
 <Label variant="optional">outsideInboxperson</Label>
 <div className="flex flex-wrap items-center gap-2">
 {billingContact.additionalEmails.map((email) => (
 <Badge key={email} variant="secondary" size="sm">
 {email}
 </Badge>
 ))}
 <Button variant="outline" size="xs">
 Add
 </Button>
 </div>
 </div>
 <div className="rounded-md border border-border bg-surface-75 p-3 text-xs text-foreground-muted">
 outsideInboxpersonwillReceiveandmainEmail1'sBillingandPaymentReminder.
 </div>
 </div>
 </section>

 <section className="page-panel">
 <div className="page-panel-header flex items-center justify-between">
 <div>
 <h3 className="page-panel-title">BillingAddressandInfo</h3>
 <p className="page-panel-description">Used forGenerateComplianceInvoiceandInfo</p>
 </div>
 <Button variant="outline" size="sm">
 SaveChange
 </Button>
 </div>
 <div className="p-6 space-y-4">
 <div className="page-grid md:grid-cols-2 gap-4 lg:gap-4">
 <div className="space-y-2">
 <Label htmlFor="billing-name">Name</Label>
 <Input id="billing-name" defaultValue={billingAddress.name} />
 </div>
 <div className="space-y-2">
 <Label htmlFor="billing-tax-id" variant="optional">
 
 </Label>
 <Input id="billing-tax-id" defaultValue={billingAddress.taxId} />
 </div>
 </div>
 <div className="page-grid md:grid-cols-2 gap-4 lg:gap-4">
 <div className="space-y-2">
 <Label htmlFor="billing-line1">Addressrow 1</Label>
 <Input id="billing-line1" defaultValue={billingAddress.line1} />
 </div>
 <div className="space-y-2">
 <Label htmlFor="billing-line2" variant="optional">
 Addressrow 2
 </Label>
 <Input id="billing-line2" defaultValue={billingAddress.line2} />
 </div>
 </div>
 <div className="page-grid md:grid-cols-3 gap-4 lg:gap-4">
 <div className="space-y-2">
 <Label htmlFor="billing-country">/</Label>
 <Input id="billing-country" defaultValue={billingAddress.country} />
 </div>
 <div className="space-y-2">
 <Label htmlFor="billing-city">City</Label>
 <Input id="billing-city" defaultValue={billingAddress.city} />
 </div>
 <div className="space-y-2">
 <Label htmlFor="billing-state">/</Label>
 <Input id="billing-state" defaultValue={billingAddress.state} />
 </div>
 </div>
 <div className="page-grid md:grid-cols-2 gap-4 lg:gap-4">
 <div className="space-y-2">
 <Label htmlFor="billing-postal"></Label>
 <Input id="billing-postal" defaultValue={billingAddress.postalCode} />
 </div>
 <div className="space-y-2">
 <Label htmlFor="billing-contact" variant="optional">
 ContactPhone
 </Label>
 <Input id="billing-contact" placeholder="Fill inOptionalContactmethod" />
 </div>
 </div>
 <div className="text-xs text-foreground-muted">
 ChangeonlyImpactnot yetcomeBilling, HistoryBillingnotwillUpdate.
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
 <h4 className="text-card-title">InviteFriends, ObtainRewards</h4>
 <p className="text-description mt-1">
 eachSuccessInvite1FriendsSign Up, methodallwillObtain 1000 timesoutsideAPI CallQuota.
 </p>
 </div>
 <Button
 size="sm"
 className="bg-brand-500 text-background hover:bg-brand-600"
 rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
 >
 NowInvite
 </Button>
 </div>
 </section>
 </div>
 </PageContainer>
 );
}
