"use client";

/**
 * 使用统计分析页面
 * 展示用户使用数据、趋势分析、资源消耗等
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageContainer, PageHeader } from "@/components/dashboard/page-layout";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  Calendar,
  ChevronDown,
  Clock,
  Coins,
  Download,
  MessageSquare,
  RefreshCw,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SimpleBarChart,
  ComparisonBar,
  SimpleLineChart,
  SimplePieChart,
  Sparkline,
} from "@/components/charts/simple-charts";

// 时间范围选项
const timeRanges = [
  { id: "7d", label: "最近 7 天" },
  { id: "30d", label: "最近 30 天" },
  { id: "90d", label: "最近 90 天" },
  { id: "12m", label: "最近 12 个月" },
];

const toneStyles = {
  brand: {
    iconBg: "bg-brand-200/60",
    icon: "text-brand-500",
    sparkline: "stroke-brand-500",
  },
  warning: {
    iconBg: "bg-warning-200/60",
    icon: "text-warning",
    sparkline: "stroke-warning",
  },
  neutral: {
    iconBg: "bg-surface-200",
    icon: "text-foreground-light",
    sparkline: "stroke-foreground-light",
  },
} as const;

// 模拟统计数据 - Supabase 风格
const overviewStats = [
  {
    id: "conversations",
    label: "对话总数",
    value: "2,847",
    change: 12.5,
    trend: "up" as const,
    icon: MessageSquare,
    tone: "brand" as const,
    sparkline: [30, 45, 38, 52, 48, 65, 72],
  },
  {
    id: "workflows",
    label: "工作流运行",
    value: "1,256",
    change: 8.3,
    trend: "up" as const,
    icon: Zap,
    tone: "warning" as const,
    sparkline: [20, 35, 28, 42, 38, 55, 62],
  },
  {
    id: "agents",
    label: "活跃 Agent",
    value: "23",
    change: -2.1,
    trend: "down" as const,
    icon: Bot,
    tone: "neutral" as const,
    sparkline: [15, 18, 22, 19, 25, 23, 21],
  },
  {
    id: "tokens",
    label: "Token 消耗",
    value: "1.2M",
    change: 15.7,
    trend: "up" as const,
    icon: Coins,
    tone: "brand" as const,
    sparkline: [45, 52, 48, 65, 72, 85, 92],
  },
];

// 使用趋势数据
const usageTrendData = [
  { label: "1月", value: 1200 },
  { label: "2月", value: 1450 },
  { label: "3月", value: 1380 },
  { label: "4月", value: 1650 },
  { label: "5月", value: 1820 },
  { label: "6月", value: 2100 },
  { label: "7月", value: 2350 },
];

// Token 使用分布
const tokenDistribution = [
  { label: "GPT-4", value: 45, color: "text-brand-500" },
  { label: "Claude 3", value: 30, color: "text-foreground-light" },
  { label: "GPT-3.5", value: 15, color: "text-foreground-muted" },
  { label: "其他", value: 10, color: "text-foreground-lighter" },
];

// 功能使用排名
const featureUsage = [
  { name: "智能对话", usage: 2847, change: 12.5 },
  { name: "工作流自动化", usage: 1256, change: 8.3 },
  { name: "文档分析", usage: 892, change: 15.2 },
  { name: "代码生成", usage: 654, change: -3.1 },
  { name: "数据处理", usage: 423, change: 22.8 },
];

// 每日使用数据
const dailyUsage = [
  { day: "周一", conversations: 420, workflows: 180 },
  { day: "周二", conversations: 380, workflows: 165 },
  { day: "周三", conversations: 450, workflows: 210 },
  { day: "周四", conversations: 520, workflows: 245 },
  { day: "周五", conversations: 480, workflows: 220 },
  { day: "周六", conversations: 280, workflows: 120 },
  { day: "周日", conversations: 250, workflows: 95 },
];

// 最近活动
const recentActivities = [
  { type: "conversation", title: "产品需求讨论", time: "5分钟前", tokens: 1250 },
  { type: "workflow", title: "邮件自动分类", time: "12分钟前", tokens: 850 },
  { type: "agent", title: "写作助手对话", time: "25分钟前", tokens: 2100 },
  { type: "conversation", title: "技术方案评审", time: "1小时前", tokens: 1800 },
  { type: "workflow", title: "数据同步任务", time: "2小时前", tokens: 450 },
] as const;

const optimizationTips = [
  {
    title: "使用 GPT-3.5 处理简单任务",
    description: "预计可节省 25% Token 消耗",
    impact: "成本优化",
  },
  {
    title: "启用工作流缓存",
    description: "减少重复计算，提升 40% 速度",
    impact: "性能提升",
  },
  {
    title: "优化提示词长度",
    description: "精简提示词可节省 15% 成本",
    impact: "效率提升",
  },
];

const usageHighlights = [
  {
    label: "本月成本",
    value: "¥1,284",
    change: 12.4,
  },
  {
    label: "活跃天数",
    value: "19/30",
    change: 4.3,
  },
  {
    label: "自动化节省",
    value: "¥312",
    change: -8.1,
  },
];

const usageBudget = {
  used: 1284,
  limit: 2000,
};

const breakdownTabs = [
  {
    id: "conversations",
    label: "对话",
    description: "对话请求在不同场景中的分布",
    bars: [
      { label: "产品", value: 520 },
      { label: "写作", value: 420 },
      { label: "代码", value: 360 },
      { label: "数据", value: 280 },
      { label: "研究", value: 210 },
    ],
    segments: [
      { label: "高频会话", value: 42 },
      { label: "长会话", value: 28 },
      { label: "自动摘要", value: 18 },
      { label: "低峰时段", value: 12 },
    ],
    kpis: [
      { label: "平均响应", value: "2.4s", change: -6.4 },
      { label: "满意度", value: "92%", change: 1.8 },
      { label: "复用率", value: "38%", change: 4.1 },
    ],
  },
  {
    id: "workflows",
    label: "工作流",
    description: "自动化任务的触发与完成情况",
    bars: [
      { label: "营销", value: 320 },
      { label: "数据", value: 280 },
      { label: "报告", value: 210 },
      { label: "客服", value: 160 },
      { label: "运维", value: 110 },
    ],
    segments: [
      { label: "成功执行", value: 86 },
      { label: "等待审批", value: 9 },
      { label: "失败重试", value: 5 },
    ],
    kpis: [
      { label: "平均耗时", value: "3.1m", change: -12.2 },
      { label: "成功率", value: "94%", change: 2.7 },
      { label: "节省时长", value: "18h", change: 6.9 },
    ],
  },
  {
    id: "costs",
    label: "成本",
    description: "Token 使用与成本驱动来源",
    bars: [
      { label: "GPT-4", value: 540 },
      { label: "Claude 3", value: 360 },
      { label: "GPT-3.5", value: 210 },
      { label: "其他", value: 120 },
    ],
    segments: [
      { label: "高成本会话", value: 44 },
      { label: "批量任务", value: 31 },
      { label: "缓存命中", value: 17 },
      { label: "非工作时段", value: 8 },
    ],
    kpis: [
      { label: "单次成本", value: "¥0.42", change: -4.8 },
      { label: "本月预算", value: "64%", change: 8.3 },
      { label: "可节省", value: "¥128", change: -6.1 },
    ],
  },
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30d");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const selectedRange = timeRanges.find((range) => range.id === timeRange);

  const peakPoint = usageTrendData.reduce((max, item) =>
    item.value > max.value ? item : max
  );
  const averageUsage = Math.round(
    usageTrendData.reduce((sum, item) => sum + item.value, 0) /
      usageTrendData.length
  );
  const growthRate =
    ((usageTrendData[usageTrendData.length - 1].value - usageTrendData[0].value) /
      usageTrendData[0].value) *
    100;

  const avgConversations = Math.round(
    dailyUsage.reduce((sum, item) => sum + item.conversations, 0) /
      dailyUsage.length
  );
  const avgWorkflows = Math.round(
    dailyUsage.reduce((sum, item) => sum + item.workflows, 0) /
      dailyUsage.length
  );
  const totalConversations = dailyUsage.reduce(
    (sum, item) => sum + item.conversations,
    0
  );
  const totalWorkflows = dailyUsage.reduce(
    (sum, item) => sum + item.workflows,
    0
  );
  const peakDay = dailyUsage.reduce((max, item) =>
    item.conversations > max.conversations ? item : max
  );

  const activityStyles = {
    conversation: {
      icon: MessageSquare,
      bg: "bg-surface-200",
      iconColor: "text-foreground-light",
      label: "对话",
      badgeVariant: "secondary",
    },
    workflow: {
      icon: Zap,
      bg: "bg-brand-200/60",
      iconColor: "text-brand-500",
      label: "工作流",
      badgeVariant: "success",
    },
    agent: {
      icon: Bot,
      bg: "bg-surface-200",
      iconColor: "text-foreground-light",
      label: "Agent",
      badgeVariant: "outline",
    },
  } as const;

  return (
    <PageContainer>
      <div className="page-section">
        <div className="space-y-3">
          <div className="page-caption">Analytics</div>
          <PageHeader
            title="使用统计"
            description="追踪您的使用情况、成本变化与工作流效率，快速定位高消耗节点并优化资源分配。"
            className="mb-0"
            actions={(
              <div className="flex flex-wrap items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 border-border/80 text-foreground-light hover:text-foreground"
                    >
                      <Calendar className="w-4 h-4" />
                      {selectedRange?.label}
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="bg-surface-100 border-border"
                  >
                    {timeRanges.map((range) => (
                      <DropdownMenuItem
                        key={range.id}
                        onClick={() => setTimeRange(range.id)}
                        className="text-foreground-light hover:text-foreground hover:bg-surface-200"
                      >
                        {range.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  className="border-border/80 text-foreground-light hover:text-foreground"
                >
                  <RefreshCw
                    className={cn("w-4 h-4", isRefreshing && "animate-spin")}
                  />
                  刷新
                </Button>

                <Button variant="secondary" size="sm">
                  <Download className="w-4 h-4" />
                  导出报告
                </Button>
              </div>
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                size="xs"
                className="border-border/70 text-foreground-light"
              >
                实时
              </Badge>
            </div>
          </PageHeader>
        </div>

      <div className="page-divider" />

      <div className="page-panel">
        <div className="page-panel-header flex items-center justify-between">
          <div>
            <h2 className="page-panel-title">使用概览</h2>
            <p className="page-panel-description">成本与活跃度快照</p>
          </div>
          <Badge
            variant="secondary"
            className="bg-surface-200 text-foreground-muted text-[11px]"
          >
            最近 {selectedRange?.label}
          </Badge>
        </div>
        <div className="p-5">
          <div className="page-grid md:grid-cols-3 md:gap-0 md:divide-x md:divide-border">
            {usageHighlights.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between md:px-4 first:md:pl-0 last:md:pr-0"
              >
                <div>
                  <p className="page-caption">{item.label}</p>
                  <p className="text-sm font-medium text-foreground tabular-nums">
                    {item.value}
                  </p>
                </div>
                <Badge
                  variant={item.change >= 0 ? "success" : "error"}
                  size="sm"
                  className="text-[10px]"
                >
                  {item.change >= 0 ? "+" : ""}
                  {item.change}%
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 概览 */}
      <div className="page-panel">
        <div className="page-panel-header flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="page-panel-title">概览</p>
            <p className="page-panel-description">
              最近 {selectedRange?.label} 内的关键指标
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-foreground-light">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-500" />
              实时监控
            </span>
            <span>更新于 2 分钟前</span>
          </div>
        </div>
        <div className="p-6">
          <div className="page-grid md:grid-cols-2 lg:grid-cols-4">
            {overviewStats.map((stat) => {
              const Icon = stat.icon;
              const tone = toneStyles[stat.tone];
              const TrendIcon = stat.trend === "up" ? ArrowUpRight : ArrowDownRight;

              return (
                <div
                  key={stat.id}
                  className="rounded-md border border-border bg-surface-100 p-4 transition-supabase hover:border-border-strong"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "h-9 w-9 rounded-md flex items-center justify-center",
                          tone.iconBg
                        )}
                      >
                        <Icon className={cn("w-4 h-4", tone.icon)} />
                      </div>
                      <div>
                        <p className="text-xs text-foreground-light">
                          {stat.label}
                        </p>
                        <p className="text-stat-number text-foreground tabular-nums">
                          {stat.value}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={stat.trend === "up" ? "success" : "error"}
                      size="sm"
                      className="text-[11px]"
                    >
                      <TrendIcon className="w-3 h-3" />
                      {Math.abs(stat.change)}%
                    </Badge>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-foreground-muted">
                    <span>较上期</span>
                    <Sparkline
                      data={stat.sparkline}
                      color={tone.sparkline}
                      width={110}
                      height={26}
                      showDot={false}
                      className="opacity-90"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="page-grid lg:grid-cols-3">
        <div className="page-panel lg:col-span-2">
          <div className="page-panel-header flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="page-panel-title flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-500" />
                使用趋势
              </p>
              <p className="page-panel-description">
                {selectedRange?.label} 内的对话量变化
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-foreground-light">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-500" />
                对话量
              </span>
              <span className="text-foreground-muted">
                平均 {averageUsage.toLocaleString()} / 月
              </span>
            </div>
          </div>
          <div className="p-6 pt-4">
            <SimpleLineChart
              data={usageTrendData}
              height={260}
              strokeColor="stroke-brand-500"
              fillColor="fill-brand-500/10"
              showDots={false}
              showGrid
            />
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-md bg-surface-75 px-3 py-2">
                <p className="page-caption">峰值</p>
                <p className="text-sm font-medium text-foreground tabular-nums">
                  {peakPoint.value.toLocaleString()} · {peakPoint.label}
                </p>
              </div>
              <div className="rounded-md bg-surface-75 px-3 py-2">
                <p className="page-caption">增长</p>
                <p
                  className={cn(
                    "text-sm font-medium",
                    growthRate >= 0 ? "text-brand-500" : "text-destructive"
                  )}
                >
                  {growthRate >= 0 ? "+" : ""}
                  {growthRate.toFixed(1)}%
                </p>
              </div>
              <div className="rounded-md bg-surface-75 px-3 py-2">
                <p className="page-caption">最近</p>
                <p className="text-sm font-medium text-foreground tabular-nums">
                  {usageTrendData[
                    usageTrendData.length - 1
                  ].value.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="page-panel">
          <div className="page-panel-header">
            <p className="page-panel-title flex items-center gap-2">
              <Coins className="w-4 h-4 text-brand-500" />
              Token 使用分布
            </p>
            <p className="page-panel-description">模型占比与成本权重</p>
          </div>
          <div className="p-6">
            <div className="flex justify-center">
              <SimplePieChart
                data={tokenDistribution}
                size={170}
                donut
                showLegend={false}
              />
            </div>
            <div className="mt-6 space-y-3">
              {tokenDistribution.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="flex items-center gap-2 text-foreground">
                    <span
                      className={cn(
                        "w-2.5 h-2.5 rounded-full bg-current",
                        item.color
                      )}
                    />
                    {item.label}
                  </span>
                  <span className="text-foreground-light tabular-nums">
                    {item.value}%
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-md border border-border/70 bg-surface-75 px-3 py-3">
              <div className="flex items-center justify-between text-xs text-foreground-light">
                <span>本月预算</span>
                <span className="tabular-nums">
                  ¥{usageBudget.used} / ¥{usageBudget.limit}
                </span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-surface-300 overflow-hidden">
                <div
                  className="h-full bg-brand-500"
                  style={{
                    width: `${Math.min(
                      (usageBudget.used / usageBudget.limit) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="conversations" className="w-full">
        <div className="page-panel">
          <div className="page-panel-header flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="page-panel-title">使用分解</p>
              <p className="page-panel-description">
                追踪不同场景下的使用占比与结构变化
              </p>
            </div>
            <TabsList
              variant="underline"
              size="sm"
              className="w-full lg:w-auto justify-start"
            >
              {breakdownTabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  variant="underline"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <div className="p-6">
            {breakdownTabs.map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className="mt-0">
                <div className="page-grid lg:grid-cols-[1.4fr_1fr]">
                  <div>
                    <p className="text-xs text-foreground-light mb-3">
                      {tab.description}
                    </p>
                    <SimpleBarChart
                      data={tab.bars.map((item) => ({
                        ...item,
                        color: "bg-brand-500",
                      }))}
                      height={180}
                      showValues={false}
                    />
                    <div className="mt-4 page-grid md:grid-cols-3">
                      {tab.kpis.map((kpi) => (
                        <div
                          key={kpi.label}
                          className="rounded-md bg-surface-75 px-3 py-2"
                        >
                          <p className="page-caption">{kpi.label}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground tabular-nums">
                              {kpi.value}
                            </span>
                            <Badge
                              variant={kpi.change >= 0 ? "success" : "error"}
                              size="xs"
                              className="text-[10px]"
                            >
                              {kpi.change >= 0 ? "+" : ""}
                              {kpi.change}%
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="page-caption">细分占比</p>
                    {tab.segments.map((segment) => (
                      <div
                        key={segment.label}
                        className="rounded-md border border-border/70 bg-surface-75 px-3 py-2"
                      >
                        <div className="flex items-center justify-between text-xs text-foreground-light">
                          <span>{segment.label}</span>
                          <span className="tabular-nums">
                            {segment.value}%
                          </span>
                        </div>
                        <div className="mt-2 h-1 rounded-full bg-surface-300 overflow-hidden">
                          <div
                            className="h-full bg-brand-500"
                            style={{ width: `${segment.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            ))}
          </div>
        </div>
      </Tabs>

      {/* 功能使用与每日统计 */}
      <div className="page-grid lg:grid-cols-2">
        <div className="page-panel">
          <div className="page-panel-header">
            <p className="page-panel-title flex items-center gap-2">
              <Target className="w-4 h-4 text-foreground-light" />
              功能使用排名
            </p>
            <p className="page-panel-description">
              最近 {selectedRange?.label} 的使用热度
            </p>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between pb-3 border-b border-border text-table-header">
              <span>功能</span>
              <span>使用次数</span>
              <span>变化</span>
            </div>
            <div className="divide-y divide-border">
              {featureUsage.map((feature, index) => (
                <div
                  key={feature.name}
                  className="flex items-center gap-4 py-3"
                >
                  <span className="w-6 text-xs text-foreground-muted text-center">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground">
                        {feature.name}
                      </span>
                      <span className="text-xs text-foreground-light tabular-nums">
                        {feature.usage.toLocaleString()} 次
                      </span>
                    </div>
                    <div className="h-1.5 bg-surface-300 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full"
                        style={{
                          width: `${(feature.usage / featureUsage[0].usage) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <Badge
                    variant={feature.change >= 0 ? "success" : "error"}
                    size="sm"
                    className="text-[11px] tabular-nums"
                  >
                    {feature.change >= 0 ? "+" : ""}
                    {feature.change}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="page-panel">
          <div className="page-panel-header">
            <p className="page-panel-title flex items-center gap-2">
              <Calendar className="w-4 h-4 text-foreground-light" />
              每日使用统计
            </p>
            <p className="page-panel-description">过去一周的使用密度</p>
          </div>
          <div className="p-6">
            <SimpleBarChart
              data={dailyUsage.map((item) => ({
                label: item.day,
                value: item.conversations,
                color: "bg-brand-500",
              }))}
              height={220}
              showValues={false}
            />
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-md bg-surface-75 px-3 py-2">
                <p className="page-caption">日均对话</p>
                <p className="text-sm font-medium text-foreground tabular-nums">
                  {avgConversations}
                </p>
              </div>
              <div className="rounded-md bg-surface-75 px-3 py-2">
                <p className="page-caption">日均工作流</p>
                <p className="text-sm font-medium text-foreground tabular-nums">
                  {avgWorkflows}
                </p>
              </div>
              <div className="rounded-md bg-surface-75 px-3 py-2">
                <p className="page-caption">峰值日</p>
                <p className="text-sm font-medium text-foreground tabular-nums">
                  {peakDay.day} · {peakDay.conversations}
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-md border border-border/70 bg-surface-75 px-3 py-3">
              <div className="flex items-center justify-between text-xs text-foreground-muted">
                <span>对话 / 工作流</span>
                <span className="tabular-nums">
                  {totalConversations.toLocaleString()} /{" "}
                  {totalWorkflows.toLocaleString()}
                </span>
              </div>
              <div className="mt-2">
                <ComparisonBar
                  value1={totalConversations}
                  value2={totalWorkflows}
                  label1="对话"
                  label2="工作流"
                  color1="bg-brand-500"
                  color2="bg-surface-300"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 最近活动 */}
      <div className="page-panel">
        <div className="page-panel-header">
          <p className="page-panel-title flex items-center gap-2">
            <Clock className="w-4 h-4 text-warning" />
            最近活动
          </p>
          <p className="page-panel-description">最近 2 小时内的高频动作</p>
        </div>
        <div className="px-6 pt-3 pb-2 flex items-center justify-between border-b border-border text-table-header">
          <span>活动</span>
          <span>消耗</span>
        </div>
        <div className="divide-y divide-border">
          {recentActivities.map((activity, index) => {
            const activityStyle = activityStyles[activity.type];
            const ActivityIcon = activityStyle.icon;

            return (
              <div
                key={index}
                className="flex items-center justify-between px-6 py-4 hover:bg-surface-75 transition-supabase"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "h-9 w-9 rounded-md flex items-center justify-center",
                      activityStyle.bg
                    )}
                  >
                    <ActivityIcon
                      className={cn("w-4 h-4", activityStyle.iconColor)}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {activity.title}
                      </p>
                      <Badge
                        variant={activityStyle.badgeVariant}
                        size="xs"
                        className="text-[10px]"
                      >
                        {activityStyle.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-foreground-muted">
                      {activity.time}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  size="sm"
                  className="text-[11px] tabular-nums"
                >
                  <Coins className="w-3 h-3" />
                  {activity.tokens.toLocaleString()} tokens
                </Badge>
              </div>
            );
          })}
        </div>
      </div>

      {/* 使用建议 */}
      <div className="page-panel border-brand-400/30 bg-brand-200/40">
        <div className="page-panel-header border-b border-brand-400/20 bg-transparent">
          <p className="page-panel-title flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-500" />
            使用优化建议
          </p>
          <p className="page-panel-description">
            基于您的使用模式，我们发现以下优化机会
          </p>
        </div>
        <div className="p-6">
          <div className="page-grid md:grid-cols-3">
            {optimizationTips.map((tip) => (
              <div
                key={tip.title}
                className="rounded-md border border-border/70 bg-surface-100/60 p-4"
              >
                <p className="text-xs text-foreground-muted mb-2">
                  {tip.impact}
                </p>
                <p className="text-sm font-medium text-foreground mb-1">
                  {tip.title}
                </p>
                <p className="text-xs text-foreground-light">
                  {tip.description}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-foreground-light">
            <span>预计可节省 15% - 25% 成本</span>
            <Button variant="outline-primary" size="sm">
              查看详细建议
            </Button>
          </div>
        </div>
      </div>
      </div>
    </PageContainer>
  );
}
