"use client";

/**
 * Dashboard 首页 - Supabase 风格控制台
 * 特点：统计卡片、执行趋势、用户等级、Token 使用量、热门模板、学习资源
 */

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Paperclip,
  Zap,
  FileText,
  Sparkles,
  ArrowUp,
  PenTool,
  BarChart3,
  Bot,
  Plus,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  Activity,
  Edit,
  Trash2,
  LogIn,
  User,
  Lock,
  Key,
  RefreshCw,
  ChevronRight,
  LayoutGrid,
  Crown,
  Layers,
  Rocket,
  Target,
  BookOpen,
  PlayCircle,
  Star,
  Mail,
  Trophy,
  Flame,
  Coins,
  Award,
  Bell,
  Gift,
  Calendar,
  Heart,
  X,
  AlertCircle,
  Info,
  Gauge,
  Bug,
  StickyNote,
  Wifi,
  Server,
  Shield,
  Database,
  Pin,
  Link2,
  Unlink,
  TimerIcon,
  BellRing,
  BrainCircuit,
  Lightbulb,
  AlertTriangle,
  MessageCircle,
  Chrome,
  FileEdit,
  Github,
  Medal,
  Users,
  Cpu,
  HardDrive,
  Globe,
  ListTodo,
  Loader2,
  CircleCheck,
  CircleDashed,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import { Button } from "@/components/ui/button";
import { PageContainer, PageHeader } from "@/components/dashboard/page-layout";
import {
  dashboardApi,
  type DashboardData,
  type WorkflowSummary,
  type ActivitySummary,
  type ExecutionSummary,
  type TemplateSummary,
  type LearningResource,
  type Achievement,
  type Announcement,
  type DailyTaskInfo,
  type DailyTask,
  type FavoriteItem,
  type QuickRunItem,
  type PerformanceInsights,
  type ErrorMonitor,
  type ErrorRecord,
  type APIUsageStats,
  type QuickNote,
  type OptimizationSuggestion,
  type IntegrationStatus,
  type IntegrationInfo,
  type ScheduledTask,
  type NotificationCenter,
  type NotificationItem,
  type AISuggestion,
  type Leaderboard,
  type LeaderboardUser,
  type Goal,
  type SystemHealth,
  type ServiceHealth,
  type RunningQueue,
  type QueueTask,
  formatQuickStats,
  getExecutionStatusColor,
  getExecutionStatusBgColor,
  getExecutionStatusText,
} from "@/lib/api/dashboard";

// 快捷任务卡片数据 - Supabase 风格
const quickTasks = [
  {
    id: "create-workflow",
    icon: Zap,
    title: "创建工作流",
    description: "构建自动化任务流程",
    bgColor: "bg-brand-200/20",
    borderColor: "border-brand-500/20",
    iconColor: "text-brand-500",
    href: "/workflows/new",
  },
  {
    id: "generate-content",
    icon: PenTool,
    title: "生成内容",
    description: "AI 辅助文案创作",
    bgColor: "bg-surface-100/80",
    borderColor: "border-border/70",
    iconColor: "text-foreground-muted",
    href: "/creative/generate",
  },
  {
    id: "template-gallery",
    icon: LayoutGrid,
    title: "模板库",
    description: "从模板快速开始",
    bgColor: "bg-surface-100/80",
    borderColor: "border-border/70",
    iconColor: "text-foreground-muted",
    href: "/template-gallery",
  },
  {
    id: "my-agents",
    icon: Bot,
    title: "我的 Agent",
    description: "管理发布的 Agent",
    bgColor: "bg-surface-100/80",
    borderColor: "border-border/70",
    iconColor: "text-foreground-muted",
    href: "/my-agents",
  },
];

// 活动图标映射
const activityIcons: Record<string, React.ElementType> = {
  login: LogIn,
  logout: LogIn,
  create_workflow: Plus,
  update_workflow: Edit,
  delete_workflow: Trash2,
  run_workflow: Play,
  update_profile: User,
  change_password: Lock,
  create_agent: Bot,
  update_agent: RefreshCw,
  create_api_key: Key,
  delete_api_key: Key,
};

// 成就图标映射
const achievementIcons: Record<string, React.ElementType> = {
  Zap: Zap,
  Layers: Layers,
  Play: Play,
  Rocket: Rocket,
  Crown: Crown,
  Trophy: Trophy,
  Star: Star,
  Flame: Flame,
};

// 学习资源图标映射
const learningIcons: Record<string, React.ElementType> = {
  BookOpen: BookOpen,
  PlayCircle: PlayCircle,
  Sparkles: Sparkles,
  Target: Target,
};

