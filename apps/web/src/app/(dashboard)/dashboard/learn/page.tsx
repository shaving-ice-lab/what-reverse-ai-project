"use client";

/**
 * 学习中心页面
 * 提供教程、指南、视频课程等学习资源
 */

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CircularProgress, Progress } from "@/components/ui/progress";
import { PageContainer, PageHeader } from "@/components/dashboard/page-layout";
import {
  GraduationCap,
  Search,
  Play,
  Clock,
  Star,
  BookOpen,
  Video,
  FileText,
  Zap,
  Bot,
  Code,
  Database,
  Users,
  Trophy,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Filter,
  TrendingUp,
  Target,
  Award,
  Flame,
} from "lucide-react";

// 课程分类
const categories = [
  { id: "all", label: "全部", icon: BookOpen },
  { id: "getting-started", label: "入门指南", icon: Sparkles },
  { id: "workflows", label: "工作流", icon: Zap },
  { id: "agents", label: "Agent 开发", icon: Bot },
  { id: "advanced", label: "高级技巧", icon: Code },
  { id: "integration", label: "集成教程", icon: Database },
];

// 难度级别
const levels = [
  { id: "beginner", label: "入门", badgeVariant: "success" },
  { id: "intermediate", label: "中级", badgeVariant: "warning" },
  { id: "advanced", label: "高级", badgeVariant: "destructive" },
] as const;

// 课程数据
const courses = [
  {
    id: "1",
    title: "快速入门：5 分钟创建你的第一个 AI 工作流",
    description: "学习平台基础操作，创建并运行你的第一个自动化工作流",
    category: "getting-started",
    level: "beginner",
    type: "video",
    duration: "5 分钟",
    lessons: 3,
    completedLessons: 3,
    rating: 4.9,
    students: 12500,
    featured: true,
    thumbnail: "/courses/getting-started.jpg",
  },
  {
    id: "2",
    title: "工作流节点详解：从触发器到动作",
    description: "深入了解各种节点类型，掌握工作流设计的核心技能",
    category: "workflows",
    level: "beginner",
    type: "video",
    duration: "25 分钟",
    lessons: 8,
    completedLessons: 5,
    rating: 4.8,
    students: 8900,
    featured: true,
  },
  {
    id: "3",
    title: "构建智能客服 Agent",
    description: "从零开始构建一个能处理客户咨询的智能 Agent",
    category: "agents",
    level: "intermediate",
    type: "video",
    duration: "45 分钟",
    lessons: 12,
    completedLessons: 0,
    rating: 4.7,
    students: 5600,
    featured: true,
  },
  {
    id: "4",
    title: "提示词工程最佳实践",
    description: "学习如何编写高效的提示词，提升 AI 输出质量",
    category: "advanced",
    level: "intermediate",
    type: "article",
    duration: "15 分钟",
    lessons: 5,
    completedLessons: 0,
    rating: 4.9,
    students: 7200,
  },
  {
    id: "5",
    title: "工作流条件分支与错误处理",
    description: "掌握复杂工作流的设计，处理各种边界情况",
    category: "workflows",
    level: "intermediate",
    type: "video",
    duration: "35 分钟",
    lessons: 10,
    completedLessons: 2,
    rating: 4.6,
    students: 4300,
  },
  {
    id: "6",
    title: "集成 Slack：打造团队协作机器人",
    description: "将工作流与 Slack 集成，实现自动化消息通知",
    category: "integration",
    level: "intermediate",
    type: "video",
    duration: "30 分钟",
    lessons: 7,
    completedLessons: 0,
    rating: 4.5,
    students: 3100,
  },
  {
    id: "7",
    title: "高级 Agent 开发：多轮对话与记忆",
    description: "深入 Agent 开发，实现复杂的对话管理和上下文记忆",
    category: "agents",
    level: "advanced",
    type: "video",
    duration: "60 分钟",
    lessons: 15,
    completedLessons: 0,
    rating: 4.8,
    students: 2800,
  },
  {
    id: "8",
    title: "API 调用与 Webhook 配置",
    description: "学习如何通过 API 和 Webhook 扩展平台功能",
    category: "integration",
    level: "advanced",
    type: "article",
    duration: "20 分钟",
    lessons: 6,
    completedLessons: 0,
    rating: 4.4,
    students: 2100,
  },
];

