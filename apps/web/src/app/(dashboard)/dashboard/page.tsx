"use client";

/**
 * Dashboard 首页 - Supabase 项目设置风格
 * 极简文本优先设计，遵循 STYLE-TERMINAL-PIXEL.md 规范
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Zap,
  Plus,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  Activity,
  ChevronRight,
  LayoutGrid,
  Bot,
  Settings,
  BarChart3,
  Server,
  Database,
  Cpu,
  PenTool,
  FileText,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import { Button } from "@/components/ui/button";
import {
  PageContainer,
  PageHeader,
  SettingsSection,
  PageWithSidebar,
} from "@/components/dashboard/page-layout";
import {
  dashboardApi,
  type DashboardData,
  type WorkflowSummary,
  type ExecutionSummary,
  formatQuickStats,
  getExecutionStatusText,
} from "@/lib/api/dashboard";

// ===== 侧边导航组件 =====
function DashboardNav({ activeSection }: { activeSection: string }) {
  const navItems = [
    { id: "overview", label: "概览", href: "#overview" },
    { id: "status", label: "项目状态", href: "#status" },
    { id: "actions", label: "快捷操作", href: "#actions" },
    { id: "recent", label: "最近动态", href: "#recent" },
    { id: "usage", label: "资源用量", href: "#usage" },
  ];

  return (
    <nav className="space-y-1">
      {navItems.map((item) => (
        <a
          key={item.id}
          href={item.href}
          className={cn(
            "block px-3 py-2 text-[12px] font-medium rounded-md transition-colors",
            activeSection === item.id
              ? "bg-surface-100/70 text-foreground"
              : "text-foreground-light hover:text-foreground hover:bg-surface-100/60"
          )}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}

// ===== 主页面组件 =====
export default function DashboardPage() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [activeSection, setActiveSection] = useState("overview");

  // 获取 Dashboard 数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await dashboardApi.getDashboardData();
        if (response.success) {
          setDashboardData(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // 滚动监听
  useEffect(() => {
    const handleScroll = () => {
      const sections = ["overview", "status", "actions", "recent", "usage"];
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom > 100) {
            setActiveSection(id);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 获取问候语
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return "夜深了";
    if (hour < 12) return "早上好";
    if (hour < 14) return "中午好";
    if (hour < 18) return "下午好";
    return "晚上好";
  };

  const stats = dashboardData?.quick_stats;
  const formattedStats = stats ? formatQuickStats(stats) : null;

  return (
    <PageWithSidebar
      sidebarWidth="narrow"
      sidebarTitle="Dashboard"
      sidebar={<DashboardNav activeSection={activeSection} />}
    >
      <PageContainer>
        {/* 页面头部 */}
        <PageHeader
          title={`${getGreeting()}，${user?.displayName || user?.username || "用户"}`}
          description="项目概览与工作流状态"
          actions={
            <div className="flex items-center gap-2">
              <Button size="sm" asChild>
                <Link href="/workflows/new">
                  <Plus className="w-3.5 h-3.5" />
                  新建工作流
                </Link>
              </Button>
            </div>
          }
        />

        {/* 关键指标 */}
        <section id="overview" className="scroll-mt-6">
          <SettingsSection
            title="关键指标"
            description="工作流与执行概览数据"
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricItem
                label="工作流总数"
                value={formattedStats?.totalWorkflows ?? 0}
                subtext={`${formattedStats?.activeWorkflows ?? 0} 个活跃`}
                trend={formattedStats?.workflowsGrowth}
                isLoading={isLoading}
              />
              <MetricItem
                label="今日执行"
                value={formattedStats?.runsToday ?? 0}
                subtext={`本周 ${formattedStats?.runsThisWeek ?? 0} 次`}
                trend={formattedStats?.executionsGrowth}
                isLoading={isLoading}
              />
              <MetricItem
                label="成功率"
                value={`${(formattedStats?.successRate ?? 0).toFixed(1)}%`}
                subtext={`${formattedStats?.totalExecutions ?? 0} 次执行`}
                trend={formattedStats?.successRateChange}
                isLoading={isLoading}
              />
              <MetricItem
                label="平均响应"
                value={`${formattedStats?.avgResponseTimeMs ?? 0}ms`}
                subtext="响应时间"
                isLoading={isLoading}
              />
            </div>
          </SettingsSection>
        </section>

        {/* 项目状态 */}
        <section id="status" className="scroll-mt-6 mt-6">
          <SettingsSection
            title="项目状态"
            description="系统运行状态与资源监控"
          >
            <div className="space-y-4">
              {/* 系统状态 */}
              <StatusRow
                label="系统状态"
                description="所有服务运行正常"
                status={dashboardData?.system_health?.overall_status || "healthy"}
                isLoading={isLoading}
              />
              
              {/* 运行队列 */}
              <StatusRow
                label="运行队列"
                description={`${dashboardData?.running_queue?.total_running ?? 0} 个任务运行中，${dashboardData?.running_queue?.total_pending ?? 0} 个等待中`}
                status={dashboardData?.running_queue?.queue_health || "healthy"}
                isLoading={isLoading}
              />

              {/* 系统指标 */}
              {dashboardData?.system_health?.metrics && (
                <div className="pt-4 border-t border-border">
                  <div className="grid grid-cols-3 gap-4">
                    <SystemMetric
                      icon={Cpu}
                      label="CPU"
                      value={`${dashboardData.system_health.metrics.cpu_usage.toFixed(1)}%`}
                    />
                    <SystemMetric
                      icon={Database}
                      label="内存"
                      value={`${dashboardData.system_health.metrics.memory_usage.toFixed(1)}%`}
                    />
                    <SystemMetric
                      icon={Server}
                      label="延迟"
                      value={`${dashboardData.system_health.metrics.avg_latency_ms}ms`}
                    />
                  </div>
                </div>
              )}
            </div>
          </SettingsSection>
        </section>

        {/* 快捷操作 */}
        <section id="actions" className="scroll-mt-6 mt-6">
          <SettingsSection
            title="快捷操作"
            description="常用功能入口"
          >
            <div className="space-y-1">
              <ActionRow
                href="/workflows/new"
                label="创建工作流"
                description="构建自动化任务流程"
              />
              <ActionRow
                href="/template-gallery"
                label="模板库"
                description="从预设模板快速开始"
              />
              <ActionRow
                href="/creative/generate"
                label="生成内容"
                description="AI 辅助文案创作"
              />
              <ActionRow
                href="/my-agents"
                label="我的 Agent"
                description="管理已发布的 Agent"
              />
            </div>
          </SettingsSection>
        </section>

        {/* 最近动态 */}
        <section id="recent" className="scroll-mt-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 最近工作流 */}
            <SettingsSection
              title="最近工作流"
              description="最近创建或修改的工作流"
              compact
            >
              {isLoading ? (
                <LoadingRows count={3} />
              ) : dashboardData?.recent_workflows && dashboardData.recent_workflows.length > 0 ? (
                <div className="space-y-1">
                  {dashboardData.recent_workflows.slice(0, 5).map((workflow) => (
                    <WorkflowRow key={workflow.id} workflow={workflow} />
                  ))}
                </div>
              ) : (
                <EmptyMessage text="暂无工作流" action={{ label: "创建工作流", href: "/workflows/new" }} />
              )}
              {dashboardData?.recent_workflows && dashboardData.recent_workflows.length > 0 && (
                <div className="pt-3 border-t border-border mt-3">
                  <Link
                    href="/workflows"
                    className="text-[12px] text-foreground-light hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    查看全部工作流
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </SettingsSection>

            {/* 最近执行 */}
            <SettingsSection
              title="最近执行"
              description="最近的工作流执行记录"
              compact
            >
              {isLoading ? (
                <LoadingRows count={3} />
              ) : dashboardData?.recent_executions && dashboardData.recent_executions.length > 0 ? (
                <div className="space-y-1">
                  {dashboardData.recent_executions.slice(0, 5).map((execution) => (
                    <ExecutionRow key={execution.id} execution={execution} />
                  ))}
                </div>
              ) : (
                <EmptyMessage text="暂无执行记录" />
              )}
              {dashboardData?.recent_executions && dashboardData.recent_executions.length > 0 && (
                <div className="pt-3 border-t border-border mt-3">
                  <Link
                    href="/executions"
                    className="text-[12px] text-foreground-light hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    查看全部执行记录
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </SettingsSection>
          </div>
        </section>

        {/* 资源用量 */}
        <section id="usage" className="scroll-mt-6 mt-6">
          <SettingsSection
            title="资源用量"
            description="Token 与 API 调用统计"
          >
            <div className="space-y-4">
              {/* Token 用量 */}
              {dashboardData?.token_usage && (
                <UsageBar
                  label="Token 用量"
                  used={dashboardData.token_usage.used_this_month}
                  limit={dashboardData.token_usage.limit}
                  unit="tokens"
                />
              )}
              
              {/* API 调用 */}
              {dashboardData?.api_usage_stats && (
                <div className="pt-4 border-t border-border">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <UsageMetric
                      label="今日调用"
                      value={dashboardData.api_usage_stats.calls_today}
                    />
                    <UsageMetric
                      label="本周调用"
                      value={dashboardData.api_usage_stats.calls_this_week}
                    />
                    <UsageMetric
                      label="平均延迟"
                      value={`${dashboardData.api_usage_stats.avg_latency_ms}ms`}
                    />
                    <UsageMetric
                      label="配额使用"
                      value={`${dashboardData.api_usage_stats.usage_percent.toFixed(1)}%`}
                      highlight={dashboardData.api_usage_stats.usage_percent > 80}
                    />
                  </div>
                </div>
              )}
            </div>
          </SettingsSection>
        </section>

        {/* 底部间距 */}
        <div className="h-12" />
      </PageContainer>
    </PageWithSidebar>
  );
}

// ===== 子组件 =====

// 指标项
interface MetricItemProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: number;
  isLoading?: boolean;
}

function MetricItem({ label, value, subtext, trend, isLoading }: MetricItemProps) {
  if (isLoading) {
    return (
      <div className="p-4 rounded-md border border-border bg-surface-75">
        <div className="animate-pulse space-y-2">
          <div className="h-3 w-16 bg-surface-200 rounded" />
          <div className="h-6 w-20 bg-surface-200 rounded" />
          <div className="h-3 w-24 bg-surface-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-md border border-border bg-surface-75 hover:border-border-strong transition-colors">
      <div className="text-[11px] text-foreground-muted uppercase tracking-wide mb-1">
        {label}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-semibold text-foreground">{value}</span>
        {trend !== undefined && trend !== 0 && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-[10px] font-medium",
              trend > 0 ? "text-brand-500" : "text-destructive"
            )}
          >
            {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
      {subtext && <div className="text-[11px] text-foreground-muted mt-1">{subtext}</div>}
    </div>
  );
}

// 状态行
interface StatusRowProps {
  label: string;
  description: string;
  status: "healthy" | "degraded" | "down" | string;
  isLoading?: boolean;
}

function StatusRow({ label, description, status, isLoading }: StatusRowProps) {
  const statusConfig = {
    healthy: { color: "bg-brand-500", text: "正常" },
    degraded: { color: "bg-warning", text: "异常" },
    down: { color: "bg-destructive", text: "故障" },
    busy: { color: "bg-warning", text: "繁忙" },
    overloaded: { color: "bg-destructive", text: "过载" },
  };
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.healthy;

  if (isLoading) {
    return (
      <div className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
        <div className="animate-pulse space-y-1">
          <div className="h-3 w-20 bg-surface-200 rounded" />
          <div className="h-3 w-32 bg-surface-200 rounded" />
        </div>
        <div className="h-4 w-12 bg-surface-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
      <div>
        <div className="text-[12px] font-medium text-foreground">{label}</div>
        <div className="text-[11px] text-foreground-muted">{description}</div>
      </div>
      <div className="flex items-center gap-1.5">
        <div className={cn("w-2 h-2 rounded-full", config.color)} />
        <span className="text-[11px] text-foreground-muted">{config.text}</span>
      </div>
    </div>
  );
}

// 系统指标
interface SystemMetricProps {
  icon: React.ElementType;
  label: string;
  value: string;
}

function SystemMetric({ icon: Icon, label, value }: SystemMetricProps) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-foreground-muted" />
      <div>
        <div className="text-[10px] text-foreground-muted uppercase">{label}</div>
        <div className="text-[12px] font-medium text-foreground">{value}</div>
      </div>
    </div>
  );
}

// 操作行
interface ActionRowProps {
  href: string;
  label: string;
  description: string;
}

function ActionRow({ href, label, description }: ActionRowProps) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between py-3 px-3 -mx-3 rounded-md hover:bg-surface-100/60 transition-colors group"
    >
      <div>
        <div className="text-[12px] font-medium text-foreground">{label}</div>
        <div className="text-[11px] text-foreground-muted">{description}</div>
      </div>
      <ChevronRight className="w-4 h-4 text-foreground-muted group-hover:text-foreground transition-colors" />
    </Link>
  );
}

