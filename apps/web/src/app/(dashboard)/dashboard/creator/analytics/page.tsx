"use client";

/**
 * 创作者数据分析页面
 *
 * Supabase 风格：简约、专业、数据可视化
 */

import { useState } from "react";
import {
  BarChart3,
  TrendingUp,

  TrendingDown,

  Users,

  Eye,

  Star,

  Download,

  Calendar,

  Filter,

  RefreshCw,

  ChevronDown,

  ArrowUpRight,

  Zap,

  Clock,

  Target,

  Award,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PageContainer, PageHeader } from "@/components/dashboard/page-layout";

// 时间范围选项

const timeRanges = [

  { id: "7d", label: "最近 7 天" },

  { id: "30d", label: "最近 30 天" },

  { id: "90d", label: "最近 90 天" },

  { id: "1y", label: "最近 1 年" },

];

// 概览统计

const overviewStats = [

  {
    label: "总浏览量",

    value: "125,678",

    change: "+12.5%",

    trend: "up",

    icon: Eye,

    description: "较上期增加 14,230 次",

  },

  {
    label: "独立访客",

    value: "45,892",

    change: "+8.3%",

    trend: "up",

    icon: Users,

    description: "较上期增加 3,521 人",

  },

  {
    label: "平均评分",

    value: "4.8",

    change: "+0.2",

    trend: "up",

    icon: Star,

    description: "共 2,345 条评价",

  },

  {
    label: "使用次数",

    value: "89,234",

    change: "+15.7%",

    trend: "up",

    icon: Zap,

    description: "较上期增加 12,156 次",

  },

];

// 热门作品

const topWorks = [

  {
    id: "1",

    title: "智能客服助手模板",

    type: "模板",

    views: 12580,

    uses: 3456,

    rating: 4.9,

    trend: "+23%",

  },

  {
    id: "2",

    title: "数据同步工作流",

    type: "工作流",

    views: 8920,

    uses: 2134,

    rating: 4.8,

    trend: "+18%",

  },

  {
    id: "3",

    title: "邮件自动回复 Agent",

    type: "Agent",

    views: 7650,

    uses: 1890,

    rating: 4.7,

    trend: "+15%",

  },

  {
    id: "4",

    title: "报表生成模板",

    type: "模板",

    views: 6234,

    uses: 1567,

    rating: 4.6,

    trend: "+12%",

  },

  {
    id: "5",

    title: "社交媒体管理工作流",

    type: "工作流",

    views: 5890,

    uses: 1234,

    rating: 4.5,

    trend: "+10%",

  },

];

// 用户来源

const trafficSources = [

  { source: "搜索", percentage: 35, color: "bg-brand-500" },

  { source: "推荐", percentage: 28, color: "bg-brand-400" },

  { source: "分类浏览", percentage: 22, color: "bg-surface-300" },

  { source: "直接访问", percentage: 10, color: "bg-brand-400" },

  { source: "其他", percentage: 5, color: "bg-surface-200" },

];

// 每日数据

const dailyData = [

  { date: "01-24", views: 4520, uses: 1230, revenue: 245 },

  { date: "01-25", views: 5120, uses: 1450, revenue: 312 },

  { date: "01-26", views: 4890, uses: 1320, revenue: 278 },

  { date: "01-27", views: 6230, uses: 1780, revenue: 456 },

  { date: "01-28", views: 5670, uses: 1560, revenue: 389 },

  { date: "01-29", views: 7120, uses: 1920, revenue: 523 },

  { date: "01-30", views: 7890, uses: 2150, revenue: 612 },

];

// 目标达成

const goals = [

  { label: "月浏览量目标", current: 125678, target: 150000, unit: "次" },

  { label: "新增用户目标", current: 3521, target: 5000, unit: "人" },

  { label: "收入目标", current: 2815, target: 4000, unit: "元" },

];