const courseTypeMeta = {
  video: { label: "视频", icon: Video },
  article: { label: "文章", icon: FileText },
} as const;

// 学习路径
const learningPaths = [
  {
    id: "workflow-master",
    title: "工作流大师",
    description: "从入门到精通，成为工作流设计专家",
    courses: 8,
    duration: "4 小时",
    progress: 35,
    icon: Zap,
    tone: "warning",
  },
  {
    id: "agent-developer",
    title: "Agent 开发者",
    description: "掌握 Agent 开发的核心技能",
    courses: 6,
    duration: "3 小时",
    progress: 15,
    icon: Bot,
    tone: "brand",
  },
  {
    id: "automation-pro",
    title: "自动化专家",
    description: "学习高级自动化技巧和最佳实践",
    courses: 10,
    duration: "5 小时",
    progress: 0,
    icon: Target,
    tone: "neutral",
  },
];

const learningPathTones = {
  warning: {
    icon: "bg-warning-200/50 text-warning border-warning/40",
    glow: "bg-gradient-to-br from-warning/10 via-transparent to-transparent",
  },
  brand: {
    icon: "bg-brand-200 text-brand-500 border-brand-400/30",
    glow: "bg-gradient-to-br from-brand-500/10 via-transparent to-transparent",
  },
  neutral: {
    icon: "bg-surface-200 text-foreground-light border-border",
    glow: "bg-gradient-to-br from-surface-200/60 via-transparent to-transparent",
  },
} as const;