// 工作流行
function WorkflowRow({ workflow }: { workflow: WorkflowSummary }) {
  const statusColors: Record<string, string> = {
    active: "text-brand-500",
    published: "text-foreground-muted",
    draft: "text-foreground-muted",
    archived: "text-warning",
  };

  return (
    <Link
      href={`/workflows/${workflow.id}`}
      className="flex items-center justify-between py-2 px-3 -mx-3 rounded-md hover:bg-surface-100/60 transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-medium text-foreground truncate">{workflow.name}</div>
        <div className="text-[11px] text-foreground-muted">
          {workflow.run_count} 次运行
          {workflow.success_rate > 0 && ` · ${workflow.success_rate.toFixed(0)}% 成功`}
        </div>
      </div>
      <span className={cn("text-[10px] font-medium", statusColors[workflow.status] || "text-foreground-muted")}>
        {workflow.status === "active" ? "活跃" : workflow.status === "draft" ? "草稿" : workflow.status}
      </span>
    </Link>
  );
}

// 执行行
function ExecutionRow({ execution }: { execution: ExecutionSummary }) {
  const statusConfig: Record<string, { icon: React.ElementType; color: string }> = {
    completed: { icon: CheckCircle2, color: "text-brand-500" },
    failed: { icon: XCircle, color: "text-destructive" },
    running: { icon: Loader2, color: "text-foreground-muted" },
    pending: { icon: Clock, color: "text-foreground-muted" },
  };
  const config = statusConfig[execution.status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <Link
      href={`/executions/${execution.id}`}
      className="flex items-center justify-between py-2 px-3 -mx-3 rounded-md hover:bg-surface-100/60 transition-colors group"
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Icon className={cn("w-4 h-4 shrink-0", config.color, execution.status === "running" && "animate-spin")} />
        <div className="min-w-0">
          <div className="text-[12px] font-medium text-foreground truncate">{execution.workflow_name}</div>
          <div className="text-[11px] text-foreground-muted">
            {getExecutionStatusText(execution.status)}
            {execution.duration_ms && ` · ${execution.duration_ms}ms`}
          </div>
        </div>
      </div>
      <span className="text-[10px] text-foreground-muted shrink-0">{execution.time_ago}</span>
    </Link>
  );
}

