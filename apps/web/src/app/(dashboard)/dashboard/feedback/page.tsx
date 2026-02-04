"use client";

/**
 * 反馈建议页面 - Supabase 风格
 * 用户反馈、功能建议、Bug 报告
 */

import { type ElementType, useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  ArrowUp,
  Bug,
  CheckCircle2,
  Circle,
  Clock,
  Eye,
  Filter,
  HelpCircle,
  Image,
  Lightbulb,
  Loader2,
  MessageSquare,
  MessageSquarePlus,
  Paperclip,
  Plus,
  Search,
  Send,
  Star,
  ThumbsUp,
  TrendingUp,
  X,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// 反馈类型
const feedbackTypes = [
  {
    id: "feature",
    label: "功能建议",
    icon: Lightbulb,
    color: "text-warning",
    bgColor: "bg-warning-200",
    dot: "bg-warning",
    description: "提出新功能或流程改进建议",
  },
  {
    id: "bug",
    label: "Bug 报告",
    icon: Bug,
    color: "text-destructive",
    bgColor: "bg-destructive-200",
    dot: "bg-destructive-400",
    description: "报告系统问题或异常",
  },
  {
    id: "question",
    label: "使用问题",
    icon: HelpCircle,
    color: "text-brand-500",
    bgColor: "bg-brand-200",
    dot: "bg-brand-500",
    description: "使用过程中的疑问",
  },
  {
    id: "other",
    label: "其他反馈",
    icon: MessageSquarePlus,
    color: "text-foreground-light",
    bgColor: "bg-surface-200",
    dot: "bg-foreground-muted",
    description: "体验感受或其他建议",
  },
];

// 状态配置
const statusConfig = {
  open: {
    label: "待处理",
    color: "text-foreground-light",
    bg: "bg-surface-200",
    dot: "bg-foreground-muted",
    icon: Circle,
  },
  in_progress: {
    label: "处理中",
    color: "text-warning",
    bg: "bg-warning-200",
    dot: "bg-warning",
    icon: Loader2,
  },
  resolved: {
    label: "已解决",
    color: "text-brand-500",
    bg: "bg-brand-200",
    dot: "bg-brand-500",
    icon: CheckCircle2,
  },
  closed: {
    label: "已关闭",
    color: "text-foreground-muted",
    bg: "bg-surface-200",
    dot: "bg-foreground-muted",
    icon: X,
  },
} as const;

// 热门建议
const popularSuggestions = [
  {
    id: "1",
    title: "支持更多第三方集成",
    description: "希望能集成 Notion、Airtable、飞书等更多工具",
    type: "feature",
    votes: 156,
    comments: 23,
    status: "in_progress",
    createdAt: "2026-01-15",
  },
  {
    id: "2",
    title: "增加工作流版本控制",
    description: "能够保存和回滚工作流的历史版本",
    type: "feature",
    votes: 128,
    comments: 18,
    status: "open",
    createdAt: "2026-01-20",
  },
  {
    id: "3",
    title: "移动端 App 支持",
    description: "希望有 iOS 和 Android 原生应用",
    type: "feature",
    votes: 98,
    comments: 12,
    status: "open",
    createdAt: "2026-01-18",
  },
  {
    id: "4",
    title: "自定义 AI 模型参数",
    description: "能够调整 temperature、top_p 等模型参数",
    type: "feature",
    votes: 87,
    comments: 9,
    status: "resolved",
    createdAt: "2026-01-10",
  },
  {
    id: "5",
    title: "批量导入导出功能",
    description: "支持批量导入导出工作流和 Agent",
    type: "feature",
    votes: 76,
    comments: 15,
    status: "open",
    createdAt: "2026-01-22",
  },
];

// 我的反馈
const myFeedback = [
  {
    id: "f1",
    title: "工作流执行日志不够详细",
    description: "希望能看到每个节点的详细执行信息和耗时",
    type: "feature",
    status: "in_progress",
    votes: 12,
    comments: 3,
    createdAt: "2026-01-25",
    reply: "感谢您的建议！我们正在开发更详细的执行日志功能，预计下个版本上线。",
  },
  {
    id: "f2",
    title: "Agent 响应偶尔超时",
    description: "在高峰期使用 Agent 时偶尔出现响应超时的情况",
    type: "bug",
    status: "resolved",
    votes: 5,
    comments: 2,
    createdAt: "2026-01-20",
    reply: "问题已修复，我们优化了服务器响应时间并增加了超时重试机制。",
  },
];

const typeFilterOptions = [
  { id: "all", label: "全部类型", dot: "bg-foreground-muted" },
  ...feedbackTypes.map((type) => ({
    id: type.id,
    label: type.label,
    icon: type.icon,
    dot: type.dot,
  })),
];

const statusFilterOptions = [
  { id: "all", label: "全部状态", dot: "bg-foreground-muted" },
  ...Object.entries(statusConfig).map(([id, config]) => ({
    id,
    label: config.label,
    icon: config.icon,
    dot: config.dot,
  })),
];

type FilterPillProps = {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: ElementType;
  dotClassName?: string;
};

function FilterPill({ label, active, onClick, icon: Icon, dotClassName }: FilterPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] transition-supabase",
        active
          ? "border-border-strong bg-surface-200 text-foreground"
          : "border-border bg-surface-100/40 text-foreground-light hover:text-foreground hover:border-border-strong hover:bg-surface-200/70"
      )}
    >
      {dotClassName && <span className={cn("h-2 w-2 rounded-full", dotClassName)} />}
      {Icon && <Icon className="w-3.5 h-3.5" />}
      <span>{label}</span>
    </button>
  );
}

