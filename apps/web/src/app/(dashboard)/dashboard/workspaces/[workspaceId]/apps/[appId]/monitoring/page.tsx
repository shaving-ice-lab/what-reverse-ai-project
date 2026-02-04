"use client";

/**
 * App 运行监控页 - Supabase 风格
 * 运行日志列表、指标概览、状态筛选
 */

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Play,
  Pause,
  BarChart3,
  Zap,
  Bot,
  TrendingUp,
  TrendingDown,
  Calendar,
  Timer,
  ShieldCheck,
  ListChecks,
  ClipboardCheck,
  Users,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  PageContainer,
  PageHeader,
  PageWithSidebar,
  SettingsSection,
  SidebarNavItem,
  SidebarNavGroup,
} from "@/components/dashboard/page-layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  appApi,
  type App,
  type AppExecution,
  type AppMetrics,
} from "@/lib/api/app";
import { workspaceApi, type Workspace } from "@/lib/api/workspace";
import { AppAccessGate } from "@/components/permissions/app-access-gate";
import { buildWorkspacePermissions, resolveWorkspaceRoleFromUser } from "@/lib/permissions";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  regressionTestCases,
  reviewSamplingStrategy,
  type RegressionTestCase,
} from "@/lib/mock-data";

// 执行状态配置
const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  pending: { label: "等待中", color: "text-foreground-muted", bgColor: "bg-surface-200", icon: Clock },
  running: { label: "运行中", color: "text-brand-500", bgColor: "bg-brand-200", icon: Loader2 },
  completed: { label: "已完成", color: "text-brand-500", bgColor: "bg-brand-200", icon: CheckCircle2 },
  failed: { label: "失败", color: "text-destructive", bgColor: "bg-destructive-200", icon: XCircle },
  cancelled: { label: "已取消", color: "text-warning", bgColor: "bg-warning-200", icon: AlertCircle },
};

const timeRangeOptions = [
  { value: "all", label: "全部时间" },
  { value: "24h", label: "近 24 小时" },
  { value: "7d", label: "近 7 天" },
  { value: "30d", label: "近 30 天" },
  { value: "90d", label: "近 90 天" },
];

const nodeTypeOptions = [
  { value: "all", label: "全部节点类型" },
  { value: "input", label: "输入节点" },
  { value: "llm", label: "模型节点" },
  { value: "output", label: "输出节点" },
  { value: "webhook", label: "Webhook" },
  { value: "storage", label: "存储/数据库" },
  { value: "workflow", label: "流程节点" },
];

type QualityMetricStatus = "good" | "warn" | "risk";

type QualityMetric = {
  id: string;
  label: string;
  description: string;
  value: number;
  target: number;
  unit: string;
  trend: "up" | "down";
  status: QualityMetricStatus;
  icon: React.ElementType;
};

const qualityStatusConfig: Record<
  QualityMetricStatus,
  { label: string; color: string; bgColor: string; icon: React.ElementType }
> = {
  good: { label: "达标", color: "text-brand-500", bgColor: "bg-brand-200", icon: CheckCircle2 },
  warn: { label: "观察", color: "text-warning", bgColor: "bg-warning-200", icon: AlertCircle },
  risk: { label: "需优化", color: "text-destructive", bgColor: "bg-destructive-200", icon: XCircle },
};

const clampScore = (value: number, min = 0, max = 100) => Math.min(Math.max(value, min), max);

const getQualityStatus = (value: number, target: number): QualityMetricStatus => {
  if (value >= target) return "good";
  if (value >= target - 5) return "warn";
  return "risk";
};

const buildQualityMetrics = (metrics: AppMetrics | null, executions: AppExecution[]) => {
  const totalExecutions = metrics?.total_executions ?? executions.length;
  const hasSamples = totalExecutions > 0;
  const baseScore =
    hasSamples && metrics?.success_rate !== undefined
      ? Math.round(metrics.success_rate * 100)
      : 92;
  const score = (delta: number) => clampScore(baseScore + delta, 60, 99);

  const rows = [
    {
      id: "coherence",
      label: "内容一致性",
      description: "上下文连贯与结构完整度",
      value: score(-1),
      target: 90,
      unit: "分",
      icon: Bot,
    },
    {
      id: "factual",
      label: "事实一致性",
      description: "事实校验与引用匹配",
      value: score(-3),
      target: 88,
      unit: "分",
      icon: BarChart3,
    },
    {
      id: "readability",
      label: "可读性评分",
      description: "表达清晰与格式规范",
      value: score(2),
      target: 92,
      unit: "分",
      icon: Activity,
    },
    {
      id: "safety",
      label: "安全合规",
      description: "安全规则命中与过滤效果",
      value: score(1),
      target: 95,
      unit: "分",
      icon: ShieldCheck,
    },
  ];

  return {
    summary: {
      sampleCount: totalExecutions,
      days: 7,
      hasSamples,
    },
    metrics: rows.map((row) => ({
      ...row,
      status: getQualityStatus(row.value, row.target),
      trend: row.value >= row.target ? "up" : "down",
    })),
  };
};

type RegressionSummary = {
  total: number;
  passed: number;
  failed: number;
  needsReview: number;
  flaky: number;
  passRate: number;
  lastRunAt?: string;
  tagCoverage: number;
};

