"use client";

/**
 * 快速入门 / 引导页面 - Supabase 风格
 * 新用户任务、进度、资源与快捷入口
 */

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Rocket,
  MessageSquare,
  Zap,
  Bot,
  FileText,
  Upload,
  Key,
  Users,
  Check,
  ChevronRight,
  Play,
  BookOpen,
  Lightbulb,
  Star,
  Award,
  ArrowRight,
  Sparkles,
  Target,
  ExternalLink,
  Clock,
  Gift,
} from "lucide-react";

// 入门步骤
const onboardingSteps = [
  {
    id: "conversation",
    title: "开始第一次对话",
    description: "与 AI 进行一次对话，体验智能助手的核心能力",
    icon: MessageSquare,
    href: "/conversations",
    completed: true,
    points: 50,
  },
  {
    id: "workflow",
    title: "创建工作流",
    description: "创建您的第一个自动化工作流，提升工作效率",
    icon: Zap,
    href: "/workflows/new",
    completed: true,
    points: 100,
  },
  {
    id: "agent",
    title: "创建 AI Agent",
    description: "定制一个专属于您的 AI 助手",
    icon: Bot,
    href: "/my-agents/new",
    completed: false,
    points: 150,
  },
  {
    id: "upload",
    title: "上传文件到知识库",
    description: "上传文档，让 AI 基于您的数据进行回答",
    icon: Upload,
    href: "/files",
    completed: false,
    points: 100,
  },
  {
    id: "api-key",
    title: "添加 API 密钥",
    description: "配置您自己的 AI 模型 API 密钥",
    icon: Key,
    href: "/settings/api-keys",
    completed: false,
    points: 75,
  },
  {
    id: "invite",
    title: "邀请团队成员",
    description: "邀请同事一起协作",
    icon: Users,
    href: "/team",
    completed: false,
    points: 200,
  },
];

// 特色功能
const features = [
  {
    title: "AI 智能对话",
    description: "多模型接入，稳定输出高质量结果",
    icon: MessageSquare,
    color: "text-brand-500",
    bgColor: "bg-brand-200/60",
    tag: "核心",
    href: "/conversations",
  },
  {
    title: "工作流自动化",
    description: "可视化编排，自动执行复杂流程",
    icon: Zap,
    color: "text-warning",
    bgColor: "bg-warning-200/60",
    tag: "自动化",
    href: "/workflows",
  },
  {
    title: "AI Agent",
    description: "打造专属 Agent，覆盖垂直场景",
    icon: Bot,
    color: "text-brand-500",
    bgColor: "bg-brand-200/60",
    tag: "Agent",
    href: "/my-agents",
  },
  {
    title: "知识库",
    description: "知识沉淀与引用，快速调用内容",
    icon: FileText,
    color: "text-brand-500",
    bgColor: "bg-brand-200/60",
    tag: "资料库",
    href: "/files",
  },
];

// 学习资源
const learningResources = [
  {
    title: "5 分钟快速上手",
    description: "掌握核心流程与常用能力",
    icon: Play,
    duration: "5 分钟",
    type: "video",
    href: "/learn",
  },
  {
    title: "工作流创建指南",
    description: "从模板开始搭建第一个流程",
    icon: BookOpen,
    duration: "10 分钟",
    type: "tutorial",
    href: "/workflows",
  },
  {
    title: "API 集成文档",
    description: "配置密钥并完成接口调用",
    icon: FileText,
    duration: "15 分钟",
    type: "docs",
    href: "/settings/api-keys",
  },
  {
    title: "最佳实践案例",
    description: "探索高效的自动化范式",
    icon: Lightbulb,
    duration: "阅读",
    type: "article",
    href: "/template-gallery",
  },
];

const resourceTone = {
  video: {
    label: "视频",
    iconBg: "bg-brand-200/60",
    icon: "text-brand-500",
    badge: "bg-brand-200/40 text-brand-500",
  },
  tutorial: {
    label: "教程",
    iconBg: "bg-surface-200",
    icon: "text-foreground-light",
    badge: "bg-surface-200 text-foreground-light",
  },
  docs: {
    label: "文档",
    iconBg: "bg-surface-200",
    icon: "text-foreground-light",
    badge: "bg-surface-200 text-foreground-light",
  },
  article: {
    label: "案例",
    iconBg: "bg-warning-200/40",
    icon: "text-warning",
    badge: "bg-warning-200/40 text-warning",
  },
} as const;