export default function FeedbackPage() {
  const [activeTab, setActiveTab] = useState("popular");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [feedbackTitle, setFeedbackTitle] = useState("");
  const [feedbackContent, setFeedbackContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [votedItems, setVotedItems] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredSuggestions = useMemo(() => {
    return popularSuggestions.filter((item) => {
      const matchesSearch =
        !normalizedQuery ||
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.description.toLowerCase().includes(normalizedQuery);
      const matchesType = typeFilter === "all" || item.type === typeFilter;
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [normalizedQuery, typeFilter, statusFilter]);

  const filteredMine = useMemo(() => {
    return myFeedback.filter((item) => {
      const matchesSearch =
        !normalizedQuery ||
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.description.toLowerCase().includes(normalizedQuery);
      const matchesType = typeFilter === "all" || item.type === typeFilter;
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [normalizedQuery, typeFilter, statusFilter]);

  const openCount = popularSuggestions.filter(
    (item) => item.status === "open" || item.status === "in_progress"
  ).length;
  const resolvedCount = popularSuggestions.filter((item) => item.status === "resolved").length;
  const closedCount = popularSuggestions.filter((item) => item.status === "closed").length;
  const totalVotes = popularSuggestions.reduce(
    (acc, item) => acc + item.votes + (votedItems.has(item.id) ? 1 : 0),
    0
  );

  const filtersActive =
    typeFilter !== "all" || statusFilter !== "all" || normalizedQuery.length > 0;

  const resetFilters = () => {
    setTypeFilter("all");
    setStatusFilter("all");
    setSearchQuery("");
  };

  const resetForm = () => {
    setShowForm(false);
    setSelectedType(null);
    setFeedbackTitle("");
    setFeedbackContent("");
  };

  // 投票
  const handleVote = (id: string) => {
    const newVoted = new Set(votedItems);
    if (newVoted.has(id)) {
      newVoted.delete(id);
    } else {
      newVoted.add(id);
    }
    setVotedItems(newVoted);
  };

  // 提交反馈
  const handleSubmit = async () => {
    if (!selectedType || !feedbackTitle || !feedbackContent) return;
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    resetForm();
    setActiveTab("mine");
  };

  return (
    <div className="page-section p-6">
      <div className="page-header">
        <div>
          <p className="page-caption">Feedback</p>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="page-title flex items-center gap-2">
              <MessageSquarePlus className="w-5 h-5 text-brand-500" />
              反馈中心
            </h1>
            <Badge
              variant="secondary"
              className="bg-surface-200 text-foreground-muted text-[10px] uppercase tracking-wider"
            >
              Beta
            </Badge>
          </div>
          <p className="page-description">提交建议、报告问题并跟踪处理进度</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              平均响应 2-3 天
            </span>
            <span className="flex items-center gap-1">
              <ThumbsUp className="w-3.5 h-3.5" />
              投票影响优先级
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" />
              每条建议支持讨论
            </span>
          </div>
        </div>
        <div className="page-toolbar">
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-border text-foreground-light hover:text-foreground"
          >
            <HelpCircle className="w-3.5 h-3.5 mr-1.5" />
            反馈准则
          </Button>
          <Button
            size="sm"
            className="h-8 bg-brand-500 text-background hover:bg-brand-600"
            onClick={() => setShowForm(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            提交反馈
          </Button>
        </div>
      </div>

      <div className="page-panel">
        <div className="page-panel-header flex items-center justify-between">
          <div>
            <h2 className="page-panel-title">反馈概览</h2>
            <p className="page-panel-description">提交与投票的实时数据</p>
          </div>
          <Badge
            variant="secondary"
            className="bg-surface-200 text-foreground-muted text-[11px]"
          >
            {openCount} 条待处理
          </Badge>
        </div>
        <div className="p-6">
          <div className="page-grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-md border border-border bg-surface-75/60 p-4 transition-supabase hover:border-border-strong">
              <div className="flex items-center justify-between">
                <span className="page-caption">开放建议</span>
                <TrendingUp className="w-4 h-4 text-foreground-muted" />
              </div>
              <div className="mt-2 text-stat-number text-foreground">{openCount}</div>
              <p className="text-xs text-foreground-light">待处理与处理中</p>
            </div>
            <div className="rounded-md border border-border bg-surface-75/60 p-4 transition-supabase hover:border-border-strong">
              <div className="flex items-center justify-between">
                <span className="page-caption">已解决</span>
                <CheckCircle2 className="w-4 h-4 text-foreground-muted" />
              </div>
              <div className="mt-2 text-stat-number text-foreground">{resolvedCount + closedCount}</div>
              <p className="text-xs text-foreground-light">已关闭与已解决</p>
            </div>
            <div className="rounded-md border border-border bg-surface-75/60 p-4 transition-supabase hover:border-border-strong">
              <div className="flex items-center justify-between">
                <span className="page-caption">总投票</span>
                <ThumbsUp className="w-4 h-4 text-foreground-muted" />
              </div>
              <div className="mt-2 text-stat-number text-foreground">{totalVotes}</div>
              <p className="text-xs text-foreground-light">社区关注度指标</p>
            </div>
            <div className="rounded-md border border-border bg-surface-75/60 p-4 transition-supabase hover:border-border-strong">
              <div className="flex items-center justify-between">
                <span className="page-caption">我的反馈</span>
                <Star className="w-4 h-4 text-foreground-muted" />
              </div>
              <div className="mt-2 text-stat-number text-foreground">{myFeedback.length}</div>
              <p className="text-xs text-foreground-light">已提交的反馈</p>
            </div>
          </div>
        </div>
      </div>

      <div className="page-grid xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="page-panel">
            <div className="page-panel-header">
              <div className="flex items-center justify-between">
                <h2 className="page-panel-title">提交反馈</h2>
                <Badge variant="secondary" className="bg-surface-200 text-foreground-muted text-[10px] tracking-wider">
                  优先级评估
                </Badge>
              </div>
              <p className="page-panel-description">清晰的描述能够更快进入处理队列</p>
            </div>
            <div className="p-5 space-y-5">
              {showForm ? (
                <>
                  <div className="space-y-3">
                    <label className="text-xs font-medium text-foreground">选择反馈类型</label>
                    <div className="grid grid-cols-2 gap-3">
                      {feedbackTypes.map((type) => {
                        const Icon = type.icon;
                        return (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => setSelectedType(type.id)}
                            aria-pressed={selectedType === type.id}
                            className={cn(
                              "rounded-md border p-3 text-left transition-supabase",
                              selectedType === type.id
                                ? "border-brand-400 bg-brand-200/40"
                                : "border-border bg-surface-75/40 hover:border-border-strong hover:bg-surface-200"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={cn(
                                  "w-9 h-9 rounded-md flex items-center justify-center",
                                  type.bgColor
                                )}
                              >
                                <Icon className={cn("w-4 h-4", type.color)} />
                              </div>
                              <div>
                                <div className="text-[13px] font-medium text-foreground">{type.label}</div>
                                <div className="text-xs text-foreground-muted">{type.description}</div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-foreground">标题</label>
                      <Input
                        placeholder="简要描述您的反馈..."
                        value={feedbackTitle}
                        onChange={(e) => setFeedbackTitle(e.target.value)}
                        className="mt-2 h-9 bg-surface-200 border-border text-foreground placeholder:text-foreground-muted focus:border-brand-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground">详细描述</label>
                      <textarea
                        placeholder="请详细描述您的建议或遇到的问题..."
                        value={feedbackContent}
                        onChange={(e) => setFeedbackContent(e.target.value)}
                        rows={6}
                        className="mt-2 w-full px-4 py-3 rounded-md bg-surface-200 border border-border focus:border-brand-400 focus:ring-1 focus:ring-brand-500 outline-none resize-none text-foreground placeholder:text-foreground-muted"
                      />
                    </div>
                  </div>

                  <div className="rounded-md border border-border bg-surface-75/50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-medium text-foreground">附件与截图</div>
                        <div className="text-xs text-foreground-muted mt-1">支持 PNG、JPG 与日志文件</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="xs" className="border-border text-foreground-light">
                          <Image className="w-3.5 h-3.5 mr-1" />
                          添加截图
                        </Button>
                        <Button variant="outline" size="xs" className="border-border text-foreground-light">
                          <Paperclip className="w-3.5 h-3.5 mr-1" />
                          添加附件
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={resetForm} className="border-border">
                      取消
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSubmit}
                      disabled={!selectedType || !feedbackTitle || !feedbackContent || isSubmitting}
                      className="bg-brand-500 hover:bg-brand-600 text-background"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          提交中...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-1" />
                          提交反馈
                        </>
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-md border border-border bg-surface-75/60 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <MessageSquarePlus className="w-4 h-4 text-brand-500" />
                      快速提交
                    </div>
                    <p className="text-xs text-foreground-muted mt-2">
                      选择反馈类型后即可快速开始，越清晰的问题描述越容易被采纳。
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {feedbackTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => {
                            setSelectedType(type.id);
                            setShowForm(true);
                          }}
                          className="rounded-md border border-border bg-surface-100 px-3 py-2 text-left text-xs text-foreground-light hover:text-foreground hover:border-border-strong hover:bg-surface-200 transition-supabase"
                        >
                          <div className="flex items-center gap-2">
                            <Icon className={cn("w-3.5 h-3.5", type.color)} />
                            <span>{type.label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-border text-foreground-light hover:text-foreground"
                    onClick={() => setShowForm(true)}
                  >
                    填写完整反馈
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="page-panel">
            <div className="page-panel-header">
              <h3 className="page-panel-title">反馈准则</h3>
              <p className="page-panel-description">让建议更快被团队采纳</p>
            </div>
            <div className="p-5 space-y-3 text-[13px] text-foreground-light">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-500 mt-0.5" />
                <div>
                  描述背景与目标，让我们了解问题发生的场景。
                </div>
              </div>
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-warning mt-0.5" />
                <div>
                  如果是 Bug，请提供触发步骤与预期/实际结果。
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MessageSquare className="w-4 h-4 text-foreground-muted mt-0.5" />
                <div>
                  合理使用投票与评论，让反馈更容易被看到。
                </div>
              </div>
            </div>
          </div>

          <div className="page-panel">
            <div className="page-panel-header">
              <h3 className="page-panel-title">状态说明</h3>
              <p className="page-panel-description">了解反馈处理的每一步</p>
            </div>
            <div className="p-5 grid gap-3">
              {Object.entries(statusConfig).map(([key, status]) => {
                const StatusIcon = status.icon;
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-md border border-border bg-surface-100 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2 w-2 rounded-full", status.dot)} />
                      <span className="text-[13px] text-foreground">{status.label}</span>
                    </div>
                    <Badge variant="secondary" className={cn(status.bg, status.color)}>
                      <StatusIcon className={cn("w-3 h-3 mr-1", key === "in_progress" && "animate-spin")} />
                      {status.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="page-panel">
            <div className="page-panel-header">
              <h3 className="page-panel-title">需要紧急帮助？</h3>
              <p className="page-panel-description">遇到阻塞问题请联系支持团队</p>
            </div>
            <div className="p-5 grid gap-2">
              <Link href="/help">
                <Button variant="outline" size="sm" className="w-full border-border text-foreground-light hover:text-foreground">
                  <HelpCircle className="w-4 h-4 mr-1.5" />
                  帮助中心
                </Button>
              </Link>
              <Button variant="outline" size="sm" className="w-full border-border text-foreground-light hover:text-foreground">
                <MessageSquare className="w-4 h-4 mr-1.5" />
                在线客服
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="page-panel">
          <div className="page-panel-header">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="page-panel-title">反馈列表</h2>
                <p className="page-panel-description">社区建议与我的反馈进度</p>
              </div>
              <TabsList variant="segment" size="sm" showIndicator className="w-full md:w-auto">
                <TabsTrigger
                  value="popular"
                  variant="segment"
                  icon={<TrendingUp className="w-4 h-4" />}
                  badge={
                    <span className="rounded-full bg-surface-200 px-2 py-0.5 text-[10px] text-foreground-muted">
                      {popularSuggestions.length}
                    </span>
                  }
                >
                  热门建议
                </TabsTrigger>
                <TabsTrigger
                  value="mine"
                  variant="segment"
                  icon={<Star className="w-4 h-4" />}
                  badge={
                    <span className="rounded-full bg-surface-200 px-2 py-0.5 text-[10px] text-foreground-muted">
                      {myFeedback.length}
                    </span>
                  }
                >
                  我的反馈
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="relative w-full xl:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                <Input
                  placeholder="搜索反馈标题或描述..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 bg-surface-200 border-border text-foreground placeholder:text-foreground-muted focus:border-brand-400"
                />
              </div>
              {filtersActive && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="self-start xl:self-auto text-foreground-light hover:text-foreground"
                >
                  清除筛选
                </Button>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="page-caption">类型</span>
                {typeFilterOptions.map((option) => (
                  <FilterPill
                    key={option.id}
                    label={option.label}
                    icon={option.icon}
                    dotClassName={option.dot}
                    active={typeFilter === option.id}
                    onClick={() => setTypeFilter(option.id)}
                  />
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="page-caption">状态</span>
                {statusFilterOptions.map((option) => (
                  <FilterPill
                    key={option.id}
                    label={option.label}
                    icon={option.icon}
                    dotClassName={option.dot}
                    active={statusFilter === option.id}
                    onClick={() => setStatusFilter(option.id)}
                  />
                ))}
              </div>
            </div>

            <TabsContent value="popular" className="mt-0 space-y-3">
              {filteredSuggestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-md border border-border bg-surface-75/60 py-16">
                  <div className="w-12 h-12 rounded-md bg-surface-200 flex items-center justify-center mb-4">
                    <Lightbulb className="w-5 h-5 text-foreground-muted" />
                  </div>
                  <h3 className="text-sm font-medium text-foreground mb-2">没有找到相关建议</h3>
                  <p className="text-xs text-foreground-light">尝试调整搜索或筛选条件</p>
                </div>
              ) : (
                filteredSuggestions.map((item) => {
                  const typeConfig = feedbackTypes.find((t) => t.id === item.type);
                  const status = statusConfig[item.status as keyof typeof statusConfig] || statusConfig.open;
                  const Icon = typeConfig?.icon || Lightbulb;
                  const StatusIcon = status.icon;
                  const hasVoted = votedItems.has(item.id);

                  return (
                    <div
                      key={item.id}
                      className="flex gap-4 p-4 rounded-md bg-surface-100 border border-border hover:border-border-strong hover:bg-surface-75/60 transition-supabase"
                    >
                      <button
                        type="button"
                        onClick={() => handleVote(item.id)}
                        className={cn(
                          "flex flex-col items-center justify-center w-14 h-14 rounded-md border shrink-0 transition-supabase",
                          hasVoted
                            ? "bg-brand-200 border-brand-400 text-brand-500"
                            : "bg-surface-75 border-border text-foreground-muted hover:border-border-strong hover:text-foreground"
                        )}
                      >
                        <ArrowUp className="w-4 h-4" />
                        <span className="text-[12px] font-semibold">
                          {item.votes + (hasVoted ? 1 : 0)}
                        </span>
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant="secondary"
                              className={cn("text-[11px] px-2 py-0.5", typeConfig?.bgColor, typeConfig?.color)}
                            >
                              <Icon className="w-3 h-3 mr-1" />
                              {typeConfig?.label}
                            </Badge>
                            <Badge
                              variant="secondary"
                              className={cn("text-[11px] px-2 py-0.5", status.bg, status.color)}
                            >
                              <StatusIcon
                                className={cn("w-3 h-3 mr-1", item.status === "in_progress" && "animate-spin")}
                              />
                              {status.label}
                            </Badge>
                          </div>
                          <span className="text-xs text-foreground-muted shrink-0">{item.createdAt}</span>
                        </div>

                        <h3 className="text-sm font-medium text-foreground mb-1">{item.title}</h3>
                        <p className="text-[13px] text-foreground-light mb-3">{item.description}</p>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-foreground-muted">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            {item.comments} 条评论
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {item.votes * 12} 次浏览
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            热度 +{Math.round(item.votes / 10)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="mine" className="mt-0 space-y-3">
              {filteredMine.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-md border border-border bg-surface-75/60 py-16">
                  <div className="w-12 h-12 rounded-md bg-surface-200 flex items-center justify-center mb-4">
                    <MessageSquarePlus className="w-5 h-5 text-foreground-muted" />
                  </div>
                  <h3 className="text-sm font-medium text-foreground mb-2">还没有提交反馈</h3>
                  <p className="text-xs text-foreground-light mb-4">分享您的建议帮助我们改进产品</p>
                  <Button onClick={() => setShowForm(true)} size="sm" className="bg-brand-500 hover:bg-brand-600 text-background">
                    <Plus className="w-4 h-4 mr-1" />
                    提交第一个反馈
                  </Button>
                </div>
              ) : (
                filteredMine.map((item) => {
                  const typeConfig = feedbackTypes.find((t) => t.id === item.type);
                  const status = statusConfig[item.status as keyof typeof statusConfig] || statusConfig.open;
                  const Icon = typeConfig?.icon || Lightbulb;
                  const StatusIcon = status.icon;

                  return (
                    <div key={item.id} className="rounded-md border border-border bg-surface-100 p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={cn("text-[11px] px-2 py-0.5", typeConfig?.bgColor, typeConfig?.color)}
                          >
                            <Icon className="w-3 h-3 mr-1" />
                            {typeConfig?.label}
                          </Badge>
                          <Badge variant="secondary" className={cn("text-[11px] px-2 py-0.5", status.bg, status.color)}>
                            <StatusIcon
                              className={cn("w-3 h-3 mr-1", item.status === "in_progress" && "animate-spin")}
                            />
                            {status.label}
                          </Badge>
                        </div>
                        <span className="text-xs text-foreground-muted">{item.createdAt}</span>
                      </div>

                      <h3 className="text-sm font-medium text-foreground mb-1">{item.title}</h3>
                      <p className="text-[13px] text-foreground-light">{item.description}</p>

                      {item.reply && (
                        <div className="mt-4 rounded-md border border-border bg-surface-75/80 p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-4 h-4 text-brand-500" />
                            <span className="text-[13px] font-medium text-foreground">官方回复</span>
                          </div>
                          <p className="text-[13px] text-foreground-light">{item.reply}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-4 mt-4 text-xs text-foreground-muted">
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-4 h-4" />
                          {item.votes} 人支持
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          {item.comments} 条评论
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