const regressionStatusConfig: Record<
  RegressionTestCase["status"],
  { label: string; color: string; bgColor: string; icon: React.ElementType }
> = {
  pass: { label: "通过", color: "text-brand-500", bgColor: "bg-brand-200", icon: CheckCircle2 },
  fail: { label: "失败", color: "text-destructive", bgColor: "bg-destructive-200", icon: XCircle },
  needs_review: { label: "待复核", color: "text-warning", bgColor: "bg-warning-200", icon: AlertCircle },
  flaky: { label: "不稳定", color: "text-foreground-muted", bgColor: "bg-surface-200", icon: Clock },
};

const reviewPriorityConfig = {
  high: { label: "高优先级", color: "text-destructive", bgColor: "bg-destructive-200" },
  medium: { label: "中优先级", color: "text-warning", bgColor: "bg-warning-200" },
  low: { label: "低优先级", color: "text-foreground-muted", bgColor: "bg-surface-200" },
} as const;

const reviewStatusConfig = {
  active: { label: "执行中", color: "text-brand-500", bgColor: "bg-brand-200" },
  paused: { label: "已暂停", color: "text-foreground-muted", bgColor: "bg-surface-200" },
} as const;

const nodeStatusSamples = [
  { id: "input", label: "输入校验", status: "completed", detail: "字段校验正常" },
  { id: "llm", label: "模型调用", status: "running", detail: "平均响应 2.4s" },
  { id: "storage", label: "存储写入", status: "completed", detail: "写入成功率 99.1%" },
  { id: "webhook", label: "回调/Webhook", status: "pending", detail: "等待外部确认" },
];

const summarizeRegressionCases = (cases: RegressionTestCase[]): RegressionSummary => {
  const total = cases.length;
  const passed = cases.filter((item) => item.status === "pass").length;
  const failed = cases.filter((item) => item.status === "fail").length;
  const needsReview = cases.filter((item) => item.status === "needs_review").length;
  const flaky = cases.filter((item) => item.status === "flaky").length;
  const passRate = total > 0 ? passed / total : 0;
  const lastRunAt = cases.reduce<string | undefined>((latest, item) => {
    if (!latest) return item.lastRunAt;
    return new Date(item.lastRunAt).getTime() > new Date(latest).getTime()
      ? item.lastRunAt
      : latest;
  }, undefined);
  const tagCoverage = new Set(cases.flatMap((item) => item.tags)).size;

  return {
    total,
    passed,
    failed,
    needsReview,
    flaky,
    passRate,
    lastRunAt,
    tagCoverage,
  };
};

// 侧边导航
function AppNav({ workspaceId, appId, activeTab }: { workspaceId: string; appId: string; activeTab: string }) {
  const navItems = [
    { id: "overview", label: "概览", href: `/workspaces/${workspaceId}/apps/${appId}` },
    { id: "builder", label: "构建", href: `/workspaces/${workspaceId}/apps/${appId}/builder` },
    { id: "publish", label: "发布设置", href: `/workspaces/${workspaceId}/apps/${appId}/publish` },
    { id: "versions", label: "版本历史", href: `/workspaces/${workspaceId}/apps/${appId}/versions` },
    { id: "monitoring", label: "监控", href: `/workspaces/${workspaceId}/apps/${appId}/monitoring` },
    { id: "domains", label: "域名", href: `/workspaces/${workspaceId}/apps/${appId}/domains` },
  ];

  return (
    <SidebarNavGroup title="应用">
      {navItems.map((item) => (
        <SidebarNavItem
          key={item.id}
          href={item.href}
          label={item.label}
          active={activeTab === item.id}
        />
      ))}
    </SidebarNavGroup>
  );
}

