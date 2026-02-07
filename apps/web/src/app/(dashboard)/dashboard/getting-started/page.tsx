"use client";

/**
 * QuickGetting Started / GuidePage - Supabase Style
 * newUserTask, Progress, ResourceandShortcutEntry
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

// Getting StartedStep
const onboardingSteps = [
 {
 id: "conversation",
 title: "Start#1timesConversation",
 description: "and AI Proceed1timesConversation, ExperienceSmartAssistant'sCorecanpower",
 icon: MessageSquare,
 href: "/dashboard/conversations",
 completed: true,
 points: 50,
 },
 {
 id: "workflow",
 title: "CreateWorkflow",
 description: "Createyou's#1AutomationWorkflow, ImproveWorkrate",
 icon: Zap,
 href: "/dashboard/workflows/new",
 completed: true,
 points: 100,
 },
 {
 id: "agent",
 title: "Create AI Agent",
 description: "Customize1Exclusiveatyou's AI Assistant",
 icon: Bot,
 href: "/dashboard/my-agents/new",
 completed: false,
 points: 150,
 },
 {
 id: "upload",
 title: "UploadFiletoKnowledge Base",
 description: "UploadDocument, let AI Based onyou'sDataProceedAnswer",
 icon: Upload,
 href: "/dashboard/files",
 completed: false,
 points: 100,
 },
 {
 id: "api-key",
 title: "Add API Key",
 description: "ConfigyouSelf's AI Model API Key",
 icon: Key,
 href: "/dashboard/settings/api-keys",
 completed: false,
 points: 75,
 },
 {
 id: "invite",
 title: "InviteTeamMember",
 description: "InviteColleague1Collaboration",
 icon: Users,
 href: "/dashboard/team",
 completed: false,
 points: 200,
 },
];

// Features
const features = [
 {
 title: "AI SmartConversation",
 description: "multipleModelConnect, StableOutputResult",
 icon: MessageSquare,
 color: "text-brand-500",
 bgColor: "bg-brand-200/60",
 tag: "Core",
 href: "/dashboard/conversations",
 },
 {
 title: "WorkflowAutomation",
 description: "canvisualOrchestrate, AutoExecuteComplexFlow",
 icon: Zap,
 color: "text-warning",
 bgColor: "bg-warning-200/60",
 tag: "Automation",
 href: "/dashboard/workflows",
 },
 {
 title: "AI Agent",
 description: "BuildExclusive Agent, CoverageVerticalScenario",
 icon: Bot,
 color: "text-brand-500",
 bgColor: "bg-brand-200/60",
 tag: "Agent",
 href: "/dashboard/my-agents",
 },
 {
 title: "Knowledge Base",
 description: "anduse, QuickCallContent",
 icon: FileText,
 color: "text-brand-500",
 bgColor: "bg-brand-200/60",
 tag: "Materials",
 href: "/dashboard/files",
 },
];

// LearnResource
const learningResources = [
 {
 title: "5 minQuickon",
 description: "MasterCoreFlowandusecanpower",
 icon: Play,
 duration: "5 min",
 type: "video",
 href: "/dashboard/learn",
 },
 {
 title: "WorkflowCreateGuide",
 description: "fromTemplateStartBuild#1Flow",
 icon: BookOpen,
 duration: "10 min",
 type: "tutorial",
 href: "/dashboard/workflows",
 },
 {
 title: "API IntegrationDocument",
 description: "ConfigKeyandDoneInterfaceCall",
 icon: FileText,
 duration: "15 min",
 type: "docs",
 href: "/dashboard/settings/api-keys",
 },
 {
 title: "Best PracticesCase Studies",
 description: "ExploreEfficient'sAutomation",
 icon: Lightbulb,
 duration: "Read",
 type: "article",
 href: "/dashboard/template-gallery",
 },
];

const resourceTone = {
 video: {
 label: "Video",
 iconBg: "bg-brand-200/60",
 icon: "text-brand-500",
 badge: "bg-brand-200/40 text-brand-500",
 },
 tutorial: {
 label: "Tutorial",
 iconBg: "bg-surface-200",
 icon: "text-foreground-light",
 badge: "bg-surface-200 text-foreground-light",
 },
 docs: {
 label: "Document",
 iconBg: "bg-surface-200",
 icon: "text-foreground-light",
 badge: "bg-surface-200 text-foreground-light",
 },
 article: {
 label: "Case Studies",
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
 label: "CompletedTask",
 value: `${completedSteps}/${totalSteps}`,
 icon: Check,
 tone: "brand" as const,
 },
 {
 id: "xp",
 label: "Cumulative XP",
 value: `${earnedPoints} XP`,
 icon: Award,
 tone: "warning" as const,
 },
 {
 id: "remaining",
 label: "RemainingRewards",
 value: `${remainingPoints} XP`,
 icon: Sparkles,
 tone: "brand" as const,
 },
 {
 id: "time",
 label: "Estimatedtime",
 value: " 20 min",
 icon: Clock,
 tone: "neutral" as const,
 },
 ];

 const quickLinks = [
 {
 id: "docs",
 title: "Learncenter",
 description: "QuickonandBest Practices",
 icon: BookOpen,
 href: "/dashboard/learn",
 },
 {
 id: "api",
 title: "API Key",
 description: "ConfigModelandKey",
 icon: Key,
 href: "/dashboard/settings/api-keys",
 },
 {
 id: "templates",
 title: "Template Gallery",
 description: "fromTemplateStartAutomation",
 icon: FileText,
 href: "/dashboard/template-gallery",
 },
 {
 id: "team",
 title: "TeamCollaboration",
 description: "InviteMember1Usage",
 icon: Users,
 href: "/dashboard/team",
 },
 ];

 return (
 <div className="page-section p-6 space-y-6">
 <div className="page-header">
 <div>
 <p className="page-caption">Getting Started</p>
 <h1 className="page-title flex items-center gap-2">
 <Rocket className="w-5 h-5 text-brand-500" />
 QuickGetting Started
 </h1>
 <p className="page-description">
 DonekeyConfig, Unlock ReverseAI 'sCompleteAutomationcanpower
 </p>
 </div>
 <div className="page-toolbar">
 <Button
 asChild
 variant="outline"
 size="sm"
 className="border-border-muted text-foreground-light"
 >
 <Link href="/dashboard/learn">
 <BookOpen className="w-4 h-4 mr-2" />
 ViewDocument
 </Link>
 </Button>
 <Button
 asChild
 size="sm"
 className="bg-brand-500 hover:bg-brand-600 text-background"
 >
 <Link href="/dashboard/conversations">
 <Play className="w-4 h-4 mr-2" />
 StartGuide
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
 <h2 className="page-panel-title">Getting StartedTask</h2>
 <p className="page-panel-description">
 DonekeyStep, UnlockCompleteFeatures
 </p>
 </div>
 </div>
 <Badge
 variant="secondary"
 className="bg-surface-200 text-foreground-light"
 >
 {completedSteps}/{totalSteps} Completed
 </Badge>
 </div>

 <div className="p-6 space-y-5">
 <div className="rounded-md border border-border-muted bg-surface-75/70 p-4">
 <div className="flex items-center justify-between">
 <span className="text-sm font-medium text-foreground">
 Getting StartedProgress
 </span>
 <span className="text-xs text-foreground-muted">
 {Math.round(progressPercentage)}%
 </span>
 </div>
 <Progress value={progressPercentage} size="sm" className="mt-3" />
 <p className="text-xs text-foreground-light mt-3">
 {progressPercentage < 100
 ? `DoneAllStepcanObtain ${remainingPoints} XP Rewards`
: "🎉 Congratulations!youCompletedAllGetting StartedTask!"}
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
 Completed
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
 <h2 className="page-panel-title">NextSuggestion</h2>
 <p className="page-panel-description">ContinueDonekeyConfig</p>
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
 <Link href={nextStep.href}>ContinueTask</Link>
 </Button>
 <Button
 asChild
 variant="outline"
 size="sm"
 className="border-border-muted text-foreground-light"
 >
 <Link href="/dashboard/learn">ViewLearnResource</Link>
 </Button>
 </div>
 </div>
 ) : (
 <div className="rounded-md border border-brand-400/40 bg-brand-200/30 p-4 text-sm text-foreground">
 🎉 youCompletedallsectionGetting StartedTask, SuggestionBrowseTemplate GalleryorImproveAccountSettings.
 <div className="mt-3 flex items-center gap-2">
 <Button asChild size="sm" variant="outline-primary">
 <Link href="/dashboard/template-gallery">BrowseTemplate</Link>
 </Button>
 <Button
 asChild
 size="sm"
 variant="outline"
 className="border-border-muted text-foreground-light"
 >
 <Link href="/dashboard/settings">AccountSettings</Link>
 </Button>
 </div>
 </div>
 )}
 <div className="flex items-center gap-2 text-xs text-foreground-muted">
 <Clock className="w-4 h-4" />
 AverageDonetime 20 min
 </div>
 </div>
 </div>

 <div className="page-panel">
 <div className="page-panel-header flex items-center gap-3">
 <div className="p-2 rounded-md bg-surface-200">
 <BookOpen className="w-4 h-4 text-foreground-light" />
 </div>
 <div>
 <h2 className="page-panel-title">QuickEntry</h2>
 <p className="page-panel-description">useConfigandResource</p>
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
 <h2 className="page-panel-title">ExploreFeatures</h2>
 <p className="page-panel-description">
 fromCoreModuleStartBuildAutomation
 </p>
 </div>
 </div>
 <Badge
 variant="secondary"
 className="bg-surface-200 text-foreground-light"
 >
 {features.length} Module
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
 NowExperience
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
 <h2 className="page-panel-title">LearnResource</h2>
 <p className="page-panel-description">
 faceScenario'sLearnPathandDocument
 </p>
 </div>
 </div>
 <Badge
 variant="secondary"
 className="bg-surface-200 text-foreground-light"
 >
 {learningResources.length} Resource
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
 <h2 className="page-panel-title">Shortcutkey</h2>
 <p className="page-panel-description">
 Improverate'suseAction
 </p>
 </div>
 </div>
 <div className="p-6 space-y-3 text-sm">
 <div className="flex items-center justify-between">
 <span className="text-foreground-light">OpenCommandPanel</span>
 <kbd className="px-2 py-1 rounded-md bg-surface-200 text-foreground-muted text-xs">
 ⌘ K
 </kbd>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-foreground-light">CreateConversation</span>
 <kbd className="px-2 py-1 rounded-md bg-surface-200 text-foreground-muted text-xs">
 ⌘ N
 </kbd>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-foreground-light">CreateWorkflow</span>
 <kbd className="px-2 py-1 rounded-md bg-surface-200 text-foreground-muted text-xs">
 ⌘ W
 </kbd>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-foreground-light">FocusInput</span>
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
 InviteFriends
 </h3>
 <p className="text-xs text-foreground-light mb-4">
 InviteFriendsSign Up, methodObtain 1000 timesFree API Call
 </p>
 <Button
 asChild
 size="sm"
 className="bg-brand-500 hover:bg-brand-600 text-background"
 >
 <Link href="/dashboard/team">
 NowInvite
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
 needneedHelp?
 </h3>
 <p className="text-xs text-foreground-light mb-4">
 ifresultyouatUsagepasttoIssue, canwithAccessLearncenterorSubmitFeedback.
 </p>
 <div className="flex items-center justify-center gap-3">
 <Button
 asChild
 variant="outline"
 size="sm"
 className="border-border-muted text-foreground-light"
 >
 <Link href="/dashboard/learn">
 <BookOpen className="w-4 h-4 mr-2" />
 Learncenter
 </Link>
 </Button>
 <Button
 asChild
 variant="outline"
 size="sm"
 className="border-border-muted text-foreground-light"
 >
 <Link href="/dashboard/feedback">
 <MessageSquare className="w-4 h-4 mr-2" />
 SubmitFeedback
 </Link>
 </Button>
 </div>
 </div>
 </div>
 </div>
 );
}