// 模板图标映射
const templateIcons: Record<string, React.ElementType> = {
  Mail: Mail,
  RefreshCw: RefreshCw,
  PenTool: PenTool,
  Bot: Bot,
};

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // 自动调整文本框高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  // 发送消息
  const handleSend = () => {
    if (!message.trim()) return;
    console.log("发送消息:", message);
    setMessage("");
  };

  // 键盘事件处理
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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
    <PageContainer className="dashboard-page relative">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-56 w-[70%] -translate-x-1/2 rounded-full bg-brand-500/10 blur-3xl" />
      <div className="pointer-events-none absolute top-24 right-[-10%] h-40 w-64 rounded-full bg-brand-500/5 blur-2xl" />
      <div className="relative flex flex-col gap-6">
        <PageHeader
          eyebrow="Project Overview · 工作台"
          title={`${getGreeting()}，${user?.displayName || user?.username || "用户"}`}
          description="欢迎回来，这是你的工作台概览"
          actions={(
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" asChild>
                <Link href="/workflows/new">
                  <Plus className="w-3.5 h-3.5" />
                  创建工作流
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/template-gallery">
                  <LayoutGrid className="w-3.5 h-3.5" />
                  模板库
                </Link>
              </Button>
            </div>
          )}
        />

        <div className="page-divider" />

            {/* 系统公告 */}
            {dashboardData?.announcements && dashboardData.announcements.length > 0 && (
              <div className="page-section">
                <AnnouncementBanner announcements={dashboardData.announcements} />
              </div>
            )}

            {/* 概览面板 */}
            <section className="page-section">
              <div className="page-grid grid-cols-1 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                <div className="page-panel">
                  <div className="page-panel-header flex items-center justify-between">
                    <div>
                      <div className="page-caption">Overview</div>
                      <h2 className="page-panel-title">关键指标</h2>
                      <p className="page-panel-description">工作流与执行概览</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-foreground-muted">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        本周
                      </span>
                      <span className="text-foreground-muted/60">·</span>
                      <span>自动更新</span>
                    </div>
                  </div>
                  <div className="p-5 page-grid grid-cols-2 lg:grid-cols-4">
                    <StatCard
                      title="工作流总数"
                      value={formattedStats?.totalWorkflows ?? 0}
                      subValue={`${formattedStats?.activeWorkflows ?? 0} 个活跃`}
                      icon={Zap}
                      trend={formattedStats?.workflowsGrowth}
                      isLoading={isLoading}
                    />
                    <StatCard
                      title="今日执行"
                      value={formattedStats?.runsToday ?? 0}
                      subValue={`本周 ${formattedStats?.runsThisWeek ?? 0} 次`}
                      icon={Play}
                      trend={formattedStats?.executionsGrowth}
                      isLoading={isLoading}
                    />
                    <StatCard
                      title="成功率"
                      value={`${(formattedStats?.successRate ?? 0).toFixed(1)}%`}
                      subValue={`${formattedStats?.totalExecutions ?? 0} 次执行`}
                      icon={CheckCircle2}
                      trend={formattedStats?.successRateChange}
                      isLoading={isLoading}
                    />
                    <StatCard
                      title="平均响应"
                      value={`${formattedStats?.avgResponseTimeMs ?? 0}ms`}
                      subValue="响应时间"
                      icon={Clock}
                      isLoading={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {dashboardData?.user_level && (
                    <div className="page-panel">
                      <div className="page-panel-header flex items-center justify-between">
                        <div>
                          <div className="page-caption">Profile</div>
                          <h2 className="page-panel-title">等级进度</h2>
                          <p className="page-panel-description">追踪你的成长与积分</p>
                        </div>
                        <Crown className="w-4 h-4 text-brand-500" />
                      </div>
                      <div className="p-5">
                        <UserLevelBadge level={dashboardData.user_level} />
                      </div>
                    </div>
                  )}

                  <div className="page-panel">
                    <div className="page-panel-header flex items-center justify-between">
                      <div>
                        <div className="page-caption">Quick Start</div>
                        <h2 className="page-panel-title">快速开始</h2>
                        <p className="page-panel-description">从常用入口快速启动</p>
                      </div>
                      <Sparkles className="w-4 h-4 text-brand-500" />
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                        {quickTasks.map((task) => (
                          <Link
                            key={task.id}
                            href={task.href}
                            className={cn(
                              "group flex items-start gap-3 rounded-md border px-4 py-3 text-left transition-supabase",
                              "hover:border-border-strong hover:bg-surface-75",
                              task.bgColor,
                              task.borderColor
                            )}
                          >
                            <div
                              className={cn(
                                "mt-0.5 w-9 h-9 rounded-md flex items-center justify-center",
                                "bg-surface-200 group-hover:bg-surface-300 transition-colors"
                              )}
                            >
                              <task.icon className={cn("w-4 h-4", task.iconColor)} />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm font-medium text-foreground">{task.title}</h3>
                              <p className="text-[12px] text-foreground-muted">{task.description}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-xs text-foreground-muted">
                        <span>共 {quickTasks.length} 个入口</span>
                        <Link href="/template-gallery" className="hover:text-foreground">
                          查看全部模板 →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 每日任务 + 快捷运行 */}
            <section className="page-section">
              <div className="page-grid grid-cols-1 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  {isLoading ? (
                    <div className="page-panel h-52 animate-pulse" />
                  ) : dashboardData?.daily_tasks ? (
                    <DailyTasksCard tasks={dashboardData.daily_tasks} />
                  ) : null}
                </div>

                <div className="page-panel">
                  <div className="page-panel-header flex items-center justify-between">
                    <h2 className="page-panel-title">快捷运行</h2>
                    <Play className="w-4 h-4 text-brand-500" />
                  </div>
                  <div className="p-5">
                    {isLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-12 bg-surface-200 rounded-md animate-pulse" />
                        ))}
                      </div>
                    ) : dashboardData?.quick_runs && dashboardData.quick_runs.length > 0 ? (
                      <div className="space-y-2">
                        {dashboardData.quick_runs.map((item) => (
                          <QuickRunCard key={item.id} item={item} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-foreground-muted text-[13px]">
                        运行工作流后显示
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* 执行趋势 + Token 用量 */}
            <section className="page-section">
              <div className="page-grid grid-cols-1 lg:grid-cols-3">
                <div className="page-panel lg:col-span-2">
                  <div className="page-panel-header flex items-center justify-between">
                    <h2 className="page-panel-title">执行趋势</h2>
                    <BarChart3 className="w-4 h-4 text-foreground-muted" />
                  </div>
                  <div className="p-5">
                    {isLoading ? (
                      <div className="h-40 bg-surface-200 rounded-md animate-pulse" />
                    ) : (
                      <ExecutionTrendChart trends={dashboardData?.execution_trends || []} />
                    )}
                  </div>
                </div>

                <div className="page-panel">
                  <div className="page-panel-header flex items-center justify-between">
                    <h2 className="page-panel-title">Token 用量</h2>
                    <Coins className="w-4 h-4 text-warning" />
                  </div>
                  <div className="p-5">
                    {isLoading ? (
                      <div className="space-y-3">
                        <div className="h-4 bg-surface-200 rounded animate-pulse" />
                        <div className="h-20 bg-surface-200 rounded animate-pulse" />
                      </div>
                    ) : dashboardData?.token_usage ? (
                      <TokenUsageCard usage={dashboardData.token_usage} />
                    ) : (
                      <div className="text-center py-6 text-foreground-muted text-[13px]">
                        暂无使用数据
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* 性能洞察 + 错误监控 + 快速笔记 */}
            <section className="page-section">
              <div className="page-grid grid-cols-1 lg:grid-cols-3">
                <div className="page-panel">
                  <div className="page-panel-header flex items-center justify-between">
                    <h2 className="page-panel-title">性能洞察</h2>
                    <Gauge className="w-4 h-4 text-brand-500" />
                  </div>
                  <div className="p-5">
                    {isLoading ? (
                      <div className="space-y-3">
                        <div className="h-16 bg-surface-200 rounded animate-pulse" />
                        <div className="h-20 bg-surface-200 rounded animate-pulse" />
                      </div>
                    ) : dashboardData?.performance_insights ? (
                      <PerformanceInsightsCard insights={dashboardData.performance_insights} />
                    ) : (
                      <div className="text-center py-6 text-foreground-muted text-[13px]">
                        运行工作流后显示
                      </div>
                    )}
                  </div>
                </div>

                <div className="page-panel">
                  <div className="page-panel-header flex items-center justify-between">
                    <h2 className="page-panel-title">错误监控</h2>
                    <Bug className="w-4 h-4 text-destructive" />
                  </div>
                  <div className="p-5">
                    {isLoading ? (
                      <div className="space-y-3">
                        <div className="h-12 bg-surface-200 rounded animate-pulse" />
                        <div className="h-24 bg-surface-200 rounded animate-pulse" />
                      </div>
                    ) : dashboardData?.error_monitor ? (
                      <ErrorMonitorCard monitor={dashboardData.error_monitor} />
                    ) : (
                      <div className="text-center py-6 text-foreground-muted text-[13px]">
                        暂无错误记录
                      </div>
                    )}
                  </div>
                </div>

                <div className="page-panel">
                  <div className="page-panel-header flex items-center justify-between">
                    <h2 className="page-panel-title">快速笔记</h2>
                    <StickyNote className="w-4 h-4 text-warning" />
                  </div>
                  <div className="p-5">
                    {isLoading ? (
                      <div className="space-y-2">
                        {[1, 2].map((i) => (
                          <div key={i} className="h-16 bg-surface-200 rounded animate-pulse" />
                        ))}
                      </div>
                    ) : (
                      <QuickNotesCard notes={dashboardData?.quick_notes || []} />
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* API 使用统计 */}
            {dashboardData?.api_usage_stats && (
              <section className="page-section">
                <APIUsageCard stats={dashboardData.api_usage_stats} />
              </section>
            )}

            {/* AI 智能建议 */}
            {dashboardData?.ai_suggestions && dashboardData.ai_suggestions.length > 0 && (
              <section className="page-section">
                <AISuggestionsCard suggestions={dashboardData.ai_suggestions} />
              </section>
            )}

            {/* 集成状态 + 计划任务 + 通知中心 */}
            <section className="page-section">
              <div className="page-grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
                <div className="space-y-4">
                  <div className="page-panel">
                    <div className="page-panel-header flex items-center justify-between">
                      <h2 className="page-panel-title">集成状态</h2>
                      <Link2 className="w-4 h-4 text-brand-500" />
                    </div>
                    <div className="p-5">
                      {isLoading ? (
                        <div className="space-y-2">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="h-10 bg-surface-200 rounded-md animate-pulse" />
                          ))}
                        </div>
                      ) : dashboardData?.integration_status ? (
                        <IntegrationStatusCard status={dashboardData.integration_status} />
                      ) : (
                        <div className="text-center py-6 text-foreground-muted text-[13px]">
                          暂无集成
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="page-panel">
                    <div className="page-panel-header flex items-center justify-between">
                      <h2 className="page-panel-title">计划任务</h2>
                      <TimerIcon className="w-4 h-4 text-foreground-muted" />
                    </div>
                    <div className="p-5">
                      {isLoading ? (
                        <div className="space-y-2">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="h-12 bg-surface-200 rounded-md animate-pulse" />
                          ))}
                        </div>
                      ) : dashboardData?.scheduled_tasks && dashboardData.scheduled_tasks.length > 0 ? (
                        <ScheduledTasksCard tasks={dashboardData.scheduled_tasks} />
                      ) : (
                        <div className="text-center py-6 text-foreground-muted text-[13px]">
                          暂无计划任务
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="page-panel">
                  <div className="page-panel-header flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h2 className="page-panel-title">通知</h2>
                      {dashboardData?.notifications?.unread_count ? (
                        <span className="px-1.5 py-0.5 rounded-full bg-destructive text-[10px] text-foreground font-medium">
                          {dashboardData.notifications.unread_count}
                        </span>
                      ) : null}
                    </div>
                    <BellRing className="w-4 h-4 text-warning" />
                  </div>
                  <div className="p-5">
                    {isLoading ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-14 bg-surface-200 rounded-md animate-pulse" />
                        ))}
                      </div>
                    ) : dashboardData?.notifications ? (
                      <NotificationCenterCard notifications={dashboardData.notifications} />
                    ) : (
                      <div className="text-center py-6 text-foreground-muted text-[13px]">
                        暂无通知
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* 最近工作流 + 最近活动 */}
            <section className="page-section">
              <div className="page-grid grid-cols-1 lg:grid-cols-2">
                <div className="page-panel">
                  <div className="page-panel-header flex items-center justify-between">
                    <h2 className="page-panel-title">最近工作流</h2>
                    <Link
                      href="/workflows"
                      className="text-xs text-foreground-muted hover:text-foreground flex items-center gap-1 transition-colors"
                    >
                      查看全部
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="p-5">
                    {isLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-16 bg-surface-200 rounded-md animate-pulse" />
                        ))}
                      </div>
                    ) : dashboardData?.recent_workflows && dashboardData.recent_workflows.length > 0 ? (
                      <div className="space-y-2">
                        {dashboardData.recent_workflows.map((workflow) => (
                          <WorkflowItem key={workflow.id} workflow={workflow} />
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon={Zap}
                        title="还没有工作流"
                        description="创建你的第一个工作流开始自动化"
                        actionLabel="创建工作流"
                        actionHref="/workflows/new"
                      />
                    )}
                  </div>
                </div>

                <div className="page-panel">
                  <div className="page-panel-header flex items-center justify-between">
                    <h2 className="page-panel-title">最近活动</h2>
                    <Link
                      href="/activity"
                      className="text-xs text-foreground-muted hover:text-foreground flex items-center gap-1 transition-colors"
                    >
                      查看全部
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="p-5">
                    {isLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="h-12 bg-surface-200 rounded-md animate-pulse" />
                        ))}
                      </div>
                    ) : dashboardData?.recent_activities && dashboardData.recent_activities.length > 0 ? (
                      <div className="space-y-1">
                        {dashboardData.recent_activities.slice(0, 6).map((activity) => (
                          <ActivityItem key={activity.id} activity={activity} />
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon={Activity}
                        title="暂无活动记录"
                        description="你的操作记录会显示在这里"
                      />
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* 最近执行记录 */}
            <section className="page-section">
              <div className="page-panel">
                <div className="page-panel-header flex items-center justify-between">
                  <h2 className="page-panel-title">最近执行</h2>
                  <Link
                    href="/executions"
                    className="text-xs text-foreground-muted hover:text-foreground flex items-center gap-1 transition-colors"
                  >
                    查看全部
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="p-5">
                  {isLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-14 bg-surface-200 rounded-md animate-pulse" />
                      ))}
                    </div>
                  ) : dashboardData?.recent_executions && dashboardData.recent_executions.length > 0 ? (
                    <div className="space-y-2">
                      {dashboardData.recent_executions.map((execution) => (
                        <ExecutionItem key={execution.id} execution={execution} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={Play}
                      title="暂无执行记录"
                      description="运行工作流后执行记录会显示在这里"
                    />
                  )}
                </div>
              </div>
            </section>

            {/* 系统健康状态 + 运行队列 */}
            <section className="page-section">
              <div className="page-grid grid-cols-1 lg:grid-cols-2">
                {dashboardData?.system_health && (
                  <SystemHealthCard health={dashboardData.system_health} />
                )}
                {dashboardData?.running_queue && (
                  <RunningQueueCard queue={dashboardData.running_queue} />
                )}
              </div>
            </section>

            {/* 排行榜 + 目标追踪 */}
            <section className="page-section">
              <div className="page-grid grid-cols-1 lg:grid-cols-2">
                {dashboardData?.leaderboard && (
                  <LeaderboardCard leaderboard={dashboardData.leaderboard} />
                )}
                {dashboardData?.goals && dashboardData.goals.length > 0 && (
                  <GoalsCard goals={dashboardData.goals} />
                )}
              </div>
            </section>

            {/* 热门模板 */}
            {dashboardData?.featured_templates && dashboardData.featured_templates.length > 0 && (
              <section className="page-section">
                <div className="page-panel">
                  <div className="page-panel-header flex items-center justify-between">
                    <div>
                      <h2 className="page-panel-title">热门模板</h2>
                    </div>
                    <Link
                      href="/template-gallery"
                      className="text-xs text-foreground-muted hover:text-foreground flex items-center gap-1 transition-colors"
                    >
                      查看全部
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="p-5 page-grid grid-cols-2 lg:grid-cols-4">
                    {dashboardData.featured_templates.map((template) => (
                      <TemplateCard key={template.id} template={template} />
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* 收藏夹 */}
            {dashboardData?.favorites && dashboardData.favorites.length > 0 && (
              <section className="page-section">
                <div className="page-panel">
                  <div className="page-panel-header flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-destructive" />
                      <h2 className="page-panel-title">我的收藏</h2>
                    </div>
                    <Link
                      href="/favorites"
                      className="text-xs text-foreground-muted hover:text-foreground flex items-center gap-1 transition-colors"
                    >
                      查看全部
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="p-5 page-grid grid-cols-2 lg:grid-cols-5">
                    {dashboardData.favorites.map((item) => (
                      <FavoriteCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* 成就展示 */}
            {dashboardData?.user_level?.achievements && dashboardData.user_level.achievements.length > 0 && (
              <section className="page-section">
                <div className="page-panel">
                  <div className="page-panel-header">
                    <div className="page-panel-title">成就</div>
                  </div>
                  <div className="p-5 page-grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                    {dashboardData.user_level.achievements.map((achievement) => (
                      <AchievementCard key={achievement.id} achievement={achievement} />
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* 学习资源 */}
            {dashboardData?.learning_resources && dashboardData.learning_resources.length > 0 && (
              <section className="page-section">
                <div className="page-panel">
                  <div className="page-panel-header flex items-center justify-between">
                    <div>
                      <h2 className="page-panel-title">学习资源</h2>
                    </div>
                    <Link
                      href="/docs"
                      className="text-xs text-foreground-muted hover:text-foreground flex items-center gap-1 transition-colors"
                    >
                      查看全部
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="p-5 page-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                    {dashboardData.learning_resources.map((resource) => (
                      <LearningResourceCard key={resource.id} resource={resource} />
                    ))}
                  </div>
                </div>
              </section>
            )}
      </div>

      {/* 底部输入区域 */}
      <div className="sticky bottom-0 left-0 right-0 border-t border-border bg-background-studio">
        <div className="w-full py-4">
          <div className="page-panel p-2">
            <div className={cn(
              "flex items-end gap-3 px-2.5 py-2 rounded-md",
              "focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20",
              "border border-border bg-surface-75 transition-all"
            )}>
              <button className="p-2 rounded-md hover:bg-surface-200 text-foreground-muted hover:text-foreground transition-colors">
                <Paperclip className="w-4 h-4" />
              </button>
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入你想要完成的任务..."
                rows={1}
                className={cn(
                  "flex-1 bg-transparent text-foreground text-sm placeholder:text-foreground-muted",
                  "resize-none outline-none leading-relaxed",
                  "min-h-[24px] max-h-[200px]"
                )}
              />
              <button
                onClick={handleSend}
                disabled={!message.trim()}
                className={cn(
                  "p-2 rounded-md transition-all duration-200",
                  message.trim()
                    ? "bg-brand-500 text-background hover:bg-brand-600"
                    : "bg-surface-200 text-foreground-muted cursor-not-allowed"
                )}
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 mt-2 text-[11px] text-foreground-muted">
            <span>AgentFlow 可能会产生不准确的信息</span>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

// 用户等级徽章 - Supabase 风格
function UserLevelBadge({ level }: { level: { level: number; level_name: string; progress: number; current_xp: number; next_level_xp: number } }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-surface-200 flex items-center justify-center">
            <Crown className="w-4 h-4 text-brand-500" />
          </div>
          <div className="space-y-1">
            <div className="text-[11px] text-foreground-muted">当前等级</div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">Lv.{level.level}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium border border-brand-500/30 bg-brand-200/40 text-brand-500">
                {level.level_name}
              </span>
            </div>
          </div>
        </div>
        <span className="text-[11px] text-foreground-muted">{level.progress}%</span>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] text-foreground-muted">
          <span>XP 进度</span>
          <span>{level.current_xp}/{level.next_level_xp} XP</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-surface-200 overflow-hidden">
          <div
            className="h-full bg-brand-500 rounded-full transition-all"
            style={{ width: `${level.progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// 执行趋势图表 - Supabase 风格
function ExecutionTrendChart({ trends }: { trends: { date: string; executions: number; successful_runs: number; failed_runs: number }[] }) {
  const maxValue = Math.max(...trends.map(t => t.executions), 1);
  
  return (
    <div className="flex items-end gap-2 h-32">
      {trends.map((day, index) => {
        const height = (day.executions / maxValue) * 100;
        const successHeight = day.executions > 0 ? (day.successful_runs / day.executions) * height : 0;
        const date = new Date(day.date);
        const dayName = date.toLocaleDateString('zh-CN', { weekday: 'short' });
        
        return (
          <div key={index} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full h-24 flex flex-col justify-end">
              <div
                className="w-full bg-surface-200/80 rounded-md relative overflow-hidden transition-all hover:bg-surface-300"
                style={{ height: `${Math.max(height, 4)}%` }}
              >
                <div
                  className="absolute bottom-0 left-0 right-0 bg-brand-500/70 rounded-md"
                  style={{ height: `${successHeight}%` }}
                />
              </div>
            </div>
            <span className="text-[10px] text-foreground-muted">{dayName}</span>
            <span className="text-xs text-foreground-muted">{day.executions}</span>
          </div>
        );
      })}
    </div>
  );
}

// Token 使用量卡片 - Supabase 风格
function TokenUsageCard({ usage }: { usage: { used_this_month: number; limit: number; usage_percent: number; remaining: number } }) {
  const usageColor = usage.usage_percent > 80 ? "text-destructive" : usage.usage_percent > 50 ? "text-warning" : "text-brand-500";
  const progressColor = usage.usage_percent > 80 ? "bg-destructive" : usage.usage_percent > 50 ? "bg-warning" : "bg-brand-500";

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-stat-number text-foreground">
          {(usage.used_this_month / 1000).toFixed(1)}K
        </span>
        <span className={cn("text-xs font-medium", usageColor)}>
          {usage.usage_percent.toFixed(1)}%
        </span>
      </div>
      <div className="w-full h-1.5 bg-surface-300 rounded-full overflow-hidden mb-3">
        <div
          className={cn("h-full rounded-full transition-all", progressColor)}
          style={{ width: `${Math.min(usage.usage_percent, 100)}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[11px] text-foreground-muted">
        <span>本月用量</span>
        <span>剩余 {(usage.remaining / 1000).toFixed(0)}K</span>
      </div>
    </div>
  );
}

// 模板卡片 - Supabase 风格
function TemplateCard({ template }: { template: TemplateSummary }) {
  const Icon = templateIcons[template.icon] || Zap;
  
  return (
    <Link
      href={`/template-gallery?template=${template.id}`}
      className="page-panel p-4 hover:border-border-strong hover:bg-surface-75 transition-supabase group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-md bg-surface-200 flex items-center justify-center group-hover:bg-surface-300 transition-colors">
          <Icon className="w-4 h-4 text-foreground-muted" />
        </div>
        <div className="flex items-center gap-1 text-warning">
          <Star className="w-3 h-3 fill-current" />
          <span className="text-xs">{template.rating}</span>
        </div>
      </div>
      <h3 className="text-sm font-medium text-foreground mb-1">{template.name}</h3>
      <p className="text-[13px] text-foreground-muted line-clamp-2 mb-2">{template.description}</p>
      <div className="flex items-center gap-2 text-[11px] text-foreground-muted">
        <span>{template.use_count} 次使用</span>
      </div>
    </Link>
  );
}

// 成就卡片 - Supabase 风格
function AchievementCard({ achievement }: { achievement: Achievement }) {
  const Icon = achievementIcons[achievement.icon] || Trophy;
  
  return (
    <div className={cn(
      "p-3 rounded-md border text-center transition-supabase hover:border-border-strong",
      achievement.unlocked
        ? "bg-surface-100 border-brand-500/30 ring-1 ring-brand-500/10"
        : "bg-surface-100 border-border opacity-70"
    )}>
      <div className={cn(
        "w-9 h-9 rounded-md mx-auto mb-2 flex items-center justify-center border border-border",
        achievement.unlocked
          ? "bg-brand-200/40 border-brand-500/30"
          : "bg-surface-200"
      )}>
        <Icon className={cn("w-4 h-4", achievement.unlocked ? "text-brand-500" : "text-foreground-muted")} />
      </div>
      <h4 className={cn("text-xs font-medium mb-0.5", achievement.unlocked ? "text-foreground" : "text-foreground-muted")}>
        {achievement.name}
      </h4>
      <p className="text-[10px] text-foreground-muted line-clamp-1">{achievement.description}</p>
      {!achievement.unlocked && achievement.progress !== undefined && (
        <div className="mt-2 w-full h-1 bg-surface-300 rounded-full overflow-hidden">
          <div
            className="h-full bg-foreground-muted rounded-full"
            style={{ width: `${achievement.progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

// 学习资源卡片 - Supabase 风格
function LearningResourceCard({ resource }: { resource: LearningResource }) {
  const Icon = learningIcons[resource.icon] || BookOpen;
  
  return (
    <Link
      href={resource.url}
      className="page-panel p-4 hover:border-border-strong hover:bg-surface-75 transition-supabase group"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-md bg-surface-200 flex items-center justify-center shrink-0 group-hover:bg-surface-300 transition-colors">
          <Icon className="w-4 h-4 text-foreground-muted" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-medium text-foreground truncate">{resource.title}</h3>
            {resource.is_new && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium border border-brand-500/30 bg-brand-200/40 text-brand-500">
                新
              </span>
            )}
          </div>
          <p className="text-[13px] text-foreground-muted line-clamp-1">{resource.description}</p>
          {resource.duration && (
            <span className="text-[11px] text-foreground-muted mt-1 inline-block">{resource.duration}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

// 统计卡片组件 - Supabase 风格
interface StatCardProps {
  title: string;
  value: number | string;
  subValue?: string;
  icon: React.ElementType;
  trend?: number;
  isLoading?: boolean;
}

function StatCard({ title, value, subValue, icon: Icon, trend, isLoading }: StatCardProps) {
  return (
    <div className="page-panel p-4 transition-supabase hover:border-border-strong">
      {isLoading ? (
        <div className="animate-pulse">
          <div className="h-3 w-20 bg-surface-200 rounded mb-3" />
          <div className="h-8 w-20 bg-surface-200 rounded mb-2" />
          <div className="h-3 w-24 bg-surface-200 rounded" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <span className="text-category">{title}</span>
          <div className="w-8 h-8 rounded-md border border-border/70 bg-surface-200/80 flex items-center justify-center">
              <Icon className="w-4 h-4 text-foreground-muted" />
            </div>
          </div>
          <div className="flex items-end gap-2 mb-1">
            <span className="text-stat-number text-foreground">{value}</span>
            {trend !== undefined && trend !== 0 && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                  trend > 0
                    ? "bg-brand-200/70 text-brand-500"
                    : "bg-destructive-200 text-destructive"
                )}
              >
                {trend > 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {Math.abs(trend).toFixed(1)}%
              </span>
            )}
          </div>
          {subValue && <p className="text-[13px] text-foreground-muted">{subValue}</p>}
        </>
      )}
    </div>
  );
}

// 工作流项组件 - Supabase 风格
function WorkflowItem({ workflow }: { workflow: WorkflowSummary }) {
  const statusColors: Record<string, string> = {
    active: "bg-brand-200 text-brand-500",
    published: "bg-surface-300 text-foreground-muted",
    draft: "bg-surface-200 text-foreground-muted",
    archived: "bg-warning-200 text-warning",
  };

  return (
    <Link
      href={`/workflows/${workflow.id}`}
      className="flex items-center gap-3 p-3 rounded-md hover:bg-surface-75 transition-supabase group"
    >
      <div className="w-9 h-9 rounded-md bg-surface-200 flex items-center justify-center shrink-0">
        <Zap className="w-4 h-4 text-foreground-muted" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-foreground truncate">{workflow.name}</h3>
          <span className={cn(
            "px-1.5 py-0.5 rounded text-[10px] font-medium",
            statusColors[workflow.status] || statusColors.draft
          )}>
            {workflow.status === "active" ? "活跃" : workflow.status === "draft" ? "草稿" : workflow.status}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-foreground-muted">
          <span>运行 {workflow.run_count} 次</span>
          {workflow.success_rate > 0 && <span>成功率 {workflow.success_rate.toFixed(0)}%</span>}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-foreground-muted group-hover:text-foreground transition-colors" />
    </Link>
  );
}

// 活动项组件 - Supabase 风格
function ActivityItem({ activity }: { activity: ActivitySummary }) {
  const Icon = activityIcons[activity.action] || Activity;
  
  return (
    <div className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-surface-75 transition-supabase">
      <div className="w-8 h-8 rounded-md bg-surface-200 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-foreground-muted" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-foreground truncate">{activity.description}</p>
      </div>
      <span className="text-xs text-foreground-muted shrink-0">{activity.time_ago}</span>
    </div>
  );
}

// 执行项组件 - Supabase 风格
function ExecutionItem({ execution }: { execution: ExecutionSummary }) {
  const statusStyles: Record<string, { bg: string; text: string }> = {
    completed: { bg: "bg-brand-200", text: "text-brand-500" },
    failed: { bg: "bg-destructive-200", text: "text-destructive" },
    running: { bg: "bg-surface-200", text: "text-foreground-muted" },
    pending: { bg: "bg-surface-200", text: "text-foreground-muted" },
  };
  const style = statusStyles[execution.status] || statusStyles.pending;

  return (
    <Link
      href={`/executions/${execution.id}`}
      className="flex items-center gap-3 p-3 rounded-md hover:bg-surface-75 transition-supabase group"
    >
      <div className={cn(
        "w-9 h-9 rounded-md flex items-center justify-center shrink-0",
        style.bg
      )}>
        {execution.status === "completed" ? (
          <CheckCircle2 className={cn("w-4 h-4", style.text)} />
        ) : execution.status === "failed" ? (
          <XCircle className={cn("w-4 h-4", style.text)} />
        ) : (
          <Play className={cn("w-4 h-4", style.text)} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-foreground truncate">{execution.workflow_name}</h3>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-foreground-muted">
          <span className={style.text}>
            {getExecutionStatusText(execution.status)}
          </span>
          {execution.duration_ms && <span>{execution.duration_ms}ms</span>}
        </div>
      </div>
      <span className="text-xs text-foreground-muted">{execution.time_ago}</span>
    </Link>
  );
}

// 空状态组件 - Supabase 风格
interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

function EmptyState({ icon: Icon, title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-12 h-12 rounded-md bg-surface-200 flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-foreground-muted" />
      </div>
      <h3 className="text-sm font-medium text-foreground-muted mb-1">{title}</h3>
      <p className="text-[13px] text-foreground-muted mb-4">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-brand-500 text-xs text-background hover:bg-brand-600 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

// 公告图标映射
const announcementIcons: Record<string, React.ElementType> = {
  Rocket: Rocket,
  Bell: Bell,
  Gift: Gift,
  Info: Info,
  AlertCircle: AlertCircle,
};

// 系统公告横幅
function AnnouncementBanner({ announcements }: { announcements: Announcement[] }) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  
  const visibleAnnouncements = announcements.filter(a => !dismissedIds.has(a.id));
  
  if (visibleAnnouncements.length === 0) return null;
  
  const typeColors: Record<string, string> = {
    update: "bg-surface-100 border-border",
    info: "bg-surface-100 border-border",
    success: "bg-brand-200/50 border-brand-500/30",
    warning: "bg-warning-200/50 border-warning/30",
  };
  
  const typeIconColors: Record<string, string> = {
    update: "text-foreground-muted",
    info: "text-foreground-muted",
    success: "text-brand-500",
    warning: "text-warning",
  };

  return (
    <div className="page-panel">
      <div className="page-panel-header flex items-center justify-between">
        <div>
          <h2 className="page-panel-title">系统公告</h2>
          <p className="page-panel-description">最新更新与重要提醒</p>
        </div>
        <span className="text-xs text-foreground-muted">{visibleAnnouncements.length} 条</span>
      </div>
      <div className="p-4 space-y-2">
        {visibleAnnouncements.slice(0, 2).map((announcement) => {
          const Icon = announcementIcons[announcement.icon || "Bell"] || Bell;
          return (
            <div
              key={announcement.id}
              className={cn(
                "relative flex items-center gap-4 p-4 rounded-md border",
                typeColors[announcement.type] || typeColors.info
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-md bg-surface-200 flex items-center justify-center shrink-0",
                typeIconColors[announcement.type] || typeIconColors.info
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-foreground mb-0.5">{announcement.title}</h3>
                <p className="text-xs text-foreground-muted line-clamp-1">{announcement.content}</p>
              </div>
              {announcement.action_url && announcement.action_label && (
                <Link
                  href={announcement.action_url}
                  className="shrink-0 px-3 py-1.5 rounded-md bg-surface-100 text-xs text-foreground hover:bg-surface-75 transition-colors"
                >
                  {announcement.action_label}
                </Link>
              )}
              <button
                onClick={() => setDismissedIds(prev => new Set(prev).add(announcement.id))}
                className="shrink-0 p-1.5 rounded-md hover:bg-surface-100 text-foreground-muted hover:text-foreground/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 每日任务图标映射
const dailyTaskIcons: Record<string, React.ElementType> = {
  LogIn: LogIn,
  Play: Play,
  Plus: Plus,
  LayoutGrid: LayoutGrid,
  Zap: Zap,
};

// 每日任务卡片 - Supabase 风格
function DailyTasksCard({ tasks }: { tasks: DailyTaskInfo }) {
  return (
    <div className="page-panel">
      {/* 头部：签到信息 */}
      <div className="page-panel-header">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md border border-border bg-surface-200 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-brand-500" />
            </div>
            <div>
              <h2 className="page-panel-title">每日任务</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-foreground-muted">连续签到 {tasks.check_in_streak} 天</span>
                <span className="text-xs text-brand-500">+{tasks.today_xp} XP</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-semibold text-foreground">{tasks.completed_tasks}/{tasks.total_tasks}</div>
            <div className="text-xs text-foreground-muted">已完成</div>
          </div>
        </div>
      </div>

      {/* 任务列表 */}
      <div className="p-5 grid grid-cols-2 gap-3">
        {tasks.tasks.map((task) => {
          const Icon = dailyTaskIcons[task.icon] || Zap;
          return (
            <div
              key={task.id}
              className={cn(
                "p-3 rounded-md border transition-colors",
                task.completed
                  ? "bg-brand-200/20 border-brand-500/20"
                  : "bg-surface-75 border-border hover:border-border-strong"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-8 h-8 rounded-md flex items-center justify-center shrink-0 border",
                    task.completed
                      ? "bg-brand-200/30 border-brand-500/30"
                      : "bg-surface-200 border-border"
                  )}
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-brand-500" />
                  ) : (
                    <Icon className="w-4 h-4 text-foreground-muted" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={cn(
                    "text-sm font-medium truncate",
                    task.completed ? "text-brand-500" : "text-foreground"
                  )}>
                    {task.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-foreground-muted">{task.current}/{task.target}</span>
                    <span className="text-xs text-brand-500">+{task.xp_reward} XP</span>
                  </div>
                </div>
              </div>
              {!task.completed && task.progress > 0 && (
                <div className="mt-2 w-full h-1 bg-surface-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500/60 rounded-full transition-all"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 快捷运行卡片
function QuickRunCard({ item }: { item: QuickRunItem }) {
  const handleRun = () => {
    console.log("Running workflow:", item.workflow_id);
    // 实际运行逻辑
  };

  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-surface-100 px-3 py-2 transition-supabase hover:border-border-strong hover:bg-surface-75">
      <div className="w-9 h-9 rounded-md border border-border bg-surface-200 flex items-center justify-center shrink-0">
        <Zap className="w-4 h-4 text-foreground-muted" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-foreground truncate">{item.workflow_name}</h3>
        <div className="flex items-center gap-2 mt-1 text-xs text-foreground-muted">
          <span>{item.run_count} 次</span>
          <span className="rounded-full bg-surface-200/80 px-2 py-0.5 text-[10px] text-foreground-muted">
            {item.success_rate.toFixed(0)}% 成功
          </span>
        </div>
      </div>
      <Button
        variant="outline"
        size="icon"
        onClick={handleRun}
        className="shrink-0 border-brand-500/20 bg-brand-200/20 text-brand-500 hover:bg-brand-200/40"
      >
        <Play className="w-4 h-4" />
      </Button>
    </div>
  );
}

// 收藏卡片
function FavoriteCard({ item }: { item: FavoriteItem }) {
  const typeIcons: Record<string, React.ElementType> = {
    workflow: Zap,
    template: LayoutGrid,
    agent: Bot,
  };
  const Icon = typeIcons[item.type] || Zap;

  return (
    <Link
      href={`/${item.type}s/${item.id}`}
      className="page-panel p-3 hover:bg-surface-75 hover:border-border-strong transition-supabase group"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-md border border-border bg-surface-200 flex items-center justify-center shrink-0 group-hover:bg-surface-300 transition-colors">
          <Icon className="w-4 h-4 text-foreground-muted" />
        </div>
        <Heart className="w-3.5 h-3.5 text-destructive fill-current" />
      </div>
      <h3 className="text-sm font-medium text-foreground truncate mb-0.5">{item.name}</h3>
      <p className="text-xs text-foreground-muted truncate">{item.type === "workflow" ? "工作流" : item.type === "template" ? "模板" : "Agent"}</p>
    </Link>
  );
}

// 性能洞察卡片
function PerformanceInsightsCard({ insights }: { insights: PerformanceInsights }) {
  const scoreColor = insights.overall_score >= 80 ? "text-brand-500" : insights.overall_score >= 60 ? "text-warning" : "text-destructive";
  const scoreRingColor = insights.overall_score >= 80 ? "stroke-brand-500" : insights.overall_score >= 60 ? "stroke-warning" : "stroke-destructive";

  return (
    <div>
      {/* 评分环 */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" className="stroke-foreground-muted/10" strokeWidth="4" />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              className={scoreRingColor}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${(insights.overall_score / 100) * 176} 176`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn("text-lg font-bold", scoreColor)}>{insights.overall_score}</span>
          </div>
        </div>
        <div>
          <div className="text-sm text-foreground mb-1">综合评分</div>
          <div className="text-xs text-foreground-muted">
            平均耗时 {insights.avg_execution_time}ms
          </div>
        </div>
      </div>

      {/* 优化建议 */}
      {insights.suggestions && insights.suggestions.length > 0 && (
        <div className="space-y-2">
          {insights.suggestions.slice(0, 2).map((suggestion, index) => (
            <SuggestionItem key={index} suggestion={suggestion} />
          ))}
        </div>
      )}
    </div>
  );
}

// 优化建议项
function SuggestionItem({ suggestion }: { suggestion: OptimizationSuggestion }) {
  const impactColors: Record<string, string> = {
    high: "bg-destructive-200 text-destructive",
    medium: "bg-warning/20 text-warning",
    low: "bg-brand-500/20 text-brand-500",
  };

  return (
    <div className="p-2.5 rounded-md bg-surface-75 hover:bg-surface-100 transition-supabase">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-medium text-foreground truncate">{suggestion.title}</h4>
          <p className="text-[10px] text-foreground-muted mt-0.5 line-clamp-1">{suggestion.description}</p>
        </div>
        <span className={cn("shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium", impactColors[suggestion.impact])}>
          {suggestion.impact === "high" ? "高" : suggestion.impact === "medium" ? "中" : "低"}
        </span>
      </div>
    </div>
  );
}

// 错误监控卡片
function ErrorMonitorCard({ monitor }: { monitor: ErrorMonitor }) {
  const trendIcon = monitor.error_trend === "up" ? TrendingUp : monitor.error_trend === "down" ? TrendingDown : Activity;
  const trendColor = monitor.error_trend === "up" ? "text-destructive" : monitor.error_trend === "down" ? "text-brand-500" : "text-foreground-muted";

  return (
    <div>
      {/* 统计概览 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-stat-number text-foreground">{monitor.errors_today}</div>
          <div className="text-xs text-foreground-muted">今日错误</div>
        </div>
        <div className={cn("flex items-center gap-1", trendColor)}>
          {React.createElement(trendIcon, { className: "w-4 h-4" })}
          <span className="text-xs">{monitor.error_rate.toFixed(1)}%</span>
        </div>
      </div>

      {/* 最近错误 */}
      {monitor.recent_errors && monitor.recent_errors.length > 0 ? (
        <div className="space-y-2">
          {monitor.recent_errors.slice(0, 3).map((error) => (
            <ErrorItem key={error.id} error={error} />
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-foreground-muted text-xs">
          <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-brand-500" />
          暂无错误
        </div>
      )}
    </div>
  );
}

// 错误项
function ErrorItem({ error }: { error: ErrorRecord }) {
  const severityColors: Record<string, string> = {
    critical: "bg-destructive-200 border-destructive/30",
    warning: "bg-warning/20 border-warning/30",
    info: "bg-surface-200 border-border",
  };

  return (
    <div className={cn("p-2 rounded-md border", severityColors[error.severity] || severityColors.info)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-medium text-foreground truncate">{error.workflow_name}</h4>
          <p className="text-[10px] text-foreground-muted mt-0.5 line-clamp-1">{error.error_message}</p>
        </div>
        <span className="text-[10px] text-foreground-muted/70 shrink-0">{error.time_ago}</span>
      </div>
    </div>
  );
}

// 快速笔记卡片
function QuickNotesCard({ notes }: { notes: QuickNote[] }) {
  const [newNote, setNewNote] = useState("");

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      await dashboardApi.createQuickNote(newNote);
      setNewNote("");
      // 刷新笔记列表
    } catch (error) {
      console.error("Failed to create note:", error);
    }
  };

  const noteColors: Record<string, string> = {
    yellow: "bg-warning/10 border-warning/20",
    blue: "bg-surface-200 border-border",
    green: "bg-brand-500/10 border-brand-500/20",
    pink: "bg-surface-100 border-border",
  };

  return (
    <div>
      {/* 添加笔记 */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
          placeholder="快速记录..."
          className="flex-1 px-3 py-1.5 rounded-md bg-surface-200 border border-border text-sm text-foreground placeholder:text-foreground-muted/70 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
        />
        <button
          onClick={handleAddNote}
          disabled={!newNote.trim()}
          className="px-3 py-1.5 rounded-md bg-brand-500 text-background hover:bg-brand-600 disabled:bg-surface-200 disabled:text-foreground-muted disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* 笔记列表 */}
      {notes.length > 0 ? (
        <div className="space-y-2">
          {notes.map((note) => (
            <div
              key={note.id}
              className={cn(
                "p-2.5 rounded-md border",
                noteColors[note.color || "yellow"]
              )}
            >
              <div className="flex items-start gap-2">
                {note.pinned && <Pin className="w-3 h-3 text-foreground-muted shrink-0 mt-0.5" />}
                <p className="text-xs text-foreground/80 flex-1">{note.content}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-foreground-muted text-xs">
          添加你的第一条笔记
        </div>
      )}
    </div>
  );
}

// API 使用统计卡片
function APIUsageCard({ stats }: { stats: APIUsageStats }) {
  const usageColor = stats.usage_percent > 80 ? "text-destructive" : stats.usage_percent > 50 ? "text-warning" : "text-brand-500";
  
  return (
    <div className="page-panel">
      <div className="page-panel-header flex items-center justify-between">
        <h2 className="page-panel-title">API 使用统计</h2>
        <Server className="w-4 h-4 text-foreground-muted" />
      </div>

      <div className="p-5">
        <div className="page-grid grid-cols-2 lg:grid-cols-4 mb-4">
          <div>
            <div className="text-xl font-semibold text-foreground">{stats.calls_today}</div>
            <div className="text-xs text-foreground-muted">今日调用</div>
          </div>
          <div>
            <div className="text-xl font-semibold text-foreground">{stats.calls_this_week}</div>
            <div className="text-xs text-foreground-muted">本周调用</div>
          </div>
          <div>
            <div className="text-xl font-semibold text-foreground">{stats.avg_latency_ms}ms</div>
            <div className="text-xs text-foreground-muted">平均延迟</div>
          </div>
          <div>
            <div className={cn("text-xl font-semibold", usageColor)}>{stats.usage_percent.toFixed(1)}%</div>
            <div className="text-xs text-foreground-muted">配额使用</div>
          </div>
        </div>

        {/* 每日使用量图表 */}
        <div className="flex items-end gap-1 h-16">
          {stats.daily_usage.map((day, index) => {
            const maxCalls = Math.max(...stats.daily_usage.map(d => d.calls), 1);
            const height = (day.calls / maxCalls) * 100;
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-surface-200 hover:bg-surface-300 rounded-t transition-colors"
                  style={{ height: `${Math.max(height, 4)}%` }}
                  title={`${day.calls} 次调用`}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-foreground-muted/70">
          <span>7 天前</span>
          <span>今天</span>
        </div>
      </div>
    </div>
  );
}

// 集成图标映射
const integrationIcons: Record<string, React.ElementType> = {
  Slack: MessageCircle,
  Github: Github,
  MessageCircle: MessageCircle,
  FileText: FileText,
  Sparkles: Sparkles,
  Chrome: Chrome,
};

// 集成状态卡片
function IntegrationStatusCard({ status }: { status: IntegrationStatus }) {
  const statusColors: Record<string, string> = {
    connected: "bg-brand-500",
    disconnected: "bg-surface-200",
    error: "bg-destructive",
    pending: "bg-warning",
  };

  return (
    <div>
      {/* 概览 */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-brand-500" />
          <span className="text-xs text-foreground/80">{status.connected_count} 已连接</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-surface-200" />
          <span className="text-xs text-foreground/80">{status.disconnected_count} 未连接</span>
        </div>
      </div>

      {/* 集成列表 */}
      <div className="space-y-2">
        {status.integrations.slice(0, 5).map((integration) => {
          const Icon = integrationIcons[integration.icon] || Link2;
          return (
            <div
              key={integration.id}
              className="flex items-center gap-3 p-2 rounded-md hover:bg-surface-75 transition-supabase"
            >
            <div className="w-8 h-8 rounded-md bg-surface-200 flex items-center justify-center">
                <Icon className="w-4 h-4 text-foreground-muted" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm text-foreground truncate">{integration.name}</h4>
                {integration.error_msg && (
                  <p className="text-[10px] text-destructive truncate">{integration.error_msg}</p>
                )}
              </div>
              <div className={cn("w-2 h-2 rounded-full", statusColors[integration.status])} />
            </div>
          );
        })}
      </div>

      {/* 管理链接 */}
      <Link
        href="/settings/integrations"
        className="flex items-center justify-center gap-1 mt-3 py-2 rounded-md bg-surface-75 text-xs text-foreground/80 hover:bg-surface-100 hover:text-foreground transition-colors"
      >
        管理集成
        <ChevronRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

// 计划任务卡片
function ScheduledTasksCard({ tasks }: { tasks: ScheduledTask[] }) {
  const statusColors: Record<string, string> = {
    active: "text-brand-500",
    paused: "text-warning",
    error: "text-destructive",
  };

  return (
    <div className="space-y-2">
      {tasks.slice(0, 4).map((task) => (
        <Link
          key={task.id}
          href={`/workflows/${task.workflow_id}`}
          className="flex items-center gap-3 p-2 rounded-md hover:bg-surface-75 transition-supabase group"
        >
          <div className="w-9 h-9 rounded-md bg-surface-200 flex items-center justify-center shrink-0 group-hover:bg-surface-300 transition-colors">
            <TimerIcon className="w-4 h-4 text-foreground-muted" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm text-foreground truncate">{task.workflow_name}</h4>
            <div className="flex items-center gap-2 text-[10px] text-foreground-muted">
              <span className={statusColors[task.status]}>{task.time_until}</span>
              <span>·</span>
              <span>{task.run_count} 次运行</span>
            </div>
          </div>
          <Play className="w-4 h-4 text-foreground/20 group-hover:text-foreground-muted transition-colors" />
        </Link>
      ))}
    </div>
  );
}

// 通知类型图标映射
const notificationIcons: Record<string, React.ElementType> = {
  CheckCircle: CheckCircle2,
  AlertTriangle: AlertTriangle,
  Sparkles: Sparkles,
  XCircle: XCircle,
  Server: Server,
};

// 通知中心卡片
function NotificationCenterCard({ notifications }: { notifications: NotificationCenter }) {
  const typeColors: Record<string, string> = {
    success: "bg-brand-200 border-brand-500/30",
    warning: "bg-warning/20 border-warning/30",
    error: "bg-destructive-200 border-destructive/30",
    info: "bg-surface-200 border-border",
    system: "bg-surface-200 border-border",
  };

  const handleMarkRead = async (id: string) => {
    try {
      await dashboardApi.markNotificationRead(id);
    } catch (error) {
      console.error("Failed to mark notification read:", error);
    }
  };

  return (
    <div className="space-y-2">
      {notifications.notifications.slice(0, 4).map((notification) => {
        const Icon = notificationIcons[notification.icon || "Info"] || Info;
        return (
          <div
            key={notification.id}
            onClick={() => !notification.is_read && handleMarkRead(notification.id)}
            className={cn(
              "p-2.5 rounded-md border cursor-pointer transition-supabase",
              typeColors[notification.type] || typeColors.info,
              !notification.is_read && "ring-1 ring-border/50"
            )}
          >
            <div className="flex items-start gap-2">
              <Icon className="w-4 h-4 text-foreground/80 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-medium text-foreground truncate">{notification.title}</h4>
                <p className="text-[10px] text-foreground-muted mt-0.5 line-clamp-1">{notification.message}</p>
              </div>
              <span className="text-[10px] text-foreground-muted/70 shrink-0">{notification.time_ago}</span>
            </div>
          </div>
        );
      })}

      {notifications.has_more && (
        <Link
          href="/notifications"
          className="flex items-center justify-center gap-1 py-2 rounded-md border border-border bg-surface-100/50 text-xs text-foreground/80 hover:bg-surface-100 hover:text-foreground transition-colors"
        >
          查看全部
          <ChevronRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}

// AI 建议图标映射
const aiSuggestionIcons: Record<string, React.ElementType> = {
  Zap: Zap,
  FileEdit: FileEdit,
  TrendingUp: TrendingUp,
  Gauge: Gauge,
  Sparkles: Sparkles,
  Lightbulb: Lightbulb,
};

// AI 建议卡片
function AISuggestionsCard({ suggestions }: { suggestions: AISuggestion[] }) {
  const typeColors: Record<string, string> = {
    optimization: "bg-surface-100 border-border",
    feature: "bg-surface-100 border-border",
    warning: "bg-warning-200/50 border-warning/30",
    tip: "bg-brand-200/50 border-brand-500/30",
  };

  const typeIconColors: Record<string, string> = {
    optimization: "text-foreground-muted",
    feature: "text-foreground-muted",
    warning: "text-warning",
    tip: "text-brand-500",
  };

  return (
    <div className="page-panel">
      <div className="page-panel-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-foreground-muted" />
          <h2 className="page-panel-title">AI 智能建议</h2>
        </div>
        <span className="text-xs text-foreground-muted">{suggestions.length} 条建议</span>
      </div>

      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        {suggestions.map((suggestion) => {
          const Icon = aiSuggestionIcons[suggestion.icon] || Lightbulb;
          return (
            <div
              key={suggestion.id}
              className={cn(
                "p-4 rounded-md border transition-supabase hover:border-border-strong",
                typeColors[suggestion.type] || typeColors.tip
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-md bg-surface-200 flex items-center justify-center shrink-0",
                  typeIconColors[suggestion.type] || typeIconColors.tip
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium text-foreground truncate">{suggestion.title}</h3>
                    <span className="text-[10px] text-foreground-muted">{suggestion.confidence}%</span>
                  </div>
                  <p className="text-xs text-foreground-muted line-clamp-2 mb-2">{suggestion.description}</p>
                  {suggestion.action_url && suggestion.action_label && (
                    <Link
                      href={suggestion.action_url}
                      className="inline-flex items-center gap-1 text-xs text-foreground/90 hover:text-foreground transition-colors"
                    >
                      {suggestion.action_label}
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 排行榜徽章颜色 - Supabase 风格
const badgeColors: Record<string, string> = {
  gold: "bg-warning",
  silver: "bg-foreground-muted",
  bronze: "bg-warning/70",
};

// 排行榜卡片
function LeaderboardCard({ leaderboard }: { leaderboard: Leaderboard }) {
  const rankChangeColor = leaderboard.rank_change > 0 
    ? "text-brand-500" 
    : leaderboard.rank_change < 0 
    ? "text-destructive" 
    : "text-foreground-muted";

  return (
    <div className="page-panel">
      <div className="page-panel-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Medal className="w-5 h-5 text-warning" />
          <h2 className="page-panel-title">活跃排行榜</h2>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="w-4 h-4 text-foreground-muted" />
          <span className="text-xs text-foreground-muted">{leaderboard.total_users} 用户</span>
        </div>
      </div>

      <div className="p-5">
        {/* 用户排名概览 */}
        <div className="page-panel flex items-center gap-4 p-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-surface-200 flex items-center justify-center">
            <span className="text-xl font-bold text-foreground">#{leaderboard.current_rank}</span>
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-foreground">你的排名</div>
            <div className="flex items-center gap-2 text-xs">
              <span className={rankChangeColor}>
                {leaderboard.rank_change > 0 ? `↑${leaderboard.rank_change}` : leaderboard.rank_change < 0 ? `↓${Math.abs(leaderboard.rank_change)}` : "—"}
              </span>
              <span className="text-foreground-muted">本周</span>
            </div>
          </div>
          {leaderboard.user_stats && (
            <div className="text-right">
              <div className="text-lg font-semibold text-foreground">{leaderboard.user_stats.score}</div>
              <div className="text-[10px] text-foreground-muted">积分</div>
            </div>
          )}
        </div>

        {/* Top 用户列表 */}
        <div className="space-y-2">
          {leaderboard.top_users.slice(0, 5).map((user, index) => (
            <div
              key={user.user_id}
              className="flex items-center gap-3 p-2 rounded-md hover:bg-surface-75 transition-supabase"
            >
              {/* 排名 */}
              <div className="w-6 text-center">
                {user.badge ? (
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center",
                    badgeColors[user.badge]
                  )}>
                    <span className="text-[10px] font-bold text-foreground">{user.rank}</span>
                  </div>
                ) : (
                  <span className="text-sm text-foreground-muted">{user.rank}</span>
                )}
              </div>

              {/* 头像 */}
              <div className="w-8 h-8 rounded-full bg-surface-100 overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-4 h-4 text-foreground-muted/70" />
                  </div>
                )}
              </div>

              {/* 用户名 */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm text-foreground truncate">{user.username}</h4>
                <div className="text-[10px] text-foreground-muted">
                  {user.execution_count} 次执行 · {user.success_rate.toFixed(1)}%
                </div>
              </div>

              {/* 积分 */}
              <div className="text-sm font-medium text-foreground/70">{user.score}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 目标图标映射
const goalIcons: Record<string, React.ElementType> = {
  Zap: Zap,
  Layers: Layers,
  Target: Target,
  Flame: Flame,
};

// 目标颜色映射
const goalColors: Record<string, { bg: string; border: string; text: string }> = {
  violet: { bg: "bg-surface-100/80", border: "border-border/70", text: "text-foreground-muted" },
  cyan: { bg: "bg-surface-100/80", border: "border-border/70", text: "text-foreground-muted" },
  emerald: { bg: "bg-brand-200/50", border: "border-brand-500/30", text: "text-brand-500" },
  orange: { bg: "bg-warning-200/50", border: "border-warning/30", text: "text-warning" },
};

// 目标追踪卡片
function GoalsCard({ goals }: { goals: Goal[] }) {
  const completedCount = goals.filter(g => g.status === "completed").length;

  return (
    <div className="page-panel">
      <div className="page-panel-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListTodo className="w-5 h-5 text-foreground-muted" />
          <h2 className="page-panel-title">目标追踪</h2>
        </div>
        <span className="text-xs text-foreground-muted">{completedCount}/{goals.length} 已完成</span>
      </div>

      <div className="p-5 space-y-3">
        {goals.map((goal) => {
          const Icon = goalIcons[goal.icon] || Target;
          const colors = goalColors[goal.color] || goalColors.violet;
          const isCompleted = goal.status === "completed";

          return (
            <div
              key={goal.id}
              className={cn(
                "p-3 rounded-md border transition-supabase hover:border-border-strong",
                colors.bg,
                colors.border,
                isCompleted && "opacity-60"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-9 h-9 rounded-md bg-surface-200 flex items-center justify-center shrink-0",
                  colors.text
                )}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-medium text-foreground truncate">{goal.title}</h3>
                    <span className={cn("text-xs font-medium", colors.text)}>
                      {goal.progress.toFixed(0)}%
                    </span>
                  </div>
                  
                  {/* 进度条 */}
                  <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden mb-1.5">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        isCompleted ? "bg-brand-500" : "bg-surface-200/40"
                      )}
                      style={{ width: `${Math.min(goal.progress, 100)}%` }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between text-[10px] text-foreground-muted">
                    <span>{goal.current_value} / {goal.target_value}</span>
                    {goal.deadline && (
                      <span>截止: {new Date(goal.deadline).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 服务图标映射
const serviceIcons: Record<string, React.ElementType> = {
  Server: Server,
  Database: Database,
  Zap: Zap,
  BrainCircuit: BrainCircuit,
  HardDrive: HardDrive,
  Globe: Globe,
};

// 系统健康状态卡片
function SystemHealthCard({ health }: { health: SystemHealth }) {
  const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
    healthy: { bg: "bg-brand-500/20", text: "text-brand-500", dot: "bg-brand-500" },
    degraded: { bg: "bg-warning/20", text: "text-warning", dot: "bg-warning" },
    down: { bg: "bg-destructive-200", text: "text-destructive", dot: "bg-destructive" },
  };

  const serviceStatusColors: Record<string, string> = {
    operational: "bg-brand-500",
    degraded: "bg-warning",
    down: "bg-destructive",
  };

  const overallColors = statusColors[health.overall_status] || statusColors.healthy;

  return (
    <div className="page-panel">
      <div className="page-panel-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-brand-500" />
          <h2 className="page-panel-title">系统状态</h2>
        </div>
        <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-full", overallColors.bg)}>
          <div className={cn("w-2 h-2 rounded-full", overallColors.dot)} />
          <span className={cn("text-xs font-medium", overallColors.text)}>
            {health.overall_status === "healthy" ? "正常" : health.overall_status === "degraded" ? "部分异常" : "故障"}
          </span>
        </div>
      </div>

      <div className="p-5">
        {/* 系统指标 */}
        {health.metrics && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="page-panel p-2 bg-surface-100/60">
              <div className="flex items-center gap-1 mb-1">
                <Cpu className="w-3 h-3 text-foreground-muted" />
                <span className="text-[10px] text-foreground-muted">CPU</span>
              </div>
              <div className="text-sm font-medium text-foreground">{health.metrics.cpu_usage.toFixed(1)}%</div>
            </div>
            <div className="page-panel p-2 bg-surface-100/60">
              <div className="flex items-center gap-1 mb-1">
                <Database className="w-3 h-3 text-foreground-muted" />
                <span className="text-[10px] text-foreground-muted">内存</span>
              </div>
              <div className="text-sm font-medium text-foreground">{health.metrics.memory_usage.toFixed(1)}%</div>
            </div>
            <div className="page-panel p-2 bg-surface-100/60">
              <div className="flex items-center gap-1 mb-1">
                <HardDrive className="w-3 h-3 text-foreground-muted" />
                <span className="text-[10px] text-foreground-muted">磁盘</span>
              </div>
              <div className="text-sm font-medium text-foreground">{health.metrics.disk_usage.toFixed(1)}%</div>
            </div>
          </div>
        )}

        {/* 服务列表 */}
        <div className="space-y-2">
          {health.services.slice(0, 4).map((service) => {
            const Icon = serviceIcons[service.icon] || Server;
            return (
              <div
                key={service.name}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-surface-75 transition-supabase"
              >
                <div className="w-8 h-8 rounded-md bg-surface-200 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-foreground-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm text-foreground truncate">{service.name}</h4>
                  <div className="text-[10px] text-foreground-muted">
                    {service.latency_ms}ms · {service.uptime_percent.toFixed(2)}%
                  </div>
                </div>
                <div className={cn("w-2 h-2 rounded-full", serviceStatusColors[service.status])} />
              </div>
            );
          })}
        </div>

        {/* 更多统计 */}
        {health.metrics && (
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-foreground-muted">
            <span>{health.metrics.active_connections} 连接</span>
            <span>{health.metrics.requests_per_sec} 请求/秒</span>
            <span>延迟 {health.metrics.avg_latency_ms}ms</span>
          </div>
        )}
      </div>
    </div>
  );
}

// 运行队列卡片
function RunningQueueCard({ queue }: { queue: RunningQueue }) {
  const healthColors: Record<string, { bg: string; text: string }> = {
    healthy: { bg: "bg-brand-500/20", text: "text-brand-500" },
    busy: { bg: "bg-warning/20", text: "text-warning" },
    overloaded: { bg: "bg-destructive-200", text: "text-destructive" },
  };

  const colors = healthColors[queue.queue_health] || healthColors.healthy;

  return (
    <div className="page-panel">
      <div className="page-panel-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-foreground-muted" />
          <h2 className="page-panel-title">运行队列</h2>
        </div>
        <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-full", colors.bg)}>
          <span className={cn("text-xs font-medium", colors.text)}>
            {queue.queue_health === "healthy" ? "空闲" : queue.queue_health === "busy" ? "繁忙" : "过载"}
          </span>
        </div>
      </div>

      <div className="p-5">
        {/* 队列统计 */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="page-panel p-2">
            <div className="flex items-center gap-1 mb-1">
              <Loader2 className="w-3 h-3 text-foreground-muted animate-spin" />
              <span className="text-[10px] text-foreground-muted">运行中</span>
            </div>
            <div className="text-lg font-semibold text-foreground">{queue.total_running}</div>
          </div>
          <div className="p-2 rounded-md bg-warning/10 border border-warning/20">
            <div className="flex items-center gap-1 mb-1">
              <CircleDashed className="w-3 h-3 text-warning" />
              <span className="text-[10px] text-warning">等待中</span>
            </div>
            <div className="text-lg font-semibold text-foreground">{queue.total_pending}</div>
          </div>
          <div className="p-2 rounded-md bg-brand-500/10 border border-brand-500/20">
            <div className="flex items-center gap-1 mb-1">
              <CircleCheck className="w-3 h-3 text-brand-500" />
              <span className="text-[10px] text-brand-500">今日完成</span>
            </div>
            <div className="text-lg font-semibold text-foreground">{queue.total_completed_today}</div>
          </div>
        </div>

        {/* 运行中的任务 */}
        {queue.running_tasks.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs text-foreground-muted font-medium">运行中</h3>
            {queue.running_tasks.slice(0, 3).map((task) => (
              <div
                key={task.id}
                className="page-panel p-2 bg-surface-100/60"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm text-foreground truncate">{task.workflow_name}</h4>
                  <span className="text-[10px] text-foreground-muted">{task.progress}%</span>
                </div>
                <div className="h-1 bg-surface-100 rounded-full overflow-hidden mb-1.5">
                  <div
                    className="h-full bg-brand-500 rounded-full transition-all duration-300"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-foreground-muted">
                  <span>{task.current_step || `步骤 1/${task.total_steps}`}</span>
                  {task.duration_ms && <span>{(task.duration_ms / 1000).toFixed(1)}s</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 等待中的任务 */}
        {queue.pending_tasks.length > 0 && (
          <div className="mt-3 space-y-2">
            <h3 className="text-xs text-foreground-muted font-medium">队列中</h3>
            {queue.pending_tasks.slice(0, 2).map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-2 rounded-md bg-surface-100"
              >
                <CircleDashed className="w-4 h-4 text-foreground-muted/70" />
                <span className="text-sm text-foreground/80 truncate">{task.workflow_name}</span>
                <span className="text-[10px] text-foreground-muted/70 ml-auto">优先级 {task.priority}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