export default function CreatorAnalyticsPage() {
  const [selectedRange, setSelectedRange] = useState("30d");

  const [activeMetric, setActiveMetric] = useState<"views" | "uses" | "revenue">("views");

  // 获取图表最大值

  const maxValue = Math.max(...dailyData.map((d) => d[activeMetric]));

  return (
    <PageContainer>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-brand-200/60 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-brand-500" />
          </div>
          <div className="page-caption">Creator</div>
        </div>
        <PageHeader
          title="数据分析"
          backHref="/dashboard/creator"
          backLabel="返回"
          actions={(
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 p-1 rounded-md bg-surface-200">
                {timeRanges.map((range) => (
                  <button
                    key={range.id}
                    onClick={() => setSelectedRange(range.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-[13px] font-medium transition-all",
                      selectedRange === range.id
                        ? "bg-surface-100 text-foreground shadow-sm"
                        : "text-foreground-muted hover:text-foreground"
                    )}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
              <Button variant="outline" size="sm" className="border-border text-foreground-light">
                <Download className="w-4 h-4 mr-2" />
                导出报告
              </Button>
            </div>
          )}
        />

        {/* Content */}

        <div className="space-y-6">

        {/* Overview Stats */}

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

          {overviewStats.map((stat) => (
            <div

              key={stat.label}

              className="page-panel p-6"

            >

              <div className="flex items-center justify-between mb-3">

                <stat.icon className="w-4 h-4 text-brand-500" />

                <span className={cn(
                  "flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-md",

                  stat.trend === "up"

                    ? "bg-brand-200 text-brand-500"

                    : "bg-destructive-200 text-destructive"

                )}>

                  {stat.trend === "up" ? (
                    <TrendingUp className="w-3 h-3" />

                  ) : (
                    <TrendingDown className="w-3 h-3" />

                  )}

                  {stat.change}

                </span>

              </div>

              <div className="text-xl font-semibold text-foreground mb-1">

                {stat.value}

              </div>

              <div className="text-[13px] text-foreground-light">

                {stat.label}

              </div>

              <div className="text-xs text-foreground-muted mt-2">

                {stat.description}

              </div>

            </div>

          ))}

        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">

          {/* Chart */}

          <div className="lg:col-span-2 page-panel p-6">

            <div className="flex items-center justify-between mb-6">

              <h3 className="page-panel-title">趋势分析</h3>

              <div className="flex items-center gap-1 p-1 rounded-md bg-surface-200">

                {[

                  { id: "views" as const, label: "浏览量" },

                  { id: "uses" as const, label: "使用次数" },

                  { id: "revenue" as const, label: "收入" },

                ].map((metric) => (
                  <button

                    key={metric.id}

                    onClick={() => setActiveMetric(metric.id)}

                    className={cn(
                      "px-3 py-1 rounded-md text-xs font-medium transition-all",

                      activeMetric === metric.id

                        ? "bg-surface-100 text-foreground shadow-sm"

                        : "text-foreground-muted hover:text-foreground"

                    )}

                  >

                    {metric.label}

                  </button>

                ))}

              </div>

            </div>

            {/* Simple Bar Chart */}

            <div className="space-y-3">

              {dailyData.map((data) => (
                <div key={data.date} className="flex items-center gap-4">

                  <span className="text-xs text-foreground-muted w-12">

                    {data.date}

                  </span>

                  <div className="flex-1 h-6 bg-surface-200 rounded-full overflow-hidden">

                    <div

                      className="h-full bg-brand-500 rounded-full transition-all"

                      style={{ width: `${(data[activeMetric] / maxValue) * 100}%` }}

                    />

                  </div>

                  <span className="text-[13px] font-medium text-foreground w-16 text-right">

                    {activeMetric === "revenue" ? `${data[activeMetric]}` : data[activeMetric].toLocaleString()}

                  </span>

                </div>

              ))}

            </div>

          </div>

          {/* Traffic Sources */}

          <div className="page-panel p-6">

            <h3 className="page-panel-title mb-6">流量来源</h3>

            <div className="space-y-4">

              {trafficSources.map((source) => (
                <div key={source.source}>

                  <div className="flex items-center justify-between mb-2">

                    <span className="text-[13px] text-foreground">{source.source}</span>

                    <span className="text-[13px] font-medium text-foreground">

                      {source.percentage}%

                    </span>

                  </div>

                  <div className="h-1.5 bg-surface-200 rounded-full overflow-hidden">

                    <div

                      className={cn("h-full rounded-full", source.color)}

                      style={{ width: `${source.percentage}%` }}

                    />

                  </div>

                </div>

              ))}

            </div>

          </div>

        </div>

        <div className="grid lg:grid-cols-2 gap-6">

          {/* Top Works */}

          <div className="page-panel p-6">

            <div className="flex items-center justify-between mb-6">

              <h3 className="page-panel-title">热门作品</h3>

              <Button variant="ghost" size="sm" className="text-foreground-light">

                查看全部

                <ArrowUpRight className="w-4 h-4 ml-1" />

              </Button>

            </div>

            <div className="space-y-4">

              {topWorks.map((work, index) => (
                <div

                  key={work.id}

                  className="flex items-center gap-4 p-3 rounded-md hover:bg-surface-75 transition-colors"

                >

                  <div className="w-8 h-8 rounded-md bg-surface-200 flex items-center justify-center text-[13px] font-bold text-foreground-muted">

                    {index + 1}

                  </div>

                  <div className="flex-1 min-w-0">

                    <div className="text-[13px] font-medium text-foreground truncate">

                      {work.title}

                    </div>

                    <div className="text-xs text-foreground-muted">

                      {work.type}

                    </div>

                  </div>

                  <div className="text-right">

                    <div className="text-[13px] font-medium text-foreground">

                      {work.views.toLocaleString()} 浏览

                    </div>

                    <div className="text-xs text-brand-500">{work.trend}</div>

                  </div>

                </div>

              ))}

            </div>

          </div>

          {/* Goals Progress */}

          <div className="page-panel p-6">

            <div className="flex items-center justify-between mb-6">

              <h3 className="page-panel-title">目标达成</h3>

              <span className="text-xs text-foreground-muted">本月</span>

            </div>

            <div className="space-y-6">

              {goals.map((goal) => {
                const percentage = Math.min((goal.current / goal.target) * 100, 100);

                return (
                  <div key={goal.label}>

                    <div className="flex items-center justify-between mb-2">

                      <span className="text-[13px] text-foreground">{goal.label}</span>

                      <span className="text-xs text-foreground-muted">

                        {goal.current.toLocaleString()} / {goal.target.toLocaleString()} {goal.unit}

                      </span>

                    </div>

                    <div className="h-2 bg-surface-200 rounded-full overflow-hidden">

                      <div

                        className={cn(
                          "h-full rounded-full transition-all",

                          percentage >= 100 ? "bg-brand-500" : percentage >= 70 ? "bg-brand-500" : "bg-brand-400"

                        )}

                        style={{ width: `${percentage}%` }}

                      />

                    </div>

                    <div className="text-xs text-foreground-muted mt-1">

                      完成 {percentage.toFixed(1)}%

                    </div>

                  </div>

                );

              })}

            </div>

            {/* Tips */}

            <div className="mt-6 p-4 rounded-md bg-brand-200/60 border border-brand-500/30">

              <div className="flex items-start gap-3">

                <Target className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />

                <div>

                  <h4 className="text-[13px] font-medium text-foreground mb-1">优化建议</h4>

                  <p className="text-xs text-foreground-light">

                    您的模板在周末使用量明显增加，建议在周五发布新作品以获得更好的曝光。

                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>

        {/* Insights */}

        <div className="mt-8 page-panel p-6">

          <h3 className="page-panel-title mb-6">数据洞察</h3>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">

            {[

              {
                icon: Clock,

                title: "最佳发布时间",

                value: "周三 10:00",

                description: "该时段发布作品平均浏览量最高",

              },

              {
                icon: Users,

                title: "用户留存率",

                value: "68.5%",

                description: "使用过您作品的用户再次使用的比例",

              },

              {
                icon: Star,

                title: "评价响应率",

                value: "92%",

                description: "您回复用户评价的比例",

              },

              {
                icon: Award,

                title: "创作者排名",

                value: "Top 5%",

                description: "您在所有创作者中的排名",

              },

            ].map((insight) => (
              <div key={insight.title} className="p-4 rounded-md bg-surface-75">

                <insight.icon className="w-4 h-4 text-brand-500 mb-3" />

                <div className="text-base font-semibold text-foreground mb-1">

                  {insight.value}

                </div>

                <div className="text-[13px] font-medium text-foreground mb-1">

                  {insight.title}

                </div>

                <div className="text-xs text-foreground-muted">

                  {insight.description}

                </div>

              </div>

            ))}

          </div>

        </div>

        </div>

      </div>
    </PageContainer>

  );
}