// 用量条
interface UsageBarProps {
  label: string;
  used: number;
  limit: number;
  unit?: string;
}

function UsageBar({ label, used, limit, unit = "" }: UsageBarProps) {
  const percent = limit > 0 ? (used / limit) * 100 : 0;
  const color = percent > 80 ? "bg-destructive" : percent > 50 ? "bg-warning" : "bg-brand-500";

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-medium text-foreground">{label}</span>
        <span className="text-[11px] text-foreground-muted">
          {(used / 1000).toFixed(1)}K / {(limit / 1000).toFixed(0)}K {unit}
        </span>
      </div>
      <div className="h-2 bg-surface-200 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <div className="text-[10px] text-foreground-muted mt-1">
        {percent.toFixed(1)}% 已使用
      </div>
    </div>
  );
}

// 用量指标
interface UsageMetricProps {
  label: string;
  value: string | number;
  highlight?: boolean;
}

function UsageMetric({ label, value, highlight }: UsageMetricProps) {
  return (
    <div>
      <div className="text-[10px] text-foreground-muted uppercase tracking-wide">{label}</div>
      <div className={cn("text-sm font-medium", highlight ? "text-warning" : "text-foreground")}>
        {value}
      </div>
    </div>
  );
}

// 加载行
function LoadingRows({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-12 bg-surface-200 rounded-md animate-pulse" />
      ))}
    </div>
  );
}

// 空状态消息
interface EmptyMessageProps {
  text: string;
  action?: { label: string; href: string };
}

function EmptyMessage({ text, action }: EmptyMessageProps) {
  return (
    <div className="py-6 text-center">
      <p className="text-[12px] text-foreground-muted mb-2">{text}</p>
      {action && (
        <Link
          href={action.href}
          className="inline-flex items-center gap-1 text-[12px] text-brand-500 hover:text-brand-600 transition-colors"
        >
          <Plus className="w-3 h-3" />
          {action.label}
        </Link>
      )}
    </div>
  );
}