export default function LearnPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  const totalLessons = courses.reduce((sum, course) => sum + course.lessons, 0);
  const completedLessons = courses.reduce(
    (sum, course) => sum + course.completedLessons,
    0
  );
  const completedCourses = courses.filter(
    (course) => course.completedLessons >= course.lessons
  ).length;
  const completionRate = totalLessons
    ? Math.round((completedLessons / totalLessons) * 100)
    : 0;
  const totalMinutes = courses.reduce((sum, course) => {
    const minutes = Number(course.duration.match(/\d+/)?.[0] ?? 0);
    return sum + minutes;
  }, 0);
  const completedMinutes = courses.reduce((sum, course) => {
    const minutes = Number(course.duration.match(/\d+/)?.[0] ?? 0);
    const ratio = course.lessons ? course.completedLessons / course.lessons : 0;
    return sum + minutes * ratio;
  }, 0);
  const completedHours = (completedMinutes / 60).toFixed(1);
  const totalHours = Math.round(totalMinutes / 60);
  const overviewStats = [
    {
      label: "已完成课程",
      value: completedCourses,
      hint: `共 ${courses.length} 门`,
      icon: Trophy,
    },
    {
      label: "已完成课时",
      value: `${completedLessons}/${totalLessons}`,
      hint: `${completionRate}% 完成度`,
      icon: CheckCircle2,
    },
    {
      label: "学习时长",
      value: `${completedHours}h`,
      hint: `累计 ${totalHours}h`,
      icon: Clock,
    },
    {
      label: "连续学习",
      value: "5 天",
      hint: "保持学习节奏",
      icon: Flame,
    },
  ];

  // 筛选课程
  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || course.category === selectedCategory;
    const matchesLevel = !selectedLevel || course.level === selectedLevel;
    return matchesSearch && matchesCategory && matchesLevel;
  });

  const featuredCourses = courses.filter((c) => c.featured);
  const inProgressCourses = courses.filter(
    (c) => c.completedLessons > 0 && c.completedLessons < c.lessons
  );

  return (
    <PageContainer className="relative">
      <div className="pointer-events-none absolute -top-28 left-1/2 h-56 w-[70%] -translate-x-1/2 rounded-full bg-brand-500/10 blur-3xl" />
      <div className="pointer-events-none absolute top-20 right-[-8%] h-40 w-64 rounded-full bg-brand-500/5 blur-2xl" />
      <div className="relative space-y-8">
        <PageHeader
          eyebrow="Learning Hub"
          title="学习中心"
          description="探索教程、模板与实战路线，系统提升 AI 工作流能力"
          icon={<GraduationCap className="w-5 h-5" />}
          badge={(
            <Badge
              variant="secondary"
              size="sm"
              icon={<Trophy className="w-3.5 h-3.5" />}
              className="bg-surface-200 text-foreground-light"
            >
              已完成 {completedCourses} 门课程
            </Badge>
          )}
          actions={(
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Filter className="w-3.5 h-3.5" />}
              >
                筛选
              </Button>
              <Button size="sm" leftIcon={<Sparkles className="w-3.5 h-3.5" />}>
                创建学习计划
              </Button>
            </div>
          )}
        />

        <div className="page-divider" />

        <div className="page-grid xl:grid-cols-[1.2fr_0.8fr]">
          <div className="page-panel p-6 space-y-6 relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(62,207,142,0.12),transparent_60%)]" />
            <div className="relative space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="page-caption">Overview</div>
                  <h2 className="text-sm font-medium text-foreground">学习概览</h2>
                  <p className="page-subtle">掌握节奏，持续推进你的学习目标</p>
                </div>
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  学习记录
                </Button>
              </div>

              <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
                <div className="flex items-center gap-4">
                  <CircularProgress
                    value={completionRate}
                    size={104}
                    strokeWidth={8}
                    variant="gradient"
                    showValue
                  />
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-foreground">总体完成度</div>
                    <p className="text-xs text-foreground-light">
                      已完成 {completedLessons} / {totalLessons} 节课 · {completionRate}%
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="success"
                        size="sm"
                        icon={<TrendingUp className="w-3.5 h-3.5" />}
                      >
                        本周 +8%
                      </Badge>
                      <Badge
                        variant="secondary"
                        size="sm"
                        icon={<Award className="w-3.5 h-3.5" />}
                      >
                        连续学习 5 天
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="page-grid flex-1 grid-cols-2 gap-3 lg:gap-3">
                  {overviewStats.map((stat) => {
                    const StatIcon = stat.icon;
                    return (
                      <div
                        key={stat.label}
                        className="rounded-md border border-border bg-surface-75/80 p-3"
                      >
                        <div className="flex items-center justify-between text-xs text-foreground-light">
                          <span>{stat.label}</span>
                          <StatIcon className="h-4 w-4 text-foreground-muted" />
                        </div>
                        <div className="mt-2 text-lg font-semibold text-foreground">
                          {stat.value}
                        </div>
                        <div className="text-[11px] text-foreground-muted">{stat.hint}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="page-panel">
            <div className="page-panel-header flex items-center justify-between">
              <div>
                <div className="page-caption">Continue</div>
                <div className="page-panel-title flex items-center gap-2">
                  <Play className="w-4 h-4 text-brand-500" />
                  继续学习
                </div>
                <p className="page-panel-description">从上次进度继续，保持学习节奏</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  size="sm"
                  className="bg-surface-200 text-foreground-light"
                >
                  {inProgressCourses.length} 门进行中
                </Badge>
                <Button variant="ghost" size="sm">
                  查看全部
                </Button>
              </div>
            </div>
            <div className="p-6 space-y-3">
              {inProgressCourses.length > 0 ? (
                inProgressCourses.slice(0, 3).map((course) => {
                  const progress = (course.completedLessons / course.lessons) * 100;
                  const levelInfo = levels.find((level) => level.id === course.level);
                  const typeMeta =
                    courseTypeMeta[course.type as keyof typeof courseTypeMeta];
                  const TypeIcon = typeMeta.icon;

                  return (
                    <Link
                      key={course.id}
                      href={`/learn/${course.id}`}
                      className="group flex items-center gap-4 rounded-md border border-border bg-surface-75/80 p-4 transition-supabase hover:border-border-strong hover:bg-surface-200/70"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface-200">
                        <TypeIcon className="h-5 w-5 text-foreground-light" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-foreground truncate">
                            {course.title}
                          </span>
                          {levelInfo && (
                            <Badge variant={levelInfo.badgeVariant} size="xs">
                              {levelInfo.label}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <Progress value={progress} size="xs" className="flex-1" />
                          <span className="text-xs text-foreground-muted tabular-nums">
                            {course.completedLessons}/{course.lessons}
                          </span>
                        </div>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-foreground-light group-hover:text-foreground">
                        继续
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </Link>
                  );
                })
              ) : (
                <div className="rounded-md border border-dashed border-border p-4 text-sm text-foreground-light">
                  你已经完成所有课程，开始新的学习路径吧。
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="page-panel">
          <div className="page-panel-header flex items-center justify-between">
            <div>
              <div className="page-caption">Paths</div>
              <div className="page-panel-title flex items-center gap-2">
                <Target className="w-4 h-4 text-brand-500" />
                学习路径
              </div>
              <p className="page-panel-description">系统化学习路线，聚焦实战能力</p>
            </div>
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
              查看全部
            </Button>
          </div>
          <div className="p-6">
            <div className="page-grid md:grid-cols-3">
              {learningPaths.map((path) => {
                const Icon = path.icon;
                const tone =
                  learningPathTones[path.tone as keyof typeof learningPathTones];

                return (
                  <Link
                    key={path.id}
                    href={`/learn/path/${path.id}`}
                    className="group relative overflow-hidden rounded-md border border-border bg-surface-100/80 p-5 transition-supabase hover:border-border-strong hover:bg-surface-75/80"
                  >
                    <div
                      className={cn(
                        "absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100",
                        tone.glow
                      )}
                    />
                    <div className="relative space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-md border",
                              tone.icon
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-foreground">
                              {path.title}
                            </h3>
                            <p className="text-xs text-foreground-light">
                              {path.description}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" size="sm">
                          {path.courses} 课
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-foreground-muted">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {path.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5" />
                          {path.courses} 门课程
                        </span>
                      </div>
                      <div className="space-y-2">
                        <Progress value={path.progress} size="sm" />
                        <div className="flex items-center justify-between text-xs text-foreground-muted">
                          <span>
                            {path.progress > 0 ? `${path.progress}% 已完成` : "尚未开始"}
                          </span>
                          <span className="flex items-center gap-1 text-foreground-light group-hover:text-foreground">
                            进入路径
                            <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div className="page-grid lg:grid-cols-[1.15fr_0.85fr]">
          <div className="page-panel">
            <div className="page-panel-header flex items-center justify-between">
              <div>
                <div className="page-panel-title flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-warning" />
                  推荐课程
                </div>
                <p className="page-panel-description">根据你的学习进度精选内容</p>
              </div>
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                查看更多
              </Button>
            </div>
            <div className="p-6 space-y-4">
              {featuredCourses.slice(0, 3).map((course) => {
                const levelInfo = levels.find((level) => level.id === course.level);
                const typeMeta =
                  courseTypeMeta[course.type as keyof typeof courseTypeMeta];
                const TypeIcon = typeMeta.icon;

                return (
                  <Link
                    key={course.id}
                    href={`/learn/${course.id}`}
                    className="group flex items-start gap-4 rounded-md border border-border bg-surface-100/70 p-4 transition-supabase hover:border-border-strong hover:bg-surface-200/70"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-surface-200">
                      <TypeIcon className="h-5 w-5 text-foreground-light" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-medium text-foreground group-hover:text-brand-500 transition-colors">
                          {course.title}
                        </h3>
                        {levelInfo && (
                          <Badge variant={levelInfo.badgeVariant} size="xs">
                            {levelInfo.label}
                          </Badge>
                        )}
                        <Badge variant="outline" size="xs">
                          {typeMeta.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-foreground-light line-clamp-2">
                        {course.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {course.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 text-warning fill-warning" />
                          {course.rating}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {(course.students / 1000).toFixed(1)}k
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-foreground-muted group-hover:text-foreground" />
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="page-panel p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="page-caption">Quick Wins</div>
                <h3 className="text-sm font-medium text-foreground">今日可完成</h3>
                <p className="text-xs text-foreground-light">用 30 分钟推进学习目标</p>
              </div>
              <Badge variant="success" size="sm">
                新手友好
              </Badge>
            </div>
            <div className="mt-5 space-y-3">
              <div className="rounded-md border border-border bg-surface-100/70 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-200 text-brand-500">
                    <Play className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">5 分钟创建工作流</p>
                    <p className="text-xs text-foreground-light">快速了解核心流程与触发器</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-foreground-muted">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    5 分钟
                  </span>
                  <span className="flex items-center gap-1 text-brand-500">
                    开始学习
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
              <div className="rounded-md border border-border bg-surface-100/70 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-warning-200/60 text-warning">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">提示词工程清单</p>
                    <p className="text-xs text-foreground-light">12 条可复用的提示词模板</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-foreground-muted">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    15 分钟
                  </span>
                  <span className="flex items-center gap-1 text-brand-500">
                    打开资源
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
              <div className="rounded-md border border-border bg-surface-100/70 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-surface-200 text-foreground-light">
                    <Award className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">完成第 1 个里程碑</p>
                    <p className="text-xs text-foreground-light">解锁入门徽章与证书</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-foreground-muted">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    3/5 步骤
                  </span>
                  <span className="flex items-center gap-1 text-brand-500">
                    继续完成
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="page-panel">
          <div className="page-panel-header flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="page-caption">Catalog</div>
              <div className="page-panel-title flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-brand-500" />
                课程目录
              </div>
              <p className="page-panel-description">搜索与筛选课程，构建你的学习路线</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                size="sm"
                className="bg-surface-200 text-foreground-light"
              >
                找到 {filteredCourses.length} 门
              </Badge>
              <Button variant="ghost" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
                高级筛选
              </Button>
            </div>
          </div>
          <div className="p-6 space-y-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="w-full lg:max-w-md">
                <Input
                  placeholder="搜索课程、指南、模板..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  variant="search"
                  inputSize="default"
                  leftIcon={<Search className="h-4 w-4" />}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {levels.map((level) => (
                  <Button
                    key={level.id}
                    variant={selectedLevel === level.id ? "outline-primary" : "secondary"}
                    size="sm"
                    onClick={() =>
                      setSelectedLevel(selectedLevel === level.id ? null : level.id)
                    }
                  >
                    {level.label}
                  </Button>
                ))}
                {selectedLevel && (
                  <Button variant="ghost" size="sm" onClick={() => setSelectedLevel(null)}>
                    清除
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {categories.map((category) => {
                const Icon = category.icon;
                const isActive = selectedCategory === category.id;

                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-md border px-3 py-1.5 text-[12px] font-medium transition-colors",
                      isActive
                        ? "border-brand-500/60 bg-brand-200/40 text-foreground"
                        : "border-border bg-surface-75/80 text-foreground-light hover:border-border-strong hover:text-foreground hover:bg-surface-200/70"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {category.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs text-foreground-light">
              <span>找到 {filteredCourses.length} 门课程</span>
              <span>按热度排序</span>
            </div>

            <div className="page-grid md:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((course) => {
                const levelInfo = levels.find((level) => level.id === course.level);
                const typeMeta =
                  courseTypeMeta[course.type as keyof typeof courseTypeMeta];
                const TypeIcon = typeMeta.icon;
                const progress = (course.completedLessons / course.lessons) * 100;

                return (
                  <Link
                    key={course.id}
                    href={`/learn/${course.id}`}
                    className="group flex h-full flex-col rounded-md border border-border bg-surface-75/80 p-5 transition-supabase hover:border-border-strong hover:bg-surface-200/70"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface-200">
                          <TypeIcon className="h-4 w-4 text-foreground-light" />
                        </div>
                        <div>
                          <div className="text-xs text-foreground-muted">{typeMeta.label}</div>
                          <h3 className="text-sm font-medium text-foreground group-hover:text-brand-500 transition-colors">
                            {course.title}
                          </h3>
                        </div>
                      </div>
                      {course.completedLessons === course.lessons && (
                        <CheckCircle2 className="h-4 w-4 text-brand-500" />
                      )}
                    </div>

                    <p className="mt-3 text-xs text-foreground-light line-clamp-2">
                      {course.description}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {levelInfo && (
                        <Badge variant={levelInfo.badgeVariant} size="xs">
                          {levelInfo.label}
                        </Badge>
                      )}
                      <Badge variant="outline" size="xs">
                        {course.lessons} 节
                      </Badge>
                      <Badge variant="outline" size="xs">
                        {course.duration}
                      </Badge>
                    </div>

                    {progress > 0 && progress < 100 && (
                      <div className="mt-4 flex items-center gap-2">
                        <Progress value={progress} size="xs" className="flex-1" />
                        <span className="text-xs text-foreground-muted tabular-nums">
                          {course.completedLessons}/{course.lessons}
                        </span>
                      </div>
                    )}

                    <div className="mt-auto flex items-center justify-between pt-4 text-xs text-foreground-muted">
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-warning fill-warning" />
                        {course.rating}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {(course.students / 1000).toFixed(1)}k
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
