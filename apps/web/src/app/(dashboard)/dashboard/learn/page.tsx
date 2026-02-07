"use client";

/**
 * LearncenterPage
 * ProvideTutorial, Guide, VideoCourseetcLearnResource
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

// CourseCategory
const categories = [
 { id: "all", label: "allsection", icon: BookOpen },
 { id: "getting-started", label: "Getting StartedGuide", icon: Sparkles },
 { id: "workflows", label: "Workflow", icon: Zap },
 { id: "agents", label: "Agent Development", icon: Bot },
 { id: "advanced", label: "AdvancedTips", icon: Code },
 { id: "integration", label: "IntegrationTutorial", icon: Database },
];

// DifficultyLevel
const levels = [
 { id: "beginner", label: "Getting Started", badgeVariant: "success" },
 { id: "intermediate", label: "", badgeVariant: "warning" },
 { id: "advanced", label: "Advanced", badgeVariant: "destructive" },
] as const;

// CourseData
const courses = [
 {
 id: "1",
 title: "QuickGetting Started: 5 minCreateyou's#1 AI Workflow",
 description: "LearnPlatformBasicAction, CreateandRunyou's#1AutomationWorkflow",
 category: "getting-started",
 level: "beginner",
 type: "video",
 duration: "5 min",
 lessons: 3,
 completedLessons: 3,
 rating: 4.9,
 students: 12500,
 featured: true,
 thumbnail: "/courses/getting-started.jpg",
 },
 {
 id: "2",
 title: "WorkflowNode: fromTriggertoAction",
 description: "entertypeNodeType, MasterWorkflowDesign'sCorecan",
 category: "workflows",
 level: "beginner",
 type: "video",
 duration: "25 min",
 lessons: 8,
 completedLessons: 5,
 rating: 4.8,
 students: 8900,
 featured: true,
 },
 {
 id: "3",
 title: "BuildSmartSupport Agent",
 description: "fromStartBuild1canProcessCustomerConsulting'sSmart Agent",
 category: "agents",
 level: "intermediate",
 type: "video",
 duration: "45 min",
 lessons: 12,
 completedLessons: 0,
 rating: 4.7,
 students: 5600,
 featured: true,
 },
 {
 id: "4",
 title: "PromptBest Practices",
 description: "LearnifwhatWriteEfficient'sPrompt, Improve AI Output",
 category: "advanced",
 level: "intermediate",
 type: "article",
 duration: "15 min",
 lessons: 5,
 completedLessons: 0,
 rating: 4.9,
 students: 7200,
 },
 {
 id: "5",
 title: "WorkflowConditionBranchandErrorProcess",
 description: "MasterComplexWorkflow'sDesign, ProcesstypeEdgeSituation",
 category: "workflows",
 level: "intermediate",
 type: "video",
 duration: "35 min",
 lessons: 10,
 completedLessons: 2,
 rating: 4.6,
 students: 4300,
 },
 {
 id: "6",
 title: "Integration Slack: BuildTeamCollaborationBot",
 description: "willWorkflowand Slack Integration, ImplementAutomationMessageNotifications",
 category: "integration",
 level: "intermediate",
 type: "video",
 duration: "30 min",
 lessons: 7,
 completedLessons: 0,
 rating: 4.5,
 students: 3100,
 },
 {
 id: "7",
 title: "Advanced Agent Development: multipleConversationandMemory",
 description: "enter Agent Development, ImplementComplex'sConversationManageandContextMemory",
 category: "agents",
 level: "advanced",
 type: "video",
 duration: "60 min",
 lessons: 15,
 completedLessons: 0,
 rating: 4.8,
 students: 2800,
 },
 {
 id: "8",
 title: "API Calland Webhook Config",
 description: "LearnifwhatVia API and Webhook ExtendPlatformFeatures",
 category: "integration",
 level: "advanced",
 type: "article",
 duration: "20 min",
 lessons: 6,
 completedLessons: 0,
 rating: 4.4,
 students: 2100,
 },
];

const courseTypeMeta = {
 video: { label: "Video", icon: Video },
 article: { label: "Article", icon: FileText },
} as const;

// LearnPath
const learningPaths = [
 {
 id: "workflow-master",
 title: "Workflowlarge",
 description: "fromGetting StartedtoExpert, asWorkflowDesignExpert",
 courses: 8,
 duration: "4 h",
 progress: 35,
 icon: Zap,
 tone: "warning",
 },
 {
 id: "agent-developer",
 title: "Agent Developers",
 description: "Master Agent Development'sCorecan",
 courses: 6,
 duration: "3 h",
 progress: 15,
 icon: Bot,
 tone: "brand",
 },
 {
 id: "automation-pro",
 title: "AutomationExpert",
 description: "LearnAdvancedAutomationTipsandBest Practices",
 courses: 10,
 duration: "5 h",
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
 label: "CompletedCourse",
 value: completedCourses,
 hint: ` ${courses.length} `,
 icon: Trophy,
 },
 {
 label: "Completedtime",
 value: `${completedLessons}/${totalLessons}`,
 hint: `${completionRate}% Done`,
 icon: CheckCircle2,
 },
 {
 label: "Learntime",
 value: `${completedHours}h`,
 hint: `Cumulative ${totalHours}h`,
 icon: Clock,
 },
 {
 label: "ContinuousLearn",
 value: "5 days",
 hint: "MaintainLearnRhythm",
 icon: Flame,
 },
 ];

 // FilterCourse
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
 title="Learncenter"
 description="ExploreTutorial, TemplateandPracticalline, SystemImprove AI Workflowcanpower"
 icon={<GraduationCap className="w-5 h-5" />}
 badge={(
 <Badge
 variant="secondary"
 size="sm"
 icon={<Trophy className="w-3.5 h-3.5" />}
 className="bg-surface-200 text-foreground-light"
 >
 Completed {completedCourses} Course
 </Badge>
 )}
 actions={(
 <div className="flex items-center gap-2">
 <Button
 variant="secondary"
 size="sm"
 leftIcon={<Filter className="w-3.5 h-3.5" />}
 >
 Filter
 </Button>
 <Button size="sm" leftIcon={<Sparkles className="w-3.5 h-3.5" />}>
 CreateLearnPlan
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
 <h2 className="text-sm font-medium text-foreground">LearnOverview</h2>
 <p className="page-subtle">MasterRhythm, ContinuousAdvanceyou'sLearnTarget</p>
 </div>
 <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
 LearnRecord
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
 <div className="text-sm font-medium text-foreground">totalDone</div>
 <p className="text-xs text-foreground-light">
 Completed {completedLessons} / {totalLessons} · {completionRate}%
 </p>
 <div className="flex flex-wrap items-center gap-2">
 <Badge
 variant="success"
 size="sm"
 icon={<TrendingUp className="w-3.5 h-3.5" />}
 >
 currentweeks +8%
 </Badge>
 <Badge
 variant="secondary"
 size="sm"
 icon={<Award className="w-3.5 h-3.5" />}
 >
 ContinuousLearn 5 days
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
 ContinueLearn
 </div>
 <p className="page-panel-description">fromontimesProgressContinue, MaintainLearnRhythm</p>
 </div>
 <div className="flex items-center gap-2">
 <Badge
 variant="secondary"
 size="sm"
 className="bg-surface-200 text-foreground-light"
 >
 {inProgressCourses.length} In Progress
 </Badge>
 <Button variant="ghost" size="sm">
 View all
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
 Continue
 <ArrowRight className="h-3.5 w-3.5" />
 </span>
 </Link>
 );
 })
 ) : (
 <div className="rounded-md border border-dashed border-border p-4 text-sm text-foreground-light">
 youalreadyDoneAllCourse, Startnew'sLearnPath.
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
 LearnPath
 </div>
 <p className="page-panel-description">SystemLearnline, FocusPracticalcanpower</p>
 </div>
 <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
 View all
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
 {path.courses} 
 </Badge>
 </div>
 <div className="flex items-center gap-3 text-xs text-foreground-muted">
 <span className="flex items-center gap-1">
 <Clock className="h-3.5 w-3.5" />
 {path.duration}
 </span>
 <span className="flex items-center gap-1">
 <BookOpen className="h-3.5 w-3.5" />
 {path.courses} Course
 </span>
 </div>
 <div className="space-y-2">
 <Progress value={path.progress} size="sm" />
 <div className="flex items-center justify-between text-xs text-foreground-muted">
 <span>
 {path.progress > 0 ? `${path.progress}% Completed`: "not yetStart"}
 </span>
 <span className="flex items-center gap-1 text-foreground-light group-hover:text-foreground">
 EnterPath
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
 RecommendedCourse
 </div>
 <p className="page-panel-description">Based onyou'sLearnProgressFeaturedContent</p>
 </div>
 <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
 View more
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
 <h3 className="text-sm font-medium text-foreground">TodaycanDone</h3>
 <p className="text-xs text-foreground-light">use 30 minAdvanceLearnTarget</p>
 </div>
 <Badge variant="success" size="sm">
 newFriendly
 </Badge>
 </div>
 <div className="mt-5 space-y-3">
 <div className="rounded-md border border-border bg-surface-100/70 p-4">
 <div className="flex items-center gap-3">
 <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-200 text-brand-500">
 <Play className="h-4 w-4" />
 </div>
 <div>
 <p className="text-sm font-medium text-foreground">5 minCreateWorkflow</p>
 <p className="text-xs text-foreground-light">QuickCoreFlowandTrigger</p>
 </div>
 </div>
 <div className="mt-3 flex items-center justify-between text-xs text-foreground-muted">
 <span className="flex items-center gap-1">
 <Clock className="h-3.5 w-3.5" />
 5 min
 </span>
 <span className="flex items-center gap-1 text-brand-500">
 StartLearn
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
 <p className="text-sm font-medium text-foreground">PromptChecklist</p>
 <p className="text-xs text-foreground-light">12 canuse'sPromptTemplate</p>
 </div>
 </div>
 <div className="mt-3 flex items-center justify-between text-xs text-foreground-muted">
 <span className="flex items-center gap-1">
 <Clock className="h-3.5 w-3.5" />
 15 min
 </span>
 <span className="flex items-center gap-1 text-brand-500">
 OpenResource
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
 <p className="text-sm font-medium text-foreground">Done# 1 in</p>
 <p className="text-xs text-foreground-light">UnlockGetting StartedBadgeandCertificate</p>
 </div>
 </div>
 <div className="mt-3 flex items-center justify-between text-xs text-foreground-muted">
 <span className="flex items-center gap-1">
 <CheckCircle2 className="h-3.5 w-3.5" />
 3/5 Step
 </span>
 <span className="flex items-center gap-1 text-brand-500">
 ContinueDone
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
 CourseDirectory
 </div>
 <p className="page-panel-description">SearchandFilterCourse, Buildyou'sLearnline</p>
 </div>
 <div className="flex items-center gap-2">
 <Badge
 variant="secondary"
 size="sm"
 className="bg-surface-200 text-foreground-light"
 >
 to {filteredCourses.length} 
 </Badge>
 <Button variant="ghost" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
 AdvancedFilter
 </Button>
 </div>
 </div>
 <div className="p-6 space-y-5">
 <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
 <div className="w-full lg:max-w-md">
 <Input
 placeholder="SearchCourse, Guide, Template..."
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
 Clear
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
 <span>to {filteredCourses.length} Course</span>
 <span>byPopularitySort</span>
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
 {course.lessons} 
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
