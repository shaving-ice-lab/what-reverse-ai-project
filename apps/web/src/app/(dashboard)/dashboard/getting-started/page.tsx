"use client";

/**
 * Quick Getting Started / Guide Page - Supabase Style
 * New User Tasks, Progress, Resources and Shortcut Entries
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
 title: "Start Your First Conversation",
 description: "Have your first conversation with AI and experience the assistant",
 icon: MessageSquare,
 href: "/dashboard/conversations",
 completed: true,
 points: 50,
 },
 {
 id: "workflow",
 title: "Create a Workflow",
 description: "Create your first automation workflow to improve productivity",
 icon: Zap,
 href: "/dashboard/workflows/new",
 completed: true,
 points: 100,
 },
 {
 id: "agent",
 title: "Create AI Agent",
 description: "Customize your own exclusive AI assistant",
 icon: Bot,
 href: "/dashboard/my-agents/new",
 completed: false,
 points: 150,
 },
 {
 id: "upload",
 title: "Upload file to knowledge base",
 description: "Upload documents and let AI answer based on your data",
 icon: Upload,
 href: "/dashboard/files",
 completed: false,
 points: 100,
 },
 {
 id: "api-key",
 title: "Add API Key",
 description: "Configure your AI model API key",
 icon: Key,
 href: "/dashboard/settings/api-keys",
 completed: false,
 points: 75,
 },
 {
 id: "invite",
 title: "Invite Team Members",
 description: "Invite colleagues to collaborate together",
 icon: Users,
 href: "/dashboard/team",
 completed: false,
 points: 200,
 },
];

// Features
const features = [
 {
 title: "AI Smart Conversation",
 description: "Connect multiple models for stable output results",
 icon: MessageSquare,
 color: "text-brand-500",
 bgColor: "bg-brand-200/60",
 tag: "Core",
 href: "/dashboard/conversations",
 },
 {
 title: "Workflow Automation",
 description: "Visual orchestration with automatic execution of complex flows",
 icon: Zap,
 color: "text-warning",
 bgColor: "bg-warning-200/60",
 tag: "Automation",
 href: "/dashboard/workflows",
 },
 {
 title: "AI Agent",
 description: "Build exclusive agents to cover vertical scenarios",
 icon: Bot,
 color: "text-brand-500",
 bgColor: "bg-brand-200/60",
 tag: "Agent",
 href: "/dashboard/my-agents",
 },
 {
 title: "Knowledge Base",
 description: "Manage and use knowledge for quick content retrieval",
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
 title: "5-Minute Quick Start",
 description: "Master core workflows and unlock powerful features",
 icon: Play,
 duration: "5 min",
 type: "video",
 href: "/dashboard/learn",
 },
 {
 title: "Workflow Creation Guide",
 description: "Start building your first flow from a template",
 icon: BookOpen,
 duration: "10 min",
 type: "tutorial",
 href: "/dashboard/workflows",
 },
 {
 title: "API Integration Docs",
 description: "Configure keys and complete API integration",
 icon: FileText,
 duration: "15 min",
 type: "docs",
 href: "/dashboard/settings/api-keys",
 },
 {
 title: "Best Practices & Case Studies",
 description: "Explore efficient automation",
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
 label: "Completed Tasks",
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
 label: "Remaining Rewards",
 value: `${remainingPoints} XP`,
 icon: Sparkles,
 tone: "brand" as const,
 },
 {
 id: "time",
 label: "Estimated Time",
 value: " 20 min",
 icon: Clock,
 tone: "neutral" as const,
 },
 ];

 const quickLinks = [
 {
 id: "docs",
 title: "Learning Center",
 description: "Quick start guides and best practices",
 icon: BookOpen,
 href: "/dashboard/learn",
 },
 {
 id: "api",
 title: "API Key",
 description: "Configure models and API keys",
 icon: Key,
 href: "/dashboard/settings/api-keys",
 },
 {
 id: "templates",
 title: "Template Gallery",
 description: "Start automation from templates",
 icon: FileText,
 href: "/dashboard/template-gallery",
 },
 {
 id: "team",
 title: "Team Collaboration",
 description: "Invite members to collaborate",
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
 Quick Start Guide
 </h1>
 <p className="page-description">
 Complete key config to unlock ReverseAI automation
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
 View Docs
 </Link>
 </Button>
 <Button
 asChild
 size="sm"
 className="bg-brand-500 hover:bg-brand-600 text-background"
 >
 <Link href="/dashboard/conversations">
 <Play className="w-4 h-4 mr-2" />
 Start Guide
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
 <h2 className="page-panel-title">Getting Started Tasks</h2>
 <p className="page-panel-description">
 Complete key steps to unlock all features
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
 Getting Started Progress
 </span>
 <span className="text-xs text-foreground-muted">
 {Math.round(progressPercentage)}%
 </span>
 </div>
 <Progress value={progressPercentage} size="sm" className="mt-3" />
 <p className="text-xs text-foreground-light mt-3">
 {progressPercentage < 100
 ? `Complete all steps to earn ${remainingPoints} XP rewards`
: "🎉 Congratulations! You've completed all getting started tasks!"}
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
 <h2 className="page-panel-title">Next steps</h2>
 <p className="page-panel-description">Continue with key configuration</p>
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
 <Link href={nextStep.href}>Continue</Link>
 </Button>
 <Button
 asChild
 variant="outline"
 size="sm"
 className="border-border-muted text-foreground-light"
 >
 <Link href="/dashboard/learn">View learning resources</Link>
 </Button>
 </div>
 </div>
 ) : (
 <div className="rounded-md border border-brand-400/40 bg-brand-200/30 p-4 text-sm text-foreground">
 🎉 You've completed all getting started tasks! We suggest browsing the Template Gallery or updating your Account Settings.
 <div className="mt-3 flex items-center gap-2">
 <Button asChild size="sm" variant="outline-primary">
 <Link href="/dashboard/template-gallery">Browse Templates</Link>
 </Button>
 <Button
 asChild
 size="sm"
 variant="outline"
 className="border-border-muted text-foreground-light"
 >
 <Link href="/dashboard/settings">Account Settings</Link>
 </Button>
 </div>
 </div>
 )}
 <div className="flex items-center gap-2 text-xs text-foreground-muted">
 <Clock className="w-4 h-4" />
 Average completion time ~20 min
 </div>
 </div>
 </div>

 <div className="page-panel">
 <div className="page-panel-header flex items-center gap-3">
 <div className="p-2 rounded-md bg-surface-200">
 <BookOpen className="w-4 h-4 text-foreground-light" />
 </div>
 <div>
 <h2 className="page-panel-title">Quick Links</h2>
 <p className="page-panel-description">Configuration and resources</p>
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
 <h2 className="page-panel-title">Explore Features</h2>
 <p className="page-panel-description">
 Start building automation from core modules
 </p>
 </div>
 </div>
 <Badge
 variant="secondary"
 className="bg-surface-200 text-foreground-light"
 >
 {features.length} Modules
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
 Try Now
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
 <h2 className="page-panel-title">Learning Resources</h2>
 <p className="page-panel-description">
 Scenario-based learning paths and docs
 </p>
 </div>
 </div>
 <Badge
 variant="secondary"
 className="bg-surface-200 text-foreground-light"
 >
 {learningResources.length} Resources
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
 <h2 className="page-panel-title">Keyboard Shortcuts</h2>
 <p className="page-panel-description">
 Boost your productivity with shortcuts
 </p>
 </div>
 </div>
 <div className="p-6 space-y-3 text-sm">
 <div className="flex items-center justify-between">
 <span className="text-foreground-light">Open command panel</span>
 <kbd className="px-2 py-1 rounded-md bg-surface-200 text-foreground-muted text-xs">
 ⌘ K
 </kbd>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-foreground-light">New conversation</span>
 <kbd className="px-2 py-1 rounded-md bg-surface-200 text-foreground-muted text-xs">
 ⌘ N
 </kbd>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-foreground-light">New workflow</span>
 <kbd className="px-2 py-1 rounded-md bg-surface-200 text-foreground-muted text-xs">
 ⌘ W
 </kbd>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-foreground-light">Focus input</span>
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
 Invite Friends
 </h3>
 <p className="text-xs text-foreground-light mb-4">
 Invite friends to sign up and get 1,000 free API calls
 </p>
 <Button
 asChild
 size="sm"
 className="bg-brand-500 hover:bg-brand-600 text-background"
 >
 <Link href="/dashboard/team">
 Invite Now
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
 Need Help?
 </h3>
 <p className="text-xs text-foreground-light mb-4">
 If you encounter any issues, visit the Learning Center or submit feedback.
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
 Learning Center
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
 Submit Feedback
 </Link>
 </Button>
 </div>
 </div>
 </div>
 </div>
 );
}