export default function MonitoringPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const appId = params.appId as string;
  const { user } = useAuthStore();
  const workspaceRole = resolveWorkspaceRoleFromUser(user?.role);
  const permissions = buildWorkspacePermissions(workspaceRole);

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [app, setApp] = useState<App | null>(null);
  const [executions, setExecutions] = useState<AppExecution[]>([]);
  const [metrics, setMetrics] = useState<AppMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cancelingExecutionId, setCancelingExecutionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // 筛选
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [executionQuery, setExecutionQuery] = useState("");
  const [timeRangeFilter, setTimeRangeFilter] = useState("all");
  const [nodeTypeFilter, setNodeTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const [regressionStatusFilter, setRegressionStatusFilter] = useState<string>("all");
  const [regressionQuery, setRegressionQuery] = useState("");

  const [activeExecutionId, setActiveExecutionId] = useState<string | null>(null);

  // 加载数据
  useEffect(() => {
    loadData();
  }, [workspaceId, appId, statusFilter, page]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [ws, appData, executionsData, metricsData] = await Promise.all([
        workspaceApi.get(workspaceId),
        appApi.get(appId),
        appApi.getExecutions(appId, {
          status: statusFilter !== "all" ? statusFilter : undefined,
          page,
          page_size: pageSize,
        }),
        appApi.getMetrics(appId, 7),
      ]);
      setWorkspace(ws);
      setApp(appData);
      setExecutions(executionsData.items);
      setTotal(executionsData.total);
      setMetrics(metricsData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 刷新
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setActionError(null);
    await loadData();
    setIsRefreshing(false);
  };

  const handleCancelExecution = async (executionId: string) => {
    if (!executionId || cancelingExecutionId) return;
    try {
      setActionError(null);
      setCancelingExecutionId(executionId);
      await appApi.cancelExecution(executionId);
      await loadData();
    } catch (error) {
      console.error("Failed to cancel execution:", error);
      setActionError("取消执行失败，请稍后重试。");
    } finally {
      setCancelingExecutionId(null);
    }
  };

  // 获取状态配置
  const getStatusConfig = (status: string) => {
    return statusConfig[status] || statusConfig.pending;
  };

  // 格式化时长
  const formatDuration = (ms?: number) => {
    if (!ms) return "-";
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  // 格式化时间
  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return "刚刚";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    return date.toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const parseTimestamp = (value?: string) => {
    if (!value) return 0;
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const resolveTriggerType = (execution: AppExecution) => {
    if (execution.session_id) return "API";
    return "手动";
  };

  const resolveNodeType = (execution: AppExecution) => {
    const input = execution.inputs as { node_type?: string } | undefined;
    const output = execution.outputs as { node_type?: string } | undefined;
    return input?.node_type || output?.node_type || "workflow";
  };

  const buildNodeStatusFlow = (execution: AppExecution) => {
    if (execution.status === "completed") {
      return nodeStatusSamples.map((node) => ({ ...node, status: "completed" }));
    }
    if (execution.status === "failed") {
      return nodeStatusSamples.map((node, index) => ({
        ...node,
        status: index === nodeStatusSamples.length - 1 ? "failed" : "completed",
        detail:
          index === nodeStatusSamples.length - 1
            ? execution.error_message || "节点执行失败"
            : node.detail,
      }));
    }
    if (execution.status === "running") {
      return nodeStatusSamples.map((node, index) => ({
        ...node,
        status: index === 1 ? "running" : index < 1 ? "completed" : "pending",
      }));
    }
    return nodeStatusSamples.map((node) => ({ ...node, status: "pending" }));
  };

  const buildExecutionLogs = (execution: AppExecution) => {
    const logs = [
      `执行 ID：${execution.id}`,
      `触发方式：${resolveTriggerType(execution)}`,
      `开始时间：${execution.started_at ? formatTime(execution.started_at) : "未记录"}`,
      `结束时间：${execution.completed_at ? formatTime(execution.completed_at) : "未记录"}`,
    ];
    if (execution.error_message) {
      logs.push(`错误日志：${execution.error_message}`);
    }
    return logs;
  };

  if (isLoading && !app) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-foreground-muted" />
        </div>
      </PageContainer>
    );
  }

  const qualityOverview = buildQualityMetrics(metrics, executions);
  const qualityDescription = qualityOverview.summary.hasSamples
    ? `最近 ${qualityOverview.summary.days} 天 · ${qualityOverview.summary.sampleCount} 次执行样本`
    : "暂无执行样本，展示默认口径";
  const regressionSummary = summarizeRegressionCases(regressionTestCases);
  const normalizedRegressionQuery = regressionQuery.trim().toLowerCase();
  const filteredRegressionCases = useMemo(() => {
    return regressionTestCases.filter((item) => {
      const matchesStatus =
        regressionStatusFilter === "all" || item.status === regressionStatusFilter;
      const matchesQuery =
        normalizedRegressionQuery.length === 0 ||
        item.title.toLowerCase().includes(normalizedRegressionQuery) ||
        item.prompt.toLowerCase().includes(normalizedRegressionQuery) ||
        item.rubric.toLowerCase().includes(normalizedRegressionQuery) ||
        item.tags.some((tag) => tag.toLowerCase().includes(normalizedRegressionQuery));
      return matchesStatus && matchesQuery;
    });
  }, [regressionStatusFilter, normalizedRegressionQuery]);
  const samplingSlaRange = useMemo(() => {
    const slaValues = reviewSamplingStrategy.rules.map((rule) => rule.slaHours);
    if (slaValues.length === 0) return { min: 0, max: 0 };
    return {
      min: Math.min(...slaValues),
      max: Math.max(...slaValues),
    };
  }, []);
  const activeSamplingRules = useMemo(
    () => reviewSamplingStrategy.rules.filter((rule) => rule.status === "active"),
    []
  );
  const totalPages = Math.ceil(total / pageSize);
  const recentExecutions = executions.slice(0, 4);

  const normalizedExecutionQuery = executionQuery.trim().toLowerCase();
  const filteredExecutions = useMemo(() => {
    return executions.filter((execution) => {
      const matchesQuery =
        normalizedExecutionQuery.length === 0 ||
        execution.id.toLowerCase().includes(normalizedExecutionQuery) ||
        (execution.error_message || "").toLowerCase().includes(normalizedExecutionQuery);
      const matchesNodeType =
        nodeTypeFilter === "all" || resolveNodeType(execution) === nodeTypeFilter;
      const timeRangeDays =
        timeRangeFilter === "24h"
          ? 1
          : timeRangeFilter === "7d"
          ? 7
          : timeRangeFilter === "30d"
          ? 30
          : timeRangeFilter === "90d"
          ? 90
          : null;
      if (timeRangeDays) {
        const createdAt = parseTimestamp(execution.created_at);
        if (!createdAt) return false;
        if (Date.now() - createdAt > timeRangeDays * 86400000) return false;
      }
      return matchesQuery && matchesNodeType;
    });
  }, [executions, normalizedExecutionQuery, nodeTypeFilter, timeRangeFilter]);

  useEffect(() => {
    if (filteredExecutions.length === 0) {
      setActiveExecutionId(null);
      return;
    }
    if (!activeExecutionId || !filteredExecutions.some((item) => item.id === activeExecutionId)) {
      setActiveExecutionId(filteredExecutions[0].id);
    }
  }, [filteredExecutions, activeExecutionId]);

  const activeExecution = filteredExecutions.find((item) => item.id === activeExecutionId) || null;
  const activeNodeFlow = activeExecution ? buildNodeStatusFlow(activeExecution) : [];
  const errorRate =
    metrics && metrics.total_executions
      ? metrics.failure_count / metrics.total_executions
      : executions.length
      ? executions.filter((execution) => execution.status === "failed").length / executions.length
      : 0;

  return (
    <AppAccessGate
      app={app}
      workspaceId={workspaceId}
      permissions={permissions}
      required={["app_view_metrics"]}
      backHref={`/workspaces/${workspaceId}/apps`}
    >
      <PageWithSidebar
        sidebarWidth="narrow"
        sidebarTitle={app?.name || "应用"}
        sidebar={<AppNav workspaceId={workspaceId} appId={appId} activeTab="monitoring" />}
      >
        <PageContainer>
        {/* 页面头部 */}
        <PageHeader
          title="运行监控"
          eyebrow={app?.name}
          backHref={`/workspaces/${workspaceId}/apps`}
          backLabel="返回应用列表"
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("w-4 h-4 mr-1.5", isRefreshing && "animate-spin")} />
              刷新
            </Button>
          }
        />

        {/* 指标概览 */}
        <SettingsSection
          title="运行指标"
          description="最近 7 天的执行统计"
          compact
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="总执行次数"
              value={metrics?.total_executions || 0}
              icon={<Zap className="w-4 h-4" />}
            />
            <MetricCard
              label="成功率"
              value={`${((metrics?.success_rate || 0) * 100).toFixed(1)}%`}
              icon={<CheckCircle2 className="w-4 h-4" />}
              highlight={metrics?.success_rate !== undefined && metrics.success_rate < 0.9}
            />
            <MetricCard
              label="平均响应时间"
              value={formatDuration(metrics?.avg_duration_ms)}
              icon={<Timer className="w-4 h-4" />}
            />
            <MetricCard
              label="错误率"
              value={`${(errorRate * 100).toFixed(1)}%`}
              icon={<AlertCircle className="w-4 h-4" />}
              highlight={errorRate > 0.1}
            />
          </div>
        </SettingsSection>

        <SettingsSection title="AI 质量指标" description={qualityDescription} compact>
          <div className="rounded-md bg-surface-100 border border-border overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border bg-surface-75 text-[11px] font-medium text-foreground-muted uppercase tracking-wider">
              <div className="col-span-4">指标</div>
              <div className="col-span-3">当前值</div>
              <div className="col-span-3">目标</div>
              <div className="col-span-2">状态</div>
            </div>
            {qualityOverview.metrics.map((metric) => {
              const status = qualityStatusConfig[metric.status];
              const StatusIcon = status.icon;
              const MetricIcon = metric.icon;
              const TrendIcon = metric.trend === "up" ? TrendingUp : TrendingDown;

              return (
                <div
                  key={metric.id}
                  className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border last:border-b-0 hover:bg-surface-75 transition-colors"
                >
                  <div className="col-span-4 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-md border border-border bg-surface-75 flex items-center justify-center">
                      <MetricIcon className="w-4 h-4 text-foreground-muted" />
                    </div>
                    <div>
                      <div className="text-[12px] font-medium text-foreground">{metric.label}</div>
                      <div className="text-[11px] text-foreground-muted">{metric.description}</div>
                    </div>
                  </div>
                  <div className="col-span-3">
                    <div className="text-[14px] font-semibold text-foreground">
                      {metric.value}
                      {metric.unit}
                    </div>
                    <div className="text-[11px] text-foreground-muted">
                      {qualityOverview.summary.hasSamples
                        ? `样本 ${qualityOverview.summary.sampleCount} 次`
                        : "默认口径"}
                    </div>
                  </div>
                  <div className="col-span-3 flex items-center">
                    <span className="text-[12px] text-foreground-light">
                      ≥ {metric.target}
                      {metric.unit}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={cn("gap-1 text-[10px]", status.bgColor, status.color)}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </Badge>
                    <span
                      className={cn(
                        "inline-flex items-center text-[10px] font-medium",
                        metric.trend === "up" ? "text-brand-500" : "text-warning"
                      )}
                    >
                      <TrendIcon className="w-3 h-3 mr-0.5" />
                      {metric.trend === "up" ? "上升" : "下降"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-foreground-muted">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {qualityOverview.summary.hasSamples ? `最近 ${qualityOverview.summary.days} 天` : "默认口径"}
            </span>
            <span className="flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              评分范围 0-100
            </span>
            <span className="flex items-center gap-1">
              <Bot className="w-3 h-3" />
              抽样评分与规则校验
            </span>
          </div>
        </SettingsSection>

        <SettingsSection
          title="回归测试集"
          description={`可复用用例集 · 覆盖 ${regressionSummary.tagCoverage} 类场景`}
          compact
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="用例总数"
              value={regressionSummary.total}
              icon={<ListChecks className="w-4 h-4" />}
            />
            <MetricCard
              label="通过率"
              value={`${(regressionSummary.passRate * 100).toFixed(1)}%`}
              icon={<CheckCircle2 className="w-4 h-4" />}
              highlight={regressionSummary.passRate < 0.9}
            />
            <MetricCard
              label="失败用例"
              value={regressionSummary.failed}
              icon={<XCircle className="w-4 h-4" />}
              highlight={regressionSummary.failed > 0}
            />
            <MetricCard
              label="最近执行"
              value={regressionSummary.lastRunAt ? formatTime(regressionSummary.lastRunAt) : "-"}
              icon={<Calendar className="w-4 h-4" />}
            />
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                  <Input
                    placeholder="搜索用例标题或标签..."
                    value={regressionQuery}
                    onChange={(event) => setRegressionQuery(event.target.value)}
                    className="pl-9 h-9 w-[220px] bg-surface-200 border-border text-foreground placeholder:text-foreground-muted focus:border-brand-400"
                  />
                </div>
                <Select value={regressionStatusFilter} onValueChange={setRegressionStatusFilter}>
                  <SelectTrigger className="w-[140px] h-9 bg-surface-75 border-border">
                    <SelectValue placeholder="状态筛选" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-100 border-border">
                    <SelectItem value="all">全部状态</SelectItem>
                    {Object.entries(regressionStatusConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-[12px] text-foreground-muted">
                共 {filteredRegressionCases.length} 条用例
              </div>
            </div>

            <div className="rounded-md bg-surface-100 border border-border overflow-hidden">
              <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border bg-surface-75 text-[11px] font-medium text-foreground-muted uppercase tracking-wider">
                <div className="col-span-4">用例</div>
                <div className="col-span-3">校验维度</div>
                <div className="col-span-2">标签</div>
                <div className="col-span-2">结果</div>
                <div className="col-span-1">最近</div>
              </div>

              {filteredRegressionCases.length === 0 ? (
                <div className="py-10 text-center text-[13px] text-foreground-muted">
                  暂无匹配的回归用例
                </div>
              ) : (
                filteredRegressionCases.map((item) => {
                  const status = regressionStatusConfig[item.status];
                  const StatusIcon = status.icon;
                  const scoreTone =
                    item.score >= 90
                      ? "text-brand-500"
                      : item.score >= 85
                      ? "text-warning"
                      : "text-destructive";
                  const displayTags = item.tags.slice(0, 2);
                  const extraTags = item.tags.length - displayTags.length;

                  return (
                    <div
                      key={item.id}
                      className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border last:border-b-0 hover:bg-surface-75 transition-colors"
                    >
                      <div className="col-span-4">
                        <div className="text-[12px] font-medium text-foreground">{item.title}</div>
                        <div className="text-[11px] text-foreground-muted line-clamp-2">
                          {item.prompt}
                        </div>
                        <div className="text-[10px] text-foreground-muted mt-1">
                          负责人：{item.owner}
                        </div>
                      </div>
                      <div className="col-span-3">
                        <div className="text-[11px] text-foreground-light line-clamp-2">
                          {item.rubric}
                        </div>
                        <div className="text-[10px] text-foreground-muted mt-1 line-clamp-1">
                          期望：{item.expected}
                        </div>
                      </div>
                      <div className="col-span-2 flex flex-wrap items-center gap-1">
                        {displayTags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-[10px] bg-surface-200 text-foreground-muted"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {extraTags > 0 && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] bg-surface-200 text-foreground-muted"
                          >
                            +{extraTags}
                          </Badge>
                        )}
                      </div>
                      <div className="col-span-2 flex flex-col gap-1">
                        <Badge
                          variant="secondary"
                          className={cn("gap-1 text-[10px]", status.bgColor, status.color)}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </Badge>
                        <span className={cn("text-[11px] font-medium", scoreTone)}>
                          {item.score} 分
                        </span>
                      </div>
                      <div className="col-span-1 text-[11px] text-foreground-muted">
                        {formatTime(item.lastRunAt)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-foreground-muted">
              <span className="flex items-center gap-1">
                <ListChecks className="w-3 h-3" />
                用例支持复用与版本化管理
              </span>
              <span className="flex items-center gap-1">
                <BarChart3 className="w-3 h-3" />
                评分基于规则校验与抽样评审
              </span>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          title="人工评审抽样策略"
          description={`可执行策略 · 最近更新 ${formatTime(reviewSamplingStrategy.lastUpdated)}`}
          compact
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="基础抽样率"
              value={`${Math.round(reviewSamplingStrategy.baseRate * 100)}%`}
              icon={<Target className="w-4 h-4" />}
            />
            <MetricCard
              label="每日抽样上限"
              value={`${reviewSamplingStrategy.dailyMin}-${reviewSamplingStrategy.dailyMax}`}
              icon={<Filter className="w-4 h-4" />}
            />
            <MetricCard
              label="SLA 范围"
              value={`${samplingSlaRange.min}-${samplingSlaRange.max}h`}
              icon={<Clock className="w-4 h-4" />}
            />
            <MetricCard
              label="执行规则"
              value={`${activeSamplingRules.length}/${reviewSamplingStrategy.rules.length}`}
              icon={<ClipboardCheck className="w-4 h-4" />}
            />
          </div>

          <div className="mt-4 grid lg:grid-cols-[1.1fr_1fr] gap-4">
            <div className="rounded-md bg-surface-100 border border-border p-4">
              <div className="text-[11px] text-foreground-muted uppercase tracking-wider mb-3">
                抽样触发器
              </div>
              <div className="space-y-3">
                {reviewSamplingStrategy.triggers.map((trigger) => (
                  <div key={trigger.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-md bg-surface-75 border border-border flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-warning" />
                    </div>
                    <div>
                      <div className="text-[12px] font-medium text-foreground">{trigger.label}</div>
                      <div className="text-[11px] text-foreground-muted">{trigger.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-md bg-surface-100 border border-border p-4">
              <div className="text-[11px] text-foreground-muted uppercase tracking-wider mb-3">
                覆盖矩阵
              </div>
              <div className="space-y-3">
                {reviewSamplingStrategy.coverage.map((item) => (
                  <div key={item.id} className="space-y-1">
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-foreground">{item.label}</span>
                      <span className="text-foreground-light tabular-nums">
                        {Math.round(item.rate * 100)}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-300 overflow-hidden">
                      <div
                        className="h-full bg-brand-500"
                        style={{ width: `${Math.min(item.rate * 100, 100)}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-foreground-muted">{item.goal}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-md bg-surface-100 border border-border overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border bg-surface-75 text-[11px] font-medium text-foreground-muted uppercase tracking-wider">
              <div className="col-span-4">场景 / 触发</div>
              <div className="col-span-2">抽样率</div>
              <div className="col-span-3">优先级 / 状态</div>
              <div className="col-span-1">SLA</div>
              <div className="col-span-2">评审人</div>
            </div>
            {reviewSamplingStrategy.rules.map((rule) => {
              const priority = reviewPriorityConfig[rule.priority];
              const status = reviewStatusConfig[rule.status];

              return (
                <div
                  key={rule.id}
                  className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border last:border-b-0 hover:bg-surface-75 transition-colors"
                >
                  <div className="col-span-4">
                    <div className="text-[12px] font-medium text-foreground">{rule.scenario}</div>
                    <div className="text-[11px] text-foreground-muted">{rule.trigger}</div>
                    {rule.notes && (
                      <div className="text-[10px] text-warning mt-1">{rule.notes}</div>
                    )}
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="text-[12px] text-foreground-light tabular-nums">
                      {Math.round(rule.sampleRate * 100)}%
                    </span>
                  </div>
                  <div className="col-span-3 flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={cn("text-[10px]", priority.bgColor, priority.color)}
                    >
                      {priority.label}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className={cn("text-[10px]", status.bgColor, status.color)}
                    >
                      {status.label}
                    </Badge>
                  </div>
                  <div className="col-span-1 flex items-center">
                    <span className="text-[12px] text-foreground-light tabular-nums">
                      {rule.slaHours}h
                    </span>
                  </div>
                  <div className="col-span-2 text-[11px] text-foreground-muted">
                    {rule.reviewers.join(" / ")}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-md bg-surface-75/60 border border-border p-4">
            <div className="text-[11px] text-foreground-muted uppercase tracking-wider mb-3">
              评审清单
            </div>
            <div className="grid md:grid-cols-2 gap-2">
              {reviewSamplingStrategy.checklist.map((item) => (
                <div key={item.id} className="flex items-center gap-2 text-[12px] text-foreground-light">
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      item.required ? "bg-brand-500" : "bg-surface-300"
                    )}
                  />
                  <span>{item.label}</span>
                  {item.required && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] bg-brand-200 text-brand-500"
                    >
                      必选
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-foreground-muted">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              负责人：{reviewSamplingStrategy.owner}
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              升级阈值：{Math.round(reviewSamplingStrategy.escalationThreshold * 100)}%
            </span>
            <span className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              置信度门槛：{Math.round(reviewSamplingStrategy.confidenceGate * 100)}%
            </span>
          </div>
        </SettingsSection>

        <SettingsSection
          title="执行日志"
          description="最近执行的日志摘要与错误提示"
          compact
        >
          {recentExecutions.length === 0 ? (
            <div className="py-6 text-center text-[12px] text-foreground-muted">
              暂无执行日志，可先触发一次运行查看详细记录。
            </div>
          ) : (
            <div className="space-y-3">
              {recentExecutions.map((execution) => {
                const status = getStatusConfig(execution.status);
                const StatusIcon = status.icon;
                return (
                  <div
                    key={execution.id}
                    className="flex items-start justify-between gap-3 rounded-md border border-border bg-surface-75 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={cn("gap-1 text-[10px]", status.bgColor, status.color)}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </Badge>
                        <span className="text-[12px] text-foreground-light font-mono">
                          {execution.id.slice(0, 10)}...
                        </span>
                      </div>
                      <div className="mt-2 text-[11px] text-foreground-muted">
                        {execution.error_message || "执行正常，无错误日志。"}
                      </div>
                    </div>
                    <div className="text-[11px] text-foreground-light">
                      {formatDuration(execution.duration_ms)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SettingsSection>

        <SettingsSection
          title="节点状态"
          description="关键节点健康度与最近一次状态"
          compact
        >
          <div className="rounded-md bg-surface-100 border border-border overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border bg-surface-75 text-[11px] font-medium text-foreground-muted uppercase tracking-wider">
              <div className="col-span-4">节点</div>
              <div className="col-span-3">状态</div>
              <div className="col-span-5">说明</div>
            </div>
            {nodeStatusSamples.map((node) => {
              const status = getStatusConfig(node.status);
              const StatusIcon = status.icon;
              return (
                <div
                  key={node.id}
                  className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border last:border-b-0 hover:bg-surface-75 transition-colors"
                >
                  <div className="col-span-4 text-[12px] text-foreground">{node.label}</div>
                  <div className="col-span-3 flex items-center">
                    <Badge
                      variant="secondary"
                      className={cn("gap-1 text-[10px]", status.bgColor, status.color)}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </Badge>
                  </div>
                  <div className="col-span-5 text-[11px] text-foreground-muted">
                    {node.detail}
                  </div>
                </div>
              );
            })}
          </div>
        </SettingsSection>

        {/* 执行列表 */}
        <div className="mt-6">
          {/* 工具栏 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                <Input
                  placeholder="搜索执行 ID 或错误信息..."
                  value={executionQuery}
                  onChange={(event) => setExecutionQuery(event.target.value)}
                  className="pl-9 h-9 w-[240px] bg-surface-200 border-border text-foreground placeholder:text-foreground-muted focus:border-brand-400"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-9 bg-surface-75 border-border">
                  <SelectValue placeholder="状态筛选" />
                </SelectTrigger>
                <SelectContent className="bg-surface-100 border-border">
                  <SelectItem value="all">全部状态</SelectItem>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={nodeTypeFilter} onValueChange={setNodeTypeFilter}>
                <SelectTrigger className="w-[150px] h-9 bg-surface-75 border-border">
                  <SelectValue placeholder="节点类型" />
                </SelectTrigger>
                <SelectContent className="bg-surface-100 border-border">
                  {nodeTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={timeRangeFilter} onValueChange={setTimeRangeFilter}>
                <SelectTrigger className="w-[150px] h-9 bg-surface-75 border-border">
                  <SelectValue placeholder="时间范围" />
                </SelectTrigger>
                <SelectContent className="bg-surface-100 border-border">
                  {timeRangeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-[12px] text-foreground-muted">
              当前页 {filteredExecutions.length} 条 · 总计 {total} 条
            </div>
          </div>

          {actionError && (
            <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
              {actionError}
            </div>
          )}

          {/* 列表 */}
          <div className="rounded-md bg-surface-100 border border-border overflow-hidden">
            {/* 表头 */}
            <div className="grid grid-cols-[1.6fr_1fr_1fr_2.2fr_1fr_1.4fr] gap-4 px-4 py-3 border-b border-border bg-surface-75 text-[11px] font-medium text-foreground-muted uppercase tracking-wider">
              <div>执行 ID</div>
              <div>状态</div>
              <div>耗时</div>
              <div>错误</div>
              <div>触发类型</div>
              <div>时间</div>
            </div>

            {/* 执行记录 */}
            {filteredExecutions.length === 0 ? (
              <div className="py-12 text-center text-[13px] text-foreground-muted">
                暂无执行记录
              </div>
            ) : (
              filteredExecutions.map((execution) => {
                const status = getStatusConfig(execution.status);
                const StatusIcon = status.icon;
                const isActive = execution.id === activeExecutionId;

                return (
                  <div
                    key={execution.id}
                    className={cn(
                      "grid grid-cols-[1.6fr_1fr_1fr_2.2fr_1fr_1.4fr] gap-4 px-4 py-3 border-b border-border last:border-b-0 transition-colors cursor-pointer",
                      isActive ? "bg-surface-75" : "hover:bg-surface-75"
                    )}
                    onClick={() => setActiveExecutionId(execution.id)}
                  >
                    {/* 执行 ID */}
                    <div>
                      <span className="text-[12px] font-mono text-foreground-light">
                        {execution.id.slice(0, 8)}...
                      </span>
                    </div>

                    {/* 状态 */}
                    <div className="flex items-center">
                      <Badge
                        variant="secondary"
                        className={cn("gap-1 text-[10px]", status.bgColor, status.color)}
                      >
                        <StatusIcon className={cn("w-3 h-3", execution.status === "running" && "animate-spin")} />
                        {status.label}
                      </Badge>
                    </div>

                    {/* 时长 */}
                    <div className="flex items-center">
                      <span className="text-[12px] text-foreground-light">
                        {formatDuration(execution.duration_ms)}
                      </span>
                    </div>

                    {/* 错误 */}
                    <div className="flex items-center text-[11px] text-foreground-muted line-clamp-2">
                      {execution.error_message || "—"}
                    </div>

                    {/* 触发方式与操作 */}
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-foreground-muted">
                        {resolveTriggerType(execution)}
                      </span>
                      {(execution.status === "running" || execution.status === "pending") && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-[10px]"
                          disabled={cancelingExecutionId === execution.id}
                          onClick={() => handleCancelExecution(execution.id)}
                        >
                          {cancelingExecutionId === execution.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Pause className="w-3 h-3" />
                          )}
                          <span className="ml-1">停止</span>
                        </Button>
                      )}
                    </div>

                    {/* 时间 */}
                    <div className="flex items-center">
                      <span className="text-[12px] text-foreground-light">
                        {formatTime(execution.created_at)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-[12px] text-foreground-muted">
                第 {page} / {totalPages} 页
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                  className="h-8"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                  className="h-8"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          <SettingsSection
            title="执行详情"
            description="节点状态流、日志与输入输出快照"
            compact
          >
            {!activeExecution ? (
              <div className="py-6 text-center text-[12px] text-foreground-muted">
                请选择一条执行记录查看详情。
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="rounded-md border border-border bg-surface-75 px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wider text-foreground-muted">
                      执行 ID
                    </div>
                    <div className="mt-1 text-[12px] text-foreground font-mono">
                      {activeExecution.id.slice(0, 12)}...
                    </div>
                  </div>
                  <div className="rounded-md border border-border bg-surface-75 px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wider text-foreground-muted">
                      状态
                    </div>
                    <div className="mt-1">
                      {(() => {
                        const status = getStatusConfig(activeExecution.status);
                        const StatusIcon = status.icon;
                        return (
                          <Badge
                            variant="secondary"
                            className={cn("gap-1 text-[10px]", status.bgColor, status.color)}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </Badge>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="rounded-md border border-border bg-surface-75 px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wider text-foreground-muted">
                      触发类型
                    </div>
                    <div className="mt-1 text-[12px] text-foreground">
                      {resolveTriggerType(activeExecution)}
                    </div>
                  </div>
                  <div className="rounded-md border border-border bg-surface-75 px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wider text-foreground-muted">
                      耗时
                    </div>
                    <div className="mt-1 text-[12px] text-foreground">
                      {formatDuration(activeExecution.duration_ms)}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-md border border-border bg-surface-75 p-4">
                    <div className="text-[12px] font-medium text-foreground mb-2">
                      节点状态流
                    </div>
                    <div className="space-y-2">
                      {activeNodeFlow.map((node) => {
                        const status = getStatusConfig(node.status);
                        const StatusIcon = status.icon;
                        return (
                          <div key={node.id} className="flex items-center justify-between gap-3">
                            <div className="text-[12px] text-foreground">{node.label}</div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="secondary"
                                className={cn("gap-1 text-[10px]", status.bgColor, status.color)}
                              >
                                <StatusIcon className="w-3 h-3" />
                                {status.label}
                              </Badge>
                              <span className="text-[11px] text-foreground-muted">{node.detail}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-md border border-border bg-surface-75 p-4">
                    <div className="text-[12px] font-medium text-foreground mb-2">
                      执行日志
                    </div>
                    <div className="space-y-2 text-[11px] text-foreground-muted">
                      {buildExecutionLogs(activeExecution).map((line) => (
                        <div key={line}>{line}</div>
                      ))}
                      {activeExecution.error_message && (
                        <div className="text-destructive">错误：{activeExecution.error_message}</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-md border border-border bg-surface-75 p-4">
                    <div className="text-[12px] font-medium text-foreground mb-2">
                      输入快照
                    </div>
                    <pre className="rounded-md bg-surface-200/70 border border-border px-3 py-2 text-[11px] text-foreground-muted whitespace-pre-wrap font-mono">
                      {JSON.stringify(activeExecution.inputs || {}, null, 2)}
                    </pre>
                  </div>
                  <div className="rounded-md border border-border bg-surface-75 p-4">
                    <div className="text-[12px] font-medium text-foreground mb-2">
                      输出快照
                    </div>
                    <pre className="rounded-md bg-surface-200/70 border border-border px-3 py-2 text-[11px] text-foreground-muted whitespace-pre-wrap font-mono">
                      {JSON.stringify(activeExecution.outputs || {}, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </SettingsSection>
        </div>
        </PageContainer>
      </PageWithSidebar>
    </AppAccessGate>
  );
}

// 指标卡片组件
function MetricCard({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="p-4 rounded-md bg-surface-75">
      <div className="flex items-center gap-2 mb-2">
        <div className="text-foreground-muted">{icon}</div>
        <span className="text-[11px] text-foreground-light">{label}</span>
      </div>
      <div className={cn("text-xl font-semibold", highlight ? "text-warning" : "text-foreground")}>
        {value}
      </div>
    </div>
  );
}
