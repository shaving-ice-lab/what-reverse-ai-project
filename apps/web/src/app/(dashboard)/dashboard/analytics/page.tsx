"use client";

/**
 * 使用统计分析页面 - Supabase Dashboard 风格
 * 带二级侧边栏导航的分析页面
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PageWithSidebar,
  SidebarNavGroup,
  SidebarNavItem,
  CategoryHeader,
} from "@/components/dashboard/page-layout";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  ChevronDown,
  Coins,
  Download,
  RefreshCw,
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

// 侧边栏导航结构
const navGroups = [
  {
    title: "OVERVIEW",
    items: [
      { id: "overview", label: "概览", href: "#overview" },
      { id: "highlights", label: "使用快照", href: "#highlights" },
    ],
  },
  {
    title: "ANALYTICS",
    items: [
      { id: "trends", label: "使用趋势", href: "#trends" },
      { id: "distribution", label: "模型分布", href: "#distribution" },
      { id: "breakdown", label: "使用分解", href: "#breakdown" },
    ],
  },
  {
    title: "DETAILS",
    items: [
      { id: "features", label: "功能排名", href: "#features" },
      { id: "daily", label: "每日统计", href: "#daily" },
      { id: "activities", label: "最近活动", href: "#activities" },
    ],
  },
  {
    title: "INSIGHTS",
    items: [{ id: "tips", label: "优化建议", href: "#tips" }],
  },
];

// 时间范围选项
const timeRanges = [
  { id: "7d", label: "最近 7 天" },
  { id: "30d", label: "最近 30 天" },
  { id: "90d", label: "最近 90 天" },
  { id: "12m", label: "最近 12 个月" },
];

// 模拟统计数据 - 简化版
const overviewStats = [
  {
    id: "conversations",
    label: "对话总数",
    value: "2,847",
    change: 12.5,
    trend: "up" as const,
    sparkline: [30, 45, 38, 52, 48, 65, 72],
  },
  {
    id: "workflows",
    label: "工作流运行",
    value: "1,256",
    change: 8.3,
    trend: "up" as const,
    sparkline: [20, 35, 28, 42, 38, 55, 62],
  },
  {
    id: "agents",
    label: "活跃 Agent",
    value: "23",
    change: -2.1,
    trend: "down" as const,
    sparkline: [15, 18, 22, 19, 25, 23, 21],
  },
  {
    id: "tokens",
    label: "Token 消耗",
    value: "1.2M",
    change: 15.7,
    trend: "up" as const,
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
  { label: "本月成本", value: "¥1,284", change: 12.4 },
  { label: "活跃天数", value: "19/30", change: 4.3 },
  { label: "自动化节省", value: "¥312", change: -8.1 },
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

// 活动类型样式
const activityTypeLabels = {
  conversation: "对话",
  workflow: "工作流",
  agent: "Agent",
} as const;

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30d");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");

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
    ((usageTrendData[usageTrendData.length - 1].value -
      usageTrendData[0].value) /
      usageTrendData[0].value) *
    100;

  const avgConversations = Math.round(
    dailyUsage.reduce((sum, item) => sum + item.conversations, 0) /
      dailyUsage.length
  );
  const avgWorkflows = Math.round(
    dailyUsage.reduce((sum, item) => sum + item.workflows, 0) / dailyUsage.length
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

  // 侧边栏内容
  const sidebar = (
    <nav className="space-y-1">
      {navGroups.map((group) => (
        <SidebarNavGroup key={group.title} title={group.title}>
          {group.items.map((item) => (
            <SidebarNavItem
              key={item.id}
              href={item.href}
              label={item.label}
              active={activeSection === item.id}
            />
          ))}
        </SidebarNavGroup>
      ))}
    </nav>
  );

  return (
    <PageWithSidebar
      sidebar={sidebar}
      sidebarTitle="Analytics"
      sidebarWidth="narrow"
    >
      <div className="space-y-6 max-w-[960px]">
        {/* 页面头部 */}
        <div className="space-y-1">
          <h1 className="text-xl font-medium text-foreground">使用统计</h1>
          <p className="text-[13px] text-foreground-light">
            追踪您的使用情况、成本变化与工作流效率
          </p>
        </div>

        {/* 工具栏 */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
          <div className="flex items-center gap-2 text-xs text-foreground-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            <span>实时监控</span>
            <span className="text-foreground-lighter">·</span>
            <span>更新于 2 分钟前</span>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-[12px] border-border text-foreground-light hover:text-foreground hover:bg-surface-100/60"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  {selectedRange?.label}
                  <ChevronDown className="w-3.5 h-3.5" />
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
                    className="text-[12px] text-foreground-light hover:text-foreground hover:bg-surface-100/60"
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
              className="h-8 gap-1.5 text-[12px] border-border text-foreground-light hover:text-foreground hover:bg-surface-100/60"
            >
              <RefreshCw
                className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")}
              />
              刷新
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-[12px] border-border text-foreground-light hover:text-foreground hover:bg-surface-100/60"
            >
              <Download className="w-3.5 h-3.5" />
              导出
            </Button>
          </div>
        </div>

        {/* 使用快照 */}
        <section id="highlights" className="space-y-3">
          <CategoryHeader>使用快照</CategoryHeader>
          <div className="rounded-md border border-border bg-surface-100 p-4">
            <div className="grid grid-cols-3 gap-0 divide-x divide-border">
              {usageHighlights.map((item) => (
                <div key={item.label} className="px-4 first:pl-0 last:pr-0">
                  <p className="text-[11px] text-foreground-muted uppercase tracking-wide mb-1">
                    {item.label}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground tabular-nums">
                      {item.value}
                    </p>
                    <span
                      className={cn(
                        "text-[11px] tabular-nums",
                        item.change >= 0
                          ? "text-brand-500"
                          : "text-destructive"
                      )}
                    >
                      {item.change >= 0 ? "+" : ""}
                      {item.change}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 概览统计 */}
        <section id="overview" className="space-y-3">
          <CategoryHeader>概览</CategoryHeader>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {overviewStats.map((stat) => {
              const TrendIcon =
                stat.trend === "up" ? ArrowUpRight : ArrowDownRight;
              return (
                <div
                  key={stat.id}
                  className="rounded-md border border-border bg-surface-100 p-4 transition-colors hover:border-border-strong"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-[11px] text-foreground-muted uppercase tracking-wide">
                        {stat.label}
                      </p>
                      <p className="text-lg font-semibold text-foreground tabular-nums mt-0.5">
                        {stat.value}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "flex items-center text-[11px] tabular-nums",
                        stat.trend === "up"
                          ? "text-brand-500"
                          : "text-destructive"
                      )}
                    >
                      <TrendIcon className="w-3 h-3" />
                      {Math.abs(stat.change)}%
                    </span>
                  </div>
                  <Sparkline
                    data={stat.sparkline}
                    color="stroke-brand-500"
                    width={100}
                    height={24}
                    showDot={false}
                    className="opacity-70"
                  />
                </div>
              );
            })}
          </div>
        </section>

        {/* 使用趋势 */}
        <section id="trends" className="space-y-3">
          <div className="flex items-center justify-between">
            <CategoryHeader>使用趋势</CategoryHeader>
            <div className="flex items-center gap-3 text-[11px] text-foreground-muted">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                对话量
              </span>
              <span>平均 {averageUsage.toLocaleString()} / 月</span>
            </div>
          </div>
          <div className="rounded-md border border-border bg-surface-100 p-5">
            <SimpleLineChart
              data={usageTrendData}
              height={220}
              strokeColor="stroke-brand-500"
              fillColor="fill-brand-500/10"
              showDots={false}
              showGrid
            />
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-md bg-surface-75 px-3 py-2">
                <p className="text-[11px] text-foreground-muted uppercase tracking-wide">
                  峰值
                </p>
                <p className="text-sm font-medium text-foreground tabular-nums">
                  {peakPoint.value.toLocaleString()} · {peakPoint.label}
                </p>
              </div>
              <div className="rounded-md bg-surface-75 px-3 py-2">
                <p className="text-[11px] text-foreground-muted uppercase tracking-wide">
                  增长
                </p>
                <p
                  className={cn(
                    "text-sm font-medium tabular-nums",
                    growthRate >= 0 ? "text-brand-500" : "text-destructive"
                  )}
                >
                  {growthRate >= 0 ? "+" : ""}
                  {growthRate.toFixed(1)}%
                </p>
              </div>
              <div className="rounded-md bg-surface-75 px-3 py-2">
                <p className="text-[11px] text-foreground-muted uppercase tracking-wide">
                  最近
                </p>
                <p className="text-sm font-medium text-foreground tabular-nums">
                  {usageTrendData[usageTrendData.length - 1].value.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 模型分布 */}
        <section id="distribution" className="space-y-3">
          <CategoryHeader>模型分布</CategoryHeader>
          <div className="rounded-md border border-border bg-surface-100 p-5">
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="flex justify-center">
                <SimplePieChart
                  data={tokenDistribution}
                  size={160}
                  donut
                  showLegend={false}
                />
              </div>
              <div className="space-y-3">
                {tokenDistribution.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between text-[12px]"
                  >
                    <span className="flex items-center gap-2 text-foreground">
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full bg-current",
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
                <div className="pt-3 mt-3 border-t border-border">
                  <div className="flex items-center justify-between text-[11px] text-foreground-muted mb-2">
                    <span>本月预算</span>
                    <span className="tabular-nums">
                      ¥{usageBudget.used} / ¥{usageBudget.limit}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-300 overflow-hidden">
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
        </section>

        {/* 使用分解 */}
        <section id="breakdown" className="space-y-3">
          <CategoryHeader>使用分解</CategoryHeader>
          <Tabs defaultValue="conversations" className="w-full">
            <div className="rounded-md border border-border bg-surface-100">
              <div className="px-5 pt-4 pb-0 border-b border-border">
                <TabsList
                  variant="underline"
                  size="sm"
                  className="w-full justify-start"
                >
                  {breakdownTabs.map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      variant="underline"
                      className="text-[12px]"
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              <div className="p-5">
                {breakdownTabs.map((tab) => (
                  <TabsContent key={tab.id} value={tab.id} className="mt-0">
                    <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
                      <div>
                        <p className="text-[12px] text-foreground-light mb-3">
                          {tab.description}
                        </p>
                        <SimpleBarChart
                          data={tab.bars.map((item) => ({
                            ...item,
                            color: "bg-brand-500",
                          }))}
                          height={160}
                          showValues={false}
                        />
                        <div className="mt-4 grid grid-cols-3 gap-3">
                          {tab.kpis.map((kpi) => (
                            <div
                              key={kpi.label}
                              className="rounded-md bg-surface-75 px-3 py-2"
                            >
                              <p className="text-[11px] text-foreground-muted uppercase tracking-wide">
                                {kpi.label}
                              </p>
                              <div className="flex items-center justify-between mt-0.5">
                                <span className="text-sm font-medium text-foreground tabular-nums">
                                  {kpi.value}
                                </span>
                                <span
                                  className={cn(
                                    "text-[10px] tabular-nums",
                                    kpi.change >= 0
                                      ? "text-brand-500"
                                      : "text-destructive"
                                  )}
                                >
                                  {kpi.change >= 0 ? "+" : ""}
                                  {kpi.change}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[11px] text-foreground-muted uppercase tracking-wide mb-2">
                          细分占比
                        </p>
                        {tab.segments.map((segment) => (
                          <div
                            key={segment.label}
                            className="rounded-md bg-surface-75 px-3 py-2"
                          >
                            <div className="flex items-center justify-between text-[12px] text-foreground-light mb-1.5">
                              <span>{segment.label}</span>
                              <span className="tabular-nums">{segment.value}%</span>
                            </div>
                            <div className="h-1 rounded-full bg-surface-300 overflow-hidden">
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
        </section>

        {/* 功能排名与每日统计 */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* 功能排名 */}
          <section id="features" className="space-y-3">
            <CategoryHeader>功能排名</CategoryHeader>
            <div className="rounded-md border border-border bg-surface-100">
              <div className="px-4 py-2.5 border-b border-border flex items-center justify-between text-[11px] text-foreground-muted uppercase tracking-wide">
                <span>功能</span>
                <span>变化</span>
              </div>
              <div className="divide-y divide-border">
                {featureUsage.map((feature, index) => (
                  <div
                    key={feature.name}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-surface-100/60 transition-colors"
                  >
                    <span className="w-5 text-[11px] text-foreground-muted text-center tabular-nums">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] font-medium text-foreground truncate">
                          {feature.name}
                        </span>
                        <span className="text-[11px] text-foreground-light tabular-nums ml-2">
                          {feature.usage.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-1 bg-surface-300 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-500 rounded-full"
                          style={{
                            width: `${(feature.usage / featureUsage[0].usage) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span
                      className={cn(
                        "text-[11px] tabular-nums",
                        feature.change >= 0
                          ? "text-brand-500"
                          : "text-destructive"
                      )}
                    >
                      {feature.change >= 0 ? "+" : ""}
                      {feature.change}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 每日统计 */}
          <section id="daily" className="space-y-3">
            <CategoryHeader>每日统计</CategoryHeader>
            <div className="rounded-md border border-border bg-surface-100 p-5">
              <SimpleBarChart
                data={dailyUsage.map((item) => ({
                  label: item.day,
                  value: item.conversations,
                  color: "bg-brand-500",
                }))}
                height={180}
                showValues={false}
              />
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-md bg-surface-75 px-3 py-2">
                  <p className="text-[11px] text-foreground-muted uppercase tracking-wide">
                    日均对话
                  </p>
                  <p className="text-sm font-medium text-foreground tabular-nums">
                    {avgConversations}
                  </p>
                </div>
                <div className="rounded-md bg-surface-75 px-3 py-2">
                  <p className="text-[11px] text-foreground-muted uppercase tracking-wide">
                    日均工作流
                  </p>
                  <p className="text-sm font-medium text-foreground tabular-nums">
                    {avgWorkflows}
                  </p>
                </div>
                <div className="rounded-md bg-surface-75 px-3 py-2">
                  <p className="text-[11px] text-foreground-muted uppercase tracking-wide">
                    峰值日
                  </p>
                  <p className="text-sm font-medium text-foreground tabular-nums">
                    {peakDay.day}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border">
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
          </section>
        </div>

        {/* 最近活动 */}
        <section id="activities" className="space-y-3">
          <CategoryHeader>最近活动</CategoryHeader>
          <div className="rounded-md border border-border bg-surface-100">
            <div className="px-4 py-2.5 border-b border-border flex items-center justify-between text-[11px] text-foreground-muted uppercase tracking-wide">
              <span>活动</span>
              <span>Token 消耗</span>
            </div>
            <div className="divide-y divide-border">
              {recentActivities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between px-4 py-3 hover:bg-surface-100/60 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-1 h-8 rounded-full bg-brand-500/60" />
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium text-foreground truncate">
                        {activity.title}
                      </p>
                      <p className="text-[11px] text-foreground-muted">
                        {activityTypeLabels[activity.type]} · {activity.time}
                      </p>
                    </div>
                  </div>
                  <span className="text-[12px] text-foreground-light tabular-nums flex items-center gap-1">
                    <Coins className="w-3 h-3" />
                    {activity.tokens.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 优化建议 */}
        <section id="tips" className="space-y-3">
          <CategoryHeader>优化建议</CategoryHeader>
          <div className="rounded-md border border-border bg-surface-100 p-5">
            <div className="grid md:grid-cols-3 gap-4">
              {optimizationTips.map((tip) => (
                <div
                  key={tip.title}
                  className="rounded-md border border-border/70 bg-surface-75 p-4"
                >
                  <p className="text-[11px] text-foreground-muted uppercase tracking-wide mb-2">
                    {tip.impact}
                  </p>
                  <p className="text-[13px] font-medium text-foreground mb-1">
                    {tip.title}
                  </p>
                  <p className="text-[12px] text-foreground-light">
                    {tip.description}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between text-[12px] text-foreground-light pt-4 border-t border-border">
              <span>预计可节省 15% - 25% 成本</span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[12px] border-brand-500/50 text-brand-500 hover:bg-brand-500/10"
              >
                查看详细建议
              </Button>
            </div>
          </div>
        </section>
      </div>
    </PageWithSidebar>
  );
}