const milestoneTone = {
  brand: {
    iconBg: "bg-brand-200/60",
    icon: "text-brand-500",
  },
  warning: {
    iconBg: "bg-warning-200/60",
    icon: "text-warning",
  },
  neutral: {
    iconBg: "bg-surface-200",
    icon: "text-foreground-light",
  },
} as const;

export default function GettingStartedPage() {
  const completedSteps = onboardingSteps.filter((s) => s.completed).length;
  const totalSteps = onboardingSteps.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;
  const earnedPoints = onboardingSteps
    .filter((s) => s.completed)
    .reduce((sum, s) => sum + s.points, 0);
  const totalPoints = onboardingSteps.reduce((sum, s) => sum + s.points, 0);
  const remainingPoints = Math.max(totalPoints - earnedPoints, 0);
  const nextStep = onboardingSteps.find((step) => !step.completed);
  const NextStepIcon = nextStep?.icon;

  const milestones = [
    {
      id: "tasks",
      label: "已完成任务",
      value: `${completedSteps}/${totalSteps}`,
      icon: Check,
      tone: "brand" as const,
    },
    {
      id: "xp",
      label: "累计 XP",
      value: `${earnedPoints} XP`,
      icon: Award,
      tone: "warning" as const,
    },
    {
      id: "remaining",
      label: "剩余奖励",
      value: `${remainingPoints} XP`,
      icon: Sparkles,
      tone: "brand" as const,
    },
    {
      id: "time",
      label: "预计时长",
      value: "约 20 分钟",
      icon: Clock,
      tone: "neutral" as const,
    },
  ];

  const quickLinks = [
    {
      id: "docs",
      title: "学习中心",
      description: "快速上手与最佳实践",
      icon: BookOpen,
      href: "/learn",
    },
    {
      id: "api",
      title: "API 密钥",
      description: "配置模型与密钥",
      icon: Key,
      href: "/settings/api-keys",
    },
    {
      id: "templates",
      title: "模板库",
      description: "从模板开始自动化",
      icon: FileText,
      href: "/template-gallery",
    },
    {
      id: "team",
      title: "团队协作",
      description: "邀请成员一起使用",
      icon: Users,
      href: "/team",
    },
  ];

  return (
    <div className="page-section p-6 space-y-6">
      <div className="page-header">
        <div>
          <p className="page-caption">Getting Started</p>
          <h1 className="page-title flex items-center gap-2">
            <Rocket className="w-5 h-5 text-brand-500" />
            快速入门
          </h1>
          <p className="page-description">
            完成关键配置，解锁 ReverseAI 的完整自动化能力
          </p>
        </div>
        <div className="page-toolbar">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-border-muted text-foreground-light"
          >
            <Link href="/learn">
              <BookOpen className="w-4 h-4 mr-2" />
              查看文档
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="bg-brand-500 hover:bg-brand-600 text-background"
          >
            <Link href="/conversations">
              <Play className="w-4 h-4 mr-2" />
              开始引导
            </Link>
          </Button>
        </div>
      </div>

      <div className="page-divider" />

      <div className="page-grid md:grid-cols-2 xl:grid-cols-4">
        {milestones.map((milestone) => {
          const Icon = milestone.icon;
          const tone = milestoneTone[milestone.tone];

          return (
            <div
              key={milestone.id}
              className="rounded-md border border-border bg-surface-75/60 p-4"
            >
              <div
                className={cn(
                  "mb-3 inline-flex h-8 w-8 items-center justify-center rounded-md",
                  tone.iconBg
                )}
              >
                <Icon className={cn("w-4 h-4", tone.icon)} />
              </div>
              <p className="text-xs text-foreground-muted">
                {milestone.label}
              </p>
              <p className="text-sm font-semibold text-foreground mt-1">
                {milestone.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="page-grid lg:grid-cols-[1.2fr_0.8fr]">
        <div className="page-panel">
          <div className="page-panel-header flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-brand-200/60">
                <Target className="w-4 h-4 text-brand-500" />
              </div>
              <div>
                <h2 className="page-panel-title">入门任务</h2>
                <p className="page-panel-description">
                  完成关键步骤，解锁完整功能
                </p>
              </div>
            </div>
            <Badge
              variant="secondary"
              className="bg-surface-200 text-foreground-light"
            >
              {completedSteps}/{totalSteps} 已完成
            </Badge>
          </div>

          <div className="p-6 space-y-5">
            <div className="rounded-md border border-border-muted bg-surface-75/70 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  入门进度
                </span>
                <span className="text-xs text-foreground-muted">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
              <Progress value={progressPercentage} size="sm" className="mt-3" />
              <p className="text-xs text-foreground-light mt-3">
                {progressPercentage < 100
                  ? `完成所有步骤可获得 ${remainingPoints} XP 奖励`
                  : "🎉 恭喜！您已完成所有入门任务！"}
              </p>
            </div>

            <div className="space-y-3">
              {onboardingSteps.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = step.completed;

                return (
                  <Link
                    key={step.id}
                    href={step.href}
                    className={cn(
                      "group flex items-center gap-4 rounded-md border p-4 transition-supabase",
                      isCompleted
                        ? "border-brand-400/60 bg-brand-200/30"
                        : "border-border bg-surface-75/60 hover:border-border-strong hover:bg-surface-100"
                    )}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-md shrink-0">
                      {isCompleted ? (
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-500/90">
                          <Check className="w-4 h-4 text-background" />
                        </div>
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-surface-200 text-foreground-muted text-sm font-semibold">
                          {index + 1}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Icon
                          className={cn(
                            "w-4 h-4",
                            isCompleted
                              ? "text-brand-500"
                              : "text-foreground-muted"
                          )}
                        />
                        <h3
                          className={cn(
                            "text-sm font-medium",
                            isCompleted ? "text-brand-500" : "text-foreground"
                          )}
                        >
                          {step.title}
                        </h3>
                        {isCompleted && (
                          <Badge
                            variant="secondary"
                            className="bg-brand-200/40 text-brand-500 text-[11px]"
                          >
                            已完成
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-foreground-light mt-1">
                        {step.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1 text-xs text-foreground-light">
                        <Star className="w-4 h-4 text-warning" />
                        +{step.points} XP
                      </div>
                      <ChevronRight
                        className={cn(
                          "w-4 h-4",
                          isCompleted
                            ? "text-foreground-muted"
                            : "text-foreground-lighter group-hover:text-foreground"
                        )}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="page-panel">
            <div className="page-panel-header flex items-center gap-3">
              <div className="p-2 rounded-md bg-surface-200">
                <Sparkles className="w-4 h-4 text-foreground-light" />
              </div>
              <div>
                <h2 className="page-panel-title">下一步建议</h2>
                <p className="page-panel-description">继续完成关键配置</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {nextStep ? (
                <div className="rounded-md border border-border bg-surface-75/60 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-md bg-brand-200/60">
                        {NextStepIcon && (
                          <NextStepIcon className="w-4 h-4 text-brand-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {nextStep.title}
                        </p>
                        <p className="text-xs text-foreground-light mt-1">
                          {nextStep.description}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-brand-200/40 text-brand-500 text-[11px]"
                    >
                      +{nextStep.points} XP
                    </Badge>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <Button
                      asChild
                      size="sm"
                      className="bg-brand-500 hover:bg-brand-600 text-background"
                    >
                      <Link href={nextStep.href}>继续任务</Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="border-border-muted text-foreground-light"
                    >
                      <Link href="/learn">查看学习资源</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border border-brand-400/40 bg-brand-200/30 p-4 text-sm text-foreground">
                  🎉 你已完成全部入门任务，建议浏览模板库或完善账号设置。
                  <div className="mt-3 flex items-center gap-2">
                    <Button asChild size="sm" variant="outline-primary">
                      <Link href="/template-gallery">浏览模板</Link>
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="border-border-muted text-foreground-light"
                    >
                      <Link href="/settings">账号设置</Link>
                    </Button>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-foreground-muted">
                <Clock className="w-4 h-4" />
                平均完成时长约 20 分钟
              </div>
            </div>
          </div>

          <div className="page-panel">
            <div className="page-panel-header flex items-center gap-3">
              <div className="p-2 rounded-md bg-surface-200">
                <BookOpen className="w-4 h-4 text-foreground-light" />
              </div>
              <div>
                <h2 className="page-panel-title">快速入口</h2>
                <p className="page-panel-description">常用配置与资源</p>
              </div>
            </div>
            <div className="p-6 space-y-3">
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.id}
                    href={link.href}
                    className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-75/60 px-4 py-3 transition-supabase hover:border-border-strong hover:bg-surface-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-surface-200">
                        <Icon className="w-4 h-4 text-foreground-light" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {link.title}
                        </p>
                        <p className="text-xs text-foreground-muted">
                          {link.description}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-foreground-muted" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="page-panel" id="features">
        <div className="page-panel-header flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-surface-200">
              <Sparkles className="w-4 h-4 text-foreground-light" />
            </div>
            <div>
              <h2 className="page-panel-title">探索功能</h2>
              <p className="page-panel-description">
                从核心模块开始构建自动化
              </p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="bg-surface-200 text-foreground-light"
          >
            {features.length} 个模块
          </Badge>
        </div>
        <div className="p-6 grid md:grid-cols-2 gap-4">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <Link
                key={feature.title}
                href={feature.href}
                className="group rounded-md border border-border bg-surface-75/60 p-5 transition-supabase hover:border-border-strong hover:bg-surface-100"
              >
                <div className="flex items-start justify-between gap-4">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-md flex items-center justify-center",
                      feature.bgColor
                    )}
                  >
                    <Icon className={cn("w-5 h-5", feature.color)} />
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-surface-200 text-foreground-muted text-[11px]"
                  >
                    {feature.tag}
                  </Badge>
                </div>
                <h3 className="text-sm font-medium text-foreground mt-4 group-hover:text-brand-500 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-xs text-foreground-light mt-1">
                  {feature.description}
                </p>
                <div className="flex items-center gap-1 mt-4 text-xs text-brand-500">
                  立即体验
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="page-panel" id="resources">
        <div className="page-panel-header flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-surface-200">
              <BookOpen className="w-4 h-4 text-foreground-light" />
            </div>
            <div>
              <h2 className="page-panel-title">学习资源</h2>
              <p className="page-panel-description">
                面向场景的学习路径与文档
              </p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="bg-surface-200 text-foreground-light"
          >
            {learningResources.length} 条资源
          </Badge>
        </div>
        <div className="p-6 grid md:grid-cols-2 gap-4">
          {learningResources.map((resource) => {
            const Icon = resource.icon;
            const tone = resourceTone[resource.type];

            return (
              <Link
                key={resource.title}
                href={resource.href}
                className="group flex items-center gap-4 rounded-md border border-border bg-surface-75/60 p-4 transition-supabase hover:border-border-strong hover:bg-surface-100"
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-md flex items-center justify-center shrink-0",
                    tone.iconBg
                  )}
                >
                  <Icon className={cn("w-4 h-4", tone.icon)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-foreground group-hover:text-brand-500 transition-colors">
                      {resource.title}
                    </h3>
                    <Badge
                      variant="secondary"
                      className={cn("text-[11px]", tone.badge)}
                    >
                      {tone.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-foreground-light mt-1">
                    {resource.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-xs text-foreground-muted">
                  <Clock className="w-4 h-4" />
                  {resource.duration}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="page-grid lg:grid-cols-2">
        <div className="page-panel">
          <div className="page-panel-header flex items-center gap-3">
            <div className="p-2 rounded-md bg-surface-200">
              <Sparkles className="w-4 h-4 text-brand-500" />
            </div>
            <div>
              <h2 className="page-panel-title">快捷键</h2>
              <p className="page-panel-description">
                提升效率的常用操作
              </p>
            </div>
          </div>
          <div className="p-6 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-foreground-light">打开命令面板</span>
              <kbd className="px-2 py-1 rounded-md bg-surface-200 text-foreground-muted text-xs">
                ⌘ K
              </kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground-light">新建对话</span>
              <kbd className="px-2 py-1 rounded-md bg-surface-200 text-foreground-muted text-xs">
                ⌘ N
              </kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground-light">新建工作流</span>
              <kbd className="px-2 py-1 rounded-md bg-surface-200 text-foreground-muted text-xs">
                ⌘ W
              </kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground-light">聚焦输入框</span>
              <kbd className="px-2 py-1 rounded-md bg-surface-200 text-foreground-muted text-xs">
                /
              </kbd>
            </div>
          </div>
        </div>

        <div className="page-panel border-brand-400/50 bg-brand-200/20">
          <div className="p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-md bg-brand-500 flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5 text-background" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground mb-1">
                邀请好友
              </h3>
              <p className="text-xs text-foreground-light mb-4">
                邀请好友注册，双方各获得 1000 次免费 API 调用
              </p>
              <Button
                asChild
                size="sm"
                className="bg-brand-500 hover:bg-brand-600 text-background"
              >
                <Link href="/team">
                  立即邀请
                  <ExternalLink className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="page-panel">
        <div className="p-6 text-center">
          <h3 className="text-sm font-medium text-foreground mb-2">
            需要帮助？
          </h3>
          <p className="text-xs text-foreground-light mb-4">
            如果你在使用过程中遇到问题，可以访问学习中心或提交反馈。
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-border-muted text-foreground-light"
            >
              <Link href="/learn">
                <BookOpen className="w-4 h-4 mr-2" />
                学习中心
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-border-muted text-foreground-light"
            >
              <Link href="/feedback">
                <MessageSquare className="w-4 h-4 mr-2" />
                提交反馈
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
